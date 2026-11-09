**1. Gradnja sveta in višine**

PREVERJENO (prebrano, Node, brskalnik):
- Tema `killar` → `World.ext.killar` → `buildUncompahgre` (js/world-killar.js:1196-1197, lastna kopija, stikalo `UNK`). Vzorčenje core.js:153-164: N = 2375, ds = 1,99981 m (len 4747,55 m, startIdx 65, finishIdx 2255).
- Cestišče :427-456: prečno 5 točk `offs = [-w, -w/2, 0, w/2, w]` (4 trakovi po 2,25 m), vzdolžno 1 segment na vzorec, kosi po 60 segmentov (120 m, 40 kosov). Višina vsake točke je `Pt(i,o,y) = T.hy[i] + y` (:409), y = 0,02; prečnega člena ni.
- Bankina: (w; +0,012) → (w+0,5; −0,02). Rob in jarek `vProf` :419-425: 5 točk relativno na `T.hy[i]`, zunanji dve na `unGround`.
- Fizika `elevAt` (core.js:1063-1070) je linearna med istimi vzorci, torej mreža = fizika (+0,02 m).
- Samodejno sledijo `T.hy`:
  - most: krov je ista mreža, rob krova `vProf` −0,02…−1,4; ograje Killar nima (:829-830 `if (UNK) continue`);
  - lesena ograja: `at(s,o)` :1121 linearno iz `T.hy`, stebri na 3 m, letvi med njimi (slika s strani potrjuje);
  - portali, snežni koli `T.hy[i] − 0,25` :839, `propFloor` :840;
  - table, hiše, ljudje, parkirani avti, stebri mrež stojijo na `unGround`;
  - promet: `v.y` linearno iz `T.hy` (core.js:4854), nagib `atan(T.grade[v.i])` po vzorcu (render.js:6637).
- Teren: `unH` :44-67, `hr = caNear.h − 0,3`, `h = dd ≤ 1 ? hr : lerp(hr, vrFar, sstep(1, 42, dd))`, `h = min(h, env)`. `caNear` (world-caracoles.js:28-45): uteži `(1/(dd+1,5))⁴`, v tabeli le vsak drugi vzorec (world-vrsic.js:41), mreža terena 5 m.
- Izmerjeno z 97 poskusnimi grbinami: desno (pobočje) teren sledi grbini 0,91× pri 3 m za črto ovire, 0,73× pri 8 m, 0,48× pri 15 m, 0,24× pri 25 m, ~0,1× pri 40 m. Levo (prepad) 0,67× pri 3 m, dlje ~0.
- Teren ceste nikjer ne prebije: najmanjša razdalja pod cestiščem je 0,269 m na 115 024 točkah, enako brez grbin in z grbinami do ±0,46 m.

NE sledi ali se premakne (PREVERJENO, razen kjer piše DOMNEVA):
- a) `def.rock`: glej 3.
- b) Zaščitne mreže: odseke izbira prag `vrFar − T.hy[i]` (`at(6) > 2 && r16 > 10`, odsek ≥ 5 točk, skupaj < 520 m, po vrsti od štarta; :643-656). Že dve grbini 0,3 m pri 918 in 945 m mrežo tam skrajšata (slika).
- c) Raztros po celi progi: zaporedni generatorji (drevesa `rng(5561)` :950, šopi :1005, skale :1032, kamni :1047) z zavrnitvami po `unSlope` in `excluded`. Ista dva vzorca grbin spremenita sliko pri 2600 m na 5,5 % pik (skale, drevesa, šopi; cesta, ograja, portal, ljudje enaki). Svet: 1556 mrež / 1 065 394 oglišč → 1556 / 1 061 704 (zmerno) → 1560 / 1 043 841 (močno).
- d) Ploščadi izogibališč in ob štartu/cilju so ravne na višini enega vzorca (`T.hy[i] − 0,22` :369, `− 0,25` :362). Nič ne lebdi, a med robom ceste in ploščadjo nastane brežina do višine grbine.
- e) Črti štarta/cilja (1,6 m) in kontrolnih točk (0,5 m) :458-464 imata oglišča na najbližjem vzorcu + 0,045/0,042. Pri naklonu 4,3 % je konec črte do ~0,04 m narobe, torej na meji pogrezanja.
- f) Luže `buildPuddles` (render.js:3985-3992): ena ploskev 1,8–5,8 m, oglišča `T.hy[T.idx(s ± L/2)] + 0,035`. DOMNEVA: na temenu sredina potone za ⅛·k·L² ≈ 0,07 m pri 0,3 m × 6 m; pri t = 0,5 s v dežju luž še ni, zato ni slike.
- g) Nočni snop žarometov: glej 5.

