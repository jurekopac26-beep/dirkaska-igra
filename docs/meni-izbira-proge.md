# Nov zaslon za izbiro proge (načrt)

Načrt prenove koraka *Single race* → izbira proge (`#s-track` v `js/menu.js`, `css/menu.css`). Odločitve so uporabnikove (seja 27.–30. 10. 2026, odločanje v slikah). Predstavitev s slikami, različicami in vprašanji: https://claude.ai/artifact/S515stLZgqC12cTVguKT6Q (zasebna; slike so njena sredstva, berejo se z orodjem Artifact).

Delo gre po sklopih; **vsak sklop je svoja seja** z navodilom »Naredi sklop N po docs/meni-izbira-proge.md«. Sklop gre na `main`, ko so testi zeleni in ga uporabnik potrdi. Kratki odgovori: tabela, kaj je narejeno, in vprašanja. Pri majhnih popravkih slike le izrez spremenjenega dela; za izbiro 3 različice (več le na prošnjo).

## Kaj je odločeno (pokonci, 412 × 892)

Od zgoraj navzdol:

1. **Glava:** levo gumb s **hiško** (namesto puščice nazaj), na sredini v eni vrstici **država, kraj in nadmorska višina** (npr. `SLOVENIA, VRŠIČ 1,388 m`; država in kraj z velikimi črkami; višino 1.388 m je napisal uporabnik, prelaz v podatkih igre je 1.611 m: potrdi z uporabnikom), desno **globus** (država obarvana). Napisa *Single race* in zavihkov skupin (*Circuits*, *Open roads*, *Rally*, *Test*) ni več.
2. **Slika** (oder) čez celo širino, približno pol zaslona (430 px pri 892):
   - **Gumbi za kamero zgoraj levo**, sedanje velikosti, z ikonami: 1 **zemljevid** od zgoraj (okvir s cesto), 2 **prelet** (puščica po krivulji), 3 **kamera na zavoju** (videokamera). Izbrani je zlat.
   - **Vreme zgoraj desno**, navpično, odprto navzdol: 4 ikone *Dry*, *Rain*, *Changing*, *Storm* (`dry`, `rain`, `change`, `storm`). Slog je še odprt (spodaj); privzeto različica 1: izbrana ikona večja, v barvi (sonce zlato in oranžno), z napisom; ostale manjše, sive, brez napisa.
   - **Kamera 1 – zemljevid:** kot zdaj (`topView`), proga brez zemljevida pokaže maketo (`assets/tracks/<id>.webp`). Brez grafa.
   - **Kamera 2 – prelet** (`fly-<id>.webm`): označena sta **samo start in cilj** (brez `.fl-q` krajev in brez okvirčka s krajem `.hud`). **Graf višine** čez celo širino slike spodaj (višina 72 px), **samo v preletu**: prevoženi del (do svetleče pike) je obarvan po strmini od zelene do rdeče (barve kot sled v preletu, tabela `GR`: 1 % zelena … 12 % temno rdeča), pot naprej je tanka bela črta; levo spodnja višina (810 m), desno zgornja (1,611 m), spodaj km; brez črtkanih črt.
   - **Kamera 3 – kamera na zavoju:** mirujoča kamera na najzanimivejšem zavoju proge, mimo neprestano vozijo tekmeci. Vršič: 8. serpentina pri Ruski kapelici (`s` ≈ 7128 m, indeks točke 3564; tri serpentine zaporedoma, v kadru dve ravni ceste). Za vsako progo zavoj izbere seja in ga v sliki predlaga uporabniku.
3. **Vrstica podatkov**, po vrsti: **Opponents** (številka bela, brez okvirja, 30 px, odebeljena), **Best race** (zlato; na krožni progi *Best lap*), **Length**, **Climb** (odprta cesta) oz. **Corners** (krožna proga), **zastava** države (globus je v glavi). Dotik številke odpre izbiro **0–100** (spodnji list: velika številka, hitre izbire 0 *Trial* / 1 / 5 / 12 / 25 / 50 / 100, drsnik, *Done*).
4. **Prostor z avtom:** stena in tla (rahlo obzorje v višini avta). Za avtom **modra cestna tabla** z imenom **države** (`SLOVENIA`), velike črke na sredini, bel rob, na dveh kovinskih stebrih, sega do desnega roba, levi del je za avtom (tabla je malo temnejša, kot v ozadju). **Brez** nadmorske višine na tabli, brez zelenih tablic, brez zastave na drogu.
   - **Avto:** 3D model igralčevega avta v njegovi barvi, levo, spredaj, s **črtami vetra v 3D** (tok okoli karoserije, od roba do roba, animacija *valovi*, mehke barve). Dotik avta odpre **garažo** (`garaza.html?car=<id>&color=<rrggbb>`). Napisa *YOUR CAR / BURJA R7* ni.
