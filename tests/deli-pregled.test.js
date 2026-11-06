// The garage's parts on KOLIBRI, sklop 4 (docs/deli.md, »Sklop 4 · pregled«): every one of its 608 options (38 elements with a mount,
// 16 each) built in Visoki and looked at as a solid would be (tests/lib/deli-geo.js):
//  - nothing floats: every group of an option's islands touches the car (its shell, its inner block: within 6 mm, or crossing it) or lies
//    on it as a layer (every corner within 13 mm of it); the body's calipers (celjusti) are behind the wheels' faces instead (below);
//    the tyre smoke's band (dim_gum) may lie on a rear tyre's inner wall instead (open wheels: no arch round it)
//  - nothing through the body: a visible part at most 10 cm into the shell (where it is fixed: a pipe into the floor, a lamp into its
//    housing); the hidden parts under the bonnet (filter_zraka, cip, turbo, akumulator) wholly inside it (six rays from every corner; the one down may meet the floor in the inner block)
//  - the glass: only the roof spoilers (krilo), the mirrors and the rear window's louvres meet the windows (on them: the glass is opaque)
//  - the tyres: no visible part's corner in a tyre's room (the front ones steered +-0.66 rad, all sprung +-3 cm)
//  - breaking: each part's triangles in the stock part ids that break off or stay (the wing in 'spoiler', the lamps in headL and headR,
//    the bonnet's in 'hood', the aerial's in 'aerial' ...), a hidden part's in the inner block only
//  - two parts at once (K.fitted: a part makes room for another): every pair of options of two elements that cross each other by more
//    than 2 cm over the stock shell when each is built alone, fitted together: within 2 cm (the exhaust and the tow eye through the
//    diffuser: within 3 cm, cut-outs; one under the car as fitted, its shell above and nothing below, doesn't show: an open tail)
//  - the wheels as drawn (kitWheelGeo's helper captured at DELI.build): on every rim (stock and 1-16) every brake kit's caliper (zavore)
//    behind the face's spokes, every nut's top (matice) clear of the face; none behind a steel wheel or a cover; the body's calipers
//    (celjusti) behind the spokes, none behind a steel wheel, none beside a brake kit (its caliper in their colour)
//  - all at once: every element's heaviest option on one car builds (no fallback, all 38 on it): its shell within stock + 6000 triangles
//    (Visoki + 8000: what an intact car draws), its inner block (drawn once panels come off) + 300 for each hidden part
//  - nothing warned (no part fell back)
// Another vehicle with mounts (the same measures and accepted cases; the part ids for breaking KOLIBRI's and those its mounts name: krilo.part,
// zarometi.hosts, zadnje_luci.hosts and bar.part, aero's partF / partR, zmigavci's, a part: / parts: of its own; docs/avti-kolibri.md):
//   node tests/deli-pregled.test.js [vehicle id]
'use strict';
const { loadCore } = require('./lib/core.js');
const L = require('./lib/deli-geo.js');

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const t0 = Date.now();
const VID = process.argv[2] || 'kolibri', C = loadCore(), X = L.loadRender(C), R = X.Render, D = X.DELI, KO = C.MODELS.find(m => m.id === VID), MO = KO.def.mounts;
const warns = [], warn = console.warn; console.warn = (m) => warns.push(String(m));
const HID = ['filter_zraka', 'cip', 'turbo', 'akumulator', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum'], BAY = ['filter_zraka', 'cip', 'turbo', 'akumulator'];
const EPS = 0.006, LAYER = 0.013, DEEP = 0.1, DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const GLASS_OK = ['krilo', 'ogledala', 'zaluzije'];
// the stock part ids each element's triangles may be in ('body': the shell that stays; must: every option has some in each of these)
const PARTS = { krilo: ['spoiler'], zarometi: ['headL', 'headR', 'body'], aero: ['bumperF', 'bumperR', 'body'], hauba: ['hood'], maska: ['body', 'bumperF'],
  zmigavci: ['body', 'bumperF', 'bumperR', 'mirrorL', 'mirrorR'], relijske_luci: ['bumperF', 'body'], zadnje_luci: ['tailL', 'tailR', 'trunk'], auspuh: ['body'],
  prtljaznik: ['trunk'], vlecne_kljuke: ['bumperF', 'bumperR'], lovilci_blata: ['body'], streha: ['body'], stresna_zajemalka: ['body'], antena: ['aerial'],
  zaluzije: ['trunk'], ogledala: ['mirrorL', 'mirrorR', 'doorL', 'doorR'], vrata: ['doorL', 'doorR'], soncni_pas: ['body'], zamasek: ['body'], celjusti: ['body'] };
const MUST = { krilo: ['spoiler'], zarometi: ['headL', 'headR'], hauba: ['hood'], zadnje_luci: ['tailL', 'tailR'], prtljaznik: ['trunk'], antena: ['aerial'],
  ogledala: ['mirrorL', 'mirrorR'], vrata: ['doorL', 'doorR'] };
const PAINT = ['crte', 'nalepke'];   // (over the whole shell: any part, as the paint under them)
// on another vehicle: must is the mount's own (its part for krilo, hauba, prtljaznik, antena; its hosts; its parts for ogledala, vrata) in
// place of KOLIBRI's (the parts it may be in: below, from the car's mounts)
const mustOf = (id) => { const m = MO[id] || {}, own = [].concat(m.hosts || [], ['krilo', 'hauba', 'prtljaznik', 'antena'].includes(id) && m.part ? [m.part] : [], ['ogledala', 'vrata'].includes(id) && m.parts ? m.parts : []);
  return own.length ? own : (MUST[id] || []); };

// ---- 1. every option alone ----
const I0 = R.kitInfo(VID), HW = I0.body.hw, RW = KO.rw, TW = 0.185;   // (the tyre's room: its radius, 18.5 cm wide)
// (another car: KOLIBRI's parts it has none of in their places: the spoiler's the wing's (mounts.krilo.part), an aerial's the body; and
// every part an element's mount names (part, partF, partR, host, hosts, parts: where the car calls K.deli, its lamps, flaps ...))
{ const sub = (q) => q === 'spoiler' && MO.krilo && MO.krilo.part ? MO.krilo.part : q in I0.ranges ? q : 'body';
  const named = (v, out) => { if (Array.isArray(v)) v.forEach(x => named(x, out)); else if (v && typeof v === 'object') for (const k in v) {
    if (/^(part|partF|partR|host|hosts|parts)$/.test(k)) [].concat(v[k]).forEach(q => { if (typeof q === 'string') out.push(q); }); else named(v[k], out); } return out; };
  for (const T of [PARTS, MUST]) for (const id in T) T[id] = [...new Set(T[id].map(sub))];
  for (const id in PARTS) if (MO[id]) PARTS[id] = [...new Set(PARTS[id].concat(named(MO[id], [])))]; }
const hubs = [[KO.a, HW, true], [KO.a, -HW, true], [-KO.b, HW, false], [-KO.b, -HW, false]];
// (a rear tyre's inner wall: within its radius, from its face to 12 mm + a layer inboard; its width the look's, wR the rear's)
const LW = (KO.def.look && KO.def.look.wheels) || {}, TWR = LW.wR || LW.w || Math.min(0.42, Math.max(0.12, 0.68 * RW));
const onWall = (p) => [-1, 1].some(sd => { const dz = sd * p[2] - (HW - TWR / 2); return Math.hypot(p[0] + KO.b, p[1] - RW) <= RW + EPS && dz >= -0.012 - LAYER && dz <= 0.003; });
const inTyre = (p) => { let best = 0; for (const [hx, hz, front] of hubs) for (const a of front ? [-0.66, -0.44, -0.22, 0, 0.22, 0.44, 0.66] : [0]) for (const dy of [-0.03, 0, 0.03]) {
  const dx = p[0] - hx, dz = p[2] - hz, lx = dx * Math.cos(a) - dz * Math.sin(a), lz = dx * Math.sin(a) + dz * Math.cos(a), q = Math.hypot(lx, p[1] - RW - dy);
  if (Math.abs(lz) <= TW / 2 && q <= RW && RW - q > best) best = RW - q; } return best; };
const ELS = Object.keys(MO).filter(id => D.has(id)), alone = {}, fails = [], floats = [], deep = [], bay = [], glass = [], tyres = [], parts = [], none = [];
const mm = (v) => (v * 1000).toFixed(0) + ' mm';
for (const id of ELS) { alone[id] = [];
  for (let k = 1; k <= 16; k++) {
    const O = L.optionGeo(R, VID, { [id]: k }, id, true), tag = id + k;
    if (O.status !== 'ok') { fails.push(tag + ' ' + O.status); continue; }
    if (!O.part.length) { none.push(tag); continue; }
    const P = new Float32Array(O.part.length * 9); O.part.forEach((t, i) => P.set(O.P.subarray(t * 9, t * 9 + 9), i * 9));
    const own = O.part.map((_, i) => i); alone[id][k] = { P, tris: own, box: L.boxOf(L.corners(P, own)) };
    // breaking: the stock part ids its triangles are in
    const rg = O.U.ranges, inPart = {};
    for (const t of O.part) { const v = t * 3; let nm = t >= O.outerN ? '(inner)' : 'BODY';
      if (t < O.outerN) for (const q in rg) { const r = rg[q]; if ((v >= r.o[0] && v < r.o[1]) || (v >= r.i[0] && v < r.i[1])) { nm = q; break; } }
      inPart[nm] = (inPart[nm] || 0) + 1; }
    const names = Object.keys(inPart), want = HID.includes(id) ? ['(inner)'] : PARTS[id];
    if (!PAINT.includes(id) && (!want || names.some(q => !want.includes(q)) || mustOf(id).some(q => !inPart[q]))) parts.push(tag + ' ' + names.map(q => q + ':' + inPart[q]).join(' '));
    if (id === 'celjusti') continue;   // (the body's calipers: in the wheels, behind their faces: 4. below)
    const G = L.Grid(O.P, O.rest), GA = L.Grid(O.P, O.rest.concat(O.inner)), GG = L.Grid(O.P, O.glass), isl = L.islands(O.P, O.part);
    // floating: groups of touching islands, none of them touching the car or lying on it
    const IG = isl.map(a => L.Grid(O.P, a)), par = isl.map((_, i) => i), find = (a) => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; };
    const bx = isl.map(a => L.boxOf(L.corners(O.P, a))), ov = (a, b) => [0, 1, 2].every(j => a[0][j] <= b[1][j] + EPS && b[0][j] <= a[1][j] + EPS);
    for (let i = 0; i < isl.length; i++) for (let j = i + 1; j < isl.length; j++)
      if (find(i) !== find(j) && ov(bx[i], bx[j]) && (L.touches(O.P, isl[i], IG[j], EPS) || L.touches(O.P, isl[j], IG[i], EPS))) par[find(i)] = find(j);
    const grp = new Map(); isl.forEach((a, i) => { const r = find(i); if (!grp.has(r)) grp.set(r, []); grp.get(r).push(i); });
    const on = isl.map(a => Math.max(...L.corners(O.P, a).map(p => GA.dist(p, 0.05).d)) <= LAYER || L.touches(O.P, a, GA, EPS) || (id === 'dim_gum' && L.corners(O.P, a).every(onWall)));
    for (const mem of grp.values()) if (!mem.some(i => on[i])) { const tris = [].concat(...mem.map(i => isl[i])), b = L.boxOf(L.corners(O.P, tris));
      floats.push(`${tag} (${tris.length} triangles ${mm(L.gap(O.P, tris, GA, 0.3))} off, at ${b[0].map((v, j) => ((v + b[1][j]) / 2).toFixed(2)).join(',')})`); }
    // its corners: how deep inside the shell (all six rays hit it), outside it (the bonnet's hidden parts), in a tyre's room
    const seen = new Set(); let dIn = 0, dOut = 0, ty = 0;
    for (const p of L.corners(O.P, O.part)) { const key = p.map(v => Math.round(v * 2e4)).join(); if (seen.has(key)) continue; seen.add(key);
      const enc = DIRS.every(d => G.ray(p, d, 4) < Infinity), d = G.dist(p, 0.5).d;
      // (the bay's hidden parts are drawn with the inner block: inside the shell with it, a car whose floor pan is in it (LEV R, ZMAJ 85 ...)
      // or whose bay has no lining (LEV S: its floor, the engine))
      const encB = enc || (BAY.includes(id) && DIRS.every(q => GA.ray(p, q, 4) < Infinity));
      if (enc && d > dIn) dIn = d; if (!encB && d > dOut) dOut = d; if (!HID.includes(id)) ty = Math.max(ty, inTyre(p)); }
    if (!HID.includes(id) && dIn > DEEP) deep.push(tag + ' ' + mm(dIn));
    if (BAY.includes(id) && dOut > 0) bay.push(tag + ' ' + mm(dOut) + ' out');
    if (ty > 0) tyres.push(tag + ' ' + mm(ty));
    // its edges through the windows
    if (!GLASS_OK.includes(id)) { let gx = 0; for (const t of O.part) { const o = t * 9, V = [0, 1, 2].map(v => [O.P[o + v * 3], O.P[o + v * 3 + 1], O.P[o + v * 3 + 2]]);
      for (let e = 0; e < 3; e++) { const p = V[e], q = V[(e + 1) % 3], [lo, hi] = L.boxOf([p, q]);
        for (const u of GG.near(lo, hi)) { const T = GG.tri(u), s = L.segTri(p, q, T[0], T[1], T[2]); if (s > 1e-6 && s < 1 - 1e-6) { gx++; break; } } } }
      if (gx) glass.push(tag + ' ' + gx + ' edges'); }
  } }
