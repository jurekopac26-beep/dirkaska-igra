# Pregled sveta (`js/world.js`, `js/world-*.js`)

Pregled kode sveta igre, samo branje (odločitev uporabnika 8. 11. 2026 ob ~17.40, tabla #382, Matejev komentar 6724187167; račun biketraveler). Poziv: `/code-review max` na skupnih delih `js/world.js` in `js/world-*.js` na svežem `main` (90e09dac). Ena tema s Pregledom jedra (`docs/pregled-jedra.md`), skupni osnutek PR #512 na veji `pregled/jedro-in-svet`.

**Popravkov tu ni**: dokument samo našteje preverjene napake, koda igre je nespremenjena; popravke razvrsti tedenski načrt. Testne proge so zamrznjene (`CLAUDE.md`), zato napake, ki se pokažejo samo na njih, niso v seznamu.

## Stanje
- 8. 11. 2026 ob 18.16: začetek pregleda.
- 19.10: krog 1 (`/code-review max`, en prehod): branje kode in gradnja vseh 27 pravih prog v brskalniku brez glave; devet najdb (S1–S9).
- 19.20–20.20: krog 2, deset vzporednih pregledovalcev po delih datotek (`world.js` v treh delih, Pikes Peak, ljudje, Štajerska/Medvode/Harju/Ouninpohja, gorski gradniki in pomočniki gorskih cest, dirkališča, gorske ceste, ostali graditelji z menjavo proge in kakovosti). Vsako najdbo je pregledovalec preveril z zagonom ali sledenjem kode, hude in srednje še enkrat glavna seja.
- 20.30: **pregled končan.** 38 najdb: 0 kritičnih, 4 hude, 7 srednjih, 27 nizkih. Oznake S so stalne (S1–S9 iz kroga 1, S10 naprej iz kroga 2); razvrstitev po resnosti je v povzetku in v razdelkih spodaj.

## Povzetek

| Oznaka | Resnost | Kaj | Kje | Preverjeno |
|---|---|---|---|---|
| S10 | huda | Los Caracoles: stebra sedežnice sredi asfalta | `js/world-caracoles.js:647` | potrjeno |
| S1 | huda | Imena dirkališč na tablah (Nürburg, Spa) | `js/world.js:5070` | potrjeno |
| S11 | huda | Pikes Peak: ime prireditve na tabli in podiju | `js/world-pikes.js:3622` | potrjeno |
| S12 | huda | Pikes Peak: ovinek z imenom osebe v komentarju | `js/tracks/pikes.js:47` | potrjeno |
| S13 | srednja | Ouninpohja: ograja vrta in ljudje znotraj ograje proge | `js/world-ljudje.js:660` | potrjeno |
| S14 | srednja | Podrobnosti na isti progi ne zgradijo sveta znova | `js/game.js:1622` | potrjeno |
| S38 | srednja | Svet Bâlee (~45 MB) ostane v pomnilniku po menjavi | `js/world-prelaz.js:276` | potrjeno |
| S2 | srednja | Ure animacij skočijo vsakih 1000 s | `js/world.js:5216` | potrjeno |
| S3 | srednja | Helikopter TV se ravna po izbrisanih kamerah | `js/world.js:4420` | potrjeno |
| S4 | srednja | Svet spremeni fiziko boksov, Node testi tega ne vidijo | `js/world.js:1393` | potrjeno |
| S15 | srednja | Spa: »Speaker's Corner« ostane v igri | `js/tracks/spa.js:52` | potrjeno |
| S16 | nizka | Pikes Peak (makadam): cisterna brez naklona, pogreznjena | `js/world-pikes.js:3982` | potrjeno |
| S17 | nizka | Bathurst: mehaniki in stojnica na pasu boksov | `js/world-ljudje.js:771` | potrjeno |
| S18 | nizka | Montréal: tabla »80« na napačni strani, drog na asfaltu | `js/world-montreal.js:394` | potrjeno |
| S19 | nizka | Bâlea: vrv žičnice 2,5–6 m nad cesto | `js/world-prelaz.js:536` | potrjeno |
| S20 | nizka | Bathurst: helikopter TV odleti skozi vrh tribune | `js/world-rbring.js:196` | verjetno |
| S21 | nizka | Ljudje z nogami pod dvignjenim pločnikom | `js/world-ljudje.js:1129` | potrjeno |
| S22 | nizka | Suzuka: pas razmazane množice na glavnih tribunah | `js/world-suzuka.js:554` | potrjeno |
| S23 | nizka | Trois-Rivières: daljni most z ničelnimi normalami | `js/world-troisrivieres.js:661` | potrjeno |
| S5 | nizka | Sled gume ima luknjo na startni črti | `js/world.js:3797` | potrjeno |
| S6 | nizka | Marrakesh: prosojnost stavb pred koncem kroga | `js/world.js:5262` | potrjeno |
| S24 | nizka | Križišča boksov po nazivni širini ceste | `js/world.js:1278` | potrjeno |
| S25 | nizka | Zidovi dvorišč brez kontaktne sence | `js/world.js:4384` | potrjeno |
| S26 | nizka | Sence oblakov na daljnem pogledu se premikajo s kamero | `js/world.js:3665` | potrjeno |
| S27 | nizka | Sence oblakov tudi ponoči | `js/world.js:3671` | potrjeno |
| S28 | nizka | Nürburg: štartna polja za 21 od 100 avtov | `js/world-nring.js:88` | potrjeno |
| S29 | nizka | Pikes Peak: tabla vmesnih časov pokaže »1:60.00« | `js/world-pikes.js:3972` | potrjeno |
| S30 | nizka | »Mirni« gledalci še mahajo (opis in koda se razhajata) | `js/world.js:4839` | potrjeno |
| S31 | nizka | Prizor `tv` šteje za osebje | `js/world-ljudje.js:1213` | verjetno |
| S7 | nizka | Daljna meglica se preračuna vsako sličico | `js/world-iroha.js:135` | potrjeno |
| S32 | nizka | Dim letal se računa vso dirko | `js/world-rbring.js:262` | potrjeno |
| S33 | nizka | Tribuna se ob vsaki pozi cela naloži na GPU | `js/world-ljudje.js:1289` | potrjeno |
| S34 | nizka | Medvode: maske gramoznih šivov ob vsaki gradnji | `js/world.js:1181` | potrjeno |
| S35 | nizka | Montréal: mreža `MG` ostane v pomnilniku | `js/world-montreal.js:52` | potrjeno |
| S36 | nizka | Snežna tekstura ostane na GPU po zimi | `js/render.js:4340` | potrjeno |
| S37 | nizka | Tabela slepih krakov `STG` ostane od prejšnje proge | `js/world-vrsic.js:1116` | potrjeno |
| S8 | nizka | Material daljne meglice kopiran v pet graditeljev | `js/world-toronto.js:572` | potrjeno |
| S9 | nizka | Ostanek spoja `js/world-rbring.js.orig` | `js/world-rbring.js.orig:1` | potrjeno |

Skupine za popravke: **pravna varnost pred Google Play** S1, S11, S12, S15 (en PR z imeni); **predmeti na cesti ali v poti avta** S10, S13, S17, S18, S19; **pomnilnik ob menjavi proge** S38, S35, S36, S37 (en PR: `World.keep` ali sprostitev ob `World.build`); **obremenitev telefona** S3, S7, S32, S33, S34 (+ S8 kot priprava).

## Najdbe po resnosti
Vsaka najdba ima datoteko in vrstico (na `main` 90e09dac), opis in konkreten primer, ki jo sproži. Preverjeno: **potrjeno** (zagon v brskalniku ali Node, ali nedvoumna sled kode) ali **verjetno** (del ni ponovljen; napisano, kateri).

### Kritične
Ni najdb: vseh 27 pravih prog se zgradi pri vseh kakovostih brez napake in brez NaN/Infinity v geometriji, matrikah in predmetih; nobena najdba ne ustavi igre ali naredi proge nevozne.

### Hude

**S10 · Los Caracoles: stebra sedežnice stojita sredi asfalta** · `js/world-caracoles.js:647`
- Korak »never on the road« (`if (nn.i >= 0 && nn.dd < 3) { x += ux * 14; z += uz * 14; }`) steber, ki je preblizu ceste, premakne 14 m naprej po črti žičnice, ne stran od ceste, in nove lege ne preveri. Steber tik pred cesto pristane na njej. Trka s sceno ni, zato avto pelje skozi drog.
- **Primer:** Los Caracoles, Čile, vse kakovosti (žičnic ne omejuje LOD), sedežnica `def.lifts[8]` (1276 m, 21 razponov po 60,8 m, cesto prečka štirikrat): steber 2 je bil pri lat −9,92 m (0,02 m za levo ograjo), korak ga prestavi na lat +4,02 m pri s = 6812 m (6692 m po štartu); steber 4 z lat +10,05 m na −3,55 m pri s = 8038 m (7918 m po štartu). Asfalt sega do ±6,5 m; navpični žarki zadenejo vrh droga 11,6 in 10,7 m nad cesto, prečni pri s = 8038 m drog že 0,2 m nad asfaltom. Od desetih žičnic sta prizadeta samo ta dva stebra.
- Preverjeno: potrjeno (žarki v brskalniku).

**S1 · Imena dirkališč na tablah in grafitih (pravna varnost)** · `js/world.js:5070`, `:5090`, `:5132`; `js/world-nring.js:242-243`, `:291`; `js/world-spa.js:67`, `:355`
- `CLAUDE.md`, »Pravna varnost«: v igri so samo zemljepisna imena, table in napisi so generični ali izmišljeni; »Ime proge«: ne imena dirkališča. Progi sta preimenovani v Nürburg in Spa, napisi pa so ostali.
- **Primer:** Nürburg, Nemčija: transparenti na zidovih ciljne ravnine (atlas `BAN+1`…`BAN+3`), table na mostovih čez progo in grafiti na cesti pišejo NÜRBURGRING, GRÜNE HÖLLE, NORDSCHLEIFE. Spa, Belgija: tabla nad štartom in zasloni čez progo pišejo SPA-FRANCORCHAMPS. Vse je vidno s kamere za avtom.
- Preverjeno: potrjeno (besedilo v kodi).

**S11 · Pikes Peak: ime prireditve na tabli z rezultati in na podiju (pravna varnost)** · `js/world-pikes.js:3622`, `:1958`
- Napisa sta zapisana v kodi; `CLAUDE.md`, »Pravna varnost«: brez imen prireditev.
- **Primer:** Pikes Peak (makadam), ZDA (`pikesg`, `pkHistoric`): ročno pisana tabla z rezultati ima spodaj `PIKES PEAK INT'L HILL CLIMB` (ime prireditve). Na obeh različicah Pikes Peaka (`pkLandmarks3`) ima ozadje podija napis `RACE TO THE` / `CLOUDS`, vzdevek iste prireditve.
- Preverjeno: potrjeno (besedilo v kodi); ali je vzdevek tudi zaščitena znamka, ni preverjeno.

**S12 · Pikes Peak: ovinek z imenom osebe v imenu in komentarju (pravna varnost)** · `js/tracks/pikes.js:47` (datoteka proge, ne sveta)
- `CLAUDE.md`: nikoli imen resničnih oseb, ne v imenih ovinkov ne v komentarju; ovinek, poimenovan po osebi, dobi opisno ime, enako kot v meniju. Meni ga že kaže kot *Reservoir Bend* (`maketa-menija/README.md:366`), igra ne.
- **Primer:** Pikes Peak, ZDA: ovinek `{ n: "Hansen's Corner", d: 240, say: ["Through Hansen's Corner, the climb is on!", …] }`: ime v HUD in komentar ob prvem ovinku vsake vožnje.
- Preverjeno: potrjeno (podatki proge).

### Srednje

**S13 · Ouninpohja: ograja vrta, nabiralnik in navijači znotraj ograje proge** · `js/world-ljudje.js:660`
- Mesta prizora `hisa` so izračunana od sredine ceste (hiša sveta na 16 m), ne od ograje `F.bar`; pri širokem pasu do ograje pade odmik ograje vrta pod nič. Prizori nimajo trkov, zato avto ob ograji pelje skozi ograjo vrta in ljudi.
- **Primer:** Ouninpohja, Finska, prizor `hisa` 2240 m levo (s0 = 2310): `T.bl` = 9,7 m, cesta ±6 m, `front = 16 − F.bar − 4` = 2,3, `fb = front − 3,1` = −0,8: ograja vrta, nabiralnik (b = −1,4) in navijači (b = −0,35…−0,2) stojijo 0,2–2,5 m znotraj ograje proge, na travi, kamor avto zapelje (trk je šele na `bl`). 4290 od 10086 oglišč stvari prizora je znotraj ograje, ljudje do −0,43 m. Na vseh 27 progah edini tak prizor; asfalta ne doseže noben.
- **Vrzel v testih:** `tests/browser/ljudje.test.mjs` preveri `clearance` samo v prvi pozi, `tests/ljudje-mesta.test.js` mest ob ograji (`fence`) in stvari prizorov ne preverja.
- Preverjeno: potrjeno (brskalnik, vseh 27 prog).

**S14 · Sprememba »Podrobnosti« (in »Grafika: Retro«) na isti progi ne zgradi sveta znova** · `js/game.js:1622` (`ensureTrack`; zunaj datotek sveta)
- `ensureTrack` gradi znova samo ob drugem `id` ali ob `Render.worldStale` (letni čas Vršiča); `setOption('detail'|'quality')` (`game.js:607–628`) sveta ne označi kot zastarelega. Takoj se spremeni samo doseg daljnega rastja (`applyDetailDist`). `docs/igra.md:613` obljublja spremembo »pri naslednji progi ali dirki«; »ali dirki« ne drži.
- **Primer:** Bathurst, Avstralija, zgrajen pri Nizka (1079 mrež, 1248 tisoč oglišč); igralec nastavi Visoka in začne novo dirko na isti progi: `Render.world` je isti predmet, svet ostane Nizka (Visoka: 1067 mrež, 1649 tisoč oglišč). Obratno: kdor zaradi zatikanja nastavi Nizka in vozi isto progo, ostane na polnem svetu do menjave proge.
- Preverjeno: potrjeno (brskalnik). Test pomnilnika menjave Podrobnosti na isti progi ne preverja.

**S38 · Svet Bâlee ostane v pomnilniku po menjavi proge (~45 MB)** · `js/world-prelaz.js:276`, sprostitev `js/world.js:1440`
- `buildPrelaz` shrani `API.caBank = { T, f: (x, z, h) => … }`. V8 da vsem zaprtjem istega klica en skupen kontekst, zato `f` drži tudi `root` in z njim ves svet Bâlee. `caBank` ni vpisan z `World.keep`, zato ga `World.build` (`world.js:1440`) ne sprosti; prepiše ga šele naslednja gradnja Bâlee. `dispose` sprosti GPU, JS tabele geometrij (`Float32Array`) pa ostanejo.
- **Primer:** Bâlea, Romunija → Spa, Belgija (Visoka, Chromium): JS kopica po sami Spi 182 MB, po Bâlea → Spa 225 MB (trikrat: +45, +43, +46 MB). WeakRef pokaže, da je koren sveta Bâlee (652 tisoč oglišč) živ tudi po dveh gradnjah Spe; posnetek kopice: `World` → `api` → `caBank` → `f` → kontekst → `root`. Z `caBank = null` pred posnetkom Bâlee v njem ni več. Igralec, ki enkrat odpelje Bâleo, nosi ~45 MB do naslednje gradnje Bâlee; na telefonu z malo pomnilnika to veča tveganje, da brskalnik zavihek zapre. Bralec `caH` (`world-caracoles.js:60`; skupni teren Bâlee, Los Caracolesa in Tianmena) ima varovalo `B.T === T`, zato pravilnost ni prizadeta. Stari svetovi drugih 14 preizkušenih prog se po menjavi sprostijo.
- Preverjeno: potrjeno (brskalnik, posnetek kopice, WeakRef).

**S2 · Skupne ure animacij preskočijo vsakih 1000 s** · `js/world.js:5216` (veter `t % 1000`), `:5207` (gledalci `tw % 1000`), `js/world-zivali.js:503` (črede, 3600 s)
- Hitrosti v senčilnikih pri 1000 (oz. 3600) ne naredijo celega števila obratov, zato vsako ovijanje premakne animacijo. Isti vzorec tudi v `world-pikes.js` (`pkWeatherUpdate:1562`, `pkAmbientUpdate:2328`, `pkSummitUpdate:3170`) in pri šampanjcu na odru Štajerske.
- **Primer:** po 16 min 40 s igre (čas izrisa le narašča, `render.js:3324`, `:10244`; trije krogi Nürburga so daljši) `uWind` v eni sličici pade s 1000 na 0. Šopi ob robu (`sin(uWind*2.1…)`, `sin(uWind*1.63…)`, `world.js:3976`) skočijo za 1,4 in 2,7 rad, drevesa Nürburga in Spa (`sin(uWind*0.87…)`, `world.js:215`) za 2,9 rad, zastave (`world-zastave.js:43`) za 0,7 rad, roke in navijanje gledalcev (`uTime*9`, `*8`, `*7`, `*3.1`) do 2,5 rad: rob ceste, gozd, zastave in gledalci hkrati skočijo v novo lego; črede enkrat na uro.
- Preverjeno: potrjeno (sled kode).

**S3 · Helikopter TV na Ouninpohji in Harjuju se ravna po izbrisanih kamerah in stane ~1 ms vsako sličico** · `js/world.js:4420` (`pkFollow`), cena `:4433`
- Mesto helikopterja se išče proti štirim modelom kamer: dve sta kamera za avtom s starim nagibom (0,98 in 0,9 rad; prava ima 0,686 in 0,63, ker je `userTilt` stalno 0,3, `game.js:564`, `render.js:9539`), `views[2]` in `views[3]` pa sta izbrisani izometrična in kino kamera, ki gledata vedno proti −z. Iskanje (24 × 5 = 120 kandidatov × 4 pogledi × 5 projekcij, nove tabele `views`, `cams`, `prot`, `scr`) teče vsako sličico, čeprav se rezultat gladi.
- **Primer:** na ravnem pri 25 m/s s samo pravima pogledoma helikopter obstane 39° od smeri avta na 27 m, ne glede na smer; s kodiranimi pogledi pri smeri 0° na −6° (34 m, skoraj naravnost spredaj, na zgornjem robu pokončne slike), pri 30° na −21°, pri 60° na +54° (46 m), pri 90° na +69°, pri 300° na +9°: na ovinkasti preizkušnji kroži okoli avta, ko cesta zavija. `World.update` z `dyn.pk` 1,29 ms na sličico, brez 0,23 ms (Chromium na namizju, ogret JIT); na telefonu ocenjeno 3–4 ms od 16,7 ms.
- Preverjeno: potrjeno (ponovljeno iskanje zunaj igre, meritev v brskalniku).

**S4 · Gradnja sveta spremeni fiziko boksov; Node testi tega ne vidijo** · `js/world.js:1393`, `js/world-bangsaen.js:249`, `js/world-montreal.js:386`, `js/world-rbring.js:861`, `js/world-toronto.js:317`
- Graditelji zapišejo `T.pitStands` v progo jedra; `pitAt().inner` (`core.js:1297`) je od njega odvisen, trki ga uporabijo kot mejo na strani zidu boksov za vsak avto v boksih (`core.js:3309`).
- **Primer:** Node testi sveta ne zgradijo (`tests/aipits.test.js`, `bathurst.test.js`, `coldtyres.test.js`, `compounds.test.js`, `faults.test.js` nimajo `pitStands`), zato simulirajo mejo ob ograji (zid + 0,12 m), v igri pa je meja na robu pasu ob boksih. Na sredini pasu je razlika 1,33 m (Bathurst), 0,83 m (Spa), 2,33 m (Štajerska), 2,73 m (Toronto), 3,53 m (Montréal). Sprememba, ki avto v boksih zapelje proti zidu, prestane vse Node teste in v igri zadene robnik tribun.
- Preverjeno: potrjeno (sled kode).

**S15 · Spa: ime ovinka »Speaker's Corner« ostane na tabli, v HUD in komentarju** · `js/tracks/spa.js:52`, tabla `js/world-spa.js:513`, atlas `:65`
- `maketa-menija/README.md:364` ga našteva med imeni ovinkov, ki jih je pred prodajo treba zamenjati (*Speaker's Corner* → *Short Left*); `CLAUDE.md`: opisno ime, enako kot v meniju. *Paul Frère* je v igri že zamenjan (»Dolgi desni«), to ime ne.
- **Primer:** Spa, Belgija: graditelj za vsako ime v `T.names` postavi tablo 55 m pred ovinkom, ob ovinku 9 stoji »SPEAKER'S CORNER«; isto ime kažeta HUD in komentar (»Past Speaker's Corner!«), meni pa »Short Left«.
- Preverjeno: potrjeno (podatki proge in koda table).

### Nizke

**S16 · Pikes Peak (makadam): cisterna pred startom brez naklona in pogreznjena** · `js/world-pikes.js:3982`
- `crAt` (`world.js:4921–4924`) vedno vrne isti predmet `CRQ`; `qa = crAt(sm + 3)` in `qb = crAt(sm − 3)` sta isti predmet (`qa.hy − qb.hy` = 0), `q` pa je takrat že prepisan z vrednostmi pri sm − 3.
- **Primer:** Pikes Peak (makadam), ZDA, pred zeleno lučjo: cisterna, ki pelje navzdol (startS + 460 … + 160), ima naklon 0° namesto 2,94° ceste in višino ceste pri sm − 3 (npr. y = 22,205 namesto 22,359 pri sm = 475): zadnji konec ~0,3 m v cestišču, zamaknjena je tudi točka pršenja `uN1`.
- Preverjeno: potrjeno (brskalnik).

**S17 · Bathurst: mehaniki, stojnica in gume prizora `boksi` stojijo na pasu boksov** · `js/world-ljudje.js:771`
- Prizor stoji 0,8–2,3 m za `F.bar`, pas boksov pa se začne že 2,0 m za njim; Core avtu v pasu dovoli do `wall + 0,12` (`core.js:1297`, `:3309`). `tests/ljudje-mesta.test.js:56` prizor `boksi` namenoma izpusti.
- **Primer:** Bathurst, Avstralija, `boksi` 70 m levo: `pitAt(70)` da zid 9,75 m, notranji rob pasu 11,5 m, `inner` 9,87 m (`T.pitStands` null); stvari prizora so na 9,68–12,15 m (2961 od 3006 oglišč med `inner` in `lout`, 662 na asfaltu pasu), trije mehaniki na 11,51–11,8 m. Igralec, ki na poti iz boksa zavije k zidu, pelje skozi stojnico, gume in mehanike (AI vozi po sredini pasu in jih ne doseže).
- Preverjeno: potrjeno (brskalnik, Core `pitAt`).

**S18 · Montréal: tabla »80« ob uvozu v bokse na napačni strani, drog na asfaltu** · `js/world-montreal.js:394`
- `atSf(sE, sg * (pE.o * sg + 5.5))` pomnoži s `sg` dvakrat (da `pE.o + 5,5·sg`); `pitAt().o` je pozitivna razdalja, tako jo uporablja ves `mtPits`. Prav: `sg * (pE.o + 5.5)`.
- **Primer:** Montréal, Kanada, boksi levo (sg = −1): pri sE = −173 m in `pE.o` = 11,80 stoji tabla pri +6,30 m (desno), boksarska steza pri −11,80 m; plošča (3,2 m) sega od 4,7 do 7,9 m, asfalt do 5,2 m, notranji drog pri 5,1 m stoji na asfaltu (avto gre skozenj).
- Preverjeno: potrjeno (Node s Core `pitAt`).

**S19 · Bâlea: vrv žičnice visi 2,5–6 m nad cesto** · `js/world-prelaz.js:536`, `:547`
- Višine stebrov so stalne (`H(k)`: 18–24 m nad `vrFar`, postajama 9 m), vrv se povesi za `span·0,035·4t(1−t)`; višine nad cesto pod razponom koda ne preveri.
- **Primer:** Bâlea, Romunija: zadnji razpon (steber 5 na 195 m → zgornja postaja na 258 m) prečka cesto pri s = 3874–3886 m (316 m pred ciljem): leva vrv je 2,55 m nad asfaltom pri lat +4,9 m, 4,0 m pri +1,7 m, 5,5 m pri −1,4 m; desna 4,5–6,0 m. Avto pelje ~1 m pod vrvjo; v posnetku s TV kamer visi vrv v višini glave.
- Preverjeno: potrjeno (žarki v brskalniku).

**S20 · Bathurst: helikopter TV odleti skozi vrh tribune** · `js/world-rbring.js:196`, višina `:309`
- Točka prečkanja (`X.d = 170` m za štartom) in prihod s strani višjega terena sta izbrana za Štajersko (komentar `:193` našteje samo njene ovire), Bathurst ju podeduje; višina `max(X.y + F.H·(1 + 0,7x²), F.gy + 10)` upošteva samo teren, ne stavb in dreves.
- **Primer:** Bathurst, Avstralija (avto 55 m/s): `F.H` se ustali na 10,2–11 m; pri `F.x` = 0,35–0,42 (20–24 m od sredine ceste) je vrh tribune `standSteps` od 0,5 m nad do 0,6 m pod helikopterjem, na koncu poti so drevesa 7–9 m nad njim. Štajerska: noben zadetek.
- Preverjeno: geometrija potrjena (simulacija preleta); vidnost verjetna: s kamere za avtom je helikopter takrat za kamero ali ob njej, videti ga je lahko s TV kamer v posnetku ali v foto načinu.

**S21 · Ljudje za ograjo stojijo z nogami pod dvignjenim pločnikom ali pasom** · `js/world-ljudje.js:1129` (`placeOf`)
- `placeOf` postavi noge na `F.y` oz. `o.groundH` (teren); svetovi zgradijo dvignjene pločnike in pasove, ki jih `groundH` ne pozna.
- **Primer:** Marrakesh, Maroko: pločnik `mr verge` je 0,27–0,31 m nad nogami redarjev (`marsali` @480), 0,37 m nad gasilcem (@80), 0,43–0,44 m nad fotografoma (@2320), podobno `marsali` @1560 in `delavci` @1424. Bathurst, Avstralija: 0,33 m nad nogami mehanikov (`boksi`, vidno iz pasu boksov). Crystal Palace, Anglija: 0,11–0,14 m. Montréal, Kanada: `marsali` @2520 v poševni zadnji strani `mtWalls`. S proge jih večinoma zakrije ograja.
- Preverjeno: potrjeno (žarki navzdol v brskalniku).

**S22 · Suzuka: 3 m pas razmazane množice čez glavni tribuni** · `js/world-suzuka.js:554`
- `u = s / 12` iz absolutnega `s = sAt(d)`; pri Suzuki je `T.startS` = 233,99 m, zato s = 0 pade v tribuni V1 (d −237…57) in V2 (−234…−51). Prav: u iz `d`.
- **Primer:** Suzuka, Japonska: povezani vrsti pri d = −234 (s = 5803,64, u = 483,637) in d = −231 (s = 2,99, u = 0,249): na 3 m u pade za 483 ponovitev slike (`STAND_FS`: ~15.500 sedežev), čez obe tribuni ob štartni ravnini je pas šuma. Toronto in Trois-Rivières imata isto vrstico, a njune tribune s = 0 ne prečkajo.
- Preverjeno: potrjeno (Node, vrednosti vrst).

**S23 · Trois-Rivières: daljni most ima ničelne normale** · `js/world-troisrivieres.js:661`, `:669`
- `quad` doda trikotnike v obeh smereh na ista štiri oglišča, `computeVertexNormals()` normali izniči. Prav: zadnje ploskve s svojimi oglišči ali `side: DoubleSide` z eno smerjo (kot `mtFar`).
- **Primer:** Trois-Rivières, Kanada: vsa oglišča mostu v `trFar` (krov, nosilci, stebri, lok) imajo normalo (0, 0, 0); v SwiftShaderju z lučema igre je ploskev 43,52,45 namesto 83,93,80 (pol svetlosti); na drugih GPU je lahko črna (`normalize(0)` je NaN).
- Preverjeno: potrjeno (three r128 v Node in SwiftShader).

**S5 · Sled gume na startni črti ima luknjo na Torontu in Trois-Rivièresu** · `js/world.js:3797`
- Zanka `for (k = 0; k <= N; k += st)` krog sklene samo, če je `N` večkratnik `st`.
- **Primer:** Toronto (`N` = 1463) in Trois-Rivières (`N` = 1225) imata razmik vzorcev ≤ 2 m, zato `st = Math.round(3 / ds)` = 2 in `k` se ustavi pri `N − 1`: obe sledi imata ~2 m luknjo med vzorcem `N − 1` in 0, tj. na startni črti. Korak se obrne že na drobnih razlikah `ds` (`Math.round(1.5)` = 2, `Math.round(1.4993)` = 1), zato ima večina dirkališč ločljivost sledi 2 m, ti dve 4 m.
- Preverjeno: potrjeno (sled kode s podatki prog).

**S6 · Marrakesh: prosojnost stavb pred koncem kroga** · `js/world.js:5262` (`view()`)
- Točka 20 m naprej je `T.idx(clamp(q.s + 20, 0, T.len − 0.01))`; na zaprtem krogu jo `clamp` ustavi na zadnjem vzorcu namesto ovijanja.
- **Primer:** Marrakesh, Maroko (zaprt krog 2956 m, `startS` 0, `hjCutMat` prek `mrBldMat`, `world-marrakesh.js:123`): zadnjih 20 m pred ciljem `uB` zdrsne nazaj na avto, pas prosojnosti se skrči na avto, stavba, ki zakrije cesto takoj za črto, ostane polna; ob prehodu črte pas skoči nazaj na 20 m. Vsak krog. Odprte ceste z istim rezom (Harju, Medvode, Ouninpohja, Pikes Peak) so v redu.
- Preverjeno: potrjeno (sled kode).

**S24 · Črte in asfalt križišč boksov po nazivni širini `T.w`, ne po resnični `T.wa`** · `js/world.js:1278` (+1285, 1292, 1296)
- `pitJunction` vzame `w = T.w` za `lo`, prekinjeno črto in zunanji rob pasu (`w + 0.1 + 7u`), ne `T.wa[i]` vzorca; Core (`_pave`, `pitLead`) prav tako, zato je pas za pospeševanje merjen od nazivnega roba, ne od narisanega.
- **Primer:** Toronto, Kanada (`w` 6,5, boksi levo): na izvozu (d 6,5…37 m) je `T.wa` = 7,0 m, črti pa sta pri 6,18–6,38 m, 0,6–0,8 m znotraj resničnega roba (Toronto riše cesto z `WA[i]`, `world-toronto.js:189`); na uvozu `wa` naraste s 6,0 na 6,94 m. Trois-Rivières, Kanada (`w` 5,75, `wa` 6,0): črta 0,4–0,6 m na asfaltu dirkališča. Ostale prave proge z boksi imajo na križiščih `wa` = `w`.
- Preverjeno: potrjeno (podatki prog; slike ni).

**S25 · Betonski zidovi dvorišč (`def.yard`, vrsta 3) brez kontaktne sence** · `js/world.js:4384` (`finish`)
- `finish()` kliče `aoWorld` pred `yardWorld`, zato zidov, ki jih ta doda pozneje, ne vidi (komentar pri `aoWorld` obljublja »every upright face«). Po `aoWorld` pridejo tudi `World.life`/`World.people` (ni preverjeno, ali imajo pokončne ploskve na tleh).
- **Primer:** ob vznožju zidov ni temnega pasu, ki ga imajo drugi zidovi in hiše: Spa, Belgija 386 m zidov, Suzuka, Japonska 63 m, Štajerska, Avstrija 61 m, Nürburg, Nemčija 37 m, Bathurst, Avstralija 30 m, Montréal, Kanada 9 m.
- Preverjeno: potrjeno (sled kode, dolžine iz podatkov prog).

**S26 · Sence oblakov na daljnem pogledu se premikajo z vožnjo, ne z vetrom** · `js/world.js:3665` (`clouds`)
- `clouds()` izpusti samo vodo in `userData.noCloud`; daljni pogledi, ki jih premika kamera (`irFarUpdate` jih potegne na lupino 183–244 m okoli kamere), `noCloud` nimajo (ima ga samo testni Mauna Kea), zato se šum vzorči na premaknjenih mestih.
- **Primer:** Irohazaka, Japonska (`irFar`): premik kamere za 30 m (1 s pri 108 km/h) spremeni senco v 27 % oglišč za več kot 0,03, veter v 1 s le za 0,004 (4,5 % oglišč): sence na daljnih gorah se prerazporedijo z vožnjo ~9× hitreje kot z vetrom, celica šuma pokrije ~30° obzorja (do −12 % svetlosti). Great Alpine Road, Avstralija (`gaFar`): 0,055 proti 0,008 (41 % oglišč); po kodi enako Bâlea, Romunija in Trois-Rivières, Kanada (`world-troisrivieres.js:670`).
- Preverjeno: potrjeno (brskalnik).

**S27 · Sence oblakov tudi ponoči, tudi čez svetleče ploskve** · `js/world.js:3671`, `js/render.js:3794`
- Jakost senc nastavi samo `applyWeather` (`k0 · (1 − r)`), čas dneva (`atmos.tod`) nanjo ne vpliva; `gl_FragColor.rgb *= vCloud` se izvede po `outgoingLight`, ki že vsebuje emisijo.
- **Primer:** katera koli prava proga, noč iz menija, suho: `dyn.clouds.K` ostane `k0` (0,2; Spa in Nürburg 0,22; Los Caracoles 0,15): temne lise 100–300 m (do −20 %) drsijo čez teren, cesto v žarometih in osvetljena okna.
- Preverjeno: potrjeno (sled kode).

**S28 · Nürburg: po kvalifikacijah stoji na mreži 100 avtov, štartnih polj je 21** · `js/world-nring.js:88`
- Graditelj bere `def.rivals` (20) namesto števila avtov dirke (`def.raceRivals || def.rivals`); komentar »a box for every car« ne drži.
- **Primer:** Nürburg, Nemčija, s kvalifikacijami, dirka po njih: `nAI = def.raceRivals` = 99 (`game.js:2271`), start s semaforjem z mreže; 100 avtov stoji na `9 + (g − 1)·7,5 m` (`core.js:5904–5908`, zadnji ~750 m za črto), svet nariše `nBox = max(14, def.rivals + 1)` = 21 polj: 79 avtov stoji brez polja. Navadna dirka (leteči start) in krog prvenstva (20 avtov) nista prizadeta.
- Preverjeno: potrjeno (sled kode).

**S29 · Pikes Peak: tabla vmesnih časov pokaže »1:60.00«** · `js/world-pikes.js:3972`
- Minute so iz `Math.floor(sp / 60)` pred zaokroževanjem, sekunde s `toFixed(2)`, ki 59,996 zaokroži na 60,00. Isti vzorec je v `js/menu.js:19`; v `js/game.js:403` s tremi decimalkami (okno 0,0005 s).
- **Primer:** Pikes Peak, ZDA, vmesni čas na CP s 119,996 s: tabla ob cesti `CP1 1:60.00`, HUD hkrati `1:59.996` (Node: f(119.996) = "1:60.00", f(59.999) = "0:60.00").
- Preverjeno: potrjeno (Node).

**S30 · »Mirni« gledalci na pravih progah še mahajo, navijajo in vihtijo zastave** · `js/world.js:4839`, `:4804`, izbira drž `:4898`
- `CR_CALM` postavi na nič samo `crHy`/`crEx` (skoki, navdušenje ob avtu); izbira drž in gibanje rok z `uTime` ostaneta. Komentar 4839 (»neither jump nor wave«) in `docs/igra.md:579` (»ne mahajo z zastavami«) trdita drugače. Uporabnik je vedenje sprejel (»kot jih je naredil #225«, `docs/ljudje-predlogi.md:13`), zato je to popravek opisa ali vprašanje za uporabnika, ne nujno kode.
- **Primer:** Spa, Belgija (`crowd2calm`): od 401 figur 60 drži zastavo, ki plapola, 33 maha, 23 navija z obema rokama; Ouninpohja, Finska: 117 + 87 + 99 od 971 (~31 %). Skakanja ni.
- Preverjeno: potrjeno (brskalnik).

**S31 · Prizor `tv` (navijači pred televizorjem) šteje za osebje** · `js/world-ljudje.js:1213`
- V `STAFF_SCENES` sta `tv` in `tvekipa`; `S.tv` (»Dirka na televiziji pod šotorom«) je skupina navijačev, ne TV ekipa.
- **Primer:** Nürburg, Nemčija, `tv` 4720 m desno in 16350 m levo: navijači tečejo k ograji (cheer, phoneUp, wave, jump), v dežju so brez dežnikov (`p.um` false); test razmika jih šteje za osebje (100 m namesto 250 m; zdaj brez posledic, sosednji prizori so več kot 800 m stran).
- Preverjeno: verjetno (ni preverjeno, ali je bil namen samo brez dežnikov pod šotorom).

**S7 · Daljna meglica se preračuna vsako sličico** · `js/world-iroha.js:135` (`irFarUpdate`); enako `js/world-troisrivieres.js:633`
- Preračun (en `Math.hypot`, dva `Math.exp` na vozlišče) in nalaganje ~75 KB (`position`, `aHz`) sproži premik kamere za 0,5 m, kar je pri 30 m/s in 60 sličicah/s vsaka sličica. Great Alpine Road isto funkcijo kliče šele po 3 m (`world-greatalpine.js:263`, njegov komentar pove, zakaj je 3 m varno; ista meja `R1 = cam.far − 6` velja tudi tu); Montréal (`mtFar`, 2 m) in Toronto (9 m) projicirata ob skoraj vsakem premiku.
- **Primer:** Irohazaka, Japonska: mreža daljne meglice ima 4.690 vozlišč: telefon vsako sličico plača delo za teren 2 km in dlje, ki se ne vidi. Enako Trois-Rivières, Kanada.
- Preverjeno: potrjeno (štetje vozlišč v brskalniku).

**S32 · Dim letal se računa vsako sličico do konca dirke, tudi nevidno** · `js/world-rbring.js:262`
- `tr.s` se izprazni samo ob `A.go` (`:244`) ali brez avta (`:237`); zanka ne preskoči sledi, katere zadnji vzorec je starejši od 22 s, ker se vidnost izračuna šele za zanko (`:275`).
- **Primer:** Štajerska, Avstrija in Bathurst, Avstralija (letala prek `rbAir`): `RB_JET` 70 m/s, dim od −420 do 420 m = 12 s po 0,1 s = ~120 vzorcev na sled; po preletu ostanejo sledi polne, `tr.m.visible` je po 22 s false, a zanka 3 × 120 vzorcev (`Math.hypot`, nova tabela `[0, 4]` na vzorec, `needsUpdate`) teče vso dirko: 17–112 µs na klic `rbAirStep`, s praznimi sledmi 0–4 µs (perf `jsMs` Štajerske je 1,49 ms na sličico).
- Preverjeno: potrjeno (brskalnik).

**S33 · Tribuna se ob vsaki pozi cela naloži na GPU, tudi ko se nihče ne premakne** · `js/world-ljudje.js:1289`
- `poseStand` sedečega z nespremenjenim `sig` preskoči (`:1247`), `poseScene` pa vedno nastavi `position/normal.needsUpdate = true` brez `updateRange`: three.js ob vsaki pozi (do 80 m, vsako sličico) znova naloži cela `Sc.pos` in `Sc.nor` (tribuna do 26.700 oglišč = 641 KB).
- **Primer:** krog s kamero za avtom (40 m/s, 30 sličic/s), povprečni prenos na sličico / od tega nespremenjeno: Bathurst, Avstralija 118 / 45 KB (največ 1896 KB v eni sličici, od tega 871 KB nespremenjenih); Nürburg, Nemčija največ 1512 KB (965 KB nespremenjenih); Spa, Belgija 72 / 26,5 KB (največ 649 KB, 626 nespremenjenih); Toronto, Kanada 240 / 65 KB; Marrakesh, Maroko 254 / 76 KB; Suzuka, Japonska 107 / 46 KB.
- Preverjeno: potrjeno (brskalnik).

**S34 · Medvode: maske gramoznih šivov se računajo znova ob vsaki gradnji** · `js/world.js:1181` (`gravelSeamMasks` 1093–1142)
- 256 × 512 pikslov, na piksel ~50 klicev `valueNoise2` in zanka po 4 tirnicah; maska je vsakič enaka (stalna semena, isti argumenti), predpomnilnika kot `edgeLineTile` (ključ `w, wr, back, fwd`) pa ni.
- **Primer:** Medvode, Slovenija (edina prava proga z `gravelSeams`, `world-medvode.js:758`): v Chromiumu 1,4–2,0 s od 20,6–21,3 s celotne gradnje (~7–10 %), v Node 2,0–2,4 s (`edgeLinePaint`, ki ga koda zaradi ~80 ms že hrani, 71 ms): na telefonu nekaj sekund več na zaslonu »Nalagam progo«.
- Preverjeno: potrjeno (Node in Chromium, obremenjen stroj).

**S35 · Montréal: mreža `MG` ostane v pomnilniku po menjavi proge** · `js/world-montreal.js:52`, `:103`
- `let MG` je spremenljivka modula brez `World.keep` in brez lastnosti na `API` (kot jo imata `TRW` in `SZ`, `:893`), zato je `World.build` (`world.js:1440`) ne sprosti.
- **Primer:** Montréal, Kanada, nato katera koli druga proga: `MG` (577 × 913 = 527 tisoč celic: wet, kind, H, SD, dT, ~7,4 MB) ostane do naslednje gradnje Montréala.
- Preverjeno: potrjeno (sled kode).

**S36 · Snežna tekstura ostane na GPU po zimi in menjavi proge** · `js/render.js:4340`, sprostitev `:3400–3402` (zunaj datotek sveta)
- `seasonWorld` hrani kopijo snega (`snowTex.clone()`, `render.js:4325`; v r128 ima vsaka kopija svojo GPU teksturo) v `m.userData.snowMap`, poleti vrne `m.map = U.map0`; `picsOf` ob menjavi proge gleda samo lastnosti materiala in `uniforms`, `userData` pa ne.
- **Primer:** Bathurst, Avstralija (Visoka), po ogrevanju 52 tekstur; zima 53 (107 mrež z enim `userData.snowMap`), poletje 53, Spa in nazaj Bathurst še vedno 53; drugi krog 54, pri Spa 53 → 54 → 55: vsak krog zima–poletje pusti eno teksturo 128 × 128 z mipmapami. Ročni `dispose()` števec vrne na 52. Kdor progo zamenja pozimi, ni prizadet.
- Preverjeno: potrjeno (brskalnik). Pregled jedra tega nima; soroden je J7 (viri ob menjavi sveta niso sproščeni).

**S37 · Tabela slepih krakov `STG` ostane od prejšnje proge** · `js/world-vrsic.js:1116`, `:152`, `js/world.js:1440`
- `STG` ni vpisan z `World.keep`, zato ga `World.build` ne izprazni; na novo ga nastavi samo `vrStubs()`, ki ga teme brez `vrPrep` (pikes, spa, dirkališča, ouni …) ne kličejo.
- **Primer:** Medvode, Slovenija (104 slepi kraki) → Pikes Peak, ZDA: `World.api.STG` še drži medvodsko tabelo (342 celic, 754 sklicev, nobeden iz `race.track.stubs`). Danes se ne pozna (`roadside`, `world.js:4227`, zahteva tudi `API.VR`, ta je null; vsi bralci `API.STG` prej pokličejo `vrPrep`/`vrStubs`); past za nov graditelj, ki bi bral `API.STG` brez `vrStubs()` (zravnal bi teren pod kraki prejšnje proge).
- Preverjeno: potrjeno (brskalnik).

**S8 · Material daljne meglice je kopiran v pet graditeljev** · `js/world-greatalpine.js:253`, `js/world-iroha.js:123`, `js/world-montreal.js:872`, `js/world-toronto.js:572`, `js/world-troisrivieres.js:671`
- Atribut `aHz`, mešanje barve megle `uHz` po ditheringu in `onBeforeRender`, ki kopira barvo megle, so napisani petkrat pod petimi ključi predpomnilnika; Toronto ima še svojo različico `irFarUpdate` (`skyUpdate`). Kopije so se že razšle (korak 0,5 m, 2 m, 3 m, 9 m; S7).
- **Primer:** vsak popravek megle (npr. po posodobitvi three.js) je treba ponoviti petkrat; `World.api` `irFarUpdate` že izvaža, en skupni material s korakom kot argumentom bi popravek nesel povsod.
- Preverjeno: potrjeno (sled kode).

**S9 · Ostanek spoja `js/world-rbring.js.orig`** · `js/world-rbring.js.orig:1`
- 1.496 vrstic (33 drugačnih od živega graditelja), v repozitoriju od 472bfeee (7. 11. 2026, spoj Grafike #318), nič ga ne naloži.
- **Primer:** grep za pomočnika Štajerske vrne dva zadetka; seja, ki popravi kopijo `.orig`, v igri ne spremeni ničesar in vsi testi ostanejo zeleni. Objava strani ga objavi (`tools/predogled.mjs` vzame drevo z `git archive`).
- Preverjeno: potrjeno.

## Obseg pregleda
- **Pregledano:** skupni deli `js/world.js` (pomočniki 1–1432, `build()` 1433–3612, oblaki, sledi, trava, table, helikopter, Nürburgov teren, gledalci, atlasi, `API`, `update`, `view` 3613–5272) in vse `js/world-*.js` pravih prog in skupnih gradnikov: `world-pikes.js`, `world-ljudje.js`, `world-ljudje2.js`, `world-ljudje3.js`, `world-rbring.js`, `world-medvode.js`, `world-harju.js`, `world-ouni.js`, `world-gore.js`, `world-zivali.js`, `world-zastave.js`, `world-zaslon.js`, `world-katu.js`, `world-montreal.js`, `world-toronto.js`, `world-troisrivieres.js`, `world-bangsaen.js`, `world-spa.js`, `world-suzuka.js`, `world-caracoles.js`, `world-marrakesh.js`, `world-prelaz.js` (Bâlea), `world-greatalpine.js`, `world-chapman.js`, `world-tianmen.js`, `world-rastro.js`, `world-nring.js`, `world-iroha.js`, `world-livorno.js`, `world-sani.js`, `world-cpalace.js`, `world-bathurst.js`, `world-mountbuller.js` ter skupni pomočniki gorskih cest v `world-vrsic.js` (`vrPrep`, `vrNear`, `vrGround`, `vrDist`, `vrDem`, `vrFar`, `vrStub*`, `vrTileGeo`, `stub*`). Poleg tega menjava proge in kakovosti (sprostitev starega sveta, stanje modulov med gradnjami).
- **Izvzeto** (zamrznjeno, `CLAUDE.md`, »Testne proge«): graditelji prog s `test: true` in njihove datoteke (Mount Baldy, Beartooth, Big Sur, Detroit, Mount Hotham, Longford, Mauna Kea, Moki Dugway, Monterey, Santa Monica Mountains, Newcastle, Palomar Mountain, Rio de Janeiro, Riverside, Townsville, Uncompahgre, Vršičev lastni graditelj v `world-vrsic.js`) ter teme Jezera (`lake`), Riviere (`city`), Gorskega relija (`mountain`), Monte Carla (`monaco`), Bakrenega gozda (`forest`), Toskane (`italia`) in Gromskega rta (`kamp`) v `js/world.js`. Za prave proge `build()` po razvejitvi na `World.ext.<tema>` konča v vrstici 1441; telo 1442–3609 teče samo za teme testnih prog.
- **Kako:** branje kode; gradnja vseh 27 pravih prog v Chromiumu brez glave pri vseh kakovostih (NaN/Infinity, napake strani); žarki navzdol in prečno na mestih stebrov, vrvi, ljudi in predmetov; vožnja kroga s kamero za avtom (prenosi na GPU, ms na sličico); zaporedne gradnje in menjave (Bathurst → Spa → Pikes Peak → Bathurst, Medvode → Pikes Peak → Mount Buller → Katu-Jaryk → Irohazaka → Bâlea, Bâlea → Spa, pri tier 2 in 0) s primerjavo mrež, oglišč, primerkov, `props` in števcev `renderer.info.memory`; posnetki kopice (CDP) in WeakRef za stare svetove; Node s Core za `pitAt`, vrste tribun in časovnike. Skripte so v začasni mapi seje (niso v repozitoriju).
- **Opaženo zunaj obsega** (datoteke, ki niso svet; vključeno, ker zadene gradnjo sveta ali progo v igri): S12 (`js/tracks/pikes.js`), S14 (`js/game.js`), S15 (`js/tracks/spa.js`), S29 (vzorec tudi v `js/menu.js:19`), S36 (`js/render.js`).

## Zavrnjeni kandidati
Preverjeno, ni napake (ali je zasnova):
- **Gradnja in menjava:** vse prave proge imajo `World.ext`; ponastavitev v `build()` (1434–1440) je za to pot popolna (`hillN`, `mtnN`, `MF`, `MC_TER` bere samo `groundH` testnih tem). Pri ponovni gradnji iste proge (po drugi progi, dvakrat zapored, pri tier 2 in 0) dajo enake mreže, oglišča, barve, matrike primerkov in `props`; globalni `let`, `KEEP` (VR, DT, HJ, KT, LFQ, MR, NC, OU, PK, SZ, TRW, NR), `SYNC` in atlasi (`irATex`, `saATex`, `nrATex`, `ktAtlas`, `stubAtlas` …) ne prenašajo stanja; Jezero, ki se zgradi ob zagonu, ne vpliva na poznejše svetove. Stari svetovi 14 preizkušenih prog se po menjavi sprostijo (WeakRef; izjema S38); GPU števci po menjavah ne rastejo (razen S36); preostala rast kopice +4 do +12 MB na progo (159,5 → 173,8 MB po 9 menjavah) je omejena, del je S35 in S37.
- **Ovijanje:** `crAt`, `crInBand`, `nrNear`, `tyreMarks`, `roadWear`, puščice boksov, zidovi Montréala in Spa, `sAt`/`T.pitAt` na Štajerski, Bathurstu in Crystal Palaceu so pravilni na zaprtem krogu in pri `startS` ≠ 0; na odprtih cestah je `clamp` (tudi v `view()`) pravilen; vse prave proge z boksi so zaprte in imajo `startS` 0 (Suzuka in Nürburg z `startS` 234/320 nimata boksov).
- **Predmeti na cesti:** podrtljivih predmetov na asfaltu ni na 18 pravih progah (`roadsideProps`); terena nad asfaltom ni na 7 gorskih cestah (10–40 tisoč točk na progo); stavbe čez cesto v Montréalu, Torontu, Trois-Rivièresu in Bang Saenu izloči mreža zasedenosti; nadstrešek cestninske postaje na Chapman's Peaku 5,79 m nad cesto je v redu; sedež sedežnice na Los Caracolesu je 3,8–9,2 m nad cesto; otoki krožišč v Medvodah so 0,30–0,34 m od proge.
- **Senčilniki:** vse zamenjave nizov (`clouds`, `tuftWindMat`, `crowdMat`, `crowdStands`, `aoWorld`, `PK_V`, `ouVegMat`) imajo cilje v three r128; renderer teče v `highp` (`render.js:3329`); ključi `customProgramCacheKey` vedno pomenijo isti popravek.
- **Pomočniki gorskih cest:** robovi `vrStubH`/`vrStubAt` (okvir že vsebuje polmer), `vrNear` na koncu odprte ceste, `VR`/`VRS` po Vršiču ali Irohazaki (vsaka gradnja nov `VR`), skupni `VRN` (bralci ga takoj preberejo), dvojni `vrStubs` (odvečno, poceni).
- **Napisi:** SUZUKA/JAPAN, TORONTO/ONTARIO/CANADA, MONTRÉAL · QUÉBEC, EAU ROUGE, MURTAL, SPIELBERG, STEIERMARK, TRANSFĂGĂRĂȘAN, LACUL BÂLEA, LAURO MÜLLER, TIANMEN, ZHANGJIAJIE, GLEN COVE, PIKES PEAK HIGHWAY so zemljepisni; SUMMIT OIL, ROCKY TYRES, VOLTWERK RACING, HITROLET, sponzorji Harjuja so izmišljeni; vozniki na zaslonih so iz izmišljenih `Core.DRIVER_NAMES`; imena ulic po osebah v Medvodah se ne rišejo (`world-medvode.js:866`); imena ovinkov na Suzuki so nevtralna (Casio, Dunlop, Degner samo v komentarjih). Odločitev za uporabnika: priimek ROSSI na zaslonu Spa je splošen, a lahko spominja na resničnega dirkača.
- **Gledalci in ljudje:** gledalci na pravih progah ne skačejo (`CR_CALM`, `crEx` = 0; mahanje je S30); navijači v prizorih, ki jih svetovi postavijo posebej, so izbira uporabnika (`docs/ljudje-predlogi.md:13`); ljudje na asfaltu ali znotraj ograje drugod niso (27 prog, razen S13 in S17); A* v prizorih je omejen na 5000 korakov.
- **Kamere:** `view()` z `distanceTo(C) < 8` reza za Harju pri kameri za avtom ne izklopi (kamera je 30–46 m × zoom od avta); `d.fade` na Štajerski računa tudi za izbrisane kamere, a je poceni in služi TV kameram.
- **Obremenitev:** Ouninpohja brez `farClip` nariše le 0–4 klice več; 4366 mrež terena Ouninpohje ima `matrixAutoUpdate = false`; Harju, Medvode, Ouninpohja, Livorno in Pikes Peak ne berejo `opts.tier`, a so v proračunu (`tests/golden/perf.json`); `moveSkiers` (102 smučarja) in `szWheel` (32 primerkov) sta poceni; `moveBirds` nima pravega uporabnika (Mount Buller ima `animals: []`).
- **Mrtva koda (čiščenje, ni napaka):** `carParkMat` (`world.js:342`) se ne kliče; komentar v `world-katu.js:282` o predpomnjenem atlasu je zastarel; varovalo oblakov v `world-tianmen.js:609` ne naredi ničesar (oblaki so ≥ 90 m od ceste).
