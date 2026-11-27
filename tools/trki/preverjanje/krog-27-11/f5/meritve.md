# fizika-5: stvar ob cesti in odpadli del avtu ne dodata energije (27. 11.), meritve pred in po

Drevesa: **pred** = 7112de1 (koda bfdd165: veja po fizika-4, brez tega popravka), **po** = 0c36dfd. Skripte: `../../krog-25-11/fizika/pred2.js` (predmeti ob cesti po razredih), `../../krog-25-11/fizika/pred1.js` (`WHAT=kos` odpadli deli, `WHAT=predmet` predmeti), `ostanek.js` (ta mapa: razcep primerov, ki ostanejo). Vse merijo en klic `propCarHit` oziroma `debrisHit` v Realistični (cv 6).

Ukazi (v tej mapi, `F=../../krog-25-11/fizika`):

```
N=120000 SEED=5 node $F/pred2.js            > pred2-po.log
WHAT=kos N=60000 SEED=3 node $F/pred1.js      > pred1-kos-po.log
WHAT=predmet N=60000 SEED=3 node $F/pred1.js  > pred1-predmet-po.log
N=120000 SEED=5 node ostanek.js             > ostanek-po.log
```

Dnevniki `*-pred.log` so isti ukazi na drevesu pred spremembo. Prva vrstica vsakega dnevnika pove drevo.

## Kaj je uveljavljeno (0c36dfd, samo Realistična, cv 6)

- **Varovalo energije (`propPush`).** Avto sunek stvari prevzame kot prej (hitrost v celoti, zasuk po pravilu oprijema, `kTake`). Kjer bi par avto + stvar s tem dobil energijo, avto prevzame več tistega dela zasuka, ki njegovo vrtenje upočasni, in samo toliko, da rast izgine. To je isti prijem kot pri dveh avtih in pri prometu (`kCollide`). Sunek, ki energije ne doda, ostane enak do zadnje decimalke.
- **Odpadli del (`debrisHit`).** Hitrost zbliževanja se meri v točki dotika (z vrtenjem avta), ne v težišču. Avto dobi nasprotni sunek dela prek `propPush`.
- **Cel predmet (`propCarHit`).** Avto dobi nasprotni sunek tega, kar je predmet dobil, kot prej, zdaj prek `propPush`.
- **Kup, ki se razleti (`breaks`).** Avto dobi nasprotni sunek tega, kar so kosi dobili **brez stranskega razleta**. Razlet je kupu lasten in od hitrosti udarca neodvisen (`spread` × 0,75–1,25 oziroma do ±1,2 m/s), zato ga avto ne plača in ne prevzame. Kosi prevzamejo delež (`carry`) hitrosti karoserije v točki dotika, ne težišča; pri avtu brez vrtenja je to isto. **Od `f283eed` (»Nadaljevanje« spodaj) razlet ni več neodvisen:** omejen je s tem, kar sta avto in kup v trku izgubila.
- Avti zunaj pravila Realistične (`krOn`: policijsko zasledovanje, vlačilec s polpriklopnikom, boksi), Simulacija (cv 1) in različice 2–5 se ne spremenijo. Vožnja ni spremenjena.

## Merilo

Stvar, ki stoji, avtu ne more dodati energije. Par avto + stvar po dotiku nima več energije kot pred njim. Energija avta = gibanje + vrtenje (z gorivom); energija stvari = vodoravno gibanje (pri kupu vsota kosov).

## Predmeti ob cesti po razredih (`pred2.js`, 120 000 klicev, brez NaN)

