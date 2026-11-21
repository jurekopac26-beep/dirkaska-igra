# Tovornjak v prometu in Trki (#608): dogovor

Nastavitev »Tovornjak v prometu« (`opts.tfTruck`, odločitev uporabnika 20. 11. 2026, `trki-tovornjak-20-11` = 1) prinaša PR #827. Trke dela druga seja (Trki #608); ta dogovor pove, kdo ima kateri del, da se vejeta ne prekrivata.

## Kaj je na veji #827 (tovornjaki)
- `Traffic._tkHold(v, c)` v `js/core.js`: ali tovornjak v prometu (`v.p === 5`, še v svojem pasu, `v.st === 0`) ob udarcu avta ostane v pasu.
  - 0 (privzeto): vedno; za avto je težak kot zid (`TK_HOLD_M`), nikoli odbit.
  - 1: enako do 120 km/h; hitrejši avto ga odbije kot doslej.
  - 2: kot doslej (lastna masa, odbit).
- Uporaba je samo na dveh mestih: masa `mb` v obeh trkih avta s prometom (preprosti in z vrtenjem, `crashMass`). Drugega v kodi trkov #827 ne spreminja.

## Kaj ostane Trkom (#608)
- Vse drugo pri trku s tovornjakom: sila, škoda, deli, zvok, iskre, prevračanje, odboj avta od zidu.
- Če #608 trk avta s prometom prepiše, naj masa `mb` še naprej pride iz `_tkHold` (en klic, brez novih pogojev drugje). Prag 120 km/h in `TK_HOLD_M` lahko #608 prestavi v svojo tabelo trkov, vrednosti in pomen stopenj 0–2 pa ostanejo.
- Ob sporu pri združevanju: `_tkHold` in `TK_HOLD_M` vzame tisti, ki se združuje drugi, in ju priklopi na svojo kodo trka; nastavitev v meniju je #827.

## Preverjanje
- `tests/traffic.test.js`, zadnja kontrola: stopnje 0–2 in prag 120 km/h v `_tkHold`. Če #608 trk prepiše, naj ta kontrola ostane zelena.
