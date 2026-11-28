# Canaries, Sveta Lucija (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `canaries` (`js/tracks/canaries.js`)

Obalna cesta na zahodni obali Svete Lucije od vasi Canaries proti severu (proti Anse La Raye), v pravem merilu. Proga se začne nad zalivom Canaries (44 m), gre mimo zaselka Anse La Verdue, po gozdnatem grebenu do 177 m, se spusti v dolino (82 m) in se po serpentini spet vzpne do cilja na 178 m: 4,98 km, ovinkasta ves čas, z naklonom do 12 %. Vozi se po levi. Kartica proge je ena, na njej pa so štirje načini:

- **Dirka**: tekmeci (v meniju *Opponents* največ 85: za ciljem je ~190 m ceste; `maxRivals`), start nad zalivom, en vzpon do cilja. Po cilju vsak avto zapelje na svoje mesto ob cesti. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke, lestvica, duh in medalje (zlata 2:45, srebrna 2:54, bronasta 3:07, v dežju 3:20 / 3:30 / 3:45; pozimi 3:14 / 3:23 / 3:38, v snegu 3:59 / 4:10 / 4:29; zlato je čas relijskega avta na avtopilotu × 1,01).
- **Promet**: dvoboj z enim tekmecem po odprti cesti: avtomobili, kombiji in poltovornjaki, nekaj tovornjakov in motoristov, redki kolesarji.
- **Policija**: beg pred policijo do cilja (generičen napis POLICE, brez imena ali znaka službe), v rezultatih »Do Anse La Raye v …«.
- **Imena pod uro**: Canaries (60 m za startom, vas ob zalivu), Anse La Verdue (575 m), Deževni gozd (950 m), Greben · 177 m (1.780 m), Čez potok (2.259 m), Zaselek (2.700 m), Dolina · 82 m (4.040 m) in Serpentina (4.200 m, zavije za ~170°); komentator ima ob vsakem 2–3 svoje stavke.
- **Oblika in višine**: sredinska črta iz OpenStreetMap (zglajena), višine iz Copernicus DEM GLO-30 (očiščene; ob cesti, kjer model zaradi gozda leži previsoko, so spuščene na model terena: `do_modela` v `tools/proga/proge.json`). OSM nima širine ceste; v igri je cesta široka 9 m.

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js`, lasten svet `js/world-canaries.js`, videz `PL_LOOK.canaries`; raziskava: [canaries-raziskava.md](canaries-raziskava.md)):

- **Deževni gozd**: drevesa 8–22 m z vitkim deblom, vejami in široko krošnjo, posamezna velikanska nad krošnjami (22–28 m); višina po karti višin krošenj (Meta/WRI), najvišji gozd med 900 in 1.500 m.
- **Vas ob zalivu**: hiše iz OSM kot lesene karibske hiše: pisane stene, pločevinaste štirikapne strehe s progami in rjastimi ploščami, betonski stebri na pobočju, veranda proti cesti z ograjo, polkna; večje hiše z zidanim pritličjem; pločevinaste lope. Ob hišah bananovci, palme in sadno drevje. Na plaži zaliva do 7 lesenih pirogov.
- **Palme**: kokosove palme ob obali in pod ~25 m.
- **Morje**: Karibsko morje pod obalo na levi (ravnina morja na 0 m); obzorje je pravi teren ~9 km naokoli (Copernicus DEM).
- **Cesta**: bela prekinjena sredinska črta (3 m / 9 m, v serpentini neprekinjena) in bele robne črte, kot na otoku; prst, ki jo dež spere na cesto, zakrpan in na robovih načet asfalt (`CESTE.canaries` v `js/world-cesta.js`); jeklena ograja nad prepadi, kjer teren pada (padca čez rob ni).
- **Dirka**: start z lučmi, portali kontrolnih točk z višino, cilj s tablo CANARIES · SAINT LUCIA, transparent CANARIES · ANSE LA VERDUE (samo zemljepisna imena), malo gledalcev ob startu in cilju.
- **Približki**: drevesa, palme, grmovje in hiše so razporejeni po rabi tal in obrisih iz OSM, ne po resničnih legah; hiše so generične.
- **Pravno**: samo zemljepisna imena (Canaries, Anse La Verdue, Anse La Raye, Sveta Lucija); brez imen gora po osebah, lokalov in trgovin ob cesti.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py canaries --zapisi`, nastavitve v `tools/proga/proge.json`, vmesni podatki v `tools/canaries/`). Vire glej v `README.md` pod »Zasluge«.
