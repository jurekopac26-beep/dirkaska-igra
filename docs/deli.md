# Deli iz garaže: dogovor med avti in garažo

Igralec v garaži (veja z garažo: `garaza.html`, `js/garage3d.js`) kupi in namesti dele. Ta datoteka opisuje, kako jih igra nariše in kako vplivajo na vožnjo. Garaža se zanaša natančno na to; sprememba dogovora gre v razdelek »Spremembe dogovora« spodaj.

## Datoteke

| Datoteka | Kaj |
|---|---|
| `js/data/deli.js` | seznam delov `DELI_DATA`: 40 elementov (krilo, platisca, zarometi … in servis), vsak 16 možnosti od najcenejše (1) do najdražje (16), imena SI/EN, cena, `kaj_nudi`, `na_regalu`. Kopija `nacrti/cene/cene.json` z veje garaže (commit 1998059), da sta meni garaže in igra isti seznam |
| `js/deli.js` | `DELI`: risanje vseh možnosti, platišča, del posebej, učinek; naložen pred avti (`index.html`) |
| `js/deli/<skupina>.js` | elementi sklopa 2 po skupinah (`spredaj`, `zadaj`, `streha`, `bok`): vsak element se prijavi z `DELI.add(id, build)`; naloženi za `js/deli.js` in pred avti (garaža jih naloži v istem vrstnem redu) |
| `js/cars/<id>.js` | `mounts`: kje so mesta za dele na tem avtu; v `build(K)` ovoji `K.deli(id, serijski)` |
| `js/render.js` | `K.deli`, `K.topY`, avto z deli (`kitEntry(M, hi, deli)`), `Render.deliMesh`, `Render.kitInfo(id, deli)`, `Render.carShot({ deli })`, `Render.setShowCar(model, barva, številka, deli)` |
| `js/core.js` | `Core.applyDeli(car, deli)`: učinek na fiziko; `Car` (`opts.deli`), `Race` (`opts.playerDeli`); `mounts` v definiciji vozila |
| `tests/deli.test.js` | test dogovora (seznam, učinki, fizika, vse možnosti na vseh avtih z `mounts`) |
| `tools/deli-plosca.mjs` | plošča za uporabnika iz prave igre: serijski del, širši pogledi in 16 možnosti elementa (ali izbor `--ns`) z imeni, cenami in učinki (`node tools/deli-plosca.mjs krilo,zarometi [--car kolibri] [--ns 1,6,11,16]` → `test-results/deli/`) |

## Dogovor

1. **Kaj je nameščeno:** `car.deli = { <id elementa>: <možnost 1..16>, … }` na avtu, ki ga riše `makeCarMesh(car)` in ki vozi (`new Core.Car(model, { deli })`, v dirki `new Core.Race(proga, { playerDeli })`). Element, ki ga ni v `car.deli`, je serijski: avto je narisan in vozi točno kot brez delov (brez polja `deli`). Neznani elementi in možnosti zunaj 1..16 se preskočijo.
2. **Kam gre del:** `mounts: { <id elementa>: { … } }` v `js/cars/<id>.js` (merilo avta, kot ostale mere v datoteki). Avto brez mesta za element tega elementa ne nariše in garaža ga ne ponudi (`DELI.has(id)` in `M.def.mounts[id]`). Polja:
   - `krilo: { x, w, part, s, top }`: `x` zadnji rob strehe (pokrova motorja, zadnjega dela), `w` polovična širina tam, `part` del, v katerem je narisano (KOLIBRI: `spoiler`), `s` velikost (1: KOLIBRIJEVA; tetiva, višine, debeline; tovornjak 2), `top` [[x, y] …] vrh, na katerem stoji, vzdolž avta in raven počez (strešni deflektor tovornjaka; privzeto streha: `K.topY`).
   - `zarometi: { x, y0, lean, zc, yc, s, hosts, depth, socket, shape, bulge, ringW }`: ploskev luči (`x` pri višini `y0`, nagnjena nazaj za `lean` na meter), sredina luči (`zc` od sredine avta, `yc`), velikost `s` (1: KOLIBRIJEVA luč, 0,36 × 0,24 m), `hosts` dela leve in desne luči (KOLIBRI: `headL`, `headR`), `depth` kako globoko sega obroč luči nazaj (privzeto 0,014 za ravno ploskev), `socket` del temne odprtine za lučjo (`body` privzeto, `host`: del luči). `shape`: avtova lastna oblika luči (konveksen obris v metrih okrog `zc`, `yc`; PANTER trikotnik v nosu krila, JASTREB prerez steklene kupole spredaj): vsaka možnost dobi to obliko, od možnosti ostanejo barva, obroč in podrobnosti (velikost podrobnosti `s`), `bulge` kako izbočena je leča (kupola), `ringW` širina obroča.
   - `platisca: {}`: platišča na kolesih avta (guma ostane avtova: navadna, terenska, tovornjaška, z belim robom).
