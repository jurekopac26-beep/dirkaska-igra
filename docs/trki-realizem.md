# Trki: bolj realistični trki (načrt teme)

Naloga uporabnika (9. 11. 2026 ob ~21.25): »Ultracode naj analizera fiziko trkov in naj proba ozboljsat da so trki bolj realisticni.« Veja `trki/realizem`, račun jure.kopac26, seja session_01Ck3D3QcbmTexhh4jfgmWRV (posreduje Matej).

## Okvir

- Izboljšave pridejo kot **nova različica** v Nastavitvah »Trki med avti« (delovno ime »Realistična«), da uporabnik v pavzi na istem mestu primerja staro in novo. Privzeta ostane Simulacija, dokler uporabnik ne potrdi.
- Kar ne spada v različico (zidovi, boksi), je preklopljivo z isto izbiro.
- Poškodbe ostanejo privzeto »Samo videz«; vožnja zunaj trkov se ne spremeni; dirka s prijatelji ostane usklajena; obremenitev telefona se ne poveča (`tests/golden/perf.json`).
- Na `main` gre šele po uporabnikovem »ok« (preizkus na predogledu).
- **Samo fizika trkov** (odločitev uporabnika 9. 11. 2026 ob ~23.05: »fiziko voznje ne spreminjaj, ker je dobra, samo fiziko trkov«): oprijem, pnevmatike, zaviranje, pospeševanje, krmiljenje, vzmetenje, zdrs, robniki, trava, aerodinamika in vožnja tekmecev ostanejo, kot so. Avto, ki se ničesar ne dotakne, vozi do številke enako kot na `main`. Vse novo se sproži samo ob stiku in samo pri novi različici; brez stika teče ista koda. Dokaz: test vožnje brez stika (Simulacija proti novi različici, enako stanje do zadnje številke) in nespremenjene reference vožnje.
- **Odločitev uporabnika 2. 11. 2026** (`docs/igra.md`, »Trki med avti«; `docs/nova-fizika-meritve.md`, razdelek 8): zadeti avto ni 8× težji, odboj ni 0 (slog »Realističen, težak« in gumb »brez odboja« sta bila takrat odstranjena); zid v različicah 1–5 ostane enak, sprememba zidu je samo v novi različici. Delovno ime »Realistična« je blizu odstranjenemu slogu: ime izbere uporabnik (predlogi: »Realistična«, »Fizikalna«, »Resnični trk«).
- **Druge teme, v katere ta ne posega** (pregled podvajanja 9. 11., Matej): poškodbe (paket P, biketraveler; `carKnockFx` naj še naprej daje `imp`, `fxCar` in točko stika, ki jih bereta P4 in P6), tresenje kamere ob trku (I5), Dež in sneg, hitrost tekmecev (#605), AI ob prehitevanju (#527). #548 (zbirna B, #579) bere moč sunka v pragih `WRULE.hit` 0,02 in `KT.real` 0,006: po spoju `main` oba preveri na novi različici. Seja tovornjakov gradi trke dolgih vozil na tej veji.
- **#494 (Killar) gre na `main` pred to temo**: sunek zidu seli v notranjo `touch()` v `wallCollide(c, trk, canFall, rc)` in doda krhko leseno ograjo (`fenceBreak`), skalo in padec z roba. Spremembo zidu piši v obliki, ki se zlije s `touch()`; spor razreši v korist #494; lesena ograja ostane krhka tudi v novi različici. Po spoju preveri krhko ograjo, skalo, padec z roba in zid 15–90°.
- **Svetovna lestvica** (`docs/svetovna-lestvica.md`): ključ rekorda nima različice trkov. Nova različica časov brez stika ne spremeni; čase s stikom z zidom spremeni. Naključja nova koda ne uvaja.
- **Slike ZDAJ/POTEM** za uporabnika: `tools/trki/slike.mjs` (isti trk, 4 sličice na stran, kamera za avtom, Spa); slike gredo v `docs/trki-slike/` na veji in se pred združitvijo odstranijo.

## Faze in stanje

| Faza | Kaj | Stanje |
|---|---|---|
| 1. Analiza | popis vseh stikov in meritve v jedru brez brskalnika (`tools/trki/`), primerjava z meritvami videov (`docs/nova-fizika-meritve.md`) in odprtimi viri | v delu (9. 11.) |
| 2. Zasnova | predlog za vsako odstopanje z meritvijo pred/po | čaka |
| 3. Izdelava | nova različica, preklopljivo z isto izbiro | čaka |
| 4. Preverjanje | testi z invarianti, neodvisen pregled `js/core.js`, `npm run test:related` | čaka |

## Odstopanja (izpolni analiza)

Tabela pride po fazi 1: razvrščena po tem, kaj igralec najbolj čuti, s številkami.
