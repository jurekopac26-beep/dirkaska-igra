# Uporabnikove izbire na slikah (v kodo šele po »začni«)
- G · boks za motokros ob črti — še ni izbran (6 različic, boxrow-page.js)
- Plaža: različica 4 (topla mivka + moker rob)
- Nagnjena ovinka: asfalt v skledi + zaplate mivke; mali krog ovinek 1 nagnjen asfalt; notranji rob rdeče-bel (6)
- F · zavoj 1 (polkrog), širši — čaka izbiro med 3 širinami (merge-page3)
- Motokros v makadamskem slogu + križišče J: **1 (makadam)** — mx-page3 + fixes-page7 J, window.__MXJ(0); obkroženi del (start ob cesti) raven, v višini ceste
- Priključek parkovne poti na cesto (bend) — uporabnik: »Lepše združi cesti«, »Naredi robnike tudi na novi cesti«, »Naredi ostale 3 robove kot je ta obkrožen«, »Popravi kjer sem označil« (stik robnikov na ukrivljeni cesti): join-page.js (zaobljeno ustje R 4 m v asfaltu ceste, robniki ceste okoli vseh 4 vogalov in 3 m ob poti, ustje in robniki sledijo ukrivljenemu robu ceste)
- Avto igralca: strani za brisanje ga ne smejo zložiti — carfix-page.js na začetku verige (keep na vseh avtih) in na koncu (popravilo, če bi bilo treba)

## Priključek parkovne poti na cesto (join3-page.js) — odobreno za kodo po »začni«
- Pot L1 seka cesto na zavoju (bend: lasten asfalt = vrste po 11 oglišč, u 0..1,55; robnika = odseki po 3 oglišča: notranji rob, zunanji rob, ustnik). Ne glavne proge T.
- Robnik se odreže pri svojem odseku ~5 m za robom poti (zložijo se cele trikotniške dvojice), novi robnik začne v istih treh točkah (višina, uv, barve) in zavije po kubični Bézierovi krivulji (tangenta rob ceste → rob poti), nato še 4 m ob poti (pojemanje).
- Ustje: vrste od 2,6 m znotraj ceste (pojemanje) med obema krivuljama do poti; uv in barve oglišč vzete iz vrst ceste (brez šiva). Vse ploskve obrnjene navzgor (sicer temne pri DoubleSide).

## Vulkan (uporabnik: »naredi da vulkan nima dima samo lava se premika«) — za kodo po »začni«
- Brez dima, pare in letečih kamnov. Premika se samo lava: tekstura (žareče proge + temna skorja) drsi po tokovih navzdol (jedro hitreje), jezero v kraterju se počasi vrti, mehurčki rastejo/pokajo, sij utripa (lava-page.js). Samo premik teksture → poceni za telefon.

## Odločitev o premikajočih se elementih (vprašanje uporabnika o telefonu)
- Premikanje (gradbišče, lunapark) dodamo na koncu, ko bo mapa dokončna; animirano samo blizu avta in v pogledu; čim manj ločenih premičnih delov; izmerimo s testom hitrosti (~300 klicev risanja).

## Gradbišče v levem spodnjem kotu (site-page.js), 15. 10.
- Uporabnik: "Zbriši ta dva kupa peska" → kupa ob cesti (mound1, mound4) sta odstranjena, ostaneta mound2 in mound3.
- "Zgradba je na cesti. Popravi" → zgradba in žerjav sta postavljena s spot() znotraj gradbišča (−297, 305) / (−285, 305).
- "Zbriši travo med gradbiščem in cesto" → zemlja gradbišča gre čez pas ob cesti (2 celici peska, pod pesek ceste; mehki rob peska leži na zemlji)
  in do ograje na koncu mape (x −352, z 316). Mehka je samo še na vzhodnem koncu (proti travniku). Zemlja je zdaj na mreži 1 m in leži 5 cm nad
  terenom (ne nad gladko funkcijo tal), da trava travnika ne prodre skozi; bilke travnika (nizke dvostranske v nv-baked) so z gradbišča odstranjene.
- Za kodo pozneje: zemlja je prosojna (renderOrder 0.5: pred mehkim robom peska (1), za temnimi pasovi travnika (0)), brez polygonOffset.

## Odločitve uporabnika (15. 10., serija sporočil) in kaj je narejeno v slikah
- "Ni dobra nova grafika. Pusti tako kot imamo" → grafika ostane, kot je (sloge 15-* opustiti).
- "Reševalna baza" → helidrom B. "Helikopter naj bo samo eden in to tovorni ..." → heli3-page.js: asfalt čez celo staro gradbišče do roba proge (nizki rdeče-beli
  robniki ob robu), en tovorni helikopter z dvema rotorjema na velikem H v ravnem asfaltu, zadaj vedno odprt (rampa), postaja REŠEVANJE z rešilci, sledi drifta,
  pot do boksov (route 0) ob vzhodnem robu s črtkano črto; 10 slik (vse15-novo/02-helikopter-10-slik.jpg). Vprašanji v sliki: sprednja vrata? kje pristaneš?
- "Stavba na gradbišču naj bo na zemlji visoki toliko kot je cesta" → vprašanje v sliki A (kot zdaj) / B (nasip 5,4 m z zidom in klančino), čakam odgovor.
- Palisada okoli novega gradbišča (3) in "E1 v barvah proge enduro" (3) → vse15-novo/05, 06; čakam izbiro.
- Stekleni most (3) → vse15-novo/07 (stari most __BRV skrit); čakam izbiro.
- "Naredi črtkane črte da se ve kje poteka glavna cesta" → join4-page.js: rob glavne ceste črtkan čez obe ustji parkovne poti (vse15-novo/08).
- "5 nizko rdeče beli robniki" / "Ogeada 5. Nizki" → izbrana različica 5 (nizki rdeče-beli robniki) za ograjo parkirišča.
- Gondola za avte (brez boksov, vrata, menjava kabin) je bila že narejena (gond-page.js, vse14-novo/03).
- Opomba za kodo: ploskve tik nad asfaltom s polygonOffset −3 se lahko skrijejo (globinski zamik); prah helikopterja ima zato polygonOffset −14.

## 2026-10-15 · helikopter 3 verzije, popravki na Mapi 2, 3 in 6 (samo slike)
- Helikopter (heli4-page.js, na helidromu reševalne baze): 1 tandem z dvižnim nosom (vizir), 2 en rotor + rep, vrata na nosu na dve strani, 3 koaksialni z dvema repoma, odprt kot trajekt. Vsi z rampo spredaj in zadaj (avto noter zadaj, ven naprej ali vzvratno), več detajlov (sedeži, tirnice, vitlo, ogledala, tečaji ramp, pasovi na repu). Čaka izbiro uporabnika.
- Mapa 2 (prekrižan krog): pesek čez cesto je newmap.js crossBand (pot čez dirkališče, par koncev); zahodni del poti ni več viden (motokros) → v kodi: tega para ne delaj (ali odstrani zahodni del poti iz H3.net), robna črta krožne ceste tam cela (sandfix-page.js).
- Mapa 3 (krožna cesta nord v dirkališče ob plaži): ustje z zaobljenima robovoma R 9 kot na drugem koncu (fixes-page7 I), asfalt dirkališča, prehod v asfalt krožne ceste 9 m, črtkana črta; stari temni klin (opaque keep mesh strani) skrit (join5-page.js).
- Mapa 6 (6 modrih oznak): izvoz pasu rdeče garaže z gladko krivuljo (asfalt pasu uv x/7, z/7) in belo črto, zebra (svetla/rdeča/sivo-zelena) med dirkališčem in pasom, robna črta cela/črtkana čez izvoz, brez peska stare poti p11 (spill + količek), brez rjave konice otoka, barva dveh preplastitev ob otoku zlita (join6-page.js).

## 2026-10-15 · odločitve uporabnika (12:2x)
- Stavba na gradbišču: B (ploščad na višini ceste).
- Palisada: 2 »temno zelena varnostna«, a ena neprekinjena ograja od začetka do konca, kot ograja ob dirkališču, dvignjena na višino ceste, med cesto in ograjo pesek → 3 verzije.
- Stekleni most: 1 »steklena cev«, 3 verzije s popravljenimi stopnicami (do začetka na vrhu mostu).
- Mivka ob progi naj bo enaka kot na plaži (brez vidne meje) → 3 opcije.
- Združi motokros cesto z dirkalno cesto.
- Helikopter: 1 (dva rotorja, nos se dvigne), izvoz spredaj ostane. Ko zapelješ vanj: meni s 3 možnostmi (kot pri boksih: 1 reševanje na vodi, 2 še eno reševanje (predlagaj 3), 3 prosta vožnja) in spredaj se odpre rampa; brez izbire pelješ naprej. Rotorja se zaženeta šele ob izbiri, takoj vzleti do stalne višine; nad gumbi desno spodaj gumb PRISTANI HELIKOPTER ↔ DVIGNI SE. 3 verzije v barvi, ki ni bela; slike iz igralčeve perspektive.

## 2026-10-15 · palisada, mivka, motokros (samo slike)
- Palisada 2 kot ena ograja (pal3-page.js, window.__PAL3(k)): 331 m ob krožni cesti nord od lasnice (indeks 664) do JV konca (870), na strani gradbišča
  (stran izbrana po starih panojih), 4,2 m za robom ceste (hw + 4,2), noga v višini roba ceste (zglajeno), med robnikom in ograjo pesek; stara ograja
  (oranžni panoji in vse 3 palisade) skrita v celoti (__SPAL(9)). Verzije: 1 na pesku + nasip, 2 betonski zid 0,9 m + palisada 2 m, 3 lovilna 3,4 m +
  jeklena odbojna ograja. Poslano: vse15-novo/13-gradbisce-ograja-3.jpg, čakam izbiro.
- Mivka ob progi = plaža: uporabnik (ob lasnici na zahodu): »tukaj naj ostane prejšnja verzija mivke, ker smo daleč od morja … bolj ko je oddaljena od
  morja, bolj je podobna tej mivki … prehod naj bo dolg in mehak«. → sbeach2-page.js (window.__SB2(k)): stari pesek izletnih con ostane, čez njega
  plast barve plaže (0,543; 0,463; 0,343 – barva, kot se plaža vidi, ne beachSet 0,72/0,62/0,46, ker je plaža večinoma 0,1–0,2 m nad vodo in
  potemnjena), prosojnost = 1 − smoothstep(d0, d1, razdalja od plaže); opcije d0/d1: 10/480, 80/360, 30/240 m. Razdalja od plaže: oglišča plaže
  (C.userData.orig) na mreži 4 m + chamfer. Peščene izletne cone: v nv-baked H3.roHit, v slikovnih (keep) mrežah po barvi (r ≥ 0,98, r ≥ g ≥ b,
  r − b 0,03–0,14); sredine makadamskih poti (dirt/forest, hw − 0,6) ostanejo makadam. V kodi: barva izletnih con v newmap.js po razdalji od morja.
- »Združi motokros cesto z dirkalno cesto« → vprašanje v sliki (vse15-novo/14): A južni zavoj motokrosa ob cesti (izhod iz tunela) ali B severno
  križišče J; čakam odgovor.

