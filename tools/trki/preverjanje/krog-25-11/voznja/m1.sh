#!/bin/bash
cd "$(dirname "$0")"
T=spa,bathurst,montreal,sakhir,gora,kotor,furka,seoul,cusco,koli,killar,caracoles,chapman,balea,sacalobra,medeu,ella,llogara,luanda,mombasa
echo "== cv6 dez 1"; CV=6 TRACKS=$T SEEDS=9,21 SECS=90 OPTS='{"rain":1}' node cmp.js
echo "== cv6 zima"; CV=6 TRACKS=$T SEEDS=9,21 SECS=90 OPTS='{"winter":true}' node cmp.js
echo "== cv6 zima+dez"; CV=6 TRACKS=$T SEEDS=9 SECS=90 OPTS='{"winter":true,"rain":0.6}' node cmp.js
echo "== cv6 spremenljivo vreme, gume"; CV=6 TRACKS=$T SEEDS=9 SECS=90 OPTS='{"rain":0,"tyres":true,"weather":{"at":5,"dur":20,"to":1}}' node cmp.js
echo KONEC
