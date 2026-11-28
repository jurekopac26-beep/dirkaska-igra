# Portobelo, Panama

[← Vse proge](../../README.md#proge) · proga `portobelo` (`js/tracks/portobelo.js`, okolica `js/world-portobelo.js`, podatki `js/data/portobelo.js`)

Odprta cesta ob karibski obali Paname: po obalni cesti od zahoda v zaliv Portobelo, ob južnem bregu zaliva, mimo ruševin stare španske obalne trdnjave iz koralnega kamna, skozi staro mesto in čez potok ter po cesti ob vzhodnem delu zaliva do cilja. Dirka meri 2,57 km (sredinska črta 2,84 km, start 120 m za prvo točko, cilj 150 m pred koncem), z mehkimi tekočimi ovinki in enim prehodom čez rob nad zalivom; višine 1–13 m nad morjem. Ena karta, štirje načini vožnje kot na Luandi: dirka, vožnja proti uri, dvoboj v prometu in beg pred policijo. V Panami vozijo po desni.

- **Oblika proge:** sredinska črta iz OpenStreetMap (`tools/proga-podatki.py`, `tools/portobelo/config.json`), proga in podatki okolice iz `python3 -I tools/portobelo/build.py track` (ne urejaj `js/tracks/portobelo.js` in `js/data/portobelo.js` ročno). Širine po pravih cestah, razširjene na dirkalno širino (9,4–10 m; skozi mesto ožja). Višine: Copernicus DEM GLO-30 brez krošenj (Meta / WRI) in stavb (OSM), zglajene.
- **Znamenitost:** stara obalna trdnjava (obris OSM 670927188, nizko obzidje baterije s parapetom, strelnimi linami in okroglimi stražarnicami na ostrih vogalih; dvorišče odprto, brez streh) je pri ~55–64 % dirke (od 1400 do 1650 m), 40–60 m od ceste, na desni (na pobočju južno od ceste; zaliv je na levi). Model je narejen v Blenderju (`tools/znamenitost/portobelo.py`, bpy iz pip) po obrisu iz OSM in višinah terena iz igre (`tools/znamenitost/portobelo-tla.mjs`); samo preproste barve materialov, brez tekstur, napisov, kipov in znakov. Izvoz `assets/landmarks/portobelo.glb` (4.447 oglišč, 1 del) in daljna stopnja `portobelo-far.glb` (992 oglišč); nalaga ju skupni nalagalnik `js/znamenitost.js` (`World.znamenitost.add`), dokler se ne naložita ali če se ne moreta, ostane preprostejša trdnjava iz `js/world-portobelo.js`.
- **Terasa in jasa (odmik od višin):** po DEM ležijo ruševine ~20 m više na gozdnem pobočju, kamera za avtom (gleda navzdol na cesto) pa jih tam nikoli nima v kadru. Zato igra trdnjavo postavi na teraso 2,5 m nad cesto, kjer gre ta najbliže, in med obzidjem in cesto od 1400 do 1650 m izseka jaso (brez hiš in dreves, tla se od terase spustijo do ceste). Trdnjava je tako vidna s kamere za avtom ob robu ali v kotu kadra: ležeče pri ~1475 m in ~1550 m, pokonci pri ~1425 m in ~1450 m dirke.
- **Okolica (do ~60 m od ceste):** hiše mesta po obrisih iz OSM in dodatne enake v pozidanih delih (pisane stene, nizke strehe iz valovite pločevine), palme, temne krošnje deževnega gozda in visoka drevesa nad zelenimi tlemi, betonske ograje ob robovih (nevidna ograja prepreči izlet), temne skale ob zalivu, morje do obzorja. Dlje samo teren, morje in zeleni griči.
- **Imena na zaslonu:** samo zemljepisna in opisna (Ob zalivu, Obalna cesta, Nad zalivom, Trdnjava, Staro mesto, Most čez potok, Vzhodni breg).
- **Približki:** enotna dirkalna širina, ograje namesto pravih robov, razporeditev dodatnih hiš in dreves, terasa in jasa pod trdnjavo (zgoraj), poenostavljeno obzidje (brez topov in notranjih prostorov).
- **Viri:** © OpenStreetMap contributors (ODbL 1.0), Copernicus DEM GLO-30, ESA WorldCover 2021 (CC BY 4.0), Meta / WRI High Resolution Canopy Height Maps (CC BY 4.0); glej `README.md`, »Zasluge«.

## Raziskava (dodelava 2026-11)

Kraj in podnebje, kot ga ima proga (vse iz OSM, javnih višinskih modelov in javnih opisov; brez Googla):

- **Lega in višina:** južni breg zaliva Portobelo na karibski obali province Colón (9,55° S, 79,67° Z); cesta teče 4–9 m nad morjem, pobočja nad njo se v nekaj sto metrih dvignejo v gozdnate griče (Copernicus DEM GLO-30).
- **Podnebje:** vroče in vlažno tropsko, deževna doba maj–december (Svetovna banka, Climate Knowledge Portal); okraj Portobelo dobi ~2.800 mm dežja na leto, najbolj mokra avgust (~320 mm), september in maj, najbolj suh januar (~90 mm). Zato tla vedno zelena, kamen temen in moker.
- **Kamnine in tla:** polotok Portobelo je zgornjekredni vulkanski lok: breče, bazalti, andeziti, globočnine, apnenci in kremenasti tufi (EGU2012-7968; formacija Ocú, PanamaLex). Temne skale ob zalivu so torej prave; trdnjave so iz koralnih blokov (Lonely Planet).
- **Rastje:** nižinski vlažni tropski gozd na pobočjih (ESA WorldCover 2021: drevesa; Meta / WRI višine krošenj 20–35 m), palme in grmovje ob hišah, mangrove in obalno grmovje ob vodi.
- **Stavbe ob cesti:** 203 obrisi OSM do 60 m; nizke pisane hiše z valovito pločevino, v središču zidane kolonialne stavbe.
- **Zanimivosti do 60 m (OSM, odmik od ceste, L = zaliv, D = pobočje, metri dirke):**
  - trdnjava Santiago de la Gloria (w670927188, leto 1630), D, 42–56 m, ~1630 m (že modelirana);
  - spodnja baterija ob vodi (`city_wall`), L, ~1450–1510 m (že kot zid);
  - pomol (w670927178), L, 50 m, ~1550 m; razgledišče, D, 59 m, ~1630 m;
  - kraljeva carinarnica (w670927177, dve nadstropji, tloris 58 × 36 m; zgrajena 1630–34 kot hiša za kraljevo zlato), L, 41–55 m, ~1910 m;
  - osrednji trg in park, 22–24 m, ~1920 m;
  - kamniti most za pešce (w1258861071) in tlakovana ulica (w670927182), L, 8–13 m, ~1990 m;
  - cerkev San Felipe (w604025451, bela fasada z zvonikom), L, 55–76 m, ~2010 m;
  - šola (w604025450), 26 m, ~2170 m; avtobusna postaja ~2160 m;
  - ruševine na vzhodnem bregu (`building=ruins` w995989104, w995991933, w995999566), L in D, 21–44 m, 2430–2470 m;
  - potoka čez cesto pri ~1140 in ~2600 m (mostova OSM).
- **Dlje kot 60 m (samo omemba, ne model):** trdnjava San Jerónimo (rel 10264491, najbolje ohranjena, 1664; 77–135 m), Casa Fuerte (211 m), cerkev San Juan de Dios (103 m), staro pokopališče (155 m).
- **Svetovna dediščina:** UNESCO 135, »Utrdbe na karibski strani Paname: Portobelo–San Lorenzo« (1980, na seznamu ogroženih od 2012). Spletna stran UNESCO iz seje ni bila dosegljiva; podatek iz javnih opisov.
- **Ne spreminjaj tukaj:** oznake na cesti (dvojna rumena) ureja odprti PR #1008 (partyslo) v `js/world-portobelo.js` in `js/world-cesta.js`; ta dodelava jih ne spreminja.
- **Viri raziskave:** © OpenStreetMap contributors (ODbL 1.0); Copernicus DEM GLO-30; ESA WorldCover 2021 (CC BY 4.0); Meta / WRI Canopy Height (CC BY 4.0); World Bank Climate Knowledge Portal (Panama); EGU General Assembly 2012, povzetek EGU2012-7968 (CC BY 3.0); PanamaLex (formacija Ocú); UNESCO WHC 135 (javni opis).
