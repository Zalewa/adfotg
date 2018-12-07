'''
This module implements the self-check API.
'''
import subprocess


def self_check():
    return {
        'rpi': _check_rpi(),
        'g_mass_storage': _check_mass_storage(),
        'mtools': _check_mtools(),
        'xdftool': _check_xdftool()
    }


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


def _check_mass_storage():
    if 0 != _call(['modinfo', 'g_mass_storage']):
        return 'g_mass_storage Kernel module not found'
    return ''


def _check_mtools():
    commands = ['mdir', 'mcopy', 'mkdosfs']
    errors = _check_commands(commands)
    return '\n'.join(errors)


def _check_xdftool():
    return _check_command('xdftool')


def _check_commands(cmds):
    return [error for error in map(_check_command, cmds) if error]


def _check_command(name):
    if 0 != _call(['which', name]):
        return '{} not found on $PATH'.format(name)
    return ''


def _call(command):
    devnull = subprocess.DEVNULL
    return subprocess.call(
        command,
        stdout=devnull,
        stderr=devnull,
        stdin=devnull)
