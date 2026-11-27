# fizika-6: povožen kolesar avtu in paru ne doda energije (27. 11.), meritve pred in po

Drevesa: **pred** = 6ee8653 (koda 0c36dfd: veja po fizika-5, brez tega popravka), **po** = 130ceaf. Skripte (ta mapa): `kolo2.js` (prvi dotik kot v igri: avto se kolesu približuje po korakih 1/120 s in se pred dotikom ne vrti), `kolo1.js` (en klic pri naključnem prekrivanju; avto se sme vrteti do 9 rad/s in drseti do 0,6 rad; pešec za primerjavo), `primerjaj.js` (drevesi po prizorih). Vse merijo `Traffic._hitVeh` v Realistični (cv 6).

Ukazi (v tej mapi):

```
N=12000 SEED=3 node kolo2.js     > kolo2-po.log
node kolo1.js                    > kolo1-po.log          (N=40000 SEED=3, kolo vozi 0 do 9 m/s)
BV=0 node kolo1.js               > kolo1-stoji-po.log    (kolo stoji)
N=60000 SEED=7 node kolo2.js     > kolo2-po-seme7.log
N=200000 SEED=7 node kolo1.js    > kolo1-po-seme7.log
IZPIS=po.txt N=12000 SEED=3 node kolo2.js > /dev/null
IZPIS=pred.txt TRKI_SNAP=<drevo pred> N=12000 SEED=3 node kolo2.js > /dev/null
node primerjaj.js pred.txt po.txt > primerjava.log
```

Dnevniki `*-pred.log` so isti ukazi na drevesu pred spremembo (`TRKI_SNAP=<drevo pred>`). Prva vrstica vsakega dnevnika pove drevo. Dnevnika `kolo2-pred.log` in `kolo1-pred.log` sta bila v `6ee8653` narejena z izvirnima skriptama kroga 25. 11.; tu ju nadomešča izpis skript iz te mape na istem drevesu, da sta stolpca pred in po merjena z isto skripto (števci, ki jih imata obe, so enaki).

## Kaj je uveljavljeno (130ceaf, samo Realistična, cv 6)

- **Sunek samo ob dotiku, ki se zapira.** Kadar se točka dotika avta kolesu ne približuje, ne avto ne kolo ne dobita sunka in meta vstran ni. Kolesar vseeno pade, kolo obdrži svojo hitrost.
- **Varovalo energije.** Ob dotiku, ki se zapira, avto prevzame sunek trka in nasprotni sunek meta kot prej (hitrost v celoti, zasuk po pravilu oprijema, `kTake`). Kjer bi par avto + kolo s tem dobil energijo, avto prevzame več tistega dela zasuka, ki njegovo vrtenje upočasni, in samo toliko, da rast izgine (če to ne zadošča, ves ta del). To je isti prijem kot pri prometu (`_hitVehR`) in pri dveh avtih (`kCollide`).
- **Met vstran je omejen.** Poln met je 1,2 + 0,07 · v (m/s; v je hitrost avta). Če bi par s polnim metom tudi po varovalu dobil energijo, se met zmanjša do meje, pri kateri je ne dobi (bisekcija, 32 korakov). Če bi par energijo dobil že brez meta, je meja ta rast: met je ne sme povečati.
- **Kjer poln met energije ne doda, je izid enak do zadnjega bita** (razdelek »Drevesi po prizorih«).
- Nespremenjeno: padec kolesarja, poškodba avta (`knock`), sunek v nos (`csKc`), iskre, naključno vrtenje kolesa po zadetku, vrstni red in število naključnih števil.
- Avti zunaj pravila Realistične (`krOn`: policijsko zasledovanje, vlačilec s polpriklopnikom, boksi), Simulacija (cv 1) in različice 2–5 se ne spremenijo (stari `_runBike`). Vožnja ni spremenjena.

## Merilo

Kolesar, ki stoji, avtu ne more dodati energije. Par avto + kolo po dotiku nima več energije kot pred njim. Dotik, ki se ne zapira, ne da sunka. Energija avta = gibanje + vrtenje (gorivo 0); energija kolesa = vodoravno gibanje (90 kg), brez lastnega vrtenja kolesa. Pragi štetja: `kolo2.js` 1 J ter 0,01 in 0,1 m/s; `kolo1.js` 0,001 J in 1e-9 m/s.

