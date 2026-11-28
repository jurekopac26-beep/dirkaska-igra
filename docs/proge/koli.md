# Koli, Finska (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `koli` (`js/tracks/koli.js`, svet `js/world-koli.js` na podatkovnem graditelju `js/world-gore.js`)

Koli (Finska): zgornji del ceste Ylä-Kolintie v narodnem parku Koli nad jezerom Pielinen, od gozda pod pobočjem do vasi Ylä-Koli pod vrhom. Nova finska proga za 1.0 (`docs/proge-po-drzavah.md`, »Finska: Koli«), ki nadomesti Harju: ta dobi `test: true`, ko je Koli na `main`. Proga 17 sklopa kratkih prog (`docs/gorske-proge.md`).

- **Pot**: 1,97 km med štartom in ciljem, od 159 do 306 m (vzpon ~150 m, najbolj strmo 11 %), pet ovinkov, od tega dve lasnici (Serpentina 1 in 2) in še ena ostra pred njima; štart 188 m za črto (22 avtov), izteki 102 m za ciljem. Vozi se po desni.
- **Sever v snegu**: svet je zasnežen v vsakem letnem času (`snow: 'all'` v `World.gore`), zgrnjen sneg ob cesti, gozd smrek in borov, smučarji in žičnice nad vasjo. Cesta je splužen asfalt brez črt; **zbit sneg je samo na odseku 1640–1940 m** po startu (300 m od 1966, okoli 15 %, dovoz do zgornjega okljuka v gozdu; odločitev 28. 11. 2026 namesto zbitega snega od začetka do konca z dne 24. 11.), narisan s kolesnicami, in **tam vedno sneži** (škatla snežink za avtom kot pri Pikes Peaku, `js/world-koli.js`, samo videz; pojemanje ±40 m). V igri je zbit sneg makadam mešane etape v zasneženem svetu (`def.surf`, vpisan za blokom uvoza v `js/tracks/koli.js`, fizika ni spremenjena): pozimi ima oprijem snega (`docs/dez-sneg.md`), sicer oprijem suhega makadama. Medalje kronometra so izmerjene na tej podlagi (avtopilot 53,8 s, dež 65,1 s, zima 67,7 s, sneg 79,2 s): zlato 54 s, pozimi 68 s. Sliki prej/potem: `docs/slike/koli/sneg-600m-*.webp` (asfalt), `sneg-1720m-*.webp` (sneženje).
- **Načrt in proga**: navodilo seje je reklo »krog/ovalna«, opis v `docs/proge-po-drzavah.md` pa 2 km vzpona po Ylä-Kolintie; proga sledi opisu (cesta je odprta, kroga tam ni).

- **Dirka**, **kronometer**, **promet**, **policija**: kot na Vršiču (štiri vožnje na eni kartici). Dirka: 21 tekmecev, v meniju *Opponents* od 0 do največ 21 (za ciljem je le ~105 m ceste do lasnice v Ylä-Koliju, večje polje bi parkiralo avto na avto; `maxRivals`).
- **Podatki**: sredinska črta, stranske ceste, stavbe, žičnice, smučarske proge, voda in parkirišča iz OpenStreetMap; višine Copernicus GLO-30; raba tal ESA WorldCover (uvoznik `tools/proga-uvoz.mjs`).
- **Približki**: drevesa, skale, gledalci, smučarji in živali so razporejeni po rabi tal in naklonu, ne po resničnih legah; stavbe in žičnice so poenostavljene, table generične, brez imen podjetij in hotelov (samo zemljepisna imena: Koli, Ylä-Koli, Pielinen).
- **Meni**: maketa `assets/tracks/koli.webp` in `-rain.webp` (`maketa-menija/orodja/proge_igra.json`), posnetek lasnic `assets/maps/corner-koli.webm` (`tools/menu-corners.json`).
- **Test**: `node tests/koli.test.js` (`tests/lib/gore.js`, dolžina 1,9–2,1 km, svet v snegu).
