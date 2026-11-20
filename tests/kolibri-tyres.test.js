// The Kolibri's tyres (Race opts.tyreRule; the game: the player's KOLIBRI, every track): each tyre its own wear and damage (Car.kt). The
// wear: a clean run up a road ~0.24 whatever its length, a race on a circuit about 4 times the usual tyres' (worn: less grip), a slide and
// a wheel off the road (grass, gravel: that wheel only) more. The damage only from knocks (damage Samo videz or Vklop), only to be seen:
// the corner's tyre the most, the one beside it a little, the far one none; knocks alone never set one on fire. One burns (only one: less
// side grip, the drive the same) where the car caught fire before: its damage at 80 %, a hard hit from 70 %, the most knocked tyre; in a
// race with the wheel rule only; the wear never does. A burning tyre's wheel comes off at the next real knock (a big knock: two at
// once), the whole car on fire, the car stops and the game is over (the user, 9. 11. 2026: »Ko ti enkrat odpade kolo, je igre konec«; no
// ZAMENJAJ KOLO, no second wheel). A pit stop: four new tyres, cold for a lap. Damage off: the wear only.
// The user's choices of 3. 11. 2026: the cold tyres after a stop grip less only on the KOLIBRI (opts.tyreCold; on the others' cars the light
// blue dots only), rain tyres on a drying road wear 2.5 times (every car), no wear in a mission (the mission's options: no tyreRule, checked
// in tests/missions.test.js), the wear also in a time trial and on a track without pits.
//   node tests/kolibri-tyres.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const KOL = C.MODELS.find(m => m.id === 'kolibri'), track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const MK = track('marrakesh'), f2 = (a) => a.map(v => v.toFixed(2)).join(' ');   // (a real circuit without pits: the test tracks are not for checking, CLAUDE.md)
const race = (o, T) => new C.Race(T || MK, Object.assign({ numAI: 3, playerGrid: 1, laps: 3, playerModel: KOL, assist: 2, seed: 3, difficulty: 1, damage: 1, tyreRule: ['kolibri'], tyreCold: ['kolibri'], wheelRule: ['kolibri'] }, o));
function setUp(o) { const r = race(o); r.start(); const P = r.player; P.vx = Math.cos(P.h) * 25; P.vz = Math.sin(P.h) * 25; return { r, P, K: P.kt, W: P.wreck, Q: P.wreck && P.wreck.rule }; }
const L = KOL.len / 2, Wd = KOL.wid / 2, FL = [L, -Wd];   // (the front left corner: lx, lz)
function until(r, fn, s, slide) {   // steps until fn() or s seconds; the player straight on (slide: the car kept sideways)
  for (let t = 0; t < s; t += DT) { if (fn()) return t; const P = r.player; if (!r.isOut(P)) { P.inThr = 1; P.inBrk = 0; P.inSteer = 0; if (slide) P.beta = 0.4; } r.step(DT); }
  return fn() ? s : Infinity;
}