| razred | zadetkov | avto dobi energijo: primerov | največ J | par dobi energijo: primerov | največ J | največ glede na energijo avta |
|---|---|---|---|---|---|---|
| stoji, avto se ne vrti | 16 884 | 9 → **0** | 144,1 → 0 | 151 → 143 | 1 300,1 → 1 351,2 | 4,73 → 3,79 |
| stoji, vrtenje do 3 rad/s | 21 391 | 508 → **0** | 651,6 → 0 | 1 176 → 259 | 1 760,6 → 1 771,6 | 2,48 → 2,05 |
| stoji, vrtenje nad 3 rad/s | 9 725 | 850 → **0** | 3 659,6 → 0 | 1 589 → 195 | 5 167,7 → 2 214,4 | 1,10 → 0,95 |
| predmet se giblje | 7 894 | 1 788 → 1 749 | 13 015,2 → 13 015,2 | 194 → 43 | 4 077,0 → 4 077,0 | 0,060 → 0,045 |

- Ugotovitev z dne 25. 11. je za vrtenje nad 3 rad/s navajala 859 primerov in 3 163,9 J; na drevesu tik pred tem popravkom jih je bilo 850, do 3 659,6 J.
- Pri predmetu, ki se giblje, avto energijo lahko dobi upravičeno (predmet prileti vanj); tam šteje energija para.
- Hitrost težišča avta ob stoječem predmetu se sme povečati, kadar to plača vrtenje: največ 0,192 m/s (vrtenje do 3 rad/s, enako kot prej) in 0,532 → 0,563 m/s (nad 3 rad/s). Skupna energija avta pri tem v nobenem primeru ne zraste.

## Odpadli deli (`pred1.js`, `WHAT=kos`, 60 000 klicev, brez NaN)

| | pred | po |
|---|---|---|
| zadetkov | 37 166 | 37 613 |
| avto dobi energijo ob mirujočem delu | 38 | **0** |
| avto dobi energijo (vsi primeri; ostanejo samo deli, ki letijo vanj) | 3 028 | 2 943 |
| največ J (del, ki leti v avto) | 5 258,5 | 7 418,4 |
| par dobi energijo: primerov | 419 | **0** |
| največ J | 2 078,9 | 0 |
| gibalna količina, leteč del (kg·m/s) | do 1,2e-10 | do 1,2e-10 |
| zrcalna simetrija | 0 | 0 |

- Zadetkov je neto 447 več, ker se zbliževanje meri v dotiku: vrteč se avto del zadene tudi, ko se težišči ne zbližujeta (in obratno).
- Del, ki leži na tleh (razred `lezi`), gibalne količine po zasnovi ne ohrani (do 12 900 kg·m/s, enako pred in po).

## Predmeti (`pred1.js`, `WHAT=predmet`, 60 000 klicev, 27 951 zadetkov, brez NaN)

| | pred | po |
|---|---|---|
| avto dobi energijo ob mirujoči stvari | 571 | **0** |
| avto dobi energijo (vsi primeri) | 2 570 | 1 946 |
| največ J | 19 308,0 | 12 269,3 |
| par dobi energijo: primerov | 1 596 | 379 |
| največ J | 10 926,3 | 6 334,4 |
| gibalna količina, celi predmeti (39 vrst, kg·m/s) | do 8,3e-11 | do 8,3e-11 |
| gibalna količina, kupi (kg·m/s) | do 8,3e-11 | do 244 |

Par dobi energijo, po vrstah (primerov, največ J; pred → po): `isign` 173 → 182, 10 926,3 → 4 889,1; `bstack` 51 → 39, 5 859,3 → 5 923,7; `rbstack` 54 → 40, 10 355,0 → 6 334,4; `tstack` 56 → 50, 2 892,3 → 2 663,4; `bboard` 59 → 19, 5 311,0 → 5 311,0; `shelter` 28 → 1, 6 047,6 → 143,3; `cabinet` 38 → 0.

- Ta skripta vzorči tudi **kupe, ki se gibljejo**. V igri jih ni (kup se razleti ob prvem dotiku), zato so primeri z oznako »(sklad)« in visoko energijo umetni; mednje sodi največji po popravku (`rbstack`, 6 334,4 J).
- Pri kupu se gibalna količina avta in kosov zdaj razlikuje za neto stranski razlet kupa (do 244 kg·m/s), po zasnovi: razlet ni sunek avta.

