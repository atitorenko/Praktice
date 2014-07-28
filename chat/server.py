# -*- coding: utf-8 -*-
import os
import uuid
import datetime
import json
import time
from tornado import web
from tornado import httpserver
from tornado import ioloop
from tornado import websocket

ROOT = os.path.dirname(os.path.abspath(__file__))
STATIC_ROOT = os.path.join(ROOT, 'static')


class MainHandler(web.RequestHandler):
    def get(self):
        return self.render('index.html')


class WSHandler(websocket.WebSocketHandler):
    connections = dict()

    def __init__(self, application, request, **kwargs):
        super(WSHandler, self).__init__(application, request, **kwargs)
        self.uid = None
        self.name = None

    def open(self):
        messages = open('messages/messages').read()
        self.uid = uuid.uuid4()
        self.connections[self.uid] = self
        self.send_response('open', '', data=messages)
        print 'New connection with uid={}'.format(self.uid)

    def on_close(self):
        del self.connections[self.name]
        print 'Player with uid={} exit'.format(self.uid)

    def on_message(self, message):
        jm = json.loads(message)
        command = jm.get('command', None)

        if command:
            if command == 'message_send':
                data = jm.get('data')
                if data:
                    now_time = datetime.datetime.now().strftime("%H:%M:%S")
                    message_file = open('messages/messages', 'a')
                    message_file.write('\n' + str(now_time) + '\n' + self.name + ': ' + data)
                    message_file.close()
                    messages = open('messages/messages').read()
                    for x in self.connections:
                        self.connections[x].send_response('messages', '', data=messages)
                    message_file.close()
                else:
                    self.send_response('error', 'empty data', error=True)
            if command == 'auth':
                self.name = jm.get('data')
                self.connections[self.name] = self
                del self.connections[self.uid]
        else:
            print 'No command found in request'

    def send_response(self, message, text, data=None, error=False):
        self.write_message(json.dumps({'message': message,
                                       'text': text,
                                       'error': error,
                                       'data': data}))


if __name__ == '__main__':
    app = web.Application([
        (r'/', MainHandler),
        (r'/ws', WSHandler),
        (r'/static/(.*)', web.StaticFileHandler, {'path': STATIC_ROOT}),
    ])
    server = httpserver.HTTPServer(app)
    server.listen(8888)
    ioloop.IOLoop.instance().start()