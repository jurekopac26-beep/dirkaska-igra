# Pravila za nove proge

Veljajo za vsako progo, ki jo dodamo v igro ali izboljšamo (glej tudi razdelek »Nova proga« v `README.md`).

## Ime proge: »kraj, država«
- Vsaka proga se imenuje po kraju in državi, v obliki **»Kraj, Država«** (države v slovenščini): npr. `Vršič, Slovenija`, `Ljubljana, Slovenija`, `Bathurst, Avstralija`, `Štajerska, Avstrija`.
- To velja za polje `name` v `js/tracks/<id>.js`, za angleško ime in opis v `js/lang.js` (angleščina: `Vršič, Slovenia`) in za vse besedilo v `README.md`.
- Za kraj izberi zemljepisno ime (kraj, prelaz, dolina, regija), ne imena dirkališča, prireditve ali podjetja. `id` ostane kratek in brez presledkov.
- Izmišljene proge, ki jih ne bomo uporabljali, imajo v datoteki proge `test: true`: v menuju so na koncu pod naslovom »Za izbris · samo za testiranje« in ostanejo samo za testiranje.

## Kamere in grafika (odločitev uporabnika)
- V končni igri sta samo **dve kameri**: **izometrična** (telefon ležeče, `iso`) in **za avtom** (telefon pokonci, `chase`). Kameri **kino** in **kokpit** bosta izbrisani; zdaj sta v igri samo zaradi testiranj. Zanju ne optimiziraj in ne dodajaj novih funkcij.
- Grafiko izboljšuj za ti dve kameri. Izometrična gleda od zgoraj: pomembni so cesta in robovi, teren, strehe in krošnje, barve, senčenje. Kamera za avtom: obzorje, nebo, oddaljeni griči in cesta pred avtom. Detajli, ki jih s teh dveh kamer ni videti (drobni predmeti na višini oči, notranjosti, majhni napisi), so odveč: poenostavi jih, da je telefon manj obremenjen.
- Obremenitev telefona: proga naj ima do ~300 klicev risanja in ~900 tisoč oglišč (`tests/golden/perf.json`), nova proga ali izboljšava pa ne sme povečati obremenitve drugih prog.

## Pravna varnost (igra gre na Google Play)
- V igri so samo zemljepisna imena. Brez logotipov, imen podjetij, lokalov, sponzorjev, prireditev in znamk avtomobilov. Table in napisi so generični ali izmišljeni.
- Podatki so iz OpenStreetMap in javnih višinskih modelov (SRTM, Copernicus DEM, USGS 3DEP …). **Nikoli Google Maps, Google Earth ali Street View**, ne njihovih podatkov ne slik.
- Vsak vir z licenco gre v `README.md` pod »Zasluge« (OSM: ODbL 1.0, izpeljani podatki v datoteki proge so prav tako pod ODbL 1.0).

## Postopek
- Po vsaki spremembi v `js/` ali `css/` zaženi `node tools/stamp.js`, za nove reference `npm run golden:update`.
- Dodaj angleške prevode v `js/lang.js` in test za progo po vzoru obstoječih; pred pushem morajo biti zeleni `npm run test:node` in brskalniški testi.
- Pull request odpri samo, če uporabnik to izrecno prosi.
