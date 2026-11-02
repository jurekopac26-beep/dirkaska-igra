# Livorno, Italija (načrt nove proge)

Nova prava proga `livorno`: stara cestna proga ob Livornu v postavitvi 1922–1930, po današnjih cestah iz OpenStreetMap, en krog v smeri urinega kazalca. Ime v igri: **Livorno, Italija** (angleško *Livorno, Italy*).

Delo gre po sklopih na veji **`proga/livorno`**. **Vseh pet sklopov naredi ena seja, enega za drugim, brez novih sej** (odločitev uporabnika 2. 11. 2026: »Naredi vse v enem sklopu, da prihranimo žetone«; prvotni načrt »vsak sklop svoja seja« ne velja več). Po vsakem sklopu: posodobi tabelo Stanje spodaj, commit in push na `proga/livorno`. Uporabniku poroča ob koncu (s seznamom za preizkus na telefonu; največ ena slika) ali ob blokadi oziroma odločitvi, ki je res njegova; vprašanja gredo na stran Odločitve (`CLAUDE.md`, razdelek »Seje«). Pravila varčevanja: `CLAUDE.md`, »Varčevanje z žetoni«.

Hkrati v drugi seji nastaja Hakone, Japonska (veja `proga/hakone`). **Livorno gre na `main` prvi**; če je Hakone na `main` pred našim pull requestom, spoji svež `main` (spori bodo predvsem v `index.html`, `js/lang.js`, `README.md`, `docs/kazalo.md`, referencah v `tests/golden/`).

## Odločitve uporabnika (2. 11. 2026, v seji, ki je progo predlagala)

- Livorno je prva nova proga. Proga: stara cestna proga ob Livornu, postavitev 1922–1930 (~22,5 km): Ardenza ob morju → Montenero → Savolano → Castellaccio → Romito → Calafuria → Antignano → Ardenza. Potek preveri in sestavi iz današnjih cest v OSM; kjer cesta ne obstaja več, vzemi najbližjo in to zapiši v opis proge.
- En krog, **100 avtov z letečim štartom** kot Nürburg (`raceRivals: 99`, `flyStart: true`, `rivals: 20`; glej `js/tracks/nring.js`).
- **Pravilo 60 m:** podrobni predmeti samo do ~60 m od ceste (kolikor jih vidi kamera za avtom): morje in pečine tik ob cesti, obalni stolpi, vile in hiše, svetišče na Montenero (generična stavba), borov gozd, kamniti zidovi, gledalci. Dlje samo teren iz višin, morje, oddaljeni griči in obzorje (poceni za telefon).
- Imena samo zemljepisna (Ardenza, Montenero, Savolano, Castellaccio, Romito, Calafuria, Antignano). Dirka se je imenovala po osebi: **tega imena ne uporabljaj nikjer**. Terasa ob morju v Ardenzi nosi ime osebe: dobi opisno ime (**Terasa ob morju**, *Seafront terrace*).
- Okolica v svoji datoteki `js/world-livorno.js` (po vzoru `js/world-montreal.js`), ne v `js/world.js`.
- Ob koncu (sklop 5) seja sama odpre pull request, ko so povezani testi lokalno zeleni. Na `main` samo s potrditvijo uporabnika.
- (2. 11. 2026, kasneje) Vse v enem sklopu, ena seja (zgoraj). Orodje za podatke prog je ponovno uporabno (`tools/proga-podatki.py`; Hakone ga ne podvaja), v `CLAUDE.md` razdelek »Varčevanje z žetoni«; oboje gre v pull request za Livorno.

## Sklopi in stanje

| Sklop | Vsebina | Čas | Stanje |
|---|---|---|---|
| 1 | **Podatki:** potek proge (OSM), višine (Copernicus GLO-30), raba tal (OSM + ESA WorldCover), stavbe in drevesa do 60 m ob cesti; ta načrt | 2–3 h | narejen (2. 11. 2026): `tools/proga-podatki.py` + `tools/livorno/` (`config.json`, `livorno.json`, mreže PNG), ta načrt |
| 2 | **Proga v igri:** `js/tracks/livorno.js` (črta, višine, širina, imena ovinkov, `hudSigns`, štart, 100 avtov), angleški prevod v `js/lang.js`, test `tests/livorno.test.js`; AI odpelje cel krog s 100 avti | 2–3 h | |
| 3 | **Okolica do 60 m:** `js/world-livorno.js` (teren, morje in obala, pečine, vile in hiše, stolpi, gozd, zidovi, gledalci, štartni prostor) | 3–4 h | |
| 4 | **Obremenitev telefona:** poenostavitve do mej (`tests/golden/perf.json`), reference (`npm run golden:update`), druge proge enako obremenjene | 1–2 h | |
| 5 | **Meni in opisi:** `assets/tracks/livorno.webp` in `livorno-rain.webp` (`maketa-menija/orodja`), `docs/proge/livorno.md`, README (Proge, Zasluge: OSM ODbL, Copernicus DEM, ESA WorldCover, krošnje Meta/WRI), `docs/kazalo.md`; pull request | 1–2 h | |

