# Vgradnja Sindie in Yahuarcoche v igro (docs/dirkalisca-celine.md, Predaja): sveta, testa in opisa sta zgrajena in shranjena v tools/<id>/,
# ker se uporabnik odloči po predstavitvi (9. 11. 2026). Poženi iz korena repozitorija: bash tools/yahuarcocha/vgradnja.sh
# Nato: reference (golden in races za obe progi z ohranitvijo starih ključev, WORLD_ONLY in PERF_ONLY), node tools/menu-lens.js,
# node tools/menu-globe.mjs, slike za meni (maketa-menija/orodja: dio2.mjs, mkwebp.py) za Yahuarcocho, node tools/menu-corner.mjs sindia,yahuarcocha,
# node tools/proge-pregled.js, stanje v docs/dirkalisca-celine.md, povezani testi, node tools/stamp.js --check.
set -e
cd "$(git rev-parse --show-toplevel)"
# 0. files back to the game's folders, the shared water helper (API.rbSea in world-rbring.js) and the documents' lines
for t in sindia yahuarcocha; do git mv tools/$t/world-$t.js js/world-$t.js; git mv tools/$t/$t.test.js tests/$t.test.js; done
patch -p1 < tools/yahuarcocha/rbsea.patch && patch -p1 < tools/yahuarcocha/vgradnja.patch
python3 - <<'PY'
import re
p='docs/kazalo.md'; s=open(p,encoding='utf-8').read()
s=re.sub(r" Proga še ni v igri \(odločitev uporabnika 9\. 11\. 2026: izbira po predstavitvi\):[^|]*\|", " |", s)
open(p,'w',encoding='utf-8').write(s)
PY
git rm -q tools/yahuarcocha/rbsea.patch tools/yahuarcocha/vgradnja.patch
# 1. track files from the builds
python3 -I tools/sindia/build.py | tail -1
python3 -I tools/yahuarcocha/build.py | tail -1
# 2. index.html: the track and world scripts after Abu Dabi's
python3 - <<'PY'
p='index.html'; s=open(p,encoding='utf-8').read()
for a, ids in (('<script src="js/tracks/abudabi.js"></script>\n', ('js/tracks/sindia.js', 'js/tracks/yahuarcocha.js')),
               ('<script src="js/world-abudabi.js"></script>\n', ('js/world-sindia.js', 'js/world-yahuarcocha.js'))):
    assert s.count(a) == 1
    add = ''.join('<script src="%s"></script>\n' % i for i in ids if i not in s)
    s = s.replace(a, a + add)
open(p, 'w', encoding='utf-8').write(s)
PY
grep -c "sindia\|yahuarcocha" index.html
# 3. run.js
grep -q "'sindia.test.js'" tests/run.js || sed -i "s/'abudabi.test.js'\]/'abudabi.test.js', 'sindia.test.js', 'yahuarcocha.test.js']/" tests/run.js
grep -c "'abudabi.test.js', 'sindia.test.js', 'yahuarcocha.test.js'\]" tests/run.js
# 4. menu: flags, lens bases, globe places and countries
sed -i "s/'hungary', 'uae'\]/'hungary', 'uae', 'senegal', 'ecuador']/" js/menu.js && grep -c "'uae', 'senegal', 'ecuador'\]" js/menu.js
sed -i "s/mogyorod: 236.4, abudabi: 5.1 };/mogyorod: 236.4, abudabi: 5.1, sindia: 39.6, yahuarcocha: 2200.2 };/" tools/menu-lens.js && grep -c "yahuarcocha: 2200.2" tools/menu-lens.js
sed -i "s/abudabi: \[24.46994, 54.605232\] };/abudabi: [24.46994, 54.605232], sindia: [14.6004, -17.0239], yahuarcocha: [0.3802, -78.0985] };/" tools/menu-globe.mjs && grep -c "sindia: \[14.6004" tools/menu-globe.mjs
sed -i "s/UAE: \['United Arab Emirates'\] };/UAE: ['United Arab Emirates'], Senegal: ['Senegal'], Ecuador: ['Ecuador'] };/" tools/menu-globe.mjs && grep -c "Ecuador: \['Ecuador'\]" tools/menu-globe.mjs
# 5. menu mock-up rows and corner clips (the camera found by the tool)
python3 - <<'PY'
import json
p='maketa-menija/orodja/proge_igra.json'; raw=open(p,encoding='utf-8').read(); d=json.loads(raw)
ids=[x[0] for x in d]; i=ids.index('abudabi')
for k, tid in enumerate(t for t in ('sindia','yahuarcocha') if t not in ids): d.insert(i+1+k, [tid, 'w_'+tid, dict(d[i][2])])
open(p,'w',encoding='utf-8').write(json.dumps(d, separators=(',',':'), ensure_ascii=False))
p='tools/menu-corners.json'; c=json.load(open(p,encoding='utf-8'))
c.setdefault('sindia', {'s': 2320, 'o': 'Ovinek pri baobabu'}); c.setdefault('yahuarcocha', {'s': 3320, 'o': 'Lasnica ob jezeru'})
open(p,'w',encoding='utf-8').write(json.dumps(c, ensure_ascii=False, indent=1)+'\n')
PY
git diff --stat maketa-menija/orodja/proge_igra.json tools/menu-corners.json
# 6. the graphics test: Yahuarcocha has water (the lake)
grep -q "'abudabi', 'yahuarcocha'\]" tests/browser/gfx.test.mjs || sed -i "10s/'zandvoort', 'abudabi'\]/'zandvoort', 'abudabi', 'yahuarcocha']/" tests/browser/gfx.test.mjs
grep -c "'abudabi', 'yahuarcocha'\]" tests/browser/gfx.test.mjs
