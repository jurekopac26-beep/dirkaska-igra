# Sovoznik na cestah

Novost, ki jo je uporabnik izbral 5. 11. 2026 (koordinacija VSE SEJE 2): na pravih odprtih cestah glas in znak napovedujeta ovinke kot na reliju (»levo 4, dolgo«, »pozor, skok«). Napovedi se izračunajo iz oblike ceste in veljajo za vse prave ceste. Na telefonu so zgoraj kratki napisi. Sovoznik govori samo angleško, napis je v jeziku igre (odločitev uporabnika 5. 11., razdelek Odločitve). Ta datoteka je načrt. Koda se začne šele, ko uporabnik odgovori na vprašanji na strani Odločitve 3 (`sovoznik-glas`, `sovoznik-kje`; razdelek Odločitve). Tema je v `docs/vrsta.md` (Načrtovano, račun 3, po vrsti, pred novimi progami).

## Kaj že obstaja (preverjeno 5. 11. 2026)

Ugotovitev: novost ne podvaja ničesar. Razširi relijskega sovoznika, ki že obstaja, na vse prave odprte ceste in vse načine, doda napis v jeziku igre in številko na znaku. Noben odprt pull request ne dela sovoznika ali napovedi ovinkov.

- **Relijski sovoznik** (`Track.paceNotes()` v `js/core.js`):
  - Ovinke razvrsti po najmanjšem polmeru od 1 do 6. Pozna še »flat«, »hairpin« in »square« ter dodatke »long«, »tightens« in »opens«.
  - Skoke in grbine vzame iz `def.bumps`, lastne opombe proge iz `def.notes` (šikane), menjave podlage iz `Track.sf` (»onto gravel«).
  - Opombe združi: »into« pod 30 m, »and« pod 70 m, največ tri v klicu. Na koncu pove dolžino ravnine (100–500 m) ali »… to finish«.
  - Bere ga `js/game.js` (`codrvInit`, `updateCodrv`): klic gre ~2,4 s oziroma 55–170 m pred prvo opombo. Klic, ki ga avto prevozi, izpusti.
  - Govori `Comm.note()` v `js/comm.js` s sintezo govora v brskalniku: drug angleški glas kot komentator, hitreje. Komentator utihne, ko je klic blizu (`codrvSoon`), med policijskim radiem (`radioMode`) sovoznik molči.
  - **Velja samo v kronometru na relijskih preizkušnjah in spustu** (`def.rally`, `def.descent`: Harju, Ouninpohja, Katu-Jaryk) in govori angleško v obeh jezikih.
  - Stikalo je »Sovoznik na reliju (angleščina)« (`S.codrv`, privzeto vklop). Testi: `tests/rally.test.js`, `tests/katu.test.js`, `tests/browser/smoke.test.mjs`.
- **Znak ovinka v HUD** (`#h-note`; `updateNote` v `js/game.js`, `Track.hudSigns()` in `signAt()` v `js/core.js`):
  - Puščica za oster ovinek, lasnico, hiter ovinek, krožišče ali šikano, obarvana po ostrini 0–3. Je na vseh progah.
  - Stikalo je »Opozorila za ovinke« (`S.notes`). Znak nima številke ne besedila.
- **`Track.corners`** (`_buildCorners`): ovinki nad 1/110 m⁻¹ s `sev` 1–3. Berejo ga svet, zvoki, `qualiBack`, števec ovinkov v meniju in Trener iz #250. Sovoznik ga ne spreminja.
- **Imena krajev in komentator**: `track.names`, napis pod uro ~70 m prej in `Comm.say`. Sovoznik imen ne bere (razdelek Pravna varnost).
- **Table pred zaviranjem** (`Track.brakeBoards`): samo dirkališča. Ostanejo.
- **Misije**: misija »PACE NOTES« na novi mapi (`js/nvmenu.js`, `js/missions/`) ima svoje klice. `MisKit.backRoad` skrije puščico na cesti, prevoženi v obratni smeri. Misije ostanejo, kot so.
- **#250 (Zabava, osnutek)**: izzivi ob cesti (radar, odsek, drift cona, skok, zlati smerniki) in Živa cesta (kamenje, žival, dela na cesti, traktor) govorijo prek `Comm.say` in sovoznika ne podvajajo. Ko bo #250 na `main`, lahko sovoznik doda še »pozor, kamenje« ipd. (pozneje, ni v tem sklopu).

