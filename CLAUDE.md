# Pravila za nove proge

Veljajo za vsako progo, ki jo dodamo v igro ali izboljšamo (glej tudi razdelek »Nova proga« v `README.md`). Opis vsake proge je v `docs/proge/<id>.md`, seznam prog s povezavami v `README.md` (razdelek »Proge«).

## Ime proge: »kraj, država«
- Vsaka proga se imenuje po kraju in državi, v obliki **»Kraj, Država«** (države v slovenščini): npr. `Vršič, Slovenija`, `Bathurst, Avstralija`, `Štajerska, Avstrija`.
- To velja za polje `name` v `js/tracks/<id>.js`, za angleško ime in opis v `js/lang.js` (angleščina: `Vršič, Slovenia`) in za vse besedilo v `README.md`, `docs/proge/` in `docs/igra.md`.
- Za kraj izberi zemljepisno ime (kraj, prelaz, dolina, regija), ne imena dirkališča, prireditve ali podjetja. `id` ostane kratek in brez presledkov.

## Testne proge: zamrznjene do izbrisa (odločitev uporabnika 3. 11. 2026)
- Testne proge imajo v datoteki proge `test: true` in so v menuju na koncu pod »Za izbris · samo za testiranje«: Jezero Ring, Riviera, Gorski reli, Monte Carlo, Bakreni gozd, Toskana in Gromski rt (izmišljene; Monte Carlo je resnična pot, ki jo je uporabnik 29. 10. 2026 premaknil med testne zaradi pravno spornih imen ovinkov in stavb). Krajša različica resnične poti (npr. Pikes Peak, Ouninpohja) je prava proga, ne testna.
- Izbrišemo jih tik pred objavo na Google Play, skupaj s sklopom 8 orodja za napake (odločitev 29. 10., potrjena 3. 11. 2026). Do takrat so **zamrznjene**, da ne porabljamo žetonov za proge, ki odidejo: nobena seja z nobenega računa jih ne posodablja, ne izboljšuje, ne optimizira in ne popravlja, tudi pri delu »za vse proge« ne (grafika, obremenitev, OpenStreetMap, ljudje ob progi, slike za meni). Izjema je samo izrecna prošnja uporabnika za točno to progo.
- Varovalo `tests/testne-proge.test.js` (na GitHubu in v `npm run test:related` ob spremembi v `js/tracks/`, `docs/proge/`, `assets/` ali `maketa-menija/`) pade, ko se spremeni ali doda datoteka testne proge (`js/tracks/<id>.js`, `docs/proge/<id>.md`, slike, zemljevidi, preleti, glasba; seznam v `tests/golden/testne-proge.json`); izbris je dovoljen. Spremembo vrni; samo ob izrecni prošnji uporabnika `node tests/testne-proge.test.js --dovoli <id> "<prošnja, datum>"`. Enako zamrznjeni so njihovi graditelji v `js/world.js` in vnosi v skupnih datotekah, ki jih varovalo ne vidi.
- Testi, ki gredo čez vse proge (`trackIds` v `tests/lib/sim.js` in `tests/browser/lib.mjs`: golden, races, world, perf, memory, gfx, smoke), testne proge preskočijo; njihovih vrednosti v referencah nihče ne preverja. Za slike pred/po, meritve obremenitve in preverjanje sprememb vzemi pravo progo (z boksi: Bathurst, Avstralija ali Spa, Belgija). Če test pade samo zaradi testne proge, sprememba pa je pravilna za prave proge, referenco ustvari znova z orodji repozitorija ali test prestavi na pravo progo; testne proge ne popravljaj.
- Do izbrisa morata delovati **Jezero** (privzeta proga igre, avtošola: Idealna linija in Drift, kratka proga v testih funkcij) in **Toskana** (podlaga nove mape, NEW VERSION · TEST 1): če skupna sprememba pokvari test funkcije na njiju, popravi skupno kodo, ne proge. Pokala »Domači pokal« in »Kratke proge« sta samo iz testnih prog in odideta z njimi.

