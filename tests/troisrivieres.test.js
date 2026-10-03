// Trois-Rivières: the street circuit round the exhibition grounds of Trois-Rivières (Québec, Canada) at its real scale (2.448 km, 11 turns,
// anticlockwise). The circuit: its length within 1 % of the real one, the eleven turns in order, each turning the way it does on the real
// streets (Turn 3 the tight left through the gateway, Turn 9 the hairpin); the pit lane on the left of the main straight (the inside of the
// lap) and a stop in it on the autopilot; the walls along the kerbs, set back across the mouths of the streets that meet it. A whole race
// (12 AI + the player on the autopilot), dry and in the rain: everyone finishes. The street furniture at the junctions (def.streetProps,
// Core's knockable kinds): inside the barriers, and a car driven into a traffic light, a STOP sign and a hydrant knocks each over and drives on.
//   node tests/troisrivieres.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'troisrivieres'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const L = T.len, dOf = (i) => (((i * T.ds - T.startS) % L) + L) % L;

// 1. the circuit: closed, its name as the rules want it, the real length (2.448 km) within 1 %, six laps
check('track: a closed circuit "Trois-Rivières, Kanada", 2.448 km within 1 %, 6 laps', !def.open && def.name === 'Trois-Rivières, Kanada' && def.en.name === 'Trois-Rivières, Canada' &&
  Math.abs(T.len / 1000 - def.realKm) / def.realKm < 0.01 && def.realKm === 2.448 && def.laps === 6, `${T.len.toFixed(1)} m (real ${def.realKm * 1000} m, ${((T.len / 1000 / def.realKm - 1) * 100).toFixed(2)} %)`);

// 2. the eleven turns, in order round the lap, each turning its real way (R L L L L L R L L R L): the heading's change from halfway to the
// turn before to halfway to the turn after
{
  const want = [1, -1, -1, -1, -1, -1, 1, -1, -1, 1, -1], tI = def.turns.map(([x, z]) => T.nearestIdx(x, z)), tD = tI.map(dOf);
  const order = tD.every((d, k) => !k || d > tD[k - 1]);
  const turn = tD.map((d, k) => { const a = k ? (d + tD[k - 1]) / 2 : d - 60, b = k < tD.length - 1 ? (d + tD[k + 1]) / 2 : d + 40; let s = 0; for (let x = a; x < b; x += T.ds) { const i = T.idx(T.startS + x), j = T.idx(T.startS + x + T.ds); s += wrap(T.hd[j] - T.hd[i]); } return s; });
  check('turns: eleven, in order round the lap, each the real way (right +, left -), the hairpin over 120 degrees, Turn 3 (the gate) a sharp left', tD.length === 11 && order && turn.every((a, k) => Math.sign(a) === want[k] && Math.abs(a) > 0.12) &&
    Math.abs(turn[8]) > 2.1 && turn[2] < -1.2 && T.names.filter(q => /^Zavoj \d+$/.test(q.n)).length === 11,
    turn.map((a, k) => `T${k + 1} ${Math.round(a * 57.3)}°`).join(' '));
}

// 3. the walls: 1.3 m past the asphalt along the kerbs, set back across the streets' mouths (by def.junctions)
{
  let near = 1e9; for (let i = 0; i < T.N; i++) near = Math.min(near, T.bl[i] - (T.wa ? T.wa[i] : T.w), T.br[i] - (T.wa ? T.wa[i] : T.w));
  const set = def.junctions.every(([d, sd, m]) => { const i = T.idx(T.startS + d); return (sd > 0 ? T.br[i] : T.bl[i]) - (T.wa ? T.wa[i] : T.w) > m - 0.5; });
  check('walls: along the kerbs (1.3 m past the asphalt at the closest), set back across each junction\'s mouth', Math.abs(near - 1.3) < 0.05 && set, `closest ${near.toFixed(2)} m, ${def.junctions.length} junctions`);
}

// 4. the pit lane: on the left of the main straight (the inside of the anticlockwise lap); a stop in it on the autopilot
{
  const pz = T.pitAt(T.startS - 150 + L);
  const o2 = Math.random; Math.random = seeded(7);
  const r = new C.Race(T, opts({ laps: 2, damage: 2, tyres: true })), P = r.player; r.start(); P.dmg = 0.5;
  let t = 0, minD = 0; const seq = [];
  while (t < 400 && !P.pitDone) { if (P.lap >= 1) P.pitWant = true; C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.pitState && seq[seq.length - 1] !== P.pitState) seq.push(P.pitState); if (P.inPit) minD = Math.min(minD, P.q.d); }
  Math.random = o2;
  check('pits: the lane on the left of the main straight; the player\'s stop on the autopilot: stop > repair > done, the car in the lane on the left',
    pz && pz.sd === -1 && def.pit[0] < 0 && seq.join('>') === 'stop>repair>done' && minD < -10, `lane ${pz ? (pz.o * pz.sd).toFixed(1) : '-'} m, ${seq.join(' > ')}, deepest ${minD.toFixed(1)} m`);
}

