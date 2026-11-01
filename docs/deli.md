# Deli iz garaže: dogovor med avti in garažo

Igralec v garaži (veja z garažo: `garaza.html`, `js/garage3d.js`) kupi in namesti dele. Ta datoteka opisuje, kako jih igra nariše in kako vplivajo na vožnjo. Garaža se zanaša natančno na to; sprememba dogovora gre v razdelek »Spremembe dogovora« spodaj.

## Datoteke

| Datoteka | Kaj |
|---|---|
| `js/data/deli.js` | seznam delov `DELI_DATA`: 40 elementov (krilo, platisca, zarometi … in servis), vsak 16 možnosti od najcenejše (1) do najdražje (16), imena SI/EN, cena, `kaj_nudi`, `na_regalu`. Kopija `nacrti/cene/cene.json` z veje garaže (commit 1998059), da sta meni garaže in igra isti seznam |
| `js/deli.js` | `DELI`: risanje vseh možnosti, platišča, del posebej, učinek; naložen pred avti (`index.html`) |
| `js/deli/<skupina>.js` | elementi sklopa 2 po skupinah (`spredaj`, `zadaj`, `streha`, `bok`) in sklopa 3 (`barve`, `skriti`): vsak element se prijavi z `DELI.add(id, build)`; naloženi za `js/deli.js` in pred avti (garaža jih naloži v istem vrstnem redu) |
| `js/cars/<id>.js` | `mounts`: kje so mesta za dele na tem avtu; v `build(K)` ovoji `K.deli(id, serijski)` |
| `js/render.js` | `K.deli`, `K.topY`, avto z deli (`kitEntry(M, hi, deli)`), `Render.deliMesh`, `Render.kitInfo(id, deli)`, `Render.carShot({ deli })`, `Render.setShowCar(model, barva, številka, deli)`; deli na kolesih `KIT_WHEEL_DELI` (zavore, matice) in čeljusti, ki se ne vrtijo (`kitWheelMesh`) |
| `js/core.js` | `Core.applyDeli(car, deli)`: učinek na fiziko; `Car` (`opts.deli`), `Race` (`opts.playerDeli`); `mounts` v definiciji vozila |
| `tests/deli.test.js` | test dogovora (seznam, učinki, fizika, vse možnosti na vseh avtih z `mounts`) |
| `tools/deli-plosca.mjs` | plošča za uporabnika iz prave igre: serijski del, širši pogledi in 16 možnosti elementa (ali izbor `--ns`) z imeni, cenami in učinki (`node tools/deli-plosca.mjs krilo,zarometi [--car kolibri] [--ns 1,6,11,16]` → `test-results/deli/`) |

## Dogovor

1. **Kaj je nameščeno:** `car.deli = { <id elementa>: <možnost 1..16>, … }` na avtu, ki ga riše `makeCarMesh(car)` in ki vozi (`new Core.Car(model, { deli })`, v dirki `new Core.Race(proga, { playerDeli })`). Element, ki ga ni v `car.deli`, je serijski: avto je narisan in vozi točno kot brez delov (brez polja `deli`). Neznani elementi in možnosti zunaj 1..16 se preskočijo.
2. **Kam gre del:** `mounts: { <id elementa>: { … } }` v `js/cars/<id>.js` (merilo avta, kot ostale mere v datoteki). Avto brez mesta za element tega elementa ne nariše in garaža ga ne ponudi (`DELI.has(id)` in `M.def.mounts[id]`). Polja:
   - `krilo: { x, w, part, s, top }`: `x` zadnji rob strehe (pokrova motorja, zadnjega dela), `w` polovična širina tam, `part` del, v katerem je narisano (KOLIBRI: `spoiler`), `s` velikost (1: KOLIBRIJEVA; tetiva, višine, debeline; tovornjak 2), `top` [[x, y] …] vrh, na katerem stoji, vzdolž avta in raven počez (strešni deflektor tovornjaka; privzeto streha: `K.topY`).
   - `zarometi: { x, y0, lean, zc, yc, s, hosts, depth, socket, shape, bulge, ringW }`: ploskev luči (`x` pri višini `y0`, nagnjena nazaj za `lean` na meter), sredina luči (`zc` od sredine avta, `yc`), velikost `s` (1: KOLIBRIJEVA luč, 0,36 × 0,24 m), `hosts` dela leve in desne luči (KOLIBRI: `headL`, `headR`), `depth` kako globoko sega obroč luči nazaj (privzeto 0,014 za ravno ploskev), `socket` del temne odprtine za lučjo (`body` privzeto, `host`: del luči). `shape`: avtova lastna oblika luči (konveksen obris v metrih okrog `zc`, `yc`; PANTER trikotnik v nosu krila, JASTREB prerez steklene kupole spredaj): vsaka možnost dobi to obliko, od možnosti ostanejo barva, obroč in podrobnosti (velikost podrobnosti `s`), `bulge` kako izbočena je leča (kupola), `ringW` širina obroča.
   - `platisca: {}`: platišča na kolesih avta (guma ostane avtova: navadna, terenska, tovornjaška, z belim robom).
   - `ogledala: { x, y, z, w, h, d, z0 }`: sredina serijskega ogledala (desnega; `z` od sredine avta), velikost ohišja (vzdolž, navzgor, navzven), `z0` kje roka sede v karoserijo (privzeto `z − d/2 − 0,05`). Možnost nariše steklo s `K.mirror` (poči, ogledalo se zloži) in ohišje okrog njega v delih `mirrorL`, `mirrorR`.
   - `vrata: { x: [zadaj, spredaj], y: [prag, pas], handle: [x, y, z, w, h], win: [[x, t] …] }`: koža vrat znotraj fug, kljuka, steklo vrat v pasu okna (`t` 0 pas, 1 rob strehe; konveksno, v nasprotni smeri urinega kazalca). Plošča vrat je nalepka na boku karoserije (`K.decal`, gre z vrati), črta in fuge ostanejo nad njo.
   - `zavore: { s }`, `matice: { k, r }`: deli na kolesih (glej točko 3): `s` velikost diska (1: KOLIBRIJEV), `k` matic na kolo, `r` njihov krog (v polmerih platišča, 0,2).
   - Sklop 2 · zadaj (`js/deli/zadaj.js`): `zadnje_luci: { x, zc, yc, w, h, shape, hosts, bar }` (prostor za luč na vsaki strani: `x` serijske luči, svetleča ploskev 2,3 cm za njo; sredina `zc`, `yc`; `w` × `h`; `shape` obris prostora [notranji spodnji, zunanji spodnji, zunanji zgornji, notranji zgornji] v metrih okrog `zc`, `yc`, vsaka možnost se raztegne vanj (KOLIBRI: črnina za lučjo s poševnim vrhom in dnom); `hosts` dela luči; `bar { x, y, w, h, part }` pas čez zadek med lučmi za LED-trak), `auspuh: { x, y, z, r, len, part }` (konec serijske cevi, |z| na levi), `prtljaznik: { x: [x0, x1], glass, w, part, garnish }` (pokrov na vrhu glavnega lofta od zadnjega roba `x0` do sprednjega `x1`; `glass`: konec okna nad njim pri vratih prtljažnika, brez: pokrov limuzine; `garnish` [x, y, w, h] temni pas), `vlecne_kljuke: { f: [x, y, z], r: [x, y, z] }` (točki za vleko na sprednjem in zadnjem odbijaču, dela `bumperF`, `bumperR`), `lovilci_blata: { x: [spredaj, zadaj], z: [noter, ven], y: [vrh, spodaj], sill, part }` (za kolesi; `sill` [x0, x1, y, z] ščitnik praga).
