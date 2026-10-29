#!/bin/sh
# OZ3: renders O/oz3.js (the phone 412x915, DPR 1, the real UI, CAR=muscle) with my harness copy, ALL the frames in ONE browser session,
# one browser at a time (lock O/render.lock):   sh render.sh <frames> [outdir]  -> outdir/f<i>.png, outdir/log.txt
O="$(cd "$(dirname "$0")" && pwd)"; o="${2:-$O/out}"; only="$1"
mkdir -p "$o"; rm -f "$o/log.txt"; exec 9>"$O/render.lock"; flock 9
UI=1 W=412 H=915 DPR=1 CAR=muscle ONLY="$only" OUTLOG="$o/log.txt" timeout 9000 node "$O/harness_oz.mjs" "$O/oz3.js" "$o" 2>&1 | grep -v "Barvni bazen\|car split"
