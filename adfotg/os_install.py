import os
import pwd
import subprocess
import sys
from pkg_resources import resource_exists, resource_string
from subprocess import PIPE
from tempfile import mkdtemp

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
    os_id = _os_id()
    _log("OS ID:", os_id)
    if os_id != 'Raspbian':
        raise InstallError("OS must be Raspberry Pi OS / Raspbian")
    if not os.path.isdir("/lib/systemd"):
        raise InstallError("systemd not detected")
    if not _has_res(_CONF_RESOURCE):
        _log("the install package doesn't have the base config file; "
             "'{}' won't be created".format(_CONF_DESTINATION))
    if not os.path.exists(_get_executable_path()):
        raise InstallError("adfotg executable not found at the expected "
                           " path: {}".format(_get_executable_path()))


def _install():
    _add_user()
    _allow_user_sudo()
    _install_conf()
    _install_service()
    _goodbye()


def _add_user():
    if _has_user(_OS_USER):
        _log("OS user '{}' already exists; skipping".format(_OS_USER))
        return
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
    # Remove itself from the pre-0.4.0 location, which should be reserved for
    # the distribution package manager
    if os.path.isfile("/lib/systemd/system/adfotg.service"):
        _log("Removing 'adfotg.service' from the /lib/systemd")
        os.unlink("/lib/systemd/system/adfotg.service")

    # Install the service at the system location for the administrator-installed
    # programs.
    _log("Installing 'adfotg.service' to /usr/local/lib/systemd")
    os.makedirs("/usr/local/lib/systemd/system", exist_ok=True)
    with open("/usr/local/lib/systemd/system/adfotg.service", 'w') as out:
        out.write(_SYSTEMD_SERVICE_TEMPLATE.format(
            binary=_get_executable_path(),
            user=_OS_USER
        ))
    subprocess.check_call(['systemctl', 'daemon-reload'])
    subprocess.check_call(['systemctl', 'enable', 'adfotg.service'])


def _goodbye():
    _log("")
    _log("Installation complete!")
    _log("It should now be possible to start adfotg with 'sudo systemctl start adfotg'")
    _log("Log is available through 'journalctl -fu adfotg'")


def _is_root():
    return os.geteuid() == 0


_executable = None
def _get_executable_path():
    global _executable
    if _executable is None:
        _executable = sys.argv[0]
        _log("adfotg executable is at: {}".format(_executable))
    return _executable


def _has_user(name):
    try:
        pwd.getpwnam(_OS_USER)
    except KeyError:
        return False
    return True


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


_SYSTEMD_SERVICE_TEMPLATE = """[Unit]
Description=ADF On-The-Go
After=network.target

[Service]
ExecStart={binary}
User={user}
SyslogIdentifier=adfotg

[Install]
WantedBy=multi-user.target
"""
