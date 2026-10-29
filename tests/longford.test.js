// Longford, Tasmania: the 1960s road circuit at full scale. The track: its name, the lap's length against the official 4.5 miles, the main
// corners in lap order and the way each turns (def.bends: the S-bend under the viaduct, the hard right in the town, the Tannery corner, the
// left before the Long Bridge, the Newry hairpin, the kink on the Flying Mile, Mountford), the named places on the HUD in lap order, the
// heights (down past the water tower to the river flats, the steep climb out of Newry, nothing steeper than ~9 %), the walls close to the road
// on the two wooden bridges and under the viaduct; the pits where they were from 1959 (on the right of the Pit Straight between Mountford
// and the water tower) and a crashed car repaired in them; a whole race of 13 cars (12 AI + the player on autopilot) over two laps, in the
// dry and in the rain: every car finishes, the rain slower.
//   node tests/longford.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded, runScenario } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'longford'), T = new C.Track(def), L = T.len;
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const at = (d) => T.idx(T.startS + d);   // the sample d metres after the start line
const turn = (d, w) => { let s = 0; for (let x = d - w; x < d + w; x += T.ds) s += wrap(T.hd[at(x + T.ds)] - T.hd[at(x)]); return s; };   // the heading's change over d +- w (radians, + right)

// 1. the track: the name (a place and its country), a circuit of two laps, clockwise, the length against the official 4.5 miles (7.242 km)
{
  let tot = 0; for (let i = 0; i < T.N; i++) tot += wrap(T.hd[(i + 1) % T.N] - T.hd[i]);
  check('track: »Longford, Avstralija« / »Longford, Australia«, a closed circuit of 2 laps, the theme longford', def.name === 'Longford, Avstralija' && def.en.name === 'Longford, Australia' && !def.open && def.laps === 2 && def.theme === 'longford',
    `${def.name} / ${def.en.name}, laps ${def.laps}`);
  check('track: clockwise (the heading turns once round to the right over the lap)', Math.abs(tot - 2 * Math.PI) < 0.05, `${(tot * 57.3).toFixed(1)} degrees`);
  check('track: the lap within 4 % of the official 4.5 miles (7.242 km), as README says', def.realKm === 7.242 && Math.abs(L / 7242 - 1) < 0.04, `${(L / 1000).toFixed(3)} km, ${((L / 7242 - 1) * 100).toFixed(1)} %`);
}

// 2. the corners in lap order, each the way it turns: the S-bend under the viaduct (left, right), the town (right), the Tannery corner
// (right), the left before the Long Bridge, Newry (a right hairpin), the kink on the Flying Mile (left), Mountford (right)
{
  const B = def.bends, W = [18, 18, 30, 30, 30, 34, 160, 60], MIN = [50, 50, 70, 60, 20, 80, 8, 110];   // (each one's window, metres either side; the least it turns, degrees)
  const deg = B.map(([d], k) => turn(d, W[k]) * 57.3), dirs = B.map(([, dir]) => dir).join(','), order = B.every((b, k) => !k || b[0] > B[k - 1][0]);
  const ok = B.length === 8 && dirs === '-1,1,1,1,-1,1,-1,1' && order && deg.every((a, k) => Math.sign(a) === B[k][1] && Math.abs(a) >= MIN[k]);
  check('corners: 8 main ones in lap order, each turning its way (viaduct L R, town R, Tannery R, before the Long Bridge L, Newry R, Flying Mile L, Mountford R)', ok,
    B.map(([d], k) => `${Math.round(d)} m ${deg[k] > 0 ? '+' : ''}${deg[k].toFixed(0)}°`).join(', '));
  const sharp = T.corners.filter(c => c.sev >= 3).map(c => (((c.i0 * T.ds - T.startS) % L) + L) % L).sort((a, b) => a - b);
  check('corners: the slowest are the viaduct, the town, the Tannery corner, Newry and Mountford', [1170, 1940, 3640, 4314, 6698].every(d => sharp.some(s => Math.abs(s - d) < 70)),
    sharp.map(s => Math.round(s)).join(' '));
  const names = T.names.map(q => q.n).join(' | ');
  check('places on the HUD in lap order', names === 'Vodni stolp | Viadukt | Most čez South Esk | Longford | Nivojski prehod | Ravnina pri strojarni | Ovinek pri strojarni | Dolgi most | Newry | Leteča milja | Mountford'
    && T.names.every(q => q.say && q.say.length >= 2 && q.say.every(t => !/[čšžČŠŽ]/.test(t))), names);
}

