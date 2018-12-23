from . import app, api, version

from flask import url_for

import urllib


class _Spec:
    def __init__(self):
        self._routes = self._get_routes()

    def to_text(self):
        lines = []
        for url in self._api_urls:
            for route in self._apis_for_url(url):
                lines.append("{} -- {}".format(url, ",".join(route.methods)))
                if route.doc:
                    lines.append(route.doc)
            lines.append("")
        doc = '\n\n'.join([_preamble(), api.__doc__, '== Endpoints =='])
        doc += '\n\n'
        doc += '\n'.join(lines)
        return doc

    def _get_routes(self):
        return [_Route(rule) for rule in app.url_map.iter_rules()]

    @property
    def _apis(self):
        return [r for r in self._routes if r.api_func is not None]

    @property
    def _api_urls(self):
        all_urls = set([r.url for r in self._apis])
        return sorted(list(all_urls))

    def _apis_for_url(self, url):
        def _sortkey(rule):
            methods = rule.methods
            known_methods = ['GET', 'DELETE', 'POST', 'PUT']
            for m in known_methods:
                if m in rule.methods:
                    return m
            return methods[0]
        return sorted([r for r in self._apis if r.url == url],
                      key=_sortkey)


class _Route:
    def __init__(self, rule):
        self.args = rule.arguments
        self.endpoint = rule.endpoint
        self.methods = [m for m in rule.methods
                        if m not in ['OPTIONS', 'HEAD']]
        self.url = urllib.parse.unquote(url_for(
            rule.endpoint, **self._format_args(self.args)))
        try:
            self.api_func = getattr(api, self.endpoint)
        except AttributeError:
            self.api_func = None
        if self.api_func:
            self.doc = self.api_func.__doc__

    def _format_args(self, args):
        return {arg: "{" + arg + "}" for arg in args}


def _preamble():
    return "{} version {} ({})".format(version.FULLNAME, version.VERSION, version.YEARSPAN)


spec = _Spec()
