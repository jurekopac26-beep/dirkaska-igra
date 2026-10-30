# Nov zaslon za izbiro proge (načrt)

Načrt prenove koraka *Single race* → izbira proge (`#s-track` v `js/menu.js`, `css/menu.css`). Odločitve so uporabnikove (seja 27.–30. 10. 2026, odločanje v slikah). Predstavitev s slikami, različicami in vprašanji: https://claude.ai/artifact/S515stLZgqC12cTVguKT6Q (zasebna; slike so njena sredstva, berejo se z orodjem Artifact).

Delo gre po sklopih; **vsak sklop je svoja seja** z navodilom »Naredi sklop N po docs/meni-izbira-proge.md«. Sklop gre na `main`, ko so testi zeleni in ga uporabnik potrdi. Kratki odgovori: tabela, kaj je narejeno, in vprašanja. Pri majhnih popravkih slike le izrez spremenjenega dela; za izbiro 3 različice (več le na prošnjo).

## Kaj je odločeno (pokonci, 412 × 892)

Od zgoraj navzdol:

1. **Glava:** levo gumb s **hiško** (namesto puščice nazaj), na sredini v eni vrstici **kraj in nadmorska višina**, brez države (npr. `VRŠIČ 1,611 m`; kraj z velikimi črkami, **44 px**, višina 22 px; država je na tabli za avtom; višina je najvišja točka proge iz podatkov igre (`js/menu-data.js` `alt[1]`, Vršič 1.611 m; uporabnik je potrdil)), desno **globus** (država obarvana). Glava **leži na sliki**: slika sega do vrha zaslona, glava nima svoje podlage, le temen preliv od vrha navzdol (96 px, `rgba(8,13,24,.92)` → prosojno). **Digitalni trak** čisto na vrhu, ob zgornjem robu nad napisom: 34 svetlečih segmentov čez vso širino, visok 6 px; prižganih je toliko, kolikor je višinska razlika proge glede na 1.500 m (največja med progami: Pikes Peak 1.490 m), barve po traku od zelene prek rumene in oranžne do rdeče, ugasnjeni so sivi (12 %); bolj kot se proga vzpne, bolj je trak rdeč (Vršič 811 m: do oranžne; ravno dirkališče skoraj ugasnjen). Napisa *Single race* in zavihkov skupin (*Circuits*, *Open roads*, *Rally*, *Test*) ni več.
2. **Slika** (oder) čez celo širino, od vrha zaslona do vrstice s podatki (504 px pri 892; slika pokrije oder, `object-fit: cover`); gumbi za kamero in vreme so 88 px od vrha, pod glavo:
   - **Gumbi za kamero zgoraj levo**, sedanje velikosti, z ikonami: 1 **zemljevid** od zgoraj (okvir s cesto), 2 **prelet**: ikona **letalo nad gorami** (viewBox 24: gore `M2 21l7-6.5 3 3 4-4.5 6 8`, črta 1,8, manjša gora levo; letalo zgoraj levo, polno, leti desno proti goram `M2 3.5l9 3.8-9 3.8 2-3.8z`), 3 **kamera na zavoju** (videokamera). Izbrani je zlat. Ozadje gumbov je **enako kot okvir grafa** (`rgba(10,14,20,.45)`, kot mapa v igri `#h-map`), **brez črtkanega zlatega roba**. Okvir gumbov ima **enake vogale kot graf** (zaobljen 8 px), graf je v svojem okvirju 4 px pod njim. Izbrana kamera ima namesto kroga **zlat pravokotnik** (40 × 30 px, zaobljen 6 px, ikona temna; ostali gumbi 30 × 30 px).
   - **Vreme zgoraj desno**, navpično, odprto navzdol: 4 ikone *Dry*, *Rain*, *Changing*, *Storm* (`dry`, `rain`, `change`, `storm`). Slog je še odprt (spodaj); privzeto različica 1: izbrana ikona večja, v barvi (sonce zlato in oranžno), z napisom; ostale manjše, sive, brez napisa. Ikone so **večje** kot v prvi maketi: izbrana 54 px, ostale 32 px, napis 14 px, razmik 12 px.
   - **Kamera 1 – zemljevid:** kot zdaj (`topView`), proga brez zemljevida pokaže maketo (`assets/tracks/<id>.webp`).
   - **Kamera 2 – prelet** (`fly-<id>.webm`): označena sta **samo start in cilj** (brez `.fl-q` krajev in brez okvirčka s krajem `.hud`). **Graf višine** (v **vseh treh kamerah** enak) v okvirju **pod gumbi za kamero**: širok kot gumbi, nizek (višina = 0,6 × širina), oblikovan kot mapa med vožnjo (`#h-map`: `rgba(10,14,20,.45)`, zaobljen 8 px). Prevoženi del (do svetleče pike) je obarvan po strmini od zelene do rdeče (barve kot sled v preletu, tabela `GR`: 1 % zelena … 12 % temno rdeča), pot naprej je tanka bela črta; desno zgoraj zgornja višina (1,611 m), levo **nad začetkom črte** spodnja (810 m, 12 px nad spodnjim robom), napisi 10 px; graf sega **do desnega roba** okvirja, najnižja točka (0 m višinske razlike, 810 m) leži **na spodnjem robu okvirja** (rob je ničla, pod njo ni ničesar); **brez** bele osnovne črte, km in črtkanih črt. Spodaj čez celo širino slike grafa ni.
   - **Kamera 3 – kamera na zavoju:** mirujoča kamera na najzanimivejšem zavoju proge, mimo neprestano vozijo tekmeci. Vršič: 8. serpentina pri Ruski kapelici (`s` ≈ 7128 m, indeks točke 3564; tri serpentine zaporedoma, v kadru dve ravni ceste). Za vsako progo zavoj izbere seja in ga v sliki predlaga uporabniku.
