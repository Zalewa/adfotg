'''This application implements a functionality of a programmable USB
drive with the intention of the primary use in a Gotek floppy drive
emulator in an Amiga computer.

Entire functionality is exposed over a RESTful API that can be accessed
through HTTP requests. Hereby are shortlisted all API endpoints with
their HTTP methods, params, possible responses and descriptions.

Generic errors are returned as Content-Type 'application/json' with
"error" field set to the error message. The error code can be 4xx or
500, depending on if the client made an incorrect request (error 4xx) or
the server encountered an invalid state that the client could not
predict or mitigate (error 500). Refer to the specific documentation
of each method for details about possible error codes, but expect that
error code 500 can be produced by any method.

The format of this documentation doesn't adhere to any standard.

Please note that the API is still a WORK IN PROGRESS which means
it's **unstable**, may change at whim and the documentation may
be incomplete.

'''
from . import app
from . import adf, mountimg, storage, version
from .config import config
from .error import AdfotgError, ActionError
from .mountimg import Mount, MountImage

from flask import jsonify, request, safe_join, send_file, send_from_directory

import os
import shutil
import tempfile
import traceback
import weakref


@app.route("/upload", methods=['POST'])
def upload():
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
    sorting = _sorting()
    return jsonify(storage.listdir(config.upload_dir, sort=sorting))


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
    return jsonify(_del_files(config.upload_dir, filenames))


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
    - start -- denotes index at which to start returning the values.
      Must be 0 or greater, but can go beyond the total amount.
    - limit -- maximum amount of elements to return; must be greater
      than 0 if specified.

    Returns: An object: {
        "listing": [{...}, {...}, ...],
        "total": integer
    }
    `listing` is a list of FileEntryField objects containing name,
    size and mtime. `total` is a total number of entries without
    the limitation which is useful in a query with a `limit` to
    calculate pages.
    '''
    # TODO - recurse into subdirectories or support more ADF dirs than one.
    # Users could potentially store hundreds of those and pagination is required.
    filter_pattern = request.args.get("filter")
    sorting = _sorting()

    name_filter = None
    start, limit = _pagination()
    if filter_pattern:
        filter_pattern = filter_pattern.strip().lower()
        if filter_pattern:
            def name_filter(name):
                return filter_pattern in name.lower()
    full_list = storage.listdir(config.adf_dir, name_filter=name_filter,
                                sort=sorting)
    return jsonify(
        listing=_limit(full_list, start, limit),
        total=len(full_list))


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
    return jsonify(_del_files(config.adf_dir, filenames))


@app.route("/adf/<path:filepath>", methods=["GET"])
def get_adf(filepath):
    return send_from_directory(config.adf_dir, filepath)


@app.route("/adf/<path:filepath>", methods=["DELETE"])
def del_adf(filepath):
    os.unlink(safe_join(config.adf_dir, filepath))


@app.route("/mount", methods=["GET"])
def get_mounted_flash_drive():
    mount = Mount.current()
    if not mount:
        return jsonify(status=mountimg.MountStatus.Unmounted.value)
    imagefile = None
    try:
        imagefile = mount.imagefile
        if not imagefile.startswith(config.mount_images_dir):
            return jsonify(status=mountimg.MountStatus.OtherImageMounted.value,
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
    imagefile = safe_join(config.mount_images_dir, filename)
    mountimg = MountImage(imagefile)
    if not mountimg.exists():
        return _apierr(404, "image not found")
    if not mountimg.is_valid():
        return _apierr(500, "tried to mount an invalid mass storage image")
    mount = Mount(imagefile)
    mount.mount()
    return ""


@app.route("/unmount", methods=["POST"])
def unmount_flash_drive():
    mount = Mount.current()
    if mount.state() is mountimg.MountStatus.Mounted:
        mount.unmount()
    else:
        return _apierr(400, "cannot unmount as nothing is mounted")
    return 'OK'


@app.route("/mount_image", methods=["GET"])
def list_mount_images():
    # TODO same as list_adfs and list_uploads
    sorting = _sorting()
    if not os.path.exists(config.mount_images_dir):
        # App controls this directory so if it doesn't exist
        # it's not necessarilly an error.
        return jsonify([])
    return jsonify(storage.listdir(config.mount_images_dir, sort=sorting))


@app.route("/mount_image/<filename>", methods=["GET"])
def get_mount_image(filename):
    return send_from_directory(config.mount_images_dir, filename)


@app.route("/mount_image/<filename>/contents", methods=["GET"])
def get_mount_image_contents(filename):
    img = MountImage(safe_join(config.mount_images_dir, filename))
    if not img.exists():
        return _apierr(404, "image not found")
    return jsonify(img.list())


@app.route("/mount_image/<imgname>/contents/<filename>", methods=["GET"])
def get_file_from_mount_image(imgname, filename):
    '''
    Retrieve a file from inside of the mount image and
    send it back to the client.

    The file is sent as a HTTP attachment.
    '''
    img = MountImage(safe_join(config.mount_images_dir, imgname))
    if not img.exists():
        return _apierr(404, "image not found")

    def cleanup():
        tmpf.close()
    tmpf = tempfile.NamedTemporaryFile()
    weakref.finalize(tmpf, cleanup)
    img.unpack_file(filename, tmpf.name)
    os.fsync(tmpf)
    tmpf.seek(0)
    size = os.path.getsize(tmpf.name)
    response = send_file(tmpf, as_attachment=True,
                         attachment_filename=filename)
    response.headers['Content-Length'] = size
    return response


@app.route("/mount_image", methods=["DELETE"])
def del_mount_images():
    '''Bulk delete of mount images.

    Body args:
    - names -- list of strings denoting image names to delete.

    Returns: list of tuples which can be either: (200, filename, '')
    or (error_code, filename, error). There are as many elements
    in the returned list as there are images in the request.
    '''
    filenames = request.get_json().get('names', [])
    deleted = []
    for filename in filenames:
        mountimg = MountImage(safe_join(config.mount_images_dir, filename))
        if not mountimg.exists():
            deleted.append((404, filename, "image not found"))
        try:
            mountimg.delete()
        except Exception as e:
            deleted.append((500, filename, str(e)))
    return jsonify(deleted)


@app.route("/mount_image/<filename>", methods=["DELETE"])
def del_mount_image(filename):
    mountimg = MountImage(safe_join(config.mount_images_dir, filename))
    if not mountimg.exists():
        return _apierr(404, "image not found")
    mountimg.delete()
    return ""


@app.route("/mount_image/<filename>/pack_adfs", methods=["PUT"])
def mount_pack_flash_drive_image(filename):
    '''
    Body args:
    - adfs -- list of ADFs to put into the image.
      Names must be as returned by GET /adf.
    '''
    args = request.get_json()
    adfs = args.get("adfs")
    if not adfs:
        return _apierr(400, "no ADFs specified")
    adfs_paths = [
        safe_join(config.adf_dir, adf)
        for adf in adfs
    ]
    for adf_, adf_path in zip(adfs, adfs_paths):
        if not os.path.isfile(adf_path):
            return _apierr(400, "ADF '{}' not found".format(adf_))
    os.makedirs(config.mount_images_dir, exist_ok=True)
    imagefile = safe_join(config.mount_images_dir, filename)
    image = MountImage(imagefile)
    if image.exists():
        return _apierr(400, "image '{}' already exists".format(filename))
    image.pack(adfs_paths)
    return ""


@app.route("/filesystem", methods=['GET'])
def get_free_space():
    '''Details of file-system roots for all file-systems used by the app.

    Returned is a list of file-systems that are used for storage by
    the application. Each entry on the list contains:

    - name -- string; mount point of the filesystem
    - total -- int; total space in bytes
    - avail -- int; space available for use in bytes
    '''
    paths = [
        config.adf_dir,
        config.mount_images_dir,
        config.upload_dir
    ]
    mount_points = set([storage.mount_point(p) for p in paths])
    fs_stats = [storage.fs_stats(mp) for mp in mount_points]
    fs_stats = sorted(fs_stats, key=lambda ss: ss.name)
    return jsonify([{
        'name': fs.name,
        'total': fs.total,
        'avail': fs.avail
    } for fs in fs_stats])


@app.route("/version")
def get_version():
    return jsonify(
        version=version.VERSION,
        yearspan=version.YEARSPAN
    )


@app.route("/help")
def api_help():
    from .apidoc import spec
    return spec.to_text(), 200, {"Content-Type": "text/plain"}


def _del_files(dirpath, filenames):
    deleted = []
    for filename in filenames:
        try:
            storage.unlink(safe_join(dirpath, filename))
        except FileNotFoundError:
            deleted.append((404, filename, "file not found"))
        except Exception as e:
            deleted.append((500, filename, str(e)))
    return deleted


def _sorting():
    sort = request.args.get("sort", "name")
    direction = request.args.get("dir", "asc")
    return sort, direction


def _pagination():
    start = request.args.get("start")
    limit = request.args.get("limit")
    return _validate_start(start), _validate_limit(limit)


def _limit(list_, start, limit):
    start = _validate_start(start)
    limit = _validate_limit(limit)
    if start is not None:
        list_ = list_[start:]
    if limit is not None:
        list_ = list_[:limit]
    return list_


def _validate_start(start):
    if start is not None:
        try:
            start = int(start)
        except ValueError:
            raise ActionError("starting index must be a number")
        if start < 0:
            raise ActionError("starting index must be 0 or greater")
    return start


def _validate_limit(limit):
    if limit is not None:
        try:
            limit = int(limit)
        except ValueError:
            raise ActionError("limit must be a number")
        if limit <= 0:
            raise ActionError("limit must be greater than 0")
    return limit


def _apierr(code, message):
    return (
        jsonify({"error": message}),
        code,
        {'Content-Type': 'application/json'}
    )
