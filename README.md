# Osnutki ikone igre (ni za `main`)

Veja hrani osnutke ikone, da se ne izgubijo, dokler uporabnik ne izbere. Igra jih ne uporablja.

- Kandidati: **2 · Svet z robom** (`2-rob.png`, okrogla `2-rob-maska.png`; `ikone6.cjs`), **S6 Noč** (`s6.png`) in **S10 Znak** (`s10.png`; oba `ikone5.cjs`). Pregledi: `pregled-*.jpg`.
- Izris: `NODE_PATH=/opt/node-tools/node_modules node ikone5.cjs` (ali `ikone6.cjs`); skripte se kličejo med sabo (`ikone.cjs`, `ikone2.cjs`, `ikone3.cjs`).
- Po izbiri gre izbrani SVG v `tools/icons.mjs` (`svg()`), okrogla različica z `fit` 0,76 (vsebina v varnem krogu), nato znova 4 PNG (icon-192/512, icon-maskable-512, apple-touch-icon 180).
- Brez avtomobilskih znamk, napisov in logotipov.
