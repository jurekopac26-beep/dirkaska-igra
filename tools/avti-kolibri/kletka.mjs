// The crash test's roof clear of what is in the way (tests/browser/crash.test.mjs, point 11: the roof field's clear, at least min(5 mm,
// as built) after each of its 10 knocks) on its own, a minute or two a car instead of the whole test (avti na raven KOLIBRIJA,
// docs/avti-kolibri.md, »Slike in orodje«), Razbijanje · nov način on, Normalni. Where it fails: the knock, the nearest point of what is
// in the way (its part: a cage's bar is body.i) and the roof's facet over it with its three points (e: the field's entry, L its limit,
// W its weight, ay the sink, lp the pull-in). A cage's corner under a C-pillar the Kolibri's roof pulls in (XT_MIN) is the usual cause:
// TORNADO V8 in the doc.
//   node tools/avti-kolibri/kletka.mjs tornado goljat   (one line per car: OK or FAIL, the clear after each knock, then OK or FAIL n)
import { serve, launch, openGame, startTrack } from '../../tests/browser/lib.mjs';

const ids = process.argv.slice(2);
if (!ids.length) { console.log('node tools/avti-kolibri/kletka.mjs <id …>'); process.exit(2); }
const RSEQ = [[0.15, -1, 0], [0.15, 1, -0.6], [0.15, 0.1, -1], [0.15, -1, 0.6], [0.3, 1, 0], [0.3, 0, 1], [0.05, -1, -0.6], 'top', [0.15, 1, 0.6], [0.15, -0.1, 1]];   // (the test's RSEQ)
const srv = await serve(), browser = await launch();
let bad = 0;
try {
  const base = { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.1, damage: 2, weather: 'dry', carV: 3 };
  for (const id of ids) {
    const { page, ctx } = await openGame(browser, srv.base + '/index.html', Object.assign({}, base, { xBody: 1, xGlass: 1, xPaint: 1, xParts: 1, carDet: 'normal', carId: id }), { width: 640, height: 296 }, { seed: 4242 });
    await startTrack(page, 'jezero');
    const r = await page.evaluate((SEQ) => {
      const g = window.__game; g.pause(); for (let i = 0; i < 400 && g.race.state !== 'racing'; i++) g.sim(0.05, true); g.sim(6, true);
      const R = g.race, P = R.player;
      for (const c of R.cars) if (c !== P && Math.hypot(c.x - P.x, c.z - P.z) < 25) { c.x -= Math.cos(P.h) * 40; c.z -= Math.sin(P.h) * 40; c.px = c.x; c.pz = c.z; }
      for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; }
      const frames = (k) => { for (let j = 0; j < k; j++) { P.vx = P.vz = 0; Render.frame(j ? 0.05 : 0.016, 1, P, 'chase', {}); } };
      R.repairCar(P); frames(2); R.repairCar(P); frames(1);
      const v0 = Render.viewOf(P);
      const U = v0.body.geometry.userData, names = Object.keys(U.ranges || {});
      const partOf = (i) => names.flatMap(nm => [['o', U.ranges[nm].o], ['i', U.ranges[nm].i]].filter(([, q]) => q && i >= q[0] && i < q[1]).map(([w]) => nm + '.' + w)).join(',') || '-';
      const nrm = (A, t) => { const o = t * 9, ax = A[o + 3] - A[o], ay = A[o + 4] - A[o + 1], az = A[o + 5] - A[o + 2], bx = A[o + 6] - A[o], by = A[o + 7] - A[o + 1], bz = A[o + 8] - A[o + 2]; return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx]; };
      const hAt = (A, t, x, z) => { const o = t * 9, N = nrm(A, t); return Math.abs(N[1]) < 1e-12 ? null : A[o + 1] - (N[0] * (x - A[o]) + N[2] * (z - A[o + 2])) / N[1]; };
      const inside = (A, t, x, z) => { const o = t * 9, x1 = A[o], z1 = A[o + 2], x2 = A[o + 3], z2 = A[o + 5], x3 = A[o + 6], z3 = A[o + 8], d = (z2 - z3) * (x1 - x3) + (x3 - x2) * (z1 - z3); if (Math.abs(d) < 1e-14) return false;
        const l1 = ((z2 - z3) * (x - x3) + (x3 - x2) * (z - z3)) / d, l2 = ((z3 - z1) * (x - x3) + (x1 - x3) * (z - z3)) / d; return l1 >= -1e-6 && l2 >= -1e-6 && 1 - l1 - l2 >= -1e-6; };
      const out = [];
      for (const h of SEQ) {
        if (h === 'top') { P.dents.push({ lx: 0.25 * P.m.len / 2, lz: -0.4 * P.m.wid / 2, amt: 0.1, top: 1 }); P.roofDmg = Math.min(1, P.roofDmg + 0.3); } else Core.applyDamage(P, h[0], h[1] * P.m.len / 2, h[2] * P.m.wid / 2);
        frames(5);
        if (!Render.viewOf(P).xc || !Render.viewOf(P).xc.rf) return { err: 'no roof field' };   // (built at the first knock)
        const v = Render.viewOf(P), xc = v.xc, G = xc.rf.G, a = v.body.geometry.attributes.position.array, B = xc.rest, K = v.kit, dv = K ? K.deadV : null, nd = xc.nd;
        const dead = (i) => (dv && dv[i]) || (nd && nd[i]), off = new Uint8Array(B.length / 3);
        if (K) for (const nm of Object.keys(K.ajar).concat(Object.keys(K.dead))) { const q = K.R.ranges[nm]; if (q) for (const s of [q.o, q.i]) if (s) off.fill(1, s[0], s[1]); }
        let w = null;   // (the nearest point under a facet of the roof that was over it as built)
        for (const i of G.obsI) { if (dead(i) || off[i]) continue; const x = a[i * 3], y = a[i * 3 + 1], z = a[i * 3 + 2];
          for (const t of G.upT) { if (dead(t * 3) || dead(t * 3 + 1) || dead(t * 3 + 2) || !inside(a, t, x, z)) continue;
            const h0 = hAt(B, t, B[i * 3], B[i * 3 + 2]); if (h0 === null || h0 < B[i * 3 + 1]) continue; const hh = hAt(a, t, x, z); if (hh === null) continue;
            if (!w || hh - y < w.c) w = { c: hh - y, c0: h0 - B[i * 3 + 1], i, t }; } }
        const rf = Render.crashInfo().cars.find(q => q.player).rf, f3 = (u) => +u.toFixed(3);
        if (w) { const at = (A, j) => [f3(A[j * 3]), f3(A[j * 3 + 1]), f3(A[j * 3 + 2])];
          w = { c: +w.c.toFixed(4), c0: +w.c0.toFixed(4), part: partOf(w.i), p: at(a, w.i), p0: at(B, w.i), facet: partOf(w.t * 3),
            pts: [0, 1, 2].map(q => { const j = w.t * 3 + q, e = G.vE[j]; return { p: at(a, j), p0: at(B, j), e, L: e >= 0 ? f3(G.L[e]) : null, W: e >= 0 ? f3(G.W[e]) : null, ay: e >= 0 && xc.rf.ay ? f3(xc.rf.ay[e]) : null, lp: e >= 0 && G.lp ? f3(G.lp[e]) : null }; }) }; }
        out.push({ clear: rf.clear, clear0: rf.clear0, dmg: +P.dmg.toFixed(2), w });
      }
      return { out, nO: Render.viewOf(P).xc.rf.G.obsI.length };
    }, RSEQ);
    await ctx.close();
    if (r.err) { bad++; console.log('FAIL', id + ':', r.err); continue; }
    const okAt = (q) => q.clear === null || q.clear >= Math.min(0.005, q.clear0) - 1e-4, fails = r.out.map((q, k) => [k, q]).filter(([, q]) => !okAt(q));
    if (fails.length) bad++;
    console.log(fails.length ? 'FAIL' : 'OK  ', id + ': clear after each knock', r.out.map(q => q.clear === null ? '-' : q.clear.toFixed(4)).join(' '), '(needs min(0.005, as built); points in the way', r.nO + ')');
    for (const [k, q] of fails) console.log('   knock', k, 'dmg', q.dmg, JSON.stringify(q.w));
  }
} finally { await browser.close(); await srv.close(); }
console.log(bad ? 'FAIL ' + bad : 'OK'); process.exitCode = bad ? 1 : 0;
