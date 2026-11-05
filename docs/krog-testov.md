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

## Ocena prihranka

- Krog pull requesta ali `main` s spremenjeno kodo: ~110 → ~76 min (najdaljši del ~65–85 min, odvisno od stroja).
- Krog iste kode (dokumenti, `docs/vrsta.md`, združitev brez sprememb kode na `main` vmes): ~2 h → ~5 min, prihranek ~7 h stroja.
- Združen pull request s tekočim krogom: prihranek do ~7 h stroja; manj poslov pred krogom na `main`, zato krajše čakanje v vrsti.

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
  združitev na `main` in ne zgreši kode, ki je prišla iz drugega pull requesta.
