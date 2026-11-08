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

## Krog 2, sproti (vmesno stanje; še ne preverjeno v glavni seji)

Sprotni zapisi desetih pregledovalcev po delih datotek; v končni različici gredo med napake po resnosti zgoraj (S10 …) ali med zavrnjene kandidate.

### Del `svet-a`

**Črte in asfalt križišč boksov po nazivni širini `T.w`, ne po resnični `T.wa`** — `js/world.js:1278` (+1285, 1292, 1296; resnost: nizka; CONFIRMED s podatki, slika ni narejena)
- **Primer:** Toronto, Kanada (`w` 6,5, pit levo): na izvozu (d 6,5..37 m) je `T.wa` = 7,0 m, `pitJunction` pa riše prekinjeno ločilno črto pri 6,18–6,38 m in polno črto ob klinu prav tam, torej 0,6–0,8 m znotraj resničnega roba dirkališča (Toronto riše cesto z `WA[i]`, world-toronto.js:189); na uvozu se `wa` dvigne s 6,0 na 7,0 m (d −235..−196). Trois-Rivières, Kanada (`w` 5,75, `wa` 6,0 na obeh križiščih): črta 0,4–0,6 m na asfaltu dirkališča.
- **Zakaj:** `pitJunction` vzame `w = T.w` za `lo`, prekinjeno črto in zunanji rob pasu (`w + 0.1 + 7u`), ne `T.wa[i]` vzorca; Core (`_pave`, `pitLead`) prav tako, zato je pas za pospeševanje merjen od nazivnega roba, ne od narisanega.

**Maske gramoznih šivov se računajo ob vsaki gradnji Medvod (~2 s CPU)** — `js/world.js:1181` (`gravelSeamMasks` 1093–1142; resnost: nizka–srednja, nalaganje na telefonu; CONFIRMED z merjenjem v Node)
- **Primer:** Medvode, Slovenija (edina prava proga z `gravelSeams`, world-medvode.js:758): `gravelSeamMasks(7.8, 7.8, 10, 12)` traja v Node 2,0–2,4 s (`edgeLinePaint`, ki ga koda zaradi ~80 ms hrani med gradnjami, na istem stroju 71 ms: ~30x manj). Maska je določena (vse seme fiksno, »the same on every build«), a se naredi znova ob vsakem nalaganju proge (`ensureTrack` → `Render.buildWorld`) in se ob menjavi sprosti (`ownTex`).
- **Zakaj:** 256 x 512 pikslov, na piksel ~50 klicev `valueNoise2` in zanka 4 tirnic; ni predpomnilnika kot `edgeLineTile` (ključ `w, wr, back, fwd`). Na telefonu (3–5x počasnejši CPU) nekaj sekund več na zaslonu »Nalagam progo«. (Meritev na obremenjenem stroju; delež v celotni gradnji Medvod ni izmerjen.)

### Del `svet-b`

Obseg: js/world.js 1433–3612 (build). Ugotovitev: za prave proge se iz build() izvede samo 1433–1441 (vse teme pravih prog imajo World.ext), ostalo samo za testne teme.

#### Preverjeno, ni napake (sproti)
- Doseg: vse teme pravih prog imajo World.ext (index.html naloži vse world-*.js; balea prek world-prelaz PL_LOOK, mountbuller prek World.gore, bathurst/cpalace prek rbring, pikesg deduje temo 'pikes'); build() se za njih konča v vrstici 1441 (return finish). Telo 1442–3609 (tla, površina, robniki, ograje, portal, tribune, boksi, gledalci, drevesa, KNOCKABLE PROPS, CS STYLE z `if (CSX)`) teče samo za teme lake/city/mountain/monaco/forest/italia/kamp = testne proge. Edini vpliv na prave proge: Jezero je privzeta proga (DEF.track), zato se ob prvem zagonu zgradi pred pravo progo.
- Ponastavitev ob začetku (1434–1440): LOD, THIN.n, CULLM, SHLO, CROWDS, T, THEME, CSX, ROCK_SMOOTH, SEA, RIVER, RW, CASTLE, hash; SYNC pred graditeljem; KEEP: vsi ključi (VR, DT, HJ, KT, LFQ, MR, NC, OU, PK, SZ, TRW) imajo setter na API, NR posebej. hillN/mtnN/MF/MC_TER se za EXT ne ponastavijo, a jih bere samo groundH/mountainH testnih tem (yardWorld in drugi `o.groundH || groundH`: vse prave proge z def.yard dajo groundH).
- Noben world-*.js ne zajame T/LOD/NR … ob nalaganju (vsi z `let T` imajo API.sync).
- Zagon (Chromium, ena stran, Render.buildWorld zapored): spa→medvode→spa, sani→iroha→sani, bathurst→cpalace→bathurst, mountbuller→balea→mountbuller: podpis sveta (mreže, oglišča, primerki, kontrolna vsota, props, cull, shadowLo, crowdPts, stats) enak; pomnilnik geometrij se vrne, teksture rastejo samo za skupne Tex.all (po zasnovi).
- Testna pot ne spreminja skupnih predmetov: tex.checker.repeat.set(1,1) kot vsi graditelji; scene.add samo root; ni pisanja v API/World/Core/Tex.

