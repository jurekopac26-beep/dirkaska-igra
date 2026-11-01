# Ljudje ob progi: 12 predlogov

Uporabnik (1. 11. 2026): ljudje v igri porabijo veliko grafike in niso dobri. Naj jih bo veliko manj, večinoma na dirkališčih (na tribunah ter kot mehaniki, sodniki, gasilci, varnostniki, policija …); ob dolgih progah (npr. Nürburg) skoraj brez gledalcev, občasno pa skupina, ki pred tvojim prihodom dela kaj svojega (hiška, avtodom, prikolica, ogenj na travi s peko hrane, telovadba, televizija …), ko te zasliši, pusti delo in steče k ograji gledat, kako pelješ mimo. Med izdelavo je dodal: **ljudje se družijo v skupinah po 2–10**, elementov naj bo čim več, za ljudi si je treba vzeti čas in na različna mesta postaviti različne elemente.

Seja je naredila 12 predlogov, vsak v eni sliki (pokončna slika za telefon, izrisana v pravi igri s kamero za avtom: od blizu; ko te zaslišijo; ko tečejo k ograji; ko pelješ mimo; rumena lupa je povečava skupine iz iste kamere). Slike so bile poslane uporabniku v pogovoru, v repozitoriju jih ni (velike). **Uporabnik izbere predloge; šele potem se ljudje naredijo v igri.**

## Orodje (`tools/ljudje/`)

- `ljudje3d.js`: nov model človeka (`person`, poze `pose`, predmeti v roki `hold`, oblačila po vlogah) in vsi elementi s slik (avtodom, prikolica, šotori, ogenj, žar, TV, hiša, oder, tribuna, maršalska postaja, gasilsko vozilo, vhod, boksi …), živali in gozdni elementi; THREE r128, samo za slike (živali in gozdni elementi so v igri v `js/world-zivali.js`).
- `prizori.js`: 12 prizorov (mesto na progi, ljudje s stanji `act`, `run`, `fence`, kamera od blizu), `prizori-proge.json`: proga vsakega prizora.
- `predlogi.mjs scene zar,ogenj,…`: izris v igri (`explore <proga> <m,…>` posnetki mest, `probe <proga> <od> <do> <korak>` ravnine z ograjo blizu); `sestavi.mjs`: sestavi slike z besedili iz `besedila.json`; `studio.mjs people|roles|props|props2|zoo|forest`: predogled brez igre. Vse v `test-results/ljudje/`.

## Zdaj (meritev, 1. 11. 2026)

Gledalci ob progi so instancirani kockasti ljudje (`crowdGeo` v `js/world.js`, 112 oglišč na osebo). Kamera za avtom, telefon ležeče, 12 mest na krogu:

| Proga | Ljudi ob progi | Njihova oglišča na sličico (Nizka: povprečje / največ) | Visoka |
|---|---|---|---|
| Nürburg | 11.706 | 23k / 42k (7 %) | 41k / 75k |
| Spa | 5.617 | 48k / 129k (11 %) | 77k / 171k |
| Bathurst | 4.198 | 33k / 138k (9 %) | 60k / 150k |
| Ouninpohja | 6.902 | 31k / 67k (6 %) | |
| Harju | 5.931 | 107k / 164k (16 %) | |
| Longford | 5.309 | 34k / 91k (8 %) | |
| Štajerska | 2.968 | 23k / 103k (6 %) | |

Tribune (ljudje na sliki tribune, `crowdStands`) so poceni in niso v tej tabeli.

## Skupno vsem predlogom

- Ob progi ni več dolgih vrst posameznih gledalcev. Ljudje so samo v **prizorih po 2–10** (na Nürburgu npr. 10–15 prizorov namesto 11.706 gledalcev), na dirkališčih pa še na tribunah in kot osebje.
- **Nov model človeka**: ločene noge (tek), roke s komolci (držijo stvari), ramena, vrat, lasje ali pokrivalo (kapa, čelada, policijska kapa, gasilska čelada), odsevni jopiči; ~300 oglišč od blizu, od daleč poenostavljen. Uporabniku je všeč (»super novi ljudje so mi všeč«).
- Obnašanje v štirih korakih: delo (zanka gibov) → ko si ~4 s pred njimi, vstanejo in stečejo k ograji → ko pelješ mimo, navijajo, mahajo, snemajo, z glavo ti sledijo → počasi se vrnejo. Osebje (maršali, gasilci, policija, mehaniki) ne teče navijat, ampak dela.
- Cena prizora: rekviziti zliti v en model, ljudje instancirani, dim en delec: ~3–5 klicev risanja in ~10–25 tisoč oglišč, ko je prizor v sliki.
- Vse brez imen in znamk (na zaslonih le izmišljene številke avtov).

