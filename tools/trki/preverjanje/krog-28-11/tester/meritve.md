# `browser/tester` v povezanem krogu 28. 11.: dirka do cilja brez pravila o odpadlem kolesu

## Kaj je padlo

Povezani krog na `c9995ff` (spoj `main` `0f2b03c`): `tests/browser/tester.test.mjs`, preverjanje »test ran through«:
`no results after the race on autopilot (done): page.waitForFunction: Timeout 180000ms exceeded` (`tests/browser/lib.mjs:167`, klic iz vrstice 64 testa). Na `666d326` je test uspel. Dirka v testu nima semena: druga dirka na strani, testna proga iz testa, kratka dirka, poškodbe Vklop, samodejni voznik, tester vključen.

## Mehanizem po kodi

- `driveToResults` vrne `done`, ko faza dirke postane `done`, nato čaka na zaslon izidov. »(done)« v sporočilu torej pomeni: faza `done`, zaslona izidov ni.
- V navadni dirki fazo `done` postavita `finishRace()` (izide pokaže takoj, tudi po odstopu prek `retired()`) in `gameOver()` (zaslon KONEC IGRE). Druga mesta (šola, prvi test, posnetek, misije, mreža) v tej dirki ne tečejo.
- `gameOver()` teče samo pod pravilom odpadlega kolesa (`wreck.rule` iz `opts.wheelRule`; `js/core.js`, `js/game.js`): ko igralčev avto po odpadlem kolesu obstane ali, samo na veji (P2.3), ko mu ugasne motor. S `S.wheelOver = 0` ob začetku dirke pravila ni in dirka teče naprej do izidov. Na `main` pravilo velja prav tako, nastavitve `S.wheelOver` pa tam ni.
- Vključen tester poti ne spremeni: `TS()` samo poroča (`Tester.zacni`, `Tester.pusti`, `Tester.konec`), `tsKonec()` je v `try`/`catch`. Od `666d326` do `c9995ff` se `js/tester.js`, `js/napake.js`, `tests/browser/lib.mjs`, test in `js/game.js` niso spremenili.

## Meritev (`konec-igre.mjs`, po 40 dirk)

Nastavitve kot v testu, vsaka dirka na sveži strani, zanka kot `driveToResults`.

| drevo | dirk | izidi | KONEC IGRE | odpadlo kolo | škoda igralca: mediana / največ | čas dirke: najmanj / največ |
|---|---|---|---|---|---|---|
| veja `c9995ff` (`mc-veja.log`) | 40 | 40 | 0 | 0 | 0,10 / 0,64 | 104,7 / 122,8 s |
| `main` `0f2b03c` (`mc-main.log`) | 40 | 40 | 0 | 0 | 0,10 / 0,93 | 104,7 / 122,5 s |
| veja s `S.wheelOver = 0` (`mc-veja-kolo0.log`) | 40 | 40 | 0 | 0 | 0,09 / 0,44 | 104,3 / 110,1 s |

V vseh 120 dirkah je igralec prišel na cilj; toplota motorja na veji največ 0,06 (motor ugasne, ko toplota nekaj časa ostane pri 1; `engStep` v `js/core.js`).

**Padec z meritvijo ni ponovljen.** 0 od 40 dirk na veji pomeni delež do približno 7 % (pri 95 %); z dirkami `main` pod istim pravilom 0 od 80, do približno 4 %. Vzrok padca v krogu je torej sklep po kodi (edina najdena pot do faze `done` brez izidov) in po zgledu, ne izmerjen.

Omejitve: seme dirke ne naredi ponovljive (seme 5000 je dalo enkrat 106,5 s in škodo 0,01, drugič 107,0 s in škodo 0,14; verjetno zato, ker pred začetkom dirke teče predstavitev v meniju v pravem času, kar ni izmerjeno), zato so trije stolpci trije neodvisni vzorci, ne pari istih dirk. V meritvi je tester izključen in vsaka dirka je prva na strani; v testu je vključen in dirka je druga na strani.

## Popravek

Ena vrstica v `tests/browser/tester.test.mjs`: dirka do cilja se začne s `S.wheelOver = 0`, nastavitev se takoj vrne na 1. Enako je veja 24. 11. naredila v `tests/browser/lang.test.mjs` (`8c6723d`; takrat sta se 2 od 26 takih dirk končali z odpadlim kolesom). Test preverja zapis testerja ob cilju, ne pravila o kolesu. Koda igre ni spremenjena.

Test po popravku, enkrat: `node tests/browser/tester.test.mjs`, 18 od 18 (104 s). Krog je javil »1 of 12«, ker se je test ob izjemi ustavil.

Če test z istim sporočilom pade znova: v tej dirki pravila o kolesu ni več, zato je vzrok drug; ob padcu izpiši `window.__game.screen` in stanje igralčevega avta (`driveToResults` v `tests/browser/lib.mjs`).

## Ukazi

```
N=40 SEME=5000 node tools/trki/preverjanje/krog-28-11/tester/konec-igre.mjs                      # veja
DREVO=<drevo main> N=40 SEME=5000 node tools/trki/preverjanje/krog-28-11/tester/konec-igre.mjs   # git archive 0f2b03c
KOLO=0 N=40 SEME=5000 node tools/trki/preverjanje/krog-28-11/tester/konec-igre.mjs               # veja brez pravila
```

Brskalnik: `mkdir -p node_modules && ln -s /opt/node-tools/node_modules/playwright node_modules/playwright`. Trije teki hkrati ≈ 20 min.
