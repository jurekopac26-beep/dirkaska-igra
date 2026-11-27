// Zmogljivost (krog 27. 11.): šest vzorcev testa tests/browser/perf.test.mjs, vsak posebej. Ista nastavitev (telefon 844x390, kakovost
// normal, podrobnosti low, sence, kamera za avtom; trki med avti Stara crV 4, vleka krmila samo moj avto pullAll 0), isto seme in isti
// koraki kot v testu; za vsak vzorec izpiše še, kje na krogu je igralčev avto (s, m), koliko tekmecev je do 150 m od njega in koliko
// avtov ima škodo. Tako se vidi, ali so se vzorci premaknili (avti so drugje) ali pa isti prizor stane več.
// Zagon: TRKI_SNAP=<drevo> node vzorci.mjs (drevo potrebuje node_modules/playwright); PROGE=livorno,lusail,mombasa (privzeto);
// NAST='{"crV":6}' doda ali zamenja nastavitve igre. Meje testa: referenca največ * 1,1 + 20 tisoč oglišč (+ 5 klicev), na pravi progi
// še 300 klicev in 900 tisoč oglišč (CLAUDE.md). Ena proga teče približno 20 s.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const TU = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.TRKI_SNAP || path.join(TU, '..', '..', '..', '..', '..'));
const { serve, launch, openGame, startTrack } = await import(pathToFileURL(path.join(ROOT, 'tests', 'browser', 'lib.mjs')).href);
const SHAKE = { camShake: 1, camLand: 1, camKerb: 1, camMis: 1, crV: 4, pullAll: 0, ...(process.env.NAST ? JSON.parse(process.env.NAST) : {}) };
const ids = (process.env.PROGE || 'livorno,lusail,mombasa').split(',');
const srv = await serve(), browser = await launch();
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, ...SHAKE }, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(() => {
    window.__gl = { calls: 0, verts: 0 };
    const gl = Render.info && document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]);
    wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
  });
  for (const id of ids) {
    await startTrack(page, id);
    const r = await page.evaluate(async () => {
      if (Render.world.landmarkLoad) await Render.world.landmarkLoad;
      const g = window.__game; let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      g.onAction('restart'); g.pause();
      g.race.lch = null; for (const c of g.race.cars) c.lch = null;
      g.race.player.kt = null;
      const P = g.race.player, s = [];
      for (let k = 0; k < 6; k++) {
        const dt = Math.min(30, g.race.track.len / 45 / 6); for (let i = 0; i < dt; i++) g.sim(1, true);
        Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});
        const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, g.S.camera, {});
        s.push({ calls: __gl.calls - c0, kv: Math.round((__gl.verts - v0) / 1000), s: Math.round(P.q.s), near: g.race.cars.filter(c => c !== P && Math.hypot(c.x - P.x, c.z - P.z) < 150).length,
          dmg: g.race.cars.filter(c => c.dmg > 0.001).length, pd: +(P.dmg || 0).toFixed(3) });
        for (let i = 0; i < 30; i++) g.sim(1 / 60, true);
        Render.scene.visible = false; for (let i = 0; i < 30; i++) Render.frame(1 / 60, 1, g.race.player, g.S.camera, {}); Render.scene.visible = true;
      }
      return { s, len: Math.round(g.race.track.len), cars: g.race.cars.length };
    });
    const kv = r.s.map(x => x.kv), ca = r.s.map(x => x.calls), avg = (a) => Math.round(a.reduce((p, q) => p + q) / a.length);
    console.log(`${id.padEnd(8)} s ${r.s.map(x => x.s).join(' ')} (krog ${r.len} m, ${r.cars} avtov) | tekmeci do 150 m ${r.s.map(x => x.near).join(' ')} | avti s škodo ${r.s.map(x => x.dmg).join(' ')}, igralec ${r.s.map(x => x.pd).join(' ')}`);
    console.log(`${''.padEnd(8)} tisoč oglišč ${kv.join(' ')} (povprečno ${avg(kv)}, največ ${Math.max(...kv)}) | klici ${ca.join(' ')} (povprečno ${avg(ca)}, največ ${Math.max(...ca)})`);
  }
  if (errors.length) console.log('napake strani: ' + errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
