# Kanaba, Uganda (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `kanaba` (`js/tracks/kanaba.js`)

Cesta Kabale–Kisoro čez prelaz Kanaba v gorovju Kigezi na jugozahodu Ugande, v pravem merilu. Proga se začne na grebenu zahodno od Kabaleja (2.313 m, 1,2573° J, 29,8005° V), se spusti v kotanjo, spet vzpne na prelaz Kanaba (2.343 m), kjer se odpre pogled proti vulkanom Virunga, in se po ovinkih zahodnega pobočja spusti do 2.195 m (1,2480° J, 29,7797° V): 4,99 km, večinoma navzdol (kot Chapman's Peak). V Ugandi se vozi **po levi** (`leftHand`: promet in tekmeci vozijo po levem pasu). Kartica proge je ena, na njej stikalo **Dirka / Kronometer / Promet / Policija** (kot na Limalimu):

- **Dirka**: 21 tekmecev (v meniju *Opponents* do največ 85: za ciljem je ~190 m ceste, `maxRivals`), start na grebenu, en spust do cilja; po cilju vsak avto zapelje na svoje mesto ob cesti. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, kontrolne točke z vmesnimi časi in višino, duh in medalje (zlata 2:35, srebrna 2:43, bronasta 2:55, v dežju 3:07 / 3:16 / 3:31; zlato je čas relijskega avta na avtopilotu).
- **Promet**: dvoboj z enim tekmecem po odprti cesti, na kateri so kombiji in avtobusi, tovornjaki, avtomobili in veliko motorjev (oboje smeri), ob cesti kolesarji.
- **Policija**: beg pred policijo (generične patrulje z napisom POLICE, brez imena ali znaka katere koli službe); v rezultatih »Do Kisora v …«.
- **Imena pod uro**: Kotanja, Prelaz Kanaba · 2.343 m, Razgledišče na Virunge in Serpentina 1 (najostrejši ovinek, ~174°, ~640 m pred ciljem); komentator ima svoje stavke ob startu, prelazu, serpentini in cilju. V angleščini *The Dip*, *Kanaba Gap*, *Virunga Viewpoint* (`js/lang.js`).
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (`highway=primary`, zglajena). Cesta je v igri široka 9 m (prava ~7 m). Višine so iz Copernicus DEM GLO-30, očiščene (drseča mediana, glajenje); ker gre cesta gor in dol, je profil samo obrezan, ne prisiljen navzgor (`"gor": false` v `tools/proga/proge.json`, novo stikalo v `tools/proga/proga.py`).

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.kanaba`):

- **Visokogorje poleti**: zelena polja in pašniki na rdeči prsti, gozdni pasovi in grmičevje (raba tal iz ESA WorldCover, Sentinel-2 in karte višin krošenj), rdeče-rjava preperela kamnina v useku. Barve tal iz satelitskega posnetka Sentinel-2 (30. 7. 2025). Snega ni.
- **Hiše**: obrisi iz OpenStreetMap ob cesti, generične, s pločevinastimi strehami (sive in rjave); brez imen in napisov.
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m).
- **Cesta**: bela prekinjena sredinska črta (v ostrih ovinkih neprekinjena), rumene robne črte, jeklene varnostne ograje, kjer teren pada; obrabljen asfalt z rdečim prahom ob robu (`world-cesta.js`, vrstica `kanaba`).
- **Padec čez rob**: ograja (vidna ali nevidna) zadrži vsak avto na cesti (padec čez rob je samo na Killarju).
- **Živali**: nekaj tropov drobnice s pastirjem ob cesti.
- **Dirka**: start z lučmi, kontrolne točke, cilj z rjavo tablo KANABA, transparent KIGEZI / KANABA GAP · 2343 M (samo zemljepisna imena), redki gledalci.

## Negotovo

- **Črte na cesti**: pravila Ugande (bela sredinska, rumeni robni črti, `'Uganda'` v `js/world-cesta.js`) niso preverjena s fotografijami z istega mesta (Wikimedia Commons in Mapillary iz okolja seje nista dosegljiva).
- **Drevesa**: v resnici so ob cesti veliko evkaliptusov in nasadi; v igri so drevesa generična, razporejena po rabi tal, ne po resničnih legah.

Podatke proge pripravi `tools/proga/proga.py` (`python3 tools/proga/proga.py kanaba --zapisi`, nastavitve v `tools/proga/proge.json`). Vire glej v `README.md` pod »Zasluge«.
