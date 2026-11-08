// The grid of the game's bigger fields (no browser): a Circuit race has 21 rivals (22 cars) on every real circuit and on every open road
// with a race (Pikes Peak and its gravel road too: there only ~40 m of road below the line, so the field stands in rows abreast, Race
// _gridWide), the Nordschleife's 99 (100 cars, its flying start) and a championship round's 19 (20 cars). Every car of the field on its
// slot: no two cars on each other (their boxes, length x width, turned with the road), every car on the asphalt, all behind the start line;
// with the game's car and its field, in the formula (the longest field, 5.2 m) and in the prototype. A field of 13 keeps the grid it always
// had (the golden references): the two staggered columns. Then the finish parking past the line of an open road: the slots for the whole
// field (22 cars), none past the end of the road, none on another (Pikes Peak's summit: two rows a side); and the career's prize for a
// big field by the place (the first 13 as the table); the semi-trailers' grids (the TITAN CISTERNA: no tractor or trailer on another, the
// title demo's respawn). Test tracks (def.test) are left out.
//   node tests/grid.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const model = (id) => C.MODELS.find(m => m.id === id);
const REAL = C.TRACKS.filter(d => !d.test);
const raced = (d) => !d.timeTrial || (d.modes || []).indexOf('race') >= 0;   // (a track with a race: not a time trial alone)
const tracks = REAL.filter(raced);

// two cars' boxes (centre, heading, length, width): overlapping? (separating axes)
function overlap(a, b) {
  const box = (c) => { const ch = Math.cos(c.h), sh = Math.sin(c.h); return { x: c.x, z: c.z, u: [ch, sh], v: [-sh, ch], l: c.m.len / 2, w: c.m.wid / 2 }; };
  const A = box(a), B = box(b), dx = B.x - A.x, dz = B.z - A.z;
  for (const ax of [A.u, A.v, B.u, B.v]) {
    const r = (o) => o.l * Math.abs(o.u[0] * ax[0] + o.u[1] * ax[1]) + o.w * Math.abs(o.v[0] * ax[0] + o.v[1] * ax[1]);
    if (Math.abs(dx * ax[0] + dz * ax[1]) > r(A) + r(B)) return false;
  }
  return true;
}
// a race's grid: how many cars, pairs on each other, cars off the asphalt (its edge: the box's corner farther out than the road's half width),
// any not behind the line, the closest two (centres)
function grid(T, opts) {
  const r = new C.Race(T, Object.assign({ playerGrid: 99, laps: 1, assist: 2, phys: 'cs', seed: 11, difficulty: 1, tt: false, playerNum: (opts.playerModel && opts.playerModel.num) || 1 }, opts)), cars = r.cars;
  let pairs = 0, minD = Infinity; const off = [];
  for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) { const a = cars[i], b = cars[j]; minD = Math.min(minD, Math.hypot(a.x - b.x, a.z - b.z)); if (overlap(a, b)) pairs++; }
  for (const c of cars) { const q = T.query(c.x, c.z, c.q.i, {}), half = Math.abs(q.d) + c.m.wid / 2; if (half > T.wAt(q.i >= 0 ? q.i : T.idx(q.s)) - 0.2) off.push(c.grid); }
  return { r, n: cars.length, pairs, off, behind: cars.every(c => c.dist < 0), minD, back: Math.max(...cars.map(c => -c.dist)) };
}

// 1. 22 cars on every real track with a race (the game's car, the formula's field, the prototypes'); 20 in a championship round
{
  const fails = [], notes = [];
  for (const d of tracks) {
    const T = new C.Track(d);
    for (const pm of ['kaze', 'formula', 'lm']) {
      const g = grid(T, { numAI: 21, playerModel: model(pm), flying: d.open ? 15 : 0 });
      if (g.n !== 22 || g.pairs || g.off.length || !g.behind) fails.push(`${d.id}/${pm}: ${g.n} cars, ${g.pairs} on each other, off ${g.off.join(',') || '-'}${g.behind ? '' : ', not behind the line'}`);
      if (pm === 'formula') notes.push(`${d.id} ${g.back.toFixed(0)} m${g.r._gridWide() ? ' (' + g.r._gridWide().K + ' abreast)' : ''}`);
    }
  }
  check(`a Circuit race: 22 cars on the grid of every real track with a race (${tracks.length}), none on another, all on the asphalt behind the line`, !fails.length, fails.join(' | ') || notes.join(', '));
  const fc = [];
  for (const d of tracks) { const T = new C.Track(d), g = grid(T, { numAI: 19, champ: true, playerModel: model('formula') }); if (g.n !== 20 || g.pairs || g.off.length) fc.push(`${d.id}: ${g.n} cars, ${g.pairs} on each other, off ${g.off.join(',') || '-'}`); }
  check('a championship round: 20 cars (opts.champ: the track\'s own field size not applied), none on another, all on the asphalt', !fc.length, fc.join(' | '));
}