## Prvi dotik kot v igri (`kolo2.js`, 12 000 prizorov, seme 3, 8 382 zadetkov, brez NaN)

Vrednosti so pred → po; kjer je ena sama, je v obeh drevesih ista ali velja samo za drevo po spremembi (met).

| razred | zadetkov | dotik se ne zapira (od tega dobi sunek) | met zmanjšan, od zapirajočih (povprečni delež polnega meta) | avto hitrejši za več kot 0,01 / 0,1 m/s | največ m/s | avto dobi energijo: primerov (največ J) | par dobi energijo: primerov (največ J) |
|---|---|---|---|---|---|---|---|
| brez zdrsa, kolo stoji | 1 081 | 8 (8 → **0**) | 112 od 1 073 (0,951) | 0 / 0 → 0 / 0 | 0,004 → 0 | 20 (294,8) → **0** | 119 (3 781,5) → **0** |
| brez zdrsa, kolo vozi | 1 372 | 6 (6 → **0**) | 128 od 1 366 (0,96) | 203 / 29 → 200 / 28 | 1,488 → 1,488 | 438 (1 989,6) → 430 (1 989,6) | 133 (5 020,0) → **0** |
| zdrs do 0,3 rad, kolo stoji | 1 316 | 8 (8 → **0**) | 177 od 1 308 (0,943) | 14 / 5 → 0 / 0 | 0,584 → 0 | 26 (13 296,1) → **0** | 182 (20 189,1) → **0** |
| zdrs do 0,3 rad, kolo vozi | 1 445 | 5 (5 → **0**) | 112 od 1 440 (0,968) | 163 / 53 → 156 / 52 | 0,676 → 0,676 | 184 (14 210,7) → 180 (2 381,6) | 112 (13 468,0) → **0** |
| zdrs 0,3–0,6 rad, kolo stoji | 1 596 | 20 (20 → **0**) | 132 od 1 576 (0,968) | 41 / 12 → 0 / 0 | 0,455 → 0 | 45 (24 136,4) → **0** | 140 (26 248,6) → **0** |
| zdrs 0,3–0,6 rad, kolo vozi | 1 572 | 12 (12 → **0**) | 118 od 1 560 (0,969) | 129 / 81 → 111 / 70 | 1,902 → 1,744 | 135 (29 056,2) → 115 (2 545,2) | 127 (32 342,5) → **0** |

- Zadetki so v obeh drevesih isti (8 382), ker se drevesi do prvega dotika ne razlikujeta.
- Dotik, ki se ne zapira: 59 zadetkov. Prej je sunek dobil vsak, zdaj nobeden.
- Energija para po popravku ne zraste v nobenem zadetku (prej v 813, do 32 342,5 J).
- Ob kolesu, ki stoji, avto po popravku ne dobi ne energije ne hitrosti (prej energijo v 91 zadetkih, do 24 136,4 J; hitrost do 0,584 m/s).
- Ob kolesu, ki vozi, avto energijo lahko dobi upravičeno (kolo pripelje vanj; kolo pri 9 m/s ima 3 645 J). Tam šteje energija para.
- Met vstran je zmanjšan v 779 od 8 323 zapirajočih zadetkov (9,4 %; po razredih 7,6–13,5 %), nikoli na nič; povprečni delež polnega meta je 0,943–0,969. Varovalo zasuka v tej skripti ne prime, ker se avto pred dotikom ne vrti.

Drugo seme, večji vzorec (`kolo2-po-seme7.log`, drevo po, 60 000 prizorov, 41 612 zadetkov, brez NaN): dotik se ne zapira v 268 zadetkih, sunka ne dobi nobeden; energija para ne zraste v nobenem; ob stoječem kolesu avto ne dobi ne energije ne hitrosti; met je zmanjšan v 3 687 od 41 344 zapirajočih (8,9 %), nikoli na nič, povprečni delež 0,947–0,973. Ob kolesu, ki vozi, avto dobi do 2 795,8 J in do 2,251 m/s.

## Drevesi po prizorih (`primerjaj.js`, isti prizori, 8 382 zadetkov v obeh drevesih)

Primerja hitrost in vrtenje avta, hitrost in vrtenje kolesa ter poškodbo avta po prvem dotiku. Razredi so po drevesu po spremembi.

