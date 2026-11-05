# Novosti E: videz avta povsod in kratek beg pred policijo

Načrt dveh novosti, ki ju je uporabnik izbral 5. 11. 2026 (koordinacija »VSE SEJE 2«, `session_01WbgGzv4TzuAXEWDMgtBJpF`; načrt je napisala seja `session_01WbgGzv9AmeVnfowhnJKRRN`). Kodo pišemo šele po odgovorih na strani Odločitve 3 (vprašanja `videz-1`, `videz-2`, `beg-1`, razdelek Odločitve). Obe temi sta v `docs/vrsta.md` (Načrtovano, račun 3): pred novimi progami. Videz pride po #297 (garaža, račun 1), beg pa po #250 (Zabava). Vsaka novost ima svojo sejo (Opus), svojo vejo in en pull request.

## Kaj že obstaja (pregled 5. 11. 2026)

**Barve in nalepke: večina je že v igri.**

| Kaj | Zdaj | Kje |
|---|---|---|
| Barva | 8 barv (zaslon avta in garaža) | `PLAYER_COLORS` v `js/game.js`, `COLORS` v `js/garage.js` |
| Izvedba laka | 16 izvedb (enoslojni, folije, kovinski, biserni, kameleon, razstavni) na vseh avtih | element `barva` (`js/deli/barve.js`), v garaži krogi barv |
| Platišča | 16 platišč na vseh 33 avtih | element `platisca` (`DELI.wheel`), v garaži |
| Črte | 16 vzorcev, barva črt `car.stripeCol` | element `crte` je **samo na KOLIBRIJU** (`mounts.crte`). V garaži ga ni, barve črt se ne da izbrati |
| Nalepke | 16 izmišljenih (zvezda, strela, plameni, šahovnica, kamuflaža …) | element `nalepke` je samo na KOLIBRIJU. V garaži je od #297 (predal) |
| Senčni pas | 16 (enobarvni, s prehodom, s splošnimi napisi) | element `soncni_pas` je samo na KOLIBRIJU. V garaži ga ni |
| Številka | številka modela (`Core.MODELS[i].num`). Če je na spletu podvojena, se premakne (`netNums`) | izbire ni |
| V dirki | od #297 (račun 1, vrsta 11) so deli iz garaže v posamezni dirki (`playerDeli`), ne pa v prvenstvu (`ch`) in ne na spletu (`on`) | `js/game.js` `newRace` |
| V posnetku | posnetek po dirki: avti iz dirke. Posnetek iz datoteke (`.rrp`, `rrpOf` / `rrpOpen`) ima samo barvo in številko | `js/game.js` |
| Prijatelji | vidijo samo tvojo barvo (indeks) in številko (`meInfo`, `opts.remote`) | `js/game.js`, `js/core.js` `Race` |

