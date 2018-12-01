.PHONY: all clean purge server site site_to_server


all: site_to_server server

server:
	python3 ./setup.py sdist

site:
	npm install
	npm run dist

site_to_server: site
	cp -R site/dist adfotg/site

clean:
	rm -rf adfotg/__pycache__
	rm -rf adfotg/site adfotg.egg-info build dist
	rm -rf site/dist

purge: clean
	rm -rf node_modules
