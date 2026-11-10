# Ozadje menija: izris (maketa)

Maketa naslovnega ozadja menija v slogu slike, ki jo je uporabnik poslal 10. 11. 2026 (»Takole da izgleda sem mislil«): svetel poletni dan, gorska cesta skozi gozd, naš avto, rumena tabla z državo in prave gore v daljavi. Samo maketa, ni del igre; nič od tega ne gre na `main`.

| Slika | Velikost | Prizor |
|---|---|---|
| `medvode-pokonci.webp`, `medvode-lezece.webp` | 1080 × 1350, 1600 × 900 | Medvode, Slovenija: travnik nad Savo, pogled proti Kamniško-Savinjskim Alpam (Grintovec ~25 km) |
| `pikes-pokonci.webp`, `pikes-lezece.webp` | 1080 × 1350, 1600 × 900 | Pikes Peak, ZDA: ob cesti pod Crystal Reservoir, pogled proti vrhu (~9,8 km) |

## Kako zagnati

Izris je brez povezave, v Blenderju (modul `bpy`, pogon Cycles na procesorju, odstranjevanje šuma OpenImageDenoise).

```sh
uv venv --python 3.13 venv
uv pip install --python venv bpy==5.3.0 numpy pillow scipy rasterio
# 1. avto iz igre (Playwright s Chromiumom; barva laka je v imenu datoteke, izris jo prebere od tam)
node avto.mjs /pot/jastreb-d81f2a.json d81f2a          # JASTREB 6, rdeč; Pikes Peak: 1c5fd6 (moder)
# 2. teren iz Copernicus DEM (ploščice se prenesejo v mapo dem/)
venv/bin/python dem.py prizori.json medvode /pot/dem /pot/dem-medvode.npz
# 3. izris obeh usmeritev (izhod: /pot/medvode-pokonci.webp in /pot/medvode-lezece.webp, vsaka do 300 KB)
venv/bin/python izris.py medvode --dem /pot/dem-medvode.npz --car /pot/jastreb-d81f2a.json --tmp /pot/tmp --out /pot/medvode
```

- Hiter preizkus: `--scale 0.25 --samples 24`; samo gradnja prizora brez izrisa: `--dry`; ena usmeritev: `--orient pokonci`.
- Prizori (točka pogleda, smer, sonce, meja snega in gozda, oblaki, barve, napis na tabli) so v `prizori.json`; kompozicija (cesta, avto, tabla) na vrhu `izris.py` (`COMP`, `ORIENT`).
- Trajanje na 4 procesorskih jedrih: gradnja prizora ~10 s, izris ene slike v polni velikosti s 96 vzorci ~8 min (preizkus z `--scale 0.25 --samples 24` ~20 s).

## Kaj je v sliki in od kod

- **Daljne gore in teren**: Copernicus DEM GLO-30 (javna vedra `copernicus-dem-30m` na AWS), z ukrivljenostjo Zemlje; sneg, skale, gozd in travniki po višini, naklonu in višini krošenj (DSM minus ocenjeni teren). Točki pogleda sta izbrani iz podatkov prog v repozitoriju in višinskega modela.
- **Avto**: model JASTREB 6 iz igre (`js/cars/jastreb.js`), izvožen z `maketa-menija/orodja/car_export.js`; brez znamk, številka 1.
- **Tabla**: rumena kot na sliki uporabnika, z imenom države kot v meniju (prave proge v meniju nimajo druge vrstice, zato brez »TEST«).
- **Drevesa, trava, cvetlice, skale, cesta, tabla, oblaki, nebo**: postopkovno v `izris.py` (lastno delo), brez tujih tekstur in modelov.
- **Ni uporabljeno**: OpenStreetMap (API iz okolja ni bil dosegljiv, zato je cesta ob kameri postopkovna), Google Maps, Google Earth, Street View.

## Licence in zasluge

- Višine: Copernicus DEM GLO-30: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved (prosta raba z navedbo vira). Če gre slika v igro, ta vrstica spada v `README.md` pod »Zasluge«.
- Pisava na tabli: Inter (SIL Open Font License 1.1), sicer DejaVu Sans Bold (prosta licenca DejaVu).
- Orodje: Blender (`bpy`, GPL); ni vključeno v sliko ali repozitorij.
