#!/bin/bash
# vec.sh OUT: 18 runs (cusco hiva tianmen x seeds 71..76), JSON lines into OUT; env HZX as in diag.js
OUT=$1; D=$(cd "$(dirname "$0")" && pwd)
: > $OUT
for t in cusco hiva tianmen; do for s in 71 72 73 74 75 76; do node $D/diag.js ${TRKI_SNAP:-$D/../../../../..} $t $s --sum | grep '^{' >> $OUT; done; done
