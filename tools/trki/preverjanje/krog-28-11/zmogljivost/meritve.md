# Zmogljivost: križni izris in obnova referenc Livorno in Mombasa (krog 28. 11. 2026)

## Vprašanje

Krog 27. 11. (`../../krog-27-11/zmogljivost/meritve.md`) je pokazal, da test `tests/browser/perf.test.mjs` na veji pade pri treh progah
(največji vzorec Livorno 553, Mombasa 450, Lusail 909 tisoč oglišč) in da so vzorci na veji drugje kot ob snemanju referenc. Odprto je
ostalo, ali isti prizor na veji stane več kot na `main`: križni izris ni bil narejen. Ta krog ga naredi in nato obnovi referenci za Livorno
in Mombaso. Kode igre nismo spreminjali.

## Meritev

`krizni-izris.mjs` ima dva načina, oba z nastavitvijo in semenom testa (telefon 844x390, kakovost normal, podrobnosti low, sence, kamera za
avtom, Stari trki `crV: 4`, vleka krmila samo moj avto `pullAll: 0`, seme 12345):

- **zajem**: dirka teče kot v testu; ob vsakem od šestih vzorcev se pred izrisom shrani stanje vseh avtov in dirke ter izmerjeni klici in
  oglišča, na koncu še postavitev na startu;
- **izris**: za vsak shranjeni vzorec nova dirka, igra odšteje do ugasnjenih luči (avti stojijo), vanjo se vpiše shranjeno stanje, kamera se
  umiri v desetih sličicah kot v testu, enajsta se prešteje. Dirka se po vpisu ne simulira.

Drevesi: veja `ee9f4e8` (`1a19a80` doda samo orodje) in `main` `3c3636b` (`js/`, `index.html` in `tests/browser/` enaki kot v `777993a`,
ki ga je meril krog 27. 11.). Štirje izrisi: kontroli (stanje in izris iz istega drevesa) in križna izrisa (stanje enega drevesa,
izris drugega). Vsak tek enkrat. Štetje je ponovljivo: Livorno in Mombasa sta po popravku orodja za Lusail (igra najprej odšteje do
ugasnjenih luči) dali do oglišča isto kot pred njim.

V celicah: tisoč oglišč / klici risanja. Krepko je največji vzorec naravnega teka (to, kar meri test).

**Livorno** (krog 19 087 m, 100 avtov). Igralčev avto ob vzorcih: veja s 804, 2 167, 3 433, 4 356, 5 006, 5 900 m (tekmeci do 150 m: 18,
14, 25, 36, 31, 27); `main` s 811, 2 187, 3 481, 4 418, 5 080, 5 997 m (18, 14, 36, 66, 33, 36).

| stanje → izris | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| veja, ob zajemu | 310,6 / 187 | 298,5 / 130 | 318,6 / 138 | **553,4** / 193 | 522,3 / 181 | 477,0 / 144 |
| veja → veja (kontrola) | 310,6 / 187 | 298,5 / 130 | 318,6 / 138 | 555,4 / 194 | 522,3 / 181 | 477,1 / 143 |
| veja → `main` (križni) | 310,5 / 184 | 298,4 / 127 | 318,5 / 135 | 555,3 / 191 | 522,2 / 178 | 477,0 / 140 |
| `main`, ob zajemu | 278,7 / 185 | 321,4 / 144 | 318,0 / 130 | 383,2 / 133 | **460,7** / 159 | 458,3 / 181 |
| `main` → `main` (kontrola) | 278,7 / 185 | 321,4 / 144 | 318,0 / 130 | 383,2 / 133 | 460,7 / 158 | 458,3 / 180 |
| `main` → veja (križni) | 278,7 / 185 | 321,4 / 144 | 318,0 / 130 | 383,2 / 133 | 460,7 / 158 | 458,3 / 180 |

**Mombasa** (krog 3 670 m, 22 avtov). Veja s 500, 1 081, 1 393, 1 979, 2 572, 3 196 m (tekmeci do 150 m: 4, 14, 14, 9, 9, 6); `main`
s 500, 1 081, nato štirikrat 1 100 m (4, 14, 0, 0, 0, 0; igralčev avto stoji, kot 27. 11.).

| stanje → izris | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| veja, ob zajemu | 302,6 / 119 | 385,2 / 216 | 368,8 / 175 | **450,1** / 149 | 340,9 / 128 | 290,7 / 110 |
| veja → veja (kontrola) | 302,6 / 119 | 385,2 / 215 | 368,7 / 174 | 450,1 / 148 | 340,9 / 127 | 290,7 / 109 |
| veja → `main` (križni) | 302,6 / 119 | 385,2 / 215 | 368,6 / 174 | 450,1 / 148 | 340,8 / 127 | 290,6 / 109 |
| `main`, ob zajemu | 302,6 / 119 | **384,7** / 215 | 329,7 / 120 | 337,7 / 122 | 333,2 / 118 | 333,2 / 118 |
| `main` → `main` (kontrola) | 302,6 / 119 | 384,6 / 214 | 329,7 / 119 | 337,7 / 121 | 333,2 / 117 | 333,2 / 117 |
| `main` → veja (križni) | 302,6 / 119 | 384,6 / 214 | 329,7 / 119 | 337,7 / 121 | 333,2 / 117 | 333,2 / 117 |

