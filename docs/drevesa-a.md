# Drevesa A: cenejša grafika dreves (mehke krone)

Načrt, odločitve in stanje teme (pravilo v `CLAUDE.md`, Postopek). Vsaka odločitev je zapisana enkrat, tu.

## Odločitve
- **Uporabnik 5. 11. 2026 zvečer:** drevesa v različici **A · mehke krogle** iz prototipa (veja `wip/drevesa-a-prototip`, `tools/drevesa-a-prototip/PREDAJA.md`), da so drevesa cenejša in je ob cesti lahko več dreves; tema nadomesti redčenje gozda (prestavljeno za kasneje, `docs/vrsta.md`).
- **Uporabnik 6. 11. 2026 ob 12.23:** začne biketraveler takoj (prevzem od jure.kopac26, ki stoji do ned. 8. 11. 10.00); preverjanje na Spa (Bathurst je na izbiri); drugega novega dela biketraveler zdaj ne začne (tabla #382).

## Meje
- Cenejše, ne dražje: manj oglišč na drevo, enako ali manj klicev risanja; nobena prava proga ne postane dražja (`tests/golden/perf.json`, meja ~300 klicev in ~900 tisoč oglišč).
- Testne proge so zamrznjene (`CLAUDE.md`): njihovih datotek in graditeljev ne spreminjamo; skupna koda sme veljati za vse proge.
- Klici RNG sveta ostanejo enaki (drevesa imajo svoj `rng`), da se poznejši predmeti ne premaknejo.
- Samo kamera za avtom; slike na Spa, telefon pokonci in ležeče.

## Stanje
- 6. 11.: začetek, meritev Spa pred spremembo (`tools/obremenitev.mjs spa`): drevesa v najbolj gozdnatih vzorcih ~175–210 tisoč od ~420–520 tisoč oglišč na sličico (z njihovimi sencami), ~25 klicev.
