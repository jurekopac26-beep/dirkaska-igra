# Limalimo, Etiopija (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `limalimo` (`js/tracks/limalimo.js`)

Cesta B30 po serpentinah Limalimo pod severnim robom gorovja Simien v Etiopiji, v pravem merilu. Proga se začne pod bazaltnimi stenami (1.684 m, 13,2762° S, 37,8783° V), gre ~2,5 km ob vznožju roba nad prepadom v nižino, nato skozi tri serpentine (dve tik druga za drugo) in se konča nad njimi (1.972 m, 13,2565° S, 37,8863° V): 4,03 km in 288 m vzpona, največ 12 %. Za ciljem cesta pelje še ~190 m, kjer se v igri konča. Kartica proge je ena, na njej pa je stikalo **Dirka / Kronometer / Promet / Policija** (kot na Bâlei):

- **Dirka**: 21 tekmecev, start pod stenami (štartna mreža za črto), en vzpon do vrha serpentin. Po cilju vsak avto zapelje na svoje mesto ob cesti. Kvalifikacij ni (odprta cesta), v karieri je nagrada kot za dirko na 4 km.
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica najboljših 10, duh in medalje (zlata 2:06, srebrna 2:13, bronasta 2:23, v dežju 2:33 / 2:40 / 2:52; zlato je čas relijskega avta na avtopilotu × 1,01).
- **Promet**: dvoboj z enim tekmecem po odprti cesti; B30 je glavna cesta proti severu, zato je na njej veliko tovornjakov, avtobusov in kombijev, malo osebnih avtov in motoristov, kolesarji redko.
- **Policija**: beg pred policijo do vrha (pregon se začne že na štartu). Patrulje imajo ob bokih generičen napis POLICE na temnozelenem pasu (brez imena ali znaka katere koli službe), v rezultatih pobega piše »Na vrh v …«.
- **Serpentine**: igra jih šteje od spodaj (Serpentina 1–3). Pod uro se izpišejo z višino (Serpentina 1 · 1.849 m, Serpentina 2 · 1.852 m, Serpentina 3 · 1.901 m), še krak pod steno (Pod robom Simiena) in vrh (Limalimo · 1.972 m); komentator ima na tej progi svoje stavke ob startu, ob cilju in ob pobegu.
- **Prepad in ograja**: na strani doline teren ponekod pade za več metrov tik ob cesti. Tam stoji jeklena varnostna ograja (skupna okolica jo postavi, kjer teren pade več kot 2,4 m), nevidna stena proge pa drži vsak avto na cesti: čez rob se na tej progi ne pade (padec čez rob je samo na Killarju).
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (zglajena; najožje serpentine razprte na polmer ~10 m, nastavitev `polmer` v `tools/proga/proge.json`). OpenStreetMap nima podatka o širini ceste; v igri je cesta široka 10 m, da je prostora za 22 avtov. Višine so iz višinskega modela Copernicus DEM GLO-30, očiščene (drseča mediana, glajenje, serpentine položnejše, največ 12 %).

Okolica (gradi jo skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.limalimo`):

- **Suha doba**: jasno jutro, sonce visoko z vzhoda, prašna meglica nad nižino. Pobočja so suha visokogorska trava s šopi in grmovjem (raba tal iz ESA WorldCover, satelitskega posnetka Sentinel-2 z 11. 12. 2024 in karte višin krošenj), temne bazaltne skale in rdečkasta prst, melišča pod stenami. Barve tal so iz satelitskega posnetka Sentinel-2.
- **Hiše**: obrisi stavb iz OpenStreetMap ob cesti (generične, brez imen in napisov).
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m): rob Simiena nad progo in nižina proti severu.
- **Cesta**: bela prekinjena sredinska črta (v serpentinah neprekinjena), jeklene ograje, kjer teren pada, opozorilni trikotniki in table s puščicami (črno-rumene) v serpentinah; nobenih imen podjetij ali znakov služb.
- **Dirka**: start z lučmi pod portalom START, portali kontrolnih točk z višino, cilj FINISH s tablo LIMALIMO in višino, transparent SIMIEN (samo zemljepisna imena), gledalci ob startu, cilju in kontrolnih točkah.
- **Živali**: tropi ovc na pobočjih ob cesti.
- **Negotovo**: barva sredinske črte (v Etiopiji bela ali rumena) ni preverjena s fotografijami; v igri je bela. Fotografije z Wikimedia Commons in Mapillary iz okolja seje niso bile dosegljive, zato je videz narejen po podatkih (OpenStreetMap, Sentinel-2) in splošnem poznavanju kraja.
- **Približki**: rastje, skale, ovce in gledalci so razporejeni po rabi tal, višini in naklonu, ne po resničnih legah.
- **Pravno**: samo zemljepisna imena (Limalimo, Simien); brez imen koč in hotelov, uradov narodnega parka ali graditeljev ceste.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py limalimo --zapisi`, nastavitve v `tools/proga/proge.json`, opis v `tools/proga/README.md`). Vire glej v `README.md` pod »Zasluge«.
