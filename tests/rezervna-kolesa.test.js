// The spare wheels in sight (Core.SPARE: a part's entry spare, docs/deli.md »Rezervno kolo«; the user's decision of 9. 11. 2026: »Rezervna
// kolesa, ki so na nekaterih vozilih, naj se ob približno 50 % poškodovanem avtu začnejo majati, kot da bodo kmalu odpadla, in nato pri 80 %
// odpadejo«). The vehicles that have them (KAMEN and PEŠČENJAK two behind the cab, MEDVED one on its tailgate, the TITAN CISTERNA four on
// its trailer's rack; a new vehicle may add its own); they come off by the car's damage alone at SPARE.off (never below it, whatever the
// knock: their end battered, their corners; spread damage too), with damage Samo videz and Vklop, never with damage off; a rival's as the
// player's; MEDVED's goes with its tailgate (its on); the trailer's pieces start at its rack, not at the tractor. The rocking from SPARE.wob
// is the renderer's: tests/browser/rezervna-kolesa.test.mjs. On a real track (Bathurst).
//   node tests/rezervna-kolesa.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const T = new C.Track(C.TRACKS.find(d => d.id === 'bathurst')), S = C.SPARE;
const WANT = { kamen: ['spareL', 'spareR'], pescenjak: ['spareL', 'spareR'], medved: ['spare'], cisterna: ['tlSpare1', 'tlSpare2', 'tlSpare3', 'tlSpare4'] };
const pc = (x) => (x * 100).toFixed(0) + ' %';
const race = (M, damage, numAI = 0) => { const r = new C.Race(T, { numAI, playerGrid: 1, laps: 3, playerModel: M, fieldModel: M, assist: 2, seed: 3, difficulty: 1, damage }); r.start(); return r; };
// spread damage (no point: a hard landing's) up to `to` of the car's (its toughness taken out, as the career's wear does)
const spread = (c, to) => C.applyDamage(c, (to - c.dmg) / ((c.dmgK || 1) * (c.m.dmgK || 1)));

check('the thresholds: rocking from 50 %, off at 80 %', S.wob === 0.5 && S.off === 0.8, JSON.stringify(S));

// 1. who has them: the four vehicles at least (a new one may add its own); every spare a part of its own, no wheel, tl only on a trailer
{
  const has = {}, wrong = [];
  for (const M of C.MODELS) {
    const PT = C.partsOf(M), sp = Object.keys(PT).filter(k => PT[k].spare);
    if (sp.length) has[M.id] = sp;
    for (const k of sp) if (PT[k].wh != null || (PT[k].tl && !(M.trailer && M.trailer.look))) wrong.push(M.id + '.' + k);
  }
  const miss = Object.keys(WANT).filter(id => !has[id] || WANT[id].some(k => has[id].indexOf(k) < 0));
  check('KAMEN, PEŠČENJAK, MEDVED and the TITAN CISTERNA have their spare wheels as parts (spare: 1)', !miss.length && !wrong.length, (miss.length ? 'missing ' + miss.join(', ') + '; ' : '') + (wrong.length ? 'wrong ' + wrong.join(', ') + '; ' : '') + JSON.stringify(has));
}