const built = ELS.length * 16 - fails.length;
check(`every option builds on ${VID.toUpperCase()} in Visoki (${ELS.length} elements with a mount x 16)`, !fails.length && (VID !== 'kolibri' || ELS.length === 38), fails.slice(0, 4).join(', ') || built + ' options');
check('drawn in the body where they show (the wheels\' parts and the looks: on the wheels, in the paint, the glass, the light under the car)',
  none.every(t => /^(platisca|zavore|matice|gume|barva|zatemnitev|luc_pod_avtom)\d+$/.test(t)) && !none.some(t => /^(krilo|zarometi|hauba)\d/.test(t)), none.filter(t => !/^(platisca|zavore|matice|gume|barva|zatemnitev|luc_pod_avtom)\d+$/.test(t)).slice(0, 4).join(', ') || none.length + ' not in the body');
check('nothing floats: every option touches the car or lies on it as a layer (13 mm)', !floats.length, floats.slice(0, 3).join(' | ') || 'none');
check('nothing through the body: a visible part at most 10 cm into the shell (where it is fixed)', !deep.length, deep.slice(0, 4).join(', ') || 'none');
check('the hidden parts under the bonnet wholly inside the shell (filter_zraka, cip, turbo, akumulator)', !bay.length, bay.slice(0, 4).join(', ') || 'all');
check('the windows: only the roof spoilers, the mirrors and the louvres meet the glass', !glass.length, glass.slice(0, 4).join(', ') || 'none');
check('the tyres\' room clear of every visible part (steered +-0.66 rad, sprung +-3 cm)', !tyres.length, tyres.slice(0, 4).join(', ') || 'clear');
check('breaking: each part in the stock part ids (spoiler, headL / headR, hood, tailL / tailR, trunk, aerial, mirrors, doors, bumpers; hidden: the inner block)', !parts.length, parts.slice(0, 3).join(' | ') || 'all');

