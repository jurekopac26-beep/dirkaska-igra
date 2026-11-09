Legenda: vse je PREVERJENO (prebrano ali pognano; poskusi samo v kopijah igre v scratch mapi, repozitorij nedotaknjen: `git status --short` prazen, HEAD 8fe4f131), razen razdelka DOMNEVE. Časi so merjeni na 4 jedrih pri obremenitvi 7–11. `S` = `tools/killar-cesta-prototip/killar-cesta`. »v.« = vrstica; ure so UTC (po ljubljansko +1 h).

**Novo od začetka raziskave (lokalni refi `origin/*`, GitHub MCP, samo branje)**
- Glava `zbirna/proge` je 7b1985e2 (»Killar: ob cesti brez pasu«, 22:12Z); delovna kopija 8fe4f131 je en commit zadaj. Commit spremeni `js/world-killar.js` (+9/−4), `tests/golden/world.json` (killar: meshes 1525 → 1560, world c82d3f86 → c3a1cd82, floor → 52ec0407/9520), `tests/golden/perf.json` (calls 141 → 144, maxCalls 169 → 173), `docs/proge/killar.md` v. 19 in 31, `docs/kazalo.md` v. 216 in doda `docs/proge/killar-koridor.webp`. `js/tracks/killar.js`, `js/core.js`, `sim.json`, `races.json` so enaki, zato številke fizike spodaj veljajo; world in perf vzemi z glave.
- `main` je 29c5cc58 (#615, 22:23Z; lokalni `origin/main` c78eb309 je 3 commite zadaj). `CLAUDE.md` (Seje, »Proge in grafika«) ima novo: »**Fizika vožnje se ne spreminja** (odločitev uporabnika 9. 11. 2026 ob ~23.05: »fiziko voznje ne spreminjaj, ker je dobra, samo fiziko trkov«): oprijem, pnevmatike, zaviranje, pospeševanje, krmiljenje, vzmetenje in vožnja tekmecev ostanejo, kot so na `main` … Avto, ki se ničesar ne dotakne, vozi na suhem do številke enako kot prej; tema, ki bi to spremenila (tudi kot stranski učinek skupne kode), se ne začne oziroma se ustavi in javi uporabniku.« Isti odstavek zahteva primerjavo v slikah zdaj/potem pred `main`.

**1. `tests/killar.test.js`** (19 preverjanj, osnova 19/19, 9 s; številka = vrstica `check`)
- Občutljiva na `T.hy`:
  - v. 31 »nearly level, nowhere steeper than ~8.5 %«: `gmax < 0.09` (v. 32), gmax = max `T.grade[i]`, i ∈ [startIdx, finishIdx) (v. 30), in `|T.altAt(T.hFinish) − def.alt[1]| < 2`. Zdaj 8,24 % (2218 m po startu).
  - v. 125 »race: 13 cars on the autopilot, three races«: semena 1–3, `damage: 2` (v. 118–123); `fin === cars && falls <= cars / 6` (≤ 6 od 39). Zdaj 39/39, 4 padci, 17 polj.
  - v. 177 »medals«: `asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && |P.finishTime·1.01 − M.cs[0]| < 1.5` (relijski avto na avtopilotu, `seeded(3)`, v. 173–176). Zdaj 118,9 s; zlata 120 dovoli 117,33–120,30 s. Mokrih časov z avtopilotom ne primerja.
- Šibko občutljiva (v vseh poskusih OK): v. 92 skozi ograjo pri 90 km/h, padec > 8 m, vrnitev (`P.y = T.hy[i]`, `|P.y − elevAt(s).y| < 0.5`); v. 95 ograja se razbije pri ~29 km/h, zdrži pri ~19; v. 98 skozi razbito polje in z mostu; v. 101 desno 9 m ostane, 11 m vrnjen; v. 110 skala pri 43 km/h; v. 166 dvoboj (oba v cilju, nihče povožen, `standMax < 30`).
- Neobčutljiva: v. 25 odprta cesta, načini race/tt/traffic, 4 kontrolne točke, `T.w === 4.5`; v. 28 ime; v. 35 ni v Velikem prvenstvu; v. 36 kraji HUD; v. 42 makadam povsod; v. 54 prepad na > 2/3 poti, rob 1,2 m za cesto; v. 60 lesena ograja levo, desno brez; v. 135 promet; v. 148 in 149 načini in štartna mreža. Klicev sovoznika in luž datoteka ne preverja.
- Poskus z nadomestkom reliefa prek obstoječega `def.bumps` (95 Gaussovih grbin in kotanj na ~45 m, w 3,5–8 m; jakost k: |h| ≤ 0,3·k m):

| k (največ \|h\|) | gmax | avtopilot suho / mokro | v zraku skupaj / najdlje | padci / polja (v. 125) | padejo |
|---|---|---|---|---|---|
| 0 (zdaj) | 8,24 % | 118,93 / 131,33 s | 0 | 4 / 17 | – |
| 0,3 (0,09 m) | 9,1 % | 118,9 s | ni merjeno | 9 / 39 | v. 31, 125 |
| 0,5 (0,15 m) | 9,61 % | 119,36 / 131,57 s | 0,08 / 0,03 s | 12 / 48 | v. 31, 125 |
| 1 (0,30 m) | 10,98 % | 120,95 / 133,37 s | 1,47 / 0,22 s | 2 / 17 | v. 31, 177 |
| 2 (0,60 m) | 13,71 % | 125,68 / 137,50 s | 6,81 / 0,39 s | 9 / 45 | v. 31, 125, 177 |

  Še k = 0,7 in 1,5 ter k = 1 na 30, 60, 90 m: padci 5, 6, 1, 3, 4. V vseh 10 tekih 39/39 v cilju; število padcev je kaotično (1–12, neodvisno od jakosti).

**2. Reference s `killar` in kako jih narediti znova samo zanj**
- `tests/golden/sim.json` v. 4902–4999: 7 ključev `killar/{race,demo,upg,crash,formula,lm,car}/cs` (`digest` stanja dirke vsakih 10 s v 60 s, `lead`, `car0`, `cover`). `tests/golden.test.js:16–17,25`: `--update`, `--only=killar`. Trčni scenariji morajo imeti `cv.dmg >= 0.2 && cv.loose >= 1` (`:30`), sicer »not written: fix the failures first« (`:37`). Zdaj loose: crash 7, formula 6, lm 1.
- `tests/golden/races.json` v. 2502–2551: 5 ključev `killar/cs`, `/rain`, `/formula`, `/lm`, `/car` (13/13; winner 125,51 / 137,39 / 126,29 / 126,46 / 125,02 s; spins, walls, rescues, nan, digest). `tests/races.test.js:18–19,57`. Pade: dež ni 0,5–30 % počasnejši (`:62`), spins > ref + 2, walls > max(1,5·ref, ref + 10), rescues > ref + 1, zmagovalec zunaj ±3 % (`:64–67`); drug digest je CHANGED (`:73`).
- `tests/golden/world.json` v. 1419 (meshes, verts, instances, props, crowd, world, propsHash, floor, groups): `WORLD_ONLY=killar` (`tests/browser/world.test.mjs:15`), `--update` ohrani druge ključe (`:105`). `tests/golden/perf.json` v. 373–379: `PERF_ONLY=killar` (`tests/browser/perf.test.mjs:70`), `--update` ohrani druge (`:127`); pade pri maxCalls > ref·1,1 + 5 ali maxKverts > ref·1,1 + 20 (`:113`).
- Past: `--update --only=killar` pri golden in races zapiše samo ključe pravih prog (zanka `trackIds`, `golden.test.js:23`, `races.test.js:55`, `tests/lib/sim.js:7`): sim.json 378 → 168, races.json 270 → 120 ključev (izgubi 210 in 150 ključev zamrznjenih testnih prog; enako opozarja opis PR #494). `npm run golden:update` (`package.json:12`) naredi isto za vse proge. Ukazi (preverjeni v kopiji: races 270 ključev, 5 spremenjenih, 32 vrstic razlike, test nato OK; sim po prenosu bajt za bajtom enak):
```
cp tests/golden/sim.json $S/sim.prej.json;     node tests/golden.test.js --update --only=killar && node $S/testi-prenesi-kljuce.js $S/sim.prej.json tests/golden/sim.json tests/golden/sim.json        # 9–20 s
cp tests/golden/races.json $S/races.prej.json; node tests/races.test.js  --update --only=killar && node $S/testi-prenesi-kljuce.js $S/races.prej.json tests/golden/races.json tests/golden/races.json   # 11–23 s
WORLD_ONLY=killar node tests/browser/world.test.mjs --update    # 88 s
PERF_ONLY=killar  node tests/browser/perf.test.mjs  --update    # 81 s
node tools/menu-lens.js                                         # 10 s: js/menu-data.js:529, samo MENU.profs.killar
```
- Brskalnik: repozitorij nima `node_modules`; globalni Playwright 1.63.0 je enak `package.json:16` (`pwNote`, `tests/browser/lib.mjs:51–54`). S povezavo `node_modules/playwright` → `/opt/node22/lib/node_modules/playwright` je kopija na osnovi ponovila obe referenci (world c82d3f86; perf 141/169, 273k/350k).
- Pri k = 1:
  - golden: 7× CHANGED, `--update` zavrnjen (crash, formula, lm: damage 0,42 / 0,43 / 0,41, loose 0). Nastaviti je treba `CRASH_AT` (`tests/lib/sim.js:60`: `'killar/ev': 7, 'killar/formula': 3`, sicer 6, `:62`).
  - races: 5× CHANGED, 13/13, zmagovalci 127,29 / 139,19 / 128,97 / 129,35 / 127,54 s (v ±3 %).
  - world: FAIL (7 skupin mrež in »prop floor«; verts −5.884, instances −10). Perf: OK brez posodobitve (144/158, 284k/338k).
  - `tests/menu-lens.test.js:40`: FAIL »killar: 0.26 m off« (meja 0,06 m; 121 višin iz `T.hy`, `tools/menu-lens.js:21`). `tests/cisterna.test.js:19,54`: OK (2444 m, meja 2 km v 120 s).

**3. `tests/run.js --related`**
- `changedFiles()` (`:143–149`): `git diff --name-only <merge-base(HEAD, origin/main ali main)>` (z delovnim drevesom) in nesledene datoteke; argumenta za osnovo ni. `related()` (`:132–141`): spremenjen test, testi z imenom datoteke ali dela imena (deli po `- _ .`; `assets/` ne), tabela `RELATED` (`:80–130`).
- Zbirna veja: 97 datotek → 68 testov (37 Node, 31 brskalniških; brskalniški 7.960 s na GitHubu po `SECS`, `:28–64`; zraven `races.test.js`, lokalno > 15 min). Omejitev na zadnjo spremembo je `--files` (`:171`): `node tests/run.js --related --quiet --files "$(git diff --name-only HEAD~1 | paste -sd,)"` (za nepotisnjeno delo `HEAD` in dopiši nove datoteke).
- (a) `js/tracks/killar.js`, `js/world-killar.js`, `tests/killar.test.js`, `docs/proge/killar.md`, `docs/proge/*.webp` → 16 testov. Node ≈ 5 min: stamp, testne-proge 19 s, razdelitev 12 s, menu-lens 7 s, menu-globe, menu-corner 7 s, ljudje-mesta 3 s, killar 9 s, lang, grid 14 s, rivals-n 15 s, fleet 226 s (zaradi `.md`, `:118`). Brskalnik: ljudje, world, gfx, menu (176 + 970 + 950 + 759 s na GitHubu, čez vse proge; filter po progi imata samo world in perf). Brez `js/world-killar.js` odpadeta world in gfx.
- (b) dodatno `js/core.js` → še golden 246 s (vseh 168 scenarijev), repro 7 s, nova 30 s, trki 21 s, rally, katu, sovoznik 4 s, sovoznik-glas 2 s, serpentine 14 s, start 7 s, quick, cisterna 17 s, zrcalni 12 s, browser/repro 113 s; skupaj ≈ 9 min. `js/world-vrsic.js` → stamp, razdelitev, vrsic (test zamrznjene proge), browser/world, gfx. `js/render.js` → browser/world, gfx, maketa-delov, startcam, atmos, vecer, ostrenje, sledi, marks (≥ 2.728 s na GitHubu). `js/menu-data.js` → še browser/menu, darktip.
- Ne izbere, čeprav se Killarjeve reference spremenijo: pri (a) golden, races, perf, sovoznik, sovoznik-glas, cisterna, lestvica; pri `js/core.js` races in killar. Sprememba `tests/golden/sim.json` ne izbere `golden.test.js`. Nov test mora v `SUITES` (`:20`; `tests/shards.test.js:33`), dodatna preverjanja v `tests/killar.test.js` ne.

**4. Medalje**
- Orodja za Killar ni: `tools/nova-proga.mjs <id> --medalje` zahteva vrstico v `docs/gorske-proge.md` (`:30–31`; pognano: »proge killar ni v tabeli«, izhod 2), njegov vzorec (`:154`) pa ne ujame vrstice z narekovaji (`js/tracks/killar.js:38`). Pravilo je isto: čas relijskega avta `C.MODELS[4]` na avtopilotu × 1,01 / 1,06 / 1,14, zaokroženo (`tools/nova-proga.mjs:144–154`). Test preveri samo suho zlato ±1,5 s (v. 177).
- Izračun: `node $S/testi-osnova.js --medalje` (isti tek kot test; izpiše vrstico `medals:` in čas v zraku). Zdaj suho 118,927 s → [120,126,136] (se ujema), mokro 131,333 s → [133,139,150] (v datoteki srebro 140). Pri k = 1 [122,128,138] / [135,141,152], pri k = 2 [127,133,143] / [139,146,157]. Ročno še `docs/proge/killar.md:8` (2:00 / 2:06 / 2:16; dež 2:13 / 2:20 / 2:30).

**5. Sovoznik, luže, orodja, dokumenti**
- Killar je cesta sovoznika (`codrvRoad`, `js/core.js:100`; `tests/sovoznik.test.js:24`): zdaj 14 klicev, 3,2/km, brez grbin. Meje: 1,5–8 klicev/km (`tests/sovoznik.test.js:80`); vsak klic ≤ 8,5 s, polovica ≤ 3,7 s (`tests/sovoznik-glas.test.js:86`).
- `paceNotes` (`js/core.js:1529–1541`, `docs/sovoznik.md:62–66`): s `def.bumps` je vsaka grbina klic (h ≥ 1,5 bigjump, ≥ 1 jump, sicer crest; tudi kotanja) in grbine iz višin se ne berejo (`:1530`). Brez `def.bumps` bere višine: lift = −curv·v²/G ≥ 0,5 crest, ≥ 1,2 jump, ≥ 2 (ali ≥ 1,2 in padec ≥ 1,5 m) bigjump, najmočnejša na 60 m.
  - Relief kot `def.bumps` (k = 1): 30 klicev, 6,8/km, sovoznik-glas FAIL (najdaljši klic 10,07 s).
  - Relief samo v `T.hy` (kopija s popravljenim `paceNotes`), k = 0,5 / 1 / 2: 22 / 26 / 25 klicev (5,0 / 5,9 / 5,7 na km), oba testa OK, a klici so »caution, big jump and big jump« (klicev z big jump 3 / 7 / 18).
- Luže: `_buildPuddles` teče samo z `def.rain` (`js/core.js:265`; imajo ga harju, ouninpohja, sani). Killar ima le `rainP: 0.15` (`js/tracks/killar.js:27`), luž ni in test jih ne preverja. Z `def.rain` bi šle v kotanje ≥ 0,25 m in se izognile `def.bumps` (`:954–969`).
- `tools/proge-pregled.js` meri tloris in pri odprti cesti `climb = h[zadnji] − h[0]` na cele metre (`:75,85`), prepiše samo tabelo med oznakama (`:96–99`). V kopiji je idempotenten in pri k = 1 vrstice `docs/proge-pregled.md:32` (»+10 m«) ne spremeni; `:54` (»Do 60 m ob cesti«) je ročna. Noben test tega dokumenta ne bere.
- `tests/testne-proge.test.js` (3/3, 19 s): Killar ni med 30 zamrznjenimi (`tests/golden/testne-proge.json`); lastnik datoteke je del imena (`:44,50`), `js/world-vrsic.js` je izvzeta (`:49`). `tests/lang.test.js` 18/18 (opis v `js/tracks/killar.js:31–32` ravnine ne omenja). `node tools/stamp.js --check` OK; vpliva samo nova datoteka v `index.html`. razdelitev, menu-corner in menu-globe so OK tudi pri k = 1.
- `docs/kazalo.md`: novo polje `def` sodi v »Teme v js/core.js«, v. 176 (**proga** `Track`); Killar je v v. 216, `tools/killar-skala.mjs` v v. 96. »Skoraj ravna, naklon največ 8,5 %« stoji v `docs/proge/killar.md:5,22` in `tests/README.md:244`; grbine sovoznika v `docs/sovoznik.md:62–66` in `docs/igra.md:112`.

**6. `docs/proge/killar.md`** (33 vrstic)
- Zgradba: naslov (1), povezava nazaj (3), uvod (5), alineje Dirka (7), Kronometer (8), Promet (9), »Lesena ograja levo, desno brez ograje« s podalinejami (10–19), Makadam (20), kraji (21), »Oblika in višine« (22); »Okolica« (24) z alinejami 26–33, med njimi **Cesta** (31) in Meni (33).
- Odločitve so v oklepaju za krepkim naslovom alineje, dobesedno v »…« z datumom in uro. Primer v. 10: »(odločitve uporabnika 9. 11. 2026, ob ~13.05: »…«, in štiri med ~18.10 in ~18.20: »…«)«; na glavi veje v. 31: »**Ob cesti ni pasu** (odločitev uporabnika 9. 11. 2026 ob ~22.20: »zbrisi ta koridor«)«. V. 16 navaja izid testa (»17 polj ograje, čez rob padejo štirikrat«).
- Slike so povezave (ne vdelane) v v. 19 »Slike pred in po (kamera za avtom)«, vsaka z uro in opisom pogledov: `killar-brez-ograje.webp` 1288×360, 63 KB; `killar-ograja.webp` 1936×360, 93 KB; `killar-mreza.webp` 1936×360, 112 KB; na glavi `killar-koridor.webp` 1288×728, 143 KB (sličice 640×360, razmik 8 px).
- Posnetki: `node tools/shot.mjs killar --m <m> --lezece --pred HEAD` → `test-results/shots/` (`.gitignore:2`), PNG pred, po, primerjava (`tools/shot.mjs:1–15`). WebP: `cwebp` in `sharp` nista nameščena; delujejo `convert a.png -quality 82 b.webp` (ImageMagick 6.9.12), PIL 12.3.0 in ffmpeg (preizkušeno). Noben test ne omejuje velikosti ali seznama datotek v `docs/proge` (razen zamrznjenih testnih prog); `fleet.test.js` prebere vsak `.md`.

**7. Predogled** (samo povzetek, nič sproženo)
- `.github/workflows/stran.yml:10–15`: `push` na `main`, `pull_request_target` [opened, reopened, synchronize, closed], `workflow_dispatch` brez vhodov. Vedno `ref: main` (`:64`) in `node tools/predogled.mjs _site` (`:68`).
- `tools/predogled.mjs`: `main` v koren, odprti PR tega repozitorija v `beta/<številka>/` (`git fetch origin pull/<n>/head`, `:52`; samo `GAME`, `:16`), največ `MAX = 3` (`:15`), najprej z oznako »predogled«, nato po `updatedAt` (`:40–41`), tudi osnutki. Vsako drevo je ožigosano; PR s povezavo brez datoteke izpade (`:58–60`). Sledi `stamp.js --check-stamped` za vsako drevo (`stran.yml:72–77`); ob napaki ostane prejšnja stran. `concurrency: stran`, `cancel-in-progress: false` (`stran.yml:23–25`).
- #494 je osnutek z oznako »predogled« (med 50 nazadnje spremenjenimi PR jo imajo #494, #579, #569, torej vsi trije v `MAX`). Potisk v vejo gradnjo sproži sam (synchronize); dodajanje oznake ne (`labeled` ni med tipi). Svež zagon na `main`: Actions → Stran → Run workflow (ali `actions_run_trigger` / `gh workflow run stran.yml --ref main`).
- Stanje ob 22:40Z: zadnji uspešen zagon je 2133 (22:23Z); 2134 in 2135 (22:32Z) sta padla pri objavi (»Deployment request failed … due to in progress deployment. Please cancel 668dcc7e… first or wait for it to complete«). `beta/494/` je iz 7b1985e2.

**DOMNEVE**
- Številke poskusa veljajo za nadomestek (Gaussove grbine prek `def.bumps`, brez prečnih nagibov); pravi relief bo dal druge vrednosti, občutljivi testi pa bodo isti.
- Lokalno trajanje brskalniških testov čez vse proge je izračun `SECS` × 2–2,5 (`tests/run.js:196`): (a) ≈ 1,5–2 h, cela veja ≈ 4,5–5,5 h. Izmerjeni so le world in perf za Killar ter browser/repro (113 s proti 71 s na GitHubu).
- Zataknjena objava Pages se verjetno sprosti sama. Vzrok padca `tests/lestvica.test.js` pri Hakoneju (meja za 2 kroga, `:109`, referenčna dirka očitno 1 krog) je branje kode; sam padec je preverjen.
- `tools/killar-skala.mjs --check` z grbinami FAIL (1,80 in 2,10 m, meja 0,3 m) je meritev agenta za izris (`izris-skala-zmerno.txt`, `izris-skala-mocno.txt` v isti scratch mapi); sam je nisem pognal.

**Tveganja**
1. Pravilo #615: relief je skladen samo kot podatek proge z obstoječo fiziko; nova sila prečnega nagiba ali vzmetenja v `js/core.js` je fizika vožnje. Dokaz za druge proge: poln `node tests/golden.test.js` (246 s, 161 scenarijev drugih pravih prog »identical«), races na GitHubu, za 30 testnih prog (testi jih preskočijo) `node $S/testi-hy-vse.js` pred in po (7 s; 54 prog: hy, grade, curv, klici sovoznika).
2. v. 125 (≤ 6 padcev) je kaotičen: 3 od 9 različic reliefa padejo (9, 12, 9 padcev), tudi najšibkejša; tekmeci reliefa ne poznajo. Relief bo treba uglaševati ob tem testu.
3. v. 31 (`gmax < 0.09`) pade pri vsakem drobnem reliefu (9,1 % že pri 9 cm): meriti na osnovnem profilu (jakost 0) in popraviti besedila o 8,5 %.
4. Reference: `--update --only=killar` izbriše ključe zamrznjenih testnih prog (prenos ključev zgoraj). `golden --update` je zavrnjen, dokler trčni scenariji ne razbijejo polja; `CRASH_AT` je v skupni datoteki, spreminjaj samo ključe `killar/…` (lm je že zdaj na meji z loose 1).
5. Sovoznik: z `def.bumps` pade sovoznik-glas, samo z višinami kliče »big jump« na ±0,3 m. Sprememba `paceNotes` ne sme spremeniti drugih 13 cest (`tests/sovoznik.test.js`, stolpec notes v `testi-hy-vse.js`).
6. Medalje: +2,0 s pri k = 1 je zunaj ±1,5 s; z novimi časi še `docs/proge/killar.md:8,16`. Lestvica: Killarjev zmagovalec mora ostati < 145 s (meja 50,8 s; `tests/lestvica.test.js:113–114`).
7. Skala: nova črta `rock` (`js/tracks/killar.js:60`) bi premaknila zid skale, to je področje trkov druge seje; `tools/killar-skala.mjs --check` ne teče v nobenem testu.
8. `tests/lestvica.test.js` pade že na 8fe4f131 (hakone 727–823 s proti meji 776,0 s): Node posel PR #494 bo rdeč neodvisno od Killarja.
9. Determinizem: testi zamenjajo `Math.random` s `seeded()` (`tests/lib/sim.js:12,15`); relief ob gradnji `Track` naj uporabi lasten generator s stalnim semenom (`rng(seed)`, `js/core.js:15`, kot `_buildPuddles`, `:955`).
10. Objava predogleda trenutno pada; po potisku preveri izid zagona »Stran«.

**Odprto**
- Ali relief (drugačni časi na Killarju, morda prečni nagib) sodi pod izjemo od pravila #615: vprašanje za uporabnika. Ure njegove prošnje za relief glede na 23.05 ne poznam.
- Mehanizem: obstoječi `def.bumps` (sovoznik in luže ga berejo) ali novo polje, privzeto izklopljeno (sovoznik bere višine). Od tega je odvisno, kateri testi padejo.
- Ali se smeta spremeniti preverjanji v. 31 in v. 125 ter številke v `docs/proge/killar.md:5,16,22`.
- Preverjanje »jakost 0 = bit za bitom kot zdaj«: prstni odtisi zdaj `T.hy` 47d46842db7f7c68, `T.grade` eec04d852eda99bd, `T.curv` fd1c5683b706a02c (sha256 nad Float64, N 2375; `testi-hy-hash.js`), poleg nespremenjenih referenc killar pri jakosti 0. Prečnega nagiba ne preverja noben test.
- Mokro srebro 140 proti pravilu 139: pustiti ali poravnati ob novih medaljah.
- Lokalno nepognano: polni browser/gfx, menu, ljudje; `tests/vrsic.test.js` ob spremembi `js/world-vrsic.js`.

Pomožne datoteke (vse v scratch, nič v repozitoriju):
- tools/killar-cesta-prototip/testi-prenesi-kljuce.js
- tools/killar-cesta-prototip/testi-osnova.js
- tools/killar-cesta-prototip/testi-hy-vse.js
- tools/killar-cesta-prototip/testi-hy-vse.8fe4f131.txt
- tools/killar-cesta-prototip/testi-hy-hash.js
- tools/killar-cesta-prototip/testi-grbine.js
- tools/killar-cesta-prototip/testi-grbine2.js