3. **Kdo nariše:** `DELI.build(K, id, n, mount, M)` znotraj avtovega `build(K)`: avto pokliče `K.deli(id, () => <serijski del kot prej>, around)`. Če je element v `car.deli`, se nariše možnost, sicer serijski del. `around(n)` (neobvezno) nariše avtovo ohišje okrog dela v obeh primerih, po možnosti `n` (0: serijski); z nameščeno možnostjo je ohišje del nje (JASTREB: stekleni pokrov in okroglo ohišje luči v barvah možnosti, `DELI.lampLook(n)`). Možnost je narisana pod istimi imeni delov kot serijski (`spoiler`, `headL`, `headR` …), zato se razbije, odpade in udrti kot serijski. Platišča niso klic v `build`: `DELI.wheel(n)` je videz koles (`look.wheels`: `face(h)` nariše lice platišča, `dish`, `dishC`, `lip`, `deep`).
4. **Del posebej:** `DELI.mesh(id, n, M, barva)` (= `Render.deliMesh`) vrne `THREE.Group` samo tega dela na njegovem mestu na avtu `M` (koordinate avta, metri): trikotniki, ki jih je narisal `K.deli` (označeni v telesu, `geo.userData.deli`), z avtovim ohišjem okrog njega (`around`); pri platiščih štiri kolesa. `null`, če avto mesta nima.
5. **Učinek:** `DELI.effect(id, n)` prebere `kaj_nudi` v številke: `{ kg, power, grip, kmh, brake, lower, tint, tyre }` (`power`, `grip`, `brake` deleži: +0,06 za +6 %; `lower` metri, višje: < 0; `tyre`: suho, mokro, sneg, makadam). `Core.applyDeli(car)` jih sešteje in uporabi na kopiji modela in ARC (skupni modeli ostanejo nespremenjeni): `kg` masa (in vztrajnost), `power` moč (`kw`, `Tmax`), `grip` bočni oprijem (`arc.amax`; avtopilot kot pri nadgradnji gum), `kmh` končna hitrost (upor zraka, ki hitrost premakne za toliko; ne čez obrate v najvišji prestavi), `brake` zavore. `lower`, `tint`, `tyre` in skriti deli pridejo v sklopu 3.
6. **Telefon:** na avtu je narisan samo nameščen del. Avto z deli ima svoje telo (`kitEntry`, zadnjih 8 v predpomnilniku). Deli ima samo igralčev avto, zato meje: telo z enim elementom največ 300 trikotnikov nad serijskim, platišče do 600 trikotnikov (Visoki 850; serijska kolesa 400 / 700). Okrogle oblike luči imajo na Normalnem 60 % odsekov (luči s kamere za avtom niso vidne). Meje scene v `tests/golden/perf.json` ostanejo.

## KOLIBRI (sklop 1)

- `mounts`: `krilo` (rob strehe, del `spoiler`), `zarometi` (luči `headL`, `headR`), `platisca`.
- Serijski avto (odločitve uporabnika 29. 10. 2026): zelo majhen strešni spojler z zavorno lučjo (2B), bela črta od repa do nosu (4A), okvir šip brez zobcev (4A), nova notranjost (3A: armatura z merilniki, volan s tremi kraki, školjkasta sedeža, zadnja klop, konzola, obloge vrat; meja notranjih trikotnikov `look.budget` 1400, `look.budgetHi` 1750), razpoka v vsakem oknu posebej (4A, za vse avte, `crackPanes` v `js/render.js`).

