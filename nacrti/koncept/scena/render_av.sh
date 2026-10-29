#!/bin/sh
# AV: renders concepts/av_<k>.js (the phone 412x915, the real UI, CAR=muscle) with my harness copy harness_av.mjs, ONE browser at a time
# (a lock: scratchpad/av/render.lock):   sh render_av.sh <k> <frames> [DPR] [outdir]  -> scratchpad/av/out_<k>/f<i>.png, log_f<i>.txt
# (env passes through: CLIP NOSHOT)
cd "$(dirname "$0")" || exit 1
SD="$(cd .. && pwd)/av"; k="$1"; c="concepts/av_$k.js"; o="${4:-$SD/out_$k}"; only="$2"; d="${3:-1}"
mkdir -p "$o"; exec 9>"$SD/render.lock"; flock 9
for f in $(echo "$only" | tr ',' ' '); do rm -f "$o/log_f$f.txt"; UI=1 W=412 H=915 DPR="$d" CAR=muscle ONLY="$f" OUTLOG="$o/log_f$f.txt" timeout 7000 node harness_av.mjs "$c" "$o" 2>&1 | grep -v "Barvni bazen\|car split"; done
