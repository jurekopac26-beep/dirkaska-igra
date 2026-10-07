// The junctions of the open roads (def.sideRoads, Track.stubs): the streets, service roads, driveways and tracks that meet the road, from
// OpenStreetMap, on every track that has them (Vršič, Mulholland Highway, Big Sur, Chapman's Peak, Uncompahgre, Los Caracoles, Katu-Jaryk).
// 1. the data: in order along the road, both sides, a sensible width and length, within the race, inside the terrain's map; a few of the real
//    ones by name (Cornell School Road at the start of Mulholland, the Old Coast Road at Bixby Creek, Engineer Pass Road ...)
// 2. the mouths as on the real roads: each corner rounded by the kerb return (an arc of radius S.cr tangent to the road's edge and to the
//    side road's, Track.stubHw), the sharper the corner the longer its arc, the side road its own width past both arcs; the cones across it
//    span its whole width there (none on the road's own asphalt)
// 3. the barriers as without them, open only across the mouths; away from the junctions every query, limit, surface and height exactly as
//    on the road without side roads
// 4. driven into one (Core.stubDrive, as the police would: in to the rail at its end, turned round, out): no wall until the rail, the height
//    smooth, the progress pinned at the junction while deep in it, no wrong way, the cones knocked over; out onto the road again
// 5. a race on each (12 AI and the player on autopilot, 90 s): no car ever deep in a side road
//   node tests/junctions.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const IDS = ['vrsic', 'mulholland', 'bigsur', 'chapman', 'uncompahgre', 'caracoles', 'katu'];
const NAMED = { mulholland: ['Cornell School Road', 'Simes Lane', 'Seminole Drive', 'Lower Brewster Road'], bigsur: ['Coast Road'], uncompahgre: ['Engineer Pass Road'], chapman: ['Military Road'], vrsic: ['Borovška cesta', 'Koroška ulica'] };

// every track with side roads is on the list (an open road), the others have none
// (Medvode's side roads are closed at the road's edge, def.sideClosed: the barrier straight across their mouths, the fence and the bollards in front of them; their tests: medvode-fence, medvode-props)
check('tracks: the open roads with side roads that can be driven into are these seven', C.TRACKS.filter(d => d.sideRoads && d.sideRoads.length && !d.sideClosed).map(d => d.id).sort().join() === IDS.slice().sort().join() && C.TRACKS.filter(d => d.sideRoads).every(d => d.open),
  C.TRACKS.filter(d => d.sideRoads && !d.sideClosed).map(d => d.id + ' ' + d.sideRoads.length).join(', ') + '; closed at the road: ' + C.TRACKS.filter(d => d.sideRoads && d.sideClosed).map(d => d.id + ' ' + d.sideRoads.length).join(', '));

