# fizika-1 in fizika-3: popravek uveljavljen (27. 11.), ponovljene meritve in merilo po virih

Drevesi: **pred** = f36d382 (veja s svežim `main` a8cde61, brez popravka), **po** = 0fc7026 (popravek C + A v `js/core.js`). Seme 7. Skripte: `../../krog-25-11/f1/` (`lib.js`: `TRKI_SNAP=<mapa pred>`; `ROOT=po TRKI_F1=<mapa po>`), novi `zid13.js` in `zid13-povzetek.js` v tej mapi. Dnevniki `<meritev>-pred.log` in `<meritev>-po.log`; `veriga-*.stanje`: izhodne kode verige (vse 0).

## Kaj je uveljavljeno (0fc7026, samo Realistična, cv 6)

- **C** (`wallRoom`, `wallR`): globina drugih vogalov je plitvejša od dveh: ravna črta skozi vogal dotika ali dejanska črta robne ograje pri tistem vogalu. Sunek zato prime tam, kjer se avto ograje res dotika.
- **A** (`wallCollide`): udarec (škoda, vdrtina, zvok, iskre, `hitWall`) se zapiše samo, če je `wallR` dal sunek (`wallR` vrne 1 ali 0).
- Razlika do predloga 25. 11.: dejanska črta ograje velja šele, ko je od ravne črte plitvejša za več kot 1e-9 m. Brez praga se je referenca `wall/85-120/real` razlikovala v zadnjih števkah; s pragom je ravna ograja do bita enaka.
- Testi: `tests/trki.test.js` 78/78 (meja nepraznosti 1000 → 800: ob eni ograji je zdaj 863 udarcev, prej 1239, od tega 376 zapisanih brez sunka; preverjanje 13 je strogo: brez sunka ni udarca), `tests/poskodbe.test.js` 14/14, `tests/golden/trki.json` nespremenjen (150 ključev).

## Merilo po virih (tega 25. 11. ni bilo)

Vir: `docs/trki-realizem.md`, »Resnični trki (odprti viri)«.

| | merilo | meritev | pred | po |
|---|---|---|---|---|
| K1 | sunek togega telesa deluje tam, kjer se telesi dotikata (»učbeniško«) | `zid11`: sunek v vogalu, ki se ograje ne dotika / zasuk v napačno smer / točka več kot 0,5 m od točke po črti ograje | 38 / 66 / 138 | 0 / 0 / 23 |
| K2 | vrstice vira o ravnem zidu (izhodni kot, hitrost) ostanejo | matrika 567 prizorov (`node tools/trki/zid.js --cv 6 --del matrika --json`), sha256 | f4edc782…c64c8 | enako do bajta (213 572 bajtov) |
| K3 | energija ob sunku ne raste | `energija` (32 dirk, 30 s): sunkov z rastjo energije; največja sprememba | 0; −63,6 J | 0; −98,6 J |
| K4 | »oplazenje ima dva sunka: sprednji vogal, nato udarec repa 0,15–0,3 s pozneje« | `zid13`, zadetki pod 15–35°: mediana razmika; parov v 0,15–0,3 s | 0,208 s; 6 od 17 | 0,183 s; 7 od 17 |

Lasten izračun (ni izmerjena vrednost iz resničnega trka): toga palica brez trenja in brez vrtenja pred trkom, plastičen sunek v sprednji konec. Zadnji konec se po njem ograji bliža z 1,5-kratnikom hitrosti sprednjega konca (splošno 1 + (1 + e)(ab/k² − 1)/(1 + a²/k²); avto 3,95 × 1,8 m: približno 1,4). Mediana razmerja v igri: 0,74 → 0,80. Nad 1,5 je 7 → 8 parov (pet istih v obeh drevesih); v teh se avto vrti že pred prvim sunkom ali ograja vmes spremeni smer.

## Ponovljene meritve na končni kodi (številke 25. 11. se ponovijo)

