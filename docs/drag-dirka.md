# Drag dirka (I20)

Nov kratek način igre: dvoboj na 402 m (četrt milje) z mesta, z ročno menjavo prestav, proti avtu ali tovornjaku, na ravnini obstoječe prave proge (brez nove proge). Izbira uporabnika 7. 11. 2026 ob 16.05 (predlog I20), začetek 8. 11. ob ~17.40 prek Mateja (tabla #382, komentarja 6708750136 in 6724187167). Račun biketraveler, veja `i20-drag-dirka`, osnutek PR; v vrsti za `main` pred progami.

## Proga: Montréal, Kanada
Najdaljše ravne in ravninske ravnine pravih prog (odmik od premice do 1,5 m, naklon do 3 %; meritev 8. 11. iz `Track` v Node): Livorno 1.212 m (spust 5 m), Nürburg 1.108 m, Bang Saen 826 m (gre v test s #379), Bathurst 706 m (na odločanju, spust 17 m), Suzuka 704 m (spust 20 m), **Montréal 692 m (brez vzpona)**, Štajerska 660 m (vzpon 12 m), Spa 534 m (vzpon 13 m). Testne proge so zamrznjene in izpadejo.

Izbran je **Montréal**: ravnina za lasnico (od ~3.400 m kroga), čisto ravna in ravninska, cesta 10,4 m (dva pasova po ±2,4 m od sredine). Štart na začetku ravnine, cilj po 402 m, za ciljem ~250 m za zaviranje pred zadnjo šikano. Svet proge je isti kot na dirki (brez nove grafike), v dvoboju sta samo dva avta, zato obremenitev telefona ne naraste. Druga proga (npr. Nürburg, Döttinger Höhe) je mogoča pozneje z eno vrstico v tabeli `STRIPS`.

## Pravila
- **Štart z mesta:** avta drug ob drugem na črti, luči kot na dirki (pet rdečih, nato ugasnejo). Čas reakcije je od ugasnitve do pritiska na plin (`LAUNCH`, `c.lch.re` v `js/core.js`). Plin pred ugasnitvijo je **rdeča luč**: poraz, dirka se konča takoj.
- **Ročna menjava prestav:** prestava gor s tipko (puščica gor, E ali Shift), z gumbom PRESTAVA na zaslonu ali na ploščku (A ali R1). Na zaslonu so prestava, vrtljaji in luč za menjavo: rumena malo pred pravim trenutkom, zelena v pravem pasu, rdeča na omejevalniku. Vsaka menjava dobi oceno: POPOLNO, DOBRO, PREZGODAJ, PREPOZNO.
- **Fizika:** izbirni kavelj `car.man` v skupnem bloku menjalnika (obe fiziki v `js/core.js`): brez samodejne menjave, na omejevalniku (vrtljaji rdečega polja) ni pogona, pod idealnimi vrtljaji po menjavi je moči manj (motor se »zaduši«, dokler ne zavrti). Popolna vožnja je tako hitra kot s samodejnim menjalnikom, slabe menjave so počasnejše. **Brez `car.man` (vsi obstoječi načini) se ne spremeni nič**; golden reference to preverijo.
- **Tekmec: avto ali tovornjak** (kartica pred štartom): enak avto, kot ga voziš ti (čisti dvoboj: reakcija in menjave), ali tovornjak (dirkalni tovornjak). Počasnejše vozilo dobi **prednost v metrih** (izračun iz moči in mase obeh vozil, tako da popolni vožnji prideta na cilj hkrati); prednost je vidna na štartu (tekmec stoji naprej). Če voziš tovornjak, je obratno. Tekmec prestavlja sam: reakcija in točka menjave sta iz semena dirke in po težavnosti (lahka, srednja, težka).
- **Rezultati:** zmaga ali poraz, razlika, za oba čas reakcije, 18 m (60 ft), 201 m (1/8 milje), 402 m in hitrost na cilju; menjave z oceno; rekord na progi z vozilom.
- Kamera je ena (za avtom). Meni in igra delujeta pokonci in ležeče.

## Datoteke
- `js/zabava/drag.js` (nova): način `drag` po vzoru `js/zabava/lov.js` (Zabava: `modes`, `opts`, `made`, `begin`, `step`, `over`, `finish`, `stop`), tabela ravnin `STRIPS`, HUD in gumb PRESTAVA, AI menjave, rezultati.
- `js/core.js`: kavelj `man` v menjalniku obeh fizik; `QUICK_MODE` dobi `drag`.
- `js/game.js`: kratki priklopi (hitri vstop, vnos prestave).
- `js/menu.js`: ploščica *Drag race* v *Single race*.
- `js/lang.js`: angleški prevodi; `index.html`: skripta; `css/style.css`: HUD.
- Testi: `tests/drag.test.js` (Node: ravnina na pravi progi, ročni menjalnik, prednost, tekmec, brez vpliva na druge načine), `tests/browser/drag.test.mjs` (hitri vstop `?proga=montreal&nacin=drag`, menjave, rezultati, pokonci in ležeče).

## Stanje
| Korak | Kaj | Stanje |
|---|---|---|
| 0 | Načrt, vpis v vrsto (»Načrtovano«, #513), osnutek PR | narejeno |
| 1 | Ročni menjalnik v jedru (`car.man`) in test fizike | v delu |
| 2 | Način `drag`: postavitev, štart, cilj, tekmec, prednost | |
| 3 | HUD, gumb PRESTAVA, meni, prevodi | |
| 4 | Rezultati in rekord | |
| 5 | Testi (Node, brskalnik), `npm run test:related` | |

## Predaja
(sproti; ob 98 % porabe pred polnočjo kratko stanje v opis PR)
