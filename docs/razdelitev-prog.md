# Razdelitev skupnih datotek prog po progah

Tema iz `docs/vrsta.md` (račun 3, koordinacija VSE SEJE 2): koda in nastavitve vsake prave proge naj bodo v njenih datotekah, da imajo veje, ki dodajajo ali urejajo različne proge, čim manj sporov. Vedenje igre in slike se ne spremenijo (reference v `tests/golden/`, `perf.test.mjs`); testne proge (`test: true`) ostanejo, kjer so.

## Kje so nastajali spori (veje Killar, Hakone, Bâlea, Medvode, tribune)

Svet prav prog je že v `js/world-<tema>.js` (izjema: `js/world-rbring.js` s Štajersko, Bathurstom, Crystal Palace in Riom). Spori so nastajali v skupnih seznamih, ki jih vsaka nova proga dopolni, pogosto v isti dolgi vrstici:

| Datoteka | Seznam | Rešitev |
|---|---|---|
| `js/render.js` | `THEMES`, `SPLIT` (svetloba, megla, nebo, barvni ton) | `look` (in `look.split`) v datoteki proge |
| `js/game.js` | `EN_NAME` (ime v komentarju), `RAIN_P` (dež v naslovni predstavitvi) | `say`, `rainP` v datoteki proge |
| `js/world.js` | `GRASS_NAT`, `CLOUD_TH`, `LAWN`, `ROAD_WEAR`, `BB_CLASSIC` | `grassNat`, `cloudTh`, `lawn`, `roadWear`, `bbClassic` v datoteki proge |
| `js/world.js` | sproščanje mrež zadnje gradnje (`if (THEME !== …) API.X = null`) | `World.keep(ključ, tema)` v datoteki sveta proge |
| `js/world-zivali.js` | `ZIV` (živali in predmeti ob cesti) | `zivali` v datoteki proge |
| `js/world-rbring.js` | lastni deli Bathursta, Crystal Palace in Ria | `js/world-bathurst.js`, `js/world-cpalace.js`, `js/world-rio.js` |

## Orodje `tools/razdeli-proge.mjs`

Premike podatkov (vrstice zgornjih seznamov v datoteke prog) naredi orodje, zato se razdelitev ob spajanju lahko ponovi na svežem `main`:

- `node tools/razdeli-proge.mjs` premakne vnose pravih prog iz skupnih seznamov v `js/tracks/<id>.js` (na začetek opisa proge, takoj za `TRACK_DEFS.push(`), testne pustí. Ponovni zagon ne spremeni ničesar.
- `node tools/razdeli-proge.mjs --check` samo preveri (test `tests/razdelitev.test.js`): vnos prave proge v skupnem seznamu je napaka.

## Spajanje z vejo, ki še dodaja v stare sezname

Spor v vrstici skupnega seznama (npr. `const EN_NAME = {…}`): obdrži stran z vnosi (stara oblika, vse proge), nato `node tools/razdeli-proge.mjs`, ki vnose premakne v datoteke prog. Nova proga po razdelitvi ničesar ne dopisuje v te sezname: polja da v svojo datoteko (`tools/nova-proga.mjs` to že dela).

## Stanje

- [ ] orodje in premik podatkov (`look`, `say`, `rainP`, polja sveta, `zivali`)
- [ ] `World.keep` namesto seznamov v `build()`
- [ ] `js/world-rbring.js` razdeljen po progah
- [ ] testi: `world.test.mjs` (odtis sveta vseh prog), `perf.test.mjs`, povezani testi
