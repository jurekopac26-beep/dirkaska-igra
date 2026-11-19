// Fewer draw calls on the tightest real mountain and open roads (NIZKA, 844x390, the chase camera, dry and in the rain: the measurements
// are in the pull request's description, tests/golden/perf.json stays as it is), with the picture unchanged.
//
// The world as built is never changed: between two renders its graph, meshes and geometries are as World.build made them (the world's
// fingerprint, raycasts, the season and the tools see it so). For a track listed in BY, at the world's first frame (after Render's season,
// lights and asphalt), plain static meshes of one parent and one material, with the same attributes and casting no shadow (the shadow pass
// stays as it was), near one another (each heap within a sphere of radius cfg.r), are joined into one mesh kept outside the world. Only
// inside the renderer's render (the scene's onBeforeRender and onAfterRender, which nothing else in the game sets) does the parent's list
// of children hold the joined mesh in the place of its first piece and not the others; after the render the parent's own list is back.
// Each render checks every heap: a piece moved, hidden, given other children, another material or shadow: that heap's pieces are drawn
// themselves; a piece's colours changed (the season paints each piece's own colours, every vertex with its own number): copied into the
// joined mesh; anything else in its geometry changed: that heap is never joined again. Of a joined mesh only the stretch from the first
// to the last of its pieces the camera sees is drawn (each piece's own sphere against the camera's frustum, as three culled the pieces;
// those between them it does not see fall outside the picture), one call instead of several; after each draw the whole mesh again.
// Left as they are: everything the world object itself reaches (its lists: the culling, the low shadows, the weather's meshes, the
// ground), named, hidden, moving or see-through meshes, and any with userData, own callbacks or shared, changing geometry.
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.build || typeof THREE === 'undefined') return;
  const BY = {};   // track id -> function (world, track, opts): that world's tidying
  const PG = World.perfGore = { BY, off: false, last: null };   // off: build as before (the pixel comparison); last: what the last tidying did
  const O3 = THREE.Object3D.prototype, ID = new THREE.Matrix4();
  const LIVE = [], HOOKED = new WeakSet(), SW = [];   // the tidied worlds; the scenes with the hooks; the parents swapped right now

  // everything reachable from the world object's own properties (besides root): its meshes, geometries and attributes are not touched
  function held(w) {
    const R = new Set(), seen = new Set();
    const walk = (v, d) => {
      if (!v || typeof v !== 'object' || d > 6 || seen.has(v)) return;
      seen.add(v);
      if (v.isObject3D) { v.traverse(o => { R.add(o); if (o.geometry) R.add(o.geometry); }); return; }
      if (v.isBufferGeometry || v.isBufferAttribute || v.isInterleavedBufferAttribute) { R.add(v); return; }
      if (v.isMaterial || v.isTexture || ArrayBuffer.isView(v)) return;
      if (v instanceof Map) { for (const [k, x] of v) { walk(k, d + 1); walk(x, d + 1); } return; }
      if (v instanceof Set || Array.isArray(v)) { for (const x of v) walk(x, d + 1); return; }
      for (const k of Object.keys(v)) walk(v[k], d + 1);
    };
    for (const k of Object.keys(w)) if (k !== 'root') walk(w[k], 0);
    return R;
  }

  // a mesh that can be joined: drawn as it is, standing still, with nothing else holding it
  function plain(o, R, uses) {
    if (!o.isMesh || o.type !== 'Mesh' || o.isInstancedMesh || o.isSkinnedMesh || !o.visible || o.name !== '' || o.children.length) return false;
    if (o.matrixAutoUpdate || !o.matrix.equals(ID) || !o.frustumCulled || R.has(o) || o.customDepthMaterial || o.customDistanceMaterial) return false;
    if (o.onBeforeRender !== O3.onBeforeRender || o.onAfterRender !== O3.onAfterRender || o.morphTargetInfluences) return false;
    for (const k in o.userData) if (k !== 'src') return false;   // (src: tools/obremenitev.mjs)
    const m = o.material;
    if (!m || Array.isArray(m) || !m.visible || m.transparent || !m.depthWrite || !m.depthTest || m.blending !== THREE.NormalBlending) return false;
    const g = o.geometry;
    if (!g || !g.isBufferGeometry || R.has(g) || uses.get(g) !== 1 || g.groups.length || g.drawRange.start !== 0 || g.drawRange.count !== Infinity) return false;
    if (Object.keys(g.morphAttributes).length || Object.keys(g.userData).length || !g.attributes.position) return false;
    const n = g.attributes.position.count;
    if (!n) return false;
    for (const k in g.attributes) {
      const a = g.attributes[k];
      if (!a.isBufferAttribute || a.isInstancedBufferAttribute || R.has(a) || a.count !== n || a.array.length !== n * a.itemSize || a.usage !== THREE.StaticDrawUsage) return false;
    }
    return !g.index || (!R.has(g.index) && g.index.count === g.index.array.length);
  }

  // the pieces' geometries one after another (attributes in the same order, the indices moved by the vertices before them)
  function join(list) {
    const g0 = list[0], out = new THREE.BufferGeometry(), offs = [];
    let nV = 0, nI = 0;
    for (const g of list) { offs.push(nV); nV += g.attributes.position.count; if (g.index) nI += g.index.count; }
    for (const k in g0.attributes) {
      const a0 = g0.attributes[k], A = new a0.array.constructor(nV * a0.itemSize);
      list.forEach((g, i) => A.set(g.attributes[k].array, offs[i] * a0.itemSize));
      out.setAttribute(k, new THREE.BufferAttribute(A, a0.itemSize, a0.normalized));
    }
    if (g0.index) {
      const I = nV > 65535 ? new Uint32Array(nI) : new Uint16Array(nI);
      let p = 0;
      list.forEach((g, i) => { const s = g.index.array, d = offs[i]; for (let j = 0; j < s.length; j++) I[p++] = s[j] + d; });
      out.setIndex(new THREE.BufferAttribute(I, 1));
    }
    out.computeBoundingSphere(); out.computeBoundingBox();
    let p = 0;
    const parts = list.map(g => { const n = g.index ? g.index.count : g.attributes.position.count, r = [p, n]; p += n; return r; });   // (each piece's [start, count] drawn)
    return { geo: out, offs, parts };
  }

  // two spheres' bounding sphere
  function union(c1, r1, c2, r2) {
    const d = c1.distanceTo(c2);
    if (d + r2 <= r1) return { c: c1.clone(), r: r1 };
    if (d + r1 <= r2) return { c: c2.clone(), r: r2 };
    const r = (d + r1 + r2) / 2;
    return { c: c1.clone().lerp(c2, (r - r1) / d), r };
  }

  // which meshes are joined: those alike (parent, material, attributes), casting no shadow, near one another: each heap no wider than a
  // sphere of radius cfg.r (the camera's frustum takes or leaves the joined mesh as a whole before its stretch is chosen)
  function plan(w, cfg) {
    const root = w.root, R = held(w), uses = new Map(), groups = new Map(), out = [];
    root.traverse(o => { if (o.geometry) uses.set(o.geometry, (uses.get(o.geometry) || 0) + 1); });
    root.traverse(o => {
      if (o.castShadow || !plain(o, R, uses)) return;
      const g = o.geometry;
      if (!g.boundingSphere) g.computeBoundingSphere();
      const sig = Object.keys(g.attributes).sort().map(k => { const a = g.attributes[k]; return k + a.itemSize + a.array.constructor.name + (a.normalized ? 'n' : '') + (a.noSeason ? 's' : ''); }).join(',');
      const key = [o.parent.id, o.material.id, +o.receiveShadow, o.renderOrder, o.layers.mask, g.index ? 'i' : 'a', sig].join('|');
      let G = groups.get(key);
      if (!G) groups.set(key, G = []);
      G.push(o);
    });
    for (const G of groups.values()) {
      const heaps = [];
      for (const o of G) {
        const s = o.geometry.boundingSphere;
        if (s.radius > cfg.r) continue;
        let best = null, bu = null;
        for (const h of heaps) { const u = union(h.c, h.r, s.center, s.radius); if (u.r <= cfg.r && (!bu || u.r < bu.r)) { best = h; bu = u; } }
        if (best) { best.c = bu.c; best.r = bu.r; best.list.push(o); } else heaps.push({ c: s.center.clone(), r: s.radius, list: [o] });
      }
      for (const h of heaps) if (h.list.length > 1) out.push(h.list);
    }
    return out;
  }

  // only the stretch of the joined mesh from the first to the last piece in the camera's frustum (none: nothing drawn)
  const FR = new THREE.Frustum(), PS = new THREE.Matrix4(), SP = new THREE.Sphere();
  function spanOf(sph, parts) {
    return function (r, sc, cam, g) {
      PS.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); FR.setFromProjectionMatrix(PS);
      let a = -1, b = -1;
      for (let i = 0; i < sph.length; i++) if (FR.intersectsSphere(SP.copy(sph[i]).applyMatrix4(this.matrixWorld))) { if (a < 0) a = i; b = i; }
      g.drawRange.start = a < 0 ? 0 : parts[a][0]; g.drawRange.count = a < 0 ? 0 : parts[b][0] + parts[b][1] - parts[a][0];
    };
  }
  function whole(r, sc, cam, g) { g.drawRange.start = 0; g.drawRange.count = Infinity; }

  // a geometry's attributes and index with their versions, as joined (what each render compares)
  function vers(g) {
    const v = [];
    for (const k in g.attributes) v.push(g.attributes[k], g.attributes[k].version);
    v.push(g.index, g.index ? g.index.version : 0);
    return v;
  }

  // the world's heaps joined (at its first frame)
  function make(L) {
    L.heaps = []; L.pars = [];
    const by = new Map();
    for (const G of plan(L.w, L.cfg)) {
      const o0 = G[0], p = o0.parent, { geo, offs, parts } = join(G.map(o => o.geometry)), M = new THREE.Mesh(geo, o0.material);
      M.matrixAutoUpdate = false; M.parent = p;
      if (o0.userData.src) M.userData.src = o0.userData.src;
      M.onBeforeRender = spanOf(G.map(o => o.geometry.boundingSphere.clone()), parts); M.onAfterRender = whole;
      const h = { M, G, p, offs, geos: G.map(o => o.geometry), nv: G.map(o => o.geometry.attributes.position.count), ver: G.map(o => vers(o.geometry)), dead: false, on: false };
      L.heaps.push(h);
      let P = by.get(p);
      if (!P) { by.set(p, P = { p, first: new Map(), rest: new Map(), alt: [], own: null }); L.pars.push(P); }
      P.first.set(o0, h);
      for (let i = 1; i < G.length; i++) P.rest.set(G[i], h);
      L.st.meshes += G.length; L.st.into++;
    }
  }

  // can the heap be drawn as one this render: its pieces as they were joined (their new colours brought over)
  function ready(h) {
    if (h.dead) return false;
    const G = h.G, o0 = G[0], m = o0.material, M = h.M;
    if (!m || Array.isArray(m) || !m.visible || m.transparent) return false;
    for (let i = 0; i < G.length; i++) {
      const o = G[i], g = o.geometry;
      if (o.parent !== h.p || !o.visible || o.children.length || o.material !== m || o.castShadow || o.receiveShadow !== o0.receiveShadow || o.renderOrder !== o0.renderOrder) return false;
      if (o.layers.mask !== o0.layers.mask || !o.frustumCulled || o.matrixAutoUpdate || !o.matrix.equals(ID) || o.onBeforeRender !== O3.onBeforeRender || o.onAfterRender !== O3.onAfterRender) return false;
      if (g !== h.geos[i] || g.groups.length || g.drawRange.start !== 0 || g.drawRange.count !== Infinity) return false;
      const v = h.ver[i];
      let j = 0;
      for (const k in g.attributes) {
        const a = g.attributes[k];
        if (j >= v.length - 2 || v[j] !== a) { h.dead = true; return false; }
        if (v[j + 1] !== a.version) {
          const c = M.geometry.attributes[k];
          if (k !== 'color' || !c || a.itemSize !== c.itemSize || a.array.length !== h.nv[i] * a.itemSize) { h.dead = true; return false; }
          c.array.set(a.array, h.offs[i] * c.itemSize); c.needsUpdate = true; v[j + 1] = a.version;
        }
        j += 2;
      }
      if (j !== v.length - 2 || v[j] !== g.index || (g.index && v[j + 1] !== g.index.version)) { h.dead = true; return false; }
    }
    M.material = m; M.receiveShadow = o0.receiveShadow; M.renderOrder = o0.renderOrder; M.layers.mask = o0.layers.mask;
    return true;
  }

  // before the render: the joined meshes into their parents' lists (each parent's own list kept aside)
  function swapIn(scene) {
    swapOut();   // (a render that threw before its end)
    for (const L of LIVE) {
      if (L.scene !== scene || L.root.parent !== scene || L.broken) continue;
      try {
        if (!L.heaps) make(L);
        for (const h of L.heaps) if ((h.on = ready(h))) h.M.matrixWorld.copy(h.p.matrixWorld);
        for (const P of L.pars) {
          const p = P.p, alt = P.alt;
          let any = false;
          alt.length = 0;
          for (const o of p.children) {
            let h = P.first.get(o);
            if (h !== undefined && h.on) { alt.push(h.M); any = true; continue; }
            h = P.rest.get(o);
            if (h === undefined || !h.on) alt.push(o);
          }
          if (!any) continue;
          P.own = p.children; p.children = alt; SW.push(P);
        }
      } catch (e) { L.broken = true; swapOut(); console.warn('perf-gore', e); return; }
    }
    if (SW.length) queueMicrotask(swapOut);
  }
  // after the render: each parent's own list back
  function swapOut() {
    for (const P of SW) { P.p.children = P.own; P.own = null; }
    SW.length = 0;
  }
  function hook(scene) {
    if (HOOKED.has(scene)) return;
    HOOKED.add(scene);
    const b0 = scene.onBeforeRender, a0 = scene.onAfterRender;
    const after = function () { swapOut(); return a0.apply(this, arguments); };
    scene.onBeforeRender = function () { const r = b0.apply(this, arguments); if (scene.onAfterRender === after) swapIn(scene); return r; };
    scene.onAfterRender = after;
  }

  // the tidying: the world's heaps are planned and joined at its first frame (PG.last: how many meshes, into how many)
  function merge(w, cfg) {
    const scene = w.root.parent, st = { meshes: 0, into: 0 };
    if (!scene || !scene.isScene) return st;
    LIVE.push({ scene, root: w.root, w, cfg, st, heaps: null, pars: null, broken: false });
    hook(scene);
    return st;
  }

  const build = World.build;
  World.build = function (scene, track, tex, opts) {
    for (let n = LIVE.length - 1; n >= 0; n--) {   // (the worlds taken out of their scenes: their joined meshes freed)
      const L = LIVE[n];
      if (L.root.parent) continue;
      if (L.heaps) for (const h of L.heaps) h.M.geometry.dispose();
      LIVE.splice(n, 1);
    }
    const w = build.apply(this, arguments);
    const id = track && track.def && track.def.id, f = !PG.off && id && BY[id];
    PG.last = null;
    if (f && w && w.root) { try { PG.last = f(w, track, opts || {}); } catch (e) { console.warn('perf-gore', id, e); } }
    return w;
  };
  PG.merge = merge; PG.plan = plan;
  for (const id of ['kotor', 'sacalobra', 'portomoniz', 'tianmen', 'kanaba', 'izoard', 'ella', 'chapman', 'savusavu', 'koror', 'santoantao']) BY[id] = (w) => merge(w, { r: 150 });
})();
