#!/bin/bash
cd "$(dirname "$0")"
T6=spa,kotor,seoul,montreal,killar,koli
echo "== splet (setCrash net, setTest {}) proti main, razbijanje 60 s"; NET=1 CV=0 SETUP=crash DRIVE=1 TRACKS=$T6 SECS=60 node cmp.js
echo "== cv1 skoda 0, razbijanje 60 s"; CV=1 SETUP=crash DRIVE=1 TRACKS=$T6 SECS=60 OPTS='{"damage":0}' node cmp.js
echo "== cv1 skoda 1 (samo videz), razbijanje 60 s"; CV=1 SETUP=crash DRIVE=1 TRACKS=$T6 SECS=60 OPTS='{"damage":1}' node cmp.js
TF=cusco,vaoala,seoul,mombasa
echo "== do cilja cv1 skoda 0 suho"; CV=1 TRACKS=$TF SECS=260 OPTS='{"damage":0}' node cmp.js
echo "== do cilja cv1 skoda 0 dez"; CV=1 TRACKS=$TF SECS=260 OPTS='{"damage":0,"rain":1}' node cmp.js
echo "== do cilja cv1 skoda 0 zima"; CV=1 TRACKS=$TF SECS=260 OPTS='{"damage":0,"winter":true}' node cmp.js
echo "== do cilja splet skoda 2 dez"; NET=1 CV=0 TRACKS=$TF SECS=260 OPTS='{"rain":1}' node cmp.js
echo "== do cilja sam cv6 dez in zima"; CV=6 NAI=0 TRACKS=cusco,vaoala,seoul MODS=rally,formula,truck SECS=260 OPTS='{"rain":1}' node cmp.js; CV=6 NAI=0 TRACKS=cusco,vaoala,seoul MODS=rally,formula,truck SECS=260 OPTS='{"winter":true}' node cmp.js
echo KONEC
