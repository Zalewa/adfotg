from .error import ActionError, AdfotgError
from .storage import FileEntryField

from enum import Enum
import os
import platform
import time
import shlex
import subprocess


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
        if imagefile:
            return cls(imagefile)
        else:
            return None

    def __init__(self, mountfile):
        self._mounter = _mk_mounter()
        self._mountimage = MountImage(mountfile)

    @property
    def imagefile(self):
        return self._mountimage.imagefile

    def state(self):
        mounted = self._mounter.mounted()
        if mounted == self._mountimage.imagefile:
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


class MountImage:
    '''Requires mtools, because 'mount' requires root and mtools don't.'''
    # TODO do we need that? How much do we need that?
    _BUFFER_SPACE = 1024 * 1024
    _SECTORS_PER_TRACK = 32
    _SECTOR_SIZE = 512
    _SECTOR_ALIGNMENT = _SECTORS_PER_TRACK * _SECTOR_SIZE

    def __init__(self, imagefile):
        self._imagefile = imagefile

    @property
    def imagefile(self):
        return self._imagefile

    def delete(self):
        try:
            os.unlink(self._imagefile)
        except FileNotFoundError:
            pass

    def exists(self):
        return os.path.isfile(self._imagefile)

    def is_valid(self):
        try:
            self.list()
            return True
        except AdfotgError:
            return False

    def list(self):
        '''
        List contents of the image as FileEntry-compatible list
        of dicts.
        '''
        p = subprocess.Popen(['mdir', '-i', self._imagefile],
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = p.communicate()
        if p.wait() != 0:
            raise AdfotgError("'mdir' ended with non-zero exit code: {}".format(
                stderr))
        stdout = stdout.decode('utf-8')
        return _MdirParser().parse(stdout)

    def pack(self, files):
        sum_size = 0
        for file in files:
            sum_size += os.path.getsize(file)
        sum_size -= sum_size % self._SECTOR_ALIGNMENT
        sum_size += self._BUFFER_SPACE
        self.delete()
        self._create(size=sum_size)
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
            f.write(b'\0' * size)
        subprocess.check_call(['mkdosfs', self._imagefile])


class _RealMount:
    '''https://gist.github.com/gbaman/50b6cca61dd1c3f88f41

    root privileges are needed to manipulate kernel modules

    Currently mounted file is available in
    /sys/module/g_mass_storage/parameters/file
    '''
    def __init__(self, imagefile):
        self._imagefile = imagefile

    def mounted(self):
        try:
            with open('/sys/module/g_mass_storage/parameters/file', 'r') as f:
                return f.read()
        except FileNotFoundError:
            return None

    def mount(self, imagefile):
        self.unmount()
        subprocess.check_call(
            ['sudo', 'modprobe', 'g_mass_storage',
             'file={}'.format(shlex.quote(imagefile)),
             'stall=0', 'removable=1'])

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


class _MdirParser:
    '''
    Parses output like this one:

      Volume in drive : has no label
      Volume Serial Number is 6515-5815
      Directory for ::/

      BARBAR~1 ADF    901120 2018-11-24  22:44  Barbarian Plus 6.adf
      EOBAGA~1 ADF    901120 2018-11-24  22:44  Eob AGA z ppa01.adf
      GENESIA1 ADF    901120 2018-11-24  22:44  Genesia1.adf
              3 files           2 703 360 bytes
                                1 024 000 bytes free

    and returns it as storage.FileEntryField compatible list of dicts.
    '''
    def parse(self, output):
        listing = []
        has_directory = False
        for line in output.split("\n"):
            if not line:
                continue
            if "::/" in line:
                # Detect line that says "Directory for ::/"
                has_directory = True
                continue
            if not has_directory:
                # Skip until directory listing begins.
                continue
            try:
                entry = self.parse_entry(line)
            except ValueError:
                # This may be a bad idea.
                pass
            else:
                if entry is not None:
                    listing.append(entry)
        return listing

    def parse_entry(self, line):
        '''
        Example entry:
          BARBAR~1 ADF    901120 2018-11-24  22:44  Barbarian Plus 6.adf
        '''
        NAME_EXT_LEN = 16
        line = line[NAME_EXT_LEN:]
        size = int(line[:line.find(' ')])
        line = line[line.find(' ') + 1:]
        # Products of a drunken stupor.
        date = line[:line.find('  ', line.find('  ') + 2)]
        # Programmers know how to party hard.
        name = line[len(date) + 2:]
        timestamp = time.mktime(time.strptime(date, "%Y-%m-%d  %H:%M"))
        return FileEntryField.dictify(name, size, int(timestamp))


def _mk_mounter():
    if _is_faking_it():
        return _FakeMount()
    else:
        return _RealMount()


def _is_faking_it():
    # On RPi Zero platform.machine() returns 'armv6l'.
    return ('arm' not in platform.machine() or
            'ADFOTG_FAKE' in os.environ)
