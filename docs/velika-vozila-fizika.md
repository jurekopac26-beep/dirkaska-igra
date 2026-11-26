# Fizika 7 velikih vozil: raziskava in zasnova

Odločitev uporabnika 24. 11. 2026 (tabla #382, komentar 7138172424): polna posodobitev fizike velikih vozil. Izjema pri pravilu »fizika vožnje se ne spreminja« velja **samo** za teh 7 vozil; trki se ne spreminjajo. **Stanje: izbrana možnost 2** (»Resnična teža, dirkalni motor«; uporabnik 24. 11. 2026 ob 23.28, stran Odločitve, `velika-vozila-1`). Viri preverjeni 26. 11. (razdelek »Preverjanje virov«). Kode fizike še ni: `js/core.js` in datoteke 7 vozil spreminjajo tudi drugi odprti PR (#608, #685, #480, #679, #949); koda počaka na odločitev na strani Odločitve.

## Predaja (25. 11. 2026)

- Veja `fizika/velika-vozila-bt`, osnutek PR #1061; narejena samo raziskava in zasnova (ta dokument).
- Naslednja seja (nova, s to predajo), ko je #608 na `main`: spoji svež `main`; z viri potrdi ocene (narejeno 26. 11., razdelek »Preverjanje virov«); nato skupni model po možnosti 2 (stolpec 2 v tabeli), uglasitev 7 vozil, AI, testi (`npm run test:related`), slike zdaj in potem pred `main`.
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

## Preverjanje virov (26. 11. 2026, korak 1)

Iskanje 26. 11. 2026; neposredno branje strani v tej seji ni bilo mogoče (omrežje), zato so številke iz izvlečkov javnih virov. Pred uporabo v kodi jih ni treba več preverjati, razen tistih z oznako **brez vira**.

### Mase (t)

| vozilo | ocena | stanje | vir |
|---|---|---|---|
| TITAN CISTERNA | 37,3 | **potrjeno kot zgornja meja**: 5-osni sklop 2 + 3 osi največ 40 t | Direktiva 96/53/ES, Priloga I, 2.2.2 (a): <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A01996L0053-20190814> |
| ZRCALNI VLAK | 60 | **potrjeno**: modularni sistem (EMS) do 25,25 m in 60 t, kjer ga država dovoli (Švedska, Finska od 1993) | 96/53/ES, čl. 4(4)(b); povzetek ITF: <https://www.itf-oecd.org/sites/default/files/docs/weights-2021.pdf>; PIARC: <https://proceedings-paris2007.piarc.org/ressources/files/5/SP11-Berndtsson-E.pdf> |
| TITAN AVTOVOZ | 25,3 | delno: prazen polpriklopnik za 8 avtov 9–10,4 t, višina ~4 m (tehnični listi brez znamk); masa naloženih avtov **brez vira** (ocena 8 × ~1,4 t) | tehnični listi polpriklopnikov; meja višine 4 m: 96/53/ES, Priloga I, 1.2 |
| KRILO VETRNICE | 29,3 | delno: krilo 61,5 m ima 17,74 t (referenčna turbina 5 MW); masa prevoznega polpriklopnika **brez vira** | NREL/TP-500-38060 (Jonkman in sod., 2009), preglednica lastnosti krila |
| HRAST | 40 | **potrjeno kot zgornja meja**: 40 t (kot cisterna) | 96/53/ES, Priloga I |
| LASTOVKA | 18 | **potrjeno**: dvoosno motorno vozilo največ 18 t | 96/53/ES, Priloga I, 2.3.1 |
| GASILEC | 16 | **potrjeno kot meja razreda**: razred M (srednji) do 16 t, S nad 16 t | EN 1846-1:2011, razdelek 3 (povzetek sprememb DIN) |

### Pragovi prevrnitve (bočni pospešek)

| vozilo | prag (g) | stanje | vir |
|---|---|---|---|
| TITAN CISTERNA | 0,42 | **potrjeno**: nagibna miza najmanj 23° (tan 23° = 0,42) | UNECE R111 |
| ZRCALNI VLAK | 0,40 | **brez vira** (ocena: zadnji priklopnik dvojnega sklopa nekoliko pod enojnim) | razpon UMTRI-99-19 do 0,5 g |
| TITAN AVTOVOZ | 0,38 | **brez vira** (ocena: visoko težišče zgornje etaže, blizu presejalne meje 0,35 g) | razpon UMTRI-99-19 |
| KRILO VETRNICE | 0,45 | **brez vira** (ocena: dolg, a nizek in lahek tovor) | razpon UMTRI-99-19 |
| HRAST | 0,31 | **potrjeno**: tovornjaki za hlodovino 0,23–0,31 g | UMTRI-99-19 |
| LASTOVKA | 0,53 | **potrjeno**: nagib 28° brez izgube stika koles (tan 28° = 0,53) | UNECE R107 (preskus stabilnosti); opis postopka: <https://www.vti.se/en/research-areas/stability-and-rollover-testing/>, <https://www.tuvsud.com/en-us/knowledge-hub/technical-updates/automotive-essentials/physical-testing-of-buses> |
| GASILEC | 0,50 | **brez vira**: EN 1846-2 predpisuje statični kot nagiba, številke v javnih povzetkih ni (standard je plačljiv) | EN 1846-2:2009+A1:2013 |

Dodatni viri (26. 11., seja 1): najmanjši prag težkih vozil **0,35 g** (NZTA, <https://nzta.govt.nz/vehicles/vehicle-types/vehicle-classes-and-standards/vehicle-dimensions-and-mass/static-roll-thresholds>); FHWA 2004 (Western Uniformity Scenario Analysis, sl. 7-2): polpriklopnik 0,36 g, dvojni sklopi 0,376–0,395 g, cisterna B-vlak 0,34 g. Zrcalni vlak 0,40 je tako blizu razpona dvojnih sklopov, a ostaja **brez vira**; avtovoz 0,38, krilo 0,45 in gasilec 0,50 ostajajo **brez vira** (EN 1846-2, izdaja 2024, brez javnih vrednosti).

### Zavore (UNECE R13, kategoriji N3 in M3)

- **Preskus tip 0** (hladne zavore, motor odklopljen): N3 in M3 iz 60 km/h, pojemek najmanj **5,0 m/s²**; z motorjem iz 80 % najvišje hitrosti (največ 90 km/h) najmanj 4,0 m/s². Vir: UNECE R13, Priloga 4 (EUR-Lex: <https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A42016X0218%2801%29>; <https://unece.org/fileadmin/DAM/trans/main/wp29/wp29regs/r013r7e.pdf>).
- **Preskus tip II** (spust): povprečno 30 km/h po 6 % klancu, 6 km; **tip IIA** (vzdržljivostna zavora, dolgoprogovni avtobusi M3 in N3 s priklopniki O4): 7 % klanec, 30 km/h, 6 km. Vir: UNECE R13, Priloga 4 (EUR-Lex, zgoraj).
- **Vroče zavore**: po preskusu zavorna sila najmanj 60 % hladne (tip 0) pri isti hitrosti (sekundarni vir: <https://www.sciencedirect.com/topics/engineering/braking-rate>); pojemek po spustu N3 3,3 m/s², M3 3,75 m/s² (predstavitev OICA, ne besedilo predpisa: <https://www.unece.org/fileadmin/DAM/trans/doc/2019/wp29grva/GRVA-04-30.pdf>).
- **Brez vira**: pojemek 6,5 m/s² za dirkalne zavore (ocena nad zakonskim minimumom 5,0); temperaturi slabljenja 350 in 550 °C (vir navaja samo delovno območje bobnov 150–450 °F); delež motorne zavore (polovica dela na spustu); moči cestnih motorjev (možnost 3 ni izbrana).

### Posledica za uglasitev (možnost 2)

- Mase iz preglednice veljajo; brez vira ostanejo samo deli mas avtovoza in krila (tovor, polpriklopnik) in so v kodi označeni kot ocena.
- Pragovi z virom: cisterna, hlodi, avtobus. Ostali štirje so ocene v razponu UMTRI in v kodi označeni kot ocena.
- Hladni pojemek ne sme pasti pod 5,0 m/s², vroči ne pod 60 % hladnega (R13).

## Skupni model (pri vseh možnostih)

1. **Prevrnitev**: prag bočnega pospeška na vozilo (in posebej na priklopnik); nad pragom se dvigne notranja stran, po ~0,6 s nad pragom se vozilo prevrne. Opozorilo: nagib in zvok pred pragom.
2. **Zavore**: gretje po masi in hitrosti (obstoječa enačba iz `faults`, pomnožena z maso), oslabitev med dvema temperaturama, hlajenje z vetrom; motorna zavora odvzame del dela na spustu.
3. **Klanec**: sila teže za ta vozila na vseh progah, ne samo tam, kjer je `gradeForce`.
4. **AI**: vozi do deleža praga prevrnitve, na spustu prej zavira, s pregretimi zavorami podaljša zavorno točko.
5. Testi: nove ovojnice v `tests/fleet.test.js` (razreda `prikolica`, `vlak`), prevrnitev in gretje zavor v `tests/cisterna.test.js`, `tests/zrcalni.test.js`, `tests/novi-tovornjaki.test.js`.

## Model v kodi (seja 1, 26. 11.)

`js/velika-vozila.js` (`VelikaVozila`): vklop z `model.heavy` (true ali predmet s popravki `srt`, `masa`), brez njega se nič ne spremeni. Preglednica `VOZILA` (masa, prag, vir), konstante `K` (130 km/h, hladni pojemek 6,5 m/s², najmanj 5,0; slabljenje 350–550 °C do 60 %; motorna zavora pol dela; 0,6 s nad pragom; opozorilo pri 85 %; kazen 10 s). `pred`/`po` okrog koraka fizike: zavorna moč (omejitev pojemka, pregrete zavore), gretje zavor, klanec na progah brez `gradeForce`, bočni pospešek in prevrnitev (`vv.pad`). Za AI: `vOvinek(c, k)`, `zavPot(c, v0, v1)`. Priklop v `js/core.js`: `VV`, `Car.vv`, `step`, prevrnitev v dirki (vrnitev, `tfPen`). Skripta se naloži z vrstico v `index.html` in `garaza.html` pred `core.js` (odločitev `velika-vozila-1061-skripta`, 26. 11.: A; dodano v seji 2).

## AI in testi (seja 2, 26. 11.)

AI v težkem vozilu: `aiProf` (lasten profil hitrosti iz krivine idealne linije, pod deležem praga, zaviranje nazaj s 80 % pojemka ob trenutni temperaturi zavor in z nagibom) in `aiVoznik` (ob izmerjenem nagibu nad 70 % praga popusti plin, nad 85 % zavira). Oboje je samo vnos AI v `js/velika-vozila.js`; `aiDrive` v `js/core.js` in fizika vožnje se ne spremenita. Deleži so pravila igre, **brez vira**: `aiRez` 0,8 (pri 0,85 so tovornjaki v gneči po trkih padali preveč), `aiPlin` 0,7, `aiZav` 0,85, rezerva pojemka 0,8.

Test `tests/velika-vozila.test.js` (komplet fleet): jedro z `js/velika-vozila.js` kot v `index.html`; `model.heavy` vklopi samo v svoji kopiji. Cisterna, HRAST in LASTOVKA na Bathurstu in Vršiču, 5 AI, 90 s: z AI 0–4 prevrnitve na dirko, brez njega 35–76. Večina preostalih je po trku med tovornjaki.

Ni narejeno: uglasitev datotek 7 vozil (`heavy: true`, mase, `brakeK`), ker isti datoteki spreminjata #685 (croatiadata) in #480; vprašanje `velika-vozila-1061-vozila` na strani Odločitve. Do takrat je model v igri naložen, a izklopljen (nobeno vozilo nima `heavy`).

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
