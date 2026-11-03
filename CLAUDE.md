# Navodila za seje

Splošna pravila za vsako sejo. Pravila za posamezne dele kode so v `.claude/rules/` in se naložijo sama, ko seja prebere ali uredi ujemajočo datoteko: `grafika.md` (kamera, grafika, gledalci, obremenitev telefona; `js/render.js`, `js/world*.js`, `js/tracks/` …), `meni.md`, `napake.md` (orodje za napake), `misije.md`. Seja, ki dela v drugem delovnem drevesu (git worktree), jih ne dobi sama: prebere jih, ko začne delo na tistem delu.

## Proge
- Ime proge je **»Kraj, Država«** (države v slovenščini, npr. `Vršič, Slovenija`, `Bathurst, Avstralija`, `Štajerska, Avstrija`; angleško v `js/lang.js`: `Vršič, Slovenia`): v polju `name` v `js/tracks/<id>.js`, v `js/lang.js`, `README.md`, `docs/proge/` in `docs/igra.md`. Kraj je zemljepisno ime (kraj, prelaz, dolina, regija), ne ime dirkališča, prireditve ali podjetja. `id` ostane kratek in brez presledkov.
- Opis proge je v `docs/proge/<id>.md`, seznam prog s povezavami v `README.md` (»Proge«), kontrolni seznam za novo ali izboljšano progo v `README.md` (»Nova proga«: angleški prevodi v `js/lang.js`, test po vzoru obstoječih, slika za meni). Podatke nove prave proge pripravi `tools/proga-podatki.py` (nastavitve v `tools/<id>/config.json`, navodila na vrhu orodja).
- **Testne proge** (`test: true`): Jezero Ring, Riviera, Gorski reli, Monte Carlo, Bakreni gozd, Toskana, Gromski rt. So izmišljene ali umaknjene (Monte Carlo je resnična pot, uporabnik jo je 29. 10. 2026 premaknil med testne zaradi pravno spornih imen) in so v meniju na koncu pod »Za izbris · samo za testiranje«. Izbrišemo jih tik pred objavo na Google Play, skupaj s sklopom 8 orodja za napake (29. 10. 2026). **Ne urejaj jih** (ne optimiziraj, ne dodajaj grafike, ne popravljaj), razen če uporabnik izrecno prosi za točno to progo, in jih **ignoriraj**: ne za slike pred/po, ne za meritve obremenitve, ne za preverjanje sprememb (vzemi pravo progo, z boksi npr. Bathurst, Avstralija ali Spa, Belgija). Če test ali referenca kaj zahteva samo zaradi testne proge, sprememba drugih prog pa je pravilna, referenco ustvari znova z orodji repozitorija. Krajša različica resnične poti (Pikes Peak, Ouninpohja) je prava proga.

## Pravna varnost (igra gre na Google Play)
- V igri so samo zemljepisna imena. Brez logotipov, imen podjetij, lokalov, sponzorjev, prireditev in znamk avtomobilov; table in napisi so generični ali izmišljeni.
- **Nikoli imen resničnih oseb** (vozniki, kolesarji, športniki, ustanovitelji …): ne v napisih navijačev na cesti, ne na tablah, ne v imenih ovinkov, ne v komentarju; vedno izmišljena imena. Ovinek, ki je v resnici poimenovan po osebi, podjetju ali lokalu, dobi opisno ime, enako kot v meniju (»Dvojni desni«, »Dolgi desni«, »Ovinek ob pristanišču«; seznam v `maketa-menija/README.md`).
- Podatki so iz OpenStreetMap in javnih višinskih modelov (SRTM, Copernicus DEM, USGS 3DEP …), **nikoli iz Google Maps, Google Earth ali Street View** (ne podatki ne slike). Vsak vir z licenco gre v `README.md` pod »Zasluge« (OSM: ODbL 1.0; izpeljani podatki v datoteki proge so prav tako pod ODbL 1.0).

## Postopek
- Po vsaki spremembi v `js/` ali `css/`: `node tools/stamp.js`; nove reference: `npm run golden:update`.
- Lokalno samo testi, povezani s spremembo: `npm run test:related` (izbere jih iz `git diff` proti `main`); uspešnih ne ponavljaj. Celotni nabori (Node ~1 h, brskalniški, vozila) tečejo na GitHubu; pull request, ki spremeni samo datoteke `.md`, tam požene samo `fleet.test.js` (3. 11. 2026). Hiter vstop v igro (`index.html?proga=<id>`) in testi: `tests/README.md`; najpogostejši ukazi so na vrhu `docs/kazalo.md`.
- Spoj `main` ali druge veje: `node tools/spoji-main.mjs [veja]` — mehanske spore (žigi, kazalo, seznami testov) reši samo, ostale izpiše.
- **Na `main` gre vse z vlakom** (odločitev uporabnika 3. 11. 2026; postopek v `docs/varcevanje.md`, A). Seja s kodo, ko je delo končano in so povezani testi zeleni: spoji svež `main`, potisne vejo, odpre pull request kot osnutek (draft) z razdelkom `## Za vlak` (predaja), koordinaciji pošlje »PR #N je pripravljen za vlak« in **konča**: brez naročanja na dogodke PR, brez rezervnih pregledov, brez čakanja. Koordinacija (»VSE SEJE«) enkrat ali dvakrat na dan spoji pripravljene PR v vejo vlaka, požene en krog celotnih testov in vlak združi sama, brez vprašanja (odločitev 2. 11. 2026: »Združuj vedno sam in ne sprašuj, dokler ne spremeniva tega pravila«). Sejo s kodo zbudi le, če pade njen test ali je spor, ki ni mehanski.
- Na dogodke PR (`subscribe_pr_activity`) se naroči samo koordinacija, za PR vlaka; rezervno preverjanje največ eno, na 4 h; brez zank s `sleep` in brez preverjanj na nekaj minut.
- Pull request odpri samo za delo, ki gre na `main`, za sklop iz `docs/orodje-za-napake.md` ali če uporabnik izrecno prosi.

