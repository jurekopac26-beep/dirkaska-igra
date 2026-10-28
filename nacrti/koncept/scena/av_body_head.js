// ==== AV: ROUND AV, SIX VERSIONS OF AMA'S CHEST TOP (car-painted models with their own liveries and kit colours, the red push button for
//      the service, GT PACK gone (its place empty), RACE locked under a glass dome, the tapped model lit on its own silhouette; lift design k
//      from agent LF's patch in version k). The stores: concepts/_e_store2_av1.js .. av6.js (a snapshot of AMA's _e_store2_am2.js + LF's
//      lift patch + my AV block, scratchpad/av/av_block.js, by scratchpad/av/insert.py). Built: sh scratchpad/av/build.sh <k>; rendered: sh
//      render_av.sh <k> <frames> [DPR] (harness_av.mjs). The machinery is agent S6A's as O3B, PDA, PNB, PZA and AMA copied it, unchanged ====
// the trolleys of proposal 1 (its store section: t1Trolley, t1Park, t1ParkLines), parked out of sight; nothing if that section has none
const vTrolleys = (W) => { const out = {}; try { if (typeof T1K === 'undefined' || typeof t1Trolley !== 'function' || typeof t1Park !== 'function') return out; Object.keys(T1K).forEach(k => { out[k] = t1Trolley(k, W, { pose: t1Park(k) }); }); if (typeof t1ParkLines === 'function') t1ParkLines(W); } catch (e) { console.error('VTROLLEYS ' + e.message); } return out; };
const vScene = () => { document.querySelectorAll('.hq-comp').forEach(e => e.remove()); useCar(window.AVCARID || 'muscle'); const { S, st, W } = ZBASE({}); const trs = vTrolleys(W); zCredits(11500); zMasts(); HOMEC(); return { S, st, W, trs }; };
const vVisible = (o) => { let q = o; while (q) { if (!q.visible) return false; q = q.parent; } return true; };
const hqQuality = (pr) => { const R = G3.renderer, sg = document.getElementById('g-stage').getBoundingClientRect(); G3.resize(sg.width, sg.height, pr); hqSamples();
  const A = R.capabilities.getMaxAnisotropy(), seen = new Set(); let n = 0;
  const up = (t) => { if (!t || !t.isTexture || seen.has(t)) return; seen.add(t); const im = t.image;
    if (!im || !(im instanceof HTMLCanvasElement || im instanceof HTMLImageElement || (typeof ImageBitmap !== 'undefined' && im instanceof ImageBitmap))) return;
    if (!t.generateMipmaps || t.minFilter === T.LinearFilter || t.minFilter === T.NearestFilter) return; if (t.anisotropy < A) { t.anisotropy = A; t.needsUpdate = true; n++; } };
  G3.scene.traverse(o => { const ms = o.material ? [].concat(o.material) : []; ms.forEach(m => { if (!m) return; for (const k of Object.keys(m)) { const v = m[k]; if (v && v.isTexture) up(v); }
    if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u && u.value && u.value.isTexture) up(u.value); }); });
  const sz = R.getDrawingBufferSize(new T.Vector2()), P = D.post; return { pr: R.getPixelRatio(), buf: [sz.x, sz.y], samples: P.rt && P.rt.samples, aniso: A, texAniso: n }; };
