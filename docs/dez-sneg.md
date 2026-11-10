# Dež in sneg: oprijem in zavore

Načrt teme: fizika za vse proge, svoja seja (Opus, napor max; `CLAUDE.md`, Seje). Vprašanje `dez-sneg-oprijem` na strani Odločitve 1 je zastavila seja »AI po tvoji liniji« (#305), ki je tudi primerjala igro z resničnostjo in drugimi igrami (spodaj).

## Odločitev uporabnika (5. 11. 2026)
- Opažanje: »obcutek imam da dez in sneg premalo drsita za razliko od soncne«.
- Izbira **3 · Precej bolj, bližje resnici**: dež −35 % oprijema v ovinkih (zavore −30 %), zimski asfalt −30 %, makadam s snegom −55 %; zavore povsod sledijo oprijemu kot v resnici.
- Deleži so glede na isto podlago na suhem (zimski asfalt proti suhemu asfaltu, makadam s snegom proti suhemu makadamu). Ledu izbira ne dodaja.

## Zdaj in cilj (`js/core.js`)

| Kaj | Zdaj | Cilj (izbira 3) |
|---|---|---|
| Dež, ovinki (`WET`) | 0,80 | 0,65 |
| Dež, zavore | 0,91 (`0.55 + 0.45 * muSurf`) | 0,70 |
| Zimski asfalt (`Race.cold.gk`) | 0,94 | 0,70 |
| Makadam s snegom (`Race.cold.gk`, `mk`) | 0,74 | 0,45 |
| Zavore na travi, pesku, makadamu, v lužah | najmanj 0,55 suhih (`0.55 + 0.45 * muSurf` v `Car.stepCS`, dvakrat) | po oprijemu podlage (`tr` v `CSSURF`, krat dež in zima) |

## Resničnost in druge igre (deleži suhega asfalta)
- Moker asfalt 67–77, steptan sneg 22–38, led 11–23; zavorna pot se podaljša v istem razmerju, kot pade oprijem.
- Igra zdaj: moker asfalt 80 / zavore 91, zimski asfalt 94 / 97, makadam s snegom 59 / 82; zavore nikjer pod 55. Čas kroga v dežju +7 % (Bathurst, avtopilot), v resnici (F1) +10–21 %.
- Druge igre vrednosti večinoma ne objavljajo. Primeri iz dokumentacije in datotek prog: BeamNG moker asfalt 75 (v drsenju 55), led 40 (v drsenju 20); Assetto Corsa robnik 92, trava 80–88; rFactor 2 makadam 80.
- Viri: [Illinois ECE 101](https://timan.cs.illinois.edu/pdfjs_csintro//static/slides/ECE%20101/Lecture%2023/ECE%20101---Lecture%2023---slide25.pdf), [oprijem trave ob cesti](https://saferroadsconference.com/wp-content/uploads/2016/05/Peter-Cenek-Frictional-Characteristics-Roadside-Grass-Types.pdf), [TriboNet](https://www.tribonet.org/wiki/tire-friction-2/), [koeficient zaviranja](https://tarorigin.com/ARnews/ARnews9-98/0039.html), [BeamNG Ground Models](https://documentation.beamng.com/modding/levels/level_formats/groundmodels/), [Assetto Corsa surfaces.ini](https://site.hagn.io/assettocorsa/modding/tracks/data/surfaces-ini), [rFactor 2](https://docs.studio-397.com/x/lgFDAg).

## Kaj se spremeni drugje
- **Tekmeci:** profil v `Race._prof` (`latA0 *= w; brA0 *= 0.55 + 0.45 * w`) naj sledi istemu pravilu kot avto, sicer v dežju zavirajo prepozno. Preveri, da vsi pridejo do cilja brez vračanja na cesto (`tests/races.test.js`).
- **Gume:** `TYRE_GRIP` (suhe v dežju `1 - 0.38 * w`, dežne do `WET`). Z nižjim `WET` sorazmerno znižaj tudi suhe gume v dežju, da se menjava za dežne še splača (zdaj 0,80 proti 0,62).
- **Kocke in luže:** kocke v dežju (`settMu`) in luže (`CSSURF`) naj ostanejo pod suho podlago in nad snegom.
- **AI po tvoji liniji (#305):** profili so po vremenu (zdaj samo suh Tianmen), sprememba jih ne zadene; za dež bi ga bilo treba izmeriti znova.
- **Reference:** `tests/golden/sim.json` (scenariji v dežju), `tests/golden/races.json`; `npm run golden:update`. Testi vozil na GitHubu.
- **Vreme med dirko** (`docs/vreme-med-dirko.md`, partyslo): gre na `main` za to temo. Ta tema spremeni oprijem pri dani mokroti (`WET`, `TYRE_GRIP`, zavore, profil tekmecev), vreme med dirko pa urnik dežja in mokroto ceste po času (`Race._weather`), videz, zvok in posnetek.

## Postopek
1. Pred spremembo izmeri z istim avtom na pravi progi (npr. Spa): zavorno pot 100→0 km/h in največji bočni pospešek na suhem, v dežju, na zimskem asfaltu in na makadamu s snegom.
2. Spremeni vrednosti (tabela zgoraj) in znova izmeri; razmerja naj bodo v ±3 % cilja. Test razmerij (`tests/oprijem.test.js`) in povezani testi.
3. Preizkus uporabnika na telefonu (predogled `beta/<pr>/`): dirka v dežju in zimska dirka.

## Pogoj za začetek
- **Takoj** (odločitev uporabnika 10. 11. 2026 ob ~23.10 v pogovoru z Matejem: »Dež in sneg, po tvojem »ok« na predogledu. Prestavi na prioritetno«): tema ima prednost pred vsem ostalim delom, ne čaka več, da se izprazni vrsta za `main`. Dela jo biketraveler (Fable 5.2, ena seja); na `main` gre po uporabnikovem »ok« na predogledu, v vrsti takoj za PR, ki so takrat v testih (sprememba spremeni reference vseh prog).
- Po #202 (račun 2, »Fizika vožnje vrnjena na stanje pred spremembami«, osnutek), ki spreminja isti `Car.stepCS`: začni na `main`, ko je #202 združen ali zaprt.

## Stanje
- 5. 11. 2026: odločitev zapisana, tema v `docs/vrsta.md` (»Načrtovano«); dela še ni.
