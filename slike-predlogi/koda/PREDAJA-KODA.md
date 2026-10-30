# Nova mapa v kodi – predaja med sejami

Nova mapa je NEW VERSION · TEST 1 (`js/newmap.js`, `js/nv*.js`). Izbire uporabnika so bile narejene v slikah (ta veja, `slike-predlogi/`);
po »začni« jih po sklopih prenašamo v kodo. Vsak sklop je ena seja in en pull request na `main`.

## Kako delamo (uporabnik 30. 10. 2026: »1, 3, 4«)
1. **Vsak sklop v novi seji.** Ko je sklop na `main`, seja zažene novo sejo za naslednji sklop (model `claude-opus-5-5`) z navodilom
   »Naredi sklop N nove mape po slike-predlogi/koda/PREDAJA-KODA.md (veja slike-predlogi)« in prej posodobi tabelo Stanje spodaj.
2. **Manj dolgih testov lokalno.** Spreminjaj samo datoteke nove mape (`js/newmap.js`, `js/nv*.js`). Lokalno potem tečejo samo:
   `node tools/stamp.js`, `npm run test:related`, `node tests/browser/newver.test.mjs` (~15 min) in `PERF_ONLY=newmap node tests/browser/perf.test.mjs`.
   Teste vseh prog naredi GitHub v pull requestu. Če je skupna datoteka (`js/world.js`, `js/render.js`, `js/tex.js`, `js/game.js` …) res nujna,
   lokalno poženi še njene teste; `world` in `gfx` neposredno (`node tests/browser/world.test.mjs`), ker v `tests/run.js` presežeta 15 min.
3. **Sklopa 5 in 6 gresta skupaj** (ena seja, en pull request).
- Možnosti 2 (manj slik) in 5 uporabnik ni izbral: kot v sklopu 2 pošlji liste »prej / zdaj« (običajno 2 na sklop), vprašanja o zasnovi kot slike
  z oštevilčenimi možnostmi.
- Pull request seja odpre sama, ko so lokalni testi zeleni. Na `main` šele, ko so zeleni testi na GitHubu **in** uporabnik napiše »združi«
  (ali vnaprej »ko bo zeleno, združi«).

