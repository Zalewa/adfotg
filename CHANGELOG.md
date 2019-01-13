# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- `SELECTOR.ADF`, if present in the ADF library, will now be
  automatically added to each created USB mount image.
- Mount images will now paginate with 50 images per page.
- adfotg logo added as favicon.
- Pictures added to README.md: icons and the website screenshot.
- Fill in missing API documentation. This doesn't mean that the
  API or documentation is final now.
- This CHANGELOG.


### Changed
- Search bar moved to the title bar. It's now possible to search in both
  ADF library and mount images.
- Adaptive title font size adjustment depending on the screen width.
- Subpage link will now take a separate row shared with the search bar.
  This makes the "Create ADFs" link less squishy on narrow screens.
- Customized checkboxes appearance - fits the general style of the page.
- Show a looking glass pictogram instead of "Search" text on the
  search button.
- Arrange left-right alignment of components in the title bar by using
  `flex-fill` CSS property instead of forcing right-alignment with
  `margin-left: auto`.

### Fixed
- Fill in missing information in installation instructions.
-- Add missing 'mtools', 'python-pip' and 'python3-pip' apt packages.
-- Explain how to prepare the Raspberry Pi to enable USB On-The-Go and
   USB stick faking with `dwc2` and `g_mass_storage`.
- Media queries for screen width were reversed internally.


## [0.1.1] - 2018-12-15
### Fixed
- xdftool crashes if its stdin has no encoding. Work around that by forcing
  `PYTHONIOENCODING` environment variable to 'utf-8'.

## [0.1.0] - 2018-12-15
First release of the program.

[Unreleased]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Zalewa/adfotg/compare/c2e8c51ad845fcf1d7d7a371235bafad8982e67b...v0.1.0