for (const id of Object.keys(WANT)) {
  const M = C.MODELS.find(m => m.id === id), SP = WANT[id], PT = C.partsOf(M);
  if (!M) { check(id + ': the vehicle', false, 'not in Core.MODELS'); continue; }
  // 2. spread damage: none off under 80 %, all of them at it (Samo videz, Vklop)
  for (const dm of [1, 2]) {
    const r = race(M, dm), P = r.player, off = () => SP.filter(k => P.lost[k]).length;
    spread(P, 0.55); const a = off(), d0 = P.dmg; spread(P, 0.79); const b = off(), d1 = P.dmg; spread(P, 0.81); const c = off(), d2 = P.dmg;
    check(`${M.name}, damage ${dm === 1 ? 'Samo videz' : 'Vklop'}: on at ${pc(d0)} and ${pc(d1)}, all ${SP.length} off at ${pc(d2)} (spread damage)`, a === 0 && b === 0 && c === SP.length && d1 < S.off && d2 >= S.off, `${a} ${b} ${c}`);
  }
  // 3. knocks where they are (their end, their side: the zone battered through, its corners): still on under 80 %, off once the car is at it
  {
    const r = race(M, 2), P = r.player, hl = M.len / 2, hw = M.wid / 2, at = SP.map(k => PT[k].tl ? [-hl, 0] : [PT[k].lx * hl, PT[k].lz * hw]);
    let i = 0; for (; i < 400 && P.dmg < 0.78; i++) { const [x, z] = at[i % at.length]; C.applyDamage(P, 0.01, x, z); }
    const under = SP.filter(k => P.lost[k] && !(PT[k].on && P.lost[PT[k].on])), d1 = P.dmg;
    for (; i < 800 && P.dmg < S.off; i++) { const [x, z] = at[i % at.length]; C.applyDamage(P, 0.01, x, z); }
    const zone = Math.max(...P.dz), allOff = SP.every(k => P.lost[k]);
    check(`${M.name}: knocks on them (their zone at ${pc(zone)}) leave them on at ${pc(d1)}, the knock to ${pc(P.dmg)} takes them all off`, !under.length && d1 < S.off && P.dmg >= S.off && allOff, under.join(' '));
  }
  // 4. damage off: no damage, none off
  { const r = race(M, 0), P = r.player; spread(P, 0.95); C.applyDamage(P, 1, -M.len / 2, 0);
    check(`${M.name}, damage off: no damage, the spares stay on`, P.dmg === 0 && !SP.some(k => P.lost[k]), pc(P.dmg)); }
  // 5. a rival's as the player's
  { const r = race(M, 2, 1), A = r.cars.find(c => !c.isPlayer);
    if (!A || A.m.id !== M.id) check(`${M.name}: a rival of the same make`, false, A ? A.m.id : 'no rival');
    else { spread(A, 0.79); const a = SP.filter(k => A.lost[k]).length; spread(A, 0.81); const b = SP.filter(k => A.lost[k]).length;
      check(`${M.name}: a rival's come off at 80 % too (${a} at ${pc(0.79)}, ${b} at ${pc(A.dmg)})`, a === 0 && b === SP.length); }
  }
}

// 6. MEDVED: its spare is on its tailgate (on): the tailgate knocked off takes it with it, under 80 % too
{
  const M = C.MODELS.find(m => m.id === 'medved'), r = race(M, 2), P = r.player, PT = C.partsOf(M);
  let i = 0; for (; i < 400 && !P.lost.tailgate && P.dmg < S.off; i++) C.applyDamage(P, 0.01, -M.len / 2, 0);
  check(`MEDVED: its spare is on its tailgate and goes with it (the tailgate off at ${pc(P.dmg)})`, PT.spare && PT.spare.on === 'tailgate' && P.lost.tailgate && P.lost.spare && P.dmg < S.off, JSON.stringify(Object.keys(P.lost)));
}

// 7. the TITAN CISTERNA: its tyres' pieces start at the trailer's rack (its rear), not at the tractor, at the rack's height
{
  const M = C.MODELS.find(m => m.id === 'cisterna'), r = race(M, 2), P = r.player, TL = P.tl;
  spread(P, 0.81); r.step(DT);
  const kx = TL.x - Math.cos(TL.h) * TL.cx, kz = TL.z - Math.sin(TL.h) * TL.cx, rx = kx - Math.cos(TL.h) * 11.12, rz = kz - Math.sin(TL.h) * 11.12;   // (the kingpin, the rack 11.12 m behind it)
  const D = r.debris.filter(d => d.car === P.id && /^tlSpare\d$/.test(d.part)), far = D.map(d => Math.hypot(d.x - rx, d.z - rz)), ys = D.map(d => d.y - (TL.yA || 0));
  check('the TITAN CISTERNA: its four tyres\' pieces start at the trailer\'s rack, 0.9 m up', D.length === 4 && Math.max(...far) < 1.2 && D.every(d => Math.hypot(d.x - P.x, d.z - P.z) > 9) && ys.every(y => y > 0.6 && y < 1.2),
    `${D.length} pieces, at most ${Math.max(...far).toFixed(2)} m from the rack, ${ys.map(y => y.toFixed(2)).join(' ')} m up`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