for (const id of IDS) {
  const def = C.TRACKS.find(d => d.id === id), T = new C.Track(def), S = T.stubs, SR = def.sideRoads, T0 = new C.Track(Object.assign({}, def, { sideRoads: null }));
  // 1. the data
  { const D = def.dem, inDem = !D || S.every(s => { for (let j = 0; j < s.n; j++) if (s.x[j] < D.x0 || s.z[j] < D.z0 || s.x[j] > D.x0 + D.nx * D.cell || s.z[j] > D.z0 + D.nz * D.cell) return false; return true; });
    const named = new Set(S.map(s => s.name)), inRace = S.every(s => s.s0 > T.startS - 60 && s.s0 < T.finishS + 250);
    check(`${id}: ${S.length} side roads, in order along the road, both sides valid, ${S.filter(s => s.grav).length} gravel; open 30-240 m, a rail, a gate or a building at the end; within the race, on the terrain's map${NAMED[id] ? ' (' + NAMED[id].join(', ') + ')' : ''}`,
      S.length === SR.length && S.length > 0 && SR.every((r, k) => !k || r[0] >= SR[k - 1][0]) && S.every(s => Math.abs(s.side) === 1 && s.hw >= 1.5 && s.hw <= 3.5 && s.L > s.tb + 8 && s.L >= 25 && s.L <= 240 && s.Lend >= s.L && s.end >= 0 && s.end <= 2) &&
      inRace && inDem && (NAMED[id] || []).every(x => named.has(x)),
      `${S.filter(s => s.side < 0).length} left, ${S.filter(s => s.side > 0).length} right; open ${Math.min(...S.map(s => s.L)).toFixed(0)}-${Math.max(...S.map(s => s.L)).toFixed(0)} m`);
  }
  // 2. the mouths: the kerb returns
  { let why = [];
    for (const s of S) {
      const R = s.cr, ok1 = R >= 3 && R <= 9 && s.th.every(t => t > 0.05 && t < Math.PI - 0.05) && Math.abs(s.th[0] + s.th[1] - Math.PI) < 0.6;   // (the two corners' angles add up to about a straight one)
      const sharp = s.th[0] < s.th[1] ? 0 : 1, ok2 = s.lt[sharp] >= s.lt[1 - sharp] - 1e-6;   // (the sharper corner's arc the longer)
      let ok3 = true; for (const c of [0, 1]) { const u = c ? 1 : -1, past = s.tv[c] + s.lt[c] + 0.5; if (Math.abs(T.stubHw(s, past, u) - s.hw) > 1e-6) ok3 = false;   // (its own width past the arc)
        for (let a = 0; a < s.lt[c]; a += 0.5) { const e = T.stubHw(s, s.tv[c] + a, u) - s.hw; if (e < -1e-6 || e > 12.01) ok3 = false; } }
      const cones = T.stubCones(s.k), tc = Math.min(Math.max(s.tb + 2.5, s.tv[0] + 1.5, s.tv[1] + 1.5), s.L - 4), p = T.stubPt(s.k, tc, {}), us = cones.map(q => (q.x - p.x) * -p.tz + (q.z - p.z) * p.tx), qq = {};
      const ok4 = cones.length >= 2 && Math.min(...us) < -(s.hw - 0.5) && Math.max(...us) > s.hw - 0.5 && cones.every(c => { T.query(c.x, c.z, c.i, qq); return qq.deep || Math.abs(qq.d) >= T.w + 0.4; });   // (the cones across its whole width, none on the road's asphalt)
      if (!(ok1 && ok2 && ok3 && ok4)) why.push(`${Math.round(s.s0 - T.startS)} ${[ok1, ok2, ok3, ok4].map(Number).join('')}`);
    }
    check(`${id}: every mouth rounded by its two kerb returns (radius 3-9 m, the sharper corner's arc longer, the side road's own width past them), the cones across its whole width (none on the road)`, !why.length, why.join(', ') || `radii ${[...new Set(S.map(s => s.cr.toFixed(1)))].join('/')} m`);
  }
  // 3. the barriers as they were; open only across the mouths; away from the junctions everything as without them
  { let same = true; for (let i = 0; i < T.N; i++) if (T.bl[i] !== T0.bl[i] || T.br[i] !== T0.br[i]) same = false;
    const near = (s) => S.some(x => Math.abs(x.s0 - s) < 90 || Math.abs(x.sF - s) < 90);
    let gaps = 0, stray = 0; for (const G of T.gap) for (let i = 0; i < T.N; i++) if (G[i]) { gaps++; if (!near(i * T.ds)) stray++; }
    let diff = 0, pts = 0; const q = {}, q0 = {}, n1 = [0, 0], n0 = [0, 0];
    for (let i = 3; i < T.N - 3; i += 7) { if (S.some(x => Math.abs(x.s0 - i * T.ds) < 260)) continue;
      for (const d of [-T.w - 6, -T.w - 2, -T.w + 0.5, 0, T.w - 0.5, T.w + 2, T.w + 6]) { const x = T.px[i] + T.nx[i] * d, z = T.pz[i] + T.nz[i] * d; T.query(x, z, i, q); T0.query(x, z, i, q0); pts++;
        if (q.k >= 0 || q.s !== q0.s || q.d !== q0.d || T.wall(q, 0.5, n1) !== T0.wall(q0, 0.5, n0) || T.surface(q) !== T0.surface(q0) || T.yAt(q) !== T0.yAt(q0)) diff++; } }
    check(`${id}: the barriers the same, open only across the mouths; away from the junctions the road exactly as without them`, same && gaps >= S.length * 2 && !stray && pts > 200 && !diff,
      `${gaps} samples of open barrier (${stray} away from a junction), ${pts} points compared, ${diff} different`);
  }
  // 4. driven into one and out: the longest open one, a street (or the first) and a gravel one
  { const pick = [...new Set([S.slice().sort((a, b) => b.L - a.L)[0], S.find(s => s.kind === 0) || S[0], S.find(s => s.grav) || S[S.length - 1]])];
    const res = pick.map(St => {
      const o2 = Math.random; Math.random = seeded(77);
      const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true })), P = r.player; r.start(); P.locked = false;
      r.setProps(T.stubCones(St.k), null); const cones = r.props.map(b => [b.x, b.z]);
      const back = St.ang > 100, i = T.idx(St.s0 + (back ? 16 : -45)), d = St.side * Math.min(2.5, T.w - 1.5);
      P.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i] + (back ? Math.PI : 0)); P.y = P.py = T.hy[i]; P.roadY = P.y; const v0 = back ? 5 : 12; P.vx = Math.cos(P.h) * v0; P.vz = Math.sin(P.h) * v0;
      let ph = back ? 'in' : 'road', tP = 0, wall = 0, wallAt = '', maxDy = 0, py = null, dS = 0, sDeep = null, wrong = 0, railHit = 0, outOk = false;
      for (let k = 0; k < 120 * 150 && ph !== 'done'; k++) {
        if (ph === 'road') { C.aiControl(P, r, DT); if (P.speed > 9) { P.inThr = 0; P.inBrk = 0.4; } if (Math.abs(P.q.s - St.s0) < 14) ph = 'in'; }
        else if (ph === 'in') { if (C.stubDrive(P, r, St.k, 1)) { ph = 'rail'; tP = 0; } }
        else if (ph === 'rail') { P.inSteer = 0; P.inThr = 1; P.inBrk = 0; P.inHand = 0; tP += DT; if (tP > 2.5) { ph = 'stop'; tP = 0; } }
        else if (ph === 'stop') { P.inThr = 0; P.inBrk = 0; P.inHand = 1; P.inSteer = 0; tP += DT; if (tP > 1) ph = 'out'; }
        else if (ph === 'out') { if (C.stubDrive(P, r, St.k, -1)) { ph = 'back'; tP = 0; } }
        else if (ph === 'back') { if (C.stubDrive(P, r, St.k, -1)) C.aiControl(P, r, DT); tP += DT; if (P.q.k < 0 && Math.abs(P.q.d) < T.w) { outOk = true; ph = 'done'; } if (tP > 10) ph = 'done'; }
        P.hitWall = 0; const wt0 = P.wrongT; r.step(DT); const Q = P.q;
        if (Q.k === St.k) { if (py !== null && !P.air) maxDy = Math.max(maxDy, Math.abs(P.y - py)); if (P.wrongT > wt0) wrong++; }
        py = Q.k === St.k ? P.y : null;
        if (Q.deep) { if (sDeep === null) sDeep = Q.s; dS = Math.max(dS, Math.abs(Q.s - sDeep)); } else sDeep = null;
        if (P.hitWall > 0.3) { if (ph === 'rail' && Q.k === St.k && Q.st > St.L - 6) railHit = Math.max(railHit, P.hitWall); else if (ph !== 'rail') { wall++; wallAt = wallAt || `${ph} t ${Q.k >= 0 ? Q.st.toFixed(0) : '-'}`; } }
      }
      const knocked = r.props.filter((b, k) => Math.hypot(b.x - cones[k][0], b.z - cones[k][1]) > 0.3).length;
      Math.random = o2;
      return { ok: outOk && !wall && maxDy < 0.12 && dS < 1e-6 && !wrong && railHit > 1 && knocked > 0,
        txt: `${St.name || ['street', 'service', 'track'][St.kind]} ${Math.round(St.s0 - T.startS)} m ${St.side > 0 ? 'R' : 'L'}: ${outOk ? 'out' : 'NOT out'}, walls ${wall}${wallAt ? ' (' + wallAt + ')' : ''}, step ${maxDy.toFixed(3)} m, rail ${railHit.toFixed(1)}, cones ${knocked}` };
    });
    check(`${id}: driven into a side road and out: no wall until its rail, the height smooth, the progress pinned at the junction, no wrong way, the cones knocked over`, res.every(x => x.ok), res.map(x => x.txt).join(' | '));
  }
  // 5. a race: nobody turns off
  { const orig = Math.random; Math.random = seeded(3);
    const r = new C.Race(T, opts({})), P = r.player; r.start(); let inSide = 0, k = 0;
    for (let t = 0; t < 90; t += DT) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); for (const c of r.cars) if (c.q.deep) inSide++; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig;
    check(`${id}: a race (12 AI and the player on autopilot, 90 s): no car ever deep in a side road`, !inSide, `car-steps deep in one: ${inSide}, the leader ${Math.round(Math.max(...r.cars.map(c => c.dist || 0)))} m on`);
  }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
