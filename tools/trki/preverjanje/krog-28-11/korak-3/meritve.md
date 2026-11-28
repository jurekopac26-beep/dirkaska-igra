# Korak 3 (28. 11.): vrata-ježek, meja klicev `ev`, zavora izločenega avta (F3) z najdbama pravila-3 in voznja-5

Drevesa: **pred** = `26d2b1d` (glava pred popravkom), **po** = commit s tem zapisom, **`main`** = `f4070df`. Skripti (ta mapa) merijo na jedru, instrumentiranem v pomnilniku (`../../krog-25-11/fizika/lib.js`); drevo ostane nedotaknjeno. Različice `retireBlocked` so v `kandidati.js`: `veja` = drevo, kot je, `brez` = izklopljen, `ctr`, `gap`, `pas` = kandidati popravka.

Ukazi (v tej mapi; »pred« z `TRKI_SNAP=<drevo 26d2b1d>`, npr. `git worktree add --detach <mapa> 26d2b1d`):

```
node odstop.js   > odstop-po.log              (84 primerov, ~2 min)        VARS=veja,brez,ctr,gap,pas ... > odstop-pred.log
node rdeca.js    > rdeca-po.log               (17 trenutkov, ~8 min)       VARS=veja,brez,ctr,gap,pas ... > rdeca-pred.log
EVERY=60 node sled.js > sled-po.log   (sled enega primera; privzeto cv 1, Toskana, korak 1500, avto 7)
TRKI_MAIN=<drevo main> node pravila-3.js <veja|main> kagerod 9 <faza> <ostanek s> <cv> '' <avto>   (zbrano v pravila-3.log)
```

## 1. Vrata-ježek in 2. meja klicev `ev` (odgovora 24. 11., preverjeno na glavi `26d2b1d`)

- `node tests/browser/crash.test.mjs`: 216 od 216. Ježek (ozek bok za sprednjimi vrati): odprejo se sprednja vrata, iz boka za njimi ni izrezano nič (`"ajar":["doorL"],"xOpen":false,"n":0`).
- `node tests/browser/fleet.test.mjs`: 42 od 42. Razbitina `ev` z odprtimi vrati: 38 klicev risanja, meja 21 + 2 × 6 + 4 + 3 = 40 (3 so dovoljeni v `tests/golden/perf.json`, `_wreck`).
- Koda teh dveh točk v tem koraku ni spremenjena.

## 3. Zavora izločenega avta (F3)

### pravila-3: ni razlika od `main` (umaknjeno, brez spremembe kode)

Najdba 25. 11. je primerjala »prvi avto v fazi«; v Realistični dirka teče drugače, zato je bil na veji ujet drug avto kot na `main`. Isti avto v isti fazi (Kågeröd, seme 9; `pravila-3.log`, 6 poskusov na drevo): izid je na veji (cv 6 in cv 1) in na `main` enak. Odvisen je od mesta boksa (ali je avto tam že »ob robu«, `retiredOff`) in od preostanka popravila, ne od veje.

| izločen v boksu (premik do ustavitve) | veja cv 6 | veja cv 1 | `main` |
|---|---|---|---|
| avto 2, faza `repair`, ostanek 5 s | 20,4 m | 20,4 m | 20,4 m |
| avto 2, faza `done` | 23,7 m | 23,7 m | 23,7 m |
| avto 3, faza `repair`, ostanek 5 s | 0,0 m | 0,0 m | 0,0 m |
| avto 0, faza `repair`, ostanek 2 s in 6 s | 21,7 m | 21,7 m | 21,7 m |
| avto 0, faza `repair`, ostanek 12 s (prestavi ga `_parkRetired` ob 8,0 s) | 12,3 m | 12,3 m | 12,3 m |

Povsod se avto ustavi v boksih (`inPit`), 9,3 m od osi proge (avto 3 na svojem mestu, 21,3 m). »`main` 0 m« iz najdbe je avto 3, »veja ~24 m« avto 2.

### voznja-5: zaviranje za avtom na poti v vsaki različici je del odločitve F3; ena napaka, popravljena

Meritev `odstop.js`: zdrav tekmec sredi polja odstopi in zapelje k robu (7 prog × 3 trenutki × 2 avta × cv 1 in 6 = 84 primerov, 20 s po odstopu). Na `26d2b1d` je `veja` enaka `brez` v 71 primerih, v 13 se razlikuje (5 pri cv 1, 8 pri cv 6), mešano na obe strani. En primer je bil jasno slabši:

| cv 1, Toskana, korak 1500, avto 7 | pred (`veja`) | brez `retireBlocked` | po (`ctr`) |
|---|---|---|---|
| koraki dotika izločenega (največja hitrost) | 39 (13,3 m/s) | 13 (8,5 m/s) | 54 (8,1 m/s) |
| škoda izločenega / drugih | 1,000 / 1,155 | 0,301 / 0,395 | 0,250 / 0,383 |
| ustavitev, pot, od roba asfalta | 8,9 s, 52 m, 2,6 m | 3,3 s, 36 m, 3,1 m | 3,1 s, 30 m, 3,3 m |
| koraki z zavoro 0,8 | 471 | 0 | 90 |

Vzrok (`sled-pred.log`): izločeni avto zavija k robu čez polje; avto, ki mu zapelje v levi bok (središče 0,1 do 0,5 m »pred« središčem izločenega, 2,95 m vstran, smeri ~60° narazen), je štel za avto »na poti« (pogoj je bil središče drugega pred središčem, `f > 0`). Zavora 0,8 ga je ustavila na cesti 4 m pred robom, tam je bil večkrat zadet in uničen. Po popravku (`sled-po.log`) po 3,1 s stoji ob robu s škodo 0,25.

**Popravek (`ctr`):** drugi avto je »na poti« šele, ko je njegovo središče pred nosom izločenega (`f > dolžina / 2`). Pogoj samo zoži, kdaj `retireBlocked` vrne `true` (bližje `main`).

Po popravku (`odstop-po.log`; pred → po, vsota 42 primerov na različico):

| | cv 1 pred | cv 1 po | cv 1 `brez` | cv 6 pred | cv 6 po | cv 6 `brez` |
|---|---|---|---|---|---|---|
| primerov z dotikom izločenega | 8 | 8 | 9 | 8 | 8 | 9 |
| škoda izločenega (največja) | 1,59 (1,000) | 0,84 (0,250) | 0,89 (0,301) | 0,58 (0,233) | 0,62 (0,233) | 0,71 (0,233) |
| škoda drugih | 7,49 | 6,72 | 5,92 | 7,96 | 7,96 | 8,05 |
| ustavitev povprečno | 3,4 s | 3,2 s | 3,2 s | 3,3 s | 3,2 s | 3,3 s |

Razlika pred → po je v vsaki različici en sam primer (Toskana, korak 1500, avto 7); 41 od 42 je enakih do izpisa. Pri cv 6 je ta primer približno nevtralen: škoda izločenega 0,142 → 0,184, drugih 0,189 → 0,189, ustavitev 5,7 → 4,3 s.

Cilj F3 (`rdeca.js`: Bathurst, kup dveh uničenih tekmecev v 17 trenutkih) po popravku ostane:

| | cv 1 po | cv 1 `brez` | cv 6 po | cv 6 `brez` |
|---|---|---|---|---|
| rdeča zastava v 15 s | 17 od 17 | 17 od 17 | 17 od 17 | 16 od 17 |
| ustavitev razbitin povprečno (najdaljša) | 3,4 s (5,3) | 3,4 s (5,3) | 4,5 s (15,7) | 4,5 s (24,0) |
| pot povprečno (najdaljša) | 63 m (106) | 63 m (106) | 72 m (122) | 74 m (169) |
| koraki dotika med razbitinama | 0 | 0 | 2 | 1 417 |

Pri cv 6 je `po` enak `pred` v vseh 17 trenutkih; pri cv 1 se razlikuje en trenutek (t = 95 s: rdeča 7,4 → 7,2 s).

Kandidata `gap` in `pas` (`*-pred.log`): `gap` da v 84 primerih isto kot `ctr`, pri cilju F3 pa en trenutek slabše (cv 6, t = 50 s: dotik med razbitinama); `pas` se od veje razlikuje v več primerih (38 oziroma 37 od 42 enakih) brez koristi. Zato `ctr`.

## Test

`tests/fleet.test.js`, »a retired car brakes (0.8) behind a slower car in its way; one beside it does not stop it on the road«: izločen avto pri 15 m/s; brez avta v bližini zavora 0,2, počasnejši avto 12 m pred njim 0,8, avto v boku z leve ali desne (60°) in avto vzporedno 0,15 m ob boku 0,2. Na `26d2b1d` zadnji trije dajo 0,8 (test pade), po popravku 0,2.

## Ni izmerjeno

- Odstop igralčevega avta (»Odstopi«) sredi polja; meritev vodi tekmeca.
- Druga semena in druge proge od naštetih sedmih; promet in odprte ceste.
