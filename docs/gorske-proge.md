# Kratke proge: smučišča, zanimivosti, dirkališča

Načrt sklopa šestnajstih kratkih prog zunaj Evrope, vsaka iz druge države: 4 gorske ceste skozi smučišča, 9 zavitih cest z zanimivostmi na cesti ali tik ob njej in 3 dirkališča. Pri vseh je glavni element izmerjen v kadru kamere pokonci (razdelek Kaj vidi kamera), ceste so zavite. Načrt je za seje, ki proge gradijo: vse odločitve in podatki so tu, zato jih seje ne raziskujejo in ne sprašujejo znova. (Ime datoteke je ostalo od prve različice načrta.)

## Odločitve uporabnika

- **31. 10. 2026**: en sklop, izdelan kot veriga sej. Vsaka proga je svoja seja (»Naredi progo N po docs/gorske-proge.md«), svoja veja `gorske-proge/<NN>-<id>` in en pull request. Seja ga odpre (najprej kot osnutek), ko so lokalno zeleni povezani testi, in ga **sama združi na `main` brez vprašanja**, ko so na GitHubu zeleni vsi testi. Nato brez vprašanja zažene sejo za naslednjo progo iz tabele Stanje (model `claude-opus-5-5`). Uporabnik verigo ustavi z »stop«.
- **31. 10.**: grafika čim bolj podrobna, poraba tokenov čim manjša brez izgube kakovosti (pravila spodaj); čas izdelave ni pomemben, zato veriga teče zaporedno, ena proga naenkrat.
- **1. 11.**: krajši odseki: ceste **2,5–3 km** (krajši odsek resnične ceste je prava proga, ne testna); dirkališča imajo svoj krog.
- **1. 11.**: v igri so vidni samo predmeti blizu proge, zato je izbranih teh 16 prog (»16 močnih«): pri vseh so zanimivosti izmerjene v pasu 60 m ob cesti (razdelek Kaj vidi kamera). Proge, pri katerih so bile zanimivosti dlje (Mount Norquay, Loveland Pass, Bšari, Daegwallyeong, Hai Van), so izločene.
- **1. 11.**: izogibaj se vsemu, kar je lahko pravno sporno (razdelek Pravna varnost).
- **1. 11.**: zamenjane so vse proge, katerih glavnega elementa iz kamere ni videti, in preravne proge; proga mora biti zavita. Na seznamu je iz vsake države le ena proga. Milford Sound je s celim predorom.
- **1. 11.**: z delom v kodi se začne, ko uporabnik napiše »začni«.
- **1. 11.**: proga 1 ima svoj pull request; proge 2–16 gredo v **4 skupinah** (A: 2–4, B: 5–7, C: 8–13, D: 14–16), vsaka skupina je ena seja, ena veja `gorske-proge/skupina-<X>` in en pull request, ki gre na `main`, ko so zeleni vsi testi. Skupine gredo ena za drugo (naslednja se začne, ko je prejšnja na `main`). Seja skupine prebere repozitorij in načrt enkrat, gradnik družine naredi in takoj uporabi pri vseh progah skupine.
- **1. 11.**: napor: proga 1 (z gradniki) **max**, proge 2–16 **xhigh**. Izvedba: koordinacijska seja pred zagonom seje proge naredi vejo `gorske-proge/<NN>-<id>` iz `origin/main` z enim začasnim commitom, ki v `.claude/settings.json` nastavi `env.CLAUDE_CODE_EFFORT_LEVEL` na `xhigh`, in sejo zažene s te veje. Seja proge ta commit vrne (`git revert`), preden pull request označi kot pripravljen; koordinacijska seja pred združitvijo preveri, da pull request `.claude/settings.json` ne spreminja.
- **1. 11.**: verigo vodi koordinacijska seja (tista, ki je napisala ta načrt) z naporom medium: čaka na teste (`subscribe_pr_activity`), združi pull request, posodobi Stanje in zažene naslednjo progo. Seja proge pull request odpre kot osnutek, ga označi kot pripravljenega, ko so lokalno zeleni povezani testi, in koordinacijski seji pošlje eno vrstico (`send_message` na `@parent`). Če test na GitHubu pade, ji koordinacijska seja pošlje napako in seja proge jo popravi.
- Zemljevid od zgoraj, prelet in helikopterski posnetek se ne delajo (po `CLAUDE.md` so po želji pozneje). Slika za meni je obvezna.

