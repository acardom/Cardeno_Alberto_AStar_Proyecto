"""
@author: Alberto Cárdeno Domínguez
@description: Implementación del algoritmo de búsqueda de caminos A*.
Es el motor que calcula la ruta más corta en el mapa evitando obstáculos y 
permitiendo movimientos en diagonal.
"""

import heapq
import math

# LA FICHA DE CADA CASILLA
class Node:
    def __init__(self, position, parent=None):
        self.position = position # Las coordenadas (X, Y)
        self.parent = parent     # De qué casilla viene (para luego dibujar el camino hacia atrás)
        self.g = 0  # Distancia: Cuántos pasos he dado desde el inicio hasta aquí
        self.h = 0  # Heurística: Distancia "a ojo" que falta hasta el final
        self.f = 0  # Suma total (g + h). El algoritmo siempre elige la casilla con menor 'f'

    def __eq__(self, other):
        # Saber si dos casillas son la misma posición
        return self.position == other.position

    def __lt__(self, other):
        # Para que el ordenador sepa cuál es menor y decidir cuál mirar primero
        return self.f < other.f

# EL "OJO" DEL ALGORITMO
def heuristic(current, goal):
    """
    Calcula la distancia en línea recta .
    Es como si el algoritmo trazara una línea imaginaria hasta la meta.
    """
    return math.sqrt((current[0] - goal[0])**2 + (current[1] - goal[1])**2)

# EL BUSCADOR (A*)
def a_star(grid, start, end):
    """
    grid: El mapa (0 es suelo libre, 1 es un muro/obstáculo).
    start: Punto de salida.
    end: Punto de llegada.
    """
    rows = len(grid)
    cols = len(grid[0])
    
    # Creamos las fichas de inicio y fin
    start_node = Node(start)
    end_node = Node(end)
    
    # open_list: Casillas que estamos mirando
    open_list = []
    # closed_set: Casillas que ya hemos visitado y no hace falta volver a mirar
    closed_set = set()
    
    # Empezamos por la casilla de salida
    heapq.heappush(open_list, start_node)
    
    # Definimos los 8 movimientos posibles (Arriba, Abajo, Izquierda, Derecha y las 4 Diagonales)
    # El tercer número es el "coste": moverte en diagonal cuesta un poco más (1.41) que en recto (1)
    neighbors = [
        # Movimientos rectos
        (0, -1, 1), (0, 1, 1), (-1, 0, 1), (1, 0, 1),
        # Movimientos diagonales
        (-1, -1, math.sqrt(2)), (-1, 1, math.sqrt(2)),
        (1, -1, math.sqrt(2)), (1, 1, math.sqrt(2)) 
    ]
    
    # Mientras tengamos casillas por revisar
    while open_list:
        # Cogemos la casilla que parece ser la más corta (la que tiene menor 'f')
        current_node = heapq.heappop(open_list)
        closed_set.add(current_node.position)
        
        # HEMOS LLEGADO?
        if current_node.position == end_node.position:
            path = []
            # Vamos hacia atrás usando los "padres" para reconstruir el camino
            while current_node:
                path.append(current_node.position)
                current_node = current_node.parent
            return path[::-1] # Le damos la vuelta para que vaya de Inicio a Fin
        
        # Si no hemos llegado, miramos las casillas de alrededor
        for move_row, move_col, cost in neighbors:
            node_pos = (current_node.position[0] + move_row, current_node.position[1] + move_col)
            
            # ¿Está dentro del mapa? (Que no se salga por los bordes)
            if not (0 <= node_pos[0] < rows and 0 <= node_pos[1] < cols):
                continue
            
            # ¿Es un muro? (Si es un 1, no se puede pasar)
            if grid[node_pos[0]][node_pos[1]] == 1:
                continue
                
            # ¿Ya la hemos visitado antes?
            if node_pos in closed_set:
                continue
            
            # Si pasa los filtros, calculamos sus puntos (g, h, f)
            neighbor_node = Node(node_pos, current_node)
            neighbor_node.g = current_node.g + cost # Pasos acumulados
            neighbor_node.h = heuristic(node_pos, end_node.position) # Lo que le falta "a ojo"
            neighbor_node.f = neighbor_node.g + neighbor_node.h # Nota final
            
            # ¿Esta casilla ya estaba en la lista de tareas con mejor puntuación?
            is_better = True
            for open_node in open_list:
                if open_node.position == neighbor_node.position and open_node.g <= neighbor_node.g:
                    is_better = False
                    break
            
            # Si es un camino nuevo o mejor, lo añadimos a la lista para explorarlo luego
            if is_better:
                heapq.heappush(open_list, neighbor_node)
                
    # Si la lista se vacía y no hemos llegado al final, es que no hay camino posible
    return None