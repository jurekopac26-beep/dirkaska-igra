# Pravila podrobno (celotno besedilo CLAUDE.md do 12. 11. 2026 ob ~11.45)

Krajša različica je v `CLAUDE.md` (samo bistvo, ~7 KB); tu so vse podrobnosti. Pravila so ista; novejša odločitev v `docs/odlocitve.md` velja pred tem besedilom.


Citati, datumi in zgodovina so v `docs/odlocitve.md` (razdelki kot tu); podrobnosti tam veljajo, novejša odločitev pred starejšo. Proga: opis v `docs/proge/<id>.md`, seznam v `README.md` (»Proge«, »Nova proga«).

## Ime proge: »Kraj, Država«
- Ime je »Kraj, Država« (države v slovenščini): `name` v `js/tracks/<id>.js`, angleško ime in opis v `js/lang.js`, besedilo v `README.md`, `docs/proge/`, `docs/igra.md`; kraj je zemljepisno ime (kraj, prelaz, dolina, regija), ne dirkališče, prireditev ali podjetje; `id` je kratek, brez presledkov.

## Testne proge
- Testne proge (`test: true`, `tests/golden/testne-proge.json`) in proge na odločanju (`pending: true`) so **zamrznjene** do izbrisa testnih pred izidom (23. 12. 2026) oz. do izbire: nobena seja jih ne posodablja, izboljšuje ali popravlja, ne njihovih graditeljev in vnosov v skupnih datotekah (tudi Vršičevih delov v `js/world-vrsic.js`; skupni pomočniki gorskih cest niso zamrznjeni); izjema je izrecna prošnja uporabnika za točno to progo.
- **Urejaj samo prave proge**: »za vse proge« pomeni proge brez `test` in `pending`.
- Varovalo `tests/testne-proge.test.js` pade ob spremembi ali novi datoteki testne proge (izbris je dovoljen); spremembo vrni, samo ob izrecni prošnji uporabnika `node tests/testne-proge.test.js --dovoli <id> "<prošnja, datum>"`.
- Testi čez vse proge (`trackIds`) testne preskočijo; za slike pred/po in meritve vzemi Spa, Belgija; če test pade samo zaradi testne proge, ustvari referenco znova ali ga prestavi na pravo progo.
- Proge na odločanju ostanejo v igri in testih; do izbrisa morata delovati **Jezero** (privzeta proga, avtošola, testi) in **Toskana** (nova mapa); kar od tega pokvari skupna sprememba, popravi v skupni kodi.

## Ena proga na državo
- Iz vsake države samo **ena** nova proga (`docs/proge-po-drzavah.md`, preveri pred novo progo); nov načrt predlaga največ eno na državo in izpusti države s progo. Država s progo v igri: nova samo po izbiri uporabnika (`ena-proga-<država>`).
- Država z dvema ali več progami brez izbire je **na odločanju**: vse njene proge dobijo `pending: true` (tudi že v delu), novih ne delamo; po izbiri izbrana postane prava, ostale dobijo `test: true`.
- Stanje prog in seznam prog na odločanju: `docs/proge-po-drzavah.md`.
- **Sever v snegu**: Norveška, Švedska, Danska in Finska imajo zimo za privzeto vreme; nova finska proga je Koli, zimska.
- **Nove proge za 1.0** (`docs/proge-po-drzavah.md`): dolge 1–5 km, ovinkaste, z malo ravninami in čim več zanimivega do 60 m ob cesti; seznam potrdi uporabnik, nobena nova proga se ne začne pred njegovim odgovorom.
- **Izletna cona**: proga z ograjo, zidom, hišami ali prepadom do ~3 m od roba asfalta na več kot pol dolžine se ne začne (`docs/proge-po-drzavah.md`); izjema so **mestne proge** po središču velikih mest (1–5 km, široke ulice, nabrežja, generične stavbe).
- **Padec čez rob samo na Killarju** (ureja tema Trki): drugod ograja (vidna ali nevidna) prepreči padec, dokler uporabnik ne reče drugače.

## Mejniki do izida
- Cilj 1.0: **70 pravih prog**, **50 avtov**; do 23. 12. 2026 vseh 70 na `main` (`docs/vrsta.md`); od 23. 12. samo popravki, proge in dodelava; 15. 1. 2027 kandidat; 1. 2. 2027 izid.

