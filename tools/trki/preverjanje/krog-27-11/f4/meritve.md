# fizika-4: odboj po virih (27. 11.), meritve pred in po

Drevesa: **pred** = 737b389 (veja po koraku 1, brez tega popravka), **po** = bfdd165 (popravek v `js/core.js`, test in reference). Skripte: `../../krog-25-11/fizika/odboj.js` (`TRKI_SNAP=<drevo>`; avto–avto čelno, zid pravokotno in poševno, bok ob boku) → `odboj-pred.log`, `odboj-po.log`; `nazaj.js` (odkotalitev po pravokotnem trku v zid, 20 s brez vnosa) → `nazaj-po.log`, `nazaj-pred.log` (**isto drevo**, stare številke zidu vstavljene ob zagonu: `WE0=0.2 WEV=6 node nazaj.js`); `tools/trki/zid.js --cv 6 --del matrika --json` na obeh drevesih in `zid-povzetek.js <pred.json> <po.json>` → `zid-matrika.log`; `promet.js` (nalet v vozilo prometa) → `promet-pred.log`, `promet-po.log`. Drevo pred: `git worktree add --detach <mapa> 737b389`.

## Kaj je uveljavljeno (bfdd165, samo Realistična, cv 6)

- **Avto–avto** (`KV.real`): `e1` 0,12 → **0,03**, `eV` 4 → **10 m/s**; `e0` 0,3 in `eT` 0,5 m/s ostaneta. Krivulja je ista: pod `eT` 0, nad njim `e1 + (e0 − e1)·exp(−(vn − eT)/eV)`.
- **Zid** (`KV.real.wall`): `e0` 0,2 → **0,36**, `eV` 6 → **4,5 m/s**; `e1` 0,05 in `eT` 0,5 ostaneta.
- Promet (`_hitVehR`) in kolesar (`_runBikeR`) bereta isti `e1` in `eV`, zato dobita isto krivuljo.
- **Izjema:** par, v katerem je en avto zunaj pravila Realistične (`krOn`: policijsko zasledovanje, vlačilec s polpriklopnikom, boksi), obdrži odboj Simulacije (`kvMake`: `x1`, `xV`; `kCollide`: `kx`). Pri 100 km/h in več je to še 0,12.
- Simulacija (cv 1) in različice 2–5 se ne spremenijo (`x1` tam ni določen); v `tests/golden/trki.json` se je spremenilo 32 ključev od 300, vsi `real` (16 prizorov).
- Vožnja ni spremenjena: drugačne so samo štiri številke sunka med telesoma in v zid.
- Testi: `tests/trki.test.js` 80/80 (reference Realistične obnovljene; preverjanje naleta v promet prilagojeno, glej spodaj), `tests/poskodbe.test.js` 14/14, `tests/golden.test.js` 504 od 504 enakih, `tools/stamp.js --check` v redu. `tests/races.test.js` ob pisanju še teče (88 od 360, vsi enaki); izid je v predaji v opisu PR.

## Merilo

`docs/trki-realizem.md`, »Resnični trki (odprti viri)«: odboj avto–avto in avto–tog zid pod 5 km/h 0,4–0,7; 7–16 km/h 0,15–0,35; 25–60 km/h 0,05–0,2; pri 100 km/h in več 0–0,1, odbojna hitrost 3–10 km/h. Zid pravokotno: odbojna hitrost 3–7 km/h pri 50 in 3–10 km/h pri 100 km/h, nazaj 0,5–2 m. Zid poševno: 5–10° izguba 3–10 %, izhod 0–3°; 20–25° pri 100 km/h ohrani 72–88 %, izhod 3–10°.

## Avto–avto čelno (rally 1 150 kg; drugi par v dnevniku da enake številke)

| zbliževanje km/h | odboj pred (razmik km/h) | odboj po (razmik km/h) | vir |
|---|---|---|---|
| 3,6 | 0,279 (1,00) | 0,287 (1,03) | 0,4–0,7: pod virom, kot prej |
| 5 | 0,264 (1,32) | 0,277 (1,39) | meja razredov |
| 10 | 0,222 (2,22) | 0,245 (2,45) | 0,15–0,35: v območju |
| 16 | 0,187 (2,99) | 0,212 (3,39) | v območju |
| 30 | 0,145 (4,36) | 0,153 (4,60) | 0,05–0,2: v območju |
| 60 | 0,123 (7,39) | 0,084 (5,02) | v območju |
| 100 | 0,120 (12,02) | 0,048 (4,77) | 0–0,1 in 3–10 km/h: prej zunaj, zdaj v območju |
| 160 | 0,120 (19,20) | 0,033 (5,33) | prej zunaj, zdaj v območju |
| 240 | 0,120 (28,80) | 0,030 (7,29) | prej zunaj, zdaj v območju |

