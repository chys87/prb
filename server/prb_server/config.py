import os

import yaml


class ConfigError(Exception):
    pass


class Config:
    __slots__ = (
        'addr',
        'passphrase', 'basedir',
    )

    def __init__(self, conf_file):
        with open(conf_file) as f:
            conf = yaml.load(f)

        try:
            addr = conf['addr']
            self.passphrase = conf['passphrase']
            self.basedir = os.path.expanduser(conf['basedir'])
        except KeyError as e:
            raise ConfigError('{} must be specified'.format(e.args[0]))

        if isinstance(addr, int) or (isinstance(addr, str) and addr.isdigit()):
            self.addr = (None, addr)
        elif isinstance(addr, str):
            self.addr = addr
        elif isinstance(addr, (list, tuple)) and len(addr) == 2 and \
                isinstance(addr[0], (str, type(None))) and \
                (isinstance(addr[1], int) or
                 isinstance(addr[1], str) and addr[1].isdigit()):
            self.addr = (addr[0], int(addr[1]))
        else:
            raise ConfigError('Invalid addr: {}'.format(self.addr))
