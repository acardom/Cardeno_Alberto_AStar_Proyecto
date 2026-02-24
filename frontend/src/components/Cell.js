import React from 'react';
import './Cell.css';

const Cell = ({ row, col, type, onClick }) => {
  const getCellClass = () => {
    switch (type) {
      case 1: return 'cell obstacle';
      case 'start': return 'cell start';
      case 'end': return 'cell end';
      case 'path': return 'cell path';
      default: return 'cell';
    }
  };

  return (
    <div 
      className={getCellClass()} 
      onClick={() => onClick(row, col)}
    />
  );
};

export default Cell;
