## 1. Tekmeci in samodejni voznik (PREVERJENO: branje `js/core.js` @8fe4f131 in sonda)
- **Hitrost**: en skupni profil `race.vprof` iz `Race._prof` (core.js:6717–6736; `aiLatA 18.5`, `aiBrakeA 12.5`, `aiWmax 1.2`, core.js:2199). `Track.speedProfile` (core.js:1290–1313): `v[i] = min(85, sqrt(latA/(|rk[i]| − latA·aero)))`, nato nazaj `v[i] = min(v[i], sqrt(v[i+1]² + 2·brakeA·rds[i]))`. Bere samo tlorisno krivino, ne `hy`, `curv` ali `def.bumps`. `race.vprof` je z naborom C bitno enak kot brez grbin: tekmeci vrhov ne poznajo in pred grbino ne zavirajo.
- **Linija in pedala** (`aiDrive`, core.js:4454–4681): pogled naprej `5.5 + 0.36·v` (4510), rob `w − 1.25` (4521), hitrost bere pri `s + 0.22·v + 3` (4575), `vT = vprof·min(skill·rubber, skCap)` (4580–4582), zavora `clamp((v − vT)/4.5, 0.15, 1)·(1 − 0.3·|inSteer|)` (4655, 4666). V vrsticah 4453–4720 ni nobenega branja `air`, `curv`, `grade`, `elevAt`, `bump` (grep: 0 zadetkov).
- **V zraku** (`stepCS`): vzlet pri `spd > 6 && vl²·curvNow < −11.9` (2888–2890). V zraku je pogon 0 (2967), zavora 0 (2979), bočne sile ni (3030, 3046), zasuk ugaša z `exp(−dt/0.25)` (3067). Ukazi voznika se računajo naprej, a ne primejo.
- **Pristanek** (3079–3082): `vy −= 14·dt`; ob dotiku hitrost `×(1 − clamp(−impactVY·0.016·landK, 0, 0.13·landK))`, škoda (`knock`) šele pri `−vy > landV` (11 m/s). `impactVY` je absolutna navpična hitrost, z nagibom ceste vred, zato hitrost odvzame tudi mikrolet. Posebne logike po pristanku ni.
- **Pomoči tekmecem**: elastika `rubber` (7140–7143; `DIFF` 6297–6301: lahka 0.78–0.86, srednja 0.88–0.97, težka 1.02–1.12; `skCap 1.06`, 6472), manjši zasuk pri zaviranju (`K.aiBx 0.45`, 2869), vrnitev pri `stuckT > 3.5 s` ali `wrongT > 3 s` (7295–7297). Za grbine, lete in pristanke ni nobene.
- Igralčev avto vozi isti `aiControl` pri letečem štartu do štartne črte, po cilju in v boksih (`js/game.js`:3251–3260).

## 2. Padci, ograja, vrnitve: kje se šteje (PREVERJENO: branje kode)
- **Rob** (`Track`, core.js:303–333): prepad na levi se začne 5,7 m od osi (`w + dropEdge 1.2`), `fallAt` velja na 82 % vzorcev; ograja ima 1532 plošč po 3 m.
- **Ograja** (`wallCollide`, core.js:4025–4029): plošča poči pri `vo > 6.5 m/s` ali pri `vo > 1.5` manj kot 0,5 s po prejšnji. `fenceBreak` (3968–3972): `race.fence.brk[m] = t`, `race.fence.n++`, hitrost ×0,9, škoda 0,03, `c.fenceN++`. Višine avta (`c.air`) veja ne gleda.
- **Padec**: `Race._offRoad` (8090–8097, klic 7192) čez rob s `fallAt` pokliče `overEdge` (3973–3976) in nastavi `c.fall`. Sicer pri `|d| − w > 10 m` za 0,3 s: `c.offN++` in `rescue`.
- **Konec padca**: `Race._fall` (8074–8081) po 1,6 s: `c.falls++`, škoda 0,32, `rescue` (8101–8127: nazaj na cesto z 8 m/s, zapis v `race.putT`, 8100).
- **Števci**: `c.falls`, `c.offN`, `c.fenceN`, `race.fence.n`, `race.fence.brk[]` (riše `js/world-killar.js`:1159), `race.putT`, `c.dmg`, `c.wreck.dnf` (samo vozila iz kompleta, 3352). Dnevnika dogodkov ni; druge vrnitve skripta šteje z ovojem `race.rescue`.