## Lestvica ostrine

Številka pove ostrino ovinka po najmanjšem polmeru, enako za vse avte, kot pri pravih relijskih opombah. Meje so iste kot pri relijskem sovozniku, zato Harju, Ouninpohja in Katu-Jaryk ostanejo enaki. Hitrost v tabeli je samo za občutek: oprijem ~1 g, v = √(g·R).

| Številka | Najmanjši polmer | ~hitrost | Napis v slovenski igri | Glas (in napis v angleški igri) |
|---|---|---|---|---|
| 1 | pod 16 m | 45 km/h | levo 1 / desno 1 | left one / right one |
| 2 | 16–26 m | 55 km/h | levo 2 | left two |
| 3 | 26–38 m | 70 km/h | levo 3 | left three |
| 4 | 38–55 m | 85 km/h | levo 4 | left four |
| 5 | 55–80 m | 100 km/h | levo 5 | left five |
| 6 | 80–120 m | 125 km/h | levo 6 | left six |
| blag | 120–220 m, zasuk vsaj 17° | – | levo polno | flat left |

- **lasnica** (»lasnica levo« / »hairpin left«): zasuk nad 126° in polmer pod 22 m.
- **pravi kot** (»devetdeset levo« / »square left«): zasuk 72–109° in polmer pod 22 m, npr. križišče.
- **Dodatki**:
  - »dolgo« / »long«: zasuk nad ~97°.
  - »zapira« / »tightens«: najožji del v zadnji tretjini ovinka, dolgega nad 30 m.
  - »odpira« / »opens«: najožji del v prvi tretjini.
- **Znak `#h-note`** dobi številko ovinka, ki ga kaže, iz iste lestvice, kadar je sovoznik vklopljen. Barva ostane po `sev` (1–2 rdeča, 3–4 oranžna, 5–6 rumena).

## Združevanje, skoki in posebnosti

- **Razmik do naslednje opombe**:
  - pod 30 m: »v« / »into« (»levo 4 v desno 3«);
  - 30–70 m: »takoj« / »and«;
  - 70–500 m: dolžina ravnine, zaokrožena na 50 m (»sto petdeset« / »one fifty«);
  - nad 500 m nič;
  - pred ciljem: »… do cilja« / »… to finish«.
  - V klicu so največ tri opombe, kot zdaj.
- **»Pozor«** / »caution« na začetku klica:
  - pred vsakim skokom (»pozor, skok«);
  - pred ovinkom 1–2 ali lasnico za ravnino, dolgo vsaj 250 m;
  - pred ovinkom, ki se zapre za vsaj dve stopnji;
  - pred ovinkom manj kot 30 m za grbino (slep).
- **Skoki in grbine**: iz `def.bumps` (kot zdaj) in novo iz višin ceste (`Track.hy`).
  - Seja izračuna navpično ukrivljenost čez ~10 m in jo pomnoži s kvadratom hitrosti AI (`speedProfile`).
  - Nad 1,2 g je »skok« / »jump«, nad 2 g ali s padcem nad 1,5 m »velik skok« / »big jump«, med 0,5 in 1,2 g »grbina« / »crest«.
  - Grbina v ovinku se prebere z njim (»levo 3 čez grbino«). Največ ena taka opomba na ~60 m.
  - Test preveri, da na ravni cesti ni skokov in da skoki Ouninpohje ostanejo.
