# Kazalo kode

Kje v kodi je kaj, da ni treba iskati na slepo. Imena funkcij in naslovi razdelkov so takšni, kot so v kodi: poišči jih z `grep -n "function ime"` ali po naslovu razdelka (`/* ---------------- naslov`). Številk vrstic namenoma ni, ker se spreminjajo.

**Velike datoteke ne beri v celoti:** `js/world.js` (0,5 MB, ~4.900 vrstic; proge v `js/world-<tema>.js`, največja `world-pikes.js` 0,55 MB), `js/render.js` (~9.400), `js/core.js` (~5.800), `js/game.js` (~5.200), `docs/igra.md` (115 KB), `tests/README.md` (110 KB). Najprej poišči ime tu, nato z grepom, nato preberi samo tisti del.

Kazalo posodobi, ko dodaš ali premakneš kaj, kar je tu naštetega.

## Datoteke

| Datoteka | Kaj |
|---|---|
| `index.html` | stran igre: zasloni (`<section id="s-…">`), HUD, posnetek (`#replay-ui`), pavza (`#s-pause`) |
| `js/game.js` | stanje igre, zasloni, HUD, glavna zanka, posnetek, Foto, dogodki gumbov (`data-act`) |
| `js/core.js` | proga (`Track`), fizika avtov, AI, dirka (`Race`), predmeti ob progi; brez DOM in THREE |
| `js/render.js` | izris: avti, delci, sledi gum, kamere, nebo, poškodbe, boksi; goreča guma KOLIBRIJA `ktGlow` |
| `js/world.js` | gradnja sveta ob progi: `build()` izbere graditelja po temi (tabela spodaj), `LOD` za nivo podrobnosti |
| `js/world-<tema>.js` | svetovi v svojih datotekah (`World.ext[tema]`, tabela prog spodaj). `montreal`, `toronto`, `townsville`: pomočniki `extAPI` (`K.<ime>`). Premaknjeni iz `world.js` (sklop 17: vse prave proge; v `world.js` ostane splošni `build()` testnih prog in Monaka; `world-rbring.js` gradi Štajersko, Bathurst, Rio in Crystal Palace): koda nespremenjena, pomočnike vzame iz `World.api` (`API` v `world.js`: nespremenljivi ob nalaganju, spremenljivo stanje kot `K.<ime>`, `T` in druge podatke gradnje prepiše `SYNC` pred gradnjo); kar `world.js` uporablja od njih, je `API.<ime>` |
| `js/world-prelaz.js` | skupna okolica prelazov (`docs/nove-proge.md`): `buildPrelaz` bere podatke orodja `tools/proga/` iz datoteke proge (`dem`, `lc` z 8 razredi, satelitske barve `col`, `bld`, `lakes`, `cables`, `pylons`, `pulls`, `farDem`), videz vsake proge v `PL_LOOK[tema]` (barve tal in skal, snežna meja, table in oznake države, znamenitosti: `portal`, `sheep`); barva tal `plCol`, sneg `plSnow`, table `plAtlas`/`plAtlas2`, drevesa `plTreeGeo`, obzorje `plFarCol` (prek `irFar`) |
| `js/napake.js`, `css/napake.css` | orodje za napake (samo slovensko, svoj DOM, brez `tr()`): Označi v posnetku (risanje, paleta, oblački, zbirka trenutkov, v krogu), zbirna slika in pošiljanje, Zgodovina napak, zastavica med dirko, dnevnik napak, prikaz za razvijalca, samodejne zastavice, nastavitve orodja; opis spodaj |
| `js/input.js` | dotik, volan na zaslonu, nagib, tipkovnica (`KEY_DEF`: tudi `replay` na I za Posnetek do sem, `flag` na F za zastavico, `dev` na O za prikaz za razvijalca: `Input.onDev`), plošček |
| `js/lang.js` | angleščina za `tr()` (preverja `tests/lang.test.js`) |
| `js/menu.js`, `js/menu-data.js`, `css/menu.css` | novi meni (naslovnica, izbira načina in proge, uvod) |
| `garaza.html`, `js/garage.js`, `js/garage3d.js`, `css/garage.css` | garaža (opis v `README.md`): odpre jo tap na avto na izbiri avta (`game.js` `carTapLay`, `garageOpen`; nazaj `garageBack`, `?zaslon=avto&avto=<id>`); v `garage3d.js` pot širokih vozil `laneWay` (`LN`, `laneObsG`, `carLane`, `crab`, stojala vstran `FREE[k].away`), hitri žarki proti avtu `castAxis` / `rayGrid` (v `probeOf`), načrti servisa `svcPlan` |
| `js/sfx.js` | zvok (sintetiziran) |
| `js/comm.js` | angleški komentator |
| `js/net.js` | dirka s prijatelji prek interneta |
| `js/tex.js` | teksture (narisane v kodi) |
| `js/journey.js`, `js/geo.js`, `js/intro-data.js`, `js/routes.js` | uvod pred dirko (globus, prelet); `geo/intro-data/routes` so narejeni z orodji, ne urejaj ročno |
| `js/newmap.js`, `js/nvbake.js`, `js/nvmenu.js`, `js/nvwalls.js` | NEW VERSION · TEST 1 (nov zemljevid Toskane; `nvwalls`: ograje, ki jih avto odrine, trdne ovire `H3.solids` (tudi napihljivi gradovi, od katerih se avto odbije), premične stvari v parku `H3.loose` (`looseBuild`, `looseStep`: se podrejo, baloni odletijo) in ljudje, ki se umaknejo (`walkStep`); tla ob morju: dno `waterSide` (`bedAt`: višje od obeh obal, plaža ceste in pobočje nove obale, `noBeach`: brez plaže ceste ob JV kopnem), obali JV in SV `landSE`, `landNE` (ozek pesek, travnik do vode, `landMesh`), ena trava `oneGrass` (v `js/world.js` `grassLook` z `uPat` 0: brez lis; material travnika z `userData.bake`, da ga `nvbake` združi po celicah kot druga tla), travnik za robom mape v `seaBeyond`); kmetiji (sklop 3): SZ `farmNW` (njive, dvorišče, kozolca, kapelica, živali `H3.farmAnimals`, ki se pasejo in zbežijo skozi podrto ograjo: `NVWalls.step`; stavbe v `H3.solids`), SV ob morju `farmNE` (makadamska cesta `H3.farmRoad`, njiva s senom, pašnika `H3.farmPB`, plaža do ograje `H3.farmBeach`); pesek ob krožni cesti po oznakah uporabnika `nordRoad` `sandZones`, brez peska `grassZones`; nagnjen ovinek ob morju: asfalt v skledi `ringConcrete`, `bankConcrete`, rdeče-bel notranji robnik (`kerbAt`) |
| `js/nvpark.js`, `js/nvbase.js`, `js/nvedge.js` | notranjost male proge na novem zemljevidu: lunapark z vulkanom (lava, vlakec), trgovina z igračami in stekleni most; reševalna baza s helidromom, pot do boksov in parkirišče; rob male proge in notranjih cest (robnik, črta, priključki; vogal razcepa ceste 2: robnik proge teče v robnik ceste, `raceRoad` z `lead`) |
| `js/nvheli.js` | helikopter, ki leti (nova mapa, sklop 4): parkiran na H reševalne baze (`NVBase.built.heli`), zapelješ noter po zadnji rampi (dno in rampi sta tla `track.ground2`, lupina je zid `track.wall2`), prosojen, meni s tremi (WATER RESCUE in FIREFIGHTING zaklenjeni, FREE FLIGHT), vzlet, let (`flyStep`), gumba PRISTANI HELIKOPTER / DVIGNI SE nad pedali (`#nvh-btn`), VIŠINA in HITROST (`#nvh-info`), ne pristane na vodi ali strehi (`topAt`), sam odleti domov na H (`auto`); priklopi v `js/game.js`: `NVHeli.step`/`post` v `stepRace`, `frame` pred `Render.frame`; ležeče pavza čisto desno (`#hud.nv`); test `tests/browser/nvheli.test.mjs` |
| `js/missions.js`, `css/missions.css` | posebne misije: seznam (`Missions.add`, vadbena misija `vaja`), potek misije (`Run`: ura, omejitev časa, `set`, `win`, `fail`), prikaz v HUD-u (`#mis`), rezultat (`#mis-res`), seznam misij (`#mis-list`), rekordi (`rra-misije`), hitri vstop `?misija=<id>`; priklopi v `js/game.js`: `MS`, `MisBridge` (opts, made in begin v `newRace`, step v `stepRace`, over v fazi racing, stop v `toTitle`) |
| `js/missions/kit.js` | skupni gradniki misij (`MisKit`, opis v `docs/misije.md`, Sistem misij): `truckModel`, gasilski avto C `fireTruck` (lestev, koš, luči, `yawTo`), ogenj in dim `fire`, curek `jet`, hiša `house`, točka ob cesti `at`, merjenje s prstom in GASI `aim` (`#mis-aim`), `hold`; voda (skupina 3): gladina `water`, voda na avtu `wade`, plovilo s kamero `boat` (`Render.setShot`), vozilo iz preprostih teles `skin`, ljudje `crowd`, oznake `tags` (`#mis-tags`), gumb `button` (`#mis-btn`); sneg (skupina 4): teksture `snowTex`, pas po tleh `band` (urejena sled, sledi verig), pokrov ceste `cover`, kupi snega ob robu `piles`, ovira na cesti `block` (cela dolžina vozila) |
| `js/missions/m<nn>.js` | posamezne misije (`Missions.add`): `m01.js` Požar na vrhu (hiša pod vrhom Vršiča, gašenje stoje); `m46.js` Požar v predoru (predor `tunnel`, dim `#mis-smoke` in pike `#mis-dots`, ujeti avti, tovornjak); `m47.js` Gozdni požar (rob ognja iz celic `cells`, gašenje med vožnjo, jezerce, kenguruji); `m49.js` Zataknjeno kolo (kolo `wheel`, drsnika `#mis-lad`, oznake kabin `#mis-tags`, kabina `target`); `m19.js` Pred plimo (otoček z brvjo ob 1. ovinku Townsvilla, plima čez nizko cesto); `m35.js` Reševalci na plaži (štirikolesnik, nato skuter `boat` na morju, plavalec na valovih, krog iskanja); `m37.js` Poplava (dvoživka `skin`, voda čez mesto, ljudje na strehah `HOUSES`, obroč, suho pri ovinku pod hribom); `m48.js` Narasla reka (kmetija pred mostom, tovornjak se sam obrne `turn`, plavje `logs`, življenje mostu); `m06.js` Srce v hladilni torbi (spremstvo: dirkalni avto `race.escort` v podobi policije, `c.police`, promet se mu umika; `opts.tfCars`: promet samo avti in tovornjaki, v `Traffic._populate`; luči spremstva v `render.js` `updateRoad`; bolnišnica z reševalnim avtom ob cilju: `hospital`, `run.add`); `m30.js` Ratrak (Mount Baldy ponoči: urejene celice `cells`, sled `trail`, vitel `hook` z jeklenico in drogom, luči mesta `town`); `m33.js` Odvoz snega (Montréal ponoči: freza `blower` na desnem pasu, curek `jet`, kupi `banks`, kiper s kupom `heap`); `m53.js` Snežne verige (Los Caracoles: verige z gumbom, oprijem `spin`/`slide`, tovornjak počez `wreck`, zapora `barrier` pred galerijo) |
| `js/tracks/<id>.js` | podatki proge (`name`, `theme`, `test`, …) |
| `js/cars/<id>.js` | vozila (`mounts`: mesta za dele iz garaže, ovoji `K.deli`) |
| `js/deli.js`, `js/data/deli.js`, `js/deli/<skupina>.js` | deli iz garaže: seznam `DELI_DATA` (40 elementov × 16 možnosti), risanje `DELI.build` (iz `K.deli` v `build(K)` avta; krilo `krilo`, luči `zarometi`), platišča `DELI.wheel`, del posebej `DELI.mesh` (`Render.deliMesh`), učinek `DELI.effect` (`Core.applyDeli`); elementi sklopa 2 po skupinah v `js/deli/` (`DELI.add`); dogovor `docs/deli.md` |
| `js/data/` | podatki svetov (npr. OSM, višine) |
| `css/style.css` | slog igre (posnetek: `#replay-ui`, `.rp-…`; gumbi v eni vrsti: pod 960 px ★ in Označi brez besede, pod 820 px tesneje) |
| `sw.js`, `manifest.webmanifest` | igra kot aplikacija (predpomnilnik) |
| `tools/stamp.js` | žigi `?v=` za `js/` in `css/` (po vsaki spremembi) |
| `tools/carshots.mjs`, `tools/icons.mjs` | slike avtov, ikone |
| `tools/deli-plosca.mjs` | plošča delov iz garaže za uporabnika (16 možnosti elementa na avtu; `docs/deli.md`) |
| `tools/shot.mjs` | posnetki proge z mesta (`--m` metri od štarta, pokonci in ležeče, brez HUD-a), `--pred <ref|mapa>`: primerjava pred/po z deležem spremenjenih pikslov, `--nabor`: nabor za pull requeste (`NABOR`); `test-results/shots/` |
| `tools/misija-slika.mjs` | slike posebne misije (`?misija=<id>`, avtopilot do `--t` s ali `--pred` m pred ciljem ali `--konec`, pokonci in ležeče, s prikazom misije; `test-results/misije/`) |
| `tools/posnetek.mjs` | datoteka s posnetkom dirke (`.rrp`, ki jo pošlje uporabnik) odprta za Clauda: glava (proga, način, različica, naprava, avti), zastavice dirke, samodejne zastavice, dnevnik, besedilo poročila; `--t` / `--zastavice` slike posnetka (`--avto`, `--kamera`, `--pokonci`, `--lezece`); `test-results/posnetki/<ime>/` (`povzetek.txt`, `povzetek.json`) |
| `tools/predogled.mjs` | stran za GitHub Pages: `main` v korenu, odprti pull requesti v `beta/<št>/`, seznam v `beta/` |
| `docs/nova-fizika-meritve.md` | meritve treh referenčnih videov nove fizike (po razredih, trki, AI tekmeci), primerjava z igro, odprte točke |
| `tools/nova/` | merila nove fizike (Car.stepNova): `tune.js` (ravna plošča po razredih: poln zasuk na gumbih, zavora, plin, nizka pomoč; `'{"K":{…},"A":[…]}'` začasno spremeni NVK / NVASSIST), `ts2.js` (časovna vrsta enega manevra), `sweep.js` + `cmp.js` (dirke na vseh pravih progah, cs proti nova: dotiki, zdrsi, robniki, trava, časi), `pack.js` (trki med avti in vlak tekmecev, za primerjavo s posnetkom), `train.js` (vlak tekmecev kot na posnetku: razmik v dolžinah in s, tekmec ob avtu, prehitevanja AI–AI na minuto, razvlečenje polja na krog; igralec na avtopilotu v skupini), `cam.js` (zasuk avta proti kameri za avtom in koliko od tega je zdrs avta; `SL=1` drseči slog), `bench.js` (čas fizike 100 avtov), `races-nova.js` (`races.test.js` z novo fiziko proti referencam klasične; `TR=spa,…`) |
| `tools/proga/` | orodje za podatke proge (`docs/nove-proge.md`, Recept; opis v `tools/proga/README.md`): `proga.py <id> [--zapisi]` iz OpenStreetMap (Overture), Copernicus DEM, ESA WorldCover, Sentinel-2 in karte krošenj pripravi sredinsko črto, višine, teren, rabo tal, barve tal, stavbe, vodo, žičnice, parkirišča in daljni teren ter jih vpiše v `js/tracks/<id>.js`; nastavitve `proge.json`, skupni deli `lib.py` (branje COG po kosih brez GDAL), pregled v slikah `pregled.py` |
| `.github/workflows/` | `tests.yml` testi, `posnetki.yml` posnetki pred/po ob pull requestu (artefakt in povzetek), `stran.yml` objava strani s predogledom vej |
| `tests/run.js` | poganjanje testov (`node`, `browser`, `fleet`, `--shard`); `--related` (`npm run test:related`: testi sprememb proti `main`, po imenih in seznamu `RELATED`), `--files`, `--quiet` (samo napake in povzetek); časi testov na GitHubu `SECS`, meja testa `LIMIT_OF` (`TEST_TIMEOUT_MIN`, `TEST_SLOW`) |
| `README.md` | opis igre, seznam prog (»Proge«), »Nov meni«, »Zgradba projekta« (»Novo vozilo«, »Nova proga«), »Zasluge« (licence) |
| `docs/proge/<id>.md` | opis proge (oblika, višine, okolica, približki); `pikes.md` tudi `pikesg`, `toskana.md` tudi `grom` |
| `docs/igra.md` | opis igre po temah (fizika, štart, boksi, vreme, grafika, vozni park, razpadanje …), prej v `README.md` |
| `docs/orodje-za-napake.md` | načrt orodja za napake (sklopi, stanje) |
| `docs/deli.md` | dogovor z garažo o delih avtov (`car.deli`, `mounts`, `K.deli`, `DELI.mesh`, `DELI.effect`), serijski KOLIBRI, poskus na treh avtih, stanje sklopov in odločitve uporabnika (predaja naslednji seji), navodila sejam drugih avtov po kategorijah, vzporedne seje (katera seja ima katere elemente in datoteke), spremembe dogovora |
| `docs/misije.md` | načrt posebnih misij (pravila, odločitve uporabnika, sistem misij, skupine in stanje, predaja med sejami) |
| `docs/nove-proge.md` | načrt 8 novih prog (Bâlea, Furka, Gudauri, Llogara, Porto Moniz, Yungas, Pau, Ngorongoro): pravila in odločitve uporabnika, odprti viri, seje A in B, zagon naslednje seje, seznam pravil, Recept, stanje |

