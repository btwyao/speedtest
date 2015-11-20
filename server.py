#!/usr/bin/env python
# -*- coding: utf-8 -*-

import SocketServer
import select

MaxSocketSize = 1024

def log(msg):
    print(msg)

class SpeedTestHandler(SocketServer.BaseRequestHandler):

    def log(self, msg):
        address = self.server.server_address
        log("server(%s,%d):[%s]" % (address[0], address[1], msg))

    def handle(self):
        self.log('connected from:%s,%d' % self.client_address)
        while True:
            data = self.request.recv(MaxSocketSize)
            if not data:
                break
            self.log('msg:%s' % data)
            self.request.sendall(data)
        self.log('disconnected from:%s,%d' % self.client_address)

class DataCollectHandler(SocketServer.BaseRequestHandler):

    def log(self, msg):
        address = self.server.server_address
        log("server(%s,%d):[%s]" % (address[0], address[1], msg))

    def handle(self):
        self.log('connected from:%s,%d' % self.client_address)
        while True:
            data = self.request.recv(MaxSocketSize)
            if not data:
                break
            data = data.strip()
            self.log('msg:%s' % data)
            data = data.split(',')
            networkState, delay = data[0], data[1]
        self.log('disconnected from:%s,%d' % self.client_address)

if __name__ == "__main__":
    HOST, PORT = "172.16.101.220", 2046
    testServer = SocketServer.ThreadingTCPServer((HOST, PORT), SpeedTestHandler)
    log("waiting for connection…:(%s,%d)" % (HOST, PORT))
    HOST, PORT = "172.16.101.220", 2048
    dataServer = SocketServer.ThreadingTCPServer((HOST, PORT), DataCollectHandler)
    log("waiting for connection…:(%s,%d)" % (HOST, PORT))
    testServer.serve_forever()
    dataServer.serve_forever()
