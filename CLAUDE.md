# Pravila (vse seje vseh treh računov)

Kratka pravila. Podrobnosti, citati odločitev uporabnika, datumi, številke komentarjev in PR ter zgodovina so v `docs/odlocitve.md` (razdelki kot tu); podrobnosti tam veljajo, novejša odločitev pred starejšo. Proga: opis v `docs/proge/<id>.md`, seznam v `README.md` (»Proge«, »Nova proga«).

## Ime proge: »Kraj, Država«
- Ime je »Kraj, Država« (države v slovenščini, npr. `Bathurst, Avstralija`): `name` v `js/tracks/<id>.js`, angleško ime in opis v `js/lang.js` (`Vršič, Slovenia`), vse besedilo v `README.md`, `docs/proge/` in `docs/igra.md`.
- Kraj je zemljepisno ime (kraj, prelaz, dolina, regija), ne dirkališče, prireditev ali podjetje. `id` je kratek, brez presledkov.

## Testne proge
- Testne proge (`test: true`, seznam `tests/golden/testne-proge.json`, v meniju na koncu) in proge na odločanju (`pending: true`) so **zamrznjene** do izbrisa testnih pred izidom (ob zamrznitvi 23. 12. 2026) oz. do izbire: nobena seja jih ne posodablja, izboljšuje, optimizira ali popravlja, tudi pri delu »za vse proge« ne (grafika, obremenitev, OSM, ljudje ob progi, slike za meni), ne njihovih graditeljev in vnosov v skupnih datotekah (tudi Vršičevih delov v `js/world-vrsic.js`; skupni pomočniki gorskih cest niso zamrznjeni). Izjema: izrecna prošnja uporabnika za točno to progo. Že zamrznjene so tudi Suzuka in Irohazaka (testni) ter Medvode (na odločanju), preden dobijo oznako.
- **Urejaj samo prave proge**: »za vse proge« in »uredi vse proge« pomeni proge brez `test` in `pending`.
- Varovalo `tests/testne-proge.test.js` (`npm run test:related` ob spremembi v `js/tracks/`, `docs/proge/`, `assets/`, `maketa-menija/`) pade ob spremembi ali novi datoteki testne proge; izbris je dovoljen. Spremembo vrni; samo ob izrecni prošnji uporabnika `node tests/testne-proge.test.js --dovoli <id> "<prošnja, datum>"`.
- Testi čez vse proge (`trackIds`) testne preskočijo. Za slike pred/po, meritve in preverjanje vzemi pravo progo z boksi in tribunami (Spa, Belgija). Če test pade samo zaradi testne proge, ustvari referenco znova z orodji repozitorija ali test prestavi na pravo progo.
- Proge na odločanju ostanejo v igri in testih (v meniju za pravimi, z oznako PENDING; varovalo jih ne preverja). Do izbrisa morata delovati **Jezero** (privzeta proga, avtošola, testi funkcij) in **Toskana** (nova mapa). Kar od tega pokvari skupna sprememba, popravi v skupni kodi, ne v progi. Pokala »Domači pokal« in »Kratke proge« odideta s testnimi progami. Misije na testnih progah ostanejo, dokler jih uporabnik ne uredi.