## Teme v `js/game.js`

Naslovi razdelkov (iskanje: `grep -n "/\* ---------------- <začetek naslova>" js/game.js`):

- **nastavitve** `settings`, **stanje** `state`, **zasloni** `screens`, **izbira avta** `car select`, **izbira proge** `track select`
- **posnetek** `replay: the race recorded` — `recStart`, `recStep`, `replayStart`, `replayEnd`, `replayUI`, `replayAct`, `replayFrame`, `REC_MAX` (20 min), `RP_CAM`, `RP_SPEED`; časovnica `rpLineBind` (tap, vlečenje), skok na čas `rpSeek`, iskanje sličice `rpIdx` (zadnja sličica do časa t), čas `rpClock` (00:41.3); stikalo Cel posnetek | Zastavice (`replay.mode`; način Zastavice `rpZGo`, `rpZCur`, zanka od `RP_ZB` 2 s pred do `RP_ZA` 1 s po zastavici v `replayFrame`, `replay.zt`; točke iz `Napake.tocke`); poza vseh avtov ob času `rpPoseAll`; biti avta v sličici (`REC_W`, sedmo število): 1 zavira, 2 postavljen nazaj na cesto od prejšnje sličice (`Race.putBack`, `race.putT`: kliče ga `Race.rescue`), 4 ne dirka (boksi, cilj, odstop), od 8 prevračanje; zastavice dirke `recd.flags` (`{ t }`, `rpFlag`; za teste `window.__game.recFlags`); za orodje za napake `NK_HOOKS` (kljuke za `Napake.init`), `rpInfo` (čas, krog `rpLap`, metri od štarta `rpS`, x, z), `rpWhere` (avto ob času iz posnetka), `rpMeta` (žig `js/game.js`, proga, način, vreme), `rpMap` (črta proge), `rpShotAt` (slika ob drugem času), `rpInLoops` (kaj je v krogu: projekcija s kamero `Render.camera`, točka v mnogokotniku; imena spodaj); `replayUI` kliče `Napake.sync`, `replayEnd` kliče `Napake.konec`, `showScreen` kliče `Napake.dirka` (gumb zastavice, ne v dirki s prijateljem); plošček Select v `padFrame`, tipka F `Input.onFlag`
- **Posnetek do sem** (gumb v pavzi `pause-rp`, tipka I: `Input.onReplay`) — `rpHereOk`, `rpHere`, `replay.here` (`keep`, `wait`), shranjevanje in vračanje stanja avtov `rpKeep` / `rpBack`, Nazaj v dirko `rpRace`, odštevanje 3 · 2 · 1 `rpCd`, `cdStep` (v glavni zanki), `cdOff` (pavza ga ustavi); `RP_BACK` (začetek 10 s pred zdaj)
- **najboljši trenutki** `replayHL`, video trenutka `the best moment as a video` (`hlvStart`, `hlvStop`)
- **Foto** `photo mode` — `photoStart`, `photoSave` (slika, Web Share, prenos), `photoEnd`
- **duh** `ghost of the best run`, sledi gum zadnjih voženj `the tyre marks of the last time trial runs`
- **deljenje** profila in izziv `sharing`, `a challenge (Izziv)`
- **dirka** `race lifecycle` (`pause`, `resume`, start, konec), `per-step race logic`, `phases`
- **HUD** `HUD`, `time trial HUD`, `the timing tower` (`S.tower`: 0 Izklop, 1 Zgoraj `#tw-strip`, 2 Ob zemljevidu `#h-tower`; `twCls`), uničen avto, `the wheel rule` (`WHEEL_RULE`, `TYRE_RULE`; ZAMENJAJ KOLO `swapHUD`, okrogel za KOLIBRI), gume KOLIBRIJA na zaslonu `ktHUD` (`KT_HUE`), prazno pod uro `setBest`
- **odprta cesta** (Vršič: promet, policija) `the open road`, `the police radio`
- **boksi** `pit stops`, radio ekipe `the team radio`
- **sovoznik** `the co-driver`, **komentator** `commentator`
- **kvalifikacije**, **kariera**, **prvenstvo**, **šola vožnje**, **Pikes Peak** (razredi, opozorila, medalje), **skoki** `jumps`
- **internet** `a race with a friend over the internet`, `a championship over the internet`
- **plošček v menijih**, **Kontrole** `Kontrole (from Nastavitve)`
- **števec sličic** `the frame counter` (`PH`: naslov `?fps` ali prikaz za razvijalca `PH.dev`, okvirček `#ph-fps` zgoraj levo; `PH.tick`, `PH.s` koraki, `PH.r` risanje; vrstice prikaza za razvijalca `phMore`: klici risanja in oglišča iz `renderer.info` (med prikazom `autoReset` izklopljen: vsi prehodi sličice), `s` in krog, tema in podrobnosti `TIER_IME[detailTier()]`, `race._lod`); v glavni zanki ob `PH.tick` še `Napake.okvir` (zatikanja)
- **polje in štart:** `NUM_AI` 21 (22 avtov), `CH_AI` 19 (prvenstvo), `PLAYER_GRID` 999 (igralec zadnji v polju); leteči start `flyStep`, `flyHUD`, `FLY_T`
- **hiter vstop** `the quick entry` (`quickGo`, `quickRun`): naslov `?proga=<id>&nacin=<način>&t=<s>&vreme=suho|dez&avto=<id>&seme=<n>` odpre dirko brez menija; branje naslova `Core.quickArgs`; za teste `window.__game.quick` (opis v `tests/README.md`)
- **testni način, ponovljive dirke** `the test mode` (`repro`, `grand`): hitri vstop vklopi testni način za ves obisk; seme dirke je `seme` iz naslova (privzeto 1), `Race` dobi `repro: true`; vreme, ki ga nastavitve prepustijo naključju, megla na Big Suru in čakanje luči pred štartom so iz toka istega semena, novega za vsako dirko (`newRace`). Za teste `window.__game.repro`, `window.__game.recSum()` (povzetek posnetka)
- **glavna zanka** `main loop`, **dogodki** `events` (`switch (act)` za `data-act`), **aplikacija** `the game as an app`, **most do menija** `the menu's bridge`, **zagon** `boot`

