# Koli, Finska: dodelava (odločitev O-28-11)

Lastnik: croatiadata. Dodelava proge `koli` proti ravni Pikes Peaka. Gre za lasten graditelj v `js/world-koli.js`, ki deli samo `World.gore.build`.
Ta datoteka dopolnjuje `docs/proge/koli.md`, ki ga spreminja odprti PR #1085, zato ga tukaj ne urejam.

## Raziskava kraja

| Kaj | V resnici | Vir |
|---|---|---|
| Lega | Narodni park Koli, Severna Karelija, Finska. Zgornji del ceste Ylä-Kolintie vodi iz gozda do vasi Ylä-Koli pod vrhom Ukko-Koli. | OSM (cesta, zgradbe, žičnice, smučišča) |
| Višina | Start 156 m, cilj 306 m. Ukko-Koli ima 347 m (ponekod 354 m) in se dviga 253 m nad jezero Pielinen (~94 m). V modelu igre je vrh na 341 m (DEM je zglajen), okoli 240 m JV od cilja (x 1210, z 770). | Copernicus DEM GLO-30, nationalparks.fi/koli |
| Kamnina | Vrhovi Ukko-Koli, Akka-Koli in Paha-Koli so gola **bela kremenčeva kamnina (kvarcit)** v skladih, nagnjenih plasteh. Na grebenu je tla le tanko pokrita, gozd tam redek in nizek. | nationalparks.fi/koli, Wikipedia »Koli, Finland« |
| Podnebje | Celinsko, sever. Sneg leži približno od novembra do aprila. Na vrhu je **tykky**, debel ovoj snega in ivja na krošnjah smrek, ki jih upogne v bele stebre. | nationalparks.fi/koli |
| Rastje | Borealni gozd (tajga): smreka prevladuje na pobočjih, bor na suhih kamnitih grebenih, vmes breza (pozimi gola, bela debla) in trepetlika. Na pobočjih pod vasjo so smučišča. | ESA WorldCover 2021 (razredi gozd, odprto, smučišče), nationalparks.fi/koli |
| Zgradbe | Ylä-Koli: velika zgradba na vrhu ob cilju, center narodnega parka in lesene hiše v rdeči ali rumeni okri. Ob cesti nižje redke lesene hiše. | OSM (`bld`), splošno o finski leseni gradnji |
| Razgled | Nacionalna pokrajina: razgled z Ukko-Kolija čez Pielinen z otoki proti vzhodu. Razgledišče je v OSM (`vistas`, 1184/649). | OSM, koli.fi »national landscape« |

Imen podjetij, lokalov in oseb ni. Uporabljena so samo zemljepisna imena (Koli, Ylä-Koli, Ukko-Koli, Akka-Koli, Paha-Koli, Pielinen, Ylä-Kolintie).

## Kaj nariše lastni graditelj (`js/world-koli.js`)

- **Kvarcit:** sive skrilaste plošče v nagnjenih plasteh, s snežno kapo, kadar so položne. Na grebenu Ukko-Kolija nad ciljem in na razgledišču so na gosto. Ob zgornji polovici ceste so 9–60 m od asfalta, bliže manjše.
- **Tykky:** visoke smreke pod debelim snegom in ivjem, beli stebri z malo zelenja. Rastejo nad ~270 m (vas, greben, vrh), največ 110, najprej 7–45 m od ceste, da se vidijo iz kamere za avtom. Nižje rastejo navadne zasnežene smreke.
- **Tajga:** smreka in bor 1 : 1, gozd 0,4, drevesa visoka 9–19 m, k temu še tykky.
- **Breze:** gola bela debla s temnimi lisami in gosto temno krošnjo vej, v skupinah ob robu gozda ob spodnjem delu ceste.
- **Vas Ylä-Koli:** stene v finski rdeči in rumeni okri, sive in temne pločevinaste strehe.
- **Tla ob cesti:** `S.extra` kliče `World.ext.goreRob(ctx, 'koli')`. Tako se za Koli prvič vključita že pripravljena paketa `js/world-chase-bt19.js` (bilke, smrečice) in `js/world-chase-bt52.js` (zgrnjen sneg, kamni). Na `main` jih Koli ni klical, ker ni imel `S.extra`. Paketov ne spreminjam.
- **Komentator** (`js/tracks/koli.js`): kraji Ylä-Kolintie, Ukko-Koli, Serpentina 1, Ylä-Koli; uvod in cilj omenjata Severno Karelijo in razgled na Pielinen.

