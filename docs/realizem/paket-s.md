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
