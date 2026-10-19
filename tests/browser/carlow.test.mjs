// Položaj avta (Nastavitve): the car can sit further back / lower in the frame. Option 1 as now, then 2, 5, 7, 10, 15 and 20 m.
// It applies to the game's one camera, za avtom (chase); the default (option 1) changes nothing. Where the screen has no room for the
// metres (on its side; upright on the grid at 20 m) they are scaled into it, so the whole car always stays on the screen.
// On a real track (Spa, Belgija), upright (390 × 844) and on its side (844 × 390): standing on the grid and flat out on the Kemmel
// straight, at every Oddaljenost and Položaj avta the whole car (every vertex of its body, projected with the game's camera) is on the
// screen, at least 8 px over its foot, and every step still puts it lower.
//   node tests/browser/carlow.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Položaj avta: the car sits lower / further back in the frame, always whole on the screen');
const BACK = [0, 2, 5, 7, 10, 15, 20], ZOOM = [1.1, 1.4, 1.7], GAP = 8;   // (Oddaljenost Blizu, Srednje, Daleč; GAP: px at least between the car and the screen's foot)
const srv = await serve();
const browser = await launch();
try {
  for (const [view, width, height] of [['upright', 390, 844], ['on its side', 844, 390]]) {
    const { page, ctx, errors } = await openGame(browser, srv.base + '/index.html', { camera: 'chase', weather: 'dry', track: 'spa', damage: 0 }, { width, height }, { seed: 7, touch: true });
    const pick = (set, v) => page.evaluate(([set, v]) => document.querySelector(`[data-set="${set}"] button[data-v="${v}"]`).click(), [set, v]);
    await startTrack(page, 'spa');
    await page.waitForFunction(() => { const P = window.__game.race.player; return Math.abs((P.roadY || 0) - (P.y || 0)) < 0.5; }, null, { timeout: 120000 });   // (the race has stepped once: before it the car's road is at 0 m, Spa's grid at ~65 m, and the camera would look there)

    if (view === 'upright') {
      // the player's car projected to the screen (NDC y: +1 top, -1 bottom) once the camera has settled, drawn in the given camera
      const carY = (mode) => page.evaluate((mode) => { const g = window.__game, P = g.race.player, C = Render.camera;
        g.pause(); Render.resetCam(); for (let i = 0; i < 60; i++) Render.frame(1 / 60, 1, P, mode, {});
        const p = new THREE.Vector3(P.x, (P.y || 0) + 0.6, P.z).project(C); return { x: +p.x.toFixed(4), y: +p.y.toFixed(4) }; }, mode);
      const wiring = () => page.evaluate(() => ({ set: window.__game.S.carLow, back: Render.cam.userBack }));
      // the setting is wired through (saved, and mapped to 0 / 2 / 5 … metres)
      const c = [], w = [];
      for (let i = 0; i < BACK.length; i++) { await pick('carLow', String(i)); c.push(await carY('chase')); w.push(await wiring()); }
      T.check('the choice is saved and maps to metres (0, 2, 5, 7, 10, 15, 20)', w.every((x, i) => x.set === i && x.back === BACK[i]), JSON.stringify(w));
      // chase (phone upright): the more it is set back, the lower the car sits (NDC y decreases)
      T.check('chase: the car sits lower the more it is set back', c.every((x, i) => i === 0 || x.y < c[i - 1].y), JSON.stringify(c));
      await pick('carLow', '0');
    }

    // the car's box on the screen (CSS px): every vertex of its visible meshes (not the see-through shadow under it) projected with the
    // game's camera, at every Oddaljenost and Položaj avta; the camera first settled on the car, frozen where it is
    const sweep = () => page.evaluate(([BACK, ZOOM]) => {
      const g = window.__game, P = g.race.player, C = Render.cam, v = Render.viewOf(P), W = innerWidth, H = innerHeight, p = new THREE.Vector3(), keep = [C.userZoom, C.userBack];
      const shown = (o) => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
      const box = () => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; v.grp.updateMatrixWorld(true);
        v.grp.traverse(o => { const a = o.isMesh && !o.isInstancedMesh && shown(o) && o.geometry && o.geometry.attributes.position; if (!a) return;
          const mats = [].concat(o.material); if (mats.every(m => !m || !m.visible || m.opacity === 0) || (a.count === 4 && mats.every(m => m && m.transparent))) return;   // (the soft shadow: a see-through quad)
          for (let i = 0; i < a.count; i++) { p.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld).project(Render.camera); const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } });
        return { left: x0, top: y0, right: x1, bottom: y1 }; };
      g.pause(); for (let i = 0; i < 24; i++) Render.frame(0.2, 1, P, 'chase', { noFx: true });   // (its zoom with the speed, its heading)
      const rows = [];
      for (const z of ZOOM) for (const b of BACK) {
        C.userZoom = z; C.userBack = b; Render.frame(0.0001, 1, P, 'chase', { noFx: true }); const q = box();
        rows.push({ z, b, top: +q.top.toFixed(1), bottom: +q.bottom.toFixed(1), gap: +(H - q.bottom).toFixed(1), whole: q.left >= 0 && q.right <= W && q.top >= 0 && q.bottom <= H });
      }
      [C.userZoom, C.userBack] = keep; Render.frame(0.0001, 1, P, 'chase', { noFx: true });
      return { kmh: Math.round(P.speed * 3.6), zoom: +C.zoom.toFixed(3), rows };
    }, [BACK, ZOOM]);
    const report = (m) => ZOOM.map(z => z + ': ' + m.rows.filter(r => r.z === z).map(r => `${r.b}m ${r.gap}`).join(' ')).join(' | ');
    const judge = (moment, m) => {
      const bad = m.rows.filter(r => !r.whole || r.gap < GAP);
      T.check(`${view}, ${moment}: the whole car on the screen, at least ${GAP} px over its foot, at every Oddaljenost and Položaj avta`, m.rows.length === ZOOM.length * BACK.length && !bad.length, (bad.length ? 'off: ' + JSON.stringify(bad) + ' · ' : '') + 'gap px ' + report(m));
      const flat = ZOOM.filter(z => { const R = m.rows.filter(r => r.z === z); return R.some((r, i) => i > 0 && !(r.bottom > R[i - 1].bottom + 0.5)); });
      T.check(`${view}, ${moment}: every step puts the car lower`, !flat.length, flat.length ? 'not lower at Oddaljenost ' + flat.join(', ') : '');
    };

    // 1 · on the grid before the start, the car standing
    const grid = await sweep();
    judge('on the grid', grid);

    // 2 · flat out on the Kemmel straight (the longest stretch without a bend): the autopilot drives there (physics only), then the camera
    // settles on the frozen car, pulled back with the speed
    const drv = await page.evaluate(() => {
      const g = window.__game, Tr = g.race.track, P = g.race.player, N = Tr.N, ok = (i) => Math.abs(Tr.k[i]) < 0.002;
      let best = [0, 0], i0 = -1;
      for (let j = 0; j < 2 * N; j++) { const i = j % N; if (ok(i)) { if (i0 < 0) i0 = j; if (j - i0 > best[1] - best[0]) best = [i0, j]; } else i0 = -1; }
      const s0 = (best[0] * Tr.ds + 380) % Tr.len, s1 = s0 + 180; let n = 0;
      g.autoDrive = true;
      while (n++ < 4000) { g.sim(0.05, true); const s = P.q.s; if ((g.race.time || 0) > 15 && s > s0 && s < s1) break; }
      g.autoDrive = false;
      return { n, s: Math.round(P.q.s), kmh: Math.round(P.speed * 3.6) };
    });
    const fast = await sweep();
    T.check(`${view}: flat out on the Kemmel straight (over 170 km/h, the camera pulled back)`, fast.kmh > 170 && fast.zoom > 1.2, JSON.stringify(Object.assign(drv, { zoom: fast.zoom })));
    judge('flat out', fast);

    T.check(`${view}: no page errors`, errors.length === 0, errors.join('\n'));
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.close();
}
T.done();