## Orodje za napake (`js/napake.js`)

Modul `Napake` (naložen pred `js/game.js`; `init` dobi kljuke `NK_HOOKS` iz igre: `replay`, `rec`, `stop`, `seek`, `span`, `shot`, `info`, `toast`, `ui`, `where`, `meta`, `map`, `shotAt`, `flag`, `flags`, `inLoops`, `track`, `recW`, `dev`, `kje`, `rrp`, `open`, `view`). Gradi svoj DOM v `#replay-ui`: gumb `#nk-on` (Označi) pred Foto, platno `#nk-cv`, oblački `#nk-bubs`, paleta `#nk-pal` (v `.rp-bot` pred časovnico; ležeče `position: fixed` ob levem robu), gumba `#nk-bar` (Dodaj k zbirki, Zapri). Med označevanjem ima `#replay-ui` razred `mark`.

- **označevanje** `open`, `close`, `act` (svinčnik, barve `BARVE`, razveljavi `undo`, radirka `rub`), risanje `down` / `move` / `up` / `draw`; črte v deležih zaslona (0..1); sklenjen krog `isLoop`
- **oblački** `bubbles` (en oblaček na barvo, dokler je na sliki krog te barve; zapis v `M.notes`), postavitev ob krogu `place`, prostor `room` (mimo palete in časovnice), premik `grip`
- **zbirka** `add` (trenutek: čas, krog, `s`, x, z, slika `G.shot` 1280 px, slike gibanja `gib` ob `GIB` −0,6/−0,3/+0,3 s, 400 px, oznake, `zapisi`; vsak zapis ima `v`: kaj je v krogih njegove barve, `G.inLoops`, izračunano pred slikami), zastavice na časovnici `flags` (`.nk-flag`, zastavice dirke `.nk-flag.dirka` ⚑, tap: `seek`), točke za način Zastavice `tocke`, zastavice dirke, ki jih nadomesti trenutek `pokrite`, `sync` (nov posnetek: nova zbirka; gumb Deli `#nk-deli`); `Napake.zbirka`, `Napake.stanje` za teste
- **zastavica med dirko** gumb `#nk-fl` (za `#btn-pause`, skrit z njim: css), `dirka` (iz `showScreen`), `flag` (gumb, tipka, plošček)
- **poročilo** `porocilo` (besedilo `RRA-NAPAKE`, ime datoteke, naprava `naprava` / `devIme` / `devKoda`, `MODELI`), slika `sestavi` / `list` (postavitev), `moment`, `marks`, polje podatkov `polje`, zemljevid `zemljevid`; `pripravi` (slika enkrat na različico zbirke `verOf`, shrani v IndexedDB)
- **shranjeno v igri** IndexedDB `rra-napake` / `slike` (`dbPut`, `dbAll`, `dbDel`, `dbSet`, `dbMark` → Poslano; zadnjih 100 `DB_MAX`, polne slike najnovejših 20 `DB_FULL`, starejši `lite`: mala slika in besedilo), `Napake.shranjene()`, za teste `Napake.zg`
- **Zgodovina napak** (sklop 18) `zgodovina` (`#nk-zg`; gumb `data-nk="zg"` v `#nk-bar`, v izbiri, v Nastavitvah orodja), seznam `seznam(box)` (vrstica `.nk-item`, stanje `stPill`), zapis `zgEna` (stanja `STANJA`, `stOf`: neposlano, poslano, popravljeno, zaprto; `.nk-sts`), `zgRec` (zapis brez slik: mala slika), `vseNeposlane`, `zgOsvezi`; za teste `Napake.stanje.zg`
- **pošiljanje** `deli` (Web Share), `shrani` (prenos), `kopirajSliko`, `kopirajBesedilo`, `dejanje`, `done` (Poslano, Obdrži tudi slike v igri: brez nje `lite`); izbira `izbira` (`#nk-dlg`), ob koncu posnetka `konec`
- **nastavitve orodja** `tdgp-napake` (`N`, `NK_DEF`: `on`, `end`, `flag`, `size`, `keep`, `dev`), vrstica v Nastavitvah `.nk-setrow` (v angleščini skrita), panel `nastavitve` (`#nk-set`), seznam `seznam`, dnevnik v panelu `dnPanel` (Kopiraj, Počisti)
- **dnevnik napak** `D` (`D.l`, zadnjih 50 `LOG_MAX`, shranjen v `tdgp-napake-dnevnik`, `dLoad` / `dSave`): `zapis` (`window` `error` → `napaka`, `unhandledrejection` → `obljuba`; isto sporočilo zapored se samo šteje, `x`), zatikanja `okvir(now, on)` / `zEnd` (sličice več kot 50 ms narazen več kot 1 s, `ZAT`; samo med vožnjo dirke), zapis `REC` (posnetek, ki mu zapis pripada; samo v pomnilniku), v poročilu `dnevnik` (ta dirka in napake tega obiska) in vrstice `dVrstica` (`D …`); za teste `Napake.dnevnik`
- **prikaz za razvijalca** `dev` (tipka O, `N.dev`, `apply` → kljuka `dev` → `PH.dev` v `js/game.js`)
- **samodejne zastavice** `zaznaj(R, T, W, S, out, i0, i1)` (pregled sličic posnetka; meje `AZ`, vrste `VRSTE`: `obtical`, `preskok`, `poskok`, `pod_cesto`, `nazaj`, iz dnevnika `zatik`), pregled po kosih `aIsci` / `aKos` (6 ms naenkrat, samo v posnetku; stanje `A`), seznam `samodejne` (brez zavrženih), potrjene `potrjene` (v `tocke` kot `samo`, v poročilu `!n …`, na zemljevidu sive), na časovnici `.nk-auto` (siva !, potrjena bela), okence `aPokazi` (`#nk-auto`: Potrdi / Zavrzi), `aSkrij`; za teste `Napake.samodejne`, `Napake.iskanje`, `Napake.zaznaj`, `Napake.porocilo()`
- **datoteka s posnetkom** `.rrp` (sklop 12): zapis `rrpPisi` (glava iz kljuke `rrp` → `rrpOf` v `js/game.js`, plus naprava, datum, dnevnik te dirke `dn`) → `rrpPack` (`RRP1`, dolžina glave, glava JSON, vzorci Float32 po številkah: druga razlika bitov, zigzag, 4 ravnine bajtov) → gzip (`CompressionStream`); branje `rrpBeri` / `rrpUnpack` (preverjanje glave in časov), odpiranje `rrpOdpri` → kljuka `open` (`rrpOpen` v `js/game.js`: dirka s temi avti, ki se ne stopa, `recd.file` = glava; `replayEnd` nato naslovnica, `rpMeta` vrne podatke datoteke); `rrpShrani` (prenos `posnetek_<proga>_<LLLLMMDD-UUMM>.rrp`); gumbi: Nastavitve orodja → Posnetek dirke (Shrani, Odpri …, `.nk-rrp-in`), izbira → Shrani posnetek (.rrp); za teste in orodje `Napake.rrp` (`pisi`, `beri`, `odpri`, `shrani`, `pack`, `unpack`, `pojdi`, `kje`, `slika`)

