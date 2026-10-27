# Kazalo kode

Kje v kodi je kaj, da ni treba iskati na slepo. Imena funkcij in naslovi razdelkov so takšni, kot so v kodi: poišči jih z `grep -n "function ime"` ali po naslovu razdelka (`/* ---------------- naslov`). Številk vrstic namenoma ni, ker se spreminjajo.

**Velike datoteke ne beri v celoti:** `js/world.js` (3,9 MB, ~34.600 vrstic), `js/render.js` (~9.400), `js/core.js` (~5.800), `js/game.js` (~5.200), `docs/igra.md` (115 KB), `tests/README.md` (110 KB). Najprej poišči ime tu, nato z grepom, nato preberi samo tisti del.

Kazalo posodobi, ko dodaš ali premakneš kaj, kar je tu naštetega.

## Datoteke

| Datoteka | Kaj |
|---|---|
| `index.html` | stran igre: zasloni (`<section id="s-…">`), HUD, posnetek (`#replay-ui`), pavza (`#s-pause`) |
| `js/game.js` | stanje igre, zasloni, HUD, glavna zanka, posnetek, Foto, dogodki gumbov (`data-act`) |
| `js/core.js` | proga (`Track`), fizika avtov, AI, dirka (`Race`), predmeti ob progi; brez DOM in THREE |
| `js/render.js` | izris: avti, delci, sledi gum, kamere, nebo, poškodbe, boksi |
| `js/world.js` | gradnja sveta ob progi: `build()` izbere graditelja po temi (tabela spodaj), `LOD` za nivo podrobnosti |
| `js/world-<tema>.js` | svetovi v svojih datotekah (`World.ext[tema]`, tabela prog spodaj). `montreal`, `toronto`, `townsville`: pomočniki `extAPI` (`K.<ime>`). Premaknjeni iz `world.js` (sklop 17: `newcastle`, `detroit`, `marrakesh`, `troisrivieres`): koda nespremenjena, pomočnike vzame iz `World.api` (`API` v `world.js`: nespremenljivi ob nalaganju, spremenljivo stanje kot `K.<ime>`, `T` in druge podatke gradnje prepiše `SYNC` pred gradnjo); kar `world.js` uporablja od njih, je `API.<ime>` |
| `js/napake.js`, `css/napake.css` | orodje za napake (samo slovensko, svoj DOM, brez `tr()`): Označi v posnetku (risanje, paleta, oblački, zbirka trenutkov); opis spodaj |
| `js/input.js` | dotik, volan na zaslonu, nagib, tipkovnica (`KEY_DEF`: tudi `replay` na I za Posnetek do sem), plošček |
| `js/lang.js` | angleščina za `tr()` (preverja `tests/lang.test.js`) |
| `js/menu.js`, `js/menu-data.js`, `css/menu.css` | novi meni (naslovnica, izbira načina in proge, uvod) |
| `js/sfx.js` | zvok (sintetiziran) |
| `js/comm.js` | angleški komentator |
| `js/net.js` | dirka s prijatelji prek interneta |
| `js/tex.js` | teksture (narisane v kodi) |
| `js/journey.js`, `js/geo.js`, `js/intro-data.js`, `js/routes.js` | uvod pred dirko (globus, prelet); `geo/intro-data/routes` so narejeni z orodji, ne urejaj ročno |
| `js/newmap.js`, `js/nvbake.js`, `js/nvmenu.js`, `js/nvwalls.js` | NEW VERSION · TEST 1 (nov zemljevid Toskane) |
| `js/tracks/<id>.js` | podatki proge (`name`, `theme`, `test`, …) |
| `js/cars/<id>.js` | vozila |
| `js/data/` | podatki svetov (npr. OSM, višine) |
| `css/style.css` | slog igre (posnetek: `#replay-ui`, `.rp-…`; gumbi v eni vrsti: pod 960 px ★ in Označi brez besede, pod 820 px tesneje) |
| `sw.js`, `manifest.webmanifest` | igra kot aplikacija (predpomnilnik) |
| `tools/stamp.js` | žigi `?v=` za `js/` in `css/` (po vsaki spremembi) |
| `tools/carshots.mjs`, `tools/icons.mjs` | slike avtov, ikone |
| `tests/run.js` | poganjanje testov (`node`, `browser`, `fleet`, `--shard`); `--related` (`npm run test:related`: testi sprememb proti `main`, po imenih in seznamu `RELATED`), `--files`, `--quiet` (samo napake in povzetek) |
| `README.md` | opis igre, seznam prog (»Proge«), »Nov meni«, »Zgradba projekta« (»Novo vozilo«, »Nova proga«), »Zasluge« (licence) |
| `docs/proge/<id>.md` | opis proge (oblika, višine, okolica, približki); `pikes.md` tudi `pikesg`, `toskana.md` tudi `grom` |
| `docs/igra.md` | opis igre po temah (fizika, štart, boksi, vreme, grafika, vozni park, razpadanje …), prej v `README.md` |
| `docs/orodje-za-napake.md` | načrt orodja za napake (sklopi, stanje) |

