# Pravila za nove proge

Veljajo za vsako progo, ki jo dodamo v igro ali izboljšamo (glej tudi razdelek »Nova proga« v `README.md`). Opis vsake proge je v `docs/proge/<id>.md`, seznam prog s povezavami v `README.md` (razdelek »Proge«).

## Ime proge: »kraj, država«
- Vsaka proga se imenuje po kraju in državi, v obliki **»Kraj, Država«** (države v slovenščini): npr. `Vršič, Slovenija`, `Bathurst, Avstralija`, `Štajerska, Avstrija`.
- To velja za polje `name` v `js/tracks/<id>.js`, za angleško ime in opis v `js/lang.js` (angleščina: `Vršič, Slovenia`) in za vse besedilo v `README.md`, `docs/proge/` in `docs/igra.md`.
- Za kraj izberi zemljepisno ime (kraj, prelaz, dolina, regija), ne imena dirkališča, prireditve ali podjetja. `id` ostane kratek in brez presledkov.

## Testne proge: zamrznjene do izbrisa (odločitev uporabnika 3. 11. 2026)
- Testne proge imajo v datoteki proge `test: true`, v menuju so na koncu pod »Za izbris · samo za testiranje«: Jezero Ring, Riviera, Gorski reli, Monte Carlo, Bakreni gozd, Toskana in Gromski rt. Monte Carlo je resnična pot, a je zaradi pravno spornih imen ovinkov in stavb med testnimi. Krajša različica resnične poti (npr. Pikes Peak, Ouninpohja) je prava proga, ne testna.
- Izbrišemo jih tik pred objavo na Google Play, skupaj s sklopom 8 orodja za napake. Do takrat so **zamrznjene**: nobena seja z nobenega računa jih ne posodablja, ne izboljšuje, ne optimizira in ne popravlja, tudi pri delu »za vse proge« ne (grafika, obremenitev, OpenStreetMap, ljudje ob progi, slike za meni). Izjema je samo izrecna prošnja uporabnika za točno to progo. Enako zamrznjeni so njihovi graditelji v `js/world.js` in vnosi v skupnih datotekah, ki jih varovalo ne vidi.
- Varovalo `tests/testne-proge.test.js` (GitHub; `npm run test:related` ob spremembi v `js/tracks/`, `docs/proge/`, `assets/` ali `maketa-menija/`) pade, ko se spremeni ali doda datoteka testne proge (`js/tracks/<id>.js`, `docs/proge/<id>.md`, slike, zemljevidi, preleti, glasba; seznam v `tests/golden/testne-proge.json`); izbris je dovoljen. Spremembo vrni; samo ob izrecni prošnji uporabnika `node tests/testne-proge.test.js --dovoli <id> "<prošnja, datum>"`.
- Testi čez vse proge (`trackIds` v `tests/lib/sim.js` in `tests/browser/lib.mjs`: golden, races, world, perf, memory, gfx, smoke) testne proge preskočijo. Za slike pred/po, meritve obremenitve in preverjanje sprememb vzemi pravo progo (z boksi: Bathurst, Avstralija ali Spa, Belgija). Če test pade samo zaradi testne proge, sprememba pa je pravilna za prave proge, referenco ustvari znova z orodji repozitorija ali test prestavi na pravo progo; testne proge ne popravljaj.
- Do izbrisa morata delovati **Jezero** (privzeta proga igre, avtošola: Idealna linija in Drift, kratka proga v testih funkcij) in **Toskana** (podlaga nove mape, NEW VERSION · TEST 1): če skupna sprememba pokvari test funkcije na njiju, popravi skupno kodo, ne proge. Pokala »Domači pokal« in »Kratke proge« sta samo iz testnih prog in odideta z njimi.

