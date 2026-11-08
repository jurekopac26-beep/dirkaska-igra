# Pregled jedra igre (`js/core.js`, `js/render.js`)

Pregled kode jedra igre, samo branje (odločitev uporabnika 8. 11. 2026 ob 16.05 in 17.40, tabla #382, Matejev komentar 6724187167; račun biketraveler). Poziv: `/code-review max js/core.js js/render.js` na svežem `main` (90e09dac). Ena tema s Pregledom sveta (`docs/pregled-sveta.md`), skupni osnutek PR na veji `pregled/jedro-in-svet`.

**Popravkov tu ni**: dokument samo našteje preverjene napake; popravke razvrsti tedenski načrt. Testne proge so zamrznjene (`CLAUDE.md`), zato napake, ki se pokažejo samo na njih, niso v seznamu.

## Stanje
- 8. 11. 2026 ob 18.15: začetek pregleda.
- 18.30: prvi prehod (`/code-review max`, ena seja brez več agentov) je prebral razred `Race`, trke, AI, promet ter v `js/render.js` pogled avtov, varnostni avto, razbitine, popravilo v boksih, kamero boksov in ogenj: dve najdbi (J1, J2), obe preverjeni. Za neprebrane dele (proga, fizika avta, poškodbe, policija, svet v izrisu, kamera, učinki) teče 9 vzporednih pregledov.

## Najdbe po resnosti
Vsaka najdba ima datoteko in vrstico (na `main` 90e09dac), opis in konkreten primer, ki jo sproži. Preverjeno: **potrjeno** (sled od vhoda do napake ali simulacija) ali **verjetno** (branje kode brez ponovitve).

### Kritične
_V delu._

### Hude
_V delu._

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

**J10 · Policijski način: megla postane NaN v posnetku aretacije** · `js/render.js:9688` (kamera, megla posnetka)
- `dC = shot ? shot.fogD : …` nima privzete vrednosti (za razliko od `near`), `setShot` (9916) pa je ne doda. `bustShot` in `chkShot` (`js/game.js:3682–3693`) podata samo položaj, `fov`, `floor` in `near`, brez `fogD`, zato sta `scene.fog.near` in `scene.fog.far` NaN, dokler posnetek traja; vsi drugi klici `setShot` (foto način, prelet, cilj, misije) `fogD` podajo. Izid je odvisen od grafične kartice: megle ni in daljna ravnina reže ostro, ali pa so zamegljene točke črne.
- **Primer:** policijski način na pravi progi, ki ga ima (npr. `balea`, `medvode`, `greatalpine`, `tianmen`): policija igralca ujame (ULOVLJEN, `bustShot`) ali ga aretira na kontrolni točki (`chkShot`). Posnetek traja 4,2 s zaključne faze in ostane za zaslonom z rezultati.
- Preverjeno: potrjeno (branje kode; videz na posamezni kartici ni preverjen).

### Nizke

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
