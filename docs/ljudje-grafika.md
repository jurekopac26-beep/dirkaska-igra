# Grafika ljudi ob progi

Tema računa partyslo (uporabnik 6. 11. 2026: »Izboljšaj grafiko ljudi«), veja `ljudje/grafika`, osnutek #432. Cilj: lepši ljudje s kamere za avtom na vseh pravih progah (prizori `World.peopleKit`, tribune, redarji, snemalci, mehaniki, redki gledalci), brez večje obremenitve telefona.

## Odločitev in stanje

- Uporabnik je 6. 11. izbral **samo izboljšavo 1 · Postava in razmerja** (vprašanje `ljudje-grafika-1` na strani Odločitve, tabla #382, komentar 6688514078). Izboljšav 2 (mehke oblike in svetloba), 3 (oblačila, lasje, pokrivala) in 4 (živahna drža in gibanje) ne delamo; njihove poskusne datoteke so samo v zgodovini veje (commit d75be46: `tools/ljudje/videz/mehko.js`, `obleke.js`, `gibanje.js`).
- 6. 11.: postava je v igri in v maketah (spodaj), reference sveta posodobljene, povezani testi lokalno zeleni; PR #432 je vpisan v vrsto (38. mesto, `docs/vrsta.md`) in ostane osnutek, dokler ni med prvima dvema.
- Na to kodo čakajo novi prizori (psi v jezeru, oranje z galebi, delavci na vrveh, rolkarji) in popravki predlogov 2, 8, 9, 10 iz `docs/ljudje-predlogi.md`.

## Postava v igri

- **Ljudje v prizorih in na tribunah** (`person` v `js/world-ljudje.js`): telo iz obročev s šestimi ali štirimi stranicami (`ring`, `loft`, `band64`, trikotniki po barvah `Tri`): široka ramena, ki se spustijo do vratu, ožji pas, boki, okroglejša glava (vrh pri ~0,235, kjer sedejo vsa pokrivala), nadlaket debelejša od podlakti in stegno od goleni, dlani, stopala naprej. Ploskev, ki jih nihče ne vidi (v drugih delih, podplati, konci udov v sklepih), ni.
- Sklepi, dolžine udov, roke za predmete in vrstni red naključnih izbir (barve, pričeska, pokrivalo) so kot pri prejšnjem telesu iz škatel, zato so prizori enaki. Postave (`BUILDS`: povprečna, vitka, čokata, široka, drobna, z ožjim pasom in širšimi boki, otroška) spremenijo samo širine in globine. Postava se izbere z `hash32` in števcem `NB`, ki ga vsak `seed` postavi na 0, ne z naključnimi števili prizora; ob vsaki gradnji sveta so ljudje enaki.
- **Pokrivala:** pod pokrivali iz `COVER` glava nima temena, `HATY` pove, kje je spodnji rob pokrivala, če je višje od 0,19. Novo pokrivalo v `HATX`, ki pokrije teme, potrebuje svoje ime v `COVER`.
- **Gledalci in osebje** (instancirani, `crowdGeo` v `js/world.js`): enaka razmerja v 165 indeksnih in 115 lastnih ogliščih (škatle: 168 in 112; spredaj na nogah en večkotnik s skupnimi oglišči), isti sklepi (kosti, vrtišča v senčilniku) in barvne skupine. Noge imajo hrbet (vidne tudi od zadaj), roke so odprte na obeh koncih.
- **Makete** (`person` v `tools/ljudje/ljudje3d.js`): isto telo, z normalami in sencami za slike predlogov. Ob spremembi telesa v igri popravi tudi maketo.
- **Meritve** (Bathurst, prej → potem): oglišča na osebo cela 689 → 676, otrok 600 → 564, tribuna 362 → 352; gledalec 168 → 165; klici risanja enaki (npr. gneča pri 950 m: 140 pri 40 m, 137 pri 18 m).
- **Svet in obremenitev** (reference `tests/golden/world.json`, 30 pravih prog): na 23 progah manj oglišč (do −5.694), na 7 od +12 do +111 (obe različici Pikes Peaka, Chapman, Tianmen, Irohazaka, Livorno, Mount Buller), ker ima skupna figura gledalca 3 lastna oglišča več in se v prstnem odtisu šteje enkrat na kos gneče; na sličico (`perf.test.mjs`, indeksna oglišča) manj ali enako: Bathurst 388k proti 393k na `main`, Medvode 380k enako, Spa 471k, klici risanja enaki v okviru šuma meritve.

## Orodje za slike prej/potem (`tools/ljudje/videz/`)

- `node tools/ljudje/videz/slike.mjs <proga> <oznaka> --prizori zar,marsali,boksi --pri 40,18 --gneca 950:1 [--film 0.25]` riše kodo iz delovne mape. Rezultati so v `test-results/ljudje/videz/<oznaka>/`: sličica s kamere za avtom, lupa, klici risanja in oglišča (vse podaje).
- Za primerjavo poženi orodje dvakrat z istimi možnostmi in v istem vrstnem redu posnetkov (pot avta pred posnetkom gneče spremeni klice risanja za 1–3):
  - `prej`: na `main` (npr. v `git worktree`), nato mapo `prej` prenesi v `test-results/ljudje/videz/` te delovne mape;
  - druga oznaka: na veji.
- `node tools/ljudje/videz/meri.mjs <proga>`: oglišča na osebo, instancirani gledalci, napake strani.
- `python3 tools/ljudje/videz/sestavi.py <oznaka> <proga> "<naslov>" "<podnaslov>" bathurst-zar-40@1.25 bathurst-marsali-18 bathurst-gneca950D-18 --izrez 1.5` sestavi sliko prej | potem za stran Odločitve, do 300 KB. Za Medvode so posnetki `medvode-kolesarji-18@1.15 medvode-piknik-18 medvode-gneca250D-18@1.3`.
