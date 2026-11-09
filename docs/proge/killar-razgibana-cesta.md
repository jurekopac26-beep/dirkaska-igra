# Killar, Indija: razgibana cesta (načrt in predaja)

**Stanje 10. 11. 2026 ob 00.20:** raziskava in prototip končana, izdelava se NI začela (delo ustavljeno do odločitve uporabnika o porabi računa jure.kopac26). Na `zbirna/proge` (#494) ni od te teme nič. Ta veja (`killar/razgibana-cesta-nacrt`, iz 7b1985e2, brez pull requesta) hrani predajo in prototip v `tools/killar-cesta-prototip/`. Ob izdelavi gre vsebina v `docs/proge/killar.md`, ta datoteka in mapa prototipa se izbrišeta.

## Odločitve
- Želja uporabnika (9. 11. 2026 ob ~22.23): »proga naj ima razgibano cesto po kateri vozis sedaj se celotna cesta nerazgibana«.
- Odločitev uporabnika (9. 11. 2026 ob ~23.05): »fiziko voznje ne spreminjaj, ker je dobra, samo fiziko trkov«. Zato samo podatki proge (`js/tracks/killar.js`) in izris v Killarjevem graditelju (`js/world-killar.js`); `js/core.js` ostane nedotaknjen; brez polja `relief` in imen iz #539, brez nove skupne kode.
- Matej (9. 11. 2026 ob 23.56): različica v1 z grbinami, `KILLAR_RAZGIBANOST = 1` (zmerno), uporabnik jo po predogledu uglasi z »bolj« ali »manj«. Killar še ni na `main`, zato so medalje in reference njegove prve. Tresenje kamere in karoserije ni del v1.
- Znak za izdelavo še ni dan: najprej zadnji potisk seje popravkov na `zbirna/proge` (krhka ograja, Hakone, napaka pri s≈524 m: avto čez levi rob potone v pobočje).

## Zasnova v1 (samo Killar)
1. **Hrbti, ki jih sovoznik kliče:** 8–10 pravih grbin na ravninah kot `def.bumps` (0,65–1,0 m × 6,5–9,5 m). Višina vsakega je določena s simulacijo, da serijski reli avto (`C.MODELS[4]`, samodejni voznik) leti ≈ 0,35 s. Neprazen `def.bumps` izključi samodejno klicanje vrhov, zato so tihi deli drugje.
2. **Tihe kotanje in nizki hrbti:** ~60 kosov (0,15–0,5 m, širina 6–9 m), zapečeni v `def.elev` na mreži 2 m (`elevSmooth: 2`; jedro doda 4 prehode povprečja treh vzorcev, σ ≈ 3,27 m, zato je vsak Gauss vnaprej popravljen: `w_in² = w² − 21,33`, `h_in = h·w/w_in`). Globina je omejena, da razbremenitev na robu kotanje za najhitrejši avto ostane pod vzletom (`0,892·|h|/w²·v² ≤ 9 m/s²`, vzlet pri 11,9).
3. **Osnovni profil** pri jakosti > 0 posnema datoteka proge sama: `KILLAR_H` → mreža N = 2375 (linearno po deležih) + 3 prehodi povprečja ±10 vzorcev. Preverjeno (`emul.cjs`): od jedra se razlikuje za 8,7e-6 m, zgrajena cesta od današnje za največ 3,08 mm.
4. **Jakost:** `KILLAR_RAZGIBANOST` na vrhu `js/tracks/killar.js`. 0 = današnji def (`elev` iz `KILLAR_H`, `elevSmooth: 20`, brez `bumps`), `T.hy` bit za bitom (prstni odtisi danes: `hy` 47d46842db7f7c68, `grade` eec04d852eda99bd, `curv` fd1c5683b706a02c; `testi-hy-hash.js`). 1 = zmerno; smiselno 0,7–1,6. Tihe kotanje naj imajo v vrstici svojo mejo globine, da tudi pri »bolj« ostanejo tihe.
5. **Senčenje vozišča** v `js/world-killar.js` (funkcija `shade`, normale ceste gledajo navzgor, zato luč naklona ne vidi): `k *= clamp(1 − 7·b′ + 0,2·b, 0,5, 1,35)`, kjer je `b` višina neravnine (`T.hy − osnova`) in `b′` njen naklon vzdolž ceste; brez neravnin točno 1. Brez senčenja se oblika ceste s kamere za avtom NE vidi (primerjava po pikslih: valovi do ±1,3 m slike ne spremenijo); s senčenjem je hrbet 35–45 m pred avtom jasen temen/svetel pas, pokonci še bolj.
6. **Mirna območja** (brez neravnin): štart `0 … startS+45` (pri letečem štartu vozi samodejni voznik), cilj `finishS−20 … konec`, kontrolne točke ±8 m, most `startS+4035,6−10 … startS+4063,6+10`, izogibališči `startS + 1150 / 2642` ±22 m.
7. Prag mreže proti kamenju naj se računa na osnovni višini (`T.hy` brez neravnin), da odseki mreže ostanejo; brez `recId`.

## Mesta in mere (prototip g1, jakost 1; `tools/killar-cesta-prototip/mesta-g1.json`)
Hrbti, metri po štartni črti / višina / širina (hitrost reli avta): 290 / 0,92 / 7,8 (41 m/s) · 620 / 0,85 / 8,0 (42) · 810 / 0,64 / 8,4 (44) · 1420 / 0,82 / 9,0 (48) · 2290 / 1,01 / 8,2 (43) · 2550 / 0,71 / 9,5 (50) · 3690 / 0,71 / 8,9 (47) · 4140 / 0,82 / 6,5 (33). Merila mest: cesta ravna (polmer nad 250 m) od 15 m pred do 60 m za hrbtom, osnovni naklon ≥ −3,5 %, hitrost ≥ 28 m/s, 180 m narazen. Kotanj je 60, globine 0,14–0,53 m, 45–75 m narazen, ne bliže kot 38 m od hrbta. Največji naklon ceste 17,5 % (danes 8,24 %).

## Meritve prototipa (osnova 8fe4f131, pred krhko ograjo; 20 dirk × 22 avtov, ista semena)
| | danes | g1 |
|---|---|---|
| na cilju | 440/440 | 440/440 |
| padci čez rob na dirko | 2,3 (0–6) | 2,75 (0–8), od tega po letu 0,1 |
| zmagovalec med tekmeci, povprečje | 125,17 s | 126,2 s |
| mediana | 136,19 s | 137,15 s |
| plošče ograje / zidovi na dirko | 9,35 / 6,35 | 12,6 / 6,9 |
| samodejni voznik, reli avto | 118,93 s | 120,05 s (8 letov, mediana 0,35 s, najvišji 0,36 m) |
| najhitrejši avto na čas | 112,31 s | 113,52 s (let do 0,50 s, 0,63 m) |

Trdih pristankov 0. Obremenitev izrisa in slike zdaj/potem za uporabnika še NISO narejene (prototip število trikotnikov ne spremeni, senčenje so samo barve oglišč).

Iz meritev tekmecev (`porocila/tekmeci.md`): tekmeci vrhov ne poznajo (`Track.speedProfile` bere samo tloris), v zraku ni zavore ne bočne sile, vsak pristanek odvzame hitrost. Padce po letu povzročajo ozke visoke grbine pred ovinki (0,47–0,59 m × 4–6 m); do ~0,35 m razlike v padcih ni. Najbolj občutljiva je težka težavnost. Izmerjena ukrivljenost vrha je le 0,4–0,5 analitične, zato mere vedno iz zgrajenega `T.curv` oziroma iz simulacije. 40 dirk loči razlike nad ~0,6 padca na dirko.

## Stranski učinki (uredi v istem commitu)
- Čas na Killarju +~1 s: medalje (`medals`, pravilo čas samodejnega voznika × 1,01 / 1,06 / 1,14; `testi-osnova.js --medalje`) in `docs/proge/killar.md`.
- Kamni in drevje ob cesti se premešajo (isti generator); `rock` po potrebi na novo (`node tools/killar-skala.mjs`, `--check`); profil za meni (`node tools/menu-lens.js`).
- `tests/killar.test.js`: naklon < 9 % (vrstica 31) prestavi na osnovni profil; padci v treh dirkah (vrstica 125) so kaotični, mesta hrbtov uglasi ob njih; medalje (vrstica 177).
- Reference samo za Killar (ukazi in prenos ključev zamrznjenih testnih prog: `porocila/testi.md`): `tests/golden/sim.json`, `races.json`, `world.json`, `perf.json`, `js/menu-data.js`; po potrebi Killarjevi ključi `CRASH_AT` v `tests/lib/sim.js`. Ročno poženi še golden, races, perf, sovoznik, sovoznik-glas (30 klicev je padlo, 8 ne bi smelo), cisterna.
- Samo s podatki NI mogoče: tresenje avta in kamere na drobnih neravninah, delo vzmetenja, prečni nagib in kolesnice, ki bi jih avto čutil.

## Ponoviti na novi osnovi (po potisku seje popravkov, krhka ograja)
1. `git pull` na `zbirna/proge`, `node tools/killar-cesta-prototip/ref.cjs` (nove hitrosti), nato osnova: `node tools/killar-cesta-prototip/meri-killar.mjs --n 20 --tt` in tri dirke iz testa (`--tekmeci 12 --mesto 12 --tezavnost test --n 3`). Seja popravkov je s krhko ograjo izmerila 27 padcev v 9 dirkah po 13 avtov (prej 16); neravnine naj padcev glede na TO osnovo ne povečajo opazno.
2. Mesta hrbtov izberi po meritvah: hrbta pri 810 in 1420 m sta blizu današnjih gnezd padcev (900–1000 m in 1500–1700 m po poročilu; preveri enoto). Dodaj merilo, da za hrbtom ~60 m ni zaviranja (`race.vprof` ne pada).
3. Pri kotanjah in hrbtih ob prepadnem robu preveri, da se vidno pobočje in fizika ujemata (ista vrsta napake kot pri s≈524 m).
4. Slike zdaj/potem: kamera za avtom na istem mestu in en nizek stranski pogled na hrbet, skupaj do ~300 KB, v `docs/proge/` (npr. `killar-cesta-1.webp`); nočni žaromet na hrbtu poglej pri preverjanju.
5. Neodvisno preverjanje (drugi agenti kot avtorji): rob in ograja kot prej, padci tekmecev v ~20 dirkah pred/po, čas najhitrejšega tekmeca pred/po, klici risanja in oglišča, druge proge nespremenjene (`testi-hy-vse.js` proti `testi-hy-vse.8fe4f131.txt`), jakost 0 = današnja cesta. `tests/lestvica.test.js` pade zaradi Hakoneja, ni del te teme.

## Prototip (`tools/killar-cesta-prototip/`, poganjaj iz korena repozitorija)
- `ref.cjs` → `ref.json` (mreža, višine, hitrosti samodejnega voznika za vse modele); `gen2.cjs <oznaka> [k=1] [let=0.35] [hrbtov=14] [seme=7] [A=9]` → `patch-<oznaka>.json` (`elev`, `elevSmooth`, `bumps`, `_und`) in izpis časov; `emul.cjs` preveri posnemanje osnovnega profila.
- `meri-killar.mjs --n 20 --tt [--patch patch-g1.json] [--podrobno] [--igra] [--tekmeci 21] [--tezavnost 0|1|2|test] [--mesto g]`: dirke brez brskalnika (~4 s na dirko); `osnova-8fe4f131.txt` in `dirke-g1.txt` sta izpisa zgornjih meritev.
- Slike prototipa brez spremembe repozitorija: `PROTO_PATCH=<patch> PROTO_SHADE=0.2,0,0.5,1.35,7 node --import ./tools/killar-cesta-prototip/pw.mjs tools/shot.mjs killar --m 1375,585 --lezece --out <mapa>` (`hooks.mjs` izključi service worker, sicer igra postreže staro datoteko proge; pot do Playwrighta v `PLAYWRIGHT_MJS`); `izris-foto.mjs <mapa> <oznaka> [m]` da še stranski in nizki pogled.
- `porocila/` so poročila raziskave (fizika višin, izris, testi, tekmeci); pregled obstoječih mehanizmov ni bil končan.
