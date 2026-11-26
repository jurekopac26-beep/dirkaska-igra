# Tatev, Armenija (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `tatev` (`js/tracks/tatev.js`)

**Na odločanju** (`pending: true`, od 26. 11. 2026): odsek je izbrala seja proge (naročilo uporabnika »naredi vseh 26 prog«); na strani Odločitve je kartica z načrtom, uporabnik ga potrdi ali zamenja. V meniju je do potrditve za gumbom NEUPORABNO, z oznako PENDING.

Cesta H-46 v soteski reke Vorotan (pokrajina Sjunik, jug Armenije), v pravem merilu, ~7,2 km: od zahodnega roba soteske nad Halidzorjem (1215 m, 39,396° S, 46,266° V) se s tremi serpentinami spusti po pobočju na dno soteske, kjer gre čez naravni skalni most nad reko (Hudičev most, 1013 m, najnižja točka), pelje mimo toplega izvira ob reki in se po serpentinah vzhodne stene vzpne proti Tatevu (cilj na 1440 m); skupaj 19 ostrih ovinkov. Najbolj ovinkast kos ceste v soteski; padca čez rob ni (pravilo: samo Killarney).

- **Dirka**: tekmeci (v meniju *Opponents*), leteči start kot na vseh odprtih cestah, ena vožnja do cilja; po cilju vsak avto zapelje na svoje mesto ob cesti.
- **Kronometer**: sam proti uri, dve kontrolni točki z vmesnimi časi in višino, lestvica, duh in medalje (zlata 3:50, srebrna 4:01, bronasta 4:19, v dežju 4:33 / 4:47 / 5:08; zlato je čas relijskega avta na avtopilotu × 1,01).
- **Promet**: dvoboj z enim tekmecem po odprti cesti: največ avtomobilov, kombiji, avtobusi in tovornjaki, nekaj motoristov in kolesarjev; v obe smeri.
- **Policija**: beg pred policijo, v rezultatih pobega piše »Do Tateva v …«.
- **Imena v HUD** (po vrsti): Ruševine nad sotesko, Hudičev most · 1.013 m, Reka Vorotan, Topli izvir, Serpentina 1 · 1.042 m, Serpentina 5 · 1.135 m, Studenec, Serpentina 10 · 1.296 m, Zadnja serpentina · 1.379 m. Serpentine na pravi cesti niso oštevilčene; igra jih šteje od dna soteske navzgor. V angleščini prek `js/lang.js`.
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
