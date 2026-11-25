# Zapiski: pogled »Nespremenjena vožnja in determinizem« (rok 17:15 UTC)

## 16:19 UTC
- Prebrano: core.diff in game.diff (brez komentarjev), fizika/lib.js, sam.js, det1.js.
- Izmerjeno: še nič.
- Sumi (za meritev): cv 1 po dotiku zidu (knock točka), dmgSteer brez XR.handle, K.hot && dmgMode===2, vrstni red cilja (finishTime), aiHazard v dežju/snegu, uhajanje stanja med dirkami (_aiS, _dFar, _dPen, c.xd, c.eng), testOf/xPhys po načinih.
- Ostane: vse meritve (1)-(4).

## 16:28 UTC – izmerjeno do zdaj
- cmp.js: veja (snap) proti main v koraku, vsi avti, vsak korak (x,z,h,vx,vz,w,y,dmg,cilj,ukazi); dogodki dotika iz zanke (wallCollide, carCollide, debrisHit, propCarHit, aiHazard).
- A. cv 1 na veji NI enak main po dotiku s poškodbo: `CV=1 SETUP=crash DRIVE=1 TRACKS=spa,kotor,seoul,montreal,killar,koli SECS=60 node cmp.js` -> vseh 6 RAZLIKA (spa k=879, kotor k=308 korak po prvem carCollide k=307, seoul k=697, montreal k=267, killar k=389, koli k=411).
- A1. vzrok 1: vlek volana dmgSteer (core.js:2596) vedno vklopljen (main: XR.handle=0). Z `PATCH=pull`: spa, kotor, seoul, montreal ENAKO 60 s (kotor 6108 dotikov avto-avto, 10 poškodovanih).
- A2. vzrok 2: zapeljan odpadli del (debrisHit, core.js:4173): z `PATCH=pull` killar RAZLIKA k=6792 in koli k=842 ob prvem debrisHit.
- B. cv 6 dež/zima/zima+dež/spremenljivo (m1.sh, m1.log, 120 voženj, 20 prog): 0 razlik pred dotikom brez nevarnosti; 61 razlik pred dotikom po aiHazard, vse počasen štarter (v 0.7-1.3 m/s, stuckT 0.81-0.89, dmg 0, t 1.0-1.3 s) = znana fizika-2, v dežju/snegu veliko širše (dež 25/40, zima 19/40, zima+dež 16/20, spremenljivo 1/20); ostalih 59 razlik po prvem dotiku avto-avto.
- ostane: (2) sam avto vreme x avti x škoda, (4) dvakrat v istem procesu, (1) cv 1 do cilja, (3) splet/zaporedje nastavitev, legenda Pikes.

## 16:32 UTC
- C. sam avto brez dotika, veja proti main, 60 s (m2.sh, m2.log; proge spa,gora,kotor,koli,killar,pikes,pikesg,seoul x avti kolibri,formula,ev,truck,levs,strega,jezek,cisterna): cv 6 suho 63/64 ENAKO (pikesg/formula razlika sele ob prvem dotiku ograje k=5647), dez 64/64, zima 64/64, spremenljivo vreme + gume 64/64; skoda 0 + dez 16/16, skoda 1 + zima 16/16; cv 1 dez 16/16. 0 razlik pred dotikom.
- game.js: vlek volana po odlocitvi 17. 11. (trki-vlecenje-tekmeci = 2) velja pri skodi Vklop za vse razlicice; ugasnjen le v spletni dirki (XR.net) -> meriti splet proti main in skodo 0/1.
- ostane: dvakrat.js (4), NET/damage (1,3), cv 1 do cilja na odprti cesti (1), legenda.js (3).

## 16:40 UTC
- D (4. del, dvakrat.js, dvakrat.log): cv 6, zgoscena vrednost celotnega stanja (SIM.raceState): ista dirka na novi Track po dirki na drugi progi, na isti Track, po dirki cv 1 / spletni / s stikali deb 0 pull 0 tf 2, voznja brez dotika pred in po razbijanju: VSE ENAKO na 11 kombinacijah (kotor, killar, koli, spa, seoul suho; kotor, sakhir dez; koli, gora zima; formula 80 s montreal, spa).
- m3.log (KONEC 16:38):
  - splet (setCrash net:1, setTest {}) proti main, razbijanje 60 s: spa, kotor, seoul, montreal ENAKO (tisoci dotikov, 3-10 poskodovanih); killar RAZLIKA k=6792 in koli k=842 = korak po prvem debrisHit (6791, 841).
  - cv 1 skoda 0 (Izklop), razbijanje 60 s: 6/6 ENAKO (spa, kotor, seoul, montreal, killar, koli).
  - cv 1 skoda 1 (Samo videz): spa, kotor, seoul, montreal ENAKO; killar k=6783, koli k=842 = prvi debrisHit.
  - do cilja cv 1 skoda 0: suho, dez, zima x cusco, vaoala, seoul, mombasa = 12/12 ENAKO, 13 avtov v cilju (mombasa suho 12 v 260 s), vrstni red cilja enak.
  - do cilja splet skoda 2 dez: cusco, vaoala, seoul ENAKO (13 v cilju); mombasa RAZLIKA k=6071 (50.59 s) kaze#9: diag.js -> hitDebris 0 / 0.376 (main zadene del, veja ne) = isti vzrok (deli na cesti).
  - sam do cilja cv 6 dez in zima (cusco, vaoala, seoul x rally, formula, truck): 16/18 ENAKO do cilja; cusco/truck razlika ob prvem dotiku zidu (dez k=3042) oz. po njem (zima k=3325, prvi dotik 2970).