5. **Gumba s sosednjima progama:** levo prejšnja, desno naslednja proga, v gumbu **cela zastava** njene države (ob drogu levo, v svojem razmerju; zadnji stolpec zastave se raztegne do desnega roba, zato ima vsak pas pravi delež) in bela dvojna puščica. Akcija ostane `data-act="track:-1"` / `track:1` (plošček LB/RB, tipke, poteg).
6. **Spodaj:** gumb nazaj in dolg rdeč **Race!**.

**Seznam prog:** brez skupin, vse proge v enem seznamu: **prave proge od najkrajše do najdaljše**, nato **testne** (`test: true`) od najkrajše do najdaljše; seznam se **vrti v krog** (za zadnjo spet prva). Enake dolžine po `id`. Pri Vršiču sta soseda Los Caracoles (Čile) in Nürburg (Nemčija).

**Ležeče** (od 640 × 360): oder levo (pol širine, vsa višina, z vremenom, kamero in grafom), desno glava, vrstica, avto s tablo, soseda, nazaj in Race!.

**Zastave:** `assets/flags/<država>.svg` (20 držav: slovenia, austria, germany, belgium, finland, england, france, italy, monaco, usa, canada, brazil, chile, australia, south-africa, morocco, japan, china, thailand, russia). Narisane po uradnih predpisih (razmerje = `viewBox`, uradne barve, znaki), vsako je preveril drug agent (popravljena Brazilija in Maroko). Anglija ima križ sv. Jurija, ne britanske zastave.

## Sklopi

