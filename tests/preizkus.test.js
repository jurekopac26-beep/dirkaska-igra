// Preizkus: tekmeci in trki (Nastavitve; Core.setTest, TX): settings for trying out the rivals and the knocks between cars, nothing by
// default (the golden references stay as they are). Checked here:
// - nothing set by default, only numbers taken; the bounce of a knock (cE: 0.1 by default, 0 none ... 0.6), the rub along the contact (cMu),
//   the turn a knock gives (cYaw: the attitude kick, 0 none), the weight (cMass: the other car heavier in a knock with the player only),
//   the sparks (cFx 0: none, the scrape marks stay); the realistic knocks (cBox flat bumpers, cScrub the tyres' hold, cE 0, cMu 0.5): a
//   racing bump does not throw the player's car aside, no bounce and no pop, a heavy car hardly moves when hit or leant on, a car driving
//   along hit from the side keeps its direction
// - the rivals: the spread of their paces (aiSpr), over the kerbs (aiKerb), a close train (aiSpr, aiPush, aiSide, aiFol), their mistakes under
//   pressure (aiErr: none with 0), the room they leave the player's car (aiPl)
// - Mehak razmik (cSoft: no pop), Potisk vstran Polovično (cScrub 0.5), a deep knock with flat bumpers does not throw the car back
// - races (Spa, Bathurst, 12 rivals, 150 s) with the realistic knocks and with the close train: nothing NaN, every car moving, knocks
//   <= 1.5x the default's + 20 (the close train: more rubbing is its point), slides past 40 deg <= 6 (the close train 10)
//   node tests/preizkus.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { seeded } = require('./lib/sim.js');

const C = loadCore();
const HC = require('./lib/handling.js')(C);
const { DT } = HC;
const checks = [];
const ok = (name, cond, detail) => checks.push({ name, ok: !!cond, detail });
const f = (v, d = 2) => Number.isFinite(v) ? v.toFixed(d) : String(v);

