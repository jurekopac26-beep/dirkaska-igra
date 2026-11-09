// Finds a place for the big screen by the main grandstand (Grafika 03, js/world-zaslon.js) on a track with pits: the stand's side
// (across from the pits), its span (def.stands, else tall things 3-35 m behind the barrier nearest the start line), free ground just past
// either end behind the barrier (rays down over the rig's footprint: nothing over 0.5 m, the ground within 2.5 m), then how much of the
// chase camera's picture the screen fills while the car comes from 90 m to 0 m before it (the face magenta; on its side 422x195 and upright
// 180x320, per cent summed over 7 views). Prints the line for the track's file, zaslon: { d, side, off } (look at it in the game after).
//   node tools/zaslon-mesto.mjs <id …> [--turn 50] [--side 1|-1] [--span from:to] [--noscore]
import { serve, launch, openGame } from '../tests/browser/lib.mjs';
const args = process.argv.slice(2), flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; }, has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const TURN = +flag('--turn', 50), noscore = has('--noscore'), sideArg = flag('--side', null), spanArg = flag('--span', null);
const ids = args.filter(a => !a.startsWith('--'));
const srv = await serve(); const browser = await launch();
const SIZES = { land: { width: 422, height: 195 }, port: { width: 180, height: 320 } };
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer' }, SIZES.land, { seed: 7 });
  for (const id of ids) {
    await page.setViewportSize(SIZES.land);
    await page.goto(srv.base + '/index.html?proga=' + id + '&t=3'); await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    const found = await page.evaluate(([TURN, sideArg, spanArg]) => {
      const g = window.__game, T = g.race.track, W = Render.world, def = T.def; g.pause();
      const L = T.len, sAt = (d) => ((T.startS + d) % L + L) % L;
      const rc = new THREE.Raycaster(), V = new THREE.Vector3(), D = new THREE.Vector3(0, -1, 0);
      const objs = W.root.children.filter(o => o.name !== 'zaslon');
      const gH = (x, z, i) => { const v = W.groundH ? W.groundH(x, z) : NaN; return Number.isFinite(v) ? v : (T.hy ? T.hy[i] : 0); };
      const top = (x, z, i) => { rc.set(V.set(x, (T.hy ? T.hy[i] : 0) + 70, z), D); rc.far = 140; const h = rc.intersectObjects(objs, true).find(h => h.object.visible && !(h.object.material && h.object.material.transparent && h.object.material.opacity < 0.3)); return h ? h.point.y : -1e9; };
      const pitSide = def.pit ? Math.sign(def.pit[0]) : 1, side = sideArg ? +sideArg : -pitSide;
      const bar = (i) => { const b = side > 0 ? (T.br ? T.br[i] : T.w + 3) : (T.bl ? T.bl[i] : T.w + 3); return Math.max(b, T.w + 2); };
      // the main stand's span on that side
      let span = null, how = '';
      if (spanArg) { span = spanArg.split(':').map(Number); how = 'given'; }
      else if (def.stands && def.stands.length) {
        const st = def.stands.filter(q => q[2] === side).sort((a, b) => (a[0] <= 0 && b[1] >= 0 ? -1 : 0) || Math.min(Math.abs(a[0]), Math.abs(a[1])) - Math.min(Math.abs(b[0]), Math.abs(b[1])));
        const m = def.stands.filter(q => q[2] === side).find(q => q[0] <= 0 && q[1] >= 0) || st[0]; if (m) { span = [m[0], m[1]]; how = 'def.stands'; }
      }
      if (!span) {   // tall things (3 m and more over the ground) 3-35 m behind the barrier on that side, the run nearest the start line
        const tall = [];
        for (let d = -420; d <= 420; d += 5) { const i = T.idx(sAt(d)), b = bar(i); let t = false;
          for (let o = b + 3; o <= b + 35 && !t; o += 4) { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o; if (top(x, z, i) - gH(x, z, i) > 3) t = true; }
          tall.push([d, t]); }
        const runs = []; let cur = null;
        for (const [d, t] of tall) { if (t) { if (cur && d - cur[1] <= 15) cur[1] = d; else { cur = [d, d]; runs.push(cur); } } }
        runs.sort((a, b) => (a[0] <= 0 && a[1] >= 0 ? -1e6 : Math.min(Math.abs(a[0]), Math.abs(a[1]))) - (b[0] <= 0 && b[1] >= 0 ? -1e6 : Math.min(Math.abs(b[0]), Math.abs(b[1]))));
        span = runs[0] || [-60, 60]; how = 'tall ' + runs.slice(0, 4).map(r => r.join('..')).join(' ');
      }
      // the rig's footprint free of anything 0.5 m over the ground, the ground within 2.5 m
      const free = (d, off) => {
        const s = sAt(d), i = T.idx(s), j = T.idx(s + 4); let tx = T.px[j] - T.px[i], tz = T.pz[j] - T.pz[i]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const nx = T.nx[i] * side, nz = T.nz[i] * side, a = TURN * Math.PI / 180, cx = T.px[i] + nx * off, cz = T.pz[i] + nz * off;
        let fx = -nx * Math.cos(a) - tx * Math.sin(a), fz = -nz * Math.cos(a) - tz * Math.sin(a); const fl = Math.hypot(fx, fz); fx /= fl; fz /= fl; const rx = fz, rz = -fx;
        const pts = []; for (let u = -5.3; u <= 5.31; u += 1.325) for (const v of [0.2, -1.2, -2.4, -3.6]) pts.push([cx + rx * u + fx * v, cz + rz * u + fz * v]);
        let lo = Infinity, hi = -Infinity;
        for (const [x, z] of [pts[0], pts[pts.length - 1], pts[Math.floor(pts.length / 2)]].concat(pts)) { const g0 = gH(x, z, i), t = top(x, z, i); if (t - g0 > 0.5) return { ok: false, why: 'thing ' + (t - g0).toFixed(1) }; lo = Math.min(lo, g0); hi = Math.max(hi, g0); if (hi - lo > 2.5) return { ok: false, why: 'slope' }; }
        return { ok: true };
      };
      const out = { span, how, side, ends: [] };
      for (const [end, dir] of [[span[1], 1], [span[0], -1]]) {
        let best = null, tried = 0;
        for (let e = 4; e <= 70 && !best; e += 3) { const d = end + dir * e, i = T.idx(sAt(d)), b = bar(i);
          for (let off = Math.max(b + 5, T.w + 9); off <= b + 13 && !best; off += 1.5) { tried++; const f = free(d, off); if (f.ok) best = { d: Math.round(d), off: +off.toFixed(1), bar: +b.toFixed(1) }; } }
        out.ends.push(best ? Object.assign(best, { end: dir > 0 ? 'after' : 'before', tried }) : { end: dir > 0 ? 'after' : 'before', none: true, tried });
      }
      return out;
    }, [TURN, sideArg, spanArg]);
    let line = `${id}: side ${found.side} span ${found.span.join('..')} (${found.how})`;
    for (const e of found.ends) line += `\n   ${e.end}: ` + (e.none ? 'nothing free' : `d ${e.d} off ${e.off} (barrier ${e.bar})`);
    console.log(line);
    if (noscore) continue;
    // the chase camera's view of each: the face magenta, the car 0-90 m before it
    let best = null;
    for (const e of found.ends) {
      if (e.none) continue;
      const sp = { d: e.d, side: found.side, off: e.off, turn: TURN };
      const sc = {};
      for (const o of ['land', 'port']) {
        await page.setViewportSize(SIZES[o]);
        sc[o] = await page.evaluate(async (sp) => {
          const g = window.__game, R = g.race, T = R.track, P = R.player, Wd = Render.world, raf = () => new Promise(r => requestAnimationFrame(r)); Render.resize();
          for (const c of R.cars) if (c !== P) { const v = Render.viewOf(c); if (v) v.grp.visible = false; }
          T.def.zaslon = sp; const Z = World.zaslon.build(Wd, T, 2); if (!Z) return -1; Wd.dyn.zaslon = null;   // (the track's own place before the list's)
          const m = Z.face.material; m.map = null; m.color.setHex(0xff00ff); m.fog = false; m.needsUpdate = true;
          let sum = 0;
          for (let d = 90; d >= 0; d -= 15) {
            const s = Z.s - d, i = T.idx(((s % T.len) + T.len) % T.len), off = T.rl ? T.rl[i] : 0;
            P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = T.hy[i];
            P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0; for (let k = 0; k < 12; k++) R.step(1 / 120);
            Render.resetCam(); for (let k = 0; k < 2; k++) { Render.frame(1 / 30, 1, P, 'chase', {}); await raf(); }
            const cv = Render.snapshot(P, 'chase', 422), x = cv.getContext('2d'), px = x.getImageData(0, 0, cv.width, cv.height).data; let n = 0;
            for (let q = 0; q < px.length; q += 4) if (px[q] > 190 && px[q + 1] < 90 && px[q + 2] > 190) n++;
            sum += n / (cv.width * cv.height) * 100;
          }
          if (Z.grp.parent) Z.grp.parent.remove(Z.grp);   // (not in the next one's views)
          return +sum.toFixed(2);
        }, sp);
      }
      console.log(`   ${e.end} ${sp.d}:${sp.side}:${sp.off}:${sp.turn}  land ${sc.land} port ${sc.port}`);
      if (sc.land >= 0 && (!best || sc.land + sc.port > best.k)) best = { sp, k: sc.land + sc.port };
    }
    if (best) console.log(`   in js/tracks/${id}.js: zaslon: { d: ${best.sp.d}, side: ${best.sp.side}, off: ${best.sp.off}${TURN !== 50 ? ', turn: ' + TURN : ''} },`);
  }
  if (errors.length) console.log('errors:', errors.slice(0, 5).join(' | '));
} finally { await browser.close(); await srv.close(); }
