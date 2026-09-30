// The Stelvio (a real road in its real scale): the length and the heights of the climb, the 48 hairpins in their order, the places, the
// checkpoints, the buildings clear of the road, the data of the distant mountains and the medal times. Fast checks on the track data and
// the core (the runs themselves: golden.test.js and races.test.js).
//   node tests/stelvio.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0;
const check = (name, ok, info) => { if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${info ? ' — ' + info : ''}`); };

const def = C.TRACKS.find(d => d.id === 'stelvio'), T = new C.Track(def);
const dAt = (i) => Math.round(i * T.ds - T.startS);   // (a sample's metres after the start line)
const alt = (d) => T.hy[T.idx(T.startS + d)] + 900;   // (metres above the sea: the game's heights are above 900 m)
const nearest = (x, z) => { let b = 0, bd = Infinity; for (let i = 0; i < T.N; i++) { const q = (T.px[i] - x) ** 2 + (T.pz[i] - z) ** 2; if (q < bd) { bd = q; b = i; } } return [b, Math.sqrt(bd)]; };

// the climb: 24.3 km from the edge of Prad (920 m) to the pass (2757 m), the highest point of the run; an open road, a time trial
{
  const a0 = alt(0), a1 = alt(T.raceLen);
  let top = -Infinity, steep = 0; for (let d = 0; d <= T.raceLen; d += 10) { top = Math.max(top, alt(d)); if (d >= 50) steep = Math.max(steep, (alt(d) - alt(d - 50)) / 50); }
  check('the climb: 24.3 km in its real scale, an open road against the clock', Math.abs(T.raceLen - 24300) < 100 && T.open && def.timeTrial && def.realKm === 24.3, `${(T.raceLen / 1000).toFixed(2)} km`);
  check('heights: the start at 920 m, the pass at 2757 m the top of the run, no ramp over 15 %', Math.abs(a0 - 920) < 5 && Math.abs(a1 - 2757) < 3 && top <= a1 + 0.5 && steep < 0.15,
    `start ${a0.toFixed(1)} m, finish ${a1.toFixed(1)} m, top ${top.toFixed(1)} m, steepest 50 m ${(steep * 100).toFixed(1)} %`);
  check('the altitude on the screen: def.alt the start and the pass', def.alt[0] === 920 && def.alt[1] === 2757, `${def.alt}`);
}

// the 48 hairpins: numbered 48 (at the bottom) to 1 (below the pass) up the road, each on the centre line, a turn of 140-190 degrees
// over 100 m round its apex the way def.hairpins says (1 right, -1 left)
{
  const H = def.hairpins, turn = (i) => { let a = 0; for (let k = Math.max(1, i - 25); k < Math.min(T.N - 1, i + 25); k++) a += Math.atan2(T.tx[k + 1] * -T.tz[k] + T.tz[k + 1] * T.tx[k], T.tx[k + 1] * T.tx[k] + T.tz[k + 1] * T.tz[k]); return a * 180 / Math.PI; };
  const at = H.map(([n, x, z, dir]) => { const [i, off] = nearest(x, z); return { n, d: dAt(i), off, dir, turn: turn(i) }; });
  const numbered = H.length === 48 && H.every(([n], k) => n === 48 - k), up = at.every((h, k) => k === 0 || h.d > at[k - 1].d), inRun = at.every(h => h.d > 0 && h.d < T.raceLen);
  check('hairpins: 48, numbered 48 to 1 up the road, all within the run', numbered && up && inRun, `${H.length} hairpins, 48 at ${at[0].d} m, 1 at ${at[at.length - 1].d} m`);
  const wrong = at.filter(h => h.off > 2 || Math.abs(h.turn) < 140 || Math.abs(h.turn) > 190 || Math.sign(h.turn) !== h.dir);
  check('hairpins: on the centre line, each a turn of 140-190 degrees to its side', !wrong.length, wrong.length ? wrong.map(h => `${h.n}: ${h.turn.toFixed(0)} deg, ${h.off.toFixed(1)} m off`).join('; ') : `turns ${Math.min(...at.map(h => Math.abs(h.turn))).toFixed(0)}-${Math.max(...at.map(h => Math.abs(h.turn))).toFixed(0)} deg`);
  check('hairpins: the first two below Trafoi, the rest above it', at[1].d < 9800 && at[2].d > 9800, `47 at ${at[1].d} m, 46 at ${at[2].d} m`);
}

// the places in their order up the road, every hairpin among them; the checkpoints in the villages and on the hairpins
{
  const N = T.names, d = (n) => { const e = N.find(q => q.n === n); return e ? e.d : NaN; };
  const order = ['Prad am Stilfserjoch', 'Stilfser Brücke', 'Gomagoi', 'Predor', 'Trafoi', 'Weißer Knott', 'Franzenshöhe', 'Tibet Hütte', 'Passo dello Stelvio'];
  const ds = order.map(d), inOrder = ds.every((v, k) => Number.isFinite(v) && (k === 0 || v > ds[k - 1]));
  const hp = N.filter(q => /^Serpentina \d+$/.test(q.n)).map(q => +q.n.split(' ')[1]).sort((a, b) => a - b);
  check('places: Prad, Stilfser Brücke, Gomagoi, the tunnel, Trafoi, Weißer Knott, Franzenshöhe, Tibet Hütte and the pass in this order', inOrder, order.map((n, k) => `${n} ${Math.round(ds[k])}`).join(', '));
  check('places: every hairpin has its name (Serpentina 1-48)', hp.length === 48 && hp.every((n, k) => n === k + 1), `${hp.length} hairpin names`);
  const cp = T.cpDist, near = (a, b) => Math.abs(a - b) < 500;
  check('checkpoints: five, at Gomagoi, Trafoi, Weißer Knott, Franzenshöhe and hairpin 10', cp.length === 5 && near(cp[0], d('Gomagoi')) && near(cp[1], d('Trafoi')) && near(cp[2], d('Weißer Knott')) && near(cp[3], d('Franzenshöhe')) && near(cp[4], d('Serpentina 10')),
    cp.map(Math.round).join(', '));
  const tb = [...def.tunnels, ...def.bridges].sort((a, b) => a[0] - b[0]);
  check('tunnels and bridges: within the run, apart', tb.every(([a, b], k) => a > 0 && b > a && b < T.raceLen && (k === 0 || a > tb[k - 1][1])), `${def.tunnels.length} tunnels, ${def.bridges.length} bridges`);
}

// the buildings (OpenStreetMap footprints): none reaches over the road's barrier lines (the car would drive through its walls), the
// fort at Gomagoi two blockhouses, one either side of the road; the street in Prad wider (def.wide)
{
  const inside = []; let forts = 0;
  for (const [x, z, L, W, a, , kind] of def.bld) {
    const c = Math.cos(a), s = Math.sin(a);
    if (kind === 3) forts++;
    for (let u = -L / 2; u <= L / 2 + 1e-6; u += L / 8) for (let v = -W / 2; v <= W / 2 + 1e-6; v += W / 4) {
      const px = x + c * u - s * v, pz = z + s * u + c * v, [i, dist] = nearest(px, pz); if (dist > 30) continue;
      if (Math.abs((px - T.px[i]) * T.tx[i] + (pz - T.pz[i]) * T.tz[i]) > 2 * T.ds) continue;   // (beyond an end of the road, not beside it)
      const o = (px - T.px[i]) * T.nx[i] + (pz - T.pz[i]) * T.nz[i], bar = o < 0 ? T.bl[i] : T.br[i];
      if (Math.abs(o) < bar + 0.5) { inside.push(`${x},${z} at ${dAt(i)} m`); u = Infinity; break; }
    }
  }
  check('buildings: none over the barrier lines', def.bld.length > 400 && !inside.length, `${def.bld.length} buildings` + (inside.length ? ', over: ' + inside.slice(0, 5).join('; ') : ''));
  const sides = def.bld.filter(b => b[6] === 3).map(([x, z]) => { const [i] = nearest(x, z); return Math.sign((x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]); });
  check('the fort at Gomagoi: two blockhouses, one either side of the road', forts === 2 && sides[0] === -sides[1], `${forts} parts, sides ${sides}`);
  const i = T.idx(T.startS + 200);
  check('Prad: the street out of the village wider than the pass road', T.bl[i] > 8 && T.br[i] > 7 && T.bl[T.idx(T.startS + 5000)] < 6, `at 200 m ${T.bl[i].toFixed(1)} / ${T.br[i].toFixed(1)} m`);
}

// the distant mountains (def.far): the grids decode to their sizes (heights predicted from their neighbours, 5-bit characters; classes
// run-length coded), the inner grid inside the outer one's hole on its lattice, the Ortler (3905 m) the highest of them
{
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', F = def.far;
  const dec = (G) => {
    const n = G.nx * G.nz, v = new Int32Array(n); let p = 0;
    for (let k = 0; k < n; k++) { let z = 0, sh = 0, c; do { c = A.indexOf(G.h[p++]); z |= (c & 31) << sh; sh += 5; } while (c & 32);
      const i = k % G.nx, j = (k - i) / G.nx; v[k] = (i && j ? v[k - 1] + v[k - G.nx] - v[k - G.nx - 1] : i ? v[k - 1] : j ? v[k - G.nx] : 0) + (z & 1 ? -(z + 1) / 2 : z / 2); }
    let m = 0, q = 0; while (q < G.c.length) { const w = A.indexOf(G.c[q++]); let r = (w & 7) + 1; if ((w & 7) === 7) { let e; do { e = A.indexOf(G.c[q++]); r += e; } while (e === 63); } m += r; }
    return { used: p === G.h.length, cells: m, max: F.lo + Math.max(...v) * G.q, min: F.lo + Math.min(...v) * G.q };
  };
  const [I, O] = F.grids, di = dec(I), dO = dec(O), [ia, ja, ib, jb] = O.hole;
  check('distant mountains: both grids decode to their sizes', di.used && dO.used && di.cells === I.nx * I.nz && dO.cells === O.nx * O.nz, `inner ${I.nx} x ${I.nz} (${I.cell} m), outer ${O.nx} x ${O.nz} (${O.cell} m)`);
  check('distant mountains: the inner grid fills the outer one\'s hole, on its lattice', O.cell === 3 * I.cell && I.x0 === O.x0 + ia * O.cell && I.z0 === O.z0 + ja * O.cell && I.nx === (ib - ia) * 3 + 1 && I.nz === (jb - ja) * 3 + 1, `hole ${O.hole}`);
  check('distant mountains: the Ortler the highest (3905 m), the valleys below 1000 m', di.max > 3800 && di.max < 3910 && dO.min < 1000, `inner ${di.min}-${di.max} m, outer ${dO.min}-${dO.max} m`);
}

// the medal times: gold < silver < bronze, both physics, dry and wet; the rain slower
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  check('medals: gold < silver < bronze for both physics, dry and wet; the rain slower', asc(M.cs) && asc(M.arcade) && asc(M.wet.cs) && asc(M.wet.arcade) && M.wet.cs[0] > M.cs[0] && M.wet.arcade[0] > M.arcade[0],
    `cs ${M.cs}, arcade ${M.arcade}, wet cs ${M.wet.cs}, wet arcade ${M.wet.arcade}`);
}

console.log(bad ? `\n${bad} FAILED` : '\nall OK');
process.exit(bad ? 1 : 0);