## Ena proga na državo
- Iz vsake države samo **ena** nova proga (čakanje in izbire: `docs/proge-po-drzavah.md`, preveri pred novo progo). Nov načrt predlaga največ eno progo na državo in izpusti države s progo. Država brez proge: prva proga se naredi, druge iz države odpadejo. Država s progo v igri: nova samo po izbiri uporabnika (vprašanja `ena-proga-<država>`); do izbire je ne začni, druge proge skupine ali koraka naredi.
- Država z dvema ali več progami brez izbire je **na odločanju**: vse njene proge dobijo `pending: true` (tudi tista, ki je že v delu), novih prog iz nje ne delamo. Po izbiri izbrana postane prava, ostale dobijo `test: true`.
- Stanje: prave ostanejo Pikes Peak (ZDA), Rio do Rastro (Brazilija), Bathurst (Avstralija), Hakone (Japonska), Montréal (Kanada), Chapman's Peak (Južna Afrika) in Harju (Finska, dokler Koli ni na `main`); na odločanju so Medvode (do uporabnikovih risb cest; ne šteje med 70), Crystal Palace in London, Marrakesh in Dadès; ostale proge teh držav so testne (tudi Vršič, Ouninpohja, Suzuka, Irohazaka). Kdo doda oznake: `docs/odlocitve.md`.
- **Sever v snegu**: Norveška, Švedska, Danska in Finska imajo zimo za privzeto vreme (poletje je izbira); nova finska proga je Koli, zimska. `docs/proge-po-drzavah.md`, »Sever v snegu« in »Finska: Koli«.
- **Nove proge za 1.0** (`docs/proge-po-drzavah.md`, »Nove proge za 1.0«): dolge 1–5 km, ovinkaste, z malo ravninami in čim več zanimivega do 60 m ob cesti. Seznam pred delom potrdi uporabnik; nobena nova proga (tudi s čakanja) se ne začne pred njegovim odgovorom.
- **Izletna cona**: proga z ograjo, zidom, hišami ali prepadom do ~3 m od roba asfalta na več kot pol dolžine se ne začne (proga v PR se samo javi; merilo v `docs/proge-po-drzavah.md`). Izjema so **mestne proge** po središču velikih mest: kratke (spodnji del 1–5 km), po širokih ulicah, nabrežjih in trgih, z ograjami, z generičnimi stavbami brez pravno spornih imen in podob.
- **Padec čez rob samo na Killarju** (ureja tema Trki): drugod, tudi na novih progah, ograja (vidna ali nevidna) prepreči padec, dokler uporabnik ne reče drugače.

## Mejniki do izida
- Cilj 1.0: **70 pravih prog** in **50 avtov**. Do 23. 12. 2026 vseh 70 na `main` (`docs/vrsta.md`, »Različica 1.0«); od 23. 12. samo popravki, proge in dodelava; 15. 1. 2027 kandidat; 1. 2. 2027 izid.

## Kamere in grafika
- Samo kamera **za avtom** (`chase`), pokonci in ležeče; drugih kamer ne dodajaj. V posnetku še TV kamere ob progi; foto način ostane.
- Grafiko izboljšuj za kamero za avtom (obzorje, nebo, griči, cesta pred avtom in robovi, teren ob njej); česar ni videti (drobni predmeti, notranjosti, mali napisi, strehe od zgoraj), poenostavi.
- Gledalcev ob cesti je čim manj (`fewFans` v `js/world.js`: redke mirne skupine); redarji, snemalci (`staff: true`), mehaniki in tribune ostanejo; nove proge jih ne dodajajo več, kot je treba.
- Obremenitev: proga do ~300 klicev risanja in ~900 tisoč oglišč, v povprečju in na najbolj obremenjenem mestu (`tests/golden/perf.json`, `perf.test.mjs`); nova proga ali izboljšava ne poveča obremenitve drugih prog.
- **Realizem** (`docs/realizem.md`): paketi stavb, cest s predmeti in rastja samo na 15 pravih prog; stranske ceste s križišči (samo videz, do ~60 m) in črte na cesti po pravilih države na vseh pravih progah; nikjer imen, logotipov, napisov, umetnin in kipov. Poškodbe so privzeto samo videz (Izklop / Samo videz / Vklop); ko trk odtrga kolo, je dirke konec. Trki imajo v Nastavitvah možnosti, privzeta je najbolj realistična.

## Pravna varnost
- Samo zemljepisna imena; brez logotipov, imen podjetij, lokalov, sponzorjev, prireditev in znamk avtomobilov; table in napisi generični ali izmišljeni.
- **Nikoli imen resničnih oseb** (napisi navijačev, table, imena ovinkov, komentar): vedno izmišljena; ovinek, imenovan po osebi, podjetju ali lokalu, dobi opisno ime (seznam v `maketa-menija/README.md`).
- Podatki samo iz OpenStreetMap in javnih višinskih modelov (SRTM, Copernicus DEM, USGS 3DEP …); **nikoli Google Maps, Earth ali Street View**.
- Vsak vir z licenco gre v `README.md`, »Zasluge« (OSM in izpeljani podatki: ODbL 1.0).

## Meni (`js/menu.js`, `css/menu.css`)
- Nov meni v angleščini (`README.md`, »Nov meni«) bere progo iz igre (ime, `js/lang.js`), zato nova proga nastopi sama.
- Nova proga potrebuje sliko `assets/tracks/<id>.webp` in `<id>-rain.webp` (`maketa-menija/README.md`); zemljevid in preleti so po želji.
- Meni deluje pokonci in ležeče od 360 × 640; po spremembi `node tests/browser/menu.test.mjs`.

