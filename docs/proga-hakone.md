# Nova proga Hakone, Japonska (načrt)

Druga nova proga (prva je Livorno, Italija, na veji `proga/livorno`, ki gre na `main` prva). `id` je `hakone`, tema `hakone`, veja `proga/hakone`. Delo gre po sklopih: **vsak sklop je svoja seja** z navodilom »Naredi sklop N po docs/proga-hakone.md (veja proga/hakone)«, skupaj ~9–12 h. Ob koncu sklopa seja posodobi tabelo Stanje spodaj, naredi commit in push na `proga/hakone` ter z orodjem `create_session` (strežnik claude-code-remote) zažene naslednji sklop: model `claude-opus-5-5`, `source_url` https://github.com/jurekopac26-beep/dirkaska-igra, `source_revision` `proga/hakone`, `outcome_branch` `proga/hakone`, prompt »Naredi sklop N po docs/proga-hakone.md (veja proga/hakone)«. Po sklopu 5 seja ne zažene nove seje. Uporabniku ob koncu sklopa napiše kratko poročilo (pri sklopu 5 tudi seznam za preizkus na telefonu). Na `main` gre proga samo s potrditvijo uporabnika.

## Odločitve uporabnika (2. 11. 2026, v seji, ki je progo predlagala)

- Hakone je druga nova proga. Hkrati v drugi seji nastaja Livorno, Italija (veja `proga/livorno`), ki gre na `main` prvi. Pred svojim pull requestom (sklop 5) seja spoji svež `main`, razreši spore v skupnih datotekah (`index.html`, `README.md`, `docs/kazalo.md`, `js/lang.js`) in reference ustvari znova z orodji repozitorija.
- Proga: krog ~27 km po javnih cestah: Hakone-Yumoto → državna cesta 1 v hrib (Tōnosawa, Ōhiradai, Miyanoshita, Kowakidani, Ashinoyu, vrh ~874 m) → Moto-Hakone ob jezeru Ashi → nazaj po prefekturni cesti 732 (stara pot Tōkaidō: Hatajuku, serpentine Nanamagari) → Hakone-Yumoto. Potek iz OSM, smer kroga izbere seja (razlog spodaj).
- En krog, 100 avtov z letečim štartom kot Nürburg (`raceRivals: 99`, `flyStart: true`, `rivals: 20`; glej `js/tracks/nring.js`).
- **Pravilo 60 m:** podrobni predmeti samo do ~60 m od ceste (kolikor jih vidi kamera za avtom): vasi s toplicami, gorska železnica ob cesti (proga, mostovi, cikcak), cedrov drevored, rdeča vrata, jezero z generičnimi izletniškimi ladjami, kamnita stara pot ob cesti 732, bambus in gozd, hortenzije, gledalci. Dlje samo teren iz višin, jezero, oddaljene gore in obzorje z goro Fuji (poceni za telefon).
- Imena samo krajevna (Tōnosawa, Miyanoshita, Kowakidani, Ashinoyu, Moto-Hakone, Hatajuku …); Nanamagari kot opisno »Sedem ovinkov« (angleško »Seven Bends«). Brez imena prireditve, ki teče po cesti 1, brez imen hotelov, podjetij in železniškega prevoznika; torii kot generična rdeča vrata.
- Okolica v svoji datoteki `js/world-hakone.js` (po vzoru `js/world-montreal.js`), ne v `js/world.js`.
- Ob koncu (sklop 5) seja sama odpre pull request, ko so povezani testi lokalno zeleni. Na `main` samo s potrditvijo uporabnika.

## Potek proge (sklop 1)

Krog meri **26.815,6 m** po sredinski črti OSM (cesta 1: 15.580 m, cesta 732: 10.846 m, nato 390 m ceste 1 do cilja). Razdalje `s` so metri od štartne črte po tej črti (sklop 2 jih po glajenju preračuna na najbližjo točko svoje črte).

