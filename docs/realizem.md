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

- **E · Cesta in predmeti (~23 sej, na `main` prvi)**: `docs/realizem/paket-e.md` (tudi »E0, prvi kos« in »E0, drugi kos«).
- **S · Stavbe (~21 sej, na `main` za E)**: `docs/realizem/paket-s.md`.
- **G · Rastje in teren (~16 sej, na `main` za S)**: `docs/realizem/paket-g.md`.
- **P · Poškodbe (16 sej)**: `docs/realizem/paket-p.md`.

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

**Manj sklopov pri grafiki** (ukrep 1; odločitev uporabnika 11. 11. 2026 ob ~12.55 prek Mateja, tabla #382, komentar 6795249505; velja pred razporeditvijo spodaj; vseh 8 ukrepov v `docs/varcevanje.md`, »Manj sklopov«):
- **E** (#657) ostane en sklop za vse prave proge.
- **S in G**: prvi seji S in G naredita sestavne dele (orodje, graditelje, komplete; S0 in G0), nato gresta S in G **skupaj v enem prehodu na progo** (ena seja na progo naredi stavbe ter rastje in teren).
- **Proge si računa izmenjujeta** po vrstnem redu v razdelku »Proge in vrstni red«: jure.kopac26 vzame 1., 3., 5. …, partyslo 2., 4., 6. …; zamrznjene proge (`test`, `pending`) se preskočijo.
- **Predelava novih prog po #569** ostane pri partyslo.
- Seja dela do ~150 tisoč konteksta, nato predaja (`CLAUDE.md`, Seje).

Vrsta za `main` z ocenami je v `docs/vrsta.md` (»Posodobljen načrt 11. 11. 2026«, »Manj sklopov«); tu se ne ponavlja.

**Razporeditev računov** (odločitev uporabnika 10. 11. 2026 ob ~22.30, prek Mateja, tabla #382, komentar 6779831019; datumi so ocene za `main`, v tedenskem načrtu 16. 11. ga samo še potrdita):
- **biketraveler, fizika in avti** (odločitve uporabnika 10. 11. 2026 ob ~23.10 »Prestavi na prioritetno«, ob ~23.20 »Garazo daj tudi pod prioritetno« in ob ~23.35 »Poskodbe prestavi pred grafiko«, z izbiro »biketraveler takoj po #480«; vse prek Mateja):
  1. **Prednost imata Dež in sneg ter garaža**, ki zasedeta obe mesti za seje s kodo. Na `main` gresta v eni zbirni veji; če uporabnikov »ok« za Dež in sneg zamuja več kot dan, gre garaža sama (odločitev uporabnika 10. 11. 2026 ob ~23.30 prek Mateja, tabla #382). Dež in sneg: Fable 5.2 z eno sejo, na `main` po uporabnikovem »ok« na predogledu, v vrsti takoj za PR, ki so takrat v testih.
  2. **Avti na raven KOLIBRIJA pred Trki**: vseh 13 preostalih v #480 (FORMULA ORKAN in TAIFUN LM ter mesta za dele na 11 avtih iz #460, tudi ZRCALNI VLAK) v prvem prostem mestu za sejo s kodo, ena seja, na `main` ~17. 11. (odločitev uporabnika 11. 11. 2026 ob ~00.15 prek Mateja, tabla #382, komentar 6781978213, datum po komentarju 6782506960; prej 10 avtov iz #460 po garaži, »V #480, pred poškodbami«, komentar 6781849560); vanj gre tudi #626 (partyslo), vodi ga biketraveler, ko je #480 pripravljen (odločitev uporabnika 10. 11. 2026 ob ~23.30 prek Mateja, tabla #382). Takoj po #480 in pred Trki + Poškodbe **30 avtov na raven KOLIBRIJA** z notranjostjo, Visokimi (o njih uporabnik odloči po slikah) in nastavitvami trkov, ~47 h, na `main` ~25. 11. (odločitev uporabnika 11. 11. 2026 ob ~02.40 prek Mateja, tabla #382, komentar 6784505738; `docs/avti-kolibri.md`, »Prednost: 30 avtov«).
  3. Poškodbe P1–P6 takoj po #480, 30 avtih in #569 + #494 (komentar 6784739386), **skupaj s Trki (#608) v enem PR** (prej 4 PR) (odločitev uporabnika 10. 11. 2026 ob ~23.30 prek Mateja, tabla #382); na `main` ~7. 12. (komentar 6784505738; prej ~29. 11., pred tem ~27. 11.; 13 avtov v #480 pred Trki (odločitvi uporabnika 11. 11. 2026 ob ~00.05 in ~00.15 prek Mateja, tabla #382, komentarja 6781849560 in 6781978213)). V vrsti za `main` gredo deli Poškodb pred pakete grafike, ko so pripravljeni hkrati.
  4. 5 tovornjakov (TITAN PLIN, TITAN AVTOVOZ, KRILO VETRNICE, LASTOVKA, HRAST) **za grafiko**: začnejo, ko so paketi grafike na `main` (~9. 12.), na `main` ~20. 12., pred zamrznitvijo 23. 12. (zamik ~2 dni zaradi 30 avtov in #246, Matej, komentar 6784505738), mesta za dele dobijo že ob izdelavi; s tem je 50 avtov (odločitvi uporabnika 11. 11. 2026 ob ~00.15 in ~00.35 prek Mateja, tabla #382, komentarja 6781978213, točka 4, in 6782294421, točka a; prej ~18. 12., pred tem ~2. 12. po Poškodbah).
  5. Trki (#608): odpadli deli in slike na Spa; faza 2 »Realistična« začne po predogledu Dež in sneg (~12. 11.), Trki na `main` s Poškodbami v enem PR (~7. 12.); ocena ni trda, kakovost je pred hitrostjo (odločitev uporabnika 10. 11. 2026 ob ~23.20; Fable 5.2, v Nastavitvah gumbi za možnosti trkov, privzeta najbolj realistična).
  6. Po Trkih + Poškodbah (~7. 12.) po tedenskem načrtu teme iz »Načrtovano« (npr. #605, Hitro nalaganje 2) ali pomoč pri grafiki (komentar 6782294421, točka a; prej: pomoč pri predelavi prog).
- **jure.kopac26, grafika:**
  1. #622 (E0, prvi kos) in #638 na `main` zdaj. Vse proge v enem PR (#494 v #569, en krog testov; odločitev uporabnika 10. 11. 2026 ob ~23.30 prek Mateja, tabla #382) gredo na `main` takoj za 30 avtov in pred Trki + Poškodbe, ~26. 11. (odločitev uporabnika 11. 11. 2026 ob ~03.05 prek Mateja, tabla #382, komentar 6784739386, dobesedno: »prestavi Vse proge v enem PR (#569 + #494) na 5 mesto takoj za 30 avtov«); do takrat jih uporabnik preizkuša na stalnem predogledu #569 (`tools/predogled.mjs`, naredi ga jure.kopac26), Združevanje je ustavljeno, posodabljajo se samo prave proge na `main`; pravilo »proge vedno zadnje« zanje ne velja. #246 (preleti) je zadržan: na `main` za Garažo, avti (#480 in 30 avtov) ter Trki + Poškodbe in pred paketi grafike, ~8. 12. (odločitev uporabnika 11. 11. 2026 ob ~00.55 prek Mateja, tabla #382, komentar 6784505738, dobesedno: »Preleti postavi za garazo, fiziko trkov, posodobitve avtomobilov ter pred grafiko«); paketi grafike gredo na `main` za njim, ~9. 12. (zamik ~2 dni); rok 23. 12. ostane.
  2. Ned 15. 11.: Samsungov temni način; Killar (#494) na `main` s #569 ~26. 11. (komentar 6784739386; prej v ponedeljek).
  3. E Cesta in predmeti na vseh pravih progah od 15. 11.; ~22. 11.
  4. S Stavbe ~30. 11., nato predelava prog.
- **partyslo, proge, nato grafika:**
  1. Prelet Spa (#246) 10. 11.; #569 na `main` ~26. 11., takoj za 30 avtov (komentar 6784739386; prej v sredo); od petka zadnje 3 proge (2 makadamski, 1 ledena) in Koli; preostali 3 preleti po uporabnikovem »ok« na Spa. #246 gre na `main` šele ~8. 12. (zgoraj) in do takrat na njem ni dela; prosti čas porabe gre grafiki po progah (G Rastje in teren, predelava prog) (komentar 6784505738).
  2. Od ~17. 11. G Rastje in teren; na `main` za S, ~1. 12.
  3. Od ~23. 11. predelava prog iz PR, nato nove proge po novem postopku; vse prave proge z novo grafiko ~6. 12.
- Modeli po `CLAUDE.md`: grafika Fable 5.2 z eno sejo; fizika trkov Fable 5.2 z ultracode; proge, meni in popravki Opus.

Tabela spodaj je prvotna ocena (8. 11.); kjer se razlikuje, velja razporeditev zgoraj.

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
| E0, prvi kos: obraba asfalta in črte | `realizem/e0-crte-asfalt` | končano 10. 11. 2026; uporabnikov »ok« na slikah (`docs/realizem/e0-*.jpg`) 10. 11. ob ~03.30, na `main` od 11. 11. 2026 s PR #622 (squash `244f7cd7`); jure.kopac26, odločitev uporabnika 10. 11. 2026 ob ~01.40 v pogovoru z Matejem, izbira »Cesta in predmeti E0«; opis v razdelku »E0, prvi kos« |
| E0, drugi kos: rob ceste, oznake čez cesto, Pikes Peak | `realizem/e0-crte-asfalt` (isti PR #622, ločeni commiti) | končano 10. 11. 2026, uporabnikov »ok« na slikah (`docs/realizem/e0-rob.jpg`, `e0-oznake.jpg`, `e0-pikes.jpg`) 10. 11. ob ~12.30; na `main` od 11. 11. 2026 s PR #622 (squash `244f7cd7`); opis v razdelku »E0, drugi kos« |
| S0, prvi kos: sestavni deli stavb (atlas fasad, graditelj, kompleti po državah, hiše na Spaju; orodje za podatke OSM še manjka) | `realizem/s0-stavbe` | PR #668 (osnutek), **čaka na uporabnikov »ok« na slikah** (stran Odločitve, vprašanje `realizem-s0-spa`); jure.kopac26, odločitev uporabnika 12. 11. 2026 ob ~18.00 v pogovoru z Matejem, izbira »Da, S0 Stavbe«; opis in predaja v `docs/realizem/paket-s.md`, »S0, prvi kos« |
| E0 (ostalo), E1–E4, S0 (ostalo), S1–S2, G0–G4, P1–P6 | `realizem/<korak>` | čaka na tedenski načrt (pon. 9. 11.); E prvi, E1 najprej slike na strani Odločitve; P po #460, #480 in #516 |

## Viri

- **Overture Maps** (izdaja 2026-10-21.0, javna shramba S3): stavbe, ceste, ograje, infrastruktura, pokrovnost tal. Stavbe iz vira Google (Google Open Buildings) so izločene.
- **OpenStreetMap** (ODbL 1.0), tudi prek Overture. Izpeljani podatki v datotekah prog so prav tako pod ODbL 1.0.
- **ESA WorldCover 10 m** (CC BY 4.0) in **Sentinel-2** (Copernicus).
- **Copernicus DEM** in Terrain Tiles za poravnavo podatkov na proge.
- **Fotografije** samo kot zgled za videz: Wikimedia Commons in Mapillary, z licenco preverjeno pri vsaki.
- **Poškodbe:** javni testi trkov (posnetki na Wikimedia Commons) in strokovni članki o steklih in hladilnikih po trku.

Vsak vir, ki pride v igro, gre v `README.md` pod »Zasluge«.
