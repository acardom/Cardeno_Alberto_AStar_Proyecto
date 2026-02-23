import pygame
import sys
from settings import *
from grid import Grid
from astar import algoritmo_astar
from network import Red

def main():
    pygame.init()
    ventana = pygame.display.set_mode((ANCHO_VENTANA, ANCHO_VENTANA))
    pygame.display.set_caption("A* Pathfinding 1vs1 - IA Automocion")
    
    # Inicializacion de mapa y posiciones (Requisito: configurable)
    mi_mapa = Grid(FILAS, ANCHO_VENTANA)
    inicio = (0, 0)
    meta = (FILAS - 1, FILAS - 1)
    
    # Opcional: Intentar conectar a red
    # red = Red()
    # conectado = red.conectar()

    corriendo = True
    while corriendo:
        mi_mapa.dibujar(ventana, inicio, meta)
        
        # Calcular y dibujar la ruta en tiempo real (Requisito: ruta visible)
        camino = algoritmo_astar(mi_mapa.grid, inicio, meta)
        if camino:
            for nodo in camino:
                if nodo != meta:
                    x = nodo[1] * TAMANO_CASILLA + TAMANO_CASILLA // 2
                    y = nodo[0] * TAMANO_CASILLA + TAMANO_CASILLA // 2
                    pygame.draw.circle(ventana, AMARILLO, (x, y), TAMANO_CASILLA // 4)

        for evento in pygame.event.get():
            if evento.type == pygame.QUIT:
                corriendo = False
                pygame.quit()
                sys.exit()

            # Click Izquierdo: Poner/Quitar Muros (Zonas bloqueadas)
            if pygame.mouse.get_pressed()[0]:
                pos = pygame.mouse.get_pos()
                r, c = mi_mapa.click_casilla(pos)
                if (r, c) != inicio and (r, c) != meta:
                    mi_mapa.grid[r][c] = 1 # Bloqueado
                    # if conectado: red.enviar(f"{r},{c}")

            # Click Derecho: Limpiar casilla (Zonas transitables)
            if pygame.mouse.get_pressed()[2]:
                pos = pygame.mouse.get_pos()
                r, c = mi_mapa.click_casilla(pos)
                mi_mapa.grid[r][c] = 0 # Transitable

        pygame.display.update()

if __name__ == "__main__":
    main()