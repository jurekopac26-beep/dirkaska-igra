# Poročilo izrisa: skupina 4b (hotham, townsville, marrakesh, troisrivieres)

Veja `claude/meni-zemljevidi-izris-4b` (iz `claude/meni-zemljevidi`). Surovi izhodi so v `izris/<id>/`; `routes.py`, `intro_data.py`,
`geo_build.py`, `wide_map.py` in `intro_assets.py` niso bili zagnani z zapisom v `js/` ali `assets/`.

## Popravek orodja
- `seed_raw.py`: `L1` v `geo_places.py` je čez dve vrstici, skripta je brala samo prvo (SyntaxError). Zdaj bere do zaključnega `}`.
- `geo_match.py`: nov nabor `FIX` (ravna dirkališča): brez iskanja, ostanejo na znani štartni črti z zasukom 0 (samo višinski zamik iz DEM).

## Umestitev (`geo_match.py`)
| proga | ujemanje | mad | moved | away100 | zanesljivost |
|---|---|---|---|---|---|
| hotham | iskanje okoli Dungeys Hollow (R 1500 m) | 3,35 m | 12,8 m | 21,5 m | zelo dobra (razpon višin 345 m, zasuk 0,08°) |
| townsville | `FIX`: štartna črta iz datoteke proge (-19,27210, 146,81057), zasuk 0 | 1,52 m | 0 | 1,74 m | ravno (razpon 3 m); iskanje je dalo premik 381 m (skoraj ves polmer) in zasuk 3°, zato ni uporabljeno. Lega je zanesljiva toliko kot štartna črta iz OSM (± nekaj 10 m) |
| marrakesh | `FIX`: (31,58102, -7,98273), zasuk 0 | 0,87 m | 0 | 0,93 m | ravno (razpon 10 m); iskanje 118 m stran, 1°: ni uporabljeno |
| troisrivieres | `FIX`: (46,34737, -72,55930), zasuk 0 | 1,44 m | 0 | 1,95 m | ravno (razpon 7 m); iskanje 32 m stran, zasuk 4°: ni uporabljeno |

Sredinske črte vseh štirih so projicirane iz OSM (x vzhod, z jug), zato je zasuk 0 pravilen; izhodišče je pri vseh štartna črta.

## Kraji (`geo_places.py`)
- hotham: Dungeys Hollow → Hotham Heights, Australia, Victorian Alps, nova regija `seaustralia` (-37,2, 148,6, 1000 km: pokrije tudi Bathurst, Newcastle, Great Alpine Road in Longford).
- townsville: Australia, Queensland, regija `queensland` (-19,3, 146,8, 800 km).
- marrakesh: Morocco, Marrakesh-Safi, regija `morocco` (31,6, -8,0, 800 km).
- troisrivieres: Canada, Quebec, regija `greatlakes` (44,3, -77,8, 1000 km: pokrije tudi Montréal, Toronto in Detroit).

## Imena (`routes.py`)
- Hotham: »Razgledišče Renes« → *Valley Lookout*, »Razgledišče Danny's« → *Ridge Lookout* (razgledišči nosita imeni oseb), »Smučišče« → *Ski Field* (SUBST).
- Dirkališča: »Zavoj N« → *Turn N*, »Šikana« → *Chicane*, »Lasnica« → *Hairpin* (dodano v `NEW_EN`, velja samo za kasnejše proge; stare proge ostanejo kot so).
- Imena brez `hud` (Agdal, bulvar, pred dvorano, ob hipodromu …) se v meniju ne pokažejo, zato niso prevedena.
- DROP: nič.

## Opombe
- Townsville in Trois-Rivières: svet igre pokrije cel okvir zemljevida, zato `isle-townsville.png` in `isle-troisrivieres.png` nimata prosojnih delov (`skirt: false` nima učinka; za `wide_map.py` je otok kar cel zemljevid). Townsville: zgoraj desno je bela gmota (oddaljena kulisa sveta igre, verjetno obris Castle Hill brez teksture, ko ga gledaš od zgoraj); v `top-` in `isle-`.

## Stanje
- Lahki koraki (sredinske črte, zemljevidi od zgoraj in otoki, umestitev, kraji, `geo_far`, `geo_lc`): narejeni za vse štiri.
- Preleti (`flyover.mjs`, hitrost ≈ dolžina/27 s: Hotham 290, Townsville 105, Marrakesh 110, Trois-Rivières 90 m/s, 700 kbps): narejeni za vse štiri (~1000 sličic, ~2,8 MB).
