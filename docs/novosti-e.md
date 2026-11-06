# Novosti E: videz avta povsod in beg pred policijo s prijatelji

Načrt dveh novosti, ki ju je uporabnik izbral 5. 11. 2026 (koordinacija »VSE SEJE 2«, `session_01WbgGzv4TzuAXEWDMgtBJpF`; načrt je napisala seja `session_01WbgGzv9AmeVnfowhnJKRRN`). Kodo pišemo šele po odgovorih na strani Odločitve 3 (vprašanja `videz-1`, `videz-2`, `beg-1`, razdelek Odločitve). Obe temi sta v `docs/vrsta.md` (Načrtovano, račun 3): pred novimi progami. Videz pride po #297 (garaža, račun 1). Za beg je uporabnik 5. 11. izbral beg s prijatelji (`beg-1` = 3): B1 in B2 se delata že zdaj, drugo po #250 (Zabava). Vsaka novost ima svojo sejo (Opus), svojo vejo in en pull request.

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

**Beg pred policijo: cel način že obstaja.** To je *Police chase* v *Single race* (`modes: [… 'police']`) na 17 odprtih cestah s prometom; 7 ameriških (`baldy`, `beartooth`, `bigsur`, `maunakea`, `mulholland`, `palomar`, `uncompahgre`) po odločitvi uporabnika 5. 11. 2026 postane testnih in zamrznjenih (#293, #355), pravih ostane 10. Ima kontrolno točko, pregon s 4–6 patruljami in motoristi, ježke, zapore, helikopter, zasede, civilni avto, hlode, vročino (zvezdice), policijski radio in seznam prekrškov. V karieri da »Nagrado za pobeg«, ima dosežek *Neulovljiv* in rekorde po cesti (`js/core.js` `Police`, `js/game.js` `finishPolice`, test `tests/police.test.js`). Konča se z aretacijo, s skrivališčem v stavbi na vrhu (Vršič) ali čez cilj. Na novi mapi so še policijske misije (`js/nvmenu.js`). Na spletu bega še ni: spletna dirka nima ne prometa ne policije. Uporabnik je 5. 11. izbral **beg s prijatelji** (`beg-1` = 3, Novost 2).

## Česa ne delamo in zakaj
- **Nov način bega za enega igralca:** že obstaja (zgoraj). Kratke različice 3:00 in pregona na Saniju ne delamo (`beg-1` = 3).
- **Deli na duhu** (duh, izziv s povezavo): duh je prosojen in enobarven, deli se na njem ne bi videli. Ostane barva.
- **Nove vrste nalepk ali črt:** 16 + 16 izmišljenih je dovolj. Nalepk z imeni, znamkami ali številkami ne delamo (pravna varnost, odločitev uporabnika 30.–31. 10. 2026: brez številk in krogov v nalepkah).
- **Učinek delov na spletu:** dirka s prijatelji ostane brez nadgradenj (pravilo igre). Prijatelji vidijo samo videz.

## Novost 1: videz avta povsod

**Cilj:** v garaži izbereš barvo (16 barv), izvedbo laka, svojo številko in platišča; na KOLIBRIJU še črte in njihovo barvo, nalepke in senčni pas (`videz-1` = 2, `videz-2` = 1, odločitvi uporabnika 6. 11. 2026). Tak je avto v vsaki dirki (tudi v prvenstvu), v posnetku (tudi iz datoteke) in pri prijateljih na spletu.

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

## Novost 2: beg s prijatelji (`beg-1` = 3, odločitev uporabnika 5. 11. 2026)

**Cilj:** v sobi s prijatelji (2–4 telefoni) en prijatelj vozi patruljo, drugi bežijo po odprti cesti s prometom. To je *Police chase* na spletu in hkrati »Ti loviš s prijatelji« (`docs/zabava.md`, c: »s prijatelji pozneje (posebej)«). Kratke različice 3:00 za enega igralca in pregona na Saniju ne delamo.

**Pravila:**
- Ceste: prave odprte ceste s prometom (način `traffic`, enako kot »Ti loviš«): 10 s policijo (`caracoles`, `chapman`, `greatalpine`, `hotham`, `iroha`, `medvode`, `mountbuller`, `rastro`, `tianmen`, `vrsic`) in Sani. Testnih prog ne spreminjamo.
- Vloge: gostitelj v sobi izbere način *Police chase* in tapne igralca, ki vozi patruljo. Privzeto se patrulja vrsti od dirke do dirke, da pride vsak na vrsto.
- Štart: patrulja je na štartu, begunci 150 m pred njo (kot begunec v »Ti loviš«). Patrulja ima luči in sireno, promet se ji umika (`Traffic._siren`). Begunci sireno slišijo glede na razdaljo.
- Ulov (pravilo iz »Ti loviš«, `K` v `js/zabava/lov.js`): patrulja je skupaj 5 s manj kot 15 m od begunca (dotik šteje več), merilnik počasi pada. Ulovljen begunec zapelje ob rob in obstane, do konca gleda.
- Pobeg: begunec zdrži 3:00, pripelje do cilja ali je 10 s več kot 400 m pred patruljo.
- Konec: ko noben begunec več ne beži. O ulovu in pobegu odloča gostitelj (kot o izločitvah v eliminaciji iz #250) in to pošlje vsem; merilnik vsak telefon prikazuje sam.
- Rezultati: patrulja »Ujel 2 od 3«, begunci »Pobegnil« (3:00, cilj, predaleč) ali »Ulovljen po 1:42«. Najprej so pobegli, nato ulovljeni po času (dlje je bolje).
- Promet je na vseh telefonih isti (seme gostitelja, gostota kot v begu 0,85). Trke s prometom računa vsak telefon zase.

**Izvedba (B3–B6, 6. 11.), kjer je drugače kot zgoraj:**
- Soba ima eno vrstico **Način**: *Dirka · Eliminacija · Pregon* (`modeRow` v `js/zabava.js`, vsak način s `netMode`; stikalo eliminacije je zdaj v njej). Velja en način naenkrat (`Z.netOne`). Pregon je samo v zasebni sobi, brez prvenstva, na odprti cesti s prometom; način, ki za izbrano progo ali sobo ne velja, se ne pokaže (gostitelj ga ob menjavi proge izklopi).
- Patruljo gostitelj izbere v vrstici **Patrulja** (izbirni seznam namesto tapa na igralca): privzeto *Po vrsti (ime)*, kdor jo je vozil najmanjkrat, ob enakem številu po vrstnem redu v sobi; ali izbere igralca. Prijatelj vidi isto, zaklenjeno (sporočilo `{ t: 'zb', k: 'bg', on, pol, next }`).
- Odloča gostitelj (`{ k: 'bgd', no, id, st, at, why }` za begunca, `{ k: 'bge', no, at }` za konec); ko gostitelja ni več, odloča vsak telefon sam. Pobegne tudi, ko patrulje ni več (odšla je ali pripeljala do konca ceste). Dotik je razdalja pod 5 m.
- Ujet begunec zapelje ob rob in obstane (`race.retire`), čez ~4 s je na rezultatih, ki se sproti dopolnjujejo, dokler lov traja (namesto gledanja do konca). Čas cilja ujetega je 100000 s manj čas ulova (`OUT`, kot izpadli v eliminaciji), pobeglega čas pobega.

**Priklop:**
- Zdaj, neodvisno od #250 (veja iz `main`):
  - **B1, promet v spletni dirki:** gostitelj v sporočilu `setup` pošlje promet in seme. `newRace` (veja `on`) ustvari `Traffic` z istim semenom (`opts.seed` že obstaja). Promet je brez dvoboja in kazni za povožene. Spletne dirke brez tega ostanejo, kot so.
  - **B2, patrulja prijatelja:** v `setup` je še id patrulje. Patrulja, tvoja ali prijateljeva, dobi `police` in `pol: { mode: 'chase', kind: 'car' }`. Podoba z lučmi (`polGear`) in umik prometa že obstajata. Sirena prijateljeve patrulje se ravna po razdalji (`Sfx.siren(lev, pan)`).
- Po #250 na `main`:
  - `js/zabava/beg.js` (nova datoteka, `Zabava.add`), način `beg` na spletu:
    - stikalo in izbira patrulje v sobi (`ZB.room`, `ZB.netSetup`);
    - merilnik, pobeg in konec (`K` iz `lov.js`);
    - sporočila `zb` (`ZB.net`);
    - rezultati (kot izpadli v eliminaciji, `ZB_OUT`).
  - `js/lang.js`: prevodi. `index.html`: skripta.

**Meni:** ploščica za igro s prijatelji ostane, izbira je v sobi (`buildRoom` v `js/game.js`): *Race*, *Elimination* in *Police chase*. *Police chase* je samo na cesti s prometom in v zasebni sobi (hitra igra do 22 ostane dirka). Po spremembi: `node tests/browser/menu.test.mjs`.

**Nagrade:** na spletu ni nagrad kariere in rekordov (kot pri dirki s prijatelji).

**Prevodi:** »PATRULJA«, »BEŽI!«, »ULOVLJEN!«, »POBEGNIL SI!«, merilnik (»ARETACIJA {0} %«, »PATRULJA {0} m«) in vrstice rezultata, sl/en v `js/lang.js`.

**Testi:**
- B1, Node (`tests/net-core.test.js`, Rio do Rastro, `rastro`): dva telefona z istim semenom imata enak promet. Po 40 s je enak tudi promet stran od avtov, torej vozila, ki se nobenemu avtu niso približala na 300 m (razlika 0,000 m). Vozila blizu avtov vsak telefon računa sam: na Riu do Rastro so se 3 od 36 razlikovala, za do 0,14 m (Medvode 1 od 42, 0,11 m; prej na Vršiču, ki gre med testne, 19 od 109 za do ~140 m). Popravki gostitelja za vozila blizu avtov zato niso potrebni. Spletna dirka brez bega ostane brez prometa.
- B2, Node: patrulja prijatelja ima podobo in sireno; promet na telefonu begunca se ji umakne (k robu, zavira), na telefonu patrulje pred beguncem na svojem pasu zavira, ob trku z avtom prijatelja se premakne samo vozilo (avto prijatelja premika njegov telefon). Brskalnik (`tests/browser/online.test.mjs`, druga dirka): na Riu do Rastro sta promet in patrulja enaka na obeh telefonih.
- `tests/zabava.test.js` (razdelek 10, prava dirka `Core.Race` na Riu do Rastro s tremi prijatelji): en način naenkrat, patrulja po vrsti in izbira gostitelja, ulov v 5 s (z dotikom v 2 s), pobeg (predaleč, cilj, odšel, 3:00, brez patrulje), begunec 150 m pred patruljo, merilnik na telefonu begunca brez odločanja, sporočila gostitelja (napačna dirka in sporočila z gostiteljevo oznako se ne upoštevajo), konec in vrstni red rezultatov.
- `tests/browser/online.test.mjs` (druga dirka): dva telefona (lokalni strežnik PeerJS); gostitelj v sobi izbere Pregon in prijatelja za patruljo, prijatelj vidi isto, zaklenjeno; isti promet, patrulja, gostitelj 150 m pred njo; patrulja 8 m za njim: ujet, konec in rezultati na obeh. Nato soba (Po vrsti: gostitelj), Dirka in tretja dirka brez pregona.
- Golden in obstoječe spletne dirke ostanejo enake.

**Obremenitev:** promet je enak kot v begu. Meritev 6. 11. (dva telefona v brskalniku z nastavitvami proračuna iz `tests/browser/perf.test.mjs`: 844 × 390, NIZKA, sence; vse sličice prvih ~25 s na Riu do Rastro, oba na avtopilotu): begunec 154 klicev risanja (največ 180) in 507 tisoč oglišč (največ 700 tisoč), patrulja 146 (174) in 441 tisoč (572 tisoč); ista dirka brez pregona 130 (157) in 423 tisoč (564 tisoč). Promet doda ~20 klicev in do ~80 tisoč oglišč, vse je pod mejo ~300 klicev in ~900 tisoč oglišč (`CLAUDE.md`). Spletna dirka brez pregona in druge proge se ne spremenijo.

**Koraki in ocena ur:**

| Korak | Kaj | Ure | Kdaj |
|---|---|---|---|
| B1 | promet v spletni dirki (isto seme), test | 2 | zdaj |
| B2 | patrulja prijatelja: podoba, sirena, umik prometa | 1,5 | zdaj |
| B3 | soba: način, izbira patrulje, vrstni red | 2,5 | po #250 |
| B4 | ulov, pobeg, konec, rezultati (`js/zabava/beg.js`) | 3,5 | po #250 |
| B5 | prevodi, opis v `docs/igra.md` | 1 | po #250 |
| B6 | testi (Node, brskalnik z dvema telefonoma), obremenitev | 3,5 | po #250 |
| | skupaj | ~14 | |

## Odločitve (stran Odločitve 3)

| id | o čem | možnosti (priporočena prva) | odgovor |
|---|---|---|---|
| `videz-1` | črte, nalepke in senčni pas na vseh avtih | 1 vsi avti, samodejno · 2 samo KOLIBRI (kot zdaj) | **2** (6. 11., stran Odločitve 3): črte, nalepke in senčni pas ostanejo samo na KOLIBRIJU; drugi avti imajo barvo, lak, platišča in številko. Korak V4 in `js/deli/mesta.js` odpadeta |
| `videz-2` | koliko barv | 1 16 barv · 2 ostane 8 · 3 poljubna barva | **1** (6. 11., stran Odločitve 3): 16 barv, zdajšnjih 8 in srebrna, siva, temno modra, bordo, turkizna, roza, limeta, bronasta (korak V3) |
| `beg-1` | beg pred policijo že obstaja: kaj dodamo | 1 kratek beg 3:00 · 2 nič · 3 beg s prijatelji | **3** (5. 11., v pogovoru s koordinacijo) |

Odgovora `videz-1` in `videz-2` sta prebrana 6. 11. in vpisana tu (seja #377 po naročilu koordinacije VSE SEJE 2).

## Stanje

| Korak | Stanje |
|---|---|
| Načrt, vprašanja, vpis v Načrtovano | narejeno 5. 11. 2026 |
| Novost 1 (V1–V5) | odgovora 6. 11.: `videz-1` = 2 (črte, nalepke in senčni pas samo na KOLIBRIJU; V4 odpade, skupaj ~15 h), `videz-2` = 1 (16 barv, V3); čaka na #297 |
| Novost 2 (B1–B6) | narejeno 6. 11. (veja `novosti-e/beg-prijatelji`, osnutek #377; na `main` za #372). B1–B2 (5. 11.): `js/core.js` `patrolCar`, `opts.netTf`, `opts.playerPolice`, `remote[].police`, `Traffic.net` (promet upošteva tudi avte prijateljev, trk jih ne premika); `js/game.js` `netBeg` (`mp.beg`), `setup` s `tf`, `seed`, `pol`, sirena prijateljeve patrulje v `roadSound`. B3–B6 (6. 11.): vrstica sobe Način (`modeRow` v `js/zabava.js`, eliminacija prestavljena vanjo), `js/zabava/beg.js` (Patrulja po vrsti ali izbrana, ulov, pobeg, konec, rezultati; kljuke `netRes`, `netOne`), `js/game.js` `netResults` z `ZB.netRes`, prevodi v `js/lang.js`, opis v `docs/igra.md` (Dirka s prijateljem: Način), testi (`tests/zabava.test.js` 10, `tests/net-core.test.js` in `tests/browser/online.test.mjs` na Riu do Rastro), meritev obremenitve zgoraj. Izvedba, kjer je drugače od načrta: odstavek »Izvedba« pod Pravili |
