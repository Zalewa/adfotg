import os

from flask import Blueprint
from werkzeug.utils import safe_join

from adfotg import adf
from adfotg.apiutil import apierr
from adfotg.config import config
from adfotg.mount import Mount, MountStatus
from adfotg.mountimg import MountImage


api = Blueprint("quickmount", __name__, url_prefix="/quickmount")


@api.route("/adf/<name>", methods=["POST"])
def quickmount_adf(name):
    '''Just mount a specified, single ADF.

    This performs following steps in one go:

    1. Unmounts any mount image if already mounted.
    2. Creates a new temporary mount image. This image is
       created in the normal directory for the mount images
       but is always named .QUICKMOUNT.

       The contents of the image include all standard ADFs
       as listed by the /adf_std endpoint, and the selected ADF.

       2.1. Old temporary mount image is deleted, if there is any.
    3. Mounts this temporary mount image.

    Returns: nothing if successful

    Errors:
    - 404 -- if the ADF is not found
    '''
    adf_path = safe_join(config.adf_dir, name)
    if not os.path.isfile(adf_path):
        return apierr(404, "ADF '{}' cannot be found".format(name))
    old_mount = Mount.current()
    if old_mount.state() == MountStatus.Mounted:
        old_mount.unmount()
    img = _quickmount_image()
    if img.exists():
        img.delete()
    os.makedirs(os.path.dirname(img.imagefile), exist_ok=True)
    img.pack(
        [safe_join(config.adf_dir, n) for n in adf.list_standard_adfs()]
        + [adf_path])
    img_mount = Mount(img.imagefile)
    img_mount.mount()
    return ""


def _quickmount_image():
    return MountImage(safe_join(config.mount_images_dir, ".QUICKMOUNT"))