## Postopek
- **Žigov** (`?v=…`) v repozitoriju ni (doda jih objava). Po spremembi `node tools/stamp.js --check`; sicer samo `--merge` (spor v `index.html`, `garaza.html`), `--strip` in `--find`. Spoj `main` ali veje: `node tools/spoji-main.mjs [veja]`. Nove reference: `npm run golden:update`.
- **Commiti in PR brez imen modelov**: commit konča z »Co-Authored-By: Claude <noreply@anthropic.com>« in »Claude-Session: …«, tudi če sistem predlaga drugače. Starih commitov ne popravljamo.
- Nova proga: prevodi v `js/lang.js` in test proge po vzoru obstoječih.
- **Testi**: pred potiskom lokalno zeleni povezani testi (`npm run test:related`; `tests/README.md`). Krog na GitHubu je po vrsti spremembe (`docs/krog-testov.md`): dokumenti → testi dokumentov; samo proge → kratek krog; ostalo → celotni nabori (tudi vsako noč na `main`).
- **Združi sam, brez vprašanja**, ko so testi zeleni in je PR na vrsti v `docs/vrsta.md` (pravila tam): pripravljen PR se vpiše na konec, po združitvi svojo vrstico izbriši. Novo temo najprej vpiši v »Načrtovano«; ne začni je, če je že tam ali v odprtem PR.
- **Svež main pred združitvijo**: ko je PR ves zelen, spoji svež `main` in poženi povezane teste; brez sporov ali s spori samo v žigih, seznamih testov ali kazalu združi brez novega kroga, ob drugih sporih potisni in počakaj na celoten krog. Pred združitvijo preveri zadnji krog na `main` in nočni krog (rdečega najprej popravi). Napako 500 ob združitvi ponovi enkrat (pogosto je že uspela). Če `main` po združitvi pade, ga popravi seja tega PR. Po združitvi ali zaprtju obvesti seje iz zbirke `cakanje` (`docs/varcevanje.md`).
- **PR odpri ob začetku dela** kot osnutek (odprti PR so seznam dela vseh računov: preglej jih pred novo temo). **Osnutek do vrste**: končan PR ostane osnutek; »Ready for review« (krog na GitHubu) dobi šele med prvima dvema v vrsti. Na pripravljen PR potisni enkrat na krog popravkov.
- PR na istih datotekah gredo na `main` v enem koraku (zbirna veja) ali po dogovoru drug za drugim, nikoli hkrati; PR, ki zmanjšajo spore, gredo prvi; najprej se izprazni vrsta za `main`, nato nove verige.
- **Popravki in posodobitve skupaj**: majhne spremembe iste teme v en PR; manjše popravke račun zbira v zbirno vejo na dan ali temo. **Pravila enkrat na dan v en PR** (če je odprt, dodaj vanj).