Bok ob boku: razmerje 0,245 in zbliževanje 3 km/h 0,35 enako; zbliževanje 5 km/h 0,104 → 0,102.

## Zid pravokotno (rally, mravlja, kamen enako)

| km/h | odboj pred (nazaj km/h) | odboj po (nazaj km/h) | vir |
|---|---|---|---|
| 5 | 0,073 | 0,073 | 0,4–0,7: pod virom, kot prej (dotik pod `wall.v0` je naslon) |
| 10 | 0,144 (1,44) | 0,217 (2,17) | 0,15–0,35: prej tik pod, zdaj v območju |
| 16 | 0,122 (1,94) | 0,165 (2,65) | prej pod, zdaj v območju |
| 30 | 0,087 (2,62) | 0,099 (2,96) | v območju |
| 50 | 0,065 (3,24) | 0,064 (3,21) | 3–7 km/h: v območju |
| 100 | 0,051 (5,15) | 0,051 (5,07) | 3–10 km/h: v območju |
| 200 | 0,050 (10,00) | 0,050 (10,00) | na robu območja, kot prej |

Škoda pri vseh hitrostih enaka kot prej.

## Zid poševno (izhodni kot je izpeljan: asin(odbojna hitrost pravokotno / izhodna hitrost))

| avto, km/h, kot | odboj pred → po | ohranjena hitrost pred → po | izhodni kot pred → po |
|---|---|---|---|
| rally 100, 5° | 0,167 → 0,192 | 0,961 → 0,960 | 0,87° → 1,00° |
| rally 100, 10° | 0,142 → 0,153 | 0,916 → 0,915 | 1,54° → 1,66° |
| rally 100, 20° | 0,101 → 0,110 | 0,809 → 0,808 | 2,44° → 2,68° |
| rally 100, 25° | 0,090 → 0,099 | 0,746 → 0,745 | 2,91° → 3,23° |
| rally 200, 10° | 0,218 → 0,232 (sunkov 4 → 3) | 0,913 → 0,912 | |
| rally 100, 45° | −0,018, enako | 0,468, enako | |
| kamen 100, 20° | 0,057 → 0,068 | 0,813 → 0,812 | 1,38° → 1,65° |
| kamen 100, 25° | 0,050 → 0,057 | 0,751 → 0,750 | 1,62° → 1,83° |

Izguba pri 5° in 10° (4 % in 8,5 %) in ohranjena hitrost pri 20° in 25° sta v območju vira kot prej. Izhodni kot pri 20–25° je še vedno večinoma pod 3–10° (rally 2,7–3,2°, kamen 1,7–1,8°), malo bližje kot prej.

## Odkotalitev po pravokotnem trku v zid (m nazaj, 20 s brez vnosa)

| avto, tla | 30 km/h | 50 km/h | 60 km/h | 100 km/h |
|---|---|---|---|---|
| rally, asfalt | 3,34 → 3,94 | 4,46 → 4,40 | 5,09 → 4,89 | 7,90 → 7,81 |
| mravlja, asfalt | | 4,43 → 4,36 | 5,04 → 4,84 | 2,64 → 2,59 |
| titan, asfalt | | 4,45 → 4,38 | 5,07 → 4,87 | 6,73 → 6,65 |
| rally, trava | 0,76 → 0,94 | 1,09 → 1,07 | 1,27 → 1,21 | 2,20 → 2,16 |
| mravlja, trava | | 0,97 → 0,96 | 1,08 → 1,05 | 1,15 → 1,13 |
| titan, trava | 1,24 → 1,43 | 1,60 → 1,58 | 1,78 → 1,72 | 2,87 → 2,74 |

Na asfaltu se avto odkotali 2,6–7,9 m (vir: 0,5–2 m), kot prej: odloča prosto kotaljenje po trku, to je vožnja in se ne spreminja. Od 50 km/h naprej je pot malo krajša, pri 30 km/h daljša (rally 3,34 → 3,94 m), ker je odboj tam večji. Zavrnjena različica zidu (`e0` 0,3, `eV` 6): rally, asfalt, 50 km/h 5,46 m.

## Matrika zidu (360 prizorov: 5 kotov × 3 hitrosti × 2 vnosa × 2 fiziki × 3 avti × 2 podlagi)

sha256 izpisa: pred `f4edc782…0c64c8`, po `d97a34fa…001ff6` (na potisnjeni kodi ponovljen, enak). Spremenjenih 344 prizorov od 360.

