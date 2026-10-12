// Rio de Janeiro: the circuit at Jacarepagua (demolished in 2012) in its layout of the 1980s, on the shore of the lagoon. The track (its name,
// a closed circuit of 2 laps at its real scale: the length against the official 5.031 km, anticlockwise, flat), the 11 turns in their order,
// each turning its own way, the place names on the HUD, no names of people, brands, races or series in the game's text, the pits south of
// the pit straight (the player's box in the lane, a stop and a repair there), the lagoon, the land cover, the terrain and the
// skyline of the mountains in the track's data, and whole races with the AI in the dry and in the rain (everybody to the line).
//   node tests/rio.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'rio'), T = new C.Track(def);
const L = T.len, dS = (s) => ((s - T.startS) % L + L) % L;   // metres after the start line
const turn = (d, r) => { let a = 0; for (let s = d - r; s <= d + r; s += T.ds) a += T.k[T.idx(T.startS + s)] * T.ds; return a * 180 / Math.PI; };   // (+ right)

// 1. the track: its name (place, country), a closed circuit of two laps, in the big championship, its real scale
check('track: "Rio de Janeiro, Brazilija" (English "Rio de Janeiro, Brazil"), a closed circuit of 2 laps with pits, one of the real ones, in the big championship',
  def.name === 'Rio de Janeiro, Brazilija' && def.en.name === 'Rio de Janeiro, Brazil' && !def.open && !def.timeTrial && def.laps === 2 && !!def.pit && !def.test && /Jacarepaguá/.test(def.desc) && /Jacarepaguá/.test(def.en.desc) &&
    C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('rio'), `${def.name} / ${def.en.name}, ${def.laps} laps`);
{
  const diff = L / (def.realKm * 1000) - 1;
  check('track: the lap 4.85-4.95 km, within 3.5 % of the official 5.031 km (the mapped line cuts the corners a little)', def.realKm === 5.031 && L > 4850 && L < 4950 && diff < 0 && diff > -0.035,
    `${(L / 1000).toFixed(3)} km, ${(diff * 100).toFixed(1)} % against ${def.realKm} km`);
  let area = 0, tot = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * T.pz[j] - T.px[j] * T.pz[i]; tot += T.k[i] * T.ds; }
  check('track: anticlockwise (x east, z south: a negative area, the heading turns once round to the left)', area < 0 && Math.abs(tot * 180 / Math.PI + 360) < 5, `area ${(area / 2e6).toFixed(3)} km², turning ${(tot * 180 / Math.PI).toFixed(1)}°`);
  let h0 = 1e9, h1 = -1e9, g = 0; for (let i = 0; i < T.N; i++) { h0 = Math.min(h0, T.hy[i]); h1 = Math.max(h1, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i])); }
  check('track: flat (land reclaimed from the marsh): within 5 m, no grade over 2 %', h1 - h0 < 5 && g < 0.02, `${(h1 - h0).toFixed(2)} m, steepest ${(g * 100).toFixed(2)} %`);
  let near = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 60; j < T.N && j < i + T.N - 60; j += 2) near = Math.min(near, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]));
  check('track: no two parts of the lap closer than 60 m (the pit straight and the back straight 66 m apart)', near > 60, `${near.toFixed(1)} m`);
}

// 2. the 11 turns in their order along the lap, each its own way: 1 right (the long hairpin at the end of the pit straight), 2 and 3 left,
// 4 right, 5 the tight left hairpin, 6 and 7 left at the end of the back straight, 8 right, 9 left by the lagoon, 10 the left by the pits,
// 11 the right hairpin onto the pit straight
{
  // each turn's own stretch of the lap (metres after the start line, from the curvature of the centre line) and the way it turns
  const SPAN = [[234, 542], [654, 754], [874, 1080], [1322, 1588], [1596, 1814], [2730, 2894], [2922, 3072], [3150, 3256], [3396, 3780], [4056, 4140], [4380, 4564]];
  const DIR = [1, -1, -1, 1, -1, -1, -1, 1, -1, -1, 1], MIN = [160, 70, 100, 50, 160, 60, 50, 65, 160, 55, 140];
  const tt = def.turns.map(([x, z], k) => { const d = dS(T.nearestIdx(x, z) * T.ds), [a, b] = SPAN[k], ang = turn((a + b) / 2, (b - a) / 2 + 20); return { k: k + 1, d, a: ang, inSpan: d >= a && d <= b }; });
  check('turns: 11 numbered turns, in order along the lap from the start line, each number board in its turn', tt.length === 11 && tt.every((t, k) => (k === 0 || t.d > tt[k - 1].d) && t.inSpan), tt.map(t => `${t.k}@${Math.round(t.d)}`).join(' '));
  check('turns: each turns its own way (1 R, 2 L, 3 L, 4 R, 5 L, 6 L, 7 L, 8 R, 9 L, 10 L, 11 R), the hairpins (1, 5, 9, 11) round by 140-200°',
    tt.every((t, k) => Math.sign(t.a) === DIR[k] && Math.abs(t.a) > MIN[k] && Math.abs(t.a) < 210), tt.map(t => `${t.k}:${t.a > 0 ? 'R' : 'L'}${Math.abs(Math.round(t.a))}°`).join(' '));
  const nm = T.names.map(q => q.n);
  check('HUD: the turns by their numbers only, in order along the lap', nm.length >= 10 && nm.every(s => /^Zavoj \d+$/.test(s)) && T.names.every((q, k) => k === 0 || q.d > T.names[k - 1].d), nm.join(', '));
  const words = /piquet|pace|nonato|gir[aã]o|molykote|senna|prost|fittipaldi|grand prix|velik\w* nagrad|formul\w* ?1|\bf1\b|marlboro|rothmans|autódromo|autodromo/i;
  const txt = JSON.stringify({ n: def.name, d: def.desc, e: def.en, names: def.names, st: (def.stands || []).map(s => s[7]) });
  check('legal: no names of people, brands, races or series in the track\'s text (names, descriptions, the commentator, the stands: place names only)', !words.test(txt), (txt.match(words) || ['none'])[0]);
}

