# Realizem, paket E · Cesta in predmeti (~23 sej, na `main` prvi)

Del `docs/realizem.md` (razdeljen po paketih 11. 11. 2026, ukrep 5 »Manj sklopov«, `docs/varcevanje.md`). Odločitve uporabnika, proge, postopek, pravna ocena, čas in vrsta so v `docs/realizem.md`.

- **Kaj se spremeni:**
  - Ograje so takšne vrste kot v resnici: jeklena, betonska, iz gum, mreža.
  - Robniki dobijo barve in oblike posamezne proge.
  - Svetilke in table se postavijo, kjer so v OSM.
  - Kompleti predmetov po državah: ograje, smerniki, ogledala, jarki, drogovi, postajališča, table brez napisov.
  - Asfalt se nosi: temnejša linija vožnje, zalite razpoke, krpe, prašna robova, madeži olja v zaviralnih conah.
  - **Stranske ceste s križišči**, samo za videz: odcep do ~60 m od proge iz OSM, s pravim križiščem, črtami in znaki. Za dirko so zaprte (ograja, stožci ali redar), zato avto ne more zaviti nanje.
  - **Črte na cesti** po pravilih države (barva in vrsta sredinske in robne črte); na dirkališčih kot v resnici.
- **Izhodišče:**
  - stranske ceste odprtih cest so v igri že zdaj: `def.sideRoads` v datoteki proge, `_buildStubs` v `js/core.js` in skupni pomočniki `stubGeo`, `stubProps` (stožci in zapore) in `stubRails` v `js/world-vrsic.js`, ki niso zamrznjeni;
  - imajo jih Katu-Jaryk (`stubStats` v `js/world-katu.js`), Los Caracoles, Chapman's Peak in Medvode;
  - Montréal ima križišča otoških cest, zaprta z ograjo (`junctions` v `js/world-montreal.js`), kar je zgled za dirkališča;
  - robna črta je že v teksturi ceste (`edgeLinePaint` v `js/world.js`).
- **Koraki:**
  - E0: orodje za robove, asfalt, stranske ceste iz OSM (križišča, zapore) in črte po državah; kompleti po državah.
  - E1: Nürburg, Pikes Peak, Suzuka, Tianmen. Najprej slike pred in po s kamere za avtom na strani Odločitve; ostale skupine šele po odgovoru.
  - E2–E4: skupine 2–4.
  - Nove proge, ki še niso na `main`, dobijo stranske ceste in črte po združitvi, v istem paketu (predelava prog iz PR). Proge, ki se šele začnejo (A12–A19, Koli …), jih imajo od začetka (postopek).
- **Telefon** (ocena):
  - predmeti kot primerki: +1–3 klici na progo;
  - obraba asfalta: 0–2 klica (senčilnik in nalepke na isti mreži);
  - stranske ceste v isti mreži kot cesta po kosih (kot zdaj `stubGeo`): 0 novih klicev, ~10–30 tisoč oglišč na progo; zapore in znaki kot primerki kompletov;
  - črte v teksturi ceste: 0 klicev in 0 oglišč.
- **Seje:** ~9 za orodje in komplete (od tega ~2 za stranske ceste in ~1 za črte), ~1 na progo brez stranskih cest (10 prog), ~0,8 na progo, ki jih že ima (5 prog).
- **Datoteke:**
  - `tools/proga-podatki.py` (ograje, zidovi, svetilke in stranske ceste iz OSM);
  - `js/world.js` (kompleti kot primerki, robniki, črte po državah, stranske ceste na progah brez njih);
  - `js/world-vrsic.js` (skupni pomočniki stranskih cest), `js/world-montreal.js` in graditelji pravih prog, ki stranske ceste že imajo;
  - `js/render.js` (obraba asfalta v senčilniku);
  - podatki v `js/tracks/<id>.js` (`sideRoads`).
- **Tveganje:**
  - klici risanja pri predmetih;
  - robniki dirkališč in stranske ceste ne smejo spremeniti vožnje in AI;
  - skupne pomočnike uporabljajo tudi testne proge in Great Alpine Road (na odločanju), zanje mora ostati vse enako: nova možnost ali nov graditelj, stara pot nespremenjena;
  - spori v `js/world.js`.

