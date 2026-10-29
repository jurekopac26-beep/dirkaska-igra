// The garage's parts (js/deli.js, js/data/deli.js; docs/deli.md) in Node:
//  - the list: 40 elements, 16 options each (1 the cheapest .. 16 the dearest), DELI.option / element; out of range: null
//  - DELI.effect: every option's kaj_nudi read into numbers (finite; every part of it with a number understood: kg, moč %, oprijem %,
//    km/h, % zavorne moči, nižje / višje za cm, prepusti % svetlobe, the tyres' suho / mokro / sneg / makadam), a few by hand
//  - DELI.clean / key: unknown elements, options outside 1..16 and elements the vehicle has no mount for left out
//  - KOLIBRI's def: its mounts (krilo, platisca, zarometi), registered (no def skipped)
//  - the physics (Core.applyDeli through the Car's opts.deli): a CLONE of the model and ARC entry (the shared ones never change), the
//    mass, the grip, the drag, the brakes; a car without parts exactly as before (no deli field); on the flat test plane: the wing's
//    km/h off the top speed (within 2 km/h), its grip in a steady corner, lighter rims a quicker 0-100, stronger brakes a shorter stop
//  - the render kit in a sandbox (as kit.test.js): KOLIBRI stock; on every vehicle with mounts (KOLIBRI, the trial's PANTER, JASTREB and
//    TITAN) each of the 16 options of krilo, platisca, zarometi it has a mount for built ok (no fallback to the stock body), within the phone's room for one car with parts (outer shell <= stock + 300 triangles, the cabin
//    unchanged), Visoki within its budget, the rims within the parts' wheel budget (only the player's car has parts: its wheels <= 600
//    triangles, Visoki <= 850; a stock car's 400 / 700, tests/browser/fleet.test.mjs), the parts in their
//    stock part ids (the wing's range in 'spoiler', the lamps' in 'headL' / 'headR'); Render.deliMesh: the part alone where it sits, a
//    vehicle without a mount: null and its body the stock one; a car's own lamp shape (mounts.zarometi.shape: PANTER's triangles,
//    JASTREB's lamps the noses of their glass domes): every option within it, its lens bulging
//   node tests/deli.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore, ROOT } = require('./lib/core.js');

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const t0 = Date.now();
const GROUPS = fs.readdirSync(path.join(ROOT, 'js/deli')).filter(f => f.endsWith('.js')).sort().map(f => 'js/deli/' + f);   // (js/deli/<group>.js: DELI.add)

// ---- the list and the effects (DELI on its own) ----
const D = (() => { const ctx = { console, Math, JSON, Object, Array, Number, String, isFinite, Set, Map }; vm.createContext(ctx);
  for (const f of ['js/data/deli.js', 'js/deli.js'].concat(GROUPS)) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return vm.runInContext('DELI', ctx); })();
