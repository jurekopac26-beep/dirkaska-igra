# Vrsta za `main` (vsi štirje računi)

Skupna vrsta PR za `main` vseh računov (`CLAUDE.md`, Postopek). Naenkrat gre na `main` en PR. Citati, datumi in dolgi opisi: `docs/vrsta-arhiv.md` (12. 11. 2026) in `docs/arhiv/vrsta-zgodovina.md`.

**Prva prednost (O-27-8, 27. 11. 2026): gneča.** Z veliko vozili se avto odziva kot v time trialu; lastnik biketraveler (#1176), po predaji partyslo na Fable; #1069 in #1119 na začetek vrste.

## Različica 1.0 (odločitev uporabnika 7. 11. 2026)
- Nova mapa, misije in vse zraven: **različica 2.0**, pred izidom gumb NEUPORABNO (9. 11.).
- **70 pravih prog** do 23. 12. 2026, **50 avtov**; vsi avti na raven KOLIBRIJA pred Trki; vrstni red: Dež in sneg + garaža → #480 + #626 → 30 avtov → #569 + #494 → Trki + Poškodbe → #246 → grafika → nove proge → 5 tovornjakov (~20. 12.).
- Boljša grafika. **Prednost: fizika (samo trki) in grafika**; nove proge tečejo naprej (partyslo); več agentov samo za trke. Fizika vožnje se ne spreminja.
- **Japonska**: ostane Hakone; Suzuka in Irohazaka gresta med testne (vrstica spodaj).
- **Mejniki**: 23. 12. vseh 70 prog, nato brez novih funkcij; 15. 1. 2027 kandidat; 1. 2. 2027 izid; testne proge se pred izidom izbrišejo.
- **Nove proge ustavljene** (12. 11. ob ~19.00 in 11. 11. ob ~12.35): nobena seja ne začne nove proge brez datoteke, dokler je uporabnik ne potrdi znova (tudi 10 od Hải Vâna do Batangasa); proge z datoteko (#569, #494, osnutki) ostanejo. Opomnik za pregled: 30. 11. ob 10.25. **13. 11. potrjene** (`docs/nove-proge-1-0.md`, »Potrditve 13. 11. 2026«): 9 novih prog, 4 s prepadom, Aguascalientes, Koli, Longyearbyen, Mujib in Irishtown (70 od 70; rezervi Chamarel in El Castaño); Envalira 1. 12.
- **Proge gredo na `main` čim prej** (od 16. 11., odločitev uporabnika ob ~2.52; »Nov vrstni red 16. 11. 2026« spodaj), za njimi nova mapa z misijami (zaustavljene do 2.0). Vrstni red sme premikati tudi Matej (objavi na tabli #382, uporabnik prekliče).

## Pravila
- **Pred združitvijo**: `git fetch origin main && git show origin/main:docs/vrsta.md`; združi samo, če je tvoj PR prvi ali pred njim ni nikogar zelenega.
- **Nov PR** se vpiše na konec vrste in ostane osnutek; hitri popravki rdečega `main` gredo na začetek.
- **Po združitvi** seja svojo vrstico izbriše in obvesti naslednjega.
- Koordinacija računa vrsto ureja; pri sporu obdrži vrstice obeh strani.
- **Pospešitev vrste (Matej 18. 11., komentar 6987073576, točke 1–4):** PR z rdečim krogom ali konfliktom Združevanje **preskoči**, ga da na konec vrste in nadaljuje; popravi ga nova seja s kodo. Najprej majhni PR brez konfliktov, PR s konflikti (npr. #671, #605) pozneje; vrsta teče, medtem ko se konflikti rešujejo. Konflikte rešuje takoj čakajoči PR sam (spoji svež `main`), ne šele v vrsti. Brez ponavljanja krogov: zelen PR ne dobi novega kroga zaradi `main`; konflikti samo v žigih, seznamih testov in kazalu se spojijo brez novega kroga.
- **Zbirne veje** (`zbirna/<ime>`): en PR, en krog; vodja spoji `main` (`node tools/stamp.js --merge`), požene `npm run test:related` in `node tools/stamp.js --check`; člene zapre po združitvi; padel del gre ven. Proge so vedno zadnje.
- **Osnutek do vrste**: »Ready for review« samo prva dva; ostali osnutki; označen PR zunaj prvih dveh vrne v osnutek koordinacija.
- **Prevzem dela ob koncu porabe**: predaja v opisu PR, vpis na konec vrste s pripisom »prevzame račun N«, ustavitev; PR pripelje seja Združevanje računa N; večje kode samo ob dovolj porabe.

## Načrtovano (teme pred začetkom dela)
Pred novo temo jo vpiši sem in preveri, da je ni že tu ali v odprtih PR; ob osnutku PR vrstico izbriši.

| Tema | Račun | Kdaj / pogoj |
|---|---|---|
| Kamera za avtom, tla ob cesti, skupina 52 (drugi prehod): Koli, Pikes Peak (makadam) (`js/world-chase-bt52.js`) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 43 (drugi prehod): Luanda, Portobelo (`js/world-chase-bt43.js`, v #821) | biketraveler | PR #884, vprašanje `chase-skupina-43` 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 49 (drugi prehod): Montréal, Spa (barve tal v `js/world-montreal.js`, `js/world-spa.js`, v #821) | biketraveler | PR #890, vprašanje `chase-skupina-49` 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 50 (drugi prehod): Killar, Ngorongoro (`js/world-chase-bt50.js`, v #821) | biketraveler | PR #892 (na #821), vprašanje `chase-skupina-50` 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 56 (drugi prehod): Kildare, El Jem (`js/world-chase-bt56.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 58 (drugi prehod): Gudauri, Montréal (`js/world-chase-bt58.js`, #902 na zbirno) | biketraveler | pripravljeno 21. 11.; vprašanje `chase-skupina-58` |
| Kamera za avtom, tla ob cesti, skupina 61 (tretji prehod): Harju, Katu-Jaryk (`js/world-chase-bt61.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 73 (drugi prehod): Porto Moniz, Savusavu (`js/world-chase-bt73.js`, na zbirno #821) | biketraveler | pripravljeno 21. 11.; vprašanje `chase-skupina-73` |
| Kamera za avtom, tla ob cesti, skupina 75 (tretji prehod): Ujarrás, Rio do Rastro (`js/world-chase-bt75.js`, na zbirno) | biketraveler | pripravljeno 21. 11.; vprašanje `chase-skupina-75` |
| Kamera za avtom, tla ob cesti, skupina 74: Hiva, Luanda (`js/world-chase-bt74.js`, na zbirno) | biketraveler | pripravljeno 21. 11.; vprašanje `chase-skupina-74` |
| Kamera za avtom, tla ob cesti, skupina 78 (drugi prehod): Pembrey, Kanaba (`js/world-chase-bt78.js`, na zbirno) | biketraveler | pripravljeno 21. 11.; vprašanje `chase-skupina-78` |
| Kamera za avtom, tla ob cesti, skupina 76 (tretji prehod): Isuna, Portobelo (`js/world-chase-bt76.js`, na zbirno) | biketraveler | pripravljeno 21. 11.; vprašanje `chase-skupina-76` |
| Kamera za avtom, tla ob cesti, skupina 79 (tretji prehod): Livorno, Lombok (`js/world-chase-bt79.js`, na zbirno) | biketraveler | pripravljeno 21. 11.; vprašanje `chase-skupina-79` |
| Kamera za avtom, tla ob cesti, skupina 82 (drugi prehod): Seul, Pikes Peak makadam (`js/world-chase-bt82.js`, na zbirno) | biketraveler | pripravljeno 21. 11.; vprašanje `chase-skupina-82` |
| Kamera za avtom, tla ob cesti, skupina 83 (drugi prehod): Montréal, Pikes Peak (makadam) (`js/world-chase-bt83.js`, na zbirno grafika-chase-bt) | biketraveler | pripravljeno 21. 11.; vprašanje `chase-skupina-83` |
| Kamera za avtom, tla ob cesti, skupina 81 (drugi prehod): El Jem, Killar (`js/world-chase-bt81.js`, na zbirno #821) | biketraveler | pripravljeno 21. 11.; vprašanje `chase-skupina-81` |
| Kamera za avtom, tla ob cesti, skupina 37 (drugi prehod): Sakhir, Seul (`js/world-chase-bt37.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 39 (drugi prehod): Pembrey, Pikes Peak (`js/world-chase-bt39.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 33: Aguascalientes, Bathurst (`js/world-chase-bt33.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 36 (drugi prehod): Ghoufi, Harju (`js/world-chase-bt36.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 34: Zandvoort, Ujarrás (`js/world-chase-bt34.js`, drugi prehod, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 41 (drugi prehod): Biķernieki, Buriram (`js/world-chase-bt41.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 38 (drugi prehod): Canaries, El Jem (`js/world-chase-bt38.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 68 (drugi prehod): Quezaltepeque, Kildare (`js/world-chase-bt68.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 71 (drugi prehod): Chapman's Peak, Mombasa (`js/world-chase-bt71.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 35 (drugi prehod): Medeu, Mombasa (`js/world-chase-bt35.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 42 (drugi prehod): Hiva, Isuna (`js/world-chase-bt42.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 26: Bâlea, Furka (`js/world-chase-bt26.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 60 (drugi prehod): Seul, Biķernieki (`js/world-chase-bt60.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 64 (drugi prehod): Cusco, Ghoufi (`js/world-chase-bt64.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 67 (drugi prehod): Koror, Aguascalientes (`js/world-chase-bt67.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 27: Kotor, Koror (`js/world-chase-bt27.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 23: Portobelo, Aguascalientes (`js/world-chase-bt23.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 40 (drugi prehod): Kågeröd, Kanaba (`js/world-chase-bt40.js`, #880, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 65 (tretji prehod): Bathurst, Kågeröd (`js/world-chase-bt65.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 20: Medeu, Ngorongoro (`js/world-chase-bt20.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 19: Harju, Koli (`js/world-chase-bt19.js`, v #821) | biketraveler | v delu 21. 11. |
| Kamera za avtom, tla ob cesti, skupina 18: Livorno, Montréal (`js/world-chase-bt18.js`, v #821) | biketraveler | v delu 21. 11. |
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
| Hitro nalaganje, korak 2 (I17; #758 s #767 in #725; od 17. 11. ob ~2.57 prevzame croatiadata) | croatiadata | po zbirnih A (#583) in B (#579) |
| Garaža z Dež in sneg v eni zbirni veji: animacije (8 plošč, #546) | biketraveler | prednost; pred `main` ok na posnetku |
| **Prevzem dela 17. 11. 2026** (odločitev uporabnika 17. 11. 2026 ob ~2.57, tabla #382): KOLIBRI #480 (s #661 in #662) vodi **partyslo**; Hitro nalaganje #758 (s #767 in #725) vodi **croatiadata**; **biketraveler dela samo Trke #608** | partyslo, croatiadata, biketraveler | takoj; predaja v opisih PR |
| Avti na raven KOLIBRIJA: preostalih 13 v #480 (+ #626; s #661 in #662 od 17. 11. ob ~2.57 prevzame partyslo) | partyslo | pred Trki; na `main` ~17. 11. |
| **30 avtov na raven KOLIBRIJA** (`docs/avti-kolibri.md`, »Prednost: 30 avtov«; od 17. 11. partyslo) | partyslo | po #480, pred Trki; ~47 h, ~25. 11. |
| 4 novi tovornjaki (TITAN PLIN odpade 13. 11.; + 1 posebno vozilo po izbiri seje, najprej slika = 50 avtov) z mesti za dele ob izdelavi | biketraveler | za grafiko; na `main` ~20. 12. |
| Analiza kroga (I12) | biketraveler | v delu od 8. 11.; pred progami |
| Samodejno zaviranje pred ovinki za začetnike (I10) | jure.kopac26 | po tedenskem načrtu |
| Vrstica podatkov na izbiri proge (`docs/meni-izbira-proge.md`) | jure.kopac26 | po tedenskem načrtu |
| Svetovna lestvica (`docs/svetovna-lestvica.md`), seje 1–6 (#672) | jure.kopac26, croatiadata | po tedenskem načrtu; za izid 1. 2. 2027 |
| Zima na severu: Silkeborg, Kågeröd (po N1 #485) | po načrtu 9. 11. | ko je N1 na `main` |
| Prvi zagon z angleškim menijem (I2), samo preizkus (#673) | jure.kopac26, croatiadata | po tedenskem načrtu |
| Najboljše vožnje: 10 najboljših `.rrp` na progo, gumb »Deli 10 najboljših« | jure.kopac26 | po #650; ~14. 11. |
| Napaka posnetka po cilju (za #663): `replayEnd` ne povrne tekmecev | jure.kopac26 | po #663 |
| **Police chase, stran Police** (`docs/meni-izbira-proge.md`) | jure.kopac26 | ~12–16 h, za menijem; ~20. 11. |
| Test s prijatelji: štetje igranja | jure.kopac26 | v delu (12. 11.) |
| 10 novih prog z znamenitostjo ob cesti (model iz Blenderja, skupni nalagalnik `.glb`; odločitev uporabnika 15. 11. 2026 ob ~4.40 prek Mateja: »namesto 5 novih prog naredi 10 novih prog, vse naj imajo uporabo blenderja«): proga 1 Luanda in skupna pot (#711), proge 2–7 jure.kopac26 na veji `proge/luanda`, 8–10 biketraveler | jure.kopac26, biketraveler | v delu (#711) |
| Odprte ceste: predaja na začetku ravnine, tik za tekmecem (popravek uporabnika 14. 11. ob ~16.45; Chapman's Peak, Bâlea, Tianmen in Rio do Rastro dobijo start na začetku ravnine, proge krajše) | jure.kopac26 | v delu (15. 11., `popravki/2026-11-15`) |
| Kariera za 1.0 (odločitev uporabnika 19. 11. 2026 ob 10.35 prek Mateja, tabla #382, komentar 7005268592; načrt `docs/kariera-1-0.md`, zbirna veja `kariera-1-0`, deli A–D) | partyslo | del A (logika, #792) na `main` 23. 11. v zbirki meni #1022. Naslednja sta B in C. |
| **Boksi na vseh krožnih progah** (odločitve uporabnika 13. 11. 2026 ob ~23.40 »vsa dirkališča naj imajo bokse« ter 14. 11. ob ~0.05 »samo dirkališča, ki so v krogu, imajo bokse« in »gorske in odprte ceste: tam jih ne delamo«): bokse (boksarska steza, stavba z boksi, mehaniki) po vzoru Spa (`pit`, `pitRow`) dobijo prave krožne proge brez njih: Livorno, Nürburg (na `main`), Hakone, Kildare, Sosnova (#569); odprte ceste in kronometri ne; start odprtih cest: 3 predlogi v slikah za uporabnika; testne in proge na odločanju ne; obremenitev v mejah; proge, Opus z eno sejo | jure.kopac26 | ko #569 pride na `main` in je prostor za sejo s kodo; pred `main` slike zdaj/potem (kamera za avtom) |
| **Nova proga: Džebel Hafit, Združeni arabski emirati** (odločitev uporabnika 14. 11. 2026 ob ~1.55 »ok začni 1. Džebel Hafit«, po opozorilu o izletni coni, torej izjema): gorska cesta na Džebel Hafit (~12 km, ~60 ovinkov; navzgor 2 pasova, navzdol 1, smeri večinoma ločeni), odsek 1–5 km najbolj ovinkastega dela po OSM (`tools/proga-podatki.py`); ograja prepreči padec; nova država; preveri pasove in ograje v OSM; slike za meni; proge, Opus z eno sejo | jure.kopac26 | ko je prostor za sejo s kodo |
| Nova proga: Poljska (ena proga iz države; 2–3 predlogi ceste na strani Odločitve) | partyslo (rezerva croatiadata) | v delu 25. 11. |
| Nova proga: Chamarel, Mavricij (rezerva uporabnika 13. 11.; veja `proga/chamarel`) | partyslo (rezerva croatiadata) | raziskava 25. 11.; kartica na strani Odločitve |
| Nova proga: Bosna in Hercegovina (ena proga iz države; 2–3 predlogi ceste na strani Odločitve) | partyslo (rezerva croatiadata) | raziskava 25. 11.; kartica na strani Odločitve |
| Nova proga: Ciper (ena proga iz države; 2–3 predlogi ceste na strani Odločitve) | partyslo (rezerva croatiadata) | raziskava 25. 11.; kartica na strani Odločitve |
| Nova proga: Šipka, Bolgarija (A Šipka, B Trigrad, C Melnik na strani Odločitve) | partyslo (rezerva croatiadata) | PR #1095 (osnutek, podatki A); čaka »ok« (kartica proge-bolgarija-pot) |
| Nova proga: Armenija (ena proga iz države; 2–3 predlogi ceste na strani Odločitve) | partyslo (rezerva croatiadata) | raziskava 25. 11. |
| Orodje za prekrivanje `tools/prekrivanje.mjs` (odprti PR z isto progo ali datoteko, račun lastnika; `docs/odlocitve.md`, »Brez dvojnega dela«, točka 3) | croatiadata | #1089 osnutek, test OK 25. 11. |
| Nova proga: El Castaño, Venezuela (rezerva uporabnika 13. 11.; pot in zanimivosti na kartici Odločitve, veja `proga/el-castano`) | partyslo (rezerva croatiadata) | v delu od 25. 11. |

## Vrsta (vrstni red od 7. 11. 2026 ob 17.00)

**Nov vrstni red 16. 11. 2026** (odločitvi uporabnika 16. 11. 2026 ob ~2.47 »uporabi vse 4 predloge« in ob ~2.52 »Sprememba. Proge naj gredo na main cimprej«, prek Mateja; `docs/odlocitve.md`, »Seje«; velja pred načrtom 11. 11. in tabelo spodaj, kjer si nasprotujeta). En PR naenkrat na `main`, »Ready for review« imata samo prva dva v vrsti; vsak račun ima eno sejo Združevanje.
1. Majhni PR, ki zmanjšajo spore (jure.kopac26 po vrsti): #698 Popravki 15. 11. (združen) → zbirni PR pravil 12.–17. 11. (#664 + #674 + #701 v enem, odločitev uporabnika 17. 11. ob ~3.00: pravila enkrat na dan) → #709; majhni PR drugih računov enako, po vrsti na tabli.
   Vrstni red (seja Združevanje, 16. 11.): #698 → #569 → zbirni PR pravil (#664 + #674 + #701) → #709 → #669 → #657/#678 (nikoli hkrati; #669 pred #678) → #663 → #670 → #702; #668 za #657. #671 in #675 gredo skupaj s #569.
2. **Proge: #569 (vse proge, z #494)**, jure.kopac26: ne čaka več na Trke (#608); mesto med prvima dvema dobi takoj, ko je pripravljen (svež `main`, oznake `pending` in `test`, povezani testi), vzporedno z majhnimi PR iz točke 1. Drugi računi svoje pripravljene proge zberejo v en PR na račun in ga vpišejo sem.
3. Zbirne veje, ena na temo (`zbirna/<ime>`, vodi račun teme): Hitro nalaganje (#514 in koraki, biketraveler), Realizem G (#669 in proge), Realizem S (#668 in proge), Realizem E (#657, #678), Svetovna lestvica (#672, #688, #743), Prvi zagon (#673). Pregled z več agenti enkrat na zbirno vejo.
4. Ostale teme po načrtu 11. 11. spodaj; Trki + Poškodbe (#608), ko so pripravljeni; Preleti (#246) ostanejo za Trki, dokler uporabnik ne reče drugače.
5. Nova mapa in misije zadnje.

**Načrt 12. 11. ob ~19.30** (Matej; velja pred 11. 11.): #569 + #494 (29 prog) na `main` ~15.–16. 11. takoj po meniju (pravih 44); 9 dirkališč iz #547, #591, #619 ~25. 11. (53); vse razen novih prog ~16. 12.; do 70 manjka 17; ob potrditvi seznama do ~15. 11. ~18. 12., ob potrditvi 30. 11. 70 do 23. 12. ni verjetnih.

**Načrt 11. 11.** (Matej, komentar 6793233105), vse na `main` ~16. 12.:
1. Dež in sneg (#647), biketraveler, ~12. 11.
2. Samsung temni način (#656) + ikona, jure.kopac26, ~13. 11. po »ok«
3. Kamera in meni (#650), jure.kopac26, ~13. 11. po »ok«
4. (združeno v 2.)
6. Najboljše vožnje, jure.kopac26, ~14. 11.
7. Mesta za dele (#480 + #626) in 30 avtov KOLIBRI, partyslo (od 17. 11.), ~25. 11.
8. (združeno v 7.)
9. Trki + Poškodbe (#608), biketraveler, ~5. 12.
10. Proge v dveh delih: #569 + #494 popravljene ~17.–20. 11.; nove proge potrjene 13. 11. (19 prog do 70), partyslo in croatiadata
11. Preleti (#246 s preleti iz #753), partyslo: **čim prej** (vrstica 10.12; #569 je že na `main`; odločitev uporabnika 16. 11. 2026 ob ~3.45 prek Mateja, tabla #382, komentar 6905955445; en PR: Matej, tabla #382, komentarja 6956629243, točka 1, in 6957630615)
12. Grafika (E, S, G), jure.kopac26 in partyslo, ~8. 12.; 21 PR grafike prog na `main` 23. 11. v zbirki #1021.
13. 5 tovornjakov, biketraveler, ~16. 12.

**Manj sklopov** (11. 11., `docs/varcevanje.md`): #480 in 30 avtov v eni zbirni veji; Chapman, Samsung in ikona v enem PR; osnutki prog se zaprejo, ko so v #569; PR vodi do `main` seja Združevanje.

**Poraba do resetov**: jure.kopac26 95 % do ned 15. 11., nato stoji do 10.00, do 3 seje s kodo; biketraveler do 3 seje (do ned 15. 11. 12.00 do 4), cilj 100 %; partyslo do čet ~15.00 1 seja s kodo, reset pet 03.00.

| # | Pull request | Kaj | Račun | Stanje |
|---|---|---|---|---|
| 10.1 | #1075 | Popravek rdečega `main`: ploščica izbere progo pred izbrano (`pad.test`) | biketraveler | prvi v vrsti; CI zelen, združi seja Združevanje. |
| 10.2 | #1093 | Nova proga Kudowa-Zdrój, Poljska (`proga/kudowa`; odločitev uporabnika 26. 11. ob 11.03: takoj za #1075) | partyslo | osnutek; »Ready for review« ob mestu med prvima dvema; pred združitvijo spoji svež `main`, `test:related`, `stamp --check`. |
| 10.19 | — Grčija, nova proga (rezervacija) | ena nova proga iz Grčije, 2–3 predlogi na strani Odločitve; veja `proga/<id>`; proga, zato zadnje | partyslo (rezerva croatiadata) | raziskava od 25. 11. |
| 10.20 | — Meni: uvod 8 prog (rezervacija) | `window.INTRO` (država, glasba, vrh, oznake) za Kildare, Furka, Tuzla, Mombasa, Sa Calobra, Silkeborg, Aguascalientes, Ngorongoro; veja `nove-proge/meni-uvod` (odločitev uporabnika 26. 11. ob 12.33, #382 7190873788) | partyslo | v delu od 26. 11. |

Zgodovina (vrstni red 4. in 7. 11., premiki 10. 11., stari prevzemi, odprti PR drugih računov): `docs/arhiv/vrsta-zgodovina.md`.
