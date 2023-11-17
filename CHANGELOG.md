# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Incorporate the source code of `amitools` and `xdftool` into adfotg,
  because we don't need whatever amitools is trying to compile and can't.
  Thank you, Christian Vogelgsang, for creating these amazing tools, but
  I really need just this minimal part of them. This should fix problems
  with installing the `amitools` package, and this fix should be ultimate.
- A 404 page that simulates the Amiga's RECOVERY ALERT.

### Changed
- Restructure the API URLs. All API URLs are now prefixed with /api.
  Some URLs have been changed.
- Load the UI's compiled nodejs libraries as a separate javascript file.
- The mount images inspector is now a separate page with its own URL.
- Rely on the `body` element to render the GURU MEDITATION error page's
  background instead of overlaying the normal `body` with a fullscreen div.
- Stretch the UI main area background 100% to the bottom, even if there's
  less vertical content.

### Fixed
- Install: the 'OS user already exists' message appeared when the
  user didn't actually exist.
- Stick werkzeug to versions 2.x so that Flask 2.1.x remains compatible.

## [0.3.1] - 2022-05-18
### Fixed
- Adapt to Flask 2.1.x and stick the requirements to Flask 2.1.x.

## [0.3.0] - 2021-08-08
### Changed
- Use amitools 0.6.0 which support Python 3. Python 2 no longer necessary.
- Set the minimal supported Python version to 3.5.
- Update the npm packages.
- Update the UI code to React 17: update the component lifecycle methods.
- Font is now in the "res/" directory together with other UI resources.

### Fixed
- Fix crash on checking if value is part of an enum in Python 3.8.

## [0.2.0] - 2019-01-20
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
- Change action buttons that operate on mount images.
  Actions that operate on a singular mount image are now presented
  as inline buttons in each row of the "Mount Images" tables. This
  includes "Inspect" and "Mount" actions. The actions of the buttons
  are represented by pictograms: a looking glass and the USB trident,
  respectively. Unmount button has been moved to the area that
  represents the currently mounted image.
- Font in file tables will now be smaller on narrow screens.

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

[Unreleased]: https://github.com/Zalewa/adfotg/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/Zalewa/adfotg/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Zalewa/adfotg/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Zalewa/adfotg/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/Zalewa/adfotg/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Zalewa/adfotg/compare/c2e8c51ad845fcf1d7d7a371235bafad8982e67b...v0.1.0