const EL = D.DATA.elementi;
check('the list: 40 elements with unique ids', EL.length === 40 && new Set(EL.map(e => e.id)).size === 40, EL.length + ' elements');
const counts = EL.map(e => { let k = 0; while (D.option(e.id, k + 1)) k++; return k; });
check('16 options each, 1 .. 16 (none past them)', counts.every(c => c === 16) && EL.every(e => !D.option(e.id, 0) && !D.option(e.id, 17)), EL.filter((e, i) => counts[i] !== 16).map(e => e.id).join(' ') || 'all 16');
check('DELI.element / option: the names, unknown ids null', D.element('krilo').id === 'krilo' && D.option('krilo', 10).ime === 'GT krilo' && D.element('nic') === null && D.option('nic', 1) === null);
const NUM = /\d/, KNOWN = [/^[+−-]?\d+(?:[.,]\d+)?\s*kg$/, /^moč\s*[+−-]?\d/, /^oprijem(?: v ovinku)?\s*[+−-]?\d/, /^[+−-]?\d+(?:[.,]\d+)?\s*km\/h$/, /% zavorne moči$/, /^nižje za/, /^višje za/, /^prepusti/, /^(suho|mokro|sneg|makadam)\s*[+−-]?\d/];
const unread = [], nonFinite = [];
for (const e of EL) for (let k = 1; k <= 16; k++) {
  const o = D.option(e.id, k), f = D.effect(e.id, k);
  for (const t of String(o.kaj_nudi || '').split(/\s*·\s*/)) if (NUM.test(t) && !KNOWN.some(re => re.test(t.trim()))) unread.push(e.id + k + ': ' + t);
  for (const key of ['kg', 'power', 'grip', 'kmh', 'brake', 'lower', 'tint']) if (!Number.isFinite(f[key])) nonFinite.push(e.id + k + '.' + key);
  if (f.tyre) for (const key in f.tyre) if (!Number.isFinite(f.tyre[key])) nonFinite.push(e.id + k + '.tyre.' + key);
}
check('every option\'s effect in finite numbers', !nonFinite.length, nonFinite.slice(0, 5).join(', ') || '640 options');
check('every part of kaj_nudi with a number understood', !unread.length, unread.slice(0, 5).join(' | ') || 'none left over');
const e16 = D.effect('krilo', 16), p15 = D.effect('platisca', 15), z16 = D.effect('zavore', 16), a16 = D.effect('auspuh', 16);
const v12 = D.effect('vzmeti', 12);
check('by hand: krilo 16 grip +19 % and -7 km/h, platisca 15 -14 kg, zavore 16 brakes, auspuh 16 power, vzmeti 12 1 cm higher', Math.abs(e16.grip - 0.19) < 1e-9 && e16.kmh === -7 && p15.kg === -14 && z16.brake > 0 && a16.power > 0 && Math.abs(v12.lower + 0.01) < 1e-9,
  `krilo16 ${e16.grip} ${e16.kmh}, platisca15 ${p15.kg}, zavore16 ${z16.brake}, auspuh16 ${a16.power}`);

// ---- the Core: KOLIBRI's mounts, applyDeli ----
const C = loadCore(), KO = C.MODELS.find(m => m.id === 'kolibri'), MO = KO.def.mounts || {};
check('the defs: none skipped (mounts a known key)', !C.DEFS_SKIPPED.length, C.DEFS_SKIPPED.map(s => s.id + ': ' + s.why).join('; ') || 'none');
check('KOLIBRI\'s mounts: krilo (on the spoiler), zarometi (the lamps\' parts), platisca', MO.krilo && MO.krilo.part === 'spoiler' && MO.zarometi && MO.zarometi.hosts.join() === 'headL,headR' && !!MO.platisca);
const cleanK = D.clean({ krilo: 3, platisca: '7', zarometi: 17, nic: 2, aero: 4 }, KO);
check('DELI.clean on KOLIBRI: the options it can show (unknown, out of range and unmounted ones out); the key sorted', JSON.stringify(cleanK) === '{"krilo":3,"platisca":7}' && D.key({ platisca: 7, krilo: 3 }, KO) === 'krilo3.platisca7' && D.key({ aero: 4 }, KO) === '' && D.key(null, KO) === '',
  JSON.stringify(cleanK));
const ARC0 = JSON.stringify(C.ARC ? C.ARC.kolibri : null), M0 = JSON.stringify([KO.mass, KO.kw, KO.cDrag, KO.Tmax]);
const stock = new C.Car(KO, { id: 1 }), withP = new C.Car(KO, { id: 2, deli: { krilo: 16, platisca: 15, zavore: 16 } }), junk = new C.Car(KO, { id: 3, deli: { nic: 3, krilo: 40 } });
check('a car without parts as before: no deli field, the model itself', !('deli' in stock) && stock.m === KO && stock.upgGrip === 0, Object.keys(stock).includes('deli') ? 'has deli' : 'ok');
check('parts nobody knows: nothing changes', !('deli' in junk) && junk.m === KO);
check('with parts: a clone (KOLIBRI\'s model and ARC entry untouched), the mass (the rims\' and the brakes\' kg), grip x1.19, more drag, stronger brakes, the parts kept',
  withP.m !== KO && JSON.stringify([KO.mass, KO.kw, KO.cDrag, KO.Tmax]) === M0 && JSON.stringify(C.ARC ? C.ARC.kolibri : null) === ARC0 && withP.m.mass === KO.mass + p15.kg + z16.kg && Math.abs(withP.arc.amax / stock.arc.amax - 1.19) < 1e-9 &&
  withP.m.cDrag > KO.cDrag && withP.brakeG > stock.brakeG && Math.abs(withP.upgGrip - 1.19) < 1e-9 && JSON.stringify(withP.deli) === '{"krilo":16,"platisca":15,"zavore":16}',
  `mass ${withP.m.mass}, amax ${withP.arc.amax.toFixed(3)}, cDrag ${withP.m.cDrag.toFixed(3)}, brakeG ${withP.brakeG.toFixed(2)}`);
