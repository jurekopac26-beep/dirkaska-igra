// The driving school's parking lot (js/tracks/parkirisce.js, school: true) and its ten missions (Core.Lesson). The lot: a ground of the
// school, not a race track (Core.SCHOOL_TRACKS, not in TRACKS: no menu card, no championship, no race tests), named "Celje, Slovenija" with
// its English; one flat asphalt lot between its curbs (Track.lot: asphalt everywhere, the curbs its only limit, no wrong way, no laps), the
// parked cars in their bays solid (a car pushed out of them, the touch counted). The missions: ten, from the easiest to the hardest, each
// with its English, its medals in order and its limit; their cones, gates, boxes and starts inside the lot and clear of the parked cars,
// the bays they end in free. The instructor (Core.lessonPilot) drives every one of them through: no cone knocked, inside its gold time.
// The rules: a curb hit, a parked car touched, a gate or a slalom cone missed (beside it, straight over it), out of the lane, the time
// up; a figure of eight driven as an oval and a bay entered the wrong way round do not count; a cone knocked costs 2 s.
//   node tests/parkirisce.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.SCHOOL_TRACKS.find(d => d.id === 'parkirisce'), T = new C.Track(def), LS = def.lessons;
const pico = C.MODELS.find(m => m.id === 'pico');
const r1 = (v) => Math.round(v * 10) / 10;

// a mission run: the car on its start, its cones; drive(P, t, k) sets the pedals and the steering each step (or the instructor's run of
// path L2: Core.lessonPilot), the rules of L judge it. Returns { res, les, P, race }
function run(L, drive, L2, limit) {
  const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: pico, seed: 1, difficulty: 1, assist: 2, damage: 0, phys: 'cs', rain: 0 });
  const P = race.player; P.digitalSteer = false;
  C.Lesson.place(P, T, L); race.setProps(C.Lesson.props(L));
  const les = new C.Lesson(race, L), st = {};
  race.start();
  let res = null;
  for (let t = 0, k = 0; t < (limit || L.limit + 2) && !res; t += DT, k++) {
    if (drive) drive(P, t, k); else C.lessonPilot(P, L2 || L, st);
    race.step(DT); res = les.step();
  }
  return { res, les, P, race };
}

// 1. the lot: a ground of the school
check('the lot: a ground of the driving school (SCHOOL_TRACKS), not a race track (not in TRACKS, not in a championship)',
  !!def && def.school === true && !C.TRACKS.some(d => d.id === 'parkirisce') && !C.CHAMPS.some(c => c.tracks.includes('parkirisce')) && !def.test);
check('the lot: named "Kraj, Država" (Celje, Slovenija), its English (Celje, Slovenia) and description', def.name === 'Celje, Slovenija' && def.en.name === 'Celje, Slovenia' &&
  /parking lot/.test(def.en.desc) && /[čšž]/.test(def.desc) && !/[čšžČŠŽ]/.test(def.en.desc), `${def.name} / ${def.en.name}`);
{
  const q = T.query(0, 8, -1, {}), q2 = T.query(-65, -40, -1, {}), n2 = [0, 0];
  check('the lot: 140 x 84 m of asphalt (Track.lot), asphalt everywhere on it, its curbs the only limit (no barriers, no kerbs, no gravel)',
    T.lot && T.lot.join() === '-70,-42,70,42' && T.surface(q) === 0 && T.surface(q2) === 0 && T.lotPen(0, 8, 0, n2) < 0 && T.lotPen(71, 0, 0, n2) > 0.9 && n2[0] === -1 &&
    T.bl.every(v => v > 1000) && T.br.every(v => v > 1000) && !T.curb.some(Boolean));
}
{
  const B = T.parked, L = T.lot, ins = B.every(b => [[1, 1], [1, -1], [-1, 1], [-1, -1]].every(([u, v]) => { const x = b[0] + Math.cos(b[2]) * u * b[3] / 2 - Math.sin(b[2]) * v * b[4] / 2, z = b[1] + Math.sin(b[2]) * u * b[3] / 2 + Math.cos(b[2]) * v * b[4] / 2;
    return x > L[0] + 0.1 && x < L[2] - 0.1 && z > L[1] + 0.1 && z < L[3] - 0.1; }));
  let ov = 0; for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) if (Math.hypot(B[i][0] - B[j][0], B[i][1] - B[j][1]) < 2.5) ov++;
  check('the lot: its parked cars (4.3 x 1.8 m) in the bays, inside the lot, none on another', B.length > 50 && ins && !ov && B.every(b => b[3] === 4.3 && b[4] === 1.8), `${B.length} parked cars`);
}

