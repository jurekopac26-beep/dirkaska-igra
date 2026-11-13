// The relief of the real gravel roads (js/makadam-cesta.js: ruts, hollows, ridges and the tilt across, as Killar's; the user, 13. 11. 2026):
// on Katu, Pikes Peak on gravel and the gravel parts of Harju, wrinkled along the whole gravel road; none on the tarmac and the paving, at the
// start and the finish and round the checkpoints; gentle enough across (the slope); back to the road's height at its edges; the same every
// time (seeded, Math.random untouched); Pikes Peak on asphalt and Killar's own relief as they were.
//   node tests/makadam-cesta.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const mk = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const o = { dy: 0, sl: 0 }, at = (T, s, d) => { T.bankAt(s, d, o); return { dy: o.dy, sl: o.sl }; };
const wAt = (T, i) => (T.wAt ? T.wAt(i) : T.w);
const D = [-0.9, -0.6, -0.5, -0.3, 0, 0.3, 0.5, 0.6, 0.9];

for (const id of ['katu', 'pikesg', 'harju']) {
  const r0 = Math.random; let calls = 0; Math.random = () => { calls++; return r0(); };
  const T = mk(id); Math.random = r0;
  check(`${id}: the gravel road's relief (def.cross: MakadamCesta, T.relief)`, T.relief && T.bankAt && T.bankAt.makadam === true, `${T.bankAt && T.bankAt.ruts ? T.bankAt.ruts.length : 0} features`);
  // over the gravel: wrinkled, gentle, the edges at the road's height; elsewhere flat
  let gv = 0, wr = 0, maxSl = 0, maxDy = 0, off = 0, edge = 0, quiet = 0;
  const cp = T.cpS || [], open = !!T.def.open;
  for (let i = 0; i < T.N; i++) {
    const s = i * T.ds, W = wAt(T, i), grav = !T.sf || T.sf[i] === 5;
    let amax = 0; for (const f of D) { const r = at(T, s, f * W); amax = Math.max(amax, Math.abs(r.dy)); if (Math.abs(f) < 0.85) maxSl = Math.max(maxSl, Math.abs(r.sl)); maxDy = Math.max(maxDy, Math.abs(r.dy)); }
    edge = Math.max(edge, Math.abs(at(T, s, W * 0.999).dy), Math.abs(at(T, s, -W * 0.999).dy));
    if (!grav) { off = Math.max(off, amax); continue; }
    const rs = open ? s : ((s - T.startS) % T.len + T.len) % T.len + T.startS;
    const q = (rs > T.startS - 1 && rs < T.startS + 39) || (open ? rs > T.finishS - 29 : rs > T.startS + T.len - 39) || cp.some(c => Math.abs(rs - c) < 19);
    if (q) { quiet = Math.max(quiet, amax); continue; }
    gv++; if (amax > 0.02) wr++;
  }
  check(`${id}: wrinkled along the whole gravel road (more than 80 % of its samples off the quiet places)`, gv > 0 && wr / gv > 0.8, `${(100 * wr / Math.max(1, gv)).toFixed(1)} % of ${gv}`);
  check(`${id}: gentle (the slope across within the road at most 15 %, the height at most 0.4 m)`, maxSl <= 0.15 && maxDy <= 0.4, `slope ${(100 * maxSl).toFixed(1)} %, height ${maxDy.toFixed(3)} m`);
  check(`${id}: back to the road's height at its edges`, edge < 0.005, `${edge.toFixed(4)} m`);
  check(`${id}: none at the start, the finish and the checkpoints`, quiet < 1e-6, `${quiet.toFixed(4)} m`);
  if (T.sf) check(`${id}: none off the gravel (tarmac, paving)`, off < 1e-6, `${off.toFixed(4)} m`);
  const U = mk(id); let same = true; for (let i = 0; i < T.N; i += 7) for (const f of D) { const a = at(T, i * T.ds, f * wAt(T, i)).dy, b = at(U, i * U.ds, f * wAt(U, i)).dy; if (a !== b) same = false; }
  check(`${id}: the same every time, Math.random untouched`, same && calls === 0, `${calls} calls`);
}
const P = mk('pikes');
check('pikes on asphalt: no relief', !(P.bankAt && P.bankAt.makadam));
const K = mk('killar');
check("killar: its own relief (not this helper's)", K.relief && !K.bankAt.makadam);

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
