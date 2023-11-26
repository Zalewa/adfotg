from . import error, version

from configparser import ConfigParser
import os
import sys

_PROGNAME = version.SHORTNAME
_CFG_FILENAME = "{}.conf".format(_PROGNAME)

DEFAULT_CONFIG_LOCATIONS = [os.path.join(dirp, _CFG_FILENAME) for dirp in [
    os.curdir,
    os.path.expanduser("~/.config"),
    "/etc/{}".format(_PROGNAME),
    "/etc"
]]


DEFAULT_PORT = 43164  # AMIGA

# TODO ${INSTALL_PREFIX}
_DATA_DIR = '/var/lib/{}'.format(_PROGNAME)
DEFAULT_ADF_DIR = os.path.join(_DATA_DIR, 'adf')
DEFAULT_UPLOAD_DIR = os.path.join(_DATA_DIR, 'upload')
DEFAULT_WORK_DIR = _DATA_DIR


class ConfigError(error.AdfotgError):
    pass


class _Config:
    def __init__(self):
        self.port = DEFAULT_PORT
        self.adf_dir = DEFAULT_ADF_DIR
        self.upload_dir = DEFAULT_UPLOAD_DIR
        self.work_dir = DEFAULT_WORK_DIR

    def load(self, parser):
        SECTION = _PROGNAME

        def _load(attr):
            setattr(self, attr, parser.get(
                SECTION, attr, fallback=getattr(self, attr)))

        self.port = parser.getint(SECTION, 'port', fallback=self.port)
        _load('adf_dir')
        _load('upload_dir')
        _load('work_dir')

    @property
    def mount_images_dir(self):
        return os.path.join(self.work_dir, "mount_images")

    @property
    def all_workspace_dirs(self):
        return [
            self.work_dir,
            self.adf_dir,
            self.upload_dir,
            self.mount_images_dir
        ]


def load(filenames=None):
    if not _load_from_file(filenames):
        _log("will attempt zeroconfig")
    _log_cfg()
    _create_env()


def _load_from_file(filenames=None):
    '''Config is loaded into the 'config' object which can be imported from
    this module elsewhere. Failure to load results in ConfigError throw.
    '''
    if filenames is None:
        locations = DEFAULT_CONFIG_LOCATIONS[:]
    else:
        if not isinstance(filenames, (list, tuple)):
            filenames = [filenames]
        locations = filenames
    filenames = [l for l in locations if os.path.isfile(l)]
    for filename in filenames:
        cfgparser = ConfigParser()
        if cfgparser.read(filename):
            config.load(cfgparser)
            _log("loaded configuration from '{}'".format(filename))
            return True
    _log("could not load config file from any of these "
         "locations: {}" .format(', '.join(locations)))
    return False


def _log_cfg():
    _log("Configuration:")
    for cfgvar in sorted(vars(config)):
        if cfgvar.startswith("_"):
            continue
        _log("  {} = {}".format(cfgvar, getattr(config, cfgvar)))


def _create_env():
    for dir_ in config.all_workspace_dirs:
        try:
            os.makedirs(dir_, exist_ok=True)
        except PermissionError as e:
            raise ConfigError(
                "could not create directory '{}'; ensure you are "
                "running as an appropriate user ({})".format(dir_, e)) from e


def _log(*args):
    print(*args, file=sys.stderr)


# This is a globally accessible object loaded at app startup.
config = _Config()