**Beg pred policijo: cel način že obstaja.** To je *Police chase* v *Single race* (`modes: [… 'police']`) na 17 odprtih cestah s prometom. Ima kontrolno točko, pregon s 4–6 patruljami in motoristi, ježke, zapore, helikopter, zasede, civilni avto, hlode, vročino (zvezdice), policijski radio in seznam prekrškov. V karieri da »Nagrado za pobeg«, ima dosežek *Neulovljiv* in rekorde po cesti (`js/core.js` `Police`, `js/game.js` `finishPolice`, test `tests/police.test.js`). Konča se z aretacijo, s skrivališčem v stavbi na vrhu (Vršič) ali čez cilj. Na novi mapi so še policijske misije (`js/nvmenu.js`). Novo bi bilo samo dvoje: **časovna omejitev 3:00** s pregonom od štarta (zrcalno kot »Ti loviš« iz #250) ter Moki in Sani, ki promet imata, pregona pa ne.

## Česa ne delamo in zakaj
- **Nov način bega od začetka:** že obstaja (zgoraj). Dodamo samo kratko različico, če jo uporabnik izbere (`beg-1`).
- **Deli na duhu** (duh, izziv s povezavo): duh je prosojen in enobarven, deli se na njem ne bi videli. Ostane barva.
- **Nove vrste nalepk ali črt:** 16 + 16 izmišljenih je dovolj. Nalepk z imeni, znamkami ali številkami ne delamo (pravna varnost, odločitev uporabnika 30.–31. 10. 2026: brez številk in krogov v nalepkah).
- **Učinek delov na spletu:** dirka s prijatelji ostane brez nadgradenj (pravilo igre). Prijatelji vidijo samo videz.

## Novost 1: videz avta povsod

**Cilj:** v garaži izbereš barvo, izvedbo laka, črte in njihovo barvo, nalepke, senčni pas, svojo številko in platišča. Tak je avto v vsaki dirki (tudi v prvenstvu), v posnetku (tudi iz datoteke) in pri prijateljih na spletu.

**Priklop (ločene datoteke):**
- `js/videz.js` (nova datoteka, naložena za `js/deli.js` v `index.html` in `garaza.html`):
  - `Videz.of(id)`: videz avta iz kariere oziroma garaže: `{ deli, sc, num }`, kjer je `sc` barva črt.
  - `Videz.wire(v)` / `Videz.read(o)`: kratka oblika za splet in posnetek. Vsebuje samo vidne elemente z možnostmi 1–16 in preveri meje. Stara oblika brez videza ostane veljavna.
  - `Videz.dress(car, v)`: postavi samo videz (`car.deli`, `dLower`, `dTint`, `stripeCol`, `num`), fizike ne spremeni.
- `js/core.js`:
  - `dressOnly(car, deli)` ob `applyDeli`: postavi `dLower` in `dTint` brez fizike.
  - `Race`: `opts.playerLook` (videz brez učinkov, kjer `playerDeli` ni, npr. v prvenstvu) in `RM.look` pri avtih prijateljev (`opts.remote`).
- `js/game.js` (samo kratki priklopi):
  - `meInfo` doda `look`, `opts.remote` ga poda naprej, `mine` doda `playerLook`.
  - `rrpOf` / `rrpOpen`: videz igralčevega avta v glavi posnetka.
  - `PLAYER_COLORS`: novih 8 barv se doda na konec, če `videz-2` = 1. Star telefon neznano barvo pokaže kot prvo, kot zdaj.
- `js/garage.js`, `js/garage-shop.js`, `js/garage3d.js`: po #297 in v dogovoru z računom 1.
  - V predal z videzom gresta še `crte` in `soncni_pas`. Meni črt dobi vrstico barve črt.
  - Številka 1–99 se izbira s številčnico ob barvi.
  - Shranjeno v karieri (`career.garage.cars[id]`: `sc`, `num`).
- Črte, nalepke in senčni pas na vseh avtih (če `videz-1` = 1): `js/deli/mesta.js` (nova datoteka).
  - Samodejna mesta `mounts.crte`, `mounts.nalepke` in `mounts.soncni_pas` naredi iz oblike karoserije vsakega avta (`secs`, `roofY`, `decalX`), kjer jih avto nima sam.
  - Posebni avti (formula, LM, tovornjaki) dobijo mesta ročno ali ostanejo brez črt.

**Meni:** nov meni ostane, kot je (garaža je za zaslonom avta). Na zaslonu avta je 16 barv v vrstici, pokonci v dveh vrstah. V garaži sta predal z videzom in meni črt z barvo črt; številka je ob barvi.

**Nagrade:** novih nagrad ni. Črte in senčni pas stanejo po ceniku delov (`js/data/deli.js`). Barva in številka sta zastonj, lak se plača kot zdaj. Videz na vožnjo ne vpliva; deli, ki že imajo učinek, ga obdržijo po pravilih #297.

**Prevodi:**
- Garaža: pari `[sl, en]` v `js/garage*.js` (Številka / Number, Barva črt / Stripe colour, Senčni pas / Sun strip). Imena delov so že v `js/data/deli.js`.
- Igra: `js/lang.js` za imena novih barv: Srebrna, Siva, Temno modra, Bordo, Turkizna, Roza, Limeta, Bronasta.

**Testi:**
- `tests/videz.test.js` (Node):
  - `Videz.wire` / `read`: meje, neznani elementi, stara oblika.
  - `dressOnly` ne spremeni fizike (masa, moč in oprijem ostanejo enaki).
  - Avto prijatelja z videzom v `Race`.
- `tests/browser/online.test.mjs`: prijatelj vidi videz (`c.deli` na avtu prijatelja).
- `tests/browser/replay.test.mjs` in `napake-posnetek.test.mjs`: posnetek iz datoteke ima videz.
- `tests/browser/garage.test.mjs`: črte, barva črt, senčni pas in številka, shranjeni v karieri.
- `tests/deli.test.js`: sam vzame nova mesta (vseh 16 možnosti na vsakem avtu, meje).
- Pregled po kategorijah: `node tools/deli-plosca.mjs crte,nalepke,soncni_pas --car <id> --compact`.
- Serijski avti ostanejo enaki (`tests/kit.test.js`, golden).

**Obremenitev:**
- Vidni deli imajo največ 300 trikotnikov nad serijsko zunanjostjo na avto (pravilo `docs/deli.md`).
- Avti prijateljev sledijo obstoječi poenostavitvi oddaljenih avtov: od daleč so brez delov. Luč pod avtom (1 klic risanja) imajo samo igralec in prijatelji do ~60 m.
- Merjenje: `perf.test.mjs` na Bathurstu z avtom z vsemi vidnimi deli in `online4.test.mjs` s 4 avti. Prave proge brez prijateljev ostanejo enake.

**Koraki in ocena ur:**

| Korak | Kaj | Ure |
|---|---|---|
| V1 | `js/videz.js`; videz v prvenstvu, pri prijateljih in v posnetku iz datoteke; testi | 5 |
| V2 | garaža: črte z barvo, senčni pas, številka (po #297) | 5 |
| V3 | 16 barv (`videz-2` = 1; poljubna barva 4 h) | 2 |
| V4 | črte, nalepke in senčni pas na vseh avtih (`videz-1` = 1), pregled po kategorijah | 14 |
| V5 | obremenitev, dokumenti (`docs/igra.md`, `README.md`, kazalo), spoj `main`, osnutek PR | 3 |
| | skupaj s priporočenimi izbirami (z `videz-1` = 2 brez V4: ~15 h) | ~29 |

## Novost 2: kratek beg 3:00 (če `beg-1` = 1)

**Pravila:**
- V načinu *Police chase* izbereš dolžino: *Whole road* (kot zdaj) ali *3 min*.
- Pri *3 min* se pregon začne takoj, brez kontrolne točke. Prva patrulja štarta 150 m za tabo (zrcalno kot begunec v »Ti loviš«). Vse drugo je obstoječa policija (ježki, zapore, helikopter … po težavnosti).
- Pobegneš, ko zdržiš 3:00 ali prideš do cilja. Ujamejo te po zdajšnjem pravilu: skoraj stojiš, patrulja pa je ob tebi 1,6–3 s (`POL_DIFF.bust`).
- Odštevanje je pod ploščo **POLICIJA**.
- Ceste: vse odprte ceste s prometom, torej zdajšnjih 17 ter Moki in Sani. Moki in Sani dobita pregon le, če policija tam vozi dobro; sicer ostaneta brez.

**Priklop:**
- `js/beg.js` (nova datoteka): izbira dolžine, odštevanje, konec pri 3:00, rezultat in rekord. Narejeno je kot novost `Zabava.add` iz #250, ki je takrat že na `main`.
- `js/core.js` `Police`: `opts.police.limit` (sekunde) in `opts.police.hot` (pregon od štarta, brez `_check`), nekaj vrstic.
- `js/game.js`: `finishPolice` (razlog konca »3:00«) in nastavitev `S.polLen`.
- `js/tracks/moki.js`, `js/tracks/sani.js`: v `modes` se doda `'police'`.

**Meni:** v `js/menu.js` celica *Police · On you* v vrstici načina *Police chase* postane izbira *Whole road* / *3 min*, kot gumb *Opponents* pri dirki. Podnaslov igre (`title-sub`) dobi »· 3 min«. Po spremembi: `node tests/browser/menu.test.mjs`.

**Nagrade:**
- V karieri je nagrada kot za pobeg, sorazmerna prevoženi poti (`Core.careerPrize`).
- Pobeg šteje v statistiko in za dosežek *Neulovljiv*.
- Rekord ceste za 3:00 je ločen (najdaljša pot v 3:00, ključ `<id>-police3`).

**Prevodi:** *3 min*, *Whole road*, »ZDRŽI 3:00!«, »POBEGNIL SI!« in vrstice rezultata, sl/en v `js/lang.js`. Radijska sporočila policije že obstajajo.

**Testi:**
- `tests/police.test.js`: z `limit: 180` je pri 3:00 konec s pobegom, aretacija pred tem še velja, pregon se začne od štarta (brez kontrolne točke).
- `tests/browser/menu.test.mjs`: izbira dolžine, pokonci in ležeče.
- `races.test.js`: beg na Mokiju in Saniju.
- Golden: beg na Vršiču ostane enak.

**Obremenitev:** nove grafike ni (iste patrulje). Pri 3:00 so patrulje že od štarta blizu, zato meritev obremenitve v begu na Vršiču (`maxCalls`, `maxKverts` pod mejo `tests/golden/perf.json`).

**Koraki in ocena ur:**

| Korak | Kaj | Ure |
|---|---|---|
| B1 | pravila in priklop | 3 |
| B2 | meni in rezultat | 1,5 |
| B3 | Moki in Sani | 1 |
| B4 | testi in dokumenti | 1,5 |
| | skupaj | ~7 |

Če uporabnik izbere `beg-1` = 3 (beg s prijatelji: en prijatelj vozi patruljo, drugi bežijo, pravilo ulova iz »Ti loviš«), je to ~14 h. Dela se po #250, skupaj z »Ti loviš s prijatelji«.

## Odločitve (stran Odločitve 3)

| id | o čem | možnosti (priporočena prva) | odgovor |
|---|---|---|---|
| `videz-1` | črte, nalepke in senčni pas na vseh avtih | 1 vsi avti, samodejno · 2 samo KOLIBRI (kot zdaj) | čaka |
| `videz-2` | koliko barv | 1 16 barv · 2 ostane 8 · 3 poljubna barva | čaka |
| `beg-1` | beg pred policijo že obstaja: kaj dodamo | 1 kratek beg 3:00 · 2 nič · 3 beg s prijatelji | čaka |

Seja načrta odgovore prebere ob 23.20 (`send_later`), vpiše jih sem in obvesti koordinacijo.

## Stanje

| Korak | Stanje |
|---|---|
| Načrt, vprašanja, vpis v Načrtovano | narejeno 5. 11. 2026 |
| Novost 1 (V1–V5) | čaka na odgovore in na #297 |
| Novost 2 (B1–B4) | čaka na odgovor in na #250 |
