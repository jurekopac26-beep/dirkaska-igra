// Sweep: races on real tracks, cs vs nova. node sweep.js <out.jsonl> <secs> <model|-> <tracks,...|all> [phys,...]
'use strict';
const ROOT = process.env.GAME_ROOT || require('path').resolve(__dirname, '../..');
const { loadCore } = require(ROOT + '/tests/lib/core.js');
const { seeded } = require(ROOT + '/tests/lib/sim.js');
const fs = require('fs');
const C = loadCore();
const DT = 1 / 120, D = 180 / Math.PI;
const [out, secsA, modelA, tracksA, physA, nAIA] = process.argv.slice(2);
const secs = +secsA || 150, nAI = nAIA != null ? +nAIA : 12;
const tracks = tracksA === 'all' || !tracksA ? C.TRACKS.filter(d => !d.test).map(d => d.id) : tracksA.split(',');
const physs = (physA || 'cs,nova').split(',');
const LOOSE = new Set([2, 3, 4, 5, 6, 7, 8]);   // (anything but asphalt 0 and kerb 1 counted as off)

function run(tid, phys, mid) {
  Math.random = seeded(64);
  const T = new C.Track(C.TRACKS.find(d => d.id === tid));
  const M = mid && mid !== '-' ? C.MODELS.find(m => m.id === mid) : null;
  const o = { numAI: nAI, playerGrid: nAI ? nAI : 1, laps: 50, assist: 2, seed: 9, difficulty: 1, damage: 2, phys };
  if (M) { o.playerModel = M; o.fieldModel = M; } else o.playerModel = C.MODELS[4];
  let race; try { race = new C.Race(T, o); } catch (e) { return { tid, phys, err: String(e).slice(0, 100) }; }
  race.start();
  const st = new Map();
  for (const c of race.cars) st.set(c, { hc: false, hw: false, sl: false, sl2: false, slow: 0, laps: [] });
  let hits = 0, walls = 0, slides = 0, slides20 = 0, nan = false, kerb = 0, off = 0, tot = 0, stuck = 0, bmax = 0, wmax = 0, sumB = 0, nB = 0;
  const t0 = Date.now();
  for (let k = 1; k <= secs / DT; k++) {
    Math.random = seeded(1000 + k);
    if (race.player) C.aiControl(race.player, race, DT);
    race.step(DT);
    for (const c of race.cars) {
      const S = st.get(c);
      if (!Number.isFinite(c.x + c.z + c.vx + c.vz + c.w + c.h)) nan = true;
      const h = c.hitCar > 3; if (h && !S.hc) hits++; S.hc = h; c.hitCar = 0;
      const hw = (c.hitWall || 0) > 3; if (hw && !S.hw) walls++; S.hw = hw;
      const b = Math.abs(c.beta || 0);
      const sl = b > 0.7 && c.speed > 8; if (sl && !S.sl) slides++; S.sl = sl;
      const sl2 = b > 0.35 && c.speed > 8; if (sl2 && !S.sl2) slides20++; S.sl2 = sl2;
      if (k * DT > 8 && c.speed > 15) { bmax = Math.max(bmax, b); wmax = Math.max(wmax, Math.abs(c.w)); sumB += b; nB++; }
      if (k * DT > 8) { tot++; if (c.onCurb) kerb++; if (c.ws && c.ws.some(s => LOOSE.has(s))) off++; }
      if (k * DT > 10 && c.speed < 2 && !c.inPit && !c.finished) { S.slow += DT; if (S.slow > 6) { stuck++; S.slow = -1e9; if (process.env.DBG) console.log("STUCK", c.id, c.name, (k*DT).toFixed(1), "s", c.q.s.toFixed(0), "d", c.q.d.toFixed(1), "ws", c.ws.join(""), "gear", c.gear, "thr", c.inThr.toFixed(2), "brk", c.inBrk.toFixed(2), "st", c.steer.toFixed(2), "h-road", ((c.h - Math.atan2(c.q.tz, c.q.tx)) * 57.3).toFixed(0), "stuckT", c.stuckT, "wall", c.hitWall); } } else if (S.slow > 0) S.slow = 0;
    }
  }
  const lt = []; for (const c of race.cars) if (c.lapTimes) for (let i = 1; i < c.lapTimes.length; i++) lt.push(c.lapTimes[i]);
  lt.sort((a, b) => a - b);
  const pl = race.player && race.player.lapTimes ? race.player.lapTimes.slice(1) : [];
  return { tid, phys, model: mid, n: race.cars.length, nan, stuck, hits, walls, slides, slides20, kerb: +(kerb / Math.max(1, tot)).toFixed(4), off: +(off / Math.max(1, tot)).toFixed(4),
    bmaxDeg: +(bmax * D).toFixed(1), bmeanDeg: +(sumB / Math.max(1, nB) * D).toFixed(2), wmax: +wmax.toFixed(2),
    lapBest: lt[0] || null, lapMed: lt.length ? lt[lt.length >> 1] : null, nLaps: lt.length, plLaps: pl.map(x => +x.toFixed(2)), dist: +(race.cars.reduce((s, c) => s + (c.dist || 0), 0) / race.cars.length).toFixed(0), ms: Date.now() - t0 };
}
for (const tid of tracks) for (const ph of physs) {
  let r; try { r = run(tid, ph, modelA); } catch (e) { r = { tid, phys: ph, err: String(e && e.stack || e).slice(0, 300) }; }
  fs.appendFileSync(out, JSON.stringify(r) + '\n');
}
