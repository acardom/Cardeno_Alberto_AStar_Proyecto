# src/server.py
import socket
from _thread import *
import sys
from settings import IP_SERVIDOR, PUERTO

server = IP_SERVIDOR
port = PUERTO

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

try:
    s.bind((server, port))
except socket.error as e:
    print(str(e))

s.listen(2) # Solo 2 jugadores para el 1vs1
print("Esperando conexión... Servidor en marcha")

posiciones = ["", ""] # Aquí guardamos los muros que pone cada uno

def threaded_client(conn, player):
    conn.send(str.encode("Conectado al servidor"))
    while True:
        try:
            data = conn.recv(2048).decode("utf-8")
            if not data:
                print("Desconectado")
                break
            else:
                # Reenviar la posición del muro al otro jugador
                print(f"Jugador {player} puso muro en: {data}")
                # Aquí podrías añadir la lógica para sincronizar ambos juegos
                conn.sendall(str.encode(data))
        except:
            break

    print("Conexión perdida")
    conn.close()

p = 0
while True:
    conn, addr = s.accept()
    print("Conectado a:", addr)
    start_new_thread(threaded_client, (conn, p))
    p += 1