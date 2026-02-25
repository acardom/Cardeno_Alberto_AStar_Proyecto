"""
@author: Alberto Cárdeno Domínguez
@description: Este es el "cerebro" que controla el juego. 
Se encarga de crear salas, meter a los jugadores y decir quién ha ganado.
"""

from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room
from logic.astar import a_star
import os
from dotenv import load_dotenv

# Cargamos el archivo .env para leer la configuración
load_dotenv()

# CONFIGURACIÓN INICIAL

app = Flask(__name__)

# La SECRET_KEY es como una contraseña maestra para que el servidor sea seguro. 
# La leemos del .env para no dejarla escrita en el código.
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'secret!')

# SocketIO es lo que permite que el servidor y el jugador hablen.
# El origen (CORS) también lo leemos del .env.
allowed_origins = os.getenv('ALLOWED_ORIGINS', '*')
socketio = SocketIO(app, cors_allowed_origins=allowed_origins)

# GAME CONSTANTS (Configurables desde .env)
GRID_HALF_SIZE = int(os.getenv('GRID_HALF_SIZE', 10))

# ==========================
# EL ARCHIVADOR (La memoria)
# ==========================
# 'rooms' es un diccionario donde guardaremos los datos de cada partida.
rooms = {}

# =======
# EVENTOS
# =======

# Detectar salas libres
@socketio.on('get_rooms')
def on_get_rooms():
    room_list = []
    # Miramos en nuestro archivador y hacemos una lista de las salas
    for room_id, data in rooms.items():
        room_list.append({
            'name': room_id,
            'players': len(data['players'])
        })
    # Enviamos la lista de salas
    emit('room_list', room_list, broadcast=True)

# Entrar en una sala
@socketio.on('join')
def on_join(data):
    room = data['room']
    name = data.get('username', f'Player_{request.sid[:4]}') # Si no tiene nombre, le inventamos uno
    
    # Si la sala no existe en el archivador, la creamos
    if room not in rooms:
        rooms[room] = {'players': {}}
    
    # Solo dejamos entrar si hay menos de 2 personas
    if len(rooms[room]['players']) < 2:
        join_room(room) # El servidor mete al jugador en la sala
        player_index = len(rooms[room]['players']) # ¿Eres el primero o el segundo?
        
        # Guardamos su "ficha de jugador"
        rooms[room]['players'][request.sid] = {
            'name': name,
            'grid': None,       # Su mapa 
            'my_start': None,   # Dónde empieza
            'opp_end': None,    # Dónde tiene que llegar
            'ready': False,     # Listo para jugar
            'side': player_index 
        }
        
        # Avisamos a la sala de que alguien se ha unido
        emit('player_joined', {'count': len(rooms[room]['players']), 'side': player_index, 'name': name}, room=room)
        # Le decimos al jugador qué lado le corresponde
        emit('side_assignment', {'side': player_index}, room=request.sid)
        on_get_rooms() 
    else:
        # Si ya hay dos jugadores, le decimos que la sala está llena
        emit('error', {'message': 'Sala llena'})

# Gestionar desconexión (importante para limpiar la memoria)
# Esto salta solo cuando un jugador pierde la conexión
@socketio.on('disconnect')
def on_disconnect():
    # 'sid' id único del jugador
    sid = request.sid
    
    # Variable para borrar la sala si se queda vacía
    room_to_delete = None
    
    # 1. BUSCAR AL JUGADOR: Vamos sala por sala
    # Usamos list(rooms.items()) 
    for room_id, data in list(rooms.items()):
        
        # ¿Está este jugador en esta sala?
        if sid in data['players']:
            player_name = data['players'][sid]['name']
            
            # ¡Lo encontramos! Ahora lo borramos de la ficha de la sala
            del data['players'][sid]
            print(f"El jugador {player_name} se ha ido.")

            # Esta la sala vacía?
            if len(data['players']) == 0:
                # Si no queda nadie decimos que esta vacía
                room_to_delete = room_id
            else:
                # Si todavía queda otro jugador, le avisamos
                emit('player_left', {'name': player_name}, room=room_id)
            
            # Como ya lo encontramos, dejamos de buscar en otras salas
            break
    
    # Si la sala se quedó vacía, la borramos del archivador global
    if room_to_delete in rooms:
        del rooms[room_to_delete]
        print(f"Sala {room_to_delete} borrada porque no queda nadie.")
    
    # Actualizamos la lista de salas
    on_get_rooms()

# ====================================
# EL MOMENTO DE LA VERDAD (El cálculo)
# ====================================

# Cuando un jugador está listo para jugar
@socketio.on('player_ready')
def on_player_ready(data):
    room = data.get('room')
    
    if not room or room not in rooms:
        emit('error', {'message': 'Sala no encontrada'})
        return

    # Guardamos los datos que nos envía
    if request.sid in rooms[room]['players']:
        rooms[room]['players'][request.sid].update({
            'grid': data.get('grid'),
            'my_start': tuple(data['myStart']) if data.get('myStart') else None,
            'opp_end': tuple(data['oppEnd']) if data.get('oppEnd') else None,
            'ready': True
        })
        
        players = rooms[room]['players']
        
        # Los dos jugadores están listos
        if len(players) == 2 and all(p['ready'] for p in players.values()):
            try:
                # Separamos quién es el de la izquierda (Side 0) y quién el de la derecha (Side 1)
                p1 = next(p for p in players.values() if p['side'] == 0)
                p2 = next(p for p in players.values() if p['side'] == 1)

                # Juntamos los dos mapas en uno solo (el mapa completo del juego)
                full_grid = []
                for r in range(len(p1['grid'])):
                    # Usamos el GRID_HALF_SIZE configurable
                    row = p1['grid'][r][:GRID_HALF_SIZE] + p2['grid'][r][GRID_HALF_SIZE:]
                    full_grid.append(row)
                
                # Le pedimos al algoritmo "A*" que busque el camino más corto
                path1 = a_star(full_grid, p1['my_start'], p2['opp_end'])
                path2 = a_star(full_grid, p2['my_start'], p1['opp_end'])
                
                # Comparamos quién ha llegado en menos pasos
                steps1 = len(path1) if path1 else float('inf')
                steps2 = len(path2) if path2 else float('inf')
                
                if steps1 < steps2: winner = p1['name']
                elif steps2 < steps1: winner = p2['name']
                else: winner = "Tie" # El frontend espera "Tie" para el empate

                # Enviamos el resultado completo para que React pueda revelarlo todo
                emit('game_result', {
                    'winner': winner,
                    'fullGrid': full_grid,
                    'p1Start': p1['my_start'],
                    'p1End': p2['opp_end'],
                    'p2Start': p2['my_start'],
                    'p2End': p1['opp_end'],
                    'results': {
                        'p1': {'name': p1['name'], 'path': path1},
                        'p2': {'name': p2['name'], 'path': path2}
                    }
                }, room=room)
                
                # Reiniciamos el estado de "listo" para la siguiente partida
                for p in players.values():
                    p['ready'] = False

            except Exception as e:
                emit('error', {'message': f'Error en el cálculo: {str(e)}'})
        else:
            emit('waiting_for_opponent', room=room)

# EL ARRANQUE
if __name__ == '__main__':
    # Esto busca un puerto libre (como un canal de TV) para emitir el juego.
    # Por defecto es el 5000, o lo que diga el entorno/Render.
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, debug=False, host='0.0.0.0', port=port)