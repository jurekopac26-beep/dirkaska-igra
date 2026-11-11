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

1. **Neodvisno od odgovora:** noben del se ne pojavi brez roke (zgornji seznam avtov); pravi del namesto sive škatle, kjer ga avto riše; gume in platišča z obema rokama na vseh štirih kolesih.
2. **Po odgovoru na `garaza-animacije-deli`:** auspuh (objemka, roh), krilo (pokrovčka, zaskok, krajši pogled), turbo (pokrov motorja), žarometi (oba, preizkus luči), barvanje (megla, kamera), aero (kos za kosom).
3. **Po odgovoru na `garaza-animacije-koraki`:** vrstica korakov in PRESKOČI (`garage.js`, `css/garage.css`; dogodki `hud('step', …)` iz `garage3d.js`), bližnji pogled in PREJ/POTEM.
4. Slike »zdaj in potem« in posnetek za uporabnikov ok; nato vrsta (`docs/vrsta.md`).

## Stanje

- 11. 11. 2026: seznam razlik in vprašanji objavljeni, osnutek pull requesta odprt; izdelava koraka 1.
