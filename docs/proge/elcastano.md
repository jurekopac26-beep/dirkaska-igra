# El Castaño, Venezuela (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `elcastano` (`js/tracks/elcastano.js`, svet `js/world-elcastano.js` na podatkovnem graditelju `js/world-gore.js`)

Regionalna cesta Maracay–Choroní v obalnem gorovju nad Maracayem, v pravem merilu: 7,9 km od km 4,8 nad naseljem El Castaño (~986 m) čez dva mostova ob vznožju, po dolini reke Río Madre Vieja mimo kraja La Regresiva del Diablo in v serpentinah skozi oblačni gozd narodnega parka do ~1.606 m pod prelazom. Ozka cesta (~6 m, dva pasova, brez sredinske črte), odprta cesta. Pot in zanimivosti je potrdil uporabnik 25. 11. 2026 (možnost A, ~8 km; reka v OpenStreetMap nosi ime Río Madre Vieja, uporabnik jo je imenoval Río El Castaño, v igri je ime iz OSM).

- **Dirka**: tekmeci na zaprti cesti (v meniju *Opponents* največ 40, `maxRivals`: za ciljem je ~240 m ozke ceste), leteči start kot na vseh odprtih cestah, ena vožnja do vrha. Po cilju vsak avto zapelje na svoje mesto ob cesti.
- **Kronometer**: sam proti uri, kontrolne točke z vmesnimi časi in višino, duh in medalje (zlata 4:27, srebrna 4:40, bronasta 5:01, v dežju 5:23 / 5:39 / 6:05; zlato je čas relijskega avta na avtopilotu × 1,01).
- **Promet**: dvoboj z enim tekmecem po odprti cesti, promet vozi po desni: domačini z osebnimi avtomobili in pick-upi, kombiji proti obali, veliko motoristov, nekaj manjših tovornjakov, redki kolesarji.
- **Policija**: beg pred policijo, generične patrulje z napisom POLICÍA (brez imena ali znaka katere koli službe), v rezultatih »Do prelaza v …«.
- **Ovinki**: osem ostrih ovinkov nad 125° (`curves`). Pod uro se izpišejo kraji z višino: Most · 1.002 m, Río Madre Vieja · 1.032 m, La Regresiva del Diablo · 1.361 m, Most · 1.569 m. Komentator ima na tej progi svoje stavke.
- **Oblika in višine**: sredinska črta iz OpenStreetMap (vsakih 5 m, rahlo zglajena; kraka serpentin najmanj 12,5 m narazen, konice odprte na ~6 m). Višine iz Copernicus DEM GLO-30 (brez krošenj gozda), profil najbližji modelu: največ 14 % navzgor in 6 % navzdol, prelomi zglajeni.

Okolica (`World.gore` s slogom proge v `js/world-elcastano.js`):

- **Gozd**: gost, visok (10–22 m) in moker oblačni gozd listavcev tik ob cesti na obeh straneh (raba tal ESA WorldCover 2021: skoraj ves pas ob cesti je gozd), papige v krošnjah, brez snega.
- **Voda**: reka Río Madre Vieja in potoki v strugah (OSM, `riverBeds`); trije kratki mostovi (OSM `bridge=yes`) z betonsko ploščo in nizkim betonskim parapetom na obeh straneh.
- **Cesta**: brez črt, sivo-rjava bankina, varnostne ograje v ostrih ovinkih, smerniki.
- **Obzorje**: onstran pasu ob cesti pravi teren ~10 km naokoli (Copernicus DEM, mreža 250 m, `irFar` iz `js/world-iroha.js`): grebeni obalnega gorovja.
- **Fotografije**: videz je narejen po podatkih (OpenStreetMap, ESA WorldCover, višinski model) in splošnem poznavanju kraja, brez Google Maps, Google Earth ali Street View.
- **Približki**: drevesa so razporejena po rabi tal in naklonu, ne po resničnih legah; table generične. Na sliki za meni je del pokrajine daleč od ceste brez dreves (kot na Espinazu).
- **Pravno**: samo zemljepisna imena (El Castaño, Maracay, Choroní, Río Madre Vieja, La Regresiva del Diablo); brez imena narodnega parka (nosi ime osebe).

Podatke pripravita `tools/proga-podatki.py` (nastavitve `tools/elcastano/config.json`) in `tools/elcastano/build.py` (`python3 -I tools/elcastano/build.py`: podatkovni blok in višine `ELC_H` v `js/tracks/elcastano.js`). Vire glej v `README.md` pod »Zasluge«.
