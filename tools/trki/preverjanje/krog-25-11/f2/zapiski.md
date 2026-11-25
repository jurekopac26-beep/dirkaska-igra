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
