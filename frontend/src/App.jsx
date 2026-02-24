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
  const [myStart, setMyStart] = useState(null);
  const [oppEnd, setOppEnd] = useState(null);
  const [myPath, setMyPath] = useState([]);
  const [opponentPath, setOpponentPath] = useState([]);
  const [winner, setWinner] = useState(null);

  // Posiciones completas reveladas por el servidor al final
  const [p1Start, setP1Start] = useState(null);
  const [p1End, setP1End] = useState(null);
  const [p2Start, setP2Start] = useState(null);
  const [p2End, setP2End] = useState(null);

  const [mode, setMode] = useState('wall');
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Coloca tu inicio, el fin del rival y tus muros');
  const [side, setSide] = useState(null);
  const [wallCount, setWallCount] = useState(0);
  const [opponentName, setOpponentName] = useState('Esperando...');

  useEffect(() => {
    socket.emit('get_rooms');

    socket.on('connect', () => {
      console.log('Conectado al servidor. ID:', socket.id);
    });

    socket.on('error', (data) => {
      alert(`Error: ${data.message}`);
      setReady(false);
      setStatus(`Error: ${data.message}`);
    });

    socket.on('room_list', (rooms) => {
      setAvailableRooms(rooms);
    });

    socket.on('side_assignment', (data) => {
      setSide(data.side);
      setIsJoined(true);
    });

    socket.on('player_joined', (data) => {
      if (data.name !== username) setOpponentName(data.name);
      setStatus(`Jugadores en sala: ${data.count}/2`);
    });

    socket.on('waiting_for_opponent', () => {
      setStatus('✅ Listo! Esperando al rival...');
    });

    socket.on('game_result', (data) => {
      const p1 = data.results.p1;
      const p2 = data.results.p2;
      const me = p1.name === username ? p1 : p2;
      const them = p1.name === username ? p2 : p1;

      setMyPath(me.path || []);
      setOpponentPath(them.path || []);
      setWinner(data.winner);

      // Revelar todo el mapa
      setGrid(data.fullGrid);
      setP1Start(data.p1Start);
      setP1End(data.p1End);
      setP2Start(data.p2Start);
      setP2End(data.p2End);

      setStatus(
        data.winner === username
          ? '🏆 ¡HAS GANADO!'
          : data.winner === 'Tie'
            ? '🤝 ¡EMPATE!'
            : `❌ ¡HAS PERDIDO! (${data.winner} ganó)`
      );
    });

    return () => {
      socket.off('connect');
      socket.off('error');
      socket.off('room_list');
      socket.off('side_assignment');
      socket.off('player_joined');
      socket.off('waiting_for_opponent');
      socket.off('game_result');
    };
  }, [username]);

  const joinGame = (roomName) => {
    if (username.trim()) {
      const actualRoom = roomName || room;
      setRoom(actualRoom);
      socket.emit('join', { room: actualRoom, username });
    } else {
      alert('¡Introduce tu nombre primero!');
    }
  };

  const handleCellClick = (row, col) => {
    if (ready || winner) return;
    const isMyHalf = side === 0 ? col < 10 : col >= 10;
    if (!isMyHalf) return;

    if (mode === 'myStart') {
      if (grid[row][col] === 1) return;
      if (oppEnd && row === oppEnd[0] && col === oppEnd[1]) return;
      setMyStart([row, col]);
      return;
    }

    if (mode === 'oppEnd') {
      if (grid[row][col] === 1) return;
      if (myStart && row === myStart[0] && col === myStart[1]) return;
      setOppEnd([row, col]);
      return;
    }

    if (myStart && row === myStart[0] && col === myStart[1]) return;
    if (oppEnd && row === oppEnd[0] && col === oppEnd[1]) return;

    const newGrid = grid.map(r => [...r]);
    if (newGrid[row][col] === 1) {
      newGrid[row][col] = 0;
      setWallCount(prev => prev - 1);
    } else {
      if (wallCount >= MAX_WALLS) {
        alert(`Límite de muros alcanzado (${MAX_WALLS})!`);
        return;
      }
      newGrid[row][col] = 1;
      setWallCount(prev => prev + 1);
    }
    setGrid(newGrid);
  };

  const checkPathToMidline = (startPos, currentGrid, isSide0) => {
    if (!startPos) return false;
    const queue = [startPos];
    const visited = new Set();
    visited.add(`${startPos[0]}-${startPos[1]}`);

    while (queue.length > 0) {
      const [r, c] = queue.shift();

      // Condición de éxito: alcanzar la línea media
      // Si soy Side 0 (izquierda), la línea media es la columna 9 -> 10
      // Si soy Side 1 (derecha), la línea media es la columna 10 -> 9
      if (isSide0 && c === 9) return true;
      if (!isSide0 && c === 10) return true;

      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1], // Cardinales
        [r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1] // Diagonales
      ];

      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          // Solo buscar en mi mitad
          const isMyHalf = isSide0 ? nc < 10 : nc >= 10;
          const key = `${nr}-${nc}`;
          if (isMyHalf && currentGrid[nr][nc] === 0 && !visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }
    }
    return false;
  };

  const handleReady = () => {
    if (!myStart) { alert('¡Pon tu punto de inicio primero!'); return; }
    if (!oppEnd) { alert('¡Pon el punto final del rival primero!'); return; }

    // Validación de bloqueo
    const isSide0 = side === 0;
    const canStartReachMid = checkPathToMidline(myStart, grid, isSide0);
    const canEndReachMid = checkPathToMidline(oppEnd, grid, isSide0);

    if (!canStartReachMid || !canEndReachMid) {
      const blocked = !canStartReachMid ? 'Tu punto de inicio' : 'El destino del rival';
      alert(`⚠️ ¡Error! ${blocked} está bloqueado por muros. Debes dejar un camino libre hacia el centro del tablero.`);
      return;
    }

    setReady(true);
    setStatus('Listo! Esperando al rival...');
    socket.emit('player_ready', { room, grid, myStart, oppEnd });
  };

  const resetGame = () => {
    setGrid(createEmptyGrid());
    setMyStart(null);
    setOppEnd(null);
    setP1Start(null);
    setP1End(null);
    setP2Start(null);
    setP2End(null);
    setMyPath([]);
    setOpponentPath([]);
    setWinner(null);
    setReady(false);
    setWallCount(0);
    setStatus('Coloca tu inicio, el fin del rival y tus muros');
    setMode('wall');
  };

  if (!isJoined) {
    return (
      <div className="lobby-container">
        <div className="lobby-card">
          <h1>A* 1vs1 Lobby</h1>
          <input
            type="text"
            placeholder="Tu nombre"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && joinGame()}
            required
          />
          <div className="room-section">
            <div className="room-input-group">
              <input
                type="text"
                placeholder="Nombre de sala"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
              <button onClick={() => joinGame()}>Crear</button>
            </div>
            <div className="room-list">
              <h3>Salas activas</h3>
              {availableRooms.length === 0 ? <p>No hay salas. ¡Crea una!</p> : (
                availableRooms.map(r => (
                  <div key={r.name} className="room-item">
                    <span>{r.name} ({r.players}/2)</span>
                    <button disabled={r.players >= 2} onClick={() => joinGame(r.name)}>Unirse</button>
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
      <header className="app-header">
        <h1>A* 1vs1 Race</h1>
        <div className="players-info">
          <span className={side === 0 ? 'me' : ''}>{side === 0 ? username : opponentName}</span>
          <span className="vs">VS</span>
          <span className={side === 1 ? 'me' : ''}>{side === 1 ? username : opponentName}</span>
        </div>
        <p className={`status ${winner ? 'winner-bright' : ''}`}>{status}</p>
        {winner && <button className="play-again-btn" onClick={resetGame}>🔄 Nueva Partida</button>}
      </header>

      <main className="game-area">
        <div className="controls">
          <div className="stat-pill">Muros: {wallCount}/{MAX_WALLS}</div>
          <button className={mode === 'myStart' ? 'active mode-start' : 'mode-start'} disabled={ready || winner} onClick={() => setMode('myStart')}>🟢 Mi inicio</button>
          <button className={mode === 'oppEnd' ? 'active mode-end' : 'mode-end'} disabled={ready || winner} onClick={() => setMode('oppEnd')}>🔴 Fin rival</button>
          <button className={mode === 'wall' ? 'active' : ''} disabled={ready || winner} onClick={() => setMode('wall')}>🧱 Muros</button>
          <button className="ready-btn" disabled={ready || !myStart || !oppEnd || winner} onClick={handleReady}>{ready ? '✅ Listo' : '🚀 ¡Listo!'}</button>
        </div>

        <div className="legend">
          <div className="legend-item"><span className="dot myPath"></span> Tu camino</div>
          <div className="legend-item"><span className="dot oppPath"></span> Camino rival</div>
          {winner && (
            <>
              <div className="legend-item"><span className="dot p1Start"></span> Inicio P1</div>
              <div className="legend-item"><span className="dot p2Start"></span> Inicio P2</div>
            </>
          )}
        </div>

        <div className="mode-hint">
          {mode === 'myStart' && !winner && <span>🟢 Haz click en tu mitad para colocar tu punto de inicio</span>}
          {mode === 'oppEnd' && !winner && <span>🔴 Haz click en tu mitad para definir el destino del rival</span>}
          {mode === 'wall' && !winner && <span>🧱 Haz click para colocar/quitar muros en tu mitad</span>}
          {winner && <span>🏁 ¡Partida terminada! Puedes ver todos los obstáculos y puntos especiales.</span>}
        </div>

        <div className="board-container">
          <div className="player-board">
            <h2>{side === 0 ? '⬅ Tu lado' : '➡ Tu lado'} | {side === 1 ? '⬅ Lado rival' : '➡ Lado rival'}</h2>
            <Board
              grid={grid}
              myStart={myStart}
              oppEnd={oppEnd}
              p1Start={p1Start}
              p1End={p1End}
              p2Start={p2Start}
              p2End={p2End}
              path={myPath}
              opponentPath={opponentPath}
              side={side}
              onCellClick={handleCellClick}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
