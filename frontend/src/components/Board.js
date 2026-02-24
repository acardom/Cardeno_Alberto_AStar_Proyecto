import React from 'react';
import Cell from './Cell';
import './Board.css';

const Board = ({ grid, myStart, oppEnd, path, opponentPath, side, onCellClick }) => {
    return (
        <div className="board">
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                    {row.map((cellType, colIndex) => {
                        const isRestricted = side === 0 ? colIndex >= 10 : colIndex < 10;
                        let displayType = cellType;
                        let pathIndex = undefined;

                        // Prioridad de renderizado
                        if (myStart && myStart[0] === rowIndex && myStart[1] === colIndex) {
                            displayType = 'myStart';
                        } else if (oppEnd && oppEnd[0] === rowIndex && oppEnd[1] === colIndex) {
                            displayType = 'oppEnd';
                        } else {
                            // Buscar en mi camino
                            const myPIndex = path ? path.findIndex(p => p[0] === rowIndex && p[1] === colIndex) : -1;
                            // Buscar en el camino del rival
                            const oppPIndex = opponentPath ? opponentPath.findIndex(p => p[0] === rowIndex && p[1] === colIndex) : -1;

                            if (myPIndex !== -1) {
                                displayType = 'path';
                                pathIndex = myPIndex;
                            } else if (oppPIndex !== -1) {
                                displayType = 'oppPath';
                                pathIndex = oppPIndex;
                            } else if (isRestricted && cellType !== 1) {
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
