// Iskre P4.4: how far over the road is the lowest point of the DRAWN bodywork? ANALYSIS ONLY (the topic Trki #608, paket P, P4 point 4:
// »iskre pod povešenim vogalom (P3)« and »ob pristanku«). Nothing here changes the game.
//   node tools/trki/iskre-vogal.mjs            the table, every model the page has (Core.MODELS)
//   node tools/trki/iskre-vogal.mjs --json     the same as JSON
// How: the game opened in the test browser, a race started (the renderer's shared resources), then every model's car built as the
// garage builds it (Render.garageCar: the same makeCarMesh a race's view is) and posed as updateCars poses it (js/render.js):
//   bodyG.rotation (roll, 0, pitch), bodyG.position.y = |roll| x 0.4, then the sag (kitSag's plane, written again here: a bent wheel's
//   corner 0.25 rw down at bend 1, least squares over the four corners; a kit car's scaled back so its outer shell stays 1 cm over the
//   road; one wheel off: 0.6 rw down, the plane through that corner and the two next to it), then the whole car's pitch (grp: gpitch).
// The gap: the lowest y of the body's vertices (a kit car: its outer shell, the parts on it; another: the body mesh) in the car's frame,
// the road flat at y 0 (the wheels' feet). Columns (cm):
//   mir        whole, at rest
//   zav / ovn  whole, the most the renderer pitches it under braking (-0.045 x sway) / rolls it in a bend (0.06 x sway)
//   P3 mir     the worst of the four corners with its wheel bent all the way (bend 1), at rest; a: the share of the sag left after the 1 cm rule
//   P3 zav+ovn the same corner with the worst of braking, throttle and roll either way on top (the sag is laid over the body's own pose)
//   kolo       the worst corner with its wheel off (the hub's sparks are there already), at rest
//   kot / vy   whole: the nose-down angle of the whole car (gpitch, deg) at which its lowest point meets the road, and the landing speed
//              vy (m/s) at 30 m/s forward that draws it (the renderer's gpitch in the air: 0.8 x atan2(vy, max(vl, 6)))
import { serve, launch, openGame, startTrack } from '../../tests/browser/lib.mjs';