| Meritev | pred | po |
|---|---|---|
| krasnahorka/crash (`kras9`, `kras10`): kolo, konec igre, škoda, pot | kolo pri k 1058 v koraku brez sunka, konec, 0,917, 304 m | brez kolesa, ni konca, 0,571, 2094 m |
| krasnahorka/crash: korakov s škodo / brez sunka (škoda brez sunka) | 16 / 11 (0,355) | 2 / 0 |
| mombasa/formula k 1327 (`mombasa9b`, `mombasa10`): zasuk po sunku, škoda | več korakov brez sunka, škoda do 0,987 | 0,457 → 2,428 rad/s (od ograje), 0,005 → 0,065 |
| mombasa/formula 11,3 s: korakov s škodo / škoda ograje / brez sunka | 23 / 2,227 / 12 | 8 / 1,094 / 0 |
| `zid10` (32 dirk, 60 s): korakov s škodo / škoda ograje / epizod | 199 / 32,195 / 131 | 159 / 31,956 / 144 |
| `zid10`: korakov brez sunka s škodo; igralcu odpade kolo (od tega brez sunka) | 46 (4,3 % škode); 16 (2) | 0; 15 (0) |
| `zid10b` (16 drugih prog): korakov / škoda / epizod / brez sunka / koles | 90 / 26,925 / 82 / 4 / 20 | 85 / 26,061 / 80 / 0 / 18 |
| `zid11`: klicev `wallR` / ob robni ograji / največji odmik točke | 384 / 363 / 5,2 m | 317 / 294 / 2,689 m |
| `zid12` mombasa/formula 60 s: korakov / škoda / brez sunka | 42 / 4,482 / 12 | 19 / 2,908 / 0 |
| čas meritve `zid10` / `zid10b` (hitrost: do 4 poizvedbe proge na sunek) | 55,8 s / 49,9 s | 55,0 s / 49,8 s |

## Udarec repa (`zid13`, 32 dirk, 60 s; `node zid13-povzetek.js zid13-pred.log zid13-po.log`)

Epizoda: prvi sunek v sprednji vogal ob isti ograji (premor vsaj 0,1 s); udarec repa: prvi sunek v zadnji vogal istega avta ob isti ograji najpozneje 1 s pozneje.

| | pred | po |
|---|---|---|
| sunkov / v sprednji vogal / v zadnji | 274 / 184 / 90 | 275 / 179 / 96 |
| epizod / z udarcem repa | 114 / 50 | 108 / 52 |
| razmik: četrtina / mediana / tri četrtine | 0,108 / 0,283 / 0,517 s | 0,092 / 0,208 / 0,508 s |
| razmik v 0,15–0,3 s / pod 0,15 / nad 0,3 | 10 / 16 / 24 | 10 / 20 / 22 |
| hitrost repa proti sprednjemu vogalu: mediana / največ | 0,739 / 3,167 | 0,799 / 3,51 |
| rep hitrejši od sprednjega vogala / nad 1,5-kratnikom | 15 / 7 | 19 / 8 |
| kot vsaj 10°: parov, mediana razmika, v 0,15–0,3 s | 31, 0,283 s, 8 | 30, 0,208 s, 10 |
| kot pod 10° (skoraj vzporedno): parov, mediana, v 0,15–0,3 s | 19, 0,217 s, 2 | 22, 0,325 s, 0 |
| igralec: parov, mediana razmika, mediana razmerja | 32, 0,233 s, 0,738 | 28, 0,250 s, 0,799 |

Najmočnejši udarec repa: mombasa/formula, tekmec, ograja spremeni smer: 18,5 m/s (k 1361) → 22,7 m/s (k 1367); dirki se pred tem razideta, stanji nista enaki.

Cusco (`cusco9b`, cusco/crash, bočni zdrs 29,7 m/s, kot karoserije do ograje −4,3°): sprednji vogal 12,63 → 12,48 m/s, prijemališče 0,457 → 0,636 m pred sredino; zadnji vogal 0,05 → 0,042 s pozneje s 5,94 → 9,74 m/s; škoda igralca 0,627 → 0,729. Razmerje 0,47 → 0,78, pod 1,5.

## Česa ta krog ni izmeril

- Semena: `SEED=11` in `SEED=23` dasta iste številke kot 7 (dirke v `tests/lib/sim.js` so deterministične), zato to ni nov vzorec. Nov vzorec so druge proge (`zid10b`) ali druge postavitve (`race`, `lm`, `car`, `upg`, `demo`): te niso izmerjene.
- Boksi, mehki robovi, prepadi, krožišča, druge trase, konci odprte ceste (`wallRoom` gleda samo robno ograjo; prag 0,03 m = `W.cr0` ni iz virov), zrcalna slika na krivi ograji, igra prek spleta.
- `tocka.js 60` na končni kodi, p6/p7/p13 (`tools/trki/preverjanje/zid/`), `enako.js` (cv 1 enako; brez dotika enako `main`): zadnjič 25. 11., ta krog ne.
