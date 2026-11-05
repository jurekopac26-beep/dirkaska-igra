# Vrsta za `main` (vsi trije računi)

Skupna vrsta pull requestov za `main` za seje vseh treh računov (pravilo v `CLAUDE.md`, razdelek Postopek). Na `main` gre naenkrat en pull request: vsaka združitev ostalim sproži nov krog testov.

## Pravila
- **Pred združitvijo** seja pogleda to datoteko na svežem `main` (`git fetch origin main && git show origin/main:docs/vrsta.md`). Združi samo, če je njen pull request prvi v vrsti ali ga v vrsti ni in pred njim ni nikogar, ki je pripravljen (zelen na GitHubu).
- **Nov pull request, pripravljen za `main`**, se vpiše na konec vrste (vrstica v tabeli spodaj, s potiskom te datoteke v svoj pull request ali z drobnim pull requestom samo s to datoteko) in ostane osnutek (pravilo »Osnutek do vrste« spodaj). Hitri popravki rdečega `main` gredo na začetek.
- **Po združitvi** seja svojo vrstico izbriše (v naslednjem potisku na `main` ali to stori koordinacija »VSE SEJE«) in pošlje sporočilo naslednjemu v vrsti, če pozna njegovo sejo.
- Koordinacija vsakega računa (»VSE SEJE«) vrsto sproti ureja; vrstni red med računi se dogovori tu, ne v pogovoru. Pri sporu v tej datoteki obdrži vrstice obeh strani.
- **Osnutek do vrste** (odločitev uporabnika 4. 11. 2026): »Ready for review« imata samo prva dva v vrsti, vsi drugi pull requesti vseh računov so osnutki, tudi ko je delo končano. Tako testi na GitHubu tečejo samo za ta dva: GitHub zmore hkrati približno dva cela kroga, z več krogi hkrati pa krog traja ~3,5 h namesto ~1,5 h. Ko pull request pride med prva dva, ga njegova seja označi »Ready for review« (znak ji da koordinacija), ko je prvi in zelen, ga po pravilu »Svež main pred združitvijo« (`CLAUDE.md`) združi. Pull request, ki je označen, a ni med prvima dvema, koordinacija kateregakoli računa vrne v osnutek in v komentarju napiše, zakaj.
- **Prevzem dela, ko računu zmanjka porabe** (odločitev uporabnika 4. 11. 2026): račun, ki mu bo zmanjkalo tedenske porabe, se dogovori, kateri račun ga nadomesti (»prevzame račun N«). Pred ustavitvijo vsaka njegova seja v opis svojega pull requesta zapiše kratko predajo (stanje, kaj manjka, kako testirati), končan pull request vpiše na konec vrste s pripisom »prevzame račun N« (ostane osnutek), se odjavi od dogodkov pull requesta in se ustavi; novih tem ne začenja. Seja za združevanje računa N (Sonnet, `docs/varcevanje.md`) te pull requeste po vrsti pripelje na `main` kot svoje: svež `main`, spori, lokalni povezani testi, »Ready for review«, ko so med prvima dvema, testi na GitHubu, združitev. Na tujo vejo samo potiska (spoj `main`, popravek), zgodovine ne prepisuje. Večje popravke kode dela samo, če ima račun N dovolj porabe, sicer pull request pusti v vrsti z opombo, kaj manjka. Ko se poraba obnovi, nove seje prvega računa nadaljujejo po predajah; kar je medtem prišlo na `main`, je opravljeno.

## Načrtovano (teme pred začetkom dela)
Preden seja začne novo temo, jo vpiše sem (s potiskom te datoteke na `main` prek drobnega pull requesta ali v svoj prvi potisk) in pogleda, ali je tema že tu ali v odprtih pull requestih kateregakoli računa. Če je, je ne začne. Ko odpre osnutek pull requesta, vrstico izbriše; ko je pull request pripravljen, se vpiše v vrsto spodaj (osnutek je odslej vpis dela).

