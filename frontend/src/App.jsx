/**
 * @author: Alberto Cárdeno Domínguez
 * @description: Esta es la aplicación principal (Frontend). 
 * Se conecta al servidor mediante WebSockets para gestionar la lógica de las salas,
 * permitir a los jugadores colocar sus muros y mostrar el resultado de la carrera A*.
 */

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Board from './components/Board';
import './App.css';

// ==========================
// CONFIGURACIÓN Y CONSTANTES
// ==========================

const SOCKET_URL = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_BACKEND_URL : 'http://localhost:5000';

const socket = io(SOCKET_URL);
const GRID_SIZE = Number(process.env.REACT_APP_GRID_SIZE || 20);
const MAX_WALLS = Number(process.env.REACT_APP_MAX_WALLS || 15);

const createEmptyGrid = () => Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));

// ==========================
// COMPONENTE PRINCIPAL (APP)
// ==========================
function App() {

  // --- ESTADOS DE LA SALA Y USUARIO ---
  // El "Estado" (useState) es la memoria del programa. Si un estado cambia,
  // la pantalla se actualiza automáticamente para mostrar el nuevo valor.

  const [isJoined, setIsJoined] = useState(false);        // ¿Ya hemos entrado en una partida?
  const [username, setUsername] = useState('');           // El nombre que elijas
  const [room, setRoom] = useState('match-1');            // El nombre de la sala (por defecto match-1)
  const [availableRooms, setAvailableRooms] = useState([]); // Lista de salas que existen ahora mismo

  // --- ESTADOS DEL JUEGO (MAPA Y POSICIONES) ---
  const [grid, setGrid] = useState(createEmptyGrid());    // El dibujo del tablero (donde están los muros)
  const [myStart, setMyStart] = useState(null);           // Posición (fila y columna) de tu punto de inicio
  const [oppEnd, setOppEnd] = useState(null);            // Posición donde quieres que llegue tu rival
  const [myPath, setMyPath] = useState([]);               // Lista de casillas que forman tu camino
  const [opponentPath, setOpponentPath] = useState([]);   // Lista de casillas del camino de tu rival
  const [winner, setWinner] = useState(null);             // Quién ha ganado al final

  // --- REVELACIÓN FINAL ---
  // Al principio no sabemos qué hace el rival, así que estos estados guardan 
  // los datos reales que el servidor nos envía solo cuando la partida termina.
  const [p1Start, setP1Start] = useState(null);
  const [p1End, setP1End] = useState(null);
  const [p2Start, setP2Start] = useState(null);
  const [p2End, setP2End] = useState(null);

  // --- OTROS CONTROLES ---
  const [mode, setMode] = useState('wall');               // ¿Qué estoy haciendo ahora? (poner muros, inicio...)
  const [ready, setReady] = useState(false);              // ¿He pulsado ya el botón de "¡Listo!"?
  const [status, setStatus] = useState('Coloca tu inicio, el fin del rival y tus muros'); // El texto de ayuda arriba
  const [side, setSide] = useState(null);                 // ¿Soy el jugador 0 (izquierda) o el 1 (derecha)?
  const [wallCount, setWallCount] = useState(0);          // Cuántos muros he puesto ya
  const [opponentName, setOpponentName] = useState('Esperando...'); // Nombre de la persona contra la que juegas
  const [showHelp, setShowHelp] = useState(false);        // ¿Está abierta la ventana de ayuda?

  // =========================
  // MODAL DE AYUDA (Tutorial)
  // =========================
  // Esto es una pequeña función que devuelve el código para pintar la ventanita de instrucciones que ves al pulsar el interrogante.
  const HelpModal = () => (
    <div className={`modal-overlay ${showHelp ? 'show' : ''}`} onClick={() => setShowHelp(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>¿Cómo Jugar?</h2>
        <div className="help-steps">
          {/* Cada "step" es un paso de las instrucciones */}
          <div className="step">
            <span className="step-icon">🟢</span>
            <div className="step-text">
              <strong>Punto de Inicio:</strong> Selecciona "Mi inicio" y haz click en tu mitad (izquierda o derecha según te toque) para colocar tu salida.
            </div>
          </div>
          <div className="step">
            <span className="step-icon">🔴</span>
            <div className="step-text">
              <strong>Destino del Rival:</strong> Selecciona "Fin rival" y marca dónde debe llegar el oponente en TU mitad. ¡Pónselo difícil!
            </div>
          </div>
          <div className="step">
            <span className="step-icon">🧱</span>
            <div className="step-text">
              <strong>Muros:</strong> Selecciona "Muros" para colocar hasta 15 obstáculos. No puedes bloquear totalmente el camino al centro.
            </div>
          </div>
          <div className="step">
            <span className="step-icon">🚀</span>
            <div className="step-text">
              <strong>Carrera:</strong> Cuando ambos estén listos, el algoritmo A* calculará el camino más corto. ¡Gana quien llegue primero con menos pasos!
            </div>
          </div>
        </div>
        <button className="close-modal-btn" onClick={() => setShowHelp(false)}>Entendido</button>
      </div>
    </div>
  );

  // ============================
  // COMUNICACIÓN CON EL SERVIDOR
  // ============================
  // El useEffect es una función que se ejecuta una sola vez cuando el programa arranca.
  // Aquí es donde configuramos los "oídos" de la aplicación para escuchar al servidor.
  useEffect(() => {
    // 1. Pedimos la lista de salas que están creadas ahora mismo.
    socket.emit('get_rooms');

    socket.on('connect', () => {
      console.log('Conectado al servidor. ID:', socket.id);
    });

    // 2. Si el servidor nos dice que hay un error, lo mostramos en una alerta.
    socket.on('error', (data) => {
      alert(`Error: ${data.message}`);
      setReady(false);
      setStatus(`Error: ${data.message}`);
    });

    // 3. Cuando el servidor nos envía las salas, las guardamos en la memoria.
    socket.on('room_list', (rooms) => {
      setAvailableRooms(rooms);
    });

    // 4. El servidor nos dice en qué lado del tablero jugamos (izquierda o derecha).
    socket.on('side_assignment', (data) => {
      setSide(data.side);
      if (data.opponentName) setOpponentName(data.opponentName);
      setIsJoined(true);
    });

    // 5. Alguien ha entrado en nuestra sala. Actualizamos el nombre del rival.
    socket.on('player_joined', (data) => {
      // data.names ahora trae los nombres actuales de la sala
      if (data.names) {
        const opponent = data.names.find(n => n !== username);
        if (opponent) setOpponentName(opponent);
      }
      setStatus(`Jugadores en sala: ${data.count}/2`);
    });

    // 6. El servidor nos confirma que hemos pulsado listo.
    socket.on('waiting_for_opponent', () => {
      setStatus('✅ Listo! Esperando al rival...');
    });

    // 7. El servidor ha terminado la carrera y nos da el resultado.
    socket.on('game_result', (data) => {
      const p1 = data.results.p1;
      const p2 = data.results.p2;
      // Buscamos cuál de los dos resultados es el nuestro comparando nombres.
      const me = p1.name === username ? p1 : p2;
      const them = p1.name === username ? p2 : p1;

      // Guardamos los caminos dibujados para que React los pinte.
      setMyPath(me.path || []);
      setOpponentPath(them.path || []);
      setWinner(data.winner);

      // El servidor nos envía el mapa "completo" (el nuestro + el del rival pegados).
      setGrid(data.fullGrid);
      setP1Start(data.p1Start);
      setP1End(data.p1End);
      setP2Start(data.p2Start);
      setP2End(data.p2End);

      // Cambiamos el texto de arriba según si hemos ganado, perdido o empatado.
      setStatus(
        data.winner === username
          ? '🏆 ¡HAS GANADO!'
          : data.winner === 'Tie'
            ? '🤝 ¡EMPATE!'
            : `❌ ¡HAS PERDIDO! (${data.winner} ganó)`
      );
    });

    // Esta parte de "return" es para limpiar los oídos cuando el componente se destruye.
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

  // ====================
  // FUNCIONES DE CONTROL
  // ====================
  // Estas funciones son como "acciones" que ocurren cuando el usuario hace algo.

  // Acción: Pulsar el botón de entrar en una partida.
  const joinGame = (roomName) => {
    if (username.trim()) {
      const actualRoom = roomName || room;
      setRoom(actualRoom);
      // Le mandamos al servidor nuestro nombre y el de la sala elegida.
      socket.emit('join', { room: actualRoom, username });
    } else {
      alert('¡Introduce tu nombre primero!');
    }
  };

  // Acción: Pulsar una casilla del tablero rojo o verde.
  const handleCellClick = (row, col) => {
    // Si ya has pulsado listo o la partida ha terminado, no puedes cambiar nada.
    if (ready || winner) return;

    // Solo puedes tocar casillas que estén en tu mitad del dibujo.
    const isMyHalf = side === 0 ? col < 10 : col >= 10;
    if (!isMyHalf) return;

    // Dependiendo de qué botón de la izquierda tengas pulsado, haremos una cosa u otra:
    if (mode === 'myStart') {
      // Estamos colocando nuestro punto verde de salida.
      if (grid[row][col] === 1) return; // No puedes empezar encima de un muro.
      if (oppEnd && row === oppEnd[0] && col === oppEnd[1]) return; // Ni encima del fin del rival.
      setMyStart([row, col]);
      return;
    }

    if (mode === 'oppEnd') {
      // Estamos marcando dónde queremos que llegue el rival.
      if (grid[row][col] === 1) return;
      if (myStart && row === myStart[0] && col === myStart[1]) return;
      setOppEnd([row, col]);
      return;
    }

    // Si no es ninguna de las anteriores, estamos poniendo o quitando muros (marrón).
    if (myStart && row === myStart[0] && col === myStart[1]) return;
    if (oppEnd && row === oppEnd[0] && col === oppEnd[1]) return;

    const newGrid = grid.map(r => [...r]);
    if (newGrid[row][col] === 1) {
      // Si ya había un muro, ahora lo quitamos.
      newGrid[row][col] = 0;
      setWallCount(prev => prev - 1);
    } else {
      // Si no había muro, comprobamos si nos quedan muros.
      if (wallCount >= MAX_WALLS) {
        alert(`Límite de muros alcanzado (${MAX_WALLS})!`);
        return;
      }
      newGrid[row][col] = 1;
      setWallCount(prev => prev + 1);
    }
    setGrid(newGrid); // Guardamos el nuevo dibujo del mapa.
  };

  // Esta función es como un "explorador" que mira si hay salida entre los muros. 
  // Usa una técnica llamada "Flood Fill" (llenado por inundación).
  const checkPathToMidline = (startPos, currentGrid, isSide0) => {
    if (!startPos) return false;
    const queue = [startPos];
    const visited = new Set();
    visited.add(`${startPos[0]}-${startPos[1]}`);

    while (queue.length > 0) {
      const [r, c] = queue.shift();

      // Si el explorador llega al centro del tablero, es que hay camino.
      if (isSide0 && c === 9) return true;
      if (!isSide0 && c === 10) return true;

      // Miramos las 8 casillas de alrededor (arriba, abajo, izquierda, derecha y diagonales).
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1], // Cardinales
        [r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1] // Diagonales
      ];

      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          const isMyHalf = isSide0 ? nc < 10 : nc >= 10;
          const key = `${nr}-${nc}`;
          // Si el explorador puede pasar y no ha estado ahí antes, sigue buscando.
          if (isMyHalf && currentGrid[nr][nc] === 0 && !visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }
    }
    return false; // Si se termina de buscar y no llegó al centro, el camino está bloqueado.
  };

  // Acción: Pulsar el botón naranja de "¡Listo!".
  const handleReady = () => {
    if (!myStart) { alert('¡Pon tu punto de inicio primero!'); return; }
    if (!oppEnd) { alert('¡Pon el punto final del rival primero!'); return; }

    // Antes de avisar al servidor, comprobamos que no hayamos bloqueado totalmente el camino.
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
    // Le mandamos al servidor nuestro mapa terminado y nuestras posiciones.
    socket.emit('player_ready', { room, grid, myStart, oppEnd });
  };

  // Acción: Volver al menú inicial.
  const backToLobby = () => {
    // Al recargar la página se borra todo y volvemos al principio.
    window.location.reload();
  };

  // ====================
  // RENDERIZADO (VISTAS)
  // ====================

  // --- VISTA 1: INICIO (LOBBY) ---
  // Si todavía no hemos entrado en una partida (!isJoined), mostramos esto:
  if (!isJoined) {
    return (
      <div className="lobby-container">
        {/* Incluimos la ventanita de ayuda por si alguien no sabe cómo empezar */}
        <HelpModal />
        <button className="help-toggle-btn lobby-help" onClick={() => setShowHelp(true)}>?</button>

        <div className="lobby-card">
          <h1>A* 1vs1 Lobby</h1>
          {/* Aquí escribes tu nombre */}
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
              {/* Aquí escribes el nombre de la sala que quieres crear */}
              <input
                type="text"
                placeholder="Nombre de sala"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
              <button onClick={() => joinGame()}>Crear</button>
            </div>
            {/* Lista de salas que ya existen creadas por otros */}
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

  // --- VISTA 2: EL JUEGO ---
  // Si ya hemos entrado, React mostrará esta otra parte:
  return (
    <div className="app-container">
      <HelpModal />
      {/* Botón de interrogación para las instrucciones del juego */}
      <button className="help-toggle-btn game-help" onClick={() => setShowHelp(true)}>?</button>

      <header className="app-header">
        <div className="header-top">
          <h1 className="main-title">
            <span className="title-left">A*</span>
            <span className="title-center">1vs1</span>
            <span className="title-right">Race</span>
          </h1>
        </div>
        {/* Información de quién juega contra quién */}
        <div className="players-info">
          <div className="player-name-wrapper left">
            <span className={side === 0 ? 'me' : ''}>{side === 0 ? username : opponentName}</span>
          </div>
          <span className="vs">VS</span>
          <div className="player-name-wrapper right">
            <span className={side === 1 ? 'me' : ''}>{side === 1 ? username : opponentName}</span>
          </div>
        </div>
        {/* Texto que te dice qué tienes que hacer ahora */}
        <p className={`status ${winner ? 'winner-bright' : ''}`}>{status}</p>
        {/* Botón para volver al menú de inicio que solo sale cuando hay un ganador */}
        {winner && <button className="play-again-btn" onClick={backToLobby}>🏠 Volver al Inicio</button>}
      </header>

      <main className="game-area">
        {/* Botones de control para poner muros o puntos de inicio */}
        <div className="controls">
          <div className="stat-pill">Muros: {wallCount}/{MAX_WALLS}</div>
          <button className={mode === 'myStart' ? 'active mode-start' : 'mode-start'} disabled={ready || winner} onClick={() => setMode('myStart')}>🟢 Mi inicio</button>
          <button className={mode === 'oppEnd' ? 'active mode-end' : 'mode-end'} disabled={ready || winner} onClick={() => setMode('oppEnd')}>🔴 Fin rival</button>
          <button className={mode === 'wall' ? 'active' : ''} disabled={ready || winner} onClick={() => setMode('wall')}>🧱 Muros</button>
          {/* El botón de ¡Listo! manda tu mapa al servidor */}
          <button className="ready-btn" disabled={ready || !myStart || !oppEnd || winner} onClick={handleReady}>{ready ? '✅ Listo' : '🚀 ¡Listo!'}</button>
        </div>

        {/* Pequeña leyenda de colores para no perderse */}
        <div className="legend">
          {winner && (
            <>
              <div className="legend-item"><span className="dot myPath"></span> Tu camino</div>
              <div className="legend-item"><span className="dot oppPath"></span> Camino rival</div>
              <div className="legend-item"><span className="dot p1Start"></span> Inicio P1</div>
              <div className="legend-item"><span className="dot p2Start"></span> Inicio P2</div>
            </>
          )}
        </div>

        {/* Mensaje dinámico según el botón que hayas pulsado */}
        <div className="mode-hint">
          {mode === 'myStart' && !winner && <span>🟢 Haz click en tu mitad para colocar tu punto de inicio</span>}
          {mode === 'oppEnd' && !winner && <span>🔴 Haz click en tu mitad para definir el destino del rival</span>}
          {mode === 'wall' && !winner && <span>🧱 Haz click para colocar/quitar muros en tu mitad</span>}
          {winner && <span>🏁 ¡Partida terminada! Puedes ver todos los obstáculos y puntos especiales.</span>}
        </div>

        {/* El dibujo del tablero donde se juega */}
        <div className="board-container">
          <div className="player-board">
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