// ---- 2. two parts at once (K.fitted): pairs that cross built alone, fitted together ----
const ST = L.optionGeo(R, VID, {}, '__', true), GB = L.Grid(ST.P, ST.rest);   // (the stock shell: how far over it two parts meet)
const ovB = (a, b) => [0, 1, 2].every(j => a[0][j] <= b[1][j] && b[0][j] <= a[1][j]);
const cross = (A, B, under) => {   // A's edges through B's triangles: the highest crossing over the stock shell (under: one that doesn't count)
  if (!B.G) B.G = L.Grid(B.P, B.tris); let h = 0;
  for (const t of A.tris) { const o = t * 9, V = [0, 1, 2].map(v => [A.P[o + v * 3], A.P[o + v * 3 + 1], A.P[o + v * 3 + 2]]);
    for (let e = 0; e < 3; e++) { const p = V[e], q = V[(e + 1) % 3], [lo, hi] = L.boxOf([p, q]); if (!ovB([lo, hi], B.box)) continue;
      for (const u of B.G.near(lo, hi)) { const T = B.G.tri(u), s = L.segTri(p, q, T[0], T[1], T[2]);
        if (s > 1e-4 && s < 1 - 1e-4) { const x = [p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s, p[2] + (q[2] - p[2]) * s], d = GB.dist(x, 0.25).d; if (d > h && !(under && under(x))) h = d; break; } } } }
  return h; };
