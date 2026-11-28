# Krásna Hôrka, Slovaška (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `krasnahorka` (`js/tracks/krasnahorka.js`, svet `js/world-krasnahorka.js` na podatkovnem graditelju `js/world-gore.js`)

Cesta II/549 s severa v dolino pod gradom Krásna Hôrka (Slovaška, Gemer), nato dovozna cesta na grajski hrib: ~3,4 km od starta do cilja, najprej ovinki navzdol (624 m → dolina), na koncu vzpon do gradu, odprta cesta. Proga z znamenitostjo (`docs/proge-po-drzavah.md`, »Kratke proge z znamenitostjo«; odločitev 15. 11. 2026; podaljšana na 3–4 km 22. 11. 2026).

- **Dirka**, **kronometer**, **promet**, **policija**: kot na Vršiču (štiri vožnje na eni kartici).
- **Grad** stoji tik ob cilju na vrhu hriba (485 m): obzidje po obrisu iz OpenStreetMap (pot 112611305), višine iz višinskega modela, krila s strehami, glavni stolp, kapela z apsido, trije okrogli bastioni in vhodni stolp z vrati proti cesti. Narejen je **cel, kot pred požarom 2012** (strehe, stolpi), samo od zunaj; brez napisov, kipov, grbov in okrasja. Teren pod gradom je zravnan v teraso (`pads`), obzidje stoji na kamnitem podstavku.
- **Varnost**: nevidna ograja ob cesti (vidnih ni), gledalcev malo (`fans: 0.3`).
- **Podatki**: sredinska črta (zadnjih ~90 m pred ciljem makadam, kot v OSM), stranske ceste, stavbe in parkirišča iz OpenStreetMap; višine Copernicus GLO-30; raba tal ESA WorldCover (uvoznik `tools/proga-uvoz.mjs`).
- **Približki**: drevesa, skale in gledalci so razporejeni po rabi tal in naklonu, ne po resničnih legah; stavbe in grad so poenostavljeni (krila in strehe po obrisih, okna v enakih razmikih), table generične, brez imen podjetij.

## Raziskava in dodelava (O-28-6, O-28-7)

Kraj: grad stoji na golem apnenčastem hribu (vrh ~485 m) nad vasjo Krásnohorské Podhradie v Gemerju. Cesta s severa se spušča čez travnike in pas njiv, vas je 230 m in več od ceste; pokopališče in jami Malá in Veľká pivnica sta ~220 m stran (zunaj 60 m, zato ne v igri). Požar 2012 je zanetil ogorek v suhem rastju na pobočju, strehe so bile obnovljene do oktobra 2015 (igra kaže grad celega).

Dodano v `js/world-krasnahorka.js` (`okolica`), vse po legah iz OSM/Overture:
- **vas**: 103 hiše (ometane stene, opečnate dvokapne strehe; večje nad 150 m² dvonadstropne) 225–370 m od ceste, vidne na pobočju (`tileR2: 400`);
- **odbojna ograja** pri s ≈ 555 (črta iz OSM), **betonski parapet** na mostiču (s ≈ 2010);
- **avtobusna postajališča** (3, modra tabla brez napisa), **informacijski tabli** (2, prazni), **hidrant**, **kapelica** ob cesti za ciljem (s ≈ 3480);
- **apnenčaste skale** 60–150 m od gradu (goli hrib), ne v gozdu, vasi in vodi;
- **živali in lovske preže** (srna, divji prašič, lisica, zajec), 12 imen odsekov s komentatorjevimi vrsticami, tretji uvodni stavek.

Tla ob cesti od 2,5 do 55 m ureja PR #1150 (chase), tu niso podvojena. Fizika vožnje nespremenjena.

Viri: © OpenStreetMap contributors (ODbL 1.0), prek Overture Maps; Copernicus DEM GLO-30; ESA WorldCover 2021 (CC BY 4.0); javni opisi (Slovaški narodni muzej snm.sk, The Slovak Spectator, waymarking.com) samo za dejstva o kraju in požaru. Wikipedija, Overpass in Nominatim iz seje niso bili dosegljivi.
