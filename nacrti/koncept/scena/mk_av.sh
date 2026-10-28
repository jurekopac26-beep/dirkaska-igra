#!/bin/sh
# AV (versions 1..6 of round AV): concepts/base_av<k>.js + concepts/_av_body.js -> concepts/av_<k>.js (the pictures)
#   sh mk_av.sh <k>
cd "$(dirname "$0")/concepts" || exit 1
k="$1"; B="base_av$k.js"; o="av_$k.js"; b="_av_body.js"
[ -f "$B" ] || { echo "no $B"; exit 1; }
cat "$B" "$b" > "$o" && echo "window.CONCEPT = window.CONCEPT_E;" >> "$o"
node -e "const s=require('fs').readFileSync('$o','utf8');const m=[...s.matchAll(/^(?:const|let|var|function)\s+([A-Za-z_\$][\w\$]*)/gm)].map(x=>x[1]);const c={};m.forEach(n=>c[n]=(c[n]||0)+1);const d=Object.entries(c).filter(([n,k])=>k>1);console.log(d.length?'DUP (rename yours): '+JSON.stringify(d):'no dups')"
node --check "$o" && echo "syntax ok: $o ($B)"
