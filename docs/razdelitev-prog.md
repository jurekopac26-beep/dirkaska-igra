# Razdelitev skupnih datotek prog po progah

Tema iz `docs/vrsta.md` (račun 3, koordinacija VSE SEJE 2): koda in nastavitve vsake prave proge naj bodo v njenih datotekah, da imajo veje, ki dodajajo ali urejajo različne proge, čim manj sporov. Vedenje igre in slike se ne spremenijo (reference v `tests/golden/`, `perf.test.mjs`); testne proge (`test: true`) ostanejo, kjer so.

## Kje so nastajali spori (veje Killar, Hakone, Bâlea, Medvode, tribune)

Svet pravih prog je že v `js/world-<tema>.js` (izjema: `js/world-rbring.js` s Štajersko, Bathurstom, Crystal Palace in Riom). Spori so nastajali v skupnih seznamih, ki jih vsaka nova proga dopolni, pogosto v isti dolgi vrstici:

| Datoteka | Seznam | Zdaj |
|---|---|---|
| `js/render.js` | `THEMES`, `SPLIT` (svetloba, megla, nebo, barvni ton) | `look` (in `look.split`) v datoteki proge |
| `js/game.js` | `EN_NAME` (ime v komentarju), `RAIN_P` (dež v naslovni predstavitvi) | `say`, `rainP` v datoteki proge |
| `js/world.js` | `GRASS_NAT`, `CLOUD_TH`, `LAWN`, `ROAD_WEAR`, `BB_CLASSIC` | `grassNat`, `cloudTh`, `lawn`, `roadWear`, `bbClassic` v datoteki proge |
| `js/world.js` | sproščanje mrež zadnje gradnje (`if (THEME !== …) API.X = null`) | `World.keep(ključ, tema)` v datoteki sveta proge |
| `js/world-zivali.js` | `ZIV` (živali in predmeti ob cesti) | `zivali` v datoteki proge |
| `js/world-rbring.js` | lastni deli Bathursta, Crystal Palace in Ria | `js/world-bathurst.js`, `js/world-cpalace.js`, `js/world-rio.js` |

## Kako je zdaj

- **Nastavitve**: v `js/tracks/<id>.js` takoj za `TRACK_DEFS.push({` je blok z oznako orodja (`look`, `say`, `rainP`, `cloudTh`, `roadWear`, `grassNat`, `lawn`, `bbClassic`, `zivali`). Datoteke prog se naložijo pred `js/world.js`, `js/render.js` in `js/game.js`; za vsakim skupnim seznamom je ustvarjena vrstica, ki ga ob nalaganju dopolni iz `TRACK_DEFS` (vnos v seznamu ima prednost). V seznamih so le testne proge. Različica proge (`variantOf`, npr. `pikesg`) podeduje polja svoje proge.
- **Mreže med gradnjami**: `World.keep('PK', 'pikes')` v `js/world-pikes.js` (pred `World.ext.pikes = …`) pove, da svet obdrži mrežo `API.PK` (ali `NR`) med svojimi gradnjami; `World.build` sprosti mreže drugih svetov (tabela `KEEP` v `js/world.js`).
- **`js/world-rbring.js`** je skupni graditelj Štajerske in treh prog (`buildRbring`, `rb*`, `RB_LOOK.rbring`). Lastni deli Bathursta, Ria in Crystal Palace so v `js/world-bathurst.js`, `js/world-rio.js`, `js/world-cpalace.js`, naloženih pred njim (`index.html`): kar uporabljajo graditelj, World in drugi svetovi, dajo v `World.api`, videz (vnos tabele `RB_LOOK`) v `API.rbLook`; graditelj jih vzame z ustvarjenima vrsticama `const { … } = API;` in `Object.assign(RB_LOOK, API.rbLook);`. `World.ext.rio` itd. pokliče `World.ext.rbring`. Del je stavek na vrhu datoteke (zamik 2) s komentarjem pred njim; progi pripada po imenu (`BT_*`, `bt*`, `au*` Bathurst; `RIO_*`, `rio*` Rio; `CP_*`, `CPK`, `cp*` Crystal Palace; tabela `WSPLIT` v orodju).

## Orodje `tools/razdeli-proge.mjs`

Premike naredi orodje, zato se razdelitev ob spajanju lahko ponovi na svežem `main`:

- `node tools/razdeli-proge.mjs`: vnose pravih prog iz skupnih seznamov premakne v datoteke prog, vrstice `if (THEME !== …) API.X = null` v `World.keep`, lastne dele Bathursta, Ria in Crystal Palace iz `js/world-rbring.js` v njihove datoteke (in vpiše njihove `<script>` v `index.html`). Enaka vrednost na obeh mestih gre tiho; ponovni zagon ne spremeni ničesar.
- `--check`: samo preveri (izhod 1, če bi kaj spremenilo; test `tests/razdelitev.test.js`).
- **Razlika** (vnos v seznamu ali del v `js/world-rbring.js` drugačen kot v datoteki proge): orodje ne spremeni ničesar, izpiše razlike in konča z izhodom 2. Izbira: `--seznam` (vrednost iz seznama oz. `js/world-rbring.js`) ali `--proga` (iz datoteke proge oz. njenega dela), za posamezne proge `--seznam=spa,rio --proga=bathurst`.
- Na koncu preveri, da ima vsaka proga po dopolnitvi seznamov enake vrednosti kot prej (razen izbranih), in se ustavi, če bi del sveta uporabljal ime iz `js/world-rbring.js`, ki ni v `World.api`, ali del druge proge (tak primer razdeli ročno).

