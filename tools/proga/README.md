# Orodje za podatke proge (`tools/proga/`)

Pripravi podatke nove proge iz odprtih virov (načrt in Recept: `docs/nove-proge.md`). Seja A ga požene in po potrebi dopolni, ne piše svojih skript.

```
pip install numpy scipy pyarrow shapely tifffile imagecodecs pyproj pillow
python3 tools/proga/proga.py <id>             # povzetek in tools/proga/raw/<id>.json
python3 tools/proga/proga.py <id> --zapisi    # in vpis v js/tracks/<id>.js
python3 tools/proga/pregled.py <id>           # raw/<id>-lc.png (raba tal s cesto), raw/<id>-col.png (barve tal)
```

Prenosi gredo v `tools/proga/raw/` (ni v repozitoriju; Bâlea ~150 MB). Vse bere po kosih (HTTP Range), brez GDAL: `lib.py` (`cog_window`).

## Kaj naredi
1. **Cesta**: odseki cest iz Overture Maps (OpenStreetMap, ODbL; tema `transportation`), razrezani na priključkih, pot po najkrajši poti skozi točke `pot` (samo razredi `ROADS` ali `razredi`: brez pešpoti, kolovozov in dovozov, ki bi sekali serpentine). Prevzorčena na 1 m, zglajena (`gauss`), kraki serpentin razmaknjeni na `razmik` (privzeto 2 × polširina + 10 m). Izhodišče igre je štartna črta, x vzhod, z jug.
2. **Višine**: Copernicus DEM GLO-30 vzdolž črte, drseča mediana (`mediana`), monotono navzgor (`gor`), glajenje (`glajenje`), v serpentinah naklon zmanjšan na delež `serpentine` (širina `serpentine_m`), največ `naklon`. V datoteko gre `<IME>_H` (decimetri nad štartom, enakomerno vzdolž ceste). V igri je glajenje višin `elevSmooth` v datoteki proge: kratko (6 m), sicer se serpentine spet zgladijo v krake.
3. **Teren** (`dem`): mreža 32 m, trend na 256 m (2 bajta, 0,1 m) in ostanki (1 m) v pasu 650 m ob cesti, kot jih bere `vrPrep` (`js/world-vrsic.js`).
4. **Raba tal** (`lc`, 16 m, RLE): 0 trava, 1 gozd, 2 ruševje in grmovje, 3 pozidano, 4 skalne stene, 5 voda, 6 sneg, 7 melišča in golo tla. Iz ESA WorldCover 2021, popravljeno s Sentinel-2 (sneg po NDSI, golo po NDVI < `ndvi_golo`, zelena trava), drevesa pod 3,5 m po karti višin krošenj (Meta/WRI) so ruševje, strmo golo (> ~38°) so stene, voda samo v jezerih iz OpenStreetMap.
5. **Barve tal** (`col`): Sentinel-2 v pravih barvah na mreži terena (5-6-5), senčenje terena ob času posnetka odstranjeno, svetlost poravnana.
6. **OpenStreetMap** (Overture): stavbe (`bld`: najmanjši pravokotnik, vrsta po velikosti), jezera (`lakes`), potoki (`streams`), žičnice (`cables`, `pylons`), parkirišča ob cesti (`pulls`).
7. **Daljni teren** (`farDem`): višine ~`dalec` m naokoli na mreži `dalec_celica` (2 bajta: `lo` + v / 2), vodna vozlišča kot izmenični teki; bere ga `irFar` (`js/world-iroha.js`).
8. **Drevesa** (`trees`, če `drevesa` > 0): vrhovi krošenj nad 2,5 m iz karte višin krošenj v pasu `drevesa` m (največ 4000).
9. Izpiše še predlog `curves` (serpentine nad 150°), `cps`, `finish`, `alt`, `realKm`; z `--zapisi` gredo v blok med `// ---- podatki (tools/proga) ----` in `// ---- konec podatkov ----` v datoteki proge, vse drugo v njej (imena, komentator, opis, medalje) je ročno.

## Nastavitve (`proge.json`)
`ime`, `okvir` [lat0, lon0, lat1, lon1] (iskanje v Overture), `pot` (točke [lat, lon], skozi katere gre pot; prva pred zaletom, zadnja na koncu ceste), `start`, `cilj` [lat, lon], `zalet` (m pred štartom, ~160 za mrežo 22 avtov), `po_cilju` (m za ciljem: mesta za avte po cilju potrebujejo ~180 m), `polsirina`, `gauss`, `razmik`, `razredi`, `visine` {`mediana`, `glajenje`, `naklon`, `serpentine`, `serpentine_m`, `gor`}, `s2` (ime posnetka Sentinel-2, npr. `S2C_35TLL_20250726_0_L2A`), `ndvi_golo`, `krosnje`, `dalec`, `dalec_celica`, `drevesa`, `ime_h`.

**Posnetek Sentinel-2**: `python3 -c "from lib import *; [print(s[5], s[1], s[0]) for s in sorted(s2_scenes(lat, lon, [7, 8, 9], [2024, 2025]), key=lambda s: s[1])[:10]]"` (v `tools/proga/`): jasen poletni posnetek; oblačnost je za celo ploščico, zato preveri območje (`pregled.py`). Ploščica z `nodata` (rob orbite) ima lahko ničle čez progo.

## Pasti
- Overture `connectors[].at` je delež dolžine v metrih, ne v stopinjah: razrez v ravnini stopinj zamakne priključke za deset metrov (skoki v črti).
- Brez filtra razredov najde pot po pešpoti ali kolovozu čez serpentine (prekratka proga).
- Karta krošenj (Meta) ni v ploščicah, ampak v vrsticah (65536 vrstic po ~7 KB): branje širokega pasu je drago, branje po celicah rabe tal je v redu.
- `earth-search` (STAC) ni dosegljiv: posnetke Sentinel-2 najde seznam vedra `sentinel-cogs` (`s2_scenes`).
- Wikimedia Commons in Mapillary iz ukazne vrstice tega okolja nista dosegljiva (proxy 403); za fotografije (seja B) poskusi podagenta `web-fetch`, sicer se primerjava opre na opise in znanje o kraju.
