import os
import subprocess
from tempfile import NamedTemporaryFile

from flask import safe_join

from .error import ActionError, AdfotgError


ADF_SIZE = 901120


class FileUploadOp:
    def __init__(self, source, pos=None, rename=None):
        self._source = source
        self._pos = pos,
        self._rename = rename

        self._tempfile = None

    @classmethod
    def interpret_api(cls, base_dir, api_arg):
        if isinstance(api_arg, dict):
            return cls(
                safe_join(base_dir, api_arg['source']),
                pos=(_api_int(api_arg.get('start')),
                     _api_int(api_arg.get('length'))),
                rename=api_arg.get('rename')
            )
        elif isinstance(api_arg, str):
            return cls(safe_join(base_dir, api_arg))
        else:
            raise ActionError("unknown API argument for file upload op")

    def open(self):
        if self._pos is not None:
            self._tempfile = NamedTemporaryFile()
            start, length = self._pos
            with open(self._source, 'rb') as fsrc:
                fsrc.seek(start)
                data = fsrc.read(length)
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
            file_commands += file_op.command()
        p = subprocess.Popen(
            cmd_base + file_commands,
            workdir=workdir,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, _ = p.communicate()
        exitcode = p.wait()
        if exitcode != 0:
            raise AdfotgError(stdout)
    finally:
        for file_op in file_ops:
            file_op.close()


def _api_int(i):
    return int(i) if i is not None else None