## Sklop 2 · streha (KOLIBRI, `js/deli/streha.js`)

- `streha: { x0, x1, bead }`: folija, lak ali karbon čez streho od sprednjega roba spojlerja (`x0`) do vrha vetrobranskega stekla (`x1`), v delu `body` (zmečka se s streho). Folije in karbonska prevleka ostanejo znotraj obrob strehe, lak pokrije tudi obrobi (`bead`: pot obrobe vzdolž avta), karbonska streha seže do obrob; tovarniška in suhi karbon imata dva izbokla dela nad sedežema, levo in desno od štartne številke. Barvna folija in lak (3, 7) sta rumena, dokler garaža ne izbira barve.
- `stresna_zajemalka: { x, z }`: zajemalka na sprednjem delu strehe z odprtino naprej (`x` odprtina, `z` sredina), v delu `body`. Serijsko je ni.
- `antena: { x, z, fin: [x, z] }` v delu `aerial`: palice (1–4) stojijo, kjer stoji serijska antena, plavuti (5–15) in dirkalna antena (16) na sredini strehe pred spojlerjem (`fin`: zadnji konec plavuti). Vse ostanejo nizke (salon okvirja avto po višini).
- `zaluzije: { x0, y0, x1, y1, w }` v delu `trunk` (gredo s prtljažnikom): letvice čez zadnje steklo (vznožje in vrh stekla, polovična širina). Z žaluzijami je zadnji brisalec pospravljen ob vznožju stekla (`around` ovoja: del `wiperRear` mora imeti geometrijo).
- Serijski KOLIBRI ostane enak (ovoji brez serijskega dela za streho, zajemalko in žaluzije; serijska antena in brisalec kot prej). Največ trikotnikov: streha 16 (+220 nad serijskim).

## Poskus na treh drugih avtih (sklop 1)

PANTER (športni), JASTREB (klasični), TITAN (tovornjak) imajo `mounts` za poskus.

- PANTER: krilo v delu `wing` (namesto kitovega repa). Žarometi (želja uporabnika 29. 10. 2026): serijski žaromet je zdaj cel izbočeni nos vsakega krila (njegova sprednja ploskev od grebena do pasu in roba pokrova, obris z zarezo nad pokrovom), v tankem kromiranem okvirju; vsaka možnost iz garaže dobi isti obris (`shape`, `bulge`).
- JASTREB: nima dela za krilo, zato je krilo v `body` (ne odpade). Žarometi (izbira uporabnika 29. 10. 2026, različici 2 in 4 združeni): vsaka luč je en kos, nizka kupola iz temnega stekla v obliki solze na konici krila, s kromiranim robom ob vznožju in kromiranim obročem spredaj; luč je nos kupole. Vse je v podobsegu leče, zato razbita luč potemni vsa. Luč iz garaže je nos v obliki prereza kupole (`shape`, izbočen z `bulge`), kupola je v barvi njenega stekla, rob in obroč v barvi njenega obroča (`around`, `DELI.lampLook`). Luč ima 4 korake okrog kupole in gladko senčenje (`K.skin` z `smooth`), zato serijsko telo ostane v meji 1400 trikotnikov (1396); sij luči je v `look.body.lamps`.
- TITAN: spojler na zadnjem robu strešnega deflektorja (želja uporabnika; del `deflector`, `s` 2, `top`); en sklop luči na stran čez štiri serijske luči na odbijaču.
- Serijski videz TITANA je ostal enak (trikotniki po delih enaki kot prej); PANTER in JASTREB imata nove serijske žaromete.

## Stanje in naslednji sklopi

Načrt je na veji garaže (`git fetch origin claude/3d-garage-cars-sum9uk`, nato `git show origin/claude/3d-garage-cars-sum9uk:nacrti/naloga_kolibri.md`, razdelka 3 in 3a). Datotek garaže in mape `nacrti/` ne spreminjaj. Vsak sklop dela svoja seja; uporabnik ji napiše »Naredi sklop N po docs/deli.md«.