| s (m) | višina | kraj |
|---|---|---|
| 0 | 97 m | **štart in cilj**: cesta 1 v Yumotu, 390 m za križiščem Sanmaibashi, pri avtobusni postaji pred postajo Hakone-Yumoto (postaja 21 m desno pri s = 87) |
| 0–1.500 | 97–140 | Yumoto, ob reki Hayakawa (železnica in reka ob cesti), mosta obvoznice pri s 770–890 (enosmerni pas s 488–580) |
| ~1.160 | 125 | Tōnosawa (toplice v soteski) |
| ~1.800–2.010 | 185–195 | Deyama: obračališče železnice (cikcak) 47 m od ceste, **železniški most čez cesto pri s ≈ 2.005** (9 m nad cesto) ob mostu čez Hayakawo |
| 4.222 | 334 | **serpentina Ōhiradai** (r ≈ 12,5 m), postaja Ōhiradai 25 m od ceste pri s 4.461 |
| ~5.100 | 400 | Sennindai: obračališče železnice 30 m od ceste, železnica ob cesti s 4.975–5.710 |
| 5.940–6.420 | 423–455 | Miyanoshita (postaja 42 m, semafor pri s 6.414) |
| ~6.700–7.300 | 470–510 | Sokokura, serpentina pri s 7.110 |
| 7.525–7.735 | 520–530 | Kowakidani: postaja 26 m od ceste, **železniški prehod čez cesto pri s 7.700** |
| 7.646–11.080 | 525–755 | vzpon s petimi serpentinami (7.646, 8.134, 9.808, 10.908, 11.080), Ninotaira |
| ~12.940–13.030 | 850 | Ashinoyu |
| **13.444** | **880** | **vrh ceste 1** (v resnici 874 m; model površja z drevesi je nekaj metrov višji) |
| ~13.900 | 866 | jezero Shōjin 18 m od ceste |
| 15.314 | 794 | serpentina nad Moto-Hakonejem (semafor Ōshiba), jezero Ashi ~190 m |
| **15.580** | 782 | **Moto-Hakone, križišče Hatajuku Ent.**: s ceste 1 naravnost na cesto 732 |
| ~16.100 | 786 | jezerce Otama-ga-ike 19 m od ceste, začetek kamnite stare poti |
| 15.860–17.934 | 790–655 | stara pot skozi gozd, serpentine 15.860, 16.726, 17.934 (r ≈ 8,6 m pri klancu Sarusuberi, najostrejša) |
| **18.784–19.990** | 577–462 | **Sedem ovinkov** (Nanamagari): 12 zaporednih serpentin (r 10–16 m), kraki 25–35 m narazen |
| ~20.230–20.790 | 440–400 | Hatajuku (vas, torii 27 m od ceste pri s 20.735), serpentini 20.900 in 21.046 |
| ~22.130–22.570 | 300–280 | Sukumogawa (dolina reke Sukumo), serpentina 22.138 |
| ~23.800–24.060 | 205–190 | Okuyumoto, Yumoto-chaya |
| 25.500–26.426 | 150–86 | Yumoto (južni breg), **križišče Sanmaibashi pri s 26.425,6** (most čez Hayakawo, oster levi zavoj na cesto 1) |

