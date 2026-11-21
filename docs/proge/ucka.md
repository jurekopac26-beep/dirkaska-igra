# Učka, Hrvaška (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `ucka` (`js/tracks/ucka.js`, svet `js/world-ucka.js` na podatkovnem graditelju `js/world-gore.js`)

Zadnji del javne ceste na vrh Učke (Vojak, 1401 m) v Istri nad Kvarnerjem, v pravem merilu: **od zadnjega odcepa pod vrhom (~1330 m) skozi bukov gozd v tekočih ovinkih navkreber do cilja ~107 m pred kamnitim razglednim stolpom (~1377 m)**: 0,61 km in ~47 m vzpona; zadnjih ~170 m (od 548 m) je makadam. Proga 18 sklopa kratkih prog (`docs/gorske-proge.md`), odločitev uporabnika 15. 11. 2026 (`docs/proge-po-drzavah.md`, »Tri kratke proge z znamenitostjo«). Kartica proge je ena, s stikalom **Dirka / Kronometer / Promet / Policija**, kot na Vršiču:

- **Dirka**: tekmeci, start spodaj, en vzpon do vrha; za ciljem je izlet po makadamu proti stolpu.
- **Kronometer**: sam proti uri, štiri kontrolne točke, medalje zlata 0:18, srebrna 0:19, bronasta 0:21 (v dežju 0:23 / 0:24 / 0:26).
- **Promet** in **Policija**: kot na Vršiču, po desni; pobegneš čez cilj (»Do cilja«).

Okolica:

- **Razgledni stolp**: okrogel stolp iz sivega apnenca na vrhu, po obrisu iz OpenStreetMap: rahlo nagnjen zid v vrstah kamnov (vsak svoj odtenek), okrogel podstavek, ki sega v pobočje, skale ob vznožju, ozka temna vrata proti cesti, dve okenci, na vrhu ploščad za cinami z jekleno ograjo. Samo zunanjost, brez napisov, plošč in imen.
- **Vrh**: kupola radarja (betonski valj s pasom žaluzij in belo kroglo) in oddajniki (trikoten rešetkast jambor z rdeče-belimi pasovi in ploščami, dva cevasta drogova z antenami), vse generično; stavbe ob kupoli in stolpu so preprosti bloki.
- **Gozd**: bukov gozd (listavci 12–20 m) po rabi tal ESA WorldCover; ob cesti trava in grmičevje, na vrhu goli kras in skale.
- **Daljni razgled** (`far` v `js/tracks/ucka.js`, `tools/ucka/daljava.py`): mreža višin okoli ceste do 140 km (obzorje morja z vrha) iz Copernicus GLO-30, spuščena za ukrivljenost Zemlje: Kvarnerski zaliv in obala pod goro, otoka Cres in Krk, Velebit daleč na jugovzhodu, istrski griči na zahodu; morje je ravno na 0 m, kopno obarvano po višini in zamegljeno z razdaljo.
- **Cesta**: ozka (6,4 m, na makadamu 5,2 m), bele robne črte, brez sredinske črte (`road.line: 'none'`; Hrvaška v `CRTE` nima svoje vrstice, zato velja privzeto: bele črte, kot na hrvaških cestah). **Padca čez rob ni**: kjer teren pada in na zunanji strani ostrejših ovinkov stoji odbojna ograja (`rails` graditelja gorskih cest), konec ceste zapirajo betonske ovire.
- **Ljudje**: gledalcev je čim manj (redke mirne skupine), redarji in snemalci ob startu in cilju.
- **Podatki**: sredinska črta, stranske ceste, stavbe, voda in parkirišča iz OpenStreetMap; višine Copernicus GLO-30; raba tal ESA WorldCover (uvoznik `tools/proga-uvoz.mjs`). Viri so v `README.md`, »Zasluge«.
- **Približki**: drevesa, skale in gledalci so razporejeni po rabi tal in naklonu, ne po resničnih legah; table generične (START, FINISH, HILL CLIMB), brez imen podjetij in prireditev.
