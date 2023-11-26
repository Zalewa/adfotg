from flask import jsonify
from werkzeug.utils import safe_join

from adfotg import storage
from adfotg.error import ActionError


class Listing:
    def __init__(self, request):
        self._request = request

    @property
    def sorting(self):
        sort = self._request.args.get("sort", "name")
        direction = self._request.args.get("dir", "asc")
        return sort, direction

    @property
    def pagination(self):
        start = self._request.args.get("start")
        limit = self._request.args.get("limit")
        return self._validate_start(start), self._validate_limit(limit)

    def filter_name(self, name):
        pattern = self._request.args.get("filter")
        if pattern:
            pattern = pattern.strip().lower()
            if pattern:
                return pattern in name.lower()
        return True

    def limit(self, list_):
        start, limit = self.pagination
        if start is not None:
            list_ = list_[start:]
        if limit is not None:
            list_ = list_[:limit]
        return list_

    def _validate_start(self, start):
        if start is not None:
            try:
                start = int(start)
            except ValueError:
                raise ActionError("starting index must be a number")
            if start < 0:
                raise ActionError("starting index must be 0 or greater")
        return start

    def _validate_limit(self, limit):
        if limit is not None:
            try:
                limit = int(limit)
            except ValueError:
                raise ActionError("limit must be a number")
            if limit <= 0:
                raise ActionError("limit must be greater than 0")
        return limit


def apierr(code, message):
    return (
        jsonify({"error": message}),
        code,
        {'Content-Type': 'application/json'}
    )


def del_files(dirpath, filenames):
    deleted = []
    for filename in filenames:
        try:
            storage.unlink(safe_join(dirpath, filename))
        except FileNotFoundError:
            deleted.append((404, filename, "file not found"))
        except Exception as e:
            deleted.append((500, filename, str(e)))
    return deleted
