# Realizem 7: mestne proge (kamera za avtom)

Ovoj `js/world-realizem7.js` nad graditelji prog (`World.ext.<id>`), naložen za njimi (`index.html`), kot `js/world-aguascalientes.js`. Datotek prog ne spreminja. Podatke izpiše `tools/realizem7/build.py` iz OpenStreetMap (zemljevidni klici API, ODbL; zasluge za vse proge so že v `README.md`, »Zasluge«).

## Katere proge (19. 11.)

- Mestne proge z `main` zunaj 15 prog paketov: El Jem, Luanda, Mombasa, Hiva, Portobelo, Seul. London, Marrakesh in Medvode so zamrznjeni (`pending`).
- Odprti PR #779, #788 in #793 spreminjajo `js/tracks/<id>.js` in `js/world-<id>.js` El Jema, Luande, Mombase, Portobela in Seula (stranske ceste, Realizem E), #793 še Hive. Mestne proge brez odprtega PR torej ni.
- Po navodilu koordinacije sta El Jem in Hiva izpuščena (#793). V ovoju sta Luanda in Mombasa. Ovoj datotek prog ne spreminja, zato se s temi PR ne prekriva.

## Ocena 1–5 (cesta / stavbe / predmeti / rastje)

| Proga | Cesta | Stavbe | Predmeti | Rastje |
|---|---|---|---|---|
| El Jem, Tunizija | 3 | 2 | 2 | 3 |
| Luanda, Angola | 3 | 2 | 2 | 3 |
| Mombasa, Kenija | 3 | 2–3 | 2 | 3 |
| Hiva, Uzbekistan | 3 | 3 | 2 | 3 |
| Portobelo, Panama | 3 | 3 | 2 | 4 |
| Seul, Južna Koreja | 4 | – | 4 | 3 |

Najslabše štiri (predmeti 2): El Jem, Luanda, Mombasa, Hiva. El Jem in Hiva sta izpuščena (#793).

## Kaj pravijo viri (OSM do 60 m od ceste)

- **Luanda**: ograje 721 m (136 m do 10 m od sredine ceste), zidovi 134 m na 40–60 m, 4 pločniki (499 m).
- **Mombasa**: nič več, kot proga že riše, zato je v ovoju prazna.
- **El Jem** (izpuščen): zidovi samo ob amfiteatru, ki ga proga riše sama; nič novega.
- **Hiva** (izpuščena, za čas po #793): zidovi 542 m na 20–60 m, podporni zid 8 m, ograje 169 m, 9 pločnikov (886 m). Obzidje in trdnjave riše proga sama, zato `city_wall` izpustim.
- **Višine stavb** (`height`, `building:levels`): proge jih že uporabljajo; nobena nova se ne ujema s stavbo brez višine.
- **Svetilke** (`highway=street_lamp`): na nobeni od štirih jih ni, zato jih ne rišem.

## Kaj je narejeno

- **Zidovi in živice**: takšni, kot jih proga riše sama (barva, debelina; višina iz OSM ali privzeta). Ponovitev zidov, ki jih proga že ima (3 m), in vsega ob znamenitostih (12 m od obrisa) generator izpusti.
- **Ograje** (`fence`, `railing`): stebrički na ~2,5 m in dva vodoravna droga, siva kovina. Višina je iz OSM, sicer 1,8 m (`railing` 1,0 m).
- **Pločniki** (`footway=sidewalk`): tlakovan pas, 0,15 m nad tlemi, z robnikom proti cesti. Rišem jih samo tam, kjer robnik leži 0,3–5 m za ograjo proge.
  - V Luandi (in Hivi) so vsi pločniki OSM v razširjenem dirkalnem pasu (med asfaltom in ograjo). Tam bi bili predmet, skozi katerega se pelje, zato jih ni.
- **Nič na cesti**: velja pravilo prog (`nrNear`, vsaj 0,8 m za ograjo).
- **Zmogljivost**: kosi po 256 m, en klic risanja na kos z vsebino; brez gledalcev, brez rastja.

## Slike (pred | po)

- `k7-luanda-1700.jpg`: ograja levo ob cesti, 5 m za ograjo proge.
- `k7-luanda-1800.jpg`: ograja in zid v ozadju.

## Ni narejeno

- **Obrisi stavb**: proge rišejo zasukane pravokotnike. Pravi obrisi bi zahtevali spremembo graditeljev prog, ki so v odprtih PR.
- **Svetilke in robniki ulic**: v OSM jih ni.
- **Stranske ceste**: ko pride #779, #788 ali #793, preveri, da ograja v Luandi ne seka ustja stranske ceste.

## Ponovitev

```
python3 -I tools/realizem7/build.py [--osm DIR] luanda mombasa
```

Generator prenese manjkajoče ploščice OSM, nato dopolni blok `<rz7>` v ovoju (ključev ne briše).

**Hiva po združitvi #793**: v `DATA` v obeh datotekah dodaj `hiva: 'HV_DATA'`, v ovoj `LOOK.hiva = { col: [0.82, 0.7, 0.54], top: [0.86, 0.75, 0.58], t: 0.45, h: [1.8, 2.2] }`, nato `python3 -I tools/realizem7/build.py hiva`. Enako za Portobelo in Seul, če ju koordinacija potrdi.
