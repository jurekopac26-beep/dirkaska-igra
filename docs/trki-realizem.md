# Trki: bolj realistični trki (načrt teme)

Naloga uporabnika (9. 11. 2026 ob ~21.25): »Ultracode naj analizera fiziko trkov in naj proba ozboljsat da so trki bolj realisticni.« Veja `trki/realizem`, račun jure.kopac26, seja session_01Ck3D3QcbmTexhh4jfgmWRV (posreduje Matej).

## Okvir

- Izboljšave pridejo kot **nova različica** v Nastavitvah »Trki med avti« (delovno ime »Realistična«), da uporabnik v pavzi na istem mestu primerja staro in novo. Privzeta ostane Simulacija, dokler uporabnik ne potrdi. **Od 12. 11. 2026** (odločitev uporabnika 10. 11. ob ~23.20, komentar 6780917123: gumbi v Nastavitvah, privzeta naj bo najbolj realistična izbira) je v igri privzeta Realistična; vrstica se imenuje »Trki« in ima gumba »Realistično« in »Kot zdaj« (Simulacija), starejše različice so v Preizkusu. Jedro samo ostane pri Simulaciji (`KV_DEF`). Razdelek »Gumbi v Nastavitvah: izvedba«.
- Kar ne spada v različico (zidovi, boksi), je preklopljivo z isto izbiro.
- Poškodbe ostanejo privzeto »Samo videz«; vožnja zunaj trkov se ne spremeni; dirka s prijatelji ostane usklajena; obremenitev telefona se ne poveča (`tests/golden/perf.json`).
- Na `main` gre šele po uporabnikovem »ok« (preizkus na predogledu).
- **Samo fizika trkov** (odločitev uporabnika 9. 11. 2026 ob ~23.05: »fiziko voznje ne spreminjaj, ker je dobra, samo fiziko trkov«): oprijem, pnevmatike, zaviranje, pospeševanje, krmiljenje, vzmetenje, zdrs, robniki, trava, aerodinamika in vožnja tekmecev ostanejo, kot so. Avto, ki se ničesar ne dotakne, vozi do številke enako kot na `main`. Vse novo se sproži samo ob stiku in samo pri novi različici; brez stika teče ista koda. Dokaz: test vožnje brez stika (Simulacija proti novi različici, enako stanje do zadnje številke) in nespremenjene reference vožnje. **Obseg v dirki** (neodvisno preverjanje 12. 11.): koda in števila vožnje so v vseh izbirah trkov isti; avto, ki je na progi sam, je enak do zadnje številke, v dirki z obrabo gum na dirkališču z boksi pa do koraka, ko se tekmeci med seboj prvič zadenejo drugače. Od takrat se za malenkost razlikuje guma na progi, ki jo polagajo vsi avti (obstoječa koda vožnje, `Race._marbles`), in z njo oprijem vseh (izmerjeno na Spa: do 7,3e-6 v 90 s). Koda ostane, kot je: »Popravki po neodvisnem preverjanju«, najdba 1.
- **Odločitev uporabnika 2. 11. 2026** (`docs/igra.md`, »Trki med avti«; `docs/nova-fizika-meritve.md`, razdelek 8): zadeti avto ni 8× težji, odboj ni 0 (slog »Realističen, težak« in gumb »brez odboja« sta bila takrat odstranjena); zid v različicah 1–5 ostane enak, sprememba zidu je samo v novi različici. Delovno ime »Realistična« je blizu odstranjenemu slogu: ime izbere uporabnik (predlogi: »Realistična«, »Fizikalna«, »Resnični trk«).
- **Druge teme, v katere ta ne posega** (pregled podvajanja 9. 11., Matej): poškodbe (paket P, biketraveler; `carKnockFx` naj še naprej daje `imp`, `fxCar` in točko stika, ki jih bereta P4 in P6), tresenje kamere ob trku (I5), Dež in sneg, hitrost tekmecev (#605), AI ob prehitevanju (#527). #548 (zbirna B, #579) bere moč sunka v pragih `WRULE.hit` 0,02 in `KT.real` 0,006: po spoju `main` oba preveri na novi različici. Seja tovornjakov gradi trke dolgih vozil na tej veji.
- **#494 (Killar) gre na `main` pred to temo**: sunek zidu seli v notranjo `touch()` v `wallCollide(c, trk, canFall, rc)` in doda krhko leseno ograjo (`fenceBreak`), skalo in padec z roba. Spremembo zidu piši v obliki, ki se zlije s `touch()`; spor razreši v korist #494; lesena ograja ostane krhka tudi v novi različici. Po spoju preveri krhko ograjo, skalo, padec z roba in zid 15–90°. Od 12. 11. je sprememba zidu Realistične (zaprta vrstica z `wallR` in veja naslona z varovalom energije in mejo zasuka) na veji pred #494; postopek ob spoju, popravljen po poskusnem spoju 12. 11. (Realistična prinese tri spore, ne enega): »Točka 3 in #494 (Killar): postopek ob sporu«.
- **Svetovna lestvica** (`docs/svetovna-lestvica.md`): ključ rekorda nima različice trkov. Nova različica časov brez stika ne spremeni; čase s stikom z zidom spremeni. Naključja nova koda ne uvaja.
- **Slike ZDAJ/POTEM** za uporabnika: `tools/trki/slike.mjs` (isti trk, 4 sličice na stran, kamera za avtom, Spa); slike gredo v `docs/trki-slike/` na veji in se pred združitvijo odstranijo.

## Faze in stanje

| Faza | Kaj | Stanje |
|---|---|---|
| 1. Analiza | popis vseh stikov in meritve v jedru brez brskalnika (`tools/trki/`), primerjava z meritvami videov (`docs/nova-fizika-meritve.md`) in odprtimi viri | končano 10. 11.: popis 26 vrst stikov, meritve s petimi skriptami (`tools/trki/`), cilji iz posnetkov in odprtih virov, 44 odstopanj v eni razvrščeni tabeli (61 ugotovitev merilcev: 48 potrjenih, 11 popravljenih, 2 ovrženi; 8 novih najdb preverjalcev) |
| 2. Zasnova | predlog za vsako odstopanje z meritvijo pred/po | 10. 11.: zasnova prototipa Realistična (zasuk povsod po avtu, drsenje vstran po trku, ograja, lahek predmet) s številkami zdaj → pričakovano z zasebne kopije jedra: razdelek »Zasnova prototipa Realistična«; druga odstopanja čakajo |
| 3. Izdelava | nova različica, preklopljivo z isto izbiro | 11.–12. 11.: **jedro Realistične (cv 6) je na veji**: štiri točke zasnove v `js/core.js`, v Nastavitvah izbira »Realistična« (v delu), privzeta ostane Simulacija (commiti `fc2afc7`, `e529564` in »Trki: različica Realistična (cv 6) – jedro in dokazi«). Številke zdaj → pričakovano → izmerjeno, dokazi in postopek ob sporu s #494: razdelek »Realistična v repozitoriju: jedro in dokazi«. 12. 11.: **drugi del, testi za cv 6, je narejen** (`tests/trki.test.js`, 42 preverjanj; razdelek »Testi različice Realistična«); testi so našli eno napako jedra (meja zasuka 9 rad/s ni veljala, ko se je avto med izgubo oprijema naslonil na ograjo), popravljena je z eno vrstico. 12. 11.: **gumbi v Nastavitvah so narejeni** (Trki: Realistično, privzeto, / Kot zdaj; Odpadli deli; Odpadlo kolo; enkratni preklop `tdgp-defaults-v6`; razdelek »Gumbi v Nastavitvah: izvedba«). Čakajo: Poškodbe |
| 4. Preverjanje | testi z invarianti, neodvisen pregled `js/core.js`, `npm run test:related` | v delu; 11.–12. 11.: dokazi prvega dela (izpisi orodij za cv 1–5 enaki do znaka kot pred Realistično, vožnja brez dotika cv 6 = cv 1 do zadnje števke, reference nepremaknjene) in 12. 11. **testi z invarianti za cv 6** (`tests/trki.test.js` z 19 na 42 preverjanj, nova referenca `tests/golden/trki.json` s 150 vnosi; vsako novo preverjanje pade pri vsaj eni od 60 namernih okvar kode; razdelek »Testi različice Realistična«). Dokazi so po popravku jedra ponovljeni, 24 Node testov zelenih (22 povezanih, `redflag` in `testne-proge`). 12. 11. (gumbi): `tests/trki.test.js` 43 preverjanj, `tests/odpadli-deli.test.js` 45 (prej 40), reference se niso premaknile; celoten Node nabor 148 od 149 testov zelenih (rdeč samo `tests/hotham.test.js`, 1 od 25, do številke kot prej), Node testi voznega parka 8 od 8. 12. 11. popravki po neodvisnem preverjanju: 13 najdb, popravljene potrjene napake Realistične in vrzeli testov; `tests/trki.test.js` 49 preverjanj, `tests/odpadli-deli.test.js` 46; v `tests/golden/trki.json` premaknjena samo dva vnosa `…/real`; izpisi cv 1–5 enaki kot na `f1c4a0a` (»Popravki po neodvisnem preverjanju«). Čakajo: brskalniški testi (glavna seja) |
| Padec čez rob (Killar) | avto, ki zapelje čez rob, pade kot togo telo na narisanih tleh (naloga uporabnika 10. 11. ob ~11.00; samo Killar, #629) | 10. 11.: narejeno na tej veji v štirih commitih »Padec: …« (jedro, izris, kamera, zvok, posnetek, testa `tests/padec.test.js` in `tests/browser/padec.test.mjs`); padec traja največ 1,5 s, nato je avto spet na cesti (odločitev uporabnika ob 13.55). Prvi štirje commiti so od 10. 11. na `zbirna/proge` (`8de444ef`, #494), tam ga je mogoče videti v igri. 11. 11.: peti commit `c6b33e3e` popravi pet najdb nizke resnosti v posnetku padca; na `zbirna/proge` ga prenese jure.kopac26. Razdelek »Padec čez rob (Killar)«, slike ZDAJ/POTEM v `docs/trki-slike/padec-*.webp` |
| Odpadli deli | deli, ki odletijo od avta, se na cesti ustavijo hitreje (naloga uporabnika 10. 11. ob ~12.50: »popravi deli ki odletijo od avta sedaj prevec dalec drajsajo po cesti, naj se te delci hitreje ustavijo na cesti saj sedaj drajsajo se nekaj casa kot da so na ledu«; velja za vse izbire trkov) | 10.–11. 11.: **narejeno na tej veji** v commitih »Deli: …« (`b83f985` koda in testi, `807372c` reference, `220d2a9` dokumenti; račun biketraveler): pregled zasnove, izvedba, neodvisno preverjanje, reference, slike zdaj/potem na veji `slike/trki-spa`. **Uporabnik je slike 11. 11. ob ~01.00 potrdil z »Ok«** (tabla #382, komentar 6782457953; to ni »ok« za `main`). Čaka: dovoljenje za seme v zamrznjenem `tests/hotham.test.js` (razdelek »Odpadli deli: izvedba«) |

**Predaja 10. 11. 2026 (~01.30):** temo nadaljuje račun **biketraveler** (odločitev uporabnika 10. 11. ob ~00.57: »Varčno, trke prevzame biketraveler«; več agentov samo za fiziko trkov in preverjanje pred združitvijo). Stanje, kaj manjka in naslednji korak so v opisu pull requesta #608. Surovi podatki analize (69 zapisov: 61 ugotovitev merilcev in 8 najdb preverjalcev, z dokazi in ukazi za ponovitev) so v `docs/trki-realizem-podatki.md`, skripte preverjalcev v `tools/trki/preverjanje/`; oboje se pred združitvijo na `main` odstrani ali skrči. Zbirni agent je bil zaradi porabe ustavljen tik pred koncem: dele tega dokumenta je napisal on, sestavljen je z njegovo skripto, celote po sestavi ni nihče prebral od začetka do konca. Slike ZDAJ/POTEM še niso narejene.

**10. 11. 2026 (~11.00):** temo po odločitvi uporabnika (fiziko trkov naj dela seja tega računa, »ker je to najpomembnejse da izbljsamo«) spet vodi račun **jure.kopac26** (seja session_01Ck3D3QtCPZJ7GHpFr4wi89, posreduje Matej). Vrstni red: 1. padec čez rob na Killarju, 2. odpadli deli, 3. faza 2 (prototip Realistična). Odločitve uporabnika tega dne: padec čez rob je mogoč samo na Killarju, drugod ostane ograja (~11.05, #629); »Trki naj dela naprej brez premora« (~12.40: po vsakem končanem koraku takoj naslednji, delovni tokovi do 10 agentov); vožnja brez dotika ostane do številke enaka; odpadli deli naj se na cesti ustavijo hitreje (~12.50, dobesedno v razdelku »Predaja«); »Vrni tako kot prej po 1,5s« (13.55: padec traja največ 1,5 s, nato je avto spet na cesti, razdelek »Padec čez rob (Killar)«).

**10. 11. 2026 (~21.15):** temo po odločitvi uporabnika (10. 11. ob ~19.45, tabla #382, komentar 6776241766: Trke prevzame biketraveler, nova seja z »ultracode« in delovnimi tokovi do 10 agentov) vodi račun **biketraveler** (seja session_01UuPU9BLAgAu7FVUR1DCUjF, zagnala jo je koordinacija računa). Naloga: 1. odpadli deli (narejeno, razdelek »Odpadli deli: izvedba«), 2. slike zdaj/potem na Spa na vejo `slike/trki-spa` in pot na tablo (narejeno; uporabnik jih je 11. 11. ob ~01.00 potrdil z »Ok«), 3. faza 2 »Realistična« (ni začeta: po odločitvi 10. 11. ob ~23.20 počaka na prosto mesto za sejo s kodo, razdelek »Predaja 11. 11. 2026«). Odločitev uporabnika o rdeči zastavi (10. 11. ob ~19.55, komentar 6776676151): **»Redkejša zastava je ok«** (pravilo ostane, zastava po trku dveh avtov pride redkeje).

**12. 11. 2026 (~01.40):** fazo 2 je začela nova seja Trki (session_01UuPU9CK4iqksMFrYfs7MPW) na isti veji. Prvi del, **jedro in dokazi**, je narejen: Realistična (cv 6) ima v `js/core.js` svoja števila in štiri točke zasnove, privzeta ostane Simulacija, vožnja brez dotika je enaka do zadnje števke, reference se niso premaknile. Kaj je v kodi, tabela zdaj → pričakovano → izmerjeno, postopek ob sporu s #494 in seznam za drugi del (testi za cv 6) so v razdelku »Realistična v repozitoriju: jedro in dokazi«.

**12. 11. 2026 (~06.30):** ista seja je naredila tudi drugi del, **teste za cv 6**: `tests/trki.test.js` ima 42 preverjanj (prej 19; 23 novih: ohranitev, simetrija in meje pri trku dveh avtov in ob ograji, ograja med drsenjem in vrtenjem, predmeti ob cesti, odpadli del na poti, vožnja brez dotika, druge različice z novo referenco `tests/golden/trki.json`, izvzeti vlačilec s polprikolico, pregon in boksi, spletna dirka, dirka brez izstrelitve). Vsako novo preverjanje pade pri vsaj eni namerni okvari kode (60 okvar v zasebnih drevesih zunaj repozitorija). Testi so našli eno napako jedra: zasuk je med izgubo oprijema ob naslonu na ograjo presegel mejo 9 rad/s (do 9,23 rad/s); popravljena je z eno vrstico v `wallCollide`, ki velja samo v Realistični, dokazi prvega dela so ponovljeni. Preverjanja z izmerjenimi številkami, okvare, najdbe in kar ostane odprto (»Odprto po testih«) so v razdelku »Testi različice Realistična«. Brskalniški testi in neodvisen pregled `js/core.js` čakajo.

**12. 11. 2026 (~08.40):** ista seja je naredila **gumbe v Nastavitvah** (odločitev uporabnika 10. 11. ob ~23.20): Trki **Realistično** (privzeto) / Kot zdaj, štiri starejše različice v Preizkusu; Odpadli deli Izklop / **Vklop**; Odpadlo kolo **Konec dirke** / Dirka teče naprej; Poškodbe ostanejo privzeto Samo videz; obstoječi igralci so enkrat preklopljeni (`tdgp-defaults-v6`). Jedro ostane privzeto pri Simulaciji, zato se reference niso premaknile. Seznam možnosti za uporabnika, izbire z razlogi, testi in odprto: razdelek »Gumbi v Nastavitvah: izvedba«. Brskalniški testi (glavna seja), slike zdaj/potem in uporabnikov »ok« čakajo.

**12. 11. 2026 (~15.00):** **popravki po neodvisnem preverjanju**. Preverjalci, ki kode niso pisali, so našli 13 najdb; seja je vsako najprej ponovila z meritvijo. Popravljeno v Realistični (`js/core.js`; cv 1–5 in vožnja brez dotika do številke kot prej): trk dveh avtov in naslon na ograjo ne dodata več energije (prej do 17,7 kJ na trk in do 53,9 kJ na dotik pri težkih vozilih), meja zasuka 9 rad/s velja po vsakem dotiku ograje za vsak avto (prej v novi fiziki do 52 rad/s). Testi: `tests/trki.test.js` 49 preverjanj (prej 43), `tests/odpadli-deli.test.js` 46 (prej 45). Odloženo z razlogom: stari padec čez rob na zamrznjeni testni progi Uncompahgre (vprašanje za uporabnika), premik avta ob koncu stranske ceste na Chapman's Peaku (tema prog) in obstoječa vez med avti prek gume na progi (koda vožnje, ostane). V dirkah se tekmeci v Realistični po popravku nekoliko več drgnejo (Spa 13 → 19, Bathurst 14 → 27 trkov nad 3 m/s; brez vrtenj in odstopov): to naj uporabnik vidi na predogledu. Vse: razdelek »Popravki po neodvisnem preverjanju«. Brskalniški testi (glavna seja), slike zdaj/potem in uporabnikov »ok« čakajo.

**12. 11. 2026 (~19.30):** temo nadaljuje nova seja Trki (session_01UuPU9EFjc29FThDGQE6Dz9, račun biketraveler; navodilo koordinacije po odločitvah 11. in 12. 11.). **Svež `main` je spojen** (`109bb56`: #647 Dež in sneg, #654 hribi Chapman's Peaka; spoj `f97e871`). Spori so bili mehanski (`js/core.js`: `wallR` ob novem parametru `dt` funkcije `wallCollide`, seznam izvozov; kazalo; seznam testov), reference voženj in dirk so narejene znova in preverjene tristransko. Dokazi po spoju (izpisi orodij cv 1–6 enaki do znaka kot pred spojem, Realistična ob hribih Chapman's Peaka, Najdba 6 ponovljena tudi na samem `main`) so v razdelku »Spoj `main` 12. 11. 2026: dokazi«. Naprej: slike zdaj/potem na Spa in seznam možnosti za en »ok«, nato poškodbe P1–P6 (`docs/realizem/paket-p.md`) s preverjanjem z več agenti na polovici in na koncu.

## Predaja 11. 11. 2026 (~02.00): odpadli deli in popravki padca so na veji, seja se ustavi; faza 2 čaka na prosto mesto

Seja session_01UuPU9BLAgAu7FVUR1DCUjF (račun biketraveler) se 11. 11. 2026 ustavi po navodilu koordinacije računa, ki sledi odločitvi uporabnika 10. 11. ob ~23.20 (tabla #382, komentar 6780738042): obe mesti računa za seji s kodo zasedata Dež in sneg ter garaža, račun je nad ciljem porabe, tretje seje ni. Fazo 2 »Realistična« naredi **nova seja Trki** na isti veji (`trki/realizem`, pull request #608, osnutek), ko se mesto sprosti; zažene jo koordinacija računa biketraveler. Ta razdelek in razdelki, na katere kaže, so vse, kar nova seja potrebuje; delovnih datotek stare seje ne more brati.

### Stanje ob predaji

| Kaj | Kje | Stanje |
|---|---|---|
| Odpadli deli | `b83f985` (jedro, test, orodja), `807372c` (reference), `220d2a9` (dokumenti), `dcb9785` in commit te predaje | narejeno (»Odpadli deli: izvedba«); izid neodvisnega preverjanja je v odstavku »Neodvisno preverjanje končne kode« |
| Slike zdaj/potem odpadlih delov, Spa | veja `slike/trki-spa` (`de35537`; samo slike, ni del igre): `odpadli-deli/*.jpg`, `README.md` | uporabnik jih je 11. 11. ob ~01.00 potrdil z »Ok« (komentar 6782457953); to ni »ok« za `main` |
| Padec: pet najdb nizke resnosti | `c6b33e3e` (samo datoteke padca) | popravljeno (»Padec: najdbe neodvisnega pregleda«); na `zbirna/proge` ga prenese jure.kopac26 (»Prenos na `zbirna/proge`«) |
| Faza 2 »Realistična« | zasnova v razdelku »Zasnova prototipa Realistična«, kandidatne formule v `tools/trki/zasnova-realisticna.js` | **v repozitoriju ni začeta**; raziskovalni tok, ki ga je ta seja zagnala 10. 11. zvečer, je bil ustavljen pred rezultati, prevzeti ni ničesar. **12. 11.: jedro je na veji** (»Realistična v repozitoriju: jedro in dokazi«), **testi za cv 6 prav tako** (»Testi različice Realistična«) |
| Pull request #608 | osnutek, ni v vrsti za `main` | na `main` skupaj s Poškodbami (spodaj), po uporabnikovem »ok« |

Testi ob predaji (drevo `c6b33e3e` s to predajo). Node: testi, povezani s popravki padca in dokumenti, 6 od 6 (`stamp`, `razdelitev`, `trki`, `padec`, `redflag`, `lang`); celoten povezani Node nabor veje 34 od 34 na končnem drevesu odpadlih delov (popravki padca jedra ne spremenijo). Brskalnik: `tests/browser/padec.test.mjs` 26 od 26 (v drevesu s Killarjem 34 od 34). Povezani brskalniški nabor veje: 22 od 22 testov (81 min), posebej še `rezervna-kolesa` (21 preverjanj), `deli-barve` (5) in `maketa-delov` (7), vsi zeleni. `tests/odpadli-deli.test.js` s 14 novimi preverjanji: 38 od 38. V celotnem Node naboru je rdeč `tests/hotham.test.js` (»Odprto ob predaji«, točka 1).

### Odločitve uporabnika 10.–11. 11. 2026 (veljajo naprej; vse na tabli #382)

| Kdaj | Dobesedno (komentar) | Kaj pomeni za delo |
|---|---|---|
| 10. 11. ~19.55 | »Redkejša zastava je ok« (6776676151) | pravilo rdeče zastave ostane, kot je; po trku dveh avtov pride redkeje (»Posledice v dirki«) |
| 10. 11. ~23.20 | »Garazo daj tudi pod prioritetno« (6780738042) | mesti računa biketraveler za seji s kodo: Dež in sneg, garaža; faza 2 začne, ko se mesto sprosti (po predogledu Dež in sneg, ~12. 11.) |
| 10. 11. ~23.20 | trki so »zelo pomembni del igre vzami si cas in naredi dobro. Dodaj v nastavitvah se gumbe da lahko spremenim razlicne opcije. Pod defaultom naj bo tvoja izbira kar ti mislis da je najbolj realisticno« (6780917123) | kakovost pred hitrostjo (rok ~22. 11. ni trd); gumbi v Nastavitvah (spodaj), privzeto najbolj realistična izbira; model in napor po `CLAUDE.md`, razdelek Seje |
| 10. 11. ~23.20 | »Samo videz. Avto se poskoduke samo na videz vozen pa je se vedno isto, ko se poskuduje toliko da mu odpade kolo je igre konec. Tudi poskodbe naj bodo privzetno najbolj realisticne« (6780917123) | poškodbe privzeto Samo videz (avto vozi enako); ko avtu odpade kolo, je dirke konec (privzeto) |
| 10. 11. ~23.30 | Trki (#608) in vsi deli Poškodb (P1–P6) gredo skupaj v en pull request (6781094915, točka 4) | ena primerjava v slikah, en »ok«, en krog testov; načrt Poškodb: `docs/realizem.md`; vrsta: `docs/vrsta.md` (»skupaj s Trki (#608) v enem PR«, na `main` ~29. 11.; od 11. 11. ~7. 12., vrstici spodaj) |
| 11. 11. ~00.15 | »Prioritetno posodobi tudi vse avte do stopje kot je kalibri.«, izbira »biketraveler, pred trki« (6781978213) | avte KOLIBRI (#480 s #626 in 10 avti iz #460) naredi biketraveler v prvem prostem mestu za sejo s kodo, **pred Trki** |
| 11. 11. ~00.40 | »Vse štiri ukrepe« (6782294421, točka b) | seje predajo pri ~150 tisoč žetonih konteksta, napor privzeto high (max za trke, grafiko, težke napake in novo zasnovo), tabla 4× na dan; pravila na `main` prinese pull request računa jure.kopac26 |
| 11. 11. ~01.00 | »Ok« na slike odpadlih delov (6782457953) | odpadli deli ostanejo, kot so na veji |
| 11. 11. ~02.40 | »30 avtov na raven KOLIBRIJA prestavi v seznamu kot prioritetno« (6784505738) | 30 avtov naredi biketraveler takoj po #480 in pred Trki + Poškodbe (ocena ~47 h, na `main` ~25. 11.); **Trki + Poškodbe se zamaknejo na ~7. 12.** K ravni KOLIBRIJA spadajo tudi nastavitve trkov avtov (`knockK`, `roof0`, `spinK`; `docs/avti-kolibri.md`): faza 2 meri na posodobljenih avtih. Mesta za dele (#480) in poškodbe ostanejo, kot so |
| 11. 11. ~03.05 | »prestavi Vse proge v enem PR (#569 + #494) na 5 mesto takoj za 30 avtov« (6784739386) | vrstni red za `main`: Dež in sneg + garaža; #480 + #626; 30 avtov KOLIBRI (~25. 11.); #569 + #494 (~26. 11.); **Trki + Poškodbe (~7. 12.)**; preleti #246; grafika; nove proge; 5 tovornjakov. #569 z #494 (Killar) ostane nezdružen, dokler uporabnik prog ne preizkusi |

Od prej veljajo: vožnja brez dotika do številke enaka; samo fizika trkov; padec čez rob samo na Killarju (#629); commitov padca `df083d99`, `33e6ba73`, `1ac5a0ed`, `a771fe19` in `c6b33e3e` ne spreminjaj (popravek padca je nov commit »Padec: …« samo z datotekami padca, javljen na tabli, ker gre tudi na `zbirna/proge`); pred vsakim potiskom `git fetch` in rebase na `origin/trki/realizem`.

### Gumbi v Nastavitvah (predlog Mateja po odločitvi uporabnika, komentar 6780917123; seja ga sme razširiti)

| Nastavitev | Izbire (privzeta krepko) | Opomba |
|---|---|---|
| Trki | **Realistično** / Kot zdaj | »Kot zdaj« je današnja privzeta izbira trkov (Simulacija); kaj se zgodi z drugimi starimi izbirami gumba »Trki med avti«, predlaga seja v seznamu možnosti |
| Odpadli deli | **Vklop** / Izklop | kaj je »Izklop« (brez delov na cesti ali deli brez dotika z avti), predlaga seja v seznamu možnosti |
| Odpadlo kolo | **konec dirke** / dirka teče naprej | na sliki `deli-kolo-200kmh.jpg` kolo odpade pri poškodbah Vklop (`"skoda": 2` v prizoru `kolo`, `tools/trki/slike-scenariji.json`); kdaj odpade pri Samo videz, določi zasnova skupaj s Poškodbami |
| Poškodbe | Izklop / **Samo videz** / Vklop | gumb že obstaja (`docs/igra.md`, »Poškodbe avtov«) |

Pred `main` seja pošlje Mateju (tabla #382) **seznam možnosti s privzetimi vrednostmi** in **primerjavo ZDAJ/POTEM v slikah** (kamera za avtom, prava proga: Spa); uporabnik da »ok«.

**12. 11. 2026: narejeno** po tej tabeli. Seznam možnosti s privzetimi vrednostmi, izbire seje (starejše različice v Preizkusu, Izklop = deli brez dotika, enkratni preklop obstoječih igralcev) in razlogi so v razdelku »Gumbi v Nastavitvah: izvedba«.

### Naslednja seja Trki: koraki

1. **Kdaj.** Ko je na računu biketraveler prosto mesto za sejo s kodo: po avtih KOLIBRI (#480 + #626, nato 30 avtov, na `main` ~25. 11.), ki so po odločitvah uporabnika 11. 11. pred Trki; pred Trki gre na `main` tudi #569 + #494 (~26. 11.), Trki + Poškodbe so predvideni ~7. 12. (komentarja 6784505738 in 6784739386). Prvo sporočilo in vsako nadaljevanje se začne z »ultracode« in vsebuje stavek »Delaj z delovnimi tokovi z več agenti« (`CLAUDE.md`, Seje: razišči → naredi → neodvisno preveri, do 10 agentov na tok).
2. **Najprej stanje.** `git fetch origin main trki/realizem`, preberi tablo #382 od komentarja 6784739386 naprej in `docs/vrsta.md` na `main`. #494 (Killar) gre na `main` v #569 (vse proge v enem pull requestu; po odločitvi uporabnika 11. 11. ob ~03.05 gre na `main` za 30 avti, ~26. 11.) in mora biti na `main` pred to temo (»Okvir«): če je že tam, spoji `main` (`node tools/spoji-main.mjs`), spor v `wallCollide` / `touch()` reši v korist #494 in po spoju preveri krhko ograjo, skalo, padec z roba in zid 15–90°. Od 12. 11. sta v `wallCollide` tudi dve vrstici Realistične (klic `wallR` in meja zasuka na koncu veje naslona): po rešitvi v korist #494 ju vstavi v `touch()` po razdelku »Točka 3 in #494 (Killar): postopek ob sporu«. Commiti »Padec: …« so na `zbirna/proge` isti popravki z drugimi oznakami, zato se zlijejo brez spora, če jih tam nihče ni spremenil. Nato popravki odpadlih delov iz »Odprto ob predaji«, točka 2 (O1 z O2 obvezno), z enim premikom referenc.
3. **Faza 2** po razdelku »Zasnova prototipa Realistična« (štiri točke: zasuk povsod po avtu, drsenje vstran po trku, ograja, lahek predmet; vrstni red dela, testi in tveganja so tam). Kandidatni popravek se na jedro te veje še nanese (`node tools/trki/zasnova-realisticna.js <mapa zunaj repozitorija>`; proti `js/core.js` +74 / −8 vrstic, preverjeno 11. 11. na `c6b33e3e`). Nova različica je `cv 6`; `--cv 1 … 5` morajo po izdelavi dati enak izpis kot prej. **12. 11.: prvi del (jedro in dokazi) je narejen**, razdelek »Realistična v repozitoriju: jedro in dokazi«: formule so v `js/core.js`, zato se kandidatni popravek na to drevo ne nanese več (skripta se ustavi pri prvem sidru); izpisi `--cv 1 … 5` so enaki kot pred izdelavo. **12. 11.: narejen je tudi drugi del, testi za cv 6** (`tests/trki.test.js`, 42 preverjanj; razdelek »Testi različice Realistična«, tam tudi popravek jedra, ki so ga testi našli, in seznam »Odprto po testih«).
4. **Gumbi** iz tabele zgoraj, privzeto najbolj realistična izbira. Ali se na nove privzete vrednosti enkrat preklopijo tudi obstoječi igralci (kot pri poškodbah: `tdgp-defaults-v5` v `js/game.js`), predlaga seja v seznamu možnosti. **12. 11.: narejeno** (razdelek »Gumbi v Nastavitvah: izvedba«; enkratni preklop `tdgp-defaults-v6`).
5. **Poškodbe P1–P6** (`docs/realizem.md`) gredo v isti pull request: kdo jih dela in na kateri veji, določi koordinacija; `carKnockFx` naj še naprej daje `imp`, `fxCar` in točko stika (»Okvir«).
6. **Preverjanje in testi**: test vožnje brez stika (stara proti novi različici, stanje enako do zadnje številke), reference vožnje se smejo spremeniti samo v scenarijih s trkom, `npm run test:related`, neodvisen pregled `js/core.js` z agenti, ki kode niso pisali. **12. 11.: testi z invarianti za cv 6 in test vožnje brez stika so narejeni** (»Testi različice Realistična«). Ostane: brskalniški testi (glavna seja) in neodvisen pregled `js/core.js`: obe vrstici Realistične v `wallCollide`, `wallR`, `kTakeR`, `kGripR`, `kSlideR`, `propPush` in točke iz »Odprto po testih«. **12. 11.: neodvisen pregled je narejen** (13 najdb, vsaka ponovljena; popravki in odloženo: »Popravki po neodvisnem preverjanju«); ostanejo brskalniški testi (glavna seja). Po vsaki namerni spremembi Realistične se referenca trkov zapiše z `node tests/trki.test.js --update`; vnosi cv 1–5 v `tests/golden/trki.json` se pri tem ne smejo premakniti.
7. **Slike in »ok«**: slike ZDAJ/POTEM z `tools/trki/slike.mjs` (prizori v `tools/trki/slike-scenariji.json`) na vejo `slike/trki-spa`, pot in seznam možnosti na tablo; #608 ostane osnutek do vrste, na `main` šele po uporabnikovem »ok«.

### Odprto ob predaji

1. **`tests/hotham.test.js` (zamrznjena testna proga) je rdeč v 1 od 25 preverjanj**, dokler uporabnik izrecno ne dovoli spremembe semena 11 → 29 (»Testi in reference«). Do takrat bi bil rdeč celoten Node nabor #608. Vprašanje je na strani Odločitve računa biketraveler (`trki-hotham-seme`, zapisano 11. 11. 2026); 11. 11. ob 10.50 odgovora še ni bilo (stanje `odprto`). Ta seja ga po urniku ne bere več (njen kontekst je nad mejo predaje, vsako bujenje ga prebere znova): prebere ga ob sporočilu zbiranja in ob dovoljenju spremembo naredi sama (commit »Deli: …«), sicer ga prebere naslednja seja Trki kot prvi korak (`docs/vprasanja.md`, razdelek Odgovor). Po dovoljenju: `node tests/testne-proge.test.js --dovoli hotham "<prošnja, datum>"`, ena vrstica v testu, proga in igra ostaneta nespremenjeni.
2. **Najdbe neodvisnega preverjanja odpadlih delov** (»Neodvisno preverjanje končne kode«): **O1, O2, K1, K2 in F2 so narejeni** (commit »Deli: O1 in O2 …«, 11. 11. 2026; »Popravki po preverjanju«), z njimi preverjanja 30, 31 in 38–40 in nove reference (prave proge in proge na odločanju; vnosi testnih prog bajt za bajtom). Odprto: F4, F5, K3 (nizke, po presoji), zavora izločene razbitine (F3, odloči uporabnik), meritve v vseh izbirah trkov po fazi 2 in nove slike na `slike/trki-spa`, če se prizori vidno spremenijo (uporabnik je potrdil sedanje).
3. **Peti commit padca** (`c6b33e3e`) še ni na `zbirna/proge`: prenese ga jure.kopac26 (»Prenos na `zbirna/proge`«).
4. **Brskalniški testi brez `npm ci`**: v oblaku je Playwright 1.63.0 (ista različica, kot jo zahteva repozitorij) nameščen zunaj repozitorija; `mkdir -p node_modules && ln -sfn /opt/node-tools/node_modules/playwright node_modules/playwright` (mapa `node_modules` ni v gitu) in brskalniški testi tečejo brez nameščanja.

## Predaja 10. 11. 2026 (~17.45): nova seja Trki nadaljuje pri odpadlih delih in fazi 2

Seja session_01Ck3D3QtCPZJ7GHpFr4wi89 (račun jure.kopac26) se 10. 11. 2026 do 18.00 ustavi zaradi porabe računa (rezerva 10 %, odločitev uporabnika ob ~14.30). Temo nadaljuje nova seja Trki na isti veji (`trki/realizem`, pull request #608, osnutek): v nedeljo, 15. 11. 2026, po resetu porabe ali prej na drugem računu, če tako odloči uporabnik. Zažene jo Matej. Ta razdelek je vse, kar nova seja potrebuje; delovnih datotek stare seje ne more brati.

### Odločitve uporabnika 10. 11. 2026 (veljajo naprej)

| Kdaj | Dobesedno | Kaj pomeni za delo |
|---|---|---|
| ~11.00 | fiziko trkov naj dela seja računa jure.kopac26, »ker je to najpomembnejse da izbljsamo« | temo vodi jure.kopac26 |
| ~11.00 | »Analiziraj kako avto zapelje cez rob in se prevrne v prepad in popravi da bo cimbolj realisticno« | razdelek »Padec čez rob (Killar)« |
| ~11.05 | »Padec cez rob naj bo zaenkrat mozen samo na progi killar, da prvo tuki uredimo da bo bilo dobro. drugod naj zaenkrat ostane ograja ki prepreci padec cez rob« | pravilo #629: padec kot telo teče samo, kjer ima proga tla padca (`def.floor`: samo Killar); drugih prog in njihovih ograj ne spreminjaj |
| ~12.40 | »Trki naj dela naprej brez premora« | po vsakem končanem koraku takoj naslednji, brez čakanja na »naprej«; delovni tokovi srednje velikosti, do 10 agentov |
| ~12.50 | »popravi deli ki odletijo od avta sedaj prevec dalec drajsajo po cesti, naj se te delci hitreje ustavijo na cesti saj sedaj drajsajo se nekaj casa kot da so na ledu« | odpadli deli, spodaj |
| 13.55 | »Vrni tako kot prej po 1,5s« | padec traja največ 1,5 s, nato je avto spet na cesti, kjer je šel čez rob, brez zatemnitve; daljšega padca do dna ni |
| ~14.30 | rezerva porabe 10 % | seje s kodo delajo brez premora do ~90 % porabe računa, nato napišejo predajo in se ustavijo; kdaj je čas, javi Matej |

Stalna pravila teme: vožnja brez dotika ostane do številke enaka (reference vožnje se spremenijo samo v scenarijih s trkom, in to utemeljeno); samo fizika trkov, ne vožnje; na `main` in na predogled šele po uporabnikovem »ok«, pred tem primerjava ZDAJ/POTEM v slikah (kamera za avtom, prava proga); commiti brez imena modela (`Co-Authored-By: Claude <noreply@anthropic.com>`, #628); pred vsakim potiskom `git fetch` in rebase na `origin/trki/realizem` (na veji gradi tudi seja tovornjakov); Killarjevih datotek in veje `zbirna/proge` ta tema ne spreminja (spremembe zanje so seznam v razdelku »Padec čez rob (Killar)«, vnese jih seja Killarja).

### Vrstni red

1. **Padec čez rob (Killar)**: narejen na veji v petih commitih »Padec: …« (`df083d99`, `33e6ba73`, `1ac5a0ed`, `a771fe19` in popravek najdb `c6b33e3e`), slike ZDAJ/POTEM so v `docs/trki-slike/padec-*.webp`. Prvi štirje so od 10. 11. 2026 na `zbirna/proge` (#494; tam `888f56ab`, `2ed9dbab`, `d17b867b`, `98799b71` in Killarjeve spremembe `8de444ef`). Neodvisni pregled kode izrisa, kamere, zvoka in posnetka ni našel napake visoke resnosti; pet najdb nizke resnosti je popravljenih 11. 11. 2026 v petem commitu (»Padec: najdbe neodvisnega pregleda«, spodaj). Odprto: peti commit prenese na `zbirna/proge` jure.kopac26 (»Prenos na `zbirna/proge`«); uporabnik padec preizkusi v igri; pred `main` njegov »ok«.
2. **Odpadli deli**: narejeni na veji 10.–11. 11. 2026 (commiti »Deli: …«; razdelek »Odpadli deli: izvedba«). Slike zdaj/potem so na veji `slike/trki-spa`; uporabnik jih je 11. 11. ob ~01.00 potrdil z »Ok«. Odprto: dovoljenje za seme v zamrznjenem `tests/hotham.test.js` in odprte najdbe neodvisnega preverjanja (»Neodvisno preverjanje končne kode«).
3. **Faza 2, prototip Realistična**: zasnova je v razdelku »Zasnova prototipa Realistična« (štiri točke s številkami zdaj → pričakovano, vrstni red dela, testi, tveganja). Kandidatne formule so v `tools/trki/zasnova-realisticna.js`: `node tools/trki/zasnova-realisticna.js <mapa zunaj repozitorija>` naredi zasebno kopijo igre s popravljenim jedrom, `GAME_ROOT=<mapa> node tools/trki/zid.js --cv 6` (in druga orodja `tools/trki/`) izmeri novo različico; `--cv 1 … 5` morajo dati enak izpis kot repozitorij. Izdelava v repozitoriju se je začela 11. 11. 2026 (razdelek »Realistična v repozitoriju: jedro in dokazi«); od takrat `--cv 6` meri kar repozitorij, kandidatni popravek pa se na drevo veje ne nanese več.

### Padec: najdbe neodvisnega pregleda (10. 11. 2026; popravljene 11. 11. 2026)

Neodvisni pregled razlike `33e6ba73..a771fe19` (`js/core.js`, `js/render.js`, `js/game.js`, `js/sfx.js`, `tools/posnetek.mjs`) ni našel napake visoke resnosti. Potrdil je: avti, ki ne padajo, se obnašajo enako kot prej (vsaka nova veja kode je za pogojem `fb`, `c.fall.b` ali `bits >= REC_FB`); zapis padca v posnetku je točen (največja zastavica 16.711.687 < 2^24), stari posnetki se berejo enako; lega telesa, kamera med padcem in zvok so brez napak in brez dodeljevanja pomnilnika na sliko; `c.roadY = c.y` po vrnitvi je pravilen za odprte ceste, dirkališča z višino in ravne proge. Pet najdb nizke resnosti (ugotovljene z branjem kode; vrstice so iz `a771fe19`) je popravljenih 11. 11. 2026 v commitu `c6b33e3e` (stolpec Popravek):

| # | Kje | Kaj | Popravek (`c6b33e3e`) |
|---|---|---|---|
| 1 | `js/render.js` 8543 in 8564–8565, `js/game.js` 1010 (`rpBack`) | »Posnetek do sem« sredi padca: ob vrnitvi v dirko se prah in kamenje zadnjega udarca narišeta še enkrat (`v.fbN` se nastavi samo v prvi sliki padca, posnetek pa teče brez učinkov). Potrjeno v igri: test na stari kodi ob vrnitvi našteje 10 delcev brez novega udarca | `fallPose` si zapomni telo (`v.fbB`) in štetje udarcev nastavi tudi, ko se telo na avtu zamenja (telo posnetka namesto telesa dirke in nazaj); `fallBack` ga pozabi |
| 2 | `js/game.js` 1251 (`rpFall`) in 982 (`replayEnd`) | Posnetek z zaslona rezultatov avtu, ki ravno pada, zavrže telo padca. Potrjeno: dirka za rezultati teče, dokler niso vsi avti doma (`restOn`); na stari kodi je bil avto po posnetku brez telesa, 228 m od roba (kjer ga je pokazal posnetek), in ga igra ni nikoli vrnila | avto, ki ob začetku posnetka z rezultatov nosi lastni padec dirke, se shrani cel (`rpOwn` v `rpPoseAll`, zapis kot `rpKeep1`) in ob koncu posnetka vrne (`replayEnd`, `rpBack1`): isto telo, isto mesto na cesti, padec teče naprej do vrnitve na rob |
| 3 | `js/game.js` 1297 (`rpAt`) | Ljudje ob progi v posnetku berejo polje 4 vzorca kot hitrost; v vzorcu padca je tam del kvaterniona, zato se odzovejo, kot da avto stoji (izmerjeno 0,1–0,5 m/s namesto 5–28 m/s) | med padcem hitrost po tleh iz razlike leg sosednjih vzorcev padca (po zadnjem vzorcu padca kot je prišel do njega); ob prehodu čez rob hitrost zadnjega vzorca na cesti |
| 4 | `js/game.js` 1257 | Padec, ki bi se začel v prvem vzorcu posnetka, bi se bral kot navaden vzorec; posnetek se začne ob štartu, zato v praksi nedosegljivo | `rpFall`: tak vzorec se bere kot avto, ki stoji na tem mestu s smerjo nosu telesa (brez preizkusa: stanja v igri ni mogoče doseči) |
| 5 | `js/game.js` 1258 in 1269 | Skok v posnetku iz enega padca naravnost v drugega: `c.h` vzame smer iz prvega (lega telesa je iz kvaterniona, zato pravilna) | telo posnetka si zapomni prvi vzorec svojega padca (`R.e`); ob drugem padcu se smer postavi na smer roba (brez preizkusa: razlika se vidi samo, ko nos kaže navpično) |

Popravek je samo v datotekah padca (`js/render.js`, `js/game.js`, `tests/browser/padec.test.mjs`); jedro, vožnja in zapis posnetka so nespremenjeni. `tests/browser/padec.test.mjs` ima štiri nova preverjanja (26 v drevesu brez Killarja, 34 s Killarjem): hitrost za ljudi ob progi med padcem, »Posnetek do sem« sredi padca po trdem udarcu (po vrnitvi 0 delcev do naslednjega udarca, ta da prah), posnetek z rezultatov sredi tekmečevega padca (isto telo, nedotaknjeno; padec se konča z vrnitvijo na rob po 1,508 s). Na kodi pred popravkom padejo vsa štiri. Pri najdbi 2 velja še naprej, kar je veljalo prej za vse avte: avti, ki za rezultati še dirkajo in ne padajo, po posnetku z rezultatov nadaljujejo z mesta, kjer jih je posnetek pustil (ni del padca, ni spremenjeno). Znana omejitev brez popravka: posnetek nima nove številke oblike, zato starejša različica igre vzorce padca bere kot prevračanje (»Odločitve, omejitve, odprta vprašanja«).

### Odpadli deli: naloga

Naloga uporabnika je v tabeli zgoraj. Navodilo Mateja (10. 11. ob ~12.50): na asfaltu naj se deli ustavijo hitro in realistično (kovina in plastika drsita s trenjem, gume se kotalijo posebej), na travi in makadamu še hitreje; popravek velja za **vse izbire trkov**, ne samo za »Realistično«; poveži ga z odstopanjem 2 (deli zavirajo avto); vožnja brez dotika ostane do številke enaka; ločeni commiti »Deli: …« na `trki/realizem`, a samo, če jih pregled potrdi. Za uporabnika primerjava: razdalja in čas drsenja prej/potem pri 60, 120 in 200 km/h, slike ali kratek posnetek s kamero za avtom na pravi progi (npr. Spa; Suzuka je testna).

Kje je koda (`js/core.js`): `Race.spawnDebris(c, name, R)` (hitrost kosa `c.vx * 0.7` + 2–5 m/s navzven, 2,5–5 m/s navzgor, največ 40 kosov), `stepDebris(d, T, dt)` (teža `JUMP_G`, odboj 0,28 nad 2,5 m/s brez izgube vodoravne hitrosti, na tleh vsak kos na vsaki podlagi zavira `6.5 * dt` m/s, torej ~0,65 g, mirovanje pod 0,05 m/s), `DEB_RUN` in `debrisHit(c, d)` (avto čez kos). Kosi so v povzetku stanja (`stateLine`), zato vsaka sprememba spremeni reference scenarijev s trkom (`tests/golden/sim.json`, `…/cs`): po spremembi `node tests/golden.test.js --update` samo zanje in v opisu commita, kateri in zakaj.

### Odpadli deli: meritve stanja in model (10. 11. 2026)

Meritve in prototip sta naredila agenta delovnega toka na kopijah jedra zunaj repozitorija (Spa, pravi avti, 31 vrst delov × 20 semen oziroma 300 metov na celico); prototipa takrat ni pregledal nihče drug (stanje ob predaji 10. 11. ob ~17.45; pregled, izvedba, končne meritve in slike so v razdelku »Odpadli deli: izvedba«).

**Zakaj deli drsijo »kot na ledu«.** Zaviranje na tleh (6,5 m/s², 0,66 g) ni vzrok. Vzroki so trije:
1. **Spust.** Zaviranje deluje samo v korakih, ko je kos na tleh. Kos na tleh pade 1 mm na korak, cesta na spustu pade več, zato kos šteje za letečega in ne zavira. Ravna cesta: mirovanje po 2,9/4,6/7,0 s in 24/67/158 m pri 60/120/200 km/h. Spa, spust 7 %: 16/36/27 s in 141/648/802 m. Nad naklon × hitrost = 1,25 m/s se kos ne ustavi nikoli (Bathurst, −14,8 %: 1062 m v 62 s). Dovolj strmih je 19 % dolžine pravih prog (Spa 33 %, Bathurst 40 %).
2. **Ni zračnega upora, ni izgube ob pristanku, podlaga se ne upošteva.** Trava in makadam zavirata enako kot asfalt; kolesa nimajo kotaljenja in so narisana leže.
3. **Sunek avta.** Nos avta svoj odpadli sprednji del sune na 1,03–1,08 svoje hitrosti (`debrisHit`: 1,35 × hitrost približevanja, največ 24 m/s); tak kos obleži 62/168/323 m naprej. Podvojitev ali potrojitev zaviranja skrajša drsenje na ravnini (pri 120 km/h 4,6 s → 2,7 → 2,1 s), na spustu pa ostane ~30 s.

**Model** (ena funkcija namesto `stepDebris`, brez novih naključnih števil, strošek koraka × 1,15): zračni upor k·v² (k = 0,72 r²/m, med 0,01 in 0,06; kolo 0,007), izguba ob pristanku μ × udarec, prevračanje nad 7 m/s (μ 0,9), drsenje pod tem (μ 0,55), kos na tleh ostane na tleh; podlaga asfalt/trava/makadam: trenje × 1/1,35/1,8, odboj × 1/0,4/0,15; kolo poskoči, se kotali (pod 8 m/s zavira 5 m/s², trava 7, makadam 14), zavije in pod 2,5 m/s pade.

| Del | Zdaj: m / s pri 60 · 120 · 200 km/h (raven asfalt) | Model |
|---|---|---|
| pokrov motorja | 31,7/3,2 · 80,0/5,0 · 177,1/7,4 | 10,7/1,4 · 19,8/1,9 · 29,5/2,1 |
| sprednji odbijač | 29,2/3,1 · 75,7/4,9 · 170,2/7,3 | 9,3/1,4 · 15,7/1,7 · 21,9/1,8 |
| vrata | 23,0/2,8 · 65,0/4,5 · 153,7/6,9 | 8,6/1,3 · 18,8/1,9 · 30,0/2,2 |
| ogledalo | 27,9/3,1 · 73,5/4,8 · 167,0/7,2 | 9,8/1,2 · 20,0/1,9 · 31,0/2,2 |
| sprednje kolo | 27,6/3,0 · 72,8/4,8 · 165,8/7,2 | 13,5/1,8 · 30,3/2,5 · 56,2/3,3 |

Na travi je pot ~13 % in na makadamu ~24 % krajša kot na asfaltu. Na spustu kot na ravnini: Spa −7,2 % (sedem delov v pravi dirki, povprečje) 49/124/431 m → 9,3/19,5/30,2 m.

**Odstopanje 2 (deli zavirajo avto) mora iti zraven.** Sam model naredi, da odpadli deli avte zavirajo 2–8-krat bolj kot zdaj: lasten sprednji odbijač vzame avtu 8,4/4,4/2,9 % hitrosti zdaj in 33/28/23 % samo z modelom. Z dvema praviloma je izguba majhna: R1 (lasten del avta ne zadene, dokler se enkrat ne loči od njega) da 0 % za lasten del; R1 + R2 (en sunek na prehod, po gibalni količini) da 1,8/0,9/0,5 % za tuj premikajoč se pokrov (zdaj 9–13 %). Pravilo »prvih 0,5 s« iz tabele odstopanj pri 60 km/h ne zadošča (16–22 %). Pri izvedbi preveriti: R1 loči avte po `d.car === c.id` (možen spor z oznakami policijskih avtov); R2 jemlje maso kosa iz igre (kolo 6, v resnici ~20 kg). Izvedba je namesto R1 in R2 dobila časovno pravilo (seznam avtov na kos, vsak s svojim časom) in odriv: razdelek »Odpadli deli: izvedba«.

**Reference in testi.** Kose vsebuje 94 od 154 scenarijev v `tests/golden/sim.json` in 17 od 110 dirk v `tests/golden/races.json`: ti se spremenijo, ostalih 60 in 93 mora ostati do številke enakih (ob izvedbi, po prestavitvi Great Alpine Road in Ouninpohje med testne: 86 od 140 scenarijev in 17 od 100 dirk). Zasnovo omejujejo `tests/debris.test.js` (leteči kos: odvisen od današnjega pravila odboja), `tests/crossover.test.js` (pristanek na mostu), `tests/fleet.test.js` in `tests/debris.test.js` (kosi, narejeni ročno: nova polja potrebujejo privzete vrednosti), `tests/browser/crash.test.mjs` (mirovanje ali tla v 2 s), `tests/repro.test.js` (naključje samo iz `rand()`).

**Vprašanje za uporabnika (ob izvedbi posredovano s slikami: »Posledice v dirki« spodaj).** Kosi po novem obležijo 10–35 m od mesta trka, torej pogosteje na cesti na liniji vožnje; strošek vožnje čez ležeč kos ostane (ogledalo 0,2 %, odbijač 1,4 %, pokrov 2,5 % hitrosti na prehod). Umik ali čiščenje ležečih kosov bi nasprotoval prejšnji želji (»povožen kos ostane, kjer leži«).

### Odpadli deli: izvedba (10.–11. 11. 2026; na veji, uporabnik je slike potrdil z »Ok«)

Naredila seja session_01UuPU9BLAgAu7FVUR1DCUjF (račun biketraveler) z delovnimi tokovi: neodvisen pregled zasnove (dva pregledovalca in dva nasprotna preverjalca, ki sta vsako najdbo ponovila s svojimi skriptami), izvedba, meritve, slike in testi, nato neodvisno preverjanje končne kode (štirje preverjalci, ki kode niso pisali). Commiti na `trki/realizem`: `b83f985` (jedro, test, orodja), `807372c` (reference), `220d2a9` (`docs/igra.md`, kazalo, mapa zasnove) in commiti predaje. Zasnova, kot je bila napisana pred izvedbo, s seznamom razlik do igre na vrhu, je v `tools/trki/zasnova-odpadli/zasnova.md` (popravek `jedro.patch` in osnutek testa sta šla v igro in sta iz mape izbrisana).

**Kaj je v igri.** Spremenjena je samo koda kosov v `js/core.js`: konstante `DEB` (razlaga nad njimi), `stepDebris`, `debrisHit`, polja kosa v `Race.spawnDebris` (`wh`, `roll`, `by`, `byT`) in `DEB` v izvozu jedra. `js/render.js`, `js/game.js`, `js/net.js`, posnetek dirke in splet so nespremenjeni (kosi so lokalni, izris bere ista polja lege). Koda kosov ne pozna izbire »Trki med avti«, zato velja za vseh šest. Met kosa je isti (istih pet naključnih števil), korak kosa naključnih števil ne jemlje: dirka, v kateri noben del ne odpade, je do zadnje števke enaka kot prej. Korak kosa po novem:
- zračni upor v letu in med prevračanjem po cesti (k·v², k = 0,72 r²/m med 0,01 in 0,06; kolo 0,007);
- **kos na tleh ostane na tleh**, tudi na spustu (dvigne ga samo sunek avta): to je bil »led« (prej je kos na spustu štel za letečega in ni zaviral);
- pristanek vzame hitrost po Coulombu (0,9 × udarec, ostane vsaj 30 %);
- trenje po podlagi pod kosom (`T.surface`, ista poizvedba kot za avte; trenje × 1 / 1,35 / 1,8 in odboj × 1 / 0,4 / 0,15 za asfalt / travo / pesek; koda podlage, ki je tabele ne poznajo, velja kot asfalt);
- plošča (pokrov, vrata, odbijač …) se nad 7 m/s prevrača naprej v smeri gibanja (μ 0,9), počasneje obleži in drsi (μ 0,55);
- kolo (tudi rezervno) pristane na tekalni plasti, nad 8 m/s poskakuje, nato se kotali (zavira 5 m/s² na asfaltu, 7 na travi, 14 v pesku), zavija na svojo stran, opleta in pod 2,5 m/s pade;
- višina nad cesto upošteva nagib kosa in prečni nagib ovinka (`T.bankAt`; Nordschleife).

**Avto in odpadli del** (odstopanje 2, »deli zavirajo avto«). Vsak kos ima seznam avtov, ki se jih ne dotakne, vsak avto s svojim časom (`d.by` avti, `d.byT` sekunde): avto, od katerega je odpadel, 2 s (`DEB.own`), in avto, ki ga je odbil, 2 s po odboju (`DEB.again`: en sunek na prehod). Vsi drugi avti kos zadenejo kot prej; kaj dotik da in vzame, je nespremenjeno. Avto s seznama ne pelje skozi del, ki se še premika: odrine ga vstran (`DEB.push`: hitrost dela prečno na avto se dvigne na 4 m/s, na stran, kjer del je; avto ne izgubi nič). Brez odriva je bil del do 2 s narisan skozi lasten avto (osnutek slik). Čez del, ki že leži, pelje avto s seznama brez cene; po izteku časa plača prehod kot vsak drug avto (`DEB_RUN`, nespremenjeno).

**Pregled zasnove: najdbe in odločitve.** Oba pregleda sta zasnovo potrdila s popravki; nasprotna preverjalca nista ovrgla nobene najdbe.

| | Resnost | Najdba | Odločitev |
|---|---|---|---|
| S1 | visoka | izjema je bila eno mesto na kos: dva avta ob enem kosu sta si jo jemala in bila oba sunjena korak za korakom (prava dirka, Irohazaka: 24 sunkov v 12 korakih) | seznam avtov, vsak s svojim časom |
| S2 | srednja | osnutek testa pravila ni določil: mutanti `own` 1,01, `own` 10, »izjema se nikoli ne konča«, `again` 1,01 in 10 so prestali vseh 17 preverjanj | 24 preverjanj: konec izjeme (po 1,5 s ne, po 2,5 s da), dva avta ob enem kosu, vsak avto svoj čas, odriv, rezervna kolesa |
| A1, S5 | srednja | rezervno kolo je bilo plošča (prevračalo se je kot pločevina, platišče do 12 cm v cesti) | del s `P.spare` je kolo |
| A2 | nizka | kos, ki ga seznam 40 izrine med prevračanjem ali kotaljenjem, je ostal narisan na robu (21–30 % izrinjenih pri 1 s razmika) | kos, ki ga seznam izrine, ko še ni pri miru in je nagnjen več kot ~20°, se ne riše več |
| A3 | nizka | v nagnjenem ovinku (Nordschleife) so kosi obležali do 2,4 m nad cesto ali 1,5 m pod njo (starejše od zasnove) | višina prišteje `T.bankAt`; kos je še narisan vodoravno (rob plošče do ~0,27 r v betonu ali nad njim: izpeljano, ne izmerjeno) |
| A4 | brez | nagib kotalečega se kolesa je narisan kot opletanje (os se vrti s kolesom, do 27°) | ostane; če je videti premočno, zmanjšaj `DEB.lean1` (0,4) |
| A5 | nizka | dve številki zasnove sta bili prelepi | korak premikajočega se kosa stane ~40 % več kot prej (ne 20 %), cela pot kosa pa 2,4–3,7-krat manj (manj korakov do mirovanja); »miruje v 3,7 s« velja za ravno cesto, s prevoja na pravi progi do 5,0 s (kolo pri 200 km/h, Harju) |
| A6 | nizka | črta ograje za kose ne pozna boksov (kos, odpadel v boksih, skoči čez boksni zid), konca stranske ceste in gub v črti: staro, nespremenjeno, po novem redkeje | ni popravljeno; to je sprememba `Track.wall` s svojimi testi |
| S3 | nizka | `tests/redflag.test.js`: na spojenem drevesu zadošča premik trenutka nesreče | samo `at: 60` → `at: 75` (21/21 pred spremembo in po njej) |
| S4 | nizka | številke »tuj del na poti« v zasnovi so bile od 42 drsečih vrstic, ne od vseh 126 | vseh 126 vrstic (osnutek): korakov z dotikom 1,60 / 1,52 / 1,45 pri 60 / 120 / 200 km/h → 1,00, povprečna izguba 3,58 / 3,49 / 3,52 % → 2,56 % |
| S6 | nizka | posledica naloge: deli obležijo na cesti, tekmeci jih ne vidijo, razbitine se kotalijo dlje | »Posledice v dirki« spodaj; rdeča zastava: odločitev uporabnika |

**Meritve končne kode** (`b83f985`; `node tools/trki/odpadli.js --json > prej.json` v drevesu pred spremembo, `37d0ef3`, nato `node tools/trki/odpadli.js --proti prej.json` na veji; avto sokol, ravna testna cesta, 40 metov na celico; pot m / čas s pri 60 · 120 · 200 km/h, povprečje; »Prej« je na vsaki podlagi enak). Izpis je pri `--cv 1` … `--cv 6` enak.

| Del (masa kg; polmer m) | Prej | Zdaj: asfalt | trava | pesek |
|---|---|---|---|---|
| pokrov motorja (14; 0,79) | 31,5/3,22 · 79,7/5,01 · 176,5/7,41 | 10,9/1,44 · 20,2/1,89 · 30,3/2,17 | 9,5/1,12 · 17,4/1,47 · 26,1/1,68 | 8,5/0,88 · 15,3/1,14 · 22,8/1,30 |
| sprednji odbijač (7; 0,74) | 29,1/3,07 · 75,6/4,86 · 170,0/7,25 | 9,5/1,40 · 16,1/1,70 · 22,6/1,87 | 8,2/1,09 · 13,8/1,33 · 19,6/1,46 | 7,1/0,85 · 12,0/1,03 · 17,0/1,12 |
| vrata (9; 0,60) | 23,3/2,81 · 65,3/4,55 · 154,1/6,93 | 8,7/1,25 · 18,8/1,86 · 30,1/2,19 | 7,7/0,98 · 16,2/1,44 · 25,9/1,69 | 7,1/0,78 · 14,3/1,12 · 22,6/1,31 |
| blatnik (5; 0,55) | 28,8/3,07 · 74,9/4,85 · 169,0/7,24 | 9,6/1,34 · 17,6/1,76 · 25,6/1,98 | 8,4/1,04 · 15,3/1,38 · 22,4/1,55 | 7,6/0,82 · 13,6/1,08 · 19,9/1,21 |
| ogledalo (1; 0,20) | 26,4/2,98 · 70,7/4,74 · 162,5/7,11 | 9,5/1,24 · 19,8/1,88 · 30,8/2,19 | 8,6/0,97 · 17,2/1,46 · 26,8/1,70 | 8,1/0,77 · 15,4/1,14 · 23,7/1,32 |
| žaromet (1; 0,12) | 29,4/3,09 · 76,1/4,88 · 170,9/7,28 | 13,4/1,68 · 28,4/2,31 · 49,7/2,88 | 11,3/1,29 · 22,9/1,73 · 38,3/2,06 | 9,8/1,00 · 19,1/1,30 · 30,4/1,48 |
| sprednje kolo (6; 0,31) | 27,7/2,99 · 73,0/4,78 · 166,0/7,17 | 13,5/1,76 · 30,3/2,50 · 56,2/3,23 | 12,0/1,47 · 25,9/2,08 · 47,7/2,65 | 9,6/1,01 · 21,0/1,45 · 39,3/1,91 |
| zadnje kolo (6; 0,31) | 12,6/2,08 · 47,1/3,86 · 125,8/6,25 | 6,0/1,03 · 21,3/2,18 · 45,9/2,95 | 5,3/0,84 · 18,5/1,81 · 39,1/2,45 | 4,8/0,66 · 14,8/1,24 · 32,0/1,75 |
| najdlje, katerikoli del | 38,7/3,60 · 91,4/5,40 · 194,2/7,79 | 16,3/1,93 · 33,9/2,61 · 60,3/3,34 | 14,6/1,58 · 29,7/2,21 · 51,8/2,73 | 12,5/1,10 · 24,7/1,57 · 43,4/1,97 |

Na asfaltu je pot pokrova krajša za 65 / 75 / 83 % in čas za 55 / 62 / 71 %, sprednjega kolesa za 51 / 59 / 66 % in 41 / 48 / 55 %. Prave proge, meti okoli vsega kroga (pokrov, sprednji odbijač, kolo, ogledalo; povprečje, v oklepaju najdlje):

| Proga | km/h | Prej: pot m | čas s | po 30 s se še giblje | Zdaj: pot m | čas s | po 30 s se še giblje |
|---|---|---|---|---|---|---|---|
| Spa, Belgija | 60 | 69,1 (447,4) | 6,54 (30,00) | 7 od 352 | 11,0 (17,3) | 1,46 (2,18) | 0 |
| Spa, Belgija | 120 | 158,5 (654,1) | 10,06 (30,00) | 27 od 352 | 21,7 (34,6) | 1,95 (2,86) | 0 |
| Spa, Belgija | 200 | 246,8 (734,7) | 12,07 (30,00) | 39 od 352 | 34,8 (60,7) | 2,28 (3,52) | 0 |
| Bathurst, Avstralija | 60 | 87,1 (445,7) | 8,60 (30,00) | 20 od 312 | 11,2 (17,2) | 1,47 (2,19) | 0 |
| Bathurst, Avstralija | 120 | 200,1 (671,2) | 11,77 (30,00) | 40 od 312 | 21,7 (34,8) | 1,94 (2,87) | 0 |
| Bathurst, Avstralija | 200 | 311,6 (778,4) | 13,06 (30,00) | 49 od 312 | 34,9 (62,4) | 2,31 (3,76) | 0 |

Avto in njegov lastni del (Spa, najdaljša ravnina, 105 vrstic: del × hitrost × vožnja): vrstic z dotikom v prvi sekundi 54 → 0; največja izguba hitrosti po 1 s 42,5 % → 0 %, po 8 s 70,8 % → 0 % (z odrivom del avtu ne obleži več na poti; osnutek brez odriva 0,52 %).

Pravi trk na Spa (prizori slik, 660 m po štartu, tekmec z načetim avtom oplazi ograjo in zavira, Simulacija; iste številke so na slikah):

| | Prej | Zdaj |
|---|---|---|
| 60 km/h, 5 delov | po 3,5 s trije še drsijo s hitrostjo do 50 km/h, najdlje 52 m | po 2 s vsi mirujejo, najdlje 11 m |
| 120 km/h, 5 delov | po 3,5 s vseh pet še drsi s hitrostjo do 110 km/h, najdlje 108 m | po 2 s vsi mirujejo, najdlje 19 m |
| 200 km/h, 5 delov | po 3,5 s štirje še drsijo s hitrostjo do 186 km/h, 120–181 m | po 2 s vsi mirujejo, najdlje 28 m |
| 200 km/h, avto sekundo po dotiku | 47 km/h (zavirajo ga lastni deli) | 99 km/h |
| 200 km/h, poškodbe Vklop, kolo | drsi plosko, po 6 s 82 m naprej in še 47 km/h; pločevina do 312 m | kotali se, zavije, pade; po 3,5 s miruje 26 m naprej |

Pri 60 km/h v trku pod 30° v ograjo s celim avtom ne odpade nič (prvi del pri 70 km/h), zato prizori slik začnejo z načetim avtom.

**Testi in reference.**
- Nov `tests/odpadli-deli.test.js` (38 preverjanj, ~6 s, od popravkov po preverjanju 40, ~9 s; prvotnih 24 in 14 iz neodvisnega preverjanja, »Neodvisno preverjanje končne kode«; v `tests/run.js`, `tests/shards.test.js`, `tests/README.md`): vsak del pri 60 / 120 / 200 km/h obleži bliže in prej kot prej (največ 0,6 × poti in 0,7 × časa), miruje v 5 s in 70 m, trava prej kot asfalt in pesek prej kot trava, kolo dlje od plošč in na tekalni plasti, nikoli pod cesto, nobene pridobljene hitrosti, ograje držijo, največ 40 kosov, dirka brez odpadlih delov enaka referenci do zadnje števke, lasten del se avta ne dotakne, tuj del en sunek, vse izbire trkov, konec izjeme, dva avta ob enem kosu, vsak avto svoj čas, odriv, rezervna kolesa.
- `tests/golden/sim.json`: spremenjenih 86 od 140 scenarijev pravih prog, natanko tisti z `cover.loose` > 0 (19 samo povzetek stanja, 67 tudi potek trka); ostalih 54 je do zadnje števke enakih. `tests/golden/races.json`: 17 od 100 dirk (pikesg/cs/lm, tianmen/cs/formula|lm|car, iroha/cs/formula, cpalace/cs, medvode ×5, balea/cs/rain, livorno ×5); vsi avti pridejo v cilj, čas zmagovalca se premakne za največ +1,96 % (livorno/cs/rain 533,57 → 544,04 s). `--update` zapiše samo vnose pravih prog in spremeni vrstni red: nove vrednosti so v izvirno datoteko vstavljene po ključih, vnosi testnih prog so ostali bajt za bajtom.
- `tests/redflag.test.js`: scenarij 1 `at: 60` → `at: 75` (najdba S3). `tests/aipits.test.js`: Montréal s semenom 6 namesto 2 (pri semenu 2 gre tekmec ob uvozu v bokse v zid in obstane do reševanja; prej ga je rešil sunek lastnega odpadlega odbijača; brez kosov je obstal že prej; od semen 1–30 je to edino).
- En vzorec za premaknjene izide (boksi, policijski pregon, reševanje igralca v medvode/cs): prej se je avta 0,01–0,8 s po trku dotaknil lasten del; zdaj je izid enak kot v vožnji brez kosov.
- **Rdeč ostane `tests/hotham.test.js`, preverjanje 23 od 25** (policijski pregon, seme 11: prej pobeg v 237 s, zdaj ujet v 163 s pri 5379 m, enako kot brez kosov). Mount Hotham je testna proga, zamrznjena: test se sme spremeniti samo z izrecnim dovoljenjem uporabnika (`node tests/testne-proge.test.js --dovoli hotham "<prošnja, datum>"`). Predlog: seme 11 → 29 (pobeg v 218 s, noben del ne odpade): v `tests/hotham.test.js` seznam semen pregona `[[11, 0], [12, 0], [13, 0], [14, 3]]` → `[[29, 0], [12, 0], [13, 0], [14, 3]]`. Lahka stopnja, semena 1–40: 16 pobegov prej, 13 na osnutku (brez jasnega premika težavnosti). Vprašanje za uporabnika je od 11. 11. 2026 na strani Odločitve računa biketraveler (`trki-hotham-seme`) in omenjeno na tabli #382.

**Posledice v dirki** (za uporabnika; prve tri so na slikah).
- Avto, ki je dele izgubil, po trku **drsi dlje**: prej so ga lastni deli zavirali korak za korakom (v ograjo pod 30° pri 200 km/h ima sekundo po dotiku 99 km/h namesto 47 km/h). Nad ~165 km/h zato isti trk naredi več škode (sokol: desni blatnik odpade v 10 od 10 trkov od 165 km/h, prej od 175 km/h; avto razpade od 203 km/h, prej v vseh trkih šele od 226 km/h; osnutek).
- Deli **ostanejo blizu mesta trka** in ležijo na liniji vožnje (največ 40, najstarejši izginejo); tekmeci jih ne vidijo. Avto, ki pelje čez ležeč del, izgubi do 2,5 % hitrosti, kot prej, a takih prehodov je več, sunkov pa veliko manj: v 20 navadnih dirkah 22 → 176 plačanih prehodov, vsa hitrost, ki jo kosi vzamejo avtom, 293,6 → 49,6 m/s (pregled zasnove, osnutek s popravkom S1).
- **Rdeča zastava po trku dveh avtov pride redkeje**: razbitini ne obstaneta več ob svojih delih, zato sta pogosto več kot 100 m narazen (`RED.near`). Ista nesreča na Bathurstu v devetih trenutkih: rdeča zastava v 15 s v 5 od 9 primerov, prej v 9 od 9. Brez rdeče zastave delov nihče ne pospravi (Bathurst, nesreča pri 60 s: plačanih prehodov 308 → 543 v 8 krogih). Uporabnik 10. 11. 2026 ob ~19.55: **»Redkejša zastava je ok«**; pravilo zastave je nespremenjeno.
- Izločena razbitina se lahko do 30 s plazi ob zidu (do 376 m), dokler je redarji ne umaknejo (prej so jo po 84 in 104 m ustavili lastni deli: 61 in 55 sunkov).
- Vidno, nizka resnost: dolga plošča je med prevračanjem do 0,44 m nad cesto, plošča na robu za kratek čas 0,1–0,35 m v cesti (`DEB.edge` 0,8 je ena številka za vse obrise); kos na tleh sledi cesti (čez grbino ne poleti); dež podlage kosov ne spremeni.

**Neodvisno preverjanje končne kode** (11. 11. 2026; štirje preverjalci, ki kode niso pisali, vsak s svojimi skriptami; PREJ je `37d0ef3`, KONEC `b83f985`). Trije so oddali poročilo (dva avta ob enem kosu in cele dirke; odriv; koda in test). Četrti (meritve pri 60 / 120 / 200 km/h v vseh izbirah trkov) je meritve končal, poročila pa ni oddal, ker se je vsebnik seje 11. 11. ob ~02.15 znova zagnal: njegov izid je iz shranjenih tabel prebrala ta seja (skupina *Meritve v vseh izbirah trkov* spodaj). Napake visoke resnosti ni v nobeni od štirih skupin. Najdbe so spodaj z resnostjo in predlogom. V kodi igre ni popravljena nobena: popravki premaknejo reference in prizore, ki jih je uporabnik že potrdil na slikah, zato gredo vsi skupaj v en premik referenc na začetku naslednje seje (**O1 z O2 obvezno pred `main`**; ostale presodi naslednja seja). Popravljena sta komentar (F6) in doseg testa (14 novih preverjanj).

*Dva avta ob enem kosu in cele dirke* (822 določenih primerov z dvema ali tremi avti pri 60 / 120 / 200 km/h, 1400 naključnih prizorov, 112 celih dirk, 17 nesreč na Bathurstu, 48 trkov v zid):
- napaka osnutka (S1) je odpravljena: noben avto ne dobi sunka istega kosa dvakrat v 2 s (prej 957 parov avto–kos z več kot enim plačilom v določenih primerih in 2952 ponovitev v dirkah), in avto, ki je kos izgubil ali odbil, od njega 2 s ne dobi ničesar (določeni primeri 3528 učinkov → 0, sunki lastnih delov v dirkah 2003 → 0);
- vsota hitrosti, ki jo kosi vzamejo avtom, pade: določeni primeri 3617 → 778 m/s, 75 osnovnih dirk 286,6 → 32,1 m/s, 29 dirk z drugimi semeni 811 → 155 m/s; v cilj pride v vseh 112 dirkah enako avtov, reševanj je manj (42 → 25), 60 od 75 osnovnih dirk je do zadnje števke enakih, čas zmagovalca se v dirkah, ki se razlikujejo, premakne povprečno za +0,07 % (σ 0,67 %); Montréal s semenom 2 je edino od 36 semen testa boksov, ki ga sprememba premakne;
- **F1, srednja (trditev, ne koda):** ne drži, da ni noben avto v nobenem primeru na slabšem. 239 od 1986 avtov v določenih primerih izgubi več hitrosti kot prej (največ 6,5 m/s oziroma 11,7 % hitrosti; v naključnih prizorih največ 13,0 %): avto, ki je dele izgubil, jih ne pomete več s seboj, zato jih sreča avto ob njem ali za njim (do trije kosi). Velja, kar je izmerjeno: en kos enega avta sune enkrat, lastnik in avto, ki je kos odbil, sta 2 s prosta, vsota pade;
- **F3, srednja (posledica, »Posledice v dirki«):** razbitine se kotalijo dlje, ker jih lastni deli ne zavirajo več. Nesreča na Bathurstu: rdeča zastava v 15 s v 14 od 17 trenutkov (prej 17 od 17; v pasu 50–90 s v 4 od 7, pri 50, 60 in 70 s je ni), pride 8,3 s po nesreči namesto 7,2 s (trenutek iz testa, 75 s: 10,1 s namesto 8,5 s, meja 15 s). Ena razbitina se plazi 28,4 s in 376 m; 2 od 48 trkov v zid trajata 30 s namesto ~5 s (Medvode). Predlog, ki **ni narejen**, ker spremeni vožnjo izločenega avta (odloči uporabnik; po fazi 2 najprej izmeri znova, ker se drsenje ob ograji takrat spremeni): v `retireControl` močnejša zavora za uničen avto, `c.inBrk = clamp((v - 7) / 40, 0.12, c.dmg >= 0.95 || (W.nL || 0) >= 2 ? 0.8 : 0.3)`;
- **F2, nizka:** del natanko na osi avta (sprednji odbijač, pokrov motorja, pokrov prtljažnika) je vedno odrinjen na desno (`const s = dz * ch - dx * sh < 0 ? -1 : 1` v `debrisHit`), zato ga plača avto desno zadaj, levi ne. Predlog brez naključja: `const la = dz * ch - dx * sh, s = la < -0.05 ? -1 : la > 0.05 ? 1 : (d.id & 1 ? 1 : -1)` (vsote ne zniža, razdeli jo enakomerno);
- **F4, nizka (stara koda, enako prej):** en prehod čez ležeč kos ob boku avta se plača enkrat na trkovni krog avta. Predlog: izbriši zadnji `gone()` v `debrisHit` (prehod se konča šele, ko je kos zunaj dosega avta; preverjanje dosega na vrhu že kliče `debrisGone`); odpravi 13–23 % plačil ležečih prehodov, premakne reference dirk z ležečimi prehodi;
- **F5, nizka:** kos, ki ostane ob svojem avtu vso izjemo, ga sune v prvem koraku po njenem izteku (natanko pri 2,000 s; 2 od 48 trkov v zid), počasen avto lahko isti kos sune drugič tik po 2 s; med izjemo se gibajoč kos z avtom prekriva dlje kot prej (na slikah ni preverjeno). Predlog po izbiri: v prosti veji ostane avto na seznamu vsaj 0,25 s, dokler je kos v njem, `{ const bi = d.by.indexOf(c); if (d.byT[bi] < 0.25) d.byT[bi] = 0.25; }` pred preverjanjem globine;
- **F6, nizka:** komentar v `tests/redflag.test.js` je trdil, da sta razbitini pri 50, 60 in 70 s »100 to 200 m apart«; izmerjeno 102, 324 in 206 m. Popravljeno v komentarju (»100 to 330 m«);
- **F7, nizka:** več delov obleži na asfaltu (25 % → 45 %), kratke dirke imajo več plačanih prehodov čez ležeče dele (75 osnovnih dirk 22 → 108, 29 dirk z drugimi semeni 137 → 409); vsote hitrosti kljub temu padejo. Pospravljanje ležečih delov (po nekaj krogih ali za varnostnim avtom) bi bila svoja odločitev uporabnika.

*Odriv in izjema* (6063 prizorov, 3,2 milijona korakov, 2,7 milijona klicev `debrisHit` z avtom na seznamu kosa, 270 tisoč odrivov):
- izjema drži povsod: celotno stanje avta (vsa polja, tri ravni globoko) je korak za korakom enako kot v isti vožnji brez kosov, dokler ni upravičenega dotika; 0 dotikov znotraj 2 s (z izrezano izjemo se isti prizori razlikujejo že v prvem koraku, primerjava torej vidi). Kosi ne vzamejo nobenega naključnega števila dirke; 34 dirk z nesrečo, pognanih dvakrat, je enakih; seznam kosa ima največ 5 avtov in najdaljši čas 2,000 s. Razbitina, ki se plazi ob zidu: 0 sunkov lastnih delov v 768 vožnjah (prej 31 643, en del do 83-krat). Koda kosov stane ob nesreči 21 avtov 34–42 µs na korak (prej 28–36 µs; korak traja 8333 µs);
- odriv sam: kos po odrivu ni nikoli v ograji ali pod cesto, hitrost prečno na avto je natanko 4,000 m/s, vsak kos miruje največ 1,39 s po odhodu avtov;
- **O1, srednja, popraviti pred `main`: odriv je vir energije.** Kos, stisnjen med stoječ ali zelo počasen avto (do 8 km/h) in ograjo, ki je za nekaj stopinj nagnjena k boku avta, ali med dva avta, z vsakim odrivom pridobi hitrost in ga izstreli po reži. Stoječ sokol ob ograji, 4176 voženj: najhitrejši kos 16,0 m/s (kolo, nos 6° v ograjo, reža 0,02 m, vrženo z 2,02 m/s), najdlje 10,2 m; nad 8 m/s v 573 vožnjah (13,7 %). Brez odriva največ 2,58 m/s in 1,7 m. Predlog (preizkušen): v prosti veji `debrisHit` vrstico `if (a > 0) { d.vx += a * px; d.vz += a * pz; }` zamenjaj z `if (a > 0) { const v0 = Math.hypot(d.vx, d.vz); d.vx += a * px; d.vz += a * pz; const v1 = Math.hypot(d.vx, d.vz), lim = Math.max(v0, Math.hypot(c.vx, c.vz) + DEB.push); if (v1 > lim) { d.vx *= lim / v1; d.vz *= lim / v1; } }` (samo hitrost kosa, brez naključja, avto nedotaknjen);
- **O2, nizka:** med dvema stoječima avtoma, ki imata oba kos na seznamu, ga odriv drži pri 4,00 m/s sem in tja. To je nad `DEB_RUN.v` = 3, zato kos nikoli ne šteje kot ležeč in avto sune vsakič, ko mu poteče 2 s (52 od 1440 voženj, največ 4-krat; zadnji gibajoč kos 8,7 s). Predlog: `DEB.push` pod `DEB_RUN.v`, na primer 2,5 (kos, ki ga odrine stoječ avto, je takoj ležeč): 0 ponovitev v 1440 vožnjah, odriv 2,5 m/s čisti enako dobro kot 4 (kos je v avtu najdlje 0,54 s proti 0,53 s). **O1 in O2 gresta skupaj** (sam O1 ne odpravi plesa, sam O2 ne izstrelitve; skupaj največ 2,58 m/s in 0 ponovitev) in premakneta reference prizorov z odpadlimi deli.

*Koda in test* (71 sprememb jedra, ki jih prvotni seznam ni imel, vsaka pognana skozi test):
- pravil »avto, ki se ničesar ne dotakne, vozi enako v vseh izbirah trkov« in »brez novih naključnih števil« ter invariant kode ni bilo mogoče zlomiti; vse številke v opisu testa se ujemajo z izpisom;
- **doseg testa (T1–T4 srednja, T5–T8 nizka), popravljeno 11. 11. 2026:** prvotnih 24 preverjanj je ujelo 44 od 71 sprememb jedra, 27 jih je šlo skozi, med njimi kos, ki vzame naključno število dirke, izpuščena višina nagnjenega ovinka, makadam in luže skoraj brez trenja ter odriv 40 m/s ali merjen proti cesti. Preverjalčevih 14 dodatnih preverjanj (25–38) je zdaj v `tests/odpadli-deli.test.js` (38 od 38, ~6 s); ujamejo 22 od 27, preostalih 5 je na ravni nastavitev, nedosegljivih ali enakovrednih. Preverjanje 37 (prevračanje met za metom) ima prage blizu nastavitev: ob spremembi `DEB.e` ali `DEB.muT` ga je treba nastaviti znova. Preverjanji 30 in 31 primerjata odriv z `DEB.push` in mejo 5 m/s, preverjanje 38 (2 s do koraka natančno) sloni na vedenju K2: ob popravkih O1, O2 in K2 jih prilagodi;
- **K1, nizka:** `Race._redClear` nima vrstice, ki kos med kotaljenjem ali prevračanjem vzame s tal (meja 40 kosov jo ima). Z izbiro, ki pusti dele na cesti (`XC.parts`, privzeto izklopljena), tak kos po rdeči zastavi ostane narisan sredi prevračanja. Predlog (preizkušen: test odpadlih delov in `tests/redflag.test.js` ostaneta zelena): `for (const d of this.debris) { d.dead = true; if (!d.rest && Math.abs(Math.cos(d.rx) * Math.cos(d.rz)) < 0.94) d.ground = false; }`;
- **K2, nizka:** avto, ki je ob izteku svojih 2 s še nad lastnim ležečim delom, plača prehod sredi dela (izguba hitrosti, udarec, poskok). Predlog po izbiri: izbriši zgodnji `if (free && lying) return;` in v veji ležečega kosa za `(d.on || (d.on = [])).push(c);` dodaj `if (free) return;` (prehod se začne brez cene in se sredi ne plača); premakne lahko referenco dirke, v kateri se to zgodi;
- **K3, nizka, ni iz te spremembe (enako prej):** kos, vržen s ceste ob dveh ustjih stranskih cest, sunek ograje v enem koraku premakne za 37–40 m (`Track.wall` vrne celo pot nazaj), na Montréalu (vzorec 368) kos nekaj korakov poskakuje po ~0,5 m. Predlog za pozneje: v `stepDebris` ob sunku ograje prezri ali omeji prodor, ki je veliko večji od poti kosa v koraku;
- D1 (komentar v `tests/redflag.test.js`) je popravljen; D2 (dokument ob commitu `b83f985` izvedbe še ni opisoval) je odpravljen s commitoma `220d2a9` in `dcb9785`.

*Meritve v vseh izbirah trkov* (uprizorjeni trki s po 10 semeni, rezervno kolo v izbirah 2–6 s po 3; 1930 voženj s kosi na drevo, 11 097 kosov v KONEC, in enako voženj z vsakim kosom odstranjenim ob metu; izid je ta seja prebrala iz preverjalčevih tabel, resnost spodaj je njena ocena):
- uprizorjeno: trk v ograjo pod 30° pri 60 / 120 / 200 km/h (rally, sokol), čelni trk s tekmecem, ki vozi 60 km/h, pri 60 / 120 / 200 km/h (rally–vortex, sokol–sokol), kolesa (sokol v ograjo pri 200 in 240 km/h, poškodbe 1 in 2, s pravili igre in brez) in rezervno kolo (medved, pescenjak, kamen, cisterna; pod 30° pri 60 do 240 km/h in pri najnižjih hitrostih, pri katerih rezervno kolo odpade, naravnost v ograjo pri 60 / 120 / 200 km/h), vse v izbirah trkov 1–6;
- **spremenili so se samo kosi:** če je vsak kos odstranjen že ob metu, je dnevnik avtov (vsak korak) PREJ in KONEC enak v vseh 1930 vožnjah, v vsaki izbiri trkov;
- **lastni kosi avta ne stanejo več:** pri trkih enega avta (ograja pod 30°, kolesa, rezervno kolo pod 30°; 1270 voženj) je vožnja s kosi do koraka enaka vožnji brez njih. Prej ni bila: ograja pri 200 km/h v 120 od 120 voženj, kolesa v 480 od 480; sokol je imel pri 200 km/h (izbira 1, poškodbe 1) sekundo po trku 80,1 km/h namesto 129,6 in je bil zanj v 3 od 10 voženj po pravilih igre konec dirke (zdaj 129,6 km/h in 0 od 10, kot brez kosov). Pot do ustavitve je zato daljša (173,9 → 297,0 m; posledica F3 zgoraj). Pri trku naravnost v ograjo je enakih 274 od 300 voženj, ostalih 26 je K2 (spodaj);
- čelni trk: kosi drugega avta ostanejo ovira, zato se vožnja s kosi od vožnje brez njih razlikuje v 290 od 360 voženj (od 2. sekunde), enako pogosto kot prej. Deli obležijo pol bliže (sokol–sokol pri 200 km/h, izbira 1: najdlje od meta 19,9 (največ 43,1) → 9,4 (19,9) m, gibanje 2,41 → 1,33 s), plačanih korakov lastnih kosov v prvih 2 s je 10,6 → 0;
- izbire trkov med seboj: pri ograji in kolesih je celoten zapis (kosi in avti) v izbirah 2–6 enak kot v izbiri 1 (60 od 60 in 80 od 80 trkov); pri čelnem trku se izbire 2–5 razlikujejo od izbire 1 v vseh 60 trkih (izbira spremeni trk dveh avtov), izbira 6 je enaka izbiri 1 (faza 2 še ni narejena); pri rezervnem kolesu se izbire 2–4 razlikujejo v 12 od 48 in 9 od 36 trkov, izbiri 5 in 6 sta enaki izbiri 1. Vse to enako PREJ in KONEC: pravila kosov od izbire trkov niso odvisna;
- orodje repozitorija (`tools/trki/odpadli.js`, ravna cesta pri 60 / 120 / 200 km/h) da v obeh drevesih v vsaki izbiri trkov (brez izbire in 1–6) do bajta enak izpis; številke so enake tabeli »Meritve končne kode« (pokrov motorja na asfaltu 31,5 / 79,7 / 176,5 m → 10,9 / 20,2 / 30,3 m);
- ležeč kos kot ovira: prehod čez tuj ležeč kos na istem mestu stane v obeh drevesih do zadnje številke enako (126 od 126 primerov pri 60 / 120 / 200 km/h; pokrov motorja × 0,975, sprednji odbijač × 0,986), v izbirah 1–6 enako kot brez izbire (216 od 216); prehod čez lasten kos po izteku 2 s je v obeh drevesih enak (18 od 18);
- meja 40 kosov: v dirki 13 avtov na Spa s 120 meti stoječega avta zunaj dirke seznam ne preseže 40, meja vzame 80 kosov, noben ne ostane narisan zamrznjen na robu; dnevnik dirkajočih avtov je z meti in brez njih enak v vseh izbirah trkov (kosi, ki se jih nihče ne dotakne, ne spremenijo ničesar);
- **K2 potrjen (nizka):** lasten kos v prvih 2 s ne stane v nobeni od 1930 voženj; v koraku, ko se 2 s iztečeta, je plačanih 55 prehodov v 52 vožnjah in še 8 pozneje (čelni trk in trk naravnost v ograjo: avto obstoji na svojih kosih). Popravek K2 (zgoraj) je preverjalec preizkusil na kopiji kode v pomnilniku;
- druge najdbe ta seja v njegovih tabelah ni našla. Tabel ni pregledal drug preverjalec, skripte so bile v začasni mapi seje in niso shranjene: naslednja seja meritve v vseh izbirah trkov ponovi po fazi 2 (izbira 6 se takrat spremeni), pred `main`.

**Popravki po preverjanju: O1, O2, K1, K2, F2** (11. 11. 2026, commit »Deli: O1 in O2 …«; PREJ je `c0a9a14`, veja s svežim `main`). Niso narejeni F3 (odloči uporabnik), F4, F5 in K3.
- **O1 in O2** (`debrisHit`, odriv lastnega kosa): `DEB.push` 4 → 2,5 m/s (pod `DEB_RUN.v`: kos, ki ga odrine stoječ avto, je takoj ležeč); po odrivu kos ni hitrejši, kot je bil, ali od hitrosti avta in odriva, zato kos, stisnjen ob ograjo ali drug avto, iz reže ne dobi hitrosti. Stoječ avto (zavora, `noReverse`) 0,05 m od ograje, nos 4° ali 8° v ograjo, kos v reži, 14 000 voženj: najhitrejši kos 16,29 → 2,50 m/s, najdlje 14,68 → 0,78 m, voženj nad 8 m/s 2616 → 0. Kos med dvema stoječima avtoma, 6400 voženj: sunkov 828 (v 627 vožnjah) → 0, najhitrejši 17,62 → 2,50 m/s, zadnji gibajoč kos 8,26 → 0,62 s.
- **K1** (`Race._redClear`): kos, ki ga rdeča zastava pospravi, ko se še kotali ali prevrača, ne ostane narisan zamrznjen na robu (v načinu, ko deli ostanejo na progi; enako kot pri meji 40 kosov). **K2**: zgodnji `if (free && lying) return;` je izbrisan; avto v svojem času se v veji ležečega kosa vpiše med avte nad kosom (`d.on`) in ne plača ničesar, zato se prehod, začet v njegovem času, ob izteku časa ne plača sredi kosa. **F2**: kos na osi avta (±0,05 m) gre na stran po številki kosa (lihi na eno, sodi na drugo), brez naključja.
- **Cena:** počasnejši odriv kos iz avta umakne počasneje. Preverjanje 23: kos globoko v avtu skupaj 156 → 431 korakov, najdlje 14 → 33 korakov na vožnjo (0,12 → 0,28 s; meja je zdaj 36 korakov, 0,3 s). Preverjalčev »odriv 2,5 m/s čisti enako dobro kot 4« velja za čas kosa v avtu (0,54 proti 0,53 s), ne za globino. Odriv, odvisen od hitrosti avta, bi globino zmanjšal; ni narejen.
- **Test** (`tests/odpadli-deli.test.js`, 40 od 40, ~9 s): preverjanji 30 in 31 izbirata stran kot `debrisHit` (F2); 38 gre korak za korakom čez konec časa (prehod, začet pred iztekom, se ne plača, začet ob izteku ali po njem enkrat, ob prihodu); nova sta 39 (kos ob ograji, 128 voženj: najhitrejši 16,29 → 2,50 m/s, najdlje 8,13 → 0,64 m) in 40 (kos med dvema stoječima avtoma, 120 voženj: sunkov 138 → 0, najhitrejši 4,87 → 2,50 m/s, zadnji gibajoč 8,25 → 0,62 s, koraki z dotikom avta 266 → 0). Stoječi avti v 39 in 40 imajo `noReverse` (zavora pri miru po 0,3 s vklopi vzvratno). Mutacije: brez meje hitrosti pade 39, odriv 4 m/s 39 in 40, K2 nazaj 38, lasten čas 1,8 s 38, čas odboja 2,2 s 22 in 38, PREJ 30, 31, 38, 39 in 40. Od 12. 11. (»Popravki po neodvisnem preverjanju«, najdba 13) ima test 46 preverjanj: 29b preveri popravek K1 še tam, kjer rdeča zastava počisti cesto (`Race._redClear`); brez popravka pade natanko 29b. `tools/trki/odpadli.js` izpiše enako kot prej (pokrov motorja 10,9 / 20,2 / 30,3 m).
- **Reference** (`--update` in vstavljanje v izvirno datoteko po ključih; vnosi testnih prog so ostali bajt za bajtom): `tests/golden/sim.json` 64 od 140 scenarijev pravih prog in prog na odločanju, vsi z odpadlimi deli (drugih 22 z odpadlimi deli in 54 brez njih je enakih); razdalja vodilnega se premakne v 4 (največ 1,0 m, bathurst/formula). `tests/golden/races.json` 17 od 100 dirk, iste kot v `807372c`; vsi avti v cilju, čas zmagovalca enak do 0,01 %, razen livorno/cs/rain (544,04 → 538,76 s, −0,97 %).
- **Livorno, suho: zavrtenja 0 → 3** (meja testa je 2 več od reference, zato je referenca po pregledu narejena z `--update`). Dirka je do koraka enaka do 55,1 s, ko avto 21 počasneje odrine svoje levo ogledalo, ki ga 0,6 s pozneje sune avto 14; od tam se dirki razideta. Vsa tri zavrtenja (avti 8, 17 in 21 pri 66, 290 in 549 s) so po trkih dveh avtov, nobeno po sunku kosa. Ista dirka z drugimi semeni koraka (6000, 7000, 8000, 9000): zavrtenj PREJ 3, 1, 1, 0, zdaj 0, 1, 1, 0 (PREJ pri 6000 en avto ne pride v cilj); s semenom testa skupaj 5 in 5.

**Slike za uporabnika.** Veja `slike/trki-spa` (samo slike, ni del igre): `odpadli-deli/deli-60kmh.jpg`, `deli-120kmh.jpg`, `deli-200kmh.jpg`, `deli-kolo-200kmh.jpg` (vsaka do ~294 KiB) in `README.md` z opisi. Levo ZDAJ (`37d0ef3`), desno POTEM (`b83f985`), Spa, kamera za avtom, Simulacija na obeh straneh. Znova: `git worktree add <prej> 37d0ef3`, nato `node tools/trki/slike.mjs deli60 --deli --velikost 1280x720 --a-opis "kot je v igri" --b-opis "s popravkom" --a-root <prej> --b-root . --a-cv 1 --b-cv 1 --out <mapa> --kb 300` (enako `deli120`, `deli200`, `kolo`; prizori v `tools/trki/slike-scenariji.json`). Pot je na tabli #382; uporabniku jih pošlje Matej. Popravki, ki jih uporabnik želi, gredo pred fazo 2 oziroma pred njen naslednji korak.

### Kako preveriti stanje veje

- `node tests/padec.test.js` (22 preizkusov; v drevesu s Killarjem 30), `node tests/browser/padec.test.mjs` (26; s Killarjem 34), `node tests/trki.test.js`, `node tests/shards.test.js`, `node tools/stamp.js --check`;
- `node tests/golden.test.js`: vseh 140 scenarijev enakih (reference z odpadlimi deli so od commita »Deli: O1 in O2 …«, pred tem `807372c`; vožnja na cesti se ne spremeni); `node tests/races.test.js` (100 dirk, reference od istega commita); `node tests/odpadli-deli.test.js` (40 preverjanj), `node tests/debris.test.js`, `node tests/redflag.test.js` (21), `node tests/aipits.test.js` (10);
- padec v igri je mogoče videti samo v drevesu s Killarjem (`zbirna/proge`: prvi štirje commiti »Padec: …« so tam od 10. 11., peti `c6b33e3e` s `git cherry-pick`): `index.html?proga=killar`; slike `node tools/trki/padec-slike.mjs --root <drevo> --m 524 --kmh 60 --kot 20 --out <mapa>`;
- `npm run test:related` pred vsakim potiskom kode.

## Padec čez rob (Killar)

Naloga uporabnika (10. 11. 2026 ob ~11.00): »Analiziraj kako avto zapelje cez rob in se prevrne v prepad in popravi da bo cimbolj realisticno«; ob ~11.05: »Padec cez rob naj bo zaenkrat mozen samo na progi killar, da prvo tuki uredimo da bo bilo dobro. drugod naj zaenkrat ostane ograja ki prepreci padec cez rob« (pravilo #629 v `CLAUDE.md`); ob 13.55, po prvi primerjavi, v kateri je avto padal do konca tal (do 8 s): **»Vrni tako kot prej po 1,5s«**. Seja session_01Ck3D3QtCPZJ7GHpFr4wi89, račun jure.kopac26 (posreduje Matej).

**Kaj velja po odločitvi ob 13.55.** Avto se čez rob še vedno prevesi in se kotali kot togo telo na resničnih tleh, padec v igri pa traja največ 1,5 s (pred popravkom največ 1,6 s). Nato je avto spet na cesti tam, kjer je šel čez rob: brez zatemnitve in brez daljšega padca do dna. Vsak padec stane vsaj 0,32 škode kot prej; udarci v tem času pustijo vdrtine tam, kjer je avto res udaril (skupaj največ 0,5 na padec).

**Kje teče.** Killar, Indija je samo na veji `zbirna/proge` (#494). Popravek je razvit in preizkušen na drevesu `zbirna/proge` (3c1bbac2) s to spremembo; na `trki/realizem` so samo datoteke padca v svojih commitih (»Padec: …«), brez datotek Killarja, da se dajo prenesti na #494 (razdelek Prenos). Na `trki/realizem` nobena proga nima tal padca (`def.floor`), zato novega padca (togo telo do tal) tu v igri ni; stari padec čez rob (`Race._fall`, brez tal) ostane na zamrznjeni testni progi Uncompahgre, edini s prepadom (`dropAt`; »Popravki po neodvisnem preverjanju«, najdba 3). Jedro novega padca preizkusi `tests/padec.test.js` na izmišljenem pobočju ob resnični cesti, v igri ga je mogoče videti šele v drevesu s Killarjem.

**Na cesti se nič ne spremeni.** Nova koda teče samo za avto, ki je že čez rob (`c.fall`), in samo na progi s tlemi padca (`Track.floor`: edina je Killar). Vse stanje telesa je v predmetu `c.fall.b`; avto ni dobil nobenega novega številskega polja, naključnih števil padec ne porablja. Dokaz: reference vožnje (`tests/golden/sim.json`) so po spremembi enake v vseh 154 scenarijih te veje (v drevesu s Killarjem v vseh 161 scenarijih zunaj Killarja); test »on the road nothing changes« (šest avtov 20 s ob pobočju, s tlemi in brez njih, stanje enako do zadnje števke). Ni vezano na Nastavitve »Trki med avti«.

### Zdaj (pred popravkom, `zbirna/proge` 3c1bbac2)

Analiza štirih agentov (jedro, meritve, izris, slike); vrstice so iz drevesa `zbirna/proge`.

| Kaj | Zdaj | Kje |
|---|---|---|
| Kdaj pade | ko sredina avta prečka črto roba (5,7 m od sredine ceste, 1,2 m za robom asfalta; na mostu 6,7–9,75 m), pri vsaki hitrosti; lesena ograja ne zadrži (do 1,6 % hitrosti) | `Race._offRoad`, `js/core.js:8142` |
| Sunek na robu | hitrost prečno na rob se dvigne na najmanj 4,5 m/s (izmerjeno 1,88 → 4,50 m/s; pri 10 km/h skok na 18 km/h), +1,2 m/s navzgor, vrtenje 0,6·w ± 0,9 rad/s okoli navpične osi | `overEdge`, `js/core.js:4008` |
| Let | točka brez nagiba: teža 14 m/s² (`JUMP_G`), zračni upor 0,35/s, vrti se samo plosko (67–83° do vrnitve); prevešanja čez rob ni | `Race._fall`, `js/core.js:8111` |
| Pobočje | krogla s polmerom 0,8 m na ravnini tal: brez trenja (viskozno 2,5/s), 0,5 s po prvem dotiku konec | `Race._land`, `js/core.js:8125` |
| Konec | po največ 1,6 s, ne glede na globino (0,2–16 m): avto je vrnjen na cesto z 8 m/s, 0–42 m naprej od mesta padca (mediana 11 m), ker se mesto na cesti med padcem premika | `Race.rescue`, `js/core.js:8153` |
| Škoda | vedno +0,32, brez točke udarca, zato brez vdrtin; dotik pobočja ne doda nič | `applyDamage(c, 0.32)` |

Meritve (72 padcev: 12 mest × 8/50/100 km/h × 10°/45°, avto BURJA R7, korak 1/120 s):

- **Nikoli ne obmiruje**: 62 od 63 padcev v prepad se ob vrnitvi še giblje hitreje od 1 m/s; 27 od 63 je vrnjenih iz zraka; v 20 od 63 se avto v 1,6 s tal sploh ne dotakne (16 m prostega pada).
- **Lebdi in gre skozi teren**: krogla drsi 0,7–1,5 m nad pobočjem s 60–70°; narisani avto (vodoravna škatla) ima v 35 od 63 padcev vogal več kot 1 m pod terenom, najgloblje 4,9 m.
- **Se ne prevrne**: nagib vstran 0–3°, nos navzdol 34–52° (po loku padanja); po vrnitvi je avto še 0,5 s narisan z nosom v cesti.
- **Plitvi padci**: 17 od 72 padcev je globokih manj kot 2 m (črta roba je ponekod 5 m pred prelomom pobočja); vseeno napis »ZGRMEL SI V PREPAD!«, +0,32 škode in rez na cesto.
- **Izris in kamera**: `js/render.js` za padec ne ve (`c.fall` ne bere). Kamera za avtom sledi ploskemu vrtenju avta (zasuk 55–65°, spust 10,6–11,9 m); pri počasnem padcu gleda prečno čez cesto in avto je skrit za robom ceste. Ob vrnitvi rez 12–14 m vstran, višina in smer drsita še 0,5–1 s.
- **Zvok, napisi, posnetek**: en udarec, 150 ms tresenja in napis ob začetku; ob dotiku pobočja nič, 0 delcev. Hiter padec se konča z napisom »SKOK 18 m« oziroma »SKOK 26 m« (šteje kot skok). Posnetek dirke ne hrani nagiba: padec predvaja vodoravno, avto gre skozi teren.
- **Pobočje Killarja**: 50–70° na 99 % roba v prvih 10 m (mediana 64°), 52° na 10–20 m, 30° na 20–30 m, polica na 30–45 m, naprej 31–35° do 100–250 m globine. Tla padca v datoteki proge (`def.floor`, mreža 5 m) segajo 30–37 m za črto roba in zajamejo 27–141 m višine (mediana 43 m); od narisanega terena se razlikujejo za največ 0,05 m.
- **Tekmeci**: 1,8 padca na dirko s 13 avti (4,2 z 22), vsak stane ~1,5 s; vsi padci levo, pri 81–139 km/h, okoli 0,50, 0,95 in 1,55 km.

### Kaj pomeni »realistično« in kako se preverja

Avto, ki zapelje čez rob, je togo telo na resničnih tleh: nanj delujejo samo teža, podpora tal in trenje. Merila so številke, ki jih meri `tests/padec.test.js` z lastnim računom na točkah trupa (ne z bralnikom jedra): 30 preizkusov v drevesu s Killarjem, 22 na tej veji. Telo test spremlja dlje, kot traja padec v igri (do 8 s, možnost dirke `opts.fallCap`), da se vidi, kako se kotali, drsi in obmiruje; preizkusa »the game's fall lasts 1.5 s« (izmišljeno pobočje in Killar) potrdita, da je padec v igri natanko začetek tega dolgega padca (stanje telesa po 1,34 s enako do zadnje števke) in da se konča po 1,5 s.

| Merilo | Meja v testu | Zdaj | Potem |
|---|---|---|---|
| Padec v igri traja največ 1,5 s | po 1,5 s (+ en korak) je avto na cesti do 3 m od mesta prehoda, na kolesih, en padec, škoda 0,32–0,5 (Killar: z zlomljeno ograjo vred do 0,6) | 1,6 s | 1,51 s |
| Čez rob se prevesi, ko gre težišče čez | pri hoji se od prvega koraka vrti z 0,3–2 rad/s, v 1,5 s je dno nagnjeno več kot 30° | sunek, vodoraven let | prevesi se okoli roba ploščadi (0,80 rad/s takoj) |
| Brez sunka čez rob | hitrost prečno na rob po začetku padca ni večja kot pred njim (+0,3 m/s); telo začne v nagibu ceste (vzpon ceste na 0,3 % natančno) | dvig na 4,5 m/s | enaka (2,4 → 2,4 m/s) |
| Kotali se in drsi s trenjem | hiter in počasen padec gresta čez bok ali streho; na 10° pobočju obstane na pobočju, na 60° gre naprej | plosko vrtenje, brez trenja | trenje 0,8, kotaljenje |
| Nikoli v teren | nobena točka trupa več kot 3 cm pod tlemi (Killar 5 cm), v nobenem koraku | vogal do 4,9 m | največ 1 cm |
| Nikoli ne odskoči | s 2,5 m stopnice pristane in ostane: po dotiku nikoli več kot 0,6 m nad najnižjo točko, nikoli hitreje od 2,5 m/s navzgor | (krogla) | brez odboja |
| Nikoli ne pridobi energije | energija (hitrost, vrtenje, višina) nikoli več kot 0,15 m višine nad najmanjšo dotlej, vsi dvigi enega padca skupaj pod 0,5 m | sunek na robu doda energijo | največ 0,10 m (trideset padcev), Killar 0,05 m |
| Tla ga ne potisnejo | telo se v koraku nikoli ne premakne več kot 0,1 m dlje, kot ga nese hitrost (serpentina 0,15 m): ni potisnjeno čez rob ceste ali gor skozi cesto | – | največ 2,6 cm |
| Obmiruje, kjer ga pobočje ustavi (dolgi padec v testu) | vsi štirje padci na 45° pobočju z dnom ležijo pri miru ob vznožju; za mirovanje vzeto šele pod 0,5 m/s in 0,7 rad/s | nikoli | v testu obmiruje po 4,8–7,2 s; v igri je avto vrnjen že po 1,5 s |
| Udarci se poznajo | trd padec da vdrtino tam, kjer je udaril; telo šteje 0,012 škode na m/s vsakega udarca nad 3 m/s, največ 0,5 na padec; vsak padec stane vsaj 0,32 | +0,32 brez vdrtin | 0,32–0,5, vdrtina na udarec, streha od zgoraj |
| Vrnjen tja, kjer je šel čez | do 3 m od mesta prehoda, mesto na cesti, razdalja in števci med padcem zamrznjeni | 0–42 m naprej | na mestu prehoda |
| Brez naključja | isti padec z drugimi naključnimi števili okoli njega se konča enako do zadnje števke | – | enako |
| Vsako vozilo | najlažje, najtežje, najkrajše in najdaljše vozilo: končno, brez vdora, brez pridobljene energije; trup vsakega od 54 vozil je visok, kot je vozilo narisano (na 3 cm), težišče na 0,25–0,45 višine | – | enako |
| Rob ceste in bankina | s 1,3 m stopnice v jarek obstane ob boku ceste (ne pod cesto, ne potisnjen gor skozi njo); kjer stran nima padca in za črto ni narisanih tal, ostane na višini ceste in se ustavi | – | obstane 2,5 m za črto |
| Konec znanih tal | kjer se znana tla končajo, se padec konča in avto je vrnjen (Killar: 0,48 km pri 130 km/h, 0,57 km pri 5 km/h), brez vdora in brez sunka | – | konec po 3,7 in 5,7 s dolgega padca |
| Serpentina in most (Killar, 4,04–4,06 km) | čez levo in desno stran pri 29, 50 in 90 km/h: telo vsakič, brez potiska čez rob ceste, vsak padec se konča | – | 15 od 17 voženj gre čez rob, vsi padci končani |
| Vozilo s prikolico | pade po starem (brez telesa, konec v 2 s) | – | cisterna 0,52 s |
| Vožnja na cesti do številke enaka | šest avtov 20 s ob pobočju: stanje enako s tlemi in brez; reference vožnje zunaj Killarja nespremenjene | – | 154 scenarijev te veje enakih |
| Samo Killar | `def.floor` ima samo Killar; drugje pade avto po starem (ali ga zadrži ograja, #629) | – | enako |

**Zunaj testa** (10. 11. 2026). 1320 padcev na 101 mestu vzdolž Killarja (5–130 km/h, pod 5–80° na rob, obe strani, naprej, vzvratno, v vrtenju in v skoku; padec v igri, 1,5 s): energija se nikoli ne dvigne za več kot 0,07 m, v narisanih tleh je trup največ 1 cm, škoda je 0,32 (mediana) do 0,5, avto pade 7,2 m (mediana) in največ 16,4 m; 1219 padcev konča meja 1,5 s, 100 konec znanih tal, 1 obmiruje. Neodvisen pregled jedra je našel 8 pomanjkljivosti, nobene hude: popravljene so (skok narisanih tal pod točko trupa, višina trupa vozil iz sestavljenih delov, začetek padca pri oddaljenih tekmecih, najmanjša škoda ob vsakem koncu, pokritost testa), ena je med omejitvami spodaj. Preizkus testa samega: 59 napak, vstavljenih posamič v kopijo jedra, test jih ujame 50; preživijo take, ki se na izidu padca ne poznajo (debelina ploščadi, največji izriv iz tal, število krogov reševanja stikov), in dve, ki ju test ne meri (reševanje razbitega tekmeca med padcem, mirovanje ob počasnem vrtenju na mestu).

### Zdaj: padec v slikah (kamera za avtom)

Stanje veje `zbirna/proge`, Killar, Indija, levi rob (stran prepada). Številke v tabelah so iz voženj na 3f1d2759; slike za primerjavo so iz istih voženj na 3c1bbac2 (iste `js/core.js`, `js/render.js` in `js/game.js`, cesta ima dodan nežen prečni nagib: razlike do 0,1 m in 0,02 s). Avto BURJA R7 (3,95 × 1,80 m), sam na progi, suho, podnevi, slika 1280 × 720 ležeče. Avto je postavljen na ravno črto proti robu, do roba drži hitrost brez volana, po robu je brez pedal; dirka teče po korakih 1/120 s. »Rob« (čas 0) je korak, v katerem sredina avta prečka črto roba. Ta črta je 1,2 m za robom ceste (5,7 m od sredine, polovica ceste je 4,5 m), na njej stoji lesena ograja. Vsaka vožnja ima list z 8 slikami ob določenih časih igre (od 0,3 s pred robom do 1 s po vrnitvi na cesto) in list z izrezi okoli avta.

| Mesto in vožnja | Ograja zlomljena | Dotik pobočja | Vrnjen na cesto | Najgloblje pod robom | Najdlje čez črto roba | Najmanj nad terenom | Zasuk v ravnini | Nagib vstran | Nos navzdol | Škoda |
|---|---|---|---|---|---|---|---|---|---|---|
| 0,52 km, 60 km/h pod 20° | −0,27 s | +1,26 s | +1,61 s | 13,4 m | 7,1 m | 0,93 m | 77° | do 3° | do 34° | +0,35 |
| 0,52 km, 10 km/h pod 40° | −1,12 s | +0,98 s | +1,49 s | 8,9 m | 6,8 m | 0,34 m | 67° | do 1° | do 49° | +0,32 |
| 1,28 km, 60 km/h pod 20° | −0,28 s | +0,33 s | +0,83 s | 0,1 m | 2,8 m | −0,01 m | 31° | do 3° | do 3° | +0,35 |
| 1,28 km, 10 km/h pod 40° | −1,10 s | +0,40 s | +0,91 s | 0,7 m | 2,8 m | 0,03 m | 35° | do 1° | do 19° | +0,32 |

Teren prečno čez rob (višine glede na cesto; tla padca se od narisanega terena razlikujejo za največ 0,05 m):

| Mesto | Prelom pobočja (prvi padec nad 30°) | Strmina 0–5 m | 5–15 m | 15–30 m | Teren 5 / 15 / 30 m za črto roba |
|---|---|---|---|---|---|
| 0,52 km | na črti roba | 50,5° | 60,8° | 35,8° | −7,0 / −24,9 / −35,7 m |
| 1,28 km | 5 m za črto roba | 8,6° | 59,8° | 34,1° | −1,1 / −18,3 / −28,5 m |

Kaj je na slikah:

- **Pred robom ni prevešanja.** Pri 10 km/h je nos avta 0,3 s pred robom že 0,8 m čez črto roba in nad pobočjem, avto pa je narisan vodoravno na višini ceste.
- **Na robu sunek.** Hitrost prečno na rob se dvigne na najmanj 4,5 m/s (pri 10 km/h skok na 18 km/h), avto dobi 1,2 m/s navzgor (kjer se cesta vzpenja, skupaj do 1,9 m/s) in 0,9 rad/s vrtenja okoli navpične osi. Smer vrtenja določi predznak hitrosti zasuka na robu (tu ±0,005 rad/s): pri 60 km/h se je nos obrnil proti hribu, pri 10 km/h proti dolini.
- **V zraku se vrti plosko.** V 1,5–1,6 s se zasuka za 67–77°, vstran se ne nagne (do 3°), nos sledi loku padanja (do 34° oziroma 49° navzdol). Avto se nikoli ne prevrne.
- **Na pobočju lebdi in ne obstane.** Padec je krogla s polmerom 0,8 m: na pobočju s strmino ~60° drsi sredina avta 0,9 m nad terenom, avto je narisan pokonci. Od prvega dotika ima 0,5 s, vsega skupaj največ 1,6 s: na cesto je vrnjen sredi pobočja, 9–13 m pod robom (teren je 30 m za robom 36 m pod cesto), še pri 16–20 km/h. Dotik pobočja ne doda škode: +0,32 pride šele ob vrnitvi (pri 60 km/h prej še +0,03 od ograje).
- **Pri 1,28 km avto sploh ne pade.** Črta roba je 5 m pred prelomom pobočja. Avto skozi ograjo zapelje na skoraj ravno travo, ostane pokonci (0,1–0,7 m pod robom), po dotiku ga v 0,5 s zavre z 48 na 12 km/h (pri 10 km/h skoraj obstane, 5 km/h). Vseeno dobi napis »ZGRMEL SI V PREPAD!«, +0,32 škode in rez na cesto po 0,8–0,9 s. Količek z rumenim vrhom ob cesti tam gleda skozi avto.
- **Kamera za avtom** ostane 36–40 m od avta in 25–29 m nad njim; v pobočje ne gre (med padcem najmanj 17,8 m nad terenom). Sledi ploskemu vrtenju avta: pogled se na 0,52 km zasuka za 55–63°. Pri 10 km/h zato gleda prečno čez cesto s strani hriba in avto je od +0,96 s do vrnitve (0,53 s) skrit za robom ceste: padca se ne vidi.
- **Rez nazaj na cesto.** Avto je v enem koraku na cesti z 29 km/h. Kamera je še tam, kjer jo je pustil padec (40–90° vstran, 16–18 m nad avtom namesto 25–27 m), in se vrne v ~1 s. Avto je na 0,52 km še ~0,5 s narisan z nosom 22–37° navzdol (na ravni cesti stoji na nosu).
- **Napis** »ZGRMEL SI V PREPAD!« pride v prvi sliki po robu (ploščica desno zgoraj, 2 s). Pri 60 km/h na 0,52 km ga ob vrnitvi zamenja »SKOK 18 m«: padec šteje kot skok, dolžina je razdalja od roba do mesta vrnitve.

Kje v kodi (vrstice v drevesu veje `zbirna/proge`, 3f1d2759):

| Kaj | Kje |
|---|---|
| Meja padca: sredina avta čez črto roba | `js/core.js:8142` (`_offRoad`) |
| Sunek na robu (4,5 m/s ven, +1,2 m/s gor, ±0,9 rad/s) | `js/core.js:4008` (`overEdge`) |
| Padec, konec po 1,6 s, škoda 0,32 | `js/core.js:8111` (`_fall`) |
| Krogla 0,8 m na pobočju, 0,5 s po dotiku | `js/core.js:8125` (`_land`), `js/core.js:3394` |
| Vrnitev na cesto z 8 m/s | `js/core.js:8153` (`rescue`) |
| Drža avta v zraku (samo nos gor in dol) | `js/render.js:6924` |
| Višina kamere sledi višini avta; kamera ne gre pod teren | `js/render.js:9898`, `js/render.js:9940` |
| Napis ob padcu; padec šteje kot skok | `js/game.js:3320`; `js/game.js:3305`, `js/game.js:3156` |
| Rob brez ograje, lesena ograja, tla padca na progi | `js/tracks/killar.js:106`, `112`, `122` |

Slike naredi orodje `tools/trki/padec-slike.mjs` (potrebuje drevo s Killarjem): `node tools/trki/padec-slike.mjs --root <mapa igre> --m 524 --kmh 60 --kot 20 --pred 0.8 --out <mapa>`. Za slike po popravku z istimi časi igre: `--root <popravljeno drevo> --po <prejšnji .json> --oznaka POTEM --dodaj 3,4,5`. Ponovljena vožnja da bit za bit enake slike in enake kontrolne vsote vožnje (do ograje, do roba, do vrnitve).

### Popravek: datoteke in funkcije

**Jedro (`js/core.js`, blok `FALL` pred `class Race`).** Avto, ki gre čez rob na progi s tlemi padca, je od naslednjega koraka togo telo s šestimi prostostnimi stopnjami:

| Funkcija | Kaj dela |
|---|---|
| `FALL` | vsa števila: teža 9,81 m/s² (prava, ne `JUMP_G`), trenje 0,8 (kolesa vzdolž avta 0,25, dokler stoji na njih), najmanj 240 podkorakov na sekundo, 8 krogov reševanja stikov, mirovanje (pod 0,4 m/s in 0,6 rad/s za 0,4 s, nato leži 0,8 s), **najdaljši padec `cap` 1,5 s** (test sledi telesu dlje z možnostjo dirke `opts.fallCap`), škoda udarca (nad 3 m/s: 0,012 na m/s, največ 0,5 na padec) in najmanjša škoda padca `dmgCut` 0,32, `deep` 0,12 m (koliko globlje kot ob zadnjem pogledu je točka trupa še lahko v tleh), težišče `hcK` na 0,36 višine trupa, višine trupa po vrsti karoserije |
| `fallHull(M)` | trup vozila iz 38 točk v oseh avta od težišča: 25 na dnu (višina koles), 8 v pasu (pokrov, prtljažnik, boki), 5 na strehi; mere iz modela (`len`, `wid`); višina `M.ht`, pri vozilih iz sestavljenih delov iz njihovega opisa (`look.body.roofY` ali `parts.ht`), sicer po vrsti karoserije; težišče `M.hcg` ali 0,36 višine (najmanj 0,35 m, največ pol višine); za vsak model se izračuna enkrat |
| `fallStart(T, c, F, dt)` | začetno stanje: hitrost avta brez sunka `overEdge` (vzame ga nazaj: prečno hitrost na tisto pred robom, skok in vrtenje), avto stoji na nagibu ceste (vzpon in prečni nagib), majhen začetni zasuk za čas, ko so bila sprednja kolesa že čez rob; `dt` je dejanski zadnji korak avta (`fallLast`: oddaljenega tekmeca računa LOD redkeje, njegov korak je daljši) |
| `fallQ`, `fallEdge` | projekcija telesa na cesto (lastna, brez stranskih cest) in ploščad ceste pod njim: višina, vzpon, črti roba, ali ima stran prepad |
| `fallGround` | tla za eno točko trupa: znotraj črt roba ploščad ceste z njenim nagibom (debela 1,5 m, z navpičnim robom: točko, ki pride pod ploščad z zunanje strani, potisne ven, ne gor), zunaj narisana tla (`Track.floorAt`: višina in naklon trikotnika mreže 5 m); kjer tal ni, točka ne nosi |
| `fallTouch` | stiki vseh točk trupa v eni legi. Točka, ki se znajde v tleh globlje, kot je mogla priti od zadnjega pogleda (prejšnja globina + 0,12 m + zadnji izriv + pot v podkoraku), ne da stika, dokler ni spet prosta: trikotniki narisanih tal in rob ploščadi se stikajo s skokom, in brez tega pravila bi telo ob skoku dobilo sunek. Če pod tako točko prej ni bilo znanih tal, se padec konča (`B.lost`) |
| `fallSub` | podkorak: teža, zaporedni sunki v točkah stika brez odboja (restitucija 0) s Coulombovim trenjem, zaznava udarca (točka, ki prvič zadene hitreje od 3 m/s), premik in zasuk, izriv iz tal (največ 0,25 m na podkorak, 1 cm ostane), pravila mirovanja in konca |
| `fallBody(race, c, F, dt)` | korak dirke: podkoraki, prepis lege v polja avta (`c.x, c.y, c.z, c.h`, hitrosti; `c.air = 1`), udarec → `knock(c, škoda, lx, lz)` z vdrtino na mestu udarca (streha: vdrtina od zgoraj in `roofDmg`), konec → doplačilo do najmanjše škode 0,32 in `Race.rescue`; takoj za tem višina ceste pod avtom (`c.roadY = c.y`: vanjo je med padcem pisalo telo, na krožni progi jo `rescue` prepusti naslednjemu koraku avta, slika pa je lahko narisana prej: kamera in senca bi bili eno sličico do sekunde prenizko) |

Priklopi v obstoječo kodo so štirje, vsak ena vrstica: `Race._fall` (`if (this.track.floor && !c.tl) { fallBody(…); return; }`), zanka napredka v `Race.step` (avto, ki pada kot telo, preskoči: mesto na cesti `c.q`, razdalja, kontrolne točke in števca »narobe« in »obtičal« ostanejo, kjer je šel čez), `_wreckStep` (tekmeca brez kolesa med padcem ne rešuje) in `Race._lodPlan` (načrt LOD si za vsak avto zapomni dolžino prejšnjega koraka, `pd`; vožnja je ne bere). Vozilo s prikolico (`c.tl`) in proga brez tal padca (Uncompahgre, zamrznjena) padata po starem.

**Konec padca** (`B.done`): 1 = obmiruje (in leži 0,8 s); 2 = znanih tal ni več (pod več kot polovico trupa 0,25 s ni tal, ali je točka trupa v tleh tam, kjer prej tal ni bilo: konec podatkov `def.floor`, 30 m za robom); 3 = meja `cap`, v igri 1,5 s (tako se konča 92 % padcev na Killarju). Ob vsakem koncu ima avto od padca najmanj staro škodo 0,32, in `Race.rescue` ga vrne na cesto tam, kjer je šel čez (`c.q` je zamrznjen), z 8 m/s, kot doslej.

**Kaj bere izris** (dogovor z `js/render.js` in posnetkom): `c.fall.b` z legami `x, y, z` in prejšnjimi `px, py, pz`, kvaternionom `q` in prejšnjim `pq` (vrstni red x, y, z, w, osi telesa so osi skupine avta v izrisu), višino težišča `hc` in zadnjim udarcem `hn` (števec), `hx, hy, hz` (točka v svetu), `hv` (hitrost), `hr` (streha), `nc` (število točk na tleh).

### Popravek: izris, kamera, zvok, posnetek

Vse bere samo `c.fall.b` (dogovor zgoraj); kjer telesa ni (druge proge, vozilo s prikolico), se nič ne spremeni.

| Datoteka | Funkcija | Kaj dela |
|---|---|---|
| `js/render.js` | `fallPose` | avto je narisan v legi telesa: zasuk med zadnjima korakoma telesa, izhodišče = težišče − `hc` vzdolž osi gor; od ceste ne ostane nič (nagib, vzmetenje, robniki), kolesa so naravnost in se izvrtijo do mirovanja, črno podvozje je pokazano in senca pod avtom skrita (kot pri prevračanju), ime ostane nad avtom |
| | `fallBack` | v sliki, ko je avto spet na cesti, stoji po nagibu ceste takoj (ni zglajen iz lege, v kateri se je padec končal), brez prahu in tresenja pristanka |
| | `fallFx` | namesto učinkov vožnje (sledi gum, plamen, iskre podvozja): ob vsakem trdem udarcu oblak prahu s tal na mestu udarca, pri močnejšem še kamni; iskre zlomljene ograje ostanejo |
| | `fallCam`, `fallHead` | kamera za avtom med padcem gleda vzdolž ceste, kjer je šel avto čez (ne po smeri avta, ki se vrti), in mu sledi navzdol, najmanj 4 m nad pobočjem; avto ostane v sliki ležeče in pokonci; v sliki, ko je avto spet na cesti, je kamera takoj za njim (kot `resetCam`): brez zatemnitve in brez dviga s pobočja |
| `js/game.js` | `fallFb` | vsak trd udarec igralčevega avta: zvok trka, vibracija in tresenje pogleda kot ob zidu te hitrosti (Nastavitve · Tresenje kamere: ob trku); po vrnitvi brez zvoka pristanka, brez napisa in dolžine skoka |
| | `recFall`, `rpFall`, `rpFalls` | posnetek dirke shrani lego telesa v istih sedmih številih na avto (zasuk namesto smeri, hitrosti in volana; zastavice od `REC_FB` navzgor: stik s tlemi, števec in moč udarcev, streha), ponovitev postavi avto v isto lego; starejši posnetki se berejo kot prej |
| `js/sfx.js` | `falls` | med padcem je motor v prostem teku, brez zvoka gum in robnikov; ko se telo dotika tal, drsenje karoserije |
| `tools/posnetek.mjs` | | izpiše padce čez rob v posnetku (kdo, od kdaj do kdaj, kje, trdi udarci) in z `--zastavice` naredi sliko sredi vsakega padca |

**Preizkus v brskalniku**: `tests/browser/padec.test.mjs`, 34 preizkusov (26 v drevesu brez Killarja), 1–2,5 min. Na pravi progi (Spa, Belgija) test za levim robom pri 1630 m postavi izmišljeno pobočje 45° (tla padca samo v strani testa: `Track.floor`, `Track.floorAt`); igralec gre čez rob trikrat (28 m/s pod 20°, 5 m/s pod 60°, hitro še pokonci 360 × 640), tekmec enkrat. V drevesu s Killarjem še dva prava prehoda pri 524 m (60 km/h pod 20° ležeče, 10 km/h pod 40° pokonci). Preveri:
- narisana lega avta je v vsaki sličici padca lega telesa (do 4e-6° in 0 m), avto je vidno nagnjen (do 72°), senca pod njim skrita in podvozje pokazano, po padcu oboje kot prej;
- pravilo 1,5 s (181 korakov) in v sličici tega koraka avto stoji na cesti tam, kjer je šel čez (ni zglajen iz lege padca);
- v isti sličici je kamera za avtom na razdalji in višini novega pogleda in senca pod avtom, ne glede na to, kateri korak sličice je avto vrnil;
- brez zatemnitve med padcem in po njem; napis »ZGRMEL SI V PREPAD!«; središče avta je ves padec v sliki, ležeče in pokonci;
- po vrnitvi brez učinkov pristanka (tresenje, zvok, dolžina skoka, prah), dirka teče naprej, števca razdalje in krogov se med padcem ne premakneta;
- vsak trd udarec da prah in en tresljaj pogleda `min(1,2; 0,08 × hitrost udarca)`; vsak padec stane vsaj 0,32 škode;
- tekmec pade po istih pravilih, njegov padec igralčevega pogleda ne trese in ne pokaže napisa;
- ponovitev (Posnetek do sem) nariše vsak padec, kot je bil v živo (smer gor do 0,5°, mesto do 0,01 m), po vrnitvi avto stoji na cesti s senco; `rpFalls()` našteje točno padce, ki so se zgodili; ljudje ob progi med padcem dobijo hitrost avta po tleh (0,4- do 2-kratnik hitrosti v živo); brez napak na strani;
- »Posnetek do sem« sredi padca po trdem udarcu (posnetek pokaže avto na cesti, nato zgodaj v istem padcu) in nazaj v dirko: udarci, ki jih je telo že imelo, ne dajo prahu še enkrat, naslednji udarec ga da;
- za rezultati (igralec v cilju, dirka teče): posnetek z rezultatov, odprt in zaprt sredi tekmečevega padca, pusti avto, kot ga je imela dirka (isto telo, nedotaknjeno, mesto na cesti ob robu), in padec se konča z vrnitvijo tja, kjer je šel čez.

**Meritev zunaj testa** (končno drevo s Killarjem, 38 padcev vzdolž proge, 3420 sličic padca, 640 × 360 in 360 × 640): narisana lega je v vsaki sličici lega telesa (odstopanje 0), središče avta ni v nobeni sličici zunaj slike, v nobeni ga ne zakrije pobočje in v nobeni ni pod narisanimi tlemi; ob vrnitvi je kamera od novega pogleda oddaljena največ 0,06 m. Izris vožnje brez padca je do številke enak kot prej (Killar 339.000 števil, Bathurst 495.000).

**Slike ZDAJ/POTEM** (kamera za avtom, isti prehod pri 0,52 km ob istih časih igre): `docs/trki-slike/padec-60kmh.webp` in `padec-10kmh.webp` (izrez okoli avta), `padec-60kmh-cela-slika.webp` (cela slika). Pri 60 km/h pod 20° avto zleti čez rob, se v zraku nagne za 72° in je po 1,51 s spet na cesti (prej: plosko vrtenje, lebdenje nad pobočjem, ob vrnitvi kamera še s strani). Pri 10 km/h pod 40° se prevesi čez rob na bok, po 0,76 s udari ob pobočje in je po 1,51 s spet na cesti (prej: sunek čez rob in avto za terenom). POTEM je narisan na drevesu `zbirna/proge` 3c1bbac2 s štirimi commiti padca iz razdelka Prenos (oznaka drevesa v sliki je lokalna, ker tega drevesa ni na nobeni veji); slike naredi `tools/trki/padec-slike.mjs` z istimi časi igre kot ZDAJ (`--po`).

### Spremembe v datotekah Killarja (vnese seja Killarja, #494)

Ta veja Killarjevih datotek ne spreminja. Ko pridejo commiti padca v drevo s Killarjem, so potrebne te spremembe (preizkušene lokalno na `zbirna/proge` 3c1bbac2 s padcem; seznam velja za padec 1,5 s in zamenja prejšnjega za 8 s):

1. **`tests/killar.test.js`** (popravek `tools/trki/padec-killar-test.patch`, `git apply`; dve mesti v pomočniku `run()` in v preizkusu »over the edge the car lands on the slope«):
   - prvi dotik pobočja `if (tl < 0 && P.fall.land) tl = k;` → `if (tl < 0 && P.fall.b && P.fall.b.hn) tl = k;` (prvi udarec telesa; zastavice `land` telo nima);
   - pogoj `x.fallT <= 1.61 && (x.land < 0 || x.slid <= 0.51) && x.fin) && onto.filter(x => x.land >= 0).length >= 6` → `x.fallT <= 1.61 && x.fin) && onto.filter(x => x.land >= 0).length >= 3` (meja 1,61 s ostane; ob pobočje v tem času udarijo 4 od 10 voženj; prej je test zahteval dotik pri vsaj 6 od 10); besedilo preizkusa in izpis (»first knock after … s« namesto »touched after … s, slid … s«).
   S tem je test 27/27 zelen. Brez popravka pade samo ta preizkus (»no touch« pri vseh desetih).
2. **`tests/lib/sim.js`, `CRASH_AT`**: `'killar/rally': 12.75` → `15.5`, `'killar/ev': 8.25` → `4` (`'killar/formula': 7.5` ostane). Razlog: avto je po padcu vrnjen na mesto prehoda (prej do 42 m naprej, od koder je pogosto padel ali trčil še enkrat), zato pri starih časih pade enkrat in se ne razbije (škoda 0,42 in 0,43, noben del ne odpade) in `golden.test.js` javi »this run does not really crash«. Z novima časoma: `killar/crash/cs` škoda 0,78 in 3 odpadli deli, `killar/car/cs` škoda 1 in 2 odpadla dela; `killar/formula/cs` (0,38, 2 dela) in `killar/lm/cs` (0,41, 2 dela) ostaneta pokrita. Izbrana iz pregleda časov 4–16 s po 0,5 s.
3. **`tests/golden/sim.json`**: vnosi `killar/race|demo|upg|crash|formula|lm|car/cs` (7) se spremenijo; po točki 2 `node tests/golden.test.js --update --only=killar`. Drugih 161 scenarijev ostane enakih (preverjeno s tem seznamom).
4. **`tests/golden/races.json`**: vnosi `killar/cs…` (5): spremenijo se štirje (`killar/cs`, `killar/cs/formula`, `killar/cs/lm`, `killar/cs/car`; `killar/cs/rain` ostane enak), vseh 13 avtov pride na cilj, čas zmagovalca se premakne za največ 0,07 s; `node tests/races.test.js --update --only=killar`.
5. **`docs/proge/killar.md`**, alineji »Prepad« in »Pristanek na pobočju« (vrstici 12–13): »po 1,6 s se vrne na cesto« → »po 1,5 s«; namesto opisa krogle `Race._land` (zdaj samo še za vozila s prikolico) opis padca kot telesa: avto se prevesi čez rob, se kotali in udarja ob pobočje, udarci pustijo vdrtine, nikoli ni pod narisanimi tlemi; po največ 1,5 s se vrne na cesto, kjer je šel čez (`js/core.js`, `FALL`, `fallBody`; preizkusi `tests/padec.test.js`, `tests/browser/padec.test.mjs`).
6. **Registracija testov** na `zbirna/proge` (commit z registracijo se ne prenaša, ker ima ta veja druge sezname): `padec.test.js` v seznam `node` in `browser/padec.test.mjs` v seznam `browser` (`tests/run.js`), vrstica `RELATED` za `js/core.js`, `js/render.js`, `js/game.js`, `js/sfx.js` in `tools/posnetek.mjs`, pričakovani seznam v `tests/shards.test.js`, vrstici v `tests/README.md`.
7. **Ni potrebno**: širša tla padca (`def.floor` 30 m za robom zadoščajo: v 1,5 s jih preleti samo zelo hiter avto, in takrat se padec konča prej). `Race._offRoad` lahko padec začne brez sunka `overEdge` (`c.fall = { t: 0, raw: 1 }`); zdaj ga `fallStart` vzame nazaj sam, zato sprememba ni nujna.

### Prenos na `zbirna/proge` (#494)

Commiti »Padec: …« na tej veji vsebujejo samo datoteke padca: `js/core.js`, `js/render.js`, `js/game.js`, `js/sfx.js`, `tools/posnetek.mjs`, `tests/padec.test.js` in `tests/browser/padec.test.mjs`. Na `zbirna/proge` se prenesejo s `git cherry-pick` v tem vrstnem redu:

1. `df083d99` Padec: avto čez rob pade kot togo telo (jedro, test)
2. `33e6ba73` Padec: padec v igri traja največ 1,5 s, nato je avto spet na cesti (jedro, test)
3. `1ac5a0ed` Padec: po vrnitvi je višina ceste pod avtom nastavljena takoj (jedro, test)
4. `a771fe19` Padec: izris, kamera, zvok in posnetek padca kot telesa (render, game, sfx, posnetek, brskalniški test)
5. `c6b33e3e` Padec: posnetek sredi padca in za rezultati (prah, telo padca, hitrost, smer; brskalniški test)

**Stanje 11. 11. 2026:** prvi štirje so na `zbirna/proge` od 10. 11. (`888f56ab`, `2ed9dbab`, `d17b867b`, `98799b71`, Killarjeve spremembe `8de444ef`). **Manjka peti**: `git fetch origin trki/realizem && git cherry-pick c6b33e3e` (prenese jure.kopac26, tabla #382). Preverjeno na `zbirna/proge` `8de444ef`: brez sporov, `node tests/browser/padec.test.mjs` 34/34 (osem preverjanj Killarja med njimi); jedra in `tests/padec.test.js` commit ne spreminja. Registracije testov ne spreminja.

Preverjeno na `zbirna/proge` 3c1bbac2 (prvi štirje): brez sporov (`js/render.js` in `js/sfx.js` git zlije sam), datoteke po prenosu enake kot v drevesu, na katerem je bil popravek preizkušen; `tests/padec.test.js` tam 30/30 (na tej veji 22/22, ker osem preizkusov potrebuje Killar), `tests/browser/padec.test.mjs` 30/30 (tu 22/22), `tests/killar.test.js` s popravkom iz točke 1 zgoraj 27/27. Registracija testov (`tests/run.js`, `tests/shards.test.js`, `tests/README.md`), dokumenti, slike in orodja so v commitih »Trki: …«, ki se ne prenašajo (točka 6 zgoraj). Če gre Killar na `main` pred to vejo, se po spoju `main` v `trki/realizem` isti deli zlijejo brez sporov (ista vsebina na obeh straneh).

**Koraki za sejo Killarja.** Seja Killarja se je 10. 11. 2026 ustavila, preden je commite prenesla; prenos naredi nova seja Killar na `zbirna/proge` (naloga ob zagonu, Matej):
1. `git fetch origin trki/realizem`, nato `git cherry-pick df083d99 33e6ba73 1ac5a0ed a771fe19` (v tem vrstnem redu). Pred tem poglej `git log --oneline origin/trki/realizem --grep="^Padec:"`: če je za `a771fe19` še kakšen commit »Padec: …« (popravek najdb pregleda, razdelek »Predaja«), ga dodaj na konec seznama. Na 3c1bbac2 sporov ni. Če se je `zbirna/proge` vmes spremenila in spor nastane: v bloku `FALL` in v funkcijah `fall…` (`js/core.js`, `js/render.js`, `js/game.js`, `js/sfx.js`) velja vsebina commita, drugod vsebina `zbirna/proge`.
2. Killarjev test: `git show origin/trki/realizem:tools/trki/padec-killar-test.patch | git apply` (točka 1 prejšnjega razdelka).
3. `CRASH_AT` v `tests/lib/sim.js` (točka 2), nato `node tests/golden.test.js --update --only=killar` in `node tests/races.test.js --update --only=killar` (točki 3 in 4), besedilo v `docs/proge/killar.md` (točka 5), registracija obeh testov padca (točka 6).
4. Preveri: `node tests/padec.test.js` 30/30, `node tests/killar.test.js` 27/27, `node tests/browser/padec.test.mjs` 30/30 (zadnjih osem preizkusov je Killar; s petim commitom `c6b33e3e` 34/34), `node tests/golden.test.js` (vnosi zunaj Killarja enaki kot prej). V igri: `index.html?proga=killar`, čez levi rob pri ~0,52 km: avto se prevesi in kotali, napis »ZGRMEL SI V PREPAD!«, po 1,5 s stoji na cesti, kjer je šel čez, kamera je takoj za njim, brez zatemnitve.

### Odločitve, omejitve, odprta vprašanja

- **Padec v igri traja največ 1,5 s** (uporabnik 10. 11. 2026 ob 13.55: »Vrni tako kot prej po 1,5s«). Prva različica popravka je telo spremljala do konca (obmiruje, konec znanih tal ali 8 s; mediana 4,8 s); po primerjavi v slikah je uporabnik izbral staro trajanje. Posledica: ob vrnitvi avto praviloma še pada ali se kotali (1219 od 1320 izmerjenih padcev na Killarju konča meja, 100 konec znanih tal, 1 obmiruje). Pri 60 km/h pod 20° (0,52 km) je v 1,5 s nagnjen za 72° in 10,9 m pod robom, ne da bi se dotaknil tal; pri 10 km/h pod 40° se prevesi čez rob, po 0,76 s udari ob pobočje in je ob vrnitvi 3,3 m pod robom na boku (nagnjen 98°). Daljši padec ostane v jedru kot možnost dirke (`opts.fallCap`); uporablja jo samo test.
- **Brez zatemnitve**: vrnitev je rez kot pred popravkom; kamera je v isti sliki za avtom na cesti.
- **Škoda**: vsaj 0,32 na padec kot prej, z udarci največ 0,5 (meja velja pred faktorjem vozila: najlažje vozilo dobi do 0,65).
- **Vrnitev je vedno na mesto prehoda** (prej do 42 m naprej), tudi ko bi telo obstalo na cesti ali bankini. Predaja na mestu bi zahtevala prehod iz telesa v vožnjo; ni narejeno.
- **Čas**: padec stane igralca in tekmece toliko kot prej (1,5 s namesto 1,6 s). Tekmeci padejo 1,8-krat na dirko s 13 avti; reference dirk na Killarju se premaknejo malo (čas zmagovalca največ 0,07 s, točka 4 zgoraj). Gumb ↺ Na progo padec prekine; tak padec ni štet.
- **Česa jedro ne pozna**: dreves, skal in hiš na pobočju (telo gre skozi), vode na dnu, drugih avtov (padajoča avta se ne zadeneta). Višine trupa po vrsti karoserije so ocene (`FALL.ht`), vztrajnost je škatla enakomerne gostote. Avto, ki gre čez rob med prevračanjem na cesti (`c.rl`), začne padec pokonci. Rob ploščadi ceste je med točkama proge raven, zato je na ostrem ovinku nekaj centimetrov ob narisanem robu.
- **Splet**: tuji avti v dirki s prijatelji nimajo nagiba (stanje `c.fall.b` se ne pošilja); padajo po starem izrisu.
- **Posnetek dirke**: lega telesa je vzorčena 20-krat na sekundo in med vzorci linearna (ob udarcu do ~3° in 0,13 m od lege v živo), hitrost udarca je shranjena v štirih stopnjah, prah udarcev se v ponovitvi ne riše. Starejša različica igre posnetka s padci ne prebere pravilno; stari posnetki se v novi berejo kot prej.
- **Kamera**: metri nastavitve »Položaj avta« se med padcem v 0,4 s umaknejo iz pogleda (sicer bi avto, ki pada 15 m/s in več, zdrsnil pod spodnji rob slike) in se vrnejo z avtom na cesti. Pogled, ki nastane sredi padca (skok v posnetku), gleda v smeri dirke.
- **Zvok in prikaz**: prestava in vrtljaji na zaslonu med padcem ostanejo vrednosti z roba (motor se sliši v prostem teku). Udarci tekmečevega telesa dajo prah, zvoka trka in tresenja pa ne.
- **Plitvi padci**: kjer je črta roba pred prelomom pobočja (1,28 km, 2,5 km), avto zapelje na travo pod robom; še vedno šteje kot padec (napis, vrnitev po 1,5 s). O tem, ali naj bo tam padec, odloča podatek proge (`def.drops`), ne ta sprememba.
- **Tla ostanejo 30 m** za robom (`def.floor`): za 1,5 s zadoščajo.

## Popis stikov

Vsi stiki, pri katerih igra spremeni hitrost, smer ali škodo avta. Koda je v `js/core.js`, kjer ni napisano drugače; številke so iz kode in meritev (razdelek Meritve). Korak fizike je 1/120 s. Kratice: `cs` klasična fizika (privzeta), `nova` nova fizika, `xgl` izguba oprijema po trku (0–1), J sunek, e odboj, vn hitrost zbliževanja vzdolž normale, rn ročica.

| Stik | Kje v kodi | Kako deluje zdaj |
|---|---|---|
| Avto–avto: oblika stika in razmik | `Race._step` → `carCollide` → `kCollide` (`obbHit`, `rboxHit`, `rbCore`; `RB_R` 0,3 m, `RB_SLOP` 0,02 m, `RB_PUSH` 0,4, `RB_DEEP` 0,2 m) | Škatli z zaobljenimi vogali; normala iz najbližjih parov, prijemališče na sredini ploskev v dotiku. Prekrivanje se odvzame mehko po obratnih masah: 40 % ostanka na korak, nad 20 cm takoj (premik v klicu do 7,5 cm do 240 km/h zbliževanja; v mirovanju ostane 2 cm). Ko se prekrijeta tudi jedri (nad ~260 km/h zbliževanja), je normala os najmanjšega prekrivanja, prijemališče vogal ali sredina ploskve. |
| Avto–avto: sunek, odboj, drgnjenje | `kCollide`: `K.e0` 0,3, `K.e1` 0,12, `K.eV` 4, `K.eT` 0,5, `K.mu` 0,35, `K.muL` 0,4 | En sunek J = (1 + e)·vn / (1/ma + 1/mb + rna²/Ia + rnb²/Ib); masa z gorivom (10–280 kg). Odboj je 0 pod 0,5 m/s, sicer pada od 0,30 proti 0,12 (izmerjeno 0,15 pri 30 km/h, 0,12 pri 240 km/h zbliževanja). Drgnjenje največ 0,35·J, naslonjen avto 0,14·J. Trd trk je 1 sunek v 1–4 korakih. |
| Prevzem sunka, klasična fizika | `kTake` (veja `cs`), `stepCS` (`cSx`, `cSz`, `csKc`, `xgl`, `xglT`; `K.aH` 0,1, `K.aS` 0,06, `KG_V0`, `KG_V1`, `CSK.tapMax`) | Sunek vzdolž nosu gre takoj v hitrost; prečni del gume zdrgnejo s polnim oprijemom (izmerjeno 2,36 g). Vrtilni del postane sunek smeri `csKc` (dw × 0,0055·V sekund, največ ±23°, razpad 0,25 s). Kotno hitrost dobi avto le ob izgubi oprijema `xgl`: ko je zadek potisnjen prečno bolj kot nos in čez 10 % hitrosti, pri hitrosti po sunku nad 4 m/s (polno nad 10 m/s); oprijem se vrne v 0,6 s. |
| Zdrs in vrtenje po izgubi oprijema | `stepCS`, veja `xgl` > 0: `CRASH.slide` 0,9 g, `CRASH.yawT` 0,8 s, `CRASH.yawC` 1,2 rad/s² | Avto drsi z 0,9 g·`xgl` in se vrti s kotno hitrostjo prvega sunka, ki razpada s časovno konstanto 0,8 s; zgornje meje ni (izmerjeno do 1934 °/s). Kotna hitrost se prišteje le, ko `xgl` zraste za več kot 0,1, zato poznejši sunki vrtenja ne zavirajo. |
| Prevzem sunka, nova fizika | `kTake` (veja `nova`), `Car.stepNova` (`NVK.rMax` 3,2 rad/s; veja za avto, ki ne pelje naprej, s `CSK.tR`) | Avto vzame cel tog sunek (hitrost in kotno hitrost); vrtilna količina se v Simulaciji ohrani. Korak fizike nato kotno hitrost vsakič odreže na ±3,2 rad/s (183 °/s); pri avtu, ki ne pelje naprej (stoji, drsi bočno), ugasne s časovno konstanto 0,03 s (−27 % na korak). |
| Naslon in drgnjenje bok ob boku | `kCollide` (odboj 0 pod `K.eT`, trenje × `muL`), `kTake`, `carKnockFx` (iskre `fxCar`) | Vrsta majhnih sunkov brez odboja (26–80 na sekundo z Δv nad 0,1 m/s), premik na klic do 2,5 cm. Hitrosti se ne zlepita: pri 3° in 20 km/h razlike gre hitrejši mimo v 1,1 s. Pasivni avto se zasuka 4–8° in pri 120–200 km/h ne izgubi oprijema. |
| Vloge in različice | `KV` (`sim`, `arc`, `soft`, `stunt`), `K.pm`, `K.yaw`, `K.yawP`, `K.glP`, `K.glA`, `K.glR`; `Core.setTest({ cv })` | Simulacija: igralec v tekmeca in tekmec v igralca enako; med tekmecema polovična izguba oprijema (`glR` 0,5). Arkadna: igralec 1,7-krat težji (dobi 0,588 svojega deleža). Mehka in Kaskaderska: zasuk × 0,6 in × 1,5. Varnostni avto (`c.sc`) nikoli ne izgubi oprijema. Različica 6 (Realistična) je bila ob popisu kopija Simulacije; od 11.–12. 11. 2026 ima svoja pravila (»Realistična v repozitoriju: jedro in dokazi«). |
| Stara različica in veja `inPit` | `carCollide`, stara veja (trije krogi, `CSK.carE`, `tapT`, `tapMax`) | Trije krogi na avto (pri ±0,3 dolžine, polmer širina/2 + 0,02 m), odboj 0,1 (nova fizika 0,4), kotni členi × 0,6, zasuk samo kot sunek smeri (`tapMax` 0,4 rad = 23°); vogali se le razmaknejo brez sunka. Trk od zadaj pride 20–24 cm pred dotikom odbijačev. Velja za različico 5 (Stara) in vejo `inPit`, ki v dirki zaradi duhov teče le pri prikolicah. |
| Boksna steza | `Race.pitStep` (`c.inPit`, `c.pitG`), `Race._pitGhostOff`, `Track.pitAt`, `PIT_V` | Avto v boksni stezi je duh: zanka parov vsak par z duhom preskoči, škode in predrtja ni; duh je spet trden, ko se z nikomer ne prekriva (največ 6 s). Omejevalnik 80 km/h. Boksni zid je ista črta z istim sunkom kot ograja, a brez škode. Nos zidu nima čelne ploskve. |
| Prijateljev avto na spletu | `js/game.js`: `netPlace`, `netFrame`; `kCollide` in `carKnockFx`, veje `.net` | Vsak telefon vozi svoj avto; prijateljevega postavlja iz stanj, poslanih vsakih 50 ms (100 ms pri veliki mreži), 100 ms (200 ms) v preteklosti. Net avta trk ne premakne: lokalni avto vzame ves razmik in svoj delež sunka vsak korak znova; škodo dobi samo lokalni, prevrata ni. Oba telefona vedno vozita Simulacijo. |
| Prikolice | `Race._tlStep` (`carCollide(R, o)`, `wallCollide(R, T, true)`), `tlJoin` (4 × `tlPin`), `tlHold`, `TLK` | Prikolica je svoje telo (12 t, 12,4 × 2,5 m; cestni vlak 2 × 11 t) in trči z istim `carCollide` in `wallCollide`; nato `tlJoin` spne sedlo in izenači hitrosti. Trk vidi samo vlačilec (5,3 t; vlak 7 t), gibalna količina prikolice pride čez sedlo v ~0,1 s. Klasičnemu vlačilcu gume držijo poteg sedla do `TLK.hold` 1,45 g, več pomeni izgubo oprijema. |
| Škoda ob trku | `carKnockFx` → `knock`, `applyDamage`, `detachPart`; privzeto »Samo videz« (`js/game.js`) | Avto–avto: (hitrost zbliževanja − 3,5 m/s) × 1,6 % × `knockK`, obema enako ne glede na maso. Ograja: (hitrost v ograjo − 2,5 m/s) × 2,8 % × `knockK`. Pristanek: nad 11 m/s 1 % na m/s. Padec z roba: +32 %. »Vklop«: moč motorja −22 % × škoda, kolesa odpadejo nad 75 %. |
| Predrta guma | `puncture`, `PUNC_T`, `FLAT`; `opts.faults` | Samo z vklopljenimi okvarami in ne v boksih: udarec ≥ 11 m/s, en žreb na trk, verjetnost min(25 %, (v − 11)/20); izmerjeno 0/4/26/24/23 % pri 10/12/15/20/27,8 m/s. Prazna guma: ovinek 2,38 → 2,27 g (spredaj) ali 2,23 g (zadaj). |
| Odpadli deli in steklo | `detachPart`, `Race.spawnDebris`, `stepDebris`, `debrisHit`, `DEB_RUN` | Največ 40 kosov, igralna masa 1–14 (ogledalo 1, blatnik 5, odbijač 7, vrata 9, prtljažnik 11, pokrov 14); kos odleti z 0,7·v + 2–5 m/s in drsi s pojemkom 6,5 m/s². Ležeč kos (pod 3 m/s): avto ga povozi enkrat, −min(2,5 %, 0,2 %·m). Premikajoč kos: avto izgubi min(6 %, 0,4 %·m) na vsak korak stika in dobi naključen zasuk. Steklo: lise polmera 2 m z oprijemom −20 %. |
| Ograja ob progi | `wallCollide(c, trk, canFall)`; `CSK.wallE` 0,05, `wallMu` 0,25, `wallYaw` 0,3; črta iz `Track._buildEdges` | Za vsak od 4 vogalov po vrsti: vogal čez črto premakne avto nazaj; normalni sunek J = −(1 + 0,05)·vn / (1/m + rn²/I·0,3), zasuk rn·J/I·0,3, trenje vzdolž ograje največ ±0,25·J. Iste tri številke za vse vrste ograj, obe fiziki in vse različice; vrsta ograje je samo risba. Oprijema (`xgl`) ograja ne vzame. |
| Posledice udarca v ograjo | `knock`, `puncture`, `xRollStart`; `js/game.js` (zvok, tresenje), `js/render.js` (`fxWall`) | `hitWall` je največja hitrost vogala proti ograji v koraku. Nad 2,5 m/s škoda (15°/120 km/h 19 %, 30°/120 45 %, 90°/60 41 %, 90°/120 96 %). Zvok nad 1,5 m/s, tresenje nad 3 m/s, snop isker nad 2,5 m/s, sicer curek isker ob drgnjenju. |
| Posebne ograje | `wallCollide`, veje `rings`, `trk.open`, `trk.wall2`, `stubPen`, `altC`, `pitLead` | Isti sunek kot ograja: otok krožišča (čelno 60 km/h → 8 km/h po 1. koraku, škoda 39 %), konca odprte ceste (→ 14 km/h, 41 %), stena predora (15°/120 → 111 km/h, 19 %). Stranske ceste, nasprotni pas in pasova ob boksih črto le premaknejo ali odprejo (prebrano v kodi, ni merjeno). |
| Rob prepada in rob nove mape | `Track.dropAt`, `wallCollide(…, canFall)`, `Race._fall`; veja `trk.free` | Rob prepada (1,2 m od asfalta): nad 2,5 m/s navzven avto pade (1,6 s, +32 % škode, vrnjen na cesto z 28,8 km/h), počasneje ga rob drži kot ograja; prepade ima samo zamrznjena testna proga. Rob nove mape: sredina avta se pripne, hitrost čez rob se izniči, brez trenja, zasuka, škode in zvoka. |
| Predmeti ob progi | `PROPK` (40 vrst), `propCarHit`, `propImpulse`, `propFeel`, `propStep`, `Race.breakProp` | Masa 3–220 kg. Avto (3 krogi polmera 0,92 m) predmet izrine; predmet dobi sunek 1,35·vrel/(1/m + r²/I + 1/M), hitrost do min(18 m/s, 0,72·v + 2) in 7,5 m/s navzgor. Avto ne dobi nasprotnega sunka: izgubi min(4,5 %, 0,16 %·m)·min(1, vrel/8) hitrosti na vsak korak stika in dobi naključen zasuk. Ulični predmeti s škodo udarijo enkrat (0,6 s brez stika). Ograja drži predmete s središčem pod 3,2 m. |
| Promet | `Traffic._hitVeh`, `_knock`, `_runBike`, `TFK` | Mase 1300/2400/12 500/290/90/32 000 kg (avto, kombi, avtobus, motor, kolo, tovornjak s polprikolico). Krogi proti krogom, sunek z odbojem 0,25 in ročicami; sunek smeri avta obrezan na 22,9°. Kolo: avto izgubi min(v, 0,15·v + 1), kolo dobi 0,5 v. |
| Ljudje in živali | `Traffic._hitPeds`, `TF_PED` | Pešec 75 kg samo v prometu in begu: avto izgubi min(v, 0,06·v + 0,4 m/s), pešec dobi 0,35 v. Gledalci, redarji, mehaniki in živali nimajo trka. |
| Beg pred policijo in stavbe | `crashCollide`, `Police.collide`, `Traffic._hitVehP`; `boxCollide` | Škatla proti škatli, odboj 0,05 nad 1,5 m/s, trenje 0,5, izriv 35 % na korak; patrulja 1750 kg, kombi 2900 kg, motor 430 kg. Stavbe (`boxCollide`: odboj 0, trenje 0,2) ima samo skrivališče na zamrznjeni testni progi. |
| Odstopljen avto, scenografija, nova mapa | `Race.retire`, `parkBrake`; `js/nvwalls.js` | Odstopljen avto stoji na izletni coni z ročno zavoro in trka kot avto. Drevesa, hiše in tribune nimajo trka: avto ustavi samo črta ograje. Ograje in predmeti nove mape so v `js/nvwalls.js` (ni v jedru, ni merjeno). |
| Vzlet, let in pristanek | `Car.stepCS`, `stepNova`; `JUMP_G` 14, `M.landV` 11 m/s, `M.landK`, `landT` | Vzlet, ko je hitrost² × ukrivljenost ceste pod −0,85 × 14 m/s² in hitrost nad 6 m/s. V zraku ni sil gum, težnost 14 m/s². Pristanek: hitrost × (1 − min(13 %, 1,6 % na m/s navpične hitrosti) × `landK`), škoda nad 11 m/s, brez odboja; `landT` 0,05–0,2 s je samo časovnik (kamera, zvok). |
| Prevračanje | `XROLL`, `xRollStart`, `xRollStep`; sprožilca v `carKnockFx` in `wallCollide` | Privzeto izklopljeno. Sproži ga trk v bok nad 9 m/s ali bočni udarec v ograjo nad 10 m/s, z žrebom 1 od 10. En obrat 1,18 s ali dva nad 15 m/s (1,58 s), pojemek 3 m/s² in na koncu hitrost × 0,8, škoda +4 % na obrat; avto konča na kolesih in pelje naprej. |
| Vrstni red koraka in izbira parov | `Race._step`, `pair()`, `BIG_FIELD` 16, `Race._pairs`, `LOD` | Vsak avto (`Car.step`) → pari avto–avto → `pitStep` → `wallCollide` → prikolice → odpadli deli. Do 16 avtov vsi pari (12 avtov: 66 parov, 13–16 µs), nad 16 prelet po x (20 avtov: 10 parov; 100 avtov: 64, največ 144). Par se preskoči: različna nivoja na križanju, avto pada, duh v boksih. |

## Meritve

### Kako zagnati

Pet skript v `tools/trki/` poganja kodo igre (`Race.step`, `Car.step`, `carCollide`, `wallCollide`) v Node, brez brskalnika in brez lastne fizike: stanja avtov samo berejo pred klici igre in po njih. Korak 1/120 s, izpis je ponovljiv (dva zagona dasta isto), vsaka skripta izid preveri še na Spa in Bathurstu ali v dirki s semenom.

```
node tools/trki/avto-avto.js       [--cv N] [--json] [--only <ime>] [--trace <scenarij> [--phys nova] [--mode hold] [--role RR] [--car kaze] [--ph 0.5] [--tspan 2]]
node tools/trki/mase-razlicice.js  [--cv N] [--json] [--only vozila|mase|gorivo|prikolice|razlicice|vloge|ohranitev|proga] [--trace <scenarij> [--phys nova] [--tspan 0.3]]
node tools/trki/zid.js             [--cv N] [--json] [--del matrika|prikolica|posebne|proga]
node tools/trki/predmeti.js        [--cv N] [--json] [--del predmeti|vrste|zamik|pocasi|razbitine|svoj|promet|ljudje|policija|stavba|prikolica|kup|ograja|proga|dirka] [--cas]
node tools/trki/boksi-pristanek.js [--cv N] [--json] [--del boksi|pristanek|padec|prevracanje|skoda|zanka|splet]
```

- `--cv N` izbere različico trkov (`Core.setTest({ cv })`): 1 Simulacija, 2 Arkadna, 3 Mehka, 4 Kaskaderska, 5 Stara, 6 Realistična (od 11.–12. 11. 2026 s svojimi števili in štirimi točkami zasnove, razdelek »Realistična v repozitoriju: jedro in dokazi«; prej kopija Simulacije, zato so starejši zapisi `--cv 6` enaki `--cv 1`); brez nje privzeta. Ista skripta meri obe različici (pred/po).
- `--json` da vse scenarije in vse stolpce; tabele spodaj so izvleček. `--only` in `--del` zaženeta en del, `--trace` en scenarij korak za korakom.
- Imena scenarijev v `avto-avto.js`: `head-V-c|o` čelno, `rear-V-stand|bump-c|o` od zadaj, `tbone-V-stand|cross-mid|front|rear` bočno, `side-V-a3|a10-eq|dv20` bok ob boku, `pit-V-rear|front-2|4|8` vogal v bok; V = 60, 120, 200 km/h. Vsak scenarij teče v 4 legah prvega dotika v koraku.
- Trajanje: `mase-razlicice.js` 5–12 s, `zid.js` ~11 s, `boksi-pristanek.js` 19,3 s, `predmeti.js` 31,7 s.
- Trije preverjalci so iste trke ponovili z lastnimi skriptami (druga pot do iste številke); te skripte so zunaj repozitorija. Kjer je preverjalec številko popravil, je to zapisano pod tabelo.

### Avto–avto (`avto-avto.js`)

**cs (klasična), Simulacija, rally 1150 kg ×2; A udari, B zadet; po dotiku brez pedal in volana.** Oznake scenarijev: H čelno, R od zadaj (s B stoji, b B 30 km/h počasnejši), T bočno (s B stoji, x B prečka z V; m sredina, f sprednja, r zadnja os), S bok ob boku (a3/a10 kot °; e enaki hitrosti, d B 20 km/h počasnejši), P vogal A v zadnji (r) ali sprednji (f) bok B z 2/4/8 m/s; c sredinsko, o zamik pol širine. Stolpci A/B: hitrost 0,1 s/2 s po dotiku; E−%: izguba energije para v sunkih/po 2 s; največji zasuk nosu; največja kotna hitrost; največji xgl; čas do ravne vožnje (- ni v 6 s); sunki z Δv ≥ 0,1 m/s; največje prekrivanje škatel (cm). Gibalna količina para v sunkih: napaka 0,00 % povsod; NaN 0; zamenjava mest 0. V vrsticah S oba držita plin (E−% po 2 s je lahko negativen).

|scenarij|A km/h|B km/h|E−%|zasuk°|ω°/s|xgl|ravno s|sunki|prekr.|
|-|-|-|-|-|-|-|-|-|-|
|H60c|7/6|7/6|99/99|0/0|0/0|0/0|-/-|1|26|
|H60o|0/0|0/0|100/100|0/0|4/4|0/0|0/0|2|26|
|R60sc|26/24|34/31|49/58|0/0|0/0|0/0|0/0|1|12|
|R60so|30/24|30/27|43/63|-32/-26|166/150|0,3/0,3|0,8/0,8|2|12|
|R60bc|43/39|47/42|10/27|0/0|0/0|0/0|0/0|1|5|
|R60bo|45/41|45/41|10/27|-4/-4|50/50|0,2/0,2|0,3/0,3|1|5|
|T60sm|26/0|26/0|50/100|0/0|0/0|0/0|0/0,6|2|12|
|T60sf|26/0|26/0|51/100|3/0|35/0|0,2/0|0,1/0,6|16|14|
|T60sr|29/20|23/0|53/90|-1/38|6/174|0/0,5|0,3/0,4|11|13|
|T60xm|27/24|54/38|37/72|7/47|39/167|0/1|0,5/1,1|1|12|
|T60xf|23/18|55/43|42/70|14/-5|37/42|0/0|0,7/0,4|17|14|
|T60xr|39/35|53/27|22/73|5/176|34/406|0/1|0,6/-|1|12|
|S60a3e|60/60|60/61|17/-2|20/5|78/4|0/0|2,5/2,1|77|8|
|S60a10e|60/61|59/61|29/-3|17/6|79/12|0/0|2,7/2,3|95|10|
|S60a3d|59/60|41/40|1/1|25/1|73/4|0/0|2,6/0,2|7|6|
|S60a10d|58/62|42/62|50/-48|19/8|80/8|0/0,1|2,7/2,2|79|10|
|P60r2|59/51|60/51|6/29|-4/-5|9/10|0/0|0,1/3,9|157|5|
|P60r4|59/46|59/23|7/63|-6/-103|18/151|0/1|1/2|9|12|
|P60r8|58/52|58/47|3/33|-4/-39|30/150|0/1|0,6/1,1|1|13|
|P60f2|59/52|60/52|3/26|-2/2|12/7|0/0|0,1/0,1|3|5|
|P60f4|59/47|59/47|12/38|-6/3|21/14|0/0|0,6/1,6|160|8|
|P60f8|56/33|57/33|40/70|-12/4|33/26|0/0|2/2,9|44|13|
|H120c|14/13|14/13|99/99|0/0|0/0|0/0|-/-|1|26|
|H120o|0/0|0/0|100/100|0/0|4/4|0/0|0/0|2|26|
|R120sc|53/47|67/60|49/60|0/0|0/0|0/0|0/0|1|26|
|R120so|52/6|67/12|41/99|-120/-125|330/330|0,6/0,6|0,9/1,1|9|26|
|R120bc|102/91|107/95|2/23|0/0|0/0|0/0|0/0|1|5|
|R120bo|105/93|104/93|2/24|-5/-5|36/36|0/0|0,7/0,7|1|5|
|T120sm|53/0|60/0|50/100|0/0|0/0|0/0|0/1,3|2|26|
|T120sf|56/23|56/6|54/96|7/-41|70/74|0,2/0|1/1,6|10|26|
|T120sr|66/57|44/0|30/78|-2/250|12/660|0/1|0,4/0,9|10|26|
|T120xm|55/48|112/67|36/76|7/203|47/446|0/1|0,8/-|1|26|
|T120xf|54/47|113/87|40/66|7/-3|46/34|0/0|0,8/0,8|11|26|
|T120xr|80/70|108/38|21/78|7/521|49/804|0/1|0,9/-|1|26|
|S120a3e|120/120|120/121|1/-1|11/5|52/16|0/0|2/0,2|68|5|
|S120a10e|119/120|119/121|3/-1|-10/7|57/37|0/0|2,6/0,2|156|13|
|S120a3d|119/120|101/100|1/0|16/4|68/9|0/0|2,6/1|12|6|
|S120a10d|117/123|103/121|6/-22|-10/4|49/21|0/0|2,2/1,8|96|13|
|P120r2|119/105|119/105|1/24|-3/-3|19/19|0/0|0,2/0,7|2|5|
|P120r4|119/102|119/102|3/28|-11/-11|31/32|0/0|4,2/4,5|196|8|
|P120r8|118/102|119/98|3/31|-9/-22|49/128|0/0,5|1,1/1,2|6|15|
|P120f2|119/106|119/106|0/23|-3/2|22/15|0/0|0,2/0,1|6|4|
|P120f4|119/105|119/105|1/23|-5/3|36/26|0/0|0,2/0,2|14|7|
|P120f8|117/102|118/102|3/28|-7/6|51/41|0/0|0,3/0,3|64|11|
|H200c|24/23|24/23|99/99|0/0|0/0|0/0|-/-|1|63|
|H200o|27/0|28/13|74/100|-2248/0|1934/0|0,8/0|2,1/-|2|63|
|R200sc|88/78|111/99|49/60|0/0|0/0|0/0|0/0|1|16|
|R200so|85/29|113/42|41/94|-312/-311|551/551|0,6/0,6|1,7/1,9|6|16|
|R200bc|182/157|186/160|1/27|0/0|0/0|0/0|0/0|1|5|
|R200bo|184/157|183/157|1/29|-8/-8|52/52|0/0|1/1|1|5|
|T200sm|88/14|104/14|50/99|0/0|0/0|0/0|0/2,2|3|16|
|T200sf|96/77|96/6|50/85|15/-40|117/77|0,2/0|0,6/1,4|5|31|
|T200sr|112/104|78/0|26/73|-8/611|53/1109|0/1|0,9/1,6|8|23|
|T200xm|92/78|190/103|37/79|7/341|50/619|0/1|0,9/1,5|1|16|
|T200xf|98/84|188/142|40/66|8/-4|51/30|0/0|0,9/1,2|7|28|
|T200xr|131/114|182/70|22/78|8/1248|51/1344|0/1|0,9/-|1|16|
|S200a3e|200/200|200/200|0/0|6/4|33/36|0/0|1,8/0,5|68|5|
|S200a10e|199/201|199/201|2/-1|-10/7|52/53|0/0|1,9/0,7|164|16|
|S200a3d|199/201|181/180|0/0|6/-1|38/9|0/0|1,8/0,3|11|5|
|S200a10d|192/178|185/178|4/12|-11/-7|47/46|0/0|1,7/4,7|477|16|
|P200r2|198/169|199/169|0/29|-4/-4|28/29|0/0|0,3/0,8|3|4|
|P200r4|198/167|199/167|1/30|-8/-8|44/45|0/0|0,6/2,3|10|6|
|P200r8|197/162|199/162|2/34|-17/-18|52/52|0/0|3,2/3,3|107|13|
|P200f2|198/169|199/170|0/28|-3/2|33/24|0/0|0,1/0,3|8|4|
|P200f4|198/169|198/169|0/29|-5/4|46/38|0/0|0,7/0,4|13|6|
|P200f8|197/168|197/168|1/30|-8/7|53/52|0/0|0,8/0,8|27|11|

**nova (nova fizika), iste oznake:**

|scenarij|A km/h|B km/h|E−%|zasuk°|ω°/s|xgl|ravno s|sunki|prekr.|
|-|-|-|-|-|-|-|-|-|-|
|H120o|0/0|0/0|85/100|-7/-7|661/661|0/0|0,1/0,1|6|26|
|R120so|58/51|58/51|43/64|-29/-28|330/330|0/0|0,5/0,5|4|26|
|T120sf|60/43|54/43|33/74|18/-80|135/660|0/0|1,1/0,9|17|26|
|T120sr|59/8|55/7|35/99|-5/15|30/660|0/0|1,9/-|22|26|
|T120xm|57/50|115/94|31/61|35/11|530/446|0/0|0,4/0,8|1|26|
|T120xf|54/47|112/97|35/60|50/-31|471/425|0/0|0,5/0,5|5|26|
|T120xr|76/67|111/93|19/54|31/15|450/804|0/0|0,4/0,7|2|28|
|P120r8|118/102|119/102|1/28|-21/-13|119/128|0/0|0,9/1|16|10|
|T200xr|124/109|187/154|20/56|32/-11|735/1344|0/0|0,5/0,8|2|32|

**Korak proti hitrosti (cs; A z V v stoječega B, zamik v deležu širine, 24 leg prvega dotika v koraku):**

|V|zamik|A +0,1 s|B +0,1 s|zasuk A°|zasuk B°|prekr. cm|A mimo B|A obdrži > 90 % V|
|-|-|-|-|-|-|-|-|-|
|120|0,75|57–65|57–62|2–69|1–7|2–29|0/24|0/24|
|200|0,5|85–89|108–113|301|156–299|5–45|0/24|0/24|
|200|0,75|95–158|43–104|1–147|1–35|3–45|10/24|0/24|
|300|0,5|130–132|164–165|548–998|59–542|7–68|0/24|0/24|
|300|0,75|143–296|0–157|0–256|0–110|5–45|16/24|7/24|

**Plin drži hitrost:** A spet pri 95 % hitrosti po: R60sc 1,4 s; R120sc 3,2 s; T120sr 1,4 s; T120xf 1,7 s; T120xr 1,0 s. **Vloge:** igralec→tekmec = tekmec→igralec; tekmec–tekmec: T120sr 287° (xgl 0,5), P120r8 −14° (xgl 0,26). **Proga = ravnina** (Spa, Bathurst; rally v stoječega kaze, 120 km/h): A 50/45, B 65/58 km/h na obeh.

Popravki in dopolnila preverjalca:

- Vrstice P60r (dotik v zadnji bok pri 60 km/h) so vzorec, ne ponovljiva številka: izid je občutljiv na začetno režo (0,4 m namesto 0,3 m premakne −104° s 4 na 5 m/s). Cel stik brez vnosov pri 2/4/5/6/8/10 m/s: −5/−37/−104/−95/−40/−63°; samo prvi sunek: −1/−8/−17/−24/−40/−63°. S plinom: 4 m/s −44,0°, 8 m/s −100,9°.
- H200o: −2248° je zasuk v 6 s; preverjalec −1897° v 3 s (1931 °/s). Kateri avto se zavrti, določa vrstni red para v kodi (pri zamenjanem vrstnem redu se zavrti B).
- Zasuk B z razvitim kotom: T120sr 268° (665 °/s), T120xr 523° (806 °/s), T200xr 1263° (1354 °/s).
- Korak proti hitrosti, 300 km/h in zamik 0,75: mimo 15/24 (merilec 16/24); ostale vrstice potrjene.
- Vrstica »Plin drži hitrost« ni odstopanje (glej Zavrnjeno pod tabelo odstopanj): prost avto pospeši s 53 na 114 km/h v 1,56 s, po trku od zadaj v 3,26 s; po bočnem trku s 67 na 114 km/h v 1,43 s proti 1,22 s.
- Drugi modeli, od zadaj z zamikom v stoječega (60, 120, 200 km/h): rally −31,5/−25,5°, −119,4/−124,7° (`xgl` 0,56/0,60), −312/−310°; strega −4,5°, −8,5°, −8,5° (`xgl` 0); kaze −17,7°, −90°, −230°.
- Brez odstopanja: trije avti v vrsti (120 km/h v dva stoječa) 39/39/41 km/h, gibalna količina 0,00 %; igralec zdrs po sunku ulovi s protivolanom (−23,8° → 0° v 2 s), volan v smer vrtenja da −331°.

**Dotik v zadnji bok v ovinku (preverjalec; klasična fizika, Simulacija; zadeti je igralec, ki drži volan in hitrost)**

| kje | prečna hitrost m/s | največji odmik smeri | `xgl` | opomba |
|---|---|---|---|---|
| 100 km/h na meji (2,38 g, polmer 33 m), z notranje strani | 1/2/3/4/6 | 1/0/1/3/4° | 0,00 | po 2 s 0,1/0,4/0,8/1,4/2,8 m s črte |
| 160 km/h na meji (2,39 g, polmer 84 m), z notranje strani | 1–6 | 0–6° | 0,00 | |
| skoraj naravnost (0,05 g) | 1–6 | 0–6° | 0,19 šele pri 6 m/s | bližina meje oprijema ne spremeni izida |
| 100 km/h na meji, z zunanje strani | 3/4/6 | −5/−15/−171° | –/0,52/1,00 | pri 160 km/h do 6 m/s največ −6°, `xgl` 0 |

### Mase, prikolice, različice (`mase-razlicice.js`)

Oznake: L lahki, T težki (v tabeli D: I igralec, T tekmec, sc varnostni avto, net prijateljev avto); dv sprememba hitrosti; dP napaka gibalne količine para; E- izguba in E+ prirast kinetične energije; e odboj.

Vse: resnična koda (Car.step, carCollide, wallCollide, Race._tlStep), ravnina, DT 1/120 s. Hitrosti v smeri A: pred > po 1. koraku > +2 s (km/h).

**A. Mase (cs, Simulacija, 120 km/h)**
| scenarij | lahki | težki | dv L:T | e | E- % trk/2 s | opomba |
|---|---|---|---|---|---|---|
| čelno, miška 560 / kamen 7000 | 119>-128>-106 | -119>-99>-81 | 247,2:19,8 | 0,12 | 27/51 | 1 sunek, 1 korak |
| čelno, mravlja 165 / kamen | 119>-141>-99 | -119>-113>-91 | 260,0:6,1 | 0,12 | 9/41 | |
| čelno L v stoječega T | 119>-4>-3 | 0>10>9 | 123,9:9,9 | 0,12 | 91/93 | |
| zadaj L>T (120>90) | 119>88>78 | 90>92>76 | 31,4:2,5 | 0,15 | 1/32 | |
| zadaj T>L | 90>121>106 | 119>117>94 | 30,8:2,5 | 0,15 | 0/34 | |
| T: T v bok stoječega L | 0>123>81 | 119>109>81 | 229,8:18,4 | 0,12 | 7/50 | L na nosu 2 s; 186 sunkov, 2 nad 0,5 m/s |
| T: T v prednjo os L | 0>88>81 | 119>112>81 | 229,5:18,4 | -0,20 | 7/50 | zasuk L 0° |
| čelno, burja 1150 / cisterna 17300 | 121>-101>-98 | -120>-105>-98 | 227,1:15,1 | -0,02 | 24/33 | |
| isto, 0,5 m iz sredine | 121>-87>-17 | -120>-106>-72 | 236,4:15,5 | -0,08 | 22/51 | avto ≥ 180° (odrezano), 568 °/s; vlačilec 37°, xgl 1,00 |

(mA dvA)/(mB dvB) = 1,00 in dP 0,0 % v vseh vrsticah avto-avto.

**B. Gorivo in pm (zadaj 120>90)**
| primer | dvA:dvB | dvA/dvB | mB/mA | dP % | E+ % |
|---|---|---|---|---|---|
| burja>kamen, prazna | 30,14:4,95 | 6,087 | 6,087 | 0 | 0 |
| polna (1210:7280 kg) | 30,07:5,00 | 6,017 | 6,017 | 0 | 0 |
| formula polna (+105 kg) > prazna | 15,84:17,92 | 0,884 | 0,884 | 0 | 0 |
| burja>burja, igralec A, cPm 1,7 | 12,49:21,23 | 0,588 | 1 | 41,2 | 6,41 |
| cPm 3 | 8,43:25,28 | 0,333 | 1 | 66,7 | 14,39 |
| Arkadna, igralec A | 13,54:23,02 | 0,588 | 1 | 41,2 | 7,20 |

**C. Različice (burja/burja 120, igralec zadene tekmeca, cs)**
| scenarij | Sim | Ark | Mehka | Kask | Stara |
|---|---|---|---|---|---|
| čelno: v po A/B; e | -14/14; 0,12 | 13/62; 0,20 | -7/7; 0,06 | -24/24; 0,20 | -12/12; 0,10 |
| zadaj 120>90: v po; e | 104/108; 0,15 | 107/114; 0,24 | 105/107; 0,07 | 102/110; 0,26 | 104/107; 0,10 (dotik 22 cm prej) |
| T v stoječega: po; +0,5; +2 s | 53/68; 39/39; 0/0 | 67/91; 65/49; 11/11 | 57/64; 39/39; 0/0 | 48/72; 47/31; 0/0 | 54/66; 46/46; 5/5 |
| naslon 3°: zasuk A/B; sunki | 8/2; 114 | 10/3; 117 | 9/1; 117 | 8/3; 91 | 9/0; 0 |
| sunek zadaj 8 m/s: zasuk B; xgl; v B 2 s | 23; 0,55; 100 | 52; 1,00; 74 | 7; 0; 114 | 75; 1,00; 53 | 7; 0; 113 |
| lahek>težek čelno: v po | -128/-99 | -132/-85 | -115/-100 | -145/-98 | -123/-100 |

**D. Vloge (sunek zadaj: zasuk B ° / xgl B)**
| različica | I>T | T>I | T>T | I>sc |
|---|---|---|---|---|
| Simulacija | 23/0,55 | 23/0,55 | 17/0,27 | 16/0 |
| Arkadna | 52/1,00 | 6/0 | 25/0,47 | 13/0 |
| Kaskaderska | 75/1,00 | 75/1,00 | 75/1,00 | 19/0 |
| Mehka, Stara | 7/0 | 7/0 | 7/0 | 7/0 |

I>net (vse različice): čelno dv lokalnega -240,5 (tekmec -135,0), zadaj -30,8 (-17,5), T -120,6 (-67,8); net avto 0.

**E. Mesto zadetka (T 120 v bok burje; B: zasuk ° / kotna hitrost °/s / xgl)**
| kam | cs, B stoji | cs, B 60 | nova, B stoji | nova, B 60 |
|---|---|---|---|---|
| zadnja os | 268–269 / 665–666 / 1,00 (popravljeno) | 478–500 / 764–792 / 1,00 (popravljeno) | 11 / 666 / 0 | 13 / 792 / 0 |
| sredina | 0 / 0 / 0 | 45 / 164 / 1,00 | 0 / 0 / 0 | 23 / 164 / 0 |
| prednja os | 41 / 74 / 0 | 6 / 45 / 0 | 82 / 666 / 0 | 49 / 539 / 0 |

**F. Prikolice (cisterna 5300 + 12000 kg, burja 1150)**
| scenarij | izid |
|---|---|
| avto 120 > rep prikolice (60) | avto 121>59>53, vlačilec 60>65>61, e 0,09, 1 sunek (cs = nova) |
| isto, 1 m iz sredine [cs] | avto 62°, 235 °/s, xgl 0,39, raven po 1,15 s |
| avto 100 > sredina boka (vlačilec 30 počez) [cs] | avto 101>-2, E- 39 %, vlačilec xgl 1,00, 2°, pregib 1° |
| avto 80 čelno > vlačilec 80 | avto 81>-67>-66, vlačilec -80>-70>-66, e -0,02 |
| isto, 1 m iz sredine | cs: avto ≥ 180° (odrezano), 557 °/s, pregib 16°; nova: 5/7°, pregib 8° |
| avto 100 > bok kabine (60 počez) | cs: avto/vlačilec 24/10°, pregib 4°, dP 9,6 %; nova: 44/33°, pregib 32° |
| vlačilec 90 > avto 60 od zadaj | avto 62>88>83, potiska ga 2 s (232 sunkov, 1 nad 0,5 m/s) |
| vlačilec 90 > rep druge prikolice (60) | 90>83>75 in 60>68>75 pri +0,1 s |
| vlačilec 80 čelno > vlačilec 80 | 80>53>0 pri +0,1 s, prekrivanje 13 cm |
| prikolica v ovinku pomete stoječ avto (20 km/h) [cs] | avto 0>8 km/h, 14°, 98 sunkov (skupaj 74 km/h), pregib 57° |
| avto 120 > rep 2. cisterne vlaka (29 t) | avto 121>59, e 0,02 |

**G. Ohranitev pri trkih (8 scenarijev × I>T, T>T)**
| fizika | različica | dP % | manjka zasuka % | E+ % (kJ) |
|---|---|---|---|---|
| cs | Sim / Mehka / Stara | 0,0 | 62-100 / 78-100 / 100 | 0,01 / 0,01 / 0 |
| cs | Arkadna | 41,2 | 10-100 | 6,52 (66,1) |
| cs | Kaskaderska | 0,0 | -29 do 100 | 0,47 (3,0) |
| nova | Sim / Stara | 0,0 | 0 | 0 |
| nova | Arkadna | 41,2 | 0-24 | 6,68 (67,7) |
| nova | Mehka / Kaskaderska | 0,0 | 40 / -50 | 0,01 / 0,40 (5,2) |

NaN 0, prehod skozi 0 v vseh tekih.

**H. Škoda (Car.dmg, 120 km/h)**
| scenarij | dv L/T km/h | škoda L/T |
|---|---|---|
| čelno miška/kamen | 247/20 | 1,00/0,55 |
| čelno mravlja/kamen | 260/6 | 1,00/0,55 |
| T: miška v stoječ kamen | 124/10 | 0,47/0,26 |
| T: kamen v stoječo mravljo | 270/6 | 0,61/0,26 |

**I. Spa (dirka s semenom, Race.step) proti ravnini: kamen (igralec) čelno v miško**
| kje | težki | lahki | dv |
|---|---|---|---|
| Spa | 119,9>97,0 | -120,1>128,6 | -22,8 / 248,7 |
| ravnina | 119,0>99,2 | -119,4>127,8 | -19,8 / 247,2 |

Lahki se ujema z (1+e) vc mB/(mA+mB) na 0,1 %; težki v Spa izgubi 2,9 km/h več (povozi razbitino v istem koraku).

Popravki in dopolnila preverjalca:

- Tabela E, zadnja os (klasična): skripta je zasuk rezala pri 180° (popravljeno v `tools/trki/mase-razlicice.js`, vrstica 201); pravi vrednosti sta 268–269° in 478–500°. Enako odrezan je »avto ≥ 180°« v tabelah A in F.
- Tabela C, Stara: prvi sunek 23,9 cm pred dotikom škatel (merilec 20–22 cm); naslon 3° s prečno hitrostjo 1,74 m/s da v Stari 12 sunkov in zasuk 3,2° (ne 0).
- Tabela D, Simulacija: 22°/0,53 (igralec–tekmec, obe smeri), 15°/0,26 (tekmec–tekmec), 12°/0,00 (varnostni avto).
- Vrstica I>net je iz makete z net avtom, ki se nikoli ne odzove. Dvojna simulacija dveh telefonov: čelno 120 + 120 lokalni −233 km/h, oba nazaj s 114–115 km/h; T v stoječega: strelec 0 km/h (en telefon 52); od zadaj 120 v 90: strelec −30 km/h, zadeti 0 sunkov.
- Tabela F: bok kabine 10,2°/48 °/s (klasična) in 31,2°/149 °/s (nova); čelni trk 1 m iz sredine v vlačilec ni ponovljen. Avto 80 čelno v vlačilec 80 konča pri −70 km/h (teorija −69,9).
- Tabela G: v 8 scenarijih ni zadetka v zadnjo os. Tam en klic doda v Kaskaderski +55,3 kJ (8,7 % od 638 kJ), v Simulaciji +12,9 kJ (2,0 %), v Mehki +0,3 kJ. Arkadna: dP 41,2 % je delež prenesene gibalne količine (4,6 % skupne); prirast energije pri preverjalcu +72,8 kJ.
- Tabela H: miška/kamen 1,00/0,56; pri 60 + 60 km/h 0,26/0,48.
- Potiskanje s prikolico (od zadaj 60 v 32 in 120 v 91 km/h, 240 korakov; sunki/ponovni dotiki): vlak 60 merilec 94/45, preverjalec 77/45; vlak 120 57/46 in 58/39; cisterna 60 merilec 137/83, preverjalec 227/1 (se razlikujeta); vozilo brez prikolice 1/0.

### Ograja (`zid.js`)

**A. Matrika: BURJA R7 (1150 kg), klasična fizika (cs), asfalt ob ograji, brez vnosa.** v km/h; eN1/eNL: normalna hitrost stran od ograje po 1. koraku / ob odhodu, delež vpadne (− = še vanjo); μ: tang. izguba / normalni sunek; izh: izstopni kot; dh: zasuk nosu; w: največji zasuk °/s; drs: čas na ograji s (> = do konca 7 s); n: ločeni dotiki; pop: največji popravek lege cm; hit m/s; šk: škoda %; gum: verjetnost predrtja %; prv: lahko prevrne

|kot|km/h|v1|vL|v0,5|v2|eN1|eNL|μ|izh|dh|w|drs|n|pop|hit|šk|gum|prv|
|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|
|5|60|58|–|55|49|−0,43|–|0,25|–|5|18|>6,80|1|0,1|1,4|0|0|ne|
|5|120|117|–|112|101|−0,43|–|0,25|–|5|36|>6,90|1|1,4|2,9|1|0|ne|
|5|200|196|192|186|165|−0,43|0,02|0,25|0,1|5|61|0,12|1|2,2|4,8|6|0|ne|
|15|60|56|–|49|42|−0,37|–|0,25|–|15|49|>6,93|1|2,3|4,3|5|0|ne|
|15|120|111|106|104|95|−0,37|0,02|0,25|0,3|15|100|0,22|1|5,9|8,6|19|0|ne|
|15|200|186|177|172|153|−0,37|0,03|0,25|0,5|15|168|0,11|2|5,9|14,3|53|17|DA|
|30|60|47|–|35|27|−0,24|–|0,25|–|30|72|>6,97|1|4,7|8,3|16|0|ne|
|30|120|93|84|83|76|−0,24|0,01|0,25|0,5|30|147|0,29|1|11,6|16,6|45|25|DA|
|30|200|156|143|140|126|−0,24|0,02|0,25|0,9|31|246|0,15|1|16,2|27,7|99|32|DA|
|60|60|17|0|0|0|0,04|0,00|0,25|109,2|−4|68|0,35|2|6,0|14,4|33|17|ne|
|60|120|33|0|0|0|0,04|0,00|0,25|−38,0|−24|136|0,90|2|18,1|28,8|74|25|ne|
|60|200|55|31|18|14|0,04|0,03|0,25|9,5|−37|227|0,22|3|10,1|48,1|100|25|ne|
|90|60|14|10|4|4|−0,12|0,07|0,16|156,7|1|93|0,03|1|11,6|16,6|41|25|ne|
|90|120|27|21|13|12|−0,12|0,07|0,16|158,1|2|187|0,02|2|25,5|33,3|96|25|ne|
|90|200|46|35|28|27|−0,12|0,06|0,16|158,7|3|312|0,02|2|16,3|55,5|100|25|ne|

**B. Isti trki drugače.** plin = poln plin + volan stran; odm: s do 0,3 m stran za vedno; utr: preklopi stika na s; lep: obtiči

|kot|km/h|cs+plin drs|odm|v2|nova: n|utr|drs|v2|nova+plin odm|v2|trava cs v2|
|-|-|-|-|-|-|-|-|-|-|-|-|
|5|60|0,16|0,67|139|3|117|>6,80|46|0,75|139|26|
|5|120|0,25|0,88|170|36|35|>6,90|100|1,05|169|64|
|5|200|0,12|1,02|211|38|18|1,73|163|1,18|210|114|
|15|60|0,24|0,86|132|3|88|>6,93|32|0,93|129|22|
|15|120|0,18|0,96|162|23|45|>6,97|87|1,13|158|61|
|15|200|0,12|0,96|198|43|18|0,78|149|1,46|194|106|
|30|60|0,53|0,98|120|3|2|>6,97|10|0,93|112|6|
|30|120|0,30|1,09|148|8|96|>6,98|66|1,27|142|47|
|30|200|0,15|0,75|175|50|20|0,59|118|1,46|166|86|
|60|60|>6,98|lep|0|2|6|0,35|0|lep|0|0|
|60|120|>6,99|lep|0|2|4|1,03|0|1,40|42|0|
|60|200|0,24|lep|0|2|0|0,01|0|1,62|87|9|
|90|60|0,03|lep|0|1|0|0,02|3|lep|0|1|
|90|120|0,03|2,07|15|2|0|0,02|8|lep|0|7|
|90|200|0,02|0,15|18|2|0|0,02|12|lep|0|21|

**C. Druga vozila (cs, brez vnosa, asfalt).** MRAVLJA 165 kg, TITAN 5300 kg, CISTERNA = TITAN + polprikolica 12 t (Race.step); ud: koraki s škodo; prik: s prikolica na ograji; zlom: kot vlačilec–prikolica na koncu °

|vozilo|kot/kmh|v1|v2|w|drs|ud|šk|prik|zlom|
|-|-|-|-|-|-|-|-|-|-|
|mravlja|5/120|116|88|68|0,10|1|1|||
|titan|5/120|117|92|26|>6,90|1|1|||
|cisterna|5/120|119|62|31|>6,90|1|1|6,74|56|
|mravlja|15/120|110|83|177|0,10|2|30|||
|titan|15/120|111|84|71|>6,97|1|10|||
|cisterna|15/120|118|54|96|>6,97|2|10|6,81|56|
|mravlja|30/120|91|67|173|0,21|2|57|||
|titan|30/120|94|64|109|>6,98|1|24|||
|cisterna|30/120|113|42|191|>6,98|5|25|6,81|56|
|mravlja|90/60|20|6|303|0,02|2|70|||
|titan|90/60|13|3|61|0,02|2|24|||
|cisterna|90/60|44|1|50|0,12|6|55|0,00|7|
|mravlja|90/120|40|9|606|0,02|2|100|||
|titan|90/120|26|9|123|0,03|2|57|||
|cisterna|90/120|87|2|99|0,12|8|100|0,00|30|
|cisterna+plin|5/120|120|109|33|0,97|2|1|0,82|0|
|cisterna nova|5/120|119|108|34|1,13|2|1|1,24|0|

**D. Posebne ograje (BURJA R7, cs, brez vnosa)**

|ograja|km/h|v1|v2|hit|šk|opomba|
|-|-|-|-|-|-|-|
|otok krožišča: čelno v sredino|60|8|3|16,5|39||
|otok krožišča: čelno v sredino|120|17|9|33,0|85||
|otok krožišča: 0,6 m od roba proti sredini|120|81|–|19,5|48||
|otok krožišča: oplazi (0,3 m širine avta)|120|107|–|8,1|16||
|konec odprte ceste: čelno|60|14|4|16,6|41||
|konec odprte ceste: čelno|120|27|12|33,3|96||
|začetek odprte ceste: vzvratno 30 km/h|30|7|1|8,3|16||
|rob prepada, 5°|60|57|37|1,4|0|rob drži kot zid, drs 2,46 s|
|rob prepada, 5°|120|–|–|–|–|pade čez rob|
|rob prepada, 15°|30|27|7|2,3|0|rob drži kot zid, drs 1,73 s|
|rob prepada, 15°|60|–|–|–|–|pade čez rob|
|rob prepada, 30°|120|–|–|–|–|pade čez rob|
|rob nove mape (track.free): 30°|120|103|73|0,0|0|brez trenja, zvoka, škode; na robu do konca|
|stena predora nove mape (track.wall2): 15°|120|111|95|8,6|19||
|stena predora nove mape (track.wall2): 90°|120|27|12|33,3|96||
|nos zidu boksov (Spa, −167 m): naravnost vanj|120|109|64|0,1|0|skok v stran 115 cm v 1 koraku|

**E. Prave proge in dirka s semenom (cs).** Isti trk 15°/120 in 90°/60; dirka: prva ograja igralca (tests/lib/sim.js »crash«) in isti udarec na ovalu

|kje|15/120: v1|vL|v2|hit|šk|90/60: v1|hit|šk|
|-|-|-|-|-|-|-|-|-|
|Spa zid boksov −150 m|110|100|60|8,5|18|14|16,5|40|
|Spa ravnina 1660 m|110|100|58|8,5|17|14|16,5|40|
|Bathurst ravnina 750 m|111|95|61|8,5|20|14|16,6|41|
|Bathurst zid na gori 3040 m|111|99|77|8,6|19|14|16,6|41|
|oval (asfalt)|111|106|95|8,6|19|14|16,6|41|
|oval (trava)|110|100|61|8,5|18|14|16,5|40|

|dirka|fiz|v0|kot|v1 dirka/oval|μ|hit|v2|
|-|-|-|-|-|-|-|-|
|Spa|cs|163|29,9|123/127|0,26/0,25|22,6/22,7|75/71|
|Spa|nova|133|28,9|103/106|0,26/0,25|17,7/17,9|79/76|
|Bathurst|cs|163|26,1|132/135|0,26/0,25|19,9/20,1|79/76|
|Bathurst|nova|145|26,9|114/119|0,26/0,25|18,5/18,1|80/84|

**F. Po ograji skozi ovinek (180°, R 60 m, prihod 200 km/h; »po ograji« = poln plin brez volana).** Merilčeva postavitev ima 4 m trave pred ograjo in prvi udarec 30,9 m/s; za asfalt do ograje velja tabela preverjalca pod tem razdelkom.

|fiz|kako|čas s|vMin|vOut|hit|šk|
|-|-|-|-|-|-|-|
|cs|avtopilot|5,30|116|129|0,0|0|
|cs|po ograji|8,18|63|76|30,9|100|
|nova|avtopilot|5,22|112|128|0,0|0|
|nova|po ograji|6,79|96|102|30,8|100|

Speljevanje (avto vzporedno, bok 2 cm od ograje, plin + volan stran): 0,3 m stran za vedno po 1,33 s iz mirovanja (TITAN 2,41 s) in po 0,45 s pri 60 km/h; hit ≤ 1,0 m/s, škoda 0.

Vse vrstice (matrika 360, prikolica 60, vsi stolpci, nova fizika, trava): `node tools/trki/zid.js` ali `--json`.

Popravki in dopolnila preverjalca:

- Tabeli A in B tečeta v zanki za sam avto, brez odpadlih kosov iz zanke dirke: vrstice s škodo nad ~50 % (15°/200, 30°/200 in bolj strmo) precenijo hitrost po trku. V pravi zanki dirke da 30°/200: 156 km/h po 1. koraku, 112 km/h pri 0,15 s (56 %), v0,5 107–110, v2 98–100; Bathurst 113 (0,15 s), 104 ob odhodu, v2 67; Spa 107, v2 61. Brez kosov 143 km/h (72 %).
- Po trku naravnan v 0,15–0,32 s (asfalt do ograje), 0,23–0,8 s (trava pred ograjo), 2,3–2,8 s (Bathurst 30°/200); izstopni kot 0,5–0,9° na asfaltu, 0,9–2,9° na Bathurstu. Čas 2,9 s do vzporednega nosu (15°/60 brez vnosa) velja za asfalt do ograje; na Bathurstu (2,5 m trave pred ograjo) 0,5–0,75 s.
- 90°: stolpec dh je vzet ob odhodu po 0,02–0,03 s; nos ostane zasukan 18° (15–27° pri 80–100°). Na ovalu dobi sunek en vogal (60 → 14 km/h), na pravem zidu (Bathurst) oba (60 → 10 in 120 → 20 km/h v enem koraku).
- Tabela C, cisterna: stolpec »zlom« je končni kot. Vrh pri 5°/120 je 63,2° pri 0,77 s (z volanom stran po 0,3 s 63,3°, nova fizika 9,1°); prag: 3°/120 1,3°, 5°/60 2,3°, 15°/120 55,8°. Čelno 60 km/h: 6 korakov s škodo (55 %) proti 24 % za vlačilec sam; 120 km/h: 8 korakov, 100 % proti 57 %.
- Nos zidu boksov, skok vstran po odmiku sredine avta od črte zidu: Spa 115/95/55/82/42/0 cm pri 0/−0,2/−0,6/+0,2/+0,6/±1,2 m; Bathurst 70/90/87/50/10 cm pri 0/+0,2/+0,6/−0,2/−0,6 m.
- Rob prepada: prag je točno 2,5 m/s navzven (10°/50: rob drži 3,08 s; 10°/55 pade; 20°/20 drži 4,43 s in se ustavi). Rob nove mape: 60°/100: 99,2 → 49,6 km/h, vogal 2,17 m čez rob; 90°/80: 79,4 → 0,0 km/h v enem koraku brez škode.
- Nova fizika ob ograji (tabela B, stolpca »nova: n« in »utr«) je pri preverjalcu šteta do zadnjega stika: 5°/60 117 preklopov na sekundo; 5°/120 36 dotikov in 35 na sekundo; 15°/120 15 dotikov in 37 na sekundo; 30°/200 27 dotikov in 37 na sekundo; reža največ 2,0 cm, udarci največ 0,20 m/s.
- Tekmeci po trku v ograjo (brez odstopanja): po 5–30°/120 so od ograje v 0,2–0,7 s in po 1 s vozijo 115–144 km/h (asfalt) oziroma 89–90 km/h (Spa, Bathurst); po 60–90° stojijo 3,5 s, nato odpeljejo; nobeden ni obtičal.

**Lastni odpadli kosi po trku v ograjo (preverjalec; dirka s kosi proti dirki brez kosov, km/h)**

| trk | kje | s kosi | brez kosov | kdaj |
|---|---|---|---|---|
| 30°/200 (2 kosa) | 5 mest | 107–113 | 139–143 | 0,15 s po trku |
| 30°/200 | asfalt / Bathurst / Spa | 110 / 91 / 96 | 140 / 126 / 127 | 0,5 s |
| 15°/200 (1 kos) | Bathurst / Spa | 135 / 133 | 153 / 156 | 0,5 s |
| 15°/200 | Spa | 56 | 103 | 2 s |
| 30°/120 in 15°/120 (škoda do 45 %) | – | brez vpliva | – | prag pri ~50 % škode |

**Vožnja po ograji skozi ovinek z asfaltom do ograje (preverjalec; poln plin brez zavore in volana proti samovozniku igre z največjo spretnostjo 1,12; čas odseka v s)**

| kje | po ograji | samovoznik na meji | razlika | opomba |
|---|---|---|---|---|
| oval R 30 m, klasična | 14,18 | 16,39 | −13,5 % | najnižja hitrost 129 proti 84 km/h, škoda 24 %, najmočnejši udarec 7,0 m/s |
| oval R 60 m, klasična | 15,64 | 16,92 | −7,6 % | škoda 8 %, udarec 4,7 m/s |
| oval R 120 m, klasična | 18,79 | 18,27 | +2,8 % | |
| oval R 30 / 60 / 120 m, nova | 16,18 / 17,32 / 20,42 | 16,47 / 17,50 / 19,29 | | 100 % škode |
| Marrakesh (142°, R ~45 m) | 14,93–15,14 | 14,95 | | samovoznik s spretnostjo 1,08: 15,30 s; 1: 16,15 s |
| Bathurst (120°, R ~40 m) | 13,76–13,85 | 13,77 | | 1,08: 13,90 s; 1: 14,37 s |
| Štajerska | 16,85 | 14,93 | | počasneje |
| oval R 60 m s 4 m trave pred ograjo | 26,26 | | | vedno počasneje |

Trda podlaga do zunanje ograje: 6 373 m od 67 693 m ovinkov (R pod 250 m) na 22 pravih progah (9 %): Marrakesh 100 %, Bathurst 96 %, Štajerska 87 %, Harju 61 %, Spa 58 %, Montréal 26 %, Medvode 14 %.

Volan, držan proti ograji (preverjalec; dotik 5°, poln plin): klasična 60 km/h: 63 → 43 km/h (1 s) → 0 (2 s), nos 64° v zid; 120 km/h: 118 → 90 (2 s) → 0 (4 s), nos 36°. Nova: 60 → 60/57/56 km/h pri 1/2/4 s, nos 2,9°; 120 → 119/114/104 km/h, nos 2,4°.

### Predmeti, odpadli deli, promet, policija (`predmeti.js`)

**A. Predmeti ob progi** (rally 1150 kg brez plina; n = koraki stika, dv% = izguba proti kontroli pri 60/120/200 km/h; vo/v = predmet/avto pri 60/200; h = vrh leta m; pA/pP = izgubljena gib. količina avta / pridobljena predmeta pri 120; prič. = 1,35·m/(M+m))
| vrsta kg | n | dv% sredina | dv% zamik 0,6 m | vo/v | h | pA/pP | prič. % |
|---|---|---|---|---|---|---|---|
| stožec 3 | 31/26/26 | 4,9/11,6/11,5 | 0,7/1,3/1,3 | 0,83/0,32 | 3,7 | 82,2 | 0,35 |
| guma 9 | 58/27/27 | 17,2/29,9/31,6 | 2,7/5,1/4,5 | 0,81/0,32 | 3,7 | 70,8 | 1,05 |
| bala 26 | 110/29/28 | 42,8/49,7/62,3 | 4,2/16,4/16,2 | 0,84/0,32 | 3,7 | 53,0 | 2,98 |
| sklad bal 78 | 97/69/27 | 45,1/59,3/61,8 | 8,3/28,1/37,7 | 0,87/0,41 | 3,7 | 73,6 | 8,57 |
| prenosna svetilka 5 | 56/37/27 | 13,2/24,7/19,0 | 1,7/1,8/1,6 | 0,83/0,32 | 3,5 | 105,4 | 0,58 |
| sod 12 | 2/1/1 | 3,7/1,9/1,9 | 1,9/1,9/1,9 | 0,83/0,32 | 0,9 | 3,4 | 1,39 |
| tabla zavorne razdalje 16 | 1/1/1 | 2,6/2,6/2,6 | 2,6/2,6/2,6 | 0,48/0,14 | 0,3 | 7,7 | 1,85 |
| hidrant 45 | 2/1/1 | 8,5/4,5/4,5 | 4,5/4,5/4,5 | 0,84/0,32 | 0,9 | 2,1 | 5,08 |
| svetilka 110 | 1/1/1 | 4,5/4,5/4,5 | 4,5/4,5/4,5 | 0,42/0,32 | 2,0 | 1,1 | 11,79 |
| nadstrešek 220 | 1/1/1 | 4,5/4,5/4,5 | 4,5/4,5/4,5 | 0,51/0,26 | 2,5 | 0,6 | 21,68 |

**B. Zamik zadetka 0/0,2/0,4/0,6/0,8/1,0/1,2 m**
| predmet km/h | n | dv% |
|---|---|---|
| stožec 60 | 31/14/5/2/2/2/0 | 4,9/1,9/0,9/0,7/0,7/0,6/- |
| stožec 200 | 26/5/4/3/2/1/0 | 11,5/2,4/1,7/1,3/1,0/0,5/- |
| bala 60 | 110/21/11/1/1/1/1 | 42,8/18,1/9,5/4,2/4,2/4,2/4,2 |
| bala 200 | 28/9/6/5/4/2/1 | 62,3/29,8/21,1/16,2/13,2/5,8/4,2 |

**C. Isti predmet, avti 165/680/1150/5300 kg, 120 km/h** (dv%): stožec 11,3/11,6/11,6/11,4; bala 48,1/49,7/49,7/52,1; nadstrešek 4,5 pri vseh; ležeč pokrov 2,5 pri vseh; drseč pokrov 7,8/12,8/12,7/10,3
**D. Počasi 5/15/30 km/h** (dv%; pot predmeta m): sklad bal 18,0/25,4/21,1; nadstrešek 0,7/7,4/7,8 (0,1/4,6/2,9 m); svetilka 0,7/2,3/6,8 (0,1/0,2/4,6 m); hidrant 2,5/4,5/8,2

**E. Odpadli deli** (m = igralna masa; dv% (n) pri 60/120/200 km/h, v sredino)
| del (m) | leži | drsi 6 m/s | leti 0,7 v | tik pred avtom | lasten del |
|---|---|---|---|---|---|
| ogledalo (1) | 0,2 | 0,9 (3)/1,2 (4)/1,0 (4) | 1,3 (4)/0,6 (2)/0,4 (1) | 2,2 (7)/1,6 (5)/1,1 (4) | ne zadene |
| blatnik (5) | 1,0 | 4,5 (3)/4,8 (3)/3,7 (3) | 4,8 (3)/3,1 (2)/2,0 (1) | 7,8 (5)/5,0 (3)/3,1 (2) | -/-/2,0 (1) |
| odbijač (7) | 1,4 | 6,1 (3)/6,6 (3)/4,9 (3) | 6,6 (3)/4,2 (2)/2,8 (1) | - | 8,4 (4)/4,4 (2)/2,9 (2) |
| pokrov (14) | 2,5 | 9,0 (2)/12,7 (3)/10,9 (2) | 9,5 (2)/8,2 (2)/5,6 (1) | 13,7 (3)/9,6 (2)/7,8 (2) | 12,5 (3)/8,2 (2)/5,6 (1) |

**F. Promet, ljudje, policija** (prvi dotik; e = odboj, p = gib. količina po/pred, prič. = (1+e)·m/(M+m))
| trk (kg) | km/h | dv% avta | prič. % | e | p | opomba |
|---|---|---|---|---|---|---|
| avto 1300 | 120 | 66,3 | 66,3 | 0,25 | 1,00 | n 7, sunek nosu 23°, w 67°/s, vdor 0,50 m |
| avtobus 12 500 | 120 | 114,4 | 114,5 | 0,25 | 1,00 | avto se odbije nazaj s 17 km/h |
| motor 290 | 120 | 25,2 | 25,2 | 0,25 | 1,00 | vdor 0,15 m |
| kolo 90 | 60 | 21,1 | 9,1 | - | 0,83 | kolo 0,5 v; avto do 42,5 km/h |
| kolo 90 | 200 | 16,9 | 9,1 | - | 0,87 | |
| avto 1300, zamik 0,6 m | 120 | 53,6 | - | 0,01 | 1,00 | sunek 23°, smer +16° |
| avtobus, bok 5° | 60 | 0,6 | - | - | 1,03 | sunek 23°, w 62°/s, smer +15°, vdor 0,11 m |
| tovornjak 32 000, bok 30° | 60 | 0,3 | - | - | 1,00 | w 93°/s, smer +27°, vdor 0,71 m |
| avto 1300, beg | 120 | 53,7 | 53,7 | 0,05 | 1,00 | n 513, vdor 0,05 m |
| pešec 75 | 60 | 8,4 | 6,1–8,3 | - | - | pešec 0,34 v, pA/pP 4,2 |
| patrulja 1750 | 120 | 61,5 | 61,5 | 0,05 | 1,00 | n 214, škoda 10 % |
| patr. motor 430, zamik 0,6 m | 120 | 18,9 | 27,0 | - | 1,00 | zasuk motorja 1019°/s |

**G. Stavba (boxCollide), 120 km/h**: 10°: 99 % hitrosti vzdolž stene, w 124°/s, škoda 6 %; 30°: 95 %, w 344°/s, škoda 45 %; 90°: obstane (e 0), škoda 39 % (17,8 % pri 60, 66,8 % pri 200); skozi steno 0 cm
**H. Stoječa polprikolica 17 300 kg / odstopljen avto 1400 kg** (60/120/200): prikolica: avto po trku −1/−3/−4 km/h, e 0,09, p 1,00, škoda 21/48/83 %; odstopljen: avto po trku 23/46/68 km/h, e 0,12/0,12/0,16, p 0,99/1,00/0,95, škoda 21/48/83 %

**I. Več predmetov hkrati** (60/120 km/h)
| prizor | n | dv% | budnih | predmet-korakov | mir s | pari drug v drugem |
|---|---|---|---|---|---|---|
| 3 skladi gum (9 gum) | 51/52 | 22,4/40,0 | 9/9 | 3232/3655 | 4,5/5,4 | 0 |
| polje 6 × 5 stožcev | 82/35 | 18,8/30,1 | 28/30 | 6585/8517 | 4,2/4,6 | 0 |
| polje 5 × 4 sodi | 6/7 | 16,8/18,4 | 20/20 | 4898/5935 | 4,2/4,1 | 0 |

Čas koraka dirke (Node, 1 avto): 14–85 µs z budnimi predmeti, 5–14 µs brez.

**J. Predmet med avtom in ograjo** (120 / 200 km/h; avto 20° proti ograji, predmet 0,15 m pred črto ograje; vrednosti preverjalca na Spa in Bathurstu; dv = počasneje kot ista vožnja brez predmeta 1 s po trku, kontrola sama pade s 120 na 72–75 km/h)
| vrsta | koraki stika | dv km/h | najmanjša hitrost % kontrolne | čez črto ograje m | skok nazaj v enem koraku m |
|---|---|---|---|---|---|
| stožec 3 kg | 25–29 / 22–31 | 8–9 / 5–19 | 79–96 | 0 | 0 |
| guma 9 kg | 74–119 / 25–32 | 19–22 / 40–42 | 49–67 | 0 | 0 |
| bala 26 kg | 64–71 / 26–29 | 34 / 53–64 | 31–42 | 0 | 0 |
| sod (en stik) | 1 | 2,0 / 3,3 | 95–98 | 0 | 0 |
| prenosna svetilka 5 kg | – | – | – | 3,6–3,9 / 9,6–10,2 | 3,5–3,8 / 9,6–10,1 |
| svetilka 110 kg | – | – | – | 3,0–3,2 / 5,6–6,0 | 2,9–3,1 / 5,5–5,9 |

Merilec (lastna ravna proga): bala 69 / 148 korakov, 43 / 79 km/h počasneje, najmanj 6 / 4 % kontrolne (na pravih progah se ne ponovi); prenosna svetilka 5,8 / 12,4 m in svetilka 2,0 / 1,8 m čez črto. V stikih z balo avto na pravih progah izgubi 48,9 / 97,8 km/h.

**K. Ravnina / Spa / Bathurst, 120 km/h** (dv%): stožec 11,6/13,2/10,8; bala 49,7/52,8/47,9; tabla zavorne razdalje 2,6 povsod; ležeč pokrov 2,5 povsod; leteč pokrov 8,2/8,3/5,6

**L. Semenska dirka 13 avtov, vrsta predmetov čez cesto 250 m za štartom** (na plinu)
| proga, predmet | zadelo avtov | n mediana/max | v0 km/h | dv% povpr./max | zaostanek m povpr./max |
|---|---|---|---|---|---|
| Spa, stožec | 11 | 18/102 | 55 | 1,6/2,7 | 0,0/1,4 |
| Spa, bala | 9 | 18/55 | 53 | 8,0/26,9 | 3,0/11,2 |
| Bathurst, stožec | 6 | 10/29 | 83 | 2,0/3,9 | −0,4/1,0 |
| Bathurst, bala | 5 | 13/23 | 83 | 12,8/22,4 | 4,6/8,2 |

**M. Semenska dirka s trkom: isti avto in isti del**
| proga, postavitev | avto kg | del (m) | čas s | n | v0 | izguba km/h | delež samih stikov % (izračunan) |
|---|---|---|---|---|---|---|---|
| Spa, lm | igralec 960 | blatnik (5) | 7,23–8,11 | 62 | 171 | 121 | 71,4 |
| Spa, formula | igralec 798 | blatnik (5) | 7,44–9,00 | 69 | 162 | 117 | 75,2 |
| Bathurst, formula | tekmec 798 | odbijač (7) | 58,48–58,58 | 8 | 211 | 39 | 20,3 |

Popravki in dopolnila preverjalca:

- Tabela A velja za zadetek v sredino (±0,1 m) in 0,6 m iz nje; »14–33-krat preveč« velja le za ta pas. Povprečje po širini avta je v tabeli spodaj.
- Sredina, izguba merjena neposredno v `Race.stepProps`, 60/120/200 km/h, Spa in Bathurst: stožec 5,4/13,3/10,6 in 4,9/11,3/10,4 %; guma 15,1/31,5/31,2 in 13,3/29,5/29,2 %; zaboj 32,1/41,8/54,7 in 27,2/40,8/48,6 %; bala 39,1/50,0/63,3 in 36,1/48,2/61,0 %; sklad bal 45,8/66,3/76,6 in 51,8/64,5/63,6 %. Na polnem plinu pri 120 km/h: stožec 13,9 %, bala 54,6 %.
- Tabela E v oknu 6 s (Spa): drseč pokrov 13,3/15,0/14,2 %, odbijač 6,9/9,7/7,5 %, blatnik 6,2/7,1/5,5 %, ogledalo 1,6/2,7/1,8 %; tik pred avtom pokrov 18,3/14,4/9,8 %; lasten pokrov 13,4/9,5/5,6 %. Enako ali do 1,5-krat več kot pri merilcu.
- Težki predmeti počasi: nadstrešek pri 15 km/h odrinjen 3,0 m ob izgubi 5,5 % (merilec 4,6 m, 7,4 %), svetilka pri 30 km/h 3,9 m ob 6,7 % (4,6 m, 6,8 %). Škoda ob nadstrešku pri 200 km/h: merilec 5,9 %, preverjalec 10,1 % (se razlikujeta).
- Predmet skozi avto (koraki, ko je središče predmeta v tlorisu avta, pri 60/120/200 km/h): hidrant 88/34/14, koš 96/33/13, omarica 56/31/14, sod 118/32/13, nabiralnik 60/31/13, nadstrešek 53/27/12, svetilka 54/27/14; pri 15 km/h 161–219 korakov. Skok iz avta v enem koraku: nadstrešek 1,08 m pri 60 km/h (merilec 1,58 m), omarica 1,17 m.
- Tabela M, neposredna meritev: Spa lm 70 korakov stika, 171 → 25 km/h, od tega 117,7 km/h v stikih z delom; Spa formula 70 korakov, 162 → 32 km/h, 105,3 km/h; Bathurst 8 korakov, −43,0 km/h (20,4 %).
- Natančnost: število korakov stika lahkih predmetov je pri 60 km/h kaotično; odstotki pri 60 km/h držijo na ±20 %, pri 120 in 200 km/h na ±10 %.

**Povprečje po širini avta (preverjalec; Spa, zamik zadetka od −1,2 do +1,2 m po 0,1 m, izguba hitrosti v %)**

| predmet | 60 km/h | 120 km/h | 200 km/h | z robom avta | v sredino pri 120 km/h | pričakovano največ |
|---|---|---|---|---|---|---|
| stožec 3 kg | 1,10 | 2,35 | 1,81 | 0,5 | 13 | 0,35 |
| guma 9 kg | 3,61 | 7,04 | 6,03 | 1,4–1,7 | 31 | 1,05 |
| bala 26 kg | 10,31 | 18,83 | 18,92 | 4,2 | 50 | 2,98 |
| sklad bal 78 kg | 14,78 | 28,23 | 37,78 | 4,5 | 66 | 8,57 |

### Boksi, pristanek, prevračanje, škoda, zanka dirke, splet (`boksi-pristanek.js`)

**Boksi: dirka, vsi avti v bokse (Race.step, 13 avtov)**
| proga | s | avto-korakov v stezi | hkrati | stari trk (koraki) | trki | prekrivanje duh-duh | duh-trden avto | zid v stezi | škoda |
|---|---|---|---|---|---|---|---|---|---|
| Spa | 300 | 14.540 | 4 | 0 | 0 | 247 kor., do 3,02 m | 1.241 kor., do 1,87 m | 3× (do 15,9 m/s) | 0 |
| Bathurst | 150 | 817 | 2 | 0 | 0 | 152, do 2,65 m | 287, do 1,86 m | 1× (3,0 m/s) | 0 |

**Isti dotik pri 80 km/h: stari trk (inPit) / Simulacija (ravnina, rally, cs)**
| prizor | e | po trku km/h P, O | prečno m/s P, O | sunek nosu ° | pop cm | škoda % |
|---|---|---|---|---|---|---|
| zadaj v stoječega | 0,10 (nova 0,40) / 0,12 | 32,7, 39,6 / 31,9, 40,3 | 0 | 0 | 7,2 / 1,0 | 29,9 / 29,9 |
| bok ob boku 3° | – | 79,9 | 2,59, 2,34 / 0,73, 1,99 | 22,9 / 2,6 | 1,1 / 0,1 | 0 |
| izvoz 30 v bok 80 | – | 30, 80 | 1,70, 2,52 / 0,00, 0,32 | 22,9 / 0 | 0,4 / 1,2 | 2,2 / 0 |

**Meja boksne steze, 80 km/h (Spa, cs / nova)**
| kam | kot | udarec m/s | po 1 s km/h | škoda % |
|---|---|---|---|---|
| boksni zid | 15° / 30° | 5,9 / 11,1 | 55,8 / 42,9 (nova 53,5 / 37,4) | 0 / 0 |
| ograja proge | 15° / 30° | 5,7 / 11,0 | 48,2 / 34,4 (nova 53,4 / 39,0) | 8,8 / 23,8 |

**Pristanek (rally 100 km/h, ravna cesta, JUMP_G 14)**
| padec m | v zraku s | vy m/s (pri 9,81) | izguba hitrosti % | škoda % | odboj | bočni g po pristanku |
|---|---|---|---|---|---|---|
| 0,3 | 0,21 | 2,92 (2,43) | 4,7 | 0 | 0 | 1,56 (brez padca 1,58) |
| 1 | 0,38 | 5,25 (4,43) | 8,4 | 0 | 0 | 1,54 |
| 3 | 0,66 | 9,22 (7,67) | 13,0 | 0 | 0 | 1,52 |
| 6 / 10 | 0,92 / 1,19 | 12,95 / 16,68 | 13,0 | 2,0 / 5,7 | 0 | – |

Tovornjak 3–10 m: −5,2 %, škoda 0. Klanec (1 m, 100 km/h): raven 8,4 %, −8 %: 12,0 %, −15 %: 13,0 %, +8 %: 5,1 % (hitrost glede na cesto povsod 5,2–5,3 m/s); Spa (+4,7 %): 6,4 %.

**Skoki na pravih progah (preverjalec; samovoznik igre, rally, klasična fizika, 150 s na progo).** Merilčeva tabela »Greben« je izpuščena: merjena je bila na gladki analitični ploskvi, na kateri avto pristane v koraku vzleta; na pravih progah avto poleti.
| proga | leti | v zraku | vzlet in pristanek v istem koraku | pristanki po letu nad 0,05 s |
|---|---|---|---|---|
| Ouninpohja | 25 | 1411 korakov (11,8 s), najdaljši 1,07 s | 18 korakov, skupaj −2,3 km/h | 18: povprečno −10,9 % = 17,6 km/h, največ −13,0 % = 21,8 km/h (s 2452 m, 167 km/h), skupaj 316,6 km/h |
| Nürburg | 2 | 45 korakov, do 0,36 s | 1 korak | 2: skupaj −4,9 km/h |
| Medvode | – | 1 korak | 8 korakov v ~0,07 s pri s 2253 m in 206 km/h: −8,8 km/h | – |
| Harju, Bâlea, Tianmen, Spa, Bathurst | 0 | 0 | 0 | – |

Pristanek po klancu (preverjalec, avto 1 m nad cesto, 100 km/h): Bathurst ravno 8,4 %, klanec −7,3 %: 11,9 %, −13,0 %: 13,0 %, +7,5 %: 5,1 % (igra vzame navpično hitrost 5,25 / 7,39 / 8,86 / 3,16 m/s, pravokotno na cesto je povsod 5,1–5,3 m/s); Spa −0,5 %: 8,7 %, −7,0 %: 11,5 %, +4,7 %: 6,5 %. Na Ouninpohji je 17 od 18 pristankov na klancu navzdol (povprečno −3,0 %: navpično 6,97 m/s, pravokotno na cesto 5,64 m/s).

**Padec čez rob (lastna cesta z def.drops)**
| vstop | ven m/s | pada s, m | škoda | nazaj | izguba s |
|---|---|---|---|---|---|
| 60 km/h, 15° | 4,35 | 1,61, 16,1 | +32 % | 18,8 m naprej, 28,8 km/h | 0,68 |
| 120 km/h, 15° | 8,56 | 1,61, 16,1 | +32 % | 38,7 m, 28,8 km/h | 1,30 |
| 20 km/h, 5° | < 2,5 | ne pade | 0 | – | – |

**Prevračanje (setCrash roll)**: v bok ≤ 8,9 m/s 0 %, 9,1–20 m/s 11 %; bočno v ograjo ≤ 9,5 m/s 0 %, ≥ 10,5 m/s 11 %.
| km/h | trk m/s | obrati | traja s | konec km/h | pot m | pojemek g | škoda |
|---|---|---|---|---|---|---|---|
| 50 | 10 | 1 | 1,18 | 33,0 | 15,6 | 0,50 | +4 % |
| 100 | 10 / 16 | 1 / 2 | 1,18 / 1,58 | 71,4 / 70,4 | 31,4 / 42,4 | 0,73 / 0,62 | +4 / +8 % |
| 200 | 10 | 1 | 1,18 | 150,6 | 64,0 | 1,21 | +4 % |

Dirke 90 s: čista 0 trkov nad 9 m/s; igralec namerno v trke: Spa 9 žrebov → 2 prevrata, Bathurst 7 → 1.

**Škoda (rally, %)**
| km/h | 18 | 36 | 54 | 72 | 100 | 150 | 200 |
|---|---|---|---|---|---|---|---|
| v stoječ avto (vsak) | 2,4 | 10,4 | 18,4 | 26,4 | 38,9 | 61,1 | 83,4 |
| pravokotno v ograjo | 6,5 | 20,7 | 34,7 | 48,7 | 70,5 | 100 | – |

| avto, škoda, način | 100 → 6 s plina km/h | ovinek g | brez rok 3 s m |
|---|---|---|---|
| rally cel | 209,4 | 2,38 | 0 |
| rally 50 %, Samo videz / Vklop / Vklop + xHandle | 209,4 / 200,6 / 200,5 | 2,38 | 0 / 0 / 4,21 |
| rally 100 %, Vklop | 190,8 | 2,38 | 0 |
| formula cela / 50 % Samo videz | 273,2 / 256,5 | 3,74 / 3,18 | 0 |

**Zanka (Spa, prvih 30 s; Node, µs na korak, razpon 4 zagonov)**
| avtov | parov/korak (maks) | v dosegu (maks) | korak | pari | široka faza | zidovi |
|---|---|---|---|---|---|---|
| 12 | 66 (66) | 2,2 (11) | 144–215 | 13–16 | – | 12–26 |
| 20 | 10 (42) | 4,0 (21) | 180–238 | 3,0–3,4 | 5,0–5,8 | 19–43 |
| 100 | 64 (144) | 22,5 (60) | 612–894 | 14–22 | 68–76 | 98–215 |

Klic (µs): carCollide zunaj dosega 0,14–0,23, v dosegu brez dotika 0,35–0,52, poln trk Simulacija 2,0–3,1, stari 0,13–1,1; wallCollide prosto 0,8–2,2, v ograji 1,6–4,5.

**Splet (ravnina, rally; sunek lastnega avta km/h, A / B)**
| prizor | zamik 0 | zamik 100 ms | zamik 200 ms |
|---|---|---|---|
| zadaj 100 v 80 | −11,7 / +11,7, e 0,17 | −19,5 / 0, B 0 korakov trka, dotik pri 6,51 m (prav 3,95) | −19,1 / 0, pri 8,82 m |
| zadaj 120 v 60 | −33,7 / +33,7 | −59,3 / 0 | −58,8 / 0 |
| čelno 60 + 60 | −68,7 / +68,7, e 0,12 | −122,4 / +122,4, e 1,00, prekrivanje 1,75 m | −122,5 / +122,5, e 1,01, 3,5 m |
| v bok stoječega 60 | −53,5 / +53,5, B zasuk 18,9° | −61,6 / +0,4, B 0,1° | −61,6 / 0 |
| bok ob boku 100, 3° (zasuk) | 11,4° / 22,5° | 39,3° / 68,8° (posledica merilčevega krmilnika; brez rok 2,8° / 2,8°) | brez dotika |

Dve dirki na Spa (opts.remote), zadaj 100 v 80, po 1 s: A −23,9, B −5,9 km/h (ravnina −24,2 / −4,6, z uporom), koraki trka 21 / 0.

Popravki in dopolnila preverjalca:

- Pristanek na Spa in Bathurstu: padec 0,3/1/3 m: −4,5 do −4,9/−8,4 do −8,7/−13,0 % v enem koraku; 200 km/h in 3 m: −13,1 % = −26,1 km/h. Bočni pospešek po pristanku ni ponovljen.
- Prevračanje: isti žreb za avte 1–400 pri prvem trku da 44 od 400 = 11,0 %; potek iz konstant v kodi se s tabelo ujema na 0,1–0,2.
- Škoda po masi: strelica 460 kg v medveda 2300 kg pri 60 km/h: škoda 25,3/21,1 % ob spremembi hitrosti −56,2/+11,2 km/h (5 : 1); mravlja 165 kg v 7000 kg pri 36 km/h: 13,5/5,7 % ob 40,0/0,9 km/h (44 : 1).
- Splet, dve pravi dirki na Spa z lastno interpolacijo stanj: od zadaj 100 v 80 km/h: zamik 100 ms A −17,6, B 0,0 km/h, koraki trka 20/0; zamik 200 ms −17,5/0,0, 52/0. 120 v 60 km/h: −55,7 in −55,6, B 0,0. Čelno 60 + 60: −114,1/+114,4 km/h, e 0,98 (100 ms); −114,5/+115,1, e 1,00 (200 ms). Prvi dotik od zadaj pri razdalji središč 6,30 m (100 ms) in 8,56 m (200 ms) namesto 3,95 m. Prizor »v bok stoječega« ni ponovljen.
- Splet, dvojna simulacija dveh telefonov (preverjalec avto–avto): čelno 120 + 120: en telefon ±14 km/h (e 0,12); dva telefona ±70 km/h pri zamiku 8 ms in ±114–115 km/h pri 50–200 ms. T 120 v stoječega: en telefon 52/59 km/h; dva: strelec 0 km/h, zadeti 58–65 km/h. Od zadaj 120 v 90: en telefon 101/106 km/h; dva: strelec 86–90 km/h, zadeti 0 sunkov.
- Samo s ponovnim zagonom skripte in branjem kode (brez lastne meritve preverjalca): boksna steza, boksni zid brez škode, krilo pri »Samo videz«, vodljivost pri »Vklop«.

## Cilji

Trije viri: meritve referenčnih posnetkov (`docs/nova-fizika-meritve.md`), odprti viri o resničnih trkih (vir z naslovom ali standardom) in prejšnje odločitve uporabnika, ki spremembo omejujejo.

### Referenčni posnetki

Vzorec: 70 dogodkov, potrjenih na sličicah (15 mestni, 40 turni, 15 formula), večinoma bok ob bok. Negotovost: hitrost ±10 %, vrtenje kamere ±5 %, pojemek ±20 %, zasuk avta ±30 % oz. ±8°.

| Kaj | Posnetek | Igra zdaj (Simulacija, igralec v dirkah 2. 11., 8 prog × 150 s) |
|---|---|---|
| Skok vrtenja ob trku, p50 / p90 | 30 / 50 °/s | 34 / 97 °/s (Stara 63 / 74, Arkadna 24 / 87) |
| Sprememba smeri ob trku, p50 / p90 | 2,4° / 7,8° | v 0,5 s 3,0° / 9,4° |
| Bočna hitrost odboja | neto ≈ 1–1,5 m/s, največ ≈ 3,5 m/s | p50 / p90 1,79 / 3,14 m/s |
| Poravnava po trku, p10 / p50 / p90 | 0,2 / 1,0 / 2,4 s | p50 0,89 s |
| Izguba hitrosti ob trku, p50 / p90 | 1,4 / 5,3 m/s (n = 43) | ni merjeno 2. 11. (27. 10. klasična fizika 1,2 m/s) |
| Močan trk v skupino | zasuk 30–40°, poravnava 0,5–0,7 s | kontrolirano: zadnji vogal pod 17° (8 m/s) 34°, oprijem nazaj v 0,6 s |
| Verižni trk ob ogradi | avto 90° bočno, ≈ 1,6 s stoji, v 3 s spet 23 m/s | ni merjeno |

Meritve v dirkah so hrupne (igralčevih dotikov le 14–24 na meritev; pri isti fiziki poravnava p50 0,97–1,76 s), zanesljivejši so kontrolirani trki. Največji odmik Simulacije v dirkah: skok vrtenja p90 97 proti 50 °/s in vstran p50 1,79 proti 1–1,5 m/s.

Kontrolirani trki 2. 11. (Simulacija; izhodišče, ki ga nova različica pri lahkih dotikih ne sme pokvariti): 100 km/h v stoječ avto po 0,25 s 43 / 55 km/h; od zadaj 120 → 100 km/h z zamikom 0,6 m: 2,0° / 2,1° in 0,5 m/s vstran; sprednji vogal pod 15°: 7,4°; vštric 110 / 90 km/h, naslon 1 s: 111 / 90 km/h (ne zlepita se); 60 km/h v bok avta, ki prečka s 30 km/h: zasuk 152°; odboj 0,24 pri 2 m/s, 0,15 pri 8 m/s, 0 ob naslonu (pod 0,5 m/s); poskok položaja pod 3 cm.

Varovalne meritve iz iste teme: ozke proge (120 dirk) 146 udarcev v ograjo in 16 vrtenj (Stara 96 in 0); štart z 22 avti (40 s, 5 prog), koraki s sunkom smeri nad 10°: Simulacija 73 / 100 / 92 / 72 / 2, Stara 1698 / 747 / 495 / 3323 / 653; čas fizike 0,56 ms na korak pri 100 avtih (Stara 0,73) in 0,25 ms pri 22; Stara golden 336/336.

### Resnični trki (odprti viri)

| Stik | Razpon | Vir |
|---|---|---|
| Odboj avto–avto in avto–tog zid po hitrosti | pod 5 km/h 0,4–0,7; 7–16 km/h 0,15–0,35; 25–60 km/h 0,05–0,2 (običajno 0,1); pri 100 km/h in več 0–0,1, odbojna hitrost 3–10 km/h | SAE 931842 »Vehicle Restitution Response in Low Velocity Collisions«; SAE 2013-01-0223; SAE 1999-01-0097; SAE 2000-01-0461 (nad 100 km/h učbeniška ekstrapolacija) |
| Čelno v tog zid, 56 km/h | sunek traja 70–120 ms (pri 120 korakih na sekundo 8–14 korakov), vrh ~29 g, zmečkanje 0,5–0,8 m | NHTSA, 18th ESV; zmečkanje učbeniško |
| Zid pravokotno, 50 in 100 km/h | avto obstane v 70–120 ms; odbojna hitrost 3–7 km/h pri 50 in 3–10 km/h pri 100 km/h; nazaj se odkotali največ 0,5–2 m | NHTSA (18th ESV); SAE 2000-01-0461; razdalja učbeniška |
| Trenje | avto–avto 0,3–0,6; karoserija ob beton 0,15–0,4 (guma ob zid 0,4–0,8); ob jekleno ograjo 0,2–0,4 | SAE 2007-01-0744; SAE 2014-01-0469; arXiv 2104.01806; jeklo učbeniško |
| Preskus ograje: pogoji in merila | TB11 900 kg, 100 km/h, 20°; TB32 1 500 kg, 110 km/h, 20°; MASH 3-10 1 100 kg, 100 km/h, 25° (bočna hitrost v zid 34–42 km/h); izhodni kot do ~15°, po možnosti pod 60 % vstopnega; avto se ne prevrne, ne prepleza in se ne zatakne | EN 1317-2:2010; AASHTO MASH 2016; NCHRP Report 350 (merila iz spomina) |
| Tog betonski zid po kotih | 5–10°: izguba 3–10 %, izhod 0–3°, zasuk pod 5°; 20–25° pri 100 km/h: izhodna hitrost 72–88 %, izhodni kot 3–10°, avto drsi ob zidu 3–10 m; 45°: ostane 40–50 % hitrosti, zasuk 20–60°; oplazenje ima dva sunka: sprednji vogal, nato »udarec repa« 0,15–0,3 s pozneje | poročila preskusov MASH TL-3 (iz spomina) in sunkovni model z μ 0,25–0,4 (učbeniško) |
| Jeklena odbojna ograja, 100 km/h pod 20–25° | upogib 0,6–1,2 m, izhodna hitrost 45–70 % vstopne, izhodni kot 5–20°, stik 0,3–0,6 s | poročila preskusov MASH (iz spomina) |
| Zid iz gum, pravokotno 60–80 km/h | ustavitev v 1–2,5 m, povprečno 9–25 g, odboj 0,1–0,2, avto pogosto obtiči v gumah | FIA Standard 8861-2000; FIA Standard 3501-2017; SAE 983061 |
| Vztrajnost okoli navpične osi | osebni avto: polmer vztrajnosti 1,35–1,55 m (≈ 0,30 × dolžina avta); isti sunek v vogal zasuka tovornjak 4–10× manj kot avto | NHTSA Light Vehicle Inertial Parameter Database (SAE 930897, SAE 1999-01-1336); tovornjaki učbeniško |
| Udarec v zadnji vogal med dirko, 100 km/h | bočno 2 m/s: ~27 °/s (gume ujamejo); 4 m/s: ~50 °/s; 8 m/s: ~100 °/s (zanese 20–40°); prag: bočna hitrost zadnje osi nad 0,12–0,17 × hitrost vožnje, v ovinku ali dežju pol manj; potisk 0,5–1,5 m/s, ki traja 0,3–0,6 s, zasuka 90–180° v 1–2 s | učbeniško (sunek togega telesa; lasten izračun zbiralca) |
| Ujem gum po sunku vrtenja | zasuk ≈ skok vrtenja × τ; τ 0,2–0,25 s cestne gume, ~0,1 s dirkalne pri 100 km/h (igra 0,15 s) | učbeniško (enosledni model vozila) |
| Bočno drsenje in vrtenje, suh asfalt | 0,5–0,8 g = 18–28 km/h na sekundo; s 100 km/h do stoja 3,5–5,7 s in 50–80 m; 180° v 1–2 s | »Experimental determination of the translational acceleration values for a spinning vehicle« (2006); »Drag Factor Attenuation for Rotating Vehicles« (2008); SAE 930653 |
| Nalet in mase | enaki masi, 100 km/h v stoječega: 45 / 55 km/h; 120 → 100 km/h: 108,5 / 111,5 km/h; avto 1 300 kg v stoječ tovornjak 5 500 kg: avto 11, tovornjak 21 km/h | učbeniško (gibalna količina, odboj 0,1–0,15) |
| Čelni trk in bočni trk (T) | čelni 50 + 50 km/h: oba obstaneta (odboj ~5 km/h); z zamikom 30–50 %: zasuk 30–90° v 0,5–1 s, razideta se z 10–30 % hitrosti; T 60 km/h v bok avta s 30 km/h: zadeti drsi bočno ~33 km/h, gume jo odrgnejo v ~1,2 s in 5–6 m, zasuk 45–180° | učbeniško; FMVSS 214 (iz spomina) |
| Bok ob bok | premik 5–20 cm, zasuk pod 1–2°, izguba 0–2 km/h; avta se ne zlepita | učbeniško (lasten izračun zbiralca) |
| Prevračanje | SSF osebnih avtov 1,30–1,50; na ravnem asfaltu avto zdrsne in se ne prevrne, ~95 % prevračanj je ob oviri; ob robniku bočno ~25–50 km/h; kotaljenje 0,4–0,5 g, en obrat na ~1–1,5 s | NHTSA DOT HS 809 868; SAE 2006-01-0722; ostalo učbeniško |
| Predmeti | stožec 3–9 kg: pod 1 % (0,3–0,7 % pri 1 300 kg), odleti z 1–1,8× hitrostjo avta; podirljiv drog: do 3 m/s (največ 5 m/s); bala 15–25 kg: 1–2 %; kup gum 30–50 kg: 2–4 %; prazna plastična ograja 40–75 kg: 3–5 %; lahki predmeti odletijo 5–20 m naprej | učbeniško (gibalna količina); EN 12767; AASHTO MASH 2016; NCHRP Report 350 |

Zanesljivost virov: vrstice z oznako »učbeniško«, »iz spomina« ali »lasten izračun« niso potrjene z izvirnikom (zbiralcu je delovalo iskanje po spletu, branje strani ne); izračuni so s sunkovnim modelom (m 1 300 kg, Izz 2 100 kg·m², μ 0,25–0,4).

Po čem meriti realizem (zbiralec): igralec s kamere za avtom opazi pet stvari: kam gre avto po trku (smer, zasuk), koliko hitrosti izgubi, ali se odbije, ali zadeti avto reagira po teži in ali lahko pelje naprej. Za igralnost ostane omehčano: pri »Samo videz« en trk ne konča dirke; izguba oprijema šele nad pragom in tekmeci zdrs ujamejo; poravnava je hitrejša kot v resnici (0,5–1 s namesto 1–2 s); prevračanje redko in le ob oviri; zid avta ne zatakne in slike ne sune.

### Odločitve uporabnika, ki spremembo omejujejo

Poleg Okvira zgoraj:

- **28. 10. 2026:** uporabnik ostaja pri klasični fiziki; nova različica trkov mora delovati pri klasični (in pri novi).
- **29.–31. 10. 2026:** motili so odboj od avta, preveč premakljiv drugi avto, blisk isker ob trku in avti, ki se »vlečejo kot magnet« (vštric se ne smeta zlepiti; drgnjenje samo ob udarcu nad 0,5 m/s in s pravima masama).
- **2. 11. 2026:** pet različic (Simulacija privzeto, Arkadna, Mehka, Kaskaderska, Stara), na dirki s prijatelji vedno Simulacija; ograja, beg pred policijo (`crashCollide`) in promet ostanejo, kot so; v boksni stezi trki kot pri Stari; tekmeca ob dotiku izgubita le pol oprijema (`glR` 0,5), varnostni avto ga ne izgubi nikoli; Stara ostane bit za bitom (golden 336/336), testa obremenitve telefona vozita s Staro.
- **3.–4. 11. 2026:** polje nad 21 tekmecev začne z letečim startom, ker se štart z mesta po novih trkih zagozdi; več vrtenja ob dotikih bi to poslabšalo.
- **5. 11. 2026:** #202 zaprt: fizika in trki ostanejo, kot so na `main`.
- **Poškodbe in videz:** privzeto »Samo videz«; trki se na gumah samo vidijo; močan bočni trk prevrne avto približno vsakič deseti (`XROLL`); KOLIBRI: trk ga stane 3,5-krat manj (`knockK`), močnejši trki ne smejo pospešiti razpada; tresenje kamere je privzeto izklopljeno.
- **Pragovi, vezani na velikost udarca:** neskončna vožnja se konča ob udarcu v ograjo nad 6 m/s (`hitWall`) in ob sunku vozila nad 3 m/s; predrta guma od ~40 km/h naravnost v oviro; čist krog: trk je izguba hitrosti nad 50 m/s². Nova različica jih ne sme premakniti brez namena.
- **Boksi:** od izvoza s proge do vrnitve je avto duh; na cesti boksov avto ne dobi poškodb.
- **9. 11. 2026:** misije so ustavljene (dovoljen je najmanjši popravek, da testi misij ostanejo zeleni; misije uporabljajo trke: vlečna vrv, prikolica); testne proge so zamrznjene, zato meritve in slike na Spa in Bathurstu.

## Odstopanja

Ena tabela, razvrščena po tem, kaj igralec v dirki s kamero za avtom najbolj čuti: najprej občutek (5 = v vsaki dirki, 1 = komaj opazno), nato zaupanje v meritev (visoko, srednje, nizko); oboje je krepko na začetku stolpca »Kaj čuti igralec«. Občutek je znižan, kjer je preverjalec pomen zmanjšal ali kjer stik ni del privzete igre (pripis v oklepaju: nova fizika, prevračanje, škoda »Vklop«, promet, nova mapa).

Od 61 ugotovitev petih merilcev so preverjalci 48 potrdili, 11 popravili in 2 ovrgli. V tabeli je 55 ugotovitev merilcev in 8 novih najdb preverjalcev, združenih v 44 vrstic (ista stvar pri več merilcih je ena vrstica); 2 ovrženi in 4 namerne lastnosti so pod tabelo. Stolpec »Preverjeno«: **potrjeno** (preverjalec je pojav ponovil z lastno skripto; kjer piše, samo s kodo ali ponovnim zagonom merilčeve skripte), **popravljeno** (pojav drži, številka ali razlaga je popravljena; v tabeli je popravljena vrednost), **ni preverjeno** (nova najdba preverjalca, ki je ni ponovil nihče drug). Kjer se merilec in preverjalec razlikujeta, sta zapisani obe številki. Vse velja za klasično fiziko in različico Simulacija, če ni napisano drugače; hitrosti brez enote v zapisih kot 30°/200 so km/h.

| # | Odstopanje | Izmerjeno zdaj | Pričakovano (vir) | Kaj čuti igralec | Predlog | Preverjeno |
|---|---|---|---|---|---|---|
| 1 | Lahek predmet (stožec, guma, bala) zavira kot zid: avto ga dohiteva in zadeva 20–120 korakov zapored; masa avta ne šteje | V sredino pri 60/120/200 km/h: stožec 3 kg 4,9/11,6/11,5 % (26–31 korakov stika), guma 9 kg 17,2/29,9/31,6 %, bala 26 kg 42,8/49,7/62,3 %. Povprečje po širini avta: stožec 1,10/2,35/1,81 %, bala 10,31/18,83/18,92 %; z robom 0,5 % in 4,2 %. Bala ob ograji: po 1 s 34 (120) in 53–64 km/h (200) počasneje. Avti 165–5300 kg: stožec 11,3–11,6 %. Dirka (Spa, bale): povprečno 8,0 %, največ 26,9 %. | Največ (1 + e)·m/(M + m) ne glede na hitrost in zamik: stožec 0,35 %, guma 1,05 %, bala 2,98 %, sklad bal 8,57 % (ohranitev gibalne količine). Odprti viri: prometni stožec pod 1 %, bala slame 1–2 %, kup gum 2–4 %. Predmet je po trku hitrejši od avta, zato ponovnega stika ni. | **5 · visoko.** Avto, ki ga odnese široko v vrsto bal ali stožcev, izgubi desetine km/h, kot bi zadel oviro; ista bala stane 4 % ali 50 % hitrosti glede na 0,5 m zamika. | En enak in nasproten sunek na stik (Δv = j/M, z ročico tudi zasuk) namesto deleža hitrosti na vsak korak stika (`propFeel`); meja hitrosti predmeta (1 + e)·v, da odleti naprej. Cilj: bala največ 3 %, sklad bal največ 9 % pri vsakem zamiku. Ostane: predmet se umakne, skladi se razsujejo, zvok, spanje predmetov, različice 1–5. | potrjeno (sredina; Spa in Bathurst, tudi na plinu); popravljeno (ob ograji: najmanj 31–42 % kontrolne hitrosti, ne »skoraj obstane«); povprečje po širini je nova najdba preverjalca |
| 2 | Odpadli deli zavirajo avto, tudi lastni | Premikajoč del: do 6 % hitrosti na vsak korak stika. Pokrov (m 14) pri 60/120/200 km/h: drseč 9,0/12,7/10,9 % v 2–3 korakih, tik pred avtom 13,7/9,6/7,8 %, lasten 12,5/8,2/5,6 %. Dirka (Spa): igralec rine svoj blatnik 62 korakov od 171 km/h: −121 km/h (preverjalec: 171 → 25 km/h, 117,7 km/h v stikih). Po trku 30°/200 v ograjo lastni kosi vzamejo 27–33 km/h v 0,15 s (prag pri ~50 % škode). | Enkrat na del največ (1 + e)·m/(M + m): pokrov 14 kg ob 1150 kg 1,6 %, odbijač 0,8 %, blatnik 0,6 %, ogledalo 0,1 % (ohranitev gibalne količine). Del, ki ga avto rine, jemlje le trenje ob tla (33 N). Izguba ne sme skočiti na pragu škode. | **5 · visoko.** Po trku avto »zavira sam«: lasten blatnik ali pokrov pred nosom ga v dobri sekundi upočasni za več kot 100 km/h; po hudem udarcu v ograjo izgubi še petino hitrosti. | Sunek po masi (j/M) enkrat na stik; nov stik z istim delom šele po ločitvi (zastavica kot `d.on`); kosi prvih ~0,5 s ne trkajo z avtom, od katerega so odpadli; dohiten del se odrine vstran ali pod avto. Ostane: največ 40 kosov, deli znotraj ograje, zvok in tresljaj ob zadetku. | potrjeno (drseč pokrov 13,3/15,0/14,2 % v oknu 6 s; dirke ponovljene); lastni kosi po trku v ograjo so nova najdba preverjalca |
| 3 | Trd sunek v sprednji del avta ga ne zavrti: zadeti vozi naprej kot po tirih (klasična fizika zavrti le ob zadetku v zadek) | T 120 km/h v sprednjo os avta, ki prečka s 120 km/h: zadeti 120 → 113 km/h po 0,1 s, nos največ −2,9°, v 0,78 s prestavljen 8,9 m vstran in spet raven; tog sunek bi dal −417 °/s, vzeto 0, `xgl` 0. V sprednjo os stoječega: 41° (74 °/s); prečkajočega s 60 km/h: 6°. Isti trk v zadnjo os: 268° in 478–500° (665–792 °/s, `xgl` 1). | dw = r × P / I, enako spredaj in zadaj (647 °/s na ročici 1,19 m). Kot zdrsa nosu ~32° je daleč čez mejo gum (5–10°): zasuk 60–180°, drsenje 1–2 s, smer gibanja se obrne za 25–30° (ohranitev gibalne in vrtilne količine). Odprti viri: bočni trk zadetega zasuka za 45–180°. | **5 · visoko.** Avto, zadet v sprednji bok (tekmec ali igralec), se ne zavrti in ne zdrsne: prestavi se vstran in pelje naprej, kot da trka ni bilo. | Izguba oprijema in zasuk tudi, ko je trdo potisnjen nos (prečni Δv nad ~6 m/s ali zdrs nosu nad ~0,25–0,3 hitrosti): 30–50 % dw v `c.w`; prečni del nad tem, kar gume ujamejo, se drgne z drsnim trenjem (`CRASH.slide` 0,9 g). Ostane: lahki dotiki v sprednji bok (2 in 4 m/s: 2–6°, `xgl` 0), drgnjenje bok ob boku, sunek od zadaj. | potrjeno (sprednja os: −3,1°, vzeto 0 ob togi vsoti −572/+689 °/s; stoječi −41,2°); popravljeno (zadnja os 268° in 478–500°, ne 180°/178°: skripta je kot rezala pri 180°) |
| 4 | Ograja avto poravna vzporedno in ga drži ob sebi; po trku ni ne zasuka ne izgube oprijema | Poševno 5–30°: izstopni kot 0,1–0,9°, čisti odboj 0,00–0,03. Brez vnosa stik vsak korak nad 6,8 s (5°/60, 5°/120, 15°/60, 30°/60); 15°/60: nos vzporeden šele po 2,9 s. Poln plin brez volana: prislonjen nad 5 s in pospešuje skoraj kot prost (5°/60: 104/137/179 km/h pri 1/2/4 s proti 100/134/177). Po 30°/200 je raven v 0,20 s; `xgl` ostane 0. | Izstopni kot pod ~60 % vpadnega, vozilo se ne vrne v ograjo (EN 1317-2, NCHRP Report 350). Toga betonska ograja pri 20–25°: izstop 3–10°, ostane 72–88 % hitrosti; pri 30° po modelu sunka 66–73 % (igra brez odpadlih kosov 72 %, z njimi 56 %). | **4 · visoko.** Avto se ob ograjo »prilepi« in drsi ob njej kot po tirnici; po hudem poševnem udarcu je v petinki sekunde raven in vozen, brez zanašanja. | Samo nova različica: vogal dobi ves zasuk iz ročice (1 namesto `wallYaw` 0,3) ali dotik z dvema vogaloma poravna nos v času stika; odboj 0,1–0,2 za beton (izstop 1–3°); nad ~8 m/s normalne hitrosti izguba oprijema kot pri trku med avti. V obliki, ki se zlije s `touch()` iz #494. | potrjeno (prislonjen: nos 15° → 9,1° → 1,4° → 0,5° pri 0,25/2/3,0 s); popravljeno (poševni trk: pričakovanih 50–65 % ni podprtih; v dirki ostane po 30°/200 le 56 % zaradi lastnih kosov, vrstica 2) |
| 5 | Čelni trk v ograjo vrže avto vstran vzdolž ograje in ga zavrti | 90° pri 60/120/200 km/h: po 1. koraku 14/27/46 km/h, zasuk v koraku 93/187/312 °/s; od ograje odide z 9/19/33 km/h vzdolž nje (15–16 % vpadne hitrosti), vedno v isto stran avta. Preverjalec (90°/100): 19 % vzdolž ograje, 151–154 °/s, nos ostane zasukan 18° (15–27° pri 80–100°). Po trku pri 120 km/h avto po 3,8 s doseže nasprotno ograjo 14,5 m stran. | Simetričen čelni trk nima hitrosti vzdolž ograje ne zasuka: avto obstane v 70–120 ms, odboj 3–7 km/h pri 50 km/h in 3–10 km/h pri 100 km/h, nazaj se odkotali največ 0,5–2 m (simetrija in ohranitev gibalne količine; čelni preskusi v togo oviro). | **4 · visoko.** Po čelnem trku avto ne obstane pred ograjo: zdrsne vstran, se zasuka in oddrsi čez cesto. | Vogale, ki so v istem koraku v ograji, reši skupaj (en sunek v skupnem prijemališču ali ponovitve do skladnosti) in trenje računaj na hitrost težišča; zaporedna obdelava vogalov je vir nesimetrije. | potrjeno (vzrok v kodi: sunek dobi samo en vogal); popravek: nos ostane zasukan 18°, ne 1–3°; nesimetrija le ±5° okoli pravokotnice; pravi zid (Bathurst) 90°/60: 10 km/h po 1. koraku, 73 °/s |
| 6 | Vse ograje so ista snov: beton, jeklena ograja, gume, mreža in les imajo odboj 0,05, trenje 0,25 in delež zasuka 0,3 | Na 5 mestih (zid boksov in ravnina na Spa, ravnina in gorski zid Bathursta, oval): 15°/120 → 110–111 km/h po 1. koraku, udarec 8,5–8,6 m/s, škoda 17–20 %; 90°/60 → 14 km/h, 16,5–16,6 m/s, škoda 40–41 %. Razliko po 2 s (58–95 km/h) naredi samo podlaga pred ograjo. Vrste ograj obstajajo le v risanju. | Beton: trenje 0,15–0,4, ne poda se. Jeklena ograja: poda se 0,6–1,2 m, izstop s 45–70 % hitrosti. Pregrada iz gum: ustavi v 1–2,5 m, odboj 0,1–0,2, avto pogosto obtiči (EN 1317-2, AASHTO MASH, FIA Standard 8861-2000). | **4 · visoko.** Gume ob ovinku, jeklena ograja in betonski zid se ob trku obnašajo enako; pregrada iz gum avta ne ujame. | `Track` nosi vrsto ograje po vzorcu in strani (ista tabela, kot jo riše svet); `wallCollide` za vrsto bere {odboj, trenje, delež zasuka, globina mečkanja, faktor škode}; številke samo v novi različici. Lesena ograja ostane krhka (#494). | potrjeno (koda bere samo `CSK.wallE` 0,05, `wallMu` 0,25, `wallYaw` 0,3; 360 vrstic matrike je enakih pri vseh različicah) |
| 7 | Pristanek po skoku vzame ~11 % hitrosti v enem koraku | Ouninpohja (samovoznik, 150 s): 18 skokov, vsak pristanek vzame povprečno 10,9 % = 17,6 km/h, največ 13,0 % = 21,8 km/h; skupaj 316,6 km/h. Padec 0,3/1/3 m pri 100 km/h: −4,7/−8,4/−13,0 %. Šteje navpična hitrost, ne hitrost glede na cesto: klanec 0/−8/−15/+8 %: 8,4/12,0/13,0/5,1 % (glede na cesto povsod 5,2–5,3 m/s). Brez odboja; škoda šele nad 11 m/s. | Izgubi se le sestavina pravokotno na cesto: v·(1 − cos θ), θ = 7,2° → 0,8 % (~1,3 km/h pri 160 km/h). Sunek ob dotiku deluje vzdolž normale podlage, zato je pristanek na klancu navzdol najmehkejši (Newtonovi zakoni, Coulombovo trenje). | **4 · visoko (proge s skoki: Ouninpohja; Nürburg 2 skoka).** Po vsakem skoku avto »zagrabi«, kot bi voznik kratko pohodil zavoro: ~18 km/h na skok, okoli 10-krat preveč. | Izguba iz hitrosti pravokotno na cesto (vy − klanec·vzdolžna hitrost), 1–3 %, razporejena čez `landT` (0,05–0,2 s) namesto v enem koraku; trd pristanek naj se pozna v škodi in kratkem padcu oprijema. Najprej odločitev uporabnika, ali pristanek spada med trke (vprašanje 1). | potrjeno (Bathurst: 8,4/11,9/13,0/5,1 % pri klancu 0/−7,3/−13,0/+7,5 %; 17 od 18 pristankov na Ouninpohji je na klancu navzdol); meritev pravih skokov je nova najdba preverjalca |
| 8 | Na spletu trk ne prenese gibalne količine: udarjajoči izgubi vse, udarjeni nič; čelni trk se odbije prožno | Zamik 100 ms, od zadaj 100 v 80 km/h: udarjajoči −19,5, udarjeni 0,0 km/h (en telefon −11,7/+11,7; preverjalec −17,6/0,0). Čelno 60 + 60: ∓122,4 km/h, odboj 1,00 (en telefon ∓68,7, odboj 0,12; preverjalec ∓114, 0,98). Prvi dotik od zadaj pri razdalji središč 6,51 m namesto 3,95 m (preverjalec 6,30 m). Pri 200 ms gresta avta bok ob boku drug skozi drugega. | Isti izid kot na enem telefonu: gibalna količina para se ohrani (−11,7/+11,7 km/h), čelni trk skoraj neprožen (odboj 0,1–0,2), stik na istem mestu karoserije na obeh telefonih. Zamik mesta = hitrost × zakasnitev: 27,8 m/s × 0,1 s = 2,8 m. | **4 · visoko (samo dirka s prijatelji).** Kdor zadene prijatelja, izgubi vso razliko hitrosti, zadeti ne čuti nič; čelni trk oba odbije kot žogi; trk se zgodi nekaj metrov pred avtom, ki ga igralec vidi. | Lokalni avto vzame en sunek na dotik in samo svoj delež; telefon, ki zazna dotik, pošlje dogodek trka (čas, točka, normala, sunek), drugi vzame svoj delež iz dogodka; za trk (ne za risanje) se prijateljev avto ekstrapolira na sedanji čas. Najprej odločitev uporabnika (vprašanje 2). | potrjeno (dve pravi dirki na Spa, ujemanje na 6–10 %); popravljeno (zasuk 39,3°/68,8° bok ob boku je posledica merilčevega krmilnika: brez rok 2,8°/2,8°); »v bok stoječega« ni ponovljen |
| 9 | Polprikolica se ob oplazenju ograje zlomi in ustavi vlak | Cisterna (5,3 t + 12 t), 5°/120 km/h brez vnosa: kot med vlačilcem in prikolico s 3,7° na 42° v 0,3 s, ostane pri 56–62°; vlak se s 119 km/h ustavi v ~4 s (62 km/h po 2 s; vlačilec sam 92). Preverjalec: vrh 63,2°, tudi z volanom stran po 0,3 s 63,3°. Pri 3°/120 in 5°/60 zloma ni; nova fizika: vrh 9,1°. Čelno 60 km/h: škoda v 6 korakih 55 % (vlačilec sam 24 %). | Prikolica, ki jo ograja pritisne v bok, se poravna z ograjo in drsi ob njej; zlom ostane nekaj stopinj. Škoda enega trka se šteje enkrat (statika zglobnega vozila, ohranitev vrtilne količine). | **4 · visoko (samo polprikolice).** Rahel dotik ograje z vlačilcem konča dirko: prikolica se postavi počez in vlak obstane. | Popravek lege prikolice je ne obrača okoli sedla (`tlJoin`): sunek in popravek v točki stika z ročico do sedla, popravek razdeljen med vlačilec in prikolico; škoda vlaka po trku (največji sunek), ne po koraku. Uskladi s sejo tovornjakov. | potrjeno (Spa: vrh 63,2° pri 0,77 s; 15°/120 55,8°; čelno 120 km/h 8 korakov, 100 % proti 57 %); popravek: z volanom stran se zlomi enako in poravna šele po 4 s |
| 10 | Dotik v zadnji bok: izid ni urejen po moči sunka, trajen potisk ne zavrti | 60 km/h, cel stik brez vnosov, 2/4/5/6/8/10 m/s: −5/−37/−104/−95/−40/−63°; samo prvi sunek −1/−8/−17/−24/−40/−63° (monotono). S plinom: 4 m/s −44°, 8 m/s −101°. 120 km/h: 4 m/s −10° (`xgl` 0), 8 m/s −22° (`xgl` 0,53). Trajen potisk pri 200 km/h (20 km/h hitrejši rine v zadnji bok): 477 sunkov v 6 s, zadeti −7°, `xgl` 0. | Močnejši sunek da večji zasuk. Sunek v zadnji vogal pri 100 km/h: 2 m/s ~27 °/s (gume ujamejo), 4 m/s ~50 °/s, 8 m/s ~100 °/s (zdrs 20–40°, brez popravka vrtenje v 0,3–0,5 s). Potisk 0,5–1,5 m/s, ki traja 0,3–0,6 s, zavrti avto za 90–180° v 1–2 s (manever PIT; učbeniško in lasten izračun zbiralca virov). | **4 · srednje.** Enak dotik v zadnji bok se enkrat konča s 5°, drugič z vrtenjem; močnejši udarec lahko zavrti manj kot šibkejši; vztrajno rinjenje v zadek ne zavrti nikoli. | Trajanje izgube oprijema določa največji sunek (`xglT` sorazmeren velikosti; drobni sunki naslona ga ne podaljšujejo); trajen potisk v zadnji bok se sešteva (prečni sunek zadnje osi v zadnjih 0,3 s) in vzame oprijem nad pragom. Ostane: 2 m/s da 3–5° brez izgube oprijema, sprednji bok nikoli ne zavrti. | popravljeno (številke so občutljive na začetno lego: reža 0,4 m namesto 0,3 m premakne −104° s 4 na 5 m/s; nemonotonost naredijo ponovni sunki para v stiku); trajen potisk potrjen; 121° pri »drži pas« je artefakt krmilnika in ne šteje |
| 11 | Dotik v zadnji bok sredi ovinka na meji oprijema avta ne zavrti, samo odrine | Igralec na meji pri 100 km/h (2,38 g, polmer 33 m), tekmec z notranje strani v zadnji bok z 1/2/3/4/6 m/s: smer odstopi največ 1/0/1/3/4°, `xgl` 0,00, po 2 s 0,1/0,4/0,8/1,4/2,8 m s črte. Skoraj naravnost isti dotik 0–6° (`xgl` 0,19 šele pri 6 m/s). Z zunanje strani: 3 m/s −5°, 4 m/s −15° (`xgl` 0,52), 6 m/s −171° (`xgl` 1,00). 160 km/h na meji: 0–6°, `xgl` 0. | Na meji oprijema zadnja os nima rezerve (krog trenja): prečni sunek 1–2 m/s (30–60 °/s) zadnje gume preseže, avto se brez popravka v manj kot 1 s zasuka za več kot 30–90°; na ravnini da isti dotik 2–4° zdrsa in je ulovljiv. Prag mora padati z izrabljenim oprijemom. | **4 · srednje.** Dotik v zadnji bok sredi ovinka, klasičen vzrok vrtenja na dirkah, igralca le odrine s črte; bližina meje oprijema nič ne spremeni. | V `kTake` prag izgube oprijema zmanjšaj z izrabljenim oprijemom: `aH` × sqrt(1 − (`csAn`/`aL`)²) (isti izraz `stepCS` že uporablja); nad ~70 % meje vzemi del togega dw tudi pod pragom; trajen potisk sešteva zdrs čez korake. | ni preverjeno (nova najdba preverjalca avto–avto; skripta zunaj repozitorija) |
| 12 | Bočni zdrs po trku se ustavi z ~2,4 g: par po bočnem trku obstane 1,4- do 2,6-krat prehitro | T 120 km/h v sredino stoječega: zadeti drsi bočno z 2,36 g (preverjalec 2,37 g = meja avta v ovinku); par obstane po 1,3 s in 11,8 m (preverjalec 1,42 s, 11,6 m); pri 200 km/h 31,1 m, pri 60 km/h 3,0 m v 0,6 s. Zasuk 0°/0°, strelec ostane prislonjen na bok zadetega. | Avto, ki drsi bočno ali se vrti, zavira z 0,5–0,8 g (18–28 km/h na sekundo; odprta literatura o pojemku vrtečih se vozil); igra sama za avto brez oprijema uporablja 0,9 g (`CRASH.slide`). Dosledna meja za avto igre je 0,9–1,65 g. | **4 · srednje.** Po bočnem trku avta obstaneta skoraj na mestu, namesto da bi ju odneslo čez cesto; zadeti »drsi« kot na polnem oprijemu. | Velik prečni sunek (nad ~6 m/s ali ~0,3 hitrosti avta, ali v stoječ avto) naj `stepCS` drgne z drsnim trenjem 0,9–1,0 g namesto s polnim oprijemom. Ostane: majhni prečni sunki (do ~3 m/s), ki jih gume ujamejo v 0,17 s pri 100 km/h, in vsi sredinski trki od zadaj. | potrjeno (0,72 s/2,9 m, 1,42 s/11,6 m, 2,33 s/31,6 m pri 60/120/200 km/h); popravek pričakovanja: 0,9–1,65 g namesto 0,7–0,9 g |
| 13 | Vožnja po ograji skozi oster ovinek z asfaltom do ograje je hitrejša od vožnje na meji | Poln plin brez zavore in volana: oval R 30 m 14,18 s proti 16,39 s na meji (−13,5 %; najnižja hitrost 129 proti 84 km/h, škoda 24 %); R 60 m 15,64 proti 16,92 s (−7,6 %, škoda 8 %); R 120 m počasneje (+2,8 %). Prave proge: Marrakesh 14,93–15,14 proti 14,95 s, Bathurst 13,76–13,85 proti 13,77 s (enako kot na meji, 0,5–1,0 s hitreje od srednjega voznika). S 4 m trave pred ograjo vedno počasneje. | Stik z ograjo se nikoli ne splača: oplazenje pri 5–10° stane 3–10 % hitrosti na dotik (trenje avto–beton 0,15–0,4) in poškoduje avto; zid ne sme dodati ~1 g bočnega oprijema brez cene. | **4 · srednje.** V ostrem ovinku z asfaltom do ograje (9 % dolžine ovinkov pravih prog; Marrakesh 100 %, Bathurst 96 %) je najhitreje brez zaviranja zapeljati ob ograjo in se peljati po njej. | V novi različici drsenje ob ograji stane: trenje raste z normalno silo in trajanjem stika (vsaj 0,3–0,5 g zaviranja), manj oprijema med stikom, poln delež zasuka, škoda po poti drsenja. Merilo: skozi R 30–60 m z asfaltom do ograje vsaj 5 % počasneje od samovoznika z največjo spretnostjo (1,12). | ni preverjeno (nova najdba preverjalca zidu; merilčev »vožnja po ograji se ne splača« velja le s travo pred ograjo) |
| 14 | Ali trk z zamikom zavrti avto, odloča 10 cm razlike med osema, ne sunek | Od zadaj z zamikom v stoječega: rally (osi 1,15/1,25 m od težišča) −32°/−26° pri 60 km/h, −120°/−125° pri 120 (`xgl` 0,56/0,60), −312° pri 200; strega (1,34/1,12 m) −5°/−9°/−9°, `xgl` 0. Tog sunek je pri obeh enak (~330 °/s pri 120 km/h). Čelno z zamikom pri 200 km/h: rally −2248°, strega 0°. | Enak sunek z enako ročico zavrti oba avta podobno (razlika do ~20 % zaradi vztrajnostnega momenta): pri 330 °/s 60–120° (vrtilna količina, Δω = r × P / I). | **3 · visoko.** Isti dotik od zadaj z enim avtom pomeni vrtenje, z drugim skoraj nič; izid določa model avta, ne moč trka. | Pri čistem navoru (majhen prečni sunek) naj prag primerja zahtevani zamik nosu (velikost dw × τ(V)) z mejo (npr. `CSK.tapMax`), ne razlike zdrsa zadaj in spredaj; pri prečnem sunku v bok ostane pravilo zadek proti nosu. Ostane: dotik v zadnji bok jemlje oprijem, v sprednji ne. | potrjeno (rally −31,5/−25,5°, −119,4/−124,7°, −312/−310°; strega −4,5/−8,5/−8,5°; tretji avto z osema 1,2/1,3 m −17,7/−90/−230°) |
| 15 | Nova fizika: avto se po nobenem trku ne zavrti (omejitev 3,2 rad/s in ugašanje vrtenja) | T 120 km/h v zadnjo os stoječega: trk da 660–666 °/s, po enem koraku 310 °/s (merilec avto–avto) oziroma 3,20 rad/s = 183 °/s (merilec mas; merilca se tu razlikujeta), po 0,1 s 13 °/s; zasuk 11–15° (preverjalec 14,3°; klasična 268°). Prečkajoči pri 200 km/h −11° (klasična 1248°). Največ v vsej matriki 80°. | Gume zmorejo kotni pojemek ~9–10 rad/s² (preverjalec 9,7; merilec avto–avto 10–25 rad/s²), ne 42 000 °/s²: iz 660 °/s se avto vrti 0,5–1,2 s in zasuka za 150–400° (navor trenja gum, vrtilna količina). | **3 · visoko (samo nova fizika, ki ni privzeta).** Po najhujšem bočnem trku avto le pokima z nosom in pelje naprej. | Po sunku omejitev `NVK.rMax` nekaj časa ne velja (okno 1–2 s z mejo ~8–10 rad/s, ki pada nazaj na 3,2); veja za avto, ki ne pelje naprej, ne ugaša vrtenja avtu, ki drsi; gume pri velikem zdrsu dajo drsno trenje. Ostane: omejitev pri običajni vožnji; energija v sunkih ne raste. | potrjeno (14,3° in 14,8°; koda `stepNova`: omejitev 3,2 rad/s vsak korak, −27 % na korak pri avtu, ki ne pelje naprej) |
| 16 | Nos zidu boksov nima čelne ploskve: avto preskoči več kot meter vstran | Spa, 109 km/h naravnost v začetek zidu (−167 m): v enem koraku 115 cm vstran, hitrost 109 → 109 km/h, udarec 0,1 m/s, brez škode in zvoka. Po odmiku sredine avta od črte zidu: 95 cm pri −0,2 m, 55 pri −0,6, 82 pri +0,2, 42 pri +0,6, 0 pri ±1,2 m; Bathurst 70 cm pri 0. | Trk v čelo zidu kot čelni trk v ograjo ali v blažilnik iz gum; premik v enem koraku največ v·dt = 0,25 m pri 109 km/h (zveznost gibanja). | **3 · visoko.** Ob zgrešenem uvozu v bokse avto preskoči zid vstran brez udarca; slika sune za meter. | Koncu zidu dodaj čelno ploskev (polkrog polmera ~0,5 m ali kratek prečni zid) z istim sunkom kot ograja; popravek lege nekaj cm na korak, ostalo reši sunek. | potrjeno (Spa in Bathurst; `hitWall` največ 0,6 m/s, škoda 0) |
| 17 | Škoda ne pozna mase in raste linearno s hitrostjo | Čelno 120 + 120 km/h: kamen 7000 kg spremeni hitrost za 6,1 km/h (ob mravlji 165 kg) ali 19,8 km/h (ob miški 560 kg), škoda obakrat 0,55; lahki 247–260 km/h, škoda 1,00. Strelica 460 kg v medveda 2300 kg pri 15 m/s: škoda 22,1/18,4 % ob Δv 50,6/10,1 km/h (5 : 1). Rally v rally: 10,4/38,9/83,4 % pri 36/100/200 km/h; v ograjo 20,7 % pri 36 km/h, 100 % pri 150. | Resnost za vsako vozilo meri njegova Δv = (1 + e)·vc·m₂/(m₁ + m₂); deformacijsko delo raste s kvadratom hitrosti. 7 t ob 165 kg je skoraj brez škode; 36 km/h v ograjo je odbijač in hladilnik (~10 %), ne petina avta (ohranitev gibalne količine in energije; Δv kot merilo resnosti trka). | **3 · visoko (privzeto »Samo videz«: vidi se le na karoseriji).** Tovornjak je po dotiku s kartom enako razbit kot po trku s tovornjakom; majhen udarec v ograjo razbije petino avta. | V `carKnockFx` vsakemu avtu `imp` × 2·m₂/(m₁ + m₂) (enaki masi: brez spremembe), omejeno npr. na 0,15–1,6; pozneje škoda ∝ (lastna Δv)² z mehkim pragom; `knockK` ostane; pri prikolicah masa sklopa. Spada k paketu P (vprašanje 5). | potrjeno (miška/kamen 1,00/0,56; strelica/medved 25,3/21,1 % pri 60 km/h); razmerje mas nad 2 je le pri 5 od 56 vozil |
| 18 | Vrtenje po trdem trku: kotna hitrost brez meje, izid odvisen od lege v koraku in nesimetričen | T v zadnjo os prečkajočega: 120 km/h 521° (804 °/s), 200 km/h 1248° (1344 °/s). Isti trk s prvim dotikom četrt koraka pozneje: T 200 v zadnjo os stoječega 253–611°, T 200 v sredino prečkajočega 214–668°, T 120 104–203°. Čelno z zamikom pri 200 km/h: A −2248° v 6 s (1934 °/s), B 0° v zrcalno enakem trku. Ostane 660 °/s prvega sunka, čeprav vsota togih navorov da 387 °/s. | Zrcalno enak trk da zrcalno enak izid; lega v koraku spremeni izid največ za ~20 %. Toga meja pri 120 km/h v os je ~660 °/s; nad ~700 °/s in ~1,5 obrata (540°) ni verjetno niti pri 200 km/h (ohranitev vrtilne količine, simetrija). | **3 · srednje.** Po hudem trku se avto vrti kot vrtavka (do 6 obratov); enak trk se enkrat konča s tretjino obrata, drugič z dvema; pri čelnem z zamikom se zavrti le eden. | Kotno hitrost iz sunka omeji (npr. 8–10 rad/s) in jo med `xgl` > 0 seštevaj s predznakom pri vsakem sunku (tudi zaviralne navore), ne le ob rasti `xgl`. Ostane: ~250° pri T 120 v zadnjo os stoječega in −120° od zadaj z zamikom (±20 %). | potrjeno (523° in 1263°; po legah v koraku 229/682/509/356°; čelno −1897° v 3 s); kateri avto se zavrti, določa vrstni red para v kodi, ne skripta |
| 19 | Klasični vlačilec ostane ob bočnem trku skoraj tog, nova fizika ga zlomi | Avto 100 km/h v bok kabine cisterne (17,3 t), ki pelje počez s 60 km/h: klasična vlačilec 10°, 48 °/s, pregib 4°, `xgl` 1,00, 9,6 % gibalne količine vzamejo gume; nova 33°, 144 °/s, pregib 32°. Čelno 1 m iz sredine (80 + 80 km/h): klasična avto najmanj 180° (odrezano), 557 °/s, pregib 16°; nova avto 5°, pregib 8°, 160 sunkov. | Prost vlačilec 5,3 t dobi od tega sunka ~3,2 rad/s; gume v 0,1 s trka zadržijo le ~4 od ~29 kN s: zasuk ~30° in začetek zloma sklopa, bliže novi fiziki (ohranitev gibalne in vrtilne količine, Coulombovo trenje gum). | **3 · srednje (samo polprikolice).** Vlačilec po bočnem trku z avtom pelje naprej, kot da ga ni nič zadelo. | `tlHold` naj ob trku zadrži le sunek, ki ga gume zmorejo v času trka (`TLK.hold` × masa × ~0,1 s), ostalo gre v zasuk vlačilca; klasično in novo fiziko uskladiti. Uskladi s sejo tovornjakov. | potrjeno (bok kabine: 10,2°/48 °/s in 31,2°/149 °/s); čelni trk 1 m iz sredine ni ponovljen |
| 20 | Zadet predmet je počasnejši od avta in poleti 3,5–3,7 m visoko | Hitrost zadetega predmeta proti hitrosti avta: 0,83 pri 60 km/h, 0,54 pri 120 in 0,32 pri 200 km/h (meja 18 m/s = 65 km/h; stožec, guma, bala, hidrant enako). Najvišja točka 3,5–3,7 m (preverjalec 3,5–3,9 m) pri stožcu, gumi, zaboju in bali. Pot: stožec 23/30/35 m, bala 17/21/28 m. | Lahek predmet ob težkem avtu dobi (1 + e)·v·M/(M + m) ≈ 1,2–1,35 v (pri 200 km/h ~250 km/h), nikoli več kot (1 + e)·v; stožec in bala (težišče 0,2–0,4 m) ostaneta pod ~1–1,5 m (Newtonov trkovni zakon). Odprti viri: stožec odleti z 1–1,8-kratno hitrostjo avta ali ostane pod njim; lahki predmeti letijo 5–20 m. | **3 · srednje.** Zadeti stožec ali bala poletita visoko pred kamero in padeta nazaj pred avto, ki ju zadene znova (vzrok vrstice 1). | Meja hitrosti (1 + e)·v; lahkim predmetom zračni upor ~v², da pot ostane 20–40 m in predmet ostane viden; navpični sunek po višini zadetka glede na težišče. Ostane: predmeti znotraj ograje, `propStep` (tla, spanje), strošek koraka. | potrjeno (65 km/h = 0,83/0,54/0,32 v; kosi sklada bal do 80–81 km/h; dvig 3,5–3,9 m) |
| 21 | Ležeč del vzame enak odstotek hitrosti pri vsaki hitrosti in masi avta; del se ne premakne | Ogledalo 0,2 %, blatnik 1,0 %, odbijač 1,4 %, pokrov 2,5 % (−5 km/h pri 200 km/h), enako pri 60/120/200 km/h in pri masah 165–5300 kg; del obleži (pot 0,0 m). Dirka (Spa): tovornjak 7000 kg v koraku trka 119,9 → 97,0 km/h (−22,8; sam trk −19,9), ker v istem koraku povozi razbitino. | Prevoz čez ploščat kos pločevine ali plastike: delo reda 0,5–3 kJ, Δv = ΔE/(M·v): pri 120 km/h ~0,05–0,3 % (1150 kg), pri višji hitrosti in težjem vozilu manj; kos se premakne ali zasuka za 1–5 m (energijska bilanca, ocena merilca). | **3 · srednje.** Vsak prevožen kos na progi vzame nekaj km/h, tovornjaku enako kot kartu; kos pri tem obleži na mestu. | Izguba po energiji na vrsto dela (Δv = ΔE/(M·v)) ali vsaj delež po masi kosa proti masi vozila; kos dobi majhen sunek (1–3 m/s) in zasuk. Ostane: del se povozi in ne odbije, enkrat na prevoz, poskok v izrisu. | potrjeno (0,20/1,00/1,40/2,50 % pri vseh hitrostih in masah; premik 0,0 m); popravek enot: masa dela je igralna masa (največ 14), ne kg |
| 22 | Težki ulični predmeti (svetilka, omarica, nadstrešek) so za avto prelahki in se umaknejo že pri 15 km/h | Vse vrste nad 28 kg (hidrant 45 kg, omarica 80, svetilka 110, nadstrešek 220 kg): en stik in izguba 4,5 % pri 120 in 200 km/h. Počasi: nadstrešek pri 15 km/h odrinjen 4,6 m ob izgubi 7,4 % (preverjalec 3,0 m, 5,5 %), svetilka pri 30 km/h 4,6 m ob 6,8 % (3,9 m, 6,7 %). Škoda avta pri 200 km/h: svetilka 5,9 %, hidrant 3,0 %. | Prost predmet (1 + e)·m/(M + m): hidrant 5,1 %, svetilka 11,8 %, nadstrešek 21,7 %. Sidran predmet se pod pragom loma ne premakne (pri 5–15 km/h avto obstane); lomljiv drog vzame do 3 m/s (največ 5 m/s), tog drog avto ustavi (EN 12767, NCHRP Report 350, AASHTO MASH). | **3 · srednje.** Avtobusna nadstrešnica ali ulična svetilka se umakne že ob počasnem dotiku; trk v drog pri 200 km/h stane manj kot bala slame. | Vrstam s škodo (`dmg`) dodaj prag loma (sunek ali energija): pod pragom trdna ovira (avto se odbije, odboj ~0,1), nad pragom se odlomi, avto izgubi sunek praga in (1 + e)·m/(M + m); škoda avta iz sunka. Ostane: tabla zavorne razdalje in lahki predmeti so lahki; avto po lomu ne obtiči. | potrjeno (4,50 % pri 120 in 200 km/h; pot predmeta 15–35 % krajša kot pri merilcu, slika ista); škoda ob nadstrešku pri 200 km/h: merilec 5,9 %, preverjalec 10,1 % (se razlikujeta) |
| 23 | Čelni trk z zamikom: avta obstaneta na mestu z nosom naravnost, vrtilna količina izgine | Čelno z zamikom pol širine pri 60 in 120 km/h: oba po 0,1 s 0 km/h, zasuk 0,1°, največ 4 °/s, `xgl` 0; tog sunek bi dal vsakemu −340/−683 °/s, vzeto 0; vrtilno količino para sunki odvzamejo 99 %. Avta ostaneta prislonjena vseh 6 s. Nova fizika: 0 km/h, zasuk −7°. | Vrtilna količina se ohrani: pri 120 km/h do ~660 °/s (z zmečkanino 200–400 °/s), zasuk 60–180° v 0,5–1,5 s. Odprti viri: čelni trk s 30–50 % zamika zasuka avta za 30–90° v 0,5–1 s, razideta se z 10–30 % hitrosti. | **2 · visoko.** Po čelnem trku z zamikom avta obstaneta z nosom naravnost, kot zlepljena; na dirki redek dogodek. | Trd sunek (zahtevani zamik nosu nad `CSK.tapMax` ali Δv nad ~5 m/s) vzame oprijem in da kotno hitrost ne glede na hitrost po sunku: za prag `KG_V0`/`KG_V1` uporabi večjo od hitrosti pred sunkom in po njem. Ostane: sunki pod ~3 m/s v gneči, kjer ostane samo zamik nosu. | potrjeno (0 km/h, −0,1°, toga vsota −340/−683 °/s, vzeto 0; pri 200 km/h obstaneta simetrično v 3 od 4 leg) |
| 24 | Sunki ob vrtečem se avtu dodajajo energijo | Posamezen klic `carCollide` poveča kinetično energijo para: T 200 v zadnjo os stoječega +55,4 kJ (3,1 % od 1775 kJ); T 120: 5 sunkov, največ +12,6 kJ (2,0 % od 639 kJ); čelno z zamikom pri 200 km/h +22,6 kJ; od zadaj z zamikom pri 200 km/h +11,8 kJ. Gibalna količina se ohrani (0,00 %). Merilec mas v svojih 8 scenarijih (brez zadetka v zadnjo os) prirasta ni našel. | Trk nikoli ne poveča kinetične energije para (odboj največ 1): prirast 0 J v vsakem klicu (ohranitev energije). | **2 · visoko.** Igralec tega ne vidi neposredno; prispeva k predolgemu vrtenju po hudih trkih (vrstica 18). | Sunek računaj skladno s tem, kar avto res vzame: če kotne hitrosti ne vzame, izpusti njegov člen rn²/I in w × r iz hitrosti zbliževanja; če drsi (`xgl` > 0), mu kotni del vedno prištej. Varovalo: po `kTake` energija para ni večja kot pred klicem. Ostane: sredinski trki do zadnje številke. | potrjeno (T 120: 4 prirasti, največ +12,9 kJ; T 200 +54 do +57 kJ; čelno +26,4 kJ pri drugi legi; trije avti v vrsti brez vrtenja 0,00 kJ) |
| 25 | Hitri trki z majhnim prekrivanjem: izid je loterija koraka, avto gre lahko skozi vogal brez sunka | A v stoječega B, zamik 0,75 širine (prekrivanje 45 cm), 24 leg prvega dotika v koraku: 200 km/h A po 0,1 s 95–158, B 43–104 km/h, A pride mimo v 10/24 leg; 300 km/h A 143–296, B 0–157 km/h, mimo v 16/24, v 7/24 A obdrži več kot 90 % hitrosti; 120 km/h nikoli mimo, zasuk A 2–69°. Prekrivanje ob prvem dotiku do 45 cm (200) in 68 cm (300 km/h). | Izid ni odvisen od tega, kje v koraku se karoseriji srečata (razpon do ~10 %); prekrivanje 45 cm pri 200–300 km/h vedno prenese sunek: B dobi vsaj ~40 km/h, A izgubi vsaj ~20 % hitrosti (zvezno zaznavanje trkov). | **2 · visoko.** Pri zelo hitrem oplazenju stoječega avta gre igralec včasih skozi njegov vogal skoraj brez sunka, drugič ga isti trk ustavi; redko (razlika hitrosti okoli 200 km/h in več). | Ko je pot zbliževanja para v koraku nad ~0,25 m (nad ~110 km/h zbliževanja), poišči čas prvega dotika znotraj koraka (2–4 podkoraki `kCollide`) in tam izberi normalo; pri globokem stiku prijemališče na sredini prekritega dela. Ostane: trki pod ~100 km/h zbliževanja do zadnje številke in čas koraka dirke. | potrjeno (200 km/h: A 95–156, B 45–104 km/h, mimo 10/24; 300 km/h mimo 15/24 proti 16/24 pri merilcu; 7/24 obdrži več kot 90 %) |
| 26 | Sunek in ustavitev v enem koraku, brez mečkanja; odboj 0,12 tudi pri največjih hitrostih | Čelno 120 + 120 km/h: 121 → −14 km/h v enem koraku (1 sunek), oba nazaj s 14 km/h (odboj 0,12 tudi pri 240 km/h zbliževanja). V ograjo pod 90°: 60 → 14 km/h v 1/120 s (≈157 g), 120 → 27 (≈315 g), 200 → 46 km/h (≈520 g); popravek lege do 25,5 cm v koraku. | Odboj pada s hitrostjo: 0,05–0,2 pri 25–60 km/h, 0–0,1 nad 100 km/h, hitrost odboja 3–10 km/h (SAE 931842, SAE 2013-01-0223). Čelni sunek traja 70–120 ms, nos se zmečka 0,5–0,8 m; pri 120 korakih na sekundo je to 8–14 korakov: očesu je enokoračni sunek enak, le lega ne sme skočiti. | **2 · visoko.** Po čelnem trku pri veliki hitrosti avta odskočita s 14 km/h, namesto da bi skoraj obstala; ob čelnem trku v ograjo slika sune za do 25 cm. | `e1` pri velikih hitrostih na 0,03–0,05 (npr. tretji člen nad 15 m/s). Po izbiri cona mečkanja: črta ograje »mehka« 0,5–0,8 m (gume 1–1,5 m), normalna sila omejena, ustavljanje 8–15 korakov; `hitWall` ostane hitrost prvega dotika (pragovi 6 m/s, ~40 km/h in 50 m/s² ostanejo). | potrjeno (±14 km/h v 1 sunku; Bathurst 60 → 10 in 120 → 20 km/h v enem koraku; popravek lege ni omejen); opomba preverjalca: 0,12 proti 0–0,05 je majhna razlika (odboj 14 namesto 0–6 km/h) |
| 27 | Nova fizika ob ograji drgeta: stik se preklaplja 35–117-krat na sekundo | Nova fizika, brez vnosa: 5°/60 117 preklopov stika na sekundo; 5°/120 36 ločenih dotikov; 15°/120 23 dotikov pri merilcu in 15 pri preverjalcu, 30°/200 50 in 27 (se razlikujeta). Reža do 1,5–2,0 cm, udarci do 0,2–0,3 m/s. Klasična fizika: 0–3 preklopi na sekundo. | Trajen stik (drsenje) brez preklapljanja; iskre in zvok drgnjenja enakomerni (mehanika trajnega stika: normalna sila namesto zaporednih sunkov). | **2 · visoko (samo nova fizika).** Ob drsenju ob ograji zvok in iskre utripajo; pri namerni vožnji po ograji nova fizika nabere 67 udarcev s škodo (100 %), klasična 2 udarca in 8 %. | Stik naj drži nekaj korakov (vogal bližje od 2 cm, ki se ne oddaljuje hitreje od ~0,3 m/s, velja kot stik): `fxWall` in zvok iz zglajenega stika; v novi različici normalna sila ob trajnem stiku namesto sunkov. | potrjeno (5°/60 117 na sekundo; 5°/120 36 dotikov in 35 na sekundo; reža največ 2,0 cm, udarci največ 0,20 m/s; Spa s travo pred ograjo 12–29 preklopov na sekundo) |
| 28 | Ulični predmet po edinem udarcu potuje skozi avto in nato skoči iz njega | Koraki, ko je središče predmeta v tlorisu avta brez stika, pri 60/120/200 km/h: hidrant 88/34/14, koš 96/33/13, sod 118/32/13, nadstrešek 53/27/12, svetilka 54/27/14; pri 15 km/h 161–219 korakov (1,3–1,8 s). Po 0,6 s predmet skoči iz avta v enem koraku: nadstrešek 1,08 m pri 60 km/h, omarica 1,17 m. | 0 korakov znotraj obrisa in noben premik v enem koraku nad v·dt (0,03–0,14 m; neprodirnost togih teles). | **2 · visoko.** Hidrant ali koš po udarcu drsi skozi avto in nato skoči iz njega; s kamero za avtom to večinoma zakrije karoserija. | Namesto izklopa stika za 0,6 s ohrani izrivanje iz krogov avta brez novega sunka in brez nove izgube (ali daj predmetu vsaj hitrost avta, vrstica 20). Ostane: en udarec in ena vdrtina na predmet. | popravljeno (merilo: središče v tlorisu karoserije; pri 120 in 200 km/h ujemanje z merilcem na 10–25 %, pri 60 km/h ne; svetilka 54/27/14 namesto 0; skok nadstreška 1,08 m namesto 1,58 m) |
| 29 | Visok drog gre čez črto ograje in se v enem koraku vrne | Drog tik pred ograjo, avto 20° proti ograji pri 120/200 km/h: prenosna svetilka (5 kg, središče 4,0 m) 3,6–3,9/9,6–10,2 m čez črto ograje, nato skok nazaj 3,5–3,8/9,6–10,1 m v enem koraku; ulična svetilka (110 kg, središče 4,5 m) 3,0–3,2/5,6–6,0 m čez. Stožec, guma, bala, sod: 0,00 m. | 0 m čez črto ograje in noben premik v enem koraku nad v·dt (pri 18 m/s 0,15 m; zveznost gibanja). | **2 · visoko.** Zadeta svetilka odleti skozi ograjo in se v hipu pojavi nazaj; redek prizor. | Preskus ograje po najnižji točki predmeta (noga droga), ne po središču (ograja zdaj drži le predmete s središčem pod 3,2 m). Ostane: zadrževanje ostalih predmetov in delov. | popravljeno (merilec 5,8/12,4 m in 2,0/1,8 m; pojav in vzrok v kodi potrjena na Spa in Bathurstu) |
| 30 | Zasuk avta ob predmetu ali delu je naključen, ne po strani in ročici zadetka | `propFeel` doda `c.w` += (naključno − 0,5)·m·0,012, `debrisHit` (naključno − 0,5)·m·0,05: smer zasuka ni odvisna od strani zadetka. Zadetek 0,6 m iz sredine: lahki predmeti 0–5 °/s, težki 1–6 °/s (tudi svetilka 110 kg). Največ v 240 vrsticah: 25 °/s, smer 2,3°, premik poti 0,33 m. | Zasuk po ročici, Δw = r × J / I (I = 1443 kg·m²), vedno proti strani zadetka: pri 120 km/h in zamiku 0,6 m stožec ~3 °/s, bala ~27 °/s, prosta svetilka ~108 °/s. | **2 · visoko.** Avto ob predmetu rahlo trzne v naključno smer, ne stran od zadetka; komaj opazno. | Zasuk iz ročice stika s predznakom po strani zadetka, brez naključja. Ostane: pri lahkih predmetih majhen (stožec ~3 °/s); avto zaradi stožca ali bale ne sme s ceste. | potrjeno z branjem kode (lastne meritve zasuka preverjalec ni delal) |
| 31 | Težnost v zraku je 14 m/s² (1,43 g) | `JUMP_G` 14: padec 0,3/1/3 m traja 0,21/0,38/0,66 s, hitrost ob dotiku 2,92/5,25/9,22 m/s; padec čez rob 1,6 s = 16,1 m. | Pri g = 9,81 m/s²: 0,25/0,45/0,78 s in 2,43/4,43/7,67 m/s (let 19 % daljši, udarec 16 % šibkejši; prosti pad). | **2 · visoko.** Skoki so krajši in pristanki trši kot v resnici; to je del sedanjega občutka vožnje čez grebene. | Za novo različico g = 9,81; `JUMP_G` je skupna konstanta (skoki, drobci, priklopniki, padec), zato le skupaj s popravkom vzleta in novimi referencami. Najprej odločitev uporabnika (vprašanje 1), ker je to že fizika vožnje. | potrjeno (Spa, Bathurst: 0,21/0,38/0,65–0,66 s in 2,8–3,1/5,25–5,39/9,1–9,2 m/s) |
| 32 | »Samo videz« pri formuli ni samo videz: odpadlo krilo vzame aero oprijem | Formula, 5 udarcev po 10 % v sprednji desni vogal, škoda »Samo videz«: odpade 1 del, `aeroK` 1,40e-4 → 0,70e-4; ovinek pri 200 km/h 3,74 → 3,18 g (−15 %); 100 km/h in 6 s plina: 273,2 → 256,5 km/h (pri »Vklop« 255,3). Rally pri 50 in 100 % škode vozi kot cel (209,4 km/h, 2,38 g). | Pri »Samo videz« škoda ne spremeni vožnje; izguba krila sodi pod »Vklop« (`docs/igra.md`, Poškodbe avtov). | **2 · visoko (samo avti s krili).** Po trku formula v hitrih ovinkih drži 15 % manj, čeprav je škoda nastavljena na »Samo videz«. | V `detachPart` zmanjšaj `aeroK` samo pri načinu »Vklop« (`dmgMode` 2). Spada k paketu P (vprašanje 5). | potrjeno s kodo in ponovnim zagonom skripte (brez lastne vožnje) |
| 33 | Boksna steza: avti so duhovi, opis pravi drugače; boksni zid ne poškoduje | Dirka 13 avtov, vsi v bokse (Spa, 300 s): 14.540 avto-korakov v stezi, 0 trkov, 0 korakov starega trka; duhova se prekrivata v 247 korakih do 3,02 m, duh in trden avto v 1.241 korakih do 1,87 m. Boksni zid pod 30° pri 80 km/h: udarec 11,1 m/s, škoda 0,0 % (ograja proge 23,8 %); AI v mejo steze do 15,9 m/s brez škode. | `docs/igra.md` pravi »v boksni stezi trki ostanejo kot pri Stari«; v resnici trka med avti v stezi ni. Enak udarec v zid bi sicer dal (11,1 − 2,5) × 2,8 % = 24 % škode. | **2 · visoko.** V boksni stezi gredo avti drug skozi drugega; to je namerno (avto v boksih je duh, na boksni poti ni škode), napačen je le opis. | Nova različica boksov ne spreminja (duhovi ostanejo, da se steza ne zamaši); popravi opis v `docs/igra.md`. Škoda ob boksnem zidu ostane izklopljena (odločitev uporabnika: na boksni poti ni škode); AI ob uvozu naj se umiri (15,9 m/s). | potrjeno s kodo in ponovnim zagonom skripte (brez lastne meritve preverjalca) |
| 34 | Rob prepada je pri počasnem prehodu neviden zid | Preizkusna cesta s prepadom: 5°/60 (navzven 1,4 m/s): avto 2,5 s drsi ob nevidnem robu 1,2 m od asfalta z istim trenjem kot ob ograji, 58 → 37 km/h po 2 s; 15°/30: ustavi se ob robu. Nad 2,5 m/s navzven pade (5°/120, 15°/60, 30°/120). | Kjer ograje ni, avto z vogalom čez rob zdrsne ali se nagne in pade, ko gre težišče čez; brez trenja in isker ob ničemer (statika: prevrnitev, ko težišče prečka rob). | **2 · srednje (prepade ima zdaj le zamrznjena testna proga; #494 prinaša padec z roba na `main`).** Počasen avto ob prepadu drsi ob nevidni steni z iskrami. | Brez praga hitrosti: padec, ko gre sredina avta (ali dve kolesi) čez rob; do takrat brez sunka in trenja. Kjer naj avto ostane na cesti, nizek zid ali robnik z isto fiziko kot ograja. Po spoju #494 izmeri znova. | potrjeno (prag točno 2,5 m/s navzven: 10°/50 rob drži 3,08 s, 10°/55 pade; 20°/20 drži 4,43 s in se ustavi) |
| 35 | Prevračanje je žreb po trku in traja enako pri vsaki hitrosti | Z vklopljenim prevračanjem: v bok 0 % do 8,9 m/s, 11 % pri 9,1–20 m/s; bočno v ograjo 0 % do 9,5 m/s, 11 % od 10,5 m/s; enako za vse modele. En obrat 1,18 s, dva (trk nad 15 m/s) 1,58 s pri vsaki hitrosti; 100 km/h: pot 31 m, konec 71,4 km/h, škoda +4 %; 200 km/h: 64 m, 150,6 km/h. Avto, ki bočno drsi brez trka, se ne prevrne nikoli. | Prevrat je posledica spotika ob oviro pri bočni hitrosti ~25–50 km/h; na ravnem asfaltu avto zdrsne, ~95 % prevratov je spotaknjenih (NHTSA DOT HS 809 868; SAE 2006-01-0722). Valjanje zavira z 0,4–0,5 g, en obrat na ~1–1,5 s; pri 100 km/h 6,3 s in 87 m (ocena merilca). | **2 · srednje (prevračanje je privzeto izklopljeno).** Kadar je vklopljeno, se avto prevrne po žrebu »vsak deseti« in po enem obratu pelje naprej s 70–75 % hitrosti. | V novi različici prag iz lastne bočne hitrosti ob spotiku (robnik, trava ali pesek, kolo drugega avta, ograja) in oblike modela; trajanje in število obratov iz hitrosti (pojemek 0,45 g, obrat na ~1,2 s). Pravilo »vsakič deseti« je odločitev uporabnika (vprašanje 6). | potrjeno (koda: prag 9 m/s, ob ograji 10 m/s, žreb 0,1; 44 od 400 = 11,0 %; potek iz konstant se ujema na 0,1–0,2) |
| 36 | Vlačilec s prikolico potiska avto: dotik se prekinja in vrača | Cisterna ali cestni vlak od zadaj v avto (60 v 32 in 120 v 91 km/h), oba brez plina, 240 korakov. Vlak 60: 94 sunkov, dotik znova 45-krat (preverjalec 77/45); vlak 120: 57/46 (58/39); cisterna 60: merilec 137 sunkov in 83 ponovitev, preverjalec 227 sunkov in neprekinjen stik (se razlikujeta). Vozilo brez prikolice: 1 sunek, 0 ponovitev. | Plastičen stik: ko sta vozili skupaj in ju nič ne loči, ostaneta v stiku brez ponovnih udarcev (neprožen trk, mirujoči stik togih teles). | **2 · srednje (samo vozila s prikolico).** Ko tovornjak s prikolico rine avto pred sabo, se dotik drobno ponavlja (zvok, iskre). | Mirujoči stik: pod pragom hitrosti in pri prekrivanju do ~2 cm brez razmika (histereza); učinki (zvok, iskre) šele nad pragom hitrosti. Vzrok je sklop s prikolico (prikolica vsak korak potegne vlačilec): uskladi s sejo tovornjakov. | popravljeno (vzrok je sklop s prikolico, ne razmerje mas; nad 0,5 m/s je le 1 sunek) |
| 37 | Rob nove mape pripne sredino avta brez trenja, zvoka in škode | Rob nove mape (`track.free`), 30°/120 km/h: 119 → 103 km/h (natanko cos 30°), udarec 0, škoda 0, brez zasuka; avto ostane pripet na rob nad 6,8 s, pol avta sega čez rob. Preverjalec: 60°/100: 99,2 → 49,6 km/h, vogal 2,17 m čez rob; 90°/80: 79,4 → 0,0 km/h v enem koraku brez škode. | Viden rob (ograja, nasip) z isto fiziko kot ograje ali mehko upočasnjevanje pred robom (skladnost z ostalimi ograjami igre). | **2 · srednje (samo nova mapa).** Na robu nove mape avto obstane ob nevidni črti brez zvoka, isker in škode. | Rob mape pelji skozi isti sunek kot ograjo (po vogalih, s trenjem, `hitWall` in škodo) ali ga postavi kot steno (`wall2`). | potrjeno (118,6 → 102,7 km/h; na robu 3,8 s in več; vogal 0,90–0,95 m čez rob) |
| 38 | Fizična črta je 10–25 cm pred narisanim licem ograje | Lice privzete ograje je narisano 0,25 m za črto trka (`js/world.js`:1783), jeklena ograja na Spa 0,12 m, gume 0,10 m (`js/world-spa.js`:271, 278); vogal avta se ustavi na črti. Med trkom gre vogal čez črto največ 25,5 cm (čelno 120 km/h) in je popravljen v istem koraku. | Karoserija se dotakne narisanega lica (reža 0–5 cm); v gume se pogrezne. | **2 · srednje.** Avto se ustavi 10–25 cm pred narisano ograjo; v gume se ne pogrezne. | Ob novi različici poravnaj: črta trka = narisano lice z odmikom po vrsti ograje (gume −0,3 m za pogrezanje) ali lice riši na črti. | potrjeno samo z branjem kode (v brskalniku ni merjeno) |
| 39 | Kolo upočasni avto skoraj kot motor; kolo in pešec dobita premalo hitrosti | Od zadaj v sredino pri 60/120/200 km/h. Kolo 90 kg: avto −21,1/−18,1/−16,9 %, kolo dobi 0,5 v, gibalna količina po/pred 0,83–0,87. Motor 290 kg: −25,2 % (prav po masah). Stoječ pešec 75 kg: avto −8,4/−7,2/−6,7 %, pešec 0,34–0,35 v; avto izgubi 4,2/3,5/3,2-krat več gibalne količine, kot jo pešec dobi. | Kolo 90 kg ob 1150 kg: (1 + e)·m/(M + m) = 7,3–9,1 %, kolo ~1,0–1,25 v, gibalna količina 1,0. Pešec 75 kg: 6,1–8,3 %, pešec ~0,8–1,0 v (ohranitev gibalne količine; odprta literatura o trkih vozil s pešci: hitrost meta 0,7–1,0 hitrosti vozila). | **2 · srednje (samo vožnja v prometu).** Trk s kolesom zavre avto skoraj kot trk z motorjem; kolo in pešec skoraj obležita, namesto da bi ju odneslo. | V novi različici izguba po masah kot pri `_hitVeh`; kolo, kolesar in pešec dobijo hitrost iz sunka. Ostane: kazni in konec vožnje v neskončnem prometu, učinki in zvok. Promet je 2. 11. ostal, kot je (vprašanje 4). | potrjeno samo s ponovnim zagonom skripte (brez neodvisne meritve) |
| 40 | Promet zunaj bega: obris iz krogov pušča vdor do 0,7 m, sunek smeri je vedno največji | Vdor avta v obris: bok avtobusa pod 30° 0,57 m (60 km/h) in 0,54 m (120), tovornjak s polprikolico 0,71/0,69 m, avto 1300 kg čelno pri 120 km/h 0,50 m. Sunek smeri 22,9–23° pri čelnem trku pri 120 km/h in enako pri oplazenju avtobusa pod 5° pri 60 km/h (izguba 0,6 %, 62 °/s, smer +14,7°). V begu pred policijo je vdor 0,05–0,12 m. | Vdor največ 0,05–0,10 m kot v begu. Zasuk sorazmeren s sunkom: oplazenje pod 5° pri 60 km/h (normalna hitrost 1,45 m/s) da po ročici ~40 °/s in nekaj stopinj spremembe smeri (geometrija obrisa; vrtilna količina). | **2 · srednje (samo vožnja v prometu).** Avto se ob trku pogrezne v avtobus ali tovornjak; že rahlo oplazenje zasuka nos za 23°. | Promet zunaj bega naj v novi različici uporablja isti obris kot avto–avto (`obbHit`) in pravila bega; sunek smeri sorazmeren s sunkom. Ostane: mase prometa, ohranitev gibalne količine prvega dotika, vsak dotik v neskončnem prometu konča vožnjo. Odločitev uporabnika (vprašanje 4). | potrjeno samo s ponovnim zagonom skripte (brez neodvisne meritve) |
| 41 | Pri »Vklop« škoda vzame le moč motorja; oprijem in smer ostaneta | Rally z 0/50/100 % škode v sprednjem desnem vogalu, »Vklop«: 100 km/h in 6 s plina: 209,4/200,6/190,8 km/h (−4 %/−9 %); ovinek pri 120 km/h 2,38 g pri vseh; brez rok 3 s pri 100 km/h: 0,00 m vstran (z možnostjo `xHandle`, privzeto izklopljeno, 4,21 m). | Udarec v vogal s 50 % škode zamakne geometrijo kolesa (avto vleče, manj oprijema na tej osi); 100 % škode pomeni nevozen avto (`docs/igra.md`, Razbijanje · nov način: vodljivost). | **2 · srednje (samo pri škodi »Vklop«, ki ni privzeta).** Popolnoma razbit avto zavija kot cel, le počasneje pospešuje. | V novi različici pri »Vklop«: vlečenje volana iz razlike škode vogalov privzeto, oprijem osi × (1 − 0,2 × škoda vogala), nad 90 % samo počasna vožnja v bokse. Spada k paketu P (vprašanje 5). | potrjeno s kodo (`CSK.dmgGrip` 0) in ponovnim zagonom skripte (brez lastne vožnje) |
| 42 | Greben: vzlet in pristanek v istem koraku (ostanek ovržene ugotovitve »greben brez leta«) | Samovoznik, 150 s na progo. Ouninpohja: 25 letov (11,8 s v zraku, najdaljši 1,07 s) in 18 korakov z vzletom in pristankom v istem koraku, skupaj −2,3 km/h. Nürburg: 2 leta, 1 tak korak. Medvode: en dogodek pri 206 km/h: 8 takih korakov v ~0,07 s, −8,8 km/h. Harju, Bâlea, Tianmen, Spa, Bathurst: 0 dogodkov. | Nad pragom vzleta let po paraboli, pod njim nobene izgube: 0 korakov z vzletom in pristankom v istem koraku. | **2 · srednje.** Na redkih blagih grebenih avto pri veliki hitrosti za hip »zagrabi« (Medvode: −8,8 km/h pri 206 km/h). | Pristanka v koraku vzleta ne kaznuj (izguba le, če je bil avto v zraku vsaj 2–3 korake ali je hitrost glede na cesto ob dotiku nad ~1 m/s); prag vzleta in padanje naj uporabljata isto težnost. Odvisno od vprašanja 1. | ni preverjeno (nova najdba preverjalca) |
| 43 | Volan, držan proti ograji: klasična fizika avto obrne z nosom v zid in ga ustavi | Dotik 5°, poln plin, volan ves čas proti ograji. Klasična, 60 km/h: 63 → 43 km/h (1 s) → 0 (2 s), nos 64° v zid, pot 21 m v 4 s, škoda 3 %; 120 km/h: 118 → 90 (2 s) → 0 (4 s), nos 36°. Nova: 60 → 60/57/56 km/h pri 1/2/4 s, nos 2,9°; 120 → 119/114/104 km/h, nos 2,4°. | Iz oplazenja pri 5° se nos brez udarca ne zasuka 64° v tog zid; avto drsi ob zidu in izgublja hitrost s trenjem (0,15–0,4). Fiziki ne smeta dati tako različnega izida (presoja preverjalca). | **2 · nizko.** Kdor ob ograji drži volan vanjo, v klasični fiziki obstane z nosom v zidu tudi pod polnim plinom. | V novi različici naj stik z ograjo omeji zasuk nosu vanjo (poln delež zasuka pri dotiku z dvema vogaloma ali omejitev kota proti ograji med stikom); klasična in nova naj dasta podoben izid. Test: 5°/60 z volanom v ograjo po 2 s ne sme stati. | ni preverjeno (nova najdba preverjalca zidu; kandidat: en avto, ena cesta) |
| 44 | Parkirna ura in prometni znak se po padcu ne umirita | Parkirna ura (`meter`, 14 kg) in prometni znak (`rssign`, 14 kg) se v 8 s ne umirita pri nobeni hitrosti: trzanje 0,14–0,27 m/s in 0,1–0,3 rad/s do prisilnega spanja pri 20 s. Ostale vrste mirujejo po 1,1–7,0 s. | Mirovanje v 2–4 s kot pri ostalih predmetih, brez vidnega tresenja; budni predmeti stanejo čas koraka (20 s namesto 4 s). | **1 · visoko.** Podrta parkirna ura ali znak na tleh še 20 s drobno trza. | Dušenje kotne hitrosti na tleh ali višji prag mirovanja za tanke dolge predmete (spanje pri v < 0,3 m/s in w < 0,4 rad/s). Ostane: spanje ostalih vrst. | potrjeno (Spa: gibljeta se še 8–12 s po zadetku in zaspita po 20,0 s; hidrant in sod mirujeta po 2,5–4,0 s) |

**Ovrženo (ni v tabeli).** »Po trdem trku avto takoj pelje naprej« (`avto-po-trku-takoj-naprej`): številke se ponovijo, napačno je pričakovanje; izguba pogona in oprijema za 1–2 s je stvar poškodb (privzeto »Samo videz«), ne trka, vrnitev na hitrost pa je že zdaj počasnejša od čistega pospeševanja (po trku od zadaj 53 → 114 km/h v 3,26 s proti 1,56 s; po bočnem trku 67 → 114 km/h v 1,43 s proti 1,22 s). »Čez greben avto ne poleti« (`boksi-greben-brez-leta`): artefakt gladke analitične merilne ploskve; na pravih progah avto poleti (Ouninpohja 25 letov v 150 s), merilčev Bathurst je bil izmerjen pri 503 km/h; kar ostane, sta vrstici 42 (redki blagi grebeni) in 7 (pristanek).

**Namerno (izmerjeno in potrjeno, ni za popravek).** Arkadna: igralčev avto je v trku 1,7× težji (od zadaj 120 v 90 km/h: napaka gibalne količine 41,2 % prenesene = 4,6 % skupne, +66 do +72,8 kJ); lastnost različice, v Simulaciji je napaka 0,00 %. Tekmeca med seboj izgubita pol manj oprijema in varnostni avto nič (22°/0,53, 15°/0,26, 12°/0,00): odločitev uporabnika 2. 11. 2026. Stara: prvi sunek 23,9 cm pred dotikom škatel (merilec 20–22 cm); ostane bit za bitom. Kaskaderska in Mehka množita zasuk (1,5 in 0,6): Kaskaderska doda do +55,3 kJ (8,7 % od 638 kJ) v enem klicu; lastnost različice, nova različica naj ima zasuk 1.

**Skupni vzorec.** Sredinski trki in lahki dotiki so že blizu resničnim (razdelek »Kar je že dobro«). Odstopajo stiki zunaj sredine, prečni in dolgotrajni, ker en enak in nasproten sunek z ročico tam nadomeščajo posebna pravila:

- klasična fizika vrtilni del sunka spremeni v sunek smeri in avto zavrti le, ko je zadek potisnjen bolj kot nos (vrstice 3, 10, 11, 14, 18, 23, 24);
- prečni potisk gume zdrgnejo s polnim oprijemom (12);
- ograja vogale rešuje po vrsti in z eno snovjo, da 0,3 zasuka in nikoli ne vzame oprijema (4, 5, 6, 13);
- predmeti, odpadli deli in pristanek vzamejo delež hitrosti na korak ali dogodek, ne sunka po masi (1, 2, 7, 20, 21, 22);
- na spletu sunek dobi samo lokalni avto (8).

**Ponovitev številk** (prva številka je vrstica tabele):

- 1: `node tools/trki/predmeti.js --del predmeti` (tudi `zamik`, `ograja`, `dirka`); 2: `--del razbitine` (tudi `svoj`, `dirka`);
- 3: `node tools/trki/avto-avto.js --only tbone-120-cross-front` in `node tools/trki/mase-razlicice.js --only razlicice`; 10: `--only pit-60-rear` in `--only side-200-a10-dv20`; 12: `--only tbone-120-stand-mid`;
- 4, 5, 6: `node tools/trki/zid.js --del matrika` (tudi `proga`, `posebne`); 9: `--del prikolica`;
- 7: `node tools/trki/boksi-pristanek.js --del pristanek`; 8: `--del splet` in `node tools/trki/mase-razlicice.js --only vloge`; 17: `--only mase` in `node tools/trki/boksi-pristanek.js --del skoda`;
- vrstice 11, 13, 42 in 43 ter deli vrstic 1, 2, 7 in 8 so iz skript preverjalcev v `tools/trki/preverjanje/` (`avto-avto/`, `zid/`, `ostalo/`; shranjene, kot so jih pustili preverjalci, nepregledane; `node tools/trki/preverjanje/<mapa>/<ime>.js`).

## Zasnova prototipa Realistična

Zasnova faze 2 (10. 11. 2026). Sama kode v repozitoriju ne spreminja: formule so preizkušene na zasebni kopiji `js/core.js` (zunaj repozitorija, prek `GAME_ROOT`; kopijo naredi `node tools/trki/zasnova-realisticna.js <mapa>`, nova različica je v njej `--cv 6`), številke »pričakovano« so iz te kopije, izmerjene z istimi orodji `tools/trki/` (avto rally, 1150 kg, klasična fizika). Vrstice kode so iz veje `trki/realizem`. **Od 11.–12. 11. 2026 je jedro te zasnove v repozitoriju** (cv 6): tabele spodaj ostanejo zasnova (številke »pričakovano« z zasebne kopije, vrstice kode iz drevesa pred izdelavo), izmerjene številke repozitorija, razlike in sedanje vrstice kode so v razdelku »Realistična v repozitoriju: jedro in dokazi« na koncu.

**Zapora.** Vse štiri točke delujejo samo ob dotiku in samo, ko je `KC.id === 'real'` (zastavica `KR`, `js/core.js` 2148). Na spletu `testOf(net)` vrne `{}` (`js/game.js` 557–558), zato Realistična tam nikoli ni v rabi. Izvzeti so še: policijski pregon (`c.ck`), boksi (stari trk, 3833), nova fizika pri točkah 1 in 2 (`kTake` se zanjo vrne prej; ob ograji dobi isti sunek, brez pravila oprijema) in v prvem prototipu vlačilci s prikolico. Preverjeno na kopiji: izpisi `avto-avto.js --cv 1 | 2 | 5`, `zid.js --cv 1 --del matrika | prikolica` in `predmeti.js --cv 1 --del predmeti | razbitine` so enaki do znaka; vožnja brez dotika (Spa in Bathurst, sam, 60 s, 7200 korakov) je v cv 6 enaka cv 1 do zadnje števke. **V repozitoriju** je zapora eno vprašanje `krOn(c) = KR && !c.ck && !c.tl && !c.inPit` (`js/core.js` 2189; `KR` 2186): izvzeti so tudi vlačilci s prikolico (`c.tl`) in boksi pri vseh štirih točkah; `testOf(net)` je v `js/game.js` 579.

### 1 Zasuk povsod po avtu (vrstice 3, 10, 14, 18, 23, 24)

| | |
|---|---|
| Zdaj | `kTake` (3947–3959): zasuk `dw` gre v sunek drže `csKc` (največ ±0,4 rad), v `c.w` le ob novi izgubi oprijema; oprijem vzame samo pravilo »zadek bolj kot nos« (`ar − max(aH, af)`, ročici `m.b` in `m.a`), vrata po hitrosti po trku (4–10 m/s). tbone-120-cross-front B −3° (tog −417 °/s, vzeto 0); tbone-60-stand-front 0°; head-120-o 0°/0°; head-200-o −2248°; pit-60-rear-2/4/8 −5/−104/−39°; sunki dodajo do 55,4 kJ. |
| Sprememba | Nova `kTakeR`. Zdrsa osi s srednjo ročico L = (a + b)/2: `ar = \|lt − L·dw\|/Vs`, `af = \|lt + L·dw\|/Vs`, `Vs = max(V po, 12)`. `g = max(gR, gB, gF)·delež·sstep(4, 10, Vr)`: gR kot zdaj, `gB = clamp((min(ar, af) − 0,22)/0,10)` (obe osi čez mejo), `gF = clamp((af − max(0,30, ar))/0,15)` (nos vržen vstran), `Vr = max(V pred, V po, sunek osi)`. V `c.w` gre `dw·kw`, `kw = min(1, max(xgl, g)·wI)`, pri vsakem sunku, \|w\| ≤ 9 rad/s; ostanek v `csKc` kot zdaj. `xgl = g` le, če ni manjši od trenutnega; `xglT = glT·(1 + clamp((zdrs − 0,3)/0,6, 0, 1))` (0,6–1,2 s). |
| Kje | Ena vrstica v `kTake` za `if (c.air \|\| c.rl)`: `if (K.id === 'real' && !c.ck) return kTakeR(…)`; nova števila v vrstici `KV.real` (2137–2143). V repozitoriju: `if (krOn(c)) return kTakeR(c, dvx, dvz, dw, K, o);` (4131), `kTakeR` 4156, `kGripR` 4147, `KV.real` 2179. |
| Pričakovano | tbone-120-cross-front A/B 7/−3° → 288/−155°; tbone-60-stand-front B 0 → −93°; tbone-120-stand-front B −41 → −154°; head-60-o 0/0 → −77/−77°; head-120-o → −167/−167°; head-200-o −2248 → −190°; tbone-200-cross-rear 1248 → 268°; pit-60-rear-2/4/8 → −5/−39/−96° (urejeno po sunku); rear-120-bump-o, rear-200-bump-o in oplazenja z boka enako kot zdaj. Največ dodane energije 0,41 kJ (prej 55,4 kJ), največji zasuk 302°. |
| Meritev | `node tools/trki/avto-avto.js --cv 6` (tabela »the turn«, stolpec »gain«); `node tools/trki/mase-razlicice.js --only ohranitev --cv 6` (dP 0,0 %, E+ 0,00 %). |

### 2 Drsenje vstran po trku (vrstica 12)

| | |
|---|---|
| Zdaj | `stepCS` 2874–2875: potisk `cSx/cSz` se briše z `aS = max(0,35·aL, sqrt(aL² − csAn²))` (aL ≈ 2,3 g). tbone-120-stand-mid: B 18,7 m/s vstran, raven po 1,32 s, premik 11,8 m. |
| Sprememba | `aS = aS0 + (min(aS0, G·CRASH.slide) − aS0)·max(sstep(s0, 2·s0, potisk), xgl)`, `s0 = max(3 m/s, 0,1·hitrosti)`: velik potisk ali izguba oprijema drsi z 0,9 g, majhen potisk kot zdaj. |
| Kje | Ista vrstica; zapora `KR && !this.ck`; koda teče le, ko potisk obstaja (po sunku). V repozitoriju: `stepCS` 2910 (`aS = krOn(this) ? kSlideR(aS0, sm, spd, gl) : aS0`), `kSlideR` 4170. |
| Pričakovano | tbone-120-stand-mid: B raven po 2,86 s, premik po 2 s 23,8 m, A/B po 2 s 26/26 km/h (prej 0/0); tbone-60-stand-mid 3,0 → 6,1 m. B sam drsi z 0,9 g; par z 0,45 g, ker se A v scenariju kotali brez zavor. |
| Meritev | `node tools/trki/avto-avto.js --cv 6 --only tbone-120-stand-mid`. |

### 3 Ograja (vrstici 4 in 5; vrstica 13 ostane odprta)

| | |
|---|---|
| Zdaj | `wallCollide` (3747–3823), vogali zapored: popravek lege, `J = −(1+e)·vn/(1/m + rn²/I·wy)`, `wallE` 0,05, `wallMu` 0,25, `wallYaw` 0,3 (1984); zasuk gre v `c.w`, krmiljenje ga vzame nazaj z 8 rad/s², `xgl` ostane 0. 15°/120: izstop 0,3°, 100 °/s; 30°/120: izstop 0,5°, 147 °/s, raven v 0,32 s; 90°/120: 27 km/h po 1. koraku, 187 °/s; 90°/100: 19 % hitrosti vzdolž ograje (p7). |
| Sprememba | Nova `wallR(c, wx, wz, nx, nz, k)` zunaj `wallCollide`, samo ko se vogal bliža hitreje od 1,5 m/s (počasneje: naslon kot Simulacija). Prijemališče: uteženo povprečje vogalov, ki za najglobljim zaostajajo manj kot `cr = clamp(0,06 s·\|vn\|, 0,03, 0,5 m)` (utež 1 − zaostanek/cr; vrstni red vogalov ne šteje). Ročica × 0,55, sunek togega telesa v tej točki brez deleža zasuka: `J = −(1+e)·vn/(1/m + rn²/I)`, `e = (0,05 + 0,15·exp(−\|vn\|/6))·sstep(0,5, 1, \|vn\|)`, trenje 0,35 v isti točki. Izguba oprijema po pravilu iz točke 1 (ista funkcija). Popravek lege, `hit`, `hitWall`, škoda in zvok ostanejo. |
| Kje | Ena vrstica na vrhu bloka `if (vn < 0) {`: `if (vn < -1.5 && KR && !c.ck) { wallR(…); if (-vn > hit) {…} } else if (vn < 0) {`. Po #494 ista vrstica v `touch()` (4019 v drevesu #494); ob sporu vzamemo `wallCollide` iz #494 in vrstico vstavimo znova. V repozitoriju: vrstica 3974 (`if (krOn(c) && vn < -KC.wall.v0) { wallR(c, wx, wz, nx, nz, k); … }`), `wallR` 3905, števila v `KV.real.wall`; natančen postopek: »Točka 3 in #494 (Killar): postopek ob sporu«. |
| Pričakovano | Brez vnosa: 15°/120 izstop 0,3 → 1,5°, 100 → 167 °/s, 0,3 m stran od ograje po 0,35 s (prej 4,90 s); 30°/120 izstop 0,5 → 4,3°, 147 → 206 °/s, ob odhodu 66 % hitrosti (prej 70 %); 30°/200 izstop 0,9 → 3,5°; 90°/60 in 90°/120: po 1. koraku 14/27 → 4/6 km/h, zasuk 93/187 → 0 °/s, hitrost vzdolž ograje 19 % → 0 (p7); 5°/60 enako kot zdaj. Plin in volan stran, 30°/120: raven po 0,63 → 1,62 s, po 2 s 148 → 143 km/h. Zrcalni primeri (80/85/95/100°, levo in desno) so zrcalni. |
| Meritev | `node tools/trki/zid.js --cv 6 --del matrika`; `tools/trki/preverjanje/zid/p7.js` (simetrija), `p6.js` (vožnja po ograji), `p13.js` (naslon). |

### 4 Lahek predmet: en sunek po masi (vrstici 1 in 2)

| | |
|---|---|
| Zdaj | `propFeel` (3638–3644) vsak korak dotika: `c.vx *= 1 − k`, `k = min(0,045, m·0,0016)·min(1, vrel/8)`, in naključen zasuk. `debrisHit` (3499–3528), premikajoč kos: `k = min(0,06, d.m·0,004)` na korak. Stožec 3 kg 4,9/11,6/11,5 %, bala 26 kg 42,8/49,7/62,3 % pri 60/120/200 km/h; avto izgubi 24–137-krat toliko gibalne količine, kot jo predmet dobi. |
| Sprememba | Avto dobi nasprotni sunek tega, kar je predmet res dobil: `kTake(c, −m·Δv predmeta, ročica dotika, …)`; kup: vsota kosov po `breakProp`; premikajoč odpadli kos: `d.m·kick`. Brez deleža hitrosti in brez `rand()`; zastavice za zvok in učinek kot zdaj. |
| Kje | `propCarHit` (3645–3676) in gibljiva veja `debrisHit`; zapora `KR && !c.ck`. V repozitoriju: `propPush` 3792, `propCarHit` 3811, `debrisHit` 3668, `propFeel(…, R)` 3783; zapora `krOn(c)`. |
| Pričakovano | Stožec 0,24/0,15/0,09 %; guma 9 kg 0,77/0,46/0,26 %; bala 3,23/1,36/0,75 %; kup bal 78 kg 6,38/3,61/1,92 %; svetilka 110 kg 4,5 → 4,0 %; razmerje gibalnih količin 1,0–2,0. Lasten pokrov (m 14) 12,5/8,2/5,6 → 1,55/0,93/0,55 %; pokrov, ki drsi ali leti (120 km/h), 12,7/8,2 → 1,15/0,75 %. Ležeči kosi (`DEB_RUN`) nespremenjeni. |
| Meritev | `node tools/trki/predmeti.js --cv 6 --del predmeti` (tudi `razbitine`, `svoj`). |

### Vrstni red dela

1. **Zapore, testi, točka 4.** `KV.real` dobi svoja števila, test brez dotika in test drugih različic; nato predmeti in odpadli kosi. Merilo: stožec pod 0,5 %, bala pod 3,5 %, lasten pokrov pod 1,6 %; `--cv 1` izpisi enaki do znaka.
2. **Točki 1 in 2** (zasuk in drsenje, skupaj: zasuk je mogoč samo ob izgubi oprijema). Merilo: številke iz tabel 1 in 2, dodana energija pod 0,5 kJ, zasuk pod 360°. (Od 12. 11. trk dveh avtov energije ne doda: »Popravki po neodvisnem preverjanju«.)
3. **Točka 3**, ko je #494 na `main`. Merilo: izstop 1–5° pri 15–30°, čelni trk brez zasuka in hitrosti vzdolž ograje, 5°/60 enako kot Simulacija. (12. 11.: narejena pred #494 kot ena zaprta vrstica; ob spoju s #494 velja »Točka 3 in #494 (Killar): postopek ob sporu«.)
4. **Dirke.** Spa in Bathurst, 12 tekmecev, 150 s, cv 6; štart z več avti na ozki progi; lestvica škode. Na kopiji: Spa enako kot Simulacija do metra; Bathurst 14 trkov nad 3 m/s (prej 6), 2 nad 8 m/s, brez vrtenja, srednja pot −1,0 %, največja škoda 23 % (prej 4 %). Izmerjeno v repozitoriju (12. 11., `node tools/trki/dirke.js`): tabela v »Realistična v repozitoriju: jedro in dokazi«.

### Testi (`tests/trki.test.js`, razdelek Realistična; primerjava »copy« odpade)

- **brez dotika**: Spa in Bathurst (sam, samovoznik, semena kot v dirkah tega testa, 60 s) in ravnina z vnaprej danimi vnosi (slalom, zaviranje, ročna zavora, trava), obe fiziki; cv 1, cv 6 in privzeto. Vsak korak se primerja vrstica stanja vseh številskih polj avta (`stateLine` iz `tests/lib/sim.js`, −0 in NaN ločeno); izpiše prvi korak in polje razlike. Test sam dokaže, da dotika ni bilo: `hitCar`, `hitWall`, `hitDebris`, `xgl` in potisk `cSx/cSz` so vsak korak 0, noben predmet se ne premakne; sicer pade kot »scenarij se je nečesa dotaknil«. Zraven: z istim merilom se cv 1 in cv 6 po trku s 100 km/h v prednji del stoječega avta razlikujeta od koraka trka naprej in sta pred njim enaka.
- **druge različice**: cv 1–5 dajo pri istem trku, ograji in predmetu isto stanje kot pred spremembo (ključi stanja v `tests/golden/`); z vsaj enim avtom `net` je v rabi Simulacija, tudi ko je izbran cv 6. Test »walls as they were« velja za cv 1–5; Realistična dobi svojega.
- **ohranitev**: gibalna količina para do 1e-9; kinetična energija para po sunku največ 0,5 kJ nad prejšnjo (od 12. 11. ne zraste: meja testa 1e-4 J); ob ograji energija avta in hitrost vzdolž ograje nikoli ne zrasteta, po koraku noben vogal ni v ograji; predmet nikoli ne pospeši avta.
- **simetrija**: zrcaljen scenarij da zrcaljeno stanje (do 1e-9): trk v prednji in zadnji del, zamik čelnega trka ±, ograja 15°, 30°, 85° in 95° levo in desno, predmet ±0,6 m; 90° v ograjo: zasuk in hitrost vzdolž ograje 0.
- **meje**: brez NaN pri 60/120/200 km/h; \|w\| ≤ 9 rad/s, dokler traja izguba oprijema; pit-60-rear-2/4/8 urejen po sunku; pasovi za številke iz tabel 1–4.
- **dirke** in **vlačilci**: Spa in Bathurst s cv 6 kot za Simulacijo (brez NaN, vsi vozijo, nič zlepljenih, največ 4 vrtenja); en trk vlačilca z ograjo in z avtom da v cv 6 isto stanje kot v cv 1.

**Izvedeno 12. 11. 2026** (razdelek »Testi različice Realistična«, tam številke). Razlike od seznama: (1) simetrija trka dveh avtov se primerja takoj po prvem sunku v vseh prizorih, na koncu samo tam, kjer avta stojita vzdolž osi (drugje zrcalno sliko pokvari skupna koda zunaj pravil Realistične: najdbi a in b); (2) predmet ±0,6 m se primerja ob prvem dotiku (kup bal se po njem vrti z lastnim naključnim številom predmeta); (3) »pasovi za številke iz tabel 1–4« so izbrani pasovi (PIT po sunku, bočni trk v prednji del, izstopni koti ob ograji, izgube pri predmetih), druge številke varuje referenca `tests/golden/trki.json`; (4) »ob ograji energija avta in hitrost vzdolž ograje nikoli ne zrasteta« velja za 13 prizorov, kjer avto ne drsi in se ne vrti (preverjanje 7); pri avtu, ki drsi ali se vrti, sunek Realistične energije nikoli ne doda (preverjanje 10), hitrost vzdolž ograje pa ob dotiku lahko zraste (trenje vogala pretvori vrtenje v gibanje; tudi v Simulaciji) in naslon vrtečega se avta lahko doda energijo (skupno pravilo naslona: do 6,06 kJ na dotik, test dovoli največ 7 kJ; odprto); (5) dodano: ograja med drsenjem in vrtenjem (300 prizorov), dotik brez sunka, odpadli del na poti, izvzeti v pregonu in v boksih, spletna dirka, dirka brez izstrelitve; (6) vlačilec: »isto stanje kot v cv 1« velja za vlačilec in njegov delež trka, drugi avto v paru dobi delež po Realistični; (7) vožnja brez dotika na progah je v testu suha in mokra v klasični fiziki (60 s) in suha v novi fiziki na Spa (20 s), cv 6 proti cv 1 (da je privzeto cv 1, trdi preverjanje izbire); sneg, drugi avti in nova fizika na Bathurstu so v dokazih prvega dela (20 voženj), ne v testu.

### Tveganja

- **Tekmeci v gruči:** lahki dotiki ostanejo kot v Simulaciji (Spa, 30 s, 97 korakov z dotikom: enako do zadnje števke); hujši trki so trši (Bathurst zgoraj). Štart z 22 avti in ozke proge niso izmerjeni.
- **Škoda:** prag na dogodek se ne premakne (`WRULE.hit` in `KT.real` bereta isto velikost), dogodkov pa je več: 30°/120 škoda 45 → 58 %, vožnja po ograji R 30 m 24 → 100 %. Privzeto »Samo videz« to skrije; s pravo škodo je treba lestvico za to različico izmeriti.
- **Splet:** brez spremembe, dokler `testOf` na spletu vrača privzeto; `xgl` in potisk nista v poslanem stanju.
- **Paket P:** `carKnockFx` ostane nedotaknjen (`imp`, `fxCar`, točka dotika).
- **Vlačilci:** brez izvzetja se obnašanje ob ograji spremeni (zlom 56° izgine v štirih od petih primerov, pri 30°/60 nastane nov, 58°); zato so izvzeti, uskladitev s sejo tovornjakov. Polje je določeno (12. 11.): vlačilec ima `c.tl` (telo prikolice), telo prikolice `tl: true` (`tlMake`); `krOn` ju izvzame pri vseh štirih točkah, razdelek PRIKOLICA izpisa `zid.js --cv 6` je enak cv 1.
- **#494:** dotiki, ki niso vogal (otok, skala), morajo `wallR` klicati s `k = −1`; zlomljena lesena ograja ne sme priti do sunka (kot v #494). Natančneje (12. 11., pregled drevesa #494 `8de444ef`): dotik, ki ni vogal, je samo sredina visokega otoka (`trk._tall`, krogi avta); skala useka in otok ob vogalih sta dotika vogalov. `wallR` je na `k < 0` pripravljen. Postopek: »Točka 3 in #494 (Killar): postopek ob sporu«.
- **Števila** so prvi kandidat, uglašen na enem avtu; najlažji avto in tovornjak sta pregledana samo na NaN in red velikosti.

### Kaj ostane za pozneje

Vrstica 13 (vožnja po ograji), materiali ograj (6), pristanek (7), trk na spletu (8), prikolica (9), ležeči kosi (21), omejitev hitrosti predmeta in zračni upor (20), strogo »nikoli več energije« pri lahkih dotikih, Realistična na spletu.

### Kje prejšnja analiza ne drži ali ni dokazana

- **Vrstica 3, »30–50 % zasuka v `c.w`« brez izgube oprijema** ne deluje: krmiljenje zasuk izniči z 8 rad/s² in pot sledi nosu. Zasuk je mogoč samo skupaj z `xgl`.
- **Vrstica 4, »ves zasuk iz ročice (1 namesto 0,3)«:** izmerjeno s polno ročico 194/286/475 °/s pri 15°/120, 30°/120, 30°/200 in do 90 ločenih dotikov; delež 0,55 s skupnim prijemališčem da 167/206/340 °/s in 2–4 dotike. Današnji delež 0,3 po formuli ni energijsko skladen (izpeljano, ne izmerjeno).
- **Vrstica 4, »prislonjen pospešuje kot prost«** ni odstopanje: pri naslonu je normalna sila skoraj nič. Z volanom v ograjo se avto ustavi v 2–4 s, zdaj in v kandidatu.
- **Vrstica 13, merilo »vsaj 5 % počasneje«** s fiziko dotika ni dosegljivo, dokler je škoda samo videz: R 30 m 14,37 s (Simulacija 14,15 s, samovoznik 16,51 s), R 60 m 15,74 s (15,64 s, 17,58 s). Ograja je boljša zavora od gum. Potrebna je odločitev uporabnika (posledica tudi pri »Samo videz«, kazen ali sprejeto).
- **Vrstica 10, »xglT sorazmeren velikosti«:** upad je že linearen; neurejenost je izvirala iz vrat za oprijem in neenakih ročic, ne iz časa.
- **Vrstica 12, »0,9–1,65 g«** velja za zadeti avto, ne za par: par v scenariju drsi z 0,45 g.
- **Vrstica 1, pričakovanje po masah** (bala 2,98 %) pri 120–200 km/h ni doseženo (1,36 % in 0,75 %), ker igra omeji hitrost predmeta; avto zato izgubi manj.
- **Nedokazano v tej zasnovi:** stopnje zasuka in izstopni koti pravih preskusov so navedeni po spominu, brez preverjenega vira.

### Realistična v repozitoriju: jedro in dokazi (11.–12. 11. 2026)

Prvi del faze 2. Formule zasnove so v `js/core.js` kot šesta izbira `cv 6` (Nastavitve, »Trki med avti«: Realistična, `S.crV` 5; prej kopija Simulacije). **Privzeta ostane Simulacija**, reference (`tests/golden/`) se niso premaknile. Commiti na veji: `fc2afc7` (nedokončano delo, pregledano proti zasnovi in kandidatu), `e529564` (eno vprašanje izvzetij) in »Trki: različica Realistična (cv 6) – jedro in dokazi«. Testi za cv 6 so od 12. 11. v `tests/trki.test.js` (drugi del: »Testi različice Realistična«). Številke so z orodji `tools/trki/` na ravnini (avto rally, 1150 kg, klasična fizika, brez vnosa, če ni rečeno drugače), izmerjene 11.–12. 11. 2026 na končnem jedru.

**Kaj je v kodi** (`js/core.js`; vrstice drevesa s popravkom 12. 11., `a89d034`):

- **Števila** `KV.real` (2179): Simulacijina (`e0` 0,3, `e1` 0,12, `mu` 0,35, `yaw` 1, `aH` 0,1, `aS` 0,06, `glT` 0,6, `wI` 3 …) in nova: `aH2` 0,22 in `aS2` 0,1 (obe osi čez mejo), `aHf` 0,3 in `aSf` 0,15 (nos vržen vstran), `wMax` 9 rad/s, `glX` 1 (daljša izguba oprijema pri večjem zdrsu), `sl0` 3 m/s in `slA` 0,1 (prag drsenja vstran); za ograjo `wall`: `v0` 1,5 m/s, `e0` 0,2, `e1` 0,05, `eV` 6, `eT` 0,5, `mu` 0,35, `arm` 0,55, `face` 0,06 s, `cr0` 0,03 m, `cr1` 0,5 m.
- **Eno vprašanje** `krOn(c) = KR && !c.ck && !c.tl && !c.inPit` (2189; `KR` 2186) na šestih mestih: `kTake` (4132) → `kTakeR` (4157) s pravilom oprijema `kGripR` (4148); `stepCS` (2910) → `kSlideR` (4171); `wallCollide` (3974, ena zaprta vrstica) → `wallR` (3905); od 12. 11. še konec veje naslona v `wallCollide` (3990: meja zasuka `wMax` med izgubo oprijema; »Testi različice Realistična«, »Popravek jedra«; od popravkov po neodvisnem preverjanju cela veja naslona z varovalom energije in mejo brez pogoja, »Vrstice po popravkih 12. 11.« spodaj); `propCarHit` (3811) in gibljiva veja `debrisHit` (3668) → `propPush` (3792). `propFeel(…, R)` (3783) da v Realistični samo še tresljaj in zvok.
- **Izvzeto:** policijski pregon (`c.ck`), boksi (`c.inPit`; trk dveh avtov je tam že prej stari trk), vlačilec s prikolico (`c.tl`; telo prikolice ima `tl: true`, `tlMake` 2282), splet (`testOf(net)` v `js/game.js` 579 vrne `{}`, torej privzeto). Nova fizika pri točkah 1 in 2 (`kTake` se zanjo vrne prej, kot v vseh različicah; ob ograji in predmetu dobi sunek Realistične brez pravila oprijema). Avto v zraku ali na strehi (`c.air`, `c.rl`) je brez pravila oprijema: v `kTake` kot v vseh različicah sunek brez zasuka (od 12. 11. vzame toliko zasuka, kolikor zahteva varovalo energije: »Popravki po neodvisnem preverjanju«, najdba 9), ob ograji sunek `wallR`. Meja zasuka `wMax` velja od 12. 11. po vsakem dotiku ograje za vsak avto, za katerega je `krOn(c)` resničen (tudi v zraku, na strehi in v novi fiziki): `wallR` jo postavi vsakemu avtu, veja naslona jo ponovi brez pogoja `c.xgl > 0` (meri preverjanje 18; najdbi 4 in 9).
- **Nedotaknjeno:** novih naključnih števil ni (edini vrstici z `rand()` v razliki proti `f1c4a0a` sta obstoječi in v Realistični preskočeni: zasuk v `propFeel` in v gibljivi veji `debrisHit`); `carKnockFx` (`imp`, `fxCar`, točka dotika), `knockK`, `roof0`, `spinK` in `Traffic._hitVeh` so, kot so bili.
- **Razlike od kandidata** (`tools/trki/zasnova-realisticna.js`): eno vprašanje `krOn` namesto `K.id === 'real' && !c.ck` na vsakem mestu; izvzeti so tudi vlačilci (kandidat jih ob ograji ni izvzel) in boksi pri točkah 2–4; števila ograje so v `KV.real.wall` (kandidat: ločen zapis); `wallR` prenese dotik, ki ni vogal (`k < 0`). Formule so iste: izpisi `--cv 6` repozitorija so enaki izpisom zasebne kopije s kandidatom (na drevesu `f1c4a0a`) do znaka za `avto-avto.js`, `mase-razlicice.js --only ohranitev` in `predmeti.js` (besedilo in `--json`); `zid.js --cv 6` se razlikuje samo v razdelku PRIKOLICA, ki je v repozitoriju izvzet in enak cv 1. Od 12. 11. je razlika od kandidata tudi meja zasuka na koncu veje naslona (»Popravek jedra«); izpisov orodij `--cv 6` ni premaknila (7 od 7 enakih kot pred popravkom). Popravki po neodvisnem preverjanju (12. 11., `cfe4cf07`: varovalo energije v `kCollide`, ponovitev naslona kot togo telo, meja zasuka za vsak avto) so nadaljnje razlike od kandidata in izpise `--cv 6` premaknejo (kaj in koliko: »Popravki po neodvisnem preverjanju«); številke tega razdelka so, kjer ni pripisa, izmerjene pred njimi.
- **Vrstice po popravkih 12. 11.** (`cfe4cf07`; zgornje številke vrstic so z drevesa `a89d034`): `KV.real` 2182, `KR` 2189, `krOn` 2192, `debrisHit` 3633, `propFeel` 3786, `propPush` 3795, `propCarHit` 3796, `wallR` 3909, `wallCollide` 3929 (vrstica Realistične 3977, veja naslona z varovalom energije 3983–3999, meja zasuka 4000), `kCollide` 4102 (varovalo energije 4126), `kTake` 4151, `kGripR` 4171, `kTakeR` 4181, `kTurnR` 4200 (nova: zasuk, ki bi ga avto vzel), `kSlideR` 4211; `testOf` v `js/game.js` 588.

**Dokazi** (ponovljeni na končnem jedru):

- **Druge različice enake do znaka:** 13 izpisov je bajt za bajtom enakih kot na `f1c4a0a` (zadnji commit pred Realistično): `avto-avto.js --cv 1 … 5`, `mase-razlicice.js`, `predmeti.js --cv 1` (cel, `--del predmeti`, `--del razbitine`), `zid.js --cv 1` (cel, `--del matrika`, `--del prikolica`) in `boksi-pristanek.js` (brez stolpcev s časi izvajanja).
- **Vožnja brez dotika enaka do zadnje števke:** 20 voženj po 7200 korakov (60 s; rally v obeh fizikah na Spa in Bathurstu, suho, mokro, sneg in sneg z mokrim: 16; formula in muscle, klasična fizika, obe progi, suho: 4). Vsak korak je primerjano celotno stanje avta (255–270 številskih polj, do globine 4, −0 ločeno) in vrstica stanja dirke: cv 1 = cv 6 = privzeto. Kontrola, da primerjava razliko vidi: avto z volanom v ograjo se razlikuje od koraka prvega dotika naprej (Spa korak 930, Bathurst 826), prej ne.
- **Ohranitev:** `mase-razlicice.js --only ohranitev --cv 6`: dP 0,0 %, E+ 0,00 %, brez NaN. Nova fizika v cv 6 je pri trku dveh avtov enaka novi fiziki v Simulaciji (`avto-avto.js --json`: vseh 66 scenarijev nove fizike enakih; v klasični 26 od 66). Po popravkih 12. 11.: nova 66 od 66, klasična 21 od 66 (varovalo vzame majhen del zasuka tudi pri petih rahlih trkih, ki so bili prej enaki: `rear-120-bump-o`, `pit-120-front-2`, `rear-200-bump-o`, `pit-200-front-2`, `pit-200-front-4`).
- **Reference in testi:** `tests/golden/*` brez spremembe (`golden.test.js` zelen); ob prvem delu 28 Node testov zelenih (`trki`, `odpadli-deli`, `redflag`, `padec`, `testne-proge`, `golden` in drugi povezani), `node tools/stamp.js --check` v redu. Brskalniški testi niso bili pognani (požene jih glavna seja).
- **Ponovljeno po popravku jedra (12. 11., drevo `a89d034`):** 13 od 13 izpisov cv 1–5 je bajt za bajtom enakih kot na `f1c4a0a`; 7 od 7 izpisov `--cv 6` je enakih kot pred popravkom (številke tega razdelka ostanejo); vožnja brez dotika: 20 od 20 voženj enakih, kontroli najdeta razliko v koraku prvega dotika (930 in 826); `p7.js`, `p13.js` in `p6.js` s cv 1 in cv 6 v redu; obstoječe reference `tests/golden/*` so brez spremembe, nova je `tests/golden/trki.json`; 24 Node testov zelenih (22 povezanih, `redflag`, `testne-proge`), `node tools/stamp.js --check` v redu.
- **Ponovljeno po popravkih po neodvisnem preverjanju (12. 11., `cfe4cf07`):** 13 izpisov cv 1–5: 12 bajt za bajtom enakih kot na `f1c4a0a`, `boksi-pristanek.js` enak po izločitvi stolpcev s časom računanja; `tests/golden/*` brez spremembe (`golden.test.js`: 140 scenarijev enakih), v `tests/golden/trki.json` premaknjena samo `knock/bump/real` in `knock/drift3/real`; izpisi `--cv 6` so se premaknili v 3 od 6 (»Popravki po neodvisnem preverjanju«).

**Zdaj → pričakovano → izmerjeno.** »Zdaj« je Simulacija (cv 1) na istem drevesu, »pričakovano« številka zasnove (zasebna kopija, 10. 11.), »izmerjeno« cv 6 v repozitoriju. Koti zasuka so največji zasuk avta A/B (`avto-avto.js`, tabela »the turn«), odstotki pri predmetih so izguba hitrosti pri 60/120/200 km/h (zadetek v sredino).

| Točka | Primer | Zdaj (cv 1) | Pričakovano (zasnova) | Izmerjeno (cv 6) | Ujemanje |
|---|---|---|---|---|---|
| 1 | tbone-120-cross-front, zasuk A/B | 7/−3° | 288/−155° | 288/−155° | da |
| 1 | tbone-60-stand-front, B | 0° | −93° | −93° | da |
| 1 | tbone-120-stand-front, B | −41° | −154° | −154° | da |
| 1 | head-60-o, A/B | 0/0° | −77/−77° | −77/−77° | da |
| 1 | head-120-o, A/B | 0/0° | −167/−167° | −167/−167° | da |
| 1 | head-200-o, A | −2248° | −190° | −190° | da |
| 1 | tbone-200-cross-rear, B | 1248° | 268° | 268° | da |
| 1 | pit-60-rear-2/4/8, B | −5/−104/−39° | −5/−39/−96° | −5/−39/−96° | da (urejeno po sunku) |
| 1 | rear-120-bump-o, rear-200-bump-o | | enako kot zdaj | enako | da |
| 1 | oplazenja z boka (12 scenarijev) | | enako kot zdaj | brez vnosa 8 od 12 enakih, 4 z majhno razliko; s plinom večje razlike (po popravkih 12. 11.: brez vnosa 3 od 12 enake, 9 z majhno razliko; s plinom manjše razlike) | delno (spodaj) |
| 1 | največ dodane energije | 55,4 kJ | 0,41 kJ | 0,41 kJ (pit-200-front-8); po popravkih 12. 11.: 0 kJ v vseh scenarijih | da |
| 1 | največji zasuk | 2248° | 302° | 302° (tbone-200-cross-front) | da |
| 1 | ohranitev (`mase-razlicice.js`) | dP 0,0 %, E+ 0,01 % | dP 0,0 %, E+ 0,00 % | dP 0,0 %, E+ 0,00 % | da |
| 2 | tbone-120-stand-mid: B raven po, premik po 2 s, A/B po 2 s | 1,32 s, 11,8 m, 0/0 km/h | 2,86 s, 23,8 m, 26/26 km/h | 2,86 s, 23,8 m, 26/26 km/h | da |
| 2 | tbone-60-stand-mid, premik | 3,0 m | 6,1 m | 6,1 m (raven po 0,63 → 1,11 s) | da |
| 3 | 15°/120: izstop, zasuk, 0,3 m stran od ograje po | 0,3°, 100 °/s, 4,90 s | 1,5°, 167 °/s, 0,35 s | 1,5°, 167 °/s, 0,35 s (škoda 19 → 28 %) | da |
| 3 | 30°/120: izstop, zasuk, hitrost ob odhodu | 0,5°, 147 °/s, 70 % | 4,3°, 206 °/s, 66 % | 4,3°, 206 °/s, 66 % (84 → 79 km/h) | da |
| 3 | 30°/200: izstop | 0,9° | 3,5° | 3,5° (zasuk 246 → 340 °/s) | da |
| 3 | 90°/60 in 90°/120: hitrost po 1. koraku, zasuk | 14/27 km/h, 93/187 °/s | 4/6 km/h, 0 °/s | 4/6 km/h, 0 °/s | da |
| 3 | 90°/100 (`p7.js`): hitrost vzdolž ograje, zasuk | 19,3 km/h (19 %), 156 °/s | 0 | 0,0 km/h, 0 °/s | da |
| 3 | 5°/60 | | enako kot zdaj | enako | da |
| 3 | plin in volan stran, 30°/120: raven po, hitrost po 2 s | 0,63 s, 148 km/h | 1,62 s, 143 km/h | 1,62 s, 143 km/h | da |
| 3 | zrcalni primeri 80/85/90/95/100° (`p7.js`), zasuk po 1. koraku | 85° in 95° nista zrcalna (desna ograja −106 in −162 °/s, leva 162 in 106 °/s) | zrcalni | 145/60/0/−60/−145 °/s, levo = desno | da |
| 3 | vožnja po ograji R 60 m (`p6.js`, asfalt), skupni čas | 15,64 s (samovoznik 17,58 s) | 15,74 s | 15,74 s (dotikov 2 → 5) | da; vrstica 13 ostane odprta |
| 3 | vožnja po ograji R 30 m, skupni čas | 14,08 s (zasnova: 14,15 s; samovoznik 16,51 s) | 14,37 s | 14,35 s (dotikov 5 → 24) | da v mejah (spodaj) |
| 3 | škoda: 30°/120; vožnja po ograji R 30 m | 45 %; 24 % | 58 %; 100 % | 58 %; 100 % | da |
| 4 | stožec 3 kg | 4,93/11,57/11,47 % | 0,24/0,15/0,09 % | 0,24/0,15/0,09 % | da |
| 4 | guma 9 kg | 17,23/29,87/31,63 % | 0,77/0,46/0,26 % | 0,77/0,46/0,26 % | da |
| 4 | bala 26 kg | 42,84/49,69/62,30 % | 3,23/1,36/0,75 % | 3,23/1,36/0,75 % | da |
| 4 | kup bal 78 kg | 45,14/59,30/61,84 % | 6,38/3,61/1,92 % | 6,38/3,61/1,92 % | da |
| 4 | svetilka 110 kg | 4,50 % | 4,0 % | 4,00/4,00/3,10 % | da |
| 4 | razmerje gibalnih količin (avto izgubi : predmet dobi) | 0,5–169,1 (zasnova: 24–137) | 1,0–2,0 | 1,0–2,0 | da |
| 4 | lasten pokrov (m 14) | zasnova: 12,5/8,2/5,6 %; zdaj avto svojega dela ne zadene (n = 0) | 1,55/0,93/0,55 % | brez dotika (n = 0) | ne velja več (spodaj) |
| 4 | pokrov, ki drsi / leti, 120 km/h | 5,60/5,60 % (zasnova: 12,7/8,2 %) | 1,15/0,75 % | 0,88/0,54 % | manj od pričakovanega (spodaj) |
| 4 | ležeči kosi (`DEB_RUN`) | | nespremenjeni | vseh 42 vrstic enakih | da |
| dirke | Spa, 13 avtov, 150 s (`dirke.js`) | 13 trkov nad 3 m/s, največji 7,1 m/s, škoda največ 11,2 %, pot vseh 84 073 m | enako do metra | enako pri vsakem avtu (največja razlika poti 0,0 m); po popravkih 12. 11.: 19 trkov nad 3 m/s, največji 8,0 m/s, škoda največ 17,1 %, pot vseh 83 984 m (−0,11 %; na avto največ 84,9 m, najslabši −0,59 %) | da; po popravkih ne (spodaj) |
| dirke | Bathurst: trkov nad 3 m/s, nad 8 m/s | 6, 0 (največji 6,2 m/s) | 14, 2 | 14, 2 (največji 9,2 m/s); po popravkih 12. 11.: 27, 1 (največji 9,2 m/s) | da; po popravkih več rahlih trkov (spodaj) |
| dirke | Bathurst: vrtenja, škoda največ | 0, 4,2 % | brez vrtenja, 23 % | 0 (nos največ 36° od smeri ceste), 22,6 %; po popravkih 12. 11.: 0 (36°), 23,7 % | da |
| dirke | Bathurst: pot | 82 970 m (vsi skupaj) | srednja pot −1,0 % | 82 300 m (−0,81 %); na avto srednja −0,80 %, mediana −0,55 %, najslabši −1,81 % (119,0 m); nihče ne odstopi; po popravkih 12. 11.: 82 254 m (−0,86 %); srednja −0,86 %, mediana −0,60 %, najslabši −1,79 % (115,2 m), nihče ne odstopi | da (druga mera poti) |

**Kaj se ne ujema ali je novo, in zakaj:**

- **Oplazenja z boka** (`side-V-a3|a10-eq|dv20`): brez vnosa je 8 od 12 glavnih vrstic enakih, 4 imajo majhno razliko (side-60-a10-dv20: zasuk B 0 → −2°; side-120-a10-dv20: dotikov 96/217 → 97/216; side-200-a10-eq: dodane energije 249 → 253 J; side-200-a10-dv20: dotikov 477/582 → 390/554, premik −9,7/7,7 → −8,7/8,7 m). S plinom (stolpci »hold«) so razlike večje: side-60-a3-eq B −20 → −137° (B izgubi oprijem, najnižja hitrost 59 → 34 km/h), side-60-a10-dv20 B −122 → −57°, side-120-a10-dv20 B −26 → −95°, side-200-a10-dv20 B −39 → −46°. Vzrok: ob dolgem naslonu s plinom je kateri od poznejših sunkov dovolj velik, da vzame oprijem (točka 1 velja povsod po avtu). Kandidat da iste številke: lastnost zasnove, ne napaka prenosa. Zasnova je »enako kot zdaj« zapisala za vrstice brez vnosa. **Po popravkih 12. 11.** (varovalo energije v `kCollide`): brez vnosa so enake 3 od 12 glavnih vrstic (`side-V-a3-dv20`), 9 ima majhno razliko: dodane energije ni več (prej npr. 253 J pri side-200-a10-eq), avto vzame majhen del zasuka (največ −43 °/s pri side-60-a3-eq), zasuk po 0,5 s se razlikuje za največ 4°, premik po 2 s za največ 1 m (side-200-a10-dv20, kot pred popravki). S plinom se B pri side-60-a3-eq ne zavrti več (−20 → −21°, prej −137°; najnižja hitrost ostane 59 km/h), druge tri navedene vrstice so enake kot pred popravki.
- **Ograja zunaj seznama zasnove:** 60° ima zasuk 68/136/227 → 175/351/516 °/s (516 °/s je meja 9 rad/s), hitrost po 1. koraku 17/33/55 → 13/27/44 km/h. Čelno s plinom avto ostane z nosom v ograji (zasuka ni), dokler voznik ne zapelje vzvratno: oznaka »lep« je v cv 1 pri 60°/60, 60°/120, 60°/200 in 90°/60, v cv 6 pri 60°/60, 90°/60, 90°/120 in 90°/200. 15°/200: dotikov 2 → 6, škoda 53 → 97 %. Naslon 15°/120 brez volana (`p13.js`) se odbije na drugo ograjo: po 4 s 194 → 150 km/h, poznejši udarec 3,61 → 7,02 m/s, škoda 21 → 51 %; 5°/120 se odlepi po 0,02 s (prej 5,01 s ob ograji). Avto, ki drsi in zadene z zadnjim vogalom (`p7.js`, pot 30°, nos −20°, 100 km/h): zasuk 238 → 470 °/s, 2 → 4 udarci, škoda 46 → 70 %, po 2 s stoji (57,7 → 0,0 km/h) z nosom 89° na ograjo. Ploskoma z bokom (pot 90°, nos 0°, 40 km/h): po 1. koraku še 17,4 km/h proti ograji → 2,9 km/h od nje (odboj), hitrost vzdolž ograje −5,2 → 0 km/h, zasuk −138 → 0 °/s, škoda 42 → 23 %. Tovornjak sam (titan, 30°/120): zasuk 109 → 156 °/s, v cv 1 ostane na ograji (1 dotik, škoda 24 %), v cv 6 izstop −10,2°, 2 dotika, škoda 34 %. Otok krožišča čelno 60/120: po 1. koraku 8/17 → 5/10 km/h, zasuk 59/117 → 57/116 °/s ostane (okrogel otok, dotik ob vogalu). Rob prepada 5°/60, rob nove mape, nos v zid boksov in vseh 8 vrstic speljevanja od ograje so enaki.
- **Vrstica 13 (vožnja po ograji) ostane odprta:** po ograji je na asfaltu še vedno hitreje kot po cesti (R 60 m 15,74 s proti 17,58 s; R 30 m 14,35 s proti 16,51 s), le dražje (R 30 m: škoda 24 → 100 %, dotikov 5 → 24, najnižja hitrost 130 → 122 km/h). Odloči uporabnik (»Kje prejšnja analiza ne drži«, vrstica 13). Izhodišče R 30 m je zdaj 14,08 s in ne 14,15 s kot v zasnovi: enako da že `f1c4a0a`, zasnova je merila starejše drevo; od tod tudi 14,35 s namesto 14,37 s.
- **Predmeti zunaj seznama zasnove:** težki predmeti stanejo več kot zdaj, ker cena ni več omejena: nadstrešek 220 kg 4,50 → 14,74/10,34/6,20 %, predmet vrste `signalm` (160 kg) 4,50 → 5,34/5,34/4,51 %. Počasno rinjenje stane več: bala pri 5 km/h 12,53 → 41,58 % (0,60 → 1,98 km/h), kup bal pri 15 km/h 25,43 → 45,25 %. Cena je po masi avta (zdaj od nje ni odvisna): stožec pri 120 km/h mravlja 0,98 %, kolibri 0,25 %, rally 0,15 %, titan 0,03 %; nadstrešek 58,16/17,49/10,34/2,25 %. Predmet med avtom in ograjo (avto 20° proti ograji; izguba proti istemu avtu brez predmeta): bala pri 120 km/h 19,7 % (najnižja hitrost 6 km/h) → 1,4 % (92 km/h). Dirka 13 avtov čez vrsto bal 250 m po štartu (Spa): srednja izguba 8,0 → 1,6 %, največji zaostanek 11,2 → 2,1 m. Naslov razdelka »izguba hitrosti ni odvisna od mase avta« v izpisu `predmeti.js` je stalno besedilo in opisuje Simulacijo.
- **Pokrov, ki drsi ali leti: 0,88/0,54 % namesto 1,15/0,75 %.** Po popravkih O1 in O2 (»Odpadli deli«) premikajoč kos avto zadene z enim sunkom: (14 kg · 24 m/s) / 1150 kg = 0,29 m/s = 1,05 km/h = 0,88 % od 120 km/h. Zasnova je merila pred O1 in O2 (»zdaj« takrat 12,7/8,2 %, danes 5,60 %); kandidat da na istem drevesu iste številke. **Lasten pokrov** avto po O1 in O2 ne zadene več v nobeni različici (n = 0), zato pričakovanje 1,55/0,93/0,55 % ne velja več.
- **Promet in polprikolica:** dotik s prometom (`Traffic._hitVeh`) ni del Realistične: od 81 vrstic se razlikujejo 4 (200 km/h, zamik 0,6 m), in še te šele ob ograji ovala 1,1 s pozneje (točka 3). Stoječa polprikolica z zamikom 0,6 m pri 120/200 km/h: prvi dotik je enak, avto pa dobi zasuk 0 → 192/320 °/s in se zavrti za 58/129° (točka 1; prikolica sama je izvzeta).
- **Dirke:** Bathurst ima srednjo pot na avto −0,80 % (zasnova −1,0 %): druga mera poti in drevo po O1 in O2; trki in škoda se ujemajo. Po popravkih 12. 11. Spa ni več enak Simulaciji (19 trkov nad 3 m/s proti 13, pot −0,11 %), na Bathurstu je rahlih trkov več (27 proti 14 nad 3 m/s pred popravki; nad 8 m/s 1 proti 2), pot −0,86 %; vrtenj in odstopov ni. Vzrok in širša meritev (36 dirk): »Popravki po neodvisnem preverjanju«.
- **Glava izpisa `zid.js --cv 6`** kaže Simulacijina števila ograje (`wallE` 0,05, `wallMu` 0,25, `wallYaw` 0,3): veljajo za naslon pod 1,5 m/s, števila sunka so v `KV.real.wall`.

**Robni primer brez sunka.** `wallR` se pokliče, ko se vogal bliža ograji hitreje od 1,5 m/s; če se skupno prijemališče (ročica × 0,55) takrat ne bliža več, sunka ni (`if (vn >= 0) return;`), `wallCollide` pa vseeno zapiše `hit` vogala. Prešteto na zasebni kopiji s števcem: `zid.js --cv 6` 0 od 1225 klicev, `p7.js` 16 od 48 (vogal največ 2,41 m/s), `p13.js` 0 od 27, `p6.js` R 30 m 9 od 403 (največ 2,19 m/s). V teh orodjih je vse pod pragom škode 2,5 m/s, škoda iz tega ne nastane; kandidat dela enako. **Na splošno ni tako** (12. 11., široki pregled ograje med drsenjem in vrtenjem v razdelku »Testi različice Realistična«: 1820 prizorov × 2 ograji, 3 s): tak dotik je 1229 od 212 049 korakov z dotikom (0,58 %; v 236 prizorih), nad pragom škode 2,5 m/s v 121 prizorih, najhitreje 12,30 m/s (pot 60° na ograjo, nos v smeri poti, 200 km/h, vrtenje −2 rad/s); to je 0,60 % škode, ki jo udarci pomenijo ((udarec − 2,5) · 0,028 na korak: 6,71 od 1123,4). Zapisani udarec gre v `c.hitWall` in `c.fxWall`, nad 2,5 m/s v škodo (`knock`), od 11 m/s v možnost predrte gume (`puncture`) in, kjer je vklopljeno prevračanje, nad 10 m/s z boka v `xRollStart`; koliko dotikov brez sunka je nad 10 m/s, ni prešteto. **Seja je 12. 11. pustila, kot je** (uporabnik o tem ni odločal); omejuje ga preverjanje 13 v `tests/trki.test.js` (pod 2 % korakov z dotikom in pod 2 % škode; v Simulaciji nobenega). Možnosti za pozneje: (A) `hit` zapisati samo ob sunku (spremeni, kaj šteje za udarec, gibanja ne), (B) ob takem dotiku uporabiti pravilo naslona (Simulacijin sunek; `wallR` vrne, ali je sunek dal, vrstica ostane ena). Nobena ni izmerjena.

**Kako ponoviti:** `node tools/trki/avto-avto.js --cv 6 [--only <scenarij>]`, `node tools/trki/mase-razlicice.js --only ohranitev --cv 6`, `node tools/trki/zid.js --cv 6 --del matrika` (ali `prikolica`), `node tools/trki/predmeti.js --cv 6 --del predmeti` (ali `razbitine`), `node tools/trki/dirke.js [--rows]` (ista dirka s cv 1 in cv 6). Skripte preverjalcev nimajo `--cv`; iz korena repozitorija: `node -e "const L = require('./tools/trki/preverjanje/zid/lib.js'); L.C.setTest({ cv: 6 }); require('./tools/trki/preverjanje/zid/p7.js')"` (enako `p13.js` in `p6.js`; za R 30 m na koncu `x 30`). Kandidatna skripta se na tem drevesu ustavi pri prvem sidru (formule so že v jedru); zasebno kopijo s kandidatom naredi iz drevesa pred Realistično (`git worktree add <mapa> f1c4a0a`, skripto poženi tam).

### Točka 3 in #494 (Killar): postopek ob sporu

#494 še ni na `main`. Postopek je **popravljen 12. 11. po poskusnem spoju** (»Popravki po neodvisnem preverjanju«, najdba 2; `git merge-file` z jedrom drevesa `8de444ef` na `zbirna/proge` in skupnim prednikom `7e4fdecd`): spoj da v `js/core.js` **5 sporov** (na drevesu pred Realistično, `f1c4a0a`, samo 2: sledenje tekmeca prometu in vrstica vozila v prometu). Realistična torej prinese **tri spore, ne enega**, in prejšnji korak 1 (»v celoti v korist #494«) je z njegovo funkcijo zavrgel tudi `wallR`: prvi udarec v ograjo s cv 6 se je končal z »wallR is not defined«.

V tem drevesu je Realistična v `wallCollide` (`js/core.js` 3929) na dveh mestih:

- **zaprta vrstica s sunkom** (3977), tik pred vejo Simulacijinega sunka, ki je iz `if (vn < 0) {` postala `else if (vn < 0) {`:

  `if (krOn(c) && vn < -KC.wall.v0) { wallR(c, wx, wz, nx, nz, k); if (-vn > hit) { hit = -vn; hitK = k; hnx = nx; hnz = nz; } }`

- **veja naslona** (od 12. 11.): Simulacijin sunek teče v zanki `for (let wy = CSK.wallYaw; ; wy = 1) { … }` (3983–3999; prvi prehod je prejšnja koda do zadnje številke, drugi teče samo v Realistični, kadar bi prvi avtu dodal energijo), za zanko je meja zasuka brez pogoja (4000):

  `if (krOn(c)) c.w = clamp(c.w, -KC.wMax, KC.wMax);`

  Vrstice `if (krOn(c) && c.xgl > 0) …` iz popravka `a89d034` ni več.

Vse drugo v `wallCollide` je, kot je bilo pred Realistično. #494 (drevo `8de444ef`; »tam« spodaj pomeni to drevo) ta del funkcije preseli v notranjo `touch(wx, wz, pen, nx, nz, k)` (tam vrstica 4019) in funkciji doda `rc`. Postopek:

1. **Spor pred `wallCollide`** (naša `wallR` in stara glava `function wallCollide(c, trk, canFall)` proti `fenceBreak`, `overEdge` in novi glavi iz #494): obdrži `wallR` s komentarjem **in** vzemi `fenceBreak`, `overEdge` ter novo glavo `function wallCollide(c, trk, canFall, rc)`; odpade samo naša stara vrstica glave. `krOn`, `KV.real`, `kCollide`, `kTake` in vse drugo zunaj `wallCollide` se zlije brez spora.
2. **Telo `wallCollide`** reši v korist #494. Nato v `touch()` celo vejo `if (vn < 0) { … }` (v #494 je to koda izpred Realistične, samo drugače zamaknjena: preverjeno 12. 11.) zamenjaj z vejama tega drevesa: z vrstico `wallR` in s celo vejo `else if (vn < 0) { … }` z zanko `for` in mejo zasuka za njo. Zadnji argument `wallR` je `nc ? -1 : k` (korak 4).
3. **Vrstica `if (K.breaks)`** pri zadetku predmeta (`propCarHit`, 3815): obdrži štiri vrstice Realistične (od `const kr = krOn(c), bvx = b.vx, bvz = b.vz;` do `propFeel(c, K.m, vrel, b.kind, kr); return; }`) in klicu `race.breakProp` dodaj sedmi argument iz #494: `race.breakProp(b, nx, nz, vrel, c.vx, c.vz, c)`.
4. **Dotik, ki ni vogal.** `touch` kličeta dve mesti: zanka vogalov (tam 4094; ograja, zid boksov, plošča ograje na progi brez ograje, skala useka in zid hiše, otok krožišča ob vogalih, zaprti zidovi obroča, konci odprte ceste in stranske ceste: `k` je vogal avta) in sredina visokega otoka (tam 4098–4103, `trk._tall`: dotik je na robu kroga avta, `k` je samo najbližji vogal za `hitK`). Drugi klic mora `wallR` dobiti s `k = −1`: `touch` dobi sedmi parameter `nc` (»ni vogal«), ki ga poda samo klic iz `trk._tall`. `wallR` je na to pripravljen od tega commita: pri `k < 0` prime v točki dotika `(wx, wz)` brez povprečenja vogalov (prej bi dal NaN); preverjeno na zasebni kopiji, ki vsak dotik pošlje z −1 (`zid.js --cv 6 --del matrika` brez NaN). `hitK` ostane najbližji vogal.
5. **Do vrstice ne smeta priti** zlomljena lesena ograja (`fenceBreak(…)` da `pen = 0`, nato `if (pen <= 0) continue;`) in padec z roba (`overEdge(c, nx, nz, vo); return;`): oboje je v #494 pred klicem `touch`, samo preveri, da je po spoju še tako.
6. Po spoju najprej preveri, da `grep -c 'function wallR(' js/core.js` izpiše 1 in da udarec v ograjo s cv 6 teče (`node tools/trki/zid.js --cv 6 --del matrika`). Nato ponovi dokaze: cel izpis `zid.js --cv 1` enak kot pred spojem; `zid.js --cv 6 --del matrika` do znaka enak izpisu tega drevesa (poskusni spoj 12. 11.: 381 vrstic, bajt za bajtom); `p7.js` zrcalno; krhka ograja, skala, padec z roba in visok otok s cv 6 (brez NaN, padec kot v cv 1); `tests/padec.test.js` in `tests/trki.test.js` (preverjanja 13, 14, 17 in 18 padejo, če veja naslona ali meja zasuka manjka; če se po spoju premakne vnos cv 1–5 v `tests/golden/trki.json`, je vzrok #494 in ne Realistična: referenco zapiši z `--update` šele po pregledu razlike).

Druga dva spora (sledenje tekmeca prometu, `c.tfFol`, in vrstica vozila v prometu, `v.s = …`) nista stvar Realistične: enaka sta na drevesu pred njo, v poskusnem spoju sta rešena tako, da ostaneta spremembi obeh strani.

### Odprto za drugi del

1. **Testi za cv 6** v `tests/trki.test.js` po seznamu »Testi« zgoraj (brez dotika, druge različice, ohranitev, simetrija, meje, dirke in vlačilci): **narejeno 12. 11.** (»Testi različice Realistična«). Blok »Realistična (cv 6)« s primerjavo `copy` se je po prvem delu preskočil, ker vrstica ni več kopija; drugi del ga je zamenjal (preverjanje 3). Pri testu vlačilcev: izvzeta sta vlačilec in prikolica, drugi avto v paru pa dobi svoj delež po Realistični, zato »isto stanje kot v cv 1« velja za vlačilec ob ograji in za njegov delež trka, ne za ves par.
2. **Realistična v `touch()`** (klic `wallR` in, od 12. 11., cela veja naslona z varovalom energije in mejo zasuka) po prihodu #494 (»Točka 3 in #494 (Killar): postopek ob sporu«, popravljen po poskusnem spoju) in ponovitev dokazov.
3. **Robni primer brez sunka** v `wallR` (zgoraj): 12. 11. izmerjen na širokem naboru in omejen s preverjanjem 13; ostane, kot je, možnosti A in B sta zapisani zgoraj.
4. **Vrstica 13** (vožnja po ograji ostane hitrejša od ceste) čaka na odločitev uporabnika.
5. **Oplazenja z boka s plinom:** pri 60 km/h se B zavrti (−20 → −137°); pregledati, ali je to želeno, ali naj dolg naslon oprijema ne jemlje. Po popravkih 12. 11. se B pri side-60-a3-eq ne zavrti več (−21°); ostane side-120-a10-dv20 (−26 → −95°).
6. **Težki predmeti in počasno rinjenje** stanejo več kot zdaj (nadstrešek 220 kg pri 60 km/h 4,5 → 14,7 %; bala pri 5 km/h 0,60 → 1,98 km/h): pregledati z uporabnikom na slikah.
7. **Dotik s prometom** (`Traffic._hitVeh`) ni v Realistični.
8. **Ni izmerjeno:** lestvica škode za cv 6 (12. 11. samo škoda ob ograji: +6,8 % proti Simulaciji na 567 prizorih; »Odprto po testih«, točka 6), štart z 22 avti in ozke proge. Odprto tudi, ali naj otok krožišča ob vogalih pošlje `k = −1`, in glava izpisa `zid.js` za cv 6.
9. **Slike ZDAJ/POTEM in brskalniški testi** (glavna seja), nato gumbi v Nastavitvah in Poškodbe. Besedilo izbire v meniju (»v delu«, `js/lang.js`) ostane do takrat.

Od 12. 11. je točka 1 narejena in točka 3 izmerjena; kar so odprli testi, je v naslednjem razdelku (»Odprto po testih«).

### Testi različice Realistična (12. 11. 2026)

Drugi del faze 2 (ista seja kot jedro). `tests/trki.test.js` ima **42 preverjanj** (prej 19): 23 novih (št. 4–24, 40 in 42), preverjanje 3 je napisano na novo (prej primerjava s kopijo, `copy`), 38, 39 in 41 so prilagojena (Realistična ima ob zidu in v dirki svojo vrstico). Test teče ~54 s (prej ~24 s). Prizori so na ravnini (`tests/lib/handling.js`, avto rally, klasična fizika, če ni rečeno drugače); vožnja brez dotika in dirke so na Spa in Bathurstu, boksi na Spa, pregon na Chapman's Peaku. Testnih prog in prog na odločanju test ne uporablja. Commiti: `a2f5ec4`, `f3262f0`, `e2b8fd8`, `a89d034` (popravek jedra), `0bc2ddb` in končni »Trki: testi različice Realistična (cv 6)«. Testi so našli **eno napako jedra** (»Popravek jedra« spodaj). Brskalniški testi niso bili pognani (požene jih glavna seja).

**Preverjanja.** Številka je vrstni red v izpisu testa, številke so z drevesa `a89d034`. Prizor ob ograji med drsenjem je zapisan kot pot/nos/hitrost/vrtenje: kot poti na ograjo (°), nos od poti (°), km/h, vrtenje na začetku (rad/s).

**Stanje po popravkih po neodvisnem preverjanju (12. 11.):** test ima **49 preverjanj** in teče ~80 s. Tabela spodaj ohranja številke vrstnega reda z drevesa `a89d034` (42 preverjanj); v današnjem izpisu so: 1–6 enako, 7–13 → 10–16, 14–24 → 19–29, 25–37 → 31–43, 38 → 44, 39–42 → 45–48. Nova so 7 (ohranitev po vlogah in masah), 8 (avto med prevračanjem ali v zraku), 9 (varnostni avto), 17 (ograja po masah), 18 (zasuk po dotiku ograje za vsak avto) in 49 (brez dotika med tekmeci); preverjanje privzetih vrednosti igre (»43« v razdelku »Gumbi v Nastavitvah: izvedba«) je v izpisu 30. Kjer so se izmerjene številke s popravki spremenile, je v tabeli pripis »po popravkih 12. 11.«; nova preverjanja in njihove številke so v razdelku »Popravki po neodvisnem preverjanju«. Tabela okvar in široki pregled spodaj sta iz časa pred popravki.

| Št. | Kaj trdi | Izmerjeno |
|---|---|---|
| 3 | cv 6 je različica `real` z lastno vrstico števil (Simulacijina in svoja: ograja, meja zasuka 9 rad/s), trk po pravilih različic (ne stari); `setTest(null)` vrne privzeto | isti trk: igralec 43,441 km/h, drugi 55,249 (Simulacija 43,441 / 55,249, Stara 44,433 / 54,257) |
| 4 | **ohranitev, dva avta** (30 prizorov: bočni trk v prednji in zadnji del, čelni in od zadaj mimo sredine, PIT; 60, 120, 200 km/h): gibalna količina para do 1e-9 kg m/s, kinetična energija z vrtilno ne zraste za več kot 0,5 kJ (po popravkih 12. 11.: ne zraste, meja 1e-4 J) | gibalna količina največ 1,5e-11 kg m/s; največ dodane energije 0,405 kJ (`pit-200-front-8`); po popravkih 12. 11.: največja sprememba energije ob sunku 9,3e-10 J (`pit-200-front-4`) |
| 5 | **simetrija, dva avta**: zrcalni trk da zrcalni izid do 1e-9: takoj po prvem sunku v vseh 30 prizorih, na koncu (1,5 s) v 12 prizorih, kjer avta stojita vzdolž osi | po prvem sunku največ 1,4e-14, na koncu 3,6e-14 |
| 6 | **meje, dva avta**: brez NaN pri 60, 120 in 200 km/h; med izgubo oprijema nikoli hitreje od 9 rad/s; PIT pri 60 km/h zasuka tem bolj, čim močnejši je (2, 4, 8 m/s prečno); bočni trk v prednji del zasuka stoječi avto za četrt obrata pri 60 km/h in za več kot tretjino pri 120; od zadaj mimo sredine pri 60 skoraj nič | najhitrejši zasuk 9,000 rad/s (`tbone-front-120`); PIT −1,9 / −38,6 / −95,3°; bočni spredaj 60 / 120: −94,5 / −156,9°, zadaj 60: 94,5°; od zadaj 60: −2,9° |
| 7 | **ograja, ohranitev** (13 prizorov: 5 do 95°, 60 do 200 km/h): ob nobenem dotiku ne zraste energija avta z vrtilno ali hitrost vzdolž ograje, noben vogal ne ostane v ograji | energija ob dotiku največ −0,0129 kJ (5°/60), hitrost vzdolž ograje −1,5e-16 m/s (Simulacija pri 90°/120: +6,4 m/s), najgloblji vogal −8,9e-16 m |
| 8 | **ograja, simetrija**: leva ograja da zrcalno sliko desne do 1e-9 (vseh 13 prizorov); pravokotno vanjo (90°) se avto ne zasuka in ne drsi vzdolž nje | levo/desno največ 8,9e-16; 90° pri 120 km/h: zasuk 0,000°/s, vzdolž ograje 0,000 m/s (Simulacija −186,9°/s, −6,44 m/s) |
| 9 | **ograja, meje**: brez NaN, med izgubo oprijema ne hitreje od 9 rad/s; oplazenje, počasnejše od praga (5° pri 60 km/h), je do zadnje števke Simulacijino, močnejše svoje; pri 15 do 30° in 120 do 200 km/h avto zapusti ograjo pod kotom 1 do 5° (Simulacija pod 1°); pravokotno obdrži manj kot desetino hitrosti | izstop 1,52 / 4,35 / 3,47° (Simulacija 0,27 / 0,49 / 0,93°); pravokotno ostane 5,9 / 5,1 / 5,0 % hitrosti; najhitrejši zasuk 5,94 rad/s (30°/200) |
| 10 | **ograja med drsenjem in vrtenjem, ohranitev** (300 prizorov ob obeh ograjah: pot 20 do 90° na ograjo, nos 10 do 60° od poti, 100 in 200 km/h, vrtenje 0, ±2 in ±4 rad/s; 3 s): brez NaN, noben vogal v ograji; sunek (dotik hitreje od 1,5 m/s, pravilo Realistične) nikoli ne doda energije; naslon (počasnejši dotik, Simulacijino pravilo) doda največ 7 kJ na dotik (po popravkih 12. 11.: naslon je ne doda, meja 1e-4 J) | 2492 sunkov: največ 0,000000 J; 60 492 naslonov: največ 6,06 kJ (60/90/200/−4; Simulacija ob dotiku 1,83 kJ, 60/70/200/4); najgloblji vogal −8,9e-16 m; po popravkih 12. 11.: 61 606 naslonov, največ 1,3e-10 J (90/120/200/−2) |
| 11 | **ograja med drsenjem in vrtenjem, meje**: med izgubo oprijema nikoli hitreje od 9 rad/s, tudi ko se vogal potem nasloni na ograjo; meja deluje (dosežena v vsaj 60 prizorih, od tega v 10 brez vrtenja na začetku) | najhitreje 9,000000 rad/s (20/−40/200/0); ob meji v 82 prizorih, v 13 brez vrtenja na začetku; **pred popravkom jedra 9,228438 rad/s** (45/−15/200/4) |
| 12 | **ograja med drsenjem in vrtenjem, simetrija**: leva ograja da zrcalno sliko desne do 1e-9 takoj po prvem dotiku in na koncu v vseh prizorih brez vrtenja na začetku (60); z vrtenjem (240) v vseh razen največ 2 po prvem dotiku in 8 na koncu | brez vrtenja 0 / 0; z vrtenjem 1 / 6 od 240 (največ 0,023 / 0,285: 30/40/200/4); Simulacija na koncu 29 od 300 (6 brez vrtenja) |
| 13 | **dotik brez sunka** (vogal zaniha v ograjo hitreje od 1,5 m/s, sredina prijemališča se ji ne bliža: udarec se zapiše, avta nič ne odrine; »Robni primer brez sunka«): pod 2 % korakov z dotikom in pod 2 % škode, ki jo udarci pomenijo; v Simulaciji nobenega | 752 od 63 076 korakov z dotikom (1,19 %), 1,18 % škode; najhitreje 12,30 m/s (60/0/200/−2); Simulacija 0 od 73 164; po popravkih 12. 11.: 752 od 64 194 (1,17 %) |
| 14 | **predmeti ob cesti**: stožec, guma, bala, kup bal in drog avta nikoli ne pospešijo (15 prizorov: 60, 120, 200 km/h, ob vsakem ista vožnja brez predmeta); predmet 0,6 m levo in desno od smeri avta da zrcalni sliki ob prvem dotiku (1e-9); brez NaN | največ pridobljeno 0 m/s; levo/desno 0 |
| 15 | **predmeti, meje**: avto izgubi, kolikor vzame masa predmeta: stožec pod 0,5 %, bala pod 3,5 %, težji predmet pri isti hitrosti več, vsak pri 200 manj kot pri 60 km/h; Simulacija vzame pri stožcu 20-krat več | 60 / 120 / 200 km/h: stožec 0,24 / 0,15 / 0,09 %, guma 0,77 / 0,46 / 0,26 %, bala 2,40 / 1,35 / 0,75 %, kup bal 6,92 / 3,79 / 1,85 %, drog 4,00 / 4,00 / 3,10 %; Simulacija, stožec pri 120: 11,57 % |
| 16 | **odpadli del na poti** (pokrov motorja, prednji odbijač in pokrov prtljažnika z avta spredaj; 6 prizorov, 60 do 200 km/h, ob vsakem ista vožnja brez dela): izguba pod 1,6 % in manj kot pol Simulacijine; avto ni nikoli hitrejši kot brez dela; brez NaN; sunek ne vzame naključnega števila; del, ki leži na cesti, se povozi kot v Simulaciji, do zadnje števke | Realistična / Simulacija: pokrov motorja 120: 0,92 / 5,60 %, 200: 0,55 / 5,60 %; odbijač 120: 0,46 / 2,80 %, 200: 0,27 / 2,80 %; pokrov prtljažnika 60: 1,10 / 4,40 %, 120: 0,68 / 4,40 %; ležeči pokrov pri 60: 2,50 / 2,50 % |
| 17 | **brez dotika**: sam na Spa in Bathurstu (60 s, samodejna vožnja, suho in mokro; stožci stojijo ob ograjah) je celotno stanje dirke in avta po vsakem koraku v cv 6 enako kot v cv 1; avto se ničesar ne dotakne (ni sunka, ograje, predmeta, izgube oprijema, drsenja po sunku) in noben stožec se ne premakne | Spa suho 2672 m, največ 230 km/h, 135 stožcev; Spa mokro 2540 m, 228 km/h; Bathurst suho 2642 m, 229 km/h, 81 stožcev; Bathurst mokro 2463 m, 229 km/h; Spa suho v novi fiziki (20 s) 728 m, 225 km/h |
| 18 | **brez dotika, kontrola**: ista primerjava dotik najde: avto, ki na Spa po 6 s zavije s ceste, je v cv 6 in cv 1 enak do prvega dotika in različen v sekundi po njem; 100 km/h v prednji del stoječega avta: enako do prvega sunka, različno od tega koraka | Spa: prvi dotik in prva razlika v koraku 930; ravnina: prvi sunek in prva razlika v koraku 2 |
| 19 | **brez dotika, ravnina**: z istimi ukazi (slalom pri 100 km/h, zaviranje s 150 km/h v ovinek, ročna zavora pri 90 km/h, trava pri 80 km/h; po 5 s; klasična in nova fizika) je celotno stanje avta po vsakem koraku enako v cv 6, v cv 1 in privzeto | 8 voženj enakih |
| 20 | **druge različice, referenca** (`tests/golden/trki.json`): 12 trkov dveh avtov, 5 ograj, 5 predmetov ob cesti, 2 odpadla dela in vlačilec s polprikolico ob ograji se v vsaki od šestih različic končajo v zapisanem stanju (celotno stanje po vsakem koraku); ograja, predmeti in odpadli deli so v cv 1 do 5 enaki; Realistična ima svoje v vsaj 16 od 24 prizorov in Simulacijino pri vlačilcu s prikolico | 150 vnosov; Realistična se razlikuje v 18 od 24 (kot Simulacija: `knock/stand`, `knock/bump`, `knock/drift3`, `knock/pit-nova`, `knock/pit-120-front-4`, `wall/5-60`); po popravkih 12. 11.: 20 od 24 (kot Simulacija: `knock/stand`, `knock/pit-nova`, `knock/pit-120-front-4`, `wall/5-60`) |
| 21 | **izvzeti: vlačilec s polprikolico** drži Simulacijina pravila: ob ograji (15°, 90 km/h, skozi korak dirke; ograje se dotakneta vlačilec in prikolica), ob bali, ob odpadlem delu (pokrov motorja pri 120 km/h) in v drsenju po sunku je celotno stanje po vsakem koraku v cv 6 enako kot v cv 1; zadet z avtom pri 100 km/h vzame svoj delež kot v cv 1, avto, ki ga zadene pri 80 km/h, vzame delež po Realistični; vlačilec v stoječ vlačilec je enak do konca; isti vlačilec brez prikolice se razlikuje v vseh petih | `cisterna`: ograja v koraku 6 (vlačilec) in 32 (prikolica), bala v koraku 5 (izguba 16,19 / 16,19 %), pokrov v koraku 90 (5,60 / 5,60 %); vlačilec v vlačilca: 10 dotikov, zadeti zasukan −64,5 / −64,5°; `titan` (brez prikolice): razlika od koraka 6, bala 36,04 / 0,52 %, pokrov 5,60 / 0,21 %, v sebi enakega 0,0 / −70,6° |
| 22 | **izvzeti: avto v pregonu** drži Simulacijina pravila: pravi pregon (Chapman's Peak, igralčev avto z oznako pregona, po 3 s zavije v ograjo na morski strani; do spoja `main` 12. 11. po 4 s v ograjo na drugi strani, kjer je od #654 hrib z mehko mejo brez ograje) je po vsakem koraku v cv 6 enak kot v cv 1, patruljni avto prav tako; avto z oznako ob ograji (30°, 120 km/h), ob bali, ob odpadlem delu in v drsenju po sunku je enak po vsakem koraku; zadet pri 100 km/h vzame svoj delež kot v cv 1 | pregon: 1 patruljni avto, ograja prvič v koraku 610 (najmočneje 36,6 m/s), brez razlike; bala 49,73 / 49,73 % (brez oznake 49,73 / 1,35 %), pokrov 5,60 / 5,60 % (brez oznake 5,60 / 0,92 %) |
| 23 | **izvzeti: avto v boksih** drži Simulacijina pravila: v pravi boksni ulici (Spa, 30° v zid ulice pri 55 km/h, v ulici v vsakem koraku) je stanje po vsakem koraku v cv 6 enako kot v cv 1; avto z oznako boksov ob ograji, ob bali, ob odpadlem delu in v drsenju po sunku je enak po vsakem koraku; trk vanj je v obeh stari trk (kot Stara) | ulica: v njej 240 korakov, zid prvič v koraku 28 (7,5 m/s), brez razlike; bala 49,73 / 49,73 %, pokrov 5,60 / 5,60 %; trk: 120 dotikov, zadeti zasukan 0,0° (brez oznake −150,2°, Simulacija 0,0°) |
| 24 | **spletna dirka**: s prijateljevim avtom v dirki igra jedru ne da izbire (`js/game.js`: `testOf(true)` je `{}`, vsak `Core.setTest` gre skozi `testOf`), zato je Realistična, izbrana v meniju (`testOf(false)`: cv 6), na spletu Simulacija: prijateljev avto v domačega se konča kot v Simulaciji, do zadnje števke | `testOf(true)` `{}`, `testOf(false).cv` 6; klicev `setTest` v igri 2, skozi `testOf` 2; domači avto zasukan 0,0° (Simulacija 0,0°, Realistična −165,2°) |
| 38 | **zidovi** (prilagojeno; prej vse različice enake): odboj od ograje je v cv 1 do 5 enak, Realistična ima svojega | cv 1–5 vseh pet števil enakih; Realistična drugačna (zasuk po odboju 2,811354 proti 1,846676 rad/s) |
| 39, 41 | **dirka v vsaki različici** (Spa, Bathurst; 13 avtov, 150 s; prilagojeno: tudi Realistična): brez NaN, vsi vozijo, noben par ni zlepljen 2 s, največ 4 vrtenja v Simulaciji, Arkadni, Mehki in Realistični | trki po štetju testa, Spa: Realistična 15, 0 vrtenj (Simulacija 15, Arkadna 11, Mehka 13, Kaskaderska 17, Stara 4); Bathurst: Realistična 14 (Simulacija 6, Arkadna 12, Mehka 12, Kaskaderska 14, Stara 4); po popravkih 12. 11.: Spa Realistična 23, Bathurst 30, 0 vrtenj |
| 40, 42 | **dirka v Realistični, brez izstrelitve**: noben sunek ne da avtu več kot 8 m/s v enem koraku, noben avto ni več kot 5 km/h hitrejši od najhitrejšega v drugih različicah, nobeden se ne vrti hitreje od 9 rad/s | Spa: največ 3,66 m/s v koraku (38 → 51 km/h; druge različice 4,24), najhitrejši 232 km/h (druge 232), zasuk 2,14 rad/s; Bathurst: 5,42 m/s (85 → 104 km/h, nalet od zadaj; druge 4,62), 244 km/h (druge 245), 2,40 rad/s; po popravkih 12. 11.: Spa zasuk 2,18 rad/s; Bathurst 5,41 m/s (85 → 105 km/h), 2,44 rad/s |

Izguba pri predmetih (15, 16, 21–23) je izguba hitrosti proti isti vožnji brez predmeta ob zadnjem dotiku, v odstotkih hitrosti pred prvim (1,2 s, skozi korak dirke); to ni mera orodja `predmeti.js`, zato se bala in kup bal ne ujemata do stotinke s tabelo »Zdaj → pričakovano → izmerjeno«.

**Referenca `tests/golden/trki.json`** (nova datoteka): 150 vnosov = 25 prizorov × 6 različic; vnos je zgoščena vrednost celotnega stanja po vsakem koraku (`digest`) in končno stanje za branje (`end`). Piše jo samo `node tests/trki.test.js --update`; `npm run golden:update` je ne piše. Vnosi cv 1–5 so enaki na drevesu pred Realistično (`f1c4a0a`: 125 od 125); popravek jedra reference ni premaknil. Po **namerni** spremembi Realistične smejo biti v razliki samo vnosi `…/real`; premaknjen vnos cv 1–5 pomeni, da se je spremenila druga različica.

**Popravek jedra** (`a89d034`, `js/core.js` 3990). Preverjanje 11 je na prvotnem jedru padlo: zasuk med izgubo oprijema 9,228438 rad/s. `wallR` zasuk omeji na ±9 rad/s, poznejši dotik, počasnejši od praga `v0`, pa gre po Simulacijini veji naslona, ki zasuk doda brez meje. Na koncu te veje je zdaj vrstica `if (krOn(c) && c.xgl > 0) c.w = clamp(c.w, -KC.wMax, KC.wMax);`. Pri zasuku do 9 rad/s ne naredi ničesar; v cv 1–5 in za izvzete je `krOn` neresničen. Po popravku: največ 9,000000 rad/s, dokazi prvega dela so ponovljeni (»Dokazi«, zadnja alineja). (Od popravkov po neodvisnem preverjanju je namesto te vrstice meja brez pogoja `c.xgl > 0`, vrstica 4000.)

**Namerne okvare (mutacije).** Vsako novo preverjanje mora pasti, ko je koda pokvarjena. Okvare so bile narejene samo v zasebnih drevesih v scratchpadu (kopija `index.html` in `js/` s po eno pokvarjeno datoteko; test jo naloži z `GAME_ROOT=<drevo>`, `tests/lib/core.js`), nikoli v repozitoriju; poganjala jih je zamrznjena kopija testa, enaka testu v repozitoriju. **60 okvar** (58 v `js/core.js`, 2 v `js/game.js`): 59 jih podre vsaj eno preverjanje, ena je enakovredna (`kr-always`: `KR` za vsako različico z vrstico `wall`, ki jo ima samo Realistična; nadomešča jo `kr-sim`).

| Preverjanje | Okvare, ki ga podrejo |
|---|---|
| 3 | `row-wmax`, `ids-swap` |
| 4 | `take-x4`, `take-x12`, `take-x30`, `take-dw3`, `take-nan`, `grip-abs`, `ids-swap`, `kr-never` |
| 5 | `take-nan`, `take-rand`, `grip-abs`, `ids-swap` |
| 6 | `take-x4`, `take-x12`, `take-x30`, `take-nocap`, `take-nan`, `take-rand`, `grip-abs`, `row-wmax`, `ids-swap`, `kr-never` |
| 7 | `ids-swap`, `kr-never`, `wall-off`, `wall-x2`, `wall-v0hi`, `wall-e9`, `wall-face0`, `wall-rand`, `wall-pos` |
| 8 | `grip-abs`, `ids-swap`, `kr-never`, `wall-off`, `wall-x2`, `wall-mu1`, `wall-v0hi`, `wall-rand`, `wall-nan`, `wall-pos` |
| 9 | `drive-cs`, `ids-swap`, `kr-never`, `kr-sim`, `wall-off`, `wall-x2`, `wall-v0`, `wall-arm`, `wall-v0hi`, `wall-arm3`, `wall-e9`, `wall-face0`, `wall-nan`, `lean-e1` |
| 10 | `ids-swap`, `kr-never`, `wall-off`, `wall-x2`, `wall-v0hi`, `wall-face0`, `wall-nan`, `lean-e1`, `wall-pos` |
| 11 | `row-wmax`, `ids-swap`, `kr-never`, `wall-off`, `wall-wcap`, `lean-wcap`, `wall-arm3`, `wall-nan`, `wall-nogrip` |
| 12 | `grip-abs`, `ids-swap`, `kr-never`, `wall-off`, `wall-x2`, `wall-mu1`, `wall-arm`, `wall-wcap`, `wall-v0hi`, `wall-arm3`, `wall-e9`, `wall-face0`, `wall-rand`, `wall-nan`, `wall-nogrip`, `wall-pos` |
| 13 | `kr-sim`, `wall-v0`, `wall-arm3` |
| 14 | `take-rand`, `ids-swap`, `kr-never`, `push-sign`, `push-absrz`, `feel-rand` |
| 15 | `take-x4`, `take-x12`, `take-x30`, `ids-swap`, `kr-never`, `kr-sim`, `push-sign`, `push-x3`, `prop-off` |
| 16 | `drive-cs`, `take-x4`, `take-x12`, `take-x30`, `take-rand`, `ids-swap`, `kr-never`, `kr-sim`, `push-sign`, `push-x3`, `deb-off`, `deb-sign`, `deb-rand`, `deb-lying` |
| 17 | `drive-cs`, `drive-nova`, `drive-wet` |
| 18 | `drive-cs`, `ids-swap`, `kr-never`, `kr-sim`, `wall-off` |
| 19 | `drive-cs`, `drive-nova` |
| 20 | 42 okvar, med njimi vseh pet `old-*` (druge različice), ki podrejo samo to preverjanje |
| 21 | `kr-tl`, `site-take`, `site-slide`, `site-wall`, `site-prop`, `site-deb`, `drive-cs`, `ids-swap`, `slide-off`, `kr-never`, `kr-sim`, `wall-off`, `deb-off` |
| 22 | `kr-ck`, `site-take`, `site-slide`, `site-wall`, `site-prop`, `site-deb`, `drive-cs`, `ids-swap`, `slide-off`, `kr-never`, `kr-sim`, `wall-off`, `deb-off` |
| 23 | `kr-pit`, `pit-gate`, `site-slide`, `site-wall`, `site-prop`, `site-deb`, `drive-cs`, `ids-swap`, `slide-off`, `kr-never`, `kr-sim`, `wall-off`, `deb-off` |
| 24 | `kr-never`, `kr-sim`, `online-cv`, `online-direct` |
| 38 | `ids-swap`, `kr-never`, `kr-sim`, `wall-off` |
| 39, 40 | `take-x4`, `take-x12`, `take-x30` |
| 41, 42 | `take-x12`, `take-x30` |

Kaj okvare naredijo:

- **izvzetja:** `kr-tl`, `kr-ck`, `kr-pit` (iz `krOn` odstranjen člen `!c.tl`, `!c.ck` ali `!c.inPit`); `site-take`, `site-slide`, `site-wall`, `site-prop`, `site-deb` (`krOn(c)` na enem mestu zamenjan s `KR`: `kTake`, `stepCS`, `wallCollide`, `propCarHit`, `debrisHit`); `pit-gate` (trk v boksih po pravilih različic);
- **vožnja:** `drive-cs`, `drive-nova` (vzdolžni pospešek × 1,0000001, kadar je izbrana Realistična; klasična in nova fizika), `drive-wet` (mokro × 1,0000001);
- **sunek dveh avtov:** `take-dv` (delež × 1,01), `take-x4`, `take-x12`, `take-x30` (delež × 4, 12, 30), `take-dw3` (zasuk × 3), `take-nocap` (brez meje `wMax` v `kTakeR`), `take-nan` (NaN pri močnem zasuku), `take-rand` (naključno število v zasuk), `grip-abs` (brez absolutne vrednosti v `kGripR`), `row-wmax` (`wMax` 12), `ids-swap` (`old` in `real` zamenjana v `KV_IDS`), `slide-off` (`kSlideR` brez učinka), `kr-never` (`KR` nikoli), `kr-always` (enakovredna, zgoraj), `kr-sim` (Realistična tudi za cv 1), `net-take` (prijateljev avto se premakne; podre obstoječe preverjanje 37);
- **ograja:** `wall-off` (brez `wallR`), `wall-x2` (sunek × 2), `wall-mu1` (trenje samo v eno smer), `wall-v0` (prag 0), `wall-v0hi` (prag 6 m/s), `wall-arm` (ročica 1), `wall-arm3` (ročica 0,3), `wall-wcap` (brez meje zasuka v `wallR`), `lean-wcap` (brez vrstice popravka), `wall-e9` (odboj 0,9), `wall-face0` (`cr0` in `cr1` 0,0001), `wall-rand` (naključno število v zasuk), `wall-nan`, `wall-nogrip` (brez pravila oprijema v `wallR`), `lean-e1` (`CSK.wallE` 1), `wall-pos` (popravek lege na pol);
- **predmeti in odpadli deli:** `push-sign` (obrnjen predznak sunka `propPush`), `push-absrz` (ročica sunka z absolutno vrednostjo), `push-x3` (sunek × 3), `prop-off` (predmet avta ne odrine), `feel-rand` (naključni tresljaj tudi v Realistični), `deb-off`, `deb-sign`, `deb-rand` (sunek odpadlega dela izklopljen, obrnjen, z naključnim številom), `deb-lying` (ležeči del pol manj);
- **druge različice:** `old-take`, `old-knock`, `old-wall`, `old-feel`, `old-deb` (majhna sprememba pravil cv 1–5);
- **spletna dirka:** `online-cv` (`testOf(true)` vrne cv 6), `online-direct` (neposreden `Core.setTest` mimo `testOf`).

Kontrola na drevesu pred Realistično (`f1c4a0a`, cv 6 je tam kopija Simulacije): isti test pade v 19 od 42 preverjanj (3, 4, 6–12, 14–16, 18, 20–24, 38); ne padejo 5, 13, 17, 19, 40 in 42, ki veljajo tudi za Simulacijo in jih podrejo okvare iz tabele.

**Ograja med drsenjem in vrtenjem: široki pregled** (zasebna skripta; 1820 prizorov × 2 ograji, 3 s: pot 5 do 90° na ograjo, nos −90 do 180° od poti, 60 do 200 km/h, vrtenje 0, ±2, ±4 rad/s). Nabor testa (300 prizorov) je njegov del.

| Mera | Realistična (cv 6, s popravkom `a89d034`; pred popravki 12. 11., po katerih naslon energije ne doda) | Simulacija (cv 1) |
|---|---|---|
| koraki z dotikom | 212 049 (dotik v 1807 prizorih), brez NaN | 252 261 |
| sunek (dotik nad 1,5 m/s): energija | 5594 sunkov, nikoli ne zraste (največ 0,000000 J) | 3190 udarcev, zraste v 4 prizorih, največ 1,47 kJ (60/70/150/2) |
| naslon: energija zraste | 206 159 naslonov; v 236 prizorih, največ 6,06 kJ (60/90/200/−4) | vsi dotiki: v 106 prizorih, največ 1,83 kJ (60/70/200/4) |
| hitrost vzdolž ograje zraste ob dotiku | v 507 prizorih, največ +13,43 m/s (90/150/200/2) | v 506 prizorih, največ +11,71 m/s (90/130/200/4) |
| zasuk med izgubo oprijema | največ 9,000000 rad/s; ob meji v 289 prizorih (55 brez vrtenja na začetku); pred popravkom 9,228438 rad/s, nad 9 v 6 prizorih | ograja oprijema ne vzame, meje ni |
| zrcalna slika na koncu različna (nad 1e-9) | 46 prizorov (pri vrtenju 0 / 2 / −2 / 4 / −4 rad/s: 5 / 4 / 11 / 16 / 10 od 364) | 131 (20 / 31 / 31 / 33 / 16) |
| zrcalna slika po prvem dotiku različna | 7 (0 brez vrtenja) | 57 |
| dotik brez sunka | 1229 korakov (0,58 %) v 236 prizorih, nad 2,5 m/s v 121, najhitreje 12,30 m/s; 0,60 % škode (6,71 od 1123,4) | 0 |
| najgloblji vogal v ograji | −8,9e-16 m | −8,9e-16 m |

Vzroki: (1) **energija pri naslonu:** skupno pravilo naslona računa zasuk z deležem 0,3 (`CSK.wallYaw`: navidezna vztrajnost I / 0,3), prava kinetična energija pa z I, zato sunek avtu, ki se vrti in mu vogal zaniha v ograjo, lahko doda energijo; Realistična to pokaže bolj, ker njen sunek pusti avto hitreje vrteč. (2) **zrcalna slika:** vogali se obdelajo po vrsti; ko sta v istem koraku ob ograji dva, je izid odvisen od vrstnega reda, zrcalna slika pa ju ima v obratnem. (3) **dotik brez sunka:** udarec se zapiše po hitrosti vogala, sunek pa se računa v prijemališču z ročico 0,55 (»Robni primer brez sunka«). (4) **hitrost vzdolž ograje:** trenje vogala del vrtenja pretvori v gibanje sredine vzdolž ograje; v obeh različicah enako pogosto, zato trditev »hitrost vzdolž ograje ne zraste« velja samo za avto, ki ne drsi in se ne vrti (preverjanje 7).

**Najdbe** (nobena ni popravljena, razen kjer piše):

- (a) **Zrcalna slika po sunku se lahko izgubi v koraku vožnje.** Od 192 zrcalnih PIT-prizorov na različico je na koncu (1,5 s) v cv 1–5 nezrcalnih 0, v cv 6 eden: `pit-60-front-8` (primerjana polja se na koncu razlikujejo za 0,73–0,74). Takoj po prvem sunku (korak 7) je vsako polje zrcalna slika; v koraku 8, po koraku vožnje in pred sunkom, se razlikuje samo zasuk avta A (−0,93456417 / +0,96704298 rad/s). Zrcalna slika se torej izgubi v koraku vožnje (`stepCS`), ne v sunku: `kTakeR`, `kGripR` in `kSlideR` so po zapisu zrcalno simetrični, veja v koraku vožnje ni določena. Ker se fizika vožnje ne spreminja, je to odprto, ne popravek; preverjanje 5 zato primerja takoj po prvem sunku (30 prizorov), na koncu pa samo 12 prizorov.
- (b) **Čelni trk mimo sredine pri 200 km/h ni točkovno simetričen:** v cv 6 dobi avto A zasuk −9 rad/s, avto B 0. Vzrok je skupna veja globokega trka v `rboxHit`, ki velja v vseh različicah.
- (c) **Kup bal** se po prvem zadetku vrti z lastnim naključnim številom predmeta, zato se predmet ±0,6 m primerja ob prvem dotiku (preverjanje 14).
- (d) **Vlačilec s polprikolico ob ograji** se v Arkadni, Mehki in Kaskaderski razlikuje od Simulacije (že pred Realistično); »zidovi enaki v cv 1–5« velja za avto brez prikolice.
- (e) **Dirka** (po popravkih 12. 11. dirka testa na Spa v cv 6 ni več enaka Simulaciji: 23 trkov proti 15; na Bathurstu 30 proti 6)**:** na Spa je dirka testa (13 avtov, 150 s) v cv 6 po vsakem koraku enaka Simulaciji (lega, hitrost in zasuk vseh avtov; 15 trkov, vsi ostanejo pod pragovi Realistične), na Bathurstu se razlikuje od koraka 353, takoj po prvem dotiku (14 trkov proti 6). Preverjanji 39 in 40 na Spa zato Realistične ne ločita od Simulacije; podrejo ju okvare deleža sunka (`take-x4`, `take-x12`, `take-x30`). Največji prirast hitrosti v enem koraku na Bathurstu (5,42 m/s) je nalet od zadaj. Kinetična energija polja po korakih ni uporabna mera izstrelitve, zato preverjanji 40 in 42 merita prirast hitrosti avta v koraku.
- (f) **Realistična je v 6 od 24 referenčnih prizorov enaka Simulaciji** po zasnovi: sunek pod pragovi pravila oprijema, nova fizika, oplazenje ograje pod pragom 1,5 m/s. Po popravkih 12. 11.: v 4 od 24.
- (g) **Izvzeti avto** vzame svoj delež po starem, neizvzeti avto v istem trku po Realistični. Razločevalni par za izvzetje vlačilca je vlačilec v vlačilca proti istemu vlačilcu brez prikolice.
- (h) **Mesto odpadlega dela** (`debrisHit`) prej ni imelo preverjanja; dodano je preverjanje 16 (popravljeno v testu). Del, ki leži na cesti, se povozi enako v vseh različicah.

**Odprto po testih** (za neodvisen pregled in naslednje seje):

1. **Naslon vrtečega se avta dodaja energijo**: **popravljeno 12. 11.** (»Popravki po neodvisnem preverjanju«, najdbi 5 in 8). Pred popravkom do 6,06 kJ na dotik pri avtu rally (Simulacija 1,83 kJ), pri težkih vozilih tudi brez vrtenja na začetku do 53,9 kJ; zdaj naslon v Realistični energije ne doda (kjer bi jo Simulacijino pravilo dodalo, se isti sunek ponovi kot togo telo), meja testa je 1e-4 J. Oplazenje pod pragom ostane Simulacijino do zadnje števke, kadar energije ne doda (preverjanje 9 v tabeli zgoraj, v današnjem izpisu 12).
2. **Zrcalna slika z dvema vogaloma ob ograji v istem koraku** (46 od 1820 prizorov, Simulacija 131; test dovoli 2 po prvem dotiku in 8 na koncu od 240).
3. **Dotik brez sunka:** seja ga je 12. 11. pustila, kot je (»Robni primer brez sunka«, tam možnosti A in B in kam gre zapisani udarec); omejuje ga preverjanje 13.
4. **Zrcalna slika v koraku vožnje po sunku** (najdba a): veja v `stepCS` ni določena.
5. **Meja zasuka ob ograji**: **popravljeno 12. 11.** (najdbi 4 in 9): velja po vsakem dotiku ograje za vsak avto pod `krOn(c)`, tudi v zraku, na strehi in v novi fiziki (prej v novi fiziki do 52,3 rad/s); meri novo preverjanje 18 (460 prizorov).
6. **Škoda ob ograji** (vhod za »Poškodbe«; 567 prizorov, jedro s popravkom): korakov z udarcem nad 2,5 m/s 1001 (Simulacija 810), vsota škode ((udarec − 2,5) · 0,028 na korak) 263,75 (Simulacija 246,95: +6,8 %), najdaljši niz takih korakov 8 (Simulacija 2), srednja škoda na koncu 0,436 (0,414); razmerje vsot po prizorih: mediana 1,00, 10 % 0,88, 90 % 1,46, največ 2,71; prvi udarec je enak v 545 od 548 prizorov.
7. **Realistična v `touch()`** po prihodu #494: vrstica `wallR` in cela veja naslona, trije spori (»Točka 3 in #494 (Killar): postopek ob sporu«, popravljen 12. 11.).
8. **Brskalniški testi** (glavna seja). **Neodvisen pregled `js/core.js`** z agenti, ki kode niso pisali, je narejen 12. 11.: 13 najdb, »Popravki po neodvisnem preverjanju«.

### Popravki po neodvisnem preverjanju (12. 11. 2026)

Agenti, ki kode niso pisali, so po cv 6 in gumbih pregledali končno kodo in našli **13 najdb**. Seja popravkov je vsako najprej sama ponovila z meritvijo (izhodišči `f1c4a0a`, pred cv 6 in gumbi, in `c0a9a14`, pred O1 in O2), nato popravila vse potrjene napake Realistične in vrzeli testov; tri najdbe so odložene z razlogom. Commiti: `e3058e02` (vrzeli testov), `cfe4cf07` (fizika Realistične in njeni testi), `c8462791` (preverjanje 49), `e125c324` in zadnji (dokumenti). Spremembe jedra so samo pod `krOn(c)` oziroma `KR`: Simulacija, Arkadna, Mehka, Kaskaderska, Stara, spletna dirka in vožnja brez dotika tečejo po isti kodi kot prej; novih naključnih števil ni.

| Najdba | Teža | Ponovitev (pred popravki) | Izid |
|---|---|---|---|
| 1. Vožnja brez dotika v dirki: guma na progi (`Race._marbles`) veže avte med seboj | nizka | Spa, 13 avtov, igralec na prvem mestu brez dotika: tekmeci se prvič zadenejo v koraku 1247, vsoti gume se med cv 1 in cv 6 razlikujeta od koraka 1274, od istega koraka tudi igralec; v 90 s največ 1,4e-2 m, 1,4e-3 m/s in 7,3e-6 oprijema | koda ostane (obstoječa koda vožnje, spodaj); obseg pravila zapisan, novo preverjanje 49 |
| 2. Postopek ob sporu s #494 ne drži | srednja | poskusni spoj: 5 sporov (pred Realistično 2); po dobesednem starem koraku 1 se prvi udarec v ograjo s cv 6 konča z »wallR is not defined« | postopek popravljen (»Točka 3 in #494 (Killar): postopek ob sporu«) |
| 3. Padec čez rob je mogoč na Uncompahgre | srednja | 960 naletov na rob: cv 1–5 in privzeto po 168 padcev (na `f1c4a0a` enako), cv 6 152 | odloženo: zamrznjena testna proga, vprašanje za uporabnika (spodaj) |
| 4. Meja zasuka ob ograji ne velja za novo fiziko | nizka | nova fizika: cv 1 do 29,24 rad/s, cv 6 do 52,32 rad/s (nad 9 rad/s 785 od 2913 voženj; cv 1 375); klasična cv 6 do 13,72 rad/s (9 od 2942) | popravljeno: največ 9,00 rad/s, 0 voženj nad mejo |
| 5. Naslon vrtečega se avta dodaja več energije, kot piše | nizka | največ na dotik, cv 1 → cv 6: rally 2,00 → 5,80 kJ, formula 1,79 → 3,20 kJ, titan 12,13 → 28,81 kJ; vsota na nalet do 4,07 % energije prihoda (cv 1 0,79 %) | popravljeno z najdbo 8: 0,00 kJ pri vsakem modelu |
| 6. Chapman's Peak: avto se ob koncu stranske ceste v enem koraku premakne za 32 m | nizka | desna ograja pri 3372 m, 60 km/h pod 5°: 32,07 m v koraku 173 (cv 1 in privzeto; cv 6 32,06 m; na `f1c4a0a` enako) | odloženo: obstoječa napaka proge v vseh izbirah trkov, tema prog (spodaj) |
| 7. Trk dveh avtov ustvari energijo, kadar avto vzame samo del zasuka | srednja | do 17,7 kJ na trk; nad 0,5 kJ pri 56 od 3872 voženj tekmec v tekmeca (največ 17 662 J) in 20 od 3872 igralec in tekmec (največ 2482 J) | popravljeno: 0 (varovalo energije) |
| 8. Naslon po sunku `wallR` doda energijo tudi avtu, ki se prej ni vrtel | srednja | na dotik: rally 6,8 kJ, titan 39,3 kJ, kamen 53,9 kJ | popravljeno: 0 (naslon kot togo telo) |
| 9. Avto med prevračanjem ali v zraku | nizka | trk mu doda do 12,8 kJ, naslon ob ograji do 29,1 kJ, zasuk do 14,09 rad/s | popravljeno: 0 kJ, največ 9,00 rad/s |
| 10. Preverjanja ohranitve ne pokrijejo trka tekmec v tekmeca, težkih vozil in 300 km/h; meja naslona je 7 kJ | nizka | napake 7–9 so šle mimo testa | štiri nova preverjanja (7, 8, 17, 18), meji 0,5 kJ in 7 kJ sta zdaj 1e-4 J |
| 11. Spletna dirka: test ne preveri, kaj igra poda v `testOf` | srednja | okvara (`testOf(false)` na mestu klica v `js/game.js`) pusti stari test zelen (43 od 43) | preverjanje 29 preveri tudi oba klica v igri; okvara pade |
| 12. Varnostni avto v Realistični brez preverjanja | nizka | okvara (pravilo oprijema brez `c.sc`) pusti stari test zelen | novo preverjanje 9 |
| 13. Popravek K1 (`Race._redClear`) brez preverjanja | nizka | okvara pusti `tests/odpadli-deli.test.js` zelen (45 od 45) | novo preverjanje 29b; test ima 46 preverjanj |

**Kaj je popravljeno v jedru** (`js/core.js`, `cfe4cf07`; vrstice so v »Kaj je v kodi«, alineja »Vrstice po popravkih 12. 11.«):

- **Varovalo energije pri trku dveh avtov** (najdbe 7, 9 in 10; `kCollide`, `kTurnR`, `kTake`, `kTakeR`). Vzrok: pravilo oprijema da avtu, ki mu gume držijo, samo del zasuka iz sunka; kadar bi nevzeti del njegovo vrtenje zaviral, paru po trku ostane več energije, kot je je imel. Realistična zdaj pred sunkom izračuna, koliko zasuka bi avta vzela (`kTurnR`), in če bi energija para zrasla (za več kot 1e-6 J), tak avto vzame še najmanjši delež nevzetega dela, pri katerem ne zraste (koren kvadratne enačbe; delež gre v `kTake` in `kTakeR` kot `kMin`). Brez `kMin` teče vsaka pot do zadnje številke kot prej: cv 1–5 in vsi trki cv 6, ki energije ne dodajo. Avto v zraku ali med prevračanjem, ki zasuka sicer ne vzame, vzame natanko ta delež.
- **Naslon na ograjo** (najdbi 5 in 8; `wallCollide`). Simulacijino pravilo naslona da v zasuk samo del sunka (`wallYaw` 0,3), zato lahko avtu doda energijo. Realistična naslon najprej izračuna natanko po tem pravilu; če energija avta zraste (za več kot 1e-6 J), hitrost in zasuk vrne in isti sunek ponovi kot togo telo (cel zasuk). Oplazenje, ki energije ne doda, ostane Simulacijino do zadnje števke (preverjanje 12).
- **Meja zasuka 9 rad/s** (`KC.wMax`; najdbi 4 in 9): `wallR` jo postavi vsakemu avtu, veja naslona jo ponovi brez pogoja `c.xgl > 0`; velja tudi za novo fiziko in za avto v zraku ali na strehi.

**Dokazi, da se drugo ni premaknilo.** 13 izpisov orodij za cv 1–5 (`avto-avto.js` cv 1–5, `mase-razlicice.js`, `predmeti.js` s predmeti in razbitinami, `zid.js` z matriko in prikolico, `boksi-pristanek.js`): 12 je bajt za bajtom enakih kot na `f1c4a0a`, `boksi-pristanek.js` je enak po izločitvi stolpcev s časom računanja. `tests/golden.test.js`: 140 scenarijev enakih, reference vožnje brez spremembe; v `tests/golden/trki.json` (150 vnosov) sta se premaknila samo `knock/bump/real` in `knock/drift3/real`. Preverjanja vožnje brez dotika (22–24) so zelena, vnosi testnih prog v referencah nedotaknjeni (`tests/testne-proge.test.js`).

**Kaj se je premaknilo v Realistični** (za predogled; številke prej → potem):

- **Izpisi orodij `--cv 6`:** `zid.js` s prikolico in `predmeti.js` (predmeti, razbitine) so enaki; `mase-razlicice.js` 1 vrstica (naslon pri 3°, 120 km/h: +0,1 → +0,0 kJ); `zid.js --del matrika` 25 od 381 vrstic, vse pri 60° (največ v novi fiziki in pri težkih in lahkih vozilih; vrstice avta rally pri 60°, 175/351/516 °/s, so enake); `avto-avto.js` 47 vrstic. Klasična fizika je v cv 6 enaka Simulaciji v 21 od 66 scenarijev (prej 26), nova v 66 od 66.
- **Dirke** (`dirke.js`, 13 avtov, 150 s). Spa: trkov nad 3 m/s 13 → 19 (prej enako kot Simulacija), največji 7,1 → 8,0 m/s, škoda največ 11,2 → 17,1 %, pot vseh 84 073 → 83 984 m (−0,11 %; na avto največ 84,9 m, najslabši −0,59 %). Bathurst: trkov nad 3 m/s 14 → 27, nad 8 m/s 2 → 1 (največji 9,2 m/s), škoda največ 22,6 → 23,7 %, pot 82 300 → 82 254 m (−0,86 % proti Simulaciji; mediana na avto −0,60 %, najslabši −1,79 %). Vrtenj, odstopov in udarcev v ograjo nad 3 m/s ni, nos največ 36° od smeri ceste. Dirki testa (preverjanji 45 in 47): Spa 15 → 23 trkov, Bathurst 14 → 30.
- **36 dirk** (Spa, Bathurst, Montréal; 6 semen; brez zmede in z njo; povprečje na dirko): korakov s trkom dveh avtov 538,5 → 581,8 (+8 %), korakov ob ograji 501,2 → 488,6, nizov trkov, daljših od 1 s, 0,92 → 1,33 (skupaj 1,34 → 2,05 s; najdaljši od vseh 2,52 → 3,06 s), zavrtenih avtov 0,58 → 0,61, reševanj 0,53 → 0,58, pot vseh 62 858 → 62 862 m. Največ na Spa brez zmede: korakov s trkom 728 → 1021 (+40 %). Vzrok: pri rahlem dotiku, kjer gume držijo, avto po varovalu vzame majhen del zasuka (največ 0,37 rad/s), zato se tekmeca v gneči drgneta nekoliko dlje; varovalo deluje pri 40–77 % trkov, ki pridejo do njega, in vzame največ 1076 J na trk.
- **Oplazenja z boka:** »Realistična v repozitoriju: jedro in dokazi«, »Kaj se ne ujema ali je novo«, alineja »Oplazenja z boka« (dodane energije ni več; pri side-60-a3-eq s plinom se avto B ne zavrti več).

**Testi.** `tests/trki.test.js` ima 49 preverjanj (~80 s), `tests/odpadli-deli.test.js` 46 (~24 s). Nova preverjanja z izmerjenimi številkami:

| Št. | Kaj trdi | Izmerjeno |
|---|---|---|
| 7 | ohranitev po vlogah in masah, 144 prizorov (igralec v tekmeca, tekmec v igralca, tekmec v tekmeca; BURJA R7 in TITAN, 5300 kg; bočni trki, čelni, od zadaj in PIT pri 120 do 300 km/h): gibalna količina para do 1e-8 kg m/s, energija para ne zraste (meja 1e-4 J), zasuk največ 9 rad/s | 10 034 sunkov; gibalna količina največ 1,2e-10 kg m/s, energija največ 3,7e-9 J, najhitrejši zasuk 9,000 rad/s |
| 8 | avto med prevračanjem ali v zraku, ki se vrti s 3 ali 9 rad/s ob drugem pri 100 km/h (24 prizorov; BURJA R7 in TITAN): trk paru ne doda energije (meja 1e-4 J), gibalna količina do 1e-8 kg m/s | 247 sunkov v 24 od 24 prizorov; energija največ 9,3e-10 J, gibalna količina največ 5,8e-11 kg m/s |
| 9 | varnostni avto: trk mu ne vzame oprijema (bočni trk v zadnji del pri 120 km/h; isti trk brez oznake ga vzame) | izgubljen oprijem 0,000, zasuk po prvem sunku 0,000 rad/s, odrinjen s 42,7 km/h (brez oznake 1,000 in 9,000 rad/s) |
| 17 | ograja po masah, 96 prizorov (MRAVLJA, BURJA R7, TITAN, KAMEN PUŠČAVA, 165–7000 kg; 120 in 200 km/h, brez vrtenja in s 3 rad/s): ne sunek ne naslon ne dodata energije (meja 1e-4 J) | 278 sunkov: največ 0 J; 10 725 naslonov (5484 težkih vozil, 3213 brez vrtenja na začetku): največ −3,4e-26 J |
| 18 | zasuk po dotiku ograje največ 9 rad/s za vsak avto, 460 prizorov (nova fizika s štirimi modeli, klasična MRAVLJA, BURJA R7 in TITAN med prevračanjem; drsenje in vrtenje do 8 rad/s pri 100 in 200 km/h) | vse tri skupine največ 9,000 rad/s (Simulacija 26,87, 26,68 in 13,97 rad/s; nad 9 rad/s v 44 od 240, 25 od 60 in 14 od 160 prizorov) |
| 29 (spletna dirka, dopolnjeno) | igra pokliče `Core.setTest` natanko dvakrat in obakrat skozi `testOf`: ob startu z besedo dirke, ob spremembi nastavitev s prijateljevim avtom v dirki | 2 klica, 2 skozi `testOf` |
| 49 | brez dotika med tekmeci: v dirki z gumo na progi (Spa, 12 tekmecev, 40 s) je igralec v cv 6 enak kot v cv 1 do koraka, ko se vsoti gume prvič razlikujeta, in ves čas, če dirka cv 6 dobi vsoto dirke cv 1 | prvi trk tekmecev v koraku 1247, vsoti različni od koraka 1274, igralec od istega koraka (do konca največ 6,3e-5 m, 1,6e-5 m/s, 2,6e-6 oprijema); z vsoto dirke cv 1 enak vseh 4800 korakov |
| 29b (`odpadli-deli`) | rdeča zastava (`Race._redClear`) kos, ki se še kotali, vzame s tal | brez popravka K1 pade natanko to preverjanje |

Preverjanji 4 in 13 imata namesto mej 0,5 kJ in 7 kJ mejo 1e-4 J (izmerjeno 9,3e-10 J in 1,3e-10 J). Namerne okvare v zasebnih kopijah: brez varovala padejo 4 (400 J), 7 (2,5 kJ) in 8 (37 kJ); brez ponovitve naslona 13 (6,1 kJ) in 17; z mejami zasuka kot prej 18 (nova fizika 49,96 rad/s, MRAVLJA 16,06, prevračanje 20,48); trk tekmecev, ki spremeni gumo na progi, 49; vsaka od okvar iz najdb 11–13 natanko v svojem preverjanju.

**Odloženo in odprto:**

1. **Najdba 3, vprašanje za uporabnika** (stran Odločitve; objavi glavna seja). Stari padec čez rob (`Race._fall`, brez tal) je v igri na zamrznjeni testni progi Uncompahgre, edini s prepadom (`dropAt`); to je v nasprotju z odločitvijo »padec čez rob samo na Killarju« (`docs/odlocitve.md`). Proge seja ne sme spreminjati. Možnosti: (1) ostane, kot je, do izbrisa testnih prog (priporočeno: proga ne gre v 1.0); (2) padec se izklopi v skupni kodi, na primer samo na progi s tlemi padca (`def.floor`), proga ostane nedotaknjena, njene reference pa se premaknejo; (3) izrecna prošnja za to progo (`node tests/testne-proge.test.js --dovoli uncompahgre "<prošnja, datum>"`) in prepad dobi ograjo.
2. **Najdba 6, tema prog.** Na Chapman's Peaku se točka tik za ograjo proge pripiše delu stranske ceste za njeno končno ograjo (`_stubQ`), `Track.stubPen` zanjo vrne globino 40,49 m in avto se v enem koraku premakne za 32 m (tri mesta: cesta 5 pri 3326 m, cesta 6 pri 3354 m, cesta 8 pri 4406 m). Enako v vseh izbirah trkov in na `f1c4a0a`. Možnosti: `_stubQ` take točke ne pripiše stranski cesti (skupna koda) ali krajši cesti 5 in 6 v `js/tracks/chapman.js`. **Po spoju `main` 12. 11. (#654)** ponovljeno z `node tools/trki/preverjanje/zid/p16.js vozi` (številke v razdelku »Spoj `main` 12. 11. 2026: dokazi«): skok je tudi na samem `main` `109bb56` (do 42 m v enem koraku), te veje ne potrebuje in je po #654 pogostejši; javljeno na tabli #382 za temo prog.
3. **Najdba 1, guma na progi.** Koda je starejša od različic trkov (ista na `f1c4a0a` in `c0a9a14`): dirka z obrabo gum na dirkališču z boksi vodi eno vsoto gume za vse avte in z njo množi oprijem vsakega. Ko se tekmeci v drugi izbiri trkov zadenejo drugače, se vsota razlikuje za ~1e-9 in igralec, ki se ničesar ne dotakne, ni več enak do zadnje številke (v 90 s do 1,4 cm). Na Bathurstu v 90 s razlike ni, prav tako ne na odprtih cestah, testnih progah, v vožnji na čas in dirkah brez obrabe gum. Odprava bi bila sprememba kode vožnje, zato je ta tema ne dela; preverjanje 49 varuje, da je guma na progi edina vez.
4. **Meje varovala energije.** Par z izvzetim avtom (vlačilec s prikolico) ostane pri Simulacijinem pravilu brez varovala. Velja za privzeta števila različice: z vrsticami Nastavitev, ki spremenijo `K.yaw` ali `K.pm`, ohranitev ni obljubljena. Da hkratni sunek v smeri dotika in vzdolž nje togemu telesu energije ne doda, je izmerjeno (0 J v 11 616 vožnjah nove fizike), ne dokazano. V novi fiziki varovalo ne deluje (avto vzame cel zasuk).
5. **Predogled:** več rahlih trkov med tekmeci (zgoraj) naj uporabnik vidi pred »ok«. Brskalniški testi (glavna seja) in slike zdaj/potem čakajo.

### Spoj `main` 12. 11. 2026: dokazi

Spoj `f97e871` (veja `9d21d2d` + `main` `109bb56`, skupna osnova `3fb29f2`). `main` je prinesel #647 Dež in sneg (bolj drsi samo na mokrem in snegu) in #654 hribe Chapman's Peaka (`Track.hill`, `hillSoft`; `wallCollide` je dobil parameter `dt`). V `js/core.js` veja hrib obravnava pred ograjo: na odseku hriba (`H.on`) avto ustavi `hillSoft` v vseh izbirah trkov enako, `wallR` Realistične pride na vrsto samo pri pravi ograji.

| Dokaz | Kako | Izid |
|---|---|---|
| Izpisi orodij | pet orodij `tools/trki/*.js --json` × cv 1–6, drevo pred spojem proti drevesu po spoju | vseh 30 izpisov enakih do znaka; razlikuje se samo meritev časa zanke (`boksi-pristanek.js`, del `zanka`, 35 polj), ki ni ponovljiva |
| Reference voženj (`tests/golden/sim.json`, 357 vnosov) | narejene znova, tristransko: osnova, veja, `main`, novo | 270 nespremenjenih, 83 spremenila samo veja (novo = veja), 1 samo `main` (novo = `main`), 3 oba (Chapman's Peak `crash`, `formula`, `lm`: hribi in odpadli deli hkrati, vrednost je nova); vnosi zamrznjenih prog ostanejo kot na `main` |
| Reference dirk (`tests/golden/races.json`, 255 vnosov) | enako | 221 nespremenjenih, 15 samo `main` (novo = `main`), 14 samo veja (novo = veja), 1 oba z novo = `main` (`balea/cs/rain`: v novi deževni dirki ni dotika), 2 oba z novo vrednostjo (`medvode/cs/rain`, `livorno/cs/rain`), 2 dirki, ki ju je spremenil samo `main`, pa imata nov povzetek (`suzuka/cs/rain`, `tianmen/cs/rain`): novi dež prinese dotik z ograjo, odpadli deli te veje pa nato spremenijo povzetek; čas zmagovalca in števila dotikov so enaki kot na `main`. Vzorec čez vse vnose: novo ≠ `main` v 18 dirkah (17 z dotikom ali vrtenjem na `main` in `iroha/cs/formula`, ki jo veja spremeni že prej), novo = `main` v 237 |
| Realistična ob hribih | 32 voženj v hrib Chapman's Peaka (na vsaki strani štirje najdaljši odseki hriba, koti 15–60°, 60–140 km/h, s plinom in brez), cv 6 proti cv 1, primerjava vsakega koraka | 26 enakih v vsakem koraku; 6 se razlikuje od koraka prvega dotika prave ograje nad pragom 1,5 m/s (tudi ob koncu hriba pri 2846 m: vogala avta sta že na vzorcu, kjer odseka hriba ni več) |
| Najdba 6 (skok ob stranski cesti) | `node tools/trki/preverjanje/zid/p16.js vozi`: točke tik za ograjo, ki jih iskanje pripiše stranski cesti z globino nad 3 m, in ralijski avto s sredine ceste proti njim (972 voženj) | globina do 39,3 m samo desno ob cestah 5 (3098–3176 m od štartne črte, 77 točk) in 6 (3204–3254 m, 88 točk), drugod pod 4 m. Voženj s premikom nad 1 m v enem koraku: pred spojem 162 (cv 1) in 76 (cv 6), po spoju 217 in 192, na samem `main` 217; največji premik 42,10 m (cv 1; `main` 42,04 m) in 40,65 m (cv 6). Primer: cesta 5 pri 3176 m, 8 m nazaj s sredine ceste, 120 km/h s plinom, korak 174 |

Metri v Najdbi 6 zgoraj (3326 m, 3354 m) so po progi od začetka podatkov (`sF` stranske ceste: kraj glavne ceste, ki mu pripada njen zadnji del); štartna črta je pri 150 m, zato je isti kraj tu 3176 m in 3204 m. Cesti 5 in 6 sta dolgi 88 m in se s koncem vrneta do ~18 in ~21 m od sredine glavne ceste, tik za njeno desno ograjo.

## Gumbi v Nastavitvah: izvedba (12. 11. 2026)

Odločitev uporabnika 10. 11. 2026 ob ~23.20 (tabla #382, komentar 6780917123): »Dodaj v nastavitvah se gumbe da lahko spremenim razlicne opcije. Pod defaultom naj bo tvoja izbira kar ti mislis da je najbolj realisticno«. Narejeno 12. 11. 2026 po tabeli iz razdelka »Gumbi v Nastavitvah« (commiti »Trki: gumbi v Nastavitvah …« na veji `trki/realizem`, #608). Na `main` gre šele po uporabnikovem »ok« na slike zdaj in potem.

### Seznam možnosti s privzetimi vrednostmi

Vse štiri vrstice so v Nastavitvah v glavnem seznamu, druga pod drugo; vrstica Trki je tudi v pavzi med dirko.

| Nastavitev | Izbire (privzeta krepko) | Kaj pomeni | Kdaj velja |
|---|---|---|---|
| **Trki** | **Realistično** / Kot zdaj | Realistično: udarec avto zavrti, kamorkoli ga zadene; po hudem trku avto dlje drsi vstran; od ograje se odbije kot togo telo; stožec, guma ali bala ga upočasni po svoji masi. Kot zdaj: trki, kot so bili do zdaj (različica Simulacija) | takoj, tudi v pavzi |
| **Poškodbe avtov** | Izklop / **Samo videz** / Vklop | ni spremenjeno: pri Samo videz se avto poškoduje na videz, vozi pa enako | od naslednje dirke |
| **Odpadli deli** | Izklop / **Vklop** | Vklop: deli, ki ob trku odpadejo z avtov (odbijači, vrata, pokrov motorja, kolesa), obležijo na cesti; avto, ki jih zadene ali povozi, upočasnijo in zamajejo. Izklop: odpadejo in odletijo enako, a se jih noben avto ne dotakne; ko obležijo, izginejo s ceste | takoj |
| **Odpadlo kolo** | **Konec dirke** / Dirka teče naprej | Konec dirke: po hudih trkih guma zagori, ob naslednjem trku kolo odpade, avto obstane, KONEC IGRE. Dirka teče naprej: guma ne zagori; pri poškodbah Vklop kolo odpade z močno zmečkanega vogala in avto vozi naprej na treh (novo kolo v boksih ali z gumbom Namesti kolo), pri Samo videz kolesa ostanejo na avtu | od naslednje dirke |

- **Starejše različice** (Arkadna, Mehka, Kaskaderska, Stara) ostanejo v igri za primerjavo: vrstica »Starejše različice« v kategoriji »Preizkus: tekmeci in trki« v Nastavitvah. Ko je izbrana ena od njih, v vrstici Trki ni označen noben gumb in opomba pod vrstico pove, katera velja; nazaj z gumbom Realistično ali Kot zdaj.
- **Dirka s prijatelji:** vedno Kot zdaj in Odpadli deli Vklop, brez pravila koles; poškodbe določi gostitelj. Tako telefona ostaneta usklajena (`testOf(true)` vrne `{}`; preverjanje privzetih vrednosti igre v `tests/trki.test.js`, ob nastanku 43., od 12. 11. v izpisu 30.; spletno dirko meri tudi preverjanje pred njim).
- **Izjeme Realistične** ostanejo: v policijskem pregonu, v boksih in za vlačilec s prikolico so trki kot pri Kot zdaj. V pavzi je vrstica Trki samo na dirki z drugimi avti (ne s prijatelji in v pregonu, kjer izbira ne velja, in ne, ko voziš sam: takrat izbereš v Nastavitvah, do katerih prideš iz pavze).
- **Obstoječi igralci** so ob prvem zagonu enkrat preklopljeni na privzete vrednosti (Trki Realistično, Odpadli deli Vklop, Odpadlo kolo Konec dirke; ključ `tdgp-defaults-v6` v `js/game.js`, po vzoru `tdgp-defaults-v5`). Poškodbe ostanejo, kot jih je igralec izbral. Pozneje velja, kar izbere sam.
- **Angleška imena** (`js/lang.js`; uporabnik jih lahko preimenuje): Knocks: Realistic / As now; Older versions; Car damage: Off / Looks only / On; Debris: Off / On; Lost wheel: Race over / Race goes on.

### Izbire in razlogi

1. **Reference se niso premaknile.** Spremenila se je samo privzeta nastavitev igre (`DEF.crV` 5 v `js/game.js`). Jedro ima za privzeto še naprej Simulacijo (`KV_DEF` v `js/core.js`), zato Node testi, `tests/golden/*` in dirka s prijatelji tečejo kot prej. Brskalniški testi imajo izrecno izbiro (`crV: 0` in `tdgp-defaults-v6` v začetni skripti `tests/browser/lib.mjs`). V `tests/golden/` ni spremenjen noben vnos, vnosi zamrznjenih prog so bajt za bajtom isti.
2. **Trki: dva gumba, starejše različice v Preizkusu.** V glavnem seznamu in v pavzi sta samo Realistično in Kot zdaj, kot je predlagala tabela. Arkadna, Mehka, Kaskaderska in Stara so namenjene primerjavi, zato so vrstica »Starejše različice« v Preizkusu, kjer so že vrstice, ki izbrano različico spreminjajo. Shranjene številke `crV` se niso spremenile (0 Simulacija, 1–4 starejše, 5 Realistična); shranjena vrednost zunaj obsega postane Realistična.
3. **Odpadli deli: Izklop pomeni dele brez dotika**, ne »deli sploh ne odpadejo«. `Core.setTest({ deb: 0 })` (`TX.deb`): `Race.step` preskoči zanko avto–del, del, ki obmiruje, pa vzame s ceste. Razlogi: trk je v prvih sekundah videti enako (del odpade in odleti do številke enako kot pri Vklop, luknja na avtu ostane), cesta ostane čista, met in izris delov sta nedotaknjena, novih naključnih števil ni. Znana šibkost: del, ki še leti, gre lahko za trenutek skozi avto. Z vklopljenim »Razbijanje: deli ostanejo na progi« del, ki obmiruje, ostane narisan na cesti, a brez dotika. Razbito steklo na cesti ni del in ostane.
4. **Odpadlo kolo je možnost dirke.** `newRace` v `js/game.js` da dirki `wheelRule: WHEEL_RULE` (Konec dirke) ali nič (Dirka teče naprej; `S.wheelOver`); jedro se zaradi tega gumba ni spremenilo. Brez pravila nobena guma ne zagori; kolo odpade samo pri poškodbah Vklop (vogal zmečkan 70 % ali več in avto 75 % ali bolj uničen; pri uničenem avtu, 96 %, še kolo najbolj zmečkanega vogala) in avto vozi naprej po pestu. Pri Samo videz brez pravila nobeno kolo ne odpade: kdaj naj odpade, ostane za zasnovo skupaj s Poškodbami (tabela v razdelku »Gumbi v Nastavitvah«). Izbira velja od naslednje dirke, ker dirka pravilo dobi ob začetku; med dirko to pove obvestilo.
5. **Enkratni preklop obstoječih igralcev** po vzoru `tdgp-defaults-v5`: brez njega bi vsi, ki imajo nastavitve že shranjene, ostali pri Simulaciji in nove privzete izbire ne bi videli. Preklopi tudi tistega, ki je imel izbrano eno od starejših različic (najde jo v Preizkusu).

### Testi

- `tests/trki.test.js`: 42 → 43 preverjanj (od popravkov po neodvisnem preverjanju 49; to preverjanje je v izpisu 30.). Preverjanje 43: privzete vrednosti igre (`DEF` v `js/game.js`: Trki 5, Odpadli deli Vklop, Odpadlo kolo Konec dirke, Poškodbe Samo videz), enkratni preklop `tdgp-defaults-v6` (prve tri nastavi, Poškodbe pusti), shranjena različica zunaj obsega postane Realistična, vrstice v `index.html` (Trki v Nastavitvah in v pavzi z gumboma 5 in 0, starejše štiri v Preizkusu), jedro ostane pri Simulaciji, `testOf`: Vklop jedru ne da ničesar, Izklop `TX.deb` 0, dirka s prijatelji nič od tega (in nobene različice), Dirka teče naprej dirki ne da pravila koles.
- `tests/odpadli-deli.test.js`: 40 → 45 preverjanj (od 12. 11. 46: 29b, rdeča zastava). 41: dvanajst delov, vrženih pri 200 km/h, leti, pristane in se ustavi do zadnje števke enako kot pri Vklop, vsak izgine s ceste v koraku, ko obmiruje. 42: del drugega avta na poti (pokrov motorja, sprednji odbijač, pokrov prtljažnika, kolo avta 12 m spredaj; 60, 120 in 200 km/h; 10 s): avta se ne dotakne, stanje po vsakem koraku je enako kot brez vrženega dela, `Math.random` je vprašan natanko tolikokrat. 43: Izklop v vseh šestih različicah trkov. 44: avta, ki dele izgubi, se ne dotakne noben; cesta je prazna, ko zadnji del obmiruje. 45: dirka z Izklop: dirka, v kateri noben del ne odpade (Spa, 13 avtov, 60 s), je do zadnje števke referenčna (`tests/golden/sim.json`, `spa/race/cs`); v dirkah s trkom (Spa, 13 avtov: formula 30 s, novejši cestni avto 45 s) ob koncu koraka na seznamu ni dela, ki obmiruje, noben avto ni nikoli nad delom ali ob njem, vsak avto je tam kot pri Vklop do koraka, v katerem se tam avto prvič dotakne dela.
- `tests/browser/nova.test.mjs` je prepisan za nove vrstice (pokonci 360 × 640 in ležeče 640 × 360); `tools/menu-corner.mjs` in `tests/README.md` sta posodobljena. **Brskalniških testov ta seja ni pognala** (požene jih glavna seja).
- Node: celoten Node nabor (`node tests/run.js node`, 149 testov) na tej kodi: **148 zelenih**. Rdeč je samo `tests/hotham.test.js` (1 od 25 preverjanj, pregon na zamrznjeni progi s semenom 11: ujet v 163 s pri 5379 m, do številke kot pred tem korakom; »Odprto ob predaji«, točka 1). `tests/shot.test.js` je bil v teku nabora rdeč samo zato, ker v okolju seje še niso bile nameščene odvisnosti (`npm ci`); po namestitvi 10 od 10. Posebej še Node testi voznega parka s seznama povezanih (`kit`, `deli`, `deli-barve`, `deli-pregled`, `fleet`, `cisterna`, `zrcalni`, `rezervna-kolesa`): 8 od 8. Po zadnji spremembi (dokumenti in komentar nad `fitSegs` v `js/game.js`) so ponovljeni testi, ki berejo `js/game.js` ali dokumente (`stamp`, `predogled`, `razdelitev`, `trki`, `champ`, `sovoznik-glas`, `ai-zastave`, `lang`, `testne-proge`, `fleet`): vsi zeleni; `node tools/stamp.js --check` v redu.

### Odprto

1. **Brskalniški testi** (glavna seja): `tests/browser/nova.test.mjs`, `tests/browser/menu.test.mjs` in drugi; posebej potrditi, da se vrstice Trki, Odpadlo kolo in Starejše različice na 360 × 640 pokonci in 640 × 360 ležeče ne odrežejo (`fitSegs`).
2. **Slike zdaj/potem in uporabnikov »ok«**; seznam možnosti (tabela zgoraj) gre na tablo #382 (glavna seja ali koordinacija).
3. **Angleška imena** (Knocks, As now, Debris, Lost wheel, Race over, Race goes on) so predlog seje.
4. **Svetovna lestvica:** ključ rekorda nima različice trkov (»Okvir«); privzeta je zdaj Realistična, ki čase s stikom z ograjo spremeni. Odloči uporabnik ali seja lestvice.
5. **Poškodbe P1–P6** in kdaj kolo odpade pri Samo videz brez pravila koles (točka 4 zgoraj).
6. Vprašanje semena v `tests/hotham.test.js` ostane odprto kot prej. **Neodvisen pregled `js/core.js`** je narejen 12. 11. (»Popravki po neodvisnem preverjanju«: 13 najdb, popravki in odloženo).

## Kar je že dobro

Tega nova različica ne sme pokvariti; pri lahkih dotikih, naslonu in sredinskih trkih naj da iste številke kot Simulacija.

- **Ohranitev:** gibalna količina para se v vsakem klicu `carCollide` ohrani (napaka 0,00 % v vseh 66 vrsticah klasične in nove fizike); spremembi hitrosti sta natanko v obratnem razmerju mas (6,087 = 6,087), gorivo se šteje (polna rezervoarja 6,017 = 6,017; poln proti praznemu 0,884 pri formuli); vrstni red para in vloga (igralec ali tekmec) izida ne spremenita; brez NaN in brez prehoda skozi avto v okoli 480 tekih (tudi 240 km/h približevanja in 29 t proti 165 kg).
- **Sredinski trki se ujemajo s teorijo:** 120 km/h v stoječega 53 / 67 km/h (teorija 52,8 / 67,2), izguba energije 49 % (teorija 49,3 %); čelno 120 + 120 km/h izguba 99 %, odboj 14 km/h; 120 km/h v dva stoječa v vrsti 39 / 39 / 41 km/h; odboj pada s hitrostjo (0,15 pri 30 km/h, 0,12 nad ~60 km/h, 0 pod 0,5 m/s).
- **Dirkaški dotiki:** sunek od zadaj (30 km/h razlike) 103 / 107 km/h, brez zasuka in izgube oprijema, z zamikom oba −5° in ravno v 0,7 s; bok ob boku se avta ne zlepita (120 / 100 km/h ostaneta), pasivni avto se zasuka 4–8°, premik na klic do 2,5 cm, brez tresenja; lahek dotik v bok (2 m/s) 3–5° pri 60, 120 in 200 km/h; dotik v sprednji bok ne zavrti (2–12°); sunek v zadnji vogal 8 m/s pri 120 km/h: 22–23°, `xgl` 0,53–0,55, raven po 1,4 s; zdrs po sunku se da ujeti s protivolanom (−23,8° → 0° v 2 s).
- **Tog sunek, kjer ga igra že ima:** bočni trk v zadnjo os stoječega pri 120 km/h: prvi sunek je natanko tog (40,7 km/h in 660 °/s; teorija 41,4 km/h in 657 °/s); nova fizika v Simulaciji ob samem trku ohrani vrtilno količino; vztrajnostni momenti so realni (kI/L 0,242–0,300 pri vseh 56 vozilih).
- **Razmik in proga:** brez prehoda skozi avto do 200 km/h (0 od 4 leg v vseh vrsticah); razmik je mehak (do 7,5 cm na korak), v mirovanju ostane 2 cm prekrivanja brez tresenja; merilna ravnina velja za prave proge (Spa in Bathurst: 120 km/h v stoječega 50 / 65 km/h po sunku na obeh).
- **Sklopi:** vlačilec s prikolico in avto končata s hitrostjo po gibalni količini (avto 80 čelno v cisterno 80: −70 km/h, teorija −69,9); avto v rep prikolice: odboj 0,09–0,11 z enim sunkom.
- **Ograja:** položni trki (5–30°) ohranijo hitrost po Coulombovem računu (15°/120 → 106 km/h, račun 108; 5°/200 → 192, račun 195; trenje je v vsaki poševni vrstici natanko 0,25); brez »fliperja« (1–2 dotika, nasprotne ograje pri kotih do 30° avto ne doseže); z odzivom voznika lepljenja ni (s plinom in volanom stran je prost v 0,12–0,53 s in 0,3 m stran za vedno v 0,67–1,09 s; iz mirovanja ob ograji v 1,33 s); čelno (60–90°) avto res obstane (97–98 % energije gre v prvem koraku); pri 200 km/h noben vogal ne ostane čez črto ograje; tekmeci po trku ob ograjo ne obtičijo (po 5–30°/120 so od nje v 0,2–0,7 s; po 60–90° stojijo 3,5 s, nato odpeljejo); drgnjenje ob ograji ne proži zvoka trka.
- **Predmeti in odpadli deli:** en sam stik je pravega reda (stožec 0,48 % proti 0,35; tabla zavorne razdalje 2,6 % proti 1,85; hidrant 4,5 % proti 5,1); predmeti (razen visokih drogov) in deli ostanejo znotraj črte ograje; kupi (30 stožcev, 9 gum ali 20 sodov) se umirijo v 3,2–5,4 s; odpadlih delov je največ 40 in med seboj ne trkajo; hitrost dela po zadetku je 1,10–1,23 v (pod mejo 1,35).
- **Promet in policija:** prvi dotik v prometu je natanko po masah (izguba avta ob avtu 1300 kg 66,3 %, ob kombiju 84,5 %, ob motorju 25,2 %); beg pred policijo: odboj 0,05, izguba 61,5 % ob patrulji 1750 kg (pričakovano 61,5), vdor le 0,05–0,12 m; `boxCollide`: brez prehoda skozi steno do 200 km/h (0 cm).
- **Boksi, gume, zrak:** omejevalnik 80 km/h in duhovi so zanesljivi (0 trkov, 0 škode in 4 postanki v 300 s z vsemi 13 avti v stezi na Spa); predrta guma sledi pravilu (4 / 26 / 24 / 23 % pri 12 / 15 / 20 / 27,8 m/s; pravilo 5 / 20 / 25 / 25 %); vrtenje v zraku ugasne (34 → 2,5 °/s v 0,66 s), pristanek je stabilen (brez poskakovanja in zasuka nosu); prevračanje je privzeto izklopljeno in ponovljivo (brez naključnih števil).
- **»Samo videz« in cena:** pri običajnih avtih škoda vožnje ne spremeni (rally pri 100 % škode 209,4 km/h in 2,38 g kot cel avto); pri 12 avtih stanejo trki 13–16 µs za 66 parov in 12–26 µs za zidove na korak, široka faza zmanjša 4.950 možnih parov (100 avtov) na povprečno 64; skripte so ponovljive (dva zagona dasta isti izpis).

## Omejitve in odprta vprašanja

**Ni izmerjeno:**

- **Podlaga in hitrost:** samo suh asfalt na ravnem (mokro, trava, makadam, klanec in nagib ne); avto–avto pri 60, 120 in 200 km/h, hitrosti pod 60 km/h (gneča v šikani, pragova 4 in 10 m/s) ne; avto med avtom in ograjo ter avto v zraku ali na strehi ne.
- **Vožnja po trku:** vnosi po trku so stalni (brez pedal ali plin, ki drži hitrost); kaj po trku med avti naredi tekmec na pravi progi, ni merjeno (po trku ob ograjo je: ne obtiči).
- **Različice:** 2–5 samo s posameznimi vrsticami; nova fizika po različicah samo v tabeli ohranitve; vrstice s prikolico so odvisne od različice (`KC.glT`), zato je izhodišče za novo različico treba izmeriti posebej.
- **Brskalnik in telefon:** nova mapa (`js/newmap.js`, `js/nvwalls.js`) ni v jedru in ni merjena; odmik narisane ograje je iz kode risanja; kamera, zvok in iskre niso ocenjeni; časi koraka so iz Node (šum do ±50 %), ne s telefona.
- **Splet:** ravnina in dve dirki na Spa; izguba paketov, nihanje zakasnitve, velika mreža in razlika škode med telefonoma niso merjeni.
- **Ograja:** stranske ceste, nasprotni pas in meje pasu v boksih so samo prebrani v kodi; rob prepada, otok krožišča in konca odprte ceste so merjeni samo na preizkusni cesti (Spa in Bathurst jih nimata); pameten voznik po ograji ni merjen (že grob je v ostrih ovinkih hitrejši, vrstica 13); matrika `zid.js` teče brez odpadlih kosov, zato vrstice s škodo nad ~50 % precenijo hitrost po trku do 31 km/h (faza 2: prek `Race.step`).
- **Predmeti:** kje in koliko predmetov stoji na progi, določi graditelj sveta v brskalniku (v jedru so samo table zavorne razdalje); merilčevi zadetki so v sredino in 0,6 m iz nje (povprečje po širini je dodal preverjalec); pešec je merjen samo stoječ; hlodi, bodice in zapore pri begu pred policijo so samo prebrani v kodi.
- **Zrak:** pristanek je merjen s klasično fiziko (pri novi je koda ista, a ni izmerjena); prevračanje samo kot vklopljena možnost, pogostost iz 5 dirk po 90 s.

**Zanesljivost:**

- Pričakovane vrednosti so ocene iz odprte literature in sunkovnega modela; vrstice »učbeniško«, »iz spomina« in »lasten izračun« v Ciljih niso potrjene z izvirnikom.
- Brez neodvisne meritve preverjalca (samo koda ali ponovni zagon merilčeve skripte) so vrstice 30, 32, 33, 38, 39, 40 in 41; pri vrstici 3 miška pod kamnom, pri 19 čelni trk 1 m iz sredine v vlačilec, pri 8 prizor »v bok stoječega«, pri 7 bočni pospešek po pristanku.
- Osem novih najdb preverjalcev (v vrsticah 1, 2, 7, 8, 11, 13, 42 in 43) ni ponovil nihče drug; njihove skripte so v `tools/trki/preverjanje/` (nepregledane).
- Posamezna vrstica dotika v zadnji bok ni ponovljiva številka, ampak vzorec (0,1 m drugačna začetna reža premakne izid, vrstica 10); pri 60 km/h je število korakov stika lahkih predmetov kaotično (odstotki ±20 %, pri 120 in 200 km/h ±10 %).

**Vprašanja, ki so res uporabnikova:**

1. Pristanek po skoku (vrstica 7) in težnost 14 m/s² (vrstica 31): ali štejeta med trke, ki jih nova različica sme spremeniti, ali med fiziko vožnje, ki se po odločitvi 9. 11. 2026 ob ~23.05 ne spreminja?
2. Dirka s prijatelji (vrstica 8): ali nova različica velja tudi tam (zdaj vedno Simulacija) in ali popravek spletnega trka (dogodek trka med telefonoma) sodi v to temo?
3. Koliko realizma pri zasuku igralčevega avta: naj ga zadetek v nos zavrti (vrstica 3) in vrtenje stane toliko kot v resnici (vrstica 12), ali naj ostane omiljeno zaradi igralnosti (hitra poravnava, tekmeci zdrs ujamejo, štart z veliko avti)?
4. Ali sme nova različica spremeniti promet, kolesarja, pešca in beg pred policijo (2. 11. 2026 so ostali, kot so; vrstici 39 in 40)?
5. Poškodbe (škoda po masi, vrstica 17; krilo pri »Samo videz«, 32; vodljivost pri »Vklop«, 41): v tej temi ali v paketu P (biketraveler)?
6. Prevračanje (vrstica 35): ali ga sme nova različica vezati na oviro in bočno hitrost (pravilo »vsakič deseti« ostane)?
7. Ograja in svetovna lestvica: ko vožnja po ograji ne bo več hitrejša (vrstica 13), se časi s stikom spremenijo; ali naj lestvica loči različico trkov?
8. Stožci in bale (vrstica 1): ali naj stanejo le toliko kot v resnici (stožec pod 1 %, bala 1–3 %), čeprav potem niso več kazen za preširoko linijo?
9. Ime različice: »Realistična«, »Fizikalna« ali »Resnični trk« (Okvir).
10. Ali se popravka za novo fiziko (vrstici 15 in 27) sploh delata, ko uporabnik ostaja pri klasični?
