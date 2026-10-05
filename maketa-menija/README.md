# Maketa menija (angleško)

Samostojna, klikljiva maketa menija igre v angleščini. **Ni povezana z igro**: igra je ne naloži, nič v igri ne spremeni in ni del `main`. Avti, makete prog in posnetki ozadja so zajeti iz prave igre.

> **Posodobitev:** meni je zdaj v igri (`js/menu.js`, `css/menu.css`, opis v korenskem `README.md`, razdelek »Nov meni«). Maketa je ostala taka, kot je bila (zgodovina in primerjava), zato **spremembe menija delaj v igri**, ne tukaj. Orodja v `orodja/` še vedno izrisujejo slike za meni v igri (glej spodaj).

Objavljena je kot zasebna stran: <https://claude.ai/artifact/LGhsPikqgs4To6phR2LB5V>

## Glavni meni

- Gumbi so v temnem okvirju z rdeče-belim robnikom na levi, kot v prvi različici menija.
- Trije veliki gumbi s sliko:
  - **Single race**: slika današnje proge.
  - **Multiplayer**: dva avta.
  - **Career**: pokal, odstotek kariere in vrstica napredka.
- Pod njimi sta manjša gumba **Settings** in **Leaderboard**.
- Čisto spodaj je gumb za nakup **Full Game · €3.99**. Po nakupu ga zamenja oznaka *Full game*.
- V ozadju se vrtijo dva kratka posnetka dirke (Jezero Ring, gorski reli).
- **Single race** in **Career** se odpreta v istem okvirju, na istem mestu: v ozadju se še vedno vidi, kako avti dirkajo. Zgoraj v okvirju je gumb nazaj na glavni meni. Šele ko izbereš način dirke ali način kariere, se odpre zaslon čez cel ekran.

## Single race in današnja dirka

Single race ima dva koraka.

**1. korak: način dirke** (v okvirju glavnega menija). Tapneš enega od treh in odpre se izbira proge čez cel ekran (*Step 2 of 2*). Zadnji izbrani način ima kljukico:

- **Circuit race**: dirka v krogih proti 12 tekmecem.
- **Police chase**: policija ti je za petami, pobegniti ji moraš v 3 minutah.
- **Time trial**: sam proti uri in svojemu duhu (*ghost*), za zlati, srebrni ali bronasti čas.

**2. korak: proga.** Proge so razdeljene v tri skupine. Skupine so zavihki nad maketo, pri vsakem piše število prog:

