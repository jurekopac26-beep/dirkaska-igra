# Delo »samo v slikah« – predaja

V tej mapi je vse, kar je bilo od 13. 10. do 28. 10. narejeno **samo v slikah** (maketah). Igra (`js/`, `css/`) s tem **ni** spremenjena.
Uporabnik je določil: v kodi se nič ne spreminja, dokler ne napiše »začni«; potem gredo v igro samo spremembe, ki jih je potrdil na slikah.

## Kaj je kje

| Pot | Vsebina |
|---|---|
| `izbire.md` | **Najprej preberi.** Vse odločitve uporabnika (njegove besede v narekovajih), kaj je narejeno, s katero stranjo in kaj bo treba pri prenosu v kodo. |
| `delo/` | Strani (`*-page.js`), ki spremembe dodajo v igro, ki teče v brskalniku; skripte za izris (`live2.mjs`), sestavljanje listov (`compose_*.py`), pomožna orodja. |
| `delo/vrsta/` | Predloge vrste za izris (`q1192…q1197` = koraki nalaganja, `q1315` cela mapa v 15 slikah, `q1336` proge za čolne, `q1345` plaže). |
| `fw4-predaja.patch` | Majhne lokalne spremembe igre, na kateri tečejo slike (`js/newmap.js`, `js/game.js`; osnova je commit `6f1e48c9` te veje). |
| `listi/` | Zadnji poslani listi (22.–28. 10.): vogal parkirišča, helikopter, cela mapa v 15 slikah, 6 prog za čolne. |
| `obnovi.sh` | Obnovi delo v novi seji. |

## Obnova v novi seji (~30 min)

1. Seja na veji `slike-predlogi` (ta mapa ni na `main`).
2. `bash slike-predlogi/obnovi.sh <delovna-mapa-seje>`: skopira `delo/`, popravi absolutne poti stare seje, naredi `fw4` (git worktree na `6f1e48c9` + patch) in v `live/` postavi 8 korakov nalaganja.
3. Zaženi izrisovalnik, kot izpiše skripta: `(cd <mapa> && GAME_ROOT=<mapa>/fw4 nohup node live2.mjs > live.out 2>&1 &)`.
   Izvaja `live/q<N>.mjs` po vrsti in za vsako zapiše `live/q<N>.done`. Igra ostane odprta, zato se lahko dodajajo nove `q<N>.mjs`.
4. Ko je `live/q8.done` gotov (v njem je `HELI22 {"shown":true…}`), je igra naložena z **vsemi** spremembami do 21. 10. in s helikopterjem.
5. Predloge na vrhu (ne v nalaganju):
   - proge za čolne: `window.__BOATK = k` (0–5), nato `boat27-page.js` in `boat27d-page.js`;
   - plaže: `window.__BOATK = 1; window.__BEACHV = j` (0–5), iste strani.

### Pasti
- Kontejner se občasno znova zažene. Takrat izrisovalnik ugasne; nalaganje je treba ponoviti (koraki od 2 naprej, `obnovi.sh` je pri ponovitvi varen).
- Posnetki: `{ kind: 'top', cx, cz, span }` (od zgoraj), `{ kind: 'drive', mode: 'iso' | 'chase', x, z, h }` (kameri igre; ležeče 960×540, pokonci 540×960).
- `pick22e.js` pove, katera plast je pod točko na posnetku (koristno, ko uporabnik obkroži napako).
- Strani si sledijo: poznejše se zanašajo na `window.__…` iz prejšnjih (npr. `boat27` potrebuje `water3`, `heli22` potrebuje `heli8`).

## Pravila uporabnika (iz pogovora)
- Odgovori kratko in v slovenščini. Slike pošlji kot liste »prej / potem«, s kratkim opisom.
- Za igro štejeta samo izometrična kamera (telefon ležeče) in kamera za avtom (telefon pokonci); pogledi od zgoraj so za preverjanje.
- Ko uporabnik prosi za verzije, jih je praviloma **6**.
- Pull request samo, če ga uporabnik izrecno zahteva. Imena samo zemljepisna, brez znamk.

## Odprto ob predaji (28. 10.)
- Uporabnik izbira med 6 progami za čolne (`listi/vse39-proge-za-colne`) in je za »Široko progo s plažami« zahteval še 6 verzij (A–F, `window.__BEACHV`); list `49-x` je v delu.
- Na 15 slikah cele mape (`listi/vse38-cela-mapa-15`) so naštete starejše nepravilnosti; uporabnik še ni povedal, katere popraviti.
