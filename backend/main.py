/**
 * @author: Alberto Cárdeno Domínguez
 * @description: Servidor Flask con SocketIO para la gestión de partidas multijugador en tiempo real.
 * Controla el ciclo de vida de las salas, sincronización de estados entre jugadores y 
 * ejecución del algoritmo A* para determinar el camino más corto y el ganador.
 */

from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room
from logic.astar import a_star
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
# Configuración de SocketIO con soporte para CORS (necesario para despliegues externos)
socketio = SocketIO(app, cors_allowed_origins="*")

# ================================
# GESTIÓN DEL ESTADO GLOBAL (RAM)
# ================================
# Diccionario para almacenar la persistencia temporal de las salas y sus jugadores
rooms = {}

# ===========================
# EVENTOS DE SALA Y CONEXIÓN
# ===========================

@socketio.on('get_rooms')
def on_get_rooms():
    """ Envía a todos los clientes la lista de salas activas y su ocupación """
    room_list = []
    for room_id, data in rooms.items():
        room_list.append({
            'name': room_id,
            'players': len(data['players'])
        })
    emit('room_list', room_list, broadcast=True)

@socketio.on('join')
def on_join(data):
    """ Gestiona la entrada de jugadores a una sala con límite de 2 usuarios """
    room = data['room']
    name = data.get('username', f'Player_{request.sid[:4]}')
    
    if room not in rooms:
        rooms[room] = {'players': {}}
    
    if len(rooms[room]['players']) < 2:
        join_room(room)
        player_index = len(rooms[room]['players'])
        
        # Inicialización del perfil del jugador en el estado de la sala
        rooms[room]['players'][request.sid] = {
            'name': name,
            'grid': None,
            'my_start': None,
            'opp_end': None,
            'path': None,
            'ready': False,
            'side': player_index # 0: Izquierda, 1: Derecha
        }
        
        print(f"Player {name} ({request.sid}) joined room {room} as Side {player_index}")
        
        # Notificaciones de actualización de estado
        emit('player_joined', {
            'count': len(rooms[room]['players']),
            'side': player_index,
            'name': name
        }, room=room)
        
        emit('side_assignment', {'side': player_index}, room=request.sid)
        on_get_rooms() 
    else:
        emit('error', {'message': 'Room full'})

@socketio.on('disconnect')
def on_disconnect():
    """ Limpieza de datos al desconectarse un cliente y eliminación de salas vacías """
    sid = request.sid
    room_to_delete = None
    
    for room_id, data in list(rooms.items()):
        if sid in data['players']:
            player_name = data['players'][sid]['name']
            del data['players'][sid]
            print(f"Player {player_name} left room {room_id}")
            
            if len(data['players']) == 0:
                room_to_delete = room_id
            else:
                emit('player_left', {'name': player_name}, room=room_id)
            break
    
    if room_to_delete and room_to_delete in rooms:
        del rooms[room_to_delete]
        print(f"Room {room_to_delete} deleted (empty)")
    
    on_get_rooms()

# =====================================
# LÓGICA DE JUEGO Y PROCESAMIENTO A*
# =====================================

@socketio.on('player_ready')
def on_player_ready(data):
    """ 
    Recibe la configuración del mapa de un jugador. 
    Cuando ambos están listos, fusiona los mapas y calcula resultados.
    """
    room = data.get('room')
    grid = data.get('grid')
    my_start = tuple(data['myStart']) if data.get('myStart') else None
    opp_end = tuple(data['oppEnd']) if data.get('oppEnd') else None
    
    if not room or room not in rooms:
        emit('error', {'message': 'Sala no encontrada'})
        return

    if request.sid in rooms[room]['players']:
        rooms[room]['players'][request.sid].update({
            'grid': grid,
            'my_start': my_start,
            'opp_end': opp_end,
            'ready': True
        })
        
        players = rooms[room]['players']
        
        # Verificación de inicio: ¿Están ambos jugadores listos?
        if len(players) == 2 and all(p['ready'] for p in players.values()):
            try:
                # Identificación de roles por lado
                p1 = next(p for p in players.values() if p['side'] == 0)
                p2 = next(p for p in players.values() if p['side'] == 1)
                
                if not p1['grid'] or not p2['grid']:
                    raise ValueError("Grid datos perdidos")

                # FUSIÓN DE GRIDS: Combina la mitad izquierda de P1 con la derecha de P2
                full_grid = []
                for r in range(len(p1['grid'])):
                    row = p1['grid'][r][:10] + p2['grid'][r][10:]
                    full_grid.append(row)
                
                # CÁLCULO DE RUTAS mediante A-Star
                path1 = a_star(full_grid, p1['my_start'], p2['opp_end'])
                path2 = a_star(full_grid, p2['my_start'], p1['opp_end'])
                
                results = {
                    'p1': {'name': p1['name'], 'path': path1, 'steps': len(path1) if path1 else float('inf')},
                    'p2': {'name': p2['name'], 'path': path2, 'steps': len(path2) if path2 else float('inf')}
                }
                
                # Lógica de determinación de ganador
                winner = None
                if results['p1']['steps'] < results['p2']['steps']: winner = p1['name']
                elif results['p2']['steps'] < results['p1']['steps']: winner = p2['name']
                else: winner = "Tie"

                # Envío de resultados finales a la sala
                emit('game_result', {
                    'results': results,
                    'winner': winner,
                    'fullGrid': full_grid,
                    'p1Start': p1['my_start'],
                    'p1End': p2['opp_end'],
                    'p2Start': p2['my_start'],
                    'p2End': p1['opp_end']
                }, room=room)
                
                # Reset del estado 'ready' para permitir revanchas
                for p in players.values():
                    p['ready'] = False
            except Exception as e:
                print(f"Error en procesamiento: {e}")
                emit('error', {'message': f'Error en el cálculo: {str(e)}'}, room=room)
        else:
            emit('waiting_for_opponent', room=room)

# ===============================
# ENTRADA PRINCIPAL DEL SISTEMA
# ===============================
if __name__ == '__main__':
    # Configuración dinámica del puerto para despliegues en la nube (PaaS)
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, debug=False, host='0.0.0.0', port=port)