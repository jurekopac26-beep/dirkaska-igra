// The checks every tanker's short road of docs/proge-cisterna.md has (tests/<id>.test.js: const G = cisternaTrack(id); its own checks with
// G.check; G.done()):
// 1. the name: "Kraj, Država" as in the plan's table, the English one too; an open road, one way to drive it: the time trial (def.timeTrial),
//    always in the TITAN CISTERNA (def.vehicle, a rig with a semi-trailer), four checkpoints, no round of the big championship
// 2. the stage: up to 500 m between the lines (the user's choice, 8. 11. 2026), its altitudes the road's own, room for the rig below the start
//    line and a run-out past the finish
// 3. the data of the import (tools/proga-uvoz.mjs): the terrain and the land cover decode to their grids, the drops (def.drops) on the race,
//    the uneven ground (def.bumps)
// 4. the ledge: narrow (wider only in the tight bends: a radius under 30 m within 22 m, tools/proga-uvoz.mjs siri), no barrier out over a
//    drop (the brink at the edge), the rock close on the other side
// 5. the tanker on the autopilot (dry): at the finish, never over the edge, the autopilot no faster than its cap (def.aiVmax), wide through
//    the tight bends (def.wideLine); the trailer folds in a hairpin, but never to its stop (Core TLK.lim, 83 degrees: the tank against the cab)
// 6. the medal times of the time trial: gold < silver < bronze, dry and wet, the rain no quicker, gold the tanker on the autopilot x 1.02
// 7. the relief road (the user's wishes of 9. 11. 2026: not flat, as rugged as it can be, every country's road its own builder): the road's
//    surface a height field (def.relief, Core buildRelief) 5 cm up and down and more, three kinds of what is on it or more, the mark of how
//    the country builds its roads (MARK) on it, a recipe no other tanker's road has; the rig's springs at work (the wheels' loads swing under
//    0.6 and over 1.4 of their share, the ground rolls it by 2 degrees or more); in the rain at the finish too
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore, ROOT } = require('./core.js');
const { DT, seeded } = require('./sim.js');

// the tanker on the autopilot over the road (tt, alone): its time, falls, rescues (stuck over 8 s: a loaded rig is slow off the line), the
// trailer's widest angle, the top speed; on a relief road the wheels' loads (their least and most, of their share) and the ground's roll (deg)
function tankerRun(C, T, def, rain) {
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS.find(m => m.id === def.vehicle), assist: 2, phys: 'cs', seed: 11, difficulty: 1, tt: true, rain }), P = r.player; r.start();
  let t = 0, k = 0, resc = 0, tl = 0, vmax = 0, lo = 9, hi = 0, roll = 0;
  while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 8 || P.wrongT > 3) { r.rescue(P); resc++; }
    if (P.tl) tl = Math.max(tl, Math.abs(P.tl.rel || 0)); if (P.q.s > T.startS + 20) vmax = Math.max(vmax, P.speed);
    if (P.rs && P.q.s > T.startS + 5) { for (let j = 0; j < 4; j++) { lo = Math.min(lo, P.rs.L[j]); hi = Math.max(hi, P.rs.L[j]); } roll = Math.max(roll, Math.abs(P.nvR)); } }
  Math.random = orig;
  return { P, time: P.finished ? P.finishTime : null, falls: (P.falls || 0) + ((P.tl && P.tl.falls) || 0), resc, tl: tl * 180 / Math.PI, vmax, lo, hi, roll: roll * 180 / Math.PI };
}

// how each country builds its roads, the mark of it on the tanker's road (def.relief's layer, the kind of its cells: Core.RLC): Iceland's
// grader windrows, the stones set along the brink in the Karakoram, Malawi's water bars, the Andes' landslide earth, Papua's log corduroy
const MARK = { svalvogar: ['windrows', 'berm'], fairymeadows: ['edge', 'stone'], manchewe: ['bars', 'berm'], yungas: ['slides', 'berm'], tapini: ['logs', 'log'] };