const json = process.argv.includes('--json');
const srv = await serve(); const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 0, camera: 'chase', damage: 2, weather: 'dry', carId: 'tornado', carV: 3, dmgDet: 1 }, { width: 480, height: 270 }, { seed: 12345 });
  await startTrack(page, 'spa');
  const rows = await page.evaluate(() => { const g = window.__game; g.pause(); const T = THREE, out = [];
    const solve3 = (R) => { const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
      const A = R.map(r => r.slice(0, 3)), D = det(A); if (!(Math.abs(D) > 1e-12)) return null; return [0, 1, 2].map(j => det(A.map((r, i) => r.map((q, cc) => cc === j ? R[i][3] : q))) / D); };
    for (const M of Core.MODELS) { let v; try { v = Render.garageCar(M, 0xcc3333, 0, true); } catch (e) { out.push({ id: M.id, err: String(e.message || e) }); continue; }
      const K = v.kit, geo = v.body.geometry, pa = geo.attributes.position.array, nO = K ? geo.userData.outerN : pa.length / 3, hw = K ? K.E.body.hw : M.wid * 0.45, sw = M.sway || 1, p = new T.Vector3();
      // kitSag's plane (js/render.js), for a state given by hand
      const sag = (off, bd) => { const n = off[0] + off[1] + off[2] + off[3]; if (!(n && K) && !(bd[0] + bd[1] + bd[2] + bd[3])) return null;
        const X = [M.a, M.a, -M.b, -M.b], Z = [-hw, hw, -hw, hw], t = [0, 1, 2, 3].map(k => off[k] ? -0.6 * M.rw : -0.25 * M.rw * bd[k]); let rows;
        const k1 = off.indexOf(1), nb1 = k1 >= 0 ? [[1, 2], [0, 3], [0, 3], [1, 2]][k1] : null;
        if (n === 1 && K && !bd.some((b, i) => b && i !== k1 && !nb1.includes(i))) rows = [k1, nb1[0], nb1[1]].map(i => [1, X[i], Z[i], t[i]]);
        else { const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0]; for (let i = 0; i < 4; i++) { const r = [1, X[i], Z[i]]; for (let q = 0; q < 3; q++) { b[q] += r[q] * t[i]; for (let w = 0; w < 3; w++) A[q][w] += r[q] * r[w]; } } rows = A.map((r, q) => [r[0], r[1], r[2], b[q]]); }
        const s = solve3(rows); if (!s) return null; let a = 1;
        if (K) { for (let i = 0; i < nO; i++) { const d = s[0] + s[1] * pa[i * 3] + s[2] * pa[i * 3 + 2]; if (d < 0) a = Math.min(a, Math.max(0, pa[i * 3 + 1] - 0.01) / -d); }
          if (K.E.W.xm != null) for (const z of [-hw, hw]) { const d = s[0] + s[1] * K.E.W.xm + s[2] * z; if (d < 0) a = Math.min(a, K.E.W.gap / -d); }
          if (!(a > 1e-3)) return null; s[0] *= a; s[1] *= a; s[2] *= a; }
        return { q: new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-s[1], 1, -s[2]).normalize()), y: s[0], a }; };
      // the pose as updateCars lays it; the lowest vertex of the body in the car's frame (the road: y 0)
      const gap = (roll, pitch, S, gp, kc) => { v.grp.position.set(0, 0, 0); v.grp.rotation.set(0, 0, gp || 0, 'YZX'); v.bodyG.rotation.set(roll, 0, pitch); v.bodyG.position.set(0, Math.abs(roll) * 0.4, 0);
        if (S) { v.bodyG.quaternion.premultiply(S.q); v.bodyG.position.applyQuaternion(S.q); v.bodyG.position.y += S.y; }
        v.grp.updateMatrixWorld(true); const m = v.body.matrixWorld; let lo = Infinity, at = null;
        for (let i = 0; i < nO; i++) { if (kc != null) { const x = pa[i * 3], z = pa[i * 3 + 2]; if ((kc < 2) !== (x > 0) || (kc % 2 === 1) !== (z > 0)) continue; }   // (kc: that corner's quarter of the body only)
          p.set(pa[i * 3], pa[i * 3 + 1], pa[i * 3 + 2]).applyMatrix4(m); if (p.y < lo) { lo = p.y; at = [pa[i * 3], pa[i * 3 + 1], pa[i * 3 + 2]]; } }
        return { lo, at }; };
      const cm = (x) => +(x * 100).toFixed(1), o = { id: M.id, body: M.body || '', kit: !!K, rw: M.rw, sway: sw };
      const r0 = gap(0, 0, null); o.mir = cm(r0.lo); o.mirAt = r0.at.map(x => +x.toFixed(2));
      o.zav = cm(gap(0, -0.045 * sw, null).lo); o.plin = cm(gap(0, 0.04 * sw, null).lo); o.ovn = cm(Math.min(gap(0.06 * sw, 0, null).lo, gap(-0.06 * sw, 0, null).lo));
      let b0 = Infinity, b1 = Infinity, bk = -1, ba = 1, w0 = Infinity;
      for (let k = 0; k < 4; k++) { const bd = [0, 0, 0, 0]; bd[k] = 1; const S = sag([0, 0, 0, 0], bd); if (!S) continue; const q0 = gap(0, 0, S, 0, k).lo; if (q0 < b0) { b0 = q0; bk = k; ba = S.a; }
        for (const rl of [-0.06 * sw, 0, 0.06 * sw]) for (const pt of [-0.045 * sw, 0, 0.04 * sw]) b1 = Math.min(b1, gap(rl, pt, S, 0, k).lo);
        const of = [0, 0, 0, 0]; of[k] = 1; const SW = sag(of, [0, 0, 0, 0]); if (SW) w0 = Math.min(w0, gap(0, 0, SW, 0, k).lo); }
      o.p3 = cm(b0); o.p3k = bk; o.p3a = +ba.toFixed(2); o.p3dyn = cm(b1); o.kolo = Number.isFinite(w0) ? cm(w0) : null;
      // the whole car's nose-down pitch (gpitch) at which the body meets the road: bisection
      let a0 = 0, a1 = 0.6; for (let i = 0; i < 30; i++) { const mid = (a0 + a1) / 2; if (gap(0, 0, null, -mid).lo > 0) a0 = mid; else a1 = mid; }
      o.kot = +(a1 * 180 / Math.PI).toFixed(1); o.vy = +(30 * Math.tan(a1 / 0.8)).toFixed(1);
      out.push(o); if (Render.garageFree) try { Render.garageFree(v); } catch (_) { /* shared */ } }
    return out; });
  if (json) console.log(JSON.stringify(rows, null, 1));
  else { const H = ['avto', 'telo', 'kit', 'mir', 'zav', 'plin', 'ovn', 'P3 mir', 'a', 'P3 zav+ovn', 'kolo', 'kot deg', 'vy m/s'], pad = (s, n) => String(s).padEnd(n);
    console.log('== iskre P4.4: najnizja tocka narisane karoserije nad cesto (cm)'); console.log(H.map((h, i) => pad(h, i < 2 ? 12 : 11)).join(''));
    for (const o of rows) console.log(o.err ? `${o.id}: ${o.err}` : [o.id, o.body, o.kit ? 'da' : 'ne', o.mir, o.zav, o.plin, o.ovn, o.p3, o.p3a, o.p3dyn, o.kolo, o.kot, o.vy].map((h, i) => pad(h, i < 2 ? 12 : 11)).join(''));
    const ok = rows.filter(o => !o.err), min = (f) => Math.min(...ok.map(f).filter(Number.isFinite));
    console.log(`najmanj: mir ${min(o => o.mir)}, zav ${min(o => o.zav)}, ovn ${min(o => o.ovn)}, P3 mir ${min(o => o.p3)}, P3 zav+ovn ${min(o => o.p3dyn)}, kolo ${min(o => o.kolo)} cm; kot ${min(o => o.kot)} deg, vy ${min(o => o.vy)} m/s`);
    console.log(`dotik (<= 1 cm): P3 mir ${ok.filter(o => o.p3 <= 1.05).map(o => o.id).join(', ') || 'nobeden'}; P3 zav+ovn ${ok.filter(o => o.p3dyn <= 1.05).map(o => o.id).join(', ') || 'nobeden'}; cel zav ${ok.filter(o => o.zav <= 1.05).map(o => o.id).join(', ') || 'nobeden'}; cel ovn ${ok.filter(o => o.ovn <= 1.05).map(o => o.id).join(', ') || 'nobeden'}`);
    if (errors.length) console.log('napake strani: ' + errors.slice(0, 3).join(' | ')); }
} finally { await browser.close(); await srv.close(); }
