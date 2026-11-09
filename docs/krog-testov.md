# Krog testov na GitHubu

Načrt in odločitve za krajši krog testov (`.github/workflows/tests.yml`, `tests/run.js`). Naročilo koordinacije »VSE SEJE 2« 5. 11. 2026:
krog traja do 3 h, zadnji del brskalniških testov je blizu omejitve 160 min; pospeši ga varno, **brez izklapljanja ali preskakovanja
testov in brez manj preverjanj**. Pull request #321. Opis delovanja za uporabo je v `tests/README.md` (razdelek o GitHubu).

## Kje gre čas (meritve 5. 11. 2026)

Šest uspešnih krogov 1229–1246 (3 na `main`, 3 v pull requestih), časi testov iz povzetkov v dnevnikih poslov:
- **Krog** je trajal 101–189 min. Kritična pot je najdaljši del brskalniških testov: 98–114 min (4 deli, 54–114 min); Fizika, AI in
  dirke 23–43 min, Vozila 21–28 min.
- **Deli niso bili enako dolgi**: `SECS` je bil iz enega teka (4. 11.), čas istega testa pa se med stroji razlikuje do dvakrat (memory
  36–70 min). Hitrost stroja (mediana razmerij čas/mediana čez teste ≥ 20 s v poslu) je bila 0,51–1,34, pri brskalniških poslih 0,65–1,34.
- **Krogi na `main` so čakali** 10–86 min na prejšnjega (`concurrency`, odločitev `ci-main-krog`).
- **Podvojeni krogi**: krog na `main` po združitvi je znova testiral kodo, ki jo je pull request že prestal, krogi po potisku samo
  dokumentov (`docs/vrsta.md`, načrti) pa kodo prejšnjega kroga. Vsak krog je ~7 h stroja (~425 min poslov) in zasede 6 od ~20 poslov,
  ki jih GitHub izvaja hkrati. Krog pull requesta, ki je bil združen med tekom (potisk svežega `main` tik pred združitvijo), je tekel do konca.
- Priprava posla (checkout, Node, `npm ci`, Playwright) traja ~25–30 s, zagon brskalnika in igre malo. Spodnja meja je test memory
  (~61 min na stroju srednje hitrosti): trikrat gre skozi vse proge in primerja 2. krog z zadnjim, zato ga ne delimo.

## Odločitve

1. **Brskalniški testi v 6 delih** (prej 4). `SECS` iz median 6 krogov, vsak čas preračunan na stroj srednje hitrosti; vsak del ~61 min,
   memory sam v svojem delu. Simulacija s hitrostmi strojev iz meritev (20.000 žrebov, +2 min priprave): kritična pot povprečno
   **~76 min (p90 ~83)**, prej ~112 (p90 ~126). Skupni čas strojev ostane enak (+2 dela × ~1 min priprave); 8 težkih poslov namesto 6,
   zato gresta dva cela kroga hkrati še vedno pod ~20 poslov.
2. **Ista koda samo enkrat**: posel Koda izračuna prstni odtis kode (`node tests/run.js --koda`: pot, način in vsebina vsake datoteke
   commita razen `.md`; `KODA_MD` = `.md`, ki ga test bere kot podatke: `docs/gorske-proge.md`). Posel Zapis po krogu, v katerem so uspeli
   vsi težki posli, shrani artefakt `koda-<odtis>` (30 dni). Krog z odtisom, ki ima artefakt iz teka tega repozitorija (ne iz forka), težke
   posle preskoči in požene samo posel Dokumenti (`node tests/run.js --dokumenti`: testi `MD_TESTS`, ki berejo `.md`, ne da bi jih
   imenovali: imena znamk v vseh datotekah, zamrznjene datoteke testnih prog, tudi `docs/proge/<id>.md`). »Igra v brskalniku« je v tem
   primeru zelen (preskočeni posli štejejo kot uspešni).
   - Odpade: krog na `main` po združitvi pull requesta, če se je `main` po njegovem zadnjem krogu spremenil samo v `.md`; krog po potisku
     samo dokumentov (pull request ali `main`); krog drobnega pull requesta samo z `docs/vrsta.md`.
   - Ne odpade: vsaka sprememba kode, testov, slik, podatkov ali `KODA_MD`; koda, katere krog ni uspel; ročni zagon (razen z izbiro
     `preskoci`, za preverjanje preskoka).
   - Varovala (`tests/shards.test.js`): odtis v začasnem repozitoriju (`.md` ne spremeni odtisa; koda, `KODA_MD`, pravice, preimenovanje
     in datoteka `c.md.js` ga); vsak `.md`, ki ga test bere po imenu, je v `KODA_MD`; vsak test, ki našteje datoteke repozitorija, je v `MD_TESTS`,
     ki so tudi v naborih, posel Dokumenti pa jih požene.