const sub = (P, ranges) => { const ts = []; for (const [a, b] of ranges || []) for (let v = a; v < b; v += 3) ts.push(v / 3);
  const Q = new Float32Array(ts.length * 9); ts.forEach((t, i) => Q.set(P.subarray(t * 9, t * 9 + 9), i * 9)); const tris = ts.map((_, i) => i); return { P: Q, tris, box: tris.length ? L.boxOf(L.corners(Q, tris)) : null }; };
const VIS = ELS.filter(id => !HID.includes(id) && alone[id].some(Boolean)), CUT = { 'aero|auspuh': 0.03, 'aero|vlecne_kljuke': 0.03 };   // (through the diffuser: cut-outs)
const underOf = (P, U, ids) => {   // a cut-out under the car as fitted: its shell (without the two parts) above the point, nothing below
  const mine = new Uint8Array(P.length / 9); for (const k of ids) for (const [a, b] of U.deli[k] || []) for (let v = a; v < b; v += 3) mine[v / 3] = 1;
  const runs = []; let a0 = -1; for (let t = 0; t <= U.outerN / 3; t++) { const off = t === U.outerN / 3 || mine[t]; if (!off && a0 < 0) a0 = t; if (off && a0 >= 0) { runs.push([a0 * 3, t * 3]); a0 = -1; } }
  const S = sub(P, runs);
  let G = null; return (x) => { if (!G) G = L.Grid(S.P, S.tris); return G.ray(x, [0, 1, 0], 4) < Infinity && G.ray(x, [0, -1, 0], 4) === Infinity; }; };
