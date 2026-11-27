#!/bin/bash
# fizika-2, krog 27. 11.: veriga meritev na enem drevesu. Zagon: bash veriga.sh <pred|po> <drevo> <drevo main>
# Izpisi: <meritev>-<pred|po>.log v tej mapi, izhodne kode v veriga-<pred|po>.stanje. Skripte: ../../krog-25-11/f2/ in ../../krog-25-11/voznja/.
# KORAKI="sam13 vreme" omeji verigo na naštete korake (stanje se takrat dopiše).
cd "$(dirname "$0")"; O=$PWD; TAG=$1; ROOT=$2; MAIN=$3; F2=$O/../../krog-25-11/f2
[ -z "$KORAKI" ] && : > veriga-$TAG.stanje
KORAKI=${KORAKI:-"start-race start-upg start-demo start-formula start-lm sam13 sam1 vreme"}
run() { local ime=$1; shift; case " $KORAKI " in *" $ime "*) ;; *) return;; esac; ( "$@" ) > $O/$ime-$TAG.log 2>&1; echo "$ime $?" >> $O/veriga-$TAG.stanje; }
export TRKI_F2=$ROOT F2ROOT=$ROOT TRKI_MAIN=$MAIN
VSE=$(node -e "const {loadCore}=require('$ROOT/tests/lib/core.js');console.log(loadCore('$ROOT').TRACKS.filter(t=>!t.test&&!t.pending).map(t=>t.id).join(','))")
for s in race upg demo formula lm; do run start-$s env SET=$s node $F2/start.js; done
run sam13 env TRACKS=$VSE NAI=12 SECS=20 node $F2/sam.js
run sam1 env TRACKS=$VSE SECS=60 node $F2/sam.js
run vreme env TRKI_SNAP=$ROOT bash $F2/m1-f2.sh
echo KONEC >> veriga-$TAG.stanje