## Ena proga na državo (odločitev uporabnika 3. 11. 2026)
- V prihodnje naredimo iz vsake države samo **eno novo progo**. Proge na čakanju po državah in izbire uporabnika: `docs/proge-po-drzavah.md`; seja jo preveri, preden začne novo progo.
- Država, ki že ima progo v igri: nova proga iz nje se dela samo, če jo je uporabnik izbral (vprašanja `ena-proga-<država>` na strani Odločitve). Dokler izbire ni, je ne začni; druge proge iste skupine ali koraka naredi.
- Država brez proge: proge gredo v delo, ko pridejo na vrsto. Prva iz države se naredi, druge iz iste države potem odpadejo.
- Nov načrt prog predlaga največ eno progo na državo in izpusti države, ki progo že imajo.
- **Nove proge so vedno zadnje** (odločitev uporabnika 4. 11. 2026): izdelava novih prog je zadnje delo pred pripravo na Google Play; vsako novo delo, ki pride, gre na vrsto pred njo (proga, ki je že v izdelavi, se dokonča). Vrstni red: `docs/proge-po-drzavah.md`.

## Kamere in grafika
- V igri je samo **ena kamera**: **za avtom** (`chase`), na telefonu pokonci in ležeče. Kamere izometrična, kino in kokpit so izbrisane; ne dodajaj jih nazaj. V posnetku dirke sta še TV kamere ob progi in kamera za avtom, foto način ostane.
- Grafiko izboljšuj za kamero za avtom: obzorje, nebo, oddaljeni griči, cesta pred avtom in njeni robovi, teren ob njej. Detajli, ki jih s te kamere ni videti (drobni predmeti na višini oči, notranjosti, majhni napisi, strehe od zgoraj), so odveč: poenostavi jih, da je telefon manj obremenjen.
- **Gledalcev ob cesti na pravih progah je čim manj**: `fewFans` v `js/world.js` pusti le redke skupine, mirne (brez skakanja); redarji, snemalci (`crowdPut(…, { staff: true })`), mehaniki in tribune ostanejo. Nove proge gledalcev ob cesti ne dodajajo več, kot jih je treba.
- Obremenitev telefona: proga naj ima do ~300 klicev risanja in ~900 tisoč oglišč, v povprečju in v najbolj obremenjenem trenutku (`tests/golden/perf.json`: `maxCalls`, `maxKverts`; preverja `perf.test.mjs`), nova proga ali izboljšava pa ne sme povečati obremenitve drugih prog.

## Pravna varnost (igra gre na Google Play)
- V igri so samo zemljepisna imena. Brez logotipov, imen podjetij, lokalov, sponzorjev, prireditev in znamk avtomobilov. Table in napisi so generični ali izmišljeni.
- **Nikoli imen resničnih oseb** (vozniki, kolesarji, športniki, ustanovitelji …): ne v napisih navijačev na cesti, ne na tablah, ne v imenih ovinkov, ne v komentarju. Vedno izmišljena imena. Ovinek, ki je v resnici poimenovan po osebi, podjetju ali lokalu, dobi opisno ime, enako kot v meniju (npr. »Dvojni desni«, »Dolgi desni«, »Ovinek ob pristanišču«; seznam v `maketa-menija/README.md`).
- Podatki so iz OpenStreetMap in javnih višinskih modelov (SRTM, Copernicus DEM, USGS 3DEP …). **Nikoli Google Maps, Google Earth ali Street View**, ne njihovih podatkov ne slik.
- Vsak vir z licenco gre v `README.md` pod »Zasluge« (OSM: ODbL 1.0, izpeljani podatki v datoteki proge so prav tako pod ODbL 1.0).

## Meni (`js/menu.js`, `css/menu.css`)
- Naslovnica, izbira načina in izbira proge so nov meni v angleščini (opis v `README.md`, razdelek »Nov meni«). Meni bere progo iz igre (ime »Kraj, Država« razdeli v ime in državo, opis in angleško ime vzame iz `js/lang.js`), zato nova proga v meniju nastopi sama.
- Nova proga potrebuje **sliko za meni**: `assets/tracks/<id>.webp` in `<id>-rain.webp` (maketa terena; izris v `maketa-menija/orodja/`, glej `maketa-menija/README.md`). Zemljevid od zgoraj, prelet in helikopterski posnetek (`js/routes.js`, `assets/maps/`) sta po želji pozneje.
- Meni mora delovati pokonci in ležeče (od 360 × 640 oz. 640 × 360 naprej); po spremembi zaženi `node tests/browser/menu.test.mjs`.

