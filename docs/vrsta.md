# Vrsta za `main` (vsi trije računi)

Skupna vrsta pull requestov za `main` za seje vseh treh računov (pravilo v `CLAUDE.md`, razdelek Postopek). Na `main` gre naenkrat en pull request: vsaka združitev ostalim sproži nov krog testov.

## Pravila
- **Pred združitvijo** seja pogleda to datoteko na svežem `main` (`git fetch origin main && git show origin/main:docs/vrsta.md`). Združi samo, če je njen pull request prvi v vrsti ali ga v vrsti ni in pred njim ni nikogar, ki je pripravljen (zelen na GitHubu).
- **Nov pull request, pripravljen za `main`**, se vpiše na konec vrste (vrstica v tabeli spodaj, s potiskom te datoteke v svoj pull request ali z drobnim pull requestom samo s to datoteko) in ostane osnutek (pravilo »Osnutek do vrste« spodaj). Hitri popravki rdečega `main` gredo na začetek.
- **Po združitvi** seja svojo vrstico izbriše (v naslednjem potisku na `main` ali to stori koordinacija »VSE SEJE«) in pošlje sporočilo naslednjemu v vrsti, če pozna njegovo sejo.
- Koordinacija vsakega računa (»VSE SEJE«) vrsto sproti ureja; vrstni red med računi se dogovori tu, ne v pogovoru. Pri sporu v tej datoteki obdrži vrstice obeh strani.
- **Osnutek do vrste** (odločitev uporabnika 4. 11. 2026): »Ready for review« imata samo prva dva v vrsti, vsi drugi pull requesti vseh računov so osnutki, tudi ko je delo končano. Tako testi na GitHubu tečejo samo za ta dva: GitHub zmore hkrati približno dva cela kroga, z več krogi hkrati pa krog traja ~3,5 h namesto ~1,5 h. Ko pull request pride med prva dva, ga njegova seja označi »Ready for review« (znak ji da koordinacija), ko je prvi in zelen, ga po pravilu »Svež main pred združitvijo« (`CLAUDE.md`) združi. Pull request, ki je označen, a ni med prvima dvema, koordinacija kateregakoli računa vrne v osnutek in v komentarju napiše, zakaj.

## Načrtovano (teme pred začetkom dela)
Preden seja začne novo temo, jo vpiše sem (s potiskom te datoteke na `main` prek drobnega pull requesta ali v svoj prvi potisk) in pogleda, ali je tema že tu ali v odprtih pull requestih kateregakoli računa. Če je, je ne začne. Ko odpre osnutek pull requesta, vrstico izbriše; ko je pull request pripravljen, se vpiše v vrsto spodaj (osnutek je odslej vpis dela).

| Tema | Račun | Kdaj / pogoj |
|---|---|---|
| Deli iz garaže: sklop 4 | 3 | ko se izprazni vrsta; na `main` pred ned. 8. 11. 10:00 |
| Razdelitev skupnih datotek prog po progah | 3 | po sklopu 4 |
| Grafika: 02 zastavice, 03 zaslon ob tribuni, 05 večerne dirke | 3 | po vrsti |
| Garaža, sklopi 6–8 (nagrade po vrednosti avta, škoda, gume in deli z rokama) | 1 | ko je #248 na `main`; `js/cars/kolibri.js` in `js/deli/*` pred 8. 11. ne spreminja |
| Redčenje gozda na pravih progah (en pull request na progo) | 1 | po Hakoneju (#261) |
| Nove proge (zadnje, odločitev uporabnika 4. 11.): gorske skupina A (brez Aulija), Zavite proge korak 1 Ouro Preto, Furka 2A, Kapelmuur, Stelvio, Diriyah, Puerto Madero, Hong Kong | 3 | po vsem drugem delu, pred pripravo na Google Play |

## Vrsta (stanje 4. 11. 2026)

| # | Pull request | Kaj | Račun | Stanje |
|---|---|---|---|---|
| 1 | #250 | 7 novosti | 3 | na vrsti (testi na GitHubu tečejo) |
| 2 | #285 | testne proge zamrznjene | 3 | na vrsti (zelen) |
| 3 | #226 | Bâlea | 3 | čaka (rabi svež `main` in nov krog testov) |
| 4 | #259 | tribune iz OSM | 3 | čaka (osnutek) |
| 5 | #289 | 6 skupin ljudi, 6 prizorov z živalmi | 3 | v delu (osnutek) |

Zadržano: #279 (račun 3; `#286 stamp.js --merge` je na `main`, #279 svoje orodje za spajanje prilagodi nanj ali ga odstrani); #246 preleti (račun 3; odločitev uporabnika 4. 11.: počaka, dokler ne bo znano, katere proge gredo v igro; takrat ga nadaljuje nova seja po opisu pull requesta; ostane označen, ker bi dogodek na njem zbudil staro veliko sejo, nanj pa nihče ne potiska).

## Odprti pull requesti drugih računov (še niso v vrsti)
Računi so oštevilčeni po strani Odločitve vsakega računa (račun 1 = stran Odločitve 1 …).
- Račun 1: #298 most na novi mapi, #293 rezultati testiranja, #261 Hakone, #153 Medvode, #297 Garaža, sklopi 6–8. Tema: redčenje gozda na pravih progah (po Hakoneju).
- Račun 2: #295 meni, sklop 6, #292 ostrenje slike, #291 klikljiva vprašanja, #287 gume KOLIBRIJA (od 8. 11. ureja `js/cars/*`), #284 boksi, #283 Killar, #240 trki 100 avtov, #202 fizika, #296 rdeča zastava.

Vsi so osnutki (4. 11. 2026, pravilo »Osnutek do vrste«). Ko je kateri od njih pripravljen za `main`, se vpiše v vrsto zgoraj in ostane osnutek, dokler ne pride med prva dva.
