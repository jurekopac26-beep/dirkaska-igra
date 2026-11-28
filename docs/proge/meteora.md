# Meteora, Grčija (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `meteora` (`js/tracks/meteora.js`)

Cesta k samostanom na stebrih Meteore nad dolino Tesalije v pravem merilu (5,9 km). Proga se začne v vasi Kastraki ob vznožju (254 m, ~39,71° S, 21,62° V), gre pod sivimi konglomeratnimi stebri skozi hrastov gozd, skozi serpentine nad vasjo do sedla na 538 m in nato rahlo navzdol do konca ceste pod zadnjim samostanom (~504 m). Pot je izbrala seja proge 26. 11. 2026 (kartica `proga-meteora-pot` na strani Odločitve: uporabnik jo potrdi ali zamenja).

- **Dirka**: 21 tekmecev, štart v vasi, en vzpon čez sedlo do konca ceste. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, kontrolne točke z vmesnimi časi in višino, lestvica, duh in medalje (zlata 3:20, srebrna 3:30, bronasta 3:46, v dežju 4:01 / 4:13 / 4:32; zlato je čas relijskega avta na avtopilotu × 1,01).
- **Promet**: dvoboj z enim tekmecem po odprti cesti (avtomobili, kombiji, avtobusi, motoristi, ob cesti kolesarji); v Grčiji se vozi po **desni**.
- **Policija**: beg pred policijo do konca ceste; patrulje imajo samo generičen napis POLICE.
- **Imena pod uro**: Kastraki · 262 m, Pod stebri · 290 m, Samostan ob cesti · 337 m, Serpentina 1 · 403 m, Serpentina 2 · 488 m, Sedlo · 538 m, Konec ceste · 505 m (samo zemljepisna in opisna imena; samostani brez imen in svetnikov, brez lokalov in trgovin).
- **Oblika in višine**: sredinska črta iz OpenStreetMap (zglajena), cesta v igri široka 7 m, po en pas v vsako smer. Višine iz Copernicus DEM GLO-30, očiščene: do ~12 % navzgor, za sedlom do ~7 % navzdol, +250 m od štarta do cilja.
- **Brez padca**: padec čez rob je samo na Killarju (odločitev uporabnika 13. 11. 2026); v serpentinah jeklena ograja, drugod ob cesti gozd, grmičevje in trava (izletna cona na manj kot polovici dolžine).

Okolica (skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.meteora` in lastnimi deli v `js/world-meteora.js`):

- **Stebri**: sivi konglomerat s temnimi progami, postavljeni na celice gole skale v rabi tal (ESA WorldCover, Sentinel-2), najvišji v vsakem polju 48 m, najmanj 35 m od ceste; do 48 stebrov, vsak od najnižjih tal do vrha in še 6–12 m nad terenom.
- **Samostani**: obrisi stavb iz OpenStreetMap več kot 1,5 km od štarta, narisani generično: kamnit podstavek, svetle ali okraste stene, opečnate dvokapne strehe, okna ob cesti, ena kupola v vsaki skupini stavb. Brez napisov, simbolov in imen.
- **Kastraki**: hiše z opečnatimi strehami po obrisih iz OSM (skupni graditelj).
- **Raba tal**: gozd 44 %, grmičevje 29 %, trava 19 %, pozidano 6 %, gola skala in melišča 1 %, vode ni.
- **Obzorje**: pravi teren ~9 km naokoli (Copernicus DEM): ravnina Tesalije, gore Pinda.
- **Približki**: stebri stojijo na skalnih celicah rabe tal, ne na resničnih legah posameznih stebrov; drevesa, grmičevje, skale in gledalci so razporejeni po rabi tal in legi ob cesti; stavbe so preproste oblike po obrisih.
- **Meni**: maketa `assets/tracks/meteora.webp` in `-rain.webp` (`maketa-menija/orodja/proge_igra.json`), posnetek Serpentine 1 `assets/maps/corner-meteora.webm` (`tools/menu-corners.json`). Obremenitev telefona: 171 klicev risanja, 386 tisoč oglišč, največ 205 in 543 tisoč (`tests/golden/perf.json`). Test: `tests/meteora.test.js`.

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py meteora --zapisi`, nastavitve v `tools/proga/proge.json`). Vire glej v `README.md` pod »Zasluge«.