3. **Kdo nariše:** `DELI.build(K, id, n, mount, M)` znotraj avtovega `build(K)`: avto pokliče `K.deli(id, () => <serijski del kot prej>, around)`. Če je element v `car.deli`, se nariše možnost, sicer serijski del. `around(n)` (neobvezno) nariše avtovo ohišje okrog dela v obeh primerih, po možnosti `n` (0: serijski); z nameščeno možnostjo je ohišje del nje (JASTREB: stekleni pokrov in okroglo ohišje luči v barvah možnosti, `DELI.lampLook(n)`). Možnost je narisana pod istimi imeni delov kot serijski (`spoiler`, `headL`, `headR` …), zato se razbije, odpade in udrti kot serijski. Platišča niso klic v `build`: `DELI.wheel(n)` je videz koles (`look.wheels`: `face(h)` nariše lice platišča, `dish`, `dishC`, `lip`, `deep`). Tudi zavore in matice niso klic v `build`: so deli na kolesih (`KIT_WHEEL_DELI` v `js/render.js`), ki jih `kitWheelGeo` nariše na igralčeva kolesa za licem platišča z `DELI.build(h, id, n, m, M)`, kjer je `h` pomočnik lica (`g`, `p`, `rr`, `zd`, `zo`, `top`, `out`) in še `still` (kar se s kolesom ne vrti: čeljusti zavor, svoj mesh na kolesu, ki sledi samo zasuku, `kitWheelMesh`), `r`, `rear`, `vis` (Visoki), `fitted` (nameščeni deli: platišča). Za jeklenim platiščem in pokrovom (`platisca` 1–4, 16) zavor ni (jih skrijejo); na platišču s centralno matico (12, 14, 16) je matica ena, velika, v sredini.
4. **Del posebej:** `DELI.mesh(id, n, M, barva)` (= `Render.deliMesh`) vrne `THREE.Group` samo tega dela na njegovem mestu na avtu `M` (koordinate avta, metri): trikotniki, ki jih je narisal `K.deli` (označeni v telesu, `geo.userData.deli`), z avtovim ohišjem okrog njega (`around`); pri platiščih, zavorah in maticah štiri kolesa (s čeljustmi). `null`, če avto mesta nima.
5. **Učinek:** `DELI.effect(id, n)` prebere `kaj_nudi` v številke: `{ kg, power, grip, kmh, brake, lower, tint, tyre }` (`power`, `grip`, `brake` deleži: +0,06 za +6 %; `lower` metri, višje: < 0; `tyre`: suho, mokro, sneg, makadam). `Core.applyDeli(car)` jih sešteje in uporabi na kopiji modela in ARC (skupni modeli ostanejo nespremenjeni): `kg` masa (in vztrajnost), `power` moč (`kw`, `Tmax`), `grip` bočni oprijem (`arc.amax`; avtopilot kot pri nadgradnji gum), `kmh` končna hitrost (upor zraka, ki hitrost premakne za toliko; ne čez obrate v najvišji prestavi), `brake` zavore, `lower` za toliko nižja karoserija (`car.dLower`; nariše jo `DELI.dress`, fizika ostane), `tint` zatemnitev stekel (`car.dTint`; nariše jo material), `tyre` oprijem gum po podlagah (`car.dTy`: suho, mokro, sneg, makadam; vsaka točka 0,4 % oprijema, 0 so serijske gume Cesta; `deliTyre` v `stepCS` in `stepNova`, sneg v zimski dirki in na zasneženem makadamu).
6. **Telefon:** na avtu je narisan samo nameščen del. Avto z deli ima svoje telo (`kitEntry`, zadnjih 8 v predpomnilniku). Deli ima samo igralčev avto, zato meje: telo z enim elementom največ 300 trikotnikov nad serijskim, kolo s platiščem, zavorami ali maticami do 600 trikotnikov (Visoki 850; čeljusti štejejo zraven; serijska kolesa 400 / 700), z vsemi tremi hkrati do 800 (Visoki 1150). Okrogle oblike luči imajo na Normalnem 60 % odsekov (luči s kamere za avtom niso vidne). Meje scene v `tests/golden/perf.json` ostanejo.

## KOLIBRI (sklop 1)

