// The garage's parts, sklop 3 (js/deli/barve.js, js/deli/skriti.js; docs/deli.md) in Node:
//  - KOLIBRI's mounts for the 18 elements; every one of their 16 options builds on it (its own body, no fallback, Normalni and Visoki),
//    the visible ones within the room for one car with parts (outer <= stock + 300 triangles, the cabin unchanged), the hidden ones in
//    the inner block (the outer shell unchanged, the inner <= stock + 300), the tyres within the parts' wheel budget (<= 600, Visoki 850)
//  - the stock KOLIBRI exactly as before (its triangles; no part of the garage's in it)
//  - Render.deliMesh: each drawn element's part alone (the stripes on the top, the calipers at the four wheels, the hidden parts under
//    the bonnet and in the arches), the car's look (barva, zatemnitev, luc_pod_avtom, gume) none
//  - the looks: DELI.tyreLook, DELI.look (finishes, tints, glows), DELI.hupa (the horn's notes), DELI.dim (the smoke's colours) for all 16
//  - the effects in Core (applyDeli): lower (the springs), tint, tyre (the tyres' grip by surface: dry, wet, snow, gravel), the winter's
//    snow grip; on the flat test plane a slick corners harder in the dry and less in the wet than the stock road tyre, a rally gravel
//    tyre more on gravel
//   node tests/deli-barve.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore, ROOT } = require('./lib/core.js');

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const t0 = Date.now();
const GROUPS = fs.readdirSync(path.join(ROOT, 'js/deli')).filter(f => f.endsWith('.js')).sort().map(f => 'js/deli/' + f);
const LOOK = ['barva', 'zatemnitev', 'luc_pod_avtom', 'gume'], DRAWN = ['crte', 'stevilke', 'nalepke', 'soncni_pas', 'celjusti'];
const HIDDEN = ['filter_zraka', 'cip', 'turbo', 'akumulator', 'vzmeti', 'amortizerji', 'stabilizatorji', 'hupa', 'dim_gum'], ALL = LOOK.concat(DRAWN, HIDDEN);

const C = loadCore(), KO = C.MODELS.find(m => m.id === 'kolibri'), MO = KO.def.mounts || {};
check('KOLIBRI\'s mounts: the 18 elements of sklop 3', ALL.every(id => MO[id]), ALL.filter(id => !MO[id]).join(' ') || 'all');

