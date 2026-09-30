// Full AI races on every track with both physics (12 AI + the player on autopilot; Pikes Peak: time trial), to the finish,
// in the dry and in the rain ('/rain': every car with the wet grip, the AI's pace from it), and with the player in the formula car
// ('/formula': every car a formula, as in the game).
// Checks that every car finishes and compares with tests/golden/races.json: the exact result (finish order, finish times
// and the final state of every car, as a digest) must be the same. When it is not, the other values show how big the
// change is: spins (at most 2 more than the reference), wall contacts, rescues and the winner's time (within +-3 %).
// A race in the rain must also be slower than the same race in the dry, by 0.5-30 % (6-9 % on most tracks; the arcade cars' slow
// hairpins, where they turn by the slide rather than the grip, lose the least: Pikes Peak ~1 %).
//   node tests/races.test.js [--update] [--only=gozd,cs] [--only=spa,rain]
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore } = require('./lib/core.js');
const crypto = require('crypto');
const { DT, trackIds, PHYSICS, seeded, raceState } = require('./lib/sim.js');

const FILE = path.join(__dirname, 'golden', 'races.json');
const update = process.argv.includes('--update');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const C = loadCore();
const ref = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};

function race(tid, phys, rain, model) {
  const orig = Math.random;
  try {
    Math.random = seeded(3);
    const T = new C.Track(C.TRACKS.find(d => d.id === tid)), tt = !!T.def.timeTrial;
    const laps = tt || tid === 'nring' ? 1 : 2;
    const r = new C.Race(T, { numAI: tt ? 0 : 12, playerGrid: tt ? 1 : 12, laps, playerModel: model || C.MODELS[4], assist: 2, phys, seed: 11, difficulty: 1, rain });
    r.start();
    const P = r.player, st = new Map(r.cars.map(c => [c, { spins: 0, spinning: false, walls: 0, resc: 0 }]));
    const tmax = T.len * laps / 12 + 120;
    let t = 0, k = 0, nan = false;
    while (t < tmax && r.cars.some(c => !c.finished)) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      for (const c of r.cars) {
        const s = st.get(c); if (c.finished) continue;
        if (!Number.isFinite(c.x) || !Number.isFinite(c.speed)) nan = true;
        const b = Math.abs(c.beta || 0);
        if (b > 1.05 && !s.spinning) { s.spinning = true; s.spins++; } if (b < 0.5) s.spinning = false;
        if (c.hitWall > 3) s.walls++; c.hitWall = 0; c.hitCar = 0;
        if (c.isPlayer && (c.stuckT > 3 || c.wrongT > 3)) { r.rescue(c); s.resc++; }
      }
    }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    let spins = 0, walls = 0, resc = 0; for (const s of st.values()) { spins += s.spins; walls += s.walls; resc += s.resc; }
    const digest = crypto.createHash('sha256').update(fin.map(c => c.id + '@' + c.finishTime).join(',') + '\n' + raceState(r)).digest('hex').slice(0, 24);
    return { finished: fin.length, cars: r.cars.length, winner: fin[0] ? +fin[0].finishTime.toFixed(2) : null, spins, walls, rescues: resc, nan, digest };
  } finally { Math.random = orig; }
}

const out = {}; let bad = 0; const t0 = Date.now();
const FORMULA = C.MODELS.find(m => m.id === 'formula');
for (const tid of trackIds(C)) for (const phys of PHYSICS) for (const v of ['', 'rain', 'formula']) {
  const rain = v === 'rain' ? 1 : 0, key = `${tid}/${phys}` + (v ? '/' + v : '');
  if (only.length && !only.every(o => key.split('/').includes(o))) { if (ref[key]) out[key] = ref[key]; continue; }
  const r = race(tid, phys, rain, v === 'formula' ? FORMULA : null); out[key] = r;
  const g = ref[key], why = [], dry = rain && (out[`${tid}/${phys}`] || ref[`${tid}/${phys}`]);
  if (r.nan) why.push('NaN in car state');
  if (r.finished !== r.cars) why.push(`only ${r.finished}/${r.cars} finished`);
  if (dry && dry.winner && r.winner && !(r.winner / dry.winner > 1.005 && r.winner / dry.winner < 1.3)) why.push(`winner in the rain ${r.winner} s, dry ${dry.winner} s: not 0.5-30 % slower`);
  if (!update && g) {
    if (r.spins > g.spins + 2) why.push(`spins ${r.spins} (ref ${g.spins})`);
    if (r.walls > Math.max(g.walls * 1.5, g.walls + 10)) why.push(`wall contacts ${r.walls} (ref ${g.walls})`);
    if (r.rescues > g.rescues + 1) why.push(`rescues ${r.rescues} (ref ${g.rescues})`);
    if (g.winner && r.winner && Math.abs(r.winner / g.winner - 1) > 0.03) why.push(`winner ${r.winner} s (ref ${g.winner} s, more than 3 % off)`);
  }
  if (!update && !g) why.push('no reference');
  const changed = !update && g && g.digest !== r.digest;   // (a different result, even if every value above is within its limit)
  if (why.length || changed) bad++;
  console.log(`${key.padEnd(25)} fin ${r.finished}/${r.cars} winner ${String(r.winner).padStart(7)} s spins ${r.spins} walls ${r.walls} rescues ${r.rescues} ${r.digest} ` +
    (why.length ? 'FAIL: ' + why.join('; ') : changed ? `CHANGED: not the same result as the reference (was ${g.digest}, winner ${g.winner} s); if the change was intended: npm run golden:update` : 'OK'));
}
const secs = ((Date.now() - t0) / 1000).toFixed(0);
if (update) { if (bad) { console.log('not written: fix the failures first'); process.exit(1); } fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + '\n'); console.log(`written ${FILE} (${secs} s)`); }
else { console.log(bad ? `FAIL: ${bad} race(s)` : `OK: all races fine (${secs} s)`); process.exit(bad ? 1 : 0); }
