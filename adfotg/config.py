from adfotg import version

from configparser import ConfigParser
import os

_PROGNAME = version.SHORTNAME
_CFG_FILENAME = "{}.conf".format(_PROGNAME)

DEFAULT_CONFIG_DIRS = [os.path.join(dirp, _CFG_FILENAME) for dirp in [
    os.curdir,
    os.path.expanduser("~/.config"),
    "/etc/{}".format(_PROGNAME)
]]


DEFAULT_PORT = 43164  # AMIGA

_DATA_DIR = '/var/lib/{}'.format(_PROGNAME)
DEFAULT_ADF_DIR = os.path.join(_DATA_DIR, 'adf')
DEFAULT_UPLOAD_DIR = os.path.join(_DATA_DIR, 'upload')

# This is a globally accessible object loaded at app startup.
config = None


class ConfigError(Exception):
    pass


class _Config:
    def __init__(self, parser):
        SECTION = _PROGNAME
        self.port = parser.getint(SECTION, 'port', fallback=DEFAULT_PORT)
        self.adf_dir = parser.get(SECTION, 'adf_dir', fallback=DEFAULT_ADF_DIR)
        self.upload_dir = parser.get(SECTION, 'upload_dir', fallback=DEFAULT_UPLOAD_DIR)


def load(filenames=None):
    if filenames is None:
        locations_dirs = [
            os.curdir,
            os.path.expanduser("~/.config"),
            "/etc/{}".format(_PROGNAME)
        ]
        locations = [os.path.join(dirp, _CFG_FILENAME)
                     for dirp in locations_dirs]
    else:
        if not isinstance(filenames, (list, tuple)):
            filenames = [filenames]
        locations = filenames
    filenames = [l for l in locations if os.path.isfile(l)]
    for filename in filenames:
        cfgparser = ConfigParser()
        if cfgparser.read(filename):
            return _Config(cfgparser)
    raise ConfigError("could not load config file from any of these locations: {}"
                      .format(', '.join(locations)))
