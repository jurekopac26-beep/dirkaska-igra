// Bang Saen, Thailand: the street circuit of the seaside town on the Gulf of Thailand (a circuit: races in laps and the time trial). The track:
// its real scale (the OpenStreetMap roads: 3.58 km against the official 3.74 km, whose temporary chicanes are not in the open data), the race
// direction anticlockwise, the five corners of its roads in order and in their direction (Turn 1 left into the soi, the right kink and the
// left onto Bang Saen Sai 2 at the Khao Lam junction, the hairpin under Khao Sam Muk, the long left by Laem Thaen), the pit lane on the beach
// side of the beach road (between the track and the sea), the junctions the track meets (their mouths inside the barriers, the side streets
// closed further in), 4 laps for a race of 12-15 km; whole races with the AI in the dry and in the rain (every car finishes, the rain slower);
// the street furniture of the junctions (Core's loose props: a traffic light, a sign, a bollard, a bin, a hydrant, a cabinet, a lamp): a car
// knocks each over and drives on, only a little slower and barely damaged.
//   node tests/bangsaen.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'bangsaen'), T = new C.Track(def);
const sOf = (x, z) => { const d = T.nearestIdx(x, z) * T.ds - T.startS; return ((d % T.len) + T.len) % T.len; };
const turnAt = (d, r) => { let a = 0; for (let e = -r; e <= r; e += T.ds) a += T.k[T.idx(T.startS + d + e)] * T.ds; return a; };   // (the angle turned within +-r m: + right, - left)

// 1. the track: name, kind, length, direction, laps
check('track: "Bang Saen, Tajska" (English "Bang Saen, Thailand"), a closed circuit (races in laps, the time trial), its own theme',
  def.name === 'Bang Saen, Tajska' && def.en.name === 'Bang Saen, Thailand' && !def.open && !def.timeTrial && def.theme === 'bangsaen', `${def.name} / ${def.en.name}, theme ${def.theme}`);
check('track: the real scale (3.5-3.65 km of the OpenStreetMap roads, within 5 % of the official 3.74 km: its temporary chicanes are not in the open data)',
  T.len > 3500 && T.len < 3650 && Math.abs(T.len / 1000 - def.realKm) / def.realKm < 0.05, `${T.len.toFixed(0)} m, official ${def.realKm} km, ${(100 * (T.len / 1000 - def.realKm) / def.realKm).toFixed(1)} %`);
{ let a = 0; for (let i = 0; i < T.N; i++) a += T.k[i] * T.ds;
  check('track: driven anticlockwise (the turns add up to one full turn to the left)', Math.abs(a + 2 * Math.PI) < 0.3, `${(a * 180 / Math.PI).toFixed(0)}°`); }
check('track: 4 laps, a race of 12-15 km', def.laps === 4 && def.laps * T.len > 12000 && def.laps * T.len < 15000, `${def.laps} × ${(T.len / 1000).toFixed(2)} km = ${(def.laps * T.len / 1000).toFixed(1)} km`);
check('track: flat as the town by the sea (under 5 m between its lowest and highest point)', (() => { let lo = 1e9, hi = -1e9; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); } return hi - lo < 5; })());

