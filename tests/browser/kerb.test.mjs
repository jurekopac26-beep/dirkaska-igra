// Toskana's kerb and the gravel shoulder under it (road edge):
//  - the kerb's outer edge (the red, towards the lawn) is worn, not a ruler-straight line: a gentle wave of 2-45 cm (three octaves of seeded noise, no stretch
//    of 6 m that stays within a few cm), fading softly (vertex alpha, 0.45 m) into the lawn or the gravel, and the ends of each run thin out (alpha) instead of ending in a straight cut; all in the one kerb mesh (no extra draw call, 2 quads
//    across and a metre apart: 15 thousand vertices), the inner edge flush with the asphalt (no gap), the edge the same on every build (seeded noise, not
//    Math.random), and the other tracks' kerbs untouched (still a single opaque 3-colour mesh without alpha; their fingerprints are in browser/world.test.mjs);
//  - the gravel shoulder (a second transparent mesh) is drawn first and never written to the depth buffer, so the kerb's cream and red are never overpainted
//    by it, whatever the depth precision (the post target of the default quality 'high' has a 16-bit depth buffer: a polygon offset on the shoulder used to
//    pull it over the kerb 50 m and more from the camera): checked in the pictures themselves, the same frame with the shoulder hidden and shown, in both
//    cameras that count (iso 640 x 360, chase 360 x 640 with the tilt 30 %); and it is not built where it would lie under the kerb (vertices).
//  - where no kerb covers it, the shoulder's dirt reaches onto the asphalt softly and unevenly (alpha 0 at 6-36 cm inside the road's edge, solid
//    from the edge on, 4 mm above the asphalt so that it shows at any depth precision), one more quad across (+~10 thousand vertices);
//  - the white edge line (where there is no kerb) is worn and a little wavy: the same one quad per 2 m step and side as before (no new vertex, no new
//    draw call), its paint in a 64 x 1024 alpha tile (transparent, no depth write, drawn under the tyre marks), the tile's edges clear (no quad
//    outline), the same on every build; the other circuits keep their plain opaque line.
//   node tests/browser/kerb.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Toskana kerb: worn outer edge, gravel shoulder under it');
const srv = await serve();
const browser = await launch();
// measured in the page: the kerb mesh's vertices as (lateral offset from the centre line, alpha), the meshes and their material flags, hashes of the positions
const MEASURE = () => {
  const Tr = window.__game.race.track, w = Tr.w, cw = Tr.curbW, N = Tr.N, W = Render.world;
  const kerbs = []; let meshes = 0, verts = 0;
  W.root.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; meshes++; verts += o.geometry.attributes.position.count;
    const m = o.material, img = m && m.map && m.map.image; if (img && img.width === 32 && img.height === 64 && m.vertexColors) kerbs.push(o); });
  const kerb = W.root.getObjectByName('kerb'), strip = W.root.getObjectByName('shoulder');
  const fnv = (pos) => { let h = 2166136261; for (let i = 0; i < pos.length; i++) { h ^= Math.round(pos[i] * 1e4) | 0; h = Math.imul(h, 16777619) >>> 0; } return h; };
  const out = { meshes, verts, kerbMeshes: kerbs.length, named: !!kerb && kerbs[0] === kerb, strip: !!strip };
  if (strip) Object.assign(out, { stripVerts: strip.geometry.attributes.position.count, stripRO: strip.renderOrder, stripDW: strip.material.depthWrite, stripPO: strip.material.polygonOffset, stripTr: strip.material.transparent, stripHash: fnv(strip.geometry.attributes.position.array) });
  const el = W.root.getObjectByName('edgeline'), tm = W.root.getObjectByName('tyremarks');
  if (el) { const im = el.material.map && el.material.map.image, d = im && im.data; let edgeA = 0, mean = 0, wrap = 0;
    if (d) { for (let r = 0; r < im.height; r++) { edgeA = Math.max(edgeA, d[(r * im.width) * 4 + 3], d[(r * im.width + im.width - 1) * 4 + 3]); for (let x = 0; x < im.width; x++) mean += d[(r * im.width + x) * 4 + 3]; }
      mean /= im.width * im.height * 255; for (let x = 0; x < im.width; x++) wrap = Math.max(wrap, Math.abs(d[x * 4 + 3] - d[((im.height - 1) * im.width + x) * 4 + 3])); }
    Object.assign(out, { el: { verts: el.geometry.attributes.position.count, tr: el.material.transparent, dw: el.material.depthWrite, ro: el.renderOrder, tw: im && im.width, th: im && im.height, edgeA, mean, wrap, hash: fnv(el.geometry.attributes.position.array) }, tmRO: tm ? tm.renderOrder : null }); }
  if (strip) { const sp = strip.geometry.attributes.position.array, sc = strip.geometry.attributes.color.array; let onA = 0, minOff = 9, solidMin = 9, onY = 9;
    for (let i = 0; i < sp.length / 3; i += 1) { const x = sp[i * 3], z = sp[i * 3 + 2]; let b = 0, bd = 1e18; for (let k = 0; k < N; k += 1) { const dd = (x - Tr.px[k]) ** 2 + (z - Tr.pz[k]) ** 2; if (dd < bd) { bd = dd; b = k; } }
      if (Math.abs(Tr.k[b]) > 1 / 60 || Math.abs((x - Tr.px[b]) * Tr.tx[b] + (z - Tr.pz[b]) * Tr.tz[b]) > 0.4) continue; const off = Math.abs((x - Tr.px[b]) * Tr.nx[b] + (z - Tr.pz[b]) * Tr.nz[b]), a = sc[i * 4 + 3];   // (only right beside a sample: between two, on a curve, the measure is off by a few cm)
      if (off < w - 0.03) { onA = Math.max(onA, a); minOff = Math.min(minOff, off); onY = Math.min(onY, sp[i * 3 + 1]); } else if (a > 0.99) solidMin = Math.min(solidMin, off); }
    Object.assign(out, { stripOnAsphaltAlpha: onA, stripMinOff: minOff, stripSolidMin: solidMin, stripOnY: onY }); }
  if (!kerb || kerbs.length !== 1) return out;
  const g = kerb.geometry, pos = g.attributes.position.array, col = g.attributes.color, n = col.count;
  Object.assign(out, { itemSize: col.itemSize, transparent: kerb.material.transparent, kerbDW: kerb.material.depthWrite, kerbRO: kerb.renderOrder, verts1: n, hash: fnv(pos) });
  if (col.itemSize !== 4) return out;
  const near = (x, z) => { let b = 0, bd = 1e18; for (let k = 0; k < N; k++) { const d = (x - Tr.px[k]) ** 2 + (z - Tr.pz[k]) ** 2; if (d < bd) { bd = d; b = k; } } return b; };
  const edge = [], fade = [], inner = []; let maxOff = 0, bad = 0, ends = 0;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], z = pos[i * 3 + 2], a = col.array[i * 4 + 3], b = near(x, z);
    const lat = (x - Tr.px[b]) * Tr.nx[b] + (z - Tr.pz[b]) * Tr.nz[b], off = Math.abs(lat), s = b + ((x - Tr.px[b]) * Tr.tx[b] + (z - Tr.pz[b]) * Tr.tz[b]) / Tr.ds;
    if (!(a >= 0 && a <= 1)) bad++;
    maxOff = Math.max(maxOff, off);
    if (Math.abs(Tr.k[b]) > 1 / 60) continue;   // (only where the road is gentle: the nearest-sample measure is exact to a centimetre there)
    if (off < w + 0.03) { inner.push(off); if (a < 0.01) ends++; } else if (a > 0.99 && off > w + 0.8) edge.push([Math.sign(lat), s, w + cw - off]); else if (a < 0.01 && off > w + cw - 0.015) fade.push(off - (w + cw));   // (the fade: transparent and past the old edge; the vertices at the very end of a run, which thin out, are not it)
  }
  const mm = (a) => [Math.min(...a), Math.max(...a)];
  Object.assign(out, { ends, w, cw, edgeN: edge.length, wear: mm(edge.map(e => e[2])), fadeN: fade.length, fade: mm(fade), inner: mm(inner), maxOff, bad });
  // a wave and not a saw, and never straight: along each run (the edge vertices of one side sorted by position, one value per station, cut where the
  // gap is over 1.4 m) neighbours 1 m apart differ by a few cm, and every 6 m has a peak-to-peak of at least a few cm
  let jump = 0, runs = 0, windows = 0, flat = 0, minPP = 9;
  for (const side of [-1, 1]) {
    const a = edge.filter(e => e[0] === side).map(e => [e[1], e[2]]).sort((p, q) => p[0] - q[0]), st = [];
    for (const [s, v] of a) { const l = st[st.length - 1]; if (l && Math.abs(l.s - s) < 0.1) l.v.push(v); else st.push({ s, v: [v] }); }
    const pts = st.map(o => [o.s * Tr.ds, o.v.reduce((p, q) => p + q, 0) / o.v.length]);
    let run = []; const all = [];
    for (let k = 0; k < pts.length; k++) { if (k && pts[k][0] - pts[k - 1][0] > 1.4) { all.push(run); run = []; } run.push(pts[k]); } if (run.length) all.push(run);
    for (const r of all) { runs++;
      for (let k = 1; k < r.length; k++) jump = Math.max(jump, Math.abs(r[k][1] - r[k - 1][1]));
      for (let c = 0; c < r.length; c++) { let lo = 9, hi = -9, c2 = c; while (c2 < r.length && r[c2][0] - r[c][0] <= 6.01) { lo = Math.min(lo, r[c2][1]); hi = Math.max(hi, r[c2][1]); c2++; }
        if (r[c2 - 1][0] - r[c][0] < 5.4) continue; windows++; minPP = Math.min(minPP, hi - lo); if (hi - lo < 0.025) flat++; } }
  }
  Object.assign(out, { jump, runs, windows, flat, minPP });
  return out;
};
// the same frame with the shoulder mesh hidden and shown: the kerb's cream band (the first 13/32 of 1.5 m = 0.61 m; projected through the game's own camera, along
// the steps of a kerb that are neither the first nor the last of their run, which thin out on purpose) must come out the same
const CREAM = ([d, lat, mode, maxSide]) => {
  const g = window.__game, Tr = g.race.track, P = g.race.player, N = Tr.N, w = Tr.w; g.pause();
  const s = ((Tr.startS + d) % Tr.len + Tr.len) % Tr.len, i = Tr.idx(s), off = lat === null ? Tr.rl[i] : lat;
  for (const c of g.race.cars) if (c !== P) { const j = Tr.idx(s + 600 + 30 * c.grid); c.place(Tr.px[j], Tr.pz[j], Tr.hd[j]); c.q = Tr.query(c.x, c.z, j, c.q); }
  const hd = Tr.hd[i]; P.place(Tr.px[i] + Tr.nx[i] * off, Tr.pz[i] + Tr.nz[i] * off, hd); P.q = Tr.query(P.x, P.z, i, P.q); P.roadY = P.y; P.speed = 30; P.vx = Math.cos(hd) * 30; P.vz = Math.sin(hd) * 30;
  Render.resetCam(); for (let k = 0; k < 60; k++) Render.frame(1 / 60, 1, P, mode, {});
  const strip = Render.world.root.getObjectByName('shoulder');
  const A = Render.snapshot(P, mode, maxSide); strip.visible = false; const B = Render.snapshot(P, mode, maxSide); strip.visible = true;
  const cam = Render.camera, W2 = A.width, H = A.height, ca = A.getContext('2d').getImageData(0, 0, W2, H).data, cb = B.getContext('2d').getImageData(0, 0, W2, H).data;
  const on = (a, side) => { const b = (a + 1) % N; return !!(Tr.curb[a] && Tr.curb[b]) && !(side * Tr.k[a] < 0 && Math.abs(Tr.k[a]) < 0.035); };
  const seen = new Set(); let n = 0, sum = 0, big = 0, steps = 0;
  const V = Render.camera.position.constructor;
  for (const side of [-1, 1]) for (let k = -40; k <= 70; k++) {
    const a = ((i + k) % N + N) % N, b = (a + 1) % N;
    if (!on(a, side) || !on((a + N - 1) % N, side) || !on(b, side)) continue;
    steps++;
    for (let t = 0; t < 1; t += 0.125) for (let o = w + 0.12; o <= w + 0.5; o += 0.04) {
      const x = Tr.px[a] * (1 - t) + Tr.px[b] * t + (Tr.nx[a] * (1 - t) + Tr.nx[b] * t) * side * o, z = Tr.pz[a] * (1 - t) + Tr.pz[b] * t + (Tr.nz[a] * (1 - t) + Tr.nz[b] * t) * side * o;
      const p = new V(x, 0.05, z).project(cam); if (p.z > 1) continue;
      const px = Math.floor((p.x + 1) / 2 * W2), py = Math.floor((1 - p.y) / 2 * H); if (px < 0 || px >= W2 || py < 0 || py >= H) continue;
      const q = py * W2 + px; if (seen.has(q)) continue; seen.add(q);
      const dd = (Math.abs(ca[q * 4] - cb[q * 4]) + Math.abs(ca[q * 4 + 1] - cb[q * 4 + 1]) + Math.abs(ca[q * 4 + 2] - cb[q * 4 + 2])) / 3; n++; sum += dd; if (dd > 12) big++;
    }
  }
  return { d, steps, px: n, mean: n ? sum / n : 0, big: n ? big / n : 0 };
};
try {
  // iso, 640 x 360, Blizu (zoom 1.1), the default quality 'high'
  const iso = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'iso', zoom: 1.1, weather: 'dry', tod: 'day', season: 'summer' }, { width: 640, height: 360 }, { seed: 4242 });
  await startTrack(iso.page, 'toskana');
  const a = await iso.page.evaluate(MEASURE);
  T.check('one kerb mesh (one draw call), named kerb', a.kerbMeshes === 1 && a.named, `${a.kerbMeshes} kerb mesh(es)`);
  T.check('the kerb has vertex alpha (the soft fade) and a transparent material', a.itemSize === 4 && a.transparent === true, `itemSize ${a.itemSize}, transparent ${a.transparent}`);
  T.check('the kerb itself stays small: 2 quads across, a metre apart (15 thousand vertices)', a.verts1 > 0 && a.verts1 < 16000, `${a.verts1} vertices`);
  T.check('alpha always between 0 and 1', a.bad === 0, `${a.bad} out of range`);
  T.check('the outer edge is worn back by 2-45 cm, measured to 1.5 cm (never wider than the kerb), and really uses that range', a.edgeN > 100 && a.wear[0] >= -0.015 && a.wear[1] <= 0.465 && a.wear[1] - a.wear[0] >= 0.35,
    `${a.edgeN} edge vertices, worn ${a.wear.map(v => v.toFixed(3)).join(' - ')} m`);
  T.check('the edge is a gentle wave: neighbours 1 m apart differ by under 30 cm', a.runs > 10 && a.jump < 0.3, `${a.runs} runs, largest step ${(a.jump * 100).toFixed(1)} cm`);
  T.check('never ruler-straight: no 6 m of the edge stays within 2.5 cm (the build keeps it above 4 cm, the measure is good to a centimetre)', a.windows > 200 && a.flat === 0, `${a.windows} windows of 6 m, ${a.flat} flat, the smallest peak-to-peak ${(a.minPP * 100).toFixed(1)} cm`);
  T.check('the fade is 0.45 m: the transparent vertices lie at most 0.45 m past the old edge', a.fadeN > 100 && a.fade[1] <= 0.455 && a.fade[0] >= -0.02, `${a.fadeN} vertices at ${a.fade.map(v => v.toFixed(3)).join(' - ')} m past it (road half width ${a.w}, kerb ${a.cw})`);
  T.check('every run of kerb thins out at its ends (the inner vertices there are transparent) instead of ending in a straight cut', a.ends >= 20, `${a.ends} transparent inner vertices at the ends of the runs on the gentle parts`);
  T.check('the inner edge is flush with the asphalt (no gap)', a.inner[0] >= a.w - 0.04 && a.inner[1] <= a.w + 0.04, `${a.inner.map(v => v.toFixed(3)).join(' - ')} m`);
  T.check('nothing beyond the old kerb plus the fade', a.maxOff <= a.w + a.cw + 0.47, `${a.maxOff.toFixed(3)} m`);
  T.check('the gravel shoulder is drawn first and never written to the depth buffer: renderOrder below the kerb, depthWrite off, transparent, still a polygon offset against the lawn',
    a.strip && a.stripRO < a.kerbRO && a.stripDW === false && a.stripTr === true && a.stripPO === true && a.kerbDW === true, `strip renderOrder ${a.stripRO}, depthWrite ${a.stripDW}; kerb renderOrder ${a.kerbRO}, depthWrite ${a.kerbDW}`);
  T.check('the shoulder is not built under the kerb (it was 52 thousand vertices, 30 thousand, 40 thousand with the soft start on the asphalt)', a.strip && a.stripVerts > 5000 && a.stripVerts < 44000, `${a.stripVerts} vertices`);
  T.check('where no kerb covers it the dirt starts on the asphalt, transparent there (alpha 0 inside the road\'s edge), 6-36 cm in, and is solid only from the edge on',
    a.stripMinOff >= a.w - 0.37 && a.stripMinOff <= a.w - 0.05 && a.stripOnAsphaltAlpha < 0.01 && a.stripSolidMin >= a.w - 0.01 && a.stripOnY >= 0.022, `above the asphalt (0.02) at ${a.stripOnY.toFixed(3)} m; starts ${(a.w - a.stripMinOff).toFixed(3)} m inside the edge, alpha there ${a.stripOnAsphaltAlpha}, solid from ${(a.stripSolidMin - a.w).toFixed(3)} m outside it`);
  T.check('the white edge line: one mesh named edgeline, transparent, no depth write, drawn under the tyre marks', !!a.el && a.el.tr === true && a.el.dw === false && a.tmRO !== null && a.el.ro < a.tmRO, JSON.stringify(a.el) + ' tyremarks ' + a.tmRO);
  T.check('the line costs no new vertex: one quad (6 vertices) per 2 m step and side, as before (4926)', !!a.el && a.el.verts === 4926, `${a.el && a.el.verts} vertices`);
  T.check('its paint tile: 64 x 1024, clear at the quad\'s long edges (no outline), closing on itself along (no seam: the last row and the first differ no more than neighbouring rows do, the speckle aside), worn (on average a part of the quad painted, never empty)',
    !!a.el && a.el.tw === 64 && a.el.th === 1024 && a.el.edgeA === 0 && a.el.wrap <= 80 && a.el.mean > 0.15 && a.el.mean < 0.5, a.el && `edge alpha ${a.el.edgeA}, wrap ${a.el.wrap}, mean cover ${a.el.mean.toFixed(3)}`);
  // the pictures: the cream band the same with and without the shoulder (before the fix 35 grey levels of 255 off on average, nine tenths of the pixels)
  for (const [d, lat] of [[1097, null], [316, null], [425, 5.2]]) {
    const c = await iso.page.evaluate(CREAM, [d, lat, 'iso', 960]);
    T.check(`iso, ${d} m: the kerb's cream band is not overpainted by the shoulder`, c.px > 300 && c.mean < 1.5 && c.big < 0.03, `${c.steps} steps, ${c.px} pixels, mean difference ${c.mean.toFixed(2)}, ${(c.big * 100).toFixed(1)} % of them differ by more than 12`);
  }
  T.check('no page errors (iso)', !iso.errors.length, iso.errors.slice(0, 5).join(' | '));
  await iso.ctx.close();

  // chase, 360 x 640, Blizu, the tilt 30 % (the setting camTilt 2): the kerbs 30-100 m ahead, where the depth buffer is coarsest
  const ch = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.1, camTilt: 2, weather: 'dry', tod: 'day', season: 'summer' }, { width: 360, height: 640 }, { seed: 4242 });
  await ch.page.evaluate(() => { const f = World.build; window.__built = []; World.build = function (...args) { window.__built.push(args[1] && args[1].def && args[1].def.id); return f.apply(this, args); }; });   // (which worlds are really built)
  await startTrack(ch.page, 'toskana');
  const a2 = await ch.page.evaluate(MEASURE);
  // the same on every build: the track again (another track in between, so that the world is really built a second time), Math.random changed
  await ch.page.evaluate(() => { Math.random = () => 0.987654; });
  await startTrack(ch.page, 'jezero');
  await startTrack(ch.page, 'toskana');
  const b = await ch.page.evaluate(MEASURE), built = await ch.page.evaluate(() => window.__built);
  T.check('the world is really built a second time (the second start of the track is not skipped)', built.filter(id => id === 'toskana').length === 2, built.join(', '));
  T.check('the same edge on a second build (positions identical, Math.random not used)', b.hash === a2.hash && b.verts1 === a2.verts1 && b.stripHash === a2.stripHash && b.stripVerts === a2.stripVerts && b.hash === a.hash && !!b.el && b.el.hash === a.el.hash && b.el.mean === a.el.mean, `kerb ${a.hash} / ${a2.hash} / ${b.hash}, shoulder ${a2.stripHash} / ${b.stripHash}`);
  // another track with kerbs keeps its plain opaque kerb (no alpha, not transparent)
  await startTrack(ch.page, 'grom');
  const c = await ch.page.evaluate(() => { const W = Render.world; let k = null; W.root.traverse(o => { if (o.isMesh && o.material && o.material.map && o.material.map.image && o.material.vertexColors && o.geometry.attributes.uv && !k) { const t = o.material.map.image; if (t.width === 32 && t.height === 64) k = o; } });
    return k ? { itemSize: k.geometry.attributes.color.itemSize, transparent: k.material.transparent, name: k.name } : null; });
  const gl = await ch.page.evaluate(() => { const W = Render.world; return { named: !!W.root.getObjectByName('edgeline') }; });
  T.check('another circuit: no worn edge line (its plain line as before)', gl.named === false, JSON.stringify(gl));
  T.check('another circuit: its kerb is unchanged (opaque, no alpha)', c === null || (c.itemSize === 3 && c.transparent === false && c.name === ''), JSON.stringify(c));
  await startTrack(ch.page, 'toskana');
  for (const [d, lat] of [[455, 5.4], [316, null]]) {
    const c2 = await ch.page.evaluate(CREAM, [d, lat, 'chase', 960]);
    T.check(`chase 30 %, ${d} m: the kerb's cream band is not overpainted by the shoulder`, c2.px > 300 && c2.mean < 1.5 && c2.big < 0.03, `${c2.steps} steps, ${c2.px} pixels, mean difference ${c2.mean.toFixed(2)}, ${(c2.big * 100).toFixed(1)} % of them differ by more than 12`);
  }
  T.check('no page errors (chase)', !ch.errors.length, ch.errors.slice(0, 5).join(' | '));
} finally { await browser.close(); await srv.close(); }
T.done();
