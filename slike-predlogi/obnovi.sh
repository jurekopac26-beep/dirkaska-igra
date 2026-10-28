#!/usr/bin/env bash
# Obnovi delo »samo v slikah« v novi seji: kopira slike-predlogi/delo v delovno mapo (scratchpad) nove seje, popravi absolutne poti,
# pripravi kopijo igre (fw4 = ta veja + fw4-predaja.patch) in v vrsto postavi celotno nalaganje vseh sprememb (traja ~30 min).
# Uporaba: bash slike-predlogi/obnovi.sh /pot/do/scratchpad
set -euo pipefail
NEW="${1:?podaj pot do nove delovne mape (scratchpad)}"; NEW="${NEW%/}"
OLD='/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad'
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/.." && pwd)"
mkdir -p "$NEW/live"
cp -r "$HERE/delo/." "$NEW/"
cp "$HERE/izbire.md" "$NEW/izbire.md"
# absolutne poti stare seje -> nova mapa
grep -rl "$OLD" "$NEW" --include='*.mjs' --include='*.js' --include='*.py' | while read -r f; do sed -i "s#$OLD#$NEW#g" "$f"; done
# kopija igre: ta veja na commitu 6f1e48c + lokalne spremembe (newmap.js, game.js) iz slik
if [ ! -d "$NEW/fw4" ]; then git -C "$REPO" worktree add --detach "$NEW/fw4" 6f1e48c9; git -C "$NEW/fw4" apply "$HERE/fw4-predaja.patch"; fi
# vrsta za celotno nalaganje (vrstni red je pomemben)
rm -f "$NEW"/live/q*.mjs "$NEW"/live/q*.done
printf "import L from '%s/lv249.mjs';\nexport default { tag: 'rt1', list: L.list.slice(1) };\n" "$NEW" > "$NEW/live/q1.mjs"
n=2; for k in 1192 1193 1194 1195 1196 1197; do cp "$NEW/vrsta/q$k.mjs" "$NEW/live/q$n.mjs"; n=$((n+1)); done
cp "$NEW/restore-rt13.mjs" "$NEW/live/q$n.mjs"
echo "Pripravljeno. Zaženi: (cd '$NEW' && GAME_ROOT='$NEW/fw4' nohup node live2.mjs > live.out 2>&1 &)"
echo "Ko je live/q$n.done, je igra naložena z vsemi spremembami (preveri: grep -a 'HELI22' live/q$n.done)."
