# Slike zdaj in potem (28. 11.): fizika-6 in korak 3

Slike niso v repozitoriju (javen je); so na strani Odločitve na karticah `trki-fizika-6-28-11` in `trki-korak-3-28-11`. Zajame in sestavi jih `zajem.mjs` (ukazi v glavi datoteke); številke vsakega zajema so v `*.json` (zapis `prizor.json`). Kamera je povsod kamera za avtom; pri kolesu je trak izrez istega pogleda v večji ločljivosti.

| trak | drevo | zajem | sestavi |
|---|---|---|---|
| kolo · 1 po sunku | glava veje (`119d8b0`) | `kolo --pogled 1920x888` | `--casi -0.2,0.1,0.3,0.5,2 --izrez 0.40,0.40,0.68,0.78` |
| kolo · 3 kot prej | `666d326` (pred fizika-6) | isto | isto |
| odstop · 1 potem | glava veje (`119d8b0`) | `odstop` (privzeto: cv 1, korak 1500, avto 7, pogoji igre) | `--casi 1,2,3.5,6,12` |
| odstop · 2 zdaj | `26d2b1d` (pred popravkom) | isto | isto |

## fizika-6: lastno vrtenje kolesa (`kolo-po.json`, `kolo-pred.json`)

El Jem, način Realistična: en kolesar (15 km/h, 0,9 m od roba asfalta), avto `rally` 15 m za njim in 0,85 m levo pelje naravnost z 80 km/h in ga zadene z desnim sprednjim vogalom (80,6 km/h ob zadetku), nato zavira.

| | vrtenje ob zadetku | zasuk skupaj |
|---|---|---|
| 1 · po sunku (veja) | −11,769 rad/s (1,87 obrata na sekundo) | 297,9° |
| 3 · kot prej (`666d326`) | +3,574 rad/s (naključno; 0,57 obrata na sekundo, največ možno 0,7) | 90,7° |

Kolo v obeh odleti skoraj enako daleč (lege se razlikujejo do 0,6 m) in po ~2 s obleži; razlika je v zasuku. Brskalnik in Node dasta na obeh drevesih iste številke. Zadetek naravnost od zadaj kolesa skoraj ne zavrti, zato je prizor zadetek z vogalom. Možnost 2 s kartice (naključno, a plačano) slike nima: zanjo ni kode.

## korak 3: odstop sredi polja (`odstop-po.json`, `odstop-pred.json`)

Prizor iz `../korak-3/meritve.md` (testna proga Toskana, način Simulacija, korak 1500, odstopi avto 7; igralčev avto vodi samodejni voznik), pogoji igre (steklo na cesti in predmeti ob progi):

| | škoda izločenega / drugih | ustavitev | pot | od roba asfalta | koraki z zavoro 0,8 |
|---|---|---|---|---|---|
| 2 · zdaj (`26d2b1d`) | 1,000 / 1,389 | 11,6 s | 55,7 m | 2,3 m | 543 |
| 1 · potem (veja) | 0,260 / 0,551 | 3,05 s | 29,2 m | 3,1 m | 95 |

`--pogoji meritev` da številke iz `../korak-3/meritve.md` (škoda 1,000 → 0,250, ustavitev 8,9 → 3,1 s). V načinu Realistična je isti prizor približno nevtralen (škoda 0,142 → 0,184, ustavitev 5,7 → 4,3 s), zato sta sliki iz načina Simulacija.
