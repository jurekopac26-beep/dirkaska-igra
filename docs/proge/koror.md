# Koror, Palau (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `koror` (`js/tracks/koror.js`)

Glavna cesta z južnega roba otoka Babeldaob čez most na otok Koror, ob laguni po nasipih in čez gozdnati grič do vzhodnega roba mesta Koror, v pravem merilu. Proga se začne nad mostom (~5 m, 7,3640° S, 134,5082° V), čez most in nasipe ostane tik nad morjem (najnižje ~2,5 m), nato se vzpne čez gozdnati grič do mesta (~56 m, 7,3445° S, 134,4948° V): 3,30 km, 246 °/km, 70 % ravnin (most in nasipi), brez lasnic, najostrejši ovinki na griču. Za ciljem cesta pelje še ~190 m. Desni promet. Kartica proge je ena, na njej pa je stikalo **Dirka / Kronometer / Promet / Policija** (`def.modes`, kot na Savusavuju):

- **Dirka**: tekmeci (v meniju *Opponents*, največ 90), start nad mostom (štartna mreža za črto), čez most in nasipe ob laguni in vzpon do mesta. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica najboljših 10, duh in medalje (zlata 1:20, srebrna 1:25, bronasta 1:30, v dežju 1:38 / 1:43 / 1:50; pozimi 1:32 / 1:37 / 1:43, v snegu 1:52 / 1:58 / 2:06; zlato je čas relijskega avta na avtopilotu).
- **Promet**: dvoboj z enim tekmecem po odprti cesti v obe smeri: predvsem avtomobili in poltovornjaki, kombiji, tovornjaki; ob cesti redki kolesarji.
- **Policija**: beg pred policijo do Kororja. Patrulje imajo ob bokih generičen napis POLICE (brez imena ali znaka katere koli službe), v rezultatih pobega piše »Do Kororja v …«.
- **Imena pod uro**: Most čez kanal, Nasipi ob laguni, Gozdnati grič in Koror na cilju; komentator ima na tej progi svoje stavke ob startu, ob cilju in ob pobegu.
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (zglajena). OpenStreetMap nima podatka o širini ceste; v igri je cesta široka 10 m, da je prostora za tekmece. Višine so iz višinskega modela Copernicus DEM GLO-30, očiščene (drseča mediana, glajenje, največ 12 %); most je v višinah poravnan (`mostovi` v `tools/proga/proge.json`).

Okolica (gradi jo skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.koror`, tropski kot Savusavu):

- **Laguna**: morje okoli otokov (`def.sea`: ravnina morja na višini 0, dno pod njo; `P.sea` v `js/world-vrsic.js`, teren v `js/world-caracoles.js`). V morju ne stojijo hiše, skale, drevesa ali gledalci (`inSea` v `js/world-prelaz.js`). Galebi in šum valov.
- **Most in nasipi**: ob mostu in nasipih nizek zid in jeklena ograja, takoj za njima morsko dno (`def.bridges`, `P.brS`).
- **Tropski gozd**: vlažen tropski gozd na griču, palme in grmovje, trava ob cesti (raba tal iz ESA WorldCover in naklonov višinskega modela). Barve tal so iz satelitskega posnetka Sentinel-2 (24. 4. 2023). Brez snega, brez ovc in brez predora.
- **Stavbe**: hiše s strehami iz valovite pločevine (gola, rdeča, modra, zelena), obrisi iz OpenStreetMap (~60 stavb do 60 m od ceste, brez imen in napisov), gostejše na robu mesta.
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m): Babeldaob, otoki in laguna.
- **Cesta**: rumena prekinjena sredinska črta (3 m / 9 m, pred nepreglednimi ovinki neprekinjena), od sonca in soli zbledel asfalt s krpami; jeklene varnostne ograje, kjer teren pada; nobenih imen podjetij ali znakov služb.
- **Izletna cona** (`docs/proge-po-drzavah.md`): ograja, zid ali prepad do 3 m od roba asfalta na 0 % dolžine (v igri; povprečno 5,7 m do roba proge). Rob proge avto ustavi, zato ne pade čez rob ali v morje (pravilo »Padec čez rob samo na Killarju«).
- **Dirka**: start z lučmi pod portalom START, portali kontrolnih točk z višino, cilj z generično tablo KOROR (pod njo PALAU), transparent KOROR · PALAU (samo zemljepisna imena), redarji in nekaj mirnih gledalcev ob startu in cilju.
- **Fotografije**: videz je narejen po podatkih (OpenStreetMap, Sentinel-2, ESA WorldCover) in splošnem poznavanju kraja, brez primerjave s fotografijami z istih mest.
- **Približki**: most čez kanal je narisan kot nasip z zidovi in ograjami (brez stebrov in razpona nad vodo). Drevesa, palme, grmovje, skale in gledalci so razporejeni po rabi tal, višini in naklonu, ne po resničnih legah. Hiše so generične.
- **Pravno**: samo zemljepisna imena (Koror, Babeldaob, Palau); brez imen mostu, hotelov, trgovin, pristanišč in oseb.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py koror --zapisi`, nastavitve v `tools/proga/proge.json`, opis v `tools/proga/README.md`). Vire glej v `README.md` pod »Zasluge«.