// 3. the heights: the Pit Straight on the plateau, down past the water tower to the river flats (25+ m lower), the steep climb out of Newry
// (the steepest of the lap there), nothing steeper than ~9 %; the level crossing a little crest on the Tannery Straight
{
  const h = (d) => T.hy[at(d)], lo = Math.min(...Array.from(T.hy)), gmax = Math.max(...Array.from(T.grade, Math.abs));
  let climb = 0; for (let d = def.bends[5][0]; d < def.bends[5][0] + 250; d += T.ds) climb = Math.max(climb, T.grade[at(d)]);
  let elsewhere = 0; for (let d = 0; d < L; d += T.ds) if (d < def.bends[5][0] - 50 || d > def.bends[5][0] + 300) elsewhere = Math.max(elsewhere, Math.abs(T.grade[at(d)]));
  check('heights: from the water tower down to the viaduct 25+ m, the river flats the lowest part', h(def.lf.tower) - h(def.lf.viaduct) > 25 && Math.abs(lo - h(def.lf.viaduct)) < 4,
    `water tower ${h(def.lf.tower).toFixed(1)} m, viaduct ${h(def.lf.viaduct).toFixed(1)} m, lowest ${lo.toFixed(1)} m`);
  check('heights: the climb out of Newry 6+ % and the steepest of the lap, nowhere over 9.5 %', climb > 0.06 && climb >= elsewhere && gmax < 0.095,
    `Newry hill ${(climb * 100).toFixed(1)} %, elsewhere ${(elsewhere * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %`);
  const bump = (def.bumps || [])[0];
  check('the level crossing: a crest on the Tannery Straight (def.bumps)', bump && Math.abs(bump.at * L - def.lf.level) < 3 && bump.h > 0.3, bump ? `at ${Math.round(bump.at * L)} m, ${bump.h} m` : 'none');
}

// 4. the walls: on the two wooden bridges the railings close to the road (1 m past the edge), under the viaduct the piers' bales
{
  const close = (a, b, m) => { let mx = 0; for (let d = a; d < b; d += T.ds) { const i = at(d); mx = Math.max(mx, T.bl[i] - T.w, T.br[i] - T.w); } return mx < m ? null : mx; };
  const br = def.lf.bridges.map(([a, b]) => close(a + 10, b - 10, 1.05)), via = close(def.lf.viaduct - 20, def.lf.viaduct + 5, 1.5);
  check('walls: the railings of both wooden bridges 1 m past the road\'s edge, under the viaduct 1.4 m', def.lf.bridges.length === 2 && br.every(v => v === null) && via === null,
    `bridges ${def.lf.bridges.map(([a, b]) => Math.round(b - a) + ' m').join(', ')}${br.some(v => v) ? ', too wide ' + br : ''}${via ? ', viaduct ' + via.toFixed(2) : ''}`);
}

// 5. the pits: on the right of the Pit Straight, after Mountford and before the water tower; a crashed car is repaired in them
{
  const P = def.pit, p0 = T.pitAt(T.startS), pB = T.pitAt(T.startS + P[3]);
  check('pits: on the right of the Pit Straight between Mountford and the water tower, the player\'s box in the lane', P && P[1] > def.lf.mount && P[2] < def.lf.tower && p0 && p0.o > T.w && pB && pB.t > 0.99,
    `lane ${P[1]}..${P[2]} m (Mountford ${def.lf.mount} m, water tower ${def.lf.tower} m), offset ${p0 ? p0.o.toFixed(1) : '-'} m`);
  const r = runScenario(C, 'longford', 'crash', 'cs');
  check('pits: the crashed car is driven in and repaired', r.cover.dmg >= 0.2 && r.cover.repairs >= 1, JSON.stringify(r.cover));
}

// 6. a whole race, dry and in the rain: 12 AI and the player on autopilot over two laps, every car finishes, the rain slower
const race = (rain) => {
  const orig = Math.random;
  try {
    Math.random = seeded(3);
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain }), P = r.player; r.start();
    let t = 0, k = 0, resc = 0;
    while (t < 900 && r.cars.some(c => !c.finished)) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, winner: fin[0] ? fin[0].finishTime : null, last: fin.length ? fin[fin.length - 1].finishTime : null, resc };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race (dry): all 13 cars finish both laps', d.fin === 13 && d.cars === 13, `${d.fin}/${d.cars}, winner ${d.winner ? d.winner.toFixed(1) : '-'} s, last ${d.last ? d.last.toFixed(1) : '-'} s, player rescues ${d.resc}`);
  check('race (rain): all 13 cars finish both laps, slower than in the dry', w.fin === 13 && w.winner > d.winner, `${w.fin}/${w.cars}, winner ${w.winner ? w.winner.toFixed(1) : '-'} s (dry ${d.winner ? d.winner.toFixed(1) : '-'} s), player rescues ${w.resc}`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