## Kaj ostane (`ostanek.js`, drevo po)

| razred | zadetkov | avto dobi energijo | par dobi energijo (največ J) | par brez razleta dobi energijo | razlet do J |
|---|---|---|---|---|---|
| stoji, avto se ne vrti, cel predmet | 15 064 | 0 | 0 | | |
| stoji, vrtenje do 3 rad/s, cel predmet | 18 974 | 0 | 0 | | |
| stoji, vrtenje nad 3 rad/s, cel predmet | 8 639 | 0 | 0 | | |
| stoji, avto se ne vrti, kup | 1 820 | 0 | 135 (1 290,1) | 0 | 6 890,0 |
| stoji, vrtenje do 3 rad/s, kup | 2 417 | 0 | 254 (1 462,6) | 0 | 6 875,4 |
| stoji, vrtenje nad 3 rad/s, kup | 1 086 | 0 | 186 (2 133,1) | 0 | 9 677,5 |
| giblje, avto se ne vrti | 2 775 | 597 | 7 (4 077,0), od tega 4 z omejitvijo hitrosti | | |
| giblje, avto se vrti | 5 119 | 1 152 | 36 (2 527,9), od tega 31 z omejitvijo hitrosti | | |

1. **Cel predmet, ki stoji: čisto.** Ne avto ne par v nobenem od 42 677 zadetkov ne dobita energije.
2. **Kup, ki stoji: ostane samo lasten razlet kupa.** Energija para zraste v 135 / 254 / 186 primerih (največ `isign`), a brez stranskega razleta v nobenem od 5 323 zadetkov, avto pa nikoli. Razlet je od hitrosti udarca neodvisen: počasen avto sproži enak razlet kot hiter, zato je rast glede na energijo počasnega avta velika (do 3,79). Razlet, sorazmeren hitrosti udarca, bi bil vidna sprememba obnašanja kupov; ta popravek je ne dela. **Rešeno v nadaljevanju (`f283eed`, spodaj):** razlet je omejen z izgubo trka, 601 → 0 primerov.
3. **Predmet, ki se giblje** (v igri: predmet, ki ga je kdo že zbil in še drsi): energija para zraste v 43 od 7 894 zadetkov (prej 194), za največ 4,5 % energije avta. V 35 primerih je predmet po udarcu zavrla omejitev hitrosti `min(K.vmax || 18, 0,72 · hitrost avta + 2)`: narejena je za stoječ predmet, hitrejšega od meje upočasni, avto pa to gibalno količino prevzame. 8 primerov ni pojasnjenih (možna vzroka: sunek `j` nima člena za zasuk avta in ne šteje goriva). Ugotovitev fizika-5 govori o stoječi stvari; to je zunaj nje. Predlog: za predmet, ki je prišel v gibanju, avto prevzame samo sunek dotika v smeri normale. **Rešeno v nadaljevanju (`f283eed`, spodaj):** 43 → 0 primerov; tam je opisanih tudi teh 8 (predmet je končal na meji hitrejši, kot je prišel).
4. Številke pri kupih se med zagoni in med skriptama malo razlikujejo (`pred2.js` 143 / 259 / 195, `ostanek.js` 135 / 254 / 186): razlet jemlje naključna števila, ki jih skripti ne sejeta. Pri celih predmetih sta oba zagona dala 0.

## Testi

- `tests/trki.test.js` 80/80. Obnovljena je ena referenca, `prop/bstack-60/real` (kup pri 60 km/h, Realistična): `[6.915, 618.03, 0.002, 0.014, 51.883]` → `[6.907, 618.031, -0.004, -0.01, 51.885]` (izguba hitrosti v %, x in z v m, smer v stopinjah, hitrost v km/h po 1,2 s). Drugih ključev v `tests/golden/trki.json` sprememba ne premakne.
- `tests/poskodbe.test.js` 14/14, `tests/golden.test.js` 504 od 504 enakih, `tools/stamp.js --check` v redu.
- `tests/races.test.js`: 360 od 360 dirk enakih (`OK: all races fine`, 1383 s).