## Stanje
| Sklop | Vsebina | Stanje |
|---|---|---|
| 0 | Čiščenje veje (slike na to vejo) | na `main` |
| 1 | Mala proga in okolica: lunapark z vulkanom, stekleni most, parkirišče z avtošolo, reševalna baza s helidromom, robovi, podiranje | na `main` ([PR #196](https://github.com/jurekopac26-beep/dirkaska-igra/pull/196)) |
| 2 | Tla ob morju: plaža 4, ena trava, obali JV in SV, dno morja, travnik za robom mape | na `main` ([PR #198](https://github.com/jurekopac26-beep/dirkaska-igra/pull/198)) |
| 3 | Kmetija + nagnjena ovinka po sliki | v delu (nova seja od 30. 10.) |
| 4 | Helikopter, ki leti (meni, vzlet, let, pristanek) | |
| 5+6 | Gradbišče in motokros + začetek igre (en PR) | |
| 7 | Avtošola s 27 nalogami | |
| 8 | Preverjanje celote (15 slik mape proti ciljem, obremenitev, vsi testi) | |
| 9 | Dodatki samo, če jih uporabnik želi: proga za čolne in plaža, gasilski avto, priključek motokrosa pri B | |
| 10 | Za pozneje: ravni za ostale garaže, vožnja z napravami v lunaparku, premikanje na gradbišču, rampa v parku | |

## Odprta vprašanja
Uporabnik je 30. 10. dobil predstavitev z 8 vprašanji (odgovor v obliki »1-2, 2-2, 3-1, …«). Ključ:
1. Kmetija (sklop 3): 1 vse podrobnosti s slike · 2 kar se vidi iz avta, drobno poenostavljeno (priporočeno) · 3 vse, drobno šele od blizu.
2. Helikopter (sklop 4): nalogi WATER RESCUE in FIREFIGHTING · 1 naredi ta veriga · 2 drug račun z misijami, do takrat zaklenjeni (priporočeno).
3. Priključek motokrosa pri B (sklop 5): 1 makadam · 2 asfalt z robniki · 3 široko (slike `sh-mj6-*B*`, list vse15-novo/16).
4. Boks motokrosa ob cesti (sklop 5): 1 prevozni tik ob cesti · 2 trije v vrsti · 3 prevozni južno od starta (`boxopt-page.js`, `__BOXOPT(1..3)`).
5. Proga za čolne, široka s plažami (sklop 9): plaža A–F (`__BEACHV`, listi vse40) · 0 ne zdaj.
6. Gasilski avto (sklop 9): verzija A–F (`blender/gas.py`, listi vse41) · 0 ne zdaj (drug račun).
7. Popravki s 15 slik cele mape (sklop 8): 1 popravi vse sam (priporočeno) · 2 uporabnik najprej označi.
8. Za pozneje (sklop 10: ravni garaž, naprave v lunaparku, premikanje na gradbišču, rampa v parku): 1 vse po sklopu 8 · 2 samo nekatere (črke a–d) · 3 ne zdaj.
Odgovore zapiši tukaj in v `izbire.md`; dokler odgovora ni, te dele pusti za konec sklopa.

## Kje so izbire
- `slike-predlogi/izbire.md`: vse odločitve uporabnika z njegovimi besedami (razdelki po datumih; poišči z `grep`).
- `slike-predlogi/listi/vse38-cela-mapa-15/`: cilj, cela mapa od zgoraj v 15 slikah (T01 … T15 = `koda/ploscice.json`).
- `slike-predlogi/delo/*-page.js`: kako je bila vsaka sprememba narejena v slikah (koda, ki se prenese v `js/newmap.js`, ne kopira dobesedno).
- Bližnji cilji: `bash slike-predlogi/obnovi.sh <scratchpad>` (~30 min) naloži igro z vsemi spremembami iz slik (`slike-predlogi/PREDAJA.md`).

## Sklop 3: kmetija in nagnjena ovinka
**Kmetija na SV ob morju** (izbire.md: »2026-10-15 · kmetija na SV ob morju«, »odgovori«, »Odgovor: njiva 3 (16. 10.)« in oznake slike 7 v »16. 10. popoldne«):
- V slikah: `farmne4-page.js` z `__FNE(2)` (vrsta `q1192`, `q1193`), popravki v `fix16-page.js` (pašnik ob cesti: plaža se ustavi pred ograjo).
- Ena velika njiva (x −88 do 37), njiva 3 · seno: obkrožen zahodni del in južni pas zelena, pokošena, z balami; del ob dvorišču vrste in traktor s prešo.
- Pašnik onkraj makadamske ceste od x −83 (ograja druge kmetije) do 40, ograja 6,4 m od sredine ceste, do z −399,5 (krave + ribnik, konji + hlev,
  ovce + zavetje, 3 drevesa); ograja pašnika podaljšana do roba ceste. Pašnik ob morju od poti do z −290, od x 13 do plaže.
- Makadamska cesta ob severnem robu, hiša in dvorišče s podrobnostmi (izbire.md vrstice o verziji 3), 4 zelena mesta = pesek izletne cone.
- SV obala je v kodi že iz sklopa 2 (`landNE`); `coastne-page.js` se ne prenaša.
- Podrobnosti po CLAUDE.md: kar se s kamere za avtom ne vidi, poenostavi; živali, bale in ograje kot `InstancedMesh` ali združene (`nvbake`).

**Nagnjena ovinka** (izbire.md vrstica 4 in razdelki z »nagnjen«): asfalt v skledi in zaplate mivke (`bank-page.js`), ovinek 1 male proge nagnjen asfalt,
notranji rob rdeče-bel (verzija 6); slika 5: temen trikotnik in temna črta v mivki ob notranjem robniku. Del robov je v kodi iz sklopa 1: najprej primerjaj.

## Orodja (`koda/`)
- `node koda/posnetki.mjs <repo> <seznam.json> <predpona>`: posnetki od zgoraj in za avtom (opis v glavi datoteke). Cela mapa: `koda/ploscice.json`
  (okno 1500 × 900, 152 m na sliko, 5,92 px/m, enako kot cilji vse38).
- PREJ vedno iz čiste kopije `main`: `git worktree add --detach <mapa> origin/main && ln -s <repo>/node_modules <mapa>/node_modules`.
- `python3 -I koda/listi.py <opis.json>`: list »prej / zdaj« za uporabnika (oblika opisa v glavi datoteke).
- `node koda/perfspots.mjs <repo> <izhod.json>`: delo grafike po mestih in mrežah; poženi na `main` in na veji ter primerjaj (nova mapa ne sme
  biti težja brez razloga; referenca `newmap` v `tests/golden/perf.json`).

## Pasti iz sklopov 1 in 2
- Komentar `//` nikoli sredi dolge vrstice: požre preostanek vrstice (trikrat se je zgodilo). Komentar v svojo vrstico.
- `nvbake` združi mreže po materialu in celicah 64 m; material z `onBeforeCompile` preskoči, razen z `userData.bake = true`. Nove ploskve naj se
  združijo, sicer pade preverjanje `kept` v `newver.test.mjs`.
- Združene daljne celice se za meglo skrijejo (`cullFog`); `posnetki.mjs` jih za poglede od zgoraj prižge. Pri preverjanju z žarki ne filtriraj po `visible`.
- `TL.dist(x, z, maxR)` vrne ~31622, če v polmeru ni točke proge; uporabi `TL.near` (`{ d, k }`, `k = −1`) in nadomestek.
- `js/newmap.js` je ~0,76 MB: ne beri ga v celoti; imena poišči v `docs/kazalo.md` (vrstica za `js/newmap.js`) in z `grep`. Kazalo posodobi.
- Po spajanju `main` v vejo znova `node tools/stamp.js` (žigi v `index.html` in `garaza.html`).
- Repozitorij je javen: slike in zapiski uporabnika samo na tej veji, ne v kodi. Brez imen resničnih oseb in znamk.
