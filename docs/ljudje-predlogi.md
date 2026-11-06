# Ljudje ob progi: 12 predlogov

Uporabnik (1. 11. 2026): ljudje v igri porabijo veliko grafike in niso dobri. Naj jih bo veliko manj, večinoma na dirkališčih (na tribunah ter kot mehaniki, sodniki, gasilci, varnostniki, policija …); ob dolgih progah (npr. Nürburg) skoraj brez gledalcev, občasno pa skupina, ki pred tvojim prihodom dela kaj svojega (hiška, avtodom, prikolica, ogenj na travi s peko hrane, telovadba, televizija …), ko te zasliši, pusti delo in steče k ograji gledat, kako pelješ mimo. Med izdelavo je dodal: **ljudje se družijo v skupinah po 2–10**, elementov naj bo čim več, za ljudi si je treba vzeti čas in na različna mesta postaviti različne elemente.

Seja je naredila 12 predlogov, vsak v eni sliki (pokončna slika za telefon, izrisana v pravi igri s kamero za avtom: od blizu; ko te zaslišijo; ko tečejo k ograji; ko pelješ mimo; rumena lupa je povečava skupine iz iste kamere). Slike so bile poslane uporabniku v pogovoru, v repozitoriju jih ni (velike). Uporabnik je izbral **vseh 12** (stran Odločitve, 1. 11. 2026) in naročil, naj se naredijo v igri prednostno, v novi seji in novem osnutku PR (veja `claude/beautiful-gauss-v7ksgu-ljudje`).

## V igri (2. 11. 2026)

- **`js/world-ljudje.js`** (`World.people(o)` na koncu `finish` v `js/world.js`, za `World.life`): prizori stojijo za ograjo na mestih iz tabele `SITES` (metri od štarta, stran); elementi prizora so zapečeni v en model z barvami oglišč in en neosvetljen model (ogenj, lučke, zasloni: barvne ploskve, brez tekstur in napisov), ljudje prizora so en model, ki se poza na CPU samo, ko je prizor blizu kamere in v sliki (kosti iz poz `poseJ`, gibi dela `MOTION`). Dim (žar, ogenj, dimnik, tovornjak s hrano) je en model za ves svet.
- **Obnašanje** po avtu, ki mu sledi kamera: ~2,8 s pred prihodom opozorilo (`WARN`), vsak po svojem času odziva (otrok prvi) steče k ograji (~5 m/s, pri hiši in starejši hodijo), tam navija z glavo za avtom, ~4 s po mimovožnji se vrne k delu (`planOut`, `planBack`); osebje ne teče (maršal z radiem, mehaniki, gasilci in reševalci gredo na rob in pogledajo za tabo, mehanik pomoli tablo čez zid), na tribuni vstanejo tisti ob avtu (val gre z njim), pes teče ob vrtni ograji, kamera na stolpu sledi avtu. Brez avta (preizkus sveta) so vsi v prvi pozi, da je prstni odtis stalen.
- **12 predlogov** na mestih s slik: Nürburg (oder 1950 m desno, žar 3300 levo, ogenj 5640 levo, TV 16350 levo, telovadba 18450 levo), Ouninpohja (hiša 2240 levo), Bathurst (boksi 70 levo ob zidu, tribuna 5790 desno), Spa (vhod 170 levo, fotografi 870 levo, maršali 1360 desno, gasilci 5560 desno).
- **Nove vrste** za druge proge (`S.kamp`, `S.piknik`, `S.kolesarji`, `S.foto2`, `S.reli`, `S.hisa2`); barve elementov se izberejo po prizoru, zastave in slog hiš po državi (`FLAGS`, `HOUSES`).
- **Gledalci ob cesti**: redke skupine in mirni po odločitvi uporabnika 31. 10. 2026, kot jih je naredil #225 (`fewFans`, `CR_KEEP` in `CR_CALM` v `js/world.js`), na Nürburgu še redkeje (`CR_KEEPT`: »Nürburg je lahko skoraj brez gledalcev«); tribune, osebje in skupine, ki jih svetovi postavijo posebej, ostanejo, testne proge so nespremenjene.
- **Orodja**: `tools/ljudje/igra.mjs <proga> [prizor,…] [--dez]` (`--dez`: v dežju, z dežniki) (avto pelje mimo prizorov, slike iz kamere za avtom na izbranih razdaljah in povečava ljudi), `tools/ljudje/mesta.mjs <proga> --plan …` (kandidati za mesta: ravna pot pred mestom, ograja blizu, ravna tla, ista cesta, brez stavb in drugih stvari in ne na stranski cesti proge, stavbe tudi po žarkih navzdol (velika stavba ima malo oglišč), ne na ulici, parkirišču ali ustju križišča sveta (asfalt pod žarki od 2 m za ograjo naprej); razporedi vrste prizorov in izpiše vrstico za `SITES`; `--preveri 3424:1,…` oceni dana mesta).
- **Testa**: `tests/browser/ljudje.test.mjs`, `tests/ljudje-mesta.test.js` (mesta brez brskalnika).

