from . import app, error, storage, version
from .config import config

from flask import abort, jsonify, request, safe_join, send_from_directory

import os


class ApiError(error.AdfotgError):
    pass


@app.route("/upload", methods=['POST'])
def upload():
    # TODO
    # 1. Detect if what we uploaded is ADF or not.
    # 2. If ADF, put it into ADF directory.
    # 3. If not ADF, put it into uploads directory.
    print("what is config?", config)
    print(request)
    print(request.files)
    os.makedirs(config.upload_dir, exist_ok=True)
    for filename, file in request.files.items():
        file.save(safe_join(config.upload_dir, filename))
    return ""


@app.route("/upload", methods=['GET'])
def list_uploads():
    # TODO
    # 3. Pagination.
    sorting = _sorting()
    return jsonify(storage.listdir(config.upload_dir, sort=sorting))


@app.route("/upload/<name>", methods=["GET"])
def get_upload(name):
    return send_from_directory(config.upload_dir, name)


@app.route("/upload/<name>", methods=["DELETE"])
def del_upload(name):
    os.unlink(safe_join(config.upload_dir, name))


@app.route("/upload/pack", methods=["POST"])
def upload_to_adf():
    '''
    Request as JSON:
    files -- list of uploads to pack
    adf -- name of the adf to create (what to do when there's collision?)
    allow_split -- bool; if True then if contents are larger than floppy
    then split them into more ADFs (what do when there's a big file? split it?
    what to do when there are many files, including big ones?)
    '''
    # TODO is this request good?
    args = request.get_json()
    # TODO rest of the method


@app.route("/adf", methods=["GET"])
def list_adfs():
    '''
    Query args (all optional):
    - filter -- name filter, matched as "contains case-insensitive";
      defaults to nothing which disables the filter
    - sort -- sort field, valid values: name, size, mtime; defaults to name
    - dir -- sort direction, valid values: asc, desc; defaults to asc
    '''
    # TODO - recurse into subdirectories or support more ADF dirs than one.
    # Users could potentially store hundreds of those and pagination is required.
    # Also do same features as in list_uploads()
    filter_pattern = request.args.get("filter")
    sort, direction = _sorting()

    name_filter = None
    if filter_pattern:
        filter_pattern = filter_pattern.strip().lower()
        if filter_pattern:
            def name_filter(name):
                return filter_pattern in name.lower()
    full_list = storage.listdir(config.adf_dir, name_filter=name_filter,
                                sort=(sort, direction))
    return jsonify(full_list)


@app.route("/adf/<path:filepath>", methods=["GET"])
def get_adf(filepath):
    return send_from_directory(config.adf_dir, filepath)


@app.route("/adf/<path:filepath>", methods=["DELETE"])
def del_adf(filepath):
    os.unlink(safe_join(config.adf_dir, filepath))


@app.route("/adf/mount", methods=["GET", "POST"])
def mount_flash_drive():
    # TODO
    # 1. Get this to work.
    # 2. When list of ADFs is passed, mount them all as one drive.
    # 3. When Amiga modifies ADF, how do we save it back to the
    #    local system?
    if request.method == "POST":
        adfs = request.get_json()["adfs"]
        print("requested mount of {}", adfs)
    elif request.method == "GET":
        print("say here what is mounted")
    else:
        raise ApiError("unhandled HTTP method")
    return ""


@app.route("/adf/unmount", methods=["POST"])
def unmount_flash_drive():
    # TODO
    # 1. Get this to work.
    # 2. When ADF is modified from Amiga, do we wish to overwrite
    #    the ADF on local system?
    print("requested unmount")
    return ""


@app.route("/version")
def get_version():
    return jsonify(
        version=version.VERSION,
        yearspan=version.YEARSPAN
    )


def _sorting():
    sort = request.args.get("sort", "name")
    direction = request.args.get("dir", "asc")
    return sort, direction