### Del `svet-c`

**Helikopter (pkFollow) stane ~1 ms JS vsako sličico** — `js/world.js:4433` (resnost: nizka; CONFIRMED)
- **Primer:** Ouninpohja, Finska (enako Harju): `World.update` z `dyn.pk` 1,29 ms/sličico, brez `dyn.pk` 0,23 ms (Chromium na namizju, ogret JIT, 300 klicev); na sličico 122 klicev `pk.gH` in iskanje čez 24 × 5 = 120 kandidatov × 4 pogledi × (1 + 4) projekcij, vsaka nova tabela (`scr` vrne `[..]`, `views`, `cams`, `prot` na novo) — na telefonu ocenjeno 3–4 ms od 16,7 ms.
- **Zakaj:** iskanje mesta teče vsako sličico s polno mrežo, čeprav se rezultat gladi z `e(1.2)`/`e(0.8)` (zadostovalo bi vsako n-to sličico ali manj kandidatov); 3 od 4 pogledov so izbrisane kamere (to je S3, tu je izmerjena cena).

**Sence oblakov tudi ponoči (in čez svetleče ploskve)** — `js/world.js:3671`, `js/render.js:3794` (resnost: nizka; CONFIRMED s sledenjem kode)
- **Primer:** katera koli prava proga, `setAtmos({ tod: 'night' })`, suho: `dyn.clouds.K` ostane `k0` (0,2; po temi 0,14), zato temne lise 100–300 m (do −20 %) še naprej drsijo po tleh, cesti v žarometih, hišah — tudi po emisivnih ploskvah (okna, `rsSigns` z `emissive`), ker se `gl_FragColor.rgb *= vCloud` izvede za `outgoingLight` (z emisijo).
- **Zakaj:** jakost senc nastavlja samo `applyWeather(r)` (`k0 * (1 - r)`), čas dneva (`atmos.tod`, `todK`) je ne spremeni; ponoči ni sonca, ki bi metalo sence oblakov.


**Betonski zidovi dvorišč (`def.yard`, vrsta 3) brez kontaktne sence (AO)** — `js/world.js:4384` (resnost: nizka; CONFIRMED s sledenjem kode in podatki prog)
- **Primer:** Spa, Belgija: 386 m betonskih zidov iz `def.yard` (vrsta 3: `box(…, y0 - 0.3, …, conc, concT)`, neprosojen `MeshLambertMaterial`, pokončne ploskve na tleh) ostane brez temnega pasu ob vznožju, ki ga dobijo vsi drugi zidovi, hiše in ograje; enako Suzuka, Japonska 63 m, Štajerska, Avstrija 61 m, Nürburg, Nemčija 37 m, Bathurst, Avstralija 30 m, Montréal, Kanada 9 m.
- **Zakaj:** `finish()` kliče `aoWorld(o, tex)` (prehod čez vse mreže v `o.root`) pred `yardWorld(o, tex)`, zato zidov, ki jih ta doda pozneje, ne vidi; komentar pri `aoWorld` obljublja »every world at the end of its build … every upright face«. Enako po `aoWorld` pridejo `World.life`/`World.people` (ni preverjeno, ali imajo pokončne ploskve na tleh).

### Del `pikes`

#### Najdbe (sproti)

