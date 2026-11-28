#!/bin/bash
cd "$(dirname "$0")"
T=spa,gora,kotor,koli,killar,pikes,pikesg,seoul
M=kolibri,formula,ev,truck,levs,strega,jezek,cisterna
for W in '{}' '{"rain":1}' '{"winter":true}' '{"rain":0,"tyres":true,"weather":{"at":5,"dur":20,"to":1}}'; do
  echo "== sam cv6 $W"; CV=6 NAI=0 SECS=60 TRACKS=$T MODS=$M OPTS="$W" node cmp.js
done
for W in '{"damage":0,"rain":1}' '{"damage":1,"winter":true}'; do
  echo "== sam cv6 $W"; CV=6 NAI=0 SECS=60 TRACKS=spa,kotor,koli,pikesg MODS=kolibri,formula,truck,levs OPTS="$W" node cmp.js
done
for W in '{"rain":1}' '{"winter":true}'; do
  echo "== sam cv1 $W"; CV=1 NAI=0 SECS=60 TRACKS=spa,kotor,koli,pikesg MODS=kolibri,formula,truck,levs OPTS="$W" node cmp.js
done
echo KONEC
