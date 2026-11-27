# fizika-2: popravek uveljavljen (27. 11.), ponovljene meritve pred in po

Drevesa: **pred** = 84d5950 (veja z uveljavljenima fizika-1 in fizika-3, brez tega popravka), **po** = c727c8d (popravek v `js/core.js` in test), **main** = a8cde61. Skripte: `../../krog-25-11/f2/` (`lib.js`: `TRKI_F2=<drevo, ki se meri>`, `TRKI_MAIN=<drevo main>`; `spi.js`: `TRKI_SNAP=<pred>`, `TRKI_F2=<po>`), `../../krog-25-11/voznja/` (13 avtov, sam avto) in `tools/trki/pocez.js`; verigo požene `veriga.sh <pred|po> <drevo> <drevo main>` v tej mapi. Dnevniki `<meritev>-pred.log` in `<meritev>-po.log`; `veriga-*.stanje`: izhodne kode verige (vse 0). `regres-pred.log` ima izhodno kodo 1 namenoma: staro jedro novega preverjanja ne prestane.

## Kaj je uveljavljeno (c727c8d, samo Realistična, cv 6)

- Možnost **A** iz kroga 25. 11. (`f2/fizika-2.patch`, nanesla se je brez sprememb): avto, ki od štarta še ni dosegel `HZ.vs` (3 m/s), za tekmece ni »obtičana ovira«. `_hzGo` (WeakSet ob avtu) si zapomni, da je avto enkrat peljal; v `aiHazard` velja `o.stuckT > HZ.st && _hzGo.has(o)`.
- Izpadel avto in avto, obrnjen proti smeri vožnje, sta ovira kot prej; avto, ki obtiči potem, ko je že peljal, tudi (`vzdolz-pred.log` in `vzdolz-po.log` sta enaka do bajta).
- Vožnja ni spremenjena: drugačno je samo to, kdaj tekmeci avto pred sabo vidijo kot oviro. Stara različica trkov (cv 1) funkcije ne kliče.
- Testi: `tests/trki.test.js` 80/80 (novo preverjanje štarta: do prvega dotika nihče ne vidi ovire), `tests/poskodbe.test.js` 14/14.

## Merilo

Za to najdbo ni vira iz resničnih trkov; merilo je trdo pravilo veje: **dokler se nihče ničesar ne dotakne, polje vozi do števke enako kot na `main`**. Pred popravkom ga je veja kršila ob štartu: avto, ki po zeleni luči še spelje (hitrost pod 3 m/s dlje kot 0,8 s), je veljal za oviro, tekmeci za njim so zavirali.

## Ponovljene meritve na končni kodi (številke 25. 11. se ponovijo)

| meritev | pred | po |
|---|---|---|
| štart 13 avtov do prvega dotika, nabor `race`, 60 prog (`start.js`): prog z oviro pred prvim dotikom | 5 (rastro od 1,23 s, 105 avto-korakov, odmik od `main` do 1,22 m; vaoala 0,337 m; izoard 0,22 m; ujarras 0,20 m; kotor 0,12 m) | 0 |
| enako, nabor `upg`, 60 prog | 2 (seoul od 1,20 s, 0,689 m; ujarras 0,018 m) | 0 |
| enako, nabori `demo` (65 prog), `formula` (60), `lm` (60) | 0, 0, 0 | 0, 0, 0 |
| 13 avtov, 20 s, 65 prog proti `main` (`voznja/cmp.js`): razlika **pred** prvim dotikom | 5 prog (rastro, izoard, kotor, ujarras, vaoala; korak 147–160 = 1,23–1,33 s) | 0 |
| enako: prog brez razlike / z razliko po prvem dotiku | 6 / 54 | 6 / 59 |
| sam avto, 60 s, 65 prog proti `main` | 65 od 65 enakih | 65 od 65 enakih |
| dež, zima, zima + dež, spremenljivo vreme z gumami; 20 prog, 90 s, 120 voženj (`m1-f2.sh`): razlik od `main` pred prvim dotikom | 61 (dež 25 od 40, zima 19 od 40, zima + dež 16 od 20, spremenljivo 1 od 20; korak 124–178 = 1,03–1,48 s) | 0 |
| regresijsko preverjanje iz popravka (`regres.js`, 8 preverjanj) | 7 od 8 (štart: ovira pred prvim dotikom) | 8 od 8 |
| avto, ki je peljal in nato stoji vzdolž ceste (`vzdolz.js`; spa in cusco, zasuk 0°, 90°, 180°) | ostane ovira | enako do bajta |
| `pocez.js enakost` (6 prog × semena 71–73, cela dirka 13 avtov v obeh jedrih) | ni teklo | 18 od 18 OK |
| `pocez.js skoda` (avto počez 400 m pred vodilnim; cusco, tianmen, hiva, spa × 3 semena) | vse vožnje skupaj: ? | enako do bajta |
| `tests/golden.test.js` brez `--update` | ni teklo (25. 11.: 504 od 504) | 504 od 504 enakih |
| `tests/races.test.js` brez `--update` | ni teklo (25. 11.: 112 od 360, tek ustavljen) | 360 od 360 enakih |

