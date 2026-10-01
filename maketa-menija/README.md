# Maketa menija (angleško)

Samostojna, klikljiva maketa menija igre v angleščini. **Ni povezana z igro**: igra je ne naloži, nič v igri ne spremeni in ni del `main`. Avti, makete prog in posnetki ozadja so zajeti iz prave igre.

Objavljena je kot zasebna stran: <https://claude.ai/artifact/LGhsPikqgs4To6phR2LB5V>

## Glavni meni

- Gumbi so v temnem okvirju z rdeče-belim robnikom na levi, kot v prvi različici menija.
- Trije veliki gumbi s sliko:
  - **Single race**: slika današnje proge.
  - **Multiplayer**: dva avta.
  - **Career**: pokal, odstotek kariere in vrstica napredka.
- Pod njimi sta manjša gumba **Settings** in **Leaderboard**.
- Čisto spodaj je gumb za nakup **Full Game · €3.99**. Po nakupu ga zamenja oznaka *Full game*.
- V ozadju se vrtijo trije kratki posnetki dirke (Jezero Ring, Ljubljana, gorski reli).
- **Single race** in **Career** se odpreta v istem okvirju, na istem mestu: v ozadju se še vedno vidi, kako avti dirkajo. Zgoraj v okvirju je gumb nazaj na glavni meni. Šele ko izbereš način dirke ali način kariere, se odpre zaslon čez cel ekran.

## Single race in današnja dirka

Single race ima dva koraka.

**1. korak: način dirke** (v okvirju glavnega menija). Tapneš enega od treh in odpre se izbira proge čez cel ekran (*Step 2 of 2*). Zadnji izbrani način ima kljukico:

- **Circuit race**: dirka v krogih proti 12 tekmecem.
- **Police chase**: policija ti je za petami, pobegniti ji moraš v 3 minutah.
- **Time trial**: sam proti uri in svojemu duhu (*ghost*), za zlati, srebrni ali bronasti čas.

**2. korak: proga.** Proge so razdeljene v tri skupine. Skupine so zavihki nad maketo, pri vsakem piše število prog:

- **Circuits** (privzeto): dirkališča (Jezero Ring, Riviera, Ljubljana, La Condamine, Styria, Mie, Ardennes, Eifel).
- **Open roads**: dirke po cestah skozi kraje: Vršič (od Kranjske Gore mimo Jasne do prelaza) in Colorado.
- **Rally**: reli etape: Mountain Rally in Ouninpohja.