## Ena proga na državo (odločitev uporabnika 3. 11. 2026)
- V prihodnje naredimo iz vsake države samo **eno novo progo**. Proge na čakanju po državah in izbire uporabnika: `docs/proge-po-drzavah.md`; seja jo preveri, preden začne novo progo.
- Država, ki že ima progo v igri: nova proga iz nje se dela samo, če jo je uporabnik izbral (vprašanja `ena-proga-<država>` na strani Odločitve). Dokler izbire ni, je ne začni; druge proge iste skupine ali koraka naredi.
- Država brez proge: proge gredo v delo, ko pridejo na vrsto. Prva iz države se naredi, druge iz iste države potem odpadejo.
- Nov načrt prog predlaga največ eno progo na državo in izpusti države, ki progo že imajo.
- **Nove proge so vedno zadnje** (odločitev uporabnika 4. 11. 2026): izdelava novih prog je zadnje delo pred pripravo na Google Play; vsako novo delo, ki pride, gre na vrsto pred njo (proga, ki je že v izdelavi, se dokonča). Vrstni red: `docs/proge-po-drzavah.md`.

## Kamere in grafika (odločitev uporabnika)
- V igri je samo **ena kamera**: **za avtom** (`chase`), na telefonu pokonci in ležeče. Kamere **izometrična**, **kino** in **kokpit** so izbrisane; ne dodajaj jih nazaj. V posnetku dirke sta še TV kamere ob progi in kamera za avtom, foto način ostane.
- Grafiko izboljšuj za kamero za avtom: obzorje, nebo, oddaljeni griči, cesta pred avtom in njeni robovi, teren ob njej. Detajli, ki jih s te kamere ni videti (drobni predmeti na višini oči, notranjosti, majhni napisi, strehe od zgoraj), so odveč: poenostavi jih, da je telefon manj obremenjen.
- **Gledalcev ob cesti na pravih progah je čim manj** (odločitev uporabnika 31. 10. 2026): `fewFans` v `js/world.js` pusti le redke skupine, mirne (brez skakanja); redarji, snemalci (`crowdPut(…, { staff: true })`), mehaniki in tribune ostanejo. Nove proge gledalcev ob cesti ne dodajajo več, kot jih je treba.
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
- Testi (odločitev uporabnika, kombinacija): pred pushem morajo biti lokalno zeleni testi, ki se nanašajo na spremembo (Node in brskalniški; `npm run test:related` jih izbere iz `git diff` proti `main`, hiter vstop v igro `index.html?proga=<id>` je opisan v `tests/README.md`); celotni nabori (Node, brskalniški, vozila) tečejo na GitHubu v pull requestu. Celoten Node nabor lokalno traja okoli 1 h (`races.test.js` presega privzetih 15 min: `TEST_TIMEOUT_MIN=40`). Na `main` gre sprememba, ko so ti zeleni: seja jo **združi sama, brez vprašanja** (odločitev uporabnika 2. 11. 2026: »Združuj vedno sam in ne sprašuj, dokler ne spremeniva tega pravila«; velja za vse seje, dokler ga uporabnik ne spremeni). **Hitro združevanje** (odločitev uporabnika 3. 11. 2026): če je bil pull request na GitHubu že v celoti zelen in ima po spajanju svežega `main` spore samo v žigih ali seznamih testov oziroma kazalu, ga po lokalnih povezanih testih združi brez novega kroga na GitHubu; če `main` po združitvi pade, popravi seja tega pull requesta.
- Pull request, na katerem še delaš, odpri kot osnutek (draft): celotni nabori na GitHubu tečejo, ko ga označiš »Ready for review«, in ob vsakem nadaljnjem potisku (`.github/workflows/tests.yml`). Označi ga, ko je delo končano in so povezani testi lokalno zeleni (odločitev uporabnika 31. 10. 2026).
- Več pull requestov, ki se dotikajo istih datotek (npr. deli KOLIBRIJA), gre na `main` v enem koraku (zbirna veja, en krog testov) ali drug za drugim po dogovoru, nikoli vsi hkrati: vsaka združitev ostalim sproži nov krog testov (odločitev uporabnika 31. 10. 2026).
- Pull request odpri samo, če uporabnik to izrecno prosi, za sklop iz `docs/orodje-za-napake.md` (tam je dovoljen en pull request na sklop oziroma na združen korak; sklop 17 jih ima lahko več) ali ko je delo končano in ga je treba spraviti na `main` (pravilo 2. 11. 2026 zgoraj: združi sam).