const hqSamples = () => { const R = G3.renderer, P = D.post, s = Math.min(4, R.capabilities.maxSamples); if (P.rt && P.rt.isWebGLMultisampleRenderTarget && P.rt.samples !== s) { P.rt.samples = s; P.rt.dispose(); } };
const hqGrab = () => { const gl = G3.renderer.domElement, c = document.createElement('canvas'); c.width = gl.width; c.height = gl.height; const g = c.getContext('2d'); g.drawImage(gl, 0, 0); return g.getImageData(0, 0, c.width, c.height); };
// the plain picture of a part Z ([x, y, w, h] CSS px) of the frame rendered again at DPR zpr: the same frozen camera with a view offset (the
// vignette as over the whole frame), as concepts/_hq_body.js hqZoom renders it; returns a canvas
const vZoomPlain = (Z, zpr, pr) => { const cam = G3.camera, sg = document.getElementById('g-stage').getBoundingClientRect(), FW = sg.width, FH = sg.height, [zx, zy, zw, zh] = Z;
  const pos = cam.position.clone(), quat = cam.quaternion.clone(), fov = cam.fov, aspect = FW / FH, comp = D.post && D.post.comp; let vo = null, t0 = performance.now();
  if (comp && comp.uniforms) { if (!comp.uniforms.uHqVo) { const fs = comp.fragmentShader, s0 = 'vec2 q = vUv - 0.5;'; if (fs.split(s0).length === 2 && fs.includes('void main(){')) {
      comp.fragmentShader = fs.replace('void main(){', 'uniform vec4 uHqVo;\nvoid main(){').replace(s0, 'vec2 q = uHqVo.xy + vUv * uHqVo.zw - 0.5;'); comp.uniforms.uHqVo = { value: new T.Vector4(0, 0, 1, 1) }; comp.needsUpdate = true; } }
    vo = comp.uniforms.uHqVo || null; }
  if (vo) vo.value.set(zx / FW, 1 - (zy + zh) / FH, zw / FW, zh / FH);
  cam.updateProjectionMatrix = function () { this.aspect = aspect; this.fov = fov; T.PerspectiveCamera.prototype.updateProjectionMatrix.call(this); };
  cam.lookAt = function () { this.position.copy(pos); this.quaternion.copy(quat); };
  cam.setViewOffset(FW, FH, zx, zy, zw, zh); G3.resize(zw, zh, zpr); hqSamples();
  __garage.advance(0);
  const N = hqGrab(), cv = document.createElement('canvas'); cv.width = N.width; cv.height = N.height; cv.getContext('2d').putImageData(N, 0, 0);
  delete cam.updateProjectionMatrix; delete cam.lookAt; cam.clearViewOffset(); cam.aspect = aspect; cam.updateProjectionMatrix(); if (vo) vo.value.set(0, 0, 1, 1);
  G3.resize(FW, FH, pr); hqSamples(); __garage.advance(0);
  console.log(`HQ zoom plain ${Z.join(',')} at DPR ${zpr}: ${cv.width}x${cv.height} (${((performance.now() - t0) / 1000).toFixed(1)} s, vignette ${vo ? 'as over the whole frame' : 'NOT patched'})`); return cv; };
// (the lift's colour: the user's new wish, ORANGE, in every picture; my store copies have WLIFTV 'O' by default too)
const wScene = (v) => { if (typeof avGhostOff === 'function') avGhostOff(); if (typeof WLIFTV !== 'undefined') WLIFTV = v;   // (AV: a kit's preview from an earlier frame off)
  RG.BG = 1; RG.PB = 3; RG.GM = 1; RG.WL = null; PBL.on = true; const r = vScene(); if (typeof avO === 'function' && avO('AVSV') === 'C') { avAim(G3.scene); avSrvCentre(); } return r; };   // (AV final: the chosen signs turned to the first-view camera, the SERVICE label centred)   // (PDA: agent GM's regal as GM's pictures had it: BG 1, PB 3, GM 1 (the light-blue slotted back, two tyre sets gone), PB's orange lift)
const xF = (v, n = 3) => +(+v).toFixed(n);
const xFoot = (o, pts = []) => { o.updateMatrixWorld(true); o.traverse(m => { if (!m.isMesh || !vVisible(m) || !m.geometry) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox;
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = V(x, y, z).applyMatrix4(m.matrixWorld); pts.push([p.x, p.y, p.z]); } }); return pts; };
const xPolyD = (p, poly) => { let d = 1e9; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex * ex + ez * ez;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / L2)), dx = p[0] - a[0] - t * ex, dz = p[1] - a[1] - t * ez; d = Math.min(d, Math.hypot(dx, dz)); }
  let pos = true, neg = true; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); if (c < 0) pos = false; if (c > 0) neg = false; }
  return pos || neg ? -d : d; };