### Prizori po progah

Na Irohazaki in Tianmenu (strme ceste med zidovi) ni ravnega prostora za prizor, na Chapman's Peaku (cesta med pečino in morjem) samo na razgledih in dovozih, kamor lahko zapelje avto (prizor ne sme stati na stranski cesti, `tests/ljudje-mesta.test.js`); Detroit ima samo maršale (1944). Na dirkališčih z boksi ni prizora mehanikov nasproti igralčevega boksa: svet tam sam postavi stojnice ekip ob zidu boksov, izrisovalnik pa inženirja in mehanike (prej je bil prizor v stojnici); mehaniki ob zidu so samo na Bathurstu (70 m, za zadnjim boksom). V mestih prizori ne stojijo na ulicah (Bang Saen: drugi pas ulice Sai 2 za ločilnim pasom med 670 in 2165 m desno; preverja `tests/ljudje-mesta.test.js` z ulicami iz `tests/lib/ulice.js`, ulice, parkirišča in ustja križišč drugih mest pa `tools/ljudje/mesta.mjs --preveri`, »asf«).

| Proga | Prizorov | Prizori (metri od štarta) |
|---|---|---|
| Mount Baldy, ZDA | 3 | piknik 2080, fotografi na bregu 4704, kolesarji 6248 |
| Bang Saen, Tajska | 6 | tribuna z valom 528, fotografi in TV kamera 1864, varnostniki s psom 2080, gasilci in reševalci 2296, maršali 2440, gasilci in reševalci 2728 |
| Bathurst, Avstralija | 10 | mehaniki pri zidu boksov 70, žar pred avtodomom 640, delavci na progi 744, gasilci in reševalci 1104, vhod 1976, maršali 2784, fotografi in TV kamera 4456, oder iz gradbenih odrov 4984, reševalna postaja 5296, tribuna z valom 5790 |
| Beartooth, ZDA | 1 | piknik 1696 |
| Big Sur, ZDA | 4 | piknik 56, ležalniki in senčniki 392, fotografi na bregu 1984, kolesarji 3664 |
| Los Caracoles, Čile | 4 | kamp s prikolico 40, piknik 6152, navijaški klub 9936, fotografi na bregu 10488 |
| Crystal Palace, Anglija | 6 | maršali 96, sodniki s časomerom 248, gasilci in reševalci 600, fotografi na bregu 1064, piknik 1424, vhod 2912 |
| Detroit, ZDA | 1 | maršali 1944 |
| Great Alpine Road, Avstralija | 7 | fotografi na bregu 2096, igra kart pod senčnikom 2384, piknik 4992, spuščanje zmaja 5528, na lestvah in tovornjaku 6048, kamp s prikolico 6728, motoristi 6992 |
| Harju, Finska | 4 | redarji ob traku 392, oder iz gradbenih odrov 1464, ležalniki in senčniki 1856, fotografi na bregu 2144 |
| Mount Hotham, Avstralija | 6 | fotografi na bregu 832, kamp s prikolico 2760, igra kart pod senčnikom 3160, selfie in snemanje 6448, piknik 7608, badminton in frizbi 7872 |
| Katu-Jaryk, Rusija | 4 | na lestvah in tovornjaku 64, navijaški klub 392, ogenj na travi 720, kamp s prikolico 4544 |
| Longford, Avstralija | 9 | piknik 288, fotografi in TV kamera 1368, sodniki s časomerom 1664, maršali 1784, družina pri hiši 2384, otroški rojstni dan s starši 5128, žar pred avtodomom 5488, gasilci in reševalci 5952, fotografi na bregu 6552 |
| Marrakesh, Maroko | 6 | gasilci in reševalci 80, maršali 480, tribuna z valom 1112, delavci na progi 1424, maršali 1560, fotografi in TV kamera 2320 |
| Mauna Kea, ZDA | 4 | fotografi na bregu 136, kamp s prikolico 3472, spuščanje zmaja 3776, kitara in ples 4488 |
| Medvode, Slovenija | 9 | fotografi na bregu 96, golaž v kotlu 1384, piknik 1664, čebelarji in med 2144, badminton in frizbi 2408, družina pri hiši 2896, nogomet na travi 3160, ribiči na bregu Zbiljskega jezera 3604, kolesarji 4336 |
| Moki Dugway, ZDA | 2 | kamp s prikolico 264, fotografi na bregu 4880 |
| Monterey, ZDA | 6 | fotografi in TV kamera 944, maršali 1440, gasilci in reševalci 1904, oder iz gradbenih odrov 2288, tribuna z valom 3160, žar pred avtodomom 3560 |
| Montréal, Kanada | 7 | gasilci in reševalci 136, fotografi in TV kamera 1736, maršali 2520, TV ekipa 2656, maršali 3232, odvozna služba 3888, tribuna z valom 4064 |
| Santa Monica Mountains, ZDA | 2 | piknik 328, fotografi na bregu 2264 |
| Newcastle, Avstralija | 5 | tribuna z valom 144, maršali 720, fotografi in TV kamera 1072, gasilci in reševalci 1608, gasilci in reševalci 1976 |
| Nürburg, Nemčija | 15 | oder iz gradbenih odrov 1950, žar pred avtodomom 3300, TV pod šotorom 4720, ogenj na travi 5640, fotografi na bregu 7672, gasilci in reševalci 8424, odvozna služba 8832, ogenj na travi 9832, oder iz gradbenih odrov 11088, piknik 12392, žar pred avtodomom 14624, TV pod šotorom 16350, kamp s prikolico 17168, telovadba 18450, maršali 19976 |
| Ouninpohja, Finska | 14 | družina pri hiši 1064, spravilo sena na njivi 1900, hiša ob cesti 2240, ogenj na travi 3336, selfie in snemanje 3744, fotografi na bregu 4808, starejši s časomerom 5296, ribiči na bregu jezera 5640, redarji ob traku 6096, golaž v kotlu 6696, nogomet na travi 7024, oder iz gradbenih odrov 7320, redarji ob traku 8648, kamp s prikolico 9568 |
| Palomar Mountain, ZDA | 3 | fotografi na bregu 152, kolesarji 1576, piknik 4720 |
| Pikes Peak, ZDA | 2 | starejši s časomerom 3824, fotografi na bregu 4672 |
| Pikes Peak (makadam), ZDA | 1 | fotografi na bregu 3824 |
| Rio do Rastro, Brazilija | 3 | motoristi 4064, piknik 4432, kitara in ples 4784 |
| Štajerska, Avstrija | 9 | vhod 216, sodniki s časomerom 560, gasilci in reševalci 896, maršali 1704, odvozna služba 1848, TV ekipa 1968, žar pred avtodomom 2488, oder iz gradbenih odrov 3112, fotografi in TV kamera 3560 |
| Rio de Janeiro, Brazilija | 5 | fotografi in TV kamera 1200, gasilci in reševalci 2224, tribuna z valom 2664, maršali 3376, maršali 4040 |
| Riverside, ZDA | 6 | žar pred avtodomom 464, fotografi in TV kamera 2416, gasilci in reševalci 3728, maršali 4112, fotografi na bregu 4312, tribuna z valom 4568 |
| Sani Pass, Južna Afrika | 2 | fotografi na bregu 1328, kamp s prikolico 4920 |
| Spa, Belgija | 9 | vhod 170, fotografi in TV kamera 870, maršali 1360, ogenj na travi 1864, tribuna z valom 4280, reševalna postaja 4736, gasilci in reševalci 5560, TV ekipa 6000, žar pred avtodomom 6288 |
| Suzuka, Japonska | 7 | tribuna z valom 118, vhod 806, fotografi in TV kamera 2022, reševalna postaja 3510, gasilci in reševalci 4070, delavci na progi 4454, maršali 5078 |
| Toronto, Kanada | 6 | gasilci in reševalci 112, tribuna z valom 752, varnostniki s psom 984, maršali 1128, maršali 1976, fotografi in TV kamera 2328 |
| Townsville, Avstralija | 6 | maršali 88, gasilci in reševalci 504, vhod 888, fotografi in TV kamera 1560, tribuna z valom 2176, varnostniki s psom 2496 |
| Trois-Rivières, Kanada | 5 | maršali 144, fotografi in TV kamera 496, gasilci in reševalci 904, tribuna z valom 1456, vhod 1960 |
| Uncompahgre, ZDA | 2 | kamp s prikolico 600, ogenj na travi 2720 |
| Vršič, Slovenija | 8 | kolesarji 648, golaž v kotlu 1000, kamp s prikolico 1576, piknik 2560, spravilo sena na travniku 3464, motoristi 5160, kolesarji 8152, fotografi na bregu 12248 |

