from collections import OrderedDict

from . import app, api, version


class _Spec:
    def __init__(self):
        self._routes = self._get_routes()

    def to_text(self):
        endpoints = OrderedDict()
        for url in self._api_urls:
            for route in self._apis_for_url(url):
                if route.endpoint not in endpoints:
                    lines = []
                    lines.append('{} -- {}'.format(url, ','.join(route.methods)))
                    if route.doc:
                        lines.append(route.doc.strip())
                    endpoints[route.endpoint] = lines
                else:
                    lines = endpoints[route.endpoint]
                    lines.append('Alias: {}'.format(url))
        doc = '\n\n'.join([_preamble(), api.__doc__, '== Endpoints =='])
        doc += '\n\n'
        for lines in endpoints.values():
            doc += '\n'.join(lines) + '\n\n'
        return doc.strip() + '\n'

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
        self.url = rule.rule
        try:
            self.api_func = app.view_functions[rule.endpoint]
        except KeyError:
            self.api_func = None
        if self.api_func and not self.api_func.__module__.endswith('.api'):
            self.api_func = None
        if self.api_func:
            self.doc = self.api_func.__doc__

    def _format_args(self, args):
        return {arg: "{" + arg + "}" for arg in args}


def _preamble():
    return "{} version {} ({})".format(version.FULLNAME, version.VERSION, version.YEARSPAN)


spec = _Spec()