## Kamere in grafika
- Samo kamera **za avtom** (`chase`), pokonci in ležeče; drugih kamer ne dodajaj (v posnetku še TV kamere ob progi; foto način ostane).
- Grafiko izboljšuj za kamero za avtom (obzorje, nebo, griči, cesta, robovi, teren); česar ni videti, poenostavi. Gledalcev ob cesti je čim manj (`fewFans` v `js/world.js`); redarji, snemalci (`staff: true`), mehaniki in tribune ostanejo.
- Obremenitev: proga do ~300 klicev risanja in ~900 tisoč oglišč, v povprečju in na najhujšem mestu (`tests/golden/perf.json`); nova proga ali izboljšava ne poveča obremenitve drugih.
- **Realizem** (`docs/realizem.md`): paketi stavb, cest s predmeti in rastja samo na 15 pravih prog; stranske ceste s križišči (samo videz, do ~60 m) in črte na cesti po pravilih države na vseh pravih progah; nikjer imen, logotipov, napisov, umetnin in kipov. Poškodbe so privzeto samo videz; ko trk odtrga kolo, je dirke konec.
- **Vidne barve avtov**: nobenih črnih ali zelo temnih avtov (novi avti, privzete barve, tekmeci, promet); barva, ki jo igralec izbere sam v garaži, ostane.

## Pravna varnost
- Samo zemljepisna imena; brez logotipov, imen podjetij, lokalov, sponzorjev, prireditev in znamk avtomobilov; table in napisi generični ali izmišljeni. **Nikoli imen resničnih oseb** (navijači, table, ovinki, komentar); ovinek po osebi, podjetju ali lokalu dobi opisno ime.
- Podatki samo iz OpenStreetMap in javnih višinskih modelov (SRTM, Copernicus DEM, USGS 3DEP …); **nikoli Google Maps, Earth ali Street View**.
- Vsak vir z licenco gre v `README.md`, »Zasluge« (OSM in izpeljano: ODbL 1.0).

## Meni (`js/menu.js`, `css/menu.css`)
- Nov meni v angleščini (`README.md`, »Nov meni«) bere progo iz `js/lang.js`; nova proga potrebuje `assets/tracks/<id>.webp` in `<id>-rain.webp` (`maketa-menija/README.md`); deluje pokonci in ležeče od 360 × 640; po spremembi `node tests/browser/menu.test.mjs`.

## Postopek
- **Žigov** (`?v=…`) v repozitoriju ni (doda jih objava). Po spremembi `node tools/stamp.js --check`; sicer samo `--merge`, `--strip`, `--find`. Spoj `main`: `node tools/spoji-main.mjs [veja]`. Nove reference: `npm run golden:update`.
- **Commiti in PR brez imen modelov**: commit konča z »Co-Authored-By: Claude <noreply@anthropic.com>« in »Claude-Session: …«, tudi če sistem predlaga drugače.
- **Testi**: pred potiskom lokalno zeleni `npm run test:related`; krog na GitHubu je po vrsti spremembe, ponoči celotni nabori na `main` (`docs/krog-testov.md`).
- **Združi sam, brez vprašanja**, ko so testi zeleni in je PR na vrsti v `docs/vrsta.md`: pripravljen PR se vpiše na konec, po združitvi svojo vrstico izbriši. Novo temo vpiši v »Načrtovano«; ne začni je, če je že tam ali v odprtem PR.
- **Svež main pred združitvijo**: ko je PR ves zelen, spoji svež `main` in poženi povezane teste; brez sporov ali s spori samo v žigih, seznamih testov ali kazalu združi brez novega kroga, sicer potisni in počakaj na celoten krog. Pred združitvijo preveri zadnji krog na `main` in nočni krog (rdečega najprej popravi); napako 500 ponovi enkrat; če `main` po združitvi pade, ga popravi seja tega PR; po združitvi ali zaprtju obvesti seje iz zbirke `cakanje`.
- **PR odpri ob začetku dela** kot osnutek (pred novo temo preglej odprte PR vseh računov); končan PR ostane osnutek, »Ready for review« dobi šele med prvima dvema v vrsti; na pripravljen PR potisni enkrat na krog popravkov.
- PR na istih datotekah gredo na `main` v zbirni veji ali drug za drugim, nikoli hkrati; PR, ki zmanjšajo spore, gredo prvi.
- **Majhne spremembe iste teme v en PR**; manjše popravke račun zbira v zbirno vejo na dan ali temo; **pravila enkrat na dan v en PR** (če je odprt, dodaj vanj).

