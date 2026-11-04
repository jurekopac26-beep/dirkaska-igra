# AI po tvoji liniji

Želja uporabnika (4. 11. 2026): »ali lahko posnames mojo voznjo in izmeris moje povprecne linije ter hitrost in naredis da ai etkmovalci vozijo v povprecju tudi tako«. Nato: »začni z orodjem, posnetke pošljem pozneje«.

## Koraki

1. **Orodje** `tools/voznja.mjs`: iz uporabnikovih posnetkov dirk (`.rrp`) za vsako progo izmeri povprečno linijo, hitrost in zaviranje (v delu).
2. **AI v `js/core.js`** vozi po profilu; vsak tekmovalec z malo razlike glede na težavnost (nova seja z Opusom, ko pridejo posnetki).
3. **Test**: AI vozi blizu uporabnikove linije in njegovega časa kroga.

## Stanje

- 4. 11. 2026: korak 1 v delu.
