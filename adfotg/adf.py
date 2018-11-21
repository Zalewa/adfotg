import os


ADF_SIZE = 901120


def is_adf_path(filepath):
    # Is there a better way to do this?
    return (os.path.isfile(filepath) and
            os.path.getsize(filepath) and
            filepath.lower().endswith(".adf"))
