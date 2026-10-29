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

## 6. Primerjava z igro (nova fizika, stanje 27. 10. 2026, po uglaševanju)

Merjeno z orodji v `tools/nova/` (opis v `docs/kazalo.md`). Proge za `cam.js`: Bathurst, Spa, Suzuka, Monaco, Red Bull Ring, Detroit (igralec na avtopilotu, pomoč visoka); za `train.js` in `pack.js` še Montreal in Townsville.

| Količina | Video | Igra, nova fizika | Klasična | Orodje |
|---|---|---|---|---|
| Zasuk avta proti kameri za avtom | 0,25–0,37°/(°/s), > 50 °/s p50 21°, v fazi z ω | naklon 0,27–0,33, > 50 °/s p50 20,6–23,1°, p95 28–29,5° (mestni, turni, formula, prototip, tovornjak, muscle, mali) | 0,64, p50 42° | `cam.js` |
| Od tega pravi zdrs | pretežno zdrs, zamik kamere < 0,1 s | zdrs > 50 °/s p50 16–18,6° (72–80 % zasuka), v fazi (0,3 s v zavoj že 70 % ustaljenega); kamera 0,08 s za smerjo vožnje | zdrs p50 24,5° | `cam.js`, `nova.test.js` |
| Ustaljen zdrs na °/s | ≈ 0,3 s | 0,31–0,38 s (plošča, 70–140 km/h) | 0,35–0,6 s | `nova.test.js` |
| Drseči slog (izbira) | V2 formula: 0,85°/(°/s), ≈ 45°, prehiteva ω | formula: naklon 0,77, > 50 °/s p50 51°, zdrs p50 46°; 0,25 s v zavoj 24° (običajni 6°) | — | `cam.js SL=1`, `nova.test.js` |
| Polni zasuk na gumbih (visoka pomoč) | — | 21–26° (60–160 km/h, vsi razredi), brez vrtenja; nizka pomoč 110 km/h do 23° | | `tune.js` |
| ay na meji (cesta) | mestni p90 2,5 g, turni p90 2,9 g | 2,0–2,4 g (cestni), formula / prototip 2,4–3,0 g (nespremenjeno) | | `tune.js` |
| Zaviranje | p50 1,0–1,2 g (kratka, 1,6 s) | kot pri klasični (100–0 km/h 23,9 m) | | `nova.test.js` |
| Trava: pojemek | +0,1–0,15 g (turni) | dve kolesi +0,10–0,14 g (tovornjak +0,05), štiri +0,20–0,28 g | +0,20–0,25 / +0,37–0,47 g | `nova.test.js` |
| Trava: nemir (rms ω) | 1,4–1,85× | dve kolesi +2,2–4,3 °/s ob osnovi 2,9 °/s v dirki: 1,25–1,8×; štiri 1,7–3,2× | brez | `nova.test.js` |
| Slick gume na makadamu | — | formula in prototip na makadamskih etapah −1,4 … +1,8 % od klasične (prej 3–7 % počasneje) | | `races-nova.js` |
| Trk: skok ω / sprememba smeri / bočno / izguba hitrosti | 30 °/s / 2,4° / 1–1,5 m/s / 1,4 m/s | 35 °/s / smer vožnje 3,7° (telo 7,6°) / 1,2 m/s / 1,5 m/s | 70 °/s / 3,8° / 1,4 / 1,2 | `pack.js` |
| Razmik v koloni | p50 1,33 dolžine, ≈ 0,2 s | p25 / p50 / p75 2,3 / 3,3 / 5,3 dolžine, 0,25 / 0,36 / 0,55 s | 3,0 / 4,7 / 6,9 dolžine, 0,49 s | `train.js` |
| Tekmec ob igralcu | 23–33 % | 18 % (igralec v skupini) | 10 % | `train.js` |
| Prehitevanja AI–AI (12 avtov) | 7,6–10,8 na minuto, ≈ 0,8 na AI | 8,9 na minuto, 0,74 na AI (ponovno v 10 s 36 %) | 6,4–7,5 | `train.js` |
| Razvlečenje polja | 2–3 s na začetku, +0,5–1 s na krog (1,1–2,2 % kroga) | 3,5 s po 1. krogu, +1,16 % kroga na krog | +2,1 % | `train.js` |
| Robniki (tekmeci) | čez robnike na vrhu in izhodu | kolo na robniku 12 % časa (klasična < 1 %) | | `nova.test.js`, `sweep.js` |
| Dirke na vseh pravih progah | — | 210 dirk (suho, dež, formula, prototip, novejši avti): vse do cilja, brez NaN in vrtenj; zmagovalec > 3 % od klasične 7 (prej 15), mediana odstopanja 0,74 % | | `races-nova.js` |

