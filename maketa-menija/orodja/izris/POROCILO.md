# Poročilo izrisa 2b (rastro, moki, maunakea, baldy)

Veja `claude/meni-zemljevidi-izris-2b` (iz `claude/meni-zemljevidi`). Surovi izhodi so v `izris/<id>/`.

## Spremembe orodij
- `seed_raw.py`: `L1` v `geo_places.py` je čez dve vrstici, branje je bralo samo prvo (SyntaxError); zdaj bere do `}`.
- `geo_match.py`: GUESS za vse štiri proge; `rastro` v `COP` (višine proge so iz Copernicus DEM, ujemanje boljše kot s Terrain Tiles).
- `geo_places.py`: CFG za vse štiri; nove regije L1 `brazil` (-25.68, -46.47, 800 km: pokrije Rio do Rastro in Rio de Janeiro), `utah` (37.6, -110.0) in `hawaii` (19.9, -155.6). Baldy je v obstoječi `california`.
- `routes.py`: proge v TRACKS in ROADS; SUBST z angleškimi imeni iz `js/lang.js` (Rio do Rastro Falls, Top of the Serra, Viewpoint, Pavement Ends, Back on Asphalt, Radio Antenna, Lake Waiau, Summit Ridge, Switchbacks, Chairlift).
- `flyovers.json`, `landmarks.json`, `drones.json`: vnosi za vse štiri.

## Proge
- `drone_page.js`, `heli.mjs`, `heli.json`: nova nastavitev `hideNames` (imena mrež sveta igre, ki jih let izpusti iz izrisa in iz `worldCover`). Mauna Kea: `maFar` (pobočja, morje oblakov in vulkani na daljni lupini kamere). Brez tega je `worldCover` štel `maFar` za tla igre (`cover` 1,0), maska je skrila vso dorisano pokrajino in okoli otoka se je videla le rožnata meglica z belimi luknjami; zdaj je `cover` 0,009 in prava pokrajina je vidna.

## Proge

| proga | mad | p90 | moved | zasuk | ujemanje |
|---|---|---|---|---|---|
| rastro | 11,2 m | 26,3 m | 69 m | -0,3° | Copernicus DEM; zanesljivo (start 69 m od koordinat v `docs/proge/rastro.md`) |
| moki | 2,0 m | 4,9 m | 3221 m (polmer 3500) | -1,4° | odlično; moj začetni približek je bil ~3 km prejužen, višine so lego jasno našle |
| maunakea | 2,1 m | 5,5 m | 406 m | 0,1° | odlično; cilj 19,823° S, 155,469° Z (opis: 19,82, 155,47) |
| baldy | 1,0 m | 2,2 m | 14 m | 0,0° | odlično; cilj se z opisom ujema na ~100 m |

Rio do Rastro: višine proge so prilagojene z naklonom (start ~20 m nad modelom, kraki razmaknjeni do 13 m), zato je mad večji; lega in zasuk se z obema modeloma (Terrain Tiles mad 12,9, Copernicus 11,2) ujemata na ~15 m in 1°.

Kraji (`geo_places.py`): Rastro: start Rio do Rastro, cilj Bom Jardim da Serra (Brazil, Santa Catarina); Moki: Valley of the Gods → Cedar Mesa (USA, Utah); Mauna Kea: Mauna Kea → Puʻu Wēkiu (USA, Hawaii); Baldy: Mount Baldy → Manker Flat (USA, California). Kraj »Lauro Müller« (ime osebe) namenoma ni uporabljen.

Imena (SUBST, prevodi iz `js/lang.js`): Serpentina N → Hairpin N (NEW_EN), Cascata Rio do Rastro → Rio do Rastro Falls, Alto da Serra → Top of the Serra, Mirante → Viewpoint, Konec asfalta → Pavement Ends, Konec makadama → Back on Asphalt, Radijska antena → Radio Antenna, Jezero Waiau → Lake Waiau, Vrhnji greben → Summit Ridge, Serpentine → Switchbacks, Žičnica → Chairlift. Imen oseb, podjetij ali lokalov med imeni ni, DROP ni bil potreben.

Kraji nad letom (`landmarks.json`): Rastro: Serra do Rio do Rastro, Rio do Rastro Falls, Top of the Serra, Viewpoint; Moki: Valley of the Gods, Moki Dugway, Viewpoint, Cedar Mesa; Mauna Kea: Lake Waiau (ll, snap water), Puʻu Haukea, Puʻu Wēkiu (ll, snap peak), Summit Ridge; Baldy: Mount Baldy (ll, snap town), Icehouse Canyon, Manker Flat, Mount San Antonio (ll, snap peak).

Narejeno za vse štiri: sredinske črte, zemljevidi od zgoraj in otoki (suhi in mokri, proga cela in na sredini), umestitev, okolica (far, raba tal), preleti (24–29 min na progo).
