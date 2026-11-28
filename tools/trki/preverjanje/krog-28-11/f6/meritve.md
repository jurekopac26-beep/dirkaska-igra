# fizika-6: lastno vrtenje kolesa povoženega kolesarja po sunku (28. 11.), meritve pred in po

Drevesa: **pred** = `666d326` (veja po spoju `main`; `_runBikeR` kot v `130ceaf`), **po** = commit s tem zapisom (prvi za `666d326`). Skripti (ta mapa): `kolo4.js` (prvi dotik kot v igri; prizori in vrstni red naključnih števil isti kot `../../krog-27-11/f6/kolo2.js`, šteje samo vrtenje kolesa, po hitrosti zbliževanja), `kolo3.js` (en klic pri naključnem prekrivanju, po vrsti dotika: zadaj, spredaj, bok). Obe merita `Traffic._hitVeh` v Realistični (cv 6) na jedru, instrumentiranem v pomnilniku (`../../krog-25-11/fizika/lib.js`); drevo ostane nedotaknjeno. »Kolo« je kolo povoženega kolesarja (90 kg, vztrajnostni moment 27,0 kg·m²).

Ukazi (v tej mapi):

```
node kolo4.js                 > kolo4-po.log           (N=12000 SEED=3)
node kolo3.js                 > kolo3-po.log           (N=40000 SEED=3, kolo vozi 0 do 9 m/s)
BV=0 node kolo3.js            > kolo3-stoji-po.log     (kolo stoji)
SEED=7 node kolo3.js          > kolo3-po-seme7.log
N=12000 SEED=3 node ../../krog-27-11/f6/kolo2.js > kolo2-po.log    (včerajšnja meritev meta na novem drevesu)
```

Dnevniki `*-pred.log` so isti ukazi na drevesu pred spremembo: `TRKI_SNAP=<drevo pred>` (`git worktree add --detach <mapa> 666d326`). Za `kolo2` je »pred« `../../krog-27-11/f6/kolo2-po.log` (drevo `130ceaf`).

## Kaj je uveljavljeno (samo Realistična, cv 6)

- **Vrtenje kolesa po sunku.** Zakon sunka v `_runBikeR` v imenovalcu že šteje, da se kolo zaradi sunka zavrti (`rnb² / Ib`). Koda je to vrtenje prej zavrgla in kolesu dala naključno (±4,5 rad/s, do 273,4 J), tudi kadar se dotik ne zapira. Zdaj kolo dobi natanko vrtenje, ki ga da navor sunka: `w = -rnb · J / Ib` (ročica sunka okoli središča kolesa krat sunek, deljeno z vztrajnostnim momentom), tako kot promet v `_hitVehR`.
- **Šteto v energijo para.** Energija tega vrtenja (`0,5 · Ib · w²`) je v varovalu energije, ki omejuje met vstran: par (avto in kolo z vrtenjem) energije ne dobi.
- **Dotik, ki se ne zapira: brez vrtenja.** Kolesar pade, kolo obdrži hitrost in se ne zavrti.
- **Naključna števila prometa.** Število se še vedno potegne in zavrže, zato je štetje naključnih števil prometa enako kot v cv 1.
- Nespremenjeno: upad vrtenja po padcu (`exp(-2,2 · t)`), mirovanje pod 0,25 rad/s, met kolesarja, škoda, dogodek. Simulacija in različice 2–5 (stari `_runBike`) ostanejo pri naključnem vrtenju. Vožnja ni spremenjena.

## Merilo

»Par z vrtenjem zraste«: kinetična energija avta (gibanje in vrtenje) in kolesa (gibanje in lastno vrtenje) v enem klicu zraste za več kot 1 J. »Neplačano«: energija vrtenja kolesa je večja od tega, kar par izgubi drugje. »Po sunku«: vrtenje je enako navoru sunka (na 1e-9). »Do mirovanja«: čas, da vrtenje pade pod 0,25 rad/s, izračunan iz upada v jedru.

## kolo4: prvi dotik kot v igri (12 000 prizorov, 8 382 zadetkov, 0 NaN)

