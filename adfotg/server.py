from adfotg import app
from flask import abort, send_from_directory
import os.path


@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_file(path):
    if os.path.isdir(os.path.join(app.root_path, "site")):
        # This is valid for deployment.
        return send_from_directory("site", path)
    elif os.path.isfile(os.path.join(app.root_path, "../setup.py")):
        # Assume development mode and try to send from repository.
        return send_from_directory("../site/dist", path)
    else:
        if path == "index.html":
            return abort(500, "index.html should really have been found."
                         " Your installation is broken")
        else:
            return abort(404)