## Teme v `js/game.js`

Naslovi razdelkov (iskanje: `grep -n "/\* ---------------- <začetek naslova>" js/game.js`):

- **nastavitve** `settings`, **stanje** `state`, **zasloni** `screens`, **izbira avta** `car select`, **izbira proge** `track select`
- **posnetek** `replay: the race recorded` — `recStart`, `recStep`, `replayStart`, `replayEnd`, `replayUI`, `replayAct`, `replayFrame`, `REC_MAX` (20 min), `RP_CAM`, `RP_SPEED`; časovnica `rpLineBind` (tap, vlečenje), skok na čas `rpSeek`, iskanje sličice `rpIdx` (zadnja sličica do časa t), čas `rpClock` (00:41.3); stikalo Cel posnetek | Zastavice (`replay.mode`, zastavice v `recd.flags`: sklop 7); za orodje za napake `NK_HOOKS` (kljuke za `Napake.init`) in `rpInfo` (čas, krog sledenega avta iz `lapTimes`, metri od štarta), `replayUI` kliče `Napake.sync`
- **Posnetek do sem** (gumb v pavzi `pause-rp`, tipka I: `Input.onReplay`) — `rpHereOk`, `rpHere`, `replay.here` (`keep`, `wait`), shranjevanje in vračanje stanja avtov `rpKeep` / `rpBack`, Nazaj v dirko `rpRace`, odštevanje 3 · 2 · 1 `rpCd`, `cdStep` (v glavni zanki), `cdOff` (pavza ga ustavi); `RP_BACK` (začetek 10 s pred zdaj)
- **najboljši trenutki** `replayHL`, video trenutka `the best moment as a video` (`hlvStart`, `hlvStop`)
- **Foto** `photo mode` — `photoStart`, `photoSave` (slika, Web Share, prenos), `photoEnd`
- **duh** `ghost of the best run`, sledi gum zadnjih voženj `the tyre marks of the last time trial runs`
- **deljenje** profila in izziv `sharing`, `a challenge (Izziv)`
- **dirka** `race lifecycle` (`pause`, `resume`, start, konec), `per-step race logic`, `phases`
- **HUD** `HUD`, `time trial HUD`, `the timing tower`, uničen avto, `the wheel rule`
- **odprta cesta** (Vršič: promet, policija) `the open road`, `the police radio`
- **boksi** `pit stops`, radio ekipe `the team radio`
- **sovoznik** `the co-driver`, **komentator** `commentator`
- **kvalifikacije**, **kariera**, **prvenstvo**, **šola vožnje**, **Pikes Peak** (razredi, opozorila, medalje), **skoki** `jumps`
- **internet** `a race with a friend over the internet`, `a championship over the internet`
- **plošček v menijih**, **Kontrole** `Kontrole (from Nastavitve)`
- **števec sličic** `the frame counter` (`PH`: naslov `?fps`, okvirček zgoraj levo; `PH.tick`, `PH.s` koraki, `PH.r` risanje; osnova za prikaz za razvijalca, sklop 9)
- **polje in štart:** `NUM_AI` 21 (22 avtov), `CH_AI` 19 (prvenstvo), `PLAYER_GRID` 999 (igralec zadnji v polju); leteči start `flyStep`, `flyHUD`, `FLY_T`
- **hiter vstop** `the quick entry` (`quickGo`, `quickRun`): naslov `?proga=<id>&nacin=<način>&t=<s>&vreme=suho|dez&avto=<id>` odpre dirko brez menija; branje naslova `Core.quickArgs`; za teste `window.__game.quick` (opis v `tests/README.md`)
- **glavna zanka** `main loop`, **dogodki** `events` (`switch (act)` za `data-act`), **aplikacija** `the game as an app`, **most do menija** `the menu's bridge`, **zagon** `boot`

