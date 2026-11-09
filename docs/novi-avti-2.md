# Novi avti 2: pet avtov za drift (+ unikat VRAN 01)

Izbira uporabnika 6. 11. 2026 (naloga koordinacije VSE SEJE 2, partyslo, session_01WbgGzv4TzuAXEWDMgtBJpF). Seja: session_01WbgGzuqEG9ght1Za9v8x1o, veja `novi-avti-2/drift`. Pravila in postopek kot pri prvih novih avtih (`docs/novi-avti.md` na veji #361 `novi-avti/vozila`): izmišljena imena živali, brez znamk, vsak avto svoja datoteka `js/cars/<id>.js`, testa `tests/kit.test.js` in `tests/fleet.test.js` (meje kategorij, brez omejevalnika `vLim`), ena kamera za avtom, obremenitev telefona v proračunu KIT.

## Avti

| id | Ime | Kategorija | Pogon | Zvok | Mere (d × š × v, medosje) | Slog |
|---|---|---|---|---|---|---|
| `ris` | RIS G | sportni | AWD | `i4`, turbo | 4,45 × 2,00 × 1,36 m, 2,62 m | gimkana kupe 4x4: široki blatniki, veliko krilo, zavesice za kolesi, črna streha, nalepke v blokih, odprtina na strehi |
| `vidra` | VIDRA E | elektricni | AWD (dva motorja) | `ev` | 4,86 × 1,98 × 1,38 m, 2,92 m | električni fastback: steklena streha, svetlobna pasova spredaj in zadaj, kratek rep, turkizni poudarki |
| `kuna` | KUNA S | mali | FF | `i4`, turbo | 4,28 × 1,86 × 1,42 m, 2,60 m | vroči hečbek s prednjim pogonom: bela streha, temen pokrov s črtama, visoko krilo, okrogli zadnji luči, zlata platišča, vlečni trak |
| `merjasec` | MERJASEC V8 | sportni | FR | `v8` | 4,95 × 2,04 × 1,38 m, 2,90 m | limuzina z V8 za drift: nizka, globoka platišča, kratek rep, štirje izpuhi |
| `tur` | TUR 6x6 | teren | AWD, vseh 6 koles | `v8` | 6,00 × 2,20 × 2,15 m, osi +2,00 / −0,95 / −2,30 m | pickup s tremi osmi: odbijač, snorkel, svetlobni pas, lok in rezervno kolo v kesonu |
| `vran` | VRAN 01 | posebni | AWD | `v8` | 4,8 × 2,2 × 2,0 m, 2,95 m | izvenserijski velik terenec 4x4 s trdo streho: štiri vrata, streha v barvi črte (dvobarvna), svetlobni pas na sprednjem robu strehe nad pokončnim vetrobranskim steklom, zajemalka na ravnem pokrovu, ozka maska med vitkimi lučmi, velike gume na bronastih platiščih pod širokimi črnimi blatniki, ploščat odbijač z vitlom in rdečimi okovi, rezervno kolo nizko na zadnjih vratih pod zadnjim steklom, pragovi. Odgovor uporabnika na `novi-avti-2-unikat` (6. 11. 2026): »Vseh 5. Edino vran zamenjaj avto za 4x4 džipa izvenserijskega.« (namesto prvotnega hot roda); nato v seji: »Vran1 spremeni da ima pokrito streho in da je vecji dzep« (namesto odprtega dvovratnega) |

Številke (moč, masa, cena, izmerjene vrednosti) so v razdelku Stanje, ko je avto narejen.

## Šest koles (TUR 6x6)

Fizika ima dve osi (enoslednji model: prednja os na `+a`, zadnja na `−b`; kolesa, sledi gum, odpadla kolesa in pesto so štirje). TUR zato v fiziki vozi z dvema osema: `b` je zadnja os, pogon `AWD` (moč na obe osi, srednja os vozi z zadnjo), srednja os je samo videz: nov neobvezni ključ izgleda `look.wheels.mid` (x srednje osi) v `js/render.js` doda lok v karoseriji, dve kolesi, ki se vrtita z zadnjima, in sledi gum. Drugi avti se ne spremenijo. Vseh šest koles je gnanih v smislu igre (4x4 z dodatno osjo zadaj, kot pri pravih 6x6 pickupih z gnanima zadnjima osema). Srednji kolesi se ne obračata in ne odpadeta (ob trku se premakneta z zadnjima), karoserija se ob izgubljenem zadnjem kolesu nasloni nanju; preizkus `tests/kit.test.js` (gradnja, slabe vrednosti) in `tests/browser/kit.test.mjs` (srednja os v pravi dirki). Srednja os je 1,35 m pred zadnjo (ne bliže: blazinica dvigala v garaži mora stati 15 cm od gume obeh osi, `tests/browser/garage.test.mjs`). TUR je med petimi avti za drift najdražji tekmec (13,3 tisoč oglišč), zato ima kot TITAN in KAMEN `fieldN: 9` in `fill: ['medved', 'pescenjak']` (v večji dirki 9 TUR-ov, ostali terenci njegovega tempa; proračun `nring` pri 99 tekmecih, po zmanjšanju proračuna v zbirni Grafiki). Risalni klici: srednji kolesi sta vsako svoj model kot ostala štiri (igralec 18, tekmec 11; meja 6x6 v `tests/browser/fleet.test.mjs`). Ne pokrito: misije (`js/missions/kit.js`) skrijejo igralčeva kolesa brez `v.wm` (misije imajo stalne avte brez srednje osi; za misijo s 6x6 dodaj `v.wm || []`), umazanija karoserije na Pikes Peaku pozna samo dve osi.

## Merilo za drift

Avtošola Drift (`js/game.js` `schoolRef` in `driftTick`): 40 s od štarta na avtopilotu, brez tekmecev, suho, serijski avto; točke za kot zdrsa krat hitrost. Isti tek na Spa in Bathurstu primerja avte tam. Orodje: `node tools/novi-avti-2/drift.js <id> …` (ponovi številke iz #361: ŠKORPIJON H 1998 / 202 / 836).

| Primerjava (main, 6. 11.) | Jezero | Spa | Bathurst |
|---|---|---|---|
| ŠKORPIJON H (najboljši na `main`) | 1998 | 202 | 836 |
| ŠAKAL D (#361, drift kupe) | 2059 | 421 | 779 |
| MUSCLE / MODRAS V10 | 1667 | 240 / 176 | 590 / 709 |
| mediana voznega parka | 1175 | 140 | 445 |

Cilj: vsak novi avto na Jezeru blizu vrha (okoli 1900–2100), na Spa in Bathurstu nad mediano in čim bliže vrhu. Zanašanje dajejo `csp` (`tv` velikost zdrsa, `out` počasnejše poravnavanje, `pwr` / `liftP` zasuk s plinom in ob odvzemu, `bx` z zavoro) in oprijem s hitrostjo (`arc.amax`, moč); `spinK` ≤ 0,3 nad 300 W/kg (pravilo voznega parka).

## Postopek

1. Prototipi videza (začasna datoteka, izbrisana, ko so bili avti v igri), slike `node tools/novi-avti-2/slike.mjs [id …]` → `test-results/novi-avti-2/` (zdaj pravi avti): kamera za avtom na Bathurstu s povečanim avtom, stranski in zadnji pogled. Vprašanje `novi-avti-2-videz` (vsi tako / popravki) in `novi-avti-2-unikat` (VRAN 01 v igro ali ne) na strani Odločitve partyslo; delo teče naprej s priporočeno možnostjo, popravki pridejo pozneje.
2. Avti eden za drugim, vsak svoj commit: definicija, seznami (`index.html`, `garaza.html`, `ROSTER` v `tests/fleet.test.js`, opis v `js/lang.js`, števci kategorij v brskalniških testih, `docs/igra.md`, `README.md`), meritve v mejah kategorije, drift.
3. Na koncu: prototipi se izbrišejo (so v avtih; v `tools/novi-avti-2/` ostaneta orodje za drift točke `drift.js` in slike `slike.mjs`), vrstica na koncu `docs/vrsta.md`, sporočilo VSE SEJE 2 z drift točkami po avtih.

## Spori z #361 (`novi-avti/vozila`, ni na `main`)

Obe veji dodajata vozila v iste sezname: `index.html`, `garaza.html`, `js/lang.js`, `tests/fleet.test.js` (`ROSTER`), `tests/browser/cars-ui.test.mjs` in `tests/browser/lang.test.mjs` (števci kategorij, npr. »Športni · 2/7«), `README.md`, `docs/igra.md`, `tests/README.md`, `docs/vrsta.md`, `docs/kazalo.md`. Kdor gre na `main` drugi, pri spoju obdrži vrstice obeh in števce kategorij prešteje znova. Vrstni red v kategorijah (`ord`) je ločen: #361 ima OSA R 6 (mali), ŠAKAL D 7 (sportni), GAMS RH 3 (reli), OREL GT3 7 (dirkalni); ta veja začne višje (mali 8, sportni 9 in 10, elektricni 4, teren 6).

## Stanje

| Avto | Stanje | Moč / masa | 0–100 / končna / bočno / zaviranje 100–0 | Drift Jezero / Spa / Bathurst |
|---|---|---|---|---|
| RIS G | narejen (`js/cars/ris.js`) | 400 kW / 1360 kg (294 W/kg) | 2,88 s / 244 km/h / 2,28 g / 22,8 m | 2213 / 467 / 835 |
| VIDRA E | narejen (`js/cars/vidra.js`) | 480 kW / 2050 kg (234 W/kg) | 2,87 s / 245 km/h / 2,35 g / 24,0 m | 2207 / 449 / 839 |
| KUNA S | narejen (`js/cars/kuna.js`) | 255 kW / 1190 kg (214 W/kg) | 3,28 s / 228 km/h / 2,23 g / 23,9 m | 2251 / 461 / 716 |
| MERJASEC V8 | narejen (`js/cars/merjasec.js`) | 470 kW / 1680 kg (280 W/kg) | 3,25 s / 243 km/h / 2,20 g / 22,8 m | 2208 / 502 / 858 |
| TUR 6x6 | narejen (`js/cars/tur.js`) | 640 kW / 3300 kg (194 W/kg) | 3,47 s / 188 km/h / 2,02 g / 27,1 m | 1985 / 489 / 717 |
| VRAN 01 | narejen (`js/cars/vran.js`), velik zaprt terenec 4x4 namesto hot roda | 500 kW / 2150 kg (233 W/kg) | 2,93 s / 200 km/h / 2,10 g / 24,6 m | 2304 / 696 / 794 |
