# Poročilo izrisa 1b (bigsur, uncompahgre)

Veja `claude/meni-zemljevidi-izris-1b`. Vnosi v orodjih za obe progi so že obstajali; narejeni so koraki 1–4 in 7.

## Popravek orodja
- `seed_raw.py`: `L1` v `geo_places.py` je zdaj v dveh vrsticah, zato je branje do konca vrstice padlo (SyntaxError). Zdaj bere do zaključnega `}`.

## Big Sur, ZDA (`bigsur`)
- Umestitev: GUESS cilj Hurricane Point (36.3600, -121.9010, 2500 m). Ujemanje `mad` 3,92 m, `p90` 4,2 m, `moved` 378 m (< 2500), razpon višin 127 m, `away100` 19,3 m (izrazit minimum). Zasuk -0,02°. Zanesljivo.
- Start 36.3884, -121.9012 (pred mostom Rocky Creek), cilj 36.3569, -121.9027 (Hurricane Point).
- Zemljevid: proga cela, na sredini.
- Imena: nespremenjena (vnosi že v orodjih).

## Uncompahgre, ZDA (`uncompahgre`)
- Umestitev: GUESS start (38.0080, -107.6631, 800 m). Ujemanje `mad` 2,02 m, `p90` 3,8 m, `moved` 6 m, razpon višin 334 m, `away100` 24,2 m. Zasuk 0,02°. Zanesljivo.
- Start 38.0079, -107.6631 (južni rob Ouraya), cilj 37.9709, -107.6576.
- Zemljevid: proga cela, na sredini.
- Imena: nespremenjena (vnosi že v orodjih).
- Helikopter: narejen (`heli-uncompahgre.webm`, 4,4 MB, 981 sličic, brez sprememb nastavitev); predogled: proga vidna, pokrajina brez lukenj.

## Stanje
- Lahki koraki (track, zemljevid, otok, umestitev, places, far, lc): narejeni za obe progi.
- Helikopter: v teku.
