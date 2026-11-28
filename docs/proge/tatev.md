# Tatev, Armenija (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `tatev` (`js/tracks/tatev.js`)

**Dodelava** (28. 11. 2026, odločitev O-28-42, veja `dodelava/tatev`): v delu po merilu Pikes Peak (`docs/dodelava-prog.md`).

**Potrjena** (26. 11. 2026, ob 4.15): odsek je izbrala seja proge (naročilo uporabnika »naredi vseh 26 prog«), uporabnik ga je potrdil na strani Odločitve (kartica `proga-1097-tatev-pot`, možnost a). Prava proga, brez oznake PENDING.

Cesta H-46 v soteski reke Vorotan (pokrajina Sjunik, jug Armenije), v pravem merilu, ~7,2 km: od zahodnega roba soteske nad Halidzorjem (1215 m, 39,396° S, 46,266° V) se s tremi serpentinami spusti po pobočju na dno soteske, kjer gre čez naravni skalni most nad reko (Hudičev most, 1013 m, najnižja točka), pelje mimo toplega izvira ob reki in se po serpentinah zahodnega pobočja vzpne proti Tatevu (cilj na 1440 m); skupaj 19 ostrih ovinkov. Najbolj ovinkast kos ceste v soteski; padca čez rob ni (pravilo: samo Killarney).

- **Dirka**: tekmeci (v meniju *Opponents*), leteči start kot na vseh odprtih cestah, ena vožnja do cilja; po cilju vsak avto zapelje na svoje mesto ob cesti; največ 70 tekmecev (za ciljem je ~260 m ozke ceste).
- **Kronometer**: sam proti uri, dve kontrolni točki z vmesnimi časi in višino, lestvica, duh in medalje (zlata 3:50, srebrna 4:01, bronasta 4:19, v dežju 4:33 / 4:47 / 5:08; zlato je čas relijskega avta na avtopilotu × 1,01).
- **Promet**: dvoboj z enim tekmecem po odprti cesti: največ avtomobilov, kombiji, avtobusi in tovornjaki, nekaj motoristov in kolesarjev; v obe smeri.
- **Policija**: beg pred policijo, v rezultatih pobega piše »Do Tateva v …«.
- **Imena v HUD** (po vrsti): Ruševine Cakuta, Hudičev most · 1.016 m, Reka Vorotan, Topli izvir, Serpentina 3 · 1.042 m, Serpentina 7 · 1.135 m, Grapa, Studenec, Drevored, Serpentina 13 · 1.296 m, Zadnja serpentina · 1.379 m. Serpentine na pravi cesti niso oštevilčene; igra jih šteje od dna soteske (Hudičev most) navzgor po vrsti ovinkov v `curves` (2616 je prva, 6482 zadnja, 16.). V angleščini prek `js/lang.js`.
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (vsakih 5 m, zglajena). Višine iz Copernicus DEM GLO-90 (GLO-30 za Armenijo ni javen; tla brez krošenj in stavb), profil zglajen; največji naklon 12,4 %. Prava cesta je ozka dvopasovnica, v igri 7,6 m.

Okolica (skupni graditelj kratkih prog `buildKratke` v `js/world-kratke.js`, slog `KR.tatev`):

- **Soteska**: suha poletna trava slamnate barve, grmičevje in skupine listavcev na policah in ob potokih, sipari pod skalnimi stenami, skale in balvani (raba tal iz ESA WorldCover 2021 in OpenStreetMap, barve po rabi tal in naklonu).
- **Cesta**: asfalt s črtkano belo sredinsko črto, nizki kamniti parapeti, kjer teren pada (rdeči in beli okoli serpentin), podporni zidovi pod zgornjimi kraki serpentin.
- **Ob cesti**: ruševine nad sotesko (generično svetišče, ~80 m nad cesto), kavarna ob cesti, informacijska tabla (lega iz OpenStreetMap; generično, brez imen), redke hiše; nekaj gledalcev pri skalnem mostu.
- **Obzorje**: onstran pasu ob cesti pravi teren ~12 km naokoli (Copernicus DEM, mreža 300 m).
- **Dirka**: portali z napisi v armenščini in angleščini (ՄԵԿՆԱՐԿ · START, ԱՎԱՐՏ · FINISH, ՏԱԹԵՎ · TATEV, ՈՐՈՏԱՆԻ ԿԻՐՃ · Հ-46), table krajev in opozorila (Tatev, Halidzor, Goris, Devil's Bridge, Vorotan, nevarni ovinki, vozi počasi, Հ-46); samo zemljepisna imena in splošne besede.
- **Fotografije**: videz je narejen po podatkih (OpenStreetMap, ESA WorldCover, višinski model) in splošnem poznavanju kraja, brez Google Maps, Google Earth ali Street View.
- **Približki**: drevesa, grmičevje in skale so razporejeni po rabi tal in naklonu, ne po resničnih legah; svetišče, kavarna in hiše so generični. Topli izvir in skalni most nimata svojih modelov (samo imeni v HUD in tabli).

Podatke proge pripravita `tools/proga-podatki.py` (nastavitve v `tools/tatev/config.json`) in `tools/kratke/build.py` (`python3 -I tools/kratke/build.py tatev --osm <surovi OSM>`). Vire glej v `README.md` pod »Zasluge«. Test: `node tests/tatev.test.js`.

## Dodelava 28. 11. 2026: zanimivosti do 60 m (OSM, ODbL)

Iz izvleska OSM (bbox 46.240, 39.383 – 46.270, 39.402), preračunano na točke proge (`d` = metri za startom, razdalja od osi ceste):

| Kraj (HUD) | d | od ceste | Opomba |
|---|---|---|---|
| Ruševine Cakuta | ~2060 | 59–60 m, levo | opuščena vas Cakut, ruševine in bogoslužni prostor |
| Hudičev most · 1.016 m | 2549 | 9 m | naravni skalni most; po OSM (reka pod mostom, way 1188891529 `tunnel=cave`, cesta nad njo pri d 2549); najnižja točka profila 1.013 m pri ~2503 (DEM GLO-90) |
| Reka Vorotan | 2584 | 13 m | reka spet na prostem ob cesti (OSM way 875500141) |
| (vhod v jamo pod mostom) | ~2235 | 53 m | za kulise |
| (bazeni toplega izvira) | ~2230 | 67 m | tik izven 60 m; za kulise |
| Topli izvir | 2674 | 22 m | izvir ob cesti |
| Grapa | 4121 | 55 m, levo | grapa v pobočju |
| Studenec | 4376 | 8 m | pitna voda ob cesti |
| Drevored | 5325 | 8 m, levo | vrsta dreves (še ena pri ~2718, 11 m) |

Izven 60 m: samostan (cilj je pod njim) in žičnica (≥ 576 m; njeno ime v OSM je blagovna znamka, zato brez imena).
Lokal ob 2155 (7 m) je podjetje: brez imena. Vira: OpenStreetMap (ODbL), Copernicus DEM GLO-90 (oba že v README, »Zasluge«).