const pairBad = [], pairSeen = []; let tried = 0;
for (let i = 0; i < VIS.length; i++) for (let j = i + 1; j < VIS.length; j++) { const A = VIS[i], B = VIS[j], lim = CUT[A + '|' + B] || CUT[B + '|' + A] || 0.02;
  for (let a = 1; a <= 16; a++) for (let b = 1; b <= 16; b++) { const oa = alone[A][a], ob = alone[B][b]; if (!oa || !ob || !ovB(oa.box, ob.box)) continue;
    if (Math.max(cross(oa, ob), cross(ob, oa)) <= 0.02) continue;
    tried++; if (!pairSeen.includes(A + ' x ' + B)) pairSeen.push(A + ' x ' + B);
    const T = R.kitTry(VID, null, { [A]: a, [B]: b }, true); if (!T || T.status !== 'ok') { pairBad.push(`${A}${a} + ${B}${b} ${T ? T.status : 'none'}`); continue; }
    const U = T.geo.userData, P = T.geo.attributes.position.array, SA = sub(P, U.deli[A]), SB = sub(P, U.deli[B]);
    const under = lim > 0.02 ? underOf(P, U, [A, A + '+', B, B + '+']) : null; T.geo.dispose();
    if (!SA.box || !SB.box || !ovB(SA.box, SB.box)) continue;
    const h = Math.max(cross(SA, SB, under), cross(SB, SA, under)); if (h > lim) pairBad.push(`${A}${a} + ${B}${b} ${mm(h)}`); } }
check('two parts at once: the pairs that cross by over 2 cm built alone, fitted together, within 2 cm over the shell (the diffuser\'s cut-outs 3 cm)',
  !pairBad.length && (tried > 0 || VID !== 'kolibri'), pairBad.slice(0, 4).join(', ') || `${tried} pairs of options (${pairSeen.join(', ')})`);

// ---- 3. the wheels as drawn: kitWheelGeo's helper h at DELI.build (the face: the wheel's triangles before the first wheel part) ----
let cap = null; const build0 = D.build;
D.build = function (K, id) {
  if (!(cap && K && K.g && 'still' in K && (id === 'zavore' || id === 'matice'))) return build0.apply(this, arguments);
  if (!cap.has(K)) cap.set(K, { h: { zd: K.zd, rr: K.rr }, f: K.g.P.slice(), parts: {} });
  const W = cap.get(K), a = K.g.P.length, s = K.still ? K.still.P.length : 0, r = build0.apply(this, arguments);
  W.parts[id] = { g: K.g.P.slice(a), still: K.still ? K.still.P.slice(s) : [] }; return r; };
