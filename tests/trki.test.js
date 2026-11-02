// Trki med avti (Nastavitve: Trki med avti; Core KV, kCollide, kTake): the knocks between cars in the versions Simulacija, Arkadna, Mehka,
// Kaskaderska and Stara (the old knock), on the flat test plane (tests/lib/handling.js, BURJA R7 'rally', two cars stepped as a race steps them:
// both drive, then the knock) and in races. Checked here:
// - the choice (Core.setTest cv): Simulacija by default, cv 1-5 the versions, the rows over a version (cPm, cE, cMu, cYaw, cGl, cSl, cFx),
//   setTest(null) back to the default; Stara is the old knock (round ends, the classic's 0.1 bounce, every touch a full swing of the nose)
// - Simulacija, classic physics: a car hit moves (equal weights: 100 km/h into a standing car, centred, the hit car leaves faster than the
//   one that hit it, both well under 100 and over 25 km/h; the old heavy knock left it standing); the bounce by the closing speed (a
//   light knock bounces more than a hard one, a car leaning on another not at all); no pop (under 3 cm a step; 5 at 100 km/h head on); a racing bump 0.6 m off
//   the middle turns neither car more than 4 deg and costs no grip; a rival drifting into the player's flank at 3 deg (and back to its lane) nudges it (0.4-2 m/s
//   across, under 5 deg, the slide gone in under 0.8 s) and costs no grip; side by side, leaning for a second, the cars do not lock their
//   speeds (no glue) and do not jitter; a hard tap on a rear quarter (a PIT, 8 m/s across) takes the hit car's grip (it slides and turns
//   15-70 deg, the grip back within 1.5 s), a knock on a front quarter does not (the nose slides, it straightens itself); sparks for a
//   knock (fxCar), none with cFx 0 (fxQ)
// - Arkadna: in a side knock the player moves less than the rival and the player's grip is spared (a PIT on the player: under half the
//   turn Simulacija gives), the rival PIT'ed by the player spins more than in Simulacija; Mehka: less turn than Simulacija; Kaskaderska:
//   a PIT turns the car more than Simulacija
// - the new physics (Nova) with Simulacija: the same knocks nudge, turn and straighten, nothing NaN
// - a friend's car online (net) is not moved by the knock: the local car takes the whole separation and only its own share of the push
// - the walls as they were (the user's): the knock off a barrier is the same in every version
// - races (Spa, Bathurst: 12 rivals, the player on the autopilot, 150 s) in every version: nothing NaN, every car moving, no two cars
//   touching side by side for 2 s on end (glued), spins (past 40 deg at speed) at most 4 in Simulacija, Arkadna and Mehka
//   node tests/trki.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { seeded } = require('./lib/sim.js');

