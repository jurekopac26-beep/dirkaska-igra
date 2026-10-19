// Tyre marks over the road's covers and plates: a live tyre mark (Render's Skids) laid across a manhole cover, a gully grate and a repair patch
// (the road's wear) on Harju and across a tar patch and a repair patch on Longford is seen ON them from the chase camera, on a phone on its side
// (640 x 360, 10 and 35 m behind) and upright (360 x 640, the tilt 30 %, 10, 35 and 70 m behind), at the quality 'high' (the post target: 16-bit
// depth) and 'normal' (the canvas: 24-bit depth): the same frame drawn with the marks shown and hidden must differ on the cover (before, the covers
// and patches were drawn over the marks and the mark was cut where it crossed them). The same mark laid under the car's body stays hidden by
// the car. The road decals' order (world.js ROAD DECAL ORDER): covers and patches transparent, not written to the depth buffer, still depth-tested;
// Longford's patches 0.4 < the road's wear 0.5 < Harju's covers 0.75 < the baked tyre marks 1 < the live marks 2.
//   node tests/browser/marks.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('tyre marks over covers, grates and patches');
const srv = await serve();
const browser = await launch();
const MEASURE = async (dists) => {
  const g = window.__game, Tr = g.race.track, P = g.race.player, W = Render.world, sc = Render.scene; g.pause();
  const V = Render.camera.position.constructor, out = { order: null, shots: [], guards: [] };
  const sk = sc.getObjectByName('skids');   // (the live marks: Render's Skids)
  // the road decals and their order
  const by = (f) => { const a = []; W.root.traverse(o => { if (o.isMesh && f(o)) a.push(o); }); return a; };
  const wear = by(o => o.name === 'roadwear'), baked = by(o => o.name === 'tyremarks'), covers = by(o => o.name === 'roadcovers'), patches = by(o => o.name === 'roadpatches');
  out.order = { skids: sk && sk.renderOrder, wear: [...new Set(wear.map(o => o.renderOrder))], baked: [...new Set(baked.map(o => o.renderOrder))],
    covers: covers.map(o => ({ ro: o.renderOrder, tr: o.material.transparent, dw: o.material.depthWrite, dt: o.material.depthTest, po: o.material.polygonOffset })),
    patches: patches.map(o => ({ ro: o.renderOrder, tr: o.material.transparent, dw: o.material.depthWrite, dt: o.material.depthTest, po: o.material.polygonOffset })) };
  // the targets: Harju's manholes (lid: 0.30 m, IRON 0.26) and grates (GRT 0.08) on the stage, the roadwear's patches; Longford's tar patches
  const tg = [], grs = []; const add = (kind, x, z, R) => { if (!tg.some(c => Math.hypot(c.x - x, c.z - z) < 1)) tg.push({ kind, x, z, R }); };
  for (const o of covers.concat(patches)) { const A = o.geometry.attributes.position.array, C = o.geometry.attributes.color.array, cs = o.geometry.attributes.color.itemSize, n = A.length / 9;
    for (let t = 0; t < n; t++) { const v = t * 3, c = C[v * cs];
      if (Tr.def.id === 'harju' && Math.abs(c - 0.26) < 0.002 && Math.abs(Math.hypot(A[v * 3 + 3] - A[v * 3], A[v * 3 + 5] - A[v * 3 + 2]) - 0.3) < 0.01) add('manhole', A[v * 3], A[v * 3 + 2], 0.3);
      else if (Tr.def.id === 'harju' && Math.abs(c - 0.08) < 0.002) for (let k = 0; k < 3; k++) { const x = A[v * 3 + k * 3], z = A[v * 3 + k * 3 + 2]; let cl = grs.find(q => Math.hypot(q.x / q.n - x, q.z / q.n - z) < 0.6); if (!cl) grs.push(cl = { x: 0, z: 0, n: 0 }); cl.x += x; cl.z += z; cl.n++; }
      else if (Tr.def.id === 'longford' && (Math.abs(c - 0.74) < 0.003 || Math.abs(c - 0.93) < 0.003)) add('tar patch', (A[v * 3] + A[v * 3 + 3] + A[v * 3 + 6]) / 3, (A[v * 3 + 2] + A[v * 3 + 5] + A[v * 3 + 8]) / 3, 0.3); } }
  for (const q of grs) add('grate', q.x / q.n, q.z / q.n, 0.15);
  for (const o of wear) { const A = o.geometry.attributes.position.array, C = o.geometry.attributes.color.array, U = o.geometry.attributes.uv.array, I = o.geometry.index.array;
    for (let t = 0; t < I.length; t += 6) { const a = I[t]; if (C[a * 4 + 3] !== 1 || U[a * 2] > 0.5 || U[a * 2 + 1] > 0.5) continue; let x = 0, z = 0; for (const v of [I[t], I[t + 1], I[t + 2], I[t + 5]]) { x += A[v * 3] / 4; z += A[v * 3 + 2] / 4; } add('repair patch', x, z, 0.4); } }
  const nearI = (x, z) => { let b = 0, bd = 1e18; for (let k = 0; k < Tr.N; k++) { const d = (x - Tr.px[k]) ** 2 + (z - Tr.pz[k]) ** 2; if (d < bd) { bd = d; b = k; } } return b; };
  for (const c of tg) { const q = Tr.query(c.x, c.z, nearI(c.x, c.z), {}); Object.assign(c, { s: q.s, d: q.d, i: q.i }); }
  const wAt = (i) => (Tr.wa ? Tr.wa[i] : Tr.w), wrap = (s) => ((s % Tr.len) + Tr.len) % Tr.len;
  const straight = (s0, s1) => { for (let s = s0; s <= s1; s += Tr.ds) if (Math.abs(Tr.k[Tr.idx(wrap(s))]) > 1 / 250) return false; return true; };
  const roadY = (s, d) => (Tr.hasElev ? Tr.elevAt(wrap(s)).y : 0) + (Tr.bank ? Tr.bankAt(wrap(s), d, { dy: 0, sl: 0 }).dy : 0);
  const at = (s, d) => { const f = wrap(s) / Tr.ds, i0 = Math.floor(f) % Tr.N, i1 = (i0 + 1) % Tr.N, t = f - Math.floor(f), L = (a) => a[i0] + (a[i1] - a[i0]) * t; return [L(Tr.px) + L(Tr.nx) * d, L(Tr.pz) + L(Tr.nz) * d]; };
  const lay = (s0, s1, d) => { const pos = sk.geometry.attributes.position.array, col = sk.geometry.attributes.color.array; let n = 0;   // (as Skids.add: 0.4 m wide, at the road's height + 0.03)
    for (let s = s0; s < s1 - 0.01; s += 1) { const e = Math.min(s1, s + 1), a = at(s, d), b = at(e, d), dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = -dz / l * 0.2, nz = dx / l * 0.2, ya = roadY(s, d) + 0.03, yb = roadY(e, d) + 0.03;
      pos.set([a[0] - nx, ya, a[1] - nz, a[0] + nx, ya, a[1] + nz, b[0] - nx, yb, b[1] - nz, b[0] + nx, yb, b[1] + nz], n * 12); for (let k = 0; k < 4; k++) col.set([0.035, 0.035, 0.04, 0.8], n * 16 + k * 4); n++; }
    sk.geometry.setDrawRange(0, n * 6); for (const k of ['position', 'color']) { sk.geometry.attributes[k].updateRange.count = -1; sk.geometry.attributes[k].needsUpdate = true; } };
  const shoot = (sCar, dCar) => { const iC = Tr.idx(wrap(sCar)), [px, pz] = at(sCar, dCar);
    for (const o of g.race.cars) if (o !== P) { const j = Tr.idx(wrap(sCar + 400)); o.place(Tr.px[j], Tr.pz[j], Tr.hd[j]); o.q = Tr.query(o.x, o.z, j, o.q); }
    P.place(px, pz, Tr.hd[iC]); P.q = Tr.query(P.x, P.z, iC, P.q); P.y = P.roadY = roadY(sCar, dCar); P.speed = 0; P.vx = P.vz = 0;
    Render.resetCam(); for (let k = 0; k < 20; k++) Render.frame(1 / 60, 1, P, 'chase', {});
    const A = Render.snapshot(P, 'chase', 1); sk.visible = false; const B = Render.snapshot(P, 'chase', 1); sk.visible = true;   // (the same frame: snapshot draws with dt 0)
    return { w: A.width, h: A.height, a: A.getContext('2d').getImageData(0, 0, A.width, A.height).data, b: B.getContext('2d').getImageData(0, 0, B.width, B.height).data }; };
  const px = (pts, w, h) => { const cam = Render.camera, S = new Set(); for (const [x, y, z] of pts) { const p = new V(x, y, z).project(cam); if (p.z > 1) continue;
    const X = Math.floor((p.x + 1) / 2 * w), Y = Math.floor((1 - p.y) / 2 * h); if (X >= 0 && X < w && Y >= 0 && Y < h) S.add(Y * w + X); } return [...S]; };
  const diff = (sh, P2) => { let s = 0, on = 0; for (const q of P2) { const d = (Math.abs(sh.a[q * 4] - sh.b[q * 4]) + Math.abs(sh.a[q * 4 + 1] - sh.b[q * 4 + 1]) + Math.abs(sh.a[q * 4 + 2] - sh.b[q * 4 + 2])) / 3; s += d; if (d >= 2) on++; }
    return { n: P2.length, mean: P2.length ? +(s / P2.length).toFixed(1) : 0, seen: P2.length ? +(on / P2.length).toFixed(2) : 0 }; };
  const inside = (C) => { const a = []; for (let u = -C.R + 0.07; u <= C.R - 0.07; u += 0.01) for (let v = -0.12; v <= 0.12; v += 0.03) { if (C.kind === 'manhole' && Math.hypot(u, v) > C.R - 0.07) continue; const [x, z] = at(C.s + u, C.d + v); a.push([x, roadY(C.s + u, C.d + v) + 0.03, z]); } return a; };
  const kinds = [...new Set(tg.map(c => c.kind))];
  for (const q of ['high', 'normal']) {
    Render.applySettings({ quality: q });
    for (const kind of kinds) for (const dist of dists) {
      const ok = tg.filter(c => c.kind === kind && Math.abs(c.d) < wAt(c.i) - (kind === 'grate' ? 0.2 : 0.8) && (!Tr.open || (c.s > Tr.startS + dist && c.s < Tr.len - 40)) && straight(c.s - dist - 8, c.s + 8));
      const C = ok[Math.floor(ok.length / 2)]; if (!C) { out.shots.push({ q, kind, dist, none: true }); continue; }
      lay(C.s - 6, C.s + 6, C.d); const sh = shoot(C.s - dist, C.d), r = diff(sh, px(inside(C), sh.w, sh.h));
      out.shots.push({ q, kind, dist, lap: +wrap(C.s - (Tr.startS || 0)).toFixed(1), d: +C.d.toFixed(2), ...r });
    }
    // guards: the mark under the car's body is hidden by the car (laid along the car, from its rear axle to its nose); a mark across a kerb is hidden under the kerb
    { const C = tg.find(c => straight(c.s - 40, c.s + 10) && Math.abs(c.d) < wAt(c.i) - 1.5); if (C) { const s0 = C.s - 20;
      lay(s0 - 0.6, s0 + 1.4, C.d); const sh = shoot(s0, C.d), pts = []; for (let u = -0.5; u <= 1.3; u += 0.02) for (let v = -0.15; v <= 0.15; v += 0.05) { const [x, z] = at(s0 + u, C.d + v); pts.push([x, roadY(s0 + u, C.d + v) + 0.03, z]); }
      out.guards.push({ q, what: 'under the car', ...diff(sh, px(pts, sh.w, sh.h)) }); } }
  }
  Render.applySettings({ quality: 'high' });
  return out;
};
try {
  for (const [orient, vp, dists] of [['on its side', { width: 640, height: 360 }, [10, 35]], ['upright', { width: 360, height: 640 }, [10, 35, 70]]]) {
    const set = { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.1, weather: 'dry', tod: 'day', season: 'summer' }; if (orient === 'upright') set.camTilt = 2;
    const s = await openGame(browser, srv.base + '/index.html', set, vp, { seed: 4242 });
    for (const id of ['harju', 'longford']) {
      await startTrack(s.page, id);
      const r = await s.page.evaluate(MEASURE, dists);
      console.log(JSON.stringify({ id, orient, ...r }));
      if (orient === 'on its side') {
        const o = r.order, cv = o.covers.concat(o.patches), want = id === 'harju' ? { covers: 0.75, patches: null } : { covers: null, patches: 0.4 };
        T.check(`${id}: the road's decals in order (patches 0.4 < wear 0.5 < covers 0.75 < baked marks 1 < live marks 2), covers/patches transparent, no depth write, still depth-tested`,
          o.skids === 2 && o.wear.length === 1 && o.wear[0] === 0.5 && o.baked.every(v => v === 1) && cv.length === 1 && cv.every(c => c.tr && !c.dw && c.dt !== false && c.po)
          && (want.covers == null ? !o.covers.length : o.covers[0].ro === want.covers) && (want.patches == null ? !o.patches.length : o.patches[0].ro === want.patches), JSON.stringify(o));
      }
      const KINDS = { harju: ['manhole', 'grate', 'repair patch'], longford: ['tar patch', 'repair patch'] }[id], got = [...new Set(r.shots.map(sh => sh.kind))];
      T.check(`${id} ${orient}: every kind of target found (${KINDS.join(', ')})`, KINDS.every(k => got.includes(k)), got.join(', '));
      for (const sh of r.shots) { if (sh.none) { T.check(`${id} ${orient} ${sh.q}: a ${sh.kind} ${sh.dist} m ahead`, sh.kind === 'grate' && sh.dist > 35, 'no straight approach'); continue; }
        T.check(`${id} ${orient} ${sh.q}: the mark is seen on the ${sh.kind} ${sh.dist} m ahead (lap ${sh.lap} m, ${sh.d} m across)`, sh.n >= 2 && sh.seen >= 0.8, `${sh.n} px, ${(sh.seen * 100).toFixed(0)} % changed, mean ${sh.mean}`); }
      for (const gd of r.guards) T.check(`${id} ${orient} ${gd.q}: the mark ${gd.what} stays hidden`, gd.n >= 20 && gd.mean < 1, `${gd.n} px, mean ${gd.mean}`);
    }
    T.check(`no page errors (${orient})`, !s.errors.length, s.errors.slice(0, 3).join(' | '));
    await s.ctx.close();
  }
} finally { await browser.close(); await srv.close(); }
T.done();
