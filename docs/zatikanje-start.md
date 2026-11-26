# Zatikanje na startu (raziskava, 26. 11. 2026)

Lastnik: partyslo. Samo raziskava: meritve in predlogi, brez spremembe kode v igri. Orodje: `node tools/zatikanje-start.mjs`.

## Na kratko

- **Glavni vzrok ni število avtov, ampak risanje in lovljenje zamude.** Risanje (priprava scene in ukazi WebGL) stane 22–32 ms na sličico ne glede na število avtov. Zato manj tekmecev skoraj ne pomaga: že s 6 avti je povprečna sličica 31–38 ms (cilj 16,7 ms).
- **Ko je sličica počasna, igra v naslednji naredi več korakov fizike** (`game.js` `frame`, do 10 korakov). S 101 avtom to fiziko poveča z 12–14 na 39–40 ms, povprečna sličica naraste za 30–55 % (Spa 51 → 80 ms, p95 78 → 137 ms). To je začarani krog na startu.
- **Konice do 100–140 ms niso od avtov:** velik čistilni premor (GC) 35–106 ms po nalaganju proge, prva sličica po zelenem (zvok 28 ms in HUD 20 ms naenkrat) in konice risanja 50–110 ms.
- Trki (0,7 ms) in AI (1,3–1,8 ms) pri 101 avtu sta majhna. LOD na startu deluje (polno se računa ~27 od 101 avta), domneva »LOD na startu ne deluje« ne drži.
- Killarney: HUD 7,5 ms na sličico (drugje 1,7 ms), skoraj vse v `placeNote` (vsako sličico bere `offsetWidth`, kar sproži prisilni izračun postavitve strani).

## Metoda

- Chromium v vsebniku, programski WebGL (SwiftShader), CPU upočasnjen 4× (kot srednji telefon), zaslon 844×390, `quality: normal`, `detail: low`, sence vklopljene, kamera `chase`, zvok vklopljen, seme 12345.
- Dirka od začetka skozi luči, nato 5 s (300 sličic) po zelenem. Sličice si sledijo kot v `game.js` `frame`: koraki fizike (`sim`), `Sfx.update`, `Render.frame`, HUD. Lastna zanka igre (rAF) je ustavljena, da so v profilu samo merjene sličice.
- **osnova**: 2 koraka na sličico (60 sl./s). **dohit**: koraki po času prejšnje sličice, do 10 (kot v igri). **dohit4**: enako, do 4 (predlog 1). **sence**: sonce brez senc. **delci**: `Render.frame` z `noFx`.
- Razčlenitev po skupinah iz profila CDP (vzorec 200 µs, lastni čas funkcij), GC iz sledi (MinorGC, MajorGC), klici risanja in oglišča prešteti na `gl.draw*`.
- Absolutni časi so večji kot na pravem telefonu (programski WebGL riše na CPU), razmerja med deli in prehodi pa veljajo.

## Meritve (ms na sličico, prvih 5 s po zelenem, CPU 4×)

JS = celotna sličica (povprečje / p95 / najdaljša). Fizika = vsi koraki (fizika, AI, trki skupaj). Polno = avtov, ki se računajo vsak korak (LOD).

