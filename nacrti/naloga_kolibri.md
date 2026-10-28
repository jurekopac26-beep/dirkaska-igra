# Naloga za drugi račun: deli za KOLIBRIJA (in kasneje za ostale avte)

Napisano 28. 10. 2026 v seji z garažo. Ta seja dela garažo (veja `claude/3d-garage-cars-sum9uk`), ti delaš **avto stran**: vse različice delov, ki jih igralec lahko kupi in namesti. Ko sta obe stvari gotovi, ju garaža priklopi po dogovoru spodaj. Zato se dogovora drži natančno; če ga moraš spremeniti, to zapiši v razdelek »Spremembe dogovora« na koncu te datoteke na svoji veji in povej uporabniku.

## 1. Preden začneš
- Delaj na **novi veji iz `main`**, npr. `claude/kolibri-deli` (`git fetch origin main && git checkout -b claude/kolibri-deli origin/main`).
- Preberi `CLAUDE.md` na `main` (pravila igre: pravna varnost, kameri `iso` in `chase`, obremenitev telefona, `node tools/stamp.js`, testi, prevodi v `js/lang.js`, PR samo na izrecno prošnjo).
- Iz veje z garažo preberi (ne spreminjaj):
  `git fetch origin claude/3d-garage-cars-sum9uk` in nato `git show origin/claude/3d-garage-cars-sum9uk:nacrti/<pot>`:
  - `nacrti/cene/cene.json`: 39 elementov × 16 možnosti (in servis) (imena SI/EN, cena, kaj nudi, `na_regalu`). **To je seznam, ki ga narediš.** Kopiraj ga na svojo vejo kot `js/data/deli.json` (ali kot JS v `js/cars/_deli.js`), da sta meni garaže in tvoji deli isti seznam.
  - `nacrti/odlocitve.md`: odločitve uporabnika (videz delov, barve, gume po straneh …).
  - `nacrti/plosce/` (npr. `an_*`, `pr`, `el_*`, `koncne/01_karoserija.jpg … 16_luc_pod_avtom.jpg`): kako so deli videti na slikah garaže.
- **Ne spreminjaj** datotek garaže: `garaza.html`, `js/garage3d.js`, `css/garage.css`, `tests/browser/garage.test.mjs`, mapa `nacrti/`. Garaža ne bo spreminjala tvojih datotek. Tako pri združitvi ni sporov.
- Uporabnik: odgovarjaj v slovenščini, kratko. Pred kodo vprašaj, ali želi najprej slike (pri garaži je delal najprej samo slike, dokler ni napisal »začni«). Varčuj: malo slik; po vsakem elementu ena plošča s 16 različicami na KOLIBRIJU (pogled `iso` in `chase`). Če kaj ne veš, vprašaj v sliki.
- Napisi na delih v britanski angleščini, samo generični ali izmišljeni (brez znamk, logotipov, podjetij).

## 2. Dogovor o priklopu (garaža računa natančno na to)
1. **Kaj je nameščeno:** avto (`car` v `makeCarMesh(car, opts)` in v fiziki) dobi polje `car.deli = { <id elementa>: <številka možnosti 1..16>, ... }`. Element, ki ga ni v `car.deli`, je **serijski** (avto je narisan točno kot danes). Id elementov so ključi iz `cene.json` (`krilo`, `aero`, `platisca`, `gume`, `zarometi`, `zadnje_luci`, `hauba`, `maska`, `auspuh`, `ogledala`, `vrata`, `prtljaznik`, `streha`, `relijske_luci`, `antena`, `vlecne_kljuke`, `lovilci_blata`, `stresna_zajemalka`, `zaluzije`, `zmigavci`, `zavore`, `matice`, `celjusti`, `luc_pod_avtom`, `nalepke`, `crte`, `stevilke`, `soncni_pas`, `zatemnitev`, `barva`, `filter_zraka`, `cip`, `turbo`, `akumulator`, `vzmeti`, `amortizerji`, `stabilizatorji`, `hupa`, `dim_gum`). Številka možnosti = mesto v `cene.json` od najcenejše (1) do najdražje (16). Barva karoserije ostane v `car.color` kot danes; `deli.barva` je samo izvedba (mat, kovinska, biserna …).
2. **Kam se del pritrdi:** vsak avto dobi v svojem `js/cars/<id>.js` polje `mounts: { <id elementa>: { x, y, z, w, h, d, ... } }` (v merilu avta, kot ostale mere v datoteki), kjer pove, kje je mesto za del in koliko prostora ima. Za KOLIBRIJA najprej; za ostale avte kasneje.
3. **Kdo nariše del:** ena skupna datoteka (predlog `js/cars/_deli.js`, naložena pred avti), ki za vsak element zna narisati vseh 16 oblik: `DELI.build(K, id, n, mount, car)` znotraj avtovega `build(K)`, pod **istim imenom dela** kot serijski (`K.part('spoiler', …)`, `headL`, `headR`, `tailL`, `tailR`, `hood`, `bumperF`, `bumperR`, `aerial`, `plate` …), da se nov del razbije, odpade in udrti točno tako kot serijski. Avtov `build(K)` za vsak element pokliče npr. `K.deli(id, () => <serijski del kot danes>)`: če je element v `car.deli`, nariše različico, sicer serijski del.
4. **Del posebej** (za garažo: prosojen predogled na avtu in sličice v meniju): `DELI.mesh(id, n, M)` vrne `THREE.Group` samo tega dela, postavljen na njegovo mesto na avtu `M` (enake koordinate kot na avtu), brez ostalega avta.
5. **Učinek:** `DELI.effect(id, n)` vrne spremembe lastnosti (moč, oprijem, teža, zaviranje, hitrost, višina avta …) iz vrstice `kaj_nudi` v `cene.json`, v številkah. Fiziko na to priklopi ti, z eno funkcijo v `core.js` (npr. `Core.applyDeli(car)`), ki jo pokliče priprava avta; ostalo v `core.js` pusti.
6. **Skriti deli** (`filter_zraka`, `cip`, `turbo`, `akumulator`, `vzmeti`, `amortizerji`, `stabilizatorji`, `hupa`, `dim_gum`): `DELI.mesh` nariše del, kot bi bil viden pod prosojno haubo ali v kolesnem loku; na avtu se pokaže samo učinek (nižji avto pri vzmeteh, barva dima, zvok hupe).
7. **Telefon:** na avtu je vedno narisan samo nameščen del (ne vseh 16). Nobena različica ne sme dvigniti avta čez meje v `tests/golden/perf.json`; različice so preproste (en material, malo oglišč), kot serijski deli.

