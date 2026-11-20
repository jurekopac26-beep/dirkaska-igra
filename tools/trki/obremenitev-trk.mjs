// The rendering load of a HARD crash: draw calls and vertices of every frame from the first touch until 6 s after it, on the phone's
// screen (844 x 390, normal quality, NIZKA, shadows, the camera behind the car: as tests/browser/perf.test.mjs counts a track), on Spa,
// knocks Realistična (cv 6), damage Vklop, Math.random seeded. Each scene with Podrobnosti poškodb Podrobne (dmgDet 1) and Preproste (0).
// The budget (CLAUDE.md, tests/golden/perf.json): about 300 draw calls and about 900 thousand vertices a frame.
// The scenes (staged as tools/trki/slike.mjs stages its own: the quick entry, the game paused and stepped from here, 1/120 s a step, the
// cars held on the spot till the gearbox and the suspension settle, then let go; nothing random in the staging):
//   zid200   the player alone, straight into the barrier beside the road at 200 km/h (the rivals parked 400 m back)
//   start    a pile-up at the start: the whole field (19 rivals) on the grid, eight of the rearmost stalled in a tight block behind it,
//            the player into the block at 160 km/h, three more rivals right behind it at 150 km/h; how many rivals were knocked is printed (at least 6 is asked)
//   tbone120 the player square into the side of a rival standing across the road at 120 km/h
// Printed for a scene: the frames before the touch (pred), the busiest frame after it by draw calls and by vertices (vrh), the mean of
// the 6 s (povp), and what the busiest frames are made of: every draw put down to the world, the cars (a part hanging on its car is
// the car's), the shed pieces (Race.debris: flying, and lying on the road), instanced effects outside the world (the glass shards),
// particles (points and sprites: sparks, smoke, dust) and the rest (sky, skid marks); beside it the difference to the frames before
// the touch, and the counts (pieces alive, pieces kept on the road, shards).
// The draws are counted, not made (the context's draw functions return at once: a frame of software WebGL takes half a second, a
// scene has 360 of them); --risi makes them too (the same counts, slow).
//   node tools/trki/obremenitev-trk.mjs                      all three scenes, dmgDet 1 then 0
//   node tools/trki/obremenitev-trk.mjs zid200 --dmgdet 1    one scene, one setting
// Options: --dmgdet 1,0  --proga spa  --s 6 (seconds after the touch)  --detajl low|high (Grafika: NIZKA, the budget's tier)  --risi
//   --razrez 0.6            the cars of the frame that far after the touch: each one's draws by what of the car they are
//   --slika f.png [--slika-t 0.6]   that frame drawn for real and saved (844 x 390, the chase camera)
//   --xltk 99               the pile-up's rule (render.js xLtCut): how many knocked rivals keep their own panels (99: the rule off)
// Writes test-results/obremenitev/trk.json (every frame of every scene).
import fs from 'node:fs';
import path from 'node:path';
import { REPO, serve, launch, openGame } from '../../tests/browser/lib.mjs';

const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; }, has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const dets = (flag('--dmgdet') || '1,0').split(',').map(Number), proga = flag('--proga') || 'spa', secs = +(flag('--s') || 6), detajl = flag('--detajl') || 'low', risi = has('--risi'), razrez = flag('--razrez'), slika = flag('--slika'), slikaT = +(flag('--slika-t') || 0.6), xltk = flag('--xltk');
// m: metres after the start (the straights tools/trki/slike-scenariji.json uses on Spa); igralec / tekmeci: the road's frame there
// (naprej along it, desno across it to the right, kot the nose's angle to the road, do_ograje: the nearest corner that far from the barrier)
const SCENES = {
  zid200: { naslov: 'head-on into the barrier at 200 km/h', tekmeci: 1, m: 660, igralec: { do_ograje: 11.1, kot: 90, kmh: 200 }, rivali: [] },
  start: { naslov: 'pile-up at the start: into 8 stalled rivals at 160 km/h, 3 rivals following at 150 km/h, 19 rivals in the race', tekmeci: 19, grid: 55, igralec: { naprej: 0, desno: 0, kot: 0, kmh: 160 },
    rivali: [[24, -2.3, 20, 0], [24, 0, -15, 0], [24, 2.3, 25, 0], [28.8, -2.3, -25, 0], [28.8, 0, 90, 0], [28.8, 2.3, 15, 0], [33.6, -1.3, -20, 0], [33.6, 1.3, 30, 0],
      [-9, -2.6, 0, 150], [-9, 2.6, 0, 150], [-16, 0, 0, 150]].map(([naprej, desno, kot, kmh]) => ({ naprej, desno, kot, kmh })) },
  tbone120: { naslov: 'T-bone: square into the side of a standing rival at 120 km/h', tekmeci: 1, m: 1700, igralec: { naprej: 0, desno: 0, kot: 0, kmh: 120 }, rivali: [{ naprej: 16.8, desno: 0, kot: 90, kmh: 0 }] },
};
const names = args.length ? args : Object.keys(SCENES);
if (names.some(n => !SCENES[n]) || dets.some(d => d !== 0 && d !== 1)) { console.log('usage: node tools/trki/obremenitev-trk.mjs [' + Object.keys(SCENES).join('|') + ' …] [--dmgdet 1,0] [--proga spa] [--s 6] [--detajl low|high] [--risi]'); process.exit(2); }