// 3. the pits: on the right of the pit straight (south, towards Turns 10 and 11), the player's box in the lane; Turn 10 (the left by the
// pits) just before the way in; a stop at the box and a repair
{
  const P = def.pit, ins = []; for (let d = P[1]; d <= P[2]; d += 10) { const p = T.pitAt(T.startS + d); ins.push(!!p); }
  const box = T.pitAt(T.startS + P[3]), i = T.idx(T.startS + P[3]), side = T.nz[i];
  const t10 = dS(T.nearestIdx(def.turns[9][0], def.turns[9][1]) * T.ds) - L, t11 = dS(T.nearestIdx(def.turns[10][0], def.turns[10][1]) * T.ds) - L;
  check('pits: Turns 10 (the left by the pits) and 11 (the hairpin) just before the way in, the lane along the pit straight after them', t10 < t11 && t11 < P[1] && P[1] - t11 < 200,
    `Turn 10 at ${Math.round(t10)} m, Turn 11 at ${Math.round(t11)} m, the lane from ${P[1]} m`);
  let other = null; for (let o = 30; o < 220 && !other; o += 2) { const j = T.nearestIdx(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o), d = dS(j * T.ds); if (Math.abs(((d - dS(i * T.ds)) % L + L * 1.5) % L - L / 2) > 300) other = { o, d }; }
  check('pits: south of the pit straight, between it and the road from Turn 10 to Turn 11 (the corner by the pits)', !!other && other.d > 4000 && other.d < 4500 && other.o > 50,
    other ? `the next road ${other.o} m to the south at ${Math.round(other.d)} m of the lap` : 'no road south');
  const orig = Math.random; Math.random = seeded(7);
  try {
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 4, difficulty: 1, damage: 2 });
    r.start(); const pl = r.player; let t = 0, k = 0, stopAt = null, rep = false, enter = false, asked = false;
    while (t < 300 && !(rep && !pl.inPit)) {
      Math.random = seeded(9000 + (++k));
      if (!asked && pl.lap >= 1 && dS(pl.q.s) > 3900 && dS(pl.q.s) < 4300) { asked = true; pl.pitWant = true; pl.dmg = 0.3; }   // (damaged on the first lap: in at its end)
      C.aiControl(pl, r, DT); r.step(DT); t += DT;
      if (pl.inPit) enter = true;
      if (pl.pitState === 'repair' && stopAt == null) stopAt = dS(pl.q.s);
      if (pl.pitDone) rep = true;
    }
    const off = stopAt == null ? null : Math.abs(((stopAt - (P[3] + L)) % L + L + L / 2) % L - L / 2);
    check('pits: the player on the autopilot drives into the lane, stops at the box and the crew repairs the car, then out again', enter && off != null && off < 6 && rep && pl.dmg < 0.05,
      `stopped ${off == null ? '-' : off.toFixed(1) + ' m'} from the box, repaired ${rep}, damage after ${(pl.dmg || 0).toFixed(2)}, ${t.toFixed(0)} s`);
  } finally { Math.random = orig; }
}