## Orodje za napake (`js/napake.js`)

Modul `Napake` (naložen pred `js/game.js`; `init` dobi kljuke `NK_HOOKS` iz igre: `replay`, `rec`, `stop`, `seek`, `span`, `shot`, `info`, `toast`). Gradi svoj DOM v `#replay-ui`: gumb `#nk-on` (Označi) pred Foto, platno `#nk-cv`, oblački `#nk-bubs`, paleta `#nk-pal` (v `.rp-bot` pred časovnico; ležeče `position: fixed` ob levem robu), gumba `#nk-bar` (Dodaj k zbirki, Zapri). Med označevanjem ima `#replay-ui` razred `mark`.

- **označevanje** `open`, `close`, `act` (svinčnik, barve `BARVE`, razveljavi `undo`, radirka `rub`), risanje `down` / `move` / `up` / `draw`; črte v deležih zaslona (0..1); sklenjen krog `isLoop`
- **oblački** `bubbles` (en oblaček na barvo, dokler je na sliki krog te barve; zapis v `M.notes`), postavitev ob krogu `place`, prostor `room` (mimo palete in časovnice), premik `grip`
- **zbirka** `add` (trenutek: čas, krog, `s`, slika `G.shot` 1280 px, oznake, `zapisi`), zastavice na časovnici `flags` (`.nk-flag`, tap: `seek`), `sync` (nov posnetek: nova zbirka); `Napake.zbirka` za sklop 6, `Napake.stanje` za teste

## Teme v `js/core.js`

- **proga** `Track` (`T.idx`, `T.ds`, `T.px/pz/hy`, `T.len`, `startS`), stranske ceste `side roads ("stubs")`, ograje Medvod
- **avto** fizika (`Car`, `stepCS`), nadgradnje `car upgrades`, deli vozil `a registered vehicle's parts`
- **predmeti** razbitine `debris lying on the road`, podrti predmeti ob progi `loose trackside props`
- **AI** `aiControl`, `aiDefend`, `aiWaits`, `aiModel`; vožnja po stranski cesti
- **dirka** `Race`: liki `the characters`, boksi `pit lane`, zastave `flags`, strategija in radio
- **leteči start** `Race._flyColumn` (kolona pred črto, `race.flyOn`, `FLY_GAP` …), široka štartna mreža `_gridWide`
- **nivo podrobnosti fizike** velikih polj `LOD` (nad `LOD.min` 30 avti, npr. Nürburg 100), `Race._lodPlan`, `Race.lodT` (vmesni položaj za izris in posnetek)
- **hiter vstop** `quickArgs(search)` (naslov → proga, način, `t`, vreme, avto, neveljavni deli)
- **naključje** `rng(seed)` (mulberry32); `Math.random` je še v učinkih poškodb (sklop 16)

## Teme v `js/render.js`

