# Gorske proge s smučišči

Načrt sklopa desetih kratkih gorskih prog zunaj Evrope: ob vsaki je smučišče z žičnicami (gondola, sedežnica, vlečnica), ob cesti so živali, cesta je dovolj zavita. Načrt je za seje, ki proge gradijo: vse odločitve in podatki so tu, zato jih seje ne raziskujejo in ne sprašujejo znova.

## Odločitve uporabnika (31. 10. 2026)

- Deset prog s spodnjega seznama, vsaka **2–5 km**. Krajši odsek resnične ceste je prava proga, ne testna (kot Pikes Peak in Ouninpohja).
- **En sklop**, izdelan kot veriga sej: vsaka proga je svoja seja (»Naredi progo N po docs/gorske-proge.md«), svoja veja `gorske-proge/<NN>-<id>` in en pull request. Seja ga odpre (najprej kot osnutek), ko so lokalno zeleni povezani testi, in ga **sama združi na `main` brez vprašanja**, ko so na GitHubu zeleni vsi testi (»na main daj vedno brez vprašanja«). Nato brez vprašanja zažene sejo za naslednjo progo iz tabele Stanje (model `claude-opus-5-5`). Uporabnik verigo ustavi z »stop«.
- Grafika čim bolj podrobna za kamero za avtom, poraba tokenov čim manjša brez izgube kakovosti (pravila spodaj). Čas izdelave ni pomemben, zato veriga teče zaporedno (ena proga naenkrat, brez reševanja sporov med vejami).
- Zemljevid od zgoraj, prelet in helikopterski posnetek se ne delajo (po `CLAUDE.md` so po želji pozneje). Slika za meni je obvezna.

## Proge

Vrstni red je vrstni red verige: prva seja naredi tudi skupne gradnike in uvoznik, sledijo proge z desno vožnjo, nato tri z levo. Obseg (`bbox`: zahod, jug, vzhod, sever) je preverjen v OpenStreetMap 31. 10. 2026; številke so iz izvlečka OSM tega obsega.

| # | `id` | Ime (`name`) | Angleško | Vožnja | Obseg OSM |
|---|---|---|---|---|---|
| 1 | `norquay` | Mount Norquay, Kanada | Mount Norquay, Canada | desna | -115.62,51.18,-115.57,51.21 |
| 2 | `loveland` | Loveland Pass, ZDA | Loveland Pass, USA | desna | -105.91,39.63,-105.86,39.69 |
| 3 | `farellones` | Farellones, Čile | Farellones, Chile | desna | -70.40,-33.38,-70.27,-33.33 |
| 4 | `oukaimeden` | Oukaïmeden, Maroko | Oukaïmeden, Morocco | desna | -7.90,31.17,-7.80,31.27 |
| 5 | `bsari` | Bšari, Libanon | Bsharri, Lebanon | desna | 35.99,34.23,36.07,34.27 |
| 6 | `medeu` | Medeu, Kazahstan | Medeu, Kazakhstan | desna | 77.03,43.11,77.10,43.17 |
| 7 | `daegwallyeong` | Daegwallyeong, Južna Koreja | Daegwallyeong, South Korea | desna | 128.74,37.67,128.82,37.72 |
| 8 | `auli` | Auli, Indija | Auli, India | leva | 79.54,30.51,79.60,30.57 |
| 9 | `shiga` | Shiga Kogen, Japonska | Shiga Kogen, Japan | leva | 138.47,36.68,138.54,36.75 |
| 10 | `whakapapa` | Whakapapa, Nova Zelandija | Whakapapa, New Zealand | leva | 175.52,-39.25,175.58,-39.19 |

### Kaj je ob progah (iz OSM)