// 5. a whole race, dry and in the rain: everyone finishes
for (const rain of [0, 1]) {
  const o2 = Math.random; Math.random = seeded(5 + rain);
  const r = new C.Race(T, opts({ laps: 2, rain, damage: 1 })), P = r.player; r.start();
  let t = 0; while (t < 600 && r.cars.some(c => !c.finished)) { C.aiControl(P, r, DT); r.step(DT); t += DT; }
  Math.random = o2;
  const fin = r.cars.filter(c => c.finished).length;
  check(`race ${rain ? 'in the rain' : 'dry'}: 12 AI and the player on the autopilot, 2 laps, everyone finishes`, fin === r.cars.length, `${fin}/${r.cars.length} in ${t.toFixed(0)} s`);
}

// 6. the street furniture at the junctions: Core's kinds, all inside the barriers and off the asphalt; knocked over by a car that drives on
{
  const list = def.streetProps(T), kinds = new Set(list.map(p => p.kind)), q = {};
  const inside = list.every(p => { T.query(p.x, p.z, p.i, q); return Math.abs(q.d) > (T.wa ? T.wa[q.a] : T.w) + 0.3 && Math.abs(q.d) < (q.d > 0 ? q.br : q.bl) - 0.1; });
  check('street furniture: traffic lights, STOP signs, signs, hydrants, bins, lamps, bollards, a letter box, a cabinet, a bench and cones at the junctions, all on the verge inside the barriers',
    ['signal', 'stop', 'sign', 'hydrant', 'bin', 'lamp', 'bollard', 'mailbox', 'cabinet', 'bench', 'cone'].every(k => kinds.has(k)) && inside && list.length > 80, `${list.length} pieces, ${[...kinds].join(', ')}`);
  const res = ['signal', 'stop', 'hydrant', 'lamp'].map(kind => {
    const o2 = Math.random; Math.random = seeded(31);
    const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, damage: 2 })), P = r.player; r.start(); P.locked = false;
    r.setProps(list, null);
    const k = r.props.findIndex(b => b.kind === kind), b = r.props[k], x0 = b.x, z0 = b.z;
    T.query(b.x, b.z, b.qi, q); const sd = Math.sign(q.d), back = T.idx(q.s - 14), lat = sd * ((T.wa ? T.wa[back] : T.w) - 1.2), sx = T.px[back] + T.nx[back] * lat, sz = T.pz[back] + T.nz[back] * lat;   // (from the road, 14 m before it, straight at it)
    P.place(sx, sz, Math.atan2(b.z - sz, b.x - sx)); P.y = P.py = T.hy[back];
    const v0 = 14; P.vx = Math.cos(P.h) * v0; P.vz = Math.sin(P.h) * v0;
    let vHit = 0, vAfter = 0, hit = false, tAfter = 0, dHit = 0, dAfter = -1;
    for (let s = 0; s < 120 * 4; s++) { P.inThr = 0.35; P.inBrk = 0; P.inSteer = 0; r.step(DT); const moved = Math.hypot(b.x - x0, b.z - z0) > 0.5;
      if (moved && !hit) { hit = true; vHit = P.speed; dHit = P.dmg; } if (hit) { tAfter += DT; if (tAfter > 0.5 && !vAfter) { vAfter = P.speed; dAfter = P.dmg - dHit; } } }
    Math.random = o2;
    return { kind, ok: hit && Math.hypot(b.x - x0, b.z - z0) > 1 && vAfter > vHit * 0.6 && vAfter > 6 && dAfter >= 0 && dAfter < 0.15, txt: `${kind}: ${hit ? 'knocked ' + Math.hypot(b.x - x0, b.z - z0).toFixed(1) + ' m' : 'NOT hit'}, ${(vHit * 3.6).toFixed(0)} -> ${(vAfter * 3.6).toFixed(0)} km/h, damage +${dAfter.toFixed(2)}` };
  });
  check('street furniture: a car driven into a traffic light, a STOP sign, a hydrant and a lamp knocks each over and drives on (slower a little, a little damage)', res.every(x => x.ok), res.map(x => x.txt).join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
