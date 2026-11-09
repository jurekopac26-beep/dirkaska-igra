# Fairy Meadows, Pakistan (kronometer s cisterno)

[← Vse proge](../../README.md#proge) · proga `fairymeadows` (`js/tracks/fairymeadows.js`, svet `js/world-fairymeadows.js` na podatkovnem graditelju `js/world-gore.js`)

Jeep cesta iz doline Inda proti Fairy Meadows v Gilgit-Baltistanu na severu Pakistana (spodnji del, v suhi soteski). Proga 2 prog za cisterno (`docs/proge-cisterna.md`, odločitve uporabnika 8. 11. 2026).

- **Samo cisterna, na čas**: TITAN CISTERNA (tudi če je igralec nima; `vehicle: 'cisterna'`), brez tekmecev in prometa; cilj je pripeljati cisterno do konca. Medalje: čas avtopilota s cisterno × 1,02 (zlato), × 1,15 (srebro), × 1,40 (bron).
- **Odsek**: 489 m vzpona z 1837 na 1861 m (+5 %), tri serpentine (najmanjši polmer ~12 m).
- **Cesta**: pol širine 2 m, v serpentinah do 2,9 m (`widths`: toliko, da jih cisterna zvozi naprej; prikolica reže notranji rob); prepad brez ograje ob 63 % dirke, na drugi strani lomljena skalna stopnica; 84 grbin v makadamu.
- **Svet**: siva soteska, grušč in prah, temna skala na strminah, redki bori in grmičevje, koze ob cesti, ujeda nad dolino.
- **Avtopilot**: največ 40 km/h (`aiVmax`), nad prepadom pol oprijema v ovinku (`dropCare`), skozi serpentine po širši črti (`wideLine`).
- **Podatki**: sredinska črta iz OpenStreetMap; višine in prepadi iz Copernicus GLO-30, grbine izmišljene, vsakič enake (uvoznik `tools/proga-uvoz.mjs`: `prepad`, `grbine`, `siri`); raba tal ESA WorldCover.
- **Približki**: skale, grmovje, drevesa in živali so razporejeni po rabi tal in naklonu, ne po resničnih legah; strmina pod robom prepada je strmejša od višinskega modela (polica, `ledge` v slogu sveta); table generične, brez imen podjetij.
