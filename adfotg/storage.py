from .util import Interpretable

from enum import Enum
import os


class Field(Interpretable, Enum):
    NAME = "name"
    SIZE = "size"
    MTIME = "mtime"


class Direction(Interpretable, Enum):
    ASCENDING = "asc"
    DESCENDING = "desc"

    def is_ascending(self):
        return self == self.ASCENDING


def listdir(dirpath, name_filter=None, sort=None):
    '''
    sort -- tuple of (Field, Direction) enums or None
    '''
    if name_filter is None:
        name_filter = _true
    files = [entry for entry in os.scandir(dirpath) if entry.is_file()]
    files = [
        _fileentry_to_dict(entry)
        for entry in files
        if name_filter(entry.name)
    ]
    if sort:
        field, direction = sort
        field = Field.interpret(field)
        direction = Direction.interpret(direction)
        files = list(sorted(files,
                            key=lambda f: _case_insensitive(f[field.value]),
                            reverse=not direction.is_ascending()))
    return files


def unlink(filepath):
    os.unlink(filepath)


def _fileentry_to_dict(entry):
    stat = entry.stat()
    return {
        "name": entry.name,
        "size": stat.st_size,
        "mtime": int(stat.st_mtime)
    }


def _true(*args, **kwargs):
    return True


def _case_insensitive(what):
    return what.lower() if isinstance(what, str) else what
