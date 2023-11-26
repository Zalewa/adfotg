from .util import Interpretable

from collections import namedtuple
from enum import Enum
import fnmatch
import os
import re


class FileEntryField(Interpretable, Enum):
    NAME = "name"
    SIZE = "size"
    MTIME = "mtime"

    @classmethod
    def dictify(cls, name, size, mtime):
        return {
            cls.NAME.value: name,
            cls.SIZE.value: size,
            cls.MTIME.value: mtime
        }


class Direction(Interpretable, Enum):
    ASCENDING = "asc"
    DESCENDING = "desc"

    def is_ascending(self):
        return self == self.ASCENDING


def listdir(dirpath, name_filter=None, sort=None):
    '''
    sort -- tuple of (FileEntryField, Direction) enums or None
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
        field = FileEntryField.interpret(field)
        direction = Direction.interpret(direction)
        files = list(sorted(files,
                            key=lambda f: _case_insensitive(f[field.value]),
                            reverse=not direction.is_ascending()))
    return files


def find(dirpath, pattern, case_sensitive=True):
    '''
    dirpath -- dir to scan, it's not recursive
    pattern -- glob pattern
    case_sensitive -- whether pattern match is case sensitive
    '''
    re_flags = 0 if case_sensitive else re.IGNORECASE
    pattern = re.compile(fnmatch.translate(pattern), re_flags)
    matches = []
    for entry in os.scandir(dirpath):
        if entry.is_file() and pattern.match(entry.name):
            matches.append(entry.name)
    return matches


def unlink(filepath, optional=False):
    try:
        os.unlink(filepath)
    except FileNotFoundError:
        if not optional:
            raise


def mount_point(path):
    if path:
        path = os.path.realpath(path)
        while path and not os.path.ismount(path):
            path = os.path.dirname(path)
    return path


FsStats = namedtuple('StorageStats', ['name', 'total', 'avail'])


def fs_stats(path):
    stat = os.statvfs(path)
    return FsStats(path,
                   stat.f_bsize * stat.f_blocks,
                   stat.f_bsize * stat.f_bavail)


def _fileentry_to_dict(entry):
    stat = entry.stat()
    return FileEntryField.dictify(entry.name, stat.st_size, int(stat.st_mtime))


def _true(*args, **kwargs):
    return True


def _case_insensitive(what):
    return what.lower() if isinstance(what, str) else what
