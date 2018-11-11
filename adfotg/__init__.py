# coding: utf-8
from . import version
import flask

__version__ = version.VERSION
app = flask.Flask(__name__)

from . import server  # noqa
