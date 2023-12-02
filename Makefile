.PHONY: all clean clean-site clean-server dev distclean init package server site
.NOTPARALLEL:

all: package

package: site server

init:
	python3 -m pip install build

dev:
	python3 -m pip install -e .

server:
	python3 -m build

clean-server:
	find src/adfotg -type f -name '*.py[co]' -delete -o -type d -name __pycache__ -delete
	rm -rf src/adfotg.egg-info build dist

site:
	npm install
	npm run dist

clean-site:
	rm -rf src/adfotg/site
	rm -rf site/dist

clean: clean-site clean-server

distclean: clean
	rm -rf node_modules
	rm -rf .eggs
