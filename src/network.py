# network.py
import socket
import threading

class Red:
    def __init__(self):
        self.client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.addr = ("127.0.0.1", 5555)

    def conectar(self):
        try:
            self.client.connect(self.addr)
            return True
        except:
            return False

    def enviar(self, data):
        try:
            self.client.send(str.encode(data))
        except socket.error as e:
            print(e)