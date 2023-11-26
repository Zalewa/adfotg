# coding: utf-8
from setuptools import setup

setup(
    use_scm_version={
        'tag_regex': r'^(?P<prefix>v)(?P<version>[0-9\.]+)$'
    },
)
