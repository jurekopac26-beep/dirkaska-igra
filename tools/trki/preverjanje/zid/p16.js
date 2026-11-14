// p16: "Najdba 6" (a jump of tens of metres in one step beside a side road), found on Chapman's Peak; any track with side roads can be given.
// Part 1, geometry: points just past the track's fence that Track.query gives to a side road (q.k >= 0) where Track.stubPen is deeper than 3 m.
// Part 2 (argument "vozi"): the rally car driven at such points from the road's centre line, Race.step; the largest move in one step beyond speed × dt.
// usage: node tools/trki/preverjanje/zid/p16.js [vozi] [track id, default chapman]
'use strict';
const L = require('./lib.js'), { C, DT } = L;
const args = process.argv.slice(2), drive = args.includes('vozi'), id = args.filter((a) => a !== 'vozi')[0] || 'chapman';
const T = L.track(id), N = T.N, ds = T.ds, n2 = [0, 0];
const mOf = (i) => ((i * ds - T.startS) % T.len + T.len) % T.len;   // metres from the start line
const found = [];
for (let i = 0; i < N; i++) for (const sg of [1, -1]) { const B = sg > 0 ? T.br[i] : T.bl[i];
  for (const e of [0.02, 0.1, 0.2, 0.35, 0.6, 1.0]) { const d = sg * (B + e), x = T.px[i] + T.nx[i] * d, z = T.pz[i] + T.nz[i] * d, q = {};
    T.query(x, z, i, q); if (!(q.k >= 0)) continue; const pen = T.stubPen(q, 0, n2);
    if (pen > 3) found.push({ i, m: mOf(i), sg, e, x, z, k: q.k, deep: q.deep ? 1 : 0, st: q.st, u: q.u, pen }); } }
console.log(`${id}: točk tik za ograjo s stubPen > 3 m: ${found.length}`);
const by = {}; for (const f of found) { const key = f.k + '/' + f.sg; (by[key] = by[key] || []).push(f); }
for (const key of Object.keys(by)) { const a = by[key], mx = a.reduce((p, c) => c.pen > p.pen ? c : p, a[0]);
  console.log(`  cesta ${mx.k}, stran ${mx.sg > 0 ? 'desna' : 'leva'}: ${a.length} točk, ${Math.min(...a.map((f) => f.m)).toFixed(0)}–${Math.max(...a.map((f) => f.m)).toFixed(0)} m, največ ${mx.pen.toFixed(2)} m pri ${mx.m.toFixed(1)} m (za ograjo ${mx.e} m, deep ${mx.deep}, st ${mx.st.toFixed(1)}, u ${mx.u.toFixed(1)})`); }
if (drive) for (const cv of [1, 6]) { let worst = 0, wtxt = '', cnt = 0, runs = 0;
  try { C.setTest({ cv }); } catch (e) { console.log(`cv ${cv}: te različice v tem jedru ni`); continue; }
  for (const key of Object.keys(by)) { const a = by[key].filter((f) => f.e <= 0.35), pick = [];
    for (let j = 0; j < a.length; j += Math.max(1, Math.floor(a.length / 12))) pick.push(a[j]);
    for (const f of pick) for (const back of [8, 16, 30]) for (const kmh of [60, 120]) for (const thr of [0, 1]) {
      const i0 = (f.i - Math.round(back / ds) + N) % N, race = L.mkRace(T, 'rally', 'cs'), c = race.player, sx = T.px[i0], sz = T.pz[i0];
      L.put(c, T, sx, sz, Math.atan2(f.z - sz, f.x - sx), kmh / 3.6); let mx = 0, mk = -1; runs++;
      for (let k = 0; k < 480; k++) { c.inThr = thr; c.inBrk = 0; c.inHand = 0; c.inSteer = 0; const x = c.x, z = c.z, sp = Math.hypot(c.vx, c.vz); race.step(DT);
        const dx = Math.hypot(c.x - x, c.z - z) - sp * DT; if (dx > mx) { mx = dx; mk = k; } c.hitWall = 0; c.hitCar = 0; c.fxWall = 0; }
      if (mx > 1) cnt++;
      if (mx > worst) { worst = mx; wtxt = `cesta ${f.k} pri ${f.m.toFixed(0)} m, stran ${f.sg > 0 ? 'desna' : 'leva'}, s sredine ceste ${back} m nazaj, ${kmh} km/h, plin ${thr}, korak ${mk}`; } } }
  console.log(`cv ${cv}: voženj ${runs}, s premikom nad 1 m v enem koraku ${cnt}, največji ${worst.toFixed(2)} m${wtxt ? ' (' + wtxt + ')' : ''}`); }
C.setTest(null);