## Spajanje z vejo izpred razdelitve

Veja, ki je nastala pred razdelitvijo (npr. #289 ljudje ob progi, »Grafika 02 zastavice«), ob spajanju svežega `main` dobi spore tam, kjer je razdelitev vnose ali dele premaknila, veja pa jih je spremenila ali dodala:

1. **Seznam** (`const EN_NAME = {…}`, `THEMES`, `SPLIT`, `ZIV`, `GRASS_NAT` …) ali **vrstice `if (THEME !== …) API.X = null`** v `World.build`: obdrži stran veje (stara oblika z vsemi vnosi) in ustvarjene vrstice `main` (dopolnitev pod seznamom, `for (const k in KEEP)`), če so v sporu. Če spoj obdrži vnos samo v `THEMES` ali samo v `SPLIT` (spor le v enem), orodje drugo polovico vzame iz `look` v datoteki proge; razlika se izpiše kot `look (brez split)` ali `look.split`.
2. **`js/world-rbring.js`**: kjer je `main` kodo premaknil v `world-bathurst.js`, `world-rio.js` ali `world-cpalace.js`, veja pa jo je spremenila ali dodala, obdrži stran veje (koda ostane v `js/world-rbring.js`); druge spore v tej datoteki razreši kot običajno (v izvozu `Object.assign(API, {…})` obdrži stran veje). Ne vzemi cele datoteke ene strani: spremembe skupnega graditelja na `main` bi se izgubile. Kar skupni graditelj bere iz dela ali kar je veja dodala v njegov izvoz, orodje izvozi iz datoteke dela (`let` ali `var` ne: napaka, razdeli ročno); kopija `sAtS` v datoteki dela sledi `js/world-rbring.js` (spremembe naredi tam).
3. **`js/tracks/<id>.js`**: obdrži obe strani (blok z oznako orodja in spremembe veje). **`index.html`**: `node tools/stamp.js --merge`.
4. `node tools/razdeli-proge.mjs`. Ob razliki (izhod 2) izberi po progah: za proge, ki jih je spremenila veja (`git diff $(git merge-base HEAD MERGE_HEAD) HEAD -- <datoteka>` pokaže njene spremembe seznama), `--seznam=<id>,…`; za ostale `--proga` (vrednost z `main`). Če sta isto stvar spremenili obe strani, jo uredi ročno v datoteki proge in orodje poženi znova. Vnosa, ki ga je veja izbrisala (npr. `SPLIT.<tema>`), orodje ne vidi (`main` ga je izbrisal tudi): izbriši ga ročno v datoteki proge.
5. `node tools/razdeli-proge.mjs --check` in povezani testi (`tests/razdelitev.test.js`, `browser/world.test.mjs` za spremenjene proge).

Nova proga po razdelitvi ničesar ne dopisuje v skupne sezname: polja da v svojo datoteko (`tools/nova-proga.mjs` to že dela, ime za komentatorja kot `say`).

Preverjeno: kopija s staro obliko `js/render.js`, `js/game.js`, `js/world.js` (seznami, vrstice sproščanja), `js/world-zivali.js` in `js/world-rbring.js` izpred razdelitve ob obstoječih datotekah prog in delov se z orodjem vrne v enako drevo bajt za bajtom.

## Naslednje (ni del te teme)

- `SCENE` v `js/world-zivali.js` (prizori z živalmi, ključ id proge): enak premik v polje `scene` šele, ko je na `main` #289, ki tabelo spreminja (vrednosti čez več vrstic, komentarji med vnosi; blok v datoteki proge zdaj sprejme le vrednosti v eni vrstici).
- Drugi skupni seznami po progah zunaj sveta: angleška imena in opisi v `js/lang.js` (`EN`), `MENU.corners` v `js/menu.js`, `js/routes.js`.
- Veje kode za posamezno progo v skupnih funkcijah (npr. `'pikes'` v `js/render.js` in `js/game.js`) niso seznami, ki jih dopolnjuje vsaka nova proga, zato ostanejo.

## Stanje

- [x] orodje in premik podatkov (`look`, `say`, `rainP`, polja sveta, `zivali`)
- [x] `World.keep` namesto seznamov v `build()`
- [x] `js/world-rbring.js` razdeljen po progah
- [x] testi: `tests/razdelitev.test.js`; odtis sveta (`world.test.mjs`) za Štajersko, Bathurst, Crystal Palace in Rio enak referenci
- [x] povezani testi (`npm run test:related`: 68/68, tudi odtis sveta vseh prog in `gfx.test.mjs`)
- [x] `perf.test.mjs` za proge z deljenim graditeljem (Štajerska, Bathurst, Crystal Palace, Rio) in Spa: klici in oglišča enaki referenci
