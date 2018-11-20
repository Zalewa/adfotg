# coding: utf-8
from . import mountimg, version
from .config import config as _config

import flask
import os

__version__ = version.VERSION
app = flask.Flask(__name__)


class Mount(mountimg.Mount):
    def __init__(self):
        super(Mount, self).__init__(os.path.join(
            _config.work_dir, mountimg.MOUNT_FILENAME))

from . import api, server  # noqa