**2. Senčenje**

PREVERJENO:
- `quadUp → quadO → triO → tri` (js/world.js:135-200) dela neindeksirane trikotnike z ravno normalo ploskve iz geometrije; »Up« samo usmeri.
- Cestišče: `rMat` :414 (Phong, makadam + bumpMap 0,05, vertexColors). Barva oglišč `shade` :429 je `k = 0,86 − 0,12·exp(−(o − rl)²/5,5)`, ob robu −0,04; reliefa ne upošteva.
- Sonce (−0,496; 0,743; 0,449). Kamera 30 m za avtom, ~36° navzdol; `cam.gy` sledi `c.roadY` s 5/s (render.js:9898).
- Poskus pri s = 900 m, grbini 0,3 m × 6 m (po filtru 0,279 m, naklon do 4,4 %): svetlost cestišča na temenu se spremeni za 0–1 od 255, torej je grbina nevidna. Tudi 0,5 m × 4 m (0,43 m, 8,3 %) da le komaj opazne prečne pasove; rob ceste je videti enak.
- S proste kamere od strani in nizko se grbine vidijo (teme zakrije cesto, ograja valovi).
- Prototip v pomnilniku, različica P1: `k *= clamp(1 + 0,35·b − 4·b″; 0,7; 1,2)` (b = višina samih grbin v m, b″ = druga odvod v 1/m). Teme je svetlejše za +7…+16/255 (≈ +6–13 %) in se s kamere za avtom vidi kot svetlejša lisa; kotanje bi po isti formuli potemnele (v sliki sta bili samo grbini). Brez grbin množi z natanko 1; dodatnih oglišč in klicev ni.
- Različica P2 = P1 + gladke normale (`quadON`) s 3× pretiranim naklonom grbin: skoraj enako kot P1. Gladke normale brez grbin slike vidno ne spremenijo (največ 8/255 na posameznih pikah), a niso bitno enake, zato sodijo za varovalo.
- `relRoad` v drugi veji (`clamp(1 + hb·3,5; 0,62; 1,15)·clamp(1 − 0,07·cv; 0,8; 1,08)`) je umerjen na centimetrski relief; pri ±0,3 m nasiči.

**3. tools/killar-skala.mjs**

PREVERJENO:
- V brskalniku (`?proga=killar&nacin=kronometer&t=0.5`) bere `Render.world.groundH` (= `unGround`, world-killar.js:318) in linearno interpoliran `T.hy` na 2,5 m, obe strani, od `bl/br + 1,5` do `w + 11` po 0,25 m.
- Stena je, kjer `inBld || (h ≥ 0,5 && gh(o+1) − h ≥ 0,35) || h ≥ 1`, h = tla − `T.hy`.
- Brez `--check` orodje PIŠE vrstico `rock:` v js/tracks/killar.js. `--check` izpiše OK/FAIL, toleranca 0,3 m, izhod 1 ob FAIL; traja 17 s.