const C = loadCore();
const HC = require('./lib/handling.js')(C, 'cs'), HN = require('./lib/handling.js')(C, 'nova');
const { DT } = HC, D = 180 / Math.PI;
const checks = [];
const ok = (name, cond, detail) => checks.push({ name, ok: !!cond, detail });
const f = (v, d = 2) => Number.isFinite(v) ? v.toFixed(d) : String(v);
const test = (tx, fn) => { C.setTest(tx || null); try { return fn(); } finally { C.setTest(null); } };
const SIM = { cv: 1 }, ARC = { cv: 2 }, SOFT = { cv: 3 }, STUNT = { cv: 4 }, OLD = { cv: 5 };
const car = (H, v, pl) => { const c = H.mkCar('rally', { v }); c.isPlayer = pl; c.noReverse = true; return c; };
const lane = (c, z0) => Math.max(-1, Math.min(1, -(0.35 * (c.z - z0) + 2.0 * c.h + 0.25 * c.vz / Math.max(5, c.speed))));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// two cars on the plane stepped as a race does; S: { P, O, iP(t), iO(t) }. Per car after the first touch: the largest sideways speed (in its
// own heading at the touch), the largest turn of the heading, its speed at the end, the largest grip lost (xgl) and when it came back, the time
// its slide (beta) was gone; the largest position step the knock made (pop), the parting speed in the first 0.4 s, the share of steps touching
function duel(H, tx, S, secs) {
  return test(tx, () => {
    const { P, O } = S; let t1 = null, pop = 0, sep = 0, n = 0, tch = 0, nan = false;
    const R = (c) => ({ c, h0: c.h, vx0: c.vx, vz0: c.vz, x0: c.x, z0: c.z, lat: 0, turn: 0, gl: 0, glBack: null, calm: null });
    const A = R(P), B = R(O);
    for (let i = 1; i <= secs / DT; i++) {
      const t = i * DT; H.step(P, S.iP(t)); H.step(O, S.iO(t));
      const px = P.x, pz = P.z, ox = O.x, oz = O.z, k0 = P.vx + O.vx + P.vz + O.vz + P.w + O.w + (P.csKc || 0) + (O.csKc || 0);
      C.carCollide(P, O);
      const step = Math.max(Math.hypot(P.x - px, P.z - pz), Math.hypot(O.x - ox, O.z - oz)), touch = step > 0 || k0 !== P.vx + O.vx + P.vz + O.vz + P.w + O.w + (P.csKc || 0) + (O.csKc || 0);
      pop = Math.max(pop, step); if (!Number.isFinite(P.x + P.z + P.vx + P.vz + P.w + O.x + O.z + O.vx + O.vz + O.w)) nan = true;
      if (touch && t1 == null) t1 = t;
      if (t1 == null) { for (const X of [A, B]) { X.h0 = X.c.h; X.vx0 = X.c.vx; X.vz0 = X.c.vz; X.x0 = X.c.x; X.z0 = X.c.z; } continue; }
      if (t - t1 < 1.5) { n++; if (touch) tch++; }
      if (t - t1 < 0.4) { const dx = O.x - P.x, dz = O.z - P.z, d = Math.hypot(dx, dz) || 1; sep = Math.max(sep, ((O.vx - P.vx) * dx + (O.vz - P.vz) * dz) / d); }
      for (const X of [A, B]) { const c = X.c, ch = Math.cos(X.h0), sh = Math.sin(X.h0);
        X.lat = Math.max(X.lat, Math.abs(-(c.vx - X.vx0) * sh + (c.vz - X.vz0) * ch)); X.turn = Math.max(X.turn, Math.abs(wrap(c.h - X.h0)) * D);
        if ((c.xgl || 0) > X.gl) X.gl = c.xgl; if (X.gl > 0 && !c.xgl && X.glBack == null) X.glBack = t - t1;
        if (t - t1 > 0.1 && X.calm == null && Math.abs(c.beta || 0) < 0.035 && !(Math.hypot(c.cSx || 0, c.cSz || 0) > 0.1)) X.calm = t - t1; }
    }
    const out = (X) => ({ lat: X.lat, turn: X.turn, v: X.c.speed, gl: X.gl, glBack: X.glBack, calm: X.calm, moved: Math.hypot(X.c.x - X.x0, X.c.z - X.z0), side: Math.abs(-(X.c.x - X.x0) * Math.sin(X.h0) + (X.c.z - X.z0) * Math.cos(X.h0)) });
    return { hit: t1 != null, pop, sep, touch: n ? tch / n : 0, nan, P: out(A), O: out(B) };
  });
}
// the scenes (the player P, the other car O)
const SC = {
  // 100 km/h into a standing car, centred (O's brakes off: the push it takes, as it is)
  stand: (H) => { const P = car(H, 100, true), O = car(H, 0, false); O.place(0, 0, 0); P.place(-O.m.len - 0.05, 0, 0); P.vx = 27.8; return { P, O, iP: () => ({ st: 0, thr: 0 }), iO: () => ({ st: 0, thr: 0 }) }; },
  // a racing bump: the player at 120 km/h into a car at 100, 0.6 m off its middle, both holding their lines
  bump: (H) => { const P = car(H, 120, true), O = car(H, 100, false); O.place(0, 0, 0); P.place(-O.m.len - 0.3, 0.6, 0); P.vx = 33.3; O.vx = 27.8; return { P, O, iP: () => ({ st: lane(P, 0.6), thr: 'hold' }), iO: () => ({ st: lane(O, 0), thr: 'hold' }) }; },
  // a rival at 100 km/h drifting into the player's flank at 3 deg (1.5 m/s across), back to its lane after 0.4 s (as the AI does); the player's wheel straight
  drift3: (H) => { const P = car(H, 100, true), O = car(H, 100, false), a = -0.052, z0 = O.m.wid + 0.35; P.place(0, 0, 0); P.vx = 27.8; O.place(0.5, z0, a); O.vx = 27.8 * Math.cos(a); O.vz = 27.8 * Math.sin(a); return { P, O, iP: () => ({ st: 0, thr: 'hold' }), iO: (t) => ({ st: t < 0.4 ? 0 : lane(O, z0), thr: 'hold' }) }; },
  // side by side at 110 and 90 km/h, the player leaning on the other car for 1 s
  rub: (H) => { const P = car(H, 110, true), O = car(H, 90, false), w = O.m.wid + 0.15; P.place(-4, 0, 0); O.place(0, w, 0); P.vx = 30.6; O.vx = 25; return { P, O, iP: (t) => ({ st: t < 1 ? 0.25 : lane(P, 0), thr: 'hold' }), iO: () => ({ st: lane(O, w), thr: 'hold' }) }; },
  // a rival at 100 km/h into the player's rear quarter at 17 deg (a PIT: 8 m/s across)
  pit: (H) => { const P = car(H, 100, true), O = car(H, 100, false), a = 0.3; P.place(0, 0, 0); P.vx = 27.8; O.place(-P.m.len * 0.75, -P.m.wid - 0.95, a); O.vx = 27.8 * Math.cos(a); O.vz = 27.8 * Math.sin(a); return { P, O, iP: () => ({ st: 0, thr: 'hold' }), iO: () => ({ st: 0, thr: 'hold' }) }; },
  // the player into a rival's rear quarter at 17 deg
  pitP: (H) => { const O = car(H, 100, false), P = car(H, 100, true), a = 0.3; O.place(0, 0, 0); O.vx = 27.8; P.place(-O.m.len * 0.75, -O.m.wid - 0.95, a); P.vx = 27.8 * Math.cos(a); P.vz = 27.8 * Math.sin(a); P.h = a; return { P, O, iP: () => ({ st: 0, thr: 'hold' }), iO: () => ({ st: 0, thr: 'hold' }) }; },
  // a rival at 100 km/h swerving into the player's front quarter at 15 deg
  front: (H) => { const P = car(H, 100, true), O = car(H, 100, false), a = -0.26; P.place(0, 0, 0); P.vx = 27.8; O.place(P.m.len - 2.4, 2.9, a); O.vx = 27.8 * Math.cos(a); O.vz = 27.8 * Math.sin(a); return { P, O, iP: () => ({ st: 0, thr: 'hold' }), iO: () => ({ st: 0, thr: 'hold' }) }; },
};
const run = (H, tx, k, secs = 2) => duel(H, tx, SC[k](H), secs);

