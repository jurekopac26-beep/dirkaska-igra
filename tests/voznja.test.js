// AI po tvoji liniji, korak 1 (docs/ai-po-tvoji-liniji.md): tools/voznja.mjs measures the player's driving from recordings of their races.
// The recordings here are made by Core in Node as the game records a race (js/game.js recStep: every car's x, y, z, h, vl, front wheel
// angle and bits every 0.05 s; the header as rrpOf; packed by the game's own js/napake.js and gzip): the player on the autopilot with a known
// offset of its line (Car.laneBias, the line 0.6 m and 1.4 m to the right of the racing line on alternate laps). Bathurst: seven laps in the
// dry (lap 3 a spin, lap 6 a hit into the wall; on lap 2 another car beside it for 10 s), three in the rain, two in an upgraded car and two
// in the formula; Bâlea: three runs up the road (the line 0.5 / 1 / 1.5 m to the right). The tool's profile against what the race
// itself had at the same points (the player's d and speed, the race's speed profile): the line and the speed within bounds, the spin and the
// hit laps left out with their reasons, the part beside the other car left out of lap 2, the rain a profile of its own (and each car), the
// share of the pace (vq) the same in every car, an open road's runs each a lap; the corners' braking; a changing weather (wxs) leaves out the
// laps while the road gets wet. Korak 2: the game's data from the recordings and a race on it; Korak 3: the player's style (VOZNJA_SLOG) on
// the tracks without their profile (Spa, Rio do Rastro), where it does not go (the rain, Bathurst still to be chosen, a test track, makadam).
//   node tests/voznja.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');
const { spawnSync } = require('child_process');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const OUT = path.join(ROOT, 'test-results', 'voznja-test'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const ctx = vm.createContext({ TextEncoder, TextDecoder });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'napake.js'), 'utf8') + '\n;this.Napake = Napake;', ctx, { filename: 'js/napake.js' });
const NK = ctx.Napake;
const STEP = 5, W = 7;
const median = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : NaN; };
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

// a race driven by the autopilot and recorded: plan(P, race, lap, tLap) each step after the autopilot's controls (the line, a spin);
// ghost(f, race, P): another car's numbers in a sample (null: none); the truth: the player's d and speed at every STEP m of each lap
function record(tid, opts, plan, ghost) {
  const def = C.TRACKS.find(d => d.id === tid), T = new C.Track(def), orig = Math.random;
  try {
    Math.random = seeded(7);
    const race = new C.Race(T, Object.assign({ numAI: 0, playerModel: C.MODELS[0], assist: 2, seed: 3, damage: 0 }, opts));
    race.start();
    const P = race.player, frames = [], truth = new Map(), len = T.open ? T.raceLen : T.len, nc = ghost ? 2 : 1;
    let next = 0, prev = -1, lastS = null;
    for (let k = 1; k < 120 * 1500; k++) {
      Math.random = seeded(1000 + k);
      C.aiControl(P, race, DT);
      const lap = Math.max(1, P.lap), tLap = race.time - (P.lapStart || 0);
      if (plan) plan(P, race, lap, tLap);
      if (P.stuckT > 3 || P.wrongT > 3) race.rescue(P);
      race.step(DT);
      if (P.lap >= 1 && !P.finished) {   // (the truth: the player's own d and speed where it passes each STEP m of its lap)
        const s = T.open ? P.q.s - T.startS : ((P.q.s - T.startS) % T.len + T.len) % T.len, g = Math.floor(s / STEP);
        if (lastS != null && g !== lastS && s - lastS * STEP < 3 * STEP && s >= 0) { const key = P.lap + ':' + g; if (!truth.has(key)) truth.set(key, { d: P.q.d, v: P.vl, t: race.time }); }
        lastS = g;
      }
      if ((race.state === 'racing' || race.state === 'done') && race.time >= next) {
        next = race.time + 0.05;
        const f = new Float32Array(1 + (nc + 1) * W); f[0] = race.time;
        const put = (o, c, bits) => { f[o] = c.x; f[o + 1] = c.y || 0; f[o + 2] = c.z; f[o + 3] = c.h; f[o + 4] = c.vl || 0; f[o + 5] = c.delta || 0; f[o + 6] = bits; };
        put(1, P, (P.inBrk > 0.08 && P.vl > 0.5 ? 1 : 0) + (race.putT && race.putT.get(P) > prev ? 2 : 0) + (P.inPit || race.isOut(P) ? 4 : 0));
        if (ghost) { const gh = ghost(race, P); if (gh) for (let j = 0; j < W; j++) f[1 + W + j] = gh[j]; else { f[1 + W] = 1e4; f[1 + W + 2] = 1e4; f[1 + W + 6] = 4; } }
        frames.push(f); prev = race.time;
      }
      if (P.finished && race.time > P.finishTime + 3) break;
    }
    const car = (c, pl) => Object.assign({ m: c.m.id, name: c.name, color: c.color, num: c.num, grid: c.grid, pl, lap: c.lap || 1, lapStart: c.lapStart || 0, lapTimes: (c.lapTimes || []).slice() }, c.finished ? { fin: 1, ft: c.finishTime } : {});
    const H = { ver: 'test', track: tid, name: def.name, mode: T.open ? 'tt' : 'race', wx: race.rain ? 'dez' : 'suho', laps: race.laps, w: W, n: nc, tt: false, rain: race.rain || 0, season: 'summer', tod: 'day',
      cars: [Object.assign(car(P, 1), { pf: { upg: P.upg, setup: P.setup, deli: P.deli || null } })].concat(ghost ? [{ m: 'kaze', name: 'Tekmec', color: 0, num: 7, grid: 2, pl: 0, lap: 1, lapStart: 0, lapTimes: [] }] : []),
      fin: [0], ev: [], flags: [], dev: 'test', devIme: 'test', date: Date.now(), dn: [] };
    return { H, frames, truth, race, T, P };
  } finally { Math.random = orig; }
}
const save = (name, r, H) => { const f = path.join(OUT, name); fs.writeFileSync(f, zlib.gzipSync(Buffer.from(NK.rrp.pack(H || r.H, r.frames)))); return f; };
const tool = (files, out, more) => {
  const p = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'voznja.mjs'), ...files, '--out', out, ...(more || [])], { encoding: 'utf8', timeout: 600000 });
  const prof = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  return { code: p.status, text: (p.stdout || '') + (p.stderr || ''), prof };
};

