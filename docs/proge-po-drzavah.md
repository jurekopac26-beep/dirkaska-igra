# Proge po državah: v igri in na čakanju

Pravilo uporabnika (3. 11. 2026): v prihodnje naredimo iz vsake države samo **eno novo progo** (`CLAUDE.md`, razdelek »Ena proga na državo«). Spodnji tabeli naštejeta za vsako državo proge, ki so že v igri, in proge, ki čakajo. Seja pred začetkom nove proge preveri, ali je proga izbrana oziroma ali je njena država še brez proge.

**Vrstni red dela (odločitve uporabnika 7. 11. 2026, tabla #382):** nove proge so del seznama za različico 1.0 s 50 pravimi progami (`docs/vrsta.md`, »Različica 1.0«). Izdelava novih prog teče naprej (odločitev ob 14.40), **proge so v vrsti za `main` vedno zadnje** (odločitvi ob 16.39 »Proge postavi na zadnja mesta« in ob 16.48, komentar 6709363288): pull request, ki ni proga, se vpiše pred njih, na konec vrste gre samo pull request proge. Narejeni progi Killar (PR #283) in Hakone (PR #261) gresta na `main` v skupini »Proge« (`docs/vrsta.md`), za njo nove proge v skupinah po 3–4. Pravila za nove proge: razdelek »Nove proge za 1.0« spodaj.

Viri prog na čakanju: verige iz `docs/nove-proge.md` (veja `nove-proge/balea`), `docs/gorske-proge.md` (kratke proge, veja `gorske-proge/01-norquay`, skupine A–D) in `docs/zavite-proge.md` (veja `ccr-67c8ebdb-8sdz1o`, koraki 1–4); narejene proge na vejah s pull requestom; stare veje iz oktobra (`claude/proga-<id>` in druge), ki niso na `main`. Pregled prog v igri s slikami kamere 1 in zavitostjo: https://claude.ai/artifact/DvMKmf9ZWhENQYRqhR6DrJ

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
  - **London je izjema od pravila ena proga na državo**: Anglija že ima Crystal Palace, uporabnik pa je London izbral, ko je to vedel.
  - Načrt, podatki poti in vrstni red so v `docs/nove-proge-1-0.md`. Seznam 50 prog (vprašanje `nove-proge-1-0-50`) še čaka.
- **Potrditev seznama pred delom:** seznam je vprašanje na strani Odločitve partyslo in komentar na tabli #382; nobena proga s seznama ali s čakanja (tudi Medeu) se ne začne pred odgovorom uporabnika. Po potrditvi jih partyslo začne kljub meji 6 odprtih tem (izjema »tema, ki jo uporabnik začne kljub opozorilu«; odločitev uporabnika 7. 11. 2026 ob 15.16, komentar 6708059513), največ 2 seji s kodo hkrati.
- **Dirkališča po celinah** (odločitev uporabnika 9. 11. 2026, biketraveler): iz vsake celine eno dirkališče, krog **1–10 km** (izjema od 1–5 km): Mogyoród, Madžarska; Abu Dabi, ZAE; Sindia, Senegal; Yahuarcocha, Ekvador (Severna Amerika odpade, ker ima ZDA Pikes Peak; Oceanija nima proste države z dirkališčem). Po predstavitvi (9. 11. 2026 ob ~11.55) še **Pärnu, Estonija**; **Houli, Tajvan**; **Tocancipá, Kolumbija**; **Cromwell, Nova Zelandija** (prej A17, skupina N8) in **Serres, Grčija**, vsa štiri zgrajena ostanejo (uporabnik: »Važno je samo, da je 1 proga na državo.«); s Serresom ne more več v igro rezerva Meteora, Grčija. Načrt in stanje: `docs/dirkalisca-celine.md`; v vrsti skupine N10, N11 in N12.
- **Mestne proge po središču velikih mest:** velika mesta (npr. London) dobijo kratko dirko po središču, v spodnjem delu razpona 1–5 km, po širokih glavnih ulicah, nabrežjih in trgih, z ograjami kot na uličnih dirkah; stavbe so generične, brez pravno spornih imen in podob (kot pri Monte Carlu). **Zanje pravilo izletne cone ne velja** (razdelek »Izletna cona«).

## Izletna cona (odločitev uporabnika 5. 11. 2026)

Pravilo v `CLAUDE.md` (»Ena proga na državo«): nova proga mora imeti izletno cono; proga, ki ima pregrado večinoma takoj ob cesti, se ne začne (ne briše se), proga v pull requestu se samo javi. Uporabnik (5. 11. 2026): »Niso mi všeč proge, ki nimajo izletne cone, to pomeni da je ograja večinoma časa takoj ob cesti.« Izjema (odločitev uporabnika 7. 11. 2026): mestne proge po središču velikih mest (razdelek »Nove proge za 1.0«).

**Merilo:** delež dolžine ceste, kjer je pregrada (ograja, zid, hiša, skalna stena, prepad, most, predor) do 3 m od roba asfalta na vsaj eni strani (v oklepaju: na obeh); »večinoma« je več kot pol dolžine. Narejene proge (pull requesti, stare veje) so izmerjene v igri: meja, ob kateri se avto ustavi (`T.bl`, `T.br` v `js/core.js`), manj polovica širine asfalta (`T.wAt(i)`), na vsakih 5 m. Nenarejene so izmerjene iz OpenStreetMap (pot po cestah OSM, žarek levo in desno do 3 m čez rob asfalta: `barrier=guard_rail`, `wall`, `retaining_wall`, `fence`, stavbe, `natural=cliff`, mostovi, predori); OSM ima ponekod vrisan le del hiš in ograj, zato je to spodnja meja, in kjer je vrisanega očitno premalo, odloča vrsta ceste iz načrta. Ulične proge imajo začasne betonske ograje ob vsem krogu (ulične proge v igri: 71–100 %). Gorske ceste dobijo v igri rob ~3,4 m do ograje (Bâlea, Hakone: 0 %), zato jih ograja ob resnični cesti ne izloči; izločijo jih hiše, zidovi, predori in ozke police v steni.

| Proga | Kje čaka | Pregrada ≤3 m | Odločitev |
|---|---|---|---|
| Hakone, Japonska | PR #261 | 0 % (v igri, povprečno 6,7 m od asfalta) | izletna cona je |
| Medvode, Slovenija | PR #153 | 10 %, obe 3 % (v igri, povprečno 6,1 m; na `main` zdaj 99 %) | izletna cona je (pločniki) |
| Bâlea, Romunija | PR #226 | 0 % (v igri, povprečno 6,8 m) | izletna cona je |
| Killar, Indija | PR #283 | 99 %, obe 58 % (v igri, povprečno 2,3 m) | brez izletne cone (prepad in stena ob ozki polici); v PR, samo javljeno |
| Pau, Francija | Nove proge 7 | ulična proga | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026) |
| Puerto Madero, Argentina | kratke D, Načrtovano | 75 %, obe 38 % (stara veja, v igri) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ulična proga |
| Punta del Este, Urugvaj | kratke D | ulična proga | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026) |
| Diriyah, Saudova Arabija | stara veja, Načrtovano | 57 %, obe 24 % (stara veja, v igri; ostalo večinoma 3–4 m) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ulična proga |
| Hong Kong ob pristanišču, Kitajska | stara veja (odpade), Načrtovano | 74 %, obe 24 % (stara veja, v igri) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ulična proga |
| Stelvio, Italija | stara veja, Načrtovano | 99 %, obe 99 % (stara veja, v igri: ograja 0,8 m od asfalta) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): zidovi in ograje ob ozki cesti |
| Kapelmuur, Belgija | stara veja, Načrtovano | 59 %, obe 19 % (stara veja, v igri); OSM vzpon 68 % | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): hiše ob tlakovanih ulicah |
| Québec, Kanada | zavite 2 | OSM 56 %, obe 21 % | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): obzidje, hiše in skala ob ozkih ulicah |
| Ouro Preto, Brazilija | zavite 1, Načrtovano | OSM 18 % (hiše vrisane le ob 41 % poti) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ozke tlakovane ulice, hiše ob pločniku |
| Valparaíso, Čile | zavite 2 | OSM 34 % (hiše vrisane ob 65 % poti) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ozke ulice na gričih, hiše ob pločniku |
| Quito, Ekvador | zavite 2 | OSM 24 % (hiše vrisane ob 53 % poti) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): kolonialne ulice in hiše na pobočju |
| Hongkong, Kitajska | zavite 3 | OSM 33 % (zidovi 21 %, ograje 8 %) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): podporni zidovi in ograje ob ozki cesti |
| Shimla, Indija | zavite 4 | OSM 15 % (hiše vrisane ob 65 % poti) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): hiše, bazar in zidovi ob cesti |
| Darjeeling, Indija | zavite 4 | OSM 6 % (hiše vrisane ob 32 % poti) | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): hiše in železnica tik ob ozki cesti |
| Yungas, Bolivija | kratke C1, Nove proge 6 | OSM brez vrisanih ovir | **ne začni**: brez izletne cone (odločitev uporabnika 5. 11. 2026): ozka polica v steni, prepad brez ograje (kot Killar) |
| Medeu, Kazahstan | kratke A, Načrtovano | OSM 12 % (ograje) | izletna cona je |
| Milford Sound, Nova Zelandija | kratke B | OSM 37 %, obe 37 % (predor 1,2 km je tretjina poti, mostovi) | izletna cona je (razen v predoru) |
| Ella, Šrilanka | kratke C1 | OSM 2 % | izletna cona je |
| Santo Antão, Zelenortski otoki | kratke C2 | OSM 6 % | izletna cona je |
| Dadès, Maroko | kratke C2 | OSM 2 % | izletna cona je |
| Espinazo del Diablo, Mehika | kratke C2 | OSM 0 % | izletna cona je |
| Auli, Indija | kratke A (odpade, če pride Killar na `main`) | OSM 1 % | izletna cona je |
| Furka, Švica | Nove proge 2A, Načrtovano | OSM 7 % (mostovi) | izletna cona je |
| Gudauri, Gruzija | Nove proge 3 | OSM 0 % | izletna cona je |
| Llogara, Albanija | Nove proge 4 | OSM 1 % (stara cesta čez prelaz, ne novi predor) | izletna cona je |
| Porto Moniz, Portugalska | Nove proge 5 | OSM 10 % (hiše) | izletna cona je |
| Ngorongoro, Tanzanija | Nove proge 8 | travnata pobočja brez hiš in ograj (načrt) | izletna cona je |
| Seul, Južna Koreja | zavite 3 | OSM 2 % (cesta skozi park) | izletna cona je |
| Wellington, Nova Zelandija | zavite 4 | OSM 4 % (hiše vrisane, odmaknjene od ceste) | izletna cona je |

