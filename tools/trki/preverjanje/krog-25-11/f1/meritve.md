# fizika-1 in fizika-3: meritve predloga (25. 11., rok 17.20 UTC)

Drevesa: **pred** = `snap` (308f299), **po** = `wt-f1` (308f299 + `fizika-1-3.patch`, brez commita), `main` = 1e42a0b. Seme 7. Skripte v tej mapi (`f1/`); `ROOT=po` izbere `wt-f1`, brez tega `snap`.

## Kaj patch naredi (samo `js/core.js`, 20 vrstic dodanih, 7 odstranjenih)

- **C** (`wallRoom`, vrstica 4460; `wallR`, 4469–4476): globina drugih vogalov je plitvejša od dveh: ravna črta skozi vogal dotika (staro pravilo) ali dejanska črta robne ograje pri tistem vogalu (`Track.query` / `queryRoute`). Na ravni ograji in na ograji, ki se krivi proti avtu, je enako staremu; razlika je samo tam, kjer ravna črta vogal postavi globlje, kot ograja res je (ograja se oži ali krivi stran).
- **A** (`touch`, vrstica 4519): udarec (`hit`: škoda, vdrtina, zvok, iskre) se zapiše samo, če je `wallR` dal sunek.
- Velja samo za Realistično (`krOn`, cv 6): `wallR` ima en sam klic, `wallRoom` kliče samo `wallR`.
- Zavržena različica **B** (predlog preverjalca: vedno dejanska črta ograje): vožnja po ograji p6 R 60 m 15,74 → 16,06 s, udarcev 5 → 25, škoda 14 → 58 % (`B/p6-po.log`). Zato C. Patch B: `fizika-1-3-B.patch`.

## 1. Najdbi

| Meritev (ukaz) | pred | po |
|---|---|---|
| `K0=1054 NN=5 node zid9.js` (krasnahorka/crash) | sunek pri zadnjem vogalu, nato 5 korakov brez sunka, škoda 0,562 → 0,811 | 0 korakov brez sunka, sunek na strani ob ograji, škoda 0,562 → 0,562 |
| `LINES=1 TRACKS=krasnahorka SETS=crash node zid10.js` | kolo k 1058, konec igre, s 304, škoda 0,917, brez sunka 11 | brez kolesa, ni konca igre, s 2094, škoda 0,571, brez sunka 0 |
| `CORN=1 ALLCARS=1 TID=mombasa SET=formula K0=1328 NN=1 node zid9b.js`; `TRACKS=mombasa SETS=formula SECS=11.3 RULE=0 ALLCARS=1 K0=1327 NN=7 node zid10.js` | w 0,457 → −2,721 (v ograjo), 7 korakov, škoda 0,005 → 0,987 | sunek pri sprednjem vogalu, ki se dotika; w 0,457 → 2,428 (od ograje), 1 korak, škoda 0,005 → 0,065 |
| `node zid10.js` (32 dirk, 60 s): korakov s škodo / škoda ograje | 199 / 32,195 | 159 / 31,956 |
| epizod; po dolžini | 131; 1: 113, 2: 7, 3: 2, 5+: 9 | 144; 1: 134, 2: 7, 3: 1, 4: 2 |
| delež škode nad največjim korakom epizode | 0,082 | 0,019 |
| korakov brez sunka s škodo (delež škode) | 46 (0,043) | 0 |
| igralcu odpade kolo / od tega v koraku brez sunka / konec igre | 16 / 2 / 16 | 15 / 0 / 15 |
| `node zid11.js`: sunkov ob robni ograji | 363 | 294 |
| točka sunka več kot 0,5 m / 1 m drugje kot po črti ograje | 138 / 114 | 23 / 15 |
| nasprotni zasuk / v vogalu, ki se ne dotika / največji odmik | 66 / 38 / 5,2 m | 0 / 0 / 2,69 m |
| `TRACKS=mombasa SETS=formula SECS=60 RULE=0 node zid12.js`: korakov / škoda / brez sunka | 42 / 4,482 / 12 | 19 / 2,908 / 0 |
| zid12: delež škode nad največjim korakom; največja epizoda | 0,476; 7 korakov 0,982 pri 9,5 m/s | 0,016; 1 korak 0,565 pri 22,7 m/s |