// 1. Bathurst in the dry: seven laps, the line 0.6 / 1.4 m right of the racing line on alternate laps; lap 3 a spin on the straight up the
// mountain (from 600 m into the lap the car's yaw rate held at 3.5 rad/s for 0.6 s, off the throttle: it turns some 120° and slides on along
// the road), lap 6 a hit (full right lock and throttle from 40 s into the lap for 1.2 s: into the wall of the cutting, ~1890 m); another car
// 2.6 m to the right of the player from 30 to 40 s into lap 2
const BIAS = (lap) => lap % 2 ? 0.6 : 1.4, SPIN = { lap: 3, s: 600, dur: 0.6, w: 3.5 }, HIT = { lap: 6, t: 40, dur: 1.2 }, GH = { lap: 2, t0: 30, t1: 40 }, CLEAN = [1, 2, 4, 5, 7];
let lap2 = null, spinAt = null;
const dry = record('bathurst', { laps: 7 }, (P, race, lap, tl) => {
  P.laneBias = BIAS(lap);
  const s = ((P.q.s - race.track.startS) % race.track.len + race.track.len) % race.track.len;
  if (lap === SPIN.lap && !spinAt && s >= SPIN.s && s < SPIN.s + 100) spinAt = { t: race.time, s };
  if (spinAt && race.time - spinAt.t < SPIN.dur) { P.w = SPIN.w; P.inThr = 0; P.inBrk = 0; }
  if (lap === HIT.lap && tl >= HIT.t && tl < HIT.t + HIT.dur) { P.inSteer = 1; P.inThr = 1; P.inBrk = 0; P.digitalSteer = true; } else P.digitalSteer = false;
}, (race, P) => {
  if (P.lap === GH.lap && !lap2) lap2 = { t0: P.lapStart };
  const tl = lap2 ? race.time - lap2.t0 : -1;
  if (P.lap !== GH.lap || tl < GH.t0 || tl >= GH.t1) return null;
  if (!lap2.s0) lap2.s0 = P.dist; lap2.s1 = P.dist;
  return [P.x + P.q.nx * 2.6, P.y || 0, P.z + P.q.nz * 2.6, P.h, P.vl, 0, 0];
});
const fDry = save('posnetek_bathurst_20261104-1000.rrp', dry);
// 2. Bathurst in the rain: three laps, the same lines (no spin, no other car)
const wet = record('bathurst', { laps: 3, rain: 1 }, (P, race, lap) => { P.laneBias = BIAS(lap); });
const fWet = save('posnetek_bathurst_20261104-1100.rrp', wet);
const r1 = tool([fDry, fWet], path.join(OUT, 'profil.json')), PR = (r1.prof && r1.prof.proge) || [];
const pD = PR.find(p => p.proga === 'bathurst' && p.vreme === 'suho'), pW = PR.find(p => p.proga === 'bathurst' && p.vreme === 'mokro');
console.log(r1.text.split('\n').filter(l => !/^\s+(Zavoj|ovinek) /.test(l)).slice(0, 30).map(l => '  | ' + l).join('\n'));
check('the tool runs on two recordings: a profile for Bathurst in the dry and one in the rain, the summary names them', r1.code === 0 && pD && pW && PR.length === 2 && /Bathurst, Avstralija \(bathurst\) · suho/.test(r1.text) && /· mokro/.test(r1.text),
  `exit ${r1.code}, profiles ${PR.map(p => p.proga + '/' + p.vreme).join(', ')}`);