| Stanje | `--check` | Odseki | Vzorci > 0,3 m (od 759) | Stena izgine / nova |
|---|---|---|---|---|
| danes | OK, 0,00 m | 24 (1897,5 m) | 0 | 0 / 0 |
| 97 grbin, \|h\| 0,15–0,3 m, w 5–8 m | FAIL 1,80 m (desno pri 1412,5 m) | 26 | 15 (2,0 %), 4 nad 1 m | 10 m / 7,5 m |
| 97 grbin, \|h\| 0,25–0,5 m, w 4–6 m | FAIL 2,10 m | 26 | 38 (5,1 %) | 27,5 m / 2,5 m |

Po dodanih grbinah je treba `rock` preračunati.

**4. Obremenitev**

PREVERJENO:
- tests/golden/perf.json:373: calls 141 (max 169), kverts 273 (max 350), jsMs 2,06.
- `perf.test.mjs` pade pri max klicih > 191 (169·1,1 + 5) ali max ogliščih > 405 tisoč (350·1,1 + 20) ter nad 300 / 900 tisoč.
- Cestne mreže, izmerjeno: cestišče 56 976 oglišč (40 × 1440), bankini 28 488 (40 × 720), rob 113 952 (40 × 2880). Skupaj 199 416 = 84 oglišč na 2 m; sence sprejemajo, ne mečejo jih.
- Gostejša mreža ni potrebna: fizika je linearna med istimi 2 m vzorci. Končni filter (polmer 1) zniža vrh pri w = 6 m na 0,279/0,30 (−7 %), pri w = 4 m na 0,427/0,50 (−15 %).

DOMNEVA: w < 4 m se zgladi preveč. V kadru so 2–4 kosi ceste (10–20 tisoč oglišč, 4–7 % kadra); po kadru ni merjeno, perf z grbinami ni pognan.

**5. Prah, sledi, sence, žarometi**

PREVERJENO (branje, snop tudi slika):
- Sledi gum: `skids.add(…, last[2], yb)`, `yb = c.y` (render.js:9481, 9530-9533); v zraku jih ni.
- Prah: `particles.emit(px, 0,3 + yb, …)` :9547; obroč ob pristanku na `c.roadY`.
- Okrogla senca: `v.blob.position.y = (c.roadY − c.y) + 0,05` :6932 (med skokom ostane na tleh); prave sence padajo na mrežo ceste.
- Nagib avta: `atan(c.gradeNow)` :6924. Posedanja karoserije ob grbini v izrisu ni, samo tresljaj kamere ob pristanku.
- Snop žarometov `beams` :4592-4604 je ravna ploskev 9 × 22 m v okvirju avta. Nočna slika: že grbina 0,3 m × 6 m ga 10 m pred temenom prereže (temen pas), 4 m pred in 3 m za temenom je cel; pri 0,5 m × 4 m je luknja velika.

**6. Slika s kamere za avtom**

PREVERJENO, pognano:
- Ukaz: `node tools/shot.mjs killar --m 900 --lezece --out <mapa>` → `killar-900m-lezece.png`, 640×360, deviceScaleFactor 1, brez HUD, drugi avti skriti.
- Čas: 23,8 s za eno sliko, 32,5 s za tri mesta (`--m 908,914,921`).
- Druga stikala: `--cas noc`, `--vreme dez`, `--pokonci`, `--pred main` (pred / po / primerjava). Privzeti izhod je `test-results/shots/`.
- Ta delovna kopija nima `node_modules`, zato sem pognal `node --import file://tools/killar-cesta-prototip/izris-pw.mjs tools/shot.mjs killar --m 900 --lezece --out …`; po `npm ci` zadošča navadni ukaz.
- Slika je ponovljiva do bita (dva zagona, razlika 0). Slika z `bumps: []` je pri kameri za avtom enaka do bita, pri prosti kameri do 1/255.
- Stranskega pogleda nobeno orodje nima. Deluje `Render.setShot({px,py,pz,tx,ty,tz,fov,near,sky,noCut})` (render.js:10180, prosta kamera foto načina) + `Render.snapshot(P,'chase',640)` iz lastne skripte: `tools/killar-cesta-prototip/izris-foto.mjs` (kamera za avtom + stran 26 m + nizko 1,3 m; 32 s).
- Grbine brez posega v repozitorij: okoljska spremenljivka `IZRIS_BUMPS='[{at,h,w},…]'` jih doda v killar.js samo v pomnilniku; `IZRIS_SHADE=P1|P2` vklopi prototip senčenja (`izris-proto.mjs` v isti mapi).
- Slike poskusov: `tools/killar-cesta-prototip/izris-poskus.png` in mapa `tools/killar-cesta-prototip/izris-foto/` (`izris-cmp-proto-road.png`, `izris-cmp-side.png`, `izris-cmp-low.png`, `izris-cmp-2600.png`); nočna `tools/killar-cesta-prototip/izris-cmp-noc-A.png`.
- Repozitorij je nespremenjen (`git status` prazen).

