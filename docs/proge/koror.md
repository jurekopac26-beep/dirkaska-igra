# Koror, Palau (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `koror` (`js/tracks/koror.js`)

Glavna cesta z južnega roba otoka Babeldaob čez most na otok Koror, ob laguni po nasipih in čez gozdnati grič do vzhodnega roba mesta Koror, v pravem merilu. Proga se začne nad mostom (~5 m, 7,3640° S, 134,5082° V), čez most in nasipe ostane tik nad morjem (najnižje ~2,5 m), nato se vzpne čez gozdnati grič do mesta (~56 m, 7,3445° S, 134,4948° V): 3,30 km, 246 °/km, 70 % ravnin (most in nasipi), brez lasnic, najostrejši ovinki na griču. Za ciljem cesta pelje še ~190 m. Desni promet. Kartica proge je ena, na njej pa je stikalo **Dirka / Kronometer / Promet / Policija** (`def.modes`, kot na Savusavuju):

- **Dirka**: tekmeci (v meniju *Opponents*, največ 90), start nad mostom (štartna mreža za črto), čez most in nasipe ob laguni in vzpon do mesta. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica najboljših 10, duh in medalje (zlata 1:20, srebrna 1:25, bronasta 1:30, v dežju 1:38 / 1:43 / 1:50; pozimi 1:32 / 1:37 / 1:43, v snegu 1:52 / 1:58 / 2:06; zlato je čas relijskega avta na avtopilotu).
- **Promet**: dvoboj z enim tekmecem po odprti cesti v obe smeri: predvsem avtomobili in poltovornjaki, kombiji, tovornjaki; ob cesti redki kolesarji.
- **Policija**: beg pred policijo do Kororja. Patrulje imajo ob bokih generičen napis POLICE (brez imena ali znaka katere koli službe), v rezultatih pobega piše »Do Kororja v …«.
- **Imena pod uro**: Most čez kanal, Nasipi ob laguni, Otoček z gozdom, Mangrove v plitvini, Levi ob laguni, Gozdnati grič, Desni na klancu (najostrejši ovinek, ~70°), Zgornji desni in Koror na cilju; komentator ima na tej progi svoje stavke ob startu, ob cilju in ob pobegu.
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (zglajena). OpenStreetMap nima podatka o širini ceste; v igri je cesta široka 10 m, da je prostora za tekmece. Višine so iz višinskega modela Copernicus DEM GLO-30, očiščene (drseča mediana, glajenje, največ 12 %); most je v višinah poravnan (`mostovi` v `tools/proga/proge.json`).

Okolica (gradi jo skupna okolica prelazov `buildPrelaz` v `js/world-prelaz.js` z videzom `PL_LOOK.koror`, tropski kot Savusavu):

- **Laguna**: morje okoli otokov (`def.sea`: ravnina morja na višini 0, dno pod njo; `P.sea` v `js/world-vrsic.js`, teren v `js/world-caracoles.js`). V morju ne stojijo hiše, skale, drevesa ali gledalci (`inSea` v `js/world-prelaz.js`). Galebi in šum valov.
- **Otoček in mangrove** (`js/world-koror.js`, lasten graditelj prek `L.extra`, samo grafika): gozdnati otoček severno od nasipa (~3,2 ha, obala iz OpenStreetMap, tla iz Copernicus DEM, gozd in mangrove iz ESA WorldCover 2021, višina krošenj ETH 2020): blaten rob, mangrove z oporniki po obodu, gozd z debli ob obali; ob cesti so tla položena k cesti (do ~20 m). V plitvini levo od ceste pri 1300–1450 m in 2000 m (50–400 m od ceste) sestoji mangrov na korenikah. Predpostavke: obala 0,35 m nad morjem, tla se dvignejo na višino modela v prvih 14 m, barve po rabi tal. Ni narisano: Rock Islands (1,1–3,3 km, onstran 700 m pogleda kamere), dva grebena, ki ju WorldCover kaže kot vodo. Obremenitev: +2 klica in +16 tisoč oglišč samo v vzorcu ob startu, drugi vzorci kot na `main`.
- **Most in nasipi**: ob mostu in nasipih nizek zid in jeklena ograja, takoj za njima morsko dno (`def.bridges`, `P.brS`).
- **Tropski gozd**: vlažen tropski gozd na griču, palme in grmovje, trava ob cesti (raba tal iz ESA WorldCover in naklonov višinskega modela). Barve tal so iz satelitskega posnetka Sentinel-2 (24. 4. 2023). Brez snega, brez ovc in brez predora.
- **Stavbe**: hiše s strehami iz valovite pločevine (gola, rdeča, modra, zelena), obrisi iz OpenStreetMap (~60 stavb do 60 m od ceste, brez imen in napisov), gostejše na robu mesta.
- **Obzorje**: onstran pasu ob cesti pravi teren ~9 km naokoli (Copernicus DEM, mreža 250 m): Babeldaob, otoki in laguna.
- **Cesta**: rumena prekinjena sredinska črta (3 m / 9 m, pred nepreglednimi ovinki neprekinjena), od sonca in soli zbledel asfalt s krpami; jeklene varnostne ograje, kjer teren pada; nobenih imen podjetij ali znakov služb.
- **Izletna cona** (`docs/proge-po-drzavah.md`): ograja, zid ali prepad do 3 m od roba asfalta na 0 % dolžine (v igri; povprečno 5,7 m do roba proge). Rob proge avto ustavi, zato ne pade čez rob ali v morje (pravilo »Padec čez rob samo na Killarju«).
- **Dirka**: start z lučmi pod portalom START, portali kontrolnih točk z višino, cilj z generično tablo KOROR (pod njo PALAU), transparent KOROR · PALAU (samo zemljepisna imena), redarji in nekaj mirnih gledalcev ob startu in cilju.
- **Fotografije**: videz je narejen po podatkih (OpenStreetMap, Sentinel-2, ESA WorldCover) in splošnem poznavanju kraja, brez primerjave s fotografijami z istih mest.
- **Približki**: most čez kanal je narisan kot nasip z zidovi in ograjami (brez stebrov in razpona nad vodo). Drevesa, palme, grmovje, skale in gledalci so razporejeni po rabi tal, višini in naklonu, ne po resničnih legah. Hiše so generične.
- **Pravno**: samo zemljepisna imena (Koror, Babeldaob, Palau); brez imen mostu, hotelov, trgovin, pristanišč in oseb.

