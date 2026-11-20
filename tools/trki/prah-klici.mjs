// The draw calls of the FRAME of a wall strike and of the frames right after it, with and without the grit dust of a concrete wall
// (P4, Realistična, cv 6: js/render.js, the block under »P4, Realistična: a hard knock into a concrete wall«). The design says the grit
// rides in the particles' own pool (one THREE.Points of 2400 slots, drawn every frame whole): no draw call and no vertex more. Measured
// here frame by frame, from 0.2 s before the first touch to 1.5 s after it, 60 frames a second, on the phone's screen (844 x 390,
// quality normal, shadows, the camera behind the car, Podrobne poškodbe: as tests/browser/perf.test.mjs counts a track).
// The scene: zid90 of tools/trki/slike-scenariji.json (the player alone, square into the barrier beside the road, 100 km/h; the rivals
// parked 400 m back), staged as tools/trki/obremenitev-trk.mjs stages its own. Where along the lap: the first straight stretch whose
// barrier on that side is a concrete or stone wall (world.barKind 1), or --m <metres after the start>.
// The three runs of a row (each its own page, the same seed):
//   prah   cv 6 as the game is (the grit rises)
//   brez   cv 6, world.barKind answering 0 (a steel rail) from this tool only: the same strike, the same frames, no grit
//   cv5    Stara (cv 5): the old knock, no grit by its version
// Printed per row: the most calls in the window and in which frame, the frame-by-frame difference prah − brez (the grit's own: 0 is
// asked), the most vertices, the track's limit of tests/golden/perf.json (maxCalls, maxKverts: what perf.test.mjs allows the track's
// busiest view WITHOUT a crash) and the budget of about 300 calls; what the extra calls of the strike are made of (the cars and what
// hangs on them, shed pieces, shards, particles), and the particles alive at most against their pool.
//   node tools/trki/prah-klici.mjs                                  spa, low and high, dry and rain
//   node tools/trki/prah-klici.mjs --proge spa,eljem,chapman --detajl low --vreme suho,dez --kmh 100 [--m 660] [--stran 1|-1] [--risi]
// Writes test-results/obremenitev/prah-klici.json (every frame of every run).
import fs from 'node:fs';
import path from 'node:path';
import { REPO, serve, launch, openGame } from '../../tests/browser/lib.mjs';

const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; }, has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const proge = (flag('--proge') || 'spa').split(','), detajli = (flag('--detajl') || 'low,high').split(','), vremena = (flag('--vreme') || 'suho,dez').split(',');
const kmh = +(flag('--kmh') || 100), mArg = flag('--m'), stranArg = flag('--stran'), risi = has('--risi');
const golden = JSON.parse(fs.readFileSync(path.join(REPO, 'tests', 'golden', 'perf.json'), 'utf8'));

