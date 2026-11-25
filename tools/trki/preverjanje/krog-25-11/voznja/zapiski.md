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