**Tveganja**
1. Brez barvanja grbin uporabnik razgibanosti s kamere za avtom ne vidi (0–1/255), čeprav geometrija in fizika držita. Barvanje (P1) je nujen del naloge.
2. Preračun `rock` premakne trke s skalo (2–5 % vzorcev za > 0,3 m, posamezno do ~2 m, 10–27 m stene izgine), kar je v nasprotju z »trkov ne spreminjaj«. Brez preračuna črta trka ni več ob narisanem pobočju.
3. Vsaka sprememba jakosti premeša gozd, skale in mreže po celi progi. Reference sveta za killar (`tests/golden/world.json`) se spremenijo; slike pred/po je treba primerjati samo na cesti.
4. `tests/killar.test.js:31` (`gmax < 0,09`): izmerjeno 0,1086 (zmerno) in 0,1376 (močno), danes 0,0824. Test pade.
5. `def.bumps` z `h: 0` da 1 m (`b.h || 1`, core.js:1054). Jakost 0 mora pomeniti »brez seznama«, ne h·0.
6. Nočni snop je prerezan pred temeni, luže na temenih potonejo, črte kontrolnih točk so na meji. Popravek snopa bi bil v skupni kodi.
7. Prečni nagibi: graditelj nima prečnega člena, `def.bank` v jedru velja samo za krožne proge (core.js:226-236, `!open`). Potreben je nov privzeto izklopljen mehanizem in posegi v `Pt`, `vProf`, ograjo, količke in črte. DOMNEVA: teren je 0,3 m pod cesto, zato nagib do ~4 % (0,18 m na robu) še ne prebije.

**Odprto**
- Ali gredo grbine naravnost v `T.hy` (vse sledi samo, premaknejo pa se skala, mreže in raztros) ali v ločeno plast, kjer pragi mrež in raztros berejo gladko cesto. Druga pot zahteva poseg v `unH`/`caNear`.
- Ali je preračunana skala (98 % vzorcev znotraj 0,3 m) sprejemljiva glede na »trkov ne spreminjaj«, ali grbin ob skalnih odsekih (1897,5 m, od tega 1670 m desno) ne postavljamo.
- Pasovi brez grbin: štart, cilj in kontrolne točke (±10 m), most 4035,6–4063,6 m, izogibališči 1150 in 2642 m (±15 m), začetek in konec ceste.
- Jakost barvanja (0,35/m in 4 m sta poskusni vrednosti z enega mesta in ene smeri ceste) in ali gladke normale sploh. To je grafično vprašanje uporabniku s slikami.
- Drobna hrapavost: 2 m mreža je ne more pokazati; ostaneta tekstura in šum barve oglišč ali gosta mreža po vzoru `relRoad`, katere obremenitev ni izmerjena.
- Neizmerjeno: videz v gibanju (nagib avta ~2,5°, zaostanek kamere), luže po daljšem dežju, perf z grbinami.