## Kaj vidi kamera (merilo za odseke in detajle)

Iz `js/render.js` (kamera za avtom, `userTilt` 0,3):
- **Ležeče**: kamera je ~18 m nad cesto in ~24 m za točko pogleda, gleda 36° navzdol (vidni kot 46°). Ob avtu se vidi ~25 m levo in desno, na vrhu zaslona ~60 m naprej in ~60 m vstran. Megla od ~40 m do ~165 m od kamere.
- **Pokonci**: kamera je ~29 m nad cesto in ~36 m za točko pogleda, gleda 39° navzdol (vidni kot 58°), vidi ~130 m naprej, a ožji pas. Megla od ~62 m do ~253 m.
- Obzorja se ne vidi nikoli. Svetovi z `farClip` za meglo ne rišejo ničesar.
- **Zanimivosti in detajli so samo v pasu ~60 m ob cesti.** Kar je dlje, se ne modelira (gore, vulkani, mesta v dolini, morje globoko spodaj).
- Vse, kar je višje od kamere (vrv in kabine žičnice nad cesto), se ne vidi. Žičnice štejejo po stebrih, postajah in sencah ob cesti; smučišča po snegu in smučarjih tik ob cesti.

## Pravna varnost

Velja poleg pravil v `CLAUDE.md`:
- Imena smučišč, žičnic, koč, hotelov, igralnic, posestev in zasebnih parkov so imena podjetij: v igri jih ni, ne na tablah ne v opisih ne v `js/lang.js`. Table so generične, ime proge je zemljepisno (tabela spodaj).
- Ceste, predori, ulice in spomeniki, poimenovani po osebah, ostanejo brez imena. Ovinki dobijo opisna imena.
- Brez olimpijskih krogov in besede »olimpijski«, brez imen dirkaških serij in prireditev (npr. cestne dirke električnih avtov v Punta del Este, Green Pointu in Puerto Maderu).
- Brez kipov in sodobnih umetnin ob progi (npr. kip roke na plaži v Punta del Este): avtorska dela.
- Verska svetišča, vojaški objekti in zastave niso posebni objekti ob progi; kvečjemu generične stavbe.
- Za cesto Yungas brez vzdevka »cesta smrti« in brez spominskih križev ob cesti.

## Proge

Vrstni red je vrstni red verige. Prva seja naredi tudi skupne gradnike in uvoznik. Obseg (`bbox`: zahod, jug, vzhod, sever) in odseki so preverjeni v OpenStreetMap 1. 11. 2026. »V kadru« je delež odseka, pri katerem je glavni element v vidnem polju kamere pokonci (do ~110 m pred avtom, ~12 m levo in desno ob avtu do ~50 m na vrhu slike). Serpentina je zasuk nad 140° na 80 m.

