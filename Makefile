.PHONY: all clean clean-server clean-webui distclean \
    dev dev-server \
    init init-server init-webui \
    package server webui
.NOTPARALLEL:

VENV_NAME ?= .venv

# Main targets
all: package

package: webui server

init: init-server init-webui

dev: dev-server init-webui

clean: clean-webui clean-server

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

# Web UI targets
init-webui: webui/node_modules

webui: init-webui
	cd webui && npm install
	cd webui && npm run build

clean-webui:
	rm -rf src/adfotg/webui
	rm -rf webui/dist

# Real targets (impl details)
webui/node_modules:
	@echo "Creating NodeJS node_modules ..."
	cd webui && npm install

$(VENV_NAME)/bin/activate:
	@echo "Creating virtual environment ..."
	python3 -m venv $(VENV_NAME)
	@echo "Installing build dependencies ..."
	$(VENV_NAME)/bin/pip install -U pip setuptools wheel build
	@echo "Virtual environment created. Activate using it source $(VENV_NAME)/bin/activate"