## 2026-10-15 · motokros (odgovor na vse15-novo/16)
- »motokros b« → motokros se z dirkalno cesto združi samo na mestu B (severni start, staro križišče J); A (južni zavoj ob izhodu iz tunela) ostane, kot je. Verzija pri B (1 makadam / 2 asfalt z robniki / 3 široko) — vprašal, čakam.

## 2026-10-15 · voda ob krožni cesti (»Popravi vodo«, rdeči krog na ustju kanala) — samo slike
- water3-page.js (window.__W3(1); 0 = kot prej, water2): tla ob vodi ena gladka ploskev (mreža 1 m, material tal: ploskev z barvami oglišč + trava
  s teksturo, mešano po oglišču), voda ena gladina (mreža 1 m, 1 cm nad gladino, narisana pred morjem; morje samo ostane, kot je).
- Področje: kanal (od lagune do morja, tudi pod mostom), cela laguna (predlog 0, z otočkoma), vse luknje, ki jih je jetski izrezal (vsi trije predlogi),
  in obala JV morja od ustja do roba mape (črta obale 2 m od roba poligona morja, zglajena; travnik se spusti na ozek pesek, pod vodo pobočje do dna).
- Višine: brana s starih tal (zgornja ploskev; pesek izletnih con, kjer leži na vrhu), luknje zapolnjene s kopnega; kanal in laguna vrezana z gladkim
  minimumom (zaobljena brega); kopno, ki je bilo suho, ostane suho (nad vodo vsaj 3 cm + 5 cm/m od roba). Barve: pod vodo po globini (kot dno morja),
  ob vodi moker → suh pesek, naprej barve tal (trava s teksturo ali brez, kot je bilo).
- Stara tla v področju zložena (vsi kosi, tudi oddaljeni: prej razkriti, ker igra skrije oddaljene kose terena). Prosojne plasti (trava, pesek) se
  premaknejo s tlemi in izginejo nad vodo (brez senc), neprosojni kosi na tleh se ne premikajo, izginejo nad vodo in ob bregu; kar je stalo v novi vodi
  (stebrički stare ograje go-kart steze), izgine. Star popravek water2 skrit v celoti.
- V kodi pozneje: newmap.js waterSide (obala iz poligona morja: zglajena črta, pobočje, ne celice 2,5 m) in jetski kanal/laguna kot ena višinska mreža.
- Poslano: vse15-novo/17-voda-kanal-obala-laguna.jpg (prej / zdaj).

## 2026-10-15 · kmetija na SV ob morju (samo slike)
- Risba na severnem pasu (rdeče = kmetija, hiša ob severnem robu, svetlo modra črta = makadamska cesta ob severnem robu, prečrtan pesek ob križišču)
  → coastne-page.js (obala ob kmetiji zglajena kot na JV, window.__CNE) + farmne2-page.js (window.__FNE(k)).
- Popravki obale: pomol (in drugi majhni predmeti, ki stojijo na tleh) se ne šteje za tla (prej je bil zložen in vtisnjen v teren); nova ploskev tal pokrije
  vse zložene stare trikotnike (veliki trikotniki trave segajo do 11 m, hriba do 24 m čez področje → prej luknje, skozi katere se je videlo nebo).
- Na sliki polj obkrožen svet zahodno od njiv: »Naj kmetija še tukaj ima poljedelstvo« → njive v vseh treh verzijah: pasovi vzhod–zahod, kot obstoječe njive
  (isti pasovi, kjer se stikajo), severni pas ob cesti, zahodni konci 3 m od peska izletne cone (H3.roHit).
- Na sliki pašnikov: »Dodaj še živali kmetiji« → živali v vseh treh, različno postavljene: 0 ob morju (južno od poti k pomolu), 1 ob dvorišču (s ribnikom),
  2 onkraj ceste (dolg pašnik severno od makadamske ceste, s hlevom). Ribnik ni več bel (neprozorni modri krogi namesto zrcalne vode).
- Na sliki »verzija 1 · dvorišče« dve dolgi potezi od ovinka proge čez njive do poti ob morju: »Združi poljedelstva v dve dolgi njivi« → farmne3-page.js:
  dve dolgi njivi ob eni rahlo ukrivljeni črti (od x −86 do 48), vsaka od nje (0,75 m) do roba zemlje (makadamska cesta 7,3 m od sredine, dvorišče,
  pesek izletne cone 1,5 m, pot), največ 14 m široka; severna od x −51, južna od x −68 do poti (~100–114 m dolgi). Brez malih njiv (A, B, pasovi).
  Verzije: 1 pšenica + koruza, živali ob morju; 2 oljna ogrščica + pšenica, živali onkraj ceste (krave z ribnikom), ob morju travnik z balami;
  3 preorana (traktor) + seno (bale), živali ob morju in onkraj ceste. Obala: krošnje dreves se ne štejejo za tla (prej temni »stožci« v tleh).
  Poslano: vse15-novo/18-kmetija-njive-zivali-3.jpg, čakam izbiro.

## 2026-10-15 · odgovori (samo slike, koda šele po »začni«)
- Stekleni most: »Most 1 spiralne stopnice« → verzija 1 (spiralne stopnice v steklenem stolpu, vse15-novo/12).
- Kmetija: »Verzija 3« (vse15-novo/18) + »Zakrivljene in ravne njive naj se združijo v eno veliko njivo«, »Poljedelstvo naj se vse združi v eno«,
  »Živali naj imajo večji prostor, naj bodo vse do ceste«, »Živali naj bodo vse do druge kmetije«, »Naj bo kmetija bolj podrobno narejena«.
- Mivka: »4 opcija. Prehod med različnimi mivkami naj bo mehak« → različne mivke ostanejo, kjer se stikajo, mehak prehod (nova, 4. opcija k vse15-novo/15).
- Helikopter: ko zapelješ noter, je prosojen (kot na sliki); ko klikneš eno od 3 možnosti, v 1 s (popravek: ne 0,5 s) postane polno viden, avta se
  potem ne vidi več. Gumb DVIGNI SE: večji, enaki robovi in oblika kot PLIN in ZAVORA, širok od levega roba zavore do desnega roba plina, moder.
- »Popravi napake«, »Grafično polepšaj prehode«; nato 9 slik mape od zgoraj (posodobljenih) in 12 slik igre prvih 5 minut.
- Vprašanja o času: po sklopih (1 zemljevid ob morju ~1,5 dni, 2 kmetija ~1 dan, 3 proga in okolica ~1,5 dni, 4 helikopter ~1,5 dni, 5 avtošola
  27 nalog ~2–3 dni); slike do 16. 10. zvečer; na mainu sklopi 1–4 okoli 22. 10., vse okoli 24.–25. 10. (če začneva zdaj).
- Kmetija verzija 3 narejena (farmne4-page.js, vse15-novo/20): ena velika njiva (od x −88 do 37, ~130 m), pašnik onkraj ceste od x −83 (ob
  ograji druge kmetije) do 40, ograja 6,4 m od sredine makadamske ceste, do z −399,5 (krave + ribnik, konji + hlev, ovce + zavetje, 3 drevesa);
  pašnik ob morju od poti (1,5 m) do z −290, od x 13 (pesek proge) do plaže. Podrobnosti: veranda, polkna, dimnik, vrt z gredicami, vodnjak, pasja
  uta s psom, drvarnica, kurnik s kokošmi, prikolica z balami, kupola, senik in pristrešek na skednju, pasovi na silosih, živali z glavami/repi.
  Njiva: 1 oranje (traktor s plugom), 2 žetev (kombajn, kolotečine, traktor s prikolico), 3 seno (bale, preša); čakam izbiro.
- Helikopter: poslano vse15-novo/19 (prehod 0–1 s, gumb DVIGNI SE v 3 odtenkih modre, PRISTANI enake oblike); čakam odtenek.
- Mivka 4. opcija: sbeach4-page.js (__SB2(3): FADE [2, 22] m od plaže). Popravki prehodov (trans-page.js, __TRF): mehke barve tal ob obali in laguni
  (water3/coastne: barve z mreže 1 m zamegljene čez ~2 m, samo kjer so tla v celoti nova), krošnje dreves niso tla (water3: brez gomile ob laguni,
  drevesa ostanejo), rumen trikotnik v travi med ovinki izginil, svetla ravna tla na JV: mehak pas njihove barve 7 m čez progasto travo, pot od
  lagune do proge: pas makadama z mehkimi robovi čez stopničaste celice. Poslano: vse15-novo/21-mivka-4-in-prehodi.jpg in 22-M01..M10 (mapa).

## Prvih 5 minut igre (12 slik) — poslano
- vse15-novo/23-prvih-5-minut-pregled.jpg (pregled po vrsti) + 23-P01 … 23-P12 (posamezno, z napisom časa).
- 0:00 nalaganje · 0:15 začetek (pot proti HOME čez laguno) · 0:30 krožna cesta · 1:00 esovki · 1:30 nagnjen ovinek ob morju · 2:00 predor · 2:30 kmetija (pašnik) · 3:00 motokros · 3:30 avtošola · 4:00 v helikopter (prosojen) · 4:10 meni nalog · 4:30 let nad lunaparkom.
- Naslovnega menija ni (orodje ga ne izriše). Začetna točka igre H3.home (−8,2; 200) je v sliki zdaj na lesenem mostičku čez laguno z vodnimi skuterji.

## Odgovor: njiva 3 (16. 10.)
- Uporabnik: »njiva 3« → Njiva 3 · seno (list 20): zahodni del pokošen z balami, vzhodni pokošena trava v vrstah, traktor z balirko.
- Na slikah od zdaj __FNE(2) (prej __FNE(1)); v kodo po »začni« (sklop 2 Kmetija).
- Še odprto: odtenek gumba DVIGNI SE (1/2/3), barva helikopterja, priključek motokrosa pri verziji B (1/2/3), palisada (list 13), začetna točka (mostiček čez laguno ali pred garažo HOME).

## 16. 10. popoldne · nova serija sporočil (samo slike, koda po »začni«)
- »ali mi lahko daš še enkrat slike, na katere nisem izbral opcije« → pošlji vse odprte liste + kazalo.
- »2. en velik rotor in rep« → helikopter = verzija 2 z lista 09 (namesto 1): en velik rotor + rep, vrata na nosu na obe strani.
- »pri free flight izbriši procente, zbriši pavzo v menuju, pavzo in fotoaparat postavi povsem desno. Sprememba helikopter naj bo rdeč z belim
  križem in 1 rotorjem« → barva = rdeča z belim križem (odgovor na barvo); meni: FREE FLIGHT brez »0 %«, brez gumba za pavzo v glavi menija;
  #btn-pause in #btn-cam (ležeče) povsem desno (zdaj levo od zemljevida #h-map; v kodi zemljevid levo od njiju).
- Na 23-P02: »zbriši levi del pomola (zeleno), zbriši hiško na poti do glavne ceste (modro), namesto hiške naj pelje makadamska cesta (rdeče),
  zbriši stebričke v vodi (rdeče)« → jetski BLD[0]: pontoon(-8,186,18,3) brez levega dela, boathouse(-8,168) stran, makadam od mostu do ceste,
  boje (buoys B8) stran. Laguna (predlog A) torej ostane.
