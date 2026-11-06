// The marbles in the game (Crystal Palace, a race with tyres, the player on autopilot, the camera behind the car, 844 × 390): none at the
// start; after two laps the band is drawn (one mesh, one draw call more, only where there is a band, as dark as the race has laid it), and
// from the camera behind the car, before the corner with the most of it, the road beside the racing line is darker there than without it;
// the rain washes it away (the band fades out).
//   node tests/browser/marbles.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('marbles (Crystal Palace)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'chase', zoom: 1.4, weather: 'dry' }, { width: 844, height: 390 }, { seed: 4242 });
  await startTrack(page, 'cpalace');
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  await page.evaluate(() => {   // count every WebGL draw (all render passes), as tests/browser/perf.test.mjs does
    window.__gl = { calls: 0 };
    const gl = document.getElementById('gl').getContext('webgl2') || document.getElementById('gl').getContext('webgl'), P = Object.getPrototypeOf(gl);
    for (const f of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) { const o = P[f]; if (o) P[f] = function (...a) { window.__gl.calls++; return o.apply(this, a); }; }
  });
  const band = () => page.evaluate(() => { const m = Render.scene.getObjectByName('marbles'), R = window.__game.race;
    return { lv: R.mb ? +R.mb.lv.toFixed(3) : null, mesh: m ? { vis: m.visible, op: +m.material.opacity.toFixed(3), tri: m.geometry.index.count / 3, rows: m.geometry.attributes.position.count / 4, N: R.track.N } : null }; });
  await page.evaluate(() => { for (let i = 0; i < 3; i++) Render.frame(1 / 60, 1, window.__game.race.player, 'chase', {}); });
  const b0 = await band();
  T.check('at the start: no marbles (none laid yet, nothing drawn)', b0.lv === 0 && (!b0.mesh || !b0.mesh.vis), JSON.stringify(b0));

  // two laps (paused, stepped here; nothing drawn meanwhile), then a frame
  await page.evaluate(() => { const g = window.__game; Render.scene.visible = false; for (let k = 0; k < 120 && !(g.race.player.lap >= 3 && g.race.state === 'racing'); k++) g.sim(2, true); Render.scene.visible = true;
    for (let i = 0; i < 3; i++) Render.frame(1 / 60, 1, g.race.player, 'chase', {}); });
  const b1 = await band();
  T.check('after two laps: the band drawn as dark as the race has laid it, a strip of rows only where there is a band', b1.lv > 0.6 && !!b1.mesh && b1.mesh.vis && Math.abs(b1.mesh.op - b1.lv) < 0.01 && b1.mesh.tri > 100 && b1.mesh.rows < b1.mesh.N / 2 * 0.75,
    JSON.stringify(b1));

  // the player's car before the corner with the most of it, on the racing line, the rivals out of the way; the same frame with the band and
  // without it (its thickness set to 0 for the frame): one draw call more, the road beside the line darker where the band is (the frame's
  // pixels read back at once, a few rows into the corner)
  const spot = await page.evaluate(() => {
    const g = window.__game, R = g.race, Tk = R.track, M = Tk.marbles(), N = Tk.N, P = R.player;
    let bi = 0, best = -1; for (let i = 0; i < N; i += 5) { let s = 0; for (let o = -30; o <= 30; o++) s += M.k[(i + o + N) % N]; if (s > best) { best = s; bi = i; } }
    const i0 = (bi - 22 + N) % N, d = Tk.rl[i0];
    P.place(Tk.px[i0] + Tk.nx[i0] * d, Tk.pz[i0] + Tk.nz[i0] * d, Tk.hd[i0]); g.sim(0.05, true); P.vx = P.vz = 0;
    for (const c of R.cars) if (c !== P) { const j = (i0 - 300 + N) % N; c.x = Tk.px[j]; c.z = Tk.pz[j]; }
    window.__lv = R.mb.lv;
    return { bi, i0 };
  });
  const shot = (on) => page.evaluate(([on, bi]) => {
    const g = window.__game, R = g.race, Tk = R.track, M = Tk.marbles(), N = Tk.N, P = R.player, gl = document.getElementById('gl').getContext('webgl2') || document.getElementById('gl').getContext('webgl');
    R.mb.lv = on ? window.__lv : 0;
    Render.resetCam(); for (let i = 0; i < 30; i++) Render.frame(1 / 60, 1, P, 'chase', {});
    const c0 = window.__gl.calls; Render.frame(1 / 60, 1, P, 'chase', {}); const calls = window.__gl.calls - c0;
    // the band's middle a few rows into the corner on the screen: the mean luminance of a 12 x 6 block of the drawing buffer round each
    const C = Render.camera, W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, px = new Uint8Array(12 * 6 * 4); let lum = 0, n = 0;
    for (let o = -6; o <= 6; o += 3) { const i = (bi + o + N) % N; if (M.k[i] < 0.5) continue; const y = (Tk.hasElev && Tk.hy ? Tk.hy[i] : 0) + 0.03;
      const v = new THREE.Vector3(Tk.px[i] + Tk.nx[i] * M.c[i], y, Tk.pz[i] + Tk.nz[i] * M.c[i]).project(C);
      if (!(v.z < 1 && Math.abs(v.x) < 0.9 && Math.abs(v.y) < 0.9)) continue;
      gl.readPixels(Math.round((v.x + 1) / 2 * W) - 6, Math.round((v.y + 1) / 2 * H) - 3, 12, 6, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let t = 0; for (let k = 0; k < px.length; k += 4) t += 0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2]; lum += t / 72; n++; }
    return { calls, n, lum: n ? lum / n : -1, vis: Render.scene.getObjectByName('marbles').visible };
  }, [on, spot.bi]);
  const on = await shot(true), off = await shot(false); await shot(true);
  T.check('from the camera behind the car: the band in sight before the corner, one draw call more than without it', on.vis && !off.vis && on.n >= 2 && on.calls === off.calls + 1, JSON.stringify({ spot, calls: [on.calls, off.calls], pts: on.n }));
  T.check('... and the road there darker with the band than without it', on.lum > 0 && on.lum < off.lum - 4, `luminance ${on.lum.toFixed(1)} with the band, ${off.lum.toFixed(1)} without`);

  // the rain: the water on the road at once, a minute and a half of it washes the band away
  await page.evaluate(() => { const g = window.__game; g.race.setRain(1); Render.scene.visible = false; g.sim(90, true); Render.scene.visible = true; for (let i = 0; i < 3; i++) Render.frame(1 / 60, 1, g.race.player, 'chase', {}); });
  const b2 = await band();
  T.check('the rain washes it away: the band faded out', b2.lv < 0.1 && b2.lv < b1.lv / 5 && b2.mesh && (b2.mesh.op < 0.1 || !b2.mesh.vis), JSON.stringify(b2));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
