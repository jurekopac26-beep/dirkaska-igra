# Sosnová, Češka — raziskava kraja (dodelava)

[← Opis proge](sosnova.md) · odločitve O-28-6, O-28-6 dodatek, O-28-7, O-28-17 · seja dodelave 28. 11. 2026

Namen: kaj je na kraju res (iz virov), da je dodelava proge »vse kot v resnici«. Imena samo zemljepisna; dirkališča, podjetij in prireditev v igri ne imenujemo.

## Kraj
- **Lega:** travniki med vasjo Sosnová in mestom Česká Lípa, ~2 km južno od mesta, ob glavni cesti I/9 (proti Pragi) na zahodu; okraj Česká Lípa, Liberški kraj, sever Češke. Sosede vasi: Kvítkov, Zahrádky, Provodín. [1][2][3]
- **Vas Sosnová:** nadmorska višina 254 m; prva omemba 1554; do 1948 nemško ime Künast (Kynast); ~690 prebivalcev. [1][2]
- **Dirkališče:** športni kompleks od leta 1977, na nekdanjem vadbišču telovadnega društva in kmetijskih zemljiščih (v igri brez imena). [3]
- **Višine proge:** 252,7–256,1 m (Copernicus GLO-30 brez krošenj in stavb, `SO_H` v `js/tracks/sosnova.js`; start 255,6 m) — skoraj ravno, najnižje v zahodni lasnici, najvišje ob zadnji lasnici. [4]

## Podnebje
- Zmerno celinsko srednje Evrope; za Češko povprečno ~7,9 °C in ~727 mm padavin na leto [5]. Krajevnih meritev za Sosnovo nismo našli: v igri ostane dosedanji videz (pozno poletje, mehka svetloba, rahla meglica nad travniki) in vreme kot drugod.

## Kamnine, tla, voda
- Podlaga: kredni peščenjaki Češke kredne kotline (~90 milijonov let), vidni v soteski Peklo potoka Robečský potok severno-zahodno od vasi (narodni naravni spomenik od 1. 2. 2009, katastri Kvítkov, Sosnová, Zahrádky; znana po spomladanskem velikem zvončku, *Leucojum vernum*; železniški viadukt; 8 km učne poti). Soteska je **dlje od 60 m** od proge: v igri ni zanimivost, samo opis in komentator. [2][6][7]
- Ob progi: dva potoka iz OSM (odprti čez notranjost v prepustu pod esovko, drugi v cevi) — že narisana (`js/world-sosnova.js`). [4]

## Rastje in raba tal
- Travniki (pokošeni ob progi), polja, borovi in brezovi gozdovi, jelše ob potokih (ESA WorldCover 2021, višina krošenj Meta/WRI, OSM) — že v svetu in v osnutkih ob cesti (`js/world-chase-bt21.js`, `js/world-chase-bt53.js`, šopi trave `js/world-realizem-bt.js`); tu jih ne podvajamo. [4]

## Ob cesti do ~60 m (OSM, `tools/sosnova/sosnova.json`, 22. 11. 2026)
| Kaj | OSM | Razdalja od proge | V igri |
|---|---|---|---|
| Protihrupna stena ob I/9 | `wall=noise_barrier` (w909569871), brez višine | ~41 m (zahod) | **nova**: 3 m (ocena, OSM nima višine) |
| Ograja ob zahodnem delu | `barrier=fence` (w1532982736) | ~15 m | **nova**: 2 m mreža (ocena) |
| Ograja severozahod | `barrier=fence` | ~35 m | **nova**: 2 m mreža (ocena) |
| Ograja na severu in vzhodu | `barrier=fence` | ~96 m | izven 60 m, ni narisana |
| Stavbe depoja in hiše | `building` | 15–64 m | že (`sk.bld`) |
| Daljnovodi (400, 220, 110, 35 kV) | `power=line/tower/pole` | čez progo in ob njej | že |
| Železnica | `railway=rail` | 92–158 m za I/9 | izven 60 m |
| Skalni robovi | `natural=cliff` | ~243 m | izven 60 m |

Stena in ograje doslej niso bile narisane: opomba v `js/world-sosnova-obcestje.js` je kazala na #844, ki je bil zaprt brez združitve.

## Viri
1. Wikipedija, »Sosnová (Česká Lípa District)« (CC BY-SA 4.0), prek povzetka iskanja.
2. kudyznudy.cz (CzechTourism), stran o vasi Sosnová in soteski Peklo.
3. denik.cz, članek o zgodovini dirkališča pri Sosnovi (1977, nekdanje vadbišče).
4. © OpenStreetMap contributors (ODbL 1.0); Copernicus DEM GLO-30; ESA WorldCover 2021 (CC BY 4.0); Meta in WRI, višina krošenj (CC BY 4.0).
5. Český statistický úřad (ČSÚ), dolgoletna povprečja temperature in padavin za Češko.
6. turistika.cz, »Peklo u České Lípy«.
7. cnn.iprima.cz, članek o soteski Peklo in velikem zvončku.

Brez Google Maps, Earth in Street View.
