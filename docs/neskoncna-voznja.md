# Neskončna vožnja v prometu (načrt)

Novost, ki jo je uporabnik izbral 5. 11. 2026: voziš po odprti cesti ali avtocesti, promet je vse gostejši; točke dobiš za hitrost in tesna prehitevanja; vožnja se konča ob trku; rekord se shrani. Ta dokument je načrt (seja session_01WbgGzro2DxnoL3t84r7MaV, koordinacija »VSE SEJE 2«, račun 3). **Koda se začne šele po odgovorih uporabnika** na strani Odločitve 3 (vprašanja `neskoncna-1`, `neskoncna-2`, `neskoncna-3`; razdelek Odločitve spodaj). Tema je v `docs/vrsta.md` (Načrtovano: pred novimi progami, po potrditvi načrta).

## Na kratko

- Nov način **Endless traffic** v izbiri načina (Single race). Izbereš odprto cesto in avto, štartaš leteče (~80 km/h), okoli tebe je promet obeh smeri: avti, kombiji, avtobusi, tovornjaki in motorji (brez kolesarjev in pešcev).
- **Točke**: za hitrost (vsak meter nad 60 km/h, več pri večji hitrosti) in za tesna prehitevanja ali srečanja (manj kot 1 m prostora); zaporedna tesna prehitevanja dvigujejo niz (×2 … ×5).
- **Promet se gosti** s prevoženo razdaljo (+20 % na km, do 4-kratne gostote dvoboja v prometu).
- **Konec ob trku** s prometom ali ob hudem udarcu v ograjo ali steno; dotik brez sunka samo prekine niz.
- **Rekord** za vsako cesto (in fiziko) z lestvico 10 najboljših; najboljši rezultat piše na ploščici načina.
- Priporočena izvedba: na **19 pravih odprtih cestah** igre, ki že imajo promet (dvoboj v prometu); ena seja, en pull request, **~12–16 h**. Izmišljena neskončna avtocesta je mogoča, a je nova cesta s pokrajino (~35–50 h).

## Kaj že obstaja in kaj se prekriva

