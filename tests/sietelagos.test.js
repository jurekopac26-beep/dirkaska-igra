// Siete Lagos: the Road of the Seven Lakes (national route 40, Argentina), an open road with four ways to drive it on one card, as Vršič and
// Mulholland Highway (def.modes: the race, the time trial, the duel in the traffic and the run from the police). The road: the real line past three
// of the lakes from the forest above the Vuliñanco falls down to Lake Falkner, over the Río Villarino, along Lake Villarino and past the viewpoint
// over Lake Escondido (~7.95 km, no more than 8 km), its bends in their real order and direction (OpenStreetMap), its profile (down to the lakes,
// up past Escondido), the bridges and the car parks of the viewpoints where OpenStreetMap has them, the places for the HUD and the commentator in
// order along the road, the side roads (the campsite's gates, a forest track). The scenery data as the world builder reads it. The open road's
// traffic (cars, campers, coaches, motorbikes, a few lorries, cyclists). Whole races on autopilot, dry and in the rain (every car finishes and pulls
// up in its own slot past the line); a whole duel in the traffic; the run from the police. The medal times: the stock rally car on the autopilot.
// Only geographic names.
//   node tests/sietelagos.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore(), Lang = require(path.join(ROOT, 'js', 'lang.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'sietelagos'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const orig = Math.random;
const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const rle = (s, n) => { const a = new Uint8Array(n); let k = 0; for (let p = 0; p < s.length && k < n;) { const c = A64.indexOf(s[p++]); let m = (c & 7) + 1; if ((c & 7) === 7) { let e; do { e = A64.indexOf(s[p++]); m += e; } while (e === 63 && p < s.length); } a.fill(c >> 3, k, Math.min(n, k + m)); k += m; } return [a, k]; };
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
const poly = (a) => { const p = []; for (let k = 1; k + 1 < a.length; k += 2) p.push([a[k], a[k + 1]]); return p; };
const segD = (P, x, z) => { let d = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const ax = P[j][0], az = P[j][1], vx = P[i][0] - ax, vz = P[i][1] - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1))); d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return d; };