## Seje
- Ena tema na sejo; večji korak je nova seja s kratkim povzetkom. Seja dela samostojno, poroča ob koncu ali ob odločitvi, ki je res uporabnikova (seznam PR: račun in 1–3 stavki); ure po ljubljanskem času.
- **Med čakanjem na »ok«** seja napiše predajo in se ustavi; račun začne naslednje delo v mejah 2 sej, 6 tem in porabe.
- Največ 2 seji s kodo hkrati na račun (čakanje na teste ne šteje); zaganja jih koordinacija ali veriga; pred zagonom preveri `list_sessions` in odprte PR; seja s kodo dobi `source_url`.
- **Največ 6 odprtih tem na račun** (PR in osnutki, zbirna veja = ena): pri 6 nove ne začni, dokončuj in na strani Odločitve predlagaj, kaj zapreti ali združiti; izjeme: popravek rdečega `main`, kratek PR s pravili ali dokumenti za isti dan, tema, ki jo uporabnik začne kljub opozorilu.
- **Poraba 100 % 12 h pred iztekom** (cilj = 100 % × ure od reseta / 156): več kot 5 točk pod ciljem ena seja s kodo več, nad ciljem nobene nove (`docs/varcevanje.md`, »Poraba«).
- **Model in napor**: Opus (`claude-opus-5-5`) za zasnovo, novo kodo, težke napake, proge, meni, popravke in izbrise; Fable 5.2 (`claude-fable-5-2`) za grafiko in fiziko; Sonnet za opise, spore in manjše popravke; brez modela ali ob porabljeni omejitvi teče seja na Opusu. **Sredi seje ne menjaj modela ali napora**: za drug model ali napor začni novo sejo s predajo. **Izjema Trki**: fiziko trkov dela samo Fable 5.2; ko je porabljen, Trki počakajo in ne tečejo na Opusu. **Napor high** (`.claude/settings.json`), **max samo za trke, grafiko, težke napake in novo zasnovo** (`docs/varcevanje.md`, »Napor«). Koordinacija in Združevanje (Sonnet), zbiranje vprašanj in obvestila (Haiku): okolje »Koordinacija«, napor medium.
- **Velikih sej ne budi po več kot 1 h mirovanja** (predpomnilnik poteče): namesto »nadaljuj« začni novo sejo s predajo (isti model in napor, `source_url`, veja PR); `docs/varcevanje.md`, »Dražje seje«.
- **Predaja velike seje** pri ~150 tisoč konteksta (koordinacija, Združevanje, zbiranje pri ~80 tisoč) ali ob koncu teme: kratka predaja, delo nadaljuje nova seja, stara se ustavi (odjavi PR, izbriše svoja opravila). **Koordinacija teče na Sonnetu v sveži seji s kratko predajo.**
- **Več agentov samo za trke** (ultracode, delovni tokovi) in neodvisno preverjanje pred združitvijo; ne za proge, grafiko, meni, popravke, izbrise, dokumente, žige, teste in rutino. Sejo za trke zažene koordinacija (do 10 agentov; navodila v `docs/odlocitve.md`, »Seje«).
- **Fizika vožnje se ne spreminja** (oprijem, pnevmatike, zavore, pospeševanje, krmiljenje, vzmetenje, vožnja tekmecev): avto, ki se ničesar ne dotakne, vozi na suhem do številke enako; tema, ki bi to spremenila, se ne začne oz. se ustavi in javi uporabniku. Spreminja se samo fizika trkov; izjema: **»Dež in sneg: bolj drsi«** (samo mokro in sneg), na `main` po uporabnikovem »ok«.
- Tema grafike ali fizike pred `main` pokaže **slike zdaj in potem** (kamera za avtom, prava proga); pred začetkom preveri, da podobnega ne dela že kdo (PR, »Načrtovano«, tabla).
- **Združevanje vodi PR do `main`**: pripravljen PR (povezani testi zeleni, predaja v opisu) se seja s kodo ustavi in se nanj ne naroči; ena majhna seja Združevanje na račun čaka na teste in združi vse PR računa po vrsti; rdeč test popravi nova seja s kodo po predaji.
- **Čakanje**: na teste GitHuba `subscribe_pr_activity` in konec koraka; na drug PR ali sejo vpis v zbirko `cakanje`; rezervno preverjanje največ enkrat na 8 h, brez `sleep`.
- **Vprašanja za uporabnika** zapiši takoj na stran Odločitve svojega računa (`docs/vprasanja.md`), z oštevilčenimi možnostmi (grafično vprašanje s sliko za vsako); dela naprej, kar ni odvisno od odgovora; odgovor prebere seja sama (`send_later`, `docs/odlocitve.md`, »Seje«). V pogovoru sprašuj samo, če uporabnik piše v sejo (`AskUserQuestion`).