| Proga, avti | JS povp. / p95 / max | fizika (p95) | zvok | risanje (p95) | HUD | klici | oglišč | polno | GC (manjši; veliki) |
|---|---|---|---|---|---|---|---|---|---|
| Spa, 6 | 38,0 / 57,5 / 138,8 | 6,3 (11,8) | 2,7 | 27,3 (43,3) | 1,7 | 208 | 488 k | 6 | 50 × 3,4; **1 × 105,9** |
| Spa, 22 | 35,3 / 57,9 / 112,9 | 7,5 (14,5) | 2,4 | 23,6 (39,0) | 1,7 | 222 | 523 k | 22 | 8 × 4,9; **1 × 69,7** |
| Spa, 101 | 51,3 / 78,2 / 123,6 | 14,0 (23,9) | 2,9 | 31,5 (49,8) | 2,9 | 183 | 496 k | 26,7 | 14 × 6,1; 2 × 5,9 |
| Spa, 101, dohit | **79,9 / 136,5 / 178,1** | **40,2 (72,0)** | 3,1 | 33,0 (53,1) | 3,6 | 198 | 455 k | 28,8 | 24 × 5,7; 2 × 9,4 |
| Spa, 101, sence | 48,8 / 78,4 / 153,3 | 13,6 | 2,8 | 29,3 | 3,2 | 147 | 388 k | 26,7 | 13 × 6,2; 2 × 12,0 |
| Spa, 101, delci | 49,4 / 85,4 / 142,9 | 13,8 | 3,0 | 29,8 | 2,8 | 182 | 487 k | 26,7 | 12 × 5,5; 2 × 11,5 |
| Killarney, 6 | 36,4 / 57,3 / 111,6 | 4,1 (8,6) | 2,6 | 22,1 (35,1) | **7,6** | 167 | 389 k | 6 | 6 × 5,1; 2 × 7,8 |
| Killarney, 22 | 39,4 / 62,8 / 90,6 | 6,3 (13,6) | 2,6 | 23,1 (36,4) | **7,4** | 167 | 394 k | 22 | 9 × 5,6; 2 × 6,5 |
| Killarney, 61 (največ) | 41,2 / 73,9 / 113,9 | 5,9 (12,4) | 2,5 | 25,1 (43,2) | **7,8** | 178 | 416 k | 13,2 | 9 × 5,2; 2 × 6,5 |
| Killarney, 61, dohit | 47,4 / 81,8 / 123,6 | 11,2 (26,7) | 2,4 | 25,6 (41,8) | 8,2 | 171 | 419 k | 12,9 | 13 × 5,7; 2 × 9,4 |
| Killarney, 61, sence | 38,3 / 59,5 / 81,0 | 6,4 | 2,4 | 22,1 | 7,4 | 139 | 373 k | 13,2 | 9 × 5,3; 2 × 5,8 |
| Killarney, 61, delci | 39,5 / 59,8 / 91,9 | 5,8 | 2,5 | 23,7 | 7,5 | 177 | 395 k | 13,2 | 8 × 6,8; 2 × 5,4 |
| Pembrey, 6 | 31,3 / 53,8 / 94,3 | 5,1 (9,8) | 1,9 | 22,7 (39,6) | 1,6 | 224 | 734 k | 6 | 4 × 5,7 |
| Pembrey, 22 | 34,7 / 58,2 / 107,7 | 7,7 (14,8) | 1,6 | 23,6 (38,9) | 1,7 | 241 | 760 k | 22 | 7 × 4,8; **1 × 35,2** |
| Pembrey, 101 | 43,2 / 67,5 / 140,5 | 11,7 (21,0) | 2,1 | 26,9 (44,4) | 2,5 | 206 | 733 k | 27,2 | 11 × 5,7; 2 × 5,1 |
| Pembrey, 101, dohit | **72,5 / 120,7 / 172,8** | **39,4 (75,8)** | 2,4 | 25,7 (40,7) | 4,9 | 201 | 629 k | 33,1 | 25 × 4,9; 2 × 7,7 |
| Pembrey, 101, sence | 39,3 / 60,7 / 92,4 | 11,6 | 1,8 | 23,5 | 2,4 | 153 | 533 k | 27,2 | 11 × 4,6; 2 × 10,9 |
| Pembrey, 101, delci | 39,7 / 61,0 / 93,2 | 11,1 | 1,8 | 24,6 | 2,3 | 205 | 708 k | 27,1 | 11 × 5,1; 2 × 10,2 |

**Predlog 1 izmerjen** (drugi zagon, prehod `dohit4`: koraki po času prejšnje sličice, največ 4):

