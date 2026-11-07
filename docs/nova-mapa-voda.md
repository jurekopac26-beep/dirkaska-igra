# Nova mapa: vožnja po vodi

Tema iz vrste (izbira uporabnika 5. 11. 2026): na novi mapi (NEW VERSION · TEST 1) igralec vzame vodni skuter in vozi po progi za skuterje, po kanalu do morja in po morju; avto, ki zapelje v vodo, ne razpade več. Veja `nova-mapa/voznja-po-vodi`, pull request #331 (osnutek do vrste).

## Stanje (5. 11. 2026)

Narejeno in lokalno zeleno (`tests/browser/nvwater.test.mjs`, 14 preverjanj):

- **`js/nvwater.js` (`NVWater`)**, v `js/nvboat.js`, `js/game.js`, `index.html` in `js/lang.js` samo kratki priklopi. Gradniki misije 35 iz `js/missions/kit.js` (`MisKit.boat`, `MisKit.wade`, `MisKit.hold`, `MisKit.parts`) so uporabljeni, ne podvojeni; `kit.js` ni spremenjen.
- **Trije skuterji**: dva na pomolu pri HOME (na mestih skuterjev iz `js/nvboat.js`, ki ju `NVWater` pred združevanjem vzame iz scene; prvi je potisnjen malo dlje od obale, ker je bil v 3 cm vode) in en prost, oranžen, 3 m pred štartno črto proge za skuterje, 7 m od sredine na strani plaže. Skuterji na štartni mreži in na progi ostanejo okras.
- **Prevzem**: avto ustavljen na obali ob skuterju (do 12 m, pod 2,2 m/s): kartica na vrhu TAKE THE JET SKI (videz kot pri gasilskem vozilu, `js/nvride.js`). Avto čaka tam (`MisKit.hold`), igralec vozi skuter s svojimi kontrolami, kamera za skuterjem (pokonci višje in dlje), hitrost na HUD-u skrita (`mis-boat`), gumb »Na progo« skrit.
- **Fizika skuterja** (`K` v `js/nvwater.js`): do 18 m/s; v zavoju drsi (smer gibanja sledi nosu z zamikom `K.GRIP`, pri majhni hitrosti hitreje; drsenje jemlje hitrost `K.SLIDE`), nagne se v zavoj (`K.LEAN`), valovi: drobni na progi in v kanalu (`K.CHOP`), daljši val na morju (`K.SWELL`), vožnja v val upočasni (`K.BUMP`). Na kopno ne zapelje: obstane na plitvini ob robu.
- **Kje vozi**: po progi za skuterje, po kanalu pod mostom krožne ceste do morja in po morju ob obali (do roba mape).
- **Nazaj v avto**: počasi ob kopnem (suho do 3 m, pod 2,6 m/s) kartica BACK TO YOUR CAR: avto se postavi na obalo tam (obrnjen proti kopnemu), skuter ostane v vodi in se ga da spet vzeti. Ponovni začetek pri HOME vrne avto in skuterje na njihova mesta.
- **Avto v vodi**: tla pod vodo so dno (proga in kanal: dno, kot ga riše `js/nvboat.js`, `H3.waterCourse.depth`; morje: `H3.water.bedAt`; brv HOME in most krožne ceste ostaneta). Plitvina avto upočasni (`MisKit.wade`); v globini (več kot 0,75 m, 0,3 s) ga vrne na obalo, kjer je zapeljal v vodo, obrnjenega proti kopnemu, brez škode, s sporočilom NAZAJ NA OBALO (BACK ON THE SHORE). »VOZILO UNIČENO« zaradi vode ni več.
- **Obremenitev telefona**: skuterji, ki jih nihče ne vozi, so en mesh brez sence (en klic risanja; naredi se znova, ko kdo skuter vzame ali pusti), vozni skuter z voznikom svoj mesh, sled za njim še en (samo med vožnjo). Globina morja (iskanje dna na morju stane ~8 µs) se bere iz mreže 2 m, ki se polni sproti; tla avta ob vodi tako stanejo ~1,9 µs namesto ~0,5 µs na klic. Meritev spodaj.

## Odločitve (najbolj preprosta možnost, brez vprašanja; uporabnik jih lahko spremeni)

1. `js/missions/kit.js` ostane, kot je (sprememba bi pognala ~25 testov misij): drsenje, nagib in valovi so v `js/nvwater.js` okoli `MisKit.boat`.
2. »Ob kopnem se vrne v svoj avto«: avto pride na obalo, kjer igralec pristane (ne vozi se nazaj do mesta, kjer je čakal); skuter ostane tam.
3. Štart proge za skuterje: en prost skuter ob štartni črti.
4. Napisi na karticah v angleščini kot pri gasilskem vozilu; sporočilo NAZAJ NA OBALO s prevodom v `js/lang.js`.
5. Posnetek dirke vožnje s skuterjem ne beleži (v posnetku avto stoji, kjer čaka).
6. Brez dirke s skuterji, časov in tekmecev; brez lastnega zvoka skuterja.

## Kaj manjka (predlogi za naslednjo sejo)

- Pregled v igri na telefonu (občutek vožnje, kamera, hitrost); po želji uporabnika popravi številke v `K`.
- Po želji: zvok motorja skuterja, pršenje vode ob trupu, sled tudi na morju daljša, več mest za prevzem (plaža ob morju).
- Ob vrsti: spoji svež `main` (spor v `tests/run.js` `SECS`: vzemi `main` in dodaj `'browser/nvwater.test.mjs': 90`), poženi `npm run test:related`, označi Ready for review.

## Kako testirati

- `node tests/browser/nvwater.test.mjs` (lokalno ~2 min): skuterji, prevzem, vožnja, drsenje, nagib, valovi, kopno, kanal do morja, nazaj v avto, dno pod vodo, plitvina, globina (proga in morje), ponovni začetek. `npm run test:related` izbere še `newver.test.mjs` (pravilo za `js/nvboat.js` in `js/nvwater.js` v `tests/run.js`).
- V igri: meni → NEW VERSION · TEST 1, od HOME zapelji do pomola z dvema skuterjema in se ustavi na obali ob njem → TAKE THE JET SKI.
- V konzoli: `NVWater.state()` (skuterji, vožnja, cona `take`/`land`), `NVWater.pick('ski')` / `NVWater.pick('car')` (kot klik na kartico), `NVWater.put(x, z, h)` (vozni skuter na mesto), `NVWater.depth(x, z)`.

## Meritev

`PERF_ONLY=newmap node tests/browser/perf.test.mjs` (12 mest na novi mapi, kamera za avtom), 5. 11. 2026:

| | klici risanja (povprečje / največ) | oglišča (povprečje / največ) |
|---|---|---|
| `main` (732f25a) | 262 / 342 | 1340k / 1513k |
| ta veja (skuterji v enem meshu s senco) | 262 / 344 | 1339k / 1513k |
| ta veja (en mesh brez sence) | 261 / 343 | 1339k / 1513k |

En klic več pri HOME: skuterja na pomolu nista več del združenih meshov mape (`js/nvbake.js`), ker ju igralec lahko odpelje. Referenca v `tests/golden/perf.json` (255 / 324, 1249k / 1550k) ni spremenjena; dovoljeno je do 361 klicev.