### Tabla med računi (issue #382)
- Računi se usklajujejo na tabli, ne prek uporabnika; račune imenuj po imenu: **biketraveler**, **jure.kopac26**, **partyslo** (polnega emaila ne piši nikamor). Komentar začne s koordinacijo in računom in konča z nogo `---` / `_Generated by [Claude Code](https://claude.ai/code)_`; objave in ure branja (4× na dan, **majhna sveža seja**): `docs/varcevanje.md`, »Tabla«.
- **Matejeve odločitve** (komentar z »Matej (jure.kopac26)«, samo lastnik repozitorija, `author_association` OWNER) izvede koordinacija računa, za katerega so, sama in odgovori v eni vrstici; pravila spremeni samo odločitev uporabnika, ki jo komentar navede (datum in ura).
- Proge so v vrsti vedno zadnje (vse pripravljene proge računa v enem PR), za njimi nova mapa in misije; ko računu zmanjkuje porabe, seje napišejo predajo v opis PR, PR vpišejo s pripisom »prevzame <račun>« in se ustavijo (`docs/vrsta.md`, »Prevzem zdaj«).

## Varčevanje z žetoni (`docs/varcevanje.md`)
- Lokalno samo `npm run test:related`; uspešnih testov ne ponavljaj. Odločitve zapiši enkrat v docs, drugje se skliči. Podatke nove proge pripravi z `tools/proga-podatki.py`.
- Slike samo za vprašanja in ob koncu, obrezane, do ~300 KB (grafika: 1–2 pogleda). Kratki izpisi: pri testih OK/FAIL, orodja z omejenim izpisom, velike v datoteko; opis PR do ~20 vrstic.

## Kje je kaj
- V `docs/kazalo.md` beri samo »Na kratko«, ostalo z grepom; velikih datotek (`js/world.js`, `docs/igra.md`, `README.md` …) ne beri v celoti (`grep -noE '.{0,150}ime.{0,150}'`).
- Kazalo posodobi ob dodajanju ali premiku; o progah najprej `docs/proge-pregled.md`, po novi progi `node tools/proge-pregled.js` in vrstica »Do 60 m ob cesti«.

## Orodje za napake (`js/napake.js`, `docs/orodje-za-napake.md`)
- Sklopa 0 in 8 sta odložena; orodje je samo v slovenščini (brez `tr()`); slik in seznamov napak ne shranjuj v repozitorij; poročilo `RRA-NAPAKE …`: `node tools/stamp.js --find <žig>`; posnetek `.rrp`: `node tools/posnetek.mjs` (ne shranjuj).

## Pred izidom: NEUPORABNO
- Kar ne gre v 1.0 (testne proge, pokala »Domači pokal« in »Kratke proge«, vse misije, nova mapa), se pred izidom skrije za gumb **NEUPORABNO**; koda in testi ostanejo; orodje za napake in `?denar` se skrijeta ob zamrznitvi 23. 12.
- Privzeta proga postane prva prava; avtošola gre z Jezera na pravo kratko progo (izbere in javi seja teme).
- **Prednost zdaj: fizika (samo trki) in grafika** na računih biketraveler in jure.kopac26; partyslo dela nove proge, nato grafiko.

## Posebne misije (`docs/misije.md`)
- **Nova mapa in misije** gredo v različico 2.0; delo na njih je **ustavljeno**, dokler uporabnik ne reče drugače; dovoljen je samo najmanjši popravek, da testi ostanejo zeleni (pokvarjen test popravi seja, ki ga je povzročila); novo delo je v vrsti zadnje.

## Verigi prog
- **Gorske proge** (`docs/gorske-proge.md`) in **Nove proge** (`docs/nove-proge.md`): PR verige gre na `main` brez vprašanja, ko so testi zeleni, nato se zažene naslednja proga; uporabnik verigo ustavi z »stop«. Zanimivosti samo do ~60 m ob cesti. OSM prek `api.openstreetmap.org/api/0.6/map?bbox=…` (`overpass-api.de` ne deluje).