const tris = (P) => { const o = []; for (let i = 0; i + 8 < P.length; i += 9) o.push([[P[i], P[i + 1], P[i + 2]], [P[i + 3], P[i + 4], P[i + 5]], [P[i + 6], P[i + 7], P[i + 8]]]); return o; };
const nz = (t) => { const u = [0, 1, 2].map(c => t[1][c] - t[0][c]), v = [0, 1, 2].map(c => t[2][c] - t[0][c]), w = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(...w); return l ? w[2] / l : 0; };
const samp = (t, k) => { const o = []; for (let i = 0; i <= k; i++) for (let j = 0; j <= k - i; j++) { const u = i / k, v = j / k, w = 1 - u - v; o.push([0, 1, 2].map(c => t[0][c] * w + t[1][c] * u + t[2][c] * v)); } return o; };
const rad = (p) => Math.hypot(p[0], p[1]);
const wheels = (deli) => { cap = new Map(); R.kitInfo(VID, deli); const W = [...cap.values()]; cap = null; return W; };
const calBad = [], nutBad = [], hidBad = [], celBad = []; let calN = 0, nutN = 0, worstCal = Infinity, worstNut = -Infinity;
for (let p = 0; p <= 16; p++) { const PL = p ? D.wheel(p) : {}, FIXED = PL.dish === 'rim' || p === 16;   // (steel wheels, covers: the brakes unseen, js/deli/bok.js FIXED)
  for (let z = 1; z <= 16; z++) for (const W of wheels(Object.assign(p ? { platisca: p } : {}, { zavore: z, matice: z }))) { const h = W.h;
    // the face: the rim's spokes and caps (over the dish, inside the barrel, facing out)
    const face = tris(W.f).filter(t => t.every(c => c[2] > h.zd + 0.003 && rad(c) < h.rr * 0.93) && Math.abs(nz(t)) >= 0.5);
    const fq = [].concat(...face.map(t => samp(t, 12))).map(c => [rad(c), c[2]]).sort((a, b) => a[0] - b[0]);
    const lowAt = (r) => { let lo = Infinity, i0 = 0, i1 = fq.length; while (i0 < i1) { const m = (i0 + i1) >> 1; if (fq[m][0] < r - 0.001) i0 = m + 1; else i1 = m; }
      for (let i = i0; i < fq.length && fq[i][0] <= r + 0.001; i++) if (fq[i][1] < lo) lo = fq[i][1]; return lo; };   // (the face turns: its lowest at that radius)
    const cal = tris((W.parts.zavore || {}).still || []); calN += cal.length;
    if (FIXED && cal.length) hidBad.push(`platisca ${p} zavore ${z}: a caliper behind it`);
    for (const t of cal) for (const c of samp(t, 3)) { const d = lowAt(rad(c)) - c[2]; if (d < worstCal) worstCal = d; if (d < 0.0005) { calBad.push(`platisca ${p} zavore ${z}: ${mm(-d)} in front`); break; } }
    const nAll = tris((W.parts.matice || {}).g || []); nutN += nAll.length;
    if (PL.cover && nAll.length) hidBad.push(`platisca ${p} matice ${z}: nuts under the cover`);
    if (nAll.length) { const zMax = Math.max(...nAll.map(t => Math.max(t[0][2], t[1][2], t[2][2])));   // (the nuts' tops: within 12 mm of their highest, facing out)
      const zAt = (x, y) => { let best = -Infinity; for (const [a, b, c] of face) { const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]); if (Math.abs(d) < 1e-12) continue;
        const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / d, v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / d, w = 1 - u - v;
        if (u >= -1e-9 && v >= -1e-9 && w >= -1e-9) { const zz = u * a[2] + v * b[2] + w * c[2]; if (zz > best) best = zz; } } return best; };
      let worst = -Infinity; for (const t of nAll) if (nz(t) > 0.5 && Math.min(t[0][2], t[1][2], t[2][2]) >= zMax - 0.012) for (const c of samp(t, 3)) worst = Math.max(worst, zAt(c[0], c[1]) - c[2]);
      worstNut = Math.max(worstNut, worst); if (worst > 0.0005) nutBad.push(`platisca ${p} matice ${z}: ${mm(worst)} under the face`); }
    if (z === 1 && !FIXED) { const cr = (MO.celjusti || {}).r || [0.075, 0.14]; let lo = Infinity; for (const [q, zz] of fq) if (q >= cr[0] && q <= cr[1] && zz < lo) lo = zz;
      if (lo < h.zd + 0.0075 + 0.0015 + 0.0005) celBad.push(`platisca ${p}: the spokes ${mm(lo - h.zd)} over the dish`); }   // (the body's calipers: their face 7.5 mm over it, its flash 1.5 mm more)
  } }
