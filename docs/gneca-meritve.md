# Gneča: meritve 1, 8, 16, 24 vozil (28. 11. 2026)

Lastnik: jure.kopac26. Priprava za sejo, ki prevzame gnečo v nedeljo, 29. 11., ob 10.05 (O-27-23). V tem PR so samo meritve, orodje in lahek test. Koda igre ostane nespremenjena, igralčeva fizika vožnje tudi (O-27-7: izjema velja samo za tekmece). Gradi na #1180 (partyslo, 101 avto na Spa) in ga ne podvaja.

## Na kratko

- **Spa je edina od treh prog, kjer se gneča pozna.** Od 1 do 16 avtov se sličica podaljša s 17,8 na 25,2 ms (+7,4 ms). Od tega je risanje +4,3 ms (klici 149 → 227), fizika +3,7 ms, ostalo +1,4 ms. Pri 16 avtih je p95 35,7 ms, kar je nad 33,3 ms, zato je dirka počasnejša (96 % hitrosti). Jezero in Monaco držita 16,7 ms (vsync), raste samo p95 (do 22–23 ms).
- **Risanje stane več kot fizika tekmecev.** Z vsakim tekmecem pride 4–5 klicev risanja in 0,15–0,3 ms risanja na sličico (Spa).
- **Fizika tekmecev raste linearno.** Iskanja po vseh parih ni. V node na Spa: 1 avto 0,024 ms na korak, 8 avtov 0,17, 16 avtov 0,26, 24 avtov 0,27 (na telefonu približno ×4). Na tekmeca je to 0,011–0,024 ms na korak 1/120 s.
- **Spirala:** daljša sličica pomeni več korakov na sličico (Spa: 2,1 → 2,9 koraka), ti pa sličico še podaljšajo.
- **LOD pod 30 avti skoraj nič ne prinese.** Z `LOD.min = 0` je korak na Spa krajši za samo ~4 %: 16 avtov 0,279 namesto 0,289 ms, 24 avtov 0,243 namesto 0,253 ms.
- Najdaljše sličice (57–130 ms) so tudi pri 1 avtu, torej ne prihajajo od gneče (glej `docs/zatikanje-start.md`: GC, prva sličica).

## Metoda in orodja

