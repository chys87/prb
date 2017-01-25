#!/usr/bin/env python3.5

import argparse
import asyncio
import locale
import socket

import websockets

from .auth import authenticate
from .config import Config
from .handlers import Context, make_handler


class _Server:
    __slots__ = ('_conf', '_loop', 'start_server')

    def __init__(self, conf, loop):
        self._conf = conf
        self._loop = loop

        if isinstance(conf.addr, str):
            print('Listening on {}...'.format(conf.addr))
            sock = socket.socket(socket.AF_UNIX)
            sock.bind(conf.addr)
            self.start_server = websockets.serve(
                self._server_main, family=socket.AF_UNIX, sock=sock)
        else:
            print('Listening on {}:{}...'.format(*conf.addr))
            self.start_server = websockets.serve(self._server_main, *conf.addr)

    async def _server_main(self, ws, path):
        ra = ws.remote_address
        print('New connection established: {}'.format(ra))

        context = Context(ws, self._conf)

        try:
            # Authentication
            auth_data = await ws.recv()
            if not authenticate(self._conf.passphrase, auth_data):
                asyncio.ensure_future(ws.close(), loop=self._loop)
                print('Authentication failed from {}'.format(ra))
                return

            print('Authentication success from {}'.format(ra))

            # Main loop
            listener = asyncio.ensure_future(ws.recv(), loop=self._loop)
            active_futures = [listener]
            while True:
                done, pending = await asyncio.wait(
                    active_futures, return_when=asyncio.FIRST_COMPLETED)
                for future in done:
                    if future.exception():
                        raise future.exception()
                    active_futures.remove(future)
                    if future is listener:
                        data = listener.result()
                        future = asyncio.ensure_future(
                            make_handler(data, context, loop=self._loop),
                            loop=self._loop)
                        active_futures.append(future)

                        listener = asyncio.ensure_future(ws.recv(),
                                                         loop=self._loop)
                        active_futures.append(listener)

        except websockets.ConnectionClosed:
            print('Lost connection from {}'.format(ra))


def main():
    locale.setlocale(locale.LC_ALL, 'zh_CN.UTF-8')

    parser = argparse.ArgumentParser()
    parser.add_argument('conf_file', metavar='CONF.YAML', help='Config file')
    args = parser.parse_args()

    conf = Config(args.conf_file)

    loop = asyncio.get_event_loop()

    srv = _Server(conf, loop)
    server = loop.run_until_complete(srv.start_server)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        server.close()
        loop.run_until_complete(server.wait_closed())


if __name__ == '__main__':
    main()
