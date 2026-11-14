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
1. **Cesta**: odseki cest iz Overture Maps (OpenStreetMap, ODbL; tema `transportation`), razrezani na priključkih, pot po najkrajši poti skozi točke `pot` (samo razredi `ROADS` ali `razredi`: brez pešpoti, kolovozov in dovozov, ki bi sekali serpentine). Prevzorčena na 1 m, zglajena (`gauss`), kraki serpentin razmaknjeni na `razmik` (privzeto 2 × polširina + 10 m). Z `odpri` (m, npr. 10,5 kot na Vršiču) so ovinki, ožji od tega polmera, odprti (vsaki dve točki na razdalji a vzdolž ceste vsaj tetiva kroga s tem polmerom narazen). Z `polmer` (m, npr. 10,5 kot na Vršiču) so ovinki, ožji od tega polmera, odprti (vsaki dve točki na razdalji a vzdolž ceste vsaj tetiva kroga s tem polmerom narazen). Izhodišče igre je štartna črta, x vzhod, z jug.
2. **Višine**: Copernicus DEM GLO-30 vzdolž črte, drseča mediana (`mediana`), monotono navzgor (`gor`), glajenje (`glajenje`), v serpentinah naklon zmanjšan na delež `serpentine` (širina `serpentine_m`), največ `naklon`. S `tesno` (cesta, ki gre tudi navzdol, `gor` false: čez jez v kotanjo za njim, k reki) je naklon omejen samo, kjer je čez mejo, in profil ostane ob modelu (sredina med najvišjo in najnižjo črto z naklonom do meje); brez tega orodje celoten vzpon razporedi znova, kar ob kratkem strmem odseku dvigne vso cesto nad teren. V datoteko gre `<IME>_H` (decimetri nad štartom, enakomerno vzdolž ceste). V igri je glajenje višin `elevSmooth` v datoteki proge: kratko (6 m), sicer se serpentine spet zgladijo v krake.
3. **Teren** (`dem`): mreža 32 m, trend na 256 m (2 bajta, 0,1 m) in ostanki (1 m) v pasu 650 m ob cesti, kot jih bere `vrPrep` (`js/world-vrsic.js`).
4. **Raba tal** (`lc`, 16 m, RLE): 0 trava, 1 gozd, 2 ruševje in grmovje, 3 pozidano, 4 skalne stene, 5 voda, 6 sneg, 7 melišča in golo tla. Iz ESA WorldCover 2021, popravljeno s Sentinel-2 (sneg po NDSI, golo po NDVI < `ndvi_golo`, zelena trava), drevesa pod 3,5 m po karti višin krošenj (Meta/WRI) so ruševje, strmo golo (> ~38°) so stene, voda samo v jezerih iz OpenStreetMap.
5. **Barve tal** (`col`): Sentinel-2 v pravih barvah na mreži terena (5-6-5), senčenje terena ob času posnetka odstranjeno, svetlost poravnana.
6. **OpenStreetMap** (Overture): stavbe (`bld`: najmanjši pravokotnik, vrsta po velikosti; samo obrisi iz OpenStreetMap, ne strojno narisani obrisi drugih virov v Overture; od Medeuja, Bâleini podatki so starejši), jezera (`lakes`), potoki (`streams`), žičnice (`cables`, `pylons`), parkirišča ob cesti (`pulls`), daljnovodi (`power`: črte do 400 m od ceste, `poles`: drogovi in stebri; samo kjer so).
7. **Daljni teren** (`farDem`): višine ~`dalec` m naokoli na mreži `dalec_celica` (2 bajta: `lo` + v / 2), vodna vozlišča kot izmenični teki; bere ga `irFar` (`js/world-iroha.js`). Z nastavitvijo `led: true` še ledeniki (`ice`: vozlišča razreda sneg in led ESA WorldCover kot izmenični teki; Furka), ki jih `plFarIce` v `js/world-prelaz.js` pobarva belo in sivo (spodaj z ruševinami prekrit jezik).
8. **Drevesa** (`trees`, če `drevesa` > 0): vrhovi krošenj nad 2,5 m iz karte višin krošenj v pasu `drevesa` m (največ 4000).
9. Izpiše še predlog `curves` (serpentine nad 150° ali nad `lasnica`), `cps`, `finish`, `alt`, `realKm`; z `--zapisi` gredo v blok med `// ---- podatki (tools/proga) ----` in `// ---- konec podatkov ----` v datoteki proge, vse drugo v njej (imena, komentator, opis, medalje) je ročno.

