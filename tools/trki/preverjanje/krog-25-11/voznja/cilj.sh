#!/bin/bash
cd "$(dirname "$0")"
echo "== do cilja cv1 skoda 0, cusco, 16 semen (vrstni red cilja, finishPos, finishTime)"; CV=1 TRACKS=cusco SEEDS=1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17 SECS=120 OPTS='{"damage":0}' node cmp.js
echo "== do cilja cv1 skoda 0, vaoala, 8 semen"; CV=1 TRACKS=vaoala SEEDS=1,2,3,4,5,6,7,8 SECS=160 OPTS='{"damage":0}' node cmp.js
echo "== do cilja cv1 skoda 0, cusco 20 tekmecev, 6 semen"; CV=1 NAI=20 TRACKS=cusco SEEDS=1,2,3,4,5,6 SECS=120 OPTS='{"damage":0}' node cmp.js
echo KONEC
