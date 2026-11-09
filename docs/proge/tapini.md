# Tapini, Papua Nova Gvineja (kronometer s cisterno)

[← Vse proge](../../README.md#proge) · proga `tapini` (`js/tracks/tapini.js`, svet `js/world-tapini.js` na podatkovnem graditelju `js/world-gore.js`)

Zemljena cesta v gorah osrednje Papue Nove Gvineje blizu Tapinija (Tapini Highway). Proga 5 prog za cisterno (`docs/proge-cisterna.md`, odločitve uporabnika 8. 11. 2026).

- **Samo cisterna, na čas**: TITAN CISTERNA (tudi če je igralec nima; `vehicle: 'cisterna'`), brez tekmecev in prometa; cilj je pripeljati cisterno do konca. Medalje: čas avtopilota s cisterno × 1,02 (zlato), × 1,15 (srebro), × 1,40 (bron).
- **Odsek**: 483 m spusta s 636 na 590 m (−9,5 %), dolgi ovinki (najmanjši polmer ~28 m).
- **Cesta**: pol širine 2 m; prepad brez ograje na desni ob 88 % dirke (teren ~47 m niže 30 m od osi), na levi lomljena skalna stopnica; rjava zemlja, 77 grbin.
- **Površje** (razgibana cesta, odločitev uporabnika 9. 11. 2026; `relief`, `docs/proge-cisterna.md`): glinasta cesta, ki jo je zgradil buldožer: zelo globoke kolesnice, blatne jame, dolgi valovi levo in desno; čez najhujše blato hlodi, položeni počez (tresejo, moker les drsi).
- **Svet**: deževni gozd z listavci, trava na grebenih, papige nad cesto.
- **Avtopilot**: največ 40 km/h (`aiVmax`), nad prepadom pol oprijema v ovinku (`dropCare`), skozi serpentine po širši črti (`wideLine`).
- **Podatki**: sredinska črta iz OpenStreetMap; višine in prepadi iz Copernicus GLO-30, grbine izmišljene, vsakič enake (uvoznik `tools/proga-uvoz.mjs`: `prepad`, `grbine`, `siri`); raba tal ESA WorldCover.
- **Približki**: skale, grmovje, drevesa in živali so razporejeni po rabi tal in naklonu, ne po resničnih legah; strmina pod robom prepada je strmejša od višinskega modela (polica, `ledge` v slogu sveta); table generične, brez imen podjetij.
