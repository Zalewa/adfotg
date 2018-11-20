from . import app
from . import mountimg, storage, version
from .config import config
from .error import AdfotgError
from .mountimg import Mount

from flask import abort, jsonify, request, safe_join, send_from_directory

import os
import traceback


class ApiError(AdfotgError):
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
    # 3. Pagination and filtering.
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
    sorting = _sorting()

    name_filter = None
    if filter_pattern:
        filter_pattern = filter_pattern.strip().lower()
        if filter_pattern:
            def name_filter(name):
                return filter_pattern in name.lower()
    full_list = storage.listdir(config.adf_dir, name_filter=name_filter,
                                sort=sorting)
    return jsonify(full_list)


@app.route("/adf/<path:filepath>", methods=["GET"])
def get_adf(filepath):
    return send_from_directory(config.adf_dir, filepath)


@app.route("/adf/<path:filepath>", methods=["DELETE"])
def del_adf(filepath):
    os.unlink(safe_join(config.adf_dir, filepath))


@app.route("/mount", methods=["GET"])
def get_mounted_flash_drive():
    # TODO
    # 1. Get this to work.
    # 2. When list of ADFs is passed, mount them all as one drive.
    mount = Mount.current()
    if not mount:
        return jsonify(status=mountimg.MountStatus.Unmounted.value)
    imagefile = None
    try:
        imagefile = mount.imagefile
        if not imagefile.startswith(config.mount_images_dir):
            return jsonify(status=mountimg.MountStatus.OtherImageMounted,
                           error="mounted image is unknown to the app")
        imagefile = imagefile[len(config.mount_images_dir):].lstrip("/")
        listing = mount.list()
    except AdfotgError as e:
        traceback.print_exc()
        return jsonify(status=mountimg.MountStatus.BadImage.value,
                       file=imagefile,
                       error=str(e))
    else:
        return jsonify(status=mount.state().value,
                       file=imagefile,
                       listing=listing)


@app.route("/mount/<filename>", methods=["POST"])
def mount_flash_drive(filename):
    mount = Mount(safe_join(config.mount_images_dir, filename))
    mount.mount()
    return ""


@app.route("/unmount", methods=["POST"])
def unmount_flash_drive():
    mount = Mount.current()
    if mount.state() is mountimg.MountStatus.Mounted:
        mount.unmount()
    else:
        abort(400, "cannot unmount as nothing is mounted")
    return 'OK'


@app.route("/mount_image", methods=["GET"])
def list_mount_images():
    # TODO same as list_adfs and list_uploads
    sorting = _sorting()
    return jsonify(storage.listdir(config.mount_images_dir, sort=sorting))


@app.route("/mount_image/<filename>", methods=["GET"])
def get_mount_image(filename):
    return send_from_directory(config.mount_images_dir, filename)


@app.route("/mount_image/<filename>/pack_adfs", methods=["PUT"])
def mount_pack_flash_drive_image(filename):
    '''
    Body args:
    - adfs -- list of ADFs to put into the image.
      Names must be as returned by GET /adf.
    '''
    pass


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
