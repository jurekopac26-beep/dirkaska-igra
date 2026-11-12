# Realizem, paket G · Rastje in teren (~16 sej, na `main` za S)

Del `docs/realizem.md` (razdeljen po paketih 11. 11. 2026, ukrep 5 »Manj sklopov«, `docs/varcevanje.md`). Odločitve uporabnika, proge, postopek, pravna ocena, čas in vrsta so v `docs/realizem.md`.

- **Kaj se spremeni:**
  - Gozd, grmovje in golo skalovje so v pasu ob cesti v enakem deležu kot v resnici (WorldCover).
  - Trava je brez pasov košnje, razen kjer jih ima resnična proga.
  - Ob asfaltu je ozek pas zemlje in gramoza.
  - Barve tal so iz Sentinel-2, svetloba in ton po državi.
  - Kjer višinski model zgladi pečine (Chapman's Peak, Tianmen), je teren po meri.
  - Oblika dreves (»mehke krogle«) ostane.
- **Koraki:**
  - G0: WorldCover in Sentinel-2, kompleti rastja po podnebju, svetloba po državah.
  - G1–G4: skupine 1–4.
- **Telefon:**
  - Barve in svetloba stanejo 0 klicev.
  - Gozd do ceste je glavno tveganje za oglišča. Do 60 m so podrobna drevesa, za tem ploskve krošenj.
- **Seje:** ~8–9 za orodje in komplete, ~0,5 na progo.
- **Datoteke:**
  - `tools/proga-podatki.py` (WorldCover, Sentinel-2);
  - `js/world.js` (rastje po razredih, pas zemlje, zima na severu);
  - `js/render.js` (svetloba in ton po državi);
  - podatki v `js/tracks/<id>.js`.
- **Tveganje:**
  - oglišča gozda do ceste;
  - barve in svetloba ne smejo spremeniti drugih prog (slike `gfx`).

## G0 · sestavni deli (v delu)

Veja `realizem/g0-rastje-teren`, jure.kopac26 (odločitev uporabnika 12. 11. 2026 ob ~19.30 prek Mateja, tabla #382, komentar 6830929804; prej partyslo od ~17. 11.). G0 na progah ne dela; prehod na proge pride po G0, skupaj s S.

Kosi, vsak v svojem commitu:
1. **Orodje** (`tools/proga-podatki.py`): deleži razredov WorldCover v pasu do 60 m ob cesti (po odsekih, levo in desno) in barve tal iz letnega mozaika Sentinel-2.
2. **Kompleti rastja po podnebju**: nova datoteka `js/world-rastje.js`; v `js/world.js` samo kratki priklopi, da so spori z E (#657, `js/world-cesta.js`) in S0 (#668) majhni.
3. **Svetloba in ton po državah** (`js/render.js`, kratek priklop; tabela v `js/world-rastje.js`).
4. **Mehak prehod med travo ob cesti in pobočjem** (odločitev uporabnika 12. 11. 2026 ob ~14.25 prek Mateja): samo prave proge, zamrznjene ostanejo do pike enake.

Pred `main`: 2–3 možnosti s slikami naenkrat in slike zdaj in potem (Spa, Belgija) na strani Odločitve.
