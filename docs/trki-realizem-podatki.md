# Trki: podatki analize (9.–10. 11. 2026)

Surovi izidi analize fizike trkov za temo `docs/trki-realizem.md` (veja `trki/realizem`, #608): pet merilcev po vrstah stikov, zbiralec ciljev in trije neodvisni preverjalci. Datoteka je sestavljena strojno iz njihovih izidov, brez krajšanja; meritve ponovijo skripte `tools/trki/*.js` (`--cv <n>` izbere različico, `--json` da številke). Vse velja za stanje `main` 9. 11. 2026 (klasična fizika in različica Simulacija, če ni napisano drugače).

Preverjanje: 3 od 3 preverjalcev je končalo (avto-avto, zid, ostalo). Sodbe: potrjeno 48, popravljeno 11, OVRŽENO 2. Odstopanje brez sodbe ni bilo preverjeno.

## Odstopanja

Urejena po tem, kako močno jih igralec čuti (5 = v vsaki dirki); ovržena so na koncu.

### [5] Klasična fizika zasuka avto samo ob zadetku v zadek; zadetek v prednji del ga skoraj ne obrne

- Oznaka: `mase-zasuk-spredaj` · področje: Mase, prikolice in različice · zaupanje merilca: high · preverjanje: popravljeno
- Scenarij: Pravokotno v bok burje pri 120 km/h, v zadnjo os, sredino ali prednjo os; zadeti stoji ali pelje počez pri 60 km/h. Tudi kamen 7 t v prednjo os stoječe miške.
- Izmerjeno: Zadnja os: zasuk 180 st in 178 st, yaw 666 in 792 st/s, xgl 1,00. Prednja os: 41 st (yaw 74 st/s) in 6 st (45 st/s), xgl 0, manjka 96-100 % zasuka. Miška, zadeta od kamna v prednjo os pri 120: 0 st, 0 st/s, 2 s jo nese na nosu. V 8 scenarijih ohranitve manjka v cs 62-100 % zasuka.
- Popravljena meritev (preverjalec): Zadnja os: zasuk 268° (zadeti stoji) in 478–500° (pelje 60 km/h), yaw 665 in 764–792 °/s, xgl 1,00. Prednja os: 41° (74 °/s) in 6° (45 °/s), xgl 0, vzeti zasuk 0.
- Pričakovano: Sunek na ročici r da togemu telesu dw = r x P / I, enako velik spredaj in zadaj: za burjo na ročici 1,19 m 11,3 rad/s (647 st/s), za miško pod tovornjakom okoli 21 rad/s. Tudi zadetek v prednje kolo avto odbije in zavrti za desetine stopinj. (vir: Zakon o ohranitvi vrtilne količine (sunek sile na ročici, ravninski trk togih teles); odprta literatura o rekonstrukciji prometnih nesreč, model ravninskega trka.)
- Ponovitev: node tools/trki/mase-razlicice.js --only razlicice -> tabela »3 mesto zadetka«, vrstice [cs]; node tools/trki/mase-razlicice.js --only mase -> vrstica »T T>L-stoji pri prednji osi miska/kamen 120«
- Predlog: V kTake (cs) naj izguba oprijema in zasuk ne bosta vezana samo na zadnjo os: nad neko hitrostjo približevanja (npr. 6 m/s) naj del dw (30-50 %) vedno preide v w, pri potisku nosu pa naj nos odnese (xgl po razliki /ar - af/ v obe smeri). Nežni dotiki (naslon, sunek pod 4 m/s) ostanejo, kot so.
- Dokaz preverjalca: Prednja os potrjena z lastnim preizkusom: stoječi −41,2° (74 °/s, xgl 0, vzeti dw 0 ob togi vsoti −1379 °/s), pri 60 km/h počez −5,6° (45 °/s). Zadnja os pa ni 180/178°: skripta je zasuk brala z wrap(c.h − h0), ki se ustavi pri 180° (popravljeno, glej rig_issues). Razlika spredaj/zadaj je še večja, kot je zapisano. Miške pod kamnom v prednjo os nisem ponovil sam.

### [5] Po hudem poševnem trku je avto v 0,15–0,3 s spet raven in vozen

- Oznaka: `zid-posevni-trk-brez-posledic` · področje: Ograja in zid · zaupanje merilca: medium · preverjanje: popravljeno
- Scenarij: BURJA R7, klasična fizika, asfalt ob ograji, brez vnosa: 15°/200, 30°/120 in 30°/200 km/h (normalna hitrost 52–100 km/h)
- Izmerjeno: 30°/200: 200 → 156 km/h v 1 koraku, ograjo zapusti po 0,15 s pri 143 km/h (72 %), izstopni kot 0,9°, nos vzporeden, »raven« (brez stika, zasuk pod 3 °/s, zdrs pod 3°) po 0,20 s; s plinom 175 km/h po 2 s. 30°/120: 84 km/h ob odhodu, raven po 0,32 s. 15°/200: 177 km/h, raven po 0,15 s. Posledica je samo škoda (45–99 %) in verjetnost predrtja 17–32 %. Ograja ne vzame oprijema (xgl nastavijo le trki med avti); --cv 1–5 dajo za sam avto iste vrstice.
- Popravljena meritev (preverjalec): 30°/200 v dirki (Race.step, kosi, Samo videz ali Vklop): 156 po 1. koraku, 112 km/h pri 0,15 s (56 %), v0,5 107-110, v2 98-100; Bathurst 113 (0,15 s) / 104 ob odlepitvi, v2 67; Spa 107, v2 61. Brez kosov (škoda Izklop ali način 'sam'): 143 km/h (72 %). 30°/120: 84 (70 %); 15°/200: 174-177 (asfalt), 150 (Bathurst); 15°/120: 106. Naravnan: 0,15-0,32 s (asfalt do ograje), 0,23-0,8 s (trava pred ograjo), 2,3-2,8 s (Bathurst 30°/200). Izhodni kot 0,5-2,9°. Pričakovano po referencah pri 30°: 66-73 %, ne 50-65 %.
- Pričakovano: Pri normalni hitrosti nad ~35–40 km/h (preskusi ograj segajo do 100–110 km/h pod 20–25°) trk ni več čista preusmeritev: deformacija požre skoraj vso normalno energijo, trenje med mečkanjem je 0,4–0,7 (ne 0,25), avto zapusti ograjo s ~50–65 % hitrosti, zasukan in brez oprijema še 1–2 s (zadek udari v ograjo, zanaša). Pri 30°/200 (normalno 100 km/h) avto ne vozi naprej. (vir: Ohranitev gibalne količine in Coulombovo trenje pri trku togega telesa (v' = v·cos θ − μ(1+e)·v·sin θ); merila preskusov varnostnih ograj EN 1317-2 in NCHRP Report 350; odprta literatura o čelnih in poševnih preskusih trka v togo oviro)
- Ponovitev: node tools/trki/zid.js --del matrika → MATRIKA 1a, vrstice »30 200 nic«, »30 120 nic«, »15 200 nic« (stolpci vL, izh, rav, sk); z --cv 3 iste vrstice
- Predlog: Nova različica naj resnost veže na normalno hitrost vn: do ~8 m/s preusmeritev kot zdaj; nad tem del normalne energije v mečkanje (μ raste z vn proti 0,5–0,6), po trku izguba oprijema kot pri trku med avti (xgl sorazmeren sunku, 0,6–1,5 s) in poln zasuk iz ročice, da avto zanese; nad ~20 m/s normalno avto obstane.
- Dokaz preverjalca: Njihov način 'sam' (stepLone) nima kosov karoserije iz zanke dirke. Brez kosov ponovim točno prek Race.step na asfaltnem ovalu: 30°/200: 156 po 1. koraku, 143 km/h ob odlepitvi (0,15 s), naravnan v 0,20 s; 30°/120: 93/84, 0,32 s; 15°/200: 186/177, 0,15 s; 15°/120: 111/106, 0,23 s. V pravi zanki dirke (Race.step s kosi; škoda Samo videz ali Vklop) pa 30°/200 da 112 km/h pri 0,15 s (56 %, ne 72 %), v0,5 107-110, v2 98-100 (ne 126): avto zadene svoja 2 odpadla kosa (-31 km/h). Prave proge 30°/200: Bathurst ravnina 113 pri 0,15 s, 104 ob odlepitvi, v2 67; Bathurst gora 113, v2 89; Spa 107, v2 61. 15°/200: Bathurst 150 ob odlepitvi (brez kosov 161), Spa v0,5 133 (brez kosov 156). 30°/120 in 15°/120: kosi brez vpliva. 'Spet naravnost' v 0,15-0,32 s drži samo za asfalt do ograje; s travo pred ograjo 0,23-0,8 s (Bathurst 15°/120 0,49; 30°/120 0,66; 15°/200 0,78), Bathurst 30°/200 2,3-2,8 s. xgl ostane 0 (zid ga nikoli ne nastavi: v core.js ga nastavijo samo trki avtov in sedlo, vrstice 2399, 3958, 4009). Izhodni kot 0,5-0,9° na asfaltu, 0,9-2,9° na Bathurstu. Udarec repa obstaja: 30°/200 drugi udarec 10,2 m/s pri 0,158 s ustavi zasuk s 169 na -9 °/s v enem koraku. Pričakovana vrednost je pretirana: reference naloge dajo 72-88 % pri 20-25° in 40-50 % pri 45° (mu 0,15-0,4), model impulza pri 30° torej 66-73 %; igra brez kosov (72 %) je v razponu, s kosi (56 %) pod njim; '50-65 %, mu 0,4-0,7' ni podprto. Resnično ostane: po trku ni zasuka ne izgube oprijema (naravnan v ~0,2 s, izhodni kot < 1° namesto 3-10°), del tega je namerno mehčanje (opombi 9a/9e). Tekmec z AI po 30°/120: od ograje v 0,5-0,7 s, po 1 s spet 115 km/h (asfalt), 89-90 (Spa, Bathurst).

### [5] Lahek predmet v sredino avta zavira kot zid: avto ga zadeva 20–120 korakov zapored

- Oznaka: `predmeti-ponovni-stik` · področje: Predmeti, razbitine, promet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Rally (1150 kg) brez plina na ravnem ovalu, predmet na sredini poti, 60/120/200 km/h, primerjava s kontrolno vožnjo brez predmeta; isto na Spa in Bathurstu ter v semenski dirki 13 avtov (vrsta predmetov čez cesto 250 m za štartom).
- Izmerjeno: Stožec 3 kg: 31/26/26 korakov stika, izguba 4,9/11,6/11,5 % (−3,0/−13,9/−22,9 km/h). Guma 9 kg: 17,2/29,9/31,6 %. Zaboj 18 kg: 38,3/41,7/52,1 %. Bala 26 kg: 42,8/49,7/62,3 % (−124,5 km/h pri 200). Sklad bal 78 kg: 45,1/59,3/61,8 %. Pri 120 km/h ima 21 od 39 zadetih vrst več kot 3 korake stika. En sam stik je pravega reda: stožec 0,48 %, bala 4,16 %. Zamik 0,2 m pri 60 km/h: stožec še 1,9 %, bala 18,1 %. Spa pri 120 km/h: stožec 13,2 %, bala 52,8 %. V dirki (na plinu, ~55 km/h): bale povprečno 8,0 %, največ 26,9 %, zaostanek do 11,2 m; Bathurst (83 km/h): bale povprečno 12,8 %.
- Pričakovano: Izguba avta ≤ (1+e)·m/(M+m), neodvisno od hitrosti: stožec 0,35 %, guma 1,05 %, zaboj 2,1 %, bala 3,0 %, sklad bal 8,6 %. Po enem trku je predmet hitrejši od avta (do (1+e)·v), zato ponovnega stika ni. Merilo naloge: 5-kg stožec ne sme vzeti več kot ~0,5 %. (vir: Ohranitev gibalne količine in Newtonov trkovni zakon (koeficient odboja); js/core.js propCarHit (meja hitrosti predmeta min(18, 0,72·v + 2) m/s, pod hitrostjo avta nad 26 km/h) in propFeel (delež hitrosti na vsak korak stika).)
- Ponovitev: node tools/trki/predmeti.js --del predmeti (vrstice cone, tyre, crate, bale, bstack, zamik 0); --del zamik; --del proga; --del dirka (tabela vrste predmetov)
- Predlog: V novi različici naj avto dobi enak in nasproten sunek kot predmet (Δv = j/M, z ročico tudi zasuk) enkrat na stik, namesto deleža hitrosti na korak v propFeel; meja hitrosti predmeta naj bo (1+e)·v avta, da predmet odleti naprej in ga avto ne dohiti. Ne spreminjaj: predmet se umakne (avto se nikoli ne zatakne), skladi se razsujejo, zvok in učinki (hitDebris), spanje predmetov, obstoječe različice trkov 1–5.
- Dokaz preverjalca: Lastna meritev po drugi poti (izguba hitrosti neposredno znotraj Race.stepProps, brez kontrolne vožnje; Spa in Bathurst, najdaljša ravnina, brez plina, zadetek v sredino, 60/120/200 km/h): stožec 5,4/13,3/10,6 % (Spa) in 4,9/11,3/10,4 % (Bathurst), 40/30/24 in 29/25/23 korakov stika; guma 15,1/31,5/31,2 in 13,3/29,5/29,2 %; zaboj 32,1/41,8/54,7 in 27,2/40,8/48,6 %; bala 39,1/50,0/63,3 in 36,1/48,2/61,0 %; sklad bal 45,8/66,3/76,6 in 51,8/64,5/63,6 %. Na polnem plinu pri 120 km/h: stožec 13,9 %, bala 54,6 %. Ni artefakt plina, proge ali kontrolne vožnje. Vzrok v kodi potrjen: hitrost predmeta je omejena na min(vmax 18, 0,72·v + 2) m/s, zato ga avto nad ~26 km/h dohiteva, propFeel pa vzame k = min(4,5 %, m·0,16 %) na VSAK korak stika. Omejitev: velja za zadetek v sredino (±0,1 m); povprečje po širini avta je 3-7x nižje (v-ostalo-predmet-povprecje). Pri 60 km/h je število korakov kaotično (±20 %).

### [5] Odpadel del, ki ga avto rine pred sabo, vzame do 6 % hitrosti na vsak korak stika

- Oznaka: `predmeti-del-rinjenje` · področje: Predmeti, razbitine, promet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Poskus: del drsi 6 m/s, leti z 0,7 v ali je tik pred avtom (1 m/s počasnejši), zadetek v sredino pri 60/120/200 km/h; lasten del, ki odpade med vožnjo. Semenske dirke s trkom (postavitve formula, lm, car) na Spa in Bathurstu, 60 s.
- Izmerjeno: Pokrov (m 14): drseč 9,0/12,7/10,9 % v 2–3 korakih, tik pred avtom 13,7/9,6/7,8 % (−15 km/h pri 200), lasten pokrov 12,5/8,2/5,6 %. Odbijač (m 7): 6,1/6,6/4,9 %, lasten 8,4/4,4/2,9 %. Blatnik (m 5): 4,5/4,8/3,7 %. Ogledalo (m 1): 0,9–2,2 %. V dirki: Spa lm, igralec 960 kg rine svoj blatnik 62 korakov (0,9 s) od 171 km/h: −121 km/h, od tega sami stiki 71,4 %; Spa formula 798 kg: 69 korakov, −117 km/h, 75,2 %; Bathurst formula, tekmec ob odbijač pri 211 km/h: 8 korakov, 20,3 %.
- Pričakovano: Mase delov: ogledalo ~1 kg, blatnik 3–5, odbijač 4–8, pokrov 10–18 kg. Izguba enkrat na del ≤ (1+e)·m/(M+m): pokrov 14 kg ob 1150 kg ≤ 1,6 %, odbijač ≤ 0,8 %, blatnik ≤ 0,6 % (ob 798-kg formuli ≤ 0,85 %), ogledalo ≤ 0,1 %. Del, ki ga avto rine, ne jemlje hitrosti, razen trenja ob tla (5 kg · 6,5 m/s² = 33 N, pri 800 kg 0,04 m/s²). (vir: Ohranitev gibalne količine; js/core.js debrisHit (premikajoč del: k = min(0,06, d.m·0,004) na vsak korak stika z vrel > 0,3 m/s, brez mase avta in brez vrel).)
- Ponovitev: node tools/trki/predmeti.js --del razbitine; --del svoj; --del dirka (tabela isti avto in isti del: spa lm, spa formula, bathurst formula)
- Predlog: Masa dela v kg in izguba avta iz sunka (j/M) enkrat na stik; nov stik z istim delom šele po ločitvi (zastavica kot d.on pri ležečem delu). Del, ki ga avto dohiti, naj se odrine vstran ali pod avto, ne ostane pred nosom. Ne spreminjaj: največ 40 kosov, deli ostanejo znotraj ograje, zvok in tresljaj ob zadetku, obstoječe različice.
- Dokaz preverjalca: Lastna meritev (izguba neposredno v fazi debrisHit, med Race._tlStep in Race.stepProps; Spa, 60/120/200 km/h). Drseč del (6 m/s): pokrov 13,3/15,0/14,2 % v 3 korakih, odbijač 6,9/9,7/7,5 %, blatnik 6,2/7,1/5,5 %, ogledalo 1,6/2,7/1,8 %. Tik pred avtom: pokrov 18,3/14,4/9,8 %, odbijač 13,5/11,8/7,1 %, blatnik 11,3/11,6/6,6 %, ogledalo 4,2/7,5/4,1 %. Lasten del: pokrov 13,4/9,5/5,6 %, odbijač 9,0/6,7/2,8 %. Moje številke so enake ali do 1,5x višje (daljše okno 6 s). Dirke s semenom: Spa lm, igralec 960 kg: 70 korakov stika v 1,5 s, 171 -> 25 km/h, od tega 117,7 km/h samo v stikih z delom (merilec -121); Spa formula 798 kg: 70 korakov, 162 -> 32 km/h, 105,3 km/h (merilec -117); Bathurst formula, tekmec pri 211 km/h: 8 korakov, -43,0 km/h = 20,4 % (merilec 20,3 %). Koda: k = min(6 %, m·0,4 %) na vsak korak stika z vrel > 0,3 m/s.

### [4] Trd bočni sunek v sprednji del: zadeti avto se ne zavrti in vozi naprej kot po tirih

- Oznaka: `avto-sunek-v-nos-po-tirih` · področje: Avto ob avto (enaki masi) · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: tbone-120-cross-front (A s 120 km/h pravokotno v sprednjo os B, ki prečka s 120 km/h), tbone-200-cross-front, tbone-60/120-stand-front; klasična fizika, Simulacija
- Izmerjeno: B: 120 → 113 km/h po 0,1 s, 99 po 0,5 s, 87 po 2 s; nos največ −2,9°, smer vožnje po 2 s −2,3°; v 0,78 s je prestavljen 8,9 m v stran in spet raven. Prečnih 17,1 m/s zdrgne v 0,78 s (okoli 2,2 g). Tog sunek bi dal B −417 °/s in A +576 °/s, vzeto 0 / 0, xgl 0. S plinom B nikoli ne pade pod 113,8 km/h. Pri 200 km/h zasuk −4° in 21,6 m v stran. Stoječi B: pri 60 km/h enako kot zadetek v sredino (26 / 26 km/h, zasuk 0°, 16 sunkov namesto 2), pri 120 km/h −41° brez izgube oprijema. Strelec A se zasuka 7°.
- Pričakovano: Prečna hitrost 17 m/s ob vzdolžni 27 m/s pomeni kot zdrsa nosu okoli 32°, daleč čez mejo pnevmatik (5–10°): sprednji del zdrsne, avto dobi 300–400 °/s, se zasuka za 60–180° in drsi 1–2 s. Smer gibanja težišča se obrne za 25–30° (vektor (17; 27) m/s) in se sama ne vrne v prvotno. (vir: Ohranitev gibalne in vrtilne količine; ravninska mehanika trka togih teles (Vehicle Accident Analysis and Reconstruction Methods); meja bočne sile pnevmatike (Fundamentals of Vehicle Dynamics); js/core.js kTake: g = clamp((ar − max(aH, af)) / aS) je 0, kadar je nos potisnjen bolj kot zadek)
- Ponovitev: node tools/trki/avto-avto.js --only tbone-120-cross-front (tabela »the turn«: rigid dw, taken dw, shift); po korakih: node tools/trki/avto-avto.js --trace tbone-120-cross-front
- Predlog: Izguba oprijema naj velja tudi, ko je trdo potisnjen nos (af nad pragom okoli 0,25–0,3 hitrosti ali prečni Δv nad ~6 m/s): xgl po velikosti sunka in kotna hitrost dw v c.w; prečni del nad tem, kar pnevmatike ujamejo, naj se drgne z drsnim trenjem (CRASH.slide 0,9 g) in obrne smer vožnje. Ne sme se spremeniti: lahki dotiki v sprednji bok (pit-*-front-2 in -4: zasuk 2–6°, xgl 0), drgnjenje bok ob boku in sunek od zadaj.
- Dokaz preverjalca: Lasten preizkus (v1.js tbone; korak kot v dirki: avta, nato par; po trku brez vnosov): cs, T 120 v prednjo os prečkajočega pri 120: B 120 → 112/98/86 km/h (0,1/0,5/2 s), zasuk največ −3,1°, xgl 0, vzeti dw 0 ob togi vsoti −572/+689 °/s, 11 sunkov. Enako, če je B igralec in če je vrstni red para zamenjan. 200 km/h −5,2°; stoječi B: 60 km/h 0,0°, 120 km/h −41,2° (74 °/s, xgl 0). Isti trk v zadnjo os: 268° (665 °/s). Ni artefakt krmilnika, enot ali vloge.

### [4] Dotik in potiskanje v zadnji bok: izid ni urejen po moči sunka, trajen potisk ne zavrti

- Oznaka: `avto-zadnji-bok-nemonotono` · področje: Avto ob avto (enaki masi) · zaupanje merilca: medium · preverjanje: popravljeno
- Scenarij: pit-60-rear-2/4/8, pit-120-rear-4/8 (tekmec v igralčev zadnji bok), side-200-a10-dv20 (A 20 km/h hitrejši rine v zadnji bok B); klasična fizika
- Izmerjeno: 60 km/h: 2 m/s −5°; 4 m/s −104° (xgl 1, nazaj po 1,63 s, 9 sunkov); 8 m/s −39° (xgl 1, nazaj po 0,63 s, 1 sunek). S plinom obratno: 4 m/s −45°, 8 m/s −98°. 120 km/h: 4 m/s −11° brez izgube oprijema, avta naslonjena 6 s; 8 m/s −22° (xgl 0,53, nazaj po 0,32 s). 200 km/h, trajen potisk: 477 sunkov v 6 s, B −7°, xgl 0, oba 178 km/h (A ne pride mimo, B se ne zavrti). Bok ob boku 60 km/h, 10°: pasivni B 6°, B, ki z volanom drži pas, 121° (xgl 1).
- Popravljena meritev (preverjalec): 60 km/h, cel stik brez vnosov, 2/4/5/6/8/10 m/s: −5/−37/−104/−95/−40/−63°; samo prvi sunek: −1/−8/−17/−24/−40/−63° (monotono). 120 km/h: 4 m/s −10° (xgl 0), 8 m/s −22° (xgl 0,53). 200 km/h: prvi sunek do 10 m/s največ −7,7°, cel stik največ −19°, xgl 0.
- Pričakovano: Močnejši sunek da večji zasuk (monotono), plin tega ne obrne. Po togem sunku je zdrs zadnje osi pri 60 km/h okoli 3° (2 m/s), 6° (4 m/s) in 12° (8 m/s): brez popravka pod 10°, 10–40° in nad 90°. Trajen potisk v zadnji bok s silo blizu meje pnevmatik zavrti avto v približno 1 s (tako deluje policijski manever zaustavitve s potiskom zadka). (vir: Vrtilna količina in meja bočnega oprijema pnevmatike (Race Car Vehicle Dynamics; Fundamentals of Vehicle Dynamics); js/core.js kTake: vsak sunek z g > 0,02 znova nastavi xglT, potisk korak za korakom pa nosu »ne navija naprej« (komentar pri kTake))
- Ponovitev: node tools/trki/avto-avto.js --only pit-60-rear (tabeli »the turn« in »the contact«); node tools/trki/avto-avto.js --only side-200-a10-dv20
- Predlog: Trajanje izgube oprijema naj določa največji sunek (xglT sorazmeren z g; drobni sunki naslanjanja ga ne podaljšujejo), trajen potisk v zadnji bok pa naj se sešteva (npr. prečni sunek zadnje osi v zadnjih 0,3 s) in vzame oprijem, ko preseže prag. Ne sme se spremeniti: 2 m/s ostane 3–5° brez izgube oprijema pri vseh hitrostih, sprednji bok nikoli ne zavrti, drgnjenje pri 3° ostane brez zasuka nad 8°.
- Dokaz preverjalca: Pojav je resničen, posamezne številke pa so občutljive na začetno lego: moja postavitev (reža 0,4 m namesto 0,3 m) premakne −104° s 4 na 5 m/s. Samo PRVI sunek (A po njem ne trka več) je monoton, nemonotonost torej naredijo ponovni sunki para, ki ostane v stiku. S plinom: 4 m/s −44,0°, 8 m/s −100,9° (njihovo −45/−98: potrjeno). Trajen potisk ne zavrti: potrjeno (120 km/h 4 m/s −9,7°, xgl 0, 203 sunki; 200 km/h 8 in 10 m/s −17,6/−19,2°, xgl 0; 40–50 km/h 2 m/s −2,8/−3,9°, toga vsota −584/−1151 °/s, vzeto 0). Vrstica »B z volanom drži pas: 121°« je artefakt krmilnika pasu in ne šteje (merilec to sam navaja v gaps).

### [4] Bočni zdrs po trku se ustavi z 2,4 g; par po T-trku stoji v manj kot 2 s

- Oznaka: `mase-bocni-zdrs-2g` · področje: Mase, prikolice in različice · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Burja pri 120 km/h pravokotno v bok stoječe burje (cs, Simulacija), brez plina in zavore po trku.
- Izmerjeno: Zadeti avto bočno 17,40 -> 15,47 -> 13,53 -> 11,60 m/s na vsakih 0,083 s: 23,2 m/s2 = 2,36 g; iz 62,6 km/h bi stal v 0,75 s na ~6,5 m. Ko ga avto za njim dohiti (po 0,39 s), par zavira z 1,21 g: pri +0,5 s 39/39 km/h, pri +2 s 0/0. Trčeči avto sam zavira le 0,09 g.
- Pričakovano: Avto, ki drsi bočno, zavira s trenjem drsenja gum, 0,7-0,9 g na suhem asfaltu: iz 62,6 km/h 2,0-2,5 s in 17-22 m; par (eden drsi, drugi se kotali) okoli 0,45-0,5 g. (vir: Coulombov zakon trenja; koeficienti drsenja guma-asfalt iz odprte literature o rekonstrukciji nesreč (0,7-0,8 suho).)
- Ponovitev: node tools/trki/mase-razlicice.js --only xxx --trace "T 120>stoji" --tspan 0.75 (drugo telo, stolpec cS); node tools/trki/mase-razlicice.js --only razlicice -> vrstica »T 120>stoji / Simulacija«
- Predlog: V stepCS naj se velik prečni sunek (npr. nad 6 m/s) briše s trenjem drsenja (okoli 0,9 g x podlaga) namesto z oprijemom ovinka aL; majhni sunki (naslon, dotik) naj ostanejo hitri kot zdaj. Preveriti z avtošolo Drift in testi trki.
- Dokaz preverjalca: Lasten preizkus: zadeti drsi bočno z 2,37 g (iz T-trka 60/120/200 km/h stoji po 0,41 s / 1,8 m, 0,81 s / 7,4 m, 1,34 s / 20,7 m); par pri 120 km/h 1,42 s / 11,6 m (~1,2 g). 2,37 g = CSK.aL 1,30 × amax 1,82, to je meja avta v ovinku (v vožnji izmerjeno 2,38 g); zaviranje 1,65 g; lastni zdrs igre brez oprijema 0,9 g. Pričakovanih 0,7–0,9 g velja za resnične gume; za avto igre je dosledna meja 0,9–1,65 g.

### [4] Škoda ne pozna mase: tovornjak dobi enako škodo od karta kot od tovornjaka

- Oznaka: `mase-skoda-brez-mase` · področje: Mase, prikolice in različice · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Kamen 7000 kg proti miški 560 kg in mravlji 165 kg, celno 120+120 in T pri 120 km/h.
- Izmerjeno: Celno: kamen spremeni hitrost za 6,1 km/h (mravlja) ali 19,8 km/h (miška), škoda obakrat 0,55; lahki 247-260 km/h, škoda 1,00. T pri 120: kamen 0,26, če zadene ali je zadet (dv 3-18 km/h); lahki 0,47-0,61 (dv 124-270 km/h).
- Pričakovano: Resnost trka za vozilo meri njegova lastna sprememba hitrosti dv_i = (1+e) vc m_j/(m_i+m_j): 7 t težko vozilo po trku s 165 kg kartom skoraj nima škode, kart pa je uničen že pri veliko manjši hitrosti. (vir: Zakon o ohranitvi gibalne količine; sprememba hitrosti (delta-v) kot merilo resnosti trka v odprti literaturi o varnosti vozil.)
- Ponovitev: node tools/trki/mase-razlicice.js --only mase -> tabela »škoda (Car.dmg po 2 s)«
- Predlog: V carKnockFx vsakemu avtu pomnoži imp z njegovim deležem: imp_i = imp x 2 m_j/(m_i+m_j) (enaki teži: 1, torej brez spremembe), omejeno npr. na 0,15-1,6; knockK ostane. Za prikolice vzemi maso celega sklopa.
- Dokaz preverjalca: Lasten preizkus (v3.js mass): celno 120+120 miška/kamen: miška škoda 1,00 (−128 km/h v enem sunku), kamen 0,56 (dv 21 km/h); kamen/kamen 0,56/0,56; pri 60+60 0,26/0,48. Koda carKnockFx: knock(c, (imp − 3,5)·0,016) × dmgK, isti imp za oba, mase ni. Omejitev pomena: razmerje mas nad 2 je le v poljih 5 od 56 vozil (kamen z miško 12,5), mravlja kamna v dirki ne sreča; privzeta škoda je »Samo videz«.

### [4] Nova fizika odreže zasuk po trku: omejitev 3,2 rad/s in ugašanje v 0,03 s

- Oznaka: `mase-nova-zasuk-ugasne` · področje: Mase, prikolice in različice · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Burja pri 120 km/h pravokotno v zadnjo os stoječe burje ali burje, ki pelje počez pri 60 km/h (nova, Simulacija).
- Izmerjeno: Trk da 11,62 rad/s (666 st/s), po enem koraku avta 3,20 rad/s, nato -27 % na korak; zasuk skupaj 11 st (cs 180 st), pri 60 km/h počez 13 st (yaw 792 st/s). 26 sunkov, 19 nad 0,5 m/s, smer približevanja se zamenja 19-krat. Vzrok v kodi: stepNova vsak korak w = clamp(w, +-NVK.rMax 3,2); pri avtu, ki ne pelje naprej, w += (rT - w) min(1, dt / 0,03).
- Pričakovano: Trenje gum da največ približno mu m g x polovica medosja / I = 9 rad/s2 (0,075 rad/s na korak): 11 rad/s ugaša okoli 1 s, avto se obrne za 180 st ali več. (vir: Dinamika togega telesa s Coulombovim trenjem (navor gum omejen s trenjem); zakon o ohranitvi vrtilne količine.)
- Ponovitev: node tools/trki/mase-razlicice.js --only xxx --trace "T 120 > zadnja os, zadeti stoji" --phys nova --tspan 0.12; node tools/trki/mase-razlicice.js --only razlicice -> »3 mesto zadetka«, vrstice [nova]
- Predlog: Omejitev rMax naj velja za vožnjo, ne za zasuk iz trka (npr. brez nje, dokler traja xgl ali 1 s po sunku), in veja za parkiranje/vzvratno naj ne ugaša w avtu, ki drsi hitreje od nekaj m/s; navor gum omeji s trenjem.
- Dokaz preverjalca: Lasten preizkus nova: T 120 v zadnjo os stoječega 14,3° (njihovo 11°, merilec avto 15°), največ 665 °/s; počez 14,8° (13°); klasična 268°. Koda stepNova 3079/3081 potrjena (omejitev 3,2 rad/s vsak korak, −27 % na korak pri !fwd). Tog izračun: gume ~9,7 rad/s², 11,6 rad/s bi ugašalo ~1,2 s. Nova ni privzeta fizika.

### [4] Brez vnosa avto ostane prislonjen na ograjo; pri majhni hitrosti se nos poravna šele po ~3 s

- Oznaka: `zid-brez-vnosa-prislonjen` · področje: Ograja in zid · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: BURJA R7 in TITAN, obe fiziki, 5–30° pri 60–120 km/h, brez vnosa po trku
- Izmerjeno: cs: 5°/60, 5°/120, 15°/60 in 30°/60 → stik vsak korak do konca meritve (nad 6,8 s). 15°/60: nos 15° → 0,6° šele po 2,9 s (največji zasuk 49 °/s), hitrost 60 → 42 km/h po 2 s. TITAN ostane na ograji tudi pri 15°/120, 30°/120 in 5°/200. Nova fizika: nad 6,8 s pri 5–30° do 120 km/h. Čisti odboj ob odhodu je 0,00–0,03 (izstopni kot 0,1–0,9°). Z vnosom (plin + volan stran) je avto prost v 0,12–0,53 s.
- Pričakovano: Toga ograja avto med stikom (0,15–0,3 s) zasuka vzporedno (zasuk ≈ vpadni kot / čas stika, 60–130 °/s pri 15°), zadek rahlo udari, nato avto ograjo zapusti pod kotom nekaj stopinj (pod ~60 % vpadnega) in se sam ne tišči nazaj vanjo. (vir: Trk togega telesa s Coulombovim trenjem (sunek v vogalu z vso ročico); NCHRP Report 350 in EN 1317-2 (izstopni kot pod ~60 % vpadnega, vozilo se ne vrne v ograjo))
- Ponovitev: node tools/trki/zid.js --del matrika → MATRIKA 1a »15 60 nic« in »5 120 nic« (drs > 6,9 s), 1c (nova), 1e (titan); primerjava 1b (plin)
- Predlog: V novi različici naj vogal dobi ves zasuk iz ročice (delež 1 namesto wallYaw 0,3) ali naj stik z bokom (dva vogala) poravna nos v času stika; odboj 0,1–0,2 za beton, da avto ograjo res zapusti (izstopni kot 1–3°); klasična fizika naj po trku ~0,3 s ne vrti poti nazaj proti nosu, dokler nos kaže v ograjo.
- Dokaz preverjalca: Race.step, asfalt do ograje, 15°/60 brez vnosa: nos 15° -> 9,1° (0,25 s) -> 1,4° (2 s) -> 0,5° (3,0 s), stik vsak korak > 4 s, 55,6 -> 42,3 km/h po 2 s, vrh zasuka 49 °/s (njihovih 2,9 s potrjeno). Dodatki: na Bathurstu (2,5 m trave pred ograjo) je nos 1,5° že pri 0,5 s in 0,6° pri 0,75 s, stik do 2,23 s. S polnim plinom brez volana avto ostane prislonjen > 5 s (stik vsak korak) in pospešuje skoraj kot prost: 5°/60: 104/137/179 km/h pri 1/2/4 s proti 100/134/177 prosto (pot v 4 s 146 proti 143 m); 15°/60: 91/126/172; 5°/120: 148/169/196 proti 149/170/197; 15°/120 se odlepi po 0,21 s. Mehanizem: wallYaw 0,3 (zid vidi 3,3x vztrajnost zasuka, k 2,04 m namesto 1,12 m), zakon poti stepCS ga vsak korak znova pritisne (hit 0,01-0,34 m/s, pod pragom škode 2,5 m/s).

### [4] Čelni trk vrže avto vstran vzdolž ograje in ga v enem koraku zavrti

- Oznaka: `zid-celni-met-v-stran` · področje: Ograja in zid · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Vsi avti, obe fiziki, 90° pri 60/120/200 km/h (enako konec odprte ceste in stena predora)
- Izmerjeno: BURJA R7: po 1. koraku 14/27/46 km/h; ob odhodu od ograje 10/21/35 km/h, od tega normalni odboj 6–7 % (4/8/12 km/h) in 9/19/33 km/h vzdolž ograje (15–16 % vpadne hitrosti), vedno v isto stran avta (desna ograja: smer 157°, leva: 23°). Zasuk v koraku 93/187/312 °/s pri končni spremembi nosu 1–3°. MRAVLJA (165 kg): 303/606/1011 °/s, pri 60° nos −45° do −62°. Po trku pri 120 km/h avto še po 2 s drsi z 12 km/h in po 3,8 s doseže nasprotno ograjo 14,5 m stran; s plinom se po 2,1 s odpelje.
- Pričakovano: Simetričen čelni trk nima tangencialne hitrosti ne zasuka; avto obstane pred ograjo in se odbije 10–15 % hitrosti naravnost nazaj (beton) oziroma skoraj nič (gume). (vir: Simetrija in ohranitev gibalne količine pri centralnem trku; čelni preskusi v togo oviro pri 48–64 km/h (koeficient restitucije ~0,1–0,15))
- Ponovitev: node tools/trki/zid.js --del matrika → MATRIKA 1a »90 60 nic« (v1 14, izh 156,7, w 93) in 1e (mravlja 90°: w 303–1011); --del proga (leva ograja: izh 23°)
- Predlog: Vogale, ki so v istem koraku v ograji, reši skupaj (en sunek v skupnem prijemališču ali ponovitve do skladnosti) in trenje računaj na hitrost težišča; zaporedna obdelava vogalov je vir asimetrije.
- Dokaz preverjalca: Race.step na ovalu, 90°/100, oba zidova: po 1. koraku še 11,7 km/h v zid (12 %), 18,8 km/h vzdolž zidu (19 %), zasuk 151-154 °/s. Ročni izračun wallCollide za en vogal da 0,120*v v zid, 0,194*v vzdolž in 0,098*v rad/s (93,5 °/s pri 60 km/h) = njihovi eN1 -0,12, v1 14 km/h, w 93. Vzrok potrjen v kodi (core.js 3747-3822): vogali gredo po vrsti, popravek lege prvega vogala izniči prodor drugega (pen <= 0 -> continue), zato dobi impulz samo en vogal. Popravki k njihovim številkam: pri 0,5 s je odboj 7,7-8,0 km/h (8 %), vzdolž zidu 2,5 km/h, nos pa ostane zasukan 18° (71,8° oz. 107,3° pri 0,5 s in 2 s), ne 1-3° (njihov dh je vzet ob odlepitvi po 0,02-0,03 s); za 80-100° je zasuk nosu 15-27°. Na pravem zidu (Bathurst) 90°/60: 10 km/h po 1. koraku (ujeta oba vogala), smer 26°, vrh 73 °/s; 90°/120: 20 km/h, 147 °/s. Nesimetrija je samo +-5° okoli pravokotnice: desni zid 85° (vt +8,7 km/h) -> -13,6 km/h (vržen proti lastnemu gibanju, v isto smer kot 95°: -20,2); 80° in 100° se zrcalita (+-21,7 km/h, +-165 °/s).

### [4] Vse ograje so ista snov: beton, tirnica, gume, mreža in les imajo odboj 0,05, trenje 0,25 in delež zasuka 0,3

- Oznaka: `zid-ena-snov-za-vse-ograje` · področje: Ograja in zid · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Isti trk na zidu boksov in ravnini na Spa, na ravnini in gorskem zidu Bathursta, na otoku krožišča, koncu odprte ceste in steni predora
- Izmerjeno: 15°/120: po 1. koraku 110–111 km/h, hit 8,5–8,6 m/s, škoda 17–20 % povsod; 90°/60: 14 km/h, hit 16,5–16,6 m/s, škoda 40–41 % povsod. Razlike po 2 s (58–95 km/h) naredi samo podlaga pred ograjo (trava ali asfalt). Vrste ograj obstajajo le v risanju (js/world.js type 0/1/2); obe fiziki in vse različice --cv berejo iste tri številke.
- Pričakovano: Beton: odboj 0,1–0,15, trenje 0,3–0,5, brez podajanja. Jeklena tirnica: poda se 0,3–1 m, vzame več energije, preusmeri mehkeje. Gume: odboj ≈ 0, požrejo normalno energijo na 1–2 m, veliko trenje (avto se ujame, ne zdrsi). Mreža in les se podata ali zlomita. (vir: Razredi podajnosti varnostnih ograj (EN 1317-2: delovna širina W1–W8); odprta literatura o pregradah iz gum na dirkališčih)
- Ponovitev: node tools/trki/zid.js --del proga → tabela PROGA (v1, hit, sk enaki v vseh vrsticah istega kota); --del posebne
- Predlog: Track naj nosi vrsto ograje po vzorcu in strani (ista tabela, kot jo riše svet), wallCollide pa naj za vrsto bere {odboj, trenje, delež zasuka, globina mečkanja, faktor škode}: beton, tirnica, gume, mreža/les; nova različica (--cv) dobi svoje številke za ograje.
- Dokaz preverjalca: Koda: wallCollide bere samo CSK.wallE 0,05, wallMu 0,25, wallYaw 0,3 (core.js 1984), brez veje po vrsti ograje, fiziki ali različici trkov; masa je c.m.mass (brez goriva). Moj Race.step na 5 mestih (asfaltni oval, oval s travo, Bathurst ravnina, Bathurst zid na gori, Spa) da enak 1. korak: 15°/120 110-111, 30°/120 93, 15°/200 185-186, 30°/200 155-156 km/h. Njihovih 360 vrstic matrike (--del matrika --json) je enakih za cv privzeto, 4 in 5.

### [4] Polprikolica se ob 5° oplazenju ograje zlomi na 56° in ustavi vlak

- Oznaka: `zid-prikolica-zlom-ob-oplazenju` · področje: Ograja in zid · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: TITAN CISTERNA (5,3 t + 12 t), klasična fizika, široka cesta, 5–30° pri 120–200 km/h, brez vnosa, Race.step
- Izmerjeno: 5°/120: 0,2 s po trku se ograje dotakne prikolica, kot med vlačilcem in prikolico zraste s 3,7° na 42° v 0,3 s in obstane pri 56–62°; sredina prikolice se v 0,55 s odmakne 4,3 m od ograje; prikolica je na ograji 6,7 s, vlak se s 119 km/h ustavi v ~4 s (62 km/h po 2 s; vlačilec sam 92). Enako 5°/200, 15°/120, 30°/120, 30°/200 (zlom 56°). Pri 60 km/h, v novi fiziki in z volanom stran zloma ni (0°). Čelno 60 km/h: škoda se šteje v 6 korakih → 55 % (vlačilec sam 24 %), pri 120 km/h 100 % (sam 57 %).
- Pričakovano: Prikolica, ki jo ograja pritisne v bok, se poravna z ograjo in drsi ob njej (sila za sedlom jo obrača k vzporednosti); zlom ostane nekaj stopinj. Škoda enega trka se šteje enkrat. (vir: Statika zglobnega vozila (moment sile ograje okoli sedla) in ohranitev vrtilne količine; opis v js/core.js (tlJoin: »its middle turned toward where it was pushed«))
- Ponovitev: node tools/trki/zid.js --del prikolica → vrstica »cs 5 120 nic« (prik.s 6,74, zlom 56, v2 62) proti »cs 5 120 plin« (zlom 0) in tabeli brez prikolice
- Predlog: Popravek lege prikolice naj je ne obrača okoli sedla (tlJoin): sunek in popravek v točki stika z ročico do sedla (zasuk k vzporednosti), popravek lege razdeljen med vlačilec in prikolico; škodo vlaka štej po trku (največji sunek), ne po koraku.
- Dokaz preverjalca: Spa ravnina, Race.step, škoda Samo videz, vlačilec s cisterno. 5°/120 brez vnosa: zlom do 63,2° pri 0,77 s, 61° pri 1 s, 57° pri 4 s, v2 45 km/h, pri 4 s stoji. Samo plin: vrh 62,4°, 58° pri 1 s, v4 15 km/h. Volan stran po 0,3 s (človek): še vedno vrh 63,3° pri 0,69 s, poravna se na 6,2° šele pri 4 s (v2 85, v4 78 km/h): njihov končni kot 0° pri vnosu 'plin' skrije vrh. Zavora: 83°. Prag: 3°/120 1,3° (nič), 5°/60 2,3° (nič), 15°/120 55,8°. Nova fizika: vrh 9,1°; vlačilec sam 0. Čelno na 44 m široki cesti: 60 km/h -> 44 po 1. koraku, ustavi se v 0,16 s, 6 korakov s škodo (16,6; 11,9; 7,4; 4,3; 4,3; 3,0 m/s = 55 %) proti 24 % (2 koraka) za vlačilec sam; 120 km/h: 8 korakov, 100 % proti 57 %.

### [4] Predmet med avtom in ograjo skoraj ustavi avto

- Oznaka: `predmeti-ograja-stisk` · področje: Predmeti, razbitine, promet · zaupanje merilca: medium · preverjanje: popravljeno
- Scenarij: Avto 20° proti ograji na ravnem ovalu, predmet tik pred ograjo, 120/200 km/h; primerjava z isto vožnjo v ograjo brez predmeta.
- Izmerjeno: Bala 26 kg: 69/148 korakov stika, 1 s po trku 43/79 km/h počasneje kot brez bale, najmanjša hitrost 6/4 % kontrolne (avto skoraj obstane). Guma 9 kg: 119/27 korakov, 24/41 km/h, najmanj 22/54 %. Stožec 3 kg: 26 korakov, 9/13 km/h, 82/88 %. Sod 12 kg (en stik): 96/97 %.
- Popravljena meritev (preverjalec): Bala 26 kg: 64-71 korakov stika pri 120 in 26-29 pri 200 km/h; v stikih z balo izgubi 48,9 / 97,8 km/h; 1 s po trku 34 / 53-64 km/h počasneje kot brez bale (merilec 43/79); najmanjša hitrost 12-17 / 25-31 km/h = 31-42 % kontrolne (merilec 6/4 %). Guma 9 kg: 74-119 / 25-32 korakov, 19-22 / 40-42 km/h počasneje, najmanj 49-67 %. Stožec 3 kg: 25-29 / 22-31 korakov, 8-9 / 5-19 km/h, 79-96 %. Sod (en stik): 2,0 / 3,3 km/h, 95-98 %.
- Pričakovano: Bala slame ob ograji vzame največ nekaj kJ: avto izgubi ≤ ~3 % več kot brez nje ((1+e)·m/(M+m) = 3,0 %); guma ≤ 1,1 %, stožec ≤ 0,4 %. (vir: Ohranitev gibalne količine in energije; js/core.js propFeel (izguba na vsak korak stika, ko predmet nima kam).)
- Ponovitev: node tools/trki/predmeti.js --del ograja (vrstice bale, tyre, cone; stolpci n, dv, vmin)
- Predlog: Sledi iz popravka predmeti-ponovni-stik (sunek enkrat na stik); stisnjen predmet naj zdrsne vzdolž ograje ali čez avto, izguba omejena z (1+e)·m/(M+m) in trenjem. Ne spreminjaj: predmet ostane znotraj ograje, wallCollide za avto.
- Dokaz preverjalca: Lastna meritev na Spa in Bathurstu (avto 20° v ograjo, predmet 0,15 m pred črto ograje, primerjava z isto vožnjo brez predmeta, izguba v stikih merjena neposredno v Race.stepProps). Dodatna izguba je resnična in velika, a merilčev »avto skoraj obstane« (najmanj 6/4 % kontrolne, 148 korakov pri 200 km/h) se na pravih progah ne ponovi: nastane na njegovi ravni progi »krog«. Tudi kontrola sama pade s 120 na 72-75 km/h 1 s po zidu.

### [4] Na spletu trk ne prenese gibalne količine: udarjajoči izgubi vse, udarjeni ne čuti nič

- Oznaka: `boksi-splet-zadaj` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Dva telefona, rally, enaki masi (netPlace iz js/game.js, stanja vsakih 50 ms, 30 ms na poti, 100 / 200 ms v preteklosti): od zadaj 100 v 80 in 120 v 60 km/h, pravokotno v bok stoječega pri 60 km/h; isti prizori brez mreže; navzkrižno z dvema Race na Spa (opts.remote).
- Izmerjeno: Zadaj 100 v 80: brez mreže A -11,7, B +11,7 km/h (e 0,17); lag 100 ms: A -19,5, B 0,0 km/h, telefon B 0 korakov trka, gibalna količina para -97 %; 120 v 60: A -59,3, B 0 (brez mreže ∓33,7). V bok: udarjeni +0,4 km/h in zasuk 0,1° (brez mreže +53,5 km/h, 18,9°), udarjajoči -61,6 km/h. Spa: koraki trka 21 / 0, B po 1 s -5,9 km/h (samo upor).
- Pričakovano: Gibalna količina para se ohrani: pri enakih masah zadnji -11,7, sprednji +11,7 km/h; udarjeni v bok dobi bočno hitrost in zasuk. (vir: Zakon o ohranitvi gibalne količine)
- Ponovitev: node tools/trki/boksi-pristanek.js --del splet → tabela SPLET 1 (stolpci sunek A, sunek B, gibalna %) in vrstica »preverjeno z dvema pravima dirkama na Spa«
- Predlog: Ostane: vsak telefon premika samo svoj avto in oba vozita isto različico trkov (dogovor ob vstopu v sobo, sicer Simulacija). Novo: telefon, ki zazna dotik, pošlje dogodek trka (čas, točka, normala, sunek); drugi telefon svoj delež sunka uporabi iz dogodka, ne iz lastnega zamaknjenega zaznavanja; lokalni avto vzame le svoj delež (polovico pri enakih masah).
- Dokaz preverjalca: Lastna naprava: dve pravi dirki na Spa (Race z opts.remote), lastna interpolacija stanj (ne merilčev izrezani netPlace), stanja na 50 ms + 30 ms pot, kontrola = ista vožnja brez dotika. 100 v 80 km/h: lag 100 ms: A -17,6 km/h po 0,3 s (-16,9 po 1 s), B 0,0 km/h, koraki trka A 20 / B 0; lag 200 ms: A -17,5, B 0,0, koraki 52 / 0. 120 v 60 km/h: A -55,7 (lag 100) in -55,6 (lag 200), B 0,0, koraki 74 / 0 in 86 / 0. Merilec -19,5 / 0 in -59,3 / 0: ujemanje 6-10 %. Koda: nemrežni avto vzame svoj delež sunka in ves razmik, mrežni nič; dogodek trka se med telefonoma ne izmenja. Prizora »v bok stoječega« nisem preveril.

### [4] Na spletu se čelni trk odbije prožno (e = 1,0 namesto 0,12)

- Oznaka: `boksi-splet-celno` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Dva telefona kot zgoraj, čelno 60 + 60 km/h.
- Izmerjeno: Brez mreže vsak ∓68,7 km/h (e 0,12); lag 100 ms: ∓122,4 km/h (e 1,00); lag 200 ms: ∓122,5 km/h (e 1,01): oba odletita nazaj s 60 km/h. Ob prvem dotiku se avta v resnici že prekrivata 1,75 m (lag 100) oz. 3,5 m (lag 200).
- Pričakovano: Skoraj neprožen trk: e ≈ 0,1-0,2, sprememba hitrosti vsakega ≈ 60-69 km/h, oba skoraj obstaneta. (vir: Ohranitev gibalne količine in energije; koeficient restitucije trkov vozil pada s hitrostjo proti ~0,1 (odprta literatura o rekonstrukciji trkov))
- Ponovitev: node tools/trki/boksi-pristanek.js --del splet → tabela SPLET 1, vrstice »celno 60 + 60«
- Predlog: Z net avtom sunek izračunaj enkrat, iz hitrosti obeh ob prvem dotiku (kot brez mreže), in ga lokalnemu avtu daj enkrat; dokler traja prekrivanje z duhom, popravljaj samo položaj (brez nove hitrosti), dokler ne prispe prijateljevo stanje po trku (največ 0,25 s).
- Dokaz preverjalca: Lastna naprava (dve pravi dirki na Spa, lastna interpolacija): čelno 60 + 60 km/h: lag 100 ms: A -114,1, B +114,4 km/h, e 0,98, 6 korakov trka na vsakem telefonu, prvi dotik pri resnični razdalji središč 2,03 m (avta sta že ~1,9 m drug v drugem); lag 200 ms: -114,5 / +115,1 km/h, e 1,00, prvi dotik pri 0,41 m (~3,5 m prekrivanja). Merilec ∓122,4 km/h, e 1,00, 2,08 / 0,37 m: ujemanje 7 %. Mehanizem: duh se na tem telefonu ne ustavi, dokler ne pridejo nova stanja, zato lastni avto dobi sunek več korakov zapored, do hitrosti duha.

### [4] Prijateljev avto je 100-200 ms v preteklosti: pri 100 km/h 2,8-5,6 m za resničnim mestom

- Oznaka: `boksi-splet-zamik` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: high · preverjanje: popravljeno
- Scenarij: Dva telefona kot zgoraj: bok ob boku pri 100 km/h, B zavije v A pod 3°; od zadaj 100 v 80.
- Izmerjeno: Bok ob boku: zasuk A / B brez mreže 11,4° / 22,5°, lag 100 ms 39,3° / 68,8° (stik s premaknjenim duhom: nos ob zadek), lag 200 ms brez dotika na obeh telefonih (avta gresta drug skozi drugega). Od zadaj: prvi dotik na telefonu A pri resnični razdalji središč 6,51 m (lag 100) in 8,82 m (lag 200) namesto 3,95 m.
- Popravljena meritev (preverjalec): Od zadaj: prvi dotik na telefonu A pri resnični razdalji središč 6,30 m (lag 100 ms) in 8,56 m (lag 200 ms) namesto 3,95 m (merilec 6,51 / 8,82 m: potrjeno na 3 %). Bok ob boku 100 km/h, 3°: lag 200 ms brez dotika na obeh telefonih (potrjeno); lag 100 ms: dotik od 0,29 s; zasuk A / B je odvisen od volana: brez rok 2,8° / 2,8° (131 / 129 korakov stika), z merilčevim krmilnikom, ki drži črto v duha, 78,4° / 72,0° (70 / 69 korakov). Kdor ob dotiku z duhom drži svojo smer, ga torej zavrti; brez volana je zasuk manjši kot brez mreže (11,4° / 22,5°).
- Pričakovano: Stik na istem mestu karoserije na obeh telefonih; napaka mesta precej manjša od dolžine avta (3,95 m). Zamik = hitrost × zakasnitev: 27,8 m/s × 0,1 s = 2,8 m. (vir: Kinematika: s = v·t; js/game.js netPlace (lag 100 / 200 ms))
- Ponovitev: node tools/trki/boksi-pristanek.js --del splet → tabela SPLET 1, vrstice »bok ob boku« in stolpec »razdalja sredisc ob dotiku A m«
- Predlog: Za trk (ne za risanje) duha ekstrapoliraj na sedanji čas (mesto + hitrost × lag, omejeno kot zdaj z 0,25 s) ali naj trk reši en telefon (zadnji oz. hitrejši) in izid pošlje; risanje ostane v preteklosti.
- Dokaz preverjalca: Zamik mesta je potrjen, zasuka 39,3° / 68,8° pa ni mogoče pripisati trku: je posledica merilčevega krmilnika. V netRun krmilnik drive meri odmik in smer glede na začetno smer vsakega avta, zato B (-3°) od 0,4 s naprej ves čas sili po svoji črti v A, oba pa do polnega volana rineta v duha, ki se ne umakne. Lastna naprava (dve pravi dirki na Spa): brez rok 2,8° / 2,8°, z istim krmilnikom 78,4° / 72,0°.

### [4] Dotik v zadnji bok sredi ovinka na meji oprijema avta ne zavrti, samo odrine

- Oznaka: `v-avto-avto-ovinek-zadnji-bok` · področje: najdba preverjalca (avto-avto) · zaupanje merilca: medium · preverjanje: najdba preverjalca
- Scenarij: Klasična fizika, Simulacija, BURJA R7. B (igralec) vozi ustaljen krog in drži volan ter hitrost: 100 km/h na meji (polni volan, 2,38 g, polmer 33 m), 160 km/h na meji (2,39 g, 84 m), 100 km/h pri 1,19 g in skoraj naravnost (0,05 g). Tekmec A z enakim stanjem, 0,65 dolžine zadaj, z notranje ali zunanje strani, se s prečno hitrostjo 1–6 m/s nasloni v zadnji bok B (stik ob zadnji osi). Primerjava z isto vožnjo B brez A.
- Izmerjeno: Z notranje strani (rep potisne ven, smer vrtenja), 100 km/h na meji, 1/2/3/4/6 m/s: smer B odstopi največ 1/0/1/3/4°, xgl 0,00 pri vseh, B je po 2 s 0,1/0,4/0,8/1,4/2,8 m s svoje črte (60–200 sunkov). 160 km/h na meji: 0–6°, xgl 0,00. Skoraj naravnost enak dotik: 0–6°, xgl 0,19 šele pri 6 m/s; bližina meje oprijema torej nič ne spremeni. Z zunanje strani pri 100 km/h na meji: 3 m/s −5°, 4 m/s −15° (xgl 0,52), 6 m/s −171° (xgl 1,00); pri 160 km/h do 6 m/s največ −6°, xgl 0.
- Pričakovano: Avto na meji oprijema nima rezerve na zadnji osi: prečni sunek 1–2 m/s ob zadnji osi (600–1200 N s, dw 0,5–1 rad/s = 30–60 °/s) zadnje gume preseže, avto se brez popravka v manj kot 1 s zasuka za več kot 30–90° (klasičen dotik v zadnji bok v ovinku; PIT deluje že z rahlim naslonom). Na ravnini da isti dotik 2–4° zdrsa in je ulovljiv. Prag mora padati z izrabljenim oprijemom. (vir: Krog trenja (razpoložljiva bočna sila zadnje osi = sqrt((μN)² − Fy²), na meji 0); posnetki dotikov v ovinku in manevra PIT iz referenčnih ciljev naloge; koda kTake: prag izgube oprijema aH je stalen kot, izrabljenega oprijema (csAn) ne upošteva.)
- Ponovitev: node tools/trki/preverjanje/avto-avto/v4.js cornerpit (vrstice »A inside into the rear quarter«; primerjava vrata ob vrata: isti ukaz z »corner«)
- Predlog: V kTake prag izgube oprijema zmanjšati z izrabljenim oprijemom, npr. aH × sqrt(1 − (csAn/aL)²) (isti izraz stepCS že uporablja za drgnjenje bočnega sunka), in nad ~70 % meje vzeti del togega dw tudi pod pragom. Trajen potisk v zadnji bok naj zdrs sešteva čez korake, ne ocenjuje vsakega sunka posebej.

### [4] Na spletu se trk konča kot odboj žoge: čelno 120+120 oba nazaj s 115 km/h, strelec pri T-trku obstane, zadeti od zadaj ne čuti ničesar

- Oznaka: `v-avto-avto-splet-odboj` · področje: najdba preverjalca (avto-avto) · zaupanje merilca: medium · preverjanje: najdba preverjalca
- Scenarij: Dva telefona, klasična fizika, Simulacija (na spletu vedno), enaki BURJI. Vsak telefon računa svoj avto, drugega kaže iz stanja, starega 8–200 ms (1–24 korakov; stanja se pošiljajo 20-krat na sekundo, na veliki mreži 10-krat). carCollide net avtu hitrosti ne spremeni, lokalnega pa v celoti odrine in mu da njegov delež sunka vsak korak, dokler se prikazani avto ne odzove.
- Izmerjeno: Čelno 120+120: en telefon ±14 km/h (e 0,12); dva telefona: zamik 8 ms ±70 km/h, zamik 50–200 ms ±114–115 km/h (e ≈ 0,97; 7–12 sunkov v 60–100 ms). T 120 v stoječega: en telefon 52 / 59 km/h; dva: strelec 0 km/h (9 pri 8 ms), zadeti 58–65 km/h, polovica gibalne količine izgine. Od zadaj 120>90: en telefon 101 / 106 km/h; dva: strelec 86–90 km/h (−30), zadeti 0 sunkov.
- Pričakovano: Isti izid kot na enem telefonu: čelno ±14 km/h, T 52 / 59 km/h, od zadaj −17 / +16 km/h; gibalna količina para se ohrani. (vir: Ohranitev gibalne količine; isti trki v igri na enem telefonu (lasten preizkus); koda js/core.js 3855–3885 (pogoji !a.net, !b.net) in js/game.js netFrame (20 stanj na sekundo).)
- Ponovitev: node tools/trki/preverjanje/avto-avto/v4.js net (dvojna simulacija je model s čistim zamikom; kode medpomnilnika stanj C.buf nisem bral)
- Predlog: Lokalni avto naj proti net avtu vzame en sam sunek na dotik (zapora ponovnega sunka za isti par, dokler ne pride novo stanje net avta, npr. 150–250 ms), ali pa naj se prikazanemu net avtu lokalno začasno pripiše njegov delež spremembe hitrosti, ki ga naslednje prejeto stanje popravi. Pri trku od zadaj naj telefon zadetega sprejme sunek iz sporočila strelca (dogodek trka z velikostjo in smerjo).

### [4] Vožnja po ograji skozi oster ovinek s trdo podlago do ograje je hitrejša od vožnje na meji (klasična fizika)

- Oznaka: `v-zid-voznja-po-ograji-hitrejsa` · področje: najdba preverjalca (zid) · zaupanje merilca: medium · preverjanje: najdba preverjalca
- Scenarij: rally, klasična fizika, Race.step, škoda Samo videz (privzeto) in Vklop. Oval (ravnina 1600 m, ovinek 180°, R 30/60/120 m), asfalt do ograje (walls -1,5 m), start 200 km/h 350 m pred ovinkom 0,25 m od zunanje ograje, poln plin, brez zavore in volana; čas do 300 m po ovinku. Primerjava: igrin voznik (aiControl) na isti cesti s skill 1 (srednja), 1,08 in 1,12 (meja avta po komentarju v core.js 6250). Prave proge: Marrakesh (142°, R~45 m, 792 m po startu) in Bathurst (120°, R~40 m, 3716 m po startu), od 250 m pred do 250 m po ovinku, grob jezdec brez zaviranja.
- Izmerjeno: Oval R30: po ograji 14,18 s proti 16,39 s na meji (skill 1,12; -13,5 %) in 16,51 s (skill 1); najnižja hitrost 129 proti 84 km/h, škoda 24 %, najmočnejši udarec 7,0 m/s. R60: 15,64 proti 16,92 s (-7,6 %; skill 1: 17,58 s); ovinek 4,18 proti 4,95 s, najmanj 149 proti 123 km/h, izhod 152 proti 136 km/h, škoda 8 %, udarec 4,7 m/s; bočni pospešek ~2,7 g. R120: počasneje (18,79 proti 18,27 s, +2,8 %). S škodo Vklop skoraj enako (R30 14,31 s, R60 15,69 s). Nova fizika: R30 16,18 proti 16,47 s, R60 17,32 proti 17,50 s (100 % škode), R120 počasneje (20,42 proti 19,29 s). S 4 m trave pred ograjo vedno počasneje (R60 26,26 s). Prave proge (udarci 31-33 m/s, 100 % kozmetične škode): Marrakesh 14,93-15,14 s proti 14,95 (skill 1,12) / 15,30 (1,08) / 16,15 s (skill 1); Bathurst 13,76-13,85 s proti 13,77 / 13,90 / 14,37 s: brez zaviranja ob ograjo je enako hitro kot vožnja na meji in 0,5-1,0 s hitreje od srednjega voznika; s škodo Vklop počasneje (15,36 in 14,52 s); Štajerska počasneje (16,85 proti 14,93 s). Trda podlaga do zunanje ograje: 6 373 m od 67 693 m ovinkov (R < 250 m) na 22 pravih progah (9 %): Marrakesh 100 %, Bathurst 96 %, Štajerska 87 %, Harju 61 %, Spa 58 %, Montréal 26 %, Medvode 14 %. Njihov ok_already »vožnja po ograji se ne splača« velja samo za travo pred ograjo.
- Pričakovano: Stik z ograjo se v resnici nikoli ne splača: oplazenje pri 5-10° stane 3-10 % hitrosti na dotik (mu avto-beton 0,15-0,4) in poškoduje avto; čas skozi ovinek po ograji mora biti daljši od čiste linije, zid ne sme dodati ~1 g bočnega oprijema brez cene. (vir: Reference naloge (tog betonski zid: 5-10° izguba 3-10 %, mu 0,15-0,4); js/core.js 3747-3822 (wallCollide: wallMu 0,25, wallYaw 0,3, škoda šele nad 2,5 m/s na korak), 1984 (CSK), 6249-6254 (skill).)
- Ponovitev: node tools/trki/preverjanje/zid/p14.js 30 60 120 (oval: avtopilot skill 1/1,08/1,12 proti jezdecu, škoda 1 in 2); node tools/trki/preverjanje/zid/p6.js 30 60 120 (klasična/nova, asfalt/trava); node tools/trki/preverjanje/zid/p15.js marrakesh,bathurst (prave proge); node tools/trki/preverjanje/zid/p10.js (delež ovinkov s trdo podlago do ograje).
- Predlog: V novi različici trkov naj drsenje ob ograji stane: trenje, ki raste z normalno silo in trajanjem stika (pod bočno obremenitvijo vsaj 0,3-0,5 g zaviranja), zmanjšan oprijem pnevmatik med stikom (xgl tudi od zidu), poln delež zasuka (wallYaw proti 1) in škoda po poti drsenja, ne samo ob udarcu nad 2,5 m/s. Merilo za test: skozi R30-R60 z asfaltom do ograje mora biti vožnja po ograji vsaj 5 % počasnejša od avtopilota s skill 1,12.

### [4] Vsak pristanek po pravem skoku vzame ~11 % hitrosti v enem koraku (Ouninpohja: 18 km/h na skok)

- Oznaka: `v-ostalo-pristanek-skok` · področje: najdba preverjalca (ostalo) · zaupanje merilca: high · preverjanje: najdba preverjalca
- Scenarij: Ouninpohja, rally 1150 kg, fizika cs, vozi samovoznik igre (Core.aiControl), Race.step, 150 s; šteti pristanki po letu nad 0,05 s. Dodatno: avto 0,3-10 m nad ravno cesto na Spa in Bathurstu.
- Izmerjeno: 18 skokov v 150 s (povprečno 0,65 s v zraku pri 160,8 km/h, najdaljši 1,07 s). Vsak pristanek v enem koraku (1/120 s) vzame povprečno 10,9 % = 17,6 km/h (~60 g za en korak), največ 13,0 % = 21,8 km/h (s 2452 m, 167 km/h); vsi pristanki skupaj 316,6 km/h v 150 s. 17 od 18 pristankov je na klancu navzdol (povprečno -3,0 %): igra vzame navpično hitrost 6,97 m/s, pravokotno na cesto je 5,64 m/s (po njej bi bila izguba 8,9 %). Škoda 0. Nordschleife: 2 skoka, skupaj -4,9 km/h. Na ravnem pri 100 km/h: padec 1 m -8,4 do -8,7 %, 3 m -13,0 %.
- Pričakovano: Ob pristanku se izgubi le sestavina hitrosti pravokotno na cesto: v·(1 - cos θ), θ = atan(5,64 / 44,7) = 7,2°, torej 0,8 % (~1,3 km/h pri 160 km/h); trenje koles doda kaj le ob zaviranju ali zdrsu. Reli avto po skoku pri 160-180 km/h nadaljuje s skoraj isto hitrostjo; 10-13 % (18-22 km/h) na skok je približno 10x preveč. (vir: Lastna meritev (pristanek.js); koda js/core.js 2870-2875: sc = clamp(-impactVY·0,016·lk, 0, 0,13·lk), vx in vz x (1 - sc); fizika sunka pravokotno na podlago (vzdolžna hitrost se ohrani). Merilca sta izgubo izmerila le na umetnem padcu, pravih skokov pa ne, ker njun greben ne poleti.)
- Ponovitev: node tools/trki/preverjanje/ostalo/pristanek.js leti ouninpohja 150 ; node tools/trki/preverjanje/ostalo/pristanek.js spust
- Predlog: Izgubo računaj iz hitrosti pravokotno na cesto (vy - klanec·vl) in jo zmanjšaj na 1-3 % (npr. sc = clamp(vn·0,003, 0, 0,03)), razporejeno čez landT (0,05-0,2 s) namesto v enem koraku; trd pristanek naj se pozna v škodi in kratkem padcu oprijema, ne v hitrosti.

### [4] Tipičen zadetek predmeta (povprečje po širini avta) je 3-7x pretežak; ista bala stane 4 % ali 50 %, odvisno od 0,5 m zamika

- Oznaka: `v-ostalo-predmet-povprecje` · področje: najdba preverjalca (ostalo) · zaupanje merilca: high · preverjanje: najdba preverjalca
- Scenarij: Spa, najdaljša ravnina, rally 1150 kg brez plina, predmet 3 m pred avtom, zamik zadetka od -1,2 do +1,2 m po 0,1 m (25 voženj na predmet in hitrost); izguba hitrosti merjena neposredno znotraj Race.stepProps.
- Izmerjeno: Povprečje zadetih pri 60/120/200 km/h: stožec 1,10/2,35/1,81 %, guma 3,61/7,04/6,03 %, bala 10,31/18,83/18,92 % (~-23 km/h pri 120), sklad bal 14,78/28,23/37,78 % (~-76 km/h pri 200). Zadetek z robom avta: stožec 0,5 %, guma 1,4-1,7 %, bala 4,2 %, sklad bal 4,5 %; v sredino pri 120 km/h: 13 / 31 / 50 / 66 %. Merilčevih 14-33x velja le za pas ±0,1 m okoli sredine.
- Pričakovano: (1+e)·m/(M+m) ne glede na zamik: stožec ≤ 0,35 %, guma ≤ 1,05 %, bala ≤ 2,98 %, sklad bal ≤ 8,57 %; razlika med zadetkom v sredino in z robom največ faktor ~2 (delni zadetek), ne 12. (vir: Lastna meritev (predmet.js zamik). Postavitve v igri: vrste skladov bal na zunanji strani ovinkov (js/world-ouni.js:686, js/world-harju.js:935, js/world-pikes.js:4304), stožci (js/world-rbring.js:871), table (js/world.js:4315): zadene jih avto, ki ga odnese široko, s poljubnim zamikom.)
- Ponovitev: node tools/trki/preverjanje/ostalo/predmet.js zamik
- Predlog: Kot pri predmeti-ponovni-stik (en sunek po masah, predmet po njem hitrejši od avta, brez ponovnega stika); cilj preverjaj s povprečjem po širini avta in z robnim zadetkom: bala ≤ 3 %, sklad bal ≤ 9 % pri vsakem zamiku.

### [3] Bočni trk v stoječega: par se ustavi 2- do 3-krat prehitro, zadeti drsi bočno kot na polnem oprijemu

- Oznaka: `avto-bocni-par-prehitro-obstane` · področje: Avto ob avto (enaki masi) · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: tbone-60/120/200-stand-mid; klasična fizika
- Izmerjeno: 120 km/h: skupna hitrost 53 / 60 km/h po 0,1 s, mirovanje po 1,3 s, B potisnjen 11,8 m (povprečno ~1,1 g za par, torej ~2,2 g na težo B). 200 km/h: 31,1 m. 60 km/h: 3,0 m v 0,6 s. Zasuk 0° / 0°, A ostane prislonjen na bok B.
- Pričakovano: Bočno drseč avto zavira z drsnim trenjem svojih pnevmatik (0,7–0,9 g, dirkalne do ~1,2 g), strelec se kotali: par 0,4–0,6 g, iz 56 km/h 21–32 m v 2,7–4 s. Igra sama za avto brez oprijema uporablja 0,9 g. (vir: Coulombovo trenje, drsni koeficient pnevmatik na suhem asfaltu 0,7–0,9 (Vehicle Accident Analysis and Reconstruction Methods); js/core.js CRASH.slide 0,9 g in stepCS (drgnjenje cSx / cSz s polnim oprijemom, SL_T))
- Ponovitev: node tools/trki/avto-avto.js --only tbone-120-stand-mid (tabela »the turn«, stolpec »shift +2 s«)
- Predlog: Prečni sunek, večji od ~0,3 hitrosti avta (ali v stoječ avto), naj stepCS drgne z drsnim trenjem 0,9–1,0 g namesto s polnim oprijemom. Ne sme se spremeniti: majhni prečni sunki (do ~3 m/s), ki jih pnevmatike ujamejo v 0,17 s pri 100 km/h, in vse sredinske vrstice rear-*-c.
- Dokaz preverjalca: Lasten preizkus (v1.js slide): par po T-trku v sredino stoječega obstane po 0,72 s / 2,9 m (60 km/h), 1,42 s / 11,6 m (120), 2,33 s / 31,6 m (200); njihovo 0,6 s / 3,0 m, 1,3 s / 11,8 m, 31,1 m. Zadeti sam (strelec po prvem sunku duh) drsi bočno z 2,37 g. Opomba k pričakovanju: avto igre ima tudi v vožnji 2,38 g v ovinku in 1,65 g pri zaviranju, zato je dosledna primerjava 0,9 g (lastni zdrs igre brez oprijema) do ~1,65 g, ne 0,7–0,9 g; odstopanje poti je 1,4- do 2,6-kratno.

### [3] Vrtenje po trdem trku: kotna hitrost brez meje, izid odvisen od lege v koraku in nesimetričen

- Oznaka: `avto-vrtenje-brez-meje-loterija` · področje: Avto ob avto (enaki masi) · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: tbone-*-stand-rear, tbone-*-cross-mid/rear, head-200-o; klasična fizika
- Izmerjeno: Bočni trk v zadnjo os prečkajočega: 120 km/h B 521° (804 °/s), 200 km/h 1248° (3,5 obrata, 1344 °/s). Isti trk s prvim dotikom četrt koraka pozneje: tbone-200-stand-rear 253–611°, tbone-200-cross-mid 214–668°, tbone-120-cross-mid 104–203°. Čelno z zamikom pri 200 km/h: A −2248° (6,2 obrata, 1934 °/s), B 0° v zrcalno enakem trku; s plinom −2723°. Kotna hitrost prvega sunka (660 °/s) ostane, čeprav vsota togih navorov vseh sunkov da 387 °/s.
- Pričakovano: Zrcalno enak trk da zrcalno enak izid; isti trk se ne glede na lego v koraku razlikuje največ za ~20 %. Toga meja za 120 km/h v os je ~660 °/s; zmečkanina in trenje jo znižata, zato nad ~700 °/s in nad ~1,5 obrata (540°) ni verjetno niti pri 200 km/h. (vir: Ohranitev vrtilne količine in simetrija; ravninska mehanika trka togih teles; js/core.js kTake (c.w += dw samo ob g > g0 + 0,1), obbHit (prijemališče na enem avtu))
- Ponovitev: node tools/trki/avto-avto.js --only tbone-200 (tabela »the contact«, stolpec »turn B« po legah); node tools/trki/avto-avto.js --trace head-200-o
- Predlog: Kotno hitrost iz sunka omeji (npr. 8–10 rad/s) in jo med xgl > 0 seštevaj s predznakom pri vsakem sunku (tudi zaviralne navore), ne samo ob rasti xgl. Ne sme se spremeniti: zasuk 250° pri tbone-120-stand-rear in −120° pri rear-120-stand-o (±20 %).
- Dokaz preverjalca: Lasten preizkus z razvitim (nezavitim) kotom: T v zadnjo os prečkajočega 120 km/h 523° (806 °/s), 200 km/h 1263° (1354 °/s); tbone-200-cross-mid po legah v koraku 229/682/509/356°; tbone-200-stand-rear 579–612°. Čelno z zamikom 200 km/h, lega 0,75: A −1897° v 3 s (1931 °/s; njihovih −2248° je v 6 s), B 0°; pri zamenjanem vrstnem redu para (carCollide(B, A)) se zavrti B, A 0°. Nesimetrija je torej iz kode (prijemališče globokega stika je vogal enega avta, odvisno od vrstnega reda para), ne iz skripte. Gume bi dale največ ~9,7 rad/s² (555 °/s²).

### [3] Ali trk z zamikom zavrti avto, odloča 10 cm razlike med osema, ne sunek

- Oznaka: `avto-oprijem-po-razdalji-osi` · področje: Avto ob avto (enaki masi) · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: rear-60/120/200-stand-o in head-200-o: rally (sprednja os 1,15 m, zadnja 1,25 m od težišča) proti strega (1,34 m, 1,12 m); klasična fizika
- Izmerjeno: rear-120-stand-o: rally −120° / −125° (xgl 0,56 / 0,60), strega −9° / −9° (xgl 0). rear-200-stand-o: −312° proti −9°. rear-60-stand-o: −32° / −26° proti −5°. head-200-o: rally A −2248°, strega 0°. Tog sunek je pri obeh enak (~330 °/s pri 120 km/h).
- Pričakovano: Enak sunek z enako ročico zavrti oba avta podobno (razlika do ~20 % zaradi vztrajnostnega momenta): pri 330 °/s 60–120°. (vir: Vrtilna količina (Δω = r × P / I); js/core.js kTake: pri čistem navoru je ar − af = (b − a)·/dw/ / Vs, torej oprijem izgubi le avto z zadnjo osjo dlje od težišča)
- Ponovitev: node tools/trki/avto-avto.js (tabela »the same knocks, rally ... against strega«)
- Predlog: Pri čistem navoru (majhen prečni sunek lt) naj prag primerja zahtevani zamik nosu /dw/·τ(V) z mejo (npr. CSK.tapMax), ne razlike ar − af; pri prečnem sunku v bok ostane sedanje pravilo zadek proti nosu. Ne sme se spremeniti: dotik v zadnji bok jemlje oprijem, v sprednji ne (pit-*-front-2 in -4).
- Dokaz preverjalca: Lasten preizkus (v3.js): od zadaj z zamikom v stoječega: rally −31,5/−25,5° (60), −119,4/−124,7° (120, xgl 0,56/0,60), −312/−310° (200); strega −4,5/−8,5/−8,5°, xgl 0; kaze (a 1,2 < b 1,3) −17,7/−90/−230°. Koda kTake: oprijem gre le, če je zdrs zadaj (/lt − b·dw/) večji od zdrsa spredaj (/lt + a·dw/): rally a 1,15 < b 1,25 da, strega a 1,34 > b 1,12 nikoli.

### [3] Nova fizika: avto se po nobenem trku ne zavrti (omejitev 183 °/s in pnevmatike)

- Oznaka: `avto-nova-brez-vrtenja` · področje: Avto ob avto (enaki masi) · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: tbone-120-stand-rear, tbone-120/200-cross-rear, pit-60-rear-4; nova fizika
- Izmerjeno: Bočni trk v zadnjo os: B dobi 660 °/s, po enem koraku 310, po 0,1 s 13 °/s; zasuk 15° (klasična 250°), B 0,5 s drsi bočno s 45–55 km/h z nosom pri 10°. Prečkajoči B: 804 → 183 °/s v dveh korakih, zasuk 15°; pri 200 km/h −11° (klasična 1248°). Dotik 60 km/h, 4 m/s: −14° / −10° (klasična −104°). Največ v vsej matriki 80°.
- Pričakovano: Kotni pojemek zaradi pnevmatik je največ μ·g·m·r / I, okoli 10–25 rad/s² (570–1400 °/s²), ne 42 000 °/s²: iz 660 °/s se avto vrti 0,5–1,2 s in zasuka 150–400°. (vir: Navor trenja pnevmatik in vrtilna količina; js/core.js Car.stepNova: this.w = clamp(this.w, −K.rMax, K.rMax) z NVK.rMax 3,2 rad/s (pri klasični omejitvi komentar pravi, da jo stiki smejo preseči))
- Ponovitev: node tools/trki/avto-avto.js --trace tbone-120-stand-rear --phys nova
- Predlog: Po sunku naj omejitev rMax nekaj časa ne velja (okno 1–2 s z mejo ~8–10 rad/s, ki pada nazaj na 3,2), pnevmatike pa naj pri velikih kotih zdrsa dajejo drsno trenje. Ne sme se spremeniti: omejitev pri običajni vožnji (testi vodljivosti) in to, da energija v sunkih ne raste (danes 0 prirastov).
- Dokaz preverjalca: Lasten preizkus, nova fizika: T 120 v zadnjo os stoječega B 14,3° (največ 665 °/s), prečkajoči 14,8°, 200 km/h −11,8° (klasična 268° / 523° / 1263°). Koda stepNova, vrstici 3079 in 3081: vsak korak w = clamp(w, ±3,2 rad/s), pri avtu, ki ne pelje naprej, w += (rT − w)·min(1, dt/0,03) (−27 % na korak). Nova ni privzeta fizika (js/game.js DEF phys 'cs').

### [3] Cela sprememba hitrosti v enem koraku in odboj 0,12 tudi pri 240 km/h

- Oznaka: `mase-en-korak` · področje: Mase, prikolice in različice · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Celno 120+120 km/h, enaki teži in miška proti kamnu (cs, Simulacija).
- Izmerjeno: Burji 121 -> -14 in -121 -> 14 km/h v enem koraku 1/120 s (1 sunek), nazaj odletita s 14 km/h (Kaskaderska 24, Arkadna 13/62). Miška 119 -> -128 km/h v enem koraku, 29 km/h hitreje od tovornjaka, ki jo je zadel (-99).
- Pričakovano: Koeficient odboja avtomobilskih karoserij pada s hitrostjo: okoli 0,1-0,2 pri 30-50 km/h približevanja in 0-0,05 nad 100 km/h; trk traja 80-150 ms, vozili ostaneta skupaj ali se komaj ločita. (vir: Odprta literatura o koeficientu odboja pri trkih avto-avto v odvisnosti od hitrosti približevanja; trajanje pojemka v standardnih čelnih preizkusih trka.)
- Ponovitev: node tools/trki/mase-razlicice.js --only razlicice -> vrstice »celno 120+120 / ...« in »celno lahek>težek 120+120 / ...«
- Predlog: e1 naj pri velikih hitrostih pade na 0,03-0,05 (npr. tretji člen nad 15 m/s). Večja sprememba, po izbiri: sunek razdeliti na več korakov (0,05-0,1 s), da se vidi stiskanje.
- Dokaz preverjalca: Lasten preizkus: celno 120+120 enaka avta ±14 km/h nazaj v 1 sunku (e 0,12); miška/kamen: miška 119 → −128 km/h v enem koraku, kamen 99. Trije avti v vrsti: 120 v dva stoječa → 39/39/41 km/h v 3 korakih, gibalna količina 0,00 %. Opomba: e 0,12 proti 0–0,05 je majhna razlika (odboj 14 namesto 0–6 km/h); trajanje 1 korak (8 ms) namesto 80–150 ms je lastnost impulznega računa.

### [3] Na spletu lokalni avto vzame ves trk, prijateljev nič

- Oznaka: `mase-splet-net` · področje: Mase, prikolice in različice · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Igralec proti avtu z c.net (v meritvi se net avto giblje naprej s svojo hitrostjo): celno 120+120, od zadaj 120>90, T v stoječega.
- Izmerjeno: Celno: lokalni -240,5 km/h (proti tekmecu -135,0), potem ga net avto nese 2 s; T v stoječ net avto: lokalni 121 -> 0 (proti tekmecu 53); od zadaj -30,8 (-17,5). Net avto 0 v vseh različicah.
- Pričakovano: Vsak dobi svoj delež po masi (-135/+135). Če vsak telefon tako obravnava svoj avto, si avta hitrosti zamenjata, kar je trk brez izgube energije (e = 1) namesto e 0,12-0,15. (vir: Zakon o ohranitvi gibalne količine in energije.)
- Ponovitev: node tools/trki/mase-razlicice.js --only vloge -> vrstice z vlogo »I>net«
- Predlog: Lokalni avto naj vzame samo svoj delež (kot proti tekmecu), delež drugega naj izračuna njegov telefon ali ga dobi po mreži; ves razmik naj ne gre samo lokalnemu. Preveriti v kodi spleta, kaj naredi druga stran.
- Dokaz preverjalca: Lastna dvojna simulacija dveh telefonov (v4.js net: vsak računa svoj avto, drugega kaže iz 50–200 ms starega stanja; koda carCollide net avtu hitrosti ne spremeni): čelno 120+120 lokalni dv −233 km/h (njihovo −240,5), oba nazaj s 114–115 km/h; T v stoječega: strelec 0 km/h (en telefon 52); od zadaj 120>90: strelec −30 km/h, zadeti 0 sunkov. »Net avto ga nese 2 s« je artefakt makete (net avto s stalno hitrostjo, ki se nikoli ne odzove); v dvojni simulaciji se avta zamenjata hitrosti, kot merilec napoveduje v pričakovanju. Podrobno v novi ugotovitvi v-avto-avto-splet-odboj.

### [3] Klasični vlačilec ostane ob bočnem trku skoraj tog, nova fizika ga zlomi

- Oznaka: `mase-vlacilec-tog` · področje: Mase, prikolice in različice · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Burja pri 100 km/h v bok kabine cisterne (17,3 t), ki pelje počez pri 60 km/h; in burja 80 celno, 1 m iz sredine, v vlačilec 80.
- Izmerjeno: Bok kabine: cs vlačilec 10 st, yaw 48 st/s, pregib 4 st, xgl 1,00, 9,6 % gibalne količine vzamejo gume; nova vlačilec 33 st, 144 st/s, pregib 32 st. Celno iz sredine: cs avto 180 st in 557 st/s, pregib 16 st; nova avto 5 st, pregib 8 st, 160 sunkov.
- Pričakovano: Prost vlačilec 5,3 t dobi od tega sunka okoli 3,2 rad/s; gume v 0,1 s trka zadržijo le ~4 od ~29 kN s, torej zasuk okoli 30 st in začetek zloma sklopa (bliže novi fiziki). (vir: Zakon o ohranitvi gibalne in vrtilne količine; Coulombovo trenje gum.)
- Ponovitev: node tools/trki/mase-razlicice.js --only prikolice -> vrstice »avto 100 > bok kabine (vlačilec 60 počez)« [cs] in [nova], »avto 80 celno 1 m iz sredine > vlačilec 80«
- Predlog: tlHold naj ob trku zadrži le sunek, ki ga gume zmorejo v času trka (TLK.hold x masa x ~0,1 s), ostalo naj gre v zasuk vlačilca; uskladiti cs in novo.
- Dokaz preverjalca: Lasten preizkus (v5.js cab, brez Race._tlStep): burja 100 v bok kabine pri prednji osi, cisterna 60 počez: cs vlačilec −10,2°, 48 °/s, xgl 1,00, toga vsota −155 °/s, vzeto 0; nova −31,2°, 149 °/s (njihovo 10° / 48 in 33° / 144). Pričakovanih ~30° je skladnih s togo vsoto igre (1,9–2,7 rad/s, I vlačilca 13 568 kg m²). Čelnega trka 1 m iz sredine v vlačilec nisem ponovil sam; »180 st« avta v tej vrstici je bil odrezan z istim wrap.

### [3] Čelni trk ustavi avto v enem koraku (≈157–520 g), brez mečkanja

- Oznaka: `zid-ustavitev-v-enem-koraku` · področje: Ograja in zid · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: 90° in 60°, 60–200 km/h, vsi avti
- Izmerjeno: 60 km/h → 14 km/h v 1/120 s (≈157 g), 120 km/h → 27 km/h (≈315 g), 200 km/h → 46 km/h (≈520 g); 97–98 % energije v enem koraku; popravek lege do 25,5 cm v koraku. Pri 60° gre 72 % hitrosti v enem koraku, mirovanje po 0,35–0,9 s. Vlak s polprikolico obstane v 0,13 s, ker ga potiska 12 t.
- Pričakovano: Pojemek traja ~0,08–0,12 s (10–14 korakov), povprečno ~17 g pri 60 km/h in ~34 g pri 120 km/h, nos se zmečka 0,5–0,8 m; v gume 0,2–0,4 s in 1–2 m. (vir: Kinematika (a = v/t, pot mečkanja s = v·t/2); čelni preskusi v togo oviro (pojemek ~0,1 s, deformacija 0,5–0,7 m pri 56 km/h))
- Ponovitev: node tools/trki/zid.js --json → matrika[].g1 (pojemek 1. koraka v g) in v1; MATRIKA 1a »90 60 nic«
- Predlog: Cona mečkanja: za hitre normalne trke naj bo črta ograje »mehka« 0,5–0,8 m (gume 1–1,5 m), normalna sila omejena (npr. 20–40 g · masa), tako da ustavljanje traja 8–15 korakov; kamera in zvok dobita potek sile namesto enega sunka.
- Dokaz preverjalca: Formula wallCollide (J = -(1+e)*vn/(1/m + rn^2/I*wy), e 0,05) vzame 0,88*v v enem koraku 1/120 s; njihov json da g1 = 157 g (90°/60) in 149 g (30°/200). Moj Race.step na Bathurstu: 60 -> 10 km/h in 120 -> 20 km/h v enem koraku (~170 g oz. ~340 g); 30°/200: 200 -> 155-156 km/h v 1. koraku na vseh 5 mestih. Popravek lege (c.x += nx*pen) ni omejen.

### [3] Nos zidu boksov nima čelne ploskve: avto preskoči 1,15 m vstran

- Oznaka: `zid-nos-zidu-boksov` · področje: Ograja in zid · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Spa, igralec po uvozu v bokse s sredino avta na črti zidu, 109 km/h naravnost v začetek zidu (−167 m od štarta), Race.step
- Izmerjeno: V koraku, ko se vrzel konča, se avto premakne 115 cm vstran (pol širine + 0,25 m); hitrost 109 → 109 km/h, hit 0,1 m/s, brez škode in zvoka.
- Pričakovano: Trk v čelo zidu (kot čelni trk v ograjo ali v blažilnik iz gum); premik v enem koraku nikoli več kot ~0,25 m. (vir: Zveznost gibanja (premik v koraku ≤ v·dt = 0,25 m pri 109 km/h); meritev skripte)
- Ponovitev: node tools/trki/zid.js --del posebne → vrstica »nos zidu boksov (Spa, -167 m)«, stolpec skok
- Predlog: Koncu zidu dodaj čelno ploskev (polkrog polmera ~0,5 m ali kratek prečni zid) z istim sunkom kot ograja; popravek lege omeji na nekaj cm na korak, ostalo naj reši sunek.
- Dokaz preverjalca: Race.step, vožnja naravnost v nos zidu boksov z odmikom sredine avta od črte zidu. Spa: 115 cm vstran v enem koraku pri odmiku 0, 95 cm pri -0,2 m, 55 cm pri -0,6 m, 82 cm pri +0,2 m, 42 cm pri +0,6 m, 0 pri +-1,2 m. Bathurst: 70 cm pri 0, 90 pri +0,2, 87 pri +0,6, 50 pri -0,2, 10 pri -0,6 m. hitWall <= 0,6 m/s, škoda 0: avto se teleportira vstran brez udarca. (Bathurst +1,2 m sem izločil: skok pri t = 0 je moja postavitev.)

### [3] Rob prepada je pri počasnem prehodu neviden zid

- Oznaka: `zid-rob-prepada-nevidni-zid` · področje: Ograja in zid · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Preizkusna odprta cesta z def.drops, BURJA R7, cs: 5°/60 in 15°/30 (navzven pod 2,5 m/s) proti 5°/120, 15°/60, 30°/120
- Izmerjeno: 5°/60 (navzven 1,4 m/s): avto 2,5 s drsi ob nevidnem robu 1,2 m od asfalta z istim trenjem kot ob ograji, 58 → 37 km/h po 2 s; 15°/30: ustavi se ob robu. Nad 2,5 m/s navzven (5°/120, 15°/60, 30°/120) pade.
- Pričakovano: Kjer ograje ni, avto z vogalom čez rob zdrsne ali se nagne in pade, ko gre težišče čez; brez trenja in isker ob ničemer. (vir: Statika (prevrnitev, ko težišče prečka rob podporne ploskve); prag v kodi wallCollide (vo > 2,5 m/s))
- Ponovitev: node tools/trki/zid.js --del posebne → vrstice »rob prepada«
- Predlog: Brez praga hitrosti: padec, ko gre sredina avta (ali dve kolesi) čez rob; do takrat brez sunka in trenja. Kjer naj avto ostane na cesti, nariši nizek zid ali robnik z isto fiziko kot ograja.
- Dokaz preverjalca: Race.step, odprta cesta s prepadom, rob 1,20 m od asfalta; koda core.js 3783-3787 (vo > 2,5 -> c.fall, sicer impulz zidu). Prag je točno 2,5 m/s navzven: 10°/45 (2,17 m/s) ga rob drži 2,94 s (25 km/h po 2 s), 10°/50 (2,41) 3,08 s (28 km/h), 10°/55 (2,65) in 10°/60 padeta; 3°/120 (1,74) drži 1,09 s (82 km/h po 2 s), 3°/180 (2,62) pade; 20°/20 (1,90) drži 4,43 s in se ustavi, 20°/30 pade.

### [3] Izguba ob predmetu ali odpadlem delu ni odvisna od mase avta

- Oznaka: `predmeti-masa-avta` · področje: Predmeti, razbitine, promet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Isti predmet oziroma del v sredino pri 120 km/h z vozili 165 kg (mravlja), 680 kg (kolibri), 1150 kg (rally) in 5300 kg (titan).
- Izmerjeno: Stožec: 11,3/11,6/11,6/11,4 %. Bala: 48,1/49,7/49,7/52,1 %. Nadstrešek 220 kg: 4,5 % pri vseh štirih. Ležeč pokrov: 2,5 % pri vseh; drseč pokrov 7,8/12,8/12,7/10,3 %. Izgubljena gibalna količina avta proti pridobljeni predmeta: stožec 11,5/48,6/82,2/374,4, bala 7,4/31,3/53,0/310,8, nadstrešek 0,1/0,3/0,5/2,5 (prav bi bilo 1).
- Pričakovano: Izguba ~ m/(M+m): stožec ob 165-kg vozilu 2,4 %, ob 5300-kg tovornjaku 0,08 % (32-krat manj); nadstrešek 220 kg: 77 % ob 165 kg in 5,4 % ob 5300 kg. Razmerje gibalnih količin 1,0. (vir: Ohranitev gibalne količine; js/core.js propFeel (k = min(0,045, 0,0016·m)·min(1, vrel/8)) in debrisHit (k = min(0,06, 0,004·m)) mase avta ne poznata.)
- Ponovitev: node tools/trki/predmeti.js --del vrste (druga tabela); --del razbitine (druga tabela)
- Predlog: Izguba iz sunka, Δv = j/M (isti popravek kot predmeti-ponovni-stik): lahko vozilo naj ob nadstrešku ali skladu bal občuti veliko, tovornjak skoraj nič. Ne spreminjaj mas vozil in mas v PROPK, razen kjer je to posebej predlagano.
- Dokaz preverjalca: Lastna meritev (Spa): ležeč pokrov vzame 2,50 % avtu s 165, 680, 1150 in 5300 kg; drseč pokrov 13,9/15,0/15,0/14,5 % (pri meni daljše okno 6 s in več stikov kot pri merilcu, odvisnosti od mase ni v nobeni meritvi). Koda: v propFeel in debrisHit je delež k funkcija mase predmeta ali dela, mase avta v njem ni. Predmetov z različno težkimi avti nisem meril sam; ponovni zagon predmeti.js da iste številke (stožec 11,3-11,6 %, bala 48,1-52,1 %).

### [3] Zadet predmet je počasnejši od avta in vsak lahek predmet poleti 3,5–3,7 m visoko

- Oznaka: `predmeti-let-predmeta` · področje: Predmeti, razbitine, promet · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Zadetek v sredino pri 60/120/200 km/h; hitrost, višina in pot predmeta po zadetku.
- Izmerjeno: Hitrost predmeta proti avtu: 0,83 pri 60 km/h in 0,32 pri 200 km/h (stožec, guma, bala, hidrant enako: meja 18 m/s = 65 km/h). Najvišja točka 3,5–3,7 m pri stožcu, gumi, zaboju in bali. Pot: stožec 23/30/35 m, bala 17/21/28 m. Tabla zavorne razdalje: 0,48/0,14 v, 0,3 m visoko.
- Pričakovano: Lahek predmet ob težkem avtu: (1+e)·v·M/(M+m) ≈ 1,2–1,35 v (pri 200 km/h ~250 km/h, ne 65 km/h), nikoli več kot (1+e)·v. Višina po višini zadetka: stožec in bala (težišče 0,2–0,4 m, pod odbijačem) ostaneta pod ~1–1,5 m. (vir: Newtonov trkovni zakon; js/core.js propCarHit (b.vy = min(7,5, b.vy + min(5, vrel·lift·0,22)); vodoravna meja min(K.vmax // 18, 0,72·v + 2)).)
- Ponovitev: node tools/trki/predmeti.js --del predmeti (stolpci vo/v, h, pot)
- Predlog: Meja hitrosti (1+e)·v; lahkim predmetom zračni upor ~v², da pot ostane 20–40 m in predmet ostane viden; navpični sunek po višini zadetka glede na težišče. Ne spreminjaj: predmeti ostanejo znotraj ograje, propStep (tla, spanje), strošek koraka.
- Dokaz preverjalca: Lastna meritev (Spa, Bathurst): največja hitrost zadetega predmeta 65 km/h = 0,83 v pri 60, 0,54 v pri 120 in 0,32 v pri 200 km/h (kosi sklada bal do 80-81 km/h); dvig 3,5-3,9 m pri stožcu, gumi, zaboju in bali (120 in 200 km/h). Koda: meja hitrosti min(K.vmax//18, 0,72·v + 2) m/s in dvig vy do 7,5 m/s, ki se s ponovnimi stiki sešteva.

### [3] Ležeč del vzame enak odstotek hitrosti pri vsaki hitrosti in masi avta; del se ne premakne

- Oznaka: `predmeti-del-lezi` · področje: Predmeti, razbitine, promet · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Del leži na tleh na sredini poti, avto ga povozi pri 60/120/200 km/h; vozila 165–5300 kg.
- Izmerjeno: Ogledalo 0,2 %, blatnik 1,0 %, odbijač 1,4 %, prtljažnik in kolo 2,2 %, pokrov 2,5 % (−5 km/h pri 200 km/h), enako pri vseh hitrostih in vseh štirih masah; del se ne premakne (pot 0,0 m). Pokrov pri 120 km/h avtu vzame ~5 % od 639 kJ = 32 kJ.
- Pričakovano: Prevoz čez ploščat kos pločevine ali plastike: delo za deformacijo reda 0,5–3 kJ, torej Δv = ΔE/(M·v): pri 120 km/h ~0,05–0,3 % (1150 kg), pri višji hitrosti in težjem avtu manj. Kos naj se ob prevozu premakne ali zasuka za 1–5 m. (vir: Energijska bilanca (ocena); js/core.js debrisHit in DEB_RUN (k = 0,002·m, največ 2,5 %, enkrat na prevoz; del se povozi, ne odbije).)
- Ponovitev: node tools/trki/predmeti.js --del razbitine (stanje lezi, obe tabeli)
- Predlog: Izguba iz stalne energije na vrsto dela (ΔE po velikosti, Δv = ΔE/(M·v)); kos dobi majhen sunek (1–3 m/s) in zasuk. Ohrani: del se povozi in ne odbije (avta ne ustavi), enkrat na prevoz, poskok v izrisu.
- Dokaz preverjalca: Lastna meritev (Spa, 60/120/200 km/h): ogledalo 0,20 %, blatnik 1,00 %, sprednji odbijač 1,40 %, pokrov 2,50 % pri vseh treh hitrostih in pri masah 165/680/1150/5300 kg; del se premakne 0,0 m. Koda: debrisHit za ležeč del (d.ground, hitrost < 3 m/s) enkrat na prevoz k = min(2,5 %, m·0,2 %), dela ne premakne.

### [3] Težki ulični predmeti (svetilka, semafor, omarica, nadstrešek) so za avto prelahki in se umaknejo že pri 15 km/h

- Oznaka: `predmeti-tezki-prelahki` · področje: Predmeti, razbitine, promet · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Zadetek v sredino in 0,6 m iz sredine pri 60/120/200 km/h ter počasi pri 5/15/30 km/h.
- Izmerjeno: Vse vrste nad 28 kg: en stik in izguba 4,5 % pri 120 in 200 km/h (hidrant 45 kg, omarica 80, semafor 90, svetilka 110, semafor z drogom 160, nadstrešek 220 kg). Izgubljena gibalna količina avta proti pridobljeni predmeta: svetilka 1,1, semafor 160 kg 0,8, nadstrešek 0,6 (predmet dobi več, kot avto izgubi). Počasi: nadstrešek pri 15 km/h odrinjen 4,6 m ob izgubi 7,4 %, svetilka pri 30 km/h 4,6 m ob 6,8 %. Škoda avta pri 200 km/h: semafor z drogom 7,4 %, svetilka in nadstrešek 5,9 %, hidrant 0,6/1,6/3,0 % (60/120/200).
- Pričakovano: Prost predmet: (1+e)·m/(M+m): hidrant 5,1 %, omarica 8,8 %, svetilka 11,8 %, semafor 160 kg 16,5 %, nadstrešek 21,7 %. Sidran predmet se pod pragom loma ne premakne (pri 5–15 km/h avto obstane); lomljiv drog vzame do ~5 m/s (18 km/h) pri 35–100 km/h, tog drog avto ustavi. (vir: Ohranitev gibalne količine; EN 12767 (pasivna varnost nosilnih konstrukcij cestne opreme); NCHRP Report 350 in AASHTO Manual for Assessing Safety Hardware (lomljivi drogovi: sprememba hitrosti do ~5 m/s); js/core.js propFeel (zgornja meja 4,5 %).)
- Ponovitev: node tools/trki/predmeti.js --del predmeti (hydrant, cabinet, signal, lamp, signalm, shelter); --del pocasi
- Predlog: Vrstam z dmg dodaj prag loma (sunek ali energija): pod pragom je predmet trdna ovira (avto se odbije, e ~0,1), nad pragom se odlomi, avto izgubi sunek praga in (1+e)·m/(M+m); škoda avta iz sunka. Ne spreminjaj: tabla zavorne razdalje in lahki predmeti ostanejo lahki; avto po lomu ne obtiči.
- Dokaz preverjalca: Lastna meritev (Spa, v sredino): hidrant 45 kg, nabiralnik 40, omarica 80, svetilka 110 in nadstrešek 220 kg imajo pri 120 in 200 km/h en stik in izgubo 4,50 % (koš 28 kg 4,48 %); gibalna količina avto/predmet: svetilka 1,1-1,45, nadstrešek 0,5-0,9. Počasi: nadstrešek pri 15 km/h odrinjen 3,0 m ob izgubi 5,5 % (merilec 4,6 m, 7,4 %), svetilka pri 30 km/h 3,9 m ob 6,7 % (merilec 4,6 m, 6,8 %): pot 15-35 % krajša, slika ista (predmet se umakne). Škoda: hidrant 0,6/1,6/3,0 % in svetilka 5,9 % pri 200 km/h enako kot merilec; nadstrešek pri 200 km/h pri meni 10,1 % (merilec 5,9 %). Koda: propFeel ima zgornjo mejo 4,5 % na stik.

### [3] Pristanek šteje navpično hitrost, ne hitrosti glede na cesto: klanec navzdol kaznuje bolj

- Oznaka: `boksi-pristanek-navpicna-hitrost` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Rally 1 m nad cesto, vzporedno z njo, 100 km/h, nagib ceste 0, -8, -15 in +8 % (Car.step); isto na Spa (Race.step, +4,7 %).
- Izmerjeno: Izguba hitrosti 8,4 % (ravno), 12,0 % (-8 %), 13,0 % (-15 %), 5,1 % (+8 %), Spa 6,4 %; hitrost glede na cesto je povsod 5,2-5,3 m/s, igra pa vzame navpično: 5,25 / 7,47 / 9,30 / 3,14 m/s.
- Pričakovano: Udarec določa hitrost pravokotno na cesto, torej enaka izguba v vseh štirih primerih; pristanek na klancu navzdol je v resnici najmehkejši. (vir: Newtonovi zakoni: sunek ob dotiku deluje vzdolž normale podlage)
- Ponovitev: node tools/trki/boksi-pristanek.js --del pristanek → tabela PRISTANEK 2
- Predlog: Za izgubo hitrosti, škodo in landT uporabi vy - nagib × vzdolžna hitrost (hitrost glede na cesto).
- Dokaz preverjalca: Lastna meritev na pravih progah (Race.step, avto 1 m nad cesto, vzporedno z njo, 100 km/h, mesta z enakomernim klancem): Bathurst: ravno 8,4 %, klanec -7,3 % 11,9 %, -13,0 % 13,0 %, +7,5 % 5,1 %; igra vzame vy 5,25 / 7,39 / 8,86 / 3,16 m/s, pravokotno na cesto je povsod 5,1-5,3 m/s. Spa: -0,5 % 8,7 %, -7,0 % 11,5 %, +4,7 % 6,5 %. Koda: sc = clamp(-impactVY·0,016·lk, 0, 0,13·lk) z navpično vy. Na Ouninpohji je 17 od 18 pravih pristankov na klancu navzdol (povprečno -3,0 %: vy 6,97 proti 5,64 m/s glede na cesto).

### [3] Pristanek vzame 5-13 % hitrosti, brez odboja in brez izgube oprijema; škoda šele nad 11 m/s

- Oznaka: `boksi-pristanek-izguba-brez-odboja` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Rally in tovornjak, padec z 0,3-10 m na ravno cesto pri 100 in 200 km/h, nato poln volan (Car.step).
- Izmerjeno: Padec 0,3 / 1 / 3 m: -4,7 / -8,4 / -13,0 % hitrosti v enem koraku (pri 200 km/h in 3 m: 190,6 → 165,7 km/h), odboj 0,0 cm, bočni pospešek takoj po pristanku 1,56 / 1,54 / 1,52 g (brez padca 1,58 g), škoda 0 % do 3 m, 2,0 % pri 6 m, 5,7 % pri 10 m; tovornjak -5,2 %, škoda 0 % do 10 m.
- Pričakovano: Navpičen sunek vodoravne hitrosti ne spremeni; trenje koles je omejeno z μ × navpični sunek, zato je izguba sorazmerna vy, ne hitrosti vožnje (pri prostem kotaljenju blizu 0). Vzmetenje se stisne in odbije: 0,2-0,5 s najprej več, nato manj obremenitve koles (oprijem zaniha). Padec 3 m (7,7 m/s) presega hod vzmetenja, 10 m (14 m/s) je za avto uničujoč. (vir: Zakon o ohranitvi gibalne količine (sunek sile); Coulombov zakon trenja)
- Ponovitev: node tools/trki/boksi-pristanek.js --del pristanek → tabela PRISTANEK 1 in vrstica »oprijem takoj po pristanku«
- Predlog: Izguba Δv = k × /vy glede na cesto/ (k ≈ 0,2-0,3) namesto odstotka hitrosti; 0,2-0,4 s po pristanku nihanje oprijema in rahel odboj karoserije; škoda od ~6 m/s naprej, kvadratno.
- Dokaz preverjalca: Lastna meritev (Spa in Bathurst, Race.step, 100 km/h): padec 0,3 / 1 / 3 m: -4,5 do -4,9 / -8,4 do -8,7 / -13,0 % v enem koraku; 200 km/h in 3 m: -13,1 % = -26,1 km/h; škoda 0 % do 3 m, 2,0 % pri 6 m, 5,7 % pri 10 m; tovornjak -5,2 %, škoda 0 % do 10 m. Koda: ob dotiku y = roadY, vy = 0 (brez odboja), škoda samo nad landV 11 m/s. Bočnega pospeška takoj po pristanku nisem meril.

### [3] Prevrat je žreb 1 : 9 po trku v bok, ne posledica bočnega drsenja in oblike avta

- Oznaka: `boksi-prevrat-zreb` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: setCrash({ roll: 1 }): avto pravokotno v bok stoječega (400 avtov, vsak svoj prvi trk) in bočno v ograjo na Spa, hitrosti 8-20 m/s; dirke 90 s.
- Izmerjeno: V bok: 0 % pri ≤ 8,9 m/s, 11 % pri 9,1, 12, 16 in 20 m/s, enako po vsej dolžini boka in z novo fiziko; v ograjo: 0 % pri ≤ 9,5 m/s, 11 % pri ≥ 10,5 m/s. Prag in delež sta za vse modele enaka. Avto, ki bočno drsi brez trka (trava, robnik), se ne prevrne nikoli. Dirke: čista 0 prevratov, igralec namerno v trke 1-2 v 90 s.
- Pričakovano: Avto se prevrne, ko bočno drseč zadene oviro (robnik, mehka podlaga) z bočno hitrostjo nad pragom, ki sledi iz dviga težišča: za kolotek 1,5 m in težišče 0,5 m ≈ 6 m/s (22 km/h), v praksi 20-40 km/h; prag raste s SSF = kolotek / (2 × višina težišča) (nizek dirkalnik ~3, kombi ~1,1). Nad pragom se prevrne vedno; udarjeni avto na ravnem asfaltu (trenje ≈ 1 < SSF) praviloma samo zdrsne. (vir: Energijski pogoj prevrnitve togega telesa; statični faktor stabilnosti SSF (NHTSA, ocenjevanje odpornosti proti prevrnitvi))
- Ponovitev: node tools/trki/boksi-pristanek.js --del prevracanje → tabeli PREVRACANJE 1 in 3
- Predlog: V novi različici prag iz lastne bočne hitrosti avta ob spotiku (robnik, trava ali pesek, kolo drugega avta, ograja) in SSF modela; žreb kvečjemu v ozkem pasu okoli praga; trk v bok brez spotika naj avta ne prevrne.
- Dokaz preverjalca: Koda (xRollStart, js/core.js 2175-2181): prag imp > 9 m/s (zid: bočni udarec nad 10 m/s), nato žreb iz zgoščene vrednosti (številka trka, id avta) proti XROLL.p = 0,1; hitrost, mesto zadetka in model v žrebu ne nastopajo. Lasten izračun istega žreba za id 1-400 pri prvem trku: 44 od 400 = 11,0 % (merilec 11 %). Opomba za občutek: prevračanje je možnost »Razbijanje · nov način« (setCrash roll), privzeto izklopljena; brez nje se avto ne prevrne nikoli.

### [3] Prevrat traja 1,2-1,6 s ne glede na hitrost; avto nadaljuje s 70-75 % hitrosti

- Oznaka: `boksi-prevrat-potek` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Avto id 2 na ravnini, prevrat sprožen pri 50-200 km/h s trkom 10 in 16 m/s (Car.step: xRollStep).
- Izmerjeno: 1 obrat 1,18 s, 2 obrata (trk > 15 m/s) 1,58 s pri vsaki hitrosti; 100 km/h: pot 31 m, konec 71,4 km/h, škoda +4 % (2 obrata +8 %), nos 0° zasuka, do prejšnje hitrosti v 0,8 s plina; 200 km/h: pot 64 m, konec 150,6 km/h. Pojemek 0,50 g pri 50 km/h, 1,21 g pri 200 km/h (zadnji korak odreže 20 % hitrosti).
- Pričakovano: Valjanje zavira z ~0,4-0,5 g do ustavitve: pri 100 km/h 6,3 s in 87 m (3-5 obratov), pri 200 km/h 12,6 s in 350 m; avto obstane, pogosto ne na kolesih, s hudo škodo. (vir: Enakomerno pojemajoče gibanje s = v²/(2a); odprta literatura o rekonstrukciji prevrnitev (SAE): povprečni pojemek valjanja 0,4-0,5 g)
- Ponovitev: node tools/trki/boksi-pristanek.js --del prevracanje → tabela PREVRACANJE 2
- Predlog: Trajanje in število obratov iz hitrosti (pojemek 0,45 g, obrat na ~1,2 s), konec pod 30 km/h; škoda na stik strehe 2-3× večja; pri Vklop odstop ali počasna vrnitev; nos po prevratu zasukan.
- Dokaz preverjalca: Lasten izračun iz konstant v kodi (xRollStart, xRollStep): T = 0,78 + 0,4·obrati = 1,18 / 1,58 s (2 obrata nad 15 m/s), pojemek 3 m/s² in na koncu hitrost x 0,8: 102,1 -> 71,5 km/h, pot 31,4 m; 105,1 -> 70,4 km/h (2 obrata, 42,4 m); 201,0 -> 150,6 km/h, 63,8 m; 54,0 -> 33,0 km/h. Enako merilčevi tabeli na 0,1-0,2. Škoda +4 % na obrat (0,04·knockK). Velja samo ob vklopljenem prevračanju (privzeto izklop).

### [3] Škoda trka je za oba avta enaka in linearna s hitrostjo, ne glede na maso

- Oznaka: `boksi-skoda-masa` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Čelno v stoječ avto, en klic carCollide: rally v rally 3-55,6 m/s; strelica (460 kg) v medveda (2300 kg) pri 15 m/s; pravokotno v ograjo na Spa (Race.step).
- Izmerjeno: Strelica / medved: škoda 22,1 % / 18,4 %, sprememba hitrosti 50,6 / 10,1 km/h (5 : 1); obrnjeno enako. Rally v rally: 10,4 % pri 36 km/h, 38,9 % pri 100, 83,4 % pri 200 km/h (vsak); ograja: 20,7 % pri 36 km/h, 70,5 % pri 100, 100 % pri 150 km/h. Pravilo: (v - 3,5)·1,6 % oz. (v - 2,5)·2,8 %, × knockK.
- Pričakovano: Deformacijsko delo raste s kvadratom hitrosti (E = ½·μ·v²·(1 - e²)); resnost za posamezen avto določa njegova Δv, zato lahek avto s 5× večjo Δv utrpi nekajkrat več škode. Udarec 36 km/h v ograjo je odbijač in hladilnik (~10 %), ne petina avta. (vir: Ohranitev gibalne količine in energije pri neprožnem trku; Δv kot merilo resnosti trka (rekonstrukcija prometnih nesreč))
- Ponovitev: node tools/trki/boksi-pristanek.js --del skoda → tabeli SKODA 1 in SKODA 2
- Predlog: Škoda ∝ (lastna Δv)² z mehkim pragom (npr. 0 % pod 2 m/s, 100 % pri Δv ≈ 25 m/s), knockK ostane faktor modela; isti zakon za ograjo, avto in pristanek.
- Dokaz preverjalca: Lastna meritev (en klic Core.carCollide, čelno v stoječ avto): strelica 460 kg v medveda 2300 kg pri 60 km/h: škoda 25,3 / 21,1 %, sprememba hitrosti -56,2 / +11,2 km/h (5 : 1), obrnjeno enako; razmerje škode 1,2 je samo knockK modela (merilec 22,1 / 18,4 % pri ~54 km/h: isto razmerje). Mravlja 165 kg v zrcalnega 7000 kg pri 36 km/h: škoda 13,5 / 5,7 % ob spremembi hitrosti 40,0 / 0,9 km/h (44 : 1). Rally v rally: 10,4 / 38,8 / 83,3 % pri 36 / 100 / 200 km/h (linearno, (v - 3,5)·1,6 %).

### [3] Po močnem trku ob zid avto zavirajo lastni odpadli kosi karoserije (-27 do -33 km/h v 0,15 s)

- Oznaka: `v-zid-lastni-kosi-zavirajo` · področje: najdba preverjalca (zid) · zaupanje merilca: high · preverjanje: najdba preverjalca
- Scenarij: rally, klasična fizika, Race.step, škoda Samo videz ali Vklop, brez vnosa; 30°/200 in 15°/200 ob ograjo na 5 mestih (asfaltni oval, oval s travo, Bathurst ravnina in gora, Spa). Primerjava z izklopljenimi kosi (race.spawnDebris = () => {}) in s škodo Izklop.
- Izmerjeno: 30°/200 (2 kosa): s kosi 107-113 km/h pri 0,15 s, brez kosov 139-143 (-27 do -33 km/h, -20 %); pri 0,5 s -23 do -35 km/h (asfalt 110 proti 140, Bathurst 91 proti 126, Spa 96 proti 127). 15°/200 (1 kos): asfalt -1 km/h, Bathurst 135 proti 153 pri 0,5 s, Spa 133 proti 156 pri 0,5 s in 56 proti 103 km/h pri 2 s. 30°/120 in 15°/120 (škoda <= 45 %): brez vpliva, torej prag pri ~50 % škode. S škodo Izklop: 143 km/h. Vzrok: spawnDebris vrže kos z 0,7x hitrostjo avta iz njegove karoserije, debrisHit pa avtu vsak korak vzame min(0,06; m*0,004) hitrosti, dokler je leteči kos v dosegu in se mu avto približuje hitreje od 0,3 m/s.
- Pričakovano: Kos karoserije s 5-10 kg vzame 1150 kg težkemu avtu < 1 % hitrosti (gibalna količina); avto po trku ne sme izgubiti dodatnih 20 % zaradi lastnih kosov, izguba pa ne sme skočiti na pragu škode. (vir: Ohranitev gibalne količine (m_kos/m_avto ~0,5-1 %); js/core.js 3499-3530 (debrisHit), 6976-6986 (spawnDebris), 7098-7144 (vrstni red Race._step).)
- Ponovitev: node tools/trki/preverjanje/zid/p3.js vse (stolpci kosi da/brez, v0.15, v05, v2; izpis v tools/trki/preverjanje/zid/p3-vse.txt); primerjava: node tools/trki/zid.js --del matrika (način 'sam' brez kosov: 30°/200 -> 143 km/h).
- Predlog: Kosi naj prvih ~0,5 s ne trkajo z avtom, od katerega so odpadli (ali naj se rodijo zunaj njegovega dosega), upor letečega kosa pa naj bo enkraten impulz po masi (m_kos/m_avto), ne delež hitrosti na korak. Matrika zidu naj za vrstice s škodo >= 50 % teče prek Race.step.

### [2] Čelni trk z zamikom: avta obstaneta na mestu z nosom naravnost, vrtilna količina izgine

- Oznaka: `avto-celni-zamik-obstane` · področje: Avto ob avto (enaki masi) · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: head-60-o in head-120-o: oba z V drug proti drugemu, zamik pol širine (0,9 m); klasična fizika, enako pri kaze in strega
- Izmerjeno: Pri 60 in 120 km/h imata oba po 0,1 s 0 km/h (v koraku dotika 4,3 km/h), zasuk 0,1°, največ 4 °/s, xgl 0; zamik nosu csKc 19,8° / 22,9° brez vidnega zasuka. Vrtilna količina para okoli stika −17 250 / −34 500 kg m²/s, sunki je odvzamejo 99 % (tog sunek bi dal vsakemu −340 / −683 °/s, vzeto 0). Avta ostaneta prislonjena vseh 6 s. Nova fizika: 0 km/h, zasuk −7° (661 °/s traja en korak).
- Pričakovano: Vrtilna količina se ohrani: pri 120 km/h dobi vsak avto do ~660 °/s (toga meja; z zmečkanino 200–400 °/s) in se ob drsenju z 0,8–1,0 g zasuka za 60–180° v 0,5–1,5 s. Težišči se skoraj ustavita (po teoriji ostane ~4 km/h), a avta se zavrtita drug ob drugem in ne obstaneta poravnana. (vir: Ohranitev vrtilne količine; ravninska mehanika trka togih teles (Vehicle Accident Analysis and Reconstruction Methods); js/core.js kTake: sstep(KG_V0, KG_V1, V) po hitrosti po sunku)
- Ponovitev: node tools/trki/avto-avto.js --only head (vrstici head-60-o in head-120-o, tabela »the turn«); node tools/trki/avto-avto.js --trace head-120-o
- Predlog: Trd sunek (zahtevani zamik nosu nad CSK.tapMax ali Δv nad ~5 m/s) naj vzame oprijem in da kotno hitrost ne glede na hitrost po sunku: za prag KG_V0 / KG_V1 uporabi večjo od hitrosti pred sunkom in po njem. Ne sme se spremeniti: sunki pod ~3 m/s v gneči (šikana, naslanjanje), kjer ostane samo zamik nosu.
- Dokaz preverjalca: Lasten preizkus (v3.js head): čelno z zamikom pri 60 in 120 km/h imata oba po 0,1 s 0 km/h, zasuk −0,1°, toga vsota −340 / −683 °/s, vzeto 0; napaka gibalne količine 0,00 %. Pri 200 km/h obstaneta simetrično v 3 od 4 leg, v eni se en avto zavrti (glej avto-vrtenje-brez-meje-loterija).

### [2] Sunki ob vrtečem se avtu dodajajo energijo

- Oznaka: `avto-energija-raste` · področje: Avto ob avto (enaki masi) · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: tbone-120/200-stand-rear, rear-120/200-stand-o, head-200-o; klasična fizika (nova: nikoli)
- Izmerjeno: Posamezen klic carCollide poveča kinetično energijo para: tbone-200-stand-rear +55,4 kJ (3,1 % začetnih 1775 kJ), tbone-120-stand-rear 5 sunkov, največ +12,6 kJ (2,0 % od 639 kJ), head-200-o +22,6 kJ, rear-200-stand-o +11,8 kJ, rear-120-stand-o 7 sunkov do +2,1 kJ. Gibalna količina se pri tem ohrani (0,00 %).
- Pričakovano: Trk nikoli ne poveča kinetične energije para (odboj e ≤ 1): prirast 0 J v vsakem klicu. (vir: Ohranitev energije in definicija koeficienta odboja; js/core.js kCollide (vn šteje a.w × r) in kTake (kotna hitrost se med xgl ne spremeni))
- Ponovitev: node tools/trki/avto-avto.js --only tbone-120-stand-rear (tabela »speeds, energy, momentum«, stolpec »gain«)
- Predlog: Sunek računaj skladno s tem, kar avto res vzame: če kotne hitrosti ne vzame, izpusti njegov člen rn²/I in w × r iz vn; če drsi (xgl > 0), mu kotni del sunka vedno prištej. Dodaj varovalo: po kTake energija para ne sme biti večja kot pred klicem. Ne sme se spremeniti: sredinski trki (ročica 0) ostanejo enaki do zadnje številke.
- Dokaz preverjalca: Lastno štetje energije na klic carCollide (½ m v² z gorivom + ½ I w², Car.I): tbone-120-stand-rear 4 prirasti, največ +12,9 kJ (2,0 % od 638 kJ); tbone-200-stand-rear +54 do +57 kJ; head-200-o +26,4 kJ (njihovo 22,6, druga lega); rear-200-stand-o +11,8 kJ; rear-120-stand-o 7 prirastov do +2,1 kJ. Gibalna količina 0,00 %. Trije avti v vrsti brez vrtenja: prirast 0,00 kJ. Prirast nastane pri sunkih v avto, ki se že vrti (dv se vzame, pripadajoči dw ne).

### [2] Hitri trki z majhnim prekrivanjem: izid je loterija koraka, avto gre lahko skozi vogal brez sunka

- Oznaka: `avto-globok-stik-korak` · področje: Avto ob avto (enaki masi) · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: A z V v stoječega B, zamik 0,75 širine (prekrivanje 45 cm), 24 leg prvega dotika v koraku 1/120 s; klasična in nova fizika enako
- Izmerjeno: 200 km/h: A po 0,1 s 95–158 km/h, B 43–104 km/h, A pride mimo B v 10/24 leg. 300 km/h: A 143–296, B 0–157 km/h, izguba energije 0–46 %, mimo v 16/24, v 7/24 A obdrži več kot 90 % hitrosti (avta se samo razmakneta, do 21 cm v koraku). 120 km/h: nikoli mimo, a zasuk A 2–69°. Sredinsko prekrivanje ob prvem dotiku do 45 cm (200), 68 cm (300), 89 cm (400 km/h). Pri globokem stiku je prijemališče na enem avtu (ročica 0,9 m proti 0).
- Pričakovano: Izid ni odvisen od tega, kje v koraku se karoseriji srečata (razpon do ~10 %); prekrivanje 45 cm pri 200–300 km/h vedno prenese sunek (B dobi vsaj ~40 km/h, A izgubi vsaj ~20 % hitrosti). (vir: Zvezno zaznavanje trkov (čas prvega dotika znotraj koraka); js/core.js rboxHit (globok stik: os najmanjšega prekrivanja) in obbHit (prijemališče))
- Ponovitev: node tools/trki/avto-avto.js (tabela »the step against the speed«, vrstice 200 / 0.75 in 300 / 0.75)
- Predlog: Ko je pot zbliževanja para v koraku nad ~0,25 m (nad ~110 km/h zbliževanja), poišči čas prvega dotika znotraj koraka (par pomakni nazaj po relativni hitrosti ali 2–4 podkoraki kCollide) in tam izberi normalo; pri globokem stiku vzemi prijemališče na sredini prekritega dela. Ne sme se spremeniti: trki pod ~100 km/h zbliževanja (enaki do zadnje številke) in čas koraka dirke.
- Dokaz preverjalca: Lasten preizkus (v3.js deep), 24 leg v koraku, prekrivanje 0,75, A v stoječega B: 200 km/h A 95–156, B 45–104 km/h, mimo 10/24; 300 km/h A 143–296, B 0–156 km/h, mimo 15/24 (njihovo 16/24), več kot 90 % hitrosti obdrži 7/24; 120 km/h nikoli mimo, zasuk A 1–68°.

### [2] Arkadna (pm 1,7, cPm): igralčev avto je v trku težji, gibalna količina se ne ohrani, energija naraste

- Oznaka: `mase-arkadna-pm` · področje: Mase, prikolice in različice · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Burja v burjo od zadaj 120>90, igralec zadaj; sunek v zadnji vogal; celno miška/kamen.
- Izmerjeno: dv 12,49 : 21,23 km/h (0,588 : 1) pri enakih masah, dP 41,2 %, kinetična energija para +6,4 do +7,2 % (+66 kJ) v enem koraku; cPm 3: dP 66,7 %, +14,4 %. Sunek: igralec zasuka tekmeca 52 st (xgl 1,00), tekmec igralca 6 st (xgl 0). Miška (igralec) proti kamnu: razmerje 7,35 namesto 12,5.
- Pričakovano: Enaki masi dobita enaki spremembi hitrosti; trk energije ne dodaja. (vir: Zakon o ohranitvi gibalne količine in energije.)
- Ponovitev: node tools/trki/mase-razlicice.js --only gorivo; node tools/trki/mase-razlicice.js --only ohranitev (vrstici Arkadna); node tools/trki/mase-razlicice.js --only vloge (Arkadna, sunek)
- Predlog: Arkadna naj ostane označena izbira, privzeta različica naj pm nima. Če želimo pomoč igralcu, naj gre čez oprijem (glP), ne čez maso; vsaj omeji sunek tako, da energija po trku ni večja kot pred njim.
- Dokaz preverjalca: Lasten preizkus Arkadna, od zadaj 120>90, igralec zadaj: igralec 105, tekmec 112 km/h po trku, +72,8 kJ (njihovo +66 kJ), napaka gibalne količine 4,6 % skupne (njihovih 41 % je delež prenesene). Je namerna lastnost različice Arkadna (pm 1,7, nastavitev cPm); v Simulaciji (privzeta, na spletu vedno) je napaka 0,00 %.

### [2] Težki potiska lahkega: dotik se v 2 s prekine in vrne 45-83-krat

- Oznaka: `mase-potiskanje-drgetanje` · področje: Mase, prikolice in različice · zaupanje merilca: medium · preverjanje: popravljeno
- Scenarij: Cisterna ali cestni vlak od zadaj v burjo (60>32 in 120>91 km/h), po trku oba brez plina.
- Izmerjeno: Cisterna 60: 137 sunkov v 240 korakih, dotik znova 83-krat; vlak 60: 94 sunkov, 45-krat; vlak 120: 57 sunkov, 46-krat. Pri drugih nošenjih (T, celno) 186-241 sunkov, od tega le 2-5 nad 0,5 m/s.
- Popravljena meritev (preverjalec): Vlak 60: 77 sunkov / 45 ponovitev; vlak 120: 58 / 39; cisterna 60: 227 sunkov, stik neprekinjen (1 ponovitev); vozilo brez prikolice (kamen 7 t, burja): 1 sunek, 0 ponovitev.
- Pričakovano: Plastičen stik: ko sta vozili skupaj in ju nič ne loči, ostaneta v stiku brez ponovnih udarcev. (vir: Neelastičen trk (e proti 0 pri majhnih hitrostih); mirujoči stik v modelih togih teles.)
- Ponovitev: node tools/trki/mase-razlicice.js --only mase -> vrstice »zadaj T>L rally/cisterna 60«, »zadaj T>L rally/zrcalni 60« in »120« (stolpca n in opombe: znova)
- Predlog: Mirujoči stik: pod eT in pri prekrivanju do ~2 cm brez razmika (histereza), učinki (zvok, iskre) šele nad pragom hitrosti. Uskladiti z agentom za učinke.
- Dokaz preverjalca: Lasten preizkus (v5.js push, brez Race._tlStep): cestni vlak se ponovi (60>32: 77 sunkov v 240 korakih, dotik znova 45-krat; njihovo 94 / 45; 120>91: 58 / 39; njihovo 57 / 46), cisterna pa pri meni trka skoraj vsak korak brez prekinitve stika (227 sunkov, znova 1-krat; njihovo 137 / 83). Nad 0,5 m/s je le 1 sunek. Brez prikolice drgetanja ni: kamen 7 t ali burja 60>32 dasta 1 sunek in 0 ponovitev. Vzrok je torej sklop s prikolico (prikolica vsak korak potegne vlačilec), ne razmerje mas.

### [2] Razbitina vzame enak delež hitrosti kartu in 7-tonskemu tovornjaku

- Oznaka: `mase-razbitine-brez-mase` · področje: Mase, prikolice in različice · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Dirka v Spa (seme), kamen 7000 kg celno v miško pri 120+120 km/h.
- Izmerjeno: Po trku 12 kosov na progi; tovornjak v koraku trka 119,9 -> 97,0 km/h (-22,8), sam trk da -19,9. debrisHit: k = min(0,025; masa kosa x 0,002), brez mase vozila.
- Pričakovano: Kos 12,5 kg vzame vozilu 7 t največ ~0,2 % hitrosti, kartu 165 kg do ~7 %. (vir: Zakon o ohranitvi gibalne količine.)
- Ponovitev: node tools/trki/mase-razlicice.js --only proga
- Predlog: k = min(kMax, c x masa kosa / masa vozila), s c izbranim tako, da avto ~1100 kg ostane, kot je.
- Dokaz preverjalca: Potrjeno s kodo in ponovitvijo njihove skripte, ne z lastno meritvijo v dirki. debrisHit (js/core.js ~3499–3530): ležeč kos k = min(0,025, d.m × 0,002), leteč k = min(0,06, d.m × 0,004), hitrost vozila × (1 − k), mase vozila v izrazu ni; skripta ponovi 119,9 → 97,0 km/h (ravnina 119,0 → 99,2). Popravek enot: d.m je po komentarju v kodi (vrstica 3342) »gameplay masa ≤ 14, ne kg«, zato »kos 12,5 kg« ni kilogram; velja največ 2,5 % (ležeč) oziroma 6 % (leteč) hitrosti na kos za vsako vozilo.

### [2] Tekmeci med seboj izgubijo pol manj oprijema, varnostni avto ga ne izgubi nikoli

- Oznaka: `mase-tekmeci-sc` · področje: Mase, prikolice in različice · zaupanje merilca: high · preverjanje: popravljeno
- Scenarij: Sunek v zadnji vogal 8 m/s počez pri 120 km/h (Simulacija), vloge I>T, T>I, T>T, I>sc.
- Izmerjeno: Igralec-tekmec (obe smeri): zasuk 23 st, xgl 0,55; tekmec-tekmec: 17 st, xgl 0,27 (glR 0,5); varnostni avto: 16 st, xgl 0,00. Varnostni avto s prikolicami ne trči (ni v race.cars; prebrano, ne izmerjeno).
- Popravljena meritev (preverjalec): Zasuk / xgl: igralec–tekmec (obe smeri) 22° / 0,53; tekmec–tekmec 15° / 0,26; varnostni avto 12° / 0,00.
- Pričakovano: Ista fizika za vse avte na progi. (vir: Doslednost modela; zakon o ohranitvi vrtilne količine.)
- Ponovitev: node tools/trki/mase-razlicice.js --only vloge -> vrstice »sunek zadaj 8 m/s 120 / Simulacija«
- Predlog: Odločitev zasnove: glR lahko ostane zaradi miru v gruči, a naj bo zapisana; varnostni avto naj izgubi oprijem kot drugi in naj trči tudi s prikolicami.
- Dokaz preverjalca: Lasten preizkus (v5.js roles), sunek v zadnji vogal 8 m/s pri 120 km/h: vzorec potrjen (xgl se med tekmecema prepolovi, varnostni avto 0), zasuki so pri meni nekoliko manjši (njihovo 23° / 0,55, 17° / 0,27, 16° / 0,00). Oboje je namerna odločitev uporabnika z 2. 11. 2026 (glR 0,5; varnostni avto brez izgube oprijema), zato to ni odstopanje za popravek.

### [2] Stara različica: trk od zadaj pride 20-22 cm pred dotikom, naslon je brez sunka

- Oznaka: `mase-stara-dotik` · področje: Mase, prikolice in različice · zaupanje merilca: high · preverjanje: popravljeno
- Scenarij: Burja 120 v burjo 90 od zadaj in naslon 3 st pri 120 km/h, različica 5 (Stara; enako velja v boksih za vse različice).
- Izmerjeno: Prvi sunek, ko sta pravi škatli še 20-22 cm narazen (krogi segajo 13 cm čez odbijač); naslon: 0 sunkov v 155 korakih, zadeti se ne zasuka (0 st).
- Popravljena meritev (preverjalec): Prvi sunek 23,9 cm pred dotikom škatel; naslon 3° s prečno hitrostjo 1,74 m/s da v Stari 12 sunkov in zasuk 3,2° (ne 0).
- Pričakovano: Dotik, ko se karoseriji dotakneta; naslon prenese nekaj gibalne količine. (vir: Geometrija stika.)
- Ponovitev: node tools/trki/mase-razlicice.js --only razlicice -> vrstici »zadaj 120>90 / Stara« (opomba dotik .. cm prej) in »naslon 3 st 120 / Stara«
- Predlog: Če Stara ostane samo za primerjavo, nič; za bokse razmisli o kCollide tudi tam.
- Dokaz preverjalca: Lasten preizkus (v4.js stara): od zadaj 120>90 pride v Stari prvi sunek pri 23,9 cm reže med pravima škatlama (privzeta različica −3,6 cm, torej po dotiku): potrjeno (njihovo 20–22 cm). »Naslon brez sunka« pa ne velja splošno: naslon 3° pri 120 km/h s prečno hitrostjo 1,74 m/s da v Stari 12 sunkov, B dobi 2,87 m/s prečno in se zasuka 3,2° (privzeta 181 sunkov, 1,8°). Stara mora po odločitvi uporabnika ostati bit za bitom, zato ni za popravek.

### [2] Nova fizika ob ograji drgeta: stik se preklaplja 35–117-krat na sekundo

- Oznaka: `zid-nova-drgetanje` · področje: Ograja in zid · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: BURJA R7 in TITAN, nova fizika, 5–30° pri 60–200 km/h, brez vnosa
- Izmerjeno: 5°/60: 117 preklopov stika na s; 5°/120: 36 ločenih dotikov v 7 s; 15°/120: 23 dotikov, 45 preklopov na s; 30°/200: 50 dotikov. Med 1. in 4. s po trku: razmik do ograje do 1,5 cm, udarci do 0,3 m/s, nihanje nosu pod 1°, stik na 26–50 % korakov. Povratni udarec zadka je večji: popravek lege do 12,9 cm v koraku (TITAN 18,5 cm).
- Pričakovano: Trajen stik (drsenje) brez preklapljanja; iskre in zvok drgnjenja enakomerni. (vir: Mehanika trajnega stika (normalna sila namesto zaporednih sunkov); meritev skripte)
- Ponovitev: node tools/trki/zid.js --del matrika → MATRIKA 1c (stolpci n, utr, pop)
- Predlog: Stik naj drži nekaj korakov (vogal bližje od 2 cm, ki se ne oddaljuje hitreje od ~0,3 m/s, velja kot stik): fxWall in zvok iz zglajenega stika; v novi različici normalna sila ob trajnem stiku namesto sunkov.
- Dokaz preverjalca: Race.step, nova fizika, asfalt do ograje, brez vnosa: 5°/60 117 preklopov stika/s, 5°/120 36 ločenih dotikov in 35/s, 15°/120 15 dotikov in 37/s do zadnjega stika pri 3,34 s (njihova tabela: 14 dotikov, 23/s v oknu 1,48 s), 30°/200 27 dotikov in 37/s; med 1. in 4. s je stik na 23-50 % korakov, reža <= 2,0 cm, udarci <= 0,20 m/s. Spa (trava pred ograjo): 12-29 preklopov/s, reže do 12,5 cm, udarci do 0,36 m/s. Klasična fizika: 0-3 preklopi/s (1 dotik). Posledica: pri namerni vožnji po ograji (R60) nova nabere 67 udarcev s škodo -> 100 % škode, klasična 2 udarca in 8 %.

### [2] Rob nove mape pripne sredino avta brez trenja, zvoka in škode

- Oznaka: `zid-rob-nove-mape` · področje: Ograja in zid · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Track z ročno nastavljenim track.free (rob pri z = 3 m), BURJA R7, 30°/120 km/h, obe fiziki
- Izmerjeno: 119 → 103 km/h (natanko cos 30°), hit 0, škoda 0, brez zasuka od roba; avto ostane pripet na rob do konca meritve (nad 6,8 s). Pripne se sredina, ne vogali, zato pol avta sega čez rob.
- Pričakovano: Viden rob (ograja, nasip) z isto fiziko kot ograje, ali mehko upočasnjevanje pred robom. (vir: Skladnost z ostalimi ograjami igre (sunek wallCollide); meritev skripte)
- Ponovitev: node tools/trki/zid.js --del posebne → vrstici »rob nove mape (track.free)«
- Predlog: Rob mape pelji skozi isti sunek kot ograjo (po vogalih, s trenjem, hitWall in škodo) ali ga postavi kot steno wall2.
- Dokaz preverjalca: Race.step s T.free (nova mapa). 30°/120: 118,6 -> 102,7 km/h (= v*cos 30°), hitWall 0, škoda 0, na robu ostane 3,8 s+, vogal 0,90-0,95 m čez rob; 60°/100: 99,2 -> 49,6 km/h, vogal 2,17 m čez rob; 90°/80: 79,4 -> 0,0 km/h v enem koraku brez škode in brez hitWall, nos 1,97 m čez rob. Koda: trk.free pripne sredino avta in izniči komponento hitrosti navzven, nato se vrne (razen pri trk.wall2).

### [2] Fizična črta je 10–25 cm pred narisanim licem ograje

- Oznaka: `zid-crta-pred-narisano` · področje: Ograja in zid · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Privzeta ograja (js/world.js) in Spa (js/world-spa.js); ocena iz kode risanja
- Izmerjeno: Lice privzete ograje je narisano na bar + 0,25 m (js/world.js:1783), tirnica na Spa na bar + 0,12 m, gume na bar + 0,10 m (js/world-spa.js:271, 278); vogal škatle avta se ustavi na črti bar. Med trkom gre vogal čez črto največ 25,5 cm (čelno 120 km/h) in je popravljen v istem koraku, zato narisan nikoli ni v ograji.
- Pričakovano: Karoserija se dotakne narisanega lica (reža 0–5 cm); v gume se pogrezne. (vir: Branje kode risanja (js/world.js, js/world-spa.js); ni izmerjeno v brskalniku)
- Ponovitev: grep -n "bar\[i\] + 0.25" js/world.js; grep -n "bar + 0.1" js/world-spa.js; node tools/trki/zid.js (stolpca pop in cez)
- Predlog: Ob novi različici poravnaj: črta trka = narisano lice z odmikom po vrsti ograje (gume −0,3 m za pogrezanje), ali lice riši na črti.
- Dokaz preverjalca: Potrjeno samo z branjem kode (v brskalniku nisem meril): privzeta ograja se riše na bar + 0,25 m (js/world.js:1783), Spa na bar + 0,12 (js/world-spa.js:271) in bar + 0,10 m (:278), trk pa je na bar. Avto se torej ustavi 10-25 cm pred narisano ograjo.

### [2] Ulični predmet po edinem udarcu potuje skozi avto in nato skoči iz njega

- Oznaka: `predmeti-skozi-avto` · področje: Predmeti, razbitine, promet · zaupanje merilca: high · preverjanje: popravljeno
- Scenarij: Zadetek v sredino pri 60/120/200 km/h; šteti koraki, ko je točka predmeta znotraj obrisa avta brez stika.
- Izmerjeno: Koraki znotraj avta (1 korak = 1/120 s): hidrant 105/35/14, koš 139/41/17, omarica 108/38/16, sod 140/38/16, nabiralnik 135/41/17, nadstrešek 28/16/16, semafor 15/17/0, svetilka 0. Ko mine 0,6 s, predmet skoči iz avta v enem koraku: nadstrešek 1,58 m pri 60 km/h.
- Popravljena meritev (preverjalec): Koraki središča predmeta v tlorisu avta pri 60/120/200 km/h: hidrant 88/34/14, koš 96/33/13, omarica 56/31/14, sod 118/32/13, nabiralnik 60/31/13, nadstrešek 53/27/12, svetilka 54/27/14 (ne 0); pri 15 km/h 161-219 korakov (1,3-1,8 s). Skok iz avta v enem koraku: nadstrešek 1,08 m pri 60 km/h (merilec 1,58 m) in 1,17 m pri 15 km/h, omarica 1,17 m (60) in 1,25 m (15), hidrant 1,08 m (15); v·dt je 0,03-0,14 m.
- Pričakovano: 0 korakov znotraj obrisa in noben premik v enem koraku nad v·dt (0,14–0,46 m pri 60–200 km/h). (vir: Neprodirnost togih teles; js/core.js propCarHit (izhod brez stika, ko je K.dmg != null in b.hit1 in b.age < 0,6).)
- Ponovitev: node tools/trki/predmeti.js --del predmeti (stolpca not in skok)
- Predlog: Namesto izklopa stika za 0,6 s ohrani izrivanje iz krogov avta brez novega sunka in brez nove izgube (ali daj predmetu hitrost vsaj hitrosti avta, popravek predmeti-let-predmeta). Ne spreminjaj: en udarec in ena vdrtina na predmet.
- Dokaz preverjalca: Pojav je resničen, številke so odvisne od merila. Moje merilo: središče predmeta znotraj tlorisa karoserije (dolžina x širina), Spa, 60/120/200 km/h. Pri 120 in 200 km/h se ujema na 10-25 %, pri 60 km/h ne; svetilka pri merilcu šteje 0, ker je njeno središče 4,5 m visoko, v tlorisu pa gre drog skozi obris avta. Koda potrjena: propCarHit se pri K.dmg != null vrne, dokler je b.hit1 in b.age < 0,6 s.

### [2] Visok drog gre čez črto ograje in se v enem koraku vrne

- Oznaka: `predmeti-drog-cez-ograjo` · področje: Predmeti, razbitine, promet · zaupanje merilca: high · preverjanje: popravljeno
- Scenarij: Drog tik pred ograjo, avto ga zadene pod 20° proti ograji pri 120/200 km/h.
- Izmerjeno: Prenosna svetilka mlamp (5 kg, središče 4,0 m): 5,8/12,4 m čez črto ograje, nato skok nazaj 5,7/12,4 m v enem koraku. Svetilka lamp (110 kg, središče 4,5 m): 2,0/1,8 m čez, skok 2,0/1,5 m. Stožec, guma, bala, sod in odpadli deli: 0,0 m čez.
- Popravljena meritev (preverjalec): mlamp (5 kg): 3,6-3,9 m čez črto ograje pri 120 in 9,6-10,2 m pri 200 km/h, skok nazaj 3,5-3,8 / 9,6-10,1 m v enem koraku (merilec 5,8/12,4 m). lamp (110 kg): 3,0-3,2 / 5,6-6,0 m čez, skok 2,9-3,1 / 5,5-5,9 m (merilec 2,0/1,8 m). Stožec, guma, bala, sod: 0,00 m.
- Pričakovano: 0 m čez črto ograje in noben premik v enem koraku nad v·dt (pri 18 m/s 0,15 m). (vir: js/core.js propStep (ograja deluje samo, ko je b.y − gy < 3,2 m, b.y pa je središče predmeta); zveznost gibanja.)
- Ponovitev: node tools/trki/predmeti.js --del ograja (vrstici mlamp in lamp; stolpca rob in skok)
- Predlog: Preskus ograje po najnižji točki predmeta (noga droga), ne po središču. Ne spreminjaj zadrževanja ostalih predmetov in delov.
- Dokaz preverjalca: Lastna meritev na Spa in Bathurstu potrdi pojav in vzrok v kodi (ograja predmet zadrži samo, če je b.y - gy < 3,2 m, b.y je središče: mlamp 4,0 m, lamp 4,5 m), razdalje pa so drugačne.

### [2] Kolo upočasni avto skoraj kot motor; kolo in pešec dobita premalo hitrosti

- Oznaka: `predmeti-kolesar-pesec` · področje: Predmeti, razbitine, promet · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Promet na ravnem ovalu, zadetek od zadaj v sredino pri 60/120/200 km/h: kolo 90 kg, motor 290 kg, stoječ pešec 75 kg.
- Izmerjeno: Kolo: avto −21,1/−18,1/−16,9 % (pri 60 km/h najnižja hitrost 42,5 km/h = 71 % s kolesarjem vred), kolo dobi 0,5 v, gibalna količina po/pred 0,83–0,87 (13–17 % izgine). Motor 290 kg: −25,2 % (prav po masah). Pešec: avto −8,4/−7,2/−6,7 %, pešec 0,34–0,35 v, avto izgubi 4,2/3,5/3,2-krat več gibalne količine, kot jo pešec dobi.
- Pričakovano: Kolo 90 kg ob 1150 kg: (1+e)·m/(M+m) = 7,3–9,1 % (e 0–0,25), kolo ~1,0–1,25 v, gibalna količina 1,0. Pešec 75 kg: 6,1–8,3 %, pešec ~0,8–1,0 v. (vir: Ohranitev gibalne količine; odprta literatura o rekonstrukciji trkov vozil s pešci (hitrost meta 0,7–1,0 hitrosti vozila); js/core.js Traffic._runBike (min(v, 0,15·v + 1)) in _hitPeds.)
- Ponovitev: node tools/trki/predmeti.js --del promet (vrstice kolo, motor); --del ljudje
- Predlog: V novi različici izguba po masah kot pri _hitVeh, kolo, kolesar in pešec dobijo hitrost iz sunka. Ne spreminjaj: kazni in konca vožnje v neskončnem prometu, učinkov in zvoka.
- Dokaz preverjalca: Brez lastne neodvisne meritve (čas): ponovni zagon predmeti.js da iste vrstice: kolo 90 kg: avto -21,1/-18,1/-16,9 %, najnižja hitrost 42,5 km/h pri 60, kolo 0,5 v, gibalna količina po/pred 0,83-0,87; motor 290 kg -25,2 %; pešec: avto -8,40/-7,19/-6,71 %, pešec 0,34-0,35 v, pA/pP 4,18/3,47/3,20. Pričakovane vrednosti ((1+e)·m/(M+m) = 7,3-9,1 % za kolo) so računsko pravilne. Zaupanje srednje.

### [2] Promet zunaj bega: obris iz krogov pušča vdor do 0,7 m, sunek nosu je vedno največji

- Oznaka: `predmeti-promet-krogi` · področje: Predmeti, razbitine, promet · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Promet na ravnem ovalu: čelno od zadaj, z zamikom 0,6 m in v bok pod 5° in 30° pri 60/120 km/h; primerjava z istim trkom v načinu bega.
- Izmerjeno: Vdor avta v obris: bok avtobusa pod 30° 0,57 m (60) in 0,54 m (120), tovornjak s polprikolico 0,71/0,69 m, avto 1300 kg čelno pri 120 km/h 0,50 m. Sunek nosu (csKc) je 22,9–23° pri čelnem trku pri 120 km/h in enako pri oplazenju avtobusa pod 5° pri 60 km/h (izguba hitrosti le 0,6 %, w 62°/s, smer +14,7°). V begu (obbHit + CRASH) je vdor 0,05–0,12 m.
- Pričakovano: Vdor ≤ 0,05–0,10 m kot v begu. Zasuk sorazmeren s sunkom: oplazenje pod 5° pri 60 km/h (normalna hitrost 1,45 m/s) da po ročici ~40°/s in spremembo smeri nekaj stopinj, ne enakega sunka nosu kot čelni trk pri 120 km/h. (vir: Geometrija (krogi polmera pol širine so na vogalih in med krogi ožji od škatle); vrtilna količina Δw = r·J/I; js/core.js Traffic._hitVeh (csKc obrezan na ±CSK.tapMax) proti Traffic._hitVehP (obbHit).)
- Ponovitev: node tools/trki/predmeti.js --del promet (vrstice bok 5°, bok 30°, zamik 0,6 in vrstice beg)
- Predlog: Promet zunaj bega naj v novi različici uporablja obbHit in pravila CRASH kot v begu (isti obris kot avto–avto), sunek nosu sorazmeren s sunkom. Ne spreminjaj: mase TFK, ohranitev gibalne količine prvega dotika, pravilo, da v neskončnem prometu vsak dotik konča vožnjo.
- Dokaz preverjalca: Brez lastne neodvisne meritve (čas): ponovni zagon predmeti.js da iste vrstice: bok avtobusa pod 30° vdor 0,57 m, sunek nosu 22,9°; oplazenje avtobusa pod 5° pri 60 km/h: izguba 0,6 %, w 62°/s, smer +14,7°, sunek 22,9° (enak kot pri čelnem trku). Zaupanje srednje.

### [2] Zasuk avta ob predmetu ali delu je naključen, ne po strani in ročici zadetka

- Oznaka: `predmeti-nakljucni-zasuk` · področje: Predmeti, razbitine, promet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Zadetek 0,6 m iz sredine pri 60/120/200 km/h; zasuk in sprememba smeri avta.
- Izmerjeno: Koda: propFeel doda c.w += (rand − 0,5)·m·0,012, debrisHit (rand − 0,5)·m·0,05: smer zasuka ni odvisna od strani zadetka. Zadetek 0,6 m iz sredine: lahki predmeti 0–5°/s, težki z enim udarcem 1–6°/s (tudi svetilka 110 kg). Največ v vseh 240 vrsticah: w ≤ 25°/s, smer ≤ 2,3°, premik poti ≤ 0,33 m.
- Pričakovano: Zasuk po ročici, Δw = r·J/I, vedno proti strani zadetka: pri 120 km/h in zamiku 0,6 m stožec ~3°/s, bala 26 kg ~27°/s, prosta svetilka 110 kg ~108°/s. (vir: Ohranitev vrtilne količine (Δw = r × J / I, I = 1443 kg·m²); js/core.js propFeel in debrisHit.)
- Ponovitev: node tools/trki/predmeti.js --del predmeti (zamik 0,6; stolpci w, smer, premik)
- Predlog: Zasuk iz ročice stika z znakom po strani zadetka, brez naključja (tudi ponovljivost posnetkov). Ne spreminjaj: pri lahkih predmetih ostane majhen (stožec ~3°/s), avto zaradi stožca ali bale ne sme z ceste.
- Dokaz preverjalca: Potrjeno z branjem kode (lastne meritve zasuka nisem delal): propFeel doda c.w += (rand() - 0,5)·m·0,012, debrisHit c.w += (rand() - 0,5)·d.m·0,05; predznak je žreb, stran in ročica zadetka v računu ne nastopata.

### [2] Težnost v zraku je 14 m/s² (1,43 g)

- Oznaka: `boksi-teznost-14` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Padec z 0,3 / 1 / 3 m (Car.step) in padec čez rob (Race._fall).
- Izmerjeno: V zraku 0,21 / 0,38 / 0,66 s, hitrost ob dotiku 2,92 / 5,25 / 9,22 m/s; padec čez rob 1,6 s = 16,1 m.
- Pričakovano: Pri g = 9,81: 0,25 / 0,45 / 0,78 s in 2,43 / 4,43 / 7,67 m/s (let 19 % daljši, udarec 16 % šibkejši). (vir: Prosti pad: t = √(2h/g), v = √(2gh))
- Ponovitev: node tools/trki/boksi-pristanek.js --del pristanek → tabela PRISTANEK 1, stolpca »vy m/s« in »real vy«
- Predlog: Za novo različico g = 9,81; JUMP_G je skupna konstanta (skoki, drobci, priklopniki, padec), zato spremembo uvesti skupaj s popravkom vzleta in z novimi referencami.
- Dokaz preverjalca: Koda: JUMP_G = 14 (js/core.js 2092). Lastna meritev (Spa, Bathurst): padec 0,3 / 1 / 3 m traja 0,21 / 0,38 / 0,65-0,66 s (pri 9,81: 0,25 / 0,45 / 0,78 s), hitrost ob dotiku 2,8-3,1 / 5,25-5,39 / 9,1-9,2 m/s (pri 9,81: 2,43 / 4,43 / 7,67).

### [2] »Samo videz« pri formuli ni samo videz: odpadlo krilo vzame aero oprijem

- Oznaka: `boksi-samo-videz-krilo` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Formula, 5 udarcev po 10 % v sprednji desni vogal (applyDamage), škoda Samo videz (dmgMode 1) in Vklop; ravnina.
- Izmerjeno: Odpade 1 del, aeroK 1,40e-4 → 0,70e-4; ovinek pri 200 km/h 3,74 → 3,18 g (-15 %), 100 → 6 s plina 273,2 → 256,5 km/h, pri Samo videz skoraj enako kot pri Vklop (255,3). Rally pri 50 in 100 % škode vozi kot cel (209,4 km/h, 2,38 g).
- Pričakovano: Pri »Samo videz« škoda ne spremeni vožnje; izguba krila sodi pod »Vklop«. (vir: docs/igra.md (Poškodbe avtov: Samo videz, Vklop); js/core.js detachPart)
- Ponovitev: node tools/trki/boksi-pristanek.js --del skoda → tabela SKODA 3, vrstice formula
- Predlog: V detachPart zmanjšaj aeroK samo pri dmgMode 2; nova različica naj aero izgubo veže na Vklop.
- Dokaz preverjalca: Brez lastne vožnje; koda: detachPart (js/core.js 3299) ob odpadlem krilu zmanjša c.aeroK za c.m.aero·df brez pogoja na dmgMode, aeroK pa vstopa v oprijem in pogon (2764, 2775). Ponovni zagon skripte: aeroK 1,40e-4 -> 0,70e-4, ovinek pri 200 km/h 3,74 -> 3,18 g, 273,2 -> 256,5 km/h pri »Samo videz« (255,3 pri »Vklop«).

### [2] Pri »Vklop« škoda vzame le moč motorja; oprijem in smer ostaneta

- Oznaka: `boksi-skoda-vklop-vodljivost` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: medium · preverjanje: potrjeno
- Scenarij: Rally z 0, 50 in 100 % škode v sprednjem desnem vogalu, Vklop, z XR.handle in brez; ravnina.
- Izmerjeno: 100 → 6 s plina: 209,4 / 200,6 / 190,8 km/h (-4 % / -9 %); ovinek pri 120 km/h 2,38 g pri vseh; brez rok 3 s pri 100 km/h: 0,00 m vstran, z xHandle 4,21 m. Avto s 100 % škode zavija kot cel.
- Pričakovano: Udarec v vogal s 50 % škode zamakne geometrijo kolesa (avto vleče, manj oprijema na tej osi); 100 % škode pomeni nevozen avto. (vir: docs/igra.md (Razbijanje · nov način: vodljivost); js/core.js CSK.dmgGrip = 0)
- Ponovitev: node tools/trki/boksi-pristanek.js --del skoda → tabela SKODA 3, vrstice rally
- Predlog: V novi različici pri Vklop: vlečenje volana iz razlike škode vogalov (kot XR.handle) privzeto, oprijem osi × (1 - 0,2 × škoda vogala), nad 90 % samo še počasna vožnja v bokse.
- Dokaz preverjalca: Brez lastne vožnje; koda: CSK.dmgGrip = 0 (js/core.js 1955), zato je dmgG = 1 pri vsaki škodi; moč x (1 - 0,22·dmg) samo pri dmgMode 2 (2746, 2984). Ponovni zagon: 209,4 / 200,6 / 190,8 km/h po 6 s plina, ovinek 2,38 g pri 0, 50 in 100 % škode, vlečenje 4,21 m samo z možnostjo xHandle (privzeto izklop).

### [2] V boksni stezi ni trka med avti: avti so duhovi, stari trk tam ne teče

- Oznaka: `boksi-steza-duhovi` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Dirka 13 avtov na Spa (300 s) in Bathurstu (150 s), vsi poslani v bokse 5 s po štartu (Race.step).
- Izmerjeno: Spa: 14.540 avto-korakov v stezi, največ 4 hkrati, 0 korakov, ko bi tekel stari trk (inPit brez pitG), 0 trkov; škatle duhov se prekrivajo v 247 korakih do 3,02 m, duh in trden avto ob uvozu v 1.241 korakih do 1,87 m. Bathurst: 0 trkov, prekrivanje do 2,65 m.
- Pričakovano: docs/igra.md: »v boksni stezi trki ostanejo kot pri Stari«; v resnici se avta ne moreta prekrivati (pri 80 km/h bi stari trk dal sunek nosu 23° obema, Simulacija 2-3°). (vir: docs/igra.md (Trki med avti); js/core.js Race.pitStep (pitG))
- Ponovitev: node tools/trki/boksi-pristanek.js --del boksi → tabela BOKSI 1 (BOKSI 2 za primerjavo starega trka in Simulacije)
- Predlog: Nova različica naj boksov ne spreminja (duhovi ostanejo, da se steza ne zamaši); popravi opis v docs/igra.md. Za več realizma raje vrsta in čakanje AI kot fizika trka; veja inPit v carCollide je za pare avtov mrtva koda.
- Dokaz preverjalca: Brez lastne meritve; koda: zanka parov v Race._step (js/core.js ~7123) izpusti avte s pitG. Ponovni zagon: Spa 14.540 avto-korakov v stezi, 0 trkov, prekrivanje duh-duh 247 korakov do 3,02 m, duh-avto 1.241 korakov do 1,87 m; Bathurst 0 trkov, do 2,65 m.

### [2] Boksni zid avta ne poškoduje, AI vanj trči do 57 km/h

- Oznaka: `boksi-zid-brez-skode` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Rally pri 80 km/h v boksni zid in zunanji rob steze pod 15°, 30° in 90° (Race.step, Spa in Bathurst), primerjava z ograjo proge; dirka z vsemi avti v boksih.
- Izmerjeno: Pod 30°: udarec 11,1 m/s, škoda 0,0 % (ograja proge 23,8 %); pravokotno 22,2 m/s: 0,0 %; odboj enak ograji. V dirki 3 udarci AI ob mejo steze, najmočnejši 15,9 m/s, brez škode.
- Pričakovano: Enak udarec, enaka škoda: (11,1 - 2,5) × 2,8 % = 24 %. (vir: js/core.js wallCollide in applyDamage (c.pitG))
- Ponovitev: node tools/trki/boksi-pristanek.js --del boksi → tabela BOKSI 3 in stolpec »zid v stezi« v BOKSI 1
- Predlog: Škodo ob zidu upoštevaj tudi v stezi (pitG naj izklopi le trke med avti), prej pa umiri AI ob uvozu (15,9 m/s).
- Dokaz preverjalca: Brez lastne meritve; koda: applyDamage se vrne, ko je c.pitG (js/core.js 3164). Ponovni zagon: boksni zid pod 30°, udarec 11,1 m/s: škoda 0,0 % (ograja proge 23,8 %); pravokotno 22,2 m/s: 0,0 %; v dirki 3 udarci AI v mejo steze, najmočnejši 15,9 m/s, škoda 0.

### [2] Volan, držan proti ograji: v klasični fiziki avto zavije z nosom v zid in obstane, v novi drsi naprej

- Oznaka: `v-zid-volan-v-ograjo-obstane` · področje: najdba preverjalca (zid) · zaupanje merilca: low · preverjanje: najdba preverjalca
- Scenarij: rally, asfalt do ograje, dotik 5° pri 60 in 120 km/h, poln plin, volan ves čas proti ograji, Race.step, 5 s; klasična in nova fizika.
- Izmerjeno: Klasična, 60 km/h: 63 -> 43 km/h (1 s) -> 0 (2 s), nos 64° v zid pri 2 s, pot 21 m v 4 s, stik vseh 5 s, najmočnejši udarec po prvem 0,28 m/s, škoda 3 %; pod polnim plinom ostane na 0 km/h. 120 km/h: 118 -> 90 (2 s) -> 0 (4 s), nos 36° pri 2 s, pot 87 m. Nova: 60 -> 60/57/56 km/h pri 1/2/4 s, nos 2,9°; 120 -> 119/114/104 km/h, nos 2,4°. Kandidat: en avto, ena cesta, pričakovanje je moja presoja.
- Pričakovano: Iz oplazenja pri 5° se nos brez udarca ne zasuka 64° v tog zid; avto drsi ob zidu in izgublja hitrost s trenjem (mu 0,15-0,4). Fiziki ne smeta dati tako različnega izida (ustavitev proti -7 %); opomba 9e: zid avta ne zagrabi. (vir: Reference naloge (mu 0,15-0,4, opomba 9e); js/core.js 3747-3822 (wallYaw 0,3: zid nosu skoraj ne zavrti stran) in zakon poti stepCS 2790-2891.)
- Ponovitev: node tools/trki/preverjanje/zid/p13.js (vrstice 'vanj'; izpis v tools/trki/preverjanje/zid/p13.txt)
- Predlog: V novi različici naj stik z ograjo omeji zasuk nosu vanjo (poln delež zasuka, ko se dotikata dva vogala, ali omejitev kota proti ograji med stikom), klasična in nova fizika naj dasta podoben izid; test: 5°/60 z volanom v ograjo po 2 s ne sme stati.

### [2] Na pravih progah avto čez greben poleti; zatik »vzlet in pristanek v istem koraku« ostane le na redkih blagih grebenih (Medvode: -8,8 km/h pri 206 km/h)

- Oznaka: `v-ostalo-greben-ostanek` · področje: najdba preverjalca (ostalo) · zaupanje merilca: medium · preverjanje: najdba preverjalca
- Scenarij: Prave proge (Ouninpohja, Nordschleife, Medvode, Harju, Bâlea, Tianmen, Spa, Bathurst), rally, cs, samovoznik igre, Race.step, 150 s na progo; šteti koraki, v katerih avto vzleti in pristane v istem koraku, in koraki v zraku.
- Izmerjeno: Ouninpohja: 25 letov, 1411 korakov v zraku (11,8 s od 150 s), najdaljši 1,07 s; 18 korakov z vzletom in pristankom v istem koraku, skupaj -2,3 km/h. Nordschleife: 2 leta (45 korakov, do 0,36 s), 1 tak korak. Medvode: en dogodek pri s 2253 m in 206 km/h: 8 takih korakov v ~0,07 s, -8,8 km/h (do 1,1 % na korak), 1 korak v zraku. Harju, Bâlea, Tianmen, Spa, Bathurst: 0 dogodkov.
- Pričakovano: Nad pragom vzleta let po paraboli, pod njim nobene izgube: 0 korakov z vzletom in pristankom v istem koraku. (vir: Lastna meritev (greben.js); koda: Track.elevAt (js/core.js 884-892) višino med vzorci interpolira linearno, naklon in ukrivljenost zvezno, zato se vzlet na pravi progi obdrži v prvem delu odseka med vzorcema, v drugem delu pa avto pristane v istem koraku.)
- Ponovitev: node tools/trki/preverjanje/ostalo/greben.js ouninpohja,nring,medvode,harju,balea,tianmen,spa,bathurst rally cs 150
- Predlog: Pristanka v koraku vzleta ne kaznuj (izguba hitrosti samo, če je bil avto v zraku vsaj 2-3 korake ali je hitrost glede na cesto ob dotiku nad ~1 m/s); prag vzleta in padanje naj uporabljata isto težnost.

### [1] Kaskaderska in Mehka množita zasuk (1,5 in 0,6): vrtilna količina se ne ohrani, Kaskaderska doda energijo

- Oznaka: `mase-kaskaderska-energija` · področje: Mase, prikolice in različice · zaupanje merilca: high · preverjanje: popravljeno
- Scenarij: 8 scenarijev ohranitve, nova fizika in cs.
- Izmerjeno: Nova: Mehka manjka 40 % zasuka, Kaskaderska ga da 50 % preveč in v enem koraku doda do 0,40 % energije (+5,2 kJ); cs Kaskaderska do 0,47 % (+3,0 kJ).
- Popravljena meritev (preverjalec): cs Kaskaderska: do +55,3 kJ (8,7 %) v enem klicu pri T-trku 120 km/h v zadnjo os stoječega; prednja os +3,0 kJ (0,47 %).
- Pričakovano: Zasuk = r x P / I, energija se pri trku ne poveča. (vir: Zakon o ohranitvi vrtilne količine in energije.)
- Ponovitev: node tools/trki/mase-razlicice.js --only ohranitev
- Predlog: Pri novi različici trka naj bo yaw 1; slog (mehko, kaskadersko) naj nastavljata odboj in oprijem po trku.
- Dokaz preverjalca: Lasten preizkus (v4.js stunt), klasična fizika: T 120 v prednjo os stoječega da v Kaskaderski +2,97 kJ (0,47 %): potrjeno. Njihovih 8 scenarijev pa nima zadetka v zadnjo os: tam en klic doda +55,3 kJ (8,7 % od 638 kJ), 1070 °/s, zasuk 534° (Simulacija isti trk +12,9 kJ, 2,0 %; Mehka +0,3 kJ). Množilnik zasuka je namerna lastnost različice.

### [1] Parkirna ura in prometni znak se po padcu ne umirita

- Oznaka: `predmeti-tresenje` · področje: Predmeti, razbitine, promet · zaupanje merilca: high · preverjanje: potrjeno
- Scenarij: Zadetek v sredino pri 60/120/200 km/h, opazovanje 8 s (sonda do 20 s).
- Izmerjeno: meter (14 kg) in rssign (14 kg) se v 8 s ne umirita pri nobeni hitrosti: trzanje 0,14–0,27 m/s in 0,1–0,3 rad/s do prisilnega spanja pri 20 s. Ostale vrste mirujejo po 1,1–7,0 s.
- Pričakovano: Mirovanje v 2–4 s kot pri ostalih predmetih, brez vidnega tresenja; budni predmeti stanejo korak (20 s namesto 4 s). (vir: js/core.js propStep (spanje po 0,35 s mirovanja ali pri starosti > 20 s).)
- Ponovitev: node tools/trki/predmeti.js --del predmeti (vrstici meter in rssign, stolpec mir)
- Predlog: Dušenje kotne hitrosti na tleh ali višji prag mirovanja za tanke dolge predmete (spanje pri v < 0,3 m/s in w < 0,4 rad/s). Ne spreminjaj spanja ostalih vrst.
- Dokaz preverjalca: Lastna meritev (Spa, 60 in 120 km/h, 24 s): meter 14 kg in rssign 14 kg se 8-12 s po zadetku še gibljeta (meter do 0,25-0,26 m/s in 0,34-0,36 rad/s, rssign 0,30 m/s in 0,13-0,16 rad/s) in zaspita šele po 20,0 s (prisilno); hidrant, sod in znak mirujejo po 2,5-4,0 s.

### [5] Čez greben avto ne poleti: vzlet in pristanek v istem koraku, hitrost se drgne vsak korak

- Oznaka: `boksi-greben-brez-leta` · področje: Boksi, pristanek, prevračanje, zanka dirke, splet · zaupanje merilca: high · preverjanje: OVRŽENO
- Scenarij: Rally čez lok s polmerom 60 m med klancema ±15 % pri 90-200 km/h in čez kratek greben R 15 m, ±5 % (Car.step na ravnini z višinami, plin drži hitrost); isto na pravih višinah Bathursta (Race.step, raven greben pri s 974 m).
- Izmerjeno: Pogoj vzleta (v²/R > 11,9 m/s²) velja nad 96 km/h, a avto ni v zraku niti en korak: 39-48 korakov z vzletom in pristankom v istem koraku. Na padajočem delu vsak tak korak vzame do 13 % hitrosti: 120 → 96 km/h, 160 → 101, 200 → 99 km/h, največji pojemek 6,7 / 14,7 / 22,2 g v 0,1 s, škoda 0. R 15 m: 150 → 147 km/h, 0 korakov v zraku. Bathurst: 27 takih korakov, 0 v zraku, -26,2 km/h. Vzrok: višina avta zaostaja en korak za višino ceste (y - cesta = dt²·(ukrivljenost·v²/2 - 14) < 0); prag vzleta je 0,85 × 14, padanje pa 14 m/s².
- Pričakovano: Nad v²/R > g (87 km/h pri R 60 m) avto zapusti cesto in leti po paraboli: do višine vzleta 2·0,15·v/g = 0,85 s pri 100 km/h, 1,36 s pri 160, 1,70 s pri 200 km/h (24-94 m); vodoravna hitrost se v zraku skoraj ne spremeni. (vir: Newtonovi zakoni: poševni met, pogoj odlepitve v²/R > g)
- Ponovitev: node tools/trki/boksi-pristanek.js --del pristanek → tabela PRISTANEK 3 in vrstici »preverjeno na pravih visinah«
- Predlog: V Car.stepCS / stepNova ob vzletu postavi y na višino ceste trenutnega mesta in vy iz nagiba prejšnjega koraka (ali pristanek dovoli šele, ko je airT > 0); prag vzleta in težnost naj bosta ista vrednost; izguba ob pristanku iz hitrosti glede na cesto. Ni del trka avto-avto (KV): uvesti za zastavico nove različice ali kot ločen popravek z novimi golden referencami.
- Dokaz preverjalca: Artefakt merilne ploskve. landRig/grebenZ v tools/trki/boksi-pristanek.js uporablja gladko analitično višino (elevAt vrne y = -u²/2R); samo na njej velja y - cesta = dt²(k·v²/2 - 14) < 0 in avto pristane v koraku vzleta. Prava proga (Track.elevAt, js/core.js 884-892) ima višino med vzorci linearno interpolirano, naklon pa zvezno, zato avto po vzletu ostane v zraku. Lastna meritev s samovoznikom igre (rally, cs, Race.step, 150 s na progo): Ouninpohja 25 letov, 1411 korakov v zraku (11,8 s), najdaljši 1,07 s; vzlet in pristanek v istem koraku le 18-krat, skupaj -2,3 km/h; Nordschleife 2 leta (do 0,36 s); Spa, Bathurst, Harju, Bâlea, Tianmen 0 dogodkov. Merilčev »Bathurst: 27 korakov, -26,2 km/h« je izmerjen pri 503 km/h (Spa pri 789 km/h). Številke 120 -> 96, 160 -> 101, 200 -> 99 km/h in 6,7-22,2 g v igri ne nastopijo. Resničen ostanek je majhen: Medvode, s 2253 m, 206 km/h: 8 takih korakov, -8,8 km/h (v-ostalo-greben-ostanek, občutek 2). Kar skoke v igri res kazni, je pristanek (v-ostalo-pristanek-skok).

### [3] Strelec po trdem trku vozi naravnost naprej in je v 1–3 s spet pri polni hitrosti

- Oznaka: `avto-po-trku-takoj-naprej` · področje: Avto ob avto (enaki masi) · zaupanje merilca: low · preverjanje: OVRŽENO
- Scenarij: tbone-120-stand-rear, tbone-120-cross-*, rear-60/120-stand-c s plinom, ki drži hitrost; klasična fizika
- Izmerjeno: Bočni trk s 120 km/h v zadnjo os stoječega: A najmanj 67 km/h, zasuk −1,5°, pri 114 km/h (95 %) po 1,43 s. V prečkajočega: 1,0–1,7 s (najmanj 56–81 km/h). Od zadaj v stoječega: 53 km/h, nazaj po 3,2 s (pri 60 km/h po 1,4 s). Škoda ob tem 0,48–0,63; na merilni ravnini brez vpliva na motor (v dirki s polno škodo moč −22 %·škoda).
- Pričakovano: Sprememba hitrosti 40–65 km/h v enem sunku (10–15 g) avto vsaj za trenutek ustavi kot vozilo: brez pogona in oprijema 1–2 s, vrnitev na hitrost občutno počasnejša kot pri čistem pospeševanju. (vir: docs/igra.md, razdelek »Trki med avti«; js/core.js stepCS (moč motorja 1 − 0,22·škoda samo pri polni škodi), kTake (sunek vzdolž nosu gre samo v hitrost))
- Ponovitev: node tools/trki/avto-avto.js --only tbone-120 (tabela »speeds, energy, momentum«, stolpca »hold: back at 95 %« in »hold: lowest«)
- Predlog: Po sunku z Δv nad ~8 m/s vzdolž nosu kratek izpad pogona (0,5–1,5 s po velikosti sunka) in delna izguba oprijema strelca (xgl 0,3–0,5), da avto zaniha. Ne sme se spremeniti: dirkaški sunek od zadaj (Δv 17 km/h: nazaj v 0,6 s, brez zasuka) in pravila škode.
- Dokaz preverjalca: Številke se ponovijo (od zadaj 120 v stoječega: najmanj 53 km/h, 95 % po 3,26 s; 60 km/h: 27 km/h, 1,40 s), napačno je pričakovanje. Izguba pogona in oprijema za 1–2 s ni fizika trka, ampak poškodbe; te so po odločitvi uporabnika privzeto »Samo videz«, velja pa tudi omilitev »avto ostane vozen«. Vrnitev je že zdaj počasnejša od čistega pospeševanja: prost avto 53 → 114 km/h v 1,56 s, po trku od zadaj 3,26 s (2,1-krat); po T-trku 67 → 114 v 1,43 s proti 1,22 s. Sredinski zadetek strelca tudi po togi mehaniki ne zasuka (ročica 0). To je vprašanje modela poškodb, ne odstopanje trka avto-avto.

## Popis stikov

### Avto ob avto (enaki masi)

| Stik | Kje v kodi | Kako deluje zdaj |
|---|---|---|
| Vstop in izbira modela trka | Race._step → carCollide(a, b) → kCollide(a, b, KC); stari model v carCollide; KV, kvMake, setTest({ cv }) | Race._step po koraku vseh avtov (Car.step) pokliče carCollide za vsak par, nato bokse in wallCollide. Privzeto (Simulacija) gre par v kCollide; v boksih in pri različici Stara (cv 5) velja stari model s tremi krogi na avto (odboj 0,1, kotni členi × 0,6). Vrstni red para ne vpliva: carCollide(A, B) in carCollide(B, A) dasta isto (61,8 / 17,9 km/h, 249,6°). Stari model pri zamiku pol širine spusti avta drug ob drugem mimo (čelno 120 km/h: oba naprej z 68 km/h, zasuk 17°). |
| Oblika stika: škatli z zaobljenimi vogali | obbHit, rboxHit, rbCore (RB_R 0,3 m, RB_EPS 0,05 m) | Najprej doseg in prave škatle (obbHit), nato škatli z zaobljenimi vogali: normala iz najbližjih parov, prijemališče na sredini dela ploskev, ki se dotikata. Ko se prekrijeta tudi jedri (prvo prekrivanje nad 0,6 m: mogoče pri zbliževanju nad ~260 km/h), je normala os najmanjšega prekrivanja, prijemališče pa vogal ali sredina ploskve enega avta: pri čelnem zamiku ima en avto ročico 0,9 m, drugi 0. Vogal ob vogal brez dotika zaobljenih robov: samo razmik, brez sunka. |
| Razmik prekritih karoserij | kCollide: corr (RB_SLOP 0,02 m, RB_PUSH 0,4, RB_DEEP 0,2 m) | Prekrivanje se odvzame mehko: 40 % ostanka na korak, vse nad 20 cm takoj, po obratnih masah. Največje prekrivanje je pot zbliževanja v enem koraku 1/120 s: do 26 cm pri 120 km/h zbliževanja, do 53 cm pri 240 km/h, do 86 cm pri 400 km/h. Največji premik v enem klicu je 7,5 cm (do 240 km/h zbliževanja) in 33 cm pri 400 km/h; v mirovanju ostane 2 cm brez tresenja. |
| Sunek: normala z odbojem in drgnjenje | kCollide: e iz K.e0 0,3, K.e1 0,12, K.eV 4, K.eT 0,5; J; Jt z K.mu 0,35, K.muL 0,4 | J = (1 + e)·vn / (1/ma + 1/mb + rna²/Ia + rnb²/Ib); odboj e pada od 0,30 pri počasnem na 0,12 pri hitrem trku (0 pod 0,5 m/s); drgnjenje po Coulombu največ 0,35·J (naslonjen avto 0,14·J). Gibalna količina para se v klicu ohrani na 0,00 % v vseh vrsticah (cs in nova). Sredinski trki se ujemajo s teorijo: 120 km/h v stoječega 53 / 67 km/h, izguba energije 49 %; čelno 120 + 120 km/h odboj 14 km/h, izguba 99 %. |
| Delež avta v klasični fiziki | kTake; stepCS (cSx, cSz, csKc); RB_TAPT, RB_TAP0, RB_TAP1, CSK.tapMax, KG_V0, KG_V1, K.aH, K.aS, K.glT, K.wI | Sunek vzdolž nosu gre takoj v hitrost; prečni del se hrani v cSx / cSz in ga stepCS zdrgne s polnim oprijemom (17 m/s v 0,78 s, okoli 2,2 g), smer vožnje se ne obrne. Vrtilni del ni kotna hitrost, ampak zamik nosu csKc (dw × 0,0055·V sekund, največ ±23°, razpad 0,25 s). Kotno hitrost dobi avto le ob izgubi oprijema xgl: ko je zadek potisnjen prečno bolj kot nos in čez 10 % hitrosti, in samo če je hitrost po sunku nad 4 m/s (polno nad 10 m/s); oprijem se vrne v 0,6 s. |
| Zdrs in vrtenje po izgubi oprijema | stepCS, veja xgl > 0: CRASH.slide 0,9 g, CRASH.yawT 0,8 s, CRASH.yawC 1,2 rad/s² | Z xgl avto drsi z 0,9 g·xgl in se vrti s kotno hitrostjo prvega sunka, ki razpada s časovno konstanto 0,8 s; zgornje meje ni (izmerjeno do 1934 °/s). Poznejši sunki vrtenja ne zavirajo, ker se kotna hitrost prišteje le, ko xgl zraste za več kot 0,1: bočni trk v zadnjo os pri 120 km/h vzame 660 °/s, vsota togih navorov vseh sunkov je 387 °/s. Zadeti se zavrti 250° in obstane po 0,9 s in 5,2 m. |
| Delež avta v novi fiziki | kTake (veja c.phys === 'nova'); Car.stepNova: this.w = clamp(this.w, −K.rMax, K.rMax), NVK.rMax 3,2 rad/s | Nova fizika vzame cel tog sunek (hitrost in kotno hitrost), naprej delajo pnevmatike. Korak fizike pa kotno hitrost vsakič omeji na 183 °/s in pnevmatike jo zadušijo v ~0,1 s: 660 °/s po bočnem trku pade na 310 °/s v enem koraku in na 13 °/s v 0,1 s. Največji zasuk v matriki je 80°, pri zadetku v zadnjo os 15°; energija para v sunkih nikoli ne zraste. |
| Naslanjanje in drgnjenje bok ob boku | kCollide (e = 0 pod K.eT, mu·muL), kTake (csKc), carKnockFx (iskre fxCar) | Naslonjen avto dobiva vrsto majhnih sunkov brez odboja (26–80 na sekundo z Δv nad 0,1 m/s). Hitrosti se ne zlepita: pri 3° in 20 km/h razlike gre A mimo v 1,1 s in hitrosti 120 / 100 km/h ostaneta; pri 10° A s trenjem povleče B s 100 na 121 km/h. Premik na klic je do 2,5 cm, menjav predznaka normalne hitrosti do 5: tresenja ni. Pasivni B se zasuka 4–8° in pri 120–200 km/h ne izgubi oprijema. |
| Dotik vogala v bok in sunek od zadaj | kCollide, kTake (ar, af, K.glP, K.glA, K.glR) | Sunek v zadnji bok potisne zadek bolj kot nos in lahko vzame oprijem, v sprednji bok nikoli (zasuk 2–12°). Pri 2 m/s je zasuk 3–5° pri vseh hitrostih; pri 60 km/h da 4 m/s −104° in 8 m/s −39°, pri 120 km/h −11° in −22°, pri 200 km/h −8° in −17° brez izgube oprijema. Sunek od zadaj s 30 km/h razlike: sredinsko 103 / 107 km/h brez zasuka, z zamikom oba −5° in 105 km/h. |
| Vloge in različice | KV (sim, arc, soft, stunt), K.pm, K.yawP, K.glP, K.glA, K.glR; kCollide (fa, fb) | V Simulaciji sta igralec v tekmeca in tekmec v igralca enaka do zadnje številke; med tekmecema je izguba oprijema polovična (glR 0,5): dotik pri 120 km/h in 8 m/s −14° namesto −22°, pri bočnem trku pa xgl 0,5 in zasuk 287° (več kot 250°). Arkada šteje igralca za 1,7-krat težjega, zato se gibalna količina para v sunkih ne ohrani (napaka 7–29 %, namenoma). Mehka in Kaskaderska sta jo v preverjenih vrsticah ohranili (0,00 %). |
| Posledice trka: škoda in odpadli deli | carKnockFx (knock: (imp − 3,5)·0,016; puncture; grudgeHit); Race: odpadli deli na cesti | Škoda raste z zapiralno hitrostjo nad 3,5 m/s: 120 km/h v stoječega 0,48, čelno 120 + 120 km/h 1,00. V dirki s škodo po trku pri 120 km/h odpade 5–6 delov, ki ostanejo na cesti in spremenijo potek po trku: zasuk zadetega na progi Spa 102° namesto 223°. Brez škode je dirka na progi (Race.step) enaka ravnini do 0,2 km/h. |
| Avto prijatelja v spletni dirki | kCollide in carCollide: veje a.net, b.net | Avto prijatelja se pri trku ne premakne (premika ga njegov telefon): lokalni avto prevzame ves razmik in samo svoj delež sunka. Ni merjeno, ker potrebuje dva odjemalca. |

### Mase, prikolice in različice

| Stik | Kje v kodi | Kako deluje zdaj |
|---|---|---|
| Avto v avto, različice 1-4 (Simulacija, Arkadna, Mehka, Kaskaderska) | carCollide -> kCollide (rboxHit, kTake, carKnockFx); tabela KV, Core.setTest({cv}) | Škatli z zaobljenimi vogali (RB_R 0,3 m), mehak razmik corr = max(0,pen-0,02)*0,4 + max(0,pen-0,2), razdeljen po obratni masi. En sunek J=(1+e)vn/(1/ma+1/mb+rn^2/I) s trenjem mu 0,35; e = 0 pod 0,5 m/s, sicer pada od e0 0,3 proti e1 0,12 (eV 4 m/s). Izmerjeno: e 0,15 pri 30 km/h in 0,12 pri 240 km/h približevanja, trd trk je 1 sunek v 1-4 korakih, prekrivanje po trku do 11 cm (vlačilca do 13 cm). |
| Avto v avto, stari trk (različica 5 Stara; v boksih za vse različice) | carCollide, stara veja (krogi, obbHit, csKc; CSK.carE, tapT, tapMax) | Trije krogi na avto (pri +-0,3 dolžine, polmer širina/2 + 0,02), e = 0,1 (nova 0,4), kotni členi x 0,6, zasuk samo kot sunek drže (tapMax 0,4 rad); vogali se le razmaknejo brez sunka. Izmerjeno: trk od zadaj pride 20-22 cm, preden se odbijača dotakneta; naslon 3 st: 0 sunkov v 155 korakih; sunek v zadnji vogal zasuka oba le 7-8 st. |
| Teža v trku: masa, gorivo, igralčev faktor pm | kCollide: ma = (m.mass + fuelKg) * fa, fa = pm samo za igralca proti tekmecu ali varnostnemu avtu; fuelTank; KV.pm, TX.cPm | Spremembi hitrosti sta natanko v obratnem razmerju mas (burja 1150 v kamen 7000: 30,14 : 4,95 km/h = 6,087 = mB/mA); poln rezervoar (10-280 kg) se šteje (6,017 = 6,017; formula s 105 kg: 0,884). pm je 1 povsod razen v Arkadni (1,7): tam igralec dobi 0,588 svojega deleža. |
| Vztrajnostni moment | Car.I = mass * kI^2 (model.kI); v trku Ia = I * ma / mass; prikolica tlMake: m (L^2 + W^2) / 12 | 56 vozil, 165-7000 kg: kI/L 0,242-0,300 (najmanj merjasec 0,242, orel 0,247, formula 0,250; največ goljat 0,300), to je 0,78-0,94 vrednosti polne škatle. Prikolica 12 t: I 160.010 kg m2, k/L 0,294 (natanko škatla). Realistično območje je k = 0,25-0,31 L. |
| Prevzem sunka, klasična fizika (cs) | kTake (veja cs), stepCS (cSx/cSz, cSr, csKc, xgl, xglT); CRASH.yawT, SL_T | Hitrost dobi cel sunek P/m; prečni del se hrani v cSx/cSz in ga gume zbrišejo z min(aL, sm/(clamp(0,006 v; 0,04; 0,25) slT)): izmerjeno 2,36 g pri burji. Zasuk (r x P)/I ne gre v w, ampak v sunek drže csKc; v w gre le ob izgubi oprijema (xgl), ta pa nastane samo, če je zadnja os potisnjena bolj kot prednja (aH 0,1, aS 0,06, nad 4-10 m/s, traja 0,6 s). Zadetek v prednji del zato avta skoraj ne zasuka. |
| Prevzem sunka, nova fizika (nova) | kTake (veja nova), Car.stepNova (vrstici 3072-3074: clamp w na NVK.rMax; veja !fwd s CSK.tR) | Hitrost in vrtenje dobita cel sunek (x KV.yaw, igralec x yawP), vrtilna količina se pri Simulaciji ohrani (manjka 0 %). Nato stepNova vsak korak odreže w na +-3,2 rad/s (183 st/s), pri avtu, ki ne pelje naprej (stoji, drsi bočno), pa w ugasne s časovno konstanto 0,03 s. Izmerjeno: 11,62 -> 3,20 rad/s v enem koraku, potem -27 % na korak. |
| Avto v prikolico, prikolica v avto, prikolica v prikolico | Race._tlStep: carCollide(R, o), wallCollide(R), tlJoin (4 x tlPin), tlHoldSet/It/End, tlFold, tlSnap; Car.tl, tl.next; TLK | Prikolica je lastno telo (12 t, cestni vlak 2 x 11 t; isPlayer po vlačilcu) in trči z istim carCollide; potem tlJoin spet spne zglob. Klasičnemu vlačilcu gume držijo stranski poteg zgloba do TLK.hold 1,45 g, več pomeni xgl. Izmerjeno: avto 120 v rep prikolice (60): e 0,09, 1 sunek, avto 121 -> 59 km/h; avto 100 v sredino boka: 101 -> -2 km/h, vlačilec xgl 1,00, a le 2 st in pregib 1 st. |
| Vlačilec zadet med vleko | carCollide(vlačilec, avto) + tlJoin/tlPin; tlHold (cs) | Trk vidi samo vlačilec (5,3 t; vlak 7 t); gibalna količina prikolice pride čez zglob v ~0,1 s (e po 1. koraku -0,02 do -0,66, pri +0,1 s 0). Končna skupna hitrost je pravilna (avto 80 celno v vlačilec 80: -70 km/h, teorija -69,9). cs ostane skoraj tog (udarec v bok kabine: 10 st, pregib 4 st), nova se zlomi (33 st, pregib 32 st). |
| Varnostni avto | Race.step: carCollide(SC, c), wallCollide(SC); kTake: c.sc -> brez izgube oprijema | Trči kot avto z maso modela, a nikoli ne izgubi oprijema (xgl 0,00: sunek v zadnji vogal ga zasuka 16 st, tekmeca 23 st). Ni v race.cars, zato s prikolicami ne trči (prebrano v kodi, ni izmerjeno). V Arkadni velja igralčev pm tudi proti njemu (107 : 182 km/h). |
| Prijateljev avto na spletu (net) | kCollide: kTake samo za avto brez c.net; ves razmik lokalnemu avtu | Net avto ne dobi ničesar, lokalni avto vzame svoj delež vsak korak znova, dokler nima hitrosti net avta. Izmerjeno: celno 120+120 lokalni -240,5 km/h (proti tekmecu -135,0), T v stoječega -120,6 (-67,8), od zadaj -30,8 (-17,5). |
| Škoda ob trku | carKnockFx: knock(c, (imp - 3,5) * 0,016 * knockK), applyDamage, puncture | Oba avta dobita škodo iz iste hitrosti približevanja imp (nad 3,5 m/s), pomnožene z modelovim knockK; masa in lastna sprememba hitrosti ne štejeta. Izmerjeno pri 120 km/h: tovornjak 0,26 in lahki avto 0,47-0,61, ne glede na to, kdo zadene; celno pri 240 km/h približevanja 0,55 proti 1,00. |
| Razbitine po trku | stepDebris, debrisHit (DEB_RUN k 0,002, kMax 0,025) | Kos, ki leži, vzame avtu delež hitrosti k = min(0,025; masa kosa x 0,002), ne glede na maso vozila. V dirki v Spa je po čelnem trku na progi 12 kosov; tovornjak 7 t je v koraku trka izgubil 22,8 km/h namesto 19,9 km/h, ki jih da sam trk. |

### Ograja in zid

| Stik | Kje v kodi | Kako deluje zdaj |
|---|---|---|
| Avto ob črto ograje ob progi (tirnica, betonski zid, gume, mreža, lesena ograja: vse ista črta q.bl / q.br) | js/core.js: wallCollide(c, trk, canFall) ~3740–3815; številke CSK.wallE 0.05, wallMu 0.25, wallYaw 0.3 (~1987; NVK: »the walls as in cs«); črta: Track._buildEdges ~940–1002 (def.side, def.edgeBar, def.walls); klic v Race._step ~7129 (za carCollide in pitStep) | Za vsak od 4 vogalov škatle (±len/2, ±wid/2) po vrsti: če je čez črto, avto premakne nazaj za globino; če se vogal črti približuje, normalni sunek J = −(1+0,05)·vn / (1/m + rn²/I·0,3), zasuk rn·J/I·0,3 in trenje vzdolž ograje, omejeno na ±0,25·J. Iste tri številke za vse vrste ograj, obe fiziki in vse različice --cv. Vrsta ograje je samo risba (js/world.js: type 0 tirnica / 1 beton / 2 gume, lice na bar + 0,25 m; js/world-spa.js: bar + 0,10–0,12 m). Izmerjeno 15°/120 km/h: 111 km/h po 1. koraku, 106 ob odhodu, trenje 0,25, čisti odboj 0,02. |
| Posledice udarca v ograjo: škoda, guma, prevračanje, zvok, iskre | js/core.js: knock() ~3149, applyDamage ~3160–3200, puncture() ~3818, xRollStart (XR.roll, XROLL ~2100–2175); js/game.js ~3291–3322 (Sfx.crash, tresenje); js/render.js (fxWall) | hit = največja hitrost vogala proti ograji v koraku (c.hitWall, vsak korak pobrisan). hit > 2,5 m/s: škoda (hit − 2,5)·0,028·knockK (15°/120 → 19 %, 30°/120 → 45 %, 90°/60 → 41 %, 90°/120 → 96 %; MRAVLJA 90°/60 70 %, TITAN 24 %). hit ≥ 11 m/s in vklopljene okvare: predrtje z verjetnostjo min(0,25, (hit − 11)/20). Bočni udarec > 10 m/s z vklopljenim prevračanjem: prevrnitev z verjetnostjo 0,1. Zvok pri hit > 1,5 (največ 1 na 0,16 s; 1–3 na trk), tresenje > 3, snop isker pri fxWall > 2,5, sicer curek isker ob drgnjenju. |
| Zid boksov, pas v boksih, vrzel uvoza in izvoza | js/core.js: Track.pitAt / pitJ / pitLead ~1394–1432; veja pit v wallCollide; Race.pitStep (inPit), Race._step ~7121 | Zid boksov je ista črta br (narisan 0,25 m za njo) z istim sunkom: Spa −150 m, 15°/120 → 110 km/h po 1. koraku, hit 8,5 m/s, škoda 18 %, enako kot na ravnini. Za igralca in avte, ki gredo v bokse, se črta v vrzeli (pitAt.gap) premakne na zunanji rob pasu (lout); na pasu veljata meji inner in lout + bayRoom. Nos zidu nima čelne ploskve: avto s sredino na črti zidu pri 109 km/h dobi 115 cm premika vstran v enem koraku, brez izgube hitrosti, škode in zvoka. |
| Otok krožišča (def.rings) | js/core.js: Track rings ~1013 (ri, zr); veja rings v wallCollide | Poln krog polmera ri (r 12 m, hw 3 m → ri 7,2 m), normala radialna, isti sunek kot ograja; v območju zr črta ograje proge ne velja. Čelno 60 km/h → 8 km/h po 1. koraku, škoda 39 %; 120 km/h → 17 km/h, 85 %; oplazenje z 0,3 m širine avta: 114 → 107 km/h, škoda 16 %. |
| Konca odprte ceste | js/core.js: wallCollide, veja trk.open (zid 0,5 m pred zadnjim vzorcem, normala vzdolž ceste) | Neviden zid počez čez cesto z istim sunkom: čelno 60 km/h → 14 km/h (škoda 41 %), 120 km/h → 27 km/h (96 %); vzvratno 30 km/h v začetek ceste → 7 km/h (16 %). |
| Rob prepada (def.drops, samo odprte ceste) | js/core.js: Track drops / dropAt ~295–304; wallCollide(…, canFall); Race._fall | Ograje ni, meja je 1,2 m od asfalta. Če gre vogal čez rob s hitrostjo navzven nad 2,5 m/s (9 km/h), avto pade (c.fall; potisnjen na vsaj 4,5 m/s navzven, zasuk ·0,6 ± 0,9 rad/s). Počasneje ga rob drži kot ograja z istim sunkom in trenjem: 5°/60 drsi 2,5 s ob nevidnem zidu (58 → 37 km/h po 2 s), 15°/30 se ob robu ustavi. |
| Rob nove mape (track.free) in stene predora (track.wall2) | js/core.js: wallCollide, veja trk.free (pred vogali) in trk.wall2(x, z, y, out); mapo postavi js/newmap.js | Rob mape: sredina avta se pripne na [x0, x1, z0, z1], komponenta hitrosti čez rob se izniči; brez trenja, zasuka, hitWall, škode in zvoka (30°/120: 119 → 103 km/h = cos 30°, avto ostane na robu). Stena predora gre skozi isti sunek kot ograja (15°/120 → 111 in 106 km/h, škoda 19 %; 90°/120 → 27 km/h, 96 %). |
| Polprikolica (Car.tl) in ograja | js/core.js: Race._tlStep ~7967–8010 (wallCollide(R, T, true) po točkah ob bokih, nato tlJoin ~2517); tlStep ~2400 (v Car.step); TLK ~2219 | Prikolica je za ograjo svoj »avto« (12 t, 12,4 × 2,5 m, točke vzdolž bokov) z istim sunkom. Po popravku lege jo tlJoin zasuka okoli sedla tja, kamor jo je zid potisnil, in izenači hitrosti v sedlu (sunek gre tudi v vlačilec); hitWall / fxWall prikolice dobi vlačilec. Čelno 60 km/h: vlačilec 44 km/h po 1. koraku (sam 13), obstane v 0,13 s, škoda v 6 korakih 55 % (sam 24 %). Vrstice s prikolico so odvisne od --cv 2/3/4 (čas vrnitve oprijema KC.glT po sunku sedla), same ograje ne. |
| Odprtine v črti: stranske ceste (stubPen), nasprotni pas (altC), pospeševalni in zaviralni pas ob boksih (pitLead) | js/core.js: wallCollide (veje stubPen, altC, pitLead) | Na teh mestih se črta ograje premakne ali odpre, sunek ostane isti. Samo prebrano v kodi, ni izmerjeno. |
| Kaj naredi fizika vožnje takoj po udarcu (klasična stepCS, nova stepNova) | js/core.js: Car.stepCS ~2653–2884 (zakon drsenja: pot se vrti proti nosu z lo·rho·att/tv, tv 0,35–0,6 s; scrub), Car.stepNova ~2888; izgubo oprijema xgl nastavijo samo trki med avti in sedlo prikolice | Ograja spremeni samo hitrost in zasuk, oprijema ne vzame. Klasična fizika potem potuje tja, kamor kaže nos: dokler nos kaže v ograjo (15°/60: ~3 s, zasuk največ 49 °/s), avto vsak korak znova pritisne vanjo (stik vsak korak, hit 0,17 → 0 m/s, pojemek ~1,4 m/s²). Izguba hitrosti ob odhodu je vseeno blizu Coulombovega računa (106 proti 108 km/h pri 15°/120). Nova fizika ob ograji drgeta: stik se preklaplja 35–117-krat na s z razmikom do 1,5 cm. |
| Odpadli deli po udarcu (meja področja) | js/core.js: Race._step ~7133–7138 (spawnDebris, stepDebris, debrisHit) | Pri škodi nad ~25–45 % deli padejo na cesto in avto jih lahko zadene. To je edina razlika med Race.step in zanko skripte za sam avto: 24 od 24 primerov na Spa in Bathurstu je enakih do bita, ko so kosi izklopljeni; z njimi se lega po 7 s razlikuje za 0,3–0,7 m (cs). |

### Predmeti, razbitine, promet

| Stik | Kje v kodi | Kako deluje zdaj |
|---|---|---|
| Predmeti ob progi (40 vrst v PROPK: stožci, gume, bale, skladi, table, drogovi, hidranti, omarice, nadstrešek) | PROPK, mkProp, Race.setProps, Race.stepProps, propCarHit, propImpulse, propFeel, Race.breakProp (js/core.js) | Masa 3–220 kg (stožec 3, guma 9, zaboj 18, bala 26, sklad bal 78, tabla zavorne razdalje 16, hidrant 45, omarica 80, semafor 90/160, svetilka 110, nadstrešek 220), oblika krog dosega 0,28–1,55 m. Avto (3 krogi r 0,92 m) predmet izrine iz sebe; pri vrel ≥ 0,5 m/s dobi predmet sunek 1,35·vrel/(1/m + r²/I + 1/M), omejen na min(18 m/s, 0,72·v + 2) vodoravno in 7,5 m/s navzgor. Avto ne dobi nasprotnega sunka, ampak izgubi min(4,5 %, 0,16 %·m)·min(1, vrel/8) hitrosti na VSAK korak stika in naključen zasuk; ulični predmeti z dmg udarijo enkrat (0,6 s brez stika) in vdrejo karoserijo. Ocena: en stik je pravega reda (stožec 0,48 %), zadetek v sredino pa je 14–33-krat pretežek (stožec 11,6 %, bala 49,7 % pri 120 km/h), težki drogovi so prelahki (4,5 % namesto 12–22 %), masa avta se ne upošteva. |
| Predmet ob tla, ograjo in drug predmet | propStep, propPair, propFloor, F.inset | Težnost 13 m/s², odboj in trenje po vrsti (stožec e 0,30, mu 0,75), pari predmetov se izrivajo, skladi se razsujejo v kose. Ograja zadrži predmet samo, če je njegovo središče manj kot 3,2 m nad tlemi; spanje po 0,35 s mirovanja ali pri 20 s. Ocena: stvarno (kupi mirni v 3,2–5,4 s, noben par drug v drugem), razen visokih drogov (mlamp do 12,4 m čez ograjo in skok nazaj) ter parkirne ure in znaka (tresenje do 20 s). |
| Odpadli deli avtov (ogledalo, blatnik, odbijač, vrata, pokrov, prtljažnik, kolo) in steklo | C.detachPart, Race.spawnDebris, stepDebris, debrisHit, DEB_RUN | Največ 40 kosov, igralna masa m 1–14 (ogledalo 1, blatnik 5, odbijač 7, vrata 9, prtljažnik 11, pokrov 14, kolo 4–14); kos odleti z 0,7·v + 2–5 m/s, drsi s pojemkom 6,5 m/s², od ograje se odbije, med seboj kosi ne trkajo. Ležeč kos (< 3 m/s) avto povozi enkrat: −min(2,5 %, 0,2 %·m), kos se ne premakne. Premikajoč kos: brca min(24 m/s, 1,35·vrel), avto izgubi min(6 %, 0,4 %·m) na VSAK korak stika in naključen zasuk. Steklo: lise r 2 m z oprijemom −20 %. Ocena: hitrost kosa po zadetku stvarna (1,10–1,23 v), izguba avta pretežka (pokrov 8–14 % namesto ≤ 1,6 %; rinjen blatnik v dirki −121 km/h). |
| Promet (avto, kombi, avtobus, motor, kolo, tovornjak s polprikolico) | Traffic._hitVeh, _knock, _loose, _bump, _runBike, _throwRider, TFK | Mase 1300 / 2400 / 12 500 / 290 / 90 / 32 000 kg. Krogi proti krogom (r = pol širine), sunek z e 0,25 in ročicami, nos avta dobi sunek zasuka, obrezan na 22,9°; vozilo se sprosti pri Δv > 1,4 m/s (težka > 0,6), škoda (sunek − 3,5)·0,016·m/1300. Kolo: avto izgubi min(v, 0,15·v + 1), kolo dobi 0,5 v. Ocena: mase in gibalna količina stvarne (1,00; avto 66,3 %, avtobus 114,4 %), obris iz krogov pušča vdor 0,5–0,7 m, kolo je pretežko (21 % namesto ≤ 9 %). |
| Ljudje in živali | Traffic._hitPeds, TF_PED; gledalci (crowdPut v js/world.js) in živali (js/world-zivali.js) samo izris | Pešec 75 kg obstaja samo v prometu in begu: avto izgubi min(v, 0,06·v + 0,4 m/s) (8,4/7,2/6,7 % pri 60/120/200), pešec dobi 0,35 v. Gledalci, redarji, mehaniki in živali nimajo trka. Ocena: izguba avta stvarna (pričakovano 6,1–8,3 %), pešec prepočasen (0,35 v namesto ~0,8–1,0 v); ostalo prezrto. |
| Beg pred policijo (patrulje, promet v begu, hlodi, bodice) | crashCollide, CRASH, crashLoss, Police.collide, Police._car, Traffic._hitVehP | Škatla proti škatli (obbHit), e 0,05 nad 1,5 m/s, trenje 0,5, izriv 35 % na korak; mase: igralec + 90, patrulja 1750, neoznačen 1650, kombi 2900, motor 430 kg. Hlodi (iz kode): hitrost × (1 − clamp(0,05 + 0,004·v, 0,05, 0,2)), premor 0,14 s. Ocena: stvarno (gibalna količina 0,99–1,00, izguba 61,5 % ob patrulji = pričakovano, vdor 0,05–0,12 m). |
| Trdne škatle (stavbe) | boxCollide (kliče ga samo Police.collide za goal.walls skrivališča, def.hideout) | Popoln izriv, e 0, trenje 0,2, vdrtina (−vn − 2,5)·0,028. Uporablja ga samo skrivališče pri begu, ki ga ima le zamrznjena testna proga; na pravih progah tega stika ni. Ocena: stvarno (pod 10° ostane 99 % hitrosti vzdolž stene, pod 90° avto obstane, 0 cm skozi steno do 200 km/h), odboja nič. |
| Prikolice (stoječe ali v vožnji) | Race._tlStep, tlJoin, carCollide, wallCollide | Prikolica je telo vrste avto (c.tl) in trka po izbrani različici trkov; izgubljene prikolice na progi ni (se ne odklopi). Cisterna: vlačilec 5300 + polprikolica 12 000 kg. Ocena: v stoječo polprikolico avto obstane (e 0,09, gibalna količina 1,00, škoda 21/48/83 % pri 60/120/200): stvarno; področje agenta avto–avto. |
| Odstopljen ali razbit avto na progi; rezervno kolo | Race.retire, retireControl, parkBrake, _wreckStep; Q.spare | Odstopljen avto se odpelje na izletno cono in stoji z ročno zavoro; ostane avto in trka s carCollide (e 0,12–0,16, gibalna količina 0,95–1,00). Rezervno kolo je samo stanje avta, ne predmet na progi. Ocena: stvarno. |
| Scenografija (drevesa, drogovi, hiše, tribune, table ob progi brez vnosa v props) | wallCollide (črte ograje bl/br, otoki, zid boksov, meje stranskih cest, robovi prepada); F.inset samo za predmete | Nima trka: avto ustavi samo črta ograje. Kar stoji za ograjo, ni dosegljivo; kar stoji znotraj črte brez vnosa v props, avto prevozi brez stika. Ocena: prezrto (namenoma: ograja je edina trdna meja). |
| Nova mapa (prosta vožnja): ograje in predmeti | js/nvwalls.js (ni v Core) | Svoje ograje in predmeti (plastična ograja 160 kg, lesena 45 kg pade pri 4 m/s, lahki predmeti 3–35 kg). Ni del jedra, v Node ni merljivo: samo iz kode, brez ocene. |

### Boksi, pristanek, prevračanje, zanka dirke, splet

| Stik | Kje v kodi | Kako deluje zdaj |
|---|---|---|
| Avto-avto v boksni stezi | js/core.js: Race.pitStep (~7305: c.inPit, c.pitG), Race._pitGhostOff (~7298), pair() v Race._step (7068-7265), carCollide veja inPit (3832) in stari trk (do 3909), CSK.carE / tapT / tapMax, NVK.carE / carMu / carYaw | V dirki je avto v boksni stezi duh (pitG = inPit ali čez rob asfalta proti boksom z željo po postanku); zanka parov vsak par z duhom preskoči, applyDamage in puncture pri duhu vrneta. Stari trk (trije krogi, e 0,10 cs / 0,40 nova, sunek nosu do 23°) zato za pare v dirki ne teče: Spa 300 s, vsi v bokse: 14.540 avto-korakov v stezi, 0 korakov inPit brez pitG, 0 trkov, škatle avtov se prekrivajo do 3,0 m. Duh je spet trden, ko se z nikomer ne prekriva (največ 6 s). Veja inPit teče le ob neposrednem klicu, pri priklopnikih (_tlStep) in je enaka Stari (cv 5). |
| Boksni zid, zunanji rob steze, uvoz in izvoz | js/core.js: wallCollide (3747-3823) s Track.pitAt (1394: inner, lout + bayRoom), pitLead (1422), PIT_V (3537), BAY (3541) | Ista funkcija in isti odboj kot ograja proge (trenje 0,25; 80 km/h pod 15°: po 1 s 56 km/h, pod 30°: 43 km/h, avto ostane ob zidu vseh 2,5 s meritve), a brez škode, predrte gume in prevrata, ker je avto duh (ograja proge pod 30°: 23,8 % škode). Omejevalnik 80 km/h v pitStep(post). |
| Vzlet čez greben in let | js/core.js: Car.stepCS 2680-2683 (vzlet), 2870-2875 (let, pristanek); stepNova 2917, 3093-3096; JUMP_G = 14 (2092); CSK.airYawT | Vzlet, ko je hitrost² × ukrivljenost ceste < -0,85 × 14 m/s² in hitrost > 6 m/s; vy = nagib × hitrost. V zraku ni sil pnevmatik, vy -= 14·dt, vrtenje ugasne v 0,25 s (34 → 2,5 °/s v 0,66 s). Višina avta zaostaja en korak za višino ceste, zato avto na gladkem grebenu pristane v istem koraku, v katerem vzleti: 0 korakov v zraku pri 100-200 km/h čez R 60 m, na padajočem delu pa vsak tak korak vzame do 13 % hitrosti. |
| Pristanek | js/core.js: Car.stepCS 2873-2874, stepNova 3094-3095 (impactVY, knock, landT), M.landV (11 m/s; tovornjaki 13-24), M.landK | Ko y ≤ višina ceste: hitrost × (1 - min(13 %, 1,6 % na m/s navpične hitrosti) × landK), škoda (/vy/ - landV) × 1 % × knockK nad 11 m/s, vy = 0 (brez odboja); landT 0,05-0,2 s je samo časovnik (kamera, zvok), oprijem se ne spremeni. Šteje navpična hitrost, ne hitrost glede na cesto. Padec 0,3 / 1 / 3 m: -4,7 / -8,4 / -13,0 % hitrosti, škoda 0. |
| Padec čez rob prepada | js/core.js: wallCollide veja canFall (Track.dropAt 298-304), Race._fall (8018), Race.rescue (8029) | Na strani s prepadom avto z zunanjo hitrostjo > 2,5 m/s (dvignjeno na 4,5) pade: 1,6 s s težnostjo 14 (16 m globoko), nato +32 % škode (brez knockK; pri Izklop 0, pri Samo videz 32 %), postavljen na sredino ceste 19-39 m naprej s hitrostjo 28,8 km/h; izguba 0,7-1,3 s; četrti padec = 100 %. Pod 2,5 m/s rob drži kot zid. Prepade (def.drops) ima samo zamrznjena testna proga; na pravih progah se to ne zgodi. |
| Prevračanje (Razbijanje · nov način, privzeto izklopljeno) | js/core.js: setCrash / XR / XROLL (2093-2182), xRollStart, xRollStep (2650), sprožilca carKnockFx (4015) in wallCollide (3819) | Sproži ga trk v bok s hitrostjo približevanja > 9 m/s ali bočni udarec v ograjo > 10 m/s, in to z žrebom 1 : 10 (izmerjeno 11 % od 400 avtov, enako pri 9,1 in 20 m/s); ne z net avtom, v zraku ali v boksih. 1 obrat (1,18 s) ali 2 nad 15 m/s (1,58 s), lok do 0,9 / 1,55 m, pojemek 3 m/s² in na koncu × 0,8, škoda +4 % na stik strehe; avto konča na kolesih v isti smeri in pelje naprej. |
| Škoda ob trku | js/core.js: knock (3160), applyDamage (3163-3212), detachPart (3295), carKnockFx (4011), wallCollide (3814-3817), Race._fall; js/game.js privzeto damage: 1 | Avto-avto: (hitrost približevanja - 3,5 m/s) × 1,6 % × knockK, obema enako ne glede na maso; ograja: (hitrost v zid - 2,5) × 2,8 % × knockK; pristanek nad 11 m/s 1 % na m/s; padec +32 %. Škoda gre v cono (× 1,7) in vogale (× 1,8): luč ugasne pri 16 %, deli odpadajo po pragovih, okna pri 42-55 % cone. Samo videz (privzeto): vožnja enaka, izjema odpadlo krilo formule (aeroK × 0,5). Vklop: moč motorja -22 % × škoda, kolesa odpadejo nad 75 %, AI gre v bokse nad 38-45 %; XR.handle (samo z Vklop): volan vleče do 0,05 hoda. |
| Predrta guma in gume Kolibri | js/core.js: puncture (3825), PUNC_T, PUNC_TR, FLAT (1672), Race opts.faults; ktHit, KT, ktGrip (3213-3260), opts.tyreRule | Samo z vklopljenimi okvarami in ne v boksih: udarec ≥ 11 m/s, en žreb na trk, verjetnost min(25 %, (v - 11) / 20): izmerjeno 0 / 4 / 26 / 24 / 23 % pri 10 / 12 / 15 / 20 / 27,8 m/s. Prazna guma: ovinek 2,38 → 2,27 g (spredaj) ali 2,23 g (zadaj), brez rok vleče 2,6 m v 3 s pri 100 km/h. Gume Kolibri: trk jih samo obarva (škoda gume 0,64 na mestu udarca), oprijem ostane 1. |
| Vrstni red koraka dirke in izbira parov | js/core.js: Race._step (7068-7265), pair(), BIG_FIELD = 16 (4164), Race._pairs (7772), _lodPlan / _lodPair (7729, 7757), LOD (4177) | Red: vreme → LOD načrt → AI vnosi → štart, razbitine, vleka → vsak avto: gorivo, volan, _fall ali Car.step (v njem prevrat, let, pristanek) → varnostni avto → policija → promet → PARI avto-avto → varnostni avto proti vsakemu → policija → pitStep(pre) → wallCollide za vsak avto → priklopniki → pitStep(post) → odpadli deli, drobci, steklo → napredek, krogi, reševanje. Par se preskoči: različna nivoja (/Δy/ ≥ 3 m na progi s križanjem), oba v cilju na odprti cesti, kateri pada, kateri je duh v boksih. Do 16 avtov vsi pari (12 avtov: 66 na korak, 13-16 µs), nad 16 prelet po x z dosegom + 2,5 m (20 avtov: 10 parov, 100 avtov: 64, največ 144; široka faza 68-76 µs) in LOD. Zidovi 12-26 µs pri 12 avtih. Poln trk Simulacije 2,0-3,1 µs, par zunaj dosega 0,14-0,23 µs. |
| Varnostni avto, promet, policija, priklopniki, drobci, steklo | js/core.js: Race._step (tf.step, pol.collide), _tlStep (7974), stepDebris (3462), debrisHit (3499), propCarHit (3645), _glassStep | Tečejo za pari avto-avto oziroma za zidovi (red zgoraj); varnostni avto trči z vsakim avtom, ki ni net ali duh; priklopnik kliče carCollide in zidove posebej. Popisano iz kode, ni merjeno. |
| Prijateljev avto na spletu | js/game.js: xPhys / testOf (556-564), netFrame, netPlace (5950-6030), iv in lag (5947); js/core.js: Race opts.remote (6376-6421), kCollide veje .net (3919-3934), carKnockFx (4011, 4015); js/net.js (samo prenos) | Vsak telefon vozi samo svoj avto; prijateljevega postavlja netPlace iz stanj, poslanih vsakih 50 ms (100 ms pri veliki mreži), 100 ms (200 ms) v preteklosti. Net avta trk ne premakne: lokalni avto vzame ves razmik in svoj delež sunka, škodo dobi samo lokalni, prevrata ni. Oba telefona vedno vozita Simulacijo brez dodatkov Razbijanja. Duh je zato premikajoč se zid: trk od zadaj vzame zadnjemu vso razliko hitrosti (-19,5 od 20 km/h), sprednji ne čuti nič; čelno se oba odbijeta z e = 1,0; mesto duha zaostaja za hitrost × lag (2,8 m pri 100 km/h). |

## Meritve

### Avto ob avto (enaki masi)

Skripte: `tools/trki/avto-avto.js`

**cs (klasična), Simulacija, rally 1150 kg ×2; A udari, B zadet; po dotiku brez pedal in volana.** scn: H čelno, R od zadaj (s B stoji, b B 30 km/h počasnejši), T bočno (s B stoji, x B prečka z V; m sredina, f sprednja, r zadnja os), S bok ob boku (a3/a10 kot °; e enaki hitrosti, d B 20 km/h počasnejši), P vogal A v zadnji (r) ali sprednji (f) bok B z 2/4/8 m/s; c sredinsko, o zamik pol širine. Stolpci A/B: hitrost 0,1 s/2 s po dotiku; E−%: izguba energije para v sunkih/po 2 s; največji zasuk nosu; največja kotna hitrost; največji xgl; čas do ravne vožnje (- ni v 6 s); sunki z Δv ≥ 0,1 m/s; največje prekrivanje škatel (cm). Gibalna količina para v sunkih: napaka 0,00 % povsod; NaN 0; zamenjava mest 0. V vrsticah S oba držita plin (E−% po 2 s je lahko negativen).

|scn|A km/h|B km/h|E−%|zasuk°|ω°/s|xgl|ravno s|sunki|prekr.|
|-|-|-|-|-|-|-|-|-|-|
|H60c|7/6|7/6|99/99|0/0|0/0|0/0|-/-|1|26|
|H60o|0/0|0/0|100/100|0/0|4/4|0/0|0/0|2|26|
|R60sc|26/24|34/31|49/58|0/0|0/0|0/0|0/0|1|12|
|R60so|30/24|30/27|43/63|-32/-26|166/150|0,3/0,3|0,8/0,8|2|12|
|R60bc|43/39|47/42|10/27|0/0|0/0|0/0|0/0|1|5|
|R60bo|45/41|45/41|10/27|-4/-4|50/50|0,2/0,2|0,3/0,3|1|5|
|T60sm|26/0|26/0|50/100|0/0|0/0|0/0|0/0,6|2|12|
|T60sf|26/0|26/0|51/100|3/0|35/0|0,2/0|0,1/0,6|16|14|
|T60sr|29/20|23/0|53/90|-1/38|6/174|0/0,5|0,3/0,4|11|13|
|T60xm|27/24|54/38|37/72|7/47|39/167|0/1|0,5/1,1|1|12|
|T60xf|23/18|55/43|42/70|14/-5|37/42|0/0|0,7/0,4|17|14|
|T60xr|39/35|53/27|22/73|5/176|34/406|0/1|0,6/-|1|12|
|S60a3e|60/60|60/61|17/-2|20/5|78/4|0/0|2,5/2,1|77|8|
|S60a10e|60/61|59/61|29/-3|17/6|79/12|0/0|2,7/2,3|95|10|
|S60a3d|59/60|41/40|1/1|25/1|73/4|0/0|2,6/0,2|7|6|
|S60a10d|58/62|42/62|50/-48|19/8|80/8|0/0,1|2,7/2,2|79|10|
|P60r2|59/51|60/51|6/29|-4/-5|9/10|0/0|0,1/3,9|157|5|
|P60r4|59/46|59/23|7/63|-6/-103|18/151|0/1|1/2|9|12|
|P60r8|58/52|58/47|3/33|-4/-39|30/150|0/1|0,6/1,1|1|13|
|P60f2|59/52|60/52|3/26|-2/2|12/7|0/0|0,1/0,1|3|5|
|P60f4|59/47|59/47|12/38|-6/3|21/14|0/0|0,6/1,6|160|8|
|P60f8|56/33|57/33|40/70|-12/4|33/26|0/0|2/2,9|44|13|
|H120c|14/13|14/13|99/99|0/0|0/0|0/0|-/-|1|26|
|H120o|0/0|0/0|100/100|0/0|4/4|0/0|0/0|2|26|
|R120sc|53/47|67/60|49/60|0/0|0/0|0/0|0/0|1|26|
|R120so|52/6|67/12|41/99|-120/-125|330/330|0,6/0,6|0,9/1,1|9|26|
|R120bc|102/91|107/95|2/23|0/0|0/0|0/0|0/0|1|5|
|R120bo|105/93|104/93|2/24|-5/-5|36/36|0/0|0,7/0,7|1|5|
|T120sm|53/0|60/0|50/100|0/0|0/0|0/0|0/1,3|2|26|
|T120sf|56/23|56/6|54/96|7/-41|70/74|0,2/0|1/1,6|10|26|
|T120sr|66/57|44/0|30/78|-2/250|12/660|0/1|0,4/0,9|10|26|
|T120xm|55/48|112/67|36/76|7/203|47/446|0/1|0,8/-|1|26|
|T120xf|54/47|113/87|40/66|7/-3|46/34|0/0|0,8/0,8|11|26|
|T120xr|80/70|108/38|21/78|7/521|49/804|0/1|0,9/-|1|26|
|S120a3e|120/120|120/121|1/-1|11/5|52/16|0/0|2/0,2|68|5|
|S120a10e|119/120|119/121|3/-1|-10/7|57/37|0/0|2,6/0,2|156|13|
|S120a3d|119/120|101/100|1/0|16/4|68/9|0/0|2,6/1|12|6|
|S120a10d|117/123|103/121|6/-22|-10/4|49/21|0/0|2,2/1,8|96|13|
|P120r2|119/105|119/105|1/24|-3/-3|19/19|0/0|0,2/0,7|2|5|
|P120r4|119/102|119/102|3/28|-11/-11|31/32|0/0|4,2/4,5|196|8|
|P120r8|118/102|119/98|3/31|-9/-22|49/128|0/0,5|1,1/1,2|6|15|
|P120f2|119/106|119/106|0/23|-3/2|22/15|0/0|0,2/0,1|6|4|
|P120f4|119/105|119/105|1/23|-5/3|36/26|0/0|0,2/0,2|14|7|
|P120f8|117/102|118/102|3/28|-7/6|51/41|0/0|0,3/0,3|64|11|
|H200c|24/23|24/23|99/99|0/0|0/0|0/0|-/-|1|63|
|H200o|27/0|28/13|74/100|-2248/0|1934/0|0,8/0|2,1/-|2|63|
|R200sc|88/78|111/99|49/60|0/0|0/0|0/0|0/0|1|16|
|R200so|85/29|113/42|41/94|-312/-311|551/551|0,6/0,6|1,7/1,9|6|16|
|R200bc|182/157|186/160|1/27|0/0|0/0|0/0|0/0|1|5|
|R200bo|184/157|183/157|1/29|-8/-8|52/52|0/0|1/1|1|5|
|T200sm|88/14|104/14|50/99|0/0|0/0|0/0|0/2,2|3|16|
|T200sf|96/77|96/6|50/85|15/-40|117/77|0,2/0|0,6/1,4|5|31|
|T200sr|112/104|78/0|26/73|-8/611|53/1109|0/1|0,9/1,6|8|23|
|T200xm|92/78|190/103|37/79|7/341|50/619|0/1|0,9/1,5|1|16|
|T200xf|98/84|188/142|40/66|8/-4|51/30|0/0|0,9/1,2|7|28|
|T200xr|131/114|182/70|22/78|8/1248|51/1344|0/1|0,9/-|1|16|
|S200a3e|200/200|200/200|0/0|6/4|33/36|0/0|1,8/0,5|68|5|
|S200a10e|199/201|199/201|2/-1|-10/7|52/53|0/0|1,9/0,7|164|16|
|S200a3d|199/201|181/180|0/0|6/-1|38/9|0/0|1,8/0,3|11|5|
|S200a10d|192/178|185/178|4/12|-11/-7|47/46|0/0|1,7/4,7|477|16|
|P200r2|198/169|199/169|0/29|-4/-4|28/29|0/0|0,3/0,8|3|4|
|P200r4|198/167|199/167|1/30|-8/-8|44/45|0/0|0,6/2,3|10|6|
|P200r8|197/162|199/162|2/34|-17/-18|52/52|0/0|3,2/3,3|107|13|
|P200f2|198/169|199/170|0/28|-3/2|33/24|0/0|0,1/0,3|8|4|
|P200f4|198/169|198/169|0/29|-5/4|46/38|0/0|0,7/0,4|13|6|
|P200f8|197/168|197/168|1/30|-8/7|53/52|0/0|0,8/0,8|27|11|

**nova (nova fizika), iste oznake:**

|scn|A km/h|B km/h|E−%|zasuk°|ω°/s|xgl|ravno s|sunki|prekr.|
|-|-|-|-|-|-|-|-|-|-|
|H120o|0/0|0/0|85/100|-7/-7|661/661|0/0|0,1/0,1|6|26|
|R120so|58/51|58/51|43/64|-29/-28|330/330|0/0|0,5/0,5|4|26|
|T120sf|60/43|54/43|33/74|18/-80|135/660|0/0|1,1/0,9|17|26|
|T120sr|59/8|55/7|35/99|-5/15|30/660|0/0|1,9/-|22|26|
|T120xm|57/50|115/94|31/61|35/11|530/446|0/0|0,4/0,8|1|26|
|T120xf|54/47|112/97|35/60|50/-31|471/425|0/0|0,5/0,5|5|26|
|T120xr|76/67|111/93|19/54|31/15|450/804|0/0|0,4/0,7|2|28|
|P120r8|118/102|119/102|1/28|-21/-13|119/128|0/0|0,9/1|16|10|
|T200xr|124/109|187/154|20/56|32/-11|735/1344|0/0|0,5/0,8|2|32|

**Korak proti hitrosti (cs; A z V v stoječega B, zamik v deležu širine, 24 leg prvega dotika v koraku):**

|V|zamik|A +0,1 s|B +0,1 s|zasuk A°|zasuk B°|prekr. cm|A mimo B|A obdrži > 90 % V|
|-|-|-|-|-|-|-|-|-|
|120|0,75|57–65|57–62|2–69|1–7|2–29|0/24|0/24|
|200|0,5|85–89|108–113|301|156–299|5–45|0/24|0/24|
|200|0,75|95–158|43–104|1–147|1–35|3–45|10/24|0/24|
|300|0,5|130–132|164–165|548–998|59–542|7–68|0/24|0/24|
|300|0,75|143–296|0–157|0–256|0–110|5–45|16/24|7/24|

**Plin drži hitrost:** A spet pri 95 % hitrosti po: R60sc 1,4 s; R120sc 3,2 s; T120sr 1,4 s; T120xf 1,7 s; T120xr 1,0 s. **Vloge:** igralec→tekmec = tekmec→igralec; tekmec–tekmec: T120sr 287° (xgl 0,5), P120r8 −14° (xgl 0,26). **Proga = ravnina** (Spa, Bathurst; rally v stoječega kaze, 120 km/h): A 50/45, B 65/58 km/h na obeh.

### Mase, prikolice in različice

Skripte: `tools/trki/mase-razlicice.js`

Vse: resnična koda (Car.step, carCollide, wallCollide, Race._tlStep), ravnina, DT 1/120 s. Hitrosti v smeri A: pred > po 1. koraku > +2 s (km/h).

**A. Mase (cs, Simulacija, 120 km/h)**
| scenarij | lahki | težki | dv L:T | e | E- % trk/2 s | opomba |
|---|---|---|---|---|---|---|
| celno, miška 560 / kamen 7000 | 119>-128>-106 | -119>-99>-81 | 247,2:19,8 | 0,12 | 27/51 | 1 sunek, 1 korak |
| celno, mravlja 165 / kamen | 119>-141>-99 | -119>-113>-91 | 260,0:6,1 | 0,12 | 9/41 | |
| celno L v stoječega T | 119>-4>-3 | 0>10>9 | 123,9:9,9 | 0,12 | 91/93 | |
| zadaj L>T (120>90) | 119>88>78 | 90>92>76 | 31,4:2,5 | 0,15 | 1/32 | |
| zadaj T>L | 90>121>106 | 119>117>94 | 30,8:2,5 | 0,15 | 0/34 | |
| T: T v bok stoječega L | 0>123>81 | 119>109>81 | 229,8:18,4 | 0,12 | 7/50 | L na nosu 2 s; 186 sunkov, 2 nad 0,5 m/s |
| T: T v prednjo os L | 0>88>81 | 119>112>81 | 229,5:18,4 | -0,20 | 7/50 | zasuk L 0 st |
| celno, burja 1150 / cisterna 17300 | 121>-101>-98 | -120>-105>-98 | 227,1:15,1 | -0,02 | 24/33 | |
| isto, 0,5 m iz sredine | 121>-87>-17 | -120>-106>-72 | 236,4:15,5 | -0,08 | 22/51 | avto 180 st, 568 st/s; vlačilec 37 st, xgl 1,00 |

(mA dvA)/(mB dvB) = 1,00 in dP 0,0 % v vseh vrsticah avto-avto.

**B. Gorivo in pm (zadaj 120>90)**
| primer | dvA:dvB | dvA/dvB | mB/mA | dP % | E+ % |
|---|---|---|---|---|---|
| burja>kamen, prazna | 30,14:4,95 | 6,087 | 6,087 | 0 | 0 |
| polna (1210:7280 kg) | 30,07:5,00 | 6,017 | 6,017 | 0 | 0 |
| formula polna (+105 kg) > prazna | 15,84:17,92 | 0,884 | 0,884 | 0 | 0 |
| burja>burja, igralec A, cPm 1,7 | 12,49:21,23 | 0,588 | 1 | 41,2 | 6,41 |
| cPm 3 | 8,43:25,28 | 0,333 | 1 | 66,7 | 14,39 |
| Arkadna, igralec A | 13,54:23,02 | 0,588 | 1 | 41,2 | 7,20 |

**C. Različice (burja/burja 120, igralec zadene tekmeca, cs)**
| scenarij | Sim | Ark | Mehka | Kask | Stara |
|---|---|---|---|---|---|
| celno: v po A/B; e | -14/14; 0,12 | 13/62; 0,20 | -7/7; 0,06 | -24/24; 0,20 | -12/12; 0,10 |
| zadaj 120>90: v po; e | 104/108; 0,15 | 107/114; 0,24 | 105/107; 0,07 | 102/110; 0,26 | 104/107; 0,10 (dotik 22 cm prej) |
| T v stoječega: po; +0,5; +2 s | 53/68; 39/39; 0/0 | 67/91; 65/49; 11/11 | 57/64; 39/39; 0/0 | 48/72; 47/31; 0/0 | 54/66; 46/46; 5/5 |
| naslon 3 st: zasuk A/B; sunki | 8/2; 114 | 10/3; 117 | 9/1; 117 | 8/3; 91 | 9/0; 0 |
| sunek zadaj 8 m/s: zasuk B; xgl; v B 2 s | 23; 0,55; 100 | 52; 1,00; 74 | 7; 0; 114 | 75; 1,00; 53 | 7; 0; 113 |
| lahek>težek celno: v po | -128/-99 | -132/-85 | -115/-100 | -145/-98 | -123/-100 |

**D. Vloge (sunek zadaj: zasuk B st / xgl B)**
| različica | I>T | T>I | T>T | I>sc |
|---|---|---|---|---|
| Simulacija | 23/0,55 | 23/0,55 | 17/0,27 | 16/0 |
| Arkadna | 52/1,00 | 6/0 | 25/0,47 | 13/0 |
| Kaskaderska | 75/1,00 | 75/1,00 | 75/1,00 | 19/0 |
| Mehka, Stara | 7/0 | 7/0 | 7/0 | 7/0 |

I>net (vse različice): celno dv lokalnega -240,5 (tekmec -135,0), zadaj -30,8 (-17,5), T -120,6 (-67,8); net avto 0.

**E. Mesto zadetka (T 120 v bok burje; B: zasuk st / yaw st/s / xgl)**
| kam | cs, B stoji | cs, B 60 | nova, B stoji | nova, B 60 |
|---|---|---|---|---|
| zadnja os | 180 / 666 / 1,00 | 178 / 792 / 1,00 | 11 / 666 / 0 | 13 / 792 / 0 |
| sredina | 0 / 0 / 0 | 45 / 164 / 1,00 | 0 / 0 / 0 | 23 / 164 / 0 |
| prednja os | 41 / 74 / 0 | 6 / 45 / 0 | 82 / 666 / 0 | 49 / 539 / 0 |

**F. Prikolice (cisterna 5300 + 12000 kg, burja 1150)**
| scenarij | izid |
|---|---|
| avto 120 > rep prikolice (60) | avto 121>59>53, vlačilec 60>65>61, e 0,09, 1 sunek (cs = nova) |
| isto, 1 m iz sredine [cs] | avto 62 st, 235 st/s, xgl 0,39, raven po 1,15 s |
| avto 100 > sredina boka (vlačilec 30 počez) [cs] | avto 101>-2, E- 39 %, vlačilec xgl 1,00, 2 st, pregib 1 st |
| avto 80 celno > vlačilec 80 | avto 81>-67>-66, vlačilec -80>-70>-66, e -0,02 |
| isto, 1 m iz sredine | cs: avto 180 st, 557 st/s, pregib 16 st; nova: 5/7 st, pregib 8 st |
| avto 100 > bok kabine (60 počez) | cs: avto/vlačilec 24/10 st, pregib 4 st, dP 9,6 %; nova: 44/33 st, pregib 32 st |
| vlačilec 90 > avto 60 od zadaj | avto 62>88>83, potiska ga 2 s (232 sunkov, 1 nad 0,5 m/s) |
| vlačilec 90 > rep druge prikolice (60) | 90>83>75 in 60>68>75 pri +0,1 s |
| vlačilec 80 celno > vlačilec 80 | 80>53>0 pri +0,1 s, prekrivanje 13 cm |
| prikolica v ovinku pomete stoječ avto (20 km/h) [cs] | avto 0>8 km/h, 14 st, 98 sunkov (skupaj 74 km/h), pregib 57 st |
| avto 120 > rep 2. cisterne vlaka (29 t) | avto 121>59, e 0,02 |

**G. Ohranitev pri trkih (8 scenarijev x I>T, T>T)**
| fizika | različica | dP % | manjka zasuka % | E+ % (kJ) |
|---|---|---|---|---|
| cs | Sim / Mehka / Stara | 0,0 | 62-100 / 78-100 / 100 | 0,01 / 0,01 / 0 |
| cs | Arkadna | 41,2 | 10-100 | 6,52 (66,1) |
| cs | Kaskaderska | 0,0 | -29 do 100 | 0,47 (3,0) |
| nova | Sim / Stara | 0,0 | 0 | 0 |
| nova | Arkadna | 41,2 | 0-24 | 6,68 (67,7) |
| nova | Mehka / Kaskaderska | 0,0 | 40 / -50 | 0,01 / 0,40 (5,2) |

NaN 0, prehod skozi 0 v vseh tekih.

**H. Škoda (Car.dmg, 120 km/h)**
| scenarij | dv L/T km/h | škoda L/T |
|---|---|---|
| celno miška/kamen | 247/20 | 1,00/0,55 |
| celno mravlja/kamen | 260/6 | 1,00/0,55 |
| T: miška v stoječ kamen | 124/10 | 0,47/0,26 |
| T: kamen v stoječo mravljo | 270/6 | 0,61/0,26 |

**I. Spa (dirka s semenom, Race.step) proti ravnini: kamen (igralec) celno v miško**
| kje | težki | lahki | dv |
|---|---|---|---|
| Spa | 119,9>97,0 | -120,1>128,6 | -22,8 / 248,7 |
| ravnina | 119,0>99,2 | -119,4>127,8 | -19,8 / 247,2 |

Lahki se ujema z (1+e) vc mB/(mA+mB) na 0,1 %; težki v Spa izgubi 2,9 km/h več (povozi razbitino v istem koraku).

Cel izpis: (delovna mapa seje, ni v repozitoriju) trki/mase/out6.txt

### Ograja in zid

Skripte: `tools/trki/zid.js`

**A. Matrika: BURJA R7 (1150 kg), klasična fizika (cs), asfalt ob ograji, brez vnosa.** v km/h; eN1/eNL: normalna hitrost stran od ograje po 1. koraku / ob odhodu, delež vpadne (− = še vanjo); μ: tang. izguba / normalni sunek; izh: izstopni kot; dh: zasuk nosu; w: največji zasuk °/s; drs: čas na ograji s (> = do konca 7 s); n: ločeni dotiki; pop: največji popravek lege cm; hit m/s; šk: škoda %; gum: verjetnost predrtja %; prv: lahko prevrne

|kot|km/h|v1|vL|v.5|v2|eN1|eNL|μ|izh|dh|w|drs|n|pop|hit|šk|gum|prv|
|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|
|5|60|58|–|55|49|-0.43|–|0.25|–|5|18|>6.80|1|0.1|1.4|0|0|ne|
|5|120|117|–|112|101|-0.43|–|0.25|–|5|36|>6.90|1|1.4|2.9|1|0|ne|
|5|200|196|192|186|165|-0.43|0.02|0.25|0.1|5|61|0.12|1|2.2|4.8|6|0|ne|
|15|60|56|–|49|42|-0.37|–|0.25|–|15|49|>6.93|1|2.3|4.3|5|0|ne|
|15|120|111|106|104|95|-0.37|0.02|0.25|0.3|15|100|0.22|1|5.9|8.6|19|0|ne|
|15|200|186|177|172|153|-0.37|0.03|0.25|0.5|15|168|0.11|2|5.9|14.3|53|17|DA|
|30|60|47|–|35|27|-0.24|–|0.25|–|30|72|>6.97|1|4.7|8.3|16|0|ne|
|30|120|93|84|83|76|-0.24|0.01|0.25|0.5|30|147|0.29|1|11.6|16.6|45|25|DA|
|30|200|156|143|140|126|-0.24|0.02|0.25|0.9|31|246|0.15|1|16.2|27.7|99|32|DA|
|60|60|17|0|0|0|0.04|0.00|0.25|109.2|-4|68|0.35|2|6.0|14.4|33|17|ne|
|60|120|33|0|0|0|0.04|0.00|0.25|-38.0|-24|136|0.90|2|18.1|28.8|74|25|ne|
|60|200|55|31|18|14|0.04|0.03|0.25|9.5|-37|227|0.22|3|10.1|48.1|100|25|ne|
|90|60|14|10|4|4|-0.12|0.07|0.16|156.7|1|93|0.03|1|11.6|16.6|41|25|ne|
|90|120|27|21|13|12|-0.12|0.07|0.16|158.1|2|187|0.02|2|25.5|33.3|96|25|ne|
|90|200|46|35|28|27|-0.12|0.06|0.16|158.7|3|312|0.02|2|16.3|55.5|100|25|ne|

**B. Isti trki drugače.** plin = poln plin + volan stran; odm: s do 0,3 m stran za vedno; utr: preklopi stika na s; lep: obtiči

|kot|km/h|cs+plin drs|odm|v2|nova: n|utr|drs|v2|nova+plin odm|v2|trava cs v2|
|-|-|-|-|-|-|-|-|-|-|-|-|
|5|60|0.16|0.67|139|3|117|>6.80|46|0.75|139|26|
|5|120|0.25|0.88|170|36|35|>6.90|100|1.05|169|64|
|5|200|0.12|1.02|211|38|18|1.73|163|1.18|210|114|
|15|60|0.24|0.86|132|3|88|>6.93|32|0.93|129|22|
|15|120|0.18|0.96|162|23|45|>6.97|87|1.13|158|61|
|15|200|0.12|0.96|198|43|18|0.78|149|1.46|194|106|
|30|60|0.53|0.98|120|3|2|>6.97|10|0.93|112|6|
|30|120|0.30|1.09|148|8|96|>6.98|66|1.27|142|47|
|30|200|0.15|0.75|175|50|20|0.59|118|1.46|166|86|
|60|60|>6.98|lep|0|2|6|0.35|0|lep|0|0|
|60|120|>6.99|lep|0|2|4|1.03|0|1.40|42|0|
|60|200|0.24|lep|0|2|0|0.01|0|1.62|87|9|
|90|60|0.03|lep|0|1|0|0.02|3|lep|0|1|
|90|120|0.03|2.07|15|2|0|0.02|8|lep|0|7|
|90|200|0.02|0.15|18|2|0|0.02|12|lep|0|21|

**C. Druga vozila (cs, brez vnosa, asfalt).** MRAVLJA 165 kg, TITAN 5300 kg, CISTERNA = TITAN + polprikolica 12 t (Race.step); ud: koraki s škodo; prik: s prikolica na ograji; zlom: kot vlačilec–prikolica na koncu °

|vozilo|kot/kmh|v1|v2|w|drs|ud|šk|prik|zlom|
|-|-|-|-|-|-|-|-|-|-|
|mravlja|5/120|116|88|68|0.10|1|1|||
|titan|5/120|117|92|26|>6.90|1|1|||
|cisterna|5/120|119|62|31|>6.90|1|1|6.74|56|
|mravlja|15/120|110|83|177|0.10|2|30|||
|titan|15/120|111|84|71|>6.97|1|10|||
|cisterna|15/120|118|54|96|>6.97|2|10|6.81|56|
|mravlja|30/120|91|67|173|0.21|2|57|||
|titan|30/120|94|64|109|>6.98|1|24|||
|cisterna|30/120|113|42|191|>6.98|5|25|6.81|56|
|mravlja|90/60|20|6|303|0.02|2|70|||
|titan|90/60|13|3|61|0.02|2|24|||
|cisterna|90/60|44|1|50|0.12|6|55|0.00|7|
|mravlja|90/120|40|9|606|0.02|2|100|||
|titan|90/120|26|9|123|0.03|2|57|||
|cisterna|90/120|87|2|99|0.12|8|100|0.00|30|
|cisterna+plin|5/120|120|109|33|0.97|2|1|0.82|0|
|cisterna nova|5/120|119|108|34|1.13|2|1|1.24|0|

**D. Posebne ograje (BURJA R7, cs, brez vnosa)**

|ograja|km/h|v1|v2|hit|šk|opomba|
|-|-|-|-|-|-|-|
|otok krožišča: čelno v sredino|60|8|3|16.5|39||
|otok krožišča: čelno v sredino|120|17|9|33.0|85||
|otok krožišča: 0,6 m od roba proti sredini|120|81|–|19.5|48||
|otok krožišča: oplazi (0,3 m širine avta)|120|107|–|8.1|16||
|konec odprte ceste: čelno|60|14|4|16.6|41||
|konec odprte ceste: čelno|120|27|12|33.3|96||
|začetek odprte ceste: vzvratno 30 km/h|30|7|1|8.3|16||
|rob prepada, 5°|60|57|37|1.4|0|rob drži kot zid, drs 2.46 s|
|rob prepada, 5°|120|–|–|–|–|pade čez rob|
|rob prepada, 15°|30|27|7|2.3|0|rob drži kot zid, drs 1.73 s|
|rob prepada, 15°|60|–|–|–|–|pade čez rob|
|rob prepada, 30°|120|–|–|–|–|pade čez rob|
|rob nove mape (track.free): 30°|120|103|73|0.0|0|brez trenja, zvoka, škode; na robu do konca|
|stena predora nove mape (track.wall2): 15°|120|111|95|8.6|19||
|stena predora nove mape (track.wall2): 90°|120|27|12|33.3|96||
|nos zidu boksov (Spa, -167 m): naravnost vanj|120|109|64|0.1|0|skok v stran 115 cm v 1 koraku|

**E. Prave proge in dirka s semenom (cs).** Isti trk 15°/120 in 90°/60; dirka: prva ograja igralca (tests/lib/sim.js »crash«) in isti udarec na ovalu

|kje|15/120: v1|vL|v2|hit|šk|90/60: v1|hit|šk|
|-|-|-|-|-|-|-|-|-|
|spa zid boksov -150 m|110|100|60|8.5|18|14|16.5|40|
|spa ravnina 1660 m|110|100|58|8.5|17|14|16.5|40|
|bathurst ravnina 750 m|111|95|61|8.5|20|14|16.6|41|
|bathurst zid na gori 3040 m|111|99|77|8.6|19|14|16.6|41|
|oval (asfalt)|111|106|95|8.6|19|14|16.6|41|
|oval (trava)|110|100|61|8.5|18|14|16.5|40|

|dirka|fiz|v0|kot|v1 dirka/oval|μ|hit|v2|
|-|-|-|-|-|-|-|-|
|spa|cs|163|29.9|123/127|0.26/0.25|22.6/22.7|75/71|
|spa|nova|133|28.9|103/106|0.26/0.25|17.7/17.9|79/76|
|bathurst|cs|163|26.1|132/135|0.26/0.25|19.9/20.1|79/76|
|bathurst|nova|145|26.9|114/119|0.26/0.25|18.5/18.1|80/84|

**F. Po ograji skozi ovinek (180°, R 60 m, prihod 200 km/h; »po ograji« = poln plin brez volana)**

|fiz|kako|čas s|vMin|vOut|hit|šk|
|-|-|-|-|-|-|-|
|cs|avtopilot|5.30|116|129|0.0|0|
|cs|po ograji|8.18|63|76|30.9|100|
|nova|avtopilot|5.22|112|128|0.0|0|
|nova|po ograji|6.79|96|102|30.8|100|

Speljevanje (avto vzporedno, bok 2 cm od ograje, plin + volan stran): 0,3 m stran za vedno po 1,33 s iz mirovanja (TITAN 2,41 s) in po 0,45 s pri 60 km/h; hit ≤ 1,0 m/s, škoda 0.

Vse vrstice (matrika 360, prikolica 60, vsi stolpci, nova fizika, trava): `node tools/trki/zid.js` ali `--json`.

### Predmeti, razbitine, promet

Skripte: `tools/trki/predmeti.js`

**A. Predmeti ob progi** (rally 1150 kg brez plina; n = koraki stika, dv% = izguba proti kontroli pri 60/120/200 km/h; vo/v = predmet/avto pri 60/200; h = vrh leta m; pA/pP = izgubljena gib. količina avta / pridobljena predmeta pri 120; prič. = 1,35·m/(M+m))
| vrsta kg | n | dv% sredina | dv% zamik 0,6 m | vo/v | h | pA/pP | prič. % |
|---|---|---|---|---|---|---|---|
| cone 3 | 31/26/26 | 4,9/11,6/11,5 | 0,7/1,3/1,3 | 0,83/0,32 | 3,7 | 82,2 | 0,35 |
| tyre 9 | 58/27/27 | 17,2/29,9/31,6 | 2,7/5,1/4,5 | 0,81/0,32 | 3,7 | 70,8 | 1,05 |
| bale 26 | 110/29/28 | 42,8/49,7/62,3 | 4,2/16,4/16,2 | 0,84/0,32 | 3,7 | 53,0 | 2,98 |
| bstack 78 | 97/69/27 | 45,1/59,3/61,8 | 8,3/28,1/37,7 | 0,87/0,41 | 3,7 | 73,6 | 8,57 |
| mlamp 5 | 56/37/27 | 13,2/24,7/19,0 | 1,7/1,8/1,6 | 0,83/0,32 | 3,5 | 105,4 | 0,58 |
| barrel 12 | 2/1/1 | 3,7/1,9/1,9 | 1,9/1,9/1,9 | 0,83/0,32 | 0,9 | 3,4 | 1,39 |
| bboard 16 | 1/1/1 | 2,6/2,6/2,6 | 2,6/2,6/2,6 | 0,48/0,14 | 0,3 | 7,7 | 1,85 |
| hydrant 45 | 2/1/1 | 8,5/4,5/4,5 | 4,5/4,5/4,5 | 0,84/0,32 | 0,9 | 2,1 | 5,08 |
| lamp 110 | 1/1/1 | 4,5/4,5/4,5 | 4,5/4,5/4,5 | 0,42/0,32 | 2,0 | 1,1 | 11,79 |
| shelter 220 | 1/1/1 | 4,5/4,5/4,5 | 4,5/4,5/4,5 | 0,51/0,26 | 2,5 | 0,6 | 21,68 |

**B. Zamik zadetka 0/0,2/0,4/0,6/0,8/1,0/1,2 m**
| predmet km/h | n | dv% |
|---|---|---|
| cone 60 | 31/14/5/2/2/2/0 | 4,9/1,9/0,9/0,7/0,7/0,6/- |
| cone 200 | 26/5/4/3/2/1/0 | 11,5/2,4/1,7/1,3/1,0/0,5/- |
| bale 60 | 110/21/11/1/1/1/1 | 42,8/18,1/9,5/4,2/4,2/4,2/4,2 |
| bale 200 | 28/9/6/5/4/2/1 | 62,3/29,8/21,1/16,2/13,2/5,8/4,2 |

**C. Isti predmet, avti 165/680/1150/5300 kg, 120 km/h** (dv%): cone 11,3/11,6/11,6/11,4; bale 48,1/49,7/49,7/52,1; shelter 4,5 pri vseh; ležeč pokrov 2,5 pri vseh; drseč pokrov 7,8/12,8/12,7/10,3
**D. Počasi 5/15/30 km/h** (dv%; pot predmeta m): bstack 18,0/25,4/21,1; shelter 0,7/7,4/7,8 (0,1/4,6/2,9 m); lamp 0,7/2,3/6,8 (0,1/0,2/4,6 m); hydrant 2,5/4,5/8,2

**E. Odpadli deli** (m = igralna masa; dv% (n) pri 60/120/200 km/h, v sredino)
| del (m) | leži | drsi 6 m/s | leti 0,7 v | tik pred avtom | lasten del |
|---|---|---|---|---|---|
| mirrorL (1) | 0,2 | 0,9 (3)/1,2 (4)/1,0 (4) | 1,3 (4)/0,6 (2)/0,4 (1) | 2,2 (7)/1,6 (5)/1,1 (4) | ne zadene |
| fenderL (5) | 1,0 | 4,5 (3)/4,8 (3)/3,7 (3) | 4,8 (3)/3,1 (2)/2,0 (1) | 7,8 (5)/5,0 (3)/3,1 (2) | -/-/2,0 (1) |
| bumperF (7) | 1,4 | 6,1 (3)/6,6 (3)/4,9 (3) | 6,6 (3)/4,2 (2)/2,8 (1) | - | 8,4 (4)/4,4 (2)/2,9 (2) |
| hood (14) | 2,5 | 9,0 (2)/12,7 (3)/10,9 (2) | 9,5 (2)/8,2 (2)/5,6 (1) | 13,7 (3)/9,6 (2)/7,8 (2) | 12,5 (3)/8,2 (2)/5,6 (1) |

**F. Promet, ljudje, policija** (prvi dotik; e = odboj, p = gib. količina po/pred, prič. = (1+e)·m/(M+m))
| trk (kg) | km/h | dv% avta | prič. % | e | p | opomba |
|---|---|---|---|---|---|---|
| avto 1300 | 120 | 66,3 | 66,3 | 0,25 | 1,00 | n 7, sunek nosu 23°, w 67°/s, vdor 0,50 m |
| avtobus 12 500 | 120 | 114,4 | 114,5 | 0,25 | 1,00 | avto se odbije nazaj s 17 km/h |
| motor 290 | 120 | 25,2 | 25,2 | 0,25 | 1,00 | vdor 0,15 m |
| kolo 90 | 60 | 21,1 | 9,1 | - | 0,83 | kolo 0,5 v; avto do 42,5 km/h |
| kolo 90 | 200 | 16,9 | 9,1 | - | 0,87 | |
| avto 1300, zamik 0,6 m | 120 | 53,6 | - | 0,01 | 1,00 | sunek 23°, smer +16° |
| avtobus, bok 5° | 60 | 0,6 | - | - | 1,03 | sunek 23°, w 62°/s, smer +15°, vdor 0,11 m |
| tovornjak 32 000, bok 30° | 60 | 0,3 | - | - | 1,00 | w 93°/s, smer +27°, vdor 0,71 m |
| avto 1300, beg | 120 | 53,7 | 53,7 | 0,05 | 1,00 | n 513, vdor 0,05 m |
| pešec 75 | 60 | 8,4 | 6,1–8,3 | - | - | pešec 0,34 v, pA/pP 4,2 |
| patrulja 1750 | 120 | 61,5 | 61,5 | 0,05 | 1,00 | n 214, škoda 10 % |
| patr. motor 430, zamik 0,6 m | 120 | 18,9 | 27,0 | - | 1,00 | zasuk motorja 1019°/s |

**G. Stavba (boxCollide), 120 km/h**: 10°: 99 % hitrosti vzdolž stene, w 124°/s, škoda 6 %; 30°: 95 %, w 344°/s, škoda 45 %; 90°: obstane (e 0), škoda 39 % (17,8 % pri 60, 66,8 % pri 200); skozi steno 0 cm
**H. Stoječa polprikolica 17 300 kg / odstopljen avto 1400 kg** (60/120/200): prikolica: avto po trku −1/−3/−4 km/h, e 0,09, p 1,00, škoda 21/48/83 %; odstopljen: avto po trku 23/46/68 km/h, e 0,12/0,12/0,16, p 0,99/1,00/0,95, škoda 21/48/83 %

**I. Več predmetov hkrati** (60/120 km/h)
| prizor | n | dv% | budnih | predmet-korakov | mir s | pari drug v drugem |
|---|---|---|---|---|---|---|
| 3 skladi gum (9 gum) | 51/52 | 22,4/40,0 | 9/9 | 3232/3655 | 4,5/5,4 | 0 |
| polje 6 × 5 stožcev | 82/35 | 18,8/30,1 | 28/30 | 6585/8517 | 4,2/4,6 | 0 |
| polje 5 × 4 sodi | 6/7 | 16,8/18,4 | 20/20 | 4898/5935 | 4,2/4,1 | 0 |

Čas koraka dirke (Node, 1 avto): 14–85 µs z budnimi predmeti, 5–14 µs brez.

**J. Predmet med avtom in ograjo** (120/200 km/h; avto 20° proti ograji; dv = počasneje kot brez predmeta 1 s po trku; rob = največ čez črto ograje m; skok = premik v enem koraku m)
| vrsta | n | dv km/h | vmin % kontrole | rob | skok |
|---|---|---|---|---|---|
| cone | 26/26 | 9/13 | 82/88 | 0/0 | 0/0 |
| tyre | 119/27 | 24/41 | 22/54 | 0/0 | 0,5/0 |
| bale | 69/148 | 43/79 | 6/4 | 0/0 | 0/0,8 |
| mlamp | 23/15 | 12/12 | 78/89 | 5,8/12,4 | 5,7/12,4 |
| lamp | 2/9 | 4/16 | 88/87 | 2,0/1,8 | 2,0/1,5 |

**K. Ravnina / Spa / Bathurst, 120 km/h** (dv%): cone 11,6/13,2/10,8; bale 49,7/52,8/47,9; bboard 2,6 povsod; ležeč pokrov 2,5 povsod; leteč pokrov 8,2/8,3/5,6

**L. Semenska dirka 13 avtov, vrsta predmetov čez cesto 250 m za štartom** (na plinu)
| proga, predmet | zadelo avtov | n mediana/max | v0 km/h | dv% povpr./max | zaostanek m povpr./max |
|---|---|---|---|---|---|
| Spa, cone | 11 | 18/102 | 55 | 1,6/2,7 | 0,0/1,4 |
| Spa, bale | 9 | 18/55 | 53 | 8,0/26,9 | 3,0/11,2 |
| Bathurst, cone | 6 | 10/29 | 83 | 2,0/3,9 | −0,4/1,0 |
| Bathurst, bale | 5 | 13/23 | 83 | 12,8/22,4 | 4,6/8,2 |

**M. Semenska dirka s trkom: isti avto in isti del**
| proga, postavitev | avto kg | del (m) | čas s | n | v0 | izguba km/h | delež samih stikov % |
|---|---|---|---|---|---|---|---|
| Spa, lm | igralec 960 | fenderL (5) | 7,23–8,11 | 62 | 171 | 121 | 71,4 |
| Spa, formula | igralec 798 | fenderL (5) | 7,44–9,00 | 69 | 162 | 117 | 75,2 |
| Bathurst, formula | tekmec 798 | bumperF (7) | 58,48–58,58 | 8 | 211 | 39 | 20,3 |

### Boksi, pristanek, prevračanje, zanka dirke, splet

Skripte: `tools/trki/boksi-pristanek.js`

**Boksi: dirka, vsi avti v bokse (Race.step, 13 avtov)**
| proga | s | avto-korakov v stezi | hkrati | stari trk (koraki) | trki | prekrivanje duh-duh | duh-trden avto | zid v stezi | škoda |
|---|---|---|---|---|---|---|---|---|---|
| Spa | 300 | 14.540 | 4 | 0 | 0 | 247 kor., do 3,02 m | 1.241 kor., do 1,87 m | 3× (do 15,9 m/s) | 0 |
| Bathurst | 150 | 817 | 2 | 0 | 0 | 152, do 2,65 m | 287, do 1,86 m | 1× (3,0 m/s) | 0 |

**Isti dotik pri 80 km/h: stari trk (inPit) / Simulacija (ravnina, rally, cs)**
| prizor | e | po trku km/h P, O | prečno m/s P, O | sunek nosu ° | pop cm | škoda % |
|---|---|---|---|---|---|---|
| zadaj v stoječega | 0,10 (nova 0,40) / 0,12 | 32,7, 39,6 / 31,9, 40,3 | 0 | 0 | 7,2 / 1,0 | 29,9 / 29,9 |
| bok ob boku 3° | – | 79,9 | 2,59, 2,34 / 0,73, 1,99 | 22,9 / 2,6 | 1,1 / 0,1 | 0 |
| izvoz 30 v bok 80 | – | 30, 80 | 1,70, 2,52 / 0,00, 0,32 | 22,9 / 0 | 0,4 / 1,2 | 2,2 / 0 |

**Meja boksne steze, 80 km/h (Spa, cs / nova)**
| kam | kot | udarec m/s | po 1 s km/h | škoda % |
|---|---|---|---|---|
| boksni zid | 15° / 30° | 5,9 / 11,1 | 55,8 / 42,9 (nova 53,5 / 37,4) | 0 / 0 |
| ograja proge | 15° / 30° | 5,7 / 11,0 | 48,2 / 34,4 (nova 53,4 / 39,0) | 8,8 / 23,8 |

**Pristanek (rally 100 km/h, ravna cesta, JUMP_G 14)**
| padec m | v zraku s | vy m/s (pri 9,81) | izguba hitrosti % | škoda % | odboj | bočni g po pristanku |
|---|---|---|---|---|---|---|
| 0,3 | 0,21 | 2,92 (2,43) | 4,7 | 0 | 0 | 1,56 (brez padca 1,58) |
| 1 | 0,38 | 5,25 (4,43) | 8,4 | 0 | 0 | 1,54 |
| 3 | 0,66 | 9,22 (7,67) | 13,0 | 0 | 0 | 1,52 |
| 6 / 10 | 0,92 / 1,19 | 12,95 / 16,68 | 13,0 | 2,0 / 5,7 | 0 | – |

Tovornjak 3–10 m: −5,2 %, škoda 0. Klanec (1 m, 100 km/h): raven 8,4 %, −8 %: 12,0 %, −15 %: 13,0 %, +8 %: 5,1 % (hitrost glede na cesto povsod 5,2–5,3 m/s); Spa (+4,7 %): 6,4 %.

**Greben (plin drži hitrost)**
| greben | km/h | vzlet + pristanek v istem koraku | korakov v zraku | po grebenu km/h | pojemek g | pravi avto v zraku s |
|---|---|---|---|---|---|---|
| R 60 m, ±15 % | 90 | 0 | 0 | 90,0 | 0,1 | 0,76 |
| | 120 | 48 | 0 | 96,1 | 6,7 | 1,02 |
| | 160 | 43 | 0 | 100,6 | 14,7 | 1,36 |
| | 200 | 39 | 0 | 98,7 | 22,2 | 1,70 |
| R 15 m, ±5 % | 150 | 4 | 0 | 147,1 | 1,1 | 0,42 |
| Bathurst, R 971 m | 503 | 27 | 0 | −26,2 km/h | – | – |

**Padec čez rob (lastna cesta z def.drops)**
| vstop | ven m/s | pada s, m | škoda | nazaj | izguba s |
|---|---|---|---|---|---|
| 60 km/h, 15° | 4,35 | 1,61, 16,1 | +32 % | 18,8 m naprej, 28,8 km/h | 0,68 |
| 120 km/h, 15° | 8,56 | 1,61, 16,1 | +32 % | 38,7 m, 28,8 km/h | 1,30 |
| 20 km/h, 5° | < 2,5 | ne pade | 0 | – | – |

**Prevračanje (setCrash roll)**: v bok ≤ 8,9 m/s 0 %, 9,1–20 m/s 11 %; bočno v ograjo ≤ 9,5 m/s 0 %, ≥ 10,5 m/s 11 %.
| km/h | trk m/s | obrati | traja s | konec km/h | pot m | pojemek g | škoda |
|---|---|---|---|---|---|---|---|
| 50 | 10 | 1 | 1,18 | 33,0 | 15,6 | 0,50 | +4 % |
| 100 | 10 / 16 | 1 / 2 | 1,18 / 1,58 | 71,4 / 70,4 | 31,4 / 42,4 | 0,73 / 0,62 | +4 / +8 % |
| 200 | 10 | 1 | 1,18 | 150,6 | 64,0 | 1,21 | +4 % |

Dirke 90 s: čista 0 trkov nad 9 m/s; igralec namerno v trke: Spa 9 žrebov → 2 prevrata, Bathurst 7 → 1.

**Škoda (rally, %)**
| km/h | 18 | 36 | 54 | 72 | 100 | 150 | 200 |
|---|---|---|---|---|---|---|---|
| v stoječ avto (vsak) | 2,4 | 10,4 | 18,4 | 26,4 | 38,9 | 61,1 | 83,4 |
| pravokotno v ograjo | 6,5 | 20,7 | 34,7 | 48,7 | 70,5 | 100 | – |

| avto, škoda, način | 100 → 6 s plina km/h | ovinek g | brez rok 3 s m |
|---|---|---|---|
| rally cel | 209,4 | 2,38 | 0 |
| rally 50 %, Samo videz / Vklop / Vklop + xHandle | 209,4 / 200,6 / 200,5 | 2,38 | 0 / 0 / 4,21 |
| rally 100 %, Vklop | 190,8 | 2,38 | 0 |
| formula cela / 50 % Samo videz | 273,2 / 256,5 | 3,74 / 3,18 | 0 |

**Zanka (Spa, prvih 30 s; Node, µs na korak, razpon 4 zagonov)**
| avtov | parov/korak (maks) | v dosegu (maks) | korak | pari | široka faza | zidovi |
|---|---|---|---|---|---|---|
| 12 | 66 (66) | 2,2 (11) | 144–215 | 13–16 | – | 12–26 |
| 20 | 10 (42) | 4,0 (21) | 180–238 | 3,0–3,4 | 5,0–5,8 | 19–43 |
| 100 | 64 (144) | 22,5 (60) | 612–894 | 14–22 | 68–76 | 98–215 |

Klic (µs): carCollide zunaj dosega 0,14–0,23, v dosegu brez dotika 0,35–0,52, poln trk Simulacija 2,0–3,1, stari 0,13–1,1; wallCollide prosto 0,8–2,2, v ograji 1,6–4,5.

**Splet (ravnina, rally; sunek lastnega avta km/h, A / B)**
| prizor | lag 0 | lag 100 ms | lag 200 ms |
|---|---|---|---|
| zadaj 100 v 80 | −11,7 / +11,7, e 0,17 | −19,5 / 0, B 0 korakov trka, dotik pri 6,51 m (prav 3,95) | −19,1 / 0, pri 8,82 m |
| zadaj 120 v 60 | −33,7 / +33,7 | −59,3 / 0 | −58,8 / 0 |
| čelno 60 + 60 | −68,7 / +68,7, e 0,12 | −122,4 / +122,4, e 1,00, prekrivanje 1,75 m | −122,5 / +122,5, e 1,01, 3,5 m |
| v bok stoječega 60 | −53,5 / +53,5, B zasuk 18,9° | −61,6 / +0,4, B 0,1° | −61,6 / 0 |
| bok ob boku 100, 3° (zasuk) | 11,4° / 22,5° | 39,3° / 68,8° | brez dotika |

Dve dirki na Spa (opts.remote), zadaj 100 v 80, po 1 s: A −23,9, B −5,9 km/h (ravnina −24,2 / −4,6, z uporom), koraki trka 21 / 0.

## Kar je že dobro (ne pokvari)

- Gibalna količina para se v vsakem klicu carCollide ohrani: napaka 0,00 % v vseh 66 vrsticah klasične in nove fizike (Simulacija); vrstni red para ne vpliva; NaN nikjer.
- Sredinski trki se ujemajo s teorijo sunka z odbojem: 120 km/h v stoječega 53 / 67 km/h (teorija 52,8 / 67,2), izguba energije 49 % (teorija 49,3 %); čelno 120 + 120 km/h izguba 99 %, odboj 14 km/h.
- Dirkaški sunek od zadaj (30 km/h razlike): 103 / 107 km/h, brez zasuka in izgube oprijema, s plinom nazaj pri hitrosti v 0,6 s; z zamikom oba −5° in ravno v 0,7 s.
- Drgnjenje bok ob boku: hitrosti se ne zlepita (120 / 100 km/h ostaneta, A mimo v 1,1 s), pasivni B se zasuka 4–8°, pri 120–200 km/h brez izgube oprijema; premik na klic do 2,5 cm, brez tresenja.
- Lahek dotik v bok (2 m/s): 3–5° pri 60, 120 in 200 km/h, brez izgube oprijema; dotik v sprednji bok nikoli ne zavrti (2–12°).
- Bočni trk v zadnjo os stoječega pri 120 km/h: prvi sunek je natanko tog (B 40,7 km/h in 660 °/s; teorija 41,4 km/h in 657 °/s), B se zavrti 250° in obstane v 0,9 s; trk od zadaj z zamikom zavrti oba za ~120° (tog sunek 330 °/s).
- Prehoda skozi avto v matriki do 200 km/h ni (0 od 4 leg v vseh vrsticah); razmik je mehak (premik do 7,5 cm na korak do 240 km/h zbliževanja), v mirovanju ostane 2 cm prekrivanja brez tresenja.
- Dirka na pravi progi (Spa in Bathurst, Race.step) da iste številke kot merilna ravnina: 120 km/h v stoječega 50 / 65 km/h po sunku in 45 / 58 km/h po 2 s na obeh; bočni trk brez škode enak do 0,2 km/h.
- Vloge v Simulaciji: igralec v tekmeca in tekmec v igralca dasta enak izid do zadnje številke.
- Vnos po trku (brez pedal ali plin, ki drži hitrost) ne spremeni sklepov o trdih trkih: bočni trk v zadnjo os 250° proti 265°, čelni z zamikom 0° v obeh, zadetek v sprednjo os −3° proti −2,5°.
- Gibalna količina pri trku avto-avto: napaka 0,0 % v Simulaciji, Mehki, Kaskaderski in Stari, v obeh fizikah; spremembi hitrosti natanko v obratnem razmerju mas (6,087 = 6,087), razmerje (mA dvA)/(mB dvB) = 1,00 v vseh 60 vrsticah matrike mas.
- Teža goriva se šteje pravilno (fuelKg): polna rezervoarja 6,017 = 6,017; poln proti praznemu 0,950 (burja, 60 kg) in 0,884 (formula, 105 kg).
- Energija se v Simulaciji, Mehki in Stari pri trku ne poveča (največ 0,01 % oziroma 0,1 kJ, številčna napaka).
- Vztrajnostni momenti so realistični: kI/L 0,242-0,300 pri vseh 56 vozilih, prikolice natanko polna škatla (k/L 0,294).
- Nova fizika v Simulaciji ob samem trku ohrani vrtilno količino (manjka 0 %).
- Brez NaN in brez prehoda skozi v vseh tekih (okoli 480, tudi 240 km/h približevanja in 29 t proti 165 kg); največje prekrivanje po trku 13 cm (vlačilca celno), pri avtih do 11 cm.
- Sklop vlačilec + prikolica + avto konča s hitrostjo, ki jo da gibalna količina: avto 80 celno v cisterno 80 -> -70 km/h (teorija -69,9); vlačilec 90 v rep prikolice 60 -> oba 75 km/h po 0,1 s; avto v rep prikolice e 0,09-0,11 z enim sunkom.
- Odboj pada s hitrostjo približevanja (0,15 pri 30 km/h, 0,12 nad ~60 km/h) in je 0 pod 0,5 m/s; smer je prava, sporna je le spodnja meja.
- Sunek v zadnji vogal v Simulaciji (cs): zadeti se zasuka 23 st, izgubi oprijem 0,55, je raven po 1,4 s in pade s 117 na 100 km/h; verjeten izid, ki ga velja ohraniti.
- Lahek avto, ki ga tovornjak zadene v bok, ostane na njegovem nosu (plastičen stik, skupna hitrost po gibalni količini): verjetno.
- Trk v pravi dirki (Spa, Race.step) da enak izid kot na ravnini: lahki 248,7 proti 247,2 km/h pri malo različni hitrosti približevanja, oboje na 0,1 % enako (1+e) vc mB/(mA+mB).
- Skripta je deterministična (dva teka dasta enak izpis) in teče 5-12 s.
- Položni trki (5–30°) ohranijo hitrost po Coulombovem računu: 15°/120 → 106 km/h ob odhodu (račun v·(cos θ − μ(1+e)·sin θ) = 108), 5°/200 → 192 (195), 30°/120 → 84 (88); dejansko trenje je v vsaki poševni vrstici natanko 0,25, v realnem pasu 0,2–0,5.
- Avto je preusmerjen vzporedno z ograjo: izstopni kot 0,1–0,9° pri vpadnem 5–30°, brez odboja nazaj na progo in brez »fliperja« (1–2 dotika; nasprotne ograje pri kotih do 30° ne doseže).
- Masa ne vpliva na spremembo hitrosti, kot pri togi ograji: 15°/120 → 110/111/111 km/h po 1. koraku za 165 kg, 1150 kg in 5300 kg; razlike so samo iz mer in vztrajnosti.
- Z odzivom voznika lepljenja ni: s plinom in volanom stran je avto prost v 0,12–0,53 s in 0,3 m stran za vedno v 0,67–1,09 s (nova 0,75–1,46 s); iz mirovanja ob ograji v 1,33 s (TITAN 2,41 s), brez škode (hit do 1,0 m/s).
- Čelno (60–90°) avto res obstane: 97–98 % energije gre v prvem koraku, pri 60° miruje po 0,35–0,9 s; s polnim plinom nos v ograji obtiči (potrebna je vzvratna), kar je prav.
- Pri običajnih trkih ni vidnega teleporta ne prehoda skozi ograjo: popravek lege je največ vn·dt (25,5 cm pri 120 km/h čelno, 16 cm pri 200 km/h), narejen v istem koraku; pri 200 km/h noben vogal ne ostane čez črto; brez NaN.
- Vožnja po ograji skozi ovinek se ne splača: 180° ovinek R 60 m s prihodom 225 km/h brez volana traja 8,2 s (nova 6,8 s) s škodo 100 % (prvi udarec 30,9 m/s), avtopilot 5,3 s brez dotika.
- En trk samega avta da 1–3 zvoke in 1–2 koraka s škodo; drgnjenje ob ograji ne proži zvoka trka (hit pod 1,5 m/s).
- Preizkusni oval velja za prave proge: Spa in Bathurst dajo iste številke prvega koraka (110–111 km/h, hit 8,5–8,6 m/s); zanka skripte je do bita enaka Race.step (24 od 24 primerov brez odpadlih kosov); prva ograja igralca v dirki s semenom se z ovalom ujema na 3–4 % (123 proti 127 km/h, trenje 0,26 proti 0,25).
- Meritev je deterministična (dva zagona dasta isti izpis) in traja ~11 s; --json in --cv delujeta.
- Promet zunaj bega, prvi dotik: gibalna količina po/pred 1,00–1,03, izguba avta natanko (1+e)·m/(M+m) pri e 0,25: avto 1300 kg 66,3 %, kombi 84,5 %, avtobus 114,4 % (odboj nazaj s 17 km/h), tovornjak 120,6 %, motor 25,2 %.
- Beg pred policijo (crashCollide, Traffic._hitVehP): e 0,05, gibalna količina 0,99–1,00, izguba 61,5 % ob patrulji 1750 kg (pričakovano 61,5), 73,6 % ob kombiju 2900 kg, 27,2 % ob motorju 430 kg; energija −58 do −59 %; vdor le 0,05–0,12 m; škoda 4,2/9,7/17,1 % pri 60/120/200 km/h.
- boxCollide: brez prehoda skozi steno do 200 km/h (0 cm), pod 10° avto drsi (99 % hitrosti vzdolž stene), pod 90° obstane (e 0).
- En sam stik s predmetom je pravega reda: stožec 0,48 % (pričakovano 0,35), znak in sod 12 kg 1,9 % (1,4), tabla zavorne razdalje 2,6 % (1,85), hidrant 4,5 % (5,1). Zadetek stožca z robom avta (zamik ≥ 0,6 m): 0,5–1,3 %.
- Predmeti (razen visokih drogov) in odpadli deli ostanejo znotraj črte ograje (0,0 m čez), tudi stisnjeni med avto in ograjo.
- Kupi predmetov: 30 stožcev, 9 gum ali 20 sodov se umiri v 3,2–5,4 s, noben par ne ostane drug v drugem; avto se na prostem predmetu nikoli ne ustavi (najmanj 33 % kontrolne hitrosti).
- Strošek: korak dobijo samo budni predmeti (30 stožcev: +10–25 µs na korak dirke v Node), odpadlih delov je največ 40 in med seboj ne trkajo.
- Hitrost odpadlega dela po zadetku je 1,10–1,23 v, pod mejo 1 + e = 1,35.
- Stoječa polprikolica in odstopljen avto (carCollide): gibalna količina 0,95–1,00, e 0,09–0,16, škoda 21/48/83 % pri 60/120/200 km/h.
- Meritve z ravnega ovala držijo na pravih progah: Spa in Bathurst se razlikujeta za največ ~3 odstotne točke (stožec 11,6/13,2/10,8 %, bala 49,7/52,8/47,9 %, tabla 2,6 % povsod).
- Tabla zavorne razdalje: en stik, 2,6 %, ostane nizko (0,3 m) in ne leti v avte za sabo.
- Brez mreže trk avto-avto ohranja gibalno količino v vseh merjenih prizorih (odstopanje 0 %), stari trk in Simulacija; škoda sledi pravilu (v - 3,5)·1,6 % oz. (v - 2,5)·2,8 % na 0,1 % natančno.
- Boksi: omejevalnik 80 km/h in duhovi so zanesljivi: 0 trkov, 0 škode in 4 postanki v 300 s z vsemi 13 avti v stezi na Spa; boksni zid in zunanji rob držita avto v stezi z istim odbojem kot ograja.
- Predrta guma sledi pravilu: en žreb na trk, 4 / 26 / 24 / 23 % pri 12 / 15 / 20 / 27,8 m/s (pravilo 5 / 20 / 25 / 25 %); prazna guma zmerno vleče (2,6 m v 3 s pri 100 km/h) in vzame 5-6 % oprijema v ovinku.
- Vrtenje v zraku ugasne (34 → 2,5 °/s v 0,66 s), pristanek je stabilen: brez poskakovanja in brez zasuka nosu.
- Padec čez rob je ponovljiv: 1,6 s, vrnitev na sredino ceste v smeri vožnje s 28,8 km/h, izguba 0,7-1,3 s; počasen avto (pod 2,5 m/s navzven) rob zadrži.
- Prevračanje je privzeto izklopljeno in ponovljivo (žreb iz števca trkov in id avta, brez Math.random); ne sproži se z net avtom, v zraku ali v boksih.
- Cena trkov je majhna: pri 12 avtih 13-16 µs za 66 parov in 12-26 µs za zidove na korak (12-29 % koraka v Node), par zunaj dosega 0,14-0,23 µs; široka faza nad 16 avti zmanjša 4.950 možnih parov (100 avtov) na povprečno 64.
- Splet: pri simetričnem čelnem trku se telefona strinjata o izidu (gibalna količina 0 %); meritev na ravnini se ujema z dvema pravima dirkama na Spa (-24,2 proti -23,9 km/h).
- Samo videz pri običajnih avtih res ne spremeni vožnje: rally pri 100 % škode 209,4 km/h in 2,38 g kot cel avto.

## Vrzeli (ni izmerjeno ali ni gotovo)

- (Avto ob avto (enaki masi)) Različne mase (tovornjak, formula) niso v tem področju: merjen je rally proti rally, za primerjavo kaze (1240 kg) in strega (motor na sredini).
- (Avto ob avto (enaki masi)) Druge različice so preverjene samo s štirimi vrsticami (--cv 2 do 5): Arkada ne ohranja gibalne količine (7–29 %, igralec × 1,7), Stara pri zamiku spusti avta drug ob drugem mimo (čelno 120 km/h: oba naprej z 68 km/h). Stari model v boksih ni merjen posebej.
- (Avto ob avto (enaki masi)) Pričakovane vrednosti so ocene iz mehanike togih teles in običajnih koeficientov trenja, ne iz podatkov poskusnih trkov; pri zasukih in času drsenja je zaupanje srednje.
- (Avto ob avto (enaki masi)) Bok ob boku je odvisen od ravnanja potisnjenega voznika: pasivni B 6°, B s preprostim držanjem pasu 121° pri 60 km/h (xgl 1). Z vožnjo tekmecev (aiControl) na pravi progi to ni preverjeno.
- (Avto ob avto (enaki masi)) Merilna ravnina nima modela škode: časi vrnitve na hitrost so spodnja meja. V dirki s škodo odpadli deli na cesti spremenijo potek po trku (Spa: zasuk 102° namesto 223°); to spada v drugo področje.
- (Avto ob avto (enaki masi)) Samo suh asfalt na ravnem: makadam, trava, mokra cesta, klanec in nagib niso merjeni.
- (Avto ob avto (enaki masi)) Niso merjeni: hitrosti pod 60 km/h (gneča v šikani, pragova 4 in 10 m/s), trki treh avtov, avto med avtom in ogrado, avto v zraku ali na strehi (veja c.air / c.rl v kTake) in avto prijatelja v spletni dirki.
- (Avto ob avto (enaki masi)) Sekanje vogalov nad 200 km/h je merjeno samo v stoječ avto (24 leg); med dvema avtoma v gibanju le head-200-o v štirih legah.
- (Avto ob avto (enaki masi)) Vrtilna količina para pri dolgem naslanjanju (vrstice S in P s 100 ali več sunki) ni smiselna mera, ker se prijemališče seli; orodje jo izpiše samo v --json (L0, LKnock, LAt).
- (Mase, prikolice in različice) Po trku so vnosi nespremenljivi (pred dotikom drži hitrost, po njem brez plina, zavore in volana; pri naslonu in sunku drži hitrost): kaj naredi umetna pamet tekmeca ali igralec po trku, ni izmerjeno.
- (Mase, prikolice in različice) Šest scenarijev po različicah je izmerjenih v klasični fiziki; nova fizika je po različicah samo v tabeli ohranitve (skupki) in pri prikolicah ter mestu zadetka v privzeti različici.
- (Mase, prikolice in različice) Net avto: druga stran (prijateljev telefon, mreža, zakasnitev) ni simulirana; net avto se v meritvi giblje naprej s stalno hitrostjo. Sklep o zamenjavi hitrosti je izpeljan, ne izmerjen.
- (Mase, prikolice in različice) Varnostni avto proti prikolici ni izmerjen (iz kode: ni v race.cars); varnostni avto je izmerjen samo kot zadeti avto.
- (Mase, prikolice in različice) Prikolica pomete stoječ avto: mesto je bilo mogoče najti šele pri 20 km/h (cs) oziroma 30 km/h (nova) s polnim zasukom, pri katerem se sklop sam lomi (pregib 57 in 83 st); številke za sklop niso čiste, zanesljiv je le odziv avta.
- (Mase, prikolice in različice) Razbitine: en sam primer s semenom v Spa; delež na kos je prebran iz formule, ni preverjen po kosih. Vpliv razbitin na lahka vozila ni izmerjen.
- (Mase, prikolice in različice) Vrednosti E-% pri +2 s vsebujejo tudi upor in zaviranje motorja (kamen sam 0,28 g brez plina), niso samo izguba trka.
- (Mase, prikolice in različice) Kotna napaka v cs (manjkajoči zasuk) ne šteje sunka drže csKc, ki avto vizualno vseeno zasuka; merilo meri samo w.
- (Mase, prikolice in različice) Ni izmerjeno: zidovi in ograje (wallCollide je klican, a ravnina nima zidu), promet in policija (crashCollide), boksi (tam velja stari trk za vse različice), mokro, trava in makadam, klanec, prevračanje (XR.roll), predrtje gum, vpliv škode na vožnjo po trku.
- (Mase, prikolice in različice) Hitrosti samo 60 in 120 km/h (prikolice 80-120); nizke hitrosti (pod 30 km/h), kjer odloča prag e in oprijem, niso pokrite.
- (Mase, prikolice in različice) Pri sklopih dP % vsebuje tudi sunek, ki ga v Race._tlStep vzamejo gume klasičnega vlačilca (zunanja sila), zato ni čista napaka trka.
- (Mase, prikolice in različice) Realistične primerjalne vrednosti (odboj po hitrosti, trenje drsenja, trajanje trka, zasuk vlačilca) so ocene iz splošno znane literature in izračunov na roko, brez preverjanja virov v tej seji.
- (Mase, prikolice in različice) Učinki ob ponavljajočih se dotikih (zvok, iskre, tresenje kamere) niso bili del meritve; koliko jih igralec zazna, je področje drugega agenta.
- (Ograja in zid) Stranske ceste (stubPen), nasprotni pas (altC), pasova ob boksih (pitLead) in meje pasu v boksih (inner, bayRoom) so samo prebrani v kodi, ne izmerjeni.
- (Ograja in zid) Rob prepada, otok krožišča in konca odprte ceste so izmerjeni samo na preizkusni cesti (Spa in Bathurst jih nimata, druge proge niso dovoljene). Otok stoji sredi ravne ceste, ne v pravem krožišču; izmerjen je le njegov lastni udarec.
- (Ograja in zid) Rob nove mape in stena predora: Track z ročno nastavljenima track.free / track.wall2; prava mapa (js/newmap.js) teče v brskalniku in ni preverjena.
- (Ograja in zid) Odmik narisane ograje od fizične črte je iz kode risanja, brez slike iz brskalnika; občutek kamere, zvoka in isker ni ocenjen.
- (Ograja in zid) »Plin + volan stran« je preprost krmilnik skripte (cilja črto 2 m od ograje), ne človek; AI avti (hitrost volana 10/s) po trku niso merjeni.
- (Ograja in zid) Vožnja po ograji: en ovinek, brez volana. Pameten voznik (položen prvi dotik, škoda izklopljena) ni merjen; račun kaže, da samo drgnjenje stane pojemek 0,25·v²/R brez škode (hit na korak pod 2,5 m/s), zato je pri izklopljeni škodi lahko hitrejše od oprijema gum.
- (Ograja in zid) Predrtje je izračunano iz pravila (verjetnost), ne vzorčeno z vklopljenimi okvarami; prevračanje samo kot možnost (XROLL.p začasno 1), potek prevrnitve ob ograji ni merjen.
- (Ograja in zid) Cestni vlak z dvema cisternama, mokra cesta, že poškodovan avto ter večji klanec in nagib ceste niso merjeni (izmerjeno: Bathurst −1,3 % in 5,2 %, Spa 2–4,5 %).
- (Ograja in zid) Pričakovane vrednosti so iz splošne odprte literature (merila ograj, čelni preskusi), ne iz podatkov v repozitoriju; za dirkalne pregrade iz gum nimam izmerjenih številk.
- (Ograja in zid) Vrstice s prikolico se spremenijo z --cv 2/3/4 (KC.glT), zato je treba izhodišče vlaka za novo različico izmeriti posebej za vsako različico.
- (Ograja in zid) Matrika teče v zanki za sam avto, brez odpadlih kosov; z njimi se lega po 7 s razlikuje za 0,3–0,7 m (cs) in do 25 m (nova, ker drgetanje razliko poveča).
- (Predmeti, razbitine, promet) Kje in koliko predmetov stoji na posamezni progi: postavi jih graditelj sveta v brskalniku (js/world*.js); v jedru so samo table zavorne razdalje (Spa 8 con, Bathurst 4). Predmeti so bili zato postavljeni z igrinim Race.setProps na izbrana mesta.
- (Predmeti, razbitine, promet) Beg pred policijo, promet na odprti cesti in boxCollide so merjeni na ravni preskusni cesti, zgrajeni z igrinim razredom Track (def.hideout ima samo zamrznjena testna proga); neskončni promet na ravnem ovalu. Hlodi, bodice, zapore in manever izrivanja samo iz kode.
- (Predmeti, razbitine, promet) js/nvwalls.js (nova mapa: ograje 45–160 kg, lahki predmeti 3–35 kg) ni v jedru: ni merjeno.
- (Predmeti, razbitine, promet) Čas koraka je merjen v Node na strežniku (šum ±50 %): 14–85 µs z budnimi predmeti proti 5–14 µs brez; za telefon je to samo red velikosti (--cas).
- (Predmeti, razbitine, promet) Stoječa polprikolica: vlačilec je bil v poskusu zaklenjen (locked), zato hitrost prikolice 1 s po trku ni zanesljiva; številke prvega dotika veljajo. Ta stik je odvisen od različice trkov (--cv) in je področje agenta avto–avto; z --cv 3 se v skripti spremenita samo dela prikolica in dirka.
- (Predmeti, razbitine, promet) Pričakovane vrednosti za sidrane drogove (prag loma) in za prevoz ležečega dela so ocene (standardi, energijska bilanca), ne meritve.
- (Predmeti, razbitine, promet) Število korakov stika pri 60 km/h je kaotično (odvisno od semena do ±50 %, npr. količek 56 ali 110 korakov); trend in red velikosti držita.
- (Predmeti, razbitine, promet) Vzrok skokov lahkih predmetov v enem koraku (bala 1,28 m pri 120 km/h, stožec 0,68 m pri 60 km/h) ni izoliran (verjetno zaporedno izrivanje iz treh krogov avta).
- (Predmeti, razbitine, promet) Pešec je merjen samo stoječ in zadet v sredino; gledalci in živali nimajo trka (samo izris), zato meritve ni.
- (Predmeti, razbitine, promet) Predmeti na klancu, mostu ali v boksih (propFloor) niso merjeni; pri tabli rsboard gre avto v sredini med nogama brez stika (višina plošče ni preverjena).
- (Predmeti, razbitine, promet) Zasuki policijskega motorja ob zamiku 0,6 m (509/1019/1698°/s pri 60/120/200 km/h) ustrezajo togemu telesu z majhno vztrajnostjo, na pogled pa so verjetno preveliki: preveriti v brskalniku.
- (Predmeti, razbitine, promet) Semenske dirke s trkom: seštevek izgube med koraki stika vsebuje tudi ograjo in pnevmatike; delež samih stikov z delom je izračunan iz kode (1 − (1 − k)^n), ne izmerjen ločeno.
- (Boksi, pristanek, prevračanje, zanka dirke, splet) Vzlet na progah z ostrimi grebeni ni preverjen z vožnjo (dovoljeni sta bili Spa in Bathurst, kjer pogoj na ravnem velja šele nad 607 oz. 387 km/h). Branje višin brez vožnje: ouninpohja R 15 m (pogoj od 48 km/h), nring 44 m (82 km/h), harju 152 m, balea 154 m, medvode 175 m, tianmen 176 m (153-165 km/h). Na Spa je bil avto, ki je čez greben peljal poševno, v zraku 2-7 korakov (do 3 mm): skoki v igri verjetno nastanejo le pri bočnem gibanju; ali je dosežek Letalec (skok 40 m) dosegljiv, ni preverjeno.
- (Boksi, pristanek, prevračanje, zanka dirke, splet) Priklopniki (_tlStep, tudi carCollide z duhovi v boksih), promet in policija (tf.step, pol.collide), varnostni avto, drobci (debrisHit), steklo (_glassStep) ter XR.bump, XR.ai in XR.glass so samo popisani v vrstnem redu koraka, niso merjeni.
- (Boksi, pristanek, prevračanje, zanka dirke, splet) Simulacija v prizoru »izvoz 30 v bok 80« igralčevemu avtu ne da nobene hitrosti (19 dotikov, 0 km/h); Stara (cv 5) na progi prav tako pri »bok ob boku«, veja inPit pa da sunek nosu 23°: razlika ni raziskana (področje avto-avto).
- (Boksi, pristanek, prevračanje, zanka dirke, splet) Časi so iz Node na deljenem stroju (razpon do ×1,5 med zagoni); na telefonu niso merjeni. Pri 20 avtih je srednji korak včasih krajši kot pri 12: ni raziskano.
- (Boksi, pristanek, prevračanje, zanka dirke, splet) Splet: samo ravnina in en prizor na Spa; izguba paketov, nihanje zakasnitve, ekstrapolacija ob tišini (do 0,25 s), velika mreža (22 avtov) na pravi progi in razlika škode med telefonoma niso merjeni.
- (Boksi, pristanek, prevračanje, zanka dirke, splet) Prevračanje: pogostost le iz 5 dirk po 90 s; z nastavitvijo ai: 1 4 žrebi brez prevrata; vpliv na AI in na posnetek dirke ni merjen.
- (Boksi, pristanek, prevračanje, zanka dirke, splet) Predrta guma: ali so okvare (opts.faults) v igri privzeto vklopljene in kako pogosta so predrtja v dirki, ni preverjeno; gume Kolibri so merjene z enim trkom.
- (Boksi, pristanek, prevračanje, zanka dirke, splet) Dirka v boksih je najslabši primer (vsi avti hkrati); pri običajni strategiji je prekrivanj manj. Prekrivanje duha s trdnim avtom ob izvozu iz boksov (do 6 s) ni posebej merjeno.
- (Boksi, pristanek, prevračanje, zanka dirke, splet) Pristanek in greben sta merjena s klasično fiziko (cs); pri novi (nova) je koda pristanka enaka (js/core.js 3093-3096), a ni posebej izmerjena.
- (Boksi, pristanek, prevračanje, zanka dirke, splet) Skript v delu pristanek prebere višine vseh pravih prog (Track.elevAt, brez vožnje, testne proge izpuščene); če to ni zaželeno, se funkcija grebeniProg izpusti brez vpliva na druge meritve.

## Napake merilnih skript, ki so jih našli preverjalci

- (avto-avto) POPRAVLJENO v tools/trki/mase-razlicice.js, vrstica 201: zasuk hMax je bil bran z Math.abs(wrap(c.h - X.h0)) in se je ustavil pri 180°. Vrstico sem zamenjal z dvema: X.hU = (X.hU // 0) + wrap(c.h - (X.hP == null ? X.h0 : X.hP)); X.hP = c.h; in X.hMax = Math.max(X.hMax, Math.abs(X.hU) * D) (ostanek vrstice z X.yaw nespremenjen). Nič drugega. Po popravku: »T 120 > zadnja os, zadeti stoji [cs]« 269° (prej 180), »zadeti pelje 60 [cs]« 500° (prej 178); spremeni se 5 vrstic celotnega izpisa (vse z zasukom nad 180°), skripta teče (402 vrstici, --json veljaven). Stolpec »obr po 2 s« (hEnd) ostaja zavit v ±180°. Vrednosti 180/178 st v poročilu merilca mase so torej odrezane.
- (avto-avto) tools/trki/mase-razlicice.js, vrstica 157: net avto se giblje kinematično s stalno hitrostjo in se nikoli ne odzove, zato sta »net avto ga nese 2 s« in oznaka »se-drzi, lepi 2.0s« artefakt makete. Dvojna simulacija dveh telefonov z zamikom (v4.js net) da čelno ±114–115 km/h brez nošenja. Skripte nisem spreminjal.
- (avto-avto) tools/trki/avto-avto.js: izid stikov v zadnji bok je občutljiv na začetno režo (0,3 m pri njih, 0,4 m pri meni premakne −104° s 4 na 5 m/s), zato posamezna vrstica ni ponovljiva številka, ampak vzorec loterije; scenarij »side« z B, ki drži pas (lane(), ojačanje 2,0 na smer), da 121° zaradi krmilnika in ni dokaz o trku. Skripte nisem spreminjal.
- (avto-avto) Moji preizkusi z vlačilci (v5.js) so brez Race._tlStep (trki in stene prikolic); vlačilec in sklop tečeta v Car.step. Bok kabine se ujema z merilcem (10,2° / 48 °/s; 31,2° / 149 °/s), pri potiskanju s cisterno se štetje sunkov razlikuje (227 neprekinjeno proti 137 z 83 ponovitvami).
- (avto-avto) Nisem neodvisno ponovil: miška pod kamnom v prednjo os (mase-zasuk-spredaj), čelni trk burje 1 m iz sredine v vlačilec (mase-vlacilec-tog), razbitine v dirki v Spaju (mase-razbitine-brez-mase: samo koda in ponovitev njihove skripte). Oba izpisa merilcev se sicer ponovita z njunimi tabelami (shranjeno v tools/trki/preverjanje/avto-avto/aa-full.txt in mr-full.txt; mr-full-fixed.txt je izpis po popravku).
- (avto-avto) Preverjeno brez odstopanja (ni napaka opreme, za popolnost): trije avti v vrsti, 120 km/h v dva stoječa, dajo 39/39/41 km/h, gibalna količina 0,00 %, vrstni red parov brez vpliva (v6.js); vrata ob vrata v ovinku na meji odrine zunanjega 2,2 m po 1 s pri 4 m/s brez vrtenja, več kot pri 1,19 g (1,0 m) (v4.js corner); igralec zdrs po sunku ulovi s protivolanom (−23,8° → 0° v 2 s), volan v smer vrtenja da −331° (v4.js catch); vloga igralec/tekmec in vrstni red para pri T-trku ne spremenita izida.
- (avto-avto) Lastne skripte (zunaj repozitorija): tools/trki/preverjanje/avto-avto/v1.js (ogrodje, tbone, slide), v2.js (pit), v3.js (head, mass, deep, go), v4.js (stara, stunt, net, catch, low, corner, cornerpit), v5.js (push, cab, roles), v6.js (trije avti).
- (zid) Matrika (način 'sam', stepLone v tools/trki/zid.js) nima kosov karoserije iz zanke dirke (spawnDebris/debrisHit): vrstice s škodo >= ~50 % (15°/200, 30°/200 in bolj strmo) precenijo hitrost po trku do 31 km/h pri 0,15 s (143 namesto 112 km/h). Njihova kontrola enakosti 'sam' = 'dirka' je zajela samo 15°/120, 30°/120 in 90°/60 (škoda <= 45 %), kjer kosi ne vplivajo.
- (zid) mkRace v zid.js ima damage: 2 (Vklop), privzeto v igri je Samo videz (1). Preveril 30°/200: izid enak do kosov (v0,5 107 proti 110 km/h), torej brez vpliva na sklepe.
- (zid) Preizkus 'po ograji' (ok_already »vožnja po ograji se ne splača«) ni pošten: oval brez walls (4 m trave pred ograjo), jezdec s sredine ceste, prvi udarec 30,9 m/s; primerjalni avtopilot ima skill 1 (srednja raven, meja avta ~1,12). Za ovinke s trdo podlago do ograje sklep ne drži (moja meritev proti skill 1,12: R30 -13,5 %, R60 -7,6 %, R120 +2,8 %).
- (zid) Vnosi matrike: 'nic' je brez plina in volana, 'plin' je idealen odmik od prvega dotika. Manjkata »samo plin« (avto ostane prislonjen > 5 s) in »volan z zamudo 0,3 s«; pri vlačilcu stolpec končnega kota (0°) skrije vrh zloma 63°.
- (zid) Pri točno 90° na ovalu dobi impulz v 1. koraku samo en vogal (v1 14 km/h pri 60), na pravem zidu (Bathurst) oba (10 km/h). Stolpec dh je pri 90° vzet ob odlepitvi (0,02-0,03 s; 1-3°), nos pa konča zasukan 15-27°.
- (zid) Čas 2,9 s do vzporednega nosu velja samo za asfalt do ograje; na Bathurstu (2,5 m trave pred ograjo) 0,5-0,75 s. Štetje preklopov stika (utr) je vezano na okno drs, zato je pri novi fiziki nižje od mojega (23 proti 37 na s pri 15°/120).
- (zid) Nisem mogel preveriti: odmik narisane ograje v brskalniku (samo koda), kamera, zvok.
- (zid) Nobene datoteke v repozitoriju nisem spremenil in nobenega merilnega skripta nisem popravljal (git status kaže tuje spremembe v tools/trki/boksi-pristanek.js in tools/trki/mase-razlicice.js, niso moje). Moji preizkusi so v tools/trki/preverjanje/zid/ (lib.js, p1.js do p15.js, izpisi .txt).
- (zid) Omejitve mojih preizkusov: p1.js zazna prvi stik po prostoru < 3 mm en korak prezgodaj v nekaj vrsticah (eN1/mu1 iz p1 nisem uporabil); v p11.js je vrstica Spa neveljavna (jezdec obtiči), v p8.js Bathurst +1,2 m skok pri t = 0 (postavitev); jezdec po ograji na pravih progah je grob (udarci 31-33 m/s), pametnejši bi bil verjetno hitrejši, a tega nisem meril.
- (zid) Pokrita vrzel (AI po trku ob zid, brez odstopanja): 5-30°/120 so tekmeci od ograje v 0,2-0,7 s in po 1 s vozijo 115-144 km/h (asfalt) oz. 89-90 (Spa, Bathurst); po 60-90° stojijo točno 3,5 s pod 5 km/h, nato odpeljejo (87-112 km/h pri 6 s); nobeden ni obtičal.
- (ostalo) tools/trki/boksi-pristanek.js, PRISTANEK 3 (landRig / grebenZ): greben je gladka analitična ploskev (H.plane.elevAt vrne y = -u²/2R), prava proga pa ima višino med vzorci linearno interpolirano (Track.elevAt, js/core.js 884-892). »0 korakov v zraku« in 120 -> 96 / 160 -> 101 / 200 -> 99 km/h sta lastnost te ploskve, ne igre: na Ouninpohji avto v 150 s poleti 25-krat (1411 korakov v zraku).
- (ostalo) tools/trki/boksi-pristanek.js, grebenProga: Bathurst je preverjen pri 503 km/h in Spa pri 789 km/h (1,3x prag vzleta), hitrostih, ki jih noben avto ne doseže; »Bathurst: 27 korakov, -26,2 km/h« zato ne opisuje igre. Pri hitrostih samovoznika je na obeh progah 0 dogodkov.
- (ostalo) tools/trki/boksi-pristanek.js, netRun, prizor »bok ob boku 100, 3 deg«: krmilnik drive meri odmik in smer glede na ZAČETNO smer vsakega avta (h0 = q[2]); avto B (-3°) zato od 0,4 s naprej ves čas sili po svoji črti v A, oba krmilnika pa do polnega volana rineta v duha. Zasuk 39,3° / 68,8° je odvisen od krmilnika: brez rok 2,8° / 2,8°, z istim krmilnikom na dveh pravih dirkah na Spa 78,4° / 72,0°.
- (ostalo) tools/trki/predmeti.js: zadetki samo v sredino in 0,6 m iz nje; izguba je močno odvisna od zamika (bala pri 120 km/h: 50 % v sredino, 4 % z robom, povprečje po širini 19 %), zato »14-33x preveč« velja le za pas ±0,1 m.
- (ostalo) tools/trki/predmeti.js, del »ograja« na lastni ravni progi »krog«: najmanjša hitrost 6 / 4 % kontrolne in 148 korakov stika pri 200 km/h se na Spa in Bathurstu ne ponovita (31-42 %, 26-29 korakov); rezultat je občutljiv na geometrijo ograje, primerjati ga je treba na pravi progi.
- (ostalo) tools/trki/predmeti.js, del »dirka«: »delež samih stikov« (71,4 %, 75,2 %) je izračunan iz formule 1 - (1 - k)^n, ne izmerjen; neposredna meritev (hitrost pred fazo debrisHit in po njej v Race._step) da 117,7 km/h (Spa lm) in 105,3 km/h (Spa formula), torej se ujema.
- (ostalo) tools/trki/predmeti.js, »koraki znotraj avta«: merilo upošteva višino, zato svetilka (središče 4,5 m) šteje 0; v tlorisu je njeno središče 54 / 27 / 14 korakov znotraj obrisa avta.
- (ostalo) Pri 60 km/h je število korakov stika lahkih predmetov kaotično (stožec 29-40, guma in zaboj ±20 % med Spa, Bathurstom in ravnino): odstotki pri 60 km/h so zanesljivi na ±20 %, pri 120 in 200 km/h na ±10 %.
- (ostalo) Brez lastne neodvisne meritve (samo ponovni zagon skripte in branje kode): predmeti-kolesar-pesec, predmeti-promet-krogi, boksi-samo-videz-krilo, boksi-skoda-vklop-vodljivost, boksi-steza-duhovi, boksi-zid-brez-skode; pri boksi-splet-zadaj ni preverjen prizor »v bok stoječega«, pri boksi-pristanek-izguba-brez-odboja bočni pospešek po pristanku. Prevračanje (boksi-prevrat-*) je privzeto izklopljena možnost, kar zmanjša občutek teh dveh odstopanj.
- (ostalo) Nobene merilne skripte nisem spremenil; tools/trki/ in ostali repozitorij so nedotaknjeni (obe skripti se ponovita brez napak: predmeti.js 31,7 s, boksi-pristanek.js 19,3 s, številke enake poročanim). Lastne preverbe: tools/trki/preverjanje/ostalo/ (lib.js, greben.js, predmet.js, del.js, stisk.js, splet.js, splet2.js, pristanek.js, skoda.js, tezki.js, tresenje.js).

## Cilji

### Iz referenčnih videov (`docs/nova-fizika-meritve.md`)

| Merilo | Vrednost | Kje |
|---|---|---|
| Vzorec meritev trkov na posnetkih | 70 dogodkov, potrjenih na sličicah: 15 mestni, 40 turni, 15 formula; večinoma bok ob bok; vsi trije videi single player (V1 44 min, V2 5,3 min, V3 35 min) | docs/nova-fizika-meritve.md, viri (vrstice 3–8) in razdelek 3 (vrstice 57–60) |
| Skok vrtenja (ω) ob trku, p50 / p90 | vsi 30 / 50 °/s (mestni 33 / 49, turni 30 / 43, formula 32 / 62) | docs/nova-fizika-meritve.md, razdelek 3, vrstica 61 |
| Sprememba smeri ob trku, p50 / p90 | vsi 2,4° / 7,8° (mestni 2,5 / 5,8; turni 2,2 / 7,8; formula 3,7 / 9,5) | docs/nova-fizika-meritve.md, razdelek 3, vrstica 62 |
| Poravnava po trku, p10 / p50 / p90 | vsi 0,2 / 1,0 / 2,4 s (mestni 0,4 / 1,5 / 2,6; turni 0,2 / 0,8 / 2,0; formula 0,3 / 1,2 / 2,5) | docs/nova-fizika-meritve.md, razdelek 3, vrstica 63 |
| Izguba hitrosti ob trku, p50 / p90 | vsi 1,4 / 5,3 m/s (n = 43; mestni 1,0 / 5,1 (12), turni 2,0 / 5,3 (25), formula 1,1 / 5,1 (6)) | docs/nova-fizika-meritve.md, razdelek 3, vrstica 64 |
| Bočna hitrost odboja | neto ≈ 1–1,5 m/s, največ ≈ 3,5 m/s (V3, n = 22, šum 1,5 m/s) | docs/nova-fizika-meritve.md, razdelek 3, vrstica 65 |
| Močan trk v skupino | zasuk 30–40°, poravnava 0,5–0,7 s (V1) | docs/nova-fizika-meritve.md, razdelek 3, vrstica 66 |
| Verižni trk ob ogradi | avto 90° bočno, ≈ 1,6 s stoji, v 3 s spet 23 m/s (V3) | docs/nova-fizika-meritve.md, razdelek 3, vrstica 66 |
| Negotovost meritev posnetkov | hitrost ±10 % (V1 ±10–15 %), ω kamere ±5 % (proga C ±10 %), pojemek ±20 %, zasuk avta ±30 % oz. ±8° | docs/nova-fizika-meritve.md, razdelek Negotovost, vrstice 12–17 |
| Primerjava 27. 10. 2026: skok ω / smer / bočno / izguba hitrosti | posnetek 30 °/s / 2,4° / 1–1,5 m/s / 1,4 m/s; nova fizika 35 °/s / 3,7° (telo 7,6°) / 1,2 / 1,5; klasična 70 °/s / 3,8° / 1,4 / 1,2 | docs/nova-fizika-meritve.md, razdelek 6, vrstica 117 |
| Gostota polja na posnetku (določa število stikov) | razmik v koloni 1,33 dolžine ≈ 0,2 s (klasična 4,6 dolžine, 0,49 s); tekmec ob igralcu 23–33 % (klasična 11 %); prehitevanja 7,6–10,8 na minuto; razvlečenje 1,1–2,2 % kroga | docs/nova-fizika-meritve.md, razdelek 8, vrstice 160–163 |
| Močni stiki (> 3 m/s) in zasuki čez 40°, 12 prog × 400 s (meritev igre) | klasična 74 stikov / 2 zasuka; klasična + nastavitve nove 261 (3,5×) / 2; nova 103 / 0 | docs/nova-fizika-meritve.md, razdelek 8, vrstice 164–168 |
| V dirki 28. 10. 2026 (8 prog × 150 s) proti posnetku | klasična skok vrtenja 73 °/s in smer 12,9° v 0,5 s (posnetek 30 °/s, 2,4°); nova 35 °/s in 6,3°; bočno ob lahkih stikih 1,1–1,2 m/s (posnetek 1–1,5) | docs/nova-fizika-meritve.md, razdelek 8, vrstica 179 |
| Kontrolirani trki 28. 10. 2026 (BURJA R7, hitrosti po stiku; izhodišče) | naletni 72 → 36 km/h: A 52, B 56 (nova 47 / 61); 100 km/h v stoječ avto, sredina: A 45, B 55 (nova 30 / 70); zamik 0,9 m: A 72, B 38, smer A −13°, B +3°; bok ob boku 100 km/h, B zavije za 15°: A 96, B 103, smer A −17°, B +8° | docs/nova-fizika-meritve.md, razdelek 8, vrstice 172–177 |
| »Realističen trk« 29. 10. 2026: izmerjeni vzroki odboja in takratni cilji | okrogla konca: do 15 km/h bočno pri zamiku 0,6 m; sunek smeri (tapT 1,5 s) se kopiči do 23°; skok položaja 16–30 cm; cilj: skok 1–2 cm, »narazen« 0–0,2 km/h (privzeto 5–60 km/h), naletni 120 → 100 z zamikom 0,6 m: 1,3–2,0° in 4–5 km/h bočno (privzeto 6,3°, 15 km/h) | docs/nova-fizika-meritve.md, razdelek 8 »Realističen trk«, vrstice 185–202 |
| Število stikov nad 5 km/h v 120 s, 12 tekmecev (meritev igre) | privzeto Spa 15, Monaco 20, Suzuka 8, Bathurst 6; ravni odbijači brez prilagoditve tekmecev 41–52 (3–7×); s prilagoditvijo 14–48; močnih stikov (> 14 km/h) 0–3 na dirko, zasukov čez 40° nič | docs/nova-fizika-meritve.md, razdelek 8, vrstice 206–215 |
| »Trki brez odboja« 31. 10. 2026 (pozneje zavrnjeno, a številke kažejo, kaj je uporabnika motilo) | tekmec pri 100 km/h pod 15° vame: vstran 27 km/h in zasuk 16,5° → 4 km/h in 0,9°; v zadnji vogal pod 17°: 24 km/h, 7,4° → 3 km/h, 0,1°; v dirkah sunek smeri do 126° (privzeto) → 0°, skok položaja 12 cm → 0,4 cm, potisk vstran med daljšim stikom 71 → 22 km/h; Razbijanje: odboji in vrtenje: odboj do 48 km/h, zasuk do 166° | docs/nova-fizika-meritve.md, razdelek 8 »Trki med avti brez odboja«, vrstice 221–237 |
| Uporabnikova zavrnitev 2. 11. 2026: kaj je bilo narobe (izmerjeno) | 8× težji drugi avto: od zadaj 120 → 100 km/h: jaz v trenutku na 100 (−20 km/h), drugi se ne premakne; 100 km/h v stoječ avto: 0 km/h kot v zid; oplazenje pod 15°: 28 km/h vstran, 16,5°; drgnjenje 0,5 = »magnet«. Stari privzeti: vsak dotik (tudi 1,7 m/s) zasuka do 23° (tapT 1,5 s ≈ 10× več kot pravi avto), do 21 km/h vstran, poskok do 16 cm | docs/nova-fizika-meritve.md, razdelek 10, vrstice 261–265 |
| Simulacija: odboj po hitrosti in poskok položaja | odboj 0,24 pri 2 m/s, 0,15 pri 8 m/s, 0 ob naslonu (pod 0,5 m/s); poskok položaja pod 3 cm (3,2 cm pri 100 km/h naravnost v stoječ avto); vogal ostane v 0,05 s največ 3,5 cm | docs/nova-fizika-meritve.md, razdelek 10, vrstica 282 |
| Kontrolirani trki 2. 11. 2026 po različicah (Simulacija; v oklepaju druge) | 100 km/h v stoječ avto po 0,25 s: 43 / 55 km/h (Stara 44 / 54, Arkadna 55 / 75, Mehka 46 / 52, Kaskaderska 39 / 59); od zadaj 120 → 100, zamik 0,6 m: 2,0° / 2,1°, 0,5 m/s vstran (Stara 6,3° / 6,6°, 2,3 m/s); zdrs vame pod 3° (1,5 m/s): 0,9 m/s, 1,7°; pod 6° (2,9 m/s): 1,8 m/s, 3,1°; zadnji vogal pod 17° (PIT, 8 m/s): 34°, oprijem nazaj v 0,6 s (Arkadna 3,8°, moj PIT nanj 54°, Mehka 5,7°, Kaskaderska 81°, Stara 7,0°); sprednji vogal pod 15°: 7,4°; vštric 110 / 90 km/h naslon 1 s: 111 / 90 (ne zlepita se); 60 km/h v bok avta, ki prečka s 30 km/h: zasuk 152° (Stara 6°, Mehka 64°, Arkadna 180°) | docs/nova-fizika-meritve.md, razdelek 10, vrstice 271–280 |
| PIT in vrnitev oprijema: cilj iz posnetka | zasuk 30–40°, avto spet raven v 0,5–0,7 s; igra: 34° in 0,6 s (glT); izguba oprijema nič pod ~15 km/h, polna od 36 km/h (KG_V0, KG_V1); med tekmecema pol (glR 0,5) | docs/nova-fizika-meritve.md, razdelek 10, vrstice 284 in 288; docs/igra.md, vrstice 147 in 154 |
| Ozke proge, 120 dirk (varovalna meritev) | novi trk sprva 231 udarcev v ograjo in 50 vrtenj, stari 96 in 0; po popravku 146 in 16; dotikov nad 2 m/s 6 900 proti 2 900; trdih trkov (> 8 m/s) 0–2 (stari 0–6) | docs/nova-fizika-meritve.md, razdelek 10, vrstice 288–289 |
| V dirkah 2. 11. 2026 (8 prog × 150 s) proti posnetku: igralec | skok vrtenja p50 / p90: posnetek 30 / 50, Stara 63 / 74, Simulacija 34 / 97, Arkadna 24 / 87 °/s; smer v 0,5 s: 2,4 / 7,8°, 3,4 / 7,5, 3,0 / 9,4, 3,8 / 7,5; vstran p50 / p90: 1–1,5 (največ 3,5), 0,75 / 1,85, 1,79 / 3,14, 1,29 / 3,53 m/s; poravnava p50: 1,0, 1,10, 0,89, 0,87 s; vrtenja (zdrs > 40°) 1 / 1 / 0; zlepljena avta 0; dotiki (tekmeci + igralec) 116 + 24, 195 + 23, 167 + 14 | docs/nova-fizika-meritve.md, razdelek 10, vrstice 297–305 |
| Hrup meritev v dirkah | igralčevih dotikov le 14–24 na meritev; pri isti fiziki poravnava p50 0,97–1,76 s, skok vrtenja p90 67–79 °/s; zanesljivejši so kontrolirani trki | docs/nova-fizika-meritve.md, razdelek 10, vrstica 307 |
| Štart z 22 avti, 40 s, 5 prog (varovalna meritev) | koraki s sunkom smeri nad 10°: Stara 1698 / 747 / 495 / 3323 / 653, Simulacija 73 / 100 / 92 / 72 / 2; vrtenj 3 proti 0; trdih dotikov (> 3,5 m/s): Stara 10 / 12 / 4 / 28 / 2, Simulacija 48 / 18 / 14 / 80 / 6; največji zdrs v polju 25–46° proti 22–34° | docs/nova-fizika-meritve.md, razdelek 10, vrstica 309 |
| Čas fizike in veliko polje (varovalna meritev) | 100 avtov 0,56 ms na korak (Stara 0,73), 22 avtov 0,25 ms (0,26); polje 100 avtov: trdi trki 0,048–0,128 na avto na minuto; vštric 3 m/s narazen se ne smeta zlepiti (prej stik 100 % časa, zdaj 28–36 %) | docs/nova-fizika-meritve.md, razdelek 10, vrstica 309; razdelek 9, vrstice 254–255 |
| Številke različic v opisu igre | Simulacija: odboj 0,3 → 0,12, drgnjenje 0,35, poln zasuk; Arkadna: tvoj avto 1,7× težji, odboj 0,4 → 0,2, drgnjenje 0,15; Mehka: odboj 0,15 → 0,06, 60 % zasuka; Kaskaderska: zasuk 1,5, drgnjenje 0,5, oprijem nazaj po 1,3 s, PIT ~80°; Stara: odboj 0,1, dotik zasuka do 23°; gume odrgnejo bočni potisk v 0,006 × hitrost s (0,17 s pri 100 km/h); zasuk nosu 0,0055 s na m/s; blisk isker nad 7 m/s | docs/igra.md, razdelek »Trki med avti«, vrstice 141–158 |
| Zid v kodi (izhodišče, ne cilj) | wallE 0,05 (odboj), wallMu 0,25 (drgnjenje), wallYaw 0,3 (delež zasuka iz ročice); Stara: carE 0,1, tapT 1,5 s, tapMax 0,4 rad (23°) | js/core.js, vrstice 1978–1985 (CSK) |

### Dosedanje odločitve uporabnika o trkih

- 28. 10. 2026: po preizkusu uporabnik ostaja pri klasični fiziki; nastavitve tekmecev in trkov so zato neodvisne od fizike, privzeto je vse kot prej. Nova različica trkov mora delovati pri klasični fiziki (in pri novi). (docs/nova-fizika-meritve.md, razdelek 8, vrstica 154)
- 29. 10. 2026: pri slogu »Težak, brez odboja« je uporabnika motilo troje: še vedno odboj od avta, drugi avto se da preveč premakniti, ob trku se zasveti (blisk isker). (docs/nova-fizika-meritve.md, »Realističen trk«, vrstica 183)
- 30. 10. 2026: pri 100 tekmecih se avti »vlečejo kot magnet«: avta vštric se ne smeta zlepiti, drgnjenje samo ob udarcu (nad 0,5 m/s) in s pravima masama. (docs/nova-fizika-meritve.md, razdelek 9, vrstice 247 in 254)
- 31. 10. 2026: pri »Realističen, težak« še vedno odbijanje; uporabnik je želel en gumb, ki povozi vse nastavitve trkov med avti; ograja in iskre ostanejo, kot so. (docs/nova-fizika-meritve.md, »Trki med avti brez odboja«, vrstice 219 in 226)
- 2. 11. 2026 (poročilo iz orodja za napake, Monaco, različica c55b18c0): zadeti avti so pretežki (8×, ne da se jih premakniti), tvoj avto ob trku čudno zavira in se premika; »niti prej niti zdaj ni v redu«; trki naj bodo kot v drugih dirkalnih igrah, z več različicami za hitro primerjavo, iskre nazaj, ograja (zid) ostane, kot je. Slog »Realističen, težak« in gumb »brez odboja« odstranjena (nova veja nadomesti #254). (docs/nova-fizika-meritve.md, razdelek 10, vrstica 261 in razdelek 8, vrstica 243; docs/igra.md, vrstici 139 in 188)
- 2. 11. 2026: pet različic v Nastavitvah in v pavzi (velja takoj): Simulacija (privzeto), Arkadna, Mehka, Kaskaderska, Stara; na dirki s prijatelji vedno Simulacija, preizkusne nastavitve se na spletni dirki ne uporabijo. (docs/igra.md, razdelek »Trki med avti«, vrstice 139 in 152–160; razdelek »Preizkus: tekmeci in trki«, vrstica 164)
- 2. 11. 2026: ograja, beg pred policijo (crashCollide) in promet ostanejo, kot so bili; v boksni stezi trki kot pri Stari; odboj od ograje je pri obeh fizikah enak kot prej. PIT patrulje ostane del pregona. (docs/igra.md, vrstici 125 in 150; docs/nova-fizika-meritve.md, vrstica 239)
- 2. 11. 2026 (posledica pregleda): tekmeca, ki se dotakneta, izgubita le pol oprijema (glR 0,5), da se na ozkih progah ne vrtita v ograjo; varnostni avto oprijema ob trku ne izgubi nikoli; avta, ki že drsi, dotiki vogalov ne vrtijo še bolj. (docs/igra.md, vrstica 147; docs/nova-fizika-meritve.md, vrstice 284, 288 in 290)
- 2. 11. 2026: različica Stara ostane bit za bitom enaka (golden 336/336); testa obremenitve telefona (perf, fleet) vozita s Staro kot ob zapisu referenc. Nova različica ne sme spremeniti Stare in referenc. (docs/nova-fizika-meritve.md, razdelek 10, vrstice 267, 292 in 293)
- 3.–4. 11. 2026: polje nad 21 tekmecev začne na krožni progi z letečim startom, ker se štart z mesta s 100 avti po novih trkih zagozdi (vzrok večinoma LOD oddaljenih avtov); več vrtenja ob dotikih bi to poslabšalo. (docs/meni-izbira-proge.md, vrstica 104; docs/nova-fizika-meritve.md, razdelek 9, vrstica 256)
- 5. 11. 2026: pull request #202 (»Fizika vožnje vrnjena na stanje pred spremembami«) zaprt po odločitvi uporabnika: nova fizika in trki ostanejo, kot so na main. (docs/vrsta.md, vrstici 34 in 90)
- Poškodbe avtov so privzeto »Samo videz« (obstoječi igralci enkrat preklopljeni, tdgp-defaults-v5); pri Samo videz in Izklop tekmeci zaradi poškodb ne pridejo v bokse; kolo odpade samo pri Vklop. Datum v dokumentu ni zapisan (v repozitoriju od konca oktobra 2026). (docs/igra.md, razdelek »Razpadanje vozil«, vrstice 815 in 819; vrstica 407)
- Uporabnikova odločitev (datum ni zapisan): trki se na gumah samo vidijo, avto se zaradi njih ne poškoduje; trk gume nikoli ne zažge. (docs/igra.md, razdelek »Gume vsaka zase«, vrstica 366)
- Prevračanje (Razbijanje: prevračanje): močan bočni trk prevrne avto le približno vsakič deseti (prej vsakič), določeno brez naključnih števil dirke (XROLL). Datum ni zapisan. (docs/igra.md, vrstica 823)
- »Razbijanje: odboji in vrtenje ob trku« velja le še pri različici Stara; druge različice zasuk in zdrs naredijo same. (docs/igra.md, vrstica 188)
- KOLIBRI (uporabnikova želja, datum ni zapisan): trk ga stane 3,5-krat manj kot druge avte (knockK), zdrži ~46 povprečnih trkov namesto ~14; maska in zadnji del ostaneta na avtu do 70 % poškodb, konec avta do 70 % zmečkan največ 0,3 m. Močnejši trki v novi različici ne smejo pospešiti razpada. (docs/igra.md, vrstici 822 in 824)
- Tresenje kamere je privzeto izklopljeno v vseh štirih vrsticah, tudi ob trku (2. 11. 2026); pri novi fiziki se kamera vrti največ 2,5 rad/s, »da trk ne sune slike« (odločitev uporabnika 27. 10. 2026). V igri je samo kamera za avtom. (docs/igra.md, vrstici 127 in 486; CLAUDE.md, razdelek »Kamere in grafika«)
- Pragovi, ki so vezani na velikost udarca in jih nova različica ne sme premakniti brez namena: neskončna vožnja se konča ob udarcu v ograjo nad 6 m/s (hitWall) in ob dotiku vozila (sunek nad 3 m/s = trk); predrta guma od ~40 km/h naravnost v oviro; veriga drifta se izgubi ob udarcu; čist krog (AI po tvoji liniji): trk je izguba hitrosti nad 50 m/s² (v steno 100–150). (docs/igra.md, vrstice 230, 310, 922–923; docs/neskoncna-voznja.md, vrstici 12 in 41; docs/ai-po-tvoji-liniji.md, vrstica 21)
- Boksi: od izvoza s proge do vrnitve je vsak avto duh (ne trči, se ne poškoduje); na cesti boksov avto ne dobi poškodb. (docs/igra.md, vrstici 392 in 825)
- 9. 11. 2026 ob ~18.40: delo na misijah je ustavljeno; dovoljen je le najmanjši popravek, da testi misij po skupni spremembi ostanejo zeleni (misije uporabljajo trke: block, vlečna vrv, prikolica). (CLAUDE.md, razdelek »Posebne misije«; docs/misije.md, vrstice 49–52)
- Testne proge so zamrznjene (3. 11. 2026): meritve in slike trkov na pravi progi z boksi (Bathurst ali Spa); Jezero in Toskana morata delovati (popravi skupno kodo, ne proge). (CLAUDE.md, razdelek »Testne proge«)
- 9. 11. 2026 ob ~21.25 (naloga teme): »Ultracode naj analizera fiziko trkov in naj proba ozboljsat da so trki bolj realisticni.« Okvir: nova različica (delovno ime »Realistična«) v »Trki med avti«, privzeta ostane Simulacija, dokler uporabnik ne potrdi; zidovi in boksi preklopljivo z isto izbiro; poškodbe privzeto Samo videz; vožnja zunaj trkov se ne spremeni; dirka s prijatelji ostane usklajena; obremenitev telefona se ne poveča; na main šele po uporabnikovem »ok« (preizkus na predogledu). (docs/trki-realizem.md, vrstice 3–10; docs/vrsta.md, vrstica 43)

### Resnični trki (odprti viri)

| Trk | Merilo | Razpon | Vir | Opomba |
|---|---|---|---|---|
| Avto–avto, dotik odbijačev, približevanje pod 5 km/h (do 1,4 m/s) | koeficient odboja e | 0,4–0,7 (prileg: 0,72 pri 0,5 m/s, 0,52 pri 1 m/s) | SAE Technical Paper 931842 (1993), »Vehicle Restitution Response in Low Velocity Collisions«; prileg e = 0,1 + 0,9·exp(−0,34·Vc[mph]) iz patentnih spisov US 6470303, 6885981, 7197444 (potrjeno z iskanjem) | Simulacija ima 0,2–0,3 in 0 pod 0,5 m/s: pod resničnim, kar je za igro prav (manj odbijanja ob naslonu). |
| Avto–avto, 7–16 km/h (2–4,5 m/s) | koeficient odboja e | 0,15–0,35 (prileg: 0,30 pri 2 m/s, 0,14 pri 4 m/s; naleti od zadaj ~0,27 pri 18 km/h) | isti prileg; SAE 2013-01-0223 (2013), »A Supplemental Analysis of Selected Two-Vehicle Front-to-Rear Collisions from the NASS/CDS« (potrjeno z iskanjem) | Simulacija 0,24 pri 2 m/s: v razponu. |
| Avto–avto ali avto–tog zid, 25–60 km/h | koeficient odboja e | 0,05–0,2 (običajno 0,1; ~0,15 pri zmečkanju nad 0,2 m; naleti od zadaj proti 0 pri ~58 km/h) | SAE 2010-01-0069; SAE 1999-01-0097 (1999), »Determination and Mechanisms of Motor Vehicle Structural Restitution from Crash Test Data«; SAE 2013-01-0223 (potrjeno z iskanjem) | Simulacija 0,15 pri 8 m/s in 0,12 na dnu: v razponu; zid v igri 0,05: v razponu. |
| Trk pri 100 km/h in več | koeficient odboja e, odbojna hitrost | e 0–0,1; odbojna hitrost 3–10 km/h | SAE 2000-01-0461 (2000), »Structural Rebound Characteristics of the Car Population in Frontal Impacts« (podatki do 100 km/h); nad tem učbeniška ekstrapolacija | Pri zelo trdih trkih naj odboj pade pod dno različice (0,12). |
| Čelno v tog zid, 56 km/h | trajanje sunka, pojemek, zmečkanje | 70–120 ms (starejša vozila 116–120 ms, novejša krajše); vrh ~29 g (povprečje 86 vozil), povprečno 15–25 g; zmečkanje 0,5–0,8 m | NHTSA, 18th ESV (crash pulse modelling); »Homogenization of vehicle fleet frontal crash pulses from 2000–2010« (2012) (potrjeno z iskanjem); zmečkanje učbeniško | Pri 120 korakih na sekundo je to 8–14 korakov: sunek v enem koraku je za oko enak, le položaj ne sme skočiti. |
| Nalet od zadaj in trk pri nizki hitrosti | trajanje sunka | 65–130 ms pri Δv 10–19 km/h; 65–95 ms pri 15 km/h v zid s 40 % prekrivanja | IRCOBI 2014 (16 naletov od zadaj); SAE 2023-01-0624 »Coefficient of Restitution and Collision Pulse Duration in Low-Speed Vehicle-to-Barrier Impacts« (potrjeno z iskanjem, drugi podatek šibkejši vir) | Trajanje se s hitrostjo skoraj ne spreminja (~0,1 s). |
| Oplazenje ograje pod 20–25° | trajanje stika | 0,2–0,5 s: udarec sprednjega vogala, nato »udarec repa« 0,15–0,3 s pozneje | poročila preskusov po AASHTO MASH in EN 1317 (tipičen potek; učbeniško, iz spomina) | Dva sunka: prvi zasuka nos od zidu, drugi (rep) avto poravna vzporedno z zidom. |
| Bok ob bok, pločevina ob pločevino | koeficient trenja med avtoma | 0,3–0,6 (v programih za rekonstrukcijo nastavljiv vhod, pogosto 0,5–0,6); pri oplazenju stik ves čas drsi: tangencialni sunek = μ × normalni | SAE 2007-01-0744 (2007), »On the Concept of Inter-Vehicle Friction…«; SAE 2014-01-0469 (2014), »Analysis of High-Speed Sideswipe Collisions…«; SAE 930654 (1993); številke učbeniške (iskanje jih ni potrdilo) | Simulacija 0,35 in Kaskaderska 0,5 v razponu, Arkadna 0,15 pod njim. |
| Avto ob betonski zid | koeficient trenja | karoserija 0,15–0,4 (v simulacijah 0,15; statično 0,3 / dinamično 0,15); guma ob zid 0,4–0,8 (zato kolo pleza po zidu) | arXiv 2104.01806 (2021), model sredinske ograje; patentni spis US 9057165; študija trenja guma–ograja (Univerza v Ljubljani, Strojniški vestnik) (potrjeno z iskanjem; razpon gume učbeniški) | wallMu 0,25 v igri je v razponu. |
| Avto ob jekleno odbojno ograjo | koeficient trenja | 0,2–0,4 (jeklo ob jeklo suho 0,3–0,5; pocinkano in barva manj) | učbeniško (tabele trenja); splet številke ni potrdil | Jeklena ograja se poda, zato avto dlje drsi in izgubi več hitrosti kot ob betonu. |
| Preskus ograje z osebnim avtom: pogoji | masa, hitrost, kot | EN 1317-2: TB11 900 kg, 100 km/h, 20°; TB32 1 500 kg, 110 km/h, 20° (TB21 / TB22: 1 300 kg, 80 km/h, 8° / 15°); MASH 3-10: 1 100 kg, 100 km/h, 25°; 3-11: 2 270 kg, 100 km/h, 25° | EN 1317-2:2010; AASHTO Manual for Assessing Safety Hardware (2016); poročilo National Academies (2024) (potrjeno z iskanjem; TB21 / TB22 iz spomina) | Bočna hitrost v zid pri teh preskusih: 34–42 km/h (9,5–11,7 m/s). |
| Merila sprejema ograje: kam gre avto | izhodni kot, obnašanje | kolesa ne prečkajo črte A = 2,2 m + širina + 16 % dolžine avta v B = 10 m po zadnjem stiku: izhodni kot do ~15°; po možnosti pod 60 % vstopnega; avto se ne prevrne, ne prepleza in se ne zatakne | EN 1317-2:2010 (izhodno okno); AASHTO MASH 2016; NCHRP Report 350 (1993) (iz spomina; iskanje je potrdilo le obstoj meril) | Zgornja meja: avto po zidu nikoli ne gre nazaj čez progo pod večjim kotom, kot je prišel. |
| Merila sprejema ograje: kako hud je udarec | ASI, THIV, pojemek potnika | ASI ≤ 1,0 (A), 1,4 (B), 1,9 (C); THIV ≤ 33 km/h; MASH: hitrost udarca potnika ≤ 9,1 m/s (največ 12,2), pojemek ≤ 15 g (največ 20,49 g) | EN 1317-1/-2:2010; AASHTO MASH 2016 (20,49 g in 15 g potrjeno z iskanjem; ostalo iz spomina) | Bočni udarec z 9–12 m/s je meja »hudega« trka v ograjo. |
| Tog betonski zid, 100 km/h pod 20–25° | izhodna hitrost in kot | izhodna hitrost 72–88 % vstopne (izguba 12–28 km/h), izhodni kot 3–10° (10–40 % vstopnega), avto drsi ob zidu 3–10 m; hitrost pravokotno na zid (34–42 km/h) je uničena | poročila preskusov MASH TL-3 (Midwest Roadside Safety Facility, Texas A&M Transportation Institute; tipične vrednosti, iz spomina) in sunkovni model Δv = μ·(1+e)·v·sin θ z μ 0,25–0,4 (učbeniško) | Zid avta ne odbije nazaj na linijo: po stiku pelje skoraj vzporedno z zidom. |
| Zid pod 5–10° | izguba hitrosti, izhodni kot | izguba 3–10 % (pri 100 km/h 3–10 km/h), izhod 0–3°, zasuk pod 5°, stik 0,2–0,6 s | sunkovni model z μ 0,25–0,4 (učbeniško) | Oplazenje je drsenje, ne trk: avto ostane vozen in ob zidu. |
| Zid pod 45° | hitrost po trku | ostane 40–50 % hitrosti vzdolž zidu (pri 100 km/h 40–51 km/h), Δv 60–70 km/h, zasuk 20–60° | sunkovni model (učbeniško) | Nad ~30–35° je to trk, ne preusmeritev. |
| Zid pravokotno, 50 in 100 km/h | ustavitev, odboj | avto obstane v 70–120 ms (povprečno 15–40 g); odbojna hitrost 3–7 km/h pri 50 in 3–10 km/h pri 100 km/h; nazaj se odkotali največ 0,5–2 m | NHTSA (preskusi v tog zid, 18th ESV); SAE 2000-01-0461 (potrjeno z iskanjem; razdalja učbeniška) | Po čelnem trku v zid avto stoji; ne odskoči več metrov. |
| Jeklena odbojna ograja (popustljiva), 100 km/h pod 20–25° | upogib, izhod | upogib 0,6–1,2 m, izhodna hitrost 45–70 % vstopne, izhodni kot 5–20°, stik 0,3–0,6 s | poročila preskusov MASH (Midwest Guardrail System; iz spomina, splet ni potrdil) | Popustljiva ograja vzame več hitrosti kot beton, a z manjšim pojemkom. |
| Zid iz gum (3–6 vrst, povezane), pravokotno 60–80 km/h | ustavitev, odboj | preskus: voz 780 kg z nosom dirkalnika pri 60 in 80 km/h; ustavitev v 1–2,5 m, povprečno 9–25 g, 0,1–0,25 s; odboj majhen (e 0,1–0,2), avto pogosto obtiči v gumah; zasnova z vložki do ~5× učinkovitejša | FIA Standard 8861-2000; FIA Standard 3501-2017; SAE 983061 (1998; preskusi TRL za FIA) (potrjeno z iskanjem; pojemki izračunani iz v²/2d) | Gume avto ustavijo mehkeje kot zid in ga ne vržejo nazaj. |
| Jekleno-penasta stena (SAFER) na ovalih | zmanjšanje sunka | do ~50 % manjši vrh bočnega pospeška (47 % v enem preskusu), stena se poda ~0,2–0,6 m, avto zdrsne naprej ob gladki ploskvi | Midwest Roadside Safety Facility (University of Nebraska), poročila o SAFER (2002–) (47 % potrjeno z iskanjem, podajanje iz spomina) | Trajanje sunka se podaljša, hitrost vzdolž stene ostane. |
| Gramozna past in trava | pojemek | gramoz 0,5–1,0 g (ugrezanje), suha trava 0,3–0,5 g, mokra trava 0,2–0,3 g | učbeniško (rekonstrukcija nesreč); splet ni preverjen | Na referenčnem posnetku igre: dve kolesi na travi +0,1–0,15 g. |
| Osebni avto: vztrajnost okoli navpične osi | Izz, polmer vztrajnosti k | 969 kg: ~1 800 kg·m²; 1 403 kg: ~2 900; mali poltovornjak 1 409 kg: ~3 300; k = 1,35–1,55 m (≈ 0,30 × dolžina avta); Izz ≈ m·a·b (±10 %) | NHTSA Light Vehicle Inertial Parameter Database: SAE 930897 (1993), SAE 1999-01-1336 (1999), SAE 2003-01-0966; zapiski predmeta Penn State (potrjeno z iskanjem; k izračunan) | Preveri I avtov v igri proti m·k² s k 1,3–1,5 m. |
| Formula in tovornjak: vztrajnost | Izz | formula 700–800 kg: 900–1 200 kg·m² (k 1,1–1,2 m); dirkalni tovornjak 5 300–5 500 kg: 15 000–22 000 (k 1,7–2,0 m); vlačilec 7–9 t: 20 000–40 000; polna polprikolica 30 t: 300 000–600 000 | ocene iz mer in mase (učbeniško; meritve težkih vozil UMTRI); splet ni potrdil | Isti sunek v vogal zasuka tovornjak 4–10× manj kot avto. |
| PIT (policijski manever): hitrost | hitrost izvedbe | pravilniki: največ 35 mph (56 km/h), ponekod 40–45 mph (64–72 km/h), nad tem smrtno nevarna sila; preskusi 100 voženj pri 25–45 mph (40–72 km/h), posamično do 60 mph | raziskovalni povzetek o PIT (2015, s portlandskim policijskim uradom); pravilniki policij (Albuquerque 2022, kalifornijska prometna policija) (potrjeno z iskanjem) | Do ~56 km/h je izid predvidljiv, nad 70 km/h nevaren (sekundarni trki, prevračanje). |
| PIT: mehanika | sila, čas, izid | stik za zadnjo osjo; bočna sila nad oprijemom zadnje osi (5–6 kN pri 1 500 kg) 0,3–0,6 s; bočno približevanje le 0,5–1,5 m/s, a potisk traja; cilj se zasuka 90–180° v 1–2 s in obstane v 15–40 m (55–70 km/h); zasledovalec izgubi pod 10 km/h | učbeniško (dinamika vozil); povzetek 2015 številk o zasuku v izvlečkih nima | PIT je potisk, ne udarec: majhna bočna hitrost zadošča, če traja. |
| Sunkovit udarec v zadnji vogal med dirko (1 300 kg, Izz 2 100, ročica 1,6 m, 100 km/h) | skok vrtenja in prag vrtenja | bočno 2 m/s: ~27 °/s (zdrs zadnje osi ~2°, gume ujamejo); 4 m/s: ~50 °/s (~4°, ujame); 8 m/s: ~100 °/s (7–8° = meja oprijema: zanese 20–40°, vrtenje brez popravka v 0,3–0,5 s); prag: bočna hitrost zadnje osi nad 0,12–0,17 × hitrost vožnje, v ovinku ali dežju pol manj | učbeniško (sunek togega telesa Δω = J·r/I in kolesni model; lasten izračun) | Posnetek: p50 30 °/s, močan trk 30–40°; Simulacija: PIT pri 8 m/s 34°. Ujema se. |
| Koliko zasuka da sunek vrtenja (ujem gum) | časovna konstanta | zasuk ≈ Δω × τ; τ = Izz·v / (a²·Cf + b²·Cr): cestne gume 0,2–0,25 s, dirkalne ~0,1 s pri 100 km/h; raste s hitrostjo | učbeniško (enosledni model vozila) | V igri 0,0055 s na m/s = 0,15 s pri 100 km/h: v razponu. |
| Avto drsi bočno ali se vrti, suh asfalt | pojemek, pot do stoja | 0,5–0,8 g (vrtenje brez zavor 0,4–0,7 g, bočno ali z blokiranimi kolesi 0,7–0,85 g) = 18–28 km/h na sekundo; s 100 km/h do stoja 3,5–5,7 s in 50–80 m; s 60 km/h 2,1–3,4 s in 18–28 m | »Experimental determination of the translational acceleration values for a spinning vehicle« (2006; ~40 poskusov, osnovni μ povprečno 0,54, največ 0,70); »Drag Factor Attenuation for Rotating Vehicles« (2008); SAE 930653 (1993); SAE 2026-01-0542 (ABS suho 0,90–0,96 g, mokro 0,79–0,82 g) (potrjeno z iskanjem; poti izračunane) | Vrtenje je draga napaka: 1 s bočnega drsenja stane 20–30 km/h. |
| Trajanje vrtenja in ujetega zdrsa | čas | 180° v 1–2 s, 360° v 2–4 s (90–250 °/s); ujet zdrs 30–40° se poravna v 1–2 s | učbeniško; splet ni potrdil | Posnetek igre: 0,5–0,7 s pri 30–40°, mediana vseh dotikov 1,0 s (hitreje kot v resnici). |
| Nalet od zadaj, enaki masi, 100 km/h v stoječ avto | hitrosti po trku | 45 / 55 km/h (e 0,1; brez odboja 50 / 50); središčni udarec ne zasuka | učbeniško (ohranitev gibalne količine) | Simulacija 43 / 55 km/h: ujema se. |
| Nalet 120 → 100 km/h (razlika 20 km/h), enaki masi | hitrosti in zasuk | 108,5 / 111,5 km/h (e 0,15); z zamikom 0,6 m sunek vrtenja ~50–60 °/s na avto, zasuk 5–12° (cestne gume) oz. 3–6° (dirkalne) brez popravka | učbeniško (lasten izračun) | Simulacija 2,0° / 2,1°: na spodnji strani resničnega. |
| Neenaki masi: avto 1 300 kg in tovornjak 5 500 kg, 100 km/h v stoječega | hitrosti po trku | avto v tovornjak: avto 11 km/h, tovornjak 21 km/h; tovornjak v avto: tovornjak 79 km/h, avto 89 km/h; Δv v razmerju mas 4,2 : 1 | učbeniško (gibalna količina, e 0,1) | Težko vozilo lahkega »odpihne« in samo izgubi petino hitrosti. |
| Čelni trk, enaki masi, 50 + 50 km/h | izid | poln: oba obstaneta (Δv ~55 km/h, odboj ~5 km/h), 100–120 ms; zamik 30–50 %: zasuk 30–90° v 0,5–1 s, razideta se z 10–30 % hitrosti | učbeniško; preskusi z majhnim prekrivanjem (64 km/h, 25 %) iz spomina | Čelni trk z zamikom avta zasuka in spusti mimo, ne zlepi. |
| Bočni trk (T): 60 km/h v bok avta, ki prečka s 30 km/h, enaki masi | hitrosti, zasuk | v smeri udarca 27 / 33 km/h; zadeti drsi bočno z ~33 km/h, gume jo odrgnejo v ~1,2 s in 5–6 m; zasuk zadetega 45–180° (udarec pred težiščem: nos stran; za težiščem: vrtenje kot PIT); bočni preskus: voz 1 368 kg pri 54 km/h, Δv zadetega 20–28 km/h, sunek 50–80 ms | učbeniško (gibalna količina); FMVSS 214 (bočni preskus z gibljivo oviro; iz spomina) | Simulacija 152° in Arkadna 180° sta na zgornjem robu; Stara 6° premalo. |
| Bok ob bok (turni avti), bočno približevanje 0,3–1,5 m/s | premik, zasuk, izguba hitrosti | bočni Δv 0,2–1 m/s na avto, premik 5–20 cm, zasuk pod 1–2°, izguba 0–2 km/h; naslon: sila 1–3 kN, trenje 0,03–0,1 g; avta se ne zlepita | učbeniško (sunek in bočna togost gum 80–200 kN/rad na os; lasten izračun); splet številk nima | Posnetek: neto 1–1,5 m/s vstran, smer 2,4°, izguba 1,4 m/s: podobno. |
| Prag prevračanja | SSF = kolotek / (2 × višina težišča) | osebni avti 1,30–1,50; terenci, kombiji, poltovornjaki 1,00–1,30; polni tovornjaki 0,3–0,5 g; na ravnem asfaltu (μ 0,8–0,9) osebni avto zdrsne in se ne prevrne; ~95 % prevračanj je ob oviri | NHTSA, DOT HS 809 868 (2005) in ocene odpornosti proti prevračanju (2001–2005) (potrjeno z iskanjem); tovornjaki in 95 % iz spomina | Prevrnitev na ravnem brez ovire je pri osebnem avtu nerealna. |
| Prevračanje ob robniku, zemlji ali vznožju ograje | potrebna bočna hitrost | teoretični minimum (tog robnik): osebni ~21 km/h, terenec ~15 km/h (4–6 m/s); v preskusih več (modeli podcenijo): ~25–50 km/h; mehka zemlja 40–60 km/h; preskus z vozičkom: 48 km/h bočno pri 23° | SAE 2006-01-0722 »Simple Models for Analysis of Curb- and Soil-trip Rollover Events«; SAE 900366 (1990); SAE J2114 in FMVSS 208 (potrjeno z iskanjem: definicije in 23°; hitrosti lasten izračun in iz spomina) | Pravilo »vsakič deseti« ostane; verjetnost naj raste z bočno hitrostjo nad ~25 km/h in le ob oviri. |
| Avto, ki se kotali | pojemek | 0,4–0,5 g (0,36–0,61), en obrat na ~1–1,5 s | učbeniško (rekonstrukcija prevračanj); splet ni potrdil | Kotaljenje zavira manj kot drsenje na kolesih. |
| Prometni stožec (3–9 kg) | izguba hitrosti avta | pod 1 % (0,3–0,7 % pri 1 300 kg); stožec odleti z 1–1,8× hitrostjo avta ali ostane pod njim | učbeniško (gibalna količina) | Brez opaznega upočasnjevanja, le zvok in let predmeta. |
| Podirljiv drog znaka ali luči | izhodna hitrost avta | preskus s ~900 kg avtom pri 50 / 70 / 100 km/h; razred po izhodni hitrosti pri 100 km/h: NE 70–100, LE 50–70, HE 0–50 km/h; lomljivi drogovi: sprememba hitrosti do 3 m/s (največ 5 m/s) | EN 12767 (2019); AASHTO MASH 2016 in NCHRP Report 350 (razredi in hitrosti potrjeni z iskanjem; meje iz spomina) | Tabla v igri vzame ~2,5 % hitrosti: realno za lahek znak. |
| Bala slame, kup gum, plastična ograja | izguba hitrosti (avto 1 300 kg) | bala 15–25 kg: 1–2 %; nepovezan kup gum 30–50 kg: 2–4 %; prazna plastična ograja 40–75 kg: 3–5 %; polna z vodo 400–900 kg: 25–40 %; lahki predmeti odletijo 5–20 m naprej | učbeniško (plastični trk m_predmeta / (m_avta + m_predmeta)); mase tipične | Lahki predmeti stanejo malo hitrosti; šele nad ~10 % mase avta delujejo kot ovira. |

### Kaj naj »realistično« pomeni v tej igri

1. Igralec s kamere za avtom opazi pet stvari: kam gre avto po trku (smer, zasuk), koliko hitrosti izgubi, ali se odbije, ali zadeti avto reagira po teži, in ali lahko pelje naprej. Realizem naj se meri po teh petih.
2. Ročica: udarec v sredino odrine, v vogal zasuka (Δω = J·r/I); sprednji vogal samo odkloni, zadnji vogal pri hitrosti zanese (prag: bočna hitrost zadnje osi nad ~0,12–0,17 × hitrost vožnje).
3. Trd trk stane hitrost po gibalni količini: enaki masi 100 → 45 / 55 km/h; v 4-krat težji tovornjak 100 → ~11 km/h, tovornjak dobi ~21 km/h in se zasuka 4–10-krat manj.
4. Zid ne vrača na linijo: pod 5–10° drsenje (izguba 3–10 %, izhod 0–3°), pod 20–25° izguba 12–28 % in izhod 3–10° skoraj vzporedno, nad ~45° trk (ostane 40–50 %), pravokotno avto obstane (odboj 3–10 km/h).
5. Odboj pada s hitrostjo: 0,3–0,5 pri dotiku, 0,1–0,15 pri 30–50 km/h, pod 0,1 nad 100 km/h, 0 ob naslonu. Simulacija je tu že blizu.
6. Vrtenje je draga napaka: bočno drsenje zavira 0,5–0,8 g (20–30 km/h na sekundo), 180° traja 1–2 s.
7. Bok ob bok: premik 5–20 cm, zasuk pod 2°, 0–2 km/h izgube; avta se ne zlepita in ne tresejo.
8. Lahki predmeti (stožec pod 1 %, bala 1–2 %, kup gum 2–4 %) odletijo naprej; gume in pena ustavijo mehko in ne vržejo nazaj.
9. Omehčano za igralnost: (a) pri »Samo videz« en trk ne konča dirke (pravi trk 100 km/h v zid uniči avto): hitrost gre, avto ostane vozen; (b) drgnjenje tekmecev ne zavrti vsakič: izguba oprijema šele nad pragom, tekmeci zdrs ujamejo (glR), pod ~15 km/h nič; (c) poravnava hitrejša kot v resnici (0,5–1 s namesto 1–2 s; posnetek p50 1,0 s); (d) prevračanje redko in le ob oviri (1 od 10 ostane); (e) zid ne zatakne avta, slika se ne sune.
10. Merila za lahke dotike ostanejo meritve posnetka (skok ω 30 / 50 °/s, smer 2,4 / 7,8°, vstran 1–1,5 do 3,5 m/s, poravnava 1,0 s, izguba 1,4 / 5,3 m/s); največji odmik Simulacije v dirkah je skok vrtenja p90 97 °/s proti 50 in vstran p50 1,79 proti 1–1,5 m/s (hrupno, 14–24 dotikov).
11. Resnični razponi zgoraj pokrivajo, česar posnetek nima: zid po kotih, tovornjaki, T-trk, čelni trk z zamikom, predmeti, prevračanje.
12. Omejitve uporabnika: ograja je doslej ostala nedotaknjena (2. 11.), zato spremembe zidu samo preklopljivo z novo različico; Stara bit za bitom; spletna dirka Simulacija; pragovi 6 m/s (neskončna vožnja), ~40 km/h (predrta guma) in 50 m/s² (čist krog) so vezani na velikost udarca.
13. Zanesljivost virov: iskanje po spletu je delovalo, branje strani ne (en.wikipedia.org in www.iadlest.org bi morala biti dovoljena v omrežnih nastavitvah seje). Vrstice z oznako »učbeniško«, »iz spomina« ali »lasten izračun« niso potrjene z izvirnikom; izračuni so s sunkovnim modelom (m 1 300 kg, Izz 2 100 kg·m², μ 0,25–0,4).
14. Seznam virov s povezavami: (delovna mapa seje, ni v repozitoriju) trki/viri/viri.txt (v repozitoriju ni spremenjeno nič).
