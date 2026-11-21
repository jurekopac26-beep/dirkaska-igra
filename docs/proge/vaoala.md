# Vaoala, Samoa (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `vaoala` (`js/tracks/vaoala.js`)

Cesta čez otok Upolu južno od Apie, od vasi Letava skozi Vaoalo in tropski deževni gozd osrednjega slemena do Tiapapate, v pravem merilu. Proga se začne v Letavi (~306 m, 13,8787° J, 171,7659° Z) in gre ves čas navkreber (do 12 %) do Tiapapate (~480 m): 1,92 km, 366 °/km, 48 % ravnin, brez lasnic, najostrejši ovinki v gozdu nad Vaoalo. Za ciljem cesta pelje še ~170 m. **Levi promet** (`def.leftHand`). Kartica proge je ena, na njej pa je stikalo **Dirka / Kronometer / Promet / Policija** (`def.modes`, kot na Savusavuju):

- **Dirka**: tekmeci (v meniju *Opponents*, največ 39: cesta je ozka, za ciljem pa le ~150 m prostora za parkiranje), start v Letavi (štartna mreža za črto), skozi vas in gozd do vrha. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica najboljših 10, duh in medalje (zlata 0:56, srebrna 0:59, bronasta 1:03, v dežju 1:10 / 1:13 / 1:18; pozimi 1:06 / 1:09 / 1:14, v snegu 1:25 / 1:29 / 1:35; zlato je čas relijskega avta na avtopilotu).
- **Promet**: dvoboj z enim tekmecem po odprti cesti v obe smeri: predvsem avtomobili in poltovornjaki, kombiji, odprti avtobusi med Apio in južno obalo, nekaj tovornjakov in motorjev; ob cesti redki kolesarji.
- **Policija**: beg pred policijo do Tiapapate. Patrulje imajo ob bokih generičen napis POLICE (brez imena ali znaka katere koli službe), v rezultatih pobega piše »Do Tiapapate v …«.
- **Imena pod uro**: Letava, Vaoala, Gozd nad Vaoalo in Tiapapata · 480 m na cilju; komentator ima na tej progi svoje stavke ob startu, ob cilju in ob pobegu.
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (zglajena). OpenStreetMap nima podatka o širini ceste; v igri je cesta široka 8 m (ozka gorska cesta). Višine so iz višinskega modela Copernicus DEM GLO-30, očiščene (drseča mediana samo navzgor, glajenje, največ 12 %).

Okolica (gradi jo skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.vaoala`, tropski kot Savusavu, a bolj oblačno in vlažno višavje):

- **Deževni gozd**: gost tropski gozd na slemenu, palme in grmovje ob vaseh, trava ob cesti (raba tal iz ESA WorldCover, satelitskega posnetka Sentinel-2 z dne 23. 4. 2024 in karte višine krošenj Meta in WRI). Barve tal so iz istega posnetka Sentinel-2. Brez snega, brez ovc in brez predora.
- **Stavbe**: hiše s strehami iz valovite pločevine (gola, rdeča, modra, zelena), obrisi iz OpenStreetMap (529 stavb v pasu ob cesti, brez imen in napisov), gostejše v Letavi in Vaoali.
- **Potoki**: 12 potokov iz OpenStreetMap teče s slemena pod cesto.
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m): sleme Upolu, obala pri Apii in morje.
- **Cesta**: bela prekinjena sredinska črta (3 m / 9 m, pred nepreglednimi ovinki neprekinjena; podatka o oznakah ni, zato privzeta), na robovih rdečkastorjav prah z zemlje, krpe; jeklene varnostne ograje, kjer teren pada; nobenih imen podjetij ali znakov služb.
- **Izletna cona** (`docs/proge-po-drzavah.md`): ograja, zid ali prepad do 3 m od roba asfalta na 17,5 % dolžine (manj kot polovica, proga se lahko začne). Rob proge avto ustavi, zato ne pade čez rob (pravilo »Padec čez rob samo na Killarju«).
- **Dirka**: start z lučmi pod portalom START, portali kontrolnih točk z višino, cilj z generično tablo TIAPAPATA (pod njo UPOLU), transparent VAOALA · UPOLU (samo zemljepisna imena), redarji in nekaj mirnih gledalcev ob startu in cilju.
- **Fotografije**: videz je narejen po podatkih (OpenStreetMap, Sentinel-2, ESA WorldCover, karta krošenj) in splošnem poznavanju kraja, brez primerjave s fotografijami z istih mest.
- **Približki**: drevesa, palme, grmovje, skale in gledalci so razporejeni po rabi tal, višini in naklonu, ne po resničnih legah. Hiše so generične, cerkve niso posebej narisane.
- **Pravno**: samo zemljepisna imena (Vaoala, Letava, Tiapapata, Upolu, Apia, Samoa); brez imen cerkva, trgovin, prenočišč in oseb.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py vaoala --zapisi`, nastavitve v `tools/proga/proge.json`, opis v `tools/proga/README.md`). Vire glej v `README.md` pod »Zasluge«.
