import os
import platform
import shlex
import subprocess
from enum import Enum

from adfotg.error import ActionError
from adfotg.mountimg import MountImage


class MountStatus(Enum):
    Mounted = "mounted"
    Unmounted = "unmounted"
    NoImage = "no_image"
    BadImage = "bad_image"
    OtherImageMounted = "other_image_mounted"


class Mount:
    @classmethod
    def current(cls):
        mounter = _mk_mounter()
        imagefile = mounter.mounted()
        return cls(imagefile)

    def __init__(self, mountfile):
        self._mounter = _mk_mounter()
        self._mountimage = MountImage(mountfile)

    @property
    def imagefile(self):
        return self._mountimage.imagefile

    def has_image(self):
        return self._mountimage.has_image()

    def state(self):
        mounted = self._mounter.mounted()
        if mounted == self.imagefile:
            if mounted is None:
                return MountStatus.Unmounted
            else:
                return MountStatus.Mounted
        elif not self._mountimage.exists():
            return MountStatus.NoImage
        elif mounted:
            return MountStatus.OtherImageMounted
        else:
            # Image exists but is not mounted.
            return MountStatus.Unmounted

    def mount(self):
        mount_state = self.state()
        if mount_state == MountStatus.Mounted:
            # Image is already mounted, no-op.
            return
        elif mount_state == MountStatus.OtherImageMounted:
            raise ActionError("an image is already mounted; unmount it first")
        elif mount_state == MountStatus.NoImage:
            raise ActionError("image doesn't exist, cannot mount")
        self._mounter.mount(self._mountimage.imagefile)

    def unmount(self):
        if self.state() != MountStatus.Mounted:
            raise ActionError("cannot unmount when not mounted")
        self._mounter.unmount()

    def list(self):
        if self._mountimage.exists():
            return self._mountimage.list()
        else:
            return []

    def delete_image(self):
        self._mountimage.delete()


class _RealMount:
    '''https://gist.github.com/gbaman/50b6cca61dd1c3f88f41

    root privileges are needed to manipulate kernel modules

    Currently mounted file is available in
    /sys/module/g_mass_storage/parameters/file
    '''
    def mounted(self):
        try:
            with open('/sys/module/g_mass_storage/parameters/file', 'r') as f:
                return f.read()
        except FileNotFoundError:
            return None

    def mount(self, imagefile):
        self.unmount()
        # It must be run with 'shell=True' as I couldn't figure
        # out how to make paths with whitespace work otherwise.
        cmd = ('sudo modprobe g_mass_storage file={} '
               'stall=0 removable=1'.format(
                   shlex.quote(imagefile)))
        subprocess.check_call(cmd, shell=True)

    def unmount(self):
        subprocess.check_call(['sudo', 'modprobe', '-r', 'g_mass_storage'])


class _FakeMount:
    # Mount state is global, this is true on the real
    # system, and should be true in the faker as well.
    _state = {
        'mounted': None
    }

    def mounted(self):
        return self._state['mounted']

    def mount(self, imagefile):
        self._state['mounted'] = imagefile

    def unmount(self):
        self._state['mounted'] = None


def _mk_mounter():
    if _is_faking_it():
        return _FakeMount()
    else:
        return _RealMount()


def _is_faking_it():
    # On RPi Zero platform.machine() returns 'armv6l'.
    return ('arm' not in platform.machine() or
            'ADFOTG_FAKE' in os.environ)