Opombe k merjenju:
- `train.js` postavi igralca na avtopilotu na hitrost sredine polja (kot igralec na posnetku, ki vozi v skupini); prehitevanje šteje, ko par zamenja vrstni red za vsaj 1 s (`HOLD=2`: za 2 s; tako je prehitevanj okoli 15 % manj in manj vrnjenih). Na posnetku so razmiki merjeni ob igralcu na zaslonu (v počasnejših delih), zato so v dolžinah krajši; v sekundah je igra blizu (0,36 proti ≈ 0,2–0,3 s).
- Proge v igri so v resnični velikosti (krog 75–150 s), na posnetku zgoščene (41–53 s), zato je razvlečenje primerjano v % kroga.
- Zasuk pri nizki pomoči z avtopilotom (`cam.js AS=0`) ni primerljiv: avtopilot ni narejen za nizko pomoč (niha tudi brez zdrsa telesa).

## 7. Stanje in odprte točke

Prej narejeno (seja z meritvami): zadnja os močnejša (`NVK.balR` 1,08), zavore po obremenitvi osi (`NVK.brkF` + `NVASSIST.bb`), kontrola zdrsa zadnjih koles (`ts`, ne pri speljevanju), pomoč proti zdrsu od presežka nad ustaljenim (`att`, `k`), pri nizki pomoči pogonska kolesa v prazno izgubijo bočni oprijem (`sp`), privzeta višina težišča malih vozil, tekmeci na progah z `aiPace` enako hitri pri obeh fizikah, ponovitev dirke brez dviga na robniku.

Narejeno 27. 10. 2026 (odločitve uporabnika v tej seji: točka 1 »pravi zdrs + hitrejša kamera«, točka 2 »vlak po meritvah videa«, točka 3 »drseči slog kot izbira«):
1. **Pravi zdrs v ovinku** (`NVK.attT` 0,3 s, `attLag` 0,05 s, `attMax` 0,45 rad; `Car.nvA`): telo avta se zasuka z nosom v zavoj za 0,3 s × hitrost zavijanja poti, v fazi z njo; sile gum se računajo v okviru, zasukanem nazaj za ta kot, zato so oprijem, volan, pomoč, hitrosti v ovinkih in tekmeci enaki kot prej. Pri parkiranju, vzvratni vožnji in vrtenju ga ni, v zraku ostane, ob postavitvi na cesto (`place`) se izbriše. Najprej preizkušen pristop z mehkejšimi zadnjimi gumami (vrh zdrsa po hitrosti) je dal pravi zdrs, a pot ovinka se je gradila 2× počasneje, avto je stal na protizavijanju in pri nizki pomoči zanesel do 55°: opuščen.
2. **Kamera za avtom pri novi fiziki** (`render.js`): sledi smeri vožnje (`h + beta`) s 12/s (zamik 0,08 s), vrti se največ 2,5 rad/s; klasična kot prej (`0,85 · beta`, 2,8/s).
3. **Trava** (`NVK.grassD` 0,55, `grB` 0,6, `grH` 0,03 m, `grK` 0,35): upor trave 55 % klasičnega, neravnine (stalno polje, ≈ 9 m narazen) sunejo kolo vstran in ga dvignejo (telo poskakuje).
4. **Slick gume na makadamu** (`NVK.slick` 0,7): bočni oprijem slick gum na rahli podlagi izgubi le 70 % tega, kar pri klasični (vleka ostane enaka).
5. **Tekmeci** (samo nova; `NVK.aiSpr` 0,6, `aiPush` 0,02, `aiFolM` 1,5 m): razpon hitrosti po težavnosti 60 % klasičnega (najhitrejši enak), za avtom pred seboj 2 % hitreje, sledenje 1,5 m za odbijačem.
6. **Drseči slog** (Nastavitve → Slog nove fizike: Običajen / Drseč; samo igralčev avto, `Car.nvSl`, `NVK.slide`): zasuk 0,8 s × zavijanje, ki ga zahteva volan (prehiteva pot, do 43°), zadnja os enako močna kot sprednja.
7. Orodja: `train.js` (nov), `cam.js` (koliko zasuka je zdrs, `SL`, kamera kot v igri), `pack.js` (smer vožnje ob trku), `tune.js` (`SL`).

Preverjeno: golden (336, klasična bit za bitom enaka), `nova.test.js` (28: zdrs v fazi in po °/s, drseči slog, trava, slick gume, razpon tekmecev, polni zasuk 15–32°), `browser/nova.test.mjs` (11: vrstica Slog nove fizike v slovenščini in angleščini, drseči slog samo na igralčevem avtu), `races-nova.js` na vseh 42 pravih progah (210 dirk: vse do cilja, brez NaN, 0 vrtenj; zunaj ±3 % od klasične 7, prej 15), `sweep.js` po razredih (formula, prototip, tovornjak, muscle, PICO, MIŠKA; 300 s na vsaki progi: zdrsov nad 40° nič, krogi 0,98–1,0 klasične, dotiki med avti pri formuli in prototipu ≈ klasična (prej 30 % manj), pri ostalih 47–62 % klasične), `tune.js` (visoka, srednja, nizka pomoč, brez vrtenja razen MRAVLJE pri nizki pomoči in zaviranju v ovinku, kot prej), čas fizike 100 avtov enak (`bench.js`).

