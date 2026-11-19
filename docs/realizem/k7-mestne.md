# Realizem 7: mestne proge (kamera za avtom)

Ovoj `js/world-realizem7.js` nad graditelji prog (`World.ext.<id>`), naložen za njimi (`index.html`), kot `js/world-aguascalientes.js`. Datotek prog ne spreminja (vse mestne proge so v odprtih PR #779, #788, #793 ali zamrznjene). Podatke izpiše `tools/realizem7/build.py` iz OpenStreetMap (zemljevidni klici API, ODbL; zasluge za vse štiri proge so že v `README.md`, »Zasluge«).

## Ocena 1–5 (cesta / stavbe / predmeti / rastje)

| Proga | Cesta | Stavbe | Predmeti | Rastje |
|---|---|---|---|---|
| El Jem, Tunizija | 3 | 2 | 2 | 3 |
| Luanda, Angola | 3 | 2 | 2 | 3 |
| Mombasa, Kenija | 3 | 2–3 | 2 | 3 |
| Hiva, Uzbekistan | 3 | 3 | 2 | 3 |
| Portobelo, Panama | 3 | 3 | 2 | 4 |
| Seul, Južna Koreja | 4 | – | 4 | 3 |

Najslabše štiri (predmeti 2): El Jem, Luanda, Mombasa, Hiva.

## Kaj pravijo viri (OSM do 60 m od ceste)

- **El Jem**: zidovi samo ob amfiteatru, ki ga proga riše sama; nič novega.
- **Mombasa**: nič več, kot proga že riše.
- **Luanda**: ograje 721 m (136 m do 10 m od sredine ceste), zidovi 134 m na 40–60 m, 4 pločniki (499 m).
- **Hiva**: zidovi 542 m na 20–60 m, podporni zid 8 m, ograje 169 m, 9 pločnikov (886 m). Obzidje in trdnjave riše proga sama, zato `city_wall` izpustim.
- **Višine stavb** (`height`, `building:levels`): proge jih že uporabljajo; nobena nova se ne ujema s stavbo brez višine.
- **Svetilke** (`highway=street_lamp`): na nobeni od štirih jih ni, zato jih ne rišem.

## Kaj je narejeno

- **Zidovi in živice**: takšni, kot jih proga riše sama (barva, debelina; višina iz OSM ali privzeta). Ponovitev zidov, ki jih proga že ima (3 m), in vsega ob znamenitostih (12 m od obrisa) generator izpusti.
- **Ograje** (`fence`, `railing`): stebrički na ~2,5 m in dva vodoravna droga, siva kovina. Višina je iz OSM, sicer 1,8 m (`railing` 1,0 m).
- **Pločniki** (`footway=sidewalk`): tlakovan pas, 0,15 m nad tlemi, z robnikom proti cesti. Rišem jih samo tam, kjer robnik leži 0,3–5 m za ograjo proge.
  - V Luandi in Hivi so vsi pločniki OSM v razširjenem dirkalnem pasu (med asfaltom in ograjo). Tam bi bili predmet, skozi katerega se pelje, zato jih ni.
- **Nič na cesti**: velja pravilo prog (`nrNear`, vsaj 0,8 m za ograjo).
- **Zmogljivost**: kosi po 256 m, en klic risanja na kos z vsebino; brez gledalcev, brez rastja.

## Slike (pred | po)

- `k7-luanda-1700.jpg`: ograja levo ob cesti, 5 m za ograjo proge.
- `k7-luanda-1800.jpg`: ograja in zid v ozadju.
- Hiva (1080 m, 1290 m): skoraj nespremenjena (0,01 % in 0,08 %), ker so zidovi 30–60 m stran za stavbami, pločniki pa v dirkalnem pasu.

## Ni narejeno

- **Obrisi stavb**: proge rišejo zasukane pravokotnike. Pravi obrisi bi zahtevali spremembo graditeljev prog, ki so v odprtih PR.
- **Svetilke in robniki ulic**: v OSM jih ni.

## Ponovitev

```
python3 -I tools/realizem7/build.py [--osm DIR] eljem luanda mombasa hiva
```

Generator prenese manjkajoče ploščice OSM, nato prepiše blok `<rz7>` v ovoju.
