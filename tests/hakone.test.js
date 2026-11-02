// Hakone (Japan, docs/proga-hakone.md): one lap of the public roads round Hakone, 26.8 km: national road 1 up from Yumoto to its top (874 m)
// and down to Moto-Hakone, the old Tōkaidō (road 732) through the Seven Bends back to Yumoto. A closed lap, one lap, 100 cars from a flying
// start as the Nordschleife (def.raceRivals 99, def.flyStart). The road: the OpenStreetMap line smoothed, the hairpins opened to a 10.5 m radius
// with their legs 21 m apart at least (tools/hakone/proga.py, in the repository's history), so no barrier reaches the other leg; the heights from Copernicus GLO-30, grades
// capped (10 % on road 1, 13 % on road 732, +0.5 % where the hairpins were flattened), the hairpins flatter than the legs between them. The
// 25 hairpins where the real road has them, each turning the way the data says; the places on the HUD in the order of the lap; one blue sign
// over the Seven Bends. A whole race as the game's Circuit race runs it (99 rivals, the flying start's column, the player at its back on the
// autopilot): every car home, the player never rescued, the Seven Bends driven down by all of them.
//   node tests/hakone.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'hakone'), T = new C.Track(def);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const at = (d) => (((T.startS + d) % T.len) + T.len) % T.len;   // (metres after the start line -> s)
const BASE = 97.3;   // (the start line's height above the sea: tools/menu-lens.js BASE, the terrain's dem.base)
const alt = (d) => T.hy[T.idx(at(d))] + BASE;

// 1. the track: a closed lap of 26.8 km, one lap, the start line at the origin, 100 cars from a flying start, its names
check('track: Hakone, Japonska (Hakone, Japan), a closed lap, one lap, theme hakone, two lanes 11 m wide, no pits, not marked for testing',
  def.name === 'Hakone, Japonska' && def.en && def.en.name === 'Hakone, Japan' && !T.open && def.laps === 1 && def.theme === 'hakone' && T.w === 5.5 && !def.pit && !def.test,
  `${def.name} / ${def.en && def.en.name}, laps ${def.laps}, half width ${T.w} m`);
check('track: the lap 26.5-26.9 km (the real road 26.8 km), the start line at the origin (by the station in Yumoto)', T.len > 26500 && T.len < 26900 && def.realKm === 26.8 &&
  Math.hypot(T.px[T.startIdx], T.pz[T.startIdx]) < 1.5, `${Math.round(T.len)} m, start ${T.px[T.startIdx].toFixed(1)}, ${T.pz[T.startIdx].toFixed(1)}`);
check('field: the Circuit race 99 rivals from a flying start (100 cars), a full field of 20 rivals at least in every other race',
  def.raceRivals === 99 && def.flyStart === true && def.rivals === 20, `raceRivals ${def.raceRivals}, flyStart ${def.flyStart}, rivals ${def.rivals}`);

