// Realizem, skupina 5 (docs/realizem.md, »Postopek za vse proge«): real roads on main outside the 15 tracks of the packages, the ones the
// chase camera showed least like the real place (scores in the PR): Isuna (Bhutan), Ghoufi (Algeria), Santo Antão (Cabo Verde), Ujarrás
// (Costa Rica), Killar (India). Wraps World.ext.<id> as js/world-aguascalientes.js and js/world-realizem1.js do: the track's own builder runs
// first and stays as it is, this only adds or changes what is listed here, from the sources only (OSM, ESA WorldCover 2021 and its Sentinel-2
// composite, Sentinel-2 L2A scenes, Copernicus DEM GLO-30; README.md, »Zasluge«). Side roads and road lines are package E (their own files), the physics and the collisions are not touched.
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
     terrain tiles and the verges. The far land beyond them (irFar's nodes, 300 m apart, js/world-iroha.js): the same composite over each
     node's 300 m block (the median of its 18 m pixels' ratios, the land's only: NIR above 800) is khaki-brown, G/R 0.74-1.09 (5-95 %,
     median 0.85), B/R 0.55-0.79 (0.68), the higher the browner (above 900 m 0.81-0.83 and 0.64-0.66); the game's far land green, G/R
     1.09-1.27, B/R 0.65-0.71. Each dry node's hue moves to its block's, matched to the near ground at the seam (the composite's 64-470 m
     from the road, G/R 0.936, B/R 0.723, is the tinted ground's 1.04 and 0.69 there; the ratios to it as the screen's, ^(1/2.2)): G/R
     0.90-1.23, B/R 0.58-0.76, its brightness kept (the model's light and shade, the haze as they were) ---- */
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
    // the far land: the dry nodes in order (def.farDem.lake, the sea, skipped), a byte each: G/R 0.90 + 0.022 i (its high 4 bits), B/R 0.58 + 0.012 j
    const FAR = 'WUdHNkc2NllZWUdISFlqWGlXeWdpaVpZSFhsaVhoelhpeXp5eGhGR1hJWWtZWWlpaWppWHmLiXh5V1hZallISGtISFhZSGl6jIp6i4uJiHhoaFhZWFhaWmtaa1lJWEdZWVlqanpYaHl5iXhWR1hYaWpZaWlrWWpqbFdYWUhHSFhZWXqLaFdoeXloWFhZamlZWVlpe2pqaotramp8fHxrR0haaVhHR1hZRzZIWWl7e3l5eWlZaWloeVlpe1hoi3pqWGl7WWpqamlqe2pZaVpYRkc2SFhqWVlYR1lqRzZHSGppaXl5aVlYalhYaWp7WGmKe2ppWGh7enp6aVd6aWpYWVlHRjZIWFhYWFlYR1lZR0dXWFhZWGhpWEZoall5WGp6aXmqjHpYaHqLenp5aEZXaWpHV1lqWkdISEZHWGhYWFhIWFhZR0hISEdHNkdIR1hqWVhYWGpYaHqLi3toV2iKi3h4aFdoaGhoWVlqa0Y2R0dYNlhZaVhYSFhYWUhHNjZXSFlZWFhYWFhGaVdYaHmLeot6R1doiopoeXloeGhoaGlpe3s1NkdYR0dIWFhYSFhYWEdHRkZISEhIR2lHaVlpZ2l5aGh5i3x6aUZXeXl5Z3h5eYl4eHlpaWprWVk2RkdYWEdISVhYaVhYSEdHR0hISEg3WGlHaVloaHmJZ2hpaXuKi3pnaGl5eoqKeYl4iImJemtaWUZGWFlYWUZWR1hHR1lYWGhYSEhGN0hZWEhYSFhZWGloaImKilhpaGp6eoqLimhoiYmKq5uriImJi2lpRkZHNUVYWVhGR0dZWFhpaFhYSEdHV0hZWFhIWEdpSGlpiniqnGlpeXl5e3qdiol5ebyripusi4mJmYpoWH1HRzVYNllZWDVGNllYWXp5WEhHNkdHSFlHRzY2R2lZeXl5iamtaWlpaWmKjKyaiZqrzbubqqqKiamJaVhIe31ZWEdHRkhZR0ZHNkhHV2lpWEdHRzZXSFlXRzY1Nlh5iZubeaq9eXuKenl6nZuamoqKzayruru6mol6eoqKi4tYWFhHR1lYWUZZWVhIWFlYR0ZHSEdGWFlHNjZGNWl6eYqreZucV3lpeXp6rK2avJqrzKuqrIqrmnmKequKWXtYaFlYWFlIWUZHWWlYWVhIR0dHWVhGaFhHR1lIWHpqaHmKR1dHV3p6e2l5m628q6uszMubrKurq5qbi5t6aFhYWFlYWGlHWUdGRkhZWEhIV0hYallGZ2lYSFlIWXlZeouMRzU1Vmmce2lpmouLmqvMu6qbrM28rKurvIubaFhHV0hIWFlZWVhHNUdYalhIWFdYellHR3hYWFlZWWlYWWlqe0g3R1ibnFlpaYmLi6u8qqqJm6u9vXmbrKyaimhXV1lGR0dYSFlIWEY2WVlZSGh5aHlZR0dGaFhYWVl6WVh5eHmLakdGV3l6WGpoiYqLnL2amomrm72aq7y8ibuJaHpYaFpGRkdYSEhIR0ZHR0dYWFhYeYpYR0dGaGloWVmKallZaFd4e0dXV2h6WXpoiYmrrKyKmpqrvLyrzb2ZururnHtnaGp8R1hYWEhHSEc2NjZHR0hHWFhpSEdHR1hYR1mJeWt7aFhXeHtHRldYemppaJqqvJyqmqqrzZqqzL29qsu6q76Imop6e0dXR1hIWEg3NkZGRkdHNkdIWUZHWFhYWGlZeWpqWVlYVnlqSEhHSFhqaXqsq82bmpqqvLx4q76+qamXmb++iZqKeXtrv0dIWEdZWUhHNmdGRkZGR0hZSEhIR1hZWWlZaHl7WllYWHpqWVhZSFhpWGmKm6yJiYqqvLuqqop4iJi6ubyqvM6beFdoaq9GNTY1R0hHNzZXWEdGRkhZa0g3SFhZaUdGWGl6ampYaVlpakhqaUdYWml6fHt7eYmrvLzuu5qraHeJqqqaqpm6iFZWiHlrNjY1NjU3SEdHV4lHRkdYWVs3SEhZWVlYR1pYappqallZWVlIWGlYSEhYrI2NeompmrzMy8p4eXiaeZqrq4mqqWdVZ5mJZ1hXWEc2JDY2N0g2V0d4SEdIWVpIR0hISEhYSDZZeXp5imtIWEk3WEdXaVdYi9+ti4uqqsy73MvsvXqKnJybvJp4iHdmZniriYlpaWlpams2JSQ1R0dIR0c2eFhIWFlJNzZINzZHR0dHWIl7aXppRzY2R0Y1NkdYaWl6aVh6i6q6qrq727x7e51pequKmYmIiIeaeniJiYqZZ2hpRyUjJDdISFlISEd4WEhIWUc2Njc3NjY2R0hZampYaVg3NUZZRjU1NkdIWHpYRUV7rJmsrJurnHtri4x7nHqJiHeHmldnd4icq3dnaFdXRjYjEiQ2SElZSEhHR2hZNkhZNUZYWEg2JCQ1SGpqaWo1NiVIaVlXRzY2NjdYaUY1r5ytnZ2snJ6ez9/vjYuLmpl3mXdneXibraiHd1c1RkZGIyIkNUdJSFlISEdYRzZHSDVHWXo3JRM0NUdGNkhZJDRHWGlpRkdYR0dHR1d6nJzOrWlpaYvf786+33qLnLyrm5qJiYmLnJh3d1ZXRjU1NSM0NTQ0NUdINjdYSDY2NzY1aFc2JCU1R0clIzU1NjVWWFhYRyQkNUdYWEdHR2lqemlYSEdYR0Zpeq2cz///772qqu28qodnZ2hoWFdGNTU1NjVFV1dHNTZHR0dHRzYkJCVHN0ZHR0c1JDQ0NjYkNVdGRzU1NTZYWUhYRzZHSEhHR0hYWEg3SFmbjIvPi72aq5qZmXh5aFhHV0Y2NjUlNjZHWEZHRiQ2N0dIRzYkJBIkNjU1RldHNjQkNUZGNSUjNTU0JCQ1NkY2RzY1NkdIR0hZa0dHRzY2aYudrWp6e3l5iop5V2lpaVdHRjU1SEglN1hFNUZHNEdHNjU1NTU1NSUkJDZGNTU0JDRGRzYkNSQkJCQkNTQ0JTY2NjZHR1dHWVlHR0g1JWlovntIWWppWGhpaWhHRldXNUc1NDRHRzZHJCQ0RlhHNTQ0NUY1NTYjIyM0NBEiJDUlNBI1JCMkIyMkIzUkIyMkJTU2R0dHWFgkNTZHNiVIR1hYWVlqWVhYWGlXRzZHRzU1JCM0R1hHSDU0NEdYR0Y0IiQ0IyMjIxERIiMzJDQ1NSUjExIBIyMjEhIkJCQkNSQ1NEdGNkc1JTU3RzdHSEdHR0dJWWpZNUdHRjU1NTVHNSQjNEZHN1hHNDUjRjU2NCMjIyMhIREiRTQ0IzU0NTYlJBMSEREjIxIBEiQkJTUjJDQ1IzZHNTU2NkdHSFhHSEhHR0hZWjY1NjY1JCMSJCUjI1lHNjY1RjQjIyQiNTQjIyIiISIRIyQ1MyM0NDU1IxMSERISIxISEyMkIyUkJBMkJCQ2NiQlNjY2SEdHR0dIRyRGSFhINSQlJTQjIyMkNTVaV1haSEg0EiIkIyMkIiMiISIQERI1NjU0NTU1NBITIxISIyQSExMkJDUjNSMjNDQ1NTUjNjY1NkdHNkZGRzU1RkdHSEc1JCQkIyQjJDVZWUZYWFk2RjUkIyMjJDQkIxISEREjJCQSNDUkIyMjEiMjEiMjIyMTEhM0IyQjJDU1NTQ0JDYkNDY2R0c1Rkc2RzY1R0hHNiQkIxI0JDU2SFdYWUdHR0hHIyQkNTU0JCMjIiIjJCQSJCQjIyQkJCMSEiMjEiMkJCQ0IyM1NTY2IyMjEjUkNTY2RzYSNTY2NjY1JCQ1RzUkEyQkNTY2V1laNkdGRlkkIyQkNSMTJCMiIiMjNTQkJCQSIyQkIyMjIyMSIhIBJDUiJDU1RiQjJBITNSQ1NTU2JBIkNjY2NiUkIyMlRzY1NiU2W0hHR0dHRkZGWSMREzUjEiMjIyMjIzQ0JCQjERIjNSQkEhIjIyMBASQ1JDU1NDUkIzUjIyM1NiQkJDY1JCU1JCQkJCMSEyQlR0dHSUdGV2haRzY1RzQSIyMkJCQjIzQjNDQkRSQTEhIjJCUiEhEjJCMjIyQ0IzUjNDYjIyMjEhI1RiMSEiM2JBMkJCMjEyMSIyQkJCVINkZHaUk2R0ZGRyMjIyMjRiMjNSM0JCQkNSMjEhISJRIjEyMjJBIkNSMjIyMjNSIiIiMSNCI0IhEBEjQkIyMjIyMjIyM1NDU1SEg2NWdHR0hIR0ZHNSQkIyM1NTQjNCQkJCMkIyMkEhIkIyMTIyMRIzQ0IyMjIyI0IyIiIiIjEjQSEhISIyQjIyMjExIjJDU0RkZINkVGNTVHWUc1R0Y1NCMjIzY2IzQkNTUkJCMkEiMjJCMjIyMSACIjIyIzMyIRNCIiIiIiIxIjEhISEiM0EhIjIxMSEiQ1NUdISDVGRTU1RkhHRkZGNUY0MyQkRyMjJDQ1JSMkIxISJCQjEiMjEgASIiMiMyMjESQjIhIiESIRIiISEhISJBIjIxISEiMkNTVGWkg=';
    const F = out.dyn && out.dyn.irFar, FD = A.T.def && A.T.def.farDem, CF = F && F.mesh.geometry.attributes.color;
    if (CF && FD && FD.nx * FD.nz === CF.count) {
      const n = CF.count, wet = new Uint8Array(n), b = atob(FAR), L = FD.lake || [];
      for (let k = 0, p = 0, s = 0; k < L.length; k++) { if (s) wet.fill(1, p, p + L[k]); p += L[k]; s ^= 1; }
      for (let k = 0, p = 0; k < n && p < b.length; k++) {
        if (wet[k]) continue;
        const q = b.charCodeAt(p++), kG = 0.9 + (q >> 4) * 0.022, kB = 0.58 + (q & 15) * 0.012;
        const r = (0.3 * CF.getX(k) + 0.59 * CF.getY(k) + 0.11 * CF.getZ(k)) / (0.3 + 0.59 * kG + 0.11 * kB);
        CF.setXYZ(k, r, r * kG, r * kB);
      }
      CF.needsUpdate = true;
    }
  });

  /* ---- Ujarrás (Costa Rica): on the road up past the lookout over the Orosi valley the Sentinel-2 composite of ESA WorldCover 2021
     (6-64 m from the road, the medians of its 14 000 pixels by WorldCover class) has the grass a grey green, G/R 1.02-1.07, B/R 0.87
     (NDVI 0.47-0.57: the pastures, the gardens and the coffee between the houses), the trees 1.03-1.14 and 0.89-0.91; the game's ground
     under them a yellow green, G/R 1.09-1.26, B/R 0.61-0.73. Taken against the built ground of both (in its band: the composite 0.97-1.0
     and 0.83-0.90, the game 1.02-1.06 and 0.80-0.81), the grass's ground is G/R 1.04-1.17, B/R 0.77-0.86, the trees' 1.05-1.25 and
     0.79-0.90: G/R moves down to 1.10 and 1.15 and B/R up to 0.80 and 0.84 (only towards them, never past), its brightness kept; only
     where it is green (the built ground, the verges' grey, the road and the lookout stay as they are). The terrain and the verges ---- */
  wrap('ujarras', (out, scene, tex) => {
    const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const TG = [[1.10, 0.80], [1.15, 0.84]];   // (the G/R and B/R the ground moves to: lc 0 grass, 1 trees)
    const skip = new Set([tex.facade, tex.water, tex.makadam]), v = new THREE.Vector3();
    const tint = (m) => {
      const g = m.geometry, C = g.attributes.color, P = g.attributes.position; if (!C || !P || C.itemSize !== 3) return;
      m.updateMatrixWorld(true);
      for (let i = 0; i < C.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld);
        const w0 = A.vrLCf(v.x, v.z, 0), w1 = A.vrLCf(v.x, v.z, 1), W = w0 + w1; if (W <= 0) continue;
        const r = C.getX(i), gg = C.getY(i), b = C.getZ(i); if (r <= 0) continue;
        const veg = ss(1.0, 1.06, gg / r) * Math.min(1, W); if (veg <= 0) continue;   // (only the green: G above R)
        const tG = (w0 * TG[0][0] + w1 * TG[1][0]) / W, tB = (w0 * TG[0][1] + w1 * TG[1][1]) / W;
        const g2 = gg + (Math.min(gg, tG * r) - gg) * veg, b2 = b + (Math.max(b, tB * r) - b) * veg;
        const s = (0.3 * r + 0.59 * gg + 0.11 * b) / (0.3 * r + 0.59 * g2 + 0.11 * b2);
        C.setXYZ(i, r * s, g2 * s, b2 * s);
      }
      C.needsUpdate = true;
    };
    out.root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.material && o.material.vertexColors && o.material.map && !skip.has(o.material.map) && o.material !== out.asphaltMat) tint(o); });
  });

  /* ---- Killar (India): along the gravel road on the shelf above the Chenab six cloudless Sentinel-2 L2A scenes of the summer (July to
     September 2024 and 2025; 6-64 m from the road, the medians of about 10 000 grass and 5000 tree pixels each by WorldCover class) have
     the grass a khaki grey green, G/R 1.0-1.07, B/R 0.79-0.85 (NDVI 0.51-0.65; in the composite of ESA WorldCover 2021 0.97 and 0.85, and
     the same 64-300 m from the road), the trees 1.14-1.23 and 0.77-0.91; the game's summer ground under them olive green, G/R 1.31, B/R
     0.59 (the meadow, also on WorldCover's bare strip along the road), the forest floor 1.10 and 0.67. Its scree and houses are already
     near the scenes' bare ground (G/R 0.95-0.97 and 0.87-0.90 against 0.95-1.01 and 0.83-0.88), so the green moves to the scenes' as it
     is: G/R down to 1.01 (under the trees 1.17) and B/R up to 0.83 (0.86), only towards them, never past, its brightness kept; only
     where it is green (the rock, the scree, the snow, autumn's straw and the houses stay as they are). The terrain's own material (the
     tiles near and far, the meadow up to the road's edge: no verge, the user's decision of 9. 11. 2026) ---- */
  wrap('killar', (out) => {
    const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const TG = [[1.01, 0.83], [1.17, 0.86]];   // (the G/R and B/R the ground moves to: the grass and the rest of the green, lc 1 trees)
    const gm = out.ground && out.ground.children.length ? out.ground.children[0].material : null; if (!gm) return;
    const v = new THREE.Vector3();
    const tint = (m) => {
      const g = m.geometry, C = g.attributes.color, P = g.attributes.position; if (!C || !P || C.itemSize !== 3) return;
      m.updateMatrixWorld(true);
      for (let i = 0; i < C.count; i++) {
        const r = C.getX(i), gg = C.getY(i), b = C.getZ(i); if (r <= 0 || gg <= 0) continue;
        const veg = ss(1.0, 1.06, gg / r) * ss(0.1, 0.25, (gg - b) / gg); if (veg <= 0) continue;   // (only the green: G above R and B; not the snow)
        v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld);
        const w1 = Math.min(1, A.vrLCf(v.x, v.z, 1)), tG = TG[0][0] + (TG[1][0] - TG[0][0]) * w1, tB = TG[0][1] + (TG[1][1] - TG[0][1]) * w1;
        const g2 = gg + (Math.min(gg, tG * r) - gg) * veg, b2 = b + (Math.max(b, tB * r) - b) * veg;
        const s = (0.3 * r + 0.59 * gg + 0.11 * b) / (0.3 * r + 0.59 * g2 + 0.11 * b2);
        C.setXYZ(i, r * s, g2 * s, b2 * s);
      }
      C.needsUpdate = true;
    };
    out.root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.material === gm) tint(o); });
  });

  /* ---- Ngorongoro (Tanzania): the road over the crater's rim in the dry season. OSM has nothing more by it than the game already has (the
     gate, the lookout, the lay-by, the fence, the huts; the picnic site and the springs lie 1.1 km past the finish), so it is its ground:
     28 cloudless Sentinel-2 L2A scenes of the dry season (July to September 2024 and 2025; 6-64 m from the road, the medians of its 1700
     grass, 2100 shrub and 160 tree pixels by WorldCover class) have the grass a tan, G/R 0.74, B/R 0.57 (the straw over the red-brown
     soil; 64-400 m the same, 0.735 and 0.573), the shrubs 0.83 and 0.65, the trees 0.90 and 0.68; the game's ground under them a yellow
     green, G/R 0.97 (shrubs 1.07-1.09, trees 1.19-1.23), B/R 0.55-0.63 (the composite of ESA WorldCover 2021, a whole year with the wet
     seasons, has them greener too: 0.90, 1.07 and 1.34). The scenes' ratios are of light, the game's colours the screen's (three r128
     without sRGB output: its murram is G/R 0.75-0.78), so they go to the screen's scale first, ^(1/2.2): the grass 0.87 and 0.78, the
     shrubs 0.92 and 0.82, the trees 0.95 and 0.84 (as they are, the grass came out the murram's orange: docs/realizem/k5-ngorongoro.jpg).
     G/R moves down to them and B/R up (only towards them, never past), its brightness kept; only where it is a plant's (G well above B
     and not below 0.8 R: the soil, the paths, the verges' murram, the rock bands, the houses and the water stay as they are). The
     terrain's tiles and the verges out to the ditch; the far view (ngFar) not ---- */
  wrap('ngorongoro', (out) => {
    const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const TG = [[0.74, 0.57], [0.90, 0.68], [0.83, 0.65]].map(t => t.map(x => Math.pow(x, 1 / 2.2)));   // (lc 0 grass, 1 trees, 2 shrubs; on the screen's scale)
    const gm = out.ground && out.ground.children.length ? out.ground.children[0].material : null; if (!gm) return;
    const v = new THREE.Vector3();
    const tint = (m) => {
      const g = m.geometry, C = g.attributes.color, P = g.attributes.position; if (!C || !P || C.itemSize !== 3) return;
      m.updateMatrixWorld(true);
      for (let i = 0; i < C.count; i++) {
        const r = C.getX(i), gg = C.getY(i), b = C.getZ(i); if (r <= 0 || gg <= 0) continue;
        const veg = ss(0.8, 0.88, gg / r) * ss(0.2, 0.32, (gg - b) / gg); if (veg <= 0) continue;   // (only a plant's: not the soil, the rock, the houses)
        v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld);
        const w = [0, 1, 2].map(c => A.vrLCf(v.x, v.z, c)), W = w[0] + w[1] + w[2]; if (W <= 0) continue;
        const tG = (w[0] * TG[0][0] + w[1] * TG[1][0] + w[2] * TG[2][0]) / W, tB = (w[0] * TG[0][1] + w[1] * TG[1][1] + w[2] * TG[2][1]) / W, k = veg * Math.min(1, W);
        const g2 = gg + (Math.min(gg, tG * r) - gg) * k, b2 = b + (Math.max(b, tB * r) - b) * k;
        const s = (0.3 * r + 0.59 * gg + 0.11 * b) / (0.3 * r + 0.59 * g2 + 0.11 * b2);
        C.setXYZ(i, r * s, g2 * s, b2 * s);
      }
      C.needsUpdate = true;
    };
    const grit = A.vrGritTex();   // (the verges' ground out to the ditch: World's grit, js/world-ngorongoro.js gMat)
    out.root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.material && o.material !== out.asphaltMat && (o.material === gm || (o.material.vertexColors && o.material.map === grit))) tint(o); });
  });
})();
