.PHONY: all clean publish purge server site
.NOTPARALLEL:

all: site server

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
