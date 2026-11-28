/* ===================================================================================================================================
   WORLD — Pikes Peak, United States: the roadside, added to the world js/world-pikes.js builds
   -----------------------------------------------------------------------------------------------------------------------------------
   Sources (read 24. 11. 2026):
     OpenStreetMap, the road's corridor (bbox -105.075, 38.835, -105.015, 38.925), projected onto the road's own line there (20.8 km)
     and from it onto the track's shortened one (6 km) between the places both have: the start, Halfway Picnic Grounds, Glen Cove,
     Devil's Playground, Boulder Park and the summit. Offsets from the road are the mapped ones, in metres.
       highway=path, surface=compacted (w1078685848): leaves the road at Devil's Playground and runs 10 to 25 m left of it
         (going up) for some 460 m of the track, away over the tundra, and back beside the road for another 140 m
       highway=path, surface=fine_gravel (w913622482): leaves the road at Boulder Park, to the left
       amenity=toilets: two at Halfway Picnic Grounds (n2512381314, n452805526; 21 m right), one at Glen Cove (n452805351; 35 m left),
         a portable one at Devil's Playground (n13143049013; 29 m right)
       amenity=drinking_water, fountain=bubbler at Glen Cove (n452805352; 22 m left)
       tourism=information, information=board: Halfway Picnic Grounds (n2512381312; 27 m right), Boulder Park (n2512381226; 21 m right)
       highway=milestone: four on this stretch (n452805592, n452805546, n452805388, n2512381217)
   Drawn (on the paved road, 'pikes'; the historic gravel road 'pikesg' is the road as it was until 2011 and gets none of it): the
     two paths as beaten gravel strips, the toilets, the bubbler, the two boards (blank: no text) and the four mile markers (blank).
   Not drawn: the two tarns right of the road above Devil's Playground (w275484769, w275352180): the terrain model (30 m) has no
     hollow there, only an even slope, and a pond cannot lie on a slope; the power line (w17147031), 30 to 60 m off in the forest,
     which the world cannot clear a corridor for; the two tourism=viewpoint nodes (a place, not a thing); natural=scree (w418797484):
     the world already scatters its boulders there.
   Approximate: the places along the track (the track is the road shortened 3.5 times, so everything is set between the six places
     above); the looks of the toilets, boards, bubbler and markers (OSM has no shapes: plain timber and metal ones are drawn); the
     side the mile markers stand on (right, going up); two cabins are drawn for the one portable-toilet node; things mapped where
     the world already has something of its own are moved the few metres to free ground.
   How: World.ext.pikes is wrapped; after it has built, two merged meshes in its own vertex-colour material are added to its root
     (two draw calls). Nothing of the road, the terrain or the driving changes.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || typeof World.ext.pikes !== 'function') return;
  const API = World.api, { GB, box, cyl } = API;

  // the compacted path left of the road: [metres from the start, metres left of the road's centre line], every 10 m (OSM w1078685848)
  const PATH_A = [4060, 19, 4070, 22, 4080, 21, 4090, 20, 4100, 19, 4110, 19, 4120, 23, 4130, 23, 4140, 25, 4150, 24, 4160, 21, 4170, 19, 4180, 18, 4190, 18, 4200, 18, 4210, 22, 4220, 23,
    4230, 19, 4240, 19, 4250, 19, 4260, 20, 4270, 17, 4280, 11, 4290, 11, 4300, 14, 4310, 18, 4320, 16, 4330, 17, 4340, 19, 4350, 20, 4360, 18, 4370, 17, 4380, 12, 4390, 13, 4400, 13,
    4410, 10, 4420, 10, 4430, 6, 4440, 11, 4450, 11, 4460, 19, 4470, 24, 4480, 29, 4490, 31, 4500, 32, 4510, 38, 4520, 44];
  const PATH_B = [5010, 45, 5020, 20, 5030, 14, 5040, 15, 5050, 14, 5060, 16, 5070, 20, 5080, 20, 5090, 21, 5100, 24, 5110, 22, 5120, 21, 5130, 22, 5140, 14, 5150, 30];
  const PATH_C = [5360, 14, 5370, 33, 5380, 56];   // the fine-gravel path at Boulder Park (OSM w913622482)
  const HALF_W = 0.6, LIFT = 0.09, STEP = 1.5, CLEAR = 2.5;
  const GRAVEL = [0.7, 0.61, 0.52], EDGE = [0.58, 0.5, 0.42], FINE = [0.74, 0.68, 0.6];
  const TIMBER = [0.52, 0.36, 0.24], TIMBER2 = [0.43, 0.3, 0.2], ROOF = [0.42, 0.44, 0.42], DOOR = [0.36, 0.42, 0.36], PALE = [0.86, 0.84, 0.78], CABIN = [0.52, 0.68, 0.76],
    WHITE = [0.92, 0.92, 0.9], STONE = [0.6, 0.57, 0.54], STEEL = [0.7, 0.72, 0.74], MARK = [0.2, 0.5, 0.32], POST = [0.62, 0.62, 0.6];

  World.pikesObcestje = { stats: null };

  function add(out) {
    const T = API.T, gy = API.pkGround, N = T ? T.N : 0;
    if (!T || !gy || !out || !out.root || !out.matV || (T.def && T.def.roadSurface === 'makadam')) { World.pikesObcestje.stats = null; return; }
    const flat = new GB(false), solid = new GB(false), st = { pathMetres: 0, toilets: 0, boards: 0, markers: 0, fountains: 0, meshes: 0 };
    const sm = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    const fr = (d) => { const i = T.idx(T.startS + d); return { i, y: T.hy[i], bl: T.bl[i], br: T.br[i], at: (lat, along) => [T.px[i] + T.nx[i] * lat + T.tx[i] * (along || 0), T.pz[i] + T.nz[i] * lat + T.tz[i] * (along || 0)], rot: Math.atan2(-T.nx[i], T.nz[i]) }; };   // (lat: + right; rot: a box's depth across the road)
    const otherLeg = (x, z, i) => { for (let j = 0; j < N; j += 2) { if (Math.abs(j - i) < 40) continue; const dx = T.px[j] - x, dz = T.pz[j] - z, b = Math.max(T.bl[j], T.br[j]) + 1.5; if (dx * dx + dz * dz < b * b) return true; } return false; };

    // ---- a path: a beaten strip on the ground, its line the mapped offset from the road (never nearer than the barrier + CLEAR) ----
    const path = (tab, col) => {
      const d0 = tab[0], d1 = tab[tab.length - 2], lat = (d) => { const k = Math.max(0, Math.min(tab.length / 2 - 2, Math.floor((d - d0) / 10))), u = Math.max(0, Math.min(1, (d - tab[k * 2]) / 10)); return tab[k * 2 + 1] + (tab[k * 2 + 3] - tab[k * 2 + 1]) * sm(u); };
      const C = []; for (let d = d0; d <= d1; d += STEP) { const F = fr(d), L = Math.max(lat(d), F.bl + CLEAR), [x, z] = F.at(-L); C.push(L > 48 || otherLeg(x, z, F.i) ? null : [x, z, Math.min(sm((d - d0) / 6), sm((d1 - d) / 6))]); }
      let prev = null;
      for (let k = 0; k < C.length; k++) {
        const p = C[k], a = C[Math.max(0, k - 1)] || p, b = C[Math.min(C.length - 1, k + 1)] || p; if (!p) { prev = null; continue; }
        let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        const hw = HALF_W * (0.35 + 0.65 * p[2]), row = [-1, -0.55, 0.55, 1].map(o => { const x = p[0] - tz * o * hw, z = p[1] + tx * o * hw; return [x, gy(x, z) + LIFT, z]; });
        if (prev) { for (let q = 0; q < 3; q++) { const c0 = q === 0 ? EDGE : col, c1 = q === 2 ? EDGE : col; flat.quadUp(prev[q], row[q], row[q + 1], prev[q + 1], [c0, c0, c1, c1]); }
          st.pathMetres += Math.hypot(p[0] - C[k - 1][0], p[1] - C[k - 1][1]); }
        prev = row;
      }
    };
    path(PATH_A, GRAVEL); path(PATH_B, GRAVEL); path(PATH_C, FINE);

    // ---- the things: each stands on the ground where it is mapped (d: metres from the start; lat: + right of the road's centre line) ----
    const toilet = (d, lat, along) => {   // a vault toilet: a timber cabin on a slab, a low roof, the vent pipe, the door facing the road
      const F = fr(d), [x, z] = F.at(lat, along), y = gy(x, z), r = F.rot, s = lat > 0 ? -1 : 1, nx = T.nx[F.i] * s, nz = T.nz[F.i] * s;
      box(solid, x, y - 0.3, z, 2.9, 0.42, 2.9, r, STONE, STONE, true); box(solid, x, y + 0.12, z, 2.4, 2.3, 2.4, r, TIMBER, TIMBER2);
      box(solid, x, y + 2.42, z, 3.0, 0.16, 3.0, r, ROOF, ROOF); box(solid, x - nx * 1.21, y + 0.14, z - nz * 1.21, 0.9, 1.95, 0.06, r, DOOR, DOOR);
      cyl(solid, x + nx * 0.8, y + 2.5, z + nz * 0.8, 0.09, 0.9, 6, POST, POST); st.toilets++;
    };
    const cabin = (d, lat, along) => {   // a portable toilet cabin
      const F = fr(d), [x, z] = F.at(lat, along), y = gy(x, z), s = lat > 0 ? -1 : 1, nx = T.nx[F.i] * s, nz = T.nz[F.i] * s;
      box(solid, x, y - 0.1, z, 1.15, 2.25, 1.15, F.rot, CABIN, CABIN, true); box(solid, x, y + 2.15, z, 1.25, 0.12, 1.25, F.rot, WHITE, WHITE);
      box(solid, x - nx * 0.585, y + 0.1, z - nz * 0.585, 0.72, 1.8, 0.04, F.rot, WHITE, WHITE); st.toilets++;
    };
    const board = (d, lat, along) => {   // an information board: two timber posts, a pale panel under a small roof (blank), facing the road
      const F = fr(d), [x, z] = F.at(lat, along), y = gy(x, z), tx = T.tx[F.i], tz = T.tz[F.i], r = F.rot;
      for (const u of [-0.95, 0.95]) box(solid, x + tx * u, y - 0.2, z + tz * u, 0.14, 2.45, 0.14, r, TIMBER2, TIMBER2, true);
      box(solid, x, y + 1.0, z, 1.76, 1.05, 0.07, r, PALE, PALE); box(solid, x, y + 2.2, z, 2.3, 0.1, 0.7, r, TIMBER, TIMBER); st.boards++;
    };
    const bubbler = (d, lat, along) => {   // a drinking fountain: a stone pedestal with a steel bowl
      const F = fr(d), [x, z] = F.at(lat, along), y = gy(x, z);
      cyl(solid, x, y - 0.2, z, 0.3, 1.1, 8, STONE, STONE, 0.24); cyl(solid, x, y + 0.9, z, 0.2, 0.08, 8, STEEL, STEEL, 0.3); st.fountains++;
    };
    const marker = (d) => {   // a mile marker: a steel post with a small upright plate (blank), just beyond the barrier on the right
      const F = fr(d), [x, z] = F.at(F.br + 0.9), y = gy(x, z);
      box(solid, x, y - 0.2, z, 0.06, 1.75, 0.06, F.rot, POST, POST, true); box(solid, x, y + 1.05, z, 0.04, 0.6, 0.3, F.rot, MARK, MARK); st.markers++;
    };
    toilet(1000, 24.6, 0); toilet(1004, 23.3, 0.6); board(1001, 29.6, -1);   // (2.7 m further out than mapped: picnic tables stand there)
    toilet(2683, -34.6, 0); bubbler(2683, -21.8, 0);
    cabin(4055, 28.8, 0); cabin(4055, 28.8, 1.35);
    board(5360, 20.7, -10);   // (10 m down the road from the mapped spot: a marshals' post stands there)
    for (const d of [456, 848, 2369, 2754]) marker(d);

    for (const [g, cast, name] of [[flat, false, 'roadside-paths'], [solid, true, 'roadside-things']]) {
      if (g.empty) continue; const m = new THREE.Mesh(g.geometry(), out.matV); m.name = name; m.castShadow = cast; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); out.root.add(m); st.meshes++;
    }
    st.pathMetres = Math.round(st.pathMetres); World.pikesObcestje.stats = st;
  }

  const base = World.ext.pikes;
  World.ext.pikes = (scene, tex, opts) => { const out = base(scene, tex, opts); add(out); return out; };
})();
