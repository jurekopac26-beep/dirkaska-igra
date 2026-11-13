# Pravila (vse seje vseh štirih računov)

Samo bistvo; **vse podrobnosti** (celotna prejšnja pravila) so v `docs/pravila-podrobno.md`, citati in datumi v `docs/odlocitve.md`, varčevanje v `docs/varcevanje.md`; novejša odločitev pred starejšo. Proga: `docs/proge/<id>.md`, seznam v `README.md`.

## Proge
- Ime »Kraj, Država« (država v slovenščini; kraj = zemljepisno ime, ne dirkališče, prireditev ali podjetje): `js/tracks/<id>.js`, `js/lang.js`, `README.md`, `docs/proge/`, `docs/igra.md`.
- **Zamrznjene** do izbrisa pred izidom (23. 12. 2026) oz. izbire: testne (`test: true`) in na odločanju (`pending: true`); nobena seja jih ne spreminja (varovalo `tests/testne-proge.test.js`; `--dovoli` samo ob izrecni prošnji uporabnika). Urejaj samo prave proge. Delovati morata Jezero (privzeta proga, avtošola, testi) in Toskana. Testi čez vse proge testne preskočijo; za slike pred/po vzemi Spa, Belgija.
- Iz države samo **ena** nova proga, preveri `docs/proge-po-drzavah.md`; dve ali več brez izbire = na odločanju. Sever (Norveška, Švedska, Danska, Finska): zima; finska je Koli.
- Nova proga: 1–5 km, ovinkasta, zanimivosti do 60 m ob cesti, seznam potrdi uporabnik; **izletna cona**: ograja, zid, hiše ali prepad do ~3 m od asfalta na več kot pol dolžine = se ne začne (izjema mestne proge in 4 proge s prepadom, 13. 11.: Kali Gandaki, Musandam, Limalimo, Darvaz, z ograjo na strani prepada). Padec čez rob samo na Killarju.
- **Verigi prog** (`docs/gorske-proge.md`, `docs/nove-proge.md`): PR verige gre na `main` brez vprašanja, ko so testi zeleni; uporabnik ustavi z »stop«. OSM prek `api.openstreetmap.org/api/0.6/map?bbox=…`.
- Cilj 1.0: **70 pravih prog**, **50 avtov**; vseh 70 na `main` do 23. 12. 2026; 15. 1. 2027 kandidat; 1. 2. 2027 izid.

## Grafika
- Samo kamera **za avtom** (`chase`), pokonci in ležeče; ne dodajaj kamer. Grafika za to kamero; česar ni videti, poenostavi. Gledalcev čim manj (`fewFans`).
- Obremenitev: do ~300 klicev risanja in ~900 tisoč oglišč (`tests/golden/perf.json`); ne povečuj drugim progam.
- Realizem (`docs/realizem.md`): paketi samo na 15 pravih prog; poškodbe samo videz, odtrgano kolo = konec dirke.
- **Vse kot v resnici, nič izmišljenega**: stavbe, poti do hiš, ceste, predmeti in proge samo po virih (OSM, javni višinski modeli, javni podatki); česar v virih ni, se ne doda.
- **Vidne barve avtov**: nobenih črnih ali zelo temnih (novi avti, privzete barve, tekmeci, promet); barva, ki jo igralec izbere v garaži, ostane.
- Odločitve za grafiko in meni: 2–3 možnosti s slikami naenkrat, en »ok«. Grafika in fizika pred `main`: slike zdaj in potem. Grafika (S, G) enkrat na progo, šele ko je na `main`.

## Pravna varnost
- Samo zemljepisna imena; brez logotipov, podjetij, lokalov, sponzorjev, prireditev, znamk avtov; **nikoli imen resničnih oseb**. Podatki samo OSM in javni višinski modeli; **nikoli Google Maps, Earth, Street View**. Vir z licenco gre v `README.md`, »Zasluge«.

## Postopek
- Meni (`js/menu.js`): nova proga potrebuje `assets/tracks/<id>.webp` in `<id>-rain.webp`; po spremembi `node tests/browser/menu.test.mjs`.
- Žigov (`?v=…`) v repozitoriju ni; po spremembi `node tools/stamp.js --check`. Spoj `main`: `node tools/spoji-main.mjs`. Reference: `npm run golden:update`.
- Commit konča z »Co-Authored-By: Claude <noreply@anthropic.com>« in »Claude-Session: …«; brez imen modelov.
- Lokalno samo `npm run test:related`, uspešnih ne ponavljaj; krog na GitHubu po vrsti spremembe.
- PR odpri ob začetku dela kot osnutek; »Ready for review« šele med prvima dvema v `docs/vrsta.md`. **Združevanje vodi seja Združevanje** (po vrsti, svež `main`, zeleni krogi); seja s kodo se ne naroči na PR. Pravila enkrat na dan v en PR.
- Največ 6 odprtih tem (pri 6 nove ne začni, predlagaj, kaj zapreti) in 2 seji s kodo na račun (jure.kopac26 3, dokler je pod ciljem porabe); pred zagonom `list_sessions` in odprti PR.
- Pred združitvijo: spoji svež `main`, povezani testi, zadnji krog na `main` in nočni krog zelena (500 ponovi enkrat); rdeč `main` najprej popravi; po združitvi obvesti seje iz zbirke `cakanje`. PR na istih datotekah gredo drug za drugim; majhne spremembe iste teme v en PR.
- Uporabnikovi popravki: čez dan jih pošilja Mateju, do 5.00 jih zbira, ob 5.00 gredo kot en sveženj v zbirno vejo dneva; »prednost« gre na začetek vrste. »Ok« na predogledu samo za grafiko, trke in meni; drobni popravki gredo na `main` po zelenih testih (`docs/odlocitve.md`, Postopek).
- **Najprej odločitev, nato koda**: proga, meni, grafika ali nova funkcija se začne šele, ko uporabnik potrdi seznam, skico ali sliko na strani Odločitve; pripombe na isti predogled gredo seji v enem sporočilu in se popravijo v enem krogu.

