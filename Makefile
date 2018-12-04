.PHONY: all clean purge server site


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

purge: clean
	rm -rf node_modules
