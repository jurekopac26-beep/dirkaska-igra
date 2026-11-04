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
| 1 | Model v igri, vpis v vozni park | ~0,5 dneva | v delu |
| 2 | Fizika zgiba | ~1–2 dni | |
| 3 | AI in promet: širši zavoji tekmecev, manj tekmecev | ~0,5–1 dan | |
| 4 | Kamera za dolgo vozilo, posnetek, kot prikolice med telefoni | ~0,5 dneva | |
| 5 | Testi (tudi Killar, ko bo na `main`, in krožna proga), obremenitev, README, objava | ~0,5–1 dan | |

Po vsakem sklopu uporabnik dobi eno sliko (kamera za avtom) ali kratek opis.

## Zasnova
(dopolnjuje se med delom)
