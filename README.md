# A* Pathfinding - Navegacion Autonoma 1vs1

Este proyecto implementa el algoritmo de busqueda A* en Python para calcular rutas optimas en un entorno de cuadricula interactivo.

## 1. Fase de Investigacion

### Definicion del Algoritmo A*
Es un algoritmo de busqueda de caminos que encuentra la ruta de menor coste entre un punto de origen y un destino. Utiliza la funcion f(n) = g(n) + h(n), donde g(n) es el coste real acumulado y h(n) es la heuristica estimada hasta la meta.

### Comparativa de Algoritmos
- A*: Alta eficiencia. Utiliza informacion del destino para reducir el area de busqueda.
- Dijkstra: Garantiza el camino mas corto pero explora todas las direcciones, siendo mas lento que A*.
- BFS (Busqueda en anchura): Solo es util cuando todos los pasos tienen el mismo peso y no hay costes variables.

## 2. Caracteristicas del Proyecto

- Generacion de mapa: Cuadricula que representa areas de una ciudad.
- Obstaculos: Permite establecer zonas bloqueadas como edificios o calles cortadas.
- Movimiento: Capacidad de realizar rutas en diagonal y zig-zag.
- Interactividad: El usuario configura la salida, la meta y los muros mediante clics.
- Modo Online: Implementacion 1vs1 mediante Sockets para interactuar entre dos terminales.

## 3. Instalacion y Ejecucion

### Pasos para instalar
1. Clonar el repositorio.
2. Instalar dependencias: pip install -r requirements.txt

### Como ejecutar
Ejecutar el archivo principal desde la consola:
python src/main.py

## 4. Estructura de archivos
- src/main.py: Punto de entrada del programa.
- src/astar.py: Logica del algoritmo de busqueda.
- src/network.py: Gestion de la conexion por Sockets.
- src/settings.py: Configuracion general de tablero y red.
- docs/Memoria.pdf: Documentacion tecnica detallada.

Autor: [Tu Nombre]
Centro: Centro FP Superior Camara de Comercio de Sevilla