| razred | zadetkov | izid enak do zadnjega bita | izid drugačen | največja razlika: hitrost avta m/s | vrtenje avta rad/s | hitrost kolesa m/s |
|---|---|---|---|---|---|---|
| poln met vstran | 7 544 | **7 544** | 0 | 0 | 0 | 0 |
| met vstran zmanjšan | 779 | 0 | 779 | 3,034 | 3,692 | 7,388 |
| dotik se ne zapira | 59 | 0 | 59 | 3,613 | 0 | 7,433 |

- 7 544 od 8 382 prvih dotikov (90,0 %) ima po popravku do zadnjega bita enak izid kot prej. Razlikujejo se samo dotiki, ki se ne zapirajo, in zmanjšani meti.
- Največji razliki pri avtu sta pri najlažjem vozilu (165 kg) in veliki hitrosti: 3,613 m/s (prizor 3605, 77,5 m/s, dotik se ne zapira: prej poln met 6,625 m/s, zdaj brez sunka) in 3,034 m/s (prizor 5488, 80,6 m/s: met zmanjšan s 6,843 na 1,281 m/s). Razlika je nasprotni sunek meta: 90 kg · razlika meta / 165 kg. Hitrost je v skripti vzorčena neodvisno od vozila (2,6 do 90 m/s).

## En klic pri naključnem prekrivanju (`kolo1.js`, seme 3, brez NaN)

Preizkus skrajnosti: globoka naključna prekrivanja, avto se vrti do 9 rad/s in drsi do 0,6 rad. Vrednosti so pred → po.

**Kolo vozi 0 do 9 m/s** (40 000 klicev, 12 320 zadetkov kolesarja):

| razred | zadetkov | avto dobi energijo: primerov (največ J) | par dobi energijo: primerov (največ J) | dotik se ne zapira: dobi sunek | težišče avta hitrejše: primerov (največ m/s) | met zmanjšan, od zapirajočih (povprečni delež) | varovalo zasuka prime |
|---|---|---|---|---|---|---|---|
| avto se ne vrti | 4 950 | 3 187 (28 978,3) → 990 (2 747,7) | 2 746 (31 090,0) → **0** | 2 476 → **0** | 3 187 (1,107) → 994 (0,852) | 742 od 2 474 (0,834) | 0 |
| vrtenje do 3 rad/s | 4 907 | 3 135 (32 732,6) → 650 (2 914,8) | 2 738 (36 125,7) → **0** | 2 452 → **0** | 3 138 (1,023) → 1 006 (1,001) | 570 od 2 455 (0,887) | 629 |
| vrtenje nad 3 rad/s | 2 463 | 1 579 (30 555,6) → 186 (2 935,4) | 1 472 (34 703,8) → **0** | 1 212 → **0** | 1 597 (1,22) → 586 (0,686) | 172 od 1 251 (0,935) | 563 |

| razred | zadetkov | avto dobi energijo: primerov (največ J) | par dobi energijo: primerov (največ J) | težišče avta hitrejše: primerov (največ m/s) |
|---|---|---|---|---|
| avto se ne vrti, dotik se zapira | 2 474 | 1 099 (10 545,9) → 990 (2 747,7) | 742 (26 587,9) → **0** | 1 099 (0,852) → 994 (0,852) |
| avto se ne vrti, dotik se ne zapira | 2 476 | 2 088 (28 978,3) → **0** | 2 004 (31 090,0) → **0** | 2 088 (1,107) → **0** |
| vrtenje do 3 rad/s, dotik se zapira | 2 455 | 1 089 (13 291,2) → 650 (2 914,8) | 814 (21 456,7) → **0** | 1 092 (1,023) → 1 006 (1,001) |
| vrtenje do 3 rad/s, dotik se ne zapira | 2 452 | 2 046 (32 732,6) → **0** | 1 924 (36 125,7) → **0** | 2 046 (0,823) → **0** |
| vrtenje nad 3 rad/s, dotik se zapira | 1 251 | 590 (9 326,5) → 186 (2 935,4) | 608 (34 703,8) → **0** | 608 (0,686) → 586 (0,686) |
| vrtenje nad 3 rad/s, dotik se ne zapira | 1 212 | 989 (30 555,6) → **0** | 864 (33 721,2) → **0** | 989 (1,22) → **0** |

**Kolo stoji** (`BV=0`, 40 000 klicev, 12 263 zadetkov kolesarja):

