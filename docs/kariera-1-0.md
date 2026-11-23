# Kariera za 1.0 (načrt)

Odločitev uporabnika 19. 11. 2026 ob 10.35 (prek Mateja, tabla #382, komentar 7005268592): načrt kariere za 1.0 in delitev na 2–4 dele v različnih datotekah za zbirno vejo `kariera-1-0`; vprašanja na strani Odločitve partyslo. V tem koraku ni kode. Fizika vožnje se ne spreminja, testne proge in proge na odločanju so zamrznjene.

## Stanje (19. 11. 2026, zvečer)
- **Odgovori** na `kariera-1` do `kariera-7` še niso prišli. Koda gradi po prvi možnosti vsakega vprašanja (`Kariera.ODLOCITVE` v `js/kariera.js`). Drugo možnost izbere sprememba ene vrednosti; test `tests/kariera-pot.test.js` preveri tudi druge možnosti.
- **A** (logika, `js/kariera.js`, `tests/kariera.test.js`): v zbirni veji `kariera-1-0` (a80900d).
- **B** (igra, osnutek #796, veja `kariera-1-0-b`): igra naloži `js/kariera.js`, ima mostiček `MenuBridge.kariera` / `karieraStart` in vozi pokale poti na pogonu prvenstev, tudi pokale cest in kronometrov. Nagrade poti plača takšne, kot so, in jih pokaže na zaslonu z rezultati.
- **C** (meni, osnutek #797, veja `kariera-1-0-c`): v delu.
- **Testi in D** (osnutek #807, veja `kariera-1-0-testi` na `kariera-1-0-b`): `tests/kariera-pot.test.js` (Node) in `tests/browser/kariera-pot.test.mjs` (igra v brskalniku); šest popravkov v `js/kariera.js`. Dokumenti: `docs/igra.md` (»Prvenstvo«, »Kariera«, cene v »Vozni park«), `tests/README.md`, `docs/kazalo.md`, `README.md`.

## Na kratko
- **Kariera že obstaja** (`docs/igra.md`, »Kariera«): denar, nakup avtov, nadgradnje, obraba, najem, stalni tekmec, prvenstva. Vse proge so odprte, ničesar se ne odklepa.
- **Za 1.0 manjka**:
  - pot skozi pokale na pravih progah (zdajšnja pokala Domači pokal in Kratke proge sta v celoti na testnih progah);
  - odklepanje;
  - cilji po razredih avtov;
  - ekonomija za 55 avtov;
  - zaslon v angleškem meniju;
  - prehod starih shranjenih iger.
- **Delitev v 4 dele v ločenih datotekah**: A logika, B igra, C meni, D dokumenti. Vrstni red je A, nato B in C hkrati, nato D. Vse gre v zbirni veji `kariera-1-0` na `main` v enem koraku.
- **Odgovori** (20. 11. ob 0.15–0.18): pri `kariera-1`–`kariera-4`, `kariera-6` in `kariera-7` možnost 1, pri `kariera-5` možnost 2 (hitreje, vsi avti v ~120 zmagah). Del A je narejen s privzetki (možnost 1 povsod), zato se spremeni samo ekonomija.

## Atlas Career (22. 11. 2026)
Odločitev Mateja 22. 11.: »kariero hitreje, pred Realizem G«, »Atlas Career naj bo v verziji 1.0«.
- **Dolina** (`js/kariera-dolina.js`, `MenuDolina`): 3D zemljevid kariere v meniju, ne kamera dirke (dirka ostane samo s kamero za avtom).
  - Cesta teče skozi gorsko dolino z jezerom; ob njej so zatiči dogodkov in vrata stopenj.
  - Vleka premika pogled vzdolž ceste. Dotik zatiča odpre kartico dogodka (pokonci od spodaj, ležeče z desne).
  - Po dirki dolina pokaže izid (mesto, zvezdice, kovanci), ob novi stopnji še napredek.
  - Meja: do ~25 klicev risanja in ~60 tisoč oglišč (`MenuDolina._R()`); riše samo, ko se kaj premika.
- **Dogodki**: 44 v 5 stopnjah (`VELIKOST` 7, 8, 9, 10, 10). Najprej pokali poti in pokali razredov, preostanek so posamični dogodki po vrsti: dirka, kronometer (samo kjer ima proga medalje), dvoboj. Finale je zadnji.
- **Zvezdice** po najboljšem mestu (`ZVEZDICE`):
  - pokal, pokal razreda in finale: 3, 2, 1 za prva tri mesta;
  - dirka: 3 za 1., 2 za 2.–3., 1 za 4.–6. mesto;
  - dvoboj: 3 za zmago;
  - kronometer: po medalji (zlata 3, srebrna 2, bronasta 1).
- **Odklepanje**: stopnja se odpre z zvezdicami vseh dogodkov. Pragovi so 0, 9, 21, 36 in 54 od 132 (`PRAG`), sorazmerno z največjim številom zvezdic poti. Odprta stopnja ostane odprta (`pot.stopnja`).
- **Darila stopenj** se plačajo od shranjene stopnje naprej (`pot.stopnja`), vsako enkrat; pri nenavadnem shranjenem stanju manjkajoča ob naslednjem dogodku.
- **Pokali razredov** so v stopnjah po ceni najcenejšega avta razreda. Igra poda cene (`KP_CENE` iz `Core.CAREER.car`); brez cen velja vrstni red `RAZRED_RED`.
- **Kovanci** (`kariera-5`, »hitro«):
  - posamični dogodek plača po zvezdicah (stopnja 1: 4.000, 7.000 in 10.000 🪙; stopnja 5: 70.000, 115.000 in 165.000 🪙);
  - boljši izid pozneje plača razliko;
  - pokali, pokali razredov, finale, prve zmage in darila stopenj po tabeli `EKONOMIJA.hitro`.

## Kaj kariera ima zdaj
- **Stanje** (`js/game.js`):
  - `careerLoad`, `careerNew` in `careerSave` (~173) shranijo kariero v `tdgp-career` prek `Shramba.keep`.
  - Polja: `{v: 1, on, money, cars, upg, earned, races, wins}`, poleg njih še `rival`, `rent` in `garage.cars` (deli, barva, stanje).
  - Kariero vklopiš in izklopiš s `careerToggle`. Izklopljena kariera pomeni prosto vožnjo z vsemi avti, brez nagrad.
- **Začetek**: 10.000 🪙 in LEV S (`CAREER.start`, `car0` v `js/core.js` ~9070; 1 🪙 = 1 EUR, odločitev 3. 11.).
- **Avti**:
  - 55 dejavnih avtov stane od 7.500 (MRAVLJA) do 1,4 mio. (ŠKORPIJON H), skupaj ~17,4 mio.
  - Cene so v `CAREER.car`. Deset novejših avtov ima ceno samo v `d.price`.
  - Nakup je v `carBuy`.
  - Najem za eno dirko stane 5 % cene, najmanj 1.000 (`rentOf` v `js/garage.js`).
  - Nadgradnje stanejo 4.000, 7.000 in 12.000 na stopnjo (`CAREER.upg`, `careerUpgPrice`).
  - Avto se po dirki obrabi (`careerWear`, `careerCond`, `careerAfter`).
- **Nagrade** (`Core.careerPrize`, `careerPay`):
  - Dirka: mesto (15.000 za zmago … 750) × dolžina (razdalja / 8 km, od 0,6 do 2,5) × težavnost (0,7–1,8) × faktor avta `careerCarK` = √(cena / 50.000), od 1 do 5.
  - Dodatki v dirki: najhitrejši krog 1.250, najboljši štartni položaj (pole) 2.500.
  - Kronometer: medalja 12.500 / 7.500 / 3.750, sicer osebni rekord 5.000, sicer cilj 1.250.
  - Konec prvenstva: 50.000 / 25.000 / 15.000 × težavnost.
  - Plačajo tudi pobeg policiji in cilji ekipe (`js/zabava/cilji.js`, `js/zabava/lov.js`).
  - Odstop ne plača nič, igra na spletu tudi ne.
- **Stalni tekmec** (`career.rival`) se določi v prvi dirki kariere in šteje po vsaki dirki.
- **Prvenstva** (`CHAMPS` v `js/core.js` ~9042; `openChamp` in `buildChampScreen` v `js/game.js` ~3405):
  - Točkuje se kot v F1. Vozi 20 avtov, pred vsako dirko so kvalifikacije, med dirkami lahko zamenjaš avto.
  - Shramba je `tdgp-champ`, rekordi `records.champ`, dosežka `champ` in `legend`.
  - Pokali:
    - Domači pokal (Jezero, Gora, Riviera) in Kratke proge (Gozd, Toskana, Grom, Monaco) sta v celoti na testnih progah. Zato gresta za NEUPORABNO (`nu`, `nuTrack`).
    - Legende so Bathurst, Spa, Štajerska in Nürburg; Suzuka je testna in izpade.
    - Veliko prvenstvo obsega vse krožne proge (`!timeTrial && !open`), zdaj 24 pravih.
  - Prvenstev na cestah (`open`) zdaj ni.
- **Garaža** (`garaza.html`, `js/garage.js`) ima isto denarnico kot kariera (`fromCareer`, `toCareer`). Preizkusni denar daje `js/denar.js` (`?denar=`).
- **Meni** (`js/menu.js` ~220):
  - Ploščica CAREER odpre »Career · Four ways to play« s karticami garaža, prvenstvo, šola in statistika.
  - Denar pokaže `money()`; stari pokali so pod gumbom NEUPORABNO CUPS.
  - Meni bere vse prek mostička `G` (`G.career()`, `G.champ()` …) in nima `tr()`.
- **Testi**:
  - Node: `tests/champ.test.js`, `fleet`, `grid`, `zrcalni`, `lang`; za pot `tests/kariera.test.js` (A) in `tests/kariera-pot.test.js` (B).
  - Brskalnik: `tests/browser/career.test.mjs`, `champ`, `onchamp`, `denarnica`, `denar`, `garage`, `cars-ui`, `menu`, `zabava`; za pot `tests/browser/kariera-pot.test.mjs` (B).
- **Zastarelo v `docs/igra.md`** (popravil del D, #807):
  - »Prvenstvo« še navaja Legende s Suzuko in Veliko prvenstvo z »dvanajst« progami.
  - »Kariera« še navaja zmago 6.000, naslov 20.000 in avte 5.000–150.000.

## Kaj manjka za 1.0

### 1. Pot skozi pokale (samo prave proge)
Odločeno (`kariera-1` in `kariera-2`, možnost 1): štiri stopnje. Vsaka ima pokal dirkališč in pokal cest, vsak pokal 3–6 dirk.

| Stopnja | Pokali dirkališč (dolžina kroga) | Pokali cest (dolžina) |
|---|---|---|
| 1 · Začetnik | Kildare, Aguascalientes, Sosnová, Kågeröd, Pembrey, Silkeborg (1,1–2,3 km) | Ghoufi, Ujarrás, Cusco, El Jem, Koli (0,6–2 km) |
| 2 · Klub | Hiva, Quezaltepeque, Biķernieki, Lombok, Zandvoort, Montréal, Buriram (3,0–4,5 km) | Isalo, Savusavu, Seul, Portobelo, Ngorongoro, Koror, Mombasa, Isuna, Bâlea, Luanda (2,5–3,5 km; 2 pokala) |
| 3 · Celina | Termas de Río Hondo, Tuzla, Lusail, Sakhir, Sepang (4,8–5,5 km) | Ella, Llogara, Porto Moniz, Rio do Rastro, Tianmen, Killar, Chapman's Peak, Gudauri, Izoard, Sa Calobra, Furka, Kotor, Medeu, Kanaba, Canaries, Santo Antão (3,9–5 km; 3 pokali) |
| 4 · Legende | Legende: Bathurst, Spa, Štajerska, Nürburg (4,3–20,7 km); Dolge proge, po en krog: Livorno, Hakone (19,1 in 26,7 km) in cesta Los Caracoles (10,8 km) | kronometri: Harju, Katu-Jaryk, Pikes Peak, Pikes Peak (makadam); finale: Veliko prvenstvo (`kariera-7`) |

- **Vse proge**: vseh 60 pravih prog je na poti, vsaka vsaj enkrat. Pokal ima največ 6 dirk; ko jih je več, nastane nov pokal iste stopnje.
- **Nove proge**: pokale sestavi pravilo po vrsti proge (krog, cesta, kronometer) in dolžini, ne ročni seznam. Zato do 70 pravih prog vsaka nova prava proga nastopi sama. V `js/kariera.js` je še kratek seznam ročnih izjem (Legende, finale).
- **Testne proge in proge na odločanju** (`nuTrack`) niso nikjer na poti. Harju je na poti, dokler je pravilo »Ena proga na državo« ne prestavi med testne (Koli je že na `main`); pot jo potem izpusti sama.
- **Tekmeci** vozijo kot zdaj. Pokal izbere samo eno od obstoječih težavnosti (`CAREER.diff`).
- **Prvenstvo na cestah** (kvalifikacije, 20 avtov, dirka na vrh) je preveril del B: `tests/browser/kariera-pot.test.mjs` odpelje dirko na cesti (Ghoufi) v pokalu do cilja. Pokal cest ima toliko tekmecev, kot jih sprejme štart proge (`rivN` v `js/game.js`: `d.raceRivals`, `d.rivals`).

### 2. Odklepanje prog in avtov
Odločeno (`kariera-3`, možnost 1):
- V karieri se odklepajo stopnje in njihovi pokali. Naslednja stopnja se odpre, ko je igralec v prvih treh v dveh pokalih trenutne stopnje.
- Avti se samo kupijo, kot zdaj.
- Hitra dirka, prosta vožnja, kronometer in prvenstva zunaj kariere ostanejo vsi odprti. Kariera ne zapre ničesar zunaj sebe.

### 3. Cilji po razredih
Odločeno (`kariera-4`, možnost 1):
- Vsak od 10 razredov (`Core.CATS`) dobi pokal razreda s 3 dirkami. Odpre se, ko ima igralec avto tega razreda.
- Proge razreda so po izbiri: reli in teren na cestah in makadamu, tovornjaki in dirkalni na dirkališčih. Razred z avti ene znamke (`oneMake`: TAIFUN LM, FORMULA ORKAN) vozi z istimi avti (`champField`).
- Vsak razred ima še 3 cilje, na primer zmago, medaljo na kronometru in 100 km.
- Nagrada je denar in znak v statistiki. Skupaj je 30 ciljev.

### 4. Ekonomija in nagrade
- **Zdaj je razpon prevelik.** Simulacija s `Core.careerPrize` (normalna težavnost, 4 km, nakup od najcenejšega, vozi najdražji avto, brez popravil, nadgradenj in bonusov prvenstev) da:

  | Število avtov | Samo zmage | Samo 3. mesta |
  |---|---|---|
  | 5 | 6 dirk | 10 dirk |
  | 20 | 91 dirk | 156 dirk |
  | 40 | 343 dirk | 587 dirk |
  | vseh 55 | 677 dirk | 1.159 dirk |

- **Odločeno** (`kariera-5`, možnost 2, hitreje):
  - Formula dirke, cene avtov, nadgradenj in najema ostanejo.
  - Dodajo se nagrade poti: pokal stopnje (1.–3. mesto, raste s stopnjo), prva zmaga na vsaki progi (enkrat), cilji razredov (enkrat) in darilo ob novi stopnji.
  - Cilj: vsi avti v ~120 zmagah. Pot s pokali razredov ima v simulaciji ~98 zmag, zato igralec večino avtov kupi že na poti; avto naslednje stopnje pride prej kot pri možnosti 1.
  - Del A je uglašen na možnost 1 (282 zmag; avto stopnje po 8, 16 in 29 dirkah). Seja s kodo uglasi `NAGRADE` v `js/kariera.js` (privzetek `ekonomija: 'hitro'`) in razpona v `tests/kariera.test.js` (zdaj 250–300 zmag in 6–18 dirk).
- **Številke uglasi del A s simulacijo v testu** `tests/kariera.test.js`: koliko dirk do prvega boljšega avta, do avta vsake stopnje in do vseh avtov. Test pade, če so števila zunaj dogovorjenih razponov. Nove številke opiše del D v `docs/igra.md`.
- **Brez denarja ostane, kot zdaj**: igra na spletu in odstop.

### 5. Zaslon v `js/menu.js`
- Ploščica CAREER odpre središče kariere. Na vrhu sta denar in stopnja (1–4) z napredkom, pod njima pokali stopnje.
- Pokal je zaklenjen, odprt ali osvojen (najboljše mesto). Pod pokali so cilji razredov (10 vrstic z napredkom), nato obstoječe kartice (garaža, prvenstvo, šola, statistika).
- Velja pokonci in ležeče od 360 × 640, samo v angleščini. Imena pokalov so iz `en` v `js/kariera.js`.
- Meni bere samo prek mostička: `G.kariera()` vrne navaden predmet iz `Kariera.view`, `G.karieraStart(id)` začne pokal.
- Del C deluje tudi brez dela B (če `G.kariera` ni, kartica poti ni prikazana), da gresta B in C hkrati.
- **Najprej odločitev, nato koda**: seja C pred kodo pokaže skico središča na strani Odločitve (grafično vprašanje, pokonci in ležeče); pred `main` uporabnik da »ok« na predogledu s slikami zdaj in potem.

### 6. Shranjene igre
- `tdgp-career` dobi `v: 2` z novim poljem `pot: { stopnja, pokali: { id: najboljše mesto }, cilji: { id: opravljeno }, prve: [id proge] }`.
- Prehod je čista funkcija `Kariera.migrate`, kliče jo `careerLoad`. Stara polja ostanejo, zato garaža (`fromCareer`, `toCareer`) in stari testi delujejo brez sprememb.
- **Izvedba (B)**: na disk gre še `v: 1` s poljem `pot`, da starejša različica igre kariere ne zavrže. `careerLoad` sprejme `v: 1` in `v: 2`; pokvarjeno pot očisti `cistaPot`.
- Stara kariera obdrži denar, avte in nadgradnje; pot se začne v stopnji 1 (`kariera-6`, možnost 1). Shranjeno prvenstvo (`tdgp-champ`) ostane.

### 7. Stari pokali
- Domači pokal in Kratke proge gresta za NEUPORABNO. To že velja (`nu`), koda ostane.
- Legende ostanejo s 4 progami. Veliko prvenstvo ostane v prvenstvih zunaj kariere; v karieri je finale Veliko prvenstvo na izboru 8–10 dirkališč z različnih celin (`kariera-7`, možnost 1).

## Delitev (zbirna veja `kariera-1-0`, na `main` v enem koraku)
Deli so v različnih datotekah, zato se ne prekrivajo. Hkrati tečeta največ 2 seji s kodo (B in C).

| Del | Datoteke | Kaj |
|---|---|---|
| A · Logika | `js/kariera.js` (nova, brez DOM, kot `js/lang.js` za Node in brskalnik), `tests/kariera.test.js` (nov), vpis testa v `tests/run.js` | stopnje in pokali po pravilu iz `TRACKS` (brez `test`, `pending`), odklepanje, cilji razredov, nagrade poti, `view(stanje)`, `migrate(v1)`; test: samo prave proge, vsaka prava proga na poti, nova prava proga pride sama, simulacija ekonomije, prehod v1 → v2, `name` in `en` povsod |
| B · Igra | `js/game.js`, `index.html` (skripta `js/kariera.js`), `js/lang.js` (angleščina novih `tr()`), po potrebi `js/core.js` (`CAREER`, `CHAMPS`), `tests/browser/career.test.mjs` | stanje v2 in prehod, plačila nagrad poti, odklepanje po dirki in pokalu, pokali poti na obstoječem pogonu prvenstev (preveri ceste), mostiček `G.kariera`, `G.karieraStart`; zeleni `career`, `champ`, `onchamp`, `denarnica`, `garage`, `lang` |
| C · Meni | `js/menu.js`, `css/menu.css`, `tests/browser/menu.test.mjs` | središče kariere (točka 5) po potrjeni skici; `node tests/browser/menu.test.mjs`; »ok« na predogledu |
| D · Dokumenti | `docs/igra.md` (»Kariera«, »Prvenstvo«: nove številke in pot), `docs/kazalo.md`, `tests/README.md` | opis po izvedbi; brez kode |

- **Vrstni red**: najprej se A združi v `kariera-1-0`. Nato tečeta B (veja `kariera-1-0-b`) in C (`kariera-1-0-c`) hkrati, vsak na svojih datotekah, in se združita v zbirno vejo. Na koncu pride D.
- **Seje**: A, B in C so seje s kodo z naporom high, D je manjša seja za dokumente; model po pravilu »Model« v `CLAUDE.md`.
- **Pred potiskom** vsak del požene `npm run test:related` in `node tools/stamp.js --check`.
- **Na `main`**: zbirna veja gre v enem koraku po vrstnem redu v `docs/vrsta.md`, ki ga določita uporabnik ali Matej. Cilj je pred zamrznitvijo 23. 12. 2026.

## Omejitve
- Fizika vožnje in vožnja tekmecev se ne spreminjata. Pokal izbira samo med obstoječimi težavnostmi.
- Testne proge in proge na odločanju so zamrznjene in niso na poti. Varovalo `tests/testne-proge.test.js` mora ostati zeleno.
- Ni imen resničnih oseb, znamk, sponzorjev ali prireditev. Pokali imajo opisna imena (npr. »Pokal cest · Klub«).
- Šola, privzeta proga in prvi zagon so ločene teme (»Pred izidom: NEUPORABNO«). Nova mapa in misije ostanejo ustavljeni.

## Vprašanja (stran Odločitve partyslo)
Pri vsakem vprašanju je prva možnost priporočena. Uporabnik je odgovoril 20. 11. ob 0.15–0.18; izbrana možnost je označena z »**izbrano**«.

1. **`kariera-1` · Zgradba poti**
   1. 4 stopnje s pokali na pravih progah; naslednja stopnja se odpre z dvema uvrstitvama v prve tri. **izbrano**
   2. En dolg seznam dogodkov po vrsti.
   3. Vsi pokali so odprti od začetka.
2. **`kariera-2` · Ceste in kronometri**
   1. Vsaka stopnja ima pokal dirkališč in pokal cest; kronometri so v stopnji 4. **izbrano**
   2. Pokali so samo na dirkališčih, ceste pa samostojne dirke, ki plačajo.
   3. Ceste so samo kronometri.
3. **`kariera-3` · Odklepanje**
   1. Odklepajo se samo stopnje in pokali v karieri; avti se kupijo; vse zunaj kariere je odprto. **izbrano**
   2. Kot 1, poleg tega so dražji razredi zaklenjeni do stopnje 2.
   3. Nič se ne odklepa.
4. **`kariera-4` · Cilji razredov**
   1. Pokal razreda in 3 cilji za vsak razred. **izbrano**
   2. Samo pokal razreda.
   3. Brez ciljev razredov.
5. **`kariera-5` · Ekonomija**
   1. Vsi avti v ~250–300 zmagah, z nagradami poti.
   2. Hitreje, ~120 zmag. **izbrano**
   3. Kot zdaj, ~680 zmag.
6. **`kariera-6` · Stare kariere**
   1. Ostanejo denar, avti in nadgradnje; pot se začne v stopnji 1. **izbrano**
   2. Vse od začetka.
   3. Ostane vse, odprte so vse stopnje.
7. **`kariera-7` · Finale**
   1. Veliko prvenstvo v karieri na izboru 8–10 dirkališč z različnih celin. **izbrano**
   2. Vseh 24 dirkališč (do 70 prog več).
   3. Igralec sam izbere 6–12 dirkališč.

## Predaja
- **Stanje 22. 11.**: A, B, C, testi in D (#792, #796, #797, #807) so v zbirni veji `kariera-1-0` na svežem `main`; nanjo gre Atlas Career (dolina, dogodki, zvezdice, kovanci).
- **Atlas 22. 11. (narejeno)**: logika, igra, dolina, meni in testi so v zbirni veji (`js/kariera.js`, `js/game.js`, `js/kariera-dolina.js`, `css/menu.css`, `js/menu.js`, `tests/browser/*.mjs`; Esc zapre dolino), posnetki dolina, dogodek, izid in napredek (pokonci, ležeče) v `docs/kariera/`, izid povezanih testov v PR #792 (osnutek). **Naprej**: »Ready for review« po vrsti v `docs/vrsta.md`, nato seja Združevanje do `main`.
- **Stanje 20. 11.**: odgovori prebrani, načrt popravljen. Del A je na veji (`a80900d`, `js/kariera.js` s testom), narejen s privzetki; ujema se v vsem razen ekonomije (`kariera-5`).
- **Nato** koordinacija partyslo zažene:
  - sejo za B in sejo za C hkrati (`source_url` repozitorija, veja `kariera-1-0`); številke ekonomije ju ne ovirajo;
  - kratko sejo s kodo za popravek A (samo `js/kariera.js` in `tests/kariera.test.js`; ekonomija na ~120 zmag, točka 4) kadar koli pred D, hkrati z B in C samo, če pravilo »Sej s kodo hkrati« v `CLAUDE.md` dovoli več kot 2;
  - na koncu sejo za D.
- **Ko je vse zeleno** in uporabnik da »ok« (seznam PR ob 5.00, za meni predogled), PR vodi do `main` seja Združevanje partyslo.
