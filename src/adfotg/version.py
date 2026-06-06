import sys

FULLNAME = "ADF On-The-Go"
SHORTNAME = "adfotg"
VERSION = "0.0.0"
YEARS = [2018, 2019, 2021, 2022, 2023, 2024, 2026]
YEARSPAN = "{} - {}".format(YEARS[0], YEARS[-1])

from importlib.metadata import version, PackageNotFoundError

try:
    VERSION = version(SHORTNAME)
except PackageNotFoundError:
    pass
