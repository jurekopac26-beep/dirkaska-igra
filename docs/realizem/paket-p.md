# Realizem, paket P · Poškodbe (16 sej)

Del `docs/realizem.md` (razdeljen po paketih 11. 11. 2026, ukrep 5 »Manj sklopov«, `docs/varcevanje.md`). Odločitve uporabnika, proge, postopek, pravna ocena, čas in vrsta so v `docs/realizem.md`.


Najboljše poškodbe so v igri že zdaj, a izklopljene (Nastavitve, Razbijanje). Paket jih vklopi in doda, kar se ob trku v resnici zgodi najprej.

**Privzeto samo videz** (izbira uporabnika): avto je zmečkan, vozi pa kot nepoškodovan. V Nastavitvah je izbira **Izklop / Samo videz / Vklop**:
- **Izklop:** brez poškodb.
- **Samo videz:** privzeto.
- **Vklop:** tudi vpliv na vožnjo.

**Začetek:** ko so na `main` #460 in #480 (avti) in deli iz garaže na vseh avtih po meniju #516. #322 je na `main` od 8. 11. Ocena začetka je ~16. 11. pri dveh računih oziroma ~22. 11. pri enem (linija za E).

**Vrstni red:** P1 → P4 → P2 → P5 → P3 → P6, **v enem pull requestu skupaj s Trki (#608)** (odločitev uporabnika 10. 11. 2026 ob ~23.30 prek Mateja, tabla #382); prej 4 pull requesti (P1, P4 + P2, P5 + P3, P6).

| Korak | Kaj | Samo videz (privzeto) | Vklop | Telefon | Seje |
|---|---|---|---|---|---|
| P1 Novi način poškodb privzeto | vklopijo se obstoječa stikala Razbijanja: gostejše telo z udrtinami, steklo, ki poči, odrgnjena barva, deli na cesti; namesto 11 stikal ena nastavitev podrobnosti (preproste / podrobne); drobci stekla in barve 1–3 cm | ves videz | enako | polno telo samo za igralca in 5 najbližjih avtov (predlog, ~+15 klicev); vsi razbiti avti s polnim telesom 221 → 283 klicev | 1 |
| P4 Sledi trkov in pravi delci | na avtu barva drugega avta ali siva odrgnina od zidu; na cesti drobni črni koščki plastike, drobci stekla, luske barve; iskre in brazde, ko podvozje drgne po tleh | ves videz | enako | +1–2 klica (vsi delci v enem nizu) | 1–2 |
| P2 Motor: para, pregrevanje, olje | para iz hladilnika pri 15–30 % poškodbe (zdaj dim šele nad 45 %), oljni dim in madeži | para in dim | še pregrevanje: motor izgublja moč in se ustavi | 0 (sistem dima) | 1–2 |
| P5 Steklo in luči | vetrobransko steklo poči v pajčevino in ostane; stranska in zadnja razpadejo v kocke; žaromet poči, luč ugasne ali sveti postrani | ves videz; steklo na cesti ne vzame oprijema | steklo na cesti vzame največ 5 % oprijema (zdaj 20 %, ko je vklopljeno Razbijanje) | 0 | 1 |
| P3 Kolesa in obese | zvita spona ali platišče, nagnjeno kolo, povešen vogal, iskre pod podvozjem | kolo je vidno zvito | avto vleče na stran, pri hitrosti trese | 0 | 1–2 |
| P6 Karoserija kot pri testih trkov | močan čelni trk skrajša prednji del za 0,4–0,7 m, pokrov se zloži v obrnjen V, pri trku z vogalom gre kolo nazaj, kabina ostane cela | skrajša se samo telo | enako | 0 | 2–3 |

P6 ima visoko tveganje (testi trkov, tekmeci in reference), zato je zadnji.

**Obremenitev telefona**, merjeno 8. 11. 2026 na Bathurstu, preden je šel na odločanje:
- dirkališče z 20 avti na štartu;
- nastavitve za telefon: 844 × 390, kakovost normalna, detajli avtov nizki, sence;
- »po trkih« pomeni šest udarcev na avto, povprečno 46 % poškodbe.

Nadaljnje meritve so na Spa.

| Način | Klici, nepoškodovani | Klici po trkih | Oglišča po trkih |
|---|---|---|---|
| Zdaj (privzeto) | 210 | 221 | 681 tisoč |
| Vse Razbijanje vklopljeno | 260 | 283 | 702 tisoč |
| Samo novo telo | 260 | 283 | 694 tisoč |
| Predlog P1: polno telo za igralca in 5 najbližjih (ocena) | ~225 | ~236 | ~690 tisoč |
| Meja proge (`CLAUDE.md`) | ~300 | ~300 | ~900 tisoč |

Čas sličice v brskalniku brez grafične kartice je preveč nemiren za sklepe. Pri 120 udarcih hkrati se prve sličice v obeh načinih zataknejo do ~1 s; to je treba preveriti na telefonu.

- **Datoteke:**
  - `js/render.js` (telo, steklo, para, delci, kolesa);
  - `js/core.js` (model poškodb, vpliv na vožnjo pri »Vklop«);
  - `js/game.js` (Nastavitve);
  - `js/lang.js` (prevodi).

  `js/world.js` ostane nespremenjen.
- **Tveganje:**
  - klici risanja pri polju razbitih avtov (283 od ~300);
  - vpliv na vožnjo pri »Vklop« spremeni čase krogov in teste voženj (privzeto ga ni);
  - začetek je odvisen od #460, #480 in #516.

## Zasnova izvedbe (12. 11. 2026)

Navodilo za graditelje paketa v #608 (veja `trki/realizem`, stanje `205f89b2`). Kratice: R `js/render.js`, C `js/core.js`, G `js/game.js`, H `index.html`, L `js/lang.js`; številke so vrstice tega stanja (išči po imenu funkcije). Sidra prve polovice so preverjena v kodi; sidra z oznako »(nepreverjeno)« preveri graditelj tistega koraka. **Prva polovica:** K (odpadlo kolo) in P1, nato vmesno preverjanje z več agenti. **Druga polovica:** P4 → P2 → P5 → P3 → P6.

### Pravila za vse korake

1. **Samo videz ne spremeni vožnje.** Vožnja (`stepCS`, `stepNova`, `aiDrive`, strategija boksov) bere poškodbe samo pri `dmgMode === 2`. Vsak nov člen je pri nepoškodovanem avtu točna identiteta (`* (1 - k * x)` z `x = 0` ali `+ (pogoj ? člen : 0)`), enak v obeh poteh (C:2890/3135, C:2903/3146, C:2935/3178), brez prerazporeditve izrazov. Avto, ki se ničesar ne dotakne, vozi v vseh treh načinih do številke enako.
2. **Brez novih naključnih števil v jedru** in brez spremembe števila ali vrstnega reda obstoječih (`spawnDebris` C:7640, `debrisHit` C:3782, `ruleDrop` C:3475, `wheelRule` C:3482, `puncture` C:4177). Kar vpliva na stanje, je funkcija stanja (`dmg`, `dz`, `cd`, pot, hitrost) ali zgoščena vrednost (vzorec `xRollStart` C:2271).
3. **Videz je določen s podatki trka.** Razpored drobcev, razpok in lusk pride iz semena (`c.id`, točka stika `lx, lz`, moč `amt`) v lastnem generatorju izrisa (`uuRng`/`ownRnd` R:3346–3347). Nova koda izrisa ne kliče `Math.random` in nikoli ne piše v `Car` ali `Race`.
4. **Novo stanje jedra** gre v predmet na avtu (kot `flt`, `kt`, `wreck`), ne v navadno polje ali seznam (`stateLine` v `tests/lib/sim.js` bi premaknil vse reference); ponastavita ga `repairCar` C:8555 in `_mend` C:8566. Avtov `c.net` nič ne premika, poškoduje ali upočasni; dirka s prijatelji ostane `setCrash({})`, `setTest({})`.
5. **Splošno, ne po modelih.** Nova koda bere vloge delov in okvirje (`geometry.userData.ranges[ime]`, `look.regions`, `PART_STD`/`PART_KEYS`, mere iz `xInit` R:7976), ne imen modelov; podatek po avtu je samo neobvezen ključ s splošno rezervo (kot `phys.knockK`). Brez sprememb v `js/cars/*.js`, v območju kompleta R:2139–2375 (tam so tudi `kitPieceCull`, `kitLod`, `kitLampOut`) in v `makeCarMesh` R:2759–2845: to spreminja #480 (še R:10822–10826, seznama skript v H in `garaza.html`, `tests/run.js`, `tests/fleet.test.js`, `tests/browser/fleet.test.mjs`, `tests/README.md`, `docs/kazalo.md`). Tabel po avtih (`XT_CARS` R:8961) ne širimo.
6. **Kamera za avtom.** Podrobnosti gredo tja, kjer jih kamera vidi: zadek, boka in streha svojega avta; pri avtih spredaj boka in del, obrnjen h kameri. Poenostavljeno ostane: podvozje (samo med prevračanjem, `xUnder`), notranjost, motor pod pokrovom (ena mreža), avti onkraj 5 najbližjih (stare udrtine, barve oglišč), drobci dlje kot ~40 m od kamere.
7. **Pravno.** Brez imen, logotipov, napisov in resničnih oseb na delih, drobcih in sledeh; nič z zamrznjenih testnih prog: meritve, slike in novi testi so na Spa, Belgija.

**Obremenitev** (Spa, nastavitve telefona kot `tests/browser/perf.test.mjs`; zdaj 181 klicev povprečno, 222 na najbolj obremenjenem mestu, 442 in 573 tisoč oglišč; meja ~300 in ~900 tisoč):

| Korak | Klici | Oglišča | Kako je omejeno |
|---|---|---|---|
| K | +1 na odpadlo kolo (golo pesto) | 0 | samo igralčev avto |
| P1 | brez trkov +0; po trkih največ +18 (6 polnih teles × največ 3: motor, premični panel ali prekrivna mreža, zrcalo) | igralec ~+13 tisoč; polni tekmeci pri Detajlih avtov Visoki ~+13 tisoč vsak | polno telo šele ob prvi udrtini, `X_NEAR = 5`; narisanih kosov na cesti največ 24 najbližjih; drobci `xSh` en klic, največ 6000 |
| P4 | 0 | 0 (drobci so že v `xSh`) | vse v `xSh`, `skids`, `sparkP` |
| P2 | 0 | 0 | `particles` (2400), madeži v `skids` |
| P5 | 0; pri Podrobnih −1 na razbito šipo (brez `crackDecal`) | 0 | barve oglišč |
| P3 | 0 | 0 | poza koles, `kitSag` |
| P6 | 0 | 0 | samo premik oglišč polnih teles |

### Prva polovica

#### K · Odpadlo kolo (narejeno 13. 11. 2026; izvedba v `docs/trki-realizem.md`, »Poškodbe K«)

| Poškodbe | Odpadlo kolo | Kdaj trk odtrga kolo | Kaj sledi |
|---|---|---|---|
| Samo videz in Vklop | **Konec dirke** (privzeto; dirka, igralčev avto) | obstoječe pravilo gum: guma najbolj udarjenega kolesa zagori, ko je kolo udarjeno ≥ 0,7 in pride udarec ≥ 0,02, ali ko je avto uničen ≥ 80 % (`ktFire` C:3467); naslednji pravi udarec (≥ 0,006) to kolo odtrga, močan (≥ 0,025) še eno (`ktHit` C:3449, `ruleDrop` C:3475) | avto zagori in zavre (`_wreckStep` C:8779–8784), pod 0,5 m/s `retire`, `Q.over` → KONEC IGRE (G:5710, `gameOver` G:5000) |
| Vklop | Dirka teče naprej; tudi vožnja na čas, kvalifikacije, izziv, pregon, dirka s prijatelji in vsi tekmeci | kot zdaj: vogal `cd ≥ 0,7` in `dmg ≥ 0,75` (C:3392) ali razbitina `dmg ≥ 0,96` (`wreckCheck` C:3506) | avto vozi po pestu (`LOSTW` C:1712); novo kolo v boksih ali z gumbom Namesti kolo |
| Samo videz | Dirka teče naprej; tudi vse našteto zgoraj | kolo **ne odpade**; od praga `cd ≥ 0,7` in `dmg ≥ 0,75` je narisano zvito, vogal je povešen (videz iz P3) | nič: avto vozi do številke enako |

1. C:7101 (priklop pravila v `Race`): pravilo dobi igralčev avto vsakega modela. Zdaj ga dobi samo avto z `wreck` (C:2810, 45 modelov s kolesnimi deli `parts.wheelFL`); 11 starejših modelov nima ne pravila ne KONEC IGRE. Brez `wreck` ga ustvari enako kot `retire` C:8734.
2. C `ruleDrop` C:3475: model brez kolesnih delov izbere samo kolo, ki ga izris lahko sname (sprednji kolesi); drugega kolesa ne izbira (brez dodatnega `rand()`).
3. R `kitParts` R:7281: splošna pot `kitWheelOff` R:7485 tudi za modele brez kompleta: mreža sprednjega kolesa se skrije in preda kosu, golo pesto `kitHubGeo` R:7501 (+1 klic), iskre pesta `emitFx` R:9766.
4. C `ktGrip` C:3431–3434: goreča guma vzame bočni oprijem (`KT.burn` 0,62) samo pri `dmgMode === 2`; pri Samo videz je samo opozorilo (plamen), vožnja ostane enaka.
5. C `detachPart` C:3498: odpadlo krilo vzame podtlak (`aeroK`) samo pri `dmgMode === 2`.
6. G in H: brez nove nastavitve; opis vrstice Odpadlo kolo (H:273, L:47–48) in `docs/igra.md` (»Gumbi trkov v Nastavitvah«) dobita stavek iz tabele za Samo videz.
7. Testi (Node): `tests/kolibri-tyres.test.js` (pri Samo videz goreča guma ne vzame oprijema; pri Vklop 0,62), `tests/wheels.test.js` (starejši model s pravilom: ogenj, kolo, konec), nov `tests/poskodbe.test.js` (točka P1.12). Brskalnik: `tests/browser/wheels.test.mjs` dobi starejši model (KONEC IGRE pokonci in ležeče).

#### P1 · Novi videz poškodb privzeto

1. G:49 `DEF`: nov ključ `dmgDet: 1` (0 Preproste, 1 Podrobne); ključi `xBody`, `xGlass`, `xPaint`, `xParts`, `xDrag`, `xDust` se izbrišejo; `xRoll`, `xBump`, `xAi`, `xHandle`, `xShake` ostanejo (0). G:652 `num` dobi `dmgDet`. Enkratni preklop ni potreben (nov ključ dobi privzeto vrednost v G:80).
2. H:274–284: šest vrstic videza zamenja ena, `data-set="dmgDet"`, »Podrobnosti poškodb«: »Preproste« (0) / »Podrobne« (1). Vrstice `xRoll`, `xBump`, `xAi`, `xHandle`, `xShake` se nespremenjene preselijo v `details#set-test` (H:312). L:72–82: novi ključi 'Podrobnosti poškodb': 'Damage detail', 'Preproste': 'Simple', 'Podrobne': 'Detailed' in opis vrstice; šest starih oznak z opisi se izbriše.
3. G:590 `xPhys`: brez `glass` (steklo na cesti v jedru ostane izklopljeno do P5). G:597 `applySettings`: `const d = +S.dmgDet; Render.setCrash({ body: d, glass: d, paint: d, parts: d, drag: d, dust: d, detail: S.carDet === 'high' ? 'full' : 'lite', near: 5 })`.
4. R:7835–7836 `XC`, `setCrash`: nov `XC.near` (privzeto 0 = vsi avti, da stari klici in testi veljajo). Preproste = današnji videz (`applyDent`, `crackDecal`); Podrobne = vsa stikala videza.
5. R, nova `xNearStep()` v `updateCars` R:6993 (vsakih 20 sličic): razvrsti tekmece po kvadratu razdalje do igralca (avti za igralcem štejejo dvojno razdaljo) in vzame prvih `XC.near`; član ostane, dokler ne pade pod mesto `near + 2`. `xWant(c)` = igralec, ali tekmec v naboru, ki ima vsaj eno udrtino.
6. R:5095–5101 `makeView`: `v.xOn = XC.body && xWant(c)` (formula in LM nikoli, kot zdaj). Tekmec brez udrtin ni nikoli poln: nepoškodovano polje ne stane nič.
7. R, dnevnik udrtin: ob porabi vrste R:7076 se vsaka udrtina prepiše v `v.dl` (največ 40 zapisov, najšibkejši izpade); nov pogled ga dobi od starega in ga ponovi z `old: 1` (brez drobcev in zvoka, kot `careerWear`), največ 8 zapisov na sličico.
8. R `frame` R:10689 (kjer popravljen avto dobi nov pogled): pogled, pri katerem `v.xOn !== (XC.body && xWant(c))`, se zgradi znova; največ en pogled na sličico in ne v sličici z `xInit` R:7082. Nazaj v preprostega gre samo avto, ki je izrezan (`carCull` R:10670) ali dlje kot 60 m.
9. R:7156 (pogoj `remerge`): paneli starejšega modela se združijo tudi pri polnem tekmecu; zunaj združitve ostane samo panel, ki se giblje (strgan pokrov `xTear` R:8575, zadnja vrata `xRearDoor` R:8592).
10. R `syncDebrisAfter` R:7625, `xGround` R:8825, `xGroundCap` R:8857: narisanih kosov na cesti je skupaj največ 24 najbližjih kameri (kosi jedra in obležali); `xGroundCap` 48 → 24.
11. R `xShardsMake` R:8887 in `xChips` R:8860: drobci stekla in barve 1–3 cm (zdaj 10–25 cm × 0,6–1,7); `XSH_N` ostane 6000.
12. Testi (Node), nov `tests/poskodbe.test.js` (v `tests/run.js`: nabor node in povezava z `js/core.js`, `js/game.js`): (a) Spa, 30 s, isti vnosi: avto z vbrizgano škodo (`Core.applyDamage`, 90 %, vsi vogali) vozi pri Samo videz po vsakem koraku do številke enako kot cel, tudi formula z odpadlim krilom; (b) tabela K: vse štiri kombinacije na dveh modelih s kompletom in dveh starejših; (c) število klicev `Math.random` v prizoru trka je enako kot na `205f89b2`; (d) `DEF` in `applySettings`: `dmgDet` 1, šestih ključev ni, `xPhys` ne da `glass`, vrstica v H.
13. Testi (brskalnik): `tests/browser/lib.mjs:92` pripne `dmgDet: 0` (obstoječi testi ostanejo pri starem videzu, kot `crV: 0`); `tests/browser/perf.test.mjs` nastavi `dmgDet: 1` (meri privzeto). `crash.test.mjs`, `kolibri.test.mjs`, `repair.test.mjs`: `xBody/xGlass/xPaint/xParts/xDust/xDrag` → `dmgDet`, kliki na `[data-set="dmgDet"]`. Nov `tests/browser/poskodbe.test.mjs` (Spa, telefon 844 × 390, igralec in 20 tekmecev v gruči pred njim; narejeno brez `X_NEAR`, meje prilagojene: ta prizor ima tudi na `main` več kot 300 klicev): brez trkov je poln samo igralec in klicev je največ 5 več kot pri Preprostih; razpoka luči pri Preprostih (0,08 spredaj) in zlom (0,1); 19 tekmecev po šestih udarcih ≤ 360 klicev; vsi razbiti (12 × 0,3) ≤ 400, zamenjava na Preproste med dirko ≤ 460; oglišča povsod < 900 tisoč; udrtine preživijo ponovno gradnjo pogleda (`Render.crashInfo().cl`); `Math.random` ni vprašan. Meritve: `docs/trki-realizem.md`, »Poškodbe P1.12 in P1.13«.
14. Reference: samo `tests/golden/perf.json` (`PERF_ONLY=spa node tests/browser/perf.test.mjs --update`, nato prave proge). `sim.json`, `races.json` in `trki.json` se v prvi polovici ne smejo premakniti.

#### Vmesno preverjanje (več agentov, po K in P1)

1. Vožnja brez dotika: `tests/trki.test.js` (L494, L807) in `tests/odpadli-deli.test.js` zelena; reference jedra nespremenjene.
2. Samo videz: `tests/poskodbe.test.js` (a) in pregled vseh branj `dmg`, `dz`, `cd`, `kt`, `aeroK`, `glassK` v `stepCS`, `stepNova`, `aiDrive`.
3. Naključna števila: nobenega novega `rand()` v C; nova koda v R brez `Math.random`.
4. Obremenitev na Spa po trkih (točka P1.13) in zatik ob 120 udarcih hkrati.
5. Dirka s prijatelji: `xPhys(true)` in `testOf(true)` ostaneta `{}`; pravila koles ni.
6. Slike zdaj in potem (spodaj) na tablo #382.

### Druga polovica

#### P4 · Sledi trkov in pravi delci

1. Vir sledi brez spremembe jedra: R ob porabi udrtin (R:7076) `xSrc(c)`: `c.fxWall >= c.fxCar` → zid (siva), sicer tekmec z isto točko stika (`contactX/Z`) → barva njegovega laka; hitrost `sp = max(c.fxCar, c.fxWall)`. Zapiše se v dnevnik udrtin (`col`, `sp`), ne v `c.dents`. (nepreverjeno: vrstni red pred `emitFx` R:9754, ki polja izniči)
2. Na avtu: barvni korak `applyDent` R:7784 in `xPaint` R:8473 mešata barve oglišč v krogli udrtine proti `col` (delež `min(0.6, 2 * amt)`); zid pusti sivo odrgnino in golo kovino. Pas odrgnin ob boku (`uScrS`, `dirtyCarMat` R:2738) za vsa polna telesa, višina iz okvirja telesa (zdaj samo KOLIBRI, `xtScrape` R:9312). (nepreverjeno)
3. Na cesti: `xShards` R:8869 dobi barvi črne plastike (udarec v odbijač, coni 0 in 1) in lusk v barvi avta; število `min(24, 4 + 60 * amt)`, razpored iz semena trka; steklo samo ob razbiti šipi ali luči. (nepreverjeno)
4. Podvozje: `emitFx` R:9756–9773: iskre (`sparkP`) in svetla brazda (`skids.add` R:5431) pri pestu brez kolesa, vlečenem odbijaču, povešenem vogalu (P3) nad 15 m/s in ob pristanku (`fallFx` R:8658). (nepreverjeno)
5. Testi: `tests/browser/poskodbe.test.mjs`: udrtina po trku z avtom nosi barvo drugega avta, po zidu sivo; klici enaki kot pred korakom. Reference: nobene.

#### P2 · Motor: para, olje, pregrevanje

1. Videz (oba načina), `engineFx` R:9528: `f = max(c.dz[0], (c.cd[0] + c.cd[1]) / 2)`; bela para (`particles`, hitro se dviga) pri `f` 0,15–0,30, količina `sstep(0.15, 0.3, f) * (0.4 + 0.6 * plin)`; nad 0,30 para in siv dim; nad `c.dmg > 0.45` dim kot zdaj; oljni dim izpod motorja pri `f ≥ 0.45`. Isti pogoj (`xSmokes(c)`) v pragu R:9537, v `carCull` R:10670 in pri utišanju R:7068. (nepreverjeno)
2. Madeži olja: `skids.add`, temna kratka sled na vsaka 2 m prevožene poti pri `f ≥ 0.3`. (nepreverjeno)
3. Vklop, C (narejeno 13. 11. 2026): samo avto s pravilom kolesa (`wreck.rule`: igralec, brez mreže, na dirki), tekmeci se ne pregrevajo. `engStep(c, dt)` v `_wreckStep`: `c.eng` nastane pri `f ≥ 0.3`; `leak = sstep(0.3, 0.7, f)`, `h += (leak * (0.15 + 0.85 * plin) * 0.03 - (1 - leak) * 0.02 * h) * dt` (ves plin, vsa voda ven: ugasne v ~36 s). Moč v obeh fizikah `* engK(this)` (od `h` 0,5 do 30 % manj, mrtev 0). `h = 1` več kot 3 s: motor ugasne, avto se izkotali (0,5 hitrosti na sekundo), ko stoji: `retire`, `rule.over`, `rule.why = 'engine'` → **KONEC IGRE** kot pri odpadlem kolesu (uporabnik 13. 11. 2026, `trki-p2-pregrevanje` = 2). Ponastavita `repairCar` in `_mend`. Igra: `engHUD` (MOTOR SE PREGREVA, MOTOR JE UGASNIL), podnapis KONEC IGRE. Test: `tests/wheels.test.js` 13.
4. Besedila: opozorilo o vročem motorju iz Okvar (G:4011, G:4056); nove nastavitve ni. (nepreverjeno)
5. Testi: `tests/poskodbe.test.js` (Vklop: `f` 0,5 → moč pade, motor ugasne; Samo videz in cel avto: faktor točno 1; brez `rand()`), `tests/browser/fire.test.mjs` (para pri 20 % spredaj). Reference: `sim.json` in `races.json` (dirke s trki pri Vklop) z `npm run golden:update`; `trki.json` ne.

#### P5 · Steklo in luči

1. R `XGL` R:8762, `xBreakPane` R:8789: vetrobransko steklo samo zvezda, razpoka ali pajčevina (ostane do `dmg ≥ 0.92`); stranska in zadnja šipa razpadeta, kocke gredo v `xSh`. (nepreverjeno)
2. Luč s tremi stanji v zanki R:7217 (nova funkcija v bloku razbijanja, ne `kitLampOut`): cela; počena pri `cd[k] ≥ 0.08` (sij × 0,6 v `carGlows` R:10646, snop v `beams` R:4581 zasukan do 12° navzven in navzdol po `cd[k]`); ugasnjena pri `c.lightOut[k]`, kot zdaj. Jedro se ne spremeni. (nepreverjeno)
3. C: `GLASS.mu` C:3780 0,2 → 0,05; C:7964 `c.glassK = 1 - (c.dmgMode === 2 ? GLASS.mu : 0) * k`. G:590 `xPhys`: `glass: 1` v krajevni dirki (splet `{}`), neodvisno od Podrobnosti poškodb. (nepreverjeno)
4. Testi: `tests/debris.test.js` L40–60 (Vklop 0,95, Samo videz 1), `tests/poskodbe.test.js` (steklo pri Samo videz ne spremeni vožnje), `crash.test.mjs` preverjanje 3. Reference: nobene (jedro ima stikalo privzeto izklopljeno).

#### P3 · Kolesa in obese

1. Videz (oba načina), poza koles R:7027–7030: `b = sstep(0.35, 0.7, c.cd[k])`; nagib kolesa do 12°, stekanje do 6°, opletanje platišča `2° * b` po kotu vrtenja; poves vogala do `0.25 * rw * b` prek `v.sagQ`/`v.sagP` (`kitSag` R:7514). Model brez mrež zadnjih koles: samo poves. To je tudi videz praga iz tabele K pri Samo videz. (nepreverjeno)
2. Vklop, C:2903 in C:3146: pogoj `XR.handle && this.dmgMode === 2` postane `this.dmgMode === 2`; tresenje je dodaten člen `+ (this.dmgMode === 2 && b > 0 ? 0.004 * b * Math.sin(pot / 0.3) * Math.min(1, spd / 30) : 0)` iz prevožene poti. Vrstica in ključ `xHandle` se izbrišeta (G:49, G:590, H, L). (nepreverjeno)
3. Testi: `tests/knock.test.js` (vlečenje brez stikala; Samo videz nič), `tests/browser/kit.test.mjs` (nagnjeno kolo, poves). Reference: `sim.json`, `races.json` z `npm run golden:update`.

#### P6 · Karoserija kot pri testih trkov

1. Samo izris, samo polna telesa (igralec in 5 najbližjih); preprosti avti ostanejo pri `applyDent` (največ 0,2 m).
2. Hitrost trka iz dnevnika udrtin (`sp`, P4.1). Čelni udarec s `sp ≥ 14 m/s`: `xInit` R:7976 doda utež vzdolž nosu (0 pri požarni steni, 1 na nosu); nova `xCrush(v, L)` premakne vsa oglišča pred požarno steno nazaj za `L * utež`, `L = 0.7 * sstep(8, 18, sp)` (0,4–0,7 m), v mejah `xInit` (spredaj ≤ 0,42 dolžine). `X_SOFT` R:8465 za ta primer ne velja. (nepreverjeno)
3. Pokrov v obrnjen V: oglišča dela pokrova (vloga `hood`/`bonnet` v `ranges`, pri starejših modelih panel) se dvignejo za `0.5 * L` na sredini dolžine; `xTear` R:8575 in `xEngine` R:8722 ostaneta. Trk z vogalom: kolo nazaj z `xWheels` R:8671. Kabina: `kitMask`/`crushOf` R:2593/2600. (nepreverjeno)
4. Znana meja: trkalna škatla ostane polne dolžine (fizika trkov se ne spremeni), senca trupa in oddaljena mreža sta iz celega telesa.
5. Testi: `crash.test.mjs` preverjanje 2 (zdaj ≤ 0,3 m do 70 %): čelni trk nad 50 km/h skrajša nos za 0,4–0,7 m, oglišča kabine se premaknejo manj kot 2 cm; reference: nobene.

### Slike zdaj in potem (Spa, `tools/trki/slike.mjs`)

1. Orodje dobi možnosti `--a-nastavitve <json>` in `--b-nastavitve <json>`, ki se zlijeta v nastavitve strani (`slike.mjs:301`); brez tega stran »potem« dobi `dmgDet: 0` iz `tests/browser/lib.mjs`.
2. Koda »zdaj«: `git worktree add <delovna mapa>/zdaj 205f89b2`. Ukaz: `node tools/trki/slike.mjs <prizor> --a-root <delovna mapa>/zdaj --b-root . --a-cv 6 --b-cv 6 --a-opis zdaj --b-opis potem --b-nastavitve '{"dmgDet":1}' --velikost 1280x720 --out <delovna mapa>/slike`.
3. Prizori: K `kolosam` in `kolo` s `--skoda 1` in `--skoda 2`, nov prizor `kolostari` (starejši model); P1 `sam120 --deli`, `deli120`, `svez200`, nov prizor `polje` (igralec in 6 načetih tekmecev); P4 `bok`, `zid30`, `tbone`; P2 `celni`, `zid30` s `--casi 0,1,3,6`; P5 `tbone`, `zid90`; P3 `kolosam --skoda 1`; P6 `celni`, `zid90`. Slike do ~300 KB, ne v repozitorij.

### Odprto za uporabnika

1. Imeni nove vrstice: »Podrobnosti poškodb: Preproste / Podrobne« (angleško Damage detail: Simple / Detailed): v igri tako; uporabnik je 13. 11. 2026 potrdil Realistično s pripombo »dodaj nastavitve da lahko se kaj spremenim« (`trki-cv6-slike` = 1): vrstice Trki, Poškodbe avtov, Odpadli deli, Odpadlo kolo so v Nastavitvah.
2. Odgovorjeno 13. 11. 2026 (`trki-p2-pregrevanje` = 2): KONEC IGRE, glej P2.3.
