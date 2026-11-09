# Svalvogar, Islandija (kronometer s cisterno)

[← Vse proge](../../README.md#proge) · proga `svalvogar` (`js/tracks/svalvogar.js`, svet `js/world-svalvogar.js` na podatkovnem graditelju `js/world-gore.js`)

Makadamska cesta okoli polotoka med fjordoma Dýrafjörður in Arnarfjörður na skrajnem severozahodu Islandije (odsek pri Svalvogarju). Proga 1 prog za cisterno (`docs/proge-cisterna.md`, odločitve uporabnika 8. 11. 2026).

- **Samo cisterna, na čas**: TITAN CISTERNA (tudi če je igralec nima; `vehicle: 'cisterna'`), brez tekmecev in prometa; cilj je pripeljati cisterno do konca. Medalje: čas avtopilota s cisterno × 1,02 (zlato), × 1,15 (srebro), × 1,40 (bron).
- **Odsek**: 486 m med štartom in ciljem, 32–36 m nad morjem, skoraj ravno; dolgi zavoji (najmanjši polmer ~38 m).
- **Cesta**: polica v pobočju nad morjem, pol širine 2 m (cisterna je široka 2,5 m); prepad proti morju na desni ob 61 % dirke, brez ograje (`drops`: kdor zapelje čez rob, pade); na drugi strani lomljena skalna stopnica; 79 grbin in jam v makadamu (`bumps`).
- **Svet**: mah in trava brez dreves, temna skala na strminah, balvani, morje pod cesto (`sea` v slogu sveta), ovce.
- **Avtopilot**: največ 40 km/h (`aiVmax`), nad prepadom pol oprijema v ovinku (`dropCare`), skozi serpentine po širši črti (`wideLine`).
- **Podatki**: sredinska črta iz OpenStreetMap; višine in prepadi iz Copernicus GLO-30, grbine izmišljene, vsakič enake (uvoznik `tools/proga-uvoz.mjs`: `prepad`, `grbine`, `siri`); raba tal ESA WorldCover.
- **Približki**: skale, grmovje, drevesa in živali so razporejeni po rabi tal in naklonu, ne po resničnih legah; strmina pod robom prepada je strmejša od višinskega modela (polica, `ledge` v slogu sveta); table generične, brez imen podjetij.