// 1. the track: an open road, four ways to drive it, its checkpoints, the real scale (8 km at most); not in the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 10 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt.join(' -> ')} m, modes ${(def.modes || []).join(',')}`);
check('track: from the forest above the Vuliñanco falls (~1010 m) to the finish past Lake Escondido (~967 m), ~7.95 km in the real scale (no more than 8 km)',
  Math.abs(def.alt[0] - 1010) < 10 && Math.abs(def.alt[1] - 967) < 10 && T.raceLen > 7800 && T.raceLen <= 8000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm * 1000 - T.raceLen) < 40,
  `${Math.round(T.raceLen)} m (realKm ${def.realKm}), ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: Siete Lagos, Argentina (Seven Lakes, Argentina in English); not in the big championship (an open road is no circuit)',
  def.name === 'Siete Lagos, Argentina' && def.en.name === 'Seven Lakes, Argentina' && !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('sietelagos'), def.name);

// 2. the shape: the bends in their real order and direction (OpenStreetMap: a right one above Lake Falkner, the left-left-right by the Villarino
// viewpoint and the right one past Escondido), the flowing curves along the shores (no hairpin: none tighter than ~25 m); the profile: down to the
// lakes (~930 m at the Río Villarino), up to ~1010 m by Lake Escondido, a little down to the finish; nowhere steeper than ~10 %
{
  const want = [[1242, 1], [5992, -1], [6320, -1], [6396, 1], [7064, 1]];
  const got = T.corners.filter(c => c.sev >= 2 && c.i0 * T.ds > T.startS && c.i1 * T.ds < T.finishS).map(c => [Math.round(c.i0 * T.ds - T.startS), c.dir > 0 ? 1 : -1]);
  const same = got.length === want.length && got.every(([s, d], k) => Math.abs(s - want[k][0]) < 60 && d === want[k][1]);
  let rmin = 1e9; for (let i = T.startIdx; i < T.finishIdx; i++) if (Math.abs(T.k[i]) > 1e-4) rmin = Math.min(rmin, 1 / Math.abs(T.k[i]));
  let turn = 0; for (let i = T.startIdx; i < T.finishIdx; i++) turn += Math.abs(T.k[i]) * T.ds;
  check('bends: the tight ones in their real order and direction (right; left, left, right; right), the tightest of a ~25-35 m radius, ~1000° of turning in all',
    same && rmin > 24 && rmin < 40 && turn * 180 / Math.PI > 700, got.map(([s, d]) => `${s}${d > 0 ? 'R' : 'L'}`).join(' ') + `, tightest ${rmin.toFixed(1)} m, ${Math.round(turn * 180 / Math.PI)}°`);
  const alt = (s) => T.altAt(T.hy[T.idx(T.startS + s)]);
  let gmax = 0; for (let i = T.startIdx; i <= T.finishIdx; i++) gmax = Math.max(gmax, Math.abs(T.grade[i]));
  let lo = 1e9, hi = -1e9; for (let s = 1500; s < 3200; s += 20) lo = Math.min(lo, alt(s)); for (let s = 5500; s < 6600; s += 20) hi = Math.max(hi, alt(s));
  check('profile: down to the lakes (~930 m by Falkner and over the Río Villarino), up to ~1010 m by Lake Escondido, nowhere steeper than ~10 %',
    lo > 920 && lo < 940 && hi > 995 && hi < 1020 && gmax < 0.1 && Math.abs(alt(2930) - lo) < 6, `lowest ${lo.toFixed(0)} m, at the Río Villarino ${alt(2930).toFixed(0)} m, by Escondido ${hi.toFixed(0)} m, steepest ${(gmax * 100).toFixed(1)} %`);
}

// 3. the places: in order along the road, the commentator's lines for each; only geographic names (no businesses), the HUD in English
{
  const N = T.names, ok = N.every((q, k) => !k || q.d > N[k - 1].d) && N.every(q => q.say && q.say.length);
  check('places: in order (Slap Vuliñanco, Jezero Falkner, the Falkner viewpoint, Río Villarino, Jezero Villarino, the Villarino viewpoint, Jezero Escondido), each with the commentator\'s lines',
    ok && N.length === 7 && N[0].n === 'Slap Vuliñanco' && N[3].n === 'Río Villarino' && N[6].n === 'Jezero Escondido', N.map(q => `${q.n}@${Math.round(q.d)}`).join(', '));
  const all = JSON.stringify([def.name, def.en, def.escTo, N.map(q => [q.n, q.say]), def.comm, def.police, def.sideRoads.map(r => r[9])]);
  check('names: no campsite, hotel, shop or brand anywhere in the names, lines and boards (only the lakes, the river, the falls, the road)', !/camping falkner|hoster|hotel|kiosk|ypf|shell|toyota|ford|chevrolet|mercedes/i.test(all));
  Lang.set('en'); const en = N.map(q => Lang.place(q.n)); Lang.set('sl');
  check('names: the HUD in English (Vuliñanco Falls, Lake Falkner, Falkner Viewpoint · 929 m, Río Villarino, Lake Villarino, Villarino Viewpoint · 1,001 m, Lake Escondido)',
    en[0] === 'Vuliñanco Falls' && en[1] === 'Lake Falkner' && /^Falkner Viewpoint · \d{3} m$/.test(en[2]) && en[3] === 'Río Villarino' && /^Villarino Viewpoint · 1,0\d\d m$/.test(en[5]) && en[6] === 'Lake Escondido', en.join(' | '));
}

// 4. the lakes, the bridges, the car parks: the road along Lake Falkner's shore (on the left) and Lake Villarino's (on the right), Lake Escondido
// below the viewpoint (on the right), the bridges over the Arroyo Filuco and over the Río Villarino between the two lakes, the four car parks
// beside the road (the barrier moves out: def.wide), the bridges' parapets close in (def.narrow)
{
  const L = def.lakes.map(poly), side = (s, P) => { const i = T.idx(T.startS + s); let best = 1e9, sd = 0; for (let o = -150; o <= 150; o += 3) { const x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; if (inPoly(P, x, z) && Math.abs(o) < best) { best = Math.abs(o); sd = Math.sign(o); } } return [best, sd]; };
  const big = L.map((P, k) => [def.lakes[k][0], P]).sort((a, b) => b[0] - a[0]);   // (Villarino, Falkner by their clipped area, then Escondido)
  const [vill, falk] = [big[0][1], big[1][1]], esc = L.find(P => P !== vill && P !== falk && P.length > 30);
  const f = side(2500, falk), v = side(4400, vill), e = side(6886, esc);
  check('lakes: Lake Falkner on the left by its shore, Lake Villarino on the right along the south shore, Lake Escondido below the viewpoint on the right',
    f[1] < 0 && f[0] < 80 && v[1] > 0 && v[0] < 150 && e[1] > 0 && e[0] < 80, `Falkner ${f[0]} m (${f[1]}), Villarino ${v[0]} m (${v[1]}), Escondido ${e[0]} m (${e[1]})`);
  const B = def.bridges, wd = def.wide;
  const brR = B.find(([a, b]) => b - a > 30), brF = B.find(([a, b]) => b - a < 30);
  const wOut = wd.every(([a, b, sd, m]) => { const i = T.idx(T.startS + (a + b) / 2); return (sd > 0 ? T.br[i] : T.bl[i]) > T.w + 3.4 + m - 0.5; });
  const bi = T.idx(T.startS + (brR[0] + brR[1]) / 2);
  check('bridges and car parks: the Arroyo Filuco bridge (~18 m), the Río Villarino bridge (~48 m) at ~2.9 km between the lakes, its parapets close in; four car parks beside the road, the barrier out',
    B.length === 2 && brF && brR && Math.abs(brR[0] - 2910) < 40 && brR[1] - brR[0] > 40 && T.bl[bi] < T.w + 2 && T.br[bi] < T.w + 2 && wd.length === 4 && wOut && def.lots.length === 4,
    `bridges ${B.map(([a, b]) => `${a}-${b}`).join(', ')}, the barriers on the Río Villarino bridge ${T.bl[bi].toFixed(1)}/${T.br[bi].toFixed(1)} m, car parks ${wd.map(([a, , sd]) => a + (sd > 0 ? 'R' : 'L')).join(' ')}`);
}

// 5. the scenery data (as vrPrep and the builder read them): the terrain rows and residuals, the land cover and the canopy cell for cell (forest
// the most of it), the view beyond the corridor (its heights, its land cover: the lakes, the forest, the snow and ice), the beaches, the waterfall
{
  const D = def.dem, Lc = def.lc, Cn = def.can, F = def.farDem;
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), res = Buffer.from(D.res, 'base64').length === D.rows.reduce((s, r) => s + r[1], 0);
  const [lc, nl] = rle(Lc.rle, Lc.nx * Lc.nz), [cn, nc] = rle(Cn.rle, Cn.nx * Cn.nz), [fl, nf] = rle(F.lc, F.nx * F.nz);
  const cnt = (a, k) => a.reduce((s, v) => s + (v === k ? 1 : 0), 0);
  const fh = Buffer.from(F.b64, 'base64'), H = []; for (let k = 0; k < F.nx * F.nz; k++) H.push(400 + fh.readUInt16BE(2 * k) / 2);
  check('scenery: the terrain rows and residuals, the land cover and the canopy cell for cell (forest the most of the land), the view beyond (lakes, forest, peaks up to ~2.2 km)',
    rows && res && nl === Lc.nx * Lc.nz && nc === Cn.nx * Cn.nz && nf === F.nx * F.nz && cnt(lc, 1) > cnt(lc, 0) && cnt(lc, 5) > 0 && cnt(fl, 5) > 0 && cnt(fl, 1) > cnt(fl, 4) && Math.max(...H) > 2000 && Math.min(...H) < 930,
    `dem ${D.nx}x${D.nz}, lc ${Lc.nx}x${Lc.nz} (forest ${cnt(lc, 1)}, grass ${cnt(lc, 0)}, water ${cnt(lc, 5)}), canopy ${Cn.nx}x${Cn.nz}, far ${F.nx}x${F.nz} (${Math.min(...H).toFixed(0)}-${Math.max(...H).toFixed(0)} m)`);
  const fq = T.query(def.falls[0], def.falls[1], T.nearestIdx(def.falls[0], def.falls[1]), {});
  check('scenery: the Vuliñanco falls ~100 m to the right of the road near its start, two beaches by Lake Falkner, the campsite on its shore',
    fq.d > 60 && fq.d < 160 && fq.s - T.startS < 700 && def.sand.length === 2 && def.camp && T.query(def.camp[0], def.camp[1], T.nearestIdx(def.camp[0], def.camp[1]), {}).d < -20, `falls ${Math.round(fq.d)} m at ${Math.round(fq.s - T.startS)} m`);
}

// 6. the side roads (def.sideRoads, Track.stubs): the campsite's two gates by Lake Falkner (left and right), the forest track north of the Río Villarino
{
  const S = T.stubs || [];
  check('side roads: the campsite\'s gates on both sides (driveways, gravel, a gate across), the forest track (gravel, a rail across), in order along the road',
    S.length === 3 && S.filter(s => s.end === 1 && s.kind === 1 && s.grav).length === 2 && S.some(s => s.side < 0) && S.some(s => s.side > 0) && S.some(s => s.kind === 2 && s.end === 0) && S.every((s, k) => !k || s.s >= S[k - 1].s) && S.every(s => T.stubCones(s.k).length > 0),
    S.map(s => `${Math.round(s.s)}${s.side > 0 ? 'R' : 'L'} kind ${s.kind} end ${s.end} open ${s.L.toFixed(0)} m, ${T.stubCones(s.k).length} cones`).join('; '));
}

// 7. the traffic of the open road: cars, campers, coaches, motorbikes and a few lorries both ways on their own half of the road, cyclists
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const k = (q) => tf.veh.filter(v => v.kind === q).length, trucks = tf.veh.filter(v => v.p === 5).length;
  const sides = tf.veh.filter(v => v.kind !== 4).every(v => v.d * v.dir > 0.3 && Math.abs(v.d) < T.w);
  check('traffic: cars, campers, coaches and motorbikes both ways on their own half of the road, a few lorries, cyclists',
    tf.veh.length > 12 && k(0) > k(1) && k(1) > 0 && k(3) > 0 && k(4) > 0 && trucks <= k(0) / 4 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && sides,
    `${tf.veh.length} vehicles: ${k(0)} cars, ${k(1)} vans, ${k(2)} coaches, ${k(3)} motorbikes, ${trucks} lorries, ${k(4)} cyclists`);
}

// 8. the ways to drive it (and an online race: always the race)
{
  Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line; online always the race',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5 && !net.timeTrial && net.cars.length === 2,
    'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  Math.random = orig;
}

// 9. whole races on autopilot, dry and in the rain: every car finishes, then pulls up in its own slot past the line and stays there
for (const rain of [0, 1]) {
  Math.random = seeded(3);
  const r = new C.Race(T, opts(rain ? { rain: 1 } : {})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos), wx = rain ? 'in the rain' : 'dry';
  check(`race ${wx}: all 13 cars reach the finish past Lake Escondido`, fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check(`race ${wx}: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn: within ~4 m)`, slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4.5 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 10. a whole duel in the traffic on autopilot (both cars): both reach the finish, nobody knocked down, the traffic keeps moving
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0; const stand = new Map();
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the finish through the traffic, no one knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

// 11. the run from the police: no checkpoint, no building (the chase from the start, the escape over the finish); the patrol cars read POLICÍA;
// whole runs on autopilot at the easy level end in an escape or an arrest, the autopilot gets away at least once in three
{
  const popts = (o) => Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 0, damage: 2, police: true }, o);
  const runs = [11, 12, 13].map(seed => {
    Math.random = seeded(3);
    const r = new C.Race(T, popts({ seed })), P = r.player, pol = r.pol, pc = pol.cars[0];
    const st = { stage: pol.stage, chk: pol.chk, goal: pol.goal, chase: pc && pc.pol.mode === 'chase' };
    r.start();
    let t = 0, k = 0, nan = false;
    while (t < 900 && !P.finished) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
      if (!Number.isFinite(P.x + P.z)) nan = true;
    }
    Math.random = orig;
    return { seed, st, nan, t, escaped: pol.escaped && !pol.busted && P.finished, busted: pol.busted, at: P.q.s - T.startS };
  });
  check('police: the chase from the start, the escape over the finish; on autopilot at the easy level it gets away at least once in three; the patrol cars read POLICÍA',
    def.police.label === 'POLICÍA' && runs.every(r => r.st.stage === 'chase' && !r.st.chk && !r.st.goal && r.st.chase && !r.nan && (r.escaped || r.busted)) && runs.some(r => r.escaped),
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m`).join('; '));
}

// 12. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const ttRun = (rain) => { Math.random = seeded(3); const r = new C.Race(T, opts(Object.assign({ tt: true, numAI: 0, playerGrid: 1 }, rain ? { rain: 1 } : {}))), P = r.player; r.start();
    let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig; return P.finished ? P.finishTime : null; };
  const dry = ttRun(0), wet = ttRun(1);
  if (process.argv.includes('--medals')) console.log(JSON.stringify({ cs: [1.01, 1.06, 1.14].map(f => Math.round(dry * f)), wet: { cs: [1.01, 1.06, 1.14].map(f => Math.round(wet * f)) } }));
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01, dry and wet', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && dry && wet && Math.abs(dry * 1.01 - M.cs[0]) < 1.5 && Math.abs(wet * 1.01 - M.wet.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${dry ? dry.toFixed(1) : '-'} / ${wet ? wet.toFixed(1) : '-'} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
