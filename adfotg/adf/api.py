import os

from flask import jsonify, request, safe_join, send_from_directory

from adfotg import adf, app, storage
from adfotg.apiutil import Listing, del_files
from adfotg.config import config
from adfotg.error import ActionError


@app.route("/adf", methods=["GET"])
def list_adfs():
    '''Get a list of ADFs.

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
    # TODO - recurse into subdirectories or support more ADF dirs than one.
    # Users could potentially store hundreds of those and pagination is required.
    listing = Listing(request)
    full_list = storage.listdir(config.adf_dir, name_filter=listing.filter_name,
                                sort=listing.sorting)
    return jsonify(
        listing=listing.limit(full_list),
        total=len(full_list))


@app.route("/adf_std", methods=["GET"])
def list_standard_adfs():
    return jsonify(_list_standard_adfs())


def _list_standard_adfs():
    '''Returns a list of standard ADFs that may be used in specialized
    cases. These ADFs have known names and when placed on the USB drive
    will be used in special ways.

    The ADFs are returned only if they exist in the ADF library.

    Currently, the only recognized standard ADF is "SELECTOR.ADF" for
    Cortex firmware. Gotek with Cortex will not work without
    the selector.

    Returns: a list of ADF names with case adjusted to the actual
    case of the filename. If multiple files have the same but
    differently cased filename, then a single but undefined name
    is returned. If there are no matches, the returned list is empty.
    '''
    STANDARD_ADFS = ["selector.adf"]
    matches = []
    for adf_name in STANDARD_ADFS:
        found = storage.find(config.adf_dir, adf_name,
                             case_sensitive=False)
        if found:
            matches.append(found[0])
    return matches


@app.route("/adf", methods=["DELETE"])
def del_adfs():
    '''Bulk delete of ADFs.

    Body args:
    - names -- list of strings denoting upload names to delete.

    Returns: list of tuples which can be either: (200, filename, '')
    or (error_code, filename, error). There are as many elements
    in the returned list as there are names in the request.
    '''
    filenames = request.get_json().get('names', [])
    return jsonify(del_files(config.adf_dir, filenames))


@app.route("/adf/<name>", methods=["GET"])
def get_adf(name):
    '''Retrieve an ADF.

    URL args:
    - name -- name of the ADF to retrieve

    Returns: The ADF file.
    '''
    return send_from_directory(config.adf_dir, name)


@app.route("/adf/<name>", methods=["DELETE"])
def del_adf(name):
    '''Delete an ADF from the ADF library; returns nothing on success.

    URL args:
    - name -- name of the ADF to delete
    '''
    os.unlink(safe_join(config.adf_dir, name))


@app.route("/adf/<name>", methods=["POST"])
def create_adf(name):
    '''Create ADF with contents from the upload zone.

    This API requires xdftool.

    There's a limitation of max. 30 characters on a filename
    and label length. If a source file exceeds this limitation,
    it's allowed to use the renaming mechanism so that it fits.

    URL args:
    - name -- name of the ADF file to create. Must not exist.

    Body args:
    - label -- disk label assigned to the ADF
    - contents -- list of elements pointing to the files
      in the upload zone.

    The `contents` list can hold values of different types.

    - A simple string type denotes a filename of a file from the upload
      zone. When specified, this file is copied whole on to the ADF.

    - A {name: string, start: int, length: int, rename: string} object
      denotes a split operation. The file pointed out by `name` will be
      cut into a slice as determined by the [`start`; `length`] range.
      It will then be renamed in accordance to `rename` string. This
      is useful to slice files larger than one ADF into multiple ADFs.
      `start` and `length` can be unspecified if you only wish to rename,
      and `rename` also can be unspecified in which case the behavior
      will be the same as if a simple string was sent.

    - An empty list will result in empty but formatted ADF.

    Returns: nothing if successful

    Errors:

    - 400
      - if ADF already exists
      - if disk label is not specified or exceeds the limit
        of 30 characters
      - if a filename exceeds the limit of 30 characters
      - if an invalid argument is specified for a file operation

    - 500 can be returned if xdftool fails, even if that
      failure was caused by the client preparing the operations
      incorrectly.

    '''
    target_path = safe_join(config.adf_dir, name)
    if os.path.exists(target_path):
        raise ActionError("ADF '{}' already exists".format(name))
    label = request.get_json().get("label")
    if not label:
        raise ActionError("must specify label")
    if len(label) > adf.MAX_FFS_FILENAME:
        raise ActionError("label length exceeds limit; max '{}', is '{}'".format(
            adf.MAX_FFS_FILENAME, len(label)))
    contents = request.get_json().get("contents", [])
    file_ops = [adf.FileUploadOp.interpret_api(config.upload_dir, piece)
                for piece in contents]
    adf.create_adf(target_path, label, file_ops)
    return ''
