# Avti na raven KOLIBRIJA (načrt)

Tema »Posodobitev vseh avtov na raven KOLIBRIJA« (odločitev uporabnika 6. 11. 2026, tabla #382, komentar 6684777565): 32 avtov poleg KOLIBRIJA dobi, kar ima KOLIBRI, ki ga je uporabnik potrdil. Tema je biketravelerjeva do konca; jure.kopac26 od ned. 8. 11. naredi dirkalne, super in tovornjake. Odločitve uporabnika (q10–q12): začni; najprej mali avti; strešni prtljažnik z rezervnim kolesom in kanistri (brez napisov): da. Zbirna veja `avti-kolibri/zbirna`, en osnutek PR #423 (kot deli iz garaže, #247).

## Vzor: KOLIBRI (`js/cars/kolibri.js`, `docs/deli.md`)

- **Mesta za vse dele iz garaže:** `mounts` za 38 elementov (sklop 1: `krilo`, `zarometi`, `platisca`; sklop 2 spredaj `aero`, `hauba`, `maska`, `zmigavci`, `relijske_luci`, zadaj `zadnje_luci`, `auspuh`, `prtljaznik`, `vlecne_kljuke`, `lovilci_blata`, streha `streha`, `stresna_zajemalka`, `antena`, `zaluzije`, bok `ogledala`, `vrata`, `zavore`, `matice`; sklop 3 barve `barva`, `zatemnitev`, `luc_pod_avtom`, `gume`, `crte`, `nalepke`, `soncni_pas`, `zamasek`, `celjusti`, skriti `filter_zraka`, `akumulator`, `turbo`, `cip`, `vzmeti`, `amortizerji`, `stabilizatorji`, `dim_gum`). Polja so opisana v `docs/deli.md` (Dogovor, sklopi 2–3) in na vrhu `js/deli/<skupina>.js`.
- **Ovoji `K.deli(id, serijski, around)`** okrog serijskih delov, ki jih element zamenja (maska, žmigavci, zajemalka na haubi, ogledala, kljuke vrat, zamašek, zadnje luči, vrata prtljažnika, izpuh, antena, akumulator, filter zraka), in prazni ovoji na mestu delov, ki jih serijsko ni (relijske luči, strešno okno, zajemalka, žaluzije, vlečne kljuke, lovilci blata, črte, nalepke, senčni pas). Z delom, v katerem je narisan (`hood`, `trunk`, `bumperF` …), se razbije, odpade in udrti.
- **Razbijanje:** ločeni deli `headL`/`headR`, `tailL`/`tailR`, `spoiler`, `plate`, `wiperFront`, `wiperRear`, `aerial` (`parts.extra`, `partNames`, `parts.over`).
- **Pregled vseh možnosti** (sklop 4): `node tests/deli-pregled.test.js <id>`: nič ne lebdi, nič skozi karoserijo ali v prostoru gume, deli v pravih delih za razbijanje, dva dela hkrati (`K.fitted`), vse hkrati.

## Kaj drugim avtom manjka

- Vsi imajo sklop 1 (`krilo`, `zarometi`, `platisca`, razen kjer avto dela nima) in razbijanje luči, tablice in brisalcev (oktober 2026, `docs/deli.md`, »Drugi avti po kategorijah«).
- **Manjka vsem 32:** 35 elementov sklopov 2 in 3 (mesta, ovoji, pregled). Razbijanje manjka še JASTREBU, PANTERJU in TITANU (luči v ohišjih, poskus sklopa 1): naredi ga seja, ki ima avto.
- Element, ki na avtu ne pride v poštev, v `mounts` ni (garaža ga ne ponudi). Merila: brez strehe (odprti avti, BLISK) ni `streha`, `stresna_zajemalka`, `zaluzije`; brez stekla ni `zatemnitev`, `soncni_pas`, `zaluzije`; brez vrat ni `vrata`; brez serijskega ogledala ni `ogledala`; brez luči (BLISK, BIZON spredaj, STRELICA, MRAVLJA) ni `zarometi`, `zadnje_luci`, `zmigavci`; brez pokrova prtljažnika (pickup, buggy, MIŠKA s priprtim pokrovom motorja zadaj) ni `prtljaznik`; odprta kolesa ni `lovilci_blata` in pragov `aero`. Skriti deli so tam, kjer je motor (zadaj: MIŠKA, SKAKAČ; v sredini: PEŠČENJAK, BIZON …).
- **Ne prenašamo:** KOLIBRIJEVE notranjosti (3A; dokler je avto cel, se ne riše), podrobnosti Visokih (`look.hi`; telefon riše Normalne), fizike (`roof0`, `knockK`, `spinK`) in KOLIBRIJEVEGA serijskega videza (strešni spojler z zavorno lučjo, bela črta): vsak avto ostane svoj.

## Pravila

- Samo to, kar se vidi s kamere za avtom in v garaži. Brez znamk, logotipov in napisov (tudi na kanistrih).
- **Serijski avto ostane trikotnik za trikotnikom enak** (`tests/kit.test.js`, `tests/fleet.test.js`, `tests/browser/fleet.test.mjs`), razen strešnega prtljažnika spodaj. Meje dogovora (točka 6): del do +300 trikotnikov telesa, kolo do 600 (Visoki 850), vsi trije deli na kolesu do 800 (1150); scena v mejah `tests/golden/perf.json`. Deli ima samo igralčev avto, zato se obremenitev drugih prog ne spremeni.
- **Strešni prtljažnik z rezervnim kolesom in dvema kanistroma** (serijski, brez napisov, svoj del `roofRack`, odpade kot MEDVEDOV): MIŠKA (mali, prvi) in SKAKAČ (teren); MEDVED ga že ima (nosilec z ročkami in kanistroma), PEŠČENJAK ima rezervni kolesi za kabino. Avto s prtljažnikom nima `streha` in `stresna_zajemalka`; obremenitev: lasten `look.budget.outer` največ +200 trikotnikov in perf v mejah. Slike gredo uporabniku s prvo skupino (stran Odločitve), da potrdi ali izbere drug avto.
- Dogovor (`car.deli`, `mounts`, `K.deli`, `DELI`, `js/deli/*.js`) se spremeni samo, ko drugače ne gre: zapis v »Spremembe dogovora« v `docs/deli.md`, sprememba najprej v zbirno vejo in sporočilo drugi seji. Enako za skupna orodja in teste (`tests/deli-pregled.test.js`, `tests/run.js`, `tools/`). KOLIBRIJA ta tema ne spreminja; izjema so popravki skupnih graditeljev, ki jih pokaže pregled drugega avta (seznam spodaj v »Predaja«).

## Kdo dela kaj

| Kdo | Skupina (veja `avti-kolibri/<skupina>`) | Avti (`js/cars/<id>.js`) |
|---|---|---|
| Seja 1 (biketraveler, session_01UuPU9Ah6jMAt55UHLu6o45) | `mali` | `levk` LEV KABRIO, `levs` LEV S, `miska` MIŠKA, `raketa` RAKETA 16V |
| Seja 1, nato nova seja po predaji | `klasika` | `blisk` BLISK 30, `gad` GAD 7L, `jastreb` JASTREB 6 (+ razbijanje) |
| Seja 1, nato nova seja po predaji | `teren` | `gozdar` GOZDAR, `hrosc` SKAKAČ 1600, `medved` MEDVED 4x4, `pescenjak` PEŠČENJAK |
| Seja 2 (biketraveler) | `reli`, `elektricni` | `lev` LEV R, `zmaj` ZMAJ 85, `jezek` JEŽEK E |
| Seja 2, nato nove seje | `sportni`, `posebni` | `jelen`, `lisica`, `panter` (+ razbijanje), `sokol`; `goljat`, `predsednik`, `superkombi` |
| jure.kopac26 od ned. 8. 11. | `dirkalni`, `super`, `tovornjaki` | `bizon`, `kozorog`, `mravlja`, `strelica`, `tiger`, `tornado`; `modras`, `perun`, `skorpijon`; `kamen`, `titan` (TITAN šele po #304, + razbijanje) |

Istih avtov ne delata dve seji. Novi avti iz #361 in #396 niso med 32 (niso na `main`); na raven KOLIBRIJA jih pripelje njihov lastnik po dogovoru, ko so na `main`. Veja skupine se spoji v zbirno vejo (fetch, merge, push; nikoli force push), ko so povezani testi lokalno zeleni. Po vsaki skupini nova seja s predajo spodaj (izjema dveh sej z avti poleg Dreves A velja do pon. 9. 11. ob 0.00, nato največ 2 seji s kodo).

## Postopek na avto

1. Mesta po skupinah elementov v vrstnem redu KOLIBRIJA (spredaj, zadaj, streha, bok, barve, skriti), mere iz avtovega `look` (`secs`, odbijača, kolesa); vsaka skupina pod svojo vrstico v `mounts` kot pri KOLIBRIJU.
2. Ovoji `K.deli` okrog serijskih delov (serijski del ostane enak) in prazni ovoji na mestih brez serijskega dela, v pravem delu za razbijanje.
3. Testi: `node tests/kit.test.js`, `node tests/deli.test.js`, `node tests/fleet.test.js`, `node tests/deli-pregled.test.js <id>`, `node tests/deli-barve.test.js` (beri vrstice OK/FAIL), na koncu `npm run test:related` in `node tools/stamp.js --check`. Brskalniški nabori vozil tečejo na GitHubu.
4. Lasten pregled: `node tools/deli-plosca.mjs <elementi> --car <id> --ns 1,6,11,16 --compact` (garaža) in kamera za avtom.
5. Zapis v `docs/deli.md` (razdelek kategorije: kaj ima avto, kaj ne in zakaj) in v predajo spodaj.

## Preverjanje

- Sliki pred in po s kamere za avtom na Spa, Belgija (prava proga z boksi; Bathurst je še na izbiri): pred je avto z deli sklopa 1, po z izborom novih delov (kit, haube, luči, ogledala, črte, nalepke), 1–2 pogleda na avto, do ~300 KB; garaža s ploščo `tools/deli-plosca.mjs`. Slike prve skupine gredo na stran Odločitve (biketraveler) kot vprašanje s slikami (`docs/vprasanja.md`); do odgovora videz sledi KOLIBRIJU.
- Polna dirka na Spa v mejah `tests/golden/perf.json` (`maxCalls`, `maxKverts`; `tests/browser/perf.test.mjs` na GitHubu, lokalno `node tools/obremenitev.mjs spa`), z avtom z deli in z avtom s strešnim prtljažnikom.
- Zbirni PR: celotni nabori (Node, brskalniški, vozila) na GitHubu, ko je med prvima dvema v vrsti (`docs/vrsta.md`, osnutek do vrste).

## Spori

- #297 (garaža, biketraveler): `docs/deli.md`, `js/render.js`, `js/core.js`, `tests/fleet.test.js`, `tests/deli-barve.test.js`; avtov ne spreminja. Zbirni PR gre za njim.
- #304 in #322 (TITAN s cisterno, zrcalni vlak, jure.kopac26): `js/cars/titan.js`, `js/render.js`, `js/core.js`, `tests/fleet.test.js`. TITAN šele po #304.
- #361 in #396 (novi avti, partyslo): nove datoteke v `js/cars/`, `js/render.js`, `js/deli/barve.js` (luč pod avtom ob srednji osi), `tests/kit.test.js`, `tests/fleet.test.js`: v seznamih obdrži vrstice obeh.
- Kdor gre na `main` drugi, spor razreši; dogovor gre na tablo #382 in v `docs/vrsta.md` (Usklajevanje med računi). Zbirni PR je v vrsti za temi PR.

## Predaja

| Skupina | Stanje | Kaj sledi |
|---|---|---|
| mali | v delu (Seja 1, 6. 11.) | MIŠKA, RAKETA, LEV S, LEV KABRIO; slike na stran Odločitve |
| klasika | čaka | nova seja po mali |
| teren | čaka | nova seja po klasiki |
| reli, električni | končano (Seja 2, 6. 11.): LEV R in ZMAJ 85 po 36, JEŽEK E 33 od 38 elementov, pregled delov 15/15, opis v `docs/deli.md` | športni |
| športni | v delu (nova seja po Seji 2, veja `avti-kolibri/sportni`) | JELEN GT, LISICA, PANTER 6 (z razbijanjem), SOKOL R; nato posebni (GOLJAT, PREDSEDNIK, SUPERKOMBI) |
| dirkalni, super, tovornjaki | čaka (jure.kopac26 od ned. 8. 11.) | TITAN po #304 |

Skupne spremembe v zbirni veji (Seja 1, 6. 11.):
- `tests/deli-pregled.test.js <id>` za vsak avto: dovoljeni deli za razbijanje so KOLIBRIJEVI in tisti, ki jih imenujejo avtovi `mounts` (`part`, `parts`, `hosts`, `partF`, `partR`); obvezni so iz `mounts`, če jih ima (sicer KOLIBRIJEVI); pari, ki se križajo, so obvezni samo na KOLIBRIJU; avto brez `look.hi` nima Visokih. Stanje s sklopom 1 (6. 11.): zeleni vsi avti Seje 1 in Seje 2 razen SKAKAČA (krilo 3 in 4 lebdita 5 cm nad avtom: skupina teren).
- `js/deli.js`, krilo 2 (račji rep): zavorna lučka na ploskvi repa (prej na vrhu izbočene strehe, na LEV S in MIŠKI 2 cm nad repom); na KOLIBRIJU 9 mm nižje, v celoti na ploskvi.
- Pregled: skriti deli v prostoru motorja štejejo za zaprte tudi s ploskvami notranjega bloka, v vseh smereh (avto brez oblog motornega prostora: LEV S; s podnico v notranjem bloku: LEV R, Seja 2); dela obeh sej pri delih razbijanja sta združena (Seja 2: imena iz mest, Seja 1: obvezni deli iz mest).
- Nova polja mest in pomočniki (`docs/deli.md`, »Spremembe dogovora«, 6. 11.): `hauba.bulge`, `auspuh.drum`, `auspuh.valve`, `antena.whip`, `akumulator.back`; streha in strešna zajemalka v delu strehe; `DELI.tips`, `DELI.centreCut` (difuzor z režo pri sredinskem izpuhu, zadnja robova pred koncema cevi).
- Drugi del za MIŠKO (`docs/deli.md`, »Spremembe dogovora«): `vlecne_kljuke.underLamps` z `DELI.noseLamps`, `vrata.netIn`, `turbo.twin`; zadnja vlečna točka zunaj konca dvojnega izpuha ostane na mestu. `tools/shot.mjs --avto <id>`: slika proge z izbranim avtom (kot `avto=` v hitrem vstopu). Nasvet: seznami napak v pregledu so skrajšani na prve 4 (`.slice(0, 4)`), zato se po popravku pokažejo naslednji; za cel seznam poženi kopijo testa z daljšim `.slice`. Nalepke, proge in mreže sledijo analitičnim prerezom (`prop(x, 'w')`): na izbočenem telesu in vdrtem steklu (MIŠKA) so lahko do nekaj cm stran od prave ploskve, zato meje odsekov (`crte.x`, `soncni_pas.x`) postavi na prereze lofta in preveri razdalje.
- Za RAKETO (`docs/deli.md`, »Spremembe dogovora«): `prtljaznik.face` (pokrov na pokončni plošči repa), `auspuh.pipe` (cevi pod višjim podom), `vlecne_kljuke.underPod` z `DELI.podLamps` (s ploščo luči 13–16 brez sprednje vlečne točke).
- Kako izmeriti mesta (za naslednje avte): `aero` xf, w, yf = zadnji prerez spredaj (x, w, yb), xr, yr = prvi zadaj, `sill` = konca lokov, `exh` = [z, r] serijske cevi; `hauba` x0 = rob pred steklom, x1 = pred padcem čela, w manj od najmanjšega `wt`; `zadnje_luci` `shape` je prostor v metrih okrog `zc`, `yc` (možnosti so risane za KOLIBRIJEV prostor 0,14 × 0,3, `s` pomanjša okrogle); `prtljaznik.glass` je vznožje zadnjega stekla; `vrata.win` v koordinatah pasu (t = 1 rob vetrobranskega stekla, na zasukanem pasu med oddaljenima prerezoma sprednji rob poševno nazaj); skriti deli se dotikajo motorja ali dna (`akumulator` y = dno; na tleh, ki padajo naprej, `back`: x je zadnji rob), ne stojijo ob loku, ki je pod oblogo kolesa odprt (žarki vstran uidejo), zunaj dosega zasukanega kolesa (orodje: pnevmatika ±0,66 rad).
- Nasveti Seje 2 (reli, električni): vsak šiv lofta (prerez, tudi ob lokih koles in na prehodu stekla v pločevino) razreže nalepko, ki ga prečka, zato so plameni (`nalepke` 6 na haubi, 9 na vratih) najtežji: razpone `nalepke.side` in `hood.x` končaj pred šivi in preštej trikotnike (`Render.kitInfo(id, { nalepke: n })` proti serijskemu, meja 300). Manjši `akumulator` obdrži zunanjo stranico in dno, zato potrebuje oporo pri vseh velikostih: `back: true` z zadnjo ploskvijo ob sprednji strani motorja ali sredi (`z: 0`, manjša se skrči proti sredini) na ravnem vrhu. Na stekleni strehi plavuti, biči in ploščice `antena` (do 0,36 m pred `fin`) sekajo robove stekla: `fin: [x, z]` na lakirani letvi ob steklu. `vlecne_kljuke` visijo do 7 cm pod `y` in segajo 7 cm naprej: stran od vrha `aero` in od letve `relijske_luci` pred nosom (`nose` y − 0,11). `prtljaznik.glass` samo pri ravnem zadnjem steklu; steklo, ki se zaokroži v streho, ga izpusti. Sliki pred in po: dirka delov iz garaže še ne prenese na avto (`playerDeli`), zato po hitrem vstopu v strani nastavi `R.player.deli` in pokliči `Render.attachRace(R)`; kamera za avtom je visoko, zato `Render.snapshot(P, 'chase', 2560)` in izrez okrog avta.
