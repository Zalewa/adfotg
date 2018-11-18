ADF On-The-Go (adfotg) is a HTTP service designed for use in a Raspberry
Pi Zero which is connected through its USB OTG port to a Gotek Floppy
Drive emulator in use in an Amiga computer. It allows to feed the Gotek
with fully programmable contents using a human-friendly user interface
that can be accessed from any web browser. It can prepare ADF images
from files, split big files into floppy-size chunks or just serve the
ADF images directly. It allows to store a bundle of ADF files on its
own drive and swap them freely.

```
  ----------- Linux ------------ USB --------- IDE ---------
  | ADF OTG |------>| RPi Zero |---->| Gotek |---->| Amiga |
  -----------       ------------     ---------     ---------
```


Security
========

**This is important!**
**There's no security provided by the app itself!**

It doesn't even put a basic HTTP authentication in place. When you host it
on your device, keep it in a private network without remote access.

This software requires **'root' privileges** to perform certain
operations. While it will run as normal user, it will abuse `sudo` to
do so. Ensure your RPi user can `sudo` without password prompt.


Status
======

Work-in-Progress. At the moment it's completely unusable.


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
