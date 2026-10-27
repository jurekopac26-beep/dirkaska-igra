# Nova fizika: meritve treh referenčnih videov

**Viri**:
- **V1**: 44 min, 13 dirk, vsi trije razredi. Release `novaproga`, `dirkaa.mp4`.
- **V2**: berljivih 5,3 min, ena dirka s formulo. Datoteka je po 317 s prekinjena. Release `dirkalnaigra`, `dirkaaaa.mp4`.
- **V3**: 35 min, 8 dirk, mestni in turni. Release `Dirkaaaa`, `dirkaaaaa.mp4`.

**Način igre**: vsi trije videi so v celoti **single player** (kariera, izmišljeni AI tekmeci, ikona platforme samo ob igralcu). Multiplayer odsekov ni, zato so **vse meritve tekmecev veljavne**, tudi tiste iz V1.

Oznake: p10 / p50 / p90, n je število ovinkov ali dogodkov. Enote so SI, ay in pojemki v g.

## Negotovost (velja za vse spodaj)
- **Hitrost**: ±10 % (V2, V3 odometrija tal, preverjena na talnih oznakah na 1–3 %), ±10–15 % (V1 minimapa). Absolutni metri dodatno ±10 % zaradi širine avta (mestni 1,75 m, turni 1,85 m, formula 1,75 m).
- **ω kamere**: ±5 % (zaprtje kroga), na progi C ±10 %.
- **ay = v·ω**: skupno ±15 %.
- **Pojemek** (največji, povprečen čez 0,5 s): ±20 %.
- **Zasuk avta proti kameri**: ±30 % (predloga) oziroma ±8° (vizualno).

## 1. Igralčev avto po razredih

| Količina | Mestni (V1 + V3) | Turni (V1 + V3) | Formula (V2, zanesljivo) | Formula (V1, zgornja meja) |
|---|---|---|---|---|
| Hitrost v vrhu ovinka | 13 / 18,6 / 25 m/s (n = 133) | 15 / 21,5 / 27 (213) | 16 / 21,7 / 31 (59) | 28 / 35 / 39 (19)* |
| Hitrost vstop → najnižja (p50) | 24,3 → 16,5 | 27,1 → 19,3 | 22,6 → 17,9 | 37 → 27* |
| ω v vrhu ovinka | 36 / 58 / 84 °/s (169) | 34 / 61 / 80 (241) | 36 / 51 / 62 (79) | 37 / 70 / 120 (58) |
| **ay v vrhu ovinka** | **1,28 / 1,86 / 2,54 g** (133) | **1,45 / 2,20 / 2,93 g** (213) | **1,63 / 1,94 / 2,45 g** (59) | 2,25 / 3,65 / 5,1 g (19)* |
| **τ63 gradnje ω** (vstop v ovinek) | 0,22 / **0,83** / 3,6 s (169) | 0,20 / **0,70** / 2,6 s (241) | 0,39 / **0,97** / 6 s (79) | 0,20 / 0,53 / 1,8 s (58) |
| Dvig ω 10→90 % | 0,37 / 1,5 / 4,0 s | 0,33 / 1,4 / 2,9 s | 0,72 / 1,6 / 6,6 s | 0,3 / 0,8 / 2,4 s |
| **Pojemek** (0,5 s) | 0,56 / **1,04** / 1,95 g (129) | 0,74 / **1,19** / 1,85 g (213) | 0,52 / **0,83** / 1,86 g (43) | 1,0 / 2,3 / 3,5 g (17)* |
| Zaviranje: trajanje / razdalja (p50) | 1,6 s / 33 m | 1,6 s / 36 m | 1,5 s / 34 m | — |
| **Zasuk avta proti kameri** | ≈ 0,3°/(°/s), predloga 0,18–0,35, v fazi z ω | **0,25–0,37°/(°/s)**, pri > 50 °/s **21–23°** (n = 1367), zamik < 0,1 s | **≈ 0,85°/(°/s)**, pri > 50 °/s **≈ 45°**, **prehiteva ω za 0,2–0,3 s** | ≈ 0,33°/(°/s) vizualno, v fazi |

