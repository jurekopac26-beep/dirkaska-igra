// Realizem, skupina 3 (js/world-realizem3.js, docs/realizem.md): what the chase camera sees of Montréal, Štajerska and Chapman's Peak, on
// top of their own worlds. Chapman's Peak: the steep faces of its terrain (pkGroundMat, js/world-pikes.js) are rock: its terrain's materials
// patched (stats.kamera3.skala, as many as are keyed 'pkGround2k3'), their program compiled and linked, the rock in it (k3Rock); the same
// meshes as before (a shader only: no draw call more). Montréal and Štajerska carry the wrapper's mark; Bathurst, which World.ext.rbring builds
// too, nothing of it (the change goes only on the track asked). No page errors (a shader that does not compile is one).
//   node tests/browser/realizem3.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker("Realizem 3: Montréal, Štajerska, Chapman's Peak (the chase camera)");
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', season: 'summer', tod: 'day', mode: 'tt' }, { width: 640, height: 360 });
  const look = async (id) => {
    await startTrack(page, id);
    return page.evaluate(async () => {
      const g = window.__game, W = Render.world, SC = Render.scene, raf = () => new Promise(res => requestAnimationFrame(res));
      // the renderer (Render keeps it to itself): caught at the scene's next frame
      let RR = null; const own = Object.prototype.hasOwnProperty.call(SC, 'onBeforeRender'), ob = SC.onBeforeRender;
      SC.onBeforeRender = function (rr) { RR = rr; }; for (let k = 0; k < 60 && !RR; k++) await raf();
      if (own) SC.onBeforeRender = ob; else delete SC.onBeforeRender;
      g.pause(); Render.precompile(); for (let k = 0; k < 3; k++) await raf();
      const k3 = (W.stats || {}).kamera3, mats = new Set(); let meshes = 0;
      for (const m of (W.ground ? W.ground.children : [])) { meshes++; const M = m.material; if (M && M.customProgramCacheKey && M.customProgramCacheKey() === 'pkGround2k3') mats.add(M); }
      const prog = [];
      if (RR) {
        const gl = RR.getContext();
        for (const p of RR.info.programs || []) {
          if (!/pkGround2k3/.test(p.cacheKey || '')) continue;
          const sh = (gl.getAttachedShaders(p.program) || []).map(s => ({ ok: gl.getShaderParameter(s, gl.COMPILE_STATUS), src: gl.getShaderSource(s) || '' }));
          prog.push({ link: !!gl.getProgramParameter(p.program, gl.LINK_STATUS), ok: sh.every(s => s.ok !== false), rock: sh.some(s => /k3Rock\(/.test(s.src)) });
        }
      }
      return { k3: k3 ? JSON.parse(JSON.stringify(k3)) : null, mats: mats.size, meshes, prog, rr: !!RR };
    });
  };

  const ch = await look('chapman');
  T.check("Chapman's Peak: its terrain's materials get the rock of the cut face", !!ch.k3 && ch.k3.skala >= 1 && ch.mats === ch.k3.skala && ch.meshes >= 1,
    ch.k3 ? `${ch.k3.skala} patched, ${ch.mats} keyed pkGround2k3, ${ch.meshes} terrain meshes` : 'no stats.kamera3');
  T.check('the rock program compiles and links, k3Rock in it', ch.rr && ch.prog.length >= 1 && ch.prog.every(p => p.link && p.ok && p.rock),
    ch.rr ? JSON.stringify(ch.prog) : 'no renderer');
  for (const [id, name] of [['montreal', 'Montréal'], ['rbring', 'Štajerska']]) {
    const r = await look(id);
    T.check(`${name}: the wrapper's mark, nothing of the rock`, !!r.k3 && !r.k3.skala && r.mats === 0, JSON.stringify(r.k3) + `, ${r.mats} keyed pkGround2k3`);
  }
  const bt = await look('bathurst');
  T.check('Bathurst (World.ext.rbring builds it too): nothing of it', !bt.k3 && bt.mats === 0, JSON.stringify(bt.k3));
  T.check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
