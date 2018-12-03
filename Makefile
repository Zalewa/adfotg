.PHONY: all clean purge server server_data site site_to_server


all: site_to_server server

server: server_data
	python3 ./setup.py sdist

server_data:
	mkdir -p adfotg/conf
	cp conf/adfotg.conf adfotg/conf/adfotg.conf

site:
	npm install
	npm run dist

site_to_server: site
	rm -f adfotg/site
	ln -s ../site/dist adfotg/site

clean:
	rm -rf adfotg/__pycache__
	rm -rf adfotg/conf adfotg/site adfotg.egg-info build dist
	rm -rf site/dist

purge: clean
	rm -rf node_modules