## Ob cesti

Stranske ulice in dovozi, ki se priključijo na glavno cesto (`js/world-koror-obcestje.js`, potek in razred iz OpenStreetMap, slike prej in potem v `docs/slike/koror/`):

- **Katere**: 11 poti med startom in ciljem, od roba asfalta v igri navzven, največ 70 m od ceste (120 m po poti). Stanovanjski 181309695 (105 m za startom) in 23035104 (1985 m); servisne 376149091 (60 m), 655297251 (780 m), 181309698 (795 m, nasproti prejšnje), 376149491 (2260 m), 376149492 (2525 m), 376149493 (2715 m), 376149495 (2940 m) in 655300152 (2995 m, njen konec je 2,5 m od 376149495, 31 m od ceste); dovoz 1564824059 (3150 m).
- **Samo grafika**: teren, cesta, njen nevidni rob in vožnja so nespremenjeni (namenoma ne `def.sideRoads`, ki bi poti naredil prevozne). Pot se konča, kjer se začne morje, voda iz OpenStreetMap ali hiša, ki jo igra riše; na njej ni palm, dreves, skal ali gledalcev.
- **Ob ustju**: jeklena ograja na zunanji strani ovinka se čez ustje odpre (1,5 m od robov poti, brez ostanka, krajšega od 12 m), pri 376149491, 376149493 in 376149495. Trije beli smerniki, ki bi stali sredi ustja, so odstranjeni.
- **Površina**: nobena od 11 poti v OpenStreetMap nima oznake `surface`; vseh 6 poti ob tej cesti, ki jo imajo (servisne), je neasfaltiranih. Narisane so kot makadam v teksturi in barvi makadamske bankine glavne ceste (želja uporabnika 2. 11. 2026, `docs/igra.md`, »Makadam«), kolesnice malo svetlejše; v dežju so temnejše kot bankina.
- **Predpostavke** (OpenStreetMap tu nima širin): širina po razredu (stanovanjska 4,5 m, servisna 3,5 m, dovoz 3 m), ustje 2,5 m širše, ki se zoži v prvih 6 m za asfaltom; čez jarek ob cesti gre pot po nasipu (cev pod njim ni narisana). Cesta v igri je širša od prave, zato se pot začne na robu asfalta v igri. 655297251 se konča 15 m pred koncem v OpenStreetMap, kjer tla v igri ob zahodnem koncu mostu padejo v laguno.
- **Ni narisano**: servisna pot 15 m za startom (181309703, zunaj pogleda kamere za avtom), servisna pot ob zahodnem koncu mostu, ki ne seže do ceste (181309697), servisna pot pri 1055 m (655299344: laguna v igri se tam začne približno 8 m za asfaltom, ostal bi le štrcelj), poti za ciljem; nobenih imen.
- **Odprto vprašanje**: (a) vseh 11 poti kot makadam (`koror-1960m-po.webp`) ali (b) brez stanovanjskih ulic 181309695 in 23035104 (`koror-1960m-b-brez-stanovanjskih.webp`): oznako `unpaved` imajo ob tej cesti samo servisne poti, za stanovanjske ulice ni vira.
- **Zmogljivost**: makadam je v mreži bankine glavne ceste, brežine ob robovih v kosih okolice: brez lastnih klicev risanja (1776 mrež kot prej). Na telefonu 145 klicev na sliko (največ 166, prej 142 in 164), 357 tisoč oglišč (največ 562 tisoč, prej 349 in 553 tisoč).

Podatke proge pripravi orodje `tools/proga/proga.py` (`python3 tools/proga/proga.py koror --zapisi`, nastavitve v `tools/proga/proge.json`, opis v `tools/proga/README.md`). Vire glej v `README.md` pod »Zasluge«.
