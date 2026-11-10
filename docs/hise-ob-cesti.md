# Hiše tik ob cesti: prototip in slike »zdaj in potem« (paket S · Stavbe)

Prototip samo za slike. Celotna izvedba (S0–S2 v `docs/realizem.md`) pride po izbiri uporabnika; na `main` ne gre nič pred njo.

## Odločitve uporabnika
- 10. 11. 2026 ob ~01.37: »Predogled že ta teden« (tabla #382, komentar 6755466985).
- 10. 11. 2026 ob ~01.50: »Izdelava slik naj bo prioriteta«. Slike imajo prednost pred drugim delom računa partyslo.
- 10. 11. 2026 med ~02.00 in ~03.00, po slikah A1–A3 (v seji teme): »Hise naj bodo cimbolj podobnr pravim v 3d obliki«, »Ok delaj samo za progo livorno«, »Popravi ograjo. Zamenajj za klasicno zelezno«, »Naredi se plocnike tam kjer so«, »Hise naj imajo tudi poti/ceste ki vodiji med njimi in do njih«, »Izboljsaj grafiko his in okolice na vseh izbranih progah«, »Prikazi se razliko his na drugih progah v slikah. Prej in potem. Naj bo to prioriteta 6 slik«. Branje: prave oblike tlorisov, pločniki in poti najprej na Livornu; izboljšava hiš in okolice potem na vseh pravih progah (brez testnih in prog na odločanju); železna ograja namesto žive meje povsod.

## Kaj je narejeno
- Proga: **Livorno, Italija** (prava proga), ulice Antignana, 17,26 km in 16,88 km od štarta. Kamera za avtom, dan, suho.
- Graditelj `js/world-hise.js` (`World.api.hise`), vklop samo z `index.html?proga=livorno&hise=1|2|3`. Brez parametra je igra enaka kot na `main` (ista drevesa, isti naključni tok).
- Ravni:
  - **A1** oblike in strehe: štirikapnice in dvokapnice s strešniki (tekstura), slemena in grebeni, dimniki; stene kot danes.
  - **A2** še okna po nadstropjih, vrata, polkna, balkoni na steni proti cesti, napušči.
  - **A3** še podrobnosti tik ob cesti: dvorišče z zidom ali živo mejo in vrati, grmi, parkiran avto, tende, sončne celice.
- Slike: `docs/slike-zdaj-potem/hise-antignano-{zdaj,A1,A2,A3}.jpg`, vse štiri skupaj `hise-antignano-vse.jpg`, druga točka `hise-antignano-2-{zdaj,A3}.jpg`. Pred združitvijo na `main` se mapa izbriše.

## Druge proge: slike »prej in potem« (10. 11. 2026)
- Isti graditelj na treh pravih progah, vklop z istim `?hise=3`: **Spa, Belgija** (4,96 km; slog `north`: skril, strme dvokapnice, okna brez polken), **Nürburg, Nemčija** (8,085 km; `north`) in **Chapman's Peak, Južna Afrika** (12 m od štarta; slog `cape`: bela okna, lesena polkna, hiša na podstavku na pobočju). Slike: `docs/slike-zdaj-potem/hise-{spa,nring,chapman}-{prej,potem}.jpg` (zloženke za stran Odločitve: `hise-druge-{prej,potem}.jpg`, `hise-spa-par.jpg`); vprašanje `hise-druge-proge-1` na strani Odločitve partyslo.
- Novo v graditelju po prošnjah uporabnika: **klasična železna ograja** (nizek zidec, kovane palice s konicami, stebri, železna vrata pred vhodom) namesto žive meje in zidu; dvorišče se ne prekriva več s sosedi (vsaka stran hiše dobi toliko roba, kolikor ga pustijo cesta in sosednje hiše; `plots`), na pobočju se ograja spušča v stopnicah; **pot** od vhoda do vrat in na cestah (ne na dirkališčih) naprej do roba ceste; podstrešno okno v zatrepu.
- Priklop na progo je en klic (`World.api.hise.setup`): `js/world-spa.js`, `js/world-nring.js`, `js/world-chapman.js`, `js/world-livorno.js`. Brez `?hise` so svetovi enaki referenci (`PROGE=spa,nring,chapman,livorno node tests/browser/world.test.mjs`: 12/12).

| Proga | Šest vzorcev: klici (največ) zdaj → potem | oglišča (največ) zdaj → potem | Na mestu slike zdaj → potem |
|---|---|---|---|
| Spa | 179 (222) → 181 (224) | 433 tisoč (573) → 435 (573) | 109 klicev, 243 tisoč → 113, 256 |
| Nürburg | 157 (176) → 158 (180) | 271 tisoč (292) → 272 (292) | 168, 244 → 178, 255 |
| Chapman's Peak | 138 (146) → 138 (145) | 403 tisoč (468) → 404 (467) | 117, 299 → 119, 298 |

Tekmeci so pri obeh meritvah na istih mestih (vožnja in AI nespremenjena).

## Obremenitev telefona
Merjeno kot `tests/browser/perf.test.mjs` (844 × 390, običajna kakovost, podrobnosti NIZKA, sence, kamera za avtom). Meji sta ~300 klicev risanja in ~900 tisoč oglišč.

| Raven | Šest vzorcev testa: klici (največ) | oglišča (največ) | Antignano 17,26 km | Antignano 16,88 km | Antignano 17,08 km | Ardenza 0,65 km |
|---|---|---|---|---|---|---|
| zdaj | 144 (174) | 298 tisoč (383) | 85 klicev, 206 tisoč | 93, 231 | 98, 232 | 96, 233 |
| A1 | 145 (175) | 299 tisoč (383) | 92, 210 | 97, 234 | 104, 237 | 95, 238 |
| A2 | 145 (175) | 301 tisoč (383) | 92, 216 | 97, 238 | 104, 242 | 95, 246 |
| A3 | 145 (175) | 302 tisoč (384) | 92, 233 | 97, 257 | 104, 261 | 95, 248 |

Na najbolj pozidanih mestih proge je to največ +7 klicev risanja in +29 tisoč oglišč (A3). Vseh hiš na progi je 1.127, tik ob cesti (do 22 m od sredine) 288.

## Kako deluje
- Ena tekstura (1024 × 1024, narisana v kodi) in en material za vse hiše proge; barva stene in strehe je barva oglišč.
- Vsak pas teksture (nadstropje z okni, pritličje z vrati, blok, strešniki, ograja) teče čez vso širino in se ponavlja, zato je stena poljubne dolžine en štirikotnik. Hiša z okni ima zato približno toliko oglišč kot današnja škatla s pasom.
- Podrobnosti po razdalji od ceste: balkoni, napušči in grebeni do 42 m, dvorišča do 22 m.
- Viri: tlorisi hiš iz OpenStreetMap, ki so že v podatkih proge (ODbL). Tekstura je risana, brez fotografij, imen, napisov in logotipov. Nič iz Google Maps, Google Earth ali Street View.

## Kaj manjka do prave izvedbe
- Prave oblike tlorisov (`bldOutline` v `tools/livorno/livorno.json`) in oblike streh iz OSM (`roof:shape`, `building:levels`); prototip uporablja pravokotnike kot danes. V gostih ulicah (Antignano) se pravokotniki prekrivajo, zato tam dvorišča in ograje večinoma odpadejo: s pravimi tlorisi in črtami ograj iz OSM (`barrier=fence|wall`) pridejo nazaj.
- Livorno po prošnjah uporabnika: pločniki, kjer so (OSM `sidewalk`, `footway`), poti in stranske ceste med hišami in do njih (OSM `service`, `residential`, `footway` do ~60 m; vzor `js/world-medvode.js`: pločniki, zaprte stranske ceste `T.stubs`), ograje OSM (`LD.walls`, vrsta 3) kot železne.
- Druge prave proge s hišami: priklop kot na Spaju (en klic `setup`), slog po pokrajini; kamnite stene (Ardeni) in slama (Cape) še nimajo svojega pasu v teksturi.
- Atlas fasad po regijah (S0) in druge proge (S1, S2); noč (okna svetijo), zima (sneg na strehah), dež.
- Test, referenci `tests/golden/perf.json` in `tests/golden/world.json`, angleški opisi niso potrebni (ni besedila v igri).
