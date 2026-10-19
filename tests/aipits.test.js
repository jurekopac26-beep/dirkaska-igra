// The rivals in for repairs (Core only, no browser): with damage on (damage 2) an AI car badly damaged (about AI_FIX.dmg, each driver a
// little either side of it) comes into the pits at the end of the lap, its crew repairs it, it races on. Not with damage off or only the
// looks (damage 0, 1), not in a race without tyres (the golden references' races: unchanged); not decided in the run-up to the way in (the
// next lap then) and never in on the last lap (a stop with less than 0.6 of a lap to race after it); at most three AI cars on their way in or
// in the lane, the others a lap later; after the stop out of the box only with the lane clear behind it (a safe release). Races as the game
// sets them up (tyres, compounds, failures, flags, characters, slipstream, the team radio): every rival that stops is repaired, none is
// rescued on its way in or in the lane, everybody to the line.
//   node tests/aipits.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : String(x));

// a race (the player on the autopilot at the back) to its end or until stop(r, t); ev(r, t) before each step (the test's damage). Per car:
// its stops ({ lap, dmg at the way in, t, out: its damage leaving the lane }), the first moment it was told to come in (want: { t, dist, dmg }),
// rescues on its way in or in the lane; the most AI cars in for a stop at once. The releases from the boxes: each AI car pulling out of its
// box after the stop (from standing to 2 m/s there), held: the steps one stood there ready while a car came down the lane, and the releases
// into one (a car in the lane beside it or less than ~2.5 s behind it)
const lane = (r, c) => r.cars.find(o => { const g = c.dist - o.dist; return o !== c && o.inPit && o.speed > 2 && g > -(o.m.len + c.m.len) * 0.5 && g < 8 + o.speed * 2.5; });
function race(tid, opts, ev, stop) {
  const T = new C.Track(C.TRACKS.find(d => d.id === tid)), orig = Math.random; Math.random = seeded(7);
  try {
    const r = new C.Race(T, Object.assign({ numAI: 12, playerGrid: 13, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 5, difficulty: 1, damage: 2, tyres: true, compounds: true, launch: false }, opts));
    r.start(); const P = r.player, st = new Map(r.cars.map(c => [c, { stops: [], want: null, lane: false, pitR: 0 }]));
    const resc = r.rescue.bind(r); r.rescue = (c) => { if (c.pitWant || c.inPit) st.get(c).pitR++; return resc(c); };
    let t = 0, k = 0, maxIn = 0; const rel = { n: 0, held: 0, into: [] }, v0 = new Map();
    while (t < 1800 && !r.cars.every(c => c.finished || r.isOut(c)) && !(stop && stop(r, t))) {
      Math.random = seeded(5000 + (++k));
      if (ev) ev(r, t);
      if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      let nIn = 0;
      for (const c of r.cars) {
        const s = st.get(c); if (c.isPlayer) continue;
        if (c.pitWant || c.inPit) nIn++;
        if (c.pitWant && !s.want) s.want = { t, dist: c.dist, dmg: c.dmg };
        if (c.inPit && !s.lane) s.stops.push({ lap: c.lap, dmg: c.dmg, t, out: null });
        if (!c.inPit && s.lane) s.stops[s.stops.length - 1].out = c.dmg;
        s.lane = c.inPit;
        const atBox = c.inPit && c.pitDone && Math.abs(r.track.boxX(c.q.s, r._boxD(c))) < 5;
        if (atBox && c.speed < 0.1 && lane(r, c)) rel.held++;
        if (atBox && (v0.get(c) || 0) < 2 && c.speed >= 2) { rel.n++; const o = lane(r, c); if (o) rel.into.push(`${c.name} into ${o.name}`); }
        v0.set(c, c.speed);
      }
      maxIn = Math.max(maxIn, nIn);
    }
    return { r, T, L: T.len, P1: T.def.pit[1], st, t, maxIn, rel, fin: r.cars.filter(c => c.finished).length };
  } finally { Math.random = orig; }
}
const byGrid = (r, g) => r.cars.find(c => c.grid === g);
const dE = (T, c) => (((T.startS + T.def.pit[1] - c.q.s) % T.len) + T.len) % T.len;   // (metres to the way in, along the lap)

