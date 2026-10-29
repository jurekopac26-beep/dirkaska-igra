# Izris 3b: toronto, medvode, montreal

Pomožna seja za predlog 5 (zemljevid od zgoraj, prelet, helikopter). Surovi izhodi so v `izris/<id>/`; v `js/` in `assets/` nisem pisal.

## Spremembe orodij
- `seed_raw.py`: popravek branja `L1` iz `geo_places.py` (slovar je čez dve vrstici, `eval` prve vrstice je padel).
- `geo_match.py`: GUESS za tri proge; polmer iskanja 0 = ravno dirkališče, postavljeno na znano točko z zasukom 0 (samo ocena, brez iskanja).
- `geo_places.py`: CFG za tri proge, nova regija L1 `stlawrence` (44.6, -76.5, 800 km: Toronto in Montréal).
- `routes.py`: TRACKS (+ toronto, medvode, montreal), ROADS (+ medvode), SUBST (Medvode).
- `flyovers.json`, `landmarks.json`, `drones.json`: vnosi za tri proge.

## Toronto, Kanada (`toronto`)
- Umestitev: ravno dirkališče (razpon višin 12,3 m), postavljeno na štartno črto iz `js/tracks/toronto.js` (43.63408 N, 79.41205 W), zasuk 0 (svet proge je iz projiciranih črt OSM, x vzhod). Višine se ujemajo: mad 0,13 m, p90 0,3 m, odmik 81,3 m (= višina starta v datoteki proge); 100 m stran mad 0,65 m. moved 0 (ni iskanja). Zanesljivost: dobra (lega iz datoteke proge, višine 3DEP potrdijo).
- Zemljevid: proga cela in na sredini (orodje obrne dolgo os po širini, jezero je zato zgoraj).
- Imena: Zavoj N → Turn N (že v `en()`); v preletu še »Lake Ontario« (ime iz igre `jezero`, ni na HUD).
- Helikopter: Start · finish, Lake Ontario, Hairpin (Turn 3), Expressway bend (Turn 7), Toronto. Brez imen stavb (stadion, stolp).

## Medvode, Slovenija (`medvode`)
- Umestitev: iskanje okoli cilja (Stari grad nad Smlednikom). Prva ocena je bila 2,7 km stran; ponovno iskanje okoli najdene lege (polmer 800 m): mad 3,29 m, p90 8,5 m, moved 8,1 m, odmik 317,1 m (višina starta v datoteki 316,8 m), 100 m stran 7,27 m. Cilj pride na 46.1650 N, 14.4421 E (491 m). Zanesljivo.
- Zemljevid: proga cela, start levo.
- Imena (SUBST): Krožišče · Medvode → Medvode Roundabout, Krožišče · Smlednik → Smlednik Roundabout, Zbiljsko jezero → Lake Zbilje, Most čez Savo → Sava Bridge, Smledniški hrib → Smlednik Hill, Stari grad · 500 m → Old Castle · 500 m. Imena ulic (Gorenjska cesta, Zbiljska cesta), Na klancu, Zbiljski gaj, Zbilje, Valburga ostanejo (zemljepisna).

## Montréal, Kanada (`montreal`)
- Umestitev: ravno dirkališče (višine v igri 0), postavljeno na štartno črto iz `js/tracks/montreal.js` (45.50178 N, 73.52325 W), zasuk 0. mad 0,36 m, odmik 9,9 m (otok ~10 m). Zanesljivost: lega iz datoteke proge; višine ne povedo nič, zasuk ni preverjen. Lasnica (d 2902) pride na 45.5142 N, 73.5275 W, na severni konec otoka, kot mora.
- Imena: Zavoj N → Turn N; v preletu še »Rowing Basin« (ne »Olympic«).
- Helikopter: Start · finish, Hairpin (Turn 10), Rowing basin, St. Lawrence, Montréal.
