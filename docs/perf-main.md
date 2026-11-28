# Proračun risanja na `main` (28. 11. 2026)

Naloga T5. Samo merjenje: koda, grafika in reference nespremenjene.

## Kako je merjeno

- `main` pri 721ed76, `node tests/browser/perf.test.mjs` (844×390, kakovost normal, podrobnosti NIZKA, sence, kamera za avtom, seme 12345, šest točk kroga; štejejo se vsi klici risanja in oglišča vseh prehodov).
- Vseh 74 prog brez `test: true` (zamrznjene proge niso merjene, zanje meja ne velja).
- Meja CLAUDE.md: 300 klicev risanja in 900 tisoč oglišč, na povprečje in na najbolj obremenjeni točki; test pade šele nad 300 oziroma 900.
- Primerjava s `tests/golden/perf.json` na `main`.

## Rezultat

**Nobena proga na `main` meje ne preseže, zato ni popravkov.** Test `perf.test.mjs` je zelen.

Blizu meje (največ ≥ 280 klicev ali ≥ 850 tisoč oglišč):

| Proga | Klici povp. (največ) | Oglišča v tisočih povp. (največ) | Opomba |
|---|---|---|---|
| silkeborg | 246 (**300**) | 661 (738) | točno na meji klicev; en klic več je rdeč test |
| sepang | 195 (234) | 731 (**899**) | tisoč oglišč pod mejo |
| lusail | 182 (241) | 593 (896) | čaka kartico zmogljivost-1 v #608; 909 tisoč na `main` ni izmerjenih |
| kotor | 219 (264) | 693 (887) | |
| zandvoort | 212 (253) | 700 (885) | |
| buriram | 207 (257) | 719 (879) | |
| sacalobra | 247 (295) | 672 (876) | |
| quezaltepeque | 249 (280) | 740 (863) | |
| batangas | 244 (287) | 818 (862) | |
| sakhir | 209 (236) | 741 (860) | |
| portomoniz | 245 (295) | 659 (815) | |
| koli | 181 (290) | 632 (748) | |
| riohondo | 214 (286) | 676 (833) | |

Vse proge s seznama imajo odprto vejo `dodelava/*` (#1261); tam dodana geometrija lahko mejo preseže.

Reference, ki se od meritve razlikujejo (v dovoljenem odstopanju testa, niso posodobljene, ker `tests/golden/perf.json` spreminjajo #1013, #1030 in #1088):

| Proga | Izmerjeno največ (klici, oglišča) | Referenca največ |
|---|---|---|
| silkeborg | 300, 738 tisoč | 290, 785 tisoč |
| kagerod | 262, 693 tisoč | 279, 730 tisoč |
| rastro | 267, 754 tisoč | 270, 754 tisoč |

## Vse proge (urejeno po največ ogliščih)

| Proga | Klici povp. (največ) | Oglišča v tisočih povp. (največ) |
|---|---|---|
| sepang | 195 (234) | 731 (899) |
| lusail | 182 (241) | 593 (896) |
| kotor | 219 (264) | 693 (887) |
| zandvoort | 212 (253) | 700 (885) |
| buriram | 207 (257) | 719 (879) |
| sacalobra | 247 (295) | 672 (876) |
| quezaltepeque | 249 (280) | 740 (863) |
| batangas | 244 (287) | 818 (862) |
| sakhir | 209 (236) | 741 (860) |
| riohondo | 214 (286) | 676 (833) |
| sosnova | 204 (249) | 654 (829) |
| harju | 193 (234) | 564 (825) |
| portomoniz | 245 (295) | 659 (815) |
| pembrey | 225 (251) | 633 (806) |
| chamarel | 171 (206) | 542 (804) |
| canaries | 210 (223) | 682 (803) |
| marrakesh | 183 (237) | 667 (784) |
| medvode | 132 (147) | 533 (780) |
| kanaba | 208 (269) | 615 (779) |
| tuzla | 204 (252) | 595 (757) |
| rastro | 216 (267) | 629 (754) |
| lombok | 219 (252) | 644 (753) |
| koli | 181 (290) | 632 (748) |
| katu | 168 (198) | 560 (747) |
| silkeborg | 246 (300) | 661 (738) |
| tianmen | 189 (222) | 610 (738) |
| seoul | 137 (149) | 593 (721) |
| ella | 187 (232) | 491 (704) |
| kagerod | 236 (262) | 619 (693) |
| gudauri | 179 (219) | 515 (690) |
| rbring | 228 (278) | 545 (689) |
| montreal | 209 (272) | 552 (682) |
| koror | 161 (192) | 441 (676) |
| cpalace | 206 (236) | 548 (635) |
| hafit | 133 (165) | 426 (632) |
| kildare | 227 (262) | 536 (625) |
| spa | 188 (232) | 499 (618) |
| hiva | 167 (206) | 543 (611) |
| savusavu | 191 (226) | 507 (610) |
| aguascalientes | 203 (225) | 463 (604) |
| irishtown | 175 (203) | 488 (592) |
| llogara | 168 (180) | 476 (590) |
| pikesg | 146 (161) | 487 (588) |
| chapman | 169 (211) | 515 (586) |
| santoantao | 179 (217) | 448 (582) |
| medeu | 181 (200) | 492 (581) |
| bikernieki | 195 (243) | 471 (563) |
| bathurst | 175 (254) | 508 (557) |
| caracoles | 181 (230) | 379 (555) |
| izoard | 190 (232) | 428 (543) |
| furka | 173 (211) | 384 (532) |
| eljem | 118 (136) | 347 (496) |
| cusco | 149 (180) | 368 (468) |
| vaoala | 147 (154) | 348 (462) |
| livorno | 155 (185) | 370 (461) |
| tatev | 169 (205) | 364 (455) |
| ngorongoro | 161 (188) | 396 (450) |
| luanda | 140 (167) | 328 (449) |
| balea | 166 (175) | 396 (448) |
| killar | 155 (182) | 371 (424) |
| nring | 179 (205) | 388 (419) |
| pikes | 137 (151) | 335 (402) |
| mombasa | 135 (215) | 337 (385) |
| isalo | 126 (142) | 354 (376) |
| ujarras | 156 (211) | 310 (371) |
| ghoufi | 143 (201) | 264 (364) |
| london | 169 (205) | 321 (359) |
| portobelo | 123 (148) | 295 (352) |
| hakone | 199 (220) | 305 (345) |
| isuna | 155 (178) | 226 (287) |
| mapileng | 141 (171) | 242 (281) |
| tapini | 84 (91) | 246 (271) |
| krasnahorka | 113 (124) | 200 (239) |
| dades | 140 (170) | 201 (230) |
