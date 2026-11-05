# Vrsta za `main` (vsi trije računi)

Skupna vrsta pull requestov za `main` za seje vseh treh računov (pravilo v `CLAUDE.md`, razdelek Postopek). Na `main` gre naenkrat en pull request: vsaka združitev ostalim sproži nov krog testov.

## Pravila
- **Pred združitvijo** seja pogleda to datoteko na svežem `main` (`git fetch origin main && git show origin/main:docs/vrsta.md`). Združi samo, če je njen pull request prvi v vrsti ali ga v vrsti ni in pred njim ni nikogar, ki je pripravljen (zelen na GitHubu).
- **Nov pull request, pripravljen za `main`**, se vpiše na konec vrste (vrstica v tabeli spodaj, s potiskom te datoteke v svoj pull request ali z drobnim pull requestom samo s to datoteko). Hitri popravki rdečega `main` gredo na začetek.
- **Po združitvi** seja svojo vrstico izbriše (v naslednjem potisku na `main` ali to stori koordinacija »VSE SEJE«) in pošlje sporočilo naslednjemu v vrsti, če pozna njegovo sejo.
- Koordinacija vsakega računa (»VSE SEJE«) vrsto sproti ureja; vrstni red med računi se dogovori tu, ne v pogovoru. Pri sporu v tej datoteki obdrži vrstice obeh strani.
- Pull requesti, ki jih ni v vrsti, a so označeni »Ready for review«, počakajo, dokler ne pridejo na vrsto.

## Načrtovano (teme pred začetkom dela)
Preden seja začne novo temo, jo vpiše sem (s potiskom te datoteke na `main` prek drobnega pull requesta ali v svoj prvi potisk) in pogleda, ali je tema že tu ali v odprtih pull requestih kateregakoli računa. Če je, je ne začne. Ko odpre osnutek pull requesta, vrstico izbriše; ko je pull request pripravljen, se vpiše v vrsto spodaj (osnutek je odslej vpis dela).

| Tema | Račun | Kdaj / pogoj |
|---|---|---|
| Deli iz garaže: sklop 4 | 3 | ko se izprazni vrsta; na `main` pred ned. 8. 11. 10:00 |
| Razdelitev skupnih datotek prog po progah | 3 | po sklopu 4 |
| Grafika: 02 zastavice, 03 zaslon ob tribuni, 05 večerne dirke | 3 | po vrsti |
| Redčenje gozda na pravih progah (en pull request na progo) | 1 | po Hakoneju (#261) |
| Nove proge (zadnje, odločitev uporabnika 4. 11.): gorske skupina A (brez Aulija), Zavite proge korak 1 Ouro Preto, Furka 2A, Kapelmuur, Stelvio, Diriyah, Puerto Madero, Hong Kong | 3 | po vsem drugem delu, pred pripravo na Google Play |

## Vrsta (stanje 4. 11. 2026)

Vrstni red 1–10 je določil uporabnik 4. 11. 2026 zvečer (#295, #240, #246, #287, #289, #259, #250, #292, #285, #284 + #296), nato ostali. Isti večer je uporabnik izbral zbirno vejo za #295, #240, #287 in #292 (en krog testov, 1. mesto). Pravilo »osnutek do vrste« ostane: Ready sta samo prva dva.

| # | Pull request | Kaj | Račun | Stanje |
|---|---|---|---|---|
| 2 | #289 | 6 skupin ljudi, 6 prizorov z živalmi | 3 | v delu |
| 3 | #259 | tribune iz OSM | 3 | čaka |
| 4 | #250 | 7 novosti | 3 | čaka |
| 5 | #285 | testne proge zamrznjene | 3 | čaka |
| 6 | #284 | boksi (kamera v boksih, postanek po meri, pavza, garaže …) (+#296 rdeča zastava) | 2 | pripravljen (seja session_01Ck3D3U86PNGpBxVfE3GhDs); prevzame biketraveler, dokler račun stoji (osnutek, predaja v opisu PR) |
| 7 | #226 | Bâlea | 3 | čaka |
| 8 | #283 | nova proga Killar, Indija | 2 | pripravljen; ob vrsti nova seja po predaji (koordinacija računa 2); prevzame biketraveler, dokler račun stoji (osnutek, predaja v opisu PR) |
| 9 | #297 | Garaža, sklopi 6–8: nagrade po vrednosti avta, najem, škoda, predali, gume in deli z rokama obroča | 1 | pripravljen (seja session_01UuPU9CyosAkcV4tk8zMLhZ); zelen na GitHubu (glava c41c3b3), osnutek do vrste; predogled: oznaka `predogled`, `beta/297/` |
| 10 | #293 | rezultati testiranja: 5 testnih prog, orodje za napake, posnetek dirke, zavetrje, mostova na novi mapi | 1 | pripravljen (seja session_01UuPU9CJbCFThzptDfhjjXN); glava 1f9c97eb spojena z `main` (ab2f4e9), osnutek do vrste; ob vrsti: spoj `main`, spor v `CLAUDE.md` z #285, `--dovoli` za 5 testnih prog, povezani testi, Ready; mesto čaka na uporabnika (stran Odločitve, vprašanje `vrsta-293`) |
| 11 | #306 | popravek: v serpentinah avto zapelje pod bankino zgornjega kraka (Tianmen 190 m); ograje krakov serpentin v `js/core.js`, test `serpentine.test.js` | 1 | pripravljen (seja session_01UuPU9Ebi98qUtukoDziRsQ); povezani testi lokalno zeleni na 6e7a462, osnutek do vrste |
| 12 | #307 | orodje za napake, sklop 21: Zadnji posnetki in Zgodovina napak z avtom in časom (do cilja zeleno), večja slika, stari zapisi se odprejo (zahteva uporabnika 5. 11.); `js/napake.js`, `css/napake.css`, 2 vrstici v `js/game.js` | 1 | pripravljen (seja session_01UuPU9DMmxrQoyutWZCr6j6); povezani testi lokalno zeleni na 06a0229, osnutek do vrste; predogled: oznaka `predogled`, `beta/307/` |
| 13 | #304 | TITAN s cisterno: prikolica s pravim fizikalnim zgibom (sklopi 1–5: fizika, AI, kamera, posnetek, duh, več telefonov, testi, obremenitev telefona) | 2 | pripravljen (seja session_01Ck3D3TnwDBsrTGSFeJMAva); povezani testi lokalno zeleni na 4a2c7c1 (spojen `main` 8ba8914), osnutek do vrste; ob vrsti nova seja po predaji (koordinacija računa 2, `docs/titan-cisterna.md`, razdelek »Stanje in predaja«); prevzame biketraveler, dokler račun stoji (predaja v opisu PR) |

Zadržano: #279 (račun 3; `#286 stamp.js --merge` je na `main`, #279 svoje orodje za spajanje prilagodi nanj ali ga odstrani). #246 preleti (račun 3; odločitev uporabnika 5. 11.: počakajo, dokler ne bo izbrana ena proga na državo; predaja v opisu PR).

## Odprti pull requesti drugih računov (še niso v vrsti)
Računi so oštevilčeni po strani Odločitve vsakega računa (račun 1 = stran Odločitve 1 …).
- Račun 1: #261 Hakone, #153 Medvode. Teme: redčenje gozda na pravih progah (po Hakoneju).
- Račun 2: #202 fizika.

Ko je kateri od njih pripravljen za `main`, se vpiše v vrsto zgoraj.
