# fizika-2: zapiski (drevo S/wt-f2, osnova 308f299)

## Stanje 16:2x UTC
- Najdba ponovljena na nespremenjenem drevesu: `cd S/f2 && TRACKS=rastro,vaoala,izoard,ujarras,kotor node start.js`
  -> prog 5 z oviro pred prvim dotikom 5; rastro 1,22 m, vaoala 0,337, izoard 0,22, ujarras 0,20, kotor 0,12 m; ovira od k=147.
- stuckT bere koda, enaka na main (rescue 3,5 s, redarji, game.js, misije, testi) -> nabiranja NE spreminjam, samo pogoj v aiHazard.
- Posnetki stanja (tests/lib/sim.js) zajamejo vsako navadno polje avta -> stanje »je že speljal« v WeakSet ob avtu (_hzGo, kot _aiS), ne na avtu.
- Poseg (js/core.js, 3 mesta, +6 -1): `const _hzGo = new WeakSet()` pri HZ; `if (c.speed >= HZ.vs) _hzGo.add(c)` v Race.step pri zaznavi obtičanja;
  pogoj `o.stuckT > HZ.st` -> `(o.stuckT > HZ.st && _hzGo.has(o))`.
- Ostane: točke 1-6, commit, patch.

## Stanje 16:26 UTC (poseg narejen v S/wt-f2/js/core.js, še brez commita)
- T1 `cd S/f2 && node start.js` (60 prog, 13 avtov, cv 6 proti main do prvega dotika): »prog 60 z oviro pred prvim dotikom 0 nabor race«, nobene vrstice RAZLIKA (prej 5 prog). Izpis: S/f2/start-po.txt
- T1b `TRACKS=<vseh 60> NAI=12 SECS=20 node sam.js` (8 polj stanja vseh avtov): RAZLIKA PRED DOTIKOM 0 (S/f2/sam13-po.txt); prej `F2ROOT=S/snap`: 5 (rastro k=160, izoard 150, kotor 148, ujarras 147, vaoala 147; S/f2/sam13-prej.txt)
- T2 `node sam2.js` (kotor): prva razlika k=307 = prvi dotik (strega#2.csKc, hitCar 5,07); prej k=147 pico#11.aiOffT
- T2b `node sam.js` (avto sam 60 s, 12 prog: spa hiva koli cusco seoul bathurst furka montreal killar pikes kotor sakhir): vseh 12 ENAKO 60 s (S/f2/sam-po.txt)
- Ostane: T6 regresijski test, T4 tests/trki.test.js, T3 pocez skoda/enakost, T5 golden, stamp, commit, patch.

## Stanje 16:31 UTC
- T6 regresijski test dodan v tests/trki.test.js (blok aiHazard): (a) »Realistična, the start: 13 cars from the grid (Rastro, Vaoala, Kotor) up to the first touch ...« (proti jedru brez klica aiHazard, do bita, do prvega dotika); (b) v seznam prizorov dodan ['cusco', 0] (avto, ki je vozil 9 s in obstoji vzdolž: ovira samo po stuckT).
  Dokaz: izrez bloka `python3 S/f2/izrez.py` -> S/f2/regres.js; `node regres.js` (novo jedro): OK: all 8 checks (S/f2/regres-po.txt);
  `GAME_ROOT=S/snap node regres.js` (staro jedro): FAIL: 1 of 8 checks: »rastro: the first touch 3.31 s, a hazard 1.23 s, parted 1.23 s; vaoala 3.38 s / 1.23 s / 1.23 s; kotor 2.57 s / 1.23 s / 1.23 s« (S/f2/regres-prej.txt); ostalih 7 preverb izpis enak.
- Obtičan avto pozneje ostane ovira enako: `YAW=0,90,180 node S/f2/vzdolz.js` (spa, cusco; cv 1, 5, 6) staro (GAME_ROOT=S/snap) in novo: vseh 18 izidov enakih na 3 decimalke (cusco yaw 0: viden s 122,316 m po 0,900 s, stuckT 0,900; brez dotika).
- T4 teče v ozadju: `node tests/trki.test.js` -> S/f2/trki-test.txt (začetek 16:31).
- Ostane: T3 pocez skoda/enakost, T5 golden, stamp, commit, patch.

## Stanje 16:36 UTC
- Točka 4: `node tests/trki.test.js` (S/wt-f2, enkrat): "OK: all 80 checks", IZHOD 0, 2 min 11 s (dnevnik f2/trki-test.txt).
- Točka 3a: `node tools/trki/pocez.js skoda cusco hiva tianmen --seeds 71,72 --secs 50` -> f2/pocez-skoda.txt; `diff` z S/pocez/izhodisce.txt: ENAKO (nobene razlike, tudi cv 6 igra).
- Točka 3b: `pocez.js enakost jezero toskana cusco hiva --seeds 71,72 --secs 90 --base S/snap` teče v ozadju -> f2/pocez-enakost.txt (.cas = čas in izhod).
- stamp --check OK (547), commit v S/wt-f2: 4d2b9532 (samo js/core.js +6 -1, tests/trki.test.js +15 -2), brez push.
- Popravek: f2/fizika-2.patch (format-patch -1).
- Zlate: samo trki.json ima /real (25), preverjeno v trki.test.js; sim.json in races.json tečeta v privzeti različici (KV_DEF 'sim'; aiHazard kliče samo krOn = KR), v njej se izvede samo _hzGo.add (nič ne piše na avto, brez naključnih števil). Ostane: izmeriti z golden.test.js / races.test.js brez --update, če bo čas.

## Stanje 16:39 UTC
- Točka 3b: `node tools/trki/pocez.js enakost jezero toskana cusco hiva --seeds 71,72 --secs 90 --base S/snap` (stara koda veje proti novi, cv 6): vseh 8 dirk "razhajanje nikoli" (jezero, toskana, hiva 90 s; cusco do cilja 33/34 s); hiva 71 prva nevarnost 47,15 s (14,8 m/s, 82°, škoda 31 %), po njej še vedno bitno enako. IZHOD 0, 3 min 30 s. Dnevnik f2/pocez-enakost.txt.
- Commit 4d2b9532 in f2/fizika-2.patch sta narejena (glej zgoraj).
- V ozadju veriga (f2/veriga.cas): races.test.js --only=rastro, golden.test.js --only=rastro, zamolk.js (60 prog, 40 s: kdaj _hzGo zamolči člen »obtičan«), races/golden --only=kotor. Brez --update.

## Stanje 16:41 UTC
- Zlate, vzorec (brez --update): `node tests/races.test.js --only=rastro`: "OK: all races fine (16 s)" (5/5); `GOLDEN_JOBS=1 node tests/golden.test.js --only=rastro`: "OK: all 7 scenarios identical (10 s)"; kotor teče.
- `node S/f2/zamolk.js` (nova koda, cv 6, 60 prog, 13 avtov, 40 s; instrumentirana kopija jedra v pomnilniku): pogoj _hzGo zamolči člen »obtičan« v 38 avto-korakih na 8 progah (tianmen, rastro, izoard, kotor, seoul, ujarras, canaries, vaoala), vse med 1,23 in 1,60 s po štartu, vse pred prvim dotikom; po prvem dotiku 0; avtov, ki nikoli ne dosežejo 3 m/s: 0 od 780; korakov z vidno oviro v 40 s skupaj 14384 (kotor 3900, canaries 375). Dnevnik f2/zamolk.txt.
- V ozadju (f2/veriga2.cas): celoten golden.test.js (GOLDEN_JOBS=1, 504 scen) in nato races.test.js (360 dirk), oboje brez --update -> f2/zlate-golden-vse.txt, f2/zlate-races-vse.txt. Ob ~17:10 preberi, kar je, in vrni.

## 16:46 UTC
- Veja trki/realizem je medtem na 9b2c787; js/core.js tam enak kot na 308f299 (git hash-object 37880a61 oba), razlika samo docs/trki-realizem.md (+25 −1) in nove datoteke; merge-tree 9b2c787 + 4d2b953 brez sporov.
- Commit 4d2b953 preverjen: drevo čisto, fizika-2.patch = format-patch -1 HEAD (cmp enako).
- Zlate v ozadju: golden.test.js (vseh 504, brez --update) teče od 16:41:25, ob 16:44:31 118/504 OK; za njim races --only=vaoala, izoard, ujarras (vsaka svoj dnevnik zlate-races-<proga>.txt), nato races vse (zlate-races-vse.txt); stanje v veriga2.cas.
- Ostane: prebrati izid, ustaviti svoje procese, vrniti StructuredOutput do ~17:10.

## 16:52 UTC – robni primer: avto, ki ob štartu sploh ne spelje (izmerjeno)
- `cd f2 && node spi.js` (igralec brez plina na 4. štartnem mestu, 12 tekmecev, 8 s; dnevnik spi-b.txt): stara veja cv 6: oviro vidi 9 tekmecev od 0,83 s (hiva 5), dotik igralca spa 5,94 s, hiva 4,53 s, jezero 6,17 s, cusco in kotor nikoli (tam 4 od 12 tekmecev po 8 s še stojijo za njim). Po popravku (4d2b953): kot main, dotik igralca spa 4,25 s (main 4,25), cusco 3,33 (3,33), hiva 3,49 (3,49), kotor 4,35 (4,29), jezero 4,71 (4,57); rastro v vseh treh enako (4,48 s).
- To je posledica navodila »je že speljal«: avto, ki nikoli ne doseže 3 m/s, ni »obtičan«. V igri ni ugasnjenega motorja na štartu (grep stall: 0), torej zadeva samo igralca, ki ne spelje ali zamudi več kot 0,8 s, in avto, ki ga zadenejo med speljevanjem.
- Možnost B (NI v commitu, samo izmerjena v pomnilniku, loadInst): v js/core.js 5098 `_hzGo.has(o)` -> `(_hzGo.has(o) || !(o.inThr > 0))` (še ni speljal, a tudi ni na plinu = obtičan). spi.js: B do števke enak stari veji na vseh 6 progah (dnevnik spi-b.txt). `node zamolk2.js` (60 prog, 4 s; zamolk2.txt): od 38 zamolčanih avto-korakov 0 brez plina (najmanjši plin 0,80), torej je B v 60 izmerjenih štartih enak popravku. Tveganje B: tekmec, ki v gneči pred prvim dotikom spusti plin in še ni dosegel 3 m/s, bi bil spet ovira (v 60 štartih 0-krat, drugje ni merjeno); testi, pocez in trki.test.js na B niso tekli. Odločitev prepuščena glavni seji (najprej odločitev, nato koda).

## 16:59 UTC – zlate in dodatni nabori štarta (vse na 4d2b953)
- sim.json: `GOLDEN_JOBS=1 node tests/golden.test.js` (brez --update, vseh 504): »OK: all 504 scenarios identical (737 s)« (zlate-golden-vse.txt).
- races.json: `node tests/races.test.js --only=<proga>` za vseh 8 prog, kjer pogoj ob štartu sploh kaj zamolči (rastro, kotor, vaoala, izoard, ujarras, seoul, tianmen, canaries): 8 × »OK: all races fine«, 40/40 dirk (zlate-races-<proga>.txt). Celoten tek (360) teče od 16:59 z omejitvijo 400 s (zlate-races-vse.txt), izid races-vse2 v veriga2.cas; prvi poskus prekinjen pri 7/360 OK.
- trki.json: preverja jo `node tests/trki.test.js` (80/80). `npm run golden:update` NI tekel (world, perf v brskalniku); nobena zlata datoteka se ne spremeni, ni česa posodobiti.
- Štart še v drugih naborih (`SET=<nabor> node start.js`, cv 6 proti main do prvega dotika): upg prej 2 progi z oviro (seoul 0,689 m, ujarras 0,018 m, od k=144), zdaj 0 od 60; demo prej 0, zdaj 0 od 65; formula zdaj 0 od 60; lm zdaj 0 od 60 (start-prej-upg.txt, start-po-upg.txt, start-prej-demo.txt, start-po-demo.txt, start-po-formula.txt, start-po-lm.txt).
- Drevo wt-f2 čisto, HEAD 4d2b953; nič potisnjeno.
## Datoteke (16:59)
- $S/f2/fizika-2.patch
- $S/f2/izrez.py
- $S/f2/lib.js
- $S/f2/pocez-enakost.cas
- $S/f2/pocez-enakost.err
- $S/f2/pocez-enakost.txt
- $S/f2/pocez-skoda.cas
- $S/f2/pocez-skoda.err
- $S/f2/pocez-skoda.txt
- $S/f2/regres-po.txt
- $S/f2/regres-prej.txt
- $S/f2/regres.js
- $S/f2/sam-po.txt
- $S/f2/sam.js
- $S/f2/sam13-po.txt
- $S/f2/sam13-prej.txt
- $S/f2/sam2.js
- $S/f2/spi-b.txt
- $S/f2/spi.js
- $S/f2/spi.txt
- $S/f2/start-po-demo.err
- $S/f2/start-po-demo.txt
- $S/f2/start-po-formula.err
- $S/f2/start-po-formula.txt
- $S/f2/start-po-lm.err
- $S/f2/start-po-lm.txt
- $S/f2/start-po-upg.err
- $S/f2/start-po-upg.txt
- $S/f2/start-po.txt
- $S/f2/start-prej-demo.err
- $S/f2/start-prej-demo.txt
- $S/f2/start-prej-upg.err
- $S/f2/start-prej-upg.txt
- $S/f2/start.js
- $S/f2/trki-test.txt
- $S/f2/veriga.cas
- $S/f2/veriga2.cas
- $S/f2/vzdolz.js
- $S/f2/zamolk.js
- $S/f2/zamolk.txt
- $S/f2/zamolk2.js
- $S/f2/zamolk2.txt
- $S/f2/zapiski.md
- $S/f2/zlate-golden-kotor.txt
- $S/f2/zlate-golden-rastro.txt
- $S/f2/zlate-golden-vse.txt
- $S/f2/zlate-races-canaries.txt
- $S/f2/zlate-races-izoard.txt
- $S/f2/zlate-races-kotor.txt
- $S/f2/zlate-races-rastro.txt
- $S/f2/zlate-races-seoul.txt
- $S/f2/zlate-races-tianmen.txt
- $S/f2/zlate-races-ujarras.txt
- $S/f2/zlate-races-vaoala.txt
- $S/f2/zlate-races-vse.txt
