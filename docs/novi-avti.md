# Novi avti: 5 sodobnih vozil (načrt)

Izbira uporabnika 5. 11. 2026: »5 novih avtov iz sedanjega časa (sodobni, ne klasika)«. Načrt: seja session_01WbgGzuwVYnMe1PqsfUDJyt (račun 3, koordinacija VSE SEJE 2). **Stanje: načrt.** Koda šele po odgovorih uporabnika (vprašanji `novi-avti-izbor` in `novi-avti-videz` na strani Odločitve 3), po #315 in po dogovoru v `docs/vrsta.md`; pred novimi progami (nove proge so vedno zadnje).

## Pravila
- Vsa vozila so izmišljena: ime je žival + splošna oznaka (R, V8, E, D, GT3, RH so oznake vrste ali razreda, ne imena modelov). Brez znamk, logotipov, imen modelov in oseb; nalepke so samo številke in splošni vzorci.
- Oblike ne posnemajo pravih modelov: telo se gradi iz splošnih razmerij razreda (dolžina, višina, nagib stekel), prepoznavni deli (luči, maska, krilo) so izmišljeni. Prototipi v vprašanjih so samo izhodišče; končni model se naredi znova po pravilih KIT (`js/render.js`).
- Nova vozila so v **novih datotekah** `js/cars/<id>.js`. Skupne sezname se spremeni čim manj in samo z dodajanjem na konec (README, razdelek »Novo vozilo«): `index.html`, `garaza.html`, `ROSTER` v `tests/fleet.test.js`, `js/lang.js`, `docs/igra.md` (Vozni park). Obstoječih vozil (npr. `tiger.js`) ne spreminjamo.

## Kaj že imamo (43 vozil, `docs/igra.md` »Vozni park«)
GT3 z motorjem spredaj je TIGER GT, reli avti so LEV R, BURJA R7 in ZMAJ 85, električni hiperavto je STRELA EV, turing limuzina je KOZOROG TC, terenca sta MEDVED 4x4 in SAMUM 4x4, zadnji pogon za drift imata starejša športna avta SOKOL R in KAZE RS. **Manjka sodobno:** vroči hečbek s štirikolesnim pogonom (mali avti imajo prednji pogon, MIŠKA zadnjega), družinski avto z V8, električni terenec ali pickup, sodoben tekmovalni drift kupe in drugi GT3, da ima TIGER GT svoj razred.

## Izbor (priporočeno: možnost 1 vprašanja `novi-avti-izbor`)
Moč je moč v igri (kW, kot v obstoječih vozilih), cena je vrednost v EUR po merilu tabele cen iz #297 (1 kovanec = 1 EUR; vozilo, ki ga ni v tabeli, ima ceno iz `price`, zato tabele v `js/core.js` ne spreminjamo).

| id | Ime | Kategorija | Pogon | Moč | Masa | Cena | Zvok | Zakaj |
|---|---|---|---|---|---|---|---|---|
| `osa` | OSA R | mali | AWD | 320 kW | 1450 kg | 55 000 | `i4`, turbo | sodoben vroči hečbek 4x4; najhitrejši mali avto, na makadamu za LEV R |
| `los` | LOS V8 | sportni | AWD | 520 kW | 2050 kg | 140 000 | `v8`, nizek | družinski karavan z dvoturbo V8: težak, zelo hiter na ravnini, miren; nova vrsta vozila |
| `nosorog` | NOSOROG E | elektricni | AWD (3 motorji) | 620 kW | 3100 kg | 110 000 | `ev`, nizek, šum gum | prvi električni terenec: takoj pospeši, visoko težišče, dober na makadamu in skokih |
| `sakal` | ŠAKAL D | sportni | FR | 560 kW | 1350 kg | 180 000 | `i6`, turbo | sodoben tekmovalni drift kupe: velik zasuk koles, zadaj lahko zanaša; za avtošolo Drift |
| `orel` | OREL GT3 | dirkalni | MR | 410 kW | 1280 kg | 550 000 | `v10`, dirkalni | GT3 z motorjem v sredini; s TIGER GT dirka v mešanem polju razreda GT3 |
| `gams` (namesto ene) | GAMS RH | reli | AWD | 330 kW | 1260 kg | 1 000 000 | `i4`, turbo | sodoben reli avto s hibridom; možnost 2 (namesto OREL) ali 3 (namesto ŠAKAL) |

