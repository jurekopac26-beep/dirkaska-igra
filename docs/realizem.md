# Realizem prog in avtov: paketi S, E, G in P

Ta načrt opisuje, kako proge in avti postanejo bližje resnici. Vsebuje štiri pakete:
- **E** cesta in predmeti, s stranskimi cestami in črtami (na `main` prvi);
- **S** stavbe;
- **G** rastje in teren;
- **P** poškodbe.

Opisuje še skupni postopek za vse proge in vrstni red prog.

Načrt je pripravila seja računa jure.kopac26 8. 11. 2026 kot predstavitev za Mateja (različica 4). Uporabnik ga je potrdil 8. 11. 2026 ob ~23.00 (razdelek »Odločitve«).

Kode še ni. Vsak korak je svoja seja z vejo `realizem/<korak>` in osnutkom pull requesta (»Naredi korak <korak> po docs/realizem.md«).

Viri so samo odprti (razdelek »Viri«), nikoli Google Maps, Google Earth ali Street View.

## Odločitve uporabnika (8. 11. 2026)

Uporabnik je odgovoril v pogovoru z Matejem. Prvih pet odgovorov (~23.00) je zapisanih na strani Odločitve računa jure.kopac26 ob 23.01–23.02. Zadnji dve odločitvi sta objavljeni na tabli #382.

| Vprašanje ali vir | Odločitev |
|---|---|
| `realizem-paketi` | **1 · Vse štiri**: S, E, G in P, ~96 sej |
| `realizem-proge-najprej` | **1 · Najmanj podobne resnici najprej**, v skupinah po 3–4 (razdelek »Proge in vrstni red«) |
| `realizem-stavbe` | **1 · Stavbe ob cesti po meri**: stavbe tik ob cesti dobijo balkone, okna po nadstropjih, napušč in pravo streho |
| `realizem-znamenitosti` | **1 · Po pravni oceni države** (razdelek »Pravna ocena po državah«); kjer ni preverjeno, ostane generično |
| `poskodbe-vpliv-voznja-2` | **1 · Samo videz** (privzeto): avto je zmečkan, vozi pa kot nepoškodovan. V Nastavitvah je izbira **Izklop / Samo videz / Vklop** |
| ~23.05, tabla #382 (komentar 6727768260) | **Urejamo samo prave proge**: proge v testu in na odločanju se ne urejajo. »Uredi vse proge« pomeni vse izbrane proge brez `pending` in `test`. Stavek v `CLAUDE.md` doda #519 |
| ~23.10, tabla #382 (komentar 6727838438) | **Stranske ceste s križišči in črte na cesti** na vseh pravih progah, samo za videz. Gredo v paket E, ki gre zato na `main` **prvi**; sledita S in G, P teče vzporedno |