// 2. Pikes Peak (and its gravel road): 22 cars in rows abreast below the line (~40 m of road), as wide as the road takes; 13 the two columns
{
  for (const id of ['pikes', 'pikesg']) {
    const d = C.TRACKS.find(t => t.id === id); if (!d) continue;
    const T = new C.Track(d), g = grid(T, { numAI: 21, tt: false, playerModel: model('formula'), flying: 15 }), W = g.r._gridWide(), g13 = grid(T, { numAI: 12, tt: false, playerModel: model('kaze') });
    check(`${id}: 22 cars in rows abreast (Race _gridWide) within the road below the line, 13 in the two staggered columns as ever`,
      !!W && W.K >= 3 && W.d >= 6 && g.back <= T.startS - 4 + 1e-9 && !g.pairs && !g.off.length && !g13.r._gridWide() && new Set(g13.r.cars.map(c => Math.sign(T.query(c.x, c.z, c.q.i, {}).d))).size === 2,
      W ? `${W.K} abreast, ${W.cs} m apart, rows ${W.d.toFixed(2)} m apart, the last ${g.back.toFixed(1)} m behind the line (road below it ${T.startS.toFixed(1)} m); closest centres ${g.minD.toFixed(1)} m` : 'no rows');
  }
}

// 3. the Nordschleife's Circuit race: 100 cars (the game's 99 rivals, def.raceRivals, more than the track's own def.rivals: Race keeps the bigger
// field), every one on its slot, the last ~750 m behind the line; a round of a championship there its own 20
{
  const d = C.TRACKS.find(t => t.id === 'nring'), T = new C.Track(d);
  const g = grid(T, { numAI: d.raceRivals, playerModel: model('kaze'), flying: 15 }), g12 = grid(T, { numAI: 12, playerModel: model('kaze') }), gc = grid(T, { numAI: 19, champ: true, playerModel: model('kaze') });
  check('Nordschleife: def.raceRivals 99 with a flying start (def.flyStart), def.rivals 20 kept (Core\'s own field size there, the tests\' races)', d.raceRivals === 99 && d.flyStart === true && d.rivals === 20 && !d.open);
  check('Nordschleife: 100 cars on the grid (none on another, all on the asphalt behind the line); numAI 12 still gives its 21, a championship round 20',
    g.n === 100 && !g.pairs && !g.off.length && g.behind && g12.n === 21 && gc.n === 20, `the last ${g.back.toFixed(1)} m behind the line, closest centres ${g.minD.toFixed(1)} m; ${g12.n} / ${gc.n} cars`);
  const names = new Set(g.r.cars.filter(c => !c.isPlayer).map(c => c.name)), nums = new Set(g.r.cars.map(c => c.num)), cols = g.r.cars.filter(c => !c.isPlayer).map(c => c.color);
  check('Nordschleife: 99 drivers of their own (names), 100 numbers (1..100), no two cars next to each other on the grid in the same colour',
    names.size === 99 && nums.size === 100 && Math.min(...nums) === 1 && Math.max(...nums) === 100 && cols.every((c, i) => !i || c !== cols[i - 1]), `${names.size} names, ${nums.size} numbers, ${new Set(cols).size} colours`);
}

// 4. the rosters: every driver a name, a surname (the commentator), a three-letter code (the timing tower) and a championship key of its own;
// a character and a colour each; the first 20 as they always were
{
  const N = C.DRIVER_NAMES, code = (s) => (String(s).split(/[\s.]+/).filter(Boolean).pop() || '?').slice(0, 3).toUpperCase(), sur = (s) => String(s).split(/\s+/).pop();
  const uniq = (a) => new Set(a).size === a.length, keys = C.champKeys(99);
  check('rosters: 99 drivers or more, names, surnames, tower codes and championship keys (champKeys(99)) all different',
    N.length >= 99 && uniq(N) && uniq(N.map(sur)) && uniq(N.map(code)) && uniq(keys) && keys.length === 100, `${N.length} drivers`);
  check('rosters: the first 20 as they were (M. Kovač first, V. Andersen 20th), every driver of 99 a character of its own range', N[0] === 'M. Kovač' && N[19] === 'V. Andersen' &&
    Array.from({ length: 99 }, (_, k) => C.driverChar(k)).every(c => c.agg >= 0 && c.agg <= 1 && c.err >= 0 && c.err <= 1));
}

