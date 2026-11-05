# Zrcalni cestni vlak (načrt teme)

Vozilo »zrcalni cestni vlak«: verzija 1 zrcalne cisterne, ki jo je uporabnik izbral 5. 11. 2026. Črna terenska kabina (vlačilec), prva zrcalna cisterna na sedlu (polpriklopnik), za njo dolly in druga zrcalna cisterna: dva zgiba. Cisterni sta iz zrcalno polirane nerjavne pločevine. Veja `cisterna/zrcalni-vlak` (iz `titan-cisterna`, #304), en pull request; na `main` gre za #304.

Vir opisa: seja session_01QiZPCZFYZECemerxaNXvMZ (»Kamion s cisternama - 6 verzij«, 18. 10. in 4. 11. 2026).

## Opis (verzija 1)
- **Vlačilec**: na osnovi KAMNA PUŠČAVA (`js/cars/kamen.js`: tovornjak 4×4 z nosom pred kabino). Črna kabina, kromirana izpuha, odbojni lok, strešni nosilec s kanticami in rezervne gume, zadaj sedlo. Brez znamke.
- **Cisterni**: zrcalno polirana nerjavna pločevina, obroči, pohodna pot z ograjo, bočni odbijač, rdeča omarica. Med njima dolly (oje, dve osi, svoje sedlo).
- **Odsev za telefon**: vnaprej pripravljen odsev neba in okolice v teksturi (gradient neba, obzorje, tla), ne živo zrcalo. Malo klicev risanja.
- Vlak je dolg ~25 m.

## Sklopi
| Sklop | Kaj | Stanje |
|---|---|---|
| a | Model: črna kabina, dve zrcalni cisterni, dolly | narejeno |
| b | Fizika dveh zgibov (sedlo + dolly): lomljenje, potiskanje, škarje, trki, padec | narejeno (odprti vprašanji spodaj) |
| c | Tekmeci in promet z dolgim vozilom, kamera, posnetek, več telefonov | narejeno (duh 9 kanalov; brskalniški test vlaka manjka) |
| d | Testi vozila, obremenitev telefona, README, reference | delno: `tests/zrcalni.test.js`, flota, README, kazalo; manjkata obremenitev telefona in brskalniški test vlaka |

TITAN s cisterno (#304) mora delovati enako (njegove reference se ne smejo spremeniti).

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

**Kaj manjka (seja v nedeljo):**
1. `tests/browser/zrcalni.test.mjs` po vzoru `tests/browser/cisterna.test.mjs`. Preveri kamero, posnetek z 9 števili, duh s `ch` 9 in meni. Za poskus lokalno: `sed 's/avto=cisterna/avto=zrcalni/; s/r.w === 8/r.w === 9/; s/a.ch === 8/a.ch === 9/' …`. Izid je v razdelku »Brskalniški testi«.
2. Obremenitev telefona z vlakom v polju (`perf`, polje `fieldN 3`) in vpis v test.
3. README (»Novo vozilo«: `trailer.next`, `look.mirror`) in `docs/kazalo.md` sta dopolnjena. Manjka opis vlaka v `docs/igra.md` (vozila).
4. Zgib 2 na vsaki progi doseže mejo 57°: poglej, ali je meja prenizka ali tekmeci vlak preveč lomijo (npr. `lim` 1,2 in primerjaj).
5. Na Bathurstu igralec (avtopilot) potrebuje 1 reševanje v obeh fizikah. Poišči kraj (`r.rescue`) in razlog.
6. Cisterna 2 ne trči v lasten vlačilec (pri škarjah gre skozenj). Trki z drugimi avti, cisternami in stenami delujejo.
7. Celoten `npm run test:related`. Diff proti `main` vsebuje vse iz #304, zato je dolg.
8. Po združitvi #304: spoji `main`, vpiši #322 v `docs/vrsta.md` in ga označi »Ready«, ko je med prvima dvema.

**Kako testirati:**
- Node: `node tests/zrcalni.test.js` (~1 min) in `node tests/fleet.test.js`. TITAN: `node tests/cisterna.test.js` in `node tests/golden.test.js` (reference se ne smejo spremeniti).
- Brskalnik: `FLEET_ONLY=zrcalni,cisterna node tests/browser/fleet.test.mjs` in `node tests/browser/cisterna.test.mjs`. Če Playwrighta ni: `ln -sfn $(npm root -g)/playwright node_modules/playwright`.
- V igri: `index.html?proga=bathurst&nacin=dirka&avto=zrcalni&t=20&tekmeci=2`; časovna vožnja (duh): `nacin=kronometer`.

### Brskalniški testi
(izid spodaj)
