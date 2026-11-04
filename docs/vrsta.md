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
| Garaža, sklopi 6–8 (nagrade po vrednosti avta, škoda, gume in deli z rokama) | 1 | ko je #248 na `main`; `js/cars/kolibri.js` in `js/deli/*` pred 8. 11. ne spreminja |
| Redčenje gozda na pravih progah (en pull request na progo) | 1 | po Hakoneju (#261) |
| Nove proge (zadnje, odločitev uporabnika 4. 11.): gorske skupina A (brez Aulija), Zavite proge korak 1 Ouro Preto, Furka 2A, Kapelmuur, Stelvio, Diriyah, Puerto Madero, Hong Kong | 3 | po vsem drugem delu, pred pripravo na Google Play |

## Vrsta (stanje 4. 11. 2026)

| # | Pull request | Kaj | Račun | Stanje |
|---|---|---|---|---|
| 0 | #288 | hitri popravek `main`: nestabilni testi po #262 (flags, napake-zastavice, hlvid, lang, pits) | 2 | na vrsti (zelen 4. 11.) |
| 1 | #241 | Mount Buller | 3 | na vrsti |
| 3 | #250 | 7 novosti | 3 | čaka |
| 4 | #226 | Bâlea | 3 | čaka |
| 5 | #246 | preleti | 3 | čaka |
| 6 | #259 | tribune iz OSM | 3 | čaka |
| 7 | #285 | testne proge zamrznjene | 3 | čaka |
| 8 | #289 | 6 skupin ljudi, 6 prizorov z živalmi | 3 | v delu |
| 9 | #292 | ostrenje slike (CAS) na Visoka pri znižani ločljivosti | 2 | pripravljen |

Zadržano: #279 (račun 3; `#286 stamp.js --merge` je na `main`, #279 svoje orodje za spajanje prilagodi nanj ali ga odstrani).

## Odprti pull requesti drugih računov (še niso v vrsti)
Računi so oštevilčeni po strani Odločitve vsakega računa (račun 1 = stran Odločitve 1 …).
- Račun 1: #261 Hakone, #153 Medvode, #294 krog testov na `main` se izteče. Teme: Garaža, sklopi 6–8 (po #248), redčenje gozda na pravih progah (po Hakoneju).
- Račun 2: #287 gume KOLIBRIJA (od 8. 11. ureja `js/cars/*`), #284 boksi, #283 Killar, #240 trki 100 avtov, #202 fizika.

Ko je kateri od njih pripravljen za `main`, se vpiše v vrsto zgoraj.
