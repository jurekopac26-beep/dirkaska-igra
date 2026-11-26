# Stavrovouni, Ciper (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `stavrovouni` (`js/tracks/stavrovouni.js`)

Cesta na Stavrovouni, osamljen suh hrib na vzhodnem robu gričevja pod Troodosom med Nikozijo in Larnako, v pravem merilu (4,5 km). Proga se začne ob vznožju hriba (325 m, ~34,90° S, 33,42° V), gre po golih pobočjih z grmičevjem in redkimi borovci, v zadnjem kilometru skozi štiri serpentine do samostana na vrhu; cilj je pod samostanom na ~639 m. Skoraj ves čas navzgor.

- **Dirka**: 21 tekmecev, štart ob vznožju, en vzpon do vrha. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, kontrolne točke z vmesnimi časi in višino, lestvica, duh in medalje (zlata 2:23, srebrna 2:30, bronasta 2:41, v dežju 2:53 / 3:02 / 3:15; zlato je čas relijskega avta na avtopilotu × 1,01).
- **Promet**: dvoboj z enim tekmecem po odprti cesti (avtomobili, kombiji, avtobusi, motoristi, ob cesti kolesarji); na Cipru se vozi po **levi** (`leftHand`).
- **Policija**: beg pred policijo do vrha; patrulje imajo samo generičen napis POLICE.
- **Imena pod uro**: Golo pobočje · 451 m, Serpentina 1 · 574 m, Serpentina 2 · 590 m, Serpentina 3 · 608 m, Serpentina 4 · 623 m, Pod samostanom · 636 m (samo zemljepisna in opisna imena; brez imena samostana in svetnikov, brez trgovin).
- **Oblika in višine**: sredinska črta iz OpenStreetMap (zglajena, najtesnejši ovinki odprti na polmer ~9 m), cesta v igri široka 8 m, po en pas v vsako smer. Višine iz Copernicus DEM GLO-30, očiščene: do ~14 % navzgor, navzdol največ ~1 %, +314 m.
- **Brez padca**: padec čez rob je samo na Killarju (odločitev uporabnika 13. 11. 2026); v serpentinah jeklena ograja.

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.stavrovouni` in lastnimi deli v `js/world-stavrovouni.js`):

- **Suh otok**: slamnata suha trava, sivo zeleno grmičevje, bel apnenec in kreda, alepski borovci (`forest: 'med'`); raba tal iz ESA WorldCover in Sentinel-2: grmičevje 62 %, trava 28 %, gozd 6 %, melišča 5 %, pozidano pod 1 %.
- **Samostan na vrhu**: obrisi stavb iz OpenStreetMap do 260 m od cilja, narisani generično: bele kamnite stene na podstavku, nizke opečnate dvokapne strehe, temna okna ob cesti, kupola cerkve in majhen zvonik, nizek kamnit zid okoli dvorišča (prekinjen ob cesti). Brez napisov, simbolov in imen.
- **Ob vznožju**: kamnite hiše vasi po obrisih iz OSM (skupni graditelj).
- **Obzorje**: pravi teren ~9 km naokoli (Copernicus DEM): gričevje, ravnina z meglico.
- **Približki**: grmičevje, borovci, skale in gledalci so razporejeni po rabi tal in legi ob cesti, ne po resničnih legah; stavbe so preproste oblike po obrisih.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py stavrovouni --zapisi`, nastavitve v `tools/proga/proge.json`). Vire glej v `README.md` pod »Zasluge«.