// ---- the choice ----
{
  const kc = () => C.TX.cv;
  C.setTest(null); const d0 = kc();
  C.setTest({ cv: 3, cPm: 1.5, cE: 0.5, cMu: 0.6, cYaw: 0.4, cGl: 0, cSl: 1.6, cFx: 0, aiSpr: 0.3 }); const T1 = Object.assign({}, C.TX);
  C.setTest({ cv: 'x', cE: NaN }); const T2 = Object.assign({}, C.TX); C.setTest(null);
  ok('the choice: nothing set by default (Simulacija), the version and its rows taken as numbers, setTest(null) clears them', d0 === null && T1.cv === 3 && T1.cPm === 1.5 && T1.cE === 0.5 && T1.cMu === 0.6 && T1.cYaw === 0.4 && T1.cGl === 0 && T1.cSl === 1.6 && T1.cFx === 0 && T1.aiSpr === 0.3 && T2.cv === null && T2.cE === null && Object.values(C.TX).every(v => v === null),
    JSON.stringify([T1, T2]));
  ok('the versions: Simulacija, Arkadna, Mehka, Kaskaderska, Stara in that order (cv 1-5)', C.KV_IDS.join() === ',sim,arc,soft,stunt,old' && ['sim', 'arc', 'soft', 'stunt'].every(k => C.KV[k] && C.KV[k].pm > 0), C.KV_IDS.join());
}

