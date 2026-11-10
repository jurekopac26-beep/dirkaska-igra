# Hiše tik ob cesti: prototip in slike »zdaj in potem« (paket S · Stavbe)

Prototip samo za slike. Celotna izvedba (S0–S2 v `docs/realizem.md`) pride po izbiri uporabnika; na `main` ne gre nič pred njo.

## Odločitve uporabnika
- 10. 11. 2026 ob ~01.37: »Predogled že ta teden« (tabla #382, komentar 6755466985).
- 10. 11. 2026 ob ~01.50: »Izdelava slik naj bo prioriteta«. Slike imajo prednost pred drugim delom računa partyslo.
- 10. 11. 2026 med ~02.00 in ~03.00, po slikah A1–A3 (v seji teme): »Hise naj bodo cimbolj podobnr pravim v 3d obliki«, »Ok delaj samo za progo livorno«, »Popravi ograjo. Zamenajj za klasicno zelezno«, »Naredi se plocnike tam kjer so«, »Hise naj imajo tudi poti/ceste ki vodiji med njimi in do njih«, »Izboljsaj grafiko his in okolice na vseh izbranih progah«, »Prikazi se razliko his na drugih progah v slikah. Prej in potem. Naj bo to prioriteta 6 slik«. Branje: prave oblike tlorisov, pločniki in poti najprej na Livornu; izboljšava hiš in okolice potem na vseh pravih progah (brez testnih in prog na odločanju); železna ograja namesto žive meje povsod.
- 10. 11. 2026 ob ~03.30, v pogovoru z Matejem (tabla #382, komentar 6757283997; vprašanje `hise-ob-cesti-1`): izbral je **A3** (okna, balkoni, napušči in podrobnosti tik ob cesti). Izvedba (paket S) gre na `main` za paketom E, ko je prostor (tedenski načrt).

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

## Livorno: prave oblike hiš, ulice, pločniki (10. 11. 2026)
Po prošnjah uporabnika (zgoraj) samo na **Livornu**, vklop z `index.html?proga=livorno&hise=3`; brez `?hise` je svet enak referenci.

- **Prave oblike hiš.** Tloris iz OpenStreetMap (`bldOutline` v `tools/livorno/livorno.json`) se razreže na pravokotna **krila** (največ 5; 142 hiš ima 2–5 kril, mediana pokritosti tlorisa 94 %): hiše v obliki L, T in U, prizidki. Krilo teče s streho v svojo hišo, ožji prizidek je nadstropje nižji. **Hiše v vrsti** (810 od 1.469 stavb ima steno ob sosedu): sleme teče proti sosedu, na skupni steni ni napušča ne oken (gladek omet), streha se ne konča s čopom. Če sosednje stavbe svet ne zgradi (stoji v pasu ceste), stena spet dobi okna.
- **Oblike streh in nadstropja iz OSM**, kjer so vpisani (`roof:shape` pri 232 stavbah: 126 dvokapnic, 67 štirikapnic, 24 ravnih, 15 piramidnih; `building:levels` pri 20); drugje po velikosti in vrsti stavbe kot prej.
- **Ulice in poti med hišami** iz OSM (527 črt, 26,0 km, do 72 m od proge): asfalt, tlak in pesek, trak po terenu, širše asfaltne ulice s svetlim robom; ob progi se končajo pri njeni ograji (zaprte za dirko). Hiša se obrne proti najbližji ulici, pot od vhoda gre do vrat na dvorišču in naprej do ulice ali ceste. Drevesa ne stojijo na ulicah.
- **Pločniki, kjer so.** OSM pozna ob 19,1 km dolgi progi 3,7 km pločnikov (levo 2.721 m, desno 1.006 m: štart, Ardenza, Romito, Miramare, nabrežje v Antignanu): robnik in tlak med robom asfalta in ograjo, širok do 2,3 m (kjer je med asfaltom in ograjo vsaj 1,5 m). Možnost `&plocniki=2` doda pločnik še v pozidanih ulicah, kjer ga OSM ne pozna (ugibanje: vsaj dve hiši v 40 m na tisti strani; skupaj 3.661 m in 1.901 m). Pločnik je **samo videz**: tla pod njim ostanejo bankina, vožnja in tekmeci so enaki.
- **Ograje.** Ograje iz OSM (`barrier=fence`) so železne; žive meje iz OSM dobijo pred sabo železno ograjo na nizkem zidcu; dvorišče se konča pri ulici, sosedu ali zidu in živi meji z zemljevida (tam ne dobi še svoje ograje).
- **Bazeni** iz OSM (26, do 62 m od proge).
- **Podatki:** `python3 -I tools/livorno/hise.py [mapa s ploščicami OSM]` → `tools/livorno/hise.json` (54 KB) → `tools/livorno/build.py world` → `LV_DATA.hise` v `js/data/livorno.js` (194 → 249 KB). Brez mape se del iz OSM (strehe, nadstropja, pločniki, bazeni) ohrani iz obstoječe datoteke. Ploščice so z glavnega API-ja OSM (`api.openstreetmap.org/api/0.6/map?bbox=…`, 18 ploščic ob progi) in niso v repozitoriju.
- **Slike** (kamera za avtom, dan, suho): `docs/slike-zdaj-potem/hise-livorno-{antignano,antignano-2,ardenza,obala}-{prej,potem}.jpg` (17,26 km, 16,98 km, 0,90 km in 18,30 km od štarta), zloženki `hise-livorno-{prej,potem}-vse.jpg`, možnost s pločniki v pozidanih ulicah `hise-livorno-plocniki-2.jpg`.
- **Usklajevanje:** robniki, obraba asfalta, črte in stranske ceste iz OSM so tudi paket E (seja E0 računa jure.kopac26, #622). Teksture ceste in `edgeLinePaint` ta prototip ne spreminja; prava izvedba pločnikov in ulic se uskladi s paketom E (kdo riše robnik in priključke ulic).

| Livorno | Šest vzorcev testa: klici (največ) | oglišča (največ) | 17,26 km | 16,98 km | 0,90 km | 18,30 km | 0,40 km | 15,70 km |
|---|---|---|---|---|---|---|---|---|
| zdaj | 144 (174) | 298 tisoč (383) | 85 klicev, 206 tisoč | 98, 227 | 95, 203 | 85, 185 | 92, 211 | 87, 193 |
| potem (`?hise=3`: oblike, ulice, pločniki, ograje) | 153 (187) | 323 tisoč (395) | 98, 255 | 115, 273 | 105, 235 | 95, 222 | 101, 238 | 96, 235 |

Hiš na progi je 1.117 (z 239 krili), tik ob cesti 288; ulice so 7.451 štirikotnikov, pločniki 1.786 kosov. Vse je daleč pod mejama (~300 klicev, ~900 tisoč oglišč).

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
- **Druge prave proge s hišami** (prošnja uporabnika »Izboljsaj grafiko his in okolice na vseh izbranih progah«): priklop kot na Spaju (en klic `setup`), slog po pokrajini; prave oblike, ulice in pločniki potrebujejo podatke proge kot `LV_DATA.hise` (orodje `tools/livorno/hise.py` je napisano za Livorno; za druge proge ga je treba posplošiti ob `tools/proga-podatki.py`). Kamnite stene (Ardeni) in slama (Cape) še nimajo svojega pasu v teksturi.
- Livorno: vrtovi in trate iz OSM (`leisure=garden`, `landuse=grass`), parkirišča, enokapne strehe prizidkov; pločnik je samo videz (brez robnika v fiziki).
- Atlas fasad po regijah (S0) in druge proge (S1, S2); noč (okna svetijo), zima (sneg na strehah), dež.
- Test, referenci `tests/golden/perf.json` in `tests/golden/world.json`, angleški opisi niso potrebni (ni besedila v igri).
