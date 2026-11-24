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
  - hiša stoji vodoravno na tlorisu iz zemljevida: tla hiše so pri najvišji točki terena pod njo, do najnižje sega gladek podstavek, do vrat vodijo stopnice, kjer tla padajo (»Predaja 3«);
  - tik ob cesti (do 34 m za ograjo proge) še to, kar ob hiši stoji v podatkih proge (balkoni, dvorišče z zidom ali živo mejo in vrati, grmovje, nadstreški): na Spaju tega v podatkih ni, zato ni narisano (»nič izmišljenega«, »Predaja 3«);
  - do 64 m okna, napušč in dimniki; dlje samo stene iz atlasa in streha s slemenom, nad 300 m samo obris.
- **Česa namenoma ni:**
  - imen, napisov, logotipov, umetnin in kipov: hiše so generične (`docs/realizem.md`, »Pravna ocena po državah«);
  - hal, tribun, boksov in stavb nad 1500 m²: ostanejo, kot so;
  - orodja za podatke OSM, noči, zime in dežja na hišah ter drugih prog: glej »Predaja« spodaj.
- **Kako:**
  - nov modul `js/world-stavbe.js` (`World.stavbe`), v `index.html` takoj za `js/world-cesta.js`; `js/world.js` se ne spremeni;
  - graditelj proge pokliče `World.stavbe.setup({ Chunks, list, T, near, gH })`, za vsak tloris `put({ x, z, L, W, ang, y0, hh, type, … })` (tla hiše, nadstropja in lego male stavbe ob večji določi `put` sam: pravilo tal, »Predaja 3«) in na koncu `addTo(skupina)`; `fence(ax, az, bx, bz)` postavi zid ali ograjo po meri;
  - atlas fasad (1024 × 2048, pas na nadstropje, polje 128 px ≈ 2,9 m stene) se nariše na platno, ko ga proga prvič rabi, po eden na slog; fotografij in datotek v `assets/` ni, zato ni novega vira za »Zasluge«;
  - vse hiše proge imajo en material (stene in strehe; barve so v ogliščih), ograje drugega (isti atlas); mreže so po kosih pokrajine kot drugo okolje;
  - ravni podrobnosti: 1 boljše oblike in strehe, 2 še stene iz atlasa, 3 še to, kar stoji ob cesti (samo, kar zahtevajo podatki proge); obroča `d2` in `d1` sta v metrih za ograjo proge;
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
- **Telefon** (izmerjeno s `tests/browser/perf.test.mjs`, NIZKA, prej → potem): Spa 181 → 183 klicev risanja in 442 → 442 tisoč oglišč v kadru, na najbolj obremenjenem mestu 222 → 224 klicev in 573 → 571 tisoč oglišč (meja 300 in 900). Cilj paketa je bil +0 klicev; izmerjena sta +2. Hiše imajo 15 258 oglišč (pred popravki 24 360), cel svet proge 1 098 861 → 1 107 795 (s štirimi trakovi dovozov in poti do hiš). Prstni odtisi svetov (`tests/golden/world.json`) so enaki, razen Spaja.
- **Test:** `tests/browser/stavbe.test.mjs` (opis v `tests/README.md`).
- **Slike prej in potem** (kamera za avtom, Spa, Belgija): na strani Odločitve, vprašanje `realizem-s0-spa`; v repozitoriju jih ni.

### Predaja (12. 11. 2026)