## Seje
- Ena tema na sejo. Seja dela samostojno in poroča ob koncu ali ob odločitvi, ki je res uporabnikova.
- Hkrati največ 2 seji, ki pišeta kodo (odločitev 2. 11. 2026; seje, ki samo čakajo, se ne štejejo). Nove seje zaganja koordinacija »VSE SEJE« ali veriga po svojem načrtu, ko je prostor.
- **Vprašanja za uporabnika** (tudi koordinacije) samo na strani Odločitve, z oštevilčenimi možnostmi, da uporabnik samo klikne (31. 10. 2026); grafično vprašanje ima vedno slike (vsaka možnost svojo; kamera za avtom, prava proga). Seja vprašanje zapiše takoj in dela naprej (ali konča korak); uporabnika ne sprašuje v pogovoru in ga ne obvešča sproti. Vprašanja vseh sej se zberejo ob 10.30, 14.30 in 23.00 (3. 11. 2026), uporabnik dobi eno obvestilo. Strani računov, polja, slike, zbiranje in preklic: `docs/vprasanja.md`. V pogovoru sprašuj samo, če stran ni dosegljiva. Odgovor pride kot sporočilo »Odgovor uporabnika s strani Odločitve …«.

## Model in napor (odločitve 31. 10., 2. 11. in 3. 11. 2026)
| delo | model | napor |
|---|---|---|
| zasnova, nove proge, težke napake, sklopi orodja za napake, misije | Opus | max |
| opisi, besedila, spori v kodi, manjši popravki | Sonnet | max |
| koordinacija (»VSE SEJE«, vlak), zbiranje vprašanj, seje, ki samo zaganjajo druge seje ali posredujejo sporočila | Sonnet | medium |

Kjer načrt teme določa model (npr. veriga sklopov: `claude-opus-5-5`), velja ta. Napor nastavi okolje, ne repozitorij (`docs/varcevanje.md`, B): okolje Default (seje s kodo) ima spremenljivko `CLAUDE_CODE_EFFORT_LEVEL=max`, okolje Koordinacija `medium`; koordinacija zaganja seje s kodo v okolju Default.

## Varčevanje z žetoni (odločitvi 2. in 3. 11. 2026; `docs/varcevanje.md`)
- Velikih datotek ne beri v celoti (seznam na vrhu `docs/kazalo.md`): najprej poišči ime v kazalu (z grepom, tudi kazalo je veliko), nato v kodi z grepom, nato preberi samo tisti del.
- Izpisi orodij čim manjši (3. 11. 2026, zetoni-3): pri seznamih in branju `fields`, `minimal_output`, `limit`, `kinds`; velik izpis v datoteko (`out_dir`, preusmeritev) in iskanje v njej. Pri CI samo padli posli in zadnjih ~150 vrstic.
- Pomožni agenti, delovni tokovi z več agenti in pregledi z več pregledovalci samo za res vzporedno delo ali tvegano spremembo (fizika, skupna koda sveta, zelo velike spremembe); sicer en pregled (`/code-review` medium ali high) ali nič, kjer spremembo pokrijejo testi.
- Slike samo, ko so potrebne; za lastno preverjanje `deviceScaleFactor: 1` in manjše okno (vsaka slika ostane v kontekstu do konca seje).
- Sredi dolge seje ne menjaj modela; raje nova seja s predajo. Dolgožive seje (koordinacija, zbiranje vprašanj) se enkrat na teden zamenjajo z novimi.
- Odločitve zapiši enkrat v docs (načrt teme), drugje se samo skliči nanje.

## Kje je kaj
- Najprej `docs/kazalo.md`: na vrhu najpogostejši ukazi in velike datoteke, nato datoteke, teme po razdelkih, proge in njihovi graditelji sveta, testi po temah. Ko dodaš ali premakneš kaj, kar je v kazalu, ga posodobi.
- Orodje za napake: `docs/orodje-za-napake.md`. Poročilo `RRA-NAPAKE …` (oblika v načrtu) pove žig različice, progo (`id`), čas, krog in `s` (metri od štarta); `v_krogu=[…]` so imena iz kode (razlaga v kazalu). Napaka iz starejšega žiga je morda že popravljena: preveri `git log`. Posnetek dirke (`posnetek_<proga>_….rrp`) odpri z `node tools/posnetek.mjs <datoteka> [--t <čas>] [--zastavice]` (`tests/README.md`).
- Repozitorij je javen: slik napak, zapiskov uporabnika, seznama napak in posnetkov dirk ne shranjuj vanj.
- Posebne misije: `docs/misije.md`. Meni: `README.md` (»Nov meni«), `maketa-menija/README.md`. Varčevanje in vlak: `docs/varcevanje.md`.