- `mounts`: `krilo` (rob strehe, del `spoiler`), `zarometi` (luči `headL`, `headR`), `platisca`.
- Serijski avto (odločitve uporabnika 29. 10. 2026): zelo majhen strešni spojler z zavorno lučjo (2B), bela črta od repa do nosu (4A), okvir šip brez zobcev (4A), nova notranjost (3A: armatura z merilniki, volan s tremi kraki, školjkasta sedeža, zadnja klop, konzola, obloge vrat; meja notranjih trikotnikov `look.budget` 1400, `look.budgetHi` 1750), razpoka v vsakem oknu posebej (4A, za vse avte, `crackPanes` v `js/render.js`).

## Sklop 2 · streha (KOLIBRI, `js/deli/streha.js`)

- `streha: { x0, x1, xf }`: strešno okno (odločitev uporabnika 30. 10. 2026: namesto folij, lakov in karbonskih streh okna v različnih oblikah in velikostih; imena, cene in `kaj_nudi` v `js/data/deli.js`, id ostane `streha`): steklena (pasovi stekla čez vso širino strehe v obliki avta, do roba), nagibna (zadnji rob dvignjen, deflektor, zatemnjeno), drsna (odprtina spredaj, steklo zdrsne nazaj) in panoramska (13, 14 v obliki strehe do roba; cela steklena streha; karbonski okvir). Majhna okna imajo sprednji rob pri `xf` nad sprednjima sedežema, panoramska segajo od spojlerja (`x0`) do vetrobranskega stekla (`x1`); v delu `body`. Z nameščenim oknom avto nima štartne številke na strehi (želja uporabnika 30. 10. 2026; `makeCarMesh` v `js/render.js` skrije številko, ko je v `car.deli` element `streha`). Serijsko okna ni.
- `stresna_zajemalka: { x, z }`: zajemalke na sprednjem delu strehe z odprtino naprej (`x` odprtina, `z` sredina), v delu `body`: z enim, dvema ali tremi vhodi, kapljica, snorkel, z loputo ali mrežo, dve ob robu strehe, dolge oblikovane (želja uporabnika 30. 10. 2026: bolj različne). Serijsko je ni.
- `antena: { x, z, fin: [x, z], front: [x, z] }` v delu `aerial`: palice na mestu serijske antene, sredi strehe in spredaj desno (`front`), plavuti, dve plavuti, ploščica za GPS in antena za radijsko zvezo na sredini strehe pred spojlerjem (`fin`: zadnji konec plavuti). Vse ostanejo nizke (salon okvirja avto po višini).
- `zaluzije: { x0, y0, x1, y1, w }` v delu `trunk` (gredo s prtljažnikom): letvice čez zadnje steklo (vznožje in vrh stekla, polovična širina). Z žaluzijami je zadnji brisalec pospravljen ob vznožju stekla (`around` ovoja: del `wiperRear` mora imeti geometrijo).
- Serijski KOLIBRI ostane enak (ovoji brez serijskega dela za streho, zajemalko in žaluzije; serijska antena in brisalec kot prej).

## Bok in kolesa (sklop 2, `js/deli/bok.js`)

Na KOLIBRIJU (mesta pod vrstico »js/deli/bok.js« v `mounts`, ovoja `K.deli('ogledala', …)` okrog serijskih ogledal in `K.deli('vrata', …)` okrog kljuk; z nameščenimi vrati Visoki ne nariše serijskih ročajev):
- `ogledala`: pokrovčki (zaobljena kapa v črni, kromu, karbonu, suhem karbonu čez črno ohišje), športna (kapljasta, v barvi avta; LED smernik, dvobarvna ogrevana, smernik in luč pod ogledalom), karbonska (tudi aero na nogici), dirkalna (ploska in široka na nogici; aero; motošport z rdečim nosom). Steklo je serijsko `K.mirror` (poči, zloži se), ohišje je koža okrog njega.
- `vrata`: plošča vrat na boku (jeklena v temeljni sivi, lakirana s kljuko v barvi avta, ojačana z letvijo, lažja z vtisnjeno črto, aluminij, lakiran aluminij s kovinskim robom, aluminij s kovicami (Visoki), steklena vlakna, karbon s svetlimi pasovi tkanja (Visoki), suhi karbon), lahko steklo z drsnim okencem, mreža namesto stekla, trak za odpiranje namesto kljuke, zatiča za hiter zapah.
- `zavore`: disk na skledi platišča (vrti se s kolesom; zareze, luknje, plavajoči z aluminijastim zvonom in zakovicami, keramični, karbon-karbon z režami), čeljust v `h.still` na zadnjem zgornjem robu diska (serijska temna, kompleti rdeča, rumena, črna, oranžna; keramične rumena, titanova, modra, črna), ploščice v barvi možnosti pod čeljustjo. Barvo čeljusti bo spreminjal element `celjusti` (sklop 3): v `caliper` (`js/deli/bok.js`) je barva `O.cal`.
- `matice`: šestrobe matice na pestu nad maticami platišča (jeklene, kromirane z žirom, s ključavnico, ozke z utorom (Visoki), barvne aluminijaste s podložko, kovane s posnetim vrhom, odprte s koncem vijaka, titanove, mavrične z barvnim prelivom).
- Mere: ogledala +112 do +136 trikotnikov telesa, vrata do +86; kolo z zavorami do +72 (Visoki +116) in čeljust 36–46, z maticami do +96 (Visoki +168); najtežja platišča, zavore in matice skupaj 786 (Visoki 1116).
## Sklop 2 · spredaj (KOLIBRI)