- **Promet na odprtih cestah** (`js/core.js`, razred `Traffic`, komentar »THE OPEN ROAD: TRAFFIC AND PEOPLE«): vozila obeh smeri na svoji polovici ceste (na progah z `def.leftHand` zrcalno), model inteligentnega voznika (razdalja do vozila pred sabo, mirna vožnja do 70 km/h, umik dirkalniku), vozilo po močnem sunku zdrsne in obstane, vozila s konca ceste se vrnejo na začetek izven pogleda (`_recycle`). Mešanico vozil brez kolesarjev in pešcev že zna (`opts.tfCars`, misije). Promet ustvari `Race`, ko je `opts.traffic` ali `opts.police` (dvoboj v prometu, beg pred policijo); vsaka druga dirka ga ne vidi.
- **Dvoboj v prometu** (`'traffic'`, v meniju *Traffic duel*, hitri vstop `nacin=promet`) in **beg pred policijo** (`'police'`) imata vse **19 odprtih cest** (`def.modes` v `js/tracks/<id>.js`). Rekordi načinov so ločeni (`recKey` v `js/game.js`: `id-traffic@cs` …). Dogodke s ceste (trk, povožen pešec) obdela `roadEvent` v `js/game.js`.
- **Izris prometa** (`js/render.js`, `updateRoad`): en instanciran mesh za vsako vrsto vozila (en klic risanja za vse avte iste vrste), vozila dlje od 250 m se ne rišejo. Gostejši promet zato doda oglišča, klicev risanja skoraj ne.
- **#250 Zabava** (račun 3, osnutek, 7. v vrsti; še ni na `main`): način *Ti loviš* (`?nacin=lov`, s policijskim avtom loviš begunca po odprti cesti s prometom), *Živa cesta* (kamenje, žival, dela s semaforjem, traktor; v Nastavitvah), *Single race* dobi šest načinov. Prekrivanje: seznam načinov v meniju (`MODES` v `js/menu.js`, `js/menu-data.js`), priklopi v `js/game.js`, rezultati. Zato **koda neskončne vožnje začne na `main` po #250** in doda sedmi način; Živa cesta je v neskončni vožnji izklopljena (prva različica).
- **Nova mapa** (`js/newmap.js`, NEW VERSION · TEST 1) je zgrajena na Toskani (testna proga, zamrznjena, odide pred objavo); prometa na cesti nima. Ni podlaga za ta način.
- **Sovoznik na cestah** (#340, načrt `docs/sovoznik.md`, račun 3): napovedi ovinkov na vseh pravih odprtih cestah. Združljivo: ko sta oba v igri, sovoznik bere tudi v neskončni vožnji (če je vklopljen).
- **Lestvica prijateljev** (#343, načrt `docs/lestvica-prijateljev.md`, račun 3): primerja čase (kronometer, dvoboj, policija, krog). Neskončna vožnja ima točke, ne časa; ko sta obe v igri, lahko točke dobijo svoj ključ v izmenjavi rekordov (pozneje, ni v tem delu).
- **Odprti pull requesti** (5. 11. 2026): nihče ne dela točkovanja v prometu ali neskončne vožnje. `js/core.js` spreminjajo še #305 (AI po liniji), #202 (fizika, račun 2) in #284 (boksi); razred `Traffic` spreminja samo ta tema. Delo se ne prekriva, spajanje pa je treba uskladiti po vrsti.

## Na kateri cesti (vprašanje `neskoncna-1`)

| Možnost | Kaj | Delo | Za in proti |
|---|---|---|---|
| **1 · Prave odprte ceste (priporočeno)** | Vseh 19 odprtih cest igre s prometom: od položnih (Big Sur, Mauna Kea, Uncompahgre, Great Alpine Road, Mount Hotham: 177–309 °/km) do serpentin (Tianmen, Irohazaka, Sani Pass). Dve smeri na dveh pasovih: prehitevaš čez nasprotni pas, ko je prost. | ~12–16 h | Promet, pokrajina in obremenitev že obstajajo in so preverjeni; brez nove proge in brez izjem od pravil; rekord za vsako cesto. Cesta je dolga 2,5–12,3 km, zato potrebuje pravilo za konec ceste (`neskoncna-2`). |
| **2 · Izmišljena neskončna avtocesta** | Nova cesta, ki jo igra sproti gradi pred avtom: 2 + 2 pasova, smeri ločeni z ograjo, blagi ovinki, polja, griči, nadvozi. | ~35–50 h (3–4 seje) | Najbližje zvrsti, res brez konca. Nova pokrajina po kosih (gradnja pred avtom, brisanje za njim), promet z menjavo pasov, nove meritve obremenitve; ime brez kraja je izjema od pravila »Kraj, Država« (resnična avtocesta bi bila nova proga in bi po pravilu »Nove proge so vedno zadnje« čakala). |
| **3 · Oboje** | Najprej prave ceste (korak 1), avtocesta pozneje kot svoj korak. | ~12–16 h + ~35–50 h | Igralno hitro, avtocesta po presoji pozneje (vprašanje znova, ko pride na vrsto). |

## Kako se igra

- **Začetek**: Single race → *Endless traffic* → odprta cesta (seznam samo odprtih cest) → avto (kot pri drugih načinih; vsak avto iz voznega parka). Leteči štart ~120 m po štartni črti pri ~80 km/h, brez tekmecev (`nAI` 0), brez duha, zastav, boksov in policije.
- **Promet**: mešanica vozil brez kolesarjev in pešcev (avto 62 %, kombi 16 %, avtobus 6 %, motor 8 %, tovornjak 8 %; kot `opts.tfCars`), zato nihče ni povožen in ni kazni +5 s. Vozila živijo v **oknu okoli igralca** (od 400 m za njim do 1600 m pred njim): kar ostane zadaj, se vrne naprej, novo vozilo se pojavi vsaj 300 m pred igralcem (dlje od risanja, 250 m) in nikoli na drugem vozilu. Število je tako omejeno (pri 4-kratni gostoti ~60 vozil).
- **Gostota**: na začetku kot v dvoboju (navzgor eno vozilo na ~290 m, navzdol na ~250 m), nato +20 % na vsak prevožen km do 4-kratne (pri 15 km); na zaslonu majhen napis *PROMET ×2,2*.
- **Konec ceste** (`neskoncna-2`, priporočena možnost 1): ~60 m pred ciljem kratka zatemnitev (0,5 s), avto se nadaljuje ~120 m po štartni črti iste ceste z isto hitrostjo, promet v oknu se postavi znova (z gostoto, ki jo je vožnja dosegla; nič v 150 m okoli igralca), točke in niz ostanejo, napis *ODSEK 2*. Svet ostane isti, nalaganja ni. Na enosmerni Irohazaki enako.
- **Trk**: vožnja se konča ob dogodku `'crash'` s prometom (sunek nad 3 m/s, isto merilo kot zdaj), ob udarcu v ograjo ali steno nad mejo (`hitWall`, meja se določi v testih, okoli 6 m/s), ob prevrnitvi ali padcu s ceste (reševanje na cesto). Rahel dotik (manjši sunek, drsenje ob ograji) samo prekine niz. Po trku kamera še ~2 s gleda nesrečo, nato rezultati.
- **Rezultati**: točke, prevožena razdalja, tesna prehitevanja, najdaljši niz, najvišja hitrost, čas; *NOV REKORD!* in lestvica 10 najboljših za to cesto; gumbi *Again* (ista cesta in avto), *Change road*, *Menu*.
- **Pavza**, zvok in vreme kot pri drugih načinih (dež je težji, rekord je skupen).

## Točkovanje (začetne vrednosti; uglasitev med testiranjem)

- **Hitrost**: vsak meter nad 60 km/h da (v − 60) / 40 točke (100 km/h: 1 točka na meter, 140 km/h: 2, 180 km/h: 3). Na 4 km pri ~140 km/h je to ~8.000 točk.
- **Tesno prehitevanje ali srečanje**: ko greš mimo vozila (prehitiš ali srečaš), se izmeri najmanjši bočni prostor med karoserijama. Pod 1,0 m pri vsaj 70 km/h in brez dotika: *TESNO!* +200 × (hitrost / 100 km/h); pod 0,5 m: *ZELO TESNO!* +500 × (hitrost / 100 km/h). Pri prehitevanju mora biti razlika hitrosti vsaj 20 km/h (vožnja ob vozilu ne šteje večkrat).
- **Niz**: tesno prehitevanje v 5 s po prejšnjem dvigne množitelj (×2 … ×5) za bonuse tesnih prehitevanj; 5 s brez novega ali rahel dotik ga ponastavi. Napis *NIZ ×3*.
- **Nasprotni pas** (`neskoncna-3`, priporočena možnost 1): ko je sredina avta več kot 0,5 m čez sredinsko črto (na dvosmerni cesti), so točke za hitrost dvojne; na enosmerni Irohazaki tega ni.
- **Zaslon**: točke velike zgoraj na sredini (pokonci pod zemljevidom, po pravilih postavitve v `docs/igra.md`, »Zgoraj levo« in »Napisi med dirko«), niz in kratki zlati napisi bonusov (*TESNO! +240*) z obstoječim `showMsg`; hitrost kot zdaj.
- **Rekord**: `records.tracks` pod ključem `<id>-endless@<fizika>` (`recKey` z novim načinom): `bestScore` in `board` (10 najboljših: ime, avto, točke, razdalja, tesna prehitevanja, najvišja hitrost, datum). Gre v izvoz profila in samodejne kopije kot drugi rekordi (`js/shramba.js`).

## Meni

- **Izbira načina**: nova ploščica *Endless traffic* (podnapis »Denser and denser traffic on the open road. One crash ends the run.«, oznaka *BEST 48 210* ali *NEW*, slika `assets/menu/mode-endless.webp` s kamere za avtom v prometu, brez HUD-a). V `js/menu.js` gre v `MODES` za *Traffic duel* in v preslikavi `GAME_MODE` / `MENU_MODE` (`endless` ↔ `'endless'`).
- **Izbira proge**: v tem načinu samo odprte ceste (kot pri dvoboju). Način ne zahteva sprememb 19 datotek prog: velja za vsako progo z `'traffic'` v `def.modes` (manj sporov z razdelitvijo prog, #319).
- **Hitri vstop**: `index.html?proga=<id>&nacin=neskoncno` (testi in orodja; opis v `tests/README.md`).
- Meni mora delovati pokonci in ležeče (360 × 640, 640 × 360): `node tests/browser/menu.test.mjs`.

## Prevodi

Napisi med vožnjo gredo skozi `tr()` s slovenskim ključem in angleškim prevodom v `js/lang.js` (`tests/lang.test.js` jih preveri): *TESNO!* (CLOSE!), *ZELO TESNO!* (VERY CLOSE!), *NIZ ×{n}* (COMBO ×{n}), *ODSEK {n}* (STAGE {n}), *PROMET ×{x}* (TRAFFIC ×{x}), *TRK! KONEC VOŽNJE* (CRASH! RUN OVER), *TOČKE* (SCORE) in vrstice rezultatov. Meni je v angleščini (ploščica, podnapis, oznaka). Komentator: obstoječi `trafficCrash` ob trku, po želji 2–3 nove vrstice (nov rekord, dolg niz) v obeh jezikih.

## Testi

- **Node `tests/neskoncna.test.js`** (samo Core, simulacija, isto seme): na Vršiču (desna stran, dvosmerna), Chapman's Peak (leva stran) in Irohazaki (enosmerna): gostota raste po razdalji do meje; novo vozilo nikoli bližje kot 300 m pred igralcem in nikoli na drugem; število vozil ostane v oknu; tesna prehitevanja z narisanimi mimovoznimi (0,4 / 0,8 / 1,4 m prostora) dajo prave bonuse; niz se dviga in ponastavi; dotik nad mejo konča vožnjo, rahel dotik samo prekine niz; konec ceste ohrani točke, hitrost in niz; rekord pod `<id>-endless@cs`, lestvica urejena; isto seme da isto vožnjo z avtopilotom (3 km).
- **Brskalniški `tests/browser/neskoncna.test.mjs`**: pot v meniju (Single race → Endless traffic → samo odprte ceste → štart), točke in niz na zaslonu pokonci in ležeče, izsiljen trk → rezultati z rekordom, angleščina.
- **Obstoječi**: `tests/traffic.test.js` in `tests/police.test.js` ostaneta zelena (skupni razred `Traffic`: dvoboj in beg pred policijo se ne spremenita), `tests/lang.test.js`, `tests/browser/menu.test.mjs`, `node tools/stamp.js --check` (nova skripta v `index.html`).
- **Obremenitev**: `perf.test.mjs` dobi meritev neskončne vožnje pri 4-kratni gostoti na Vršiču (najtežja odprta cesta, Kranjska Gora) in na Big Suru; reference drugih prog ostanejo, ker način ne spreminja dirk.
- Pred potiskom `npm run test:related`; celotni nabori na GitHubu v pull requestu.

## Obremenitev telefona

- **Risanje**: promet je instanciran (en klic risanja za vsako vrsto vozila), vozila dlje od 250 m se ne rišejo. Pri 4-kratni gostoti je v 250 m okoli igralca ~15–25 vozil: ocena +0–5 klicev risanja in +100–200 tisoč oglišč glede na dvoboj; pešcev in kolesarjev ni (njihovi meshi ostanejo prazni). Meja proge ostane: do ~300 klicev in ~900 tisoč oglišč (`tests/golden/perf.json`), preveri `perf.test.mjs`. Če bi bilo preveč: pri gostoti nad ×3 vozila 150–250 m daleč brez koles in luči.
- **Računanje**: posodobitev prometa je linearna v številu vozil; okno okoli igralca jo omeji na ~60 vozil (v dvoboju je na 12 km Vršiča zdaj ~130 vozil in koles, zato je neskončna vožnja lažja od dvoboja). Brez novih predmetov v vsakem okviru (ponovna uporaba vozil iz okna).
- Druge proge in načini se ne spremenijo (koda se izvaja samo v načinu `endless`).

## Koraki in ocena ur (možnost 1)

| Korak | Kaj | Ure |
|---|---|---|
| 1 | Jedro (`js/core.js`, razred `Traffic` in `Race`): `opts.endless`, okno vozil, gostota po razdalji, nadaljevanje na začetku ceste, merilo trka, zaznava tesnih prehitevanj in nasprotnega pasu | 4–5 |
| 2 | Točke, niz, zaslon, rezultati in rekordi (nova datoteka `js/neskoncna.js`, kratki priklopi v `js/game.js`, `css/`) | 3–4 |
| 3 | Meni (ploščica, slika načina, izbira cest), hitri vstop, prevodi | 2–3 |
| 4 | Testi (Node, brskalnik, obremenitev), `docs/igra.md` (nov razdelek), `README.md` (Nov meni), `docs/kazalo.md`, `tests/README.md` | 3–4 |
| | **Skupaj** | **12–16** |

- Ena seja (Opus, napor max), ena veja `neskoncna-voznja/koda`, en pull request (osnutek ob začetku dela, nato vrsta po `docs/vrsta.md`).
- **Kdaj**: po odgovorih uporabnika in ko je #250 na `main`; pred novimi progami (vrsta v Načrtovano).
- Dodatno po izbiri: `neskoncna-1` 2 ali 3 (avtocesta) +35–50 h v 3–4 sejah (svoj načrt pred kodo); `neskoncna-2` 2 (naslednja prava cesta) +4–6 h; `neskoncna-3` 1 (nasprotni pas) +0,5 h.
- Pozneje po želji (ni v tem delu): dosežki za neskončno vožnjo, denar v karieri za točke, izziv s povezavo (»premagaj moje točke«), policija pri preveliki hitrosti, Živa cesta (#250) kot ovire.

## Odločitve

Vprašanja na strani Odločitve 3 (https://claude.ai/artifact/1jxNEJ27WiYpCAw3YbRXEV), odgovore prebere ta seja (`docs/vprasanja.md`, razdelek Odgovor):

- `neskoncna-1` **Cesta**: 1 prave odprte ceste (priporočeno) · 2 izmišljena neskončna avtocesta · 3 oboje (najprej prave ceste).
- `neskoncna-2` **Konec ceste**: 1 nadaljuješ na začetku iste ceste (priporočeno) · 2 nadaljuješ na drugi pravi cesti (nalaganje nekaj sekund) · 3 konec ceste je cilj (vožnja se konča z bonusom).
- `neskoncna-3` **Nasprotni pas**: 1 dvojne točke za hitrost na nasprotnem pasu (priporočeno) · 2 samo hitrost in tesna prehitevanja.

Privzeto brez vprašanja (pove načrt; uporabnik lahko spremeni): brez kolesarjev, pešcev, policije in tekmecev; vsak avto iz voznega parka; Živa cesta izklopljena; en rekord na cesto in fiziko (suho in dež skupaj); način v Single race; meje in vrednosti točk se uglasijo med testiranjem.

## Stanje

- 5. 11. 2026: tema v `docs/vrsta.md` (Načrtovano, #339); načrt in vprašanja `neskoncna-1`–`3` na strani Odločitve 3. Čaka na odgovore uporabnika; koda še ni začeta.
