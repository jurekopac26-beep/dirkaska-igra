# Irishtown, Jamajka (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `irishtown` (`js/tracks/irishtown.js`)

Cesta B1 proti Newcastlu po južnem pobočju Modrih gora nad Kingstonom (župnija Saint Andrew, Jamajka), v pravem merilu. Proga se začne pod zaselkom Irishtown (661 m, 18,0466° S, 76,7275° Z), zavije v dve serpentini (desna ~190°, nato leva ~120° z razgledom na Kingston), pelje skozi zaselek Irishtown, po grebenu mimo kavnih nasadov pri Craightonu (~800 m), se spusti ~30 m v dolino in se zadnjič vzpne do zaselka Red Light (777 m, 18,0595° S, 76,7223° Z): 4,18 km, zelo zavita (883 °/km, štiri lasnice po merilu `docs/proge-pregled.md`), največ ~12 %. Vozi se po levi (`def.leftHand`).

- **Dirka**: 21 tekmecev (v meniju *Opponents* do največ 45, `maxRivals`), start pod prvo serpentino, en vzpon do cilja; po cilju vsak avto zapelje na svoje mesto ob cesti. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, kontrolne točke z vmesnimi časi in višino, duh in medalje (zlata 2:29, srebrna 2:36, bronasta 2:48, v dežju 3:00 / 3:09 / 3:23; pozimi 2:55 / 3:03 / 3:17, v snegu 3:34 / 3:44 / 4:01; zlato je čas relijskega avta na avtopilotu × 1,01).
- **Promet**: dvoboj z enim tekmecem po odprti cesti, na kateri so avtomobili, kombiji (krajevni prevoz), poltovornjaki, tovornjaki in nekaj motorjev (obe smeri), ob cesti kolesarji.
- **Policija**: beg pred policijo (generične patrulje z napisom POLICE, brez imena ali znaka katere koli službe); v rezultatih »Do Red Lighta v …«.
- **Imena pod uro**: Serpentina 1, Serpentina 2, Irishtown, Craighton in Red Light; komentator ima svoje stavke ob startu, serpentinah, zaselkih in cilju (`js/lang.js`).
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (`highway=secondary`, zglajena). Cesta je v igri široka 8 m (prava ~5–6 m). Višine so iz Copernicus DEM GLO-30, očiščene (drseča mediana, glajenje, največ 12 %), gor in dol kot cesta.

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.irishtown`):

- **Tropski gorski gozd**: gost gozd listavcev na strmih pobočjih (drevesa `trop`, skupna z drugimi tropskimi progami), kavni nasadi na terasah grebena pri Craightonu, trava in grmovje ob cesti, rdeča prst v usekih (raba tal iz ESA WorldCover, Sentinel-2 in karte višin krošenj). Barve tal iz satelitskega posnetka Sentinel-2 (29. 1. 2024, sušna doba). Snega ni.
- **Hiše**: hiše zaselkov Irishtown, Craighton in Red Light ob cesti (753 obrisov iz OpenStreetMap v okolici, brez imen in napisov), trije potoki v grapah.
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m): grebeni Modrih gora in pobočje proti Kingstonu.
- **Cesta**: bela prekinjena sredinska črta (v ostrih ovinkih neprekinjena), beli robni črti, jeklene varnostne ograje, kjer teren pada; obrabljen in krpan asfalt s prahom ob robu (`world-cesta.js`, vrstica `irishtown`).
- **Padec čez rob**: ograja (vidna ali nevidna) zadrži vsak avto na cesti (padec čez rob je samo na Killarju).
- **Izletna cona**: v OpenStreetMap so zidovi, ograje ali hiše do ~3 m od asfalta na največ 14 % katerega koli 500-metrskega odseka (izletna cona je).
- **Živali**: brez.
- **Dirka**: start z lučmi, kontrolne točke, cilj s tablo IRISHTOWN in napisom SAINT ANDREW, transparent IRISHTOWN / BLUE MOUNTAINS (samo zemljepisna imena), redki gledalci.

## Zanimivosti do 60 m (predlog, potrdi uporabnik)

Iz OpenStreetMap, metri od starta:

1. **Serpentina 1** (~700 m): lasnica v desno, ~190° (ovinek menija).
2. **Serpentina 2 in razgled na Kingston** (~1710 m): lasnica v levo, ~120°, razgledišče 14 m od ceste.
3. **Zaselek Irishtown** (~1830 m): hiše tik ob cesti.
4. **Kavni nasadi na grebenu pri Craightonu** (~2920 m, 42 m od ceste; brez imena posestva ali znamke).
5. **Zaselek Craighton** (~3450 m, 30 m od ceste).
6. **Zaselek Red Light na cilju** (~4150 m, 21 m od ceste).
7. Potoki v grapah in tropski gorski gozd ob vsej cesti.

Brez imen hotelov, gostišč, lokalov in kavnih posestev.

## Negotovo

- **Črte na cesti**: pravila Jamajke (bela sredinska in beli robni črti, `'Jamajka'` v `js/world-cesta.js`) niso preverjena s fotografijami z istega mesta. Na ozkih gorskih cestah črt pogosto ni ali so zbledele.
- **Drevesa**: v igri so drevesa generična (tropska), razporejena po rabi tal, ne po resničnih legah; kavni grmi niso posebej narisani.
- **Širina**: prava cesta je ožja od 8 m v igri.

Podatke proge pripravi `tools/proga/proga.py` (`python3 tools/proga/proga.py irishtown --zapisi`, nastavitve v `tools/proga/proge.json`). Vire glej v `README.md` pod »Zasluge«.