## Države s progo v igri: izbira uporabnika

Odločitev uporabnika 3. 11. 2026 (v pogovoru, na vprašanja `ena-proga-<država>` na strani Odločitve): »dodaj samo tiste, ki si jih priporočal, ter Québec«. Iz teh držav se naredi samo izbrana proga; proge v stolpcu »Odpadejo« se ne delajo (seja jih v svoji skupini ali koraku preskoči).

Odločitev uporabnika 5. 11. 2026 zvečer: »Od prog iz Brazilije naj ostane samo Rio do Rastro.« Rio de Janeiro je odtlej testna (PR #365), izbrana nova proga Ouro Preto odpade; Brazilija nove proge nima.

| Država | V igri | Izbrana nova proga | Odpadejo |
|---|---|---|---|
| ZDA | Pikes Peak (asfalt in makadam); od 5. 11. 2026 samo ta (odločitev uporabnika), druge proge iz ZDA gredo med testne (`test: true`, za izbris): Big Sur, Uncompahgre, Beartooth, Mount Baldy, Monterey in Palomar Mountain ter Santa Monica Mountains, Moki Dugway, Mauna Kea, Riverside in Detroit | nobena | Hana (kratke, C1); stare veje: Mount Lemmon, Mount Rose, Long Beach |
| Avstralija | Bathurst, Great Alpine Road: na odločanju (`pending: true`; odločitev uporabnika 6. 11. 2026: ostane ena, ki jo izbere uporabnik); Longford, Newcastle, Mount Hotham in Townsville so od 6. 11. 2026 testne (`test: true`, za izbris; odločitev uporabnika: »Vse ostale daj v test«) | Mount Buller (narejena, PR #241; gre v test s PR #379) | stara veja: Phillip Island |
| Kanada | Toronto, Montréal, Trois-Rivières | Québec (zavite, 2) — **ne začni** (brez izletne cone, 5. 11. 2026) | – |
| Japonska | Suzuka, Irohazaka | Hakone (narejena, PR #261) | Nozawa Onsen (kratke, A); stare veje: Aso, Zao, Tokio |
| Brazilija | Rio do Rastro; od 5. 11. 2026 samo ta (odločitev uporabnika), Rio de Janeiro gre med testne (`test: true`, za izbris) | nobena (5. 11. 2026) | Ouro Preto (zavite, 1; odločitev uporabnika 5. 11. 2026), Corvo Branco (kratke, B); stara veja: São Paulo |
| Južna Afrika | Chapman's Peak, Sani Pass | nobena | Green Point (kratke, D; tudi stara veja `claude/proga-capetown`) |
| Finska | Ouninpohja, Harju | – | – |
| Slovenija | Medvode; Vršič je od 6. 11. 2026 testna (`test: true`, za izbris; odločitev uporabnika, PR #394) | – | – |
| Kitajska | Tianmen | Hongkong (zavite, 3) — **ne začni** (brez izletne cone, 5. 11. 2026) | Macao (zavite, 3), Guoliang (kratke, B); stare veje: Peking, Hong Kong ob pristanišču |
| Čile | Los Caracoles | Valparaíso (zavite, 2) — **ne začni** (brez izletne cone, 5. 11. 2026) | stara veja: Santiago |
| Italija | Livorno | Stelvio (stara veja `ccr-b30cfdb0-ej1gzj`, v verigi Nove proge) — **ne začni** (brez izletne cone, 5. 11. 2026) | – |
| Maroko | Marrakesh | Dadès (kratke, C2) | – |
| Belgija | Spa | Kapelmuur (stara veja `claude/blissful-knuth-ww01kw`; ni v nobeni verigi, posodobi jo nova seja) — **ne začni** (brez izletne cone, 5. 11. 2026) | – |
| Nemčija | Nürburg | – | – |
| Avstrija | Štajerska | – | – |
| Rusija | Katu-Jaryk | – | – |
| Anglija | Crystal Palace | – | – |
| Tajska | Bang Saen | – | – |

## Ocene prog v igri: ena proga na državo

Uporabnik 4. 11. 2026: »prosim shrani si ocene, da izberem samo 1 progo na državo«. Ocene od 1 do 5 (5 najboljša), kot jih da uporabnik; ko so ocenjene vse proge države, uporabnik izbere tisto, ki ostane (ostale lahko gredo med testne, kot Santa Monica Mountains, Detroit, Moki Dugway, Riverside in Mauna Kea 4. 11. 2026). Države z eno progo v igri tu niso naštete.

| Država | Proge v igri: ocena | Izbrana |
|---|---|---|
| ZDA | Pikes Peak (asfalt in makadam) **5** (4. 11. 2026), Big Sur –, Uncompahgre –, Beartooth –, Moki Dugway **4** (4. 11. 2026; med testne istega dne), Mauna Kea **4** (4. 11. 2026; med testne istega dne), Mount Baldy –, Riverside **3** (4. 11. 2026; med testne istega dne), Monterey –, Palomar Mountain **4,5** (4. 11. 2026) | – |
| Avstralija | Bathurst **4,5** (4. 11. 2026), Longford **3** (4. 11. 2026), Newcastle –, Great Alpine Road **5** (4. 11. 2026), Mount Hotham –, Townsville – | – |
| Kanada | Toronto –, Montréal –, Trois-Rivières – | – |
| Japonska | Suzuka –, Irohazaka **5** (4. 11. 2026) | – |
| Brazilija | Rio do Rastro **5** (4. 11. 2026), Rio de Janeiro – | – |
| Južna Afrika | Chapman's Peak **5** (4. 11. 2026), Sani Pass **4** (4. 11. 2026) | – |
| Finska | Ouninpohja –, Harju – | – |
| Slovenija | Vršič –, Medvode – | – |

Ocene prog iz držav z eno progo v igri (za primerjavo): Spa, Belgija **5** (4. 11. 2026); Los Caracoles, Čile **5** (4. 11. 2026); Livorno, Italija **3** (4. 11. 2026).

## Države brez proge v igri: po vrsti

Proge gredo v delo, ko pridejo na vrsto. Ko država dobi progo (na `main` ali v delu na veji), druge iz iste države odpadejo. Stare veje, ki niso v nobenem načrtu, ne pridejo na vrsto.

| Država | Na čakanju | Odločitev |
|---|---|---|
| Indija | Auli (kratke, A), Shimla in Darjeeling (zavite, 4); Killar (PR #283) | Killar je v vrsti (PR #283; pregrada ≤3 m na 99 %, javljeno uporabniku 5. 11. 2026): ko pride na `main`, Auli, Shimla in Darjeeling odpadejo; dotlej po vrsti Auli; Shimla in Darjeeling: **ne začni** (brez izletne cone, 5. 11. 2026) |
| Argentina | Puerto Madero (kratke, D; narejen tudi na stari veji); stara veja: Siete Lagos (ni v načrtu) | Puerto Madero: **ne začni** (brez izletne cone, 5. 11. 2026); Argentina nima druge proge na čakanju |
| Francija | Pau (Nove proge); stara veja: Montvernier (ni v načrtu) | Pau: **ne začni** (brez izletne cone, 5. 11. 2026) |
| Nova Zelandija | Milford Sound (kratke, B), Wellington (zavite, 4) | po vrsti; pričakovan prvi Milford Sound |
| Bolivija | Yungas v dveh verigah (kratke, C1, in Nove proge; ista cesta) | **ne začni** (brez izletne cone, 5. 11. 2026) |
| Romunija | Bâlea (narejena, PR #226) | po vrsti |
| Švica | Furka (Nove proge) | po vrsti |
| Gruzija | Gudauri (Nove proge) | po vrsti |
| Albanija | Llogara (Nove proge) | po vrsti |
| Portugalska | Porto Moniz (Nove proge) | po vrsti |
| Tanzanija | Ngorongoro (Nove proge) | po vrsti |
| Saudova Arabija | Diriyah (stara veja `claude/proga-diriyah`, v verigi Nove proge) | **ne začni** (brez izletne cone, 5. 11. 2026) |
| Kazahstan | Medeu (kratke, A) | po vrsti |
| Šrilanka | Ella (kratke, C1) | po vrsti |
| Zelenortski otoki | Santo Antão (kratke, C2) | po vrsti |
| Mehika | Espinazo del Diablo (kratke, C2) | po vrsti |
| Urugvaj | Punta del Este (kratke, D) | **ne začni** (brez izletne cone, 5. 11. 2026) |
| Ekvador | Yahuarcocha (dirkališče, izbira uporabnika 9. 11. 2026, `docs/dirkalisca-celine.md`); Quito (zavite, 2) | Yahuarcocha v delu (biketraveler); Quito odpade (tudi **ne začni**: brez izletne cone, 5. 11. 2026) |
| Madžarska | Mogyoród (dirkališče, izbira uporabnika 9. 11. 2026, `docs/dirkalisca-celine.md`) | v delu (biketraveler) |
| Združeni arabski emirati | Abu Dabi (dirkališče, izbira uporabnika 9. 11. 2026, `docs/dirkalisca-celine.md`) | v delu (biketraveler) |
| Senegal | Sindia (dirkališče, izbira uporabnika 9. 11. 2026, `docs/dirkalisca-celine.md`) | v delu (biketraveler) |
| Južna Koreja | Seul (zavite, 3) | po vrsti |
| Singapur | stara veja: Singapur (ni v načrtu) | ne pride na vrsto |
| Švedska | stara veja: Höljes (ni v načrtu) | ne pride na vrsto |

## Kaj to pomeni za verige

- **Kratke proge** (`docs/gorske-proge.md`): odpadejo Nozawa Onsen (A), Guoliang in Corvo Branco (B), Hana (C1) in Green Point (D). Ostanejo Mount Buller, Medeu, Auli, Milford Sound, Yungas (če ga ne naredijo prej Nove proge), Ella, Santo Antão, Dadès, Espinazo del Diablo, Punta del Este in Puerto Madero. Brez izletne cone (5. 11. 2026) se ne začnejo Yungas, Punta del Este in Puerto Madero: skupina D odpade, v C1 ostane Ella.
- **Zavite proge** (`docs/zavite-proge.md`): odpadeta Macao (3) in Ouro Preto (1, odločitev uporabnika 5. 11. 2026; skupne gradnike, ki jih načrt daje koraku 1, naredi prvi naslednji korak). Ostanejo Valparaíso, Quito, Québec, Hongkong in Seul. Wellington, Shimla in Darjeeling (4) odpadejo, če Nova Zelandija in Indija pred njimi dobita progo (Milford Sound, Auli). Brez izletne cone (5. 11. 2026) se ne začnejo Valparaíso, Quito, Québec, Hongkong, Shimla in Darjeeling: ostaneta Seul in Wellington.
- **Nove proge** (`docs/nove-proge.md`): ostanejo Furka, Gudauri, Llogara, Porto Moniz in Ngorongoro; Pau, Yungas in Stelvio se ne začnejo (brez izletne cone, 5. 11. 2026).
- **Stare veje**: Kapelmuur, Stelvio, Diriyah, Puerto Madero in Hong Kong se ne začnejo (brez izletne cone, 5. 11. 2026). Kapelmuur je izbran, a ni v nobeni verigi: veja je iz 1. 10. 2026, zato jo nova seja (zažene jo koordinacija »VSE SEJE«) spoji s svežim `main`, preveri ime proge (»Kraj, Država«) in umakne imena lokalov, prireditev in kipov. Druge stare veje ostanejo nezdružene.