- **Smer: cesta 1 navzgor, cesta 732 navzdol** (kot jo je opisal uporabnik). Razlogi: (1) pri spustu z vrha proti Moto-Hakoneju sta jezero Ashi in gora Fuji pred avtom oziroma spredaj desno (v obratni smeri bi bila za avtom); (2) leteči štart: 100 avtov se pred črto razvrsti po zadnjih ~750 m kroga, to je po cesti 732 skozi Yumoto, ovinku Sanmaibashi in ravnini ceste 1 do črte (v obratni smeri bi bili v vrsti po ozki cesti 1 skozi Yumoto in njen enosmerni del); (3) dolg in enakomeren vzpon po cesti 1 (povprečno 5,8 %) na začetku raztegne polje 100 avtov, preden pride ozka stara pot; (4) finale je hiter spust po Sedmih ovinkih in dolini Sukumo v Yumoto.
- **Jezero:** krog se po resnični mreži cest zapre v križišču Hatajuku Ent. (畑宿入口) med serpentinama ceste 1 nad vasjo Moto-Hakone; do obale ne pride (najbližje ~190 m pri s ≈ 15,3 km). Spust do obale in nazaj bi bil 1,8 km dolg odsek v obe smeri, ki ga igra ne zna. Jezero Ashi, rdeča vrata v jezeru (torii 640 m od ceste, vidna nad terenom pri s 14,3–16,7 km) in ladje so zato del razgleda (poceni: daljni teren in nekaj preprostih modelov), ne predmeti do 60 m. Ob cesti sta jezeri Shōjin (s ≈ 13,9 km) in Otama-ga-ike (s ≈ 16,1 km). Pravi cedrov drevored ob jezeru (med Moto-Hakonejem in Hakone-machijem) ni na krogu; stara pot ob cesti 732 od križišča do s ≈ 17,4 km je gost gozd ob cesti (67 dreves na 100 m do 20 m od ceste): tam naj bo cedrov drevored.
- **Gora Fuji** (3.776 m, ~33 km zahodno-severozahodno): po resničnem terenu se s ceste vidi le malo. Nad grebenom kaldere se pokaže pri s 4,1–6,5 km (vzpon Ōhiradai–Miyanoshita, pred avtom, a le vrh, ~0,6°) in pri s 15,2–16,3 km (Moto-Hakone, do 3,4° nad grebenom, a 47–65° desno od smeri vožnje; kamera za avtom ležeče vidi ±42°, pokonci ±14°). Drugje jo skrivajo osrednji vrhovi (Komagatake, Kamiyama), stene dolin in drevje. Predlog za sklop 3: Fuji v daljnem pogledu, ki ga zakrijejo le bližnji teren koridorja in drevje, daljni grebeni pa ne (tako se pokaže, kjer je pogled odprt in obrnjen proti njemu). Sklop 3 uporabniku pokaže sliki obeh različic (resnično zakrivanje / Fuji nad daljnimi grebeni) na strani Odločitve.
- **Višine:** model površja Copernicus GLO-30 po črti, mostovi naravnost čez, odprtje 60 m (krošnje in strehe nad cesto), glajenje 30 m, naklon največ 10 % na cesti 1 in 13 % na cesti 732 (Lipschitzeva ovojnica). Od modela povprečno 1,5 m. 43 % kroga ima naklon nad 8 %, 16 % nad 10 %.
- **Serpentine** (obrat > 150° na 80 m): 25, sedem na cesti 1 in 18 na cesti 732 (`pot.json` `hairpins`). Najostrejša r ≈ 8,6 m (s 17.934), ovinek Sanmaibashi pri s 26.425,6 je v OSM le vozlišče (90° levo): sklop 2 ga zaokroži.
- **Ceste:** ves krog dva pasova (OSM `lanes=2`), omejitev 30–40 km/h; enosmerni pas z enim pasom pri s 488–580 (obvoznica v Yumotu). Brez predorov, 19 mostov (`bridges`). 133 stranskih cest (`junctions`: 56 dovozov, 33 lokalnih, 27 stanovanjskih, križišči s cesto 1 in 732, cesta 138 itd.).
- **Železnica ob cesti** (do 60 m): s 0–535 (Yumoto), 1.770–2.310 (Deyama), 2.635–2.695, 3.835–3.960, 4.440–4.465 (Ōhiradai), 4.975–6.095 (Sennindai, Miyanoshita), 6.800–7.115, 7.510–7.940 (Kowakidani, prehod), 26.425–26.815 (Yumoto). Mostovi železnice ob cesti pri s 185, 2.005 (čez cesto), 2.635, 4.975, 5.305, 5.825, 6.815. Postaje in obračališča: Hakone-Yumoto, Tōnosawa, Deyama, Kami-Ōhiradai, Ōhiradai, Sennindai, Miyanoshita, Kowakidani.
- **Stara pot:** kamnit tlak stare poti Tōkaidō ob cesti 732 in čeznjo od s ≈ 16,3 do 22,3 km (46 odsekov, `paving`, 26 v relaciji stare poti).
- **Imena za HUD in komentator** (samo kraji; sklop 2 izbere): Yumoto, Tōnosawa, Deyama, Ōhiradai, Sennindai, Miyanoshita, Sokokura, Kowakidani, Ninotaira, Ashinoyu, Vrh · 874 m, Jezero Shōjin, Moto-Hakone, Otama-ga-ike, Sarusuberi, Sedem ovinkov (Seven Bends), Hatajuku, Sukumogawa, Okuyumoto, Yumoto-chaya, Sanmaibashi. Ne: imena hotelov, čajnic (Amazake-chaya, Miharashi-jaya), letovišč, železniškega prevoznika in prireditve.

