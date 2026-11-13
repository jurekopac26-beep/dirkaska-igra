# Darvaz, Tadžikistan (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `darvaz` (`js/tracks/darvaz.js`)

Dobre štiri kilometre glavne ceste M41 (РБ04) po desnem bregu reke Panj v soteski gorovja Darvaz, ~35 km gorvodno od Kalaikhumba (začetek 38,37293 s. š., 71,17488 v. d.). Cesta je polica, vsekana v vznožje skalnih sten. Panj teče desno spodaj, na drugem bregu so samo stene. Vozi se gorvodno: čez most na stranskem potoku doline Pšiharv, ob stenah in meliščih do ovinka, kjer soteska zavije proti vzhodu. Ena kartica, štirje načini (`def.modes`):

- **Dirka**: s tekmeci na zaprti cesti (13 avtov, en krog).
- **Kronometer**: medalje na suhem 1:38 / 1:43 / 1:51, v dežju 1:57 / 2:02 / 2:12, pozimi 1:53 / 1:59 / 2:08, na snegu 2:18 / 2:25 / 2:36 (zlato = samodejni voznik × 1,01).
- **Promet**: dvoboj z enim tekmecem na odprti cesti. V obe smeri vozijo tovornjaki, avtomobili in kombiji ter kolesarji (`def.traffic`, 38 vozil). Na ozki polici pazi na tovornjake.
- **Policija**: beg pred generičnimi patruljnimi avtomobili (`def.police`), cilj »Po soteski«.
- Oblika: 3,94 km, 828° zavijanja, skoraj ravna na ~1505 m (višine 1504–1507 m, največ 3 % naklona), 4 kontrolne točke. Mesta na zaslonu po vrsti: Most čez Pšiharv, Stena nad Panjem, Soteska Darvaz (vsako s komentarjem).

## Okolica

- Gradi jo skupni svet prelazov (`js/world-prelaz.js`, `buildPrelaz`) iz podatkov orodja. `js/world-darvaz.js` doda samo videz `PL_LOOK.darvaz`.
- Gore: sivo-rjava in okrasta skala v stenah, rebrih in ploščah nad cesto, melišča in vršaji grušča do ceste, redka suha trava in nekaj grmov na policah, brez gozda in snega ob cesti.
- Voda: Panj (37 ha iz vode OpenStreetMap) v motni sivo-rjavi barvi ledeniške reke. Njegov breg je 44, 55 in 51 m od ceste pri treh imenovanih mestih, torej v pasu, ki ga vidi kamera za avtom.
- Obzorje: daljni teren ~9 km naokoli (celica 250 m), da se soteska vidi v daljavo.
- Cesta: bela prekinjena sredinska črta 3 m / 9 m, polna skozi ostre ovinke. Na strani prepada je jeklena ograja, zid proge drži vsak avto na cesti (padec čez rob je samo na Killarju).
- Dirka: generične table in transparenti (DARVAZ, M41 · PANJ), redarji in snemalci po pravilih vseh prog, gledalcev čim manj.
- Približki: vasi, bližnjice in vodovodi ob cesti niso narisani. Stene so iz višinskega modela 30 m in delno izmišljene.
- Pravno: samo zemljepisna imena. Ni imen trgovin, prevoznikov ali odprav, po katerih je cesta znana. Drugi breg (Afganistan) in meja sta samo teren, brez napisov in brez črte.

Podatki: `python3 tools/proga/proga.py darvaz --zapisi` (nastavitve v `tools/proga/proge.json`, podatki okolice v `tools/darvaz/`, pripravljeni s `tools/proga-podatki.py`). Viri so v [README, »Zasluge«](../../README.md#zasluge).
