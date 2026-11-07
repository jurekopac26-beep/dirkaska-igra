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
- **Znak `#h-note`** dobi številko ovinka, ki ga kaže, iz iste lestvice, kadar je sovoznik vklopljen. Barva ostane po `sev`, kot doslej (zelena, rumena, rdeča).

## Združevanje, skoki in posebnosti

- **Razmik do naslednje opombe**:
  - pod 30 m: »v« / »into« (»levo 4 v desno 3«);
  - 30–70 m: »takoj« / »and«;
  - 70–500 m: dolžina ravnine, zaokrožena na 50 m (»sto petdeset« / »one fifty«);
  - nad 500 m nič;
  - pred ciljem: »… do cilja« / »… to finish«.
  - V klicu so največ tri opombe, kot zdaj.
- **»Pozor«** / »caution« na začetku klica:
  - pred velikim skokom in pred skokom, ki mu v istem klicu sledi ovinek 1–3 (»pozor, skok«; pred vsakim skokom bi bil na Ouninpohji v 28 klicih); menjava podlage med skokom in ovinkom ne šteje;
  - pred ovinkom 1–2 ali lasnico za ravnino, dolgo vsaj 250 m;
  - pred ovinkom, ki se zapre za vsaj dve stopnji;
  - pred ovinkom manj kot 30 m za grbino ali skokom (slep): vrh pred ovinkom, tudi kadar se grbina prebere z ovinkom (»hairpin right over crest«) ali s prejšnjim ovinkom v klicu.
- **Skoki in grbine**: iz `def.bumps` (kot zdaj) in novo iz višin ceste (`Track.hy`).
  - Seja izračuna navpično ukrivljenost čez ~10 m in jo pomnoži s kvadratom hitrosti AI (`speedProfile`).
  - Nad 1,2 g je »skok« / »jump«, nad 2 g ali s padcem nad 1,5 m »velik skok« / »big jump«, med 0,5 in 1,2 g »grbina« / »crest«.
  - Grbina v ovinku se prebere z njim (»levo 3 čez grbino«). Največ ena taka opomba na ~60 m.
  - Test preveri, da na ravni cesti ni skokov in da skoki Ouninpohje ostanejo.
- **Krožišča** (`def.rings`, npr. Medvode): »krožišče naravnost / desno / levo« po smeri izvoza. Dve krožišči blizu skupaj: obe (»roundabout left into roundabout right«).
- **Šikane** (`def.notes`, `hudSigns`): »šikana levo« ali »šikana desno« po prvi smeri. Druge lastne opombe proge (`def.notes`) samo s sovoznikovimi besedami (`CD_EN`, številka kot ostrina); opomba z drugo besedo se ne prebere in ovinki pod njo ostanejo.
- **Podlaga**: »na makadam«, »na asfalt«, »na tlakovce« (»onto gravel« …). Menjava podlage do 30 m za opombo gre v isti klic brez »into« ali »and«.
- **Izvedba**: `paceNotes()` vrne opombe kot jezikovno neodvisne žetone (npr. `['L', 4, 'long', 'into', 'R', 3, 'tightens', 'd150']`) in ob njih angleško besedilo `text`, enako kot zdaj, da stari testi ostanejo. Glas sestavi `Core.codrvSay(žetoni)` (angleško), napis v jeziku igre `Core.codrvCap(žetoni, jezik)`.

## Kdaj govori

