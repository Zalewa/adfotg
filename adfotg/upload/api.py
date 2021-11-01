import os
import shutil

from flask import jsonify, request, safe_join, send_from_directory

from adfotg import adf, app, storage
from adfotg.apiutil import Listing, del_files
from adfotg.config import config


@app.route("/upload", methods=['POST'])
def upload():
    '''Upload a file to the upload zone or the ADF library.

    This is a "smart" function. It accepts file uploads and tries to
    organize them. It expects files to be uploaded using the HTTP
    standard "multipart/form-data" format. The uploaded files are
    analyzed to see if they can be identified as ADFs. ADFs are then
    stored in the ADF library, while all other files are moved to the
    upload zone.

    '''
    os.makedirs(config.upload_dir, exist_ok=True)
    for filename, file in request.files.items():
        dest_path = safe_join(config.upload_dir, filename)
        file.save(dest_path)
        if adf.is_adf_path(dest_path):
            os.makedirs(config.adf_dir, exist_ok=True)
            shutil.move(dest_path, safe_join(config.adf_dir, filename))
    return ""


@app.route("/upload", methods=['GET'])
def list_uploads():
    '''Gets a list of files in the upload zone.

    Query args (all optional):
    - sort -- sort field, valid values: name, size, mtime; defaults to name
    - dir -- sort direction, valid values: asc, desc; defaults to asc

    Returns: a list of FileEntry objects.
    '''
    listing = Listing(request)
    return jsonify(storage.listdir(config.upload_dir, sort=listing.sorting))


@app.route("/upload", methods=["DELETE"])
def del_uploads():
    '''Bulk delete of uploads.

    Body args:
    - names -- list of strings denoting upload names to delete.

    Returns: list of tuples which can be either: (200, filename, '')
    or (error_code, filename, error). There are as many elements
    in the returned list as there are names in the request.
    '''
    filenames = request.get_json().get('names', [])
    return jsonify(del_files(config.upload_dir, filenames))


@app.route("/upload/<name>", methods=["GET"])
def get_upload(name):
    '''Retrieve a file from the upload zone.

    URL args:
    - name -- name of the file to retrieve

    Returns: The file.
    '''
    return send_from_directory(config.upload_dir, name)


@app.route("/upload/<name>", methods=["DELETE"])
def del_upload(name):
    '''Delete a file from the upload zone; returns nothing on success.

    URL args:
    - name -- name of the file to delete
    '''
    os.unlink(safe_join(config.upload_dir, name))