Vrtenje kolesa po zadetku, pred → po:

| hitrost zbliževanja | dotikov, ki se zapirajo | povprečje (rad/s) | mediana | 90. percentil | največ | energija vrtenja povp. (J) | največ (J) |
|---|---|---|---|---|---|---|---|
| do 30 km/h | 2 471 | 2,27 → 3,06 | 2,29 → 2,91 | 4,04 → 5,73 | 4,50 → 8,37 | 92 → 175 | 273 → 945 |
| 30–60 km/h | 1 915 | 2,18 → 6,29 | 2,20 → 6,11 | 4,01 → 11,63 | 4,50 → 16,02 | 88 → 727 | 273 → 3 465 |
| 60–120 km/h | 1 661 | 2,24 → 12,54 | 2,28 → 12,46 | 4,06 → 22,84 | 4,50 → 30,87 | 91 → 2 882 | 273 → 12 866 |
| 120–200 km/h | 1 173 | 2,21 → 21,86 | 2,20 → 21,76 | 4,01 → 39,26 | 4,50 → 49,07 | 88 → 8 688 | 273 → 32 504 |
| nad 200 km/h | 1 103 | 2,20 → 34,60 | 2,19 → 32,84 | 3,97 → 63,27 | 4,50 → 81,81 | 88 → 22 185 | 273 → 90 349 |

Energija in trajanje, pred → po:

| hitrost zbliževanja | delež izgube para, ki gre v vrtenje | par z vrtenjem zraste | neplačano | po sunku | do mirovanja povp. / največ (s) |
|---|---|---|---|---|---|
| do 30 km/h | 0,752 → 0,481 | 622 (do 273,0 J) → 0 | 651 → 0 | 0 → 2 471 | 0,89 / 1,31 → 1,02 / 1,60 |
| 30–60 km/h | 0,105 → 0,337 | 163 (do 265,6 J) → 0 | 174 → 0 | 0 → 1 915 | 0,86 / 1,31 → 1,33 / 1,89 |
| 60–120 km/h | 0,040 → 0,295 | 75 (do 266,3 J) → 0 | 85 → 0 | 0 → 1 661 | 0,87 / 1,31 → 1,64 / 2,19 |
| 120–200 km/h | 0,011 → 0,280 | 55 (do 264,7 J) → 0 | 57 → 0 | 0 → 1 173 | 0,88 / 1,31 → 1,89 / 2,40 |
| nad 200 km/h | 0,003 → 0,266 | 54 (do 269,6 J) → 0 | 59 → 0 | 0 → 1 103 | 0,88 / 1,31 → 2,07 / 2,63 |

Skupaj: par z vrtenjem zraste v 969 → 0 od 8 323 dotikov, ki se zapirajo; vrtenje je neplačano v 1 026 → 0 (do 30 km/h prej v 26 % dotikov). Dotiki, ki se ne zapirajo: 59, z vrtenjem 59 (do 4,18 rad/s) → 0. Povprečna ročica sunka okoli središča kolesa je 0,35–0,37 m (v obeh drevesih ista).

## kolo3: en klic pri naključnem prekrivanju (40 000 klicev, 0 NaN)

Kolo vozi (24 467 zadetkov), pred → po:

| dotik | dotikov, ki se zapirajo | vrtenje povp. (rad/s) | največ | energija vrtenja povp. (J) | največ (J) | par z vrtenjem zraste | po sunku |
|---|---|---|---|---|---|---|---|
| zadaj | 1 096 | 2,19 → 7,22 | 4,50 → 62,48 | 88 → 2 095 | 273 → 52 700 | 469 (do 271,0 J) → 0 | 0 → 1 096 |
| spredaj | 4 072 | 2,27 → 5,09 | 4,50 → 82,71 | 92 → 1 053 | 273 → 92 357 | 1 211 (do 270,8 J) → 0 | 0 → 4 072 |
| bok | 7 126 | 2,26 → 8,74 | 4,50 → 83,37 | 92 → 3 084 | 273 → 93 821 | 3 057 (do 273,4 J) → 0 | 0 → 7 126 |