if (pD && pW) {
  const U = pD.krogi.uporabljeni, X = pD.krogi.izpusceni;
  check('dry: laps 1, 2, 4, 5, 7 used, lap 3 left out for its spin, lap 6 for its hit', U.map(r => r.krog).join() === CLEAN.join() && X.length === 2 && X[0].krog === 3 && X[0].razlog === 'vrtenje' && X[1].krog === 6 && X[1].razlog === 'trk',
    `used ${U.map(r => r.krog).join()}, out ${X.map(r => r.krog + ': ' + r.razlog + ' @' + r.s + ' m').join('; ')}`);
  const T = dry.T, spinS = spinAt && spinAt.s;
  check('dry: the places in the summary: the spin within 100 m after where it was forced, the hit at the cutting\'s wall (1850-1950 m)', X.length === 2 && spinS != null && X[0].s >= spinS && X[0].s - spinS < 100 && X[1].s > 1850 && X[1].s < 1950,
    `spin ${X[0] && X[0].s} m (forced at ${spinS && spinS.toFixed(0)} m), hit ${X[1] && X[1].s} m`);
  check('dry: five clean laps, »dobro« (najmanj 3, dobro 5, najbolje 8-10); rain: three, »najmanj«', pD.natancnost.krogov === 5 && pD.natancnost.ocena === 'dobro' && pW.natancnost.krogov === 3 && pW.natancnost.ocena === 'najmanj',
    `${pD.natancnost.krogov} ${pD.natancnost.ocena}, ${pW.natancnost.krogov} ${pW.natancnost.ocena}`);
  // the line and the speed against the race's own (truth): the same laps, the samples the tool kept
  const cmp = (p, r, laps) => { const dd = [], dv = [], dq = [], vp = r.race.player.vprof || r.race.vprof;
    for (let i = 0; i < p.s.length; i++) { if (p.d[i] == null || p.n[i] < laps.length) continue; const tr = laps.map(L => r.truth.get(L + ':' + i)).filter(Boolean); if (tr.length < laps.length) continue;
      const vT = mean(tr.map(x => x.v)), vr = vp[r.T.idx(r.T.startS + p.s[i])]; dd.push(Math.abs(mean(tr.map(x => x.d)) - p.d[i])); dv.push(Math.abs(vT - p.v[i])); dq.push(Math.abs(mean(tr.map(x => x.v / vr)) - p.vq[i])); }
    return { n: dd.length, d: median(dd), v: median(dv), q: median(dq), d95: dd.sort((a, b) => a - b)[Math.floor(dd.length * 0.95)] }; };
  const cD = cmp(pD, dry, CLEAN), cW = cmp(pW, wet, [1, 2, 3]);
  check('dry: the line and the speed as the race had them (median off by under 3 cm and 0.1 m/s; 95 % of the points under 15 cm)', cD.n > 800 && cD.d < 0.03 && cD.v < 0.1 && cD.d95 < 0.15, JSON.stringify(cD));
  check('rain: the same (the points where all three laps count)', cW.n > 800 && cW.d < 0.03 && cW.v < 0.1 && cW.d95 < 0.15, JSON.stringify(cW));
  check('the speed as a share of the autopilot\'s pace (vq) against the race\'s own speed profile of that car and weather (median off by under 0.005)', cD.q < 0.005 && cW.q < 0.005, `dry ${cD.q.toFixed(4)}, rain ${cW.q.toFixed(4)}`);
  // the known offset: where neither line is held in by the road's edge, the line right of the racing line by the laps' mean, its spread
  const free = (p) => p.s.map((s, i) => i).filter(i => p.d[i] != null && Math.abs(p.rl[i]) < 2.4 && p.n[i] >= 3);
  const fD = free(pD), offD = mean(fD.map(i => pD.d[i] - pD.rl[i])), sdD = median(fD.map(i => pD.d_sd[i])), want = mean(CLEAN.map(BIAS)), sdWant = Math.sqrt(CLEAN.map(BIAS).reduce((a, b) => a + (b - want) ** 2, 0) / 4);
  check(`dry: the line ${want.toFixed(2)} m right of the racing line on average (±0.25 m), spread over the laps ${sdWant.toFixed(2)} m (±0.12 m)`, fD.length > 300 && Math.abs(offD - want) < 0.25 && Math.abs(sdD - sdWant) < 0.12, `${offD.toFixed(3)} m, spread ${sdD.toFixed(3)} m over ${fD.length} points`);
  const fW = free(pW), offW = mean(fW.map(i => pW.d[i] - pW.rl[i])), wantW = mean([1, 2, 3].map(BIAS));
  check(`rain: the line ${wantW.toFixed(2)} m right of the racing line on average (±0.25 m)`, fW.length > 300 && Math.abs(offW - wantW) < 0.25, `${offW.toFixed(3)} m over ${fW.length} points`);
  // the other car beside the player on lap 2: those metres (and a second either side) left out of lap 2 only
  const u2 = U.find(r => r.krog === 2), gm = lap2 && lap2.s1 - lap2.s0, om = u2 && u2.izpusceno_m && u2.izpusceno_m.promet;
  check('dry: the 10 s beside the other car on lap 2 left out of it (its metres and a second either side), no other lap', om > gm && om < gm + 2 * 1.1 * 75 && U.filter(r => r.izpusceno_m && r.izpusceno_m.promet).length === 1,
    `left out ${om} m, beside it ${gm && gm.toFixed(0)} m`);
  check('dry: the standing start of lap 1 left out up to the first corner, no other lap', U[0].izpusceno_m && U[0].izpusceno_m.start > 100 && U[0].izpusceno_m.start < 400 && U.slice(1).every(r => !(r.izpusceno_m && r.izpusceno_m.start)), JSON.stringify(U[0].izpusceno_m));
  check('rain: slower than the dry (the autopilot\'s pace lower in the corners), the same share of it (vq) within 3 %', (() => {
    const i = pD.s.map((s, i) => i).filter(i => pD.v[i] != null && pW.v[i] != null && pD.vref[i] < 40);
    return i.length > 100 && mean(i.map(j => pW.v[j])) < mean(i.map(j => pD.v[j])) - 1 && Math.abs(mean(i.map(j => pW.vq[j])) - mean(i.map(j => pD.vq[j]))) < 0.03; })(),
    `vref dry ${median(pD.vref).toFixed(1)}, rain ${median(pW.vref).toFixed(1)}`);
  // the corners: the minima of the speed, the braking into each
  // (the truth: the minima of the race's own speed profile, each the slowest within 60 m and 3 m/s or more below the fastest of the 500 m before it)
  const O = pD.ovinki, big = O.slice().sort((a, b) => (b.v_zav || 0) - (b.v_vrh || 0) - ((a.v_zav || 0) - (a.v_vrh || 0)))[0], vp = dry.race.player.vprof || dry.race.vprof, N = T.N;
  const at = (i) => vp[((i % N) + N) % N], fromLine = (s) => ((s - T.startS) % T.len + T.len) % T.len, minima = [];
  for (let i = 0; i < N; i++) { let ok = true; for (let k = -30; k <= 30 && ok; k++) if (k && at(i + k) < at(i)) ok = false; if (!ok) continue; let hi = 0; for (let k = 1; k <= 250; k++) hi = Math.max(hi, at(i - k)); if (hi - at(i) >= 3) minima.push(fromLine(i * T.ds)); }
  const gap = (a, b) => Math.min(Math.abs(a - b), T.len - Math.abs(a - b)), atMin = O.filter(c => minima.some(m => gap(m, c.s) < 40)).length;
  const sharp = T.corners.filter(k => k.minR < 40), caught = sharp.filter(k => { const s0 = fromLine(k.s0), s1 = s0 + (k.i1 - k.i0 + N) % N * T.ds; return O.some(c => c.s >= s0 - 60 && c.s <= s1 + 60); }).length;
  check('dry: the corners found (12-20), each at a minimum of the race\'s speed profile (±40 m), every sharp corner (Track.corners, radius under 40 m) among them, the autopilot brakes into most',
    O.length >= 12 && O.length <= 20 && atMin === O.length && caught === sharp.length && O.filter(c => c.zavira > 0).length >= O.length / 2,
    `${O.length} corners, ${atMin} at the profile's ${minima.length} minima, ${caught} of the ${sharp.length} sharp, ${O.filter(c => c.zavira > 0).length} braked into: ${O.map(c => c.s + (c.ime ? ' ' + c.ime : '')).join(', ')}`);
  const named = O.filter(c => c.ime), names = T.names || [];
  check('dry: the track\'s corner names (Track.names) each on the corner at it (within 80 m), none twice', named.length >= 6 && new Set(named.map(c => c.ime)).size === named.length && named.every(c => names.some(q => q.n === c.ime && gap(q.d, c.s) < 80)),
    named.map(c => c.ime + '@' + c.s).join(', '));
  check('dry: the hardest braking (the chicane at the end of the long straight) 80-350 m before its apex from over 200 km/h, 8-16 m/s², where the autopilot brakes there (distance and deceleration within 10 %), the apex at 0.85-1.1 of its pace',
    big && big.zav_pred > 80 && big.zav_pred < 350 && big.v_zav * 3.6 > 200 && big.pojemek > 8 && big.pojemek < 16 && Math.abs(big.zav_pred_q - 1) < 0.1 && Math.abs(big.pojemek_q - 1) < 0.1 &&
    Math.abs(big.ap_zav_pred - big.zav_pred) < 15 && big.vq_vrh > 0.85 && big.vq_vrh < 1.1 && big.zavira === 5,
    JSON.stringify(big));
  check('the profile: one point every 5 m round the lap (6194 m: 1239), the AI\'s line and pace beside it, the lap times of the car', pD.s.length === Math.floor(6194 / 5) + 1 && pD.s[1] === 5 && pD.rl.length === pD.s.length && pD.vref.every(v => v > 5) &&
    pD.avti.kaze && pD.avti.kaze.krogov === 5 && Math.abs(pD.avti.kaze.najboljsi - Math.min(...CLEAN.map(k => dry.P.lapTimes[k - 1]))) < 0.01 && pD.avto === 'kaze',
    `${pD.s.length} points, best ${pD.avti.kaze && pD.avti.kaze.najboljsi}`);
  // (the autopilot in the same car and weather, the tool's own race of it in Core: these laps are the autopilot's, a little off its line)
  const qs = (k) => pD.ovinki.map(c => c[k]).filter(v => v != null), share = (a, lo, hi) => a.filter(v => v >= lo && v <= hi).length / Math.max(1, a.length);
  const zq = qs('zav_pred_q'), dq = qs('pojemek_q'), aD = pD.avti.kaze, aW = pW.avti.kaze;
  check('against the autopilot in the same car and weather: the braking into the corners as its own (the median of the corners\' ratios 0.95-1.05, 80 % of them 0.85-1.15), the lap time as its (0.99-1.01), dry and wet',
    zq.length >= 8 && dq.length >= 8 && Math.abs(median(zq) - 1) < 0.05 && Math.abs(median(dq) - 1) < 0.05 && share(zq, 0.85, 1.15) >= 0.8 && share(dq, 0.85, 1.15) >= 0.8 &&
    pD.ovinki.every(c => c.ap_v_vrh > 0) && aD && Math.abs(aD.cas_q - 1) < 0.01 && aD.avtopilot > 120 && aW && Math.abs(aW.cas_q - 1) < 0.01 && aW.avtopilot > aD.avtopilot,
    `distance ${zq.length} corners, median ${median(zq).toFixed(3)}; deceleration ${dq.length}, ${median(dq).toFixed(3)}; lap ${aD && aD.cas_q} of ${aD && aD.avtopilot} s dry, ${aW && aW.cas_q} of ${aW && aW.avtopilot} s wet`);
}