## Seje
- **Nov Matej vsak dan** ob 5.00 s kratko predajo (stari se ustavi; model in napor ostaneta). Velike izpise (`list_sessions`, stanje PR) bere majhen pomočnik in vrne do 5 vrstic; ob 5.00 uporabnik dobi seznam PR s povezavami, po njegovem »ok« PR do `main` pripelje seja Združevanje (`docs/varcevanje.md`, »Manj sklopov 2. del«).
- Ena tema na sejo, samostojno; vprašanja na stran Odločitve (`docs/vprasanja.md`), v pogovoru samo če uporabnik piše v sejo. Ure po ljubljanskem času.
- **Predaja vseh sej (tudi s kodo) pri ~80 tisoč konteksta**; kratka predaja, nova seja, stara se ustavi. Velikih sej ne budi po več kot 1 h mirovanja: nova seja s predajo.
- **Model**: Opus za zasnovo, kodo, proge, meni, popravke (mehanski popravki prog: imena, oznake, slike za meni, dokumenti na Sonnetu); Fable 5.2 za grafiko in fiziko; **Trki samo Fable 5.2** (ko je porabljen, počakajo). **Rutina (koordinacija, Združevanje, obvestila, zbiranje) samo Haiku/Sonnet.** Spori, dokumenti, vrsta in Združevanje: Sonnet, napor medium. Modela in napora sredi seje ne menjaj. Napor high, max samo za trke, grafiko, težke napake, zasnovo.
- **Več agentov samo za trke**: do 5 agentov, preverjanje z več agenti **enkrat**, na koncu teme pred `main`; vmes in drugje en agent.
- **Poraba 100 % 12 h pred iztekom** (`docs/varcevanje.md`, »Poraba«): pod ciljem ena seja več, nad ciljem nobene nove.
- **Fizika vožnje se ne spreminja** (samo trki; izjemi po »ok« na predogledu: »Dež in sneg« in #605, hitrejši tekmeci na Super težki in Težki, `docs/odlocitve.md`): avto brez dotika vozi enako.
- Čakanje: na teste `subscribe_pr_activity`; drugo v zbirko `cakanje`; brez `sleep`.

## Tabla (issue #382) in račun
- Račune imenuj **biketraveler**, **jure.kopac26**, **partyslo**, **croatiadata** (nikoli polnega emaila). Tabla se bere **2× na dan** (biketraveler 6.15 in 18.15, partyslo 7.15 in 19.15, jure.kopac26 8.15 in 20.15; croatiadata 4×: 3.15, 9.15, 15.15, 21.15), majhna sveža seja; komentar konča z nogo `---` / `_Generated by [Claude Code](https://claude.ai/code)_`.
- **Matejeve odločitve** (komentar »Matej (jure.kopac26)«, lastnik OWNER) izvede koordinacija računa in odgovori v eni vrstici.
- Proge so v vrsti zadnje, za njimi nova mapa in misije (zaustavljene do 2.0). Pred izidom vse nedokončano za gumb **NEUPORABNO**.
- **Prednost: fizika (trki) in grafika** (biketraveler, jure.kopac26); partyslo in croatiadata nove proge s seznama za 1.0, ena proga na državo (croatiadata ima iste meje: 2 seji s kodo, 6 tem; stran Odločitve 4). **Proge ne po predlogi: vsaka proga svoja raziskava in svoj značaj** (da si niso podobne).

## Kje je kaj
- Orodje za napake (`js/napake.js`): samo slovenščina, sklopa 0 in 8 odložena; slik in seznamov napak ne shranjuj.
- `docs/kazalo.md`: samo »Na kratko«, ostalo z grepom; velikih datotek ne beri v celoti. O progah `docs/proge-pregled.md`. Orodje za napake: `docs/orodje-za-napake.md`.
- Žetoni: odločitve enkrat v docs; slike samo za vprašanja in ob koncu (≤300 KB); opis PR do ~20 vrstic. V `docs/vrsta.md` celica do ~2 stavka, starejše v `docs/arhiv/vrsta-zgodovina.md`.
