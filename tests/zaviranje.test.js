// Samodejno zaviranje (Nastavitve, za začetnike; Core.autoBrake, v igri abStep v js/game.js), brez brskalnika, na Spa (prava proga):
// - začetnik s polnim plinom (volan avtopilota, plin vedno do konca, brez zavore): brez pomoči razbije avto in zapelje s ceste; s pomočjo
//   pride čez dva kroga brez poškodb, brez izleta in brez reševanja, največ 10 % počasneje od avtopilota
// - pomoč je samo vnos: Core.autoBrake ne spremeni avta ne dirke (klic na vsakem koraku, rezultat zavržen: stanje dirke do številke enako)
// - nič ne da (plin 1, zavora 0) v vzvratni, na stranski cesti, počasi in brez profila hitrosti
// - igra: privzeto izklopljeno, vrstica v Nastavitvah in prevod; abStep spremeni samo igralčev plin in zavoro (nikoli drugega), ne v lekciji
//   Zaviranje avtošole, posnetek jo zapiše (pf.ab)
//   node tests/zaviranje.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { loadCore } = require('./lib/core.js');
const S = require('./lib/sim.js');

const C = loadCore();
const checks = [];
const ok = (name, cond, detail) => checks.push({ name, ok: !!cond, detail });
const opts = (C) => ({ numAI: 0, playerGrid: 1, laps: 2, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2 });
const MAXK = 120 * 420;

// the beginner: the autopilot's steering, the throttle always full, never the brake; on: the assist's pedals added as js/game.js does
function beginner(on) {
  const race = S.makeRace(C, 'spa', opts), P = race.player, o = {};
  let off = 0, resc = 0, k = 0;
  for (; k < MAXK && !P.finished; k++) {
    Math.random = S.seeded(1000 + k);
    C.aiControl(P, race, S.DT); P.inThr = 1; P.inBrk = 0; P.inHand = 0;
    if (on) { const b = C.autoBrake(P, race, o); if (b.thr < P.inThr) P.inThr = b.thr; if (b.brk > P.inBrk) P.inBrk = b.brk; }
    if (P.stuckT > 3 || P.wrongT > 3) { race.rescue(P); resc++; }
    race.step(S.DT);
    if (P.q && Math.abs(P.q.d) > 7) off++;
  }
  return { fin: P.finished, t: k * S.DT, dmg: P.dmg, resc, off: off * S.DT };
}
const fmt = (r) => `${r.fin ? 'cilj' : 'brez cilja'} ${r.t.toFixed(1)} s, poškodbe ${(r.dmg * 100).toFixed(0)} %, reševanj ${r.resc}, s ceste ${r.off.toFixed(1)} s`;
{
  const a = beginner(0), b = beginner(1);
  const race = S.makeRace(C, 'spa', opts); let k = 0;
  for (; k < MAXK && !race.player.finished; k++) S.stepRace(C, race, k);
  const tAuto = k * S.DT;
  ok('Spa, polni plin brez pomoči: avto poškodovan in s ceste', a.dmg > 0.5 && a.off > 5, fmt(a));
  ok('Spa, polni plin s pomočjo: dva kroga brez poškodb, izleta in reševanja', b.fin && b.dmg === 0 && b.resc === 0 && b.off === 0, fmt(b));
  ok('s pomočjo največ 10 % počasneje od avtopilota', b.fin && b.t <= tAuto * 1.1, `${b.t.toFixed(1)} s, avtopilot ${tAuto.toFixed(1)} s`);
}

// only an input: the race with autoBrake called every step (its answer thrown away) is the same to the last digit
{
  const dig = (call) => {
    const race = S.makeRace(C, 'spa', S.SETUPS.race.opts), h = crypto.createHash('sha1'), o = {};
    let same = true;
    for (let k = 0; k < 120 * 40; k++) {
      if (call) { const before = S.stateLine(race.player); C.autoBrake(race.player, race, o); if (S.stateLine(race.player) !== before) same = false; }
      S.stepRace(C, race, k);
      if (k % 120 === 0) h.update(S.raceState(race));
    }
    return { d: h.digest('hex'), same };
  };
  const a = dig(false), b = dig(true);
  ok('autoBrake ne spremeni avta (klic na vsakem koraku)', b.same);
  ok('dirka s klici autoBrake do številke enaka (40 s, 13 avtov)', a.d === b.d, a.d.slice(0, 12) + ' / ' + b.d.slice(0, 12));
}

// nothing given where it does not belong
{
  const race = S.makeRace(C, 'spa', opts), P = race.player, o = {};
  const none = (r) => r.brk === 0 && r.thr === 1;
  for (let k = 0; k < 120 * 12; k++) S.stepRace(C, race, k);   // (at speed, before Les Combes)
  const v = Math.hypot(P.vx, P.vz);
  const save = { gear: P.gear, vx: P.vx, vz: P.vz, k: P.q.k };
  P.gear = -1; const r1 = Object.assign({}, C.autoBrake(P, race, o)); P.gear = save.gear;
  P.vx *= 0.1; P.vz *= 0.1; const r2 = Object.assign({}, C.autoBrake(P, race, o)); P.vx = save.vx; P.vz = save.vz;
  P.q.k = 0; const r3 = Object.assign({}, C.autoBrake(P, race, o)); P.q.k = save.k;
  const vp = race.vprof; race.vprof = null; const pv = P.vprof; P.vprof = null; const r4 = Object.assign({}, C.autoBrake(P, race, o)); race.vprof = vp; P.vprof = pv;
  ok('nič v vzvratni, počasi, na stranski cesti in brez profila', v > 20 && none(r1) && none(r2) && none(r3) && none(r4), `${(v * 3.6).toFixed(0)} km/h`);
}

// the game: off by default, the row, the translation, only the pedals
{
  const rd = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const g = rd('js/game.js'), html = rd('index.html'), lang = rd('js/lang.js');
  ok('privzeto izklopljeno (DEF autoBrake: 0, številska nastavitev)', /autoGas: 0, autoBrake: 0,/.test(g) && /'autoGas', 'autoBrake',/.test(g));
  ok('vrstica v Nastavitvah (Izklop / Vklop) in angleški prevod', /<span class="rlbl">Samodejno zaviranje<\/span><div class="seg" data-set="autoBrake"><button data-v="0">Izklop<\/button><button data-v="1">Vklop<\/button>/.test(html) && /'Samodejno zaviranje': 'Auto braking'/.test(lang));
  const m = g.match(/function abStep\(P\) \{([\s\S]*?)\n  \}/), body = m ? m[1] : '';
  const writes = [...body.matchAll(/\b(P\.\w+)\s*=(?!=)/g)].map(x => x[1]);
  ok('abStep spremeni samo P.inThr in P.inBrk', m && writes.length && writes.every(w => w === 'P.inThr' || w === 'P.inBrk'), writes.join(', '));
  ok('abStep na igralčevem vnosu pred korakom dirke', /P\.inBrk = inp\.brk; P\.inHand = 0; P\.digitalSteer = inp\.digital; abStep\(P\);/.test(g));
  ok('ne v lekciji Zaviranje avtošole, posnetek zapiše pf.ab', /school\.L\.id === 'brake'/.test(g.match(/const abWant = [^\n]*/)[0]) && /abWant\(\) \? \{ ab: 1 \} : \{\}/.test(g));
}

let bad = 0;
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} checks`);
process.exit(bad ? 1 : 0);