// 5. the finish past the line of an open road: a slot of its own for every car of 22, none past the end of the road (T.len - 20), no two
// slots on each other (closer along the road than the field's longest car and across it than its widest: Pikes Peak's summit, two rows a
// side), with the game's car and the formula's field (5.2 m); 13 cars as ever (9 m apart from 70 m past the line where the road is long enough)
{
  const fails = [], rows = [];
  for (const d of tracks.filter(t => t.open)) for (const pm of [null, 'formula']) {
    const T = new C.Track(d), r = new C.Race(T, Object.assign({ numAI: 21, playerGrid: 99, laps: 1, tt: false, phys: 'cs', seed: 3 }, pm ? { playerModel: model(pm) } : {}));
    r.start(); r.time = 300;
    for (const c of r.cars) { c.cp = T.cpS.length; c.dist = T.raceLen + 1; r._progressOpen(c, { s: T.finishS + 1 }, 1, 1 / 120); }   // (each over the line in turn: Race's own finish, its place's slot)
    const F = r.finishOrder, S = F.map(c => c.parkS), past = S.filter(s => s > T.len - 20 - 0.5).length > 1, L = Math.max(...r.cars.map(c => c.m.len)), W = Math.max(...r.cars.map(c => c.m.wid));
    let on = 0, near = 99; for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) { const ds = Math.abs(F[i].parkS - F[j].parkS), dd = Math.abs(F[i].parkD - F[j].parkD); if (ds < L + 0.3 && dd < W + 0.3) on++; if (dd < W + 0.3) near = Math.min(near, ds); }
    const offRoad = F.filter(c => { const i = T.idx(c.parkS); return Math.abs(c.parkD) + c.m.wid / 2 > Math.min(c.parkD > 0 ? T.br[i] : T.bl[i], T.wAt(i) + 3) - 0.3; }).length;   // (short of the barrier, at most 3 m off the asphalt)
    if (S.length !== 22 || past) fails.push(`${d.id}${pm ? ' ' + pm : ''}: ${S.length} at the finish, ${S.filter(s => s > T.len - 20 - 0.5).length} at the end of the road`);
    else if (on || offRoad) fails.push(`${d.id}${pm ? ' ' + pm : ''}: ${on} pairs of slots on each other (a ${L} m car; the nearest in a row ${near.toFixed(1)} m apart), ${offRoad} by the barrier`);
    if (near < 9.5) rows.push(`${d.id}${pm ? ' ' + pm : ''} ${near.toFixed(1)} m${new Set(F.map(c => Math.abs(c.parkD).toFixed(1))).size > 1 ? ' (two rows)' : ''}`);
  }
  check('open roads: the finish parking has a slot for each of 22 cars, none past the end of the road, none on another (the field\'s longest car along the road, its widest across), none by the barrier', !fails.length, fails.join(' | ') || rows.join(', '));
}

// 6. the career's prize: a field of 13 or fewer as ever (the table spread over the places); more: by the place (13th and later 750 coins)
{
  const d = 8000, P = C.CAREER.place, own = [1, 2, 3, 12, 13, 14, 22].map(p => C.careerPrize(p, 22, d, 1)), big = [1, 5, 13, 50, 100].map(p => C.careerPrize(p, 100, d, 1));
  check('career prize: 22 or 100 cars pay by the place (15000, 11250, 8750 … from the 13th 750 coins), 13 cars as the table, 7 cars spread over it',
    own.join() === [P[0], P[1], P[2], P[11], P[12], P[12], P[12]].join() && big.join() === [P[0], P[4], P[12], P[12], P[12]].join() &&
    Array.from({ length: 13 }, (_, i) => C.careerPrize(i + 1, 13, d, 1)).join() === P.join() && C.careerPrize(7, 7, d, 1) === P[12] && C.careerPrize(2, 7, d, 1) === P[2],
    `22 cars: ${own.join(' ')} · 100 cars: ${big.join(' ')}`);
}
// 6b. the prize grows with the value of the car raced (sklop 6 of the garage): x the square root of its price over 50.000, 1 to 5 times
{
  const d = 8000, P = C.CAREER.place, k = (id) => C.careerCarK(id);
  check('career prize: by the car\'s value (a PICO or anything under 50.000 as the table, a FORMULA x' + k('formula').toFixed(2) + ', never over 5x)',
    C.careerPrize(1, 13, d, 1, 'pico') === P[0] && C.careerPrize(1, 13, d, 1, 'mravlja') === P[0] && Math.abs(k('formula') - Math.sqrt(C.CAREER.car.formula / 50000)) < 1e-9 &&
    C.careerPrize(1, 13, d, 1, 'formula') === Math.round(P[0] * k('formula') / 50) * 50 && C.MODELS.every(M => k(M.id) >= 1 && k(M.id) <= 5),
    `formula ${C.careerPrize(1, 13, d, 1, 'formula')} · truck ${C.careerPrize(1, 13, d, 1, 'truck')}`);
}