function cisternaTrack(id) {
  const C = loadCore();
  let bad = 0, n = 0;
  const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
  const def = C.TRACKS.find(d => d.id === id);
  if (!def) { console.log('FAIL no track ' + id); process.exit(1); }
  const T = new C.Track(def);
  const row = fs.readFileSync(path.join(ROOT, 'docs', 'proge-cisterna.md'), 'utf8').split('\n').map(l => l.split('|').map(c => c.trim())).find(c => c[2] === '`' + id + '`') || [];
  const M = C.MODELS.find(m => m.id === def.vehicle);

  // 1. the name, the one way to drive it
  check('name: "Kraj, Država" as in the plan, in English too', def.name === row[3] && def.en && def.en.name === row[4] && /^[^,]+, [^,]+$/.test(def.name), `${def.name} / ${def.en && def.en.name}`);
  check('track: an open road, only the time trial, always in the TITAN CISTERNA (a rig with a semi-trailer), 4 checkpoints, not a round of the big championship',
    def.open && def.timeTrial && !def.modes && def.vehicle === 'cisterna' && !!M && !!M.trailer && !def.leftHand && T.cpS.length === 4 && !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes(id),
    `${M ? M.name : '-'}, ${T.cpS.length} checkpoints`);
  // 2. the stage
  check('stage: up to 500 m between the lines (400 at least), the altitudes the road\'s own, room for the rig below the start, a run-out past the finish', T.raceLen > 400 && T.raceLen <= 505 &&
    Math.abs(T.altAt(T.hStart) - def.alt[0]) < 1.5 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1.5 && T.startS >= 40 && T.len - T.finishS >= 60,
    `race ${Math.round(T.raceLen)} m, ${def.alt.join(' -> ')} m, ${Math.round(T.startS)} m below the start, ${Math.round(T.len - T.finishS)} m past the finish`);
  // 3. the data
  {
    const D = def.dem, L = def.lc, res = Buffer.from(D.res, 'base64'), span = D.rows.reduce((a, r) => a + r[1], 0), tr = Buffer.from(D.tr.b64, 'base64');
    const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; let cells = 0, cls = new Set();
    for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let m = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); m += e; } while (e === 63 && p < L.rle.length); } cells += m; cls.add(s >> 3); }
    check('data: the terrain (trend and residuals) and the land cover decode to their grids, the land cover classes 0-7', D.rows.length === D.nz && res.length === span && tr.length === D.tr.nx * D.tr.nz * 2 && cells === L.nx * L.nz && [...cls].every(c => c >= 0 && c <= 7),
      `terrain ${D.nx}x${D.nz} (${span} residuals), land cover ${L.nx}x${L.nz}, classes ${[...cls].sort().join(',')}`);
  }
  let onDrop = 0, narrow = 0, rockMax = 0, brinkMax = 0, wMax = 0, wOut = 0, cnt = 0;
  const tight = (i) => { const r = Math.round(22 / T.ds); for (let j = Math.max(0, i - r); j <= Math.min(T.N - 1, i + r); j++) if (Math.abs(T.k[j]) > 1 / 30) return true; return false; };
  for (let i = T.startIdx; i < T.finishIdx; i++) { cnt++; const w = T.wa ? T.wa[i] : T.w, dl = T.dropAt && T.dropAt[0][i], dr = T.dropAt && T.dropAt[1][i]; wMax = Math.max(wMax, w);
    if (dl || dr) onDrop++; if (w <= 2.2) narrow++; if (!tight(i)) wOut = Math.max(wOut, w);
    for (const [on, B] of [[dl, T.bl[i]], [dr, T.br[i]]]) { if (on) brinkMax = Math.max(brinkMax, B - w); else rockMax = Math.max(rockMax, B - w); } }
  const B = def.bumps || [];
  check('data: drops beside half the race or more (def.drops, tools/proga-uvoz.mjs prepad), bumps and dips every few metres (def.bumps)', onDrop >= cnt * 0.5 && B.length >= T.raceLen / 10,
    `drops beside ${Math.round(onDrop / cnt * 100)} % of the race, ${B.length} bumps (biggest ${Math.max(0, ...B.map(b => Math.abs(b.h))).toFixed(2)} m)`);
  // 4. the ledge
  check('the ledge: narrow (half width 2.2 m or less but in the tight bends, there 3 m at most; half the race or more), the brink at the edge over a drop, the rock close on the other side (2.2 m at most)',
    wOut <= 2.25 && narrow >= cnt * 0.5 && wMax <= 3.0 && brinkMax <= 1.25 && rockMax <= 2.2,
    `narrow on ${Math.round(narrow / cnt * 100)} %, widest ${wOut.toFixed(2)} m outside the tight bends, ${wMax.toFixed(2)} m in them, brink ${brinkMax.toFixed(2)} m past the edge, rock ${rockMax.toFixed(2)} m at most`);
  // 5. the tanker on the autopilot
  const dry = tankerRun(C, T, def, 0);
  check('the tanker on the autopilot: at the finish, never over the edge, no rescue, the trailer never folded to its stop (under 80 degrees), no faster than def.aiVmax (1.5 m/s over it at most)',
    dry.time != null && dry.falls === 0 && dry.resc === 0 && dry.tl < 80 && dry.vmax <= (def.aiVmax || 99) + 1.5 && def.wideLine === true,
    `${dry.time ? dry.time.toFixed(1) : '-'} s, falls ${dry.falls}, rescues ${dry.resc}, trailer up to ${dry.tl.toFixed(0)} deg, top ${(dry.vmax * 3.6).toFixed(0)} km/h`);
  // 6. the medals
  {
    const Md = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
    check('medals: gold < silver < bronze, dry and wet, the rain no quicker; gold = the tanker on the autopilot x 1.02', asc(Md.cs) && asc(Md.wet.cs) && Md.wet.cs[0] >= Md.cs[0] && dry.time != null && Math.abs(dry.time * 1.02 - Md.cs[0]) < 1.5,
      `dry ${Md.cs.join('/')} s, wet ${Md.wet.cs.join('/')} s, autopilot ${dry.time ? dry.time.toFixed(1) : '-'} s`);
  }
  // 7. the relief road
  {
    const RL = T.relief, R = def.relief || {}, mk = MARK[id] || [], K = C.RLC, cls = new Array(16).fill(0); let lo = 0, hi = 0, nc = 0;
    if (RL) for (let s = T.startS; s < T.finishS; s += 0.25) { const w = RL.wS(s); for (let d = -w; d <= w; d += 0.2) { const h = T.reliefH(s, d, true); lo = Math.min(lo, h); hi = Math.max(hi, h); cls[T.reliefC(s, d)]++; nc++; } }
    const kinds = cls.filter((v, i) => i && v > nc * 0.002).length, share = mk[1] != null ? cls[K[mk[1]]] / Math.max(1, nc) : 0;
    const sig = (r) => Object.keys(r || {}).filter(x => x !== 'seed' && x !== 'ai').sort().join(','), same = C.TRACKS.filter(d => d.id !== id && d.vehicle === 'cisterna' && d.relief && sig(d.relief) === sig(R)).map(d => d.id);
    check(`the relief road: 5 cm up and down and more, three kinds of what is on it or more, the country's own mark (${mk[0] || '-'}) on it, a recipe no other tanker's road has`,
      !!RL && lo <= -0.05 && hi >= 0.05 && kinds >= 3 && !!R[mk[0]] && share >= 0.005 && !same.length,
      `${lo.toFixed(2)}..${hi.toFixed(2)} m, ${kinds} kinds, ${mk[1] || '-'} on ${(share * 100).toFixed(1)} % of the road${same.length ? ', the same recipe as ' + same.join(', ') : ''}`);
    const wet = tankerRun(C, T, def, 1);
    check('the relief road: the springs at work (the wheels\' loads under 0.6 and over 1.4 of their share, the ground rolls the rig 2 degrees or more); in the rain at the finish too, never over the edge, no rescue',
      dry.lo < 0.6 && dry.hi > 1.4 && dry.roll >= 2 && wet.time != null && wet.falls === 0 && wet.resc === 0,
      `loads ${dry.lo.toFixed(2)}..${dry.hi.toFixed(2)}, ground's roll up to ${dry.roll.toFixed(1)} deg; rain ${wet.time ? wet.time.toFixed(1) : '-'} s, falls ${wet.falls}, rescues ${wet.resc}`);
  }
  return { C, def, T, check, tankerRun: (rain) => tankerRun(C, T, def, rain), done() { console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`); process.exitCode = bad ? 1 : 0; } };
}

module.exports = { cisternaTrack, tankerRun };
