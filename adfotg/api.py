'''This application implements a functionality of converting a Raspberry
Pi Zero into a programmable USB drive with the intention of the primary
use in a Gotek floppy drive emulator in an Amiga computer.

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


== Definitions ==

-- Arguments --

- URL args are specified as a part of URL path
- Query args are specified in URL query
- Body args are specified as a JSON object sent as the request's body

-- FileEntry --

File listing returned by this API are returned in a FileEntry
object format.

  FileEntry {
    name: file name
    size: size in bytes, integer
    mtime: last modification time in seconds since the 1970 epoch
  }

-- Zones --

- Upload zone - where the generic files are stored upon upload
- ADF library - where the ADFs are stored
- Mount images zone - where the USB drive images are stored

-- Mount Image --

A mount image is a file that serves as a FAT32 formatted container.
It can be mounted on a directory in a Linux filesystem, manipulated
with mtools and, most importantly, mounted as a mass storage device
through USB On-The-Go using the g_mass_storage Kernel module.

Simply put: A mount image can be considered to be an USB stick image.


== Disclaimer ==

The format of this documentation doesn't adhere to any standard.

Please note that the API is still a WORK IN PROGRESS which means
it's **unstable**, may change at whim and the documentation may
be incomplete.


== Static Files ==

This application doesn't only provide a REST API service but is also
a HTTP server that may serve HTML or other content to be rendered
in the browser. The default 'site' implementation comes with several
files that are served as-is.

The application handles this by first trying to match the request
URL to an API endpoint. If no API endpoint matches, it will fall back
to a generic URL handler which tries to see if there's a static file
or a web page that matches the requested path. If yes, then this
static file or web page is served. If there's no such fall-back,
then 404 is returned.
'''
from flask import jsonify, Blueprint

from . import storage, version
from .config import config

# Import APIs so that they can mount their routes
from .adf.api import api as adf_api
from .mount.api import api as mount_api
from .mountimg.api import api as mountimg_api
from .quickmount.api import api as quickmount_api
from .selfcheck.api import api as selfcheck_api
from .upload.api import api as upload_api


api = Blueprint("api", __name__, url_prefix="/api")
for subapi in [adf_api, mount_api, mountimg_api, quickmount_api,
               selfcheck_api, upload_api]:
    api.register_blueprint(subapi)


@api.route("/filesystem", methods=['GET'])
def get_free_space():
    '''Details of file-system roots for all file-systems used by the app.

    Returned is a list of file-systems that are used for storage by
    the application. Each entry on the list contains:

    object {
      name: string; mount point of the filesystem
      total: int; total space in bytes
      avail: int; space available for use in bytes
    }
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


@api.route("/version")
def get_version():
    '''adfotg version.

    Returns: an object {
      version: x.y.z string denoting the version;
          this doesn't contain the Git commit hash.
      yearspan: production years span as a string;
          this is human-readable and for display purposes.
    }
    '''
    return jsonify(
        version=version.VERSION,
        yearspan=version.YEARSPAN,
        lastyear=str(version.YEARS[-1])
    )


@api.route("/")
@api.route("/help")
def api_help():
    '''Returns the help in text/plain format.'''
    from .apidoc import spec
    return spec.to_text(), 200, {"Content-Type": "text/plain"}