\*V1 formula: minimapa je pokrivala le 34 % časa (večinoma hitri deli), faktor ω je bil 1,40. Vrednosti so pristranske navzgor in jih ne uporabljaj.

**Največji ay (p90)**: mestni ≈ 2,5 g, turni ≈ 2,9 g, formula ≈ 2,5 g (V2). Na isti progi je turni ≈ 1,15–1,2× hitrejši od mestnega.

**Gradnja ω**: τ63 je 0,7–1,0 s (p50), najhitrejši vstopi pa 0,2 s. To je večinoma hitrost zavijanja voznika. Zgornja meja odziva vozila je τ ≤ 0,2 s.

### Zasuk avta proti kameri: zakaj 0,37 (V1) proti 0,85 (V2) in kaj kaže V3
1. **V3 potrjuje V1**: turni 0,28 (n = 736 vzorcev nad 50 °/s, p50 21°), mestni ≈ 0,3, vse v fazi z ω. V1 in V3 skupaj dajo 6 meritev v dveh razredih z dvema avtoma in istim rezultatom (0,25–0,37).
2. **V2 je drug avto in drug razred**: formula iz kasnejše sezone (nov, hitrejši model). V1 formula je bila juniorska formula (≈ 0,33, v fazi). Razlika je torej vezana na **ta en avto ali to sejo**, ne na metodo. Obe formuli sem ocenil vizualno na enak način.
3. **Kaj zasuk pravzaprav meri**: pri veriženem trku v V3 (1898 s) se avto zasuče ≈ 90°, kamera pa le 16°. **Kamera sledi smeri gibanja ali proge, ne smeri avta.** Zasuk avta proti kameri je zato pretežno **kot zdrsa** (smer avta proti smeri gibanja), z manjšim deležem zakasnitve kamere.
4. **Posledica**: pri V1 in V3 avto v ustaljenem ovinku drsi za ≈ 0,3° na °/s (20–25° pri 70 °/s), zdrs pa raste skupaj z ω (podkrmarjenje ali nevtralno, arkadno). Pri V2 se zasuk zgradi **pred** ω (pri ω = 6 °/s je že 15°) in zraste do 45–50°. Zadek gre ven prvi, kar je **preveliko krmarjenje ali drsenje**. Temu ustreza tudi nižji ω (51 °/s) pri podobnem ay.
5. **Priporočilo**: za privzeto vožnjo uporabi **≈ 0,3°/(°/s), v fazi**. Vedenje iz V2 je posebnost enega avta, ki jo lahko uporabiš kot »bolj drseč« razred.

## 2. Trava, robniki, boksi

| Količina | Vrednost | Vir, n |
|---|---|---|
| Trajanje izleta | p50 0,45–0,47 s, največ 1,2 s (V1) oziroma 3 s (V3) | V1 17, V2 2, V3 13 |
| **Pojemek na travi** (turni) | p50 **0,40 g** proti 0,27 g v ovinkih brez trave, torej **dodatnih ≈ 0,1–0,15 g** | V3, n = 13 / 373 |
| Nemir (rms ω) | **1,4–1,85×** (5,5 → 9–10 °/s) | V1, V3 |
| Vrnitev na cesto | < 1 s | vsi |
| Robniki | nagib 2–5°, kratek poskok, brez opazne spremembe smeri | V1, V2 |
| Boksi (formula) | krog z boksom +12 s (53,3 proti 41 s), popravilo, gume, gorivo | V2 |

## 3. Trki med avti (70 dogodkov, potrjeno na sličicah, večinoma bok ob bok)