- Na 23-P03: »popravi ceste, ko se združujejo v eno, da bo prehod mehkejši, popravi, da ni avto prosojen« → (125,159): krov jetski mostu
  (c9a98a0, uv svet/6) proti krožni cesti (e0dde5 + barve oglišč, uv /8) in svetel pas nv-baked n254 (x −1,4..124,7, z 142..154) ob parkirišču.
  Avto: zložile so ga strani po verigi (water3/coastne/farm/trans) → carfix-page.js na konec verige.
- »takoj ko se helikopter začne dvigovat, se prikaže gumb PRISTANI HELIKOPTER; če klikneš PRISTANI, se helikopter takoj začne spuščati«.
- »zgoraj levo dodaj informacije, kot sta višina in hitrost helikopterja, ko ga voziš«.
- Na 23-P04 (−14, 294): »zelena: združi pot in izletno cono; modra: naredi mivko, da je tako nanešena na glavno cesto, saj avti tam peljejo iz
  makadama na cesto in za seboj puščajo sledi makadama; popravi, da avto ni prosojen« → ustje poti HOME (forestPts (−8,5; 292,7)) zlij s peskom
  izletne cone, sledi peska po cesti zavijejo levo (zahod) in pojemajo.
- Sliko 6 (predor): »popravi, da avto ni prosojen« (isti vzrok kot zgoraj: carfix na koncu verige).
- List 21, zelene črte: »z zeleno sem narisal, kako naj gre mivka, da bo lepše« → mivka ob progi do črt (svetovne koordinate v
  green-world.json; a, b S0; c, d S1; e S3; h WC; i, j WD; m, n, o, p M09; f, g, k: makadam poti HOME do mostu; l: pot in izletna cona združeni).
- List 21, rdeča območja: »z rdečo sem narisal, kje vse dodaj mivko tako kot je ob cesti za izletno cono, da se ne bo videlo, da je druga« →
  r1–r6 ob kanalu (S2), r7, r8 ob poti HOME (WA): mivka izletne cone.
- Slika 5 (nagnjen ovinek ob morju): »popravi, kar je z rdečo obkroženo« (temen trikotnik in temna črta v mivki ob notranjem robniku) + avto.
- List 20 (njiva 3 · od zgoraj): »z rdečo sem označil, kje naj bo njiva zelena in kje naj bodo že narejene bale« → obkrožen del (zahodni del
  in južni pas do JV konca) zelen, pokošen, z že narejenimi balami; del ob dvorišču ostane z vrstami in traktorjem s prešo.
- Slika 7 (kmetija): »z rdečo sem označil, do kam naj bo ograja za živali, z zeleno, kje naj bo še mivka oziroma pesek oziroma izletna cona« →
  pašnik do ceste (ograja podaljšana zahodno do roba ceste), 4 zelena mesta v pesek izletne cone.

