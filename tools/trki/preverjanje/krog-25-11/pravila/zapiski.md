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
