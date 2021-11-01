.PHONY: all clean clean-site clean-server distclean package publish server site
.NOTPARALLEL:

all: package

publish: clean site
	python3 ./setup.py sdist upload

package: site server

server:
	python3 ./setup.py sdist

clean-server:
	find adfotg -type f -name '*.py[co]' -delete -o -type d -name __pycache__ -delete
	rm -rf adfotg.egg-info build dist

site:
	npm install
	npm run dist

clean-site:
	rm -rf adfotg/site
	rm -rf site/dist

clean: clean-site clean-server

distclean: clean
	rm -rf node_modules