3. **Zaprtje ali združitev pull requesta prekine njegov tekoči krog** (`pull_request` tipa `closed` v isti skupini `concurrency`; posel
   Koda ob `closed` ne teče, zato ne teče nič). Tak krog ni več nikomur potreben: kodo po združitvi preveri krog na `main`.
4. **Samo Chromium headless shell** (`playwright install --with-deps --only-shell chromium`): testi tečejo v njem, celoten Chromium je
   odveč prenos.

## Krog po vrsti spremembe (odločitev uporabnika 9. 11. 2026)

Odločitev (tabla #382, komentar 6737933880, točka 3): pull request, ki spreminja samo proge, dobi kratek krog (cilj ~30 min namesto
~1,5 h), samo dokumente samo teste dokumentov, kodo igre celoten nabor; celoten nabor teče enkrat na noč na `main`. Testov, ki padajo,
ne preskakuj in ne izklapljaj: sprememba samo izbere, kateri nabor teče pri kateri vrsti spremembe. Pull request #577.

- **Razvrstitev** (posel Koda; `node tests/run.js --krog [--base <ref>] [--head <ref>]`, `tests/lib/krog.js`), datoteke od osnove do commita:
  - `dokumenti`: samo `.md` in datoteke v `docs/` (razen `KODA_MD`) → posel Dokumenti.
  - `proge`: vsaka datoteka je lastna datoteka prave proge ali skupna datoteka, v kateri so spremenjeni samo vnosi teh prog → kratek krog.
    Lastne: `js/tracks/<id>.js`, `js/data/<id>.js`, `js/world-<tema>.js` (tema samo pravih prog; z njo gredo proge, katerih svet gradi z
    njo, `World.ext.<tema>`), `tests/<id>[-x].test.js`, `tests/browser/<id>[-x].test.mjs`, `tools/<id>/`, slike in posnetki v `assets/` in
    `maketa-menija/` z id-jem v imenu, nova zastava. Skupne (`SKUPNE`): vrstice skript prog v `index.html` in `garaza.html` (nova proga za
    vsemi drugimi: vrstni red `Core.TRACKS`), novi prevodi v `js/lang.js` (vsak z novim ključem), vnosi prog v `js/routes.js`,
    `js/menu-data.js`, `js/menu.js`, `tools/menu-globe.mjs` (tudi nova država ali zastava), v referencah `tests/golden/*.json`,
    `tools/menu-corners.json` in `maketa-menija/orodja/proge_igra.json`, seznami testov in `SECS` v `tests/run.js`, `CRASH_AT` v
    `tests/lib/sim.js`. Različica proge (`variantOf`, npr. `pikesg`) gre s progo.
  - `vse`: vse ostalo → celotni nabori. Koda igre in skupna koda prog (`js/core.js`, `js/render.js`, `js/world.js`, skupni `js/world-*.js`
    npr. `world-prelaz.js`, `tools/proga/`), testi, orodja, delovni tokovi; datoteka testne proge (zamrznjena), izbrisana proga, nova proga
    pred drugimi, drug vnos v skupni datoteki, dodana ali izbrisana skupna datoteka, napaka pri razvrstitvi.
- **Osnova**: pull request se primerja z `main` (prvi starš združitvenega commita), potisk na `main` z zadnjim uspešnim krogom na `main`
  (tudi nočnim): tako ne uide koda, katere krog je odpadel (vmesni krogi na `main`) ali padel. Nočni in ročni zagon: vse.
- **Kratek krog** (posla »Kratek krog (Node)« in »Kratek krog (brskalnik k/3)«; `node tests/run.js --kratek <id,id> --files <datoteke>
  node|browser [--shard k/3]`): povezani testi spremenjenih datotek (kot `--related`), testi čez vse proge (`PO_PROGAH`: golden, races,
  serpentine, lestvica, smoke, world, perf, gfx, memory) samo na teh progah (`PROGE`, `tests/lib/sim.js`: neznana ali testna proga je
  napaka, `--update` s `PROGE` tudi) in varovalo testnih prog. Deli po časih s temi progami (`PROGA_SECS`: stalni del in ena proga v s).
  »Igra v brskalniku« je zelen, ko so zeleni vsi deli kroga, ki je tekel. Uspel kratek krog shrani artefakt `kratek-<odtis>`: krog iste
  kode ga upošteva samo, ko je tudi sam vrste `proge` (krog na `main` po združitvi takega pull requesta odpade); `koda-<odtis>` (celoten
  nabor) velja za vsako vrsto.
