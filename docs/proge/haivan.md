# Hải Vân, Vietnam (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `haivan` (`js/tracks/haivan.js`)

Severna stran stare ceste čez prelaz Hải Vân (QL1A) na odrastku gorovja Trường Sơn, ki se med Huếjem in Đà Nẵngom spusti do morja, v pravem merilu. Proga se začne nad zalivom Lăng Cô (387 m, 16,1924° S, 108,1255° V), gre skozi tropski gozd po pobočju nad morjem in skozi eno serpentino ter se konča na sedlu prelaza (477 m, 16,1875° S, 108,1307° V): 1,99 km in ~90 m vzpona. Za ciljem cesta pelje še ~190 m čez sedlo. Kartica proge je ena, na njej pa je stikalo **Dirka / Kronometer / Promet / Policija** (`def.modes`, kot na Bâlei):

- **Dirka**: tekmeci (v meniju *Opponents*, največ 90: več jih za ciljem ne bi imelo prostora), start nad zalivom (štartna mreža za črto), en vzpon do sedla. Kvalifikacij ni (odprta cesta), v karieri je nagrada kot za dirko na 2 km.
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica najboljših 10, duh in medalje (zlata 0:59, srebrna 1:02, bronasta 1:06, v dežju 1:12 / 1:15 / 1:21; zlato je čas relijskega avta na avtopilotu, kot na Vršiču).
- **Promet**: dvoboj z enim tekmecem po odprti cesti, po kateri vozijo predvsem skuterji, turistični kombiji in avtobusi do vrha, nekaj avtomobilov; tovornjakov skoraj ni (vozijo skozi predor pod prelazom); ob cesti so kolesarji.
- **Policija**: beg pred policijo do sedla (pregon se začne že na štartu, pobegneš čez cilj). Patrulje imajo ob bokih generičen napis POLICE (brez imena ali znaka katere koli službe), v rezultatih pobega piše »Do sedla v …«.
- **Imena pod uro**: Nad zalivom Lăng Cô, Serpentina · 429 m in Đỉnh đèo Hải Vân · 477 m (vrh prelaza) na cilju; komentator ima na tej progi svoje stavke ob startu, ob cilju in ob pobegu.
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (zglajena; serpentina ima polmer ~13 m). OpenStreetMap nima podatka o širini ceste; v igri je cesta široka 11 m, da je prostora za tekmece. Višine so iz višinskega modela Copernicus DEM GLO-30, očiščene (drseča mediana, monotono navzgor, glajenje): vzpon je na krakih (do 10 %), serpentina je položnejša (~3 %).

Okolica (gradi jo skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.haivan`, kot Bâlea):

- **Tropski gozd**: sopareno jutro nad morjem, sonce s severovzhoda. Pobočja do morja pokriva gost zimzelen listnat gozd (`L.trop`: vitka svetla debla pod širokimi, bujnimi krošnjami), v zaplatah grmovje in trava (raba tal iz ESA WorldCover in naklonov višinskega modela). Rdečerjava laterilna prst v useku, siv granit v pečinah in balvanih. Barve tal so iz satelitskega posnetka Sentinel-2 (1. 4. 2024). Brez snega, brez ovc in brez portala predora.
- **Stavbe**: hiše in stojnice ob cesti (obrisi iz OpenStreetMap, 43 stavb, brez imen in napisov), na parkirišču na sedlu avtomobili; potok pod cesto.
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m): greben nad prelazom, pobočja do morja in zaliv.
- **Cesta**: rumena prekinjena sredinska črta (3 m / 9 m, kot predpisuje vietnamski pravilnik QCVN 41:2019; v serpentini neprekinjena), bele robne črte, jeklene varnostne ograje, kjer teren pada, in na zunanji strani ovinkov, rdečerjav prah iz usekov ob robu asfalta in zakrpan asfalt; nobenih imen podjetij ali znakov služb.
- **Izletna cona** (`docs/proge-po-drzavah.md`): ograja, zid ali prepad do 3 m od roba asfalta na 0 % dolžine (v igri; povprečno 7,8 m do roba proge). Rob proge avto ustavi, zato ne pade čez rob (pravilo »Padec čez rob samo na Killarju«).
- **Dirka**: start z lučmi pod portalom START, portali kontrolnih točk z višino, cilj z rjavo tablo ĐÈO HẢI VÂN (pod njo THỪA THIÊN · ĐÀ NẴNG), transparent HẢI VÂN · ĐỈNH ĐÈO · 477 m (samo zemljepisna imena), redarji in nekaj mirnih gledalcev ob startu in cilju.
- **Fotografije**: Wikimedia Commons in Mapillary iz okolja seje nista bila dosegljiva, zato je videz narejen po podatkih (OpenStreetMap, Sentinel-2, ESA WorldCover) in splošnem poznavanju kraja, brez primerjave s fotografijami z istih mest.
- **Približki**: drevesa, grmovje, skale in gledalci so razporejeni po rabi tal, višini in naklonu, ne po resničnih legah. Hiše in stojnice so generične.
- **Pravno**: cesta je znana iz televizije; v igri in opisih ni nobene omembe oddaje ali njenih voditeljev, ne imen kavarn, stojnic ali stare utrdbe na sedlu. Samo zemljepisna imena (Hải Vân, Lăng Cô, Thừa Thiên, Đà Nẵng).

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py haivan --zapisi`, nastavitve v `tools/proga/proge.json`, opis v `tools/proga/README.md`). Vire glej v `README.md` pod »Zasluge«.