## Česa ta krog ni izmeril

- Več zaporednih dotikov z istim predmetom: skripte merijo en klic.
- Predmet proti predmetu (`breakProp` iz drugega klica v `js/core.js`) ni spremenjen in ni merjen.
- Slik zdaj in potem ni. Referenčni prizor (kup pri 60 km/h po 1,2 s) se razlikuje za do 6 mm v legi, 0,024° v smeri in 0,002 km/h v hitrosti.
- `tools/trki/pocez.js` po tem popravku.
- Testi v brskalniku in `npm run test:related` (približno 4,6 h): tečejo enkrat, v zbirnem krogu ali pred `main`.

## Nadaljevanje (27. 11. zvečer, `f283eed`): razlet kupa plača trk, predmet v gibanju avta ne potiska

Drevesi: **pred** = eff3af0 (veja po spoju `main`; `js/core.js` je enak kot v 31f12e4), **po** = f283eed. Skripta: `ostanek2.js` (ta mapa). Vzorči enako kot `ostanek.js` (isti `N` in `SEED` dasta iste primere), naključna števila jedra pa seje (`SEED2`), zato obe drevesi dobita iste primere in so številke ponovljive. Meri en klic `propCarHit` v Realistični (cv 6).

```
ROOT=<delovno drevo eff3af0> N=120000 SEED=5 node ostanek2.js > ostanek2-pred.log
N=120000 SEED=5 node ostanek2.js                             > ostanek2-po.log
```

`VSE=1` izpiše vsak primer, v katerem par dobi energijo. Dnevnik »po« je bil v `f283eed` posnet tik pred commitom (glava »31f12e4, js/core.js spremenjen v delovnem drevesu«); ponovljen na čistem drevesu f283eed je enak do zadnje številke, zamenjana je samo glava.

### Kaj je bilo narobe (drevo pred)

- **Razlet kupa ni bil odvisen od hitrosti udarca.** Kosi dobijo stransko hitrost `spread` × 0,75–1,25 (`isign`: 3–5 m/s), drugi kupi do ±1,2 m/s, ne glede na to, kako hitro je avto priletel. Povprečna stranska hitrost kosa `isign` je bila 4,00 m/s pri udarcu do 2 m/s in 4,05 m/s nad 20 m/s; pri drugih kupih 0,61 in 0,59 m/s. Pri počasnem dotiku je bila energija razleta zato večja od vsega, kar sta avto in kup v trku izgubila: par je dobil energijo v 601 od 5 323 zadetkov (148 / 248 / 205 po razredih; `isign` 388, drugi kupi 213), največ 2 249,2 J in do 2,87-kratnik energije, s katero je avto prišel.
- **Predmet, ki se že giblje.** Par je dobil energijo v 43 od 7 894 zadetkov (7 brez vrtenja avta, 36 z njim), največ 4 077,0 J. V vseh 43 je predmet končal na meji hitrosti `min(K.vmax || 18, 0,72 · hitrost avta + 2)`: v 35 ga je meja zavrla pod hitrost, s katero je prišel, v 8 je končal na meji hitrejši, kot je prišel (s 7,89–14,82 m/s na 18 m/s, `bboard` na 8 m/s; rast 65,1–689,2 J; `gpost`, `dpost` 2×, `post`, `bboard`, `msign`, `crate`, `pylon`).
- **Zakaj.** Meja pomanjša **celotno** vodoravno hitrost predmeta, tudi del, ki ga je imel že pred dotikom, avto pa je prevzel nasprotni sunek celotne spremembe. Če je `u = v0 + (j/m)·n` hitrost predmeta po sunku in `s = meja/|u|`, je sprememba `s·u − v0 = s·(j/m)·n − (1 − s)·v0`. Avto je torej poleg sunka dotika dobil še gibalno količino `(1 − s)·m·v0` v smeri, v katero je predmet že potoval. Kadar je avto v tej smeri hitrejši od predmeta (ga dohiteva), tak potisk energijo para lahko poveča. Varovalo v `propPush` rast odpravlja samo z deležem zasuka, ki ga avto prevzame; sunka samega ne zmanjša (prebrano iz kode, ne izmerjeno), zato teh primerov ni ujelo. Domnevi iz prejšnjega kroga (člen za zasuk avta in gorivo v sunku `j`) posebej nista bili preverjeni.

