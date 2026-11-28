# Pogled »Pravila dirke in posledice trkov« — zapiski (podagent, rok 17:15 UTC)
16:22 UTC: branje končano (core.diff, retire/_wreckStep/_progressOpen/wheelRule, game.js 2565). Izmerjeno: še nič.
Hipoteze za meritev: (a) kolo tik pred ciljem (krog, odprta cesta), (b) motor P2.3 ob cilju, (c) _progressOpen dva avta v istem koraku,
(d) retireBlocked/retireControl, (e) rescue hz.off, (f) TX.tf zunaj Realistične / prijatelj, (g) TX.deb 0, F4/F5/K3, (h) lang.js, (i) #834 samo risanje, (j) poti pravila kolesa.

## Stanje 16:3x UTC (izmerjeno)
- a1.js (kolo tik pred ciljem, jezero, sokol, wheelRule, damage 2): `node a1.js snap jezero 6` -> kolo odtrgano 2/10/30/60 korakov pred ciljem: finished true pos 1 dnf false rule.over false (kFin-kHit 3/12/55/226); 120/240/480 korakov: finished false dnf true rule.over true. `node a1.js main jezero 0`: enak vzorec (3/13/58/229) -> obstaja ze na main.
- lang1.js: novih nizov 95, 77 "brez EN" so vsi odlomki angleskih komentarjev (naiven regex); novih kljucev EN 34, vsi v rabi. Ni manjkajocega prevoda.
- d1.js retire (jezero, koli; seme 9; cv 6; 13 avtov): izlocenih 12, brez mirovanja 0, max cas do mirovanja 11.0 s / 4.1 s, nazaj na asfalt 0, premik po mirovanju > 1 m 0, finished med izlocenimi 0, krog po izlocitvi 0, brez NaN, igralec 1., estimateResults 13 vnosov, 12 dnf, brez podvojenih.
- d1.js wreck (jezero): C.wreckCar na tekmecih ne izloci (izlocenih 0) - znano (vrnjena kolesa redarjev), ne porocaj.
## Ostane
- odprta cesta: kolo tik pred ciljem (a1 koli); _progressOpen dva avta v istem koraku; sweep vseh modelov; boksi (spa); TX.tf pri cv != 6; TX.deb 0; F4 enkratno placilo; #834 samo risanje.

## Stanje 16:35 UTC (izmerjeno)
- a1 odprta cesta: `node a1.js snap koli 6` -> 2/10/30 korakov pred ciljem finished true pos 1 rule.over false; 60+ korakov dnf true rule.over true (a1-koli-snap.log).
- e2.js (igralec pocez na cesti pred poljem, koli, seme 9): SNAP cv 6: 12/12 tekmecev v cilju, 0 vrnitev redarjev, 0 s stanja, NaN 0, zunaj ograje 0; igralec zadet pri 10.2 s, nL 1, rule.over true. MAIN cv 0: 12/12, 3 vrnitve, vec avtov 3 s stoji. Veja ni slabsa. (e2.log)
- tf1.js (chapman, dvoboj s prometom, odmik -2.5): cv 0 in cv 5: tf null/1/2 enak hash (brez vpliva); cv 6: tf null = tf 1 (ni tovornjaka pri 120), tf 2 drugacen. (tf1.log)

## Dopolnitev 16:45 UTC
- w1.js (jezero, cv 6, vseh 56 modelov, pravilo koles): eno kolo / udarec / wreckCar 56/56 `over true dnf true`; štiri kolesa 45/45 (11 starih modelov nima zadnjih koles kot delov: izjema je moja napačna raba detachPart, w2.js); max 4,6 s do konca; brez NaN.
- p1.js (kagerod, izločitev v fazah boksov lane/stop/repair/done): veja in main: vsi mirujejo, nič na asfalt zunaj boksov, popravila drugih tečejo, NaN/izjeme 0. Razlika: izločen v 'repair' se na veji odpelje ~20 m iz boksa (premik 23.8 m), main obstane (0.0 m). Samo z neposrednim r.retire(c).
- w4.js (tekmeci izgubijo kolo po poti škode, applyDamage): kagerod, lisica, 2 kroga, brez gum: 8 tekmecev wheelFL nL 1, dnf false, redarji 0, boksi 0, vsi v cilju (veja mesta 4/8/9/5/10/11/12/13; main 4/7/9/6/10/12/11/13).
- w4 4 krogi z gumami (tyres): 4 tekmeci po izgubi kolesa zavijejo v bokse (t 81-156), nL po popravilu 0, vsi v cilju.
- be69def (#834): samo render.js; grep pisanj v stanje avta v dodanih vrsticah = 0.

## Dopolnitev 16:49 UTC (w4, prava nastavitev igre: game.js 2563 `tyres: !tt && !!track.def.pit`)
- Brez pravila gum (v igri na progi z boksi se ne zgodi): tekmec s kolesom manj nikoli ne zavije v bokse (7954 `dmg > 0.45` teče samo ob gumah), 4 krogi na treh kolesih, uvrščen; enako main.
- Z gumami, 2 kroga, udarec t 8: 6/6 v bokse (t 80-159), nL po popravilu 0, vsi v cilju.
- Z gumami, 2 kroga, udarec t 80 (zadnji krog): 3/6 v bokse, 3/6 brez postanka konča krog na treh kolesih: nL 1, dnf false, finished true, mesto 7/9/10 od 13 (26 m/s proti 33 m/s).
- canRetire v game.js ni funkcija z imenom `function canRetire` (grep prazen); poti igralca do izločitve v 'repair' nisem preveril.

## Dopolnitev 16:52 UTC (zadnje meritve pred oddajo)
- w4 kagerod 9 lisica 2 kroga z gumami, udarec t 80 (zadnji krog): veja 3/6 brez postanka na treh kolesih v cilju (mesto 7/9/10), main enako (5/7/9); kagerod 5 jelen (veja): mesta 8/3/6.
- w4 jezero 9 lisica (brez boksov), 8 tekmecev hkrati ob kolo: redarji 1 na avto, nL 0, vsi v cilju, NaN 0; veja in main enako.
- w4 main jezero 9 (staro polje): enako kot veja (škoda 1,00, brez odtrganih koles, tempo nespremenjen) -> obstoječe.
- f4.js (cv 6; sokol, truck, lisica x hood, mirrorL x 8/20/60 m/s x zdrs 0/0,12 rad x odmik 0-1,8 m): 1332 prehodov, 784 plačanih enkrat, več kot enkrat 0, NaN 0.
- tests/debris.test.js na posnetku 12/12; tests/cilj-odprte-ceste.test.js 7/7.
- canRetire (game.js 5136) nima pogoja za bokse: igralec s škodo >= 0,98 lahko odstopi med popravilom (branje, ni izmerjeno).
- Oddaja: pravila-1 (srednja, zadnji krog na treh kolesih), pravila-2 (nizka, kolo 0,5 s pred ciljem), pravila-3 (nizka, izločen v 'repair' zapelje iz boksa).