- **Circuits** (privzeto): dirkališča (Jezero Ring, Riviera, La Condamine, Styria, Mie, Ardennes, Eifel).
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
   - Spodaj desno piše kraj, v katerem je pika, in njegova nadmorska višina. Ko pika pride v nov kraj, se ime zamenja (na Vršiču: *Start*, *Lake Jasna*, *Erika Bridge*, serpentine *Hairpin 1–24* z višino ali imenom, *Mihov dom*, *Russian Chapel*, *Koča na Gozdu*, *Ajdovska deklica*, *Erjavčeva koča*, *Vršič · 1,611 m*; na dirkališčih imena ovinkov, glej [Pravne opombe](#pravne-opombe)).
   - Ob poti se pokažejo tudi imena krajev, start in cilj.
   - Posnetek ima 30 sličic na sekundo. Na koncu se kamera dvigne nad cilj, nato se posnetek s kratkim prehodom začne znova.
2. **Map**: zemljevid od zgoraj čez ves okvir, do robov.
   - Pot se nariše od starta do cilja, start in cilj imata zastavici (na reli etapah in dirkališčih še oznaki vmesnih časov S1 in S2).
   - Čez progo ni nobenega pasu, da se pot vidi v celoti.

Zemljevidi in posnetki so zajeti iz sveta igre. Igra ima pokrajino samo ob progi, zato je pokrajina dlje od proge na zemljevidih dodana (hribi in gore iz višin ob progi). Vršič je vzet iz veje `ccr-461bd7ea-r4na44`, kjer se ta cesta gradi. Višine so na cestah prave (start in cilj), na reli etapah in dirkališčih približne (višina starta v `data.js`, ostalo iz sveta igre).

## Pred dirko: pot po Zemlji in let s helikopterjem

Ko klikneš *Race!* (ali *Start mission*, *Run …* v karieri), se pred dirko predvaja uvod: najprej **pot po Zemlji** (3D globus) od prejšnje dirke do te, nato brez reza **let s helikopterjem** nad vso progo. Pod vsem igra glasba države, v kateri je proga.

### Zaslon

Uvod se odpre na mestu zaslona proge, zato prehod skoraj ni viden:

- **Zgoraj** (kjer je bil naslov *Single race*): zastava države, ime proge in država (npr. *VRŠIČ, SLOVENIA*), gumb za glasbo (zvočnik) in *Skip*.
- **Slika** je na istem mestu in iste velikosti kot zemljevid na zaslonu proge.
- **Spodaj** je ista kartica kot pri progi (z rdeče-belim robnikom), v njej:
  - kaj voziš: način, avto in vreme (npr. *TIME TRIAL · BURJA R7 · DRY*, pri dirki v krogih še število krogov),
  - podatki o progi: dolžina (pri dirkališčih dolžina kroga), start, cilj in vzpon (na cestah) oziroma najvišja točka in višinska razlika (drugod), največja strmina, ovinki, podlaga, rekord,
  - **oris proge** (kot na zemljevidu, z zastavicama starta in cilja),
  - **višinski profil** z višinami na desni in kilometri spodaj.
  - Na orisu in na profilu se premika pika s helikopterjem, prevoženi del je zlat. Kraji, označeni na posnetku, so na obeh pike, ki se pozlatijo, ko jih helikopter doseže.
  - Na majhnem zaslonu ni orisa, profil je večji.
- Zgoraj desno na sliki je vrh dirke: na cestah *SUMMIT 1,611 m* (na Vršiču še ime prelaza *Vršič*), drugod najvišja točka (*HIGHEST POINT 138 m*). Ime vrha je samo tam, kjer je zemljepisno ime prelaza; dodaš ga v `orodja/intro_data.py` (`SUMMIT`).

### Pot po Zemlji (3D globus)

1. **Prva slika je zemljevid prejšnje dirke**, natanko tak, kot ga kaže meni (rumena pot, zastavici starta in cilja; pri Coloradu *Crystal Reservoir* in *Summit*). Zgoraj desno je vrh prejšnje dirke (*SUMMIT 4,301 m*).
2. Pod zemljevidom je globus, ki se z njim ujema na piksel natančno (pot, zastavici in pokrajina so na istem mestu), zato se zemljevid neopazno spremeni v 3D pokrajino.
3. Kamera se **oddalji** (se ne približa): pot in zastavici izgineta, ostane oznaka **LAST RACE** z imenom prejšnje dirke. Oznaka stoji na pokrajini in se ne premika. Obris in ime države prejšnje dirke (npr. *USA*) se pokažeta na začetku. Ko je kamera daleč, napis vrha izgine.
4. Kamera leti prek Zemlje (sever je zgoraj). Med potjo ni imen držav in krajev, ni meja in ni loka.
5. Ko se spušča k novi progi, se pokažejo oznaka **NEXT RACE** z imenom nove dirke, pod njo ime države (npr. *SLOVENIA*) in obris države, nato vrh nove dirke zgoraj desno. Pokrajina je v 3D, osenčena (sonce s severozahoda). Ime ob robu slike ne obvisi odrezano: izgine takoj.
6. Zadnja slika globusa je prva slika leta s helikopterjem. Video prevzame skozi tanek oblak, brez reza.

- Prva dirka (prejšnje še ni): pot se začne v vesolju.
- Ista proga kot prejšnjič (tudi *Race again*): globusa ni, samo let s helikopterjem.
- Stanje *Veteran* ima za prejšnjo dirko Colorado, da se vidi pot Colorado → Vršič. V stanjih *Free* in *Full game* je prva dirka iz vesolja, vsaka naslednja pa se začne tam, kjer si nazadnje dirkal.
- Brez WebGL ali z nastavitvijo telefona za manj gibanja (*reduce motion*) globusa ni.
- Pot traja 4–9 sekund: zemljevid prejšnje dirke stoji dobro sekundo, let čez Zemljo 3–7 sekund (dlje, ko je pot daljša), prehod v video še dobro sekundo.

Kje so proge na Zemlji:

- Prave proge so postavljene na pravo mesto tako, da se višine ceste v igri ujemajo s pravimi višinami: Vršič, Styria, Mie, Ardennes, Eifel. La Condamine je postavljena po pristanišču in znanih točkah, ker so v mestu višine stavb.
- Colorado in Ouninpohja sta v igri krajša od prave ceste. Start je na pravem startu, cesta je obrnjena proti pravemu cilju.
- Jezero Ring, Riviera in Mountain Rally so izmišljene. Postavljene so na kraje, ki se ujemajo z njihovo pokrajino: Jezero Ring na ravnino pri Lescah (na suho: proga ima svoje jezerce, okoli ni pravega jezera), Riviera na ravno obalo pri Piranu (morje na isti strani kot v igri), Mountain Rally na Pokljuko. Spremeniš jih v `orodja/geo_places.py` (primerno mesto za obalo in za suho ravnino poišče `orodja/geo_fit.py`).

### Let s helikopterjem

- En sam neprekinjen kader: helikopter v 30 sekundah preleti vso progo od starta do cilja (pri dirkališčih en krog), višje kot prejšnji posnetki iz drona. Začne se s spustom z globusa, ko se zravna (po 4,5 s), leti nad progo.
- Na tleh je **senca helikopterja** (z vrtečim se rotorjem).
- **Kraji ob progi so označeni v 3D** z imeni, ki stojijo na svojem mestu v pokrajini (na Vršiču: Kranjska Gora, Lake Jasna, Mihov dom, Russian Chapel, Koča na Gozdu, Ajdovska deklica, Erjavčeva koča, Vršič Pass). Ko sta dve imeni blizu, ima eno daljši drog, da se ne prekrivata. Seznam krajev za vse proge je v `orodja/landmarks.json`.
- Igra ima pokrajino samo ob progi. Kar je dlje, je dorisano: prave višine in pokrovnost tal (gozd, travniki, polja, kraji, skale, voda) z drevesi in hišami iz igre, pri obalnih progah morje do obzorja.
- Na robu sveta igre se dorisana pokrajina zlije z njim: v pasu približno 250 m prevzame barve tal igre, z nepravilnim robom, zato ni vidnih ravnih robov (`heli.json`: `feather`, metri; La Condamine 100 m). Leta za Colorado in La Condamine sta še iz prejšnjega izrisa, brez tega prehoda; nova narišeš z `REDO=1 node heli.mjs pikes,monaco` (v `orodja/`), nato `python3 intro_data.py` in `python3 intro_assets.py`.
- V dežju pada dež čez let s helikopterjem (na globusu ne).
- Po letu se prižge pet rdečih luči, ugasnejo in *GO!* – dirka se začne. Zadnji akord glasbe izzveni v luči.

### Glasba in zvok

- Vsaka država ima svojo **izvirno elektronsko skladbo** (Slovenija, ZDA, Finska, Japonska, Monako, Avstrija, Belgija, Nemčija). Skladbe so narejene za igro: vsak zvok je izračunan v programu (sintetizator v Pythonu), brez posnetih vzorcev in brez tuje glasbe.
- Vrhunec skladbe pride v trenutku, ko se helikopter zravna nad progo; glasba je ves čas usklajena s posnetkom.
- Pod letom se sliši **rotor helikopterja** (zvok je prav tako izračunan).
- Gumb z zvočnikom zgoraj glasbo izklopi ali vklopi, izbira se shrani. *Settings → Sound* izklopi ves zvok.

### Nastavitve

- *Settings → Race intro*: **Full** (globus in helikopter), **Short** (samo helikopter), **Off** (takoj luči).
- *Settings → Music*: *On* / *Off* (isto kot zvočnik v uvodu).

### Za igro

V igri lahko uvod pokrije nalaganje dirke: med uvodom se dirka nalaga, ko je naložena, se gumb *Skip* spremeni v *Start*. (V maketi se dirka ne nalaga.)

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
- **Settings**: zvok, glasba, uvod pred dirko (*Race intro*: Full, Short, Off), upravljanje, kamera, težavnost, grafika, jezik; spodaj *Credits* (viri podatkov za globus in pokrajino z licencami ter glasba).

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
| `data.js` | **vsa besedila, cene, avti, proge, skupine prog (`groups` in pri vsaki progi `group`), imena na zemljevidih prog, kraji ob poti in višine (`routeMaps`), imena dveh različic zemljevida (`mapVersions`), besedila uvoda pred dirko (`intro`: *Skip*, napis vrha, imena podatkov o progi), nastavitve (`settings`, med njimi *Music* in *Race intro*), načini dirke (`modes`, `chase`), kariera (`career`: krogi World Cupa in točke, misije pregonov, proge časovnega preizkusa, etape relija), nagrade po mestih, današnja dirka (proge, avti, vreme, število brezplačnih voženj) in začetna stanja (`states`, pri vsakem tudi `lastTrack`: prejšnja dirka, od koder se začne pot po Zemlji)** – tu spreminjaš vsebino |
| `style.css` | videz (barve so na vrhu kot spremenljivke `--…`) |
| `app.js` | zasloni, premikanje med njimi, uvod pred dirko (glava z zastavo, kartica s podatki, oris proge in profil, oznake krajev nad letom, glasba), izbira mesta in izračun rezultata; zastave držav so narisane tu (`FLAGS`) |
| `journey.js` | pot po Zemlji pred dirko (3D globus, three.js): prva slika kot zemljevid prejšnje dirke, pot kamere, oznake LAST RACE in NEXT RACE, obrisa držav, senčena pokrajina, predaja letu s helikopterjem |
| `intro-data.js` | za vsako progo država (zastava, glasba), ime vrha, kje je zemljevid proge na Zemlji in kraji, označeni nad letom s helikopterjem (ustvarjeno z `orodja/intro_data.py` iz `orodja/landmarks.json`, ne urejaj ročno) |
| `geo.js` | kje so proge na Zemlji, okolica prog, obrisi in imena držav (ustvarjeno z `orodja/geo_build.py`, ne urejaj ročno) |
| `car3d.js` | 3D prikaz avta |
| `assets/` | 3D modeli avtov (`cars/*.json`), slike vsakega avta v vseh 8 barvah (`cars/img/<avto>-<barva>.webp`), slike gumbov glavnega menija in načinov dirke (`menu/`), makete prog, suhe in mokre (`tracks/<proga>.webp`, `tracks/<proga>-rain.webp`), posnetki ozadja (`video/`), zemljevidi prog (`maps/`: `top-<proga>` od zgoraj, suh in moker `-rain`, `fly-<proga>.webm` posnetek preleta, `heli-<proga>.webm` let s helikopterjem za uvod pred dirko, `.webp` njuni prvi sliki in `heli-<proga>.json` kamera helikopterja v vsaki sliki in kraji), glasba za uvod (`music/<država>.mp3`, `music/rotor.mp3`), slike za globus (`geo/`: Zemlja `earth.webp`, regije `l1-<regija>`, okolica prog 80 km `l2-<proga>` in 14 km `l3-<proga>`, vsaka z višinami `-h.png`) |
| `outlines.js` | obrisi prog za majhne zemljevide (ustvarjeno, ne urejaj ročno) |
| `routes.js` | poti prog na zemljevidih, višine, kraji, kje so start, cilj in kraji v vsaki sliki preleta (ustvarjeno z `orodja/routes.py`, ne urejaj ročno) |

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
node bgvideo.mjs '[["jezero",7],["gora",7]]' 1.25 14   # posnetki -> ../assets/video/
node dio2.mjs proge.json                         # makete prog, suhe in v dežju -> raw/tracks/w_*.png (proge.json: [[id, ime, nastavitve], …])
python3 mkwebp.py                                # raw/tracks -> ../assets/tracks/<proga>.webp in <proga>-rain.webp
node dio2.mjs proge_igra.json                    # makete 20 prog, ki so v igri od vključitve menija (isti izris za vse: soil 38, rot 0.45, el 44, fitW 1.06, fitH 0.9) -> raw/tracks/
python3 mkwebp.py ../../assets/tracks bathurst beartooth …   # samo naštete proge, v mapo igre (assets/tracks/ v korenu repozitorija; nova proga: dodaj vrstico v proge_igra.json)
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
python3 routes.py                                # raw/maps -> ../assets/maps/ in ../routes.js
```

V `flyovers.json` so za vsako progo hitrost pike (`speed`, m/s), kamera (`back`, `up`, `ahead`), megla, prava višina starta in cilja (`alt`, za strmino poti), največja velikost posnetka (`kbps`) in kraji ob poti (ime in metri od starta).

Pot po Zemlji (globus) in prava pokrajina okoli prog pri letu s helikopterjem potrebujeta Python s paketi za zemljevide:

```
pip install numpy scipy pillow rasterio shapely pyshp
cd maketa-menija/orodja
python3 geo_data.py                              # odprti podatki: Natural Earth in NASA Blue Marble -> raw/geo/
node geo_tracks.mjs                              # sredinske črte prog iz igre -> raw/geo/<proga>-track.json
python3 geo_match.py                             # kje je vsaka prava proga: ujemanje višin ceste s pravimi -> raw/geo/match.json
python3 geo_monaco.py                            # La Condamine (Monako): po pristanišču in znanih točkah
python3 geo_fit.py jezero riviera                # izmišljeni progi: Riviera na ravno obalo, Jezero Ring na suho ravnino
python3 geo_places.py                            # vse proge na Zemlji (prave, skrajšane, izmišljene) -> raw/geo/places.json
python3 geo_build.py ..                          # Zemlja, regije, okolica prog, obrisi in imena držav -> ../assets/geo/ in ../geo.js
python3 geo_far.py                               # pokrajina okoli sveta igre za let s helikopterjem -> raw/geo/<proga>-far.json in .webp
```

Višine (Terrain Tiles, javno na AWS Open Data) in pokrovnost tal (ESA WorldCover) skripte berejo z interneta po potrebi in jih shranijo v `raw/geo/`. Barve pokrajine in letni čas (jesen in prvi sneg na Vršiču) so v `geo_paint.py`.

Let s helikopterjem nariše igra sama (`drone_page.js` v strani igre, v navideznem času, sličico za sličico):

```
cd maketa-menija/orodja
EXPORT=1 node heli.mjs nring                     # enkrat: drevesa z Eifla za proge, ki svojih nimajo -> raw/geo/kinds-nring.json
PREVIEW=1 AT=0,9,20,29 node heli.mjs vrsic       # hiter pregled nekaj trenutkov leta -> prev/heli_vrsic_<s>.jpg
node heli.mjs                                    # vse proge z letom (ali node heli.mjs vrsic,spa) -> raw/heli/<proga>/f_*.jpg, raw/maps/heli-<proga>.webm
                                                 # ena proga traja 30–60 minut, ustavljen zagon nadaljuje; vse: ./render_all.sh
python3 intro_data.py                            # kraji nad letom, vrhovi, države -> ../intro-data.js in ../assets/maps/heli-<proga>.json
python3 intro_assets.py                          # leti in glasba -> ../assets/maps/heli-<proga>.webm in .webp, ../assets/music/*.mp3
node ixclock.mjs veteran,vrsic,trial             # uvod v meniju po korakih ure (globus natančno) -> shots_ixc/ (W, H: zaslon; LAST: prejšnja proga)
node jrec.mjs veteran,vrsic,trial 46             # posnetek zaslona uvoda z glasbo, sličica za sličico -> rec/vrsic.mp4
```

V `drones.json` je za vsako progo način (`traffic`: dirka v prometu na Vršiču, `demo`: igrini dirkači) in dodatni promet (`extra`). V `heli.json` so nastavitve leta za posamezno progo (`default` velja za vse): drevesa in hiše okoli sveta igre (`plantO`), morje do obzorja (`sea`), barve na robu (`edgeTint`, `feather`: širina pasu, v katerem dorisana pokrajina prevzame barve tal igre). Kraji, označeni nad letom, so v `landmarks.json` (ime, podnapis in mesto: metri od starta, koordinate ali sredina ovinka).

Glasbo izračuna sintetizator v Pythonu (brez posnetih zvokov):

```
pip install numpy scipy numba imageio-ffmpeg
cd maketa-menija/orodja
python3 glasba/slovenia.py                       # skladba za Slovenijo -> glasba/out/slovenia.wav (vsaka država ima svojo skripto)
python3 glasba/rotor.py                          # rotor helikopterja -> glasba/out/rotor.wav
python3 glasba/spectro.py glasba/out/slovenia.wav glasba/out/slovenia.png   # spektrogram za pregled
python3 intro_assets.py                          # -> ../assets/music/*.mp3
```

Vse skladbe imajo enako zgradbo (`glasba/synth.py`): uvod pod globusom, vrhunec pri 20,0 s (ko se helikopter zravna), pristanek pri 48,2 s (konec leta, luči) in 2,5 s odzvena.

Uporabljajo Playwright s Chromiumom (kot testi igre). Mape `game_main/`, `game_vrsic/` in `orodja/raw/` niso v repozitoriju.

## Viri podatkov

- Zemlja: NASA Blue Marble (javna domena).
- Pokrovnost tal (gozd, travniki, polja, kraji, skale, voda): ESA WorldCover 10 m 2021, © ESA WorldCover project, vsebuje spremenjene podatke Copernicus Sentinel (2021), licenca CC BY 4.0.
- Višine: Terrain Tiles (Mapzen), narejene iz SRTM in 3DEP (NASA, USGS), GMTED2010 in ETOPO1 (javna domena), EU-DEM (Copernicus, financira EU) in DGM Österreich (© offene Daten Österreichs, CC BY 4.0).
- Obrisi in imena držav: Natural Earth (javna domena).
- Navedba virov je na globusu spodaj levo (*NASA · © ESA WorldCover 2021, Copernicus · EU-DEM, USGS · Natural Earth*) in v celoti v *Settings → Credits*, kot zahtevata licenci CC BY.
- Glasba in zvok rotorja: izvirno, izračunano s programom v `orodja/glasba/` (brez vzorcev, brez tuje glasbe).

## Pravne opombe

Igra bo naprodaj, zato maketa ne uporablja ničesar, kar bi bilo lahko pravno sporno:

- Ni podatkov ali slik iz Google Maps / Google Earth. Vse slike Zemlje in pokrajine so iz zgoraj navedenih odprtih virov ali iz igre same.
- Ni imen blagovnih znamk in oseb. Proge imajo splošna imena (*Mie*, *Ardennes*, *Eifel*, *La Condamine*, *Styria*, *Colorado*). Imena krajev nad letom s helikopterjem so samo zemljepisna ali opisna.
- Igra sama ima pri nekaterih dirkališčih imena ovinkov, ki so blagovne znamke ali imena oseb. Maketa jih kaže z opisnimi imeni (spremenjeno v `orodja/routes.py`, `NEUTRAL`):
  - Mie: *Dunlop* → *Uphill Left*, *Degner* → *Double Right*, *Casio Triangle* → *Last Chicane*,
  - La Condamine: *Fairmont Hairpin* → *Grand Hairpin*, *Anthony Noghès* → *Last Corner*, *La Rascasse* → *Harbour Corner*, *Mirabeau* → *Downhill Right*, *Massenet* → *Long Left*,
  - Ardennes: *Paul Frère* → *Long Right*, *Speaker's Corner* → *Short Left*,
  - Eifel: *Stefan-Bellof-S* → *Fast Esses*,
  - Colorado: *Hansen's Corner* → *Reservoir Bend*,
  - Ouninpohja: *Amazon* → *Fast Crest*, *Mutanen* → *Farm Bend*.
  
  **V igri (veja `main`) so ta imena še vedno** – igre nisem spreminjal. Pred prodajo jih je treba zamenjati tudi tam.
- Besedila so napisana na novo (nič ni prepisano).
- Zastave držav so narisane preprosto; slovenska ima poenostavljen grb (zastava kot simbol države je dovoljena, grb je stiliziran).
- Glasba je izvirna (glej zgoraj).
