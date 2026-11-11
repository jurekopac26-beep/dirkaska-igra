# Nove proge 10: slike in oblika za predstavitev

Tabla #382, komentarja 6793287894 in 6785290989. Brez PR, `main` ni spremenjen. Tocancipá je izpuščena (je v #591).

V vsaki mapi: `1-oblika.jpg` (odsek na senčenem reliefu, štart, cilj, sever, merilo, dolžina, vzpon), `2-profil.jpg` (višinski profil), `3-pogled.jpg` (pogled za avtom, teren iz višin; skica, ne grafika igre), `meritve.json`.

## Meritve in pregled 60 m (ena vrstica na progo)

Merila kot `tools/proge-pregled.js` (korak 5 m). Cilji: ceste in makadam 350–550 °/km, 35–55 % ravnin, 0–1 lasnica, 2–6 % vzpona; dirkališča vsaj 3 ovinki/km. »Pregrada ≤ 3 m« je iz OSM (spodnja meja; ograje so v OSM redko vrisane).

| Proga | Mapa | Meritve | 60 m ob cesti | Izletna cona | Ocena |
|---|---|---|---|---|---|
| Hải Vân, Vietnam | `haivan` | 1,99 km, 538 °/km, ravnine 38 %, 12 ovinkov, 2 lasnici, +95 m (4,8 %) | gozd 96 %, 12 stavb, 2 razgledišči, 1 most, strmo pobočje na ~50 % | pregrada 0 % | ustreza (2 lasnici namesto 0–1) |
| Kanaba, Uganda | `kanaba` | 1,98 km, 564 °/km, ravnine 42 %, 12 ovinkov, 1 lasnica, +108 m (5,4 %) | trava 59 %, gozd 15 %, polja, 16 stavb, strmo pobočje nad cesto na 56 % | pregrada 0 % | ustreza (°/km malo nad ciljem) |
| Sogeri, Papua Nova Gvineja | `sogeri` | 1,98 km, 458 °/km, ravnine 50 %, 13 ovinkov, 1 lasnica, +114 m (5,7 %) | trava 79 %, gozd 21 %, skalne stene ob 29 %, 1 most | pregrada 23 % | ustreza |
| Viñales, Kuba | `vinales` | 1,99 km, 302 °/km, ravnine 58 % (najdaljša 470 m), 11 ovinkov, +55 m (2,7 %) | trava, gozd, polja, 15 stavb, 1 razgledišče, 17 stranskih poti | pregrada 1 % | **oblika pod ciljem** (premalo ovinkov in vzpona) |
| Barahona, Dominikanska republika | `barahona` | 1,99 km, 444 °/km, ravnine 51 %, 11 ovinkov, 1 lasnica, +81 m (4,1 %) | gozd 97 %, strmo pobočje nad morjem na 45 %, razgledišče 370 m za ciljem | pregrada 0 % | ustreza |
| Elmenteita, Kenija | `elmenteita` | 1,74 km makadama, 476 °/km, ravnine 41 %, 10 ovinkov, 1 lasnica, +11 m (0,6 %) | trava 82 %, grmovje 15 %, 7 stavb | pregrada 0 % | oblika ustreza, **skoraj ravna** |
| Chachani, Peru | `chachani` | 1,74 km makadama, 481 °/km, ravnine 48 %, 10 ovinkov, 1 lasnica, +86 m (4,9 %), 3473–3559 m | trava 51 %, grmovje 35 %, skale 8 % | pregrada 0 % | ustreza |
| Escuintla, Gvatemala | – | dirkališča 2,41 km v OSM ni (vrisana sta samo ravna steza 0,8 km in kratke zanke) | – | – | **odpade: ni podatkov OSM** |
| Batangas, Filipini | `batangas` | 3,48 km, 565 °/km, ravnine 45 %, 13 ovinkov (3,7 na km), višinska razlika 11 m | trava 50 %, gozd 24 %, 26 stavb (boksi, hale) | pregrada 0 % | ustreza |
| Quezaltepeque, Salvador (zamenjava) | `quezaltepeque` | 3,21 km, 463 °/km, ravnine 51 % (najdaljša 705 m), 13 ovinkov (4,0 na km), višinska razlika 20 m | trava 63 %, gozd 32 %, 19 stavb, 3 razgledišča, ograje posestva | pregrada 0 % | ustreza |

## Izbira odsekov in zamenjave

- **Kanaba**: zadnja 2 km pod sedlom z vzhoda (od jezera Bunyonyi) imata 4 lasnice in 640 °/km, zato je odsek na zahodni strani sedla, 1,2–3,2 km od Kanabe, vožnja navzgor proti sedlu. Vzpon nad jezerom (2,5–4,5 km od Kabale: 476 °/km, 1 lasnica, +99 m) je druga možnost.
- **Sogeri**: zadnja 2 km do odcepa za Varirato imata 2–3 lasnice; odsek je sredi soteske Laloki, konča se 1,7 km pred odcepom.
- **Barahona**: odsek RD-44 južno od razgledišča San Rafael, vožnja proti severu navzgor.
- **Chachani**: makadamska cesta AR-116 nad zaselkom Cabrería, 4,0–5,75 km od začetka makadama (višje ima cesta do 11 lasnic na odsek).
- **Batangas**: dolga postavitev z ozko zanko na zahodu (osnovna zanka meri 2,99 km in ima samo 2,7 ovinka na km).
- **Escuintla → Quezaltepeque, Salvador** (rezerva s seznama): dirkališče je v OSM vrisano v celoti. Salvador še nima proge.
- **Viñales**: glavna cesta proti jugu ima samo 302 °/km in +55 m; sosednji cesti (proti zahodu in severu) sta še bolj ravni. Predlog zamenjave: **Bokor, Kambodža** (rezerva s seznama; še ni izmerjena) ali pa Viñales ostane kot hitra, položna proga.
- **Elmenteita**: teren ob jezeru je raven (+11 m). Če mora imeti vzpon, je treba izmeriti Kedong ali Hell's Gate (še nista izmerjena).

## Viri in licence

- Ceste, stavbe, vode, razgledišča: © avtorji OpenStreetMap, ODbL 1.0 (`api.openstreetmap.org`).
- Višine: Copernicus DEM GLO-30 (© DLR e.V. 2010–2014 in © Airbus Defence and Space GmbH 2014–2018, na voljo po licenci Copernicus; ESA).
- Raba tal: ESA WorldCover 2021 v200, CC BY 4.0.
- Brez Google Maps, Earth in Street View. Brez imen oseb, podjetij in prireditev (dirkališči imata samo ime kraja).

## Predaja

- Narejeno: 9 map (8 s seznama in zamenjava Quezaltepeque), vse potisnjeno. Odprto: odločitev za Viñales in Elmenteito; rezervi Bokor in Ihosy nista izmerjeni.
- Orodje je v `orodje/` (potrebuje `numpy scipy rasterio matplotlib pillow`): odsek se opiše v `proge.json` (`box`, `pts`, `hw`, `trim`, `reverse`, `closed`), `python3 scan.py <id> 2000 250` izpiše meritve drsečih oken za izbiro odseka, `python3 proga.py <id> map profile view` nariše tri slike in `meritve.json` v `out/<id>/`. `python3 osmlib.py <jug> <zahod> <sever> <vzhod> <razredi cest>` izpiše ceste in imenovane točke območja.
- Največji nakloni v profilu so iz 30 m višin in so ob strmih pobočjih pretirani.
