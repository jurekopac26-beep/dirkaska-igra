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

## Single race in današnja dirka

Single race ima dva koraka (zgoraj piše *Step 1 of 2* in *Step 2 of 2*).

**1. korak: način dirke.** Tapneš enega od treh in takoj si pri izbiri proge (spodaj ni gumbov; nazaj greš z gumbom zgoraj). Zadnji izbrani način ima kljukico:

- **Circuit race**: dirka v krogih proti 12 tekmecem.
- **Police chase**: policija ti je za petami, pobegniti ji moraš v 3 minutah.
- **Time trial**: sam proti uri in svojemu duhu (*ghost*), za zlati, srebrni ali bronasti čas.

**2. korak: proga.** Proge so razdeljene v tri skupine. Skupine so zavihki nad maketo, pri vsakem piše število prog:

- **Circuits** (privzeto): dirkališča (Jezero Ring, Riviera, Ljubljana, La Condamine, Styria, Mie, Ardennes, Eifel).
- **Open roads**: dirke po cestah skozi kraje: Vršič (od Kranjske Gore mimo Jasne do prelaza) in Colorado.
- **Rally**: reli etape: Mountain Rally in Ouninpohja.

Vse proge imajo zemljevid v štirih različicah (glej [Zemljevidi prog](#zemljevidi-prog)).

Pokažejo se proge izbranega načina:

- Pri Circuit race ni Colorada in Ouninpohje, ker sta samo za časovni preizkus.
- Zgoraj na maketi piše način dirke, podatki o progi pa so prilagojeni načinu:
  - pri Police chase: število policijskih avtov in čas za pobeg,
  - pri Time trial: zlati čas,
  - pri Circuit race na cesti: vzpon od starta do cilja namesto števila ovinkov (npr. *Climb +801 m*).
- Z gumbom nazaj se vrneš na izbiro načina.

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
  - Izbrano vreme se takoj vidi na 3D maketi proge:
    - *Rain*: proga postane mokra (temnejša cesta, oblačna svetloba, kot v igri) in pada dež,
    - *Dry*: suha proga v soncu,
    - *Random*: suha in mokra proga se izmenjujeta; ob začetku dirke se naključno izbere eno od obeh.
  - Gumb spodaj je *Race!* (na zaklenjenih progah v brezplačni različici *Unlock · €3.99*).

## Zemljevidi prog

Vse proge (dirkališča, ceste in reli etape) imajo štiri različice zemljevida, da izbereš najboljšo. Preklopiš jih s stikalom **MAP 1 2 3 4** na vrhu zemljevida. Izbrana različica ostane izbrana tudi pri drugih progah in ob naslednjem obisku (shrani se v brskalnik).

1. **Flyover**: posnetek preleta proge, kot v posnetku etape kolesarske dirke.
   - Kamera mirno leti za svetlečo piko, ki gre z enakomerno hitrostjo od starta do cilja. Pika je vedno na sredini slike, za njo se riše pot.
   - Barva poti pove strmino: zelena na ravnem (in navzdol), nato rumena, oranžna in rdeča, bolj ko cesta gre navzgor (temno rdeča od 12 %). Na cestah z znano višino starta in cilja je strmina taka kot na pravi cesti.
   - Spodaj desno piše kraj, v katerem je pika, in njegova nadmorska višina. Ko pika pride v nov kraj, se ime zamenja (na Vršiču: Kranjska Gora, Jasna, Eriški most, Mihov dom, Ruska kapelica, Koča na Gozdu, Erjavčeva koča, Vršič; na dirkališčih imena ovinkov).
   - Ob poti se pokažejo tudi imena krajev, start in cilj.
   - Posnetek ima 30 sličic na sekundo. Na koncu se kamera dvigne nad cilj, nato se posnetek s kratkim prehodom začne znova.
2. **Map & profile**: zemljevid od zgoraj čez ves okvir, do robov (kot posnetki).
   - Pot se nariše od starta do cilja in stoji nad pasom na dnu. Start in cilj imata zastavici.
   - Pas na dnu: pri cestah višinski profil z vzponom in kraji; pri reliju in na dirkališčih vsi ovinki po vrsti (levi nad črto, desni pod njo; višji in bolj rdeč je ostrejši ovinek), vmesni časi oziroma sektorji ter dolžina.
3. **3D block**: pokrajina okoli proge kot 3D blok, ki lebdi, s potjo, startom in ciljem.
4. **Drone**: proga, kot bi jo posnel dron: 3–5 kadrov (vožnja nad cesto, kroženje okoli kraja, pogled naravnost navzdol, dvig), ki se prelivajo drug v drugega.
   - Kadre nariše igra sama, zato se v njih premika vse, kar igra pokaže: na Vršiču promet (avtomobili, kombiji, avtobusi, motoristi, kolesarji) in pešci, drugod igrini dirkači, pa tudi ptice, helikopterji, gledalci in čolni.
   - Spodaj desno piše kraj kadra in njegova višina.

Vse štiri različice pokažejo tudi vreme (*Rain*: mokra, bolj siva pokrajina in dež).

Zemljevidi in posnetki so zajeti iz sveta igre. Igra ima pokrajino samo ob progi, zato je pokrajina dlje od proge na zemljevidih dodana (hribi in gore iz višin ob progi). Vršič je vzet iz veje `ccr-461bd7ea-r4na44`, kjer se ta cesta gradi. Višine so na cestah prave (start in cilj), na reli etapah in dirkališčih približne (višina starta v `data.js`, ostalo iz sveta igre).

## Namesto dirke: izbira mesta

Dirka se v maketi ne vozi. Ko klikneš *Race* (Single race, današnja dirka, Career ali Multiplayer), se odpre *Where did you finish?*. Tam izbereš mesto:

- 1.–13. mesto,
- pri časovnih preizkusih zlati, srebrni ali bronasti čas oziroma brez medalje,
- pri Police chase: *Escaped* s tremi, dvema ali eno zvezdico (hitreje ko pobegneš, več zvezdic) ali *Busted* (policija te je ujela),
- v Multiplayerju 1. ali 2. mesto.

Nato se odpre zaslon z rezultatom:

- nagrada v CR,
- pokali,
- odstotek serije in kariere prej → potem,
- odklenjene serije.

*Continue* gre naprej po meniju, *Race again* ponovi dirko. Tako preizkusiš, kako se meni nadaljuje po zmagi ali po slabši uvrstitvi.

## Drugi zasloni

- **Choose car** (odpre se s klikom na avto pri progi):
  - avto v pravem 3D (three.js r128, ista različica kot v igri),
  - obrneš ga s prstom,
  - zavihki Stats / Upgrades / Paint, vseh 8 barv igre,
  - *Select* izbere avto in barvo za dirko.
- **Career**:
  - odstotek celotne kariere in vsake serije (kot v Real Racing 3),
  - pokali za vsako dirko: bron za top 5, srebro za stopničke, zlato za zmago,
  - naslednja dirka.
- **Serija**: seznam dirk z zemljevidom proge, pokali in nagrado.
  - Serija se odklene, ko je prejšnja na 50 %.
  - Brezplačni račun ima samo Rookie Cup, ostale serije so v polni igri.
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
- Napredek (denar, pokali, rekordi, izbrani avto, današnja dirka) se shrani v brskalnik, za vsako stanje posebej.
- Gumb ↻ v vrstici ali *Settings → Reset progress* postavi trenutno stanje nazaj na začetek.
- Nakup v stanju *Free* (*Full Game* → *Buy*) preklopi na polno igro in obdrži napredek.
- Z × skriješ vrstico, z gumbom M jo prikažeš nazaj.

## Kaj urejati

| Datoteka | Kaj je v njej |
|---|---|
| `data.js` | **vsa besedila, cene, avti, proge, skupine prog (`groups` in pri vsaki progi `group`), imena na zemljevidih prog, kraji ob poti in višine (`routeMaps`), imena štirih različic zemljevida (`mapVersions`), načini dirke (`modes`, `chase`), serije kariere, pokali, nagrade po mestih, današnja dirka (proge, avti, vreme, število brezplačnih voženj) in začetna stanja** – tu spreminjaš vsebino |
| `style.css` | videz (barve so na vrhu kot spremenljivke `--…`) |
| `app.js` | zasloni, premikanje med njimi, izbira mesta in izračun rezultata |
| `car3d.js` | 3D prikaz avta |
| `assets/` | 3D modeli avtov (`cars/*.json`), slike vsakega avta v vseh 8 barvah (`cars/img/<avto>-<barva>.webp`), slike gumbov glavnega menija in načinov dirke (`menu/`), makete prog, suhe in mokre (`tracks/<proga>.webp`, `tracks/<proga>-rain.webp`), posnetki ozadja (`video/`), zemljevidi prog (`maps/`: `top-<proga>` od zgoraj, `block-<proga>` 3D blok, oba tudi mokra `-rain`, `fly-<proga>.webm` posnetek preleta, `drone-<proga>.webm` posnetek iz drona in `.webp` njuni prvi sliki) |
| `outlines.js` | obrisi prog za majhne zemljevide (ustvarjeno, ne urejaj ročno) |
| `routes.js` | poti prog na zemljevidih, višine, kraji, ovinki, kje so start, cilj in kraji v vsaki sliki preleta in kdaj se začne kateri kader drona (ustvarjeno z `orodja/routes.py`, ne urejaj ročno) |

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
node flow.mjs                                    # odigra današnjo dirko, vse tri načine, izbiro avta in vremena, kariero in multiplayer -> shots/
```

Zemljevidi prog potrebujejo igro z Vršičem v `maketa-menija/game_vrsic/` in ffmpeg z VP9 (paket `imageio-ffmpeg`):

```
mkdir -p maketa-menija/game_vrsic
git archive origin/ccr-461bd7ea-r4na44 | tar -x -C maketa-menija/game_vrsic
pip install imageio-ffmpeg
cd maketa-menija/orodja
node routemap.mjs maps.json                      # zemljevidi od zgoraj in 3D bloki, suhi in v dežju -> raw/maps/ (maps.json: [[proga, "top"|"block", ime, nastavitve], …])
node flyover.mjs flyovers.json                   # posnetki preleta -> raw/maps/fly-<proga>.webm (samo nekatere: node flyover.mjs flyovers.json vrsic,gora)
                                                 # sličice riše več brskalnikov hkrati (PARALLEL=4), ustavljen zagon nadaljuje; kakovost CRF=44
PREVIEW=1 node drone.mjs drones.json vrsic       # hiter pregled kadrov drona (začetek, sredina in konec vsakega) -> raw/drone/<proga>/p*.jpg
node drone.mjs drones.json                       # posnetki iz drona (nariše jih igra sama, drone_page.js) -> raw/maps/drone-<proga>.webm
                                                 # en kader znova: izbriši raw/drone/<proga>/s<N>_*.jpg in poženi node drone.mjs drones.json <proga>
python3 routes.py                                # raw/maps -> ../assets/maps/ in ../routes.js
```

V `flyovers.json` so za vsako progo hitrost pike (`speed`, m/s), kamera (`back`, `up`, `ahead`), megla, prava višina starta in cilja (`alt`, za strmino poti), največja velikost posnetka (`kbps`) in kraji ob poti (ime in metri od starta).

V `drones.json` so za vsako progo način (`traffic`: dirka v prometu na Vršiču, `demo`: igrini dirkači), dodatni promet (`extra`) in kadri: vrsta (`push` vožnja ob cesti, `orbit` kroženje, `top` pogled navzdol, `rise` dvig), kraj (metri od starta), višina, razdalja, trajanje, ime za napis in čakanje na dirkača (`wait`).

Uporabljajo Playwright s Chromiumom (kot testi igre). Mape `game_main/`, `game_vrsic/` in `orodja/raw/` niso v repozitoriju.
