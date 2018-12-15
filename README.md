!!! HARDWARE DAMAGE RISK !!!
============================

**CUT THE +5V LINE FROM THE USB CABLE!**

This line will connect the voltage from the Raspberry Pi and
power up your Gotek and your Amiga. When Amiga PSU is OFF, the Amiga
will be put in a strange half-state with LEDs lighting up but the
computer remaining off. The RPi will also reboot. When Amiga PSU is
ON, the +5V USB line will prevent the Amiga's Power LED from dimming
when Amiga reboots.

**FOR SAFETY MEASURES, CUT THE +5V LINE! I DID IN MINE.**


ADF On-The-Go
=============

ADF On-The-Go (adfotg) is a HTTP service designed for use in a Raspberry
Pi Zero which is connected through its USB OTG port to a Gotek Floppy
Drive emulator in use in an Amiga computer. It allows to feed the Gotek
with fully programmable contents using a human-friendly user interface
that can be accessed from any web browser. It can prepare ADF images
from files, split big files into floppy-size chunks or just serve the
ADF images directly. It allows to store a bundle of ADF files on its
own drive and swap them freely.

```
  ----------- Linux ------------  USB  --------- IDE ---------
  | ADF OTG |------>| RPi Zero |------>| Gotek |---->| Amiga |
  -----------       ------------ no+5V ---------     ---------
```


Security
========

**This is important!**
**There's no security provided by the app itself!**

It doesn't even put a basic HTTP authentication in place. When you host it
on your device, keep it in a private network without remote access.

This software requires **'root' privileges** to perform certain
operations. While the application will run as a normal user, it will abuse
`sudo` to obtain root privileges when needed. Ensure your RPi user can `sudo`
without password prompt.


Status
======

Work-in-Progress.

The first version of the program is finished. It now goes through
some touch-ups, small fixes and general testing. The UI is also
gradually being adapted towards better display on mobile devices.


Requirements
============

Software:

* Python 3
* Python 2 (for xdftool)
* mtools
* sudo privileges

Hardware:

* Raspberry Pi Zero
* Gotek
* An Amiga


Install
=======

This program is designed to be run on a *Raspberry Pi Zero* with the Raspbian
Operating System. Installing the release package on anything else is not
recommended, although will succeed and should be harmless (no warranty).

Provided you have the Raspberry Pi Zero, do the following:

1. `pip3 install adfotg`
2. `xdftool` is essential but needs to be installed separately.
   This can be installed from `pip2 install amitools`

The adfotg package is not in PyPI, yet.


Integrating with Raspbian
-------------------------

After pip3 install:

```
  sudo adfotg --install
```

This will:

1. Add 'adfotg' system user to Raspbian and allow this user a
   password-less sudo privilege.
2. Create adfotg's default config file in `/etc/adfotg.conf`.
3. Create adfotg's base directory at `/var/lib/adfotg`.
4. Add `adfotg.service` to systemd; adfotg will start with the system.



Development
===========

Please see [CONTRIBUTING.md](CONTRIBUTING.md).


Background
==========

[Gotek](http://www.gotek.in/) is a hardware floppy-drive replacement for
legacy machines. Instead of using failure-prone floppy disks, it allows
to use a USB flash drive with floppy-disk images. Multiple images can
be stored on a single flash drive and Gotek allows by default to choose
between them through buttons located on the case. While Gotek is an
excellent device that eradicates the inconvenience of floppy disks,
it not only doesn't solve the inconvenience of disk swapping but makes
it worse by replacing labeled floppy-disks with incomprehensible
ordinal numbers (from 0 to 999).


[Raspberry Pi Zero](https://www.raspberrypi.org/) is a cheap mini-computer
that can run Linux. It has two major features that are in use in this project:

* WiFi
* USB On-The-Go

While WiFi (or any Ethernet connection) is used here as the access layer
to the ADF On-The-Go software, USB On-The-Go is the real enabler. While
it has many applications, we are only interested in one. It allows to
make the RPi appear to be an USB flash drive - a flash drive which
contents we can fully control and change on-the-fly using Linux command
line tools and which we can program to serve the content we want.

Guide for setting up OTG mode on Raspberry Pi can be found here:
https://gist.github.com/gbaman/50b6cca61dd1c3f88f41


[amitools](https://github.com/cnvogelg/amitools/) contains xdftool,
with which adfotg is capable of manipulating ADF image files to
some extent.


REST API
========

REST API documentation is currently a Work-In-Progress.
adfotg is capable of providing the documentation for itself
in a plain-text format through the `/help` endpoint.