// 2. the physics on the lot: the curb and a parked car stop a car; no wrong way, no laps
{
  const a = run(LS[0], (P) => { P.inThr = 1; P.inSteer = 0; }, null, 14);
  check('physics: full throttle across the lot into the east curb: stopped at it (never past it), the hit counted (the mission out: curb)',
    a.res && a.res.why === 'curb' && a.P.x < 70 && a.P.x > 60, `x ${r1(a.P.x)}, ${JSON.stringify(a.res)}`);
  const b = run(LS[6], (P) => { P.inThr = 0.08; P.inSteer = 0; }, null, 30);   // (from the aisle straight on: the east end of the aisle is the curb; no car in the way)
  const c = run(LS[6], (P, t) => { P.inThr = t < 4 ? 0.06 : 0; P.inBrk = 0; P.inSteer = t > 1.2 ? -1 : 0; }, null, 12);   // (into the row of parked cars on the left)
  check('physics: a parked car is solid (pushed out of it), its touch counted (the mission out: car); no wrong way on the lot, no laps',
    c.res && c.res.why === 'car' && c.P.wrongT === 0 && c.P.lapTimes.length === 0 && b.P.lapTimes.length === 0, `${JSON.stringify(c.res)}; z ${r1(c.P.z)}`);
}

// 3. the missions: ten, each complete, from the easiest to the hardest (each a skill more: the first ones in the open, then reversing,
// the slalom and the figure of eight, then the bays and the kerb, the final test all in one)
check('missions: ten, their ids unique, each with its English name and goal (no Slovenian letters in them)', LS.length === 10 && new Set(LS.map(L => L.id)).size === 10 &&
  LS.every(L => L.name && L.goal && L.en && L.en.name && L.en.goal && !/[čšžČŠŽ]/.test(L.en.name + L.en.goal)), LS.map(L => L.en.name).join(', '));
check('missions: their medals in order (gold < silver < bronze) under the limit; the start, the box and the cones inside the lot',
  LS.every(L => L.medals[0] < L.medals[1] && L.medals[1] < L.medals[2] && L.medals[2] < L.limit) &&
  LS.every(L => [L.start, L.zone, ...(L.cones || [])].every(p => p[0] > -69 && p[0] < 69 && p[1] > -41 && p[1] < 41)));
{
  const clear = (x, z, r) => T.parked.every(b => Math.hypot(b[0] - x, b[1] - z) > r);
  check('missions: no parked car on a start, in a box or on a cone (the bays they end in are free)', LS.every(L => clear(L.start[0], L.start[1], 3.2) && clear(L.zone[0], L.zone[1], 2.6) && (L.cones || []).every(c => clear(c[0], c[1], 2.4))));
  const skills = LS.map(L => (L.gates ? 'g' : '') + (L.around ? 'o' : '') + (L.slalom ? 's' : '') + (L.face != null ? 'f' : '') + (L.stay ? 'c' : ''));
  check('missions: from the easiest to the hardest: a stop, a turn through gates, round a cone, reversing in a lane, slalom, a figure of eight, the bays, the kerb, the final test',
    skills.join(',') === ',g,o,fc,s,o,f,f,f,gsf' && LS[5].eight && LS[9].limit === Math.max(...LS.map(L => L.limit)) && LS[9].medals[0] === Math.max(...LS.map(L => L.medals[0])), skills.join(','));
}

