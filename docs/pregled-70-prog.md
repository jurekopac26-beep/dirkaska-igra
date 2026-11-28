# Pregled 70 prog (nedelja 29. 11. 2026)

Matejeva odločitev O-28-3 (28. 11.): »nedeljski pregled 70 prog« je ok; izvedeta biketraveler in croatiadata. Ta dokument je **samo popis**: na progah v tej veji ni nič spremenjeno, zamrznjene (`test: true`, `pending: true`) so samo zapisane.

## Kako

`node tools/pregled-70-prog.js` (samo bere, `git show` / `git ls-tree`) izpiše tabelo za `origin/main` in odprte PR prog (#788, #1118, #1090–#1097); `--zapisi` prepiše tabelo spodaj, `--pr 1234:veja` doda PR. Veje PR morajo biti pridobljene (`git fetch origin <veja>:refs/remotes/origin/<veja>`).

Preverbe so po besedilu datotek in zato približne:
- **dolžina**: `window.MENU.lens` v `js/menu-data.js`;
- **slike**: `assets/tracks/<id>.webp` in `<id>-rain.webp`;
- **en**: `en: { name, desc }` v datoteki proge;
- **lang.js**: v `js/lang.js` je omenjen kraj ali `id` (imena ovinkov, HUD). Za proge brez posebnih nizov je »ne« lahko pravilno;
- **README**: seznam = povezava na `docs/proge/<id>.md`; Zasluge = vrstica proge pod `## Zasluge` z besedo licence (ODbL, CC …);
- **izletna cona**: beseda »izletn…« v `docs/proge/<id>.md` (izjeme iz `CLAUDE.md`: Kali Gandaki, Musandam, Limalimo, Darvaz, mestne proge). »Ni omenjena« pomeni, da opis o njej molči, ne da cona manjka;
- **test**: `tests/<id>.test.js`. CI na PR #788 in #1118 je bil ob pregledu »skipped« (osnutek, krog ni tekel). V opisu #788 piše, da so lokalni testi zeleni (meni 322/322, povezani 73/73).

## Ugotovitve

- **Šteto proti 70**: 64 prog v igri na `main` in 21 novih v odprtih PR = **85** (cilj 70 do 23. 12. je dosegljiv, če se #788 in #1118 združita). Na `main` je še 45 zamrznjenih, ki se ne štejejo.
- **Na odločitev v PR** (`pending`, ne štejejo): Meteora, Šipka (#1118 in #1094, #1095), Stavrovouni (#1092), Kudowa-Zdrój (#1093).
- **Podvojeno**: #1090, #1091, #1094, #1095, #1096 in #1097 imajo iste proge kot #1118 (El Castaño, Chamarel, Meteora, Šipka, Trebević, Tatev). Ko se #1118 združi, so ti PR odveč. Samo v posameznih PR sta Stavrovouni in Kudowa-Zdrój.
- **Proge v igri (main + PR), kaj manjka**:
  - **izletna cona ni opisana (35)**: balea, canaries, chapman, cusco, ella, furka, ghoufi, gudauri, isalo, isuna, izoard, kanaba, katu, koli, kotor, krasnahorka, livorno, llogara, mapileng, medeu, ngorongoro, nring, pikes, portobelo, portomoniz, sacalobra, santoantao, spa, tapini, tianmen, ujarras, elcastano, sipka, tatev, stavrovouni. Pri vsaki je treba v opisu proge zapisati, ali je cona do ~3 m in na kolikšnem delu dolžine. Ali je katera mestna (izjema), potrdi uporabnik.
  - **brez testa `tests/<id>.test.js` (5)**: harju, nring, rbring, spa, tapini.
  - **brez omembe v `js/lang.js` (9, približno)**: bathurst, caracoles, chapman, cusco, ghoufi, krasnahorka, tapini, ujarras, vinales. Preveri, ali imajo imena ovinkov ali nize HUD, ki jih ni prevedenih.
  - slike, `en`, README (seznam in Zasluge) ter `docs/proge/` so pri vseh 85 v redu.
- **Zamrznjene (samo zapis, ne spreminjaj)**:
  - Vršič nima slik menija.
  - Gora, Gozd, Grom in Jezero Ring nimajo imena »Kraj, Država« in nimajo vnosov v README in `docs/proge/` (testne proge).
  - Monaco in Riviera nimata vnosov v README in `docs/proge/`.
  - Brez vrstice v Zaslugah so še: longford, ouninpohja, toronto, toskana.
  - Big Sur in Jezero nimata `en`.
  - Izletna cona ni opisana pri 21 zamrznjenih.
- **Predlog za croatiadata / naslednjo sejo**: najprej združitev #788 in #1118, nato zapre podvojene PR #1090/#1091/#1094–#1097. Odločitve: Meteora, Šipka, Stavrovouni, Kudowa. Nato en zbirni PR z opisi izletne cone (35 prog), brez sprememb geometrije.

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
| 13 | Chapman's Peak, Južna Afrika | `chapman` | main | 4,7 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 14 | Crystal Palace, Anglija | `cpalace` | zamrznjena (na odločitev) | 3,2 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 15 | Cusco, Peru | `cusco` | main | 0,9 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 16 | Dadès, Maroko | `dades` | zamrznjena (na odločitev) | 3,2 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 17 | Detroit, ZDA | `detroit` | zamrznjena (test) | 2,6 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 18 | El Jem, Tunizija | `eljem` | main | 1,5 km | da | da | da | da | da | da | da | mestna? | da | — |
| 19 | Ella, Šrilanka | `ella` | main | 4,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 20 | Espinazo del Diablo, Mehika | `espinazo` | zamrznjena (test) | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 21 | Furka, Švica | `furka` | main | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 22 | Ghoufi, Alžirija | `ghoufi` | main | 0,6 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 23 | Gorski reli | `gora` | zamrznjena (test) | 1,6 km | da | da | da | da | **ne** | **ne** | **ne** | — | **ne** | README seznam; README Zasluge; docs/proge; test; ime ni »Kraj, Država« |
| 24 | Bakreni gozd | `gozd` | zamrznjena (test) | 1,5 km | da | da | da | da | **ne** | **ne** | **ne** | — | **ne** | README seznam; README Zasluge; docs/proge; test; ime ni »Kraj, Država« |
| 25 | Great Alpine Road, Avstralija | `greatalpine` | zamrznjena (test) | 8,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 26 | Gromski rt | `grom` | zamrznjena (test) | 1,0 km | da | da | da | da | **ne** | **ne** | **ne** | — | **ne** | README seznam; README Zasluge; docs/proge; test; ime ni »Kraj, Država« |
| 27 | Gudauri, Gruzija | `gudauri` | main | 4,8 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 28 | Džebel Hafit, Združeni arabski emirati | `hafit` | zamrznjena (na odločitev) | 4,8 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 29 | Hải Vân, Vietnam | `haivan` | zamrznjena (test) | 2,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 30 | Hakone, Japonska | `hakone` | main | 26,7 km | da | da | da | da | da | da | da | v opisu | da | — |
| 31 | Harju, Finska | `harju` | main | 2,5 km | da | da | da | da | da | da | da | mestna? | **ne** | test |
| 32 | Hiva, Uzbekistan | `hiva` | main | 3,0 km | da | da | da | da | da | da | da | mestna? | da | — |
| 33 | Mount Hotham, Avstralija | `hotham` | zamrznjena (test) | 7,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 34 | Irishtown, Jamajka | `irishtown` | zamrznjena (na odločitev) | 4,2 km | da | da | da | da | da | da | da | v opisu | da | — |
| 35 | Irohazaka, Japonska | `iroha` | zamrznjena (test) | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 36 | Isalo, Madagaskar | `isalo` | main | 2,5 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 37 | Isuna, Butan | `isuna` | main | 3,4 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 38 | Izoard, Francija | `izoard` | main | 4,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 39 | Jezero Ring | `jezero` | zamrznjena (test) | 1,8 km | da | da | **ne** | da | **ne** | **ne** | **ne** | — | **ne** | en v progi; README seznam; README Zasluge; docs/proge; test; ime ni »Kraj, Država« |
| 40 | Kågeröd, Švedska | `kagerod` | main | 2,1 km | da | da | da | da | da | da | da | v opisu | da | — |
| 41 | Kanaba, Uganda | `kanaba` | main | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 42 | Katu-Jaryk, Rusija | `katu` | main | 4,7 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 43 | Kildare, Irska | `kildare` | main | 1,1 km | da | da | da | da | da | da | da | v opisu | da | — |
| 44 | Killar, Indija | `killar` | main | 4,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 45 | Koli, Finska | `koli` | main | 2,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 46 | Koror, Palau | `koror` | main | 3,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 47 | Kotor, Črna gora | `kotor` | main | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 48 | Krásna Hôrka, Slovaška | `krasnahorka` | main | 3,4 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 49 | Livorno, Italija | `livorno` | main | 19,1 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 50 | Llogara, Albanija | `llogara` | main | 4,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 51 | Lombok, Indonezija | `lombok` | main | 4,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 52 | London, Anglija | `london` | zamrznjena (na odločitev) | 1,8 km | da | da | da | da | da | da | da | v opisu | da | — |
| 53 | Longford, Avstralija | `longford` | zamrznjena (test) | 7,0 km | da | da | da | da | da | **ne** | da | ni omenjena | da | README Zasluge; izletna cona ni opisana |
| 54 | Longyearbyen, Norveška | `longyearbyen` | zamrznjena (test) | 4,3 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 55 | Luanda, Angola | `luanda` | main | 3,5 km | da | da | da | da | da | da | da | mestna? | da | — |
| 56 | Lusail, Katar | `lusail` | main | 5,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 57 | Mã Pí Lèng, Vietnam | `mapileng` | main | 1,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 58 | Marrakesh, Maroko | `marrakesh` | zamrznjena (na odločitev) | 3,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 59 | Mauna Kea, ZDA | `maunakea` | zamrznjena (test) | 5,7 km | da | da | da | da | da | da | da | v opisu | da | — |
| 60 | Medeu, Kazahstan | `medeu` | main | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 61 | Medvode, Slovenija | `medvode` | zamrznjena (na odločitev) | 6,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 62 | Moki Dugway, ZDA | `moki` | zamrznjena (test) | 5,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 63 | Mombasa, Kenija | `mombasa` | main | 3,4 km | da | da | da | da | da | da | da | mestna? | da | — |
| 64 | Monte Carlo, Monako | `monaco` | zamrznjena (test) | 3,3 km | da | da | da | da | **ne** | **ne** | **ne** | — | **ne** | README seznam; README Zasluge; docs/proge; test |
| 65 | Monterey, ZDA | `monterey` | zamrznjena (test) | 3,6 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 66 | Montréal, Kanada | `montreal` | main | 4,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 67 | Mount Buller, Avstralija | `mountbuller` | zamrznjena (test) | 2,5 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 68 | Santa Monica Mountains, ZDA | `mulholland` | zamrznjena (test) | 4,2 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 69 | Newcastle, Avstralija | `newcastle` | zamrznjena (test) | 2,6 km | da | da | da | da | da | da | da | mestna? | da | — |
| 70 | Ngorongoro, Tanzanija | `ngorongoro` | main | 3,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 71 | Nürburg, Nemčija | `nring` | main | 20,7 km | da | da | da | da | da | da | da | ni omenjena | **ne** | test; izletna cona ni opisana |
| 72 | Ouninpohja, Finska | `ouninpohja` | zamrznjena (test) | 9,7 km | da | da | da | **ne** | da | **ne** | da | ni omenjena | **ne** | lang.js; README Zasluge; test; izletna cona ni opisana |
| 73 | Palomar Mountain, ZDA | `palomar` | zamrznjena (test) | 8,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 74 | Pembrey, Wales | `pembrey` | main | 2,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 75 | Pikes Peak, ZDA | `pikes` | main | 6,1 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 76 | Portobelo, Panama | `portobelo` | main | 2,6 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 77 | Porto Moniz, Portugalska | `portomoniz` | main | 4,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 78 | Quezaltepeque, Salvador | `quezaltepeque` | main | 3,2 km | da | da | da | da | da | da | da | v opisu | da | — |
| 79 | Rio do Rastro, Brazilija | `rastro` | main | 4,2 km | da | da | da | da | da | da | da | v opisu | da | — |
| 80 | Štajerska, Avstrija | `rbring` | main | 4,3 km | da | da | da | da | da | da | da | v opisu | **ne** | test |
| 81 | Rio de Janeiro, Brazilija | `rio` | zamrznjena (test) | 4,9 km | da | da | da | da | da | da | da | v opisu | da | — |
| 82 | Termas de Río Hondo, Argentina | `riohondo` | main | 4,8 km | da | da | da | da | da | da | da | v opisu | da | — |
| 83 | Riverside, ZDA | `riverside` | zamrznjena (test) | 5,3 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 84 | Riviera, Francija | `riviera` | zamrznjena (test) | 1,3 km | da | da | da | **ne** | **ne** | **ne** | **ne** | — | **ne** | lang.js; README seznam; README Zasluge; docs/proge; test |
| 85 | Sa Calobra, Španija | `sacalobra` | main | 4,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 86 | Sakhir, Bahrajn | `sakhir` | main | 5,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 87 | Sani Pass, Južna Afrika | `sani` | zamrznjena (test) | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 88 | Santo Antão, Zelenortski otoki | `santoantao` | main | 5,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 89 | Savusavu, Fidži | `savusavu` | main | 2,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 90 | Seul, Južna Koreja | `seoul` | main | 2,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 91 | Sepang, Malezija | `sepang` | main | 5,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 92 | Silkeborg, Danska | `silkeborg` | main | 2,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 93 | Sogeri, Papua Nova Gvineja | `sogeri` | zamrznjena (test) | 2,0 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 94 | Sosnová, Češka | `sosnova` | main | 1,7 km | da | da | da | da | da | da | da | v opisu | da | — |
| 95 | Spa, Belgija | `spa` | main | 7,0 km | da | da | da | da | da | da | da | ni omenjena | **ne** | test; izletna cona ni opisana |
| 96 | Suzuka, Japonska | `suzuka` | zamrznjena (test) | 5,8 km | da | da | da | da | da | da | da | ni omenjena | **ne** | test; izletna cona ni opisana |
| 97 | Tapini, Papua Nova Gvineja | `tapini` | main | 0,5 km | da | da | da | **ne** | da | da | da | ni omenjena | **ne** | lang.js; test; izletna cona ni opisana |
| 98 | Tianmen, Kitajska | `tianmen` | main | 4,2 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 99 | Toronto, Kanada | `toronto` | zamrznjena (test) | 2,9 km | da | da | da | **ne** | da | **ne** | da | v opisu | da | lang.js; README Zasluge |
| 100 | Toskana, Italija | `toskana` | zamrznjena (test) | 1,4 km | da | da | da | **ne** | da | **ne** | da | v opisu | **ne** | lang.js; README Zasluge; test |
| 101 | Townsville, Avstralija | `townsville` | zamrznjena (test) | 2,8 km | da | da | da | **ne** | da | da | da | mestna? | da | lang.js |
| 102 | Trois-Rivières, Kanada | `troisrivieres` | zamrznjena (test) | 2,4 km | da | da | da | **ne** | da | da | da | mestna? | da | lang.js |
| 103 | Tuzla, Turčija | `tuzla` | main | 5,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 104 | Ujarrás, Kostarika | `ujarras` | main | 0,7 km | da | da | da | **ne** | da | da | da | ni omenjena | da | lang.js; izletna cona ni opisana |
| 105 | Uncompahgre, ZDA | `uncompahgre` | zamrznjena (test) | 4,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 106 | Vaoala, Samoa | `vaoala` | main | 1,9 km | da | da | da | da | da | da | da | v opisu | da | — |
| 107 | Vršič, Slovenija | `vrsic` | zamrznjena (test) | 12,3 km | **ne** | **ne** | da | da | da | da | da | ni omenjena | da | slika; slika v dežju; izletna cona ni opisana |
| 108 | Zandvoort, Nizozemska | `zandvoort` | main | 4,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 109 | Zürich, Švica | `zurich` | zamrznjena (test) | 4,5 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 110 | Atimpoku, Gana | `atimpoku` | #788 | 4,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 111 | Atitlán, Gvatemala | `atitlan` | #788 | 1,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 112 | Cromwell, Nova Zelandija | `cromwell` | #788 | 4,1 km | da | da | da | da | da | da | da | v opisu | da | — |
| 113 | Darvaz, Tadžikistan | `darvaz` | #788 | 3,9 km | da | da | da | da | da | da | da | izjema | da | — |
| 114 | Phou Hin Boun, Laos | `hinboun` | #788 | 4,8 km | da | da | da | da | da | da | da | v opisu | da | — |
| 115 | Houli, Tajvan | `houli` | #788 | 3,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 116 | Kali Gandaki, Nepal | `kaligandaki` | #788 | 3,0 km | da | da | da | da | da | da | da | izjema | da | — |
| 117 | Limalimo, Etiopija | `limalimo` | #788 | 4,0 km | da | da | da | da | da | da | da | izjema | da | — |
| 118 | Livingstone, Zambija | `livingstone` | #788 | 4,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 119 | Mogyoród, Madžarska | `mogyorod` | #788 | 4,4 km | da | da | da | da | da | da | da | v opisu | da | — |
| 120 | Wadi Mujib, Jordanija | `mujib` | #788 | 1,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 121 | Musandam, Oman | `musandam` | #788 | 3,9 km | da | da | da | da | da | da | da | izjema | da | — |
| 122 | Pärnu, Estonija | `parnu` | #788 | 3,2 km | da | da | da | da | da | da | da | v opisu | da | — |
| 123 | Sindia, Senegal | `sindia` | #788 | 4,6 km | da | da | da | da | da | da | da | v opisu | da | — |
| 124 | Tocancipá, Kolumbija | `tocancipa` | #788 | 2,7 km | da | da | da | da | da | da | da | v opisu | da | — |
| 125 | Viñales, Kuba | `vinales` | #788 | 1,3 km | da | da | da | **ne** | da | da | da | v opisu | da | lang.js |
| 126 | Yahuarcocha, Ekvador | `yahuarcocha` | #788 | 3,6 km | da | da | da | da | da | da | da | v opisu | da | — |
| 127 | Chamarel, Mavricij | `chamarel` | #1118 | 5,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 128 | El Castaño, Venezuela | `elcastano` | #1118 | 7,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 129 | Meteora, Grčija | `meteora` | #1118, na odločitev | 5,9 km | da | da | da | da | da | da | da | v opisu | da | — |
| 130 | Šipka, Bolgarija | `sipka` | #1118, na odločitev | 4,8 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 131 | Tatev, Armenija | `tatev` | #1118 | 7,2 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 132 | Trebević, Bosna in Hercegovina | `trebevic` | #1118 | 4,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 133 | El Castaño, Venezuela | `elcastano` | #1090 (tudi v drugem PR) | 7,9 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 134 | Chamarel, Mavricij | `chamarel` | #1091 (tudi v drugem PR) | 5,0 km | da | da | da | da | da | da | da | v opisu | da | — |
| 135 | Stavrovouni, Ciper | `stavrovouni` | #1092, na odločitev | 4,5 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 136 | Kudowa-Zdrój, Poljska | `kudowa` | #1093, na odločitev | 7,5 km | da | da | da | da | da | da | da | v opisu | da | — |
| 137 | Meteora, Grčija | `meteora` | #1094 (tudi v drugem PR), na odločitev | 5,9 km | da | da | da | da | da | da | da | v opisu | da | — |
| 138 | Šipka, Bolgarija | `sipka` | #1095 (tudi v drugem PR), na odločitev | 4,8 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |
| 139 | Trebević, Bosna in Hercegovina | `trebevic` | #1096 (tudi v drugem PR) | 4,3 km | da | da | da | da | da | da | da | v opisu | da | — |
| 140 | Tatev, Armenija | `tatev` | #1097 (tudi v drugem PR) | 7,2 km | da | da | da | da | da | da | da | ni omenjena | da | izletna cona ni opisana |

Skupaj: 64 prog v igri na main, 45 zamrznjenih, 21 novih v odprtih PR (brez podvojenih); v igri in v PR: 85 od 70.
<!-- tabela:konec -->
