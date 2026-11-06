# Vreme med dirko: dež začne sredi dirke, cesta se zmoči in posuši

Načrt teme (izbira uporabnika 6. 11. 2026: »Vreme se med dirko spremeni. Dež začne padati sredi dirke, cesta se postopoma zmoči in nato suši.«). Seja načrta session_01WbgGzrW5WCDgArWh38Zk3X (partyslo, koordinacija VSE SEJE 2). Ta korak je samo načrt, brez kode v igri. Koda gre na `main` **za** »Dež in sneg« (`docs/dez-sneg.md`, biketraveler) in po odgovorih na tri vprašanja (razdelek Vprašanja).

## Na kratko
- Igra polovico že ima: vreme **Changing** (Menljivo) da en prehod med dirko (suho → dež ali dež → suho). Cesta se zmoči v ~35 s, suši se 4 min, idealna linija 2-krat hitreje (svetel pas suhega asfalta); tekmeci in igralec menjajo gume v boksih, radio in komentator to povesta, po dežju je mavrica. Opis za igralca: `docs/igra.md`, razdelek »Menljivo vreme«.
- Manjka, kar je opisal uporabnik: **cel cikel v eni dirki** (dež začne sredi dirke in tudi poneha, cesta se do cilja posuši), **postopno močenje** (rosenje, dež, naliv; cesta v lisah), **oblaki pred dežjem**, **posnetek dirke z vremenom** (zdaj kaže vreme konca dirke), zvok gum po mokroti ceste, tekmeci na napačnih gumah. Changing je v novem meniju skrit v listu »···«, Random vremena med dirko nikoli ne spremeni.
- Mokrota ceste je že vrednost 0–1 (`Race.wst.water`, na idealni liniji `wst.line`); oprijem iz nje računa `Race._weather` po `TYRE_GRIP` in `WET`, ki ju spremeni »Dež in sneg«. Ta tema oprijema pri dani mokroti ne spreminja, samo kako se mokrota spreminja s časom in kako se vidi in sliši.
- Ocena s priporočenimi izbirami: 17–24 h v dveh pull requestih (jedro s posnetkom, grafika).

## Kaj že obstaja (`main`, 6. 11. 2026)

| Del | Kje | Zdaj |
|---|---|---|
| Nastavitev | `js/game.js` `S.weather`, `weatherOf(d)`; nov meni `js/menu.js` `W_SET`, `optionsRows` | `dry`, `rain`, `random` (dež po `rainP` proge, sicer 0,35), `change`, `storm`; v stolpcu Weather so Dry, Rain, Random, Changing in Storm sta v listu »···« |
| Urnik | `weatherOf`: `opts.weather = { at, dur, to }` → `Race.wst.wx` | en prehod: polovica dirk suho → dež (začne med 1/5 in 1/2 ocenjene dirke, dež pride v 30–60 s, jakost 1), polovica dež → suho (25 s); naključje iz `grand()` (testni način: seme) |
| Kje | `weatherOf`, `isTT`, `opts.remote` | krožne proge in odprte ceste v dirki; kronometer kot Random; kvalifikacije z vremenom štarta; dirka s prijateljem brez spremembe |
| Mokrota | `Race._weather` | cesta gre k jakosti dežja (`dt / 45 · (0,3 + r)`: ~35 s do mokre), suši se 4 min, idealna linija (±2,2 m od `T.rl`) 2 min |
| Oprijem, tekmeci | `_weather`, `_prof` | `c.wet` po gumah in mokroti tam, kjer avto vozi; profil tekmecev po oprijemu na liniji s pravimi gumami, nov izračun pri spremembi nad 0,012 |
| Boksi in gume | `js/core.js` (postanki za gume, `_pitJ`, `_pitRoom`), `tyreFor` (dežne nad 0,3) | tekmeci po prave gume, vsak s svojim pragom, največ trije hkrati; dežne na suhi liniji 2,5-krat hitreje obrabljene; igralcu nasvet in rdeča beseda gum |
| Radio, komentator, napisi | `js/game.js` `wxEvent`, `trd.rain`, `dryHint`; `js/comm.js` | radar minuto prej (`radioRain`, `radioRainStop`), `rainStart`, `rainStop`, `dryLine`; napisa DEŽ in DEŽ JE PONEHAL |
| Videz | `js/render.js` `applyWeather`, `applyRoad`, `dryLine`, `puddles`, `Streaks`, `Splashes`, `rainbow`, `setStorm` | nebo in megla po `race.rain` v korakih 5 %, curki, pljuski, luže (krogi, ne makadam), cesta enakomerno temnejša po `race.water`, odsevi luči, suha sled (krogi), pršec, mokre gume, mavrica; pozimi sneg namesto dežja |
| Zvok | `js/sfx.js` | dež (`rainV`) in gume v vodi (`hiss`) po `race.rain`, ne po mokroti ceste: po dežju gume na mokri cesti ne šumijo |
| Posnetek | `js/game.js` `recStep`, `rrpOf` | samo položaji avtov: posnetek ves čas kaže vreme konca dirke; `.rrp` ima samo `rain` konca |
| Duh, rekordi | `wetRec`, ključ duha | duh so položaji; kronometer v dežju ima svoje rekorde in duha (`-wet`); dirka vremena ne loči |
| Testi | `tests/weather.test.js`, `tests/browser/weather.test.mjs` | dež začne in poneha, suha sled, luže, boksi (Štajerska) |

