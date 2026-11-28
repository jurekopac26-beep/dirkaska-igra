# Kudowa-Zdrój, Poljska (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `kudowa` (`js/tracks/kudowa.js`)

Spodnji del Ceste stotih ovinkov (DW387) v Stołowih gorah ob češki meji, v pravem merilu (7,5 km): najbolj ovinkast del ceste. Proga se začne pod Lisio Przełęczjo (~779 m, ~50,46° S, 16,35° V), gre čez prelaz (~798 m) in nato ves čas navzdol skozi smrekov in bukov gozd ob potoku, ovinek za ovinkom, do prvih hiš Kudowe Górne (~432 m); cilj je tik pred njimi, za ciljem je še ~200 m ceste. Po en pas v vsako smer, promet vozi po desni, gozd tik ob cesti.

- **Dirka**: 21 tekmecev (v meniju *Opponents* do 40, `maxRivals`: kratka cesta za ciljem), štart pod prelazom, en spust do doline. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica, duh in medalje (zlata 3:13, srebrna 3:22, bronasta 3:38, v dežju 3:50 / 4:01 / 4:19; pozimi 3:43 / 3:54 / 4:12, v dežju 4:31 / 4:45 / 5:06; zlato je čas relijskega avta na avtopilotu).
- **Promet**: dvoboj z enim tekmecem po odprti cesti (avtomobili, kombiji, avtobusi, kak tovornjak, motoristi, ob cesti kolesarji).
- **Policija**: beg pred policijo do doline; patrulje imajo samo generičen napis POLICE.
- **Imena pod uro**: Lisia Przełęcz · 798 m, Pod Lustrzano goro · 726 m, Ob potoku · 581 m, Serpentina · 483 m, Kudowa Górna · 447 m (samo zemljepisna in opisna imena; brez imen zdravilišča, penzionov in trgovin).
- **Oblika in višine**: sredinska črta iz OpenStreetMap (zglajena, najtesnejši ovinki odprti na polmer ~9 m), cesta v igri široka 7 m. Višine iz Copernicus DEM GLO-30, očiščene: po prelazu ves čas navzdol, največ 13 %.
- **Brez padca**: gozd in brežine ob cesti, v ovinkih lesene in jeklene ograje (kjer je ni videti, nevidna stena); padec čez rob je samo na Killarju. Izletna cona (do ~3 m od asfalta) je na manj kot 2 % dolžine.

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.kudowa` in lastnimi deli v `js/world-kudowa.js`):

- **Poletno jutro v gozdnatem hribovju**: gost smrekov in bukov gozd tik ob obeh straneh ceste, jase s travniki, svetel peščenjak, kjer pobočje pogleda iz gozda (raba tal iz ESA WorldCover in Sentinel-2: gozd 81 %, travniki 12 %).
- **Ob cesti**: dve izogibališči, daljnovod, na koncu hiše Kudowe Górne s strmimi strehami iz rdeče in rjave opeke (obrisi 233 stavb iz OpenStreetMap, generične, brez napisov).
- **Obzorje**: pravi teren naokoli (Copernicus DEM): gozdnati hrbti Stołowih gor in dolina proti Kudowi.
- **Cesta**: sredinska črta, robne črte, lesene in jeklene ograje v ovinkih; nobenih imen podjetij ali znakov služb.
- **Dirka**: štart z lučmi, portali kontrolnih točk z višino, cilj s tablo; malo gledalcev, redarji in snemalci.
- **Približki**: drevesa, skale in gledalci so razporejeni po rabi tal in legi ob cesti, ne po resničnih legah; hiše so preproste oblike po obrisih.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py kudowa --zapisi`, nastavitve v `tools/proga/proge.json`). Vire glej v `README.md` pod »Zasluge«.
