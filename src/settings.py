# settings.py

# Dimensiones y Grilla
ANCHO_VENTANA = 600
FILAS = 30
TAMANO_CASILLA = ANCHO_VENTANA // FILAS

# Colores
BLANCO = (255, 255, 255)
NEGRO = (0, 0, 0)
GRIS = (128, 128, 128)
VERDE = (0, 255, 0)
ROJO = (255, 0, 0)
AZUL = (0, 0, 255)
AMARILLO = (255, 255, 0)

# Costes de movimiento
COSTO_RECTO = 1
COSTO_DIAGONAL = 1.4  # Requisito: permitir diagonales

# Red
IP_SERVIDOR = "127.0.0.1"
PUERTO = 5555

# settings.py
FILAS = 20
COLUMNAS = 20

# Definimos "barcos" (obstáculos predefinidos) 
# Formato: (fila_inicio, col_inicio, largo, orientacion 'H' o 'V')
OBSTACULOS_PREDEFINIDOS = [
    (2, 2, 4, 'H'),  # Un edificio largo de 4 casillas
    (10, 5, 3, 'V'), # Una manzana de casas vertical
    (5, 15, 2, 'H'),
    (15, 10, 5, 'H')
]

# Estética
COLOR_CAMINO = "#FFD700" # Dorado
COLOR_OBSTACULO = "#2C3E50" # Azul noche