| # | `id` | Ime (`name`) | Angleško | Vožnja | Obseg OSM |
|---|---|---|---|---|---|
| 1 | `mountbuller` | Mount Buller, Avstralija | Mount Buller, Australia | leva | 146.41,-37.17,146.46,-37.13 |
| 2 | `nozawa` | Nozawa Onsen, Japonska | Nozawa Onsen, Japan | leva | 138.43,36.91,138.48,36.94 |
| 3 | `medeu` | Medeu, Kazahstan | Medeu, Kazakhstan | desna | 77.03,43.11,77.10,43.17 |
| 4 | `auli` | Auli, Indija | Auli, India | leva | 79.54,30.51,79.60,30.57 |
| 5 | `guoliang` | Guoliang, Kitajska | Guoliang, China | desna | 113.57,35.71,113.63,35.76 |
| 6 | `milford` | Milford Sound, Nova Zelandija | Milford Sound, New Zealand | leva | 167.93,-44.79,168.03,-44.73 |
| 7 | `corvobranco` | Corvo Branco, Brazilija | Corvo Branco, Brazil | desna | -49.41,-28.08,-49.34,-28.03 |
| 8 | `yungas` | Yungas, Bolivija | Yungas, Bolivia | leva (lokalno pravilo te ceste; preveri v virih) | -67.86,-16.30,-67.73,-16.20 |
| 9 | `hana` | Hana, ZDA | Hana, USA | desna | -156.13,20.79,-156.05,20.84 |
| 10 | `ella` | Ella, Šrilanka | Ella, Sri Lanka | leva | 81.02,6.82,81.08,6.89 |
| 11 | `santoantao` | Santo Antão, Zelenortski otoki | Santo Antão, Cape Verde | desna | -25.10,17.06,-25.02,17.13 |
| 12 | `dades` | Dadès, Maroko | Dadès, Morocco | desna | -5.94,31.53,-5.88,31.58 |
| 13 | `espinazo` | Espinazo del Diablo, Mehika | Espinazo del Diablo, Mexico | desna | -105.90,23.53,-105.78,23.62 |
| 14 | `puntadeleste` | Punta del Este, Urugvaj | Punta del Este, Uruguay | desna | -54.965,-34.97,-54.935,-34.95 |
| 15 | `greenpoint` | Green Point, Južna Afrika | Green Point, South Africa | leva | 18.395,-33.91,18.42,-33.895 |
| 16 | `puertomadero` | Puerto Madero, Argentina | Puerto Madero, Argentina | desna | -58.372,-34.622,-58.355,-34.600 |

### Smučišča (1–4)

1. **Mount Buller**: Summit Road (cesta okoli vrha skozi smučarsko vas), odsek od -37.14588,146.44948 do -37.14600,146.43037 (2,75 km, krog): 596° na km, 1 serpentina, smučišča v kadru 76 %, žičnice 39 %. Smučišča upravlja javni zavod, žičnice podjetje: brez imen.
2. **Nozawa Onsen**: prefekturna cesta 502 (奥志賀公園栄線) nad vasjo, odsek od 36.90870,138.48019 do 36.92205,138.47297: 1033° na km, 8 serpentin, smučišča v kadru 55 %.
3. **Medeu**: cesta od Medeuja proti Šimbulaku (ulica, poimenovana po osebah: brez imena), odsek pri jezu od 43.15069,77.06514 do 43.16198,77.05306: 448° na km, 3 serpentine, žičnice v kadru 36 % (gondola: stebri, kabine, sence; vrv nad kamero), smrekov gozd, most.
4. **Auli**: cesta Joshimath–Auli, odsek od 30.53048,79.56323 do 30.54272,79.55471: 1096° na km, 5 serpentin, smučišče v kadru 22 %. Kabinska žičnica je višje od kamere (ne vidi se). Krave in opice ob cesti, brez templja kot posebnega objekta.

### Zanimivosti (5–13)

Po družinah posebnosti: predori in useki (5–7), slapovi in tropski gozd (8–10), polja in terase (11), suhe stene (12–13); vsaka družina svoj gradnik naredi enkrat.

