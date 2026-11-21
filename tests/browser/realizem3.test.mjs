// Realizem, skupina 3 (js/world-realizem3.js, docs/realizem.md): what the chase camera sees of Montréal, Štajerska and Chapman's Peak, on
// top of their own worlds. Chapman's Peak: the steep faces of its terrain (pkGroundMat, js/world-pikes.js) are rock: its terrain's materials
// patched (stats.kamera3.skala, as many as are keyed 'pkGround2k3'), their program compiled and linked, the rock in it (k3Rock); the same
// meshes as before (a shader only: no draw call more). In the rain its ground darkens with the road: the terrain (the rock, its streaks) and
// the verge (stats.kamera3.rob, keyed 'k3WetVerge') read one uniform, k3Wet, which Render's water sets through the world's dyn.wet
// (stats.kamera3.mokro): 0 dry, 1 at Render's full wet ground (its colour 0.8), and 1 on a race in the rain. Montréal and Štajerska carry the
// wrapper's mark; Bathurst, which World.ext.rbring builds too, nothing of it (the change goes only on the track asked). No page errors (a
// shader that does not compile is one).
//   node tests/browser/realizem3.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker("Realizem 3: Montréal, Štajerska, Chapman's Peak (the chase camera)");
const srv = await serve();
const browser = await launch();
const SET = { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', season: 'summer', tod: 'day', mode: 'tt' };
try {
  const look = async (page, id, probe) => {
    await startTrack(page, id);
    return page.evaluate(async (probe) => {
      const g = window.__game, W = Render.world, SC = Render.scene, raf = () => new Promise(res => requestAnimationFrame(res));
      // the renderer (Render keeps it to itself): caught at the scene's next frame
      let RR = null; const own = Object.prototype.hasOwnProperty.call(SC, 'onBeforeRender'), ob = SC.onBeforeRender;
      SC.onBeforeRender = function (rr) { RR = rr; }; for (let k = 0; k < 60 && !RR; k++) await raf();
      if (own) SC.onBeforeRender = ob; else delete SC.onBeforeRender;
      g.pause(); Render.precompile(); for (let k = 0; k < 3; k++) await raf();
      const key = (M) => M && M.customProgramCacheKey ? M.customProgramCacheKey() : '';   // (Render's clouds prefix the key: 'cloud|pkGround2k3')
      const k3 = (W.stats || {}).kamera3, mats = new Set(), verge = new Set(); let meshes = 0;
      for (const m of (W.ground ? W.ground.children : [])) { meshes++; if (/(^|\|)pkGround2k3$/.test(key(m.material))) mats.add(m.material); }
      W.root.traverse(o => { if (o.material && !Array.isArray(o.material) && /(^|\|)k3WetVerge$/.test(key(o.material))) verge.add(o.material); });
      const prog = [];
      if (RR) {
        const gl = RR.getContext();
        for (const p of RR.info.programs || []) {
          const kind = /pkGround2k3/.test(p.cacheKey || '') ? 'rock' : /k3WetVerge/.test(p.cacheKey || '') ? 'verge' : ''; if (!kind) continue;
          const sh = (gl.getAttachedShaders(p.program) || []).map(s => ({ ok: gl.getShaderParameter(s, gl.COMPILE_STATUS), src: gl.getShaderSource(s) || '' }));
          prog.push({ kind, link: !!gl.getProgramParameter(p.program, gl.LINK_STATUS), ok: sh.every(s => s.ok !== false), rock: sh.some(s => /k3Rock\(/.test(s.src)), wet: sh.some(s => /uniform float k3Wet;/.test(s.src)) });
        }
      }
      // the water the shaders get (the uniform as the renderer keeps it for each material), as it is and as Render's dyn.wet sets it
      const wetU = () => [...mats, ...verge].map(M => { const u = RR && RR.properties.get(M).uniforms; return u && u.k3Wet ? u.k3Wet.value : null; });
      const wet = { now: wetU() };
      if (probe && W.dyn && W.dyn.wet) { const G = W.dyn.wet.ground.color; G.setScalar(0.8); wet.full = wetU(); G.setScalar(0.9); wet.half = wetU(); G.setScalar(1); wet.dry = wetU(); }
      return { k3: k3 ? JSON.parse(JSON.stringify(k3)) : null, mats: mats.size, verge: verge.size, meshes, prog, rr: !!RR, wet };
    }, !!probe);
  };
  const all = (a, v) => a.length > 0 && a.every(x => x != null && Math.abs(x - v) < 1e-6);

  const { page, errors } = await openGame(browser, srv.base + '/index.html', SET, { width: 640, height: 360 });
  const ch = await look(page, 'chapman', true);
  T.check("Chapman's Peak: its terrain's materials get the rock of the cut face", !!ch.k3 && ch.k3.skala >= 1 && ch.mats === ch.k3.skala && ch.meshes >= 1,
    ch.k3 ? `${ch.k3.skala} patched, ${ch.mats} keyed pkGround2k3, ${ch.meshes} terrain meshes` : 'no stats.kamera3');
  T.check('the rock program compiles and links, k3Rock and the water in it', ch.rr && ch.prog.some(p => p.kind === 'rock') && ch.prog.filter(p => p.kind === 'rock').every(p => p.link && p.ok && p.rock && p.wet),
    ch.rr ? JSON.stringify(ch.prog) : 'no renderer');
  T.check('the verge darkens in the rain too: its material patched, its program compiles and links', !!ch.k3 && ch.k3.rob >= 1 && ch.verge === ch.k3.rob && ch.prog.some(p => p.kind === 'verge') && ch.prog.filter(p => p.kind === 'verge').every(p => p.link && p.ok && p.wet),
    ch.k3 ? `${ch.k3.rob} patched, ${ch.verge} keyed k3WetVerge, ` + JSON.stringify(ch.prog.filter(p => p.kind === 'verge')) : 'no stats.kamera3');
  T.check("Render's water reaches the shaders: dry 0, its full wet ground 1, half 0.5", !!ch.k3 && ch.k3.mokro === true && all(ch.wet.now, 0) && all(ch.wet.full || [], 1) && all(ch.wet.half || [], 0.5) && all(ch.wet.dry || [], 0),
    JSON.stringify(ch.wet));
  for (const [id, name] of [['montreal', 'Montréal'], ['rbring', 'Štajerska']]) {
    const r = await look(page, id);
    T.check(`${name}: the wrapper's mark, nothing of the rock or the water`, !!r.k3 && !r.k3.skala && !r.k3.rob && !r.k3.mokro && r.mats === 0 && r.verge === 0, JSON.stringify(r.k3) + `, ${r.mats} keyed pkGround2k3, ${r.verge} k3WetVerge`);
  }
  const bt = await look(page, 'bathurst');
  T.check('Bathurst (World.ext.rbring builds it too): nothing of it', !bt.k3 && bt.mats === 0 && bt.verge === 0, JSON.stringify(bt.k3));
  T.check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

  // a race in the rain: the water on the road from the start (core.js: wst.water = rain), so the ground wet as well
  const rain = await openGame(browser, srv.base + '/index.html', Object.assign({}, SET, { weather: 'rain' }), { width: 640, height: 360 });
  const cr = await look(rain.page, 'chapman');
  T.check("Chapman's Peak in the rain: the ground's shaders get the water (k3Wet 1)", all(cr.wet.now, 1), JSON.stringify(cr.wet));
  T.check('no page errors in the rain', rain.errors.length === 0, rain.errors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