## 3. Merilna skripta (PREVERJENO: pognano)
- `tools/killar-cesta-prototip/meri-killar.mjs` (220 vrstic, repozitorija ne spreminja; `git status` čist).
- Zahtevano: `--n` (seme `s`: `opts.seed = s`, težavnost `s % 3`, štartno mesto `[zadnji, 12, 1, 17][(s−1) % 4]`), `--patch`, `--tt`. Dodano: `--seme`, `--podrobno` (kraji padcev in letov), `--igra`, `--avto`, `--tezavnost`, `--mesto`, `--tekmeci`, poskusni `--vrhovi k[:vmeja]`.
- Vrstica dirke ima poleg zahtevanih polj še `padciPoPravemLetu`, `letiNad01` (leti ≥ 0,1 s), `zrakS`, `zidovi`, `zavrtitve` in `zgoscena` (sha256 končnega stanja).
- Enakovrednost s testi: `--tekmeci 12 --mesto 12 --tezavnost test --n 3` da 39/39 na cilju, 4 padce, 17 plošč, 0 vrnitev, enako kot `tests/killar.test.js` 4b. Vožnja na čas da 118,93 s (test: 118,9 s).
- Determinizem: dva zagona dasta enake vrstice z zgoščeno vrednostjo vred; dirka sama je enaka isti dirki v nizu, tudi ob treh vzporednih procesih.

## 4. Osnova 8fe4f131 (`--n 20 --tt`; PREVERJENO)
- Datoteka: `tools/killar-cesta-prototip/osnova-8fe4f131.txt`. Čas: 62,3 s skupaj, **3,1 s na dirko**, vožnja na čas 0,19 s.
- Na cilju 440/440, odstopov 0. Padci 2,3 na dirko (0–6), 1,95 različnih avtov; plošče 9,35 (0–20); vrnitve 0,35; druge rešitve 0,2.
- Zmagovalec med tekmeci 125,17 s (118,66–136,45), mediana 136,19 s. Letov 0, vMax 193 km/h. Vožnja na čas 118,93 s.
- Po težavnosti (padci / plošče / zmagovalec): lahka (6 dirk) 2 / 18 / 132,9 s; srednja (7) 16 / 63 / 124,6 s; težka (7) 28 / 106 / 119,1 s.
- Padci so danes na 900–1000 m (13 od 46), 1500–1700 m (16) in 2100 m (5). Brez grbin je najmanjši `curv` −0,00077, vzlet bi bil šele pri 447 km/h.

## 5. Poskus z grbinami (PREVERJENO: pognano; ± je standardna napaka)
Nabori: `tools/killar-cesta-prototip/grbine-A.json`, `tools/killar-cesta-prototip/grbine-B.json`, `tools/killar-cesta-prototip/grbine-C.json` (60 / 120 / 200 grbin, w 4–10 m, prepovedana območja upoštevana).

Zahtevani `--n 8 --tt` (padci na dirko / zmagovalec): brez grbin 1,88 / 124,11 s; A 2,88 / 124,12 s; B 1,63 / 126,86 s; C 4,38 / 137,36 s. Povsod 176/176 na cilju. Ker je šum med semeni velik, sem ponovil s 40 dirkami in dodal iste razporede z višinami × faktor:

