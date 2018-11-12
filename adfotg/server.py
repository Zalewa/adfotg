from adfotg import app

from flask import abort, request, send_from_directory
from werkzeug.exceptions import NotFound

import os.path


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


@app.route("/upload", methods=['POST'])
def upload():
    print(request)
    print(request.files)
    for filename, file in request.files.items():
        #file.save(os.path.join("/tmp/szsz", filename))
        pass
    return ""
