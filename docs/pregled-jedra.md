# Pregled jedra igre (`js/core.js`, `js/render.js`)

Pregled kode jedra igre, samo branje (odločitev uporabnika 8. 11. 2026 ob 16.05 in 17.40, tabla #382, Matejev komentar 6724187167; račun biketraveler). Poziv: `/code-review max js/core.js js/render.js` na svežem `main` (90e09dac). Ena tema s Pregledom sveta (`docs/pregled-sveta.md`), skupni osnutek PR na veji `pregled/jedro-in-svet`.

**Popravkov tu ni**: dokument samo našteje preverjene napake; popravke razvrsti tedenski načrt. Testne proge so zamrznjene (`CLAUDE.md`), zato napake, ki se pokažejo samo na njih, niso v seznamu.

## Stanje
- 8. 11. 2026 ob 18.15: začetek pregleda.
- 18.30: prvi prehod (`/code-review max`, ena seja brez več agentov) je prebral razred `Race`, trke, AI, promet ter v `js/render.js` pogled avtov, varnostni avto, razbitine, popravilo v boksih, kamero boksov in ogenj: dve najdbi (J1, J2), obe preverjeni. Za neprebrane dele (proga, fizika avta, poškodbe, policija, svet v izrisu, kamera, učinki) teče 9 vzporednih pregledov.

## Najdbe po resnosti
Vsaka najdba ima datoteko in vrstico (na `main` 90e09dac), opis in konkreten primer, ki jo sproži. Preverjeno: **potrjeno** (sled od vhoda do napake ali simulacija) ali **verjetno** (branje kode brez ponovitve).

### Kritične
_V delu._

### Hude
_V delu._

### Srednje

**J1 · Leteči štart: vodilni avti kolone vso dirko brez časov TV sektorjev** · `js/core.js:6901` (`Race._sectors`), vzrok v `js/core.js:5991–5993` (`Race._flyColumn`)
- `_sectors` zapre sektor samo, če avto prečka njegovo črto v enem koraku (`d1 - ds >= at` → `return`), in nima zanke za dohitevanje. `_flyColumn` avtom, ki so ob štartu že čez črto, nastavi `lap`, `lapStart` in dohiti kontrolne točke (`c.cp`, `splits`), `secN` pa ostane 0: avto, ki začne za koncem 1. sektorja, čaka na črto 1. sektorja 1. kroga, ki je ne prečka nikoli več.
- **Primer:** Trois-Rivières (`troisrivieres`, S1 = 700 m), v meniju Opponents 40 tekmecev (več kot 21 da leteči štart tudi na krožni progi, `js/game.js:2266`). Simulacija v Node (2 kroga): 5 vodilnih avtov (štart 720–836 m za črto) ima na cilju `secN = 0`. `race.secBest` je samo iz ostalih, zato je igralčev sektor lahko vijoličen (»najboljši v dirki«), čeprav so bili vodilni hitrejši, in komentator reče `secPurple` (`js/game.js:4142`). Enako na drugih krožnih progah s sektorji, kjer kolona seže čez S1 (`marrakesh` 940 m, `toronto` 1000 m, `cpalace` 1150 m, `rbring` 1400 m). `_thirds` (proge brez TV sektorjev) ima zanko in te napake nima.
- Preverjeno: potrjeno (simulacija).

### Nizke

**J2 · Varnostni avto: avta, ustavljena skupaj, se ne štejeta, če sta krog narazen** · `js/core.js:6437` (`Race._flags`)
- `heavy` primerja razdaljo dirke (`Math.abs(o.dist - c.dist) < 60`), ne mesta na progi; rdeča zastava v isti funkciji (`js/core.js:6431`) primerja mesto (`o.q.s - c.q.s`, ovito na dolžino kroga).
- **Primer:** vodilni trči v zaostalega, ki ga prehiteva za krog; oba stojita drug ob drugem 2,5–6 s z `dmg` ≤ 0,5 in nato odpeljeta: pride samo rumena zastava. Enak trk dveh avtov v istem krogu po 2,5 s pripelje varnostni avto.
- Preverjeno: potrjeno (branje kode).