const xTrolleyPolys = () => { const out = []; if (typeof T1K === 'undefined') return out; const W = winPolysP();
  Object.keys(T1K).forEach(key => { const lay = t1Lay(key, W), e = 0.08, rect = (c, h, e) => { const co = Math.cos(h), s = Math.sin(h); return [[lay.x0 - e, lay.z0 - e], [lay.x1 + e, lay.z0 - e], [lay.x1 + e, lay.z1 + e], [lay.x0 - e, lay.z1 + e]].map(([x, z]) => [c.x + x * co + z * s, c.z - x * s + z * co]); };
    const P = t1Park(key); out.push({ key, what: 'parking', poly: rect(V(P.x, 0, P.z), P.h, e) });
    t1Route(key, 0.08).forEach((q, i) => out.push({ key, what: 'route', i, poly: rect(q.c, q.h, 0) })); }); return out; };
const xClear = (pts, polys) => { let best = { d: 1e9 }; for (const q of polys) for (const p of pts) { const d = xPolyD([p[0], p[2]], q.poly); if (d < best.d) best = { d: xF(d), key: q.key, what: q.what, i: q.i, at: [xF(p[0], 2), xF(p[2], 2)] }; } return best; };
const xHull = (P) => { const p = P.map(q => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1)); };
// round W's cabinets on the floor (their hull with the drawers out: XC's XHULL): today's footprint
const XOLD = {"L":[[0.335,5.212],[1.214,5.074],[1.351,5.72],[1.37,6.053],[1.352,6.066],[1.304,6.091],[1.182,6.117],[0.996,6.151],[0.872,6.17],[0.819,6.164],[0.797,6.158],[0.402,5.869]],"R":[[1.495,4.995],[2.554,4.526],[2.869,5.105],[2.7,5.572],[2.685,5.588],[2.594,5.646],[2.448,5.713],[2.148,5.837],[1.998,5.892],[1.892,5.916],[1.87,5.914],[1.714,5.618]]};
const xProjBox = (objs) => { const r = G3.renderer.domElement.getBoundingClientRect(), v = V(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, behind = false;
  objs.forEach(o => o && o.traverse(m => { if (!m.isMesh || !vVisible(m) || !m.geometry || !m.geometry.attributes.position) return; const mat = Array.isArray(m.material) ? m.material[0] : m.material; if (mat && mat.blending === T.AdditiveBlending) return;
    const A = m.geometry.attributes.position; for (let i = 0; i < A.count; i++) { v.fromBufferAttribute(A, i).applyMatrix4(m.matrixWorld).project(G3.camera); if (v.z > 1) behind = true;
      const x = r.left + (v.x + 1) / 2 * r.width, y = r.top + (1 - v.y) / 2 * r.height; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
  return { box: [xF(x0, 1), xF(y0, 1), xF(x1, 1), xF(y1, 1)], inside: !behind && x0 >= r.left && y0 >= r.top && x1 <= r.left + r.width && y1 <= r.top + r.height, margin: xF(Math.min(x0 - r.left, y0 - r.top, r.left + r.width - x1, r.top + r.height - y1), 1) }; };
// the showcase's groups of option 6 (st.mali.xc) or of round W (its drawers: the aero model's four pieces, the underglow drawer's two strips,
// the indicators' and the decals' boards) (XC's)
const xGroups = (S, st) => { const MA = st.mali;
  if (MA.xc) return MA.xc.groups.map(g => ({ key: g.key, name: g.name, cab: g.cab, items: g.items.map(it => ({ nm: it.nm, objs: [it.g], part: it.part ? [it.part] : [it.g] })), box: g.box, label: g.label }));
  const D = {}; (MA.drawers || []).forEach(d => { D[d.key] = d; }); const out = [], boards = (d, L) => d && d.item ? d.item.children.filter(c => c.isGroup).map((b, k) => ({ nm: L[k] ? L[k][1] : 'tabla ' + k, objs: [b], part: b.children.filter(c => c.isGroup || (c.isMesh && c.geometry.type === 'PlaneGeometry')) })) : [];
  if (D.aero && st.aeroDr) out.push({ key: 'aero', name: 'AERO KITS', cab: 'L', items: st.aeroDr.pieces.map(p => ({ nm: AERO_NM[p.i], objs: [p.g], part: p.g.children.filter(c => c !== p.label) })), box: D.aero.dg });
  if (D.neon && D.neon.item) { const it = D.neon.item, a = [], b = []; it.updateMatrixWorld(true); it.traverse(m => { if (!m.isMesh && !m.isSprite) return; const q = it.worldToLocal(m.getWorldPosition(V())); (q.z > 0 ? a : b).push(m); });
    out.push({ key: 'ug', name: 'UNDERGLOW', cab: 'L', items: [{ nm: 'trak 1 (svetlo moder)', objs: a, part: a }, { nm: 'trak 2 (vijoličen)', objs: b, part: b }], box: D.neon.dg }); }
  if (D.sigShow) out.push({ key: 'sig', name: 'INDICATORS', cab: 'R', items: boards(D.sigShow, VSIGS), box: D.sigShow.dg });
  if (D.decalShow) out.push({ key: 'decal', name: 'DECALS', cab: 'R', items: boards(D.decalShow, VDECALS), box: D.decalShow.dg });
  return out; };
// ==== S6A: my own parts ====
// the menu's Slovenian name of a showcase item by its group and English plate (also for option 6 and round W)
const S6SL = { 'UNDERGLOW|BLUE': 'Luč pod avtom – Modra', 'UNDERGLOW|TURQUOISE': 'Luč pod avtom – Turkizna', 'UNDERGLOW|PURPLE': 'Luč pod avtom – Vijolična', 'UNDERGLOW|RED': 'Luč pod avtom – Rdeča', 'UNDERGLOW|GREEN': 'Luč pod avtom – Zelena',
  'UNDERGLOW|trak 1 (svetlo moder)': 'Luč pod avtom – trak 1 (svetlo moder)', 'UNDERGLOW|trak 2 (vijoličen)': 'Luč pod avtom – trak 2 (vijoličen)',
  'INDICATORS|CLEAR': 'Žmigavci – Prozorni', 'INDICATORS|SMOKED': 'Žmigavci – Dimljeni', 'INDICATORS|SEQUENTIAL': 'Žmigavci – Tekoči',
  'AERO KITS|STREET': 'Aero paket – Cestni', 'AERO KITS|SPORT': 'Aero paket – Športni', 'AERO KITS|RACE': 'Aero paket – Dirkalni', 'AERO KITS|GT PACK': 'Aero paket – Paket GT',
  'DECALS|FLAMES': 'Nalepke – Plameni', 'DECALS|CHEQUERED': 'Nalepke – Šahovnica', 'DECALS|STAR': 'Nalepke – Zvezda', 'COLOURED NUTS|COLOURED NUTS': 'Barvne matice' };
// the tops' parts of option 6 / round W in frontRegal's order (st.mali.parts: 8 headlamps (a pair a kind), 4 tail lamps, 4 discs (a pair a
// kind), 5 grilles, 4 calipers): the elements as the menu names them
const S6OLDTOP = [['Žarometi – LED', 'HEADLAMPS', 'L', [0, 1]], ['Žarometi – Rumeni', 'HEADLAMPS', 'L', [2, 3]], ['Žarometi – Dimljeni', 'HEADLAMPS', 'L', [4, 5]], ['Žarometi – Bi-LED', 'HEADLAMPS', 'L', [6, 7]],
  ['Zadnje luči – Dimljene', 'TAIL LAMPS', 'L', [8]], ['Zadnje luči – Prozorne', 'TAIL LAMPS', 'L', [9]], ['Zadnje luči – Okrogle', 'TAIL LAMPS', 'L', [10]], ['Zadnje luči – LED-trak', 'TAIL LAMPS', 'L', [11]],
  ['Zavore – Dirkalni diski', 'BRAKE DISCS', 'R', [12, 13]], ['Zavore – Keramične', 'BRAKE DISCS', 'R', [14, 15]],
  ['Maska – Satasta', 'GRILLES', 'R', [16]], ['Maska – Mrežasta', 'GRILLES', 'R', [17]], ['Maska – Kromirana', 'GRILLES', 'R', [18]], ['Maska – Karbonska', 'GRILLES', 'R', [19]], ['Maska – V barvi avta', 'GRILLES', 'R', [20]],
  ['Čeljusti – Rdeče', 'CALIPERS', 'R', [21]], ['Čeljusti – Rumene', 'CALIPERS', 'R', [22]], ['Čeljusti – Zlate', 'CALIPERS', 'R', [23]], ['Čeljusti – V barvi avta', 'CALIPERS', 'R', [24]]];
// every element the player can tap in the cabinets (and the gift): { name (the menu's Slovenian), en, grp, cab, place, objs }
const s6Els = (S, st) => { const MA = st.mali;
  if (MA.s6) return MA.s6.els.map(e => ({ name: e.nm, en: e.en || '', grp: e.grp, cab: e.cab, place: e.place, objs: e.objs || [e.g], e }));   // (O3B: an element's own list e.objs when it has one: the gift with its bay)
  const out = []; xGroups(S, st).forEach(g => g.items.forEach(it => out.push({ name: S6SL[g.name + '|' + it.nm] || g.name + ' ' + it.nm, en: it.nm, grp: g.name, cab: g.cab, place: 'front', objs: it.objs })));
  const P = MA.parts || []; console.error('S6 old top parts: ' + P.length + ' ' + JSON.stringify(P.slice(0, 25).map(g => g.position.toArray().map(v => xF(v, 2)))));
  S6OLDTOP.forEach(([nm, grp, cab, ix]) => out.push({ name: nm, en: '', grp, cab, place: 'top', objs: ix.map(i => P[i]).filter(Boolean) }));
  if (S.gift) out.push({ name: 'Dnevno darilo', en: '', grp: 'GIFT', cab: '-', place: 'gift', objs: [S.gift] });
  return out; };
// the colour pools (each: its torus, disc and ring)
const s6Pools = () => { const P = {}; G3.scene.traverse(m => { if (!m.isMesh || !vVisible(m) || !m.geometry) return; const b = new T.Box3().setFromObject(m), s = b.getSize(V()), c = b.getCenter(V());
  if (b.max.y < 0.06 && s.x < 0.7 && s.z < 0.7 && s.x > 0.15 && c.z > 2 && c.z < 4.5 && Math.abs(c.x) < 3.5 && /Torus|Circle|Ring/.test(m.geometry.type)) { const k = c.x.toFixed(1) + ',' + c.z.toFixed(1); (P[k] = P[k] || []).push(m); } });
  return Object.entries(P).filter(([k, ms]) => ms.some(m => m.geometry.type === 'TorusGeometry')).map(([k, ms]) => ({ name: 'bazen ' + k, objs: ms })); };
// THE MEASURE: an ID pass (the store's ztPass: each item a flat colour, everything else black and hiding; see-through, additive, sprites
// out), then each item alone. Per item: its visible pixels, their box, the largest rectangle wholly on it (its tap rectangle), the largest
// square (does a 40×40 / 30×30 target fit?), the share of its own outline that shows, what covers it, the middle of its tap rectangle
// the store's ID pass (ztPass) for more than 31 items: item k's colour carries k + 1 in red (its low 5 bits) and blue (its high bits)
const s6Pass = (only, items, own) => { const R = G3.renderer, sc = G3.scene, cam = G3.camera, sz = R.getDrawingBufferSize(new T.Vector2()), w = sz.x, h = sz.y;
  const saved = [], BLK = new T.MeshBasicMaterial({ color: 0x000000, fog: false, side: T.DoubleSide }); BLK.toneMapped = false;
  const IDM = items.map((_, k) => { const m = new T.MeshBasicMaterial({ color: new T.Color(((k + 1) % 32) * 8 / 255, 1, Math.floor((k + 1) / 32) * 8 / 255), fog: false, side: T.DoubleSide }); m.toneMapped = false; return m; });
  sc.traverse(o => { if (!(o.isMesh || o.isSprite || o.isLine || o.isPoints)) return; saved.push([o, o.material, o.visible]); if (!o.visible) return;
    const k = own.get(o), mats = Array.isArray(o.material) ? o.material : [o.material], m0 = mats[0];
    if (o.isSprite || o.isLine || o.isPoints || !m0 || m0.visible === false || m0.colorWrite === false || (m0.transparent && m0.opacity < 0.5 && k == null) || m0.depthTest === false || (m0.blending && m0.blending !== T.NormalBlending)) { o.visible = false; return; }
    if (only != null && k !== only) { o.visible = false; return; }
    const M = k != null ? IDM[k] : BLK; o.material = Array.isArray(o.material) ? o.material.map(() => M) : M; });
  const rt = new T.WebGLRenderTarget(w, h), oc = R.getClearColor(new T.Color()), oa = R.getClearAlpha(), ost = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false;
  R.setRenderTarget(rt); R.setClearColor(0x000000, 1); R.clear(); R.render(sc, cam); const px = new Uint8Array(w * h * 4); R.readRenderTargetPixels(rt, 0, 0, w, h, px); R.setRenderTarget(null); R.setClearColor(oc, oa); R.shadowMap.autoUpdate = ost; rt.dispose();
  saved.forEach(([o, m, v]) => { o.material = m; o.visible = v; });
  const id = new Int16Array(w * h).fill(-1); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((h - 1 - y) * w + x) * 4; if (px[i + 1] > 200) { const k = Math.round(px[i] / 8) + 32 * Math.round(px[i + 2] / 8) - 1; if (k >= 0 && k < items.length) id[y * w + x] = k; } }
  // (PNB: a pixel of no element whose four neighbours are all one element is a crack between two of that element's triangles in this flat
  //  pass (the camera's ray there hits the element: frame 9 'pick' showed it), not a hole the player sees: it gets that element's id; only such
  //  single pixels, nothing else changes)
  let nf = 0; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (id[i] >= 0) continue; const k = id[i - 1]; if (k >= 0 && id[i + 1] === k && id[i - w] === k && id[i + w] === k) { id[i] = k; nf++; } }
  if (nf) console.error('PNFILL ' + nf);
  return { id, w, h }; };
const s6Measure = (items) => { G3.scene.updateMatrixWorld(true); const own = new Map(); items.forEach((it, k) => it.objs.forEach(o => o && o.traverse(m => { if (m.isMesh) own.set(m, k); })));
  const all = s6Pass(null, items, own), w = all.w, h = all.h, cv = G3.renderer.domElement.getBoundingClientRect(), s = cv.width / w, out = []; window.PNALL = all;   // (PNB: kept for a debug picture)
  items.forEach((it, k) => { const solo = s6Pass(k, items, own); let n = 0, ns = 0, bx0 = w, by0 = h, bx1 = -1, by1 = -1; const cover = {};
    for (let i = 0; i < w * h; i++) { if (solo.id[i] === k) { ns++; if (all.id[i] !== k && all.id[i] >= 0) cover[items[all.id[i]].name] = (cover[items[all.id[i]].name] || 0) + 1; }
      if (all.id[i] === k) { n++; const x = i % w, y = (i - x) / w; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; } }
    const r = n ? ztMaxRect((x, y) => all.id[y * w + x] === k, bx0, by0, bx1, by1) : { w: 0, h: 0, x: 0, y: 0 };
    let sq = 0, sqx = 0, sqy = 0; if (n) { const W2 = bx1 - bx0 + 1, prev = new Int32Array(W2), cur = new Int32Array(W2); for (let y = by0; y <= by1; y++) { for (let x = bx0; x <= bx1; x++) { const j = x - bx0;
        cur[j] = all.id[y * w + x] === k ? 1 + Math.min(j ? cur[j - 1] : 0, prev[j], j ? prev[j - 1] : 0) : 0; if (cur[j] > sq) { sq = cur[j]; sqx = x - sq + 1; sqy = y - sq + 1; } } prev.set(cur); } }
    const f = (v) => xF(v * s, 1);
    out.push({ name: it.name, px: xF(n * s * s, 0), own: xF(ns * s * s, 0), share: ns ? Math.round(100 * n / ns) : 0, box: n ? [f(bx0), f(by0), f(bx1 - bx0 + 1), f(by1 - by0 + 1)] : null,
      tap: [f(r.w), f(r.h)], sq: f(sq), at: [xF(cv.left + (r.x + r.w / 2) * s, 1), xF(cv.top + (r.y + r.h / 2) * s, 1)], cover: Object.fromEntries(Object.entries(cover).map(([a, b]) => [a, xF(b * s * s, 0)])) }); });
  return { out, all }; };
const s6Stats = (M) => { const sq = M.map(q => q.sq).sort((a, b) => a - b), ar = M.map(q => q.tap[0] * q.tap[1]).sort((a, b) => a - b), mn = M.map(q => Math.min(...q.tap)).sort((a, b) => a - b), med = (a) => a.length ? (a.length % 2 ? a[a.length >> 1] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2) : 0;
  return { n: M.length, minSquare: sq[0], medianSquare: med(sq), minRectSide: mn[0], medianRectSide: med(mn), minRectArea: ar[0], medianRectArea: med(ar), fit40: M.filter(q => q.sq >= 40).length, fit30: M.filter(q => q.sq >= 30).length,
    rect40: M.filter(q => q.tap[0] >= 40 && q.tap[1] >= 40).length, rect30: M.filter(q => q.tap[0] >= 30 && q.tap[1] >= 30).length }; };
// the phone's load: the cabinets' visible meshes (their bodies, tops, what is on and in them) and their triangles / vertices; the whole
// frame's draw calls and triangles (shadows, the floor's mirror, the post passes)
const s6Load = (S, st) => { const cm = new Set(), add = (o) => o && o.traverse(q => { if (q.isMesh && vVisible(q)) cm.add(q); });
  if (st.mali.s6) add(st.mali.s6.F); else { (S.left || []).concat(S.right || []).forEach(m => add(m.g)); (st.mali.frames || []).forEach(add); (st.mali.parts || []).forEach(add); }
  let tri = 0, vert = 0; cm.forEach(o => { const g = o.geometry; tri += g.index ? g.index.count / 3 : g.attributes.position.count / 3; vert += g.attributes.position.count; });
  const RI = G3.renderer.info; RI.autoReset = false; RI.reset(); PR.render(); const calls = RI.render.calls, tris = RI.render.triangles; RI.autoReset = true;
  const by = {}; if (st.mali.s6) { const inEl = new Set(); st.mali.s6.els.forEach(e => { if (e.place === 'gift') return; let n = 0, v = 0; e.g.traverse(q => { if (q.isMesh && vVisible(q)) { n++; v += q.geometry.attributes.position.count; inEl.add(q); } }); const k = e.grp; by[k] = by[k] || { meshes: 0, verts: 0 }; by[k].meshes += n; by[k].verts += v; });
    let n = 0, v = 0; cm.forEach(q => { if (!inEl.has(q)) { n++; v += q.geometry.attributes.position.count; } }); by['omari (telo, police, steklo, napisi)'] = { meshes: n, verts: v }; }
  return { cabMeshes: cm.size, cabTris: Math.round(tri), cabVerts: vert, frameCalls: calls, frameTris: tris, by }; };
// the footprint: the cabinets' floor hull, how far beyond round W's (XOLD), the least distance to the trolleys' parking outlines and routes
const s6Foot = (S, st) => { const polys = xTrolleyPolys(), foot = {};
  ['L', 'R'].forEach(c => { const pts = []; if (st.mali.s6) { xFoot(st.mali.s6.cabs[c], pts); st.mali.s6.els.filter(e => e.cab === c).forEach(e => xFoot(e.g, pts)); } else (c === 'L' ? S.left : S.right).forEach(m => xFoot(m.g, pts));
    const H = xHull(pts.map(p => [p[0], p[2]])), old = XOLD[c]; let out = 0, at = null; pts.forEach(p => { const d = xPolyD([p[0], p[2]], old); if (d > out) { out = d; at = [xF(p[0], 2), xF(p[2], 2)]; } });
    const area = (P) => Math.abs(P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
    foot[c] = { hull: H.map(q => [xF(q[0]), xF(q[1])]), area: xF(area(H), 2), areaOld: xF(area(old), 2), outsideOld: xF(out), at, trolleys: xClear(pts, polys) }; });
  if (S.gift) { const g = S.gift.position; foot.gift = [xF(g.x), xF(g.z)]; } return foot; };
// THE FIRST VIEW'S MEASURE: every element, the pools; the summary; the load; the footprint. One S6MEASJ json line, a readable S6MEAS block
const s6MeasureAll = (S, st, tag) => { const els = s6Els(S, st), pools = s6Pools(), items = els.concat(pools), { out } = s6Measure(items), M = out.slice(0, els.length), MP = out.slice(els.length);
  const E = els.map((e, k) => Object.assign({ grp: e.grp, cab: e.cab, place: e.place, en: e.en }, M[k], { proj: xProjBox(e.objs) }));
  const stat = s6Stats(E), statNoGift = s6Stats(E.filter(q => q.place !== 'gift')), load = s6Load(S, st), foot = s6Foot(S, st), cv = G3.renderer.domElement.getBoundingClientRect();
  console.error(`S6MEAS ${tag} (canvas ${cv.left},${cv.top} ${cv.width}×${cv.height})\n` + E.map(q => `  ${q.place.padEnd(5)} ${q.cab} ${q.name.padEnd(30)} vidno ${q.box ? q.box[2] + '×' + q.box[3] : '-'} pravokotnik ${q.tap[0]}×${q.tap[1]} kvadrat ${q.sq} ${q.px} px ${q.share} % ${Object.keys(q.cover).length ? 'zakriva ' + JSON.stringify(q.cover) : ''} obris ${JSON.stringify(q.proj.box)} ${q.proj.inside ? '' : 'ODREZAN'} rob ${q.proj.margin}`).join('\n')
    + '\n  POVZETEK ' + JSON.stringify(stat) + '\n  BREZ DARILA ' + JSON.stringify(statNoGift) + '\n  BAZENI ' + MP.map(q => `${q.name} ${q.share}% ${JSON.stringify(q.cover)}`).join('; ') + '\n  LOAD ' + JSON.stringify(load) + '\n  TLORIS ' + JSON.stringify(foot));
  console.error('S6MEASJ ' + JSON.stringify({ tag, canvas: [cv.left, cv.top, cv.width, cv.height], els: E, stat, statNoGift, pools: MP, load, foot, layout: st.mali.s6 ? s6LayoutJ(st.mali.s6.L) : null }));
  return { E, els }; };
const s6LayoutJ = (L) => JSON.parse(JSON.stringify(L, (k, v) => typeof v === 'number' ? xF(v, 4) : v));
// ---- THE TAP's MARK (the project's): the element light turquoise (ztTurq: its plates and prints keep their pictures), a yellow rim round
//      what the player sees of it (its tap area: drawn from the ID pass on a layer right over the 3D picture), the white ring in the middle
//      of its tap rectangle, its name on a flag, the menu's card at the top ----
const s6Rims = (items, sel, dpr) => { const own = new Map(); items.forEach((it, k) => it.objs.forEach(o => o && o.traverse(m => { if (m.isMesh) own.set(m, k); })));
  G3.scene.updateMatrixWorld(true); const all = s6Pass(null, items, own), w = all.w, h = all.h, id = all.id, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), im = g.createImageData(w, h), D8 = im.data, t = Math.max(2, Math.round(1.7 * dpr)), ti = Math.max(1, Math.round(0.9 * dpr)), S = new Set(sel);
  const put = (i) => { D8[i * 4] = 255; D8[i * 4 + 1] = 214; D8[i * 4 + 2] = 51; D8[i * 4 + 3] = 255; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x, k = id[i]; if (k < 0 || !S.has(k)) continue;
    let edge = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h || id[yy * w + xx] !== k) { edge = true; break; } }
    if (!edge) continue;
    for (let dy = -t; dy <= t; dy++) for (let dx = -t; dx <= t; dx++) { if (dx * dx + dy * dy > t * t + 0.5) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx;
      if (id[j] < 0) put(j); else if (id[j] === k && dx * dx + dy * dy <= ti * ti + 0.5) put(j); } }
  g.putImageData(im, 0, 0); const r = G3.renderer.domElement.getBoundingClientRect();
  cv.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:59;pointer-events:none`; cv.className = 'qov'; document.body.appendChild(cv); return cv; };
const s6Card = (id, tab, sel, top = 112) => { const P = Object.assign({}, MPART(id), { tabSel: tab, selName: sel }); return div(`left:50%;top:${top}px;transform:translateX(-50%);width:300px;background:#fff;border-radius:14px;padding:10px 12px;z-index:64;box-shadow:0 6px 18px rgba(0,0,0,.45);font-weight:800;color:#0d1626`, cardHTML(P)); };