| razred | zadetkov | avto dobi energijo: primerov (največ J) | par dobi energijo: primerov (največ J) | dotik se ne zapira: dobi sunek | težišče avta hitrejše: primerov (največ m/s) | met zmanjšan, od zapirajočih (povprečni delež) | varovalo zasuka prime |
|---|---|---|---|---|---|---|---|
| avto se ne vrti | 4 856 | 3 001 (32 529,6) → **0** | 3 378 (35 058,0) → **0** | 2 763 → **0** | 2 998 (1,473) → **0** | 857 od 2 093 (0,693) | 0 |
| vrtenje do 3 rad/s | 4 977 | 3 091 (29 793,3) → **0** | 3 512 (32 075,4) → **0** | 2 510 → **0** | 3 101 (0,968) → 814 (0,096) | 988 od 2 467 (0,751) | 1 075 |
| vrtenje nad 3 rad/s | 2 430 | 1 519 (30 846,9) → **0** | 1 740 (33 177,0) → **0** | 1 221 → **0** | 1 547 (1,314) → 524 (0,483) | 190 od 1 209 (0,92) | 659 |

| razred | zadetkov | avto dobi energijo: primerov (največ J) | par dobi energijo: primerov (največ J) | težišče avta hitrejše: primerov (največ m/s) |
|---|---|---|---|---|
| avto se ne vrti, dotik se zapira | 2 093 | 529 (19 777,1) → **0** | 857 (22 855,1) → **0** | 529 (0,581) → **0** |
| avto se ne vrti, dotik se ne zapira | 2 763 | 2 472 (32 529,6) → **0** | 2 521 (35 058,0) → **0** | 2 469 (1,473) → **0** |
| vrtenje do 3 rad/s, dotik se zapira | 2 467 | 980 (7 905,5) → **0** | 1 301 (9 724,0) → **0** | 989 (0,946) → 814 (0,096) |
| vrtenje do 3 rad/s, dotik se ne zapira | 2 510 | 2 111 (29 793,3) → **0** | 2 211 (32 075,4) → **0** | 2 112 (0,968) → **0** |
| vrtenje nad 3 rad/s, dotik se zapira | 1 209 | 521 (20 513,9) → **0** | 690 (32 618,0) → **0** | 546 (0,483) → 524 (0,483) |
| vrtenje nad 3 rad/s, dotik se ne zapira | 1 221 | 998 (30 846,9) → **0** | 1 050 (33 177,0) → **0** | 1 001 (1,314) → **0** |

- Ob kolesu, ki stoji, avto po popravku energije ne dobi v nobenem od 12 263 zadetkov (prej v 7 611, do 32 529,6 J), par v nobenem (prej v 8 630, do 35 058,0 J).
- Ob kolesu, ki vozi, par po popravku energije ne dobi v nobenem od 12 320 zadetkov (prej v 6 956, do 36 125,7 J). Avto jo dobi samo še ob dotiku, ki se zapira (kolo pripelje vanj), do 2 935,4 J (prej do 32 732,6 J).
- Dotik, ki se ne zapira, je v tej skripti približno polovica zadetkov (prekrivanje je naključno). Prej je sunek dobil vsak, zdaj nobeden.
- Gibalna količina para se ohrani: razlika do 4,44e-11 kg·m/s (kolo vozi) in 3,42e-11 kg·m/s (kolo stoji); prej do 4,65e-11 in 4,44e-11 kg·m/s.
- Pešec (`_hitPedR`, ni spremenjen): izpis je pred in po enak v vseh šestih razredih; avto ne dobi ne energije ne hitrosti.

Drugo seme, večji vzorec (`kolo1-po-seme7.log`, drevo po, 200 000 klicev, 60 896 zadetkov kolesarja, kolo vozi, brez NaN): energija para ne zraste v nobenem zadetku; dotik, ki se ne zapira (30 385 zadetkov), ne da sunka v nobenem; avto dobi do 3 279,7 J (kolo pripelje vanj); gibalna količina do 4,8e-11 kg·m/s; pešec brez rasti energije in hitrosti.

## Kaj ostane