// ---- the settings ----
{
  const all = () => Object.keys(C.TX).every(k => C.TX[k] === null);
  C.setTest({ cE: 0.3, aiSpr: 'x', aiPush: NaN, cMu: null }); const part = C.TX.cE === 0.3 && C.TX.aiSpr === null && C.TX.aiPush === null && C.TX.cMu === null; C.setTest(null);
  ok('Preizkus: nothing set by default, only numbers taken, setTest(null) clears them all', all() && part, JSON.stringify(C.TX));
  const test = (tx, fn) => { C.setTest(tx || null); try { return fn(); } finally { C.setTest(null); } };
  // the bounce: a rear-end knock on the plane (72 km/h into 36), the share of the closing speed the cars part at
  const rear = (H, tx) => test(tx, () => { const A = H.mkCar('rally', { v: 72 }), B = H.mkCar('rally', { v: 36 }); A.place(0, 0, 0); A.vx = 20; B.place(A.m.len + 0.05, 0, 0); B.vx = 10; C.carCollide(B, A); return (B.vx - A.vx) / 10; });
  const rc = [null, { cE: 0 }, { cE: 0.25 }, { cE: 0.6 }].map(t => rear(HC, t));
  ok('Preizkus: the bounce of a knock: 0.1 by default, none with cE 0, 0.25 and 0.6 as asked', Math.abs(rc[0] - 0.1) < 0.03 && Math.abs(rc[1]) < 0.02 && Math.abs(rc[2] - 0.25) < 0.03 && Math.abs(rc[3] - 0.6) < 0.03,
    rc.map(x => f(x)).join(' / '));
  // the rub: B turning in against A at 100 km/h, the relative speed after the knock
  const swipe = (H, tx) => test(tx, () => { const A = H.mkCar('rally', { v: 100 }), B = H.mkCar('rally', { v: 100 }); A.place(0, 0, 0); A.vx = 27.8; B.place(A.m.len - 3.0, 1.7, -0.26); B.vx = 27.8 * Math.cos(-0.26); B.vz = 27.8 * Math.sin(-0.26); B.h = -0.26;
    C.carCollide(B, A); return Math.hypot(B.vx - A.vx, B.vz - A.vz); });
  const sc = [null, { cMu: 0.8 }].map(t => swipe(HC, t));
  ok('Preizkus: the rub along the contact: the cars share their speed more with cMu 0.8 than by default', sc[1] < 0.7 * sc[0], `${f(sc[0])} -> ${f(sc[1])} m/s apart`);
  // the weight: the other car counts cMass times heavier in a knock with the player (and only then), no sparks with cFx 0
  const heavyHit = (H, tx, pl) => test(tx, () => { const P = H.mkCar('rally', { v: 100 }), O = H.mkCar('rally', { v: 0 }); P.isPlayer = pl; O.isPlayer = false; O.place(0, 0, 0); P.place(-O.m.len - 0.02, 0, 0); P.vx = 27.8; P.fxCar = O.fxCar = 0; P.fxQ = O.fxQ = 0; C.carCollide(P, O); return { p: P.vx, o: O.vx, fx: P.fxQ || O.fxQ ? 0 : Math.max(P.fxCar, O.fxCar), rec: Math.max(P.fxCar, O.fxCar) }; });
  const hv0 = heavyHit(HC, null, true), hv1 = heavyHit(HC, { cE: 0, cMass: 12, cFx: 0 }, true), hv2 = heavyHit(HC, { cE: 0, cMass: 12, cFx: 0 }, false);
  ok('Preizkus: the other car 12 times heavier: the player\'s speed goes into it (both leave at about 1/13 of 100 km/h), between two rivals nothing changes, no sparks with cFx 0 (the scrape marks stay: fxCar), sparks by default',
    Math.abs(hv1.p - 27.8 / 13) < 0.3 && Math.abs(hv1.o - 27.8 / 13) < 0.3 && Math.abs(hv2.o - hv0.o) > 1 && hv2.o > 5 && hv1.fx === 0 && hv1.rec > 3 && hv0.fx > 3,
    `by default ${f(hv0.p * 3.6)} / ${f(hv0.o * 3.6)} km/h, heavy ${f(hv1.p * 3.6)} / ${f(hv1.o * 3.6)}, two rivals ${f(hv2.p * 3.6)} / ${f(hv2.o * 3.6)}`);
  // the turn: a light knock (the attitude kick csKc is capped at 0.4 rad: 0.15 stays under it)
  const lite = (H, tx) => test(tx, () => { const A = H.mkCar('rally', { v: 60 }), B = H.mkCar('rally', { v: 60 }); A.place(0, 0, 0); A.vx = 16.7; B.place(A.m.len - 3.0, 1.55, -0.06); B.vx = 16.7 * Math.cos(-0.06); B.vz = 16.7 * Math.sin(-0.06); B.h = -0.06;
    C.carCollide(B, A); return [Math.abs(A.csKc), Math.abs(A.w)]; });
  const yc = [null, { cYaw: 0 }, { cYaw: 0.15 }, { cYaw: 1.6 }].map(t => lite(HC, t)[0]);
  ok('Preizkus: the turn of a knock: the kick none with cYaw 0, small with 0.15, more than by default with 1.6 (its cap grows too)', yc[1] === 0 && yc[2] > 0 && yc[2] < 0.5 * yc[0] && yc[3] > yc[0] + 0.1,
    yc.map(x => f(x, 3)).join(' / ') + ' rad');
  // the realistic knocks (Realističen, težak): two cars on the plane stepped as a race does (both step, then the knock); lane: a driver holding its line
  const REAL = { cE: 0, cMu: 0.5, cYaw: 1, cBox: 1, cScrub: 1 }, D = 180 / Math.PI;
  const lane = (c, z0) => Math.max(-1, Math.min(1, -(0.35 * (c.z - z0) + 2.0 * c.h + 0.25 * c.vz / Math.max(5, c.speed))));
  const duel = (H, tx, set, secs) => test(tx, () => { const S = set(H), P = S.P, O = S.O, x0 = O.x, z0 = O.z, h0 = O.h; let pop = 0, sep = 0, hP = 0, hO = 0, oz = 0, t1 = null;
    for (let i = 1; i <= secs / DT; i++) { H.step(P, S.iP(i * DT)); H.step(O, S.iO(i * DT)); const x = P.x, z = P.z, m = C.carCollide(P, O); pop = Math.max(pop, Math.hypot(P.x - x, P.z - z));
      oz = Math.max(oz, Math.abs(-(O.x - x0) * Math.sin(h0) + (O.z - z0) * Math.cos(h0)));   // (the other car pushed aside: from the start, a push without a knock too)
      if (m > 0 && t1 == null) t1 = i; if (t1 == null) continue;
      const dx = O.x - P.x, dz = O.z - P.z, d = Math.hypot(dx, dz); sep = Math.max(sep, ((O.vx - P.vx) * dx + (O.vz - P.vz) * dz) / d);
      hP = Math.max(hP, Math.abs(P.h) * D); hO = Math.max(hO, Math.abs(O.h - h0) * D); }
    return { hit: t1 != null, pop, sep, hP, hO, hE: Math.abs(O.h - h0) * D, oz, om: Math.hypot(O.x - x0, O.z - z0), pv: P.speed, ov: O.speed }; });
  const car = (H, v, pl) => { const c = H.mkCar('rally', { v }); c.isPlayer = pl; c.noReverse = true; return c; };
  // a racing bump: the player at 120 km/h into a car at 100, 0.6 m off its middle, both holding their lines
  const bump = (H) => { const P = car(H, 120, true), O = car(H, 100, false); O.place(0, 0, 0); P.place(-O.m.len - 0.3, 0.6, 0); P.vx = 33.3; O.vx = 27.8;
    return { P, O, iP: () => ({ st: lane(P, 0.6), thr: 'hold' }), iO: () => ({ st: lane(O, 0), thr: 'hold' }) }; };
  // 50 km/h into a standing car (its brakes on), the player keeping the throttle
  const stand = (H) => { const P = car(H, 50, true), O = car(H, 0, false); O.place(0, 0, 0); P.place(-O.m.len - 0.05, 0, 0); P.vx = 13.9;
    return { P, O, iP: () => ({ st: lane(P, 0), thr: 'hold' }), iO: () => ({ st: 0, thr: 0, brk: 1 }) }; };
  // side by side at 100 km/h, the player leaning on the other car for 1 s
  const lean = (H) => { const P = car(H, 100, true), O = car(H, 100, false), w = O.m.wid + 0.15; P.place(0, 0, 0); O.place(0, w, 0); P.vx = O.vx = 27.8;
    return { P, O, iP: (t) => ({ st: t < 1 ? 0.25 : lane(P, 0), thr: 'hold' }), iO: () => ({ st: lane(O, w), thr: 'hold' }) }; };
  // a car driving along at 100 km/h hit in its flank by one at 20 deg to it (the other keeps its wheel straight)
  const flank = (H) => { const P = car(H, 100, true), O = car(H, 100, false), a = 0.35, L = O.m.len; O.place(0, 0, 0); O.vx = 27.8; P.place(-Math.cos(a) * L / 2, -0.98 - Math.sin(a) * L / 2, a); P.vx = 27.8 * Math.cos(a); P.vz = 27.8 * Math.sin(a);
    return { P, O, iP: () => ({ st: 0, thr: 0 }), iO: () => ({ st: 0, thr: 'hold' }) }; };
  const bu0 = duel(HC, null, bump, 1.5), bu1 = duel(HC, REAL, bump, 1.5), bu8 = duel(HC, { ...REAL, cMass: 8 }, bump, 1.5);
  ok('Preizkus: realistic knocks (classic): a racing bump 0.6 m off the middle does not throw the player\'s car aside (it turns under 3 deg, the old round ends 4 deg or more), no bounce apart; with the other car 8x heavier the player takes its speed',
    bu0.hit && bu1.hit && bu1.hP < 3 && bu0.hP >= 4 && bu1.sep < 0.3 && bu8.hP < 3 && bu8.sep < 0.3 && Math.abs(bu8.pv - 27.8) < 1.5,
    `the player turns ${f(bu0.hP, 1)} -> ${f(bu1.hP, 1)} deg (8x: ${f(bu8.hP, 1)}), apart at ${f(bu1.sep * 3.6, 1)} km/h, 8x: the player at ${f(bu8.pv * 3.6, 0)} km/h`);
  const st0 = duel(HC, null, stand, 2), st8 = duel(HC, { ...REAL, cMass: 8 }, stand, 2);
  ok('Preizkus: realistic knocks: 50 km/h into a standing car 8x heavier: no pop (under 4 cm a step; the old 10 cm or more), no bounce, the player stopped, the other moved under 0.5 m (the old one: 3 m or more)',
    st8.pop < 0.04 && st0.pop >= 0.1 && st8.sep < 0.3 && st8.pv < 1.5 && st8.om < 0.5 && st0.om >= 3,
    `pop ${f(st0.pop * 100, 0)} -> ${f(st8.pop * 100, 0)} cm, the other moved ${f(st0.om, 1)} -> ${f(st8.om, 2)} m, the player at ${f(st8.pv * 3.6, 1)} km/h`);
  const le0 = duel(HC, null, lean, 2.5), le8 = duel(HC, { ...REAL, cMass: 8 }, lean, 2.5);
  ok('Preizkus: realistic knocks: leaning on a car 8x heavier at 100 km/h for 1 s pushes it aside under 0.2 m (the old: 0.6 m or more)', le8.hit && le8.oz < 0.2 && le0.oz >= 0.6, `${f(le0.oz, 2)} -> ${f(le8.oz, 2)} m`);
  const fl0 = duel(HC, null, flank, 1.2), fl1 = duel(HC, REAL, flank, 1.2);
  ok('Preizkus: realistic knocks: a car driving along hit in its flank keeps its direction (under 6 deg at most; the old one turns 9 deg or more): the tyres hold the push',
    fl0.hit && fl1.hit && fl1.hO < 6 && fl0.hO >= 9, `${f(fl0.hO, 1)} -> ${f(fl1.hO, 1)} deg`);
  // the field: the paces' spread and the fastest one the same
  const sp = (phys, tx) => test(tx, () => { Math.random = seeded(5); const T = new C.Track(C.TRACKS.find(d => d.id === 'spa')), r = new C.Race(T, { numAI: 12, playerGrid: 13, laps: 1, phys, seed: 4, difficulty: 1 }), k = r.cars.filter(c => !c.isPlayer).map(c => c.skill); return [Math.min(...k), Math.max(...k)]; });
  const s0 = sp('cs'), s1 = sp('cs', { aiSpr: 0.3 });
  ok('Preizkus: the rivals\' pace spread (aiSpr): 0.3 of the default\'s with 0.3, the fastest the same',
    Math.abs((s1[1] - s1[0]) / (s0[1] - s0[0]) - 0.3) < 0.05 && Math.abs(s1[1] - s0[1]) < 0.01,
    `default ${f(s0[0], 3)}-${f(s0[1], 3)}, 0.3: ${f(s1[0], 3)}-${f(s1[1], 3)}`);
  // races on Spa (12 rivals, 150 s): the rivals' wheel on a kerb, and how much of the time a car is within half a second behind another
  const spa = (phys, tx) => test(tx, () => { Math.random = seeded(64); const T = new C.Track(C.TRACKS.find(d => d.id === 'spa'));
    const race = new C.Race(T, { numAI: 12, playerGrid: 13, laps: 5, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys, chars: true, slip: true }); race.start();
    let kerb = 0, tot = 0, near = 0, nearN = 0;
    for (let k = 1; k <= 150 / DT; k++) { Math.random = seeded(1000 + k); C.aiControl(race.player, race, DT); race.step(DT);
      for (const c of race.cars) if (!c.isPlayer && k * DT > 8) { tot++; if (c.onCurb) kerb++; }
      if (k * DT > 10 && k % 12 === 0) for (const c of race.cars) { if (c.speed < 8 || c.isPlayer) continue; let nd = 1e9; for (const o of race.cars) { const d = o.dist - c.dist; if (o !== c && d > 0 && d < nd) nd = d; } nearN++; if (nd / c.speed < 0.5) near++; } }
    return { kerb: kerb / tot, near: near / nearN }; });
  const rcs = spa('cs'), rck = spa('cs', { aiKerb: 1.2 }), rtight = spa('cs', { aiSpr: 0.3, aiPush: 0.04, aiSide: 0.15, aiFol: 1.5 });
  ok('Preizkus: the rivals over the kerbs (aiKerb): 6 % of the time or more with 1.2, under 3 % by default', rck.kerb >= 0.06 && rcs.kerb < 0.03, `${f(rcs.kerb * 100, 1)} % -> ${f(rck.kerb * 100, 1)} %`);
  ok('Preizkus: a close train (aiSpr 0.3, aiPush 0.04, aiSide 0.15, aiFol 1.5): a car within half a second behind another 8 points of the time more than by default',
    rtight.near >= rcs.near + 0.08, `${f(rcs.near * 100, 1)} % -> ${f(rtight.near * 100, 1)} %`);
}

