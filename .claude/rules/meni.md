---
paths:
  - "js/menu.js"
  - "js/menu-data.js"
  - "css/menu.css"
  - "maketa-menija/**"
  - "assets/tracks/**"
  - "tests/browser/menu.test.mjs"
  - "tools/menu-*"
---

# Meni (`js/menu.js`, `css/menu.css`)

- Naslovnica, izbira načina in izbira proge so nov meni v angleščini (opis v `README.md`, razdelek »Nov meni«). Meni bere progo iz igre (ime »Kraj, Država« razdeli v ime in državo, opis in angleško ime vzame iz `js/lang.js`), zato nova proga v meniju nastopi sama.
- Nova proga potrebuje **sliko za meni**: `assets/tracks/<id>.webp` in `<id>-rain.webp` (maketa terena; izris v `maketa-menija/orodja/`, glej `maketa-menija/README.md`). Zemljevid od zgoraj, prelet in helikopterski posnetek (`js/routes.js`, `assets/maps/`) so po želji pozneje.
- Meni mora delovati pokonci in ležeče (od 360 × 640 oz. 640 × 360 naprej); po spremembi zaženi `node tests/browser/menu.test.mjs`.
- `js/menu-data.js` delno izdelajo orodja (`tools/menu-lens.js`, `tools/menu-globe.mjs`, `tools/menu-corner.mjs`): pri sporu podatke ustvari znova z orodjem, ne spajaj jih ročno.
