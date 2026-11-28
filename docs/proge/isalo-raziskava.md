# Isalo, Madagaskar: raziskava kraja za dodelavo

[← Opis proge](isalo.md) · proga `isalo` · dodelava do ravni Pikes Peaka (Matejeve odločitve O-28-6, O-28-7, O-28-17; merilo `docs/dodelava-prog.md`)

## Lega
- Cesta RN7 na jugu Madagaskarja (regija Ihorombe), jugozahodno od vasi Ranohira, ob zahodnem in južnem vznožju masiva Isalo. Dirka teče od severovzhoda proti jugozahodu (OSM, `tools/isalo/config.json`, okvir −22,65…−22,605 J, 45,315…45,375 V).
- Višina ceste 819–852 m (Copernicus DEM GLO-30, `def.alt`). Masiv se dviga **severno in severozahodno**: do ~1010 m v 2 km od ceste, do ~1120 m v 4 km proti severu, na zahodu 1050–1120 m v 6–10 km. Proti jugu in jugovzhodu je ravnina 830–890 m (analiza `tools/isalo/far.png`, ta seja).

## Podnebje
- Vroče in suho, dve dobi: hladnejša suha (maj–oktober) in toplejša deževna (november–april); padavin ~850 mm na leto, januarja ~200 mm (javni opisi parka). V igri ostane suha doba (zlata trava), kot jo ima `look`.

## Kamnina in tla
- Peščenjak iz triasa do zgodnje jure (skupina Isalo, rečni nanosi pletenih rek, ~200 milijonov let), grob, plastovit; erozija je izdolbla kanjone, kupole, stolpe in ravne vrhove (»ruiniformni« relief). Barve: okra, rožnata, rdeča, s sivo in temnejšo skorjo na izpostavljenih stenah.
- Tla na ravnini: rdeča peščena prst s travo; ob cesti rdeč prah.

## Rastje (ESA WorldCover 2021 v 500 m od ceste)
- **Trava 89 %**, grmičevje 9 %, drevesa ~1 %, golo 0,1 %. Krošnje (Meta / WRI) redko nad 6 m, največ 12 m.
- Travna savana, ki jo vsako suho dobo požgejo za pašo (javni viri o požigih na RN7 med Andringitro in Isalom): ob cesti so **požgane lise** (temno siva trava) in sveže zeleni poganjki na pogoriščih.
- Pahljačasta palma *Bismarckia nobilis* posamič na ravnini in v zavetnih legah; tapija (*Uapaca bojeri*) v svetlem gozdu na masivu; na skalah *Pachypodium rosulatum* (»slonja noga«, debelo deblo, rumeni cvetovi) in aloje.

## Živali
- Govedo zebu se pase na planotah ob RN7 (javni foto arhivi RN7). Kata (obročkasti lemur) živi v kanjonih masiva, ne ob cesti, zato ga ob progi ni. Čaplje (`egret`) že so.

## Gradnja ob cesti
- OSM nima stavb v 60 m od ceste na dirkalnem delu (`tools/isalo/isalo.json`: `bld` 0); ena stranska kolovozna pot (#1078, #862). Nove gradnje ne dodajam.

## Zanimivosti do 60 m (samo zemljepisna in opisna imena)
- Kraljica Isala (skala, OSM `natural=rock`), že model.
- Skalni stolpi in kupole peščenjaka ob vznožju (opisno).
- Pogorišča in pašniki zebujev (opisno).
- Osamljene palme na ravnini (opisno).

## Kaj odprti PR že spreminjajo (tega ne spreminjam)
- #1078 (partyslo, obcestje): stranska pot, robne črte, `tools/isalo/build.py`.
- #862 (zbirna Realizem): stranske ceste, robovi, nasip, količki, `colFn`.
- Tla ob cesti za kamero za avtom: `World.ext.goreRob` (`js/world-chase-bt14.js`).

## Viri
- © OpenStreetMap contributors (ODbL 1.0); Copernicus DEM GLO-30; ESA WorldCover 2021 (CC BY 4.0); Meta / WRI High Resolution Canopy Height Maps (CC BY 4.0) — že v `README.md`, »Zasluge«.
- Javni opisi parka (geologija, podnebje, rastje): https://wildmadagascar.org/conservation/parks/Isalo.html, https://national-parks.org/madagascar/isalo-national-park/, https://beta.grida.no/?p=2875 (UNEP GRID-Arendal), https://en.wikivoyage.org/wiki/Isalo_National_Park.
- Požigi in paša na RN7: https://photos.wildmadagascar.org/topics/rn7-andringitra%20to%20isalo1.shtml; o požiganju pašnikov: https://serval.unil.ch/resource/serval:BIB_1749FB1B97D9.P001/REF.
