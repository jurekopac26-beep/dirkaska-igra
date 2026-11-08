# Nove proge za 1.0: prvih 11 (načrt, podatki poti, vrstni red, predaja)

Seznam je potrdil uporabnik 7. 11. 2026 ob ~21.20 v pogovoru z Matejem (tabla #382, komentar 6712589851; predlog s podrobnostmi: komentar 6709785463). Pravila za vse nove proge za 1.0 (1–5 km, merili zavitosti in »do 60 m ob cesti«, izletna cona, mestne proge) so v `CLAUDE.md` (»Ena proga na državo«) in v `docs/proge-po-drzavah.md`, razdelek »Nove proge za 1.0«. Seznam 50 prog (vprašanje `nove-proge-1-0-50`, z Medeuem in drugimi progami na čakanju) še čaka odgovor uporabnika; dokler ga ni, se proge na čakanju ne začnejo.

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

## Del 2: 11 prog s čakanja (načrt v delu)

Uporabnik je 8. 11. 2026 ob 15.59 (prek Mateja, tabla #382, komentar 6723046786) potrdil 11 prog na seznam 50: Medeu, Kazahstan; Furka, Švica; Gudauri, Gruzija; Llogara, Albanija; Porto Moniz, Portugalska; Ngorongoro, Tanzanija; Ella, Šrilanka; Santo Antão, Zelenortski otoki; Espinazo del Diablo, Mehika; Seul, Južna Koreja; Dadès, Maroko. Načrt (odseki, meritve, podatki poti, liniji in skupine) pripravlja seja »Nove proge 1.0 del 2« (partyslo); dokler ta razdelek ni dokončan, se nobena od teh prog ne začne.
