from . import app
from .error import ActionError

from flask import abort, jsonify, send_from_directory
from werkzeug.exceptions import InternalServerError, NotFound

import os


@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_file(path):
    try:
        if os.path.isdir(os.path.join(app.root_path, "site")):
            # This is valid for deployment.
            return send_from_directory("site", path)
        elif os.path.isfile(os.path.join(app.root_path, "../../pyproject.toml")):
            # Assume development mode and try to send from repository.
            return send_from_directory("../../site/dist", path)
        else:
            return abort(404)
    except NotFound as e:
        if path == "index.html":
            return abort(500, "index.html should have really been found."
                         " Your installation is broken")
        else:
            raise


@app.route('/inspect/mountimg/<path:path>')
@app.route('/upload')
def serve_sites(*args, **kwargs):
    return serve_file('index.html')


@app.errorhandler(404)
def page_not_found(e):
    return serve_file('index.html'), 404


@app.errorhandler(500)
def error_500(exception):
    if (isinstance(exception, InternalServerError)
            and hasattr(exception, "original_exception")):
        exception = exception.original_exception
    code = 500
    if isinstance(exception, ActionError):
        code = 400
    return (
        jsonify({"error": str(exception)}),
        code,
        {'Content-Type': 'application/json'}
    )
