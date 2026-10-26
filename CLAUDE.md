# Pravila za nove proge

Veljajo za vsako progo, ki jo dodamo v igro ali izboljšamo (glej tudi razdelek »Nova proga« v `README.md`). Opis vsake proge je v `docs/proge/<id>.md`, seznam prog s povezavami v `README.md` (razdelek »Proge«).

## Ime proge: »kraj, država«
- Vsaka proga se imenuje po kraju in državi, v obliki **»Kraj, Država«** (države v slovenščini): npr. `Vršič, Slovenija`, `Bathurst, Avstralija`, `Štajerska, Avstrija`.
- To velja za polje `name` v `js/tracks/<id>.js`, za angleško ime in opis v `js/lang.js` (angleščina: `Vršič, Slovenia`) in za vse besedilo v `README.md`, `docs/proge/` in `docs/igra.md`.
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
- Dodaj angleške prevode v `js/lang.js` in test za progo po vzoru obstoječih.
- Testi (odločitev uporabnika, kombinacija): pred pushem morajo biti lokalno zeleni testi, ki se nanašajo na spremembo (Node in brskalniški; `npm run test:related` jih izbere iz `git diff` proti `main`, hiter vstop v igro `index.html?proga=<id>` je opisan v `tests/README.md`); celotni nabori (Node, brskalniški, vozila) tečejo na GitHubu v pull requestu. Celoten Node nabor lokalno traja okoli 1 h (`races.test.js` presega privzetih 15 min: `TEST_TIMEOUT_MIN=40`). Na `main` gre sprememba šele, ko so ti zeleni in jo uporabnik potrdi (sklope iz `docs/orodje-za-napake.md` je uporabnik potrdil vnaprej: na `main`, ko so testi zeleni).
- Pull request odpri samo, če uporabnik to izrecno prosi, ali za sklop iz `docs/orodje-za-napake.md` (tam je dovoljen en pull request na sklop).

## Kje je kaj (manj iskanja)
- Najprej poglej `docs/kazalo.md`: datoteke, teme po razdelkih, proge in njihovi graditelji sveta, testi po temah. Velikih datotek (`js/world.js` 3,9 MB, `docs/igra.md` 115 KB, `tests/README.md`) ne beri v celoti; poišči ime v kazalu, nato z grepom.
- Ko dodaš ali premakneš kaj, kar je v kazalu, ga posodobi.

## Orodje za napake (`docs/orodje-za-napake.md`)
- Načrt, odločitve in sklopi so v `docs/orodje-za-napake.md`. Vsak sklop je svoja seja in svoja veja (`orodje-za-napake/sklop-NN-<ime>`). Ob koncu sklopa posodobi razdelek Stanje v načrtu in uporabniku napiši kratek seznam za preizkus na telefonu.
- Orodje je samo v slovenščini: je v `js/napake.js`, gradi svoj DOM in ne uporablja `tr()`, da ga `tests/lang.test.js` ne zahteva v angleščini.
- Repozitorij je javen: slik napak, zapiskov uporabnika in seznama napak ne shranjuj v repozitorij.
- Poročila o napakah: besedilo `RRA-NAPAKE …` (oblika v načrtu) pove žig različice, progo (`id`), čas, krog in `s` (metri od štarta); `v_krogu=[…]` so imena iz kode (razlaga v kazalu). Napaka iz starejšega žiga je morda že popravljena: preveri `git log`.
- Odločitev uporabnika (26. 10. 2026, v seji, ki je naredila sklop 1): »Vseh 17 sklopov začni sam in ne sprašuj, če lahko začneš naslednjega.« Ko je sklop na `main`, seja brez vprašanja zažene novo sejo za naslednji sklop iz tabele Stanje (model `claude-opus-5-5`) z navodilom »Naredi sklop N po docs/orodje-za-napake.md«. Sklopa 0 in 8 ostaneta odložena, dokler uporabnik ne reče drugače. Uporabnika sprašuj le o odločitvah, ki so res njegove (npr. sprememba zasnove); ustavi verigo, če reče »stop«.
- Odločitev uporabnika (26. 10. 2026): vse seje delajo z naporom high (`.claude/settings.json`: `effortLevel`).
- Odločitev uporabnika (26. 10. 2026): po sklopu 3 in pred sklopom 4 se naredi sklop 3b »Stabilni testi« (opis v načrtu).