Elementi v `js/deli/spredaj.js` (`DELI.add`), mesta v `js/cars/kolibri.js` (polja so opisana na vrhu datoteke):
- `aero`: kit ob vznožju avta namesto serijskih črnih robov pod odbijačema (`lipF`, `lipR`; možnost brez svojega kosa spredaj ali zadaj ju obdrži): sprednji spojler, pragovi (`body`, ne odpadejo), difuzor in zadnja robova (`bumperR`, mimo auspuha: `exh`), ravno krilce s ploščama in krilca na vogalih (`bumperF`), razširitve blatnikov (`K.flare`, `body`). Lakirani paketi so v barvi avta, karbonski v karbonu.
- `hauba`: namesto serijske zajemalke, v delu `hood` (odpre se in odleti s haubo): koža po vrhu haube (`K.topY`) iz aluminija ali karbona (karbon v dveh odtenkih trikotnikov, na Visokih gostejši), reže, izboklina, zajemalka, hitre zaponke, črna proga.
- `maska`: namesto serijske ozke maske med lučmi (na nagnjeni ploskvi kot luči): mreža, satje, letve, reže, okvir, svetleč rob.
- `zmigavci`: namesto serijskih oranžnih stekel na odbijaču in na blatnikih; možnosti 7 in 16 imajo ponavljalnik na ogledalih (del `mirrorL` / `mirrorR`, mesto `mirror`: sprednja ploskev ohišja serijskega ogledala), 11, 13–16 tudi zadaj na odbijaču. Tekoči so stopnjevani od temnejše notranje do svetle zunanje lučke.
- `relijske_luci` (serijsko jih ni): dve na odbijaču, štiri na cevi pred masko, letev na strehi (`body`), LED-letev v spodnji odprtini odbijača, pokrov z lučmi čez nos (`bumperF`). Luči ponoči ne svetijo (samo barva).
- Trikotniki (Normalni / Visoki nad serijskim): največ `aero` 16 +272 / +352, `relijske_luci` 5–8 +220 / +360, `maska` 16 +170 / +294; vse v meji +300 (Normalni) in v proračunu Visokih.
- Za druge seje: `zmigavci` 7 in 16 rišeta na ohišje serijskega ogledala (seja »bok«: če `ogledala` spremeni ohišje, mesto `zmigavci.mirror` velja za serijsko). Difuzor `aero` je v sredini pod zadnjim odbijačem (seja »zadaj«: auspuh na sredini bi šel skozenj). Letev `relijske_luci` 9, 11, 12 je na sprednjem robu strehe (x 0,1; seja »streha«: strešna zajemalka naj bo za njo).
- `tests/deli.test.js` zdaj preveri vse elemente z mestom v `mounts`, ki jih `DELI` zna narisati (ne več samo `krilo`, `platisca`, `zarometi`).

## Poskus na treh drugih avtih (sklop 1)

PANTER (športni), JASTREB (klasični), TITAN (tovornjak) imajo `mounts` za poskus.

- PANTER: krilo v delu `wing` (namesto kitovega repa). Žarometi (želja uporabnika 29. 10. 2026): serijski žaromet je zdaj cel izbočeni nos vsakega krila (njegova sprednja ploskev od grebena do pasu in roba pokrova, obris z zarezo nad pokrovom), v tankem kromiranem okvirju; vsaka možnost iz garaže dobi isti obris (`shape`, `bulge`).
- JASTREB: nima dela za krilo, zato je krilo v `body` (ne odpade). Žarometi (izbira uporabnika 29. 10. 2026, različici 2 in 4 združeni): vsaka luč je en kos, nizka kupola iz temnega stekla v obliki solze na konici krila, s kromiranim robom ob vznožju in kromiranim obročem spredaj; luč je nos kupole. Vse je v podobsegu leče, zato razbita luč potemni vsa. Luč iz garaže je nos v obliki prereza kupole (`shape`, izbočen z `bulge`), kupola je v barvi njenega stekla, rob in obroč v barvi njenega obroča (`around`, `DELI.lampLook`). Luč ima 4 korake okrog kupole in gladko senčenje (`K.skin` z `smooth`), zato serijsko telo ostane v meji 1400 trikotnikov (1396); sij luči je v `look.body.lamps`.
- TITAN: spojler na zadnjem robu strešnega deflektorja (želja uporabnika; del `deflector`, `s` 2, `top`); en sklop luči na stran čez štiri serijske luči na odbijaču.
- Serijski videz TITANA je ostal enak (trikotniki po delih enaki kot prej); PANTER in JASTREB imata nove serijske žaromete.

## Sklop 3 · barve in skriti deli (KOLIBRI)

Datoteki `js/deli/barve.js` in `js/deli/skriti.js` (naložena za `js/deli/bok.js`). Ploščo naredi `node tools/deli-plosca.mjs <elementi> --compact --ask "…"` (cel sklop na eni plošči), test `tests/deli-barve.test.js` in `tests/browser/deli-barve.test.mjs`.