## Predlog (priporočene izbire)

### 1. Urnik: ploha v eni dirki
- `opts.weather` postane seznam točk `[{ at, dur, to }, …]`: jakost dežja gre od trenutne do `to` v `dur` s, točke po vrsti (`Race.wst.wx` → `wst.plan` in indeks `wst.k`). Stari predmet `{ at, dur, to }` je seznam z eno točko, zato stari klici in testi delajo naprej.
- **Ploha** (Changing): dirka se začne suha; med 30 in 55 % ocenjene dirke začne rositi (0,3 v 40–60 s), v 1–2 min se okrepi do jakosti plohe (0,6 dež ali 1 naliv), ploha traja 15–30 % dirke in poneha v 40–90 s; cesta se do cilja suši. Drugi različici ostaneta kot zdaj: dež do cilja in mokro na štartu, ki poneha. Delež: ploha 60 %, dež do cilja 25 %, mokro → suho 15 %.
- Dolžina: ploha, kadar je ocenjena dirka (`est` v `weatherOf`) vsaj ~8 min, krajša dirka dobi en prehod kot zdaj; dolga dirka do dve plohi, vzdržljivostna do tri (čas dneva se spreminja naprej kot zdaj).
- Vse naključje se izžreba ob začetku dirke iz `grand()` (testni način: isto seme, isti urnik) in ostane zapisano v dirki (`race.wst.plan`) za posnetek, `.rrp` in teste. Med dirko vreme ne žreba ničesar.

### 2. Mokrota ceste
- Ostane ena vrednost za vso cesto (`water`) in ena za idealno linijo (`line`). Fizika lis ne pozna (lise so samo videz), zato ostanejo tekmeci, posnetek in dirka s prijateljem preprosti.
- Postopno: cesta se moči počasneje kot zdaj, ~2 min do jakosti plohe pri dežju 0,6 (zdaj 35 s), v nalivu hitreje; ob rosenju ostane vlažna (0,3, še za slicke: `tyreFor` da dežne nad 0,3). Sušenje ostane (4 min, linija 2 min). Vrednosti se preverijo na Spa (čas kroga z avtopilotom suho in v plohi).
- Oprijem pri dani mokroti je iz »Dež in sneg« (`WET` 0,65, zavore po oprijemu); ta tema ga ne spreminja.