5. **Guoliang**: cesta, vklesana v steno, odsek od 35.72361,113.60811 do 35.72955,113.59930: 6 serpentin, 520 m predora z odprtinami na prepad (streha izgine, ko je avto v njem, kot galerije na Los Caracoles). Brez imen turističnega območja.
6. **Milford Sound**: cesta SH 94 **s celim enopasovnim predorom** (1.226 m, portala -44.76486,167.98872 in -44.76343,167.97335) in serpentinami pod zahodnim portalom, odsek od -44.76484,167.99273 do -44.75994,167.96589 in naprej do serpentin (~4 km): predor v kadru 46 %, mostovi, slapovi, gozd, papige kea. Predor brez imena (oseba).
7. **Corvo Branco**: cesta čez prelaz (poimenovana po osebi: brez imena), odsek od -28.05879,-49.36121 do -28.05483,-49.37583: 1056° na km, 8 serpentin; na vrhu globok usek v skali (preveri, da je na odseku; višinski model ga ne vsebuje, zgradi ga posebej), araukarije.
8. **Yungas**: North Yungas Road, odsek od -16.29115,-67.80525 do -16.27864,-67.79506: 972° na km, 2 serpentini, potoki in slapovi čez cesto (lega slapov je približek), rob prepada brez ograje, megla. Brez vzdevka »cesta smrti« in spominskih križev.
9. **Hana**: Hana Highway, odsek od 20.81801,-156.12894 do 20.80989,-156.10642: 970° na km, enopasovni mostovi v kadru 17 %, slapovi (približek), deževni gozd. Brez imen zasebnih vrtov in svetih krajev.
10. **Ella**: cesta A23, odsek od 6.85817,81.05850 do 6.87104,81.04755: 885° na km, 4 serpentine, čajni nasadi v kadru 45 %, vas, opice. Brez imen posestev.
11. **Santo Antão**: tlakovana cesta po grebenu otoka (Porto Novo–Ribeira Grande), odsek od 17.11675,-25.08303 do 17.12885,-25.08627: 628° na km, 4 serpentine, polja na terasah v kadru 75 %, hiše.
12. **Dadès**: cesta RR704 v soteski, odsek od 31.54150,-5.91631 do 31.52505,-5.92663: 1089° na km, 4 serpentine, rdeče stene in hiše ob cesti (generične).
13. **Espinazo del Diablo**: stara cesta Durango–Mazatlán po grebenu, odsek od 23.55181,-105.84463 do 23.56898,-105.84843: 705° na km, 1 serpentina, skalne stene v kadru 18 %, borov gozd.

### Dirkališča (14–16)

Krog z boksi po vzoru obstoječih cestnih dirkališč (npr. `newcastle`, `detroit`). Postavitev proge iz OSM in javnih opisov (Wikipedija, zemljevidi z Wikimedia Commons z navedbo licence), nikoli Google. Pred gradnjo preveri, da ima krog dovolj ovinkov (uporabnik: ravne proge niso dobre). Imena serij in prireditev se ne uporabljajo.

14. **Punta del Este**: ~2,8 km po ulicah polotoka ob pristanišču (postavitev cestnih dirk električnih avtov 2014–2018). Ob obalni cesti (poimenovana po osebi) je v pasu 60 m morje na 3,3 km, plaža na 1,7 km in pristanišče z jahtami na 1,1 km. Brez kipa roke na plaži, brez imen hotelov in igralnice.
15. **Green Point**: ~2,9 km, ulični krog ob stadionu in obali (postavitev cestne dirke električnih avtov 2023). Ob obalni cesti (Beach Road) je v pasu 60 m morje na 0,9 km in plaža na 1,2 km; cesta pride do vode na 12 m (-33.90655,18.39793). Stadion generičen. Vožnja po levi.
16. **Puerto Madero**: ~2,5 km, ulični krog ob dokih (postavitev cestnih dirk električnih avtov 2015–2017). Voda dokov je ob ulicah na 0,6–1,4 km (ulice so poimenovane po osebah: brez imen). Oblikovanega mostu čez dok ne modeliraj po resničnem.

## Podatki

