# Zgumirana linija po uporabnikovi vožnji

Načrt 9. 11. 2026 (Matej), prototip za slike 10. 11. (osnutek #623), izvedba 15. 11. 2026 (PR #717, račun partyslo). Številke vrstic so približne.

## Odločitve uporabnika
- 9. 11. 2026 ob ~23.54: »zgimirana linija naj gre po moji voznji po moji liniji tam kjer je posneta tam kjer pa ni pa naj zaenkrat predvideva dokler ne posnamem vseh prog«.
- 9. 11. 2026 ob ~23.55: »zgumirano linijo daj prvo v sliki v predogled in ne zacni z delom dokler je ne potrdim«.
- 10. 11. 2026 ob ~00.57, po slikah: »Da, tudi na odprtih cestah«. Guma gre po uporabnikovi liniji, samo videz, in pride tudi na ceste brez boksov (npr. Tianmen), kjer je prej ni bilo.
- 10. 11. 2026 med ~02.00 in ~03.00, po slikah prototipa: »Plast gume naj bo sirsa« (6,2 m namesto 3,5 m).
- 10. 11. 2026 ob ~03.30 (tabla #382, komentar 6757283997; vprašanje `zgumirana-linija-1`): **možnost 1**, vse po uporabnikovi liniji: guma, ki se nabira, in stalne sledi v svetu (temni pas, sledi zaviranja), na dirkališčih in na odprtih cestah.
- Zagon izvedbe: Matej 15. 11. 2026 ob ~2.25 (tabla #382, komentar 6887191720).
- 16. 11. 2026 ob ~2.32, po slikah zdaj/potem (Spa, Tianmen), kot klikljiva izbira v pogovoru s koordinacijo računa partyslo (vprašanje `zgumirana-linija-2`): **možnost 1**, »V redu, na main«. PR #717 gre po vrsti na `main`.

## Obseg
- Guma (temna sled na liniji vožnje) se riše po liniji uporabnikove vožnje, kjer je posneta (zdaj Tianmen); kjer ni, po predvideni liniji iz sloga vožnje. Ko uporabnik posname nove proge, jih guma prevzame brez spremembe kode.
- Po isti liniji gredo kroglice gume ob njej in stalne sledi v svetovih: temni pas, kolesnice in sledi zaviranja (možnost 1).
- **Samo videz.** Oprijem ostane na izračunani liniji (`rubberAt`, +2 %, in `marbles()`, −6 %), tekmeci vozijo po svojih linijah kot prej: fizika vožnje se ne spreminja (`CLAUDE.md`, Seje, »Fizika vožnje se ne spreminja«). Reference `tests/golden/races.json` in `tests/golden/sim.json` se ne smejo spremeniti.
- **Samo prave proge.** Testne proge, proge na odločanju ter Suzuka in Medvode (zamrznjeni brez oznake) ostanejo na izračunani liniji s staro plastjo; njihovi svetovi niso spremenjeni.

## Izvedba
- **`js/core.js`**: `Track.gl` je linija gume (m od sredine ceste, kot `rl`), `Track.gld` obremenitev gum ob njej (0..1: zaviranje in ovinki; teža plasti). Brez uporabnikove linije je `gl` kar `rl` (isti seznam) in `gld` `null`. `Track.voznjaLinija(profili)` (~1117) ju nastavi: izmerjen suh profil te proge (`VOZNJA_PROFILI`, `js/data/voznja.js`) ima prednost, sicer linija iz sloga (`VOZNJA_SLOG`, `voznjaIzSloga`); odmik da `voznjaOdmik` (~6568), linija ostane na asfaltu (1,7 m od roba oziroma do izračunane linije, če je ta bolj zunaj). Vrne, ali proga linijo ima; klic s praznim seznamom jo vzame. `Track.marblesAlong(gl)` da pas kroglic za videz; `marbles()` (oprijem) ostane ob `rl`.
- **`js/game.js`** (~237): `getTrack` pokliče `voznjaLinija` za vsako pravo progo, torej brez `test`, `pending` in `GUMA_BREZ` (Suzuka, Medvode: iz seznama gresta, ko dobita oznako).
- **`js/render.js`** (~3905–4012), `rubberLine(R)`: na progi z linijo sedem stolpcev (`RUB_OW`, 6,2 m, proti robu zbledi, nikoli čez rob asfalta), teža 0,4 + 0,6 · gld^0,7. Dirkališče (`rubberLap`): ena mreža, raste z gumo dirke kot prej (prosojnost 0,22 + 0,5 · rb). Odprta cesta (`rubberRoad`): stalna raven `RUB_OPEN` 0,6 (v snegu × `RUB_SNOW`, na mokri cesti izgine), v kosih po `RUB_CH` = 128 vzorcev, riše se samo do konca megle. Kroglice (`marbles`) ležijo ob isti liniji. Proga brez linije: stara plast (5 stolpcev, 3,5 m), odprta cesta brez linije nima plasti.
- **Svetovi**: stalni temni pas, kolesnice in sledi zaviranja berejo `T.gl || T.rl`: `js/world.js` (`tyreMarks` in pasovi), skupni pomočniki `js/world-cesta.js`, `js/world-gore.js`, `js/world-prelaz.js` ter svetovi pravih prog (caracoles, chapman, harju, katu, livorno, montreal, nring, pikes, rastro, rbring, spa, tianmen). Pri zamrznjenih progah je `gl === rl`, zato skupni pomočniki zanje rišejo enako kot prej.
- Razlika med linijama: Tianmen največ 5,6 m, Spa največ 2,8 m (v ovinkih); na ravninah se liniji ujemata.

## Testi in reference
- `tests/zgumirana-linija.test.js` (brez brskalnika): linija (Tianmen izmerjena, Spa iz sloga, vedno na asfaltu), oprijem gume in kroglic na izračunani liniji, ista dirka z linijo in brez nje enaka do bita (Spa z gumami, Tianmen).
- `tests/browser/zgumirana-linija.test.mjs` (~214 s): Spa (ena mreža, 7 stolpcev, 6,2 m, kroglice ob liniji, cesta temnejša), Tianmen (kosi, bližnji narisani in daljni ne, v dežju brez plasti), zamrznjene proge (Crystal Palace, Jezero, Suzuka, Medvode: brez linije, stara plast).
- Povezani testi: `tests/run.js`, `RELATED` (`js/core.js`, `js/render.js`, `js/game.js`, `js/data/voznja.js`).
- **Odtis sveta** (`tests/golden/world.json`): nove vrednosti samo za 15 pravih prog, ker so se temni pas, obraba in sledi premaknili na uporabnikovo linijo (do +408 oglišč na progo; število mrež enako, razen Chapman's Peak +1 in Livorno −1). Vnosi zamrznjenih prog so nespremenjeni. Ukaz: `WORLD_ONLY=<prave proge, z vejico> node tests/browser/world.test.mjs --update`.
- **Dirke in fizika**: `tests/golden/races.json` in `tests/golden/sim.json` sta nespremenjena (`node tests/races.test.js`).

## Obremenitev
Meritev 15. 11. 2026: `PERF_ONLY=<prave proge, z vejico> node tests/browser/perf.test.mjs`. Vseh 15 pravih prog ostane pod 300 klici risanja in 900 tisoč oglišči, v povprečju in na najbolj obremenjenem mestu; `tests/golden/perf.json` ni spremenjen (vse je v dovoljenem odstopanju testa). Spodaj klici risanja in tisoč oglišč na najbolj obremenjenem mestu, prej → zdaj.
- Dirkališča z boksi (guma dirke; ista ena mreža, le širša): Spa 222 → 222 klicev, 573 → 587 tisoč oglišč; Štajerska 262 → 262, 669 → 677; Bathurst 249 → 249, 472 → 484; Montréal 242 → 243, 535 → 545.
- Odprte asfaltne ceste (kosi plasti, risani do konca megle): Tianmen 213 → 220, 555 → 587; Los Caracoles 190 → 198, 394 → 430; Bâlea 187 → 193, 436 → 464; Harju 204 → 209, 698 → 717; Rio do Rastro 172 → 176, 476 → 494; Pikes Peak 128 → 131, 337 → 346; Chapman's Peak 147 → 148, 487 → 492.
- Brez plasti in brez spremembe: Nürburg in Livorno (krožni progi brez boksov; Livorno 351 → 352 zaradi sledi), Pikes Peak (makadam) in Katu-Jaryk (plast je samo na asfaltu, `rubberW`).
- Na mestih meritve v testu teme: Spa 203 klicev s plastjo in 202 brez nje, Tianmen 181 in 179.

## Slike zdaj/potem
- `node tools/shot.mjs spa --m 2860 --guma 0.8 --velika --lezece --pred main` in `node tools/shot.mjs tianmen --m 940 --velika --lezece --pred main` (kamera za avtom; `--guma`: guma, nabrana pozno v dolgi dirki, ker je ob štartu ni). Slik ne shranjuj v repozitorij.
- Slike za uporabnikov »ok« pred `main` (Spa in Tianmen, zdaj in potem) so na strani Odločitve računa partyslo, vprašanje `zgumirana-linija-2` (`docs/vprasanja.md`); »ok« je dan 16. 11. 2026 (»Odločitve uporabnika«).