## E0, prvi kos: obraba asfalta in črte (PR #622, 10. 11. 2026)
- **Odločitev:** uporabnik 10. 11. 2026 ob ~01.40 v pogovoru z Matejem, izbira »Cesta in predmeti E0« (izjema od mirovanja računa jure.kopac26). Na `main` gre po uporabnikovem »ok« na slikah: uporabnik jih je potrdil 10. 11. 2026 ob ~03.30 (izbira »Ok, z oljno sledjo«, prek Mateja), oljna sled sredi pasu na odprtih cestah ostane.
- **Kaj prinese** (s kamere za avtom):
  - asfalt ni več enakomerno siv: proge vzdolž ceste (sled finišerja in prometa), prah in pesek ob robovih (barva po tleh države; na dirkališču je pas širši ob robu, kamor avti ne vozijo, na odprti cesti je tudi po sredini), odseki novejšega in starejšega asfalta z ravnim stikom čez cesto (cela širina ali en pas) in velike blede lise;
  - odprta cesta ima v vsakem pasu temno oljno sled med svetlejšima kolesnicama;
  - v zaviralnih conah so kaplje olja (dirkališče: ob idealni liniji; cesta: po pasovih);
  - barva črt je obrabljena: lise, kjer se vidi asfalt, okruški, rahlo umazana;
  - Livorno dobi sredinsko črto po italijanskih pravilih (bela, prekinjena, pred ovinki in skozi njih polna).