/* ---------------- in the page: stage the strike, step it, count every frame ---------------- */
function stageAndCount(o) {
  const g = window.__game, R = g.race, T = R.track, P = R.player, STEP = 1 / 120, RAD = Math.PI / 180, W = Render.world;
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)), clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  g.pause(); Render.resize();
  const mod = (s) => ((s % T.len) + T.len) % T.len, others = R.cars.filter(c => c !== P);
  if (!W.barKind) return { error: 'the world has no barKind' };
  // where: --m, or the straightest stretch (heading within 3° over 60 m before it and 20 m after) whose barrier on that side is kind 1
  // for 15 m either way, at least 150 m after the start; the side with the nearer barrier first
  const ds = T.len / T.N, kinds = (i, sd) => W.barKind(((i % T.N) + T.N) % T.N, sd);
  let m = o.m, side = o.stran || 0;
  if (m == null) {
    let best = null;
    for (const sd of side ? [side] : [1, -1]) for (let i = Math.ceil(150 / ds); i < T.N - Math.ceil(60 / ds); i++) {
      let ok = true; for (let k = -Math.ceil(15 / ds); k <= Math.ceil(15 / ds) && ok; k++) ok = kinds(i + k, sd) === 1;
      if (!ok) continue;
      let turn = 0; for (let k = -Math.ceil(60 / ds); k <= Math.ceil(20 / ds); k++) turn = Math.max(turn, Math.abs(wrap(T.hd[((i + k) % T.N + T.N) % T.N] - T.hd[i])));
      const q = T.query(T.px[i], T.pz[i], i, {}), far = sd > 0 ? q.br : q.bl;
      if (!(far > 2 && far < 30)) continue;
      const sc = turn * 60 + far * 0.1; if (!best || sc < best.sc) best = { sc, i, sd, turn, far };
    }
    if (!best) return { error: 'no straight stretch with a wall of kind 1 on this track' };
    m = mod(best.i * ds - T.startS); side = best.sd;
  } else if (!side) side = 1;
  const s0 = T.open ? Math.min(T.startS + m, T.finishS - 1) : T.startS + m, i0 = T.idx(mod(s0));
  const O = { x: T.px[i0], z: T.pz[i0], hd: T.hd[i0], tx: Math.cos(T.hd[i0]), tz: Math.sin(T.hd[i0]), nx: T.nx[i0], nz: T.nz[i0] };
  const sg = O.nx * -O.tz + O.nz * O.tx >= 0 ? 1 : -1, kot = 90 * side, right = side > 0;
  // the car square to the road, its nose do_ograje (11.1 m, zid90's) from the barrier it drives at; never past the far barrier behind it
  const q0 = T.query(O.x, O.z, i0, {}), hh = sg * kot * RAD, h = wrap(O.hd + hh), ch = Math.cos(h), sh = Math.sin(h);
  let ext = 0, back = 0; for (const [rx, rz] of P.corners) { const wx = rx * ch - rz * sh, wz = rx * sh + rz * ch, e = (wx * O.nx + wz * O.nz) * side; if (e > ext) ext = e; if (-e > back) back = -e; }
  const near = right ? q0.br : q0.bl, farB = right ? q0.bl : q0.br, gap = Math.min(11.1, near + farB - ext - back - 1.5);
  if (!(gap > 3)) return { error: 'no room to run at the wall at ' + Math.round(m) + ' m' };
  const d = side * (near - gap - ext), v = o.kmh / 3.6, tP = { x: O.x + d * O.nx, z: O.z + d * O.nz, h, v, vx: v * Math.cos(h), vz: v * Math.sin(h) };
  const put = (c, t) => { c.place(t.x, t.z, t.h); c.q = T.query(c.x, c.z, i0, c.q); if (T.hasElev) c.y = c.py = T.hy[c.q.i]; c.sPrev = c.q.s;
    const M = c.m; if (M.gears && t.v > 1) for (let k = 1; k <= M.gears.length; k++) { c.gear = k; if (t.v / M.rw * M.gears[k - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
    c.vx = t.vx; c.vz = t.vz; c.locked = false; c.stuckT = 0; c.wrongT = 0; c.pitWant = false; };
  const hold = (c, t) => { c.x = c.px = t.x; c.z = c.pz = t.z; c.h = c.ph = t.h; c.vx = t.vx; c.vz = t.vz; c.w = 0; };
  others.forEach((c, k) => { const s = s0 - 400 - k * 12, i = T.idx(mod(s)); c.place(T.px[i], T.pz[i], T.hd[i]); c.q = T.query(c.x, c.z, i, c.q); if (T.hasElev) c.y = c.py = T.hy[i]; c.sPrev = c.q.s; c.locked = true; });
  put(P, tP);
  const hit = { wall: 0, car: 0, fx: 0 }, core = R.step;
  R.step = function (dt) { const r = core.call(this, dt); hit.car = P.hitCar || 0; hit.wall = P.hitWall || 0; for (const c of others) if (c.locked) { c.stuckT = 0; c.wrongT = 0; } return r; };
  const inP = { thr: 0 }, one = () => { hit.car = hit.wall = 0; g.sim(STEP, false, 0, inP.thr, 0); };
  let thP = 0.3;
  for (let k = 0; k < 150; k++) { hold(P, tP); inP.thr = thP; one(); if (hit.car > 0 || hit.wall > 0) return { error: 'the car touches where it is staged (' + Math.round(m) + ' m)' }; thP = clamp(thP - (P.speed - tP.v) * 2, 0, 1); }
  hold(P, tP); if (R.debris) { for (const dd of R.debris) dd.dead = true; R.debris.length = 0; }
  // the comparison: the same wall called a steel rail (this tool's own; the game's world is not touched otherwise)
  const kind0 = kinds(i0, side), bk = W.barKind; if (o.brez) W.barKind = () => 0;
  Render.scene.onBeforeRender = (r) => { window.__R = r; }; Render.frame(1 / 60, 1, P, 'chase', {}); Render.scene.onBeforeRender = () => {};
  const RR = window.__R, orig = RR.renderBufferDirect, deb = new WeakSet(), carG = new WeakSet(), KINDS = ['svet', 'avti', 'deli', 'drobci', 'delci', 'drugo'];
  const kindOf = (obj) => { for (let q = obj; q; q = q.parent) { if (q === W.root) return 0; if (carG.has(q)) return 1; if (deb.has(q) || (q.userData && q.userData.xDeb)) return 2; } return obj.isInstancedMesh ? 3 : obj.isPoints || obj.isSprite ? 4 : 5; };
  let rec = null;
  RR.renderBufferDirect = function (cam, sc, geo, mat, obj) { const c0 = __gl.calls, v0 = __gl.verts, res = orig.apply(this, arguments); if (rec) { if (!rec.deb) { rec.deb = 1; if (R.debris) for (const dd of R.debris) if (dd.mesh && dd.mesh.isObject3D) deb.add(dd.mesh); }   // (a piece shed in this very frame)
      const k = kindOf(obj); rec.c[k] += __gl.calls - c0; rec.v[k] += __gl.verts - v0; } return res; };
  let fxMax = 0;
  const frame = (dt) => {
    for (const c of R.cars) { const vw = Render.viewOf(c); if (vw && vw.grp) carG.add(vw.grp); }
    if (R.debris) for (const dd of R.debris) if (dd.mesh && dd.mesh.isObject3D) deb.add(dd.mesh);
    fxMax = Math.max(fxMax, P.fxWall || 0);
    rec = { c: [0, 0, 0, 0, 0, 0], v: [0, 0, 0, 0, 0, 0] }; const c0 = __gl.calls, v0 = __gl.verts, e0 = Render.fxStats().total; Render.frame(dt, 1, P, 'chase', {});
    const I = Render.crashInfo ? Render.crashInfo() : {}, F = Render.fxStats(), info = Render.info ? Render.info() : null;
    const f = { calls: __gl.calls - c0, verts: __gl.verts - v0, c: rec.c, v: rec.v, deli: (R.debris || []).filter(dd => !dd.dead).length, natleh: I.ground || 0, drobci: I.shards || 0, zivih: F.alive, izd: F.total - e0, iskre: F.sparks, tri: info && info.render ? info.render.triangles : null, ri: info && info.render ? info.render.calls : null }; rec = null; return f;
  };
  try {
    __gl.mute = true; Render.resetCam(); for (let k = 0; k < 30; k++) Render.frame(0.1, 1, P, 'chase', {});
    __gl.mute = !o.risi;
    const pre = [], post = []; let n = 0, touch = null; inP.thr = thP;
    for (; n < 120 * 4 && !touch; n++) { one(); if (hit.car > 0 || hit.wall > 0) touch = { s: +(n * STEP).toFixed(3), zapiranje: +Math.max(hit.car, hit.wall).toFixed(1) }; else if (n % 2 === 1) pre.push(frame(1 / 60)); }
    if (!touch) return { error: 'no touch in 4 s after the staging (' + Math.round(m) + ' m)' };
    inP.thr = 0;
    post.push(Object.assign(frame(1 / 60), { t: 0 }));
    for (let k = 1; k <= Math.round(o.secs * 60); k++) { one(); one(); post.push(Object.assign(frame(1 / 60), { t: +(k / 60).toFixed(3) })); }
    const F = Render.fxStats();
    return { pre: pre.slice(-12).map((f, k, a) => Object.assign(f, { t: +((k - a.length) / 60).toFixed(3) })), post, touch, KINDS, m: Math.round(m), side, kind0, fxWall: +fxMax.toFixed(1), cv: Core.TX.cv, rain: !!R.rain, skoda: +(P.dmg || 0).toFixed(2), avtov: R.cars.length };
  } finally { RR.renderBufferDirect = orig; R.step = core; W.barKind = bk; __gl.mute = false; }
}

async function run(browser, base, proga, detajl, vreme, mode) {
  const set = { quality: 'normal', detail: detajl, shadows: 1, camera: 'chase', zoom: 1.2, weather: vreme === 'dez' ? 'rain' : 'dry', tod: 'day', season: 'summer', damage: 2, crV: mode === 'cv5' ? 4 : 5, dmgDet: 1 };
  const q = new URLSearchParams({ proga, t: '0.5', tekmeci: '1', vreme });
  const { ctx, page, errors } = await openGame(browser, base + '/index.html?' + q, set, { width: 844, height: 390 }, { seed: 12345 });
  try {
    await page.evaluate(() => {
      window.__gl = { calls: 0, verts: 0, mute: false };
      const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
      const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); if (window.__gl.mute) return; return f.apply(this, a); }; };
      wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
    });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    const st = await page.evaluate((id) => { const g = window.__game; return { ok: !!(g.race && g.race.track.def.id === id), bad: g.quick.q.bad, cv: Core.TX.cv, test: !!g.race.track.def.test }; }, proga);
    if (!st.ok || st.bad.length) throw new Error(`no race on ${proga} (${st.bad.join(', ') || 'the quick entry did not start one'})`);
    if (st.cv !== (mode === 'cv5' ? 5 : 6)) throw new Error(`cv ${st.cv} is not the one asked for (${mode})`);
    const r = await page.evaluate(stageAndCount, { secs: 1.5, kmh, risi, brez: mode === 'brez', m: run.m != null ? run.m : mArg != null ? +mArg : null, stran: run.side || (stranArg ? +stranArg : 0) });
    if (r.error) throw new Error(`${proga} ${detajl} ${vreme} ${mode}: ${r.error}`);
    if (errors.length) console.log(`(${errors.length} page errors: ${errors.slice(0, 3).join(' | ').slice(0, 300)})`);
    return r;
  } finally { await ctx.close(); }
}