- **OSM**: glavni API `https://api.openstreetmap.org/api/0.6/map?bbox=W,S,E,N` (največ 0,25 kvadratne stopinje in 50.000 točk; obseg iz tabele je dovolj majhen). `overpass-api.de` iz okolja seje ne deluje.
- **Višine**: Terrain Tiles na AWS (`s3.amazonaws.com/elevation-tiles-prod`, kot Beartooth), Copernicus DEM (`copernicus-dem-30m.s3.amazonaws.com`); **raba tal**: ESA WorldCover (`esa-worldcover.s3.eu-central-1.amazonaws.com`).
- Nikoli Google Maps, Google Earth ali Street View. Vire z licenco dodaj v `README.md` pod »Zasluge« (OSM: ODbL 1.0).
- Prenesene datoteke so v mapi seje (scratchpad), ne v repozitoriju; v repozitorij gredo samo izpeljani podatki v datoteki proge.

## Skupni gradniki (prva seja, skupaj s progo 1)

Graditelji obstoječih gorskih prog imajo po 50–80 KB in vsak svoje živali in žičnice (`btGoat`, `vrGoat`, `saSheepGeo`, `lfSheepGeo`, `hoLift`). Nove proge uporabljajo skupne gradnike, napisane enkrat:

- `js/world-gore.js` (`World.gore`): žičnice (gondola, sedežnica, vlečnica, sidrišče: stebri, postaje, sence; vrv in kabine le tam, kjer jih kamera vidi), smučarske proge po terenu (sneg iz OSM `piste:type`), smučarji, snegolovi, količki, generične koče; živali kot instance (ovca, koza, mula, krava, opica, nosati medved, papiga, kondor). Pozneje sem dodaj še gradnike, ki jih rabi več prog: slap, most, plaža. Vse z instanciranjem, da je malo klicev risanja.
- `tools/proga-uvoz.mjs`: iz izvlečka OSM, višinskega modela in rabe tal naredi sredinsko črto (zglajeno, odprte serpentine kot na Irohazaki), višine, pas terena in seznam objektov v pasu ~60 m ob cesti v obliki, ki jo bere datoteka proge.
- Gradnike preizkusi na progi 1; poznejše proge jih samo uporabljajo in dopolnjujejo (brez spreminjanja videza že narejenih prog).

## Postopek za vsako progo

1. Preberi ta načrt, `CLAUDE.md`, vrstice proge v `docs/kazalo.md` in eno predlogo: prejšnjo progo iz tega sklopa (za progo 1 `js/tracks/iroha.js` in `js/world-iroha.js`; za dirkališča še `newcastle` ali `detroit`). Velikih datotek ne beri, samo grep.
2. Prenesi OSM za obseg iz tabele, višine in rabo tal; z uvoznikom postavi odsek iz tega načrta.
3. Detajle postavljaj samo v pas ~60 m ob cesti (razdelek Kaj vidi kamera); kar je dlje, je megla.
4. `js/tracks/<id>.js`, `js/world-<id>.js`, vrstica v `index.html`, angleščina v `js/lang.js`, `docs/proge/<id>.md`, vrstica v »Proge« in »Zasluge« v `README.md`, test po vzoru obstoječih, kazalo.
5. Slika za meni `assets/tracks/<id>.webp` in `<id>-rain.webp` (`maketa-menija/README.md`).
6. `node tools/stamp.js`, `npm run golden:update`, `npm run test:related`, `node tests/browser/menu.test.mjs`; obremenitev pod mejami iz `CLAUDE.md` (~300 klicev, ~900 tisoč oglišč) in brez povečanja na drugih progah.
7. Pull request kot osnutek; ko je lokalno zeleno, vrni začasni commit z naporom (`git revert`, razen pri progi 1), označi pull request kot pripravljenega in koordinacijski seji pošlji eno vrstico. Nato čakaj: združi ga koordinacijska seja; če test na GitHubu pade, ti pošlje napako.

## Varčevanje s tokeni (brez izgube kakovosti)

Odločitev uporabnika (1. 11. 2026): čim manj tokenov, kakovost ostane. Največ porabijo dolg kontekst (vsak korak seje znova prebere vse, kar je v njem), slike (ostanejo v kontekstu do konca seje), pisanje velikih datotek in popravljanje v krogih.

