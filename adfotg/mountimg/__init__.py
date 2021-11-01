import os
import time
import subprocess

from adfotg.error import AdfotgError
from adfotg.storage import FileEntryField


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

    def has_image(self):
        return self._imagefile is not None

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
        if not isinstance(files, list):
            raise ValueError("files argument must be a list")
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
            self._mcopy(file, destdir)

    def unpack_file(self, file, destfile):
        if os.path.isdir(destfile):
            raise AdfotgError("target path '{}' is a directory".format(
                destfile))
        self._mcopy(file, destfile)

    def _mcopy(self, file, dest):
        subprocess.check_call(['mcopy', '-i', self._imagefile, '-n',
                               '::/{}'.format(file), dest])

    def _create(self, size=64 * 1024 * 1024):
        with open(self._imagefile, 'wb') as f:
            f.write(b'\0' * size)
        subprocess.check_call(['mkdosfs', self._imagefile])


class _MdirParser:
    '''
    Parses output like this one:

      Volume in drive : has no label
      Volume Serial Number is 6515-5815
      Directory for ::/

      5years1         901120 2018-12-02  20:30
      5years1  adf    901120 2018-12-02  20:30
      adfotg1  adf    901120 2018-12-02  20:30
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

        Another example entry:
          5years1  adf    901120 2018-12-02  20:30

        Yet another example entry without an extension:
          5years1         901120 2018-12-02  20:30


        The entry without the long name gets listed when the filename
        fits in the 8.3 DOS limitation and doesn't have a whitespace
        character.
        '''
        DOS_NAME_LEN = 8
        DOS_EXT_LEN = 3
        DOS_LEN = DOS_NAME_LEN + 1 + DOS_EXT_LEN  # NAME DOT EXT
        dos_name = line[:DOS_LEN]

        line = line[DOS_LEN:]
        size_start_index = self._find_index_of_first_non_space(line, 0)
        if size_start_index < 0:
            raise ValueError("cannot parse line '{}' as file entry: "
                             "size not found".format(line))
        size_end_index = line.find(' ', size_start_index)
        size = int(line[size_start_index:size_end_index])
        line = line[size_end_index + 1:]  # +1 space
        # Products of a drunken stupor.
        date = line[:line.find('  ', line.find('  ') + 2)]
        # Programmers know how to party hard.
        name = line[len(date) + 2:]
        if not name:
            # We have the case where the name fit in the DOS limitations
            # and we need to parse dos_name.
            name = dos_name[:DOS_NAME_LEN].strip()
            ext = dos_name[DOS_NAME_LEN + 1:].rstrip()  # 1 is for the dot
            if ext:
                name += "." + ext
        timestamp = time.mktime(time.strptime(date, "%Y-%m-%d  %H:%M"))
        return FileEntryField.dictify(name, size, int(timestamp))

    def _find_index_of_first_non_space(self, haystack, start):
        for i in range(start, len(haystack)):
            if haystack[i] != ' ':
                return i
        return -1
