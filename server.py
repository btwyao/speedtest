#!/usr/bin/env python
# -*- coding: utf-8 -*-

import SocketServer

ConfigDict = {
        "MaxSpeedSocketSize":1024,
        "MaxSocketContentSize":1024*1024,
        "SpeedTestHost":"172.16.101.220",
        "SpeedTestPort":2046,
}

def log(msg):
    print(msg)

class SpeedTestHandler(SocketServer.BaseRequestHandler):

    def log(self, msg):
        address = self.server.server_address
        log("server(%s,%d):[%s]" % (address[0], address[1], msg))

    def handler(self):
        self.log('connected from:%s,%d' % self.client_address)
        while True:
            self.request.sendall(self.request.recv(ConfigDict["MaxSpeedSocketSize"]))

if __name__ == "__main__":
    HOST, PORT = ConfigDict['SpeedTestHost'], ConfigDict['SpeedTestPort']
    server = SocketServer.ThreadingTCPServer((HOST, PORT), SpeedTestHandler)
    log("waiting for connection…:(%s,%d)" % (HOST, PORT))
    server.serve_forever()
