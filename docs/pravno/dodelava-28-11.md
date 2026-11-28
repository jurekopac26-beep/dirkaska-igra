# Pravni pregled PR-jev dodelava (28. 11. 2026)

Odločitev O-28-43, tema 1. Pregledanih 61 vej `dodelava/*` (#1195–#1260): imena zanimivosti, vrstice komentatorja, opisi (sl, en), dokumenti prog in `README.md` »Zasluge«.

**Kako je popravljeno.** Besedila so samo na vejah dodelava, v tuje veje se ne potiska. Zato so tu točne zamenjave (najdi → zamenjaj); izvede jih lastnik PR ali Združevanje pred združitvijo. Na `main` ni bilo treba spremeniti ničesar, razen besede »olimpijski« pri Montréalu, ki je del #1230 (zamenjava spodaj velja tudi za `main`).

## Brez ugotovitev

Imena oseb, podjetja, lokali, sponzorji, prireditve, znamke in logotipi v vrsticah komentatorja in imenih zanimivosti niso najdeni. »Hotel«, »motel«, »koča« in »restavracije« so splošni opisi brez imen. Google Maps, Earth in Street View so omenjeni samo kot »ni uporabljeno« (balea, canaries, ngorongoro, sosnova). Imena zavojev, ki so zemljepisna ali ledinska (nring, bathurst, pikesg), ostanejo.

## Zamenjave

Izvedeno 28. 11. (O-28-45/c) na vejah dodelava, commiti: #1230 c35cbbb, #1198 6f1c963, #1226 518fa42, #1227 58ddc88, #1202 8d41518, #1222 8d54cc0, #1201 b1d13e1, #1245 0dec734, #1234 5b90721, #1213 de57119.

### #1230 Montréal (oseba, prireditev, komercialna vira)
- [x] `README.md`, `docs/proge/montreal.md`: »Montréal–Trudeau« → »Montréal-Dorval«.
- [x] `README.md`: »(Environment and Climate Change Canada, prek extremeweatherwatch.com in weatherspark.com)« → »(Environment and Climate Change Canada)«.
- [x] `docs/proge/montreal.md`, vrstica »Viri«: povezavi na extremeweatherwatch.com in weatherspark.com (naslov vsebuje ime osebe) odstrani; ostane »podnebne normale Montréal-Dorval 1991–2020 (Environment and Climate Change Canada)«.
- [x] `js/tracks/montreal.js` `desc` in `docs/proge/montreal.md`: »ob olimpijskem veslaškem kanalu« → »ob veslaškem kanalu«; `en.desc`: »the Olympic rowing basin« → »the rowing basin«.

### #1198 Sakhir (komercialna časopisa)
- [x] `docs/proge/sakhir.md`: navedbo »Gulf News, Gulf Weekly« odstrani; dejstvo ostane brez vira ali z OSM, če ga OSM potrjuje.

### Komercialne strani kot vir v »Zaslugah«
- [x] #1226 Katu-Jaryk, `README.md`: »javni opisi Altapress, Tonkosti, Plantarium in PeakVisor (…)« → »splošno dostopni opisi (samo dejstva, brez besedil in slik; povezave v `docs/proge/katu.md`)«.
- [x] #1227 Biķernieki, `README.md`: »Podnebne normale: javna povzetka climate-data.org in weather-atlas.com (samo dejstva).« → odstrani stavek.
- [x] #1202 Silkeborg, `README.md`: », ter podnebja s climate-data.org in wfy24« → odstrani.

### Za odločitev (samo v dokumentih prog, ne v igri)
Komercialne vremenske in turistične strani kot opomba v raziskavi: #1222 pembrey (Windfinder), #1201 sepang (Meteostat), #1227 bikernieki, #1202 silkeborg (climate-data.org), #1245 ngorongoro (safaribookings.com, climatestotravel.com), #1234 spa (climatestotravel), #1213 bathurst (visitnsw.com). Predlog: zamenjati z državno vremensko službo ali odstraniti povezavo; dejstva ostanejo.

- [x] Izvedeno (O-28-45/c): povezave in navedbe odstranjene v #1222, #1201, #1227, #1202, #1245, #1234, #1213; dejstva ostanejo.

### Ostanki (niso na seznamu, ostali nespremenjeni; za odločitev)
- #1201 sepang: »Malay Mail« (komercialni časopis) v virih raziskave.
- #1245 ngorongoro: discoverafrica.com in mountain-forecast.com v vrstici »Podnebje«.
- #1234 spa: weerplaza.nl kot vir padavin.
- #1230 montreal: povezava na stran parka z imenom osebe v naslovu URL (`docs/proge/montreal.md`, »Viri«); komentar »Olympic rowing basin« v `js/world-montreal.js`.