| nabor | grbin × višina (m) | najmanjši `curv` (vzlet od km/h) | padci/dirko | plošče | zmagovalec s | mediana s | na čas s | letov/dirko (najdaljši s) | pristanek max m/s |
|---|---|---|---|---|---|---|---|---|---|
| brez | – | −0,0008 (447) | 2,00±0,30 | 9,2 | 125,71 | 136,15 | 118,93 | 0 | 0 |
| C×0,2 | 200 × 0,05–0,12 | −0,0065 (154) | 1,73±0,27 | 8,6 | 125,70 | 135,80 | 119,04 | 1 (0,01) | 3,8 |
| A | 60 × 0,08–0,20 | −0,0093 (129) | 2,40±0,36 | 11,3 | 125,81 | 136,05 | 119,34 | 53 (0,13) | 5,1 |
| B×0,5 | 120 × 0,08–0,18 | −0,0084 (136) | 2,05±0,33 | 9,8 | 125,96 | 136,22 | 119,46 | 81 (0,18) | 5,7 |
| C×0,35 | 200 × 0,09–0,21 | −0,0113 (117) | 2,35±0,37 | 9,9 | 126,90 | 137,01 | 120,72 | 265 (0,11) | 5,0 |
| B | 120 × 0,15–0,35 | −0,0169 (96) | 2,05±0,29 | 9,3 | 128,16 | 138,16 | 121,99 | 712 (0,27) | 6,1 |
| C×0,5 | 200 × 0,13–0,30 | −0,0161 (98) | 2,45±0,41 | 11,6 | 129,21 | 139,56 | 123,33 | 1187 (0,21) | 6,1 |
| C×0,65 | 200 × 0,16–0,39 | −0,0210 (86) | 2,77±0,32 | 12,2 | 131,82 | 142,11 | 126,23 | 2067 (0,33) | 6,4 |
| C×0,8 | 200 × 0,20–0,48 | −0,0258 (77) | 3,00±0,35 | 14,4 | 134,51 | 145,79 | 129,17 | 2646 (0,49) | 7,0 |
| B×1,5 | 120 × 0,23–0,53 | −0,0254 (78) | 4,62±0,81 | 11,2 | 131,16 | 142,14 | 125,02 | 1619 (0,37) | 6,9 |
| C | 200 × 0,25–0,60 | −0,0322 (69) | 4,25±0,45 | 19,4 | 138,40 | 150,61 | 133,66 | 3172 (0,61) | 7,4 |
| B×2 | 120 × 0,30–0,70 | −0,0339 (67) | 8,60±1,31 | 18,2 | 135,63 | 146,65 | 129,52 | 2145 (0,58) | 7,4 |

- **Konci dirke**: v vseh 12 naborih 880/880 na cilju, 0 odstopov, 0 trdih pristankov (največ 7,4 m/s, meja 11). Škode od pristankov ni; škoda je samo od ograje in padcev.
- **Padci**: do višine približno 0,35 m (A, B, B×0,5, C×0,2–0,5) razlika do osnove ni zaznavna (vse znotraj približno ±1,3 napake). Od C×0,65 naprej rastejo; B×2 jih ima 4,3-krat več.
- **Težka težavnost je najbolj občutljiva**: B×1,5 ima 11,3 padca na dirko (osnova 3,7), B×2 pa 19,4; lahka ostane pri 0,5–0,6.
- **Časi**: vsak mikrolet odvzame hitrost. Vožnja na čas se podaljša za 0,1 s (C×0,2), 0,4 s (A), 3,1 s (B) in 14,7 s (C, +12 %); vMax pade s 193 na 187 (A), 176 (B) in 150 km/h (C).
- **Odloča postavitev, ne povprečna jakost** (`--podrobno`, 16 dirk): pri C je 37 od 65 padcev po pravem letu, 36 od teh za petimi grbinami od 200. To so visoke ozke grbine (h 0,47–0,59 m, w 4,2–5,7 m) pred ovinki na 304, 718, 1502, 2121 in 2735 m. Pri B×1,5 na težki ena sama grbina (461 m, h 0,52, w 5,1) da 52 od 89 padcev. Pri B po pravem letu ni nobenega padca.
- **Šibkejše grbine v ovinkih in zaviranjih** (C, 16 dirk; osnova istih semen 2,19, C 4,06): višina ×0,3, kjer je `race.vprof` pod 55 m/s (119 od 200 grbin), da 2,12 padca. Ista oslabitev samo pod 40 m/s (60 grbin) da 3,56.
- **Poskus `--vrhovi`** (samo v skripti; profil omejen z `v² ≤ 11.9/|curv|`): C z omejitvijo samo pod 40 m/s da 1,88 padca in +2,7 s; z omejitvijo povsod 1,06 padca in +19 s. Pri B ne spremeni ničesar (1,69 proti 1,81).
- **Način igre** (`--igra`: leteči štart, igralec zadnji; 8 dirk): padci 0,88 / 1,12 / 3,50 za brez / B / C, zmagovalec 107,8 / 110,2 / 119,3 s, vsi na cilju.
- **Polje kolibrijev** (6 dirk): 132/132 na cilju pri vseh treh, 0 odstopov, padci 0,17 / 0,50 / 0,67.
- **Sklep za jakost**: razpon A do B×0,5 (60–120 grbin, 0,08–0,2 m) je brez merljivih stranskih učinkov. B (0,15–0,35 m) je zgornja varna meja za padce, a stane 3 s. Nad tem je potrebno pravilo postavitve ali profil, ki pozna vrhove.

