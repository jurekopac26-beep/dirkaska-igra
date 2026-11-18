/* =========================================================================
   RENDER — evening races (Grafika 05: the user's choice of 3. 11. 2026 on the Odločitve page, »Večerne dirke z reflektorji«: »Zvečer bi se
   prižgale luči na strehah tribun in na drogovih ob progi. Na asfaltu bi bili svetli krogi luči, svetila pa bi se rahlo bleščala. Pri Nizki
   kakovosti bi bili svetli krogi narisani na cesti brez pravih luči.«).
   On a real track (not test: true, those stay as they were until they are deleted: CLAUDE.md) the lights along the track come on at sunset:
   at Večer (todK 0.5) the floodlights on their poles (Render's floodlights, the night's: every 30 m) and the stands' lamps shine at EVE of
   the night's strength, each a pool of warm light on the road and a glow round the lamp (the glare; at Visoka the post pass's bloom too);
   on NIZKA only the pools on the road (no poles, lamps nor glows). An endurance race's evening turns them on as the sun goes down (todK
   0.25 .. 0.45) and up to the night's full strength (0.6 .. 0.9). The stands' lamps (World's stands, js/world-ljudje.js: world.standLamps)
   in the evening and at night: under a roof's front edge a row of lamps, an open stand's on masts along its back; the road in front of a
   stand lit by them (no pole of the track's own between it and the road). A test track's floodlights as before: from late dusk, no lamps
   on its stands.
   A real track's evening is a little later than the golden hour too (dusk: the sun lower and redder, the sky's light bluer and dimmer).
   Render.ext.vecer: { lampK(todK, def), look(todK, def, tier), stands(world, T) (js/render.js: floodlights, floodLook), dusk(K, def, r)
   (applyTheme: the dusk's light) }
   ========================================================================= */
(function () {
  'use strict';
  if (typeof Render === 'undefined' || !Render.ext) return;
  const { sstep } = Core;
  const EVE = 0.6;   // (the lights at Večer, a share of the night's: the pools on the road, the glows; a little more the later the evening, DUSK)
  const DUSK = 0.66;   // (how much later a real track's evening is than the golden hour: 0 as it was .. 1 twilight; dusk below)
  const real = (def) => !!def && !def.test;

  // how strongly the lights along the track shine (0..1) at the time of day todK (0 day .. 0.5 dusk .. 1 night), on a track (its def)
  function lampK(todK, def) {
    const night = sstep(0.6, 0.9, todK);
    return real(def) ? Math.max((EVE + 0.25 * DUSK) * sstep(0.25, 0.45, todK), night) : night;
  }
  // the floodlights' look (js/render.js floodLook) at todK on a track (def) built at a detail tier (0 NIZKA): k their strength (the pools'), bare
  // only the pools on the road (a real track's evening on NIZKA: no poles, lamps nor glows; the night's floodlights whole on every tier, as
  // before), glow the glows' share of their own (a real track's a little fainter in the evening; a test track's as before), refl the wet
  // road's reflections of the lamps (js/render.js updateCars: a real track's as strong as the lamps; none where they are bare)
  function look(todK, def, tier) { const k = lampK(todK, def), r = real(def); return { k, bare: r && tier === 0 && todK < 0.6, glow: r ? 0.4 + 0.6 * k : 1, refl: r ? k : 1 }; }

  // the stands' lamps (world.standLamps: [x, y, z, nx, nz, roof] every 2 m or so along a stand, (nx, nz) the way it faces, roof 1 under a
  // roof's front edge, 0 along its back): a roof's a glow every ROOF m; where a stand has no roof (none of its front edge's lamps within
  // ROOF_W m along it) a mast on its back every MAST m (MAST_H high, its lamp at the top facing the road, a glow round it); the road in
  // front of a stand a pool of light every POOL m (on the stand's half of it, up to REACH m from the lamps: a stand far from the track
  // lights nothing on it); the pools long along the road and fainter than a pole's, so that they run together into a band of light. A real
  // track's only.
  // Out: { glow: [[x, y, z, size]], pool: [[i, x, z, along, across, strength]] (i: the track's sample under it), mast: [[x, y, z, h, nx, nz]] }
  const ROOF = 4, ROOF_W = 6, MAST = 15, MAST_H = 5, POOL = 16, REACH = 45;
  function stands(world, T) {
    const L = world && world.standLamps, out = { glow: [], pool: [], mast: [] };
    if (!L || !L.length || !T || !real(T.def)) return out;
    const roofs = []; for (let k = 0; k + 5 < L.length; k += 6) if (L[k + 5] === 1) roofs.push(k);
    const under = (x, z, nx, nz) => roofs.some(r => { const dx = L[r] - x, dz = L[r + 2] - z; return Math.abs(dx * nz - dz * nx) < ROOF_W && Math.abs(dx * nx + dz * nz) < 60; });   // (a roof's lamp beside it along the stand: that part has a roof)
    let lastG = null, lastM = null, lastP = null;
    for (let k = 0; k + 5 < L.length; k += 6) {
      const x = L[k], y = L[k + 1], z = L[k + 2], nx = L[k + 3], nz = L[k + 4], roof = L[k + 5] === 1;
      if (roof) { if (lastG && Math.hypot(x - lastG[0], z - lastG[2]) < ROOF) continue; lastG = [x, y, z, 2.6]; out.glow.push(lastG); }
      else { if ((lastM && Math.hypot(x - lastM[0], z - lastM[2]) < MAST) || under(x, z, nx, nz)) continue; lastM = [x, y, z, MAST_H, nx, nz]; out.mast.push(lastM); out.glow.push([x + nx * 0.5, y + MAST_H - 0.2, z + nz * 0.5, 4]); }
      if (lastP && Math.hypot(x - lastP[0], z - lastP[1]) < POOL) continue;
      const i = T.nearestIdx(x, z), dx = x - T.px[i], dz = z - T.pz[i]; if (Math.hypot(dx, dz) > REACH) continue;
      const sd = dx * T.nx[i] + dz * T.nz[i] >= 0 ? 1 : -1;   // (the stand's side of the road)
      lastP = [x, z]; out.pool.push([i, T.px[i] + T.nx[i] * sd * T.w * 0.45, T.pz[i] + T.nz[i] * sd * T.w * 0.45, POOL * 1.8, T.w * 2.6, 0.6]);
    }
    return out;
  }

  // a real track's evening later than the golden hour, DUSK of the way to twilight (the dusk's light of applyTheme, K, changed): the sun
  // lower, redder and weaker, the sky's light and the shade bluer and dimmer, the haze a dusky mauve; the lights glare a little more
  const _c = new THREE.Color();
  function dusk(K, def, r) {
    if (!real(def)) return;
    const k = DUSK * (1 - 0.5 * Math.max(0, r || 0));   // (in the rain the overcast sky's grey as it was, mostly)
    K.sunI *= 1 - 0.6 * k; K.hemiI *= 1 - 0.45 * k; K.off = [K.off[0], K.off[1] * (1 - 0.5 * k), K.off[2]];
    K.sunC.lerp(_c.setHex(0xff6a3a), 0.4 * k); K.fog.lerp(_c.setHex(0x6e6080), 0.6 * k); K.sky.lerp(_c.setHex(0x5a68a8), 0.6 * k); K.gnd.multiplyScalar(1 - 0.5 * k);
    K.bloom += 0.3 * k;
  }

  Render.ext.vecer = { EVE, DUSK, lampK, look, stands, dusk };
})();