| Proga, avti | prehod | JS povp. / p95 / max | fizika (p95) | risanje | HUD | korakov na sl. |
|---|---|---|---|---|---|---|
| Spa, 101 | osnova (ponovitev) | 46,2 / 74,3 / 118,5 | 12,1 (21,8) | 28,7 | 2,8 | 2 |
| Spa, 101 | dohit (meja 10, kot zdaj) | 79,9 / 136,5 / 178,1 | 40,2 (72,0) | 33,0 | 3,6 | 8,4 |
| Spa, 101 | **dohit4** (meja 4) | **56,6 / 86,8 / 151,7** | 20,1 (34,2) | 28,7 | 4,8 | 4,0 |
| Pembrey, 101 | osnova (ponovitev) | 39,2 / 61,0 / 113,8 | 11,0 (17,8) | 24,4 | 2,1 | 2 |
| Pembrey, 101 | dohit (meja 10, kot zdaj) | 72,5 / 120,7 / 172,8 | 39,4 (75,8) | 25,7 | 4,9 | 7,9 |
| Pembrey, 101 | **dohit4** (meja 4) | **54,8 / 82,4 / 135,6** | 22,3 (39,8) | 25,9 | 4,4 | 4,0 |

Ponovitev iste meritve se razlikuje do ~10 % (Spa 101 osnova: 51,3 in 46,2 ms).

Vsi klici risanja (do 262) in oglišča (do 760 k) so pod mejo `tests/golden/perf.json` (~300, ~900 k).

### Profil pri največ avtih (lastni čas, ms na sličico, osnova)

| Proga | fizika | AI | trki | three.js | risanje (render.js) | delci | zvok | igra (HUD) | GC |
|---|---|---|---|---|---|---|---|---|---|
| Spa, 101 | 9,5 | 1,8 | 0,7 | 17,0 | 7,8 | 1,1 | 2,8 | 3,1 | 0,4 |
| Spa, 101, dohit | 27,8 | 4,8 | 2,3 | 18,4 | 7,2 | 0,8 | 2,8 | 5,4 | 0,6 |
| Killarney, 61 | 3,6 | 0,9 | 0,2 | 13,6 | 4,5 | 0,6 | 2,4 | 7,8 | 0,2 |
| Pembrey, 101 | 8,1 | 1,3 | 0,7 | 14,3 | 6,0 | 0,8 | 2,0 | 2,6 | 0,3 |

Največ časa pri Spa 101: `updateCars` (render.js, 2,2 ms), množenje matrik in `updateMatrixWorld` v three.js (3,2 ms), koraki avtov `step`/`stepCS`/`_step` (4,3 ms), `query` (prostorsko iskanje sosedov, 1,1 ms). Killarney: `placeNote` (game.js, 4,8 ms), `update` (world.js, 2,0 ms).

### Najdaljše sličice (od kod konice)

- Spa 6: sličica 91 = 138,8 ms, od tega fizika 112,7 ms; v isti sličici je velik GC 105,9 ms (smeti nalaganja proge). Sličica 0 po zelenem = 106,5 ms: zvok 27,9, HUD 20,4, risanje 46,1.
- Spa 22: sličica 259 = 112,9 ms, od tega risanje 101,7 ms. Spa 101: konice risanja do 96,6 ms, fizike do 47 ms.
- Killarney: konice HUD do 24 ms (`placeNote`). Pembrey 22: velik GC 35,2 ms.
- **Novi senčilniki med dirko** (beleženje `renderer.info.programs`, drugi zagon): na Spa se v prvih 5 s po zelenem prevede **6 novih programov** v 5 sličicah; 3 od 6 najdaljših sličic (103–152 ms, risanje 85–114 ms) imajo nov program. Pembrey: 1 nov program. Ob nalaganju proge `Render.precompile()` (game.js `ensureTrack`) prevede samo svet, avti in učinki (dim, iskre, sledi) pridejo pozneje.
- **Nove geometrije**: 74–165 v 5 s (sledi gum, delci), kar daje smeti za GC. Pembrey (drugi zagon): 4 veliki GC, povprečno 31 ms, največ 67 ms (sličica 42: fizika 82 ms).