// 2b. the same driver (the autopilot) in an upgraded car and in another car (the formula): each its own profile (the car told apart by its
// model and upgrades), the speeds at the apexes their own, the same share of each car's own pace there (vq: what carries over to another
// car; tools/voznja.mjs paceOf with the header's pf)
{
  const apex = (p) => { const o = p.ovinki.filter(c => c.vq_vrh != null && c.v_vrh != null); return { q: mean(o.map(c => c.vq_vrh)), v: mean(o.map(c => c.v_vrh)), n: o.length }; };
  const run = (name, opts) => { const f = save(name, record('bathurst', Object.assign({ laps: 2 }, opts), (P, race, lap) => { P.laneBias = BIAS(lap); })), r = tool([f], path.join(OUT, name.replace('.rrp', '.json')));
    const p = r.prof && r.prof.proge && r.prof.proge[0]; return { f, r, p, a: p && apex(p) }; };
  const U = run('posnetek_bathurst_20261104-1130.rrp', { playerUpg: { motor: 3, gume: 2, zavore: 3, aero: 3 } }), Fm = run('posnetek_bathurst_20261104-1140.rrp', { playerModel: C.MODELS.find(m => m.id === 'formula') });
  const aD = pD && apex(pD), ok = (x) => x.p && x.r.code === 0 && x.a.n >= 10 && Math.abs(x.a.q - aD.q) < 0.03 && x.a.q > 0.95 && x.a.q < 1.05;
  check('an upgraded car and the formula: each its own profile (»kaze+m3g2z3a3«, »formula«), quicker at the apexes than the stock car (the formula by 10 % or more), the same share of its own pace there (within 0.03, 0.95-1.05)',
    pD && ok(U) && ok(Fm) && U.p.avto === 'kaze+m3g2z3a3' && U.p.avti['kaze+m3g2z3a3'] && Fm.p.avto === 'formula' && U.a.v > aD.v && Fm.a.v > aD.v * 1.1,
    [['upgraded', U], ['formula', Fm]].map(([k, x]) => x.p ? `${k} ${x.p.avto}: ${x.a.v.toFixed(2)} m/s at ${x.a.q.toFixed(3)} of its pace (${x.a.n} corners)` : k + ': ' + x.r.text.slice(0, 200)).join('; ') + (aD ? `; stock ${aD.v.toFixed(2)} m/s at ${aD.q.toFixed(3)}` : ''));
  // (all of them together, and the dry race once more with its car named the truck: a profile per class, the rivals a race gives the car,
  // tools/voznja.mjs classOf; the truck races the road cars but is not one of them: a profile of its own, v_razredu false)
  const Ht = JSON.parse(JSON.stringify(dry.H)); Ht.cars[0].m = 'truck';
  const rc = tool([fDry, U.f, Fm.f, save('posnetek_bathurst_20261104-1150.rrp', dry, Ht)], path.join(OUT, 'razredi.json')), PC = ((rc.prof && rc.prof.proge) || []).filter(p => p.proga === 'bathurst' && p.vreme === 'suho');
  const road = PC.find(p => p.razred.join() === 'kaze,pico,strega,vortex' && p.v_razredu), fo = PC.find(p => p.razred.join() === 'formula'), tr = PC.find(p => !p.v_razredu);
  check('a profile per class of cars (the rivals a race gives the car): the stock and the upgraded car in one (the road cars), the formula its own, the truck among the road cars its own (not one of them)',
    rc.code === 0 && PC.length === 3 && road && road.avti.kaze && road.avti['kaze+m3g2z3a3'] && U.p && road.krogi.uporabljeni.length === 5 + U.p.krogi.uporabljeni.length &&
    fo && fo.avto === 'formula' && fo.v_razredu && tr && tr.avto === 'truck' && tr.razred.join() === 'kaze,pico,strega,vortex' && tr.krogi.uporabljeni.length === 5 && /ni med njimi/.test(rc.text),
    PC.map(p => `${p.razred.join(',')}${p.v_razredu ? '' : ' (not one of them)'}: ${Object.keys(p.avti).join(' + ')}, ${p.krogi.uporabljeni.length} laps`).join(' | ') || rc.text.slice(0, 300));
}