// 2. the heights: from 97 m at the start to the road's top (~874 m: the surface model ~880) at ~13.4 km, down to Moto-Hakone (~790 m) and the
// old road back to Yumoto; grades within the caps, the hairpins flatter than the legs
{
  let iT = 0; for (let i = 0; i < T.N; i++) if (T.hy[i] > T.hy[iT]) iT = i;
  const dTop = ((iT * T.ds - T.startS) % T.len + T.len) % T.len, top = T.hy[iT] + BASE;
  const nmT = T.names.find(q => q.n === 'Vrh · 874 m'), nmM = T.names.find(q => q.n === 'Moto-Hakone');
  check('heights: the start at 97 m, the top of the road 870-885 m at 13.2-13.5 km (the HUD\'s "Vrh · 874 m" within 150 m of it), Moto-Hakone 770-810 m, the lowest point near Sanmaibashi (85-95 m)',
    Math.abs(alt(0) - BASE) < 0.5 && top > 870 && top < 885 && dTop > 13200 && dTop < 13500 && nmT && Math.abs(nmT.d - dTop) < 150 && nmM && alt(nmM.d) > 770 && alt(nmM.d) < 810 &&
    Math.min(...T.hy) + BASE > 84 && Math.min(...T.hy) + BASE < 96,
    `start ${alt(0).toFixed(1)} m, top ${top.toFixed(1)} m at ${Math.round(dTop)} m, Moto-Hakone ${nmM ? alt(nmM.d).toFixed(0) : '-'} m, lowest ${(Math.min(...T.hy) + BASE).toFixed(1)} m`);
  const r732 = (d) => d > 15480 && d < 26265;   // (road 732: from the Hatajuku junction to Sanmaibashi, metres after the start line)
  let g1 = 0, g2 = 0; for (let i = 0; i < T.N; i++) { const d = ((i * T.ds - T.startS) % T.len + T.len) % T.len, g = Math.abs(T.grade[i]); if (r732(d)) g2 = Math.max(g2, g); else g1 = Math.max(g1, g); }
  check('grades: road 1 at most ~10.5 %, the old road 732 at most ~13.5 % (the real caps, +0.5 % where the hairpins were flattened)', g1 < 0.107 && g2 < 0.137, `road 1 ${(g1 * 100).toFixed(1)} %, road 732 ${(g2 * 100).toFixed(1)} %`);
}

