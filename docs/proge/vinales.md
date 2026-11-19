# Viñales, Kuba (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `vinales` (`js/tracks/vinales.js`, svet `js/world-vinales.js` na podatkovnem graditelju `js/world-gore.js`)

Viñales (Kuba): 1,34 km asfaltne ceste: 110 m po glavni cesti, desni zavoj (~103°) in po dolini Viñales, rahlo navzdol, med mogoti (strmimi apnenčastimi stolpi, porasli z gozdom). Proga 17 sklopa kratkih prog (`docs/gorske-proge.md`), namesto Santiaga de Cube (El Morro je na slepi cesti).

- **Znamenitost**: mogoti, vzhodni masiv od ~47 % do ~88 % dirke 28–45 m od sredine ceste (60–150 m visoko; trije stolpi ~14 m od sredine pri ~51, ~61 in ~68 %), nižji zahodni od ~58 % do ~80 %; prvih ~600 m (glavna cesta in dno doline) je brez mogotov; lege in višine iz Copernicus GLO-30. Vse v eni zamenljivi funkciji `mogotes()` v `js/world-vinales.js` (podatki `MOGOTES`, graditelju znana samo prek `S.extra` in `S.clear`): model `.glb` iz `assets/landmarks/` jo lahko zamenja.
- **Brez**: stenske poslikave v dolini (umetnina), napisov in imen lokalov.

- **Dirka**, **kronometer**, **promet**, **policija**: kot na Vršiču (štiri vožnje na eni kartici).
- **Podatki**: sredinska črta, stranske ceste, stavbe, voda in parkirišča iz OpenStreetMap; višine Copernicus GLO-30; raba tal ESA WorldCover (uvoznik `tools/proga-uvoz.mjs`).
- **Izletna cona** (`docs/proge-po-drzavah.md`): ograja, zid ali prepad do 3 m od roba asfalta na 0 % dolžine dirke, na obeh straneh 0 % (v igri 19. 11. 2026; povprečno 4,7 m do roba proge). Rob proge avto ustavi, zato ne pade čez rob (pravilo »Padec čez rob samo na Killarju«).
- **Približki**: drevesa, skale, gledalci in živali so razporejeni po rabi tal in naklonu, ne po resničnih legah; stavbe so poenostavljene, table generične, brez imen podjetij.