// 3. Bâlea, an open road: three runs (each its own recording), the line 0.5 / 1 / 1.5 m right of the racing line
const rB = [0.5, 1, 1.5].map((b, j) => record('balea', { laps: 1, seed: 3 + j }, (P) => { P.laneBias = b; })), TB = rB[0].T;
const runs = rB.map((r, j) => save(`posnetek_balea_20261104-12${j}0.rrp`, r));
const r2 = tool(runs, path.join(OUT, 'balea.json')), pB = r2.prof && r2.prof.proge && r2.prof.proge[0];
console.log(r2.text.split('\n').slice(0, 6).map(l => '  | ' + l).join('\n'));
check('open road: one profile, each run a lap (»vožnja«), all three used, »najmanj« (3-5 runs)', r2.code === 0 && pB && pB.odprta && r2.prof.proge.length === 1 && pB.krogi.uporabljeni.length === 3 && pB.natancnost.ocena === 'najmanj' && /vožnja \d/.test(r2.text),
  pB ? `${pB.krogi.uporabljeni.length} used, ${pB.natancnost.ocena}, ${pB.s.length} points over ${pB.dolzina} m` : r2.text.slice(0, 300));
if (pB) {
  // (where the 1.5 m line still fits on the road: the autopilot keeps 1.25 m from the edge, Core aiDrive)
  const fr = pB.s.map((s, i) => i).filter(i => pB.d[i] != null && pB.n[i] === 3 && pB.rl[i] < TB.wAt(TB.idx(TB.startS + pB.s[i])) - 1.25 - 1.5 - 0.1), off = mean(fr.map(i => pB.d[i] - pB.rl[i]));
  const s0 = pB.n.findIndex(x => x === 3) * pB.korak;   // (the standing start from the line left out up to the first corner, as a circuit's first lap: the AI's cars are already moving from the grid behind it)
  check(`open road: the whole run from the first corner (the standing start left out) to the finish (${(TB.raceLen / 1000).toFixed(1)} km), the line 1 m right of the racing line on average (±0.25 m)`, Math.abs(pB.dolzina - TB.raceLen) < 50 && s0 > 0 && s0 <= 500 && pB.krogi.uporabljeni.every(k => k.izpusceno_m && k.izpusceno_m.start > 0) && pB.n[pB.n.length - 2] === 3 && fr.length > 100 && Math.abs(off - 1) < 0.25,
    `${off.toFixed(3)} m over ${fr.length} points, the start left out to ${s0} m`);
}