- **Izvedeno 6. 11. 2026** (korak 2, `js/game.js` `cdLead`): spodnja pravila veljajo, ko se glas sliši (»Glas in napis«, zvok vklopljen). Samo napis (ali brez zvoka): klic se pokaže 2,4 s pri trenutni hitrosti in 30 m pred prvo opombo (55–170 m), kot doslej. T je vsota dolžin posnetih besed in premorov (`Comm.noteLen`).
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
- **Izvedba po odgovoru `sovoznik-glas`** (odgovor 6. 11.: posneti zvoki, kot v relijskih igrah; razdelka Odločitve in »Predaja: glas«):
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
- **Izvedeno 6. 11. 2026** (korak 2, posneti zvoki, možnost 2):
  - **Vir**: odprt govorni model Kokoro-82M (Apache 2.0), glas `bm_george` (britanski moški; uporabnik ga je izbral 6. 11. pri vprašanju `sovoznik-glas-izbor`, razdelek Odločitve; prvi list je imel `am_michael`). Model q8 ONNX je z npm (`kokoro-q8-shards` 1.0.0, ponovna objava modela onnx-community, sha256 preverjen v orodju), glasovi iz uradnega `kokoro-js` 1.2.1, izgovorjava besed po slovarjih misaki (Apache 2.0; britanski za glasove `b*`). Hugging Face ni potreben. Zasluge v `README.md`.
  - **Orodje** `tools/sovoznik-glas.py` (Python z onnxruntime in numpy, ffmpeg): vsako besedo izgovori posebej (hitrost modela 1,3, nato 1,15-krat hitreje z ohranjeno višino), odreže tišino, izenači glasnost in besede zloži v list z 0,12 s tišine vmes; MP3 LAME -V7, 24 kHz mono, brez oznak ID3. Privzeti glas orodja je `bm_george` (zagon brez `--voice` glasu ne zamenja). Drug glas: `--voice <ime>` (npr. `am_michael`), vzorci za vprašanje: `--samples <mapa> --no-sheet`. Nova beseda: njena izgovorjava v `WORDS`, nato orodje znova.
  - **List** `js/data/sovoznik-en.js`: 38 besed (vse iz `Core.CD_EN` in razdalje 100–500 m), 25,9 s, 150 KB (z `am_michael`: 22,7 s, 137 KB). Povezan je iz `index.html` kot `<link rel="x-lazy-script">`, zato ga service worker shrani z igro, naloži pa se šele na dirki s sovoznikom.
  - **Predvajanje** (`js/comm.js`): `Comm.recLoad()` ob začetku dirke (`codrvInit`), dekodiranje z `OfflineAudioContext` pri 24 kHz (~2,5 MB), začetek in konec vsake besede igra poišče sama po glasnosti (neodvisno od zamika dekoderja MP3). `Comm.note(text, toks)` klic sestavi iz besed (`AudioBufferSourceNode`, 60 ms premora, po »caution« 170 ms, pred razdaljo 130 ms) skozi rahel zvok čelade (150 Hz visokopasovni, +3 dB pri 3 kHz), mimo stišanja zvokov igre. Dokler list ni dekodiran ali zvok ne teče, govori glas telefona (rezerva).
  - **Dolžina klicev** (z `bm_george`, ki govori ~17 % počasneje kot `am_michael`): polovica klicev vseh cest traja do ~3,4 s, najdaljši (tri opombe, 14 besed) ~7,9 s (Mount Buller; 373 klicev na 16 cestah te veje). Brez Vršiča, Sani Passa in Mount Bullerja, ki gredo med testne proge: ~2,9 s in ~6,9 s (Chapman). Z `am_michael`: 2,9 s in 6,6 s oziroma 2,5 s in 5,9 s.

## Napis in znak (telefon pokonci in ležeče)

- **Napis** (`#h-codrv`, en element DOM):
  - Besedilo klica v jeziku igre, npr. »LEVO 4 · DOLGO«, »POZOR · SKOK«, »L4 › D3 ZAPIRA«: ena opomba v celoti, več opomb na kratko (L/D in številka). Napis, daljši od 24 znakov, izpusti razdaljo, nato dodatke (`Core.codrvCap`). Vse opombe klica ostanejo (naslednji klic se začne za njimi), zato je dolg napis na telefonu pokonci v dveh vrsticah: na cestah največ 34 znakov, meja `CD_MAX2` je 44 znakov (tri vrstice; test preveri, da ne prekrije ničesar).
  - Ležeče je pod uro (pod vrsticami `#h-times`: NAJ, sektorji, vmesni čas), pokonci pod znakom ovinka, ki je tam pod uro (`placeCap` v `js/game.js`). Znaka ne premakne in ne prekrije ničesar na HUD-u (preveri brskalniški test).
  - Pokaže se ob začetku klica in ugasne, ko avto pride do prve opombe (najmanj 1,5 s). Pri hitrosti AI pride naslednji klic vsaj ~1,5 s za prejšnjim (izmerjeno na vseh cestah), zato napis ne potrebuje zadrževanja.