// 4. the instructor drives each mission through: no cone knocked, inside its gold time
{
  const out = LS.map(L => { const r = run(L); return { id: L.id, ok: !!(r.res && r.res.ok), v: r.res && r.res.v, cones: r.res ? r.res.cones : -1, why: r.res && r.res.why, gold: L.medals[0] }; });
  check('instructor: all ten missions done, no cone knocked, each inside its gold time', out.every(o => o.ok && o.cones === 0 && o.v <= o.gold - 0.3),
    out.map(o => `${o.id} ${o.ok ? r1(o.v) + '/' + o.gold : o.why}`).join(', '));
}

// 5. the rules
{
  const L2 = LS[1];   // a gate missed: past the first gate beside it (2 m north of its northern cone)
  const a = run(L2, null, Object.assign({}, L2, { demo: [[1, 7, ['C', -34, -15, -26, -19.3, -18, -19.3, -10, -14]]] }), 20);
  check('rules: past a gate beside its cones: out (gate)', a.res && a.res.why === 'gate', JSON.stringify(a.res));
  const L5 = LS[4];   // the slalom: straight over its cones; round the first on its wrong side
  const b = run(L5, (P) => { P.inThr = 0.05; P.inSteer = 0; }, null, 20);
  const c = run(L5, null, Object.assign({}, L5, { demo: [[1, 8, ['C', -45, 9, -36, 11, -28, 8, 40, 8]]] }), 20);
  check('rules: the slalom straight over its first cone, or round it on its wrong side: out (slalom)', b.res && b.res.why === 'slalom' && c.res && c.res.why === 'slalom', `${JSON.stringify(b.res)} ${JSON.stringify(c.res)}`);
  const L4 = LS[3];   // reversing down the lane with the tail swinging into the cones: knocked, then out of the lane
  const d = run(L4, null, Object.assign({}, L4, { demo: [[-1, 3, ['A', 25, -40]]] }), 30);
  check('rules: reversing into the cones and out of the lane: the cones counted, out (stay)', d.res && d.res.why === 'stay' && d.les.knocked >= 1, `${JSON.stringify(d.res)}`);
  const e = run(LS[0], (P) => { P.inThr = 0; }, null, 70);
  check('rules: standing still: the time runs out (time)', e.res && e.res.why === 'time' && e.res.cones === 0);
  const L6 = LS[5];   // the figure of eight as an oval round both cones, back into the box: does not count
  const f = run(L6, null, Object.assign({}, L6, { demo: [[1, 7, ['C', 2, 0, 12, -3, 20, 2, 21, 12, 12, 18, 0, 18, -12, 18, -21, 12, -20, 2, -12, -3, -3, 0, 0, 0]], [-1, 2, ['L', 8]]] }), 60);
  check('rules: a figure of eight driven as an oval round both cones (both loops the same way): no finish in the box', !f.res && f.les.need === 'around' && f.les.sweep.every(s => s > 4.5), `sweeps ${f.les.sweep.map(s => Math.round(s * 57.3)).join(', ')}`);
  const L8 = LS[7];   // the bay for reversing into, entered nose first: in the bay, standing, but the wrong way round
  const g = run(L8, null, Object.assign({}, L8, { demo: [[1, 4, ['L', 18.4], ['A', 4.6, -90], ['L', 1.65]]] }), 40);
  check('rules: the bay for reversing into entered nose first: inside it, standing, no finish (the wrong way round)', !g.res && g.les.inZone && g.P.speed < 0.1, `h ${Math.round(g.P.h * 57.3)}`);
  const L7 = LS[6], h = run(Object.assign({}, L7, { cones: [[5, -33.25]] }));   // a cone in its way: knocked, 2 s
  const h0 = run(L7);
  check('rules: a cone knocked on the way costs 2 s', h.res && h.res.ok && h.res.cones === 1 && Math.abs(h.res.v - h.res.t - 2) < 1e-9 && Math.abs(h.res.t - h0.res.t) < 1.5, `${JSON.stringify(h.res)}`);
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
