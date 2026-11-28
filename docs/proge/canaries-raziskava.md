# Canaries, Sveta Lucija: raziskava za dodelavo

[← Proga](canaries.md)

## Viri (samo odprti; brez Google Maps/Earth/Street View)

- **OpenStreetMap** (© OpenStreetMap contributors, ODbL): cesta, obrisi 133 stavb, potoki, obala, plaža zaliva Canaries (`tools/canaries/canaries.json`).
- **Copernicus DEM GLO-30**: teren in višine (vas 0–45 m, greben 177 m, dolina 82 m).
- **ESA WorldCover 2021** (CC BY 4.0): drevesa ob vsej cesti (razred 10), pozidano v vasi.
- **High Resolution Canopy Height Maps** (Meta, WRI, CC BY 4.0): krošnje ob cesti 8–18 m, najvišje med 900 in 1.500 m (zato tam ime »Deževni gozd«).

Vsi viri so že v `README.md` pod »Zasluge«.

## Kaj iz podatkov

- Vas Canaries: 24–39 stavb do 80 m od ceste v prvih 200 m (raba tal: stanovanjsko); plaža na zahodu.
- Potok pod cesto: 2.259 m (v gozdu) in 4.119 m (dolina, 82 m).
- Zaselek na grebenu: ~16 stavb okoli 2.700 m (stanovanjsko); v OSM brez imena, zato splošno ime »Zaselek«.

## Predpostavke (brez vira)

- Videz hiš (lesene, pisane, na stebrih, verande, pločevinaste strehe) je splošen za zahodno obalo otoka, ne po posameznih hišah.
- Pirogi na plaži: splošno za ribiške vasi na otoku; število in lege so izmišljeni.
- Vrste dreves (deževni gozd, kokosove palme ob obali, bananovci in sadno drevje ob hišah) so po splošnem opisu otoka; posamezna drevesa niso po resničnih legah.
- Rastje ob cesti (2. krog, `js/world-canaries.js` `roadside`): drevesna praprot, heliconia in divja banana v gozdu (gostejše nad 70 m), kroton in hibiskus na vrtovih vasi in zaselka. Vrste po splošnem opisu otoka, lege izmišljene (determinističen razpored).
- Prepusta: betonska parapeta tam, kjer OSM potok (`def.streams`) prečka cesto (okoli 2.259 m in 4.119 m); videz parapetov je splošen.
- Avtobusni nadstrešnici (vas ~150 m, zaselek ~2.720 m): OSM tu nima postajališč; nadstrešnici sta splošni, ker se otoški minibusi ustavljajo ob cesti.
- Živali in drobnarije (`zivali`): koze, kokoši, čaplje, krava; rezervoar za deževnico, koča s palmovo streho, podrto deblo. Splošno, brez vira za posamezne lege.
- Zvok: vas in zaselek (`VAS`), zemljepisna širina 13,91° za murne in škržate (`PLACE`); morje in galebi iz `def.sea`.
