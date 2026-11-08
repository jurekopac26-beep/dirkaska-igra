# Nestabilni testi na GitHubu

Naloga Mateja (jure.kopac26) za račun biketraveler, odločitev uporabnika 8. 11. 2026 ob 22.20: testi, ki na GitHubu padejo in ob ponovitvi brez spremembe kode prestanejo. Vzrok in popravek samo v testih in orodjih za teste (koda igre ostane), brez preskakovanja, izklapljanja in rahljanja mej brez meritev. Veja `testi/nestabilni`, osnutek PR #537.

## Analiza (8. 11. 2026)

Krogi `.github/workflows/tests.yml` na `main` in v pull requestih od 1388 do 1832 (~50 krogov z rdečim delom), iz dnevnikov samo vrstice FAIL. Nestabilen je test, ki je padel in je v ponovitvi (attempt 2) ali v naslednjem krogu iste kode prestal. Večina padcev je pri postankih v boksih in radiu, največ v brskalniških delih 3/6 in 4/6.

| Test | Krogi | Vzrok | Stanje |
|---|---|---|---|
| `pitahead` | 1665, 1670, 1702, 1777, 1815 | 1 | popravljeno |
| `slip` | 1620, 1632, 1832 | 1 | popravljeno |
| `hud` | 1739 (`main`), 1777, 1832 | 3 | popravljeno |
| `weather` | 1591, 1832 | 2 | popravljeno |
| `pitswing` | 1632, 1665, 1675 | 2 | popravljeno |
| `boxwarn` | 1632, 1673, 1675 | Trois-Rivières: zanka se konča v 1. krogu, opozorilo prazno (`//`) | naslednja seja |
| `smoke` | 1543, 1673, 1777 | vsakič drug pregled (1777 Vršič, testna proga) | naslednja seja |
| `newver` | 1556, 1591, 1620 | vsi pred #429 (kliki v meniju) | verjetno že popravljeno |
| `pitfight`, `pitreplay`, `forecast`, `pits` | po 2 | | naslednja seja |
| po enkrat | `redflag`, `pitexit`, `pitstats`, `pitsound`, `m06`, `voices`, `fuel`, `wear`, `memory` (teksture 129 → 130), `online`, `online4` (60 s), `rivals`, `shramba` (180 s) | | naslednja seja |

Prejšnji popravki nestabilnih testov na `main`: #317, #404, #429, #443, #445.

## Vzroki in popravki

1. **Dirka na pravih sličicah med koraki** (`slip`, `pitahead`). Test je dirko ustavil, odsimuliral kos (`g.sim(0.4, true)`), jo spet pognal (`g.resume()`) in počakal dve sličici. V njih igra dirko poganja v pravem času z igralčevimi praznimi vhodi, brez plina in volana, in na počasnem stroju je teh korakov več (do 10 na sličico). Meritev `slip` (8 hkrati, 4 jedra): sličice so pognale 14–15 s od 53 s dirke, avto je bil vsakič zadnji (22.), v zavetrju 2–17 od 120 vzorcev (meja je 2). Popravek: dirka ostane ustavljena, HUD in radio tečeta s korakom kosa (`g.hud(0.4)`, kot že `boxwarn` in `pitswing`), sličici se še narišeta. Po popravku: 0 s na sličicah, avto 16.–18., v zavetrju 23–39.
2. **Klic v bokse samo enkrat** (`weather`, `pitswing`). Test je klical v bokse enkrat (`pitWant = true`) in računal, da avto ob zgrešenem uvozu pride krog pozneje. Na Red Bull Ringu se uvoz začne blizu avtopilotove črte: avto prečka črto boksa noter in nazaj (seme 4: ven pri 113,28 s, spet noter pri 114,04 s). Boksni avtopilot avto vrne (`pitCtl` → `pitFree`) in izbriše klic, ki ga je prevzel. Ko se avto ne vrne čez črto, do konca vozi na suhih gumah (krog 1832: krog 6 na suhih gumah, zadnje sporočilo je bilo nasvet boksnega avtopilota). Popravek: test kliče v bokse pred vsakim kosom, dokler avto ni na dežnih gumah, kot igralec, ki krog pozneje spet zavije v bokse. `pitswing` je klical samo v 1. krogu dirke dveh krogov. V padcih avto ni zavil v boks (`in: null`); enkrat je bil na progi varnostni avto kljub `scUsed`, enkrat kazen +5 s. Popravek: štirje krogi, klic do postanka, izhod iz boksa šteje šele po postanku (`repairN`).
3. **Obtičanje brez reševanja** (`hud`). Avtopilot nima vzvratne prestave, dirka rešuje samo tekmece. V vseh treh padcih je avto stal na začetku boksov v Spa (dist 6756–6759) do konca vseh zank (v četrt kroga 0 m). Popravek, kot v `driveToResults`, `boxwarn`, `pitswing` in `pitahead`: zunaj boksov, obtičan ali obrnjen več kot 3 s, »Na progo« (`race.rescue`).

## Ugotovitve za kodo igre (tu ne popravljeno)

- Red Bull Ring, uvoz v boks: avtopilot prečka črto boksa noter, ven in spet noter v ~0,8 s. Igralcu bi boksni avtopilot za trenutek vrnil volan in ga spet prevzel, tekmec pa ob tem izgubi klic (`Race.pitStep`, »an AI car out of the lane«).
- Spa, začetek boksov: avtopilot lahko obtiči ob ograji, kjer se boks loči od proge.

## Preverjanje

- Vsak popravljen test 10-krat, po 4 hkrati (4 jedra, obremenjen procesor).
- `npm run test:related`.