Naslovi `/*  <naslov>`: telesa avtov `car body definitions`, nova vozila `the new cars`, kit vozil, `materials`, `ghost`, `particles`, `car light glows`, **sledi gum `skid marks`**, sledi zadnjih voženj, dež, mokra cesta, pljuski, ptice, podrti predmeti `knockable trackside props`, svetloba Pikes Peaka, sonce, letni čas in čas dneva `setAtmos`, lesk asfalta, `post-processing`, `race attach`, zastave in varnostni avto, boksi `pit crews`, odprta cesta, `per-frame`, deli in razbitine, razbijanje `Razbijanje · nov način`, motor (dim, ogenj), **kamera `camera`**, prelet proge, nebo `the sky`, idealna linija `setLine`, šola vožnje `setMarks`, salon `showroom`. `Render.snapshot` naredi sliko za Foto.

## Proge in graditelji sveta

`build()` v `js/world.js` izbere graditelja po `theme` iz `js/tracks/<id>.js`. Testne proge (`test: true`) se po `CLAUDE.md` ne urejajo.

| id | Ime | Tema | Graditelj (`js/world.js`, razen kjer piše drugače) |
|---|---|---|---|
| baldy | Mount Baldy, ZDA | baldy | `buildBaldy` |
| bangsaen | Bang Saen, Tajska | bangsaen | `buildBangsaen` |
| bathurst | Bathurst, Avstralija | bathurst | `buildRbring` (videz `RB_LOOK`) |
| beartooth | Beartooth, ZDA | beartooth | `buildBeartooth` |
| bigsur | Big Sur, ZDA | bigsur | `buildBigSur` |
| caracoles | Los Caracoles, Čile | caracoles | `buildCaracoles` |
| chapman | Chapman's Peak, Južna Afrika | chapman | `buildChapman` |
| cpalace | Crystal Palace, Anglija | cpalace | `buildRbring` (`RB_LOOK`, `cpPark`) |
| detroit | Detroit, ZDA | detroit | `js/world-detroit.js` (`buildDetroit`) |
| greatalpine | Great Alpine Road, Avstralija | greatalpine | `buildGreatAlpine` |
| harju | Harju, Finska | harju | `buildHarju` |
| hotham | Mount Hotham, Avstralija | hotham | `buildHotham` |
| iroha | Irohazaka, Japonska | iroha | `buildIroha` |
| katu | Katu-Jaryk, Rusija | katu | `buildKatu` |
| longford | Longford, Avstralija | longford | `buildLongford` |
| marrakesh | Marrakesh, Maroko | marrakesh | `js/world-marrakesh.js` (`buildMarrakesh`) |
| maunakea | Mauna Kea, ZDA | maunakea | `buildMaunakea` |
| medvode | Medvode, Slovenija | medvode | `buildMedvode` |
| moki | Moki Dugway, ZDA | moki | `buildMoki` |
| monaco | Monte Carlo, Monako | monaco | splošni `build()` (`MC_TER`) |
| monterey | Monterey, ZDA | monterey | `buildMonterey` |
| montreal | Montréal, Kanada | montreal | `js/world-montreal.js` |
| mulholland | Mulholland Highway, ZDA | mulholland | `buildMulholland` |
| newcastle | Newcastle, Avstralija | newcastle | `js/world-newcastle.js` (`buildNewcastle`) |
| nring | Nürburg, Nemčija | nring | `buildNring` |
| ouninpohja | Ouninpohja, Finska | ouni | `buildOuni` |
| palomar | Palomar Mountain, ZDA | palomar | `buildPalomar` |
| pikes, pikesg | Pikes Peak, ZDA (asfalt, makadam) | pikes | `buildPikes` |
| rastro | Rio do Rastro, Brazilija | rastro | `buildRastro` |
| rbring | Štajerska, Avstrija | rbring | `buildRbring` |
| rio | Rio de Janeiro, Brazilija | rio | `buildRbring` (`RB_LOOK`) |
| riverside | Riverside, ZDA | riverside | `buildRiverside` |
| sani | Sani Pass, Južna Afrika | sani | `buildSani` |
| spa | Spa, Belgija | spa | `buildSpa` |
| suzuka | Suzuka, Japonska | suzuka | `buildSuzuka` |
| tianmen | Tianmen, Kitajska | tianmen | `buildTianmen` |
| toronto | Toronto, Kanada | toronto | `js/world-toronto.js` |
| townsville | Townsville, Avstralija | townsville | `js/world-townsville.js` |
| troisrivieres | Trois-Rivières, Kanada | troisrivieres | `js/world-troisrivieres.js` (`buildTroisRivieres`) |
| uncompahgre | Uncompahgre, ZDA | uncompahgre | `buildUncompahgre` |
| vrsic | Vršič, Slovenija | vrsic | `buildVrsic` |
| *gora* | *Gorski reli (test)* | mountain | splošni `build()` |
| *gozd* | *Bakreni gozd (test)* | forest | splošni `build()` |
| *grom* | *Gromski rt (test)* | kamp | splošni `build()` |
| *jezero* | *Jezero Ring (test)* | lake | splošni `build()` |
| *riviera* | *Riviera (test)* | city | splošni `build()` |
| *toskana* | *Toskana (test)* | italia | splošni `build()` |