## 3. Vrstni red dela za KOLIBRIJA (ocena skupaj približno 150 ur)
1. Okostje dogovora: `car.deli`, `mounts` za KOLIBRIJA, `_deli.js` s `K.deli`, `DELI.mesh`, `DELI.effect`; test, da je KOLIBRI brez `car.deli` **enak kot prej** (zlate reference) (~8 ur).
2. Vidni 3D deli, po elementih, vsak s 16 oblikami (~82 ur): `krilo` (strešni spojler in zadnja krila), `platisca`, `aero`, `zarometi`, `zadnje_luci`, `hauba`, `maska`, `auspuh`, `prtljaznik`, `zavore`, `antena`, `vlecne_kljuke`, `lovilci_blata`, `stresna_zajemalka`, `ogledala`, `vrata`, `streha`, `relijske_luci`, `zaluzije`, `zmigavci`, `matice`. Po vsakem elementu plošča za uporabnika.
3. Barve in nalepke (~20 ur): `barva`, `crte`, `stevilke`, `nalepke`, `gume` (vzorec, bok), `soncni_pas`, `zatemnitev`, `luc_pod_avtom`, `celjusti`.
4. Skriti deli in učinki (~14 ur).
5. Razbijanje novih delov kot serijskih (~8 ur): vsak žaromet, luč, spojler, antena in tablica se razbije ali odpade kot pri serijskem KOLIBRIJU.
6. Prilagoditev in pregled vseh 624 možnosti na KOLIBRIJU (nič ne gre skozi karoserijo, nič ne lebdi) (~14 ur).
7. Preprosta stran za ogled (npr. `maketa-delov/index.html`, ne v meniju igre): KOLIBRI na vrtljivi plošči, izbira elementa in možnosti (~6 ur).
8. Testi (`tests/…`: vseh 624 se zgradi brez napake, števila oglišč, razbijanje) in `node tools/stamp.js`, `npm run golden:update` po potrebi, `npm run test:node`, brskalniški testi (~6 ur). Commit in push na svojo vejo; PR samo, če ga uporabnik izrecno prosi.

## 3a. Vrstni red: najprej KOLIBRI, nato ostali (priporočilo)
- Najprej cel KOLIBRI (vzorec za vse): uporabnik vidi in potrdi videz vsakega elementa enkrat, ne 33-krat; dogovor iz razdelka 2 se preizkusi na enem avtu; garaža lahko KOLIBRIJA priklopi in preizkusi od začetka do konca.
- **Zgodnji preizkus:** ko so na KOLIBRIJU gotovi prvi trije elementi (`krilo`, `platisca`, `zarometi`), jih poskusno namesti še na tri zelo različne avte (en športni, en klasični, formula ali tovornjak), da se vidi, ali `mounts` in `DELI.build` delujeta tudi tam (~6 ur). Če ne, popravi dogovor zdaj, ne po 33 avtih.
- Nato ostali avti **po kategorijah** (najprej Mali avti, ker so si oblike podobne), in pri vsakem avtu hkrati razbijanje na ravni KOLIBRIJA in `mounts` (en obisk datoteke avta namesto dveh).
- **Štirje sklopi** (po vsakem ena skupna plošča za uporabnika in njegova potrditev, preden nadaljuješ):
  1. okostje dogovora + `krilo`, `platisca`, `zarometi` + poskus na treh drugih avtih;
  2. ostali vidni 3D deli;
  3. barve in nalepke, skriti deli, razbijanje novih delov;
  4. pregled vseh 624 možnosti, stran za ogled, testi, push na svojo vejo.
- Če uporabnik želi boljše razbijanje ostalih avtov **prej**, kot so gotovi deli za garažo: razbijanje delaj že po dogovoru iz razdelka 2 (deli z imeni `headL`, `headR`, `tailL`, `tailR`, `spoiler`, `aerial`, `plate` …, in hkrati zapiši `mounts` za ta avto), da kasnejši prehod za garažo samo preveri možnosti in ne predeluje avta drugič.

## 4. Kasneje: ostali avti
- **Razbijanje na ravni KOLIBRIJA** za ostalih 32 avtov (ločeni žarometi in zadnje luči, ki se razbijejo, spojler, antena, tablica, brisalci, ugrezanje strehe, svoje gume `Car.kt`): približno 5 ur na avto.
- **`mounts` in pregled 624 možnosti** za vsak avto: približno 12 ur na avto (deli so takrat že narejeni). Avti, kjer kak element ne pride v poštev (formula, LM, tovornjak), v `mounts` tega elementa nimajo; garaža ga potem ne ponudi.

## 5. Spremembe dogovora
(Tu zapiši vsako spremembo dogovora iz razdelka 2, z datumom in razlogom.)
