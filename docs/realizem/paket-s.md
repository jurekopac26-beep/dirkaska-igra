# Realizem, paket S · Stavbe (~21 sej, na `main` za E)

Del `docs/realizem.md` (razdeljen po paketih 11. 11. 2026, ukrep 5 »Manj sklopov«, `docs/varcevanje.md`). Odločitve uporabnika, proge, postopek, pravna ocena, čas in vrsta so v `docs/realizem.md`.

- **Kaj se spremeni:**
  - Oblika strehe, barve, material in nadstropja pridejo iz OSM (`roof:shape`, `roof:colour`, `building:colour`, `building:material`, `building:levels`).
  - Kjer podatka ni, se uporabi slog kraja iz atlasa fasad po regijah. Atlas je risan po odprtih fotografijah.
  - Stavbe tik ob cesti so po meri (izbira uporabnika), z balkoni, okni po nadstropjih, napuščem in pravo streho.
  - Okna in vrata so tekstura v atlasu, ne geometrija. Balkoni in napušč so samo pri stavbah tik ob cesti.
  - Znamenitosti so po pravni oceni države.
- **Koraki:**
  - S0: orodje (Overture brez virov Google, strehe, ravni podrobnosti) in atlas fasad.
  - S1: Nürburg, Livorno, Spa (Suzuka je od 9. 11. 2026 testna; odločitev uporabnika 10. 11., tabla #382, 6764251106).
  - S2: Medvode (po #494), Montréal, Štajerska. Bâlea in Los Caracoles imata malo stavb in gresta zraven brez svoje seje.
- **Telefon:** cilj je +0 klicev risanja (atlas, skupne mreže) in največ ~150 tisoč oglišč na progo.
- **Seje:** 10 za orodje in atlas, ~1,5 na progo s stavbami.
- **Datoteke:**
  - `tools/proga-podatki.py` (korak za stavbe), `tools/<id>/config.json`;
  - `js/world-stavbe.js` (graditelj stavb, ravni podrobnosti, kompleti po državah; od prvega kosa S0), klic iz graditelja proge (`js/world-<tema>.js`);
  - atlas fasad: risan na platno ob gradnji sveta (v `assets/` ni datoteke);
  - podatki v `js/tracks/<id>.js`.
- **Tveganje:**
  - oglišča v krajih z veliko stavbami (Livorno, Medvode);
  - pravna presoja znamenitosti;
  - spori v `js/world.js` s pull requesti prog.

## S0, prvi kos: sestavni deli stavb (PR #668, 12. 11. 2026)

- **Odločitev:** uporabnik 12. 11. 2026 ob ~18.00 v pogovoru z Matejem: »Da, S0 Stavbe« (tretja seja s kodo računa jure.kopac26, kljub več kot 6 odprtim temam). Po ukrepu »Manj sklopov« (`docs/realizem.md`, »Čas in vrsta«) S0 naredi samo sestavne dele; proge jih dobijo v skupnem prehodu S in G. Na `main` gre po uporabnikovem »ok« na slikah (stran Odločitve, vprašanje `realizem-s0-spa`) in za E (#657).
- **Kaj prinese** (s kamere za avtom; v tem kosu samo na progi Spa, Belgija):
  - namesto enobarvnih škatel hiše z okni po nadstropjih, vrati in polkni ali roletami po slogu kraja;
  - dvokapne in štirikapne strehe s kritino (skril, strešniki, pločevina, slama), slemenom, napuščem in dimniki;
  - tik ob cesti (do 34 m za ograjo proge) še balkoni na steni proti cesti, dvorišče z zidom ali živo mejo in vrati, grmovje in nadstreški;
  - do 64 m okna, napušč in dimniki; dlje samo stene iz atlasa in streha s slemenom, nad 300 m samo obris.
- **Česa namenoma ni:**
  - imen, napisov, logotipov, umetnin in kipov: hiše so generične (`docs/realizem.md`, »Pravna ocena po državah«);
  - hal, tribun, boksov in stavb nad 1500 m²: ostanejo, kot so;
  - orodja za podatke OSM, noči, zime in dežja na hišah ter drugih prog: glej »Predaja« spodaj.
- **Kako:**
  - nov modul `js/world-stavbe.js` (`World.stavbe`), v `index.html` takoj za `js/world-cesta.js`; `js/world.js` se ne spremeni;
  - graditelj proge pokliče `World.stavbe.setup({ Chunks, list, T, near, gH })`, za vsak tloris `put({ x, z, L, W, ang, y0, hh, fl, type, … })` in na koncu `addTo(skupina)`; `fence(ax, az, bx, bz)` postavi zid ali ograjo po meri;
  - atlas fasad (1024 × 2048, pas na nadstropje, polje 128 px ≈ 2,9 m stene) se nariše na platno, ko ga proga prvič rabi, po eden na slog; fotografij in datotek v `assets/` ni, zato ni novega vira za »Zasluge«;
  - vse hiše proge imajo en material (stene in strehe; barve so v ogliščih), ograje drugega (isti atlas); mreže so po kosih pokrajine kot drugo okolje;
  - ravni podrobnosti: 1 boljše oblike in strehe, 2 še stene iz atlasa, 3 še to, kar stoji ob cesti; obroča `d2` in `d1` sta v metrih za ograjo proge;
  - senca ob tleh nastane sama: splošni prehod v `js/world.js` jo naredi ob vsaki pokončni steni;
  - tloris za trke ostane, kot je bil; fizika vožnje se ne spremeni.
- **Kompleti po državah** (`KOMPLETI`; država je iz imena proge »Kraj, Država«, slog je atlas):

| Država | Slog | Stene | Strehe |
|---|---|---|---|
| Belgija (Ardeni) | `north` | siv lomljen kamen in belež, tu in tam rdeča opeka | strme skrilaste dvokapnice |
| Nemčija (Eifel) | `north` | bel in kremast omet, nekaj temnega kamna in opeke | skril in temni strešniki |
| Italija (toskanska obala) | `med` | oker, rožnat in kremast omet, tu in tam kamnita hiša | nizke strehe iz žgane gline |
| Avstrija (Štajerska) | `alp` | bel omet, na vsaki tretji hiši leseno nadstropje | rdeče-rjavi strešniki, nekaj sive pločevine |
| Romunija (Făgăraș) | `gora` | spodaj kamen in zgoraj deske, kamen, bel omet | strma pločevina, nekaj skodel |
| Čile (prelaz v Andih) | `gora` | preprost omet in kamnite koče | pločevina |
| ZDA (Skalno gorovje) | `gora` | koče iz kamna in desk | zelena in rjava pločevina, rjave skodle |
| Rusija (Altaj) | `les` | brunarice, nekaj barvanih desk | pločevina |
| Brazilija (Serra) | `les` | barvane lesene hiše in bel omet | glinasti strešniki in siva pločevina |
| Južna Afrika (Kap) | `cape` | bele stene, tu in tam kamnita | strešniki in slama |
| Kanada (otok na reki) | `north` | opeka in omet | večinoma ravne strehe |
| Kitajska (gora v Hunanu) | `north` | bel omet in siv kamen | sivi strešniki |

- **Proge:** tabela `PROGE` v modulu, zdaj samo `spa` (raven 3, `d2` 34 m, `d1` 64 m): 84 hiš od 86 tlorisov, 24 tik ob cesti. Za vsako drugo progo, tudi testne in proge na odločanju, `setup` vrne `null`: svet je zgrajen kot prej. Druge prave proge s stavbami pridejo v skupnem prehodu S in G.
- **Telefon** (izmerjeno s `tests/browser/perf.test.mjs`, NIZKA, prej → potem): Spa 181 → 183 klicev risanja in 442 → 443 tisoč oglišč v kadru, na najbolj obremenjenem mestu 222 → 224 klicev in 573 → 573 tisoč oglišč (meja 300 in 900). Cilj paketa je bil +0 klicev; izmerjena sta +2. Hiše imajo 24 360 oglišč, cel svet proge 1 098 861 → 1 119 885. Prstni odtisi svetov (`tests/golden/world.json`) so enaki, razen Spaja.
- **Test:** `tests/browser/stavbe.test.mjs` (opis v `tests/README.md`).
- **Slike prej in potem** (kamera za avtom, Spa, Belgija): na strani Odločitve, vprašanje `realizem-s0-spa`; v repozitoriju jih ni.

### Predaja (12. 11. 2026)

- **Narejeno:** graditelj, atlas šestih slogov, kompleti 12 držav, priklop na Spa, test, referenca sveta za Spa.
- **Čaka:** uporabnikov »ok« na slikah. PR #668 ostane osnutek; do `main` ga pripelje seja Združevanje.
- **Pred združitvijo:** spoj svežega `main` za E (#657) z `node tools/spoji-main.mjs`; če se svet Spaja z E spremeni, referenco ustvari znova (`WORLD_ONLY=spa node tests/browser/world.test.mjs --update`) in preveri obremenitev (`PERF_ONLY=spa node tests/browser/perf.test.mjs`).
- **Manjka do konca S0** (naslednje seje):
  - orodje za podatke OSM ob `tools/proga-podatki.py` (oblika strehe, barve, material, nadstropja; Overture brez virov Google);
  - sosednji tlorisi v zaselkih se prekrivajo, zato se strehe sekajo: prizidki (`att`, `wings`) potrebujejo podatke iz orodja;
  - na slikah je pregledan samo komplet Belgije; drugih 11 test zgradi in prešteje, videl jih ni še nihče;
  - noč (svetla okna), zima (sneg na strehah) in dež na hišah niso preverjeni;
  - obris nad 300 m ni preizkušen na pravi progi (Spa takih hiš nima);
  - poraba pomnilnika: atlas 1024 × 2048 na slog;
  - +2 klica risanja na Spaju namesto ciljnih +0.
- **Kako se preveri:** `node tests/browser/stavbe.test.mjs`, `PERF_ONLY=spa node tests/browser/perf.test.mjs`, `WORLD_ONLY=spa node tests/browser/world.test.mjs`.

### Predaja 2 (13. 11. 2026): popravki po odgovoru uporabnika

Odgovor na `realizem-s0-spa` je »2 · Popravi videz« (13. 11. ob 00.07, v pogovoru z Matejem): mala hiška pred hišo je postrani; hiša je videti zakopana (okna malo nad in malo pod zemljo); hiša naj bo bolj realistična; hiše naj imajo pot do hiše, če jo imajo v resnici; »vedno delaj tako, kot je v resnici, nič si ne izmišljuj«. **Popravkov še ni v kodi** (koda je pri commitu prvega kosa). Nadaljuje naj nova seja v okolju »dirkaska-igra« (zažene jo koordinacija): iz okolja »Default« prejšnje seje `api.openstreetmap.org` ni dosegljiv (posrednik vrne 403).

**Vzroki (Spa, slika pri 5282 m, vrstici `def.bld` 158 in 159):**
- Klic `HS.put` v `js/world-spa.js` poda `fl: small ? 1 : hh > 8.6 ? 3 : 2`: hiše z dano višino 2,6–4,1 m (13 od 23 vrstic z višino; vrstica 159 ima 3,2 m) dobijo dve nadstropji v ~3 m in ogromno streho (naklon kompleta 0,92 čez 17 m globine).
- `y0` je najnižja točka terena (4 vogali in sredina), stene se začnejo pri `y0 − 0,25`: zgornja stran hiše se vkoplje v pobočje, okna so deloma pod zemljo.
- Male stavbe (< 45 m², 28 vrstic, nobena nima višine) dobijo 5,4–7,6 m sten z enim raztegnjenim nadstropjem; 8 malih pravokotnikov sega v večjega (19→18, 94→96, 126→127, 140→133/139, 143→142, 145→144, 149→148/153, 158→159; do 1,05 m in do 15,5° zasuka): artefakt prileganja pravokotnikov, to je »mala hiška postrani«.
- Dvorišče z ograjo in vrati, grmi, parkiran avto, tende, sončne celice in balkoni so izmišljeni.

**Načrt (samo `js/world-stavbe.js`, klic v `js/world-spa.js`, test; `js/world.js` ostane):**
1. `put()`: predmet `fit`, združen za `o` (`Object.assign(…, look, o, fit)`): višina sten brez podatka (mala stavba `2.3 + hs(6) * 0.4`, hiša `5.4 + hs(6) * 2.2`); nadstropja iz višine, če jih klic ne poda (`max(1, floor((hh + 1) / 2.9))`, mala stavba 1); tla hiše iz `cfg.gH` po mreži tlorisa s korakom ≤ 3 m: `y0 = hi + 0.15`, `base = y0 − lo` (podstavek do najnižje točke, statistika `st.rise`); mala stavba, ki sega v večjo (vogal v pravokotniku vrste ≤ 1 s ploščino > 1,5×, osi se po modulu 90° razlikujejo < 0,35 rad): zasuk na osi sosede, premik ven do stika sten, stena proti sosedi dobi `att = 1` (po klicu `party()`), pri dveh sosedah tista z globljim prekrivanjem; `CR.block` in `exclPush` ostaneta na mestu podatkov; pravilo preveri na tlorisih OSM. Krila: `base.hh`/`base.fl` namesto `o.hh`/`o.fl`.
2. `house()`: višina nadstropja `fh = flats ? hh / fl : min(max(hh / fl, fl === 1 ? 2.9 : 0), 3.2)`; nizko pritličje pokaže spodnji del vrste atlasa (`cut = hh / fh`, do ~2,25 m); ostanek nad zadnjim nadstropjem je gladek pas pod napuščem (`knee = hh − fl * fh`, trak `PL`). Podstavek: škatla `o.base` z `L + 0.12`, `W + 0.12`, pri ometu barva stene × (0.824, 0.8, 0.741), pri kamnu in opeki `[0.56, 0.54, 0.5]`; stene se začnejo pri tleh hiše (0 namesto −0,25, tudi stena ob sosedi). Stene na stopnji ≥ 2 po nadstropjih: pritličje proti cesti = okna + **ena** vrata v srednjem polju (`jd = floor((nb − 1) / 2)`) + okna, druge stene samo okna, brez garažnih vrat; zgoraj `upB` (1. nadstropje) in `upA`; blok kot zdaj. Atlas: nova vrsta `ST.grW = 1664` (prosto 1664–1792), pritličje samo z okni in enim praznim poljem (`ground(g0, kind, bays)`); mala stavba in pritličje pod 2,25 m: gladke stene, ena vrata proti cesti (pod 2,25 m brez); naslikana nizka ograja na francoskih oknih (`win()` pri `tall`). Streha: `pitch = min(pitch, clamp(hh * 1.3, 2.4, 5.2) / (W / 2))`. Stopnice do vrat, kjer so tla hiše več kot ~0,22 m nad terenom pred vrati (podest 1,5 × 0,9 m, stopnice 0,19/0,28 m, največ 8). »Nič izmišljenega«: dvorišče samo z `o.yard` (tudi prehod `yardOnly` pri krilih), sončne celice z `o.solar`, tende z `o.awn`, balkoni z `o.balc`; noben komplet jih ne vklopi.
3. Klic na Spaju: `HS.put({ x: bx, z: bz, L: Lb, W: Wb, ang, y0, hh: small && !H ? 0 : hh, type: small && !(H > 3.6) ? 'small' : 'house', u: [uw, R(), R()], dn: dnH, ri: riH, id: bi })` (brez `fl`; število klicev `R()` ostane enako).
4. Dovozi in poti do hiš **samo iz OSM** (`highway=service` s `service=driveway`, `footway`/`path` do stavbe; ograje iz `barrier=*`), v pasu ~60 m, samo videz: nove vrstice v `def.yard` proge Spa (vrsta 0 dovoz, 1 pot; riše jih `yardWorld`, brez spremembe `js/world.js`). Izhodišče Spaja v stopinjah ni v repozitoriju: ocena štartne črte ~50,4441 S, 5,9651 V (okvir ~5,949–5,988 V, 50,420–50,454 S), prileganje po središčih stavb OSM na `def.bld`; orodje ob `tools/proga-podatki.py`. Kjer OSM dovoza nima, ga ni.
5. Testi: `tests/browser/stavbe.test.mjs` (pogoja `spa.ograja >= 1` in `spa.rails === 1` prestavi na neposreden klic z `balc`/`yard`), `WORLD_ONLY=spa node tests/browser/world.test.mjs --update`, `PERF_ONLY=spa node tests/browser/perf.test.mjs`, `node tools/stamp.js --check`, `npm run test:related` (~40 min).
6. Slike prej/potem (Spa, kamera za avtom, 5282 m in 4895 m, ležeče, `tools/shot.mjs`; na sliki vsaj en dovoz iz OSM) na stran Odločitve z istim vprašanjem `realizem-s0-spa` (slik ne commitaj); PR #668 ostane osnutek do »ok«.

**Opombe za izvedbo (osnutek, nepreverjeno):** stena proti cesti v pritličju iz treh kosov (okna od `u0 / 8`, polje z vrati `d / 8 … (d + 1) / 8` iz vrste z vrati, nato okna); zgornja nadstropja `q(f * fh, (f + 1) * fh, vAt(vrsta + BAY − 0.5), vAt(vrsta + 0.5))`; odrezano pritličje `vAt(vrsta + BAY − 0.5) … vAt(vrsta + BAY * (1 − cut) + 0.5)`; pas pod napuščem `vAt(PL + 2 + min(60, knee * 44)) … vAt(PL + 2)`, `u` 0.1 … 0.1 + len / 23. Poravnava male stavbe na sosedo `b` (`cb`, `sb` njen kosinus in sinus): `d = o.ang − b[4]`, zložen v [−π/4, π/4], `fa = o.ang − d`, `q = round((fa − b[4]) / (π/2))`, polovici v sosedinem sistemu `hx = (q liho ? W : L) / 2`, `hz = (q liho ? L : W) / 2`, središče `lx = rx·cb + rz·sb`, `lz = −rx·sb + rz·cb`, premik po osi z večjim `|l| − polovica(b) − polovica(male)`, nazaj v svet `(b[0] + cb·lx − sb·lz, b[1] + sb·lx + cb·lz)`. Stopnice so škatle vzdolž kota stene `wf[2]` z zunanjo normalo `(wf[3], wf[4])` od `doorL`. Znana vrzel: slog `alp` meša leseno zgornjo vrsto z ometanim pritličjem (ni na Spaju). Sidra v `js/world-stavbe.js` pri commitu prvega kosa: podstavek v. 211, stene 214–246, streha 258, dimniki 288, sončne celice 292, tende 296, dvorišče 305–378, `put()` 469–495; atlas: `win()` 75, `door()` 89, `upper()` 105, `ground()` 112.
