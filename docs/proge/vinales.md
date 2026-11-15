# Viñales, Kuba (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `vinales` (`js/tracks/vinales.js`, svet `js/world-vinales.js` na podatkovnem graditelju `js/world-gore.js`)

Viñales (Kuba): 0,92 km asfaltne ceste po dolini Viñales, rahlo navzdol, med mogoti (strmimi apnenčastimi stolpi, porasli z gozdom). Proga 17 sklopa kratkih prog (`docs/gorske-proge.md`), namesto Santiaga de Cube (El Morro je na slepi cesti).

- **Znamenitost**: mogoti, vzhodni masiv od ~28 % do ~67 % dirke 36–43 m od sredine ceste (60–150 m visoko), nižji zahodni od ~55 % do ~88 %; lege in višine iz Copernicus GLO-30. Vse v eni zamenljivi funkciji `mogotes()` v `js/world-vinales.js` (podatki `MOGOTES`, graditelju znana samo prek `S.extra` in `S.clear`): model `.glb` iz `assets/landmarks/` jo lahko zamenja.
- **Brez**: stenske poslikave v dolini (umetnina), napisov in imen lokalov.

- **Dirka**, **kronometer**, **promet**, **policija**: kot na Vršiču (štiri vožnje na eni kartici).
- **Podatki**: sredinska črta, stranske ceste, stavbe, žičnice, smučarske proge, voda in parkirišča iz OpenStreetMap; višine Copernicus GLO-30; raba tal ESA WorldCover (uvoznik `tools/proga-uvoz.mjs`).
- **Približki**: drevesa, skale, gledalci, smučarji in živali so razporejeni po rabi tal in naklonu, ne po resničnih legah; stavbe in žičnice so poenostavljene, table generične, brez imen podjetij.
