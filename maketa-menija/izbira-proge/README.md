# Maketa: izbira proge

Interaktivna maketa novega zaslona za izbiro proge (načrt v `docs/meni-izbira-proge.md`). Ni del igre: igra je v `js/menu.js`, ta mapa je predloga za sklope 1–6 in za sklop vremena.

## Ogled

Strežnik iz korena repozitorija, nato `maketa-menija/izbira-proge/index.html`:

- `#t=<proga>&cam=<1-3>&wx=<vreme>` izbere progo (`vrsic`, `nring`, `spa`, `pikes`, `suzuka`, `rbring`, `ouninpohja`), kamero in vreme (`dry`, `rain`, `change`, `storm`, `snow`).
- Dotik ikone vremena spremeni cel zaslon (dež, strela, mavrica, sneg na gumbih, tabli in avtu, moker pod z odsevom).
- Gumbi kamer in zastavi sosednjih prog odprejo drugo sliko ali progo; Race! in puščica nazaj le pokažeta obvestilo.
- `?static` naloži samo zaslon (za orodja v `orodja/`).
- `table.html` nariše tablo izbrane države brez zastave in na 6 načinov z zastavo (glej `orodja/table.mjs`).

## Datoteke

| Datoteka | Kaj je |
|---|---|
| `index.html` | zaslon (`window.MOCK(T)` iz nastavitev proge) in zagon žive makete |
| `wxfx.js` | vreme čez cel zaslon, senca avta, table 20 držav (`SIGNS`, `signLook`) |
| `globe.js` | globus v glavi: osvetljen, odsev na morju, ozračje, oblaki, država zlata, pika na progi; ob menjavi proge se zavrti do nove države |
| `proge.js` | 7 prog: nastavitve zaslona in slike treh kamer |
| `table.html` | list tabel ene države z zastavo na 6 načinov |
| `table-drzav.json` | raziskava tabel 20 držav (vrsta table, barve, okvir, pisava, viri) |
| `mk/` | `earth2k.webp` (tekstura Zemlje na pol velikosti), slike avtov iz igre (prozorno ozadje), zemljevid, prelet in zavoj Vršiča, črte vetra za BURJO |
| `orodja/` | `vreme.mjs` (slike vremen), `video.mjs` (video prehodov), `table.mjs` (listi tabel), `avto.mjs` + `alfa.py` (slika avta iz igre), `proge/*.json` (nastavitve za orodja) |

Orodja potrebujejo Playwright iz `npm install` in `ffmpeg` (video); slike gredo v začasno mapo ali v `OUT`.

## Pravno

Imena na tablah so samo imena držav v angleščini; pisave so prosto dostopne nadomestne (Roboto). Viri raziskave tabel so v `table-drzav.json` (Wikipedija, uradni pravilniki, brez Google Maps in Street View). Posnetek preleta Štajerske kaže na stavbi ob progi ime sponzorja, zato maketa pri kameri 2 za Štajersko uporabi helikopterski posnetek; pred objavo je treba prelet posneti znova.