### Kaj je spremenjeno (`f283eed`, samo Realistična, cv 6, avti pod pravilom `krOn`)

- **A, kup.** Stranski razlet kosov je omejen s tem, kar sta avto in kup v trku izgubila (energija avta pred dotikom, zmanjšana za energijo avta po sunku in za energijo, ki so jo kosi dobili brez razleta). Kadar energija razleta to presega, se stranske hitrosti vseh kosov pomanjšajo z istim deležem `s` (`s·sc + s²·sa = izguba`), toliko, da rast izgine. Trd udarec ima izgube dovolj in kup razleti kot prej.
- **B, cel predmet, ki je prišel v gibanju in ga je zadržala meja hitrosti.** Avto prevzame samo sunek dotika v smeri normale: toliko, kolikor se je predmet v tej smeri res spremenil, in največ `j`. Kar je meja vzela predmetovi lastni hitrosti, gre v tla, ne v avto.
- Nobene nove konstante, poraba naključnih števil je enaka. Koda se od prejšnje razlikuje samo v teh dveh pogojih (razlet nad izgubo; prišel v gibanju in zadržan z mejo), drugje je pot skozi kodo ista. Meritve to podpirajo, za vsak primer posebej pa tega ne dokazujejo: razredi stoječih celih predmetov so v obeh dnevnikih enaki, od 25 referenc Realistične v `tests/golden/trki.json` so se spremenile 3 (vse `prop/…`; `prop/cone-120/real` in `prop/lamp-60/real` ter vseh 20 drugih so enake), vseh 125 referenc drugih različic je enakih. Simulacija (cv 1), različice 2–5, avti zunaj `krOn` in vožnja niso spremenjeni.

### Številke (pred eff3af0 → po f283eed, 120 000 klicev)

| razred | zadetkov | par dobi energijo: primerov | največ J | avto dobi energijo: primerov | največ J | spremeni se samo stvar | razlika gibalne količine para, do kg·m/s |
|---|---|---|---|---|---|---|---|
| stoji, cel predmet (trije razredi) | 42 677 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| stoji, avto se ne vrti, kup | 1 820 | 148 → **0** | 1 276,9 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 234,1 → 227,6 |
| stoji, vrtenje do 3 rad/s, kup | 2 417 | 248 → **0** | 1 820,9 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 244,6 → 244,6 |
| stoji, vrtenje nad 3 rad/s, kup | 1 086 | 205 → **0** | 2 249,2 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 235,2 → 235,2 |
| giblje, avto se ne vrti | 2 775 | 7 → **0** | 4 077,0 → 0 | 597 → 573 | 6 292,9 → 5 077,1 | 0 → 29 | 0 → 1 692,6 |
| giblje, avto se vrti | 5 119 | 36 → **0** | 2 527,9 → 0 | 1 152 → 1 016 | 13 015,2 → 6 310,9 | 0 → 100 | 0 → 2 242,9 |

- Pri predmetu, ki se giblje, avto energijo lahko dobi upravičeno (predmet prileti vanj); šteje energija para, ta ne zraste v nobenem od 7 894 zadetkov.
- Zadetkov na meji hitrosti je enako kot prej (1 458 in 2 871; od tega zavrtih 873 in 1 654): meja sama ni spremenjena, spremenjeno je samo, kaj od nje prevzame avto.
- Največja energija razleta ostane enaka (6 985,7 / 8 200,6 / 6 581,6 J): to so trdi udarci, ki imajo izgube dovolj.