/* ---------------- in the page: stage the scene, step it, count every frame ---------------- */
// One go, nothing awaited: the page's own loop (paused: it only draws) gets no turn between the steps
function stageAndCount(o) {
  const g = window.__game, R = g.race, T = R.track, P = R.player, STEP = 1 / 120, RAD = Math.PI / 180;
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)), clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  g.pause(); Render.resize();
  const others = R.cars.filter(c => c !== P), mod = (s) => ((s % T.len) + T.len) % T.len;
  if (others.length < o.rivali.length) return { error: 'the race has ' + others.length + ' rivals, the scene stages ' + o.rivali.length };
  // the road's frame: m metres after the start, or (grid) that far behind the rearmost car of the grid
  const rel = (c) => mod(c.q.s - P.q.s + T.len / 2) - T.len / 2;   // (a car's place along the lap, from the player's)
  const byBack = others.slice().sort((a, b) => rel(a) - rel(b));
  const s0 = o.grid != null ? P.q.s + Math.min(0, rel(byBack[0])) - o.grid : T.open ? Math.min(T.startS + o.m, T.finishS - 1) : T.startS + o.m, i0 = T.idx(mod(s0));
  const O = { x: T.px[i0], z: T.pz[i0], hd: T.hd[i0], tx: Math.cos(T.hd[i0]), tz: Math.sin(T.hd[i0]), nx: T.nx[i0], nz: T.nz[i0] };
  const sg = O.nx * -O.tz + O.nz * O.tx >= 0 ? 1 : -1;
  const pose = (a, d, kot, kmh) => { const h = wrap(O.hd + sg * kot * RAD), v = kmh / 3.6; return { x: O.x + a * O.tx + d * O.nx, z: O.z + a * O.tz + d * O.nz, h, v, vx: v * Math.cos(h), vz: v * Math.sin(h), a, d }; };
  const atWall = (c, cfg, a0) => {   // (the car's place across the road: its nearest corner do_ograje from the barrier it drives at)
    const kot = cfg.kot || 0, right = kot >= 0, hh = sg * kot * RAD, ch = Math.cos(O.hd + hh), sh = Math.sin(O.hd + hh);
    let ext = 0, extA = 0; for (const [rx, rz] of c.corners) { const wx = rx * ch - rz * sh, wz = rx * sh + rz * ch, e = (wx * O.nx + wz * O.nz) * (right ? 1 : -1); if (e > ext) { ext = e; extA = wx * O.tx + wz * O.tz; } }
    const aHit = a0 + extA + (Math.abs(Math.sin(kot * RAD)) > 0.02 ? cfg.do_ograje / Math.abs(Math.tan(kot * RAD)) : 0), iH = T.idx(mod(s0 + aHit)), qH = T.query(T.px[iH], T.pz[iH], iH, {});
    return (right ? 1 : -1) * ((right ? qH.br : qH.bl) - cfg.do_ograje - ext);
  };
  const ip = o.igralec, tP = pose(ip.naprej || 0, ip.do_ograje != null ? atWall(P, ip, ip.naprej || 0) : ip.desno || 0, ip.kot || 0, ip.kmh || 0);
  const put = (c, t) => {   // (a car put there: on the road's height, in the gear of its speed)
    c.place(t.x, t.z, t.h); c.q = T.query(c.x, c.z, i0, c.q); if (T.hasElev) c.y = c.py = T.hy[c.q.i]; c.sPrev = c.q.s;
    const M = c.m; if (M.gears && t.v > 1) for (let k = 1; k <= M.gears.length; k++) { c.gear = k; if (t.v / M.rw * M.gears[k - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
    c.vx = t.vx; c.vz = t.vz; c.locked = t.v < 0.5; c.stuckT = 0; c.wrongT = 0; c.pitWant = false;
  };
  const back = (c, t) => { c.x = c.px = t.x; c.z = c.pz = t.z; c.h = c.ph = t.h; c.vx = t.vx; c.vz = t.vz; c.w = 0; };
  // the staged rivals: the rearmost of the field; the others stay on the grid, held (grid), or are parked 400 m back
  const staged = byBack.slice(0, o.rivali.length), tB = o.rivali.map(r => pose(tP.a + r.naprej, tP.d + r.desno, r.kot || 0, r.kmh || 0));
  others.forEach((c, k) => { if (staged.includes(c)) return; if (o.grid != null) { c.locked = true; c.vx = c.vz = 0; return; }
    const s = s0 - 400 - k * 12, i = T.idx(mod(s)); c.place(T.px[i], T.pz[i], T.hd[i]); c.q = T.query(c.x, c.z, i, c.q); if (T.hasElev) c.y = c.py = T.hy[i]; c.sPrev = c.q.s; c.locked = true; });
  put(P, tP); staged.forEach((c, k) => put(c, tB[k]));
  // this step's knocks, read before the game clears them; who was knocked at all
  const hit = { car: 0, wall: 0 }, knocked = new Set(), core = R.step;
  R.step = function (dt) { const r = core.call(this, dt); hit.car = P.hitCar || 0; hit.wall = P.hitWall || 0; for (const c of others) { if (c.hitCar > 0) knocked.add(c); if (c.locked) { c.stuckT = 0; c.wrongT = 0; } } return r; };
  const inP = { thr: 0 }, one = () => { hit.car = hit.wall = 0; g.sim(STEP, false, 0, inP.thr, 0); };
  let thP = tP.v > 1 ? 0.3 : 0;
  for (let k = 0; k < 150; k++) {   // (on the spot: the throttle that holds the speed is found)
    back(P, tP); staged.forEach((c, j) => back(c, tB[j])); inP.thr = thP; one();
    if (hit.car > 0 || hit.wall > 0) return { error: 'the cars touch where they are staged' };
    thP = clamp(thP - (P.speed - tP.v) * 2, 0, 1);
  }
  back(P, tP); staged.forEach((c, j) => back(c, tB[j])); knocked.clear();
  if (R.debris) { for (const d of R.debris) d.dead = true; R.debris.length = 0; }
  // every draw of a frame put down to what made it (the renderer's renderBufferDirect is each draw, the shadow pass's too)
  Render.scene.onBeforeRender = (r) => { window.__R = r; }; Render.frame(1 / 60, 1, P, 'chase', {}); Render.scene.onBeforeRender = () => {};
  const RR = window.__R, orig = RR.renderBufferDirect, deb = new WeakSet(), carG = new WeakSet(), KINDS = ['svet', 'avti', 'deli', 'drobci', 'delci', 'drugo'];
  for (const c of R.cars) { const v = Render.viewOf(c); if (v && v.grp) carG.add(v.grp); }
  const kindOf = (obj) => { for (let q = obj; q; q = q.parent) { if (q === Render.world.root) return 0; if (carG.has(q)) return 1; if (deb.has(q) || (q.userData && q.userData.xDeb)) return 2; } return obj.isInstancedMesh ? 3 : obj.isPoints || obj.isSprite ? 4 : 5; };
  let rec = null, cut = null;
  // --razrez: every draw of one frame put down to its car and to what of the car it is (the view's own field that holds the object or
  // its nearest named parent: body, det, parts.hood, under.hood, wheels.0 ...; '/s' the shadow pass)
  const roleOf = (obj) => { let v = null, top = null; for (let q = obj; q; q = q.parent) if (carG.has(q)) { top = q; break; } if (!top) return null;
    for (const c of R.cars) { const w = Render.viewOf(c); if (w && w.grp === top) { v = w; break; } } if (!v) return null;
    if (!v.__role) { const M = v.__role = new Map(), put = (o, n) => { if (o && o.isObject3D && !M.has(o)) M.set(o, n); };
      for (const k of Object.keys(v)) { const x = v[k]; if (!x || typeof x !== 'object' || k === 'grp' || k === 'bodyG' || k === '__role') continue; if (x.isObject3D) put(x, k); else if (k === 'far') put(x.mesh, 'far'); else if (Array.isArray(x)) x.forEach((o, i) => put(o, k + '.' + i)); else if (!x.isMaterial && !x.isBufferGeometry) for (const n of Object.keys(x)) put(x[n], k + '.' + n); } }
    let role = '?'; for (let q = obj; q && q !== top; q = q.parent) { const n = v.__role.get(q); if (n) { role = n + (q === obj ? '' : '>'); break; } }
    return { id: v.car.id, role }; };
  RR.renderBufferDirect = function (cam, sc, geo, mat, obj) { const c0 = __gl.calls, v0 = __gl.verts, res = orig.apply(this, arguments); if (rec) { const k = kindOf(obj); rec.c[k] += __gl.calls - c0; rec.v[k] += __gl.verts - v0;
    if (cut && k === 1) { const r = roleOf(obj); if (r) { const sh = mat.isMeshDepthMaterial || mat.isMeshDistanceMaterial, m = cut[r.id] || (cut[r.id] = {}), n = r.role + (sh ? '/s' : ''); m[n] = (m[n] || 0) + (__gl.calls - c0); } }
    else if (cut && k === 5) { const m = cut.drugo || (cut.drugo = {}), n = (obj.name || (obj.parent && obj.parent.name) || obj.type) + ':' + (mat.name || mat.type) + (mat.isMeshDepthMaterial || mat.isMeshDistanceMaterial ? '/s' : ''); m[n] = (m[n] || 0) + (__gl.calls - c0); } } return res; };   // (drugo, the rest: by the object's or its parent's name and its material)
  const frame = (dt) => {
    for (const c of R.cars) { const v = Render.viewOf(c); if (v && v.grp) carG.add(v.grp); }   // (a view built again after a knock)
    if (R.debris) for (const d of R.debris) if (d.mesh && d.mesh.isObject3D) deb.add(d.mesh);
    rec = { c: [0, 0, 0, 0, 0, 0], v: [0, 0, 0, 0, 0, 0] }; const c0 = __gl.calls, v0 = __gl.verts; Render.frame(dt, 1, P, 'chase', {});
    if (R.debris) for (const d of R.debris) if (d.mesh && d.mesh.isObject3D) deb.add(d.mesh);
    const I = Render.crashInfo ? Render.crashInfo() : {}, f = { calls: __gl.calls - c0, verts: __gl.verts - v0, c: rec.c, v: rec.v, deli: (R.debris || []).filter(d => !d.dead).length, natleh: I.ground || 0, drobci: I.shards || 0 }; rec = null; return f;
  };
  try {
    __gl.mute = true; Render.resetCam(); for (let k = 0; k < 30; k++) Render.frame(0.1, 1, P, 'chase', {});   // (the camera there at once)
    __gl.mute = !o.risi;
    // the run up to the first touch: the speed held, a frame every two steps (60 a second)
    const pre = [], post = []; let n = 0, touch = null; inP.thr = thP;
    for (; n < 120 * 4 && !touch; n++) { one(); if (hit.car > 0 || hit.wall > 0) touch = { s: +(n * STEP).toFixed(3), kaj: hit.car > 0 ? 'avto' : 'ograja', zapiranje: +Math.max(hit.car, hit.wall).toFixed(1), kmh: +(tP.v * 3.6).toFixed(0) }; else if (n % 2 === 1) pre.push(frame(1 / 60)); }
    if (!touch) return { error: 'no touch in 4 s after the staging' };
    if (!pre.length) pre.push(frame(1 / 60));
    inP.thr = 0;   // (after the touch: no pedal, no steer)
    post.push(Object.assign(frame(1 / 60), { t: 0 }));
    if (o.xltk != null) Render.setDebug({ xLtK: o.xltk });   // (the pile-up's rule, render.js xLtCut: how many knocked rivals keep their own panels; 99: the rule off)
    const N = Math.round(o.secs * 60), kCut = o.razrez != null ? Math.round(o.razrez * 60) : -1, kPic = o.slika ? Math.round(o.slikaT * 60) : -1; let razrez = null, png = null, drugo = null;
    for (let k = 1; k <= N; k++) { one(); one();
      if (k === kCut) cut = {};
      post.push(Object.assign(frame(1 / 60), { t: +(k / 60).toFixed(3) }));
      if (k === kCut) {   // (the cars of that frame: their draws by role, how far from the camera, what state their view is in)
        const cp = Render.camera.position; razrez = R.cars.map(c => { const v = Render.viewOf(c) || {}, m = cut[c.id] || {}; return { id: c.id, model: c.m.id, igralec: !!c.isPlayer, m: +Math.hypot(c.x - cp.x, c.z - cp.z).toFixed(1), dmg: +(c.dmg || 0).toFixed(2), klici: Object.values(m).reduce((a, b) => a + b, 0), mrg: !!v.mrg, lahek: !!v.xLt, far: !!(v.far && v.far.on), vloge: m }; }); drugo = cut.drugo || {}; cut = null; }
      if (k === kPic) { __gl.mute = false; Render.frame(0, 1, P, 'chase', {}); png = document.querySelector('canvas').toDataURL('image/png'); __gl.mute = !o.risi; }   // (the picture: this frame drawn for real, dt 0: nothing moves on)
    }
    return { razrez, drugo, png, pre: pre.slice(-30), post, touch, KINDS, zadetih: knocked.size, avtov: R.cars.length, skoda: +(P.dmg || 0).toFixed(2), cv: Core.TX.cv, XC: (Render.crashInfo ? Render.crashInfo().XC : null), kmhPo: +(P.speed * 3.6).toFixed(0), avto: P.m.id };
  } finally { RR.renderBufferDirect = orig; R.step = core; __gl.mute = false; }
}

/* ---------------- one scene with one setting: its own page ---------------- */
async function run(browser, base, name, det) {
  const S = SCENES[name];
  const set = { quality: 'normal', detail: detajl, shadows: 1, camera: 'chase', zoom: 1.2, weather: 'dry', tod: 'day', season: 'summer', damage: 2, crV: 5, dmgDet: det };
  const q = new URLSearchParams({ proga: proga, t: '0.5', tekmeci: String(S.tekmeci), vreme: 'suho' });
  const { ctx, page, errors } = await openGame(browser, base + '/index.html?' + q, set, { width: 844, height: 390 }, { seed: 12345 });
  try {
    await page.evaluate(() => {   // (counted as perf.test.mjs counts them; mute: counted, not made)
      window.__gl = { calls: 0, verts: 0, mute: false };
      const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
      const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); if (window.__gl.mute) return; return f.apply(this, a); }; };
      wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
    });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    const st = await page.evaluate(([id, det]) => { const g = window.__game; return { ok: !!(g.race && g.race.track.def.id === id), bad: g.quick.q.bad, cv: Core.TX.cv, det: g.S.dmgDet, dmg: g.S.damage, test: !!g.race.track.def.test }; }, [proga, det]);
    if (!st.ok || st.bad.length) throw new Error(`no race on ${proga} (${st.bad.join(', ') || 'the quick entry did not start one'})`);
    if (st.cv !== 6 || +st.det !== det || +st.dmg !== 2) throw new Error(`the page's settings are not the ones asked for: cv ${st.cv}, dmgDet ${st.det}, damage ${st.dmg}`);
    const r = await page.evaluate(stageAndCount, Object.assign({ secs, risi, razrez: razrez != null ? +razrez : null, slika: !!slika, slikaT, xltk: xltk != null ? +xltk : null }, S));
    if (r.png) { const f = slika.replace(/\.png$/, '') + (names.length * dets.length > 1 ? `-${name}-${det}` : '') + '.png'; fs.mkdirSync(path.dirname(path.resolve(f)), { recursive: true }); fs.writeFileSync(f, Buffer.from(r.png.split(',')[1], 'base64')); console.log('picture: ' + f); } delete r.png;
    if (r.error) throw new Error(`${name}, dmgDet ${det}: ${r.error}`);
    if (errors.length) console.log(`(${errors.length} page errors: ${errors.slice(0, 3).join(' | ').slice(0, 300)})`);
    return Object.assign(r, { scena: name, dmgDet: det });
  } finally { await ctx.close(); }
}

