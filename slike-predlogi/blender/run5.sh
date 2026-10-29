#!/bin/bash
# izriše podane misije iz miss5.py; drugi argument 'hitro' za predogled
cd "$(dirname "$0")/.."
Q=$1; shift
for m in "$@"; do
  echo "=== $m $(date +%T)"
  timeout 900 bl/bin/python gas/miss5.py $m gas/m5 $Q 2>&1 | grep -E "MISIJA|Error|error:|Traceback|File \"|line [0-9]+" | grep -v Deprecation | head -12
done
echo "KONEC $(date +%T)"