| Sklop | Kaj | Stanje |
|---|---|---|
| 1 | dogovor; `krilo`, `platisca`, `zarometi` na KOLIBRIJU; poskus na PANTERJU, JASTREBU, TITANU | narejeno, pull request #192 (luč JASTREBA v enem kosu po izbiri uporabnika) |
| 2 | ostalih 18 vidnih delov. Spredaj: `aero`, `hauba`, `maska`, `zmigavci`, `relijske_luci`. Zadaj: `zadnje_luci`, `auspuh`, `prtljaznik`, `vlecne_kljuke`, `lovilci_blata`. Streha: `streha`, `stresna_zajemalka`, `antena`, `zaluzije`. Bok in kolesa: `ogledala`, `vrata`, `zavore`, `matice` | vzporedno v 4 sejah (razdelek »Vzporedne seje«) |
| 3 | barve in nalepke (`barva`, `crte`, `stevilke`, `nalepke`, `gume`, `soncni_pas`, `zatemnitev`, `luc_pod_avtom`, `celjusti`), skriti deli (načrt 2.6; učinki `lower`, `tint`, `tyre`), razbijanje novih delov | barve in skriti deli vzporedno v 1 seji; razbijanje po sklopu 2 |
| 4 | pregled vseh 624 možnosti na KOLIBRIJU, stran za ogled, testi | čaka |

Odločitve uporabnika (29. 10. 2026, po sklopu 1):
- Deli ostanejo na PANTERJU, JASTREBU in TITANU. Drugi avti se delajo vzporedno, po kategorijah (razdelek »Drugi avti po kategorijah« spodaj).
- Vsak sklop gre na `main` s svojim pull requestom, ko so testi zeleni in ga uporabnik potrdi.
- Sklop 2 se dela takoj v kodi igre na svoji veji, brez prototipa, s slikami iz prave igre (`tools/deli-plosca.mjs`).
- Plošče v sklopu 2: ena plošča na skupino (spredaj, zadaj, streha, bok in kolesa), vsaka s potrditvijo; skupine delajo štiri seje hkrati.
- Vse seje delajo z naporom high.
- Uporabnik dobi po vsakem koraku eno ploščo in nato počakaš na njegovo potrditev. Vprašanja mu postavljaš v slikah, odgovarjaš v slovenščini, kratko.

Kako se doda element (vzorec sta `krilo` in `zarometi` v `js/deli.js`):
1. V `js/cars/kolibri.js` dodaj mesto `mounts.<element>` (kje je del, koliko prostora ima) in ovoj `K.deli('<element>', () => <serijski del>)` okrog serijskega dela v `build(K)`. Serijski avto mora ostati enak (`tests/kit.test.js`, zlate reference).
2. V `DELI.build` (`js/deli.js`) nariši 16 možnosti pod istimi imeni delov kot serijski. Možnosti naj bodo preproste: malo trikotnikov, podrobnosti samo z `K.hi`, okrogle oblike na Normalnem z manj odseki (`sq`).
3. `tests/deli.test.js` vzame nov element sam, ko ima mesto v `mounts`: vseh 16 možnosti se zgradi, del posebej in meje iz točke 6.
4. Ploščo narediš z `node tools/deli-plosca.mjs <element,…>`. Bližnji pogled novega elementa dodaj v `VIEWS` v orodju.
5. Na koncu `node tools/stamp.js`, `npm run test:related` in posodobi kazalo.

Dokler sklop 1 ni na `main`, spoji vejo `claude/sleepy-newton-dlus7o` v svojo vejo.

## Drugi avti po kategorijah (vzporedne seje)