Razlet kupa po hitrosti udarca (hitrost zbliževanja v smeri dotika; povprečna stranska hitrost kosa in povprečna energija razleta; »nad« = zadetki, pri katerih je razlet večji od izgube para):

| kup | hitrost udarca | zadetkov | stranska hitrost, m/s | energija razleta, J | povprečna izguba brez razleta, J | nad |
|---|---|---|---|---|---|---|
| `isign` | do 2 m/s | 295 | 4,00 → 2,18 | 1 047,3 → 417,9 | 3 405,7 | 229 → 0 |
| `isign` | 2–5 m/s | 268 | 4,01 → 3,18 | 977,0 → 664,1 | 8 171,6 | 137 → 0 |
| `isign` | 5–10 m/s | 213 | 3,99 → 3,71 | 1 069,9 → 972,6 | 13 140,7 | 20 → 0 |
| `isign` | 10–20 m/s | 218 | 4,04 → 4,02 | 1 077,4 → 1 071,3 | 37 616,4 | 2 → 0 |
| `isign` | nad 20 m/s | 296 | 4,05 → 4,05 | 1 305,7 → 1 305,7 | 112 863,3 | 0 → 0 |
| drugi kupi | do 2 m/s | 873 | 0,61 → 0,57 | 16,7 → 15,3 | 1 028,7 | 83 → 0 |
| drugi kupi | 2–5 m/s | 904 | 0,62 → 0,58 | 14,6 → 13,2 | 1 741,3 | 72 → 0 |
| drugi kupi | 5–10 m/s | 729 | 0,60 → 0,57 | 11,6 → 9,8 | 4 583,5 | 43 → 0 |
| drugi kupi | 10–20 m/s | 691 | 0,60 → 0,59 | 10,2 → 9,7 | 12 422,1 | 14 → 0 |
| drugi kupi | nad 20 m/s | 836 | 0,59 → 0,59 | 11,9 → 11,9 | 44 135,5 | 1 → 0 |

- Hitrost udarca je tu hitrost zbliževanja v smeri dotika. Izguba je odvisna tudi od lastne hitrosti avta (kosi prevzamejo delež hitrosti karoserije), zato je povprečna izguba velika že pri udarcu do 2 m/s (oplazenje pri visoki hitrosti); razlet se zmanjša samo tam, kjer je izguba manjša od njega.

### Prizora na ravni dirke (`tests/trki.test.js`, dve novi preverjanji)

| prizor | brez popravka (koda eff3af0) | s popravkom (f283eed) |
|---|---|---|
| kup `isign`, avto s 5 km/h | par +956,8 J, kosi vstran do 4,95 m/s | par −6,6 J, kosi vstran do 1,39 m/s |
| kup `isign`, avto s 120 km/h | kosi vstran do 3,91 m/s | 3,91 m/s (enako kot Simulacija) |
| bala, ki drsi s 16 m/s, avto s 60 km/h jo dohiti | bala 16,00 → 13,77 m/s; avto 0,045 m/s hitrejši od dvojčka brez bale; par +6,8 J | bala 16,00 → 13,77 m/s; avto enak dvojčku (0); par −863,2 J |

- Simulacija je v obeh stolpcih enaka (počasen dotik: par +1 078,5 J, kosi do 4,95 m/s): ni spremenjena.
- Vsak popravek posebej: brez A pade samo preverjanje kupa, brez B samo preverjanje dohitevanja.

### Spremenjene reference (`tests/golden/trki.json`, 3 od 150, vse zaradi B)

Hiter avto predmet, ki ga je pravkar zbil, dohiti in zadene še enkrat, medtem ko ga drži meja hitrosti; ta drugi dotik je zdaj drugačen.