### 3. Videz (kamera za avtom)
- **Oblaki pred dežjem:** oblačnost raste 60–90 s pred dežjem (nebo sivo, sonce šibkejše, sence oblakov izginejo), po dežju se razjasni (mavrica ostane). Isto nebo kot zdaj (`applyTheme` po večjem od dežja in oblačnosti), curki samo po dežju; brez novih klicev risanja.
- **Cesta v lisah** (vprašanje `vreme-videz`): v senčilniku asfalta (`asphaltLook`, ki ima svetovne koordinate `vAsW`) šum iz majhne teksture: mokro je, kjer je šum pod mokroto ceste. Lise se večajo in zlijejo, nato pridejo luže in odsevi kot zdaj; sušenje gre obratno, s suho sledjo kot zdaj. Brez novih klicev risanja; uniform je v senčilniku od gradnje sveta, zato med dirko ni prevajanja. Robniki in tlakovci temnijo enakomerno kot zdaj.
- **Kapljice na zaslonu** (če jih uporabnik izbere): samo pri kakovosti Visoka, v obstoječem post-processingu (kapljica lomi sliko, s hitrostjo odteka navzven), ob nalivu in v pršcu za avtom pred sabo; pri Normalni in Nizki jih ni.
- **Prednalaganje:** dirka z urnikom zgradi suho sled in luže in prevede njune materiale na štartu (`Render.precompile`), da se slika ne zatakne, ko se prvič pokažeta (zdaj se zgradita sredi dirke).
- Slike za vprašanja: Spa 1.100 m, kamera za avtom; lise so prototip v senčilniku asfalta, kapljice dodane na sliko (orodje v scratchpadu seje, ne v repozitoriju).

### 4. Zvok
- Dež (`rainV`) po jakosti dežja; gume v vodi (`hiss`), cviljenje in makadam po mokroti ceste pod avtom (linija ali zunaj nje), da gume šumijo, dokler je cesta mokra. Ob nalivu po želji oddaljeno grmenje (zvok nevihte že obstaja).

### 5. Tekmeci in boksi
- Tekmeci že upočasnijo (profil po oprijemu na liniji). Novo: avto na napačnih gumah (slicki v dežju, dežne na suhem) vozi profil, pomnožen s korenom razmerja svojega oprijema in oprijema profila (`√(c.wet / profW)`), zato tekmec na slickih v dežju zavira prej in ne zleti; brez novega izračuna profila.
- Dva prehoda v dirki: tekmeci gredo po dežne in nazaj po slicke. Preveri, da nihče ne menja več kot enkrat na prehod, nihče ne obtiči in vsi pridejo do cilja (`_pitJ`, `_pitRoom` ostanejo); pri rosenju ostanejo na slickih.
- Postopna mokrota pogosteje sproži nov izračun profila (`_prof`): največ enkrat na 2 s, meritev `jsMs`.
- Boksi #284 + #296 in #390 (biketraveler: radio »tekmec gre v bokse«, hladne gume, drobci in zgumirana linija) bodo takrat na `main`: postanki ob plohi uporabijo njihova sporočila in hladne gume; drobce in zgumirano linijo spere voda na cesti, zato ju postopna mokrota spere počasneje in se po plohi nabirata znova (preveri na Spa).

### 6. Radio, komentator, napisi
- Radar za vsako točko urnika (minuto prej; `trd.rain` po točkah), nova stavka za okrepitev in pojemanje dežja (`rainHeavy`, `rainEase` v `js/comm.js`), napisa DEŽ in DEŽ JE PONEHAL kot zdaj, nasvet za slicke po vsaki plohi. Novi slovenski napisi s prevodi v `js/lang.js`.