- **Sličica (brskalnik):** `node tools/gneca-slicica.mjs --proga=<id> --tekmeci=<n-1> --sek=15` (orodje iz #1180). Chromium s programskim WebGL, CPU 4× upočasnjen, zaslon 844×390, navidezna ura, avtopilot. Število korakov na sličico je kot v igri. Postavitev na startu je privzeta igrina: pri 8 avtih je igralec 7., pri 16 avtih 12. Pri 24 avtih je leteči start z igralcem zadaj. Absolutni časi so večji kot na telefonu (WebGL na CPU), razmerja med deli pa veljajo.
- **Korak fizike (node, brez risanja):** `node tools/gneca-tekmeci.js [--proga=spa] [--avtov=1,8,16,24] [--sek=20] [--profil=1] [--lod='{"min":0}']` (novo). Meri čas `Race.step` (povprečje in p95), avte na korak (LOD) in čas avtopilota igralca. S profilom CPU (vzorec 100 µs) da še skupni čas glavnih funkcij in 10 funkcij z največ lastnega časa, z vrsticami v `js/core.js`.
- **Lahek test:** `node tests/gneca.test.js` (v `npm run test:related` ob spremembi `js/core.js` in `tools/gneca-*`). Spa, 1, 8 in 24 avtov s starta, 4 s. Preveri, da ni NaN, da LOD ni vklopljen, da so vsi avti speljali in da dirka teče. Preveri tudi razmerji: 24 avtov največ 30× en avto in največ 4,5× 8 avtov. Pri linearni rasti bi bilo 3×, pri zanki čez vse pare 6–9×. Izmerjeno: 17× in 2,8×, 1,5 s.

## Meritve: sličica (ms, 15 s, CPU 4×)

Sličica = fizika + risanje + ostalo (zvok, HUD, vreme). Fizika je zapisana kot koraki na sličico × ms na korak.

| Proga, avti | sličica povp. / p95 / max | fizika | risanje | ostalo | klici | oglišč | hitrost |
|---|---|---|---|---|---|---|---|
| Spa, 1 | 17,8 / 22,1 / 123,5 | 0,8 (2,1 × 0,37) | 12,1 | 2,8 | 149 | 335 k | 99 % |
| Spa, 8 | 20,9 / 29,6 / 126 | 2,6 (2,5 × 1,07) | 14,3 | 3,6 | 192 | 384 k | 98 % |
| Spa, 16 | **25,2 / 35,7** / 122 | 4,5 (2,9 × 1,56) | 16,4 | 4,2 | 227 | 447 k | **96 %** |
| Spa, 24 (leteči) | 23,0 / 34,2 / 130 | 4,4 (2,7 × 1,66) | 14,0 | 4,3 | 176 | 399 k | 97 % |
| Jezero, 1 | 16,8 / 16,7 / 91 | 0,5 | 6,3 | 2,9 | 92 | – | 100 % |
| Jezero, 8 | 17,1 / 18,5 / 110 | 1,5 (2,0 × 0,73) | 8,3 | 3,1 | 139 | – | – |
| Jezero, 16 | 17,7 / 22,1 / – | 2,7 (2,1 × 1,27) | 9,2 | 3,3 | 161 | – | – |
| Jezero, 24 | 17,6 / 22,7 / 57,7 | 3,0 (2,1 × 1,41) | 8,0 | 3,9 | 111 | – | 100 % |
| Monaco, 1 | 16,8 / 16,7 / 72,6 | 0,6 | 6,5 | 2,4 | 100 | 680 k | – |
| Monaco, 8 | 17,2 / 19,2 / – | 1,8 (2,1 × 0,86) | 8,5 | 2,9 | 148 | 702 k | – |
| Monaco, 16 | 17,7 / 22,0 / – | 2,8 (2,1 × 1,31) | 9,0 | 3,1 | 159 | 725 k | – |
| Monaco, 24 | 17,4 / 20,5 / 113,6 | 3,0 (2,1 × 1,44) | 7,9 | 3,3 | 115 | 697 k | 99 % |

Pri 24 avtih je risanja manj kot pri 16, ker so pri letečem startu tekmeci razvlečeni in jih je manj v vidnem polju. Neposredno primerljivi sta vrstici za 8 in 16 avtov.

## Meritve: korak fizike (node, ms na korak 1/120 s, 30 s po 2 s ogrevanja)

| Proga | 1 avto | 8 avtov | 16 avtov | 24 avtov |
|---|---|---|---|---|
| Spa | 0,024 | 0,172 | 0,260 | 0,274 |
| Jezero | 0,014 | 0,124 | 0,207 | 0,256 |
| Monaco | 0,014 | 0,120 | 0,192 | 0,244 |

## Najdražja mesta v kodi tekmecev (Spa, 24 avtov, profil)

Skupni čas pomeni čas funkcije skupaj s klici, ki jih naredi. Časi so v ms na korak (node), za telefon jih pomnoži s ~4.

1. **Korak avta `Car.step` → `stepCS`** (`js/core.js` 3639 → 3147): 0,116 ms skupaj (~43 % koraka). Lastni čas `stepCS` je 0,05 ms. To je fizika vožnje tekmeca, ki je enaka igralčevi. Spremeni se lahko samo za tekmece (O-27-7).
2. **Vodenje `aiControl` / `aiDrive`** (4779/4780): 0,042 ms na Spa in 0,052–0,055 ms na Jezeru in Monacu (16–22 %). Lastni čas `aiDrive` je 0,02–0,025 ms. Pri največ 16 avtih (`BIG_FIELD`, 4744) vsak tekmec pregleda vse ostale avte, zato je cena O(N²). Pri več avtih uporabi okno `race._byDist()` (8649).
3. **`Track.query`** (1780, `_qMain` 1820): 0,029 ms (~10 %). Vsak avto ga večkrat na korak kliče za kolesa, zid in vodenje.
4. **Trki in zavetrje:** `wallCollide` (4285) 0,016 ms; `_pairs` + `pair` + `carCollide` (8658, 4410) ~0,02 ms; `_tow` (8713) 0,009–0,011 ms. Pri 16 avtih v gruči s starta trki parov (`pair` + `carCollide` + `kCollide`) stanejo ~0,045 ms in `_tow` 0,018–0,023 ms.
5. **Drobno, a pogosto:** `get speed` (3119, `Math.hypot`) ima 0,008–0,014 ms lastnega časa. Lastni čas `Race._step` (7951) je 0,02–0,03 ms (zanke čez polje, stanje dirke).

## Predlog popravkov (po vrsti)

Naslednja seja naj izbere sama, pred `main` pa naredi slike in meritve s temi orodji. Že zavrnjene zamisli iz `docs/zatikanje-start.md` niso na seznamu: nižja skupna pogostost za avte ob drugem avtu, redkejše posodabljanje oddaljenih vidnih avtov, slog pik na zemljevidu, `LOD.nrT`, AI z nižjo pogostostjo, vreme enkrat na sličico, preskok matrik skritih delov.

1. **Cenejše risanje oddaljenih tekmecev** (največji del: +4,3 ms in +78 klicev od 1 do 16 avtov na Spa). Deli avta naj se spojijo v manj klicev, oddaljeni tekmeci naj dobijo cenejši material, prave sence naj imajo samo bližnji avti (kartica #1180: −1,6 ms). Grafika gre na stran Odločitve z 2–3 slikami.
2. **Prekiniti spiralo samo za tekmece.** Ko sličica zahteva več kot 2 koraka, naj igralec še vedno dobi vsak korak 1/120 s, tekmeci pa naj preostale korake združijo (manj, daljših korakov, samo v `Race._step` za `!isPlayer`). Pri 16 avtih na Spa to prihrani približno (2,9 − 2) × 1,4 ≈ 1,3 ms na sličico. Igralčev odziv ostane kot na kronometru (O-27-7).
3. **Enostavnejši model za oddaljene tekmece** (iz #1180). Tekmeci zunaj ~150 m in zunaj vidnega polja naj dobijo poenostavljen `stepCS` (brez zdrsa po kolesih in brez vzmetenja). Lahko prihrani do ~polovice od 0,116 ms.
4. **Predpomnilnik za `Track.query` in `get speed` pri tekmecih.** Namig odseka naj se nosi od koraka do koraka, hitrost naj se izračuna enkrat na korak namesto pri vsakem `hypot`. Pričakovano −10–15 % koraka, brez spremembe vedenja (vsebina primerjave mora ostati enaka do bita).
5. **`BIG_FIELD` s 16 na 8.** Vodenje in lovljenje bi pri 9–16 avtih uporabljala okno namesto vseh avtov. Prihranek je majhen (~0,01–0,02 ms pri 16 avtih), tveganje pa je, da se spremeni vedenje tekmecev (prehitevanje). Preveri teste tekmecev (`npm run test:related` za `js/core.js`).
6. (nizko) **`LOD.min` pod 30** prinese samo ~4 %. Smiselno je šele po točki 3.

## Za sejo, ki prevzame

- Začni z `node tools/gneca-tekmeci.js --proga=spa --avtov=16 --sek=20` in `node tools/gneca-slicica.mjs --proga=spa --tekmeci=15 --mesto=0 --sek=15` (nekaj minut). Ta dva števca primerjaj pred popravkom in po njem. Node in brskalnika ne poganjaj hkrati.
- Za razčlenitev risanja po funkcijah dodaj `--profil=20 --skupno=1` k `gneca-slicica.mjs`.
- Lahki test `tests/gneca.test.js` čuva linearnost. Če popravek 2 ali 3 spremeni čas koraka, test ostane veljaven, ker preverja samo razmerja.
