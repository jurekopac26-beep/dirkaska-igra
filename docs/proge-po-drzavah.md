# Proge po državah: v igri in na čakanju

Pravilo uporabnika (3. 11. 2026): v prihodnje naredimo iz vsake države samo **eno novo progo** (`CLAUDE.md`, razdelek »Ena proga na državo«). Spodnji tabeli naštejeta za vsako državo proge, ki so že v igri, in proge, ki čakajo. Seja pred začetkom nove proge preveri, ali je proga izbrana oziroma ali je njena država še brez proge.

**Vrstni red dela (odločitve uporabnika 7. 11. 2026, tabla #382):** nove proge so del seznama za različico 1.0 s 70 pravimi progami (od 9. 11. 2026, prej 50; `docs/vrsta.md`, »Različica 1.0«). Izdelava novih prog teče naprej (odločitev ob 14.40), **proge so v vrsti za `main` vedno zadnje** (odločitvi ob 16.39 »Proge postavi na zadnja mesta« in ob 16.48, komentar 6709363288): pull request, ki ni proga, se vpiše pred njih, na konec vrste gre samo pull request proge; za njimi je še nova mapa z misijami (odločitev uporabnika 8. 11. 2026 ob 21.25, komentar 6726766597: kar je narejeno, je na `main`, novo delo gre na zadnje mesto, tudi za proge; `CLAUDE.md`, »Posebne misije«). Narejeni progi Killar (PR #283) in Hakone (PR #261) gresta na `main` v skupini »Proge« (`docs/vrsta.md`), za njo nove proge v zbirnih vejah (od 9. 11. 2026 vse pripravljene proge računa v enem pull requestu). Pravila za nove proge: razdelek »Nove proge za 1.0« spodaj.

Viri prog na čakanju: verige iz `docs/nove-proge.md` (veja `nove-proge/balea`), `docs/gorske-proge.md` (kratke proge, veja `gorske-proge/01-norquay`, skupine A–D) in `docs/zavite-proge.md` (veja `ccr-67c8ebdb-8sdz1o`, koraki 1–4); narejene proge na vejah s pull requestom; stare veje iz oktobra (`claude/proga-<id>` in druge), ki niso na `main`. Pregled prog v igri s slikami kamere 1 in zavitostjo: https://claude.ai/artifact/DvMKmf9ZWhENQYRqhR6DrJ

**Ustavljeno 11. 11. 2026:** potrjene nove proge brez datoteke proge čakajo na ponovno potrditev uporabnika; naprej samo 10 od Hải Vâna do Batangasa (`docs/vrsta.md`, »Različica 1.0«, »Nove proge ustavljene do ponovne potrditve«).

## Nove proge za 1.0 (odločitve uporabnika 7. 11. 2026)

Odločitve uporabnika 7. 11. 2026 ob 14.40–14.45, prek Mateja na tabli #382 (komentarji 6707680842, 6707700704 in 6707708934):

- **Dolžina:** vsaka nova proga je dolga 1–5 km; daljša cesta se skrajša na najboljši odsek do 5 km.
- **Prvih 11 prog:** 4 dirkališča, 3 gorske, 2 zelo kratki za tovornjake, 1 izvenserijska in 1 po izbiri seje; za kratki progi za tovornjake in za izvenserijsko po 2–3 predlogi.
- **Merili izbire:** ovinkasta cesta z veliko zavoji in malo ravnimi odseki, tudi pri dirkališčih (uporabnik: »da je veliko zavojev, da cesta ni ravna ampak ovinkasta«; »če je preveč ravnine, je vožnja dolgočasna«), in čim več zanimivega do 60 m ob cesti (vidno polje kamere za avtom). Meri se kot v `docs/proge-pregled.md` (zavitost, »Do 60 m ob cesti«).
- **Za vsako progo** seja preveri resnično pot in dolžino v OpenStreetMap, državo (ena proga na državo), izletno cono, imena brez oseb, znamk in lokalov ter oceno obremenitve telefona; na seznamu napiše ime »Kraj, Država«, vrsto, dolžino, kaj je do 60 m ob progi in zavitost.
- **Potrjen seznam 11 prog** (odločitev uporabnika 7. 11. 2026 ob ~21.20, prek Mateja, komentar 6712589851):
  - dirkališča: Silkeborg, Danska; Kågeröd, Švedska; Biķernieki, Latvija; Zandvoort, Nizozemska;
  - gorske: Izoard, Francija; Sa Calobra, Španija; **Kotor, Črna gora** (namesto Hehuanshana, Tajvan);
  - za tovornjake: Sosnová, Češka; Pembrey, Wales;
  - izvenserijska: Kildare, Irska (reli kros);
  - mestna: **London, Anglija** (namesto Budimpešte).
  - **London je bil izjema od pravila ena proga na državo** (Anglija že ima Crystal Palace, uporabnik pa je London izbral, ko je to vedel); od 8. 11. 2026 ob 22.03 to ni več: **Crystal Palace in London sta oba na odločanju** (`pending: true`, ne test; odločitvi uporabnika 8. 11. 2026 ob ~18.58 in 22.03, prek Mateja, tabla #382, komentar 6727185416). Ko je London v igri, uporabnik izbere, katera od obeh ostane, druga dobi `test: true`. Crystal Palace dobi `pending` s #519, London ga doda seja partyslo (zbirna veja N3 #500, komentar 6727235199); ob spoju Crystal Palace ohrani `pending: true`.
  - Načrt, podatki poti in vrstni red so v `docs/nove-proge-1-0.md`.
- **Seznam 50 prog, delne odločitve** (uporabnik 8. 11. 2026 ob 14.44, prek Mateja, komentar 6722394383; vprašanje `nove-proge-1-0-50`): **Envalira, Andora** (#430) ostane dolga **0,73 km** (izjema od pravila 1–5 km samo za to progo; uporabnik: »Envalira naj bo dolga 0,73 km.«); rezervi sta **Meteora, Grčija** in **Šipka, Bolgarija**, Buenos Aires odpade; o **12 progah na čakanju** se je uporabnik odločil 8. 11. 2026 ob 15.59 po predstavitvi 16 prog (prek Mateja, komentar 6723046786): na seznam 50 gre **11 prog** — Medeu, Kazahstan; Furka, Švica; Gudauri, Gruzija; Llogara, Albanija; Porto Moniz, Portugalska; Ngorongoro, Tanzanija; Ella, Šrilanka; Santo Antão, Zelenortski otoki; Espinazo del Diablo, Mehika; Seul, Južna Koreja; Dadès, Maroko. **Milford Sound, Nova Zelandija ne gre** (tretjina poti je predor); mesto Nove Zelandije je od 8. 11. 2026 ob 20.05 **Cromwell** (dirkališče, spodaj), Wellington, Crown Range in Coronet Peak odpadejo. Opombe za seje prog: Llogara — najbolj zavit odsek do 5 km (na celi poti 55 % ravnin); Ngorongoro — OSM za večino poti navaja kamnito tlakovanje, ne makadama; Seul je edina mestna proga, brez lasnic. Nove proge so v vrsti še naprej zadnje. Načrt za teh 11 (najbolj zaviti odseki 1–5 km, izletna cona na izbranih odsekih, podatki poti, liniji in skupine N4–N6) je v `docs/nove-proge-1-0.md`, razdelek »Del 2«.
- **Osem dirkališč izven Evrope** (odločitev uporabnika 8. 11. 2026 ob 20.45, prek Mateja, tabla #382, komentar 6726246790; uporabnik po predstavitvi dirkališč: »Ok vse proge so v redu, začni vse«; ob 20.05 je izbral še Novo Zelandijo: »Nova Zelandija ok naredi tudi«, to je Cromwell): Tuzla, Turčija (5,3 km); Sepang, Malezija (5,5 km); Lombok, Indonezija (4,3 km); Buriram, Tajska (4,6 km, **šele ko je #379 na `main`**: Tajska ima do takrat še Bang Saen, ki gre s #379 v test); Sakhir, Bahrajn (5,4 km); Cromwell, Nova Zelandija (4,1 km); Lusail, Katar (5,4 km); Termas de Río Hondo, Argentina (4,8 km). Vseh osem je iz držav brez prave proge v igri (Tajska po #379). **Dolžina:** proge nad 5 km (Tuzla, Sepang, Sakhir, Lusail) ostanejo v polni dolžini, izjema od pravila 1–5 km kot pri Suzuki (priporočena možnost predstavitve, potrjena z »vse v redu«). **Pravno:** v igri je samo ime kraja; uradna imena dirkališč (nekatera vsebujejo podjetje ali sponzorja) in imena ovinkov po osebah ne nastopajo, ovinki so oštevilčeni ali imajo opisno ime. **Izletna cona:** izmerjena za vseh osem (biketraveler, 8. 11. 2026; vseh osem ima v OSM sredinsko črto): pregrada do 3 m od roba je na 8–30 % kroga, največ ob zidu boksov, zato imajo vsa izletno cono (razdelek »Izletna cona«; meritve v `docs/nove-proge-1-0.md`, »Del 3«). **Vrstni red:** nove proge ostanejo zadnje; gredo v linijo A v `docs/nove-proge-1-0.md` (razdelek »Del 3«), za Espinazom (A11), po vrstnem redu zgornjega seznama (A12–A19); vsaka proga ima svojo sejo, vejo `nove-proge/<id>` in osnutek PR, PR gredo na konec vrste v zbirnih vejah (od 9. 11. 2026 vse pripravljene proge računa v enem pull requestu). Kateri račun jih gradi, predlaga ponedeljkov tedenski načrt (9. 11. 2026).
- **Potrditev seznama pred delom:** seznam je vprašanje na strani Odločitve partyslo in komentar na tabli #382; nobena proga s seznama ali s čakanja (tudi Medeu) se ne začne pred odgovorom uporabnika. Po potrditvi jih partyslo začne kljub meji 6 odprtih tem (izjema »tema, ki jo uporabnik začne kljub opozorilu«; odločitev uporabnika 7. 11. 2026 ob 15.16, komentar 6708059513), največ 2 seji s kodo hkrati.
- **Mestne proge po središču velikih mest:** velika mesta (npr. London) dobijo kratko dirko po središču, v spodnjem delu razpona 1–5 km, po širokih glavnih ulicah, nabrežjih in trgih, z ograjami kot na uličnih dirkah; stavbe so generične, brez pravno spornih imen in podob (kot pri Monte Carlu). **Zanje pravilo izletne cone ne velja** (razdelek »Izletna cona«).

## Izletna cona (odločitev uporabnika 5. 11. 2026)

Pravilo v `CLAUDE.md` (»Ena proga na državo«): nova proga mora imeti izletno cono; proga, ki ima pregrado večinoma takoj ob cesti, se ne začne (ne briše se), proga v pull requestu se samo javi. Uporabnik (5. 11. 2026): »Niso mi všeč proge, ki nimajo izletne cone, to pomeni da je ograja večinoma časa takoj ob cesti.« Izjema (odločitev uporabnika 7. 11. 2026): mestne proge po središču velikih mest (razdelek »Nove proge za 1.0«).

**Merilo:** delež dolžine ceste, kjer je pregrada (ograja, zid, hiša, skalna stena, prepad, most, predor) do 3 m od roba asfalta na vsaj eni strani (v oklepaju: na obeh); »večinoma« je več kot pol dolžine. Narejene proge (pull requesti, stare veje) so izmerjene v igri: meja, ob kateri se avto ustavi (`T.bl`, `T.br` v `js/core.js`), manj polovica širine asfalta (`T.wAt(i)`), na vsakih 5 m. Nenarejene so izmerjene iz OpenStreetMap (pot po cestah OSM, žarek levo in desno do 3 m čez rob asfalta: `barrier=guard_rail`, `wall`, `retaining_wall`, `fence`, stavbe, `natural=cliff`, mostovi, predori); OSM ima ponekod vrisan le del hiš in ograj, zato je to spodnja meja, in kjer je vrisanega očitno premalo, odloča vrsta ceste iz načrta. Ulične proge imajo začasne betonske ograje ob vsem krogu (ulične proge v igri: 71–100 %). Gorske ceste dobijo v igri rob ~3,4 m do ograje (Bâlea, Hakone: 0 %), zato jih ograja ob resnični cesti ne izloči; izločijo jih hiše, zidovi, predori in ozke police v steni.

| Proga | Kje čaka | Pregrada ≤3 m | Odločitev |
|---|---|---|---|
| Hakone, Japonska | PR #261 | 0 % (v igri, povprečno 6,7 m od asfalta) | izletna cona je |
| Medvode, Slovenija | PR #153 | 10 %, obe 3 % (v igri, povprečno 6,1 m; na `main` zdaj 99 %) | izletna cona je (pločniki) |
| Bâlea, Romunija | na `main` (PR #226, 7. 11. 2026) | 0 % (v igri, povprečno 6,8 m) | izletna cona je |
| Killar, Indija | PR #283 | 99 %, obe 58 % (v igri, povprečno 2,3 m) | brez izletne cone (prepad in stena ob ozki polici); v PR, samo javljeno |
| Pau, Francija | Nove proge 7 | ulična proga | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026) |
| Puerto Madero, Argentina | kratke D, Načrtovano | 75 %, obe 38 % (stara veja, v igri) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ulična proga |
| Punta del Este, Urugvaj | kratke D | ulična proga | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026) |
| Diriyah, Saudova Arabija | stara veja, Načrtovano | 57 %, obe 24 % (stara veja, v igri; ostalo večinoma 3–4 m) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ulična proga |
| Hong Kong ob pristanišču, Kitajska | stara veja (odpade), Načrtovano | 74 %, obe 24 % (stara veja, v igri) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ulična proga |
| Stelvio, Italija | stara veja, Načrtovano | 99 %, obe 99 % (stara veja, v igri: ograja 0,8 m od asfalta) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): zidovi in ograje ob ozki cesti |
| Kapelmuur, Belgija | stara veja, Načrtovano | 59 %, obe 19 % (stara veja, v igri); OSM vzpon 68 % | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): hiše ob tlakovanih ulicah |
| Ouro Preto, Brazilija | zavite 1, Načrtovano | OSM 18 % (hiše vrisane le ob 41 % poti) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ozke tlakovane ulice, hiše ob pločniku |
| Valparaíso, Čile | zavite 2 | OSM 34 % (hiše vrisane ob 65 % poti) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ozke ulice na gričih, hiše ob pločniku |
| Quito, Ekvador | zavite 2 | OSM 24 % (hiše vrisane ob 53 % poti) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): kolonialne ulice in hiše na pobočju |
| Hongkong, Kitajska | zavite 3 | OSM 33 % (zidovi 21 %, ograje 8 %) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): podporni zidovi in ograje ob ozki cesti |
| Shimla, Indija | zavite 4 | OSM 15 % (hiše vrisane ob 65 % poti) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): hiše, bazar in zidovi ob cesti |
| Darjeeling, Indija | zavite 4 | OSM 6 % (hiše vrisane ob 32 % poti) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): hiše in železnica tik ob ozki cesti |
| Yungas, Bolivija | kratke C1, Nove proge 6 | OSM brez vrisanih ovir | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ozka polica v steni, prepad brez ograje (kot Killar) |
| Medeu, Kazahstan | osnutek PR #532 (veja `nove-proge/medeu`, 8. 11. 2026) | 0 % (v igri, povprečno 6,7 m; prej OSM 12 %, ograje) | izletna cona je |
| Milford Sound, Nova Zelandija | kratke B | OSM 37 %, obe 37 % (predor 1,2 km je tretjina poti, mostovi) | izletna cona je (razen v predoru); odpade (8. 11. 2026: Nova Zelandija dobi Cromwell) |
| Ella, Šrilanka | kratke C1 | OSM 2 % | izletna cona je |
| Santo Antão, Zelenortski otoki | kratke C2 | OSM 6 % | izletna cona je |
| Dadès, Maroko | kratke C2 | OSM 2 % | izletna cona je |
| Espinazo del Diablo, Mehika | kratke C2 | OSM 0 % | izletna cona je |
| Auli, Indija | kratke A (odpade, če pride Killar na `main`) | OSM 1 % | izletna cona je |
| Furka, Švica | Nove proge 2A, Načrtovano | OSM 7 % (mostovi) | izletna cona je |
| Gudauri, Gruzija | Nove proge 3 | OSM 0 % | izletna cona je |
| Llogara, Albanija | PR #545 (B9, skupina N5) | OSM 1 % (stara cesta čez prelaz, ne novi predor) | izletna cona je |
| Porto Moniz, Portugalska | Nove proge 5 | OSM 10 % (hiše) | izletna cona je |
| Ngorongoro, Tanzanija | osnutek PR #533 (veja `nove-proge/ngorongoro`, 8. 11. 2026) | 0 % (v igri, povprečno 5,2 m od asfalta; travnata pobočja brez hiš in ograj) | izletna cona je |
| Seul, Južna Koreja | zavite 3 | OSM 2 % (cesta skozi park) | izletna cona je |
| Wellington, Nova Zelandija | zavite 4 | OSM 4 % (hiše vrisane, odmaknjene od ceste) | izletna cona je; odpade (8. 11. 2026: Nova Zelandija dobi Cromwell) |
| Longyearbyen, Norveška | proge z ledom | OSM 2 %, obe 0 % (hiše odmaknjene od ceste) | izletna cona je |
| Envalira, Andora | proge z ledom | OSM 0 % (krog na ledu, okoli sneg) | izletna cona je |
| Tuzla, Turčija | Nove proge za 1.0, linija A (A12) | OSM 0 %; z zidom boksov ~15 % | izletna cona je |
| Sepang, Malezija | Nove proge za 1.0, linija A (A13) | OSM 16 % (glavna tribuna in zid ob ravnini), obe 2 %; z zidom boksov ~28 % | izletna cona je |
| Lombok, Indonezija | Nove proge za 1.0, linija A (A14) | OSM 0 %; z zidom boksov ~19 % | izletna cona je |
| Buriram, Tajska | Nove proge za 1.0, linija A (A15) | OSM 0 %; z zidom boksov ~20 % | izletna cona je |
| Sakhir, Bahrajn | Nove proge za 1.0, linija A (A16) | OSM 0 % (zidovi za izletnimi conami od 10 m od sredine); z zidom boksov ~13 % | izletna cona je |
| Cromwell, Nova Zelandija | Nove proge za 1.0, linija A (A17) | OSM 1 % (most); letalski posnetek LINZ 2025 (CC BY 4.0): izletne cone ob vsem krogu, z zidom boksov in podvozom ~8 % | izletna cona je |
| Lusail, Katar | Nove proge za 1.0, linija A (A18) | OSM 3 % (ograja); z zidom boksov ~30 % | izletna cona je |
| Termas de Río Hondo, Argentina | Nove proge za 1.0, linija A (A19) | OSM 0 %; z zidom boksov ~14 % | izletna cona je |
| Koli, Finska | proge z ledom (zimska) | OSM 2 % (stavbe), ograj, zidov in sten ni | izletna cona je |

