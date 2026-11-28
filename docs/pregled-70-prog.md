# Pregled 70 prog (sobota 28. 11. 2026, za nedeljo 29. 11.)

Matejeva odločitev O-28-3 (28. 11.): »nedeljski pregled 70 prog« je ok; izvedeta biketraveler in croatiadata. Ta dokument je **samo popis**: na progah v tej veji ni nič spremenjeno, zamrznjene (`test: true`, `pending: true`) so samo zapisane.

## Kako

`node tools/pregled-70-prog.js` (samo bere, `git show` / `git ls-tree`) izpiše tabelo za `origin/main` in odprte PR prog (seznam `PRS` v orodju: #788, #1118, #1241, #1135, #1212, #791, #1090, #1092–#1096, #1149; stanje 28. 11. popoldne); `--zapisi` prepiše tabelo spodaj, `--pr 1234:veja` doda PR. Veje PR morajo biti pridobljene (`git fetch origin <veja>:refs/remotes/origin/<veja>`). PR, ki samo spremeni datoteko proge, ki je že na `main` (#1149), orodje ne šteje; zapisan je spodaj.

Preverbe so po besedilu datotek in zato približne:
- **dolžina**: `window.MENU.lens` v `js/menu-data.js`;
- **slike**: `assets/tracks/<id>.webp` in `<id>-rain.webp`;
- **en**: `en: { name, desc }` v datoteki proge;
- **lang.js**: v `js/lang.js` je omenjen kraj ali `id` (imena ovinkov, HUD). Za proge brez posebnih nizov je »ne« lahko pravilno;
- **README**: seznam = povezava na `docs/proge/<id>.md`; Zasluge = vrstica proge pod `## Zasluge` z besedo licence (ODbL, CC …);
- **izletna cona**: beseda »izletn…« v `docs/proge/<id>.md` (izjeme iz `CLAUDE.md`: Kali Gandaki, Musandam, Limalimo, Darvaz, mestne proge). »Ni omenjena« pomeni, da opis o njej molči, ne da cona manjka;
- **test**: `tests/<id>.test.js`. **CI**: na vseh odprtih PR prog so testni krogi »skipped« (osnutki, krog ni tekel); uspešna je samo gradnja Pages (#1212, #1241). Stanje testov PR je zato neznano, dokler PR ni »Ready for review« ali se krog ne zažene.

## Ugotovitve (28. 11. popoldne)

- **`main`**: 66 prog v igri, 45 zamrznjenih (ne štejejo). Finska je dvakrat (Harju, Koli): #1098 da Harju `test: true`, zato je po pravilu ene proge na državo **65**.
- **Odprti PR, nove proge v igri (21)**: #788 17 (Atimpoku, Atitlán, Cromwell, Darvaz, Hin Boun, Houli, Kali Gandaki, Limalimo, Livingstone, Mogyoród, Mujib, Musandam, Pärnu, Sindia, Tocancipá, Viñales, Yahuarcocha); #1118 El Castaño, Trebević; #1135 Envalira (tudi v #791); #1212 Giza. #1149 doda še 2 (Crystal Palace, Dadès; London in Marakeš gresta v test).
- **Skupaj**: 65 + 21 + 2 = **88 ≥ 70**. Do 70 manjka **5 prog na `main`**; samo #788 da 82. Nove države niso potrebne.
- **Prekrivanje**: #1135 vsebuje vse iz #788 ter El Castaño, Trebević, Envalira, Meteora, Šipka, Kudowa, Stavrovouni; #1241 El Castaño, Kudowa, Meteora, Trebević. #1090 in #1092–#1096 so podvojeni z zbirnimi PR. Združi se **ena** zbirna veja (#788 + #1118 ali #1135), ostale se zaprejo.
- **Na odločitev** (`pending`, ne štejejo): Meteora, Šipka, Kudowa-Zdrój, Stavrovouni.
- **Kaj manjka pri progah v igri (main + PR)**:
  - **izletna cona ni opisana (34)**: balea, canaries, chapman, cusco, ella, furka, ghoufi, gudauri, isalo, isuna, izoard, kanaba, katu, koli, kotor, krasnahorka, livorno, llogara, mapileng, medeu, ngorongoro, nring, pikes, portobelo, portomoniz, sacalobra, santoantao, spa, tapini, tatev, tianmen, ujarras, elcastano, envalira (Šipka in Stavrovouni tudi, a sta na odločitev);
  - **brez testa (5)**: harju, nring, rbring, spa, tapini;
  - **brez omembe v `js/lang.js` (10, približno)**: bathurst, caracoles, chapman, cusco, ghoufi, krasnahorka, tapini, ujarras, vinales, envalira;
  - slike, `en`, README (seznam, Zasluge) in `docs/proge/` so pri vseh v redu.
- **Zamrznjene (samo zapis, ne spreminjaj)**: Vršič nima slik menija; Gora, Gozd, Grom in Jezero Ring nimajo imena »Kraj, Država«, README in `docs/proge/`; Monaco in Riviera nimata README in `docs/proge/`; brez Zaslug longford, ouninpohja, toronto, toskana; Big Sur in Jezero nimata `en`.
- **Predlagani vrstni red**: 1) #788 (17 prog, 82 skupaj); 2) #1118 (ali namesto obeh #1135, ena zbirna); 3) #1212 Giza; 4) #1098 Harju v test; 5) #1149; 6) odločitve Meteora, Šipka, Kudowa, Stavrovouni; 7) zapreti podvojene #1090, #1092–#1096, #1241/#791 po potrebi; 8) en zbirni PR z opisi izletne cone (34), brez sprememb geometrije.

## Tabela

<!-- tabela:začetek -->
| # | Proga | `id` | Stanje | Dolžina | .webp | -rain | en | lang.js | README seznam | Zasluge | docs/proge | Izletna cona | Test | Manjka |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Aguascalientes, Mehika | `aguascalientes` | main | 1,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 2 | Mount Baldy, ZDA | `baldy` | zamrznjena (test) | 7,2 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 3 | Bâlea, Romunija | `balea` | main | 3,5 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 4 | Bang Saen, Tajska | `bangsaen` | zamrznjena (test) | 3,6 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 5 | Batangas, Filipini | `batangas` | main | 3,6 km | da | da | da | da | da | da | da | v opisu | da | — |
| 6 | Bathurst, Avstralija | `bathurst` | main | 6,2 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 7 | Beartooth, ZDA | `beartooth` | zamrznjena (test) | 4,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 8 | Big Sur, ZDA | `bigsur` | zamrznjena (test) | 4,0 km | da | da | **ne** | da | da | da | da | v opisu | da | en v progi |
| 9 | Biķernieki, Latvija | `bikernieki` | main | 3,7 km | da | da | da | da | da | da | da | v opisu | da | — |
| 10 | Buriram, Tajska | `buriram` | main | 4,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 11 | Canaries, Sveta Lucija | `canaries` | main | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 12 | Los Caracoles, Čile | `caracoles` | main | 10,8 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 13 | Chamarel, Mavricij | `chamarel` | main | 5,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 14 | Chapman's Peak, Južna Afrika | `chapman` | main | 4,7 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 15 | Crystal Palace, Anglija | `cpalace` | zamrznjena (na odločitev) | 3,2 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 16 | Cusco, Peru | `cusco` | main | 0,9 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 17 | Dadès, Maroko | `dades` | zamrznjena (na odločitev) | 3,2 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 18 | Detroit, ZDA | `detroit` | zamrznjena (test) | 2,6 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 19 | El Jem, Tunizija | `eljem` | main | 1,5 km | da | da | da | da | da | da | da | mestna? | da | — |
| 20 | Ella, Šrilanka | `ella` | main | 4,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 21 | Espinazo del Diablo, Mehika | `espinazo` | zamrznjena (test) | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 22 | Furka, Švica | `furka` | main | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 23 | Ghoufi, Alžirija | `ghoufi` | main | 0,6 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 24 | Gorski reli | `gora` | zamrznjena (test) | 1,6 km | da | da | da | da | **ne** | **ne** | **ne** | — | **ne** | README seznam; README Zasluge; docs/proge; test; ime ni »Kraj, Država« |
| 25 | Bakreni gozd | `gozd` | zamrznjena (test) | 1,5 km | da | da | da | da | **ne** | **ne** | **ne** | — | **ne** | README seznam; README Zasluge; docs/proge; test; ime ni »Kraj, Država« |
| 26 | Great Alpine Road, Avstralija | `greatalpine` | zamrznjena (test) | 8,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 27 | Gromski rt | `grom` | zamrznjena (test) | 1,0 km | da | da | da | da | **ne** | **ne** | **ne** | — | **ne** | README seznam; README Zasluge; docs/proge; test; ime ni »Kraj, Država« |
| 28 | Gudauri, Gruzija | `gudauri` | main | 4,8 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 29 | Džebel Hafit, Združeni arabski emirati | `hafit` | zamrznjena (na odločitev) | 4,8 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 30 | Hải Vân, Vietnam | `haivan` | zamrznjena (test) | 2,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 31 | Hakone, Japonska | `hakone` | main | 26,7 km | da | da | da | da | da | da | da | v opisu | da | — |
| 32 | Harju, Finska | `harju` | main | 2,5 km | da | da | da | da | da | da | da | mestna? | **ne** | test |
| 33 | Hiva, Uzbekistan | `hiva` | main | 3,0 km | da | da | da | da | da | da | da | mestna? | da | — |
| 34 | Mount Hotham, Avstralija | `hotham` | zamrznjena (test) | 7,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 35 | Irishtown, Jamajka | `irishtown` | zamrznjena (na odločitev) | 4,2 km | da | da | da | da | da | da | da | v opisu | da | — |
| 36 | Irohazaka, Japonska | `iroha` | zamrznjena (test) | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 37 | Isalo, Madagaskar | `isalo` | main | 2,5 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 38 | Isuna, Butan | `isuna` | main | 3,4 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 39 | Izoard, Francija | `izoard` | main | 4,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 40 | Jezero Ring | `jezero` | zamrznjena (test) | 1,8 km | da | da | **ne** | da | **ne** | **ne** | **ne** | — | **ne** | en v progi; README seznam; README Zasluge; docs/proge; test; ime ni »Kraj, Država« |
| 41 | Kågeröd, Švedska | `kagerod` | main | 2,1 km | da | da | da | da | da | da | da | v opisu | da | — |
| 42 | Kanaba, Uganda | `kanaba` | main | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 43 | Katu-Jaryk, Rusija | `katu` | main | 4,7 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 44 | Kildare, Irska | `kildare` | main | 1,1 km | da | da | da | da | da | da | da | v opisu | da | — |
| 45 | Killar, Indija | `killar` | main | 4,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 46 | Koli, Finska | `koli` | main | 2,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 47 | Koror, Palau | `koror` | main | 3,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 48 | Kotor, Črna gora | `kotor` | main | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 49 | Krásna Hôrka, Slovaška | `krasnahorka` | main | 3,4 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 50 | Livorno, Italija | `livorno` | main | 19,1 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 51 | Llogara, Albanija | `llogara` | main | 4,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 52 | Lombok, Indonezija | `lombok` | main | 4,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 53 | London, Anglija | `london` | zamrznjena (na odločitev) | 1,8 km | da | da | da | da | da | da | da | v opisu | da | — |
| 54 | Longford, Avstralija | `longford` | zamrznjena (test) | 7,0 km | da | da | da | da | da | **ne** | da | ni omenjena | da | README Zasluge; izletna cona ni opisana |
| 55 | Longyearbyen, Norveška | `longyearbyen` | zamrznjena (test) | 4,3 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 56 | Luanda, Angola | `luanda` | main | 3,5 km | da | da | da | da | da | da | da | mestna? | da | — |
| 57 | Lusail, Katar | `lusail` | main | 5,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 58 | Mã Pí Lèng, Vietnam | `mapileng` | main | 1,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 59 | Marrakesh, Maroko | `marrakesh` | zamrznjena (na odločitev) | 3,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 60 | Mauna Kea, ZDA | `maunakea` | zamrznjena (test) | 5,7 km | da | da | da | da | da | da | da | v opisu | da | — |
| 61 | Medeu, Kazahstan | `medeu` | main | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 62 | Medvode, Slovenija | `medvode` | zamrznjena (na odločitev) | 6,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 63 | Moki Dugway, ZDA | `moki` | zamrznjena (test) | 5,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 64 | Mombasa, Kenija | `mombasa` | main | 3,4 km | da | da | da | da | da | da | da | mestna? | da | — |
| 65 | Monte Carlo, Monako | `monaco` | zamrznjena (test) | 3,3 km | da | da | da | da | **ne** | **ne** | **ne** | — | **ne** | README seznam; README Zasluge; docs/proge; test |
| 66 | Monterey, ZDA | `monterey` | zamrznjena (test) | 3,6 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 67 | Montréal, Kanada | `montreal` | main | 4,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 68 | Mount Buller, Avstralija | `mountbuller` | zamrznjena (test) | 2,5 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 69 | Santa Monica Mountains, ZDA | `mulholland` | zamrznjena (test) | 4,2 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 70 | Newcastle, Avstralija | `newcastle` | zamrznjena (test) | 2,6 km | da | da | da | da | da | da | da | mestna? | da | — |
| 71 | Ngorongoro, Tanzanija | `ngorongoro` | main | 3,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 72 | Nürburg, Nemčija | `nring` | main | 20,7 km | da | da | da | da | da | da | da | ni omenjena | **ne** | test; izletna cona ni opisana |
| 73 | Ouninpohja, Finska | `ouninpohja` | zamrznjena (test) | 9,7 km | da | da | da | **ne** | da | **ne** | da | ni omenjena | **ne** | lang.js; README Zasluge; test; izletna cona ni opisana |
| 74 | Palomar Mountain, ZDA | `palomar` | zamrznjena (test) | 8,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 75 | Pembrey, Wales | `pembrey` | main | 2,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 76 | Pikes Peak, ZDA | `pikes` | main | 6,1 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 77 | Portobelo, Panama | `portobelo` | main | 2,6 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 78 | Porto Moniz, Portugalska | `portomoniz` | main | 4,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 79 | Quezaltepeque, Salvador | `quezaltepeque` | main | 3,2 km | da | da | da | da | da | da | da | v opisu | da | — |
| 80 | Rio do Rastro, Brazilija | `rastro` | main | 4,2 km | da | da | da | da | da | da | da | v opisu | da | — |
| 81 | Štajerska, Avstrija | `rbring` | main | 4,3 km | da | da | da | da | da | da | da | v opisu | **ne** | test |
| 82 | Rio de Janeiro, Brazilija | `rio` | zamrznjena (test) | 4,9 km | da | da | da | da | da | da | da | v opisu | da | — |
| 83 | Termas de Río Hondo, Argentina | `riohondo` | main | 4,8 km | da | da | da | da | da | da | da | v opisu | da | — |
| 84 | Riverside, ZDA | `riverside` | zamrznjena (test) | 5,3 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 85 | Riviera, Francija | `riviera` | zamrznjena (test) | 1,3 km | da | da | da | **ne** | **ne** | **ne** | **ne** | — | **ne** | lang.js; README seznam; README Zasluge; docs/proge; test |
| 86 | Sa Calobra, Španija | `sacalobra` | main | 4,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 87 | Sakhir, Bahrajn | `sakhir` | main | 5,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 88 | Sani Pass, Južna Afrika | `sani` | zamrznjena (test) | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 89 | Santo Antão, Zelenortski otoki | `santoantao` | main | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 90 | Savusavu, Fidži | `savusavu` | main | 2,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 91 | Seul, Južna Koreja | `seoul` | main | 2,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 92 | Sepang, Malezija | `sepang` | main | 5,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 93 | Silkeborg, Danska | `silkeborg` | main | 2,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 94 | Sogeri, Papua Nova Gvineja | `sogeri` | zamrznjena (test) | 2,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 95 | Sosnová, Češka | `sosnova` | main | 1,7 km | da | da | da | da | da | da | da | v opisu | da | — |
| 96 | Spa, Belgija | `spa` | main | 7,0 km | da | da | da | da | da | da | da | ni omenjena | **ne** | test; izletna cona ni opisana |
| 97 | Suzuka, Japonska | `suzuka` | zamrznjena (test) | 5,8 km | da | da | da | da | da | da | da | ni omenjena | **ne** | test; izletna cona ni opisana |
| 98 | Tapini, Papua Nova Gvineja | `tapini` | main | 0,5 km | da | da | da | **ne** | da | da | da | ni omenjena | **ne** | lang.js; test; izletna cona ni opisana |
| 99 | Tatev, Armenija | `tatev` | main | 7,2 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 100 | Tianmen, Kitajska | `tianmen` | main | 4,2 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 101 | Toronto, Kanada | `toronto` | zamrznjena (test) | 2,9 km | da | da | da | **ne** | da | **ne** | da | v opisu | da | lang.js; README Zasluge |
| 102 | Toskana, Italija | `toskana` | zamrznjena (test) | 1,4 km | da | da | da | **ne** | da | **ne** | da | v opisu | **ne** | lang.js; README Zasluge; test |
| 103 | Townsville, Avstralija | `townsville` | zamrznjena (test) | 2,8 km | da | da | da | **ne** | da | da | da | mestna? | da | lang.js |
| 104 | Trois-Rivières, Kanada | `troisrivieres` | zamrznjena (test) | 2,4 km | da | da | da | **ne** | da | da | da | mestna? | da | lang.js |
| 105 | Tuzla, Turčija | `tuzla` | main | 5,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 106 | Ujarrás, Kostarika | `ujarras` | main | 0,7 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 107 | Uncompahgre, ZDA | `uncompahgre` | zamrznjena (test) | 4,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 108 | Vaoala, Samoa | `vaoala` | main | 1,9 km | da | da | da | da | da | da | da | v opisu | da | — |
| 109 | Vršič, Slovenija | `vrsic` | zamrznjena (test) | 12,3 km | **ne** | **ne** | da | da | da | da | da | ni omenjena | da | slika; slika v dežju; izletna cona ni opisana |
| 110 | Zandvoort, Nizozemska | `zandvoort` | main | 4,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 111 | Zürich, Švica | `zurich` | zamrznjena (test) | 4,5 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 112 | Atimpoku, Gana | `atimpoku` | #788 | 4,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 113 | Atitlán, Gvatemala | `atitlan` | #788 | 1,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 114 | Cromwell, Nova Zelandija | `cromwell` | #788 | 4,1 km | da | da | da | da | da | da | da | v opisu | da | — |
| 115 | Darvaz, Tadžikistan | `darvaz` | #788 | 3,9 km | da | da | da | da | da | da | da | izjema | da | — |
| 116 | Phou Hin Boun, Laos | `hinboun` | #788 | 4,8 km | da | da | da | da | da | da | da | v opisu | da | — |
| 117 | Houli, Tajvan | `houli` | #788 | 3,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 118 | Kali Gandaki, Nepal | `kaligandaki` | #788 | 3,0 km | da | da | da | da | da | da | da | izjema | da | — |
| 119 | Limalimo, Etiopija | `limalimo` | #788 | 4,0 km | da | da | da | da | da | da | da | izjema | da | — |
| 120 | Livingstone, Zambija | `livingstone` | #788 | 4,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 121 | Mogyoród, Madžarska | `mogyorod` | #788 | 4,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 122 | Wadi Mujib, Jordanija | `mujib` | #788 | 1,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 123 | Musandam, Oman | `musandam` | #788 | 3,9 km | da | da | da | da | da | da | da | izjema | da | — |
| 124 | Pärnu, Estonija | `parnu` | #788 | 3,2 km | da | da | da | da | da | da | da | v opisu | da | — |
| 125 | Sindia, Senegal | `sindia` | #788 | 4,6 km | da | da | da | da | da | da | da | v opisu | da | — |
| 126 | Tocancipá, Kolumbija | `tocancipa` | #788 | 2,7 km | da | da | da | da | da | da | da | v opisu | da | — |
| 127 | Viñales, Kuba | `vinales` | #788 | 1,3 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 128 | Yahuarcocha, Ekvador | `yahuarcocha` | #788 | 3,6 km | da | da | da | da | da | da | da | v opisu | da | — |
| 129 | El Castaño, Venezuela | `elcastano` | #1118 | 7,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 130 | Meteora, Grčija | `meteora` | #1118, na odločitev | 5,9 km | da | da | da | da | da | da | da | v opisu | da | — |
| 131 | Šipka, Bolgarija | `sipka` | #1118, na odločitev | 4,8 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 132 | Trebević, Bosna in Hercegovina | `trebevic` | #1118 | 4,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 133 | El Castaño, Venezuela | `elcastano` | #1241 (tudi v drugem PR) | 7,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 134 | Kudowa-Zdrój, Poljska | `kudowa` | #1241, na odločitev | 7,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 135 | Meteora, Grčija | `meteora` | #1241 (tudi v drugem PR), na odločitev | 5,9 km | da | da | da | da | da | da | da | v opisu | da | — |
| 136 | Trebević, Bosna in Hercegovina | `trebevic` | #1241 (tudi v drugem PR) | 4,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 137 | Atimpoku, Gana | `atimpoku` | #1135 (tudi v drugem PR) | 4,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 138 | Atitlán, Gvatemala | `atitlan` | #1135 (tudi v drugem PR) | 1,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 139 | Cromwell, Nova Zelandija | `cromwell` | #1135 (tudi v drugem PR) | 4,1 km | da | da | da | da | da | da | da | v opisu | da | — |
| 140 | Darvaz, Tadžikistan | `darvaz` | #1135 (tudi v drugem PR) | 3,9 km | da | da | da | da | da | da | da | izjema | da | — |
| 141 | El Castaño, Venezuela | `elcastano` | #1135 (tudi v drugem PR) | 7,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 142 | Envalira, Andora | `envalira` | #1135 | 0,7 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 143 | Phou Hin Boun, Laos | `hinboun` | #1135 (tudi v drugem PR) | 4,8 km | da | da | da | da | da | da | da | v opisu | da | — |
| 144 | Houli, Tajvan | `houli` | #1135 (tudi v drugem PR) | 3,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 145 | Kali Gandaki, Nepal | `kaligandaki` | #1135 (tudi v drugem PR) | 3,0 km | da | da | da | da | da | da | da | izjema | da | — |
| 146 | Kudowa-Zdrój, Poljska | `kudowa` | #1135 (tudi v drugem PR), na odločitev | 7,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 147 | Limalimo, Etiopija | `limalimo` | #1135 (tudi v drugem PR) | 4,0 km | da | da | da | da | da | da | da | izjema | da | — |
| 148 | Livingstone, Zambija | `livingstone` | #1135 (tudi v drugem PR) | 4,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 149 | Meteora, Grčija | `meteora` | #1135 (tudi v drugem PR), na odločitev | 5,9 km | da | da | da | da | da | da | da | v opisu | da | — |
| 150 | Mogyoród, Madžarska | `mogyorod` | #1135 (tudi v drugem PR) | 4,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 151 | Wadi Mujib, Jordanija | `mujib` | #1135 (tudi v drugem PR) | 1,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 152 | Musandam, Oman | `musandam` | #1135 (tudi v drugem PR) | 3,9 km | da | da | da | da | da | da | da | izjema | da | — |
| 153 | Pärnu, Estonija | `parnu` | #1135 (tudi v drugem PR) | 3,2 km | da | da | da | da | da | da | da | v opisu | da | — |
| 154 | Sindia, Senegal | `sindia` | #1135 (tudi v drugem PR) | 4,6 km | da | da | da | da | da | da | da | v opisu | da | — |
| 155 | Šipka, Bolgarija | `sipka` | #1135 (tudi v drugem PR), na odločitev | 4,8 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 156 | Stavrovouni, Ciper | `stavrovouni` | #1135, na odločitev | 4,5 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 157 | Tocancipá, Kolumbija | `tocancipa` | #1135 (tudi v drugem PR) | 2,7 km | da | da | da | da | da | da | da | v opisu | da | — |
| 158 | Trebević, Bosna in Hercegovina | `trebevic` | #1135 (tudi v drugem PR) | 4,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 159 | Viñales, Kuba | `vinales` | #1135 (tudi v drugem PR) | 1,3 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 160 | Yahuarcocha, Ekvador | `yahuarcocha` | #1135 (tudi v drugem PR) | 3,6 km | da | da | da | da | da | da | da | v opisu | da | — |
| 161 | Giza, Egipt | `giza` | #1212 | 9,9 km | da | da | da | da | da | da | da | v opisu | da | — |
| 162 | Envalira, Andora | `envalira` | #791 (tudi v drugem PR) | 0,7 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 163 | El Castaño, Venezuela | `elcastano` | #1090 (tudi v drugem PR) | 7,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 164 | Stavrovouni, Ciper | `stavrovouni` | #1092 (tudi v drugem PR), na odločitev | 4,5 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 165 | Kudowa-Zdrój, Poljska | `kudowa` | #1093 (tudi v drugem PR), na odločitev | 7,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 166 | Meteora, Grčija | `meteora` | #1094 (tudi v drugem PR), na odločitev | 5,9 km | da | da | da | da | da | da | da | v opisu | da | — |
| 167 | Šipka, Bolgarija | `sipka` | #1095 (tudi v drugem PR), na odločitev | 4,8 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 168 | Trebević, Bosna in Hercegovina | `trebevic` | #1096 (tudi v drugem PR) | 4,3 km | da | da | da | da | da | da | da | v opisu | da | — |

Skupaj: 66 prog v igri na main, 45 zamrznjenih, 21 novih v odprtih PR (brez podvojenih); v igri in v PR: 87 od 70.
<!-- tabela:konec -->
