# Banaue, Filipini (dirka, kronometer, promet, policija)

[← Vse proge](../../README.md#proge) · proga `banaue` (`js/tracks/banaue.js`)

Cesta iz Bontoca v Banaue na severu Luzona (pokrajina Ifugao, Filipini), v pravem merilu: kilometer gorske ceste po pobočju nad riževimi terasami, malo nad mestom Banaue. Proga se začne na 1.247 m (16,9263° S, 121,0552° V), najvišji točki, gre mimo razgledišč in skozi vas nad terasami, nato po serpentini (zavije se za ~156°) do cilja na 1.185 m, najnižji točki: 0,99 km in ~62 m spusta, največ 12 % naklona. Pred startom je ~200 m ceste za štartno mrežo, za ciljem ~250 m za mesta avtov po dirki. Četrta od petih kratkih prog zunaj Evrope (`docs/nove-proge-1-0.md`, Del 4: K4). Vozi se po desni. Kartica proge je ena, na njej pa je stikalo **Dirka / Kronometer / Promet / Policija** (kot na Mã Pí Lèngu, Wadi Mujibu in Sans Souciju):

- **Dirka**: tekmeci (v meniju *Opponents* od 0 do največ 96: pred startom je le ~200 m ceste za kolono letečega starta; `maxRivals`), leteči start kot na vseh odprtih cestah, ena vožnja do cilja. Pod mestom so prevoženi kilometri in nadmorska višina; po cilju vsak avto zapelje na svoje mesto ob cesti. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, dve kontrolni točki z vmesnimi časi in višino, lestvica najboljših 10, duh in medalje (zlata 0:38, srebrna 0:40, bronasta 0:43, v dežju 0:42 / 0:44 / 0:47; zlato je čas relijskega avta na avtopilotu, kot na Vršiču).
- **Promet**: dvoboj z enim tekmecem po odprti cesti: avtomobili, kombiji in džipniji, motorji (tricikli), nekaj avtobusov in tovornjakov ter kolesarji; vsi vozijo po desni.
- **Policija**: beg pred policijo (pregon se začne že na štartu, pobegneš čez cilj). Patrulje imajo ob bokih modro progo s splošnim napisom POLICE (brez imena ali znaka katere koli službe), v rezultatih pobega piše »Do Banaueja v …«.
- **Kraji pod uro**: razgledišče, vas nad terasami, riževe terase in serpentina z višino (Serpentina · 1.196 m); komentator ima na tej progi svoje stavke ob startu, ob cilju in ob pobegu.
- **Oblika in višine**: sredinska črta je iz OpenStreetMap (vsakih 5 m, zglajena), taka, kot je: ovinki po pobočju, vas in serpentina nad mestom. Prava cesta je ozka dvopasovnica, v igri široka 9 m. Višine so iz višinskega modela Copernicus DEM GLO-30, ki ceste v pobočju ne vidi natančno: profil se mu približa z naklonom največ 12 %.

Okolica (gradi jo skupni graditelj kratkih prog `buildKratke` v `js/world-kratke.js` s slogom `KR.banaue`):

- **Riževe terase**: na riževih poljih ob cesti (raba tal: ESA WorldCover in riževa polja iz OpenStreetMap) je pobočje zgrajeno v stopnice po plastnicah, vsaka ~2,1 m višja od spodnje: ravna polja, travnati zidovi in svetlejši nasipi na robu (`terr`). Polja so v več barvah: poplavljena (srebrna kot nebo), blatna, z mlado rižem, z zrelim rižem in rumeneča. Terase se začnejo ~6 m za robom ceste in segajo ~125 m daleč (na nizki podrobnosti manj), na zelo strmem in povsem ravnem jih ni; rastline in skale se jim umaknejo. Na daljnem terenu so terase nakazane s pasovi svetlejših zelenih barv pod ~1.450 m.
- **Gozd in rastline**: megleno tropsko jutro v gorah, sonce visoko na vzhodu. Listavci, visoka drevesa deževnega gozda, borovci, grmičje, bananovci in praproti (po rabi tal iz ESA WorldCover 2021); skale ob cesti in na strmih pobočjih.
- **Vas**: ~170 hiš iz OpenStreetMap do 60 m od ceste in nekaj trgovin (splošne, brez imen in napisov): pastelne in betonske stene, pločevinaste strehe v rjasti, zeleni, modri, rdeči in sivi barvi.
- **Razgledišča**: štiri ob cesti (tri pred ciljem, eno za njim), vsako s stojnico s spominki (lesena stojnica pod pločevinasto streho, pisano tkano blago na vrvici, mizica; brez napisov); na prvem še ifugajska hiška na koleh s strmo slamnato streho.
- **Cesta**: beton s stiki vsake 4 m, rumena sredinska črta in beli robni črti; nizki betonski zidci na robu, kjer teren pada, v rumeno-belih pasovih.
- **Obzorje**: onstran pasu ob cesti pravi teren ~12 km naokoli (Copernicus DEM, mreža 300 m): doline od ~470 m in gore Kordiljere do ~2.660 m.
- **Dirka**: start z lučmi pod portalom START, modro-rumeni portali kontrolnih točk z višino, cilj FINISH s tablo BANAUE, transparent BANAUE · IFUGAO in BONTOC · BANAUE (samo zemljepisna imena in splošne besede), table v angleščini: kraji (BANAUE, BONTOC, MAYOYAO, HUNGDUAN), RICE TERRACES (»riževe terase«), VIEWPOINT (»razgledišče«), DANGEROUS CURVES (»nevarni ovinki«) in SLOW DOWN (»počasi«); malo gledalcev (redarji in redke mirne skupine ob startu, cilju, kontrolnih točkah in v serpentini).
- **Živali**: vodni bivoli, kokoši in čaplje ob cesti (`zivali`).
- **Vreme**: dež pogosteje kot drugod (`rainP` 0,3).
- **Fotografije**: videz je narejen po podatkih (OpenStreetMap, ESA WorldCover, višinski model) in splošnem poznavanju kraja, brez Google Maps, Google Earth ali Street View.
- **Približki**: terase so zgrajene iz rabe tal in višinskega modela (po plastnicah, ne po resničnih poljih), drevesa in skale so razporejeni po rabi tal in naklonu, ne po resničnih legah; višine hiš niso v OpenStreetMap, barve sten in streh so slogovne; stojnice in hiška na koleh niso v OpenStreetMap.
- **Pravno**: samo zemljepisna imena (Banaue, Bontoc, Ifugao, Mayoyao, Hungduan) in splošne besede; imena trgovin in lokalov niso zemljepisna, zato jih igra ne uporablja. Trgovine in stojnice so brez imen in znakov.

Obremenitev telefona (`tests/golden/perf.json`, nizka podrobnost): v povprečju 168 klicev risanja in 318 tisoč oglišč, največ 182 klicev in 360 tisoč oglišč.

Podatke proge pripravita orodji `tools/proga-podatki.py` (nastavitve v `tools/banaue/config.json`) in skupno orodje kratkih prog `tools/kratke/build.py` (`python3 -I tools/kratke/build.py banaue --osm <surovi OSM>`: podatkovni blok in višine `BANAUE_H` v `js/tracks/banaue.js`, poti, gozd in polja v `tools/banaue/extra.json`; `--png` načrt in profil). Vire glej v `README.md` pod »Zasluge«.
