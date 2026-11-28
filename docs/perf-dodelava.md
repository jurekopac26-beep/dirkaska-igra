# Perf dodelave prog (28. 11. 2026)

Odločitev O-28-43, tema 2. Predaja za grafiko po resetu. Samo merjenje; grafika in koda nespremenjeni.

## Kako je merjeno

- Vsaka veja `dodelava/*` z odprtim PR (#1196–#1260, 61 vej) v svojem delovnem drevesu, `PERF_ONLY=<proga> node tests/browser/perf.test.mjs` (844×390, NIZKA, sence, kamera za avtom, seme 12345, šest točk kroga).
- Proga = datoteke `js/tracks/*.js`, ki jih veja spremeni (pri vseh je to proga veje).
- Primerjava s `tests/golden/perf.json` na `main` (28. 11.). Meja CLAUDE.md: 300 klicev, 900 tisoč oglišč (povprečje in najbolj obremenjena točka; test pade šele nad 300 oz. 900).
- `dodelava/analiza` (#1195) spremeni samo `docs/dodelava-prog.md`, zato ni merjena.
- Mapileng (spremeni skupni `js/world-kratke.js`) in Isalo (skupni `js/world-zivali.js`): na veji tudi celoten perf vseh prog, **76/76 OK**, drugih prog ne spremenita.

## Rezultat

**Nobena veja ne prekorači meje; vseh 61 testov perf je zelenih.**

### Blizu meje (največ ≥ 280 klicev ali ≥ 850 tisoč oglišč)

| Proga | PR | Klici povp. (največ) | Oglišča k povp. (največ) | Verjeten vzrok |
|---|---|---|---|---|
| Silkeborg | #1202 | 246 (**300**) | 661 (738) | **Že na `main` 300** (referenca 290 je zastarela); veja ne doda geometrije. En klic več = rdeč test. |
| Sa Calobra | #1251 | 247 (295) | 672 (877) | enako kot `main`; gosta okolica vozla |
| Porto Moniz | #1254 | 245 (296) | 697 (855) | nova obala `js/world-portomoniz-obala.js` (+40k oglišč, +1 klic) |
| Koli | #1200 | 183 (293) | 683 (807) | lasten graditelj `js/world-koli.js` (+59k oglišč, +3 klici) |
| Batangas | #1207 | 244 (287) | 818 (862) | enako kot `main` |
| Rio Hondo | #1216 | 214 (286) | 676 (833) | enako kot `main` |
| Quezaltepeque | #1206 | 249 (280) | 740 (863) | enako kot `main` |
| Rbring | #1228 | 229 (280) | 545 (689) | +2 klica |
| Sepang | #1201 | 195 (234) | 731 (**899**) | enako kot `main`; 1k pod mejo |
| Lusail | #1225 | 182 (241) | 593 (896) | enako kot `main` |
| Kotor | #1240 | 219 (264) | 699 (893) | lasten svet nad zalivom `js/world-kotor.js` (+6k) |
| Zandvoort | #1217 | 212 (253) | 700 (885) | enako kot `main` |
| Tianmen | #1243 | 194 (233) | 723 (882) | gozd do ceste, podrast (`js/world-tianmen.js`, +144k; veja sama dvigne referenco) |
| Buriram | #1239 | 207 (257) | 719 (880) | enako kot `main` |

### Veliki skoki proti `main` (veja sama posodobi `perf.json`)

| Proga | PR | Spremembe največ (klici / oglišča k) | Vzrok |
|---|---|---|---|
| Mã Pí Lèng | #1236 | +7 / **+302** (281 → 583) | lasten svet `js/world-mapileng.js` (terase, kanjon Nho Quế) |
| Tapini | #1208 | +9 / +152 (271 → 423) | deževni gozd, reka |
| Tianmen | #1243 | +11 / +144 (738 → 882) | gozd do ceste; ostane 18k do meje |
| Isalo | #1218 | 0 / +104 (376 → 480) | savana, zebuji, stolpi |
| Ujarrás | #1204 | +1 / +60 | okolica |
| Koli | #1200 | +3 / +59 | brez posodobitve `perf.json` (v okviru +10 % +20k) |
| Savusavu | #1256 | +6 / +55 | okolica |

### Opombe za grafiko

- **Zastarele reference na `main`**: Silkeborg (največ 300, referenca 290) in Kågeröd (262 / 693k, referenca 279 / 730k): enako na `main` in na vseh vejah; ob prvem `npm run golden:update` se popravita. Silkeborg je treba razbremeniti (že na meji), ne glede na dodelavo.
- Canaries (#1238) −72k oglišč, +8 klicev: okolica razdeljena na več manjših mrež.
- Merjeno vsako vejo posebej; veje so 0–2 commita za `main`. Po združitvi več vej skupaj velja ponoviti celoten perf (skupne datoteke: Mapileng `world-kratke.js`, Isalo `world-zivali.js`, Silkeborg `game.js`).

## Vse veje

| Proga | PR | Klici povp. (največ) | Oglišča k povp. (največ) | Razlika največ proti `main` (klici / k) |
|---|---|---|---|---|
| aguascalientes | #1211 | 203 (225) | 463 (604) | +0 / +0 |
| balea | #1258 | 167 (176) | 399 (453) | +1 / +5 |
| batangas | #1207 | 244 (287) | 818 (862) | +0 / +0 |
| bathurst | #1213 | 175 (254) | 508 (557) | +0 / +0 |
| bikernieki | #1227 | 195 (243) | 471 (563) | +0 / +0 |
| buriram | #1239 | 207 (257) | 719 (880) | +0 / +1 |
| canaries | #1238 | 214 (231) | 625 (731) | +8 / -72 |
| caracoles | #1242 | 180 (230) | 379 (555) | +0 / +0 |
| chapman | #1247 | 169 (211) | 515 (586) | +0 / +0 |
| cusco | #1232 | 151 (183) | 373 (477) | +3 / +9 |
| eljem | #1215 | 118 (136) | 347 (496) | +0 / +0 |
| ella | #1249 | 187 (232) | 491 (704) | +0 / +0 |
| furka | #1252 | 174 (212) | 411 (558) | +1 / +26 |
| ghoufi | #1197 | 143 (201) | 265 (365) | +0 / +1 |
| gudauri | #1259 | 179 (219) | 545 (720) | +0 / +30 |
| hakone | #1255 | 200 (220) | 306 (347) | +0 / +2 |
| hiva | #1209 | 167 (206) | 543 (611) | +0 / +0 |
| isalo | #1218 | 126 (142) | 417 (480) | +0 / +104 |
| isuna | #1199 | 154 (175) | 230 (293) | -3 / +6 |
| izoard | #1248 | 190 (232) | 428 (543) | +0 / +0 |
| kagerod | #1221 | 236 (262) | 619 (693) | -17 / -37 |
| kanaba | #1205 | 208 (269) | 615 (779) | +0 / +0 |
| katu | #1226 | 168 (198) | 560 (747) | +0 / +0 |
| kildare | #1223 | 227 (263) | 543 (641) | +1 / +16 |
| killar | #1250 | 155 (182) | 371 (424) | +0 / +0 |
| koli | #1200 | 183 (293) | 683 (807) | +3 / +59 |
| koror | #1260 | 161 (192) | 444 (676) | +0 / +0 |
| kotor | #1240 | 219 (264) | 699 (893) | +0 / +6 |
| krasnahorka | #1235 | 115 (128) | 204 (243) | +4 / +4 |
| livorno | #1220 | 156 (185) | 370 (461) | +0 / +0 |
| llogara | #1253 | 177 (194) | 536 (633) | +14 / +43 |
| luanda | #1196 | 141 (171) | 326 (436) | +4 / -13 |
| lusail | #1225 | 182 (241) | 593 (896) | +0 / +0 |
| mapileng | #1236 | 149 (178) | 494 (583) | +7 / +302 |
| medeu | #1203 | 182 (204) | 499 (581) | +4 / +0 |
| mombasa | #1233 | 136 (215) | 335 (382) | +0 / -3 |
| montreal | #1230 | 209 (272) | 552 (682) | +0 / +0 |
| ngorongoro | #1245 | 159 (184) | 405 (474) | -4 / +24 |
| nring | #1224 | 179 (205) | 388 (419) | +0 / +0 |
| pembrey | #1222 | 225 (251) | 633 (806) | +0 / +0 |
| pikesg | #1246 | 153 (168) | 495 (598) | +7 / +10 |
| portobelo | #1231 | 123 (148) | 296 (354) | +0 / +2 |
| portomoniz | #1254 | 245 (296) | 697 (855) | +1 / +40 |
| quezaltepeque | #1206 | 249 (280) | 740 (863) | +0 / +0 |
| rastro | #1257 | 217 (269) | 629 (754) | -1 / +0 |
| rbring | #1228 | 229 (280) | 545 (689) | +2 / +0 |
| riohondo | #1216 | 214 (286) | 676 (833) | +0 / +0 |
| sacalobra | #1251 | 247 (295) | 672 (877) | +0 / +1 |
| sakhir | #1198 | 209 (236) | 741 (860) | +0 / +0 |
| santoantao | #1244 | 179 (217) | 448 (582) | +0 / +0 |
| savusavu | #1256 | 194 (232) | 555 (665) | +6 / +55 |
| seoul | #1219 | 139 (149) | 593 (721) | +0 / +0 |
| sepang | #1201 | 195 (234) | 731 (899) | +0 / +0 |
| silkeborg | #1202 | 246 (300) | 661 (738) | +10 / -47 |
| sosnova | #1229 | 204 (249) | 659 (835) | +0 / +6 |
| spa | #1234 | 188 (232) | 500 (619) | +0 / +1 |
| tapini | #1208 | 91 (100) | 380 (423) | +9 / +152 |
| tianmen | #1243 | 194 (233) | 723 (882) | +11 / +144 |
| ujarras | #1204 | 157 (212) | 370 (431) | +1 / +60 |
| vaoala | #1237 | 150 (157) | 371 (483) | +3 / +21 |
| zandvoort | #1217 | 212 (253) | 700 (885) | +0 / +0 |
