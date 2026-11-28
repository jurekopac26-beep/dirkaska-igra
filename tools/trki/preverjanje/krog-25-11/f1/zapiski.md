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

## Stanje 16.50 UTC (končna različica C+A; patch `fizika-1-3.patch` osvežen ob 16.46, 58 vrstic)

Izmerjeno (številke in ukazi: `meritve.md`):
- točke 1–5 naloge vse izmerjene z različico C+A;
- `tests/trki.test.js` 2 od 78 padeta, oba pojasnjena:
  - meja `sum(x => x.r.nK) >= 1000`: 1239 → 863 udarcev na stran, ker A ne šteje več 376 korakov brez sunka (`node test-a.js <drevo>`; `test-a-pred.log`, `test-a-po.log`);
  - `wall/85-120/real`: razlika od prvega dotika naprej največ 2,8e-14 (zaokrožitev; `node test-b.js <drevo> <izhod>`, `wall85-pred.txt`, `wall85-po.txt`);
- privzeta različica trkov (brez `setTest`) je cv 1: krasnahorka/crash 30 s pred = po = cv 1 (7674731e98a0eea9), zato se reference dirk s privzeto različico ne spremenijo;
- po dirkah: 15 od 32 enakih; konec igre se spremeni samo v krasnahorka/crash.

Teče (veriga4): `ROOT=po node energija.js 30` (energija ob sunkih v 32 dirkah), `SEED=11 node zid10.js` pred in po, `node energija.js 30` pred.

## Odprto (ni preverjeno)

- Zlate reference niso posodobljene; `tests/golden.test.js` in celoten krog nista tekla.
- Meja 1000 udarcev v `tests/trki.test.js` (vrstica 363) in opis »Robni primer brez sunka« v `docs/trki-realizem.md` (~1485) čakata naslednjo sejo.
- `wallRoom` za druge vogale upošteva samo robno ograjo (`br`, `bl`); razširitev pri boksih, mehki robovi, rob prepada, krožišča in konci odprte ceste niso posebej izmerjeni.
- 23 sunkov v zid11, ki so več kot 0,5 m od čiste črte ograje, ni pregledanih posamič (0 v vogalu brez dotika, 0 z nasprotnim zasukom).
- Zrcalo na ukrivljeni ograji ni izmerjeno posebej (p7 je na ravni).
- Igra prek mreže, prikolice, slike zdaj in potem: ni.
- Možnost, ki ni izmerjena: črto ograje upoštevati šele nad številskim pragom, da ravna ograja ostane do bita enaka (potem `wall/85-120/real` ostane).

## Stanje 16.56 UTC (zaključek)

- Veriga s semenom 11 ustavljena: `SEED` v `zid10.js` na dirke ne vpliva (iste številke kot seme 7); `zid10-pred-s11.log` je brez vrednosti.
- Drugi vzorec, 16 drugih prog (veriga 5, končana 16.52): korakov s škodo 90 → 85, škoda ograje 26,925 → 26,061, brez sunka 4 → 0, kolo 20 → 18, konec igre 20 → 18. 26 od 32 dirk enakih. izoard/crash in luanda/crash: konec igre da → ne, kolo pred popravkom odpade v trku z avtom po razhajanju dirke (`sled-proge2.log`).
- Energija pred (`node energija.js 30`): 356 klicev, 248 sunkov, 0 z rastjo. Po: 284 / 247 / 0.
- `NOA=1 node test-a.js <wt-f1>` (samo C): udarcev 1239 na stran, brez sunka 752, škoda 579,52 = enako kot pred. Padec meje 1000 v testu je samo zaradi A.
- Patch `fizika-1-3.patch` (C+A) je iz končnega drevesa (16.46); od takrat jedro ni spremenjeno. `meritve.md` dopolnjen.
- Ostane (naslednja seja): zlate reference, celoten krog, meja 1000 in preverjanje 13 v `tests/trki.test.js`, odstavek o robnem primeru v `docs/trki-realizem.md`, slike zdaj in potem.
- 16.57: sledi treh dirk z večjo škodo igralca (`sled-skoda.log`, `cusco-okno.log`): kotor in bathurst razhajanje dirke; cusco neposreden učinek C (prijemališče 0,457 → 0,636 m pred sredino, drugi udarec z zadnjim vogalom 5,9 → 9,7 m/s, škoda epizode 0,380 → 0,482). Za presojo naslednje seje, s slikami zdaj in potem.
- Glava veje je 9b2c787, `js/core.js` enak kot v 308f299: patch velja nespremenjen.
- 16.59: `ROOT=po node tocka.js 60`: prijemališče po starem in novem pravilu v istem stanju: 286 klicev ob robni ograji, različno nad 1 mm 67, nad 10 cm 51, nad 0,5 m 36; staro brez sunka in novo s sunkom 18, obratno 0; ročica obrnjena 9 od 237. C torej spremeni 23 % sunkov ob robni ograji, ne samo obeh najdb.
- Rezultat vrnjen ob 17.0x UTC; nič ni commitano, zlate reference in dokumenti nespremenjeni.
