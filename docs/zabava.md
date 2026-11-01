# Zabava · novosti za bolj zanimivo igro

Načrt za sedem novosti, ki jih je uporabnik izbral 1. 11. 2026 (stran Odločitve: `predlogi-zabava`, odgovor 1, 2, 3, 5, 7, 8, 9; `zabava-nacrt`, odgovor 1 »Tako je prav, začni«). En sklop: ena seja, ena veja (`ccr-91b69a95-m0bov8`), en pull request, sedem korakov s svojim commitom. Na `main` šele po sporočilu koordinacije (najprej zbirni PR misij #233, nato po vrsti).

## Odločitve (privzete izbire, potrjene)
- **a Cilji ekipe** (`js/zabava/cilji.js`): samo v karieri, na dirki s tekmeci (krožna, odprta cesta, dvoboj v prometu, eliminacija). Na štartu pred lučmi kartica s tremi cilji in »Brez cilja«; dirka čaka. Uspeh: dodatek k nagradi za mesto (delež), neuspeh: nič (brez stav).
- **b Eliminacija** (`js/zabava/elim.js`, način `elim`, v meniju *Elimination*): vsakih 30 s izpade zadnja dvanajstina polja (22 avtov: 2, 100 avtov: 9), prvič po 45 s; dirka ~5–6 min. Zadnji avti imajo v časovni tabeli rdečo vrstico, odštevanje je pod uro (`#h-gap`), brez velikih napisov. Tudi v dirki s prijatelji (odloča gostitelj).
- **c Ti loviš** (`js/zabava/lov.js`, način `lov`, v meniju *Pursuit*): ujameš, ko si skupaj 5 s manj kot 15 m za begunom (ob dotiku hitreje); pobegne, če je 10 s več kot 400 m pred tabo ali pride do konca ceste; 3:00. Vse odprte ceste s prometom. Najprej sam, s prijatelji pozneje (posebej).
- **d Tekmeci si zapomnijo** (`js/zabava/spomin.js`, jedro v `js/core.js`): zamera do konca dirke, v prvenstvu do konca prvenstva; oranžna vrstica v časovni tabeli in komentator. Jezen tekmec se brani ostreje in ne pusti prostora, nikoli namenoma ne zapelje vate. Kdor vozi čisto, mu tekmeci puščajo prostor.
- **e Trener** (`js/zabava/trener.js`): po kronometru, kvalifikacijah in izzivu trije ovinki z največjo izgubo. Zlati duh: stikalo v možnostih kronometra (privzeto izklop), avtopilot v ozadju s tvojim avtom, raztegnjen na zlati čas.
- **f Izzivi ob cesti** (`js/zabava/izzivi.js`): vse prave proge; krožne: radar, odsek; ceste: še drift cona, skok (kjer ga cesta ima), skriti zlati smerniki v stranskih cestah. Zvezdice iz hitrostnega profila. Stikalo v Nastavitvah (privzeto vklop); ne v dirki s prijatelji in misijah.
- **g Živa cesta** (`js/zabava/cesta.js`): samo odprte ceste; kamenje, žival čez cesto, dela na cesti s semaforjem, počasen traktor; največ en naenkrat, 1–2 na vožnjo; stikalo v Nastavitvah (privzeto vklop); v kronometru stalno seme proge.
- **h Meni:** ploščici *Elimination* in *Pursuit* v *Single race* (sliki iz igre).
- **i Pull request:** en osnutek na koncu, Ready, ko so povezani testi lokalno zeleni.

## Sistem (`js/zabava.js`)
- `Zabava.add(f)`: novost z izbirnimi metodami `init(G)`, `opts(ctx)`, `made(race, ctx)`, `begin(race, ctx)`, `hold()`, `step(race, dt)`, `over(race)`, `cls(c)`, `finish(race)`, `resBase(race, info)`, `resPay(race, info)`, `resEnd(race, kind)`, `stop(race)`.
- `ctx` (iz `newRace`): `md` (način igre), `on` (spletna dirka), `tt`, `quali`, `chal`, `cr` (krog prvenstva ali −1), `school`, `nv`, `mis` (posebna misija), `career`.
- **Testi in reference:** v testnem načinu (hitri vstop, `repro`) in v brskalniku, ki ga vodi orodje (`navigator.webdriver`, Playwright), so novosti izklopljene, razen če jih test vklopi (`window.__zabava = true` ali `{ izzivi: 1, … }`, v naslovu `zabava=1`). Tako ostanejo obstoječe reference (golden, slike svetov, obremenitev) take, kot so. Nova načina (`elim`, `lov`) delujeta vedno, ko ju izbereš.
- Nastavitve (`S`): `zbIzz` Izzivi ob cesti, `zbCesta` Živa cesta, `zbSpomin` Tekmeci si zapomnijo (vse 1), `zbGold` Zlati duh (0).
- Shranjeno: `localStorage` `rra-zabava` (rekordi izzivov, zamere v prvenstvu).

## Priklopi v igri (iskanje z grepom, številk vrstic ni)
- `js/game.js`: `const ZB` ob `const MS` (stub, če `js/zabava.js` ni naložen), `ZbBridge` ob `MisBridge`; `newRace` (`ZB.opts(ctx)` ob `MS.opts()`, `ZB.made`, `ZB.begin`), `stepRace` (`ZB.step(dt)` ob `MS.step`), `updatePhase` (`ZB.hold()` na začetku, `ZB.over()` ob `MS.over()`; brez stopničk za način novosti), `finishRace` (`ZB.finish()`, `ZB.resBase`, `ZB.resPay` v karieri, `ZB.resEnd`), `finishTT` / `finishQuali` / `finishPolice` (`ZB.resEnd`), `toTitle` (`ZB.stop()`), časovna tabela `twHUD` (`ZB.cls(c)`, IZPADEL), nastavitve `DEF` in `setOption` (`num`), načini (`modesOf`, `modeOf`, `S.mode`).
- Uporabljeno iz igre: `careerPay(sum, what)`, `inCareer()`, `stRun` (dotiki ograje in avtov), `showMsg`, `toast`, `Comm.say`, `teamRadioSay`, `repro`.
- `js/core.js`: `Race.retire(c)` (izločen avto zapelje s ceste), `isOut`, `estimateResults`, `aiDefend` / `aiWaits` (zamera), `carCollide` (kdo je koga), `Traffic`, `Police`, stranske ceste `stubs`, `rng`, `QUICK_MODE`.
- `js/render.js`: policijska podoba `c.police` + `polGear`, duh `Render.setGhost`.
- `js/menu.js`: `MODES`, `GAME_MODE` / `MENU_MODE`, `optionsRows` (Zlati duh).

## Stanje

| Korak | Novost | Stanje |
|---|---|---|
| 0 | Skupni most, nastavitve, ta dokument | narejeno |
| 1 | Cilji ekipe | narejeno (`tests/zabava.test.js`, `tests/browser/zabava.test.mjs`) |
| 2 | Eliminacija (tudi s prijatelji) | narejeno (sam: urnik, rdeče vrstice, rezultati; na spletu: stikalo v sobi, izločitve določi gostitelj, `{ t: 'zb', k: 'cut' }`) |
| 3 | Tekmeci si zapomnijo | narejeno (jedro: `grudgeHit`, `aiWaits`, `aiDefend`, prostor ob avtu; igra: `js/zabava/spomin.js`) |
| 4 | Trener in zlati duh | narejeno (`js/zabava/trener.js`: profil vožnje iz duha, ovinki `Track.corners`, zlati duh v ozadju) |
| 5 | Izzivi ob cesti | narejeno (`js/zabava/izzivi.js`: postavitev iz oblike proge, zvezdice iz hitrosti avta po profilu) |
| 6 | Ti loviš | narejeno (`js/zabava/lov.js`: policijska podoba `P.police`, begunec 150 m spredaj, merilnik aretacije) |
| 7 | Živa cesta | |
| 8 | Spoj `main`, testi, osnutek PR | |

## Predaja
- Po koraku 1: most (`js/zabava.js`) in priklopi v `js/game.js` so narejeni, Cilji ekipe delujejo (kartica pred lučmi, izplačilo prek `careerPay`). Za brskalniške teste lokalno: `npm install --no-save --no-package-lock --ignore-scripts peer@1.0.2` (namesti tudi Playwright iz `package.json`).
- Po koraku 3: eliminacija na spletu: izločen igralec dobi kot čas cilja 100000 s manj čas izpada (rezultati ga razvrstijo, prikaz »Izpadel«, `ZB_OUT` v `js/game.js`). Zamera: krivda po legi stika (igralčev nos v rep ali bok tekmeca), v testih in Node dirkah izklopljena (`chr.zbG` nastavi samo igra).
- Po koraku 6: igra ob cilju kronometra vzame posnetek vožnje (`ghRec = null`), zato si ga trener zapomni med vožnjo (`runRec`). Bathurst ima pred štartom 7,4 s preleta letal: v brskalniških testih čas poženi s `g.sim`. Izzivi: skok samo na cesti s `def.jumpRec`, smerniki 6 m pred ograjo stranske ceste (do 3).
