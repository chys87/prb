import asyncio
import json
import locale
import os
import traceback
import zlib

import msgpack


__all__ = ['Context', 'make_handler']


class Context:
    def __init__(self, ws, conf):
        self.ws = ws
        self.conf = conf


class Req:
    def __init__(self, reqid, reqobj, context):
        self.reqid = reqid
        self.reqobj = reqobj
        self.ws = context.ws
        self.conf = context.conf

    def respond(self, obj):
        obj = dict(obj, reqid=self.reqid)
        return self.ws.send(zlib.compress(msgpack.packb(obj), 9))

    def error(self, msg):
        return self.respond({'error': msg})

    @staticmethod
    def _file_item_sort(item):
        return (0 if item.get('dir') and not item.get('symlink') else 1,
                locale.strxfrm(item['name']))

    def handle_ls(self):
        try:
            path = self.reqobj['path']
        except KeyError as e:
            return self.error('Missing param: {}'.format(e.args[0]))

        path = path.lstrip('/')
        path = os.path.join(self.conf.basedir, path)
        try:
            scanner = os.scandir(path)
        except FileNotFoundError:
            return self.error('Directory not found')

        res = []
        for entry in scanner:
            item = {'name': entry.name}
            is_symlink = entry.is_symlink()
            try:
                is_dir = entry.is_dir()
            except IOError:
                if is_symlink:
                    is_dir = False
                else:
                    raise
            if is_symlink:
                item['symlink'] = 1
            if is_dir:
                item['dir'] = 1
            res.append(item)
        res.sort(key=self._file_item_sort)
        return self.respond({'list': res})


async def _dummy():
    return


async def make_single_handler(req, req_obj, context):
    try:
        reqid = req_obj['reqid']
        op = req_obj['op']
    except (TypeError, KeyError, ValueError):
        print('Malformed request: {}'.format(req))
        return  # Ignore malformed request

    req = Req(reqid, req_obj, context)

    handler = getattr(req, 'handle_{}'.format(op))
    if not handler:
        return await req.error('Op "{}" not found'.format(op))

    try:
        return await handler()
    except Exception as e:
        traceback.print_exc()
        return await req.error('Server internal error: {!r}'.format(e))


def make_multi_handler(req, req_list, context, loop):
    coroutines = [make_single_handler(req, req_item, context)
                  for req_item in req_list]
    return asyncio.gather(*coroutines, loop=loop)


def make_handler(req, context, *, loop=None):
    try:
        req_obj = json.loads(req)
    except ValueError:
        print('Malformed request: {}'.format(req))
        return _dummy() # Ignore malformed request

    if isinstance(req_obj, list):
        return make_multi_handler(req, req_obj, context, loop)
    else:
        return make_single_handler(req, req_obj, context)