// ---- Stara: the old knock ----
{
  const rear = (tx) => test(tx, () => { const A = HC.mkCar('rally', { v: 72 }), B = HC.mkCar('rally', { v: 36 }); A.place(0, 0, 0); A.vx = 20; B.place(A.m.len - 0.02, 0, 0); B.vx = 10; C.carCollide(B, A); return (B.vx - A.vx) / 10; });   // (2 cm into each other: the boxes touch, the old circles too)
  const tap = (tx) => test(tx, () => { const A = HC.mkCar('rally', { v: 60 }), B = HC.mkCar('rally', { v: 60 }); A.place(0, 0, 0); A.vx = 16.7; B.place(A.m.len - 3.0, 1.55, -0.06); B.vx = 16.7 * Math.cos(-0.06); B.vz = 16.7 * Math.sin(-0.06); B.h = -0.06; C.carCollide(B, A); return Math.abs(A.csKc); });
  const o = rear(OLD), s = rear(SIM), ko = tap(OLD), ks = tap(SIM);
  ok('Stara: the old knock (the classic\'s bounce 0.1 of the closing speed; a light touch swings the nose by the whole kick, 23 deg); Simulacija: at 10 m/s closing a little more bounce (its bumpers), a light touch swings the nose a little',
    Math.abs(o - 0.1) < 0.03 && Math.abs(ko - C.CSK.tapMax) < 1e-6 && s > 0.11 && s < 0.2 && ks < 0.25 * C.CSK.tapMax, `bounce ${f(o)} / ${f(s)} of the closing speed, swing ${f(ko * D, 1)} / ${f(ks * D, 1)} deg`);
}