## Teme v `js/core.js`

- **proga** `Track` (`T.idx`, `T.ds`, `T.px/pz/hy`, `T.len`, `startS`), stranske ceste `side roads ("stubs")`, ograje Medvod
- **avto** fizika (`Car`; klasična `stepCS`, `CSK`; nova `stepNova`, `NVK`, `NVASSIST`, zdrs telesa v ovinku `Car.nvA`, drseči slog `Car.nvSl`, trki avtov `carCollide` in posledice trka `carKnockFx`), preizkusne nastavitve tekmecev in trkov `TX` / `setTest` / `txv` (Nastavitve: kategorija »Preizkus: tekmeci in trki«, `#set-test`; stopnje `TEST_LV`, slog `TEST_REAL`, `testOf` v `js/game.js`; realističen trk: ravni odbijači `rbCollide` / `rboxHit` / `RB_*`, občutek teže `heavyK`, gume ob potisku `cSlide` in `cSx`/`cSz` v `stepCS`, tekmeci z ravnimi odbijači `aiReach` / `RB_FOL`, brez isker `c.fxQ`), nadgradnje `car upgrades`, deli iz garaže `the garage's parts` (`applyDeli`: `Car` z `opts.deli`, dirka `playerDeli`), deli vozil `a registered vehicle's parts`
- **gume KOLIBRIJA** `KT`, `ktGrip`, `ktWear`, `ktHit`, `ktFire` (guma zagori pri 80 % poškodbe; `Car.kt`, možnost `tyreRule`; pravilo koles `rule.kt` v `wheelRule` / `_wreckStep`)
- **predmeti** razbitine `debris lying on the road`, podrti predmeti ob progi `loose trackside props`
- **AI** `aiControl`, `aiDefend`, `aiWaits`, `aiModel`; vožnja po stranski cesti
- **dirka** `Race`: liki `the characters`, boksi `pit lane`, zastave `flags`, strategija in radio
- **leteči start** `Race._flyColumn` (kolona pred črto, `race.flyOn`, `FLY_GAP` …), široka štartna mreža `_gridWide`
- **nivo podrobnosti fizike** velikih polj `LOD` (nad `LOD.min` 30 avti, npr. Nürburg 100), `Race._lodPlan`, `Race.lodT` (vmesni položaj za izris in posnetek)
- **hiter vstop** `quickArgs(search)` (naslov → proga, način, `t`, vreme, avto, neveljavni deli)
- **naključje** `rng(seed)` (mulberry32). Naključni dogodki dirke (kolo odpade, razbitine in predmeti, predrta guma, reakcije in napake AI) so iz `rand()`: številke dirke, ki se stopa (`Race.rnd`; `RAND` nastavita `Race.step` in `aiControl`). Ponovljiva dirka (`opts.repro`) jih vzame iz semena (`opts.seed`), sicer `Math.random` kot doslej. Promet (`Traffic.R`) in policija (`R`, `RD`) imata vedno svoje tokove iz semena; vizualni učinki v `js/game.js` in `js/render.js` ostanejo naključni

