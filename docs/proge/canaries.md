# Canaries, Sveta Lucija (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `canaries` (`js/tracks/canaries.js`)

Obalna cesta na zahodni obali Svete Lucije od vasi Canaries proti severu (proti Anse La Raye), v pravem merilu. Proga se začne nad zalivom Canaries (44 m), gre mimo zaselka Anse La Verdue, po gozdnatem grebenu do 177 m, se spusti v dolino (82 m) in se po serpentini spet vzpne do cilja na 178 m: 4,98 km, ovinkasta ves čas, z naklonom do 12 %. Vozi se po levi. Kartica proge je ena, na njej pa so štirje načini:

- **Dirka**: tekmeci (v meniju *Opponents* največ 85: za ciljem je ~190 m ceste; `maxRivals`), start nad zalivom, en vzpon do cilja. Po cilju vsak avto zapelje na svoje mesto ob cesti. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke, lestvica, duh in medalje (zlata 2:45, srebrna 2:54, bronasta 3:07, v dežju 3:20 / 3:30 / 3:45; pozimi 3:14 / 3:23 / 3:38, v snegu 3:59 / 4:10 / 4:29; zlato je čas relijskega avta na avtopilotu × 1,01).
- **Promet**: dvoboj z enim tekmecem po odprti cesti: avtomobili, kombiji in poltovornjaki, nekaj tovornjakov in motoristov, redki kolesarji.
- **Policija**: beg pred policijo do cilja (generičen napis POLICE, brez imena ali znaka službe), v rezultatih »Do Anse La Raye v …«.
- **Imena pod uro**: Anse La Verdue (575 m za startom), Greben · 177 m (1.780 m), Dolina · 82 m (4.040 m) in Serpentina (4.200 m, zavije za ~170°); komentator ima na tej progi svoje stavke.
- **Oblika in višine**: sredinska črta iz OpenStreetMap (zglajena), višine iz Copernicus DEM GLO-30 (očiščene; ob cesti, kjer model zaradi gozda leži previsoko, so spuščene na model terena: `do_modela` v `tools/proga/proge.json`). OSM nima širine ceste; v igri je cesta široka 9 m.

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js`, videz `PL_LOOK.canaries`):

- **Tropski gozd**: gost listnat gozd (vitko svetlo deblo pod široko, grudasto krošnjo; `L.trop`), palme, grmovje in trava po rabi tal (ESA WorldCover, Sentinel-2, karta višin krošenj); rdeče-rjava prst v vsekih, sivo-rjav andezit v pečinah.
- **Morje**: Karibsko morje pod obalo na levi; obzorje je pravi teren ~9 km naokoli (Copernicus DEM).
- **Hiše**: pisane hiše s pločevinastimi strehami (obrisi iz OpenStreetMap, brez imen in napisov), največ ob zaselku Anse La Verdue.
- **Cesta**: bela prekinjena sredinska črta (3 m / 9 m, v serpentini neprekinjena) in bele robne črte, kot na otoku; prst, ki jo dež spere na cesto, zakrpan in na robovih načet asfalt (`CESTE.canaries` v `js/world-cesta.js`); jeklena ograja nad prepadi, kjer teren pada (padca čez rob ni).
- **Dirka**: start z lučmi, portali kontrolnih točk z višino, cilj s tablo CANARIES · SAINT LUCIA, transparent CANARIES · ANSE LA VERDUE (samo zemljepisna imena), malo gledalcev ob startu in cilju.
- **Približki**: drevesa, palme, grmovje in hiše so razporejeni po rabi tal in obrisih iz OSM, ne po resničnih legah; hiše so generične.
- **Pravno**: samo zemljepisna imena (Canaries, Anse La Verdue, Anse La Raye, Sveta Lucija); brez imen gora po osebah, lokalov in trgovin ob cesti.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py canaries --zapisi`, nastavitve v `tools/proga/proge.json`, vmesni podatki v `tools/canaries/`). Vire glej v `README.md` pod »Zasluge«.
