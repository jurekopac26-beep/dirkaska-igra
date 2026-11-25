# Ujarrás, Kostarika (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `ujarras` (`js/tracks/ujarras.js`, svet `js/world-ujarras.js` na podatkovnem graditelju `js/world-gore.js`)

Cesta nad dolino Orosi v osrednji Kostariki, v pravem merilu: **od spodnjega odcepa skozi tropski gozd v tekočih ovinkih navkreber, na ~40 % dolžine (283 m od starta) tik mimo razgledišča nad dolino, do cilja nad zadnjim odcepom**: 0,71 km in ~40 m vzpona (~1215–1255 m). Proga 20 sklopa kratkih prog (`docs/gorske-proge.md`), odločitev uporabnika 15. 11. 2026 (kratka proga z znamenitostjo, ki jo prevoziš med dirko). Kartica proge je ena, s stikalom **Dirka / Kronometer / Promet / Policija**, kot na Vršiču:

- **Dirka**: tekmeci, start spodaj, en vzpon do cilja, mimo razgledišča na sredini.
- **Kronometer**: sam proti uri, štiri kontrolne točke, medalje zlata 0:23, srebrna 0:24, bronasta 0:26 (v dežju 0:28 / 0:30 / 0:32).
- **Promet** in **Policija**: kot na Vršiču, po desni; pobegneš čez cilj (»Do cilja«).

Okolica:

- **Razgledišče** (`js/world-ujarras.js`, na legi razgledišča iz OpenStreetMap, ~40 % dolžine dirke): terasa iz opečnatih ploščic na podpornem zidu ob zunanji strani ovinka, bela balustrada s stebrički proti dolini, nadstrešek s štirikapno streho iz korcev in dvema mizama s klopmi, klopi z razgledom, daljnogled na kovance, majhen pastelni kiosk s pločevinasto streho, korita z bugenvilijami, dve cvetoči drevesi, palma in skale. Vse generično, brez napisov, imen in podob; drevesa gozda razgledišču puščajo prostor (`clear` graditelja gorskih cest).
- **Obcestje** (`js/world-ujarras-obcestje.js`, po OpenStreetMap, 22. 11. 2026): obe stranski cesti se nadaljujeta do pravih koncev, kjer sta prej zbledeli v tla – cesta nad progo po pobočju (~500 m) in cesta v dolino (~205 m); ob startu križišče z ulicama proti jugu (224 m) in severu (165 m; a narisana – desni steber portala stoji v njenem ustju, b ne – vprašanje v PR); južno od ceste ulica (455 m) in na njej makadam (80 m). Širina po razredu kot pri stranskih cestah (residential brez oznake širine: 6 m), asfalt; makadam (surface=unpaved) 6 m. Kjer poti prečkajo bankino, mehki rob leži na njej. Vožnja, fizika in hribi se ne spremenijo (brez novih `def.sideRoads`). Slike: `docs/slike/ujarras/`.
- **Gozd**: tropski listavci (10–18 m) po rabi tal ESA WorldCover, papige; ob cesti trava.
- **Cesta**: ozka (6,6 m), rumene črte (`road.line: 'yellow'`), kot na kostariških cestah. **Padca čez rob ni**: kjer teren pada in na zunanji strani ostrejših ovinkov stoji odbojna ograja (`rails` graditelja gorskih cest).
- **Ljudje**: gledalcev je čim manj (redke mirne skupine), redarji in snemalci ob startu in cilju.
- **Podatki**: sredinska črta, stranske ceste, razgledišče in parkirišča iz OpenStreetMap; višine Copernicus GLO-30; raba tal ESA WorldCover (uvoznik `tools/proga-uvoz.mjs`). Viri so v `README.md`, »Zasluge«.
- **Približki**: drevesa, skale, živali in gledalci so razporejeni po rabi tal in naklonu, ne po resničnih legah; razgledišče je poenostavljeno in generično, table generične (START, FINISH, HILL CLIMB), brez imen podjetij in prireditev.
