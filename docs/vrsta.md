# Vrsta za `main` (vsi štirje računi)

Skupna vrsta PR za `main` vseh računov (`CLAUDE.md`, Postopek). Naenkrat gre na `main` en PR. Citati, datumi in dolgi opisi: `docs/vrsta-arhiv.md` (12. 11. 2026) in `docs/arhiv/vrsta-zgodovina.md`.

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
| Kamera za avtom, tla ob cesti: skupine 88–117 (`js/world-chase-bt<N>.js`) | biketraveler | PR #1137–#1171, #1174 (zbirna chase 5); skupine do 87 so na `main`. |
| Redčenje gozda na pravih progah | 1 | prestavljeno; najprej drevesa A (#419) |
| Ljudje ob progi in grafika (`docs/ljudje-predlogi.md`) | partyslo | ko uporabnik reče; po #400; pred novimi progami |
| Realizem E · Cesta in predmeti (`docs/realizem.md`) | partyslo, croatiadata | PR #657, #678, #783; na `main` prvi med realizmi, E → S → G. |
| Realizem S · Stavbe | partyslo | PR #668, #713, #714; za E. |
| Realizem G · Rastje in teren | partyslo | PR #763, #840, #862 (zbirna Realizem 2–15). |
| Realizem P · Poškodbe skupaj s Trki | jure.kopac26 | PR #608 (Trki, zaganja jih opravilo po urniku); na `main` ~7. 12. |
| Nove proge za 1.0 (`docs/nove-proge-1-0.md`), vse v enem PR | partyslo, croatiadata | potrjene 13. 11. (glej zgoraj); brez izletne cone se ne začnejo, razen 4 prog s prepadom (ograja na strani prepada) |
| Vreme med dirko (`docs/vreme-med-dirko.md`) | biketraveler | PR #949 (ploha med dirko). |
| Suzuka in Irohazaka v test (`test: true`, zbirna veja C #611) | partyslo | ko je prostor |
| Hitro nalaganje, korak 2 (I17) | biketraveler | PR #758 (koraki 1–9 v enem PR). |
| Garaža: animacije 2 (8 plošč, #546) in barvanje plošče | partyslo | PR #1084 (animacije), #1181 (barvanje); pred `main` ok na posnetku. |
| Avti na raven KOLIBRIJA (+ #626) | partyslo | PR #480 (zbirna veja); pred Trki. |
| **30 avtov na raven KOLIBRIJA** (`docs/avti-kolibri.md`) | croatiadata | PR #1077; po #480. |
| 4 novi tovornjaki + 1 posebno vozilo (50 avtov), mesta za dele ob izdelavi | biketraveler, partyslo | PR #685, #1173 (osnutki, najprej slike); na `main` ~20. 12. |
| Analiza kroga (I12) | biketraveler | PR #1175 (možnost A). |
| Samodejno zaviranje pred ovinki za začetnike (I10) | partyslo | PR #679. |
| Vrstica podatkov na izbiri proge (`docs/meni-izbira-proge.md`) | jure.kopac26 | ni odprtega PR; po tedenskem načrtu. |
| Svetovna lestvica (`docs/svetovna-lestvica.md`), seje 1–6 | partyslo, croatiadata | PR #672, #688, #743; za izid 1. 2. 2027. |
| Zima na severu: Silkeborg, Kågeröd | biketraveler | PR #1087. |
| Prvi zagon z angleškim menijem (I2), samo preizkus | croatiadata | PR #673. |
| Najboljše vožnje: 10 najboljših `.rrp` na progo, gumb »Deli 10 najboljših« | partyslo | PR #663; za njim #1184 (`replayEnd` povrne tekmece). |
| Napaka posnetka po cilju: `replayEnd` ne povrne tekmecev | ni zapisan | PR #1184 (osnutek); po #663. |
| **Police chase, stran Police** (`docs/meni-izbira-proge.md`) | ni zapisan | PR #1082 (osnutek); za menijem. |
| Test s prijatelji: štetje igranja | jure.kopac26 | ni odprtega PR (od 12. 11.); v dvomu zapri. |
| 10 novih prog z znamenitostjo ob cesti (Blender, skupni nalagalnik `.glb`; odločitev uporabnika 15. 11.) | jure.kopac26, biketraveler | Luanda je na `main`; PR #711 ni več odprt, preostalih 9 prog ni odprtih PR. |
| Kariera za 1.0 (`docs/kariera-1-0.md`, deli A–D; odločitev uporabnika 19. 11.) | partyslo | del A je na `main` (#1022); B in C še nimata odprtega PR. |
| **Boksi na krožnih progah** (odločitev uporabnika 13.–14. 11.: samo prave krožne proge, ne gorske ceste in kronometri) | jure.kopac26 | PR #1081 (Kildare, Sosnová, Nürburg). |
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

**Vrstni red zdaj** je tabela spodaj; prejšnji načrti (16. 11., 12. 11., 11. 11., poraba do resetov) so v `docs/vrsta-arhiv.md`, »27. 11. 2026«.

| # | Pull request | Kaj | Račun | Stanje |
|---|---|---|---|---|
| 10.1 | #1069 | Grafika: zmogljivost v gneči 100 avtov (dim 15 m, test gneče) | jure.kopac26 | **prva prednost (Matej 27. 11., #1161)**: gneča; osnutek, »Ready for review« ob mestu med prvima dvema; pred združitvijo svež `main`, `test:related`. |
| 10.2 | #1119 | Zatikanje na startu: testi in meritve | partyslo | **druga prednost (Matej 27. 11., #1161)**; osnutek, »Ready for review« ob mestu med prvima dvema; pred združitvijo svež `main`, `test:related`. |
| 10.3 | #1093 | Nova proga Kudowa-Zdrój, Poljska (`proga/kudowa`; odločitev uporabnika 26. 11. ob 11.03: po #1069 in #1119) | partyslo | osnutek; »Ready for review« ob mestu med prvima dvema; pred združitvijo spoji svež `main`, `test:related`, `stamp --check`. |
| 10.19 | — Grčija, nova proga (rezervacija) | ena nova proga iz Grčije, 2–3 predlogi na strani Odločitve; veja `proga/<id>`; proga, zato zadnje | partyslo (rezerva croatiadata) | raziskava od 25. 11. |
| 10.20 | — Meni: uvod 8 prog (rezervacija) | `window.INTRO` (država, glasba, vrh, oznake) za Kildare, Furka, Tuzla, Mombasa, Sa Calobra, Silkeborg, Aguascalientes, Ngorongoro; veja `nove-proge/meni-uvod` (odločitev uporabnika 26. 11. ob 12.33, #382 7190873788) | partyslo | v delu od 26. 11. |

Zgodovina (vrstni red 4. in 7. 11., premiki 10. 11., stari prevzemi, odprti PR drugih računov): `docs/arhiv/vrsta-zgodovina.md`.