// ---- the render kit in a sandbox (as deli.test.js) ----
const THREE = require(path.join(ROOT, 'js/vendor/three.r128.min.js'));
const ctx = { THREE, Core: C, console, Math, JSON, Date, Map, Set, WeakMap, Float32Array, Uint32Array, Uint8Array, Uint16Array, Int16Array, Int8Array, Int32Array, Array, Object, Number, String, Error, isFinite, parseFloat, parseInt,
  atob: (b) => Buffer.from(b, 'base64').toString('binary'), performance: { now: () => 0 }, requestAnimationFrame() {},
  window: { innerWidth: 800, innerHeight: 450, addEventListener() {} }, document: { createElement: () => ({ getContext: () => null, width: 0, height: 0 }) } };
ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['js/data/deli.js', 'js/deli.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8') + (f === 'js/deli.js' ? '\n;globalThis.DELI = DELI;' : '\n;globalThis.DELI_DATA = DELI_DATA;'), ctx, { filename: f });
for (const f of GROUPS) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
for (const [f, name] of [['js/world.js', 'World'], ['js/render.js', 'Render']]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8') + `\n;globalThis.${name} = ${name};`, ctx, { filename: f });
const R = ctx.Render, D = ctx.DELI;
const warns = [], warn = console.warn; console.warn = (m) => warns.push(String(m));

const S0 = R.kitInfo('kolibri');
check('stock KOLIBRI as before (1392 / 1390 triangles; Visoki 1546 / 1746), no part of the garage\'s in it', S0.status === 'ok' && S0.deli === '' && S0.tris.outer === 1392 && S0.tris.inner === 1390 && S0.hi.tris.outer === 1546 && S0.hi.tris.inner === 1746,
  `${S0.tris.outer}/${S0.tris.inner}, Visoki ${S0.hi.tris.outer}/${S0.hi.tris.inner}`);
const fails = [], over = [], wheels = [], most = [];
for (const id of ALL) for (let k = 1; k <= 16; k++) {
  const I = R.kitInfo('kolibri', { [id]: k }), tag = id + k;
  if (I.status !== 'ok' || I.deli !== tag || I.hi.status !== 'ok') { fails.push(tag + ' ' + I.status + ' ' + I.deli); continue; }
  const dO = I.tris.outer - S0.tris.outer, dI = I.tris.inner - S0.tris.inner, hO = I.hi.tris.outer - S0.hi.tris.outer, hI = I.hi.tris.inner - S0.hi.tris.inner;
  most.push([tag, Math.max(dO, dI)]);
  const ok = HIDDEN.includes(id) ? dO === 0 && hO === 0 && dI > 0 && dI <= 300 && hI <= 300 : dO <= 300 && dI === 0 && hI === 0 && I.hi.tris.outer <= I.hi.budget.outer;
  if (!ok) over.push(`${tag} ${dO}/${dI} Visoki ${hO}/${hI}`);
  if (I.wheels.hi.some(t => t > 600) || I.hi.wheels.some(t => t > 850)) wheels.push(tag + ' ' + I.wheels.hi.join('/') + ' ' + I.hi.wheels.join('/'));
}
check('every option of the 18 builds on KOLIBRI (its own body, no fallback), Normalni and Visoki', !fails.length, fails.slice(0, 4).join(', ') || ALL.length * 16 + ' options');
check('each within its room: a visible one outer <= stock + 300 (the cabin unchanged), a hidden one only in the inner block (<= + 300)', !over.length,
  over.slice(0, 4).join(', ') || 'most: ' + most.sort((a, b) => b[1] - a[1]).slice(0, 3).map(r => r[0] + ' +' + r[1]).join(', '));
check('the tyres within the parts\' wheel budget (<= 600 triangles, Visoki <= 850)', !wheels.length, wheels.slice(0, 4).join(', ') || 'all');
check('none of them warned (no part fell back)', !warns.length, warns.slice(0, 2).join(' | ') || 'none');

const box = (g) => { const b = new THREE.Box3().setFromObject(g); return [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z]; };
const meshBad = [];
for (const id of DRAWN.concat(HIDDEN)) for (const k of [1, 8, 16]) { const m = R.deliMesh(KO, id, k); if (!m || !m.children.length) meshBad.push(id + k + ' null'); }
for (const id of LOOK) if (R.deliMesh(KO, id, 5) !== null) meshBad.push(id + ' not null');
const bC = box(R.deliMesh(KO, 'crte', 2)), bL = box(R.deliMesh(KO, 'celjusti', 1)), bS = box(R.deliMesh(KO, 'vzmeti', 3)), bF = box(R.deliMesh(KO, 'filter_zraka', 6));
check('Render.deliMesh: each drawn part alone where it sits (the stripes from the tail to the nose on the top, the calipers at the four wheels, the springs in the arches, the filter in the bay); the looks none',
  !meshBad.length && bC[0] < -1.6 && bC[3] > 1.6 && bC[4] > 1.3 && bL[0] < -1.1 && bL[3] > 1.1 && bL[4] < 0.45 && Math.abs(bL[2]) > 0.6 && bS[4] < 0.7 && bS[1] > 0.25 && bF[0] > 0.8 && bF[3] < 1.3,
  meshBad.slice(0, 3).join(', ') || `stripes x ${bC[0].toFixed(2)}..${bC[3].toFixed(2)}, calipers x ${bL[0].toFixed(2)}..${bL[3].toFixed(2)} y ..${bL[4].toFixed(2)}`);
console.warn = warn;

// ---- the looks and the sounds ----
const col = (c) => Array.isArray(c) && c.length === 3 && c.every(v => Number.isFinite(v) && v >= 0 && v <= 1);
const lk = [];
for (let k = 1; k <= 16; k++) {
  const t = D.tyreLook(k), h = D.hupa(k), dm = D.dim(k), L = D.look;
  if (!(t && (!t.band || col(t.band)) && (!t.tyre || col(t.tyre)))) lk.push('gume' + k);
  if (!(h && h.notes.length && h.notes.every(ch => ch.length && ch.every(f => f > 80 && f < 2000)) && h.len > 0 && h.loud > 0 && h.loud <= 1)) lk.push('hupa' + k);
  if (!(dm && [0, 1, 2, 3].every(w => { const q = dm.at(w, k * 0.7); return col(q.slice(0, 3)) && q[3] > 0 && q[4] > 0; }))) lk.push('dim_gum' + k);
  if (!(L.FIN[k] && L.TINT[k] && col(L.TINT[k].c) && L.GLOW[k])) lk.push('look' + k);
}
check('the looks and the sounds: the tyres\' look, the horn\'s notes, the smoke\'s colours, the finishes, tints and glows, for all 16', !lk.length, lk.slice(0, 5).join(' ') || 'all');
const d13 = D.dim(13);
check('the smoke: blue (5), red (6), two colours left and right (13)', D.dim(5).at(2, 0)[2] > 0.9 && D.dim(6).at(2, 0)[0] > 0.9 && d13.at(2, 0)[2] > 0.9 && d13.at(3, 0)[0] > 0.9);

// ---- the effects in Core ----
const car = (deli, o) => new C.Car(KO, Object.assign({ id: 1, deli }, o || {}));
const lo = car({ vzmeti: 16 }), hiC = car({ vzmeti: 12 }), ti = car({ zatemnitev: 3 }), sl = car({ gume: 16 }), st = car(null);
check('the effects: the springs lower (vzmeti 16: 5 cm, 12: 1 cm higher), the tint (3: 95 %), the tyres\' grip by surface (16: dry up, wet down), none on a stock car',
  lo.dLower === 0.05 && Math.abs(hiC.dLower + 0.01) < 1e-9 && Math.abs(ti.dTint - 0.95) < 1e-9 && sl.dTy.dry > 1 && sl.dTy.wet < 1 && !('dTy' in st) && !('dLower' in st),
  JSON.stringify({ lower: [lo.dLower, hiC.dLower], tint: ti.dTint, ty: sl.dTy }));
const H = require('./lib/handling.js')(C);
const mk = (deli, v, wet) => { const c = new C.Car(KO, { isPlayer: true, phys: 'cs', assist: 2, deli }); c.place(0, 0, 0); c.locked = false; c.q = { i: 0, s: 0, d: 0, tx: 1, tz: 0, nx: 0, nz: 1 };
  if (wet) c.wet = wet; const s = (v || 0) / 3.6; c.vx = s; c.vz = 0; for (let g = 1; g <= KO.gears.length; g++) { c.gear = g; if (s / KO.rw * KO.gears[g - 1] * KO.final * 9.5493 < KO.redline * 0.9) break; }
  c._thrI = 0.3; c._vT = s; c._t = 0; c._v = s; c._om = 0; return c; };
const lat = (deli, wet) => { const c = mk(deli, 90, wet), om = []; for (let i = 0; i < 5 / H.DT; i++) { H.step(c, { st: 1, thr: 'hold' }); om.push(c._om * c._v); } return Math.abs(om.slice(-120).reduce((a, b) => a + b, 0) / 120) / 9.81; };
const g0 = lat(null), gS = lat({ gume: 16 }), w0 = lat(null, 0.8), wS = lat({ gume: 16 }, 0.8);
check('the tyres on the flat test plane: the prototype slick corners harder in the dry, less in the wet than the stock road tyre', gS > g0 * 1.02 && wS < w0 * 0.98,
  `dry ${g0.toFixed(3)} -> ${gS.toFixed(3)} g, wet ${w0.toFixed(3)} -> ${wS.toFixed(3)} g`);
const tyG = (deli, sf, winter) => { const c = car(deli); if (winter && c.dTy) c.dTy.winter = 1; return c.dTy ? [c.dTy.gravel, c.dTy.snow] : null; };
const g11 = tyG({ gume: 11 }), g12 = tyG({ gume: 12 });
check('the gravel and the snow tyres: rally gravel (11) more grip on gravel, rally snow (12) on snow, a winter race takes the snow grip', g11[0] > 1.2 && g12[1] > 1.25,
  `gravel ${g11[0].toFixed(2)}, snow ${g12[1].toFixed(2)}`);

console.log(`\n${bad ? 'FAIL' : 'OK'}: ${n - bad}/${n} checks (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
process.exit(bad ? 1 : 0);
