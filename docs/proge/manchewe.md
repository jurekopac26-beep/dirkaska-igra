# Manchewe, Malavi (kronometer s cisterno)

[← Vse proge](../../README.md#proge) · proga `manchewe` (`js/tracks/manchewe.js`, svet `js/world-manchewe.js` na podatkovnem graditelju `js/world-gore.js`)

Zemljena cesta po strmem robu tektonskega jarka pri slapovih Manchewe na severu Malavija (Golodi Road, med jezerom in planoto). Proga 3 prog za cisterno (`docs/proge-cisterna.md`, odločitve uporabnika 8. 11. 2026).

- **Samo cisterna, na čas**: TITAN CISTERNA (tudi če je igralec nima; `vehicle: 'cisterna'`), brez tekmecev in prometa; cilj je pripeljati cisterno do konca. Medalje: čas avtopilota s cisterno × 1,02 (zlato), × 1,15 (srebro), × 1,40 (bron).
- **Odsek**: 489 m spusta s 1011 na 967 m (−9 %), dve serpentini (najmanjši polmer ~12 m).
- **Cesta**: pol širine 2 m, v serpentinah do 2,9 m; prepad brez ograje ob 96 % dirke (zamenja stran za serpentino), na drugi strani lomljena skalna stopnica; rdeča zemlja, 79 grbin.
- **Svet**: gozdnata savana z listavci in travo, koze ob cesti.
- **Avtopilot**: največ 40 km/h (`aiVmax`), nad prepadom pol oprijema v ovinku (`dropCare`), skozi serpentine po širši črti (`wideLine`).
- **Podatki**: sredinska črta iz OpenStreetMap; višine in prepadi iz Copernicus GLO-30, grbine izmišljene, vsakič enake (uvoznik `tools/proga-uvoz.mjs`: `prepad`, `grbine`, `siri`); raba tal ESA WorldCover.
- **Približki**: skale, grmovje, drevesa in živali so razporejeni po rabi tal in naklonu, ne po resničnih legah; strmina pod robom prepada je strmejša od višinskega modela (polica, `ledge` v slogu sveta); table generične, brez imen podjetij.
