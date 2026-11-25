# Savusavu, Fidži (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `savusavu` (`js/tracks/savusavu.js`)

Zahodni konec obalne ceste vzhodno od Savusavuja na južni obali otoka Vanua Levu (glavna cesta po južni strani otoka), v pravem merilu. Proga se začne na planoti pri letališču (~5 m, 16,7984° J, 179,3391° V), gre proti severu čez nizko gozdnato sleme (~78 m) in se spusti do roba mesta nad zalivom (~12 m, 16,7801° J, 179,3380° V): 2,49 km, 431 °/km, 50 % ravnin, brez lasnic. Za ciljem cesta pelje še ~190 m. **Levi promet** (`def.leftHand`). Kartica proge je ena, na njej pa je stikalo **Dirka / Kronometer / Promet / Policija** (`def.modes`, kot na Hải Vânu):

- **Dirka**: tekmeci (v meniju *Opponents*, največ 90: več jih za ciljem ne bi imelo prostora), start na planoti (štartna mreža za črto), vzpon na sleme in spust do mesta. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica najboljših 10, duh in medalje (zlata 1:07, srebrna 1:10, bronasta 1:15, v dežju 1:22 / 1:26 / 1:32; zlato je čas relijskega avta na avtopilotu).
- **Promet**: dvoboj z enim tekmecem po odprti cesti v obe smeri: predvsem avtomobili in poltovornjaki, kombiji in odprti avtobusi med vasmi, tovornjaki, malo motorjev; ob cesti redki kolesarji.
- **Policija**: beg pred policijo do Savusavuja. Patrulje imajo ob bokih generičen napis POLICE (brez imena ali znaka katere koli službe), v rezultatih pobega piše »Do Savusavuja v …«.
- **Imena pod uro**: Planota pri letališču, Sleme · 78 m, Nad zalivom Savusavu in Savusavu na cilju; komentator ima na tej progi svoje stavke ob startu, ob cilju in ob pobegu.
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (zglajena). OpenStreetMap nima podatka o širini ceste; v igri je cesta široka 10 m, da je prostora za tekmece. Višine so iz višinskega modela Copernicus DEM GLO-30, očiščene (drseča mediana, gor in dol, kot gre cesta, glajenje, največ 12 %).

Okolica (gradi jo skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.savusavu`, tropski kot Hải Vân):

- **Tropski gozd in vrtovi**: vlažen tropski gozd na slemenu, kokosove palme in vrtovi ob hišah, trava na planoti (raba tal iz ESA WorldCover in naklonov višinskega modela). Rdečerjava vulkanska prst v usekih, temen bazalt v redkih pečinah. Barve tal so iz satelitskega posnetka Sentinel-2 (21. 7. 2024). Brez snega, brez ovc in brez predora.
- **Stavbe**: hiše s strehami iz valovite pločevine ob cesti (obrisi iz OpenStreetMap, 173 stavb do 60 m od ceste, brez imen in napisov), na robu mesta gostejše; potoki pod cesto.
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m): hribi notranjosti otoka, obala in zaliv Savusavu.
- **Cesta**: bela prekinjena sredinska črta (3 m / 9 m, pred nepreglednimi ovinki neprekinjena), obrabljen asfalt s krpami, rdečerjav prah vulkanske prsti, ki ga dež spere na rob asfalta; jeklene varnostne ograje, kjer teren pada; nobenih imen podjetij ali znakov služb.
- **Izletna cona** (`docs/proge-po-drzavah.md`): ograja, zid ali prepad do 3 m od roba asfalta na 0 % dolžine (v igri; povprečno 6,8 m do roba proge). Rob proge avto ustavi, zato ne pade čez rob (pravilo »Padec čez rob samo na Killarju«).
- **Dirka**: start z lučmi pod portalom START, portali kontrolnih točk z višino, cilj z generično tablo SAVUSAVU (pod njo VANUA LEVU), transparent SAVUSAVU · VANUA LEVU (samo zemljepisna imena), redarji in nekaj mirnih gledalcev ob startu in cilju.
- **Fotografije**: Wikimedia Commons in Mapillary iz okolja seje nista bila dosegljiva, zato je videz narejen po podatkih (OpenStreetMap, Sentinel-2, ESA WorldCover) in splošnem poznavanju kraja, brez primerjave s fotografijami z istih mest.
- **Približki**: drevesa, palme, grmovje, skale in gledalci so razporejeni po rabi tal, višini in naklonu, ne po resničnih legah. Hiše so generične.
- **Pravno**: samo zemljepisna imena (Savusavu, Vanua Levu); brez imen letovišč, trgovin, marin, letališča in oseb.

## Ob cesti

Priključki stranskih ulic in dovozov, samo za videz (paket E: `stranske` v `js/tracks/savusavu.js`, `World.cesta.stranske`, `tools/cesta/izvoz.py`, `docs/realizem/paket-e.md`; potek in razred iz OpenStreetMap):

- **Kateri**: 8 priključkov med startom in ciljem: 2 dovoza (3,6 m) in 6 ulic (5,2 m), vsak trak 64 m od roba asfalta po poteku s karte; 4 na levi strani. Širina gre po razredu, ker OpenStreetMap tu nima širin.
- **Ob ustju**: ograja in robna črta glavne ceste sta čez ustje prekinjeni, čez odprtino stoji vrsta oranžnih stebričkov (količkov), konec traku zbledi v tla.
- **Površina**: ulice so v tonu asfalta glavne ceste, dovoza sta svetel makadam (predpostavka po razredu; oznake `surface=unpaved` s karte, ki jo ima 7 od 14 poti ob tej cesti, priključki ne upoštevajo).
- **Samo grafika**: teren, cesta, njen nevidni rob in vožnja so nespremenjeni (namenoma ne `def.sideRoads`); priključki niso vozni.
- **Odločitev uporabnika 24. 11. 2026**: samo priključki s količki. Ulic in dovozov v celi dolžini kot makadam (14 poti iz OSM, prej v ločeni datoteki obcestja) ni več.
- **Zmogljivost**: na telefonu 172 klicev risanja na sliko (največ 209) in 411 tisoč oglišč (največ 503 tisoč) (`tests/golden/perf.json`); z ulicami v celi dolžini 172 klicev (največ 210) in 418 tisoč oglišč (največ 516 tisoč). Svet ima 1636 mrež kot prej in 32 tisoč oglišč manj (733 tisoč).

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py savusavu --zapisi`, nastavitve v `tools/proga/proge.json`, opis v `tools/proga/README.md`). Vire glej v `README.md` pod »Zasluge«.