| števec | pred | po |
|---|---|---|
| prilepljen ob ograjo | 53 | 53 |
| doseže drugo ograjo | 12 | 13 |
| pade skozi | 0 | 0 |
| v 7 s ni naravnan | 92 | 90 |
| največji popravek lege | 27,10 cm | 26,47 cm |
| škoda, povprečje | 44,185 % | 44,233 % |

Razred izida se je spremenil v 10 prizorih (našteti na koncu `zid-matrika.log`), v obe smeri. Pravokotne vrstice so skoraj enake (90°, 60 km/h: nazaj 3,00 → 2,91 km/h).

## Nalet od zadaj v stoječe vozilo prometa (odboj med težiščema; `promet-*.log`)

| vozilo | po sredini 60 / 120 / 200 km/h | 0,6 m iz sredine 60 / 120 / 200 km/h |
|---|---|---|
| avto 1 300 kg | 0,123 / 0,120 / 0,120 → 0,084 / 0,040 / 0,031 | 0,058 / 0,055 / 0,055 → 0,021 / −0,020 / −0,029 |
| kombi 2 400 kg | enako kot avto | 0,071 / 0,068 / 0,068 → 0,033 / −0,008 / −0,017 |
| avtobus 12 500 kg | enako kot avto | 0,109 / 0,106 / 0,106 → 0,070 / 0,027 / 0,018 |
| motor 290 kg | enako kot avto | 0,063 / 0,061 / 0,060 → 0,026 / −0,015 / −0,024 |

- Razmik po sredini: 7,39 / 14,41 / 24,00 → 5,02 / 4,82 / 6,22 km/h. Gibalna količina se ohrani (odstopanje pod 1e-15), energija se pri vsakem naletu zmanjša.
- **Negativne vrednosti iz sredine:** odboj v točki dotika je 0,03–0,04, par se ob zamiku zavrti okoli dotika, zato se težišči po sunku še približujeta (do 5,7 km/h pri 200 km/h). Prej je bil odboj v dotiku (0,12) večji od tega deleža, zato je bila vrednost pozitivna. Preverjanje v `tests/trki.test.js` (»Realistična, the traffic«) je za zamaknjene nalete zato prilagojeno z 0–0,2 na −0,05–0,2; po sredini ostane 0–0,2. To je sprememba meje testa, ne samo reference.
- Zasuk avta ob zamiku: pri 120 in 200 km/h 7 % manjši (sorazmerno s sunkom). Pri 60 km/h gre večji del v zdrs zadka (`csKc`) namesto v vrtenje: avto −0,256 → 0 rad/s (zdrs −0,119 → −0,130 rad), kombi −1,483 → −0,841 rad/s (zdrs −0,055 → −0,089 rad). Delitev je obstoječe pravilo in ni spremenjena.

## Kaj ostaja zunaj virov

- Pod 5 km/h: avto–avto 0,28–0,29 in zid 0,07 (vir 0,4–0,7). `e0` ostane enak Simulaciji (to preverja test), razlika v razmiku je do približno 1,5 km/h.
- Učbeniška vrstica »Nalet in mase« je računana z odbojem 0,1–0,15: z izmerjenim 0,048 pri 100 km/h izide 47,6 / 52,4 km/h namesto 45 / 55 in avto 1 300 kg v stoječ tovornjak 5 500 kg približno 15 / 20 km/h namesto 11 / 21 (**izračunano, ne izmerjeno**). Prednost ima vrstica z izmerjenim odbojem 0–0,1.
- Zid pri 200 km/h: odbojna hitrost 10,0 km/h, na robu območja, kot prej.
- Izhodni kot ob zidu pri 20–25° in odkotalitev na asfaltu: glej zgoraj.
- Pari z avtom zunaj pravila (policija, vlačilec, boksi) in Simulacija ostanejo pri 0,12.

## Česa ta krog ni izmeril

- Kaj sledi zamaknjenemu naletu v promet v naslednjih korakih (ali pride do drugega sunka, ko se težišči še približujeta): `promet.js` in test merita en klic.
- Kolesar (`_runBikeR`) z novo krivuljo posebej; pokrit je samo s testom (80/80).
- `tools/trki/pocez.js` po tem popravku.
- Testi v brskalniku in `npm run test:related` (44 testov, približno 4,6 h): tečejo enkrat, v zbirnem krogu ali pred `main`.
- Izpisa matrike (`--json`, 213 kB vsak) nista shranjena; ponovita se z zgornjim ukazom.
