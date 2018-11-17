import os


def listdir(dirpath, name_filter=None):
    if name_filter is None:
        name_filter = _true
    return [_fileentry_to_dict(entry)
            for entry in os.scandir(dirpath)
            if entry.is_file() and name_filter(entry.name)]


def _fileentry_to_dict(entry):
    stat = entry.stat()
    return {
        "name": entry.name,
        "size": stat.st_size,
        "mtime": int(stat.st_mtime)
    }


def _true(*args, **kwargs):
    return True