- **Čas kratkega kroga** (meritve 9. 11. 2026 z eno progo, Bâlea, preračunano na stroj srednje hitrosti; `PROGA_SECS`, delež na progo
  iz `SECS` s 43 pravimi progami): z eno progo smoke 526 s (z vsemi progami 1684 s), memory 548 s (3661), perf 111 s (2034), gfx 71 s
  (950), world 39 s (970). Brskalniški testi nove proge (datoteka proge, `index.html`, prevodi, reference, poti) so v 3 delih po ~16–17
  min, štirih prog (zbirna veja) po ~20 min, samo datoteke in opisa proge po ~12–13 min; Node teče vzporedno v svojem poslu. S pripravo posla
  (~2 min) kratek krog traja **~20 min** (na počasnem stroju ~25–30 min), prej ~1,5 h; stroji ~1 h namesto ~8 h na krog.
- **Nočni krog** (`schedule` 1.13 UTC: 2.13 pozimi, 3.13 poleti): celoten nabor na `main`; odpade, če je ista koda že prestala celoten nabor
  (`koda-<odtis>`). Svoja skupina `concurrency` (ne čaka na kroge po združitvah). Težki posli zunaj pull requestov ob padcu shranijo imena
  padlih testov (`TEST_PADLI`, artefakti `padli-*`, 7 dni); posel **Vzrok** (nočni ali ročni krog na `main`, ki je padel) v povzetek
  zapiše združitve od zadnjega zelenega nočnega kroga, kaj je spremenila vsaka in katera je spremenila, kar padli testi preverjajo
  (`node tests/run.js --vzrok --od <sha> --padli <datoteka>`, povezava kot pri `--related`).
- **Varovala**: `tests/krog.test.js` (razvrstitev na 17 primerih v začasnem repozitoriju, `PROGE`, `--krog` za delovni tok),
  `tests/shards.test.js` (deli obeh matrik, vsak test s `trackIds` v `PO_PROGAH`, sestava kratkega kroga, njegovi deli do 30 min).
- **Preverjeno na vejah** (9. 11. 2026): `nove-proge/seoul` in `nove-proge/ella` → proge; `nove-proge/llogara` → vse (`js/world-prelaz.js`,
  `tools/proga/`); `nove-proge/tuzla` → vse (`js/core.js`, `js/game.js` …); zadnjih 25 združitev na `main`: vrsta in pravila → dokumenti,
  ostale → vse.

## Ocena prihranka

- Krog pull requesta ali `main` s spremenjeno kodo: ~110 → ~76 min (najdaljši del ~65–85 min, odvisno od stroja).
- Krog iste kode (dokumenti, `docs/vrsta.md`, združitev brez sprememb kode na `main` vmes): ~2 h → ~5 min, prihranek ~7 h stroja.
- Združen pull request s tekočim krogom: prihranek do ~7 h stroja; manj poslov pred krogom na `main`, zato krajše čakanje v vrsti.
- Krog po vrsti spremembe (9. 11. 2026): pull request samo prog ~1,5 h → ~20 min (stroji ~8 h → ~1 h), samo dokumenti ~5 min tudi,
  ko ista koda še ni bila preverjena; celoten nabor še enkrat na noč na `main` (odpade, če se koda od zadnjega celotnega nabora ni spremenila).

## Osvežitev `SECS`

Ko se kak dolg test zelo podaljša (smoke, memory, perf, gfx in world z vsako progo) ali je kritična pot nad ~90 min:
1. Iz zadnjih uspešnih krogov (vsaj 3, mešano `main` in pull requesti) vzemi povzetke posla »Igra v brskalniku (k/6)« (vrstice
   `OK  browser/<test> (<s> s)` za `=== summary`).
2. Za vsak posel izračunaj hitrost: mediana razmerij čas/`SECS` čez teste ≥ 20 s. Čas vsakega testa deli s hitrostjo njegovega posla.
3. V `SECS` vpiši mediano po krogih (zaokroženo na sekundo), padajoče. `node tests/shards.test.js` preveri, da so deli enako dolgi
   (najdaljši največ 15 % nad povprečjem), `node tests/run.js browser --shard 1/6 --list` izpiše dolžine delov.

## Zavrnjeno ali možnost za pozneje

- **7 delov**: ~68 min (p90 ~77), en stroj več na krog; 8 delov ni boljše (memory ~61 min je meja). Odloči koordinacija.
- **Več testov hkrati v enem poslu**: en test porabi ~3,2 od 4 jeder (programski WebGL, SwiftShader); hitreje ne bi bilo, nestabilnost bi rasla.
- **Delitev testa memory**: zmanjšala bi preverjanje (primerja 2. krog z zadnjim čez vse proge).
- **Predpomnilnik Playwrighta**: ~5 s na posel, ne odtehta zapletov.
- **Preskok po imenih spremenjenih datotek** (samo `.md` proti prejšnjemu commitu): odtis primerja vso kodo z že preverjeno, zato zajame tudi
  združitev na `main` in ne zgreši kode, ki je prišla iz drugega pull requesta. Razvrstitev po vrsti spremembe (9. 11. 2026) zato na `main` primerja
  z zadnjim uspešnim krogom, ne s prejšnjim commitom.
