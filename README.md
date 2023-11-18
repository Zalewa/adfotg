<img align="left" src="/docs/icon.png">

ADF On-The-Go
=============

**ADF On-The-Go (adfotg)** converts your **Raspberry Pi Zero** into an
USB drive with a web interface. It organises your **ADF** images and
allows you to bundle one or more of them into **virtual USB drives**.
You can swap, download, upload and mount ADFs without ever disconnecting
the USB cable from your **Gotek**, all from any modern web browser.

**ADF On-The-Go (adfotg)** is a HTTP service designed for use in a
**Raspberry Pi Zero**. The RPi must be connected through its USB OTG
port to a **Gotek** Floppy Drive emulator in an **Amiga** computer.
ADF On-The-Go can prepare ADF images from files, split big files into
floppy-sized chunks, or just mount the ADF images directly. It allows to
store bundles of ADF files on their own virtual USB drives and swap
multiple virtual USB drives freely. All of this is controlled through a
website interface, by default hosted on a HTTP port **41364**.

There also is a REST API, if you happen to not like the default UI, but
its current status is **unstable**.

```
  ----------- Linux ------------  USB  --------- IDE ---------
  | ADF OTG |------>| RPi Zero |------>| Gotek |---->| Amiga |
  -----------       ------------ no+5V ---------     ---------
```


<img align="left" src="/docs/warning.png">
<img align="right" src="/docs/warning.png">

!!! HARDWARE DAMAGE RISK !!!
============================

**CUT OR BLOCK THE +5V LINE IN THE USB CABLE!**

This line connects the voltage from the Raspberry Pi to Gotek and powers
up your Gotek and your Amiga. This is **undesirable**. When Amiga PSU is
OFF, the Amiga will be put in a strange half-state with LEDs lighting up,
but the computer remaining off. The RPi will also reboot. When Amiga PSU
is ON, the +5V USB line will prevent the Amiga's Power LED from dimming
when Amiga reboots.

**FOR SAFETY MEASURES, CUT OR BLOCK THE +5V LINE!**


<img align="right" width=400 src="/docs/mainpage.jpg">

Security
========

**This is important!**
**There's no network security provided by the app itself!**

It doesn't even put a basic HTTP authentication in place. When you host it
on your device, keep it in a private network without remote access.

This software requires **'root' privileges** to perform certain
operations. While the application will run as a normal user, it will abuse
`sudo` to obtain root privileges when needed. Ensure your RPi user can `sudo`
without password prompt.


Requirements
============

Adfotg supports Raspberry Pi OS 12 (bookworm) since version 0.4.0.

Software:

* Raspberry Pi OS 12 (bookworm) or newer
* Python 3, pipx
* mtools

Hardware:

* Raspberry Pi Zero
* Gotek
* An Amiga

OS:

* `sudo` privileges will be required


Preparing your Raspberry Pi
===========================

**This is mandatory.**

We need to make sure we are using the dwc2 USB driver,
and that `dwc2` and `g_mass_storage` modules are enabled.

If you have a fresh Raspberry Pi OS, it's enough to do:

```
  echo dtoverlay=dwc2 | sudo tee -a /boot/config.txt
  echo dwc2 | sudo tee -a /etc/modules
  echo g_mass_storage | sudo tee -a /etc/modules`
```

Then reboot your RPi.

The above is based on https://gist.github.com/gbaman/50b6cca61dd1c3f88f41

In case of trouble with connecting to Gotek, you may try to
diagnose the USB problems by connecting the RPi to an USB socket
in a PC. When an USB drive image is mounted, the PC should see
the RPi as an USB drive.


Install
=======

This program is designed to be run on a **Raspberry Pi Zero** with the
*Raspberry Pi OS*. Installing the release package on anything else is not
recommended, although will succeed and should be harmless (no warranty).

On your Raspberry Pi:

```
  sudo apt update && sudo apt install mtools pipx
  sudo PIPX_HOME=/opt/adfotg PIPX_BIN_DIR=/usr/local/bin pipx install adfotg
```

The first time installation may be lengthy (it's only a **Zero**, after all).


Integrating with Raspberry Pi OS
--------------------------------

After `pipx install adfotg` is done, run:

```
  sudo adfotg --install
```

This will:

1. Add 'adfotg' system user to Raspberry Pi OS and allow this user a
   password-less sudo privilege.
2. Create adfotg's default config file in `/etc/adfotg.conf`.
3. Create adfotg's base directory at `/var/lib/adfotg`.
4. Add `adfotg.service` to systemd; adfotg will start with the system.


Update
------

Make sure you do this logged in as the same OS user that you
used during the installation.

```
  sudo PIPX_HOME=/opt/adfotg PIPX_BIN_DIR=/usr/local/bin pipx upgrade adfotg
```

Adfotg needs to be restarted now. If you integrated it with your
*Raspberry Pi OS* (see the section below), then it's sufficient to
do this:

```
  sudo systemctl restart adfotg
```


Uninstall
=========

Adfotg needs to be uninstalled manually and this is even more involved
than installing. Depending on how far you've went with installation and
what you wish to keep, you may be skipping some steps.

* First of all, stop the service:

```
  sudo systemctl stop adfotg
```

* If you wish to uninstall, and then install adfotg again, do:

```
  sudo PIPX_HOME=/opt/adfotg PIPX_BIN_DIR=/usr/local/bin pipx uninstall adfotg
```

This will keep the internal Python setup, your config and your ADF/USB library.
Then proceed as if installing for the first time.

* To remove the internal Python setup, do:

```
  sudo rm -rf /opt/adfotg
```

* To uninstall from systemd and to remove the adfotg OS user:

```
  sudo rm /usr/local/lib/systemd/system/adfotg.service
  sudo systemctl daemon-reload
  sudo deluser adfotg
```

* To remove the config:

```
  sudo rm /etc/adfotg.conf
```

* To remove your ADF and USB images library:

```
  sudo rm -rf /var/lib/adfotg
```


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


**Problem:** This software ceases to work after the system upgrade.

**Solution:** Sorry, both Raspberry Pi OS and the Python rules for
software distribution and installation tend to change. Reinstalling
adfotg from scratch may help. Other than that, contact me for more
help.


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
some extent. Adfotg doesn't depend on amitools, but incorporates
a subset of its source code and installs `adfotg-xdftool` as a separate
tool.


REST API
========

REST API documentation is currently a Work-In-Progress.
adfotg is capable of providing the documentation for itself
in a plain-text format through the `/help` endpoint.