**Kaj pogoj zamolči** (`zamolk.js`, drevo po; 60 prog, 40 s, nabor `race`): člen »obtičan« je zamolčan v 38 avto-korakih na 8 progah (tianmen 4, seoul 5, ujarras 4, canaries 2, vaoala 6 …), vsi 1,23–1,60 s po štartu, **po prvem dotiku nikoli**. Avtov, ki v 40 s nikoli ne dosežejo 3 m/s: 0. Korakov z vidno oviro skupaj 14 233.

## Kaj je po popravku drugače v drugo smer

Avto, ki ob štartu **sploh ne spelje**, za tekmece ni več ovira, kot na `main`. Izmerjeno z igralcem brez plina na 4. štartnem mestu, 12 tekmecev, 8 s (`spi.log`; »vidi« = tekmecev, ki so igralca kdaj imeli za oviro):

| proga | pred: prvi dotik igralca / vidi / v vožnji po 8 s | po | možnost B | `main` |
|---|---|---|---|---|
| spa | 5,94 s / 9 od 0,83 s / 12 od 12 | 4,25 s / 4 od 4,72 s / 12 od 12 | kot pred | 4,25 s / 0 / 12 od 12 |
| cusco | nikoli / 9 od 0,83 s / **8 od 12** | 3,33 s / 0 / 12 od 12 | kot pred | 3,33 s / 0 / 12 od 12 |
| rastro | 4,48 s / 1 od 1,24 s / 12 od 12 | 4,48 s / 0 / 12 od 12 | kot pred | 4,48 s / 0 / 12 od 12 |
| kotor | nikoli / 9 od 0,83 s / **8 od 12** | 4,35 s / 2 od 3,67 s / 12 od 12 | kot pred | 4,29 s / 0 / 10 od 12 |
| hiva | 4,53 s / 5 od 0,83 s / 12 od 12 | 3,49 s / 0 / 12 od 12 | kot pred | 3,49 s / 0 / 12 od 12 |
| jezero | 6,17 s / 9 od 0,83 s / 12 od 12 | 4,71 s / 3 od 3,60 s / 12 od 12 | kot pred | 4,57 s / 0 / 12 od 12 |

- Slabše: igralca, ki ne spelje, tekmeci zadenejo prej (3,3–4,7 s namesto 4,5–6,2 s ali nikoli), na petih od šestih prog.
- Boljše: nihče ne obstane za njim (cusco in kotor: prej 4 od 12 tekmecev po 8 s stojijo, zdaj vsi vozijo).
- Ko je igralec zadet, je spet ovira (»vidi« od 3,6–4,7 s): po dotiku velja ista pot kot prej.

**Možnost B** (`../../krog-25-11/f2/moznost-b.diff`; `_hzGo.has(o) || !(o.inThr > 0)`: avto, ki še ni speljal in ni na plinu, ostane ovira) ni uveljavljena. O njej odloča uporabnik: kartica `trki-fizika-2-27-11` na strani Odločitve, privzeto 1 = stanje veje.

## Česa ta krog ni izmeril

- Možnost B na končni kodi: samo `spi.js` (zgornja tabela); `golden`, `races`, nabori `demo`, `formula`, `lm` in sam avto na B niso tekli (kot 25. 11.).
- Štart z drugim semenom, s 6 ali 20 avti, na odprti cesti z letečim štartom, v igri prek spleta.
- Tekmec, ki ob štartu ne spelje zaradi okvare ali kazni (v 60 štartih ga ni bilo: avtov, ki ne dosežejo 3 m/s, je 0).
- Testi v brskalniku in `npm run test:related` po tem popravku (tečejo enkrat, ob koncu koraka ali v zbirnem krogu).
