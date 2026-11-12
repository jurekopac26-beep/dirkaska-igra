# Nove proge 11: zamenjave za Peru, Kenijo, Dominikansko republiko in Kubo

Želja uporabnika 12. 11. 2026: Chachani, Elmenteita, Barahona in Viñales zamenjati s progami iz drugih držav, z enakomernejšo razdelitvijo po celinah, z različnimi progami in z veliko zanimivega do 60 m ob cesti. Brez PR, `main` ni spremenjen. Mape in orodje kot na veji `slike/nove-proge-10`.

## Celine (prave proge, na odločanju, odprti PR in načrti; približno)

| Celina | Prej (z 9 iz `nove-proge-10`) | Po odstranitvi 4 | Po zamenjavi |
|---|---|---|---|
| Evropa | ~28 | ~28 | ~28 |
| Azija | ~20 | ~20 | ~20 |
| Afrika | 9 | 8 | 8 |
| Južna Amerika | 7 | 6 | 6 |
| Severna in Srednja Amerika, Karibi | 7 | 5 | **6** |
| Oceanija | 3 | 3 | **6** |

## Izbrane štiri

| Proga | Mapa | Celina, vrsta | Meritve | 60 m ob cesti | Pregrada ≤ 3 m |
|---|---|---|---|---|---|
| Canaries, Sveta Lucija | `canaries` | Karibi; obalna gorska cesta skozi ribiško vas | 1,97 km, 857 °/km, ravnine 31 %, 18 ovinkov, 3 lasnice, +99 m (5,0 %) | 215 stavb (ob 62 %), obala ob 7 %, 2 razgledišči, 2 potoka, 1 most, 10 stranskih cest | 25 % |
| Savusavu, Fidži | `savusavu` | Oceanija; ravna ovinkasta cesta iz mesta ob zalivu po dolini | 2,48 km, 451 °/km, ravnine 51 %, 11 ovinkov, 0 lasnic, ±1 m | 201 stavba (ob 91 %), 5 mostov, 17 stranskih cest | 0 % |
| Vaoala, Samoa | `vaoala` | Oceanija; vzpon skozi vasi na hribe nad Apio | 1,99 km, 378 °/km, ravnine 47 %, 10 ovinkov, 0 lasnic, +178 m (8,9 %) | 100 stavb (ob 78 %), 17 stranskih cest | 18 % |
| Koror, Palau | `koror` | Oceanija; spust z grebena med mangrove do mostu na sosednji otok | 2,24 km, 384 °/km, ravnine 51 %, 12 ovinkov, 0 lasnic, −69 m (3,1 %) | 54 stavb, voda ob 9 %, mangrove 14 %, 5 mostov, 11 stranskih cest | 4 % |

Za primerjavo ostalih pet (60 m): Batangas 26 stavb, 7 stranskih; Quezaltepeque 19 stavb, 3 razgledišča, 11 stranskih; Kanaba 16 stavb; Hải Vân 12 stavb, 2 razgledišči; Sogeri skale ob 29 %.

## Pregledane in zavrnjene kandidatke

- **Karibi in Srednja Amerika**: Ocho Rios, Jamajka (626 °/km, 96 stavb, 2 mosta; manj predmetov kot Canaries); Arenal, Kostarika (497 °/km, ravno ob jezeru, ob cesti samo gozd, 0 stavb).
- **Fidži**: Nausori Highlands (makadam, 743 °/km, a ob cesti samo trava); Coral Coast (216 °/km); Tamavua, Suva (pod 300 °/km).
- **Samoa**: Le Mafa (459 °/km, a samo 3 stavbe in gozd).
- **Palau in Salomonovi otoki**: Babeldaob, Palau (220 °/km); Tasahe, Salomonovi otoki (496 °/km, 65 stavb; Koror ima več vode in mostov).
- **Vanuatu**: Mele in vzhodni Efate (328 in 179 °/km, dolge ravnine).

## Viri in licence

- Ceste, stavbe, vode, razgledišča: © avtorji OpenStreetMap, ODbL 1.0 (`api.openstreetmap.org`).
- Višine: Copernicus DEM GLO-30 (© DLR e.V. 2010–2014 in © Airbus Defence and Space GmbH 2014–2018, licenca Copernicus; ESA). Raba tal: ESA WorldCover 2021 v200, CC BY 4.0.
- Brez Google Maps, Earth in Street View. Imena so samo zemljepisna (kraj, država).

## Predaja

- Orodje in vsi preizkušeni odseki so v `orodje/` (`proge.json`; uporaba kot v README veje `slike/nove-proge-10`). Največji nakloni so iz 30 m višin in ob strmih pobočjih pretirani.
