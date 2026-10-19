# Pravila za nove proge

Veljajo za vsako progo, ki jo dodamo v igro ali izboljšamo (glej tudi razdelek »Nova proga« v `README.md`).

## Ime proge: »kraj, država«
- Vsaka proga se imenuje po kraju in državi, v obliki **»Kraj, Država«** (države v slovenščini): npr. `Vršič, Slovenija`, `Bathurst, Avstralija`, `Štajerska, Avstrija`.
- To velja za polje `name` v `js/tracks/<id>.js`, za angleško ime in opis v `js/lang.js` (angleščina: `Vršič, Slovenia`) in za vse besedilo v `README.md`.
- Za kraj izberi zemljepisno ime (kraj, prelaz, dolina, regija), ne imena dirkališča, prireditve ali podjetja. `id` ostane kratek in brez presledkov.
- Izmišljene proge, ki niso narejene po resničnih poteh, imajo v datoteki proge `test: true`: v menuju so na koncu pod naslovom »Za izbris · samo za testiranje« in ostanejo samo za testiranje. Zdaj so to Jezero Ring, Riviera, Gorski reli, Bakreni gozd, Toskana in Gromski rt. Krajša različica resnične poti (npr. Pikes Peak, Ouninpohja) je prava proga, ne testna.
- Kategorijo test bomo verjetno izbrisali, preden gre igra na Google Play. **Prog v kategoriji test ne urejaj** (ne optimiziraj, ne dodajaj grafike, ne popravljaj), razen če uporabnik izrecno prosi za točno to progo.
- Testne proge **ignoriraj** (odločitev uporabnika): na njih igri ni treba delovati, zato jih ne uporabljaj za slike pred/po, meritve obremenitve ali preverjanje sprememb. Za to vzemi pravo progo (npr. z boksi: Bathurst, Avstralija ali Spa, Belgija). Če test ali referenca zahteva kaj samo zaradi testne proge, sprememba drugih prog pa je pravilna, je dovolj, da referenco ustvariš znova z orodji repozitorija.

## Kamere in grafika (odločitev uporabnika)
- V igri je samo **ena kamera**: **za avtom** (`chase`), na telefonu pokonci in ležeče. Kamere **izometrična**, **kino** in **kokpit** so izbrisane; ne dodajaj jih nazaj. V posnetku dirke sta še TV kamere ob progi in kamera za avtom, foto način ostane.
- Grafiko izboljšuj za kamero za avtom: obzorje, nebo, oddaljeni griči, cesta pred avtom in njeni robovi, teren ob njej. Detajli, ki jih s te kamere ni videti (drobni predmeti na višini oči, notranjosti, majhni napisi, strehe od zgoraj), so odveč: poenostavi jih, da je telefon manj obremenjen.
- Obremenitev telefona: proga naj ima do ~300 klicev risanja in ~900 tisoč oglišč (`tests/golden/perf.json`), nova proga ali izboljšava pa ne sme povečati obremenitve drugih prog.

## Pravna varnost (igra gre na Google Play)
- V igri so samo zemljepisna imena. Brez logotipov, imen podjetij, lokalov, sponzorjev, prireditev in znamk avtomobilov. Table in napisi so generični ali izmišljeni.
- **Nikoli imen resničnih oseb** (vozniki, kolesarji, športniki, ustanovitelji …): ne v napisih navijačev na cesti, ne na tablah, ne v imenih ovinkov, ne v komentarju. Vedno izmišljena imena. Ovinek, ki je v resnici poimenovan po osebi, podjetju ali lokalu, dobi opisno ime, enako kot v meniju (npr. »Dvojni desni«, »Dolgi desni«, »Ovinek ob pristanišču«; seznam v `maketa-menija/README.md`).
- Podatki so iz OpenStreetMap in javnih višinskih modelov (SRTM, Copernicus DEM, USGS 3DEP …). **Nikoli Google Maps, Google Earth ali Street View**, ne njihovih podatkov ne slik.
- Vsak vir z licenco gre v `README.md` pod »Zasluge« (OSM: ODbL 1.0, izpeljani podatki v datoteki proge so prav tako pod ODbL 1.0).

## Meni (`js/menu.js`, `css/menu.css`)
- Naslovnica, izbira načina in izbira proge so nov meni v angleščini (opis v `README.md`, razdelek »Nov meni«). Meni bere progo iz igre (ime »Kraj, Država« razdeli v ime in državo, opis in angleško ime vzame iz `js/lang.js`), zato nova proga v meniju nastopi sama.
- Nova proga potrebuje **sliko za meni**: `assets/tracks/<id>.webp` in `<id>-rain.webp` (maketa terena; izris v `maketa-menija/orodja/`, glej `maketa-menija/README.md`). Zemljevid od zgoraj, prelet in helikopterski posnetek (`js/routes.js`, `assets/maps/`) sta po želji pozneje.
- Meni mora delovati pokonci in ležeče (od 360 × 640 oz. 640 × 360 naprej); po spremembi zaženi `node tests/browser/menu.test.mjs`.

## Postopek
- Po vsaki spremembi v `js/` ali `css/` zaženi `node tools/stamp.js`, za nove reference `npm run golden:update`.
- Dodaj angleške prevode v `js/lang.js` in test za progo po vzoru obstoječih; pred pushem morajo biti zeleni `npm run test:node` in brskalniški testi.
- Pull request odpri samo, če uporabnik to izrecno prosi.