## Orodje (`tools/ljudje/`)

- `ljudje3d.js`: nov model človeka (`person`, poze `pose`, predmeti v roki `hold`, oblačila po vlogah) in vsi elementi s slik (avtodom, prikolica, šotori, ogenj, žar, TV, hiša, oder, tribuna, maršalska postaja, gasilsko vozilo, vhod, boksi …), živali in gozdni elementi; THREE r128, samo za slike (živali in gozdni elementi so v igri v `js/world-zivali.js`).
- `prizori.js`: 12 prizorov (mesto na progi, ljudje s stanji `act`, `run`, `fence`, kamera od blizu), `prizori-proge.json`: proga vsakega prizora.
- `predlogi.mjs scene zar,ogenj,…`: izris v igri (`explore <proga> <m,…>` posnetki mest, `probe <proga> <od> <do> <korak>` ravnine z ograjo blizu); `sestavi.mjs`: sestavi slike z besedili iz `besedila.json`; `studio.mjs people|roles|props|props2|zoo|forest`: predogled brez igre. Vse v `test-results/ljudje/`.

## Zdaj (meritev, 1. 11. 2026)

Gledalci ob progi so instancirani kockasti ljudje (`crowdGeo` v `js/world.js`, 112 oglišč na osebo). Kamera za avtom, telefon ležeče, 12 mest na krogu:

