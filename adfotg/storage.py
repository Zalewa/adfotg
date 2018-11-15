import os


def listdir(dirpath):
    return [_fileentry_to_dict(entry)
            for entry in os.scandir(dirpath)
            if entry.is_file()]


def _fileentry_to_dict(entry):
    stat = entry.stat()
    return {
        "name": entry.name,
        "size": stat.st_size,
        "mtime": int(stat.st_mtime)
    }