## Seje
- Ena tema na sejo; večji korak je nova seja s kratkim povzetkom. Seja dela samostojno, poroča ob koncu ali ob odločitvi, ki je res uporabnikova. Seznam PR za uporabnika: ime računa in 1–3 stavki, kaj prinese v igro; ure po ljubljanskem času.
- Največ 2 seji s kodo hkrati na račun (čakanje na teste ne šteje); zaganja jih koordinacija ali veriga, ko je prostor. Pred zagonom preveri svoje seje (`list_sessions`) in odprte PR vseh računov; seja s kodo dobi `source_url`.
- **Največ 6 odprtih tem na račun** (PR in osnutki; zbirna veja je ena tema): pri 6 nove teme ne začni, dokončuj in na strani Odločitve predlagaj, kaj zapreti ali združiti. Izjeme: popravek rdečega `main`, kratek PR s pravili ali dokumenti za isti dan, tema, ki jo uporabnik začne kljub opozorilu.
- **Poraba 100 % 12 h pred iztekom**: cilj = 100 % × ure od reseta / 156; več kot 5 točk pod ciljem ena seja s kodo več (največ 2), več kot 5 točk nad ciljem nobene nove, nezačeto delo prevzame račun pod ciljem (`docs/varcevanje.md`, »Poraba«).
- **Model in napor**: Opus (`claude-opus-5-5`) za zasnovo, novo kodo, težke napake, proge, meni, popravke in izbrise; Fable 5.2 (`claude-fable-5-2`) za grafiko in fiziko; Sonnet za opise, spore in manjše popravke; vse z eno sejo, kakovost pred hitrostjo. Brez modela ali ob porabljeni omejitvi seja teče na Opusu (koordinacija objavi na tabli). **Napor je privzeto high** (`.claude/settings.json`: `effortLevel`); **max samo za trke, grafiko, težke napake in novo zasnovo**: `create_session` z `effort` `max` (»napor max« v starejših načrtih velja samo za to). `CLAUDE_CODE_EFFORT_LEVEL` ne sme biti v nastavitvah, ker povozi napor seje (`docs/varcevanje.md`, »Napor«). Koordinacija (Sonnet), zbiranje vprašanj in obvestila (Haiku) tečejo v okolju »Koordinacija« z naporom medium; rutina naj bo čim krajša.
- **Proge in grafika** z eno sejo; **več agentov samo za trke**: ultracode in delovni tokovi z več agenti samo za fiziko trkov in za neodvisno preverjanje pred združitvijo; ne za proge, grafiko, meni, popravke, izbrise, dokumente, žige, teste in rutino. Pomožni agenti samo za res ločeno vzporedno delo in pregled sej pri zbiranju vprašanj. Sejo za trke zažene koordinacija (`claude-fable-5-2`, »ultracode« na začetku vsake naloge in stavek »Delaj z delovnimi tokovi z več agenti«; do 10 agentov; `docs/odlocitve.md`).
- **Fizika vožnje se ne spreminja** (oprijem, pnevmatike, zavore, pospeševanje, krmiljenje, vzmetenje, vožnja tekmecev): avto, ki se ničesar ne dotakne, vozi na suhem do številke enako. Tema, ki bi to spremenila (tudi kot stranski učinek skupne kode), se ne začne oz. se ustavi in javi uporabniku. Spreminja se samo fizika trkov. Izjema: **»Dež in sneg: bolj drsi«** (samo mokro in sneg) ima prednost pred vsem; na `main` po uporabnikovem »ok« na predogledu.
- Tema grafike ali fizike pred `main` pokaže uporabniku **slike zdaj in potem** (kamera za avtom, prava proga). Pred začetkom preveri, da podobnega ne dela že kdo (odprti PR, »Načrtovano«, tabla).
- **Predaja velike seje** pri ~150 tisoč konteksta ali ob koncu teme: kratka predaja (v načrt teme ali sporočilo), delo nadaljuje nova seja, stara se ustavi (odjavi PR, izbriše svoja opravila). Starih velikih sej ne zbujaj. Samodejni povzetek je rezerva (okno 200 tisoč, `docs/varcevanje.md`); kar mora ostati, sproti zapiši v datoteke ali commite.
- **Čakanje**: na teste GitHuba `subscribe_pr_activity` in konec koraka (vmesni dogodek: ena vrstica, brez branja dnevnikov); na drug PR ali sejo vpis v zbirko `cakanje` in konec koraka (`docs/varcevanje.md`). Lokalni testi v ozadju zbudijo sami. Rezervno preverjanje največ enkrat na 8 h, brez zank s `sleep`.
- **Vprašanja za uporabnika** zapiši takoj na stran Odločitve svojega računa (`docs/vprasanja.md`), z oštevilčenimi možnostmi; grafično vprašanje ima vedno slike (vsaka možnost svojo). Dela naprej, kar ni odvisno od odgovora. Odgovor prebere seja sama (`send_later` ob 10.50, 14.50 ali 23.20, največ trikrat; `docs/vprasanja.md`). V pogovoru sprašuj samo, če uporabnik piše v sejo ali stran ni dosegljiva, in takrat s klikljivo izbiro (`AskUserQuestion`, priporočena prva).

### Tabla med računi (issue #382)
- Računi se usklajujejo na tabli, ne prek uporabnika; račune imenuj po imenu, ne po številki: **biketraveler**, **jure.kopac26**, **partyslo** (polnega emaila ne piši nikamor). Komentar začne s koordinacijo in računom in konča z nogo `---` / `_Generated by [Claude Code](https://claude.ai/code)_`. Kaj se objavi (teme, prevzemi, vrsta, rdeč `main`, odločitve za vse, prošnje, dnevno stanje, ustavitve, spori med PR): `docs/varcevanje.md`, »Tabla«.
- **Branje 4× na dan** (po ljubljanskem času): biketraveler 0.15, 6.15, 12.15, 18.15; partyslo 1.15, 7.15, 13.15, 19.15; jure.kopac26 2.15, 8.15, 14.15, 20.15. Vsako branje je **majhna sveža seja** (opravilo po urniku z novo sejo ob vsakem zagonu); stanje je zadnji lastni komentar na tabli.
- **Matejeve odločitve** (komentar se začne z »Matej (jure.kopac26)«, samo lastnik repozitorija, `author_association` OWNER) izvede koordinacija računa, za katerega so, sama in odgovori v eni vrstici. Pravila spremeni samo odločitev uporabnika, ki jo komentar navede (datum in ura); vrstni red vrste uporabnik ali Matej po seznamu za 1.0.
- Vrstni red vrste: proge so vedno zadnje (vse pripravljene proge računa v enem PR), za njimi samo nova mapa in misije. Ko računu zmanjkuje porabe, seje napišejo predajo v opis PR, PR vpišejo s pripisom »prevzame <račun>« in se ustavijo (`docs/vrsta.md`, »Prevzem zdaj«).

