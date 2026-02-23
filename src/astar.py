# astar.py
import math
from queue import PriorityQueue
from settings import COSTO_RECTO, COSTO_DIAGONAL

def heuristica(p1, p2):
    (x1, y1) = p1
    (x2, y2) = p2
    dx = abs(x1 - x2)
    dy = abs(y1 - y2)
    # Distancia Octil para soportar diagonales
    return COSTO_RECTO * (dx + dy) + (COSTO_DIAGONAL - 2 * COSTO_RECTO) * min(dx, dy)

def obtener_vecinos(nodo, grilla):
    vecinos = []
    filas = len(grilla)
    cols = len(grilla[0])
    r, c = nodo

    # Direcciones: Arriba, Abajo, Izq, Der y Diagonales
    direcciones = [
        (0, 1, COSTO_RECTO), (0, -1, COSTO_RECTO), (1, 0, COSTO_RECTO), (-1, 0, COSTO_RECTO),
        (1, 1, COSTO_DIAGONAL), (1, -1, COSTO_DIAGONAL), (-1, 1, COSTO_DIAGONAL), (-1, -1, COSTO_DIAGONAL)
    ]

    for dr, dc, costo in direcciones:
        nr, nc = r + dr, c + dc
        if 0 <= nr < filas and 0 <= nc < cols and grilla[nr][nc] != 1: # 1 es muro
            vecinos.append(((nr, nc), costo))
    return vecinos

def algoritmo_astar(grilla, inicio, fin):
    count = 0
    open_set = PriorityQueue()
    open_set.put((0, count, inicio))
    came_from = {}
    
    g_score = { (r, c): float("inf") for r in range(len(grilla)) for c in range(len(grilla[0])) }
    g_score[inicio] = 0
    
    f_score = { (r, c): float("inf") for r in range(len(grilla)) for c in range(len(grilla[0])) }
    f_score[inicio] = heuristica(inicio, fin)

    while not open_set.empty():
        actual = open_set.get()[2]

        if actual == fin:
            # Reconstruir camino
            camino = []
            while actual in came_from:
                camino.append(actual)
                actual = came_from[actual]
            return camino[::-1]

        for vecino, costo in obtener_vecinos(actual, grilla):
            temp_g_score = g_score[actual] + costo

            if temp_g_score < g_score[vecino]:
                came_from[vecino] = actual
                g_score[vecino] = temp_g_score
                f_score[vecino] = temp_g_score + heuristica(vecino, fin)
                count += 1
                open_set.put((f_score[vecino], count, vecino))
    return None