# Bâlea, Romunija (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `balea` (`js/tracks/balea.js`)

Severna stran ceste Transfăgărășan (DN7C) v gorovju Făgăraș, njen zadnji del po ledeniški dolini Bâlea do jezera Bâlea v krnici pod glavnim grebenom, v pravem merilu. Proga se začne na ravnem kraku za 2. serpentino (~1.802 m; od 15. 11. 2026, prej na kraku nad dolino, 1.768 m), gre skozi štiri široke serpentine (vse zavijejo za ~170–190°) in se konča ob ledeniškem jezeru Bâlea (2.034 m, 45,6042° S, 24,6137° V): 3,53 km in ~232 m vzpona (prej 4,03 km). Za ciljem cesta pelje še ~190 m mimo stojnic in koč do severnega portala predora pod grebenom, kjer se v igri konča. Kartica proge je ena, na njej pa je stikalo **Dirka / Kronometer / Promet / Policija** (kot na Beartoothu):

- **Dirka**: 21 tekmecev (v meniju *Opponents* od 0 do največ 95: za ciljem je premalo ceste, pri 99 bi parkirane formule stale druga na drugi; `maxRivals`), start na ravnem kraku za 2. serpentino (štartna mreža za črto), en vzpon do jezera. Pod mestom so prevoženi kilometri in nadmorska višina, po cilju vsak avto zapelje na svoje mesto ob cesti (pred portalom predora). Kvalifikacij ni (odprta cesta), v karieri je nagrada kot za dirko na 3,5 km.
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica najboljših 10, duh in medalje (zlata 1:51, srebrna 1:57, bronasta 2:06, v dežju 2:15 / 2:21 / 2:32; zlato je čas relijskega avta na avtopilotu, kot na Vršiču).
- **Promet**: dvoboj z enim tekmecem po odprti cesti, po kateri poleti vozijo predvsem turisti: avtomobili in kombiji, zelo veliko motoristov, kak avtobus, tovornjakov skoraj ni; ob cesti so kolesarji.
- **Policija**: beg pred policijo do jezera (kot na Beartoothu: pregon se začne že na štartu, pobegneš čez cilj). Patrulje imajo ob bokih generičen napis POLICE (brez imena ali znaka katere koli službe), v rezultatih pobega piše »Do jezera v …«.
- **Serpentine**: na pravi cesti niso oštevilčene; igra jih šteje od spodaj (Serpentina 1–6). 90 m pred vsako stoji opozorilni trikotnik z zavito puščico in številko serpentine, na zunanji strani serpentine table z belimi puščicami na rdečem. Pod uro se izpišejo z višino (Serpentina 3 · 1.823 m … Serpentina 6 · 1.984 m; prvi dve sta pred startom), še dolina (Valea Bâlii) in jezero na cilju (Lacul Bâlea · 2.034 m); komentator ima na tej progi svoje stavke ob startu, ob cilju in ob pobegu.
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (zglajena, najožja serpentina ima polmer ~10 m, kot v resnici). OpenStreetMap nima podatka o širini ceste; v igri je cesta široka 11 m (prava dvopasovnica je široka ~7 m), da je prostora za 22 avtov. Višine so iz višinskega modela Copernicus DEM GLO-30, očiščene (drseča mediana, monotono navzgor, glajenje): vzpon je na krakih med serpentinami (do 11 %), serpentine so položnejše.

