# Posebne misije · načrt

Načrt za 33 posebnih misij. Odločitve so iz pogovora z uporabnikom (29. 10. 2026). Nova seja dobi vse, kar potrebuje, iz tega dokumenta in iz predaje na veji `slike-predlogi` (spodaj), zato velikih datotek ne bere na pamet.

**Kako se dela:** ena seja na skupino (tabela Stanje), navodilo »Naredi skupino N po docs/misije.md«. Vsaka misija ima svojo vejo iz svežega `main` (`misije/<nn>`) in svoj pull request, ki ga seja odpre sama, ko so zeleni testi, ki se nanašajo na spremembo (`npm run test:related`). Združi ga seja sama, ko so zeleni vsi testi na GitHubu (odločitev uporabnika 29. 10.: »združi ti«). Ob koncu misije: posodobi Stanje, `docs/kazalo.md`, uporabniku napiši kratek seznam za preizkus na telefonu. Ob koncu skupine: kratka predaja za naslednjo skupino v razdelku Predaja.

## Pravila (uporabnik, 29. 10.)
- Predaja misij: `git fetch origin slike-predlogi:refs/remotes/origin/slike-predlogi`, `git worktree add ../slike origin/slike-predlogi`, nato `../slike/slike-predlogi/PREDAJA-MISIJE.md` (za vsako misijo proga, vozilo, zgodba, cilj, prikaz na zaslonu, časi). Slike: `misije-10/misijaNN.webp` (maketa), `listi/vse46-posebne-misije-5/kamera-blizu/kNN.jpg` (vozilo skozi kamero igralca). Slike ne gredo na `main`.
- Kodo misij piši v svojih datotekah (`js/missions.js`, `js/missions/m<nn>.js`, `css/missions.css`). V `js/newmap.js`, `js/nvmenu.js` in `js/game.js` samo kratki priklopi: te datoteke hkrati spreminja drug račun, ki prenaša novo mapo v kodo. Pred vsakim pull requestom spoji svež `main`.
- Vprašanja in predloge pokaži **v slikah** z oštevilčenimi možnostmi (kamera za avtom, telefon pokonci). Uporabnik izbere eno, v kodo gre samo izbrana.
- Uporabniku odgovarjaj kratko, v slovenščini. Za vsako misijo napiši, koliko ur še potrebuješ, da bo na `main`.
- Pravila iz `CLAUDE.md` veljajo tudi za misije (samo zemljepisna imena, nobenih znamk in imen resničnih oseb, ena kamera za avtom, obremenitev telefona).

## Varčevanje s tokeni (odločitev uporabnika, 29. 10.: »uporabi vseh 6 predlogov«)
1. **Ena seja na skupino** (tabela Stanje), ne ena dolga seja in ne seja na misijo.
2. **Skupni gradniki v `js/missions/kit.js`** (ogenj, voda, sneg, vozila iz preprostih teles, merilniki): misija jih uporabi, ne piše in ne išče znova. Ko narediš gradnik, ki ga bo rabila še druga misija, ga daj tja in ga zapiši v razdelek Sistem misij.
3. **Kratka predaja ob koncu seje** v razdelku Predaja: kje so gradniki, kaj je odločeno, kaj je odprto. Nova seja začne pri tem dokumentu in predaji misij, velikih datotek ne bere v celoti (`docs/kazalo.md`, grep).
4. **Manj slik med delom:** ena slika na misijo za preverjanje (kamera za avtom), ostalo preverijo testi. Uporabniku slike samo za vprašanja in na koncu misije.
5. **Vprašanja na začetku skupine:** vsa vprašanja skupine v eni sliki, preden se začne delo, da ni popravljanja.
6. **Kratki odgovori v klepetu,** brez ponavljanja stanja; podrobnosti so v pull requestu in tem dokumentu.