| Količina | Mestni (15) | Turni (40) | Formula (15) | Vsi |
|---|---|---|---|---|
| Skok ω p50 / p90 | 33 / 49 °/s | 30 / 43 °/s | 32 / 62 °/s | **30 / 50 °/s** |
| Sprememba smeri p50 / p90 | 2,5° / 5,8° | 2,2° / 7,8° | 3,7° / 9,5° | **2,4° / 7,8°** |
| Poravnava p10 / p50 / p90 | 0,4 / 1,5 / 2,6 s | 0,2 / 0,8 / 2,0 s | 0,3 / 1,2 / 2,5 s | **0,2 / 1,0 / 2,4 s** |
| Izguba hitrosti p50 / p90 | 1,0 / 5,1 m/s (12) | 2,0 / 5,3 (25) | 1,1 / 5,1 (6) | **1,4 / 5,3 m/s** (43) |
| **Bočna hitrost odboja** | — | — | — | **neto ≈ 1–1,5 m/s, največ ≈ 3,5 m/s** (V3, n = 22, nad šumom 1,5 m/s) |
| Močan trk v skupino | zasuk 30–40°, poravnava 0,5–0,7 s (V1); verižni trk ob ogradi: 90° bočno, ≈ 1,6 s stoji, 3 s do 23 m/s (V3) | | | |

## 4. AI tekmeci (samo single player, to so vsi odseki)

| Količina | Vrednost | Vir, n |
|---|---|---|
| **Razmik v koloni** (zadek do zadka) | p25 / p50 / p75 = **1,1 / 1,33 / 1,75 dolžine avta**, ≈ **0,2 s** (0,15–0,3) | V2 oznake, n = 381 |
| | 1–3 dolžine, 0,2–0,5 s (vizualno); središče–središče ≈ 1,5 dolžine (minimapa, groba) | V1, V3 |
| Najbližji tekmec spredaj | 0,7 / 1,3 / 1,8 dolžine | V2 |
| **Tekmec ob igralcu** | **23–33 % časa** (mestni 33 %, turni 23 %, formula 23 %, V1 25–35 %) | V1 + V2 + V3, ≈ 100 slik + oznake |
| Dva AI vstric | 12 % časa z oznakami | V2 |
| **Prehitevanja AI–AI** (12 avtov) | **7,6–10,8 na minuto, p50 ≈ 9–10/min** (≈ 1 na AI na minuto) | V2 1 dirka, V3 6 dirk |
| Ponovno prehitevanje v 10 s | 0–6 na dirko (≈ 10 % prehitevanj) | V2, V3 |
| **Razvlečenje polja** (vseh 12) | **2–3 s na začetku, +0,5–1 s na krog**; po 4–5 krogih 3–7 s. Dolga dirka s formulo po boksih: 18–21 s (stabilno) | V1 4 dirke, V2, V3 5 dirk |
| Hitrost AI proti igralcu | p50 24,3 proti 24,5 m/s; razlika p10 / p50 / p90 = −2,3 / −0,2 / +1,7 m/s | V2 (61 sledi) |
| Pojemek AI | p50 ≈ 1,0 g (šumno) | V2, n = 38 |
| Gumijasti trak | **ni dokazan**: polje se počasi razvleka in se ne krči, je pa zelo skupaj (izenačene hitrosti). Ali AI čakajo zadnje, iz videov ni mogoče ločiti | |

- **Linija in vedenje** (opazovanje na slikah, ni merjeno): AI vozijo v koloni po idealni liniji, čez robnike, v ovinke 2–3 vstric. Ob igralcu se ne umaknejo in se drgnejo bok ob bok, vrat ne zapirajo namerno. Zavirajo z ognjem iz izpuha.
- **Napake AI**: izleti čez robnik ali na travo oziroma pesek in verižni trki več avtov ob ogradi (V3 1897 s).
- **Česa ni bilo mogoče izmeriti**: kje točno AI prehitevajo (kasnejše zaviranje, notranja linija, zavetrje), ker seznam mest ne pove kraja, pike na minimapi pa se zlijejo.

