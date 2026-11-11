# Dež in sneg: oprijem in zavore

Načrt teme: fizika za vse proge, svoja seja (biketraveler, Fable 5.2, ena seja brez delovnih tokov z več agenti; `CLAUDE.md`, Seje). Vprašanje `dez-sneg-oprijem` na strani Odločitve 1 je zastavila seja »AI po tvoji liniji« (#305), ki je tudi primerjala igro z resničnostjo in drugimi igrami (spodaj). Izvedba: osnutek #647 (veja `fizika/dez-sneg`, oznaka `predogled`).

## Odločitev uporabnika (5. 11. 2026)
- Opažanje: »obcutek imam da dez in sneg premalo drsita za razliko od soncne«.
- Izbira **3 · Precej bolj, bližje resnici**: dež −35 % oprijema v ovinkih (zavore −30 %), zimski asfalt −30 %, makadam s snegom −55 %; zavore povsod sledijo oprijemu kot v resnici.
- Deleži so glede na isto podlago na suhem (zimski asfalt proti suhemu asfaltu, makadam s snegom proti suhemu makadamu). Ledu izbira ne dodaja.

## Prej in zdaj (`js/core.js`)

| Kaj | Prej | Zdaj (izbira 3) |
|---|---|---|
| Dež, ovinki in speljevanje (`WET`) | 0,80 | 0,65 |
| Dež, zavore (`WET_BRK`) | 0,91 (`0.55 + 0.45 * muSurf`) | 0,70 |
| Zimski asfalt (`COLD.road`, `Race.cold.gk`) | 0,94 (zavore 0,97) | 0,70 (zavore 0,70) |
| Makadam s snegom (`COLD.snow`, `Race.cold.gk`, `mk`) | 0,74 (zavore 0,90) | 0,45 (zavore 0,45) |
| Suhe gume na mokri cesti (`TYRE_GRIP.dry`, `TYRE_BRK.dry`) | 0,62 (zavore 0,83) | 0,50 (zavore 0,55) |

## Izvedba (11. 11. 2026, #647)
- **Suha cesta je do številke enaka** (`CLAUDE.md`, »Fizika vožnje se ne spreminja«): vreme je na avtu v predmetu `Car.wx` = { `k`, `b`, `w`, `r`, `rb` } (delež vremena pri oprijemu `c.wet`, pri zavorah, voda pod avtom, delež samih padavin pri obojem); na suhi poletni cesti je točno 1, 1, 0, 1, 1 in vsi računi se množijo z 1. Dokaz: `tests/golden.test.js` 140/140 scenarijev enakih, v `tests/golden/races.json` se spremenijo samo dirke v dežju (20 ključev `/rain` pravih prog in prog na odločanju), 80 ostalih je enakih.
- **Zavore:** `fb ∝ (0.55 + 0.45 · oprijem podlage kot na suhem) · delež vremena` (`Car.stepCS` in nova fizika, prikolice `tlWxB`). Delež vremena pri zavorah je `Car.wx.b` (dež 0,70, zima kot oprijem) krat sneg na makadamu mešane etape. Vsaka podlaga torej v dežju in pozimi obdrži isti delež svojih suhih zavor. Vrstica iz prvotnega načrta »zavore na travi, pesku in makadamu po oprijemu podlage tudi na suhem« **ni izvedena**, ker bi spremenila suho vožnjo (odločitev uporabnika 9. 11. 2026 ob ~23.05).
- **Zima in padavine skupaj** (v novem meniju izbira Snow = zima + padavine): na asfaltu se deleža množita (0,70 × 0,65 = 0,46, zavore 0,49). **Sneg na snegu se ne množi:** cesta, ki je že zasnežena (makadamska cesta pozimi: `Race.cold.rk` 0; makadam mešane etape: kolesa brez deleža padavin, `snowK / wx.r`), ostane pri 0,45, tudi ko sneži. Razlog: pri zmnožku 0,29 avti z zadnjim pogonom na vzponu makadamskega Pikes Peaka obtičijo (avtopilot: FORMULA ORKAN 5 in STREGA MR 4 vrnitve na cesto, 9,6–11 min namesto 3,5); s pravilom vsi pogoni pridejo na vrh brez vračanja. Profil tekmecev upošteva isto (`Race._prof`, `Track.speedProfile(…, snow, snowB)`).
- **Gume** (dirkališča z boksi): suhe gume na mokri cesti izgubijo polovico oprijema in 45 % zavor (`TYRE_GRIP.dry`, `TYRE_BRK.dry`), dežne v dežju dajo deleža dežja (0,65 in 0,70), dežne na suhem kot prej (0,90 in 0,955). Prag menjave `tyreFor` (0,3) in pragi AI za bokse so nespremenjeni.
- **Tekmeci:** profil hitrosti po istih deležih (ovinki po oprijemu `wst.profW`, zavore po deležu zavor `Race.wxB`); policija in varnostni avto dobita isto vreme kot dirkači (varnostni avto prej ni imel zime).
- **Kocke in luže:** vrednosti v `CSSURF` in `settMu` (0,78) so nespremenjene, množijo se z novim deležem dežja: mokre kocke in luža ostanejo pod svojo suho podlago in nad snegom (test).
- **Medalje v dežju** (zlata = serijski reli avto na avtopilotu × 1,01, srebrna × 1,06, bronasta × 1,14): prave etape so izmerjene znova: Bâlea 156/164/177, Los Caracoles 350/368/396, Chapman's Peak 151/159/171, Harju 109/114/123, Katu-Jaryk 160/168/180, Rio do Rastro 212/222/239, Tianmen 242/254/273; razredi Pikes Peaka (`PK_MED_WET`, `PK_MED_G_WET` v `js/game.js`) po vožnjah najhitrejših avtov razredov. **Zamrznjene proge** (testne, na odločanju, Medvode, Irohazaka) obdržijo stare čase v dežju: datotek ne spreminjamo, zlata je tam v dežju za serijski reli avto težje dosegljiva (avtopilot je ~10 % nad njo, bronasta ostane dosegljiva).
- **Test:** `tests/oprijem.test.js` (avto, kot ga obleče dirka prave proge, na ravnini s podlago te proge: deleži v ±3 % izbire, na suhem točno 1; `--meritve` izpiše tabelo, z `GAME_ROOT` tudi za drugo različico igre), `tests/weather.test.js` (zima, gume), meje dežja v testih prog (Katu-Jaryk, Crystal Palace), deleža v brskalniku (`browser/atmos.test.mjs`: zimska nočna dirka, `browser/smoke.test.mjs`: Spa v dežju).

## Meritve (reli avto BURJA R7 na ravnini; delež proti isti podlagi na suhem)

| Podlaga in vreme | Bočni pospešek g (delež) | Zavore g (delež) | 100–0 km/h | 0–100 km/h |
|---|---|---|---|---|
| Asfalt, suho (prej = zdaj) | 2,37 | 1,61 | 23,9 m | 2,87 s |
| Asfalt, dež: prej | 1,90 (0,80) | 1,47 (0,91) | 26,0 m | 3,63 s |
| Asfalt, dež: zdaj | 1,54 (0,65) | 1,13 (0,70) | 32,8 m | 4,53 s |
| Zimski asfalt: prej | 2,23 (0,94) | 1,57 (0,97) | 24,5 m | 3,07 s |
| Zimski asfalt: zdaj | 1,66 (0,70) | 1,13 (0,70) | 32,8 m | 4,18 s |
| Zimski asfalt, sneži: prej | 1,79 (0,75) | 1,43 (0,89) | 26,5 m | 3,87 s |
| Zimski asfalt, sneži: zdaj | 1,08 (0,46) | 0,79 (0,49) | 44,7 m | 6,67 s |
| Suhe gume na mokri cesti: prej | 1,47 (0,62) | 1,34 (0,83) | 28,2 m | 4,76 s |
| Suhe gume na mokri cesti: zdaj | 1,19 (0,50) | 0,89 (0,55) | 40,5 m | 6,01 s |
| Makadam, suho (prej = zdaj) | 1,90 | 1,48 | 23,4 m | 4,12 s |
| Makadam, dež: prej | 1,52 (0,80) | 1,36 (0,92) | 25,1 m | 5,48 s |
| Makadam, dež: zdaj | 1,24 (0,65) | 1,04 (0,70) | 31,1 m | 7,29 s |
| Makadam s snegom: prej | 1,41 (0,74) | 1,33 (0,90) | 25,6 m | 6,08 s |
| Makadam s snegom: zdaj (enako, ko sneži) | 0,86 (0,45) | 0,67 (0,45) | 43,2 m | 13,37 s |

Vožnje na avtopilotu (isti avto; brez stene in vračanja na cesto):

| Vožnja | Suho | Dež: prej → zdaj | Zima: prej → zdaj | Zima, sneži: zdaj |
|---|---|---|---|---|
| Krog Spa (sam) | 155,1 s | 165,2 s (+6,6 %) → 179,6 s (+15,8 %) | 157,6 s (+1,6 %) → 175,0 s (+12,8 %) | |
| Dirka Spa, zmagovalec (13 avtov, 2 kroga) | 309,4 s | 332,3 s → 360,4 s (+16,5 %) | → 350,2 s (+13,2 %) | 430,7 s (+39 %) |
| Katu-Jaryk (makadam) | 132,1 s | 142,8 s (+8,1 %) → 158,3 s (+20,0 %) | 147,3 s (+11,5 %) → 194,0 s (+47 %) | 194,0 s |
| Pikes Peak, makadam | 199,0 s | 222,7 s → 252,1 s (+26,7 %) | → 318,1 s (+60 %) | 318,1 s |

Dirke v dežju na vseh 20 progah (`tests/races.test.js`): vsi avti pridejo do cilja brez vračanja na cesto, zmagovalec je 15–21 % počasnejši kot na suhem (makadam Pikes Peaka 27 %), prej 6–12 %.

## Resničnost in druge igre (deleži suhega asfalta)
- Moker asfalt 67–77, steptan sneg 22–38, led 11–23; zavorna pot se podaljša v istem razmerju, kot pade oprijem.
- Igra prej: moker asfalt 80 / zavore 91, zimski asfalt 94 / 97, makadam s snegom 59 / 82; zavore nikjer pod 55. Čas kroga v dežju +7 % (Bathurst, avtopilot), v resnici (F1) +10–21 %. Zdaj: moker asfalt 65 / 70, zimski asfalt 70 / 70, zasnežen asfalt 46 / 49, makadam s snegom 36 / 42 (0,45 svojega suhega makadama); krog v dežju +16 %.
- Druge igre vrednosti večinoma ne objavljajo. Primeri iz dokumentacije in datotek prog: BeamNG moker asfalt 75 (v drsenju 55), led 40 (v drsenju 20); Assetto Corsa robnik 92, trava 80–88; rFactor 2 makadam 80.
- Viri: [Illinois ECE 101](https://timan.cs.illinois.edu/pdfjs_csintro//static/slides/ECE%20101/Lecture%2023/ECE%20101---Lecture%2023---slide25.pdf), [oprijem trave ob cesti](https://saferroadsconference.com/wp-content/uploads/2016/05/Peter-Cenek-Frictional-Characteristics-Roadside-Grass-Types.pdf), [TriboNet](https://www.tribonet.org/wiki/tire-friction-2/), [koeficient zaviranja](https://tarorigin.com/ARnews/ARnews9-98/0039.html), [BeamNG Ground Models](https://documentation.beamng.com/modding/levels/level_formats/groundmodels/), [Assetto Corsa surfaces.ini](https://site.hagn.io/assettocorsa/modding/tracks/data/surfaces-ini), [rFactor 2](https://docs.studio-397.com/x/lgFDAg).

## Povezano delo drugih tem
- **AI po tvoji liniji (#305):** profili so po vremenu (zdaj samo suh Tianmen), sprememba jih ne zadene; za dež bi ga bilo treba izmeriti znova.
- **Vreme med dirko** (`docs/vreme-med-dirko.md`, partyslo): gre na `main` za to temo. Ta tema spremeni oprijem pri dani mokroti (`WET`, `TYRE_GRIP`, zavore, profil tekmecev), vreme med dirko pa urnik dežja in mokroto ceste po času (`Race._weather`), videz, zvok in posnetek.
- **Nove proge (#569 z #494):** kdor pride na `main` drugi, po spoju znova ustvari reference dirk v dežju (`node tests/races.test.js --update`, stare vnose testnih prog vrni iz prejšnje datoteke) in izmeri čase medalj v dežju novih etap; zimske proge severa (privzeta zima) tudi čase na suhem.
- **Misije** (2.0, delo ustavljeno): misiji 37 in 48 tečeta v dežju; testi so zeleni, časi niso uglaševani na novo.

## Odprto (vprašanja na strani Odločitve 1, zapisana 11. 11. 2026)
- `dez-sneg-predogled`: **odgovorjeno** 11. 11. 2026 ob ~10.45, dobesedno »Dez in sneg ok« (prek Mateja, tabla #382, komentar 6792538229): izbira ostane, kot je (brez blažjega snega na asfaltu, blažje izbire 2 ali še več drsenja).
- `dez-sneg-testne-proge`: testi petih testnih prog (`tests/sani.test.js`, `palomar`, `baldy`, `hotham`, `rio`) preverjajo stare čase in meje v dežju in s spremembo padejo (Sani Pass 251,3 s proti zlati 223, Palomar 293,0 / 267, Mount Baldy 263,2 / 239, Mount Hotham 221,2 / 203 in dirka +18,8 %, Rio de Janeiro dirka +17,7 % z eno vrnitvijo na cesto); varovalo `tests/testne-proge.test.js` njihovih datotek ne pusti spreminjati brez izrecne prošnje uporabnika (`--dovoli`). Do odgovora ostane #647 osnutek: celoten Node nabor na GitHubu brez tega ni zelen (teh pet testov; vsi drugi so lokalno zeleni).
- `dez-sneg-zima-medalje`: kronometer pozimi nima svojih medalj in lestvic (deli jih s poletjem, ko sneži, pa z dežjem); po novem je zimska vožnja 13–60 % počasnejša, zato poletni časi pozimi niso dosegljivi. Priporočilo: zimske medalje in lestvice s temo »Zima na severu« (severne proge imajo zimo privzeto in jih potrebujejo v vsakem primeru). Ne zadržuje te teme.

## Vrsta in `main`
- Tema ima prednost pred vsem ostalim delom (odločitev uporabnika 10. 11. 2026 ob ~23.10 v pogovoru z Matejem: »Dež in sneg, po tvojem »ok« na predogledu. Prestavi na prioritetno«). Na `main` gre po uporabnikovem »ok« na predogledu, v vrsti takoj za PR, ki so takrat v testih (sprememba spremeni reference dirk v dežju vseh prog), pred #246 in progami. Na `main` gre sam: po posodobljenem načrtu (potrdil uporabnik 11. 11. 2026 ob ~11.25; Matej, tabla #382, komentar 6793233105) je #647 prvi v vrsti (~12. 11.), garaža pa ima svoj PR (#653, po njenem »ok«); prejšnja odločitev o eni zbirni veji z garažo (10. 11. 2026 ob ~23.30) ne velja več.
- Preizkus uporabnika na telefonu (predogled `beta/647/`): dirka v dežju in zimska dirka na pravi progi; slike »zdaj in potem« in graf so pri vprašanju `dez-sneg-predogled`.

## Stanje
- 5. 11. 2026: odločitev zapisana, tema v `docs/vrsta.md` (»Načrtovano«); dela še ni.
- 11. 11. 2026: izvedeno v #647 (osnutek z oznako `predogled`): fizika, test `tests/oprijem.test.js`, reference dirk v dežju, medalje v dežju pravih etap in razredov Pikes Peaka, dokumenti. Lokalno zeleni: povezani testi (58: Node in brskalniški, `npm run test:related`) in širši niz 67 brskalniških testov, ki se dotikajo dežja ali zime (`browser/aipits.test.mjs`, suha dirka, je v nizu enkrat padel ob polno obremenjenem stroju; sam je zelen na veji in na `main`); rdečih ostaja pet testov testnih prog iz celotnega Node nabora (vprašanje `dez-sneg-testne-proge`). Odprta so tri vprašanja zgoraj. Na `main` šele po uporabnikovem »ok«.
- 11. 11. 2026 ob ~5.30: **seja teme stoji** po pravilu »Med čakanjem na »ok« naprej« (`CLAUDE.md`, Seje; odločitev uporabnika 11. 11. 2026 ob ~04.40); odgovore na vprašanja prebere ob 10.50, 14.50 in 23.20, sicer jo zbudi zbiranje. **Predaja** (za to ali novo sejo): veja `fizika/dez-sneg` je na svežem `main` brez sporov. Po uporabnikovem »ok« (`dez-sneg-predogled`): (1) spoji svež `main` (`node tools/spoji-main.mjs`); če so medtem na `main` prišle nove proge ali etape, znova ustvari reference dirk v dežju in izmeri medalje v dežju novih etap (»Povezano delo drugih tem«); (2) izvedi odgovor `dez-sneg-testne-proge` (`node tests/testne-proge.test.js --dovoli <id> "<prošnja, datum>"` samo z uporabnikovim dovoljenjem; brez njega pet testov ostane rdečih in PR osnutek); (3) `npm run test:related`; (4) z Garažo v eno zbirno vejo in en krog testov, vrstica 10.10a v `docs/vrsta.md`. Ob drugi izbiri na predogledu (blažji sneg na asfaltu, blažja izbira 2, še več drsenja) se spremenijo samo `WET`, `WET_BRK`, `COLD` oziroma delež sneženja v `js/core.js` (»Prej in zdaj«), meje v `tests/oprijem.test.js` in `tests/weather.test.js`, deleža v `browser/atmos.test.mjs` in `browser/smoke.test.mjs`, medalje v dežju pravih etap in reference dirk v dežju; nato nov predogled in novo vprašanje.
- 11. 11. 2026 ob ~12.20: **uporabnikov »ok«** (zgoraj, »Odprto«). Seja teme nadaljuje na Opusu (Fable porabljen; tabla #382, komentar 6793128643): spojen svež `main` (spor samo v `docs/kazalo.md`; `main` je prinesel samo dokumente, zato reference dirk v dežju in medalje ostanejo, kot so), povezani testi in `node tools/stamp.js --check` lokalno zeleni; #647 je prvi v vrsti (vrstica 10.10a v `docs/vrsta.md`) in Ready for review. **Predaja:** čaka še odgovor `dez-sneg-testne-proge` (branje ob 14.50, sicer zbiranje); nato korak (2) iz predaje zgoraj, `npm run test:related`, en potisk, celoten krog na GitHubu in združitev, ko je zelen in prvi v vrsti (svež `main`, povezani testi; svojo vrstico v vrsti izbriši).