**Lusail** (krog 5 412 m, 22 avtov). Veja s 110, 1 016, 1 910, 2 749, 3 722, 4 673 m (tekmeci do 150 m: 20, 21, 21, 21, 16, 11); `main`
s 110, 1 016, 1 918, 2 764, 3 726, 4 665 m (20, 21, 21, 21, 17, 11).

| stanje → izris | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| veja, ob zajemu | 675,0 / 204 | 603,8 / 228 | **909,3** / 260 | 654,2 / 180 | 421,1 / 125 | 310,1 / 117 |
| veja → veja (kontrola) | 675,0 / 204 | 603,0 / 224 | 915,3 / 258 | 653,9 / 177 | 420,7 / 122 | 309,5 / 114 |
| veja → `main` (križni) | 675,0 / 204 | 603,0 / 224 | 915,3 / 258 | 653,9 / 177 | 420,7 / 122 | 309,5 / 114 |
| `main`, ob zajemu | 675,0 / 204 | 603,1 / 227 | **895,6** / 241 | 655,8 / 177 | 430,0 / 125 | 301,2 / 117 |
| `main` → `main` (kontrola) | 675,0 / 204 | 603,0 / 224 | 895,5 / 238 | 655,5 / 174 | 429,6 / 122 | 300,7 / 114 |
| `main` → veja (križni) | 675,0 / 204 | 603,0 / 224 | 895,5 / 238 | 655,5 / 174 | 429,6 / 122 | 300,7 / 114 |

Postavitev na startu da v vseh tekih isto kot ob zajemu (Livorno 268,1 / 150, Mombasa 291,1 / 204, Lusail 865,5 / 359); avtov drugega
modela ali barve kot ob zajemu ni v nobenem teku. Natančne razlike v ogliščih so v dnevnikih (`izris-*.log`, vrstica »razlika«).

## Ugotovitev

- **Isto stanje stane z obema izrisoma enako.** Razlika izris veje − izris `main` pri istem vpisanem stanju:
  - stanje `main`: 0 oglišč in 0 klicev v vseh 18 vzorcih (tri proge);
  - stanje veje, Lusail: 0 oglišč in 0 klicev v vseh šestih vzorcih;
  - stanje veje, Mombasa: 72 oglišč več na veji v vzorcih 3, 5 in 6, drugje 0; klici enaki;
  - stanje veje, Livorno: natanko 108 oglišč in 3 klici več na veji v vsakem od šestih vzorcev (na startu 0). To je 0,02–0,04 % oglišč
    in 1,5–2,4 % klicev vzorca.
- **Višji največji vzorci veje pridejo iz stanja dirke, ne iz izrisa.** Stanje veje, narisano z izrisom `main`, da 555,3 (Livorno), 450,1
  (Mombasa) in 915,3 tisoč (Lusail), torej toliko kot z izrisom veje. Stanje `main`, narisano z izrisom veje, da 460,7, 384,6 in 895,5,
  torej toliko kot na `main`.
- **Lusail:** stanji se pri tretjem vzorcu razlikujeta za 19,8 tisoč oglišč s katerim koli izrisom (915,3 proti 895,5); v naravnem teku za
  13,7 tisoč (909,3 proti 895,6). `main` je v naravnem teku 4,4 tisoč pod mejo 900 tisoč.

## Omejitve in kaj ni izmerjeno

- **Izris ne ponovi naravnega teka do oglišča.** Kontrola odstopa od zajema za največ 1 979 oglišč in 1 klic (Livorno, vzorec 4), 114
  oglišč in 1 klic (Mombasa), 6 000 oglišč in 4 klice (Lusail; tretji vzorec veje je v izrisu 6,0 tisoč višji kot v naravnem teku, drugi
  vzorci so do 774 oglišč nižji). To je do 0,7 % oglišč in do 2,6 % klicev vzorca. Kaj naredi to razliko, ni ugotovljeno (izris začne novo
  dirko in je ne simulira).
  Sklep zato primerja izris z izrisom (kontrolo s križnim), ne izrisa z naravnim tekom.