## Teme v `js/render.js`

Naslovi `/*  <naslov>`: telesa avtov `car body definitions`, nova vozila `the new cars`, kit vozil (deli iz garaže: `K.deli`, telo z deli `kitEntry(M, hi, deli)`, `deliMesh`; razpoka v vsakem oknu `crackPanes`; gladko senčenje `K.skin` z `smooth`), `materials`, `ghost`, `particles`, `car light glows`, **sledi gum `skid marks`**, sledi zadnjih voženj, dež, mokra cesta, pljuski, ptice, podrti predmeti `knockable trackside props`, svetloba Pikes Peaka, sonce, letni čas in čas dneva `setAtmos`, lesk asfalta, `post-processing`, `race attach`, zastave in varnostni avto, boksi `pit crews` (mehaniki pri Nizki po velikosti na zaslonu: `updateCrew`, preprosti komplet `crewGeosLo`), odprta cesta, `per-frame`, deli in razbitine, razbijanje `Razbijanje · nov način`, motor (dim, ogenj), **kamera `camera`**, prelet proge, nebo `the sky`, idealna linija `setLine`, šola vožnje `setMarks`, salon `showroom`. `Render.snapshot` naredi sliko za Foto. Videz prog je v `THEMES` (meglica, sonce, nebo, `tint`, `sat`; `fogK`: daljši pogled, meglica dlje od kamere, npr. Bathurst) in `SPLIT` (barvni odtenek senc in svetlih delov).