// 2. the corners in order and in their direction
{
  const ds = def.turns.map(([x, z]) => sOf(x, z)), dir = ds.map((d, k) => turnAt(d, [25, 8, 25, 25, 60][k])), want = [-1, 1, -1, -1, -1];   // (the kink of Turn 2 lies 26 m before Turn 3)
  check('corners: five numbered turns in lap order', ds.length === 5 && ds.every((d, k) => !k || d > ds[k - 1]), ds.map(d => d.toFixed(0) + ' m').join(', '));
  check('corners: Turn 1 left, Turn 2 a right kink, Turn 3 left onto Sai 2, Turn 4 (the hairpin) left, Turn 5 (Laem Thaen) left', dir.every((a, k) => Math.sign(a) === want[k]),
    dir.map(a => (a * 180 / Math.PI).toFixed(0) + '°').join(', '));
  const hp = turnAt(ds[3], 40), r4 = Math.min(...Array.from({ length: 40 }, (_, e) => 1 / Math.max(1e-5, Math.abs(T.k[T.idx(T.startS + ds[3] - 20 + e)]))));
  check('corners: the hairpin under Khao Sam Muk turns more than 100°, tight (radius under 20 m); Turn 1 and Turn 3 sharp street corners (70-130°)',
    Math.abs(hp) > 100 * Math.PI / 180 && r4 < 20 && [0, 2].every(k => { const a = Math.abs(turnAt(ds[k], 40)) * 180 / Math.PI; return a > 70 && a < 130; }),
    `hairpin ${(hp * 180 / Math.PI).toFixed(0)}°, radius ${r4.toFixed(1)} m; T1 ${(turnAt(ds[0], 40) * 180 / Math.PI).toFixed(0)}°, T3 ${(turnAt(ds[2], 40) * 180 / Math.PI).toFixed(0)}°`);
  check('corners: the long straights (the beach road, 1.3 km to Turn 1 past the start; Bang Saen Sai 2, ~1.5 km)', ds[3] - ds[2] > 1400 && (T.len - ds[4]) + ds[0] > 1100, `Sai 2 ${(ds[3] - ds[2]).toFixed(0)} m, beach road ${((T.len - ds[4]) + ds[0]).toFixed(0)} m`);
  const names = T.names.map(q => q.n);
  check('places on the HUD in lap order, only geographic names', names.join('|') === 'Zavoj 1|Zavoj 3 · Khao Lam|Bang Saen Sai 2|Lasnica · Khao Sam Muk|Laem Thaen|Hat Bang Saen', names.join(', '));
}

// 3. the pits: on the beach side of the beach road, between the track and the sea
{
  const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', ints = (s) => { const o = []; let u = 0, sh = 0; for (const ch of s) { const c = A64.indexOf(ch); u += (c & 31) * 2 ** sh; sh += 5; if (!(c & 32)) { o.push(u % 2 ? -(u + 1) / 2 : u / 2); u = 0; sh = 0; } } return o; };
  const c = ints(def.bs.coast), coast = []; for (let k = 0, x = 0, z = 0; k < c.length; k += 2) { x += c[k]; z += c[k + 1]; coast.push([x / 2, z / 2]); }
  const dCoast = (x, z) => { let b = 1e9; for (let k = 0; k + 1 < coast.length; k++) { const [ax, az] = coast[k], vx = coast[k + 1][0] - ax, vz = coast[k + 1][1] - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1))); b = Math.min(b, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return b; };
  const P = def.pit, mid = (P[1] + P[2]) / 2, i = T.idx(T.startS + mid), p = T.pitAt(T.startS + mid), lx = T.px[i] + T.nx[i] * p.o, lz = T.pz[i] + T.nz[i] * p.o;
  check('pits: a pit lane along the start straight (the beach road), 400 m, the player\'s box in it', P && P[2] - P[1] >= 380 && p && T.pitAt(T.startS + P[3]), `${P[1]} to ${P[2]} m, box at ${P[3]} m`);
  check('pits: on the beach side, between the track and the Gulf (the pit lane nearer the sea than the track, the sea within 80 m)', dCoast(lx, lz) < dCoast(T.px[i], T.pz[i]) - 8 && dCoast(T.px[i], T.pz[i]) < 80,
    `track ${dCoast(T.px[i], T.pz[i]).toFixed(0)} m from the sea, the pit lane ${dCoast(lx, lz).toFixed(0)} m`);
}