- `prop/bstack-60/real` (kup bal pri 60 km/h po 1,2 s): `[6.907, 618.031, -0.004, -0.01, 51.885]` → `[7.203, 617.995, -0.001, 0.003, 51.709]` (izguba hitrosti v %, x in z v m, smer v stopinjah, hitrost v km/h). Avto je 0,176 km/h počasnejši in 3,6 cm bolj zadaj; to se sklada s popravkom B (kosi, ki jih drži meja, avta ne potiskajo več), posebej za ta prizor pa vzrok ni razčlenjen.
- `prop/bale-120/real`: z 0,001 → 0 m, drugo enako na izpisane decimalke.
- `prop/tyre-60/real`: konec enak na izpisane decimalke, spremeni se samo zgoščena vrednost poteka.

### Testi (koda f283eed)

- `tests/trki.test.js` 84/84 (z dvema novima preverjanjema), `tests/poskodbe.test.js` 14/14, `tools/stamp.js --check` v redu.
- `tests/golden.test.js` 504 od 504 enakih (592 s) in `tests/races.test.js` 360 od 360 dirk enakih referenci (`OK: all races fine`, 1345 s). Oba tečeta v privzeti različici trkov (Simulacija): kažeta, da popravek zunaj Realistične ne spremeni ničesar, o Realistični pa ne povesta nič.
- `npm run test:related` (130 testov) je tekel enkrat na kodi po spoju `main` (eff3af0), torej brez tega popravka; njegov izid je v opisu PR #608.
- Dodatno na kodi f283eed, vsak enkrat: testi dokumentov (`node tests/run.js --dokumenti --quiet`) 3 od 3; `tests/grid.test.js` 13/13, `marrakesh` 14/14, `monterey` 17/17, `newcastle` 16/16, `riverside` 13/13, `townsville` 16/16 in `tests/odpadli-deli.test.js` brez napake. Od teh na Realistično preklopi samo `odpadli-deli` (zanka po vseh različicah trkov); preostalih šest različice trkov ne nastavi (privzeta je Simulacija). Popravek zapisa 27. 11.: prej so bili vsi navedeni kot testi Realistične, ker je iskanje ujelo ime `REAL`, ki v njih pomeni prave proge in ovinke.
- `tests/pits.test.js` (privzeta različica trkov, ni v povezanem krogu) na veji pade pri 1 od 21 preverjanj: prizor »a long race with fuel (toskana)«, seme 7, 14 postankov, eden (drugi postanek poškodovanega tekmeca) pod kotom 4,03° ob meji 4°. Enako pade na 31f12e4 (pred tem popravkom) in na 70636de (pred delom te seje), na `main` 777993a gre skozi: tega popravek fizika-5 ni povzročil. Stanje in odločitev sta v `docs/trki-realizem.md`, »Krog 27. 11. 2026 (partyslo)«.

### Kaj je po tem drugače v drugo smer

- Merilo je ohranitev energije, ne vir iz resničnih trkov: popravek odpravi rast energije, ne trdi pa, da se pravi kup razleti natanko tako.
- Počasen dotik kup razmakne manj kot prej (`isign` pri udarcu do 2 m/s povprečno 2,18 namesto 4,00 m/s). To je vidna sprememba obnašanja kupov v Realistični; slik zdaj in potem še ni.
- Pri predmetu v gibanju, ki ga drži meja hitrosti, se gibalna količina para ne ohrani več: kar vzame meja (do 2 242,9 kg·m/s), gre v tla. Prej jo je prevzel avto in gibalna količina se je ohranila, energija pa je rasla. V 129 od 7 894 zadetkov (29 + 100) se zdaj spremeni samo predmet, avto ne.

### Česa nadaljevanje ni izmerilo

- Več zaporednih dotikov z istim predmetom: samo v prizorih zgoraj in v treh referencah; skripta meri en klic.
- Predmet proti predmetu (`breakProp` iz drugega klica v `js/core.js`): ni spremenjen in ni merjen.
- Kupi, ki se gibljejo: skripta jih ne vzorči (kup se razleti ob prvem dotiku avta s hitrostjo zbliževanja vsaj 0,5 m/s).
- Slik zdaj in potem ni; testi v brskalniku in `tools/trki/pocez.js` po tem popravku niso tekli.