1. **Mount Norquay**: Mount Norquay Road (asfalt, 6,4 km) v serpentinah iz Banffa skozi gozd do smučišča. 4 sedežnice (2,8 km), 3 tekoči trakovi, 75 smučarskih prog, 4 razgledišča (pogled na Banff, Mount Rundle). Živali: debelorogi ovni na cesti, jeleni wapiti.
2. **Loveland Pass**: cesta US 6 v serpentinah do prelaza na celinskem razvodju (~3.650 m). Ob njej smučišči Arapahoe Basin in Loveland: 14 sedežnic (12,7 km), 192 smučarskih prog, tundra, melišča, jezerca. Živali: snežne koze, debelorogi ovni. Imen predorov na I 70 (po osebah) ne uporabljaj.
3. **Farellones**: Camino a Farellones (G-21, asfalt, 24,8 km v obsegu) z oštevilčenimi ovinki (table s številkami, kot na Los Caracoles in Irohazaki); za progo zgornji del do vasi. 8 sedežnic, 8 sidrišč, 8 krožnikov, 115 smučarskih prog, 9 razgledišč (Santiago v dolini). Živali: kondorji.
4. **Oukaïmeden**: RP2030 (asfalt, 23,6 km) iz doline Ourike ali makadam iz Oussertka (24 serpentin na 7 km; za progo izberi bolj zavit odsek). 1 sedežnica, 5 vlečnic, melišča, berberske vasi (1.798 stavb v obsegu), observatorij (generičen). Živali: mule, koze.
5. **Bšari**: asfaltna cesta iz Bšarija do gaja cedr in smučišča (2 sedežnici, 2 vlečnici), nad sotesko Kadiša (stene, terase, 5 razgledišč). Živali: koze.
6. **Medeu**: cesta od drsališča in jezu Medeu do smučišča Šimbulak (asfalt, ~7,5 km). Nad njo gondola (4,5 km), sedežnica, 2 kombinirani žičnici, 2 sidrišči; smrekov gozd, skale, vrhovi do 4.200 m, 13 razgledišč. Ulica je poimenovana po osebah: v igri brez imena. Viri pravijo, da cesta ni zelo zavita: izberi najbolj zavit odsek.
7. **Daegwallyeong**: stara cesta čez prelaz (Gyeonggang-ro, 456) z veliko ovinki; ovčja farma, vetrnice (preveri `power=generator`), 5 razgledišč. V tem obsegu OSM nima žičnic: smučišči Yongpyong in Alpensia (skakalnice) sta 6–8 km zahodno, zato ju primakni v pogled in zapiši pod »Približki« (kot Moki Dugway).
8. **Auli**: cesta Joshimath–Auli (asfalt, ~15 km) v serpentinah. Kabinska žičnica Auli (3,7 km), sedežnica, vlečnica, sidrišče, hrastov in deodarjev gozd, Himalaja na obzorju. Živali: opice langurji, krave.
9. **Shiga Kogen**: državna cesta 292 (asfalt) skozi smučišča: 4 gondole (4,7 km), 32 sedežnic (18,7 km), 135 smučarskih prog, 18 jezerc. Živali: snežne opice (Jigokudani je nižje v dolini: približek).
10. **Whakapapa**: Bruce Road (asfalt, ~9 km) od vasi do smučišča Top of the Bruce na vulkanu Ruapehu. Gondola Sky Waka (1,8 km), 4 sedežnice, lava, stene, grmičevje, 13 planinskih koč. Živali: skoraj jih ni (ne izmišljuj kee, živi samo na Južnem otoku).

## Podatki

- **OSM**: glavni API `https://api.openstreetmap.org/api/0.6/map?bbox=W,S,E,N` (največ 0,25 kvadratne stopinje in 50.000 točk; obseg iz tabele je dovolj majhen). `overpass-api.de` iz okolja seje ne deluje (prekinjena povezava).
- **Višine**: Terrain Tiles na AWS (`s3.amazonaws.com/elevation-tiles-prod`, kot Beartooth), Copernicus DEM (`copernicus-dem-30m.s3.amazonaws.com`); **raba tal**: ESA WorldCover (`esa-worldcover.s3.eu-central-1.amazonaws.com`). Vse troje je dosegljivo.
- Nikoli Google Maps, Google Earth ali Street View. Vire z licenco dodaj v `README.md` pod »Zasluge« (OSM: ODbL 1.0).
- Prenesene datoteke so v mapi seje (scratchpad), ne v repozitoriju; v repozitorij gredo samo izpeljani podatki v datoteki proge.

## Skupni gradniki (prva seja, skupaj s progo 1)

Graditelji obstoječih gorskih prog imajo po 50–80 KB in vsak svoje živali in žičnice (`btGoat`, `vrGoat`, `saSheepGeo`, `lfSheepGeo`, `hoLift`). Novih deset prog uporablja skupne gradnike, napisane enkrat:

- `js/world-gore.js` (`World.gore`): gondola s kabinami, ki se premikajo, sedežnica, vlečnica in sidrišče (stebri, vrv, postaji), smučarske proge po terenu (sneg iz OSM `piste:type`), snegolovi, količki, generične koče in postaje; živali (ovca, koza, debelorogi oven, snežna koza, mula, krava, opica, kondor) kot instance. Vse z instanciranjem, da je malo klicev risanja. Teksture snega lahko vzame iz `MisKit.snowTex` ali naredi svoje.
- `tools/proga-uvoz.mjs`: iz izvlečka OSM, višinskega modela in rabe tal naredi sredinsko črto (zglajeno, odprte serpentine kot na Irohazaki), višine, pas terena in seznam objektov (žičnice, stavbe, gozd, voda) v obliki, ki jo bere datoteka proge.
- Gradnike preizkusi na progi 1; poznejše proge jih samo uporabljajo in po potrebi dopolnijo (brez spreminjanja videza že narejenih prog).

## Postopek za vsako progo

1. Preberi ta načrt, `CLAUDE.md`, vrstice proge v `docs/kazalo.md` in eno predlogo: prejšnjo novo progo iz tega sklopa (za progo 1 `js/tracks/iroha.js` in `js/world-iroha.js`). Velikih datotek ne beri, samo grep.
2. Prenesi OSM za obseg iz tabele, višine in rabo tal; z uvoznikom izberi odsek 2–5 km z največ ovinki, ob katerem so žičnice v vidnem polju.
3. `js/tracks/<id>.js`, `js/world-<id>.js`, vrstica v `index.html` (gorske proge skupaj), angleščina v `js/lang.js`, `docs/proge/<id>.md`, vrstica v »Proge« in »Zasluge« v `README.md`, test po vzoru obstoječih, kazalo.
4. Slika za meni `assets/tracks/<id>.webp` in `<id>-rain.webp` (`maketa-menija/README.md`).
5. `node tools/stamp.js`, `npm run golden:update`, `npm run test:related`, `node tests/browser/menu.test.mjs`; obremenitev pod mejami iz `CLAUDE.md` (~300 klicev, ~900 tisoč oglišč) in brez povečanja na drugih progah.
6. Pull request kot osnutek, ko je lokalno zeleno ga označi kot pripravljenega, čakaj na teste z `subscribe_pr_activity` (ne s preverjanjem v zanki), združi, posodobi Stanje in zaženi naslednjo sejo.

## Varčevanje s tokeni (brez izgube kakovosti)

- Gradniki in uvoznik se napišejo enkrat, proge jih samo uporabljajo.
- Vsaka proga je nova seja s svežim kontekstom; predloga je ena datoteka (prejšnja proga sklopa).
- Slike: stalna mesta na progi (`tools/shot.mjs --m`), več pogledov združenih v eno sliko z manjšo ločljivostjo, največ trije krogi popravkov.
- Lokalno samo povezani testi; celotni nabori na GitHubu. Na teste se čaka z dogodki GitHuba.
- Brez raziskovanja: podatki in odločitve so v tem načrtu. Vprašanja uporabniku samo, če gre res za njegovo odločitev (stran Odločitve).

## Stanje

| # | Proga | Veja | Stanje |
|---|---|---|---|
| 1 | Mount Norquay, Kanada (+ gradniki, uvoznik) | `gorske-proge/01-norquay` | v delu |
| 2 | Loveland Pass, ZDA | `gorske-proge/02-loveland` | čaka |
| 3 | Farellones, Čile | `gorske-proge/03-farellones` | čaka |
| 4 | Oukaïmeden, Maroko | `gorske-proge/04-oukaimeden` | čaka |
| 5 | Bšari, Libanon | `gorske-proge/05-bsari` | čaka |
| 6 | Medeu, Kazahstan | `gorske-proge/06-medeu` | čaka |
| 7 | Daegwallyeong, Južna Koreja | `gorske-proge/07-daegwallyeong` | čaka |
| 8 | Auli, Indija | `gorske-proge/08-auli` | čaka |
| 9 | Shiga Kogen, Japonska | `gorske-proge/09-shiga` | čaka |
| 10 | Whakapapa, Nova Zelandija | `gorske-proge/10-whakapapa` | čaka |