// ---- the newer rows: Mehak razmik (cSoft), Potisk vstran Polovično (cScrub 0.5), a deep knock with flat bumpers, the rivals' mistakes (aiErr)
// and the room for the player's car (aiPl) ----
{
  const test = (tx, fn) => { C.setTest(tx || null); try { return fn(); } finally { C.setTest(null); } };
  const D = 180 / Math.PI, lane = (c, z0) => Math.max(-1, Math.min(1, -(0.35 * (c.z - z0) + 2.0 * c.h + 0.25 * c.vz / Math.max(5, c.speed))));
  const car = (v, pl) => { const c = HC.mkCar('rally', { v }); c.isPlayer = pl; c.noReverse = true; return c; };
  const duel = (tx, set, secs) => test(tx, () => { const S = set(), P = S.P, O = S.O, h0 = O.h, z0 = O.z, x0 = O.x; let pop = 0, hO = 0, hit = false, oz = 0;
    for (let i = 1; i <= secs / DT; i++) { HC.step(P, S.iP()); HC.step(O, S.iO()); const x = P.x, z = P.z, m = C.carCollide(P, O); pop = Math.max(pop, Math.hypot(P.x - x, P.z - z)); if (m > 0) hit = true; if (hit) hO = Math.max(hO, Math.abs(O.h - h0) * D); oz = Math.max(oz, Math.abs(-(O.x - x0) * Math.sin(h0) + (O.z - z0) * Math.cos(h0))); }
    return { hit, pop, hO, oz }; });
  const stand = () => { const P = car(50, true), O = car(0, false); O.place(0, 0, 0); P.place(-O.m.len - 0.05, 0, 0); P.vx = 13.9; return { P, O, iP: () => ({ st: lane(P, 0), thr: 'hold' }), iO: () => ({ st: 0, thr: 0, brk: 1 }) }; };
  const flank = () => { const P = car(100, true), O = car(100, false), a = 0.35, L = O.m.len; O.place(0, 0, 0); O.vx = 27.8; P.place(-Math.cos(a) * L / 2, -0.98 - Math.sin(a) * L / 2, a); P.vx = 27.8 * Math.cos(a); P.vz = 27.8 * Math.sin(a); return { P, O, iP: () => ({ st: 0, thr: 0 }), iO: () => ({ st: 0, thr: 'hold' }) }; };
  const s0 = duel(null, stand, 1.5), s1 = duel({ cSoft: 1 }, stand, 1.5);
  ok('Preizkus: Mehak razmik (cSoft): 50 km/h into a standing car, the round ends pushed apart without the pop (under 4 cm a step; by default 10 cm or more)', s1.hit && s1.pop < 0.04 && s0.pop >= 0.1, `${f(s0.pop * 100, 0)} -> ${f(s1.pop * 100, 0)} cm`);
  const REAL = { cE: 0, cMu: 0.5, cYaw: 1, cBox: 1, cScrub: 1 }, fr = duel(REAL, flank, 1.2);
  ok('Preizkus: flat bumpers, a deep knock into a flank at 20 deg: the car is not thrown back (under 8 cm a step)', fr.hit && fr.pop < 0.08, f(fr.pop * 100, 0) + ' cm');
  const z0 = duel(null, flank, 1.2).oz, z1 = duel({ cScrub: 1 }, flank, 1.2).oz, zh = duel({ cScrub: 0.5 }, flank, 1.2).oz;
  ok('Preizkus: Potisk vstran Polovično (cScrub 0.5): the car hit in its flank is pushed aside between Avto zavije and Gume zadržijo', zh < z0 - 0.1 && zh > z1 + 0.1, `${f(z0)} / ${f(zh)} / ${f(z1)} m`);
  // the rivals' mistakes under pressure and the room for the player (Spa, 12 rivals, the characters on: chars)
  const spaRun = (tx) => test(tx, () => { Math.random = seeded(64); const T = new C.Track(C.TRACKS.find(d => d.id === 'spa'));
    const race = new C.Race(T, { numAI: 12, playerGrid: 7, laps: 5, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, chars: true, slip: true }); race.start();
    let mist = 0; if (race.chr) { const ev = race._chrEv.bind(race); race._chrEv = (k, c) => { if (k === 'mistake') mist++; ev(k, c); }; }
    const P = race.player; let al = 0, alN = 0;
    for (let k = 1; k <= 180 / DT; k++) { Math.random = seeded(1000 + k); C.aiControl(P, race, DT); race.step(DT);
      if (k % 6 === 0 && k * DT > 8) for (const c of race.cars) { if (c === P || Math.abs(c.dist - P.dist) > (c.m.len + P.m.len) * 0.5) continue; const lat = Math.abs(c.q.d - P.q.d); if (lat < 4) { al += lat; alN++; } } }
    return { mist, al: alN ? al / alN : 0, alN }; });
  const m0 = spaRun(null), mN = spaRun({ aiErr: 0 }), m2 = spaRun({ aiErr: 2 });
  ok('Preizkus: Napake tekmecev (aiErr): none with 0, more often with 2 than by default', mN.mist === 0 && m2.mist >= m0.mist && m2.mist > 0, `default ${m0.mist}, 0: ${mN.mist}, 2: ${m2.mist}`);
  // the room for the player: a rival right beside the player's car on its line (Spa), its offset worked out again and again
  const side = (tx) => test(tx, () => { Math.random = seeded(3); const T = new C.Track(C.TRACKS.find(d => d.id === 'spa'));
    const race = new C.Race(T, { numAI: 1, playerGrid: 2, laps: 3, playerModel: C.MODELS[4], fieldModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 0 }); race.start();
    const P = race.player, A = race.cars.find(c => c !== P), i = 300, r0 = T.rl[i], sd = r0 > 0 ? -1 : 1;
    const put = (c, d) => { c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i]); c.vx = Math.cos(c.h) * 30; c.vz = Math.sin(c.h) * 30; c.q = T.query(c.x, c.z, i, c.q); c.vl = 30; };
    put(P, r0); put(A, r0 + sd * 2.6); P.dist = A.dist = 1000; race.state = 'racing';
    for (let k = 0; k < 40; k++) { Math.random = seeded(9 + k); C.aiControl(A, race, DT); }
    return { by: A.alU === P || A.alD === P, d: Math.abs(A.aiOff + T.rl[i] - r0) }; });
  const q0 = side(null), q1 = side({ aiPl: 1 }), q2 = side({ aiPl: 2 });
  ok('Preizkus: Prostor za tvoj avto (aiPl): a rival beside the player keeps that much further across (1 m, 2 m more than by default)', q0.by && Math.abs(q1.d - q0.d - 1) < 0.05 && Math.abs(q2.d - q0.d - 2) < 0.05,
    `${f(q0.d)} / ${f(q1.d)} / ${f(q2.d)} m from the player's line`);
}

