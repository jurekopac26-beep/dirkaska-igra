# Cusco, Peru (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `cusco` (`js/tracks/cusco.js`, svet `js/world-cusco.js` na podatkovnem graditelju `js/world-gore.js`)

Kratka cesta iz Cusca v hrib nad mestom, mimo inkovskih zidov Sacsayhuamána, v pravem merilu. Proga 21 sklopa kratkih prog z znamenitostjo (`docs/gorske-proge.md`, `docs/proge-po-drzavah.md`, »Kratke proge z znamenitostjo«). Start nad mestom (3.531 m, 13,5107° J, 71,9823° Z), cilj na pobočju nad zidovi (3.592 m, 13,5058° J, 71,9840° Z); dirka je dolga 931 m, rahlo navzgor (najstrmeje 9,5 %), z dvema serpentinama (desna ~160°, leva ~110°).

- **Dirka**, **kronometer**, **promet**, **policija**: kot na Vršiču (štiri vožnje na eni kartici). Za ciljem je 158 m ceste, da vsi avtomobili zapeljejo vsak na svoje mesto ob cesti. Medalje kronometra: zlata 27 s, srebrna 29 s, bronasta 31 s (v dežju 33 / 35 / 38 s).
- **Znamenitost**: trije cikcakasti terasni zidovi Sacsayhuamána iz velikih nepravilnih kamnov, zloženih brez malte (potek iz OpenStreetMap, višina 4–6 m, zidovi rahlo nagnjeni nazaj). Najbližji je 30 m od ceste pri 30 % dirke (test proge to preverja), druga dva 50–70 m. Ob zidovih ni dreves, da se vidijo iz kamere za avtom (ležeče na treh mestih ob robu slike, pokonci slabše). Pod uro se izpiše »Sacsayhuamán«, nato serpentini z višino.
- **Cesta**: cesta nad Cuscom mimo Sacsayhuamána; v igri široka 7,6 m, rumena sredinska črta, brez robnikov.
- **Obcestje** (`js/world-cusco-obcestje.js`, po OpenStreetMap): žive meje, stranska cesta iz krpanega asfalta, betonske poti, steze iz uhojene in gole zemlje, servisna pot in nizke razvaline obzidja s presledki. Poti se ustavijo na robu asfalta na nizkem nasipu čez jarek, drugi konci zbledijo v tla. Žive meje so samo onkraj voznega obcestja (do ~15 m od sredine ceste; brez trkov bi avto peljal skoznje), zato večinoma od cilja naprej. Privzeto (ni v OSM): meje strižene 1,3 × 1 m (možnost b: proste 2,2 × 1,5 m), razvaline do 1,2 m. Vožnja, fizika in hribi se ne spremenijo.
- **Podatki**: sredinska črta, stavbe in parkirišče iz OpenStreetMap; višine Copernicus GLO-30; raba tal ESA WorldCover (uvoznik `tools/proga-uvoz.mjs`, nastavitve v `tools/predogled/proge.json`).
- **Približki**: drevesa (evkaliptusi), trava, skale in ljudje so razporejeni po rabi tal in naklonu, ne po resničnih legah; stavbe so poenostavljene, table generične, brez imen podjetij. Kamni zidov so izmišljeni (oblika in velikost po splošnem poznavanju kraja), ne posnetek resničnih.
- **Pravno**: samo zemljepisna imena (Cusco, Sacsayhuamán). Kipa na hribu nad mestom v igri ni; cesta in ovinki nimajo imen po osebah.

Vire glej v `README.md` pod »Zasluge«.

## Raziskava za dodelavo (`dodelava/cusco`, 28. 11. 2026)

Dodelava na raven Pikes Peaka (O-28-6, O-28-7, O-28-17; merila `docs/dodelava-prog.md`). Viri: OpenStreetMap (API `map` za okvir 13,5130–13,5035° J, 71,9875–71,9790° Z, prenos 28. 11. 2026; © OpenStreetMap contributors, ODbL 1.0), Copernicus GLO-30 in ESA WorldCover 2021 (že v uvozu proge). Spletni opisi (Wikipedija, UNESCO) v tej seji niso bili dosegljivi: dejstva od tam so označena »za preverbo« in v igri niso uporabljena kot številke.

**Kraj, podnebje, višina.** Cesta se iz zgornjega roba Cusca (3.531 m) vzpne na pobočje nad mestom (3.592 m); najnižja točka terena v okviru proge je 3.413 m (dno mesta proti jugovzhodu, GLO-30). Zgodovinsko središče Cusca je na seznamu svetovne dediščine (za preverbo: UNESCO 1983, št. 273). Podnebje visokogorsko subtropsko (za preverbo: Köppen Cwb): suha doba približno od maja do oktobra z jasnim nebom in mrzlimi nočmi, deževna od decembra do marca s popoldanskimi nevihtami; sneg na tej višini redek, toča pogosta.