## Države s progo v igri: izbira uporabnika

Odločitev uporabnika 3. 11. 2026 (v pogovoru, na vprašanja `ena-proga-<država>` na strani Odločitve): »dodaj samo tiste, ki si jih priporočal, ter Québec« (Québec je 5. 11. 2026 odpadel, glej Kanada). Iz teh držav se naredi samo izbrana proga; proge v stolpcu »Odpadejo« se ne delajo (seja jih v svoji skupini ali koraku preskoči).

Odločitev uporabnika 5. 11. 2026 zvečer: »Od prog iz Brazilije naj ostane samo Rio do Rastro.« Rio de Janeiro je odtlej testna (PR #365), izbrana nova proga Ouro Preto odpade; Brazilija nove proge nima.

Odločitvi uporabnika 8. 11. 2026 ob ~22.00 in 22.03 (prek Mateja, tabla #382, komentar 6727185416): (1) država z dvema ali več progami, pri kateri uporabnik še ni izbral ene, ima vse te proge na odločanju (`pending: true`) do izbire; (2) iz države na odločanju novih prog ne delamo, ker jo `pending` že pokriva. Na odločanju so: **Avstralija** (Bathurst, Great Alpine Road), **Anglija** (Crystal Palace, London; London ni več izjema), **Maroko** (Marrakesh, Dadès) in **Japonska** (Irohazaka, Hakone; Suzuka ostane). Stanje 8. 11.: Avstralija je od 9. 11. odločena (Bathurst), Japonska prav tako (Hakone; Suzuka in Irohazaka gresta v test). **Finska ni na odločanju** (potrdil uporabnik ob 22.08): nova proga je Koli (razdelek »Finska: Koli«), Ouninpohja je testna, Harju gre v test, ko je Koli na `main`. Pravila: `CLAUDE.md`, »Ena proga na državo«.

| Država | V igri | Izbrana nova proga | Odpadejo |
|---|---|---|---|
| ZDA | Pikes Peak (asfalt in makadam); od 5. 11. 2026 samo ta (odločitev uporabnika), druge proge iz ZDA gredo med testne (`test: true`, za izbris): Big Sur, Uncompahgre, Beartooth, Mount Baldy, Monterey in Palomar Mountain ter Santa Monica Mountains, Moki Dugway, Mauna Kea, Riverside in Detroit | nobena | Hana (kratke, C1); stare veje: Mount Lemmon, Mount Rose, Long Beach |
| Avstralija | Bathurst; od 9. 11. 2026 samo ta (izbira uporabnika 9. 11. 2026 ob ~2.15 v pogovoru z Matejem, vprašanje `avstralija-ena-proga`), Great Alpine Road gre med testne (`test: true`, za izbris; misija 47 na njej ostane, dokler je uporabnik ne uredi); do izbire sta bila oba na odločanju (`pending: true`, odločitev uporabnika 6. 11. 2026; od 8. 11. 2026 ob 20.25 zamrznjena kot testni, tabla #382, komentar 6726031196); Longford, Newcastle, Mount Hotham in Townsville so od 6. 11. 2026 testne (`test: true`, za izbris; odločitev uporabnika: »Vse ostale daj v test«); Mount Buller (narejena, PR #241) je od 5. 11. 2026 testna (`test: true`, za izbris; odločitev uporabnika, PR #379) | nobena (Mount Buller gre v test) | stara veja: Phillip Island |
| Kanada | Montréal; od 5. 11. 2026 samo ta (odločitev uporabnika), Toronto in Trois-Rivières gresta med testne (`test: true`, za izbris) | nobena: Québec (zavite, 2) odpade (odločitev uporabnika 5. 11. 2026: Kanado zastopa samo Montréal; tudi brez izletne cone) | Québec |
| Japonska | Suzuka, Irohazaka: obe gresta med testne (`test: true`, za izbris, z ločenim pull requestom za zbirno vejo C, nova seja, 10. 11.; od odločitve zamrznjeni kot testni): Suzuka zaradi pravnega tveganja (odločitev uporabnika 9. 11. 2026 ob ~22.45: »Hakone, Japonska prestavi v med izbrane za japonsko, suzuko prestavi v test zaradi pravnega tveganja«), Irohazaka po pravilu ene proge na državo (odločitev uporabnika 9. 11. 2026 ob ~22.47: »V test«); iz Japonske ostane samo Hakone | Hakone (narejena, PR #261; izbrana proga Japonske, ni več na odločanju; na `main` pride z zbirno vejo Proge, #494) | Nozawa Onsen (kratke, A); stare veje: Aso, Zao, Tokio |
| Brazilija | Rio do Rastro; od 5. 11. 2026 samo ta (odločitev uporabnika), Rio de Janeiro gre med testne (`test: true`, za izbris) | nobena (5. 11. 2026) | Ouro Preto (zavite, 1; odločitev uporabnika 5. 11. 2026), Corvo Branco (kratke, B); stara veja: São Paulo |
| Južna Afrika | Chapman's Peak; Sani Pass je od 5. 11. 2026 testna (`test: true`, za izbris; odločitev uporabnika, PR #379), država ima še Chapman's Peak | nobena (Sani Pass gre v test) | Green Point (kratke, D; tudi stara veja `claude/proga-capetown`) |
| Finska | Harju (gre v test, ko je Koli na `main`); Ouninpohja je od 8. 11. 2026 testna (`test: true`, za izbris; odločitev uporabnika 8. 11. 2026: »ouninpuhja je premalo zavita skoraj vse lahko spolnim gasom vozis ni zanimivo, naredi novo progo za finsko da bo na sneg«) | **Koli, Finska** (izbira uporabnika 8. 11. 2026 ob 22.04, vprašanje `finska-zimska-proga`; zimska proga, razdelka »Finska: Koli« in »Sever v snegu«); Finska ni na odločanju (ob 22.08) | – |
| Slovenija | Medvode; Vršič je od 6. 11. 2026 testna (`test: true`, za izbris; odločitev uporabnika, PR #394) | – | – |
| Kitajska | Tianmen | Hongkong (zavite, 3) — **ne začni** (brez izletne cone, 5. 11. 2026) | Macao (zavite, 3), Guoliang (kratke, B); stare veje: Peking, Hong Kong ob pristanišču |
| Čile | Los Caracoles | Valparaíso (zavite, 2) — **ne začni** (brez izletne cone, 5. 11. 2026) | stara veja: Santiago |
| Italija | Livorno | Stelvio (stara veja `ccr-b30cfdb0-ej1gzj`, v verigi Nove proge) — **ne začni** (brez izletne cone, 5. 11. 2026) | – |
| Maroko | Marrakesh: na odločanju (`pending: true` s #519; odločitev uporabnika 8. 11. 2026 ob 22.03, tabla #382, komentar 6727185416), zamrznjena kot testna (odločitev ob 20.25), v igri in testih ostane do izbire | Dadès (kratke, C2; #508, N4): tudi na odločanju, `pending: true` doda seja partyslo; ko uporabnik izbere, druga gre v test | – |
| Belgija | Spa | Kapelmuur (stara veja `claude/blissful-knuth-ww01kw`; ni v nobeni verigi, posodobi jo nova seja) — **ne začni** (brez izletne cone, 5. 11. 2026) | – |
| Nemčija | Nürburg | – | – |
| Avstrija | Štajerska | – | – |
| Rusija | Katu-Jaryk | – | – |
| Anglija | Crystal Palace: na odločanju (`pending: true`; odločitev uporabnika 8. 11. 2026: ko je London v igri, uporabnik izbere, katera od obeh ostane, druga gre v test); zamrznjena kot testna (odločitev uporabnika 8. 11. 2026 ob 20.25), v igri in testih ostane do izbire | London (mestna proga po središču velikega mesta; #492, del N3 #500): tudi na odločanju, `pending: true` doda seja partyslo (od 8. 11. 2026 ob 22.03 ni več izjema od pravila ena proga na državo) | – |
| Romunija | Bâlea (na `main` od 7. 11. 2026, PR #226) | – | – |
| Indija | Killar (na `main` 3. 11. 2026 po odločitvi uporabnika; prva proga iz Indije) | – | Auli (kratke, A), Shimla in Darjeeling (zavite, 4) |

## Ocene prog v igri: ena proga na državo

Uporabnik 4. 11. 2026: »prosim shrani si ocene, da izberem samo 1 progo na državo«. Ocene od 1 do 5 (5 najboljša), kot jih da uporabnik; ko so ocenjene vse proge države, uporabnik izbere tisto, ki ostane (ostale lahko gredo med testne, kot Santa Monica Mountains, Detroit, Moki Dugway, Riverside in Mauna Kea 4. 11. 2026). Države z eno progo v igri tu niso naštete.

| Država | Proge v igri: ocena | Izbrana |
|---|---|---|
| ZDA | Pikes Peak (asfalt in makadam) **5** (4. 11. 2026), Big Sur –, Uncompahgre –, Beartooth –, Moki Dugway **4** (4. 11. 2026; med testne istega dne), Mauna Kea **4** (4. 11. 2026; med testne istega dne), Mount Baldy –, Riverside **3** (4. 11. 2026; med testne istega dne), Monterey –, Palomar Mountain **4,5** (4. 11. 2026) | – |
| Avstralija | Bathurst **4,5** (4. 11. 2026), Longford **3** (4. 11. 2026), Newcastle –, Great Alpine Road **5** (4. 11. 2026), Mount Hotham –, Townsville – | Bathurst (9. 11. 2026) |
| Kanada | Toronto –, Montréal –, Trois-Rivières – | – |
| Japonska | Suzuka –, Irohazaka **5** (4. 11. 2026) | Hakone (nova proga, PR #261; odločitev uporabnika 9. 11. 2026 ob ~22.45), Suzuka in Irohazaka gresta med testne (odločitvi 9. 11. 2026 ob ~22.45 in ~22.47) |
| Brazilija | Rio do Rastro **5** (4. 11. 2026), Rio de Janeiro – | – |
| Južna Afrika | Chapman's Peak **5** (4. 11. 2026), Sani Pass **4** (4. 11. 2026) | – |
| Finska | Ouninpohja –, Harju – | Koli (nova proga, 8. 11. 2026 ob 22.04); Ouninpohja v test 8. 11. 2026, Harju gre v test, ko je Koli na `main` |
| Slovenija | Vršič –, Medvode – | – |

Ocene prog iz držav z eno progo v igri (za primerjavo): Spa, Belgija **5** (4. 11. 2026); Los Caracoles, Čile **5** (4. 11. 2026); Livorno, Italija **3** (4. 11. 2026).

## Države brez proge v igri: po vrsti

Proge gredo v delo, ko pridejo na vrsto. Ko država dobi progo (na `main` ali v delu na veji), druge iz iste države odpadejo. Stare veje, ki niso v nobenem načrtu, ne pridejo na vrsto.

| Država | Na čakanju | Odločitev |
|---|---|---|
| Argentina | Termas de Río Hondo (dirkališče, Nove proge za 1.0, A19); Puerto Madero (kratke, D; narejen tudi na stari veji); stara veja: Siete Lagos (ni v načrtu) | Termas de Río Hondo: po vrsti (odločitev uporabnika 8. 11. 2026 ob 20.45; izletno cono najprej preveri njegova seja); Puerto Madero: **ne začni** (brez izletne cone, 5. 11. 2026) |
| Francija | Pau (Nove proge); stara veja: Montvernier (ni v načrtu) | Pau: **ne začni** (brez izletne cone, 5. 11. 2026) |
| Nova Zelandija | Cromwell (dirkališče, Nove proge za 1.0, A17); odpadejo Milford Sound (kratke, B), Wellington (zavite, 4), Crown Range in Coronet Peak | po vrsti (odločitev uporabnika 8. 11. 2026 ob 20.05; izletno cono najprej preveri njegova seja) |
| Bolivija | Yungas v dveh verigah (kratke, C1, in Nove proge; ista cesta) | **ne začni** (brez izletne cone, 5. 11. 2026) |
| Švica | Furka (Nove proge) | po vrsti |
| Gruzija | Gudauri (narejena, PR #523) | po vrsti |
| Albanija | Llogara (Nove proge) | narejena v PR #545 (B9, skupina N5): na `main` z zbirno vejo N5 |
| Portugalska | Porto Moniz (Nove proge) | po vrsti |
| Tanzanija | Ngorongoro (Nove proge za 1.0, A9; prej Nove proge 8) | narejena: osnutek PR #533 (8. 11. 2026), na `main` s skupino N5 |
| Saudova Arabija | Diriyah (stara veja `claude/proga-diriyah`, v verigi Nove proge) | **ne začni** (brez izletne cone, 5. 11. 2026) |
| Kazahstan | Medeu (Nove proge za 1.0, B8; prej kratke, A) | narejena: osnutek PR #532 (8. 11. 2026), na `main` s skupino N5 |
| Šrilanka | Ella (kratke, C1) | narejena (PR #552, nove proge 1.0, del 2, A10; skupina N5), čaka na vrsto za `main` |
| Zelenortski otoki | Santo Antão (kratke, C2) | po vrsti |
| Mehika | Espinazo del Diablo (kratke, C2; PR #562, skupina N6) je od 13. 11. 2026 **testna** (`test: true`, odločitev uporabnika prek Mateja: »mehiko prestavi v test, čakamo novo progo iz Mehike«) | nova proga iz Mehike: izbere jo uporabnik; **ne začni**, dokler je ne izbere |
| Urugvaj | Punta del Este (kratke, D) | **ne začni** (brez izletne cone, 5. 11. 2026) |
| Ekvador | Quito (zavite, 2) | **ne začni** (brez izletne cone, 5. 11. 2026) |
| Južna Koreja | Seul (zavite, 3) | po vrsti |
| Tajska | nobene na čakanju; Bang Saen je od 5. 11. 2026 testna (`test: true`, za izbris; preveč ravnine; odločitev uporabnika, PR #379), zato Tajska nima prave proge v igri | prva nova proga iz Tajske, ko pride na vrsto: Buriram (dirkališče, Nove proge za 1.0; pogoj »šele ko je #379 na `main`« je izpolnjen z združitvijo #379) |
| Norveška | Longyearbyen (proge z ledom, izbira uporabnika 6. 11. 2026) | po vrsti (razdelek »Proge z ledom«); zima je privzeta (8. 11. 2026, razdelek »Sever v snegu«) |
| Andora | Envalira (proge z ledom, izbira uporabnika 6. 11. 2026) | po vrsti; potrebuje led kot podlago (razdelek »Proge z ledom«) |
| Turčija | Tuzla (dirkališče, Nove proge za 1.0, A12) | po vrsti (odločitev uporabnika 8. 11. 2026 ob 20.45) |
| Malezija | Sepang (dirkališče, Nove proge za 1.0, A13) | po vrsti (odločitev uporabnika 8. 11. 2026 ob 20.45) |
| Indonezija | Lombok (dirkališče, Nove proge za 1.0, A14) | po vrsti (odločitev uporabnika 8. 11. 2026 ob 20.45) |
| Bahrajn | Sakhir (dirkališče, Nove proge za 1.0, A16) | po vrsti (odločitev uporabnika 8. 11. 2026 ob 20.45) |
| Katar | Lusail (dirkališče, Nove proge za 1.0, A18) | po vrsti (odločitev uporabnika 8. 11. 2026 ob 20.45) |
| Singapur | stara veja: Singapur (ni v načrtu) | ne pride na vrsto |
| Švedska | Kågeröd (nove proge 1.0, N1, #478); stara veja: Höljes (ni v načrtu) | Kågeröd po vrsti (N1), Höljes ne pride na vrsto; zima je privzeta (8. 11. 2026, razdelek »Sever v snegu«) |
| Danska | Silkeborg (nove proge 1.0, N1, #469) | po vrsti (N1); zima je privzeta (8. 11. 2026, razdelek »Sever v snegu«) |

## Proge z ledom (izbira uporabnika 6. 11. 2026)

Pri vprašanju `led-proge` (stran Odločitve 1; odgovor 6. 11. 2026 prek table #382, komentar 6688514078) je uporabnik izbral **Longyearbyen, Norveška** in **Envalira, Andora**. Odločil je samo vpis na čakanje; progi se delata zadnji, kot vse nove proge. Izbrani sta po pasu 60 m ob cesti, ki ga vidi kamera za avtom. Merilo je število predmetov iz OpenStreetMap do 60 m od ceste na kilometer, brez cest.

- **Longyearbyen, Norveška** (Svalbard): ceste OSM `ref` 600 (od letališča), 500 (mesto) in 100 (do Nybyena), skupaj 7,6 km; pozimi steptan sneg. Do 60 m je 163 stavb (ob 57 % dolžine), 27 cevovodov na stebričkih (34 %), 17 lesenih stolpov stare tovorne žičnice (20 %), fjord (31 %) in skalne stene (22 %), skupaj 41,8 predmeta na km.
- **Envalira, Andora**: krog na ledu, OSM `highway=raceway`, glavni krog je way 330829785 (0,73 km, ~2.370 m, tik pod prelazom Port d'Envalira, 2.408 m). Ime športnega centra ob krogu je blagovna znamka, zato ga v igri ni. Do 60 m so stavbe (ob 51 % dolžine), glavna cesta (95 %), 2 bencinski črpalki, parkirišče in smučišča (16 %), skupaj 21,8 predmeta na km.
- **Led kot podlaga** v igri še ne obstaja in ga izbira v `docs/dez-sneg.md` ne dodaja. Doda ga prva od teh prog (Longyearbyen, Envalira, Koli); oprijem ledu je 11–23 % oprijema suhega asfalta (`docs/dez-sneg.md`). **Kategorija Ice v meniju** (hitra izbira »Choose a country«, odločitev uporabnika 9. 11. 2026): proga z ledom ima v datoteki proge `ice: true`, tedaj jo meni uvrsti v Ice (`docs/meni-izbira-proge.md`, sklop 8); dokler takih prog ni, filter pove »No ice tracks here.«.
- **Koli, Finska** (izbira uporabnika 8. 11. 2026 ob 22.04, razdelek »Finska: Koli«) gre v isti zimski sklop: nova podlaga zbit sneg in led je skupna z Longyearbyenom in Envaliro.
- **Nista izbrani:** Vormsi, Estonija (ledena cesta Rohuküla–Vormsi, 9,5 km, OSM way 1467883983; 0,6 predmeta na km) in Jökulsárlón, Islandija (cesta 1 z enopasovnim visečim mostom z razponom 108 m; 2,3 predmeta na km, zanimiv le pri mostu).
- **Viri** za `README.md` (»Zasluge«) ob izdelavi: OpenStreetMap (ODbL 1.0), Copernicus DEM GLO-30, ESA WorldCover 2021 (CC BY 4.0).

## Sever v snegu (odločitev uporabnika 8. 11. 2026)

Odločitev uporabnika 8. 11. 2026 ob ~21.20 v pogovoru z Matejem (izbire s klikom; tabla #382, komentar 6726783939), dobesedno: »skandinavske države naj imajo proge v snegu«; izbrane vse štiri države.

- **Norveška, Švedska, Danska in Finska:** zima je privzeta. Zasnežena pokrajina in snežni zameti ob cesti; na cestah zbit sneg, na dirkališčih zimski asfalt. Poletje ostane kot izbira vremena. Velja za vsako progo teh držav.
- **Longyearbyen** (Norveška) je že zimska (razdelek »Proge z ledom«).
- **Silkeborg, Danska** (#469) in **Kågeröd, Švedska** (#478) v N1 (#485) dobita zimo v ločenem PR »Zima na severu«, ko je N1 na `main`; N1 gre na `main` brez sprememb. Kateri račun PR naredi, predlaga ponedeljkov načrt (`docs/vrsta.md`, »Načrtovano«).
- **Finska:** Ouninpohja je od 8. 11. 2026 testna (uporabnik: »ouninpuhja je premalo zavita skoraj vse lahko spolnim gasom vozis ni zanimivo, naredi novo progo za finsko da bo na sneg«). Finska ni na odločanju; nova proga v snegu je **Koli** (izbira uporabnika 8. 11. 2026 ob 22.04, razdelek »Finska: Koli«), izdelava gre med nove proge (vedno zadnje), v zimski sklop z Longyearbyenom in Envaliro. Harju ostane v igri, dokler Koli ni na `main`, potem gre v test.

## Finska: Koli (izbira uporabnika 8. 11. 2026 ob 22.04)

Pri vprašanju `finska-zimska-proga` (stran Odločitve jure.kopac26; izbiro je Matej objavil na tabli #382, komentar 6727185416) je uporabnik izbral **Koli, Finska**: zgornji del asfaltne ceste Ylä-Kolintie, odprta cesta navzgor na vrh Kolija (jezero Pielinen, Severna Karelija). Finska ni na odločanju: Ouninpohja je testna, Harju gre v test, ko je Koli na `main`. Podatke je zbrala seja raziskave Finske (session_01Ck3D3Su14UnCfGMjdwHBWh, 8. 11. 2026); pred izdelavo jih seja proge preveri v OpenStreetMap.

- **Pot:** start 63.10116, 29.78530 (156 m) → cilj 63.09611, 29.80614 (313 m, Ylä-Koli pod vrhom), 2,0 km (2010 m); 160 m zaleta nazaj po isti cesti do 63.10218, 29.78308. OSM `highway=tertiary`, asfalt; poti (iz virov Overture, preveri v OSM): w28060023, w441911361, w1535788100 (81 % dolžine), w185268712, w185268711; ob začetku še w125668507, w65744248.
- **Orodje:** `tools/proga-podatki.py`: box [63.0813, 29.7555, 63.1147, 29.8360] (pot + 1,5 km), route skozi start in cilj z imenom ceste »Ylä-Kolintie«.
- **Meritve:** zavitost 452 °/km (cela cesta 3,5 km: 316), ravnine 55 %, najdaljša ravnina 295 m, 6 ovinkov, od tega 3 lasnice; višina +157 m (156 → 313, najvišje 318; Copernicus DEM je površinski model).
- **Izletna cona je:** pregrada do 3 m od roba na 2 % dolžine (stavbe); ograj, zidov in sten v OSM ni.
- **Do 60 m:** gozd narodnega parka (89 %), smučišča ob 24 % dolžine, 2 vlečnici, 20 stavb ob 48 % (vas Ylä-Koli, hotel na vrhu); z vrha razgled na zamrznjeno jezero Pielinen (~1 km vzhodno, ~220 m niže).
- **Zima privzeto** (razdelek »Sever v snegu«): zasnežena pokrajina, zameti ob cesti, zbit sneg na cesti, poletje kot izbira vremena; javna cesta do hotela in smučišča, pozimi splužena. Nova podlaga zbit sneg in led je skupna z Longyearbyenom in Envaliro (razdelek »Proge z ledom«).
- **Pravno:** v igri samo zemljepisna imena (Koli, Ylä-Koli, Pielinen), brez imen hotela, centrov in podjetij.
- **Viri** za `README.md` (»Zasluge«) ob izdelavi: OpenStreetMap (ODbL 1.0, prek Overture Maps), Copernicus DEM GLO-30, Sentinel-2 (Copernicus, zimski posnetek 15. 4. 2025), ESA WorldCover 2021 (CC BY 4.0, delež gozda).
- **Vrstni red:** med novimi progami, zadnja v vrsti (Matej, 8. 11. 2026); Harju gre v test šele, ko je Koli na `main`.

## Kaj to pomeni za verige

- **Kratke proge** (`docs/gorske-proge.md`): odpadejo Nozawa Onsen (A), Guoliang in Corvo Branco (B), Hana (C1), Green Point (D) in Auli (A: Indija ima Killar) ter od 8. 11. 2026 Milford Sound (B: skupina B odpade, Nova Zelandija dobi Cromwell). Ostanejo Medeu, Yungas (če ga ne naredijo prej Nove proge), Ella, Santo Antão, Dadès, Espinazo del Diablo, Punta del Este in Puerto Madero; Mount Buller je narejena (PR #241), od 5. 11. 2026 testna (odločitev uporabnika). Brez izletne cone (5. 11. 2026) se ne začnejo Yungas, Punta del Este in Puerto Madero: skupina D odpade, v C1 ostane Ella.
- **Zavite proge** (`docs/zavite-proge.md`): odpadejo Macao (3), Ouro Preto (1, odločitev uporabnika 5. 11. 2026; skupne gradnike, ki jih načrt daje koraku 1, naredi prvi naslednji korak) in Québec (2; odločitev uporabnika 5. 11. 2026: Kanado zastopa samo Montréal). Ostanejo Valparaíso, Quito, Hongkong in Seul. Wellington (4) odpade (8. 11. 2026: Nova Zelandija dobi Cromwell), Shimla in Darjeeling (4) odpadeta (Indija ima Killar). Brez izletne cone (5. 11. 2026) se ne začnejo Valparaíso, Quito, Hongkong, Shimla in Darjeeling: ostane Seul.
- **Nove proge** (`docs/nove-proge.md`): ostanejo Furka, Gudauri, Llogara, Porto Moniz in Ngorongoro; Pau, Yungas in Stelvio se ne začnejo (brez izletne cone, 5. 11. 2026).
- **Proge z ledom** (razdelek zgoraj): Longyearbyen in Envalira, po vrsti z drugimi novimi progami; prva doda led kot podlago.
- **Osem dirkališč izven Evrope** (8. 11. 2026, razdelek »Nove proge za 1.0«): Tuzla, Sepang, Lombok, Buriram, Sakhir, Cromwell, Lusail in Termas de Río Hondo so A12–A19 v `docs/nove-proge-1-0.md` (»Del 3«); Cromwell zamenja Wellington, Milford Sound, Crown Range in Coronet Peak.
- **Stare veje**: Kapelmuur, Stelvio, Diriyah, Puerto Madero in Hong Kong se ne začnejo (brez izletne cone, 5. 11. 2026). Kapelmuur je izbran, a ni v nobeni verigi: veja je iz 1. 10. 2026, zato jo nova seja (zažene jo koordinacija »VSE SEJE«) spoji s svežim `main`, preveri ime proge (»Kraj, Država«) in umakne imena lokalov, prireditev in kipov. Druge stare veje ostanejo nezdružene.
