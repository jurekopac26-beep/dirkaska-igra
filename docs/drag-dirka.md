# Drag dirka (I20)

Nov kratek način igre: dvoboj na 402 m (četrt milje) z mesta, z ročno menjavo prestav, proti avtu ali tovornjaku, na ravnini obstoječe prave proge (brez nove proge). Izbira uporabnika 7. 11. 2026 ob 16.05 (predlog I20), začetek 8. 11. ob ~17.40 prek Mateja (tabla #382, komentarja 6708750136 in 6724187167). Račun biketraveler, veja `i20-drag-dirka`, osnutek PR #515; v vrsti za `main` pred progami.

## Proga: Montréal, Kanada
Najdaljše ravne in ravninske ravnine pravih prog (odmik od premice do 1,5 m, naklon do 3 %; meritev 8. 11. iz `Track` v Node): Livorno 1.212 m (spust 5 m), Nürburg 1.108 m, Bang Saen 826 m (gre v test s #379), Bathurst 706 m (na odločanju, spust 17 m), Suzuka 704 m (spust 20 m), **Montréal 692 m (brez vzpona)**, Štajerska 660 m (vzpon 12 m), Spa 534 m (vzpon 13 m). Testne proge so zamrznjene in izpadejo.

Izbran je **Montréal**: ravnina za lasnico, štart pri 3.440 m kroga, cilj po 402 m (~3.842 m), za ciljem ~250 m za zaviranje pred zadnjo šikano. Cesta 10,4 m, pasova po ±2,4 m od **tetive** ravnine (sredina ceste od nje odstopa do 0,15 m; smer ceste na štartu bi po 402 m zanesla 6 m vstran). Svet proge je isti kot na dirki (brez nove grafike), v dvoboju sta samo dva avta, zato obremenitev telefona ne naraste. Druga proga (npr. Nürburg, Döttinger Höhe) je mogoča pozneje z eno vrstico v tabeli `Core.DRAG` (`js/core.js`); meni in hitri vstop jo vzameta sama.

## Pravila
- **Štart z mesta:** avta drug ob drugem na črti, luči kot na dirki (pet rdečih, nato ugasnejo). Čas reakcije je od ugasnitve do pritiska na plin (`LAUNCH`, `c.lch.re` v `js/core.js`). Plin med lučmi je **rdeča luč** (napis RDEČA LUČ!): vožnja teče do cilja, a je poraz in ne šteje za rekord. Med uvodom namig SPUSTI PLIN, POČAKAJ NA LUČI; samodejni plin je v dragu izklopljen.
- **Ročna menjava prestav:** prestava gor s tipko Space, E ali Shift, z gumbom PRESTAVA na zaslonu (nad levim in desnim) ali na ploščku (RB ali B). Tipka, ki jo je igralec v Kontrolah dal drugemu dejanju, ne prestavlja. V plošči so luč za menjavo (rumena od 0,85 rdečega polja, zelena od 0,92, rdeča na omejevalniku), prestava, vrtljaji, čas od luči in napredek obeh avtov. Vsaka menjava dobi oceno: POPOLNO (zelena luč, takoj), DOBRO, PREZGODAJ (pod 0,85), PREPOZNO (več kot 0,25 s na omejevalniku). Električni avto (ena prestava): brez gumba in luči, v plošči E.
- **Fizika:** izbirni kavelj `car.man` v skupnem bloku menjalnika (obe fiziki v `js/core.js`, `MAN`, `manRev`, `manShift`, `manK`): brez samodejne menjave, na omejevalniku (vrtljaji rdečega polja) ni pogona, razen v zadnji prestavi (kot pri samodejnem menjalniku), pod idealnimi vrtljaji po menjavi je moči manj (motor se »zaduši«, dokler ne zavrti). Popolna vožnja je tako hitra kot s samodejnim menjalnikom (test: KAZE, MUSCLE, TITAN na tisočinko), slabe menjave so počasnejše (tovornjak z desetimi bližnjimi prestavami pri zgodnji menjavi izgubi malo). **Brez `car.man` (vsi obstoječi načini) se ne spremeni nič**; golden reference to preverijo.
- **Tekmec: avto ali tovornjak** (nastavitev *Rival* v možnostih dirke: *Same car* ali *Truck*; gumb v rezultatih *Proti tovornjaku* / *Proti avtu* jo zamenja in dvoboj ponovi): enak avto, kot ga voziš ti (čisti dvoboj: reakcija in menjave), ali tovornjak TITAN (če voziš TITAN, KAMEN). Počasnejše vozilo dobi **prednost v metrih**, tako da popolni vožnji prideta na cilj hkrati: oba avtomobila vsak sam prevozita ravnino s samodejnim menjalnikom (`headStart`, `solo`; izračun je shranjen, `Zabava.part('drag').hs`, do 40 ključev). Prednost je vidna na štartu (tekmec stoji naprej, obvestilo s prednostjo). Tekmeca vozi način sam (`c.ctl` v `Race._step`: pas, poln plin, menjave), ne `aiControl` (brez gumijastega traku in zaviranja pred šikano); reakcija in točka menjave sta iz semena dirke in po težavnosti (lahka 0,30–0,50 s, srednja 0,22–0,38 s, težka 0,16–0,28 s). Po cilju ga spet vozi `aiControl`.
- **Rezultati:** zmaga ali poraz z razliko, za oba reakcija, 18 m (60 ft), 201 m (1/8 milje), čas do cilja (od lastnega štarta), čas od luči, hitrost na cilju, prednost, vozilo; menjave z ocenami; **rekord z vsakim vozilom posebej** (`dragBy`, čas do cilja; ne z rdečo lučjo, po izteku časa ali z lastno prednostjo), najboljši od njih je *Best run* v meniju (`bestRace`). Ponovi dvoboj ponovi vožnjo. Konec po pravilu načina (`race.zbOver`) orodje za napake šteje za končano dirko (brez vprašanja o posnetku).
- Kamera je ena (za avtom). Meni in igra delujeta pokonci in ležeče: ležeče je plošča zgoraj na sredini in luči pod njo, pokonci pod mestom in hitrostjo, levo od stolpca z zemljevidom, reakcijo in sporočili; gumb PRESTAVA nad levim in desnim. Skrito v dragu: stolpec časov, krog, gume, DRS, števec kroga.

## Datoteke
- `js/zabava/drag.js` (nova): način `drag` po vzoru `js/zabava/lov.js` (Zabava: `modes`, `opts`, `made`, `begin`, `step`, `over`, `noPodium`, `finish`, `resEnd`, `stop`), ravnina `strip`, prednost, tekmec, plošča, gumb, tipke in plošček, rezultati, komentar.
- `js/core.js`: `car.man` v menjalniku obeh fizik, `DRAG`, `c.ctl`, `opts.duelModel`, `QUICK_MODE` z `drag` (hitri vstop `index.html?proga=montreal&nacin=drag`).
- `js/game.js`: kratki priklopi (način in rekord, brez kamere pred štartom, `race.zbOver`).
- `js/menu.js`: ploščica *Drag race* v *Single race*, en tekmec, možnost *Rival*.
- `js/lang.js`: angleški prevodi; `index.html`: skripta; `css/zabava.css`: plošča, gumb, rezultati.
- Testi: `tests/drag.test.js` (Node: ravnina na pravi progi, ročni menjalnik, prednost, tekmec, rdeča luč, težavnost), `tests/browser/drag.test.mjs` (meni, dirka proti tovornjaku, rezultati, Proti avtu, tipke in gumb PRESTAVA, rdeča luč, postavitev pokonci in ležeče, električni avto); `tests/browser/menu.test.mjs`: osem načinov (*Drag race* za *Endless traffic*).

## Stanje
| Korak | Kaj | Stanje |
|---|---|---|
| 0 | Načrt, vpis v vrsto (»Načrtovano«, #513), osnutek PR #515 | narejeno |
| 1 | Ročni menjalnik v jedru (`car.man`) in test fizike | narejeno |
| 2 | Način `drag`: postavitev, štart, cilj, tekmec, prednost | narejeno |
| 3 | HUD, gumb PRESTAVA, meni, prevodi | narejeno |
| 4 | Rezultati in rekord | narejeno |
| 5 | Testi (Node, brskalnik), `npm run test:related` | narejeno: povezani testi lokalno zeleni (30 od 30, 8. 11.); osnutek v vrsti (`docs/vrsta.md`, vrstica 10.1) |

## Predaja
Delo je končano (8. 11. 2026). Ob vrsti: spoji svež `main` (`node tools/spoji-main.mjs`). #372 (neskončna vožnja) gre na `main` pred #515 in spreminja ista mesta (`js/menu.js`: seznam načinov, `GAME_MODE`, prva celica vrstice; `js/core.js`, `js/game.js`, `js/lang.js`, `tests/browser/menu.test.mjs`, `tests/run.js`, `index.html` z `node tools/stamp.js --merge`): obdrži obe strani, v `menu.test.mjs` je osem načinov (*Drag race* za *Endless traffic*). Osem načinov paše na ploščo pri vseh velikostih testa (preverjeno 8. 11. s poskusno osmo ploščico); pri 360 × 640 se podnapis *Endless traffic* odreže v tretji vrstici, zato ga po spoju preveri in po potrebi skrajšaj. Spojeno 9. 11. 2026 v zbirni veji A (#583, `main` 6b650d3e): podnapis *Endless traffic* skrajšan v »Ever denser traffic. Close passes add time.« (pokonci dve vrstici, ležeče brez podnapisa). #516 (meni, jure.kopac26) gre za #515 (dogovor v `docs/vrsta.md`, Usklajevanje, točka 10). Nato `npm run test:related`.