## Seje: čakanje in vprašanja (odločitev uporabnika 31. 10. 2026)
- Ko seja čaka na teste na GitHubu, se naroči na dogodke pull requesta (`subscribe_pr_activity`) in konča korak; GitHub jo zbudi. Rezervno preverjanje največ enkrat na 8 h (odločitev uporabnika 3. 11. 2026, prej 4 h); brez zank s `sleep` in brez preverjanj na nekaj minut.
- Hkrati tečeta največ 2 seji, ki pišeta kodo (odločitev uporabnika 2. 11. 2026, prej 5; seje, ki samo čakajo na teste, se ne štejejo). Nove seje zaganja koordinacijska seja »VSE SEJE« ali veriga po svojem načrtu, ko je prostor.
- Vsa vprašanja za uporabnika (tudi koordinacijske seje »VSE SEJE«; združitve na `main` seje ne sprašujejo več, glej Postopek) zapiši na stran Odločitve, z oštevilčenimi možnostmi, da uporabnik samo klikne izbiro (odločitev uporabnika 31. 10. 2026: »v prihodnje mi vedno delaj vprašanja tako, da samo kliknem izbiro«). V pogovoru sprašuj samo, če stran ni dosegljiva. Kako: stran Odločitve svojega računa (vsak račun ima svojo; uporabi prvo dosegljivo s seznama v `docs/vprasanja.md`): `ArtifactData` `set` v zbirko `vprasanja`; id dokumenta je kratko ime (npr. `cp-215`), polja `seja` (naslov seje), `seja_id` (id te seje), `naslov`, `vprasanje`, `moznosti` (`[{k, opis}]`), `priporoceno` (`k`), `slike` (`[{url, opis}]`; sliko naloži v shrambo strani z orodjem Artifact: `url` strani, `asset: true`), `graficno`, po želji `povezave` (`[{opis, url}]`), `stanje` »odprto«, `ustvarjeno` (čas ISO). Uporabnik tapne odgovor in stran ga shrani; sejam sporočil ne more pošiljati. **Seja odgovor prebere sama**: po zapisu vprašanja si s `send_later` nastavi bujenje ob prvem naslednjem 10.50, 14.50 ali 23.20 (po ljubljanskem času), takrat ga prebere z `ArtifactData` `get` (`stanje` »odgovorjeno« ali »posredovano«, `odgovor`, `odgovor_opis`, `opomba` so uporabnikova izbira) in zapiše `prebrano`; brez odgovora se zbudi ob naslednjem času (največ trikrat). Neprebrane odgovore zbiranje sporoči seji (podrobno v `docs/vprasanja.md`, razdelek Odgovor).
- **Zbiranje vprašanj ob 10.30, 14.30 in 23.00** (odločitev uporabnika 3. 11. 2026, do preklica: »Pripravi mi vsa vprašanja … vsak dan vsa za vse seje ob 10.30h, 14.30h in 23.00h, da samo kliknem na izbiro. Pri grafičnih vprašanjih dodaj sliko.«): opravilo po urniku vsak dan zbere vprašanja vseh sej in jih pripravi na strani Odločitve; uporabnik dobi eno obvestilo. Seja vprašanje zapiše na stran takoj in dela naprej (ali konča korak); uporabnika ne sprašuje v pogovoru in ga ne obvešča sproti. **Grafično vprašanje ima vedno slike** (vsaka možnost svojo; kamera za avtom, prava proga). Polja, slike, postopek zbiranja, nastavitev na drugem računu in preklic: `docs/vprasanja.md`.