## Predlogi

| # | Predlog | Prihranek (izmerjeno ali ocena) | Kaj pridobimo | Kaj izgubimo | Fizika vožnje |
|---|---|---|---|---|---|
| 1 | **Manj korakov lovljenja na sličico** (sam igralec: meja 10 → 4; na spletu ostane 64) | **Izmerjeno**: Spa 101 povp. 79,9 → 56,6 ms (−23), p95 136,5 → 86,8 (−50); Pembrey 101 povp. 72,5 → 54,8 (−18), p95 120,7 → 82,4 (−38) | Ni več začaranega kroga: počasna sličica ne pomeni še počasnejše naslednje | Do 30 sl./s se nič ne spremeni (4 koraki = 1/30 s). Pod 30 sl./s gre dirka počasneje od ure: pri tej meritvi ~0,6× namesto ~0,9×. Igra že zdaj tako dela pri meji 10, le pozneje | **Ne**: isti korak 1/120 s, isti model; časi krogov se merijo v času dirke |
| 2 | **Ogrevanje pred zelenim**: `Render.precompile()` še enkrat po postavitvi avtov (zdaj samo ob nalaganju proge, pred avti), med lučmi en skrit izris dimov, isker in dežja; čiščenje smeti (GC) med nalaganjem, ne po zelenem | Ocena: konice 100–150 ms (6 programov na Spa, 1 na Pembreyju, veliki GC 35–106 ms) na pod ~60 ms; povprečje ~1–2 ms | Brez konic 70–140 ms v prvih sekundah (prva sličica, GC, prvo prevajanje) | Luči trajajo enako; nalaganje proge lahko traja ~0,1 s dlje | Ne |
| 3 | **Prva sličica po zelenem razbremenjena**: zvoki starta in elementi HUD pripravljeni med lučmi | ~40 ms v prvi sličici (zvok 28 + HUD 20 → ~3 + ~2) | Brez sunka točno ob zelenem, ko so vsi avti skupaj | Nič opaznega | Ne |
| 4 | **HUD brez prisilne postavitve**: `placeNote` naj ključ preveri brez branja `offsetWidth` vsako sličico (samo ob spremembi razreda HUD ali zaslona) | ~5 ms na sličico na Killarneyju (HUD 7,5 → ~2,5), konice HUD do 24 ms | Killarney in proge z znaki ovinkov tečejo enako gladko kot Spa | Nič | Ne |
| 5 | **Sence na startu ugasnjene na počasni napravi** (samodejno, ko je sličica več kot 25 ms) | 2,3–3,4 ms, 36–53 klicev risanja manj | Manj dela pri risanju, kar je največji stalni strošek | Prve sekunde brez senc avtov na počasnih napravah | Ne |

Drugo: delci brez dima prihranijo 1,7–2,3 ms (manj od senc, izgubimo pa dim na startu). Ostrejši LOD za tekmece daleč za igralcem bi prihranil ~3–4 ms pri 101 avtu, vendar spremeni fiziko tekmecev (manj korakov), zato ni med predlogi.

## Priporočilo

**Predloge 1 + 2 + 3 + 4 izvesti skupaj** (nobeden ne spremeni fizike vožnje; v kodi so to `game.js` `frame`, `ensureTrack` ali začetek luči, `Render.precompile`, `placeNote`).

