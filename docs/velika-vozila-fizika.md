# Fizika 7 velikih vozil: raziskava in zasnova

Odločitev uporabnika 24. 11. 2026 (tabla #382, komentar 7138172424): polna posodobitev fizike velikih vozil. Izjema pri pravilu »fizika vožnje se ne spreminja« velja **samo** za teh 7 vozil; trki se ne spreminjajo. **Stanje: izbrana možnost 2** (»Resnična teža, dirkalni motor«; uporabnik 24. 11. 2026 ob 23.28, stran Odločitve, `velika-vozila-1`). Kode fizike še ni: začne se po združitvi Trkov #608 na `main` (zbirka `cakanje`, `pr-608-velika-vozila`).

## Predaja (25. 11. 2026)

- Veja `fizika/velika-vozila-bt`, osnutek PR #1061; narejena samo raziskava in zasnova (ta dokument).
- Naslednja seja (nova, s to predajo), ko je #608 na `main`: spoji svež `main`; z viri potrdi ocene iz razdelka »Ni še potrjeno z virom«; nato skupni model po možnosti 2 (stolpec 2 v tabeli), uglasitev 7 vozil, AI, testi (`npm run test:related`), slike zdaj in potem pred `main`.
- Parametri možnosti 2 iz računa (izhodišče za uglasitev): mase 37,3 / 60 / 25,3 / 29,3 / 40 / 18 / 16 t (cisterna, vlak, avtovoz, krilo, hlodi, avtobus, gasilec); `vLim` 130; pragovi prevrnitve 0,42 / 0,40 / 0,38 / 0,45 / 0,31 / 0,53 / 0,50 g; pojemek 6,5 m/s²; slabljenje zavor med 350 in 550 °C (`FADE_K` 0,55); motorna zavora odvzame polovico dela; po prevrnitvi časovna kazen.
- Fizika drugih vozil in trki se ne spreminjajo.

## Vozila in stanje zdaj

Vsa vozijo z dirkalnim vlačilcem TITAN (820 kW; ZRCALNI in HRAST 1000 kW), zavore in oprijem dirkalni.

| vozilo | datoteka | masa zdaj (t) | omejevalnik | 0–100 (s) | bočni pospešek (g) | 100→0 (m) |
|---|---|---|---|---|---|---|
| TITAN CISTERNA | `js/cars/cisterna.js` | 5,3 + 12 | 150 | 9,2–10,2 | 1,17–1,29 | 41–45 |
| ZRCALNI VLAK | `js/cars/zrcalni.js` | 7 + 11 + 11 | 140 | 13,3–14,7 | 1,18–1,31 | 42–46 |
| TITAN AVTOVOZ | `js/cars/avtovoz.js` | 5,3 + 13 | 150 | 9,3–10,2 | – | 41–46 |
| KRILO VETRNICE | `js/cars/vetrnica.js` | 5,3 + 11 | 150 | 8,5–9,4 | – | – |
| HRAST | `js/cars/hrast.js` | 7 + 14 | 142 | 8,8–9,8 | 1,18–1,30 | 40–44 |
| LASTOVKA | `js/cars/lastovka.js` | 11 | 132 | 7,1–7,9 | 1,70–1,80 | 31–34 |
| GASILEC | `js/cars/gasilec.js` | 7,8 | 140 | 7,0–7,7 | 1,76–1,86 | 30–33 |

Kaj manjka v `js/core.js`: prevrnitve ni (`sway` je samo nagib karoserije na sliki); slabljenje zavor je samo pri `faults` (`BRK_FADE = [550, 750]` °C, `FADE_K = 0.55`) in ne pozna mase; sila klanca samo na progah z `gradeForce`; polpriklopnik je svoje telo na sedlu (`TLK`), prevrne se ne.

## Viri

Potrjeno z iskanjem (24. 11. 2026):

- **Dirkalni tovornjak** (osnova TITAN): najmanjša masa 5300 kg, omejitev 160 km/h, okoli 1200 KM. FIA: <https://www.fia.com/news/etrc-carlos-barros-managing-monsters>, <https://www.fia.com/sites/default/files/290_2024.pdf>.
- **Prevrnitev**: Winkler in sod., *Rollover of Heavy Commercial Vehicles*, UMTRI-99-19 (<https://deepblue.lib.umich.edu/items/706edf3c-066d-4eea-ac0f-f73f71ff1d28>): polno naložen vlačilec s polpriklopnikom ima prag do 0,5 g, pogosto precej pod njim; tovornjaki za hlodovino 0,23–0,31 g; presejalno merilo 0,35 g. Osebni avti zdrsnejo prej, kot se prevrnejo.
- **Cisterne**: UNECE R111, nagibna miza najmanj 23° brez prevrnitve (tan 23° ≈ 0,42 g, lasten izračun): <https://digitallibrary.un.org/record/413542/files/%5BE_ECE_%5DTRANS_WP.29_705-EN.pdf>. Postopek nagibne mize: SAE J2180.
- **Omejevalniki hitrosti**: Direktiva 92/6/EGS (sprememba 2002/85/ES): tovornjaki N3 90 km/h, avtobusi M3 100 km/h: <https://eur-lex.europa.eu/eli/dir/1992/6/oj/eng>.
- **Slabljenje zavor**: mehanizem (raztezanje bobna, padec trenja obloge) in delovno območje bobnov 150–450 °F: <https://www.fleetequipmentmag.com/truck-brake-fade-why-how-minimize/>; spusti in ocena strmine: FHWA, <https://rosap.ntl.bts.gov/view/dot/30251/dot_30251_DS1.pdf>.

**Ni še potrjeno z virom (ocene, preveriti pred kodo)**: polne mase posameznih vozil (40 t skupine, 60 t dvojna cisterna, avtovoz, prevoz krila, avtobus 18 t, gasilec 16 t), pragovi prevrnitve za avtovoz, krilo, avtobus in gasilca (ocenjeni iz razpona UMTRI), moči cestnih motorjev, pojemki na cesti, preskus zavor na spustu (UNECE R13). Te številke v grafih so računske ocene; v kodo gredo samo z virom.

## Skupni model (pri vseh možnostih)

1. **Prevrnitev**: prag bočnega pospeška na vozilo (in posebej na priklopnik); nad pragom se dvigne notranja stran, po ~0,6 s nad pragom se vozilo prevrne. Opozorilo: nagib in zvok pred pragom.
2. **Zavore**: gretje po masi in hitrosti (obstoječa enačba iz `faults`, pomnožena z maso), oslabitev med dvema temperaturama, hlajenje z vetrom; motorna zavora odvzame del dela na spustu.
3. **Klanec**: sila teže za ta vozila na vseh progah, ne samo tam, kjer je `gradeForce`.
4. **AI**: vozi do deleža praga prevrnitve, na spustu prej zavira, s pregretimi zavorami podaljša zavorno točko.
5. Testi: nove ovojnice v `tests/fleet.test.js` (razreda `prikolica`, `vlak`), prevrnitev in gretje zavor v `tests/cisterna.test.js`, `tests/zrcalni.test.js`, `tests/novi-tovornjaki.test.js`.

## Možnosti

| | 1 · Blaga | 2 · Resnična teža, dirkalni motor | 3 · Cestna |
|---|---|---|---|
| mase | kot zdaj | polne resnične (cisterna ~37 t, vlak ~60 t) | polne resnične |
| motor | dirkalni | dirkalni | cestni (235–460 kW) |
| najvišja hitrost | kot zdaj (132–150) | 130 | 90 (krilo 80, avtobus in gasilec 100) |
| cisterna 0–100 | ~10 s | ~24 s | ne doseže; 0–80 ~36 s |
| prevrnitev | 1,6× nad resničnim pragom (cisterna 0,67 g) | resnični prag (cisterna 0,42 g, hlodi 0,31 g) | resnični prag |
| po prevrnitvi | vrnitev na cesto kot pri padcu | vrnitev s časovno kaznijo | konec dirke |
| zavore 100→0 | ~47 m | ~59 m hladne, ~108 m pregrete | ~70 m hladne, ~175 m pregrete |
| spust | zavore skoraj ne oslabijo | brez motorne zavore oslabijo, z njo zdržijo | enako, močneje |
| ovinek R 60 m (cisterna) | 72 km/h (zdaj 97) | 57 km/h | 57 km/h |

**Priporočilo: 2.** Vozila dobijo težo in značaj po virih (počasen zagon, dolga zavorna pot, prevrnitev visokih tovorov), dirka pa ostane dirka, ker ostane dirkalni motor. Možnost 3 je najbolj resnična, a krog traja 2–3× dlje in polje se raztegne; možnost 1 ne izpolni »resničnih številk«.

Številke so iz preprostega računa (moč, masa, upor; v = √(a·g·R); gretje po enačbi iz `faults`); končne nastanejo z uglasitvijo v igri in grejo v `expect` vsakega vozila. Slike možnosti so na strani Odločitve (v repozitorij se ne shranjujejo).
