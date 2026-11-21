// Realizem, kamera za avtom, skupina 4 (Bâlea, Katu-Jaryk, Los Caracoles; docs/realizem.md): what the chase camera sees on these three real
// roads. Wraps World.ext.<id> as js/world-realizem1.js and js/world-realizem2.js do: the track's own builder runs first and stays as it is, this
// changes only what is listed here (the buildings, the road's marks and what grows are the packages S, E and G, in their own files). Suzuka (in
// the group 1) is a test track since 9. 11. 2026 (docs/odlocitve.md) and stays as it is
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.ext) return;
  const wrap = (id, fn) => {
    const base = World.ext[id]; if (!base) return;
    World.ext[id] = function (scene, tex, opts, api) {
      const out = base.call(this, scene, tex, opts, api);
      try { fn(out, (out.stats = out.stats || {}).kamera4 = {}); } catch (e) { console.error('realizem4 (' + id + '):', e); }
      return out;
    };
  };

  // aoWorld (js/world.js) lays a dark strip at the foot of every upright face it finds. The terrain's own steep faces (out.ground: its tiles and,
  // on Katu, the cuts along the road) are no walls, and from the chase camera those strips draw a steep slope as rows of dark steps (Katu 864 of
  // 3293 strips, Bâlea 94; docs/proge/katu.md: »brez stopnic«). aoWorld runs after this wrapper, so out.root.add is wrapped until it is done: an
  // 'ao' mesh loses the strips whose foot is the foot of a face of out.ground (found as aoWorld finds it), and one with none left is not added
  const aoGround = (out, st) => {
    const root = out.root, ground = out.ground; if (!root || !ground || typeof root.add !== 'function') return;
    st.aoQuads = 0; st.aoGround = 0;
    const key = (x, z) => Math.round(Math.fround(x) * 100) + ',' + Math.round(Math.fround(z) * 100);   // (as the strip's Float32 corners hold them)
    const findFeet = () => {
      const s = new Set(), V = new Float64Array(9); ground.updateMatrixWorld(true);
      ground.traverse(m => {
        const P = m.isMesh && !m.isInstancedMesh && m.geometry && m.geometry.attributes.position; if (!P || P.itemSize !== 3) return;
        const A = P.array, I = m.geometry.index ? m.geometry.index.array : null, nt = I ? I.length / 3 : P.count / 3, M = m.matrixWorld.elements;
        for (let t = 0; t < nt; t++) {
          for (let q = 0; q < 3; q++) { const j = (I ? I[t * 3 + q] : t * 3 + q) * 3, x = A[j], y = A[j + 1], z = A[j + 2];
            V[q * 3] = M[0] * x + M[4] * y + M[8] * z + M[12]; V[q * 3 + 1] = M[1] * x + M[5] * y + M[9] * z + M[13]; V[q * 3 + 2] = M[2] * x + M[6] * y + M[10] * z + M[14]; }
          const ux = V[3] - V[0], uy = V[4] - V[1], uz = V[5] - V[2], vx = V[6] - V[0], vy = V[7] - V[1], vz = V[8] - V[2];
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, h2 = nx * nx + nz * nz;
          if (h2 < 1e-18 || ny * ny > 0.0625 * h2) continue;   // (upright, as aoWorld takes it; its foot the two lowest corners, in its order)
          let lo = 0, mid = 1, hi = 2; if (V[4] < V[1]) { lo = 1; mid = 0; } if (V[hi * 3 + 1] < V[mid * 3 + 1]) { const r = hi; hi = mid; mid = r; if (V[mid * 3 + 1] < V[lo * 3 + 1]) { const r2 = mid; mid = lo; lo = r2; } }
          s.add(key(V[lo * 3], V[lo * 3 + 2]) + '|' + key(V[mid * 3], V[mid * 3 + 2]));
        }
      });
      return s;
    };
    // one 'ao' mesh (a 256 m cell of strips; a strip's corners n..n+3, its foot n and n+1, its 6 indices begin with n): false when none is left
    const drop = (m, feet) => {
      const g = m.geometry, I = g.index.array, P = g.attributes.position.array, keep = [];
      for (let i = 0; i + 5 < I.length; i += 6) { const n = I[i]; st.aoQuads++;
        if (feet.has(key(P[n * 3], P[n * 3 + 2]) + '|' + key(P[n * 3 + 3], P[n * 3 + 5]))) st.aoGround++; else keep.push(i); }
      if (keep.length * 6 === I.length) return true;
      if (!keep.length) { g.dispose(); return false; }
      const nv = keep.length * 4, g2 = new THREE.BufferGeometry(), I2 = nv > 65535 ? new Uint32Array(keep.length * 6) : new Uint16Array(keep.length * 6);
      for (const name in g.attributes) { const a = g.attributes[name], s = a.itemSize, src = a.array, dst = new src.constructor(nv * s);
        keep.forEach((i, q) => dst.set(src.subarray(I[i] * s, (I[i] + 4) * s), q * 4 * s)); g2.setAttribute(name, new THREE.BufferAttribute(dst, s, a.normalized)); }
      keep.forEach((i, q) => { for (let r = 0; r < 6; r++) I2[q * 6 + r] = I[i + r] - I[i] + q * 4; });
      g2.setIndex(new THREE.BufferAttribute(I2, 1)); g2.computeBoundingSphere(); m.geometry = g2; g.dispose(); return true;
    };
    const own = Object.prototype.hasOwnProperty.call(root, 'add'), add0 = root.add, seen = new WeakSet(); let feet = null;
    root.add = function (...objs) {
      for (const o of objs) {
        if (o && o.isMesh && o.name === 'ao' && o.geometry && o.geometry.index && !seen.has(o)) { seen.add(o);
          if (!feet) { feet = findFeet(); queueMicrotask(() => { feet = null; if (own) root.add = add0; else delete root.add; }); }   // (aoWorld adds all its cells at once)
          let keepIt = true; try { keepIt = drop(o, feet); } catch (e) { console.error('realizem4 ao:', e); } if (!keepIt) continue; }
        add0.call(this, o);
      }
      return this;
    };
  };

  // The rain (js/render.js applyRoad, world.dyn.wet): on Katu and Bâlea the ground darkens with the wet road, by a fifth (wet soil and rock are
  // darker: the water in the grit's pores sends less light back out of it). On Los Caracoles only the asphalt and its makadam did, and from the
  // chase camera the slopes above and below the road stayed as light as in the sun. Its ground (out.ground: the tiles) and its verges (the grit
  // ribbons) now darken as theirs do, each from its own dry colour (userData.dry, which the season keeps: render.js seasonWorld). No puddles
  // (an open road has none: render.js puddles) and no second road: the asphalt darkens as before, the road here is a material of no mesh
  const wetGround = (out, st) => {
    if (!out.dyn || out.dyn.wet || !out.ground || !out.root) return;
    const grit = World.api && World.api.vrGritTex ? World.api.vrGritTex() : null, mats = new Set();
    out.ground.traverse(o => { if (o.isMesh && o.material && o.material.color) mats.add(o.material); });
    if (grit) out.root.traverse(o => { if (o.isMesh && o.material && o.material.map === grit && o.material.color) mats.add(o.material); });
    if (!mats.size) return;
    const L = [...mats]; for (const m of L) if (!m.userData.dry) m.userData.dry = m.color.clone();
    out.dyn.wet = { puddles: new THREE.Group(), road: new THREE.MeshPhongMaterial(), base: { sh: 30, sp: 0x111111 },
      ground: { color: { setScalar: (v) => { for (const m of L) m.color.copy(m.userData.dry).multiplyScalar(v); } } } };
    st.wetMats = L.length;
  };

  wrap('balea', aoGround);
  wrap('katu', aoGround);
  wrap('caracoles', (out, st) => { aoGround(out, st); wetGround(out, st); });
})();
