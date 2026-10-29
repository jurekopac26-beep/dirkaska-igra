#!/bin/bash
# posnetki iz kamere igralca (Blizu) za podane misije; prvi argument 'hitro' ali 'koncno'
cd "$(dirname "$0")/.."
Q=$1; shift; [ "$Q" = "koncno" ] && Q=""
mkdir -p gas/k
for m in "$@"; do
  echo "=== $m $(date +%T)"
  timeout 900 bl/bin/python gas/kamera.py $m gas/k $Q 2>&1 | grep -E "KAMERA|Error|error:|Traceback|File \"|line [0-9]+|StopIteration" | grep -v Deprecation | head -12
done
echo "KONEC $(date +%T)"
