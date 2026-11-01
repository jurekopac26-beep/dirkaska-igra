# Kratke proge: smučišča, zanimivosti, dirkališča

Načrt sklopa šestnajstih kratkih prog zunaj Evrope: 7 gorskih cest skozi smučišča, 6 cest z zanimivostmi na cesti ali tik ob njej (predor v steni, most nad morjem, slapovi, čajni nasadi, jezero) in 3 dirkališča. Načrt je za seje, ki proge gradijo: vse odločitve in podatki so tu, zato jih seje ne raziskujejo in ne sprašujejo znova. (Ime datoteke je ostalo od prve različice načrta.)

## Odločitve uporabnika

- **31. 10. 2026**: en sklop, izdelan kot veriga sej. Vsaka proga je svoja seja (»Naredi progo N po docs/gorske-proge.md«), svoja veja `gorske-proge/<NN>-<id>` in en pull request. Seja ga odpre (najprej kot osnutek), ko so lokalno zeleni povezani testi, in ga **sama združi na `main` brez vprašanja**, ko so na GitHubu zeleni vsi testi. Nato brez vprašanja zažene sejo za naslednjo progo iz tabele Stanje (model `claude-opus-5-5`). Uporabnik verigo ustavi z »stop«.
- **31. 10.**: grafika čim bolj podrobna, poraba tokenov čim manjša brez izgube kakovosti (pravila spodaj); čas izdelave ni pomemben, zato veriga teče zaporedno, ena proga naenkrat.
- **1. 11.**: krajši odseki: ceste **2,5–3 km** (krajši odsek resnične ceste je prava proga, ne testna); dirkališča imajo svoj krog.
- **1. 11.**: v igri so vidni samo predmeti blizu proge, zato je izbranih teh 16 prog (»16 močnih«): pri vseh so zanimivosti izmerjene v pasu 60 m ob cesti (razdelek Kaj vidi kamera). Proge, pri katerih so bile zanimivosti dlje (Mount Norquay, Loveland Pass, Bšari, Daegwallyeong, Hai Van), so izločene.
- **1. 11.**: izogibaj se vsemu, kar je lahko pravno sporno (razdelek Pravna varnost).
- **1. 11.**: z delom v kodi se začne, ko uporabnik napiše »začni«.
- **1. 11.**: vsaka proga ima svoj pull request in gre na `main` takoj, ko so zeleni vsi testi; proge gredo **ena za drugo** (naslednja se začne, ko je prejšnja na `main`).
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
- Brez olimpijskih krogov in besede »olimpijski«, brez imen dirkaških serij in prireditev (npr. dirke električnih avtov v Punta del Este, srečanja starodobnikov na Put-in-Bayu).
- Brez kipov in sodobnih umetnin ob progi (npr. kip roke na plaži v Punta del Este): avtorska dela.
- Verska svetišča, vojaški objekti in zastave niso posebni objekti ob progi; kvečjemu generične stavbe.
- Na sveti gori (Ruapehu pri Whakapapi) samo zemljepisna imena, brez imen svetih krajev.
- Za cesto Yungas brez vzdevka »cesta smrti« in brez spominskih križev ob cesti.

## Proge

Vrstni red je vrstni red verige. Prva seja naredi tudi skupne gradnike in uvoznik. Obseg (`bbox`: zahod, jug, vzhod, sever) in odseki so preverjeni v OpenStreetMap 1. 11. 2026. Številke »v pasu 60 m« so deleži odseka, ob katerih je ta predmet v OSM. Serpentina je zasuk nad 140° na 80 m (Mount Norquay ima na 2,5 km 4 serpentine).

| # | `id` | Ime (`name`) | Angleško | Vožnja | Obseg OSM |
|---|---|---|---|---|---|
| 1 | `bigwhite` | Big White, Kanada | Big White, Canada | desna | -118.97,49.70,-118.90,49.74 |
| 2 | `farellones` | Farellones, Čile | Farellones, Chile | desna | -70.40,-33.38,-70.27,-33.33 |
| 3 | `medeu` | Medeu, Kazahstan | Medeu, Kazakhstan | desna | 77.03,43.11,77.10,43.17 |
| 4 | `oukaimeden` | Oukaïmeden, Maroko | Oukaïmeden, Morocco | desna | -7.90,31.17,-7.80,31.27 |
| 5 | `shiga` | Shiga Kogen, Japonska | Shiga Kogen, Japan | leva | 138.47,36.68,138.54,36.75 |
| 6 | `auli` | Auli, Indija | Auli, India | leva | 79.54,30.51,79.60,30.57 |
| 7 | `whakapapa` | Whakapapa, Nova Zelandija | Whakapapa, New Zealand | leva | 175.52,-39.25,175.58,-39.19 |
| 8 | `guoliang` | Guoliang, Kitajska | Guoliang, China | desna | 113.57,35.71,113.63,35.76 |
| 9 | `yungas` | Yungas, Bolivija | Yungas, Bolivia | leva (lokalno pravilo te ceste; preveri v virih) | -67.86,-16.30,-67.73,-16.20 |
| 10 | `arenal` | Arenal, Kostarika | Arenal, Costa Rica | desna | -84.82,10.43,-84.68,10.53 |
| 11 | `ella` | Ella, Šrilanka | Ella, Sri Lanka | leva | 81.02,6.82,81.08,6.89 |
| 12 | `milford` | Milford Sound, Nova Zelandija | Milford Sound, New Zealand | leva | 167.93,-44.79,168.03,-44.73 |
| 13 | `clifton` | Clifton, Avstralija | Clifton, Australia | leva | 150.95,-34.28,151.00,-34.23 |
| 14 | `puntadeleste` | Punta del Este, Urugvaj | Punta del Este, Uruguay | desna | -54.965,-34.97,-54.935,-34.95 |
| 15 | `putinbay` | Put-in-Bay, ZDA | Put-in-Bay, USA | desna | -82.86,41.63,-82.79,41.67 |
| 16 | `potrero` | Potrero de los Funes, Argentina | Potrero de los Funes, Argentina | desna | -66.26,-33.25,-66.20,-33.20 |

