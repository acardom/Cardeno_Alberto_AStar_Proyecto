from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room
from logic.astar import a_star

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# Game state management
rooms = {}

@socketio.on('get_rooms')
def on_get_rooms():
    room_list = []
    for room_id, data in rooms.items():
        room_list.append({
            'name': room_id,
            'players': len(data['players'])
        })
    emit('room_list', room_list)

@socketio.on('join')
def on_join(data):
    room = data['room']
    name = data.get('username', f'Player_{request.sid[:4]}')
    join_room(room)
    
    if room not in rooms:
        rooms[room] = {'players': {}}
    
    if len(rooms[room]['players']) < 2:
        player_index = len(rooms[room]['players'])
        rooms[room]['players'][request.sid] = {
            'name': name,
            'grid': None,
            'start': None,
            'end': None,
            'path': None,
            'ready': False,
            'side': player_index # 0 for Left, 1 for Right
        }
        print(f"Player {name} joined room {room} as Side {player_index}")
        emit('player_joined', {
            'count': len(rooms[room]['players']),
            'side': player_index,
            'name': name
        }, room=room)
        emit('side_assignment', {'side': player_index}, room=request.sid)
        # Broadcast updated room list to everyone in lobby
        on_get_rooms() 
    else:
        emit('error', {'message': 'Room semi-full'})

@socketio.on('player_ready')
def on_player_ready(data):
    room = data['room']
    grid = data['grid']
    my_start = tuple(data['myStart']) if data.get('myStart') else None
    opp_end = tuple(data['oppEnd']) if data.get('oppEnd') else None
    
    if room in rooms and request.sid in rooms[room]['players']:
        rooms[room]['players'][request.sid].update({
            'grid': grid,
            'my_start': my_start,
            'opp_end': opp_end,
            'ready': True
        })
        
        players = rooms[room]['players']
        if len(players) == 2 and all(p['ready'] for p in players.values()):
            p_sids = list(players.keys())
            p1 = next(p for p in players.values() if p['side'] == 0)
            p2 = next(p for p in players.values() if p['side'] == 1)
            
            # Combine grids
            full_grid = []
            for r in range(len(p1['grid'])):
                row = p1['grid'][r][:10] + p2['grid'][r][10:]
                full_grid.append(row)
            
            # Path Logic: 
            # Path 1 (P1): p1.my_start -> p2.opp_end
            # Path 2 (P2): p2.my_start -> p1.opp_end
            
            path1 = a_star(full_grid, p1['my_start'], p2['opp_end'])
            path2 = a_star(full_grid, p2['my_start'], p1['opp_end'])
            
            results = {
                'p1': {'name': p1['name'], 'path': path1, 'steps': len(path1) if path1 else float('inf')},
                'p2': {'name': p2['name'], 'path': path2, 'steps': len(path2) if path2 else float('inf')}
            }
            
            winner = None
            if results['p1']['steps'] < results['p2']['steps']: winner = p1['name']
            elif results['p2']['steps'] < results['p1']['steps']: winner = p2['name']
            else: winner = "Tie"

            emit('game_result', {
                'results': results,
                'winner': winner
            }, room=room)
        else:
            emit('waiting_for_opponent', room=room)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
