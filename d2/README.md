# d2

For docs, more installation options and the source code see https://oss.terrastruct.com/d2

version: v0.6.5
os: linux
arch: amd64

Built with go1.22.2.

## Install

```sh
make install DRY_RUN=1
# If it looks right, run:
# make install
```

Pass `PREFIX=somepath` to change the installation prefix from the default which is
`/usr/local` or `~/.local` if `/usr/local` is not writable with the current user.

## Uninstall

```sh
make uninstall DRY_RUN=1
# If it looks right, run:
# make uninstall
```
