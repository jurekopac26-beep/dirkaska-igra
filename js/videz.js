/* A car's look everywhere (docs/novosti-e.md, Novost 1): the garage's colour, paint finish, number and rims (on KOLIBRI the racing stripes
   and the sun strip as well) on the car in every race (the championship's too), in a replay (one opened from a file too) and on a friend's
   screen. Only the look: no part's effect (the rims' kg, ...) reaches the car's physics here; where the garage's parts do count (a
   career's race: Race opts.playerDeli, Core.applyDeli) they stay as ever.
     Videz.of(g, num, id)  the look of a garage's car id (career.garage.cars[id]: deli, stripe, sc, num) or null: { deli, sc, num, m } (deli:
                          only the look's elements, LOOK; sc: the stripes' colour 0xRRGGBB, false for none, null the car's own; num: 1..99 or
                          null; m: the car's id, the look put on that model only: a mission's or a novelty's own vehicle stays as it is)
     Videz.ofCar(c)       the look a car has (car.deli's look elements, stripe, stripeCol): for a recording's header (js/game.js rrpOf)
     Videz.wire(v)        its short form for the net and a recording's header ({ d, s, n }; null when there is nothing to show)
     Videz.read(o)        a short form back, checked (unknown elements, options outside 1..16, numbers outside 1..99 dropped): a look or null
                          (an old peer's or recording's without one: null, the car as ever)
     Videz.dress(car, v, keepNum)   the look put on a car (car.deli, stripe, stripeCol, num unless keepNum; not on another model than v.m);
                          its physics untouched
   The elements a car has no mount for (js/cars/<id>.js: def.mounts) are never drawn (render.js cleans car.deli with the model: DELI.clean) */
var Videz = (function () {
  'use strict';
  // the look's elements (js/data/deli.js): paint finish, rims, number style; stripes and sun strip (only KOLIBRI has their mounts)
  const LOOK = ['barva', 'platisca', 'stevilke', 'crte', 'soncni_pas'];
  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const opt = (n) => { n = +n; return Number.isInteger(n) && n >= 1 && n <= 16 ? n : 0; };
  const col = (c) => c === false ? false : Number.isInteger(c) && c >= 0 && c <= 0xffffff ? c : null;
  const numOk = (n) => { n = +n; return Number.isInteger(n) && n >= 1 && n <= 99 ? n : null; };
  function pick(deli) {
    const out = {}; if (!isObj(deli)) return out;
    for (const id of LOOK) { const n = opt(deli[id]); if (n) out[id] = n; }
    return out;
  }
  const empty = (v) => !v || (!Object.keys(v.deli).length && v.sc === null && v.num === null);

  function of(g, num, id) {
    if (!isObj(g)) return null;
    const v = { deli: pick(g.deli), sc: g.stripe === false ? false : col(g.sc), num: numOk(g.num != null ? g.num : num) };
    if (typeof id === 'string') v.m = id;
    return empty(v) ? null : v;
  }
  const ofCar = (c) => c ? { deli: pick(c.deli), sc: c.stripe === false ? false : col(c.stripeCol), num: null } : null;
  function wire(v) {
    if (!isObj(v)) return null;
    const d = pick(v.deli), s = col(v.sc), n = numOk(v.num), o = {};
    if (Object.keys(d).length) o.d = d;
    if (s !== null) o.s = s;
    if (n !== null) o.n = n;
    return Object.keys(o).length ? o : null;
  }
  function read(o) {
    if (!isObj(o)) return null;
    const v = { deli: pick(o.d), sc: col(o.s), num: numOk(o.n) };
    return empty(v) ? null : v;
  }
  function dress(car, v, keepNum) {
    if (!car || !isObj(v) || (typeof v.m === 'string' && car.m && car.m.id !== v.m)) return car;
    const d = pick(v.deli);
    if (Object.keys(d).length) car.deli = Object.assign({}, isObj(car.deli) ? car.deli : null, d);
    if (v.sc === false) car.stripe = false;
    else if (Number.isInteger(v.sc)) car.stripeCol = v.sc;
    if (!keepNum && numOk(v.num) !== null) car.num = numOk(v.num);
    return car;
  }
  return { LOOK, of, ofCar, wire, read, dress };
})();
if (typeof module !== 'undefined') module.exports = Videz;