Pomočniki koridorja (Vršič, Los Caracoles) so skupni več gorskim cestam; skupne funkcije išči pri `buildVrsic` in `buildCaracoles`. Skupni elementi ob progi so npr. `brakeBoards` (table pred zaviranjem), `wornGrass` (obrabljena trava) in `gravelSeams` (obrabljen prehod asfalta v makadam, zdaj samo v Medvodah; maski riše `gravelSeamMasks`).

## Testi po temah

- **Hiter vstop:** `tests/quick.test.js` (naslov), `tests/browser/quick.test.mjs` (igra)
- **Poganjanje testov** (`--shard`, `--related`, `--quiet`): `shards.test.js`
- **Občasni padci brskalniških testov** (vzroki in popravki: `share`, `radio`, `carlow`, `weather`, `pits`): `docs/orodje-za-napake.md`, sklop 3b
- **Posnetek:** `tests/browser/replay.test.mjs` (tudi časovnica, sličice, ±5 s, Posnetek do sem in vračanje stanja avtov na Bathurstu, 12 gumbov v vrstah), video trenutka `hlvid.test.mjs`
- **Orodje za napake:** `tests/browser/napake.test.mjs` (Označi: paleta ležeče in pokonci, krogi in oblački, razveljavi, radirka, premik oblačka, zbirka in zastavice)
- **Foto in deljenje:** `share.test.mjs`
- **Kontrole:** `ctrl.test.mjs`, `pad.test.mjs`
- **Meni:** `menu.test.mjs`; jezik `lang.test.mjs`, `tests/lang.test.js`
- **Svet in grafika:** `world.test.mjs`, `gfx.test.mjs`, `perf.test.mjs` (meje iz `tests/golden/perf.json`), `memory.test.mjs`, prehod asfalt–makadam `seams.test.mjs`
- **Dirke in fizika** (Node): `races.test.js`, `golden.test.js`, `roll.test.js`, `knock.test.js`, testi prog `<id>.test.js`
- **Velika polja in štart** (Node): `grid.test.js` (22, 20 in 100 avtov), `field.test.js` (Nürburg 100), `lod.test.js` (nivo podrobnosti fizike), `start.test.js`; brskalniški `flystart.test.mjs`
- **Opisi:** `fleet.test.js` pregleda vse `.md` (tudi `docs/`) za ime znamke
- **Opis vseh testov:** `tests/README.md` (velik; išči po imenu testa)

## Imena v poročilih o napakah

Izpolni sklop 10 (»V krogu«): ime iz poročila → datoteka · funkcija. Do takrat glej teme zgoraj.