const kv = (v) => Math.round(v / 1000) + 'k', mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1), top = (a, f) => a.reduce((x, y) => f(y) > f(x) ? y : x);
const srv = await serve(), browser = await launch(), all = [], rows = [];
try {
  console.log(`zid90 at ${kmh} km/h, 844 x 390, quality normal, shadows, chase, damage 2 (Vklop), Podrobne, seed 12345; frames from -0.2 s to +1.5 s, 60 a second${risi ? '' : ' (draws counted, not made)'}`);
  for (const proga of proge) { run.m = null; run.side = 0;
    for (const detajl of detajli) for (const vreme of vremena) {
      const R = {}; for (const mode of ['prah', 'brez', 'cv5']) { const r = await run(browser, srv.base, proga, detajl, vreme, mode); R[mode] = r; run.m = r.m; run.side = r.side; all.push(Object.assign({ proga, detajl, vreme, mode }, r)); }
      const A = R.prah, B = R.brez, C = R.cv5, fa = A.pre.concat(A.post), fb = B.pre.concat(B.post), fc = C.pre.concat(C.post), n = Math.min(fa.length, fb.length);
      // the difference prah − brez of every frame: the particles' own draws (kind delci: the grit's), everything but the world (cars, pieces,
      // shards, particles, the rest), and the world's (the same world in both; what differs there differs before the touch too: which
      // of the world's parts the page had built and culled, not the strike)
      const rng = (f, from) => { let lo = 1e9, hi = -1e9; for (let k = from || 0; k < n; k++) { const d = f(fa[k]) - f(fb[k]); lo = Math.min(lo, d); hi = Math.max(hi, d); } return lo === hi ? String(lo) : lo + '..' + hi; };
      const np = A.pre.length, dDelci = rng(f => f.c[4]), dvDelci = rng(f => f.v[4]), dOst = rng(f => f.calls - f.c[0]), dSvet = rng(f => f.c[0], np), dSvetPred = (() => { let lo = 1e9, hi = -1e9; for (let k = 0; k < np; k++) { const d = fa[k].c[0] - fb[k].c[0]; lo = Math.min(lo, d); hi = Math.max(hi, d); } return lo + '..' + hi; })();
      let dMax = -1e9, dMin = 1e9, dvMax = -1e9, izd = 0, izdB = 0; for (let k = 0; k < n; k++) { const d = fa[k].calls - fb[k].calls, dv = fa[k].verts - fb[k].verts; dMax = Math.max(dMax, d); dMin = Math.min(dMin, d); dvMax = Math.max(dvMax, dv); }
      for (const f of A.post) izd += f.izd; for (const f of B.post) izdB += f.izd;
      const pc = Math.round(mean(A.pre.map(f => f.calls))), ta = top(fa, f => f.calls), tb = top(fb, f => f.calls), tc = top(fc, f => f.calls), va = top(fa, f => f.verts), za = top(fa, f => f.zivih), zb = top(fb, f => f.zivih), G = golden[proga] || {};
      const p0 = A.KINDS.map((_, k) => mean(A.pre.map(x => x.c[k])));
      console.log(`\n${proga} · ${detajl} · ${vreme} · ${A.m} m, side ${A.side > 0 ? 'right' : 'left'}, barKind ${A.kind0}, closing ${A.touch.zapiranje} m/s, fxWall ${A.fxWall}, damage ${A.skoda}${A.rain ? ', rain' : ''}`);
      console.log(`  before the touch ${pc} calls; most in the window: prah ${ta.calls} (t ${ta.t} s), brez ${tb.calls} (t ${tb.t} s), cv5 ${tc.calls} (t ${tc.t} s); the frame of the touch: prah ${A.post[0].calls}, brez ${B.post[0].calls}, cv5 ${C.post[0].calls}`);
      console.log(`  prah − brez, frame by frame: particles' calls ${dDelci} (vertices ${dvDelci}), all but the world ${dOst}, the world ${dSvet} (before the touch already ${dSvetPred}); all calls ${dMin}..${dMax}; most vertices ${kv(va.verts)} (t ${va.t} s)`);
      console.log(`  the busiest frame (prah, t ${ta.t} s): ` + A.KINDS.map((nm, k) => `${nm} ${ta.c[k]} (${ta.c[k] - p0[k] >= 0 ? '+' : ''}${Math.round(ta.c[k] - p0[k])})`).join(', ') + `; pieces ${ta.deli}, on the road ${ta.natleh}, shards ${ta.drobci}`);
      console.log(`  particles: emitted after the touch prah ${izd}, brez ${izdB} (the grit ${izd - izdB}); alive at most prah ${za.zivih}, brez ${zb.zivih}, of 2400`);
      console.log(`  limits: perf.json ${proga} maxCalls ${G.maxCalls || '-'}, maxKverts ${G.maxKverts || '-'} (the track without a crash); the budget 300 calls / 900k vertices: ${ta.calls <= 300 && va.verts <= 900000 ? 'within' : 'OVER'}`);
      rows.push([proga, detajl, vreme, pc, ta.calls, tb.calls, tc.calls, `${dDelci} / ${dOst}`, Math.round(va.verts / 1000), G.maxCalls || '-', G.maxKverts || '-', za.zivih, izd - izdB]);
    } }
} finally { await browser.close(); await srv.close(); }
console.log('\nproga      detajl vreme  pred  vrh:prah  brez  cv5   prah−brez (delci / vse brez sveta)  kverts  perf.maxCalls  maxKverts  živih  grušča');
for (const r of rows) console.log(`${r[0].padEnd(10)} ${r[1].padEnd(6)} ${r[2].padEnd(6)} ${String(r[3]).padEnd(5)} ${String(r[4]).padEnd(9)} ${String(r[5]).padEnd(5)} ${String(r[6]).padEnd(5)} ${String(r[7]).padEnd(35)} ${String(r[8]).padEnd(7)} ${String(r[9]).padEnd(14)} ${String(r[10]).padEnd(10)} ${String(r[11]).padEnd(6)} ${r[12]}`);
const out = path.join(REPO, 'test-results', 'obremenitev'); fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'prah-klici.json'), JSON.stringify(all));
console.log(`\nwrote ${path.relative(REPO, path.join(out, 'prah-klici.json'))}`);