## Potek proge (preverjen v sklopu 1)

**Viri.** Strani, ki ju je navedel uporabnik (https://www.circuitodelmontenero.it/2/classifica.php, https://en.wikipedia.org/wiki/Circuito_del_Montenero), v oblačni seji nista dosegljivi (posrednik vrne 403; Wikipedija in druga zgodovinska spletišča prav tako). Potek je preverjen iz izvlečkov teh strani v spletnem iskanju (opis po ulicah za leto 1922 in strani za 1923, 1925, 1926):

- start in cilj v **Ardenza Mare ob mostu** (most čez Rio Ardenza pri Rotondi; most nosi naziv osebe, zato v igri brez imena);
- začetek po obalni cesti v Ardenzi (takrat »Via del Littorale« v Ardenzi), skozi ulice Ardenze (1925: Via del Pastore in ulica, poimenovana po stolpu) v Ardenza Terra, **pod železnico**;
- Via di Montenero do Montenera, **Via del Castellaccio**, Savolano, takoj za njim vzpon proti Castellacciu, nato **Via di Quercianella** (1926 »nova cesta«) navzdol do morja pri **Romitu**, nazaj ob obali (Via del Littorale) skozi **Calafurio** in **Antignano** v Ardenza Mare.

**Današnje ceste v vrstnem redu kroga** (`s` = metri od štartne črte, iz `tools/livorno/livorno.json`):

| s (m) | Cesta | Opomba |
|---|---|---|
| 0 | obalna cesta (Viale di Antignano → Viale Italia) | štartna črta na mostu čez Rio Ardenza, proti severu; Terasa ob morju (Rotonda) levo |
| 178 | diagonalna ulica od Rotonde v notranjost | desno s obalne ceste (pravokotno, nato zavije proti SV) |
| 533–867 | Via del Pastore | skozi Ardenzo do Ardenza Terra (danes enosmerna) |
| 867–1022 | ulica ob železnici, most čez Rio Ardenza (Via dell'Ardenza) | desno, nato pod železnico (železniški most nad cesto pri `s` 1118–1122) |
| 1022–3199 | Via di Montenero | dvig skozi naselje; **krožišče pri `s` ≈ 1880–1920** (današnje, leta 1922 ga ni bilo) |
| 3199–4033 | Via del Castellaccio | pri pokopališču Montenero levo s Via di Montenero; levi zavoj 162° pri 3610 |
| 4033–6686 | Via della Porcigliana | skozi Savolano (4440), štiri lasnice (4565, 4745, 4880, 4985, 5035) in še ena pri 5550, vzpon na greben |
| 6686–11597 | Via di Quercianella | ob stolpu Castellaccio na greben, **najvišja točka 287,5 m pri `s` 6855**, Castellaccio (7460), lasnica na vzhodnem koncu (8470), spust skozi borov gozd, dve lasnici nad Romitom (11040, 11340) |
| 11597–17195 | Via del Littorale | obalna cesta: Romito, mostovi čez zalive (11986–12029, 12447–12588, 13961–14102 pri Calafurii), Calafuria (13937), Boccale (14639), Miramare, ravnina 1,5 km do Antignana; pri Boccalu–Miramaru danes enosmerna (promet v drugo smer po Aurelii) |
| 17195–17437 | Via dei Bagni | v Antignanu levo, mimo gradu Antignano, desno na obalo |
| 17437–19092 | Viale di Antignano | ravnina ob morju (1,48 km) nazaj do Rotonde in štartne črte |

**Dolžina: 19.092 m** (zglajena črta; OSM 19.135 m). Uradna dolžina tistega časa je bila 22,5 km, italijanski viri pišejo o ~20 km. Razlika: ceste so se od takrat spremenile (obalna cesta ima danes mostove čez zalive, kjer je stara cesta ovinkarila okoli njih; Via di Quercianella je bila leta 1926 nova cesta; krožišče na Via di Montenero), tedanje meritve so bile nenatančne. **Proge ne raztegujemo:** igra vozi današnje ceste v pravem merilu (predlog za sklop 2: `realKm: 19.09`).

**Višine:** od 2,2 m (ob morju pri Rotondi) do 287,5 m (greben pri stolpu Castellaccio), start 3,8 m nad morjem, skupni vzpon ~340 m; strmine do 12 % (lasnice na Via della Porcigliana in spust k Romitu).

### Odločitve sklopa 1 (s utemeljitvijo)

1. **Via della Porcigliana namesto stare veje Via del Castellaccio:** pokrajinska cesta SP9 se v OSM imenuje *Circuito di Montenero* (relacija 4615550: Via del Castellaccio → Via della Porcigliana → Via di Quercianella), gre skozi Savolano in se za njim vzpne, kot pišejo poročila. Stara (danes enosmerna) veja pod Savolanom bi dala 17,7 km.
2. **Ulice Ardenze:** diagonalna ulica od Rotonde do Via del Pastore (verjetno tedanja »ulica po stolpu«; danes nosi ime osebe, zato je v datotekah samo opisana), Via del Pastore, ulica ob železnici, most čez Rio Ardenza in pod železnico na Via di Montenero (»pod železnico« iz opisa 1922).
3. **Antignano:** Via del Littorale skozi naselje, Via dei Bagni mimo gradu na obalo, nato Viale di Antignano. Novejša obalna cesta južno od Antignana (danes nosi ime osebe) ni na progi.
4. **Krožišče na Via di Montenero** (`s` ≈ 1880–1920): črta gre po južnem delu današnjega krožišča. Predlog za sklop 2: cesto skozi krožišče zravnaj (tako je bilo leta 1922), krožišče ostane le kot ploščad ob cesti ali odpade.
5. **Današnje enosmerne ulice** (Via del Pastore, del Via di Montenero ob železnici, Via del Littorale pri Boccalu–Miramaru, Via dei Bagni) dirka vozi v svoji smeri, tudi proti današnji (ceste so bile zaprte). V igri ni prometa, samo dirka.
6. **Imena:** samo zemljepisna ali opisna (seznam spodaj, »Pravna varnost«). OSM ima po osebah poimenovane: Rotondo, most ob startu, grad na Romitu, lokacijo ob lasnici na vzhodnem koncu Via di Quercianella (po vozniku), železniško postajo v Quercianelli, več ulic. Ta imena niso v nobeni datoteki repozitorija (v `livorno.json` gredo le zemljepisna imena cest in voda: seznama `geoRoads`, `geoWater` v `tools/livorno/config.json`).

## Podatki (sklop 1): `tools/livorno/`

Splošno orodje `tools/proga-podatki.py` (navodila na vrhu; Python: `pip install --break-system-packages scipy rasterio`) z nastavitvami Livorna v `tools/livorno/config.json` (območje, točke poti, imena cest poti, dovoljena imena, znamenitosti, kraji). Surovi prenosi gredo v mapo zunaj repozitorija (npr. scratchpad seje):

```
python3 -I tools/proga-podatki.py tools/livorno/config.json RAW   # osm (API v kosih), route, data -> tools/livorno/livorno.json + dem.png, far.png, lc.png, lu.png, chm.png (~30 s)
```

**Koordinate:** metri, izhodišče = štartna črta (`lat0` 43.51202, `lon0` 10.3188882: obalna cesta na mostu čez Rio Ardenza), x proti vzhodu, z proti jugu (`Geo` iz `maketa-menija/orodja/geo_lib.py` z `rot` 0). Vsebina `livorno.json` (opis vsakega ključa je v njegovem `about`):

| Ključ | Vsebina |
|---|---|
| `line` | sredinska črta vsakih 5,0006 m od štarta, zaprta (OSM vsak meter, Gauss σ 3 m: vogali zaobljeni, lasnice ~10 m polmera) |
| `h`, `hRaw` | višina ceste v vsaki točki `line` (m nad morjem): Copernicus DSM brez krošenj (Meta/WRI, × 0,8) in stavb (OSM, × 0,8), mediana 5 vzorcev čez cesto, mostovi ravno od brega do brega, zapolnjene vdolbine pod 60 m, mediana 35 m, σ 15 m, strmine ≤ 12 %, σ 5 m; `hRaw` pred glajenjem |
| `ways` | ceste poti po `s`: ime (samo zemljepisna), vrsta, pasovi, širina, današnja enosmernost, površina, omejitev, most |
| `bends` | ovinki s polmerom pod 60 m: `s` vrha, polmer, stran, kot (71 ovinkov; najožji ~9–11 m: lasnice na Porcigliani, vogal v Antignanu, zavoj pri Rotondi) |
| `bld`, `bldOutline` | 1.469 stavb z delom do 60 m: škatla `[x, z, dolžina, širina, kot, višina (0 = ni v OSM), vrsta, s, d]`, obris za nepravokotne (169) |
| `trees`, `treeRows` | posamezna drevesa (121) in drevoredi (31) do 60 m (OSM; vrsta, kjer je znana) |
| `walls` | zidovi (68), oporni zidovi (7), žive meje (79), ograje (9), odbojne ograje (8), betonske ovire (6) do 30 m |
| `coast`, `cliffs`, `shore`, `water` | obala do 400 m (kopno levo od smeri), pečine do 300 m (nižja stran desno), plaže in skale do 300 m, potoki do 100 m |
| `rail` | železnica (Pisa–Rim ob obali od Antignana do Romita, pod njo cesta v Ardenzi) in vzpenjača na Montenero, do 200 m |
| `roads`, `side` | druge ceste in poti do 60 m (`par` 1: vzporedni vozni pas ob progi); 212 stranskih cest in poti, ki se priključijo na progo (175 vozljivih), prvih 60 m vsake |
| `onRoad`, `lamps`, `stops` | prehodi za pešce (30), STOP (4), prednost (3), umirjanje (2); 169 cestnih luči in 48 avtobusnih postajališč ob cesti |
| `bridges`, `over` | mostovi proge (10, `s0`–`s1`); nad progo: železniški most pri `s` 1118–1122, brv pri 11672 |
| `landmarks` | znamenitosti z obrisom, `s` in `d` (+ desno): Terasa ob morju (175, 38 m levo), Pokopališče Montenero (3198, 10 m desno), Vzpenjača Montenero (3505, 122 m), Svetišče Montenero (4137, **445 m desno**: daleč, na hribu), Stolp Castellaccio (6699, 119 m desno), Grad na Romitu (11655, 230 m levo), Kamnolom Calafuria (13989, 23 m desno), Stolp Calafuria (14103, 20 m levo), Grad Boccale (14615, 30 m levo), Kamp Miramare (15161), Pokopališče Antignano (15641), Grad Antignano (17322, 5 m desno), Pristanišče Antignano (17415, 88 m levo), Pristanišče Ardenza (daleč) |
| `places` | kraji za HUD (najbližja točka ceste): Ardenza 0, Montenero 3499, Savolano 4440, Castellaccio 7460, Romito 11660, Calafuria 13937, Boccale 14639, Antignano 16852 |
| `grids` | PNG ob datoteki: `dem` (tla, 20 m celice, 1,2 km okoli proge, 16-bit: (h + 100) × 10), `far` (površina, kot jo vidiš od daleč, 100 m, ±12 km), `lc` (ESA WorldCover, 10 m, do 150 m od ceste), `lu` (raba tal OSM, 10 m: legenda v `about`), `chm` (višina krošenj v m, 10 m) |

Raba tal do 150 m od ceste (WorldCover): drevesa 55 %, pozidano 22 %, voda 9 %, travniki 9 %, grmičevje 3 %; krošnje nad 3 m v 24 % celic (povprečno 8 m). Hribi med Montenerom in Romitom so gozd (bori, črnika), obala skale in pečine z borovci, Ardenza in Antignano vile in hiše z vrtovi.

## Navodila za sklope 2–5

### Sklop 2: proga v igri

- `js/tracks/livorno.js` po vzoru `js/tracks/nring.js` (krog, 100 avtov) in `js/tracks/medvode.js` (prava cesta iz OSM): `id: 'livorno'`, `name: 'Livorno, Italija'`, `theme: 'livorno'`, `laps: 1`, `raceRivals: 99`, `flyStart: true`, `rivals: 20`, `start: [0, 0]`, `realKm: 19.09`; `points` iz `line` (lahko vsaka 2. točka), `elev` iz `h` (decimetri kot `NRING_H`), `gradeForce: true`.
- **Vogali:** zavoj pri Rotondi (`s` 175), vogala v Ardenzi (515, 860) in Antignanu (17195, 17415) imajo v OSM ~3–6 m polmera (mestni vogali); zaobli jih na ~9 m kot Medvode (»junctions ~9 m«). Krožišče pri `s` ≈ 1880–1920 zravnaj (odločitev 4).
- **Širina:** v OSM je širina redko vpisana (Viale di Antignano in Via del Littorale 2 pasova, SP9 ozka, ulice v Ardenzi enosmerne). Za 100 avtov predlagam običajno širino dirkalnih prog z razmerji resničnih cest kot Medvode (`widths`: obalna cesta in Viale širši, SP9 in ulice ožji); sklop 3 mora okolico odmakniti z robom ceste (kot Medvode). Odloči in zapiši v ta načrt.
- **Imena ovinkov** (predlog; HUD slovensko, komentator angleško): Terasa ob morju (175), Ardenza Terra (860), Pod železnico (1120), Montenero (3200), Savolano (4440), Lasnice Savolano (4565–5550), Stolp Castellaccio (6700), Castellaccio (7460), Vzhodna lasnica (8470; namesto imena po vozniku), Le Piagge (9276) in Pian della Pineta (9956) (zemljepisni imeni ob spustu), Lasnici nad Romitom (11040, 11340), Romito (11600), Calafuria (13937), Boccale (14639), Miramare (15161), Antignano (16852), Grad Antignano (17195). Hitri ovinki z imenom in šikane v `hudSigns`.
- Mostovi: `bridges` (ograja mostu), železniški most nad cesto pri 1118–1122 (kot `brU` pri Nürburgu).
- Štart: leteči štart po ravnini Viale di Antignano (1,48 km pred črto); preveri, da se 100 avtov postavi pred Antignanom in ne v vogalu pri 17415.
- `js/lang.js`: angleško ime *Livorno, Italy* in opis; `index.html`: `<script src="js/tracks/livorno.js">` pred `js/core.js`, `node tools/menu-lens.js` (tabela `BASE`: start 3,8 m), `node tools/stamp.js`; Italija že ima zastavo in obris na globusu (Toskana); `tools/menu-globe.mjs`: start v `PLACES` (43.51202, 10.31889).
- Test `tests/livorno.test.js` po vzoru `tests/montreal.test.js` (100 avtov Nürburga: `tests/field.test.js`, `tests/grid.test.js`): dolžina ~19,09 km, višine 2–288 m, zaporedje krajev, 100 avtov, AI odpelje cel krog; do sklopa 3 tema `livorno` še nima graditelja (začasno splošni ali najpreprostejši teren).

### Sklop 3: okolica do 60 m (`js/world-livorno.js`)

- Po vzoru `js/world-montreal.js` (`World.ext.livorno`, pomočniki `extAPI`), podatki v `js/data/livorno.js` (kot `js/data/montreal.js`) ali v datoteki proge; pretvori iz `livorno.json` in PNG z orodjem v `tools/livorno/` (dopiši ga).
- **Pravilo 60 m:** stavbe, drevesa, zidovi, ograje, gledalci, stolpi, gradovi samo do ~60 m; dlje teren iz `dem` / `far`, morje (ravnina), obzorje. Svetišče na Montenero je 445 m od ceste: generična stavba na hribu kot oddaljena silhueta (en preprost kos), ne podrobna.
- Morje in obala: obala in pečine ob Via del Littorale (`coast`, `cliffs`, `shore`), skale pod cesto, plaže pri Rotondi in Calafurii; borovci na obali (`chm`, `lc` 10 + `lu` 9).
- Stavbe: vile in hiše iz `bld` (višina iz OSM ali po vrsti), stolpa Calafuria in Castellaccio, gradova Boccale in Antignano, pokopališči (zid, ciprese), kamnolom pri Calafurii (`cliffs`).
- Kamniti zidovi: iz `walls` in ob cesti v useku (oporni zid na strmi strani, parapet ob morju); železnica ob obali (tiri, drogovi) in most nad cesto v Ardenzi.
- Štartni prostor pri Terasi ob morju (tribuna, portal, gledalci), gledalci ob lasnicah in v Antignanu; stranske ceste zaprte (`side`).

### Sklop 4: obremenitev telefona

- Meje iz `CLAUDE.md`: do ~300 klicev risanja in ~900 tisoč oglišč (`tests/golden/perf.json`: `maxCalls`, `maxKverts`, `perf.test.mjs`); druge proge ne smejo postati bolj obremenjene. `npm run golden:update`.

### Sklop 5: meni, opisi, pull request

- `assets/tracks/livorno.webp`, `livorno-rain.webp` (`maketa-menija/README.md`, `maketa-menija/orodja/dio2.mjs`, `mkwebp.py`), `docs/proge/livorno.md` (naslov »Livorno, Italija«; približki iz tega načrta: dolžina 19,09 km proti uradnim 22,5 km, Porcigliana, krožišče, vogali), README (seznam Proge, Zasluge), `docs/kazalo.md` (proga in graditelj v tabeli prog), `tests/README.md`.
- Pull request (osnutek, nato »Ready for review«, ko so povezani testi zeleni); na `main` samo s potrditvijo uporabnika (vprašanje na strani Odločitve).

## Pravna varnost (imena)

- **Dovoljeno** (zemljepisno ali opisno): Livorno, Ardenza, Ardenza Mare, Ardenza Terra, Montenero, Savolano, Castellaccio, Le Piagge, Pian della Pineta, Romito, Calafuria, Boccale, Miramare, Antignano, Quercianella, Rio Ardenza; Terasa ob morju, Stolp Calafuria, Stolp Castellaccio, Grad Boccale, Grad na Romitu, Grad Antignano, Svetišče Montenero (generična stavba), Pokopališče Montenero, Kamnolom Calafuria, Vzhodna lasnica, Lasnice Savolano, Lasnici nad Romitom.
- **Prepovedano:** ime dirke (po osebi) in imena prireditev; imena oseb v OSM (Rotonda, most ob startu, grad na Romitu, lokacija ob vzhodni lasnici, postaja v Quercianelli, ulice); imena zmagovalcev, voznikov in znamk avtomobilov; imena kopališč, lokalov in hotelov ob obali.

## Viri in licence (za »Zasluge« v sklopu 5)

- © OpenStreetMap contributors, licenca ODbL 1.0 (sredinska črta, stavbe, ceste, obala, pečine, zidovi, raba tal, kraji); izpeljani podatki v `tools/livorno/livorno.json` in v datotekah proge so prav tako pod ODbL 1.0.
- Copernicus DEM GLO-30: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.
- © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium, licenca CC BY 4.0.
- Meta and World Resources Institute, High Resolution Canopy Height Maps, licenca CC BY 4.0 (višina krošenj za tla pod drevesi).

## Sklop 1: kaj je narejeno

- **Potek proge** preverjen iz izvlečkov virov v spletnem iskanju (strani same niso dosegljive) in sestavljen iz današnjih cest v OSM (`tools/livorno/config.json`: 35 točk poti, med njimi najkrajša pot po cestah; prednost imajo ceste iz poročil). Odločitve 1–6 zgoraj. Dolžina 19,09 km namesto 22,5 km (razlaga zgoraj).
- **Višine:** Copernicus GLO-30 je površinski model (drevesa, strehe); tla pod njim iz višine krošenj (Meta/WRI, 1 m, prek AWS) in obrisov stavb (OSM). Profil ceste je gladek, strmine do 12 %, mostovi ravni.
- **Okolica** do 60 m (stavbe, drevesa, zidovi), obala, pečine in železnica do 200–400 m, raba tal in krošnje do 150 m, teren 1,2 km in ±12 km; vse v `tools/livorno/livorno.json` (407 KB) in petih PNG (skupaj ~175 KB).
- Pregled: slike plasti (pot, raba tal, stavbe, obala) so se ujemale; slik ni v repozitoriju.
- Brez sprememb v `js/` in `css/` (igra je nespremenjena); `docs/kazalo.md` ima vrstice za `tools/proga-podatki.py`, `tools/livorno/` in ta načrt.
- Po odločitvi »vse v enem sklopu« so prvotne tri skripte postale splošno orodje `tools/proga-podatki.py` (krožne in odprte ceste, rastri iz več ploščic, nastavitve v JSON); izhod za Livorno je enak (višine se razlikujejo do 0,7 m, ker je okno terena zdaj enako oknu OSM). Razdelek »Varčevanje z žetoni« v `CLAUDE.md`. Seja za sklop 2, zagnana pred to odločitvijo, je bila ustavljena, preden je kaj spremenila.