// 1. the Red Bull Ring, 3 laps (no failures or flags: only the damage given here). A badly damaged on the first lap: in at its end,
// repaired, on to the line; B damaged in the run-up to the way in: not into it then (no dive across the road), in at the end of the next
// lap; E damaged on the last lap: no stop (the line before any good it would do); Z a little damaged (below every driver's mark): no stop
// while it stays under 0.4; no car told to come in without a reason (the cars the race itself damages: over 0.4 then)
{
  const hit = {};
  const R = race('rbring', { laps: 3 }, (r, t) => {
    if (r.state !== 'racing') return;
    const L = r.track.len, A = byGrid(r, 3), B = byGrid(r, 8), E = byGrid(r, 11), Z = byGrid(r, 6);
    if (!hit.A && A.lap === 1 && A.dist > L * 0.3) { hit.A = true; A.dmg = 0.8; Z.dmg = 0.3; }
    if (!hit.B && B.lap === 1 && B.dist > L * 0.5 && dE(r.track, B) < 250 && dE(r.track, B) > 80) { hit.B = { dE: dE(r.track, B) }; B.dmg = 0.8; }
    if (!hit.E && E.lap === 3 && E.dist > L * 2.15) { hit.E = true; E.dmg = 0.8; }
  });
  const { r, L, P1 } = R, s = (g) => R.st.get(byGrid(r, g)), A = s(3), B = s(8), E = s(11), Z = s(6);
  const fmt = (x) => x.stops.map(p => `lap ${p.lap} at ${f2(p.dmg)} out ${f2(p.out)}`).join(', ') || 'no stop';
  check('damaged on the first lap (0.8): in at its end, repaired, on to the line',
    !!hit.A && A.stops.length === 1 && A.stops[0].lap === 1 && A.stops[0].out < 0.05 && byGrid(r, 3).finished, fmt(A));
  check('damaged in the run-up to the way in: not into it then, in at the end of the next lap, repaired',
    !!hit.B && !!B.want && B.want.dist > L + P1 && B.stops.length === 1 && B.stops[0].lap === 2 && B.stops[0].out < 0.05,
    `hit ${hit.B ? Math.round(hit.B.dE) : '-'} m before the way in, told ${B.want ? f2(B.want.dist / L) : '-'} laps in; ${fmt(B)}`);
  check('damaged on the last lap: no stop (less than 0.6 of a lap left after the way in)', !!hit.E && !E.want && !E.stops.length && byGrid(r, 11).finished, fmt(E));
  const why = r.cars.filter(c => !c.isPlayer && R.st.get(c).want).map(c => `${c.name} ${f2(R.st.get(c).want.dmg)}`);
  check('a little damaged (0.3, below every driver\'s mark): not told to come in while under 0.4; nor any other car (A and B, and those the race itself damaged that far)',
    (!Z.want || Z.want.dmg > 0.4) && r.cars.every(c => c.isPlayer || !R.st.get(c).want || R.st.get(c).want.dmg > 0.4), `Z ${Z.want ? 'told at ' + f2(Z.want.dmg) : 'out'}; told to come in: ${why.join(', ')}`);
  check('... everybody to the line, nobody rescued on the way in or in the lane', R.fin === r.cars.length && [...R.st.values()].every(x => !x.pitR), `${R.fin}/${r.cars.length} at the line in ${R.t.toFixed(0)} s`);
}

// 2. the same damage with damage off (0) or only the looks (1), and in a race without tyres (the golden references' races): no stop
{
  const out = [];
  for (const [k, o] of [['damage 0', { damage: 0 }], ['damage 1', { damage: 1 }], ['no tyres', { tyres: false, compounds: false }]]) {
    let A = null;
    const R = race('rbring', Object.assign({ laps: 3 }, o), (r) => { const c = byGrid(r, 3); if (!A && r.state === 'racing' && c.lap === 1 && c.dist > r.track.len * 0.3) { A = c; c.dmg = 0.8; } },
      (r) => !!A && A.dist > r.track.len + 300);   // (on past the way in and the line)
    const x = R.st.get(A); out.push({ k, ok: !!A && !x.want && !x.stops.length });
  }
  check('damage off, only the looks, or no tyres: the damaged car stays out', out.every(x => x.ok), out.map(x => `${x.k} ${x.ok ? 'out' : 'IN'}`).join(', '));
}

