# Nestabilni testi na GitHubu

Naloga Mateja (jure.kopac26) za račun biketraveler, odločitev uporabnika 8. 11. 2026 ob 22.20: testi, ki na GitHubu padejo in ob ponovitvi brez spremembe kode prestanejo. Vzrok in popravek samo v testih in orodjih za teste (koda igre ostane; izjema je en pogoj v radiu inženirja po odločitvi uporabnika, »Ugotovitve za kodo igre«), brez preskakovanja, izklapljanja in rahljanja mej brez meritev. Veja `testi/nestabilni`, osnutek PR #537.

## Analiza (8. 11. 2026)

Krogi `.github/workflows/tests.yml` na `main` in v pull requestih od 1388 do 1832 (~50 krogov z rdečim delom), iz dnevnikov samo vrstice FAIL. Nestabilen je test, ki je padel in je v ponovitvi (attempt 2) ali v naslednjem krogu iste kode prestal. Večina padcev je pri postankih v boksih in radiu, največ v brskalniških delih 3/6 in 4/6.

| Test | Krogi | Vzrok | Stanje |
|---|---|---|---|
| `pitahead` | 1665, 1670, 1702, 1777, 1815 | 1, 4, napaka v igri | popravljeno (test in igra) |
| `slip` | 1620, 1632, 1832 | 1 | popravljeno |
| `hud` | 1739 (`main`), 1777, 1832, 1910 (#305) | 3 | popravljeno |
| `weather` | 1591, 1832 | 2 | popravljeno |
| `pitswing` | 1632, 1665, 1675 | 2 | popravljeno |
| `pitexit` | 1910 (#305, ponovitev) | zanka `toHand` brez `g.hud`: sporočilo kroga (ZADNJI KROG!) se je pokazalo šele po predaji, čez VOZIŠ TI! | popravljeno v #305 (d442cc9) |
| `boxwarn` | 1632, 1673, 1675 | Trois-Rivières: zanka se konča v 1. krogu, opozorilo prazno (`//`) | naslednja seja |
| `smoke` | 1543, 1673, 1777 | vsakič drug pregled (1777 Vršič, testna proga) | naslednja seja |
| `newver` | 1556, 1591, 1620 | vsi pred #429 (kliki v meniju) | verjetno že popravljeno |
| `pitfight`, `pitreplay`, `forecast`, `pits` | po 2 | | naslednja seja |
| po enkrat | `redflag`, `pitstats`, `pitsound`, `m06`, `voices`, `fuel`, `wear`, `memory` (teksture 129 → 130), `online`, `online4` (60 s), `rivals`, `shramba` (180 s) | | naslednja seja |

Prejšnji popravki nestabilnih testov na `main`: #317, #404, #429, #443, #445.

## Vzroki in popravki

1. **Dirka na pravih sličicah med koraki** (`slip`, `pitahead`). Test je dirko ustavil, odsimuliral kos (`g.sim(0.4, true)`), jo spet pognal (`g.resume()`) in počakal dve sličici. V njih igra dirko poganja v pravem času z igralčevimi praznimi vhodi, brez plina in volana, in na počasnem stroju je teh korakov več (do 10 na sličico). Meritev `slip` (8 hkrati, 4 jedra): sličice so pognale 14–15 s od 53 s dirke, avto je bil vsakič zadnji (22.), v zavetrju 2–17 od 120 vzorcev (meja je 2). Popravek: dirka ostane ustavljena, HUD in radio tečeta s korakom kosa (`g.hud(0.4)`, kot že `boxwarn` in `pitswing`), sličici se še narišeta. Po popravku: 0 s na sličicah, avto 16.–18., v zavetrju 23–39.
2. **Klic v bokse samo enkrat** (`weather`, `pitswing`). Test je klical v bokse enkrat (`pitWant = true`) in računal, da avto ob zgrešenem uvozu pride krog pozneje. Na Red Bull Ringu se uvoz začne blizu avtopilotove črte: avto prečka črto boksa noter in nazaj (seme 4: ven pri 113,28 s, spet noter pri 114,04 s). Boksni avtopilot avto vrne (`pitCtl` → `pitFree`) in izbriše klic, ki ga je prevzel. Ko se avto ne vrne čez črto, do konca vozi na suhih gumah (krog 1832: krog 6 na suhih gumah, zadnje sporočilo je bilo nasvet boksnega avtopilota). Popravek: test kliče v bokse pred vsakim kosom, dokler avto ni na dežnih gumah, kot igralec, ki krog pozneje spet zavije v bokse. `pitswing` je klical samo v 1. krogu dirke dveh krogov. V padcih avto ni zavil v boks (`in: null`); enkrat je bil na progi varnostni avto kljub `scUsed`, enkrat kazen +5 s. Popravek: štirje krogi, klic do postanka, izhod iz boksa šteje šele po postanku (`repairN`).
3. **Obtičanje brez reševanja** (`hud`). Avtopilot nima vzvratne prestave, dirka rešuje samo tekmece. V vseh treh padcih je avto stal na začetku boksov v Spa (dist 6756–6759) do konca vseh zank (v četrt kroga 0 m). Popravek, kot v `driveToResults`, `boxwarn`, `pitswing` in `pitahead`: zunaj boksov, obtičan ali obrnjen več kot 3 s, »Na progo« (`race.rescue`).
4. **Dirka ni bila ponovljiva** (`pitahead`). Test je odprl stran s semenom 17 (`Math.random` strani) in dirko začel iz menija. Dirka je naključna števila jemala iz istega `Math.random` kot narisane sličice, njen začetek pa je tekel na pravih sličicah, zato je bila vsakič druga: igralec je iz postanka prišel 15. ali 20., na koncu je bil 1. ali 3. V približno vsaki drugi dirki po igralčevem postanku ni bilo avta tik pred njim, do 5 s pred njim, ki ga boks v tem krogu še ne čaka, in test ni imel koga izbrati (`A: null`). Popravek: test vozi v testnem načinu igre (`?proga=bathurst&seme=17&t=1`, kot `repro.test.mjs`), v katerem dirka jemlje števila iz svojega semena (`Race opts.repro`), začetek pa se odsimulira ustavljen (`quickRun`). Dirka je vsakič ista, z narisanimi sličicami ali brez in z radiem ali brez: izbran avto (D. Zupan) v 2. krogu pri 187 s, 2,7 s pred igralcem; pri semenih 1 in 2 je bilo takih trenutkov prav tako dovolj. Zraven se igralec ustavi enkrat, kot avti okoli njega: brez postanka je od 3. kroga vodil in pred njim ni bilo nobenega avta. V ponovljivi dirki je test brez popravka igre vsakič padel pri »enkrat«: inženir je stavek ponovil (spodaj, prva ugotovitev); s popravkom je zelen.

## Ugotovitve za kodo igre

- **Radio, avto pred tabo gre v boks** (`aheadRadio` v `js/game.js`; **popravljeno v #537** po odločitvi uporabnika »Kar v #537«, 9. 11. 2026, tabla #382, komentar 6737552977). Ko avto pred igralcem zapelje čez svojo točko uvoza (`pit[1]`), a še ni v boksu (`inPit`, pri Bathurstu do ~16 m), `Race.pitNext` že šteje uvoz v naslednjem krogu (`to` malo pod dolžino kroga). S prošnjo za boks (`pitWant` ali strategija `at`) je `now` spet res. Varovalo `q.to > race.track.len` tega ne ujame, zato inženir »Avto pred tabo (…) gre v tem krogu v bokse.« reče drugič (ključ z naslednjim krogom). Radio teče v vsaki sličici, zato se to v igri zgodi skoraj vsakič, ko avto ne zavije na zadnjem možnem uvozu. `pitahead` to preverja (»enkrat«): v ponovljivi dirki pade vsakič (seme 17: D. Zupan pri 187,5 s in 302,5 s), na `main` redko (krog 1670: `n: 2`, `radioAhead` dvakrat), ker tam test avto večinoma izbere v 3. krogu, na zadnjem uvozu. Popravek: radio molči še prvih `AHEAD.to` (150) m za uvozom (`q.to > race.track.len - AHEAD.to`), kot že 150 m pred njim; ko je avto zunaj asfalta (`pitG`), `pitNext` vrne `null`.

Ostali dve ugotovitvi tu nista popravljeni:

- Red Bull Ring, uvoz v boks: avtopilot prečka črto boksa noter, ven in spet noter v ~0,8 s. Igralcu bi boksni avtopilot za trenutek vrnil volan in ga spet prevzel, tekmec pa ob tem izgubi klic (`Race.pitStep`, »an AI car out of the lane«).
- Spa, začetek boksov: avtopilot lahko obtiči ob ograji, kjer se boks loči od proge.

## Preverjanje

- Vsak popravljen test 10-krat, po 4 hkrati na 4 jedrih (obremenitev ~22): `slip`, `weather`, `hud`, `pitswing` in `pitahead` (s popravkom igre) 10 od 10. Brez popravka igre je `pitahead` v ponovljivi dirki padel 10 od 10.
- `npm run test:related` po spoju svežega `main` (fa35dd65, z #305, #460 in #461): 21 od 21 zelenih (2546 s).