Odločitev uporabnika (29. 10. 2026): drugi avti se delajo vzporedno s sklopom 2, ena seja na kategorijo, vsaka s svojo vejo in pull requestom. Najprej Mali avti (`miska`, `raketa`, `levs`, `levk`) in Športni (`sokol`, `jelen`, `lisica`), da se morebitna napaka v dogovoru pokaže na 7 avtih. Ostale kategorije pridejo na vrsto, ko uporabnik ti dve pregleda. Seji zažene seja sklopa 1, ko je #192 na `main`, z navodilom »Naredi kategorijo <ime> po docs/deli.md (razdelek Drugi avti po kategorijah)«. Stari avti, ki niso narejeni iz kompleta (`formula`, `lm`, `muscle`, `ev`, `truck`), delov nimajo.

Za vsak avto kategorije (en obisk datoteke `js/cars/<id>.js`):
1. Razbijanje kot pri KOLIBRIJU (načrt, razdelek 4: »ločeni žarometi in zadnje luči, ki se razbijejo, spojler, antena, tablica, brisalci, ugrezanje strehe«). Vzorec je `js/cars/kolibri.js`: deli s svojimi imeni (`headL`, `headR`, `tailL`, `tailR`, `spoiler`, `aerial`, `plate`, `wiperFront`, `wiperRear`), njihova imena v `partNames` in mesta v `parts.over`. Gume vsaka zase (`Car.kt`) so fizika: dodaj jih samo, če uporabnik to potrdi (vprašaj v sliki).
2. Mesta za tri gotove dele: `mounts.krilo`, `mounts.platisca`, `mounts.zarometi` in ovoja `K.deli('krilo', …)`, `K.deli('zarometi', …)` (vzorec KOLIBRI; avto z lastno obliko luči kot PANTER in JASTREB: `shape`, `bulge`). Avto, kjer element ne pride v poštev, ga v `mounts` nima.
3. Serijski avto mora biti videti enako kot prej in ostati v mejah trikotnikov (`tests/kit.test.js`, `tests/fleet.test.js`, `tests/browser/fleet.test.mjs`). `tests/deli.test.js` sam preveri vseh 48 možnosti na vsakem avtu z `mounts`.
4. Plošča na avto: `node tools/deli-plosca.mjs krilo,platisca,zarometi --car <id> --ns 1,6,11,16` (izbor možnosti; celotna plošča brez `--ns`) in razbitina z `node tools/carshots.mjs <id>`. Uporabniku pošlji eno ploščo za vso kategorijo in počakaj na njegovo potrditev.
5. Pull request za kategorijo odpri, ko so povezani testi lokalno zeleni. Na `main` gre, ko so testi na GitHubu zeleni in uporabnik potrdi.

Seje avtov ne spreminjajo dogovora (`car.deli`, `mounts`, `K.deli`, `DELI`) in ne urejajo `js/deli.js`, ki ga ureja seja sklopa 2 (spori). Če je dogovor treba spremeniti, to zapiši v »Spremembe dogovora« in povej uporabniku. Mesta za dele sklopov 2 in 3 dobijo avti v drugem, krajšem obisku, ko so ti deli narejeni.

## Vzporedne seje (29. 10. 2026)