Okolica (gradi jo skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.balea`; teren s pomožnimi funkcijami Vršiča in Los Caracoles):

- **Gora poleti**: jasno popoldne, sonce z jugozahoda. Pobočja ledeniške doline so alpski pašniki s šopi trave (zibljejo se v vetru) in nizkim cvetjem, v zaplatah ruševje in brin (raba tal iz ESA WorldCover, satelitskih posnetkov Sentinel-2 in karte višin krošenj: grmovje pod 3,5 m je ruševje). Sivo-rjav kristalinski skrilavec v pečinah, ploščah in balvanih, melišča pod stenami (golo tla po Sentinel-2), staro snežišče v senčnih žlebovih nad ~2.120 m. Barve tal so iz satelitskega posnetka Sentinel-2 (26. 7. 2025), s senčenjem terena ob času posnetka odstranjenim.
- **Jezero**: ledeniško jezero Bâlea (obris iz OpenStreetMap, ~4,9 ha), modrozeleno, ob obali svetlejše; koče in stojnice ob cesti pri jezeru (obrisi iz OpenStreetMap, brez imen in napisov), na parkirišču za ciljem avtomobili in ljudje.
- **Žičnica**: vrv iz doline Bâlea Cascadă do jezera (potek, stebri in postaji iz OpenStreetMap): jekleni stebri, dve vrvi s povesom in kabina; nad cesto (asfalt in 2 m ob njem) sta vrvi vsaj 7 m visoko, zato je zadnji steber pred zgornjo postajo visok 34 m, postaja pa 12 m (8. 11. 2026, #526).
- **Predor**: za ciljem se cesta konča pri severnem portalu predora pod grebenom (betonski portal s temnim ustjem, nad njim skala).
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m): greben Făgăraș s krnicami, dolina proti severu; pašniki, ruševje in skale po višini in naklonu, sneg v visokih žlebovih.
- **Cesta**: bela prekinjena sredinska črta (v serpentinah neprekinjena), bele robne črte, jeklene varnostne ograje, kjer teren pada, in na zunanji strani ovinkov, kamniti podporni zidovi (zidan skrilavec), beli smerni stebrički; omejitev 40 km/h na startu; nobenih imen podjetij ali znakov služb.
- **Zidovi med kraki serpentin**: cesta v igri je širša od prave, zato so si kraki ob serpentinah bližje kot v resnici (med ograjama le nekaj metrov za 10–25 m višine). Tam stoji pod robom zgornjega kraka visok kamnit podporni zid (rahlo nagnjen, 1 : 20), ki sega do police ob spodnjem kraku; teren med njima je poravnan na višino spodnje ceste. Prej je bila tam temna gola stena nad nazobčanim terenom.
- **Dirka**: start z lučmi pod portalom START, modri portali kontrolnih točk z višino, cilj FINISH z rjavo tablo LACUL BÂLEA in višino, transparent TRANSFĂGĂRĂȘAN (samo zemljepisna imena), pisane zastavice ob štartni vrsti, gledalci ob startu, cilju, kontrolnih točkah in serpentinah.
- **Živali**: trije tropi ovc s pastirjem na pašnikih ob cesti.
- **Fotografije**: Wikimedia Commons in Mapillary iz okolja seje nista bila dosegljiva (omrežje), zato je videz (sivi skrilavec, zidani podporni zidovi, ograje, pašniki) narejen po podatkih (OpenStreetMap, Sentinel-2) in splošnem poznavanju kraja, brez primerjave s fotografijami z istih mest.
- **Približki**: drevesa, ruševje, rastline, skale, snežišča, ovce in gledalci so razporejeni po rabi tal, višini in naklonu, ne po resničnih legah. Koče so generične (kamnito pritličje, lesen zgornji del, strma pločevinasta streha), stojnice lesene s ponjavo.
- **Pravno**: cesta je znana iz televizije; v igri in opisih ni nobene omembe oddaje ali njenih voditeljev. Samo zemljepisna imena (Bâlea, Transfăgărășan, Făgăraș, Valea Bâlii, Lacul Bâlea).

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py balea --zapisi`, nastavitve v `tools/proga/proge.json`, opis v `tools/proga/README.md`). Vire glej v `README.md` pod »Zasluge«.

## Realizem G: rastje po meritvah

Paket G (`docs/realizem.md`, »G«; `docs/realizem/paket-g.md`) samo na Bâlei (Matejeva odločitev 15. 11. 2026 ob 15.45, točka 2b, in ob 19.00). Trava, ruševje in listje dobijo odtenek izmerjene pokrovnosti; nobena rastlina ni dodana ali premaknjena.

**Meritev** (ESA WorldCover 2021 in mozaik Sentinel-2 2021, pas 8–60 m od roba ceste, 12961 celic po 10 m; barve so mediane celic od 15 m naprej):

| razred | delež | barva |
|---|---|---|
| trava (planinski pašniki) | 88,9 % | `#4f5b4d` |
| drevesa (smreka, ruševje) | 4,7 % | `#353e37` |
| pozidano (koče, parkirišče) | 2,6 % | `#737169` |
| golo (skala, melišče) | 1,7 % | `#6f6f68` |
| mah in lišaji | 1,6 % | `#5e6158` |
| voda | 0,4 % | – |

**Okvir:** težišče vodnih celic WorldCover je pri x −87, z 900 m od starta, na jezeru Bâlea v igri, zato je okvir pravilen brez zamika.

**Podnebje:** `ET` (alpska tundra nad gozdno mejo, cesta je večinoma nad 1500 m). To je ocena po višini, ne podatek iz karte Köppen-Geiger. Ker `ET` v `World.rastje.PODNEBJA` nima dreves, ima vnos svoje vrste: smreka, ruševje, brin.

**V igri** (`js/world-prelaz.js`, en ločen blok; graditelj prelazov uporablja samo Bâlea):
- Tla: množilnik ×0,98/1,00/1,09 (moč 0,35, svetlost ostane). Velja samo za travo in preproge ruševja v barvi terena, ne za tla ob kočah, melišča, skalo ali sneg. Enak množilnik dobijo zelena oglišča šopov trave.
- Listje: ×1,12/0,97/1,14 na zelenih ogliščih smrek in ruševja (`World.rastje.listje`).
- Trava je malo manj rumena, modri kanal je v povprečju +3 do +5 (od 255). Cvetje, skale, kamni, daljni teren in cesta ostanejo enaki.

**Obremenitev** je prej in potem enaka: 156 klicev na sliko (največ 187) in 362 tisoč oglišč (največ 436 tisoč). Število mrež, oglišč in primerkov v referenci sveta je enako (1300 / 652011 / 31948); spremenil se je samo prstni odtis barv.

**Ostane:** stavbe iz #699 sprememba ne zadeva (samo barve, nobene nove postavitve). Vrstico Bâlea v »Zaslugah« (`README.md`, Realizem G) doda seja, ki ureja skupne datoteke.