Kolo stoji (`BV=0`, 24 320 zadetkov), pred → po:

| dotik | dotikov, ki se zapirajo | vrtenje povp. (rad/s) | največ | energija vrtenja povp. (J) | največ (J) | par z vrtenjem zraste | po sunku |
|---|---|---|---|---|---|---|---|
| zadaj | 2 362 | 2,28 → 4,56 | 4,50 → 69,11 | 93 → 1 271 | 273 → 64 471 | 1 438 (do 273,2 J) → 0 | 0 → 2 362 |
| spredaj | 2 289 | 2,24 → 4,89 | 4,50 → 73,84 | 90 → 1 324 | 273 → 73 601 | 1 352 (do 273,3 J) → 0 | 0 → 2 289 |
| bok | 6 803 | 2,27 → 8,72 | 4,50 → 80,06 | 93 → 3 117 | 273 → 86 528 | 3 223 (do 273,4 J) → 0 | 0 → 6 803 |

Drugo seme (`SEED=7`, kolo vozi, 24 540 zadetkov), pred → po:

| dotik | dotikov, ki se zapirajo | vrtenje povp. (rad/s) | največ | energija vrtenja povp. (J) | največ (J) | par z vrtenjem zraste | po sunku |
|---|---|---|---|---|---|---|---|
| zadaj | 1 157 | 2,22 → 6,96 | 4,50 → 72,01 | 89 → 2 040 | 273 → 70 002 | 519 (do 273,3 J) → 0 | 0 → 1 157 |
| spredaj | 4 001 | 2,28 → 5,19 | 4,50 → 71,68 | 93 → 1 066 | 273 → 69 364 | 1 286 (do 273,2 J) → 0 | 0 → 4 001 |
| bok | 7 137 | 2,23 → 8,62 | 4,50 → 82,44 | 90 → 2 990 | 273 → 91 740 | 3 081 (do 273,3 J) → 0 | 0 → 7 137 |

V vseh treh tekih je bilo vrtenje prej neplačano v istih dotikih, v katerih par z vrtenjem zraste; zdaj v nobenem. Dotiki, ki se ne zapirajo (12 173, 12 866, 12 245): prej vsi z vrtenjem (do 4,5 rad/s, 273,4 J), zdaj nobeden.

## kolo2 (meritev 27. 11.) na novem drevesu: met vstran

Varovalo energije zdaj šteje tudi vrtenje kolesa, zato je met vstran zmanjšan malo pogosteje (`130ceaf` → zdaj):

| razred | dotikov, ki se zapirajo | met zmanjšan | delež polnega meta | energija para zraste |
|---|---|---|---|---|
| brez zdrsa, kolo stoji | 1 073 | 112 → 143 | 0,951 → 0,937 | 0 → 0 |
| brez zdrsa, kolo vozi | 1 366 | 128 → 175 | 0,960 → 0,946 | 0 → 0 |
| zdrs do 0,3, kolo stoji | 1 308 | 177 → 234 | 0,943 → 0,925 | 0 → 0 |
| zdrs do 0,3, kolo vozi | 1 440 | 112 → 148 | 0,968 → 0,956 | 0 → 0 |
| zdrs 0,3–0,6, kolo stoji | 1 576 | 132 → 187 | 0,968 → 0,955 | 0 → 0 |
| zdrs 0,3–0,6, kolo vozi | 1 560 | 118 → 157 | 0,969 → 0,956 | 0 → 0 |

Skupaj je met zmanjšan v 779 → 1 044 od 8 323 dotikov, ki se zapirajo (9,4 % → 12,5 %). Poleg tega se spremenijo samo: »zdrs do 0,3, kolo vozi« avto pridobi več kot 0,01 m/s v 156 → 153 in več kot 0,1 m/s v 52 → 51 zadetkih, največ energije od kolesa, ki vozi, 2 381,6 → 2 344,5 J; »zdrs 0,3–0,6, kolo vozi« več kot 0,01 m/s v 111 → 109. Zadetki, dotiki, ki se ne zapirajo (brez sunka), in vsi drugi števci so enaki.

