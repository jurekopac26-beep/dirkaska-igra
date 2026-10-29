# Poročilo izrisa 2b (rastro, moki, maunakea, baldy)

Veja `claude/meni-zemljevidi-izris-2b` (iz `claude/meni-zemljevidi`). Surovi izhodi so v `izris/<id>/`.

## Spremembe orodij
- `seed_raw.py`: `L1` v `geo_places.py` je čez dve vrstici, branje je bralo samo prvo (SyntaxError); zdaj bere do `}`.
- `geo_match.py`: GUESS za vse štiri proge; `rastro` v `COP` (višine proge so iz Copernicus DEM, ujemanje boljše kot s Terrain Tiles).
- `geo_places.py`: CFG za vse štiri; nove regije L1 `brazil` (-25.68, -46.47, 800 km: pokrije Rio do Rastro in Rio de Janeiro), `utah` (37.6, -110.0) in `hawaii` (19.9, -155.6). Baldy je v obstoječi `california`.
- `routes.py`: proge v TRACKS in ROADS; SUBST z angleškimi imeni iz `js/lang.js` (Rio do Rastro Falls, Top of the Serra, Viewpoint, Pavement Ends, Back on Asphalt, Radio Antenna, Lake Waiau, Summit Ridge, Switchbacks, Chairlift).
- `flyovers.json`, `landmarks.json`, `drones.json`: vnosi za vse štiri.

## Proge