## 5. Kje se videi ne ujemajo

1. **Zasuk avta proti kameri, formula**: V2 0,85°/(°/s), prehiteva ω. V1 formula ≈ 0,33, V1 in V3 mestni in turni 0,25–0,37, vsi v fazi. Pojasnilo je drug avto (in morda drugačna nastavitev), glej §1.
2. **ay formule**: V1 3,65 g proti V2 1,94 g. V1 je pristranska meritev (34 % pokritost, hitri deli, faktor ω 1,40), V2 je zanesljiva.
3. **Zaviranje formule**: V1 2,3 g (n = 17, pristransko) proti V2 0,83 g (n = 43). Velja V2.
4. **ω v vrhu ovinka, formula**: V1 70 °/s proti V2 51 °/s. Gre za druge proge, ki so v V1 bolj zgoščene (C).
5. **Faktor zaprtja kroga**: proga C ima 1,31–1,45 (V1, V3), ostale 0,90–1,10. Iste proge se ponavljajo, zato gre za lastnost proge in metode (bližnja drevesa v pasu neba), ne za razliko med videi.
6. **Poravnava po trku**: mestni 1,5 s, turni 0,8 s. V1 je bil zanje skupno 1,2 s. Razlika je v okviru razpona (p10–p90 0,2–2,6 s).
7. **Razvlečenje polja**: V1 4–7 s po 4 krogih, V3 3–5 s. V3 ima več kratkih dirk (3 krogi). Vzroka za razliko ni bilo mogoče določiti.
8. **V2 je prekinjen**: od deklariranih 44 min je berljivih le 5,3 min. Formula je zato izmerjena na eni dirki in eni progi.

Metode (seja 27. 10. 2026, analiza v ločenem pomočniku, skripte niso v repozitoriju): ω kamere iz premika točk neba z odštevanjem paralakse, umerjeno na zaprtje kroga (360° na krog), goriščna razdalja 390 px pri širini 960 (vidno polje ≈ 102°); hitrost iz belih talnih oznak (štartna mreža, ciljna črta) v širinah avta W, iz pike na zemljevidu (V1) in iz odometrije ceste ob avtu (V2, V3; preverjeno na ciljni črti 1–3 %); zasuk avta proti kameri iz predlog na lastnem avtu (streha, odbijač) in vizualno; trki iz padca številke poškodb in skoka ω, potrjeni na sličicah; tekmeci iz oznak z imeni nad avti (razdalja), seznama mest (OCR, prehitevanja) in zemljevida. Svet v videih je glede na avte zgoščen (ovinki 10–40 m pri 17–35 m/s), zato primerjaj v g, °/s in dolžinah avta, ne v metrih proge.

## 6. Primerjava z igro (nova fizika, stanje na veji `claude/ecstatic-cannon-x2e2se`)

Merjeno z orodji v `tools/nova/` (opis v `docs/kazalo.md`):

| Količina | Video | Igra, nova fizika | Orodje |
|---|---|---|---|
| Zasuk avta proti kameri za avtom | 0,25–0,37°/(°/s), > 50 °/s p50 21°, v fazi z ω | naklon 0,32, > 50 °/s p50 22°, p95 26° (kamera kot pri klasični, `render.js`: 2,8) | `cam.js` |
| Od tega pravi zdrs | pretežno zdrs (kamera sledi smeri gibanja) | pretežno zamik kamere: zdrs v ovinku 1–8°, poln zasuk na gumbih pri visoki pomoči do ≈ 14° | `tune.js`, `cam.js` |
| ay na meji (cesta) | mestni p90 2,5 g, turni p90 2,9 g | 2,0–2,4 g (cestni), formula / prototip 2,4–3,0 g | `tune.js` |
| Zaviranje | p50 1,0–1,2 g (kratka, 1,6 s) | zavore kot pri klasični (100–0 km/h 23,9 m) | `nova.test.js` |
| Trk: skok ω / sprememba smeri / bočno / izguba hitrosti | 30 °/s / 2,4° / 1–1,5 m/s / 1,4 m/s | 34 °/s / 5° / 1,1 m/s / 1,8 m/s | `pack.js` |
| Razmik v koloni | p50 1,33 dolžine, ≈ 0,2 s | 69 % časa v skupini pod 0,5 s, 57 % pod 15 m | `pack.js` |
| Tekmec ob avtu | 23–33 % | 16 % | `pack.js` |
| Prehitevanja AI–AI | ≈ 9–10 na minuto (12 avtov) | ni izmerjeno | — |
| Razvlečenje polja | 2–3 s na začetku, +0,5–1 s na krog | ni izmerjeno (razpon hitrosti tekmecev po težavnosti: `DIFF` v `core.js`) | — |
| Robniki (tekmeci) | čez robnike na vrhu in izhodu | kolo na robniku 13–20 % časa (klasična < 2 %) | `sweep.js` |