const kv = (v) => Math.round(v / 1000) + 'k', mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
function report(r) {
  const pc = Math.round(mean(r.pre.map(f => f.calls))), pv = mean(r.pre.map(f => f.verts)), bc = r.post.reduce((a, b) => b.calls > a.calls ? b : a), bv = r.post.reduce((a, b) => b.verts > a.verts ? b : a);
  const mc = Math.round(mean(r.post.map(f => f.calls))), mv = mean(r.post.map(f => f.verts)), over = bc.calls > 300 || bv.verts > 900000;
  const over300 = r.post.filter(f => f.calls > 300).length;
  console.log(`\n${r.scena} · dmgDet ${r.dmgDet} · ${SCENES[r.scena].naslov}`);
  console.log(`  touch: ${r.touch.kaj}, closing ${r.touch.zapiranje} m/s, staged ${r.touch.kmh} km/h; rivals knocked ${r.zadetih} of ${r.avtov - 1}; the player's damage ${r.skoda}, ${r.kmhPo} km/h at the end`);
  console.log(`  pred  ${String(pc).padStart(4)} calls  ${kv(pv).padStart(5)} vertices   (${r.pre.length} frames before the touch)`);
  console.log(`  vrh   ${String(bc.calls).padStart(4)} calls (t ${bc.t} s)  ${kv(bv.verts).padStart(5)} vertices (t ${bv.t} s)   ${over ? 'OVER the budget (300 / 900k)' : 'within the budget (300 / 900k)'}${over300 ? `; ${over300} of ${r.post.length} frames over 300 calls` : ''}`);
  console.log(`  povp  ${String(mc).padStart(4)} calls  ${kv(mv).padStart(5)} vertices   (${r.post.length} frames, ${secs} s)`);
  const part = (f, tag) => { const p0c = r.KINDS.map((_, k) => mean(r.pre.map(x => x.c[k]))), p0v = r.KINDS.map((_, k) => mean(r.pre.map(x => x.v[k])));
    console.log(`  ${tag} (t ${f.t} s): ` + r.KINDS.map((n, k) => `${n} ${f.c[k]}/${kv(f.v[k])} (${f.c[k] - p0c[k] >= 0 ? '+' : ''}${Math.round(f.c[k] - p0c[k])}/${f.v[k] - p0v[k] >= 0 ? '+' : ''}${kv(f.v[k] - p0v[k])})`).join(', ') + `; pieces ${f.deli}, on the road ${f.natleh}, shards ${f.drobci}`); };
  part(bc, 'busiest by calls   '); if (bv !== bc) part(bv, 'busiest by vertices');
  if (r.razrez) { console.log(`  the cars at t ${razrez} s (id model: metres from the camera, damage, draws; state; draws by role, /s the shadow pass):`);
    for (const c of r.razrez.slice().sort((a, b) => a.m - b.m)) console.log(`    ${String(c.id).padStart(2)} ${c.model.padEnd(12)} ${String(c.m).padStart(6)} m  dmg ${c.dmg.toFixed(2)}  ${String(c.klici).padStart(3)} draws  ${c.igralec ? 'player' : c.far ? 'far' : c.lahek ? 'light' : c.mrg ? 'merged' : 'apart'}  ` + Object.entries(c.vloge).sort((a, b) => b[1] - a[1]).map(([n, k]) => n + ' ' + k).join(', '));
    if (r.drugo) console.log('    the rest (drugo) by object:material: ' + Object.entries(r.drugo).sort((a, b) => b[1] - a[1]).map(([n, k]) => n + ' ' + k).join(', ')); }
  const end = r.post[r.post.length - 1]; part(end, 'the last frame     ');
  return { scena: r.scena, dmgDet: r.dmgDet, pred: [pc, Math.round(pv / 1000)], vrh: [bc.calls, Math.round(bv.verts / 1000)], povp: [mc, Math.round(mv / 1000)], nad: over, zadetih: r.zadetih };
}

