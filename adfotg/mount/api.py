import traceback

from flask import jsonify, safe_join, Blueprint

from adfotg.apiutil import apierr
from adfotg.config import config
from adfotg.error import AdfotgError
from adfotg.mount import Mount, MountStatus
from adfotg.mountimg import MountImage


api = Blueprint('mount', __name__, url_prefix='/mount')


@api.route("", methods=["GET"])
def get_mounted_flash_drive():
    '''Obtain mount state and info on the currently mounted image if any.

    There can be only one image mounted at a time.

    This function returns two pieces of information:

    1. Is there anything mounted or is there any error in
       regards to image mounting?

    2. If there is anything mounted, return details on it.

    Returns: an object {
      status: a MountStatus value as string
      file: string, optional; name of the image file if any is mounted
      listing: optional; list of FileEntry for files contained in the
          image
      error: string, optional; present only if there's a problem with
          obtaining the mount status or the information on the mount
          image
    }

    MountStatus is an enum that has following values:

    - mounted -- a valid image is mounted
    - unmounted -- nothing is currently mounted
    - no_image -- an image is mounted but it doesn't exist
      in the filesystem
    - bad_image -- if a predictable error occurs when trying
      to obtain the mount information; this may indicate
      that there's something wrong with the mounted image
    - other_image_mounted -- an image outside of adfotg is mounted

    '''
    mount = Mount.current()
    imagefile = None
    listing = []
    try:
        if mount.has_image():
            imagefile = mount.imagefile
            if not imagefile.startswith(config.mount_images_dir):
                return jsonify(status=MountStatus.OtherImageMounted.value,
                               error="mounted image is unknown to the app")
            imagefile = imagefile[len(config.mount_images_dir):].lstrip("/")
            listing = mount.list()
    except AdfotgError as e:
        traceback.print_exc()
        return jsonify(status=MountStatus.BadImage.value,
                       file=imagefile,
                       error=str(e))
    else:
        return jsonify(status=mount.state().value,
                       file=imagefile,
                       listing=listing)


@api.route("/<imgname>", methods=["POST"])
def mount_flash_drive(imgname):
    '''Request to mount a mount image specified by the imgname.

    It is invalid to attempt to mount an image if another image
    is already mounted. `/unmount` first.

    URL args:
    - imgname -- name of the mount image file. It must exist
      in the mount images zone.

    Returns: nothing if successful

    Errors:
    - 404 -- if the mount image is not found
    - 500 -- can be returned if the mount image is invalid;
      this should not happen unless the image was modified
      externally
    '''
    imagefile = safe_join(config.mount_images_dir, imgname)
    mountimg = MountImage(imagefile)
    if not mountimg.exists():
        return apierr(404, "image not found")
    if not mountimg.is_valid():
        return apierr(500, "tried to mount an invalid mass storage image")
    mount = Mount(imagefile)
    mount.mount()
    return ""


@api.route("", methods=["DELETE"])
def unmount_flash_drive():
    '''Unmount the currently mounted image.

    Returns: nothing of importance on success.

    Errors:
    - 400 -- if unmount is requested but nothing is mounted.
    '''
    mount = Mount.current()
    if mount.state() is MountStatus.Mounted:
        mount.unmount()
    else:
        return apierr(400, "cannot unmount as nothing is mounted")
    return 'OK'