// 4. the junctions: the side streets' mouths inside the barriers (the street furniture stands there), the barriers close to the road elsewhere
{
  const J = def.bs.jn.filter(j => j[4] === 2), S = def.bs.jn.filter(j => j[4] === 1);
  const mouth = (j) => { const i = T.idx(T.startS + j[0]); return (j[1] > 0 ? T.br[i] : T.bl[i]) - T.w; };
  check('junctions: at least six with traffic lights and eight sois the track meets, their mouths inside the barriers (4 m and more; the big junctions and the escape roads at Turn 1 and the hairpin 12 m and more)',
    J.length >= 6 && S.length >= 8 && J.every(j => mouth(j) >= 4) && J.filter(j => mouth(j) >= 12).length >= 4 && S.every(j => mouth(j) >= 4), `${J.length} with lights (${J.map(j => mouth(j).toFixed(0)).join(', ')} m), ${S.length} sois (${S.map(j => mouth(j).toFixed(0)).join(', ')} m)`);
  let near = 0, cnt = 0; for (let d = 0; d < T.len; d += 10) { const i = T.idx(T.startS + d); if (def.bs.jn.some(j => j[4] && Math.abs(j[0] - d) < 25) || (d > T.len - 240 || d < 180)) continue; cnt++; if (T.bl[i] - T.w < 2.6 && T.br[i] - T.w < 2.6) near++; }
  check('barriers: the walls of a street circuit, close to the road away from the junctions and the pits (under 2.6 m past its edge)', near / cnt > 0.85, `${near}/${cnt}`);
}

// 5. whole races with the AI, in the dry and in the rain
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(4);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: def.laps, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 9, difficulty: 1, rain });
    r.start(); let t = 0, k = 0, resc = 0;
    while (t < 900 && r.cars.some(c => !c.finished)) { Math.random = seeded(7000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT); t += DT;
      for (const c of r.cars) if (c.isPlayer && !c.finished && (c.stuckT > 3 || c.wrongT > 3)) { r.rescue(c); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] ? fin[0].finishTime : 0, resc };
  } finally { Math.random = orig; }
};
const dry = race(0), wet = race(1);
check('race in the dry: all 13 cars finish the 4 laps', dry.fin === dry.cars, `${dry.fin}/${dry.cars}, winner ${dry.win.toFixed(1)} s, rescues ${dry.resc}`);
check('race in the rain: all 13 cars finish, slower than in the dry', wet.fin === wet.cars && wet.win > dry.win * 1.005, `${wet.fin}/${wet.cars}, winner ${wet.win.toFixed(1)} s (${(100 * (wet.win / dry.win - 1)).toFixed(1)} % slower)`);

// 6. the street furniture of the junctions: the car knocks each over and drives on
{
  const kinds = ['signal', 'signalm', 'sign', 'bollard', 'bin', 'hydrant', 'cabinet', 'lamp'];   // (the shared street furniture of the street circuits)
  for (const kind of kinds) {
    const orig = Math.random; Math.random = seeded(21);
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 3, difficulty: 1, tt: true });
    r.start(); const P = r.player; let t = 0;
    while (t < 40 && P.dist < 1150) { C.aiControl(P, r, DT); r.step(DT); t += DT; }   // (on to Sai 2, flat out)
    const s = P.q.s + Math.max(25, P.speed * 0.9), i = T.idx(s), o = T.rl[i] + (P.q.d - T.rl[T.idx(P.q.s)]);
    const x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
    r.setProps([{ kind, x, z, yaw: T.hd[i] + Math.PI, col: 0, i }]);
    const b = r.props[0], v0 = P.speed, d0 = P.dmg || 0, q0 = b.qw; let hit = false, vMin = 1e9;
    for (let k = 0; k < 240; k++) { C.aiControl(P, r, DT); r.step(DT); if (!b.sleep || Math.abs(b.qw - q0) > 1e-3) hit = true; if (hit) vMin = Math.min(vMin, P.speed); }
    const moved = Math.hypot(b.x - x, b.z - z), tilt = 2 * Math.acos(Math.min(1, Math.abs(b.qw * Math.cos(-(T.hd[i] + Math.PI) / 2) + b.qy * Math.sin(-(T.hd[i] + Math.PI) / 2))));
    Math.random = orig;
    check(`junction furniture (${kind}): knocked over by the car, which drives on only a little slower and barely damaged`, hit && (moved > 1 || tilt > 0.5) && vMin > v0 * 0.8 && P.speed > 20 && (P.dmg || 0) - d0 < 0.2,
      `moved ${moved.toFixed(1)} m, tipped ${(tilt * 180 / Math.PI).toFixed(0)}°, speed ${(v0 * 3.6).toFixed(0)} → lowest ${(vMin * 3.6).toFixed(0)} → ${(P.speed * 3.6).toFixed(0)} km/h, damage +${((P.dmg || 0) - d0).toFixed(2)}`);
  }
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
