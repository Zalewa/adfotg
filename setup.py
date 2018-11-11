# coding: utf-8
from setuptools import setup

with open('LICENSE') as f:
    license = f.read()

with open('README.md') as f:
    readme = f.read()

version = {}
with open('adfotg/version.py', 'r') as f:
    exec(f.read(), version)

setup(
    name=version['SHORTNAME'],
    version=version['VERSION'],
    description='ADF On-The-Go - convert your RPi Zero to Gotek-ready USB disk',
    long_description=readme,
    author='Robikz',
    author_email='zalewapl@gmail.com',
    license=license,
    include_package_data=True,
    packages=['adfotg'],
    install_requires=[
        'Flask',
    ],
    entry_points={
        'console_scripts': ['adfotg=adfotg.cli:main']
    }
)