## Varčevanje z žetoni (`docs/varcevanje.md`)
- Lokalno samo `npm run test:related`; uspešnih testov ne ponavljaj. Odločitve zapiši enkrat v docs, drugje se skliči.
- Podatke nove prave proge pripravi z `tools/proga-podatki.py`.
- Slike samo za vprašanja in ob koncu dela, obrezane, do ~300 KB; za grafiko 1–2 ključna pogleda.
- Kratki izpisi: pri testih samo OK/FAIL; pri orodjih omeji izpis (`fields`, `minimal_output`, `limit`, `kinds`); velike izpise v datoteko; opis PR do ~20 vrstic.

## Kje je kaj
- V `docs/kazalo.md` beri samo »Na kratko« (prvih 25 vrstic), ostalo z grepom. Velikih datotek (`js/world.js`, `js/world-pikes.js`, `docs/igra.md`, `tests/README.md`, `README.md`, kazalo) ne beri v celoti; dolge vrstice išči z `grep -noE '.{0,150}ime.{0,150}'`. Generirani podatki (`js/routes.js`, `assets/maps/` …) so v `.ignore`.
- Ko dodaš ali premakneš kaj iz kazala, ga posodobi. O progah v igri najprej `docs/proge-pregled.md`; po novi progi `node tools/proge-pregled.js` in vrstica »Do 60 m ob cesti«.

## Orodje za napake (`js/napake.js`, `docs/orodje-za-napake.md`)
- Sklopa 0 in 8 sta odložena. Orodje je samo v slovenščini (brez `tr()`). Slik in seznamov napak ne shranjuj v repozitorij (je javen).
- Poročilo `RRA-NAPAKE …` pove žig, progo, čas, krog in `s`; commit žiga najde `node tools/stamp.js --find <žig>`. Posnetek `.rrp` odpri z `node tools/posnetek.mjs` (ne shranjuj ga).

## Pred izidom: NEUPORABNO
- Kar ne gre v 1.0 (testne proge, pokala »Domači pokal« in »Kratke proge«, vse misije, nova mapa), se pred izidom skrije za gumb **NEUPORABNO**; koda in testi ostanejo. Orodje za napake in `?denar` se skrijeta ob zamrznitvi 23. 12.
- Privzeta proga postane prva prava proga; avtošola gre z Jezera na pravo kratko progo (izbere seja teme in javi).
- **Prednost zdaj: fizika (samo trki) in grafika** na računih biketraveler in jure.kopac26; partyslo dela nove proge, nato grafiko (`docs/realizem.md`, »Čas in vrsta«).

## Posebne misije (`docs/misije.md`)
- **Nova mapa in misije** (z garažami misij in menijem NEW VERSION · TEST 1) gredo v različico 2.0; delo na njih je **ustavljeno**, dokler uporabnik ne reče drugače. Dovoljen je samo najmanjši popravek, da testi ostanejo zeleni; če skupna sprememba pokvari test nove mape ali misij, ga popravi seja, ki jo je naredila. Novo delo na njih je v vrsti zadnje, za progami.
- Koda misij je v `js/missions.js` in `js/missions/`; drugod samo kratki priklopi.

## Verigi prog
- **Gorske proge** (`docs/gorske-proge.md`) in **Nove proge** (`docs/nove-proge.md`): postopek in odločitve v načrtih in v `docs/odlocitve.md`. PR verige gre na `main` brez vprašanja, ko so testi zeleni, nato se zažene naslednja proga; uporabnik verigo ustavi z »stop«. Kamera vidi le ~60 m ob cesti: zanimivosti samo v tem pasu. OSM prek `api.openstreetmap.org/api/0.6/map?bbox=…` (`overpass-api.de` iz okolja ne deluje).
