# Zapiski f1 (fizika-1, fizika-3), rok 17:20 UTC

start 16:18 UTC. Drevo: wt-f1 (308f299 + popravek, brez commita). Patch: f1/fizika-1-3.patch (git diff, 16:25).

## Popravek (js/core.js, wt-f1)
- wallRoom (nova, pred wallR): prostor vsakega vogala do crte robne ograje (Track.query / queryRoute), stran po vogalu k; null, ce k ni na crti (toleranca KC.wall.cr0), free/unf, stranska cesta.
- wallR(…, trk): globina drugih vogalov iz wallRoom (sicer po starem); vrne 1 (sunek) / 0 (brez).
- touch: hit (udarec, skoda) samo, ce je wallR dal sunek (moznost A).
- samo pod krOn (cv 6); cv 1 te poti ne doseze.

## Izmerjeno do 16:28
- `K0=1054 NN=5 node zid9.js` (pred): k 1054 tockaSunka [-1.086,0.495], nato 1055–1059 BREZ SUNKA, skoda 0.562 → 0.811 (kot v najdbi).
- `ROOT=po K0=1054 NN=5 node zid9.js`: v oknu en sam dotik (k 1057), tockaSunka [-0.004,0.495], sunek; brez korakov brez sunka.
- `node tools/trki/zid.js --cv 6 --del matrika --json`: pred (snap) in po (wt-f1) do bajta enaka (cmp). Stevci (inst.js): 908 klicev wallR, vsi z vogalom, po: vseh 908 po crti ograje, najvecja razlika globine 1.8e-15 m; brez sunka 0 / 0.

## Tece / ostane
- zid10 (pred, po, po samo B, po samo A) v ozadju → zid10-*.log
- zid11, zid12, p7/p6/p13, testa, cv 1 enak, brez dotika enak main

## Stanje 16:38 UTC

- **Različica patcha zamenjana B → C** (16:37): globina drugih vogalov = plitvejša od (ravna črta skozi vogal k, dejanska črta ograje pri tem vogalu).
  Razlog: B je spremenil vožnjo po ograji na zunanji ograji ovinka (`p6.js` R 60 m asfalt cs: udarcev 5 → 25, škoda 14 → 58 %, čas 15,74 → 16,06 s);
  C pusti `p6.js` in `p6.js x 30` bajt za bajtom enaka kot prej. Patch B je shranjen: `f1/fizika-1-3-B.patch`, njegove meritve v `f1/B/` in spodaj.
- Izmerjeno z B+A (zgodovina): zid10 32 dirk pred 199 korakov/46 brez sunka/16 koles/16 koncev; B+A 143/0/16/16; samo B 146/3/16/16; samo A 155/0/15/15.
  zid11 pred 363 ob robni ograji/138 > 0,5 m drugje/38 vogal brez dotika/66 nasprotni zasuk (= najdba); B+A 291/2/0/0.
  krasnahorka/crash B+A: konec igre ostane (s 358), a zaradi naleta tekmecev od zadaj (hitCar 13,5 in 16,3 m/s, `sled.js`), ne zaradi ograje.
- Izmerjeno s C+A: `p6.js`, `p6.js x 30` enaka pred; krasnahorka/crash: konecIgre false, koles 0, s 2094,124 (pred: koloK 1058, konec, s 304);
  mombasa/formula k 1327: prijemališče [1.43,-0.539] (vogal, ki se dotika).
- Teče veriga (`veriga3.log`): zid10 po (C+A, LINES=1) → zid11 po → tests/trki.test.js → tests/poskodbe.test.js → zid10 pred LINES=1 → zid10 po NOA=1.
- Ostane: zid.js matrika po (C), p7, p13 po (C), zid9, zid12, enako.js (cv 1 enak, brez dotika enak main), meritve.md, patch.
