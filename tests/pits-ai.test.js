// The AI cars' pit stops, on every track with a pit lane, with both physics. Every AI car has a box of its own. A badly damaged AI
// car (damage that costs pace, half or worse) comes in at the end of the lap: in by the pit wall (the fast lane), over to the working
// lane in front of its garage, stops in its box, is repaired, back out; nobody touches another car or a wall in the pit lane, and every
// car finishes. Never on its last lap, and not when damage is only for show. Several cars at once (two of them in neighbouring boxes):
// all repaired, no contact.
//   node tests/pits-ai.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const t0 = Date.now();

// a 2-lap race (the player on autopilot, never into the pits); hurt: the AI cars damaged at the start (index among the AI cars)
function race(tid, phys, hurt, opts) {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const T = new C.Track(C.TRACKS.find(d => d.id === tid)), L = T.len;
    const r = new C.Race(T, Object.assign({ numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys, seed: 11, difficulty: 1 }, opts || {}));
    r.start();
    const P = r.player, ai = r.cars.filter(c => c !== P), dS = (s) => { let d = s - T.startS; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };
    for (const k of hurt) ai[k].dmg = 0.8;
    const st = new Map(r.cars.map(c => [c, { ev: [], stopAt: null, lat: null, lastLap: false, calledLast: false }])), hits = [];
    let t = 0, k = 0; const tmax = L * 2 / 12 + 200;
    while (t < tmax && r.cars.some(c => !c.finished)) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      for (const c of r.cars) {
        const s = st.get(c);
        if (c.pitEv && c.pitEv !== s.last) { s.ev.push(c.pitEv); s.last = c.pitEv;
          if (c.pitEv === 'repair') { const pz = T.pitAt(c.q.s); s.stopAt = dS(c.q.s); s.lat = pz ? c.q.d - pz.o : null; } }
        if (!c.pitEv) s.last = null;
        if (c.inPit && (c.hitCar > 2 || c.hitWall > 2)) hits.push(`${c.name} ${c.hitCar > 2 ? 'car' : 'wall'} ${Math.max(c.hitCar, c.hitWall).toFixed(1)} m/s at ${dS(c.q.s).toFixed(0)} m`);
        if (!c.isPlayer && c.lap === r.laps && !c.finished && c.pitWant && !s.wasWant) s.calledLast = true;
        s.wasWant = c.pitWant;
        c.hitWall = 0; c.hitCar = 0;
        if (c.isPlayer && (c.stuckT > 3 || c.wrongT > 3)) r.rescue(c);
      }
      if (P.pitEv) P.pitEv = null;
    }
    return { T, r, P, ai, st, hits, t };
  } finally { Math.random = orig; }
}

const PIT = C.TRACKS.filter(d => d.pit).map(d => d.id);
check('tracks with a pit lane', PIT.length >= 5, PIT.join(', '));
for (const tid of PIT) for (const phys of ['cs', 'arcade']) {
  const R = race(tid, phys, [2, 7]), { T, P, ai, st, hits } = R, key = `${tid}/${phys}`;
  if (phys === 'cs') {   // the boxes: one each, all different, none the player's, all in the row of garages
    const boxes = ai.map(c => c.pitBox), [q0, q1] = T.def.pitRow || [-152, 44];
    check(`${tid}: every AI car has a box of its own`, boxes.every(b => b != null && b >= q0 && b <= q1 + 10) && new Set(boxes).size === boxes.length && !boxes.includes(T.def.pit[3]),
      boxes.join(' '));
  }
  for (const k of [2, 7]) {
    const c = ai[k], s = st.get(c), seq = s.ev.join('>');
    check(`${key}: damaged ${c.name} comes in, stops in its box, is repaired and goes back out`, /enter>box>repair>done>exit/.test(seq) && c.repairN === 1 && s.stopAt != null && Math.abs(s.stopAt - c.pitBox) < 7,
      `${seq || 'no stop'}; stopped ${s.stopAt == null ? '-' : s.stopAt.toFixed(1)} m (box ${c.pitBox}), ${s.lat == null ? '' : (s.lat > 0 ? 'working' : 'fast') + ' lane ' + s.lat.toFixed(1) + ' m'}, repairs ${c.repairN || 0}`);
  }
  check(`${key}: no contact in the pit lane`, !hits.length, hits.slice(0, 4).join('; '));
  const last = [...st.entries()].filter(([c, s]) => s.calledLast).map(([c]) => c.name);
  check(`${key}: nobody comes in on the last lap`, !last.length, last.join(', '));
  check(`${key}: every car finishes`, R.r.cars.every(c => c.finished), `${R.r.cars.filter(c => c.finished).length}/${R.r.cars.length} after ${R.t.toFixed(0)} s`);
}

// damage only for show (damage: 1): a battered car does not come in
{ const R = race('gozd', 'cs', [2, 7], { damage: 1 });
  const stops = R.ai.filter(c => c.repairN || st0(R, c)).map(c => c.name);
  check('damage only for show: nobody comes in', !stops.length, stops.join(', ')); }
function st0(R, c) { return R.st.get(c).ev.length > 0; }

// five cars at once on Suzuka, two of them in neighbouring boxes: all come in and are repaired, no contact
{ const R = race('suzuka', 'cs', [0, 1, 4, 5, 9]), cars = [0, 1, 4, 5, 9].map(k => R.ai[k]);
  const nb = cars.some(a => cars.some(b => a !== b && Math.abs(a.pitBox - b.pitBox) === 10));
  check('Suzuka, five cars in at once (neighbouring boxes among them): all repaired once', nb && cars.every(c => c.repairN === 1), cars.map(c => `${c.name} box ${c.pitBox} repairs ${c.repairN || 0}`).join(', '));
  check('Suzuka, five cars in at once: no contact in the pit lane, every car finishes', !R.hits.length && R.r.cars.every(c => c.finished), R.hits.slice(0, 4).join('; ') || `${R.r.cars.filter(c => c.finished).length}/${R.r.cars.length} finished`); }

console.log(bad ? `FAIL: ${bad} of ${n} checks (${((Date.now() - t0) / 1000).toFixed(0)} s)` : `OK: all ${n} checks (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
process.exit(bad ? 1 : 0);
