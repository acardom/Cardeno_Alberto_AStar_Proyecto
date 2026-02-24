import React from 'react';
import './Cell.css';

const Cell = ({ row, col, type, pathIndex, onClick }) => {
  const getCellClass = () => {
    switch (type) {
      case 1: return 'cell obstacle';
      case 'myStart': return 'cell myStart';
      case 'oppEnd': return 'cell oppEnd';
      case 'p1Start': return 'cell p1Start';
      case 'p1End': return 'cell p1End';
      case 'p2Start': return 'cell p2Start';
      case 'p2End': return 'cell p2End';
      case 'path': return 'cell path';
      case 'oppPath': return 'cell oppPath';
      case 'restricted': return 'cell restricted';
      default: return 'cell';
    }
  };

  const style = pathIndex !== undefined ? { '--path-index': pathIndex } : {};

  return (
    <div
      className={getCellClass()}
      style={style}
      onClick={() => onClick(row, col)}
    />
  );
};

export default Cell;