// 4. the scenery's data: the lagoon (its outline, the water below the track, south of the circuit), the terrain and land cover grids, the
// mountains' skyline (the Pedra Branca massif in the north-west the highest, ~8° over the horizon; the Tijuca massif in the east), the
// convention centre in the west
{
  const W = def.lagoon, poly = W.poly, inP = (x, z) => { let c = false; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) { const [xa, za] = poly[a], [xb, zb] = poly[b]; if ((za > z) !== (zb > z) && x < (xb - xa) * (z - za) / (zb - za) + xa) c = !c; } return c; };
  let wet = 0, dmin = 1e9; for (let i = 0; i < T.N; i += 2) { if (inP(T.px[i], T.pz[i])) wet++; for (const [x, z] of poly) dmin = Math.min(dmin, Math.hypot(T.px[i] - x, T.pz[i] - z)); }
  let hmin = 1e9; for (let i = 0; i < T.N; i++) hmin = Math.min(hmin, T.hy[i]);
  const t9 = def.turns[8]; let d9 = 1e9; for (const [x, z] of poly) d9 = Math.min(d9, Math.hypot(t9[0] - x, t9[1] - z));
  check('lagoon: its outline round the circuit\'s south, none of the track in it, its shore 80-400 m from the track (Turn 9 the nearest), the water 3-7 m below the road',
    poly.length > 100 && wet === 0 && dmin > 80 && dmin < 400 && d9 < 300 && W.y < hmin - 2 && W.y > hmin - 7, `${poly.length} points, shore ${dmin.toFixed(0)} m from the track (${d9.toFixed(0)} m from Turn 9), water ${W.y} m (road ${hmin.toFixed(1)} m)`);
  const D = def.dem, Lc = def.lc, bin = Buffer.from(D.b64, 'base64'), A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', lc = [];
  for (let p = 0; p < Lc.rle.length && lc.length < Lc.nx * Lc.nz;) { const v = A64.indexOf(Lc.rle[p++]); let k = (v & 15) + 1; if ((v & 15) === 15) { let e; do { e = A64.indexOf(Lc.rle[p++]); k += e; } while (e === 63); } for (; k > 0; k--) lc.push(v >> 4); }
  const cnt = [0, 0, 0, 0]; lc.forEach(c => cnt[c]++);
  check('terrain and land cover: whole grids round the track (16 m), all four classes (grass, trees, marsh and mangroves, built-up)', bin.length === D.nx * D.nz && lc.length === Lc.nx * Lc.nz && cnt.every(c => c > 300) &&
    D.x0 < -1000 && D.x0 + D.nx * 16 > 1000, `${D.nx} x ${D.nz} cells, classes ${cnt.join('/')}`);
  const S = def.sky, mx = S.ang.map(b => Math.max(...b) / 10), at = S.ang[1].indexOf(Math.max(...S.ang[1])) / 2, tj = Math.max(...S.ang[2].slice(120, 200)) / 10;
  check('skyline: four bands, 720 azimuths each (every half degree), the highest 6-9° up in the north-west (the Pedra Branca massif), the Tijuca massif in the east (60-100°), flat to the south (the sea)',
    S.ang.length === 4 && S.ang.every(b => b.length === 720) && S.dist.every(b => b.length === 720) && Math.max(...mx) > 6 && Math.max(...mx) < 9 && at > 270 && at < 330 && tj > 1.5 &&
    S.ang.every(b => Math.max(...b.slice(300, 420)) < 10), `highest ${mx.map(v => v.toFixed(1)).join(' / ')}° at ${at}°, Tijuca ${tj.toFixed(1)}°`);
  const C = def.conv, area = (P) => { let a = 0; for (let k = 0; k < P.length; k++) { const [x0, z0] = P[k], [x1, z1] = P[(k + 1) % P.length]; a += x0 * z1 - x1 * z0; } return Math.abs(a / 2); };
  const cd = Math.min(...C.halls.map(([h, P]) => Math.min(...P.map(([x, z]) => { let d = 1e9; for (let i = 0; i < T.N; i += 4) d = Math.min(d, Math.hypot(T.px[i] - x, T.pz[i] - z)); return d; }))));
  check('the convention centre: its car park and five halls (OpenStreetMap, 2012) west of the circuit, 0.9-2 km from the track, low (10-15 m), 1-4 ha each',
    C.lot.length >= 8 && C.halls.length === 5 && C.halls.every(([h, P]) => h >= 10 && h <= 15 && P.length >= 4 && area(P) > 9000 && area(P) < 40000 && P.every(([x]) => x < -1000)) && cd > 900 && cd < 2000,
    `${C.halls.length} halls, ${C.halls.map(([h, P]) => (area(P) / 1e4).toFixed(1) + ' ha').join(', ')}, nearest ${cd.toFixed(0)} m from the track`);
}

// 5. whole races with the AI, in the dry and in the rain: everybody to the line; the rain slower
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(21);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 9, difficulty: 1, rain });
    r.start(); let t = 0, k = 0, resc = 0;
    while (t < 600 && !r.cars.every(c => c.finished)) { Math.random = seeded(7000 + (++k)); for (const c of r.cars) if (c.isPlayer) C.aiControl(c, r, DT); r.step(DT); t += DT;
      for (const c of r.cars) if (!c.finished && (c.stuckT > 3 || c.wrongT > 3)) { r.rescue(c); resc++; } }
    const win = Math.min(...r.cars.filter(c => c.finished).map(c => c.finishTime));
    return { all: r.cars.every(c => c.finished), n: r.cars.length, fin: r.cars.filter(c => c.finished).length, win, resc };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race in the dry: all 13 to the line after two laps', d.all && d.n === 13, `${d.fin}/${d.n}, the winner ${d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 to the line, 3-15 % slower than in the dry', w.all && w.n === 13 && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.n}, the winner ${w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