// 1. only on the player's KOLIBRI with the option; its wheel rule from Samo videz on
{
  const a = race(), b = race({ playerModel: C.MODELS[0] }), c = race({ tyreRule: undefined }), d = race({ damage: 0 }), e = race({ damage: 2 });
  check('the tyres only on the player\'s KOLIBRI with the option (not the AI, another car, or without it)', !!a.player.kt && a.cars.every(x => x.isPlayer || !x.kt) && !b.player.kt && !c.player.kt);
  check('its wheel rule with damage Samo videz and Vklop, none with damage off', a.player.wreck.rule && a.player.wreck.rule.kt && e.player.wreck.rule.kt && !d.player.wreck.rule && !!d.player.kt);
}
// 2. the wear: a clean run ~0.24 (two roads of different lengths), a lap of a circuit ~4 times the usual tyres
{
  const run = (id, o) => { const T = track(id), r = race(Object.assign({ numAI: 0, laps: 1, tt: !!T.open }, o), T); r.start(); const P = r.player; let t = 0; while (!P.finished && t < 900) { C.aiControl(P, r, DT); r.step(DT); t += DT; } return P; };
  const A = run('baldy'), B = run('vrsic');
  const ok = (P) => P.kt.w.every(w => w > 0.19 && w < 0.29);
  check('a clean run up a road: each tyre ~0.24 worn at the finish, whatever the road\'s length', ok(A) && ok(B), `Mount Baldy ${f2(A.kt.w)}; Vršič ${f2(B.kt.w)}`);
  const S = run('spa', { tyres: true }), O = run('spa', { tyres: true, tyreRule: undefined, wheelRule: undefined }), k = S.kt.w[0] / O.ty.wear;
  check('a lap of a circuit: about 4 times the usual tyres\' wear (the Kolibri\'s without its own); the set\'s wear (the radio, the pits) the four\'s mean', k > 3 && k < 5.5 && Math.abs(S.ty.wear - S.kt.w.reduce((a, b) => a + b) / 4) < 1e-9, `Spa: ${f2(S.kt.w)} against ${O.ty.wear.toFixed(3)} (x${k.toFixed(1)})`);
  const { P } = setUp(); const g0 = C.ktGrip(P).slice(); P.kt.w = [1, 1, 1, 1]; const g1 = C.ktGrip(P).slice();
  check('worn tyres grip less (10 %)', g1[0] < g0[0] - 0.09 && g1[0] > g0[0] - 0.11, `${g0[0]} -> ${g1[0].toFixed(2)}`);
  const Q = setUp().P, r1 = Q.kt; Q.ws = [0, 0, 0, 0]; C.ktWear(Q, { track: MK }, 100); const w0 = r1.w[0]; Q.beta = 0.4; C.ktWear(Q, { track: MK }, 100); const w1 = r1.w[0] - w0;
  Q.beta = 0; Q.ws = [2, 0, 3, 0]; const v0 = r1.w.slice(); C.ktWear(Q, { track: MK }, 100); const dw = r1.w.map((w, i) => w - v0[i]);
  check('a slide wears them faster, a wheel on the grass or the gravel only that one', w1 > 3 * w0 && dw[0] > 2.5 * dw[1] && dw[2] > 2.5 * dw[3] && Math.abs(dw[1] - dw[3]) < 1e-12, `slide x${(w1 / w0).toFixed(1)}; off ${f2(dw.map(x => x * 1e4))} (1e-4)`);
  Q.kt.w = [1, 1, 1, 1]; Q.kt.d = [0, 0, 0, 0]; C.ktWear(Q, { track: MK }, 5000);
  check('the wear alone never sets one on fire', Q.kt.hot === -1);
}
// 3. knocks: the corner's tyre, a little the one beside it, not the far one, only to be seen; a tyre burns only where the car caught fire
// before (its damage at 80 %, a hard hit from 70 %), a touch next to nothing
{
  const { P, K } = setUp(); C.applyDamage(P, 0.01, FL[0], FL[1]);
  check('an average knock on the front left corner: that tyre ~1/6, the ones beside it a little, the far one nothing', K.d[0] > 0.14 && K.d[0] < 0.2 && K.d[1] > 0 && K.d[1] < 0.06 && K.d[2] > 0 && K.d[2] < 0.06 && K.d[3] === 0, f2(K.d));
  for (let i = 0; i < 9; i++) C.applyDamage(P, 0.01, FL[0], FL[1]);
  const h = setUp(); for (let i = 0; i < 6; i++) C.applyDamage(h.P, 0.032, -L, Wd);
  const g0 = C.ktGrip(P).slice();
  check('ten average knocks in one corner, six hard ones: no tyre burns, no wheel off, the grip as new (the tyre only redder, up to 0.75)', K.hot === -1 && h.K.hot === -1 && !h.W.nL && K.d[0] === 0.75 && g0.every(v => v === 1), `${f2(K.d)}; hard ${f2(h.K.d)}, dmg ${h.P.dmg.toFixed(3)}`);
  const t = setUp(); for (let i = 0; i < 10; i++) C.applyDamage(t.P, 0.002, FL[0], FL[1]);
  check('ten touches next to nothing', t.K.d[0] < 0.12, `touches ${f2(t.K.d)}`);
  P.dmg = 0.79; C.applyDamage(P, 0.012, -L, Wd);
  check('the car\'s damage at 80 % (where it caught fire before): the most knocked tyre burns, that knock takes no wheel', K.hot === 0 && !P.wreck.wl, `dmg ${P.dmg.toFixed(3)}, hot ${K.hot}`);
  const a = setUp(); a.P.dmg = 0.7; C.applyDamage(a.P, 0.01, -L, Wd); const soft = a.K.hot; C.applyDamage(a.P, 0.021, -L, Wd);
  check('from 70 %: an average knock sets none on fire, a hard one (2 %) at once, at its corner', soft === -1 && a.K.hot === 3, `${soft} -> ${a.K.hot}`);
  const m0 = P.dmgMode, gv = C.ktGrip(P).slice(); P.dmgMode = 2; const g = C.ktGrip(P); P.dmgMode = m0;
  check('a burning tyre: at Samo videz only to be seen (the grip as new), at Vklop much less side grip, the drive, the speed and the brakes as before', m0 === 1 && gv.every(v => v === 1) && g[4] < 0.75 && g[0] === 1, `mode ${m0}: side ${gv[4]}; Vklop: side ${g[4]}, wheel ${g[0]}`);
  const n = setUp({ wheelRule: undefined }); n.P.dmg = 0.79; C.applyDamage(n.P, 0.02, FL[0], FL[1]);
  check('without the wheel rule (a time trial, qualifying): no tyre on fire at 80 %', n.K.hot === -1);
  const z = setUp({ damage: 0 }); for (let i = 0; i < 8; i++) C.applyDamage(z.P, 0.03, FL[0], FL[1]);
  check('damage off: no tyre damage, no fire (the wear only)', z.K.d.every(v => v === 0) && z.K.hot === -1);
}
// 4. a burning tyre's wheel: a touch leaves it, a real knock takes it, the whole car on fire and the game over; a big knock: two at once
{
  const burn = (o) => { const s = setUp(o); s.K.d[1] = 1; s.K.hot = 1; return s; };
  const a = burn(); C.applyDamage(a.P, 0.003, FL[0], FL[1]); const kept = !a.W.wl; C.applyDamage(a.P, 0.009, -L, -Wd);
  check('a burning tyre: a touch does not take the wheel, a real knock anywhere takes that one (no other), the whole car on fire at once', kept && a.W.wl === 2 && a.W.nL === 1 && a.Q.burn === 2 && a.Q.fn === 1 && a.K.hot === -1, `wheels off ${a.W.wl}, fire ${a.Q.fn}/${a.Q.burn}`);
  const tOver = until(a.r, () => a.Q.over, 6);
  check('a wheel off: the car stops at once, the game is over (KONEC IGRE), no second wheel', a.Q.over && a.P.speed < 0.5 && tOver < 3 && a.W.nL === 1, `over ${tOver.toFixed(2)} s, ${a.W.nL} off`);
  const d = burn(); C.applyDamage(d.P, 0.03, FL[0], FL[1]);
  check('a big knock on a burning tyre: two wheels at once, the car on fire', d.W.nL === 2 && d.Q.burn === 2);
  check('no ZAMENJAJ KOLO (no Race.changeWheel)', typeof a.r.changeWheel === 'undefined');
}
// 5. a pit stop: four new tyres, cold for a lap after it (the KOLIBRI's: less grip meanwhile; another car's: only to be seen, as 6 below)
const pitStop = (o) => {
  const T = track('bathurst'), r = race(Object.assign({ numAI: 0, laps: 2, tyres: true, wheelRule: undefined }, o), T); r.start(); const P = r.player;
  P.kt.w = [0.5, 0.5, 0.5, 0.5]; P.kt.d = [1, 0.3, 0, 0]; P.kt.hot = 0; P.pitWant = true; let t = 0, stop = false, gc = 1, out = 0;
  while (t < 400 && !P.finished) { C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.pitState === 'done') stop = true; if (stop && !P.inPit && gc === 1) gc = C.ktGrip(P)[0]; if (stop && !P.inPit && (out += DT) > 20) break; }
  return { P, stop, gc };
};
{
  const { P, stop, gc } = pitStop();
  check('a pit stop: four new tyres, none burning; cold for a lap after it (less grip, warming up)', stop && P.kt.d.every(v => v === 0) && P.kt.hot === -1 && P.kt.cold > 0.2 && P.kt.cold < 0.95 && gc < 0.92 && P.kt.w[0] < 0.1, `grip cold ${gc.toFixed(2)}, 20 s on ${C.ktGrip(P)[0].toFixed(3)} (cold ${P.kt.cold.toFixed(2)}), wear ${f2(P.kt.w)}`);
}
// 6. the user's choices of 3. 11. 2026 (opts.tyreCold, the wet tyres' wear, the time trial and the track without pits; no mission: missions.test.js)
{
  const SOK = C.MODELS.find(m => m.id === 'sokol'), ALL = C.MODELS.map(m => m.id), all = { playerModel: SOK, tyreRule: ALL, wheelRule: ALL };
  const a = race(), b = race(all), c = race(Object.assign({}, all, { tyreCold: undefined })), d = race({ tyreCold: ['sokol'] });
  check('opts.tyreCold: only the cars it lists lose grip while cold (kt.cg): the KOLIBRI yes, another car (SOKOL) no, nobody without the option', a.player.kt.cg === true && b.player.kt.cg === false && c.player.kt.cg === false && d.player.kt.cg === false);
  const gr = (r, cold) => { const K = r.player.kt; K.w = [0, 0, 0, 0]; K.cold = cold; return C.ktGrip(r.player)[0]; };
  check('new cold tyres: the KOLIBRI 12 % less grip, another car none (its tyres only light blue on the HUD, kt.cold as ever)', Math.abs(gr(a, 1) - 0.88) < 1e-9 && gr(b, 1) === 1 && gr(b, 0) === 1 && gr(a, 0) === 1 && gr(a, 0.5) > 0.9 && gr(a, 0.5) < 0.95, `KOLIBRI ${gr(a, 1)}, ${gr(a, 0.5).toFixed(2)} half warm; SOKOL ${gr(b, 1)}`);
  const { P: S, stop: sStop, gc: sGc } = pitStop({ playerModel: SOK, tyreRule: ALL });
  check('a pit stop of another car (SOKOL): the same new tyres, cold to be seen for a lap after it, the grip not less for it', sStop && S.kt.cg === false && S.kt.d.every(v => v === 0) && S.kt.cold > 0.2 && S.kt.cold < 0.95 && sGc > 0.98 && S.kt.w[0] < 0.1, `grip ${sGc.toFixed(3)}, cold ${S.kt.cold.toFixed(2)}, wear ${f2(S.kt.w)}`);
  const wear = (r, ty, line, T) => { const P = r.player; P.ws = [0, 0, 0, 0]; P.ty = ty; P.kt.w = [0, 0, 0, 0]; C.ktWear(P, { track: T || MK, wst: { line } }, 100); const w = P.kt.w[0]; P.ty = null; return w; };
  const rt = (r) => ({ drying: wear(r, { k: 'wet', wear: 0 }, 0.1) / wear(r, { k: 'wet', wear: 0 }, 0.5), edge: wear(r, { k: 'wet', wear: 0 }, 0.25) / wear(r, { k: 'wet', wear: 0 }, 0.5), slicks: wear(r, { k: 'dry', wear: 0 }, 0.1) / wear(r, { k: 'dry', wear: 0 }, 0.5), none: wear(r, null, 0.1) / wear(r, null, 0.5) });
  const ra = rt(a), rb = rt(b);
  check('rain tyres on a drying road (the line under 25 % wet) wear 2.5 times, on a wet one, slicks and without a set the usual: the KOLIBRI and another car', [ra, rb].every(x => Math.abs(x.drying - 2.5) < 1e-9 && x.edge === 1 && x.slicks === 1 && x.none === 1), JSON.stringify({ KOLIBRI: ra, SOKOL: rb }));
  const B = track('baldy'), wb = wear(a, { k: 'wet', wear: 0 }, 0.1, B) / wear(a, { k: 'wet', wear: 0 }, 0.5, B);
  check('on a road up a mountain (no set of tyres, one run) the wear does not depend on it', wb === 1, `x${wb}`);
  // the wear in a time trial and on a track without pits (a mission has none: tests/missions.test.js)
  const run = (id, o) => { const T = track(id), r = race(Object.assign({ numAI: 0, laps: 1, tt: !!T.open, playerModel: SOK, tyreRule: ALL, wheelRule: undefined }, o), T); r.start(); const Q = r.player; let t = 0; while (!Q.finished && t < 900) { C.aiControl(Q, r, DT); r.step(DT); t += DT; } return { r, Q }; };
  const tt = run('baldy'), cc = run('marrakesh');
  check('the wear also in a time trial (an open road, no pits: ~0.24 at the finish) and on a track without pits (a lap of a circuit): every car', tt.r.timeTrial && !tt.r.track.def.pit && tt.Q.kt.w.every(w => w > 0.19 && w < 0.29) && !cc.r.track.def.pit && cc.Q.kt.w.every(w => w > 0.02), `time trial ${tt.r.timeTrial} ${f2(tt.Q.kt.w)}; Marrakesh ${f2(cc.Q.kt.w)}`);
}
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