- **Narisani v telesu** (`DELI.add`, `K.deli` v `build(K)` KOLIBRIJA, pod `mounts`): `crte` (dirkalne črte čez haubo, streho in prtljažnik, ob zajemalki na haubi; serijska bočna črta ostane, je avtova okoli dela), `nalepke` (na bokih nad črto, na haubi ob zajemalki, na strehi; podobe čez cel avto; v dveh plasteh: temen obris pod zvezdo in strelo, rumeno jedro nad rdečimi plameni), `soncni_pas` (pas od vrha vetrobranskega stekla po vsej širini do robov; napisi v pisavi 5 × 7: splošni `07`, `DRIVER`, `SLOVENIJA`, `DRIVER CO-DRIVER`), `celjusti` (za naperami platišča, v telesu: se ne vrtijo, sprednje kolo pri močnem zavijanju malo zdrsne čez njih), `zamasek` (zamašek rezervoarja za gorivo na desnem zadnjem boku, namesto serijskega: lopute, aluminijasti, dirkalni, karbonski in titanov zamaški). Plasti na lupini: `K.mainDecal()` (kot `L.decal` glavne lupine).
- **Videz avta** (brez oblike v telesu; `DELI.dress` v `makeCarMesh`): `barva` (izvedba laka; barva ostane `car.color`: mat, sijaj, kovinski, biserni, kameleon, zrcalni; avtov lastni material), `zatemnitev` (barva in delež zatemnitve stekla, zrcalne in kameleon folije), `luc_pod_avtom` (svoj model pod avtom, en klic risanja, barve po ogliščih: stalna, spredaj in zadaj, ob zaviranju, dihajoča, mavrica, tekoča mavrica, smerniki ob zavijanju, obroči v kolesih), `gume` (`DELI.tyreLook`: bloki tekalne plasti, barva gume, pas na boku; v `kitWheelGeo` `W.knob`, `W.band`, `W.bandR`). Črte (kovinske, biserne, odsevne) in odsevne nalepke imajo sijaj v atributu `aDl` (1 lak, 0,66 črta, 0,33 odsevna nalepka).
- **Skriti deli** (`js/deli/skriti.js`, v notranjem delu telesa, ki se riše šele, ko odpade del): `filter_zraka`, `akumulator` (ovoja okoli serijskih), `turbo`, `cip` (motorni prostor), `vzmeti`, `amortizerji`, `stabilizatorji` (kolesni loki), `dim_gum` (pas na notranjem boku zadnje gume). Garaža jih vidi z `DELI.mesh` (v sliki `Render.carShot({ ghost: [id, n] })` na prosojnem avtu). Na avtu se kaže le učinek: moč, masa, oprijem (`DELI.effect`), nižji avto (`vzmeti`), barva dima gum (`DELI.dim(n)`; v igri dim drsenja zadnjih koles).
- **Odločitve uporabnika (30.–31. 10. 2026):** potrjeni vsi elementi in videz s plošče; dirkalne črte v 16 jasno različnih vzorcih (na sredini, ob strani, na eni strani, zožujoče, samo hauba in prtljažnik, šahovnica, po bokih, poševne); nalepke v dveh plasteh; senčni pas do robov stekla; brez številk in krogov; hupa zamenjana z zamaškom rezervoarja; senčni pas s splošnimi napisi (garaža lahko kasneje vpiše igralčeve); barvo črt izbere garaža (`car.stripeCol`); čeljusti ostanejo v karoseriji (pri močnem zavijanju sprednje kolo malo zdrsne čez njih).
- **Telefon:** vidni deli največ 300 trikotnikov nad serijsko zunanjostjo, skriti samo v notranjem delu (največ + 300; notranjost se riše šele po odpadlem delu), gume do 600 trikotnikov (Visoki 850). Luč pod avtom je edini nov klic risanja (samo z nameščeno lučjo, samo igralčev avto).

## Stanje in naslednji sklopi

Načrt je na veji garaže (`git fetch origin claude/3d-garage-cars-sum9uk`, nato `git show origin/claude/3d-garage-cars-sum9uk:nacrti/naloga_kolibri.md`, razdelka 3 in 3a). Datotek garaže in mape `nacrti/` ne spreminjaj. Vsak sklop dela svoja seja; uporabnik ji napiše »Naredi sklop N po docs/deli.md«.

| Sklop | Kaj | Stanje |
|---|---|---|
| 1 | dogovor; `krilo`, `platisca`, `zarometi` na KOLIBRIJU; poskus na PANTERJU, JASTREBU, TITANU | narejeno, pull request #192 (luč JASTREBA v enem kosu po izbiri uporabnika) |
| 2 | ostalih 18 vidnih delov. Spredaj: `aero`, `hauba`, `maska`, `zmigavci`, `relijske_luci`. Zadaj: `zadnje_luci`, `auspuh`, `prtljaznik`, `vlecne_kljuke`, `lovilci_blata`. Streha: `streha`, `stresna_zajemalka`, `antena`, `zaluzije`. Bok in kolesa: `ogledala`, `vrata`, `zavore`, `matice` | vzporedno v 4 sejah (razdelek »Vzporedne seje«); spredaj potrjeno 30. 10. 2026 (razdelek »Sklop 2 · spredaj«) |
| 3 | barve in nalepke (`barva`, `crte`, `nalepke`, `gume`, `soncni_pas`, `zatemnitev`, `luc_pod_avtom`, `celjusti`, `zamasek`), skriti deli (načrt 2.6; učinki `lower`, `tint`, `tyre`), razbijanje novih delov | barve in skriti deli narejeni na veji `deli/sklop3-barve` (razdelek »Sklop 3 · barve in skriti deli«), uporabnik jih je potrdil 31. 10. 2026; razbijanje po sklopu 2 |
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

### Športni (`sokol`, `jelen`, `lisica`)

- Razbijanje kot pri KOLIBRIJU (`parts.extra`, imena v `partNames`): `headL`, `headR`, `tailL`, `tailR`, `plate`, `wiperFront`. SOKOL ima žarometa v kotih nosu na sprednjem odbijaču (`on: 'bumperF'`), tablico na zadnjem (`on: 'bumperR'`), račji rep je `wing` (`partNames.wing`: ducktail). JELEN ima par okroglih luči na stran v glavi nosu (del ohišja), tablico na zadnji plošči. LISICA ima steklo dvignjenih žarometov (žarometa ostaneta), zadnjo luč z obrobo, tablico na zadnjem odbijaču. Antene in spojlerja nimajo (serijski videz ostane), streha se ugreza kot prej (`crush`).
- `mounts`: SOKOL krilo na pokrovu za steklom v delu `wing` (namesto račjega repa), žaromet v kotu nosu (`shape`: obris črne reže, luč jo zapolni, želja uporabnika 30. 10. 2026; ravna leča); JELEN krilo na kratkem pokrovu v delu `trunk` (odpre se in odpade s prtljažnikom), žaromet namesto para okroglih luči (`shape`: stadion okrog obeh, izbočen); LISICA krilo na pokrovu prtljažnika (`trunk`), žaromet v čelu dvignjenega žarometa (ta je po želji uporabnika 30. 10. 2026 zlit s karoserijo: zadaj izraste iz pokrova, zunaj teče v ramo blatnika, čelo črno) (`lean` < 0: nagnjeno naprej, `shape`: zaobljen pravokotnik, ravna leča). Vsi `platisca`.
- Gume vsaka zase (`Car.kt`) jih nimajo (odločitev uporabnika 31. 10. 2026). Uporabnik je kategorijo potrdil 31. 10. 2026.
- Serijski avti so videti enako kot prej (isti trikotniki z barvami, isti sij luči; preverjeno s prstnim odtisom geometrije), razen LISIČINIH zlitih žarometov; tablica je zdaj tanka ploščica kot pri KOLIBRIJU (+8 trikotnikov: odpadel kos ima prostornino, `tests/browser/fleet.test.mjs`). Možnosti: krilo do +220, žarometi do +240 trikotnikov nad serijskim (meja 300).