## Kaj se vidi (za odločitev)

Sprememba je vidna, zato potrebuje kartico na strani Odločitve s slikami zdaj in potem.

- **Prej:** kolo se je po zadetku vedno zavrtelo počasi in ne glede na hitrost: do 4,5 rad/s (0,7 obrata na sekundo), tudi ob dotiku, ki se ne zapira, in ob zadetku skozi središče. Obležalo je po približno 0,9 s (največ 1,3 s).
- **Zdaj:** vrtenje raste s hitrostjo zbliževanja in z ročico zadetka: mediana 2,9 rad/s do 30 km/h, 12,5 rad/s pri 60–120 km/h (2 obrata na sekundo), 21,8 rad/s pri 120–200 km/h (3,5 obrata na sekundo); skrajno do 82 rad/s (13 obratov na sekundo) nad 200 km/h. Do mirovanja 1,0–2,1 s (največ 2,6 s). Zadetek skozi središče kolesa ne zavrti, zrcalni zadetek ga zavrti v drugo smer.
- **Ni po viru:** vrtenje sledi iz zakona sunka, ki ga igra že uporablja (kolo kot togo telo). Za skrajne vrednosti pri zelo hitrih zadetkih ni vira; zgornje meje ni.
- **Predlog možnosti:** 1 = po sunku (stanje veje); 2 = naključno kot prej, a plačano iz izgube dotika (delitev bi bila izmišljena); 3 = kot prej (naključno, nešteto v energijo).

## Ostane odprto

Skok pri hitrosti zbliževanja nič (tik nad njo met vstran, pri njej in pod njo ničesar), kot 27. 11.

## Testi

`node tests/trki.test.js`: 86 od 86. Novi preverbi: (1) kolesar povožen od zadaj, v bok, čelno ter pod 45° in 135°, zunaj sredine, pri 20, 60 in 200 km/h, kolo stoji ali vozi: par z vrtenjem kolesa energije ne dobi (1e-9 deleža), gibalna količina para se ohrani (1e-9), zrcalna slika se zavrti v drugo smer (1e-9), dogodek, škoda in štetje naključnih števil prometa enaki kot v cv 1; (2) zadetek skozi središče kolesa ga ne zavrti, zadetek ob strani ga zavrti, zrcalni enako hitro v drugo smer, pri 60 km/h več kot dvakrat hitreje kot pri 20 km/h in pri 200 km/h več kot dvakrat hitreje kot pri 60 km/h (izmerjeno 4,45 / 12,12 / 38,46 rad/s). Dopolnjeni: dotik, ki se ne zapira (kolo brez vrtenja), in počasno dohitevanje kolesarja (energija z vrtenjem). Pod 45° in 135° je avto postavljen 0,3 m v kolo: dotik Realistične je med škatlama z zaobljenimi vogali (polmer do 0,3 m), ki se srečata pozneje kot ostra vogala.

Ista testna datoteka na jedru pred spremembo (`666d326`, kopija drevesa z novim `tests/trki.test.js`): 4 od 86 padejo, in sicer natanko novi preverbi in dopolnjeni dve (dotik, ki se ne zapira, kolesu pusti vrtenje; pri počasnem dohitevanju par z vrtenjem energijo dobi, npr. 35/30 km/h: 2,99e-3 deleža, kolo −3,57 rad/s; zrcalna slika se ne zavrti nasprotno; zadetek skozi središče kolo zavrti). Ostalih 82 je enakih.

Reference: `tests/golden/trki.json` nespremenjena (test jo primerja; v njej ni prizora s kolesarjem). `tests/golden/sim.json` in `tests/golden/races.json` po branju kode ne moreta biti prizadeti (`_runBikeR` kliče samo promet, prizori teh dveh testov prometa ne vklopijo); s tekom na tem drevesu to ni preverjeno, pokaže povezani krog na končni glavi.
