---
paths:
  - "js/render.js"
  - "js/world*.js"
  - "js/tex.js"
  - "js/game.js"
  - "js/tracks/**"
  - "docs/proge/**"
  - "tests/golden/perf.json"
  - "tests/browser/perf.test.mjs"
  - "tools/proga-podatki.py"
  - "tools/shot.mjs"
---

# Kamera, grafika in obremenitev telefona (odločitve uporabnika)

- V igri je samo **ena kamera**: **za avtom** (`chase`), na telefonu pokonci in ležeče. Kamere **izometrična**, **kino** in **kokpit** so izbrisane; ne dodajaj jih nazaj. V posnetku dirke sta še TV kamere ob progi in kamera za avtom, foto način ostane.
- Grafiko izboljšuj za kamero za avtom: obzorje, nebo, oddaljeni griči, cesta pred avtom in njeni robovi, teren ob njej. Detajli, ki jih s te kamere ni videti (drobni predmeti na višini oči, notranjosti, majhni napisi, strehe od zgoraj), so odveč: poenostavi jih, da je telefon manj obremenjen.
- **Gledalcev ob cesti na pravih progah je čim manj** (31. 10. 2026): `fewFans` v `js/world.js` pusti le redke skupine, mirne (brez skakanja); redarji, snemalci (`crowdPut(…, { staff: true })`), mehaniki in tribune ostanejo. Nove proge gledalcev ob cesti ne dodajajo več, kot jih je treba.
- Obremenitev telefona: proga naj ima do ~300 klicev risanja in ~900 tisoč oglišč, v povprečju in v najbolj obremenjenem trenutku (`tests/golden/perf.json`: `maxCalls`, `maxKverts`; preverja `perf.test.mjs`); nova proga ali izboljšava ne sme povečati obremenitve drugih prog.
- Nova proga potrebuje sliko za meni: `assets/tracks/<id>.webp` in `<id>-rain.webp` (maketa terena, `maketa-menija/README.md`). Zemljevid od zgoraj, prelet in helikopterski posnetek (`js/routes.js`, `assets/maps/`) so po želji pozneje.
- Slike pred/po in meritve samo na pravih progah (testne proge ignoriraj, CLAUDE.md); za lastno preverjanje slike pri `deviceScaleFactor: 1`.
