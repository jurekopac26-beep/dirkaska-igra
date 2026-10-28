#!/bin/sh
# AV version 1: builds concepts/base_av1.js like mk_base_am2.sh, but with MY store copy concepts/_e_store2_av1.js (= a snapshot of AMA's
# _e_store2_am2.js + LF's lift patch (when its DONE file exists) + my AV block inside XC's markers: made by scratchpad/av/insert.py, run here first)
cd "$(dirname "$0")/concepts" || exit 1
python3 -I ../../av/insert.py 1 || exit 1
cat s.js _sk_body.js _sm_body.js _sw_body.js _menus_final.js _menus_win.js _sx_body.js _e_common.js _e_store2_av1.js > base_av1.tmp.js && node --check base_av1.tmp.js && mv base_av1.tmp.js base_av1.js && echo "base_av1.js rebuilt ($(wc -l < base_av1.js) lines)"
