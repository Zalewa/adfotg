import os
import subprocess
import sys
from tempfile import NamedTemporaryFile

from flask import safe_join

from adfotg import storage
from adfotg.config import config
from adfotg.error import ActionError, AdfotgError


ADF_SIZE = 901120

MAX_FFS_FILENAME = 30


class FileUploadOp:
    def __init__(self, source, pos=None, rename=None):
        self._source = source
        self._pos = pos
        self._rename = rename

        self._tempfile = None

    @classmethod
    def interpret_api(cls, base_dir, api_arg):
        if isinstance(api_arg, dict):
            op = cls(
                safe_join(base_dir, api_arg['name']),
                pos=cls._interpret_pos(api_arg),
                rename=api_arg.get('rename')
            )
        elif isinstance(api_arg, str):
            op = cls(safe_join(base_dir, api_arg))
        else:
            raise ActionError("unknown API argument for file upload op")
        op.validate()
        return op

    @staticmethod
    def _interpret_pos(api_arg):
        start = _api_int(api_arg.get('start'))
        length = _api_int(api_arg.get('length'))
        if start is None and length is None:
            return None
        else:
            return start, length

    def open(self):
        if self._pos is not None:
            self._tempfile = NamedTemporaryFile()
            start, length = self._pos
            with open(self._source, 'rb') as fsrc:
                if start is not None:
                    fsrc.seek(start)
                if length is not None:
                    data = fsrc.read(length)
                else:
                    data = fsrc.read()
                if not data:
                    raise AdfotgError("read less data than requested "
                                      "from '{}'".format(self._source))
                self._tempfile.write(data)
                self._tempfile.flush()

    def close(self):
        if self._tempfile is not None:
            self._tempfile.close()
            self._tempfile = None

    def command(self):
        cmd = [
            'write',
            self._sys_name,
            self._adf_name
        ]
        return cmd

    def validate(self):
        if len(self._adf_name) > MAX_FFS_FILENAME:
            raise ActionError(
                "Amiga filenames must be in {} character "
                "limit; '{}' is {}".format(
                    MAX_FFS_FILENAME, self._adf_name,
                    len(self._adf_name)))

    @property
    def _sys_name(self):
        if self._tempfile is not None:
            return self._tempfile.name
        else:
            return self._source

    @property
    def _adf_name(self):
        if self._rename is not None:
            return self._rename
        else:
            return os.path.basename(self._source)


def is_adf_path(filepath):
    # Is there a better way to do this?
    return (os.path.isfile(filepath) and
            os.path.getsize(filepath) and
            filepath.lower().endswith(".adf"))


def create_adf(adf_path, label, file_ops):
    if not adf_path.lower().endswith(".adf"):
        raise ValueError("ADF filename must have .adf extension")
    workdir = os.path.dirname(adf_path)
    adf_name = os.path.basename(adf_path)
    cmd_base = [
        'xdftool', adf_name,
        'create', '+',
        'format', label, 'ffs',
    ]
    file_commands = []
    try:
        for file_op in file_ops:
            # TODO Creating this in the caller but opening it here
            # breaks the RAII rule.
            file_op.open()
            file_commands.append('+')
            file_commands += file_op.command()
        print("calling command", cmd_base + file_commands, file=sys.stderr)
        env = dict(os.environ)
        env['PYTHONIOENCODING'] = 'utf-8'
        p = subprocess.Popen(
            cmd_base + file_commands,
            cwd=workdir, stdin=subprocess.DEVNULL, env=env,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, _ = p.communicate()
        exitcode = p.wait()
        if exitcode != 0:
            storage.unlink(adf_path, optional=True)
            raise AdfotgError(stdout)
    finally:
        for file_op in file_ops:
            file_op.close()


def list_standard_adfs():
    '''Returns a list of standard ADFs that may be used in specialized
    cases. These ADFs have known names and when placed on the USB drive
    will be used in special ways.

    The ADFs are returned only if they exist in the ADF library.

    Currently, the only recognized standard ADF is "SELECTOR.ADF" for
    Cortex firmware. Gotek with Cortex will not work without
    the selector.

    Returns: a list of ADF names with case adjusted to the actual
    case of the filename. If multiple files have the same but
    differently cased filename, then a single but undefined name
    is returned. If there are no matches, the returned list is empty.
    '''
    STANDARD_ADFS = ["selector.adf"]
    matches = []
    for adf_name in STANDARD_ADFS:
        found = storage.find(config.adf_dir, adf_name,
                             case_sensitive=False)
        if found:
            matches.append(found[0])
    return matches


def _api_int(i):
    return int(i) if i is not None else None
