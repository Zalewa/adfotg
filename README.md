<img align="left" src="/docs/icon.png">

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


<img align="left" src="/docs/warning.png">
<img align="right" src="/docs/warning.png">

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


<img align="right" width=400 src="/docs/mainpage.jpg">

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


Requirements
============

Software:

* Python 3
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
2. `mtools` are also essential

Commands:

```
  sudo apt update && sudo apt install mtools python3-pip
  sudo pip3 install adfotg
```


Update
------

```
  sudo pip3 install -U adfotg
```

adfotg needs to be restarted now. If you integrated it with your
Raspbian (see the section below), then it's sufficient to do this:

```
  sudo service adfotg restart
```


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


Preparing your Raspberry Pi
---------------------------

**This is mandatory.** Follow the instructions from
https://gist.github.com/gbaman/50b6cca61dd1c3f88f41
to enable dwc2 and g_mass_storage modules.

Hereby is a copy of the excerpt from the guide with adjustment
for `g_mass_storage` module.

1. We need to make sure we are using the dwc2 USB driver
   `echo "dtoverlay=dwc2" | sudo tee -a /boot/config.txt`
2. Enable it in Raspbian `echo "dwc2" | sudo tee -a /etc/modules`
3. Now pick which module you want to use from the list above,
   for ADF OTG we need `g_mass_storage`, so:
   `echo "g_mass_storage" | sudo tee -a /etc/modules`.
4. Reboot your RPi.

In case of trouble connecting with Gotek, you may try to
diagnose some problems by connecting the RPi to an USB socket
in a PC. When an USB drive image is mounted, the PC should see
the RPi as an USB drive.


Development
===========

Please see [CONTRIBUTING.md](CONTRIBUTING.md).


Troubleshooting
===============

**Problem:** Gotek perpetually displays `---` when connected to RPi,
even though it works with my usual USB drive.

**Solution:** `---` indicates that you have Cortex firmware installed on
your Gotek. See if you have `SELECTOR.ADF` on your USB drive. If yes,
this ADF must also be placed on every mount image you create in adfotg.


**Problem:** I upgraded to a new version, but there are oddities
happening or I don't see any changes.

**Solution:** There may be two reasons for this. Your browser might've
cached the old version of the site or the adfotg service wasn't
restarted. See the "Update" section in README to learn how to restart
the service and clear your browser cache.


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
