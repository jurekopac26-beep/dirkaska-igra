# Dirkališča po celinah: Mogyoród, Abu Dabi, Sindia, Yahuarcocha

Načrt, odločitve in stanje štirih novih dirkališč za različico 1.0 (seznam 50 pravih prog, `docs/vrsta.md`). Splošna pravila za nove proge so v `CLAUDE.md` (»Pravila za nove proge«), recept za dirkališče z boksi po vzoru Silkeborga (#469) in Biķernieka (#496) spodaj.

## Odločitve uporabnika (9. 11. 2026, biketraveler)
- Naročilo: »Naredi se 5 dirkalisc iz vsakega kontinenta 1 drzavo krog naj bo 1-10km«. Pri teh progah je krog lahko dolg **1–10 km** (izjema od pravila 1–5 km za nove proge, ki jo je uporabnik določil sam).
- Izbire po celinah (klikljiva izbira v seji, 9. 11. 2026 ponoči):
  - Evropa: **Mogyoród, Madžarska**;
  - Azija: **Abu Dabi, ZAE**;
  - Afrika: **Sindia, Senegal**;
  - Amerika: »Use ze imamo tin peak. Za juzno ameriko izberem ekvador ce ima bokse ce boksov nima potem izberem kolumbija«: Severna Amerika odpade (ZDA ima Pikes Peak), iz Južne Amerike Ekvador, ker ima dirkališče bokse (33 boksov, za 12 ur Ekvadorja 2026 48): **Yahuarcocha, Ekvador**. Kolumbija (Tocancipá) zato odpade.
- Oceanija nima proste države z dirkališčem v OSM (Avstralija ima Bathurst oziroma Great Alpine Road, Nova Zelandija Cromwell v skupini N7/N8, `docs/nove-proge-1-0.md`, del 3), zato so dirkališča štiri. Peto naredimo samo, če ga uporabnik izbere.
- Opozorilo, da je biketraveler nad mejo 6 odprtih tem, je bilo v vprašanju; uporabnik je izbral, zato tema teče (izjema »tema, ki jo uporabnik začne kljub opozorilu«, `CLAUDE.md`, Seje).

## Proge
Meritve na sredinski črti iz OSM (`highway=raceway`, točke na 5 m, merilo kot v `docs/proge-pregled.md`). Izletna cona: delež kroga, kjer je ograja, zid ali stavba do 3 m od roba asfalta (merilo `docs/proge-po-drzavah.md`, »Izletna cona«).

| `id` | Ime | Celina | Krog | Smer | °/km | Ravnine | Ovinki (lasnice) | Boksi (OSM) | Pregrada ≤3 m |
|---|---|---|---|---|---|---|---|---|---|
| `mogyorod` | Mogyoród, Madžarska | Evropa | 4,37 km (od 2003) | v smeri urinega kazalca | 340 | 66 % | 14 (3) | desno ob ciljni ravnini, boksarska steza `w231417580` | 6 % |
| `abudabi` | Abu Dabi, ZAE | Azija | 5,28 km (od 2021) | nasprotno urinemu kazalcu | 397 | 69 % | 18 (1) | desno ob ciljni ravnini, izvoz pod progo (`w176695254`, predor `w176695255`) | 7 % |
| `sindia` | Sindia, Senegal | Afrika | 4,66 km | v smeri urinega kazalca | 297 | 64 % | 12 (0) | levo ob ciljni ravnini, `w180617876` | 5 % |
| `yahuarcocha` | Yahuarcocha, Ekvador | Južna Amerika | 3,62 km (od 1983) | v smeri urinega kazalca (viri; OSM smeri nima) | 361 | 55 % | 10 (2) | v OSM jih ni; 33 boksov po virih | 0 % |

Posebnosti:
- **Mogyoród**: krog v gričih nad Mogyoródom (vzhodno od Budimpešte), 800 m dolga ciljna ravnina, tribuna levo, boksi desno (stavba boksov v OSM `w123905481`). Ciljna črta: OSM je nima; viri (statistika Mercedesa 2014, RaceFans) dajejo 610 m od prvega štartnega mesta do vrha prvega ovinka, zato je črta 212 m za prvo točko poti (blizu začetka stavbe boksov). V OSM ni vozlišča na tem mestu: `tools/mogyorod/build.py` premakne začetek črte za 212 m. Ovinki imajo v OSM imena oseb (Senna, Schumacher …): v igri samo opisna imena.
- **Abu Dabi**: krog na otoku Yas, zadnji ovinki pod hotelom (v OSM `covered=yes`, `w1255169704`), ciljna ravnina proti vzhodu, boksarska steza desno in izvoz s predorom pod progo, tribune ob dolgih ravninah. Hotel, zabaviščni park in marina so v igri generični (brez imen in podob stavb). Druga boksarska steza ob jugozahodni ravnini (`w188471238`, za spremljevalne dirke) ostane brez boksov. Začetek: sredina boksov ob ciljni ravnini (vozlišče 1988427695).
- **Sindia**: krog med baobabi pri Sindii jugovzhodno od Dakarja; ovinki so v OSM »Tour 1« do »Tour 22«. Začetek: stavba ob boksih (`w432510630`), vozlišče 4315199460. Okolica: savana, baobabi, peščena tla (ESA WorldCover, krošnje Meta/WRI).
- **Yahuarcocha**: krog ob jezeru Yahuarcocha severovzhodno od Ibarre (2.190 m nad morjem), dolga ravnina ob jezeru; uradno ime dirkališča je po osebi, zato v igri samo »Yahuarcocha«. V OSM ni boksov ne stavb ob krogu: seja proge boksi postavi ob ravnino, kjer ESA WorldCover kaže pozidano (in po opisih), in tam določi ciljno črto (zdaj začasna: jugozahodni konec dolge ravnine, prva točka poti).

## Podatki poti
`tools/<id>/config.json` za `tools/proga-podatki.py`: točke na vozliščih OSM vsakih ~110 m v smeri vožnje (opomba: pot, vozlišče, s), okvir ~1,25 km okoli kroga, `dist.grid` 500 m. Orodje mora imeti `raceway` v `DRIVE` (od Silkeborga), zato veja temelji na `zbirna/nove-proge-N3` (vsebuje N1–N3 in kavlje `js/world-rbring.js`); pull request ima za osnovo `zbirna/nove-proge-N3` (kot #500 na N2), po združitvi N3 na `main` pa `main`.

## Recept (ena proga na sejo, po vzoru Silkeborga #469 in Biķernieka #496)
1. Podatki: `python3 -I tools/proga-podatki.py tools/<id>/config.json RAW` (RAW v scratchpadu); preveri črto na sliki, ciljno črto in boke.
2. `tools/<id>/build.py` po vzoru `tools/silkeborg/build.py` napiše `js/tracks/<id>.js`: opisna imena ovinkov s komentarjem, `turns`, `pit` / `pitRow` / `walls`, tribune `stands`, `sectors`, `dem`, `lc`, `sk`, `realKm`, `look`, `zivali`; ime »Kraj, Država« in `en`.
3. Svet: `js/world-<id>.js` z `RB_LOOK.<id>` na `js/world-rbring.js` (kavlji `extra`, `ck`, `woods`, `fl`, `pad`, `pitBox`; zastava države na drogovih); v `index.html` datoteka proge za zadnjo dosedanjo in svet pred `js/world-rbring.js`.
4. Meni: zastava `assets/flags/<država>.svg` in `FLAG_FILES` (`js/menu.js`), `tools/menu-globe.mjs` (`PLACES`, `SUBUNITS`), `tools/menu-lens.js` (`BASE`), slike `assets/tracks/<id>.webp` in `<id>-rain.webp`, ovinek `assets/maps/corner-<id>.webp` / `.webm` in `tools/menu-corners.json`, `maketa-menija/orodja/proge_igra.json`, `js/menu-data.js`.
5. Prevodi `js/lang.js`; test `tests/<id>.test.js` (vzor `tests/silkeborg.test.js`), `tests/run.js`, `tests/lib/sim.js` (`CRASH_AT`), reference `npm run golden:update`.
6. Dokumenti: `docs/proge/<id>.md`, `README.md` (Proge, Zasluge), `docs/igra.md`, `docs/kazalo.md`, `tests/README.md`, `node tools/proge-pregled.js` in vrstica »Do 60 m ob cesti«.
7. `npm run test:related`, `node tools/stamp.js --check`; commit in potisk na vejo teme; v tej datoteki popravi stanje.

## Stanje
| `id` | Podatki poti | Proga in svet | Meni in slike | Test in reference | Dokumenti |
|---|---|---|---|---|---|
| `mogyorod` | `config.json` | – | – | – | – |
| `abudabi` | `config.json` | – | – | – | – |
| `sindia` | `config.json` | – | – | – | – |
| `yahuarcocha` | `config.json` (začasen začetek) | – | – | – | – |

Vrstni red: Mogyoród → Abu Dabi → Sindia → Yahuarcocha. Ko so vse štiri v pull requestu in povezani testi zeleni, gre pull request na konec vrste kot skupina **N10** (za N9, `docs/nove-proge-1-0.md`, del 4) in ostane osnutek do vrste.

## Predaja
Seja začne z branjem tega razdelka in stanja zgoraj. Ob ~300 tisoč žetonih seja tu zapiše, kje je ostala, in delo nadaljuje nova seja z isto vejo.
