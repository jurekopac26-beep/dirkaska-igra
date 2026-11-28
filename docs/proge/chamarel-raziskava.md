# Chamarel, Mavricij: raziskava za dodelavo

[← Proga](chamarel.md)

## Viri (samo odprti; brez Google Maps/Earth/Street View)

- **OpenStreetMap** (© OpenStreetMap contributors, ODbL), tudi prek izvoza Overture Maps (tema `base`, samo podatki z virom OpenStreetMap):
  - cesta in omejitve hitrosti;
  - odcepi;
  - obrisi stavb;
  - razgledišče, parkirišča, grmičevje;
  - gozd narodnega parka ob koncu (`tools/chamarel/chamarel.json`).
- **Copernicus DEM GLO-30**: teren in višine.
- **ESA WorldCover 2021** (CC BY 4.0): gozd, trava in grmičevje ob cesti.
- Stavbe iz zbirk, narejenih s strojnim učenjem (v izvozu Overture), **niso uporabljene**: niso iz OpenStreetMap in ena izhaja iz Googla.

Vsi viri so že v `README.md` pod »Zasluge«.

## Kaj iz podatkov (zanimivosti do 60 m od ceste)

| m od štarta | Kaj | Razdalja | Ime pod uro |
|---|---|---|---|
| 120 | Case Noyale (kraj v OSM) | ob cesti | Case Noyale |
| 860 | gozd (WorldCover) | ob cesti | Gozd |
| 1.130 | grmičevje (OSM `natural=scrub`) | 27 m | Grmovje |
| 1.775 / 2.190 / 2.505 | lasnice (polmer 9–10 m, OSM) | cesta | Serpentine · 196 m / Druga / Tretja serpentina |
| 2.900 | razgledišče (OSM `tourism=viewpoint`) | 8 m | Razgledišče · 300 m |
| 3.065 | pešpot v gore proti vrhu Black River Peak (OSM `highway=path`) | odcep | Pešpot |
| 3.450–3.790 | vas Chamarel (kraj v OSM pri 3.693 m) | ob cesti | Chamarel |
| 3.665 | cerkev (OSM, obris ~21 × 17 m, verska stavba) | ~25 m | Cerkev |
| 3.664 | križišče: naprej cesta proti Plaine Champagne | cesta | (v vrstici pri cerkvi) |
| 4.405 | parkirišče ob cesti (OSM, že ravna ploščad v igri) | 7 m | Postajališče |
| 4.755 | zadnji vzpon | cesta | Proti Plaine Champagne · 341 m |
| 4.930 | gozd narodnega parka sotesk Rivière Noire (OSM) | ob cesti | Gozd nad Rivière Noire |

Dlje od 60 m (ne kot ime, samo za značaj okolice):
- njive ob obali (111 m);
- igrišče v vasi (265 m);
- ribniki (od 176 m naprej).

Imena so samo zemljepisna ali opisna:
- parkirišče gozdarske službe ostane brez imena;
- cerkev nima imena;
- narodni park je opisan kot gozd nad soteskami reke Rivière Noire.

## Spremembe v igri

- 13 imen pod uro namesto 6, vsako z 2–3 vrsticami komentatorja; angleška imena v `js/lang.js`.
- Cerkev v vasi (`js/world-chamarel.js`): obris iz OSM nadomesti splošno hišo z belo cerkvijo. Ima:
  - podstavek iz bazalta;
  - rdečo pločevinasto dvokapno streho;
  - nizek zvonik na eni strani.

## Predpostavke (brez vira)

- Videz cerkve (bela, rdeča streha, zvonik) je splošen za vaške cerkve na otoku. Ni po fotografiji te cerkve, napisov nima.
- Smer pešpoti (»proti najvišjemu vrhu otoka«) je samo iz imena poti v OSM.
- V vasi je v OSM samo nekaj obrisov stavb; drugih hiš igra ne doda (ni vira).
