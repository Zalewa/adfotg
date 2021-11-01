import os
import tempfile
import weakref

from adfotg import app, storage
from adfotg.apiutil import apierr, Listing
from adfotg.config import config
from adfotg.mountimg import MountImage

from flask import jsonify, request, safe_join, send_file, send_from_directory


@app.route("/mount_image", methods=["GET"])
def list_mount_images():
    '''Gets a list of files in the mount images zone.

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
    if not os.path.exists(config.mount_images_dir):
        # App controls this directory so if it doesn't exist
        # it's not necessarilly an error.
        return jsonify([])
    full_list = storage.listdir(config.mount_images_dir,
                                name_filter=listing.filter_name,
                                sort=listing.sorting)
    return jsonify(
        listing=listing.limit(full_list),
        total=len(full_list)
    )


@app.route("/mount_image/<imgname>", methods=["GET"])
def get_mount_image(imgname):
    '''Retrieve a mount image from the mount image zone.

    URL args:
    - imgname -- name of the mount image to retrieve

    Returns: The mount image.

    Errors:
    - 404 -- if the mount image is not found
    '''
    return send_from_directory(config.mount_images_dir, imgname)


@app.route("/mount_image/<imgname>/contents", methods=["GET"])
def get_mount_image_contents(imgname):
    '''List contents of this mount image as if it was a directory.

    URL args:
    - imgname -- name of the mount image to list.

    Returns: a list of FileEntry objects.

    Errors:
    - 404 -- if the mount image is not found
    '''
    img = MountImage(safe_join(config.mount_images_dir, imgname))
    if not img.exists():
        return apierr(404, "image not found")
    return jsonify(img.list())


@app.route("/mount_image/<imgname>/contents/<filename>", methods=["GET"])
def get_file_from_mount_image(imgname, filename):
    '''
    Retrieve a file from inside of the mount image and
    send it back to the client.

    URL args:
    - imgname -- name of the image from which the file will be extracted.
    - filename -- name of the file inside the mount image to extract.

    Returns: The file is sent as a HTTP attachment.

    Errors:
    - 404 -- if the mount image is not found
    '''
    img = MountImage(safe_join(config.mount_images_dir, imgname))
    if not img.exists():
        return apierr(404, "image not found")

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


@app.route("/mount_image/<imgname>", methods=["DELETE"])
def del_mount_image(imgname):
    '''Delete a mount image from the mount image zone.

    URL args:
    - imgname -- name of the mount image to delete

    Returns: nothing if successful

    Errors:
    - 404 -- if the mount image is not found
    '''
    mountimg = MountImage(safe_join(config.mount_images_dir, imgname))
    if not mountimg.exists():
        return apierr(404, "image not found")
    mountimg.delete()
    return ""


@app.route("/mount_image/<imgname>/pack_adfs", methods=["PUT"])
def mount_pack_flash_drive_image(imgname):
    '''Creates a new mount image with specified ADFs.

    This function takes ADFs from the ADF library and packs
    them into a new mount image. The ADFs in the library remain
    untouched and their copies are packed into the mount image.

    The ADFs are copied into the mount image in order in which they are
    present on the 'adfs' list. This order is important as Gotek will
    use this order to assign the floppy index to each ADF (this may
    vary depending on your Gotek's firmware).

    Body args:
    - adfs -- list of ADFs to put into the image.
      Specify only the names here as they are returned
      by GET /adf.

    Errors:
    - 400 -- if no ADF is specified
          -- if any of the ADFs is not found in the library
          -- if mount image with specified name already exists
    '''
    args = request.get_json()
    adfs = args.get("adfs")
    if not adfs:
        return apierr(400, "no ADFs specified")
    adfs_paths = [
        safe_join(config.adf_dir, adf)
        for adf in adfs
    ]
    for adf_, adf_path in zip(adfs, adfs_paths):
        if not os.path.isfile(adf_path):
            return apierr(400, "ADF '{}' not found".format(adf_))
    os.makedirs(config.mount_images_dir, exist_ok=True)
    imagefile = safe_join(config.mount_images_dir, imgname)
    image = MountImage(imagefile)
    if image.exists():
        return apierr(400, "image '{}' already exists".format(imgname))
    image.pack(adfs_paths)
    return ""
