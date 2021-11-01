# coding: utf-8
from . import version

import flask

__version__ = version.VERSION
app = flask.Flask(__name__)

from .api import api as _api  # noqa
from . import server  # noqa

app.register_blueprint(_api)
