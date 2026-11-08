# Realizem prog in avtov: paketi S, E, G in P

Ta načrt opisuje, kako proge in avti postanejo bližje resnici. Vsebuje štiri pakete:
- **S** stavbe;
- **E** cesta in predmeti;
- **G** rastje in teren;
- **P** poškodbe.

Opisuje še skupni postopek za vse proge in vrstni red prog.

Načrt je pripravila seja računa jure.kopac26 8. 11. 2026 kot predstavitev za Mateja (različica 4). Uporabnik ga je potrdil 8. 11. 2026 ob ~23.00 (razdelek »Odločitve«).

Kode še ni. Vsak korak je svoja seja z vejo `realizem/<korak>` in osnutkom pull requesta (»Naredi korak <korak> po docs/realizem.md«).

Viri so samo odprti (razdelek »Viri«), nikoli Google Maps, Google Earth ali Street View.

## Odločitve uporabnika (8. 11. 2026)

Uporabnik je odgovoril v pogovoru z Matejem ob ~23.00. Odgovori so zapisani na strani Odločitve računa jure.kopac26 ob 23.01–23.02.

| Vprašanje | Odločitev |
|---|---|
| `realizem-paketi` | **1 · Vse štiri**: S, E, G in P, ~96 sej |
| `realizem-proge-najprej` | **1 · Najmanj podobne resnici najprej**, v skupinah po 3–4 (razdelek »Proge in vrstni red«) |
| `realizem-stavbe` | **1 · Stavbe ob cesti po meri**: stavbe tik ob cesti dobijo balkone, okna po nadstropjih, napušč in pravo streho |
| `realizem-znamenitosti` | **1 · Po pravni oceni države** (razdelek »Pravna ocena po državah«); kjer ni preverjeno, ostane generično |
| `poskodbe-vpliv-voznja-2` | **1 · Samo videz** (privzeto): avto je zmečkan, vozi pa kot nepoškodovan. V Nastavitvah je izbira **Izklop / Samo videz / Vklop** |

