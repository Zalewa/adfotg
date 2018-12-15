# coding: utf-8
from . import config, version
from .os_install import install, InstallError
import adfotg

from optparse import OptionParser
import os
import sys

PROFILE_ENV = "{}_PROFILE".format(version.SHORTNAME)


def main():
    profile_file = os.environ.get(PROFILE_ENV)
    if profile_file:
        # If profiling is enabled, start it.
        import yappi
        yappi.start()
    try:
        print_version()
        # Parse config.
        options = parse_args()
        if options.version:
            exit(0)
        print("", file=sys.stderr)
        if options.install:
            try:
                install()
            except InstallError as e:
                print("Install failed: {}".format(e), file=sys.stderr)
            exit(0)
        try:
            config.load(options.cfgfile)
        except config.ConfigError as cfg_error:
            print(cfg_error, file=sys.stderr)
            exit(1)
        # Run app.
        port = options.port or config.config.port
        adfotg.app.run(host='0.0.0.0', port=port)
    finally:
        if profile_file:
            # If profiling was enabled, stop it and generate reports.
            yappi.stop()
            pstats = yappi.convert2pstats(yappi.get_func_stats())
            pstats.dump_stats(profile_file)
            with open(profile_file + ".threads", "w") as threads_file:
                yappi.get_thread_stats().print_all(threads_file)


def print_version(file=sys.stderr):
    print("{} ({}) {} ({})".format(
        version.FULLNAME, version.SHORTNAME,
        version.VERSION, version.YEARSPAN),
        file=file)
    print("On MIT License; no warranty", file=file)


def parse_args():
    opt_parser = OptionParser()
    opt_parser.add_option(
        '-c', '--cfg', dest='cfgfile',
        help=('path to config file; by default looks in: {}' .format(
            ', '.join(config.DEFAULT_CONFIG_LOCATIONS))))
    opt_parser.add_option(
        '-p', '--port', dest='port', type=int,
        help='port on which to host the service (overrides config)')
    opt_parser.add_option(
        '--install', dest='install', default=False, action='store_true',
        help='Integrate adfotg with the Raspbian Operating System')
    opt_parser.add_option(
        '-V', '--version', dest='version', default=False,
        action='store_true', help='display version and quit')
    options, _ = opt_parser.parse_args()
    return options