## Varčevanje z žetoni (odločitev uporabnika 2. 11. 2026)
- Ena tema na sejo. Seja dela samostojno in uporabniku poroča ob koncu ali ob blokadi oziroma odločitvi, ki je res njegova; vprašanja zbere v eno sporočilo (stran Odločitve).
- Model po delu: Opus za zasnovo, nove proge in težke napake; Sonnet za opise, spore in manjše popravke (razen kjer je model določen drugje). Napor ostane, kot je določen v razdelku »Orodje za napake«.
- Lokalno samo `npm run test:related`; uspešnih testov ne ponavljaj.
- Odločitve zapiši enkrat v docs (načrt teme), drugje se samo skliči nanje.
- Podatke nove prave proge pripravi z `tools/proga-podatki.py` (nastavitve v `tools/<id>/config.json`, navodila na vrhu orodja).
- Slike samo, ko so potrebne.
- Hkrati največ 2 vzporedni seji (razdelek »Seje« zgoraj).
- **Dodatno (odločitev uporabnika 3. 11. 2026: »Uporabi vse tvoje predloge 1–8«):**
  - Napor: nova koda, grafika in proge Opus max; rutinsko delo in koordinacija medium (izbira uporabnika 3. 11. 2026, glej Dopolnitev spodaj).
  - Predaja velike seje: ko kontekst seje preseže ~300 tisoč tokenov (`get_session` brez argumentov, `context_usage.used_tokens`) ali je tema končana, seja napiše kratko predajo (v načrt teme v `docs/` ali v sporočilo) in delo nadaljuje nova seja; stara se ustavi (odjavi pull requeste, izbriše svoja opravila po urniku). Za novo delo ne zbujaj starih velikih sej, zaženi novo s kratko predajo.
  - Pull requesti, ki zmanjšajo spore med vejami (npr. žigi šele ob objavi), gredo na `main` pred drugimi.
  - Rezervna preverjanja največ enkrat na 8 h (razdelek »Seje«); ko so testi končani, sejo zbudi GitHub.
  - Več agentov samo za težko delo: ultracode, delovni tokovi z več agenti in pregledi kode z več agenti samo za fiziko in jedro igre (`js/core.js`, `js/render.js`, `js/world*.js`) ter nove proge; ne za dokumente, žige, teste in majhne popravke.
  - Kdo dela kaj: seznam dela vseh računov so odprti pull requesti (tudi osnutki). Pred začetkom nove teme jih preglej (`list_pull_requests`); če nekdo že dela isto, ne začni. Ob začetku dela takoj odpri osnutek z jasnim naslovom.
  - Kratki izpisi: pri testih beri samo vrstice OK/FAIL (`grep`, `tail`); velike izpise shrani v datoteko in v njej išči; opis pull requesta do ~20 vrstic; slike samo za vprašanja in konec dela, obrezane na bistveno, do ~300 KB.
  - Vprašanja samo na stran Odločitve svojega računa, ne v pogovor; zbiranje jih pripravi ob 10.30, 14.30 in 23.00 (`docs/vprasanja.md`).
- **Dopolnitev 3. 11. 2026 (odločitev uporabnika, brez izgube kakovosti):**
  - Rutinsko delo (spajanje `main`, čakanje na teste, združevanje, posredovanje sporočil) čim krajše; nova seja samo za tako delo teče z naporom medium. Max ostane za novo kodo, grafiko in proge.
  - Najprej se izprazni vrsta za `main`, šele potem se začnejo nove verige (gorske skupine, zavite proge); znak da »VSE SEJE«.
  - Kratki pogovori: vsak večji korak je nova seja s kratkim povzetkom namesto ene dolge seje.
  - Manj slik: pri preverjanju grafike 1–2 ključna pogleda namesto serij.
  - Velikih datotek (`js/world.js`, `js/world-pikes.js`, `docs/igra.md`, `tests/README.md`) ne beri v celoti: kazalo in iskanje.
  - Pomožni agenti samo za res ločeno vzporedno delo.
  - Majhne spremembe iste teme v en pull request (en krog testov, ena združitev).
  - Na teste se čaka samo z dogodki GitHuba; brez rednih preverjanj, ko ni nič novega.
  - Seje, ki samo usklajujejo ali posredujejo sporočila, tečejo na modelu Sonnet; kodiranje ostane Opus max.

## Kje je kaj (manj iskanja)
- Najprej poglej `docs/kazalo.md`: datoteke, teme po razdelkih, proge in njihovi graditelji sveta, testi po temah. Velikih datotek (`js/world.js` in `js/world-pikes.js` po ~0,5 MB, `docs/igra.md` 115 KB, `tests/README.md`) ne beri v celoti; poišči ime v kazalu, nato z grepom.
- Ko dodaš ali premakneš kaj, kar je v kazalu, ga posodobi.
- Vprašanja o progah v igri (dolžina, zavitost, kaj je do 60 m ob cesti): najprej `docs/proge-pregled.md` (odločitev uporabnika 3. 11. 2026), šele nato opis proge. Po novi progi zaženi `node tools/proge-pregled.js` in v datoteko dopiši njeno vrstico »Do 60 m ob cesti«.

