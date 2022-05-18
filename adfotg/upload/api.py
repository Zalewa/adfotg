import os
import shutil

from flask import jsonify, request, send_from_directory, Blueprint
from werkzeug.utils import safe_join

from adfotg import adf, storage
from adfotg.apiutil import Listing, del_files
from adfotg.config import config


api = Blueprint("upload", __name__, url_prefix="/upload")


@api.route("", methods=['POST'])
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


@api.route("", methods=['GET'])
def list_uploads():
    '''Gets a list of files in the upload zone.

    Query args (all optional):
    - filter -- name filter, matched as "contains case-insensitive";
      defaults to nothing which disables the filter
    - sort -- sort field, valid values: name, size, mtime; defaults to name
    - dir -- sort direction, valid values: asc, desc; defaults to asc
    - start -- denotes index at which to start returning the values.
      Must be 0 or greater, but can go beyond the total amount.
    - limit -- maximum amount of elements to return; must be greater
      than 0 if specified.

    Returns: An object: {
        listing: [{...}, {...}, ...],
        total: integer
    }
    `listing` is a list of FileEntry objects. `total` is a total number
    of entries without the limitation which is useful in a query with a
    `limit` to calculate pages.

    '''
    listing = Listing(request)
    full_list = storage.listdir(config.upload_dir,
                                name_filter=listing.filter_name,
                                sort=listing.sorting)
    return jsonify(
        listing=listing.limit(full_list),
        total=len(full_list))


@api.route("", methods=["DELETE"])
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


@api.route("/<name>", methods=["GET"])
def get_upload(name):
    '''Retrieve a file from the upload zone.

    URL args:
    - name -- name of the file to retrieve

    Returns: The file.
    '''
    return send_from_directory(config.upload_dir, name)


@api.route("/<name>", methods=["DELETE"])
def del_upload(name):
    '''Delete a file from the upload zone; returns nothing on success.

    URL args:
    - name -- name of the file to delete
    '''
    os.unlink(safe_join(config.upload_dir, name))
