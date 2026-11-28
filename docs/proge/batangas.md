# Batangas, Filipini

[← Vse proge](../../README.md#proge) · proga `batangas` (`js/tracks/batangas.js`, okolica `js/world-batangas.js` na skupnem graditelju `js/world-rbring.js`; načrt v [`docs/nove-proge-1-0.md`](../nove-proge-1-0.md), linija A)

Dirkališče na planoti province Batangas južno od Manile pri Rosariu, v pravi postavitvi in pravem merilu: **3,60 km** (3.598 m na naši črti; uradno 3,62 km), v smeri urinega kazalca, **3 krogi**, z boksi in ciljno črto po OSM. Skoraj ravna planota okoli 100 m nad morjem (višine v krogu 100–107 m, največ 2,5 % naklona), 13 ovinkov (8 desnih, 5 levih), najožji je zahodni ostri desni (8. ovinek, polmer ~14 m).

- **Krog:** s ciljne ravnine (glavna tribuna levo, boksi desno) v **desni na koncu ravnine** (1. ovinek), **dolgi desni** (2.), **ostri levi** (3.) in **desni za ostrim levim** (4.), **trije levi** (5.–7.), **ravnina proti zahodu**, **zahodni ostri desni** (8.), **šikana** (9. in 10.), **desni za šikano** (11.) in **dvojni desni** (12. in 13.) na ciljno ravnino.
- **Cesta in boksi:** asfalt širine 12 m z rdeče-belimi robniki; asfaltne izletne cone z naslikanimi imeni krajev (BATANGAS, ROSARIO, PILIPINAS), drugod pokošena trava. Ograje so več kot 3 m od roba ceste na 93 % kroga (najmanj 2,5 m); kjer sta kraka blizu (najmanj ~18 m narazen), ograja ostane na pol poti. Boksarska steza desno od ciljne ravnine in jambori z zastavami.
- **Okolica (do ~60 m od ceste):** zelena tropska planota: trate in polja sladkornega trsa (rumenkasto zelena), lise rdeče prsti, grmovje, gaji listavcev in kokosovih palm (po rabi tal in višini krošenj), vaške strehe iz rjaste pločevine. Pet tribun za ograjo (BATANGAS s streho ob ciljni ravnini, ROSARIO, LIPA, IBAAN, PADRE GARCIA), 24 stavb in servisne ceste iz OSM, table s kraji pokrajine (TAAL, TAYSAN, MALVAR, SAN JUAN, LUZON …). Vodni bivoli in čaplje na travnikih.
- **Dlje od ceste** (poceni za telefon): teren iz višin in obzorje v desetih obročih do ~11,5 km (griči in gore pokrajine okoli planote), pobarvano zeleno; morja s proge skoraj ni videti (glej »Raziskava kraja«).
- **Komentator:** lastne vrstice za pozdrav, start in dež (`comm` v `tools/batangas/build.py`): zelena planota Batangasa, sladkorni trs in kokosove palme, vročina in vlaga, popoldanske nevihte deževne dobe; samo zemljepisna imena.
- **Imena:** samo zemljepisna (pokrajina, mesta, vasi, otok Luzon, država) in opisna. Imen dirkališča, podjetij, sponzorjev in prireditev v igri ni.
- **Stranske ceste:** servisne ceste so preproste površine na terenu brez črt, za ograjami (dostopi do tribun in boksov).
- **Približki:** višine so iz satelitskega modela, od katerega sta odšteti višina krošenj in stavb (±1 m), zglajene; ciljna ravnina enakomerno pada ~1,2 %. Stavbe so škatle po tlorisu iz OSM.
- **Obcestje** (`js/world-batangas-obcestje.js`, 23. 11. 2026): 136 hiš iz OSM (višine po pravilu iz `build.py`) in sadovnjak w975562695 (5,8 ha, 102 m in več od proge): vrste na 8 m, drevo samo tam, kjer je krošnja po karti višja od 2 m, drugje odprta mesta. Vrsta (mango) in razmik sta ocenjena.
- **Viri:** © OpenStreetMap (ODbL 1.0), Copernicus DEM GLO-30, ESA WorldCover 2021, višina krošenj Meta in WRI (glej »Zasluge« v `README.md`). Orodji: `tools/proga-podatki.py` (nastavitve `tools/batangas/config.json`) in `tools/batangas/build.py`.
- **Test:** `tests/batangas.test.js` (ime, dolžina, smer in zavitost, ovinki po vrsti in smeri, najožji 8. ovinek, razdalja med kraki, višine in nakloni, boksi, izletne cone, tribune za ograjo, teren in raba tal, stavbe in servisne ceste, obzorje, imena, dirka v suhem in v dežju).

## Raziskava kraja (dodelava 28. 11. 2026)

- **Lega:** južni Luzon, notranjost province Batangas, med Lipo (sever) in Rosariem; cilj 13,8202° S, 121,2773° V. Najbližje morje je zaliv Tayabas na vzhodu (17 km), zaliv Batangas na zahodu je dlje (> 25 km).
- **Višina in teren:** valovita planota 100–107 m (Copernicus GLO-30). Do 12 km je najvišji grič 448 m (13,771° S, 121,329° V, jugovzhod), do 30 km gora Malarayat (~1.000 m, severozahod nad Lipo). Obzorje je zato nizko in zeleno, gore pa samo na severu in jugovzhodu.
- **Ali se vidi morje (preverba vidnosti, GLO-30, krivina Zemlje in lom):** z višine oči voznika (1,2 m) se vidi samo ozek pas zaliva Tayabas proti vzhodu (azimut 82–93°), 25–35 km daleč, skozi vrzel med griči. To je 3 do 23 od 720 žarkov, odvisno od tega, ali bližnja drevesa štejemo. Z vrha tribune (+12 m) ga je več (azimut 80–107°). V tropski meglici je to tanka svetla črta tik pod obzorjem; zato v »Dlje od ceste« piše »morja skoraj ni videti«.
- **Podnebje:** tropsko monsunsko, vroče in vlažno vse leto; suha doba od decembra do maja, deževna od junija do novembra s popoldanskimi nevihtami in tajfuni (splošno znano; v igri dež kot drugod).
- **Kamnina in tla:** vulkanski tuf in pepel iz vulkanov Taal in Macolod na zahodu; rdečkasta glinasta prst (lise rdeče prsti ob progi).
- **Rastje:** po ESA WorldCover je v mreži okoli proge 56 % drevesne odeje, 6 % trav, 4 % njiv in 4 % pozidanega. OSM ima ob progi 1,9 % sadovnjakov in 1,7 % njiv, vrste posevkov pa ne. Kokosove palme, mangovci in sladkorni trs so torej ocena po kraju, ne po karti.
- **Gradnja ob cesti:** vaške hiše iz OSM (136, `js/world-batangas-obcestje.js`), strehe iz pločevine, tribune in boksi dirkališča.
- **Zanimivosti do 60 m:** ovinki in ravnine (11 z vrsticami komentatorja), tribune, boksi, sadovnjak w975562695. Drugih zemljepisnih zanimivosti do 60 m OSM nima.
- **Kaj še manjka (za grafiko po resetu, PR »Dodelava: Batangas«):** griči na severu in jugovzhodu bolj vidni na obzorju; nasadi v pasovih po drevesni odeji WorldCover; morje samo kot tanek pas na vzhodu, če ga potrdi uporabnik (slike pred in po).
- **Viri raziskave:** Copernicus DEM GLO-30 (ploščica N13 E121), ESA WorldCover 2021, © OpenStreetMap (ODbL 1.0); vsi so že v »Zaslugah« v `README.md`.