Videz (vprašanje `novi-avti-videz`): LOS V8 kot **karavan** (priporočeno, dolga streha in strešni nosilci se s kamere za avtom lepo vidijo) ali limuzina; NOSOROG E kot **pickup** (priporočeno, odprt keson s tovorom je viden od zgoraj) ali SUV.

## Fizika (`phys`, cilji za `expect`)
Številke `expect` (t100, vmax, latG, d100) se izmerijo s `tests/fleet.test.js` po izdelavi; cilj je uvrstitev med obstoječa vozila, ne prave vrednosti.
- **OSA R**: t100 med LEV S in LEV R (~2,9–3,3), vmax ~245–255; štirikolesni pogon z več oprijema pri pospeševanju (`tracK` ~1,1), na makadamu (`loose`) slabši od LEV R, boljši od LEV S.
- **LOS V8**: t100 ~2,7–3,1, vmax ~275–290; velika masa, daljše zaviranje (d100 daljši od TIGER GT), nagibanje (`sway` ~1,2), manjši zasuk koles.
- **NOSOROG E**: `ev` (brez menjalnika), t100 ~2,7–3,1, vmax omejen (`vLim` ~200 km/h); visoko težišče (`sway` ~2), na makadamu kot MEDVED 4x4, dobro prenese skoke (`landV`, `landK`), robusten (`dmgK` ~0,8); `len` 5,45 m, `wid` 2,06 m.
- **ŠAKAL D**: zasuk koles (`steerMax`) ~40 % večji od SOKOL R, zadnja kolesa se lažje zavrtijo v prazno (`spinK` > 1), t100 ~3,0–3,4 (omejen z oprijemom), vmax ~250–260; najboljši rezultat v avtošoli Drift.
- **OREL GT3**: veliko aerodinamike (`aero` ~0,00045, meja 0,0005), zavore `brakeK` ~1,4, t100 ~2,7–3,1, vmax ~265–280; motor v sredini: bolj živ pri zavijanju kot TIGER GT. **Izenačitev razreda**: krog z OREL in s TIGER GT na Bathurstu in Spa se razlikuje za največ 1 % (meritev v testu).
- **GAMS RH**: kot LEV R, a močnejši in lažji na izhodu iz ovinka; t100 ~2,3–2,7, na makadamu najboljši v igri.

## Model za kamero za avtom
Kamera za avtom je visoko in daleč (vozilo je na zaslonu majhno), zato štejejo obris, streha, zadek, luči in kolesa, ne drobni detajli. Proračun KIT: avto 1400 / 800 trikotnikov (zunanja lupina / notranji del), kolesa po obstoječih pravilih; notranjost samo preprost sedež in voznik.
- **OSA R**: kratek zadek, velik strešni spojler, široki blatniki, pas luči čez ves zadek, dva izpuha na straneh.
- **LOS V8**: dolga streha s strešnimi nosilci (karavan) ali kratek zadek z robom (limuzina), širok difuzor, štirje izpuhi.
- **NOSOROG E**: keson s tovorom in rezervnim kolesom (pickup) ali visoka streha s košaro (SUV); vrstica luči na strehi, velika kolesa, visoko podvozje, pas luči spredaj in zadaj.
- **ŠAKAL D**: širok paket blatnikov, veliko zadnje krilo, nizek prednji odbijač, nalepke s številko; dim gum je že v igri.
- **OREL GT3**: nizek, dolg, kabina spredaj, zračnik na strehi (viden od zgoraj), veliko krilo s stranicama, številka na strehi in vratih.
- **GAMS RH**: kratek, širok, veliko krilo, blatniki z odprtinami, strešni zračnik, blatni zavesici.
Deli, ki odpadejo (krilo, odbijač, pokrov), dobijo tečaje kot pri obstoječih vozilih. Videz se preveri s `node tools/carshots.mjs <id>` in s kamere za avtom na Bathurstu in Vršiču.

## Zvok
Samo obstoječe vrste zvoka (`SND_KINDS` v `js/core.js`) z lastnimi nastavitvami (`hz`, `loud`, `turbo`), brez nove kode zvoka: OSA R `i4` turbo, LOS V8 `v8` nižji (`hz` ~0,9), NOSOROG E `ev` nižji, ŠAKAL D `i6` turbo, OREL GT3 `v10` višji in glasnejši od MODRAS V10 in SUPERKOMBI, GAMS RH `i4` turbo.