### Smučišča (1–7)

1. **Big White**: Big White Road (14,5 km), odsek od 49.71598,-118.93851 do 49.72285,-118.92830 (2,9 km) skozi smučarsko vas. V pasu 60 m: smučišča ob 72 % odseka, 4 žičnice in 5 postaj, 91 stavb, potok, gozd. Ovinkov je malo (1 serpentina); nižje so serpentine brez žičnic: dodaj jih le, če ostane ob vsaj polovici odseka smučišče.
2. **Farellones**: Camino a Farellones (G-21) z oštevilčenimi ovinki (table s številkami tik ob cesti, kot na Los Caracoles in Irohazaki). 10 serpentin je nižje (od -33.34532,-70.36263 do -33.34818,-70.35549), žičnic tam ni. Cesta skozi vas pride do žičnice na 23 m (-33.35081,-70.30864), ulica proti El Coloradu na 19 m (-33.33364,-70.28949; poimenovana po osebi: brez imena). Izberi 3 km, ki se končajo v vasi med žičnicami, z čim več oštevilčenimi ovinki pred njo.
3. **Medeu**: cesta od Medeuja proti Šimbulaku (ulica, poimenovana po osebah: brez imena), odsek od 43.12376,77.08014 do 43.14162,77.06701. V pasu 60 m: žičnice ob 54 % odseka (gondola in še 3: stebri, postaje, sence), gozd ob 80 %, potok ob 23 %, 64 stavb, most 85 m, 2 serpentini.
4. **Oukaïmeden**: zadnji 3 km ceste RP2030 do smučišča; cesta pride do žičnice na 44 m pri 31.19983,-7.85880. Ob cesti hiše in polja, vlečnice na koncu; mule in koze.
5. **Shiga Kogen**: državna cesta 292, odsek od 36.67701,138.50975 do 36.69119,138.49260. V pasu 60 m: žičnice ob 21 % odseka (2 žičnici, 2 postaji), smučišča ob 13 %, potok, gozd ob 51 %, 2 serpentini. Snežne opice (njihova dolina je nižje: približek).
6. **Auli**: cesta Joshimath–Auli, odsek od 30.53048,79.56323 do 30.54272,79.55471: 5 serpentin, smučišče ob 22 % odseka, žičnice ob 10 % (kabinska žičnica in sedežnica: stebri, postaje), 14 stavb. Opice langurji, krave. Brez templja kot posebnega objekta.
7. **Whakapapa**: Bruce Road, odsek od -39.22255,175.53981 do -39.23667,175.55620, konec pri smučišču: lavne stene in skale ob 98 % odseka, 2 žičnici na vrhu, 15 stavb, 1 serpentina. Živali skoraj ni (kea tu ne živi).

### Zanimivosti (8–13)

8. **Guoliang**: cesta, vklesana v steno, odsek od 35.72361,113.60811 do 35.72955,113.59930: 6 serpentin, 520 m predora z odprtinami na prepad (streha predora izgine, ko je avto v njem, kot galerije na Los Caracoles; odprtine v zunanji steni so vidne od zgoraj), stene, potoki. Brez imen turističnega območja.
9. **Yungas**: North Yungas Road, odsek od -16.29115,-67.80525 do -16.27864,-67.79506: 2 serpentini, potoki čez cesto ob 26 % odseka (slapovi na cesto; v OSM niso vrisani, lega je približek), rob prepada brez ograje, megla.
10. **Arenal**: Vía 142, odsek od 10.47795,-84.76621 do 10.47069,-84.77000 ob jezu: obala jezera ob 15 % odseka, potok, deževni gozd ob vsem odseku, 1 serpentina; nosati medvedki ob cesti. Vulkan je predaleč, da bi se videl: ga ne modeliraj. Brez imen hotelov.
11. **Ella**: cesta A23, odsek od 6.86278,81.05403 do 6.87096,81.04956: 3 serpentine, čajni nasadi ob 56 % odseka, potoki ob 26 %, 63 stavb; opice. Brez imen posestev.
12. **Milford Sound**: cesta SH 94, odsek od -44.76360,167.97427 do -44.75198,167.95879 (3 km) od zahodnega portala predora po serpentinah navzdol: mostovi 145 m, potoki in slapovi ob 25 % odseka, gozd ob 46 %, 2 serpentini. S celim enopasovnim predorom (1.226 m, semafor) je odsek ~4 km: izberi. Papige kea. Predor brez imena (poimenovan po osebi).
13. **Clifton**: obalna cesta (poimenovana po osebi: brez imena), odsek od -34.24197,150.97837 do -34.26260,150.96661: most ob pečini nad morjem (595 m na odseku), morje ob 38 % odseka, pečine ob 35 %, gozd ob 95 %, 16 stavb. Ovinkov je malo (dolgi loki, brez serpentin).