### Mali avti (veja `deli/avti-mali`)

Vsi štirje: serijski avto je trikotnik za trikotnikom enak kot prej (Normalni, tudi notranjost), meja 1400 trikotnikov ostane (MIŠKA 1380, RAKETA 1338, LEV S 1390, LEV KABRIO 1396). Razbijanje: ločeni deli iz obstoječih kosov (nič novega ni narisano), imena v `partNames`, mesta v `parts.extra`. Tablica, antena in spojler so samo tam, kjer jih avto že ima.

| Avto | Novi deli (razbijanje) | `krilo` | `zarometi` |
|---|---|---|---|
| MIŠKA | `headL` / `headR` (luč iz gondole v blatniku; gondola s kromiranim robom ostane), `tailL` / `tailR` (s kromiranim robom), `wiperFront` | nad zadnjim robom strehe (nad zadnjim steklom), v `body`, `s` 0,9 | v čelu gondole, skoraj poravnan z njim; vsaka možnost svoje oblike (`s` 0,4), z lučjo iz garaže je čelo v barvi karoserije brez kromiranega roba (`around`; želja uporabnika 30. 10.: prave druge luči, ne luč, nalepljena na luč). Možnost 4 na Normalnem z osmimi odseki (+284; izbira uporabnika 30. 10.) |
| RAKETA | `headL` / `headR` (par okroglih luči na strani; maska ostane), `tailL` / `tailR` (s črnim okvirjem), `plate` in `wiperRear` (`on: 'trunk'`), `wiperFront` | nad zadnjim robom strehe, v `body` | en sklop na stran čez par okroglih luči; stoji 2,6 cm iz maske, obroč sega nazaj do nje (`depth`; želja uporabnika 30. 10.: bolj štrlijo kot pri drugih avtih) |
| LEV S | `headL` / `headR` (mandelj s projektorjema), `tailL` / `tailR`, `spoiler` in `wiperRear` (`on: 'trunk'`), `wiperFront` | v delu `spoiler` (namesto serijskega spojlerja) | glej spodaj |
| LEV KABRIO | `headL` / `headR`, `tailL` / `tailR`, `plate` (`on: 'bumperR'`), `wiperFront` | na zadnjem robu dolgega pokrova prtljažnika, v `trunk` (odpre se in odpade z njim) | kot LEV S |

- Žaromet LEV S in LEV KABRIO (potrdil uporabnik 30. 10.): mandelj se ovija okrog vogala (ploskev je nagnjena nazaj in navzven), luč iz garaže pa je ravna in gleda naprej (dogovor pozna le nagib `lean`). Luč stoji na mestu sprednjega projektorja, nagnjena za `lean` 0,55, na notranjem robu mandlja; njen obroč sega 6 cm nazaj do pločevine (`depth`), zato na zunanji strani štrli kot ohišje. Mandelj okrog nje je v barvah luči (`around`, `DELI.lampLook`; pri KABRIU brez temnega roba, da ostane v meji 300 trikotnikov). Natančnejše prileganje bi potrebovalo zasuk luči okrog navpične osi (`yaw`) v dogovoru.
- Gume vsaka zase (`Car.kt`) in udiranje strehe od prvega odstotka (`roof0`) ostanejo samo pri KOLIBRIJU (izbira uporabnika 30. 10.: Mali avti ne).

### Dirkalni (`bizon`, `kozorog`, `mravlja`, `strelica`, `tiger`, `tornado`, veja `deli/avti-dirkalni`)

| Avto | Novi deli (razbijanje) | `krilo` | `zarometi` |
|---|---|---|---|
| BIZON | `tailL` / `tailR` (po dve okrogli luči na repu pokrova motorja, `on: 'cover'`) | namesto visokega krila na nosilcih, v delu `wing` | ni (avto nima žarometov) |
| KOZOROG | `headL` / `headR` (pravokotni luči v črnem pasu), `tailL` / `tailR` (z okvirjem in rebri stekla), `wiperFront` | namesto krila, v delu `wing` | v črnem pasu namesto luči (`shape`: obris pasu) |
| MRAVLJA | ni (kart nima luči) | ni (kart) | ni |
| STRELICA | ni (avto iz leta 1961 nima luči) | na pokrovu motorja za izpušnimi cevmi, v delu `cover` (odpade z njim); serijsko ga ni | ni |
| TIGER | `headL` / `headR` (ozki luči v kotih odbijača, `on: 'bumperF'`, z lečo, potegnjeno nazaj čez nos), `tailL` / `tailR` (polovici svetlobnega pasu), `wiperFront` | namesto krila na labodjih vratovih, v delu `wing` | v obliki ozke luči (`shape`), v njenem črnem okvirju; leča čez nos v barvi luči iz garaže |
| TORNADO | `headL` / `headR` (nalepki luči s črno obrobo, `on: 'bumperF'`; smernika ostaneta na nosu), `tailL` / `tailR` (polovici črne plošče z lučjo) | namesto rezila spojlerja, v delu `wing` | v obliki nalepke (`shape`), v črni obrobi |

- Serijski avti so videti enako kot prej: KOZOROG, MRAVLJA in STRELICA trikotnik za trikotnikom; BIZON +4 (skriti temni trikotniki za lečami zadnjih luči segajo v karoserijo, da imata odpadla kosa prostornino), TIGER in TORNADO +2 (črni pas zadaj razdeljen na polovici, zgornji rob vsake polovice 4 mm bolj zadaj, da ima odpadel kos prostornino). TIGER ima 1388 od 1400 trikotnikov.
- KOZOROGOVA luč za dež je na desni polovici mreže zadnjih luči: ugasne z desno zadnjo lučjo (prej s pokrovom prtljažnika).
- Možnosti: krilo do +220 (STRELICA), žarometi do +172 trikotnikov nad serijskim (meja 300).