**Rastje, kamen, tla** (WorldCover 2021, celice 16 m): v okviru proge 78 % travišče in grmovje, 20 % drevesa, 1 % grmišča, 0,2 % pozidano; v pasu 20–40 m od ceste 90 % trava in 10 % drevje. OSM ob cesti: gozd (listavci) pri 426 m in 696 m dirke, gozdiček pri 200 m. Drevje so nasadi evkaliptov (za preverbo: uvedeni v 19. stoletju); trava je puna z ichujem (šopasta trava, že na progi iz #1152). Zidovi Sacsayhuamána: veliki poligonalni bloki brez malte (za preverbo: večinoma apnenec, finejši deli andezit); OSM pri 83 m od ceste beleži golo skalo (`natural=bare_rock`).

**Gradnja ob cesti** (OSM): cesta terciarna, asfalt, 4 pasovi, omejitev 45 km/h; ob 411 m vsek v pobočje na desni (`cutting=right`). Pri vhodu v arheološki park: prodaja vstopnic (561 m, 5 m od ceste), parkirni pas ob cesti (616 m), zapornica in čuvajnica (631 m, 8 m), stranišče (19 m); druga čuvajnica pri 356 m (36 m), zaklenjena vrata pri 706 m (9 m). Za ciljem žive meje, ograja, pregledna tabla s topografsko karto (1016 m), stanovanjske hiše (`landuse=residential`, 17 m pri 1071 m). Stavbe: hiše iz zidakov in ometa z opečnatimi strehami (za preverbo, splošni opis kraja).

**Zanimivosti do 60 m** (razdalja od starta · od ceste, OSM):

| m dirke | Kaj | Od ceste | OSM |
|---|---|---|---|
| 200 | evkaliptov gozdiček | 19 m | `natural=wood` 640965436 |
| 270–275 | Murallas de Sacsayhuamán, prvi in drugi zid | 30 m, 51 m | 431479257, 431479258 |
| 356 | čuvajnica parka | 36 m | 709383929 |
| 411 | vsek v pobočje | 1 m | 1184931693 |
| 426 | evkaliptov gozd | 4 m | 83127651 |
| 471 | meja arheološkega parka Sacsayhuamán | 1 m | 83130621 |
| 540 | serpentina 1 (3.572 m) | — | uvoz |
| 561 | vhod v park, vstopnice | 5 m | vozlišče 4523568190 |
| 616 | parkirni pas ob cesti | 2 m | 709383928 |
| 631 | zapornica, čuvajnica | 5–8 m | 6668272936, 648585583 |
| 674 | serpentina 2 (3.577 m) | — | uvoz |
| 696–706 | evkaliptov gozd, zaklenjena vrata | 0–9 m | 83127653, 1120930471 |
| 706 | tretji zid Sacsayhuamána | 67 m | 689230841 |
| 896 | ruševine obzidja | 38 m | 480271264 |
| cilj + 24–134 | žive meje, pregledna tabla, ruševine (26 m), hiše | 6–48 m | 1039912186, 13673060468, 480271265 |

Dlje od 60 m (samo v opisu, ne kot zanimivost): stolp Muyuqmarka (113 m), razgledišče nad mestom (69 m), ravnica med zidovi (70 m). **Ne uporabljamo**: ime ceste (po osebi), planetarij, kamp in šolo (ustanove in podjetja).

**Dolina pod mestom** (vrzel iz `docs/dodelava-prog.md`): z obeh serpentin in z razgleda pri 78,8 / −99,2 se vidi Cusco v kotlini proti jugovzhodu (GLO-30: 120–180 m niže). Strehe mesta niso v uvozu (samo 23 stavb ob cesti); za dodelavo jih je treba dobiti iz OSM `building=*` v pasu 300–1.200 m od ceste.

**Živali**: na travnikih Sacsayhuamána se pasejo lame in alpake (za preverbo, splošni opis kraja; OSM jih ne beleži).

**Ne spreminjamo** (odprti PR drugih): stranske ceste, `sideClosed`, `sideRoads` (#1016); šopi trave, kamenje in zaplate zemlje 6–42 m za ograjo (moj #1152).

**Narejeno v dodelavi**: 13 zanimivosti z `say` po tabeli zgoraj (prej 3), prelet `fly` (start, zidovi, serpentini, vhod v park, cilj), `cloudTh` 0,16 (redki oblaki suhe dobe), živali in stvari jas (`zivali`: lame in alpake; štori in kupi hlodov evkaliptov, smerokaz; v `js/world-zivali.js` dodani vrsti `llama` in `alpaca`), daljši opis. Senčila, luč, fizika in stranske ceste nespremenjeni.
