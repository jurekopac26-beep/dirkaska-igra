// A car's look everywhere (js/videz.js, docs/novosti-e.md »Novost 1«) in Node:
//  - the short form for the net and a recording (wire/read): only the look's elements, options 1..16, colours, numbers 1..99; an old
//    peer's or recording's without one: null
//  - Race: the player's look (opts.playerLook) on the car, not where the garage's parts count (opts.playerDeli), not on another model;
//    a friend's look (opts.remote[].look) on the friend's car; the numbers stay the race's
//  - only the look: every number of the car's physics the same as without it
//   node tests/videz.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const V = require('../js/videz.js');

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const C = loadCore(), T = new C.Track(C.TRACKS.find(d => d.id === 'jezero'));
const KO = C.MODELS.find(m => m.id === 'kolibri'), OTHER = C.MODELS.find(m => m.id !== 'kolibri');

// 1. the short form
const g = { deli: { barva: 4, platisca: 16, crte: 2, turbo: 9, nalepke: 3, stevilke: 17 }, sc: 0x112233, num: 42 };
const v = V.of(g, 7, 'kolibri'), w = V.wire(v), r = V.read(JSON.parse(JSON.stringify(w)));
check('of: only the look\'s elements (no turbo, no nalepke), options 1..16', JSON.stringify(v.deli) === JSON.stringify({ barva: 4, platisca: 16, crte: 2 }) && v.sc === 0x112233 && v.num === 42 && v.m === 'kolibri', JSON.stringify(v));
check('wire -> read: the same look back', r && JSON.stringify(r.deli) === JSON.stringify(v.deli) && r.sc === v.sc && r.num === v.num, JSON.stringify(w));
check('read: an old peer\'s or recording\'s (none, {}, junk): null', [undefined, null, {}, [], 'x', { d: { turbo: 3 } }, { n: 0, s: -1 }].every(o => V.read(o) === null));
check('read: options and numbers out of range dropped', JSON.stringify(V.read({ d: { barva: 0, platisca: 2.5, stevilke: 99 }, s: 0x1000000, n: 100 })) === 'null');
check('no stripes kept (false)', V.read(V.wire({ deli: {}, sc: false })).sc === false && V.of({ stripe: false }).sc === false);
check('nothing to show: no short form', V.wire(V.of({ deli: {} })) === null && V.of({}) === null);

// 2. Race: the player's look and a friend's
const phys = (c) => JSON.stringify(Object.keys(c).filter(k => typeof c[k] === 'number' || typeof c[k] === 'boolean').sort()
  .filter(k => k !== 'stripe' && k !== 'stripeCol').map(k => [k, c[k]]));
const mk = (o) => { const q = new C.Race(T, Object.assign({ numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', playerModel: KO, seed: 3 }, o)); q.start(); return q; };
const base = mk({}), look = { deli: { barva: 5, platisca: 7, crte: 3 }, sc: 0xff8800, num: 77, m: 'kolibri' };
const dressed = mk({ playerLook: look });
check('the player\'s look on the car (car.deli, the stripes\' colour)', dressed.player.deli && dressed.player.deli.barva === 5 && dressed.player.deli.platisca === 7 && dressed.player.stripeCol === 0xff8800, JSON.stringify(dressed.player.deli));
check('the number stays the race\'s', dressed.player.num === base.player.num, `${dressed.player.num} / ${base.player.num}`);
check('only the look: the car\'s physics the same (mass, power, grip, ...)', phys(dressed.player) === phys(base.player));
for (let i = 0; i < 240; i++) { base.player.input = dressed.player.input = { throttle: 1, steer: 0.3 }; base.step(1 / 60); dressed.step(1 / 60); }
check('only the look: 4 s of driving to the same place', base.player.x === dressed.player.x && base.player.z === dressed.player.z, `${base.player.x.toFixed(3)} / ${dressed.player.x.toFixed(3)}`);
const career = mk({ playerLook: look, playerDeli: { barva: 2 } });
check('a career\'s race (opts.playerDeli): the garage\'s parts as ever, the look not added', !(career.player.deli && career.player.deli.platisca) && career.player.stripeCol !== 0xff8800);
const other = mk({ playerLook: look, playerModel: OTHER });
check('another model (a mission\'s, a novelty\'s own vehicle): not dressed', !(other.player.deli && other.player.deli.barva) && other.player.stripeCol !== 0xff8800);
const net = mk({ playerGrid: 2, remote: { model: KO, num: 9, name: 'Ana', grid: 1, look: V.read(V.wire(look)) } });
check('a friend\'s look on the friend\'s car, the number the friend\'s', net.remote.deli && net.remote.deli.barva === 5 && net.remote.stripeCol === 0xff8800 && net.remote.num === 9, JSON.stringify(net.remote.deli));
const old = mk({ playerGrid: 2, remote: { model: KO, num: 9, name: 'Ana', grid: 1 } });
check('a friend without a look (an older phone): the car as ever', !(old.remote.deli && old.remote.deli.barva) && phys(old.remote) === phys(net.remote));

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
