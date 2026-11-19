# Envalira, Andora (podatki, proga še ni v igri)

[← Vse proge](../../README.md#proge) · proga `envalira` (samo podatki: `tools/envalira/`; datoteke `js/tracks/envalira.js` še ni)

Envalira (Andora): krog na ledu tik pod prelazom Port d'Envalira (2.408 m), ob glavni cesti čez prelaz. Proga z ledom s potrjenega seznama za 1.0 (`docs/proge-po-drzavah.md`, »Proge z ledom«); dolžina 0,73 km je izjema od pravila 1–5 km (uporabnik 8. 11. 2026).

- **Stanje**: pripravljeni so samo podatki (`tools/proga-podatki.py`). Nove potrjene proge brez datoteke se do ponovne potrditve uporabnika ne gradijo (`docs/vrsta.md`, odločitev 11. 11. 2026); gradnja proge, svet in test pridejo po njej.
- **Pot**: en krog (OSM `highway=raceway`, way 330829785) v smeri vozlišč poti, 730 m, zaprt; štart in cilj na prvem vozlišču kroga. Višine 2.367–2.377 m, najbolj strmo 4,7 % gor in 6,2 % dol.
- **Ovinki**: 8 ovinkov, od tega štirje ostri (polmer 14–24 m, 127–221°), 14 % ravnin, ~1.200° zavijanja na km.
- **Do 60 m ob cesti**: 6 stavb in 12 cest (med njimi glavna cesta čez prelaz) ter parkirišča; dreves ni (nad gozdno mejo). Izletna cona 0 % (krog na ledu, okoli sneg).
- **Podlaga**: led. Led kot podlaga v igri še ne obstaja; doda ga prva proga z ledom (`docs/dez-sneg.md`, oprijem 11–23 % suhega asfalta), proga dobi `ice: true` (kategorija Ice v meniju).
- **Imena**: samo zemljepisna (Envalira, Port d'Envalira, Andora). Ime športnega centra ob krogu je blagovna znamka, zato ga ni nikjer.
- **Podatki**: sredinska črta, ceste in stavbe iz OpenStreetMap (ODbL 1.0); višine Copernicus DEM GLO-30; raba tal ESA WorldCover 2021 (CC BY 4.0); višina rastja Meta / WRI. Datoteke: `tools/envalira/config.json`, `envalira.json`, `dem.png`, `far.png`, `lc.png`, `lu.png`, `chm.png`.