## Podatki (`tools/hakone/`)

Orodja (Python 3, numpy, Pillow; za okna WorldCover in višin krošenj `pip install rasterio`) poženeš iz korena repozitorija s `python3 -I`, po vrsti: `osm.py` (prenos OSM po kosih 0,02° × 0,02° iz `api.openstreetmap.org`, `overpass-api.de` je blokiran; preveliki kos se razdeli; jezero Ashi celo kot relacija), `pot.py`, `teren.py`, `okolica.py`. Prenosi so v predpomnilniku zunaj repozitorija (`HAKONE_CACHE`, privzeto `~/.cache/hakone`): `osm/*.xml`, `dem/cop30_N35E13{8,9}.tif` (Copernicus GLO-30, prenese se sam), okna WorldCover in višin krošenj (`wc_*.npz`, `chm_*.npz`). Izhodi so v `tools/hakone/podatki/` in so v repozitoriju (ODbL za podatke iz OSM; vsak ima `about` z viri). Ponovni zagon `osm.py` prinese novejši OSM in malo drugačne razdalje: brez potrebe ne poganjaj, naslednji sklopi berejo shranjene JSON.

Okvir igre: x vzhod, z jug, metri od štartne črte (`origin` 35,2336134° S, 139,1046511° V; lokalna ravnina z radiji WGS84, kot `Geo` v `maketa-menija/orodja/geo_lib.py`).

- **`pot.json`** (`pot.py`): `length`, `step` (5 m), `points` [[x, z]] na 5 m od štarta (krog zaprt), `h` (očiščene višine, m n. m.), `h_model` (model po črti), `osm_nodes` [[x, z, s, vozlišče, pot]], intervali [s0, s1, oznaka]: `road` ('1' / '732'), `bridges` (z imenom mostu), `lanes`, `maxspeed`, `oneway`; `hairpins` [{s, r, turn L/R, h, road}], `summit`, `places` (kraji, postaje, vrhovi in avtobusne postaje z imeni {s, d, side, kind, ja, en}; brez postaj z imeni hotelov in podjetij), `junctions` (stranske ceste {s, side, ang, hw, name, lanes, pts: prvih ~40 m}), `marks` (semaforji, prehodi za pešce, železniški prehod), `sanmaibashi`, `hatajuku_junction`.
- **`teren.json`** (`teren.py`):
  - `dem`: teren koridorja v obliki, ki jo bere `vrPrep` v `js/world-vrsic.js` (`x0, z0, nx, nz, cell: 32, base` = višina štarta, `tr` trend 256 m v korakih 0,1 m, `rows`, `res` ostanki 1 m do 650 m od ceste); model površja z odštetimi krošnjami (0,6 × višina krošenj Meta/WRI). Preverjeno z dekodirnikom iz `vrPrep`: ob cesti od višin ceste rms 3,5 m.
  - `far` (200 m, 22 × 22 km: kaldera, Odawara, obala zaliva Sagami) in `fuji` (500 m, 39,5 × 44,5 km, vozlišče na vrhu Fujija): višine 2 bajta na vozlišče, `H = lo + v × step` (`lo` −20 m, `step` 0,5 m; **ne** `400 + v/2` kot `farDem` Irohazake), `lake` in `sea` kot izmenični teki suhih in mokrih vozlišč (prvi suh), `lakeH` 723 m, `lc` raba tal (koda kot `lc` spodaj, 6 = njive).
  - `lakes`: jezero Ashi celo (`poly` [[x, z]], gladina 723 m) in jezerca do 300 m od ceste (`near`, `h`, `area`); `peaks`: vrhovi z imeni in višinami (Fuji, Kamiyama, Komagatake …).
