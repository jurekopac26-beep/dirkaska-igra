/* =========================================================================
   WORLD — Realizem 10 (docs/realizem.md, »Postopek za vse proge«): the chase camera's view on the real forest and lake roads that are
   outside the 15 packages and the other open realism branches: Koli, Finska (the boreal forest over Pielinen, in winter), Medeu,
   Kazahstan (the Tian Shan spruce of the Malaya Almatinka valley), Kanaba, Uganda (the Kigezi hills), Ella, Šrilanka (the montane forest
   under Ella Rock). A wrap of each road's own builder (World.ext[id], as js/world-aguascalientes.js wraps the shared one): what it adds goes
   into the world's root after that builder ran, from the sources only: OpenStreetMap (ODbL 1.0), ESA WorldCover 2021 (CC BY 4.0, def.lc),
   Copernicus DEM GLO-30 (def.dem). No names, letters, firms or people. It changes neither js/world.js, js/render.js nor the roads' own
   files; the same seed every build (Math.random is its own while it runs), so the pictures and the tests repeat.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const SEED = 15485867;
  const uu = { s: SEED };
  const own = (fn) => { const r = Math.random; Math.random = () => (uu.s = (uu.s * 48271) % 2147483647) / 2147483647; try { return fn(); } finally { Math.random = r; } };

  const R10 = {};   // per road: (out, api, st, opts) adds its own things to out.root; st: what it added (out.stats.kamera10)

  const wrap = (id) => {
    const base = World.ext[id]; if (typeof base !== 'function') return;
    World.ext[id] = function (scene, tex, opts, api) {
      const out = base.call(this, scene, tex, opts, api);
      if (out && out.root && R10[id]) {
        const st = (out.stats = out.stats || {}).kamera10 = {};
        uu.s = SEED;
        try { own(() => R10[id](out, api || {}, st, opts || {})); } catch (e) { console.error('realizem10 (' + id + '):', e); }
      }
      return out;
    };
  };
  for (const id of ['koli', 'medeu', 'kanaba', 'ella']) wrap(id);
})();
