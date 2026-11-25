# Obcestje iz OSM (grafika/obcestje-2311d)

- `osm/<id>.osm`: OSM main API `/api/0.6/map` (bbox okoli kroga), © OpenStreetMap contributors, ODbL. Ne shranjujemo ga v repo; ponovno prenesi.
- `python3 gen.py <id> <mapa_z_osmlib>` iz OSM izračuna `<id>.data.json` (lokalna projekcija iz `tools/<id>/<id>.json`, x vzhod, z jug).
- Podatki so ročno preneseni v `js/world-<id>-obcestje.js`.
