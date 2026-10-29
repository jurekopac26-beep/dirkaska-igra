# Deli iz garaže: dogovor med avti in garažo

Igralec v garaži (veja z garažo: `garaza.html`, `js/garage3d.js`) kupi in namesti dele. Ta datoteka opisuje, kako jih igra nariše in kako vplivajo na vožnjo. Garaža se zanaša natančno na to; sprememba dogovora gre v razdelek »Spremembe dogovora« spodaj.

## Datoteke

| Datoteka | Kaj |
|---|---|
| `js/data/deli.js` | seznam delov `DELI_DATA`: 40 elementov (krilo, platisca, zarometi … in servis), vsak 16 možnosti od najcenejše (1) do najdražje (16), imena SI/EN, cena, `kaj_nudi`, `na_regalu`. Kopija `nacrti/cene/cene.json` z veje garaže (commit 1998059), da sta meni garaže in igra isti seznam |
| `js/deli.js` | `DELI`: risanje vseh možnosti, platišča, del posebej, učinek; naložen pred avti (`index.html`) |
| `js/cars/<id>.js` | `mounts`: kje so mesta za dele na tem avtu; v `build(K)` ovoji `K.deli(id, serijski)` |
| `js/render.js` | `K.deli`, `K.topY`, avto z deli (`kitEntry(M, hi, deli)`), `Render.deliMesh`, `Render.kitInfo(id, deli)`, `Render.carShot({ deli })`, `Render.setShowCar(model, barva, številka, deli)` |
| `js/core.js` | `Core.applyDeli(car, deli)`: učinek na fiziko; `Car` (`opts.deli`), `Race` (`opts.playerDeli`); `mounts` v definiciji vozila |
| `tests/deli.test.js` | test dogovora (seznam, učinki, fizika, vse možnosti na vseh avtih z `mounts`) |

## Dogovor

1. **Kaj je nameščeno:** `car.deli = { <id elementa>: <možnost 1..16>, … }` na avtu, ki ga riše `makeCarMesh(car)` in ki vozi (`new Core.Car(model, { deli })`, v dirki `new Core.Race(proga, { playerDeli })`). Element, ki ga ni v `car.deli`, je serijski: avto je narisan in vozi točno kot brez delov (brez polja `deli`). Neznani elementi in možnosti zunaj 1..16 se preskočijo.
2. **Kam gre del:** `mounts: { <id elementa>: { … } }` v `js/cars/<id>.js` (merilo avta, kot ostale mere v datoteki). Avto brez mesta za element tega elementa ne nariše in garaža ga ne ponudi (`DELI.has(id)` in `M.def.mounts[id]`). Polja:
   - `krilo: { x, w, part, s, top }`: `x` zadnji rob strehe (pokrova motorja, zadnjega dela), `w` polovična širina tam, `part` del, v katerem je narisano (KOLIBRI: `spoiler`), `s` velikost (1: KOLIBRIJEVA; tetiva, višine, debeline; tovornjak 2), `top` [[x, y] …] vrh, na katerem stoji, vzdolž avta in raven počez (strešni deflektor tovornjaka; privzeto streha: `K.topY`).
   - `zarometi: { x, y0, lean, zc, yc, s, hosts, depth, socket, shape, bulge, ringW }`: ploskev luči (`x` pri višini `y0`, nagnjena nazaj za `lean` na meter), sredina luči (`zc` od sredine avta, `yc`), velikost `s` (1: KOLIBRIJEVA luč, 0,36 × 0,24 m), `hosts` dela leve in desne luči (KOLIBRI: `headL`, `headR`), `depth` kako globoko sega obroč luči nazaj (privzeto 0,014 za ravno ploskev), `socket` del temne odprtine za lučjo (`body` privzeto, `host`: del luči). `shape`: avtova lastna oblika luči (konveksen obris v metrih okrog `zc`, `yc`; PANTER trikotnik v nosu krila, JASTREB okrogla luč v pokritem ohišju): vsaka možnost dobi to obliko, od možnosti ostanejo barva, obroč in podrobnosti (velikost podrobnosti `s`), `bulge` kako izbočena je leča (kupola), `ringW` širina obroča.
   - `platisca: {}`: platišča na kolesih avta (guma ostane avtova: navadna, terenska, tovornjaška, z belim robom).