- **Kaj nosi 108 oglišč in 3 klice na Livornu** (in 72 oglišč na Mombasi), ni ugotovljeno. Izris veje brez polja dirke `glass`, brez polja
  avta `wreck` in brez polj `lamp1`, `glassN`, `glassK`, `glassReq` (polja, ki jih ima samo stanje veje) da do oglišča isto kot kontrola
  (`izris-veja-veja-brez.log`); razlika torej ni v teh poljih.
- Zakaj dirka na veji pri nastavitvi testa teče drugače kot na `main` (odprto že 27. 11.).
- Samo nastavitev testa, telefon 844x390 in eno seme. Čas na sličico ni primerjan: `jsMs` je v referenci zapisan, test ga ne preverja in je
  odvisen od stroja (ob obnovi 3,06 in 0,87 ms, v teku testa za tem 3,3 in 1,11 ms).

## Obnova referenc

`PERF_ONLY=livorno,mombasa node tests/browser/perf.test.mjs --update` v ločenem drevesu veje (`ee9f4e8`), enkrat (`obnova-referenc.log`).
V `tests/golden/perf.json` veje sta prenesena samo ta dva vnosa (10 vrstic); ostalih 74 ključev je nespremenjenih.

| proga | prej (referenca `main`) | zdaj | nova meja testa |
|---|---|---|---|
| Livorno | 155 klicev (največ 185), 370 tisoč oglišč (največ 461) | 162 (največ 193), 413 (največ 553) | 217 klicev, 628 tisoč oglišč |
| Mombasa | 135 klicev (največ 215), 337 tisoč oglišč (največ 385) | 150 (največ 216), 356 (največ 450) | 242 klicev, 515 tisoč oglišč |

Meja testa je največ × 1,1 + 5 klicev oziroma + 20 tisoč oglišč; na pravi progi velja še 300 klicev in 900 tisoč oglišč (`CLAUDE.md`). Obe
progi sta daleč pod tem.

Test po obnovi, enkrat (`PERF_ONLY=livorno,lusail,mombasa node tests/browser/perf.test.mjs`, `test-po-obnovi.log`): Livorno v redu, Mombasa
v redu, **Lusail pade** (909 tisoč oglišč, meja `CLAUDE.md` 900), brez napak strani; 1 od 4 preverjanj pade.

Pozor ob naslednjem spoju `main` v vejo: referenci za Livorno in Mombaso sta zdaj na veji drugačni kot na `main`. Spoj `0c316c9` (24. 11.)
je takrat prinesel referenco `main` in test je padel; ob spoju obdrži vrednosti veje ali ju posnemi znova.

## Odprto

- **Lusail** čaka odločitev **zmogljivost-1** (privzeto 1: lažji prizor na tem odseku, tema grafike, ne Trki). Križni izris doda: izris veje
  na Lusailu ni dražji (do oglišča enak), dražje je stanje veje ob tretjem vzorcu. Do odločitve test na veji pri Lusailu ostane rdeč in veja
  ne gre na `main`.
- Mombasa na `main`: igralčev avto v testu od tretjega vzorca stoji (stvar testa na `main`, ne veje; zapisano 27. 11.).

## Ukazi in dokazi

```
git worktree add --detach <drevo-main> origin/main        # v drevo še node_modules/playwright
O=tools/trki/preverjanje/krog-28-11/zmogljivost/krizni-izris.mjs; P=livorno,mombasa,lusail
TRKI_SNAP=$PWD         NACIN=zajem OZNAKA=veja STANJE=<mapa> PROGE=$P node $O
TRKI_SNAP=<drevo-main> NACIN=zajem OZNAKA=main STANJE=<mapa> PROGE=$P node $O
TRKI_SNAP=$PWD         NACIN=izris IZVOR=veja OZNAKA=veja STANJE=<mapa> PROGE=$P node $O    # kontrola
TRKI_SNAP=<drevo-main> NACIN=izris IZVOR=veja OZNAKA=main STANJE=<mapa> PROGE=$P node $O    # stanje veje, izris main
TRKI_SNAP=$PWD         NACIN=izris IZVOR=veja OZNAKA=veja STANJE=<mapa> PROGE=livorno BREZ=glass node $O
```

Datoteke stanja (0,7–3,2 MB na progo in drevo) ne gredo v git. Dokazi v tej mapi: `krizni-izris.mjs`, `zajem-veja.log`, `zajem-main.log`,
`izris-veja-veja.log`, `izris-main-main.log`, `izris-veja-main.log`, `izris-main-veja.log`, `izris-veja-veja-brez.log`,
`obnova-referenc.log`, `test-po-obnovi.log`.

## Dodatek 28. 11. zvečer: Trebević po spoju `main` (`0f2b03c`)

Spoj `main` `0f2b03c` (glava `c9995ff`) je prinesel progo Trebević in njeno referenco z `main`. V povezanem krogu na `c9995ff` je `browser/perf`
pri tej progi padel: največ 219 klicev (meja 190 × 1,1 + 5 = 214) in 523 tisoč oglišč (meja 433 × 1,1 + 20 = 496). Ista meritev kot zgoraj,
samo ta proga, vsak tek enkrat; drevo `main` je `git archive 0f2b03c` (spojeni `main`).