Isti dan veljajo še te odločitve (pravila v `CLAUDE.md` in `docs/proge-po-drzavah.md` pridejo s #519):
- **20.25:** proge na odločanju so zamrznjene kot testne.
- **22.08 (potrditev):** na odločanju so Avstralija (Bathurst, Great Alpine Road), Anglija (Crystal Palace, London), Maroko (Marrakesh, Dadès) in Japonska (Irohazaka, Hakone). Suzuka ostane prava proga.
- **22.08:** Finska ni na odločanju. Nova proga je Koli. Ouninpohja gre v test, Harju pa, ko je Koli na `main`.
- **~21.20:** Norveška, Švedska, Danska in Finska imajo zimo privzeto.
- **21.25:** nova mapa in misije so v vrsti za progami.

Od 5. 11. 2026 ostane oblika dreves »mehke krogle«.

## Proge in vrstni red

**Komu so paketi namenjeni.** Paketi gredo na 15 pravih prog z `main`, ki niso na odločanju: 7 s stavbami in 8 gorskih cest. Pikes Peak šteje dvakrat, asfalt in makadam.

**Izvzete proge:**
- **Testne proge.**
- **Proge na odločanju.** Bathurst, Great Alpine Road, Crystal Palace, Marrakesh in Irohazaka so zamrznjene. Dobijo samo oceno, ki pomaga pri izbiri ene proge na državo.
- **Harju in Ouninpohja.** Gresta v test.
- **Proge v odprtih pull requestih, dokler niso na `main`.** Glej »Čas in vrsta«.

**Slike pred in po** se posnamejo na Spa, Suzuki ali Pikes Peaku s kamere za avtom.

**Ocena 1–5** (8. 11. 2026) ima štiri vidike: cesta, stavbe, predmeti ob cesti in rastje. Vse se gleda v pasu 60 m, ki ga vidi kamera. Povprečje 15 prog je 3,7:

| Vidik | Povprečje |
|---|---|
| Cesta | 4,2 |
| Predmeti | 3,7 |
| Rastje | 3,6 |
| Stavbe (11 prog) | 3,2 |

**Vrstni red** je po izbiri uporabnika: najmanj podobne resnici najprej, v skupinah po 3–4. Stolpec »Kaj najprej« pove, kateri paket proga najbolj potrebuje. Paketa E in G gresta na vseh 15 prog, paket S samo na proge s stavbami.

| Skupina | Proga | Ocena | Kaj najprej | Najbolj odstopa |
|---|---|---|---|---|
| 1 | Nürburg, Nemčija | 3,0 | G → S → E | v igri je 19 od 61 stavb ob progi; v pasu ob progi je 82 % gozda, v igri trava |
| 1 | Pikes Peak, ZDA (asfalt in makadam) | 3,0 | G | rastje; cesta je namenoma skrajšana na 6,3 km in paket tega ne spreminja |
| 1 | Suzuka, Japonska | 3,3 | S → G | v igri je 58 od 99 stavb ob progi, boksi in tribune so škatle |
| 1 | Tianmen, Kitajska | 3,3 | G (rastje, teren) | pobočja so travnata, v resnici je do ceste gost gozd |
| 2 | Livorno, Italija | 3,5 | S → E → G | stavbe so pravokotniki, višino ima 20 od 1442; manjkajo svetilke (178), postajališča (48) in robniki; namesto borovcev in makije je gola zemlja |
| 2 | Rio do Rastro, Brazilija | 3,7 | G | pri 3,9 km je enakomerna trava, v resnici je ob cesti več kot pol gozda |
| 2 | Spa, Belgija | 3,8 | G → S → E (asfalt) | stavbe so sive škatle brez oken, 85 % brez višine iz podatkov; trava je v pasovih košnje, v resnici je ob progi veliko gozda |
| 3 | Medvode, Slovenija | 4,0 | S (po #494) | višino ima 7 od 481 stavb, vse imajo isto fasado in streho |
| 3 | Montréal, Kanada | 4,0 | S → E | paviljoni so poenostavljeni; umetnin ob progi ne delamo |
| 3 | Štajerska, Avstrija | 4,0 | S | tribune in boksi niso na pravih obrisih (v OSM je 7 tribun z obrisi) |
| 3 | Chapman's Peak, Južna Afrika | 4,0 | G (teren) → E | višinski model s 30 m zgladi pečine nad morjem |
| 4 | Bâlea, Romunija | 4,3 | S → E | koče in postaja žičnice so preproste |
| 4 | Katu-Jaryk, Rusija | 4,3 | G | macesni so povsod enako gosti |
| 4 | Los Caracoles, Čile | 4,3 | S | hotel ob jezeru in koče so preproste škatle |

Ocene prog na odločanju so samo za izbiro ene proge na državo:

| Država | Proga | Ocena |
|---|---|---|
| Avstralija | Bathurst | 3,8 |
| Avstralija | Great Alpine Road | 3,7 |
| Anglija | Crystal Palace | 3,3 |
| Maroko | Marrakesh | 3,8 |
| Japonska | Irohazaka | 3,0 |

## Postopek za vse proge

En postopek velja za predelavo 15 prog in za vse nove proge. Je nov korak v `tools/proga-podatki.py`, nastavitve so v `tools/<id>/config.json`, zato je vsak korak ponovljiv.

**Koraki postopka:**
1. **Podatki.** Iz Overture Maps (javna shramba S3) pridejo ceste, stavbe, ograje in zidovi, infrastruktura (svetilke, postajališča, mostovi) in pokrovnost tal. Stavbe z virom Google (Google Open Buildings) se izločijo. Zraven pridejo ESA WorldCover (10 m) in barve tal iz Sentinel-2.
2. **Poravnava.** Podatki se premaknejo in zasučejo na progo v igri: po cestah, pri dirkališčih po stavbah. Premik se zapiše v `config.json`.
3. **Stavbe v pasu 60 m.**
   - Pravi tlorisi, poenostavljeni.
   - Višina iz `height` ali nadstropij, sicer privzeta za kraj.
   - Streha, barve in material iz OSM.
   - Fasada iz atlasa regije, stavbe tik ob cesti po meri.
   - Ravni podrobnosti: do 60 m podrobno, do 300 m združene škatle, dlje obris na obzorju.
4. **Predmeti po državah.** Kompleti so ograje, smerniki, ogledala, jarki, svetilke, postajališča in table brez napisov. Postavijo se po podatkih in po pravilih (npr. ogledalo v ostrem ovinku). Rišejo se kot primerki iste mreže.
5. **Rastje po podnebju.** Drevesa, grmi in trava se razporedijo po razredih WorldCover, v pasu v enakem deležu kot v resnici. Tla ob asfaltu, barve in svetloba so po državi.
6. **Zima na severu** (pravilo »Sever v snegu«, s #519). Za Norveško, Švedsko, Dansko in Finsko postopek pripravi zasneženo pokrajino, zamete ob cesti in ograjah ter zbit sneg na cesti. Rastje iz WorldCover dobi sneg, barve tal so iz zimskih posnetkov Sentinel-2.
   - Silkeborg in Kågeröd dobita zimo s svojo temo v »Načrtovano« (`docs/vrsta.md`).
   - Longyearbyen in Koli jo dobita ob izdelavi.
7. **Pravni filter.** Brez imen, logotipov in napisov, brez umetnin in kipov. Znamenitosti so po pravni oceni države (spodaj).
8. **Obremenitev in slike.** `perf.test.mjs` dovoli do ~300 klicev risanja in ~900 tisoč oglišč. Druge proge ne smejo zrasti. Slike pred in po se posnamejo s kamere za avtom.

**Nove proge.** Seja nove proge požene isti korak pri pripravi podatkov, kar doda ~0,5 seje na progo. Postopek bo nared ~17. 11. pri dveh računih oziroma ~23. 11. pri enem. Proge, ki se začnejo prej, se zgradijo po starem in gredo med predelave (vsaka +~1 seja).

## Paketi

**S, E in G** spreminjajo svet ob cesti in `js/world.js`. Zato gredo na `main` drug za drugim, v vrstnem redu, v katerem so nared. Vsak naslednji pred združitvijo spoji svež `main` in razreši spore v `js/world.js`.

**P** (poškodbe: `js/render.js`, `js/core.js`) teče vzporedno z njimi.

Vsak od S, E in G ima najprej korak z orodjem in graditeljem (S0, E0, G0), nato skupine prog po vrstnem redu zgoraj.

### S · Stavbe (~21 sej)
- **Kaj se spremeni:**
  - Oblika strehe, barve, material in nadstropja pridejo iz OSM (`roof:shape`, `roof:colour`, `building:colour`, `building:material`, `building:levels`).
  - Kjer podatka ni, se uporabi slog kraja iz atlasa fasad po regijah. Atlas je risan po odprtih fotografijah.
  - Stavbe tik ob cesti so po meri (izbira uporabnika), z balkoni, okni po nadstropjih, napuščem in pravo streho.
  - Okna in vrata so tekstura v atlasu, ne geometrija. Balkoni in napušč so samo pri stavbah tik ob cesti.
  - Znamenitosti so po pravni oceni države.
- **Koraki:**
  - S0: orodje (Overture brez virov Google, strehe, ravni podrobnosti) in atlas fasad.
  - S1: Nürburg, Suzuka, Livorno, Spa.
  - S2: Medvode (po #494), Montréal, Štajerska. Bâlea in Los Caracoles imata malo stavb in gresta zraven brez svoje seje.
- **Telefon:** cilj je +0 klicev risanja (atlas, skupne mreže) in največ ~150 tisoč oglišč na progo.
- **Seje:** 10 za orodje in atlas, ~1,5 na progo s stavbami.
- **Datoteke:**
  - `tools/proga-podatki.py` (korak za stavbe), `tools/<id>/config.json`;
  - `js/world.js` (graditelj stavb, ravni podrobnosti);
  - atlas fasad v `assets/`;
  - podatki v `js/tracks/<id>.js`.
- **Tveganje:**
  - oglišča v krajih z veliko stavbami (Livorno, Medvode);
  - pravna presoja znamenitosti;
  - spori v `js/world.js` s pull requesti prog.

### E · Cesta in predmeti (~17 sej)
- **Kaj se spremeni:**
  - Ograje so takšne vrste kot v resnici: jeklena, betonska, iz gum, mreža.
  - Robniki dobijo barve in oblike posamezne proge.
  - Svetilke in table se postavijo, kjer so v OSM.
  - Kompleti predmetov po državah: ograje, smerniki, ogledala, jarki, drogovi, postajališča, table brez napisov.
  - Asfalt se nosi: temnejša linija vožnje, zalite razpoke, krpe, prašna robova, madeži olja v zaviralnih conah.
- **Koraki:**
  - E0: orodje za robove in asfalt, kompleti po državah.
  - E1–E4: skupine 1–4.
- **Telefon:** predmeti kot primerki (+1–3 klici na progo). Obraba asfalta stane 0–2 klica (senčilnik in nalepke na isti mreži).
- **Seje:** ~6 za orodje in komplete, ~0,75 na progo.
- **Datoteke:**
  - `tools/proga-podatki.py` (ograje, zidovi, svetilke iz OSM);
  - `js/world.js` (kompleti kot primerki, robniki);
  - `js/render.js` (obraba asfalta v senčilniku);
  - podatki v `js/tracks/<id>.js`.
- **Tveganje:**
  - klici risanja pri predmetih;
  - robniki dirkališč ne smejo spremeniti vožnje;
  - spori v `js/world.js`.

### G · Rastje in teren (~16 sej)
- **Kaj se spremeni:**
  - Gozd, grmovje in golo skalovje so v pasu ob cesti v enakem deležu kot v resnici (WorldCover).
  - Trava je brez pasov košnje, razen kjer jih ima resnična proga.
  - Ob asfaltu je ozek pas zemlje in gramoza.
  - Barve tal so iz Sentinel-2, svetloba in ton po državi.
  - Kjer višinski model zgladi pečine (Chapman's Peak, Tianmen), je teren po meri.
  - Oblika dreves (»mehke krogle«) ostane.
- **Koraki:**
  - G0: WorldCover in Sentinel-2, kompleti rastja po podnebju, svetloba po državah.
  - G1–G4: skupine 1–4.
- **Telefon:**
  - Barve in svetloba stanejo 0 klicev.
  - Gozd do ceste je glavno tveganje za oglišča. Do 60 m so podrobna drevesa, za tem ploskve krošenj.
- **Seje:** ~8–9 za orodje in komplete, ~0,5 na progo.
- **Datoteke:**
  - `tools/proga-podatki.py` (WorldCover, Sentinel-2);
  - `js/world.js` (rastje po razredih, pas zemlje, zima na severu);
  - `js/render.js` (svetloba in ton po državi);
  - podatki v `js/tracks/<id>.js`.
- **Tveganje:**
  - oglišča gozda do ceste;
  - barve in svetloba ne smejo spremeniti drugih prog (slike `gfx`).

### P · Poškodbe (16 sej)

Najboljše poškodbe so v igri že zdaj, a izklopljene (Nastavitve, Razbijanje). Paket jih vklopi in doda, kar se ob trku v resnici zgodi najprej.

**Privzeto samo videz** (izbira uporabnika): avto je zmečkan, vozi pa kot nepoškodovan. V Nastavitvah je izbira **Izklop / Samo videz / Vklop**:
- **Izklop:** brez poškodb.
- **Samo videz:** privzeto.
- **Vklop:** tudi vpliv na vožnjo.

**Začetek:** ko so na `main` #460 in #480 (avti) in deli iz garaže na vseh avtih po meniju #516. #322 je na `main` od 8. 11. Ocena začetka je ~16. 11.

**Vrstni red:** P1 → P4 → P2 → P5 → P3 → P6, v 4 pull requestih. Predlog razdelitve: P1, P4 + P2, P5 + P3, P6.

| Korak | Kaj | Samo videz (privzeto) | Vklop | Telefon | Seje |
|---|---|---|---|---|---|
| P1 Novi način poškodb privzeto | vklopijo se obstoječa stikala Razbijanja: gostejše telo z udrtinami, steklo, ki poči, odrgnjena barva, deli na cesti; namesto 11 stikal ena nastavitev podrobnosti (preproste / podrobne); drobci stekla in barve 1–3 cm | ves videz | enako | polno telo samo za igralca in 5 najbližjih avtov (predlog, ~+15 klicev); vsi razbiti avti s polnim telesom 221 → 283 klicev | 1 |
| P4 Sledi trkov in pravi delci | na avtu barva drugega avta ali siva odrgnina od zidu; na cesti drobni črni koščki plastike, drobci stekla, luske barve; iskre in brazde, ko podvozje drgne po tleh | ves videz | enako | +1–2 klica (vsi delci v enem nizu) | 1–2 |
| P2 Motor: para, pregrevanje, olje | para iz hladilnika pri 15–30 % poškodbe (zdaj dim šele nad 45 %), oljni dim in madeži | para in dim | še pregrevanje: motor izgublja moč in se ustavi | 0 (sistem dima) | 1–2 |
| P5 Steklo in luči | vetrobransko steklo poči v pajčevino in ostane; stranska in zadnja razpadejo v kocke; žaromet poči, luč ugasne ali sveti postrani | ves videz; steklo na cesti ne vzame oprijema | steklo na cesti vzame največ 5 % oprijema (zdaj 20 %, ko je vklopljeno Razbijanje) | 0 | 1 |
| P3 Kolesa in obese | zvita spona ali platišče, nagnjeno kolo, povešen vogal, iskre pod podvozjem | kolo je vidno zvito | avto vleče na stran, pri hitrosti trese | 0 | 1–2 |
| P6 Karoserija kot pri testih trkov | močan čelni trk skrajša prednji del za 0,4–0,7 m, pokrov se zloži v obrnjen V, pri trku z vogalom gre kolo nazaj, kabina ostane cela | skrajša se samo telo | enako | 0 | 2–3 |

P6 ima visoko tveganje (testi trkov, tekmeci in reference), zato je zadnji.

**Obremenitev telefona**, merjeno 8. 11. 2026 na Bathurstu, preden je šel na odločanje:
- dirkališče z 20 avti na štartu;
- nastavitve za telefon: 844 × 390, kakovost normalna, detajli avtov nizki, sence;
- »po trkih« pomeni šest udarcev na avto, povprečno 46 % poškodbe.

Nadaljnje meritve so na Spa.

| Način | Klici, nepoškodovani | Klici po trkih | Oglišča po trkih |
|---|---|---|---|
| Zdaj (privzeto) | 210 | 221 | 681 tisoč |
| Vse Razbijanje vklopljeno | 260 | 283 | 702 tisoč |
| Samo novo telo | 260 | 283 | 694 tisoč |
| Predlog P1: polno telo za igralca in 5 najbližjih (ocena) | ~225 | ~236 | ~690 tisoč |
| Meja proge (`CLAUDE.md`) | ~300 | ~300 | ~900 tisoč |

Čas sličice v brskalniku brez grafične kartice je preveč nemiren za sklepe. Pri 120 udarcih hkrati se prve sličice v obeh načinih zataknejo do ~1 s; to je treba preveriti na telefonu.

- **Datoteke:**
  - `js/render.js` (telo, steklo, para, delci, kolesa);
  - `js/core.js` (model poškodb, vpliv na vožnjo pri »Vklop«);
  - `js/game.js` (Nastavitve);
  - `js/lang.js` (prevodi).

  `js/world.js` ostane nespremenjen.
- **Tveganje:**
  - klici risanja pri polju razbitih avtov (283 od ~300);
  - vpliv na vožnjo pri »Vklop« spremeni čase krogov in teste voženj (privzeto ga ni);
  - začetek je odvisen od #460, #480 in #516.

## Pravna ocena po državah

**Ta ocena ni pravni nasvet.** Velja povsod:
- v igri ni imen, logotipov, napisov in znamk;
- umetnin in kipov ne delamo nikjer, tudi kjer bi jih zakon dovolil;
- stavbe so samo od zunaj.

Kjer piše »ni preverjeno«, je ocena iz drugotnih virov ali splošnega znanja. Tam znamenitosti ostanejo generične, dokler ni preverjeno.

Mestne proge po središču velikih mest ostanejo generične (`CLAUDE.md`). Stavb po meri (tloris, višina, streha, fasada regije) ta ocena ne zadeva, samo prepoznavne znamenitosti.

| Država | Proge | Zunanjost stavb v prodajni igri | V igri |
|---|---|---|---|
| Belgija | Spa | da: izjema za panoramo od 2016 (čl. XI.190 zakonika o gospodarskem pravu), tudi za prodajo | tribune in boksi po meri, brez imen |
| Japonska | Suzuka (Irohazaka, Hakone na odločanju) | da: čl. 46, arhitektura prosto; izjema je samo gradnja kopije stavbe | stavbe po meri; panoramsko kolo splošne oblike |
| Finska | Koli (nova) | da: §25a, stavbe se smejo upodabljati prosto, tudi za prodajo | po meri |
| Avstrija | Štajerska | da: §54(1) Z5 UrhG, tudi za prodajo; gradnja kopije ne (OGH 4 Ob 51/94) | tribune in boksi po pravih obrisih, brez znakov; kipi in simboli znamk ne |
| Rusija | Katu-Jaryk | da: čl. 1276 civilnega zakonika, arhitektura prosto, tudi za prodajo | redke stavbe po meri |
| Kanada | Montréal | da, z opombo: čl. 32.2(1)(b) zakona o avtorski pravici (slika, risba, fotografija, film); ali zajame 3D igro, ni preverjeno | paviljoni in kupola po meri; umetnin ob progi ne delamo |
| Italija | Livorno | ne: izjeme za panoramo ni; zakonik o kulturni dediščini (čl. 107–108) za prodajno rabo podob javne kulturne dediščine zahteva dovoljenje in plačilo | cerkve, gradova ob obali in obalni stolp generično (tloris in višina, ne prepoznavna kopija) |
| Južna Afrika | Chapman's Peak | ne: izjeme za panoramo ni; ali je dopolnitev zakona že v veljavi, ni preverjeno | cestninska postaja generična |
| Maroko | Marrakesh, Dadès (na odločanju) | ne: za prodajo izjeme ni | generično, če se proga vrne |
| Slovenija | Medvode | ni preverjeno: čl. 55 ZASP; drugotni viri pravijo, da samo nekomercialno; zakon o varstvu kulturne dediščine lahko doda omejitve | generično |
| Nemčija | Nürburg | ni preverjeno: §59 UrhG, pogled z javnega mesta, samo zunanjost, na sliki ali filmu; prostorska kopija ni zajeta | zunanjost poenostavljena ali generična, brez napisov |
| Romunija | Bâlea | ni preverjeno: dovoljeno, če delo ni glavni motiv; za prodajo ni potrjeno | koče in žičnica v ozadju, ledeni hotel generičen |
| Čile | Los Caracoles | ni preverjeno: čl. 71F zakona o avtorski pravici, dela na javnih mestih prosto | hotel ob jezeru brez imena, poenostavljen |
| ZDA | Pikes Peak | ni preverjeno: §120(a), stavbe, vidne z javnega mesta, na slikah prosto; 3D ni potrjeno | stavba na vrhu poenostavljena, brez imena |
| Brazilija | Rio do Rastro | ni preverjeno: čl. 48 zakona 9.610, dela na javnih mestih prosto | razgledišče generično |
| Kitajska | Tianmen | ni preverjeno: čl. 24(10), dopolnitev 2020; prodajna raba ni potrjena | Nebeška vrata so naravna jama, ne delo |

Viri (8. 11. 2026):
- zakoni prek WIPO Lex in nacionalnih zbirk predpisov;
- pregled izjem za panoramo po državah na Wikimedia Commons;
- za Italijo, Nemčijo, Slovenijo in Južno Afriko še pravni članki.

Država se premakne iz »ni preverjeno«, ko seja doda vir in uporabnik potrdi.

## Čas in vrsta

**Seja** je ena seja Opus z naporom max (~3 ure dela). Ena linija naredi ~3 seje na dan. En račun ima dve liniji, dva računa štiri.

**Začetek** je po tedenskem načrtu (pon. 9. 11.), najprej v torek 10. 11. Račune določi tedenski načrt.

| Paket | Obseg | Seje | 1 račun | 2 računa |
|---|---|---|---|---|
| S Stavbe | orodje, atlas fasad, 7 prog | 21 | 10.–19. 11. | 10.–14. 11. |
| E Cesta in predmeti | orodje za robove in asfalt, kompleti po državah, 15 prog | 17 | 19.–26. 11. | 10.–17. 11. |
| G Rastje in teren | WorldCover in Sentinel-2, kompleti po podnebju, svetloba po državah, 15 prog | 16 | 10.–16. 11. | 10.–16. 11. |
| P Poškodbe | P1–P6 za vse avte, obremenitev | 16 | 17.–23. 11. | 16.–20. 11. |
| Predelava prog iz PR | 14 prog, ko pridejo na `main` | 17 | 24.–29. 11. | 17.–21. 11. |
| Nove proge po novem postopku | +0,5 seje na progo, ~17 prog, sproti z izdelavo | 9 | od 23. 11. | od 17. 11. |
| Skupaj | do zadnje skupine prog na `main` | ~96 | ~1. 12. | ~23. 11. |

**Proge iz PR** (stanje 8. 11.):
- Killar;
- 10 novih prog iz N1–N3: Silkeborg, Kågeröd, Izoard, Sosnová, Pembrey, Kildare, Sa Calobra, Kotor, Biķernieki, Zandvoort;
- Furka, Santo Antão in Gudauri iz N4.

Hakone, London in Dadès so na odločanju in odpadejo. Paketi teh prog ne spreminjajo, dokler njihovi pull requesti (#494, #485, #498, #500 in N4) niso na `main`.

**Poraba** (8. 11.): biketraveler ima od pon. 9. 11. ob 0.00 cel teden. partyslo bo brez porabe od čet. 12. 11. zvečer. Datumi za dva računa veljajo, če drugi račun dela ves čas. Nova mapa in misije so v vrsti za progami in tu niso šteti.

**Vrsta.** Paketi prinesejo ~17 pull requestov:
- 3 za orodja in graditelje (S0, E0, G0);
- 4 za poškodbe;
- ~10 skupin prog po 3–4 (S1–S2, E1–E4, G1–G4).

V vrsti so pred novimi progami (vrstice v »Načrtovano«, `docs/vrsta.md`). Predelave prog iz PR pridejo, ko so te proge na `main`.

## Tveganja

- **Obremenitev telefona.** Gozd do ceste in stavbe po meri dodajo oglišča, Razbijanje pa klice risanja (283 od ~300 pri 20 razbitih avtih). Zato so ravni podrobnosti, atlas in polno telo samo za najbližje avte. Vsaka proga gre skozi `perf.test.mjs`.
- **Spori v `js/world.js`.** Spori so med paketi in pull requesti prog. Zato gredo paketi na `main` drug za drugim, proge v odprtih pull requestih pa se ne spreminjajo.
- **Pravo.** Nepreverjene države ostanejo generične.
- **Zamrznjene proge.** Če se proga z odločanja vrne, gre med predelave.

## Stanje

| Korak | Veja / PR | Stanje |
|---|---|---|
| Načrt in odločitve | `docs/realizem-paketi` | potrjen 8. 11. 2026; ta dokument |
| S0–S2, E0–E4, G0–G4, P1–P6 | `realizem/<korak>` | čaka na tedenski načrt (pon. 9. 11.); P po #460, #480 in #516 |

## Viri

- **Overture Maps** (izdaja 2026-10-21.0, javna shramba S3): stavbe, ceste, ograje, infrastruktura, pokrovnost tal. Stavbe iz vira Google (Google Open Buildings) so izločene.
- **OpenStreetMap** (ODbL 1.0), tudi prek Overture. Izpeljani podatki v datotekah prog so prav tako pod ODbL 1.0.
- **ESA WorldCover 10 m** (CC BY 4.0) in **Sentinel-2** (Copernicus).
- **Copernicus DEM** in Terrain Tiles za poravnavo podatkov na proge.
- **Fotografije** samo kot zgled za videz: Wikimedia Commons in Mapillary, z licenco preverjeno pri vsaki.
- **Poškodbe:** javni testi trkov (posnetki na Wikimedia Commons) in strokovni članki o steklih in hladilnikih po trku.

Vsak vir, ki pride v igro, gre v `README.md` pod »Zasluge«.