- **Krožišča** (`def.rings`, npr. Medvode): »krožišče naravnost / desno / levo« po smeri izvoza.
- **Šikane** (`def.notes`, `hudSigns`): »šikana levo« ali »šikana desno« po prvi smeri.
- **Podlaga**: »na makadam«, »na asfalt«, »na tlakovce« (»onto gravel« …).
- **Izvedba**: `paceNotes()` vrne opombe kot jezikovno neodvisne žetone (npr. `['L', 4, 'long', 'into', 'R', 3, 'tightens', 'd150']`) in ob njih angleško besedilo `text`, enako kot zdaj, da stari testi ostanejo. Angleške besede za glas in napis v jeziku igre sestavi nova funkcija `Sovoznik.words(žetoni, jezik)`.

## Kdaj govori

- **Začetek klica**: klic se začne, ko je avto `d = v · (T + 1,2 s) + 25 m` pred prvo opombo, najmanj 60 m in največ 260 m. T je trajanje klica: vsota dolžin posnetkov ali ~0,3 s na besedo. Zdaj je 2,4 s oziroma 55–170 m, kar je pri hitri vožnji in dolgem klicu prepozno.
  - Pri 25 m/s (90 km/h) in klicu 2 s: 105 m.
  - Pri 50 m/s (180 km/h) in klicu 2,5 s: 210 m.
- **Zaporedje**: klici gredo po vrsti in se ne prekrivajo. Naslednji pride ~0,2 s po koncu prejšnjega, če je avto že na njegovi razdalji; v serpentinah sovoznik bere vnaprej, kot pravi sovoznik.
- **Izpuščeni klici**: klic, ki ga avto prevozi (več kot 10 m čez prvo opombo, npr. po reševanju ali zavrtenju), se izpusti. Pod 5 m/s sovoznik počaka.
- **Drugi glasovi**:
  - Komentator utihne, ko je klic blizu (kot zdaj).
  - Policijski radio ima prednost: sovoznik takrat molči, napis pa dela.
  - Na cesti, prevoženi v obratni smeri, sovoznik molči.

## Glas (angleško, brez povezave)

- **Jezik**: sovoznik govori samo angleško, tudi ko je igra v slovenščini, kot komentator (odločitev uporabnika 5. 11.: »Vse zvoke delaj v angleščini«). Napis je v jeziku igre.
- **Besedišče glasu**: ~40 angleških besed, iz katerih se sestavijo klici, kot jih relijski sovoznik uporablja že zdaj: left, right, one–six, flat, hairpin, square, long, tightens, opens, caution, jump, big, crest, over, into, and, one hundred … five hundred, to finish, onto, gravel, tarmac, cobbles, roundabout, straight, chicane.
- **Besede napisa v slovenski igri**: levo, desno, številka, polno, lasnica, devetdeset, dolgo, zapira, odpira, pozor, skok, velik, grbina, v, takoj, razdalja v metrih, do cilja, na makadam, na asfalt, na tlakovce, krožišče, naravnost, šikana. Uporabnik lahko besedo zamenja.
- **Izvedba po odgovoru `sovoznik-glas`**:
  - **Glas telefona** (možnost 1, priporočena):
    - `Comm.note()` kot zdaj, z angleškim glasom telefona (drug glas kot komentator).
    - Nič prenosa. Angleški glas je na skoraj vseh telefonih in dela brez interneta.
  - **Posneti zvoki** (možnosti 2 in 3):
    - Vse besede so v enem zvočnem listu, MP3 v base64 z odmiki (`js/data/sovoznik-en.js`, ~100–150 KB).
    - List je povezan iz `index.html`, zato ga service worker (`sw.js`) shrani skupaj z igro in sovoznik dela brez povezave.
    - Igra predvaja besedo za besedo prek Web Audio s ~60 ms premora (~3–5 MB pomnilnika).
    - Možnost 2: seja posnetke pripravi z angleškim odprtim sintetizatorjem govora, katerega licenca dovoljuje igro na Google Play, in pred izdelavo pošlje vzorce na stran Odločitve.
    - Možnost 3: posnetke pripravi uporabnik s svojim glasom. Seja pripravi seznam besed, navodila in orodje `tools/sovoznik-glas.mjs` (rezanje, enaka glasnost).
