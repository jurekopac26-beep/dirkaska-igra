# Šipka, Bolgarija (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `sipka` (`js/tracks/sipka.js`)

Severna stran ceste čez Šipčenski prelaz v osrednji Stari planini (Balkan), med Gabrovom na severu in dolino Kazanlaka na jugu, in stara ozka cesta od prelaza po grebenu do vrha Šipka, v pravem merilu. Proga se začne na glavni cesti (I-5) v bukovem gozdu na 1.064 m (42,7703° S, 25,3107° V), se v prvi serpentini in dolgih ovinkih vzpne do sedla prelaza (1.206 m), nato zavije na staro cesto in se v treh serpentinah po grebenu vzpne tik pod vrh Šipka (1.304 m, 42,7486° S, 25,3227° V; zadnjih ~170 m do vrha je za ciljem): 4,84 km, ves čas navzgor. V Bolgariji se vozi **po desni**. Kartica proge je ena, na njej stikalo **Dirka / Kronometer / Promet / Policija** (kot na Kanabi):

- **Dirka**: tekmeci (v meniju *Opponents*, privzeto 21, največ 39: za ciljem je le ~150 m ceste za parkiranje), start v gozdu pod prelazom, en vzpon do cilja; po cilju vsak avto zapelje na svoje mesto ob cesti. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, kontrolne točke z vmesnimi časi in višino, duh in medalje (zlata 2:39, srebrna 2:47, bronasta 3:00, v dežju 3:13 / 3:23 / 3:38; pozimi 3:07 / 3:17 / 3:32, v snegu 3:51 / 4:02 / 4:21; zlato je čas relijskega avta na avtopilotu).
- **Promet**: dvoboj z enim tekmecem po odprti cesti, na kateri so večinoma avtomobili obiskovalcev, nekaj kombijev, avtobusov in motorjev ter redek tovornjak (oboje smeri), ob cesti kolesarji.
- **Policija**: beg pred policijo (generične patrulje z napisom POLICE, brez imena ali znaka katere koli službe); v rezultatih »Na vrh v …«.
- **Imena pod uro**: Serpentina 1 · 1081 m, Bukov gozd · 1166 m, Šipčenski prelaz · 1206 m, Serpentina 2 · 1268 m, Serpentina 3 · 1296 m in Pod vrhom Šipka · 1304 m (zadnja serpentina, ~85 m pred ciljem); komentator ima svoje stavke ob startu, serpentinah, prelazu in cilju. V angleščini *Beech Forest*, *Shipka Pass*, *Below Shipka Peak* (`js/lang.js`).
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (glavna cesta do prelaza, od tam stara cesta proti vrhu; zglajena, najostrejši ovinki odprti na polmer ~9 m). Cesta je v igri široka 8 m. Višine so iz Copernicus DEM GLO-30, očiščene (drseča mediana, glajenje, naklon omejen na 12 % samo tam, kjer je model bolj strm); profil je prisiljen navzgor (`"gor": true` v `tools/proga/proge.json`).

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.sipka` v `js/world-sipka.js`):

- **Stara planina poleti**: temno zelen bukov gozd na severnih pobočjih, travniki na grebenu, sivi peščenjak in skrilavec v usekih (raba tal iz ESA WorldCover, Sentinel-2 in karte višin krošenj). Barve tal iz satelitskega posnetka Sentinel-2 (3. 7. 2025). Snega poleti ni.
- **Drevesa** (`js/world-sipka.js`): v gozdu visoke bukve (*Fagus sylvatica*, gladka siva debla pod ovalnimi krošnjami), približno vsako sedmo drevo je iglavec iz nasadov (v zaplatah); na travnikih grebena nekaj samotnih bukev z nizko široko krošnjo. Lege dreves so iz rabe tal.
- **Stolp na vrhu**: nad ciljem kamnit stolp spomenika na stopničastem podstavku po obrisu iz OpenStreetMap (~16 m), visok ~31 m; samo oblika, brez napisa, kipa in imena.
- **Hiše**: obrisi iz OpenStreetMap ob prelazu, generične; brez imen in napisov.
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m), spodaj v meglici ravnina proti Gabrovu.
- **Cesta**: bela prekinjena sredinska črta (3 m / 6 m, v ostrih ovinkih neprekinjena), opozorilni trikotniki in rdeče-bele table s puščicami v ostrih ovinkih, jeklene varnostne ograje, kjer teren pada.
- **Padec čez rob**: ograja (vidna ali nevidna) zadrži vsak avto na cesti (padec čez rob je samo na Killarneyju).
- **Živali**: srne in lisice v gozdu, zajci, konji na pašnikih grebena.
- **Dirka**: start z lučmi, kontrolne točke, cilj s tablo SHIPKA, transparent SHIPKA PASS / 4 HAIRPINS · SHIPKA PEAK (samo zemljepisna imena), redki gledalci.

## Negotovo

- **Črte na cesti**: stara cesta od prelaza proti vrhu ima v resnici morda le robne črte ali nobene; v igri ima sredinsko črto kot glavna cesta (fotografij z istega mesta iz okolja seje ni bilo mogoče preveriti).
- **Drevesa**: delež iglavcev med bukvami je ocenjen; drevesa so generična, razporejena po rabi tal, ne po resničnih legah.
- **Stolp**: višina (~31 m) je iz besedilnih virov, oblika poenostavljena (kvadraten stolp, rahlo ožji proti vrhu).
- **Izvir (km 2,2) in obcestno znamenje (km 4,2)**: na potrjenem seznamu zanimivosti, a podatki proge (OSM) zanju nimajo točke, zato v svetu še nista; Overpass iz okolja seje 26. 11. ni bil dosegljiv.
- **Dolžina in lasnice**: kartica je navajala ~5,0 km in 6 lasnic; proga v igri meri 4,84 km s 4 izrazitimi lasnicami (manjši zavoji niso šteti).

Podatke proge pripravi `tools/proga/proga.py` (`python3 tools/proga/proga.py sipka --zapisi`, nastavitve v `tools/proga/proge.json`). Vire glej v `README.md` pod »Zasluge«.
