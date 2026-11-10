# Zgumirana linija po uporabnikovi vožnji (načrt)

Zapiski raziskave 9. 11. 2026 (Matej, brez sprememb kode). Številke vrstic so približne in veljajo za `main` tistega dne: seja jih pred delom preveri.

## Odločitve uporabnika
- 9. 11. 2026 ob ~23.54: »zgimirana linija naj gre po moji voznji po moji liniji tam kjer je posneta tam kjer pa ni pa naj zaenkrat predvideva dokler ne posnamem vseh prog«.
- 9. 11. 2026 ob ~23.55: »zgumirano linijo daj prvo v sliki v predogled in ne zacni z delom dokler je ne potrdim«.
- 10. 11. 2026 ob ~00.57, po slikah: »Da, tudi na odprtih cestah«. Guma gre po uporabnikovi liniji, samo videz, in pride tudi na ceste brez boksov (npr. Tianmen), kjer je zdaj ni.

## Obseg
- Guma (temna sled na liniji vožnje) se riše po liniji uporabnikove vožnje, kjer je posneta; kjer ni, po predvideni liniji iz sloga vožnje. Ko uporabnik posname nove proge, jih guma prevzame brez spremembe kode.
- **Samo videz.** Oprijem ostane na izračunani liniji (`rubberAt`, +2 %, in `marbles()`, −6 %): fizika vožnje se ne spreminja (`CLAUDE.md`, Seje, »Proge in grafika«). Reference `tests/golden/races.json` in `tests/golden/sim.json` se ne smejo spremeniti.
- Nov sloj na odprtih cestah brez boksov: preveri obremenitev telefona (`perf`, do ~300 klicev risanja).
- **Ni v potrjenem obsegu:** stalni pasovi gume in sledi gum v svetovih (`js/world-tianmen.js` ~257, `js/world-spa.js` ~161, `tyreMarks` v `js/world.js` ~3686, okoli 17 svetov; +4–6 h). Ostanejo na izračunani liniji; ob predogledu to pokaži uporabniku in vprašaj.

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

## Izvedba
- Grafika: Fable 5.2, ena seja, brez več agentov (`CLAUDE.md`, Seje). Ocena: ~3 h dirkališča in 1–2 h odprte ceste.
- Pred `main`: slike zdaj/potem za uporabnika (kamera za avtom; Spa in Tianmen). Testne proge ostanejo zamrznjene.
- Račun: partyslo (tabla #382, komentar 6755119724; `docs/vrsta.md`, »Načrtovano«).
