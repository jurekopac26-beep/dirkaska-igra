// The places of the people's scenes (js/world-ljudje.js SITES, js/world-ljudje2.js site()), on every track, without a browser:
// 1. only on the real tracks (the test ones have none), each on a track and within its length, its side -1 or 1
// 2. no scene on a side road: its ground (12 m either way along the road, 1-13 m past the barrier, where tools/ljudje/mesta.mjs measures it)
//    at least 2 m from every side road's edge (Track.stubs): a car may drive into one, the police waits in it, and a scene's things and
//    people have no collision; nor on a town's street or path (def.roads, def.paths: its half width and 0.6 m)
// 3. not in the pit lane on its side (def.pit: the pit wall's scene is the boksi, its own)
// 4. apart: the fans' scenes at least 250 m from each other (the camera sees one group at a time; mesta.mjs places them 260 m apart), the
//    staff's (STAFF_SCENES: marshals, firemen, the track's crews …) at least 100 m from any other (by the marshals' posts, as on a circuit)
//   node tests/ljudje-mesta.test.js
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const { loadCore } = require('./lib/core.js');

const C = loadCore(), ROOT = path.join(__dirname, '..');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

// the people's kit as the game loads it (three, the kit, its second file), only to read the places
const ctx = { console, performance: require('perf_hooks').performance, setTimeout, clearTimeout };
ctx.self = ctx; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/vendor/three.r128.min.js'), 'utf8'), ctx);
ctx.World = {}; ctx.Tex = { STAND_KIT: new Proxy({}, { get: () => [0, 0, 1, 1] }), standKit: () => null, crowdSeats: () => null };
for (const f of ['js/world-ljudje.js', 'js/world-ljudje2.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const SITES = ctx.World.peopleKit.SITES, STAFF = ctx.World.peopleKit.STAFF_SCENES, ids = Object.keys(SITES).sort(), all = ids.reduce((a, id) => a + SITES[id].length, 0);

// 1. the tracks
const defs = new Map(C.TRACKS.map(d => [d.id, d])), unknown = ids.filter(id => !defs.has(id)), test = ids.filter(id => defs.has(id) && defs.get(id).test);
check(`${all} places on ${ids.length} tracks, all real ones (none on a test track, none on a track the game does not have)`, all > 150 && !unknown.length && !test.length,
  (unknown.length ? 'unknown: ' + unknown.join(', ') + '; ' : '') + (test.length ? 'test: ' + test.join(', ') : ''));

const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L2)); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
const onRoad = [], onStreet = [], inPit = [], close = [], badPlace = [];
for (const id of ids) {
  const def = defs.get(id); if (!def) continue;
  const T = new C.Track(def), L = T.len, list = SITES[id];
  // the town's streets and paths as lines (Medvode's [w, gravel, ., ., [x, z, ...]]; Longford's [w, [x, z], [x, z] ...])
  const lines = []; for (const r of [].concat(Array.isArray(def.roads) ? def.roads : [], Array.isArray(def.paths) ? def.paths : [])) {
    if (Array.isArray(r[4]) && typeof r[4][0] === 'number') lines.push([r[0], r[4]]); else if (Array.isArray(r[1]) && r[1].length === 2) lines.push([r[0], [].concat(...r.slice(1))]); }
  for (const [kind, m, sd] of list) {
    if (!(m >= 0 && m <= L + 1) || Math.abs(sd) !== 1) { badPlace.push(`${id} ${kind} ${m}:${sd}`); continue; }
    const s = (T.startS || 0) + m, i = T.idx(((s % L) + L) % L), bar = sd > 0 ? T.br[i] : T.bl[i];
    let road = 1e9, street = 1e9;
    for (let a = -12; a <= 12; a += 3) for (let b = 1; b <= 13; b += 3) {
      const x = T.px[i] + T.tx[i] * a + T.nx[i] * sd * (bar + b), z = T.pz[i] + T.tz[i] * a + T.nz[i] * sd * (bar + b);
      for (const St of T.stubs || []) for (let j = 0; j < St.n; j++) road = Math.min(road, Math.hypot(St.x[j] - x, St.z[j] - z) - St.hw);
      for (const [w, P] of lines) for (let k = 0; k + 3 < P.length; k += 2) street = Math.min(street, segD(x, z, P[k], P[k + 1], P[k + 2], P[k + 3]) - w / 2 - 0.6);
    }
    if (road < 2) onRoad.push(`${id} ${kind} ${m}:${sd} (${road.toFixed(1)} m)`);
    if (street < 1) onStreet.push(`${id} ${kind} ${m}:${sd} (${street.toFixed(1)} m)`);
    const PL = def.pit, inL = (x) => PL && x >= PL[1] - 40 && x <= PL[2] + 40;
    if (kind !== 'boksi' && PL && sd === Math.sign(PL[0]) && (inL(m) || (!T.open && (inL(m - L) || inL(m + L))))) inPit.push(`${id} ${kind} ${m}:${sd}`);
  }
  for (let p = 0; p < list.length; p++) for (let q = p + 1; q < list.length; q++) {
    let d = Math.abs(list[p][1] - list[q][1]); if (!T.open) d = Math.min(d, L - d);
    const fans = !STAFF.has(list[p][0]) && !STAFF.has(list[q][0]);
    if (d < (fans ? 250 : 100)) close.push(`${id} ${list[p][0]} ${list[p][1]} ~ ${list[q][0]} ${list[q][1]} (${Math.round(d)} m)`);
  }
}
check('every place on its track: within its length, its side -1 or 1', !badPlace.length, badPlace.join('; '));
// 2. the side roads, the streets
check('no scene on a side road (its ground at least 2 m from every side road\'s edge: a car may drive in, the police waits there)', !onRoad.length, onRoad.join('; '));
check('no scene on a town\'s street or path', !onStreet.length, onStreet.join('; '));
// 3. the pit lane
check('no scene in the pit lane on its side (the pit wall has its own)', !inPit.length, inPit.join('; '));
// 4. apart
check('apart: the fans\' scenes at least 250 m from each other, the staff\'s at least 100 m from any other', !!STAFF && !close.length, close.join('; '));

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