## Postopek
- Žigov (`?v=…`) v repozitoriju ni (odločitev uporabnika 3. 11. 2026): povezave v `index.html` in `garaza.html` so brez njih, doda jih objava strani (`.github/workflows/stran.yml`: `tools/predogled.mjs` vsako drevo označi s `tools/stamp.js`). Po spremembi zaženi `node tools/stamp.js --check` (vsaka povezava kaže na obstoječo datoteko in nima žiga); brez `--check` orodja ne poganjaj (izjemi: `--strip` spodaj, `--find` pri poročilih o napakah). Pri sporu v `index.html` obdrži obe strani brez žigov (žige, ki jih prinese starejša veja, odstrani `node tools/stamp.js --strip`). Za nove reference `npm run golden:update`.
- Dodaj angleške prevode v `js/lang.js` in test za progo po vzoru obstoječih.
- Testi: pred pushem morajo biti lokalno zeleni testi, ki se nanašajo na spremembo (Node in brskalniški; `npm run test:related` jih izbere iz `git diff` proti `main`, hiter vstop v igro `index.html?proga=<id>` je opisan v `tests/README.md`); celotni nabori (Node, brskalniški, vozila) tečejo na GitHubu v pull requestu. Celoten Node nabor lokalno traja okoli 1 h (`races.test.js` presega privzetih 15 min: `TEST_TIMEOUT_MIN=40`).
- Na `main` gre sprememba, ko so ti testi zeleni: seja jo **združi sama, brez vprašanja** (uporabnik 2. 11. 2026: »Združuj vedno sam in ne sprašuj, dokler ne spremeniva tega pravila«; velja za vse seje).
- **Svež main pred združitvijo**: ko je pull request na GitHubu v celoti zelen, spoji svež `main` in poženi lokalne povezane teste. Če spoj ni imel sporov ali so bili spori samo v žigih, seznamih testov ali kazalu, pull request po teh testih združi brez novega kroga na GitHubu; varovalka je krog testov na `main` po združitvi. Ob drugih sporih jih razreši, potisni in počakaj na celoten krog. Pred združitvijo preveri zadnji krog testov na `main` (rdečega najprej popravi); če `main` po združitvi pade, ga popravi seja tega pull requesta.
- Po združitvi ali zaprtju pull requesta poglej zbirko `cakanje` na strani Odločitve in sejam, ki čakajo nanj, pošlji sporočilo (`docs/varcevanje.md`).
- **Pull request odpri ob začetku dela** kot osnutek (draft) z jasnim naslovom: odprti pull requesti (tudi osnutki) so seznam dela vseh računov; pred novo temo jih preglej (`list_pull_requests`) in ne začni, če nekdo že dela isto. Celotni nabori na GitHubu tečejo, ko ga označiš »Ready for review«, in ob vsakem nadaljnjem potisku (`.github/workflows/tests.yml`). Označi ga, ko je delo končano in so povezani testi lokalno zeleni; na pripravljen pull request potisni enkrat na krog popravkov. Majhne spremembe iste teme gredo v en pull request.
- Več pull requestov, ki se dotikajo istih datotek (npr. deli KOLIBRIJA), gre na `main` v enem koraku (zbirna veja, en krog testov) ali drug za drugim po dogovoru, nikoli vsi hkrati: vsaka združitev ostalim sproži nov krog testov. Pull requesti, ki zmanjšajo spore med vejami (npr. žigi šele ob objavi), gredo na `main` pred drugimi; najprej se izprazni vrsta za `main`, šele nato se začnejo nove verige (znak da »VSE SEJE«).