- 1 odpravi začarani krog (izmerjeno −18 do −23 ms povprečno, −38 do −50 ms p95 pri 101 avtu) in je največji prihranek.
- 2 in 3 odpravita konice v prvih sekundah, ki jih manj tekmecev ne odpravi (prevajanje senčilnikov, GC po nalaganju, prva sličica po zelenem).
- 4 je samo Killarney in proge z znaki ovinkov, ~5 ms na sličico.
- 5 (sence) samo, če po 1–4 še zatika: prihrani 2–3 ms, a vidno vzame sence.

Stalni strošek risanja (22–32 ms pri CPU 4×) ostane; to je tema grafike (#1069 in nadaljnje), ne starta.

## Izvedba (26. 11., veja `zatikanje/start`)

Odločitev uporabnika 26. 11. ob 11.10: DA, s pogojem (korak, sile in vožnja ostanejo enaki).

- **1 izvedeno**: `game.js` `frame`: sam igralec največ 4 koraki na sličico (prej 10), na spletu ostane 64. Korak ostaja 1/120 s; pod 30 sličicami na sekundo gre dirka počasneje od ure (kot prej pod 12).
- **2 izvedeno**: `Render.precompile(true)` v `newRace` po postavitvi avtov: senčilniki avtov in vse slike materialov gredo na grafično kartico pred uvodom, ne v prvih sličicah po zelenem.
- **3**: zvok in HUD se na `main` že zaženeta v `newRace` (pred lučmi, `Sfx.setRunning`). Prva sličica po zelenem: dohitevanje fizike (27–31 ms, s 4 koraki pol manj), `Render.frame` 20–22, prisilna postavitev HUD (`h-map`, ~20 ms), zvok starta 4–5 ms. Preostanek ni vreden tveganja v HUD.
- **4 ni izveden** (`placeNote`, Killarney): ni del te odločitve.


### Meritve ZDAJ/POTEM

`node tools/zatikanje-start.mjs --zanka --proge=spa,pembrey --naprava=telefon,racunalnik --ponovi=2` (ZDAJ: `main`, `GAME_ROOT`; POTEM: ta veja). 22 avtov, prvih 5 s po zelenem po uri, ms na sličico (JS z umetno uro, kot zgoraj). Povprečje in prva sličica: povprečje dveh zagonov; najdaljša: največja od dveh.

| Naprava, proga | povp. ZDAJ → POTEM | prva po zelenem | najdaljša | najdaljša med uvodom in lučmi | čas dirke v 5 s |
|---|---|---|---|---|---|
| telefon (CPU 4×), Spa | 43,3 → 42,0 | 94,9 → 82,8 | 135,4 → 102,5 | 786 → 732 | 4,9 → 3,8 s |
| telefon (CPU 4×), Pembrey | 47,4 → 31,5 | 116,6 → 64,4 | 146,8 → 179,8 | 1370 → 654 | 4,9 → 4,4 s |
| računalnik, Spa | 7,4 → 7,5 | 22,7 → 19,4 | 60,9 → 44,7 | 602 → 586 | 5,0 → 5,0 s |
| računalnik, Pembrey | 7,1 → 6,5 | 17,4 → 19,0 | 32,3 → 25,7 | 707 → 496 | 5,0 → 5,0 s |

- Telefon: prva sličica po zelenem krajša (−12 do −52 ms), največ korakov na sličico 10 → 4. Pembrey povprečje −16 ms (ni več začaranega kroga). Spa povprečje skoraj enako: risanje ostane (22–32 ms).
- Pembrey POTEM 179,8 ms: ena sličica v enem zagonu (drugi zagon 61,2 ms), verjetno GC; GC ostaja (predlog 2 ga samo premakne v nalaganje).
- Čas dirke 3,8–4,4 s v 5 s na telefonu: pod 30 sličicami na sekundo gre dirka počasneje od ure (posledica meje 4, odločitev). Računalnik: brez spremembe, 60 sličic na sekundo.
- Uvod in luči: najdaljša sličica (prva sličica uvoda, prevajanje in nalaganje slik) na Pembreyju 1370 → 654 ms, drugje −16 do −211 ms.
