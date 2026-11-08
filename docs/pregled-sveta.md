# Pregled sveta: skupni deli `js/world.js` in `js/world-*.js`

**Stanje: v delu** (seja Pregled sveta, račun biketraveler, 8. 11. 2026). Samo branje: popravkov v tej temi ni, koda igre ostane nespremenjena.

Odločitev uporabnika 8. 11. 2026 ob ~17.40 (tabla #382, Matejev komentar 6724187167): na svežem `main` pregled kode `/code-review max` na skupnih delih sveta. Ista tema in isti osnutek PR kot pregled jedra (`docs/pregled-jedra.md`, veja `pregled/jedro-in-svet`).

## Obseg
- Skupni deli `js/world.js` (gradnja proge, teren, ograje, drevesa, boksi, ljudje, LOD, skupni pomočniki) in vse `js/world-*.js` pravih prog in skupnih gradnikov (`world-gore.js`, `world-ljudje*.js`, `world-zivali.js`, `world-zastave.js`, `world-zaslon.js` …).
- **Izvzeti** (zamrznjeni, `CLAUDE.md`, »Testne proge«): graditelji prog s `test: true` in njihove datoteke `js/world-<id>.js` (Mount Baldy, Beartooth, Big Sur, Detroit, Mount Hotham, Longford, Mauna Kea, Moki Dugway, Monterey, Santa Monica Mountains, Newcastle, Palomar Mountain, Rio de Janeiro, Riverside, Townsville, Uncompahgre, Vršičevi deli v `world-vrsic.js`) ter graditelji Jezera, Riviere, Gorskega relija, Monte Carla, Bakrenega gozda, Toskane in Gromskega rta v `js/world.js`.

## Napake po resnosti
_Sledi po pregledu._
