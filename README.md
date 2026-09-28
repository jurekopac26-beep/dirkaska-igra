# dirkaska-igra
Dirkanje z avti 

## Pikes Peak (kronometer)

Vzpon od starta (2862 m) do vrha (4301 m) proti uri, brez nasprotnikov. Na poti so kontrolne točke CP1–CP4 z vmesnimi časi. Po cilju se osebni rekord in lestvica najboljših 10 časov shranita v brskalnik na tej napravi. Pred vožnjo lahko avto nadgradiš (motor, gume, zavore, aerodinamika); nadgradnje veljajo na vseh progah. Proga je sorazmerno skrajšana na ~6,2 km (prava je 19,99 km), višine na zaslonu so prave.

## Nürburgring Nordschleife

Pravi „Zeleni pekel“ v Nemčiji v pravem merilu: en krog (20,7 km) proti 12 tekmecem, start in cilj pri tribuni T13, vožnja v smeri urinega kazalca. Oblika proge je iz OpenStreetMap, višine pa iz satelitskih višinskih modelov (SRTM in Copernicus), zato so klanci in spusti pravi: od T13 (~620 m) po Fuchsröhre navzdol do Breidscheida (~335 m, najnižja točka), nato dolg vzpon do Hohe Acht (~617 m). Ovinek Karussell je nagnjen (betonska skleda na notranji strani, avto ga lahko odpelje hitreje), na Flugplatzu in v Pflanzgartnu avto poskoči. Med vožnjo se pod uro izpišejo imena ovinkov (Hatzenbach, Flugplatz, Fuchsröhre, Adenauer Forst, Wehrseifen, Breidscheid, Bergwerk, Kesselchen, Karussell, Hohe Acht, Brünnchen, Pflanzgarten, Schwalbenschwanz, Döttinger Höhe …), pri KROG pa, koliko kilometrov kroga je že za tabo. Gozd, travniki, vasi in mostovi so postavljeni po pravi rabi tal in stavbah iz OpenStreetMap.

## Kje na progi si (proge po resničnih krajih)

Na progah Ljubljana, Monako, Pikes Peak in Nordschleife se ~70 m pred vsakim znanim krajem pod uro izpiše njegovo ime (npr. Zmajski most, Prešernov trg, Casino, predor, Glen Cove, Devil's Playground, Karussell), in to v vsakem krogu. Komentator (v angleščini) občasno pove, kje si („Over the Dragon Bridge now!“, „Up into Casino Square!“), vsak kraj praviloma enkrat na dirko, z razmikom med takimi stavki, in samo takrat, ko ne govori o nečem pomembnejšem (prehitevanja, vmesni časi, nesreče in boksi imajo prednost in ga prekinejo). Kraj, ki ga v enem krogu ni utegnil omeniti, lahko pove v naslednjem. Čas kroga ali vmesni čas ostane na zaslonu, ime kraja pa se pokaže takoj za njim.

## Fizika vožnje

Privzeta fizika je **Circuit Superstars**: avto drsi z nosom v ovinek toliko, kolikor hitro zavijaš; zaviranje v ovinku ga zavrti, na izhodu se sam poravna; brez vrtenja. Gumb za drift (preslednica) ga zavrti še malo bolj. Pomoč pri driftu (nizka/srednja/visoka) določa, kako daleč lahko zadrsa. **Arkadna** je prejšnja fizika in je na voljo v Nastavitvah (Fizika vožnje: Arkadna). Rekordi se za vsako fiziko vodijo posebej.

## Zgradba projekta

Igra ne potrebuje namestitve ali prevajanja: `index.html` naloži datoteke po vrsti, deluje pa tudi, če ga odpreš neposredno z diska.

| Pot | Vsebina |
|---|---|
| `index.html` | HTML menijev in HUD-a, povezave na vse datoteke |
| `css/style.css` | slogi |
| `js/vendor/three.r128.min.js` | knjižnica three.js (MIT) |
| `js/tracks/<id>.js` | ena datoteka na progo: oblika, višine, sidrišča okolice, imena krajev (vrstni red v `index.html` = vrstni red v meniju) |
| `js/core.js` | proge, fizika (Circuit Superstars in arkadna), AI, pravila dirke (brez DOM in three.js) |
| `js/tex.js` | proceduralne teksture |
| `js/world.js` | 3D svet prog (teren, drevesa, gledalci, rekviziti, boksi) |
| `js/data/p206.js` | 3D model Peugeota 206 |
| `js/render.js` | izris, avti, delci, kamere, mehaniki v boksih |
| `js/sfx.js`, `js/input.js`, `js/comm.js` | zvok, upravljanje, komentator |
| `js/game.js` | meniji, nastavitve, HUD, rekordi, glavna zanka |
| `tests/` | samodejni testi (glej `tests/README.md`) |
| `tools/stamp.js` | po vsaki spremembi datoteke v `js/` ali `css/` zaženi `node tools/stamp.js`: povezave v `index.html` dobijo oznako vsebine (`?v=…`), da brskalnik po posodobitvi ne pomeša starih in novih datotek |

Igra potrebuje vse datoteke skupaj: sam `index.html` (brez map `css/` in `js/`) ne deluje.

### Nova proga

1. Nova datoteka `js/tracks/<id>.js` z definicijo proge (po vzoru obstoječih).
2. V `index.html` dodaj `<script src="js/tracks/<id>.js"></script>` pred `js/core.js`, na mesto, kjer naj bo proga v meniju, nato zaženi `node tools/stamp.js`.
3. Okolica: vsaka tema (`theme`) v `js/world.js` gradi okolico svoje proge (jezero, stavbe, gozd …), zato nova proga potrebuje svojo temo ali prilagojeno obstoječo.
4. Testi progo zajamejo sami; referenčne vrednosti zanjo ustvari `npm run golden:update`.

## Zasluge

- Avto PEUGEOT 206: 3D model [„Peugeot 206“](https://sketchfab.com/) avtorja **Alvier** (Sketchfab), licenca [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Model je poenostavljen in shranjen v `js/data/p206.js`.
- Proga Nordschleife (sredinska črta, raba tal, stavbe, mostovi, imena ovinkov): © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Podatki so vzeti iz OpenStreetMap, ki je na voljo pod licenco [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Iz njih izpeljani podatki v `js/tracks/nring.js` so prav tako na voljo pod ODbL 1.0.
- Višine Nordschleife: SRTM (NASA/USGS, javna domena) in Copernicus DEM GLO-30: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.