// 4. a changing weather (the header's wxs, js/game.js rrpOf): rain from 150 s into the dry race, full after 25 s: lap 1 dry, lap 2 left out
// while the road gets wet, later laps wet (40 s after the rain is full); the spin and the hit laps left out for their own reasons
{
  const H = Object.assign({}, dry.H, { wxs: { at: 150, dur: 25, r0: 0, r1: 1 }, rain: 1, wx: 'dez' });
  const r3 = tool([save('posnetek_bathurst_20261104-1300.rrp', dry, H)], path.join(OUT, 'menjava.json')), P3 = (r3.prof && r3.prof.proge) || [];
  const s3 = P3.find(p => p.vreme === 'suho'), w3 = P3.find(p => p.vreme === 'mokro');
  check('a changing weather: lap 1 in the dry profile, lap 2 left out (»vreme se spreminja«), laps 4, 5, 7 in the wet one', s3 && w3 && s3.krogi.uporabljeni.map(r => r.krog).join() === '1' && P3.some(p => p.krogi.izpusceni.some(r => r.krog === 2 && r.razlog === 'vreme se spreminja')) &&
    w3.krogi.uporabljeni.map(r => r.krog).join() === '4,5,7', P3.map(p => `${p.vreme}: ${p.krogi.uporabljeni.map(r => r.krog).join()} / ${p.krogi.izpusceni.map(r => r.krog + ' ' + r.razlog).join(', ')}`).join(' | '));
}

// 5. Korak 2: the game's data (--js, with --k0 / --ks) from the dry Bathurst laps and a race on it: every AI car of the class steers by the
// player's line (c.uRl: the racing line plus dd) and drives at their pace (c.uT); all finish, none put back, about as quick as the race's
// own AI (the laps were the autopilot's: the same pace); a race without the profile has none of it
{
  const js = path.join(OUT, 'voznja.js'), r6 = tool([fDry], path.join(OUT, 'igra.json'), ['--js', js, '--k0', '0.97', '--ks', '1.2']);
  const cx = vm.createContext({}); let L = null;
  try { vm.runInContext(fs.readFileSync(js, 'utf8') + '\n;this.L = VOZNJA_PROFILI;', cx); L = cx.L; } catch (e) { L = null; }
  const V = L && L.find(p => p.proga === 'bathurst' && p.vreme === 'suho'), nP = V ? V.vq.length : 0;
  check('the game\'s data: one dry Bathurst profile of the averages only (dd, vq, pl, ql, qh, k0, ks; no lap of its own), every point between 0 and 2 of the pace', r6.code === 0 && L && L.length === 1 && V && V.korak === 5 && V.dd.length === nP && V.pl.length === nP && V.ql && V.qh && V.k0 === 0.97 && V.ks === 1.2 && V.vq.every(x => x >= 0 && x < 2) && !('krogi' in V) && !('d' in V),
    V ? `${nP} points, ${V.krogov} laps, k0 ${V.k0}, ks ${V.ks}` : `exit ${r6.code}`);
  if (V) {
    const T = new C.Track(C.TRACKS.find(d => d.id === 'bathurst')), M = C.MODELS.find(m => m.id === V.avto), orig = Math.random;
    const run = (voz) => {
      Math.random = seeded(5);
      try {
        const r = new C.Race(T, { numAI: 3, playerGrid: 4, playerModel: M, assist: 2, laps: 1, seed: 5, difficulty: 1, damage: 0, voznja: voz });
        r.start(); const AI = r.cars.filter(c => !c.isPlayer), P = r.player; let resc = 0;
        for (let k = 1; k < 120 * 400 && !AI.every(c => c.finished); k++) {
          Math.random = seeded(9000 + k);
          const pre = AI.map(c => r.putT && r.putT.get(c));
          if (!P.finished) { C.aiControl(P, r, DT); if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
          r.step(DT); AI.forEach((c, j) => { if (r.putT && r.putT.get(c) !== pre[j]) resc++; });
        }
        return { AI, resc, t: AI.map(c => c.finished ? c.finishTime : NaN) };
      } finally { Math.random = orig; }
    };
    const a = run([V]), b = run(undefined), mA = mean(a.t), mB = mean(b.t);
    const lineOk = a.AI.every(c => c.uRl && c.uT && Math.abs(c.uRl[100] - T.rl[100]) < 3);
    check('a race on it: all three AI cars steer by the player\'s line and drive at their pace, finish, none put back; within 4 % of the race\'s own AI (the laps were the autopilot\'s); without the profile none of it', lineOk && a.t.every(Number.isFinite) && b.t.every(Number.isFinite) && a.resc === 0 && Math.abs(mA / mB - 1) < 0.04 && b.AI.every(c => !c.uT),
      `profile ${a.t.map(x => x.toFixed(1)).join(' / ')} s, own AI ${b.t.map(x => x.toFixed(1)).join(' / ')} s, put back ${a.resc}`);
  }
}

// 6. a file that is no recording, a missing argument
{
  const f = path.join(OUT, 'posnetek_nic.rrp'); fs.writeFileSync(f, Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const r4 = tool([f], path.join(OUT, 'nic.json')), r5 = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'voznja.mjs')], { encoding: 'utf8' });
  check('not a recording: left out with the reason (»to ni posnetek igre«), exit 1; no file given: usage, exit 2', r4.code === 1 && /posnetek_nic\.rrp: posnetka ni mogoče prebrati: to ni posnetek igre/.test(r4.text) && r5.status === 2 && /usage/.test(r5.stdout),
    `exit ${r4.code} / ${r5.status}`);
}

