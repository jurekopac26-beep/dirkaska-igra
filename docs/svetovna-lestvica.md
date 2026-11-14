# Svetovna lestvica na lastnem strežniku (načrt)

Odločitev uporabnika 8. 11. 2026 ob ~18.20 (pogovor z Matejem, račun jure.kopac26): »Svoj strežnik za izid 1. 2.« Rekordi vseh igralcev so na enem mestu, lestvica deluje na spletu in pozneje v aplikaciji (Google Play). Uporabnik je ob odločitvi vedel, da so potrebni pravilnik o zasebnosti, zaščita pred goljufanjem (preverjanje posnetka vožnje), filter vzdevkov in majhen strošek.

**Rekordi in podatki igralcev nikoli ne gredo v repozitorij** (javen): ne v datoteke, ne v teste, ne v dnevnike ali artefakte GitHub Actions. V kodi, testih in slikah so samo izmišljeni vzdevki (Lisica, Turbo Tina, Kapitan K …). Stroški niso v tem dokumentu (stran Odločitve računa jure.kopac26 in sporočilo Mateju).

Uporabnik je 9. 11. 2026 izbral priporočene možnosti (razdelek »Odločitve uporabnika«): Cloudflare, kronometer na cestah in najboljši krog na dirkališčih, javni duhovi prvih 100. Koda se začne po tedenskem načrtu (Matej), seje po razdelku »Seje in časi«.

## Na kratko

- Igralec se pridruži z enim dotikom (soglasje in povezava na pravilnik); od takrat igra vsak nov osebni rekord z vzdevkom, avtom in posnetkom vožnje pošlje na strežnik. Brez računa in gesla: identiteta je par ključev, ki ga igra že ima za lestvico prijateljev.
- Strežnik ob oddaji v nekaj milisekundah preveri podpis, obliko in fizikalno mejo časa. Vsak čas nato **ponovi v Node** (opravilo na GitHubu po urniku, vsako uro): ista koda igre, isti vnos igralca, isti čas na tisočinko. Javno so vidni samo preverjeni časi.
- Za to mora igra med vožnjo zapisati **vnos igralca**, kot gre v jedro (vrednosti `P.in*` po občutljivosti, nagibu telefona in pomoči pri volanu; prestave; »postavi nazaj na cesto«), po korakih fizike, in voziti s ponovljivim naključjem (`opts.repro`). Danes zapiše samo položaje (duh, posnetek), zato je to prvi korak kode.
- Gostitelj (izbira uporabnika 9. 11.): **Cloudflare** (Workers + D1 + R2, podatki v EU); ponovitve voženj tečejo na GitHubu (javni repozitorij: brez stroška, vsaka različica igre z `git worktree`, prijava z GitHub OIDC brez skrivnosti).
- Vzdevki: filter ob vnosu in na strežniku, prijava vzdevka, skrivanje, omejitev pošiljanja, brisanje vseh podatkov z enim dotikom.
- Brez interneta igra deluje kot zdaj: rekordi čakajo v vrsti in odidejo ob naslednji povezavi, lestvica pokaže zadnje shranjeno stanje.

## Kaj že obstaja (ni podvajanja)

Pregledano 8. 11. 2026 na `main` (64292f9):

- **Lestvica** (`buildBoardScreen` v `js/game.js`, v meniju gumb *Leaderboard*, `game:to-board` v `js/menu.js`): tvojih 10 najboljših voženj kronometra in rekordi, samo tvoji časi, z razdelkom Prijatelji.
- **Rekordi** (`tdgp-records`, `saveRecords` v `js/game.js`): ključ `recKey` je proga ali `recId`, način (če ni privzeti), `-wet` pri dežju in fizika (`@cs` ali `@nova`); v zapisu `bestTime`, `bestRace`, `bestLap`, `bestSplits` in `board` (10 voženj: `name`, `car`, `carId`, `time`, `splits`, `date`, `upg`). Svetovna lestvica uporabi isti ključ: vsaka lestvica primerja samo enake pogoje.
- **Lestvica prijateljev** (`js/lestvica.js`, `docs/lestvica-prijateljev.md`): par ključev ECDSA P-256 (`tdgp-lp-me`, gre tudi v datoteko profila), id igralca = prvih 12 znakov base64url(SHA-256(javni ključ)), podpis z WebCrypto, `cleanName` za vzdevek, `bound` (najhitrejši fizikalno mogoč čas proge), `keyTable` in `ownTimes`. Svetovna lestvica vse to uporabi: isti id je igralec med prijatelji in na svetu.
- **Duh rekorda** (`ghSave`, `tdgp-ghost-<ključ>`, vzorec na 0,1 s, do 600 KB) in **deljenje duha** (`#duh=`, `#izziv=`): položaji avta, ne vnos. Duh gre v javni prenos (izbira `svetovna-lestvica-posnetki` 1), za preverjanje ni dovolj.
- **Posnetek dirke** (`recd`, vzorec na 0,05 s; datoteka `.rrp` orodja za napake, `tools/posnetek.mjs`, ki jo odpre v brskalniku brez zaslona): položaji vseh avtov, ne vnos.
- **Ponovitev v Node**: `tests/lib/core.js` (`loadCore` naloži jedro brez DOM; z `GAME_ROOT` tudi starejšo različico igre) in `tests/lib/sim.js` (korak 1/120 s kot `STEP` v `js/game.js`, ponovljivo naključje). `Core.Race` z `opts.repro` jemlje naključne dogodke iz semena (`Race.rnd`), vnos igralca je v `inSteer`, `inThr`, `inBrk`, `inHand`, `digitalSteer`. Igra vnos vsake sličice uporabi za vse korake fizike v njej (`stepRace(STEP, inp)`), zato ga je mogoče zapisati po korakih.
- **Meritev v Node** (8. 11. 2026, Node 22): nalaganje jedra ~0,3 s (6,6 MB skript do `js/core.js`, 2,7 MB stisnjeno), gradnja proge ~0,1 s, vožnja enega kroga z avtopilotom Bathurst (136 s) 0,19 s, Spa (154 s) 0,13 s, Pikes Peak (182 s) 0,14 s procesorja. Ena ponovitev torej ~0,5 s, 100 ponovitev ~1 minuta.
- **Dirka s prijateljem** (`js/net.js`): javni strežnik PeerJS samo poveže telefona (WebRTC), ničesar ne hrani. Za lestvico ni uporaben, je pa del obrazca Data safety za celo igro (spodaj).