## Odločitve
1. **Kje igralec izbere misijo** (vprašanje 1): oboje. Na naslovnici ploščica MISSIONS (seznam vseh misij), na novi mapi pa so misije razdeljene po garažah; v vsaki garaži so misije od najlažje do najtežje. Razporeditev po garažah (vprašanje 5): **4 garaže po celinah**, v vsaki od najlažje do najtežje: EVROPA 50, 29, 45, 10, 02, 51, 01, 54, 08, 09; SEVERNA AMERIKA 06, 34, 39, 55, 04, 33, 17, 52, 30, 46, 11; AVSTRALIJA IN AZIJA 26, 40, 35, 19, 49, 48, 37, 47; AFRIKA IN JUŽNA AMERIKA 23, 43, 53, 07. Garaže na mapo postavi drugi račun; misije v `js/nvmenu.js` dobijo samo kratek priklop.
2. **Gasilski avto** (vprašanje 2): verzija **C · Avtolestev** (`slike-predlogi/blender/modeli/v2.glb`, mere v `v2.json`). Uporabijo ga misije 01, 46, 47 in 49 (pri 49 se lestev dviga in izteguje).
3. **Seje** (vprašanje 3): 10 sej po skupinah (tabela Stanje).
4. **Cilj misije 06** (vprašanje 4): bolnišnica in reševalni avto ob cilju.

## Sistem misij (`js/missions.js`)
- `Missions.add(def)`: `id` ('06'), `title`, `story`, `goal`, `hint` (slovensko, angleščina v `js/lang.js`), `track`, `car`, `limit` (s), `stars` ([čas za 3, za 2]), `rows` (merilniki: `{ k, label, bar, col }`), `opts(def)` (možnosti dirke čez igrine: privzeto sam, ena vožnja, suho; npr. `traffic`, `numAI`, `tfCars`), `made(race)` (lastni avti, preden se narišejo), `begin(run)`, `step(run, dt)`, `finish(run)`.
- `run`: `t`, `left`, `set(k, besedilo, delež, barva)`, `say(namig)`, `win()`, `fail(zakaj)`, `add(obj)` (THREE predmet misije v sceni, odstrani se sam ob koncu).
- Igra: hitri vstop `index.html?misija=<id>`; priklopi v `js/game.js` (`MS`, `MisBridge`). Rezultat: zvezdice, čas, rekord (`localStorage` `rra-misije`).
- Gradniki, ki jih misije že imajo: spremstvo kot dirkalni avto v podobi policije (`m06.js` `made`: `c.police`, `c.pol.mode = 'chase'`, promet se mu umakne; hitrost s `c.skCap`), promet samo avti in tovornjaki (`opts.tfCars`), noč (`Render.setAtmos`), stavbe in vozila iz preprostih teles (`m06.js` `hospital`).
- Testi: `tests/missions.test.js` (sistem in besedila vseh misij), za vsako misijo `tests/m<nn>.test.js` (brez brskalnika) in `tests/browser/m<nn>.test.mjs`; dodaj jih v `tests/run.js` (`SUITES`, `RELATED`) in `tests/README.md`.

## Stanje

| Skupina (seja) | Misije | Ocena (h) | Stanje |
|---|---|---|---|
| 0 | Sistem misij | – | PR #187 |
| 1 | 06 | – | narejeno (veja `misije/06`) |
| 2 · ogenj, gasilski avto C | 01, 49, 46, 47 | 13–20 | |
| 3 · voda | 19, 35, 37, 48 | 14–20 | |
| 4 · sneg | 30, 33, 53 | 10–13 | |
| 5 · težki tovor | 07, 09, 43 | 9–13 | |
| 6 · velik tovor | 51, 52, 54 | 7–10 | |
| 7 · živali | 10, 39, 55 | 9–12 | |
| 8 · mirna vožnja | 02, 34, 50 | 7–11 | |
| 9 · vleka, žaromet, led, baterija | 04, 08, 17, 26 | 10–14 | |
| 10 · ostalo | 11, 23, 29, 40, 45 | 16–21 | |
| – · garaže in naslovnica | 4 garaže po celinah, ploščica MISSIONS | 2–4 | |

## Predaja
- Po skupini 1: sistem in misija 06 sta narejena. Naslednja je skupina 2 (ogenj): gasilski avto C iz `v2.glb` (THREE je r128, `GLTFLoader` ni v repozitoriju: avto zgradi iz preprostih teles po merah v `v2.json` ali `blender/gas.py`), ogenj, curek vode, gašenje s prstom.