- **Licenca**: vir glasu gre v `README.md` pod »Zasluge«. Brez glasov z licenco »samo za nekomercialno rabo«, brez posnetkov resničnih sovoznikov in posnetkov iz drugih iger.

## Napis in znak (telefon pokonci in ležeče)

- **Napis** (`#h-codrv`, en element DOM):
  - Besedilo klica je zgoraj na sredini pod uro (`#h-times`), npr. »LEVO 4 · DOLGO«, »POZOR · SKOK«, »L4 › D3 ZAPIRA«.
  - Klic, daljši od ~22 znakov, se skrajša na L/D in številko.
  - Postavljen je kot znak (`placeNote`), da ne prekrije ure, vmesnih časov in policijske vrstice.
  - Pokaže se ob začetku klica in ugasne, ko avto pride do prve opombe (najmanj 1,5 s).
- **Znak** `#h-note` dobi številko 1–6 (razdelek Lestvica). Puščica ostane, kot je.
- **Slike**: Vršič, kamera za avtom, pokonci in ležeče, ob koncu dela v opisu pull requesta in za uporabnika.

## Stikalo v Nastavitvah

- Vrstica »Sovoznik na reliju (angleščina)« (`S.codrv`) postane **»Sovoznik«** z izbiro **Izklop · Napis · Glas in napis**.
  - Vrednosti so 0, 2 in 1. Privzeto je »Glas in napis«: shranjena 1 pomeni »Glas in napis«, 0 »Izklop«, zato se igralcem nič ne preklopi samo od sebe.
  - Angleško: »Co-driver« · Off · Captions · Voice and captions.
- Gumb ▶ ob vrstici prebere vzorčni klic (»left four long into right two«), kot »▶ Preizkusi glas« pri komentatorju.
- »Opozorila za ovinke« (`S.notes`, znak) ostanejo posebej.

## Kje velja

- **Privzeto** (možnost 1 vprašanja `sovoznik-kje`): na vseh pravih odprtih cestah. To so ceste z `track.open` brez `test`: 19 cest in 4 kronometri (Harju, Ouninpohja, Katu-Jaryk, Pikes Peak). Nove ceste (Hakone, Bâlea, Killar …) ga dobijo same.
- **Načini**: dirka, kronometer, kariera, prvenstvo, promet, policija (radio ima prednost), dirka s prijatelji (vsak telefon ima svojega sovoznika) in »Prvič na cesti«.
- **Ne velja**:
  - na dirkališčih, razen če uporabnik izbere drugače; tam ostanejo table pred zaviranjem;
  - na testnih progah (zamrznjene);
  - na novi mapi in v misijah (svoje opombe);
  - v avtošoli, posnetku dirke in foto načinu.
- **Druge izbire**: pri možnosti 2 govori tudi na dirkališčih v prvem krogu, pri možnosti 3 v vsakem krogu.

## Pravna varnost

- Samo splošne besede: smer, številka, dolgo, zapira, skok … Nobenih imen krajev, oseb, podjetij, prireditev ali znamk.
- Imen ovinkov (`track.names`) sovoznik ne bere. Lastne opombe prog (`def.notes`) so samo splošne besede (preveri test).
- Glas je lasten ali z licenco za komercialno rabo, vir je v Zaslugah.

## Obremenitev

- Ni novih klicev risanja in oglišč (napis je DOM, številka na znaku je SVG), zato se `tests/golden/perf.json` ne spremeni.
- Napovedi se izračunajo enkrat ob začetku dirke: pod 20 ms na progo, meri Node test.
- Glas telefona: nič. Posneti zvoki: ~100–150 KB prenosa, ~3–5 MB pomnilnika (preveri `memory`).
- Sovoznik bere samo za igralca, zato število tekmecev ne vpliva nanj.

## Testi