Odprto:
1. **Vlak v dolžinah**: razmik p50 3,3 dolžine (video 1,33), tekmec ob igralcu 18 % (video 23–33 %). V sekundah je igra blizu (0,36 s). Ožje bi pomenilo več dotikov (pri `aiFolM` 0 je dotikov formul 2,2× klasičnih).
2. **Hitrejši na gorskih cestah**: Sani, Vršič (−4 %), Crystal Palace z novejšimi avti (−4 %), Harju z novejšimi avti in Tianmen v dežju (−3 %) so z novo fiziko hitrejši od klasične (bilo že prej).
3. **Formula na strmem makadamu** (Moki, Harju): po trku z bližnjim avtom včasih obstane na robu ≈ 8 s (vrtenje koles v prazno v klancu), nato reševanje; 0–2 na dirko, tudi pred to sejo.
4. **Nizka pomoč z avtopilotom** (`cam.js AS=0`) niha; igralec z nizko pomočjo na plošči je v redu (polni zasuk 21–26°), preveri na telefonu.
5. Prednja kolesa so na sliki zasukana glede na telo (ne protizavijajo v zdrsu); po želji bi lahko kazala smer gum.

## 8. Tekmeci in trki ločeno od fizike (28. 10. 2026)

Po preizkusu uporabnik ostaja pri klasični fiziki. Nastavitve tekmecev in trkov so zato neodvisne od fizike (Nastavitve: kategorija »Preizkus: tekmeci in trki«, opis v `docs/igra.md`, razdelek »Preizkus: tekmeci in trki«; `Core.setTest`, `TX`). Privzeto je vse kot prej. Meritve so z `tools/nova/train.js` (8 prog × 4 krogi, 12 tekmecev, igralec na avtopilotu v skupini), `pack.js` (8 prog × 150 s) in `sweep.js` (12 prog × 400 s, mešano polje).

**Tekmeci.** Kolono oblikujejo nastavitve tekmecev, ne fizika: klasična fizika z nastavitvami nove da skoraj enako kolono kot nova.

| | Klasična | Klasična + nastavitve nove | Nova | Video |
|---|---|---|---|---|
| Razmik v koloni (mediana) | 4,6 dolžine, 0,49 s | 3,3 dolžine, 0,35 s | 3,3 dolžine, 0,36 s | 1,33 dolžine, ≈ 0,2 s |
| Tekmec ob igralcu | 11 % | 19 % | 17 % | 23–33 % |
| Prehitevanja med tekmeci na minuto | 7,3 | 8,9 | 7,8 | 7,6–10,8 |
| Razvlečenje polja na krog | 2,4 % kroga | 0,7 % | 0,9 % | 1,1–2,2 % |
| Močni stiki (> 3 m/s), 12 prog × 400 s | 74 | 261 | 103 | — |
| Zasuki čez 40° | 2 | 2 | 0 | — |
| Čas s kolesom na robniku | 1 % | 14 % | 15 % | — |

Tesnejša kolona poveča število stikov (klasična + nastavitve nove: 3,5-krat več močnih stikov kot klasična), zato je razmik za avtom nastavljiv.

**Trki** (kontroliran trk na ravnini, reli avto BURJA R7, hitrosti po stiku; Težak = odboj 0, drgnjenje 0,8, vrtenje 1,3):

| Trk | Klasična | Klasična, Težak | Nova |
|---|---|---|---|
| Naletni, 72 → 36 km/h | A 52, B 56 km/h | A 54, B 54 | A 47, B 61 |
| 100 km/h v stoječ avto, sredina | A 45, B 55 | A 50, B 50 | A 30, B 70 |
| 100 km/h v stoječ avto, zamik 0,9 m | A 72, B 38; smer A −13°, B +3° | A 56, B 44; smer A −16°, B −17° | A 63, B 44; smer A −18°, B −4° |
| Bok ob boku 100 km/h, B zavije vanj za 15° | A 96, B 103; smer A −17°, B +8° | A 101, B 98; smer A −19°, B +8° | A 98, B 101; smer A −10°, B +5° |

V dirki (8 prog × 150 s, z igralcem): klasična skok vrtenja 73 °/s in sprememba smeri 12,9° v 0,5 s (video 30 °/s in 2,4°), nova 35 °/s in 6,3°. Odboj ob lahkih stikih je pri obeh enak (bočno 1,1–1,2 m/s, video 1–1,5 m/s); razlika je v vrtenju, ker klasična trk pretvori v sunek smeri (`csKc`, največ 0,4 rad) in ga ni mogoče omejiti drugače kot z `tapT` (1,5 → 0,45: skok vrtenja 63 → 44 °/s, smer 13° → 9,6°; meritve so hrupne). Zato ima vrstica »Vrtenje ob trku« pri klasični stopnje 0, 0,15, 0,4 in 1,6 (pri 1,6 se poveča tudi omejitev sunka).