3. **Vrstica podatkov**, po vrsti: **število nasprotnikov** (številka bela, brez okvirja, **42 px**, odebeljena; napisa *Opponents* ni, desno ob številki je majhna siva ikona **štartne mreže**: 2 stolpca po 3 zaobljene pravokotnike 7 × 4, desni stolpec zamaknjen navzdol, zadnje vrste bolj prosojne, 17 × 16 px; brez besede, da je ni treba prevajati), **Best race** (zlato; na krožni progi *Best lap*), **Length**, **Climb** (odprta cesta) oz. **Corners** (krožna proga), **zastava** države (globus je v glavi). Dotik številke odpre izbiro **0–100** (spodnji list: velika številka, hitre izbire 0 *Trial* / 1 / 5 / 12 / 25 / 50 / 100, drsnik, *Done*).
4. **Prostor z avtom:** stena in tla (rahlo obzorje v višini avta). Za avtom **modra cestna tabla** z imenom **države** (`SLOVENIA`), velike črke na sredini, bel rob, na dveh kovinskih stebrih, sega do desnega roba, levi del je za avtom (tabla je malo temnejša, kot v ozadju). Na tabli je **mehka, daljša senca avta** (obris avta, zamaknjen 38 px desno in 28 px gor, zamegljen 9 px, prosojnost 0,36, obrezan na tablo). **Brez** nadmorske višine na tabli, brez zelenih tablic, brez zastave na drogu.
   - **Avto:** 3D model igralčevega avta v njegovi barvi, levo, spredaj, s **črtami vetra v 3D** (tok okoli karoserije, od roba do roba, animacija *valovi*, mehke barve). Dotik avta odpre **garažo** (`garaza.html?car=<id>&color=<rrggbb>`). Napisa *YOUR CAR / BURJA R7* ni.
5. **Gumba s sosednjima progama:** levo prejšnja, desno naslednja proga, v gumbu **cela zastava** njene države (ob drogu levo, v svojem razmerju; zadnji stolpec zastave se raztegne do desnega roba, zato ima vsak pas pravi delež) in bela dvojna puščica. Akcija ostane `data-act="track:-1"` / `track:1` (plošček LB/RB, tipke, poteg).
6. **Spodaj:** gumb nazaj in dolg rdeč **Race!**.

**Seznam prog:** brez skupin, vse proge v enem seznamu: **prave proge od najkrajše do najdaljše**, nato **testne** (`test: true`) od najkrajše do najdaljše; seznam se **vrti v krog** (za zadnjo spet prva). Enake dolžine po `id`. Pri Vršiču sta soseda Los Caracoles (Čile) in Nürburg (Nemčija).

**Ležeče** (od 640 × 360): oder levo (pol širine, vsa višina, z vremenom, kamero in grafom), desno glava, vrstica, avto s tablo, soseda, nazaj in Race!.

**Zastave:** `assets/flags/<država>.svg` (20 držav: slovenia, austria, germany, belgium, finland, england, france, italy, monaco, usa, canada, brazil, chile, australia, south-africa, morocco, japan, china, thailand, russia). Narisane po uradnih predpisih (razmerje = `viewBox`, uradne barve, znaki), vsako je preveril drug agent (popravljena Brazilija in Maroko). Anglija ima križ sv. Jurija, ne britanske zastave.

