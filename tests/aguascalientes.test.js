// Aguascalientes, Mehika: the oval on the high plain south of the city of Aguascalientes (1.34 km, counter-clockwise; docs/proge/aguascalientes.md).
// The layout at its real length, counter-clockwise; its places by plain descriptions in their order round the lap, the four lefts each turning
// left (Turn 4, the end of the oval before the dogleg front stretch, the tightest); the heights (a plain at 1860 m: under 3 m from the lowest
// to the highest, the front stretch level); the pits on the left of the front stretch (the infield); the run-offs and the barriers all round;
// the scenery data (terrain, land cover, the hills on the horizon, two grandstands named after the places round it, the service roads; no
// names of the circuit or the airport); a whole AI race in the dry and in the rain.
//   node tests/aguascalientes.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'aguascalientes'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };

// 1. the track: its name (a place and its country), a closed circuit of 5 laps, 1.34 km within 3 % (realKm 1.41: the outer line), counter-clockwise,
// not a test track nor one waiting for a choice; at least 240 degrees of turning a kilometre (an oval: the game's smoothed line about 270)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: positive = counter-clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Aguascalientes, Mehika" (English "Aguascalientes, Mexico"), a closed circuit, 5 laps, 1.34 km within 3 %, counter-clockwise, not a test track, at least 240 °/km of turning',
    def.name === 'Aguascalientes, Mehika' && def.en.name === 'Aguascalientes, Mexico' && !T.open && def.laps === 5 && Math.abs(T.len / 1340 - 1) < 0.03 && def.realKm === 1.41 && area > 0 && !def.test && !def.pending && perKm > 240,
    `${T.len.toFixed(1)} m (${((T.len / 1340 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the places by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, the
// four lefts each turning left by at least 55 ° within 80 m of its place; the tightest radius on the centre line (Turn 4) a left, no bend
// under 50 m; the legs of the oval far apart; the 4 apexes (the number boards) in their order
{
  const order = ['Prvi levi', 'Drugi levi', 'Zadnja ravnina', 'Tretji levi', 'Četrti levi', 'Lomljena ravnina'], lefts = ['Prvi levi', 'Drugi levi', 'Tretji levi', 'Četrti levi'];
  const turn = (s) => { let a = 0; for (let d = -80; d <= 80; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('places: the 6 named places in their order round the lap (Turn 1 ... the dogleg front stretch), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => lefts.includes(c.nm)), bs = at.find(c => c.nm === 'Zadnja ravnina');
  check('places: the four turns each turn left by 55 ° or more, the back straight straight (under 10 °)', cs.length === 4 && cs.every(c => c.deg >= 55) && Math.abs(bs.deg) < 10,
    cs.map(c => `${c.nm} L ${Math.round(c.deg)}°`).join(', ') + `, back straight ${Math.round(bs.deg)}°`);
  let kmax = 0, ik = 0; for (let i = 0; i < T.N; i++) if (Math.abs(T.k[i]) > kmax) { kmax = Math.abs(T.k[i]); ik = i; }
  const t4 = near(...def.turns[3]).d, dk = dS(ik * T.ds);
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 250) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: the tightest bend Turn 4 (a left), no bend under a 50 m radius; the legs of the oval at least 100 m apart',
    1 / kmax >= 50 && Math.abs(dk - t4) < 40 && T.k[ik] < 0 && legs >= 100, `tightest radius ${(1 / kmax).toFixed(1)} m at ${Math.round(dk)} m (Turn 4 at ${Math.round(t4)} m), nearest legs ${legs.toFixed(1)} m`);
  check('track: the 4 turns\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 4 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: a plain about 1860 m above the sea, under 3 m from the lowest to the highest, nowhere steeper than 1.5 %; the front
// stretch level (the pits and the grandstand beside it: under 1 % from 230 m before the start line to 170 m after it)
{
  let lo = 1e9, hi = -1e9, g = 0; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i])); }
  let gm = 0; for (let d = -230; d <= 170; d += T.ds) gm = Math.max(gm, Math.abs(T.grade[T.idx(T.startS + d)]));
  check('heights: the circuit 1850-1870 m above the sea, under 3 m from the lowest to the highest, nowhere steeper than 1.5 %, the front stretch under 1 %',
    def.far.base > 1850 && def.far.base < 1870 && hi - lo < 3 && g <= 0.0151 && gm < 0.01, `${def.far.base} m a.s.l., ${(hi - lo).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %, the front stretch ${(gm * 100).toFixed(2)} %`);
}
// 4. the pits: the lane on the left of the front stretch (the infield) from Turn 4's exit to before Turn 1, past the start line, the stretch no
// tighter than a 120 m radius along the boxes (the dogleg), the 13 crews' boxes in the lane, the pit wall on the left along it; the run-offs:
// the barriers more than 3 m past the asphalt along 80 % of the lap or more, nowhere nearer than the pit wall (2.5 m): no car leaves the circuit
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = def.pitRow[0]; d <= def.pitRow[1]; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the left of the front stretch past the start line, no tighter than a 120 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall on the left along it',
    !!p0 && p0.t > 0.99 && p0.sd === -1 && P[0] < 0 && P[1] < -200 && P[2] > 150 && 1 / kmax > 120 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] - 100 && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === -1),
    `lane ${P[1]} .. ${P[2]} m, ${-P[0]} m to the left, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along 80 % of the lap or more, nowhere nearer than the pit wall (2.5 m)', wide / all >= 0.8 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/aguascalientes/build.py): terrain and land cover round the track, the hills on the horizon (heights above the
// circuit's plain, not saturated), the two grandstands (named after the places round it: the main one roofed, on the right of the front
// stretch) behind the barrier (9 m or more from the centre line), the service roads (OSM); only place names
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const names = 'AGUASCALIENTES,CALVILLO', roofed = def.stands.filter(s => s[4]).map(s => s[7]).join();
  let farIn = 0; for (const [a, b, sd] of def.stands) for (let d = a; d <= b; d += 5) { const i = T.idx(T.startS + d); if ((sd > 0 ? T.br[i] : T.bl[i]) < 9) farIn++; }
  check('scenery: terrain and land cover 300 m and more round the whole track; 2 grandstands (' + names + '), AGUASCALIENTES roofed, each on the right behind its barrier 9 m or more from the centre line; no sea',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.map(s => s[7]).join() === names && roofed === 'AGUASCALIENTES' && def.stands.every(s => s[2] === 1) && !farIn && !sk.sea, `roofed ${roofed}, ${farIn} stand places nearer`);
  const F = def.far, hb = Buffer.from(F.b64, 'base64'), hs = [...hb].map(v => F.lo + v * F.step);
  check('scenery: the hills and the sierras on the horizon (def.far, 10 rings to 11.5 km), their heights round the plain (1780-2800 m), none at the top of the scale',
    F.r.length === 10 && F.r[9] === 11500 && hb.length === F.na * 10 && Math.min(...hs) > 1700 && Math.max(...hs) < 2800 && Math.max(...hb) < 255, `${Math.min(...hs)} .. ${Math.max(...hs)} m`);
  const ways = (S) => { let nr = 0, np = 0, inb = 0, short = 0; for (let k = 0; k < S.length;) { const m = S[k]; nr++; if (m < 2) short++;
    for (let q = 0; q < m; q++) { const qq = near(S[k + 1 + q * 2], S[k + 2 + q * 2]); np++; if (Math.abs(qq.lat) < (qq.lat > 0 ? T.br[qq.i] : T.bl[qq.i])) inb++; } k += 1 + m * 2; } return { nr, np, inb, short }; };
  const sv = ways(sk.svc);
  check('scenery: 3 or more service roads (OSM), each of 2 points or more, at most a quarter of their points inside the barriers',
    sv.nr >= 3 && !sv.short && sv.inb / sv.np <= 0.25, `${sv.nr} roads, ${sv.np} points, ${sv.inb} inside the barriers`);
  const words = JSON.stringify([def.name, def.desc, def.en, def.names, def.stands.map(s => s[7])]);
  check('names: only places and plain descriptions (no name of the circuit, its races, sponsors or the airport)', !/autódromo|autodromo|racing circuit|raceway|formula|grand prix|\bgp\b|nascar|speedway|aeropuerto|airport|jes[uú]s ter[aá]n/i.test(words));
}
// 6. a whole race: 12 AI and the player on the autopilot, 3 laps, everyone to the finish without a rescue; in the rain 10-25 % slower (a third less grip in the wet: docs/dez-sneg.md)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 900 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] && fin[0].finishTime, resc };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race: 13 cars, 3 laps, all to the finish, no rescue; the winner in 1.5-3.5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 90 && d.win < 210, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 10-25 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.1 && w.win / d.win < 1.25, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} %)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