| Proga | Ljudi ob progi | Njihova oglišča na sličico (Nizka: povprečje / največ) | Visoka |
|---|---|---|---|
| Nürburg | 11.706 | 23k / 42k (7 %) | 41k / 75k |
| Spa | 5.617 | 48k / 129k (11 %) | 77k / 171k |
| Bathurst | 4.198 | 33k / 138k (9 %) | 60k / 150k |
| Ouninpohja | 6.902 | 31k / 67k (6 %) | |
| Harju | 5.931 | 107k / 164k (16 %) | |
| Longford | 5.309 | 34k / 91k (8 %) | |
| Štajerska | 2.968 | 23k / 103k (6 %) | |

Tribune (ljudje na sliki tribune, `crowdStands`) so poceni in niso v tej tabeli.

## Skupno vsem predlogom

- Ob progi ni več dolgih vrst posameznih gledalcev. Ljudje so samo v **prizorih po 2–10** (na Nürburgu npr. 10–15 prizorov namesto 11.706 gledalcev), na dirkališčih pa še na tribunah in kot osebje.
- **Nov model človeka**: ločene noge (tek), roke s komolci (držijo stvari), ramena, vrat, lasje ali pokrivalo (kapa, čelada, policijska kapa, gasilska čelada), odsevni jopiči; ~300 oglišč od blizu, od daleč poenostavljen. Uporabniku je všeč (»super novi ljudje so mi všeč«).
- Obnašanje v štirih korakih: delo (zanka gibov) → ko si ~4 s pred njimi, vstanejo in stečejo k ograji → ko pelješ mimo, navijajo, mahajo, snemajo, z glavo ti sledijo → počasi se vrnejo. Osebje (maršali, gasilci, policija, mehaniki) ne teče navijat, ampak dela.
- Cena prizora: rekviziti zliti v en model, ljudje instancirani, dim en delec: ~3–5 klicev risanja in ~10–25 tisoč oglišč, ko je prizor v sliki.
- Vse brez imen in znamk (na zaslonih le izmišljene številke avtov).

