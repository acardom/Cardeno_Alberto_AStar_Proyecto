/**
 * @author: Alberto Cárdeno Domínguez
 * @description: Este componente representa el tablero de juego. 
 * Se encarga de dibujar la cuadrícula y decidir qué color o icono mostrar en cada casilla
 * según el estado de la partida (preparación o resultado final).
 */

import React from 'react';
import Cell from './Cell';
import './Board.css';

// ==================
// COMPONENTE TABLERO
// ==================
const Board = ({ grid, myStart, oppEnd, p1Start, p1End, p2Start, p2End, path, opponentPath, side, onCellClick }) => {
    return (
        <div className="board">
            {/* Recorremos las filas del mapa */}
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                    {/* Recorremos cada casilla de la fila */}
                    {row.map((cellType, colIndex) => {
                        // Comprobamos si la casilla está en el lado del rival
                        const isRestricted = side === 0 ? colIndex >= 10 : colIndex < 10;
                        let displayType = cellType;
                        let pathIndex = undefined;

                        // =====================================
                        // LÓGICA DE VISUALIZACIÓN (Prioridades)
                        // =====================================

                        // 1. Puntos finales revelados (cuando termina la partida y el servidor lo cuenta todo)
                        if (p1Start && p1Start[0] === rowIndex && p1Start[1] === colIndex) {
                            displayType = 'p1Start';
                        } else if (p1End && p1End[0] === rowIndex && p1End[1] === colIndex) {
                            displayType = 'p1End';
                        } else if (p2Start && p2Start[0] === rowIndex && p2Start[1] === colIndex) {
                            displayType = 'p2Start';
                        } else if (p2End && p2End[0] === rowIndex && p2End[1] === colIndex) {
                            displayType = 'p2End';
                        }
                        // 2. Puntos locales durante la preparación (antes de darle a Listo)
                        else if (!p1Start && myStart && myStart[0] === rowIndex && myStart[1] === colIndex) {
                            displayType = 'myStart';
                        } else if (!p1Start && oppEnd && oppEnd[0] === rowIndex && oppEnd[1] === colIndex) {
                            displayType = 'oppEnd';
                        }
                        // 3. Caminos calculados y zonas restringidas
                        else {
                            const myPIndex = path ? path.findIndex(p => p[0] === rowIndex && p[1] === colIndex) : -1;
                            const oppPIndex = opponentPath ? opponentPath.findIndex(p => p[0] === rowIndex && p[1] === colIndex) : -1;

                            if (myPIndex !== -1) {
                                // Es parte de nuestro camino
                                displayType = 'path';
                                pathIndex = myPIndex;
                            } else if (oppPIndex !== -1) {
                                // Es parte del camino del oponente
                                displayType = 'oppPath';
                                pathIndex = oppPIndex;
                            } else if (!p1Start && isRestricted && cellType !== 1) {
                                // Zona donde no puedes poner nada (el lado del rival)
                                displayType = 'restricted';
                            }
                        }

                        // Pintamos la casilla individual
                        return (
                            <Cell
                                key={`${rowIndex}-${colIndex}`}
                                row={rowIndex}
                                col={colIndex}
                                type={displayType}
                                pathIndex={pathIndex}
                                onClick={onCellClick}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Board;