Seje avtov ne spreminjajo dogovora (`car.deli`, `mounts`, `K.deli`, `DELI`) in ne urejajo `js/deli.js`, ki ga ureja seja sklopa 2 (spori). Če je dogovor treba spremeniti, to zapiši v »Spremembe dogovora« in povej uporabniku. Mesta za dele sklopov 2 in 3 dobijo avti v drugem, krajšem obisku, ko so ti deli narejeni.

## Vzporedne seje (29. 10. 2026)

Želja uporabnika: do resetiranja žetonov naj čim več dela teče hkrati, v ločenih sejah. Ko uporabnik napiše, da se je resetiralo, seje spet delajo varčno, ena za drugo. Vse seje začnejo z veje `claude/sleepy-newton-dlus7o` (sklop 1, pull request #192), dokler ta ni na `main`. Vsaka seja ima svojo vejo in svoj pull request.

| Seja | Elementi ali avti | Svoje datoteke |
|---|---|---|
| Sklop 2 · spredaj | `aero`, `hauba`, `maska`, `zmigavci`, `relijske_luci` | `js/deli/spredaj.js` |
| Sklop 2 · zadaj | `zadnje_luci`, `auspuh`, `prtljaznik`, `vlecne_kljuke`, `lovilci_blata` | `js/deli/zadaj.js` |
| Sklop 2 · streha | `streha`, `stresna_zajemalka`, `antena`, `zaluzije` | `js/deli/streha.js` |
| Sklop 2 · bok in kolesa | `ogledala`, `vrata`, `zavore`, `matice` | `js/deli/bok.js` |
| Sklop 3 · barve in skriti deli | `barva`, `crte`, `nalepke`, `gume`, `soncni_pas`, `zatemnitev`, `luc_pod_avtom`, `celjusti`, `zamasek`; skriti deli (načrt 2.6: `filter_zraka`, `cip`, `turbo`, `akumulator`, `vzmeti`, `amortizerji`, `stabilizatorji`, `dim_gum`) in učinki `lower`, `tint`, `tyre` | `js/deli/barve.js`, `js/deli/skriti.js` |
| Avti · Mali avti | `miska`, `raketa`, `levs`, `levk` | `js/cars/<id>.js` |
| Avti · Športni | `sokol`, `jelen`, `lisica` | `js/cars/<id>.js` (narejeno, razdelek »Športni«) |

Pravila, da se seje ne motijo:
- `js/deli.js` in dogovor ostaneta, kot sta. Sprememba dogovora gre v »Spremembe dogovora« in jo povej uporabniku.
- V `js/cars/kolibri.js` vsaka seja sklopa 2 doda svoja mesta pod svojo vrstico v `mounts` (»sklop 2, … js/deli/<skupina>.js«) in ovoje `K.deli` okrog svojih serijskih delov.
- V skupnih datotekah (`docs/deli.md`, `docs/kazalo.md`, `tests/README.md`, `index.html`) vsaka seja ureja samo svoj del. Spore ob spajanju razreši, žige pa z `node tools/stamp.js`.
- Uporabniku pošlji eno ploščo za svojo skupino (`tools/deli-plosca.mjs`) in počakaj na potrditev. Vprašanja mu postavljaš v slikah, v slovenščini, kratko.
- Pred pull requestom spoji `main` (ko je #192 tam). Na `main` gre, ko so testi zeleni in uporabnik potrdi.
- Razbijanje novih delov (sklop 3) pride po sklopu 2; sklop 4 (pregled vseh 624 možnosti, stran za ogled) pride na koncu.

## Sklop 2 · zadaj (KOLIBRI)

- `js/deli/zadaj.js`: `zadnje_luci`, `auspuh`, `prtljaznik`, `vlecne_kljuke`, `lovilci_blata`, vsak 16 možnosti; mesta in ovoji `K.deli` v `js/cars/kolibri.js` (serijski avto enak).
- Odločitve uporabnika (30. 10. 2026): vse možnosti zadnjih luči so v obliki črnine za lučjo (poševen vrh in dno; serijska luč ostane enaka); pokrov prtljažnika in vlečne kljuke so med seboj vidno različni (pokrov: železen, račji rep, kromiran okvir, lesen »woodie«, valovit aluminij, žaluzije, karbon, okno prekrito s karbonom, rdeča črta, dirkalni z zaponkami; kljuke: trakovi v barvah, J-kljuke, plošče, trikotna, zložljive, obroči); možnost 4 pokrova je »Lesen« namesto »Iz steklenih vlaken« (450 €, −3 kg).
- Zadnje luči: svetleči del je repna mreža (`K.tailLamp`, temno rdeča, ob zaviranju svetla), steklo in podrobnosti so telo v delih `tailL`, `tailR`. LED-trak čez prtljažnik (8, 12, 16) je telo v delu `trunk` in ne zasveti (svetita luči ob straneh). Za svetlečo ploskvijo je do telesa le 5 mm, zato globine ni (3D LED: trije obroči svetlobe).
- Vlečne kljuke: 1, 2, 4 samo zadaj, 6–13 samo spredaj, ostale spredaj in zadaj. Lovilci blata: 1–10 za zadnjimi kolesi, 11–16 za vsemi štirimi, 15 in 16 še ščitnika pragov.
- Plošča: `node tools/deli-plosca.mjs zadnje_luci,auspuh,prtljaznik,vlecne_kljuke,lovilci_blata` (luči: levo ugasnjene, desno ob zaviranju; kljuke: levo spredaj, desno zadaj).

## Spremembe dogovora

- 29. 10. 2026 (sklop 1): datoteki sta `js/deli.js` in `js/data/deli.js` (ne `js/cars/_deli.js`): mapa `js/cars/` sme imeti samo vozila (`tests/fleet.test.js`), podatki so v `js/data/` kot pri svetovih.
- 29. 10. 2026: `DELI.build(K, id, n, mount, M)` dobi model `M` (ne `car`): telo je skupno vsem avtom tega modela z istimi deli.
- 29. 10. 2026 (poskus): `zarometi` dobi `hosts`, `depth` in `socket` (avti brez delov `headL` / `headR`, luči v ohišjih na zaobljenih krilih); `krilo.part` je lahko katerikoli obstoječi del (`wing`, `body`), dokler avto ob svojem razbijanju (načrt, razdelek 4) ne dobi dela `spoiler`; avto, kjer element ne pride v poštev (tovornjak: krilo), ga v `mounts` nima.
- 29. 10. 2026: platišča ne zamenjajo gume (`DELI.wheel` nima `style`; globoko lice `deep: true`).
- 29. 10. 2026 (poskus, želje uporabnika): `zarometi` dobi `shape`, `bulge`, `ringW` (avtova lastna oblika luči), `krilo` dobi `s` in `top` (tovornjak); `K.headLamp` z obrisom zna izbočeno lečo (`bulge`) in obris z zarezo (zvezdast okrog sredine); `DELI.mesh` vzame trikotnike, ki jih je narisal `K.deli` (prej celoten del, kar je pri lučeh v krilih vrnilo celo krilo); `K.deli(id, stock, around)` z avtovim ohišjem okrog dela; `DELI.lampLook(n)` (barvi leče in obroča možnosti).
- 29. 10. 2026: meje trikotnikov za avto z deli (točka 6 zgoraj).
- 29. 10. 2026 (izbira uporabnika): JASTREBOVA luč je en kos (kupola in nos), `mounts.zarometi.shape` je prerez kupole namesto kroga; `K.skin` zna gladko senčenje (`o.smooth`).
- 29. 10. 2026 (Športni): rezervno kolo (`K.tyre`, LISICA v prtljažniku) ostane z avtovimi serijskimi platišči (`kx.spare` v `js/render.js`), platišča iz garaže so samo na štirih kolesih: notranjost avta z deli ostane enaka (`tests/deli.test.js`). `tools/deli-plosca.mjs` usmeri bližnji pogled žarometov na višino in ploskev `mounts.zarometi` avta.
- 30. 10. 2026 (Mali avti, izbira uporabnika): žaromet 4 (okrogli, klasični) ima na Normalnem osem odsekov na luč (prej deset), da je na avtu z majhno serijsko lučjo (MIŠKA) v meji 300 trikotnikov; Visoki ostane 16.
- Mali avti: gume vsaka zase (`Car.kt`) in streha od prvega odstotka (`roof0`) ne (izbira uporabnika 30. 10.).
- 29. 10. 2026 (Mali avti): rezervno kolo v avtu (`K.tyre`, MIŠKA v prtljažniku) ostane serijsko, ko so nameščena platišča iz garaže (`render.js`: `kx.spare`); prej je dobilo platišča in spremenilo notranjost (test: »the cabin unchanged«).
- 29. 10. 2026 (vzporedne seje): `DELI.add(id, build)` (element v svoji datoteki `js/deli/<skupina>.js`, naloženi za `js/deli.js`) in `DELI.seg(K, k)` (odseki okrogle oblike, na Normalnem manj).
- 30. 10. 2026 (sklop 2 · streha, odločitev uporabnika): element `streha` so strešna okna (»Strešno okno«, 16 novih možnosti v `js/data/deli.js`); seznam v garaži (`nacrti/cene/cene.json` na veji garaže) mora prevzeti iste možnosti.
- 29. 10. 2026 (sklop 2 · bok): zavore in matice sta dela na kolesih (`KIT_WHEEL_DELI` v `js/render.js`): `DELI.build(h, …)` s pomočnikom lica kolesa namesto `K`, `h.still` za čeljusti (svoj mesh na kolesu, ki sledi samo zasuku: `kitWheelMesh`; `Render.kitInfo(id, deli).wheels.still` trikotniki čeljusti), `DELI.mesh` vrne štiri kolesa; meja kolesa z vsemi tremi deli na kolesih 800 (Visoki 1150). `tests/deli.test.js` preveri vse elemente z mestom v `mounts` (ne samo `krilo`, `platisca`, `zarometi`).
- 29. 10. 2026 (sklop 2 · zadaj): `DELI.mesh` zadnjih luči vrne tudi njihov svetleči del (repno mrežo avta, ki jo je narisala možnost; `K.tailLamp` znotraj `K.deli` jo označi); `Render.carShot` zna `brake` (prižgane zadnje luči). `tests/deli.test.js` preveri vse elemente z mestom v `mounts`, ne le treh iz sklopa 1.
- 30. 10. 2026 (sklop 2 · zadaj, želja uporabnika): `zadnje_luci` dobi `shape` (obris prostora za luč); `K.tailLamp` zna obris (`o.pts`, prizma). V `js/data/deli.js` je možnost 4 pokrova prtljažnika »Lesen« / »Wooden« namesto »Iz steklenih vlaken« (seznam garaže, `nacrti/cene/cene.json` na veji garaže, naj to prevzame).
- 29. 10. 2026 (sklop 3): `car.stripeCol` (barva črt, hex, kot `car.color`; brez nje bela ali modra glede na lak); `K.mainDecal()` (plasti na glavni lupini v elementih iz `js/deli/`); `DELI.dress(o)` (videz avta z deli v `makeCarMesh`: `{ low, step, smoke }`), `DELI.tyreLook(n)`, `DELI.look`, `DELI.dim(n)`; `Render.carShot` dobi `ghost: [id, n]`; učinki `lower`, `tint`, `tyre` v `Core.applyDeli` (`car.dLower`, `car.dTint`, `car.dTy`).
- 30. 10. 2026 (sklop 3, odločitve uporabnika): element `stevilke` (številke in krogi) je odstranjen (KOLIBRI ga v `mounts` nima, garaža ga ne ponudi; v `js/data/deli.js` ostane, dokler garaža ne odloči); serijska štartna številka na strehi ostane. Hupe igra nima: element `hupa` je v `js/data/deli.js` zamenjan z `zamasek` (zamašek rezervoarja, 16 možnosti), narisan na boku (`mounts.zamasek`); seznam garaže (`nacrti/cene/cene.json`) je treba popraviti enako.
