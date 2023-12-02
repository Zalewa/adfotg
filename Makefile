.PHONY: all clean clean-server clean-site distclean \
    dev dev-server \
    init init-server init-site \
    package server site
.NOTPARALLEL:

VENV_NAME ?= .venv

# Main targets
all: package

package: site server

init: init-server init-site

dev: dev-server init-site

clean: clean-site clean-server

distclean: clean
	rm -rf node_modules
	rm -rf .eggs
	rm -rf .venv

# Server targets
init-server: $(VENV_NAME)/bin/activate

dev-server: init-server
	$(VENV_NAME)/bin/pip install -e .

server: init-server
	$(VENV_NAME)/bin/python -m build

clean-server:
	find src/adfotg -type f -name '*.py[co]' -delete -o -type d -name __pycache__ -delete
	rm -rf src/adfotg.egg-info build dist

# Site targets
init-site: node_modules

site: node_modules
	npm install
	npm run dist

clean-site:
	rm -rf src/adfotg/site
	rm -rf site/dist

# Real targets (impl details)
node_modules:
	@echo "Creating NodeJS node_modules ..."
	npm install

$(VENV_NAME)/bin/activate:
	@echo "Creating virtual environment ..."
	python3 -m venv $(VENV_NAME)
	@echo "Installing build dependencies ..."
	$(VENV_NAME)/bin/pip install -U pip setuptools wheel build
	@echo "Virtual environment created. Activate using it source $(VENV_NAME)/bin/activate"