## Zadnje odločitve (veljajo pred zgornjimi, kjer se razlikujejo)

Makete: `VRŠIČ` v vseh vremenih in 6 prog s 6 avti (seja 30. 10. 2026).

- **Glava:** levo **puščica nazaj** (ne hiška), široka 78 px (kot prejšnji spodnji gumb nazaj), visoka 52 px; na sredini samo **kraj** (npr. `VRŠIČ`, 44 px; daljše ime se zmanjša, da ne seže v globus); desno globus. Brez višine in brez digitalnega traku.
- **Slika** sega od vrha zaslona do vrstice (glava leži na njej s temnim prelivom). Temni del menija pod sliko ima **zgoraj zaobljena vogala** z enakim polmerom kot okvir vrstice (13 px), slika se vidi v vogalih.
- **Vreme levo** pod puščico (na sredini pod njo), v prejšnji obliki: izbrana ikona 52 px v barvi z napisom, ostale 40 px sive, brez okvirjev. Pet možnosti: *Dry*, *Rain*, *Changing*, *Storm*, *Snow* (Snow = letni čas zima in sneženje; odprto vprašanje 1).
- **Gumbi kamer desno zgoraj** (88 px od vrha, 10 px od roba), pod njimi **graf** (6 px niže, enako širok). Graf v **vseh treh kamerah**: pika pri vrhu (prevoženi del), črta prevoženega dela obarvana po strmini, polnilo pod prevoženim delom **močno rumeno** (manj prosojno, da se vidi višina), naprej svetlo rumeno; najnižja točka na spodnjem robu okvirja. Proge brez `alt` v `menu-data.js` (krožne): višine = začetna višina iz `geo.js` + profil.
- **Vrstica:** zastava levo, Best race, Length, Climb, desno **12** z ikono štartne mreže.
- **Spodaj** samo **Race!** čez vso širino (gumba nazaj ni več, ker je puščica zgoraj).
- **Senca avta na tleh:** široka mehka senca okoli avta (v soncu malo v levo), temnejša pod karoserijo med kolesi, temna in ozka pod vsakim kolesom (kolesa se poiščejo v sliki avta: najnižji neprosojni stolpci). V snegu modrikasta.
- **Tabla po državi** (odprto vprašanje 8, privzeto da): vsaka država svoj slog in malo obrabe: Nemčija rumena s črnim robom, Finska modra (zbledela, praske), ZDA zelena z belim robom (odsevni delci, rja pod vijaki), Avstrija bela kovinska z rdečim robom, Belgija bela s črnim robom (mah, okrušeni robovi), Japonska zelena s kovinskim okvirjem; vijaki, odsev, zrno folije. Ime države stoji v delu table, ki ga avto ne zakrije (visok avto, npr. tovornjak, jo zakrije levo), in se po potrebi zmanjša.
- **Vreme spremeni cel meni** (odprto vprašanje 2: kdaj; predlog nov sklop 7, ≈ 5–6 h):
  - *Dry:* toplo sonce, žarki in odsev iz sonca.
  - *Rain:* temnejša slika in oblaki, poševen dež čez cel zaslon, kaplje na leči, kapljice in pljuski na gumbih in vrstici, moker sijoč pod z odsevom avta in krogi v lužah, kaplje in curki na tabli.
  - *Changing:* deloma sonce, rahel dež, mavrica.
  - *Storm:* zelo temno, močan poševen dež, strela z bliskom.
  - *Snow* (izbran slog **snežni metež**): zasnežena slika (travniki beli, drevesa s snegom na osvetljenih ploskvah, cesta steptan sneg, megla), veter in poševno sneženje, sneg na vrhu vseh gumbov, vrstice, table in avta (nametan na zavetrno stran), zaledenela stekla in sneg na spodnjem delu avta, avto stoji v snegu, sneg na tabli, ledeni kristali v kotih.
  - Prehod ob dotiku ikone: krog na ikoni, nato se vreme v ≈ 1 s pretopi, voda in sneg se nabirata ≈ 2,5 s. Smer vetra: dež in sneg gresta z desne proti levi (uporabnik je smer prezrcalil).

