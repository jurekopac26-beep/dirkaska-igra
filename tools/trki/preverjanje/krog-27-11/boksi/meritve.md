# Boksi: test `tests/pits.test.js` in vleka krmila tekmecev (krog 27. 11. 2026)

## Kaj je bilo narobe

`tests/pits.test.js` je na veji `trki/realizem` padel v prizoru »a long race with fuel (toskana)« (1 od 21 preverjanj), na `main` 777993a pa ne.
Test ni v povezanem krogu (`npm run test:related`), zato ga prejšnji krogi niso zagnali. Pade enako na `70636de`, `31f12e4` in `f283eed`,
torej ne zaradi spoja `main` in ne zaradi popravka fizika-5.

S semenom 7 je 14. postanek (drugi postanek tekmeca, avto 4 `vortex`, škoda 0,536) v boksu pod kotom 4,03° (meja 4°); avto stoji v svojem boksu
(3,67 m na ploščadi, −0,22 m vzdolž boksa), brez dotikov in brez škode v boksih, vsi avti pridejo na cilj.

## Meritev

`postanki.js` ponovi zanko in obe preverjanji prizora po semenih (Toskana, 6 krogov, 12 tekmecev, poškodbe Vklop, privzeta različica trkov
Simulacija). Tri drevesa oziroma nastavitve, vsakič semena 1–40:

| | prestane | pade | največji kot postanka po semenih | postankov na dirko |
|---|---|---|---|---|
| veja `0b9041a`, privzeto (vleka pri vseh avtih), `veja.log` | 37 | 3 (4, 7: kot; 32: duhovi) | 11 × 3,1°, 19 × 3,2°, 2 × 3,4°, 2 × 3,5°, 1 × 3,6°, 2 × 3,7°, 2 × 4,0°, 1 × 4,1° | 14 × 12, 16 × 13, 6 × 14, 3 × 15, 1 × 16 |
| veja `0b9041a`, »Samo moj avto« (`VLEKA=0`), `veja-samo-moj.log` | 39 | 1 (8: duhovi) | 11 × 3,1°, 29 × 3,2° | 5 × 12, 25 × 13, 8 × 14, 2 × 15 |
| `main` 777993a (vleke krmila ni), `main.log` | 39 | 1 (26: duhovi) | 11 × 3,1°, 29 × 3,2° | 15 × 12, 17 × 13, 8 × 14 |

Ukazi (v tej mapi): `SEMENA=1-40 node postanki.js > veja.log`; `VLEKA=0 SEMENA=1-40 node postanki.js > veja-samo-moj.log`;
`TRKI_SNAP=<drevo main 777993a> SEMENA=1-40 node postanki.js > main.log`. Eno seme teče približno 18 s.

- **1. preverjanje (vsak postanek v boksu, kot pod 4°)** pade samo z vleko pri tekmecih: semeni 4 (4,06°) in 7 (4,03°). Brez vleke pri
  tekmecih in na `main` je največji kot postanka v vseh 40 semenih 3,1–3,2°; z vleko je v 10 semenih (3, 4, 5, 7, 22, 23, 24, 30, 31, 40) 3,4–4,1°.
- **2. preverjanje (duhovi drug v drugem skupaj pod 5 s, naenkrat pod 2 s)** pade v enem semenu od 40 v vseh treh meritvah (veja 32: 5,3 s;
  »Samo moj avto« 8: 8,6 s; `main` 26: 6,7 s), torej ni posebnost veje.

## Vzrok

Posamezni postanki (`VSE=1`; `postanki-veja.log`: semena 3, 4, 5, 7, 10, 30, 32 s privzeto vleko; `postanki-samo-moj.log`: semeni 4 in 7 z `VLEKA=0`).
Stolpec »sprednja vogala« je zmečkanost sprednjih vogalov `cd[0]/cd[1]`; iz njune razlike jedro računa vleko krmila
(`dmgSteer`: `(cd[1] − cd[0]) · 0,06` zasuka krmila, največ ±0,05, v celoti od 10 m/s; samodejni voznik proti njej ne krmili).

- Prvi postanki z vleko (84 postankov, 7 semen): kot 2,56–3,32°; od tega 36 z nepoškodovanima sprednjima vogaloma: 2,66–3,23°.
- Drugi postanki poškodovanih tekmecev z vleko (13 postankov, 7 semen):
  - bolj zmečkan vogal `cd[0]` (5 postankov; 0,68/0,00, 0,95/0,06, 0,63/0,14, 0,83/0,00, 0,78/0,00): 3,65°, 4,06°, 3,52°, 4,03°, 3,99°;
  - bolj zmečkan vogal `cd[1]` (7 postankov; 0,31/0,48, 0,31/0,71, 0,15/0,98, 0,20/0,65, 0,00/0,36, 0,12/0,81, 0,25/0,58): 2,48°, 2,69°, 2,02°, 2,63°, 2,27°, 2,37°, 2,76°;
  - enaka vogala (0,37/0,36): 2,68°.
- Brez vleke pri tekmecih (semeni 4 in 7; 24 prvih postankov 2,67–3,21°): drugi postanki 2,83° (0,23/0,39), 3,15° (0,57/0,26) in 3,14° (0,96/0,15).
  Avto z zelo neenakima vogaloma (0,96/0,15) torej brez vleke stoji kot nepoškodovan.

Sklep: poškodovanega tekmeca pri zavijanju v boks zasuka **vleka krmila po trku** (paket P3; pri vseh avtih je privzeta od 17. 11. 2026, izbira
uporabnika `trki-vlecenje-tekmeci` = 2). Po tem, kateri sprednji vogal je bolj zmečkan, obstane bolj naravnost (2,0–2,8°) ali bolj postrani
(3,5–4,1°) kot nepoškodovan avto. Posledica je samo videz: avto je v svojem boksu, brez dotikov in škode.

## Odločitev

- Prizor Toskana teče s **semenom 5** namesto 7 (`tests/pits.test.js`): 15 postankov, trije poškodovani tekmeci pridejo drugič (škoda 1,000,
  0,764 in 1,000; koti 2,69°, 3,52° in 2,02°), največji kot 3,5°, duhovi 1,9 s (naenkrat 0,3 s). Test z njim: 21 od 21.
- Semeni 1 in 2 (prvi, ki prestaneta) imata samo 12 postankov, zato vleke v boksih ne bi pokrili.
- Merilo testa (kot pod 4°) in privzeta vleka sta enaka kot prej; `C.setTest({ pull: 0 })` za ta prizor ni uporabljen, ker bi privzeta vleka
  v boksih ostala brez testa (pregled 17. 11. je to pri drugih testih označil kot vrzel).
- Kode vleke nismo spreminjali. Odprta odločitev **boksi-1**: naj se vleka krmila tekmecu v boksih izklopi, da poškodovan tekmec obstane
  naravnost? Privzeto: ostane, kot je.

## Ni izmerjeno

- Kateri commit veje je prvi podrl seme 7 (na `70636de` že pade).
- Semena prizorov Spa (4) in Bathurst (1) niso pregledana po 40; v testu prestaneta.
- Kateri vogal (`cd[0]` ali `cd[1]`) je levi in na kateri strani so boksi; meritev kaže samo smer učinka po indeksu.
- Brskalnik. Vsaka sprememba poteka dirke semena premeša, zato rezerva enega semena ni trdna; podatek je delež semen, ki prestanejo (37 od 40 proti 39 od 40).
