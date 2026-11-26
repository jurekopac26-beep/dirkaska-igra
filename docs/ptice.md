# Ptice in živali: raziskava in načrt

Odločitev uporabnika 24. 11. 2026 (tabla #382, komentar 7120588492). Veja `grafika/ptice-zivali-bt`.
**Stanje 25. 11.:** točke 1–3 so v kodi (PR #1060). Točka 4: v kodi sta dve vrsti, ki ju potrjujejo prebrani viri [1]–[18]
(žerjav v klinu: Nürburg, Kågeröd; črni jastreb v kroženju: Aguascalientes, Quezaltepeque, Ujarrás, Rio do Rastro). Viri [19]–[38] iz okolja
niso dosegljivi (glej »Predaja«), zato druge vrste ostajajo zunaj kode.

## Odločitev (povzetek)

1. Dirkališča (skupina `circuit`): brez živali; na cestnih in rally progah ostanejo.
2. Ptice na dirkališčih ostanejo, a le v petini časa drugih prog.
3. Bolj podrobne ptice (trup, glava, krila v več delih, barve vrste), v mejah `tests/golden/perf.json`.
4. Vrsta ptice po državi proge: število v jati, formacija, let (mahanje ali jadranje), vse po virih.
5. Pred `main`: 2–3 možnosti podrobnosti s slikami, potrdi uporabnik.

## Kje je kaj v kodi

- Skupina proge: `gr(d)` v `js/menu.js` (~vrstica 104): `test` → test, `rally` ali `descent && timeTrial` → rally, `open` → road, sicer `circuit`.
- Živali: `World.life(o)` v `js/world-zivali.js` (~758), seznami `ZIV`, `SCENE`, žive `goLive`; testne proge že izstopijo (`def.test`).
  Posebne prizore v `js/world-*.js` je treba še poiskati (npr. ptice v `js/world-gore.js`, `moveBirds`).
- Ptice: razred `Birds` v `js/render.js` (~3288): 16 ptic, 2 jati po 4–7, 9 oglišč na ptico (3 trikotniki), ena barva
  (`0x2a2c31`, ob morju galeb `0xe6e9ec`), čakanje `wait` 2–12 s, ohlapen klin. `def.noBirds` ptice izklopi; v dežju jih ni.

## Viri in omejitev

Iz te seje `en.wikipedia.org` ni dosegljiv (omrežje okolja), uporabljeno je spletno iskanje. Zato je potrjenih le del podatkov.
Kar ni potrjeno, je označeno z »ni vira« in **ne gre v kodo**, dokler vira ni (tam ostane sedanja splošna ptica).

## Vrste: kaj je potrjeno

| Vrsta | Jata (število) | Formacija in let | Barve | Kraji po viru | Vir |
|---|---|---|---|---|---|
| Žerjav (*Grus grus*) | do 400; nad Eiflom verige po več sto | V (klin), izkušeni spredaj; mahanje | ni vira | Eifel (Nemčija), počivališča Švedska, Nemčija; največ gnezdi v Rusiji, na Finskem in Švedskem; baltske države kot območje | [1] [2] [3] [19] |
| Planinska kavka (*Pyrrhocorax graculus*) | »velike jate«, števila ni vira | ohlapna jata; hiter, akrobatski let, jadranje v vzgorniku ob stenah | črna, rumen kljun, rdeče noge | Alpe, Himalaja, Atlas v Maroku (nad 2880 m); Kavkaz ni vira | [4] [5] |
| Škorec (*Sturnus vulgaris*) | povprečno 30 082 (meritev, večinoma Združeno kraljestvo); prenočišča 100 000 in več | gost tridimenzionalen oblak | ni vira | Združeno kraljestvo; Rim (oktober–februar, ocene 0,5–1,5 milijona, ne štetje); Tunizija ni vira | [6] [7] [20] |
| Siva gos (*Anser anser*) | v letu ni vira (zbori do 25 000, šibek vir); družine ostanejo skupaj vse leto | V: gosi letijo ~1 m za sosedo in vstran, vodilne se menjajo (vir o goseh na splošno) | ni vira | Danska (141 000, avgust 2022), Nizozemska (stalnica) | [8] [9] [21] |
| Črni jastreb (*Coragyps atratus*) | od nekaj do več sto; na selitvi nekaj do nekaj deset | jadranje v termiki; ravna krila, nekaj hitrih plitvih zamahov, nato drsenje | črn, bele lise ob konicah kril | od JV ZDA do srednjega Čila in Urugvaja; Argentina ni izrecno | [10] [11] [12] |
| Črni škarnik (*Milvus migrans*) | skupna prenočišča; na selitvi velike jate, števila ni vira | jadranje in drsenje v termiki | viličast rep | Evropa, Azija, Afrika, Avstralija; Japonska; Altaj ni vira | [13] |
| Rumenonogi galeb (*Larus michahellis*) | ni vira | ni vira | ni vira | Sredozemlje, vzhodni Jadran, Baleari, Madeira (*atlantis*), Istanbul | [14] [15] |
| Azijski odprtokljuni štrk (*Anastomus oscitans*) | običajno v jatah; števila v letu ni vira | jadranje v termiki, vrat iztegnjen | ni vira | Tajska | [16] |
| Kanadska gos (*Branta canadensis*) | ni vira (kot klina je odvisen od velikosti jate) | V (klin), vodilne se menjajo | ni vira | Severna Amerika (meritve z radarjem); Kanada, ZDA izrecno ni vira | [21] [22] |
| Rožnati kakadu, galah (*Eolophus roseicapilla*) | »velike, hrupne jate«, števila ni vira | ohlapna jata; poskakujoč, akrobatski let | ni vira | Avstralija; Novi Južni Wales (opazovanja jat brez štetja) | [23] |
| Rumenokljuni škarnik (*Milvus aegyptius*) | nomadske jate; prenočišče 1500–3500 (KwaZulu-Natal) | formacija ni vira | ni vira | južna Afrika (avgust–marec); Kenija, Tanzanija: domorodna vrsta, jate ni vira | [24] [25] |
| Andski kondor (*Vultur gryphus*) | ni vira | jadranje; maha le ~1 % časa leta (osem mladih ptic z merilniki) | ni vira | Patagonija pri Barilocheju, **Argentina** (ne Čile: popravljeno 25. 11.) | [26] |
| Velika burnica (*Fregata minor*) | ni vira | jadranje v termiki pod kopastimi oblaki, redki, počasni in globoki zamahi | ni vira | Tihi in Indijski ocean; Fidži, Samoa, Palau izrecno ni vira | [27] |
| Bela štorklja (*Ciconia ciconia*) | jate negnezdečih (Harghita), števila ni vira | jadranje v termiki | ni vira | Romunija (popis 2025: več kot 7500 parov) | [28] |
| Veliki plamenec (*Phoenicopterus roseus*) | ni vira | ni vira | ni vira | Katar (november–april, obala); Bahrajn (vrh decembra, štetje 1991) | [29] |
| Kravja čaplja (*Bubulcus coromandus*) | ohlapne jate do več sto; prelet na prenočišče 850–1000 (Hongkong) | formacija ni vira | ni vira | riževa polja; Šrilanka (zimski priliv) | [17] [18] |

[1] nabu.de/tiere-und-pflanzen/voegel/artenschutz/kranich/kranichzug-aktuell.html ·
[2] nabu.de/tiereundpflanzen/voegel/zugvoegel/kraniche/14589.html · [3] en.wikipedia.org/wiki/Common_crane ·
[4] en.wikipedia.org/wiki/Alpine_chough · [5] birdfact.com/birds/alpine-chough ·
[6] ncbi.nlm.nih.gov/pmc/articles/PMC5476259 (Goodenough in sod., 2017) · [7] woodlandtrust.org.uk/blog/2018/11/starling-murmurations ·
[8] projects.au.dk/can/projects/greylag-geese-count · [9] beardsleyzoo.org/greylag-goose.html ·
[10] allaboutbirds.org/guide/Black_Vulture · [11] hawkmountain.org/raptors/black-vulture · [12] inaturalist.org/guide_taxa/178464 ·
[13] en.wikipedia.org/wiki/Black_kite · [14] en.wikipedia.org/wiki/Yellow-legged_gull · [15] link.springer.com/article/10.1007/s10336-013-1020-x ·
[16] en.wikipedia.org/wiki/Asian_openbill · [17] en.wikipedia.org/wiki/Eastern_cattle_egret · [18] avifauna.hkbws.org.hk/species/0170/023000 ·
[19] savingcranes.org/wp-content/uploads/2024/10/crane_conservation_strategy_eurasian_crane.pdf ·
[20] euronews.com/travel/2022/02/01/visit-rome-in-winter-for-a-chance-to-see-this-stunning-natural-wonder ·
[21] wwt.org.uk/news-and-stories/blog/why-do-geese-fly-in-v-formation-the-science-behind-the-sky-s-most-iconic-shape ·
[22] sora.unm.edu/sites/default/files/journals/auk/v093n03/p0554-p0559.pdf (Auk, 1976) · [23] birdlife.org.au/bird-profiles/galah ·
[24] en.wikipedia.org/wiki/Yellow-billed_kite · [25] birdmap.africa/docs/sabap1/888.pdf · [26] pmc.ncbi.nlm.nih.gov/articles/PMC7395523 ·
[27] audubon.org/magazine/these-masters-of-sky-can-fly-hours-or-days-while-barely-flapping ·
[28] romania-insider.com/white-stork-census-romania-2025 · [29] visitqatar.com/en/things-to-do/get-inspired/wildlife/flamingo-migration-in-qatar

[30] fieldguides.com/triplists/jam18c.html; en.wikipedia.org/wiki/Blue_and_John_Crow_Mountains_National_Park · [31] svalbardmuseum.no/en/birds; lifeinnorway.net/winter-wildlife-of-svalbard · [32] datazone.birdlife.org/site/factsheet/mussulo-iba-angola; fieldguides.com/triplists/ang23.html
[33] osme.org/trip-reports/kirgtrip1 · [34] koreascience.kr/article/JAKO202108148753837.page · [35] madacamp.com/Isalo; planetscott.com/site/863/isalo-national-park · [36] fieldguides.com/triplists/png25TRIPLIST.pdf
[37] datazone.birdlife.org/site/factsheet/serra-do-pico-da-antónia-iba-cape-verde/text · [38] journal.univ-eloued.dz/index.php/ajb/article/download/49/39/76

Viri [19]–[38] so povzeti iz izpisov spletnega iskanja 24. 11. (strani niso bile prebrane v celoti); pred vnosom v kodo vsako številko preveri na strani.

## Države s pravimi progami: predlog vrste (še ni potrjeno, razen kjer piše)

Predlog je delovna domneva seje, **ne vir**. Vsaka vrstica potrebuje vir za kraj, število in formacijo, preden gre v kodo.

| Predlog vrste | Države (proge) | Stanje |
|---|---|---|
| Žerjav, klin | Nemčija (Nürburg) | potrjeno [1] [2]; Švedska in Finska: kraj potrjen [3]; Latvija le kot »baltske države« [19]; Belgija: vir manjka |
| Planinska kavka, ohlapna jata | Švica (Furka), Francija (Izoard), Maroko (Dadès), Indija (Killar), Butan (Isuna) | območje potrjeno [4]; število manjka; Gruzija, Kazahstan, Albanija: ni vira |
| Škorec, gosta jata | Anglija, Wales, Irska, Avstrija, Slovenija, Slovaška, Italija, Tunizija | potrjena Združeno kraljestvo [6] in Italija (Rim, zima) [20]; drugo manjka |
| Siva gos, klin | Nizozemska, Danska, Češka | kraj potrjen za NL in DK [8]; klin potrjen za gosi na splošno [21]; število v letu manjka |
| Črni jastreb, jadranje v skupini | Mehika, Salvador, Kostarika, Panama, Brazilija, Peru, Argentina | območje potrjeno [12]; Argentina manjka |
| Črni škarnik, jadranje | Japonska, Rusija (Altaj), Vietnam | potrjena Japonska [13] |
| Rumenokljuni škarnik, jadranje | Južna Afrika, Kenija, Tanzanija, Uganda | Južna Afrika potrjena (jate, avgust–marec) [24] [25]; Kenija, Tanzanija le prisotnost; Uganda ni vira |
| Kanadska gos, klin | Kanada, ZDA | klin potrjen [22]; kraj in število manjkata (hww.ca iz okolja ni dosegljiv) |
| Galah, ohlapna jata | Avstralija | potrjeno [23]; število manjka (Bathurst je dirkališče: ptice v petini časa) |
| Andski kondor, jadranje posamič | Čile | **ni potrjeno**: meritev [26] je iz Argentine (Bariloche); za Čile in za število manjka vir, v kodo ne gre |
| Bela štorklja, jadranje | Romunija | kraj potrjen [28]; število v jati manjka |
| Veliki plamenec | Katar, Bahrajn, Angola (Luanda) | kraj potrjen [29]; Angola: jate ob polotoku Mussulo [32], nad mestno cesto ni vira; formacija in število manjkata |
| Puranji jastreb, jadranje | Jamajka (Irishtown) | potrjeno: pogost po vsem otoku, po njem ime gorovja [30]; število manjka |
| Brez ptic pozimi | Norveška (Longyearbyen) | potrjeno: polarna noč od novembra do konca januarja, čez zimo ostane od kopenskih ptic samo svalbardska belka (na tleh) [31]; predlog: pozimi ptic na nebu ni |
| Indijska majna in hudournik | Uzbekistan (Hiva) | potrjeno kot zelo pogosti v mestu, poljska vrana prisotna [33]; eno samo poročilo iz leta 2000, opoldanska vročina: ptic malo |
| Poljska vrana, gosta jata (zima) | Južna Koreja (Seul) | pozimi (november–marec) v državi, jate v mestu Suwon južno od Seula [34]; za Seul sam ni vira |
| Šarasta vrana ali črni škarnik | Madagaskar (Isalo) | obe vrsti na seznamu parka [35]; rumenokljuni škarnik tam ni potrjen; formacija manjka |
| Papuanski kljunorožec | Papua Nova Gvineja (Sogeri, Tapini) | potrjen v parku nad planoto Sogeri [36]; let v parih ali jatah ni potrjen; Tapini ni vira |
| Velika burnica, jadranje | Fidži, Samoa, Palau | let potrjen [27]; otoki izrecno ne; Sveta Lucija (sorodna vrsta *Fregata magnificens*): zapisi samo z juga otoka, zahodna obala ni potrjena |
| Rumenonogi galeb, ohlapna jata | Italija, Črna gora, Albanija, Španija, Portugalska (Madeira), Turčija | kraji potrjeni [14] [15]; število in formacija manjkata |
| Azijski odprtokljuni štrk | Tajska (Buriram) | potrjeno [16]; število manjka |
| Kravja čaplja | Filipini, Indonezija, Šrilanka, Malezija | potrjena Šrilanka [17]; formacija manjka |
| Brez potrjene vrste (iskanje 25. 11.) | Zelenortski otoki (Santo Antão) | ni seznama vrst za otok; ujede so tam redke (črni škarnik, kanja) [37]; ostane sedanja ptica |
| Brez potrjene vrste (iskanje 25. 11.) | Alžirija (Ghoufi) | pri Ghoufiju zapisana le magrebska sraka (marec 2019) [38], brez podatka o jatah; ostane sedanja ptica |
| Brez potrjene vrste (iskanje 25. 11.) | Kitajska (Tianmen) | vir z vrstami ni najden; ostane sedanja ptica |

## Narejeno v kodi (24. 11.)

- `World.noAnimals(def)` v `js/world-zivali.js`: res za skupino `circuit` (kot `gr` v meniju), razen zamrznjenih (`pending`).
  Na takih progah `World.life` ne postavi prizorov (`SCENE`), čred ne živih živali; jase obdržijo samo stvari (`Z.t`). 25 dirkališč.
- Kenguruji v Bathurstu (`LK.roos`, `js/world-rbring.js`): na dirkališču jih ni.
- Ptice (`Birds`, `js/render.js`): `birds.rare = 5` na dirkališčih; čakanje je 5-kratno in še 4-kratni čas zadnjega preleta,
  torej so v zraku petino časa kot drugje.
- Test `tests/browser/zivali.test.mjs`: Nürburg, Bathurst in Spa brez živali; Katu-Jaryk, Caracoles, Medvode kot prej.
- **Odločeno 24. 11. (uporabnik, prek koordinacije biketraveler): »Pusti zamrznjene«.** Crystal Palace, London, Marrakech ostanejo nespremenjena.
  Zvoki: kravji zvonci nastanejo iz čred sveta, zato jih na dirkališčih (Spa, Red Bull Ring) ni več; napovedovalec ostane.
  Golobi (`zivali.city`) so nespremenjeni. Test `okolje.test.mjs` je usklajen (25. 11.); zvonci ob čredi na dirki niso več preverjeni.

## Podrobnost ptic: odločeno 24. 11.

- **Uporabnik je na strani Odločitve izbral »3 · C, 22 trikotnikov«** (vprašanje `ptice-podrobnost-1060`, odgovor 24. 11. ob 23.28).
- `Birds` v `js/render.js` riše samo še to obliko (`Birds._bird`: trup s hrbtom, glava s temenom, kljun, rep v treh delih, krilo z
  nadlahtjo, dlanjo in prsti; dlan zamahne za nadlahtjo). Stopnje 0, A in B ter `setDetail` so odstranjene.
- En klic risanja; največ 16 × 66 = 1056 oglišč (prej 144). Barve so odtenki osnovne barve po ogliščih; barve vrst šele po virih.
- Rišejo se samo ptice v zraku (`setDrawRange`); brez jate nič oglišč. Sepang je pri najgostejšem mestu tik pod mejo (899 tisoč od 900):
  vsaka dodatna geometrija na tej progi test zmogljivosti obrne.

## Vrste v kodi (25. 11.)

- Polje `ptice` v datoteki proge (`js/tracks/<id>.js`), opis vrste v `BIRD_KIND` (`js/render.js`, pred razredom `Birds`). Proga brez polja,
  testna ali zamrznjena ima sedanjo ptico (ob morju galeba).
- `ptice: 'zerjav'` (Nürburg, Kågeröd): klin 9–16 ptic, vodilna na konici, druge izmenično levo in desno za njo, vse mahajo ves čas
  [1] [2] [3]. Pravi klini štejejo do 400 ptic; meja je 16 ptic razreda `Birds`. Nürburg je dirkališče: jata pride v petini časa.
- `ptice: 'jastreb'` (Aguascalientes, Quezaltepeque, Ujarrás, Rio do Rastro): 3–7 ptic kroži v termiki, vsaka na svojem krogu (7–19 m),
  vse v isto smer, nagnjene v zavoj; ravna krila, vsakih 4–9 s sekunda hitrih plitvih zamahov; črne, bele lise ob konicah kril [10] [11] [12].
- Jata vrste pride cela ali je ni (če je v zraku premalo prostih ptic, počaka). Velikost ptice je enaka kot prej (za razpone kril ni prebranega vira).
- Brez vrste ostanejo: Finska (Koli in Harju sta zimski, Ouninpohja testna; žerjavi so pozimi na jugu), Cusco (za višino nad 3000 m ni vira),
  Portobelo (ob morju ostanejo galebi), Pembrey in italijanske proge (glej vprašanje o škorcih spodaj), vse zamrznjene proge.
- Test `tests/browser/ptice.test.mjs`; `Render.birdsInfo()` je odprt samo zanj. Klici risanja in oglišča se ne spremenijo (isti en klic, največ 1056 oglišč).

## Predaja (naslednja seja)

1. **Odločitvi uporabnika (25. 11.):** škorci `ptice-skorci-1060` = **a**: navadna ptica, razmaknjena jata kot zdaj; brez gostega oblaka in
   brez novega razreda. Pembrey in italijanske proge torej ostanejo brez polja `ptice`. Viri `ptice-viri-1060` = **1**: gostitelji naj bodo
   dovoljeni v okolju; seja sprememb okolja ne predlaga sama, javi koordinaciji.
2. **Omrežje:** okolje »Koordinacija« dovoli samo `overpass-api.de` in `api.openstreetmap.org`. Tudi 26. 11. se strani virov niso odprle
   (14 naslovov, zavrnitev posrednika 403). Potrebni gostitelji: savingcranes.org, www.euronews.com, www.wwt.org.uk, sora.unm.edu,
   birdlife.org.au, pmc.ncbi.nlm.nih.gov, www.audubon.org, www.romania-insider.com, visitqatar.com, en.wikipedia.org, hww.ca,
   datazone.birdlife.org, www.nabu.de, www.allaboutbirds.org. Javljeno koordinaciji biketraveler; do takrat samo žerjav in črni jastreb.
3. Iz izpisov iskanja 25. 11.: [26] drži za 1 % mahanja in osem ptic, kraj je Argentina (popravljeno zgoraj). Drugi viri [19]–[38] niso preverjeni.
4. **Kartica `ptice-vrste-1060`** (26. 11.): slike zdaj/potem za žerjave (Kågeröd) in jastrebe (Aguascalientes); odgovor **1 · Ok, tako na main**.
5. Naslednje vrste, ko bodo viri prebrani: siva gos (NL, DK; klin: formacija `wedge` je že v kodi), kanadska gos, črni škarnik (Japonska; `soar`),
   bela štorklja (Romunija; `soar`), rumenokljuni škarnik (Južna Afrika). Nova vrsta = vnos v `BIRD_KIND` in polje `ptice` v progi.
6. Sepang: na `main` je pri 899 od 900 tisoč oglišč; ptice tega ne spreminjajo (Sepang nima polja `ptice`). Rezerva zahteva poseg v progo: ločena tema.
7. Zamrznjena dirkališča (Crystal Palace, London, Marrakech) ostanejo nespremenjena (odločeno 24. 11.); zvonci: »1 · Ok, brez zvoncev«.
8. Viri v kodi so v `README.md`, »Zasluge« (vrstica »Ptice po državi proge«); ob novi vrsti jo dopolni.
