.PHONY: all clean clean-site clean-server distclean package publish server site
.NOTPARALLEL:

all: package

publish: clean site
	python3 ./setup.py sdist upload

package: site server

server:
	python3 ./setup.py sdist

clean-server:
	rm -rf adfotg/__pycache__
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
