# Vrsta za `main` (vsi štirje računi)

Skupna vrsta PR za `main` vseh računov (`CLAUDE.md`, Postopek). Naenkrat gre na `main` en PR. Citati, datumi in dolgi opisi: `docs/vrsta-arhiv.md` (12. 11. 2026) in `docs/arhiv/vrsta-zgodovina.md`.

## Različica 1.0 (odločitev uporabnika 7. 11. 2026)
- Nova mapa, misije in vse zraven: **različica 2.0**, pred izidom gumb NEUPORABNO (9. 11.).
- **70 pravih prog** do 23. 12. 2026, **50 avtov**; vsi avti na raven KOLIBRIJA pred Trki; vrstni red: Dež in sneg + garaža → #480 + #626 → 30 avtov → #569 + #494 → Trki + Poškodbe → #246 → grafika → nove proge → 5 tovornjakov (~20. 12.).
- Boljša grafika. **Prednost: fizika (samo trki) in grafika**; nove proge tečejo naprej (partyslo); več agentov samo za trke. Fizika vožnje se ne spreminja.
- **Japonska**: ostane Hakone; Suzuka in Irohazaka gresta med testne (vrstica spodaj).
- **Mejniki**: 23. 12. vseh 70 prog, nato brez novih funkcij; 15. 1. 2027 kandidat; 1. 2. 2027 izid; testne proge se pred izidom izbrišejo.
- **Nove proge ustavljene** (12. 11. ob ~19.00 in 11. 11. ob ~12.35): nobena seja ne začne nove proge brez datoteke, dokler je uporabnik ne potrdi znova (tudi 10 od Hải Vâna do Batangasa); proge z datoteko (#569, #494, osnutki) ostanejo. Opomnik za pregled: 30. 11. ob 10.25. **13. 11. potrjene** (`docs/nove-proge-1-0.md`, »Potrditve 13. 11. 2026«): 9 novih prog, 4 s prepadom, Aguascalientes, Koli, Longyearbyen, Mujib in Irishtown (70 od 70; rezervi Chamarel in El Castaño); Envalira 1. 12.
- Proge so v vrsti zadnje, za njimi nova mapa z misijami. Vrstni red sme premikati tudi Matej (objavi na tabli #382, uporabnik prekliče).

## Pravila
- **Pred združitvijo**: `git fetch origin main && git show origin/main:docs/vrsta.md`; združi samo, če je tvoj PR prvi ali pred njim ni nikogar zelenega.
- **Nov PR** se vpiše na konec vrste in ostane osnutek; hitri popravki rdečega `main` gredo na začetek.
- **Po združitvi** seja svojo vrstico izbriše in obvesti naslednjega.
- Koordinacija računa vrsto ureja; pri sporu obdrži vrstice obeh strani.
- **Zbirne veje** (`zbirna/<ime>`): en PR, en krog; vodja spoji `main` (`node tools/stamp.js --merge`), požene `npm run test:related` in `node tools/stamp.js --check`; člene zapre po združitvi; padel del gre ven. Proge so vedno zadnje.
- **Osnutek do vrste**: »Ready for review« samo prva dva; ostali osnutki; označen PR zunaj prvih dveh vrne v osnutek koordinacija.
- **Prevzem dela ob koncu porabe**: predaja v opisu PR, vpis na konec vrste s pripisom »prevzame račun N«, ustavitev; PR pripelje seja Združevanje računa N; večje kode samo ob dovolj porabe.

## Načrtovano (teme pred začetkom dela)
Pred novo temo jo vpiši sem in preveri, da je ni že tu ali v odprtih PR; ob osnutku PR vrstico izbriši.

| Tema | Račun | Kdaj / pogoj |
|---|---|---|
| Več predogledov hkrati (5+), vzame nespremenjene `assets/` iz `main` (`tools/predogled.mjs`; 12. 11. ob ~21.50) | jure.kopac26 | majhna seja Opus, ko je mesto |
| Pregled kode z več agenti za #289 in #319 | 3 | v delu (5. 11.) |
| Redčenje gozda na pravih progah | 1 | prestavljeno; najprej drevesa A (#419) |
| Ljudje ob progi in grafika (`docs/ljudje-predlogi.md`) | partyslo | ko uporabnik reče; po #400; pred novimi progami |
| Realizem E · Cesta in predmeti (`docs/realizem.md`), 15 prog v skupinah, ~23 sej | po tedenskem načrtu | **na `main` prvi** med realizmi, E → S → G (`js/world.js`) |
| Realizem S · Stavbe, ~21 sej | po tedenskem načrtu | za E; Medvode po #494 |
| Realizem G · Rastje in teren, ~16 sej | po tedenskem načrtu | za S |
| Realizem P · Poškodbe skupaj s Trki (#608), ~16 sej | biketraveler | takoj po #480, 30 avtih in #569 + #494; na `main` ~7. 12. |
| Nove proge za 1.0 (`docs/nove-proge-1-0.md`), vse v enem PR | partyslo, croatiadata | potrjene 13. 11. (glej zgoraj); brez izletne cone se ne začnejo, razen 4 prog s prepadom (ograja na strani prepada) |
| Vreme med dirko (`docs/vreme-med-dirko.md`) | partyslo | po kodi za Dež in sneg, #284 + #296, #390 |
| Suzuka in Irohazaka v test (`test: true`, zbirna veja C #611) | partyslo | ko je prostor |
| Zgumirana linija po vožnji (`docs/zgumirana-linija.md`), Fable | partyslo | ko je prostor; slike pred `main` |
| Hitro nalaganje, korak 2 (I17) | biketraveler | po zbirnih A (#583) in B (#579) |
| Videz avta povsod (`docs/novosti-e.md`) | partyslo | po potrditvi načrta in #297; oceno da Matej 16. 11. |
| Garaža z Dež in sneg v eni zbirni veji: animacije (8 plošč, #546) | biketraveler | prednost; pred `main` ok na posnetku |
| Avti na raven KOLIBRIJA: preostalih 13 v #480 (+ #626) | biketraveler | pred Trki; na `main` ~17. 11. |
| **30 avtov na raven KOLIBRIJA** (`docs/avti-kolibri.md`, »Prednost: 30 avtov«) | biketraveler | po #480, pred Trki; ~47 h, ~25. 11. |
| 4 novi tovornjaki (TITAN PLIN odpade 13. 11.; za 50 avtov še eno vozilo) z mesti za dele ob izdelavi | biketraveler | za grafiko; na `main` ~20. 12. |
| Občutek hitrosti pri kameri za avtom (I5) | jure.kopac26 | po tedenskem načrtu; pred `main` preizkus uporabnika |
| Analiza kroga (I12) | biketraveler | v delu od 8. 11.; pred progami |
| Samodejno zaviranje pred ovinki za začetnike (I10) | jure.kopac26 | po tedenskem načrtu |
| Vrstica podatkov na izbiri proge (`docs/meni-izbira-proge.md`) | jure.kopac26 | po tedenskem načrtu |
| Svetovna lestvica (`docs/svetovna-lestvica.md`), seje 1–6 (#672) | jure.kopac26, croatiadata | po tedenskem načrtu; za izid 1. 2. 2027 |
| Zima na severu: Silkeborg, Kågeröd (po N1 #485) | po načrtu 9. 11. | ko je N1 na `main` |
| Prvi zagon z angleškim menijem (I2), samo preizkus (#673) | jure.kopac26, croatiadata | po tedenskem načrtu |
| Samsungov temni način: meni in vmesnik enaka kot brez njega; Fable 5.2 (prej #98, #242) | biketraveler ali jure.kopac26 | biketraveler, če je pred nedeljo >5 točk pod ciljem; sicer jure.kopac26 15. 11. |
| Najboljše vožnje: 10 najboljših `.rrp` na progo, gumb »Deli 10 najboljših« | jure.kopac26 | po #650; ~14. 11. |
| Napaka posnetka po cilju (za #663): `replayEnd` ne povrne tekmecev | jure.kopac26 | po #663 |
| **Police chase, stran Police** (`docs/meni-izbira-proge.md`) | jure.kopac26 | ~12–16 h, za menijem; ~20. 11. |
| Test s prijatelji: štetje igranja | jure.kopac26 | v delu (12. 11.) |

## Vrsta (vrstni red od 7. 11. 2026 ob 17.00)

**Načrt 12. 11. ob ~19.30** (Matej; velja pred 11. 11.): #569 + #494 (29 prog) na `main` ~15.–16. 11. takoj po meniju (pravih 44); 9 dirkališč iz #547, #591, #619 ~25. 11. (53); vse razen novih prog ~16. 12.; do 70 manjka 17; ob potrditvi seznama do ~15. 11. ~18. 12., ob potrditvi 30. 11. 70 do 23. 12. ni verjetnih.

**Načrt 11. 11.** (Matej, komentar 6793233105), vse na `main` ~16. 12.:
1. Dež in sneg (#647), biketraveler, ~12. 11.
2. Samsung temni način (#656) + ikona, jure.kopac26, ~13. 11. po »ok«
3. Kamera in meni (#650), jure.kopac26, ~13. 11. po »ok«
4. (združeno v 2.)
5. Garaža (#653), biketraveler, ~14. 11. po »ok«
6. Najboljše vožnje, jure.kopac26, ~14. 11.
7. Mesta za dele (#480 + #626) in 30 avtov KOLIBRI, biketraveler, ~25. 11.
8. (združeno v 7.)
9. Trki + Poškodbe (#608), biketraveler, ~5. 12.
10. Proge v dveh delih: #569 + #494 popravljene ~17.–20. 11.; nove proge potrjene 13. 11. (19 prog do 70), partyslo in croatiadata
11. Preleti (#246), partyslo, ~7. 12.
12. Grafika (E, S, G), jure.kopac26 in partyslo, ~8. 12.
13. 5 tovornjakov, biketraveler, ~16. 12.

**Manj sklopov** (11. 11., `docs/varcevanje.md`): #480 in 30 avtov v eni zbirni veji; Chapman, Samsung in ikona v enem PR; osnutki prog se zaprejo, ko so v #569; PR vodi do `main` seja Združevanje.

**Poraba do resetov**: jure.kopac26 95 % do ned 15. 11., nato stoji do 10.00, do 3 seje s kodo; biketraveler do 3 seje (do ned 15. 11. 12.00 do 4), cilj 100 %; partyslo do čet ~15.00 1 seja s kodo, reset pet 03.00.

| # | Pull request | Kaj | Račun | Stanje |
|---|---|---|---|---|
| 9.9 | veja `pravila/12-11` (#664) | pravila 12. 11.: ukrepi 1–4, Trki samo Fable 5.2, teme »Načrtovano« | jure.kopac26 | osnutek |
| 10.11 | #569 Zbirna N1–N7 + #494 Proge | 29 pravih prog; popravi se samo, kar ovira `main`; na `main` ~15.–16. 11. po meniju; oznake `test`/`pending` kot na `main` | jure.kopac26 | **pripravljen 13. 11.** (povezani testi lokalno zeleni); predaja v opisu #569; do `main` ga vodi Združevanje (jure.kopac26) |
| 13a–13r | #485, #498, #500, #550, #556, #564, #576, #582, #588, #592, #603, #607 (N1–N8), #283, #261, #153, #465 (#494) | nove proge, vse v #569 oz. #494 | partyslo, jure.kopac26 | osnutki se zaprejo; podrobnosti v arhivu |
| 10.12 | #246 | preleti: na novo samo štirje obstoječi (Nürburg, Pikes Peak, Štajerska, Spa); stalna hitrost brez šiva; ~8. 12. | partyslo | v delu; na `main` po »ok« na Spa (`preleti-ok`) |
| 10.13 | veja `pravila/2026-11-13` (#674) | pravila 13. 11.: croatiadata, 9 prog, Švica, proge s prepadom, Aguascalientes, Koli in Longyearbyen, Mujib in Irishtown, varčevanje 1–4 | jure.kopac26 | pripravljen 13. 11. (povezani testi lokalno zeleni); za #664 |

Zgodovina (vrstni red 4. in 7. 11., premiki 10. 11., stari prevzemi, odprti PR drugih računov): `docs/arhiv/vrsta-zgodovina.md`.