## Tekmeci
- Vsak avto ima svoje polje (`field: ['<id>']`), OREL GT3 pa mešano polje GT3 `field: ['orel', 'tiger']` (polje TIGER GT ostane, kot je, ker `tiger.js` ne spreminjamo).
- NOSOROG E je širok in težak: če se tekmeci na ozkih progah gnetejo, dobi `fieldN` 9 (kot PREDSEDNIK); privzeto polno polje.
- Nastavitve AI (`aiGap`, `aiEdge` …) ostanejo privzete, razen če test dirk pokaže trke ali zaostajanje.

## Garaža in deli
- `parts` po vzoru sorodnega vozila: OSA R po LEV S, LOS V8 po JELEN GT, NOSOROG E po MEDVED 4x4 in JEŽEK E (električni: brez menjalnika in turba), ŠAKAL D po SOKOL R, OREL GT3 po TIGER GT, GAMS RH po LEV R.
- `mounts` (krilo, luči, platišča) po `docs/deli.md` in pregledu možnosti iz #315; barve delov po `deli-barve`.
- Najem, škoda, predali, gume in nagrade po vrednosti (#297) delujejo sami iz `price` in `cat`; če #297 doda nova obvezna polja, jih dobi vsako novo vozilo.

## Prevodi
Imena ostanejo, kot so (tudi v angleščini). Opis (`desc`) vsakega vozila se prevede v `js/lang.js`; kategorije in deli že imajo prevode.

## Testi
- `tests/fleet.test.js`: `ROSTER` (dodati na konec), `expect` iz meritve, deli, ki odpadejo, rezervoar.
- `tests/kit.test.js`, `tests/lang.test.js`, `tests/deli.test.js`, `tests/deli-barve.test.js`.
- Brskalniški: `tests/browser/fleet.test.mjs` (proračun trikotnikov), `cars-ui.test.mjs`, `deli-barve.test.mjs`, `career.test.mjs` (cene in nagrade po #297).
- Nov test: OREL GT3 in TIGER GT v mešanem polju, razlika kroga na Bathurstu in Spa največ 1 %; dirka z NOSOROG E na ozki pravi progi brez gneče.
- Lokalno `npm run test:related`; celoten nabor na GitHubu v pull requestu.

## Obremenitev telefona
- Ob zagonu se naloži samo 5 opisov vozil (~15 KB vsak); model se zgradi, ko je vozilo v dirki.
- Polje 8–10 novih vozil ostane v proračunu (1400 / 800 trikotnikov na vozilo, klici risanja kot pri obstoječih vozilih). Preveri `perf.test.mjs` z dirko novih vozil na Bathurstu: največ klicev in oglišč ne preseže dirke s TIGER GT; obremenitev drugih prog se ne spremeni (reference `tests/golden/perf.json` ostanejo).

## Koraki in ocena
0. **Pogoji**: odgovori uporabnika; #315 na `main`; dogovor z računom 2 (od ned. 8. 11. 10.00 ureja `js/cars/*`, garaža) in z #297 (račun 1, garaža) v `docs/vrsta.md`; nove datoteke se ne prekrivajo, skupne vrstice samo na konec seznamov.
1. Zbirna veja `novi-avti` in osnutek pull requesta »Novi avti: 5 sodobnih vozil« ob začetku dela.
2. Vsako vozilo svoja seja (Opus, napor max), največ 2 hkrati, vsaka v svoji veji iz `novi-avti` (npr. `novi-avti/osa`), nato spoj v zbirno vejo. Na vozilo: model KIT ~2 h, fizika in meritev `expect` ~1,5 h, zvok ~0,5 h, deli in `mounts` ~1 h, prevod, testi in slika ~1 h, skupaj **~6 h** (prvo ~7 h, ker postavi postopek).
3. Skupni del: mešano polje GT3, dirke na pravih progah, `perf.test.mjs`, `docs/igra.md` (Vozni park 43 → 48), README in kazalo, **~3 h**.
4. En pull request, en krog testov na GitHubu; v vrsto po pravilih `docs/vrsta.md`.

Skupaj **~34 h** dela sej (brez čakanja na teste).

## Odločitve uporabnika
- Izbor vozil (`novi-avti-izbor`): čaka na odgovor.
- Videz LOS V8 in NOSOROG E (`novi-avti-videz`): čaka na odgovor.
