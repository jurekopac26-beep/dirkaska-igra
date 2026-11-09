# Novi avti: 5 sodobnih vozil (načrt)

Izbira uporabnika 5. 11. 2026: »5 novih avtov iz sedanjega časa (sodobni, ne klasika)«. Načrt: seja session_01WbgGzuwVYnMe1PqsfUDJyt (račun 3, koordinacija VSE SEJE 2). **Stanje: OSA R, ŠAKAL D, GAMS RH in OREL GT3 so narejeni v #361 (v igri je 47 vozil); LOS V8 odpade, NOSOROG E pozneje** (razdelek »Odločitve uporabnika«). OSA R je bil prvi (odločitev uporabnika 5. 11. ob 17.35 pri koordinaciji VSE SEJE 2: OSA R začni takoj, ker je v vseh možnostih izbora; #315 je na `main`), druga vozila so prišla po odgovorih uporabnika (vprašanji `novi-avti-izbor` in `novi-avti-videz` na strani Odločitve 3) in po dogovoru v `docs/vrsta.md`; pred novimi progami (nove proge so vedno zadnje). Zbirna veja je `novi-avti/vozila` (ime `novi-avti` ni mogoče, ker veja načrta `novi-avti/nacrt` ostane na GitHubu).

## Pravila
- Vsa vozila so izmišljena: ime je žival + splošna oznaka (R, V8, E, D, GT3, RH so oznake vrste ali razreda, ne imena modelov). Brez znamk, logotipov, imen modelov in oseb; nalepke so samo številke in splošni vzorci.
- Oblike ne posnemajo pravih modelov: telo se gradi iz splošnih razmerij razreda (dolžina, višina, nagib stekel), prepoznavni deli (luči, maska, krilo) so izmišljeni. Prototipi v vprašanjih so samo izhodišče; končni model se naredi znova po pravilih KIT (`js/render.js`).
- Nova vozila so v **novih datotekah** `js/cars/<id>.js`. Skupne sezname se spremeni čim manj in samo z dodajanjem na konec (README, razdelek »Novo vozilo«): `index.html`, `garaza.html`, `ROSTER` v `tests/fleet.test.js`, `js/lang.js`, `docs/igra.md` (Vozni park). Obstoječih vozil (npr. `tiger.js`) ne spreminjamo.

## Kaj že imamo (pred načrtom 43 vozil, zdaj 47; `docs/igra.md` »Vozni park«)
GT3 z motorjem spredaj je TIGER GT, reli avti so LEV R, BURJA R7 in ZMAJ 85, električni hiperavto je STRELA EV, turing limuzina je KOZOROG TC, terenca sta MEDVED 4x4 in SAMUM 4x4, zadnji pogon za drift imata starejša športna avta SOKOL R in KAZE RS. **Manjka sodobno:** vroči hečbek s štirikolesnim pogonom (mali avti imajo prednji pogon, MIŠKA zadnjega), družinski avto z V8, električni terenec ali pickup, sodoben tekmovalni drift kupe in drugi GT3, da ima TIGER GT svoj razred.

## Izbor (priporočeno: možnost 1 vprašanja `novi-avti-izbor`)
Moč je moč v igri (kW, kot v obstoječih vozilih), cena je vrednost v EUR po merilu tabele cen iz #297 (1 kovanec = 1 EUR; vozilo, ki ga ni v tabeli, ima ceno iz `price`, zato tabele v `js/core.js` ne spreminjamo).

| id | Ime | Kategorija | Pogon | Moč | Masa | Cena | Zvok | Zakaj |
|---|---|---|---|---|---|---|---|---|
| `osa` | OSA R | mali | AWD | 310 kW | 1450 kg | 55 000 | `i4`, turbo | sodoben vroči hečbek 4x4; najhitrejši mali avto, na makadamu za LEV R |
| `los` | LOS V8 | sportni | AWD | 520 kW | 2050 kg | 140 000 | `v8`, nizek | družinski karavan z dvoturbo V8: težak, zelo hiter na ravnini, miren; nova vrsta vozila |
| `nosorog` | NOSOROG E | elektricni | AWD (3 motorji) | 620 kW | 3100 kg | 110 000 | `ev`, nizek, šum gum | prvi električni terenec: takoj pospeši, visoko težišče, dober na makadamu in skokih |
| `sakal` | ŠAKAL D | sportni | FR | 560 kW | 1350 kg | 180 000 | `i6`, turbo | sodoben tekmovalni drift kupe: velik zasuk koles, zadaj lahko zanaša; za avtošolo Drift |
| `orel` | OREL GT3 | dirkalni | MR | 410 kW | 1280 kg | 550 000 | `v10`, dirkalni | GT3 z motorjem v sredini; s TIGER GT dirka v mešanem polju razreda GT3 |
| `gams` (namesto ene) | GAMS RH | reli | AWD | 330 kW | 1260 kg | 1 000 000 | `i4`, turbo | sodoben reli avto s hibridom; možnost 2 (namesto OREL) ali 3 (namesto ŠAKAL) |