- **Česa namenoma ni:** temnejše linije vožnje (tema »zgumirana linija«, partyslo, `docs/zgumirana-linija.md`). Krpe, zalite razpoke in guma na idealni liniji dirkališč so od prej (`roadWear` v `js/world.js`) in ostanejo.
- **Kako:** modul `js/world-cesta.js` (`World.cesta`), ki ga kliče `finish()` v `js/world.js` takoj za `roadWear`. Graditeljev ne spreminja:
  - mrežja ceste najde po graditeljevem materialu asfalta (`out.asphaltMat`) in UV-jih ceste (u = odmik + polovica širine, v = metri vzdolž, oboje deljeno z 8);
  - mrežja črt najde po svetlih barvah oglišč na ploskvi ceste, merjeno ob samih mrežjih ceste (zato tudi v nagnjenem ovinku); kjer je v mrežju črt še kaj (žlebovi na Chapman's Peaku), se obrabi samo svetla barva;
  - vsako tako mrežje dobi kopijo materiala z obrabo v senčilniku; kar si material deli z drugim (boksi, izletne cone), ostane graditeljevo;
  - podatke o krogu bere senčilnik iz teksture 2048 × 1 (odmik idealne linije, zaviranje iz hitrostnega profila, ton odseka levo in desno, polovica širine), vzorce iz enega šuma 128 × 128;
  - mokra cesta, sence in lesk asfalta delujejo kot prej (`applyRoad` in `asphaltLook` v `js/render.js` material najdeta po teksturi asfalta); v dežju prah ob robu potemni skupaj s cesto (moker prah je temen, pas skoraj izgine).
- **Proge:** tabela `PROGE` v modulu. Dirkališča: Spa, Nürburg, Štajerska, Bathurst, Montréal. Odprte ceste: Livorno, Tianmen, Rio do Rastro, Chapman's Peak, Bâlea, Los Caracoles. Nova prava proga dobi videz z eno vrstico v `PROGE` (`DIRKA` ali `CESTA` in barva prahu).
  - Brez videza ostanejo: Pikes Peak (svoja, podrobna cesta; videz dobi v drugem kosu, spodaj), Katu-Jaryk (makadam), Harju (gre v test, ko je Koli na `main`), Suzuka in Irohazaka (zamrznjeni), Medvode in druge proge odprtih PR (vrstico dobijo po združitvi).
  - Za testne proge in proge na odločanju `World.cesta.finish` takoj vrne: svet je zgrajen kot prej.
- **Črte po državah:** tabela `CRTE` in `World.cesta.crte(T, { r, pred })` v modulu: barva robne in sredinske črte, dolžina črtice in presledka, ali je polna črta dvojna, in potek sredinske črte po vzorcih proge (`at[i]`: 0 nič, 1 črtica, 2 polna pred ovinkom, ostrejšim od `r`, in skozenj). Dolžine črtic so državni standard za cesto zunaj naselja, kolikor ga povedo javna pravila; ko graditelj po njih prvič riše, se preverijo znova (zdaj po tabeli riše samo Livorno). Pregled 10. 11. 2026:

| Proga | Rob | Sredina | Stanje |
|---|---|---|---|
| Livorno, Italija | bela | bela, črtica 4,5 m in presledek 7,5 m, polna enojna | robni črti sta bili, **sredinska je dodana v tem kosu** |
| Tianmen, Kitajska | bela | rumena | graditelj jo riše, ustreza |
| Rio do Rastro, Brazilija | bela | rumena, polna dvojna | ustreza |
| Los Caracoles, Čile | bela | rumena, polna dvojna (rumena, kjer sneži; drugod po državi bela) | ustreza |
| Chapman's Peak, Južna Afrika | rumena | bela, polna dvojna | ustreza |
| Bâlea, Romunija | bela | bela | ustreza |
| Pikes Peak, ZDA | bela | rumena, polna dvojna | ustreza (svoja cesta) |
| Spa, Nürburg, Štajerska, Montréal, Bathurst | bela | brez (dirkališče) | ustreza; Bathurst je preostanek leta javna cesta, sredinsko črto preverimo v E1 |

- **Telefon** (izmerjeno s `tests/browser/perf.test.mjs`, NIZKA, prej → potem): Spa 181 klicev risanja in 442 tisoč oglišč → enako; Tianmen 146 in 394 → enako; Livorno 141 in 288 → 141 in 289 (sredinska črta v istem mrežju kot robni; na celi progi 15,7 tisoč oglišč več, 1,5 %). Prstni odtisi svetov (`tests/golden/world.json`) so enaki, razen Livorna. Senčilnik ceste prebere 4 teksture več na piko ceste (profil in trikrat šum); gradnja sveta traja ~40–50 ms dlje.
- **Test:** `tests/browser/cesta.test.mjs` (opis v `tests/README.md`).
- **Slike prej in potem** (kamera za avtom, levo prej, desno potem, na vsaki progi dva kadra, obrezana na cesto): `docs/realizem/e0-spa.jpg` (dirkališče), `docs/realizem/e0-tianmen.jpg` (odprta cesta), `docs/realizem/e0-livorno.jpg` (sredinska črta: prekinjena na ravnini, polna skozi ovinke).
- **Kaj od E0 še manjka:** po drugem kosu v točki »Predaja« razdelka »E0, drugi kos« (spodaj).

## E0, drugi kos: rob ceste in talne oznake (PR #622, na `main` od 11. 11. 2026; uporabnikov »ok« na slikah 10. 11. ob ~12.30)
- **Naloga:** Matej (jure.kopac26) po uporabnikovi odločitvi 10. 11. 2026 ob ~01.40 (izboljšava grafike): nalomljen rob asfalta na odprtih cestah, talne oznake po državah, Pikes Peak v tabeli `PROGE`. Drugi kos je v ločenih commitih iste veje (rob, Pikes Peak, oznake ter testi, slike in dokumenti). Na `main` gre po uporabnikovem »ok« na slikah; če ga ne potrdi, se ti commiti vrnejo (`git revert`, v obratnem vrstnem redu) in prvi kos ostane.
- **Kaj prinese** (s kamere za avtom):
  - **rob asfalta na odprtih cestah** (Tianmen, Rio do Rastro, Chapman's Peak, Bâlea, Los Caracoles, Livorno, Pikes Peak) ni več ravna črta: vzdolž roba so drobni ugrizi v pasu zunaj robne črte, ponekod globok odlom skozi robno črto, ki se odlomi skupaj z asfaltom; v ugrizih je gramoz graditeljeve bankine (njena tekstura in barva na tistem mestu; Livorno bankine nima: suha zemlja ob cesti), rob asfalta je malo temnejši. Število odlomov je po progi: razgledni cesti (Tianmen, Chapman's Peak) malo, gorske ceste in ceste tovornjakov (Bâlea, Los Caracoles) več. Čist rob ostane na mostovih, v galerijah, ob ustjih stranskih cest in kjer ga določi graditelj (`out.cestaRob`: Livorno na mostovih, Pikes Peak ob ustjih). V dežju gramoz potemni z mokro cesto;
  - **oznake čez cesto** na Livornu po italijanskih pravilih (pravilnik k zakonu o cestnem prometu, čl. 144 in 145): prehodi za pešce (pasovi 0,5 m s presledki 0,5 m, dolgi 2,5 m v naselju in 4 m na glavni cesti; skozi prehod ni sredinske črte), stop črte (0,5 m čez pas) in črte za prednost (trikotniki 0,5 × 0,6 m s konico proti vozniku, ki daje prednost). Kraji so vozlišča OpenStreetMap na cestah kroga (`LV_DATA.onRoad` iz `tools/livorno/build.py`): 28 prehodov, 4 stop črte in 3 črte za prednost. OSM ima kraj znaka, ne njegove smeri: pas orodje določi po bližjem koncu poti OSM (križišče, ob katerem znak stoji);
  - **Pikes Peak** v tabeli `PROGE`: obraba asfalta, prah granita ob robu in nalomljen rob. Njegove kolesnice, krpe, zalite razpoke in obledele črte so graditeljeve (v istem mrežju kot cesta) in ostanejo.
- **Sredinska črta:** vse odprte ceste iz `PROGE` jo imajo (tabela pri prvem kosu). **Bathursta ni bilo mogoče preveriti:** strežnik OpenStreetMap iz okolja seje ni dosegljiv, v repozitoriju podatka ni; ostane kot dirkališče z robnima črtama, preverba ostane za E1 (samo odprti viri).
- **Česa namenoma ni:** temnejše linije vožnje (zgumirana linija, partyslo). Vožnja, fizika in AI so enaki: oglišča ceste se ne premaknejo.
- **Kako** (`js/world-cesta.js`):
  - rob je v senčilniku ceste (`EDGE`): koliko je asfalta od roba mrežja odlomljenega, iz šuma in iz druge vrstice profila kroga (na odprtih cestah 4096 × 2: jakost roba levo in desno, 4 bite, in barva bankine po kosih kroga; `robData()`), mehko čez piko ali dve glede na razdaljo;
  - robne črte so v svojih mrežjih: ta dobijo atribut `ceSO` (mesto oglišča na cesti: metri vzdolž in od levega roba, kot UV-ji ceste), senčilnik črt z istim `EDGE` zavrže piko, kjer je asfalt odlomljen. Zato se prstni odtisi svetov šestih odprtih cest spremenijo (`tests/golden/world.json`); Pikes Peak ima črte v mrežju ceste in ostane enak;
  - nastavitve v `PROGE`: `rob` (m, pas zunaj robne črte za drobne ugrize), `robV` (m, globina redkih odlomov), `kRobV` (koliko jih je), `bankina` (barva gramoza, kjer graditelj nima bankine);
  - iskanje mrežij ceste je strpnejše (oglišča tudi med vzorci, 80 % na svojem mestu): Pikes Peak ima v mrežju ceste krpe in črte; `V.paint`: obraba velja samo za asfalt (atribut `paint` = 0);
  - `World.cesta.precne(T, C, items, o)` vrne kose oznak po pravilih države (`CRTE`: `prehod`, `stop`, `prednost`; Italija po pravilniku, druge države privzeto) in odseke brez sredinske črte; graditelj jih položi v svoje mrežje črt (Livorno: `layX`, kot so položene črte).
- **Telefon:** noben nov klic risanja in nobeno novo oglišče, razen oznak na Livornu (+2.095 oglišč v obstoječih mrežjih črt, 0,2 % oglišč njegovega sveta). Profil kroga odprtih cest je 4096 × 2 (32 KB namesto 8 KB); senčilnik ceste na odprtih cestah prebere 2 teksturi več na piko (druga vrstica profila, gramoz), senčilnik črt 5 (profil dvakrat, šum trikrat; črt je na sliki malo).
- **Test:** `tests/browser/cesta.test.mjs` (rob na Tianmenu, tudi na NIZKA; Pikes Peak; oznake na Livornu; opis v `tests/README.md`).
- **Slike prej in potem** (kamera za avtom, levo prej z glavo `f124715`, desno potem): `docs/realizem/e0-rob.jpg` (Bâlea: rob v običajnem pogledu in povečan), `docs/realizem/e0-oznake.jpg` (Livorno: dva prehoda, črta za prednost, prehod in stop črta v nasprotnem pasu ob ovinku), `docs/realizem/e0-pikes.jpg` (Pikes Peak na 2,85 in 6 km).
- **Predaja** (10. 11. 2026 ob ~11.30; seja se ustavi po Matejevem navodilu, E0 nadaljuje nova seja):
  - **Narejeno:** vse tri naloge drugega kosa v ločenih commitih veje `realizem/e0-crte-asfalt`: `fd5c6d3` (rob), `b150529` (Pikes Peak), `8b70c88` (oznake na Livornu), `81f381d` (test, prstni odtisi, slike, opis) in commit s to predajo (samo dokumenti). Lokalno zeleno: `cesta.test.mjs` (15 preverb), prstni odtisi svetov (šest odprtih cest posodobljenih), varovalo testnih prog, `node tools/stamp.js --check`, `npm run test:related` (18 od 18). Telefon (`perf.test.mjs`, NIZKA, klici risanja in oglišča na sliko), prej z glavo `f124715` in potem enako: Spa 181 in 442 tisoč, Tianmen 146 in 394, Rio do Rastro 156 in 343, Chapman's Peak 141 in 419, Bâlea 156 in 362, Los Caracoles 155 in 269, Livorno 141 in 289, Pikes Peak 117 in 277; čas JS na sliko se razlikuje v obe smeri (šum meritve).
  - **Po predaji opravljeno:** (1) uporabnikov »ok« na slikah drugega kosa je dan (10. 11. 2026 ob ~12.30, »Ok, na main po vrsti«); (2) pot na `main`: PR #622 je na `main` od 11. 11. 2026 (squash `244f7cd7`, krog testov na GitHubu zelen, spori s `main` razrešeni s spojem svežega `main`). **Manjka:** (3) preverba sredinske črte na Bathurstu (OSM iz okolja seje ni bil dosegljiv; samo odprti viri); (4) ostalo od E0: orodje za robove in robnike, stranske ceste iz OSM s križišči in zaporami, kompleti predmetov po državah. Oznake čez cesto ima samo Livorno: `World.cesta.precne` je pripravljen za vse države, graditelj potrebuje kraje, kot jih ima Livorno v `LV_DATA.onRoad`.
  - **Kako se preveri:** `node tests/browser/cesta.test.mjs` (~7 min); `WORLD_ONLY=tianmen,rastro,chapman,balea,caracoles,livorno node tests/browser/world.test.mjs [--update]`; `PERF_ONLY=spa,tianmen,rastro,chapman,balea,caracoles,livorno,pikes node tests/browser/perf.test.mjs`; `npm run test:related`; v igri `index.html?proga=balea` (rob), `?proga=livorno` (prehodi ~300 m in ~1,9 km od štarta), `?proga=pikes`.

## E, stranske ceste samo za videz: Livorno prvi (PR #657, v delu od 11. 11. 2026)
- **Naloga:** paket E na vseh pravih progah, ena seja (jure.kopac26); začetek prestavljen s 15. 11. na 11. 11. 2026 (naloga koordinacije). Pred `main` slike zdaj in potem (kamera za avtom; Livorno in Spa) in uporabnikov »ok«.
- **Zasnova:** obstoječe stranske ceste (`def.sideRoads`, `Track._buildStubs` v `js/core.js`, `stubGeo` in `stubProps` v `js/world-vrsic.js`) so vozne in del modela proge (fizika, tekmeci), table na zaporah imajo napise. Paket E jih ne širi: njegove stranske ceste so **samo videz zunaj črte ograje**, z novim graditeljem `World.cesta.stranske` v `js/world-cesta.js`, ki ga proga pokliče sama (proge brez klica, tudi testne in na odločanju, ostanejo enake). Model proge (`T.bl`, `T.br`, `query`, tekmeci) ostane nedotaknjen; zapore so brez napisov.
- **Podatki:** `api.openstreetmap.org` iz okolja seje 11. 11. ni dosegljiv (omrežna pravila okolja; gostitelja odobri uporabnik, vpraša ga Matej). Izmišljenih cest ni: prvi je **Livorno, Italija**, ki ima izvleček OSM v repozitoriju (`tools/livorno/livorno.json`, prenos 2. 11. 2026). Ostale prave proge dobijo stranske ceste, svetilke in znake po prenosu (koda in seznam: proga, okvir, kaj iz OSM; tudi znaki STOP in prednost na stranskih cestah, ki jih izvleček Livorna nima); do takrat deli brez OSM (robniki, vrste ograj, križišča na progah s `sideRoads`).
- **Izvoz za Livorno** (`side_roads()` v `tools/livorno/build.py`; `python3 -I tools/livorno/build.py world`) v `js/data/livorno.js`: `side` `[s, stran (1 desno, -1 levo), razred (0 dovoz ali kolovoz, 1 ulica, 2 terciarna, 3 sekundarna ali glavna), širina (m), enosmerna, konec (0 zbledi v teren, 1 se priključi drugi od teh cest), [x, z, …]]` (prvih ~60 m od križišča, brez imen), `lamps` `[x, z]` (169 svetilk do 30 m) in `stops` `[s, stran, razdalja od osi, nadstrešek]` (48 postaj). Od 212 priključkov izvlečka jih ostane **128** (59 dovozov, 59 ulic, 3 terciarne, 7 glavnih; skupaj 7,3 km; datoteka 195 → 210 KB). Odpadejo: poti, pešpoti in stopnice (37); ceste, ki se ne oddaljijo od roba ali so krajše od 14 m (24); priključki na mostovih (4) in ob štartu (3); polovici krožišča, ki ga proga izravna (2); zanke, odstavni pasovi in vzporedno vozišče (4); šibkejši od dveh priključkov na isti strani, ki bi se zlila (6); ceste, prekratke do stika z drugo (4). Cesta, ki se vrne k drugemu delu kroga, se konča 8 m pred njim; cesta, ki zapelje na drugo izvoženo cesto, se konča na njej (11 koncev s `konec` 1). Širina: `lanes` ali `width` iz OSM, sicer po razredu (3,6 / 5,2 / 6,4 / 7,2 m; enosmerna × 0,8). `s` so metri po sredinski črti igre; graditelj ustje poišče iz geometrije (`T.nearestIdx`), ne iz `s`.
- **Graditelj `World.cesta.stranske(T, ceste, o)`** (`js/world-cesta.js`; v kodi od 12. 11. 2026, Livorno ga kliče v `js/world-livorno.js`; vrne `n`, `tek`, `ustja`, `krogi`, `robovi`, `asfalt`, `predmeti`, `prekinjena`):
  - ustje iz geometrije (kjer pasovi traku zapustijo glavno cesto; cesta, ki z nje ne pride ali od nje ostane manj kot 6–8 m, odpade: Livorno zgradi **118 od 128**); trak s prerezi na ~3 m, raven počez, položen na teren, ob straneh krilo v barvi tal; konec 0 zbledi v barvo tal;
  - asfalt v svojih kosih s kopijo materiala asfalta (`mesh.userData.stranska`; `finish()` iz E0 jih ne šteje ne za cesto ne za črte); zapore, črte stranske ceste, svetilke in postaje gredo v kose okolice (0 klicev risanja);
  - zid ob cesti se na ustju odpre (`tek`), robna črta glavne ceste je čez ustje prekinjena (`prekinjena`), na črti ograje stoji **zapora brez napisov** (nevidna ograja ostane, model proge je nedotaknjen); na stranski cesti stop črta (ulice) ali trikotniki (terciarne in glavne) po `CRTE.Italija`, pri dovozih nič (privzetek do prenosa OSM);
  - ustja gredo v `out.cestaRob` (čist rob asfalta iz E0); drevesa, hiše, zidovi iz OSM in gledalci se umaknejo s ceste (`krogi` → `exclPush`); skupnega generatorja `R` graditelj ne kliče (okolica se ne preseje).
- **Vrsta zapore** (`SC.predmeti(get, zapora)`; izbere uporabnik, vprašanje s slikami): 1 rdeče-bele plastične pregrade (privzeto, priporočeno), 2 sivi betonski bloki, 3 bale slame z rdeče-belim trakom. Do izbire ostane začasno stikalo `?zapora=<1|2|3>` v `js/world-livorno.js`; po izbiri se izbriše.
- **Svetilke in postaje** (`World.cesta.svetilka`, `World.cesta.postaja`: skupna pomočnika samo za videz, brez napisov): Livorno postavi **146 od 169** svetilk in **47 od 48** postaj iz OSM. Svetilka, ki bi stala znotraj ograje, gre 1,0 m za črto ograje; odpadejo tiste na stranski cesti, v hiši, ob mostu, v morju in bližje kot 6 m drugi. Postaja stoji za ograjo (nadstrešek +1,3 m, drog s prazno tablo +1,0 m), ob ustju se umakne do 18 m vzdolž ceste.
- **Obremenitev** (12. 11. 2026): Livorno 141 → **143** klicev risanja in 288 → **295** tisoč oglišč na sličico (svet 1,03 → 1,09 milijona oglišč; meja ~300 in ~900 tisoč); Spa enak (181 klicev, 442 tisoč).
- **Kako se preveri:** `node tests/browser/cesta.test.mjs` (preverjanje stranskih cest: trak skozi vsako ustje, število svetilk in postaj, model proge enak kot pri progi brez sveta), `WORLD_ONLY=livorno node tests/browser/world.test.mjs`, `PERF_ONLY=livorno,spa node tests/browser/perf.test.mjs`, `npm run test:related` (prej `git fetch origin main`), `node tools/stamp.js --check`. Slike zdaj in potem: `node tools/shot.mjs livorno --m 270,16515 --lezece --pred main [--q zapora=2]` (`--q` doda poizvedbo v naslov igre).
- **Predaja novi seji (12. 11. 2026):** graditelj, zapore, svetilke, postaje in testi so v veji `realizem/e-cesta-predmeti` (PR #657, osnutek). Na `main` **ne brez uporabnikovega »ok«** na slikah zdaj in potem. Vprašanje `realizem-e-livorno` je od 12. 11. 2026 ob 14.51 na strani Odločitve 2 (možnosti 1–3 so vrsta zapore in hkrati »ok« za `main`, 4 pomeni še ne); odgovor prebere seja ob 23.20 (`docs/vprasanja.md`, »Odgovor«).
  - *Kaj naslednje:* (1) po uporabnikovi izbiri zapore izbriši stikalo `?zapora` (in neizbrani vrsti, če ju ne želi za druge proge); (2) po »ok« PR vpiši v `docs/vrsta.md`, do `main` ga vodi seja Združevanje; (3) ostale prave proge dobijo stranske ceste, svetilke in postaje po prenosu OSM (spodaj): izvoz po vzoru `side_roads()` v `tools/livorno/build.py`, v graditelju proge klic `World.cesta.stranske` kot v Livornu (`SC.tek` pri zidu in robni črti, `SC.robovi` pri bankini, `SC.asfalt`, `SC.predmeti`), za vsako progo `drzava` iz `CRTE`.
  - *Orodja v novi seji:* `npm ci --silent` (brez `playwright install`), `pip install scipy` za `build.py world`; dolge teste poženi v ozadju.
  - *Prenos OSM, ko bo gostitelj odobren* (`api.openstreetmap.org/api/0.6/map?bbox=…`, `tools/proga-podatki.py`): za vsako pravo progo (Spa, Nürburg, Štajerska, Bathurst, Montréal, Tianmen, Rio do Rastro, Chapman's Peak, Bâlea, Los Caracoles, Pikes Peak, Katu-Jaryk, Harju) ceste za vozila do 60 m od proge, `highway=stop`, `give_way`, `traffic_signals`, `crossing`, `street_lamp`, `bus_stop` in `barrier=*`; za Livorno še `stop` in `give_way` na stranskih cestah (izvleček jih ima samo na cestah kroga). Seznam z okviri še ni narejen (predlog okvira: proga + ~100 m).
  - *Odprte odločitve:* (1) izvozna cesta severno od zravnanega krožišča (terciarna, [1233, 251] → [1225, 194]) v podatkih ne doseže kroga, zato tam križišča ni (podaljšanje bi bila izmišljena geometrija); (2) stop črta ali trikotniki po razredu ceste je privzetek do prenosa OSM; (3) vrsta zapore (zgoraj).