- **Znak** `#h-note` dobi številko 1–6 (razdelek Lestvica), kadar sovoznik na tej progi bere. Puščica ostane, kot je.
- **Slike**: Vršič, kamera za avtom, pokonci in ležeče, v opisu pull requesta.

## Stikalo v Nastavitvah

- Vrstica »Sovoznik na reliju (angleščina)« (`S.codrv`) postane **»Sovoznik«** z izbiro **Izklop · Napis · Glas in napis**.
  - Vrednosti so 0, 2 in 1. Privzeto je »Glas in napis«: shranjena 1 pomeni »Glas in napis«, 0 »Izklop«, zato se igralcem nič ne preklopi samo od sebe.
  - Angleško: »Co-driver« · Off · Captions · Voice and captions.
- Gumb ▶ ob vrstici prebere vzorčni klic (»left four long into right two«), kot »▶ Preizkusi glas« pri komentatorju (z glasom na cestah, korak 2).
- »Opozorila za ovinke« (`S.notes`, znak) ostanejo posebej.
- Sprememba med dirko (nastavitve v pavzi) velja takoj, od naslednjega klica (`setOption` pokliče `codrvInit`).

## Kje velja

- **Ceste** (odgovor `sovoznik-kje` 6. 11.: možnost 1, samo odprte ceste in kronometri): na vseh pravih odprtih cestah. To so ceste z `track.open` brez `test`, 5. 11. 15 prog: 11 cest (Tianmen, Irohazaka, Sani Pass, Rio do Rastro, Vršič, Mount Buller, Los Caracoles, Medvode, Chapman's Peak, Mount Hotham, Great Alpine Road) in 4 kronometri (Harju, Ouninpohja, Katu-Jaryk, Pikes Peak na asfaltu in makadamu, `pikes` in `pikesg`). Nove ceste ga dobijo same, nove testne proge ga izgubijo same: ko gredo Vršič (#394), Mount Buller in Sani Pass (#379) med testne, ostane 12 prog.
- **Proge ZDA razen Pikes Peaka** (Mount Baldy, Beartooth, Big Sur, Mauna Kea, Moki Dugway, Santa Monica Mountains, Palomar Mountain, Uncompahgre ter dirkališča Detroit, Monterey in Riverside) postanejo testne in zamrznjene (odločitev uporabnika 5. 11., PR računa 2, veja `proge/zda-v-test`). Sovoznika ne dobijo: izloči jih pravilo »brez `test`«, njihovih datotek seja ne spreminja, slik in meritev na njih ne dela. Do tedaj jih izključi seznam `CD_SKIP` v `js/core.js` (`codrvRoad`); ko so testne, seznam ni več potreben.
- **Načini**: dirka, kronometer, kariera, prvenstvo, promet, policija (radio ima prednost), dirka s prijatelji (vsak telefon ima svojega sovoznika).
- **Ne velja**:
  - na dirkališčih (odgovor `sovoznik-kje`); tam ostanejo table pred zaviranjem;
  - na testnih progah (zamrznjene);
  - na novi mapi in v misijah (svoje opombe);
  - v avtošoli (tudi »Prvič na cesti«), posnetku dirke in foto načinu.

## Pravna varnost

- Samo splošne besede: smer, številka, dolgo, zapira, skok … Nobenih imen krajev, oseb, podjetij, prireditev ali znamk.
- Imen ovinkov (`track.names`) sovoznik ne bere. Lastne opombe prog (`def.notes`) so samo splošne besede (preveri test).
- Glas je lasten ali z licenco za komercialno rabo, vir je v Zaslugah.

## Obremenitev

- Ni novih klicev risanja in oglišč (napis je DOM, številka na znaku je SVG), zato se `tests/golden/perf.json` ne spremeni.
- Napovedi se izračunajo enkrat ob začetku dirke: pod 20 ms na progo, meri Node test.
- Glas telefona: nič. Posneti zvoki: 150 KB prenosa (enkrat, nato iz service workerja) in ~2,5 MB pomnilnika, samo na dirki s sovoznikom (ceste, reli); dirkališča in druge proge se ne spremenijo.
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
- **`tests/browser/sovoznik.test.mjs`** (brskalnik, nov), na Rio do Rastro (prej na Vršiču) in Ouninpohji preveri:
  - da klic pride pred ovinkom na razdalji glede na hitrost;
  - da se napis pokaže, ugasne in ne prekrije ure (360 × 640 in 640 × 360);
  - stikalo Izklop, Napis, Glas in napis;
  - slovenski in angleški napis ob angleškem glasu;
  - dirkališče brez sovoznika ali po izbiri uporabnika.
- **`smoke.test.mjs`, `tests/lang.test.js` in `perf.test.mjs`** ostanejo zeleni.
- Izvedeno 5. 11. 2026: opis obeh testov je v `tests/README.md`. Dirkališče brez sovoznika preveri Node test (`codrvRoad`); posnetke besed preveri test, ko pride glas.
- Izvedeno 6. 11. 2026 (korak 2): `tests/sovoznik-glas.test.js` (Node: vsaka beseda in razdalja ima posnetek in nič drugega, odmiki znotraj lista, MP3 cel, velikost do 160 KB, vsak klic vseh cest iz lista do 8,5 s, polovica do 3,7 s (z `am_michael` 7 s in 3,2 s, razdelek Odločitve), zasluge v `README.md`); `tests/browser/sovoznik.test.mjs`: na Rio do Rastro (ležeče, z zvokom) in Ouninpohji vsi klici iz lista, nobeden prek `speechSynthesis`, z glasom 20–260 m pred ovinkom.

## Koraki izvedbe in ocena

| Korak | Kaj | Ure |
|---|---|---|
| 1 | Jedro v `js/core.js`: žetoni namesto besedila, skoki in grbine iz višin, »pozor«, krožišča; `Sovoznik.words`; Node test, relijski klici ostanejo | 3–4 |
| 2 | Glas: angleški glas telefona ali posnetki in predvajanje (po odgovoru); prednost pred komentatorjem | 1–3 |
| 3 | Napis in številka na znaku, pokonci in ležeče | 2–3 |
| 4 | Kje velja, stikalo, prevodi v `js/lang.js`, `docs/igra.md`, `README.md` (Zasluge), `docs/kazalo.md` | 1–2 |
| 5 | Brskalniški test, slike, pull request, vpis v vrsto | 2–3 |

- **Skupaj ~9–15 h**: ena seja (Opus, napor max), ena veja `sovoznik/cesta`, en pull request. Odpre ga ob začetku kode kot osnutek in takrat izbriše vrstico v Načrtovano.
- **6. 11.**: koraki 1 in 3–5 so v PR #359. Korak 2 (posnet glas) naredi nova seja po razdelku »Predaja: glas«. Korak 2 je v PR #402 (veja `sovoznik/glas` iz #359, gre na `main` za #359).

## Predaja: glas (korak 2)

Za novo sejo (Opus, napor max), po odgovoru `sovoznik-glas` 6. 11. (razdelek Odločitve). Opombe, napisi in stikalo so v PR #359 (veja `sovoznik/cesta`).

- **Kaj**: posnet angleški glas sovoznika, kot v relijskih igrah. Klic se sestavi iz posnetih besed: `Track.paceNotes()` da žetone (`toks`), besede glasu so v `Core.CD_EN`. Igra jih predvaja prek Web Audio s ~60 ms premora.
- **Kje**: na cestah pri »Glas in napis« (`S.codrv === 1`; zdaj ostane `__game.codrv.voice` `false`) in na relijskih kronometrih namesto glasu telefona (`Comm.note()`), da je sovoznik povsod isti. Glas telefona ostane rezerva, dokler list ni naložen.
- **Zvočni list**: vse besede v enem listu, MP3 v base64 z odmiki (`js/data/sovoznik-en.js`, ~100–150 KB). List je povezan iz `index.html`, zato ga service worker shrani z igro. Dekodira se ob prvem klicu (~3–5 MB).
- **Vir glasu**: odprt angleški sintetizator, katerega licenca dovoljuje komercialno rabo (Google Play); zasluge v `README.md`.
  - Kandidata: Kokoro-82M (Apache 2.0) in glas Piper `en_US-joe-medium` (po opisu paketa CC0, preveri v opisu modela).
  - Hugging Face iz tega okolja ne deluje (posrednik zavrne povezavo, 6. 11.); npm in PyPI delujeta. Uteži Kokora so na npm razrezane v pakete (`kokoro-q8-shards`, `kokoro-fp16-shards`), glas Piper je na PyPI (`joe-us-piper-voice`).
  - To so ponovne objave tretjih oseb: iz njih vzemi samo podatke (model, glasove), kodo iz uradnih paketov (`kokoro-js`, `piper-tts`); preveri licenco in velikost datotek. Druga pot: dovoljenje okolja za Hugging Face (`update_environment`, uporabnik potrdi).
  - Brez glasov z licenco »samo nekomercialno«, brez posnetkov resničnih sovoznikov in posnetkov iz drugih iger.
- **Zvok**: kratke, jasne besede v relijskem ritmu, enaka glasnost; po želji rahel zvok čelade ali radia (filter v Web Audio, ne v posnetku).
- **Vzorci**: seja glasu ne sliši. Razumljivost preveri z razpoznavo govora, če je dosegljiva, in s trajanjem besed.
  - Pred izdelavo pošlji na stran Odločitve 3 vprašanje z zvoki: isti klic v 2–3 glasovih, priporočeni prvi; brez odgovora velja priporočeni.
  - Uporabnik ne želi znova izbirati vrste glasu (»to sem že odgovoril«), zato vprašanje izbira samo med posnetimi glasovi.
- **Kdaj govori**: po razdelku Kdaj govori; prednost pred komentatorjem kot zdaj (`Comm`).
- **Testi**:
  - Node: vsaka beseda iz `Core.CD_EN` in vsaka razdalja ima posnetek, odmiki so znotraj lista, velikost lista;
  - brskalniški `tests/browser/sovoznik.test.mjs`: na Rio do Rastro pri »Glas in napis« klici iz lista, ne prek `speechSynthesis`; na Ouninpohji enako;
  - `perf` in `memory` brez rasti na drugih progah.
- **Dokumenti**: ta datoteka (Glas, Stanje), `docs/igra.md` (Sovoznik, Glas), `README.md` (Zasluge), `docs/kazalo.md`, `tests/README.md`.
- **Veja**: nova (`sovoznik/glas`) iz `main` po združitvi #359. Če #359 še čaka v vrsti, se seja s koordinacijo dogovori, ali gre glas v #359.
- **Izvedeno 6. 11. 2026**: PR #402, veja `sovoznik/glas` iz veje #359 (navodilo koordinacije VSE SEJE 2), gre na `main` za #359.

## Odločitve

- 5. 11. 2026: uporabnik je izbral novost »Sovoznik na cestah« (koordinacija VSE SEJE 2).
- **Privzete izbire seje** (brez vprašanja):
  - lestvica 1–6 po polmeru, kot zdaj;
  - »v« pod 30 m in »takoj« pod 70 m;
  - stikalo Izklop · Napis · Glas in napis, privzeto vklop;
  - napis zgoraj pod uro, številka na znaku;
  - komentator ostane angleški.
- **5. 11. 2026, uporabnik** (sporočilo koordinaciji VSE SEJE 2, »ena proga na državo«): proge ZDA razen Pikes Peaka postanejo testne in zamrznjene. Sovoznik velja na 15 progah namesto 23 (razdelek Kje velja), vprašanje `sovoznik-kje` je popravljeno.
- **5. 11. 2026 ob 16.06, uporabnik** (sporočilo koordinaciji VSE SEJE 2): »Vse zvoke delaj v angleščini«. Sovoznik govori samo angleško, tudi v slovenski igri. Napis na znaku in zgoraj sledi jeziku igre. Slovenski glas in Hugging Face nista več potrebna.
- **5. 11. 2026 ob 17.34, uporabnik** (izbira na vprašanje koordinacije VSE SEJE 2, katere novosti začeti takoj): »Sovoznik: opombe na cestah«. Koda za opombe (`Track.paceNotes`) in napise na odprtih cestah se začne takoj, brez prog ZDA razen Pikes Peaka. Glas na cestah pride po odgovoru `sovoznik-glas`; do takrat sovoznik govori samo na relijskih kronometrih, kot doslej.
- **5. 11. 2026, seja ob izvedbi** (privzete izbire, brez vprašanja):
  - »caution« pred velikim skokom in pred skokom v ovinek 1–3, ne pred vsakim skokom;
  - napis ležeče pod uro, pokonci pod znakom ovinka; znak ostane na svojem mestu;
  - napis ostane do ovinka (najmanj 1,5 s), naslednji klic ga zamenja brez zadrževanja;
  - številka na znaku samo, kadar sovoznik na progi bere;
  - proge ZDA razen Pikes Peaka do PR-ja #355 izključi seznam v `js/core.js`.
- **5. 11. 2026, pregled PR #359** (seja pregleda, 10 ugotovitev, vse popravljene):
  - napis obdrži vse opombe klica, dolg je pokonci v dveh vrsticah (namesto izpuščenih opomb ali odrezane besede);
  - stikalo med dirko velja takoj; v misijah sovoznika ni (kot v razdelku Kje velja);
  - dve krožišči blizu skupaj: obe; `def.notes` samo s sovoznikovimi besedami;
  - »caution« tudi pred ovinkom za grbino, prebrano z ovinkom, in za skokom z menjavo podlage pred ostrim ovinkom;
  - povezani testi v `tests/run.js`, skupno merjenje bloka ure (`timesBox`) za znak in napis.
- **Vprašanji na strani Odločitve 3** (5. 11. 2026):
  - `sovoznik-glas`: kateri angleški glas (prilagojeno po odločitvi o angleščini): angleški glas telefona (priporočeno), posneti zvoki iz angleškega sintetizatorja, tvoj glas v angleščini;
  - `sovoznik-kje`: samo odprte ceste ali tudi dirkališča (v prvem krogu ali v vsakem).
- **6. 11. 2026, uporabnik** (stran Odločitve 3, prebrano; sporočilo koordinacije VSE SEJE 2):
  - `sovoznik-kje` = 1 · »Samo odprte ceste in kronometri, na dirkališčih ne.« Tako je že v kodi (`Core.codrvRoad`), sprememba ni potrebna.
  - `sovoznik-glas` = drugo · »naredi glas kot v drugih igricah, to sem že odgovoril«. O glasu je prej zapisano samo »Vse zvoke delaj v angleščini« (5. 11.).
  - Razlaga seje: kot v relijskih igrah, posnet glas sovoznika, na vseh telefonih enak, ki bere v relijskem ritmu beseda za besedo iz zvočnega lista (pot možnosti 2: odprt angleški sintetizator z licenco za Google Play). Ne glas telefona (možnost 1) in ne uporabnikov glas (možnost 3). Isti glas tudi na relijskih kronometrih. Izvedba: razdelek »Predaja: glas«.
- **6. 11. 2026, seja koraka 2** (privzete izbire, brez vprašanja; vprašanje `sovoznik-glas-izbor` z vzorci treh glasov, am_michael, bm_george in af_heart, je na strani Odločitve 3, odgovor prebere koordinacija VSE SEJE 2; do odgovora velja priporočeni):
  - glas `am_michael` (razpoznava govora whisper-tiny je njegove klice prepoznala najbolje); drug glas je en ukaz orodja (`--voice`); **zamenjan 6. 11. po izbiri uporabnika (naslednja točka)**;
  - hitrost modela 1,3 in pospešek 1,15 (pri 1,25 in več razpoznava zgreši besede); MP3 LAME -V7 (137 KB);
  - zvok čelade v igri, ne v posnetku; posnet glas tudi na relijskih preizkušnjah, glas telefona samo kot rezerva.
- **6. 11. 2026, uporabnik** (vprašanje `sovoznik-glas-izbor` na strani Odločitve 3: odgovor 2 · »Britanski moški glas«, v pogovoru s sejo VSE SEJE 2; priporočena je bila možnost 1, `am_michael`): glas sovoznika je `bm_george`.
  - Seja je list izdelala znova z `python3 tools/sovoznik-glas.py --voice bm_george` (britanska izgovorjava besed, privzeta hitrost modela 1,3 in pospešek 1,15, enako kot v vzorcih, ki jih je uporabnik slišal: vzorec je trajal 17 s, z `am_michael` 15 s). Privzeti glas orodja je zdaj `bm_george`, da ga zagon brez `--voice` ne zamenja.
  - List: 25,9 s, 150 KB (meja testa 160 KB), v pomnilniku ~2,5 MB. Klici so ~17 % daljši (razdelek Glas, Dolžina klicev), zato je meja testa `sovoznik-glas.test.js` 8,5 s in 3,7 s (prej 7 s in 3,2 s). Vodilni čas pred ovinkom (`cdLead`) daljšemu klicu sledi, a ima zgornjo mejo 260 m: najdaljši klici (~8 s) se pri hitrosti nad ~33 m/s (120 km/h) končajo za ovinkom (z `am_michael` ~6,6 s: nad ~39 m/s).
  - Razpoznave govora za nov list seja ni poganjala (uporabnik je glas izbral po poslušanju vzorcev). Hitreje: `--tempo` (pri `am_michael` je razpoznava pri 1,25 in več zgrešila besede, za `bm_george` ni preverjeno).
- **6. 11. 2026**: Vršič (#394; iz Slovenije ostane Medvode), Mount Buller in Sani Pass (#379) gredo med testne proge (odločitve uporabnika »ena proga na državo«). Sovoznik jih izgubi sam (pravilo »brez `test`«). Testi sovoznika so zato na cestah, ki ostanejo: Rio do Rastro (grbine iz višin, brskalniški test), Medvode, Harju, Ouninpohja in Pikes Peak (»caution«).

## Stanje

- 5. 11. 2026: tema je v `docs/vrsta.md` (#337), načrt v tej datoteki (#340), vprašanji na strani Odločitve 3; `sovoznik-glas` prilagojeno na angleški glas.
- 5. 11. 2026: koda opomb in napisov končana (PR #359, veja `sovoznik/cesta`): klici vseh 15 cest, napis pokonci in ležeče, številka na znaku, stikalo Izklop · Napis · Glas in napis, testi. Naslednje: glas na cestah po odgovoru `sovoznik-glas` (korak 2), dirkališča po odgovoru `sovoznik-kje`.
- 5. 11. 2026: popravki po pregledu PR #359 (10 ugotovitev, razdelek Odločitve) v istem PR-ju; povezani testi zeleni.
- 6. 11. 2026: odgovora zapisana (razdelek Odločitve), testi z Vršiča na Rio do Rastro in Pikes Peak. Naslednje: posnet glas v novi seji (razdelek »Predaja: glas«); PR #359 čaka v vrsti kot osnutek.
- 6. 11. 2026: posnet glas (korak 2) končan v PR #402 (veja `sovoznik/glas`): zvočni list, orodje, predvajanje, pravila »Kdaj govori«, testi; povezani testi lokalno zeleni, osnutek do vrste, na `main` za #359. Prvi list je imel glas `am_michael`; uporabnik je pri `sovoznik-glas-izbor` izbral drugega (spodaj).
- 6. 11. 2026: uporabnik je pri `sovoznik-glas-izbor` izbral 2 · britanski moški glas; list v PR #402 je zamenjan z `bm_george` (150 KB, klici ~17 % daljši, meji testa dolžine klicev 8,5 s in 3,7 s, razdelek Odločitve); povezani testi lokalno zeleni, osnutek do vrste, na `main` za #359. Drug glas ali hitrost: `tools/sovoznik-glas.py --voice <ime> [--tempo <x>]` in povezani testi.