D.build = build0;
check('the brakes\' calipers (zavore) behind every rim\'s spokes (stock and 1-16, all 16 kits), none behind a steel wheel or a cover', !calBad.length && !hidBad.length && (calN > 0 || !MO.zavore),
  calBad.concat(hidBad).slice(0, 4).join(', ') || `nearest ${(worstCal * 1000).toFixed(1)} mm behind`);
check('the nuts\' tops (matice) clear of every rim\'s face (all 16 sets)', !nutBad.length && (nutN > 0 || !MO.matice), nutBad.slice(0, 4).join(', ') || `deepest ${(Math.max(0, worstNut) * 1000).toFixed(1)} mm`);
check('the body\'s calipers (celjusti, 7.5 mm over the dish) behind every alloy rim\'s spokes', !celBad.length, celBad.slice(0, 4).join(', ') || 'all');
if (MO.celjusti && MO.zavore) { const cel = (deli) => { const O = L.optionGeo(R, VID, deli, 'celjusti', false); return O.status === 'ok' ? O.part.length : -1; };
  const steel = [1, 2, 3, 4].map(p => cel({ platisca: p, celjusti: 5 })), alloy = cel({ platisca: 9, celjusti: 5 }), kit = cel({ platisca: 9, celjusti: 5, zavore: 9 });
  cap = new Map(); D.build = function (K, id) { if (cap && K && K.g && 'still' in K && id === 'zavore') { const s = K.still.C.length, r = build0.apply(this, arguments); cap.set(K, K.still.C.slice(s)); return r; } return build0.apply(this, arguments); };
  R.kitInfo(VID, { platisca: 9, zavore: 9, celjusti: 13 }); const cols = [...cap.values()]; cap = null; D.build = build0;
  const red = D.calColour(13), hasRed = cols.length && cols.every(c => { for (let i = 0; i < c.length; i += 3) if (Math.abs(c[i] - red[0]) < 1e-6 && Math.abs(c[i + 1] - red[1]) < 1e-6 && Math.abs(c[i + 2] - red[2]) < 1e-6) return true; return false; });
  check('the body\'s calipers: none behind a steel wheel (platisca 1-4), none beside a brake kit (its caliper in their colour)', steel.every(t => t === 0) && alloy > 0 && kit === 0 && hasRed && D.calColour(4) === null,
    `steel ${steel.join('/')}, alloy ${alloy}, with zavore ${kit}, the kit's caliper ${hasRed ? 'in celjusti 13\'s red' : 'not red'}`); }

// ---- 4. all at once: every element's heaviest option ----
{ const ALL = {}; for (const id of ELS) { let best = 1, most = -1; for (let k = 1; k <= 16; k++) { const o = alone[id][k], t = o ? o.tris.length : 0; if (t > most) { most = t; best = k; } } ALL[id] = best; }
  ALL.platisca = 11; ALL.zavore = 15; ALL.matice = 16;   // (the wheels' heaviest: tests/deli.test.js)
  const I = R.kitInfo(VID, ALL), S0 = I0;
  // (the shell: what an intact car draws, ~4 stock shells; the inner block, drawn once panels come off: + 300 for each hidden part, as one alone)
  const hiOk = !S0.hi || (I.hi && I.hi.status === 'ok' && I.hi.tris.outer <= S0.hi.tris.outer + 8000 && I.hi.tris.inner <= S0.hi.tris.inner + 300 * HID.length);   // (no look.hi: no Visoki build)
  const ok = I.status === 'ok' && I.deli.split('.').length === ELS.length && hiOk && I.tris.outer <= S0.tris.outer + 6000 && I.tris.inner <= S0.tris.inner + 300 * HID.length;
  check('all at once (every element\'s heaviest option): builds, the shell within stock + 6000 triangles (Visoki + 8000), the inner block + 300 a hidden part', ok,
    `${I.status} ${I.deli.split('.').length} parts: outer ${S0.tris.outer} -> ${I.tris.outer}, inner ${S0.tris.inner} -> ${I.tris.inner}` + (S0.hi && I.hi ? `; Visoki ${S0.hi.tris.outer} -> ${I.hi.tris.outer}, inner ${S0.hi.tris.inner} -> ${I.hi.tris.inner}` : '; no Visoki')); }

console.warn = warn;
check('none of them warned (no part fell back)', !warns.length, warns.slice(0, 2).join(' | ') || 'none');
console.log(`\n${bad ? 'FAIL' : 'OK'}: ${n - bad}/${n} checks (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
process.exit(bad ? 1 : 0);
