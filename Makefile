.PHONY: all clean package publish purge server site
.NOTPARALLEL:

all: package

publish: clean site
	python3 ./setup.py sdist upload

package: site server

server:
	python3 ./setup.py sdist

site:
	npm install
	npm run dist

clean:
	rm -rf adfotg/__pycache__
	rm -rf adfotg.egg-info build dist
	rm -rf adfotg/site
	rm -rf site/dist

purge: clean
	rm -rf node_modules
