#!/bin/bash
# all the helicopter flights (each goes on from its last frame drawn), one after another
cd "$(dirname "$0")"
for t in vrsic pikes ouninpohja gora jezero riviera monaco rbring suzuka spa nring; do
  echo "=== $t $(date +%H:%M)"
  node heli.mjs $t 2>&1 | grep -E "ready|planted|frame (0|300|600|900) |done|error|Error" | cut -c1-300
done
echo ALLDONE
