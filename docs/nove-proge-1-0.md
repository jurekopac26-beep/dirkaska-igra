# Nove proge za 1.0: prvih 11, del 2, del 3 in del 4 (načrt, podatki poti, vrstni red, predaja)

Seznam je potrdil uporabnik 7. 11. 2026 ob ~21.20 v pogovoru z Matejem (tabla #382, komentar 6712589851; predlog s podrobnostmi: komentar 6709785463). Pravila za vse nove proge za 1.0 (1–5 km, merili zavitosti in »do 60 m ob cesti«, izletna cona, mestne proge) so v `CLAUDE.md` (»Ena proga na državo«) in v `docs/proge-po-drzavah.md`, razdelek »Nove proge za 1.0«. O seznamu 50 prog (vprašanje `nove-proge-1-0-50`) se uporabnik odloča po delih (`docs/proge-po-drzavah.md`, »Nove proge za 1.0«): 11 prog s čakanja je potrdil 8. 11. 2026 (razdelek »Del 2« spodaj), druge proge na čakanju se do njegove odločitve ne začnejo. Osem dirkališč izven Evrope je potrdil 8. 11. 2026 ob 20.45 (razdelek »Del 3« spodaj). Pet kratkih prog izven Evrope (do 1 km) je izbral 8. 11. 2026 ob ~22.45 v pogovoru seje računa biketraveler (razdelek »Del 4« spodaj).

## Proge

Meritve so iz seje seznama (OSM, točke na 5 m, kot `tools/proge-pregled.js`). Obremenitev je ocena po podobni progi iz `tests/golden/perf.json` (meja ~300 klicev, ~900 tisoč oglišč).

| Linija | id | Proga | Vrsta, dolžina | Zavitost | Do 60 m ob cesti | Posebnosti |
|---|---|---|---|---|---|---|
| A1 | `silkeborg` | Silkeborg, Danska | dirkališče, 2,3 km | 789 °/km, ravnine 48 %, 16 ovinkov | trava, peščene sipine in resava, grmovje, gozd, ograje, boksi, tribune | izletna cona povsod; ~210 klicev / ~560 tisoč |
| A2 | `kagerod` | Kågeröd, Švedska | dirkališče, 2,1 km | 589 °/km, 42 %, 8 ovinkov | gozd, reka, stavbe | ime po vasi, ne po gradu, po katerem se imenuje dirkališče |
| A3 | `sosnova` | Sosnová, Češka | zelo kratka za tovornjake, 1,7 km | 978 °/km, 33 %, 14 ovinkov | travniki, potoki, elektrovod, stavbe, gozd | |
| A4 | `pembrey` | Pembrey, Wales | zelo kratka za tovornjake, 2,2 km | 712 °/km, 59 %, 10 ovinkov | trava, ograje, stavbe, gozd | nekdanje letališče; ovinki z imeni oseb ali znamk dobijo opisna imena |
| A5 | `kildare` | Kildare, Irska | izvenserijska, reli kros, 1,2 km asfalta in makadama | 729 °/km, 47 %, 10 ovinkov | stavbe, tribuna, elektrovod | ime po grofiji; imena ovinkov (znamke, podjetja) opisna |
| A6 | `bikernieki` | Biķernieki, Latvija | dirkališče v gozdnem parku Rige, 3,5 km | 473 °/km, 60 %, 13 ovinkov | gozd, ograje, trava, tribune, stolpi, mokrišča | ograje do 3 m na 43 % (mehke) |
| B1 | `izoard` | Izoard, Francija | gorska, zadnjih 5 km severne strani do prelaza | 1095 °/km, 29 %, 38 ovinkov, 21 lasnic | macesnov in borov gozd, potoki, elektrovod, koča | odprta cesta navzgor; koča in spomenik brez imen |
| B2 | `sacalobra` | Sa Calobra, Španija | gorska, 5 km | 941 °/km, 36 %, 32 ovinkov, 14 lasnic | apnenčaste skale in stene, podporni zidovi, 2 razgledišči, potok, makija | »kravatni vozel«: cesta gre pod mostom pod samo sabo |
| B3 | `kotor` | Kotor, Črna gora | gorska, 5 km serpentin nad Kotorskim zalivom | 879 °/km, 13 lasnic | gozd; v OSM malo predmetov | uporabnik (7. 11.): do 60 m dodaj, kar je res ob cesti: podporne zidove, razgledišča, pogled na zaliv |
| B4 | `zandvoort` | Zandvoort, Nizozemska | dirkališče v sipinah, 4,3 km | 367 °/km, 56 %, 9 ovinkov | sipine z grmovjem, ograje, voda, tribune, stavbe | dva nagnjena ovinka; ovinki po osebah dobijo opisna imena |
| B5 | `london` | London, Anglija | mestna, 1,9 km: Whitehall, Trafalgarski trg, nabrežje Temze, Westminster | 338 °/km | stavbe, trgi, nabrežje, mostova | izjema od pravila ena proga na državo (spodaj) |

**London** (uporabnik 7. 11. ob ~21.20): znane stavbe samo kot generične oblike, brez napisov, logotipov, kipov in imen resničnih oseb, tudi steber na Trafalgarskem trgu; obremenitev v mejah, zato preprosto. Izletna cona zanj ne velja (mestne proge, `CLAUDE.md`). Vzor je mestna proga Zürich, Švica (PR #465, biketraveler: nabrežja, mostova, generične stavbe po OSM v `js/world-zurich.js`); ko je na `main`, London uporabi njene gradnike.

## Podatki poti: `tools/<id>/config.json`

Za vsako progo je pripravljena nastavitev za `tools/proga-podatki.py` (navodila na vrhu orodja, vzor `tools/livorno/`, `docs/proga-livorno.md`). Točke `route` so iz poti, ki jo je seja seznama preverila v OSM, na vsakih 60–150 m; opomba pove vrsto ceste v OSM, id poti in razdaljo od štarta. Polja `geoRoads`, `geoWater`, `marks` in `places` so prazna: izpolni jih seja proge, samo z zemljepisnimi imeni (imena ovinkov in ulic po osebah, podjetjih ali dirkališčih ne gredo v izhod).

Seja proge pred korakom `data` preveri:
- **Dirkališča:** orodje vozi samo po cestah iz `DRIVE`, kamor `highway=raceway` še ni vpisan. Prva seja dirkališča (Silkeborg) ga doda in preveri, da se izhoda Livorna in Hakoneja ne spremenita.
- **Smer in štart:** pri krogih velja smer prave dirke, štart je na ciljni črti. Seja seznama je smer vzela iz OSM, zato jo je treba preveriti in točke po potrebi obrniti.
- **Točke brez ceste do 30 m** (opomba »no drivable way«) in točke na stranskih cestah ali v boksih: pot preveri na sliki (korak 4 navodil orodja).
- **Izoard:** ena točka blizu prelaza je bliže kolovozu kot cesti.
- **Sa Calobra:** cesta gre sama pod sabo; preveri `over` (mostovi) in višine.

## Kako narediti progo

- Pravila za novo progo so v `CLAUDE.md` (ime, pravna varnost, obremenitev, meni, postopek), v `docs/nove-proge.md` (»Seznam pravil« in »Recept«) in v `docs/proga-livorno.md` (sklopi 2–5: proga v igri, okolica do 60 m, obremenitev, meni in opisi). Ob koncu zaženi še `node tools/proge-pregled.js` in v `docs/proge-pregled.md` dopiši vrstico »Do 60 m ob cesti«.
- Graditelje ponovno uporabi: prelazi `js/world-prelaz.js` (Bâlea), dirkališča z boksi (Spa, Bathurst), ulične proge (Newcastle). Kar potrebuje samo ena proga, gre pod zastavico, ne v kopijo graditelja.
- **Vsaka proga ima svojo sejo** (Opus, napor max), svojo vejo `nove-proge/<id>` in osnutek PR, odprt ob začetku dela (naslov »Nova proga: <Kraj, Država>«). Ko so povezani testi lokalno zeleni, se PR vpiše na konec vrste in ostane osnutek.
- Seja se začne z »Naredi progo `<id>` po docs/nove-proge-1-0.md (partyslo)«. Pri ~300 tisoč žetonih napiše predajo v opis svojega PR (stanje, kaj manjka, kako testirati) in delo nadaljuje nova seja.

## Vrstni red in seje

- **Liniji:** A so dirkališča (A1–A6), B so gorske ceste, Zandvoort in London (B1–B5).
  - V vsaki liniji teče hkrati ena seja. Skupaj sta na računu partyslo največ 2 seji s kodo (`CLAUDE.md`, Seje).
  - Kratki dirkališči sta prvi, da se pot za dirkališča (`raceway`, boksi) uredi na majhni progi. Izoard gre prvi v liniji B, ker ima graditelja prelazov že pripravljenega.
- **Naslednja seja:** ko je proga končana, njena seja pošlje VSE SEJE 2 (`session_01WbgGzv4TzuAXEWDMgtBJpF`) sporočilo »<id> končana, naslednja v liniji: <id>«. VSE SEJE 2 nato zažene naslednjo sejo, ko je prostor.
- **Vrsta za `main`:** proge so vedno zadnje. Najprej gre skupina »Proge« (Killar, Hakone, Medvode), za njo nove proge v skupinah po 3–4 (`docs/vrsta.md`).
- **Predlog skupin:** N1 = Silkeborg, Kågeröd, Izoard in Sosnová; N2 = Pembrey, Kildare, Sa Calobra in Kotor; N3 = Biķernieki, Zandvoort in London.
  - Vodja skupine je seja, ki konča zadnjo progo skupine. Naredi zbirno vejo `zbirna/nove-proge-N<k>` po pravilih vrste.
  - Skupine lahko spremenita uporabnik in Matej.
- **Stanje** je v odprtih PR (veja `nove-proge/<id>`) in v `docs/vrsta.md`. Ta datoteka se med delom ne spreminja, da se veje ne skregajo; spremeni se samo, če se spremeni načrt.

## Del 2: 11 prog s čakanja

Uporabnik je 8. 11. 2026 ob 15.59 (prek Mateja, tabla #382, komentar 6723046786; zapis v `docs/proge-po-drzavah.md`, »Nove proge za 1.0«) potrdil 11 prog s čakanja na seznam 50. Njegove opombe: Llogara — najbolj zavit odsek do 5 km; Ngorongoro — kamnito tlakovanje; Seul — edina mestna proga, brez lasnic. Načrt je pripravila seja »Nove proge 1.0 del 2« (partyslo, 8. 11.). Pravila in postopek so enaki kot v delu 1 (»Podatki poti«, »Kako narediti progo«).

### Proge

Meritve so iz OSM (8. 11. 2026), točke na 5 m kot `tools/proge-pregled.js`, v smeri vožnje. Izbran je najbolj zavit odsek do 5 km na cesti, ki jo je potrdil uporabnik; odstopanja so v Posebnostih. Višine so iz koraka `data` orodja (Copernicus DEM). Izletna cona je delež dolžine s pregrado do 3 m od asfalta v OSM (merilo v `docs/proge-po-drzavah.md`, »Izletna cona«); v višinskem modelu ni nobena proga na ozkem grebenu (strmo navzdol na obeh straneh: 0 %). Obremenitev je ocena po podobni pravi progi iz `tests/golden/perf.json` (klici risanja / oglišča; meja ~300 / ~900 tisoč).

| Linija | id | Proga | Vrsta, odsek | Zavitost | Do 60 m ob cesti | Posebnosti |
|---|---|---|---|---|---|---|
| A7 | `dades` | Dadès, Maroko | gorska, 3,2 km ceste RR704: serpentine z dna doline in nad sotesko | 985 °/km, ravnine 21 %, 26 ovinkov, 4 lasnice | gole skale in stene soteske, reka s polji, nizki zidovi, 10 razgledišč, hoteli in restavracije na vrhu serpentin | izbrana nova proga Maroka (v igri je Marrakesh); odsek iz predstavitve (najbolj zavitih 3 km: 1014 °/km) |
| A8 | `santoantao` | Santo Antão, Zelenortski otoki | gorska, 5 km tlakovane ceste EN1-SA-01 po grebenu Delgadim proti Ribeiri Grande | 938 °/km, 28 %, 45 ovinkov, 6 lasnic | travnato in grmovnato vulkansko pobočje, skale, sedlo z dvema razglediščema; brez stavb | tlakovana (`surface=sett`), dvosmerna; predstavitev je pokazala srednji del ceste (628 °/km), severni greben je bolj zavit |
| A9 | `ngorongoro` | Ngorongoro, Tanzanija | spust, 3 km enosmerne tlakovane ceste z roba kraterja do vznožja stene | 538 °/km, 41 %, 14 ovinkov, 1 lasnica | travnata in grmovnata pobočja kraterja, potok, skale, vhod z zapornico, razgledišče; dno z jezerom v daljavi | kamnito tlakovanje (OSM `sett`, `smoothness=bad`, 25 km/h); samo navzdol, brez nasprotnega prometa; zadnjih 1,2 km ceste je ravnina po dnu, zato ni v odseku; živali po `docs/nove-proge.md` (proga 8) |
| A10 | `ella` | Ella, Šrilanka | gorska, 4 km ceste A23 po serpentinah iz doline do Elle | 805 °/km, 22 %, 29 ovinkov, 4 lasnice | gozd in čajni nasadi, hiše in gostišča, potoki, razgledišče | levi promet (`leftHand`, kot Chapman's Peak), dvosmerna; vožnja navzgor |
| A11 | `espinazo` | Espinazo del Diablo, Mehika | gorska, 5 km stare ceste MEX 40 po grebenu do vasi El Palmito | 601 °/km, 41 %, 29 ovinkov, 1 lasnica | borov in hrastov gozd, skale, razgledišče, izogibališča, elektrovod, domačije, restavracija | odsek na grebenu, po katerem se proga imenuje, z odsekom iz predstavitve; bolj zavitih 5 km severneje (643 °/km) je v gozdu brez vrisanega do 60 m in ni na grebenu |
| B6 | `furka` | Furka, Švica | prelaz, 5 km zahodne strani: lasnice nad Ronskim ledenikom | 512 °/km, 47 %, 10 ovinkov, 7 lasnic | travniki in pašniki, skale, potoki, izogibališča, zaprt hotel, razgledišče, miljnik; ledenik od daleč | kot v predstavitvi (5 km, 510 °/km) |
| B7 | `gudauri` | Gudauri, Gruzija | prelaz, 5 km Gruzijske vojaške ceste skozi smučarsko naselje | 609 °/km, 38 %, 21 ovinkov, 6 lasnic | hoteli in apartmaji naselja, travniki, žičnice blizu štarta, elektrovod, potoki | cilj pred plazovno galerijo; serpentine pri Mleti imajo dolge krake (384 °/km, 64 % ravnin) |
| B8 | `medeu` | Medeu, Kazahstan | gorska, 5 km od drsališča po serpentinah na jez in po dolini navzgor | 413 °/km, 53 %, 15 ovinkov, 2 lasnici | smrekov gozd, travniki, skale, reka, drsališče s tribunami, jez, gondola, zidovi, kavarne, razgledišča, spomenika | najmanj zavita v delu 2 (najbolj zavitih 5 km: 426 °/km, a začne sredi zanke) |
| B9 | `llogara` | Llogara, Albanija | prelaz, 4 km stare ceste SH8: severne lasnice, prelaz in zgornji del spusta proti Jonskemu morju | 795 °/km, 37 %, 28 ovinkov, 7 lasnic | borov gozd, bunkerji, znamenje, spomenik, restavracije in hotel na prelazu, razgledišči, izvir | stara cesta, ne novi predor; 5 km bi imelo 47 % ravnin (opomba uporabnika), zato 4 km |
| B10 | `portomoniz` | Porto Moniz, Portugalska | gorska, zadnji 4 km ceste ER101 po strmem pobočju do kraja ob oceanu | 641 °/km, 45 %, 17 ovinkov, 8 lasnic | gozd in terase, bele hiše, kraj ob oceanu, razgledišča, znamenje, vodnjak | kot v `docs/nove-proge.md` (proga 5) |
| B11 | `seoul` | Seul, Južna Koreja | mestna, 2,5 km parkovnih cest čez hrib Namsan | 500 °/km, 43 %, 11 ovinkov, brez lasnic | gozd parka, staro mestno obzidje, razgledišča in paviljoni, knjižnica, šola, TV stolp na vrhu | edina mestna proga; ceste so enosmerne in v resnici samo za avtobuse, proga gre v smeri enosmernosti; pot iz `docs/zavite-proge.md` (korak 3) |

| id | Višina: štart → cilj | Izletna cona: pregrada ≤3 m | Obremenitev (ocena) |
|---|---|---|---|
| `dades` | 1753 → 1739 m (serpentine 1726 → 1827 m) | 15 %, obe strani 1 % (nizki zidovi v serpentinah) | ~150 / ~400 tisoč (Tianmen 146 / 394 tisoč) |
| `santoantao` | 658 → 358 m (najvišje 714 m) | 0 % | ~160 / ~400 tisoč (Rio do Rastro 156 / 343 tisoč) |
| `ngorongoro` | 2169 → 1820 m | 0 % | ~170 / ~450 tisoč (Pikes Peak 117 / 277 tisoč in črede živali) |
| `ella` | 683 → 992 m | 2 %, obe 1 % | ~170 / ~500 tisoč (Chapman's Peak 141 / 419 tisoč in hiše) |
| `espinazo` | 2032 → 1973 m (po grebenu, 1954–2038 m) | 0 % | ~150 / ~480 tisoč (Great Alpine Road 147 / 472 tisoč, gozd) |
| `furka` | 2047 → 2417 m | 6 %, obe 4 % (mostovi) | ~160 / ~380 tisoč (Bâlea 156 / 362 tisoč) |
| `gudauri` | 1954 → 2211 m | 1 % | ~180 / ~480 tisoč (Bâlea in naselje) |
| `medeu` | 1664 → 1961 m | 5 %, obe 1 % | ~180 / ~500 tisoč (Bâlea, gozd, jez, gondola) |
| `llogara` | 889 → 1033 m (prelaz) → 906 m | 1 % | ~160 / ~500 tisoč (Great Alpine Road, gozd) |
| `portomoniz` | 467 → 28 m | 2 % (hiše v kraju) | ~180 / ~550 tisoč (Chapman's Peak, ocean in kraj) |
| `seoul` | 185 → 241 m (vrh) → 106 m | 2 % (mestna, izjema ni potrebna) | ~200 / ~550 tisoč (Iroha 183 / 379 tisoč in mesto na obzorju) |

### Podatki poti

`tools/<id>/config.json` je pripravljen za vseh 11 kot v delu 1: točke na ~150 m, okvir ~1,5 km okoli odseka, `geoRoads`, `geoWater`, `marks` in `places` prazni. Seja del 2 je za vsako progo pognala vse tri korake orodja (`osm route data`, surovi podatki in izhod zunaj repozitorija): pot se ujema z odsekom (±1 %), višine, raba tal in krošnje se prenesejo. Točke so v smeri vožnje (pri Elli in Espinazu obratno od smeri poti v OSM). Seja proge pred korakom `data` preveri še:
- **Medeu:** glavna cesta za jezom (OSM w227761246, 717 m) je označena `highway=construction`, zato gre orodje po vzporedni poti w171513662 (`service`, `motor_vehicle=no`), do 71 m stran. Seja preveri, katera je prava (svež OSM, odprti viri; nikoli Google); če je cesta odprta, orodju za to pot dovoli `construction` in prestavi točke.
- **Llogara in Dadès:** ceste so brez imena, zato je `prefer` [""] (pri Llogari ima ime samo novi predor, pot pa mora čez prelaz).
- **Dadès in Santo Antão:** višinski model v soteski in na grebenu odstopa (razlika surove in zglajene višine do 12 m, strmine do 16 %): višine preveri.
- **Seul:** ceste so enosmerne in samo za avtobuse; orodje enosmernosti ne upošteva, točke so v smeri enosmernosti.
- **Furka:** višine iz swisstopo swissALTI3D, če je dosegljiv (`docs/nove-proge.md`), sicer Copernicus.

### Pravna varnost

- Ceste in parki, poimenovani po osebah, so v igri brez imena: Medeu (ulica po dveh kanih), Seul (cesta in park po pesniku). Kip in pesniški kamen v Seulu sta brez napisov.
- Hoteli, restavracije, kavarne, banke, trgovine in knjižnica so generični, brez imen in napisov (Ella, Porto Moniz, Gudauri, Llogara, Dadès, Espinazo del Diablo, Seul).
- TV stolp na Namsanu je blagovna znamka: samo oblika, brez imena. Mestno obzidje je generično; vojaških objektov ob cesti ne modeliraj.
- Spomeniki so samo oblike brez napisov: Llogara (1912–1913), Medeu; spomenik z mozaiki pri Gudauriju je zunaj odseka. Zaprt hotel na Furki: oblika da, ime in napisi ne. Bunkerji na Llogari so generični.
- Zemljepisna imena smejo ostati: Delgadim, Seneto, Windy Gap, El Palmito, Namsan. Ngorongoro je zaščiteno območje: brez imen safari podjetij in napisov na vozilih.

### Vrstni red, liniji in skupine

- Del 2 nadaljuje liniji dela 1, s pravili dela 1 (ena seja na linijo; na računu partyslo največ 2 seji s kodo):
  - **Linija A** po Biķernieku (A6): Dadès, Santo Antão, Ngorongoro, Ella, Espinazo del Diablo (A7–A11). Dadès je prvi: kratek, s čistimi podatki in malo predmeti. Santo Antão je pred Ngorongorom, ker obe potrebujeta kamnito tlakovanje.
  - **Linija B** po Londonu (B5): Furka, Gudauri, Medeu, Llogara, Porto Moniz, Seul (B6–B11). Graditelj prelazov `js/world-prelaz.js` je narejen za Furko, Gudauri, Llogaro in Porto Moniz, zato ostanejo v eni liniji. Seul je zadnji in uporabi mestne gradnike Londona.
  - Linija A graditelja prelazov ne spreminja hkrati z linijo B: kar potrebuje, doda v svojo datoteko ali pod zastavico.
  - Če se linija dela 1 konča prej, VSE SEJE 2 v njej začne prvo progo dela 2.
- **Skupine za vrsto** (po predvidenem vrstnem redu dokončanja): **N4** = Dadès, Furka, Santo Antão, Gudauri; **N5** = Ngorongoro, Medeu, Ella, Llogara; **N6** = Espinazo del Diablo, Porto Moniz, Seul. Vodja skupine in zbirna veja `zbirna/nove-proge-N<k>` sta kot v delu 1; skupine lahko spremenita uporabnik in Matej.
- Seja proge se začne z »Naredi progo `<id>` po docs/nove-proge-1-0.md (partyslo)« in ob koncu pošlje VSE SEJE 2 »<id> končana, naslednja v liniji: <id>«.

## Del 3: osem dirkališč izven Evrope

Uporabnik je 8. 11. 2026 po predstavitvi dirkališč odločil »Ok vse proge so v redu, začni vse« (ob 20.45, prek Mateja, tabla #382, komentar 6726246790; zapis v `docs/proge-po-drzavah.md`, »Nove proge za 1.0«); ob 20.05 je izbral še Novo Zelandijo: »Nova Zelandija ok naredi tudi«, to je Cromwell (Wellington, Crown Range in Coronet Peak odpadejo). Vseh osem je iz držav brez prave proge v igri (Tajska po #379). Pravila in postopek so kot v delih 1 in 2 (»Podatki poti«, »Kako narediti progo«), razen spodaj.

### Proge

Dolžine so iz predstavitve dirkališč. `id` je predlog: seja proge ga spremeni, če je v `js/tracks/` že zaseden.

| Linija | id | Proga | Vrsta, dolžina | Posebnosti |
|---|---|---|---|---|
| A12 | `tuzla` | Tuzla, Turčija | dirkališče, 5,3 km | nad 5 km: polna dolžina |
| A13 | `sepang` | Sepang, Malezija | dirkališče, 5,5 km | nad 5 km: polna dolžina |
| A14 | `lombok` | Lombok, Indonezija | dirkališče, 4,3 km | |
| A15 | `buriram` | Buriram, Tajska | dirkališče, 4,6 km | šele ko je #379 na `main` (Tajska ima do takrat še Bang Saen) |
| A16 | `sakhir` | Sakhir, Bahrajn | dirkališče, 5,4 km | nad 5 km: polna dolžina |
| A17 | `cromwell` | Cromwell, Nova Zelandija | dirkališče, 4,1 km | zamenja odprto mesto Nove Zelandije; izletno cono najprej preveri seja proge |
| A18 | `lusail` | Lusail, Katar | dirkališče, 5,4 km | nad 5 km: polna dolžina |
| A19 | `riohondo` | Termas de Río Hondo, Argentina | dirkališče, 4,8 km | izletno cono najprej preveri seja proge |

- **Dolžina:** proge nad 5 km (Tuzla, Sepang, Sakhir, Lusail) ostanejo v polni dolžini; izjema od pravila 1–5 km, kot pri Suzuki (priporočena možnost predstavitve, potrjena z »vse v redu«).
- **Pravno:** v igri je samo ime kraja. Uradna imena dirkališč (nekatera vsebujejo podjetje ali sponzorja) in imena ovinkov po osebah ne nastopajo: ovinki so oštevilčeni ali imajo opisno ime, table in napisi so generični (`CLAUDE.md`, »Pravna varnost«).
- **Izletna cona:** Tuzla, Sepang, Lombok, Buriram, Sakhir in Lusail imajo ograjo do 3 m od roba na 0–12 % kroga (OSM). Cromwell in Termas de Río Hondo nista izmerjena, ker zanju v OSM ni odprte sredinske črte: njuna seja najprej preveri pravilo na satelitskem posnetku iz odprtega vira (nikoli Google) in progo začne šele, če ograja do 3 m od roba ni na več kot pol dolžine (`docs/proge-po-drzavah.md`, »Izletna cona«); sicer jo javi in je ne začne.
- **Podatki poti:** brez `tools/<id>/config.json`; ta se pripravi pri seji proge (`tools/proga-podatki.py`, kot v delu 1; `highway=raceway` v `DRIVE` doda prva seja dirkališča). Cromwell in Termas de Río Hondo nimata odprte sredinske črte (v OSM je ni): seja proge vzame pot iz drugega odprtega vira (nikoli Google) in vir navede v opisu PR ter v `README.md` (»Zasluge«).
- **Vrstni red:** linija A po Espinazu (A11), po vrstnem redu tabele; nove proge ostanejo zadnje. Buriram se začne šele, ko je #379 na `main`; do takrat gre linija A mimo njega na naslednjo progo. Ena seja na linijo, na računu največ 2 seji s kodo (kot v delih 1 in 2).
- **Skupine za vrsto** (predlog, PR gredo na konec vrste v skupinah po 3–4): **N7** = Tuzla, Sepang, Lombok, Buriram; **N8** = Sakhir, Cromwell, Lusail, Termas de Río Hondo. Vodja skupine in zbirna veja `zbirna/nove-proge-N<k>` sta kot v delu 1; skupine lahko spremenita uporabnik in Matej.
- **Kateri račun jih gradi:** predlaga ponedeljkov tedenski načrt (Matej, 9. 11. 2026). Seja proge se začne z »Naredi progo `<id>` po docs/nove-proge-1-0.md (<račun>)«, ima svojo vejo `nove-proge/<id>` in osnutek PR (naslov »Nova proga: <Kraj, Država>«) in ob koncu pošlje VSE SEJE 2 »<id> končana, naslednja v liniji: <id>«.

## Del 4: pet kratkih prog izven Evrope (do 1 km)

Uporabnik je 8. 11. 2026 ob ~22.40 v pogovoru seje računa biketraveler naročil: »začni z delom 5 prog izven Evrope. Proge naj bodo kratke do 1 km.« Seja je v OSM izmerila 12 kandidatov iz držav brez proge v igri in brez proge na čakanju in predlagala tri nabore; uporabnik je ob ~22.45 izbral **nabor A** (raznolik: Mã Pí Lèng, Banaue, Wadi Mujib, Sans Souci, Atitlán) in **en PR, proge po vrsti** (zapis v `docs/proge-po-drzavah.md`, »Nove proge za 1.0«). Pravila in postopek so kot v delih 1–3 (»Podatki poti«, »Kako narediti progo«), razen spodaj.

### Proge

Meritve so iz OSM (8. 11. 2026), točke na 5 m kot `tools/proge-pregled.js`, v smeri vožnje. Odsek je najbolj zavit kilometer ceste; pri Banaueju drugi najbolj zavit (1172 namesto 1240 °/km), ker gre mimo razgledišč nad riževimi terasami, prvi pa samo mimo hiš. Višine so iz koraka `data` orodja (Copernicus DEM). Izletna cona je delež dolžine s pregrado do 3 m od asfalta v OSM (merilo v `docs/proge-po-drzavah.md`, »Izletna cona«). Obremenitev je ocena po podobni pravi progi iz `tests/golden/perf.json` (klici risanja / oglišča; meja ~300 / ~900 tisoč), pri 1 km manjša.

| Vrsta | id | Proga | Odsek | Zavitost | Do 60 m ob cesti | Posebnosti |
|---|---|---|---|---|---|---|
| K1 | `mapileng` | Mã Pí Lèng, Vietnam | 1,0 km ceste QL4C (OSM »Quốc lộ 4C«, w285778983, w321471537) iz Đồng Văna na prelaz Mã Pí Lèng, navzgor | 972 °/km, ravnine 25 %, 5 ovinkov, 3 lasnice | spomenik graditeljem ceste s kapelico, majhen muzej, kavarna, steza ob steni, razgledišče tik za ciljem; kraški vrhovi, koruza med skalami, soteska reke Nho Quế od daleč | prvi: v OSM malo stavb, skale in kras v pasu ob cesti |
| K2 | `mujib` | Wadi Mujib, Jordanija | 1,0 km ceste 35 (OSM »King's Highway«) po južnem pobočju kanjona Mujib, navzgor | 1015 °/km, 35 %, 5 ovinkov, 5 lasnic | gole skale, melišča in grmički; v OSM do 60 m nič; jez in jezero na dnu kanjona od daleč; razgledišče s kavarno in taborom na robu kanjona je 400 m za ciljem | v igri samo »Wadi Mujib« (ime ceste ni zemljepisno) |
| K3 | `sanssouci` | Sans Souci, Sejšeli | 1,0 km ceste Sans Souci (OSM »Sans Souci Road«) čez gore otoka Mahé skozi vas Sans Souci, navzgor | 1179 °/km, 20 %, 10 ovinkov, 1 lasnica | tropski gozd (krošnje na 68 % pasu do 150 m, ~12 m), granitne skale, 59 hiš vasi, trgovina, informacijski tabli, razgledišče, izhodišče poti na Morne Seychellois, most čez potok (25 m), 4 postajališča | levi promet (Sejšeli: `leftHand`, kot Chapman's Peak) |
| K4 | `banaue` | Banaue, Filipini | 1,0 km ceste 109 (OSM »Nueva Vizcaya - Ifugao - Mountain Province Road«) po pobočju nad riževimi terasami severno od Banaueja, navzdol proti kraju | 1172 °/km, 12 %, 14 ovinkov, 1 lasnica | riževe terase (OSM `farmland`), 3 razgledišča, 51 hiš zaselka ob cesti, šola tik pred štartom | edina proga dela 4 s hišami tik ob cesti (21 % dolžine, spodaj) |
| K5 | `atitlan` | Atitlán, Gvatemala | 1,0 km ceste RN-1 (OSM »Carretera Sololá - Panajachel«) iz Sololá navzdol proti jezeru Atitlán | 798 °/km, 28 %, 7 ovinkov, 2 lasnici | hiše na robu Sololá, bolnišnica, igrišča, restavracija, elektrovod; jezero in vulkani (San Pedro, Tolimán, Atitlán) pred avtom na obzorju | spust z jezerom v vidnem polju kamere za avtom |

| id | Višina: štart → cilj | Izletna cona: pregrada ≤3 m | Obremenitev (ocena) |
|---|---|---|---|
| `mapileng` | 1184 → 1249 m (najvišje 1258 m) | 0 % | ~130 / ~350 tisoč (Tianmen 146 / 394 tisoč na 4,8 km) |
| `mujib` | 471 → 568 m | 0 % | ~110 / ~300 tisoč (Sani Pass, golo pobočje) |
| `sanssouci` | 212 → 231 m (najnižje 191 m, most) | 5 % (hiše) | ~170 / ~500 tisoč (Chapman's Peak 141 / 419 tisoč in gozd, hiše) |
| `banaue` | 1249 → 1181 m | 21 %, hiše (OSM; v igri preveri: pod polovico, izletna cona je) | ~170 / ~480 tisoč (hiše, terase) |
| `atitlan` | 2067 → 1991 m | 0 % | ~150 / ~450 tisoč (jezero in vulkani v daljavi) |

### Dolžina

Do 1 km (uporabnik: »proge naj bodo kratke do 1 km«): izjema od pravila 1–5 km za teh pet prog, kot pri Envaliri (0,73 km). Proga v igri je odsek iz tabele (~1,0 km od štarta do cilja); zaletišče pred štartom in prostor za avte za ciljem sta po potrebi na isti cesti in ne štejeta v dolžino.

### Podatki poti

`tools/<id>/config.json` je pripravljen za vseh 5 (točke na 100 m v smeri vožnje, okvir ~1,5 km okoli odseka, `geoRoads`, `geoWater`, `marks` in `places` prazni); seja je pognala vse tri korake orodja (`osm route data`, surovi podatki zunaj repozitorija): pot se ujema z odsekom (±1 %), višine, raba tal in krošnje so prenesene (`tools/<id>/<id>.json`, mreže PNG). Izpolni jih seja proge, samo z zemljepisnimi imeni. Seja proge preveri še:
- **Mã Pí Lèng:** spomenik, kapelica, muzej in kavarna so v OSM samo točke (`marks` z id-ji vozlišč, oblike generične); višinski model pod stenami ob cesti preveri na prerezu.
- **Wadi Mujib:** ob odseku v OSM ni ničesar; skale, melišča in grmovje iz rabe tal (`lc`: golo 60 %, grmovje), jez in jezero na dnu kanjona od daleč (`far`).
- **Sans Souci:** most čez potok (662–687 m) in 4 postajališča; levi promet.
- **Banaue:** riževe terase so v OSM `landuse=farmland`; v igri stopničaste terase na pobočju pod cesto (svoj gradnik, samo za to progo). Hiše do 3 m od roba preveri v igri (merilo izletne cone).
- **Atitlán:** jezero in vulkani so zunaj okvira ~1,5 km: pogled v daljavo (`far`) mora segati do jezera (~3 km) in vulkanov (~15 km).

### Pravna varnost

- V igri so samo zemljepisna imena: Mã Pí Lèng, Đồng Văn, Nho Quế, Wadi Mujib, Mahé, Sans Souci, Morne Seychellois, Banaue, Ifugao, Sololá, Atitlán, San Pedro, Tolimán. Imena cest, ki niso zemljepisna (»King's Highway«), ne nastopajo.
- Hoteli, prenočišča, restavracije, kavarne, trgovine in delavnice so generični, brez imen in napisov (ob vseh petih progah). Bolnišnica v Sololá se imenuje po osebi: samo generična stavba brez napisa.
- Spomenik graditeljem ceste na Mã Pí Lèngu, kapelica in muzej so samo oblike brez napisov; steza ob steni je brez imena (ime je znamka).
- Razgledišča so brez imen podjetij (npr. »viewdeck« z imenom lastnika v Banaueju): v igri samo generična terasa ali ograja.

### Vrstni red, veja in seje

- **En PR za vseh pet** (izbira uporabnika »en PR, proge po vrsti«): veja `claude/determined-babbage-4s07gg`, osnutek PR »Nove proge za 1.0, del 4: pet kratkih prog izven Evrope (do 1 km)«. Proge se gradijo po vrsti K1–K5 v isti veji; zanje teče na računu biketraveler hkrati največ ena seja s kodo.
- Tema je sedma odprta tema računa biketraveler: izjema od meje 6 tem, ker jo je uporabnik začel po opozorilu (`CLAUDE.md`, Seje).
- **Graditelj:** skupna datoteka `js/world-kratke.js` za vseh pet (World.ext za vsako temo, gradniki skupni, kar potrebuje ena proga, gre pod njeno zastavico); `js/world-prelaz.js` (linija B računa partyslo) se ne spreminja. Podatke v datoteko proge zapiše skupno orodje `tools/kratke/build.py` iz `tools/<id>/<id>.json`.
- **Seja:** začne se z »Nadaljuj del 4 po docs/nove-proge-1-0.md (biketraveler)«. Ob koncu proge in pri ~300 tisoč žetonih napiše predajo v opis PR (stanje, naslednja proga, kako testirati), delo nadaljuje nova seja na isti veji.
- **Vrsta za `main`:** ko so narejene vse proge in so povezani testi lokalno zeleni, se PR vpiše na konec vrste kot skupina **N9** (pet kratkih prog v enem PR, po izbiri uporabnika namesto skupin po 3–4) in ostane osnutek; nove proge ostanejo zadnje.