Isti dan veljajo še te odločitve (pravila v `CLAUDE.md` in `docs/proge-po-drzavah.md` pridejo s #519):
- **20.25:** proge na odločanju so zamrznjene kot testne.
- **22.08 (potrditev):** na odločanju so Avstralija (Bathurst, Great Alpine Road), Anglija (Crystal Palace, London), Maroko (Marrakesh, Dadès) in Japonska (Irohazaka, Hakone). Suzuka ostane prava proga.
- **22.08:** Finska ni na odločanju. Nova proga je Koli. Ouninpohja gre v test, Harju pa, ko je Koli na `main`.
- **~21.20:** Norveška, Švedska, Danska in Finska imajo zimo privzeto.
- **21.25:** nova mapa in misije so v vrsti za progami.

Od 5. 11. 2026 ostane oblika dreves »mehke krogle«.

## Proge in vrstni red

**Komu so paketi namenjeni.** Paketi gredo na 15 pravih prog z `main`, ki niso na odločanju: 7 s stavbami in 8 gorskih cest. Pikes Peak šteje dvakrat, asfalt in makadam.

**Izvzete proge:**
- **Testne proge.**
- **Proge na odločanju.** Bathurst, Great Alpine Road, Crystal Palace, Marrakesh in Irohazaka so zamrznjene. Dobijo samo oceno, ki pomaga pri izbiri ene proge na državo.
- **Harju in Ouninpohja.** Gresta v test.
- **Proge v odprtih pull requestih, dokler niso na `main`.** Glej »Čas in vrsta«.

**Slike pred in po** se posnamejo na Spa, Suzuki ali Pikes Peaku s kamere za avtom.

**Ocena 1–5** (8. 11. 2026) ima štiri vidike: cesta, stavbe, predmeti ob cesti in rastje. Vse se gleda v pasu 60 m, ki ga vidi kamera. Povprečje 15 prog je 3,7:

| Vidik | Povprečje |
|---|---|
| Cesta | 4,2 |
| Predmeti | 3,7 |
| Rastje | 3,6 |
| Stavbe (11 prog) | 3,2 |

**Vrstni red** je po izbiri uporabnika: najmanj podobne resnici najprej, v skupinah po 3–4. Stolpec »Kaj najprej« pove, kateri paket proga najbolj potrebuje. Paketa E in G gresta na vseh 15 prog, paket S samo na proge s stavbami.

| Skupina | Proga | Ocena | Kaj najprej | Najbolj odstopa |
|---|---|---|---|---|
| 1 | Nürburg, Nemčija | 3,0 | G → S → E | v igri je 19 od 61 stavb ob progi; v pasu ob progi je 82 % gozda, v igri trava |
| 1 | Pikes Peak, ZDA (asfalt in makadam) | 3,0 | G | rastje; cesta je namenoma skrajšana na 6,3 km in paket tega ne spreminja |
| 1 | Suzuka, Japonska | 3,3 | S → G | v igri je 58 od 99 stavb ob progi, boksi in tribune so škatle |
| 1 | Tianmen, Kitajska | 3,3 | G (rastje, teren) | pobočja so travnata, v resnici je do ceste gost gozd |
| 2 | Livorno, Italija | 3,5 | S → E → G | stavbe so pravokotniki, višino ima 20 od 1442; manjkajo svetilke (178), postajališča (48) in robniki; namesto borovcev in makije je gola zemlja |
| 2 | Rio do Rastro, Brazilija | 3,7 | G | pri 3,9 km je enakomerna trava, v resnici je ob cesti več kot pol gozda |
| 2 | Spa, Belgija | 3,8 | G → S → E (asfalt) | stavbe so sive škatle brez oken, 85 % brez višine iz podatkov; trava je v pasovih košnje, v resnici je ob progi veliko gozda |
| 3 | Medvode, Slovenija | 4,0 | S (po #494) | višino ima 7 od 481 stavb, vse imajo isto fasado in streho |
| 3 | Montréal, Kanada | 4,0 | S → E | paviljoni so poenostavljeni; umetnin ob progi ne delamo |
| 3 | Štajerska, Avstrija | 4,0 | S | tribune in boksi niso na pravih obrisih (v OSM je 7 tribun z obrisi) |
| 3 | Chapman's Peak, Južna Afrika | 4,0 | G (teren) → E | višinski model s 30 m zgladi pečine nad morjem |
| 4 | Bâlea, Romunija | 4,3 | S → E | koče in postaja žičnice so preproste |
| 4 | Katu-Jaryk, Rusija | 4,3 | G | macesni so povsod enako gosti |
| 4 | Los Caracoles, Čile | 4,3 | S | hotel ob jezeru in koče so preproste škatle |

Ocene prog na odločanju so samo za izbiro ene proge na državo:

| Država | Proga | Ocena |
|---|---|---|
| Avstralija | Bathurst | 3,8 |
| Avstralija | Great Alpine Road | 3,7 |
| Anglija | Crystal Palace | 3,3 |
| Maroko | Marrakesh | 3,8 |
| Japonska | Irohazaka | 3,0 |

## Postopek za vse proge

En postopek velja za predelavo 15 prog in za vse nove proge. Je nov korak v `tools/proga-podatki.py`, nastavitve so v `tools/<id>/config.json`, zato je vsak korak ponovljiv.

**Koraki postopka:**
1. **Podatki.** Iz Overture Maps (javna shramba S3) pridejo ceste, stavbe, ograje in zidovi, infrastruktura (svetilke, postajališča, mostovi) in pokrovnost tal. Stavbe z virom Google (Google Open Buildings) se izločijo. Zraven pridejo ESA WorldCover (10 m) in barve tal iz Sentinel-2.
2. **Poravnava.** Podatki se premaknejo in zasučejo na progo v igri: po cestah, pri dirkališčih po stavbah. Premik se zapiše v `config.json`.
3. **Stavbe v pasu 60 m.**
   - Pravi tlorisi, poenostavljeni.
   - Višina iz `height` ali nadstropij, sicer privzeta za kraj.
   - Streha, barve in material iz OSM.
   - Fasada iz atlasa regije, stavbe tik ob cesti po meri.
   - Ravni podrobnosti: do 60 m podrobno, do 300 m združene škatle, dlje obris na obzorju.
4. **Predmeti po državah.** Kompleti so ograje, smerniki, ogledala, jarki, svetilke, postajališča in table brez napisov. Postavijo se po podatkih in po pravilih (npr. ogledalo v ostrem ovinku). Rišejo se kot primerki iste mreže.
5. **Stranske ceste in črte** (odločitev uporabnika 8. 11. ob ~23.10).
   - Iz OSM pride vsak odcep do ~60 m od proge, s pravim križiščem, črtami in znaki.
   - Za dirko je zaprt (ograja, stožci ali redar), zato avto ne more zaviti nanj.
   - Črte na cesti so po pravilih države (barva in vrsta sredinske in robne črte), na dirkališčih kot v resnici.
6. **Rastje po podnebju.** Drevesa, grmi in trava se razporedijo po razredih WorldCover, v pasu v enakem deležu kot v resnici. Tla ob asfaltu, barve in svetloba so po državi.
7. **Zima na severu** (pravilo »Sever v snegu«, s #519). Za Norveško, Švedsko, Dansko in Finsko postopek pripravi zasneženo pokrajino, zamete ob cesti in ograjah ter zbit sneg na cesti. Rastje iz WorldCover dobi sneg, barve tal so iz zimskih posnetkov Sentinel-2.
   - Silkeborg in Kågeröd dobita zimo s svojo temo v »Načrtovano« (`docs/vrsta.md`).
   - Longyearbyen in Koli jo dobita ob izdelavi.
8. **Pravni filter.** Brez imen, logotipov in napisov, brez umetnin in kipov. Znamenitosti so po pravni oceni države (spodaj).
9. **Obremenitev in slike.** `perf.test.mjs` dovoli do ~300 klicev risanja in ~900 tisoč oglišč. Druge proge ne smejo zrasti. Slike pred in po se posnamejo s kamere za avtom.

**Nove proge.** Seja nove proge požene isti korak pri pripravi podatkov, kar doda ~0,75 seje na progo (s stranskimi cestami in črtami). Proge, ki se šele začnejo (A12–A19, Koli …), imajo stranske ceste in črte od začetka. Postopek bo nared ~17. 11. pri dveh računih oziroma ~23. 11. pri enem. Proge, ki se začnejo prej, se zgradijo po starem in gredo med predelave (vsaka +~1 seja).

## Paketi

**E, S in G** spreminjajo svet ob cesti in `js/world.js`. Zato gredo na `main` drug za drugim: **najprej E** (odločitev uporabnika 8. 11. ob ~23.10), nato S in G. Vsak naslednji pred združitvijo spoji svež `main` in razreši spore v `js/world.js`.

**P** (poškodbe: `js/render.js`, `js/core.js`) teče vzporedno z njimi.

Vsak od E, S in G ima najprej korak z orodjem in graditeljem (E0, S0, G0), nato skupine prog po vrstnem redu zgoraj.

### E · Cesta in predmeti (~23 sej, na `main` prvi)
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

#### E0, prvi kos: obraba asfalta in črte (PR #622, 10. 11. 2026)
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
  - Brez videza ostanejo: Pikes Peak (svoja, podrobna cesta; pride v E1), Katu-Jaryk (makadam), Harju (gre v test, ko je Koli na `main`), Suzuka in Irohazaka (zamrznjeni), Medvode in druge proge odprtih PR (vrstico dobijo po združitvi).
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
- **Kaj od E0 še manjka:** orodje za robove in robnike, stranske ceste iz OSM s križišči in zaporami, kompleti predmetov po državah, Pikes Peak (svoja cesta) in preverba sredinske črte na Bathurstu.

### S · Stavbe (~21 sej, na `main` za E)
- **Kaj se spremeni:**
  - Oblika strehe, barve, material in nadstropja pridejo iz OSM (`roof:shape`, `roof:colour`, `building:colour`, `building:material`, `building:levels`).
  - Kjer podatka ni, se uporabi slog kraja iz atlasa fasad po regijah. Atlas je risan po odprtih fotografijah.
  - Stavbe tik ob cesti so po meri (izbira uporabnika), z balkoni, okni po nadstropjih, napuščem in pravo streho.
  - Okna in vrata so tekstura v atlasu, ne geometrija. Balkoni in napušč so samo pri stavbah tik ob cesti.
  - Znamenitosti so po pravni oceni države.
- **Koraki:**
  - S0: orodje (Overture brez virov Google, strehe, ravni podrobnosti) in atlas fasad.
  - S1: Nürburg, Suzuka, Livorno, Spa.
  - S2: Medvode (po #494), Montréal, Štajerska. Bâlea in Los Caracoles imata malo stavb in gresta zraven brez svoje seje.
- **Telefon:** cilj je +0 klicev risanja (atlas, skupne mreže) in največ ~150 tisoč oglišč na progo.
- **Seje:** 10 za orodje in atlas, ~1,5 na progo s stavbami.
- **Datoteke:**
  - `tools/proga-podatki.py` (korak za stavbe), `tools/<id>/config.json`;
  - `js/world.js` (graditelj stavb, ravni podrobnosti);
  - atlas fasad v `assets/`;
  - podatki v `js/tracks/<id>.js`.
- **Tveganje:**
  - oglišča v krajih z veliko stavbami (Livorno, Medvode);
  - pravna presoja znamenitosti;
  - spori v `js/world.js` s pull requesti prog.

### G · Rastje in teren (~16 sej, na `main` za S)
- **Kaj se spremeni:**
  - Gozd, grmovje in golo skalovje so v pasu ob cesti v enakem deležu kot v resnici (WorldCover).
  - Trava je brez pasov košnje, razen kjer jih ima resnična proga.
  - Ob asfaltu je ozek pas zemlje in gramoza.
  - Barve tal so iz Sentinel-2, svetloba in ton po državi.
  - Kjer višinski model zgladi pečine (Chapman's Peak, Tianmen), je teren po meri.
  - Oblika dreves (»mehke krogle«) ostane.
- **Koraki:**
  - G0: WorldCover in Sentinel-2, kompleti rastja po podnebju, svetloba po državah.
  - G1–G4: skupine 1–4.
- **Telefon:**
  - Barve in svetloba stanejo 0 klicev.
  - Gozd do ceste je glavno tveganje za oglišča. Do 60 m so podrobna drevesa, za tem ploskve krošenj.
- **Seje:** ~8–9 za orodje in komplete, ~0,5 na progo.
- **Datoteke:**
  - `tools/proga-podatki.py` (WorldCover, Sentinel-2);
  - `js/world.js` (rastje po razredih, pas zemlje, zima na severu);
  - `js/render.js` (svetloba in ton po državi);
  - podatki v `js/tracks/<id>.js`.
- **Tveganje:**
  - oglišča gozda do ceste;
  - barve in svetloba ne smejo spremeniti drugih prog (slike `gfx`).

### P · Poškodbe (16 sej)

Najboljše poškodbe so v igri že zdaj, a izklopljene (Nastavitve, Razbijanje). Paket jih vklopi in doda, kar se ob trku v resnici zgodi najprej.

**Privzeto samo videz** (izbira uporabnika): avto je zmečkan, vozi pa kot nepoškodovan. V Nastavitvah je izbira **Izklop / Samo videz / Vklop**:
- **Izklop:** brez poškodb.
- **Samo videz:** privzeto.
- **Vklop:** tudi vpliv na vožnjo.

**Začetek:** ko so na `main` #460 in #480 (avti) in deli iz garaže na vseh avtih po meniju #516. #322 je na `main` od 8. 11. Ocena začetka je ~16. 11. pri dveh računih oziroma ~22. 11. pri enem (linija za E).

**Vrstni red:** P1 → P4 → P2 → P5 → P3 → P6, v 4 pull requestih. Predlog razdelitve: P1, P4 + P2, P5 + P3, P6.

| Korak | Kaj | Samo videz (privzeto) | Vklop | Telefon | Seje |
|---|---|---|---|---|---|
| P1 Novi način poškodb privzeto | vklopijo se obstoječa stikala Razbijanja: gostejše telo z udrtinami, steklo, ki poči, odrgnjena barva, deli na cesti; namesto 11 stikal ena nastavitev podrobnosti (preproste / podrobne); drobci stekla in barve 1–3 cm | ves videz | enako | polno telo samo za igralca in 5 najbližjih avtov (predlog, ~+15 klicev); vsi razbiti avti s polnim telesom 221 → 283 klicev | 1 |
| P4 Sledi trkov in pravi delci | na avtu barva drugega avta ali siva odrgnina od zidu; na cesti drobni črni koščki plastike, drobci stekla, luske barve; iskre in brazde, ko podvozje drgne po tleh | ves videz | enako | +1–2 klica (vsi delci v enem nizu) | 1–2 |
| P2 Motor: para, pregrevanje, olje | para iz hladilnika pri 15–30 % poškodbe (zdaj dim šele nad 45 %), oljni dim in madeži | para in dim | še pregrevanje: motor izgublja moč in se ustavi | 0 (sistem dima) | 1–2 |
| P5 Steklo in luči | vetrobransko steklo poči v pajčevino in ostane; stranska in zadnja razpadejo v kocke; žaromet poči, luč ugasne ali sveti postrani | ves videz; steklo na cesti ne vzame oprijema | steklo na cesti vzame največ 5 % oprijema (zdaj 20 %, ko je vklopljeno Razbijanje) | 0 | 1 |
| P3 Kolesa in obese | zvita spona ali platišče, nagnjeno kolo, povešen vogal, iskre pod podvozjem | kolo je vidno zvito | avto vleče na stran, pri hitrosti trese | 0 | 1–2 |
| P6 Karoserija kot pri testih trkov | močan čelni trk skrajša prednji del za 0,4–0,7 m, pokrov se zloži v obrnjen V, pri trku z vogalom gre kolo nazaj, kabina ostane cela | skrajša se samo telo | enako | 0 | 2–3 |

P6 ima visoko tveganje (testi trkov, tekmeci in reference), zato je zadnji.

**Obremenitev telefona**, merjeno 8. 11. 2026 na Bathurstu, preden je šel na odločanje:
- dirkališče z 20 avti na štartu;
- nastavitve za telefon: 844 × 390, kakovost normalna, detajli avtov nizki, sence;
- »po trkih« pomeni šest udarcev na avto, povprečno 46 % poškodbe.

Nadaljnje meritve so na Spa.

| Način | Klici, nepoškodovani | Klici po trkih | Oglišča po trkih |
|---|---|---|---|
| Zdaj (privzeto) | 210 | 221 | 681 tisoč |
| Vse Razbijanje vklopljeno | 260 | 283 | 702 tisoč |
| Samo novo telo | 260 | 283 | 694 tisoč |
| Predlog P1: polno telo za igralca in 5 najbližjih (ocena) | ~225 | ~236 | ~690 tisoč |
| Meja proge (`CLAUDE.md`) | ~300 | ~300 | ~900 tisoč |

Čas sličice v brskalniku brez grafične kartice je preveč nemiren za sklepe. Pri 120 udarcih hkrati se prve sličice v obeh načinih zataknejo do ~1 s; to je treba preveriti na telefonu.

- **Datoteke:**
  - `js/render.js` (telo, steklo, para, delci, kolesa);
  - `js/core.js` (model poškodb, vpliv na vožnjo pri »Vklop«);
  - `js/game.js` (Nastavitve);
  - `js/lang.js` (prevodi).

  `js/world.js` ostane nespremenjen.
- **Tveganje:**
  - klici risanja pri polju razbitih avtov (283 od ~300);
  - vpliv na vožnjo pri »Vklop« spremeni čase krogov in teste voženj (privzeto ga ni);
  - začetek je odvisen od #460, #480 in #516.

## Pravna ocena po državah

**Ta ocena ni pravni nasvet.** Velja povsod:
- v igri ni imen, logotipov, napisov in znamk;
- umetnin in kipov ne delamo nikjer, tudi kjer bi jih zakon dovolil;
- stavbe so samo od zunaj.

Kjer piše »ni preverjeno«, je ocena iz drugotnih virov ali splošnega znanja. Tam znamenitosti ostanejo generične, dokler ni preverjeno.

Mestne proge po središču velikih mest ostanejo generične (`CLAUDE.md`). Stavb po meri (tloris, višina, streha, fasada regije) ta ocena ne zadeva, samo prepoznavne znamenitosti.

| Država | Proge | Zunanjost stavb v prodajni igri | V igri |
|---|---|---|---|
| Belgija | Spa | da: izjema za panoramo od 2016 (čl. XI.190 zakonika o gospodarskem pravu), tudi za prodajo | tribune in boksi po meri, brez imen |
| Japonska | Suzuka (Irohazaka, Hakone na odločanju) | da: čl. 46, arhitektura prosto; izjema je samo gradnja kopije stavbe | stavbe po meri; panoramsko kolo splošne oblike |
| Finska | Koli (nova) | da: §25a, stavbe se smejo upodabljati prosto, tudi za prodajo | po meri |
| Avstrija | Štajerska | da: §54(1) Z5 UrhG, tudi za prodajo; gradnja kopije ne (OGH 4 Ob 51/94) | tribune in boksi po pravih obrisih, brez znakov; kipi in simboli znamk ne |
| Rusija | Katu-Jaryk | da: čl. 1276 civilnega zakonika, arhitektura prosto, tudi za prodajo | redke stavbe po meri |
| Kanada | Montréal | da, z opombo: čl. 32.2(1)(b) zakona o avtorski pravici (slika, risba, fotografija, film); ali zajame 3D igro, ni preverjeno | paviljoni in kupola po meri; umetnin ob progi ne delamo |
| Italija | Livorno | ne: izjeme za panoramo ni; zakonik o kulturni dediščini (čl. 107–108) za prodajno rabo podob javne kulturne dediščine zahteva dovoljenje in plačilo | cerkve, gradova ob obali in obalni stolp generično (tloris in višina, ne prepoznavna kopija) |
| Južna Afrika | Chapman's Peak | ne: izjeme za panoramo ni; ali je dopolnitev zakona že v veljavi, ni preverjeno | cestninska postaja generična |
| Maroko | Marrakesh, Dadès (na odločanju) | ne: za prodajo izjeme ni | generično, če se proga vrne |
| Slovenija | Medvode | ni preverjeno: čl. 55 ZASP; drugotni viri pravijo, da samo nekomercialno; zakon o varstvu kulturne dediščine lahko doda omejitve | generično |
| Nemčija | Nürburg | ni preverjeno: §59 UrhG, pogled z javnega mesta, samo zunanjost, na sliki ali filmu; prostorska kopija ni zajeta | zunanjost poenostavljena ali generična, brez napisov |
| Romunija | Bâlea | ni preverjeno: dovoljeno, če delo ni glavni motiv; za prodajo ni potrjeno | koče in žičnica v ozadju, ledeni hotel generičen |
| Čile | Los Caracoles | ni preverjeno: čl. 71F zakona o avtorski pravici, dela na javnih mestih prosto | hotel ob jezeru brez imena, poenostavljen |
| ZDA | Pikes Peak | ni preverjeno: §120(a), stavbe, vidne z javnega mesta, na slikah prosto; 3D ni potrjeno | stavba na vrhu poenostavljena, brez imena |
| Brazilija | Rio do Rastro | ni preverjeno: čl. 48 zakona 9.610, dela na javnih mestih prosto | razgledišče generično |
| Kitajska | Tianmen | ni preverjeno: čl. 24(10), dopolnitev 2020; prodajna raba ni potrjena | Nebeška vrata so naravna jama, ne delo |

Viri (8. 11. 2026):
- zakoni prek WIPO Lex in nacionalnih zbirk predpisov;
- pregled izjem za panoramo po državah na Wikimedia Commons;
- za Italijo, Nemčijo, Slovenijo in Južno Afriko še pravni članki.

Država se premakne iz »ni preverjeno«, ko seja doda vir in uporabnik potrdi.

## Čas in vrsta

**Seja** je ena seja Opus z naporom max (~3 ure dela). Ena linija naredi ~3 seje na dan. En račun ima dve liniji, dva računa štiri.

**Začetek** je po tedenskem načrtu (pon. 9. 11.), najprej v torek 10. 11. Račune določi tedenski načrt.

| Paket | Obseg | Seje | 1 račun | 2 računa |
|---|---|---|---|---|
| E Cesta in predmeti (na `main` prvi) | orodje za robove, asfalt, stranske ceste in črte, kompleti po državah, 15 prog; E1 počaka na odgovor o slikah | 23 | 10.–21. 11. | 10.–16. 11. |
| S Stavbe | orodje, atlas fasad, 7 prog; na `main` za E | 21 | 10.–19. 11. | 10.–18. 11. |
| G Rastje in teren | WorldCover in Sentinel-2, kompleti po podnebju, svetloba po državah, 15 prog; na `main` za S | 16 | 20.–26. 11. | 10.–16. 11. |
| P Poškodbe | P1–P6 za vse avte, obremenitev | 16 | 22.–28. 11. | 16.–20. 11. |
| Predelava prog iz PR | 14 prog, ko pridejo na `main`, s stranskimi cestami in črtami | 20 | 28. 11.–3. 12. | 19.–23. 11. |
| Nove proge po novem postopku | +~0,75 seje na progo (s stranskimi cestami in črtami), ~17 prog, sproti z izdelavo | 13 | od 23. 11. | od 17. 11. |
| Skupaj | do zadnje skupine prog na `main` | ~109 | ~4. 12. | ~25. 11. |

Stranske ceste in črte (odločitev ob ~23.10) dodajo ~13 sej (prej ~96) in premaknejo konec za 2–3 dni.

**Proge iz PR** (stanje 8. 11.):
- Killar;
- 10 novih prog iz N1–N3: Silkeborg, Kågeröd, Izoard, Sosnová, Pembrey, Kildare, Sa Calobra, Kotor, Biķernieki, Zandvoort;
- Furka, Santo Antão in Gudauri iz N4.

Hakone, London in Dadès so na odločanju in odpadejo. Paketi teh prog ne spreminjajo, dokler njihovi pull requesti (#494, #485, #498, #500 in N4) niso na `main`.

**Poraba** (8. 11.): biketraveler ima od pon. 9. 11. ob 0.00 cel teden. partyslo bo brez porabe od čet. 12. 11. zvečer. Datumi za dva računa veljajo, če drugi račun dela ves čas. Nova mapa in misije so v vrsti za progami in tu niso šteti.

**Vrsta.** Paketi prinesejo ~17 pull requestov:
- 3 za orodja in graditelje (E0, S0, G0);
- 4 za poškodbe;
- ~10 skupin prog po 3–4 (E1–E4, S1–S2, G1–G4).

V vrsti so pred novimi progami (vrstice v »Načrtovano«, `docs/vrsta.md`), E prvi. Predelave prog iz PR pridejo, ko so te proge na `main`.

## Tveganja

- **Obremenitev telefona.** Gozd do ceste in stavbe po meri dodajo oglišča, Razbijanje pa klice risanja (283 od ~300 pri 20 razbitih avtih). Zato so ravni podrobnosti, atlas in polno telo samo za najbližje avte. Vsaka proga gre skozi `perf.test.mjs`.
- **Spori v `js/world.js`.** Spori so med paketi in pull requesti prog. Zato gredo paketi na `main` drug za drugim, proge v odprtih pull requestih pa se ne spreminjajo.
- **Stranske ceste.** Ne smejo spremeniti vožnje in AI: so zaprte (ograja, stožci ali redar), avto ne more zaviti s proge. Skupne pomočnike v `js/world-vrsic.js` uporabljajo tudi zamrznjene proge, zanje mora ostati vse enako.
- **Pravo.** Nepreverjene države ostanejo generične.
- **Zamrznjene proge.** Če se proga z odločanja vrne, gre med predelave.

## Stanje

| Korak | Veja / PR | Stanje |
|---|---|---|
| Načrt in odločitve | `docs/realizem-paketi`, #540 | potrjen 8. 11. 2026; ta dokument |
| E0, prvi kos: obraba asfalta in črte | `realizem/e0-crte-asfalt` | končano 10. 11. 2026; uporabnikov »ok« na slikah (`docs/realizem/e0-*.jpg`) 10. 11. ob ~03.30, PR #622 je v vrsti za `main` (`docs/vrsta.md`, 10.7, osnutek do vrste); jure.kopac26, odločitev uporabnika 10. 11. 2026 ob ~01.40 v pogovoru z Matejem, izbira »Cesta in predmeti E0«; opis v razdelku »E0, prvi kos« |
| E0 (ostalo), E1–E4, S0–S2, G0–G4, P1–P6 | `realizem/<korak>` | čaka na tedenski načrt (pon. 9. 11.); E prvi, E1 najprej slike na strani Odločitve; P po #460, #480 in #516 |

## Viri

- **Overture Maps** (izdaja 2026-10-21.0, javna shramba S3): stavbe, ceste, ograje, infrastruktura, pokrovnost tal. Stavbe iz vira Google (Google Open Buildings) so izločene.
- **OpenStreetMap** (ODbL 1.0), tudi prek Overture. Izpeljani podatki v datotekah prog so prav tako pod ODbL 1.0.
- **ESA WorldCover 10 m** (CC BY 4.0) in **Sentinel-2** (Copernicus).
- **Copernicus DEM** in Terrain Tiles za poravnavo podatkov na proge.
- **Fotografije** samo kot zgled za videz: Wikimedia Commons in Mapillary, z licenco preverjeno pri vsaki.
- **Poškodbe:** javni testi trkov (posnetki na Wikimedia Commons) in strokovni članki o steklih in hladilnikih po trku.

Vsak vir, ki pride v igro, gre v `README.md` pod »Zasluge«.
