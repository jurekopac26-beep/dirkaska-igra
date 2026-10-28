#!/bin/sh
# AV: rebuild the body, the stores, the bases and the pictures' scripts for forms $@ (1..6)
SD="$(cd "$(dirname "$0")" && pwd)"; P="$SD/../proposals"
sh "$SD/mkbody.sh" || exit 1
for k in "$@"; do sh "$P/mk_base_av$k.sh" && sh "$P/mk_av.sh" "$k" || exit 1; done
