import React from 'react';
import Cell from './Cell';
import './Board.css';

const Board = ({ grid, start, end, path, onCellClick }) => {
    return (
        <div className="board">
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                    {row.map((cellType, colIndex) => {
                        let displayType = cellType;
                        if (start && start[0] === rowIndex && start[1] === colIndex) displayType = 'start';
                        else if (end && end[0] === rowIndex && end[1] === colIndex) displayType = 'end';
                        else if (path && path.some(p => p[0] === rowIndex && p[1] === colIndex)) displayType = 'path';

                        return (
                            <Cell
                                key={`${rowIndex}-${colIndex}`}
                                row={rowIndex}
                                col={colIndex}
                                type={displayType}
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