## Proge in graditelji sveta

`build()` v `js/world.js` izbere graditelja po `theme` iz `js/tracks/<id>.js`. Testne proge (`test: true`) se po `CLAUDE.md` ne urejajo.

| id | Ime | Tema | Graditelj (`js/world.js`, razen kjer piše drugače) |
|---|---|---|---|
| balea | Bâlea, Romunija | balea | `js/world-prelaz.js` (`buildPrelaz`, videz `PL_LOOK.balea`: portal predora, žičnica, jezero, ovce) |
| baldy | Mount Baldy, ZDA | baldy | `js/world-baldy.js` (`buildBaldy`) |
| bangsaen | Bang Saen, Tajska | bangsaen | `js/world-bangsaen.js` (`buildBangsaen`) |
| bathurst | Bathurst, Avstralija | bathurst | `js/world-rbring.js` (`buildRbring`, videz `RB_LOOK`: tekstura pašnika `btGrassTex`, obrabljen rob ob asfaltu `edge`, usek pri 4. zavoju `cut` in breg nad njim `cutBank`) |
| beartooth | Beartooth, ZDA | beartooth | `js/world-beartooth.js` (`buildBeartooth`) |
| bigsur | Big Sur, ZDA | bigsur | `js/world-bigsur.js` (`buildBigSur`) |
| caracoles | Los Caracoles, Čile | caracoles | `js/world-caracoles.js` (`buildCaracoles`) |
| chapman | Chapman's Peak, Južna Afrika | chapman | `js/world-chapman.js` (`buildChapman`) |
| cpalace | Crystal Palace, Anglija | cpalace | `js/world-rbring.js` (`buildRbring`, `RB_LOOK`, `cpPark`) |
| detroit | Detroit, ZDA | detroit | `js/world-detroit.js` (`buildDetroit`) |
| greatalpine | Great Alpine Road, Avstralija | greatalpine | `js/world-greatalpine.js` (`buildGreatAlpine`) |
| harju | Harju, Finska | harju | `js/world-harju.js` (`buildHarju`) |
| hotham | Mount Hotham, Avstralija | hotham | `js/world-hotham.js` (`buildHotham`) |
| iroha | Irohazaka, Japonska | iroha | `js/world-iroha.js` (`buildIroha`) |
| katu | Katu-Jaryk, Rusija | katu | `js/world-katu.js` (`buildKatu`) |
| longford | Longford, Avstralija | longford | `js/world-longford.js` (`buildLongford`) |
| marrakesh | Marrakesh, Maroko | marrakesh | `js/world-marrakesh.js` (`buildMarrakesh`) |
| maunakea | Mauna Kea, ZDA | maunakea | `js/world-maunakea.js` (`buildMaunakea`) |
| medvode | Medvode, Slovenija | medvode | `js/world-medvode.js` (`buildMedvode`) |
| moki | Moki Dugway, ZDA | moki | `js/world-moki.js` (`buildMoki`) |
| monaco | Monte Carlo, Monako (testna, `test: true`) | monaco | splošni `build()` (`MC_TER`) |
| monterey | Monterey, ZDA | monterey | `js/world-monterey.js` (`buildMonterey`) |
| montreal | Montréal, Kanada | montreal | `js/world-montreal.js` |
| mulholland | Santa Monica Mountains, ZDA | mulholland | `js/world-mulholland.js` (`buildMulholland`) |
| newcastle | Newcastle, Avstralija | newcastle | `js/world-newcastle.js` (`buildNewcastle`) |
| nring | Nürburg, Nemčija | nring | `js/world-nring.js` (`buildNring`) |
| ouninpohja | Ouninpohja, Finska | ouni | `js/world-ouni.js` (`buildOuni`) |
| palomar | Palomar Mountain, ZDA | palomar | `js/world-palomar.js` (`buildPalomar`) |
| pikes, pikesg | Pikes Peak, ZDA (asfalt, makadam) | pikes | `js/world-pikes.js` (`buildPikes`) |
| rastro | Rio do Rastro, Brazilija | rastro | `js/world-rastro.js` (`buildRastro`) |
| rbring | Štajerska, Avstrija | rbring | `js/world-rbring.js` (`buildRbring`) |
| rio | Rio de Janeiro, Brazilija | rio | `js/world-rbring.js` (`buildRbring`, `RB_LOOK`; tla za kamero za avtom: `rioGround`, `rioVerge`, `rioRoad`, `rioApron` prek `LK.ground`, `LK.verge`, `LK.road`, `LK.apron`) |
| riverside | Riverside, ZDA | riverside | `js/world-riverside.js` (`buildRiverside`) |
| sani | Sani Pass, Južna Afrika | sani | `js/world-sani.js` (`buildSani`) |
| spa | Spa, Belgija | spa | `js/world-spa.js` (`buildSpa`) |
| suzuka | Suzuka, Japonska | suzuka | `js/world-suzuka.js` (`buildSuzuka`) |
| tianmen | Tianmen, Kitajska | tianmen | `js/world-tianmen.js` (`buildTianmen`) |
| toronto | Toronto, Kanada | toronto | `js/world-toronto.js` |
| townsville | Townsville, Avstralija | townsville | `js/world-townsville.js` |
| troisrivieres | Trois-Rivières, Kanada | troisrivieres | `js/world-troisrivieres.js` (`buildTroisRivieres`) |
| uncompahgre | Uncompahgre, ZDA | uncompahgre | `js/world-uncompahgre.js` (`buildUncompahgre`) |
| vrsic | Vršič, Slovenija | vrsic | `js/world-vrsic.js` (`buildVrsic`) |
| *gora* | *Gorski reli (test)* | mountain | splošni `build()` |
| *gozd* | *Bakreni gozd (test)* | forest | splošni `build()` |
| *grom* | *Gromski rt (test)* | kamp | splošni `build()` |
| *jezero* | *Jezero Ring (test)* | lake | splošni `build()` |
| *riviera* | *Riviera (test)* | city | splošni `build()` |
| *toskana* | *Toskana (test)* | italia | splošni `build()` |

