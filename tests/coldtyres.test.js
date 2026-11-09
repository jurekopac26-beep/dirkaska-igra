// Cold tyres after a stop (105, Core only, no browser): a new set from the pits is cold (ty.cold 1) from the fitting to the way out of the
// lane and warms up smoothly over the first half lap after it (TCOLD.d; about half way a quarter of a lap on); meanwhile the car grips
// TCOLD.g less on the coldest (Race._weather: c.wet), warm the same as before; every AI car's new set the same rule; the start's set never
// cold; the same race twice is the same to the last bit (no random draws, no clock).
//   node tests/coldtyres.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const f3 = (x) => (Number.isFinite(x) ? x.toFixed(3) : String(x));

// a race on Bathurst with tyres and compounds, a strategy race (the rivals stop too); the player in at the end of its first lap. Its set's
// coldness at the fitting, at the way out, a quarter and half a lap on; its grip cold against warm there (the same spot, the same water);
// the rivals' stops (their sets cold after them, warm half a lap past the way out)
function race() {
  Math.random = seeded(3);
  const T = new C.Track(C.TRACKS.find(d => d.id === 'bathurst')), L = T.len;
  const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 4, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tyres: true, compounds: true, strat: true });
  r.start(); const P = r.player, out = { start: r.cars.map(c => c.ty.cold || 0), ai: new Map(), at: {} }; let t = 0, k = 0, asked = false, hb = null, x0 = null, rep = false;
  const grip = () => { const ty = P.ty, c0 = ty.cold, o0 = ty.co; r._weather(0); const cold = P.wet; ty.co = P.dist - L; r._weather(0); const warm = P.wet; ty.co = o0; ty.cold = c0; r._weather(0); return { cold: c0, ratio: cold / warm }; };
  while (t < 520 && !(x0 != null && P.dist > x0 + 0.6 * L)) {
    Math.random = seeded(5000 + (++k));
    if (!asked && P.lap >= 1 && !T.pitAt(P.q.s)) { asked = true; P.pitWant = true; }
    if (P.inPit && P.pitDone && !hb) { const p1 = T.pitAt(P.q.s + Math.max(12, P.speed * 1.3)); if (!p1 || (p1.gap && p1.o <= p1.wall + 1)) hb = t; }
    if (hb != null) P.pitWant = false;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.pitDone && P.inPit && !out.at.fit) { rep = true; out.at.fit = { cold: P.ty.cold }; }
    if (rep && !P.inPit && x0 == null) { x0 = P.dist; out.at.exit = grip(); }
    if (x0 != null && !out.at.q && P.dist >= x0 + 0.25 * L) out.at.q = grip();
    if (x0 != null && !out.at.h && P.dist >= x0 + 0.5 * L + 1) out.at.h = grip();
    for (const c of r.cars) { if (c === P || !c.ty) continue; const a = out.ai.get(c) || { seen: false, warm: false };
      if (c.inPit && c.pitDone && c.ty.cold === 1) a.seen = true;   // (a new set: cold from the fitting)
      if (a.seen && !c.inPit && c.dist - c.ty.co >= 0.5 * L + 1 && c.ty.cold === 0) a.warm = true;
      out.ai.set(c, a); }
  }
  out.sig = r.cars.map(c => [c.x, c.z, c.wet, c.dist, c.ty.cold || 0].join(',')).join(';');
  return out;
}

const A = race(), G = C.TCOLD;
{
  check('the start\'s set: never cold', A.start.every(v => v === 0), A.start.join(','));
  const e = A.at;
  check('the new set at the fitting and at the way out: cold (1)', !!e.fit && e.fit.cold === 1 && !!e.exit && e.exit.cold === 1, JSON.stringify({ fit: e.fit && e.fit.cold, exit: e.exit && e.exit.cold }));
  check('warming up smoothly: about half way a quarter of a lap on, warm half a lap on', !!e.q && Math.abs(e.q.cold - 0.5) < 0.04 && !!e.h && e.h.cold === 0,
    `${f3(e.q && e.q.cold)} a quarter on, ${f3(e.h && e.h.cold)} half a lap on`);
  check('the grip: TCOLD.g less on the coldest, less of it as they warm, warm the same as ever', !!e.exit && Math.abs(e.exit.ratio - (1 - G.g)) < 1e-4 && Math.abs(e.q.ratio - (1 - G.g * e.q.cold)) < 1e-4 && e.h.ratio === 1,
    `cold ${(e.exit && e.exit.ratio || 0).toFixed(6)}, a quarter on ${f3(e.q && e.q.ratio)}, half a lap on ${f3(e.h && e.h.ratio)} (TCOLD ${JSON.stringify(G)})`);
  const ai = [...A.ai.values()].filter(a => a.seen);
  check('the rivals the same rule: every AI car that stopped had its new set cold, warm again half a lap past the way out', ai.length >= 3 && ai.every(a => a.warm),
    `${ai.length} rivals stopped, ${ai.filter(a => a.warm).length} warm again`);
}
{
  const B = race();
  check('the same race twice: the same to the last bit', A.sig === B.sig, '');
}

console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
