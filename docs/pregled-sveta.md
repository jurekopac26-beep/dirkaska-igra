# Pregled sveta: skupni deli `js/world.js` in `js/world-*.js`

**Stanje: v delu** (seja Pregled sveta, račun biketraveler, 8. 11. 2026). Samo branje: popravkov v tej temi ni, koda igre ostane nespremenjena.

Odločitev uporabnika 8. 11. 2026 ob ~17.40 (tabla #382, Matejev komentar 6724187167): na svežem `main` pregled kode `/code-review max` na skupnih delih sveta. Ista tema in isti osnutek PR (#512) kot pregled jedra (`docs/pregled-jedra.md`, veja `pregled/jedro-in-svet`).

## Obseg
- Skupni deli `js/world.js` (gradnja proge, teren, ograje, drevesa, boksi, ljudje, LOD, skupni pomočniki) in vse `js/world-*.js` pravih prog in skupnih gradnikov (`world-gore.js`, `world-ljudje*.js`, `world-zivali.js`, `world-zastave.js`, `world-zaslon.js` …).
- **Izvzeti** (zamrznjeni, `CLAUDE.md`, »Testne proge«): graditelji prog s `test: true` in njihove datoteke `js/world-<id>.js` (Mount Baldy, Beartooth, Big Sur, Detroit, Mount Hotham, Longford, Mauna Kea, Moki Dugway, Monterey, Santa Monica Mountains, Newcastle, Palomar Mountain, Rio de Janeiro, Riverside, Townsville, Uncompahgre, Vršičevi deli v `world-vrsic.js`) ter graditelji Jezera, Riviere, Gorskega relija, Monte Carla, Bakrenega gozda, Toskane in Gromskega rta v `js/world.js`.
- Vrstice veljajo za `main` 90e09dac (8. 11. 2026).

## Kako je preverjeno
- **Krog 1** (`/code-review max`, en prehod): branje kode; vseh 27 pravih prog zgrajenih v brskalniku brez glave (visoka kakovost): nobena geometrija, matrika ali predmet nima NaN/Infinity, nobena proga ne izpiše napake v konzolo; imena ovinkov, ki jih iščejo graditelji (Nürburg, Spa, Suzuka, Ouninpohja, Irohazaka, krajevne table), v progah obstajajo; iskanje mesta helikopterja ponovljeno zunaj igre in izmerjeno.
- **Krog 2** (vzporedni pregledovalci po datotekah, vsaka najdba posebej preverjena): v delu.

## Napake po resnosti

Oznake: **kritična** (igra pade ali je nevozna), **huda** (napačno vedenje, ki ga igralec vidi na več progah, ali kršitev pravil za Google Play), **srednja** (napačno vedenje v ožjem primeru ali vrzel, ki skrije prihodnje napake), **nizka** (majhna vidna napaka, obremenitev, čiščenje).

### Kritične
Ni najdenih.

### Hude

**S1. Imena dirkališč na tablah in grafitih (pravna varnost)** — `js/world.js:5070`, `js/world.js:5090`, `js/world.js:5132`, `js/world-nring.js:242-243`, `js/world-nring.js:291`, `js/world-spa.js:67`, `js/world-spa.js:355`
- **Primer:** Nürburg, Nemčija: transparenti na zidovih ciljne ravnine (atlas `BAN+1`…`BAN+3`), table na mostovih čez progo in grafiti na cesti pišejo NÜRBURGRING, GRÜNE HÖLLE, NORDSCHLEIFE. Spa, Belgija: tabla nad štartom in zasloni čez progo pišejo SPA-FRANCORCHAMPS. Vse je vidno s kamere za avtom.
- **Zakaj napaka:** `CLAUDE.md`, »Pravna varnost«: v igri so samo zemljepisna imena, table in napisi so generični ali izmišljeni; »Ime proge«: ne imena dirkališča. Progi sta preimenovani v Nürburg in Spa, napisi pa so ostali. Pred objavo na Google Play.

### Srednje

**S2. Skupne ure animacij preskočijo vsakih 1000 s** — `js/world.js:5216` (veter `t % 1000`), `js/world.js:5207` (gledalci `tw % 1000`), `js/world-zivali.js:503` (črede, 3600 s)
- **Primer:** po 16 min 40 s igre (čas izrisa le narašča, `render.js:3324`, `render.js:10244`; trije krogi Nürburga so daljši) `uWind` v enem sličici pade s 1000 na 0. Šopi ob robu (`sin(uWind*2.1…)`, `sin(uWind*1.63…)`, `world.js:3976`) skočijo za 1,4 in 2,7 rad, drevesa Nürburga in Spa (`sin(uWind*0.87…)`, `world.js:215`) za 2,9 rad, zastave (`sin(uFlagT*0.37…)`, `world-zastave.js:43`) za 0,7 rad; roke in navijanje gledalcev (`uTime*9`, `*8`, `*7`, `*3.1`) do 2,5 rad. Rob ceste, gozd, zastave in gledalci hkrati skočijo v novo lego; črede enkrat na uro.
- **Zakaj:** hitrosti v senčilnikih pri 1000 (oz. 3600) ne naredijo celega števila obratov.

**S3. Helikopter TV na Ouninpohji in Harjuju se ravna po izbrisanih kamerah** — `js/world.js:4420` (`pkFollow`)
- **Primer:** mesto helikopterja se išče proti štirim kameram: dve sta kamera za avtom s starim nagibom (0,98 in 0,9 rad; prava kamera ima 0,686 in 0,63, ker je `Render.cam.userTilt` stalno 0,3, `game.js:564`), `views[2]` in `views[3]` pa sta izbrisani izometrična in kino kamera, ki gledata vedno v smer −z. Na ravnem pri 25 m/s s samo pravima pogledoma helikopter obstane 39° od smeri avta na 27 m, ne glede na smer; s kodiranimi pogledi gre pri smeri 0° na −6° (34 m, skoraj naravnost spredaj, na zgornjem robu pokončne slike), pri 30° na −21°, pri 60° na +54° (46 m), pri 90° na +69°, pri 300° na +9°. Na ovinkasti hitrostni preizkušnji helikopter kroži okoli avta, ko cesta zavija.
- **Obremenitev:** vsaka sličica do 2.400 projekcij (120 kandidatov × 4 pogledi × 5 točk); polovica za izbrisana pogleda, 16 projekcij zaščitenih točk se ponovi za vsakega kandidata.

**S4. Gradnja sveta spremeni fiziko boksov; Node testi tega ne vidijo** — `js/world.js:1393`, `js/world-bangsaen.js:249`, `js/world-montreal.js:386`, `js/world-rbring.js:861`, `js/world-toronto.js:317`
- **Primer:** graditelji zapišejo `T.pitStands` v progo jedra; `pitAt().inner` (`core.js:1297`) je od njega odvisen, trki ga uporabijo kot mejo na strani zidu boksov za vsak avto v boksih (`core.js:3309`). Node testi sveta ne zgradijo (`tests/aipits.test.js`, `bathurst.test.js`, `coldtyres.test.js`, `compounds.test.js`, `faults.test.js` nimajo `pitStands`), zato simulirajo mejo ob ograji (zid + 0,12 m), v igri pa je meja dlje, na robu pasu ob boksih. Na sredini pasu je razlika 1,33 m (Bathurst), 0,83 m (Spa), 2,33 m (Štajerska), 2,73 m (Toronto), 3,53 m (Montréal). Sprememba, ki avto v boksih zapelje proti zidu, prestane vse Node teste in v igri zadene robnik tribun.

### Nizke

**S5. Sled gume na startni črti ima luknjo na Torontu in Trois-Rivièresu** — `js/world.js:3797`
- **Primer:** zanka `for (k = 0; k <= N; k += st)` krog sklene samo, če je `N` večkratnik `st`. Toronto (`N` = 1463) in Trois-Rivières (`N` = 1225) imata razmik vzorcev ≤ 2 m, zato `st = Math.round(3 / ds) = 2` in `k` se ustavi pri `N − 1`: obe sledi (`sd` = −1 in +1) imata ~2 m luknjo med vzorcem `N − 1` in 0, tj. na startni črti. Korak se obrne že na drobnih razlikah `ds` (`Math.round(1.5)` = 2, `Math.round(1.4993)` = 1), zato ima večina dirkališč ločljivost sledi 2 m, ti dve pa 4 m.

**S6. Prosojnost stavb pred koncem kroga v Marakešu** — `js/world.js:5262` (`view()`)
- **Primer:** točka 20 m naprej je `T.idx(clamp(q.s + 20, 0, T.len − 0.01))`; na zaprtem krogu (Marakeš, 2956 m, `startS` 0) jo `clamp` ustavi na zadnjem vzorcu, namesto da bi se ovila. Zadnjih 20 m pred ciljem `uB` zdrsne nazaj na avto, pas prosojnosti (`hjCutMat` prek `mrBldMat`, `world-marrakesh.js:123`) se skrči na sam avto, stavba, ki zakrije cesto takoj za črto, ostane polna; ob prehodu črte pas skoči nazaj na 20 m. Vsak krog. Odprte ceste z istim rezom (Harju, Medvode, Ouninpohja, Pikes Peak) so v redu.

**S7. Daljna meglica na Irohazaki se preračuna vsako sličico** — `js/world-iroha.js:135` (`irFarUpdate`)
- **Primer:** mreža daljne meglice ima 4.690 vozlišč; preračun (en `Math.hypot`, dva `Math.exp` na vozlišče) in nalaganje ~75 KB (`position`, `aHz`) sproži premik kamere za 0,5 m, kar je pri 30 m/s in 60 sličicah/s vsaka sličica. Great Alpine Road isto funkcijo kliče šele po 3 m (`world-greatalpine.js:263`, njegov komentar pove, zakaj je 3 m varno; ista meja `R1 = cam.far − 6` velja tudi tu), Toronto po 9 m. Telefon plača delo za teren 2 km in dlje, ki se ne vidi.

**S8. Material daljne meglice je kopiran v pet graditeljev** — `js/world-greatalpine.js:253`, `js/world-iroha.js:123`, `js/world-montreal.js:872`, `js/world-toronto.js:572`, `js/world-troisrivieres.js:671`
- **Primer:** atribut `aHz`, mešanje barve megle `uHz` po ditheringu in `onBeforeRender`, ki kopira barvo megle, so napisani petkrat pod petimi ključi predpomnilnika; Toronto ima še svojo različico `irFarUpdate` (`skyUpdate`). Kopije so se že razšle (korak 0,5 m, 3 m, 9 m, S7). Vsak popravek (npr. megla po posodobitvi three.js) je treba ponoviti petkrat; `World.api` `irFarUpdate` že izvaža.

**S9. Ostanek spoja `js/world-rbring.js.orig`** — `js/world-rbring.js.orig:1`
- **Primer:** 1.496 vrstic (33 drugačnih od živega graditelja), v repozitoriju od 472bfeee (7. 11. 2026, spoj Grafike #318), nič ga ne naloži. Grep za pomočnika Štajerske vrne dva zadetka; seja, ki popravi kopijo `.orig`, v igri ne spremeni ničesar in vsi testi ostanejo zeleni. Objava strani ga objavi (`tools/predogled.mjs` vzame drevo z `git archive`).
