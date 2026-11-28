/* =====================================================================================================================================
   WORLD — Štajerska, Avstrija: the places beside the road within 60 m (docs/proge/rbring-raziskava.md), on the shared circuit builder
   (js/world-rbring.js: Styria's look's LK.extra wrapped; what is here is laid out first, so the trees and the crowds keep clear of it).
   Drawn, from OpenStreetMap (main API, 2026-11-28; metres, origin = the start line, x east, z south, js/geo.js's frame):
     the pond w144379693 (natural=water, 41 m from the track by Turn 2) as a flat water surface on its outline;
     the wayside shrine n7705622037 (historic=wayside_shrine, catholic; 34 m from the track before Turn 6) as the region's plastered
       pillar shrine under a small gabled roof, a niche towards the road, and the broadleaf tree beside it n7705622039 (natural=tree);
     the stream culverts' mouths (tunnel=yes / culvert: the Spielbergbach w144379682 out of the pond, two brooks w144379659, w144379662,
       the Schönbergbach w144540676) as concrete headwalls with the pipe's dark mouth.
   Assumed (OSM has no sizes): the shrine 0.8 m square and 2.6 m high, white render, a grey shingle roof; the tree 11 m; the headwalls
     2.8 m wide, 0.4 m over the ground. Only on Styria (API.THEME 'rbring': the tracks that borrow its look keep theirs).
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.rbring;
  if (!LK) return;

  const POND = [-685.9, -434.4, -672.2, -440.7, -671.3, -438.6, -665.7, -426, -664.2, -422.2, -661.2, -409.2, -664.3, -402.9, -672.1, -404, -681.9, -410.5, -684.5, -417.5, -686, -430.5];
  const SHRINE = [-284.3, -520.3], TREE = [-284.3, -521.8], ROAD = [-290.9, -487.2];   // (the road's nearest point: the niche faces it)
  const MOUTHS = [[-642.9, -430.3, -568.5, -400.1], [-728.6, -540.2, -712.9, -604.1], [-723.8, -683.7, -724.6, -759.2], [-356.3, -695, -352.9, -635.6]];   // the mouth, the next point inside

  const base = LK.extra;
  LK.extra = function (o) {
    let mine = null;
    if (A.THEME === 'rbring') { try { mine = lay(o); } catch (e) { console.error('rbring-kraj:', e); } }
    const st = base ? base.call(this, o) : null;
    if (mine) { const r = st || {}; r.kraj = mine; return r; }
    return st;
  };

  function seeded(a) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function lay(o) {
    const { root, scen, exclPush, CR } = o, { box, cyl, gable, ico, nrGround } = A;
    const st = { pond: 0, shrine: 0, tree: 0, mouths: 0 };

    // the pond: a fan from its middle, a little under the mean ground of its shore
    {
      const n = POND.length / 2; let cx = 0, cz = 0, gy = 0, gmin = 1e9;
      for (let k = 0; k < n; k++) { const x = POND[2 * k], z = POND[2 * k + 1], y = nrGround(x, z); cx += x / n; cz += z / n; gy += y / n; gmin = Math.min(gmin, y); }
      const y = Math.max(gmin, gy - 0.25) + 0.04, pos = [cx, y, cz];
      for (let k = 0; k < n; k++) pos.push(POND[2 * k], y, POND[2 * k + 1]);
      const idx = []; for (let k = 0; k < n; k++) idx.push(0, 1 + ((k + 1) % n), 1 + k);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x5e8790, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
      m.name = 'rbring-ribnik'; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m);
      exclPush(cx, cz, 16); CR.avoid(cx, cz, 16); st.pond = 1;
    }

    // the wayside shrine and its tree
    {
      const [x, z] = SHRINE, y = nrGround(x, z), rot = Math.atan2(ROAD[1] - z, ROAD[0] - x), ux = Math.cos(rot), uz = Math.sin(rot), g = scen.get(x, z);
      box(g, x, y - 0.3, z, 1.0, 0.45, 1.0, rot, [0.62, 0.6, 0.56]);                                // the stone footing
      box(g, x, y + 0.15, z, 0.8, 2.0, 0.8, rot, [0.93, 0.92, 0.88], [0.9, 0.89, 0.85]);          // the plastered pillar
      box(g, x + ux * 0.38, y + 1.25, z + uz * 0.38, 0.06, 0.7, 0.46, rot, [0.24, 0.3, 0.42]);     // the niche, its painted back
      gable(g, x, y + 2.15, z, 1.1, 1.1, 0.55, rot, [0.36, 0.36, 0.38], [0.88, 0.87, 0.83]);       // the little roof
      exclPush(x, z, 3); CR.avoid(x, z, 3); st.shrine = 1;
      const [tx, tz] = TREE, ty = nrGround(tx, tz), R = seeded(2407);
      cyl(g, tx, ty - 0.2, tz, 0.32, 4.6, 7, [0.38, 0.31, 0.24]);
      ico(g, tx, ty + 7.0, tz, 3.6, 1.05, [0.33, 0.47, 0.22], R, 0.25);
      ico(g, tx + 1.4, ty + 8.6, tz - 0.8, 2.6, 0.95, [0.37, 0.5, 0.24], R, 0.25);
      exclPush(tx, tz, 4); st.tree = 1;
    }

    // the culverts' mouths: a headwall across the stream, the pipe's dark mouth on its face
    for (const [x, z, ix, iz] of MOUTHS) {
      const rot = Math.atan2(iz - z, ix - x) + Math.PI / 2, y = nrGround(x, z), g = scen.get(x, z), dl = Math.hypot(ix - x, iz - z) || 1, fx = (x - ix) / dl, fz = (z - iz) / dl;
      box(g, x, y - 1.2, z, 2.8, 1.6, 0.35, rot, [0.66, 0.65, 0.62]);   // (its top 0.4 m over the meadow: the brook's bed is not in the ground model)
      box(g, x + fx * 0.19, y - 0.5, z + fz * 0.19, 0.8, 0.75, 0.04, rot, [0.16, 0.17, 0.17]);
      exclPush(x, z, 3); st.mouths++;
    }
    return st;
  }
})();