## Orodje za napake (`docs/orodje-za-napake.md`)
- Načrt, odločitve in sklopi so v `docs/orodje-za-napake.md`. Vsak sklop je svoja seja in svoja veja (`orodje-za-napake/sklop-NN-<ime>`). Ob koncu sklopa posodobi razdelek Stanje v načrtu in uporabniku napiši kratek seznam za preizkus na telefonu.
- Orodje je samo v slovenščini: je v `js/napake.js`, gradi svoj DOM in ne uporablja `tr()`, da ga `tests/lang.test.js` ne zahteva v angleščini.
- Repozitorij je javen: slik napak, zapiskov uporabnika in seznama napak ne shranjuj v repozitorij.
- Poročila o napakah: besedilo `RRA-NAPAKE …` (oblika v načrtu) pove žig različice, progo (`id`), čas, krog in `s` (metri od štarta); `v_krogu=[…]` so imena iz kode (razlaga v kazalu). Napaka iz starejšega žiga je morda že popravljena: commit žiga najde `node tools/stamp.js --find <žig>`, nato preveri `git log` (`v=lokalno`: igra brez žigov, npr. lokalna).
- Če uporabnik pošlje posnetek dirke (`posnetek_<proga>_….rrp`), ga odpri z `node tools/posnetek.mjs <datoteka> [--t <čas>] [--zastavice]` (opis v `tests/README.md`); datoteke ne shranjuj v repozitorij.
- Odločitev uporabnika (26. 10. 2026, v seji, ki je naredila sklop 1): »Vseh 17 sklopov začni sam in ne sprašuj, če lahko začneš naslednjega.« Ko je sklop na `main`, seja brez vprašanja zažene novo sejo za naslednji sklop iz tabele Stanje (model `claude-opus-5-5`) z navodilom »Naredi sklop N po docs/orodje-za-napake.md«. Sklopa 0 in 8 ostaneta odložena, dokler uporabnik ne reče drugače. Uporabnika sprašuj le o odločitvah, ki so res njegove (npr. sprememba zasnove); ustavi verigo, če reče »stop«.
- Odločitev uporabnika (31. 10. 2026, nadomesti prejšnji): vse seje delajo z modelom Opus in naporom **max** (`.claude/settings.json`: `env.CLAUDE_CODE_EFFORT_LEVEL`; `effortLevel` xhigh ostane kot rezerva, ker se max v nastavitvah ne shrani). Samo koordinacijske seje (»VSE SEJE« in seje, ki samo zaganjajo druge seje ali posredujejo sporočila) delajo z naporom **medium**: taka seja si naredi lokalno `.claude/settings.local.json` z `{"env": {"CLAUDE_CODE_EFFORT_LEVEL": "medium"}}` (je v `.gitignore`, velja od naslednjega zagona seje). Spremenljivka ima prednost pred izbiro napora v aplikaciji.
- Odločitev uporabnika (26. 10. 2026): po sklopu 3 in pred sklopom 4 se naredi sklop 3b »Stabilni testi« (opis v načrtu).
- Odločitev uporabnika (27. 10. 2026, »Oboje«): sklopi se združijo in delno tečejo hkrati. Veriga orodja: 5 → 6+7 → 9+10+11 → 12 (združeni sklopi so ena seja in en pull request; po koraku seja zažene naslednji korak verige). Vzporedno v svojih sejah: 14+15, 16, 17 (te po koncu ne zaženejo nove seje). Sklop 13 naredi glavna seja. Podrobnosti v načrtu pod »Pospešitev«.

## Posebne misije (`docs/misije.md`)
- Načrt, odločitve, skupine in stanje so v `docs/misije.md`. Vsaka skupina je svoja seja (»Naredi skupino N po docs/misije.md«), vsaka skupina svoja veja (`misije/skupina-<N>`) in en pull request, ki ga seja odpre sama, ko so testi zeleni, in ga združi sama, ko so zeleni vsi testi na GitHubu.
- Koda misij je v `js/missions.js` in `js/missions/`; v `js/newmap.js`, `js/nvmenu.js` in `js/game.js` samo kratki priklopi. Vprašanja uporabniku v slikah z oštevilčenimi možnostmi.
