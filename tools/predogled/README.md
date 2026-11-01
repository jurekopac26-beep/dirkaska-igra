# Predogled prog iz kamere igralca

Orodja, s katerimi so bili izbrani in preverjeni odseki 16 prog iz `docs/gorske-proge.md`. Iz OpenStreetMap (glavni API) in višinskega modela (Terrain Tiles na AWS) naredijo sliko, kakršno vidi kamera za avtom, ko je telefon pokonci (kot v `js/render.js`: 46 m od točke pogleda, 39° navzdol, vidni kot 58°, megla 62–253 m). Predmeti so preproste oblike, ne grafika igre.

- `proge.json`: podatki prog (obseg OSM, ime ceste `key`, odsek `sec` ali mesto avta `car` [lat, lon, smer], poudarek `focus`, slog `cfg`).
- `pripravi.py <id...>`: prenese OSM in višinske ploščice v `podatki/` (ni v repozitoriju) in naredi sceno (`prep.py`).
- `shoot.mjs <id...>`: slika `podatki/out/<id>.png` (Chromium s programskim WebGL, kot brskalniški testi).
- `scan.py <razred> <datoteka.osm> [ime ceste]`: za vsako cesto najbolj zavit odsek 2,75 km, serpentine in delež odseka, ko je glavni element (`lift`, `piste`, `water`, `farm`, `cliff`, `bridge`, `tunnel`) v kadru.

Primer: `python3 -I tools/predogled/pripravi.py ella && node tools/predogled/shoot.mjs ella`.

`prep.py` (izvoz OSM v lokalne metre, sestavljanje cest in obročev mnogokotnikov, izbira odseka) je osnova za uvoznik `tools/proga-uvoz.mjs`.