Pomočniki koridorja (Vršič, Los Caracoles) so skupni več gorskim cestam; skupne funkcije so v `js/world-vrsic.js` in `js/world-caracoles.js` (druge gorske ceste jih dobijo prek `World.api`; zato se ti datoteki naložita prej). Pomočniki koridorja Nürburga (`nrPrep`, `nrGround` …), gledalci (`crowd…`) in skupni deli vseh svetov (oblaki, sledi gum, obraba ceste, trava, `finish`, table pred zaviranjem, TV helikopter) ostanejo v `js/world.js`. Skupni elementi ob progi so npr. `brakeBoards` (table pred zaviranjem), `wornGrass` (obrabljena trava) in `gravelSeams` (obrabljen prehod asfalta v makadam, zdaj samo v Medvodah; maski riše `gravelSeamMasks`).

## Testi po temah

- **Hiter vstop:** `tests/quick.test.js` (naslov), `tests/browser/quick.test.mjs` (igra)
- **Ponovljive dirke** (seme, testni način): `tests/repro.test.js` (jedro), `tests/browser/repro.test.mjs` (igra s hitrim vstopom)
- **Posnetki pred/po:** `tools/shot.mjs` (možnosti: `tests/shot.test.js`), na GitHubu `posnetki.yml`; predogled vej `stran.yml`, `tools/predogled.mjs`
- **Poganjanje testov** (`--shard`, `--related`, `--quiet`): `shards.test.js`
- **Občasni padci brskalniških testov** (vzroki in popravki: `share`, `radio`, `carlow`, `weather`, `pits`): `docs/orodje-za-napake.md`, sklop 3b
- **Posnetek:** `tests/browser/replay.test.mjs` (tudi časovnica, sličice, ±5 s, Posnetek do sem in vračanje stanja avtov na Bathurstu, 12 gumbov v vrstah), video trenutka `hlvid.test.mjs`
- **Orodje za napake:** `tests/browser/napake-samodejno.test.mjs` (prikaz za razvijalca O, dnevnik: napaka, obljuba, zatikanje; v krogu: tekmec, cesta, kraj; samodejne zastavice: `zaznaj` na umetnem posnetku, Potrdi / Zavrzi, poročilo), `tests/browser/napake.test.mjs` (Označi: paleta ležeče in pokonci, krogi in oblački, razveljavi, radirka, premik oblačka, zbirka in zastavice; Zgodovina napak: stanje, ohranjanje po deljenju, meja 100/20), `napake-slika.test.mjs` (zbirna slika, besedilo, izbira, deljenje, shranjene napake, nastavitve), `napake-zastavice.test.mjs` (gumb, F, Select, način Zastavice, nastavitve)
- **Datoteka s posnetkom:** `tests/browser/napake-posnetek.test.mjs` (Shrani v nastavitvah orodja, branje do zadnjega bita, ne-posnetek, Odpri … na naslovnici, poročilo iz datoteke, `pojdi`, Končaj, `tools/posnetek.mjs`)
- **Foto in deljenje:** `share.test.mjs`
- **Kontrole:** `ctrl.test.mjs`, `pad.test.mjs`
- **Deli iz garaže:** `deli.test.js` (seznam, učinki, fizika na ravni plošči, vse možnosti na avtih z `mounts`, `Render.deliMesh`)
- **Gume KOLIBRIJA:** `kolibri-tyres.test.js` (Node), `browser/kolibri-hud.test.mjs` (pike, ZAMENJAJ KOLO, tabela zgoraj, gumbi, nastavitve; pokonci in ležeče)
- **Meni:** `menu.test.mjs`; jezik `lang.test.mjs`, `tests/lang.test.js`
- **Svet in grafika:** `world.test.mjs` (samo nekatere proge: `WORLD_ONLY`; reference veljajo za Chromium Playwrighta iz `package.json`), `gfx.test.mjs`, `perf.test.mjs` (meje iz `tests/golden/perf.json`; prave proge do 300 klicev in 900k oglišč v povprečju in na najzahtevnejšem mestu), `memory.test.mjs`, prehod asfalt–makadam `seams.test.mjs`
- **Dirke in fizika** (Node): `races.test.js`, `golden.test.js`, nova fizika `nova.test.js` (ploskev: `tests/lib/handling.js` z `'nova'`), `roll.test.js`, `corner.test.js`, `knock.test.js`, testi prog `<id>.test.js`
- **Velika polja in štart** (Node): `grid.test.js` (22, 20 in 100 avtov), `field.test.js` (Nürburg 100), `lod.test.js` (nivo podrobnosti fizike), `start.test.js`; brskalniški `flystart.test.mjs`
- **Opisi:** `fleet.test.js` pregleda vse `.md` (tudi `docs/`) za ime znamke
- **Opis vseh testov:** `tests/README.md` (velik; išči po imenu testa)