// 7. Korak 3: the player's style for the tracks without their profile (VOZNJA_SLOG in js/data/voznja.js, tools/voznja.mjs --slog, Race._voznja
// with Core.voznjaIzSloga): the tool makes the file's style anew from its own profiles as it is (the data are the tool's), the profiles left
// as they were; on Spa (a circuit with pits) and Rio do Rastro (an open road of hairpins), five AI cars in a race on it: each on the style's
// line (wider than the racing line at the apexes of the hairpins and tight corners, on it along the straights) and at its pace, all finish,
// none put back, quicker than the race's own AI but not by more than the player on Tianmen is (cas_q, with some room); Tianmen: the cars of
// the profile's class by the profile, the others by the style; none of it in the rain, on a track still to be chosen (Bathurst) or a test
// one, and none of its pace on a makadam road (Katu-Jaryk: the source track was asphalt)
{
  const src = path.join(ROOT, 'js', 'data', 'voznja.js'), cp = path.join(OUT, 'voznja-slog.js');
  fs.copyFileSync(src, cp);
  const r7 = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'voznja.mjs'), '--slog', cp], { encoding: 'utf8', timeout: 600000 });
  const read = (f) => { const cx = vm.createContext({}); try { vm.runInContext(fs.readFileSync(f, 'utf8') + '\n;this.L = VOZNJA_PROFILI; this.S = VOZNJA_SLOG;', cx); } catch (e) { return {}; } return cx; };
  const G = read(src), G2 = read(cp), S = G.S, K = S && S.razredi;
  const shape = !!K && K.length >= 1 && K.every((c, j) => c.vq.length === S.fe.length && c.pl.length === S.fe.length && c.ql.length === S.fe.length && c.qh.length === S.fe.length && c.dd.length === S.m.length && (!j || c.r > K[j - 1].r) && !('rob' in c));
  check('the style: from Tianmen\'s dry profile, its classes by the apex\'s radius (each table one value per node), no verge, previdno 0-1; the tool makes it anew as it is, the profiles left as they were',
    r7.status === 0 && shape && S.iz.includes('tianmen') && S.previdno > 0 && S.previdno <= 1 && JSON.stringify(G2.S) === JSON.stringify(S) && JSON.stringify(G2.L) === JSON.stringify(G.L),
    K ? K.map(c => `r ${c.r} m: ${c.ovinkov} corners, apex vq ${c.vq[c.vq.length - 1]}`).join('; ') + `, previdno ${S.previdno}` : `exit ${r7.status}`);
  if (S) {
    const orig = Math.random;
    const race = (def, opts, sim) => {
      const T = new C.Track(def);
      Math.random = seeded(5);
      try {
        const r = new C.Race(T, Object.assign({ numAI: 5, playerGrid: 6, assist: 2, laps: 1, seed: 5, difficulty: 1, damage: 0 }, opts)), AI = r.cars.filter(c => !c.isPlayer);
        if (!sim) return { T, r, AI };
        r.start(); const P = r.player; let resc = 0;
        for (let k = 1; k < 400 / DT && !AI.every(c => c.finished); k++) {
          Math.random = seeded(9000 + k);
          const pre = AI.map(c => r.putT && r.putT.get(c));
          if (!P.finished) { C.aiControl(P, r, DT); if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
          r.step(DT); AI.forEach((c, j) => { if (r.putT && r.putT.get(c) !== pre[j]) resc++; });
        }
        return { T, r, AI, resc, t: AI.map(c => c.finished ? c.finishTime : NaN) };
      } finally { Math.random = orig; }
    };
    const cq = (G.L.find(p => p.proga === 'tianmen' && p.vreme === 'suho') || {}).cas_q || 0.95;
    for (const id of ['spa', 'rastro']) {
      const def = C.TRACKS.find(d => d.id === id), a = race(def, { voznja: [S] }, true), b = race(def, {}, true), T = a.T;
      const F = C.voznjaFaze(T, a.r.vprof), N = T.N, tight = F.C.filter(c => c.R < 30);
      // the line: at the apexes of the hairpins and tight corners wider than the racing line (toward the outside), along the straights on it
      const wide = (c) => tight.filter(A => (c.uRl[A.i] - T.rl[A.i]) * A.dir < -0.3).length;
      let flat = true; for (let i = 0; i < N; i++) if (F.lk[i] >= 0 && Math.abs(F.lm[i]) > 95) for (const c of a.AI) if (Math.abs(c.uRl[i] - T.rl[i]) > 1e-4) flat = false;
      const mA = mean(a.t), mB = mean(b.t), q = mA / mB;
      check(`${def.name}: five AI cars on the style (its line: wider at the apexes of the ${tight.length} hairpins and tight corners, on the racing line along the straights), all finish, none put back, quicker than the race's own AI by no more than the player on Tianmen (${cq})`,
        tight.length >= 2 && a.AI.every(c => c.uT && c.uRl && wide(c) >= 0.8 * tight.length) && flat && a.t.every(Number.isFinite) && b.t.every(Number.isFinite) && a.resc === 0 && q < 1 && q > cq - 0.05,
        `style ${a.t.map(x => x.toFixed(1)).join(' / ')} s, own AI ${b.t.map(x => x.toFixed(1)).join(' / ')} s (${q.toFixed(3)}), wider at ${a.AI.map(wide).join('/')} of ${tight.length} apexes, put back ${a.resc}`);
    }
    // Tianmen: the cars of the profile's class (Perun) by the profile, the others (the default field) by the style; the uT arrays as a race on that source alone
    const tdef = C.TRACKS.find(d => d.id === 'tianmen'), V = G.L.find(p => p.proga === 'tianmen' && p.vreme === 'suho'), perun = C.MODELS.find(m => m.id === 'perun');
    const same = (x, y) => x.AI.every((c, j) => c.uT && y.AI[j].uT && c.uT.length === y.AI[j].uT.length && c.uT.every((u, i) => u === y.AI[j].uT[i] || (u !== u && y.AI[j].uT[i] !== y.AI[j].uT[i])));
    const tA = race(tdef, { voznja: [V, S] }), tS = race(tdef, { voznja: [S] }), tP = race(tdef, { voznja: [V, S], playerModel: perun }), tV = race(tdef, { voznja: [V], playerModel: perun });
    check('Tianmen: the rivals of the profile\'s class (Perun) by the player\'s profile, the others by the style',
      !!V && tA.AI.every(c => !V.razred.includes(c.m.id)) && same(tA, tS) && tP.AI.every(c => V.razred.includes(c.m.id)) && same(tP, tV), `${tA.AI.map(c => c.m.id).join('/')} | ${tP.AI.map(c => c.m.id).join('/')}`);
    // none in the rain, on a track still to be chosen (pending: Bathurst's definition with the flag, as it was until the user's choice on 9. 11. 2026,
    // when it became a real track again) or Spa as a test track, nor for a semi-trailer (the tankers' race on Spa);
    // on a makadam road (Katu-Jaryk, a stage without rivals: the style made for it) the line but none of the pace
    const spa = C.TRACKS.find(d => d.id === 'spa'), wet = race(spa, { voznja: [S], rain: 1 }), bt = race(Object.assign({}, C.TRACKS.find(d => d.id === 'bathurst'), { pending: true }), { voznja: [S] }), tst =race(Object.assign({}, spa, { test: true }), { voznja: [S] }), tl = race(spa, { voznja: [S], playerModel: C.MODELS.find(m => m.id === 'cisterna') });
    const mk = race(C.TRACKS.find(d => d.id === 'katu'), {}), PS = C.voznjaIzSloga(mk.T, mk.r.vprof, S), PR = C.voznjaIzSloga(new C.Track(C.TRACKS.find(d => d.id === 'rastro')), race(C.TRACKS.find(d => d.id === 'rastro'), {}).r.vprof, S);
    check('none of the style in the rain, on a pending track (Bathurst\'s definition with the flag), a test track or for a semi-trailer; on Katu-Jaryk (makadam) its line, none of its pace (wv 0), on Rio do Rastro (asphalt) its pace',
      [wet, bt, tst, tl].every(x => x.AI.every(c => !c.uT)) && tl.AI.every(c => c.tl) && mk.T.def.roadSurface === 'makadam' && !mk.T.def.test && PS.wv.every(x => x === 0) && PS.dd.some(x => Math.abs(x) > 0.5) && PR.wv.some(x => x > 0.5),
      `rain ${wet.AI.filter(c => c.uT).length}, pending ${bt.AI.filter(c => c.uT).length}, test${tst.AI.filter(c => c.uT).length}, semi-trailers ${tl.AI.filter(c => c.uT).length} of 5; Katu-Jaryk wv max ${Math.max(...PS.wv).toFixed(2)}, Rio do Rastro ${Math.max(...PR.wv).toFixed(2)}`);
  }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