- **Narejeno:** graditelj, atlas šestih slogov, kompleti 12 držav, priklop na Spa, test, referenca sveta za Spa.
- **Čaka:** uporabnikov »ok« na slikah. PR #668 ostane osnutek; do `main` ga pripelje seja Združevanje.
- **Pred združitvijo:** spoj svežega `main` za E (#657) z `node tools/spoji-main.mjs`; če se svet Spaja z E spremeni, referenco ustvari znova (`WORLD_ONLY=spa node tests/browser/world.test.mjs --update`) in preveri obremenitev (`PERF_ONLY=spa node tests/browser/perf.test.mjs`).
- **Manjka do konca S0** (naslednje seje):
  - orodje za podatke OSM ob `tools/proga-podatki.py` (oblika strehe, barve, material, nadstropja, obrisi stavb; Overture brez virov Google); dovoze in poti do hiš že da `tools/dovozi-osm.mjs` (»Predaja 3«);
  - sosednji tlorisi v zaselkih se prekrivajo, zato se strehe sekajo: male stavbe so od »Predaje 3« naslonjene na večjo sosedo, dva prizidka (vrstici 126 in 149) pa stojita ~11–14° od prave smeri, ker je večja hiša narisana kot pravokotnik; prizidki (`att`, `wings`) potrebujejo obrise iz orodja;
  - na slikah je pregledan samo komplet Belgije; drugih 11 test zgradi in prešteje, videl jih ni še nihče;
  - noč (svetla okna), zima (sneg na strehah) in dež na hišah niso preverjeni;
  - obris nad 300 m ni preizkušen na pravi progi (Spa takih hiš nima);
  - poraba pomnilnika: atlas 1024 × 2048 na slog;
  - +2 klica risanja na Spaju namesto ciljnih +0.
- **Kako se preveri:** `node tests/browser/stavbe.test.mjs`, `PERF_ONLY=spa node tests/browser/perf.test.mjs`, `WORLD_ONLY=spa node tests/browser/world.test.mjs`.

### Predaja 2 (13. 11. 2026): popravki po odgovoru uporabnika

Odgovor na `realizem-s0-spa` je »2 · Popravi videz« (13. 11. ob 00.07, v pogovoru z Matejem): mala hiška pred hišo je postrani; hiša je videti zakopana (okna malo nad in malo pod zemljo); hiša naj bo bolj realistična; hiše naj imajo pot do hiše, če jo imajo v resnici; »vedno delaj tako, kot je v resnici, nič si ne izmišljuj«. Ob tej predaji popravkov še ni bilo v kodi; naredila jih je naslednja seja v okolju »dirkaska-igra« (iz okolja »Default« `api.openstreetmap.org` ni dosegljiv, posrednik vrne 403): glej »Predaja 3«.

**Vzroki (Spa, slika pri 5282 m, vrstici `def.bld` 158 in 159):**
- Klic `HS.put` v `js/world-spa.js` poda `fl: small ? 1 : hh > 8.6 ? 3 : 2`: hiše z dano višino 2,6–4,1 m (13 od 23 vrstic z višino; vrstica 159 ima 3,2 m) dobijo dve nadstropji v ~3 m in ogromno streho (naklon kompleta 0,92 čez 17 m globine).
- `y0` je najnižja točka terena (4 vogali in sredina), stene se začnejo pri `y0 − 0,25`: zgornja stran hiše se vkoplje v pobočje, okna so deloma pod zemljo.
- Male stavbe (< 45 m², 28 vrstic, nobena nima višine) dobijo 5,4–7,6 m sten z enim raztegnjenim nadstropjem; 8 malih pravokotnikov sega v večjega (19→18, 94→96, 126→127, 140→133/139, 143→142, 145→144, 149→148/153, 158→159; do 1,05 m in do 15,5° zasuka): artefakt prileganja pravokotnikov, to je »mala hiška postrani«.
- Dvorišče z ograjo in vrati, grmi, parkiran avto, tende, sončne celice in balkoni so izmišljeni.

**Načrt (samo `js/world-stavbe.js`, klic v `js/world-spa.js`, test; `js/world.js` ostane):**
1. `put()`: predmet `fit`, združen za `o` (`Object.assign(…, look, o, fit)`): višina sten brez podatka (mala stavba `2.3 + hs(6) * 0.4`, hiša `5.4 + hs(6) * 2.2`); nadstropja iz višine, če jih klic ne poda (`max(1, floor((hh + 1) / 2.9))`, mala stavba 1); tla hiše iz `cfg.gH` po mreži tlorisa s korakom ≤ 3 m: `y0 = hi + 0.15`, `base = y0 − lo` (podstavek do najnižje točke, statistika `st.rise`); mala stavba, ki sega v večjo (vogal v pravokotniku vrste ≤ 1 s ploščino > 1,5×, osi se po modulu 90° razlikujejo < 0,35 rad): zasuk na osi sosede, premik ven do stika sten, stena proti sosedi dobi `att = 1` (po klicu `party()`), pri dveh sosedah tista z globljim prekrivanjem; `CR.block` in `exclPush` ostaneta na mestu podatkov; pravilo preveri na tlorisih OSM. Krila: `base.hh`/`base.fl` namesto `o.hh`/`o.fl`.
2. `house()`: višina nadstropja `fh = flats ? hh / fl : min(max(hh / fl, fl === 1 ? 2.9 : 0), 3.2)`; nizko pritličje pokaže spodnji del vrste atlasa (`cut = hh / fh`, do ~2,25 m); ostanek nad zadnjim nadstropjem je gladek pas pod napuščem (`knee = hh − fl * fh`, trak `PL`). Podstavek: škatla `o.base` z `L + 0.12`, `W + 0.12`, pri ometu barva stene × (0.824, 0.8, 0.741), pri kamnu in opeki `[0.56, 0.54, 0.5]`; stene se začnejo pri tleh hiše (0 namesto −0,25, tudi stena ob sosedi). Stene na stopnji ≥ 2 po nadstropjih: pritličje proti cesti = okna + **ena** vrata v srednjem polju (`jd = floor((nb − 1) / 2)`) + okna, druge stene samo okna, brez garažnih vrat; zgoraj `upB` (1. nadstropje) in `upA`; blok kot zdaj. Atlas: nova vrsta `ST.grW = 1664` (prosto 1664–1792), pritličje samo z okni in enim praznim poljem (`ground(g0, kind, bays)`); mala stavba in pritličje pod 2,25 m: gladke stene, ena vrata proti cesti (pod 2,25 m brez); naslikana nizka ograja na francoskih oknih (`win()` pri `tall`). Streha: `pitch = min(pitch, clamp(hh * 1.3, 2.4, 5.2) / (W / 2))`. Stopnice do vrat, kjer so tla hiše več kot ~0,22 m nad terenom pred vrati (podest 1,5 × 0,9 m, stopnice 0,19/0,28 m, največ 8). »Nič izmišljenega«: dvorišče samo z `o.yard` (tudi prehod `yardOnly` pri krilih), sončne celice z `o.solar`, tende z `o.awn`, balkoni z `o.balc`; noben komplet jih ne vklopi.
3. Klic na Spaju: `HS.put({ x: bx, z: bz, L: Lb, W: Wb, ang, y0, hh: small && !H ? 0 : hh, type: small && !(H > 3.6) ? 'small' : 'house', u: [uw, R(), R()], dn: dnH, ri: riH, id: bi })` (brez `fl`; število klicev `R()` ostane enako).
4. Dovozi in poti do hiš **samo iz OSM** (`highway=service` s `service=driveway`, `footway`/`path` do stavbe; ograje iz `barrier=*`), v pasu ~60 m, samo videz: nove vrstice v `def.yard` proge Spa (vrsta 0 dovoz, 1 pot; riše jih `yardWorld`, brez spremembe `js/world.js`). Izhodišče Spaja v stopinjah ni v repozitoriju: ocena štartne črte ~50,4441 S, 5,9651 V (okvir ~5,949–5,988 V, 50,420–50,454 S), prileganje po središčih stavb OSM na `def.bld`; orodje ob `tools/proga-podatki.py`. Kjer OSM dovoza nima, ga ni. (Popravek v »Predaji 3«: izhodišče je v `js/geo.js`, vendar samo približno; orodje `tools/dovozi-osm.mjs` ga prilega na tlorise.)
5. Testi: `tests/browser/stavbe.test.mjs` (pogoja `spa.ograja >= 1` in `spa.rails === 1` prestavi na neposreden klic z `balc`/`yard`), `WORLD_ONLY=spa node tests/browser/world.test.mjs --update`, `PERF_ONLY=spa node tests/browser/perf.test.mjs`, `node tools/stamp.js --check`, `npm run test:related` (~40 min).
6. Slike prej/potem (Spa, kamera za avtom, 5282 m in 4895 m, ležeče, `tools/shot.mjs`; na sliki vsaj en dovoz iz OSM) na stran Odločitve z istim vprašanjem `realizem-s0-spa` (slik ne commitaj); PR #668 ostane osnutek do »ok«.

**Opombe za izvedbo (osnutek, nepreverjeno):** stena proti cesti v pritličju iz treh kosov (okna od `u0 / 8`, polje z vrati `d / 8 … (d + 1) / 8` iz vrste z vrati, nato okna); zgornja nadstropja `q(f * fh, (f + 1) * fh, vAt(vrsta + BAY − 0.5), vAt(vrsta + 0.5))`; odrezano pritličje `vAt(vrsta + BAY − 0.5) … vAt(vrsta + BAY * (1 − cut) + 0.5)`; pas pod napuščem `vAt(PL + 2 + min(60, knee * 44)) … vAt(PL + 2)`, `u` 0.1 … 0.1 + len / 23. Poravnava male stavbe na sosedo `b` (`cb`, `sb` njen kosinus in sinus): `d = o.ang − b[4]`, zložen v [−π/4, π/4], `fa = o.ang − d`, `q = round((fa − b[4]) / (π/2))`, polovici v sosedinem sistemu `hx = (q liho ? W : L) / 2`, `hz = (q liho ? L : W) / 2`, središče `lx = rx·cb + rz·sb`, `lz = −rx·sb + rz·cb`, premik po osi z večjim `|l| − polovica(b) − polovica(male)`, nazaj v svet `(b[0] + cb·lx − sb·lz, b[1] + sb·lx + cb·lz)`. Stopnice so škatle vzdolž kota stene `wf[2]` z zunanjo normalo `(wf[3], wf[4])` od `doorL`. Znana vrzel: slog `alp` meša leseno zgornjo vrsto z ometanim pritličjem (ni na Spaju). Sidra v `js/world-stavbe.js` pri commitu prvega kosa: podstavek v. 211, stene 214–246, streha 258, dimniki 288, sončne celice 292, tende 296, dvorišče 305–378, `put()` 469–495; atlas: `win()` 75, `door()` 89, `upper()` 105, `ground()` 112.

### Predaja 3 (13. 11. 2026): popravki so v kodi, dovozi in poti iz OSM

Načrt iz »Predaje 2« je izveden. Nove slike prej in potem so na strani Odločitve pod istim vprašanjem `realizem-s0-spa`; PR #668 ostane osnutek do uporabnikovega »ok«. Po slikah je uporabnik v seji prosil še za mehak zavoj potke (»Mehki zavoji« spodaj); sliko zavoja prej in potem je dobil v seji. Vprašanja na strani ta seja ni spreminjala, ker je medtem že dobilo nov odgovor (»2 · Popravi videz«: potke, parkirišča in ceste ob hišah kot v resnici; izvaja ga druga seja na tej veji).

**Hiše (`js/world-stavbe.js`, klic v `js/world-spa.js`):**
- **Pravilo tal** (`put()`): hiša stoji vodoravno tam, kjer jo ima zemljevid. Tla hiše so 0,15 m nad najvišjo točko terena pod tlorisom, do najnižje sega gladek podstavek; teren se ne spremeni. Na Spaju se teren pod enim tlorisom dvigne do 4,99 m; 16 hiš ima do vrat stopnice (do 0,94 m).
- **Višina in nadstropja** iz podatka o višini: hiša s 3,2 m sten je pritlična, ne dvonadstropna; streha ni višja od sten. Mala stavba (pod 45 m²) je nizka, z enim nadstropjem.
- **Mala stavba ob večji:** 8 malih pravokotnikov, ki segajo v večjega, prevzame osi sosede in se umakne do stika sten (pri dveh sosedah do tiste z globljim prekrivanjem). To je bila »mala hiška postrani« (vrstica 158 ob 159).
- **Nič izmišljenega:** dvorišča z ograjo in vrati, grmov, parkiranega avta, tend, sončnih celic in balkonov na Spaju ni več. Graditelj jih nariše samo, če jih podatki proge zahtevajo (`yard`, `awn`, `solar`, `balc`). Vrata so ena, na prosti steni proti cesti.
- Tloris za trke in izključitev okolja ostaneta na mestu podatkov; fizika vožnje se ne spremeni.

**Pravilo, preverjeno na obrisih OSM** (pravi mnogokotniki `building=*`, lega kot pri dovozih):
- 7 od 8 malih stavb (vrstice 19, 94, 126, 143, 145, 149, 158) ima v OSM svoj obris točno na tlorisu (0,06–0,20 m od središča vrstice; 15–30 m²), ki si z večjim obrisom deli 2–4 točke. V resnici so prizidki ob večji stavbi, kot jih postavi pravilo.
- Vrstica 140 (16 × 1,8 m) v današnjem OSM nima obrisa (tam je en velik obris, 2650 m²): skupina ostane po podatkih proge.
- Kot med skupno steno v OSM in osmi večje vrstice, na katere pravilo poravna prizidek: 19→18 1,8°, 94→96 3,1°, 143→142 2,5°, 145→144 1,4°, 149→153 2,8°, 158→159 0,9° (v podatkih proge je bila vrstica 158 od te stene zasukana za 14,6°).
- **Znano odstopanje:** pri 126→127 in 149→148 je že pravokotnik večje hiše zasukan proti skupni steni za 11,4° in 14,3° (večja obrisa imata 5 in 15 oglišč). Prizidek stoji ob steni, ki jo igra nariše, vendar ~11–14° od prave smeri. Popravi ga šele orodje z obrisi stavb (»Manjka do konca S0«); prag na zasuku teh dveh ne loči od vrstice 158.

**Dovozi in poti do hiš iz OSM (`tools/dovozi-osm.mjs`, `js/tracks/spa.js`):**
- **Orodje:** `node tools/dovozi-osm.mjs spa --osm <mapa> [--json f.json] [--do 6]`. Kose po 0,01° prenese z `api.openstreetmap.org/api/0.6/map?bbox=…` v mapo (kar je že tam, ne prenaša znova) in izpiše vrstice za `def.yard`. Testnih prog in prog na odločanju ne obdela.
- **Lega:** okvir Spaja v `js/geo.js` je narejen za globus in je samo približen. Orodje ga prilega na tlorise: 66 od 97 tlorisov proge (hiše in hale) se ujame z obrisi stavb iz OSM, odmik središč je 0,06 m (mediana; 90 %: 0,20 m), popravek okvira 16,82 m in 27,63 m ter zasuk 0,619°. Če se tlorisi ne ujemajo na ~1 m (vsaj 8 parov), orodje ne izpiše ničesar.
- **Pravilo:** pot do hiše je dovoz (`service=driveway`), ki pride do hiše (do 6 m od tlorisa), in pot ali servisna cesta, ki se pri hiši slepo konča. Cesta, ki gre mimo hiš ali veže dve drugi cesti, in parkirišče to nista. Nariše se del v pasu 64 m za ograjo proge, vsaj 1 m od ograje in daljši od 4 m. Kar `def.yard` že riše, se ne nariše dvakrat.
- **Mehki zavoji** (prošnja uporabnika v seji, 13. 11. 2026: »naj bo mehak zavoj potke«): OSM da pot samo z lomi, na tleh pa je lom zavoj. Potka do hiše 147 je bila zato oster »V« (lom 138°). Orodje lom, ostrejši od 10°, nariše kot lok, ki se dotika obeh krakov: polmer dovoza 6 m, poti 4 m; manjši, kjer je krak prekratek ali bi lok prišel do ograje proge ali bliže tlorisu (pod 1 m lom ostane, kot je v OSM). Konca poti in priključek na že narisano pot ostanejo, kjer so. Lok je v podatkih (točke na ~1 m), `yardWorld` je nespremenjen. Na Spaju: potka do hiše 147 ima en lok (138°, polmer 4 m; vrh zavoja je ~7 m dlje od proge kot lom v OSM, narisana črta je 70 m namesto 81 m), dovoz do hiše 151 pet lokov (polmer 5,8–6 m), cesta do hiše 158 dva (6 m); dovoz do hiše 17 nima loma nad 10° in je enak.
- **Spa: 4 vrstice.** Od 230 poti v OSM ob progi jih 31 teče do 6 m od hiše, 9 je hišinih, 5 od teh v pasu nima dovolj dolgega kosa.

| m od starta | hiša (vrstica `def.bld`) | pot v OSM | narisano | vrsta |
|---|---|---|---|---|
| 236 | 17 | `service=driveway` | 39 m (daljnih 26 m je že v podatkih proge) | 0 dovoz |
| 4884 | 147 | `footway` | 82 m | 1 pot |
| 4957 | 151 | `service=driveway` | 80 m | 0 dovoz |
| 5287 | 158 | `service` | 126 m | 0 dovoz |

- **Izpuščeno:** 19 cest in povezav mimo hiš (7655 m v pasu) in 3 parkirišča (79 m) pridejo s paketom E (stranske ceste s križišči, `docs/realizem/paket-e.md`). Ograje `barrier=*` ob hišah (35) orodje samo izpiše v poročilo. Dovoz se lahko na daljnem koncu priključi na cesto, ki je do paketa E ni.
- **V progi:** `houseWays: 36` v `js/tracks/spa.js` pove, od katere vrstice `def.yard` naprej so poti do hiš. Riše jih obstoječi `yardWorld` (`js/world.js` je nespremenjen), samo videz, brez trkov. Šotori in avti tabora navijačev ne stojijo več na poti do hiše (`onWay` v `js/world-spa.js`); število klicev `R()` je enako, zato se drugo okolje ne premakne.
- **Vir:** OpenStreetMap (ODbL 1.0; `README.md`, »Zasluge«). Kjer OSM dovoza nima, ga ni.

**Številke:** 84 hiš od 86 tlorisov, 24 tik ob cesti; hiše 15 258 oglišč (prej 24 360); svet Spaja 1390 mrež in 1 107 867 oglišč (`tests/golden/world.json`, spremenjen samo Spa; mehki zavoji poti dodajo 72 oglišč, tla so enaka); telefon 183 klicev risanja (največ 224) in 442 tisoč oglišč (največ 571), referenca v `tests/golden/perf.json` ostane.

**Čaka:** uporabnikov »ok« na novih slikah. Pred združitvijo velja, kar piše v »Predaja (12. 11. 2026)«. Če E (#657) doda ceste ob hišah, orodje za dovoze poženi znova (isti dovoz se ne sme narisati dvakrat) in ustvari referenco sveta za Spa znova.

### Predaja 4 (14. 11. 2026): okolica hiš iz OSM, potke makadamske z globino

Odgovor na `realizem-s0-spa`: »2 · Popravi videz«, ker so hiše stale na goli travi, v resnici pa imajo dovoze, parkirišča in poti. Pravilo: »vedno delaj tako, kot je v resnici, nič si ne izmišljuj«. Po prvih slikah je uporabnik v seji prosil: »potke naj imajo globino kot makedamske ceste«.

**Okolica hiš (`okolica()` v `js/world-stavbe.js`, klic v `js/world-spa.js`, podatki `def.okolica` v `js/tracks/spa.js`):**
- Tla okoli vsake hiše v pasu 64 m. Vsak lik je polje, odrezano na pas in 1,2 m od ograj proge. Pod že narisanim se ne nariše (poti `def.yard` so prve), zato nič ni narisano dvakrat in nič ne sega na stezo.
- Asfalt je ena mreža z Lambertovim materialom kot `yardWorld`. Makadam je druga mreža z materialom makadamskih cest (tekstura, relief `makadamBump`, rjav rob). Material ni označen kot `userData.stavbe`.
- `js/world.js` (`yardWorld`) je nespremenjen, druge proge tudi.

**Iz OSM (`osm`, `tools/dovozi-osm.mjs spa --okolica f.json`):**
- **Asfalt:** 44 servisnih in tlakovanih poti v `def.yard` (izrezane na 30 m okoli hiš) in 6 parkirišč (`amenity=parking`), obrisi kot v OSM.
- **Makadam z globino:** 10 poti, med njimi vse potke (`footway`, `path`), ki jim OSM ne da tlakovane površine (pri Spaju so take vse), ter `track` in netlakovane poti.
- Potka do hiše (prvi korak orodja) ostane cela, z mehkimi zavoji (`soften`, »Predaja 3«). Široka je 2 m.

**Skromno dopolnilo, kjer OSM pri hiši do 3 m nima ničesar (`gen`, 14 hiš, 34 vrstic):**
- kratek makadamski dovoz do najbližje poti;
- makadamsko dvorišče pri vhodu;
- pas uhojenih tal ob hiši.

Brez izmišljenih avtov, ograj in predmetov.

**Številke:** svet Spaja 1444 mrež in 1 168 949 oglišč (`tests/golden/world.json`, spremenjen samo Spa); telefon 186 klicev risanja (največ 230) in 446 tisoč oglišč (največ 585 tisoč) na sličico, v mejah (`perf.test.mjs`, Spa).

**Vir:** OpenStreetMap (ODbL 1.0).

**Odgovor:** uporabnik je na `realizem-s0-spa-2` odgovoril »1 · Ostane tako« (14. 11. 2026 ob ~2.10). PR #668 je pripravljen, ostane osnutek; do `main` ga pripelje seja Združevanje. Predmete in ljudi ob potkah ter mehkejši prehod med potko in travo (prošnja uporabnika 14. 11.) dela druga seja na isti veji.

### Predaja 5 (14. 11. 2026): ob potkah klopi, svetilke in sprehajalci, mehak rob potke

Prošnja uporabnika (14. 11. 2026): »Ob takih potkah postavi na vsake toliko casa kaksen element. Klopca, svetilka, sprehajalec s psom, sprehajalec, 2 cloveka se skupaj sprehajata, ljudje kaksen sedi na klopci, in dodaj se kar mislis da je ob teh potkah kot recimo smeti itd... te potke so dobro vidne med igro tako da naj bodo dobro napravljene naredi neznejsi prehod med potko in travo saj ke to se vedno potka in ne asfaltirana cesta«. **Odločitev:** ta novejša, izrecna prošnja velja pred pravilom »nič si ne izmišljuj«, a samo ob potkah: predmeti in ljudje ob njih niso iz OSM, so generični (brez imen, napisov, logotipov).

**Mehak rob (`okolica()` v `js/world-stavbe.js`):** makadamske potke iz OSM (`osm`, širina > 0) imajo nepravilen rob (nekaj sinusov, ±0,25 m), barva pa na zadnjih 0,9 m preide v pohojeno travo (`WORN`); temnega roba makadamske ceste nimajo več. Dovozi in parkirišča so nespremenjeni.

**Ob potkah (`js/world-potke.js`, prek `World.peopleKit.EXTRA` v `js/world-ljudje.js`):**
- Vsaka potka (vrstice OSM, ki se stikajo, kot ena) je prizor `potka`: samo njen del, ki ga okolica nariše, vsaj 3 m od hiš, 8–60 m od ceste, dolg vsaj 25 m.
- Na zunanji strani (stran od ceste): svetilka na ~22 m, klop (na dolgi potki dve) obrnjena k potki, na njej kdo sedi in ob avtu pogleda, koš ob klopi, nekaj smeti v travi (papir, pločevinka, lonček), stojalo z vrečkami za pasje iztrebke na koncu.
- Sprehajalci gredo po potki tja in nazaj (`stroll()`, `act.path`): par drug ob drugem, kdo sam, kdo s psom na povodcu; vsak po svoji črti, da se srečajo.
- Spa: 4 prizori, 17 ljudi; drugih prog ne spremeni (okolica je samo na Spaju). Svet Spaja 1452 mrež, 1 183 139 oglišč (`tests/golden/world.json`).

### Predaja 6 (14. 11. 2026): potka se ne konča sredi travnika

Prošnja uporabnika (14. 11. 2026, slika pri 5315 m): »Potka se konca sredi travnika. To ni resnicno potke vedno nekam peljejo ali do hise ali do druge potke, ceste, itd...«

**Orodje (`tools/dovozi-osm.mjs --okolica`, `network()`):**
- Seme so poti do 25 m od hiš. Pot raste naprej po makadamskih poteh iz OSM, ki se je dotikajo, nato `meets()` obreže slepe konce. Vsak konec je pri hiši (4 m), pri drugi poti, ob cesti ali zunaj 64 m pasu.
- Asfaltna pot ostane samo v **strnjenih odsekih** do 30 m od hiš (`near()` vrne odseke). Prej je ostal ves kos od prve do zadnje hiše (do 560 m skozi gozd), zato je izginilo drevje.
- Na koncu orodje izpiše konce, ki se ne dotaknejo ničesar. Zdaj jih je 7 (prej 14), vsi pri ~40 m od ceste v gozdu, nobeden na travniku.

**Spa:**
- Potka pri 5315 m gre naprej iz slike, pri 5380 m pa do hiše.
- Gozd pri 1500 m je enak kot prej (0,0 % razlike). Dreves je 41 652 (prej 41 635).
- Obremenitev telefona: 186 klicev, 448 tisoč oglišč. Svet Spaja ima 1453 mrež in 1 192 789 oglišč.
- Vrstice `yard`, `okolica.osm` in `okolica.gen` v `js/tracks/spa.js` so izpis orodja, zato jih ne popravljaj ročno.

**Odprto:** nelokalni vpliv vrstic `yard` na drevesa. Ena dolga asfaltna vrstica je spremenila drevje ~390 m stran. `OK.on`, `excluded`, THIN, `maxT` in odstranjevanje na daljavo so izključeni. Če se ponovi, išči v taboru navijačev in izključitvah množic (`CR.circ`).

## S1: Nürburg in Livorno (veja `realizem/s1-stavbe`, nad #668; 14. 11. 2026)

Odločitev Mateja na tabli #382 (14. 11. 2026): »S1: prevzemi«. Veja je narejena iz `realizem/s0-stavbe` in gre na `main` za #668. Spa je narejen v S0 in se tu ne spreminja; Suzuka je testna proga (zamrznjena) in je S1 ne dela.

**Obseg:** Nürburg, Nemčija (`nring`), in Livorno, Italija (`livorno`): hiše skozi skupni graditelj (`World.stavbe`, komplet države), okolica iz OSM (dovozi, potke, parkirišča do ~64 m), predmeti ob potkah kot na Spaju. Vse kot v resnici, brez imen, napisov in logotipov; fizika vožnje in odtisi trkov ostanejo.

**Nürburg (`js/tracks/nring.js`, `js/world-nring.js`):**
- 107 hiš gradi skupni graditelj (komplet Nemčije, slog `north`; 11 ob cesti); hale in tribuna (nad 1500 m²) ostanejo svoje.
- Okolica iz OSM po pravilih S0 (Predaja 6, `tools/dovozi-osm.mjs --okolica`):
  - v `yard` 1 pot do hiše in 13 asfaltnih poti (samo strnjeni odseki do 30 m od hiš);
  - v `okolica` 168 oblik: 163 makadamskih poti (zrastejo iz poti ob hišah po skupnih točkah, slepi konci so obrezani) in 5 parkirišč;
  - skromna dopolnitev pri 9 hišah (15 vrstic `gen`).
- Ob potkah 62 prizorov in 246 ljudi, od 0,6 do 8 km, ob gozdnih in travniških poteh.
- Drevesa in tabor navijačev se okolici umaknejo z enakimi žrebi. Drevesa na poteh samo izginejo, nobeno se ne premakne (slike pri 4370 m).
- Svet ima 3872 mrež in 2 525 682 oglišč.
- Obremenitev: 171 klicev in 310 tisoč oglišč, na najbolj obremenjenem mestu 198 / 326 (prej 156 / 180 klicev in 271 / 288 tisoč oglišč).
- V kameri za avtom so hiše zunaj slike: OSM ima samo 7 hiš do 40 m od ceste, zgrajene so 27–37 m od nje. Vidijo se potke s prizori (npr. makadam s svetilkami pri 4300 m) in presledki v drevju, kjer gredo poti.

**Livorno (`js/tracks/livorno.js`, `js/world-livorno.js`):**
- 1113 od 1127 stavb gradi skupni graditelj (komplet Italije, slog `med`; 831 ob cesti): hiše, lope, garaže in bloki. Cerkve, gradovi, stolpi, ruševine, trgovine, javne stavbe in rastlinjaki ostanejo po starem.
- Okolica iz OSM po pravilih S0:
  - v `yard` 34 poti do hiš, 46 asfaltnih poti (strnjeni odseki do 30 m od hiš) in 18 mestnih pločnikov, peš poti in stopnic brez oznake površine (narisani kot asfalt, `yard` vrsta 1);
  - v `okolica` 126 oblik: 25 parkirišč in 101 neasfaltirana pot (makadam: samo izrecno neasfaltirane poti, kolovozi in steze brez asfaltne površine; zrastejo po skupnih točkah, slepi konci so obrezani).
- **Brez splošnega dopolnila** (`gen: []`): v mestu ulic in pločnikov ne štejemo za površino ob hiši, zato bi dopolnilo izmislilo dvorišča, dovoze ali pasove zemlje pri ~900 hišah, ki jih zemljevid nima (tabla: nič izmišljenega).
- Ob potkah 53 prizorov in 209 ljudi, od 1,7 do 18,8 km. 25 prizorov je v gosti mreži potk med 17,7 in 18,8 km.
- Drevesa se okolici umaknejo (žreb po kraju, ne po vrsti).
- Svet ima 1967 mrež in 1 489 738 oglišč.
- Obremenitev: 144 klicev in 300 tisoč oglišč, na najbolj obremenjenem mestu 182 / 381 (prej 141 / 173 klicev in 288 / 351 tisoč oglišč).

**Konci poti (preverjanje v orodju):**
- Konec poti je povezan tudi na robu pasu, merjenem od sredine ceste (64 m, kjer `nrNear` neha). Prej se je pas meril samo od ograje, zato je Nürburg kazal 124 lažnih slepih koncev.
- Ostanejo 3 konci na Nürburgu: makadam 41795615 pri 4340 m (6 m od ceste), 923094807 pri 4850 m (11 m) in 923094808 pri 4846 m (14 m).
- Ostanejo 4 konci v Livornu: makadam 684994078 pri 18685 m (6 m), 1395103455 pri 14503 m (4 m), 1420131325 pri 13151 m (41 m) in 1420131327 pri 13149 m (45 m).

**Odprto (vprašanje v PR #696): gostota prizorov ob potkah.** Pravilo S0 da prizor vsaki potki, ki je dolga vsaj 25 m. Na Spaju so 4 prizori, na Nürburgu 62, v Livornu 53. Ko uporabnik odgovori, se odgovor vpiše sem.

**Enaki žrebi:** veji hiš v graditeljih prog naredita iste žrebe v istem redu kot prej (bloki `u: [crH, R(), R()]` namesto dveh `vary`, hiše `R()` namesto enega), zanka dreves žreba po kraju. Predmeti, gledalci in `propsHash` so na obeh progah enaki kot prej; druge proge se ne spremenijo.

**`jsMs` v `tests/golden/perf.json`** je samo za vednost: med vzporednimi testi je izmerjen čas napihnjen (Livorno 4,6–5,3 ms), zato ostane prejšnja vrednost.

**Spori z E1 (#678, veja `realizem/e1-nurburg-tianmen`), samo za vednost:** `js/tracks/nring.js` (vrstica `yard` ob E1 `stranske:`), `js/world-nring.js` (pogoj `plant`: `OK.on` ob E1 `naCesti`; vrstica statistike), `js/world-livorno.js` (vrstica statistike: E1 doda `lamps`, `stops`, `mouthPosts`), `tests/golden/perf.json` in `world.json` (za `nring` in `livorno` znova). Vsi so sosednji: obdrži oboje. E1 stranske ceste (OSM `highway=service` ob progi) se na Nürburgu lahko prekrivajo z asfaltnimi potmi okolice; ob spoju preveri, da ni dvojnega risanja.

## S2: Montréal in Bâlea (veja `realizem/s2-montreal-balea`, nad #696; 15. 11. 2026)

Odločitev Mateja na tabli #382 (15. 11. 2026). PR #699. Obe progi imata v `PROGE` raven 3 (`d2` 34, `d1` 64).

**Montréal (`js/world-montreal.js`, `js/tracks/montreal.js`):**
- 360 manjših stavb brez imena (pod 1500 m², skoraj pravokotnih) gradi skupni graditelj na obrisih iz podatkov (komplet Kanade, 60 % ravnih streh). Višina je iz podatkov, sicer privzeta za vrsto. Paviljoni, boksi (`pitBld`, enak obrisu Paddocks) in velike stavbe ostanejo svoji, na svojih obrisih.
- Izključitve dreves ostanejo enake kot prej (isti krogi v istem redu), zato se drevesa drugod ne premaknejo (0 % razlike pri 1300, 2000 in 3400 m).
- Tribune na obrisih iz OSM (`def.bleachers`, 4 obrisi `leisure=bleachers`): do 20 vrst, ki se dvigajo od ceste. Zadaj je ploščad z ograjo, na tribunah ni ljudi (malo gledalcev). Sprednji rob ostane vsaj 3 m za robom ceste. Približne začasne tribune (`def.stands`) so odstranjene (`stands: []`): odločitev uporabnika 15. 11. 2026, »Postavi samo tribune, ki so v resnici tam.« Ostanejo samo 4 tribune iz OSM.
- Obremenitev: 184 klicev in 429 tisoč oglišč, na najbolj obremenjenem mestu 243 / 532 (prej 185 / 242 klicev in 443 / 535 tisoč oglišč).

**Bâlea (`js/world-prelaz.js`):**
- 14 koč in hotelov ter postajo žičnice gradi skupni graditelj na pravih obrisih (komplet Romunije, slog `gora`).
- Postaja: ravna streha, višina do ploščadi vrvi (2 nadstropji); ploščad nad streho nadomesti prejšnji kvader.
- `rise` do 21 m: postaja in velike hiše stojijo na strmem DEM, enaki kamniti podstavki so bili že prej. Postaja je 47 m od ceste.
- Obremenitev: 156 klicev in 361 tisoč oglišč, na najbolj obremenjenem mestu 187 / 436 (enako kot prej).

## S4: Štajerska (veja `realizem/s4-stajerska`, nad #699; 15. 11. 2026)

Odločitev Mateja na tabli #382 (15. 11. 2026). PR #713. Graditelj je skupni `js/world-rbring.js` (Štajerska, Bathurst, Rio, Crystal Palace): spremembe so samo v vnosih Štajerske, vrstni red R()/RX() je enak, reference drugih prog se ne spremenijo.
- **Hiš ni**: v pasu do 64 m od ceste sta v OSM samo 2 stavbi (ena v paddocku za boksi, ena 62–71 m od ceste), zato ni kompleta stavb in ne vnosa v `PROGE`.
- **Tribune na obrisih iz OSM** (`def.stands`, 9. polje `front`: sprednji rob od sredine ceste, število ali [na začetku, na koncu]): Start-Ziel 21 m, Steiermark 20 m, tribuna na hribu v treh kosih (43 m; 32 → 24 m; 31 → 50 m), T10 48 → 32 m. Sprednji rob ostane vsaj 2,6 m za ograjo. T3, Nord in T9 v OSM nimajo para blizu ceste in ostanejo kot prej; Mitte (53 → 44 m), Ost (70 → 53 m) in Nord (115 m) stojijo na obrisih iz OSM, čeprav jih kamera za avtom ne vidi (odločitev uporabnika 15. 11. 2026: 1.1 in 2.2).
- **Krilo** na Start-Ziel se premakne s tribuno (`wing[2]` 6,9 m).
- **Boksi**: stavba na obrisu iz OSM (`pitBuilding` −165…140, prej krajša); spredaj ostane pri garažah. Ravna tla kompleksa (`pitPad` −235…140) so na začetku enaka kot prej, vozna površina (`pit`) se ne spremeni.
- **Prehod pred tribunami** (`World.people`, skupni; popravek 24. 11. 2026 po pripombi uporabnika »za vsako progo posebej«): `def.standWalk` = [od, do, pasovi] po sredini tribune v metrih proge; pasovi od čela tribune navzven [vrsta, širina]: 0 tlakovci, 1 trava, 2 asfaltni servisni pas, 3 beton; ena širina je lahko `null` (prilagodi se razdalji do zidu). Tribune brez vnosa (in vse druge proge) obdržijo dosedanji pas (`def.standApron`).
  - Prerezi po OSM (razdalje od sredine proge): **Start-Ziel** zid 10,4–10,7 m, sredina servisne ceste 13,5–14,1 m, čelo tribune 18,1–18,3 m → tlakovci (≈4,8 m), robnik, asfaltni pas 3,6 m, beton 0,5 m do zidu. **Steiermark** zid 11,2 m, cesta 12,4–12,5 m, tribuna 18,2–20 m → sam asfaltni pas. **Tribune na hribu** (5 kosov): samo trava. **T10** cesta 3–6 m pred tribuno → trava 1,4 m, pas 3,5 m. **Ost** cesta 3,5–7 m → trava 3,3 m, pas 3,5 m. **Mitte** cesta 16–19 m spredaj → trava 14,7 m, pas 3,5 m (narisan samo v dolžini vsake tribune). **Nord (oddaljena)** cesta 9–17 m → trava 8,5 m, pas 5 m; s proge se ne vidi. T3, Nord ob progi in T9: v OSM ni dovolj podatkov, dosedanji pas.
  - Iz OSM so lege zidov, cest in tribun. OSM nima oznak za robnike, talne črte, požiralnike in širine cest, zato so **privzeti**: širine pasu 3,5–3,6 m (5 m pri Nord), robnik med pasom in tlakom, beli robni črti (pas ≥ 2 m), rešetka požiralnika ob robniku na 24 m. Ograje (`barrier=fence`) so v OSM samo pri T9, prehodov za pešce pred tribunami ni (zebre so samo za tribuno Start-Ziel), zato jih ni niti v igri.
  - **Boksi** (`def.pitDrain`, `js/world-rbring.js`): linijski odtok ob vznožju garaž z jekleno prečko na 2 m in stiki betonskih plošč (vzdolžni, prečni na sredini vsakega 10-metrskega boksa); privzeto, OSM teh podatkov nima. Znana razlika: po OSM je od boksnega zidu (8,4–9,2 m) do čela stavbe (18,8 m) ≈10 m, v igri sta hitri pas 7 m in ploščad 9 m; mere ostanejo, ker so vezane na postanek v boksih.
  - **Druga dirkališča s tribunami** (vsako potrebuje svojo analizo OSM in svoj `standWalk`, ni v tem PR): Aguascalientes, Batangas, Bathurst, Biķernieki, Buriram, Kågeröd, Kildare, Lombok, Lusail, Montreal, Pembrey, Quezaltepeque, Termas de Río Hondo, Sakhir, Sepang, Silkeborg, Sosnová, Tuzla, Zandvoort. Zamrznjene proge ostanejo.
- Obremenitev (24. 11., s prehodi po `standWalk`; `PERF_ONLY=rbring`): 208 klicev in 507 tisoč oglišč, na najbolj obremenjenem mestu 246 / 682 (meja ~300 / 900; brez prehodov 208 / 246 klicev in 503 / 675 tisoč oglišč; v zagonu vseh prog zapored 216 / 258 klicev in 501 / 682 tisoč; `tests/golden/perf.json`).
- `tests/browser/ljudje.test.mjs`: sprehajalec sredi stopnice, višje od 0,3 m (na prehodih tribun so do 0,53 m, tudi prej do 0,47 m), na svoji poti nad stopnico pred njo ni »v zraku«; prej je test uspel samo zato, ker v izbranem trenutku nihče ni bil sredi take stopnice.
