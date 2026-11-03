/* =========================================================================
   PEOPLE ALONG THE TRACKS, ROUND TWO — more scene types on World.people's kit (js/world-ljudje.js, World.peopleKit), each with its places on the
   real tracks (World.peopleSites). The user, 3. 11. 2026: »naredi še 12 novih različnih ljudi, ki se na različne načine družijo in čakajo na
   tekmovalce«; »na dirkališčih naj bo čim manj ljudi okoli proge, tam naj bo več zaposlenih s svojimi orodji, vozili itd.: reševalci,
   gasilci, sodniki, fotografi, delavci, kamermani, živali«. A scene type: S.<name> = { seed, clear: [[a, b, r]], build(C, F, K) } (the frame
   F: a along the track, + ahead; b from the barrier away from the road); its places: site(trackId, [[name, metres after the start line, side
   (+1 right, -1 left, 'room')], ...]). Test tracks get nothing (World.people does not run on them).
   ========================================================================= */
(function () {
  'use strict';
  const K = World.peopleKit; if (!K) return;
  const { S, L, ITEMX, POSEX, MOTION, RATE, SITES, rnd, pick, box, cyl, sph, grp, bar, pal } = K;
  const site = (id, list) => { (SITES[id] || (SITES[id] = [])).push(...list); };

  // (the scenes of round two follow)
})();
