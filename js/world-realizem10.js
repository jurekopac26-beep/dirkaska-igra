/* =========================================================================
   WORLD — Realizem 10 (docs/realizem.md, »Postopek za vse proge«): the chase camera's view on the real forest and lake roads that are
   outside the 15 packages and the other open realism branches: Koli, Finska (the boreal forest over Pielinen, in winter), Medeu,
   Kazahstan (the Tian Shan spruce of the Malaya Almatinka valley), Kanaba, Uganda (the Kigezi hills), Ella, Šrilanka (the montane forest
   under Ella Rock). A wrap of each road's own builder (World.ext[id], as js/world-aguascalientes.js wraps the shared one): what it adds goes
   into the world's root after that builder ran, from the sources only: OpenStreetMap (ODbL 1.0), ESA WorldCover 2021 (CC BY 4.0, def.lc),
   Copernicus DEM GLO-30 (def.dem). No names, letters, firms or people. It changes neither js/world.js, js/render.js nor the roads' own
   files. Every build the same: what it decides (shapes, places) comes from seeded numbers (World.api.rng); what it makes, three.js names
   with Math.random, which the browser tests seed and share with the race, so it makes it with Math.random swapped for its own generator
   (never reset, so the names stay unique; as World's ownRnd), and a seeded race draws what it drew without it.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const uu = { s: 15485867 };
  const own = (fn) => { const r = Math.random; Math.random = () => (uu.s = (uu.s * 48271) % 2147483647) / 2147483647; try { return fn(); } finally { Math.random = r; } };

  const PRE = {};   // per road: (A, st) → undo; what it changes, it changes only while the road's own builder runs (undo() after it, always)
  const R10 = {};   // per road: (out, api, st, opts) adds its own things to out.root; st: what it changed and added (out.stats.kamera10)

  /* ---- Kanaba (Uganda): the trees of the Kigezi highlands. The shared world of the passes (js/world-prelaz.js, buildPrelaz, PL_LOOK.kanaba) puts the
     Alps' plants on ESA WorldCover's tree and shrub classes (lc 1, lc 2): the Norway spruce (a narrow dark spire, 10–22 m), the dwarf pine and the
     juniper in low mats. None of them grows in Kigezi: the woods by the road are planted eucalyptus (docs/proge/kanaba.md, »Drevesa«: »v resnici so
     ob cesti veliko evkaliptusov in nasadi«; the track's own description: »evkaliptusi«), WorldCover's shrubland a broadleaf scrub. While buildPrelaz
     runs, the trees' IChunks (one material, tMatT; told apart by the sizes buildPrelaz gives them) get these shapes for the spruce's and the mats'
     (the same places and the same number: WorldCover decides where, as before), in the soft look of all the game's trees (Drevesa A,
     docs/drevesa-a.md: the user's pick 5. 11. 2026): a eucalyptus (as js/world-portomoniz.js eucGeo: a slim pale trunk, bare to over half its
     height, under an open crown of a few soft grey-green clumps), and a broadleaf bush (three soft lumps of a duller green). Both cheaper
     together than what they replace (the eucalyptus 255 indices for the spruce's 192, the bushes 180 for the mats' 360 and 240). ---- */
  PRE.kanaba = (A, st) => {
    const IC = A.IChunks, P = IC && IC.prototype, orig = P && P.addTo; if (typeof orig !== 'function' || !A.AB || !A.aPuff || !A.aTrunk || !A.rng || !A.vary) return null;
    let tMat = null; const geos = {};
    const unit = (key, seed, mat, fn) => {   // a unit plant (1 high; the instances scale and tint it), built with the kit (AB, aPuff, aTrunk), indexed
      if (!geos[key]) geos[key] = own(() => {
        const b = new A.AB(); fn(b, A.rng(seed)); const geo = b.geometry();
        new IC(geo, mat, 96);   // (IChunks decides, once, that it is a tree, as for every tree: geo.userData.treeH; on NIZKA its shadow the trees', treeShadow)
        st['i_' + key] = geo.index.count; return geo;
      });
      return geos[key];
    };
    const euc = (mat) => unit('evkalipt', 7331, mat, (b, R) => {   // (85 faces)
      A.aTrunk(b, 0, -0.02, 0, 0.022, 0.82, 5, [0.66, 0.62, 0.55]);   // (the bole: smooth, pale grey-cream; darker at its foot)
      const leaf = [0.28, 0.36, 0.26];   // (the dull grey-green of the leaves)
      for (const [x, y, z, r, sy] of [[0.02, 0.86, 0, 0.13, 1], [0.15, 0.74, 0.06, 0.13, 0.85], [-0.13, 0.7, -0.05, 0.13, 0.85], [0, 0.62, -0.13, 0.11, 0.9]])
        A.aPuff(b, x, y, z, r, sy, A.vary(leaf, R, 0.1), R, 0.35, 0.55, 1.15);
    });
    const bush = (mat, dry) => unit(dry ? 'grm2' : 'grm1', dry ? 7349 : 7343, mat, (b, R) => {   // (60 faces; sunk 0.15 m into the ground, as buildPrelaz sets every plant)
      const col = dry ? [0.21, 0.26, 0.14] : [0.16, 0.25, 0.11];   // (the scrub's dull green; the second drier, where the juniper's grey mats were)
      for (const [x, y, z, r, sy] of [[0, 0.38, 0, 0.36, 0.95], [0.25, 0.3, 0.12, 0.26, 0.9], [-0.22, 0.28, -0.15, 0.25, 0.9]]) A.aPuff(b, x, y, z, r, sy, A.vary(col, R, 0.14), R, 0.3, 0.55, 1.15);
    });
    const kinds = (ic) => {   // [n, spruce, dwarf pine, juniper]: how many of its instances have the sizes buildPrelaz gives each (h 10–22 m, w 0.3–0.38 h; h 0.9–2.3, w 2.2–5.4; h 0.5–1.1, w 1.4–3.4)
      let n = 0, a = 0, b = 0, c = 0;
      for (const L of ic.map.values()) for (let k = 0; k < L.length; k += 9) { const w = L[k + 4], h = L[k + 5]; n++;
        if (h >= 9.5 && h <= 22.5 && w <= h * 0.4) a++; if (h >= 0.85 && h <= 2.35 && w >= 2.1 && w <= 5.5) b++; if (h >= 0.45 && h <= 1.15 && w >= 1.35 && w <= 3.45) c++; }
      return [n, a, b, c];
    };
    P.addTo = function (group, cast) {
      try {
        if (this.map && this.map.size && this.mat && this.mat.vertexColors) {
          const [n, a, b, c] = kinds(this);
          if (!tMat && a === n) {   // the spruce: a eucalyptus, its crown a little wider than the spruce's spire (0.39–0.49 of its height)
            tMat = this.mat; this.base = euc(this.mat);
            for (const L of this.map.values()) for (let k = 0; k < L.length; k += 9) L[k + 4] *= 1.3;
            st.evkalipt = n;
          } else if (tMat && this.mat === tMat && (b === n || c === n)) { this.base = bush(this.mat, c === n); st.grm = (st.grm || 0) + n; }
        }
      } catch (e) { console.error('realizem10 (kanaba):', e); }
      return orig.call(this, group, cast);
    };
    return () => { P.addTo = orig; };
  };

  const wrap = (id) => {
    const base = World.ext[id]; if (typeof base !== 'function') return;
    World.ext[id] = function (scene, tex, opts, api) {
      const A = World.api, st = {};
      let undo = null;
      if (PRE[id]) try { undo = PRE[id](A, st); } catch (e) { console.error('realizem10 (' + id + '):', e); }
      let out;
      try { out = base.call(this, scene, tex, opts, api); } finally { if (undo) undo(); }
      if (out && out.root) {
        (out.stats = out.stats || {}).kamera10 = st;
        if (R10[id]) try { own(() => R10[id](out, api || {}, st, opts || {})); } catch (e) { console.error('realizem10 (' + id + '):', e); }
      }
      return out;
    };
  };
  for (const id of ['koli', 'medeu', 'kanaba', 'ella']) wrap(id);
})();
