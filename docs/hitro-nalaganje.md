# Hitro nalaganje (I17)

Predlog I17, odločitev uporabnika 7. 11. 2026 ob 16.05 in 8. 11. ob ~17.40 (tabla #382, komentarja 6708750136 in 6724187167). Cilj: **~15 s od odprtja igre do vožnje** na srednje zmogljivem telefonu. Korak 1 (ta dokument, račun biketraveler, 8. 11. 2026): samo meritve in načrt, brez kode igre. Meritve v celoti: `docs/hitro-nalaganje-meritve.md`; orodje: `tools/zagon.mjs`.

## Stanje

- [x] Korak 1: meritve (skripte po skupinah, čas do menija in do vožnje s CPU 4× in 6×, počasno in hitro 4G, HTTP/1.1, gradnja vseh pravih prog z 2D platnom na procesorju in v procesu GPU, profili) in ta načrt (8. 11. 2026).
- [x] Korak 2: nujni CSS zaslona z nalaganjem v `index.html`, ostali CSS ne zavira prvega izrisa, vrstica napredka na `#loading`, CSS menija iz povezave (13. 11. 2026, #514; »Izvedba« pri koraku).
- [x] Korak 3: hiter vstop zgradi samo progo dirke, brez naslovnega sveta in predstavitvene dirke; navaden zagon ostane, kot je (13. 11. 2026, #514).
- [ ] Koraki 4–10 (spodaj, »Vrstni red«): vsak svoja seja in svoj pull request; vsak izmeri učinek z `tools/zagon.mjs` in dopiše številke v tabelo »Učinek po korakih«.

## Na kratko

- Igra ob zagonu prenese **vse**: 210 skript, 16,2 MB (5,97 MB gzip), od tega so proge in njihovi svetovi 3,5 MB gzip (58 %), samo testne proge 1,25 MB. Igra se začne šele, ko pride zadnja (`window` `load`).
- Prvi obisk na počasnem 4G (1,47 Mbit/s) in CPU 4×: zadnja skripta pride pri **35,6 s**, meni je pripravljen pri **44 s**, vožnja (hiter vstop, `bathurst`) pri **51 s**. Prvi izris (zaslon z nalaganjem) šele pri 16–20 s, ker CSS tekmuje z 210 skriptami po HTTP/2 (s HTTP/1.1 pri 1,7 s; strežnik orodja prednosti tokov ne upošteva, GitHub Pages morda bolje: preveri na objavljeni strani).
- Ponovni obisk (service worker in V8 imata vse): skripte so izvedene v ~1 s, a meni je pripravljen šele pri **6,9–12,2 s**, ker zagon pred menijem zgradi cel 3D svet zadnje proge (1,9 s `jezero`, 5,8 s `bathurst`), odpelje 6 s predstavitvene dirke in nariše prve slike 3D (med `Menu.init` in pripravljenim menijem je glavna nit skoraj ves čas zasedena z dolgimi opravili). Vožnja na `bathurst` (hiter vstop): 9,2–14,8 s.
- Gradnja proge iz menija s CPU 4× (start → vožnja, 2D platno na procesorju): 3,2–24,1 s, mediana 8,7 s, 18 od 27 pravih prog pod 10 s; nad 15 s `medvode` 24,1 s, `bangsaen` 23,9, `ouninpohja` 21,5, `livorno` 18,5, `pikes` 16,6, `nring` 15,1. Skoraj vse je `World.build`, delo procesorja, ne prenos.
- Cilj ~15 s je dosegljiv: **ponovni obisk** s hitrejšo gradnjo svetov (korak 9), ker naslovnica ostane 3D svet zadnje proge (odločitev uporabnika 8. 11.: na isti progi vožnja brez druge gradnje, na drugi dve gradnji), in menijem brez drugega prenosa CSS (korak 2); **prvi obisk na počasnem 4G** šele, ko se ob zagonu prenese ≤ ~1,5 MB gzip: glave prog, leni graditelji, moduli kasneje, pomanjšanje in izbris testnih prog (koraki 4–8 in 10).
- Predlagani vrstni red: 2 prvi izris → 3 hiter vstop brez naslovnega sveta → 4 glave prog → 5 leni graditelji → 6 moduli kasneje → 7 pomanjšanje ob objavi → 8 predpomnjenje → 9 hitrejša gradnja → 10 po izbrisu testnih prog.

## Meritve (povzetek)

Orodje `tools/zagon.mjs` igro postreže kot GitHub Pages (kopija z žigi `tools/stamp.js`, HTTP/2 s TLS, gzip, `max-age=600`, service worker) in jo odpre v Chromiumu (Playwright, zaslon telefona 412 × 915, dotik) z upočasnjenim procesorjem (CDP `Emulation.setCPUThrottlingRate`) in omrežjem (Lighthouse: počasno 4G 1,47 Mbit/s in 562,5 ms, hitro 4G 9 Mbit/s in 170 ms). Igre ne spreminja: časi klicev (`Render.init`, `buildWorld`, `precompile`, `World.build`, korak dirke, `Menu.init`) so ovite ob nalaganju skript. Omejitve: grafika je SwiftShader v procesu GPU, ki ga CDP ne upočasni (čas prevajanja senčilnikov ni tak kot na telefonu in med zavihki ostane v predpomnilniku, primerjaj število programov; 2D platna riše tam in `getImageData` ter preverjanje senčilnikov čakata nanj, zato je gradnja prog izmerjena tudi s platnom na procesorju, `--platno-cpu`, kar je bližje telefonu), indeks hitrosti tega stroja niha (1478–2675; s CPU 4× ~370–670, 6× ~250–440), strežnik orodja (Node `http2`) ne upošteva prednosti tokov HTTP/2, pomnilnik in segrevanje telefona nista posnemana.

| zagon (CPU 4×, HTTP/2) | prvi izris | zadnja skripta | meni pripravljen | vožnja (`?proga=bathurst`) |
|---|---|---|---|---|
| prvi obisk, počasno 4G | 16,5–20,5 s* | 35,6 s | 43,2–44,4 s | 50,8 s |
| prvi obisk, počasno 4G, CPU 6× | 16,5–20,5 s | 35,6 s | 45,5–45,9 s | 58,1 s |
| prvi obisk, počasno 4G, HTTP/1.1 | 1,7 s | 41,4 s | 49,8 s | – |
| prvi obisk, hitro 4G | 3,0–3,8 s | 6,0 s | 13,6 s | 22,3 s |
| prvi obisk, brez omejitve omrežja | 0,3–1,1 s | 1,0 s | 10,2 s | 17,3 s |
| ponovni obisk (toplo) | 0,9–1,1 s* | 0,3 s | 6,9 s (`jezero`), 12,2 s (`bathurst`) | 9,2–12,8 s |
| ponovni obisk, CPU 6× | 0,9–1,1 s | 0,3 s | 10,6–19,2 s | 17,0–20,9 s |

\* Krog s CPU 4× in počasnim 4G prvega izrisa ni zapisal; številki sta iz kroga s CPU 6× in istim omrežjem.

- **Prenos ob zagonu po skupinah** (gzip, MB): graditelji svetov 1,42 (44 datotek) · proge prave 1,10 (27) · proge testne 0,94 (24) · svet skupno 0,41 (9) · izris 0,37 · avti 0,29 (33) · meni 0,28 (7, od tega zemljevid in prelet `routes.js` + `geo.js` 0,20) · jedro 0,25 · igra 0,24 · misije 0,19 (35) · three.js 0,14 · deli avtov 0,11 · zvok 0,07 · jezik 0,06 · napake 0,04 · zabava 0,03 · peerjs 0,02. Nova mapa (0,43) se že nalaga leno.
- **Izvajanje skript** je poceni: vse skupine skupaj ~1 s (toplo, CPU 4×); čas je v prenosu (prvi obisk) in v gradnji svetov (vedno).
- **JS kopica** ob meniju 93–133 MB (naslovnica `jezero`), 228–242 MB z `bathurst`.
- **Gradnja prog iz menija** (CPU 4×, toplo, vsaka proga v svežem zavihku, start → vožnja): z 2D platnom na procesorju 3,2 s (`tianmen`) do 24,1 s (`medvode`), mediana 8,7 s; skoraj vse je `World.build`, senčilniki 0,2–0,5 s (SwiftShader), postavitev dirke in prve slike 0,9–2,1 s, 3–26 novih programov na progo. S platnom v procesu GPU je ista gradnja 26–41 s, ker `getImageData` in preverjanje senčilnikov čakata, da SwiftShader nariše platna (profili: `getShaderInfoLog` 12,7 s pri `bathurst`, `getProgramInfoLog` ob prvi sliki 15,9 s pri `toronto`, `getImageData` 22,8 s pri `caracoles`); to je lastnost merilnega okolja, telefon z grafičnim procesorjem platna nariše hitreje (preveri korak 9).
- **Medvode** (profil s platnom na procesorju): polni pregled `Track.nearestIdx` (vse točke proge za vsako mesto) 7,4 s, šivi makadama (`gravelSeams`) 3,8 s, postavljanje predmetov (`put`) 2,9 s, ploščice terena 2,4 s.

## Kje gre čas

1. **Prenos vsega pred zagonom.** `index.html` ima 210 navadnih `<script>` na koncu strani; `boot()` v `js/game.js` teče ob `window` `load`. Na počasnem 4G vse skripte tečejo vzporedno (~180 kB/s), zato tudi prva pride pozno, CSS pa z njimi (prvi izris 16–20 s).
2. **Naslovni svet pred menijem.** `boot()` zgradi svet `S.track` (zadnja proga; privzeta `jezero`), naredi predstavitveno dirko (`demoMake(6)`), šele nato `Menu.init`; meni je pripravljen, ko pride `css/menu.css` (`fetch` v `Menu.init`), kar čaka na prve slike 3D (2,5–3,7 s tudi brez omejitve omrežja). Hiter vstop (`?proga=`) gradi naslovni svet in nato še ciljnega.
3. **Gradnja sveta** iz menija: 3–24 s s CPU 4× (mediana 8,7 s), šest prog nad 15 s. Prevajanje senčilnikov (3–26 novih programov na progo) na telefonu še ni izmerjeno.
4. Malenkosti: `css/menu.css` se prenese dvakrat (povezava z `media="not all"` in `fetch`); `css/napake.css`, `missions.css` in `zabava.css` so v glavi strani in zavirajo prvi izris.

## Cilj ~15 s: kaj pomeni

- **Ponovni obisk** (večina zagonov; service worker ima igro, žigi pri novi različici prenesejo samo spremenjene datoteke): šteje samo procesor. Danes 9,2–14,8 s do vožnje na `bathurst` (hiter vstop), gradnja `medvode` iz menija 24 s. Naslovnica ostane 3D (odločitev uporabnika), zato je glavna rešitev hitrejša gradnja svetov (korak 9); meni brez drugega prenosa CSS (korak 2) se pokaže do 1,7 s prej.
- **Prvi obisk na počasnem 4G**: 15 s je ~2,5 s strani + prenos + zagon. Ob zagonu sme biti ≤ ~1,5 MB gzip in proga z graditeljem ≤ ~0,3 MB. Danes 5,97 MB.
- **Ovoj za Google Play** (`docs/igra.md`: TWA ali spletni pogled) še ni izbran: s TWA velja prvi obisk s strani, s spletnim pogledom (Capacitor) so datoteke v aplikaciji in šteje samo procesor (kot ponovni obisk). Koraki 3 in 9 pomagajo v obeh, koraki 2 in 4–8 predvsem spletni igri in TWA.

**Prenos ob zagonu po korakih** (`docs/hitro-nalaganje-meritve.md`, »Scenariji«; čas = samo prenos na počasnem 4G, ocena 2,5 s + MB / 182 kB/s):

| stanje | skript | gzip | čas | pomanjšano (esbuild) | čas |
|---|---|---|---|---|---|
| zdaj | 210 | 5,97 MB | 36,1 s | 4,65 MB | 28,7 s |
| testne proge ostanejo (do izbrisa): korak 4 (glave, prave proge leno) | 183 | 4,92 MB | 30,2 s | 3,65 MB | 23,0 s |
| + korak 5 (20 graditeljev leno) | 163 | 4,27 MB | 26,5 s | 3,15 MB | 20,2 s |
| + korak 6 (moduli kasneje) | 113 | 3,77 MB | 23,7 s | 2,74 MB | 17,9 s |
| po izbrisu testnih prog, brez drugih korakov | 174 | 4,72 MB | 29,1 s | 3,54 MB | 22,4 s |
| po izbrisu + koraki 4, 5 in 10 | 113 | 2,50 MB | 16,6 s | 1,68 MB | 12,0 s |
| po izbrisu + koraki 4–6 in 10 | 63 | 2,00 MB | 13,8 s | 1,27 MB | 9,7 s |

K temu pride proga prve dirke s svojim svetom (pomanjšano gzip): 31 kB (`bathurst`) do 580 kB (`medvode`, 17 datotek zaradi pomočnikov drugih svetov), +0,2–3,2 s.

## Načrt po korakih

### Korak 2 · Prvi izris in vrstica nalaganja (majhno tveganje)
- Nujni CSS zaslona z nalaganjem v `<style>` v `index.html` (ali `fetchpriority="high"` na `css/style.css`), `css/napake.css`, `missions.css` in `zabava.css` z `media="not all"` + vklop ob zagonu ali pozneje; vrstica napredka na `#loading` (npr. »2,1 / 6,0 MB«, iz `PerformanceObserver` `resource`).
- `Menu.init` CSS menija vzame iz že naložene povezave (`link.sheet` ali `<link rel="preload" as="style">`), ne z drugim `fetch`.
- Učinek: prvi izris na počasnem 4G iz 16–20 s na ~1–2 s (kot HTTP/1.1); meni je pripravljen ob `Menu.init`, ne šele po drugem prenosu CSS med prvimi slikami 3D (zdaj 1–1,7 s pozneje s CPU 4×).
- Testi: `menu.test.mjs`, `smoke`; `stamp.js --check` (nova povezava `<link>` dobi žig sama).
- **Izvedba** (13. 11. 2026): `<style id="ld-css">` v glavi `index.html` nariše `#loading` (barve in pisave kot `style.css`); vse povezave CSS imajo `media="not all"` in se vklopijo ob prihodu (`onload`), `style.css` ob prihodu odstrani `ld-css`. Do takrat je viden samo `#loading` (`#app>:not(#loading){visibility:hidden}`), zato se nič ne nariše brez svojega CSS. Vrstica napredka: rdeče-beli rob raste s prenesenimi bajti (`PerformanceObserver` `resource`, `encodedBodySize`) in besedilo »2,1 / 6,0 MB« (pika v angleščini); skupna velikost zadnjega zagona je v `localStorage` (`rra-nalaganje-sw` s service workerjem, `rra-nalaganje-net` brez njega; prvič 6 MB). Ob `window` `load` je vrstica spet trak, kot je bila. `Menu.init` (`menuCss` v `js/menu.js`) poveže isti `href` kot `#menu-css` v senčnem korenu menija: brskalnik list vzame iz pomnilnika, brez drugega prenosa (1–5 ms). Kopija pravil (`cssText`) ne gre, ker izgubi deklaracije `font:` z `var()`, ki jim sledi posamezna lastnost (`.money`, `.info b`). Ker je list zdaj povezava na `css/menu.css`, bi se relativni `url()` v `var(--pic)` bral iz `css/`: slike prog v `--pic` so zato absolutne (`absUrl`). Brez povezave ali ob napaki ostane `fetch` kot prej. Drugi `fetch` menija (»Kje gre čas«, 4) je bil sicer iz predpomnilnika diska (`max-age=600`), ne nov prenos. `js/sence.js` (samo Samsung ali `?sence=1`) prepiše liste strani ob `window` `load`, ko so vsi vklopljeni, lista menija ne.

### Korak 3 · Hiter vstop brez naslovnega sveta (naslovnica ostane)
- Odločitev uporabnika 8. 11. 2026 (`hitro-nalaganje-1`, možnost 3): naslovnica ostane kot zdaj, 3D svet zadnje proge s predstavitveno dirko pred menijem (ne slika proge). Meni prej samo s korakom 2 (CSS menija iz povezave) in korakom 9 (hitrejša gradnja naslovnega sveta).
- Hiter vstop (`?proga=`, povezave in testi): brez naslovnega sveta in predstavitvene dirke, samo ciljna proga; po dirki je naslovni svet proga dirke (že zgrajena). Naslovnica ob navadnem zagonu se ne spremeni.
- Učinek: hiter vstop −2–6 s (CPU 4×).
- Tveganja: testi s hitrim vstopom (`tests/README.md`) in zasloni, ki po zagonu pričakujejo `track` (garaža `garageBack`, izzivi `chalHash`, lestvica `lpHash`), predstavitvena dirka za `MS`/`ZB`.
- **Izvedba** (13. 11. 2026): `quickTrack()` v `js/game.js` vrne progo hitrega vstopa ob istih pogojih kot `quickGo` (veljavna proga, ne izziv `#izziv=` ali duh `#duh=` prijatelja, avto igralca). `boot` takrat zgradi to progo namesto `S.track`, prevede njene senčilnike (`Render.precompile`) in predstavitvene dirke ne naredi; `ensureTrack` v `quickGo` svet vzame, kot je. Po dirki naslovnica naredi predstavitveno dirko na progi dirke (`demoShow` v zanki slik). Navaden zagon in hiter vstop z izzivom, duhom ali avtom, ki ga igralec nima, ostaneta, kot sta bila. Tveganja preverjena: `garageBack` se pri `?proga=` vrne takoj; `chalHash` in `ghHash` gresta po navadni poti; `lpHash`, `MS` in `ZB` ne rabijo naslovnega sveta ne predstavitvene dirke.

### Korak 4 · Glave prog, prave proge šele ob potrebi (glavni korak)
- Orodje (razširitev `tools/menu-lens.js` ali novo `tools/glave-prog.mjs`) zapiše `js/tracks/glave.js`: za vsako pravo progo polja do ~2 kB (id, ime, tema, zastavice, `look`, `rainP`, `say`, `cloudTh`, `roadWear`, `grassNat`, `lawn`, `bbClassic`, `zivali` …) in izračunane podatke (dolžina, število ovinkov, krogi); ~110 kB, ~40 kB gzip. Test preveri, da se glave ujemajo s celimi datotekami (kot golden).
- Cele datoteke pravih prog kot `<link rel="x-lazy-script" data-lazy="proga-<id>" href="js/tracks/<id>.js">` (isti mehanizem kot nova mapa: `load(k, next)` v `js/game.js`; `stamp.js` žiga in spaja `<link>` že zdaj, `sw.js` `linked()` jih shrani).
- `Core.loadTrack(id)` (Promise): naloži datoteko in jo prepiše čez glavo (isti predmet v `Core.TRACKS`; `TRACK_DEFS.push` v datoteki proge ostane, `core.js` združi vnosa z istim `id`, da Node, ki naloži vse, nima proge dvakrat). Vrstni red `Core.TRACKS` ostane kot zdaj (testne in prave proge so v `index.html` prepletene): glave nosijo mesto, `core.js` uredi po njem. `ensureTrack`, šola, `sim`, lestvica (`LPX.bound`), Pikesovi odseki čakajo nanj; seznami, ki rabijo samo dolžino in ovinke (pokali `km`, rekordi, `MENU.lens`, meni `corners`), vzamejo glavo. Bralci `TRACK_DEFS` ob nalaganju (`render.js` THEMES, `game.js` RAIN_P in EN_NAME, `world.js` CLOUD_TH … BB_CLASSIC, `world-zivali.js` ZIV) dobijo polja iz glav.
- Testne proge ostanejo, kot so (zamrznjene, `CLAUDE.md`): njihove vrstice v `index.html` in datoteke se ne spreminjajo.
- Učinek: −1,05 MB gzip (−6 s na počasnem 4G).
- Tveganja: 12 klicev `getTrack` (sinhrono; seznam v `js/game.js`), stari meni (`tdgp-menu=old`, testi) gradi vse proge za kartice → v njem naloži vse; Node nalagalnik (`tests/lib/core.js` `pageScripts` bere samo `<script src>`) mora naložiti tudi lene proge; `tools/nova-proga.mjs` in `tools/razdeli-proge.mjs` pišeta `<script>` za novo progo → zapišeta leno povezavo in glavo; multiplayer: gost naloži progo gostitelja pred dirko; posnetki (`tools/posnetek.mjs`) in poročila o napakah naložijo progo po `id`; brez povezave: proga, ki je service worker še nima, javi napako namesto zamrznitve.

### Korak 5 · Graditelji svetov šele ob potrebi
- Orodje `tools/svet-odvisnosti.mjs` iz kode izpiše, katere datoteke rabi svet vsake prave proge (imena, ki jih vzame iz `World.api` ob nalaganju ali ob gradnji; analiza v meritvah) in jih zapiše v manifest; test zgradi vsako pravo progo v svežem zavihku samo z njenim manifestom.
- Leno: 20 datotek (`nring`, `toronto`, `montreal` s podatki, `harju`, `spa`, `bangsaen`, `suzuka`, `medvode`, `katu`, `chapman`, `sani`, `greatalpine`, `rastro`, `tianmen`, `troisrivieres`, `livorno` s podatki, `gore`, `mountbuller`). Do izbrisa testnih prog ostane ob zagonu 9 pravih graditeljev, ki jih testni rabijo že ob nalaganju (`pikes`, `ouni`, `caracoles`, `bathurst`, `cpalace`, `rbring`, `iroha`, `marrakesh`, `prelaz`; 0,38 MB).
- Učinek: −0,65 MB gzip (−3,6 s).
- `World.build` za pravo progo brez naloženega graditelja (`World.ext[theme]`) javi napako, ne zgradi splošnega sveta (danes bi tiho zgradil napačnega).
- Tveganja: vrstni red nalaganja (odvisnosti pred datoteko; ena datoteka ne postavi imena, ki ga postavi druga: preverjeno, dvojna so samo zastavica `ROCK_SMOOTH`, `VRS` in združeni `rbLook`), golden sveta in obremenitve (`world.test.mjs`, `perf.test.mjs`: isti svet, drugačen vrstni red datotek ne sme spremeniti odtisa), `tests/browser` (`world`, `gfx`, `perf` gradijo svetove neposredno: najprej naložijo).

### Korak 6 · Ostali moduli kasneje
- Misije (`js/missions.js`, `js/missions/`: 35 datotek, 0,19 MB): ob odprtju misij (`MS.init` ob zagonu samo vmesnik). Zabava (8): ob izbiri načina. Splet (`peerjs`, `net.js`): ob odprtju igre s prijatelji. Zemljevid in prelet menija (`routes.js`, `geo.js`, `journey.js`, `intro-data.js`, 0,22 MB): ob prikazu. `js/napake.js` odide s sklopom 8 orodja za napake (pred Google Play) ali leno.
- Učinek: −0,5 MB gzip (−2,8 s).

### Korak 7 · Pomanjšanje ob objavi
- `tools/predogled.mjs` (objava, `.github/workflows/stran.yml`) po žigih pomanjša JS z esbuild (`--minify --keep-names`; imena iz kode rabijo poročila o napakah `v_krogu=[…]`); repozitorij in testi ostanejo nepomanjšani.
- Učinek: −22 % gzip (5,97 → 4,65 MB; po korakih 4–6 in 10: 2,00 → 1,27 MB).
- Tveganja: objavljena igra ni enaka testirani → test `smoke` na pomanjšanem drevesu (`GAME_ROOT`), `stamp.js --check-stamped` ostane; `eval`/`Function` in imena funkcij v kodi (preveri z `--keep-names`).

### Korak 8 · Predpomnjenje (service worker)
- Danes `sw.js` ob namestitvi shrani vse povezano (igra brez povezave). Z lenimi datotekami: ob prvem obisku najprej to, kar rabi prva dirka, ostalo v ozadju po začetku prve dirke (ali samo na Wi-Fi, `navigator.connection`), da ne tekmuje s prvim prenosom; igra brez povezave ostane (`docs/igra.md`).
- Tveganja: posodobitev (žigi) in brisanje starih datotek (`activate`) za lene datoteke; test `sw` (če obstaja) in ročni preizkus brez povezave.

### Korak 9 · Hitrejša gradnja težkih svetov
- Najprej meritev na pravem telefonu (Chrome z oddaljenim razhroščevanjem, plošča Performance): gradnja, senčilniki, prve slike. SwiftShader in upočasnitev CDP tega ne posnemata natančno (platno v procesu GPU 26–41 s, na procesorju 3–24 s).
- Proge nad 15 s (glavna tabela v `docs/hitro-nalaganje-meritve.md`), profil vsake z `--profil <id> --platno-cpu`: `medvode` (polni pregled `Track.nearestIdx` 7,4 s → iskanje od prejšnjega indeksa ali mreža z enakim izidom; šivi makadama 3,8 s; šele po #494, ki prinese novo Medvode), `ouninpohja`, `livorno`, `pikes`, `nring`; `bangsaen` odpade (po #379 testna). Ena seja na progo ali skupino.
- Skupno: teksture, ki jih svet nariše na 2D platno in nato bere (`getImageData`: `vrGritTex`, `gravelTone`), naj nastanejo kot `ImageData` ali na platnu z `willReadFrequently`, enkrat za vse proge; `renderer.debug.checkShaderErrors = false` v objavljeni igri (brez sinhronega branja dnevnikov senčilnikov); `precompile` po `attachRace` (avti, senčni prehod), da prva slika ne prevaja več; vnaprej izračunani podatki (višine, postavitev dreves) v datoteki proge; gradnja v kosih z `await` (zaslon z nalaganjem se premika, gradnja v ozadju za korak 3, možnost 2).
- Merilo: `World.build` ≤ ~5 s s CPU 4× za vsako pravo progo; `perf.test.mjs` brez slabše obremenitve; golden sveta se spremeni samo, če se svet res spremeni.

### Korak 10 · Po izbrisu testnih prog (pred Google Play)
- Pomočnike, ki jih prave proge vzamejo iz graditeljev testnih prog (`rio` → `rbring` in proge z boksi; `riverside` → `marrakesh`; `longford` → `medvode`; `beartooth` → `prelaz`; pomočniki gorskih cest iz `world-vrsic.js`), prestavi v skupne datoteke; privzeta proga igre namesto `jezero` (izbere uporabnik). Nato še 9 graditeljev iz koraka 5 leno.
- Učinek: ob zagonu 2,50 MB gzip (1,68 pomanjšano; s korakom 6 1,27 MB).

## Tveganja (skupna)

- **Žigi** (`tools/stamp.js`): lene datoteke morajo biti `<link href>` v `index.html` (žig, `--merge`, `--check`, `sw.js`), nalagalnik vzame `href` iz povezave, nikoli trde poti.
- **Testi in golden**: Node nalagalnik in brskalniški testi morajo naložiti lene datoteke; golden (`world`, `perf`, `races`) se ne sme spremeniti, ker se proge ne spremenijo; če se, je to napaka nalaganja, ne nova referenca. `trackIds` (`tests/lib/sim.js`, `tests/browser/lib.mjs`) ostanejo.
- **Testne proge** so zamrznjene: koraki 4–6 se jih ne dotaknejo (njihove vrstice v `index.html`, datoteke in graditelji ostanejo); varovalo `tests/testne-proge.test.js` mora ostati zeleno.
- **Seznam avtov** v `index.html` (`tests/fleet.test.js`: vrstni red za progami in pred `core.js`) ostane; avti (0,40 MB z deli) so majhni, leno šele pozneje, če bo treba.
- **Spori med vejami**: koraki 4 in 5 spremenijo veliko vrstic v `index.html`; gredo na `main` sami in po vrsti (`docs/vrsta.md`), nove proge za njimi zapišejo leno povezavo.

## Vrstni red

| korak | seja (model) | odvisen od | učinek |
|---|---|---|---|
| 2 prvi izris | Sonnet ali Opus, kratek | – | prvi izris 16–20 s → ~1–2 s |
| 3 hiter vstop brez naslovnega sveta | Opus ali Sonnet | – | hiter vstop −2–6 s (naslovnica ostane) |
| 4 glave prog | Opus, max (jedro) | – | −1,05 MB gzip |
| 5 leni graditelji | Opus | 4 | −0,65 MB |
| 6 moduli kasneje | Opus ali Sonnet | 4 (nalagalnik) | −0,5 MB |
| 7 pomanjšanje ob objavi | Opus | – | −22 % |
| 8 predpomnjenje | Opus | 4–6 | prvi obisk brez tekmovanja s shranjevanjem |
| 9 hitrejša gradnja | Opus, max (svet) | meritev na telefonu | težke proge ≤ ~5 s |
| 10 po izbrisu testnih prog | Opus | izbris testnih prog | ob zagonu 1,27 MB |

Koraki 2, 3, 7 in 9 so neodvisni od 4–6 in lahko tečejo prej; 4–6 se dotikajo istih mest (`index.html`, `game.js` `ensureTrack`, `tests/lib/core.js`), zato drug za drugim. Koraka 2 in 4 se dotikata menija (`js/menu.js`: `Menu.init`, ovinki na karticah) kot vgradnja nove izbire proge (#516, jure.kopac26, Načrtovano 8. 11.): začneta po njej ali po dogovoru na tabli #382. Vsak korak je svoj pull request in v vrsti ni med progami (`CLAUDE.md`: proge v vrsti zadnje).

## Odločitve uporabnika

- `hitro-nalaganje-1` (8. 11. 2026 ob 21.40, v pogovoru seje): **možnost 3, kot zdaj**: naslovnica ostane 3D svet zadnje proge s predstavitveno dirko pred menijem (ne slika proge, ne 3D v ozadju). Korak 3 je zato samo hiter vstop.
- Pozneje: privzeta proga igre po izbrisu testnih prog (korak 10); shranjevanje igre za brez povezave samo na Wi-Fi (korak 8), če bo prenos v ozadju moteč.

## Učinek po korakih

Vsak korak dopiše vrstico (CPU 4×, `node tools/zagon.mjs --cpu 4 --net slow4g --proga bathurst --warm`).

| po koraku | prvi obisk: prvi izris / meni / vožnja | ponovni obisk: meni / vožnja | ob zagonu (gzip) |
|---|---|---|---|
| 1 (8. 11. 2026, izhodišče) | 16,5–20,5 / 43,2–44,4 / 50,8 s | 6,9–12,2 / 9,2–12,8 s (platno na procesorju 6,7–13,2 / 11,8–14,8 s) | 5,97 MB |
| 2 in 3 (13. 11. 2026) | 1,4–6,8 / 45,1–48,1 / 47,2 s | 7,7–10,4 / 9,3–9,4 s | 6,36 MB (main je od koraka 1 zrasel) |

Koraka 2 in 3: zaslon nalaganja z vrstico napredka je viden takoj (prvi izris ~10 s prej); do menija odloča še prenos skript (zadnja prispe ~37,5 s, koraki 4–6). Hiter vstop gradi samo progo dirke (pri vožnji »svet za naslovnico« je že Bathurst, svet dirke 0,0 s), zato je vožnja ~3,5 s prej; ponovni obisk do vožnje brez nihanja (prej 9,2–12,8 s).

## Ponovitev meritev

- `node tools/zagon.mjs --cpu 4 --net slow4g --proga bathurst --warm --out <datoteka.json>`: prvi in ponovni obisk; `--tracks [--fresh] [--samo a,b]`: gradnja prog iz menija (glavna tabela: `--menu-only --tracks --fresh --platno-cpu`, ~20 min); `--platno-cpu`: 2D platna na procesorju; `--profil <id>`: profil gradnje; `--from <datoteka.json>`: povzetek znova. Opis na vrhu orodja.
- Krog traja ~10 min (s `--tracks` ~25 min). Primerjaj s CPU 4× in istim omrežjem; indeks hitrosti stroja izpiše orodje (niha med krogi, zato isto meritev ponovi in vzemi razpon).
