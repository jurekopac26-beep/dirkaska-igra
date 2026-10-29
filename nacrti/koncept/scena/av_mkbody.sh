#!/bin/sh
# AV: concepts/_av_body.js = scratchpad/av/body_head.js (PNB's copy of S6A's machinery with its crack-pixel rule) + scratchpad/av/body_mine.js (my frames)
SD="$(cd "$(dirname "$0")" && pwd)"; cat "$SD/body_head.js" "$SD/body_mine.js" > "$SD/../proposals/concepts/_av_body.js" && echo "body ok"