### Dirkališča (14–16)

Krog z boksi po vzoru obstoječih cestnih dirkališč (npr. `newcastle`, `detroit`). Postavitev proge iz OSM in javnih opisov (Wikipedija, zemljevidi z Wikimedia Commons z navedbo licence), nikoli Google.

14. **Punta del Este**: ~2,8 km po ulicah polotoka ob pristanišču, postavitev cestnih dirk električnih avtov 2014–2018 (imena serije ne uporabljaj). Ob obalni cesti (5,4 km, poimenovana po osebi) je v pasu 60 m morje na 3,3 km, plaža na 1,7 km in pristanišče z jahtami na 1,1 km. Brez kipa roke na plaži, brez imen hotelov in igralnice.
15. **Put-in-Bay**: zgodovinska dirka 1952–1959 po cestah otoka v jezeru Erie (~5 km; postavitev in dolžino preveri v virih). V pasu 60 m: na Bayview Avenue jezero na 2,3 km in pristanišče na 1,2 km, na West Shore Boulevard jezero na 1,0 km, na Airline Road plaža na 0,6 km. Otoška vas, pristanišče, čolni; spomenik (steber) brez imena.
16. **Potrero de los Funes**: krog po aveniji okoli akumulacijskega jezera (Avenida Circuito del Lago, 6,2 km; v lasti pokrajine), jez, hribi. Jezero je v pasu 60 m le na 0,4 km, jez na 0,1 km: ob progi poudari skale, hribe in obalo, kjer je blizu.

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

- Gradniki in uvoznik se napišejo enkrat, proge jih samo uporabljajo.
- Vsaka proga je nova seja s svežim kontekstom; predloga je ena datoteka (prejšnja proga sklopa).
- Detajli samo tam, kjer jih kamera vidi (pas ~60 m): nič dela za predmete v megli.
- Slike: stalna mesta na progi (`tools/shot.mjs --m`), več pogledov združenih v eno sliko z manjšo ločljivostjo, največ trije krogi popravkov.
- Lokalno samo povezani testi; celotni nabori na GitHubu. Na teste se čaka z dogodki GitHuba.
- Brez raziskovanja: podatki in odločitve so v tem načrtu. Vprašanja uporabniku samo, če gre res za njegovo odločitev (stran Odločitve).

## Stanje

Veriga čaka, da uporabnik napiše »začni« (1. 11. 2026). Proga 1 nadaljuje seja, ki je 31. 10. začela Mount Norquay in je bila ustavljena, preden je karkoli spremenila; zato ima veja proge 1 staro ime.

| # | Proga | Veja | Stanje |
|---|---|---|---|
| 1 | Big White, Kanada (+ gradniki, uvoznik) | `gorske-proge/01-norquay` | čaka na »začni« |
| 2 | Farellones, Čile | `gorske-proge/02-farellones` | čaka |
| 3 | Medeu, Kazahstan | `gorske-proge/03-medeu` | čaka |
| 4 | Oukaïmeden, Maroko | `gorske-proge/04-oukaimeden` | čaka |
| 5 | Shiga Kogen, Japonska | `gorske-proge/05-shiga` | čaka |
| 6 | Auli, Indija | `gorske-proge/06-auli` | čaka |
| 7 | Whakapapa, Nova Zelandija | `gorske-proge/07-whakapapa` | čaka |
| 8 | Guoliang, Kitajska | `gorske-proge/08-guoliang` | čaka |
| 9 | Yungas, Bolivija | `gorske-proge/09-yungas` | čaka |
| 10 | Arenal, Kostarika | `gorske-proge/10-arenal` | čaka |
| 11 | Ella, Šrilanka | `gorske-proge/11-ella` | čaka |
| 12 | Milford Sound, Nova Zelandija | `gorske-proge/12-milford` | čaka |
| 13 | Clifton, Avstralija | `gorske-proge/13-clifton` | čaka |
| 14 | Punta del Este, Urugvaj | `gorske-proge/14-puntadeleste` | čaka |
| 15 | Put-in-Bay, ZDA | `gorske-proge/15-putinbay` | čaka |
| 16 | Potrero de los Funes, Argentina | `gorske-proge/16-potrero` | čaka |
