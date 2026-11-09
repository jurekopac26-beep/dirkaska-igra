# Trki: bolj realistični trki (načrt teme)

Naloga uporabnika (9. 11. 2026 ob ~21.25): »Ultracode naj analizera fiziko trkov in naj proba ozboljsat da so trki bolj realisticni.« Veja `trki/realizem`, račun jure.kopac26, seja session_01Ck3D3QcbmTexhh4jfgmWRV (posreduje Matej).

## Okvir

- Izboljšave pridejo kot **nova različica** v Nastavitvah »Trki med avti« (delovno ime »Realistična«), da uporabnik v pavzi na istem mestu primerja staro in novo. Privzeta ostane Simulacija, dokler uporabnik ne potrdi.
- Kar ne spada v različico (zidovi, boksi), je preklopljivo z isto izbiro.
- Poškodbe ostanejo privzeto »Samo videz«; vožnja zunaj trkov se ne spremeni; dirka s prijatelji ostane usklajena; obremenitev telefona se ne poveča (`tests/golden/perf.json`).
- Na `main` gre šele po uporabnikovem »ok« (preizkus na predogledu).

## Faze in stanje

| Faza | Kaj | Stanje |
|---|---|---|
| 1. Analiza | popis vseh stikov in meritve v jedru brez brskalnika (`tools/trki/`), primerjava z meritvami videov (`docs/nova-fizika-meritve.md`) in odprtimi viri | v delu (9. 11.) |
| 2. Zasnova | predlog za vsako odstopanje z meritvijo pred/po | čaka |
| 3. Izdelava | nova različica, preklopljivo z isto izbiro | čaka |
| 4. Preverjanje | testi z invarianti, neodvisen pregled `js/core.js`, `npm run test:related` | čaka |

## Odstopanja (izpolni analiza)

Tabela pride po fazi 1: razvrščena po tem, kaj igralec najbolj čuti, s številkami.
