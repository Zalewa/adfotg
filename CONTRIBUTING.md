CONTRIBUTING
============

This file explains how to set up the development environment
for "ADF On-The-Go".


Requirements
============

* Python 3
* Python 2 (xdftool needs it)
* nodejs, npm
* GNU Make (for building the release package)


Setting up the Development Environment
======================================

ADF On-The-Go consists of two separate programs:

1. The HTTP REST API and static files server (the `adfotg/` directory).
2. The website (the `site/` directory).

The server can run without the website, but not the other way around.

The server hosts the website and also hosts the REST API.

Development environments for the website and for the server
are set up separately.


Server
------

Server is written in Python 3 and uses the Flask framework.


Setup virtualenv with Python2 and Python3.

```
python3 -m virtualenv -p python2 ./venv
python3 -m virtualenv -p python3 ./venv
```


Activate the virtualenv

```
. ./venv/bin/activate
```


**From now on everything you do, do it in the activated virtualenv.**
**sudo is not needed**


Install direct dependencies.

```
pip3 install -r ./requirements.txt
```


Install amitools to get xdftool

```
pip2 install amitools
```


Link the program source code with your virtualenv

```
python3 ./setup.py develop
```

Run the program

```
adfotg -c conf/adfotg.conf
```

Startup failure may occur if directories configured in the .conf file
don't exist in the filesystem. Either adjust the .conf file or create
the directory. Assign to all directories you create the write `chmod`
for the user you run the program as.


Website
-------

Website is written in TypeScript and uses the React framework. If you're
like me, you probably think now that Private Pyle would find himself
at home here. Regardless, all setup is done through npm.

Run from the terminal (preferably in a new one, without the virtual env):

```
npm install
npm run dev
```


Building Release Package
========================

Tagging steps:

1. Bump the X.Y.Z version in adfotg/version.py and commit it.
2. Tag the bump commit using 'vX.Y.Z' tag with `-am "adfotg vX.Y.Z"` switch.
3. Push with `--tags`.
4. Build the release package.

To build the release package, run `make all` from the repo's root
directory. The package will appear in the `dist/` directory. This
package is ready to be `pip3 install`-ed or uploaded to the PyPI.
