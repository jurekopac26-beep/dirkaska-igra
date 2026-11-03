# Vrsta za `main` (vsi trije računi)

Skupna vrsta pull requestov za `main` za seje vseh treh računov (pravilo v `CLAUDE.md`, razdelek Postopek). Na `main` gre naenkrat en pull request: vsaka združitev ostalim sproži nov krog testov.

## Pravila
- **Pred združitvijo** seja pogleda to datoteko na svežem `main` (`git fetch origin main && git show origin/main:docs/vrsta.md`). Združi samo, če je njen pull request prvi v vrsti ali ga v vrsti ni in pred njim ni nikogar, ki je pripravljen (zelen na GitHubu).
- **Nov pull request, pripravljen za `main`**, se vpiše na konec vrste (vrstica v tabeli spodaj, s potiskom te datoteke v svoj pull request ali z drobnim pull requestom samo s to datoteko). Hitri popravki rdečega `main` gredo na začetek.
- **Po združitvi** seja svojo vrstico izbriše (v naslednjem potisku na `main` ali to stori koordinacija »VSE SEJE«) in pošlje sporočilo naslednjemu v vrsti, če pozna njegovo sejo.
- Koordinacija vsakega računa (»VSE SEJE«) vrsto sproti ureja; vrstni red med računi se dogovori tu, ne v pogovoru. Pri sporu v tej datoteki obdrži vrstice obeh strani.
- Pull requesti, ki jih ni v vrsti, a so označeni »Ready for review«, počakajo, dokler ne pridejo na vrsto.

## Načrtovano (teme pred začetkom dela)
Preden seja začne novo temo, jo vpiše sem (s potiskom te datoteke na `main` prek drobnega pull requesta ali v svoj prvi potisk) in pogleda, ali je tema že tu ali v odprtih pull requestih kateregakoli računa. Če je, je ne začne. Ko odpre osnutek pull requesta, vrstico prestavi v vrsto zgoraj ali jo izbriše (osnutek je odslej vpis dela).

| Tema | Račun | Kdaj / pogoj |
|---|---|---|
| Deli iz garaže: sklop 4 | 1 | ko se izprazni vrsta; na `main` pred ned. 8. 11. 10:00 |
| Razdelitev skupnih datotek prog po progah | 1 | po sklopu 4 |
| Grafika: 02 zastavice, 03 zaslon ob tribuni, 05 večerne dirke | 1 | po vrsti |
| Gorske proge, skupina A (brez Aulija) | 1 | ko sta sklop 4 in #257 na `main` |
| Zavite proge, korak 1: Ouro Preto (+ gradniki) | 1 | ko je #241 na `main` |
| Furka 2A, Kapelmuur | 1 | po vrsti |

## Vrsta (stanje 3. 11. 2026)

| # | Pull request | Kaj | Račun | Stanje |
|---|---|---|---|---|
| 1 | #241 | Mount Buller | 1 | na vrsti |
| 2 | #248 | kovanci, denarnica, sledi gum | 1 | pripravljen |
| 3 | #250 | 7 novosti | 1 | čaka |
| 4 | #226 | Bâlea | 1 | čaka |
| 5 | #246 | preleti | 1 | čaka |
| 6 | #259 | tribune iz OSM | 1 | čaka |
| 7 | #285 | testne proge zamrznjene | 1 | čaka |
| 8 | #289 | 6 skupin ljudi, 6 prizorov z živalmi | 1 | v delu |

Zadržano: #279 (račun 1; čaka odgovor `zetoni-okolje`, spori z `main` po #277 — ohrani, kar je na `main`).

## Odprti pull requesti drugih računov (še niso v vrsti)
- Račun 2 (stran Odločitve 2): #288 testi zastavic, #287 gume KOLIBRIJA, #284 boksi, #283 Killar, #267 meni sklop 5, #240 trki 100 avtov, #202 fizika.
- Račun 3: #286 `stamp.js --merge`, #261 Hakone.

Ko je kateri od njih pripravljen za `main`, se vpiše v vrsto zgoraj.