Po dirkah (zid10, `LINES=1`): 15 od 32 enakih, 17 drugačnih; konec igre se spremeni samo v krasnahorka/crash (da → ne). mombasa/crash: konec igre ostane, a prej (s 496 → 134): kolo ob levi ograji pri k 1308 po udarcih 8,4 in 5,0 m/s (s sunkom), dirka se razide že pred k 777.
Samo C (`ROOT=po NOA=1 node zid10.js`): 162 korakov, 3 brez sunka, 15 koles. Samo A (iz meritve B): 155 / 0 / 15.

Dirke z večjo škodo igralca (`[ROOT=po] node sled.js <proga> <nabor>`, `sled-skoda.log`):
- kotor/crash 0,529 → 0,669: prvi udarec enak (13,2 m/s, škoda 0,005 → 0,304), hitrost po njem 3,9 → 5,9 m/s; avto po popravku pelje naprej in ob desni ograji dobi še tri udarce s sunkom (k 1616, 1633, 1726). Razhajanje dirke.
- bathurst/formula 0,644 → 0,718: trk z avtom 16,1 → 19,0 m/s (tekmec pride drugače); igralec se ograje pred tem ni dotaknil.
- cusco/crash 0,627 → 0,729: **neposreden učinek C** (`cusco-okno.log`). Bočni udarec s sprednjim vogalom v ograjo, ki se krivi stran, 12,6 / 12,5 m/s: prijemališče 0,457 → 0,636 m pred sredino avta, zasuk po udarcu −2,80 → −4,03 rad/s, drugi udarec z zadnjim vogalom 5,9 → 9,7 m/s, škoda epizode 0,380 → 0,482. Stanji nista do števke enaki (k 1275 pred, k 1289 po). Skupna škoda ograje v vzorcu kljub temu pade (32,195 → 31,956).

### Prijemališče po starem in novem pravilu v istem stanju

`ROOT=po node tocka.js 60` (32 dirk prvega vzorca, drevo po; staro pravilo izračunano ob vsakem klicu iz istega stanja; `tocka-po.log`): 305 klicev `wallR` z vogalom, od tega 286 ob robni ograji. Prijemališče se razlikuje za več kot 1 mm v 67 klicih (23 %), za več kot 10 cm v 51, za več kot 0,5 m v 36; povprečno 0,39 m, največ 5,2 m. Staro brez sunka, novo s sunkom: 18; staro s sunkom, novo brez: 0. Oba s sunkom: 237, od tega ročica zasuka obrnjena v 9. Samopreverjanje: kjer vogal ni ob robni ograji (19 klicev), sta točki enaki (0 razlik); konec igre 15 kot v meritvi po.

### Drugi vzorec: 16 drugih prog

`TRACKS=pikes,rbring,caracoles,harju,livorno,silkeborg,izoard,kildare,zandvoort,gudauri,medeu,llogara,sepang,sakhir,hakone,luanda LINES=1 [ROOT=po] node zid10.js` (32 dirk, 60 s; `zid10-pred-proge2.log`, `zid10-po-proge2.log`). Spremenljivka `SEED` na dirke ne vpliva (seme 11 da iste številke kot 7), zato drugo seme ni izmerjeno.

| | pred | po |
|---|---|---|
| korakov s škodo / škoda ograje | 90 / 26,925 | 85 / 26,061 |
| epizod; po dolžini | 82; 1: 77, 2: 4, 5+: 1 | 80; 1: 75, 2: 5 |
| delež škode nad največjim korakom epizode | 0,024 | 0,009 |
| korakov brez sunka s škodo (delež škode) | 4 (0,019) | 0 |
| igralcu odpade kolo / v koraku brez sunka / konec igre | 20 / 0 / 20 | 18 / 0 / 18 |

Po dirkah: 26 od 32 enakih, 6 drugačnih (izoard/crash, luanda/crash, gudauri/crash, gudauri/formula, medeu/crash, sakhir/crash). Konec igre se spremeni v izoard/crash in luanda/crash (da → ne). V obeh kolo pred popravkom **ne** odpade ob ograji, ampak v trku z avtom (`node sled.js izoard crash`: k 4465–4550, udarec avta 12,3 in 16,1 m/s; luanda k 3673, 11,8 m/s), dolgo po prvem spremenjenem dotiku ograje (izoard k 1084: hitrost po dotiku 18,748 → 18,897 m/s; luanda k 1070: 36,681 → 37,056). Po popravku do teh trkov v 60 s ne pride: razhajanje dirke, ne neposreden učinek ograje (`sled-proge2.log`).