- **`tests/sovoznik.test.js`** (Node, nov). Za vsako pravo odprto cesto preveri:
  - klice po vrsti, brez prekrivanja, in razumno gostoto;
  - vsako lasnico, prebrano kot lasnica, in vsak skok iz `def.bumps`;
  - da na ravnini ni »skoka«;
  - meje lestvice (polmer → številka);
  - da ima vsaka beseda napisa prevod v obeh jezikih, vsaka beseda glasu posnetek (pri posnetih zvokih) in da je napis največ 24 znakov;
  - čas izračuna.
- **`tests/rally.test.js` in `tests/katu.test.js`**: angleško besedilo relijskih preizkušenj ostane enako. Namerne spremembe (npr. »caution«) se zapišejo v test.
- **`tests/browser/sovoznik.test.mjs`** (brskalnik, nov), na Vršiču in Ouninpohji preveri:
  - da klic pride pred ovinkom na razdalji glede na hitrost;
  - da se napis pokaže, ugasne in ne prekrije ure (360 × 640 in 640 × 360);
  - stikalo Izklop, Napis, Glas in napis;
  - slovenski in angleški napis ob angleškem glasu;
  - dirkališče brez sovoznika ali po izbiri uporabnika.
- **`smoke.test.mjs`, `tests/lang.test.js` in `perf.test.mjs`** ostanejo zeleni.

## Koraki izvedbe in ocena

| Korak | Kaj | Ure |
|---|---|---|
| 1 | Jedro v `js/core.js`: žetoni namesto besedila, skoki in grbine iz višin, »pozor«, krožišča; `Sovoznik.words`; Node test, relijski klici ostanejo | 3–4 |
| 2 | Glas: angleški glas telefona ali posnetki in predvajanje (po odgovoru); prednost pred komentatorjem | 1–3 |
| 3 | Napis in številka na znaku, pokonci in ležeče | 2–3 |
| 4 | Kje velja, stikalo, prevodi v `js/lang.js`, `docs/igra.md`, `README.md` (Zasluge), `docs/kazalo.md` | 1–2 |
| 5 | Brskalniški test, slike, pull request, vpis v vrsto | 2–3 |

- **Skupaj ~9–15 h**: ena seja (Opus, napor max), ena veja `sovoznik/cesta`, en pull request. Odpre ga ob začetku kode kot osnutek in takrat izbriše vrstico v Načrtovano.
- Pri možnosti 3 vprašanja o glasu pride še čas uporabnika za snemanje (~15 min).

## Odločitve

- 5. 11. 2026: uporabnik je izbral novost »Sovoznik na cestah« (koordinacija VSE SEJE 2).
- **Privzete izbire seje** (brez vprašanja):
  - lestvica 1–6 po polmeru, kot zdaj;
  - »v« pod 30 m in »takoj« pod 70 m;
  - stikalo Izklop · Napis · Glas in napis, privzeto vklop;
  - napis zgoraj pod uro, številka na znaku;
  - komentator ostane angleški.
- **5. 11. 2026 ob 16.06, uporabnik** (sporočilo koordinaciji VSE SEJE 2): »Vse zvoke delaj v angleščini«. Sovoznik govori samo angleško, tudi v slovenski igri. Napis na znaku in zgoraj sledi jeziku igre. Slovenski glas in Hugging Face nista več potrebna.
- **Vprašanji na strani Odločitve 3** (5. 11. 2026); odgovora se zapišeta sem:
  - `sovoznik-glas`: kateri angleški glas (prilagojeno po odločitvi o angleščini): angleški glas telefona (priporočeno), posneti zvoki iz angleškega sintetizatorja, tvoj glas v angleščini;
  - `sovoznik-kje`: samo odprte ceste ali tudi dirkališča (v prvem krogu ali v vsakem).

## Stanje

- 5. 11. 2026: tema je v `docs/vrsta.md` (#337), načrt v tej datoteki (#340), vprašanji na strani Odločitve 3; `sovoznik-glas` prilagojeno na angleški glas. Koda čaka na odgovor.