// 3. the 25 hairpins (def.hairpins: OpenStreetMap's, a turn of 150 degrees within 80 m): each turning over 150 degrees within 80 m through it, the
// way the data says, 7 on road 1 and 18 on road 732; none tighter than the 10.5 m the line was opened to; flatter than the legs next to them (in
// the Seven Bends too, where the legs are at the cap)
const HP = def.hairpins || [];
{
  const turnW = (a) => { let s = 0; for (let k = 0, i = T.idx(at(a)); k < 40; k++, i = (i + 1) % T.N) s += wrap(T.hd[(i + 1) % T.N] - T.hd[i]); return s; };   // (the turn over 80 m from a)
  const turn = HP.map(([d]) => { let best = 0; for (let x = -80; x <= 0; x += 2) { const t = turnW(d + x); if (Math.abs(t) > Math.abs(best)) best = t; } return best; });   // (the most over 80 m through it: the data's rule)
  const order = HP.every((h, k) => !k || h[0] > HP[k - 1][0] + 50);
  check('hairpins: 25 in the order of the lap (7 on road 1, 18 on road 732), each turning over 150 degrees within 80 m through it, the way the data says',
    HP.length === 25 && order && HP.filter(h => h[4] === '1').length === 7 && HP.filter(h => h[4] === '732').length === 18 && turn.every((a, k) => Math.abs(a) > 2.5 && Math.sign(a) === HP[k][2]),
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}`);
  let kmax = 0, kat = 0; for (let i = 0; i < T.N; i++) if (Math.abs(T.k[i]) > kmax) { kmax = Math.abs(T.k[i]); kat = i * T.ds - T.startS; }
  check('hairpins: no bend tighter than ~10.5 m (the game\'s own curvature)', 1 / kmax > 10.3, `tightest ${(1 / kmax).toFixed(2)} m at ${Math.round(kat)} m`);
  let gin = 0, nin = 0, gout = 0, nout = 0;
  for (let i = 0; i < T.N; i++) { const d = ((i * T.ds - T.startS) % T.len + T.len) % T.len, m = Math.min(...HP.map(h => Math.abs(d - h[0]))), g = Math.abs(T.grade[i]);
    if (m < 10) { gin += g; nin++; } else if (m > 30 && m < 120) { gout += g; nout++; } }
  check('hairpins: flatter than the legs next to them (within 10 m of the hairpin against 30-120 m from it: three quarters of their grade at most)', gin / nin < 0.75 * gout / nout,
    `in the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %`);
}

// 4. the ladders: the legs of every hairpin at least 20 m apart (no barrier reaches the other leg), the barriers 3.4 m past the road's edges at
// least, the line never crossing itself
{
  let dmin = 1e9, dat = 0;
  for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { if (T.N - j + i < 40) continue; const d = Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]); if (d < dmin) { dmin = d; dat = i * T.ds - T.startS; } }
  let bmin = 1e9; for (let i = 0; i < T.N; i++) bmin = Math.min(bmin, T.bl[i], T.br[i]);
  check('ladders: the legs 20 m apart or more, the barriers at least 3.4 m past the asphalt, no crossing', dmin >= 20 && bmin >= T.w + 3.4 - 1e-3 && !T.cross.length,
    `legs ${dmin.toFixed(1)} m apart at the closest (${Math.round(dat)} m), barriers ${(bmin - T.w).toFixed(2)} m past the edge, ${T.cross.length} crossings`);
}

// 5. the places on the HUD in the order of the lap (only the places' names), the commentator's lines for the main ones; the bridges
{
  const want = ['Yumoto', 'Tōnosawa', 'Deyama', 'Ōhiradai', 'Sennindai', 'Miyanoshita', 'Sokokura', 'Kowakidani', 'Ninotaira', 'Ashinoyu', 'Vrh · 874 m', 'Jezero Shōjin', 'Moto-Hakone',
    'Otama-ga-ike', 'Sarusuberi', 'Sedem ovinkov', 'Hatajuku', 'Sukumogawa', 'Yumoto-chaya', 'Okuyumoto', 'Sanmaibashi'];
  check('places: the 21 places of the lap in its order (Yumoto … Sanmaibashi), the commentator\'s lines for 12 of them', T.names.map(q => q.n).join('|') === want.join('|') && T.names.every((q, k) => !k || q.d > T.names[k - 1].d) &&
    T.names.filter(q => q.say).length >= 12, T.names.map(q => q.n + ' ' + Math.round(q.d)).join(', '));
  const san = T.names.find(q => q.n === 'Sanmaibashi'), ohi = T.names.find(q => q.n === 'Ōhiradai'), sev = T.names.find(q => q.n === 'Sedem ovinkov');
  let tS = 0; for (let k = 0, i = T.idx(at(san.d)); k < 50; k++, i = (i + 1) % T.N) tS += wrap(T.hd[(i + 1) % T.N] - T.hd[i]);
  check('places: Sanmaibashi before the sharp left onto road 1 (~90 degrees), Ōhiradai before the first hairpin, the Seven Bends before their first hairpin',
    tS < -1.3 && tS > -1.8 && HP[0][0] - ohi.d > 0 && HP[0][0] - ohi.d < 80 && HP[10][0] - sev.d > 0 && HP[10][0] - sev.d < 80, `the turn at Sanmaibashi ${Math.round(tS * 57.3)} degrees`);
  const B = def.bridges || [];
  check('bridges: the 19 of the lap, in order, each within it', B.length === 19 && B.every(([a, b], k) => a < b && b - a < 70 && a > 0 && b < T.len && (!k || a > B[k - 1][1])), `${B.length} bridges`);
}

// 6. the HUD's signs: one blue sign of a series of bends over all twelve hairpins of the Seven Bends (up while the cars are in them), the
// hairpin at Ōhiradai one red hairpin sign
{
  const H = T.hudSigns(), blue = H.filter(g => g.kind === 'chic'), seven = HP.slice(10, 22);
  const sv = blue.find(g => seven.every(h => at(h[0]) > g.s0 && at(h[0]) < g.s1));
  const oh = H.find(g => g.kind === 'bend' && at(HP[0][0]) > g.s0 && at(HP[0][0]) < g.s1);
  check('signs: one blue sign over the Seven Bends (all 12 hairpins inside it), a red hairpin sign at Ōhiradai, no other blue sign', blue.length === 1 && !!sv && !!oh && oh.hair && oh.sev === 3,
    `${blue.length} blue: ${blue.map(g => Math.round(g.s0) + '-' + Math.round(g.s1)).join(', ')}; Ōhiradai ${oh ? oh.kind + ' sev ' + oh.sev + (oh.hair ? ' hairpin' : '') : 'none'}`);
}

// 7. the scenery's data: the terrain round the road (dem: its zero the start line's height) and the land cover (lc)
check('scenery data: the terrain (dem, 32 m cells, its zero the start line\'s 97.3 m) and the land cover (lc, 16 m cells) cover the whole lap',
  def.dem && def.dem.cell === 32 && Math.abs(def.dem.base - BASE) < 0.05 && def.lc && def.lc.cell === 16 &&
  T.px.every((x, i) => x > def.dem.x0 && x < def.dem.x0 + def.dem.nx * 32 && T.pz[i] > def.dem.z0 && T.pz[i] < def.dem.z0 + def.dem.nz * 32), `dem ${def.dem.nx} x ${def.dem.nz}, lc ${def.lc.nx} x ${def.lc.nz}`);

// 8. the game's Circuit race: 100 cars from the flying start's column (FLY_T 3 s), the player at its back on the autopilot (rescued when stuck, as
// a player would press the button); every car home, no NaN, the player never rescued, the whole field down the Seven Bends
{
  const orig = Math.random; Math.random = seeded(3);
  const M = C.MODELS[4];
  const r = new C.Race(T, { numAI: def.raceRivals, playerGrid: 99, laps: 1, tt: false, playerModel: M, playerNum: M.num || 1, assist: 2, phys: 'cs', seed: 11, difficulty: 1, flying: 3, chars: true, slip: true, flags: true, damage: 2 });
  r.start();
  const P = r.player, d0 = r.cars.map(c => c.dist), onRoad = r.cars.every(c => Math.abs(c.q.d) < T.w);
  check('the start: 100 cars in the flying start\'s column, every one on the road and rolling, the player at its back below the line', r.cars.length === 100 && r.flyOn && onRoad && r.cars.every(c => c.speed > 8) && P.dist === Math.min(...d0) && P.dist < 0,
    `the player ${(-P.dist).toFixed(0)} m below the line, the first ${Math.max(...d0).toFixed(0)} m past it`);
  let t = 0, k = 0, resc = 0, nan = 0, aiResc = 0; const t0 = Date.now(), sevS = at(HP[10][0] - 40), sevE = at(HP[21][0] + 40), down = new Set();
  const or = r.rescue; r.rescue = function (c) { if (c !== P) aiResc++; return or.call(this, c); };
  while (t < 1500 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    if (k % 30 === 0) for (const c of r.cars) { if (![c.x, c.z, c.speed, c.dist].every(Number.isFinite)) nan++; if (c.q && c.q.s > sevE && c.q.s < sevE + 200 && c.dist > sevS) down.add(c); }
  }
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
  check('the race: all 100 cars home after the one lap, the whole field down the Seven Bends, no NaN, the player never rescued, the AI hardly ever',
    fin.length === 100 && down.size === 100 && !nan && !resc && aiResc <= 3,
    `${fin.length}/100 home, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, last ${fin.length ? fin[fin.length - 1].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s); ` +
    `${down.size} past the Seven Bends; rescues: player ${resc}, AI ${aiResc}; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  check('the race: the lap in 12-16 minutes (the winner), the field home within 3 minutes of the winner', fin.length && fin[0].finishTime > 720 && fin[0].finishTime < 960 && fin[fin.length - 1].finishTime - fin[0].finishTime < 180,
    fin.length ? `${fin[0].finishTime.toFixed(0)} s to ${fin[fin.length - 1].finishTime.toFixed(0)} s` : '');
  const ai = r.cars.filter(c => !c.isPlayer); console.log(`     (AI damage over 20 %: ${ai.filter(c => c.dmg > 0.2).length} of ${ai.length}, over 50 %: ${ai.filter(c => c.dmg > 0.5).length}; not checked)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