- **`okolica.json`** (`okolica.py`):
  - `lc`: raba tal koridorja (16 m, koda teka kot `def.lc` pri `vrPrep`: 0 odprto, 1 gozd, 2 grmovje, 3 naselje, 4 skale, 5 voda; dlje od 700 m vse gozd); WorldCover, višine krošenj in OSM (stavbe, voda, raba). Do 60 m od ceste: 57 % gozd, 22 % naselje, 20 % odprto.
  - `bld`: 1.778 stavb do 60 m [x, z, dolžina, širina, kot (rad), višina (0 = neznana; 1.503 znanih), vrsta (0 hiša, 1 hotel ali velika stavba, 2 svetišče, 3 postaja, 4 streha, 5 lopa ali garaža), razdalja, stran (+1 desno, −1 levo), s].
  - `trees`: 34.261 dreves do 60 m (vrhovi modela višin krošenj; vsa do 20 m, dlje samo višja), binarno po 8 bajtov (`rec`), urejena po `s`.
  - `rail`: 38 črt železnice do 150 m ({pts [[x, z, h]] z očiščenimi višinami (največ 8,5 %), seg: 1 most, 2 predor, near, bridges, osm}); `stations`, `platforms`.
  - `walls` (le 3 v OSM; opornih zidov ob cesti OSM skoraj nima), `paving` (stara pot), `gates` (17 torii, `in_lake`, eden do 60 m), `streams` (potoki, reke in pregrade do 100 m), `river_areas`, `parking`, `pylons` in `power_lines` (daljnovod ob cesti 732), `bus_stops`, `vending` (avtomati), `shrines`.
- **Viri za »Zasluge« v `README.md`** (sklop 5): OpenStreetMap (ODbL 1.0; izpeljani podatki v `js/tracks/hakone.js`, `js/data/hakone.js` in `tools/hakone/podatki/` prav tako ODbL 1.0), Copernicus DEM GLO-30 (besedilo kot pri drugih progah), ESA WorldCover 2021 (CC BY 4.0) in **High Resolution Canopy Height Maps** (Meta in World Resources Institute, 2024, CC BY 4.0: drevesa in krošnje).

## Sklopi

1. **Podatki** (to je narejeno): potek proge, višine, teren koridorja in daljni pogled s Fujijem, raba tal, stavbe, drevesa in železnica do 60 m, ta načrt.
2. **Proga v igri:** `js/tracks/hakone.js` po vzoru `js/tracks/nring.js` (100 avtov, leteči štart) in `js/tracks/iroha.js` (gorska cesta, `dem`, `lc`, serpentine): `id: 'hakone'`, `name: 'Hakone, Japonska'`, `theme: 'hakone'`, `laps: 1`, `raceRivals: 99`, `flyStart: true`, `rivals: 20`, `realKm` 26,8; črta iz `pot.json` `points`, zglajena, serpentine odprte na r ≥ 10,5 m s kraki ≥ 21 m narazen (kot Irohazaka), ovinek Sanmaibashi zaokrožen; višine iz `h` (relativno na štart, `elevSmooth`), širina za dva pasova (`halfWidth`, `wide` na serpentinah, ki jih 100 avtov potrebuje), imena krajev (`names`) s seznama zgoraj, `hudSigns` (Sedem ovinkov kot ena skupina, serpentina Ōhiradai), `bridges` iz `pot.json`, `dem` in `lc` iz `teren.json` / `okolica.json` (ali vse podatke okolice v `js/data/hakone.js` kot Montréal). Angleško ime in opis v `js/lang.js` (`Hakone, Japan`), `index.html`, `node tools/menu-lens.js` (višina štarta 97 m: `alt: [97, 880]` v datoteki proge, kot pri Irohazaki, ali tabela `BASE` v orodju), zastava Japonske že obstaja (`assets/flags/japan.svg`), `node tools/menu-globe.mjs` (štart v tabelo `PLACES`: `hakone: [35.2336134, 139.1046511]`), `node tools/stamp.js`. Test `tests/hakone.test.js` po vzoru obstoječih; AI odpelje cel krog s 100 avti (tudi skozi Sedem ovinkov navzdol). Začasna tema lahko riše preprost svet, dokler sklop 3 ne naredi `js/world-hakone.js`.
3. **Okolica do 60 m:** `js/world-hakone.js` (`World.ext.hakone`, pomočniki iz `World.api`; kot Irohazaka uporabi Vršičeve pomočnike koridorja `vrPrep` … za teren iz `def.dem` in rabo tal iz `def.lc`): vasi s toplicami (stavbe iz `bld`, japonske strehe, električni drogovi z žicami v vaseh), gorska železnica (proga, mostovi, most čez cesto pri s ≈ 2.005, prehod v Kowakidaniju, obračališča cikcak, postaje), hortenzije ob železnici, gozd (drevesa iz `trees`: cedre, javorji, bambus ob cesti), cedrov drevored ob stari poti (s 15,6–17,4 km), kamnita stara pot (`paving`), torii pri Hatajukuju, jezeri Shōjin in Otama-ga-ike, gledalci, štartni prostor v Yumotu; daljni pogled: teren `far` in `fuji` (en mesh kot `irFar` v `js/world-iroha.js`, dekodiranje z `lo` in `step`), jezero Ashi z rdečimi vrati v vodi in nekaj generičnimi izletniškimi ladjami, morje na vzhodu, Fuji (odločitev o zakrivanju: zgoraj). Pravilo 60 m: dlje od ceste samo teren.
4. **Obremenitev telefona:** do meja v `tests/golden/perf.json` (~300 klicev risanja, ~900 tisoč oglišč v povprečju in na najzahtevnejšem mestu), poenostavitve (manj dreves dlje od ceste, združene stavbe), reference `npm run golden:update`, druge proge enako obremenjene.
5. **Meni in opisi:** `assets/tracks/hakone.webp` in `hakone-rain.webp` (`maketa-menija/orodja`, glej `maketa-menija/README.md`), `docs/proge/hakone.md`, `README.md` (Proge, Zasluge: viri zgoraj), `docs/kazalo.md`; spoji svež `main` (Livorno), razreši spore, reference znova; pull request (osnutek, nato »Ready for review«, ko so povezani testi lokalno zeleni); poročilo s seznamom za preizkus na telefonu.

