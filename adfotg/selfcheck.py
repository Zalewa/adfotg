'''
This module implements the self-check API.
'''
import os
import subprocess
import traceback

from .config import config


def self_check():
    return {
        'rpi': _check_rpi(),
        'g_mass_storage': _check_mass_storage(),
        'mtools': _check_mtools(),
        'xdftool': _check_xdftool(),
        'storage': _check_storage()
    }


def _catch_error(func):
    def _catcher(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            traceback.print_exc()
            return str(e)
    return _catcher


@_catch_error
def _check_rpi():
    '''Credits: https://raspberrypi.stackexchange.com/a/74541'''
    try:
        with open('/proc/cpuinfo', 'r') as cpuinfo:
            for line in cpuinfo:
                if line.startswith('Hardware'):
                    label, value = line.strip().split(':', 1)
                    value = value.strip()
                    if value not in ['BCM2708', 'BCM2709',
                                     'BCM2835', 'BCM2836']:
                        return (
                            'This system does not appear to be a '
                            'Raspberry Pi.'
                        )
                    else:
                        return ''
            return ('Could not find hardware information -- '
                    'this program may not be running on a Raspberry Pi.')
    except IOError as e:
        return 'Unable to open `/proc/cpuinfo`: {}'.format(e)
    return ''


@_catch_error
def _check_mass_storage():
    if 0 != _call(['modinfo', 'g_mass_storage']):
        return 'g_mass_storage Kernel module not found'
    return ''


@_catch_error
def _check_mtools():
    commands = ['mdir', 'mcopy', 'mkdosfs']
    return _check_commands(commands)


@_catch_error
def _check_xdftool():
    return _check_command('xdftool')


@_catch_error
def _check_storage():
    return _check_errors(_check_dir_writeable, config.all_workspace_dirs)


def _check_commands(cmds):
    return _check_errors(_check_command, cmds)


def _check_command(name):
    if 0 != _call(['which', name]):
        return '{} not found on $PATH'.format(name)
    return ''


def _check_dir_writeable(dirpath):
    if not os.path.isdir(dirpath):
        return "'{}' does not exist or is not a directory".format(dirpath)
    if not os.access(dirpath, os.W_OK):
        return "'{}' directory exists but is not writeable".format(dirpath)
    if not os.access(dirpath, os.R_OK):
        return "'{}' directory exists but is not readable".format(dirpath)
    return ''


def _check_errors(checker, elems):
    return '\n'.join(
        [error for error in map(checker, elems) if error])


def _call(command):
    devnull = subprocess.DEVNULL
    return subprocess.call(
        command,
        stdout=devnull,
        stderr=devnull,
        stdin=devnull)