// ---- Simulacija (classic physics) ----
{
  const st = run(HC, SIM, 'stand', 0.25);
  ok('Simulacija: 100 km/h into a standing car (centred): the car hit moves (equal weights), it leaves faster than the one that hit it, both between 25 and 75 km/h; no pop (under 5 cm a step at 100 km/h)',
    st.hit && st.O.v > st.P.v && st.P.v * 3.6 > 25 && st.O.v * 3.6 < 75 && st.P.v * 3.6 < 75 && st.pop < 0.05, `player ${f(st.P.v * 3.6, 1)} km/h, the other ${f(st.O.v * 3.6, 1)} km/h, pop ${f(st.pop * 100, 1)} cm`);
  // the bounce by the closing speed: a rear-end knock at 2 m/s and at 8 m/s (cars side by side in a straight line, nothing else)
  const part = (dv) => test(SIM, () => { const A = HC.mkCar('rally', { v: 72 }), B = HC.mkCar('rally', { v: 72 }); A.place(0, 0, 0); A.vx = 20; B.place(A.m.len - 0.02, 0, 0); B.vx = 20 - dv; C.carCollide(B, A); return (B.vx - A.vx) / dv; });
  const lean = test(SIM, () => { const A = HC.mkCar('rally', { v: 72 }), B = HC.mkCar('rally', { v: 72 }); A.place(0, 0, 0); A.vx = 20; B.place(A.m.len - 0.02, 0, 0); B.vx = 19.7; C.carCollide(B, A); return B.vx - A.vx; });
  const p2 = part(2), p8 = part(8);
  ok('Simulacija: the bounce by the closing speed (a light knock 0.2-0.35 of it, a hard one less, 0.1-0.2; a car leaning on another at 0.3 m/s: none)',
    p2 > 0.2 && p2 < 0.35 && p8 > 0.1 && p8 < 0.2 && p8 < p2 && Math.abs(lean) < 0.01, `2 m/s: ${f(p2)}, 8 m/s: ${f(p8)}, leaning: ${f(lean, 3)} m/s apart`);
  const bu = run(HC, SIM, 'bump');
  ok('Simulacija: a racing bump 0.6 m off the middle (120 into 100 km/h): the car ahead is pushed on, neither car turns more than 4 deg or loses grip, no pop',
    bu.hit && bu.O.v * 3.6 > 105 && bu.P.turn < 4 && bu.O.turn < 4 && bu.P.gl === 0 && bu.O.gl === 0 && bu.pop < 0.03, `the car ahead ${f(bu.O.v * 3.6, 0)} km/h, turns ${f(bu.P.turn, 1)} / ${f(bu.O.turn, 1)} deg`);
  const dr = run(HC, SIM, 'drift3');
  ok('Simulacija: a rival drifting into the player\'s flank at 3 deg nudges it (0.4-2 m/s across, under 5 deg, the slide gone in under 0.8 s: the reference video ~1 s), no grip lost',
    dr.hit && dr.P.lat > 0.4 && dr.P.lat < 2 && dr.P.turn < 5 && dr.P.calm != null && dr.P.calm < 0.8 && dr.P.gl === 0, `${f(dr.P.lat)} m/s across, ${f(dr.P.turn, 1)} deg, calm in ${f(dr.P.calm)} s`);
  const rb = run(HC, SIM, 'rub', 2.5);
  ok('Simulacija: side by side at 110 and 90 km/h, the player leaning on the other car for 1 s: they do not lock their speeds (still 12 km/h or more apart), no jitter (under 2 cm a step)',
    rb.hit && rb.P.v - rb.O.v > 12 / 3.6 && rb.pop < 0.02, `${f(rb.P.v * 3.6, 1)} / ${f(rb.O.v * 3.6, 1)} km/h, pop ${f(rb.pop * 100, 1)} cm`);
  const pi = run(HC, SIM, 'pit', 2.5), fr = run(HC, SIM, 'front', 2.5);
  ok('Simulacija: a hard tap on the player\'s rear quarter (a PIT, 8 m/s across) takes its grip: it slides and turns 15-70 deg, the grip back within 1.5 s; a knock on its front quarter does not (under 20 deg, no grip lost)',
    pi.hit && pi.P.gl > 0.3 && pi.P.turn > 15 && pi.P.turn < 70 && pi.P.glBack != null && pi.P.glBack < 1.5 && fr.hit && fr.P.gl === 0 && fr.P.turn < 20 && !pi.nan && !fr.nan,
    `PIT: grip lost ${f(pi.P.gl)}, back in ${f(pi.P.glBack)} s, turned ${f(pi.P.turn, 1)} deg; front: ${f(fr.P.gl)}, ${f(fr.P.turn, 1)} deg`);
  const fx = (tx) => test(tx, () => { const P = HC.mkCar('rally', { v: 100 }), O = HC.mkCar('rally', { v: 0 }); P.isPlayer = true; O.place(0, 0, 0); P.place(-O.m.len + 0.02, 0, 0); P.vx = 27.8; P.fxCar = O.fxCar = 0; P.fxQ = O.fxQ = 0; C.carCollide(P, O); return { fx: Math.max(P.fxCar, O.fxCar), q: P.fxQ || O.fxQ }; });
  const s1 = fx(SIM), s0 = fx({ cv: 1, cFx: 0 });
  ok('Simulacija: a knock throws sparks (fxCar over 3 m/s, not held back); with Iskre izklop none (fxQ), the scrape marks stay (fxCar)', s1.fx > 3 && !s1.q && s0.q && s0.fx > 3, JSON.stringify([s1, s0]));
}