**Faza 0 (koordinacijska seja ob »začni«)**: orodja, s katerimi so bili odseki izbrani in preverjeni (izvoz iz OSM, izbira odseka, slika iz kamere pokonci), shrani v `tools/predogled/` s podatki vseh 16 prog v `tools/predogled/proge.json` (obseg, cesta, odsek, mesto avta, slog). Prva seja jih predela v uvoznik, namesto da ga piše od začetka.

**Proga 1 (napor max) naredi temelje, da so proge 2–16 večinoma podatkovno delo:**
- `js/world-gore.js` je podatkovno voden graditelj: teren iz višin, cesta in robovi, ograje, sneg, drevesa po rabi tal, stavbe in voda iz OSM, žičnice, živali. Proga mu da podatke in slog; svet proge (`js/world-<id>.js`) vsebuje le njene posebnosti (nekaj KB, ne 50–80 KB kot obstoječi graditelji).
- `tools/proga-uvoz.mjs <id>` iz `proge.json`, OSM in višin naredi podatke proge.
- `tools/nova-proga.mjs <id>` naredi vse ponavljajoče se: `js/tracks/<id>.js`, vrstico v `index.html`, angleščino v `js/lang.js`, osnutek `docs/proge/<id>.md`, vrstici v `README.md`, test in vrstico v kazalu. Seje prog 2–16 zato ne berejo predlog in ne pišejo istega besedila znova.

**Seja proge (napor xhigh) dela po receptu:**
1. Prebere `CLAUDE.md` in svoj del tega načrta; kazalo in kodo le z grepom, velikih datotek nikoli v celoti.
2. `node tools/proga-uvoz.mjs <id>` in `node tools/nova-proga.mjs <id>`.
3. Posebnost proge naredi kot gradnik v `js/world-gore.js`, če jo rabi še kakšna proga (predor, usek, slap, terase, doki), sicer v `js/world-<id>.js`. Proge so razvrščene po družinah, da vsaka družina svoj gradnik naredi enkrat.
4. Preverjanje: ena zbirna slika (pokonci in ležeče, 3–4 stalna mesta, manjša ločljivost), največ 3 krogi popravkov; obremenitev s `perf.test.mjs`; povezani testi z `--quiet`, izhodi ukazov skrajšani (`tail`).
5. Pull request kot osnutek → pripravljen → ena vrstica koordinacijski seji; nato se seja konča in ne čaka na teste.

**Koordinacijska seja (napor medium)** čaka na teste z dogodki GitHuba, ob napaki seji proge pošlje le izsek napake, ob zelenih testih združi, posodobi Stanje in naslednjo sejo zažene z enim stavkom.

**Kjer ne varčujemo**: pregled grafike s kamere pokonci in ležeče, meje obremenitve telefona, povezani testi lokalno in vsi na GitHubu, pravna pravila.

## Stanje

Uporabnik je napisal »začni« (1. 11. 2026). Navodilo seji skupine: »Naredi skupino X po docs/gorske-proge.md«. Proga 1 nadaljuje seja, ki je 31. 10. začela Mount Norquay in je bila ustavljena, preden je karkoli spremenila; zato ima veja proge 1 staro ime.

| Korak | Proge | Veja | Stanje |
|---|---|---|---|
| 1 | Mount Buller (+ gradniki, uvoznik, generator) | `gorske-proge/01-norquay` | v delu |
| A | 2 Nozawa Onsen, 3 Medeu, 4 Auli | `gorske-proge/skupina-A` | čaka |
| B | 5 Guoliang, 6 Milford Sound, 7 Corvo Branco | `gorske-proge/skupina-B` | čaka |
| C | 8 Yungas, 9 Hana, 10 Ella, 11 Santo Antão, 12 Dadès, 13 Espinazo del Diablo | `gorske-proge/skupina-C` | čaka |
| D | 14 Punta del Este, 15 Green Point, 16 Puerto Madero | `gorske-proge/skupina-D` | čaka |