// the flat test plane (tests/lib/handling.js), a car with parts made as its mkCar makes one
const H = require('./lib/handling.js')(C);
const mk = (deli, v) => { const c = new C.Car(KO, { isPlayer: true, phys: 'cs', assist: 2, deli }); c.place(0, 0, 0); c.locked = false; c.q = { i: 0, s: 0, d: 0, tx: 1, tz: 0, nx: 0, nz: 1 };
  const s = (v || 0) / 3.6; c.vx = s; c.vz = 0; for (let g = 1; g <= KO.gears.length; g++) { c.gear = g; if (s / KO.rw * KO.gears[g - 1] * KO.final * 9.5493 < KO.redline * 0.9) break; }
  c._thrI = 0.3; c._vT = s; c._t = 0; c._v = s; c._om = 0; return c; };
const top = (deli) => { const c = mk(deli, 0); for (let i = 0; i < 90 / H.DT; i++) H.step(c, { thr: 1 }); return c._v * 3.6; };
const v0 = top(null), v16 = top({ krilo: 16 }), v6 = top({ krilo: 6 });
check('the top speed: krilo 16 takes 7 km/h off it, krilo 6 2 km/h (within 2 km/h)', Math.abs(v16 - v0 + 7) <= 2 && Math.abs(v6 - v0 + 2) <= 2, `stock ${v0.toFixed(1)}, krilo16 ${v16.toFixed(1)}, krilo6 ${v6.toFixed(1)} km/h`);
const lat = (deli) => { const c = mk(deli, 100), om = []; for (let i = 0; i < 5 / H.DT; i++) { H.step(c, { st: 1, thr: 'hold' }); om.push(c._om * c._v); } return Math.abs(om.slice(-120).reduce((a, b) => a + b, 0) / 120) / 9.81; };
const g0 = lat(null), g16 = lat({ krilo: 16 });
check('the grip: krilo 16 (+19 %) corners harder at 100 km/h', g16 > g0 * 1.03, `${g0.toFixed(2)} g -> ${g16.toFixed(2)} g`);
const t100 = (deli) => { const c = mk(deli, 0); let t = 0; while (c._v * 3.6 < 100 && t < 20) { H.step(c, { thr: 1 }); t += H.DT; } return t; };
const s0 = t100(null), s15 = t100({ platisca: 15 }), s1 = t100({ platisca: 1 });
check('the mass: the lightest rims (-14 kg) a quicker 0-100, the steel ones (+6 kg) a slower one', s15 < s0 && s1 > s0, `${s1.toFixed(3)} / ${s0.toFixed(3)} / ${s15.toFixed(3)} s`);
const stop = (deli) => { const c = mk(deli, 100); let t = 0; while (c._v > 0.3 && t < 10) { H.step(c, { thr: 0, brk: 1 }); t += H.DT; } return c.x; };
const d0 = stop(null), dz = stop({ zavore: 16 });
check('the brakes: zavore 16 stop shorter from 100 km/h', dz < d0 - 0.3, `${d0.toFixed(1)} m -> ${dz.toFixed(1)} m`);