// ---- races ----
function pack(tid, tx) {
  C.setTest(tx || null); Math.random = seeded(64);
  const T = new C.Track(C.TRACKS.find(d => d.id === tid));
  const race = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2 });
  race.start();
  const pc = new Map(), ps = new Map(); let hits = 0, slides = 0, nan = false;
  for (let k = 1; k <= 150 / DT; k++) {
    Math.random = seeded(1000 + k);
    C.aiControl(race.player, race, DT); race.step(DT);
    for (const c of race.cars) { if (!Number.isFinite(c.x + c.z + c.vx + c.vz + c.w)) nan = true;
      const h = c.hitCar > 3; if (h && !pc.get(c)) hits++; pc.set(c, h); c.hitCar = 0;
      const sl = Math.abs(c.beta || 0) > 0.7 && c.speed > 8; if (sl && !ps.get(c)) slides++; ps.set(c, sl); }
  }
  C.setTest(null);
  return { hits, slides, nan, moving: race.cars.filter(c => c.speed > 5).length, n: race.cars.length };
}
for (const tid of ['spa', 'bathurst']) {
  const s = pack(tid);
  for (const [nm, tx] of [['the realistic knocks (Realističen, težak)', { cE: 0, cMu: 0.5, cYaw: 1, cBox: 1, cScrub: 1, cMass: 8, cFx: 0 }], ['a close train', { aiSpr: 0.3, aiPush: 0.04, aiSide: 0.15, aiFol: 1.5, aiKerb: 1.2 }]]) {
    const r = pack(tid, tx), tight = nm === 'a close train';   // (the close train: more rubbing is what it is for)
    ok(`race ${tid} with ${nm}: nothing NaN, every car moving, ${tight ? 'slides past 40 deg <= 10' : 'knocks <= 1.5x the default\'s + 20, slides past 40 deg <= 6'}`, !r.nan && r.moving === r.n && (tight ? r.slides <= 10 : r.hits <= 1.5 * s.hits + 20 && r.slides <= 6),
      `${r.hits} knocks (default ${s.hits}), ${r.slides} slides, ${r.moving}/${r.n} moving`);
  }
}

let bad = 0;
console.log('== Preizkus: tekmeci in trki');
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} checks`);
process.exitCode = bad ? 1 : 0;
