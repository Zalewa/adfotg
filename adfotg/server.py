from . import app
from .error import ActionError

from flask import abort, jsonify, send_from_directory
from werkzeug.exceptions import NotFound

import os


@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_file(path):
    try:
        if os.path.isdir(os.path.join(app.root_path, "site")):
            # This is valid for deployment.
            return send_from_directory("site", path)
        elif os.path.isfile(os.path.join(app.root_path, "../setup.py")):
            # Assume development mode and try to send from repository.
            return send_from_directory("../site/dist", path)
        else:
            return abort(404)
    except NotFound as e:
        if path == "index.html":
            return abort(500, "index.html should have really been found."
                         " Your installation is broken")
        else:
            raise


@app.route('/adfwizard')
def adfwizard():
    return serve_file('index.html')


@app.errorhandler(500)
def error_500(exception):
    code = 500
    if isinstance(exception, ActionError):
        code = 400
    return (
        jsonify({"error": str(exception)}),
        code,
        {'Content-Type': 'application/json'}
    )