// ---- the render kit in a sandbox (as kit.test.js) with the parts' scripts ----
function loadRender() {
  const THREE = require(path.join(ROOT, 'js/vendor/three.r128.min.js'));
  const ctx = { THREE, Core: C, console, Math, JSON, Date, Map, Set, WeakMap, Float32Array, Uint32Array, Uint8Array, Uint16Array, Int16Array, Int8Array, Int32Array, Array, Object, Number, String, Error, isFinite, parseFloat, parseInt,
    atob: (b) => Buffer.from(b, 'base64').toString('binary'), performance: { now: () => 0 }, requestAnimationFrame() {},
    window: { innerWidth: 800, innerHeight: 450, addEventListener() {} }, document: { createElement: () => ({ getContext: () => null, width: 0, height: 0 }) } };
  ctx.globalThis = ctx; vm.createContext(ctx);
  for (const f of ['js/data/deli.js', 'js/deli.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8') + (f === 'js/deli.js' ? '\n;globalThis.DELI = DELI;' : '\n;globalThis.DELI_DATA = DELI_DATA;'), ctx, { filename: f });
  for (const f of GROUPS) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  for (const [f, name] of [['js/world.js', 'World'], ['js/render.js', 'Render']]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8') + `\n;globalThis.${name} = ${name};`, ctx, { filename: f });
  return ctx;
}
const warns = [], warn = console.warn; console.warn = (m) => warns.push(String(m));
const X = loadRender(), R = X.Render;
const I0 = R.kitInfo('kolibri');
check('stock KOLIBRI: built ok, within its budgets (outer 1400; its cabin\'s inner block 1400; Visoki 2400 / 1750)', I0.status === 'ok' && I0.deli === '' && I0.tris.outer <= 1400 && I0.tris.inner <= I0.budget.inner && I0.budget.inner === 1400 &&
  I0.hi.status === 'ok' && I0.hi.tris.outer <= 2400 && I0.hi.tris.inner <= I0.hi.budget.inner && I0.hi.budget.inner === 1750, `${I0.tris.outer}/${I0.tris.inner}, Visoki ${I0.hi.tris.outer}/${I0.hi.tris.inner}`);
// every vehicle with mounts (KOLIBRI; the trial's PANTER, JASTREB, TITAN): each element it has a mount for, all 16 options
const MOUNTED = C.MODELS.filter(m => m.kit && m.def.mounts), rows = [], fails = [], over = [], wheelsBad = [], rangeBad = [];
for (const M of MOUNTED) { const S0 = R.kitInfo(M.id), mo = M.def.mounts;
  for (const id of Object.keys(mo).filter(id => D.has(id))) for (let k = 1; k <= 16; k++) {   // (every element drawn that it has a mount for: sklop 2's too)
    const I = R.kitInfo(M.id, { [id]: k }), tag = M.id + ' ' + id + k;
    if (I.status !== 'ok' || I.deli !== id + k || (I.hi && I.hi.status !== 'ok')) { fails.push(tag + ' ' + I.status + ' ' + I.deli); continue; }
    rows.push([tag, I.tris.outer - S0.tris.outer]);
    if (I.tris.outer > S0.tris.outer + 300 || I.tris.inner !== S0.tris.inner || (I.hi && (I.hi.tris.outer > I.hi.budget.outer || I.hi.tris.inner > I.hi.budget.inner))) over.push(`${tag} ${I.tris.outer}/${I.tris.inner}` + (I.hi ? ` Visoki ${I.hi.tris.outer}/${I.hi.tris.inner}` : ''));
    if (I.wheels.hi.some(t => t > 600) || (I.hi && I.hi.wheels.some(t => t > 850))) wheelsBad.push(`${tag} ${I.wheels.hi.join('/')}` + (I.hi ? ' ' + I.hi.wheels.join('/') : ''));
    const rg = I.ranges, len = (q) => q.o[1] - q.o[0] + q.i[1] - q.i[0];
    if (id === 'krilo' && !(len(rg[mo.krilo.part]) > 0)) rangeBad.push(tag + ' ' + mo.krilo.part);
    if (id === 'zarometi') { const [hl, hr] = mo.zarometi.hosts; if (!(len(rg[hl]) > 0 && len(rg[hr]) > 0 && rg[hl].subs.some(s => s.name === 'lampFL') && rg[hr].subs.some(s => s.name === 'lampFR'))) rangeBad.push(tag + ' lamps'); }
  } }
check('every option builds on every vehicle with its mount (its own body: no fallback to the stock one), Normalni and Visoki', !fails.length && rows.length === MOUNTED.reduce((a, M) => a + Object.keys(M.def.mounts).filter(id => D.has(id)).length * 16, 0),
  fails.slice(0, 4).join(', ') || rows.length + ' options on ' + MOUNTED.map(m => m.id).join(' '));
check('each within the room for one car with parts (outer <= stock + 300 triangles, the cabin unchanged; Visoki within its budget)', !over.length,
  over.slice(0, 4).join(', ') || 'most: ' + rows.slice().sort((a, b) => b[1] - a[1]).slice(0, 3).map(r => r[0] + ' +' + r[1]).join(', '));
check('the rims within the parts\' wheel budget (the player\'s <= 600 triangles, Visoki <= 850)', !wheelsBad.length, wheelsBad.slice(0, 4).join(', ') || 'all');
check('the parts in the mounts\' part ids (the wing: mounts.krilo.part, KOLIBRI\'s spoiler; the lamps: the hosts with their lenses lampFL / lampFR)', !rangeBad.length, rangeBad.slice(0, 4).join(', ') || 'all');
check('none of them warned (no part fell back)', !warns.length, warns.slice(0, 2).join(' | ') || 'none');
const box = (g) => { const b = new X.THREE.Box3().setFromObject(g); return [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z]; };
const mW = R.deliMesh(KO, 'krilo', 10), mL = R.deliMesh('kolibri', 'zarometi', 4), mR = R.deliMesh(KO, 'platisca', 7);
const bW = mW && box(mW), bL = mL && box(mL);
check('Render.deliMesh: the wing alone on the roof\'s rear edge, the lamps on the nose (both sides), the rims four wheels',
  !!mW && mW.children.length === 1 && bW[0] > -1.95 && bW[3] < -1.1 && bW[1] > 1.3 && !!mL && bL[0] > 1.55 && bL[2] < -0.3 && bL[5] > 0.3 && !!mR && mR.children.length === 4,
  mW && mL ? `wing x ${bW[0].toFixed(2)}..${bW[3].toFixed(2)} y ${bW[1].toFixed(2)}..${bW[4].toFixed(2)}, lamps x ${bL[0].toFixed(2)}..${bL[3].toFixed(2)}` : 'null');
const other = C.MODELS.find(m => m.kit && m.id !== 'kolibri' && !m.def.mounts);
check('a vehicle without the mount: no part drawn (deliMesh null, its body the stock one)', !!other && R.deliMesh(other, 'krilo', 3) === null && R.kitInfo(other.id, { krilo: 3 }).deli === '', other ? other.id : 'none');
// a car's own lamp (mounts.zarometi.shape): every option within its outline (PANTER's triangles on the wings' noses, JASTREB's lamps
// the noses of their glass domes), its lens bulging out (in front of the face by more than the flat lens' 4 mm)
const shapeBad = [];
for (const M of MOUNTED.filter(m => m.def.mounts.zarometi && m.def.mounts.zarometi.shape)) { const z = M.def.mounts.zarometi, S = z.shape;
  const u0 = Math.min(...S.map(q => q[0])), u1 = Math.max(...S.map(q => q[0])), v0 = Math.min(...S.map(q => q[1])), v1 = Math.max(...S.map(q => q[1])), mg = (z.ringW || 0.008) + 0.012;
  for (let k = 1; k <= 16; k++) { const b = box(R.deliMesh(M, 'zarometi', k, null, true)), zr = [b[2], b[5]].map(Math.abs).sort((p, q) => p - q);   // (the right lamp: |z| of the box's far side)
    if (b[4] > z.yc + v1 + mg || b[1] < z.yc + v0 - mg || zr[1] > z.zc + u1 + mg || b[3] < z.x + 0.006 + 0.004 + z.bulge * 0.8) shapeBad.push(`${M.id} ${k}: y ${b[1].toFixed(3)}..${b[4].toFixed(3)} z ${zr[1].toFixed(3)} x ${b[3].toFixed(3)}`); } }
check('a car\'s own lamp shape: every option within it, its lens bulging (PANTER, JASTREB)', !shapeBad.length && MOUNTED.some(m => m.id === 'panter'), shapeBad.slice(0, 3).join(', ') || 'all');
console.warn = warn;

console.log(`\n${bad ? 'FAIL' : 'OK'}: ${n - bad}/${n} checks (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
process.exit(bad ? 1 : 0);