## 7. Stanje in odprte točke

Narejeno (veja `claude/ecstatic-cannon-x2e2se`): zadnja os močnejša (`NVK.balR` 1,08: na meji gre prva sprednja, polni zasuk na gumbih ne zanese več za 25–40°), zavore po obremenitvi osi (`NVK.brkF` + `NVASSIST.bb`), kontrola zdrsa zadnjih koles (`ts`, ne pri speljevanju), pomoč proti zdrsu od presežka nad ustaljenim zdrsom (`att`, `k`), pri nizki pomoči pogonska kolesa v prazno izgubijo bočni oprijem (`sp`), privzeta višina težišča malih vozil, kamera kot pri klasični (odločitev uporabnika), tekmeci na progah z `aiPace` enako hitri pri obeh fizikah, ponovitev dirke brez dviga na robniku. Preverjeno: golden (klasična enaka), `nova.test.js` (22), `browser/nova.test.mjs`, polje in LOD z novo fiziko, vse prave proge in razredi (`sweep.js`, `races-nova.js`: vsi do cilja, brez NaN; 15 od ≈ 210 dirk ima zmagovalca > 3 % od klasične: hitrejši na gorskih cestah z lasnicami, formula in prototip na makadamu 3–7 % počasnejša), čas fizike 100 avtov enak kot pri klasični (`bench.js`).

Odprto (za naslednjo sejo):
1. **Zdrs namesto zamika kamere?** Video kaže, da je 20–25° v ovinku pretežno pravi zdrs (kamera sledi smeri gibanja). Igra da enak kot na sliki z zamikom kamere ob majhnem zdrsu. Če naj bo kot video, mora avto v ustaljenem ovinku drseti ≈ 0,3° na °/s (manjši `balR`, nižji vrh zadnjih gum, drugačen `NVASSIST.att`) in kamera spet hitrejša. To spremeni občutek vožnje: najprej vprašaj uporabnika.
2. **Vlak tekmecev**: v videu tesnejši (≈ 0,2 s, ob avtu 23–33 %, ≈ 10 prehitevanj na minuto med AI) kot v igri. Vzvodi: razpon hitrosti tekmecev (`DIFF`), sledenje (`M.aiGap`, `aiFol`), prostor ob avtu (`NVK.aiSide`), prehitevanje v `aiControl`. Samo pri novi fiziki, da klasična ostane enaka.
3. Bolj drseč razred (formula iz V2: zasuk ≈ 0,85°/(°/s), zadek gre prvi) kot možnost, ne privzeto.
4. Trava: video ≈ +0,1–0,15 g pojemka in 1,4–1,85× nemira; preveri `CSSURF` pri novi fiziki z `tune.js` (plošča `H.surf(2)`).
5. Slick gume na makadamu pri novi fiziki 3–7 % počasnejše kot pri klasični (po želji več oprijema).
6. Pull request: uporabnik ga želi po uglaševanju (predogled na telefonu, GitHub Pages `beta/`).
