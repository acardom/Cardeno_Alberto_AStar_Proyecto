# 🚀 A* 1vs1 Race

¡Bienvenido a **A* 1vs1 Race**! Un juego competitivo de estrategia y algoritmos donde dos jugadores compiten por encontrar el camino más corto en un laberinto dinámico creado por ellos mismos.

Este proyecto utiliza el algoritmo de búsqueda de caminos **A* (A-Star)** para determinar el ganador en tiempo real utilizando WebSockets.

---

## 🎮 ¿Cómo se juega?

1.  **Lobby**: Introduce tu nombre y crea una sala o únete a una existente.
2.  **Preparación**:
    *   **🟢 Mi inicio**: Coloca tu punto de partida en tu mitad del tablero.
    *   **🔴 Fin rival**: Elige dónde quieres que termine el recorrido de tu rival (también en tu mitad).
    *   **🧱 Muros**: Coloca hasta 15 muros para dificultar el camino de tu oponente o proteger tu estrategia.
3.  **Validación**: El juego no te permitirá marcarte como "Listo" si bloqueas totalmente tu inicio o el destino del rival. Siempre debe haber una salida hacia el centro.
4.  **La Carrera**: Una vez ambos jugadores pulsan **¡Listo!**, el servidor calcula ambos caminos simultáneamente.
5.  **Resultado**: Los caminos se dibujan animados en el mapa. ¡El que tenga el camino más corto (menos pasos) gana!

---

## 🛠️ Tecnologías utilizadas

### Frontend
- **React**: Interfaz de usuario dinámica y reactiva.
- **Socket.io-client**: Comunicación bidireccional en tiempo real.
- **CSS3 Moderno**: Animaciones fluidas, gradientes y diseño premium.

### Backend
- **Python / Flask**: Servidor web ligero.
- **Flask-SocketIO**: Gestión de salas y eventos de juego.
- **Algoritmo A***: Implementación personalizada y optimizada del algoritmo de búsqueda de caminos con soporte para movimientos diagonales.

---

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd Cardeno_Alberto_AStar_Proyecto
```

### 2. Configurar el Backend
```bash
cd backend
python -m venv venv
# En Windows:
.\venv\Scripts\activate
# En Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
*El servidor correrá en `http://localhost:5000`*

### 3. Configurar el Frontend
```bash
cd ../frontend
npm install
npm start
```
*La aplicación se abrirá en `http://localhost:3000`*

---

## 💡 Características Principales

- **Visualización Dual**: Al terminar la partida, puedes ver los muros, inicios y finales de ambos jugadores.
- **Animaciones de Camino**: El recorrido se dibuja paso a paso para mayor impacto visual.
- **Sistema de Salas**: Soporte para múltiples partidas simultáneas.
- **Prevención de Bloqueos**: Validación por BFS en el cliente para asegurar que todas las partidas tengan solución.
- **Limpieza Automática**: El servidor gestiona la desconexión de usuarios y elimina salas vacías para ahorrar recursos.

---

## 🎨 Guía de Colores
- 🟡 **Amarillo**: Tu camino calculado.
- 🟣 **Morado**: El camino calculado del rival.
- 🟢 **Círculo Verde**: Punto de inicio.
- 🟠 **Círculo Naranja**: Punto de inicio del rival (revelado al final).
- 🔺 **Triángulo Rojo/Azul**: Puntos de destino.
- 🧱 **Rojo Oscuro**: Muros/Obstáculos.

---

Desarrollado con ❤️ para los amantes de los algoritmos y la competición.