**Ime prireditve na tabli z rezultati in podiju** — `js/world-pikes.js:3622` (in `:1958`) (resnost: huda; CONFIRMED za 3622, PLAUSIBLE za 1958)
- **Primer:** Pikes Peak (makadam), ZDA (`pikesg`, `pkHistoric`): ročno pisana tabla z rezultati ima spodaj napis `PIKES PEAK INT'L HILL CLIMB` (ime prireditve, Pikes Peak International Hill Climb). Na obeh različicah (`pkLandmarks3`) ima ozadje podija napis `RACE TO THE CLOUDS`, vzdevek iste prireditve (verjetno njena blagovna znamka; ni preverjeno).
- **Zakaj:** CLAUDE.md »Pravna varnost«: brez imen prireditev; tabla in napisi naj bodo generični ali izmišljeni.

**Cisterna pred startom (makadam) brez naklona in pogreznjena: `crAt` vrača skupni objekt** — `js/world-pikes.js:3982` (resnost: nizka; CONFIRMED)
- **Primer:** Pikes Peak (makadam), ZDA, pred zeleno lučjo (`pre`): cisterna, ki pelje navzdol (s = startS + 160 … 460), ima vedno naklon 0° namesto 2,94° ceste in višino ceste 3 m nižje (izmerjeno v Chromiumu, `pkMovingUpdate` pri t = 10, 37,3, 64,1, 99,9: y = hy(sm − 3) + 0,02, npr. 22,205 namesto 22,359 pri sm = 475): zadnji konec ~0,3 m v cestišču.
- **Zakaj:** `crAt` (world.js:4924) vrne vedno isti objekt `CRQ`; `qa = crAt(sm + 3), qb = crAt(sm - 3)` sta isti objekt, zato `qa.hy - qb.hy = 0`, in `q.hy` pri `mv.tv.set(x, q.hy + 0.02, z)` in `U.uN1` je že prepisan z vrednostmi pri sm − 3.

### Del `ljudje`

**Ograja vrta in ljudje ob njej znotraj ograje proge (Ouninpohja, hiša)** — `js/world-ljudje.js:660` (resnost: srednja; CONFIRMED)
- **Primer:** Ouninpohja, Finska, prizor `hisa` 2240 m levo (s0 = 2310): `T.bl` = 9,7 m, cesta ±6 m. `front = 16 - F.bar - 4` = 2,3, `fb = front - 3,1` = -0,8: ograja vrta (picketFence), poštni nabiralnik (b = -1,4) in ljudje ob ograji (b = fb + 0,45…0,6 = -0,35…-0,2) stojijo 0,2–2,5 m znotraj fizične ograje proge, na travi med asfaltom in ograjo, kamor avto lahko zapelje. Brskalniški zagon (scan.mjs): 4290 od 10086 oglišč stvari prizora in ljudje do -0,43 m znotraj ograje (A.clearance < 0); asfalta ne zadenejo.
- **Zakaj:** mesta prizora so računana od sredine ceste (hiša sveta na 16 m), ne od `F.bar`; pri bl = 9,7 pade `fb` pod 0. Stvari in ljudje prizorov nimajo trkov, zato avto ob ograji pelje skozi ograjo vrta in ljudi, ki tam navijajo.
- **Vrzel v testih:** `tests/browser/ljudje.test.mjs` preveri `A.clearance` samo v prvi pozi (act), `tests/ljudje-mesta.test.js` pa samo stranske ceste, ulice, boks in razmike; mest ob ograji (`fence`) in stvari prizora proti ograji proge ne preveri nobeden, zato je `hisa` zelena.