## 16. 10. zvečer · narejeno v slikah (vse16-novo), koda po »začni«
- Oznake na slikah: notranjost obrob je bila zaradi napake zapolnjena kot pravokotnik (mivka oglata) → popravljeno (topmarks.py/marks.py: prost rob okoli poteze; mkregions.py: zapiranje vrzeli 2 m). Mivka zdaj sledi tvojim obrobam (Mapa 2, slika 8, slika 7, list 21).
- Plaža (Mapa 3): po zeleni obrobi, barva kot plaža, ustavi se 0,5–1,8 m pred ograjo pašnika. Pašnik ob cesti (slika 7): ograja do roba ceste (prej po pomoti izklopljena).
- Garaža motokrosa (Mapa 2): tik ob glavni cesti (premik 9,2 m), brez mivke vmes.
- Gradbišče (Mapa 8): modra oznaka je ozek pas (dve potezi do SV konice) = temen breg med peskom ceste in gradbiščem → zemlja gradbišča (pal4-page.js, __S8X). Ograja po rdeči črti od zahodnega roba mape okoli lasnice do x −123, pesek v barvi izletne cone med robnikom in ograjo; 3 verzije (__PAL4(k)), izbira odprta (list 25-A).
- Avtošola (lot2-page.js, __LOT2): bela črta med vrstama parkirnih mest (vsako dolgo mesto = 2), luči na tej črti na vsakih 6 mest in na koncih vrst, parkirani avti narejeni na novo (prej so se videli samo delčki). Slika za »pesek na avtošoli« ni prišla → pesek ni brisan; pošlji sliko še enkrat.
- Helikopter (heli8-page.js): verzija 2, rdeč z belim križem (večji, 1,8×); meni brez pavze, FREE FLIGHT brez %; DVIGNI SE prosojno moder, PRISTANI enake oblike, v obeh ikona helikopterja s puščico; PRISTANI takoj, ko se dvigne (f4, lift); zgoraj levo VIŠINA in HITROST; pavza in fotoaparat povsem desno (ležeče: zemljevid levo od njiju, v kodi #h-map in stolpec pod njim right + 52 px).
- Nalaganje pokonci: logotip APEX RACING (kot naslovnica), pogled na mapo z vzhoda, kartica in vrstica napredka spodaj.
- Odprte izbire (list 25-00 kazalo): A ograja gradbišča 1/2/3, B 2. naloga helikopterja A/B/C, C začetna točka A/B, D priključek motokrosa 1/2/3, E zavoj 1 širina, F barva zemlje gradbišča, G boks motokrosa.

## 17. 10. · odgovori uporabnika na kazalo 25-00
- »a1« → ograja gradbišča: verzija 1 (pesek do ograje + nasip, palisada 2,5 m) = __PAL4(0).
- »b2« → helikopter, 2. naloga v meniju: B FIREFIGHTING (morska voda na gozdni požar) = ALT2[1].
- »ca« → začetna točka: A, na mostičku čez laguno (kot zdaj, H3.home).
- »f3« → zemlja gradbišča: verzija 3 (temnejša s kolesnicami ob poteh) = __SEARTH(2).
- »e1« → zavoj 1: verzija 1 »malo širši« = __MRG(0) (kot zdaj).
- G: »boks naj bo bližje cesti, da lahko iz ceste zapelješ direkt v boks, brez da bi povozil pesek« → box3-page.js (__BOX3): boks obrnjen (odprta stran, ki je gledala proti motokrosu, zdaj proti krožni cesti), rob na robu ceste (0,15 m), makadamski pasovi pred njim skriti, kratek asfalt iz ceste v boks.
- D (priključek motokrosa pri B) še odprt.
- Nove oznake na Mapah 2, 3, 5, 8, 9, 10 (rdeče = dodaj mivko, zeleno = odstrani) → marks17.py (razlika s sliko mape, nato obrobe) + fix17-page.js (__F17).
- »vzemi si čas, popravi povsod mivko in plažo, da bo lepo izgledalo, predvsem prehode na križiščih; ko boš vse naredil, naredi še razne popravke in popravi nepravilnosti, nato naredi novih 9 slik od zgoraj celotne mape«.

## 17. 10. zvečer · mivka, plaža, križišča (v slikah, vse18-novo), koda po »začni«
- Oznake 17. 10.: 23 rdečih območij mivke, zelena: trava čez luknje in jezike mivke, morje čez svetel kvadrat (Mapa 3), predmeti v zelenih obrobah odstranjeni (fix17-page.js, __F17).
- Luknje v tleh (nebo skozi teren, 21 mest: gozdna pot, Mapa 5 in 8, ob laguni) zakrpane z barvo okolice (holes-page.js, __HOLES).
- Podaljšana plaža na Mapi 3 v isti barvi kot stara plaža (prej presvetla).
- Čiščenje tal na 12 območjih (jmask.py → jn-page.js, __JN): meja mivka/trava zglajena (brez stopnic 2 m in zob), barve mivke in trave zglajene (brez temnordečih madežev in rumenih lis), majhni otočki trave v mivki in pikice mivke v travi odstranjeni; sence, sledi gum, asfalt, robniki, voda in predmeti ostanejo. Območja: križišče motokrosa (Mapa 2), izteklina ob kmečki poti (Mapa 2), priključek kmečke poti (Mapa 3, klin trave → mivka), križišče pri gumah (Mapa 3), motokros in izhod iz tunela (Mapa 5), priključek ob avtobusu (Mapa 5), makadam pri hiški (Mapa 8), vse južno od lagune (Mapa 9), trava/mivka/plaža ob morju (Mapa 10).
- Sivi pahljači ob postaji gondole in siv trak južno od lagune odstranjena (fans-page.js, __FANS).
- V kodi (po »začni«): namesto slikovne plasti popraviti vir — mrežo barv terena (2 m → gladke meje), maske izteklin (roHit) in prehode poti v izteklino s smin (zaobljeni koti), plažo s skupno barvo.

## 17. 10. ponoči · svetla mivka, makadam, plaža, ena trava (v slikah, vse19-novo), koda po »začni«
- Oznake na Mapah 2, 3, 5, 8, 9: zelena = svetla mivka izletnih con, rdeča = temnejši makadam za vožnjo (marks18.py → mk18.py → mk18-page.js, __MK18). Mapa 2: makadam od proge do vzhodne poti in široko proti hribu; Mapa 3: makadam od ovinka do kmetije in od zahodne poti do proge; Mapa 5: makadam od motokrosa do proge; Mapa 8: nova makadamska cesta od proge do hiške.
- Vse makadamske poti (razen motokrosa in poti v snegu) so temnejši makadam (~ 206,144,107 na ravnem), izletne cone svetla mivka (~ 250,178,128); med njima mehak prehod 2–3 m.
- Plaža severno od parka (Mapa 3): barva in potek kot prava plaža ob njej (temnejši moker rob do ~7 m od vode, svetel pas 8–18 m, nato suha mivka), 7 senčnikov s sencami (kopije s plaže), mivka plaže do asfalta (bx-page.js __BX, bxp-page.js __BXP).
- Ena trava po vsej kopni mapi: travnik s pokošenimi pasovi (~10,6 m), barva 90,132,72; polja ob kmetijah in otoki ostanejo (gr18.py → gr18-page.js, __GR18).
- Morje zglajeno (brez kockastih svetlih robov okoli otokov), obala brez zob (sea18.py → sea18-page.js, __SEA18); nebo na robu mape in 3 majhne luknje zakrpane (edge-page.js, __EDGE18).
- Ostane: temnejša stara mivka ob progi daleč od plaže (izbira 4) — če naj bo tudi tam svetla, označi.
- V kodi: barve po površinah v newmap.js (makadam / izletna cona / trava kot en material z enim tonom), plaža po razdalji od vode, morje brez mreže 4 m.
- Po pregledu (9 pregledov po delih mape, vse20-novo): makadam temnejši povsod tudi na pobočjih (barva kot stare poti), svetla mivka en ton povsod; zelene oznake imajo prednost pred makadamskimi trakovi poti, rdeče pred zelenimi; oznake polne tam, kjer so narisane (tudi tanke poteze), robovi mehki 3–5 m; ozke vrzeli trave ob novih površinah zapolnjene; mivka ne sega na asfalt; tekstura zasukana (brez pikčaste mreže).
- Ograji odprti, kjer sta šli čez novo makadamsko cesto (Mapa 3 ob notranji cesti) in čez kmečko pot (Mapa 2/3); odstranjeni ostanki trakov in palic stare zanke SV od hriba (gap2-page.js, __GAP).
- Ena trava tudi na otokih, na dveh dvignjenih zelenicah krožišč in čez krov predora; pasovi trave usklajeni s pasovi terena (11 m); stara rjava tla odstranjene zanke SV od hriba in peščene pike v parku → trava; vlakec v parku dvignjen nad travo (lift-page.js); zaplate na robu mape s teksturo in pasovi trave.

## 18. 10.: mehkejši prehod med svetlo mivko in temnejšo zemljo ob startu motokrosa (Mapa 2)
- Obkroženi del ob startu motokrosa (x ≈ −335 … −275, z ≈ −256 … −216): ostra črta med svetlo mivko (izletna cona) in temnejšo zemljo starta motokrosa oziroma makadamom je zdaj prehod čez nekaj metrov (barva obeh strani zabrisana na ~3,5 m).
- Zrnatost svetle mivke se postopno izgubi v gladko zemljo starta; sence, startna rampa, tablice, cesta in trava so ostali, kot so bili.
- Samo za slike (`mxsoft2.py`, `mxsoft-page.js`); v igro pride po »začni«.
- Slike: `vse21-novo/31-M01 … 31-M10`.

## 18. 10. popoldne · plaža, stara mivka, rob ceste, robnik, sledi, parkirišče (v slikah, vse22-novo: 32-M01 … 32-M10 in 32-D1–D3), koda po »začni«
- **Plaža na Mapi 3** (obkroženi del severno od parka): povsod ista plaža – barva samo po oddaljenosti od vode (temnejši rob ob vodi, nato enaka suha mivka do ceste), blage sence, senčniki in njihove sence ostanejo (`beachfix.py`).
- **Stara mivka** od prejšnjih zavojev zbrisana povsod, kjer si jo označil (Mapa 3 park in vulkan, Mapa 6 vse ceste, parkirišče), in drugod ozki pasovi stare mivke med asfaltom in travo; na njenem mestu trava s progami košnje oz. asfalt parkirišča. Ostanejo: izletne cone, plaža, makadam, motokros, proga vlakca okoli vulkana, robniki, ograje, predmeti (`oldsand3.py`).
- **Širok rob ceste** (Mapa 6, cesta nad velikim parkiriščem, obe strani): bela robna črta in 1,6 m pas asfalta, ki pokrije nepravilnosti (`edgeband2.py`).
- **Širok robnik** ob vzhodni cesti ob parku (Mapa 6): rdeče-bel kot robniki na progi, 2 m širok, od križišča zgoraj do vogala spodaj in okoli zaobljenega vogala do darilne škatle (`kerb.py`).
- **Sledi koles** povsod, kjer se makadam/gramoz priključi na asfalt (11 križišč + izhod motokrosa): večkrat zapeljano v obe smeri, umazanija bledi po cesti, kolesnice v makadamu (`tracks.py`, `tracks_all.py`).
- **Veliko parkirišče** brez avtomobilov (52 kombijev s sencami skritih, `carsoff-page.js`).
- Samo za slike; v igro pride po »začni«.
- Po pregledu popravljeno: streha postaje vlakca ob vulkanu ostane (ni mivka), proga vlakca ostane; lesen pomol pri plaži ostane; stara mivka se briše le v ozkih pasovih (do 3,5 m) med asfaltom in travo, svetla izletna mivka in mivka ob robnikih ostaneta; robnik gre pod kioskom in se mehko konča pri darilni škatli; sledi so tanjše, ne gredo čez travo, ograje in stožce; kolesnice v makadamu vzporedne; na parkirišču tudi tablice in znaki kombijev skriti.

## 18. 10. zvečer · rampa, sledi, mivka gradbišča (v slikah, vse23-novo), koda po »začni«
- »Startno rampo za motokros prestavi tam, kjer sem narisal« + »naj bo tako postavljen« → movegate-page.js (12,1 m na zahod) + rotgate-page.js (obrnjena za 50° okoli sredine letvic, po rdeči črti čez začetek proge, stran za vozače proti startni ploščadi); senca rampe prebrana iz dveh posnetkov s skritimi plastmi (z rampo / brez nje) in položena v mxsoft4.py → mxsoft-page.js; staro mesto zapolnjeno s peskom ploščadi.
- »Prestavi, da so tukaj sledi vozil, ki so zapeljala iz makadama na cesto« (Mapa 2 spodaj) → tracks_all.py: ustje over-west prestavljeno na (−264,6; −170), vse sledi zavijejo proti jugu (toward), zbledijo 7 m pred tunelom; eb2-page.js.
- »Naj bo ta mivka tukaj temna, kot je na gradbišču« (Mapa 8) → sitedark.py → paint-sitedark-page.js (__PAINT.sitedark): svetla lisa za ograjo gradbišča temnejša do barve zemlje gradbišča, lastna zrnatost ostane, senca ograje in pesek zunaj ograje nedotaknjena.
- H · boks motokrosa (»boksi naj imajo uvoz in izvoz na glavno cesto asfaltirano in so takoj ob glavni cesti; 3 opcije«) — še ni izbran (vse24-boksi, boxopt.py → boxopt-page.js, window.__BOXOPT(1..3), 0 = kot zdaj): boks je že prevozen (odprt na severu in jugu, izložba z napisom proti cesti), zato ima v vseh treh svoj asfaltni pas s ceste skozi boks in nazaj na cesto (uvoz na severu, izvoz na jugu, prekinjena robna črta, puščici). 1 = boks ostane, kjer je; 2 = trije boksi v vrsti, en pas skozi vse; 3 = boks na travniku južno od starta (start prost). Asfalt v materialu ceste, nikoli čez samo cesto; boksi narisani za plastmi tal; madež stare oranžne stene zakrpan.
- »Zamenjaj rob za rob, ki je bil na original Toskana progi« → edgeband3.py → eb3-ribbons.json → mkeb3.py → eb2-page.js (__EDGEB): namesto sive asfaltne bankine rob originalne Toskane (izmerjen na navadni dirki Toskana: bela črta 0,22 m, 0,12 m od roba asfalta, in 2,2 m pas rdeče-oranžne zemlje #C06B4B ob asfaltu); na istih mestih kot prej (cesta nad parkiriščem obe strani, vzhodna ravnina dirkališča zahodna stran). Ob širokem rdeče-belem robniku ni bele črte (kot na originalu ob robnikih), pas zemlje teče za robnikom. Robnik sam ostane rdeče-bel (uporabnik ga je želel); original je imel zeleno-belo-rdeč robnik 1,5 m.
- »Naredi notranji del manjšega dirkališča v 9 slikah od zgoraj« → vse25-manjse (35-N00 pregled + 35-N01..N09, 140 m na sliko, mreža 3 × 3 čez celo progo T).
- »Nadaljuj« (po vprašanju, ali naj bo rob okoli celega manjšega dirkališča in robniki kot na originalu) → edgeband4.py + tkerb.py + pvn.py → eb4-ribbons.json → mkeb4.py → eb2-page.js: rob originalne Toskane okoli CELE proge T, na obeh straneh: bela črta (0,22 m) kjer ni robnika, 2,2 m pas rdeče-oranžne zemlje, zeleno-belo-rdeči robnik 1,5 m (kot v world.js: na notranji strani ovinkov z R < 190 m ±10 m, na zunanji samo v lasnicah), v celih kosih (≥ 10 m, vrzeli do 10 m zapolnjene); pas teče pod robnikom. Ni ga, kjer je ob progi tlakovano (pasovi, parkirišče, heliport, nagnjena skleda: prebrano s trenutnih slik), pri ustjih makadamskih poti in ob rdeče-belih robnikih; trakovi na progi so depth-tested (drevesa, konstrukcije stojijo čez). Uporabnikov širok rdeče-bel robnik ostane, pas za njim. Pregledano s tremi krogi agentov (vse26-manjse, vse26-novo).
  Končna različica (vse26, posnetki inA): na progi T so trakovi osvetljeni (Lambert, sprejemajo sence, barve materiala kot world.js: zemlja #85593E, robnik #588A72/#9DAF94/#97524A, črta #EDEBF0), ena odločitev »tlakovano ob progi« na vzorec (≥ 3 od 5 tipal 0,8–3,2 m ven na asfaltu), rob se ustavi pred rdeče-belo ograjo, ne pod steklom garaže, ne ob že obstoječi beli črti (brez dvojnih črt); uporabnikov širok robnik ostane neosvetljen rdeče-bel.

## Rob manjšega dirkališča – 3 različice (vse27-robovi)
- edgeband5.py (EBV=A/B/C) → eb5-V-ribbons.json → mkeb5.py V → eb5-V-page.js; slike q647 (sh-v4-*), compose_v3.py.
- A: črta + rjav pas 2,2 m, trobarvni robnik 1,5 m v ovinkih (kot originalna Toskana).
- B: pas 3,4 m, robnik 1,8 m, robnik v več ovinkih (tkerb.make(300,0.025,7)).
- C: pas 3,0 m, robnik 1,5 m povsod, brez črte.
- Vse: ob parkirišču ni roba (far-lot PQ), plaža (B ribbon) rahlo prekrije rob.
- Čaka na izbiro uporabnika.

## 19. 10. – stari pesek ob mali progi, bela črta, robnik zgoraj, nepravilnosti (vse28-prej-potem)
- Stari pesek: nosand3-page.js (maske nsmask2.py: R makadam/svetli pesek 17. 10., G stari pesek notranjosti, E zobje starega grobega
  roba, K tuji asfalt čez progo, L/HB trava v notranjosti JZ nagnjenega ovinka) + apron-page.js (apron.py: trava med robnikom in heliportom).
- Rob v7 (edgeband7.py → eb7-{A,B,C}-page.js): bela črta ob obeh robovih ves čas, tudi mimo robnikov; črtkana samo pri priključkih
  (druga cesta, pas, odprto parkirišče brez robnika/ograje); robniki: vrzeli do 20 m zaprte, severna ravnina zunaj (tkerb.fill).
- Ostane: temnejša zaplata asfalta pri vhodu na južno parkirišče (del mreže proge), stopničast rob parkirišča pri JV ovinku (prvotni svet).
- Različica roba (1/2/3) še ni izbrana.

## 19. 10. zvečer – ostanki ob mali progi (vse29-popravki, samo slike)
- nosand6-page.js (maske nsmask3.py): poleg R/G/E/K/L/HB še LS (tlakovanje parkirišč ob JV ovinku in v jedru proge, mreži nv27470/nv20624
  do ~hw+3 m) in KB (stara plast trave gr18 s pasu robnikov).
- tpatch-page.js: klin gladke ploskve pri vhodu na južno parkirišče (x −8..28, z 143..160) prekrit s kopijo asfalta proge (272 trikotnikov,
  4 m mehka prehoda). Mora iti PO nosand6 (družina K bi ga sicer skrila).
- paintcut.py → paintcut-page.js (__PAINTCUT): stare zelene kocke barvanja »oldsand« (__PAINT.oldsand, celice 0,25 m) odrezane s pasu
  ob progi (rob v7 – vse tri različice – in prvotni rdeče-oranžni pas sveta nv8700), mehko 0,5 m; robniki in pas so spet celi.
- Pri JV ovinku med robnikom in parkiriščem trava z ravnim robom namesto stopnic.
- stub3/stub4-page.js + filler-page.js: ostanek stare poti iz proge proti JZ nagnjenemu ovinku (pri heliportu, x −142..−123, z 53..67;
  pot nv1036, črta nv128, prehod nv1160, prehod 'jn') odstranjen s senčilnikom (poligon), luknja v terenu pod njim zapolnjena s travo
  (mreža 0,5 m, višina z žarkom na teren/pot). Robnik in pas ob progi tam sta spet cela.
- Ostane: temna kvadratna lisa v travi pri tem mestu (stara plast nv20327), modro-vijolične lise ob notranjem robu JZ nagnjenega
  ovinka, magenta škatle (označbe) na progi.

## 19. 10. zvečer (2) – oznake uporabnika ob mali progi (vse30-popravki, samo slike)
Obnovitev po ponovnem zagonu: q767..q772 (= q640..q645), q773 rt8 (nosand6, apron, eb7-A + __EDGEB(1), tpatch, paintcut, stub3, stub4, filler),
nato ebfog, grcut, terr2, sand2 (sandcut ni potreben), xing, xing2, xing3, lawn2 (vrstni red, kot so šli v q784..q805).
- »Zbriši zeleno travo za robnikom« (vzhodni in JV ovinek ob parkirišču) → terr2.py / terr2-page.js (__TERR), del A: rdeče-oranžni pas
  (Lambert, megla, barva prvotnega pasu nv8700) od robnika do roba parkirišča; zunanji rob gladka ovojnica tega, kar ni bilo parkirišče
  (nonlot.png, greenpx.png), 0,17 m nad tlemi (nad ploščami parkirišča); ne na priključnem pasu (cesta 'jump').
- »Zbriši pesek« ob rdeče-belem robniku pri heliportu → sand2-page.js: plast nv19744 (pesek ob robnikih, skupna za ves zemljevid)
  odrezana samo v pravokotniku x −132..−121, z 53,8..80 (kopija materiala).
- »Robnik naj se nadaljuje v isti barvi« / »vse to skupaj en robnik enake barve« → ebfog-page.js (novi rob ima meglo kot tla; prej
  brez megle, zato svetlejši), grcut-page.js (stara plast trave gr18 odrezana s pasu), terr2 del C: en enoten pas 2,2 m ob severni
  strani ceste pri heliportu (x −144..−100).
- »Tukaj naj bo vse trava« (notranjost JZ nagnjenega ovinka) → lawn2.py / lawn2-page.js (__LAWN2): trava kot pri apron ob rdeče-belem
  robniku (pas 4 m) in lisa z belo črto; temne celice starega barvanja tam odrezane.
- »Zbriši ta siv flek, naj bo cesta kot drugod« (križišče proge z makadamsko cesto 'over' pri nagnjenem ovinku) → xing-page.js
  (makadamske plasti, luknje, jn, mk18 odrezani na asfaltu proge s senčilnikom), xing2/xing3-page.js (asfalt proge nv34800: igra je
  tam vrstice v 164,27..167,02 zožila za en stolpec in sesula trikotnike; vrstice postavljene na novo po sredini proge, z enakim
  nagibom in barvami kot vrstica 164,02). Sledi koles čez progo ostanejo.
- »Rob robnika je naguban, naj ne bo« → terr3.py / terr3-page.js (namesto terr2 dela A): pas ob parkirišču je en trak vzdolž proge
  (postaje 0,25 m, 14 vrstic od hrbta robnika hw+1,7 do zunanje črte), zunanja črta je ovojnica terr2, zglajena čez ~30 m, rob oster
  (0,12 m); na priključnem pasu ga ni. Del C (pas pri heliportu) ostane.
- Pas pri heliportu, zgornji rob: c3-page.js (nadomesti c2): nad enotnim pasom odrezani širši deli prvotnega pasu (nv8700, D > hw+2,24,
  do hw+4,5), ravna zelena plast brez teksture (nv1485) in dva kosa peska na starem stiku (nv312/nv288 samo v škatli stika; ploščadi
  heliporta in črpalke ostanejo). Rob pasu je zdaj raven spodaj in zgoraj.
- Popravki istega večera: grcut2-page.js (gr18 odrezan samo pri heliportu, x −146..−97, z 28..50; grcut je drugod odkril limonsko
  travo in stare bele črte), stub5/stub6-page.js (odrez stare poti šele od D > hw+0,15, da odtenek nagnjenega ovinka na asfaltu ostane;
  stub6 še pas trave x −147..−141), filler2-page.js (zapolnitev x −147..−122 v barvi terena, ro −0,5), lawn3.py / lawn3-page.js
  (namesto lawn2: trava v notranjosti JZ ovinka podaljšana na sever do z 129, pas dK < 8 m, barvanje odrezano tudi na robniku, ravna
  senčenja), xing4-page.js (namesto xing: 8 m mehak prehod na zahodu, prosojne plasti zbledijo, lila trak odrezan).
- terr4 (pas nizko + odrez plošč) je opuščen (stopnice, voda pod ploščami); terr5-page.js: trak terr4 (zbledi ob priključnem pasu,
  sst(7,75; 8,3)) na višini +0,17, odrezi T4 izključeni, gr18 pod sledjo pasu ne riše (maska terr4mask.json, __T5U). Olivna trava v pasu
  ob JV ovinku je s tem zbrisana.

## 19. 10. zvečer (3) – tribarvni robnik na mali progi, stik pri priključku (samo slike)
Obnovitev po ponovnem zagonu: q862..q868 (= q767..q773), nato restore-rt10.mjs (q869): ebfog, grcut, terr, sandcut, terr2, sand2, xing,
lawn2, xing2, xing3, terr3, c2, c3, grcut2, stub5, terr4, lawn3, stub6, filler2, xing4, rwk, trikerb4, widek, terr5, notch (v tem vrstnem
redu; trikerb 1–4, widek, fillet in lawn3 so opuščeni – namesto njih trikerb5, widek2 in lawn4; na koncu še bank, rimfill, kerbclean).
- »Zbriši belo-rdeči robnik na majhnem dirkališču, povsod naj bo tale robnik« (tribarvni) → trikerb4-page.js (__TRIK): rdeče-beli
  robniki z barvami oglišč ob mali progi (nv156 robnik v notranjosti nagnjenega ovinka, nv328 SZ, nv1196 cik-cak pri nagnjenem ovinku in
  drugi kosi, nv198/nv216 robnik sveta na vzhodni ravnini) predelani v štiri pasove tribarvnega robnika (zelena 88,138,114 / krem
  157,175,148 / rdeča 151,82,74 / temno rdeča 112,60,55; deleži 0 / 0,373 / 0,653 / 0,747 / 1, zelena ob asfaltu), Lambert z meglo;
  deli zunaj območja ostanejo. trikerb5-page.js (namesto trikerb4): vsaka ploskev obrnjena navzgor (dvostranska osvetljena ploskev,
  gledana od spodaj, je bila temna – zato temne kocke), rob nizkega zidu (nv1196) okoli nagnjenega ovinka in naprej ob južni strani proge
  do x −14 v celoti, pasovi vzdolž zidu (smer iz sosednjih kock), zelena proti nizkemu asfaltu ob zidu (stran dlje od proge oz. proti
  nagnjenemu ovinku, kjer sta obe strani enako daleč). widek2-page.js (__WIDEK, namesto widek): široki rdeče-beli robnik ob vzhodni
  ravnini (kerb-ribbons, edgeband nv4655) narisan kot tribarvni robnik na istih 2 m (vrstice robnika eb7, razširjene), osvetljen kot
  robniki proge; stari skrit (sam robnik sveta pod njim je bil preozek, z luknjami trave). rwk-page.js (tekstura curb → curbIT v bližini proge) nima vidnega učinka. Plastične ograje in ograje z
  vrvmi ostanejo rdeče-bele.
- »Popravi« (zareza V, kjer se robnik proge stika z vogalnim robnikom priključnega pasu ob JV parkirišču, x 119..122, z 58,5..61) →
  notch-page.js (__NOTCH): robnik proge (nv7548) je imel tam raztegnjen zadnji trikotnik in prazen klin; ta in dva naslednja kosa sta
  zložena, namesto njih en gladko ukrivljen kos istega robnika (ista tekstura in material, B-zlepek po notranjih ogliščih robnika,
  tangenten na vogalni robnik in na stari robnik, zunanji rob 1,5 m). Vogalni robnik (nv48) in robnik priključnega pasu (nv795, vsa
  dolžina) narisana na novo brez temne zunanje ustnice in 6 cm višje, zato tlakovanje parkirišča in pas ne režeta več njune rdeče; ob
  robniku (1,45 m od sredine, x 94..126) ne rišeta gr18 in limonski rob nv6070, barvanje »oldsand« tam zbledi (zelene lise na robniku),
  na tlakovanju parkirišča je odrezana zapečena limonska proga tik ob vogalnem robniku. fillet-page.js (mreža čez stik) je opuščen.
- »Tukaj je še vedno zelena trava. Malo po robnikih« (južna stran proge, kjer pas na zahodu zapusti progo, x −70..−42) →
  rimfill-page.js (__RIMF): rdeče-oranžni pas od roba asfalta (pod belo črto) do pod robnik nizkega zidu (postaje 0,25 m po notranjem
  robu robnika, 0,14 m nad tlemi, prvih 1,2 m zbledi), barvanje »oldsand« tam zbledi; širok rob pasu (trak in črta, risana brez
  globinskega testa) ne riše več čez noben robnik ob pasu (maska ploskev robnikov 0,1 m) – robniki so celi, trak se nadaljuje za njimi.
  kerbclean-page.js (__KCLEAN): maska vseh robnikov okoli male proge in ob pasu (0,2 m, +0,2 m okoli); gr18 tam ne riše, barvanje
  »oldsand« tam brez barve – nikjer več trave čez robnik. lawn4.py / lawn4-page.js (namesto lawn3): trava v notranjosti nagnjenega
  ovinka po pravem robu zidu (rim-blocks.json) do pod robnik – brez limonskih zob in lila vmes; bank-page.js (__BANK): travnati breg
  zidu (nv10193, njegov zobčasti rob) ne riše, kjer je ta trava. trikerb5: vse ploskve navzgor in normale naravnost navzgor (robnik
  v notranjosti nagnjenega ovinka in SZ robnik brez temnega pasu).
- »Tak robnik naj bo po celem malem dirkališču vse od starta do cilja brez prekinitve, edino kjer so križišča naj bodo samo črtkane
  črte« in »naredi robnike tudi na teh dveh cestah« (parkovna cesta bend, pas ob JV parkirišču jump) → različica D: edgeband8.py
  (EBV=D, KRD = T, jump, bend) in mkeb8.py → eb7-D-page.js: bela črta, tribarvni robnik in rdeče-oranžni pas ob obeh straneh male
  proge in obeh cest; robnik je prekinjen in črta črtkana samo v ustju križišča (druga cesta, ustje makadamske ceste). ebfix.py →
  eb7-D2-ribbons.json / eb7-D2-page.js (namesto eb7-D): os parkovne ceste ima na vzhodnem koncu kljuko (zadnjih 5 točk se obrne nazaj
  v asfalt proge) – rob za vrhom kljuke izpuščen; rob obeh cest (tudi črta) se konča, kjer zapelje v asfalt proge; točke, ki jih je
  ovinek kljuke zasukal nad lastni asfalt, izpuščene. trikerb6-page.js (namesto trikerb5): SZ odvečni robnik (nv328) skrit, kocke
  robnika zidu tik ob progi oz. pasu (manj kot 3,1 m od roba proge, 9,3 m od osi pasu) izpuščene.
- »Popravi da se robniki lepo združijo med sabo tam kjer se združujejo« → kerbjoin.py / kerbjoin-page.js (__KJOIN): vsak vogal med
  robom proge in robom ceste zaobljen (krog r 5 m, tangenten na oba roba; ne na zaobljenem koncu ceste in ne, kjer se roba stikata šele
  dlje kot 20 m od vogala) z istim robom (črta, robnik, pas, osvetljeni kot na cestah), 2,5 m čez lastnega na vsaki strani, vogal
  zapolnjen z asfaltom proge; lastni robovi cest v vogalu skriti (samo na vogalni strani obeh cest). Kjer cesta zapelje v progo
  vzporedno z zamikom (začetek parkovne ceste pri tabli, njen konec na vzhodu): gladek S-prehod (Hermitova krivulja 10–13 m) od roba proge
  do roba ceste z istim robom in 2,5 m asfalta na notranji strani. Konec pasu ob JV parkirišču: os pasu se konča v progi, njegov asfalt
  le malo izbokne čez notranji rob proge – tam teče rob proge naprej neprekinjen (polna črta), vogal na izboklino izpuščen. Ob vogalu na
  zahodu parkirišča (lotw) rdeče-oranžni pas ne leži na tlakovanju (zbledi). Stari robniki s teksturo curb ob mali progi in pasu skriti.
- »Siv flek na cesti ... naj bo cesta tam« (SZ križišče z gozdno cesto) → xing5-page.js (zložene ploskve asfalta popravljene, makadam
  plasti znotraj proge ne rišejo) in xing6-page.js (__XING6): asfalt proge ima ob notranjem robu luknjo (ploskve zložene v črte – lila
  pas je gola podlaga pod njim); trak istega asfalta položen tik pod asfalt proge (od 1,8 m od osi do 0,35 m čez rob), zato se vidi samo
  skozi luknjo. wstub-page.js: igrin bel kos črte v ustju parkovne ceste na vzhodu (ostanek kljuke) spuščen pod tla.
Obnovitev po ponovnem zagonu (19. 10. noč): q767..q772 (rt1..rt7), restore-rt8D2.mjs (eb7-D2), restore-rt12.mjs (rt11 + xing5, xing6,
wstub, kerbjoin pred kerbclean).

## 20. 10. – oznake uporabnika na listih 42-x (vse33-oznake-20-10, samo slike)
- »Povsod kjer je uvoz in izvoz iz boksov naj bo črtkana črta« (tudi pri rdeči in modri garaži na začetku parkovne ceste) →
  ebfix2.py → eb7-D3-ribbons.json / eb7-D3-page.js (namesto eb7-D2): ob vsakem od 11 boksov ob mali progi (in ob pasovih za
  gorivo) je bela črta črtkana po vsej dolžini pasu (uvoz, ob garaži, izvoz), robnik in rdeče-oranžni pas tam ni. Črtice so svoji
  trakovi: 1,5 m črta, 1,5 m presledek, sredinsko v vsakem odseku, ostri konci; odseki, med katerimi je manj kot 8 m, so združeni.
  Na parkovni cesti in pasu ob JV parkirišču so črtice samo zunaj proge. Med robom proge in pasom za boks asfalt (3-vrstični trakovi
  kjer je pas bliže kot 6 m); na samih pasovih ne rišeta več trava gr18 in nv12910 (maska pasov lanemask20, 0,5 m, rob 0,4 m) –
  box20-page.js (__BOX20).
- »Sedaj sta 2 robnika, zbriši notranjega« (vogal pri L12, pas za tovornjak) → širok robnik (widek) ob pasu zbrisan, vogalni lok
  robnika ostane.
- »Zavoj ceste lepo v loku, zbriši drevo na plaži in travo pod njim« (konec parkovne ceste bE) → kerbjoin: Hermitov prehod 27,9 m
  od roba proge do roba parkovne ceste (en lok); del20-page.js skrije drevo na plaži, stagegrass-page.js tam ne riše gr18.
- »Ena črtkana črta« (jW) → kerbjoin: povezava na zahodnem odcepu je samo črtkana črta (brez robnika in pasu), stara polna črta
  pasu (nv654) skrita.
- »Robnik naj gre po črtkani črti« (jEnd, konec pasu ob plaži) → kerbjoin FOLLOW: robnik proge teče naprej po črti; izboklina
  pasu za njim je pod peskom (mreža peska 0,5 m v box20).
- »Kjer se cesti združita naj bo črtkana črta brez robnika« (pot čez parkovno cesto) → del poti v ebfix2 (cona »box« ob poti).
- »Pod mostom zbriši travo in pesek« → trava gr18 in pesek pod mostom ne rišeta (box20 izrez 'g').
- »Na robniku še vedno delček trave« (vzhodna ravnina) → tongue-page.js: plast terena v mnogokotniku ob robniku ne riše (po terr5).
- »Zbriši 3 stebričke na cesti« (križišče z gozdno cesto) → del20: stebriček nv42 skrit, oglišča dveh stebričkov v nv210/1240/120 spuščena.
- List 6 »popravi obkroženo« → SZ križišče (xing6), lotw (maska vogala rt+1,6 m, snap po zunanji polovici – brez stopnice in
  jezička), kNW (ena sama črta, bel kos wstub), limonski zobje ob zidu nagnjenega ovinka (pas trave ob zidu, box20 'T').
- »Zbriši oder in oranžno kocko« → del20 (oder 436 ploskev, kiosk); stagegrass: trava na mestu odra z barvami sosednje trave;
  widek3: robnik ob kiosku cel, S-pas tam preoblikovan.
- »Lepši prehod med različnima cestama« (j3 / jA) → blend20.py: asfalt proge se v 7 m prelije v svetlejši asfalt pasu in parkovne
  ceste.
- List 3 »popravi obkroženo« → L04 sever: pas ob robniku cel (FILL); L20: rdeče-beli robnik obvozne ceste (nv304) skrit.
Obnovitev (20. 10.): q767..q772 (rt1..rt7), restore-rt8D3.mjs (eb7-D3), restore-rt13.mjs (rt12 z widek3, tongue po terr5, xing6 in
wstub po xing5, kerbjoin, kerbclean, del20, stagegrass, box20).
Popravki po pregledu slik (20. 10. ponoči):
- Trava na mestu odra je ležala čez pot zahodno od odra (Park lane 1) → stagegrass-page.js: zaplata trave se umakne s poti (polovična širina
  3,25 m, prehod 0,7 m od roba poti).
- Ob ustjih pasov za bokse (npr. izvoz iz boksa za tovornjak na vzhodni ravnini) so med črtkano črto in pasom gledali oranžni klini – rjava plast
  zemlje (nv8700) leži čez asfalt pasu → box20: tudi ta plast ne riše na pasovih (maska pasov; njen material dobi svojo kopijo, če ga deli s čim drugim).
- Stopnica v robniku ob parku (x 89, z −64), kjer navadni robnik preide v širokega → jogfix.py: široki robnik se začne enako širok kot navadni
  in se v 4 m razširi na 2 m (neprosojen), navadni robnik teče 1 m pod njegov začetek, rdeče-oranžni pas se v istih 4 m premakne navzven (prej skok 1,1 m).
- Na pasovih za bokse so ostali kratki koščki igrine bele črte ob robu pasa (na strani proge), npr. samotna črtica v izvozu iz boksa za
  tovornjak → lanelines-page.js: koščki te črte, krajši od 5 m in manj kot 3 m od roba proge, so spuščeni pod tla (17 koščkov).
- Ob ustju pasa za tovornjak (vogal pri L12) je zmotno manjkal robnik in pas parkovne ceste (jump), ker pas za tovornjak tam teče v progo
  → ebfix2.py: pri parkovni cesti in pasu ob parkirišču štejejo samo deli pasov za bokse zunaj proge.
- Svetlo zelene lise (goli teren), kjer je bil rob proge odstranjen (odprtine, vogali in povezave kerbjoin), pa tam ni ceste ne pasu →
  grassfill.py / grassfill-page.js: zaplate iste trave (gr18), barva in višina z okoliške trave.
- Pregled slik (fn29): ponekod je bila črtkana črta ob travi, ker pas za boks ni tam, kjer ga kažejo izračunane osi (zelena garaža
  sploh nima vidnega asfalta, kamikaza ima med progo in pasom 4–6 m trave, SZ uvoz, del začetne ravnine) → asphseen.py: iz zadnjih slik
  (L00–L36) za vsako postajo proge in stran izmerjeno, ali je 0,6–2,2 m za robom asfalt; ebfix2.py: odprtine proge samo tam (prej 1802
  postaj, zdaj 1232), drugod spet robnik in pas. ebrebuild-page.js zamenja robove kar v naloženi igri.

## 21. 10. – oznake listov 43-2 … 43-8 (samo slike)
- 43-7 plaža v zanki T: zbrisane gume, bale, stebrički, sod, oranžna kocka, obroč in travnate šope (gume in bale so fizikalni predmeti igre – skriti v seznamu predmetov); brez trave na plaži; pas svetlejšega asfalta ob plaži (plast prehoda pasu v progo) zbrisan; temni kvadrat na cesti (obraba ceste) zbrisan; pri vogalu parkirišča JV brez modrikaste lise na terakoti.
- 43-7 jEnd: konec zaključnega robnika poravnan z robnikom proge (brez stopnice), svetlejši pas peska nad robnikom se zlije postopoma.
- 43-7 bE: asfalt proge sega 6 m v park cesto in se zlije v naslednjih 10 m (brez svetlejšega jezika), zbrisana zalutala črtica.
- 43-6 jA: nova bela črta od stare črte pasu (A) v loku do črte proge (E), jugozahodno od nje trava, terakotni jezik in vrh robnika zbrisana, črtkana črta do E. jW: ena črtkana črta (že prej).
- Helidrom in parkirišče: oba segata do ceste (njun asfalt, brez trave in peska), tudi na cesti tam ni več peska.
- 43-8 pesek: NE prehod med dvema odtenkoma razmazan na ~6 m; JV (glej list).
- 43-5: zbrisani rumene žoge, klop in koš ob poti, temni pikici, tanka temna črta na travi, bel predmet na plaži; temni kvadrat na cesti.
- 43-4: nx svetlejša zaplata na prehodu zbrisana; nw spoj robnikov brez preskoka; kNW ena trava čez lise in drobce, kos terakote zbrisan; L04n vogal parkirišča raven, brez stopnic; L20m mehkejši rob peska.
- 43-3: železnica vlakca pri policiji ostane, kjer je; pas za boks se v progo izteče pred tiri (do z −157,5), pod tiri je trava, robnik proge tam spet sklenjen (premik tirov je odpadel: tiri so prišli pod travo); kamikaza boksi zbrisani, tam lepa trava, robnik proge sklenjen; predsednik: preproga skrajšana na okvir, gume in ograjice na strani proge zbrisane, reže ob pasovih (vseh boksov) v asfaltu pasu (ni več svetlih lis); avto (zelena garaža): asfaltni uvoz in izvoz (pas ob progi s črtkano črto in belim robom); bencinska črpalka: asfaltni klančini do ceste, črtkana črta.
- 43-2 L13: zbrisani črna ograja in luč na travi, drog pri boksu za tovornjak, lisa na cesti; terakotni pas pri izvozu brez zelenih lis.
- Ostanki: SV pesek – meja med odtenkoma je zdaj mehak prehod, ne pa en sam odtenek; L20m – dvojna črta ob plaži ostaja; nx – svetla zaplata na prehodu je samo potemnjena.

## 22. 10. – vogal parkirišča JV in helidrom (list 44-1, 44-3; samo slike)
- »Vogal parkirisca zbrisi stare sence« → fix21 lotShad: sence odstranjenih palet, gum in bal niso bile prave sence (žarek proti soncu ni zadel ničesar),
  ampak zapečene temne lise v plasti stare barve tal (paint-oldsand) – ta plast je na vogalu (x 148..166, z 66..88) zbrisana, z njo zeleni šopi.
  Še: rdeče-bel drobec robnika na terakoti (lotSliver, rez v edgeband), modra črtica (morje se je videlo skozi prozorne plasti, ker so tla tam pod
  gladino – lotStreak: zaplata terakote, ki piše globino), črna guba v terakoti (lotBlack, zaplata).
- »Vse kar je na desni strani ceste naj bo del parkirisca. Parkiriscu spremeni obliko tako da bo sovpadalo z cesto. Cesta naj se zdruzi z drugo cesto
  in naj ju locijo le crtice« → hl22-page.js: klin vzhodno od ceste helidroma (od roba severne ceste do mesta, kjer cesta zavije k parkirišču) je ves
  parkirišče: asfalt parkirišča od vzhodnega roba ceste naprej (rob parkirišča = rob ceste), trava, pesek in stara barva tam odrezani (maska ln21);
  zbrisani šotor, zid z drogovi in podstavki (temni pas ob njem je bila zapečena senca), ograja ob severni cesti, stožci, gume, sodi, zaboj, rdeče-bele
  ovire na vzhodnem robu ceste in rumeno-črna tabla; svetilke parkirišča ostanejo. Na stiku s severno cesto zbrisani ograja, bela letev, pas ploščic
  in sodi z znakom na cesti: asfalt ceste teče v severno cesto, loči ju samo črtkana robna črta; terakota pod robnikom severne ceste se proti stiku izteče (hlTerra).
  Na zahodni strani (helidrom) ostanejo ovire, zaboj in ograja helidroma (njen zadnji drog in letev na stiku zbrisana).
  Ploskev parkirišča sega od roba ceste do robnika severne ceste (brez traku trave pod robnikom), terakota pod tem robnikom je ob klinu zbledena
  (brez rdečkastega sija na asfaltu); ploskev nima izrezov asfalta parkirišča ob cestah (sicer je pod kamerama igre ob stiku ostal klin asfalta ceste).
- Na stiku in ob njem zbrisani še trije semaforji in dve tabli na severni cesti ter trije sodi tik zahodno od stika (njihova senca je ležala v oznaki).
  Ob severnem robu velikega parkirišča (vzhodno od klina) je pod robnikom asfalt namesto trave (robnik lebdi 0,65 m nad tlemi; s kamerama igre se je
  videla trava pod njim). Skriti predmeti so tudi pomanjšani na nič (igra jim sicer sama spet vklopi vidnost); vozil hl22 ne briše.
  Južneje ob vzhodnem robu ceste (do z 142) zbrisana še dva stožca; svetilke parkirišča ostanejo.
- Pregled (agenti): na vogalu JV so po izrezu drobca ostale modre pike (skozi tla se je videlo morje) → lotStreakW (terakota) in lotStreakS (asfalt parkirišča).
- Najdeno med pregledom s kamerama igre: parkirišča so bila v izometrični kameri in kameri za avtom zelena (od zgoraj siva) – podrobna trava slik
  (grass-page, travnik n10193; polygonOffset −2) leži 3 cm pod asfaltom parkirišča (−1) in pri poševnem pogledu zmaga. lotiso22-page.js jo
  pod asfaltom parkirišč (in pod novima ploskvama ln21/hl22) ne riše; ploskvi ln21/hl22 imata zdaj isti zamik kot asfalt parkirišča.
  Pri prenosu v kodo: trava in asfalt parkirišča naj ne ležita drug na drugem (ali asfalt z večjim zamikom).

## 22. 10. zvečer – temne sledi ob robniku na vogalu parkirišča JV (rdeči krogi na listu 45-1; samo slike)
- Krogi brez besedila okrog temnih prog in lis na asfaltu proge tik ob robniku vogala → fix21:
  lotTyre (x 146..176, z 52..81), lotTyreS (z 75..96) in lotTyreS2 (z 90..119): v plasteh sledi gum (tyremarks, world.js) in obrabe ceste (roadwear) je
  prosojnost oglišč ob vogalu in vzdolž vse vzhodne strani parkirišča 0, z mehkim robom 2–3 m; do z ≈ 117 sledi ob robniku tako ali tako pojenjajo.
- Pod sledmi je ostal še temen pas idealne linije (barva oglišč asfalta proge, n34800: 0,79–0,86 namesto ~0,99) → nova vrsta operacije lift:
  lotLift (x 143..178, z 50..96) in lotLift2 (z 88..121) dvigneta barvo oglišč na 0,985 (odtenek ostane), mehak rob 4 m.
- Sledi gum severozahodno od vogala in za naslednjim ovinkom proti jugu ostanejo (pojenjajo mehko). Razpoka na asfaltu ob vogalu je bolj bleda.
- Pri prenosu v kodo: v world.js sledi gum in obrabe ter temen pas idealne linije ob vzhodnem robniku parkirišča JV ne risati.

## 22. 10. zvečer – helikopter na helidromu (»Kje pa je helikopter? Ni ga na helidromu«; samo slike)
- Izbrani helikopter (verzija 2: en velik rotor in rep, rdeč z belim križem, heli8-page.js R-1) je bil v sceni narejen, a skrit – prikazal se je samo
  v zaporedjih letenja (__HV8SHOT). heli22-page.js ga prikaže parkiranega na znaku H reševalne baze (x −95, z 95): zadnja rampa spuščena (tam zapelješ
  noter, proti rumeni črtkani črti), sprednja vrata in sprednja rampa zaprta, rotor miruje (stanje »in« iz heli8). V restore-rt13 na koncu.
- Pri prenosu v kodo: helikopter mora na helidromu stati vedno, ko ga igralec ne vozi (parkiran na H, zadnja rampa spuščena).

## 27. 10. – cela mapa v 15 slikah, proge za čolne (samo slike)
- »Naredi celo novo mapo v 15 slikah od zgoraj« → vse38-cela-mapa-15/ (kazalo + 15 delov 3 × 5, vsak ~247 × 148 m, s celotno zadnjo verzijo slik:
  restore-rt13 z vsemi popravki do 21. 10. in helikopterjem). Uporabnik: »To ni zadnja mapa … starejša verzija« → preverjeno: novejše mape ni ne v slikah
  ne v igri (main ima mapo s 12. 10.); uporabnik: »mogoče se motim … bila je verzija, kjer je bila voda izpeljana v obliki proge za male čolne. Sedaj sta tam
  2 otoka … Ali lahko narediš 6 različnih prog za čolne … Proga naj gre tako, kot je šla prej gokart steza« (s sliko lagune).
- boat27-page.js (window.__BOATK = k pred zagonom, 0..5; −1 laguna kot prej): water3-jeva tla in voda lagune predelana na mestu: laguna (z otokoma) je spet
  travnik (barva travnika povprečna iz okolice, na robu nekdanje lagune mehko zlita v staro), voda vrezana po črti stare steze za gokarte (H3.kartPts, osmica,
  križišče pod leseno brvjo) in kratko povezana s kanalom do morja; breg strmejši ob vodi, ozek peščen rob; prosojne plasti (trava otokov, pesek, ki ga je
  water3 odrezal ob stari obali) nad novo vodo izginejo, ob stari obali mehko zbledijo; voda malo za tlemi (polygon offset), da je rob vode črta, kjer tla
  sekajo gladino.
- boat27d-page.js: stvari lagune pospravljene (boje, palme otokov, skuterji, rampe; brv in pomol HOME z dvema skuterjema ostaneta), start s šahovnico in
  zastavicama na zahodni ravnini, 4 skuterji na startu in 4 na progi, boje na ovinkih (rdeče znotraj, rumene zunaj), in po verziji:
  1 reka 10 m (pomol ob startu, čoln) · 2 široka 17 m s plažami (senčniki, ležalniki, dve vrsti rdeče-belih plovcev) · 3 kanal 11 m z betonskimi zidovi
  (bela obroba, gume, plavajoči štartni pomol, časovni stolp) · 4 reka 13 m s plavajočimi skakalnicami in napihljivimi vrati · 5 divja reka 8–16 m
  (skale ob ožinah, trstičje, palme) · 6 vodni krog 12 m z rdeče-belimi robniki na bregovih, portal s šahovnico in tribuna ob startu.
- Pregled (agenti): stopničasti bregovi (celice brez prave diagonale → po višinah na novo razdeljene), ostanek stare obale v travniku (barve zlite na 9,5–14 m), kanal ob vzhodu brez zareze (zaobljen stik), vrata brez belih drobcev, zidovi in robniki tudi ob vzhodnem koncu, senčniki ne na brvi.
- Poslano: vse39-proge-za-colne/48-0 … 48-6 (vsaka verzija od zgoraj, start, izometrična kamera, kamera za avtom). Čakam izbiro.
- Pri prenosu v kodo: newmap.js – laguna (jetski predlog 0, otoka) ven, kanal po H3.kartPts (širina po izbiri), povezava s kanalom do morja; ena višinska
  mreža za dno in breg (kot water3), voda za tlemi s polygon offsetom.

## 28. 10. popoldne: Blender, gasilski avto, 10 posebnih misij
- Uporabnik: »Ja, naredi gasilski avto v Blenderju v slikah«. Blender 5.2 je nameščen v oblaku kot Python modul (`pip install bpy` v venv), uporabniku ni treba nameščati ničesar.
- `blender/kit.py` (gradniki), `blender/gas.py <0-5> <mapa>` (6 verzij A–F, izris + izvoz .glb), `blender/compose_gas.py` (listi 50-x). Modeli: `blender/modeli/v0..v5.glb` (4.400–6.900 trikotnikov). Listi: `listi/vse41-gasilski-avto`.
- Izmerjeno: 6 verzij v slikah ~35 min. Prenos v igro po »začni« ocena 4–6 h. Uporabnik še ni izbral verzije.
- Uporabnik je zahteval 10 novih, posebnih misij (z več dela, npr. požar na vrhu, reševalno vozilo z grafom srčnega utripa). Makete: `blender/miss.py <1-10> <mapa>`, HUD: `blender/hud_miss.py`; slike `listi/vse42-posebne-misije`. Predstavitev: artifact V456h8wG1ox2nvxLz4CFLQ (kopija v `misije-10/`).

## 28. 10. zvečer: še 15 posebnih misij (11–25)
- Uporabnik: »Misije so mi všeč, dodaj še 15 novih posebnih misij tej spletni strani. Probaj se spomniti čim bolj zanimive misije.«
- Misije (vse na progah, ki so že v igri): 11 Ognjena reka (Mauna Kea), 12 Avtek na daljinca (Suzuka), 13 Lovec na tornado (Detroit), 14 Sladoledar (Rio de Janeiro), 15 Na tirih (Longford), 16 Za balonom (Toskana), 17 Ledeni most (Trois-Rivières), 18 Kaskader (Moki Dugway), 19 Pred plimo (Townsville), 20 Fotosafari (Great Alpine Road), 21 Zadnji trajekt (Riviera), 22 Smetarski dan (Crystal Palace), 23 Lovec na meteorite (Marrakesh), 24 Žetev pred nevihto (Medvode), 25 Spremljevalni avto (Spa).
- Makete: `blender/miss2.py <11-25> <mapa>` (uporabi gradnike iz `miss.py`), prikaz na zaslonu `blender/hud_miss2.py`; slike `listi/vse43-posebne-misije-2`. Predstavitev ima zdaj 33 prosojnic (kopija v `misije-10/`), tudi »Še šest idej v rezervi«.
- Ocena: novih 15 misij 200–290 h; vseh 25 s sistemom 350–500 h (s skupnimi gradniki realno 20–30 % manj).

## 28. 10. ponoči: še 10 posebnih misij (26–35)
- Uporabnik: »Vse misije so dobre. Dodaj še dodatnih 10 misij v predstavitev.«
- Misije (vse na progah, ki so že v igri): 26 Zadnji odstotek (Tianmen), 27 Splavi čoln (Uncompahgre), 28 Svetilnik v nevihti (Big Sur), 29 Božična noč (Štajerska), 30 Ratrak (Mount Baldy), 31 Dinozavrovo jajce (Riverside), 32 Opičja tolpa (Irohazaka), 33 Odvoz snega (Montréal), 34 Mestni avtobus (Toronto), 35 Reševalci na plaži (Newcastle). Prvih šest je bilo prej »v rezervi«; rezerva ima zdaj šest novih idej (plaz, poplava, peščeni vihar, konji v prikolici, solna ravnica, potisni letalo).
- Makete: `blender/miss3.py <26-35> <mapa>` (gradniki iz `miss.py` in `miss2.py`; misija 27 ima še sliko zadnje kamere `m27_inset.png`), prikaz na zaslonu `blender/hud_miss3.py`; slike `listi/vse44-posebne-misije-3`. Predstavitev ima zdaj 44 prosojnic (kopija v `misije-10/`).
- Ocena: misije 26–35 130–180 h; vseh 35 s sistemom 480–680 h (s skupnimi gradniki realno 20–30 % manj).

## 28. 10. ponoči: še 10 posebnih misij (36–45)
- Uporabnik: »Dodaj še 10 misij v predstavitev.«
- Misije (vse na progah, ki so že v igri): 36 Plaz (Vršič), 37 Poplava (Bang Saen), 38 Peščeni vihar (Moki Dugway), 39 Konji v prikolici (Monterey), 40 Varnostni avto (Bathurst), 41 Dirkalni taksi (Nürburg), 42 Ogledalo za zvezde (Palomar Mountain), 43 Vroče zavore (Rio do Rastro), 44 Skalni podor (Chapman's Peak), 45 Turistični vlakec (Monte Carlo). Plaz, poplava, vihar in konji so bili prej »v rezervi«; rezerva ima zdaj: solna ravnica, potisni letalo, vleka sani, mačka na drevesu, kit na plaži, ledena ploskev.
- Makete: `blender/miss4.py <36-45> <mapa>` (gradniki iz `miss.py`, `miss2.py` in `miss3.py`), prikaz na zaslonu `blender/hud_miss4.py`; slike `listi/vse45-posebne-misije-4`. Predstavitev ima zdaj 55 prosojnic (kopija v `misije-10/`).
- Ocena: misije 36–45 125–175 h; vseh 45 s sistemom 605–855 h (s skupnimi gradniki realno 20–30 % manj).

## 29. 10. ponoči: izbor 24 misij, še 10 novih (46–55), kamera igralca, časi
- Uporabnik je izbral 24 misij: 1, 2, 4, 6, 7, 8, 9, 10, 11, 13, 17, 19, 23, 26, 29, 30, 33, 34, 35, 37, 39, 40, 43, 45, in naročil še 10 novih.
  Med delom: »nič ne delaj v kodi, samo pripravi« – igra ni spremenjena, vse je v slikah in predstavitvi.
- Pripombe k izbranim:
  - 6: »naj bodo na cesti tudi ostali avtomobili, brez ljudi in kolesarjev« – zdaj devet avtov in tovornjak; pred policijo zapeljejo na desni rob
    in ustavijo (utripalke), nasproti vozeči ustavijo na svojem robu. Policija in igralec sta zdaj na desnem pasu (ZDA).
  - 29: »kako mečeš darila? naredi v slikah« – štiri slike (približaj se, drži VRZI s piko, darilo leti, zadetek). Smer izbere igra sama
    (proti hiši ob cesti), igralec določa moč z dolžino pritiska.
  - 35: »kako iščeš? naredi v slikah« – štiri slike (reševalec kaže krog, štirikolesnik do vode, skuter: plavalec se pokaže na valu in zakliče,
    krog se zmanjša; na sani in na obalo), pri 3 in 4 še pogled z vozila.
  - 45: »naredi na drugi progi« – zdaj Riviera, Francija: promenada s palmami, plaža s senčniki, serpentina do razgledne točke.
- Nove misije (vse na progah, ki jih izbor še ne uporablja): 46 Požar v predoru (Uncompahgre), 47 Gozdni požar (Great Alpine Road),
  48 Narasla reka (Longford), 49 Zataknjeno kolo (Suzuka), 50 Panji na pašo (Medvode), 51 Dinozaver na tovornjaku (Crystal Palace),
  52 Hiša na tovornjaku (Big Sur), 53 Snežne verige (Los Caracoles), 54 Dirka tovornjakov (Nürburg), 55 Medvedi na cesti (Beartooth).
- Kamera igralca »Blizu«: `blender/kamera.py <misija> <mapa>` postavi isto kamero kot igra (js/render.js, način 'chase', telefon pokonci):
  D = 46 · zoom · 1,1 (Blizu), nagib 0,98 · 0,9, cilj 13 m pred avtom na tleh, zorno polje 58°. 34 posnetkov (vsa izbrana in nova vozila),
  listi `kamera1`–`kamera6`. Ugotovitev: vozilo se vidi predvsem od zgoraj (streha, oblika, barva), ponoči predvsem luči.
- Časi (izdelava · igranje ene vožnje): izbranih 24 misij 322–454 h · 135–177 min; novih 10 misij 124–174 h · 59–78 min;
  sistem misij 10–14 h; skupaj 456–642 h (s skupnimi gradniki realno okoli 320–515 h); vseh 34 misij se enkrat odigra v 194–255 min.
  Misija 6 je zdaj 12–16 h (prej 10–14 h, +2 h za promet, ki se umika).
- Makete: `blender/miss5.py <misija> <mapa>` (46–55, 6, 45, 291–294 = met darila, 351–354 = iskanje), prikaz na zaslonu `blender/hud_miss5.py`,
  sestavljene slike `blender/sestavi5.py`, predstavitev `blender/deck5.py`. Slike: `listi/vse46-posebne-misije-5`.
- Predstavitev ima zdaj 73 prosojnic (kopija v `misije-10/`): tabela izbora in časov na začetku, izbranih 24 misij (s slikami 29 in 35),
  10 novih, kamera igralca, čas in žetoni, na koncu neizbrane misije v rezervi.

## 29. 10. dopoldne: 13 med neizbranimi, čas za vse, kar čaka na kodo
- »lovec na tornado dodaj na seznam za neizbrane« → misija 13 (Lovec na tornado, Detroit) je med neizbranimi; seznam neizbranih ima zdaj 22 misij.
  Izbor je zdaj 23 misij: 306–430 h izdelave · 130–170 min igranja. Skupaj z 10 novimi in sistemom misij 440–618 h (realno okoli 310–495 h),
  žetoni okoli 145–300 mio; vseh 33 misij se enkrat odigra v 189–248 min (3,2–4,1 h). List kamere igralca 2/6 ima pet telefonov (brez 13).
  Predstavitev: `blender/deck6.py` (podatki iz `deck5.py`), listi s telefoni `blender/sestavi5.py` (GROUPS); kopija v `misije-10/`.
- Ocena za kodo po »začni« (brez misij, ki jih uporabnik dela z drugim računom): že odobreno na slikah 92–135 h (tla ob morju 12–18,
  kmetija 8–10, mala proga in okolica 24–36, helikopter in helidrom 14–20, gradbišče, most, vulkan in motokros 10–14, začetek igre 2–3,
  avtošola s 27 nalogami 16–24, preverjanje 6–10); po izbirah še 13–20 h (proga za čolne in plaža 8–12, gasilski avto 4–6, priključek
  motokrosa pri B 1–2); pozneje 28–44 h (ravni za ostale garaže, vožnja z napravami v lunaparku, premikanje na gradbišču, rampa v parku).
  Skupaj brez misij 133–199 h (okoli 17–25 delovnih dni po 8 h); nepravilnosti s 15 slik cele mape niso vštete.

## 30. 10. – odgovori na predstavitev odprtih vprašanj (po »začni«, za kodo)
- Uporabnik: »vprasanje 1, naredi razlike da vidim v sliki med igro igralca. 2-2, 3. siroko. 4-1, 5f, 6c. 1-7, 8-1« (»1-7« = 7-1).
- Kmetija, podrobnosti: še odprto; slike razlik 1/2/3 s kamere igralca med igro naredi seja za sklop 3.
- Helikopter: nalogi WATER RESCUE in FIREFIGHTING naredi drug račun z misijami (v meniju zaklenjeni); sklop 4 = let, pristanek, FREE FLIGHT.
- D · priključek motokrosa pri B: 3 (široko). H · boks motokrosa: 1 (prevozni boks tik ob cesti, __BOXOPT(1)).
- Proga za čolne: široka s plažami, plaža F (družinska, __BEACHV = 5). Gasilski avto: C (avtolestev).
- Popravki s 15 slik cele mape: v sklopu 8 popravi vse sam. Stvari za pozneje (sklop 10): vse, po sklopu 8.