Želja uporabnika: do resetiranja žetonov naj čim več dela teče hkrati, v ločenih sejah. Ko uporabnik napiše, da se je resetiralo, seje spet delajo varčno, ena za drugo. Vse seje začnejo z veje `claude/sleepy-newton-dlus7o` (sklop 1, pull request #192), dokler ta ni na `main`. Vsaka seja ima svojo vejo in svoj pull request.

| Seja | Elementi ali avti | Svoje datoteke |
|---|---|---|
| Sklop 2 · spredaj | `aero`, `hauba`, `maska`, `zmigavci`, `relijske_luci` | `js/deli/spredaj.js` |
| Sklop 2 · zadaj | `zadnje_luci`, `auspuh`, `prtljaznik`, `vlecne_kljuke`, `lovilci_blata` | `js/deli/zadaj.js` |
| Sklop 2 · streha | `streha`, `stresna_zajemalka`, `antena`, `zaluzije` | `js/deli/streha.js` |
| Sklop 2 · bok in kolesa | `ogledala`, `vrata`, `zavore`, `matice` | `js/deli/bok.js` |
| Sklop 3 · barve in skriti deli | `barva`, `crte`, `stevilke`, `nalepke`, `gume`, `soncni_pas`, `zatemnitev`, `luc_pod_avtom`, `celjusti`; skriti deli (načrt 2.6: `filter_zraka`, `cip`, `turbo`, `akumulator`, `vzmeti`, `amortizerji`, `stabilizatorji`, `hupa`, `dim_gum`) in učinki `lower`, `tint`, `tyre` | `js/deli/barve.js`, `js/deli/skriti.js` |
| Avti · Mali avti | `miska`, `raketa`, `levs`, `levk` | `js/cars/<id>.js` |
| Avti · Športni | `sokol`, `jelen`, `lisica` | `js/cars/<id>.js` |

Pravila, da se seje ne motijo:
- `js/deli.js` in dogovor ostaneta, kot sta. Sprememba dogovora gre v »Spremembe dogovora« in jo povej uporabniku.
- V `js/cars/kolibri.js` vsaka seja sklopa 2 doda svoja mesta pod svojo vrstico v `mounts` (»sklop 2, … js/deli/<skupina>.js«) in ovoje `K.deli` okrog svojih serijskih delov.
- V skupnih datotekah (`docs/deli.md`, `docs/kazalo.md`, `tests/README.md`, `index.html`) vsaka seja ureja samo svoj del. Spore ob spajanju razreši, žige pa z `node tools/stamp.js`.
- Uporabniku pošlji eno ploščo za svojo skupino (`tools/deli-plosca.mjs`) in počakaj na potrditev. Vprašanja mu postavljaš v slikah, v slovenščini, kratko.
- Pred pull requestom spoji `main` (ko je #192 tam). Na `main` gre, ko so testi zeleni in uporabnik potrdi.
- Razbijanje novih delov (sklop 3) pride po sklopu 2; sklop 4 (pregled vseh 624 možnosti, stran za ogled) pride na koncu.

## Spremembe dogovora

- 29. 10. 2026 (sklop 1): datoteki sta `js/deli.js` in `js/data/deli.js` (ne `js/cars/_deli.js`): mapa `js/cars/` sme imeti samo vozila (`tests/fleet.test.js`), podatki so v `js/data/` kot pri svetovih.
- 29. 10. 2026: `DELI.build(K, id, n, mount, M)` dobi model `M` (ne `car`): telo je skupno vsem avtom tega modela z istimi deli.
- 29. 10. 2026 (poskus): `zarometi` dobi `hosts`, `depth` in `socket` (avti brez delov `headL` / `headR`, luči v ohišjih na zaobljenih krilih); `krilo.part` je lahko katerikoli obstoječi del (`wing`, `body`), dokler avto ob svojem razbijanju (načrt, razdelek 4) ne dobi dela `spoiler`; avto, kjer element ne pride v poštev (tovornjak: krilo), ga v `mounts` nima.
- 29. 10. 2026: platišča ne zamenjajo gume (`DELI.wheel` nima `style`; globoko lice `deep: true`).
- 29. 10. 2026 (poskus, želje uporabnika): `zarometi` dobi `shape`, `bulge`, `ringW` (avtova lastna oblika luči), `krilo` dobi `s` in `top` (tovornjak); `K.headLamp` z obrisom zna izbočeno lečo (`bulge`) in obris z zarezo (zvezdast okrog sredine); `DELI.mesh` vzame trikotnike, ki jih je narisal `K.deli` (prej celoten del, kar je pri lučeh v krilih vrnilo celo krilo); `K.deli(id, stock, around)` z avtovim ohišjem okrog dela; `DELI.lampLook(n)` (barvi leče in obroča možnosti).
- 29. 10. 2026: meje trikotnikov za avto z deli (točka 6 zgoraj).
- 29. 10. 2026 (izbira uporabnika): JASTREBOVA luč je en kos (kupola in nos), `mounts.zarometi.shape` je prerez kupole namesto kroga; `K.skin` zna gladko senčenje (`o.smooth`).
- 29. 10. 2026 (vzporedne seje): `DELI.add(id, build)` (element v svoji datoteki `js/deli/<skupina>.js`, naloženi za `js/deli.js`) in `DELI.seg(K, k)` (odseki okrogle oblike, na Normalnem manj).
