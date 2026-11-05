# TITAN s cisterno (načrt teme)

TITAN (`js/cars/titan.js`) vleče cisterno na sedlu: prikolica s pravim fizikalnim zgibom. Veja `titan-cisterna`, en pull request. Predaja iz seje session_01QiZPCZFYZECemerxaNXvMZ (4. 11. 2026); nadaljuje session_01Ck3D3QeTeMFcEZM6bLAKNd.

![Cisterna 4 s sivimi krpami, 6 pogledov](titan-cisterna/cisterna-4-krpe-sive.webp)

## Odločitve uporabnika (4. 11. 2026)
1. **Obseg »A v celoti«**: model v igri in vpis v vozni park, fizika zgiba, AI tekmeci in promet, kamera za avtom, posnetek dirke, igra na več telefonih, testi in objava. Ne zdaj: tovornjak z dvema cisternama (črna kabina, zrcalni cisterni), misija dostave goriva, ploščad s hlodi.
2. **Pravi fizikalni zgib**: prikolica je svoje telo na sedlu. V ovinku se lomi, pri zaviranju potiska, ob napaki gre v »škarje«; teža polne cisterne vpliva na vožnjo; prave trke ima z ograjo, robom in vozili in pade čez prepad (`Race._fall`), tudi sama. Ne samo kinematično sledenje poti. Kinematika prikolice iz misij (`MisKit.towTrailer`, `tow`, `trailer` v `js/missions/kit.js`) ostane za misije; od nje vzamemo, kar se da (kot prikolice za izris).
3. **Videz »cisterna 4 s sivimi krpami«** (slika zgoraj):
   - Vlačilec: originalni rdeči TITAN (oblika, barve, krom), le malo zarjavel ob spodnjih robovih, vogalih, blatnikih in stopnicah, malo prahu.
   - Cisterna: od sonca zbledela bleda oranžno-rumena, zelo močna rja s curki od obročev, kovic in pokrovov; 6 navarjenih zakovičenih plošč v sivih odtenkih (svetlo cinkasta, srednje siv premaz, temno jeklena) z vidnim zvarom in kovicami.
   - Bočna pohodna pot z rjavo rešetko in zarjavelo ograjo; manjkata dve cevi ograje in ena prečka lestve; lestev od tal.
   - Zadaj 4 rezervne gume pokonci ena ob drugi, nad njimi črna polica z 12 kanticami (rdeče in zelene), spete z rumenimi gurtnami.
   - Samo generični napisi (npr. FLAMMABLE), brez znamk.
   - Za telefon poenostavljeno: malo klicev risanja, brez detajlov, ki jih kamera za avtom ne vidi.
4. Če je zgib nemiren (tresenje, »eksplozije« pri trkih), seja to pove uporabniku in predlaga poenostavitev (prikolica, ki sledi poti), preden porabi več časa.

## Načrt (obljubljeno ~3–5 dni)
| Sklop | Kaj | Čas | Stanje |
|---|---|---|---|
| 1 | Model v igri, vpis v vozni park | ~0,5 dneva | narejeno (5. 11.) |
| 2 | Fizika zgiba | ~1–2 dni | narejeno, uglaševanje ob AI (5. 11.) |
| 3 | AI in promet: širši zavoji tekmecev, manj tekmecev | ~0,5–1 dan | |
| 4 | Kamera za dolgo vozilo, posnetek, kot prikolice med telefoni | ~0,5 dneva | |
| 5 | Testi (tudi Killar, ko bo na `main`, in krožna proga), obremenitev, README, objava | ~0,5–1 dan | |

Po vsakem sklopu uporabnik dobi eno sliko (kamera za avtom) ali kratek opis.

## Zasnova
(dopolnjuje se med delom)

**Model** (`js/cars/cisterna.js`, MODELS 44, kategorija tovornjaki): vlačilec je TITAN (`K.lookOf('titan')`) z rjo ob spodnjih robovih, stopnicah in odbijaču; cisterna je ena mreža (`model.trailer.look.build`, izris `tlBuild` v `js/render.js`, ~4.750 trikotnikov, 1 klic risanja + luči + senca), tekstura 1024 × 512 iz semena (brez `Math.random`). `trailer: { mass 12000, len 12.4, ax [-7.5, -8.8, -10.1], kp [-1.8, 0.98], mu 1.5, brk 7.5 }`; na kingpin gre 40 % teže prikolice (`tlKing`): pogonska os vlačilca ima toliko več oprijema (cs in nova).

**Zgib** (`js/core.js`, razdelek THE SEMI-TRAILER): prikolica je togo telo (`c.tl`), za ograje in vozila »avto« (`wallCollide`, `carCollide`). Vsak korak (`tlStep`): sile (klanec, kotaljenje, zavore, zrak), nato v `TLK.it` = 8 krogih skupaj mehka guma osi (bočni zdrs do mu × obremenitev, elipsa trenja z zavorami), zatič (`tlPin`: hitrosti točk na zatiču in sedlu ena, oba prosti telesi) in pri klasični fiziki obe osi vlačilca (`tlHoldSet/It/End`): vsaka drži svojo bočno hitrost z impulzom do oprijema, ki ga pusti njen lastni ovinek in zaviranje ali pogon (`TLK.hold` = 1,45 g na njeno obremenitev, tudi kingpinovo). Kar osi ne zadržita, je drsenje (`cSx/cSz`, stepCS ga izdrsa) in za trenutek manj oprijema (`xgl`, pol prekoračitve = ves): zaviranje v ovinku potisne zadek ven, zgib se poveča do omejila 83° (`TLK.lim`). Nova fizika: vlačilec je prosto telo, njegove gume odgovorijo same.
- Prej (do 5. 11.): ločen popravek po rešitvi (`tlHold`) je potisk štel dvakrat in pri polnem zavoju dodajal energijo (NaN pri 60–120 km/h); skupna rešitev v krogih tega nima.
- Uglasitev: oprijem vlačilca s prikolico `arc.amax` 1,0 (1,3 g; brez tega lastni ovinek vlačilca porabi ves oprijem osi in zgib niha), najmanjši polmer poti 11 m (`TLK.rMin`, namesto 4,2 m).
- Meritve (ravna ploskev, `tests/lib/handling.js`): 0–100 km/h 9,6 s, najvišja 148 km/h, bočno 1,23 g pri 100 km/h, 100–0 km/h 43 m; zaviranje na meji pri 90 km/h: zgib s 24° na 41°, brez nihanja; obe fiziki brez NaN. Tarče v `expect`, ovojnica `prikolica` v `tests/fleet.test.js`.

**Štart**: razmik mest na štartni mreži krožne proge za polje s prikolicami `(rep + nos + 2,5 m) / 2` na mesto (cisterna 9,4 m namesto 7,5 m; `Race._gStep`, ni naštevno polje); odprte ceste in igra na več telefonih: sklop 3.
