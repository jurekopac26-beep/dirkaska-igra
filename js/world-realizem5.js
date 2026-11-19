// Realizem, skupina 5 (docs/realizem.md, »Postopek za vse proge«): real roads on main outside the 15 tracks of the packages, the ones the
// chase camera showed least like the real place (scores in the PR): Isuna (Bhutan), Ghoufi (Algeria), Santo Antão (Cabo Verde), Ujarrás
// (Costa Rica). Wraps World.ext.<id> as js/world-aguascalientes.js and js/world-realizem1.js do: the track's own builder runs first and stays
// as it is, this only adds or changes what is listed here, from the sources only (OSM, ESA WorldCover 2021 and its Sentinel-2 composite,
// Copernicus DEM GLO-30; README.md, »Zasluge«). Side roads and road lines are package E (their own files), the physics and the collisions are not touched.
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;

  const wrap = (id, fn) => {
    const base = World.ext[id]; if (typeof base !== 'function') return;
    World.ext[id] = function (scene, tex, opts, api) {
      const out = base.call(this, scene, tex, opts, api);
      if (out && out.root) fn(out, scene, tex, opts);
      return out;
    };
  };

  const A = World.api;
  // three.js names what it makes with Math.random, which the browser tests seed and share with the race: what this file makes is made with
  // Math.random swapped for a generator of its own (as World's ownRnd), so a seeded race runs as it did before
  const uu = { s: 104729 };
  const own = (fn) => { const r = Math.random; Math.random = () => (uu.s = (uu.s * 48271) % 2147483647) / 2147483647; try { return fn(); } finally { Math.random = r; } };

  /* ---- trees of another kind than World.gore's: its trees of the listed kinds in a build get another shape ---- */
  // the bounding box of a unit shape's positions as a key: World.gore's own trees are found among a build's instanced meshes by it (IChunks
  // welds a tree's shape, which keeps its positions)
  const bboxKey = (geo) => {
    const p = geo.attributes.position.array, b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
    for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++) { b[k] = Math.min(b[k], p[i + k]); b[k + 3] = Math.max(b[k + 3], p[i + k]); }
    return b.map(v => v.toFixed(3)).join(',');
  };
  // a shape's equal vertices merged into one (indexed, as World's weldGeo does with the trees IChunks plants)
  const weld = (geo) => {
    const names = Object.keys(geo.attributes), at = names.map(k => geo.attributes[k]), n = geo.attributes.position.count, map = new Map(), idx = [], keep = [];
    for (let i = 0; i < n; i++) {
      let key = ''; for (const a of at) for (let c = 0; c < a.itemSize; c++) key += a.array[i * a.itemSize + c].toFixed(5) + ',';
      let v = map.get(key); if (v === undefined) { v = keep.length; map.set(key, v); keep.push(i); } idx.push(v);
    }
    const out = new THREE.BufferGeometry();
    names.forEach((k, j) => { const a = at[j], arr = new a.array.constructor(keep.length * a.itemSize);
      keep.forEach((i, q) => { for (let c = 0; c < a.itemSize; c++) arr[q * a.itemSize + c] = a.array[i * a.itemSize + c]; });
      out.setAttribute(k, new THREE.BufferAttribute(arr, a.itemSize, a.normalized)); });
    out.setIndex(idx); return out;
  };
  // the new shape kept within the old one's reach round its axis and its height (the chunks' culling boxes are the old shape's, IChunks)
  const fit = (geo, old) => {
    const ext = (g) => { const p = g.attributes.position.array; let r = 0, y = 0; for (let i = 0; i < p.length; i += 3) { r = Math.max(r, Math.hypot(p[i], p[i + 2])); y = Math.max(y, p[i + 1]); } return [r, y]; };
    const [r0, y0] = ext(old), [r1, y1] = ext(geo), sr = Math.min(1, r0 / r1), sy = Math.min(1, y0 / y1);
    if (sr < 1 || sy < 1) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * sr, p.getY(i) * sy, p.getZ(i) * sr); }
    geo.computeBoundingSphere(); return geo;
  };
  // NIZKA's shadow of a tree (as World's treeShadow): an octahedron over the green crown from its foot to its top, its waist where it is widest
  const octa = (geo) => {
    const P = geo.attributes.position, C = geo.attributes.color, NB = 5, G = [];
    for (let i = 0; i < P.count; i++) if (C.getY(i) > C.getX(i) * 1.08 && C.getY(i) > C.getZ(i) * 1.08) G.push(i);
    if (!G.length) for (let i = 0; i < P.count; i++) G.push(i);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const i of G) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, h = (y1 - y0) || 1, ax = new Float32Array(NB), az = new Float32Array(NB);
    for (const i of G) { const b = Math.min(NB - 1, Math.floor((P.getY(i) - y0) / h * NB)); ax[b] = Math.max(ax[b], Math.abs(P.getX(i) - cx)); az[b] = Math.max(az[b], Math.abs(P.getZ(i) - cz)); }
    let w = 0; for (let b = 1; b < NB; b++) if (ax[b] + az[b] > ax[w] + az[w]) w = b;
    const rx = ax[w] * 1.2, rz = az[w] * 1.2, yw = y0 + (w + 0.5) / NB * h, out = new THREE.BufferGeometry(), idx = [];
    out.setAttribute('position', new THREE.Float32BufferAttribute([cx, y1, cz, cx, y0, cz, cx + rx, yw, cz, cx, yw, cz + rz, cx - rx, yw, cz, cx, yw, cz - rz], 3));
    for (let k = 0; k < 4; k++) idx.push(2 + k, 2 + (k + 1) % 4, 0, 2 + (k + 1) % 4, 2 + k, 1);
    out.setIndex(idx); return out;
  };
  // pick(kind, snowy) -> the new unit shape (or null: kept); every chunk's instanced mesh gets it, and NIZKA's shadow copy of the mesh (hidden,
  // sharing its instances) the new octahedron; the instances (place, turn, size, tint) stay as they are
  const swapTrees = (root, kinds, pick) => own(() => {
    const ref = {}, got = new Map(), by = new Map();
    for (const k of kinds) for (const s of [false, true]) ref[bboxKey(World.gore.treeGeo(k, s))] = [k, s];
    root.traverse(o => { if (o.isInstancedMesh) { if (!by.has(o.instanceMatrix)) by.set(o.instanceMatrix, []); by.get(o.instanceMatrix).push(o); } });
    for (const L of by.values()) {
      const im = L.find(o => o.geometry.attributes.color), sm = L.find(o => o !== im); if (!im) continue;
      const pa = im.geometry.attributes.position;
      if (!got.has(pa)) { const r = ref[bboxKey(im.geometry)], ng = r ? pick(r[0], r[1]) : null; got.set(pa, ng ? [fit(weld(ng), im.geometry), null] : null); }
      const e = got.get(pa); if (!e) continue;
      const ng = e[0], g = new THREE.BufferGeometry(); for (const a in ng.attributes) g.setAttribute(a, ng.attributes[a]); g.setIndex(ng.index);
      g.boundingSphere = im.geometry.boundingSphere; im.geometry = g;
      if (sm) { const sh = e[1] || (e[1] = octa(ng)), sg = new THREE.BufferGeometry(); sg.setAttribute('position', sh.attributes.position); sg.setIndex(sh.index); sg.boundingSphere = g.boundingSphere; sm.geometry = sg; }
    }
  });
  // World.gore's trees of the listed kinds taken out of a build: every chunk's instanced mesh of them and NIZKA's shadow copy (sharing its
  // instances) leave the scene (world.js's distance culling keeps its note of them, which only shows or hides them); -> how many trees went
  const dropTrees = (root, kinds) => own(() => {
    const ref = new Set(), by = new Map(); let n = 0;
    for (const k of kinds) for (const s of [false, true]) ref.add(bboxKey(World.gore.treeGeo(k, s)));
    root.traverse(o => { if (o.isInstancedMesh) { if (!by.has(o.instanceMatrix)) by.set(o.instanceMatrix, []); by.get(o.instanceMatrix).push(o); } });
    for (const L of by.values()) {
      const im = L.find(o => o.geometry.attributes.color); if (!im || !ref.has(bboxKey(im.geometry))) continue;
      n += im.count; for (const o of L) if (o.parent) o.parent.remove(o);
    }
    return n;
  });
  // a blue pine (Pinus wallichiana), unit height: a straight grey-brown trunk up through the crown, bare at the foot; an open crown of four
  // whorls of level branches, each two clumps of long drooping needles to either side of the trunk (each whorl turned another way), glaucous
  // grey-green (rad: the crown's foot radius in the slot's unit width)
  const bluePine = (rad, snowy) => {
    const g = new A.GB(), R = A.rng(4711 + (snowy ? 1 : 0)), rs = A.ROCK_SMOOTH, col = [0.27, 0.37, 0.3]; A.ROCK_SMOOTH = true;
    A.cyl(g, 0, -0.02, 0, 0.032, 0.9, 5, [0.42, 0.36, 0.3], null, 0.012);
    for (let t = 0; t < 4; t++) {
      const f = 1 - t / 4.6, a = R() * A.TAU, y = 0.4 + t * 0.15;
      for (let k = 0; k < 2; k++) {
        const b = a + k * (Math.PI + (R() - 0.5) * 1.2), o = rad * f * 0.42, r = rad * f * 0.72, x = Math.cos(b) * o, z = Math.sin(b) * o;
        A.ico(g, x, y - 0.02 * k, z, r, 0.4, A.vary(col, R, 0.08), R, 0.3);
        if (snowy) A.ico(g, x, y - 0.02 * k + r * 0.25, z, r * 0.75, 0.2, [0.94, 0.96, 1.0], R, 0.2);
      }
    }
    A.ico(g, 0, 0.95, 0, 0.08, 1.1, col, R, 0.15);
    A.ROCK_SMOOTH = rs; return g.geometry();
  };

  /* ---- Isuna (Bhutan): the slopes of the Paro Chhu at 2140-2170 m are under blue pine; fir grows in Bhutan from ~3000 m up and World.gore's
     'pine' is an umbrella pine, so both kinds of the track (['fir', 'fir', 'pine']) become blue pines (the fir slot's instances are 0.42-0.52 of
     their height wide, the pine slot's 0.75-1.0: the crown about as wide as the old one's, within its reach) ---- */
  wrap('isuna', (out) => {
    const pines = {};
    swapTrees(out.root, ['fir', 'pine'], (k, s) => pines[k + s] || (pines[k + s] = bluePine(k === 'fir' ? 0.36 : 0.26, s)));
  });

  /* ---- Ghoufi (Algeria): the road runs on the bare plateau above the canyon of the Oued El Abiod. ESA WorldCover 2021 has no tree cover
     within 60 m of it (grass/sparse steppe 55 %, bare rock 40 %, the rest built), and the Sentinel-2 composite of 2021 (NDVI) stays at
     0.08-0.13 along it and under all 192 of World.gore's broadleaf trees of the build (none above 0.3; the WorldCover trees, NDVI 0.41, are
     the palm grove on the canyon's floor, js/world-ghoufi.js's date palms): the broadleaf trees go, the palms and the village stay ---- */
  wrap('ghoufi', (out) => {
    const n = dropTrees(out.root, ['broad']);
    if (out.stats && typeof out.stats.trees === 'number') out.stats.trees = Math.max(0, out.stats.trees - n);
  });

  /* ---- Santo Antão (Cabo Verde): on the ridge road from Delgadim down to Ribeira Grande the Sentinel-2 composite of ESA WorldCover 2021
     (6-64 m from the road, the medians of its 30 000 pixels by WorldCover class) has the grass and the shrubs khaki-brown, G/R 0.94-0.96,
     B/R 0.83-0.85, NDVI 0.29-0.35 (the trees 1.0 and 0.87); the game's ground under them olive green, G/R 1.02-1.10, B/R 0.59. Taken
     against the bare and built ground of both (the same in either), the ground under grass, shrubs and trees moves to the composite's hue:
     G and B against R by the class's gain (WorldCover's shares at the vertex), its brightness kept; only where it is green (the basalt,
     the tuff, the walls, the cobbles, the kerbs and the whitewash stay as they are; the straw and the soil only greyer, not redder). The
     terrain tiles and the verges, not the far land ---- */
  wrap('santoantao', (out) => {
    const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const GN = [[0.94, 1.19], [0.99, 1.12], [0.94, 1.107]];   // (the G and B gains against R: lc 0 grass, 1 trees, 2 shrubs)
    const v = new THREE.Vector3();
    const tint = (m) => {
      const g = m.geometry, C = g.attributes.color, P = g.attributes.position; if (!C || !P || C.itemSize !== 3) return;
      m.updateMatrixWorld(true);
      for (let i = 0; i < C.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld);
        const w0 = A.vrLCf(v.x, v.z, 0), w1 = A.vrLCf(v.x, v.z, 1), w2 = A.vrLCf(v.x, v.z, 2), W = w0 + w1 + w2; if (W <= 0) continue;
        const r = C.getX(i), gg = C.getY(i), b = C.getZ(i); if (gg <= 0) continue;
        const veg = ss(0.15, 0.35, (gg - b) / gg) * Math.min(1, W); if (veg <= 0) continue;   // (how green it is: the grey and brown stay)
        const kG = (w0 * GN[0][0] + w1 * GN[1][0] + w2 * GN[2][0]) / W, kB = (w0 * GN[0][1] + w1 * GN[1][1] + w2 * GN[2][1]) / W;
        const vg = r > 0 ? veg * ss(0.9, 1.0, gg / r) : 0;   // (G down only where it is greener than red: the straw and the soil not made redder)
        const g2 = gg * (1 + (kG - 1) * vg), b2 = b * (1 + (kB - 1) * veg), s = (0.3 * r + 0.59 * gg + 0.11 * b) / (0.3 * r + 0.59 * g2 + 0.11 * b2);
        C.setXYZ(i, r * s, g2 * s, b2 * s);
      }
      C.needsUpdate = true;
    };
    out.root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.material && o.material.vertexColors && o.material.map && o.material !== out.asphaltMat) tint(o); });
  });
})();