// 3. six cars badly damaged at once (Crystal Palace, 4 laps): the lane full at the end of the lap (three in: the first of them, with any
// the race itself damaged badly enough), the others once it has room, a lap or two later; never more than three on their way in or in the
// lane; each repaired (in again only if the race damages it badly once more); everybody to the line; out of the boxes by a safe release
{
  let hit = false;
  const G = [2, 3, 4, 5, 6, 7];
  const R = race('cpalace', { laps: 4 }, (r) => { const lead = r.order && r.order[0]; if (!hit && r.state === 'racing' && lead && lead.lap === 1 && lead.dist > r.track.len * 0.3) { hit = true; for (const g of G) byGrid(r, g).dmg = 0.8; } });
  const S = G.map(g => R.st.get(byGrid(R.r, g))), laps = S.map(x => x.stops.length ? String(x.stops[0].lap) : '-'), again = S.flatMap(x => x.stops.slice(1));
  const first = R.r.cars.filter(c => !c.isPlayer && R.st.get(c).stops.some(p => p.lap === 1)), more = first.filter(c => !G.includes(c.grid)).map(c => c.name);
  check('six damaged at once: never more than three AI cars on their way in or in the lane; three in at the end of the lap (the six first, with any the race damaged itself), the others a lap or two later',
    hit && R.maxIn <= 3 && first.length === 3 && laps.filter(l => l === '1').length === 3 - more.length && laps.filter(l => l === '2' || l === '3').length === 3 + more.length,
    `at most ${R.maxIn} at once; laps of the six's stops ${laps.join(', ')}${more.length ? '; in at the end of the first lap too: ' + more.join(', ') : ''}`);
  check('... each repaired by that stop (in again only when the race damaged it badly once more); everybody to the line, nobody rescued on the way in or in the lane',
    S.every(x => x.stops.length >= 1 && x.stops[0].out < 0.05) && again.every(p => p.dmg > 0.4) && R.fin === R.r.cars.length && [...R.st.values()].every(x => !x.pitR),
    `${R.fin}/${R.r.cars.length} at the line${again.length ? '; in again at ' + again.map(p => f2(p.dmg)).join(', ') : ''}`);
  check('... a safe release: each pulls out of its box after the stop only with no car coming down the lane beside it or less than ~2.5 s behind it (waiting in the box till it has passed)',
    R.rel.n >= 6 && !R.rel.into.length, `${R.rel.n} releases, ${(R.rel.held * DT).toFixed(1)} s held in all${R.rel.into.length ? '; INTO A CAR: ' + R.rel.into.join(', ') : ''}`);
}

// 4. races as the game sets them up (Spa and Montréal, 2 laps each): the rivals' stops (for damage now too, the cut tyres as before); every one that
// stops is repaired (one in at the end of the last lap for a cut tyre crosses the line in the lane), none rescued on its way in or in the lane,
// everybody to the line
{
  const out = [];
  for (const [tid, laps, seed] of [['spa', 2, 3], ['montreal', 2, 3]]) {
    const R = race(tid, { laps, seed, faults: true, flags: true, chars: true, slip: true, radio: true, launch: true });
    const stops = [...R.st.values()].flatMap(x => x.stops);
    out.push({ tid, stops, fix: stops.filter(p => p.dmg > 0.4).length, rep: stops.every(p => p.out == null || p.out < 0.05),   // (out null: over the line in the lane)
      pitR: [...R.st.values()].reduce((a, x) => a + x.pitR, 0), fin: R.fin, all: R.r.cars.length });
  }
  check('races as the game sets them up: rivals come in badly damaged (one or more), each one that stops repaired, none rescued on its way in or in the lane, all to the line',
    out.reduce((a, x) => a + x.fix, 0) >= 1 && out.every(x => x.rep && !x.pitR && x.fin === x.all && x.stops.length <= 8),
    out.map(x => `${x.tid} ${x.stops.length} stops (${x.fix} damaged: ${x.stops.map(p => f2(p.dmg)).join(' ')}), ${x.fin}/${x.all} at the line${x.pitR ? ', ' + x.pitR + ' RESCUED' : ''}`).join('; '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