## 2. Matrika 567 prizorov

`node tools/trki/zid.js --cv 6 --del matrika --json` (`node inst.js <drevo> tools/trki/zid.js ...`): izpis pred in po **enak do bajta**; 908 klicev `wallR`, 0 brez sunka v obeh; po: največja razlika globine med ravno črto in črto ograje 1,8e-15 m. Energija in odboj nespremenjena.

Energija na pravih progah (kjer C res deluje): `ROOT=po node energija.js 30` (32 dirk po 30 s, cv 6): 284 klicev `wallR`, 247 sunkov, sprememba kinetične energije ob sunku od −846,9 kJ do −98,6 J, **0 sunkov z rastjo energije** (prag 1e-6 J). Pred (`node energija.js 30`): 356 klicev, 248 sunkov, od −846,9 kJ do −63,6 J, 0 z rastjo.

## 3. p7, p6, p13 (`tools/trki/preverjanje/zid/`)

| | pred | po |
|---|---|---|
| p7 (simetrija, zrcalo): klicev / brez sunka | 48 / 16 | enako do bajta |
| p6 (vožnja po ograji, R 60 m) | 386 / 0 | enako do bajta |
| p6 `x 30` (R 30 m) | 403 / 9 | enako do bajta |
| p13 (naslon) | 27 / 0 | enako do bajta |

## 4. Testa (vsak enkrat, v `wt-f1`)

- `node tests/poskodbe.test.js`: 14/14.
- `node tests/trki.test.js`: 2 od 78 padeta.
  - »the barrier, sliding and spinning, conservation«: pade samo spodnja meja števila udarcev `sum(x => x.r.nK) >= 1000`: 1239 → 863 na stran (`node test-a.js <drevo>`). Razlika 376 = koraki brez sunka na stran, ki jih A ne šteje več kot udarec. Ostali deli pogoja držijo pred in po: NaN 0, vogal v ograji 0, energija udarca in naslona 0 kršitev. Koraki brez sunka: 752 od 63 444 → 0 od 63 458; škoda matrike 579,52 → 572,74.
    Samo C (`NOA=1 node test-a.js <wt-f1>`): udarcev 1239 na stran, brez sunka 752, škoda 579,52: enako kot pred. Padec meje je torej v celoti posledica A; C testne matrike (ravna ograja) ne spremeni. A odstrani škodo korakov brez sunka tudi na ravni ograji (6,78 od 579,52 = 1,2 % škode matrike): to je »robni primer brez sunka« iz `docs/trki-realizem.md`, ki ga mora naslednja seja uskladiti (besedilo, meja 1000, preverjanje 13).
  - zlata referenca `wall/85-120/real`: zgoščena vrednost drugačna, konec enak na 3 decimalke [600,485; −0,454; 97,914; 4,803]. `node test-b.js <drevo> <izhod>`: 239 od 240 vrstic stanja različnih, največja razlika 2,8e-14 (zaokrožitev: globina iz poizvedbe proge namesto iz skalarnega produkta). Ostalih 149 ključev enakih.

## 5. Trdo pravilo

- Brez dotika: `node enako.js <drevo> <cv> sam spa,bathurst,krasnahorka,mombasa 40 gibanje`: main = pred cv 6 = po cv 6, 4 od 4 zgoščenih vrednosti enake, 0 korakov z dotikom.
- cv 1: `node enako.js <drevo> 1 crash|formula krasnahorka,mombasa,hiva 30`: pred = po v 6 od 6 dirk (2646–8520 korakov z dotikom na dirko). Kontrola cv 6: 5 od 6 drugačnih.

- Privzeta različica (brez `setTest`) je cv 1: `node enako.js <drevo> - crash krasnahorka 30` pred = po = cv 1 (7674731e98a0eea9). Reference dirk s privzeto različico se zato ne spremenijo.

## Osnova

Glava veje `trki/realizem` je medtem 9b2c787 (trije commiti z dokumenti in orodji); `js/core.js` je enak kot v 308f299 (`git diff --numstat 308f299 HEAD -- js/core.js` prazno), patch velja nespremenjen.

`docs/trki-realizem.md` (nespremenjen) po uveljavitvi ne drži več v vrsticah 1485 in 1520 (»Robni primer brez sunka … ostane, kot je«) in 1550 (preverjanje 13: 752 korakov → 0).

## Ni preverjeno

Glej `zapiski.md`, »Odprto«.
