from flask import jsonify, Blueprint

from adfotg import selfcheck


api = Blueprint("selfcheck", __name__, url_prefix="/selfcheck")


@api.route("")
def self_check():
    '''Returns PASS/FAIL status for various features.

    Some features may be dependant on external tools and this API checks
    if those tools are available. The return value is an object with
    keys refering to a feature and values are either an empty string
    denoting that everything is okay or an error message.

    Returns: {
        rpi, g_mass_storage, xdftool, mtools
    }
    - rpi -- are we running on a Raspberry Pi device
    - g_mass_storage -- is this kernel module available
    - xdftool -- is adfotg-xdftool available
    - mtools -- are mtools installed; several tools needed to
      manipulate the USB drive images are checked
    - storage -- do all workspace directories exists and are
      they writable
    '''
    return jsonify(**selfcheck.self_check())
