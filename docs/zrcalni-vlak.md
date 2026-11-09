# Zrcalni cestni vlak (načrt teme)

Vozilo »zrcalni cestni vlak«: verzija 1 zrcalne cisterne, ki jo je uporabnik izbral 5. 11. 2026. Črna terenska kabina (vlačilec), prva zrcalna cisterna na sedlu (polpriklopnik), za njo dolly in druga zrcalna cisterna: dva zgiba. Cisterni sta iz zrcalno polirane nerjavne pločevine. Veja `cisterna/zrcalni-vlak` (iz `titan-cisterna`, #304), en pull request; na `main` gre za #304.

Vir opisa: seja session_01QiZPCZFYZECemerxaNXvMZ (»Kamion s cisternama - 6 verzij«, 18. 10. in 4. 11. 2026).

## Opis (verzija 1)
- **Vlačilec**: na osnovi KAMNA PUŠČAVA (`js/cars/kamen.js`: tovornjak 4×4 z nosom pred kabino). Črna kabina, kromirana izpuha, odbojni lok, zadaj sedlo. Brez znamke. Strešnega nosilca s kanticami in rezervno gumo na kabini ni več (odločitev uporabnika 9. 11. 2026: brez rezervnih koles na strehi in rezervnega bencina).
- **Cisterni**: zrcalno polirana nerjavna pločevina, obroči, pohodna pot z ograjo, bočni odbijač, rdeča omarica. Med njima dolly (oje, dve osi, svoje sedlo).
- **Odsev za telefon**: vnaprej pripravljen odsev neba in okolice v teksturi (gradient neba, obzorje, tla), ne živo zrcalo. Malo klicev risanja.
- Vlak je dolg ~25 m.

## Sklopi
| Sklop | Kaj | Stanje |
|---|---|---|
| a | Model: črna kabina, dve zrcalni cisterni, dolly | narejeno |
| b | Fizika dveh zgibov (sedlo + dolly): lomljenje, potiskanje, škarje, trki, padec | narejeno (odprti vprašanji spodaj) |
| c | Tekmeci in promet z dolgim vozilom, kamera, posnetek, več telefonov | narejeno (duh 9 kanalov; brskalniški test z drugo cisterno) |
| d | Testi vozila, obremenitev telefona, README, reference | narejeno: `tests/zrcalni.test.js`, `tests/browser/zrcalni.test.mjs`, flota z obremenitvijo, README, kazalo, `docs/igra.md` |

TITAN s cisterno (#304) mora delovati enako (njegove reference se ne smejo spremeniti).

## Nadaljevanje (5. 11. 2026 popoldne, seja session_01Ck3D3TpE6eSmUqcu4PnUtv)
Sproti zapisano, da je delo varno ob nenadni ustavitvi računa. Vse spodaj je potisnjeno na vejo. **Stanje ob koncu seje: delo je končano**, #322 je v vrsti (`docs/vrsta.md`, takoj za #304) in ostane osnutek; odprto ni nič.

**Nihanje druge cisterne: odpravljeno.** Vzroka sta bila dva, oba samo pri vlaku (TITAN je bit za bitom enak):
1. Osi cistern so ob vsakem pregibu višinskega profila in ob skoku mesta ob cesti (v ozkem ovinku os seka notranjost in se njena projekcija na sredino ceste premakne) za nekaj korakov »poletele«, takrat brez oprijema: Bathurst 4 % korakov, Caracoles 15 %, Tianmen 22 %. Zdaj `tlRide` (`js/core.js`): os vlakove cisterne odleti samo, kjer greben pod njo pada hitreje, kot ona pada (pravilo avta v `stepCS`: `vl² · curv < −0,85 · JUMP_G`), sicer je na cesti. Cisterne zdaj letijo le tam, kjer leti tudi traktor (Ouninpohja).
2. Ograja: potisk na vogal cisterne pred njenim sedlom jo je zavrtel v ograjo, vsak korak močneje (Bathurst, nova, L. Rossi 81,8 s: zgib 2 s −7° na −57° v 0,1 s). Zdaj nobena cisterna vlaka nima točk za ograjo pred sedlom; prva ima točki dollyja (njegova zadnja os).

**Mreža**: postavila je vlake samo po dolžini prve cisterne, zato je traktor stal na drugi cisterni vlaka pred sabo in avtopilot je zavrl (reševanje ob štartu na Bathurstu). Zdaj `tlTail` (rep vlaka za sredino traktorja) in druga cisterna v `_tlSlots` in `_tlFree`. Reševanj ob štartu ni več.

**Meritve po popravku** (`tests/zrcalni.test.js`, 20/20; nov preizkus: zgib 2 pod 50°):

| Proga | Fizika | Igralec | Najpočasnejši | Zgib 1 / 2 | Reševanja | Stiki |
|---|---|---|---|---|---|---|
| Bathurst | cs | 2868 m | 2868 m | 39° / 28° | 0 | 3 |
| Bathurst | nova | 2974 m | 2916 m | 40° / 24° | 0 | 2 |
| Vršič | cs | 3092 m | 2994 m | 39° / 21° | 0 | 0 |
| Vršič | nova | 3074 m | 3046 m | 26° / 16° | 0 | 2 |
| Caracoles | cs | 2351 m | 2351 m | 65° / 39° | 0 | 2 |
| Caracoles | nova | 2376 m | 2376 m | 44° / 36° | 0 | 2 |

Na desetih drugih progah zgib 2 doseže mejo samo v serpentinah s polmerom 7–15 m pri 25–42 km/h (Tianmen, Pikes, Harju, Katu, Spa La Source): oba zgiba sta zložena v isto smer, cisterna 2 skoraj ne drsi. To je geometrija 28 m dolgega vlaka, ne nihanje.

**Obremenitev telefona** (`FLEET_ONLY=zrcalni,cisterna node tests/browser/fleet.test.mjs`, 41/41; preverjanje »each vehicle's own field« vsebuje vlak samo od sebe): polje treh vlakov, vsi narisani v celoti, Jezero 142 klicev in 594 tisoč oglišč (meja 240 in 673 tisoč), z razbitino 40 kosov v proračunu; Nürburgring 145 klicev in 377 tisoč (meja 198 in 393 tisoč). Vlak sam: igralec 22 klicev, tekmec 17 (prikolica 4 klice več na cisterno). Proge z navadnim poljem: brez spremembe (vlak ni v privzetem polju, `perf.json` ostane).

**Brskalniški test** (`tests/browser/zrcalni.test.mjs`, 17/17): kamera ima v kadru tudi rep druge cisterne (24 točk: obe cisterni in vlačilec; rep pri −0,84 do −0,95 višine zaslona), posnetek hrani in vrne oba kota (9. število), »Nazaj na dirko« vrne obe cisterni, duh nariše drugo cisterno (`v.tlG2`, otrok skupine prve) na sedlu dollyja (2,8 cm od njega, kot natančen na 0,0001 rad).

**Opis**: `docs/igra.md` (Tovornjaki: vrstica in razdelek »Zrcalni cestni vlak«, polje 3). Dolžina v opisu vozila popravljena s 25 na 28 m (od nosu do repa 28,25 m; `js/cars/zrcalni.js`, `js/lang.js`).

**Cisterna 2 in lasten vlačilec**: trka ne računamo, ker ga zgiba ne dopustita. Najbližja točka cisterne 2 je vsaj ~11 m od sedla 1 (12,6 m do sedla 2, manj 0,9 m nosu in pol širine), vlačilec seže največ 5,3 m od sedla 1; pri zgibih do 83° in 57° v katerokoli smer se ne dotakneta.

## Stanje in predaja (5. 11. 2026, seja session_01Ck3D3SdW9ZXQFowWCQHVjR)
Veja `cisterna/zrcalni-vlak`, osnutek #322 (na `main` za #304). Vse je potisnjeno.

**Zasnova (B-dolly).** Dolly je trdno pripet na prvo cisterno (dve oji), zato sta zgiba samo dva: sedlo vlačilca (cisterna 1, `c.tl`) in sedlo dollyja (cisterna 2, `c.tl.next`). Cisterna 2 je polpriklopnik, ki ga vleče cisterna 1:
- `tlChain` (`js/core.js`) ji izpelje def: `kp[0]` je merjen od sredine cisterne 1, `kp0` od kingpina 1.
- Cisterni 1 doda obremenitev kingpina 2 (`T.k2`) in točko gum `T.xt` (utežena sredina njenih osi in osi dollyja).
- V vsakem krogu (`TLK.it`) se po `tlPin(c, T)` izvedeta še `tl2Tyre` in `tlPin(T, T2)`.
- Meji zgibov: zgib 1 `TLK.lim`, zgib 2 `next.lim` = 1,0 rad (57°).
- Nova aritmetika teče samo pri `T.next`, `T.xt`, `T.lim` ali `T.par`, zato je TITAN bit za bitom enak: golden brez razlik, `cisterna.test.js` 14/14 z enakimi števili.

**Model** (`js/cars/zrcalni.js`): vlačilec je narejen po KAMNU, črn. Cisterni sta `build1` in `build2`, dolly je v `build1`.

**Zrcalo**: `look.mirror { k, uv }`. V `tlBuild` je to `MeshLambertMaterial` z `envMap: envTex`, `MixOperation` in `specularMap`, ki je bel samo na plašču in dnih. V teksturo je vpečen odsev neba, obzorja in tal. Klicev risanja ni več: vsaka cisterna jih ima 4, kot TITAN.

**Posnetek, omrežje in duh** (druga cisterna ima svoj kot):

| Kaj | Oblika | Kje |
|---|---|---|
| Posnetek | `REC_TL2` = 9 števil na avto | `H.w` v datoteki |
| Omrežje | ključ `tl2` | `ST_KEYS` |
| Duh | 9 kanalov | `ghCh`; izris: otrok skupine cisterne 1 |

**Kamera, mreža, AI, foto način in TV kamere** uporabljajo `T.back` (rep vlaka). Garaža vlak okvirja do `k` 7, TITAN do 4 kot prej.

**Meritve.** `tests/zrcalni.test.js`: 4 vlaki, 120 s. Oba kingpina 0,0 cm, brez NaN.

| Proga | Fizika | Igralec | Najpočasnejši | Zgib 1 / 2 | Reševanja | Stiki |
|---|---|---|---|---|---|---|
| Bathurst | cs | 2876 m | 2818 m | 42° / 57° | 1 | 4 |
| Bathurst | nova | 2861 m | 2789 m | 33° / 57° | 1 | 4 |
| Vršič | cs | 3032 m | 2996 m | 41° / 57° | 0 | 2 |
| Vršič | nova | 3060 m | 3054 m | 28° / 57° | 0 | 2 |
| Caracoles | cs | 2324 m | 2319 m | 59° / 57° | 0 | 2 |
| Caracoles | nova | 2352 m | 2348 m | 45° / 57° | 0 | 4 |

Zaviranje v ovinku z 89 km/h (zgib 1 / zgib 2):

| Fizika | Zgib 1 | Zgib 2 | Nato ravno |
|---|---|---|---|
| cs | 14 → 38° | 8 → 12° | 0° / 0° |
| nova | 9 → 14° | 7 → 7° | 0° / 0° |

Vožnja (`expect`): t100 14,0 s, vmax 137 km/h, latG 1,25 g, d100 44,2 m.

**Lokalno zeleno:**
- `node tests/zrcalni.test.js` (14/14);
- `node tests/fleet.test.js` (231/231; ovojnica `vlak`);
- `node tests/cisterna.test.js` (14/14, enako kot prej);
- `node tests/golden.test.js` (vse OK);
- `lang`, `shards`, `node tools/stamp.js --check`;
- brskalniški testi: glej »Brskalniški testi« spodaj.

**Kaj je manjkalo (seja v nedeljo; 1–6 zdaj rešeno, glej »Nadaljevanje« zgoraj):**
1. *(rešeno)* `tests/browser/zrcalni.test.mjs` je kopija `tests/browser/cisterna.test.mjs` za vlak (16/16 lokalno). Dodaj preverjanja druge cisterne: v kameri njen rep, v posnetku njen kot, pri duhu njeno skupino `v.tlG2` na sedlu dollyja.
2. *(rešeno)* Obremenitev telefona z vlakom v polju (`perf`, polje `fieldN 3`) in vpis v test.
3. *(rešeno)* README (»Novo vozilo«: `trailer.next`, `look.mirror`) in `docs/kazalo.md` sta dopolnjena. Manjka opis vlaka v `docs/igra.md` (vozila).
4. *(rešeno)* **Nihanje druge cisterne** (najpomembnejše). Primer: Bathurst, cs, tekmec M. Kovač, 55–59 s, s ≈ 1340–1430. Med zaviranjem v ovinek s 101 na 77 km/h zgib 2 zraste z 0 na −35° in zaniha na +57° (meja), nato upada (33° pri 59,2 s). Zgib 1 ostane med −20° in +7°. Cisterna 2 zaide 7,4 m od sredine ceste; trka ni bilo.
   - Gre za slabo dušeno nihanje zadnjega priklopnika (»rearward amplification«).
   - Na Vršiču je zgib 2 na meji v serpentinah (43–59 km/h, zgib 1 do −27°), kar je verjetno pravilno.
   - Poskusi dušenje zasuka na sedlu dollyja ali v `tl2Tyre` (oprijem in togost gum dollyja) in razporeditev teže (`T.k2`, `T.xt`). Meje `lim` ne višaj, dokler nihanje ni dušeno.
   - Merilni skripti sta v predaji spodaj (Kako testirati).
5. *(rešeno: mreža)* Reševanje na Bathurstu (obe fiziki) je ob štartu: 3,0 s, s = 6156, 2 km/h, `stuckT` 3 s. Težek vlak (29 t) z mreže spelje prepočasi za avtopilotov števec zastoja. Preveri speljevanje (navor in prenos pri 0 km/h) ali naj test prvih nekaj sekund ne šteje.
6. *(ni potrebno)* Cisterna 2 ne trči v lasten vlačilec (pri škarjah gre skozenj). Trki z drugimi avti, cisternami in stenami delujejo.
7. *(rešeno: 31 povezanih testov glede na #304 zelenih na cb98aef, med njimi `world`, `gfx`, `fleet`, `marks`; golden 350/350 enakih)* Celoten `npm run test:related`. Diff proti `main` vsebuje vse iz #304, zato je dolg.
8. *(vpis narejen: #366, mesto takoj za #304)* Po združitvi #304: spoji `main`, poženi povezane teste in #322 označi »Ready«, ko je med prvima dvema (to naredi biketraveler, dokler račun 2 stoji).

**Kako testirati:**
- Node: `node tests/zrcalni.test.js` (~1 min) in `node tests/fleet.test.js`. TITAN: `node tests/cisterna.test.js` in `node tests/golden.test.js` (reference se ne smejo spremeniti).
- Brskalnik: `FLEET_ONLY=zrcalni,cisterna node tests/browser/fleet.test.mjs` in `node tests/browser/cisterna.test.mjs`. Če Playwrighta ni: `ln -sfn $(npm root -g)/playwright node_modules/playwright`.
- V igri: `index.html?proga=bathurst&nacin=dirka&avto=zrcalni&t=20&tekmeci=2`; časovna vožnja (duh): `nacin=kronometer`.
- Nihanje zgiba 2: v zanki `tests/zrcalni.test.js` za vsak avto štej korake z `|c.tl.next.rel| > lim − 0,02` in izpiši hitrost, `c.tl.rel` in `c.tl.next.qa.d` (odmik od sredine ceste) vsakih 0,2 s okoli prvega takega koraka (Bathurst, cs, seme 7: tekmec M. Kovač pri 58,1 s).

### Brskalniški testi
- `node tests/browser/cisterna.test.mjs` (TITAN): 16/16, enako kot prej.
- `node tests/browser/zrcalni.test.mjs` (vlak): 17/17 (prej 16/16; dodano: druga cisterna v kameri, posnetku in duhu).
  - Kamera: rep cisterne 2 pri −0,84 do −0,95 višine zaslona.
  - Posnetek: `w` 9.
  - Duh: `ch` 9, n 2322.
  - Meni: vlak 28,25 m, 15 klicev risanja, 30.922 trikotnikov.
- `FLEET_ONLY=zrcalni,cisterna node tests/browser/fleet.test.mjs`:
  - Garaža je zdaj v redu (prej je vlak segal čez ploščo). Razbitina in popravilo sta v redu.
  - Strošek polja treh vlakov je bil na Nürburgringu za las nad mejo oglišč 393k. Tekmeci imajo zato lažje obroče (vsak drugi, brez stranic, `B.hoop` `flat`).
  - Zdaj: Nürburgring 163 klicev in 387k oglišč, Jezero 160 klicev in 603k (TITAN 377k in 594k, kot prej).

## Po spoju z mainom (8. 11. 2026, seja računa partyslo): garaža in cena
- **Garaža** (sklopi 6–8 na `main`, `js/garage3d.js`): na poti iz vrat so spodnja letev dvignjene zavese vrat in svetilke na 3,46 m, zato noben del avta ne sme biti nad 3,3 m (KAMEN 3,28 m). Vlačilec je segal do 3,67 m (dve rezervni gumi na nosilcu, kantice 0,36 m), `laneWay` je javil »garage: no clear way for zrcalni«, `garage.test.mjs` je padel (korak 4/6 na GitHubu). Nato: ena rezervna guma (0,22 m široka, leži na strehi), kantice ležeče (0,2 m), izpuha do 3,28 m, trak čez kantice na 3,28 m; najvišji del je bil 3,29 m. Od 9. 11. 2026 strešnega nosilca ni (gume in kantic na kabini ni): najvišji so izpuha in strešne luči do 3,28 m. Pogoj za vsako novo vozilo: `node tests/browser/garage.test.mjs` (»no page errors« ne sme javiti »no clear way«).
- **Cena**: v tabeli `CAREER.car` (`js/core.js`) TITAN CISTERNA 850.000 in ZRCALNI VLAK 1.000.000 kovančkov (TITAN 500.000, KAMEN PUŠČAVA 800.000), da so na zaslonu avta v vrstnem redu `ord` 1–4 (TITAN, KAMEN, CISTERNA, ZRCALNI; zaslon uredi po ceni iz tabele). Cena v datoteki vozila (75.000 in 90.000, stara lestvica) velja le, če vnosa v tabeli ni; takrat sta vozili stali pred TITAN-om in `browser/cars-ui.test.mjs` je padel. Preverja `tests/zrcalni.test.js` (vrstni red cen) in `cars-ui`.