- Tece: legenda.js (duh legende Pikes, cv 6 / cv 1 / splet proti main) -> legenda.log.
- Ostane: odstop brez dotika (cmp2.js RETIRE), stikala deb/pull/tf brez dotika.

## 16:46 UTC
- legenda.log (duh legende Pikes, posnemanje pkLegJob/pkLegRun, 24 kombinacij pikes/pikesg x 4 avti x suho/mokro/zima): 23/24 cv 6 = main; pikesg/formula/suho RAZLIKA korak 5647 (47.06 s, prvi dotik zidu), cilj 211.884 / 211.869; cv 1 in splet = main. Kljuc shrambe (PK_LEG_V 1, trk, t, car, n) nima razlicice trkov -> duh je odvisen od nastavitve »Trki« ob izracunu.
- odstop.log (cmp2.js RETIRE, STOP=0): zdrav avto sam odstopi (cv 6): 12 suho + 8 dez; razlike samo ob prvem dotiku zidu (5 primerov), pred dotikom 0.
- odstop2.log: odstop v polju cv 1, korak 240: kotor k=265 in koli k=240 RAZLIKA PRED DOTIKOM (retireBlocked true, 0 poskodovanih). odstop3.js: kotor rally#11 8.85 m/s, zavora 0.8 / 0, plin 0 / 0.15; pred njim strega 4.34 m, 4.39 m/s, dmg 0, ni dnf. koli: zavora 0.8 / 0.12, strega 3.53 m, 6.38 m/s.
- cilj.log: do cilja cv 1 skoda 0: cusco 16 semen, vaoala 8, cusco 20 tekmecev 6 semen = 29/30 enako z enakim vrstnim redom; cusco seme 3: finishPos razlicen (cilj3.js): igralec t 32.2393 in vortex t 32.2398 v istem koraku; main: vortex 9., igralec 10.; veja: igralec 9., vortex 10. (veja po casu). Poti enake do konca.
- stikala.log (samo veja): sam 60 s x 8 kombinacij: cv6 = cv6+deb0/pull0/tf2 = cv6+roll/bump/ai = cv1 = splet (ENAKO). Polje: spa 60 s enako (brez skode); kotor in koli razlika korak po prvi skodi (307->308, 410->411).
- diag.js: splet dez mombasa k=6071: hitDebris 0 / 0.376.
- Tece: kvali.js (simulirane kvalifikacije tekmecev, cv 6 proti main).

## 16:57 UTC (zakljucek)
- kvali.log: simulirani kvalifikacijski krogi tekmecev (vsak sam, cv 6 proti main): spa, montreal, gora 12/12 = 36/36 enakih.
- promet.log (dvoboj na odprti cesti s prometom, opts.traffic, 15-34 vozil, najblizje 2.2-2.9 m):
  - cv 6 proti main: razlika samo ob prvem dotiku zidu ali avta (cusco 1767, vaoala 227 po 222, seoul 225 po 221, mombasa 1353); cv 1 skoda 0: 4/4 ENAKO.
  - promet.js: cv 6 tf 1 = tf 2 = privzeto (40 s, 4/4 ENAKO; dotika s prometom ni bilo); cv 1 tf 2 = cv 1.
  - cusco cv 1 skoda vklop: razlika v koraku prvega dotika zidu k=1767: hitWall 11.395 / 10.547, dmg 0.24905 / 0.22532, hitDebris 0 / 0.362 (cusco.js).
    cmp3.js PATCH=pull,deb: hitrosti enake, dmg se razlicen; PATCH=pull,deb,p3: korak 1767 enak, razlika k=1771 (deli). Vzrok: blok P3 v wallCollide (core.js 4618-4624) ni vezan na cv, samo splet ga izpusti.
  - killar, koli (crash) s PATCH=pull,deb,p3: se vedno razlika po prvem zadetku dela (6881, 843): pravila delov imajo vec sprememb.
- Koncne najdbe: voznja-1 vlek krmila (2597), voznja-2 udarec v zid P3 (4618), voznja-3 deli (4176), voznja-4 vrstni red cilja (9275), voznja-5 retireBlocked (7168), voznja-6 duh legende Pikes (game.js 3269).
- Ni izmerjeno: brskalnik (nacini, predvajanje shranjenih duhov), dejanski dotik s prometom pri tf 1/2, beg pred policijo, demo in sola, LOD ob cilju.
