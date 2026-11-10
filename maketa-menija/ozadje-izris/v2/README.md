# Ozadje menija: izris, različica 2 (maketa)

Odziv uporabnika na prve štiri makete (10. 11. 2026 ob ~22.15, prek Mateja): »Ni prava smer. Avto in tabla naj bosta na istem mestu. Samo vzadaj naj bo narava in hribi. Naj naredi nove 3 razlicne verzije.« Zato so tu tri različice za Medvode: avto je parkiran na travniku tik ob tabli, brez ceste in brez gozdnih sten ob straneh. Postavitev in velikost avta in table sta v vseh treh enaki, razlikuje se samo ozadje. Samo maketa, ni del igre; nič od tega ne gre na `main`.

| Slike (pokonci 1080 × 1350, ležeče 1600 × 900) | Ozadje | Svetloba |
|---|---|---|
| `medvode-1-alpe-pokonci.webp`, `medvode-1-alpe-lezece.webp` | Kamniško-Savinjske Alpe z zasneženimi vrhovi (Grintovec ~25 km), s travnika nad Savo pri Medvodah | zgodnje popoldne |
| `medvode-2-hribi-pokonci.webp`, `medvode-2-hribi-lezece.webp` | Šmarna gora in Grmada (~3,7 km), z zahodnega brega Save v Medvodah | popoldne |
| `medvode-3-vecer-pokonci.webp`, `medvode-3-vecer-lezece.webp` | Storžič in Karavanke (~22 km), z istega travnika kot 1 | pozno popoldne, nizko toplo sonce |

Kako bi slike izgledale v meniju igre (posnetki naslovnega zaslona, pokonci in ležeče, in ležeči izris z lastnim kadrom za meni): `meni/README.md`.

## Kako zagnati

Orodja in priprava so iz `../README.md` (isti `izris.py`, `dem.py` in `avto.mjs`). Prizori so v `../prizori.json`: `medvode-1-alpe`, `medvode-2-hribi` in `medvode-3-vecer` dopolnijo prizor `medvode` (polje `base`), postavitev avta in table je v polju `comp` (`parked`: avto na travniku, brez ceste in gozda ob njej; trava pred avtom je nižja od črte od oči do koles).

```sh
venv/bin/python dem.py prizori.json medvode /pot/dem /pot/dem-medvode.npz          # višine za 1 in 3
venv/bin/python dem.py prizori.json medvode-2-hribi /pot/dem /pot/dem-hribi.npz   # višine za 2
venv/bin/python izris.py medvode-1-alpe --dem /pot/dem-medvode.npz --car /pot/jastreb-d81f2a.json --tmp /pot/tmp --out v2/medvode-1-alpe
```

Izris ene slike traja ~5 min na 4 procesorskih jedrih (80 vzorcev, globinska ostrina z zaslonko f/8, izostreno na avto); oblaki so polje kumulusov na skupni višini baze (`cloud_field`).

Viri in licence so enaki kot v `../README.md`: višine iz Copernicus DEM GLO-30 (navedba vira tam), avto JASTREB 6 iz igre, vse drugo postopkovno; brez OpenStreetMap, Google Maps, Google Earth in Street View.