1. **Lastno vrtenje kolesa po zadetku** (naključno, do 4,5 rad/s) ni šteto v energijo para in ni spremenjeno. Z vztrajnostnim momentom kolesa po formuli igre (27,0 kg·m²) je to do 273,4 J.
2. **Skok pri hitrosti zbliževanja nič.** Tik nad ničlo kolo dobi met vstran (poln ali omejen), pri ničli in pod njo ničesar. Prej je bil met od zbliževanja neodvisen.
3. **Hitrost težišča avta se sme povečati, kadar to plača vrtenje:** ob stoječem kolesu v enem klicu do 0,096 m/s (vrtenje do 3 rad/s) in 0,483 m/s (nad 3 rad/s). Skupna energija avta pri tem ne zraste v nobenem primeru. V prvem dotiku kot v igri (avto se ne vrti) hitrost ob stoječem kolesu ne zraste.
4. **Kolo, ki vozi, avtu energijo lahko da:** do 2 935,4 J v enem klicu (3 279,7 J na večjem vzorcu) in do 2 545,2 J v prvem dotiku (2 795,8 J na večjem vzorcu). Energija para pri tem ne zraste v nobenem primeru.

## Testi

- `tests/trki.test.js` 82/82 (prej 80; dodani preverbi sta opisani spodaj), nobena referenca se ne premakne (`tests/golden/trki.json` ni spremenjen; med 150 referenčnimi prizori ni nobenega s kolesarjem). Preverba »a cyclist run over« (6 primerov: 60, 120 in 200 km/h, v sredino in 0,4 m vstran; kolo stoji, avto se ne vrti) velja nespremenjena: gibalna količina para do 1e-9, energija ne zraste, avto izgubi 4 do 10 % hitrosti, isti dogodek, škoda in število naključnih števil prometa kot v Simulaciji.
- Nova preverba »a cyclist run over, the touch not closing« (3 primeri od zadaj: 11 km/h za kolesom pri 29 km/h, v sredino; 20 za 30 km/h, 0,4 m vstran; 40 za 45 km/h, 0,3 m na drugo stran): avto obdrži hitrost in vrtenje, kolo hitrost do zadnjega bita, kolesar pade, isti dogodek, škoda in število naključnih števil prometa kot v Simulaciji. Na drevesu pred spremembo pade: avto dobi 0,11 / 0,12 / 0,15 m/s, kolo 1,4 / 1,6 / 2,0 m/s.
- Nova preverba »a cyclist caught up slowly« (18 primerov od zadaj: 35 za 30, 28 za 25 in 60 za 30 km/h; avto naravnost ali v vrtenju 3 rad/s v eno in drugo smer; v sredino in 0,4 m vstran): energija para ne zraste (meja 1e-9 energije para; največ 2,7e-11, velikostni red dopustnega 1e-6 J varovala), gibalna količina para do 1e-9 (največ 8,5e-17). Oboje je merjeno po hitrosti, ki jo kolo nosi samo (`v.vx`, `v.vz`; to bere `_runBikeR`); lastno vrtenje kolesa ni šteto. Na drevesu pred spremembo pade: energija para zraste v 12 od 18 primerov (vseh 12 pri 35 za 30 in 28 za 25 km/h), za 0,15 do 0,60 % energije para. Pri 60 za 30 km/h dotik izgubi 1,4 do 1,6 % energije para in poln met ostane (številke na obeh drevesih enake).
- Preostalih 80 preverb izpiše na obeh drevesih enake vrstice. Po dodanih preverbah je tekel samo `tests/trki.test.js` (na tem drevesu in na drevesu pred spremembo); koda se od `130ceaf` ni spremenila, zato spodnji izidi veljajo naprej.
- `tests/poskodbe.test.js` 14/14, `tests/golden.test.js` 504 od 504 enakih, `tools/stamp.js --check` v redu.
- `tests/races.test.js`: 360 od 360 dirk enakih (`OK: all races fine`, 1380 s; del časa je tekel hkrati s `tests/golden.test.js`).

## Česa ta krog ni izmeril

- Več zaporednih dotikov z istim kolesom: skripti merita prvi dotik oziroma en klic.
- `tests/trki.test.js` dotik, ki se ne zapira, in počasno dohitevanje preverja samo v legi od zadaj (avto v smeri kolesa, 5 cm prekrivanja, vrtenje do 3 rad/s); bočne lege, drsenje in hitrejše vrtenje merita samo skripti v tej mapi.
- Slik zdaj in potem ni.
- Testi v brskalniku in `npm run test:related` (približno 4,6 h): tečejo enkrat, v zbirnem krogu ali pred `main`.
