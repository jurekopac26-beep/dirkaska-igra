# Envalira, Andora (krog na ledu)

[← Vse proge](../../README.md#proge) · proga `envalira` (`js/tracks/envalira.js`, svet `js/world-envalira.js` na skupnem graditelju `js/world-rbring.js`; podatki `tools/envalira/`)

Envalira (Andora): krog na ledu tik pod prelazom Port d'Envalira (2.408 m), na ~2.370 m nad glavno cesto čez prelaz. Proga z ledom s potrjenega seznama za 1.0 (`docs/proge-po-drzavah.md`, »Proge z ledom«); dolžina 0,73 km je izjema od pravila 1–5 km (uporabnik 8. 11. 2026). Zgrajena po odločitvi uporabnika 24. 11. 2026 (tabla #382, »zgradi takoj; rok 1. 12. ne velja več«).

- **Pot**: en krog (OSM `highway=raceway`, pot 330829785) v smeri vozlišč poti, v smeri urinega kazalca, 721 m na naši črti (0,73 km), 8 krogov; štart in cilj na prvem vozlišču kroga. Skoraj ravno: ~10 m med najnižjo in najvišjo točko, najbolj strmo ~5 %.
- **Ovinki**: Prva lasnica (dolga desna), Levi lok, S-zavoji, Druga lasnica (dolga desna), Ciljna ravnina.
- **Podlaga**: led v vsakem letnem času in vremenu (`ice: true`): oprijem in zavore ×0,2 suhega asfalta (`COLD.ice` v `js/core.js`, v pasu 11–23 % iz `docs/dez-sneg.md`, zgornji del: zimske gume na urejenem ledu); dež ne šteje (`rk` 0, kot sneg na snegu); avti imajo zimske gume. Fizika se spremeni samo za to progo, v okviru izjeme »Dež in sneg«. Meni jo uvrsti v kategorijo **Ice**.
- **Svet**: sneg vse leto (`forceSeason: 'winter'`), ob obeh robovih ledu nasipi spluženega snega 2,5 m od roba (`edgeBar`, `LK.allWall`), led svetlo modro bel; 9 stavb ob krogu (OSM) pod snegom; dreves ni (nad gozdno mejo); brez peska, robnikov in reklam; na zmagovalnem odru andorska zastava.
- **Okolica (OSM, 24. 11. 2026)**: prelaška cesta CG-2 (asfalt), servisne ceste in dovozi (steptan sneg), 2 parkirišči, količki smučišč v barvi težavnosti, daljnovod 110 kV in lažji vodi na rešetkastih stebrih z žicami, 2 nadstreška črpalk (brez znamke), bočne zanke kroga pod snegom.
- **Dirkalni dan**: reflektorji na zunanji strani (OSM `lit=yes`), kontrola dirke in merjenje časa na stavbi ob startu, vrata boksov na sosednji, majhna lesena tribuna z 8 gledalci, 3 maršalske hišice z rumeno zastavo, teptalnik snega. Perf: 155 klicev, 352k oglišč (največ).
- **Imena**: samo zemljepisna (Envalira, Port d'Envalira, Pas de la Casa, Grau Roig, Canillo, Andorra, Pirineus). Ime športnega centra ob krogu je blagovna znamka, zato ga ni nikjer.
- **Podatki**: sredinska črta, ceste in stavbe iz OpenStreetMap (ODbL 1.0); višine Copernicus DEM GLO-30; raba tal ESA WorldCover 2021 (CC BY 4.0); višina rastja Meta / WRI. Datoteke: `tools/envalira/config.json`, `envalira.json`, `osm-okolica.json`, `dem.png`, `far.png`, `lc.png`, `lu.png`, `chm.png`; `tools/envalira/build.py` napiše `js/tracks/envalira.js`.
- **Približki**: nasipi so navpične bele stene (skupni graditelj), stavbe so škatle po obrisih, table generične.
- **Test**: `tests/envalira.test.js` (ime, dolžina, led, ovinki, višine, dirka na ledu, primerjava s suhim asfaltom in dežjem).
