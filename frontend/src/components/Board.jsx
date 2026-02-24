import React from 'react';
import Cell from './Cell';
import './Board.css';

const Board = ({ grid, myStart, oppEnd, p1Start, p1End, p2Start, p2End, path, opponentPath, side, onCellClick }) => {
    return (
        <div className="board">
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                    {row.map((cellType, colIndex) => {
                        const isRestricted = side === 0 ? colIndex >= 10 : colIndex < 10;
                        let displayType = cellType;
                        let pathIndex = undefined;

                        // Prioridad: Puntos finales revelados (cuando termina la partida)
                        if (p1Start && p1Start[0] === rowIndex && p1Start[1] === colIndex) {
                            displayType = 'p1Start';
                        } else if (p1End && p1End[0] === rowIndex && p1End[1] === colIndex) {
                            displayType = 'p1End';
                        } else if (p2Start && p2Start[0] === rowIndex && p2Start[1] === colIndex) {
                            displayType = 'p2Start';
                        } else if (p2End && p2End[0] === rowIndex && p2End[1] === colIndex) {
                            displayType = 'p2End';
                        }
                        // Puntos locales durante la preparación
                        else if (!p1Start && myStart && myStart[0] === rowIndex && myStart[1] === colIndex) {
                            displayType = 'myStart';
                        } else if (!p1Start && oppEnd && oppEnd[0] === rowIndex && oppEnd[1] === colIndex) {
                            displayType = 'oppEnd';
                        }
                        // Caminos y obstáculos
                        else {
                            const myPIndex = path ? path.findIndex(p => p[0] === rowIndex && p[1] === colIndex) : -1;
                            const oppPIndex = opponentPath ? opponentPath.findIndex(p => p[0] === rowIndex && p[1] === colIndex) : -1;

                            if (myPIndex !== -1) {
                                displayType = 'path';
                                pathIndex = myPIndex;
                            } else if (oppPIndex !== -1) {
                                displayType = 'oppPath';
                                pathIndex = oppPIndex;
                            } else if (!p1Start && isRestricted && cellType !== 1) {
                                displayType = 'restricted';
                            }
                        }

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