| vzorec | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| veja, naravni tek (tisoč oglišč / klici) | 327,7 / 136 | 330,3 / 134 | 428,2 / 203 | 463,9 / 159 | **523,2 / 219** | 335,8 / 147 |
| `main`, naravni tek | 332,4 / 138 | 315,5 / 144 | 412,8 / 190 | 433,2 / 159 | 357,0 / 175 | 332,2 / 159 |
| stanje veje, izris veje (kontrola) | 327,7 / 136 | 330,3 / 134 | 428,2 / 203 | 463,9 / 159 | 523,1 / 219 | 335,8 / 147 |
| stanje veje, izris `main` | 327,7 / 136 | 330,3 / 134 | 428,2 / 203 | 463,9 / 159 | 523,1 / 219 | 335,8 / 147 |
| stanje `main`, izris `main` (kontrola) | 332,4 / 138 | 315,5 / 144 | 412,8 / 190 | 433,2 / 159 | 356,4 / 174 | 332,2 / 159 |
| stanje `main`, izris veje | 332,4 / 138 | 315,5 / 144 | 412,8 / 190 | 433,3 / 159 | 356,5 / 174 | 332,4 / 159 |
| veja: mesto na progi (m), tekmeci do 150 m, avti s škodo | 591, 12, 2 | 958, 11, 4 | 1360, 20, 4 | 1774, 12, 6 | 2313, 13, 8 | 3032, 9, 10 |
| `main`: mesto na progi (m), tekmeci do 150 m, avti s škodo | 597, 14, 2 | 967, 11, 4 | 1364, 20, 7 | 1706, 8, 13 | 2253, 14, 16 | 2851, 11, 16 |

Krog 4635 m, 22 avtov; start 359,2 tisoč oglišč in 184 klicev v vseh tekih; avtov drugega modela ali barve ob izrisu tujega stanja 0.

**Isto stanje stane z obema izrisoma enako.** Stanje veje da z izrisom `main` v vseh šestih vzorcih iste številke kot z izrisom veje (razlika
0 oglišč, 0 klicev); stanje `main` da z izrisom veje največ 144 oglišč več (0,04 %), klici so enaki. **Višji največji vzorec veje (peti: 523
tisoč oglišč in 219 klicev pri 2313 m proti 357 tisoč in 175 pri 2253 m na `main`) pride iz stanja dirke, ne iz izrisa**, enako kot pri Livornu
in Mombasi. Kateri del stanja ga prinese (lega avta in razpored polja), ni razčlenjeno; avtov s škodo je na veji manj (8 proti 16).

Omejitve kot zgoraj: nastavitve testa, eno seme; kontrola se od naravnega teka razlikuje do 600 oglišč in 1 klic (peti vzorec); zakaj dirka
na veji pri nastavitvah testa teče drugače kot na `main`, je odprto od 27. 11.; `jsMs` ni preverjen.

Obnova reference: `PERF_ONLY=trebevic node tests/browser/perf.test.mjs --update` na glavi veje, enkrat (`trebevic-obnova-referenc.log`). V
`tests/golden/perf.json` je spremenjen samo vnos `trebevic` (79 ključev prej in potem, vrstni red enak).

| proga | prej (referenca `main`) | zdaj | nova meja testa |
|---|---|---|---|
| Trebević | 161 klicev (največ 190), 364 tisoč oglišč (največ 433) | 166 (največ 219), 402 (največ 523) | 245 klicev, 595 tisoč oglišč |

Test po obnovi, enkrat: `PERF_ONLY=trebevic node tests/browser/perf.test.mjs`, 2 od 2 (`trebevic-test-po-obnovi.log`). Celoten test
zmogljivosti po obnovi ni ponovljen (koda igre je nespremenjena; v krogu na `c9995ff` so ostale proge uspele, razen Lusaila, ki čaka
zmogljivost-1). Ob naslednjem spoju `main` obdrži tudi pri Trebeviću vrednost veje ali jo posnemi znova.

Ukazi kot zgoraj s `P=trebevic`, drevo `main`: `mkdir <drevo-main> && git archive 0f2b03c | tar -x -C <drevo-main>` (v drevo še
`node_modules/playwright`). Dokazi v tej mapi: `trebevic-zajem-veja.log`, `trebevic-zajem-main.log`, `trebevic-izris-veja-veja.log`,
`trebevic-izris-veja-main.log`, `trebevic-izris-main-main.log`, `trebevic-izris-main-veja.log`, `trebevic-obnova-referenc.log`,
`trebevic-test-po-obnovi.log`.
