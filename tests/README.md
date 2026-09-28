# Testi

Samodejni testi za igro. Igra sama ne potrebuje namestitve; testi potrebujejo le Node.js (22) in za teste
v brskalniku Playwright (`npm install` ga namesti, `npx playwright install chromium` prenese brskalnik).

```sh
npm install          # enkrat
npm test             # vse (~8 min)
npm run test:node    # samo fizika, AI in dirke (~1 min)
npm run test:browser # samo testi v brskalniku (~7 min)
```

## Kaj preverjajo

| Test | Kaj preveri |
|---|---|
| `golden.test.js` | Determinizem: 8 prog × 3 postavitve (dirka, demo na naslovnem zaslonu, izboljšan avto) × 2 fiziki, po 60 s. Celotno stanje vseh avtov se vsakih 10 s zapiše v prstni odtis in primerja z `golden/sim.json`. Zazna **vsako** spremembo fizike, AI ali pravil dirke. |
| `races.test.js` | Cele dirke z AI na vseh progah z obema fizikama: vsi avti pridejo do cilja, brez vrtenja, malo stikov z ograjo, čas zmagovalca največ ±3 % od reference (`golden/races.json`). |
| `cs-handling.test.js` | Značilnosti fizike Circuit Superstars (iz analize posnetka): oprijem v zavojih, kot drsenja, odziv, samodejna poravnava na izhodu, zaviranje v zavoju, pospešek 0–100, zavorna pot. |
| `browser/smoke.test.mjs` | Stran se naloži (http in lokalna datoteka), 20 s vožnje na vsaki progi, nastavitve in prenos starih nastavitev, preklop fizike med dirko, demo na naslovnem zaslonu, rekord na Pikes Peaku, brez napak na strani. |
| `browser/world.test.mjs` | Prstni odtis zgrajenega 3D sveta vsake proge (vsi modeli, rekviziti, gledalci, tla) primerjan z `golden/world.json`. |
| `browser/pits.test.mjs` | Cela dirka v Bakrenem gozdu s postankom v boksih: ustavitev, mehaniki, dvig na dvigalkah, popravilo, vsi avti v cilju. |
| `browser/memory.test.mjs` | Pomnilnik: trije krogi menjav vseh prog, ponovni start in brskanje po avtih v meniju; geometrija, teksture, programi senčilnikov in pomnilnik JavaScripta ne smejo rasti. |

## Referenčne vrednosti

Datoteke v `golden/` so posnetek pravilnega obnašanja. Če spremembo naredimo **namenoma** (npr. uglasimo fiziko ali
dodamo drevesa na progo), jih osvežimo z `npm run golden:update` in spremembo razložimo v commitu. Pri preurejanju
kode brez sprememb obnašanja se ne smejo spremeniti.

Z `GAME_ROOT=/pot/do/druge/kopije` lahko teste poženemo na drugi kopiji igre (npr. starejši različici).