| Sklop | Vsebina | Čas | Stanje |
|---|---|---|---|
| 1 | Postavitev zaslona (glava s hiško, državo in zastavo; oder; vrstica; prostor s tablo in sliko avta; soseda; nazaj + Race!), seznam vseh prog po dolžini v krog, ležeče, testi | 6–7 h | na main (PR #239, 1. 11. 2026) |
| 2 | Zastave v igri (iz `assets/flags`), globus z obrisi držav, graf višine za vse proge | 5–6 h | narejen, lokalni testi zeleni; pull request #244 (na `main`, ko so testi na GitHubu zeleni) |
| 3 | 3D avto z vetrom (valovi), dotik → garaža | 4–5 h | |
| 4 | Tri kamere: zemljevid, prelet (samo start in cilj, graf), kamera na zavoju | 5–6 h | |
| 5 | Tekmeci 0–100 (nova nastavitev, meritev telefona) | 3–4 h | |
| 6 | Uporabnikovi popravki, dokumentacija, celotni testi | 2–3 h | |

### Sklop 1: kaj je narejeno

- `vTrack()` v `js/menu.js`: glava (`.thead`: hiška `data-act="home"` na naslovnico, `.where` država, kraj in višina `heightOf` (`MENU.heads`, sicer vrh proge), globus je zaenkrat ikona), oder z vremenom ob desnem robu (`.wxv`, `weather:dry|rain|change|storm`, spodaj *···* odpre *Race options*), vrstica `.trow` (*Opponents* iz `G.rivals(d)`, v kronometru *Gold time*, v policijskem lovu *Police*), prostor `.yard` (tabla `.sign` z državo, testna proga z oznako *TEST*; avto `.car` = `pick-car`: slika iz `assets/cars/img` ali `G.carPic()` iz salona z izrezanim ozadjem), soseda `.nb` (`track:-1` / `track:1`, zastava ob drogu, zadnji stolpec raztegnjen: `flagFill`), noga.
- Skupin ni več (`group`, `D.groups`, `.groups`, `.card`, `.arrow`, `.pcount` odstranjeni); seznam `TRACKS()` = vse proge načina, razvrščene po `MENU.lens` (`tools/menu-lens.js`, test `tests/menu-lens.test.js`). Novi igralec začne na prvi pravi progi seznama (Trois-Rivières).
- Kamera ostaja stikalo 1/2 (sklop 4), okvirček `.hud` preleta je na tem zaslonu skrit. Uvod pred dirko bere vrstico (`cardRect` → `#s-track .trow`).

### Sklop 2: kaj je narejeno

- **Zastave:** uvod pred dirko in vikend (`.ix-flag`, `flagSvgOf`) imata zastavo iz `assets/flags` (vseh 20 držav, v svojem razmerju, višina 20 px); slovar `FLAGS` (8 narisanih) je odstranjen. Drugje v igri držav ni (zastave ob Nürburgu so okras sveta).
- **Globus v glavi** (`globe` v `js/menu.js`): Zemlja (majhna Blue Marble `assets/geo/earth-s.webp`, 1024 × 512, 75 KB; iz `earth.webp`), obrnjena h kraju proge, država zlata, bel obroček okoli kraja; enkrat na progo na platno (44 px, 2–3-kratna gostota), ob novem izrisu zaslona se vrne isto platno; dokler se Zemlja ne naloži, ikona. Obrisi: `GEO.outlines` (17 držav) in `MENU.globe.outlines` (Anglija, Francija, Italija; Havaji k ZDA za Mauna Keo): Natural Earth 1:50m, orodje `tools/menu-globe.mjs`. Kraji: `GEO.tracks` (40 prog) in `MENU.globe.places` (Bathurst, Crystal Palace, Rio: start iz datoteke proge). Testna proga brez kraja: sredina države, brez obročka; brez države (Bakreni gozd, Gromski rt): ikona. Videz `GLOBE_LOOK` (1 cela Zemlja, 2 bliže, 3 bliže in država sveti): vprašanje C.
- **Graf višine** (`graphOf`, `graphOn`): čez spodnji rob odra, 72 px, samo pri kameri 1 (prelet; do sklopa 4 tudi pri progi brez preletnega posnetka, ko je izbrana 1: na zemljevidu in na maketi); prevoženi del do pike obarvan po strmini (`GRADE`: 1 % zelena … 12 % temno rdeča, navzdol zelena), naprej tanka bela črta, levo najnižja, desno najvišja višina, spodaj km. Strmina je iz višin igre na njenih razdaljah (Pikes Peak je skrajšan: resnične višine na razdaljah igre bi dale 3-krat večjo strmino). Pika gre s preletom (`R.fly.frames`), s točko na zemljevidu (ura SVG: 1,6 s, nato krog v 15 s, reli 11 s) ali enako hitro po maketi. Višine: `R.prof` (resnične z `routeMaps`), za 6 prog brez poti `MENU.profs` (`tools/menu-lens.js`; Bathurst 708 m, Crystal Palace 66 m, Rio 5 m nad morjem na startu, iz datotek prog). Glava zato pokaže vrh tudi tem progam (Bathurst 873 m). Imena preleta se ne pokažejo pod grafom; zemljevid pusti prostor zanj.
- **Testi:** nov `tests/menu-globe.test.js` (zastave, obrisi, kraji v svoji državi, `earth-s.webp`), `tests/menu-lens.test.js` (višine `MENU.profs`), `tests/browser/menu.test.mjs` (globus na Nürburgu: Nemčija zlata; graf: višine, km, 121 barv, raste s preletom, samo pri 1; vsaka proga vsakega načina ima graf in globus; zastava ZDA v uvodu; graf v vseh štirih postavitvah).
- **Stran Odločitve:** naslov v `CLAUDE.md` (`1jxNEJ27WiYpCAw3YbRXEV`) se ne odpre; prava stran je https://claude.ai/artifact/PCXaC5F3xSgjAQ1cAhe3kR (tam m1–m7).

## Opombe iz pregleda kode (main @ c186d26)

- **Seznam:** `buildTracks()` `js/menu.js:77-92` razvršča le po skupini (`GROUP_ORDER` :75); `TRACKS()` = `groupList(group)` :109; `track:±1` se že vrti (:917). `group` se uporablja še v :95, 249, 265, 492, 517, 562, 834, 893-894, 1000 in `Menu.debug` (:1035). `D.groups` v `js/menu-data.js:31-48`.
- **Dolžine za razvrščanje:** gradnja vseh prog (`G.track(id)` → `Core.Track`) traja ~5 s, zato ne ob odprtju menija: tabela dolžin v `js/menu-data.js` (orodje + test, ki jo primerja z `raceLen`/`len`) ali dolžina loma `def.points` med startom in ciljem (~9 ms za vse, napaka ≤ 1,2 %, enak vrstni red).
- **Zaslon:** `vTrack()` `js/menu.js:374-397`; `info()` :168, `.drows` (avto, vreme) :392-394, noga :396 (`race-single`). CSS: `.stage.navbar`/`.pcount` 80-86, `.arrow` 67-72, `.groups` 385-392, `.mapv` 394-397, `.info` 99-113, `.drows` 288-294, `.badge` 128-133, `.hud` 444-450, ležeče 795-834, varni robovi 849-855. Uvod bere `#track-stage` in `#s-track .card` (`stageRect`/`cardRect` :475-486).
- **Kamere:** `mapV` (`S.mapV`, `game.js:29`, dovoljeno 1/2 v :68, privzeto 1) in `D.mapVersions` (1 = prelet, 2 = zemljevid) — novi pomen 1 = zemljevid, 2 = prelet, 3 = zavoj: preseli nastavitev ali novo ime ključa.
- **Vreme:** menu zdaj pozna 3 (`WEATHER`/`W_SET` :71), igra sprejme 5 (`game.js:61`); `weatherIdx` :101, prekrivni dež `wx` :114-159.
- **Rekord:** `G.record(d)` (`game.js:5434`) vrne en par (*Best race*, *Best lap*, *Best time* …). Climb: `def.alt`; brez `def.alt` vsota vzponov; krožne proge: Corners.
- **Graf za proge brez `ROUTES`:** vzorči `hy` zgrajene proge (`core.js:748`) od `startIdx` do `finishIdx` (~120 točk); absolutne višine le z `def.alt`.
- **Tekmeci:** ni nastavitve; `rivN(d)` `game.js:451` (`NUM_AI` 21), `newRace` :1879. Nürburg ima `rivals: 20` (spodnja meja). Na odprtih cestah je štartna vrsta stisnjena (`core.js:5378-5396`): pri ~99 se avti na Tianmen in Uncompahgre prekrivajo → omejitev ~21–40 ali delo na štartni vrsti. Proge samo za kronometer (ouninpohja, katu, harju): izbira skrita.
- **Kamera na zavoju:** v živo le za naloženo progo (druge zahtevajo `ensureTrack`, sekunde na telefonu) → posnet kratek video zavoja na progo (6–8 s v zanki, ~0,6–1,2 MB, kot `heli.mjs`), plakat `.webp`; obstoječe: `Render.setShot` (mirujoča kamera), `tvCams` `render.js:8934`.
- **Garaža:** danes `pick-car` → `G.act('to-car')` (`menu.js:925`); garaža je `garaza.html`. Avto v meniju: `Render.carShot(o)` (`render.js:9624`) nariše katerikoli model in barvo.
- **Globus:** `js/geo.js` ima obrise le za 8 držav (+ Colorado); manjkajo Čile, Rusija, Avstralija, Južna Afrika, Kitajska, Brazilija, Anglija, Kanada, Tajska, Maroko (in Francija, Italija). Koordinate imajo le proge v `GEO.tracks` (11). Tekstura `assets/geo/earth.webp`.
- **Vršič nima makete** `assets/tracks/vrsic.webp` (nikoli dodana).
- **Testi:** ta zaslon preizkuša le `tests/browser/menu.test.mjs`; zlomijo se razdelki 3 (skupine), 4 (vreme, `.arrow`), 5 (Harju prek `group:rally`), 5a/5b, 6 (postavitve, `.card`, `.groups`, `.pcount`), 8 (`mapv:2`), 10. Ime proge se bere iz `.card h1` → nov stabilen izbirnik (npr. tabla `.sign b`). Ukazi: `node tools/stamp.js`, `node tests/browser/menu.test.mjs`, `npm run test:related`; zlatih referenc menu ne potrebuje. Dokumentacija: `README.md` »Nov meni«, `tests/README.md:205`, `docs/kazalo.md`.

## Odprta vprašanja (privzeta izbira, dokler uporabnik ne odgovori)

| # | Vprašanje | Privzeto |
|---|---|---|
| A | Slog vremena zgoraj desno (1–6 v predstavitvi) | 1 |
| 1 | Pull request za vsak sklop? | uporabnik (1. 11.): seja sama odpre PR in ga združi, ko so testi zeleni; sklopi 2–6 zaporedno |
| 2 | Kamera 3 v živo ali posnet video? | uporabnik (1. 11.): posnet video |
| 3 | Katera kamera ob odprtju? | 1 zemljevid |
| 4 | Ime avta? | samo v garaži |
| 5 | Proga brez preleta ali videa zavoja | maketa proge |
| 6 | Testne proge: oznaka TEST na tabli? | da |
| 7 | Kam gredo dodatne možnosti (letni čas, čas dneva, dolžina) iz sedanjega lista vremena in *Gold time* kronometra? | uporabnik (30. 10.): *···* pod vremenom ostane; *Gold time* na mestu *Opponents* |
| B | Višina v glavi: 1,611 m (vrh iz podatkov igre), 1,388 m ali brez? | uporabnik (30. 10.): 1,388 m (`MENU.heads` v `js/menu-data.js`); druge proge vrh proge, dokler uporabnik ne reče drugače |
| C | Videz globusa v glavi: 1 cela Zemlja, 2 bliže, 3 bliže in država sveti (stran Odločitve, m7) | 1 |
