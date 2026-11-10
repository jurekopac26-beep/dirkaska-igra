# Zgumirana linija po uporabnikovi vožnji (načrt)

Zapiski raziskave 9. 11. 2026 (Matej, brez sprememb kode). Številke vrstic so približne in veljajo za `main` tistega dne: seja jih pred delom preveri.

## Odločitve uporabnika
- 9. 11. 2026 ob ~23.54: »zgimirana linija naj gre po moji voznji po moji liniji tam kjer je posneta tam kjer pa ni pa naj zaenkrat predvideva dokler ne posnamem vseh prog«.
- 9. 11. 2026 ob ~23.55: »zgumirano linijo daj prvo v sliki v predogled in ne zacni z delom dokler je ne potrdim«.
- 10. 11. 2026 ob ~00.57, po slikah: »Da, tudi na odprtih cestah«. Guma gre po uporabnikovi liniji, samo videz, in pride tudi na ceste brez boksov (npr. Tianmen), kjer je zdaj ni.
- 10. 11. 2026 med ~02.00 in ~03.00, po slikah prototipa (v seji teme partyslo): »Plast gume naj bo sirsa«.
- 10. 11. 2026 ob ~03.30, v pogovoru z Matejem (tabla #382, komentar 6757283997; vprašanje `zgumirana-linija-1`): izbral je **možnost 1**, vse po njegovi liniji: guma, ki se nabira, in stalne sledi v svetu (temni pas, sledi zaviranja), na dirkališčih in na odprtih cestah. Obseg je s tem razširjen za stalne sledi (ocena +4–6 h).

## Obseg
- Guma (temna sled na liniji vožnje) se riše po liniji uporabnikove vožnje, kjer je posneta; kjer ni, po predvideni liniji iz sloga vožnje. Ko uporabnik posname nove proge, jih guma prevzame brez spremembe kode.
- **Samo videz.** Oprijem ostane na izračunani liniji (`rubberAt`, +2 %, in `marbles()`, −6 %): fizika vožnje se ne spreminja (`CLAUDE.md`, Seje, »Proge in grafika«). Reference `tests/golden/races.json` in `tests/golden/sim.json` se ne smejo spremeniti.
- Nov sloj na odprtih cestah brez boksov: preveri obremenitev telefona (`perf`, do ~300 klicev risanja).
- **V obsegu od 10. 11. 2026** (izbira uporabnika, možnost 1): stalni pasovi gume in sledi gum v svetovih (`js/world-tianmen.js` ~257, `js/world-spa.js` ~161, `tyreMarks` v `js/world.js` ~3686, okoli 17 svetov; +4–6 h) gredo po uporabnikovi liniji skupaj z gumo; plast je širša (6,2 m, prošnja uporabnika; razdelek »Širša plast«).

## Mesta v kodi
- Graditelj: `js/render.js` ~3907, `rubberLine(R)`; pas na `T.rl[ii] + RUB_O` (~3916), jakost iz `R.mb.rb` (~3909), prosojnost 0,22 + 0,5 · rb (~3936).
- Guma je danes samo v dirkah z gumami na zaprtih dirkališčih z boksi (`js/core.js` ~6479, `js/game.js` ~2338): Spa, Štajerska, Crystal Palace, Montréal (Bathurst je na odločanju); rb = 1 − e^(−d / (60 · dolžina)).
- Uporabnikova linija: `Race._voznja` (`js/core.js` ~6701). Profil je odmik `dd` od linije avtopilota na vsakih 5 m, linija je `T.rl + dd`. Posnet je samo Tianmen (`VOZNJA_PROFILI` v `js/data/voznja.js`: suho, 5 voženj); drugje velja slog (`VOZNJA_SLOG`, `voznjaIzSloga` ~6320; ne na testnih progah, progah na odločanju in v dežju). Danes deluje samo z `?voznja=1` in v dirki s tekmeci; za gumo mora veljati vedno.
- Razlika med linijama: Tianmen največ 5,6 m (s ≈ 1958 m), mediana 1,5 m; Spa največ 2,8 m pri s ≈ 2420 m.

## Prototip, s katerim so nastale slike (2 datoteki, +7/−5)
- V `_voznja()`: ob ponastavitvi `this.rubRl = null`; po pripravi profilov `RU = RV || RS`, `rubRl[i] = clamp(T.rl[i] + RU.dd[i], −li, li)`, `li = (T.wa ? T.wa[i] : T.w) − 1,7`.
- V `rubberLine`: `RL = R.rubRl || T.rl`; zanka do `iE = T.open ? N − 1 : N`.
- Kroglice gume se potem rišejo ob izračunani liniji, guma pa ob uporabnikovi: pokaži na sliki in presodi, ali se izris kroglic premakne z gumo (samo videz, oprijem ostane).

## Testi in reference
- `tests/browser/marbles.test.mjs`, `tests/voznja.test.js` in nov test: guma sledi posneti liniji, na progi brez posnetka predvideni, odprta cesta ima gumo.
- `tests/golden/perf.json` za proge z novim slojem; `tests/golden/world.json` samo, če se premaknejo stalni pasovi.

## Prototip za slike »zdaj in potem« (10. 11. 2026, partyslo, osnutek #623)
Samo za slike (odločitvi uporabnika 10. 11. 2026 ob ~01.37 in ~01.50); na `main` nič pred izbiro uporabnika. Vprašanje `zgumirana-linija-1` na strani Odločitve partyslo, slike v `docs/slike-zdaj-potem/guma-*.jpg` (mapa se pred `main` izbriše).

- **Vklop:** `index.html?guma=1` (ni shranjen). Brez njega je vse kot na `main`.
- **`js/game.js`:** `gumaOf(def)` da dirki `opts.guma` (posneti profili proge in slog), tudi v vožnji na čas in brez `?voznja=1`.
- **`js/core.js`, `_voznja()`:** z `opts.guma` izračuna samo `Race.rubRl` (`T.rl + dd`, omejeno na asfalt) in se vrne pred avti (`vis`): tekmeci in oprijem ostanejo, kot so. Preverjeno na Tianmenu: z izračunano linijo in brez izrisa plasti je dirka do desetinke metra enaka; `tests/voznja.test.js` 30/30.
- **`js/render.js`, `rubberLine`:** pas na `R.rubRl`; na odprti cesti brez `R.mb` lastna raven (`R.rubLv`, privzeto 0,6), skoraj brez leska, vrsta oglišč na vsakem vzorcu in 5 cm nad cesto (redkejša mreža se na prevojih gorske ceste skrije pod asfalt); guma se nabira, kjer gume delajo: jakost po zaviranju in bočnem pospešku iz hitrostnega profila dirke (`R.vprof`), na ravninah manj.
- **Stalne sledi v svetu** (temni pas v barvi asfalta, `shade` v `js/world-spa.js` in `js/world-tianmen.js`, ter sledi zaviranja, `tyreMarks` v `js/world.js`) berejo `T.rl`. Slike »vse po tvoji liniji« so nastale brez spremembe kode svetov: orodje za slike je svet zgradilo znova z uporabnikovo linijo na mestu `T.rl` (`Render.buildWorld`). Prava izvedba mora svetu dati linijo ob gradnji (profil in slog sta znana pred dirko; slog potrebuje hitrostni profil, zato privzeti razred).
- **Ugotovitev:** na Tianmenu dinamične gume danes ni, zato je »zgumirana linija«, ki jo uporabnik tam vidi, prav ta stalni pas s sledmi zaviranja. Brez premika stalnih sledi se na odprti cesti skoraj nič ne spremeni in ostaneta dve liniji.

### Obremenitev (844 × 390, NIZKA, sence; meji ~300 klicev in ~900 tisoč oglišč)
| Proga | Zdaj | S plastjo gume |
|---|---|---|
| Spa (plast že obstaja) | 179 klicev (največ 222), 433 tisoč oglišč (največ 573) | enako |
| Tianmen, 1930 m | 119 klicev, 366 tisoč | 120 klicev, 428 tisoč |
| Tianmen, 3380 m | 121 klicev, 354 tisoč | 122 klicev, 416 tisoč |
| Tianmen, šest vzorcev | 146 (največ 207), 388 tisoč (največ 545) | 150 (največ 217), 455 tisoč (največ 617) |

Plast na odprti cesti je ena mreža čez vso cesto: +1 klic in +62 tisoč oglišč na sliko (12.890 oglišč, 20.616 trikotnikov). Pri šestih vzorcih je del razlike v tekmecih na drugih mestih: merilno orodje ima skupna naključna števila in nova mreža jih zamakne; dirka sama je enaka. Premik stalnih sledi ne doda ničesar. Prava izvedba naj plast razdeli na kose ob cesti, da se riše samo bližnji del.

### Širša plast (10. 11. 2026, prošnja uporabnika »Plast gume naj bo sirsa«)
V prototipu (`?guma=1`) je plast široka 6,2 m namesto 3,5 m: sedem stolpcev (`RUB_OW`: ±3,1, ±2,1, ±1,05 m in sredina; polna jakost v pasu ~2 m, do roba zbledi), stolpci ostanejo na asfaltu (omejitev na polovico širine ceste). Brez `?guma=1` velja stara širina. Slike so narejene znova (`guma-moznost-{1,2}.jpg`, `guma-{spa,tianmen}-potem{,-vse}.jpg`), primerjava ožja/širša je `guma-sirsa.jpg`. Tianmen s širšo plastjo: šest vzorcev 150 klicev (največ 217) in 486 tisoč oglišč (največ 648); 1930 m 120 klicev in 459 tisoč, 3380 m 122 in 447 tisoč (plast +93 tisoč oglišč na sliko namesto +62 tisoč; meji ~300 in ~900 tisoč). Stalni pas v svetu (`shade`) ostane enako širok; prava izvedba naj ga razširi skupaj s plastjo.

### Kaj manjka za pravo izvedbo
- Linija ob gradnji sveta za stalni pas in sledi zaviranja (okoli 17 svetov z lastnim pasom, `tyreMarks` za vse).
- Kroglice gume (`marbles`) se rišejo ob izračunani liniji; izris naj gre z gumo, oprijem (`marbleAt`, `rubberAt`) ostane.
- Raven na odprti cesti: zdaj stalna (0,6); določi jo izbira uporabnika ali nabiranje po prevoženih avtih.
- Testi iz razdelka »Testi in reference«, reference `perf.json` za proge z novo plastjo, slike zdaj/potem ob koncu.

## Izvedba
- Grafika: Fable 5.2, ena seja, brez več agentov (`CLAUDE.md`, Seje). Ocena: ~3 h dirkališča in 1–2 h odprte ceste.
- Pred `main`: slike zdaj/potem za uporabnika (kamera za avtom; Spa in Tianmen). Testne proge ostanejo zamrznjene.
- Račun: partyslo (tabla #382, komentar 6755119724; `docs/vrsta.md`, »Načrtovano«).