Slike (kamera za avtom, pred / po): `docs/slike/koli/dodelava-{pred,po}-{300,1100,1500,1750}m.webp`.

Mejne vrednosti: fizika vožnje se ne spremeni. Risanje ostane v mejah `tests/golden/perf.json`: telefon 183 klicev in 683 tisoč oglišč (meji 293 in 807 tisoč), `tools/obremenitev.mjs koli` največ 285 klicev in 806 tisoč oglišč. Vse je zlito v kose scenerije in ne dodaja klicev risanja na predmet.

## Drugi krog (O-28-49): kraji ob cesti po OpenStreetMap

Vir: OpenStreetMap (© sodelavci OpenStreetMap, ODbL 1.0; glavni API `api.openstreetmap.org`, stanje 28. 11. 2026). Mreža je pretvorjena v metre igre z izhodiščem uvoza (`tools/proga-uvoz.mjs`). Narisano je samo tisto, kar je na karti do ~60 m od ceste, brez napisov in imen.

- **Jambor:** 60 m visok paličast stolp (`man_made=mast`) 47 m od ceste ob cilju: tri noge, prečke in križi vsakih 5 m, ploščad z nekaj antenami.
- **Vzpenjača** (`railway=funicular`, `layer=1`): nizek jeklen most s tirnicama na stebrih nad serpentino, od spodnjega parkirišča proti hotelu. Do 7 m od ceste je izpuščena, ker karta ne pove, kako vzpenjača prečka cesto.
- **Stopnice** (`highway=steps`, z ograjo): ob vzpenjači 117 stopnic, od cilja proti vrhu 70 in 58, pri hotelu 10. Betonske, pod snegom, z jekleno ograjo.
- **Prehod za pešce** (`crossing:markings=yes`) pri zgornjem parkirišču (d ~1596) in **stojala za kolesa** (12 mest) ob njem.
- **Oporni zid** pri hotelu (`barrier=retaining_wall`).
- **Tabla z zemljevidom smučin** na startu (`information=map`): bleda tabla na dveh lesenih stebrih s strešico, na njej samo barvne črte.
- **Smučine** (`piste:type=nordic`): drsalni pas in klasična sled po tleh, samo 4–60 m od ceste. Drevesa se jim umaknejo.
- **Goli kvarcit** (`natural=bare_rock`, pet poligonov ob zgornji cesti) in **skalne stene** (`natural=cliff`): dodatne skupine plošč znotraj poligonov 8–60 m od ceste (bliže manjše) in vrsta pokončnih plošč ob stenah.
- **Zvok kraja** (`js/sfx-okolje.js`): Koli ima svojo zemljepisno širino in višino, vas Ylä-Koli pa je zaselek brez cerkvenih zvonov (d 1820–2120).
- **Komentator:** dve novi vrstici, o vzpenjači v serpentini in o jamboru pri cilju.

Slike (kamera za avtom, pred / po): `docs/slike/koli/dodelava2-{pred,po}-{1590,1810,1905}m.webp`.

Risanje: `tools/obremenitev.mjs koli` največ 283 klicev in 811 tisoč oglišč; telefon 182 klicev in 687 tisoč oglišč (meji 292 in 799 tisoč).

**Ostane za Fable (senčilniki in svetloba):** lesk ivja in modrikasta senca na tykky; meglica in daljni razgled na Pielinen (zahteva `fogK` v `js/render.js` oziroma temo, ker kamera ne seže dlje od megle); mehkejše sence v gozdu; bilke iz `world-chase-bt19.js` so od zgoraj videti kot »zvezdice«.