Videz (vprašanje `novi-avti-videz`): LOS V8 kot **karavan** (priporočeno, dolga streha in strešni nosilci se s kamere za avtom lepo vidijo) ali limuzina; NOSOROG E kot **pickup** (priporočeno, odprt keson s tovorom je viden od zgoraj) ali SUV.

## Fizika (`phys`, cilji za `expect`)
Številke `expect` (t100, vmax, latG, d100) se izmerijo po izdelavi (kot `tests/fleet.test.js`, `tests/lib/handling.js`); cilj je uvrstitev med obstoječa vozila, ne prave vrednosti. Cilji morajo biti v mejah kategorije (`ENVELOPE` v `tests/fleet.test.js`), npr. mali: 0–100 vsaj 3,0 s, največ 245 km/h; športni: 0–100 vsaj 2,7 s, največ 265 km/h.
- **OSA R** (narejeno): izmerjeno 0–100 3,08 s (LEV S 3,28), 242 km/h brez omejevalnika (`vLim` je odstranjen v pregledu #361, ker je izničil nadgradnje motorja; z njimi 248 / 254 / 261 km/h), 2,37 g, 23,0 m; štirikolesni pogon LEV R, malo manj oprijema pri speljevanju (`tracK` 0,93, težji avto na cestnih gumah), majhen zračni upor.
- **LOS V8**: t100 ~2,8–3,1, vmax ~255–265 (meja kategorije); velika masa, daljše zaviranje (d100 daljši od TIGER GT), nagibanje (`sway` ~1,2), manjši zasuk koles.
- **NOSOROG E**: `ev` (brez menjalnika), t100 ~2,7–3,1, vmax omejen (`vLim` ~200 km/h); visoko težišče (`sway` ~2), na makadamu kot MEDVED 4x4, dobro prenese skoke (`landV`, `landK`), robusten (`dmgK` ~0,8); `len` 5,45 m, `wid` 2,06 m.
- **ŠAKAL D** (narejeno): izmerjeno 0–100 3,27 s, 257 km/h brez omejevalnika, 2,25 g, 22,1 m (z `vLim` 256 in `cDrag` 0,40: 3,24 s, 254 km/h, 2,30 g, 22,3 m). `vLim` je odstranjen po odločitvi uporabnika 5. 11. 2026, kot pri OSA R, ker je izničil nadgradnje motorja. Brez njega bi avto z `cDrag` 0,40 vozil 287 km/h (nad mejo kategorije 265), zato je `cDrag` 0,56 (široka karoserija, veliko krilo): končna hitrost 257 km/h je tam, kjer so vrtljaji v 6. prestavi, z nadgradnjami motorja 263 / 270 / 277 km/h; zasuk koles (`steerMax`) 40 % večji od SOKOL R; avtošola Drift (Jezero, avtopilot) 2059 točk (prej 2134), ŠKORPIJON H 1998; Spa 421 proti 202 (prej 462); Bathurst 779 proti 836 pri ŠKORPIJON H (prej 860): večji upor zmanjša hitrost v zanosu. `spinK` 0,3 namesto > 1: pravilo voznega parka (`tests/fleet.test.js`) nad 300 W/kg dovoli največ 0,3 (sicer se kolesa vrtijo ves čas: dim, zasuk z močjo, AI odvzema plin); zanašanje dajejo `csp` (`tv` 1,25, `out` 1,5, `pwr` 0,16, `liftP` 0,18).
- **OREL GT3** (narejeno): izmerjeno 0–100 2,91 s (TIGER GT 2,92), 265 km/h (256), 2,47 g (2,61), 20,0 m (21,1); krog z avtopilotom na Bathurstu −0,04 %, na Spa −0,03 % od TIGER GT (`tests/fleet.test.js`, razdelek 12), na drugih pravih dirkališčih do 0,5 %. **Odstop od načrta:** `aero` 0,00007 (kot TIGER GT) namesto ~0,00045 in `brakeK` 1,22 namesto ~1,4, ker aerodinamika krog močno skrajša (`aero` 0,00012 že −1,1 % na Bathurstu in −1,4 % na Spa, tudi z manj oprijema) in 1 % razreda ne bi držal; razred izenačijo manj oprijema v ovinku (`arc.amax` 1,8 proti 1,9), boljše zavore in manjši zračni upor (`cDrag` 0,39 proti 0,42). Motor v sredini: hitrejše zavijanje in bolj živ zadek kot TIGER GT (`csp` `turn` 1,2, `liftP` 0,16, `out` 1,1; `kI` 1,14).
- **GAMS RH** (narejeno): izmerjeno 0–100 2,41 s, 242 km/h, 2,40 g, 22,9 m; štirikolesni pogon LEV R z več moči in oprijema na izhodu iz ovinka (`tracK` 1,2, hibrid), na makadamu najboljši v igri (`loose` 1,12: 0–100 2,92 s in 2,12 g, SAMUM 4x4 2,97 s in 2,06 g), mehkejši doskoki (`landV` 15, `landK` 0,6). Samodejna vožnja: Ouninpohja, Finska 221,7 s (ZMAJ 85 222,2), Sani Pass, Južna Afrika 180,3 s (najhitrejši v igri).

## Model za kamero za avtom
Kamera za avtom je visoko in daleč (vozilo je na zaslonu majhno), zato štejejo obris, streha, zadek, luči in kolesa, ne drobni detajli. Proračun KIT: avto 1400 / 800 trikotnikov (zunanja lupina / notranji del), kolesa po obstoječih pravilih; notranjost samo preprost sedež in voznik.
- **OSA R**: kratek zadek, velik strešni spojler, široki blatniki, pas luči čez ves zadek, dva izpuha na straneh.
- **LOS V8**: dolga streha s strešnimi nosilci (karavan) ali kratek zadek z robom (limuzina), širok difuzor, štirje izpuhi.
- **NOSOROG E**: keson s tovorom in rezervnim kolesom (pickup) ali visoka streha s košaro (SUV); vrstica luči na strehi, velika kolesa, visoko podvozje, pas luči spredaj in zadaj.
- **ŠAKAL D**: širok paket blatnikov, veliko zadnje krilo, nizek prednji odbijač, nalepke s številko; dim gum je že v igri.
- **OREL GT3**: nizek, dolg, kabina spredaj, zračnik na strehi (viden od zgoraj), veliko krilo s stranicama, številka na strehi in vratih.
- **GAMS RH** (narejeno): kratek, širok hečbek na škatlastih blatnikih z rešetkami na prednjih, veliko krilo na robu strehe s stranicama po C-stebrih, strešni zračnik z zeleno lučko hibrida, odprt zadek (mreža, difuzor, en izpuh desno), blatni zavesici za vsakim kolesom; streha v barvi črte, ob straneh greben gorskih vrhov.
Deli, ki odpadejo (krilo, odbijač, pokrov), dobijo tečaje kot pri obstoječih vozilih. Videz se preveri s `node tools/carshots.mjs <id>` in s kamere za avtom na Bathurstu in Vršiču.

## Zvok
Samo obstoječe vrste zvoka (`SND_KINDS` v `js/core.js`) z lastnimi nastavitvami (`hz`, `loud`, `turbo`), brez nove kode zvoka: OSA R `i4` turbo, LOS V8 `v8` nižji (`hz` ~0,9), NOSOROG E `ev` nižji, ŠAKAL D `i6` turbo, OREL GT3 `v10` višji in glasnejši od MODRAS V10 in SUPERKOMBI, GAMS RH `i4` turbo.

## Tekmeci
- Vsak avto ima svoje polje (`field: ['<id>']`), OREL GT3 pa mešano polje GT3 `field: ['orel', 'tiger']` (polje TIGER GT ostane, kot je, ker `tiger.js` ne spreminjamo).
- NOSOROG E je širok in težak: če se tekmeci na ozkih progah gnetejo, dobi `fieldN` 9 (kot PREDSEDNIK); privzeto polno polje.
- Nastavitve AI (`aiGap`, `aiEdge` …) ostanejo privzete, razen če test dirk pokaže trke ali zaostajanje.

## Garaža in deli
- `parts` po vzoru sorodnega vozila: OSA R po LEV S, LOS V8 po JELEN GT, NOSOROG E po MEDVED 4x4 in JEŽEK E (električni: brez menjalnika in turba), ŠAKAL D po SOKOL R, OREL GT3 po TIGER GT, GAMS RH po LEV R.
- `mounts` (krilo, luči, platišča) po `docs/deli.md` in pregledu možnosti iz #315; barve delov po `deli-barve`.
- Najem, škoda, predali, gume in nagrade po vrednosti (#297) delujejo sami iz `price` in `cat`; če #297 doda nova obvezna polja, jih dobi vsako novo vozilo.

## Prevodi
Imena ostanejo, kot so (tudi v angleščini). Opis (`desc`) vsakega vozila se prevede v `js/lang.js`; kategorije in deli že imajo prevode.

## Testi
- `tests/fleet.test.js`: `ROSTER` (dodati na konec), `expect` iz meritve, deli, ki odpadejo, rezervoar.
- `tests/kit.test.js`, `tests/lang.test.js`, `tests/deli.test.js`, `tests/deli-barve.test.js`.
- Brskalniški: `tests/browser/fleet.test.mjs` (proračun trikotnikov), `cars-ui.test.mjs`, `deli-barve.test.mjs`, `career.test.mjs` (cene in nagrade po #297).
- Nov test: OREL GT3 in TIGER GT v mešanem polju, razlika kroga na Bathurstu in Spa največ 1 %; dirka z NOSOROG E na ozki pravi progi brez gneče.
- Lokalno `npm run test:related`; celoten nabor na GitHubu v pull requestu.

## Obremenitev telefona
- Ob zagonu se naloži samo 5 opisov vozil (~15 KB vsak); model se zgradi, ko je vozilo v dirki.
- Polje 8–10 novih vozil ostane v proračunu (1400 / 800 trikotnikov na vozilo, klici risanja kot pri obstoječih vozilih). Preveri `perf.test.mjs` z dirko novih vozil na Bathurstu: največ klicev in oglišč ne preseže dirke s TIGER GT; obremenitev drugih prog se ne spremeni (reference `tests/golden/perf.json` ostanejo).

## Koraki in ocena
0. **Pogoji**: odgovori uporabnika; #315 na `main`; dogovor z računom 2 (od ned. 8. 11. 10.00 ureja `js/cars/*`, garaža) in z #297 (račun 1, garaža) v `docs/vrsta.md`; nove datoteke se ne prekrivajo, skupne vrstice samo na konec seznamov.
1. Zbirna veja `novi-avti` in osnutek pull requesta »Novi avti: 5 sodobnih vozil« ob začetku dela.
2. Vsako vozilo svoja seja (Opus, napor max), največ 2 hkrati, vsaka v svoji veji iz `novi-avti` (npr. `novi-avti/osa`), nato spoj v zbirno vejo. Na vozilo: model KIT ~2 h, fizika in meritev `expect` ~1,5 h, zvok ~0,5 h, deli in `mounts` ~1 h, prevod, testi in slika ~1 h, skupaj **~6 h** (prvo ~7 h, ker postavi postopek).
3. Skupni del: mešano polje GT3, dirke na pravih progah, `perf.test.mjs`, `docs/igra.md` (Vozni park 43 → 48), README in kazalo, **~3 h**.
4. En pull request, en krog testov na GitHubu; v vrsto po pravilih `docs/vrsta.md`.

Skupaj **~34 h** dela sej (brez čakanja na teste).

## Odločitve uporabnika
- 5. 11. ob 17.35 (pri koordinaciji VSE SEJE 2): OSA R začni takoj, Opus, napor max; nove datoteke, skupni seznami samo na konec; ne spreminjaj `js/cars/kolibri.js` in `js/deli/*` (dogovor z računom 2); v testih in slikah ne uporabljaj prog ZDA razen Pikes Peaka (postanejo testne, #355).
- Izbor vozil (5. 11. ob 19.45, v pogovoru s koordinacijo VSE SEJE 2, session_01WbgGzv4TzuAXEWDMgtBJpF): od prototipov se naredijo **ŠAKAL D, OREL GT3 in GAMS RH**; **LOS V8 odpade**, **NOSOROG E pozneje**. ŠAKAL D (veja `novi-avti/sakal`) in OREL GT3 (`novi-avti/orel`) gresta vzporedno, vsak v svoji seji; spoj v `novi-avti/vozila` (#361).
- Videz (`novi-avti-videz`): LOS V8 odpade; videz NOSOROG E se izbere, ko pride na vrsto.
- Omejevalnik hitrosti (5. 11. 2026, prek koordinacije VSE SEJE 2, session_01WbgGzv4TzuAXEWDMgtBJpF): ŠAKAL D naj nima `vLim` (256), enako kot OSA R (omejevalnik izniči nadgradnje motorja). Hitrost brez njega drži zračni upor (`cDrag` 0,56, opis vozila zgoraj); za NOSOROG E (načrt: `vLim` ~200) odločitve še ni.

## Predaja (5. 11. 2026, seja načrta in OSA R)
- **Stanje:** OSA R je narejen v #361 (zbirna veja `novi-avti/vozila`, 26. v vrsti, osnutek do vrste; povezani testi lokalno zeleni na ef62fd2). Seja session_01WbgGzuwVYnMe1PqsfUDJyt je ustavljena (kontekst ~290 tisoč).
- **Odgovori:** vprašanji `novi-avti-izbor` in `novi-avti-videz` (stran Odločitve 3) prebere koordinacija VSE SEJE 2 (`seja_id` preusmerjen nanjo) in nato zažene nove seje.
- **Naslednja vozila:** vsako vozilo nova seja (Opus, napor max), največ 2 hkrati, vsaka v svoji veji iz `novi-avti/vozila` (npr. `novi-avti/los`), nato spoj v zbirno vejo; pull request ostane en (#361).
- **Postopek (kot OSA R, ~4–6 h):** (1) `js/cars/<id>.js` po vzoru `js/cars/osa.js` (kompakten KIT, deli s tečaji, `mounts` krilo, luči, platišča), oblika iz `tools/novi-avti/prototipi.js` (izbrani videz). (2) Fizika: meritev kot `tests/lib/handling.js` (t100, vmax, latG, d100), cilji v mejah `ENVELOPE` iz `tests/fleet.test.js`, `expect` okoli meritve. (3) Skupni seznami samo na konec: `index.html`, `garaza.html`, `ROSTER`, `js/lang.js` (opis do 90 znakov, brez kW in kg), `docs/igra.md` (tabela kategorije, število vozil), `README.md` (število). (4) Pozor: `tests/browser/lang.test.mjs` šteje male avte (»Small cars · 2/7«); del, katerega središče je več kot 0,35 m od tabele delov, dobi `over` v `parts` (brskalniški fleet z `FLEET_ONLY=<id>`). (5) Testi: `npm run test:related`; slika s kamere za avtom na Bathurstu (`tools/carshots.mjs <id>`).
- V testih in slikah ne uporabljaj prog ZDA razen Pikes Peaka (#355). Ne spreminjaj `js/cars/kolibri.js`, `js/deli/*` in drugih vozil. Zadnja seja izbriše `tools/novi-avti/`.
- **ŠAKAL D** (seja session_01WbgGztSGd9Wk7B4ALsghbj, veja `novi-avti/sakal`, spoj v `novi-avti/vozila`): narejen. Za naslednja vozila: nad 300 W/kg je `spinK` največ 0,3 (pravilo v `tests/fleet.test.js`); odpadel del, ki na cesti leži više od max(0,3 m, 3 × `h`) (krilo s stojali, panel s širokim blatnikom), dobi pravo debelino `h` v `parts.over` (`tests/kit.test.js`, razdelek 7); `tests/browser/cars-ui.test.mjs` šteje športne avte (»Športni · 2/7«, vrstni red po ceni); brskalniški testi v oblačni seji potrebujejo `npm ci`; slika s kamere za avtom na pravi progi: hiter vstop `index.html?proga=bathurst&avto=<id>&tekmeci=0` in `Render.snapshot` kot v `tools/shot.mjs` (ta avta ne izbere).
- **Pregled #361, OSA R** (seja session_01WbgGzsAMdgQhhnDQGg1ec9): pas zadnjih luči v dveh polovicah na `tailL` in `tailR` (obroba na karoseriji, sij v `body.lamps`), `body.door`, težišče na sredini narisane karoserije (`a` 1,175, `b` 1,385, videz premaknjen za +0,115 m; meritve enake), smerniki na blatnikih, ocene 8/8/5/5, oblika `mounts.zarometi`, brez `vLim`. Odprto za koordinacijo (rešeno 5. 11. 2026): ŠAKAL D je zdaj brez `vLim`; motor 1–3 mu doda 263 / 270 / 277 km/h (prej ~0,1 km/h: 254,6 / 254,7 / 254,7), glej odločitev uporabnika zgoraj.
- **GAMS RH:** narejen v veji `novi-avti/gams` (spojena v `novi-avti/vozila`, #361); `tools/novi-avti/` ostane za NOSOROG E (pozneje).
- **OREL GT3** (seja session_01WbgGztY8qMc3v6cmSTMWxP): narejen v veji `novi-avti/orel` iz `novi-avti/vozila`, spojen v zbirno vejo (#361). Cena 550 000 po merilu #297 (do združitve #297 je OREL najdražji dirkalnik). Polje: `field: ['orel', 'tiger']` (izmenoma), polje TIGER GT ostane samo TIGER GT. Model: 1372/1400 in 766/800 trikotnikov, 14/9 klicev risanja; vrata in zadnja blatnika imajo v `over` debelino (`h`), da ležijo na cesti (test kit).
