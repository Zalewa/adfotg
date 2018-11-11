# coding: utf-8
from . import version
import adfotg

from optparse import OptionParser
import os
import sys

PROFILE_ENV = "ADFOTG_PROFILE"


def main():
    profile_file = os.environ.get(PROFILE_ENV)
    if profile_file:
        import yappi
        yappi.start()
    try:
        print_version()
        options = parse_args()
        if options.version:
            exit(0)
        print("", file=sys.stderr)
        adfotg.app.run(host='0.0.0.0', port=options.port)
    finally:
        if profile_file:
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
    opt_parser.add_option('-p', '--port', dest='port', type=int,
                          help='port on which to host the service')
    opt_parser.add_option('-V', '--version', dest='version', default=False,
                          action='store_true', help='display version and quit')
    options, _ = opt_parser.parse_args()
    return options
