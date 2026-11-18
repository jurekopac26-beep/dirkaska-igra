# Sogeri, Papua Nova Gvineja (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `sogeri` (`js/tracks/sogeri.js`)

Cesta Sogeri po soteski reke Laloki proti planoti Sogeri nad Port Moresbyjem (Osrednja provinca, Papua Nova Gvineja), v pravem merilu. Proga se začne v soteski (293 m, 9,4171° J, 147,3686° V), se med skalnimi stenami usekov vzpenja ob grapi reke, zavije v ostro serpentino in se po pobočju vzpne do 410 m (9,4220° J, 147,3765° V): 1,99 km, ves čas navzgor (največ ~11,5 %). Vozi se po levi (`def.leftHand`).

- **Dirka**: 21 tekmecev (v meniju *Opponents* do največ 45: za ciljem je ~190 m ceste, večja skupina velikih tovornjakov bi parkirala drug na drugem, `maxRivals`), start v soteski, en vzpon do cilja; po cilju vsak avto zapelje na svoje mesto ob cesti. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, kontrolne točke z vmesnimi časi in višino, duh in medalje (zlata 1:05, srebrna 1:09, bronasta 1:14, v dežju 1:19 / 1:23 / 1:29; pozimi 1:17 / 1:20 / 1:27, v snegu 1:35 / 1:39 / 1:47; zlato je čas relijskega avta na avtopilotu × 1,01).
- **Promet**: dvoboj z enim tekmecem po odprti cesti, na kateri so avtomobili in poltovornjaki, kombiji, tovornjaki in nekaj motorjev (obe smeri), ob cesti kolesarji.
- **Policija**: beg pred policijo (generične patrulje z napisom POLICE, brez imena ali znaka katere koli službe); v rezultatih »Do planote v …«.
- **Imena pod uro**: Soteska Laloki, Serpentina 1 (lasnica v levo, ~150°, ~590 m pred ciljem) in Pobočje Sogeri; komentator ima svoje stavke ob startu, soteski, serpentini in cilju. V angleščini *Laloki Gorge*, *Sogeri Escarpment* (`js/lang.js`).
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (`highway=tertiary`, zglajena). Cesta je v igri široka 8 m (prava ~6–7 m). Višine so iz Copernicus DEM GLO-30, očiščene (drseča mediana, glajenje) in prisiljene navzgor.

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.sogeri`):

- **Tropsko predgorje**: pobočja z visoko suho travo (kunai) in redkimi drevesi, gost tropski gozd listavcev v grapi reke (drevesa `trop`, skupna z drugimi tropskimi progami), sivo-rjav konglomerat in rdeča prst v usekih (raba tal iz ESA WorldCover, Sentinel-2 in karte višin krošenj). Barve tal iz satelitskega posnetka Sentinel-2 (19. 6. 2024). Snega ni.
- **Hiše**: ob tem delu ceste jih v OpenStreetMap ni (do 60 m od ceste nobene).
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m) z mlako ob cesti.
- **Cesta**: bela prekinjena sredinska črta (v ostrih ovinkih neprekinjena), beli robni črti, jeklene varnostne ograje, kjer teren pada; obrabljen asfalt s prahom ob robu (`world-cesta.js`, vrstica `sogeri`).
- **Padec čez rob**: ograja (vidna ali nevidna) zadrži vsak avto na cesti (padec čez rob je samo na Killarju).
- **Živali**: brez.
- **Dirka**: start z lučmi, kontrolne točke, cilj z rjavo tablo SOGERI, transparent SOGERI / LALOKI (samo zemljepisna imena), redki gledalci.

## Negotovo

- **Črte na cesti**: pravila Papue Nove Gvineje (bela sredinska in beli robni črti po avstralskem zgledu, `'Papua Nova Gvineja'` v `js/world-cesta.js`) niso preverjena s fotografijami z istega mesta (Wikimedia Commons in Mapillary iz okolja seje nista dosegljiva). Na podeželskih cestah črt pogosto sploh ni ali so zbledele.
- **Drevesa**: v resnici so na travnatih pobočjih evkalipti, ob reki pa deževni gozd; v igri so drevesa generična, razporejena po rabi tal, ne po resničnih legah.

Podatke proge pripravi `tools/proga/proga.py` (`python3 tools/proga/proga.py sogeri --zapisi`, nastavitve v `tools/proga/proge.json`). Vire glej v `README.md` pod »Zasluge«.
