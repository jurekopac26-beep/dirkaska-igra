#!/bin/bash
# Ponovitev dela B pregleda »voznja« (voznja/m1.sh) z drevesom s popravkom fizika-2 namesto posnetka veje.
# Zagon: TRKI_SNAP=<drevo veje s fizika-2.patch> TRKI_MAIN=<drevo main> bash m1-f2.sh   (izpis: m1-f2.log)
cd "$(dirname "$0")"
T=spa,bathurst,montreal,sakhir,gora,kotor,furka,seoul,cusco,koli,killar,caracoles,chapman,balea,sacalobra,medeu,ella,llogara,luanda,mombasa
echo "== cv6 dez 1"; CV=6 TRACKS=$T SEEDS=9,21 SECS=90 OPTS='{"rain":1}' node ../voznja/cmp.js
echo "== cv6 zima"; CV=6 TRACKS=$T SEEDS=9,21 SECS=90 OPTS='{"winter":true}' node ../voznja/cmp.js
echo "== cv6 zima+dez"; CV=6 TRACKS=$T SEEDS=9 SECS=90 OPTS='{"winter":true,"rain":0.6}' node ../voznja/cmp.js
echo "== cv6 spremenljivo vreme, gume"; CV=6 TRACKS=$T SEEDS=9 SECS=90 OPTS='{"rain":0,"tyres":true,"weather":{"at":5,"dur":20,"to":1}}' node ../voznja/cmp.js
echo KONEC
