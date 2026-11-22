// The car's look everywhere (docs/novosti-e.md, Novost 1, V1): the garage's parts and stripes drawn without their effects in a
// championship, on a friend's car online and in a replay file (Core.lookWire / lookRead / dressOnly; Race opts.playerLook, remote look).
//  - lookWire / lookRead: the short form checked (unknown elements, options out of 1..16, junk out; null for nothing, an older peer or file)
//  - dressOnly: car.deli and the stripes as given, the physics the model's (mass, power, drag, grip, brakes)
//  - Race: the player's look (with the parts fitted only the stripes), a friend's look on its car; without one every car as before
'use strict';
const { loadCore } = require('./lib/core.js');

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const C = loadCore(), KO = C.MODELS.find(m => m.id === 'kolibri'), J = JSON.stringify;

// ---- the short form ----
check('lookWire: only known elements with options 1..16, stripes off as s: 0', J(C.lookWire({ deli: { krilo: 3, nic: 2, platisca: 40, zavore: '5' }, stripe: false })) === '{"d":{"krilo":3},"s":0}');
check('lookWire: the stock look (nothing fitted, stripes on) is null', C.lookWire({ deli: {}, stripe: true }) === null && C.lookWire(null) === null && C.lookWire({}) === null);
check('lookRead: the form read back, junk out', J(C.lookRead({ d: { krilo: 3, x: 'a', BAD: 2, platisca: 0 }, s: 0 })) === '{"deli":{"krilo":3},"stripe":false}');
check('lookRead: an older peer\'s or file\'s (none) and junk give null', [undefined, null, 7, 'x', [], { d: [1] }, { d: 'x' }, { s: 1 }].every(v => C.lookRead(v) === null));
const many = {}; for (let i = 0; i < 100; i++) many['aa' + String.fromCharCode(97 + (i % 26)) + String.fromCharCode(97 + ((i / 26) | 0))] = 3;
check('lookRead: a flood of keys does not get through (unknown ones out)', C.lookRead({ d: many }) === null);
check('round trip: wire(read(wire(v))) the same', (() => { const w = C.lookWire({ deli: { krilo: 16, platisca: 15 }, stripe: false }); return J(C.lookWire(C.lookRead(w))) === J(w); })());

// ---- dressOnly: drawn only ----
const stock = new C.Car(KO, { id: 1 }), dressed = C.dressOnly(new C.Car(KO, { id: 2 }), { deli: { krilo: 16, platisca: 15, zavore: 16 }, stripe: false });
const fitted = new C.Car(KO, { id: 3, deli: { krilo: 16, platisca: 15, zavore: 16 } });
check('dressOnly: the parts and the stripes on the car', J(dressed.deli) === J(fitted.deli) && dressed.stripe === false);
check('dressOnly: the physics the model\'s (mass, power, drag, grip, brakes as the stock car\'s)', dressed.m === KO && dressed.m.mass === stock.m.mass && dressed.m.kw === stock.m.kw && dressed.m.cDrag === stock.m.cDrag
  && dressed.arc.amax === stock.arc.amax && dressed.brakeG === stock.brakeG && dressed.upgGrip === stock.upgGrip && !dressed.dTy,
  `mass ${dressed.m.mass}/${fitted.m.mass}, amax ${dressed.arc.amax}/${fitted.arc.amax}`);
check('dressOnly: nothing given, nothing changes', !('deli' in C.dressOnly(new C.Car(KO, { id: 4 }), null)) && !('stripe' in C.dressOnly(new C.Car(KO, { id: 5 }), { deli: { nic: 2 } })));

// ---- the Race ----
const T = new C.Track(C.TRACKS[0]), base = { numAI: 1, laps: 1, seed: 3, playerModel: KO };
const r0 = new C.Race(T, base), r1 = new C.Race(T, Object.assign({}, base, { playerLook: { deli: { krilo: 5 }, stripe: false } }));
check('Race without a look: the player\'s car as before', !('deli' in r0.player) && !('stripe' in r0.player));
check('Race with playerLook: drawn, the physics the model\'s', J(r1.player.deli) === '{"krilo":5}' && r1.player.stripe === false && r1.player.m === KO);
const r2 = new C.Race(T, Object.assign({}, base, { playerDeli: { platisca: 4 }, playerLook: { deli: { krilo: 5 }, stripe: false } }));
check('Race with the parts fitted (playerDeli): those parts and their effects, of the look only the stripes', J(r2.player.deli) === '{"platisca":4}' && r2.player.stripe === false);
const r3 = new C.Race(T, Object.assign({}, base, { numAI: 0, playerGrid: 1, remote: [{ id: 'g1', model: KO, grid: 2, look: C.lookRead({ d: { krilo: 7 }, s: 0 }) }, { id: 'g2', model: KO, grid: 3 }] }));
const fr = r3.remotes.find(c => c.netOf.id === 'g1'), fr2 = r3.remotes.find(c => c.netOf.id === 'g2');
check('a friend\'s look on its car (drawn only); a friend without one as before', fr && J(fr.deli) === '{"krilo":7}' && fr.stripe === false && fr.m === KO && fr2 && !('deli' in fr2) && !('stripe' in fr2));

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
