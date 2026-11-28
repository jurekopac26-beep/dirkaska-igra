# Koli, Finska: dodelava (odločitev O-28-11)

Lastnik: croatiadata. Dodelava proge `koli` proti ravni Pikes Peaka. Gre za lasten graditelj v `js/world-koli.js`, ki deli samo `World.gore.build`.
Ta datoteka dopolnjuje `docs/proge/koli.md`, ki ga spreminja odprti PR #1085, zato ga tukaj ne urejam.

## Raziskava kraja

| Kaj | V resnici | Vir |
|---|---|---|
| Lega | Narodni park Koli, Severna Karelija, Finska. Zgornji del ceste Ylä-Kolintie vodi iz gozda do vasi Ylä-Koli pod vrhom Ukko-Koli. | OSM (cesta, zgradbe, žičnice, smučišča) |
| Višina | Start 156 m, cilj 306 m. Ukko-Koli ima 347 m (ponekod 354 m) in se dviga 253 m nad jezero Pielinen (~94 m). V modelu igre je vrh na 341 m (DEM je zglajen), okoli 240 m JV od cilja (x 1210, z 770). | Copernicus DEM GLO-30, nationalparks.fi/koli |
| Kamnina | Vrhovi Ukko-Koli, Akka-Koli in Paha-Koli so gola **bela kremenčeva kamnina (kvarcit)** v skladih, nagnjenih plasteh. Na grebenu je tla le tanko pokrita, gozd tam redek in nizek. | nationalparks.fi/koli, Wikipedia »Koli, Finland« |
| Podnebje | Celinsko, sever. Sneg leži približno od novembra do aprila. Na vrhu je **tykky**, debel ovoj snega in ivja na krošnjah smrek, ki jih upogne v bele stebre. | nationalparks.fi/koli |
| Rastje | Borealni gozd (tajga): smreka prevladuje na pobočjih, bor na suhih kamnitih grebenih, vmes breza (pozimi gola, bela debla) in trepetlika. Na pobočjih pod vasjo so smučišča. | ESA WorldCover 2021 (razredi gozd, odprto, smučišče), nationalparks.fi/koli |
| Zgradbe | Ylä-Koli: velika zgradba na vrhu ob cilju, center narodnega parka in lesene hiše v rdeči ali rumeni okri. Ob cesti nižje redke lesene hiše. | OSM (`bld`), splošno o finski leseni gradnji |
| Razgled | Nacionalna pokrajina: razgled z Ukko-Kolija čez Pielinen z otoki proti vzhodu. Razgledišče je v OSM (`vistas`, 1184/649). | OSM, koli.fi »national landscape« |

Imen podjetij, lokalov in oseb ni. Uporabljena so samo zemljepisna imena (Koli, Ylä-Koli, Ukko-Koli, Akka-Koli, Paha-Koli, Pielinen, Ylä-Kolintie).

## Kaj nariše lastni graditelj (`js/world-koli.js`)

- **Kvarcit:** svetle skrilaste plošče, nagnjene v plasteh, s tanko snežno kapo. Na grebenu Ukko-Kolija nad ciljem in na razgledišču so na gosto. Ob zgornjem delu ceste (strma pobočja, kamnina) so do ~60 m od asfalta.
- **Tykky:** visoke smreke pod debelim snegom, beli stebri z malo zelenja. Rastejo nad ~270 m (vas, greben in vrh). Nižje rastejo navadne zasnežene smreke.
- **Tajga:** gozd je gostejši, smreka prevladuje pred borom (2 : 1), drevesa so višja (9–20 m).
- **Breze:** gola bela debla s temnimi lisami in tankimi vejami, v skupinah ob robu gozda, ob spodnjem delu ceste.
- **Vas Ylä-Koli:** stene v finski rdeči in rumeni okri, sivi in temni pločevinasti strehi.

Mejne vrednosti: brez spremembe fizike vožnje, risanje v mejah `tests/golden/perf.json` (`tools/obremenitev.mjs koli`). Vse je zlito v kose scenerije in ne dodaja klicev risanja na predmet.
