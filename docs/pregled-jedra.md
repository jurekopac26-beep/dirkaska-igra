# Pregled jedra igre (`js/core.js`, `js/render.js`)

Pregled kode jedra igre, samo branje (odločitev uporabnika 8. 11. 2026 ob 16.05 in 17.40, tabla #382, Matejev komentar 6724187167; račun biketraveler). Poziv: `/code-review max js/core.js js/render.js` na svežem `main` (90e09dac). Ena tema s Pregledom sveta (`docs/pregled-sveta.md`), skupni osnutek PR na veji `pregled/jedro-in-svet`.

**Popravkov tu ni**: dokument samo našteje preverjene napake; popravke razvrsti tedenski načrt. Testne proge so zamrznjene (`CLAUDE.md`), zato napake, ki se pokažejo samo na njih, niso v seznamu.

## Stanje
- 8. 11. 2026 ob 18.15: začetek pregleda.
- 18.30: prvi prehod (`/code-review max`, ena seja brez več agentov) je prebral razred `Race`, trke, AI, promet ter v `js/render.js` pogled avtov, varnostni avto, razbitine, popravilo v boksih, kamero boksov in ogenj: dve najdbi (J1, J2), obe preverjeni. Za neprebrane dele (proga, fizika avta, poškodbe, policija, svet v izrisu, kamera, učinki) teče 9 vzporednih pregledov.
- 19.06: **pregled končan.** 29 najdb: 0 kritičnih, 2 hudi, 8 srednjih, 19 nizkih; 24 potrjenih, 5 verjetnih. Oznake J so po vrstnem redu odkritja in se ne spreminjajo; razvrstitev po resnosti je v povzetku in v razdelkih spodaj. Obseg in zavrnjeni kandidati sta na koncu.
- 10. 11. 2026: J4 odpadlo (#548: prvo odpadlo kolo konča igro), glej J4.

## Povzetek

| Oznaka | Resnost | Kaj | Kje | Preverjeno |
|---|---|---|---|---|
| J14 | huda | AI ne vidi avta, ki ga prehiteva za krog | `js/core.js:3748` | potrjeno |
| J23 | huda | Zastave ne vidijo ustavljenega tekmeca, ki je namenjen v bokse | `js/core.js:6417` | potrjeno |
| J1 | srednja | Leteči štart: vodilni brez časov TV sektorjev | `js/core.js:6901` | potrjeno |
| J3 | srednja | »Ne menjaj« gume vseeno da nove gume | `js/core.js:6352` | potrjeno |
| J4 | srednja | Pravilo koles: drugo kolo ne odpade nikoli | `js/core.js:2797` | potrjeno; **odpadlo** z #548 (10. 11.) |
| J10 | srednja | Policijski način: megla NaN v posnetku aretacije | `js/render.js:9688` | potrjeno |
| J15 | srednja | Motor odpelje brez voznika | `js/core.js:4269` | potrjeno |
| J19 | srednja | Table ob progi postanejo »duhovi« | `js/core.js:3193` | potrjeno |
| J20 | srednja | Nova mapa: razbitine trčijo v ograje stare ceste | `js/core.js:3014` | potrjeno |
| J24 | srednja | Prehitevanje pod zastavo: kazen samo za prvega | `js/core.js:6474` | potrjeno |
| J21 | nizka | Razbitine v boksih skočijo na progo | `js/core.js:3014` | potrjeno |
| J22 | nizka | Varnostni avto se lahko prevrne ali zavrti | `js/core.js:2066` | verjetno |
| J16 | nizka | Človek na postaji hodi na mestu | `js/core.js:4484` | potrjeno |
| J17 | nizka | Razbitine v nagnjenem ovinku lebdijo | `js/core.js:605` | potrjeno |
| J18 | nizka | Skrita napaka: proga z boksi in `startS ≠ 0` | `js/core.js:1314` | potrjeno |
| J11 | nizka | Pikes Peak: helikopter po premiku časa | `js/render.js:9657` | potrjeno |
| J12 | nizka | Tresenje kamere v pavzi ne pojenja | `js/render.js:9685` | potrjeno |
| J13 | nizka | Avto na strehi v ustavljenem posnetku meče prah | `js/render.js:8245` | potrjeno |
| J2 | nizka | Varnostni avto: ustavljena krog narazen se ne štejeta | `js/core.js:6437` | potrjeno |
| J5 | nizka | Nova: zdrs telesa se izbriše ob LOD | `js/core.js:2458` | verjetno |
| J6 | nizka | Pikes Peak: polmer senc po nastavitvah | `js/render.js:4037` | potrjeno |
| J7 | nizka | Luči ob progi: materiali niso sproščeni | `js/render.js:4375` | verjetno |
| J9 | nizka | Garaža: predpomnilnik koles raste | `js/render.js:2161` | potrjeno |
| J8 | nizka | Odblesk sonca ugaša po sličicah | `js/render.js:4176` | potrjeno |
| J25 | nizka | Prehitevanje pod zastavo tik pred ciljem brez kazni | `js/core.js:6468` | potrjeno |
| J26 | nizka | Nasvet po radiu: napačna guma tekmeca | `js/core.js:6688` | potrjeno |
| J27 | nizka | `?vreme=constructor` gre skozi preverjanje | `js/core.js:7403` | potrjeno |
| J28 | nizka | Cesta: vrstni red na cilju pri velikem polju | `js/core.js:6947` | verjetno |
| J29 | nizka | Dim gorečega avta zunaj pogleda utihne | `js/render.js:6737` | verjetno |

## Najdbe po resnosti
Vsaka najdba ima datoteko in vrstico (na `main` 90e09dac), opis in konkreten primer, ki jo sproži. Preverjeno: **potrjeno** (sled od vhoda do napake ali simulacija) ali **verjetno** (branje kode brez ponovitve).

### Kritične
Ni najdb: nobena od najdb ne ustavi igre na pravi progi, ne izgubi shranjenega napredka in ne odpre varnostne luknje.

### Hude

**J14 · AI ne vidi avta, ki ga prehiteva za krog, in se vanj zaleti s polno hitrostjo** · `js/core.js:3748` (`aiDrive`, izbira nevarnosti), enako `js/core.js:3691` (`aiLaneBusy`)
- Nevarnost in avte ob sebi AI izbira po `gap = o.dist - c.dist`, kjer je `dist` celotna razdalja dirke. Na krožni progi je avto krog narazen, ki je fizično tik pred njim ali ob njem (počasen, poškodovan, ustavljen, prehitevan za krog), izven okna `gap < -8 || gap > 22` in zato ni nevarnost: AI ostane na idealni liniji in se zaleti. Mesto na progi (ovito na dolžino kroga) upošteva samo, ko sta oba avta v boksih (3749). Modrih zastav ali drugega ravnanja z zaostalimi ni nikjer.
- **Primer:** `rbring`, 7 tekmecev, 3 krogi, ponovljiva dirka (seme 9), brez poškodb: igralec se po 30 s ustavi na idealni liniji (s ≈ 1236 m). Nobeden od 7 tekmecev, ki ga nato prehitevajo za krog, ga niti v enem koraku ne vzame za nevarnost (od 100 do 2.216 korakov manj kot 22 m za njim), štirje se zaletijo vanj. Tekmec v istem krogu ga je imel za nevarnost v 453 od 535 korakov. Enako vsak počasen ali poškodovan avto, ki ga prehitevajo za krog (npr. začetnik na `toronto`, `troisrivieres`, `marrakesh`).
- Preverjeno: potrjeno (simulacija).

**J23 · Zastave ne vidijo ustavljenega tekmeca, ki je namenjen v bokse: brez rumene zastave, nato nalet več avtov in rdeča zastava** · `js/core.js:6417` (`Race._flags`), vzrok v `js/core.js:6238–6243` (AI se po poškodbi odloči za bokse)
- Avto šteje za ustavljenega samo, če je `onTrack`, ta pa brez rdeče zastave zahteva `!c.pitWant`. Tekmec s poškodbo nad ~0,45 (`AI_FIX.dmg`; privzete poškodbe, `dmgMode = 2`) dobi `pitWant` takoj po trku, še daleč pred uvozom v bokse. Če nato obstane na cesti (po vrtenju, ob ograji, zagozden), mu `f.stopT` ostane 0: ni rumene zastave in ni varnostnega avta, dokler se vanj ne zaletijo drugi.
- **Primer:** `toronto`, 12 tekmecev, 8 krogov, zastave, seme 9: po 60 s tekmec dobi poškodbo 1,0 in 4 s stoji na idealni liniji (s ≈ 1945 m). Želja po boksih je vklopljena, `stopT` 0,00, zastav ni. Po 6,5 s se vanj zaletijo prvi tekmeci: 7 rumenih zastav, varnostni avto pri 68,4 s, rdeča zastava pri 69,8 s (dirka spet steče šele pri ~230 s). Kontrolni tek, isti avto brez želje po boksih: rumena pri 62,3 s, varnostni avto pri 63,8 s, brez naleta.
- Preverjeno: potrjeno (simulacija, oba teka ponovljena).

### Srednje

**J1 · Leteči štart: vodilni avti kolone vso dirko brez časov TV sektorjev** · `js/core.js:6901` (`Race._sectors`), vzrok v `js/core.js:5991–5993` (`Race._flyColumn`)
- `_sectors` zapre sektor samo, če avto prečka njegovo črto v enem koraku (`d1 - ds >= at` → `return`), in nima zanke za dohitevanje. `_flyColumn` avtom, ki so ob štartu že čez črto, nastavi `lap`, `lapStart` in dohiti kontrolne točke (`c.cp`, `splits`), `secN` pa ostane 0: avto, ki začne za koncem 1. sektorja, čaka na črto 1. sektorja 1. kroga, ki je ne prečka nikoli več.
- **Primer:** Trois-Rivières (`troisrivieres`, S1 = 700 m), v meniju Opponents 40 tekmecev (več kot 21 da leteči štart tudi na krožni progi, `js/game.js:2266`). Simulacija v Node (2 kroga): 5 vodilnih avtov (štart 720–836 m za črto) ima na cilju `secN = 0`. `race.secBest` je samo iz ostalih, zato je igralčev sektor lahko vijoličen (»najboljši v dirki«), čeprav so bili vodilni hitrejši, in komentator reče `secPurple` (`js/game.js:4142`). Enako na drugih krožnih progah s sektorji, kjer kolona seže čez S1 (`marrakesh` 940 m, `toronto` 1000 m, `cpalace` 1150 m, `rbring` 1400 m). `_thirds` (proge brez TV sektorjev) ima zanko in te napake nima.
- Preverjeno: potrjeno (simulacija).

**J3 · Postanek »Ne menjaj« (gume ostanejo) vseeno da štiri nove gume** · `js/core.js:6352` (`Race.pitStep`)
- `keep = keepTyres(c, pl)` varuje samo komplet `c.ty` (`if (c.ty && !keep)`), `if (c.kt) ktNew(c, true)` pa teče vedno. Gume KOLIBRIJA (`Car.kt`) ima vsak igralčev avto (`js/game.js:4835–4836`: `TYRE_RULE` = vsi modeli), `ktWear` nato zapiše `ty.wear` kot povprečje novih gum.
- **Primer:** dirka brez spleta z obrabo gum (npr. `spa`), POSTANEK PO MERI → Gume: Ne menjaj. Simulacija v Node: gume pred postankom obrabljene 0,7–0,85, postanek 2,6 s brez menjave gum (`ty: 0`), po njem `kt.w = 0` na vseh štirih in 3 s pozneje `ty.wear = 0,001`, oprijem 1,0; `ty.n` ostane enak. Igralec prihrani menjavo gum in dobi nove; HUD pokaže nove gume, sporočilo pa, da so gume ostale.
- Preverjeno: potrjeno (simulacija).

**J4 · Pravilo koles: rahel dotik v zadnjih ~0,8 s odšteva drugo kolo pod nič, kolo ne odpade nikoli** · `js/core.js:2797` (`ktHit`), `js/core.js:7084` (`Race._wreckStep`)
- Ko gori guma in prvo kolo odpade, teče odštevanje do drugega (`Q.due`). Rahel dotik (`amt < KT.real`) odšteje do 0,8 s brez preverjanja, ali je `Q.due` padel pod 0. `_wreckStep` drugo kolo spusti samo, dokler je `Q.due > 0`, zato se to ne zgodi nikoli; preskočeno je tudi varovalo »nikoli prej kot v 1 s« (`Q.t1`). Kasnejši pravi trki ga ne spustijo (prva veja `ktHit` zahteva `due > 0`, druga `nL == 0`).
- **Primer:** dirka s poškodbami, avto s kolesi kot deli (npr. `kolibri` na `spa`): kolo z gorečo gumo odpade (`nL = 1`, `due = 4`), v zadnjih 0,8 s odštevanja se avto rahlo dotakne ograje. Simulacija v Node: `due` 0,25 → −0,15, 20 s pozneje še vedno `nL = 1`, `ask = 1`, brez KONEC IGRE, hitrost 35,8 m/s: avto vozi naprej s tremi kolesi do popravila, gumb ZAMENJAJ KOLO izgine (zahteva `due > 0`).
- Preverjeno: potrjeno (simulacija).
- **Odpadlo** (10. 11. 2026): z #548 (zbirna veja B, #579, `main` 2286d82e; odločitve uporabnika 9. 11. 2026: brez menjave kolesa) prvo odpadlo kolo konča igro, drugega kolesa in odštevanja `Q.due` ni več. Popravek iz #527 je ob spoju z zbirno vejo A (#583) izpadel (`docs/vrsta.md`, Usklajevanje, točka 12; Matejev komentar 6754361818).

**J10 · Policijski način: megla postane NaN v posnetku aretacije** · `js/render.js:9688` (kamera, megla posnetka)
- `dC = shot ? shot.fogD : …` nima privzete vrednosti (za razliko od `near`), `setShot` (9916) pa je ne doda. `bustShot` in `chkShot` (`js/game.js:3682–3693`) podata samo položaj, `fov`, `floor` in `near`, brez `fogD`, zato sta `scene.fog.near` in `scene.fog.far` NaN, dokler posnetek traja; vsi drugi klici `setShot` (foto način, prelet, cilj, misije) `fogD` podajo. Izid je odvisen od grafične kartice: megle ni in daljna ravnina reže ostro, ali pa so zamegljene točke črne.
- **Primer:** policijski način na pravi progi, ki ga ima (npr. `balea`, `medvode`, `greatalpine`, `tianmen`): policija igralca ujame (ULOVLJEN, `bustShot`) ali ga aretira na kontrolni točki (`chkShot`). Posnetek traja 4,2 s zaključne faze in ostane za zaslonom z rezultati.
- Preverjeno: potrjeno (branje kode; videz na posamezni kartici ni preverjen).

**J15 · Promet: motor, s katerega je padel voznik, odpelje brez voznika** · `js/core.js:4269` (`Traffic._loose`)
- Vozilo, ki po trku 6 s stoji obrnjeno vzdolž ceste, `_loose` vrne v vožnjo; pogoj izvzame samo kolesa (`kind !== 4`) in razbitine policijskega načina (`v.wreck`), ne motorja, s katerega je `_throwRider` vrgel voznika (`v.rider`). Izris (`js/render.js:6440`) na enosledni vozilo z `v.rider` voznika ne nariše, voznik pa ostane ob cesti (`stand2`), dokler motor ne izgine na koncu ceste.
- **Primer:** `balea`, dvoboj v prometu, seme 11: igralec od zadaj zadene motor pri 4–10 m/s razlike. V 3 od 9 trkov motor ~8,8 s pozneje vozi z 11 m/s brez voznika, voznik pa stoji ~150 m za njim. Enako na vseh pravih progah s prometom, kjer so motorji (npr. `chapman`, `greatalpine`, `iroha`, `rastro`, `medvode`).
- Preverjeno: potrjeno (simulacija).

**J19 · Table in znaki ob progi po rahlem dotiku postanejo »duhovi«: avti gredo skozi njih do konca dirke** · `js/core.js:3193` (`propCarHit`)
- Varovalo »en udarec« preskoči vsak dotik avta, dokler je `b.hit1 && b.age < 0.6`. `b.age` raste samo v `propStep` (3240), ta pa za predmet, ki miruje (`b.sleep`, 3286: po 0,35 s mirovanja), ne teče več (6091). Predmet, ki se po udarcu umiri v manj kot 0,6 s, ostane z `age < 0.6` za vedno; `hit1` nič ne ponastavi.
- **Primer:** avto se table ali znaka (vrste z `K.dmg`: `bboard`, `dpost`, `rssign`, `rschev`, `rsboard`; ulična oprema na `montreal`, `toronto`, `marrakesh`, `bangsaen`) dotakne s 0,5–3 m/s, npr. ob vrnitvi na cesto po vrtenju. Simulacija v Node na `spa`: tabla za zaviranje po udarcu z 1/2/3 m/s zaspi pri `age` 0,41/0,51/0,53 s; avto, ki nato pelje skozi z 25 m/s 0,05 m od nje, jo premakne za 0,000 m. Oplazenje z 20 m/s je v redu (predmet še leti, ko `age` preseže 0,6).
- Preverjeno: potrjeno (simulacija).

**J20 · Nova mapa (Toskana, NEW VERSION · TEST 1): razbitine in predmeti trčijo v ograje stare ceste** · `js/core.js:3014` (`stepDebris`), `js/core.js:3254–3255` (`propStep`)
- Na prosti mapi (`track.free`) `wallCollide` ograj ceste ne upošteva (3294–3305, samo rob mape in stene predora `wall2`), `stepDebris` (`T.wall`) in `propStep` (`q.br`/`q.bl`) pa jih. Kos ali predmet daleč od stare ceste Toskane se v enem koraku premakne na črto njene ograje, desetine metrov od trka. `stepDebris` vzame tudi višino tal stare ceste (`T.yAt`, 3013) namesto `track.ground2`. Skupna koda: nova mapa na Toskani mora delovati do izbrisa testnih prog (`CLAUDE.md`).
- **Primer:** nova mapa s privzetimi poškodbami (1), trk v steno predora z ~15 m/s ali več daleč od stare ceste, odpade del (najprej ogledalo). Simulacija v Node (`toskana`, `T.free` kot v `js/game.js:2392`, avto 40 m od stare ceste): pokrov motorja in stožec v enem koraku skočita 30,6 m, na `q.d` ≈ 9,4–9,5 (stara ograja).
- Preverjeno: potrjeno (simulacija).

**J24 · Prehitevanje pod zastavo: kazen se šteje samo za prvega prehitenega avta** · `js/core.js:6474` (`Race._flags`, igralec)
- Nov dolg (`f.owe`) nastane samo, ko drugega ni (`!f.owe`), `f.ah.set(o, ahead)` pa stanje »pred/za« posodobi za vse avte. Drugi in naslednji avti, prehiteni v istih 10 s, so odtlej zapisani kot »za igralcem« in pozneje ne sprožijo ničesar.
- **Primer:** dirka z zastavami, varnostni avto ali rumena zastava (`_noPass`): igralec v 10 s prehiti tri avte. Dolg je samo za prvega: igralec vrne eno mesto (ali dobi +5 s) in obdrži dve.
- Preverjeno: potrjeno (branje kode in simulacija pregleda).

### Nizke

**J21 · Razbitine v boksih skočijo čez steno boksov na progo** · `js/core.js:3014` (`stepDebris`, `Track.wall`)
- `Track.wall` pozna samo ograje dirkalne proge (`q.bl`/`q.br`); pas boksov leži za `q.br` (sredina pri `br + 5` ali več, stena pri `br + 0,25`), zato se vsak kos v pasu premakne na stran proge.
- **Primer:** redko: avto doseže prag razbitja (`dmg ≥ 0,96`, `wreckCheck`) tik pred uvozom v bokse; `applyDamage` v pasu ne teče (`c.pitG`), `_wreckStep` (7078) pa dele odmetava naprej vsakih 0,4 s. Simulacija v Node: kos v pasu na `spa` se premakne z `q.d` 15,7 na 10,3 (stena pri 10,95), na `bathurst` z −15 na −8,42: na travo na strani proge.
- Preverjeno: potrjeno (simulacija).

**J22 · Varnostni avto se lahko prevrne ali zavrti od učinkov Razbijanja** · `js/core.js:2066` (`xRollStart`), `js/core.js:3550–3555` (`carKnockFx`, `XR.bump`)
- `kTake` (3503) varnostnemu avtu namenoma ne vzame oprijema (»no marshals, no reverse for it«), `xRollStart` (klicana iz `carKnockFx` in `wallCollide` 3365) in izguba oprijema `XR.bump` pa `c.sc` ne preverita.
- **Primer:** dirka brez spleta z vklopljenim prevračanjem ali sunki Razbijanja (`xRoll`, `xBump`, privzeto izklopljena), varnostni avto na progi: bočni trk vanj nad 9 m/s ga prevrne; pri različici trkov Stara dotik nad 4 m/s dvigne `xgl` do 0,9 in ga lahko zavrti. Prevrnjen avto je po 1,2–2 s spet na kolesih, varnostni avto pa nima logike za vrnitev.
- Preverjeno: verjetno (branje kode).

**J16 · Človek na avtobusni postaji po preplahu hodi na mestu brez konca** · `js/core.js:4484` (`Traffic`, ljudje: stanje `back`/`limp`)
- Ko se prestrašen ali podrt človek vrne na svoj pas, vedno preide v `walk`. Na postaji je njegov odsek dolg nič (`p.a0 = p.a1`, 4050), zato `walk` (4452–4453) v vsakem koraku omeji `s` in obrne smer: človek hodi na mestu s hitrostjo hoje in se obrne za 180° vsakih 1/120 s. `_home` (4528) ta primer reši pravilno (vrne `stop`), a človeka v `walk` nihče ne pošlje tja.
- **Primer:** `medvode` (edina prava proga z avtobusnimi postajami), promet ali policija, seme 11: igralec pripelje proti človeku na postaji (s ≈ 401 m) z 12 m/s in se ustavi 60 m naprej. Po 15,8 s je človek v `walk` in v naslednjih 14,2 s naredi 1.701 obratov za 180°, `s` ostane 401,22.
- Preverjeno: potrjeno (simulacija).

**J17 · Razbitine v nagnjenem ovinku lebdijo nad cesto ali so pod njo** · `js/core.js:605` (`Track.yAt`), `js/core.js:3013` (`stepDebris`)
- `yAt(q)` vrne višino sredine ceste (`elevAt(q.s).y`) brez nagiba (`bankAt`). Avti nagib prištejejo (`roadY`, 2214, 2453), predmeti ob progi imajo `race.propFloor` z nagibom, razbitine pa ne.
- **Primer:** `nring` (edina prava proga z `def.bank`), razbitine v velikem nagnjenem ovinku (11.962–12.108 m, nagib 0,28) ali malem (16.868–16.954 m): kos 5 m na notranji strani lebdi ~1,4 m nad asfaltom, kos 5 m na zunanji strani je ~1,4 m pod njim in se ne vidi (do 1,54 m pri 8 m od sredine). Meritev v Node: `yAt` 258,31 m, cesta za avte 256,91 m (−5 m) in 259,70 m (+5 m).
- Preverjeno: potrjeno (meritev v Node).

**J18 · Skrita napaka za nove proge: proga z boksi, ki se ne začne v prvi točki, se lahko ob nalaganju zlomi** · `js/core.js:1314–1315` (`Track.pitJ`), `js/core.js:1293` (`Track.pitAt`)
- Zanki `ga` in `gb` kličeta `this.pitAt(S0 + gb).gap` brez preverjanja `null`. `pitAt` razdaljo od štartne črte izračuna znova (`d = s - startS`, nato `((d % L) + L) % L`), zaokroževanje pa lahko `d` potisne tik čez `P[2]`: `pitAt` vrne `null` in `.gap` vrže TypeError. `pitJ` kličejo `surface()`, `wallCollide`, `pitLead` in table za zaviranje, zato proge ni mogoče voziti. `crewBoxes` in `bayPose` `null` preverita.
- **Primer:** krožna proga z `def.pit`, katere štartna črta ni v `points[0]` (`startS ≠ 0`). Ponovljeno v Node s `cpalace`, štart premaknjen na točko 961 (`startS` 1.922,32 m): `d` = 130,00000000000045 > `P[2]` = 130. Na `cpalace` ima to napako 17 od 3.214 preizkusov (vsako mesto štarta, oba konca boksov). Danes nobena prava proga s boksi nima `startS ≠ 0`; nove proge za 1.0 v odprtih PR niso preverjene. Napaka se pokaže ob nalaganju, zato bi jo testi ujeli pred objavo.
- Preverjeno: potrjeno (simulacija s premaknjenim štartom).

**J11 · Posnetek na Pikes Peaku: helikopter po premiku časa gleda proti staremu mestu** · `js/render.js:9657` (TV kamere Pikes Peaka, `pkTv`), `js/render.js:9912` (`resetCam`)
- Pogled se poravna samo, ko se ključ kadra spremeni (`cam.tvK !== o.key`), helikopter pa ima ključ vedno −1 (9833). `resetCam` `cam.tvK` ne počisti, zato se po skoku v posnetku helikopter premakne (`st.init = false`), točka pogleda (`cam.tx/tz`) pa se z mehčanjem `1 − e^(−9·dt)` pomika s starega mesta, lahko kilometre stran; `fov` je izračunan za napačno razdaljo (do 3°) in avta ~0,3–0,5 s ni v kadru.
- **Primer:** posnetek na `pikes` ali `pikesg` s TV kamero, ko je v kadru helikopter: premik po časovnem traku, znova od začetka, prejšnji/naslednji krog ali preklop s kamere za avtom nazaj na TV po daljšem odseku.
- Preverjeno: potrjeno (branje kode).

**J12 · Tresenje kamere v pavzi in foto načinu ne pojenja** · `js/render.js:9685`
- `cam.shake` pojema samo za `dt * 3`, vsaka sličica pa doda nov naključni odmik do ±0,6 m. V pavzi in pri izrisu z `dt = 0` (`js/game.js:6309`, `snapshot()`) pojemanja ni, zato pogled trese brez konca, tudi v foto načinu (blok teče tudi pod `setShot`), in shranjena fotografija je posneta s stresenega mesta. `resetCam` in `setShot` tresenja ne ponastavita.
- **Primer:** Nastavitve → tresenje kamere ob trku vklopljeno (privzeto izklopljeno), trk (`Render.shake(…, 'hit')`) in v ~0,4 s pavza ali foto način.
- Preverjeno: potrjeno (branje kode).

**J13 · Avto na strehi v ustavljenem posnetku še naprej meče prah in iskre** · `js/render.js:8245` (`xRollPose`)
- Prah (3 delci) in iskre (4) ob drgnjenju strehe gredo ven ob vsaki izrisani sličici; edini pogoj je `dt > 0`, brez `opt.noFx` (ki ga imajo vsi drugi oddajniki, npr. 6719, 6727, 9115) in brez množenja z `dt`. Posnetek kliče `Render.frame(dt, …, { noFx: true, rdt: 0 })` s pravim `dt` tudi, ko stoji (`js/game.js:1247`), in `rpPose` drži avto obrnjenega (`c.rl`).
- **Primer:** Nastavitve → prevračanje (`xRoll`, privzeto izklopljeno), avto se prevrne na streho; v posnetku ustavi na tem trenutku: prah in iskre letijo brez konca. V počasnem posnetku jih je večkrat več kot v živo, v živo pri 120 Hz dvakrat več kot pri 60 Hz.
- Preverjeno: potrjeno (branje kode).

**J2 · Varnostni avto: avta, ustavljena skupaj, se ne štejeta, če sta krog narazen** · `js/core.js:6437` (`Race._flags`)
- `heavy` primerja razdaljo dirke (`Math.abs(o.dist - c.dist) < 60`), ne mesta na progi; rdeča zastava v isti funkciji (`js/core.js:6431`) primerja mesto (`o.q.s - c.q.s`, ovito na dolžino kroga).
- **Primer:** vodilni trči v zaostalega, ki ga prehiteva za krog; oba stojita drug ob drugem 2,5–6 s z `dmg` ≤ 0,5 in nato odpeljeta: pride samo rumena zastava. Enak trk dveh avtov v istem krogu po 2,5 s pripelje varnostni avto.
- Preverjeno: potrjeno (branje kode).

**J5 · Fizika Nova: zdrs telesa se ob velikem polju po naključju izbriše** · `js/core.js:2458` (`Car._nova`), `js/core.js:6784` (`Race._lodPair`)
- `if (this.nvH !== this.h) this.nvA = 0` primerja smer s točnim enačajem. `_lodPair` smer začasno premakne in vrne (`c.h += oh; pair(); c.h -= oh`), kar v plavajoči vejici ne vrne vedno iste številke (pri meritvi ~0,9 % parov). Naslednji korak to vzame kot »smer postavljena od zunaj« in zdrs `nvA` (do ~0,45 rad) izbriše sredi ovinka: sunek kota zdrsa.
- **Primer:** Nastavitve → Fizika vožnje: Nova, več kot 29 tekmecev (nivo podrobnosti fizike, npr. `nring`): oddaljeni tekmeci (več kot 60 m od igralca) v gruči med svojimi koraki LOD.
- Preverjeno: verjetno (merjena samo napaka zaokroževanja, ne dirka).

**J6 · Pikes Peak: mehkejše sence se po spremembi nastavitev ne vrnejo** · `js/render.js:4037` (`pkLight`), `js/render.js:3696` (`applySettings`)
- `pkLight` nastavi polmer senc 2,5 (kakovost, ki ni »high«) samo, ko se stanje Pikes vklopi (`on !== pkL.on`); `applySettings` polmer vedno postavi na `SOFT_SHADOW.normal` (1,6). Po vsakem `applySettings` med obiskom Pikes Peaka ostanejo sence trše do odhoda s proge.
- **Primer:** `pikes` ali `pikesg`, kakovost »normal«, sence vklopljene: samodejna obremenitev (`adaptBreak`, `js/game.js:6341–6343`) sence ob pavzi izklopi in pozneje spet vklopi, ali igralec v pavzi preklopi sence → polmer 1,6 namesto 2,5.
- Preverjeno: potrjeno (branje kode).

**J7 · Luči ob progi in podrti predmeti: materiali in medpomnilniki ob menjavi sveta niso sproščeni** · `js/render.js:4375` (`floodlights`), `js/render.js:3592` (`clearPropMeshes`) in `js/render.js:3639` (`setupProps`)
- Ob ponovni gradnji se sprosti samo geometrija: trije materiali luči (bazeni svetlobe, drogovi, glave) se ob vsakem klicu naredijo na novo in se ne sprostijo, `InstancedMesh.dispose()` pa se ne kliče ne za luči ne za predmete ob progi, zato medpomnilnika `instanceMatrix` in `instanceColor` v grafični kartici sprosti šele zbiralnik smeti. `setupCrew` (`js/render.js:5500`) enake predmete sprosti izrecno.
- **Primer:** dirke ob mraku ali ponoči (npr. `spa` ali `bathurst`, čas dneva noč), vsaka nova gradnja sveta in vsak preklop časa dneva (`todLights(true)`); menjava prog s podrtimi predmeti (`bathurst` → `spa` → `bathurst`). Rast je omejena z zbiralnikom smeti, zato nizka.
- Preverjeno: verjetno (branje kode in three.js r128).

**J9 · Garaža: geometrija koles za vsako kombinacijo delov ostane v pomnilniku do ponovnega nalaganja strani** · `js/render.js:2161` (`kitWheels`)
- `kitWheelCache` se samo polni (`get`/`set` v 2161/2164), nikoli ne prazni; ključ vsebuje `E.key`, ta pa za avto z deli celoten ključ delov (`M.id|H|<deli>`, 2133). Telesa z deli hrani `kitDeliCache` samo zadnjih 8 (2139), kolesa izpodrinjenih ostanejo. `sharedCarRes` (4761) vsa kolesa iz predpomnilnika označi kot skupna, zato jih `disposeCarMesh` ne sprosti.
- **Primer:** `garaza.html` z vozilom s kolesi kot deli: vsak preizkus ali menjava dela (tudi spojler, ki koles ne spremeni) zgradi nov par enakih koles (~400 trikotnikov in ~43 KB vsako pri visoki podrobnosti, plus različice pasov gum in čeljusti). Števec `wheels` v `kitInfo()` (2348) samo raste. V dirki je rast majhna (en komplet na avto in kombinacijo).
- Preverjeno: potrjeno (branje kode).

**J8 · Odblesk sonca ugaša hitreje pri višji hitrosti sličic in tudi v pavzi** · `js/render.js:4176` (`pkFlare`, klicana iz `pkLight` in `sunFx`)
- `Math.min(1, (dt || 0) * 5 + (goal < pkF.vis ? 0.05 : 0))` pri ugašanju prišteje stalnih 0,05 na sličico, neodvisno od `dt`.
- **Primer:** posnetek s TV kamerami na `pikes` ali drugi progi s soncem v kadru, sonce gre za greben: ugasne v ~0,125 s pri 60 sličicah na sekundo in ~0,155 s pri 30; v ustavljenem posnetku ali foto načinu (`dt = 0`) ugaša za 5 % na sličico.
- Preverjeno: potrjeno (branje kode).

**J25 · Prehitevanje pod zastavo tik pred ciljem ostane brez kazni** · `js/core.js:6468` (`Race._flags`, igralec)
- Blok kazni teče samo, dokler igralec ni v cilju (`!P.finished`). Dolg, ki ob prečkanju ciljne črte še teče (10 s za vrnitev mesta), izgine: ni ne vrnjenega mesta ne +5 s.
- **Primer:** dirka z zastavami, rumena zastava ali varnostni avto v zadnjem krogu: igralec prehiti avto manj kot 10 s pred ciljem in obdrži mesto brez kazni.
- Preverjeno: potrjeno (branje kode).

**J26 · Nasvet po radiu (spodrez ali prehit s postankom) po prvem postanku tekmeca računa z napačno gumo** · `js/core.js:6688` (`Race.pitDuel`)
- Naslednjo zmes tekmeca bere kot `aS.seq[aS.hist.length]`. `hist` se ob vsakem postanku podaljša (6354), `_stratStop` (5856–5857) pa `seq` ob vsakem postanku zamakne (`slice(1)`), tako da je `seq[0]` trenutna zmes. Pred prvim postankom je indeks pravilen, po njem za enega predaleč: vzame zmes postanka pozneje ali `undefined`, nato trenutno zmes (`|| a.ty.c`).
- **Primer:** dirka z zmesmi gum in strategijo, tekmec z dvema postankoma: po njegovem prvem postanku ocena za radio (`under`/`over`) računa z oprijemom napačne zmesi. Simulacija pregleda na `troisrivieres` (14 krogov) je pokazala napačno zmes po prvem postanku.
- Preverjeno: potrjeno (simulacija pregleda).

**J27 · Hitri vstop: `?vreme=constructor` ali `?vreme=__proto__` gre skozi preverjanje** · `js/core.js:7403` (`quickArgs`)
- `QUICK_WX[low('vreme')]` bere tudi lastnosti prototipa objekta, zato je `q.weather` funkcija ali prazen objekt, `q.bad` pa ostane prazen (brez opozorila o napačnem parametru).
- **Primer:** `index.html?proga=spa&vreme=constructor`: v Node `quickArgs` vrne `weather` vrste `function` in `bad: []` (`vreme=__proto__`: objekt, `bad: []`; `vreme=xyz` pravilno `bad: ['vreme=xyz']`). Kaj igra z napačnim vremenom naredi naprej, ni preverjeno. Samo hitri vstop za preizkuse (`tests/README.md`).
- Preverjeno: potrjeno (Node).

**J28 · Dirka po cesti: vrstni red na cilju pri velikem polju po vrstnem redu korakov, ne po času** · `js/core.js:6947` (`Race._progressOpen`)
- Na krožni progi cilj pri nivoju podrobnosti (`m > 1`) avto vstavi po času prečkanja (6194); na cesti (`T.open`) ga samo doda na konec (`finishOrder.push`), čeprav je `ft` (`tAt`) preračunan znotraj daljšega koraka LOD.
- **Primer:** dirka po cesti z več kot 29 tekmeci (npr. `balea`, `harju`, `tianmen`): dva oddaljena avta prečkata cilj v istem daljšem koraku (do 1/15 s); avto, obdelan prej v zanki, dobi boljše mesto, tudi če ima slabši `finishTime`.
- Preverjeno: verjetno (branje kode).

**J29 · Dim gorečega ali kadečega se avta zunaj pogleda vseeno utihne** · `js/render.js:6737` (`updateCars`), izjema v `js/render.js:6725`
- 6725 namenoma ne utiša učinkov avta, ki gori ali se kadi (`v.fire`, `dmg > 0.45`), da ima ob prihodu v pogled že zrasel steber dima. Blok odpadljivih delov (`v.parts`) v `finally` nastavi `particles.mute = sparkP.mute = !vis`, zato `engineFx` (6744) zunaj pogleda ne odda dima in plamenov; `glows` ostane neutišan. Komentar v 9123 (»out of the view: its smoke and glow muted«) nasprotuje komentarju v 6725, zato namen ni čisto jasen.
- **Primer:** dirka s poškodbami, tekmec se kadi ali gori za igralcem (zunaj pogleda kamere za avtom); v posnetku TV kamera preklopi nanj ali ga igralec po vrtenju zagleda: dim začne rasti iz nič, sij ognja pa je že tam.
- Preverjeno: verjetno (branje kode).

## Obseg pregleda
- Prvi prehod (ena seja): razred `Race` (zastave, varnostni avto, postanki, sektorji, leteči štart), trki, AI in promet; v `js/render.js` pogled avtov, varnostni avto, razbitine, popravilo v boksih, kamera boksov in ogenj.
- 9 vzporednih pregledov po vrsticah (`main` 90e09dac): `js/core.js` 32–1446 (proga), 1446–2694 (fizika avta, gume, poškodbe), 2694–3658 (trki, razbitine, predmeti), 3658–5495 (AI, promet, ljudje, policija), 5495–7418 (dirka, drugi prehod); `js/render.js` 1–3430 (avti, kolesa, deli), 3430–6014 (predmeti, luči, priklop dirke), 6014–8523 (izris sličice, poškodbe, prevračanje), 8523–10534 (kamera, nebo, učinki).
- Samo preleteno: policijski trki (`obbHit`, `crashCollide`, `boxCollide`, `js/core.js:3577–3656`). Zunaj obsega: `js/nvwalls.js`, `js/game.js`, `js/world*.js` (Pregled sveta).
- Najdbe so preverjene v Node (`tests/lib/core.js`, `tests/lib/sim.js`) ali s sledjo v kodi; v brskalniku ni bilo preizkusov, zato je videz (megla, sence, dim) ocenjen iz kode.

## Zavrnjeni kandidati
Preverjeni in zavrženi, da jih naslednji pregled ne išče znova:
- Dirka: druga tretjina (`_thirds`) pri letečem štartu (kolona na nobeni pravi progi ne seže do tretjine kroga); DRS brez preverjanja časa (0 napačnih od 109 na `spa` s 50 tekmeci); podvojene štartne številke; odstop v boksih; zaokroževanje sektorjev; dva igralca v spletu na istem štartnem mestu (`js/game.js` jima vedno da različni); AI ob avtu, ki stoji v pasu boksov (pri izvozu iz boksov pravilno).
- Fizika avta: prednastavitve pomoči zunaj razpona, prazna nastavitev, menjava modela pri Novi, NaN ob štartu, odvisnost od koraka (stalni 1/120 s, LOD do 1/15 s); obraba gum KOLIBRIJA (namerna izbira).
- Trki in predmeti: Kaskaderska različica trkov ob ~5 % udarcev pridobi energijo (namerno pretirana); predmeti, ki obmirujejo rahlo nagnjeni, in podrti drogovi, ki trčijo samo v sredini (kozmetika).
- AI, promet, policija: števci zebre, AI za prometom (dirka ga reši po 3,5 s), patrulje in neoznačen civilni avto, kazen 5 s za podrtega motorista (namerno).
- Proga: šiv zaprte zanke, ovijanje razdalje na cesti, robovi zgradb, stranske ceste, luže na `sani`: nobena prava proga jih ne sproži; v zelo ozkih ovinkih je fizična ograja nekaj metrov znotraj narisane (približek).
- Izris: materiali patrulj in geometrija, ki se sprosti, ko je še v rabi (three.js r128 ju zgradi znova: samo ponovno prevajanje oz. nalaganje); barve in delne posodobitve `InstancedMesh`; nebo, zvezde, garaža in posnetki avtov (narejeni enkrat ali pravilno sproščeni); zamik kamere po reševanju s padca (samo testna proga); rez TV kamere na šivu (namerno).

## Opaženo zunaj obsega (nepreverjeno)
- `js/game.js:6560` (`carPic`) in `js/game.js:739` (`Render.setShowCar`) ne podata delov avta (`deli`): slike avtov v meniju in razstavni prostor morda kažejo tovarniške dele namesto izbranih.
- `js/garage3d.js:4499` in `thumbCanvas` (`js/garage3d.js:6405`) nastavita prosojnost na material, ki je videti skupen (senca pod avtom).
