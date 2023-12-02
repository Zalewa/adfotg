CONTRIBUTING
============

This file explains how to set up the development environment
for "ADF On-The-Go".

These instructions are optimized for a **Linux** Operating
System. Setting up the dev env on **Windows** is possible,
but you will need to inspect the `Makefile` and run the setup
steps by hand. Alternatively, you may use **WSL**.


Requirements
============

* Python 3, `venv` module
* nodejs, npm
* GNU Make (for convenience)

The rest of this document assumes that GNU Make is available. If not,
inspect the `Makefile` targets and run them by hand.


Packaging for Distribution
==========================

Meet the *Requirements* first, then:

```
make
```

This will create the source distribution and wheel packages
in the `dist/` directory. These are ready to be uploaded to PyPI
via `twine` or installed on the target system via:

```
pipx install dist/adfotg-*.whl
```


Setting up the Development Environment
======================================

ADF On-The-Go consists of two separate programs:

1. The HTTP REST API and static files server.
2. The website (the `site/` directory).

The server hosts the website and also hosts the REST API. For full
development, both must be set up. This can be done separately or
in one go.


Setup both the server and the website
-------------------------------------

```
make init
```

Then follow the individual instructions for **Server** and **Website**.


Server
------

The server is written in Python 3 and uses the Flask framework.

Open a new terminal window and run:

```
make dev-server
source .venv/bin/activate
FLASK_ENV=development adfotg -c conf/adfotg.conf
```

**The first** command initializes the development environment. It starts
from creating a virtualenv, by default in a `.venv` directory directly
in the source tree. Then it installs `adfotg` in this virtualenv in
the editable mode. It is possible to change this directory via
`VENV_NAME` make variable, but this guide assumes the default value.

**The second** command activates the virtualenv in the current terminal
window.

**The third** command runs the `adfotg` server.

`adfotg` can be stopped and then rerun as long as the virtualenv
remains activated. If you deactivate the virtualenv or close the
terminal window, you will have to `source` it again before running
`adfotg` again.

A startup failure may occur if directories configured in the .conf file
don't exist in the filesystem. Either adjust the .conf file or create
the directory. Assign to all directories you create the write `chmod`
for the user you run the program as.


Website
-------

Website is written in TypeScript and uses the React framework. All
setup is done via `npm`.

Open a new terminal window, **don't** activate the virtualenv.

Run:

```
make init-site
npm run dev
```


Running the app in development mode
===================================

The combined ADF On-The-Go **app** is the **website** running on the
`adfotg` **server**.

You need both the `adfotg` server and the website running in the
development mode, as described in the previous sections.

Then open the app in a web browser:
```
http://127.0.0.1:43164
```

The default port `43164` can be changed via server's config file
or `adfotg -p <port>` argument


Releasing a new version
=======================

This project adheres to Semantic Versioning.

The version needs to be bumped manually first in:

- `CHANGELOG.md`
- `package.json`
- `package-lock.json`

Bump these areas, then create a bump commit, substituting the
proper version number for `X.Y.Z`:

```
git commit -m "Bump to version X.Y.Z"
git push
```

Then tag the new version with the following steps:

```
git tag -am "adfotg vX.Y.Z" vX.Y.Z
git push --tags
```

The version number is read from `git describe` automatically by the power
of `setuptools_scm`.

To build the dist packages, run:
```
make clean
make
```

Then upload them with twine:

```
twine upload dist/adfotg-*
```


Cleaning up
===========

To remove the immediate build artifacts, run:
```
make clean
```

To remove the virtualenv and npm cache (`node_modules`), first
`deactivate` virtualenv, if any, then run:
```
make distclean
```
