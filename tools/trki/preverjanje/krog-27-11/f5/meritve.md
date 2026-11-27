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
- **Kup, ki se razleti (`breaks`).** Avto dobi nasprotni sunek tega, kar so kosi dobili **brez stranskega razleta**. Razlet je kupu lasten in od hitrosti udarca neodvisen (`spread` × 0,75–1,25 oziroma do ±1,2 m/s), zato ga avto ne plača in ne prevzame. Kosi prevzamejo delež (`carry`) hitrosti karoserije v točki dotika, ne težišča; pri avtu brez vrtenja je to isto.
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
2. **Kup, ki stoji: ostane samo lasten razlet kupa.** Energija para zraste v 135 / 254 / 186 primerih (največ `isign`), a brez stranskega razleta v nobenem od 5 323 zadetkov, avto pa nikoli. Razlet je od hitrosti udarca neodvisen: počasen avto sproži enak razlet kot hiter, zato je rast glede na energijo počasnega avta velika (do 3,79). Razlet, sorazmeren hitrosti udarca, bi bil vidna sprememba obnašanja kupov; ta popravek je ne dela. **Odprto.**
3. **Predmet, ki se giblje** (v igri: predmet, ki ga je kdo že zbil in še drsi): energija para zraste v 43 od 7 894 zadetkov (prej 194), za največ 4,5 % energije avta. V 35 primerih je predmet po udarcu zavrla omejitev hitrosti `min(K.vmax || 18, 0,72 · hitrost avta + 2)`: narejena je za stoječ predmet, hitrejšega od meje upočasni, avto pa to gibalno količino prevzame. 8 primerov ni pojasnjenih (možna vzroka: sunek `j` nima člena za zasuk avta in ne šteje goriva). Ugotovitev fizika-5 govori o stoječi stvari; to je zunaj nje. **Odprto**, predlog: za predmet, ki je prišel v gibanju, avto prevzame samo sunek dotika v smeri normale.
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