**Prizor `tv` (navijači pred televizorjem) šteje za osebje** — `js/world-ljudje.js:1213` (resnost: nizka; PLAUSIBLE)
- **Primer:** Nürburg, Nemčija, `tv` 4720 m desno in 16350 m levo: trije navijači tečejo k ograji (cheer, phoneUp, wave), v dežju pa nimajo dežnikov kot drugi navijači (`p.um` false zaradi `STAFF_SCENES.has('tv')`); `tests/ljudje-mesta.test.js` zanj zahteva le 100 m razmika (osebje) namesto 250 m (navijači).
- **Zakaj:** v `STAFF_SCENES` sta `tv` in `tvekipa`; `S.tv` (»Dirka na televiziji pod šotorom«, 641) je skupina navijačev, ne TV ekipa. Ni preverjeno, ali je bil namen samo brez dežnikov pod šotorom (komentar pravi »the staff's scenes«).

### Del `rbring-medvode-harju-ouni`

**Dim letal se računa vsako sličico vso dirko, tudi ko je že nevidno** — `js/world-rbring.js:262` (resnost: nizka; CONFIRMED z zagonom)
- **Primer:** Štajerska, Avstrija (in Bathurst, Avstralija, ki ima letala prek istega `rbAir`): `RB_JET` v=70 m/s, dim od d=-420 do 420 m -> 840 m / 70 m/s = 12 s po 0,1 s = 120 vzorcev na sled (meja 120). Po preletu (`tt > 60` -> `A.t0 = -1`) `tr.s` ostane poln; `tr.m.visible` je po 22 s false, a zanka 3 × 120 vzorcev (3× `Math.hypot`, `for (const o of [0, 4])` = nova tabela na vzorec, ~360 tabel na sličico) in `needsUpdate` tečejo vsako sličico do konca dirke.
- **Zakaj:** `tr.s` se izprazni samo ob `A.go` (nova dirka) ali `!car`; zanka ne preveri, ali je zadnji vzorec starejši od 22 s (`tr.m.visible` se izračuna šele za zanko).
- **Meritev** (Chromium brez glave, `meas.mjs` v mapi dela): Štajerska, po preletu (t0+80 s) `trails` = 3 × 80 vzorcev (korak 0,05 s; v igri pri 60 sl/s ~120), vse `visible=false`; `rbAirStep` 48 µs na klic, s praznimi `tr.s` 4 µs -> ~44 µs/sličico za nevidni dim (pri 120 vzorcih ~66 µs; telefon nekajkrat več), vso dirko. Perf golden `jsMs` Štajerske je 1,49 ms.

### Del `gore-vrsic-katu`

**STG (slepi kraki) ostane od prejšnje proge** — `js/world-vrsic.js:1116` (+ `js/world.js:1440`) (resnost: nizka; CONFIRMED)
- **Primer:** Medvode, Slovenija (104 slepi kraki) → Pikes Peak, ZDA: po gradnji Pikes Peaka `World.api.STG` še vedno drži Medvodski Map (342 celic, 754 referenc na Medvodske `S`, nobena ni v `race.track.stubs`); `World.api.VR` je null. Izmerjeno v brskalniku (scan2: medvode → pikes → mountbuller → katu → iroha → balea; vse brez NaN in napak).
- **Zakaj:** `STG` ni registriran z `World.keep`, zato ga `World.build` (world.js:1440) ne sprosti; nastavi ga samo `vrStubs()` (vrPrep ali neposredno), ki ga teme brez `vrPrep` (pikes, spa, dirkališča, ouni …) ne kličejo. Danes ga nihče ne bere napačno (`roadside` v world.js:4227 zahteva tudi `API.VR`, ki je null; vsi bralci `API.STG` — chapman:43, caracoles:61, katu:216, medvode:135 — prej pokličejo vrPrep/vrStubs), zato je to zadrževanje pomnilnika in past za prihodnji graditelj, ki bi bral `API.STG` brez `vrStubs()` (koordinate prog so lokalne, stari kraki bi zravnali teren nove proge).

#### Zavrnjeni kandidati
- vrStubH/vrStubAt robovi (S.bb ±8 oz. ±14 m pri hash): S.bb že vsebuje R = hw + em + lim + rm + 1, klicatelji m ≤ 2.
- vrNear pokritost (±2 celici po 32 m) = rez d ≥ 64 m; hn na koncih odprte ceste je clamp(0, N−1), i0 ≤ N−2.
- VR/VRS od Vršiča ali Irohazake na Bâlei: vrPrep vedno naredi nov VR, KEEP ga prej izniči; VRS berejo samo vrCol/vrSnow/vrTreeGeo/vrTileGeo, ki jih od pravih prog uporablja le Irohazaka (sama nastavi VRS), Medvode ga nastavi na 'summer'.
- Katu: `API.VR` null → `roadside` vzame T.query (namenoma); STG Katuja je svež (29 celic, vse iz njegovih krakov).
- Imena ulic po osebah (Medvode: »Cesta komandanta Staneta«, »Finžgarjeva ulica«): tabla je prazna modra z belimi črtami, celice atlasa z imeni se ne rišejo (world-medvode.js:866); stubProps riše imena samo na Great Alpine Road (zemljepisna).
- ktAtlas/stubAtlas predpomnjeni, teardown jih sprosti (render.js:3402) → three.js jih ob ponovni rabi naloži znova; komentar v world-katu.js:282 je zastarel, ni napaka.
- world-gore moveBirds `v3.clone()` vsako sličico: edina prava uporabnica (Mount Buller) ima `animals: []` (stats animals 0).
- world-gore moveSkiers brez rezanja po razdalji: 102 smučarja, vrGround je iz predpomnjene mreže G.h, poceni.
- vrTileGeo popravek razpok proti vrGround: razlika samo v obroču 300–430 m (v megli).
- world-zaslon tvCams n = 0, sprostitev `last`: na pravih dirkališčih ni primera.
- world-zastave `cur` ostane [] ob izjemi: samo privzeti graditelj testnih prog.
- stubGeo.emit izpusti S.i0 == N−1: zadnji kos ima c1 > N−1, takega kraka ni.
- vrStubs dvakrat (vrPrep + neposredno) v gore/iroha/medvode/greatalpine: odvečno, poceni.
- world-zivali nearPpl krožna razdalja na odprtih cestah: največ izpusti eno mesto živali do 45 m od drugega konca.
- Katu cpS = 4 → 4 vrstice atlasa CP se ne prekrivajo z vrstico table prelaza.

### Del `dirkalisca`

Začetek 19.16. Najdbe sproti.

#### N1 Ime ovinka »Speaker's Corner« na tabli ob progi in na HUD (Spa) — CONFIRMED, srednja (pravna varnost)
- `js/tracks/spa.js` (names), `js/world-spa.js:513` (tabla z imenom ovinka za vsak `T.names`, 55 m pred ovinkom), `js/world-spa.js:65` (atlas `n.toUpperCase()` → »SPEAKER'S CORNER«).
- `maketa-menija/README.md:364` ga izrecno navaja za zamenjavo (»Speaker's Corner → Short Left«, »Pred prodajo jih je treba zamenjati tudi tam«); CLAUDE.md: ovinek dobi opisno ime »enako kot v meniju«. Druga imena s seznama (Paul Frère, Degner, Dunlop, Casio) so v igri že zamenjana, to ne.

#### N2 Mreža MG Montréala ostane v pomnilniku po menjavi proge — CONFIRMED (sledenje kode), nizka
- `js/world-montreal.js:52,103` (`let MG` v modulu, `mtPrep` jo zapiše), `:893` (ni `World.keep`/`API`-lastnosti kot TRW/SZ). `World.build` sprosti samo ključe v `KEEP` (world.js:1440), zato MG (577 × 913 = 527 tisoč celic: wet, kind, H, SD, dT ≈ 7,4 MB) ostane do naslednje gradnje Montréala. Tudi `K` drži `extAPI()` s T.

#### N3 Tabla »80« ob uvozu v bokse v Montréalu stoji na napačni strani (desno), z drogom na robu asfalta — CONFIRMED (Node: Core pitAt), nizka
- `js/world-montreal.js:394`: `atSf(sE, sg * (pE.o * sg + 5.5))`; `pitAt().o` je pozitivna razdalja (tako jo uporablja ves mtPits: `at(s,o)=atSf(s, sg*o)`), zato je pri levih boksih (sg = -1) odmik `o − 5.5`.
- Primer: sE = −173 m, pE.o = 11,80, w = 5,2, br = 7,81 → tabla pri +6,30 (desno; boksarska steza je pri −11,80, levo). Plošča 3,2 m sega 4,7–7,9 m (0,5 m nad asfalt), notranji drog pri 5,1 m stoji na asfaltu (avto gre skozenj). Pravilno: `sg * (pE.o + 5.5)`.

#### N4 Suzuka: glavni tribuni V1 in V2 imata 3 m pas razmazane množice, kjer s preskoči čez 0 (startS = 234) — CONFIRMED (Node: vrednosti vrst), nizka
- `js/world-suzuka.js:554`: `u = s / 12` z absolutnim `s = sAt(d)`; pri Suzuki je `T.startS` = 233,99 m (points[0] 235 m pred štartom), zato s = 0 pade v tribuno V1 (d −237…57) in V2 (−234…−51).
- Vrsti d = −234 (s = 5803,64, u = 483,637) in d = −231 (s = 2,99, u = 0,249) sta povezani (`gc.link`, globina 6,8 / 22,1 m, ni nearX) → v 3 m segmentu u pade za 483 ponovitev slike (STAND_FS: `crX = vUv.x*32` → ~15.500 sedežev na 3 m): pas šuma/najnižje mipmape čez obe glavni tribuni. Toronto in Trois-Rivières imata isti `u = s/12`, a njune tribune s = 0 ne prečkajo (startS = 0, vrzel pri štartu). Popravek: u iz `d` (ali `dS(s)`).

### Del `ostale-in-menjava`

**Sprememba »Podrobnosti« (in »Grafika: Retro«) na isti progi ne zgradi sveta znova** — `js/game.js:1622` (resnost: srednja; CONFIRMED)
- **Primer:** Bathurst, Avstralija, zgrajen pri Podrobnosti Nizka (1079 mrež, 1248 tisoč oglišč); igralec nastavi Visoka in začne novo dirko na isti progi: `Render.world` je isti predmet (`rebuilt:false`), svet ostane Nizka (1079 mrež, 1248k) — Visoka bi imela 1067 mrež, 1649k. Enako v obratni smeri: telefon, ki zaradi počasnosti preklopi na Nizka, ostane pri polnem svetu, dokler ne zamenja proge. Meritev: `krog2/ostale-in-menjava/swap.mjs`, `swap1.out` (vrstica `bathurst:high!`).
- **Zakaj:** `ensureTrack` gradi znova samo ob drugem `id` ali `Render.worldStale` (letni čas Vršiča); `setOption('detail'|'quality')` (game.js:607–628) ne sproži gradnje in ne označi sveta kot zastarelega. `docs/igra.md` (»Podrobnosti grafike«) obljublja, da se sprememba pozna »pri naslednji progi ali dirki« — »ali dirki« ne drži.

**Nürburg: štartna polja samo za 21 od 100 avtov** — `js/world-nring.js:88` (resnost: nizka; CONFIRMED s sledenjem kode)
- **Primer:** Nürburg, Nemčija: dirka ima `def.raceRivals: 99` (game.js:2272 → 100 avtov, mreža `9 + (g−1)·7,5 m`, core.js:5908), svet nariše `nBox = max(14, def.rivals + 1)` = 21 polj (`def.rivals: 20`); avti od 22. mesta naprej (do ~750 m za črto) stojijo na asfaltu brez polj.
- **Zakaj:** graditelj bere `def.rivals` namesto števila avtov dirke (`def.raceRivals || def.rivals`), komentar »a box for every car« ne drži.

#### Preverjeno, ni napake (sproti)
- Ponovna gradnja iste proge po drugi progi (Spa) in dvakrat zapored, pri tier 2 in 0 (`det.mjs`, `det1.out`): Bathurst, Sani, Irohazaka, Livorno, Crystal Palace, Mount Buller, Nürburg — vse mreže, oglišča, barve, matrike primerkov in `props` enaki; globalno stanje (`let` v modulih, `KEEP`, `API.sync`, atlasi `irATex`/`saATex`/`nrATex`) ne pušča med gradnjami.
- GPU po menjavah Bathurst→Spa→Pikes→Bathurst (high, low) (`swap.mjs`, `swap1.out`): teksture 52→54→54, geometrije +1…+4 na isti progi, programi 60–63: ni rasti, ki bi jo memory.test ne dovolil.
- `API.VRS` v Irohazaki: nastavi Vršičev `VRS` prek `Object.defineProperties` (world-vrsic.js:1116), barve terena (`vrCol`, `vrTreeGeo`) so pravega letnega časa.
- `KEEP['NR']`/`['VR']`: `nrPrep`/`vrPrep` vsako gradnjo naredita nov predmet, ohranjena mreža se nikjer ne uporabi znova.
