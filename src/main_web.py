import streamlit as st
import numpy as np
from astar import algoritmo_astar
from settings import FILAS, COLUMNAS, OBSTACULOS_PREDEFINIDOS

st.set_page_config(page_title="A* Online Battle", layout="wide")
st.title("🚢 A* Pathfinding: Edición Hundir la Flota")

# 1. Inicializar el mapa con los obstáculos predefinidos
if 'grid' not in st.session_state:
    grid = np.zeros((FILAS, COLUMNAS))
    for r, c, largo, ori in OBSTACULOS_PREDEFINIDOS:
        for i in range(largo):
            if ori == 'H': grid[r][c+i] = 1
            else: grid[r+i][c] = 1
    st.session_state.grid = grid

# 2. Interfaz de usuario
col1, col2 = st.columns([3, 1])

with col2:
    st.subheader("Controles")
    inicio_x = st.number_input("Inicio Fila", 0, FILAS-1, 0)
    inicio_y = st.number_input("Inicio Col", 0, COLUMNAS-1, 0)
    meta_x = st.number_input("Meta Fila", 0, FILAS-1, FILAS-1)
    meta_y = st.number_input("Meta Col", 0, COLUMNAS-1, COLUMNAS-1)
    
    if st.button("Limpiar Mapa"):
        st.session_state.grid = np.zeros((FILAS, COLUMNAS))
        st.rerun()

# 3. Calcular A*
inicio = (inicio_x, inicio_y)
meta = (meta_x, meta_y)
camino = algoritmo_astar(st.session_state.grid, inicio, meta)

# 4. Dibujar la "Web" (Usando HTML/CSS para que sea bonito)
with col1:
    # Generar visualización con Markdown/HTML
    html_grid = "<div style='display: grid; grid-template-columns: repeat(20, 25px); gap: 2px;'>"
    for r in range(FILAS):
        for c in range(COLUMNAS):
            color = "white"
            content = ""
            if (r, c) == inicio: color = "#2ecc71"; content = "🚀"
            elif (r, c) == meta: color = "#e74c3c"; content = "🏁"
            elif st.session_state.grid[r][c] == 1: color = "#2c3e50" # Barco/Muro
            elif camino and (r, c) in camino: color = "#f1c40f" # Camino A*
            
            html_grid += f"<div style='width:25px; height:25px; background-color:{color}; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; font-size:15px;'>{content}</div>"
    html_grid += "</div>"
    st.markdown(html_grid, unsafe_allow_html=True)