// ---- the other versions ----
{
  const sd = run(HC, ARC, 'drift3'), ss = run(HC, SIM, 'drift3');
  const pa = run(HC, ARC, 'pit', 2.5), ps = run(HC, SIM, 'pit', 2.5), qa = run(HC, ARC, 'pitP', 2.5), qs = run(HC, SIM, 'pitP', 2.5);
  ok('Arkadna: in a side knock the player moves less than the rival (and less than in Simulacija); a PIT on the player turns it under half as much as in Simulacija, the rival PIT\'ed by the player more than in Simulacija',
    sd.P.lat < sd.O.lat && sd.P.lat < ss.P.lat && pa.P.turn < 0.5 * ps.P.turn && qa.O.turn > qs.O.turn,
    `side: player ${f(sd.P.lat)} / rival ${f(sd.O.lat)} m/s (sim ${f(ss.P.lat)}); PIT on the player ${f(pa.P.turn, 1)} deg (sim ${f(ps.P.turn, 1)}), on the rival ${f(qa.O.turn, 1)} deg (sim ${f(qs.O.turn, 1)})`);
  const pm = run(HC, SOFT, 'pit', 2.5), pk = run(HC, STUNT, 'pit', 2.5);
  ok('Mehka turns a PIT\'ed car less than Simulacija, Kaskaderska more', pm.P.turn < ps.P.turn && pk.P.turn > ps.P.turn, `Mehka ${f(pm.P.turn, 1)}, Simulacija ${f(ps.P.turn, 1)}, Kaskaderska ${f(pk.P.turn, 1)} deg`);
  const rows = [run(HC, { cv: 1, cYaw: 0.4 }, 'pit', 2.5), run(HC, { cv: 1, cGl: 0 }, 'pit', 2.5), run(HC, { cv: 1, cE: 0 }, 'bump'), run(HC, { cv: 1, cPm: 2 }, 'drift3')];
  ok('the rows over a version: less turn (cYaw 0.4) and no grip lost (cGl 0) turn a PIT\'ed car less, no bounce (cE 0) parts a bump slower, a heavier player (cPm 2) is moved less',
    rows[0].P.turn < ps.P.turn && rows[1].P.gl === 0 && rows[1].P.turn < ps.P.turn && rows[2].sep < bu0().sep && rows[3].P.lat < ss.P.lat,
    `${f(rows[0].P.turn, 1)} / ${f(rows[1].P.turn, 1)} deg (sim ${f(ps.P.turn, 1)}), apart ${f(rows[2].sep)} m/s, moved ${f(rows[3].P.lat)} m/s (sim ${f(ss.P.lat)})`);
  function bu0() { return run(HC, SIM, 'bump'); }
}

// ---- the new physics ----
{
  const dr = run(HN, SIM, 'drift3'), pi = run(HN, SIM, 'pit', 2.5), bu = run(HN, SIM, 'bump');
  ok('Nova with Simulacija: a rival drifting into the flank nudges the car (under 2 m/s, under 8 deg), a PIT turns it (over 8 deg) and it straightens (under 0.5 rad/s at the end), a bump parts the cars, nothing NaN',
    dr.hit && dr.P.lat < 2 && dr.P.turn < 8 && pi.hit && pi.P.turn > 8 && !dr.nan && !pi.nan && !bu.nan && bu.sep > 0.2, `${f(dr.P.lat)} m/s ${f(dr.P.turn, 1)} deg; PIT ${f(pi.P.turn, 1)} deg; bump apart ${f(bu.sep)} m/s`);
}

// ---- a friend's car online ----
{
  const r = test(SIM, () => { const P = HC.mkCar('rally', { v: 100 }), O = HC.mkCar('rally', { v: 80 }); P.isPlayer = true; O.net = true; O.place(0, 0, 0); O.vx = 22.2; P.place(-O.m.len + 0.1, 0.3, 0); P.vx = 27.8;
    const o = [O.x, O.z, O.vx, O.vz, O.w], p0 = P.x; C.carCollide(P, O); return { same: o.join() === [O.x, O.z, O.vx, O.vz, O.w].join(), moved: p0 - P.x, dv: 27.8 - P.vx }; });
  ok('online: a friend\'s car is not moved by the knock (its own phone moves it); the local car takes the whole separation and its own share of the push', r.same && r.moved > 0 && r.dv > 0.5 && r.dv < 5, JSON.stringify(r));
}