### 7. Posnetek dirke, duh, determinističnost
- **Posnetek:** urnik in vsako sekundo vzorec `[čas, dež, mokrota, linija]` (20 min = 1.200 vzorcev, ~14 KB). Med ogledom risanje bere vreme ob času posnetka (dirka ostane nespremenjena); »Posnetek do sem« po ogledu vrne vreme dirke. `.rrp`: glava dobi `wx` (urnik) in `wxs` (vzorci); stare datoteke brez njiju imajo stalno vreme kot zdaj. `tools/posnetek.mjs --t` izpiše vreme ob času.
- **Duh** so položaji in vremena ne nosi. Kronometer: Changing ostane kot Random, zato rekordi in duhovi (`-wet`) ostanejo veljavni; dirka vremena ne loči (kot zdaj).
- **Determinističnost:** urnik se izžreba enkrat ob začetku, med dirko ni naključja; z istim urnikom fizika da isto dirko (test: isto seme dvakrat, isti časi).

### 8. Kje in kako pogosto
- Proge: vse prave krožne proge (z boksi tudi menjava gum, brez boksov samo oprijem) in odprte ceste v dirki; kronometri kot Random. Testnih prog se tema ne dotika (`CLAUDE.md`); preverjanje na Spa, Bathurstu in Los Caracolesu (Vršič gre v test, #394).
- Pogostost (vprašanje `vreme-pogostost`, priporočena 1): Changing postane četrta ikona v stolpcu Weather (na sliki proge se suha in mokra menjata kot pri Random). Random na progi z verjetnostjo dežja `p` da spremembo med dirko z verjetnostjo `p / 2` (Spa ~1 od 4 dirk, običajna proga ~1 od 6, suhe proge redko), sicer suho ali dež kot zdaj.
- Prvenstvo in kariera po nastavitvi kot zdaj. Dirka s prijateljem ostane brez spremembe (kasneje lahko gostitelj pošlje urnik, `s.rain` → `s.wx`). Pozimi namesto dežja sneži kot zdaj, urnik je enak.

### 9. Obremenitev telefona
- Suha dirka: nič novega (brez novih mrež, uniformi na 0). Dirka z urnikom: obstoječe mreže (curki, pljuski, luže, suha sled, odsevi) in največ en klic risanja za kapljice (samo Visoka).
- Meritev: `perf.test.mjs` dobi Spa v nalivu (nova referenca v `tests/golden/perf.json`) pod mejami ~300 klicev risanja in ~900 tisoč oglišč; suhe reference se ne spremenijo. `jsMs` z več izračuni profila.

### 10. Testi
- `tests/weather.test.js` (Node): urnik s tremi točkami (začne, okrepi, poneha), časi močenja in sušenja, linija prva suha, tekmeci po dežne in nazaj po slicke, vsi do cilja; isto seme dvakrat da iste čase; stari `{ at, dur, to }` kot prej; tekmec na slickih v dežju počasnejši, a na cesti.
- `tests/browser/weather.test.mjs`: ploha na Štajerski ali Spa z avtopilotom (napisi, radar dvakrat, nebo temnejše pred prvimi kapljami `Render.look2Info().overcast`, lise, suha sled); `replay.test.mjs`: vreme v posnetku ob času t in `.rrp` z `wxs`; `menu.test.mjs`: četrta ikona pokonci in ležeče.
- Reference: `sim.json` in `races.json` za dirke brez urnika ostanejo; dirke z urnikom dobijo svoje (`npm run golden:update`, po »Dež in sneg«). Testne proge testi preskočijo.

### 11. Koraki in ocena

| Korak | Kaj | Datoteke | Ure |
|---|---|---|---|
| 1 | Urnik s plohami, jakost, postopno močenje, tekmeci na napačnih gumah, zvok po mokroti, radio in komentator za vsako točko, pogostost in ikona v meniju | `js/core.js` (konstruktor `Race`, `_weather`, `_prof`), `js/game.js` (`weatherOf`, radio, `wxEvent`), `js/sfx.js`, `js/comm.js`, `js/menu.js`, `js/lang.js` | 6–8 |
| 2 | Posnetek in `.rrp` z vremenom, posnetek do sem | `js/game.js`, `js/napake.js`, `tools/posnetek.mjs` | 3–4 |
| 3 | Videz: oblaki pred dežjem, lise, kapljice, prednalaganje | `js/render.js` | 5–8 |
| — | Testi, reference, meritve obremenitve, slike pred in po | `tests/` | 3–4 |

Skupaj 17–24 h; dež samo na delu proge (`vreme-obseg` 2) še 8–10 h; samo ena sprememba z boljšim videzom (`vreme-obseg` 3) 11–16 h. Pull requesta: koraka 1 in 2 (jedro), korak 3 (grafika). Model Opus, napor max; za korak 1 pregled kode z več agenti (`js/core.js`, `CLAUDE.md`, »Več agentov samo za težko delo«).

## Odvisnosti in vrstni red
- Za »Dež in sneg« (biketraveler, `docs/dez-sneg.md`), ker spremeni oprijem, zavore in reference vseh prog: vreme gre za njo, da se reference ustvarijo enkrat. Meja: »Dež in sneg« spremeni oprijem pri dani mokroti (`WET`, `TYRE_GRIP`, zavore, profil tekmecev), ta tema urnik in mokroto po času (`_weather`), videz, zvok in posnetek.
- Za #284 + #296 in #390 (boksi, biketraveler), ki spreminjajo postanke, radio, `_weather` (oprijem `c.wet`, drobci, zgumirana linija) in klic risanja v `js/render.js` (`rubberLine` ob `dryLine` in `puddles`).
- #305 (AI po tvoji liniji): profili so izmerjeni na suhem; v dirki z urnikom se na mokri liniji uporabi običajen profil (preveri ob spoju).
- #334 (večerne dirke, `todLights` v `js/render.js`) in #332: majhni spori v `js/render.js`, obdrži oboje.
- Nove proge so vedno zadnje; ta tema gre pred njimi.

## Vprašanja (stran Odločitve 3, https://claude.ai/artifact/1jxNEJ27WiYpCAw3YbRXEV)
Odgovore prebere koordinacija VSE SEJE 2 (`seja_id` vprašanj) in jih zapiše sem; koda se začne po vseh treh.
- `vreme-pogostost`: kdaj se vreme spremeni. 1 · Random včasih in Changing vedno, Changing kot četrta ikona v stolpcu Weather (priporočeno); 2 · samo Changing, kot četrta ikona; 3 · kot zdaj (Changing v listu »···«).
- `vreme-obseg`: kaj prinese tema. 1 · cel cikel (ploha) in jakost dežja, dežuje povsod hkrati (priporočeno); 2 · kot 1 in na dolgih progah dež samo na delu proge; 3 · ena sprememba kot zdaj, boljši videz, zvok in posnetek.
- `vreme-videz` (slike Spa, kamera za avtom): 1 · cesta v lisah in kapljice na zaslonu ob nalivu (priporočeno); 2 · lise brez kapljic; 3 · enakomerno kot zdaj, le počasneje.

## Stanje
- 6. 11. 2026: načrt, tri vprašanja s slikami (`vreme-pogostost`, `vreme-obseg`, `vreme-videz`), osnutek #397 samo z dokumenti; tema v `docs/vrsta.md` (Načrtovano, dogovor v Usklajevanje med računi, točka 6). Koda po »Dež in sneg« in odgovorih.
- 6. 11. 2026, 9.58: odgovora uporabnika: `vreme-obseg` **1** (cel cikel v eni dirki, postopno močenje, dežuje povsod hkrati; 17–24 h), `vreme-videz` **1** (cesta v lisah, ob nalivu kapljice na zaslonu, samo kakovost Visoka). `vreme-pogostost` **1** (10.10: Changing kot četrta ikona v stolpcu Weather, Random včasih). Vsi trije odgovori so tu; koda po »Dež in sneg« (biketraveler) in #284/#296/#390.