Vse proge imajo zemljevid v dveh različicah (glej [Zemljevidi prog](#zemljevidi-prog)).

Pokažejo se proge izbranega načina:

- Pri Circuit race ni Colorada in Ouninpohje, ker sta samo za časovni preizkus.
- Zgoraj na maketi piše način dirke, podatki o progi pa so prilagojeni načinu:
  - pri Police chase: število policijskih avtov in čas za pobeg,
  - pri Time trial: zlati čas,
  - pri Circuit race na cesti: vzpon od starta do cilja namesto števila ovinkov (npr. *Climb +801 m*).
- Z gumbom nazaj se vrneš na izbiro načina v okvirju glavnega menija.

**Današnja dirka** (*Today's race*) je na prvem mestu v svoji skupini pri svojem načinu: pri Circuit race, ali pri Time trial, kadar je proga dneva gorska dirka ali reli etapa.

- Vsak dan je druga. Progo, avto in vreme izbere datum. Maketa proge pokaže vreme dneva.
  - Vsi vozijo isti avto.
- Pri današnji dirki piše:
  - najboljši čas dneva na svetu in kdo ga ima (*Best today*),
  - koliko igralcev jo je danes že odpeljalo (*Players*),
  - tvoje mesto (*Your place*).
- Brezplačni račun jo lahko odpelje enkrat na dan. Potem je namesto *Race!* gumb *Unlimited · €3.99*. S polno igro jo lahko ponavljaš.
- Po dirki rezultat pokaže mesto v dirki in mesto na današnji svetovni lestvici, npr. *450th of 8,995 · top 5 %*. Isto mesto piše tudi:
  - pri progi,
  - na glavnem meniju,
  - v *Leaderboard → Today*.
- Druge proge: spodaj sta, kot pri današnji dirki, okvirčka s sliko za **avto** in **vreme**, le da ju tu lahko klikneš.
  - Klik na avto odpre izbiro avta (3D). Z gumbom *Select* se vrneš k progi z izbranim avtom in barvo.
  - Klik na vreme odpre izbiro vremena (Dry, Rain, Random) in števila krogov.
  - Izbrano vreme se takoj vidi na zemljevidu proge (v obeh različicah):
    - *Rain*: pada dež, pokrajina je bolj siva in mokra (na zemljevidu od zgoraj mokra slika, na preletu temnejši posnetek),
    - *Dry*: suho, brez dežja,
    - *Random*: suho in mokro se izmenjujeta; ob začetku dirke se naključno izbere eno od obeh.
  - Gumb spodaj je *Race!* (na zaklenjenih progah v brezplačni različici *Unlock · €3.99*).

## Zemljevidi prog

Vse proge (dirkališča, ceste in reli etape) imajo dve različici zemljevida. Preklopiš ju s stikalom **MAP 1 2** na vrhu zemljevida. Izbrana različica ostane izbrana tudi pri drugih progah in ob naslednjem obisku (shrani se v brskalnik).

1. **Flyover**: posnetek preleta proge, kot v posnetku etape kolesarske dirke.
   - Kamera mirno leti za svetlečo piko, ki gre z enakomerno hitrostjo od starta do cilja. Pika je vedno na sredini slike, za njo se riše pot.
   - Barva poti pove strmino: zelena na ravnem (in navzdol), nato rumena, oranžna in rdeča, bolj ko cesta gre navzgor (temno rdeča od 12 %). Na cestah z znano višino starta in cilja je strmina taka kot na pravi cesti.
   - Spodaj desno piše kraj, v katerem je pika, in njegova nadmorska višina. Ko pika pride v nov kraj, se ime zamenja (na Vršiču: Kranjska Gora, Jasna, Eriški most, Mihov dom, Ruska kapelica, Koča na Gozdu, Erjavčeva koča, Vršič; na dirkališčih imena ovinkov).
   - Ob poti se pokažejo tudi imena krajev, start in cilj.
   - Posnetek ima 30 sličic na sekundo. Na koncu se kamera dvigne nad cilj, nato se posnetek s kratkim prehodom začne znova.
2. **Map**: zemljevid od zgoraj čez ves okvir, do robov.
   - Pot se nariše od starta do cilja, start in cilj imata zastavici (na reli etapah in dirkališčih še oznaki vmesnih časov S1 in S2).
   - Čez progo ni nobenega pasu, da se pot vidi v celoti.

Zemljevidi in posnetki so zajeti iz sveta igre. Igra ima pokrajino samo ob progi, zato je pokrajina dlje od proge na zemljevidih dodana (hribi in gore iz višin ob progi). Vršič je vzet iz veje `ccr-461bd7ea-r4na44`, kjer se ta cesta gradi. Višine so na cestah prave (start in cilj), na reli etapah in dirkališčih približne (višina starta v `data.js`, ostalo iz sveta igre).

## Pred dirko: pot po Zemlji, posnetki iz drona in komentator

Ko klikneš *Race!* (ali *Start mission*, *Run …* v karieri), se pred dirko predvaja uvod, kot pri televizijskem prenosu: najprej **pot po Zemlji** (3D globus), nato brez reza **posnetki iz drona**.

### Pot po Zemlji (3D globus)

Pokaže, kje je bila prejšnja dirka in kje je ta, da si lažje predstavljaš, kje se vse dogaja (npr. prejšnja dirka Colorado, zdaj Vršič):

1. Kamera se približa kraju, kjer se je prejšnja dirka končala (pri Coloradu vrh Pikes Peaka). Tam je oznaka **LAST RACE** z imenom dirke, spodaj desno kraj in višina (*Summit · 4,302 m*). Pri pravih progah je prejšnja proga narisana z belo črto.
2. Kamera se dvigne, dokler se ne vidi cela Zemlja (sever je zgoraj, kot na zemljevidu). Zlati lok riše pot do nove proge, spodaj desno piše *To Julian Alps* in koliko kilometrov je še.
3. Kamera se spusti k novi progi:
   - obris države (pri Coloradu zvezne države) je obrobljen z zlato,
   - oznaka **TODAY** z imenom dirke,
   - nato prava pokrajina v 3D: hribi, gozdovi, travniki, jezera, kraji. Na Vršiču je jesen (rumeni macesni in bukve) in prvi sneg na vrhovih, kot v igri,
   - pri pravih progah je proga narisana z zlato črto.
4. Zadnja slika globusa je natanko prva slika posnetka iz drona. Video prevzame skozi tanek oblak, brez reza, kamera pa se spušča naprej do prvega kadra.

Med potjo so na Zemlji imena držav, glavnih mest in drugih krajev, morij in gorovij. Komentator pove, od kod in kam, npr. *From Colorado to the Julian Alps, Slovenia: 8,750 kilometres.* Zgoraj levo so drobno navedeni viri podatkov.

- Prva dirka (prejšnje še ni): pot se začne v vesolju (*Today we race in …*).
- Ista proga kot prejšnjič: globusa ni, takoj so posnetki iz drona.
- Stanje *Veteran* ima za prejšnjo dirko Colorado, da se vidi pot Colorado → Vršič. V stanjih *Free* in *Full game* je prva dirka iz vesolja, vsaka naslednja pa se začne tam, kjer si nazadnje dirkal.
- *Skip intro* preskoči vse (globus in posnetke).
- Brez WebGL ali z nastavitvijo telefona za manj gibanja (*reduce motion*) globusa ni.
- Pot traja 6–10 sekund, dlje, ko je pot daljša.

Kje so proge na Zemlji:

- Prave proge so postavljene na pravo mesto tako, da se višine ceste v igri ujemajo s pravimi višinami: Vršič, Ljubljana, Styria, Mie, Ardennes, Eifel. La Condamine je postavljena po pristanišču in znanih točkah, ker so v mestu višine stavb.
- Colorado in Ouninpohja sta v igri krajša od prave ceste. Start je na pravem startu, cesta je obrnjena proti pravemu cilju.
- Jezero Ring, Riviera in Mountain Rally so izmišljene. Postavil sem jih na Bled, v Portorož in na Pokljuko (spremeniš jih v `orodja/geo_places.py`).

### Posnetki iz drona

- Začnejo se s **priletom**: kamera se od 2,8 km visoko spusti do prvega kadra (tu se nadaljuje pot z globusa).
- Igra ima pokrajino samo ob progi, zato je okoli nje dodana prava pokrajina z istimi barvami kot na globusu:
  - pri pravih progah prave višine in pokrovnost tal, zato se iz zraka vidijo prave gore okoli proge,
  - pri izmišljenih in skrajšanih progah dorisani hribi s pokrovnostjo tal kraja, ki ga predstavljajo.
- Sledijo 3–5 kadrov (vožnja nad cesto, kroženje okoli kraja, pogled naravnost navzdol, dvig), ki se prelivajo drug v drugega:
  - kadre nariše igra sama, zato se v njih premika vse, kar igra pokaže: na Vršiču promet (avtomobili, kombiji, avtobusi, motoristi, kolesarji) in pešci, drugod igrini dirkači, pa tudi ptice, helikopterji, gledalci in čolni,
  - kamera leti gladko (brez sunkov), 30 sličic na sekundo.
- Spodaj desno v posnetku piše kraj kadra in njegova višina.
- **Komentator** pri vsakem kadru pove nekaj zanimivega o kraju (npr. na Vršiču: ruski ujetniki so cesto zgradili leta 1915; Vršič je najvišji cestni prelaz v Sloveniji). Besedilo je napisano pod posnetkom. Glas je telefonov angleški glas (izklopi ga *Settings → Sound* ali *Commentary*, napis ostane).
- V dežju pada dež tudi čez posnetke (na globusu ne).
- Zgoraj je gumb *Skip intro*, spodaj vrstica, koliko uvoda je še (globus in posnetki skupaj).

Po uvodu se prižge pet rdečih luči, ugasnejo in *GO!* – dirka se začne.

## Namesto dirke: izbira mesta

Dirka se v maketi ne vozi. Po startnih lučeh se odpre *Where did you finish?*. Tam izbereš rezultat:

- 1.–13. mesto (pri reliju v karieri 1.–6. na etapi),
- pri časovnih preizkusih zlati, srebrni ali bronasti čas oziroma brez medalje,
- pri Police chase: *Escaped* s tremi, dvema ali eno zvezdico (hitreje ko pobegneš, več zvezdic) ali *Busted* (policija te je ujela); pri misijah, kjer loviš ti: *Caught* ali *Got away*,
- v Multiplayerju 1. ali 2. mesto.

Nato se odpre zaslon z rezultatom (nagrada v CR, točke in mesto v World Cupu, čas etape in skupni vrstni red relija, naslednja misija ali odprta proga, odstotek kariere prej → potem). *Continue* gre nazaj tja, od koder si dirko začel, *Race again* / *Try again* jo ponovi. Tako preizkusiš, kako se meni nadaljuje po zmagi ali po slabši uvrstitvi.

## Kariera: štirje načini

*Career* v glavnem meniju pokaže štiri načine (v okvirju glavnega menija, z odstotkom celotne kariere). Vsak ima svoj zaslon in svoj napredek:

1. **World Cup**: krogi dirkališč, točke se seštevajo (25, 18, 15, 12, 10, 8, 6, 4, 2, 1).
   - *Round 1*: 4 dirkališča, *Round 2*: 6 dirkališč, *Final*: vseh 8 (finale je moj predlog).
   - Prvi trije v seštevku kroga gredo v naslednji krog (in dobijo nagrado kroga), sicer se krog začne znova.
   - Zaslon pokaže kroge, dirke tega kroga z dobljenimi točkami in vrstni red.
2. **Police chase**: 8 misij po vrsti; opravljena misija odpre naslednjo. Pobegni policiji, mafiji, vojski, na koncu vsem hkrati, ali pa v policijskem avtu ujemi roparja, tihotapce in tatu avtomobila. Vsaka misija ima kratko zgodbo; zvezdice za hitrost.
3. **Time trial**: vzemi si čas – na vsaki progi zlati, srebrni ali bronasti čas; bron odpre naslednjo progo.
4. **Rally & hill climb** (moj predlog za četrti način, sporočilo se je prekinilo): štiri etape po vrsti (Mountain Rally, Ouninpohja, Colorado, Vršič), časi etap se seštevajo proti petim drugim posadkam.

Brezplačna različica odpre začetek vsakega načina na brezplačnih progah (prve tri misije, prve tri proge časovnega preizkusa, prvi dve dirki World Cupa, prva etapa relija); naprej je gumb *Unlock · €3.99*.

## Drugi zasloni

- **Choose car** (odpre se s klikom na avto pri progi):
  - avto v pravem 3D (three.js r128, ista različica kot v igri),
  - obrneš ga s prstom,
  - zavihki Stats / Upgrades / Paint, vseh 8 barv igre,
  - *Select* izbere avto in barvo za dirko.
- **Multiplayer**:
  - ustvari sobo in pošlji kodo prijatelju,
  - vstopi s kodo,
  - hitra dirka z nekom, ki ravno čaka.
- **Leaderboard**: današnja svetovna lestvica in rekordi vsake proge.
- **Settings**

## Stanja za preizkus

Zgoraj je vrstica **MOCKUP** s tremi stanji:

- *Free*: brezplačna različica,
- *Full game*: kupljena igra,
- *Veteran*: igralec po nekaj tednih.

Kako deluje:

- *Free* in *Full game* začneta pri 0 %.
- Napredek (denar, kariera, rekordi, izbrani avto, današnja dirka) se shrani v brskalnik, za vsako stanje posebej.
- Gumb ↻ v vrstici ali *Settings → Reset progress* postavi trenutno stanje nazaj na začetek.
- Nakup v stanju *Free* (*Full Game* → *Buy*) preklopi na polno igro in obdrži napredek.
- Z × skriješ vrstico, z gumbom M jo prikažeš nazaj.

## Kaj urejati

| Datoteka | Kaj je v njej |
|---|---|
| `data.js` | **vsa besedila, cene, avti, proge, skupine prog (`groups` in pri vsaki progi `group`), imena na zemljevidih prog, kraji ob poti in višine (`routeMaps`), imena dveh različic zemljevida (`mapVersions`), komentatorjeve vrstice za uvod pred dirko (`intro`: ena na kader, lahko tudi zapisano tako, kot naj jo glas izgovori), načini dirke (`modes`, `chase`), kariera (`career`: krogi World Cupa in točke, misije pregonov, proge časovnega preizkusa, etape relija), nagrade po mestih, današnja dirka (proge, avti, vreme, število brezplačnih voženj) in začetna stanja (`states`, pri vsakem tudi `lastTrack`: prejšnja dirka, od koder se začne pot po Zemlji)** – tu spreminjaš vsebino |
| `style.css` | videz (barve so na vrhu kot spremenljivke `--…`) |
| `app.js` | zasloni, premikanje med njimi, uvod pred dirko, izbira mesta in izračun rezultata |
| `journey.js` | pot po Zemlji pred dirko (3D globus, three.js): pot kamere, oznake, lok, predaja posnetku iz drona |
| `geo.js` | kje so proge na Zemlji, njihova imena krajev, okolica prog, meje, obrisi držav, imena držav, krajev, morij in gorovij (ustvarjeno z `orodja/geo_build.py`, ne urejaj ročno) |
| `car3d.js` | 3D prikaz avta |
| `assets/` | 3D modeli avtov (`cars/*.json`), slike vsakega avta v vseh 8 barvah (`cars/img/<avto>-<barva>.webp`), slike gumbov glavnega menija in načinov dirke (`menu/`), makete prog, suhe in mokre (`tracks/<proga>.webp`, `tracks/<proga>-rain.webp`), posnetki ozadja (`video/`), zemljevidi prog (`maps/`: `top-<proga>` od zgoraj, suh in moker `-rain`, `fly-<proga>.webm` posnetek preleta, `drone-<proga>.webm` posnetki iz drona za uvod pred dirko in `.webp` njuni prvi sliki), slike za globus (`geo/`: Zemlja `earth.webp`, regije `l1-<regija>`, okolica prog 80 km `l2-<proga>` in 14 km `l3-<proga>`, vsaka z višinami `-h.png`) |
| `outlines.js` | obrisi prog za majhne zemljevide (ustvarjeno, ne urejaj ročno) |
| `routes.js` | poti prog na zemljevidih, višine, kraji, kje so start, cilj in kraji v vsaki sliki preleta in kdaj se začne kateri kader drona, kamera priletа v vsaki sliki (za predajo z globusa) (ustvarjeno z `orodja/routes.py`, ne urejaj ročno) |

Vsi časi, imena na lestvicah, število igralcev, denar (CR) in odstotki so primeri.

## Ogled na računalniku

Stran bere datoteke z `fetch`, zato jo odpri prek lokalnega strežnika (ne z dvoklikom):

```
cd maketa-menija
python3 -m http.server 8000
```

in odpri <http://localhost:8000>. Potrebuje internet za three.js in pisavo Roboto.

Za ponovno objavo kot Artifact:

- objavi vsebino `index.html` brez vrstic `<!doctype>`, `<html>`, `<head>` in `<body>` (te doda objava sama),
- ostale datoteke objavi kot dodatne datoteke z enakimi potmi.

## Orodja za ponovni zajem (`orodja/`)

Skripte, s katerimi so bili zajeti avti, proge in posnetki. Potrebujejo kopijo igre v `maketa-menija/game_main/`:

```
mkdir -p maketa-menija/game_main
git archive origin/main | tar -x -C maketa-menija/game_main
cd maketa-menija/orodja
node cars3d.mjs                                  # avti -> ../assets/cars/*.json
node carimgs.mjs && python3 menuimg.py           # avti v vseh barvah, slike gumbov in načinov (policijski avto: policebar.js) -> ../assets/cars/img/, ../assets/menu/
node bgvideo.mjs '[["jezero",7],["ljubljana",7],["gora",7]]' 1.25 14   # posnetki -> ../assets/video/
node dio2.mjs proge.json                         # makete prog, suhe in v dežju -> raw/tracks/w_*.png (proge.json: [[id, ime, nastavitve], …])
python3 mkwebp.py                                # raw/tracks -> ../assets/tracks/<proga>.webp in <proga>-rain.webp
node gen_tracks2.js raw/tracks.js                # obrisi prog (nato v outlines.js)
node check.mjs                                   # vsi zasloni v vseh stanjih -> shots/
node flow.mjs                                    # odigra današnjo dirko, vse tri načine, izbiro avta in vremena, uvod pred dirko, vse štiri načine kariere in multiplayer -> shots/
```

Zemljevidi prog potrebujejo igro z Vršičem v `maketa-menija/game_vrsic/` in ffmpeg z VP9 (paket `imageio-ffmpeg`):

```
mkdir -p maketa-menija/game_vrsic
git archive origin/ccr-461bd7ea-r4na44 | tar -x -C maketa-menija/game_vrsic
pip install imageio-ffmpeg
cd maketa-menija/orodja
node routemap.mjs maps.json                      # zemljevidi od zgoraj, suhi in v dežju -> raw/maps/ (maps.json: [[proga, "top", ime, nastavitve], …])
node flyover.mjs flyovers.json                   # posnetki preleta -> raw/maps/fly-<proga>.webm (samo nekatere: node flyover.mjs flyovers.json vrsic,gora)
                                                 # sličice riše več brskalnikov hkrati (PARALLEL=4), ustavljen zagon nadaljuje; kakovost CRF=44
PREVIEW=1 node drone.mjs drones.json vrsic       # hiter pregled kadrov drona (začetek, sredina in konec vsakega) -> raw/drone/<proga>/p*.jpg
node drone.mjs drones.json                       # posnetki iz drona za uvod (nariše jih igra sama, drone_page.js) -> raw/maps/drone-<proga>.webm
                                                 # en kader znova: izbriši raw/drone/<proga>/s<N>_*.jpg in poženi node drone.mjs drones.json <proga>
python3 routes.py                                # raw/maps -> ../assets/maps/ in ../routes.js
```

V `flyovers.json` so za vsako progo hitrost pike (`speed`, m/s), kamera (`back`, `up`, `ahead`), megla, prava višina starta in cilja (`alt`, za strmino poti), največja velikost posnetka (`kbps`) in kraji ob poti (ime in metri od starta).

Pot po Zemlji (globus) in prava pokrajina okoli prog v posnetkih iz drona potrebujeta Python s paketi za zemljevide:

```
pip install numpy scipy pillow rasterio shapely pyshp
cd maketa-menija/orodja
python3 geo_data.py                              # odprti podatki: Natural Earth in NASA Blue Marble -> raw/geo/
node geo_tracks.mjs                              # sredinske črte prog iz igre -> raw/geo/<proga>-track.json
python3 geo_match.py                             # kje je vsaka prava proga: ujemanje višin ceste s pravimi -> raw/geo/match.json
python3 geo_monaco.py                            # La Condamine (Monako): po pristanišču in znanih točkah
python3 geo_places.py                            # vse proge na Zemlji (prave, skrajšane, izmišljene) -> raw/geo/places.json
python3 geo_build.py ..                          # Zemlja, regije, okolica prog, meje in imena -> ../assets/geo/ in ../geo.js
python3 geo_far.py                               # pokrajina okoli sveta igre za posnetke iz drona -> raw/geo/<proga>-far.json in .webp
node jtest.mjs pikes vrsic all                   # pot po Zemlji v brskalniku, slika na pol sekunde -> shots_j/ (brez prve proge: - vrsic)
node check_j.mjs veteran,vrsic,trial             # uvod pred dirko v meniju, v pravem času -> shots_jm/
node jrec.mjs veteran,vrsic,trial 17             # video posnetek zaslona uvoda (globus in posnetki iz drona), sličica za sličico -> rec/vrsic.mp4
```

Višine (AWS Terrain Tiles) in pokrovnost tal (ESA WorldCover) skripte berejo z interneta po potrebi in jih shranijo v `raw/geo/`. Barve pokrajine in letni čas (jesen in prvi sneg na Vršiču) so v `geo_paint.py`.

V `drones.json` so za vsako progo način (`traffic`: dirka v prometu na Vršiču, `demo`: igrini dirkači), dodatni promet (`extra`) in kadri: vrsta (`push` vožnja ob cesti, `orbit` kroženje, `top` pogled navzdol, `rise` dvig), kraj (metri od starta), višina, razdalja, trajanje, ime za napis in čakanje na dirkača (`wait`). Komentatorjeve vrstice za kadre so v `data.js` (`intro`), v istem vrstnem redu.

Vsak posnetek iz drona se začne s priletom (od 2,8 km visoko do prvega kadra, `arrive` v `drones.json` ga spremeni ali izklopi), okoli sveta igre pa je pokrajina iz `geo_far.py`. Ves posnetek znova: `REDO=1 node drone.mjs drones.json <proga>`.

Uporabljajo Playwright s Chromiumom (kot testi igre). Mape `game_main/`, `game_vrsic/` in `orodja/raw/` niso v repozitoriju.

## Viri podatkov za globus

- Zemlja: NASA Blue Marble (javna domena).
- Pokrovnost tal (gozd, travniki, polja, kraji, skale, voda): ESA WorldCover 10 m 2021, © ESA WorldCover project, vsebuje spremenjene podatke Copernicus Sentinel (2021), licenca CC BY 4.0.
- Višine: AWS Terrain Tiles (Mapzen; viri SRTM, EU-DEM, USGS 3DEP in drugi).
- Meje, obrisi in imena držav, krajev, morij in gorovij: Natural Earth (javna domena).