// 7. semi-trailers (the TITAN CISTERNA, model.trailer: its tail 13.3 m behind the tractor's middle): a race of rigs on every real track with a
// race (its own field: fieldN 5 rivals), up an open road its flying start too, the title demo's field of rigs and a room of 4 phones (rigs and
// a car): no two bodies (tractors and trailers) on each other, every corner of each on the asphalt, up an open road none below the bottom end
// of the road (its wall 0.5 m in), all behind the line (the flying start: the race already under way). The title demo up an open road puts a
// rig back at the start (Race._serveRespawn, _tlFree) clear of the others, its trailer too
{
  const CI = model('cisterna'), S = require('./lib/sim.js'), fails = [], notes = [];
  const base = { playerGrid: 99, laps: 1, assist: 2, phys: 'cs', seed: 11, difficulty: 1, tt: false };
  const look = (T, r, only) => {   // (only: that car's bodies against all the others)
    const B = []; for (const c of r.cars) { B.push([c, c]); if (c.tl && !c.tl.fall) B.push([c, c.tl]); }
    let pairs = 0, off = 0, low = 0;
    for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) if (B[i][0] !== B[j][0] && (!only || B[i][0] === only || B[j][0] === only) && overlap(B[i][1], B[j][1])) pairs++;
    for (const [c, b] of B) {
      if (only && c !== only) continue;
      const ch = Math.cos(b.h), sh = Math.sin(b.h), l = b.m.len / 2, w = b.m.wid / 2;
      for (const [p, q] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const Q = T.query(b.x + ch * l * p - sh * w * q, b.z + sh * l * p + ch * w * q, -1, {}); if (Math.abs(Q.d) > T.wAt(Q.i) - 0.05) off++; if (T.open && Q.s < 0.5) low++; }
    }
    return { pairs, off, low };
  };
  const rem = (n) => Array.from({ length: n }, (_, k) => ({ model: k === 1 ? model('kaze') : CI, color: 0xff0000, num: 40 + k, name: 'F' + k, grid: 2 + k, id: 'f' + k }));
  let rigs = 0;
  for (const d of tracks) {
    const T = new C.Track(d), runs = [['race', { numAI: 21, playerModel: CI }], ['online', { numAI: 0, playerGrid: 1, playerModel: CI, remote: rem(3) }], ['demo', { numAI: 10, noPlayer: true, fieldModel: CI, difficulty: 2, laps: 9999 }]];
    if (d.open) runs.push(['flying', { numAI: 21, playerModel: CI, flying: 15 }]);
    for (const [k, o] of runs) {
      const r = new C.Race(T, Object.assign({}, base, o)); if (k === 'flying') r.start();
      const g = look(T, r), behind = k === 'flying' || r.cars.every(c => c.dist < 0), tl = r.cars.filter(c => c.tl).length;
      rigs += tl;
      if (g.pairs || g.off || g.low || !behind || tl < r.cars.length - (k === 'online' ? 1 : 0)) fails.push(`${d.id}/${k}: ${r.cars.length} cars (${tl} rigs), ${g.pairs} on each other, ${g.off} corners off the asphalt, ${g.low} below the road's end${behind ? '' : ', not behind the line'}`);
      if (k === 'race' && d.open) notes.push(Math.max(...r.cars.map(c => -c.dist + c.m.len / 2 + (c.tl ? c.tl.back : 0))));   // (the last tail behind the line)
    }
    if (d.open) {   // the title demo: its leader put back at the start once there is room for it
      const r = new C.Race(T, Object.assign({}, base, { numAI: 10, noPlayer: true, fieldModel: CI, difficulty: 2, laps: 9999 }));
      r.start(); let k = 0;
      for (; k < 6 / S.DT; k++) S.stepRace(C, r, k);
      const c = r.cars.reduce((a, b) => b.dist > a.dist ? b : a); r._queueRespawn(c);
      while (c.parkQ && k < 40 / S.DT) S.stepRace(C, r, k++);
      const g = look(T, r, c);
      if (c.parkQ || g.pairs || g.off || g.low) fails.push(`${d.id}/respawn: ${c.parkQ ? 'not put back in 34 s' : `${g.pairs} on another, ${g.off} corners off the asphalt, ${g.low} below the road's end`}`);
    }
  }
  check(`semi-trailers: a race of rigs on the grid of every real track with a race (${tracks.length}), the flying start, the title demo, a room of 4 phones — no tractor or trailer on another, all on the asphalt, none below the road's end, behind the line; the demo's respawn clear of the others`, !fails.length && rigs > 0, fails.join(' | ') || `${rigs} rigs; up an open road the last tail ${Math.min(...notes).toFixed(0)}–${Math.max(...notes).toFixed(0)} m behind the line`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