## Tveganja
- `tests/killar.test.js`:125 (`falls <= cars/6`, danes 4 od dovoljenih 6,5) je občutljiv na šum: A da 5, B 2, C×0,35 8 (pade), C 5. Vsaka jakost nad 0 premeša padce v teh treh dirkah.
- `tests/killar.test.js`:176 (zlata medalja = samodejni voznik × 1,01 ± 1,5 s) dopušča čas 117,33–120,30 s. A, B×0,5 in C×0,2 ostanejo znotraj; od C×0,35 (120,72 s) naprej je treba popraviti `medals` v `js/tracks/killar.js`:38.
- `tests/golden/races.json` in `CRASH_AT` (`'killar/ev'`, `'killar/formula'` v `tests/lib/sim.js`) se spremenita pri vsaki jakosti nad 0.
- Ena številka jakosti brez pravila postavitve je nevarna: ena sama ozka grbina pred ovinkom lahko na težki težavnosti podre polovico polja.
- Goste grbine upočasnijo vse avte zaradi izgube hitrosti ob pristanku; cesta je lahko videti razgibana, vožnja pa počasnejša.
- Profil, ki pozna vrhove, bi bil skupni mehanizem v `Track.speedProfile`. Bere ga tudi sovoznik (core.js:1531), zato mora biti privzeto izključen.
- Izmerjeni `curv` na vrhu je le 0,4–0,5 × analitičnega `2h/w²` (B: −0,0169 proti 0,0416). Pravilo naj se zato računa iz zgrajenega `T.curv`, ne iz `h` in `w`.

## Odprto
- DOMNEVA: mehanizem padca po letu je izguba bočnega oprijema in zaviranja v zraku pred ovinkom. Podpirata ga koda in kraji padcev, neposredno po avtih pa ni izmerjen.
- DOMNEVA: `--igra` ustreza možnostim v `js/game.js`:2336–2340; v brskalniku ni preverjeno.
- Ni izmerjeno: dež (mokre medalje), formula (že brez grbin 11 padcev v eni dirki), tovornjak (drugačna `landV` in `landK`), EV, način `traffic`.
- Odsek pred štartno črto (0–130 m), kjer pri letečem štartu vozi samodejni voznik, je v vseh naborih brez grbin; grbine tam niso preizkušene.
- 40 dirk loči razlike nad približno 0,6 padca na dirko. Izbrani nabor je treba ponoviti z `--n 40` (okoli 2 min).
- Odločitev: ali dobijo tekmeci profil, ki pozna vrhove, ali se grbine oslabijo v ovinkih in zaviranjih.
- Vsi izpisi so v isti mapi: `tools/killar-cesta-prototip/tekmeci-n40-<nabor>.txt` (40 dirk), `tools/killar-cesta-prototip/tekmeci-p2-<poskus>.txt` (dodatni poskusi), `tools/killar-cesta-prototip/tekmeci-poskus-<A|B|C>.txt` (zahtevani `--n 8`); generator naborov je `tools/killar-cesta-prototip/tekmeci-grbine-gen.mjs`.