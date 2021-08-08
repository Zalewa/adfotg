#!/usr/bin/env python3
# coding: utf-8
from setuptools import setup
import subprocess
import os


def pipen(cmd):
    # It's a popen, but with pipes.
    return subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def out_to_str(out):
    return out.decode('utf-8', 'replace').strip()


def get_git_tag():
    git = pipen(['git', 'describe', '--abbrev=0'])
    stdout, stderr = git.communicate()
    exitcode = git.wait()
    if exitcode == 128:
        return None
    elif exitcode != 0:
        raise Exception('fail: {}'.format(out_to_str(stderr)))
    else:
        return out_to_str(stdout)


def get_git_describe(tag):
    '''Returns the describe part without the tag.'''
    git = pipen(['git', 'describe', '--always', '--long', '--dirty'])
    stdout, stderr = git.communicate()
    exitcode = git.wait()
    if exitcode != 0:
        raise Exception('fail: {}'.format(out_to_str(stderr)))
    if tag is not None:
        tagged = out_to_str(stdout)[len(tag):]
        # If we're building directly from the tag we don't
        # need git-describe. In fact, PyPI won't like it
        # as it violates PEP 440. Let's return empty.
        if tagged[:3] == "-0-" and "dirty" not in tagged:
            return ""
        version = "+" + tagged[1:]
    else:
        version = "+g" + out_to_str(stdout)
    return version.replace('-', '.')


with open('LICENSE') as f:
    license = f.read()

with open('README.md') as f:
    readme = f.read()

version = {}
with open('adfotg/version.py', 'r') as f:
    exec(f.read(), version)


version_string = version['VERSION']
if os.path.exists(".git"):
    version_string += get_git_describe(get_git_tag())


setup(
    name=version['SHORTNAME'],
    version=version_string,
    description='ADF On-The-Go - convert your RPi Zero to Gotek-ready USB disk',
    long_description=readme,
    long_description_content_type='text/markdown',
    author='Robikz',
    author_email='zalewapl@gmail.com',
    license=license,
    include_package_data=True,
    packages=['adfotg'],
    url='https://github.com/Zalewa/adfotg',
    python_requires='>=3.5',
    install_requires=[
        'amitools>=0.5,<0.7',
        'Flask',
    ],
    entry_points={
        'console_scripts': ['adfotg=adfotg.cli:main']
    }
)
