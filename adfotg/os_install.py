import os
import pwd
import subprocess
import sys
from pkg_resources import resource_exists, resource_string
from subprocess import PIPE
from tempfile import mkdtemp

_BINARY_PATH = '/usr/local/bin/adfotg'
_CONF_RESOURCE = 'conf/adfotg.conf'
_CONF_DESTINATION = '/etc/adfotg.conf'
_HOME_DIR = '/var/lib/adfotg'
_OS_USER = 'adfotg'


class InstallError(Exception):
    pass


def install():
    _check_preconditions()
    _install()


def _check_preconditions():
    if not _is_root():
        raise InstallError("must run as root")
    if not _has_binary('adfotg'):
        raise InstallError("adfotg not found")
    os_id = _os_id()
    _log("OS ID:", os_id)
    if os_id != 'Raspbian':
        raise InstallError("OS must be Raspbian")
    if not os.path.isdir("/lib/systemd"):
        raise InstallError("systemd not detected")
    if not _has_res(_CONF_RESOURCE):
        _log("install package doesn't have the base config file; "
             "'{}' won't be created".format(_CONF_DESTINATION))
    if not os.path.exists(_BINARY_PATH):
        raise InstallError("adfotg executable not found at expected "
                           " path: {}".format(_BINARY_PATH))


def _install():
    _add_user()
    _allow_user_sudo()
    _install_conf()
    _install_service()
    _goodbye()


def _add_user():
    try:
        pwd.getpwnam(_OS_USER)
        return
    except KeyError:
        _log("OS user '{}' already exists; skipping".format(_OS_USER))
        pass
    _log("Adding OS user '{}'".format(_OS_USER))
    empty_dir = mkdtemp()
    try:
        cmd = [
            'useradd',
            '--system',
            '--skel', empty_dir,
            '--home-dir', _HOME_DIR,
            '-g', 'nogroup',
            '-G', 'sudo',
            '--create-home',
            _OS_USER
        ]
        _log('Creating OS user: {}'.format(' '.join(cmd)))
        subprocess.check_call(cmd)
    finally:
        os.rmdir(empty_dir)


def _allow_user_sudo():
    _log("Allowing passwordless sudo for OS user '{}'".format(_OS_USER))
    with open('/etc/sudoers.d/010_adfotg-nopasswd', 'w') as out:
        out.write("adfotg ALL=(ALL) NOPASSWD: ALL\n")


def _install_conf():
    if os.path.exists(_CONF_DESTINATION):
        _log("{} already exists; skipping".format(_CONF_DESTINATION))
        return
    _log("Creating config file {}".format(_CONF_DESTINATION))
    try:
        conf = _res(_CONF_RESOURCE)
    except FileNotFoundError:
        return
    with open(_CONF_DESTINATION, 'wb') as out:
        out.write(conf)


def _install_service():
    _log("Installing 'adfotg.service' in systemd")
    with open('/lib/systemd/system/adfotg.service', 'w') as out:
        out.write(_SYSTEMD_SERVICE)
    subprocess.check_call(['systemctl', 'enable', 'adfotg.service'])


def _goodbye():
    _log("")
    _log("Installation complete!")
    _log("It should be possible to start adfotg with 'sudo service adfotg start'")
    _log("Log is available through 'journalctl -fu adfotg'")


def _is_root():
    return os.geteuid() == 0


def _has_binary(name):
    return subprocess.call(['which', name]) == 0


def _has_user(name):
    pass


def _os_id():
    res = subprocess.run(['lsb_release', '-s', '-i'], stdout=PIPE,
                         universal_newlines=True)
    return res.stdout.strip()


def _has_res(name):
    return resource_exists('adfotg', name)


def _res(name):
    return resource_string('adfotg', name)


def _log(*args):
    print(*args, file=sys.stderr)


_SYSTEMD_SERVICE = """[Unit]
Description=ADF On-The-Go
After=network.target

[Service]
ExecStart={binary}
User={user}
SyslogIdentifier=adfotg
StandardOutput=syslog
StandardError=syslog

[Install]
WantedBy=multi-user.target
""".format(binary=_BINARY_PATH, user=_OS_USER)
