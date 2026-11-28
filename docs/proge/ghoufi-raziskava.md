# Ghoufi, Alžirija: raziskava kraja (dodelava, 28. 11. 2026)

[← Ghoufi](ghoufi.md) · proga `ghoufi` · dodelava po `docs/dodelava-prog.md` (ocena vrzeli 4). Obcestje (skalni rob, police, grmi, zidovi, steza do razgledišča) je v odprtem PR #1078 (partyslo, `js/world-ghoufi-obcestje.js`), zato ga ta dodelava ne spreminja.

## Lega in višina
- Gorovje Aurès, pokrajina Batna, Alžirija; kanjon reke Oued Labiod (OSM pot 335697911: `name:fr` Ighzer Amellal, `alt_name` Oued Labiod), dolg 3–4 km [1][2].
- Proga po cesti `Route Touristique` (OSM pot 308263161, `highway=unclassified`), ki se navezuje na državno cesto RN 31 (OSM pot 1130842164) [3].
- Višina proge 724–741 m (Copernicus DEM GLO-30); kanjon v igri 70–80 m globok (DEM ga zgladi; javni opisi navajajo do ~200 m od roba do dna [5]).

## Podnebje, rastje, tla
- Polsuho; najbolj vodnato spomladi (marec–maj), ko reko polnita dež in taljenje snega [4][6].
- Dno kanjona: ozek pas dateljnovih palm in vrtov (OSM poti 520836757 in 520836760, `landuse=orchard`, `trees=date_palms`) [3][5]; nad njim gola okrasta skala z redkim grmičevjem (ESA WorldCover).
- Kamnina: plastovite, skoraj navpične stene apnenca in mehkega peščenjaka, ki se ga da klesati [2][4].

## Gradnja
- Stara berberska vas na steni kanjona, stara okoli 400 let, naseljena do 70. let 20. stoletja; hiše iz lokalnega kamna in zemlje, deloma izkoriščajo naravne votline; višje na steni pod robom preidejo v vklesana (trogloditska) bivališča [1][2][5][7].
- Razgledišče `Balcon de ghoufi` (OSM vozlišče 3135560243, `tourism=viewpoint`) [3]. Območje je na UNESCO-vem poskusnem seznamu (»Les systèmes oasiens des gorges du Rhoufi et d'Oued Labiod«) [8].

## Zanimivosti do 60 m (metri od starta, `names[]`)
| m | Ime | Vir | Odmik |
|---|---|---|---|
| 15 | Route Touristique | OSM 308263161 | cesta |
| 105 | Palmov gaj oaze | OSM 520836757 | 58 m |
| 150 | Oued Labiod | OSM 335697911 | 22 m (najbližje) |
| 185 | Stara vas | [1][5], `js/world-ghoufi.js` | 22–62 m |
| 260 | Balcon de Ghoufi | OSM 3135560243 | 20 m |
| 320 | Hiše v skali | [2][5] | 20–44 m |
| 380 | Zadnje ruševine | [1], `js/world-ghoufi.js` | 22–62 m |
| 470 | Rob kanjona | OSM 1130863921 (`natural=cliff`) | 41 m |

Za startom je suha struga `Chaabat Adras N'Teslitn` (OSM 1130916934), 58 m od ceste, a pred startno črto; ni med zanimivostmi.

## Kaj je dodano
- `js/tracks/ghoufi.js`: 8 zanimivosti z vrsticami komentatorja, `fly` (prelet). 
- `js/world-ghoufi.js`: vklesana bivališča pod robom (temna odprtina, kamnit preklad, ponekod zidano čelo) na 260–385 m. **Privzeto**: velikost, število in lega vsakega (viri ne dajo tlorisov).
- Ne dodano (ni virov): živali (`zivali`) — javni viri o paši ob tej cesti niso najdeni; komentator za uvod ostaja splošen.

## Viri
1. Wikipedia, »Ghoufi« (CC BY-SA 4.0): https://en.wikipedia.org/wiki/Ghoufi
2. Wikipedia, »Abiod Valley« (CC BY-SA 4.0): https://en.wikipedia.org/wiki/Abiod_Valley
3. © OpenStreetMap contributors, ODbL 1.0 (API, 28. 11. 2026, bbox 6.158,35.049,6.170,35.058).
4. traveldojo.com, »Ghoufi«: https://www.traveldojo.com/ghoufi
5. takeyourbackpack.com, »Visit Ghoufi balconies«: https://www.takeyourbackpack.com/backpacking-in-algeria/visit-ghoufi-balconies/
6. algeria.com, »The Aurès Mountains of Algeria«: https://www.algeria.com/blog/the-aures-mountains-of-algeria
7. TSA Algérie, »Les balcons de Ghoufi«: https://www.tsa-algerie.com/les-balcons-de-ghoufi-un-ancien-village-berbere-taille-dans-une-falaise-en-peril/
8. UNESCO, poskusni seznam 6833: https://whc.unesco.org/en/tentativelists/6833/

Višine: Copernicus DEM GLO-30 (© DLR/ESA); raba tal ESA WorldCover 2021 (CC BY 4.0). Spletne strani so bile prebrane prek iskalnika (neposreden dostop do Wikipedije in UNESCO iz seje ni bil mogoč); podrobnosti je dobro še enkrat preveriti.