## Predlogi

| Št. | Ime | Kje na sliki | Skupina | Elementi | Obnašanje |
|---|---|---|---|---|---|
| 1 | Žar pred avtodomom | Nürburg (ravnina pred Schwedenkreuzom) | 5 | avtodom z markizo in lučkami, žar z dimom, miza, stoli, hladilna torba, zaboji, plinska jeklenka, zastava, kolo, bazenček | pečejo in jedo, otrok v bazenčku; stečejo k ograji (otrok prvi); oče maha s prijemalko, drugi snemajo |
| 2 | Ogenj na travi | Nürburg (pred Adenauer Forstom) | 6 | taborni ogenj z dimom, hlodi za sedenje, šotori, viseča mreža, drva, tnalo | pečejo hrenovke na palicah; stečejo s palicami; eden spi v mreži in se ne zbudi |
| 3 | Telovadba ob prikolici | Nürburg (Döttinger Höhe) | 5 | prikolica z avtom, podloge, uteži, drog za zgibe, zvočnik, senčnik | pajacki, počepi, zgibe; šprint k ograji, tam skačejo |
| 4 | Dirka na televiziji pod šotorom | Nürburg (pred Schwalbenschwanzom) | 6 | paviljon, televizor, kavč, vreča za sedenje, hladilnik, agregat, satelitska antena, kombi, WC kabina | gledajo prenos; stečejo »v živo« k ograji; lenuh ostane na kavču |
| 5 | Hiša ob cesti | Ouninpohja (rumena hiša) | 5 + pes | obstoječa hiša, vrtna ograja, nabiralnik, gredice, perilo, drvarnica, tnalo, klop, trampolin, traktor | cepijo drva, obešajo perilo, otroka na trampolinu; pridejo k vrtni ograji, pes teče ob njej |
| 6 | Oder iz gradbenih odrov | Nürburg (Quiddelbacher Höhe) | 7 | oder v dveh nadstropjih s kavčem, transparenti, zastave, pivska garnitura, WC kabina | sedijo na odru; vstanejo, skačejo, zastava, troblja; spodnja stečeta k ograji |
| 7 | Tribuna z valom | Bathurst (ravnina pred zadnjim zavojem) | skupine 2–10 | montažna tribuna, velik zaslon, zastave, WC kabini | sedijo v skupinah s praznimi sedeži vmes; vstanejo tisti ob tebi, val gre s tabo |
| 8 | Fotografi in TV kamera | Spa (pred Eau Rouge) | 5 | stolp s kamero in dežnikom, medijski kombi s satelitsko anteno, paviljon s prenosnikom | kava, pregled slik; pokleknejo k ograji, objektivi in kamera ti sledijo |
| 9 | Maršali na postaji | Spa (Kemmel) | 4 | koča s številko in lučmi, zastave, gasilna aparata, vreče posipa, štirikolesnik, senčnik | radio, pometanje, poročilo; zastave (rumena ob nesreči, modra), pogled za tabo |
| 10 | Gasilci in reševalci | Spa (pred Blanchimontom) | 5 | gasilsko in reševalno vozilo, cev, aparati, stožci, šotor prve pomoči z nosili | kava, cev, pogovor; vstanejo, palec gor |
| 11 | Vhod: varnostniki, policija, hrana | Spa (ciljna ravnina) | 9 v skupinicah 2–3 | vhod z zapornico, kabina, policijski avto in motor, tovornjak s hrano, visoke mize, WC kabini | pregled torbe, usmerjanje, vrsta za hrano; gledalci s pijačo k ograji, policist pomaha |
| 12 | Mehaniki v boksih | Bathurst (zid boksov) | 7 | stojnica z monitorji ob zidu, tabla za voznika, gume, grelci, voziček, omara z orodjem, skiro | delajo; ko pelješ mimo, tabla čez zid (mesto, krog, razlika), mahajo |

Prizori stojijo na mestih, kjer je ograja blizu ceste in je pred njimi ravnina: iz kamere za avtom, ki gleda strmo navzdol, se prizor vidi le ~50 m naprej, zato morajo ljudje steči, ko si še izven slike, sicer jih nikoli ne vidiš pri delu (v posnetku dirke in TV kamerah se vidi več).

## Že narejeno v igri ob predlogih (želje uporabnika med izdelavo)

- **Živali in elementi po gozdovih glede na državo** (`js/world-zivali.js`, opis v `docs/igra.md`, razdelek Grafika).
- **Avtomobili ob cesti posodobljeni** (`parkedCar` v `js/world.js`).
