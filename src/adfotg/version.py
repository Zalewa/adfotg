import sys

FULLNAME = "ADF On-The-Go"
SHORTNAME = "adfotg"
VERSION = "0.0.0"
YEARS = [2018, 2019, 2021, 2022, 2023, 2024]
YEARSPAN = "{} - {}".format(YEARS[0], YEARS[-1])

_metadata_fallback = sys.version_info < (3, 8, 1)
if _metadata_fallback:
    from importlib_metadata import version, PackageNotFoundError
else:
    from importlib.metadata import version, PackageNotFoundError

try:
    VERSION = version(SHORTNAME)
except PackageNotFoundError:
    pass