## Seje
- Ena tema na sejo; vsak večji korak je nova seja s kratkim povzetkom namesto ene dolge seje. Seja dela samostojno in uporabniku poroča ob koncu ali ob blokadi oziroma odločitvi, ki je res njegova.
- Hkrati tečeta največ 2 seji, ki pišeta kodo (seje, ki samo čakajo na teste, se ne štejejo). Nove seje zaganja koordinacijska seja »VSE SEJE« ali veriga po svojem načrtu, ko je prostor.
- **Model in napor**: Opus za zasnovo, novo kodo, grafiko, nove proge in težke napake; Sonnet za opise, spore in manjše popravke (razen kjer je model določen drugje). Koda teče z naporom **max** (`.claude/settings.json`). Rutinsko delo (spajanje `main`, čakanje na teste, združevanje, posredovanje sporočil) naj bo čim krajše: seje samo zanj, koordinacija (»VSE SEJE« in seje, ki samo zaganjajo druge seje ali posredujejo sporočila; model Sonnet), zbiranje vprašanj in obvestila (model Haiku) tečejo v okolju »Koordinacija« z naporom medium (`docs/varcevanje.md`).
- **Predaja velike seje**: ko kontekst preseže ~300 tisoč žetonov (`get_session` brez argumentov, `context_usage.used_tokens`) ali je tema končana, seja napiše kratko predajo (v načrt teme v `docs/` ali v sporočilo), delo nadaljuje nova seja, stara se ustavi (odjavi pull requeste, izbriše svoja opravila po urniku). Za novo delo ne zbujaj starih velikih sej. Brez predaje seja pogovor povzame pri ~350 tisoč (`.claude/settings.json`: `env.CLAUDE_CODE_AUTO_COMPACT_WINDOW`); kar mora ostati (odločitve, stanje, poti), sproti zapiši v datoteke, commite ali docs.
- **Čakanje na teste na GitHubu**: naroči se na dogodke pull requesta (`subscribe_pr_activity`) in končaj korak; GitHub sejo zbudi. Ob vmesnem dogodku (del testov zelen, drugi še tečejo) končaj korak z eno vrstico, brez branja dnevnikov. Lokalni testi v ozadju sejo zbudijo sami, zato zanje ne nastavljaj opomnikov. Rezervno preverjanje največ enkrat na 8 h; brez zank s `sleep` in brez rednih preverjanj, ko ni nič novega.
- **Čakanje na drug pull request ali drugo sejo**: vpiši se v zbirko `cakanje` na strani Odločitve svojega računa in končaj korak brez opomnika (`docs/varcevanje.md`); kdor tisti pull request združi ali zapre, ti pošlje sporočilo, zbiranje vprašanj je rezerva. Rezervno preverjanje (največ enkrat na 8 h) samo na računu brez zbiranja.
- **Vprašanja za uporabnika** (tudi koordinacijske seje) zapiši takoj na stran Odločitve svojega računa po `docs/vprasanja.md` (zbiranje jih pripravi ob 10.30, 14.30 in 23.00), z oštevilčenimi možnostmi, da uporabnik samo klikne izbiro, in delaj naprej pri tem, kar od odgovora ni odvisno (ali končaj korak). **Grafično vprašanje ima vedno slike** (vsaka možnost svojo; kamera za avtom, prava proga). Uporabnika ne sprašuj v pogovoru in ga ne obveščaj sproti; v pogovoru sprašuj samo, če stran ni dosegljiva. Stran odgovor samo shrani (sejam ne more pošiljati), zato **seja odgovor prebere sama**: po zapisu vprašanja si s `send_later` nastavi bujenje ob prvem naslednjem 10.50, 14.50 ali 23.20 (po ljubljanskem času), takrat odgovor prebere z `ArtifactData` `get` in zapiše `prebrano`; brez odgovora se zbudi ob naslednjem času (največ trikrat). Neprebrane odgovore zbiranje sporoči seji (`docs/vprasanja.md`, razdelek Odgovor).
- **Več agentov samo za težko delo**: ultracode, delovni tokovi in pregledi kode z več agenti samo za fiziko in jedro igre (`js/core.js`, `js/render.js`, `js/world*.js`) ter nove proge; ne za dokumente, žige, teste in majhne popravke. Pomožni agenti samo za res ločeno vzporedno delo in za pregled sej pri zbiranju vprašanj (njegov kontekst se ne nabira v seji zbiranja; `docs/vprasanja.md`).