## Stanje

| Sklop | Stanje | Seja | Opomba |
|---|---|---|---|
| 1 Podatki | narejeno (2. 11. 2026) | session_01UuPU9C8VyzX8qYBw2xUG4Z | `tools/hakone/` (orodja in `podatki/`), ta načrt; krog 26,8 km, smer cesta 1 navzgor |
| 2 Proga v igri | čaka | | |
| 3 Okolica do 60 m | čaka | | |
| 4 Obremenitev telefona | čaka | | |
| 5 Meni in opisi, pull request | čaka | | |

## Predaja in opombe za naslednje sklope

- Testne proge se ne urejajo in ne uporabljajo za preverjanje (`CLAUDE.md`); za primerjavo vzemi pravo progo (Nürburg za 100 avtov, Irohazaka za serpentine).
- Brskalniški testi: playwright ni nameščen v projektu. Pred prvim: `mkdir -p node_modules && ln -sfn /opt/node-tools/node_modules/playwright node_modules/playwright && ln -sfn /opt/node-tools/node_modules/playwright-core node_modules/playwright-core`. Lokalno poganjaj samo `npm run test:related`.
- Velikih datotek ne beri v celoti: najprej `docs/kazalo.md`, nato grep (`js/world.js`, `js/render.js`, `js/core.js`, `js/game.js`).
- `ctyeh.com` (vir poteka, ki ga je navedel uporabnik) iz seje ni dosegljiv; potek je v celoti iz OSM.
- Model višin krošenj Meta/WRI daje zmerne višine (mediana dreves ob cesti 7–13 m); resnične cedre so višje (25–40 m), zato naj sklop 3 višine dreves raje raztegne kot skrči.
- Vprašanja uporabniku gredo na stran Odločitve (`CLAUDE.md`, razdelek Seje), z oštevilčenimi možnostmi in slikami.

## Odprta vprašanja (privzeta izbira, dokler uporabnik ne odgovori)

- **Fuji:** resnično zakrivanje (vidi se le pri Moto-Hakoneju desno in vrh pri Ōhiradaiju) ali Fuji nad daljnimi grebeni. Privzeto: nad daljnimi grebeni (uporabnik je želel obzorje z goro Fuji). Vpraša sklop 3 s slikama iz igre.
- **Jezero in drevored:** jezero je ~190 m od ceste (razgled, ne predmeti do 60 m); cedrov drevored ob stari poti namesto tistega ob jezeru. Privzeto tako; če uporabnik želi drugače, se odloči v sklopu 3.