## Predlogi

| Št. | Ime | Kje na sliki | Skupina | Elementi | Obnašanje |
|---|---|---|---|---|---|
| 1 | Žar pred avtodomom | Nürburg (ravnina pred Schwedenkreuzom) | 5 | avtodom z markizo in lučkami, žar z dimom, miza, stoli, hladilna torba, zaboji, plinska jeklenka, zastava, kolo, bazenček | pečejo in jedo, otrok v bazenčku; stečejo k ograji (otrok prvi); oče maha s prijemalko, drugi snemajo |
| 2 | Ogenj na travi | Nürburg (pred Adenauer Forstom) | 6 | taborni ogenj z dimom, hlodi za sedenje, šotori, viseča mreža, drva, tnalo | pečejo hrenovke na palicah; stečejo s palicami; eden spi v mreži in se ne zbudi |
| 3 | Telovadba ob prikolici | Nürburg (Döttinger Höhe) | 5 | prikolica z avtom, podloge, uteži, drog za zgibe, zvočnik, senčnik | pajacki, počepi, zgibe; šprint k ograji, tam skačejo |
| 4 | Dirka na televiziji pod šotorom | Nürburg (pred Schwalbenschwanzom) | 6 | paviljon, televizor, kavč, vreča za sedenje, hladilnik, agregat, satelitska antena, kombi, WC kabina | gledajo prenos; stečejo »v živo« k ograji; lenuh ostane na kavču |
| 5 | Hiša ob cesti | Ouninpohja (rumena hiša) | 5 + pes | obstoječa hiša, vrtna ograja, nabiralnik, gredice, perilo, drvarnica, tnalo, klop, trampolin, traktor | cepijo drva, obešajo perilo, otroka na trampolinu; pridejo k vrtni ograji, pes teče ob njej |
| 6 | Oder iz gradbenih odrov | Nürburg (Quiddelbacher Höhe) | 7 | oder v dveh nadstropjih s kavčem, transparenti, zastave, pivska garnitura, WC kabina | sedijo na odru; vstanejo, skačejo, zastava, troblja; spodnja stečeta k ograji |
| 7 | Tribuna z valom | Bathurst (ravnina pred zadnjim zavojem) | skupine 2–10 | montažna tribuna, velik zaslon, zastave, WC kabini | sedijo v skupinah s praznimi sedeži vmes; vstanejo tisti ob tebi, val gre s tabo |
| 8 | Fotografi in TV kamera | Spa (pred Eau Rouge) | 5 | stolp s kamero in dežnikom, medijski kombi s satelitsko anteno, paviljon s prenosnikom | kava, pregled slik; pokleknejo k ograji, objektivi in kamera ti sledijo |
| 9 | Maršali na postaji | Spa (Kemmel) | 4 | koča s številko in lučmi, zastave, gasilna aparata, vreče posipa, štirikolesnik, senčnik | radio, pometanje, poročilo; zastave (rumena ob nesreči, modra), pogled za tabo |
| 10 | Gasilci in reševalci | Spa (pred Blanchimontom) | 5 | gasilsko in reševalno vozilo, cev, aparati, stožci, šotor prve pomoči z nosili | kava, cev, pogovor; vstanejo, palec gor |
| 11 | Vhod: varnostniki, policija, hrana | Spa (ciljna ravnina) | 9 v skupinicah 2–3 | vhod z zapornico, kabina, policijski avto in motor, tovornjak s hrano, visoke mize, WC kabini | pregled torbe, usmerjanje, vrsta za hrano; gledalci s pijačo k ograji, policist pomaha |
| 12 | Mehaniki v boksih | Bathurst (zid boksov) | 7 | stojnica z monitorji ob zidu, tabla za voznika, gume, grelci, voziček, omara z orodjem, skiro | delajo; ko pelješ mimo, tabla čez zid (mesto, krog, razlika), mahajo |

Prizori stojijo na mestih, kjer je ograja blizu ceste in je pred njimi ravnina: iz kamere za avtom, ki gleda strmo navzdol, se prizor vidi le ~50 m naprej, zato morajo ljudje steči, ko si še izven slike, sicer jih nikoli ne vidiš pri delu (v posnetku dirke in TV kamerah se vidi več).

## Že narejeno v igri ob predlogih (želje uporabnika med izdelavo)