## Varčevanje z žetoni (`docs/varcevanje.md`)
- Lokalno samo `npm run test:related`; uspešnih testov ne ponavljaj.
- Odločitve zapiši enkrat v docs (načrt teme), drugje se samo skliči nanje.
- Podatke nove prave proge pripravi z `tools/proga-podatki.py` (nastavitve v `tools/<id>/config.json`, navodila na vrhu orodja).
- Slike samo, ko so potrebne: za vprašanja in ob koncu dela, obrezane na bistveno, do ~300 KB; pri preverjanju grafike 1–2 ključna pogleda namesto serij.
- Kratki izpisi: pri testih beri samo vrstice OK/FAIL (`grep`, `tail`); velike izpise shrani v datoteko in v njej išči; opis pull requesta do ~20 vrstic.

## Kje je kaj (manj iskanja)
- V `docs/kazalo.md` preberi samo razdelek »Na kratko« (prvih 25 vrstic), nato ime poišči z grepom in preberi samo tisti del. Velikih datotek (`js/world.js`, `js/world-pikes.js`, `docs/igra.md`, `tests/README.md`, `README.md`, `docs/kazalo.md`) ne beri v celoti.
- Dokumenti imajo dolge vrstice (do ~4.600 znakov): išči z omejeno okolico, `grep -noE '.{0,150}ime.{0,150}' datoteka`.
- Ko dodaš ali premakneš kaj, kar je v kazalu, ga posodobi.
- Vprašanja o progah v igri (dolžina, zavitost, kaj je do 60 m ob cesti): najprej `docs/proge-pregled.md` (odločitev uporabnika 3. 11. 2026), šele nato opis proge. Po novi progi zaženi `node tools/proge-pregled.js` in v datoteko dopiši njeno vrstico »Do 60 m ob cesti«.

## Orodje za napake (`js/napake.js`, načrt `docs/orodje-za-napake.md`)
- Vsi sklopi so končani; sklopa 0 in 8 ostaneta odložena, dokler uporabnik ne reče drugače.
- Orodje je samo v slovenščini: gradi svoj DOM in ne uporablja `tr()`, da ga `tests/lang.test.js` ne zahteva v angleščini.
- Repozitorij je javen: slik napak, zapiskov uporabnika in seznama napak ne shranjuj v repozitorij.
- Poročila o napakah: besedilo `RRA-NAPAKE …` (oblika v načrtu) pove žig različice, progo (`id`), čas, krog in `s` (metri od štarta); `v_krogu=[…]` so imena iz kode (razlaga v kazalu). Napaka iz starejšega žiga je morda že popravljena: commit žiga najde `node tools/stamp.js --find <žig>`, nato preveri `git log` (`v=lokalno`: igra brez žigov, npr. lokalna).
- Če uporabnik pošlje posnetek dirke (`posnetek_<proga>_….rrp`), ga odpri z `node tools/posnetek.mjs <datoteka> [--t <čas>] [--zastavice]` (opis v `tests/README.md`); datoteke ne shranjuj v repozitorij.

## Posebne misije (`docs/misije.md`)
- Načrt, odločitve, skupine in stanje so v `docs/misije.md`. Vsaka skupina je svoja seja (»Naredi skupino N po docs/misije.md«) in svoja veja (`misije/skupina-<N>`) z enim pull requestom, ki ga seja odpre sama, ko so testi zeleni, in združi sama, ko so zeleni vsi testi na GitHubu.
- Koda misij je v `js/missions.js` in `js/missions/`; v `js/newmap.js`, `js/nvmenu.js` in `js/game.js` samo kratki priklopi.
