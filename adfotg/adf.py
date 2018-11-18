from .error import ActionError, AdfotgError
from .util import Interpretable

from enum import Enum
import os
import platform
import shlex
import subprocess


MOUNT_FILENAME = "adfmount"


class MountStatus(Enum):
    Mounted = "mounted"
    Unmounted = "unmounted"
    NoImage = "noimage"
    BadImage = "badimage"


class UnmountType(Interpretable, Enum):
    Discard = 'discard'
    Save = 'save'


class Mount:
    def __init__(self, mountfile):
        if _is_faking_it():
            self._mounter = _FakeMount(mountfile)
        else:
            self._mounter = _RealMount(mountfile)
        self._mountimage = _MountImage(mountfile)

    def state(self):
        mounted = self._mounter.is_mounted()
        if mounted:
            return MountStatus.Mounted
        elif not self._mountimage.exists():
            return MountStatus.NoImage
        else:
            # Image exists but is not mounted.
            return MountStatus.Unmounted

    def mount(self, files=None):
        if self._mounter.is_mounted():
            raise ActionError("image is already mounted; unmount it first")
        if files:
            self._mountimage.pack(files)
        self._mounter.mount()

    def unmount(self):
        if not self._mounter.is_mounted():
            raise ActionError("cannot unmount when not mounted")
        self._mounter.unmount()

    def list(self):
        if self._mountimage.exists():
            return self._mountimage.list()
        else:
            return []

    def delete_image(self):
        self._mountimage.delete()

    def save_image_contents(self, destdir):
        self._mountimage.unpack(destdir)


class _MountImage:
    '''Requires mtools, because 'mount' requires root and mtools don't.'''
    # TODO do we need that? How much do we need that?
    _BUFFER_SPACE = 4 * 1024 * 1024

    def __init__(self, imagefile):
        self._imagefile = imagefile

    def delete(self):
        try:
            os.unlink(self._imagefile)
        except FileNotFoundError:
            pass

    def exists(self):
        return os.path.isfile(self._imagefile)

    def list(self):
        p = subprocess.Popen(['mdir', '-b', '-i', self._imagefile],
                             stdout=subprocess.PIPE)
        stdout, _ = p.communicate()
        if p.wait() != 0:
            raise AdfotgError("'mdir' ended with non-zero exit code")
        stdout = stdout.decode('utf-8')
        # Crop the leading '::/' from the output.
        return [entry[len("::/"):]
                for entry in stdout.split("\n")
                if entry.strip()]

    def pack(self, files):
        sum_size = 0
        for file in files:
            sum_size += os.path.getsize(file)
        self.delete()
        self._create(size=sum_size + self._BUFFER_SPACE)
        for file in files:
            subprocess.check_call(['mcopy', '-i', self._imagefile,
                                   file, '::'])

    def unpack(self, destdir):
        files = self.list()
        for file in files:
            subprocess.check_call(['mcopy', '-i', self._imagefile, '-n',
                                   '::/{}'.format(file), destdir])

    def _create(self, size=64 * 1024 * 1024):
        with open(self._imagefile, 'wb') as f:
            f.write('\0' * size)
        subprocess.check_call(['mkdosfs', self._imagefile])


class _RealMount:
    '''https://gist.github.com/gbaman/50b6cca61dd1c3f88f41

    root privileges are needed to manipulate kernel modules
    '''
    def __init__(self, imagefile):
        self._imagefile = imagefile

    def is_mounted(self):
        with open('/proc/modules', 'r') as mods:
            for line in mods:
                if not line:
                    # Can this ever happen?
                    continue
                name = line.split(" ")[0]
                if name == "g_mass_storage":
                    return True
        return False

    def mount(self):
        subprocess.check_call(
            ['sudo', 'modprobe', 'g_mass_storage',
             'file={}'.format(shlex.quote(self._imagefile)),
             'stall=0'])

    def unmount(self):
        subprocess.check_call(['sudo', 'modprobe', '-d', 'g_mass_storage'])


class _FakeMount:
    # Mount state is global, this is true on the real
    # system, and should be true in the faker as well.
    _state = {
        'mounted': False
    }

    def __init__(self, imagefile):
        self._imagefile = imagefile

    def is_mounted(self):
        return self._state['mounted']

    def mount(self):
        self._state['mounted'] = True

    def unmount(self):
        self._state['mounted'] = False


def _is_faking_it():
    # On RPi Zero platform.machine() returns 'armv6l'.
    return ('arm' not in platform.machine() or
            'ADFOTG_FAKE' in os.environ)
