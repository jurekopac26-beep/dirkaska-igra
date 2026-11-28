# Kildare, Irska: raziskava kraja za dodelavo

[← Kildare](kildare.md) · proga `kildare` · dodelava do ravni Pikes Peaka (`docs/dodelava-prog.md`, odločitve O-28-6, O-28-7, O-28-17)

Raziskava 28. 11. 2026 za dodelavo proge. Vsak podatek ima vir. Kjer vira ni, je to napisano.

## Lega in višina

- Dirkališče stoji na ravnini severne grofije Kildare (pokrajina Leinster), severozahodno od mesta Naas, ob vasi Caragh, na 53,257° S, 6,745° Z. Vir: OSM (območje `leisure=sports_centre`, `sport=motor`).
- Start leži na 90 m nadmorske višine. Ves krog je v pasu 3,8 m, naklon je največ 3,4 %. Obzorje je ravnina na 70–130 m, edini hrib je na zahodu in jugozahodu (208 m, 8,5 km daleč). Na vzhodu je v meglici gorovje Wicklow. Vir: Copernicus DEM GLO-30 (`tools/kildare/dem.png`, `far.png`).

## Podnebje

- Podnebje je oceansko, milo, vlažno in spremenljivo. Po modelu za najbližjo postajo (Casement, ~20 km vzhodno) je julij najtoplejši (povprečno do ~19 °C, ponoči ~12 °C), februar najhladnejši (podnevi ~8 °C, ponoči ~3 °C). Največ dežja pade novembra (~74 mm), najmanj aprila (~43 mm). Vir: WeatherSpark za Casement Aerodrome (modelirani podatki, ne uradna povprečja Met Éireann). Uradna povprečja Met Éireann 1991–2020 so na data.gov.ie (CC BY 4.0), a iz seje strani met.ie ni bilo mogoče odpreti.
- Za igro: dež je pogost (`rainP` 0,5 že velja), svetloba je mehka in oblačna, sneg je redek. Proga ostane poletna.

## Kamnina in tla

- Pod površjem je apnenec iz karbona (formacija Lucan, apnenec in skrilavec). Na njem leži ledeniški til z apnenčevo podlago. Vir: Geološki zavod Irske (GSI), povzeto v »The Geological Heritage of Kildare« (Kildare County Council) in v okoljskih poročilih za grofijo (pleanala.ie, EIAR, pogl. 7).
- Tla: najpogostejši so luvisoli, rjava tla na apnenčevem tilu. Na težkem tilu so slabo odcedna glejna tla, zato so v kotanjah pašnikov luže in vlažna mesta. Vir: Farmers Journal, »Co Kildare home to the largest remaining fen«, po Teagascovi karti tal.
- Šota (barje): v grofiji je je veliko, vendar na zahodu (Bog of Allen) in v ravnih kotanjah (»basin peat«), ne ob dirkališču. V OSM ni do ~1 km od proge nobene površine `natural=wetland` ali `wetland=bog` (izvleček OSM API 28. 11., okvir 2,0 × 1,6 km). Poleg tega rabe tal ESA WorldCover nimajo razreda mokrišča. **Barja ob progi zato ni.** Vlažne kotanje pašnikov že obstajajo (`js/world-realizem-bt.js`).

## Rastje

- Polja ločijo žive meje. Popis živih mej grofije Kildare iz leta 2022 je glog našel v 88,2 % mej in bezeg v 41,6 %. Najpogostejše drevo v mejah je jesen (50 %), sledita glog (29 %) in javor (17 %). Vir: »County Kildare Hedgerow Appraisal Survey 2022«, Kildare County Council.
- Smreke (sitka) rastejo v nasadih, v OSM so v območjih `landuse=forest`. Pašniki in polja so po ESA WorldCover 2021, drevesa v mejah pa po višini krošenj (Meta in WRI).
- V OSM je ob dirkališču vrisana samo ena živa meja (`barrier=hedge`), več kot 150 m od proge. Lege drugih mej so iz višine krošenj in rabe tal, ne iz OSM. To je približek.

## Gradnja ob cesti (OSM, do 60 m)

| Kaj | Oddaljenost od proge | m za črto | Vir |
| --- | --- | --- | --- |
| Brv čez progo s stopnicami | 0 (nad progo) | ~46 | OSM `highway=footway` (bridge), `highway=steps` |
| Tribuna | ~19 m | ~48–81 | OSM `building=grandstand` |
| Stavba ob tribuni (v njej je razstava, po OSM odprta ob prireditvah; ime v igri ni) | ~53 m | ~43 | OSM |
| Vrsta garaž boksov (120 m) | ~24 m | ~920–1035 | OSM `building=garage` |
| Stolp ob ciljni črti (13,5 m) | ~22 m | ~1126 | OSM |
| Štiri stavbe depoja ob povezavi | ~21 m | ~532–561 | OSM |
| Hala ob ciljni ravnini (v njej je lokal; ime v igri ni) | ~29–40 m | ~1050–1064 | OSM |
| Igrišče depoja (zasebno) | ~42 m | ~1025 | OSM `leisure=playground` |
| Vrata ograj depoja | 16–90 m | razno | OSM `barrier=gate` |
| Daljnovod 110 kV, jekleni steber | 65 m | – | OSM `power=tower` (zunaj 60 m) |

Imena: v igri samo opisna (brv, tribuna, garaže, stolp). Imena dirkališča, lokala, razstave in upravljavca daljnovoda v igri niso.

## Kaj iz tega sledi za dodelavo

1. Zanimivosti: devetim ovinkom dodamo resnične kraje do 60 m: brv, tribuno, garaže boksov in stolp ob ciljni črti. Vsak dobi vrstice komentatorja.
2. Komentator: lastne vrstice za uvod in štart dirke na krogu (`comm.intro`, `comm.go`) z ravnino, živimi mejami, makadamom in dežjem.
3. Dejstva: `alt` (90 m), prelet proge (`fly`) z istimi kraji.
4. Rastje: žive meje kot nizek pas grmovja (glog, bezeg) ob mejah polj, z jesenom in javorjem nad njim (drevesa že obstajajo). Lege so po višini krošenj, kjer so drevesa v vrsti.
5. Barja ni (glej zgoraj), zato ga ne dodajamo.

## Viri

- © OpenStreetMap contributors, ODbL 1.0 (izvleček API 0.6, 28. 11. 2026).
- Copernicus DEM GLO-30 © DLR e.V. 2010–2014 in © Airbus Defence and Space GmbH 2014–2018, prek programa Copernicus EU in ESA.
- ESA WorldCover 2021 (CC BY 4.0); Meta in WRI, High Resolution Canopy Height Maps (CC BY 4.0).
- Kildare County Council: County Kildare Hedgerow Appraisal Survey 2022; The Geological Heritage of Kildare (audit, GSI).
- Farmers Journal: Co Kildare home to the largest remaining fen (tla po Teagascu).
- WeatherSpark: Average Weather at Casement Aerodrome (modelirano podnebje); Met Éireann 1991–2020 Climate averages, data.gov.ie (CC BY 4.0).