// ---- the walls as they were ----
{
  const T = new C.Track(C.TRACKS.find(d => d.id === 'spa'));
  const hit = (tx) => test(tx, () => { const c = new C.Car(C.MODELS[4], { phys: 'cs' }); const i = 200, br = T.br[i];
    c.place(T.px[i] - T.nx[i] * (br - 0.5), T.pz[i] - T.nz[i] * (br - 0.5), Math.atan2(T.tz[i], T.tx[i]) - 0.35); c.q.i = i; T.query(c.x, c.z, i, c.q);
    const v = 25, h = c.h; c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v; c.w = 0.2; c.wq.forEach(q => q.i = -1); for (let k = 0; k < 30; k++) { c.x += c.vx / 120; c.z += c.vz / 120; T.query(c.x, c.z, c.q.i, c.q); C.wallCollide(c, T); }
    return [c.x, c.z, c.vx, c.vz, c.w].map(x => x.toFixed(6)).join(','); });
  const w = [OLD, SIM, ARC, SOFT, STUNT].map(hit);
  ok('walls: the knock off the barrier is the same in every version (the user\'s: the walls stay as they were)', w.every(x => x === w[0]), w.join(' | '));
}

// ---- races ----
function race(tid, tx) {
  return test(tx, () => {
    Math.random = seeded(64); const T = new C.Track(C.TRACKS.find(d => d.id === tid));
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); r.start();
    const sp = new Map(), glue = new Map(); let spins = 0, glued = 0, nan = false, hits = 0;
    for (let k = 1; k <= 150 / DT; k++) {
      Math.random = seeded(1000 + k); C.aiControl(r.player, r, DT); r.step(DT);
      for (const c of r.cars) { if (!Number.isFinite(c.x + c.z + c.vx + c.vz + c.w)) nan = true; if (c.hitCar > 3) hits++; c.hitCar = 0;
        const s = Math.abs(c.beta || 0) > 0.7 && c.speed > 8; if (s && !sp.get(c)) spins++; sp.set(c, s); }
      if (k % 12 === 0) for (let a = 0; a < r.cars.length; a++) for (let b = a + 1; b < r.cars.length; b++) { const A = r.cars[a], B = r.cars[b], dx = B.x - A.x, dz = B.z - A.z; if (dx * dx + dz * dz > 36) { glue.set(a * 100 + b, 0); continue; }
        const ch = Math.cos(A.h), sh = Math.sin(A.h), lx = dx * ch + dz * sh, lz = -dx * sh + dz * ch, touch = Math.abs(lx) < A.m.len * 0.9 && Math.abs(lz) < (A.m.wid + B.m.wid) * 0.5 + 0.08 && A.speed > 5;
        const n = touch ? (glue.get(a * 100 + b) || 0) + 1 : 0; glue.set(a * 100 + b, n); if (n === 20) glued++; }
    }
    return { nan, spins, glued, hits, moving: r.cars.filter(c => c.speed > 5).length, n: r.cars.length };
  });
}
for (const tid of ['spa', 'bathurst']) {
  const res = [SIM, ARC, SOFT, STUNT, OLD].map(tx => race(tid, tx)), nm = ['Simulacija', 'Arkadna', 'Mehka', 'Kaskaderska', 'Stara'];
  ok(`race ${tid} in every version: nothing NaN, every car moving, no two cars glued side by side for 2 s, spins at most 4 in Simulacija, Arkadna and Mehka`,
    res.every(x => !x.nan && x.moving === x.n && x.glued === 0) && res.slice(0, 3).every(x => x.spins <= 4), res.map((x, i) => `${nm[i]}: ${x.hits} knocks, ${x.spins} spins, ${x.glued} glued, ${x.moving}/${x.n} moving`).join('; '));
}

let bad = 0;
console.log('== trki med avti (različice)');
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} checks`);
process.exitCode = bad ? 1 : 0;