## Imena v poročilih o napakah

Besedilo `RRA-NAPAKE` (`porocilo` v `js/napake.js`). Vrstica zapisa: `#n čas Kkrog s=…m barva »zapis« v_krogu=[…]`. Imena v `v_krogu` (`rpInLoops` v `js/game.js`; vsako je nekaj točk, projiciranih na zaslon s kamero posnetka; v krogu je, če je točka v kateri od zank te barve):

| Ime | Kaj je | Kje v kodi |
|---|---|---|
| `ti` | igralčev avto | `race.player`; v posnetku `recd.cars[k]` z `isPlayer` |
| `tekmec#n` | tekmec, `n` je indeks v seznamu avtov | `race.cars[n]` (= `recd.cars[n]`, v posnetku `replay.k`); v konzoli `window.__game.race.cars[n]` |
| `varnostni_avto` | varnostni avto | `race.fl.sc.car` (v posnetku `replay.sc`) |
| `predmet:<kind>#j` | podrt predmet ob progi (stožec, stebriček, gume, bale …), `j` je indeks | `race.props[j]` (`Race.setProps`, seznam iz `World.build` `out.props`), oblika `propGeometry(kind)` v `js/render.js`, fizika `PROPK` v `js/core.js` |
| `+n predmetov` | več kot 8 predmetov v krogu | `IN_PROPS` |
| `kraj:<ime>` | poimenovan kraj proge (ovinek, prelaz …) | `track.names` (iz `def.names` v `js/tracks/<id>.js`) |
| `boksi` | boksi (pas za postanke) | `def.pit`, `Track.pitAt` |
| `cesta:i0-i1` | odsek ceste med vzorcema `i0` in `i1` (2 m narazen; sredina ali rob v krogu, do 700 m od kamere `IN_ROAD`) | `track.px[i]`, `track.pz[i]`, `track.hy[i]`; metri od štarta ≈ `i · track.ds − track.startS` |

Druge vrstice: `⚑n` zastavica med dirko, ki ni označena (`recd.flags`); `!n čas Kkrog s=…m <vrsta> <avto> »opis« (samodejna zastavica)` potrjena samodejna zastavica (`zaznaj`, vrste zgoraj pri samodejnih zastavicah; `obtical` avto stoji več kot 5 s, `preskok` več metrov v eni sličici, `poskok` navpično, `pod_cesto` pod cesto, `nazaj` tekmec v napačno smer, `zatik` zatikanje iz dnevnika); `D …` zapis dnevnika (`dVrstica`: `napaka »sporočilo« datoteka:vrstica:stolpec (×n)`, `obljuba »…«`, `zatik 1,4 s · 8 sličic/s · najdaljša 420 ms`; čas dirke ali `ob UU:MM:SS` zunaj dirke).
