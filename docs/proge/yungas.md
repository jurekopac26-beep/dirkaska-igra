# Yungas, Bolivija (kronometer s cisterno)

[← Vse proge](../../README.md#proge) · proga `yungas` (`js/tracks/yungas.js`, svet `js/world-yungas.js` na podatkovnem graditelju `js/world-gore.js`)

Stara enopasovna cesta Nor Yungas v Boliviji, vsekana v steno doline nad oblačnim gozdom (odsek pod prelazom, proti Coroicu). Brez vzdevka te ceste in brez spominskih križev ob njej (`docs/gorske-proge.md`). Proga 4 prog za cisterno (`docs/proge-cisterna.md`, odločitve uporabnika 8. 11. 2026).

- **Samo cisterna, na čas**: TITAN CISTERNA (tudi če je igralec nima; `vehicle: 'cisterna'`), brez tekmecev in prometa; cilj je pripeljati cisterno do konca. Medalje: čas avtopilota s cisterno × 1,02 (zlato), × 1,15 (srebro), × 1,40 (bron).
- **Odsek**: 478 m spusta z 2557 na 2521 m (−7,5 %), ovinki do polmera ~18 m.
- **Cesta**: pol širine 2 m; prepad brez ograje na levi ob 90 % dirke (teren 40 m niže že 30 m od osi), na desni lomljena skalna stopnica; grbine v utrjenem makadamu.
- **Površje** (razgibana cesta, odločitev uporabnika 9. 11. 2026; `relief`, `docs/proge-cisterna.md`): stara enopasovna cesta v pobočju: globoke mokre kolesnice, blato, luže, prehodi potokov s kamni v strugi, nagib proti prepadu; nanosi plazov s stene, odriniti le do polovice, cesto zožijo.
- **Svet**: gost oblačni gozd, megla v dolini pod cesto, kondorji nad dolino, nosati medvedki ob cesti.
- **Avtopilot**: največ 40 km/h (`aiVmax`), nad prepadom pol oprijema v ovinku (`dropCare`), skozi serpentine po širši črti (`wideLine`).
- **Podatki**: sredinska črta iz OpenStreetMap; višine in prepadi iz Copernicus GLO-30, grbine izmišljene, vsakič enake (uvoznik `tools/proga-uvoz.mjs`: `prepad`, `grbine`, `siri`); raba tal ESA WorldCover.
- **Približki**: skale, grmovje, drevesa in živali so razporejeni po rabi tal in naklonu, ne po resničnih legah; strmina pod robom prepada je strmejša od višinskega modela (polica, `ledge` v slogu sveta); table generične, brez imen podjetij.
