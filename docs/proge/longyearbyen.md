# Longyearbyen, Norveška (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `longyearbyen` (`js/tracks/longyearbyen.js`, svet `js/world-longyearbyen.js` na podatkovnem graditelju `js/world-gore.js`)

Longyearbyen (Norveška), na Svalbardu pri 78° severne širine. Proga 17 sklopa kratkih prog (`docs/gorske-proge.md`); proga na ledu (potrjeno 13. 11.).

**Značaj**: najsevernejše mesto proge. Ceste so kratke in ravne, a vse leto pod snegom: start ob obali Adventfjordna (cesta 600), pri mostu čez Longyearelvo oster zavoj v središče mesta, nato cesta 500 med pisanimi lesenimi hišami in cevmi daljinskega ogrevanja na kolih ter cesta 100 po dolini Longyeardalen navzgor do starih rudarskih barak v Nybynu. 4,31 km, 2→114 m, največ 6,8 %; brez dreves (polarna tundra), gola pobočja in melišča.

**Zanimivosti do 60 m** (iz OSM; seznam potrdi uporabnik): obala Adventfjordna (0–1,35 km); most čez Longyearelvo (~1,25 km); stavbe univerze in ljudske šole (~1,35 km); središče s spomenikom (~1,42 km); pisane lesene hiše (~140); cevi daljinskega ogrevanja na kolih (28); stebri stare tovorne žičnice za premog (3); potok v Vannledningsdalnu (~2,45 km); športna dvorana in stadion (~2,8–2,9 km); spomenik (~3,0 km); rezervoarji (6); skalne stene in melišča; stare rudarske barake v Nybynu (~4,2–4,35 km); opozorilna tabla za polarne medvede ob cilju (~4,35 km). Brez podjetij, hotelov in lokalov.

**Led**: posebne fizike ledu igra nima (fizika vožnje se ne spreminja); zimska podlaga je sneg kot na drugih zimskih progah.

- **Dirka**, **kronometer**, **promet**, **policija**: kot na Vršiču (štiri vožnje na eni kartici).
- **Podatki**: sredinska črta, stranske ceste, stavbe, žičnice, smučarske proge, voda in parkirišča iz OpenStreetMap; višine Copernicus GLO-30; raba tal ESA WorldCover (uvoznik `tools/proga-uvoz.mjs`).
- **Približki**: drevesa, skale, gledalci, smučarji in živali so razporejeni po rabi tal in naklonu, ne po resničnih legah; stavbe in žičnice so poenostavljene, table generične, brez imen podjetij.
- **Obcestje** (`js/world-longyearbyen-obcestje.js`, po OpenStreetMap, 23. 11. 2026): nadzemni cevovodi mesta na lesenih podpornikih ~1 m nad snegom (a: aluminijasta obloga, b: v lesenem zaboju), lesena podpornika in vrvi stare tovorne žičnice za premog (višina 12 m ni v OSM), šest okroglih rezervoarjev (višina je približek), ograje in oporni zidovi. Zaradi rezervoarjev se je pri nekaj stavbah spremenila barva (žreb barv stavb). Vožnja, fizika in `def.hills` so nespremenjeni.