- **Tabla vsake države v njenem slogu** (uporabnik, 30. 10. 2026: »najdi točno take table kot so v tej državi«). Raziskava 20 držav iz pravilnikov in Wikipedije (vrsta table, barve, okvir, pisava, obraba, viri) je v `maketa-menija/izbira-proge/table-drzav.json`, slogi v `wxfx.js` (`SIGNS`). Ime države je **vedno na sredini table**, tudi če ga avto delno prekrije. Slovenija ima rumeno tablo naselja (črn okvir), ne modre. Zastava na tabli: 6 predlogov (na koncu, na obeh koncih, trak v barvah zastave, ploščica nad tablo, mejna tabla EU oz. zastava v krogu, cela tabla v barvah zastave); izbira je odprta, privzeto **brez zastave** (zastava je v vrstici).

| Država | Tabla | Ozadje / napis | Zanesljivost |
|---|---|---|---|
| Slovenija | Settlement sign III-14 'Naselje' | `#F0CA00` / `#1E1E1E` | high |
| Avstrija | Town-entry sign 'Ortstafel' | `#F6F6F6` / `#1E1E1E` | medium |
| Nemčija | Town-entry sign 'Ortstafel', Zeichen 310 | `#F0CA00` / `#1E1E1E` | high |
| Belgija | Direction sign F29 | `#0E518D` / `#F6F6F6` | medium |
| Finska | Place-name sign F27.1 'Paikannimi' | `#0A5CA8` / `#FFFFFF` | medium |
| Anglija | Green primary-route direction sign used on main A-roads | `#33533B` / `#FFFFFF` | high |
| Francija | Town-entry sign EB10 | `#F6F6F6` / `#1E1E1E` | high |
| Italija | Blue arrow-pointed direction sign for extra-urban roads. Blue for extr | `#0E518D` / `#FFFFFF` | medium |
| Monako | French EB10-style place sign | `#F6F6F6` / `#1E1E1E` | low |
| Rusija | Blue advance direction sign 6.9.1 / 6.10.1 outside built-up areas | `#1C5AA6` / `#FFFFFF` | medium |
| ZDA | Green guide | `#006747` / `#FFFFFF` | high |
| Kanada | Green destination | `#006747` / `#FFFFFF` | medium |
| Brazilija | Placa de identificacao de municipio | `#003166` / `#FFFFFF` | medium |
| Čile | Green informative destination sign on conventional | `#006747` / `#FFFFFF` | medium |
| Avstralija | Green direction | `#005A3C` / `#FFFFFF` | medium |
| Južna Afrika | Direction | `#00683F` / `#FFFFFF` | medium |
| Maroko | Town-entry | `#FFFFFF` / `#000000` | low |
| Japonska | Guide sign on general and national roads | `#005898` / `#FFFFFF` | medium |
| Kitajska | Guide | `#1450A0` / `#FFFFFF` | medium |
| Tajska | Guide | `#006A3A` / `#FFFFFF` | low |

**Pravna opomba:** posnetek preleta `assets/maps/fly-rbring.webm` in `.webp` (5. 10. 2026) na stavbi ob progi kaže napis z imenom znamke (starejša različica sveta; zdajšnji transparenti v `js/world-rbring.js` so zemljepisni: MURTAL, SPIELBERG, STEIERMARK). Pred objavo ga posnemi znova (sklop 4, kamere).

## Sklopi

| Sklop | Vsebina | Čas |
|---|---|---|
| 1 | Postavitev zaslona (glava s hiško, državo in zastavo; oder; vrstica; prostor s tablo in sliko avta; soseda; nazaj + Race!), seznam vseh prog po dolžini v krog, ležeče, testi | 6–7 h |
| 2 | Zastave v igri (iz `assets/flags`), globus z obrisi držav, graf višine za vse proge | 5–6 h |
| 3 | 3D avto z vetrom (valovi), dotik → garaža | 4–5 h |
| 4 | Tri kamere: zemljevid, prelet (samo start in cilj, graf), kamera na zavoju | 5–6 h |
| 5 | Tekmeci 0–100 (nova nastavitev, meritev telefona) | 3–4 h |
| 6 | Uporabnikovi popravki, dokumentacija, celotni testi | 2–3 h |

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
| 1 | Pull request za vsak sklop? | vprašaj pred odprtjem |
| 2 | Kamera 3 v živo ali posnet video? | posnet video |
| 3 | Katera kamera ob odprtju? | 1 zemljevid |
| 4 | Ime avta? | samo v garaži |
| 5 | Proga brez preleta ali videa zavoja | maketa proge |
| 6 | Testne proge: oznaka TEST na tabli? | da |
| 7 | Kam gredo dodatne možnosti (letni čas, čas dneva, dolžina) iz sedanjega lista vremena in *Gold time* kronometra? | vprašaj v sliki |