3. **Kdo nariše:** `DELI.build(K, id, n, mount, M)` znotraj avtovega `build(K)`: avto pokliče `K.deli(id, () => <serijski del kot prej>, around)`. Če je element v `car.deli`, se nariše možnost, sicer serijski del. `around(n)` (neobvezno) nariše avtovo ohišje okrog dela v obeh primerih, po možnosti `n` (0: serijski); z nameščeno možnostjo je ohišje del nje (JASTREB: stekleni pokrov in okroglo ohišje luči v barvah možnosti, `DELI.lampLook(n)`). Možnost je narisana pod istimi imeni delov kot serijski (`spoiler`, `headL`, `headR` …), zato se razbije, odpade in udrti kot serijski. Platišča niso klic v `build`: `DELI.wheel(n)` je videz koles (`look.wheels`: `face(h)` nariše lice platišča, `dish`, `dishC`, `lip`, `deep`).
4. **Del posebej:** `DELI.mesh(id, n, M, barva)` (= `Render.deliMesh`) vrne `THREE.Group` samo tega dela na njegovem mestu na avtu `M` (koordinate avta, metri): trikotniki, ki jih je narisal `K.deli` (označeni v telesu, `geo.userData.deli`), z avtovim ohišjem okrog njega (`around`); pri platiščih štiri kolesa. `null`, če avto mesta nima.
5. **Učinek:** `DELI.effect(id, n)` prebere `kaj_nudi` v številke: `{ kg, power, grip, kmh, brake, lower, tint, tyre }` (`power`, `grip`, `brake` deleži: +0,06 za +6 %; `lower` metri, višje: < 0; `tyre`: suho, mokro, sneg, makadam). `Core.applyDeli(car)` jih sešteje in uporabi na kopiji modela in ARC (skupni modeli ostanejo nespremenjeni): `kg` masa (in vztrajnost), `power` moč (`kw`, `Tmax`), `grip` bočni oprijem (`arc.amax`; avtopilot kot pri nadgradnji gum), `kmh` končna hitrost (upor zraka, ki hitrost premakne za toliko; ne čez obrate v najvišji prestavi), `brake` zavore. `lower`, `tint`, `tyre` in skriti deli pridejo v sklopu 3.
6. **Telefon:** na avtu je narisan samo nameščen del. Avto z deli ima svoje telo (`kitEntry`, zadnjih 8 v predpomnilniku). Deli ima samo igralčev avto, zato meje: telo z enim elementom največ 300 trikotnikov nad serijskim, platišče do 600 trikotnikov (Visoki 850; serijska kolesa 400 / 700). Okrogle oblike luči imajo na Normalnem 60 % odsekov (luči s kamere za avtom niso vidne). Meje scene v `tests/golden/perf.json` ostanejo.

## KOLIBRI (sklop 1)

- `mounts`: `krilo` (rob strehe, del `spoiler`), `zarometi` (luči `headL`, `headR`), `platisca`.
- Serijski avto (odločitve uporabnika 29. 10. 2026): zelo majhen strešni spojler z zavorno lučjo (2B), bela črta od repa do nosu (4A), okvir šip brez zobcev (4A), nova notranjost (3A: armatura z merilniki, volan s tremi kraki, školjkasta sedeža, zadnja klop, konzola, obloge vrat; meja notranjih trikotnikov `look.budget` 1400, `look.budgetHi` 1750), razpoka v vsakem oknu posebej (4A, za vse avte, `crackPanes` v `js/render.js`).

## Poskus na treh drugih avtih (sklop 1)

PANTER (športni), JASTREB (klasični), TITAN (tovornjak) imajo `mounts` za poskus.

- PANTER: krilo v delu `wing` (namesto kitovega repa). Žarometi (želja uporabnika 29. 10. 2026): serijski žaromet je zdaj cel izbočeni nos vsakega krila (njegova sprednja ploskev od grebena do pasu in roba pokrova, obris z zarezo nad pokrovom), v tankem kromiranem okvirju; vsaka možnost iz garaže dobi isti obris (`shape`, `bulge`).
- JASTREB: nima dela za krilo, zato je krilo v `body` (ne odpade). Žarometi (želja uporabnika): cela pokrita luč je luč (stekleni pokrov v obliki solze, okroglo ohišje in luč v njem; vse v podobsegu leče, razbita potemni vse); luč iz garaže je okrogla v ohišju (`shape`), pokrov in ohišje v njenih barvah (`around`, `DELI.lampLook`).
- TITAN: spojler na zadnjem robu strešnega deflektorja (želja uporabnika; del `deflector`, `s` 2, `top`); en sklop luči na stran čez štiri serijske luči na odbijaču.
- Serijski videz JASTREBA in TITANA je ostal enak (trikotniki po delih enaki kot prej); PANTER ima nove serijske žaromete.

## Spremembe dogovora

- 29. 10. 2026 (sklop 1): datoteki sta `js/deli.js` in `js/data/deli.js` (ne `js/cars/_deli.js`): mapa `js/cars/` sme imeti samo vozila (`tests/fleet.test.js`), podatki so v `js/data/` kot pri svetovih.
- 29. 10. 2026: `DELI.build(K, id, n, mount, M)` dobi model `M` (ne `car`): telo je skupno vsem avtom tega modela z istimi deli.
- 29. 10. 2026 (poskus): `zarometi` dobi `hosts`, `depth` in `socket` (avti brez delov `headL` / `headR`, luči v ohišjih na zaobljenih krilih); `krilo.part` je lahko katerikoli obstoječi del (`wing`, `body`), dokler avto ob svojem razbijanju (načrt, razdelek 4) ne dobi dela `spoiler`; avto, kjer element ne pride v poštev (tovornjak: krilo), ga v `mounts` nima.
- 29. 10. 2026: platišča ne zamenjajo gume (`DELI.wheel` nima `style`; globoko lice `deep: true`).
- 29. 10. 2026 (poskus, želje uporabnika): `zarometi` dobi `shape`, `bulge`, `ringW` (avtova lastna oblika luči), `krilo` dobi `s` in `top` (tovornjak); `K.headLamp` z obrisom zna izbočeno lečo (`bulge`) in obris z zarezo (zvezdast okrog sredine); `DELI.mesh` vzame trikotnike, ki jih je narisal `K.deli` (prej celoten del, kar je pri lučeh v krilih vrnilo celo krilo); `K.deli(id, stock, around)` z avtovim ohišjem okrog dela; `DELI.lampLook(n)` (barvi leče in obroča možnosti).
- 29. 10. 2026: meje trikotnikov za avto z deli (točka 6 zgoraj).