- **Živali in elementi po gozdovih glede na državo** (`js/world-zivali.js`, opis v `docs/igra.md`, razdelek Grafika).
- **Avtomobili ob cesti posodobljeni** (`parkedCar` v `js/world.js`).

## Želje po slikah 1–12 (3. 11. 2026) in kaj je narejeno (5. 11. 2026)

Slike so bile: 1 ribiči, 2 seno, 3 čebelarji, 4 balinanje, 5 šah, 6 rojstni dan, 7 štorklje, 8 race in labodi, 9 koale, 10 baribalka, 11 prašiči in kokoši (Rio do Rastro), 12 konji s hlevom (Štajerska). Prizori 3, 9 in 10 ostanejo, kot so. Ko so proge ZDA razen Pikes Peaka postale testne in zamrznjene (odločitev uporabnika 5. 11. 2026), sta odpadla baribalka z mladiči (10, Uncompahgre) in rojstni dan na Big Suru; rojstni dan je v Longfordu. Mesta so iz OSM (API `api.openstreetmap.org/api/0.6/map?bbox=…`, nikoli Google), preverjena z `tools/ljudje/mesta.mjs --preveri` in `tests/ljudje-mesta.test.js`.

- **1, 2, 4 in 5** (»postavi samo tam kjer je tudi v resnici«):
  - Ribiči na bregu pravega jezera, brez lastnega ribnika (`K.lake`: breg toliko metrov za ograjo; trstičje ob bregu, pomol v vodo; do ograje je daleč, zato ostanejo na mestu in mahajo): Medvode, Zbiljsko jezero, 3604 desno (breg 28 m za ograjo); Ouninpohja, jezero ob vasi Ouni (`def.lakes`), 5640 desno (breg 18,5 m).
  - Seno na pravem travniku: Vršič 3464 desno (OSM `landuse=meadow`, trajni travnik), Ouninpohja 1900 levo (njiva iz `def.fields`, ob senenem skednju). Brez pokošene podlage pod prizorom (uporabnik 5. 11.: »zbriši zeleno podlago, ki deluje kot tepih«): redi in bale ležijo na travi travnika. Na Vršiču na tleh prizorov ljudi ni grmov, dreves in skal (`World.peopleGround`).
  - Balinanje in šah nimata mesta: ob nobeni progi ni balinišča ali šahovnice ob cesti (Medvode nič v 400 m, Livorno šahovske mize v parku 200 m od ceste, kamera jih ne vidi). Koda prizorov ostane za pravo mesto, če se pojavi.
- **6** (»… tukaj tudi veliko staršev in še ostali elementi za starše«): trije starši pri svoji mizi pod belim šotorom, pijača (hladilna torba, zaboji), dva starša s skodelicama ob gradu in otroški voziček, avtomobila zadaj; ko pride avto, gre ena mama z otrokoma do ograje, drugi mahajo.
- **7** (»štorklja naj bo samo ena in to na drogu …«): ena štorklja v gnezdu na drogu; ko je avto 55 m blizu, odleti stran od avta in od ceste, nizko nad travnikom, in čez 16 s izgine (`fly`, `flyStep` v `js/world-zivali.js`); brez avta (preizkus sveta) sedi v gnezdu, ob vrnitvi časa (posnetek) spet sedi.
- **8** (»… race postavi v že narejeno vodo«): race, labodi in račja hišica na pravem jezeru ob cesti v Crystal Palace, 1990 desno, na gladini (`float: 10.66`: gladina, spuščena pod cesto, 6. 11. 2026); brez umetnega ribnika.
- **11 in 12** (»… postavi jih tam, kjer so v resnici«): prašiči in kokoši pri kmetiji v Zbiljah (Medvode 2940 desno, kmetijska poslopja 30 m od ceste), konji v ogradi ob skednju kmetije v Ouninpohji (1690 desno, `def.farms`; hlev je pravi skedenj). Na Štajerskem in Rio do Rastro ob cesti ni kmetije (OSM: najbližja 370–700 m od dirkališča, ob Rio do Rastro samo razgledišča), zato tam ni več prizora živali.
- Slike: `node tools/ljudje/igra.mjs <proga> ribici,seno --pri 60,32,14`, `node tools/ljudje/zivali.mjs medvode --let 1,2.5,4` (štorklja po vzletu).
