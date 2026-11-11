# Garaža: animacije po 8 ploščah načrta

Načrt teme (grafika; prednostna tema po odločitvi uporabnika 10. 11. 2026 ob ~23.20, tabla #382, komentarji 6767097408, 6780738042 in 6781094915 t. 2). Nadaljuje prvi pogled garaže po načrtu (#546, na `main` z zbirno A #583). Tema spreminja samo garažo (`js/garage3d.js`, `js/garage.js`, `css/garage.css`, `tests/browser/garage.test.mjs`); **fizike vožnje se ne dotika**. Pred `main` uporabnikov ok na posnetku; z »Dež in sneg« (#647) gre v eno zbirno vejo (en krog testov), sama samo, če ok za Dež in sneg zamuja več kot dan.

## Vir

- 8 plošč animacij je v veji `nacrti` (`nacrti/plosce/an_gume`, `an_platisca`, `an_auspuh`, `an_spojler`, `an_turbo`, `an_zarometi`, `an_barvanje`, `an_aero`; vsaka 6–14 sličic telefona pokonci 412 × 915). Veja `nacrti` se **ne združi v `main`** (objavila bi jo stran; v njej so viri cen).
- Plošče so narisane s talnimi roboti, pred odločitvijo 7A (roki na obroču pod stropom). Kjer se plošča in poznejša odločitev razlikujeta, velja odločitev (`nacrti/odlocitve.md`): roki na obroču, sušenje s toplimi lučmi namesto sušilnega stebra, drobni deli iz predalov z vozičkom.
- Vrstice korakov, gumba PRESKOČI, bližnjega pogleda z oblačkom in gumba PREJ/POTEM dnevnik odločitev ne potrdi in ne zavrne: vprašanje `garaza-animacije-koraki`.

## Razlike med načrtom in igro (11. 11. 2026, `main` ae8ca63)

Izmerjeno v igri pokonci 412 × 915, avto VIHAR V8 (`muscle`), ura korakana kot v testu (`__garage.advance`).

| Postopek | Načrt | Igra zdaj | Trajanje igra / načrt |
|---|---|---|---|
| Gume | obe roki, vsa štiri kolesa eno za drugim (1/4 … 4/4), stara guma z obroča, nova nanj | ena roka prinese eno gumo in jo pritisne na eno kolo, ostala tri se zamenjajo hkrati | 12–13 s / ~10 s |
| Platišča | matice, kolo s pesta na tla, platišče v gumo, kolo nazaj, 5 matic, ×4 | ena roka pritisne platišče na eno kolo, ostala hkrati | 11,5–12,5 s / ~10 s |
| Auspuh | avto na dvigalu, ključ odvije objemko (iskre), stari ven, novi pod odbijač, zategne, avto dol, motor dvakrat zarohni s plamenom | daljna roka cev potisne s strani; brez roha (razen ob spremembi stopnje) | 11–11,5 s / ~8 s |
| Krilo | pokrovčka s pokrova, krilo 12 cm nad pokrovom, nogi se zaskočita, pogled od zadaj | roka krilo položi, nato dolg obhod kamere (~11 s) | 18–20,5 s / ~8 s |
| Turbo | pokrov motorja se dvigne in podpre, turbo na motor, vijaki, pokrov dol, motor steče | turbo pritisnjen na zaprt pokrov, nato roh in napis moči | 14–23,5 s / ~8 s |
| Žarometi | vijaka okvirja, stari žaromet ven, novi s pladnja predala, oba žarometa, preizkus luči | voziček iz predala, bližnja roka pritisne en del, oba se zamenjata hkrati, brez preizkusa luči | 18–19,5 s / ~7 s |
| Barvanje | megla z vrha, barva steče po bokih, sušenje | roki s šobama od nosu do repa, sušenje s toplimi lučmi (po poznejši odločitvi), kamera miruje | 15,5 s / ~8 s |
| Aero | pragova, ustnica pod odbijačem in krilo, kos za kosom z vozička | ena siva škatla pritisnjena na nos, ves paket se pojavi naenkrat | 12,5–13,5 s / ~8 s |

Skupno vsem ploščam: spodaj vrstica korakov s kljukicami, napis koraka in gumb **PRESKOČI ›**; na koncu bližnji pogled na novi del z oblačkom (podatki, cena) in gumb PREJ/POTEM; stari del gre na polico z novo oznako. Igra ima napis »KONČANO · …« (2,4 s), tap na sliko animacijo pospeši, kovanci se odštejejo v 0,7 s.

**Kjer roka dela ne doseže, se del samo pojavi** (`FIT.log` `plain`; pregled vseh 55 avtov): gume 0, platišča 4 (kamen, zrcalni, predsednik, goljat), auspuh 17 (merjasec, muscle, tur, gozdar, truck, tornado, lm, formula, titan, kamen, cisterna, zrcalni, vidra, ev, predsednik, goljat, superkombi), krilo 3 (titan, kamen, cisterna), turbo 2 (titan, cisterna), žarometi 8 in aero 8 (tur, truck, titan, kamen, cisterna, zrcalni, predsednik ter formula oziroma orel). Pravi žaromet roka nese na 35 avtih, drugje sivo škatlo; aero paket in skriti deli so vedno siva škatla.

## Vprašanji uporabniku (stran Odločitve biketraveler, 11. 11. 2026)

- `garaza-animacije-deli`: koliko postopkov naredim po načrtu (slike A–H; priporočeno vse).
- `garaza-animacije-koraki`: vrstica korakov, PRESKOČI, bližnji pogled z oblačkom, PREJ/POTEM (sliki I, J; priporočeno vse).

Odgovora (ko prideta) vpiši sem z datumom in dobesednim navedkom.

## Koraki izdelave

1. **Neodvisno od odgovora:** gume in platišča z obema rokama na vseh štirih kolesih (narejeno, Stanje); noben del se ne pojavi brez roke (zgornji seznam avtov; rezerva v `fitPart`: roka del prinese do najbližjega mesta, ki ga doseže mimo karoserije, od tam del skoči na avto, stari enako nazaj v roko); pravi del namesto sive škatle, kjer ga avto riše (avti brez `kit` delov ne rišejo posebej, zato tam ostane škatla; aero paket pride kos za kosom v koraku 2).
2. **Po odgovoru na `garaza-animacije-deli`:** auspuh (objemka, roh), krilo (pokrovčka, zaskok, krajši pogled), turbo (pokrov motorja), žarometi (oba, preizkus luči), barvanje (megla, kamera), aero (kos za kosom).
3. **Po odgovoru na `garaza-animacije-koraki`:** vrstica korakov in PRESKOČI (`garage.js`, `css/garage.css`; dogodki `hud('step', …)` iz `garage3d.js`), bližnji pogled in PREJ/POTEM.
4. Slike »zdaj in potem« in posnetek za uporabnikov ok; nato vrsta (`docs/vrsta.md`).

## Stanje

- 11. 11. 2026: seznam razlik in vprašanji objavljeni, osnutek pull requesta odprt (#653); izdelava koraka 1.
- 11. 11. 2026, korak 1, **gume in platišča** (`fitWheels` v `js/garage3d.js`): roki menjata **vsa štiri kolesa**. Daljna roka vzame dva kosa z regala (krajna v vrsti) in ju pritisne na daljni kolesi, stara nazaj na regal; bližnja roka staro gumo sname s platišča (golo platišče ostane na avtu), jo postavi na voziček in natakne novo z vozička; platišča ležijo na vozičku. Česar ni na regalu, pripeljeta dva vozička (drugi ob nos na daljni strani: med daljnima kolesoma sta steber in roki dvigalke). Avti, ki zadnji kolesi rišejo s karoserijo (8 od 55, npr. PICO, VIHAR V8): zadnji gumi roki pritisneta nazadnje hkrati in avto se zamenja v celoti. Novi avto stoji ves čas na mestu starega, skrit razen koles, ki so že zamenjana (`stageCar`). Kamera: regal, daljno kolo, bližnji kolesi od blizu (kolo, roka in voziček čez sliko; prej je bila spodnja polovica slike omara ali tla). Stran dobi dogodek `hud('step', { i, n })` po vsakem kolesu (za vrstico korakov, korak 3).
  - Pregled 55 avtov: gume z regala 4 kolesa na vseh; gume z vozičkoma 4 na 54 (GOLJAT 2); platišča 4 na 49, 3 na tur, titan, cisterna, 2 na kamen, zrcalni, goljat (do daljnih roka ne seže; zamenjajo se z avtom, ko kamera gleda bližnjo stran). Noben del se ne pojavi brez roke (`plain` 0; prej platišča na 4 avtih).
  - Trajanje: napis KONČANO po 12–14 s, konec (avto dol, roki parkirani, vozička ven) po 16–18 s; prej 12–13 s za eno kolo, načrt ~10 s. Tap na sliko animacijo pospeši kot prej.
  - Zavrnjene zamisli (ne ponavljaj): vrtenje plošče, predaja med rokama nad streho, premik avta po stezi, ležeč kup gum na vozičku, voziček med daljnima kolesoma, »stara najprej dol« pri kosih z regala (na regalu ni prostega mesta).
- 11. 11. 2026, korak 1, **noben del se ne pojavi brez roke** (rezerva v `fitPart`, `toss`): kjer roka mesta na avtu ne doseže mimo karoserije, del prinese do najbližjega mesta, ki ga doseže (ob mestu navzven, ob strani avta proti svoji polovici obroča, više; pri delu na strehi tovornjaka ob boku), od tam del v loku skoči na avto, stari enako nazaj v roko in z njo na regal ali voziček (`FIT.log` korak `hop`, dolžina skoka v koraku `plan`). Voziček se pri dolgem ali širokem vozilu ustavi tam, kjer ga roka še doseže.
  - Pregled 18 avtov s prejšnjega seznama (auspuh, krilo, turbo, žarometi, aero): `plain` 0 (prej 38 primerov). Skok: auspuh 0,25–0,5 m (17 avtov), žarometi 0,25–1,3 m (8), aero 0,4–1,6 m (8), krilo 2,7–2,9 m (titan, kamen, cisterna: krilo je 3,5 m visoko, roka ga drži ob boku), turbo 2,2 m (titan, cisterna). Trajanje primerov s skokom 12–21,5 s (skok doda 0,3–0,6 s v vsako smer).
  - Pregled ostalih 37 avtov (isti postopki): `plain` 0, skoka ni, trajanje kot prej.
  - Pravi del namesto sive škatle: avti brez `kit` delov dela ne rišejo posebej (`Render.deliMesh` vrne nič), zato tam ostane škatla; aero paket (večji od 1,7 m) pride kos za kosom v koraku 2.
- 11. 11. 2026, korak 2, **krilo po plošči načrta** (`fitPart`, `wing`; začeto pred odgovorom na `garaza-animacije-deli`, ker je krilo v možnostih 1 in 2; svoj commit, da ga drugačen odgovor čisto vrne): daljna roka prinese krilo z regala, bližnja medtem pride ob rob pokrova. Krilo obstane 12 cm nad pokrovom, pokrovčka s pokrova skočita v prijemalo bližnje roke (ta se z njima umakne), krilo se zaskoči (iskre pri nogah, avto se rahlo ugrezne), nato pogled od zadaj z bleski in napis KONČANO. Deli stopnje aero (na avtih brez `kit` delov je to krilo, ki ga avto nosi) se pojavijo ob zaskoku (`levelNow`); dolgega obhoda kamere z vetrovnikom (~11 s) po krilu ni več.
  - Avto prej brez krila (`wing.bare`: brez dela, brez lastnega krila, brez krila aero paketa): starega dela ni, roka se vrne prazna (prej je na regal nesla kopijo novega kosa), mesto na regalu ostane prazno do naslednje menjave. Sicer (zamenjava krila, avto z lastnim krilom, krilo aero paketa na pokrovu): brez pokrovčkov, stari del gre nazaj na regal med pogledom od zadaj. SERIJSKO: voziček s škatlo kot prej, konec kratek.
  - Pregled 55 avtov (GT krilo z regala na serijski avto): napis KONČANO po ~7 s, konec po 9–11,5 s (prej 18–20,5 s; načrt ~8 s). 47 avtov z dvema pokrovčkoma, 2 brez (blisk, hrosc: žarek na ozkem zadku oziroma kesonu ne najde pokrova; potek sicer enak), 3 z lastnim krilom (rally, lm, formula: stari del nazaj na regal), 3 s skokom (titan, kamen, cisterna: krilo na vrhu kabine). Pri dolgem avtu (predsednik, tur, zrcalni) bližnja roka stoji pred koncem pokrova, kolikor seže obroč.
  - Omejitev, enaka kot na `main`: z regala roka nese vzorčni kos (splošne oblike, v barvi avta); krilo, kot ga avto riše (lastno pri avtih s `kit` deli, krilo stopnje pri drugih), se pokaže ob zaskoku. Račji rep na avtu brez `kit` delov nima svoje podobe (stopnja aero 0).
- 11. 11. 2026, korak 2, **auspuh po plošči načrta** (`fitPart`, `exS`; svoj commit kot krilo): avto gre na dvigalo (0,55 m), medtem ko daljna roka jemlje cev z regala. Bližnja roka s ključem pride pod zadnji odbijač in odvije objemko (dva snopa isker), daljna roka cev prinese od zadaj pod odbijač (kamera zadaj in nizko), stari del gre ven in novi noter, ključ zategne (en snop), avto se spusti, motor dvakrat zarohni (dim, ob drugem plamen), napis KONČANO. Če auspuh dvigne stopnjo motorja, namesto roha teče kratka predstava motorja pri zadku (`upShow(…, brief)`: deli stopnje, roh, napis MOČ z obema številkama); električni avto namesto roha utripne (`evPulse`).
  - Mesto se načrtuje pri dvignjenem avtu (`setLift(FIT.lift)` med načrtom, nato nazaj), ključ dobi svojo pozo ob objemki (`exS.wr`, `wrenchAt`); avto po menjavi obdrži načrt dvigala (`fitSwap(cv, nw, true)`).
  - Pregled 55 avtov (Titanov z regala na serijski avto): `plain` 0, napak 0. KONČANO po ~9 s, konec po 12–12,5 s (prej 11–11,5 s brez dvigala in roha; načrt ~8 s). Ključ na 49 avtih; 6 dolgih (tur, titan, kamen, cisterna, zrcalni, predsednik) je brez ključa, ker je zadek zunaj dosega obroča (zapestje seže do 2,7 m od sredine), dvigalo, cev in roh so enaki. Cev skoči z roke na mesto 0,25–0,5 m na 17 avtih (isti kot v koraku 1).
  - SERIJSKO in cev z vozička: del nese bližnja roka, zato ključa ni; dvigalo, spust in roh so enaki.