## Kaj se shrani (in česa ne)

| podatek | vsebina | zakaj |
|---|---|---|
| id igralca, javni ključ | 12 znakov in 87 znakov (iz `tdgp-lp-me`) | podpis oddaje: nihče ne odda ali izbriše v tujem imenu |
| vzdevek | 3–16 znakov, filter | prikaz na lestvici |
| ključ lestvice | `recKey`: proga, način, vreme (suho, mokro), fizika | ločene lestvice za enake pogoje |
| čas, vmesni časi | ms | razvrstitev, hitri pregled |
| avto, nadgradnje, pomoč | id avta, stopnje motor, gume, zavore, aero; stopnja pomoči (`ASSISTS`) | prikaz, ponovitev |
| različica igre | žig, kot ga pove poročilo `RRA-NAPAKE` (`node tools/stamp.js --find <žig>` najde commit) | ponovitev z isto kodo |
| družina pogona brskalnika | V8, JavaScriptCore ali Gecko (ne cel niz User-Agent) | dovoljeno odstopanje ponovitve |
| posnetek | vnos po korakih (stisnjen, ~10–40 KB), duh (~20–60 KB), seme | preverjanje; duh javen pri prvih 100 |
| čas oddaje, stanje | `caka`, `ok`, `zavrnjeno` (z razlogom), `sumljivo` | potek preverjanja |
| prijave vzdevka | id prijavitelja, čas | filter po prijavah |

Ne shrani se: pravo ime, e-pošta, telefon, lokacija, imenik, oglasni id, cel niz User-Agent. Naslov IP strežnik vidi ob vsakem zahtevku (tako deluje splet); shrani samo njegov zgoščen odtis z dnevno menjano soljo za omejitev pošiljanja in ga izbriše po 48 urah.

Najboljši krog na dirkališču šteje samo iz vožnje brez tekmecev na progi (kvalifikacije, če je igralec v njih sam, sicer nov kratek način *Hot lap*, ki ga doda seja igre): krog v dirki je odvisen od tekmecev AI in se ponovi težje.

Na igralca in lestvico ostane samo najboljši čas (izboljšava zamenja starega, stari posnetek se izbriše). Posnetek ostane pri časih med prvimi 100 na lestvici in njihov duh je javen (`GET /v1/duh`, izbira `svetovna-lestvica-posnetki` 1); drugi se po preverjanju izbrišejo.

## Zaščita pred goljufanjem

Igra in repozitorij sta javna: kdor hoče, lahko pošlje izmišljen zahtevek. Zato strežnik nobenemu času ne verjame na besedo.

### 1. Ob oddaji (strežnik, nekaj ms procesorja)

- Podpis z igralčevim ključem, oblika (kot `chalOf` in `readPacket`), velikosti (posnetek do 600 KB), znan ključ lestvice in avto, nadgradnje v mejah garaže.
- Čas ni hitrejši od fizikalne meje proge (`Lestvica.bound`; meje vseh ključev za vsako različico izračuna orodje ob namestitvi strežnika, ker strežnik jedra igre ne nalaga), vmesni časi naraščajo in vsak odsek je nad svojo mejo.
- Posnetek se ujema s časom: število korakov vnosa = čas × 120 (±1), število vzorcev duha = čas / 0,1 (±1), hitrost med vzorci duha ni večja od 1,15 × največje hitrosti vozil igre, prevožena pot je blizu dolžine proge.
- Omejitev pošiljanja (spodaj). Oddaja, ki pade, dobi razlog (igra ga pokaže v eni vrstici); veljavna dobi stanje `caka` in je do ponovitve vidna samo igralcu (»čaka na preverjanje«).

### 2. Ponovitev vožnje v Node (po urniku)

- Opravilo `.github/workflows/lestvica-preveri.yml` (urnik vsako uro in ročni zagon) pokliče `tools/lestvica-preveri.mjs`: od strežnika dobi čakajoče oddaje **brez vzdevkov in id-jev igralcev** (samo številka oddaje, ključ, nastavitve vožnje, žig, vnos, duh), za vsak žig pripravi različico igre (`git worktree` na commit iz `stamp.js --find`, `GAME_ROOT`), zgradi progo, odpelje vožnjo z zapisanim vnosom in semenom ter vrne izid: `ok`, `zavrnjeno` (čas se ne ujema, pot odstopa za več kot 0,5 m, vožnja se ne konča) ali `ni-mogoce` (neznan žig: poskusi znova, po 7 dneh zavrnjeno).
- Prijava na strežnik z **GitHub OIDC**: strežnik sprejme samo žeton, ki ga GitHub podpiše za ta repozitorij, to opravilo in vejo `main`. Skrivnosti v GitHubu ni.
- Dnevnik in povzetek opravila izpišeta samo števila (»12 preverjenih, 1 zavrnjen«); opravilo ne nalaga artefaktov (javni repozitorij).
- Obremenitev: ~0,5 s na ponovitev; 3.000 oddaj na dan je ~25 minut na dan na GitHubu, ki je za javne repozitorije brez stroška. Opravilo zasede en tekač GitHub Actions za 1–3 minute na uro (testi pull requestov tečejo naprej).
- Čas pod pragom (npr. 10 % hitrejši od najhitrejšega tekmeca AI z istim avtom; prag umeri seja 3 na vožnjah uporabnika) dobi stanje `sumljivo`: viden samo igralcu, dokler ga skrbnik ne pregleda (orodje skrbnika, spodaj).

