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
| Gorske proge, skupina A (brez Aulija) | 3 | ko sta sklop 4 in #257 na `main` |
| Zavite proge, korak 1: Ouro Preto (+ gradniki) | 3 | ko je #241 na `main` |
| Furka 2A, Kapelmuur | 3 | po vrsti |
| Garaža, sklopi 6–8 (nagrade po vrednosti avta, škoda, gume in deli z rokama) | 1 | ko je #248 na `main`; `js/cars/kolibri.js` in `js/deli/*` pred 8. 11. ne spreminja |
| Redčenje gozda na pravih progah (en pull request na progo) | 1 | po Hakoneju (#261) |

## Vrsta (stanje 3. 11. 2026)

| # | Pull request | Kaj | Račun | Stanje |
|---|---|---|---|---|
| 1 | #241 | Mount Buller | 3 | na vrsti |
| 2 | #248 | kovanci, denarnica, sledi gum | 3 | pripravljen |
| 3 | #250 | 7 novosti | 3 | čaka |
| 4 | #226 | Bâlea | 3 | čaka |
| 5 | #246 | preleti | 3 | čaka |
| 6 | #259 | tribune iz OSM | 3 | čaka |
| 7 | #285 | testne proge zamrznjene | 3 | čaka |
| 8 | #289 | 6 skupin ljudi, 6 prizorov z živalmi | 3 | v delu |

Zadržano: #279 (račun 3; prekriva se s #286 računa 1, oba samodejno razrešita spor v `index.html`; odloči uporabnik).

## Odprti pull requesti drugih računov (še niso v vrsti)
Računi so oštevilčeni po strani Odločitve vsakega računa (račun 1 = stran Odločitve 1 …).
- Račun 1: #286 `stamp.js --merge` (stoji do odločitve uporabnika), #261 Hakone, #153 Medvode. Teme: Garaža, sklopi 6–8 (po #248), redčenje gozda na pravih progah (po Hakoneju), krog testov na `main` se izteče.
- Račun 2: #288 testi zastavic, #287 gume KOLIBRIJA (od 8. 11. ureja `js/cars/*`), #284 boksi, #283 Killar, #267 meni sklop 5, #240 trki 100 avtov, #202 fizika.

Ko je kateri od njih pripravljen za `main`, se vpiše v vrsto zgoraj.