## Nastavitve (`proge.json`)
`ime`, `okvir` [lat0, lon0, lat1, lon1] (iskanje v Overture), `pot` (točke [lat, lon], skozi katere gre pot; prva pred zaletom, zadnja na koncu ceste), `start`, `cilj` [lat, lon], `zalet` (m pred štartom, ~160 za mrežo 22 avtov), `po_cilju` (m za ciljem: mesta za avte po cilju potrebujejo ~180 m), `polsirina`, `gauss`, `razmik` (najmanjši razmik med kraki serpentin, m), `polmer` (najmanjši polmer sredine ceste, m: OSM-jeve ostre konice serpentin odpre v največ `polmer_it` korakih, nato kraka spet razmakne), `odpri` (m: ovinke, ožje od tega polmera, odpre kot na Vršiču; Medeu, Llogara), `lasnica` (stopinje: od tod naprej je ovinek serpentina, privzeto 150), `razredi`, `dovoli` (poti OSM, npr. `"w227761246"`, ki jih pot sme uporabiti ne glede na razred: cesta proge, ki jo ima OSM v gradnji, pri Overture razred `unknown`), `visine` {`mediana`, `glajenje`, `naklon`, `serpentine`, `serpentine_m`, `gor`, `dol` (proga se vozi navzdol: profil pada do cilja), `tesno`}, `kriz` {`dy`, `zgoraj`} (cesta gre sama pod sabo, Sa Calobra: krak `prvi` ali `drugi` je na mostu, med voziščema najmanj `dy` m; razmikanje krakov križanje pusti, kot je), `s2` (ime posnetka Sentinel-2, npr. `S2C_35TLL_20250726_0_L2A`), `ndvi_golo`, `krosnje`, `dalec`, `dalec_celica`, `drevesa`, `ime_h`, `vrh` (uradna višina vrha za tablo in HUD na cilju, če se očiščen profil od nje razlikuje za meter ali dva), `desetinka` (true: višina cilja v `alt` na desetinko metra, da so vmesne višine v igri, ki jih `altAt` razteza po vzponu, točne tudi pri majhnem vzponu; Llogara).

**Posnetek Sentinel-2**: `python3 -c "from lib import *; [print(s[5], s[1], s[0]) for s in sorted(s2_scenes(lat, lon, [7, 8, 9], [2024, 2025]), key=lambda s: s[1])[:10]]"` (v `tools/proga/`): jasen poletni posnetek; oblačnost je za celo ploščico, zato preveri območje (`pregled.py`). Ploščica z `nodata` (rob orbite) ima lahko ničle čez progo.

## Pasti
- Overture `connectors[].at` je delež dolžine v metrih, ne v stopinjah: razrez v ravnini stopinj zamakne priključke za deset metrov (skoki v črti).
- Brez filtra razredov najde pot po pešpoti ali kolovozu čez serpentine (prekratka proga).
- Karta krošenj (Meta) ni v ploščicah, ampak v vrsticah (65536 vrstic po ~7 KB): branje širokega pasu je drago, branje po celicah rabe tal je v redu.
- Ob meji pasov MGRS (39,8° S, Mallorca) `s2_scenes` išče napačno ploščico (`31SDE`, v vedru je `31TDE`): posnetek vpiši v `s2` ročno (seznam vedra s predpono `sentinel-s2-l2a-cogs/31/T/DE/`).
- Posnetek Sentinel-2 ob robu orbite ima lahko nad progo prazne celice (nodata; Kotor: `S2B_34TCM_20250806`): po koraku `data` preveri barve tal ob progi in po potrebi vpiši v `s2` drug posnetek (Kotor: `S2C_34TCM_20250722`).
- `earth-search` (STAC) ni dosegljiv: posnetke Sentinel-2 najde seznam vedra `sentinel-cogs` (`s2_scenes`).
- Wikimedia Commons in Mapillary iz ukazne vrstice tega okolja nista dosegljiva (proxy 403); za fotografije (seja B) poskusi podagenta `web-fetch`, sicer se primerjava opre na opise in znanje o kraju.
