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
DOHIT4

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
SPIKES

## Predlogi

| # | Predlog | Prihranek (izmerjeno ali ocena) | Kaj pridobimo | Kaj izgubimo | Fizika vožnje |
|---|---|---|---|---|---|
| 1 | **Manj korakov lovljenja na sličico** (sam igralec: meja 10 → 4; na spletu ostane 64) | REZ1 | Ni več začaranega kroga: počasna sličica ne pomeni še počasnejše naslednje | Na zelo počasni napravi gre dirka malo počasneje od ure (igra to že dela pri meji 10, le bolj) | **Ne**: isti korak 1/120 s, isti model; časi krogov se merijo v času dirke |
| 2 | **Ogrevanje pred zelenim**: `Render.precompile()` še enkrat po postavitvi avtov (zdaj samo ob nalaganju proge, pred avti), med lučmi en skrit izris dimov, isker in dežja; čiščenje smeti (GC) med nalaganjem, ne po zelenem | REZ2 | Brez konic 70–140 ms v prvih sekundah (prva sličica, GC, prvo prevajanje) | Luči trajajo enako; nalaganje proge lahko traja ~0,1 s dlje | Ne |
| 3 | **Prva sličica po zelenem razbremenjena**: zvoki starta in elementi HUD pripravljeni med lučmi | ~40 ms v prvi sličici (zvok 28 + HUD 20 → ~3 + ~2) | Brez sunka točno ob zelenem, ko so vsi avti skupaj | Nič opaznega | Ne |
| 4 | **HUD brez prisilne postavitve**: `placeNote` naj ključ preveri brez branja `offsetWidth` vsako sličico (samo ob spremembi razreda HUD ali zaslona) | ~5 ms na sličico na Killarneyju (HUD 7,5 → ~2,5), konice HUD do 24 ms | Killarney in proge z znaki ovinkov tečejo enako gladko kot Spa | Nič | Ne |
| 5 | **Sence na startu ugasnjene na počasni napravi** (samodejno, ko je sličica več kot 25 ms) | 2,3–3,4 ms, 36–53 klicev risanja manj | Manj dela pri risanju, kar je največji stalni strošek | Prve sekunde brez senc avtov na počasnih napravah | Ne |

Drugo: delci brez dima prihranijo 1,7–2,3 ms (manj od senc, izgubimo pa dim na startu). Ostrejši LOD za tekmece daleč za igralcem bi prihranil ~3–4 ms pri 101 avtu, vendar spremeni fiziko tekmecev (manj korakov), zato ni med predlogi.

## Priporočilo

PRIPOROCILO
