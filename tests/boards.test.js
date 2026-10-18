// Braking boards (Track.brakeBoards; World draws them, js/world.js brakeBoards): on every circuit (a closed track that is not a test track
// nor a rally) the boards counting down to its heavy braking zones, 300, 200 and 100 m before the corner (Monaco's own 150, 100, 50; a
// circuit without a straight that long 150, 100, 50), on the outside of the approach, beside the road and clear of its barriers (or over
// them where the verge is too narrow), not in the mouth of the pit lane or a side road, not at the start line; none on the open roads, the
// rally stages and the test tracks.
//   node tests/boards.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const K = C.CSK, circuit = (d) => !d.open && !d.test && !d.rally && !d.descent;
const kmh = (v) => Math.round(v * 3.6);

// 1. no boards where there is no circuit
{
  const has = C.TRACKS.filter(d => !circuit(d)).map(d => [d.id, new C.Track(d).brakeBoards().length]).filter(e => e[1]);
  check('none on the open roads, the rally stages and the test tracks', !has.length, has.map(e => e.join(': ')).join(', ') || C.TRACKS.filter(d => !circuit(d)).length + ' tracks without');
}

// 2. every circuit
const sum = [];
for (const def of C.TRACKS.filter(circuit)) {
  const T = new C.Track(def), Z = T.brakeBoards(), L = T.len, id = def.id, B = Z.flatMap(z => z.boards.map(b => Object.assign({ zn: z }, b)));
  const v = T.speedProfile(K.aiLatA, K.aiBrakeA, 85, K.aiWmax, 0, 0.9), dOf = (s) => ((s - T.startS) % L + L) % L, back = (a, b) => ((a - b) % L + L) % L;
  const own = def.brakeBoards, D = own ? own.d : Z.length && Z[0].boards[0].d === 150 ? [150, 100, 50] : [300, 200, 100];
  sum.push(`${id} ${Z.length}/${B.length}`);
  check(`${id}: boards before ${Z.length} braking zone(s), three each, ${D.join(' / ')} m`, Z.length >= 1 && Z.length <= 8 && Z.every(z => z.boards.map(b => b.d).join() === D.join()),
    Z.map(z => `${Math.round(z.d0)} m (${z.dir > 0 ? 'R' : 'L'}, ${kmh(z.v0)} > ${kmh(z.v1)} km/h)`).join(', '));
  if (!own) {
    check(`${id}: 300 / 200 / 100 m wherever a straight allows it (150 / 100 / 50 only on a circuit with none)`, D[0] === 300 || id === 'toskana', D.join(' / '));
    // a heavy braking zone of the AI's profile: from the straight (60 m/s or more) down by 25 m/s or more to under 60 % within 150 m past the entry
    const heavy = Z.filter(z => { const b0 = z.boards[0]; let hi = 0, lo = 1e9; for (let d = 0; d <= z.boards[0].d - 10; d += T.ds) hi = Math.max(hi, v[T.idx(b0.s + d)]); for (let d = 0; d <= 150; d += T.ds) lo = Math.min(lo, v[T.idx(z.s + d)]);
      return hi >= 60 && hi - lo >= 25 && lo <= 0.6 * hi; });
    check(`${id}: each a heavy braking zone of the AI (60 m/s or more down by 25 m/s or more, to under 60 %, by 150 m past the corner's entry)`, heavy.length === Z.length, `${heavy.length} of ${Z.length}`);
  }
  // each board its number of metres before the corner's entry (+-10 m), on a straight
  const far = B.filter(b => Math.abs(back(b.zn.s, b.s) - b.d) > 10), bent = B.filter(b => Math.abs(T.k[b.i]) > 1 / 160);
  check(`${id}: each board its number of metres before the corner (within 10 m), where the road is straight (no bend under a 160 m radius)`, !far.length && (own || !bent.length),
    far.map(b => `${b.d}: ${Math.round(back(b.zn.s, b.s))} m`).concat(own ? [] : bent.map(b => `${b.d} at ${Math.round(dOf(b.s))} m: R ${Math.round(1 / Math.abs(T.k[b.i]))} m`)).join(', ') || `${B.length} boards`);
  // beside the road: on the verge off the asphalt (and the kerb) by 0.5 m or more and clear of the barrier by 0.2 m; or over the barrier (its
  // legs in the barrier's line or behind it, the plate above the cars by the wall and the spectators behind it, not over the asphalt)
  const pos = B.filter(b => { const a = Math.abs(b.lat), bar = b.side > 0 ? T.br[b.i] : T.bl[b.i], e = T.wAt(b.i) + (T.curb[b.i] ? T.curbW : 0);
    if (Math.sign(b.lat) !== b.side) return true;
    return b.kind === 0 ? a - b.pw / 2 < e + 0.5 || a + b.pw / 2 > bar - 0.2 || b.py < 0.3 : a < bar + 0.3 || a - b.pw / 2 < e + 0.25 || b.py < 1.8; });
  check(`${id}: beside the road, off the asphalt and the kerb, clear of the barrier (or over it)`, !pos.length,
    pos.map(b => `${b.d} at ${Math.round(dOf(b.s))} m: lat ${b.lat.toFixed(2)}, edge ${T.w}, barrier ${(b.side > 0 ? T.br[b.i] : T.bl[b.i]).toFixed(2)}, kind ${b.kind}`).join('; ') ||
    `${B.filter(b => !b.kind).length} on the verge, ${B.filter(b => b.kind).length} over the barrier`);
  // where it may stand: not in the pit lane's way in or out, a side road's mouth, by the start line or on a bridge
  const blocked = B.filter(b => { const p = def.pit ? T.pitAt(b.s) : null, d = dOf(b.s);
    return (p && p.sd === b.side && p.gap) || (T.gap && T.gap[b.side > 0 ? 1 : 0][b.i]) || d < 14 || d > L - 14 || (T.cross || []).some(c => [c.lo, c.up].some(f => Math.min(Math.abs(b.i - f), T.N - Math.abs(b.i - f)) * T.ds < 30)); });
  check(`${id}: none in the pit lane's way in or out, a side road's mouth, by the start line or on a bridge`, !blocked.length, blocked.map(b => `${b.d} at ${Math.round(dOf(b.s))} m`).join(', '));
  // on the outside of the approach (the side away from the corner's apex), the other side only where the outside has no room for it
  const ins = B.filter(b => b.side !== -b.zn.dir);
  check(`${id}: on the outside of the approach (away from the apex)`, ins.length <= Math.floor(B.length / 6), ins.length ? `${ins.length} of ${B.length} on the inside` : `all ${B.length}`);
  // the plate: readable from the cameras above (2 x 1.5 m), facing the cars coming (its heading the road's there)
  check(`${id}: the plates 2 x 1.5 m, facing the cars coming`, B.every(b => b.pw === 2 && b.ph === 1.5 && Math.abs(b.hd - T.hd[b.i]) < 1e-6));
}
console.log('zones / boards: ' + sum.join(', '));
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
