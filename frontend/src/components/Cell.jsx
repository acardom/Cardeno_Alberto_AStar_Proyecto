/**
 * @author: Alberto Cárdeno Domínguez
 * @description: Este componente representa una única celda del tablero.
 * Gestiona su apariencia visual basándose en su tipo (muro, camino, inicio, etc.).
 */

import React from 'react';
import './Cell.css';

// =================
// COMPONENTE CELDA
// =================
const Cell = ({ row, col, type, pathIndex, onClick }) => {

  // Función para asignar la clase CSS según lo que sea la casilla
  const getCellClass = () => {
    switch (type) {
      case 1: return 'cell obstacle';   // Es un muro
      case 'myStart': return 'cell myStart';    // Mi punto de inicio
      case 'oppEnd': return 'cell oppEnd';     // El destino del rival en mi lado
      case 'p1Start': return 'cell p1Start';    // Inicio Jugador 1 (revelado)
      case 'p1End': return 'cell p1End';      // Fin Jugador 1 (revelado)
      case 'p2Start': return 'cell p2Start';    // Inicio Jugador 2 (revelado)
      case 'p2End': return 'cell p2End';      // Fin Jugador 2 (revelado)
      case 'path': return 'cell path';       // Mi camino calculado
      case 'oppPath': return 'cell oppPath';    // El camino del rival calculaddo
      case 'restricted': return 'cell restricted'; // Zona prohibida
      default: return 'cell';            // Casilla vacía
    }
  };

  // El pathIndex nos sirve para animar el camino en orden si quisiéramos
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
