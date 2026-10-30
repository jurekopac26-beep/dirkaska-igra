# Posebne misije · načrt

Načrt za 33 posebnih misij. Odločitve so iz pogovora z uporabnikom (29. 10. 2026). Nova seja dobi vse, kar potrebuje, iz tega dokumenta in iz predaje na veji `slike-predlogi` (spodaj), zato velikih datotek ne bere na pamet.

**Kako se dela:** ena seja na skupino (tabela Stanje), navodilo »Naredi skupino N po docs/misije.md«. Vsaka skupina ima svojo vejo iz svežega `main` (`misije/skupina-<N>`) in en pull request za vse svoje misije (odločitev uporabnika 29. 10., vprašanje 10: 7 sej, PR na skupino; prej veja in PR na misijo: sistem #187, misija 06), ki ga seja odpre sama, ko so zeleni testi, ki se nanašajo na spremembo (`npm run test:related`). Združi ga seja sama, ko so zeleni vsi testi na GitHubu (odločitev uporabnika 29. 10.: »združi ti«). Ob koncu misije: posodobi Stanje, `docs/kazalo.md`, uporabniku napiši kratek seznam za preizkus na telefonu. Ob koncu skupine: kratka predaja za naslednjo skupino v razdelku Predaja.

## Pravila (uporabnik, 29. 10.)
- Predaja misij: `git fetch origin slike-predlogi:refs/remotes/origin/slike-predlogi`, `git worktree add ../slike origin/slike-predlogi`, nato `../slike/slike-predlogi/PREDAJA-MISIJE.md` (za vsako misijo proga, vozilo, zgodba, cilj, prikaz na zaslonu, časi). Slike: `misije-10/misijaNN.webp` (maketa), `listi/vse46-posebne-misije-5/kamera-blizu/kNN.jpg` (vozilo skozi kamero igralca). Slike ne gredo na `main`.
- Kodo misij piši v svojih datotekah (`js/missions.js`, `js/missions/m<nn>.js`, `css/missions.css`). V `js/newmap.js`, `js/nvmenu.js` in `js/game.js` samo kratki priklopi: te datoteke hkrati spreminja drug račun, ki prenaša novo mapo v kodo. Pred vsakim pull requestom spoji svež `main`.
- Vprašanja in predloge pokaži **v slikah** z oštevilčenimi možnostmi (kamera za avtom, telefon pokonci). Uporabnik izbere eno, v kodo gre samo izbrana.
- Uporabniku odgovarjaj kratko, v slovenščini. Za vsako misijo napiši, koliko ur še potrebuješ, da bo na `main`.
- Pravila iz `CLAUDE.md` veljajo tudi za misije (samo zemljepisna imena, nobenih znamk in imen resničnih oseb, ena kamera za avtom, obremenitev telefona).

## Varčevanje s tokeni (odločitev uporabnika, 29. 10.: »uporabi vseh 6 predlogov«)
1. **Ena seja na skupino** (tabela Stanje: 7 sej za preostale misije), ne ena dolga seja in ne seja na misijo; en PR na skupino.
2. **Skupni gradniki v `js/missions/kit.js`** (ogenj, voda, sneg, vozila iz preprostih teles, merilniki): misija jih uporabi, ne piše in ne išče znova. Ko narediš gradnik, ki ga bo rabila še druga misija, ga daj tja in ga zapiši v razdelek Sistem misij.
3. **Kratka predaja ob koncu seje** v razdelku Predaja: kje so gradniki, kaj je odločeno, kaj je odprto. Nova seja začne pri tem dokumentu in predaji misij, velikih datotek ne bere v celoti (`docs/kazalo.md`, grep).
4. **Manj slik med delom:** ena slika na misijo za preverjanje (kamera za avtom), ostalo preverijo testi. Uporabniku slike samo za vprašanja in na koncu misije.
5. **Vprašanja na začetku skupine:** vsa vprašanja skupine v eni sliki, preden se začne delo, da ni popravljanja.
6. **Kratki odgovori v klepetu,** brez ponavljanja stanja; podrobnosti so v pull requestu in tem dokumentu.

## Odločitve
1. **Kje igralec izbere misijo** (vprašanje 1): oboje. Na naslovnici ploščica MISSIONS (seznam vseh misij), na novi mapi pa so misije razdeljene po garažah; v vsaki garaži so misije od najlažje do najtežje. Razporeditev po garažah (vprašanje 5): **6 garaž po poklicu**, v vsaki od najlažje do najtežje: GASILCI 01, 49, 46, 47; REŠEVALCI 06, 02, 35, 19, 48, 37; TOVOR 50, 39, 07, 43, 51, 52, 54, 09; ZIMA 29, 33, 17, 53, 30; NA CESTI 26, 34, 04, 45, 40; DIVJINA 10, 55, 08, 23, 11. Garaže na mapo postavi drugi račun; misije v `js/nvmenu.js` dobijo samo kratek priklop.
2. **Gasilski avto** (vprašanje 2): verzija **C · Avtolestev** (`slike-predlogi/blender/modeli/v2.glb`, mere v `v2.json`). Uporabijo ga misije 01, 46, 47 in 49 (pri 49 se lestev dviga in izteguje).
3. **Seje** (vprašanji 3 in 10): po skupinah, za preostale misije 7 sej, en PR na skupino (tabela Stanje).
4. **Cilj misije 06** (vprašanje 4): bolnišnica in reševalni avto ob cilju.
5. **Napor pri lažjih misijah** (odločitev uporabnika 29. 10., vprašanje 6: 2): težje misije »high«, sedem lažjih (51, 54, 39, 02, 50, 17, 26) »medium«. Napor velja za celo sejo (`.claude/settings.json`: `effortLevel` je `high`) in ga seja pri zagonu nove seje ne more nastaviti; lažje misije so zdaj pomešane s težjimi (skupine 5, 6, 7), zato seja uporabnika ob zagonu skupine 6 opozori, da jo lahko v aplikaciji preklopi na »medium«.
6. **Čakanje na teste** (vprašanje 7: 2): seja odpre PR in dela naslednjo misijo, medtem ko na GitHubu tečejo testi; ko so zeleni, PR združi. Če test pade, ga najprej popravi.
7. **Preizkus na telefonu** (vprašanje 8: 2): po združitvi. Seja združi, ko so testi zeleni, in uporabniku napiše seznam za preizkus na `main`; napake popravi v naslednjem PR-ju.
8. **Ena seja naenkrat** (vprašanje 11: 1): skupine se delajo ena za drugo, nobene vzporedne seje (najmanj tokenov, brez sporov v skupnih datotekah).
9. **Veriga sej** (vprašanje 9: 1): seja ob koncu skupine sama zažene naslednjo. Hitri način: tri verige A 2→5→8, B 3→6, C 4→7, seje z več podagenti hkrati za neodvisne dele (uporabnik 30. 10.: »Začni, ugasni varčni način«); na varčni način (ena seja za drugo) se preklopi, ko uporabnik reče.

## Sistem misij (`js/missions.js`)
- `Missions.add(def)`: `id` ('06'), `title`, `story`, `goal`, `hint` (slovensko, angleščina v `js/lang.js`), `track`, `car`, `limit` (s), `stars` ([čas za 3, za 2]), `rows` (merilniki: `{ k, label, bar, col }`), `opts(def)` (možnosti dirke čez igrine: privzeto sam, ena vožnja, suho; npr. `traffic`, `numAI`, `tfCars`), `made(race)` (lastni avti, preden se narišejo), `begin(run)`, `step(run, dt)`, `finish(run)`.
- `run`: `t`, `left`, `set(k, besedilo, delež, barva)`, `say(namig)`, `win()`, `fail(zakaj)`, `add(obj)` (THREE predmet misije v sceni, odstrani se sam ob koncu).
- Igra: hitri vstop `index.html?misija=<id>`; priklopi v `js/game.js` (`MS`, `MisBridge`). Rezultat: zvezdice, čas, rekord (`localStorage` `rra-misije`).
- **Skupni gradniki v `js/missions/kit.js` (`MisKit`)**, naloži se pred misijami (`index.html`); v Node: `const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js')`:
  - `truckModel(id, over)`: vozilo misije kot kopija modela (npr. `truckModel('titan', { vLim: 105, kw: 560, len: 8.4 })`: gasilski avto na fiziki TITANA); v `opts` kot `playerModel`.
  - `fireTruck(run)`: gasilski avto C (avtolestev) iz preprostih teles na pogledu igralčevega avta (telo TITANA skrito, ~8 klicev risanja): lestev s petimi deli (`lift` 0–1,4 rad, `ext` 0–1: 7,2–33,6 m, `yaw`), koš, modre luči; `yawTo(x, z)` (kot vrtljive plošče proti točki), `tip()`, `nozzle()`, `len()`, `step(dt, luči)`.
  - `fire(run, max, { per, spread })`: plameni (Points, en klic risanja) in dim nad njimi (še en); `spot(i, x, y, z, velikost)`, 0 ugasne. `jet(run)`: curek vode (`set(od, do, vklop)`, `step`). `house(run, p, o)`: hiša z dvokapno streho (`burn(zgorelo, ogenj)`, mesta plamenov `fl`). `at(T, s, off)`: točka ob cesti (višina tal, smer ceste `ry`).
  - `aim(run, { plane: 'v' | 'g', focus, drive })`: merjenje s prstom (ploščica čez igro, obroč, gumb GASI), `on(true)` skrije gumbe za vožnjo (z `drive: true` ostanejo, ploščica samo nad cesto); `point`, `spray`; do prvega dotika merek na `focus`.
  - `hold(car)`, `hold(car, false)`: avto zadržan med delom posadke (`locked`, brez vzvratne).
  - `run.add(o)` z `o.userData.misUndo`: funkcija, ki jo `Missions` pokliče ob koncu (odstrani DOM misije, vrne telo avta).
  - Ime metode misije ne sme biti `goal`, `title`, `story`, `hint` (to so besedila, ki jih preverja `tests/missions.test.js`).
- Gradniki, ki jih misije že imajo: spremstvo kot dirkalni avto v podobi policije (`m06.js` `made`: `c.police`, `c.pol.mode = 'chase'`, promet se mu umakne; hitrost s `c.skCap`), promet samo avti in tovornjaki (`opts.tfCars`), noč (`Render.setAtmos`), stavbe in vozila iz preprostih teles (`m06.js` `hospital`).
- Slike za preverjanje: `node tools/misija-slika.mjs <id> [--t 20,60] [--pred 60] [--konec] [--pokonci] [--lezece]` (kamera za avtom s prikazom misije, v `test-results/misije/`, z vrstico stanja misije); ne piši svoje skripte.
- Testi: `tests/missions.test.js` (sistem in besedila vseh misij), za vsako misijo `tests/m<nn>.test.js` (brez brskalnika) in `tests/browser/m<nn>.test.mjs`; dodaj jih v `tests/run.js` (`SUITES`, `RELATED`) in `tests/README.md`.

## Stanje

| Skupina (seja) | Misije | Ocena (h) | Stanje |
|---|---|---|---|
| 0 | Sistem misij | – | končano (PR #187) |
| 1 | 06 | – | končano (PR #193) |
| 2 · ogenj, gasilski avto C | 01, 49, 46, 47 | 13–20 | narejeno (veja `misije/skupina-2`) |
| 3 · voda | 19, 35, 37, 48 | 14–20 | |
| 4 · sneg | 30, 33, 53 | 10–13 | |
| 5 · tovor | 07, 09, 43, 51, 52, 54 | 16–23 | |
| 6 · živali in mirna vožnja | 10, 39, 55, 02, 34, 50 | 16–23 | |
| 7 · vleka, žaromet, led, baterija | 04, 08, 17, 26 | 10–14 | |
| 8 · ostalo, garaže in naslovnica | 11, 23, 29, 40, 45; 6 garaž po poklicu, ploščica MISSIONS | 18–25 | |

## Predaja
- Po skupini 1: sistem in misija 06 sta narejena. Naslednja je skupina 2 (ogenj): gasilski avto C iz `v2.glb` (THREE je r128, `GLTFLoader` ni v repozitoriju: avto zgradi iz preprostih teles po merah v `v2.json` ali `blender/gas.py`), ogenj, curek vode, gašenje s prstom.
- Po skupini 2: gasilski avto C, ogenj, dim, curek in merjenje s prstom so v `js/missions/kit.js` (Sistem misij). Misije: 01 Vršič (hiša pod vrhom, gašenje stoje), 49 Suzuka (lastno panoramsko kolo ob zadnji ravnini, lestev z drsnikoma DVIGNI in IZTEGNI), 46 Uncompahgre (lastni predor, dim kot prekrivalo s pikami utripalk in izhodov), 47 Great Alpine Road (rob ognja iz celic, gašenje med vožnjo, jezerce). Testi brskalnika vozijo z avtopilotom in `r.autoSpray` / `r.auto` (curek in lestev brez prsta); med `sim` pogled avta zaostaja, zato logika misije računa doseg iz fizike (`P.x`, `P.z`), ne iz narisanega avta. Kamera ostaja za avtom (cilj stoji pred avtom). Naslednja v verigi A je skupina 5 (tovor); skupini 3 in 4 delata verigi B in C. Za skupino 3 (voda): začni od veje `misije/skupina-3` (ustavljena veriga B je tam pustila vodne gradnike v `js/missions/kit.js` in osnutke m19, m35, m37, m48, brez testov, prevodov in dokumentov; spoji svež `main`). Javljeno: na `main` daljni teren `tsvFar` v `js/world-townsville.js` od s ≈ 1470 m naprej zakrije pogled (misija 19).
