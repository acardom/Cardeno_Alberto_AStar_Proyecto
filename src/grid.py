# src/grid.py
import pygame
from settings import *

class Grid:
    def __init__(self, filas, ancho):
        self.filas = filas
        self.ancho = ancho
        self.tamano_casilla = ancho // filas
        # Generar mapa en forma de cuadrícula [cite: 29]
        self.grid = [[0 for _ in range(filas)] for _ in range(filas)]

    def dibujar(self, ventana, inicio, meta):
        for r in range(self.filas):
            for c in range(self.filas):
                color = BLANCO
                # Establecer zonas bloqueadas (edificios) [cite: 32]
                if self.grid[r][c] == 1: color = NEGRO 
                elif (r, c) == inicio: color = VERDE
                elif (r, c) == meta: color = ROJO
                
                pygame.draw.rect(ventana, color, (c*self.tamano_casilla, r*self.tamano_casilla, self.tamano_casilla, self.tamano_casilla))
                # Dibujar las líneas de la cuadrícula
                pygame.draw.rect(ventana, GRIS, (c*self.tamano_casilla, r*self.tamano_casilla, self.tamano_casilla, self.tamano_casilla), 1)

    def click_casilla(self, pos):
        c, r = pos[0] // self.tamano_casilla, pos[1] // self.tamano_casilla
        return r, c