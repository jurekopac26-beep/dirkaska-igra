#!/bin/sh
# OZ3: builds O/oz3.js = the shared bodies (P/concepts, read only) + MY copy of AV's version-1 store (O/store_av1_oz3.js) + body_head.js +
# EL-REGAL's / EL-FRONT's helpers + my OZ helpers (frames_oz.js cut before its frames) + MY copy of _card4.js + frames_oz3.js
O="$(cd "$(dirname "$0")" && pwd)"; C="$O/../proposals/concepts"
cd "$C" || exit 1
cat s.js _sk_body.js _sm_body.js _sw_body.js _menus_final.js _menus_win.js _sx_body.js _e_common.js "$O/store_av1_oz3.js" > "$O/base_oz3.tmp.js" && node --check "$O/base_oz3.tmp.js" && mv "$O/base_oz3.tmp.js" "$O/base_oz3.js" || exit 1
head -n 163 "$O/frames_oz.js" > "$O/oz_helpers.js"; cp "$C/wp_part.js" "$O/wp_part.js"
cat "$O/base_oz3.js" "$O/body_head.js" "$O/el_regal_part.js" "$O/el_front_part.js" "$O/oz_helpers.js" "$O/card4_copy.js" "$O/frames_oz2.js" "$O/tyre_pages_data.js" "$O/frames_oz3.js" > "$O/oz3.js" && echo "window.CONCEPT = window.CONCEPT_E;" >> "$O/oz3.js"
node -e "const s=require('fs').readFileSync('$O/oz3.js','utf8');const m=[...s.matchAll(/^(?:const|let|var|function)\s+([A-Za-z_\$][\w\$]*)/gm)].map(x=>x[1]);const c={};m.forEach(n=>c[n]=(c[n]||0)+1);const d=Object.entries(c).filter(([n,k])=>k>1);console.log(d.length?'DUP: '+JSON.stringify(d):'no dups')"
node --check "$O/oz3.js" && echo "syntax ok: oz3.js"