const srv = await serve(), browser = await launch(), all = [], sum = [];
try {
  console.log(`${proga}, 844 x 390, quality normal, detail ${detajl}, shadows, chase, cv 6, damage 2 (Vklop), seed 12345; ${secs} s after the touch, 60 frames a second${risi ? '' : ' (draws counted, not made)'}`);
  console.log('kinds: svet = the world, avti = the cars (and what hangs on them), deli = shed pieces, drobci = instanced effects outside the world (shards), delci = points and sprites, drugo = the rest; calls/vertices (difference to before the touch)');
  for (const det of dets) for (const n of names) { const r = await run(browser, srv.base, n, det); all.push(r); sum.push(report(r)); }
} finally { await browser.close(); await srv.close(); }
console.log('\nscene      dmgDet   pred calls/kv   vrh calls/kv   povp calls/kv   budget');
for (const s of sum) console.log(`${s.scena.padEnd(10)} ${String(s.dmgDet).padEnd(8)} ${(s.pred[0] + '/' + s.pred[1]).padEnd(15)} ${(s.vrh[0] + '/' + s.vrh[1]).padEnd(14)} ${(s.povp[0] + '/' + s.povp[1]).padEnd(15)} ${s.nad ? 'OVER' : 'ok'}`);
const out = path.join(REPO, 'test-results', 'obremenitev'); fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'trk.json'), JSON.stringify(all));
console.log(`\nwrote ${path.relative(REPO, path.join(out, 'trk.json'))}`);
