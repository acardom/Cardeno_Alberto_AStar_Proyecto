import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Board from './components/Board';
import './App.css';

const socket = io('http://localhost:5000');
const GRID_SIZE = 20;
const MAX_WALLS = 15;

const createEmptyGrid = () => Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));

function App() {
  const [isJoined, setIsJoined] = useState(false);
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('match-1');
  const [availableRooms, setAvailableRooms] = useState([]);

  const [grid, setGrid] = useState(createEmptyGrid());
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [myPath, setMyPath] = useState([]);
  const [opponentPath, setOpponentPath] = useState([]);
  const [winner, setWinner] = useState(null);
  const [mode, setMode] = useState('wall');
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Build your defense!');
  const [side, setSide] = useState(null);
  const [wallCount, setWallCount] = useState(0);
  const [opponentName, setOpponentName] = useState('Waiting...');

  useEffect(() => {
    // Fetch rooms on mount
    socket.emit('get_rooms');

    socket.on('room_list', (rooms) => {
      setAvailableRooms(rooms);
    });

    socket.on('side_assignment', (data) => {
      setSide(data.side);
      // Auto-set Start/End based on side to ensure symmetrical race
      if (data.side === 0) { // Left
        setStart([0, 0]);
        setEnd([19, 9]);
      } else { // Right
        setStart([0, 10]);
        setEnd([19, 19]);
      }
      setIsJoined(true);
    });

    socket.on('player_joined', (data) => {
      if (data.name !== username) setOpponentName(data.name);
      setStatus(`Players in room: ${data.count}`);
    });

    socket.on('game_result', (data) => {
      const myRes = data.results[socket.id];
      const otherSid = Object.keys(data.results).find(id => id !== socket.id);
      const otherRes = data.results[otherSid];

      setMyPath(myRes.path || []);
      setOpponentPath(otherRes.path || []);
      setWinner(data.winner);
      setStatus(data.winner === username ? '🏆 YOU WIN!' : (data.winner === 'Tie' ? '🤝 IT\'S A TIE!' : '❌ YOU LOST!'));
    });

    return () => {
      socket.off('room_list');
      socket.off('side_assignment');
      socket.off('player_joined');
      socket.off('game_result');
    };
  }, [username, side]);

  const joinGame = (roomName) => {
    if (username.trim()) {
      socket.emit('join', { room: roomName || room, username });
    } else {
      alert("Please enter a name first!");
    }
  };

  const handleCellClick = (row, col) => {
    if (ready || winner) return;

    // Strict Side Restriction: P1 (side 0) can only edit cols 0-9, P2 (side 1) cols 10-19
    const isMyHalf = side === 0 ? col < 10 : col >= 10;
    if (!isMyHalf) return;

    // Can't put wall on Start or End
    if (start && row === start[0] && col === start[1]) return;
    if (end && row === end[0] && col === end[1]) return;

    if (mode === 'wall') {
      const newGrid = [...grid];
      if (newGrid[row][col] === 1) {
        newGrid[row][col] = 0;
        setWallCount(prev => prev - 1);
      } else {
        if (wallCount >= MAX_WALLS) {
          alert(`Wall limit reached (${MAX_WALLS})!`);
          return;
        }
        newGrid[row][col] = 1;
        setWallCount(prev => prev + 1);
      }
      setGrid(newGrid);
    }
  };

  const handleReady = () => {
    setReady(true);
    setStatus('Ready! waiting...');
    socket.emit('player_ready', { room, grid, start, end });
  };

  if (!isJoined) {
    return (
      <div className="lobby-container">
        <div className="lobby-card">
          <h1>A* 1vs1 Lobby</h1>
          <input
            type="text"
            placeholder="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="room-section">
            <div className="room-input-group">
              <input
                type="text"
                placeholder="New Room Name"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
              <button onClick={() => joinGame()}>Create</button>
            </div>

            <div className="room-list">
              <h3>Active Rooms</h3>
              {availableRooms.length === 0 ? <p>No active rooms. Create one!</p> : (
                availableRooms.map(r => (
                  <div key={r.name} className="room-item">
                    <span>{r.name} ({r.players}/2)</span>
                    <button disabled={r.players >= 2} onClick={() => joinGame(r.name)}>Join</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {winner && (
        <div className="winner-overlay">
          <h1>{winner === 'Tie' ? 'Tie Game!' : (winner === username ? 'You Win!' : `${winner} Wins!`)}</h1>
          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      )}

      <header className="app-header">
        <h1>A* 1vs1 Race</h1>
        <div className="players-info">
          <span className={side === 0 ? 'me' : ''}>{side === 0 ? username : opponentName}</span>
          <span className="vs">VS</span>
          <span className={side === 1 ? 'me' : ''}>{side === 1 ? username : opponentName}</span>
        </div>
        <p className="status">{status}</p>
      </header>

      <main className="game-area">
        <div className="controls">
          <div className="stat-pill">Walls: {wallCount}/{MAX_WALLS}</div>
          <button className="active">🧱 Set Walls</button>
          <button className="ready-btn" disabled={ready} onClick={handleReady}>
            {ready ? '✅ Ready' : '🚀 Ready!'}
          </button>
        </div>

        <div className="board-container">
          <div className="player-board">
            <h2>{side === 0 ? 'Your Side (Left)' : 'Opponent (Left)'} | {side === 1 ? 'Your Side (Right)' : 'Opponent (Right)'}</h2>
            <Board
              grid={grid}
              start={start}
              end={end}
              path={myPath}
              onCellClick={handleCellClick}
            />
          </div>
        </div>
        {opponentPath.length > 0 && (
          <div className="opponent-view">
            <h3>Opponent's Path found: {opponentPath.length} steps</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