### 3. Ponovljivost med brskalniki (tveganje, prvi korak kode)

Fizika v Node in v Chromu (Android, računalnik) teče na istem pogonu V8, zato bi morala biti ponovitev natančna na bit. Safari (iPhone) in Firefox imata svoje izvedbe `Math.sin`, `Math.exp`, `Math.pow` …, zato se lahko pot po nekaj minutah razide. Prvi korak kode to izmeri: zapis vnosa, ponovitev v Node, primerjava v Chromu (Playwright) in na telefonu uporabnika (vožnja na predogledu, datoteka posnetka). Izid določi pravilo:

- V8: čas se mora ujemati na korak (1/120 s), pot na 0,5 m.
- Drugi pogoni: če se ne ujemajo natančno, velja dovoljeno odstopanje (npr. čas ±0,2 %, pot v pasu ceste) in oznaka »preverjeno približno«; če še to ne gre, se časi teh pogonov preverjajo samo s pregledom ob oddaji in so označeni.
- Če ponovitev ne bi delovala niti v V8, se načrt pred kodo strežnika vrne uporabniku (vprašanje na strani Odločitve).

**Meritev (seja 1, 13. 11. 2026, #672).** Chrome 153 (Playwright, računalnik) posname, Node 22 ponovi (`tools/lestvica-preveri.mjs`, zapis `js/vnos.js`); 31 voženj:

- Vožnje: vseh 15 pravih prog z avtopilotom do cilja (kvalifikacije na dirkališčih, vožnja na čas na cestah; 97–495 s), dež (Spa, Belgija; Pikes Peak, ZDA), zima in poletje (Harju, Finska), zima z dežjem (Chapman's Peak, Južna Afrika), tipkovnica (Spa; Chapman's Peak), telefon z gumbi in z nagibom (Spa; Chrome kot na Androidu) in avtopilot, ki zavija v stožce in gume ob cesti, do cilja (šest voženj: Spa z 9, 52, 85, 103 in 119 od 341 podrtimi predmeti; Chapman's Peak z 2 od 194). Prej tudi testni način z 21 tekmeci (66 s).
- Isti brskalnik ali isti Node ponovi vseh 31 **do bita** (vsi povzetki stanja).
- Node ponovi 29 od 31 po pravilu za V8: cilj v istem koraku (čas enak ali do 1 ms), pot do 1e-8 m (Los Caracoles, Čile 6e-6 m; Livorno, Italija 4–8 cm v 495 s; ena od dveh voženj na Tianmenu, Kitajska 4,6 cm); tudi trki do 85 podrtih predmetov (pot do 6e-7 m; telefon z nagibom podre 2 predmeta, pot pod 1 cm). Ne ujemata se vožnji s 103 in 119 podrtimi (spodaj). Povzetki stanja se med Chromom in Nodom razidejo vedno: različici V8 se razlikujeta v zadnjem bitu 21 od 24 funkcij `Math` (`sin`, `cos`, `exp`, `pow`, `atan2` …; enake so `sqrt`, `hypot`, `fround`), zato je »do bita« samo v isti različici pogona in preverjanje (seja 3) primerja po pravilu, ne po bitih. Z `--jitless` enak izid.
- **Vožnji s ~100 podrtimi predmeti se ne ujemata** (pravilo zgoraj: načrt gre pred kodo strežnika nazaj uporabniku, vprašanje `svetovna-lestvica-trki`): pri 119 podrtih Node pripelje v cilj 30 korakov (0,25 s, 0,13 %) prej, pot se razide do 12 m; pri 103 Node do koraka cilja iz zapisa (179,8 s) cilja ne doseže, pot do 14 m; pri 85 se 138 odgovorov tal ne ujema z zapisom, pot pa ostane pod 1e-6 m (razhod je tem verjetnejši, čim več predmetov je hkrati budnih). Sled korak za korakom (119): do 69 s razlika samo v zadnjih bitih (1e-11 m); v koraku 8253 (68,8 s) podrt predmet v Chromu zaspi korak prej; v koraku 9018 (75,2 s) se število žrebov naključnih števil dirke razide za enega. Predmeti in avto si delijo en tok (`race.rnd`: sunek avta ob dotiku predmeta, vrtenje in lom predmetov), zato od tam vsak naključni dogodek dobi drugo število; 1 cm v 99 s, 0,5 m v 134 s. Pragovi pri predmetih (mirovanje, odboj, stik) zadnji bit spremenijo v cel korak.
- Poskus (samo v seji; igra in fizika nespremenjeni): mulberry32 se da preskočiti na n-ti žreb; če ponovitev ob vsakem koraku vzame število žrebov iz zapisa (ista števila kot v igri), razhod pade z 12 m na 0,45 m, cilj pa je še 1 korak (8 ms) pozneje; lega zaspalih predmetov iz zapisa ne pomaga. Ostanek so stiki avta z budnimi podrtimi predmeti. Velikost te vožnje: 882 KB JSON, 267 KB stisnjeno, od tega ~250 KB odgovori tal (30.751 parov za 120 predmetov), brez njih 19 KB.
- Možnosti za sejo 2 in 3 (vprašanje `svetovna-lestvica-trki`, 13. 11., v pogovoru seje; odgovor zapisan tudi v opisu #672): (1) na lestvico čas iz Node, vožnja s trki, ki se ne ujema na korak, dobi oznako »preverjeno približno« (±0,2 %, kot drugi pogoni), seja 3 doda usklajen žreb (zapis hrani število žrebov) in tla zgradi v Node (manjši zapis); (2) tema Trki da vsakemu predmetu in trku svoje naključno število (kot `XROLL`), tako se ponovitev ujema tudi s trki, a to je sprememba fizike trkov; (3) vožnja s podrtimi predmeti, ki se ne ujema, ne gre na lestvico. **Odgovor 13. 11. ob 11.06: (1)** (Odločitve uporabnika spodaj).
- Popravki iz meritve: (1) prag časa cilja je korak (1/120 s), kot pravi pravilo (Tianmen: 0,95 ms); (2) podrt predmet se v drugem pogonu premakne malo drugače in vpraša tla drugačno število krat: odgovori tal so zapisani za vsak predmet posebej, manjkajoči ali odvečni se štejejo (`tla`, v istem pogonu 0) in vožnja ni več »natančna«, zavrne pa jo šele čas ali pot (prej je padla vožnja s telefonom); (3) ovoj tal za zapis je v igri izgubil `inset` (trdna kulisa pred ograjo, `js/world.js`, propSolid): zdaj ga prepusti, zapis ga shrani in ponovitev obnovi.
- Telefon (Android Chrome, iPhone Safari; Safari ima svoj pogon): preizkus uporabnika, vprašanje `svetovna-lestvica-telefon` (13. 11., v pogovoru seje, ker croatiadata nima strani Odločitve; navodila v opisu #672). Odgovor 13. 11. ob 11.06: #672 gre po vrsti na `main`, uporabnik preizkusi Android in iPhone na objavljeni igri; oznaka »predogled« (Matej jo je 13. 11. odstranil, hkrati gredo 3 predogledi) ni potrebna.
- Velikost zapisa: z avtopilotom 4–44 KB stisnjeno (gzip; največ Nürburg, Nemčija, 446 s), z vnosom, ki se spremeni vsak korak, 1,08 MB JSON (376 KB stisnjeno, Spa), torej več od ~10–40 KB v tabeli »Kaj se shrani«. Telefon spremeni vnos največ enkrat na sličico (60/s, pol korakov). Meja zapisa 300.000 dogodkov (~40 min z avtopilotom, ~20 min z vnosom vsak korak) zadošča za vožnje lestvice. Zgoščeno obliko brez izgube (npr. binarno) in mejo velikosti določi seja 2 po meritvi s telefona.
- Ponovitev v Node: 0,2–1,4 s z JIT (prva z gradnjo proge ~2,4 s), 1,5–14 s z `--jitless`, kot v razdelku 2.
- Za sejo 2 in 3: na lestvico gre čas iz ponovitve v Node (odjemalec bi sicer v okviru koraka čas skrajšal do 8 ms). Odgovore tal za podrte predmete in naključna števila klicev (obraba kariere) da zapis odjemalca; vplivajo samo na podrte predmete in obrabo, zato seja 3 preveri, da so verjetni (ali tla zgradi v Node sama).

### 4. Česar ni mogoče preprečiti

Vožnja, ki jo računalnik izračuna sam (popoln vnos, »TAS«), se ponovi pravilno. Proti njej pomagajo meja `sumljivo`, prijave in brisanje skrbnika. Popolne zaščite nima nobena igra; cilj je, da so ponarejeni zahtevki in spremenjena igra brez možnosti, ostalo pa redko.

Pozneje, po želji: Play Integrity (aplikacija iz Google Play, preveri jo strežnik pri Googlu) in Cloudflare Turnstile (splet) proti samodejnim zahtevkom. Za Play Integrity je potreben ključ Google Cloud (skrivnost, `request_credential`).

## Vzdevki: filter, prijava, skrivanje

- **Ob vnosu** (igra): `cleanName`, 3–16 znakov, črke (tudi č, š, ž …), številke, presledek, `-_.`; brez povezav, e-pošte, `@` in nizov 5 ali več števk; lokalni kratki seznam za takojšen odziv. Okno svetuje vzdevek namesto pravega imena. Privzeti vzdevek (»Igralec«) se pred pridružitvijo zamenja.
- **Na strežniku**: normalizacija (NFKC, male črke, brez strešic, 0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s, podvojene črke, brez ločil) in primerjava z odprtim seznamom žaljivih besed v več jezikih (vir z licenco gre v `README.md` pod »Zasluge«), dopolnjenim s slovenskimi, hrvaškimi, srbskimi, nemškimi in italijanskimi; rezervirana imena (admin, moderator, skrbnik, uradno, ime igre, »Voznik #…«). Zavrnjen vzdevek: igra pove, da ni dovoljen, brez razloga.
- **Prijava**: vsaka vrstica lestvice ima *Report name*; en igralec prijavi drugega enkrat. Po 3 prijavah različnih igralcev je vzdevek skrit (»Voznik #A1B2«), dokler ga skrbnik ne pregleda (obnovi, pusti skritega ali igralcu prepove oddajo).
- **Skrij voznika** (samo v telefonu, kot skriti prijatelji): igralec ga ne vidi več.
- Google Play pri vsebini uporabnikov zahteva prijavo, blokiranje in moderiranje ter pogoje, ki žaljivo vsebino prepovedujejo: vse štiri so v tem načrtu (pogoji spodaj).
- **Skrbnik**: `tools/lestvica-skrbnik.mjs` (seznam prijav in sumljivih časov, skrij in pokaži vzdevek, prepovej in dovoli oddajo, sprejmi in zavrni čas, izbriši igralca; `streznik/svetovna-lestvica/README.md`, »Skrbnik«) dela prek `wrangler` z istim ključem Cloudflare kot namestitev; drugega gesla ni. Pregled prijav enkrat na teden (seja s tem orodjem, model Sonnet) ali ko jih je več kot 10.

## Omejitev pošiljanja

Števci v D1 po id-ju igralca in po zgoščenem IP na uro in dan: do 20 oddaj na uro in 100 na dan na igralca, 3 spremembe vzdevka na dan, 10 prijav na dan; z istega IP do 50 novih igralcev na dan in 300 pisanj na minuto (mobilna omrežja in šole si naslove delijo, zato so meje IP ohlapne). Branje lestvic je v predpomnilniku na robu omrežja (60 s) in ni omejeno posebej. Prek meje strežnik odgovori 429 s časom ponovitve; igra oddajo pusti v vrsti.

## Brisanje na zahtevo in hramba

- V igri: Nastavitve → *Delete my world leaderboard data*: podpisan zahtevek takoj izbriše igralca, vse njegove čase, posnetke in prijave, ki jih je oddal; igra pozabi, da je pridružen (ključ za prijatelje ostane).
- Brez telefona: zahteva po e-pošti na naslov iz pravilnika z vzdevkom in id-jem igralca (igra ga pokaže v Nastavitvah); skrbnik izbriše v največ 30 dneh (GDPR: en mesec). Pravilnik ima razdelek z navodili (Google Play zahteva spletno povezavo za izbris, kadar igra ustvari nekaj podobnega računu).
- Hramba: čas ostane, dokler je na lestvici ali ga igralec ne izbriše; igralec brez oddaje 24 mesecev se izbriše; zgoščeni IP 48 ur; varnostne kopije baze (D1 Time Travel) do 30 dni.
- Nadgradnja igre ne briše ničesar; velika sprememba fizike lahko pozneje začne novo sezono (odločitev uporabnika, ne v tem načrtu).

## Gostitelj: primerjava

Brezplačne meje po uradnih straneh, preverjeno 8. 11. 2026 (spreminjajo se; seja strežnika jih preveri znova).

| | 1 · Cloudflare (Workers, D1, R2) | 2 · Supabase (Postgres, Edge Functions, Storage) | 3 · Firebase (Firestore, Cloud Functions, Storage) |
|---|---|---|---|
| brezplačno | 100.000 zahtevkov na dan, 10 ms procesorja na zahtevek in opravilo, 5 opravil po urniku; D1 do 10 baz po 500 MB (skupaj 5 GB), ~5 milijonov prebranih in 100.000 zapisanih vrstic na dan (od 1. 9. 2026 poizvedbe nad mejo do polnoči UTC padejo); R2 10 GB, brez plačila za prenos | baza 500 MB, datoteke 1 GB, ~5 GB prenosa na mesec, 2 projekta; Edge Functions 2 s procesorja na zahtevek (150 s skupaj) | Firestore 1 GB, 50.000 branj, 20.000 pisanj in 20.000 brisanj na dan; Cloud Functions in shramba datotek samo s paketom Blaze (plačilo po porabi z brezplačno kvoto, potrebna kartica) |
| EU in GDPR | D1 z jurisdikcijo `eu` (izbira ob ustvarjanju; podatki ostanejo v EU), vedro R2 z jurisdikcijo EU; koda teče na robu omrežja blizu igralca; pogodba o obdelavi (DPA) je del pogojev | projekt v EU (npr. Frankfurt), baza in datoteke tam; DPA | Firestore v EU (`eur3` ali `europe-west*`), funkcije v EU; Googlovi pogoji obdelave |
| procesor za preverjanje | hitri pregled gre v 10 ms; ponovitve na GitHubu (spodaj) | hitri pregled zlahka; ponovitev ~0,5 s bi šla v 2 s, a samo za eno različico igre | dovolj (minute), samo z Blaze |
| vzdrževanje za enega lastnika | brez strežnikov in brez zaustavitve; namestitev z `wrangler` iz seje; SQL (SQLite); dnevne meje so trde (nad mejo zavrnitev) | brezplačen projekt se po 7 dneh brez dejavnosti ustavi (opravilo po urniku ga drži budnega); Postgres s pravili vrstic (RLS) | brez kartice ni funkcij; obračun po prebranem dokumentu; SDK Firebase v igri doda svoje identifikatorje (Data safety); najboljša povezava s Play Integrity |

**Ponovitve voženj pri vseh treh tečejo na GitHubu**: strežnik bi moral nositi jedro igre (6,6 MB) za vsako različico, ki jo igralci še uporabljajo (spletna stran se spremeni večkrat na dan); opravilo na GitHubu vzame katerikoli commit in obstoječe orodje (`tests/lib/core.js`).

**Izbira uporabnika 9. 11. 2026: 1 · Cloudflare** (priporočeno). Hitri pregled je dovolj lahek za brezplačne meje, podatki so v EU, ni zaustavitve ne kartice za začetek, koda strežnika je navaden JavaScript kot igra. Supabase je dobra druga izbira (prava baza Postgres, več orodij), Firebase pa zahteva kartico in doda SDK z identifikatorji.

## Zgradba (pri priporočenem gostitelju)

- `streznik/svetovna-lestvica/`: koda Workerja (moduli ES, brez odvisnosti), `schema.sql` (tabele `igralci`, `casi`, `prijave`, `omejitve`), `wrangler.toml` (samo imena in id-ji, brez skrivnosti), seznam besed za filter, meje časov (`tools/lestvica-meje.mjs` jih izračuna iz `Lestvica.bound`). Koda strežnika je javna: varnost ni v skrivanju kode.
- Vmesnik (JSON prek HTTPS, CORS za stran igre na GitHub Pages in za aplikacijo; TWA ima isti izvor kot stran, ovoj s spletnim pogledom npr. `https://localhost`):
  - `GET /v1/lestvica?kljuc=&od=&n=` (prvih 100, predpomnilnik 60 s) in `GET /v1/mesto?kljuc=&id=` (tvoje mesto: »#123 od 4.567«);
  - `POST /v1/oddaja`, `POST /v1/vzdevek`, `POST /v1/izbris` (podpisani), `POST /v1/prijava`;
  - `GET /v1/duh?kljuc=&id=` (duh časa med prvimi 100);
  - `GET` in `POST /v1/preveri` (samo z žetonom GitHub OIDC).
- Naslov: `<ime>.<podračun>.workers.dev` (brez lastne domene); lastna domena je mogoča pozneje.
- Posnetki v R2 (`posnetki/<ključ>/<id>`), vrstice v D1.

## Pravilnik o zasebnosti in pogoji

- Strani `zasebnost.html` (slovensko) in `privacy.html` (angleško) na strani igre (besedilo pravilnika je javno in sme biti v repozitoriju), povezava v Nastavitvah, na zaslonu pridružitve in v Google Play.
- Vsebina: kdo je upravljavec (ime, kot ga izbere uporabnik, in kontaktni naslov e-pošte, ki ga določi uporabnik); kateri podatki (tabela zgoraj) in zakaj; pravna podlaga (izvedba storitve, ki jo igralec izbere; zakoniti interes za zaščito pred goljufanjem in zlorabo); obdelovalci (gostitelj; GitHub za ponovitve, ki dobi posnetke brez vzdevkov in id-jev); prenos izven EU (standardne pogodbene klavzule, okvir EU-ZDA); hramba; pravice (dostop, popravek vzdevka, izbris, ugovor, pritožba pri Informacijskem pooblaščencu); izbris brez telefona; podatki ostanejo v telefonu, dokler se igralec ne pridruži (rekordi, prijatelji, profil); brez oglasov, brez sledenja, brez prodaje podatkov.
- Pogoji uporabe (kratki, na isti strani): prepoved žaljivih in tujih vzdevkov, goljufanja in samodejnih zahtevkov; skrbnik sme skriti vzdevek ali izbrisati čas.
- Mladi igralci: v Sloveniji je starost za samostojno privolitev v storitve informacijske družbe 15 let; zaslon pridružitve to pove. Ciljna starost v Google Play (otroci pod 13 pomenijo pravila Families) se odloči ob objavi.

## Google Play: Data safety (odgovori)

| vprašanje obrazca | odgovor za svetovno lestvico |
|---|---|
| Ali igra zbira ali deli podatke? | Zbira (samo ob pridružitvi lestvici); ne deli (gostitelj in GitHub sta obdelovalca, ne tretja stran) |
| Šifrirano med prenosom? | Da (HTTPS) |
| Lahko uporabnik zahteva izbris? | Da: v igri in po e-pošti (povezava na pravilnik) |
| Osebni podatki → Ime | Da: vzdevek (Google šteje vzdevek kot ime); neobvezno; namen: delovanje aplikacije |
| Dejavnost v aplikaciji → Druga dejanja | Da: časi in posnetki voženj; neobvezno; namena: delovanje aplikacije, preprečevanje goljufij in varnost |
| Naprava ali drugi ID | Da: id igralca iz naključnega ključa; neobvezno; namena kot zgoraj |
| Lokacija, stiki, finance, zdravje, sporočila, slike | Ne |
| Naslov IP | Ne shranjuje se (samo zgoščen do 48 h za omejitev); lokacija iz njega se ne izpelje; seja pred oddajo obrazca to preveri v aktualnih navodilih Google Play |

Obrazec velja za celo aplikacijo: zraven gredo še dirka s prijateljem (javni strežnik PeerJS in WebRTC vidita naslov IP in kodo sobe) in lestvica prijateljev (nič na strežnik; povezavo pošlje igralec sam).

## V igri: meni, rezultati, brez interneta

Priporočena postavitev (meni je samo angleški; če uporabnik želi izbirati, seja igre vpraša z grafičnim vprašanjem s slikami, pokonci in ležeče):

- **Izbira proge**: pogled *Friends* (4. gumb ob kamerah) dobi zavihka *Friends* in *World*; *World* pokaže prvih 5 (ležeče 6) in tvojo vrstico (»#123 of 4,567«); ob *Best time* oziroma *Best lap* značka mesta.
- **Lestvica** (*Leaderboard*): pri vsaki progi razdelek *World* (prvih 100, tvoja vrstica označena, *Race ghost* prenese duha in začne vožnjo proti njemu, *Report name*, *Hide driver*).
- **Rezultati**: »Svet: #123 (čaka na preverjanje)«; po preverjanju se mesto posodobi ob naslednjem odprtju.
- **Nastavitve**: *World leaderboard* vklop in izklop, vzdevek, id igralca, *Delete my world leaderboard data*, *Privacy policy*.
- **Pridružitev**: ob prvem odprtju zavihka *World* okno s soglasjem (»Your nickname, times and replays go to our server in the EU …«, *Join*, *Not now*, povezava na pravilnik). Brez pridružitve igra ničesar ne pošlje; lestvico je mogoče gledati tudi brez pridružitve.
- **Brez interneta**: oddaje čakajo v vrsti (`tdgp-sl-vrsta`, na lestvico samo najboljša, največ 20) in odidejo ob odprtju menija, ob dogodku `online` in po vsaki vožnji (ponovni poskus od 1 minute do 1 ure); zadnje lestvice so v `tdgp-sl-cache` (do 200 KB, ne gre v datoteko profila) z napisom »stanje ob 14.32«. Zahtevek ima rok 5 s; med dirko igra ne čaka na strežnik in ne kaže napak. Če strežnik ne dela ali je prek meje: ena vrstica »World leaderboard is not available right now«.
- Logika gre v novo datoteko `js/svet.js` (brez DOM, testi v Node); v `js/game.js`, `js/menu.js`, `css/menu.css` in `index.html` samo kratki priklopi. Besedila igre prek `tr()` s prevodi v `js/lang.js`; opis v `docs/igra.md`, vrstica v `README.md` (Nov meni), datoteke v `docs/kazalo.md`.

## Testi z lažnim strežnikom

Noben test ne kliče pravega strežnika in ne potrebuje skrivnosti.

- **Node** `tests/svet.test.js`: oddaja in podpis (ključ lestvice prijateljev), vrsta in ponovni poskusi, predpomnilnik, odgovori 200, 400, 429 in 503, zapis vnosa tja in nazaj.
- **Node** `tests/svet-streznik.test.js`: koda Workerja v Node z lažnim okoljem (D1 kot `node:sqlite` v pomnilniku z isto shemo, R2 kot `Map`, nastavljiva ura): veljavna oddaja, tuj podpis, neznan ključ, prehiter čas, neujemanje korakov, omejitve, filter vzdevkov (tudi 0→o, strešice, presledki), 3 prijave skrijejo vzdevek, izbris izbriše vse, žeton OIDC (testni ključ), CORS.
- **Node** `tests/svet-ponovitev.test.js`: vožnja z avtopilotom v Node prek istega zapisovalnika vnosa, ponovitev da isti čas in pot na vseh pravih progah s kronometrom in na dirkališčih (krog brez tekmecev, obseg 1); spremenjen vnos ali čas: zavrnjeno; starejša različica prek `GAME_ROOT`.
- **Brskalnik** `tests/browser/svet.test.mjs`: Playwright z `page.route` kot lažnim strežnikom: pridružitev, zavihek *World* pokonci 360 × 640 in ležeče 640 × 360 (nič čez rob), brez povezave (zahtevki prekinjeni) vrsta, nato oddaja, odgovor 429, izbris, prijava; po spremembi menija `menu.test.mjs`, prevodi `lang.test.js`.
- Lokalno `npm run test:related`; novi testi gredo v izbiro po datotekah (`js/svet.js`, `streznik/`, `tools/lestvica-*.mjs`).

## Skrivnosti in omrežje

- Nobena skrivnost ne gre v repozitorij, v pogovor, v dnevnik ali na tablo.
- **Ključ Cloudflare** (omejen: Workers, D1, R2; brez dostopa do drugega): uporabnik ga ustvari na Cloudflaru in vnese v obrazec, ki ga odpre seja (`request_credential`, gostitelj `api.cloudflare.com`); posrednik okolja ga sam doda zahtevkom, `wrangler` dobi lažno vrednost. Shranjen je v okolju seje, zato ga uporabljajo samo seje tega okolja.
- **Sol za zgoščeni IP**: `openssl rand` neposredno v `wrangler secret put` (seja vrednosti ne vidi).
- **Opravilo preverjanja**: GitHub OIDC, brez skrivnosti.
- **Omrežje okolja**: `api.cloudflare.com` dovoli shranjen ključ; za preizkus po namestitvi seja potrebuje še naslov Workerja (točno ime, npr. `lestvica.<podračun>.workers.dev`): seja predlaga spremembo okolja, uporabnik jo potrdi v oknu za odobritev.

## Kaj naredi uporabnik sam

1. Odgovori na tri vprašanja (narejeno 9. 11. 2026, razdelek »Odločitve uporabnika«).
2. Odpre (brezplačen) račun pri izbranem gostitelju in ustvari omejen ključ API (navodila po korakih da seja strežnika).
3. Ključ vnese v obrazec, ki ga odpre seja (nikoli v pogovor).
4. Zvečer na računalniku potrdi spremembo omrežja okolja (okno za odobritev, ki ga sproži seja).
5. Določi kontaktni naslov e-pošte za pravilnik (posebej za igro, ne zasebnega) in ime upravljavca, kot naj bo v pravilniku.
6. Ob prvem koraku kode na telefonu odpelje 2 vožnji na predogledu in pošlje datoteko posnetka (preizkus ponovljivosti; če ima iPhone, še eno na njem).

## Seje in časi

Vsaka seja je nova seja z vejo `svetovna-lestvica/<korak>` in osnutkom pull requesta; na `main` po vrsti (`docs/vrsta.md`; ta tema ni proga, zato gre pred progami).

| # | Seja | Kaj | Model | Ure | Pogoj |
|---|---|---|---|---|---|
| 0 | načrt (ta) | ta dokument, vprašanja | Opus | 1,5 | 8. 11. 2026 |
| 1 | ponovljivost | zapis vnosa ob vožnji (`opts.repro`, seme), `tools/lestvica-preveri.mjs` brez strežnika, meritev Chrome in telefon | Opus, max | 6 | po tedenskem načrtu (odgovori 9. 11.) |
| 2 | strežnik | Worker, D1, R2, vmesnik, pregled ob oddaji, filter, omejitve, izbris, orodje skrbnika, testi z lažnim strežnikom, namestitev | Opus, max | 8 | račun, ključ in omrežje (točke 2–4 zgoraj) |
| 3 | preverjanje | opravilo na GitHubu (urnik, OIDC, starejše različice), stanje `sumljivo`; pri trkih usklajen žreb in oznaka »preverjeno približno« (odgovor 13. 11.) | Opus, max | 4 | po 1 in 2 |
| 4 | igra | `js/svet.js`, oddaja po rekordu, zavihek *World*, Lestvica, rezultati, Nastavitve, brez interneta, prevodi, brskalniški test | Opus, max | 10 | po 2 |
| 5 | pravilnik | `zasebnost.html`, `privacy.html`, pogoji, odgovori Data safety, `README.md` (Zasluge), `docs/igra.md`, kazalo | Sonnet | 3 | po 4 in točki 5 zgoraj |
| 6 | preizkus | uporabnik na predogledu in telefonu, popravki | Sonnet | 2 | po 5 |

Skupaj ~34 ur. Časovnica do izida 1. 2. 2027: seji 1 in 2 v novembru, 3 in 4 do sredine decembra, 5 do konca decembra, preizkus v prvi polovici januarja, na `main` najpozneje 20. 1. 2027 (rezerva pred izidom). Seji 1 in 4 se dotikata `js/game.js` (seja 1 tudi `js/core.js`, samo zapis vnosa in `repro`), zato gresta na `main` druga za drugo.

## Odločitve uporabnika (stran Odločitve 2, jure.kopac26)

Odgovori 9. 11. 2026 v pogovoru seje (klikljiva izbira), zapisani na stran Odločitve 2:

- `svetovna-lestvica-gostitelj` = **1 · Cloudflare**: Workers, D1 z jurisdikcijo `eu`, vedro R2 v EU; ponovitve voženj na GitHubu.
- `svetovna-lestvica-obseg` = **1 · kronometer na cestah in najboljši krog na dirkališčih**, vse prave proge; krog šteje samo iz vožnje brez tekmecev (kvalifikacije ali nov kratek način *Hot lap*).
- `svetovna-lestvica-posnetki` = **1 · javni duhovi prvih 100** na vsaki lestvici (`GET /v1/duh`, v igri *Race ghost*).

Odgovori 13. 11. 2026 ob 11.06 v pogovoru seje 1 (klikljiva izbira; croatiadata nima strani Odločitve, zato zapisani tudi v opisu #672):

- `svetovna-lestvica-telefon` = **1 · `main` zdaj**, preizkus na objavljeni igri, **Android in iPhone**.
- `svetovna-lestvica-trki` = **1 · čas iz Node**: vožnja s trki, ki se ne ujema na korak, dobi oznako »preverjeno približno« (±0,2 %); seja 3 doda usklajen žreb.

## Stanje

- 8. 11. 2026: načrt in vprašanja (seja »Svetovna lestvica: načrt strežnika za izid 1. 2. (8. 11.)«, `session_01Ck3D3ULsayVNWnkwgbUbj7`, naloga Mateja); koda po odgovorih.
- 9. 11. 2026: odgovori uporabnika (vse tri priporočene možnosti), načrt dokončan. Naslednji korak: seja 1 (ponovljivost) po tedenskem načrtu.
- 13. 11. 2026: seja 1 (ponovljivost; croatiadata, prevzem od jure.kopac26; osnutek #672, veja `svetovna-lestvica/ponovljivost`): `js/vnos.js` (zapis vnosa ob sami vožnji in v testnem načinu, v glavi posnetka `.rrp`, brez imen), `tools/lestvica-preveri.mjs`, testa `tests/vnos.test.js` in `tests/browser/vnos.test.mjs`; meritev v razdelku 3 (31 voženj na 15 pravih progah; pravilo za V8 velja za 29, ne za vožnji s 103 in 119 podrtimi predmeti; popravki: prag časa cilja, tla podrtih predmetov, `inset` tal). Odgovori 13. 11.: `main` zdaj, telefon (Android in iPhone) na objavljeni igri; vožnje s trki: čas iz Node, oznaka »preverjeno približno«. Odprto: preizkus na telefonu po `main`. Naslednji korak: seja 2 (strežnik).
- 14. 11. 2026: seja 2 (strežnik; jure.kopac26, tema prevzeta nazaj 13. 11.; osnutek #688, veja `svetovna-lestvica/streznik` iz #672, na `main` za #672): v `streznik/svetovna-lestvica/` Worker brez odvisnosti (vmesnik `/v1/…`: lestvica, mesto, duh, stanje, prijava, vzdevek, oddaja, moje, izbris; ovoj s podpisom ECDSA P-256, pregled ob oddaji, filter vzdevkov, omejitve pošiljanja po zgoščenem IP, izbris na zahtevo, dnevno pospravljanje; za opravilo preverjanja z GitHub OIDC `/v1/preveri` in `/v1/meje`), shema D1 in `wrangler.toml` brez ključev; `tools/lestvica-meje.mjs`; `tools/lestvica-preveri.mjs --krog` (časi, ki čakajo na strežniku: ponovitev v Node, vožnja s trki »preverjeno približno« ±0,2 %, izidi po 200); test `tests/lestvica-preveri.test.js` (57 preverjanj z lažnim strežnikom, brez omrežja in ključa); zasluge za seznam besed LDNOOBW (CC BY 4.0) v `README.md`. Fizika vožnje ostane enaka. Namestitev čaka na ključ Cloudflare (samo `request_credential`). Naslednja seja (Opus, napor high): test strežnika `tests/svet-streznik.test.js` (lažni D1 na `node:sqlite`, R2 kot `Map`, nastavljiva ura `env.URA`, OIDC s testnim ključem prek `env.FETCH`, CORS; pravilo RELATED za `streznik/` in `tools/lestvica-meje.mjs`), orodje skrbnika `tools/lestvica-skrbnik.mjs`, `streznik/svetovna-lestvica/README.md` z razdelki, na katere kaže koda (»Vmesnik«, »Ovoj«, »Pregled ob oddaji«, »Vzdevki«, »Omejitve«, »Brisanje«, »Preverjanje«, »Namestitev«), `tests/README.md` in kazalo; vprašanje o ključu Cloudflare na strani Odločitve 2 (dovoljenja Workers Scripts, D1 in Workers R2 Storage: Edit, Account Settings: Read; korak za korakom). Opombe za strežnik: igralec po izbrisu podpiše z novejšim `sent`; prijava ne prepreči več ključev ene osebe, omejitev po zgoščenem IP lahko zadene skupni IP (CGNAT, mobilna omrežja); pospravljanje in `mesto` bereta cele tabele (izmeri ob prvih tisočih vrstic); manjkajoč posnetek v R2 opravilo zavrne (`ni-posnetka`); D1 Time Travel hrani do 30 dni; CORS ni varnostna meja. Za sejo 3: vmesni časi in krogi, delovna kopija za vsak žig, preverjanje pasu ceste, pravila za »sumljivo«, `setProps` in `pf` glede na progo, dogodki, ki še niso dovoljeni (`setProps` po startu, `pitLaunch`, `noReverse`, menjave sredi vožnje razen `l.off`), deli avta v paketu, meja časa opravila (n ≤ 1e6), vožnja brez cilja na nestrogem stroju (po 7 dneh zavrnjena), usklajen žreb pri trkih, `.github/workflows/lestvica-preveri.yml`. Odprto: ali R2 zahteva plačilno sredstvo.
- 14. 11. 2026: seja 3 (jure.kopac26, osnutek #688): test strežnika brez omrežja `tests/svet-streznik.test.js` (124 preverjanj: lažni D1 na `node:sqlite` in R2, vse poti, zavrnitve, OIDC, prijave, filter, izbris, omejitve, pospravljanje, skrbnik, skupne konstante z igro), skrbnik `tools/lestvica-skrbnik.mjs`, `streznik/svetovna-lestvica/README.md` (vmesnik, ovoj, namestitev, brezplačni paket), vprašanje `lestvica-cloudflare` na strani Odločitve 2 (ključ Cloudflare ali namestitev sam). Naslednje: opravilo `.github/workflows/lestvica-preveri.yml`; namestitev po odgovoru uporabnika.