| Tema | Račun | Kdaj / pogoj |
|---|---|---|
| Razdelitev skupnih datotek prog po progah | 3 | po sklopu 4 |
| Grafika: 02 zastavice, 03 zaslon ob tribuni, 05 večerne dirke | 3 | po vrsti |
| Redčenje gozda na pravih progah (en pull request na progo) | 1 | po Hakoneju (#261) |
| Misije, skupina 8 (11, 23, 29, 40, 45; 6 garaž po poklicu, ploščica MISSIONS; `docs/misije.md`) | 2 | ned. 8. 11. po 10.00 (odločitev uporabnika 5. 11.) |
| Nove proge (zadnje, odločitev uporabnika 4. 11.): gorske skupina A (brez Aulija), Zavite proge korak 1 Ouro Preto, Furka 2A, Kapelmuur, Stelvio, Diriyah, Puerto Madero, Hong Kong | 3 | po vsem drugem delu, pred pripravo na Google Play |

## Vrsta (stanje 4. 11. 2026)

Vrstni red 1–10 je določil uporabnik 4. 11. 2026 zvečer (#295, #240, #246, #287, #289, #259, #250, #292, #285, #284 + #296), nato ostali. Isti večer je uporabnik izbral zbirno vejo za #295, #240, #287 in #292 (en krog testov, 1. mesto). Pravilo »osnutek do vrste« ostane: Ready sta samo prva dva.

| # | Pull request | Kaj | Račun | Stanje |
|---|---|---|---|---|
| 1 | #315 | Deli iz garaže, sklop 4 (pregled 608 možnosti KOLIBRIJA, stran za ogled, testi) | 3 | pripravljen (seja session_01WbgGzuLb5rcyQy259XTWg8); povezani testi lokalno zeleni, Ready; rok ned. 8. 11. 10.00 (pred račun 2 ureja `js/cars/*`) |
| 2 | #289 | 6 skupin ljudi, 6 prizorov z živalmi | 3 | v delu |
| 3 | #259 | tribune iz OSM | 3 | čaka |
| 4 | #250 | 7 novosti | 3 | čaka |
| 6 | #284 | boksi (kamera v boksih, postanek po meri, pavza, garaže …) (+#296 rdeča zastava) | 2 | pripravljen (seja session_01Ck3D3U86PNGpBxVfE3GhDs); prevzame biketraveler, dokler račun stoji (osnutek, predaja v opisu PR) |
| 7 | #226 | Bâlea | 3 | čaka |
| 8 | #283 | nova proga Killar, Indija | 2 | pripravljen; ob vrsti nova seja po predaji (koordinacija računa 2); prevzame biketraveler, dokler račun stoji (osnutek, predaja v opisu PR) |
| 9 | #297 | Garaža, sklopi 6–8: nagrade po vrednosti avta, najem, škoda, predali, gume in deli z rokama obroča | 1 | pripravljen (seja session_01UuPU9CyosAkcV4tk8zMLhZ); zelen na GitHubu (glava c41c3b3), osnutek do vrste; predogled: oznaka `predogled`, `beta/297/` |
| 10 | #293 | rezultati testiranja: 5 testnih prog, orodje za napake, posnetek dirke, zavetrje, mostova na novi mapi | 1 | pripravljen (seja session_01UuPU9CJbCFThzptDfhjjXN); glava 1f9c97eb spojena z `main` (ab2f4e9), osnutek do vrste; ob vrsti: spoj `main`, spor v `CLAUDE.md` z #285, `--dovoli` za 5 testnih prog, povezani testi, Ready; mesto čaka na uporabnika (stran Odločitve, vprašanje `vrsta-293`) |
| 11 | #306 | popravek: v serpentinah avto zapelje pod bankino zgornjega kraka (Tianmen 190 m); ograje krakov serpentin v `js/core.js`, test `serpentine.test.js` | 1 | pripravljen (seja session_01UuPU9Ebi98qUtukoDziRsQ); povezani testi lokalno zeleni na 6e7a462, osnutek do vrste |
| 12 | #307 | orodje za napake, sklop 21: Zadnji posnetki in Zgodovina napak z avtom in časom (do cilja zeleno), večja slika, stari zapisi se odprejo (zahteva uporabnika 5. 11.); `js/napake.js`, `css/napake.css`, 2 vrstici v `js/game.js` | 1 | pripravljen (seja session_01UuPU9DMmxrQoyutWZCr6j6); povezani testi lokalno zeleni na 06a0229, osnutek do vrste; predogled: oznaka `predogled`, `beta/307/` |
| 13 | #304 | TITAN s cisterno: prikolica s pravim fizikalnim zgibom (sklopi 1–5: fizika, AI, kamera, posnetek, duh, več telefonov, testi, obremenitev telefona) | 2 | pripravljen (seja session_01Ck3D3TnwDBsrTGSFeJMAva); povezani testi lokalno zeleni na 4a2c7c1 (spojen `main` 8ba8914), osnutek do vrste; ob vrsti nova seja po predaji (koordinacija računa 2, `docs/titan-cisterna.md`, razdelek »Stanje in predaja«); prevzame biketraveler, dokler račun stoji (predaja v opisu PR) |
| 14 | #305 | AI po tvoji liniji, koraka 1 in 2 (vsebuje zaprti #300): orodje za meritev vožnje iz posnetkov (`tools/voznja.mjs`) in tekmeci po igralčevi vožnji (poskus na Tianmnu, vklop `?voznja=1`; `js/core.js`, `js/data/voznja.js`, 1 vrstica v `js/game.js`) | 1 | pripravljen (seja session_01UuPU9AV2hPAkeSiurAK3AA); povezani testi lokalno zeleni na f8593bd, osnutek do vrste; predogled: oznaka `predogled`, `beta/305/?voznja=1`; uporabnik je poskus preizkusil |

Zadržano: #279 (račun 3; `#286 stamp.js --merge` je na `main`, #279 svoje orodje za spajanje prilagodi nanj ali ga odstrani). #246 preleti (račun 3; odločitev uporabnika 5. 11.: počakajo, dokler ne bo izbrana ena proga na državo; predaja v opisu PR).

Prevzem zdaj (4. 11. 2026): račun, ki stoji od čet. 5. 11. ~13:00 do ned. 8. 11. 10:00, svoje končane pull requeste vpiše v vrsto s pripisom »prevzame račun 3«. Račun 3 jih do pet. 6. 11. 03:00 samo pripelje na `main` (lahko delo), potem tudi popravlja.

## Odprti pull requesti drugih računov (še niso v vrsti)
Računi so oštevilčeni po strani Odločitve vsakega računa (račun 1 = stran Odločitve 1 …).
- Račun 1: #261 Hakone, #153 Medvode. Teme: redčenje gozda na pravih progah (po Hakoneju).
- Račun 2: #202 fizika.

Vsi so osnutki (4. 11. 2026, pravilo »Osnutek do vrste«). Ko je kateri od njih pripravljen za `main`, se vpiše v vrsto zgoraj in ostane osnutek, dokler ne pride med prva dva.
