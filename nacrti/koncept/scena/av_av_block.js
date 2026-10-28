// ==== AV (agent AV = PNB/PZA/AMA, round AV: the user: "Maketa v barvi avta, rdeč gumb. Zbriši GT PACK, tam pusti prazen prostor. Ostale 3
//      makete naj ostanejo na istem prostoru. Aero paketi naj bodo različnih barv, avti naj imajo tudi različne poslikave. Naredi 6
//      različnih verzij. Ko klikneš na aero paket, se osvetli maketa avta in ne štirikotnik kot sedaj. ..." and "Naredi, da je en avto pod
//      kupolo, to pomeni, da je zaklenjen.") AMA's chest top with:
//      - the models painted as cars (AMA v2) on small turntables, each with its OWN LIVERY (paint, stripes, two-tone, racing numbers,
//        flames, chequer bands: painted on the car's own mesh by projecting a small drawing onto its sides or its top: one mesh a model,
//        the colours in the vertices) and its kit in its own colours (no longer all carbon);
//      - GT PACK gone: its place on the top stays EMPTY (the bare top, only the printed band along the edge); STREET, SPORT, RACE where they
//        were, all three in ONE pose (the same turntable, scale, turn and place); RACE (DIRKALNI) LOCKED: a padlock on its turntable's front-left rim;
//      - the service element: AMA v1's big red push button with the white wrench;
//      - a tapped model lights up on its own silhouette (the frames: e.model), its cell stays the (invisible) tap area.
//      Six versions (AV.v 1..6) of liveries and kit colours; lift design AV.v from agent LF's patch. AV.v 0: AMA's version 2 as before ----
const AV = { v: __AVV__, lf: __AVLF__ };
if (AV.lf && typeof PBL !== 'undefined') PBL.type = AV.v;   // (agent LF's lift design k in version k: its setting PBL.type, from its patch)
// ---- the liveries: [STREET, SPORT, RACE] a version: paint, stripes (the car's twin stripes: their colour, or null: painted over), low (the
//      lower body's colour: two-tone), decals ([kind, ...]), kit: [the kit's colour, its second colour (splitter, posts, fins), its line] ----
const AVL = {
  1: { name: 'KLASIČNE DIRKALNE ČRTE', m: [
    { paint: 0xd81f2a, stripe: 0xf4f4f0, kit: [0xf4f4f0, 0x1c1d22, 0xf4f4f0], txt: 'rdeča z belima črtama, paket bel' },
    { paint: 0xf2f2ee, stripe: 0x1c5fd6, kit: [0x1c5fd6, 0x15214a, 0xf2c230], txt: 'bela z modrima črtama, paket moder' },
    { paint: 0x4b5563, stripe: 0xd4a52a, kit: [0xd4a52a, 0x1c1d22, 0xd4a52a], txt: 'grafitno siva z zlatima črtama, paket zlat' }] },
  2: { name: 'DIRKALNE ŠTEVILKE', m: [
    { paint: 0xff7a1a, stripe: null, decals: [['number', '21', 0xf4f4f0, 0x1c1d22]], kit: [0x1c1d22, 0x1c1d22, 0xf4f4f0], txt: 'oranžna, bela okrogla tablica s številko 21, paket črn' },
    { paint: 0xf2f2ee, stripe: null, decals: [['number', '7', 0x1c5fd6, 0xffffff], ['band', 0x1c5fd6, 0.72, 0.8]], kit: [0x1c5fd6, 0x15214a, 0x1c5fd6], txt: 'bela, modra tablica s številko 7 in modra bočna črta, paket moder' },
    { paint: 0x2a5bd7, stripe: 0xf4f4f0, decals: [['number', '1', 0xf4f4f0, 0xd81f2a]], kit: [0xd81f2a, 0x7a0f16, 0xf4f4f0], txt: 'modra z belima črtama, bela tablica z rdečo enko, paket rdeč' }] },
  3: { name: 'DVOBARVNE', m: [
    { paint: 0xb8bec6, stripe: null, low: 0x2b313b, kit: [0xff7a1a, 0x2b313b, 0xff7a1a], txt: 'srebrna zgoraj, temno siva spodaj, paket oranžen' },
    { paint: 0x14b8a6, stripe: null, low: 0xf2f2ee, kit: [0xf2f2ee, 0x0f766e, 0x14b8a6], txt: 'turkizna zgoraj, bela spodaj, paket bel' },
    { paint: 0xf2c230, stripe: 0x1c1d22, low: 0x1c1d22, kit: [0x1c1d22, 0x1c1d22, 0xf2c230], txt: 'rumena zgoraj s črnima črtama, črna spodaj, paket črn' }] },
  4: { name: 'PLAMENI', m: [
    { paint: 0x1c1d22, stripe: null, decals: [['flames', 0xff5a14, 0xffd23f]], kit: [0xff7a1a, 0x1c1d22, 0xffd23f], txt: 'črna z oranžno-rumenimi plameni, paket oranžen' },
    { paint: 0x6d28d9, stripe: null, decals: [['flames', 0x22d3ee, 0xf0fdff]], kit: [0xc8ccd2, 0x3a3f47, 0x22d3ee], txt: 'vijolična s turkizno-belimi plameni, paket srebrn' },
    { paint: 0xd81f2a, stripe: null, decals: [['flames', 0xffd23f, 0xfff7d6]], kit: [0xffd23f, 0x1c1d22, 0xffd23f], txt: 'rdeča z rumeno-belimi plameni, paket rumen' }] },
  5: { name: 'ŠAHOVNICE', m: [
    { paint: 0xf2f2ee, stripe: null, decals: [['chequer', 0x1c1d22, 0xf2f2ee]], kit: [0x1c1d22, 0x1c1d22, 0xd81f2a], txt: 'bela s črno-belo šahovnico ob pragovih, paket črn' },
    { paint: 0x1c1d22, stripe: null, decals: [['hoodcheq', 0xf2f2ee, 0x1c1d22]], kit: [0x84cc16, 0x1c1d22, 0x84cc16], txt: 'črna s šahovnico čez pokrov motorja, paket limetin' },
    { paint: 0xf2c230, stripe: 0x1c1d22, decals: [['roofcheq', 0x1c1d22, 0xf2f2ee]], kit: [0x1c1d22, 0x1c1d22, 0xf2f2ee], txt: 'rumena s črnima črtama in šahovnico na strehi, paket črn' }] },
  6: { name: 'MEŠANE POSLIKAVE', m: [
    { paint: 0x5eead4, stripe: null, decals: [['band', 0xf2f2ee, 0.62, 0.72], ['number', '5', 0xf2f2ee, 0x0f766e]], kit: [0xf472b6, 0x3a3f47, 0xf472b6], txt: 'mentolna z belo bočno črto in številko 5, paket roza' },
    { paint: 0xc8ccd2, stripe: null, low: 0xd81f2a, decals: [['flames', 0xd81f2a, 0xff8a3d]], kit: [0xd81f2a, 0x3a3f47, 0xc8ccd2], txt: 'srebrna zgoraj, rdeča spodaj, rdeči plameni, paket rdeč' },
    { paint: 0x1e3a8a, stripe: 0xd4a52a, decals: [['hoodcheq', 0xf2f2ee, 0x1c1d22], ['number', '99', 0xd4a52a, 0x1c1d22]], kit: [0xd4a52a, 0x1c1d22, 0xf2f2ee], txt: 'temno modra z zlatima črtama, šahovnico na pokrovu in zlato številko 99, paket zlat' }] } };
const AVT = { top: [['aero', 1], ['aero', 2], ['aero', 3], null, ['srv', 'srv']], bands: [['AERO KITS', 3], [null, 1], ['SERVICE', 1]],
  L: [['HL'], ['UG', 0, 4], ['GR', 0, 4], ['CAL']], R: [['TL'], ['UG', 4, 5, 'IND'], ['GR', 4, 5, 'DEC'], ['DISC', null, null, 'NUTS']], lock: 3 };
// ---- the car's surface for the decals: a raycast on the game's car mesh (its own metres: x forward, y up, z right) ----
let AVRAY = null;
const avRay = () => { if (AVRAY) return AVRAY; const S = amSrc(), g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(S.P, 3)); g.computeBoundingBox(); g.computeBoundingSphere();
  const m = new T.Mesh(g, new T.MeshBasicMaterial({ side: T.DoubleSide })); m.updateMatrixWorld(true); return (AVRAY = { m, rc: new T.Raycaster() }); };
const avHit = (o, d) => { const R = avRay(); R.rc.set(o, d); const h = R.rc.intersectObject(R.m, false)[0]; if (!h) return null; const n = h.face.normal.clone(); if (n.dot(d) > 0) n.negate(); return { p: h.point, n }; };
// a drawing (canvas: w × h, draw(g, w, h)) projected onto the car: 'side' (u along x from x0 to x1, v along y from a0 to a1, on the side s:
// +1 right, -1 left; text: mirrored on the left side so it reads), 'top' (u along x, v along z from a0 to a1); res: cells; the cells the
// drawing covers (alpha > .5) become small quads 1 cm out of the surface, their colour the drawing's; into P, N, C (the car's metres)
const avDecal = (P, N, C, d) => { const [w, h] = d.px, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); d.draw(g, w, h); const im = g.getImageData(0, 0, w, h).data;
  const [nu, nv] = d.res, sides = d.proj === 'side' ? [1] : [0], off = 0.012;   // (the side the camera sees only: the models never turn, their far side is never seen; half the cost)
  sides.forEach(sd => { const pts = []; for (let j = 0; j <= nv; j++) { const row = []; for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv, x = d.x0 + (d.x1 - d.x0) * u, a = d.a0 + (d.a1 - d.a0) * v;
        const H = d.proj === 'side' ? avHit(V(x, a, sd * 3), V(0, 0, -sd)) : avHit(V(x, 5, a), V(0, -1, 0)); row.push(H && (d.proj !== 'side' || Math.abs(H.p.z) > (d.zmin || 0.8)) ? { p: H.p.clone().addScaledVector(H.n, off), n: H.n } : null); } pts.push(row); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const q = [pts[j][i], pts[j][i + 1], pts[j + 1][i + 1], pts[j + 1][i]]; if (q.some(x => !x)) continue;
      let cu = (i + 0.5) / nu; const cvv = (j + 0.5) / nv; if (d.text && sd < 0) cu = 1 - cu; if (d.flipSide && sd < 0) cu = 1 - cu;
      const px = Math.min(w - 1, Math.floor(cu * w)), py = Math.min(h - 1, Math.floor((1 - cvv) * h)), k = (py * w + px) * 4; if (im[k + 3] < 128) continue;
      const col = [im[k] / 255, im[k + 1] / 255, im[k + 2] / 255], nn = q[0].n.clone().add(q[2].n).normalize();
      // (wound to face out: the cross of its edges along its normal)
      const e1 = V().subVectors(q[1].p, q[0].p), e2 = V().subVectors(q[2].p, q[0].p), ord = e1.cross(e2).dot(nn) >= 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
      ord.forEach(t => { const p = q[t].p; P.push(p.x, p.y, p.z); N.push(nn.x, nn.y, nn.z); C.push(col[0], col[1], col[2]); }); } }); };
const avHex = (c) => '#' + new T.Color(c).getHexString();
// the decals' drawings and places
const avDecals = (dc) => { const [kind, a, b, c, e] = dc;
  if (kind === 'number') return { proj: 'side', x0: -1.02, x1: 0.18, a0: 0.36, a1: 0.95, res: [46, 23], px: [230, 113], text: true, draw: (g, w, h) => {
    g.fillStyle = avHex(b); g.beginPath(); g.arc(w / 2, h / 2, h * 0.47, 0, Math.PI * 2); g.fill(); g.fillStyle = avHex(c); g.font = `900 ${Math.round(h * (a.length > 1 ? 0.56 : 0.66))}px Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a, w / 2, h / 2 + h * 0.04); } };
  if (kind === 'band') return { proj: 'side', x0: -2.45, x1: 2.45, a0: b, a1: c, res: [80, 3], px: [80, 3], draw: (g, w, h) => { g.fillStyle = avHex(a); g.fillRect(0, 0, w, h); } };
  if (kind === 'low') return { proj: 'side', x0: -2.5, x1: 2.5, a0: 0.25, a1: 0.64, res: [90, 10], px: [90, 10], zmin: 0.5, draw: (g, w, h) => { g.fillStyle = avHex(a); g.fillRect(0, 0, w, h); } };
  if (kind === 'flames') return { proj: 'side', x0: -0.9, x1: 2.4, a0: 0.38, a1: 0.9, res: [86, 18], px: [344, 72], flipSide: false, draw: (g, w, h) => {   // (flame tongues from the nose (right) back along the flank, the outer colour and a lighter core)
    const tongue = (y0, len, th, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(w, y0 - th); g.bezierCurveTo(w * 0.7, y0 - th, w - len * 0.6, y0 - th * 1.6, w - len, y0 - th * 0.2); g.bezierCurveTo(w - len * 0.75, y0 + th * 0.2, w - len * 0.55, y0 + th * 0.6, w - len * 0.5, y0 + th * 0.4);
      g.bezierCurveTo(w - len * 0.3, y0 + th * 0.9, w * 0.85, y0 + th, w, y0 + th); g.closePath(); g.fill(); };
    [[0.3, 0.95, 0.12], [0.52, 0.78, 0.13], [0.72, 0.62, 0.12], [0.88, 0.45, 0.08]].forEach(([y, l, t]) => tongue(y * h, l * w, t * h, avHex(a)));
    [[0.3, 0.7, 0.05], [0.52, 0.56, 0.06], [0.72, 0.42, 0.05]].forEach(([y, l, t]) => tongue(y * h, l * w, t * h, avHex(b))); } };
  if (kind === 'chequer') return { proj: 'side', x0: -1.75, x1: 1.75, a0: 0.38, a1: 0.56, res: [56, 3], px: [56, 3], draw: (g, w, h) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { g.fillStyle = avHex((i + j) % 2 ? b : a); g.fillRect(i, j, 1, 1); } } };
  if (kind === 'hoodcheq') return { proj: 'top', x0: 1.2, x1: 1.62, a0: -0.98, a1: 0.98, res: [4, 16], px: [4, 16], draw: (g, w, h) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { g.fillStyle = avHex((i + j) % 2 ? b : a); g.fillRect(i, j, 1, 1); } } };
  if (kind === 'roofcheq') return { proj: 'top', x0: -1.2, x1: 0.3, a0: -0.72, a1: 0.72, res: [12, 10], px: [12, 10], draw: (g, w, h) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { g.fillStyle = avHex((i + j) % 2 ? b : a); g.fillRect(i, j, 1, 1); } } };
  return null; };
// ---- a model in its livery (lv) with kit k at scale s: the car's mesh recoloured (paint, stripes over the top only, the lower body), its
//      decals, its kit in its colours; one geometry (vertex colours), seated on y 0, its middle at the origin ----
const avModel = (lv, k, s) => { const S = amSrc(), paint = AMSRC.paint || (AMSRC.paint = amPaint(S)), P = [], N = [], C = [], col = (h) => { const c = new T.Color(h); return [c.r, c.g, c.b]; };
  const pc = col(lv.paint), lc = lv.low != null ? col(lv.low) : pc, sc = lv.stripe != null ? col(lv.stripe) : pc;
  for (let i = 0; i < S.P.length; i += 3) { const x = S.P[i], y = S.P[i + 1], z = S.P[i + 2], r = S.C[i], g = S.C[i + 1], b = S.C[i + 2], cl = amClass(r, g, b, paint);
    P.push(x, y, z); N.push(S.N[i], S.N[i + 1], S.N[i + 2]);
    const own = typeof window !== 'undefined' && window.AVCARCOL, c = own ? [r, g, b] : cl === 'paint' ? (y < 0.6 ? lc : pc) : cl === 'stripe' && y > 0.85 ? sc : [r, g, b]; C.push(c[0], c[1], c[2]); }   // (drugi avti: the parked car's own colours)
  const decs = (typeof window !== 'undefined' && window.AVCARCOL) ? [] : (lv.low != null ? [['low', lv.low]] : []).concat(lv.decals || []); decs.forEach(dc => { const d = avDecals(dc); if (d) avDecal(P, N, C, d); });
  const [kk, k2, kl] = lv.kit.map(col), kcol = (ck) => ck === 'k' ? kk : ck === 'l' ? kl : k2;
  if (k) amKit(S.K, k).forEach(([w, h, d, x, y, z, rx, ry, rz, ck]) => { const g = new T.BoxGeometry(w, h, d).toNonIndexed(), m = new T.Matrix4().compose(V(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), V(1, 1, 1)), nm = new T.Matrix3().getNormalMatrix(m);
    const pa = g.attributes.position, na = g.attributes.normal, c = kcol(ck), p = V(), n = V(); for (let i = 0; i < pa.count; i++) { p.fromBufferAttribute(pa, i).applyMatrix4(m); n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); C.push(c[0], c[1], c[2]); } g.dispose(); });
  if (typeof window !== 'undefined' && window.AVCARCOL && S.K) { const fit = Math.min(1, 4.82 / Math.max(0.1, S.K.front - S.K.rear), 1.34 / Math.max(0.1, S.K.top)); s *= fit; window.AVFIT = +fit.toFixed(3); }   // (another car: the model kept inside VIHAR's envelope (length 4.82 m, height 1.34 m) so the three still fit their turntables and stay below the signs)
  for (let i = 0; i < P.length; i++) P[i] *= s;
  const G = new T.BufferGeometry(); G.setAttribute('position', new T.Float32BufferAttribute(P, 3)); G.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); G.setAttribute('color', new T.Float32BufferAttribute(C, 3)); G.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(P.length / 3 * 2), 2));
  G.computeBoundingBox(); const bb = G.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2; G.translate(-cx, -bb.min.y, -cz); G.computeBoundingBox(); G.computeBoundingSphere();
  return { geo: G, h: bb.max.y - bb.min.y, len: bb.max.x - bb.min.x }; };
// a padlock (gold body, a dark keyhole, a chrome shackle) standing, its foot at the origin, facing +z; size: the body's width
const avLock = (par, M, w) => { const g = new T.Group(); par.add(g); const GO = PR.mat(0xe0b12a, { shininess: 110, specular: 0x998855 }), DK = PR.mat(0x1a1c20, { shininess: 20 });
  const b = new T.Mesh(new T.BoxGeometry(w, w * 0.82, w * 0.36), GO); b.position.y = w * 0.41; g.add(b);
  const sh = new T.Mesh(new T.TorusGeometry(w * 0.3, w * 0.075, 8, 20, Math.PI), M.STL); sh.position.y = w * 0.82; g.add(sh);
  for (const sx of [-1, 1]) { const leg = new T.Mesh(new T.CylinderGeometry(w * 0.075, w * 0.075, w * 0.12, 8), M.STL); leg.position.set(sx * w * 0.3, w * 0.82, 0); g.add(leg); }
  const kh = new T.Mesh(new T.CircleGeometry(w * 0.11, 16), DK); kh.position.set(0, w * 0.47, w * 0.181); g.add(kh); const ks = new T.Mesh(new T.PlaneGeometry(w * 0.07, w * 0.2), DK); ks.position.set(0, w * 0.33, w * 0.181); g.add(ks);
  return g; };
// ---- the motorway signs behind the models (the user: "Vzadaj za maketami naj bodo 3D table, take kot so na avtocesti. Vsak avto naj ima
//      drugačno tablo ... YOUR CAR, BORROWED CAR, FOR SALE 4280€"): STREET a blue motorway sign on two posts, SPORT a green direction sign
//      (an arrow-shaped panel) on one post, RACE an overhead variable-message sign (amber LED dots in a dark box) on a small gantry (it spans
//      into GT PACK's empty place). In the model's stand frame (+z toward the camera), standing on the top behind the turntable, low enough
//      that nothing of it rises over the colour pools behind the chest; generic signs, no road numbers or logos. Each sign's parts merged a
//      material (its frame, its face); part of the model's element (a tap on it is a tap on the model) ----
// ==== THE USER'S CHOICE (the defaults: a frame may set window.<key> for one picture; null/undefined = this default) ====
//   AVSV 'C': table4's signs (green YOUR CAR; RENT A CAR + red 450€; FOR SALE + red 4280€; the padlock on the RACE (FOR SALE) turntable at the
//   model's door; one SERVICE label centred under the button); AVGLOW 1: YOUR CAR's turntable lit green from inside (frosted top, green rim
//   ring, glow on the chest top); AVSGLOW 2: YOUR CAR's letters lit; AVSANG 'eye': the YOUR CAR panel faces the first-view camera's eye
//   (about 37 deg back, 35 deg turned). wScene turns the signs and centres the SERVICE label (avAim, avSrvCentre) after every build.
const AVDEF = { AVSV: 'C', AVGLOW: 1, AVSGLOW: 2, AVSANG: 'eye' };
const avO = (k) => (typeof window !== 'undefined' && window[k] != null) ? window[k] : AVDEF[k];
const AVSG = { z: -0.15, cap: 0.62 };   // (the panels' plane behind the model's middle; cap: the capitals' share of the panel's text area)
const avSignTex = (key, w, h, draw) => pdTex(key, w, h, draw);
const avTxt = (g, txt, x, y, hpx, col, sq = 0.82, maxW = 1e9) => { g.save(); g.font = `bold ${Math.round(hpx / 0.72)}px Arial, Helvetica, sans-serif`; const tw = g.measureText(txt).width, k = Math.min(sq, maxW / tw); g.translate(x, y); g.scale(k, 1); g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, hpx * 0.04); g.restore(); };   // (squeezed to fit maxW)
// the faces: a blue motorway panel (white border, white capitals), a green arrow panel (white border following the arrow, white capitals),
// the message sign's face (dark, amber dots of a 7-dot-high matrix)
const avFaceBlue = () => avSignTex('sgBlue', 512, 120, (g, W, H) => { g.fillStyle = '#1748b8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#f4f6f8'; g.lineWidth = 7; g.beginPath(); g.roundRect(9, 9, W - 18, H - 18, 12); g.stroke(); avTxt(g, 'YOUR CAR', W / 2, H / 2, 64, '#f4f6f8', 0.86, W - 44); });
const avFaceGreen = () => avSignTex('sgGreen', 512, 120, (g, W, H) => { const tip = 64; g.fillStyle = '#0d7a3d'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W - tip, 0); g.lineTo(W, H / 2); g.lineTo(W - tip, H); g.lineTo(0, H); g.closePath(); g.fill();
  g.strokeStyle = '#f4f6f8'; g.lineWidth = 6; g.beginPath(); g.moveTo(9, 9); g.lineTo(W - tip - 3, 9); g.lineTo(W - 11, H / 2); g.lineTo(W - tip - 3, H - 9); g.lineTo(9, H - 9); g.closePath(); g.stroke(); avTxt(g, 'BORROWED CAR', (W - tip) / 2 + 6, H / 2, 64, '#f4f6f8', 0.8, W - tip - 30); });
const AVVMS = { cw: 80, ch: 9 };   // (the message sign's matrix: 80 × 9 dots; the text in a real 5 × 7 LED font, so the capitals are 7 dots high)
const AVGLY = { F: '#####|#....|#....|####.|#....|#....|#....', O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', L: '#....|#....|#....|#....|#....|#....|#####', E: '#####|#....|#....|####.|#....|#....|#####',
  4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', '€': '..###|.#...|####.|.#...|####.|.#...|..###' };   // (the zero has its slash, so 4280 never reads as 428D)
const avFaceVMS = () => avSignTex('sgVms', AVVMS.cw * 10, AVVMS.ch * 10, (g, W, H) => { g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, W, H); const cw = AVVMS.cw, ch = AVVMS.ch, txt = [...'FOR SALE 4280€'];
  const wd = c => c === ' ' ? 2 : 5, tw = txt.reduce((t, c) => t + wd(c), 0) + txt.length - 1, on = new Set(); let x = Math.floor((cw - tw) / 2);
  txt.forEach(c => { if (c !== ' ') AVGLY[c].split('|').forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') on.add((j + 1) * cw + x + i); })); x += wd(c) + 1; });
  const sx = W / cw, sy = H / ch;
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const o = on.has(j * cw + i); g.fillStyle = o ? '#ffb020' : '#2a2216'; g.beginPath(); g.arc((i + 0.5) * sx, (j + 0.5) * sy, Math.min(sx, sy) * (o ? 0.46 : 0.3), 0, Math.PI * 2); g.fill(); } });
// ---- table2 (window.AVSV 'A' or 'B'): ALL THREE signs blue motorway panels like YOUR CAR (white border, white capitals 74/120 of the panel);
//   SPORT 'BORROWED' + a smaller price panel 'RENT 450€', RACE 'FOR SALE' + '4280€'.  A: the price panel stacked above the main panel on the
//   main sign's own (extended) post, in the same plane;  B: the price panel is a small separate flag sign on its own thin pole 7 cm behind
const AVB = { cap: 74, h: 0.096, w: 0.46 };
const avFaceB = (txt, w, h) => { const H = 120, W = Math.round(H * w / h); return avSignTex('sgB_' + txt + '_' + W, W, H, (g) => { g.fillStyle = '#1748b8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#f4f6f8'; g.lineWidth = 7; g.beginPath(); g.roundRect(9, 9, W - 18, H - 18, 12); g.stroke(); avTxt(g, txt, W / 2, H / 2, AVB.cap, '#f4f6f8', 0.88, W - 38); }); };
const AVC = { cap: 91, green: '#0d7a3d', red: '#c8202a', blue: '#1748b8' };   // (table3: caps 84/120 of the panel, thinner border inset)
const avFaceC = (txt, w, h, bg) => { const H = 120, W = Math.round(H * w / h); return avSignTex('sgC_' + txt + '_' + W + bg, W, H, (g) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = '#f4f6f8'; g.lineWidth = 5; g.beginPath(); g.roundRect(4.5, 4.5, W - 9, H - 9, 9); g.stroke(); g.save(); g.font = `bold ${Math.round(AVC.cap / 0.716)}px Arial, Helvetica, sans-serif`; const tw = g.measureText(txt).width, k = Math.min(0.88, (W - 28) / tw); g.translate(W / 2, H / 2); g.scale(k, 1); g.fillStyle = '#f4f6f8'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(txt, 0, AVC.cap / 2); g.restore(); }); };   // (the capitals exactly centred)
// ---- tabla luč (window.AVSGLOW): YOUR CAR lit. 1 the whole panel backlit (lighter glowing green, brighter letters, a green halo quad behind
//   the panel's edge); 2 only the letters lit (the panel plain green, the letters with a white-green glow baked round them); 3 a motorway
//   sign at night: three small lamps on short arms over the top edge, their lenses lit, pools of light on the face. All unlit (MeshBasic) or additive
const avFaceL = (txt, w, h, mode) => { const H = 120, W = Math.round(H * w / h); return avSignTex('sgL' + mode + '_' + txt + '_' + W, W, H, (g) => {
  if (mode === 1) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1fae60'); gr.addColorStop(0.5, '#2bc672'); gr.addColorStop(1, '#1fae60'); g.fillStyle = gr; } else g.fillStyle = mode === 2 ? '#0b6e37' : '#0d7a3d'; g.fillRect(0, 0, W, H);
  if (mode === 3) [0.17, 0.5, 0.83].forEach(fx => { const gr = g.createRadialGradient(fx * W, -14, 4, fx * W, -14, H * 1.25); gr.addColorStop(0, 'rgba(215,255,228,1)'); gr.addColorStop(0.45, 'rgba(125,230,165,0.58)'); gr.addColorStop(1, 'rgba(13,122,61,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
  g.strokeStyle = mode === 2 ? '#d5dde3' : '#ffffff'; g.lineWidth = 5; g.beginPath(); g.roundRect(4.5, 4.5, W - 9, H - 9, 9); g.stroke();
  g.save(); g.font = `bold ${Math.round(AVC.cap / 0.716)}px Arial, Helvetica, sans-serif`; const tw = g.measureText(txt).width, k = Math.min(0.88, (W - 28) / tw); g.translate(W / 2, H / 2); g.scale(k, 1); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  if (mode !== 3) { g.shadowColor = mode === 2 ? 'rgba(170,255,200,0.9)' : 'rgba(255,255,255,0.85)'; g.shadowBlur = 10; g.fillStyle = '#ffffff'; g.fillText(txt, 0, AVC.cap / 2); g.shadowBlur = 0; }   // (the glow round the letters)
  g.fillStyle = '#ffffff'; g.fillText(txt, 0, AVC.cap / 2); g.restore(); }); };   // (the letters themselves crisp on top)
const avSignLit = (F, acc2, fc, K, w, h, xc, y0, mode, GS, BK) => { fc.material.map = avFaceL(K.t, w, h, mode); fc.material.needsUpdate = true;
  if (mode === 1) { const m = 0.05, W2 = Math.round(256 * (w + 2 * m) / (h + 2 * m)), tex = avSignTex('sgHalo_' + W2, W2, 256, (g, W, H) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); const px = W / (w + 2 * m);
      g.shadowColor = '#2ee07a'; g.shadowBlur = 0.03 * px; g.fillStyle = '#1c9a52'; g.beginPath(); g.roundRect(m * px, m * px, w * px, h * px, 0.01 * px); g.fill(); g.fill(); });
    const q = new T.Mesh(new T.PlaneGeometry(w + 2 * m, h + 2 * m), new T.MeshBasicMaterial({ map: tex, blending: T.AdditiveBlending, transparent: true, depthWrite: false })); q.position.set(xc, y0 + h / 2, -0.0095); q.renderOrder = 2; F.add(q); }   // (the green halo round the panel)
  if (mode === 3) { const LENS = new T.MeshBasicMaterial({ color: 0xfff4d6 }); [-0.15, 0, 0.15].forEach(dx => { const x = xc + dx, yt = y0 + h;   // (three lamps: a short arm up from the back of the top edge and forward, a dark housing, its lit lens toward the face and the camera)
      acc2.box(GS, x - 0.002, x + 0.002, yt - 0.004, yt + 0.014, -0.008, -0.004); acc2.box(GS, x - 0.002, x + 0.002, yt + 0.010, yt + 0.014, -0.008, 0.018);
      acc2.add(BK, new T.BoxGeometry(0.03, 0.011, 0.016), new T.Matrix4().compose(V(x, yt + 0.012, 0.022), new T.Quaternion().setFromEuler(new T.Euler(0.55, 0, 0)), V(1, 1, 1)));
      acc2.add(LENS, new T.BoxGeometry(0.026, 0.008, 0.003), new T.Matrix4().compose(V(x, yt + 0.0085, 0.0295), new T.Quaternion().setFromEuler(new T.Euler(0.55, 0, 0)), V(1, 1, 1)));   /* (the lens on the housing's front, toward the face and the camera) */ }); } };
const avSignB = (P, M, kind, V) => { const S = new T.Group(); S.position.z = AVSG.z; P.add(S); const acc = pdAcc(), GS = PR.mat(0x9aa2ac, { shininess: 70, specular: 0x777777 }), BK = PR.mat(0x2a2d33, { shininess: 30 }), out = { S, face: null, face2: null, box: null };
  const post = (x, h, r = 0.007, z = -0.012) => { acc.cyl(GS, r, h, x, h / 2, z, 'y', 10); acc.box(GS, x - r * 1.6, x + r * 1.6, 0, 0.004, z - r * 1.6, z + r * 1.6); };
  const bracket = (x, y, z = -0.012) => { acc.box(GS, x - 0.012, x + 0.012, y - 0.006, y + 0.006, z, z + 0.008); acc.cyl(GS, 0.0028, 0.006, x - 0.006, y, z + 0.0105, 'z', 6); acc.cyl(GS, 0.0028, 0.006, x + 0.006, y, z + 0.0105, 'z', 6); };
  const panel = (txt, w, h, xc, y0, z, bg) => { acc.box(BK, xc - w / 2, xc + w / 2, y0, y0 + h, z - 0.006, z); const f = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: bg ? avFaceC(txt, w, h, bg) : avFaceB(txt, w, h) })); f.position.set(xc, y0 + h / 2, z + 0.0005); f.userData.cap = (bg ? AVC.cap : AVB.cap) / 120; S.add(f); return f; };
  if (V === 'C') {   // table3 (the user's pick, A refined): YOUR CAR green; RENT A CAR blue + a red 'ONE RACE 450€' plate stacked above it, FOR SALE blue + a red '4280€' plate; each plate's right edge on its main sign's right edge, on the main sign's right post
    const K = { 1: { t: 'YOUR CAR', bg: AVC.green, xc: -0.07, y0: 0.07, h: 0.096, w: 0.44 }, 2: { t: 'RENT A CAR', bg: AVC.blue, xc: 0, y0: 0.0595, h: 0.072, w: 0.46, p: '450€', ph: 0.072, pw: 0.171, gap: 0.0025 },   // (the plate's top is held by the yellow pool's lowest point right above it: 0.072 m is the most that fits)   // (between the yellow pool and the model's wing: two plates of 0.063 m)
                3: { t: 'FOR SALE', bg: AVC.blue, xc: 0.29, y0: 0.05, h: 0.096, w: 0.46, p: '4280€', ph: 0.095, pw: 0.26 } }[kind];
    const xa = K.xc - 0.16, xb = K.xc + 0.16; let topB = K.y0 + K.h - 0.008;
    if (kind === 1) { const F = new T.Group(); S.add(F); const acc2 = pdAcc(), y0 = K.y0, h = K.h, w = K.w, xc = K.xc;   // (table4: YOUR CAR square-on to the first-view camera: the panel leans back on its two short posts)
      acc2.box(BK, xc - w / 2, xc + w / 2, y0, y0 + h, -0.008, -0.002); const fc = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: avFaceC(K.t, w, h, K.bg) })); fc.position.set(xc, y0 + h / 2, -0.0015); fc.userData.cap = AVC.cap / 120; F.add(fc); out.face = fc;
      [xa, xb].forEach(x => { acc2.box(GS, x - 0.012, x + 0.012, y0 + 0.008, y0 + 0.02, -0.012, -0.004); acc2.box(GS, x - 0.005, x + 0.005, y0 + 0.02, y0 + h - 0.012, -0.012, -0.008); post(x, y0 + 0.016); });   // (a clamp at the bottom, a flat bar up the back)
      const SGL = avO('AVSGLOW'); if (SGL) avSignLit(F, acc2, fc, K, w, h, xc, y0, SGL, GS, BK);   // (tabla luč: YOUR CAR lit)
      acc.flush(S).forEach(m => { m.castShadow = true; m.receiveShadow = true; }); acc2.flush(F).forEach(m => { m.castShadow = true; m.receiveShadow = true; }); F.userData.avAim = { bb: true, pv: [xc, y0, -0.005], h }; out.box = [w, h, y0, xc];
      S.traverse(q => { if (q.isMesh) q.userData.pdKeep = true; }); return out; }
    if (K.p) { const py = K.y0 + K.h + (K.gap || 0.005), pxc = K.xc + K.w / 2 - K.pw / 2; out.face2 = panel(K.p, K.pw, K.ph, pxc, py, -0.002, AVC.red); topB = py + K.ph - 0.01; bracket(xb, py + Math.min(0.018, K.ph * 0.3)); bracket(xb, py + K.ph - Math.min(0.018, K.ph * 0.3)); }
    post(xa, K.y0 + K.h - 0.008); post(xb, topB); out.face = panel(K.t, K.w, K.h, K.xc, K.y0, -0.002, K.bg); [xa, xb].forEach(x => { bracket(x, K.y0 + Math.min(0.02, K.h * 0.28)); bracket(x, K.y0 + K.h - Math.min(0.02, K.h * 0.28)); }); out.box = [K.w, K.h, K.y0, K.xc];
    S.userData.avAim = { px: K.xc, z0: AVSG.z, arc: kind === 3 };   // (turned about its own centre by avAim: RENT A CAR square to the screen; FOR SALE parallel to the chest's back edge (angle from avTop))
    acc.flush(S).forEach(m => { m.castShadow = true; m.receiveShadow = true; }); S.traverse(q => { if (q.isMesh) q.userData.pdKeep = true; }); return out; }
  const L = { 1: { t: 'YOUR CAR', xc: -0.07, y0: 0.07 }, 2: { t: 'BORROWED', xc: 0, y0: 0.066, p: 'RENT 450€', pw: 0.26, ph: 0.078, px: -0.19, side: -1, dyB: 0.05 },
              3: { t: 'FOR SALE', xc: 0.29, y0: 0.05, p: '4280€', pw: 0.27, ph: 0.11, px: 0.425, side: 1, dyB: 0.06 } }[kind];
  const w = AVB.w, h = AVB.h, xa = L.xc - 0.16, xb = L.xc + 0.16; let topA = L.y0 + h - 0.008, topB = topA;
  if (L.p && V === 'A') { const py = L.y0 + h + 0.006; out.face2 = panel(L.p, L.pw, L.ph, L.px, py, -0.002); if (L.side < 0) topA = py + L.ph - 0.01; else topB = py + L.ph - 0.01;
    const xs = L.side < 0 ? xa : xb; bracket(xs, py + 0.018); bracket(xs, py + L.ph - 0.018); }
  if (L.p && V === 'B') { const z = -0.07, py = L.y0 + h + 0.006 - L.dyB, xp = L.px + L.side * (L.pw / 2 + 0.006); out.face2 = panel(L.p, L.pw, L.ph, L.px, py, z - 0.002);
    post(xp, py + L.ph + 0.004, 0.0045, z - 0.012); acc.box(GS, Math.min(xp, L.px + L.side * L.pw / 2) - 0.004, Math.max(xp, L.px + L.side * L.pw / 2) + 0.004, py + L.ph - 0.016, py + L.ph - 0.006, z - 0.014, z - 0.004);
    acc.box(GS, Math.min(xp, L.px + L.side * L.pw / 2) - 0.004, Math.max(xp, L.px + L.side * L.pw / 2) + 0.004, py + 0.006, py + 0.016, z - 0.014, z - 0.004); }   // (two short arms from the pole to the panel's edge)
  post(xa, topA); post(xb, topB); out.face = panel(L.t, w, h, L.xc, L.y0, -0.002); [xa, xb].forEach(x => { bracket(x, L.y0 + 0.02); bracket(x, L.y0 + h - 0.02); }); out.box = [w, h, L.y0, L.xc];
  acc.flush(S).forEach(m => { m.castShadow = true; m.receiveShadow = true; }); S.traverse(q => { if (q.isMesh) q.userData.pdKeep = true; }); return out; };
const avSign = (P, M, kind) => { const S = new T.Group(); S.position.z = AVSG.z; P.add(S); const acc = pdAcc(), GS = PR.mat(0x9aa2ac, { shininess: 70, specular: 0x777777 }), BK = PR.mat(0x2a2d33, { shininess: 30 }), out = { S, face: null, box: null };
  const post = (x, h, r = 0.007) => { acc.cyl(GS, r, h, x, h / 2, -0.012, 'y', 10); acc.box(GS, x - r * 1.6, x + r * 1.6, 0, 0.004, -0.012 - r * 1.6, -0.012 + r * 1.6); };   // (a galvanised post on its foot plate)
  const bracket = (x, y) => { acc.box(GS, x - 0.012, x + 0.012, y - 0.006, y + 0.006, -0.012, -0.004); acc.cyl(GS, 0.0028, 0.006, x - 0.006, y, -0.0015, 'z', 6); acc.cyl(GS, 0.0028, 0.006, x + 0.006, y, -0.0015, 'z', 6); };   // (a clamp with two bolts)
  let face;
  if (kind === 1) { const w = 0.44, h = 0.088, y0 = 0.07; post(-0.15, y0 + h - 0.008); post(0.15, y0 + h - 0.008); acc.box(BK, -w / 2, w / 2, y0, y0 + h, -0.008, -0.002);
    [-0.15, 0.15].forEach(x => { bracket(x, y0 + 0.02); bracket(x, y0 + h - 0.02); }); face = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: avFaceBlue() })); face.position.set(0, y0 + h / 2, -0.0015); out.box = [w, h, y0]; }
  else if (kind === 2) { const w = 0.46, h = 0.094, y0 = 0.066, tip = w * 64 / 512; post(-0.08, y0 + h - 0.008, 0.008);
    const sh = new T.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2 - tip, 0); sh.lineTo(w / 2, h / 2); sh.lineTo(w / 2 - tip, h); sh.lineTo(-w / 2, h); sh.closePath(); acc.add(BK, new T.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false }), new T.Matrix4().makeTranslation(0, y0, -0.008));
    [y0 + 0.02, y0 + h - 0.02].forEach(y => bracket(-0.08, y)); const fg = new T.ShapeGeometry(sh); const uv = fg.attributes.uv, pa = fg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (pa.getX(i) + w / 2) / w, pa.getY(i) / h);
    face = new T.Mesh(fg, new T.MeshBasicMaterial({ map: avFaceGreen() })); face.position.set(0, y0, -0.0015); out.box = [w, h, y0]; }
  else { const h = 0.088, w = h * AVVMS.cw / AVVMS.ch, y0 = 0.05, xc = 0.295, span = w + 0.05, top = y0 + h + 0.01;   // (a portal: two posts, a light lattice beam over the box, the box (the message) between them; shifted right, into the empty place)
    post(xc - span / 2, top, 0.009); post(xc + span / 2, top, 0.009); acc.box(GS, xc - span / 2 - 0.01, xc + span / 2 + 0.01, top - 0.004, top + 0.006, -0.03, 0.006);
    for (let i = 0; i <= 12; i++) { const x = xc - span / 2 + span * i / 12; acc.box(GS, x - 0.002, x + 0.002, top - 0.004, top + 0.006, -0.03, 0.006); }
    acc.box(BK, xc - w / 2 - 0.008, xc + w / 2 + 0.008, y0 - 0.008, y0 + h + 0.008, -0.04, -0.002); [xc - w / 2 - 0.008, xc + w / 2 + 0.008].forEach(x => bracket(x + (x < xc ? -0.01 : 0.01), y0 + h / 2));   // (the box, its clamps to the posts)
    face = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: avFaceVMS() })); face.position.set(xc, y0 + h / 2, -0.0015); out.box = [w, h, y0, xc]; }
  acc.flush(S).forEach(m => { m.castShadow = true; m.receiveShadow = true; }); S.add(face); out.face = face;
  S.traverse(q => { if (q.isMesh) q.userData.pdKeep = true; }); return out; };
// ---- the parts on the top: a model on its turntable (STREET, SPORT) or under its dome (RACE, locked); the service button (AMA v1) ----
const avAim = (root) => { const cam = G3.camera; cam.updateMatrixWorld(true); const c = new T.Vector3().setFromMatrixPosition(cam.matrixWorld), nw = new T.Vector3(0, 0, 1).applyQuaternion(cam.getWorldQuaternion(new T.Quaternion())); nw.y = 0; nw.normalize(); root.updateMatrixWorld(true); const n = [];   // (table3: signs and the padlock turned about the vertical so they face the first-view camera square-on)
  root.traverse(o => { if (o.userData.avAim) n.push(o); }); n.forEach(o => { const a = o.userData.avAim, cl = o.parent.worldToLocal(c.clone());
    const p0 = o.parent.worldToLocal(o.getWorldPosition(new T.Vector3())), nl = o.parent.worldToLocal(o.getWorldPosition(new T.Vector3()).add(nw)).sub(p0);   // (the camera's backward direction in the parent's frame: the panel parallel to the screen's horizontal)
    if (a.lock) { o.rotation.order = 'YXZ'; o.rotation.set(a.tilt, Math.atan2(nl.x, nl.z), 0); return; }
    if (a.bb) { const md = avO('AVSANG') || 'bb', camQ = cam.getWorldQuaternion(new T.Quaternion()); let qw = camQ;   // (YOUR CAR's angle: 'bb' parallel to the screen (today), 'eye' facing the camera's eye exactly, or a number: tilted back that many degrees, turned like the screen)
      if (md === 'eye') { const pw = o.parent.localToWorld(new T.Vector3(a.pv[0], a.pv[1] + (a.h || 0.1) / 2, a.pv[2])), up = new T.Vector3(0, 1, 0).applyQuaternion(camQ); qw = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(c, pw, up)); }
      else if (typeof md === 'number') { const bk = new T.Vector3(0, 0, 1).applyQuaternion(camQ); qw = new T.Quaternion().setFromEuler(new T.Euler(-md * Math.PI / 180, Math.atan2(bk.x, bk.z), 0, 'YXZ')); }
      const qp = o.parent.getWorldQuaternion(new T.Quaternion()).invert(), q = qp.multiply(qw); o.quaternion.copy(q); const pv = new T.Vector3(...a.pv); o.position.copy(pv.clone().sub(pv.clone().applyQuaternion(q))); a.phi = 2 * Math.acos(Math.min(1, Math.abs(q.w))); return; }
    const phi = a.fix != null ? a.fix : Math.atan2(nl.x, nl.z); o.rotation.set(0, phi, 0); o.position.set(a.px - a.px * Math.cos(phi), 0, a.z0 + a.px * Math.sin(phi)); a.phi = phi; });
  root.updateMatrixWorld(true); return n.map(o => +(((o.userData.avAim.phi != null ? o.userData.avAim.phi : o.rotation.y) * 180 / Math.PI).toFixed(1))); };
const avSrvCentre = () => { const A = window.AVSRV; if (!A) return null; const cam = G3.camera; A.G.updateMatrixWorld(true); cam.updateMatrixWorld(true);
  const sx = (w) => w.project(cam).x, bw = A.part.localToWorld(new T.Vector3(0, 0.03, 0)), X = sx(bw.clone());   // (the button's middle on screen)
  let lo = A.Lb.u0, hi = A.Lb.u1; const at = (x) => sx(A.G.localToWorld(new T.Vector3(x, A.y, A.zm(x))));
  const inc = at(hi) > at(lo); for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if ((at(mid) < X) === inc) lo = mid; else hi = mid; }
  const xs = (lo + hi) / 2, uv = (xs - A.Lb.u0) / (A.Lb.u1 - A.Lb.u0), map = A.Lb.mat.map; map.offset.x = 0.5 - uv; map.needsUpdate = true; return { uvAtButton: +uv.toFixed(3), shift: +(0.5 - uv).toFixed(3) }; };
// ---- krog luč (window.AVGLOW 1 green, 2 white, 3 green light under the rim): YOUR CAR's turntable lit from inside = the car in the garage now.
//   Cheap: unlit (MeshBasic) surfaces + one additive spill decal on the chest top + the model's lowest 3 cm given a little emissive in its
//   own shader (no real light). v1/v2: a frosted glowing disc top (radial gradient), the kit ring a bright glow ring; v3: the disc stays
//   grey, a light band in the base under the rim and a wider spill, meant to breathe (opacity 0.55 -> 1 -> 0.55, 2.4 s, sine; shown at peak)
const AVGL = { 1: { top: ['#e9fff1', '#a9efc4', '#d9ffe8', '#5ff09a'], ring: 0x5dff9a, spill: '#2ee07a', sk: 0.9, sw: 0.075, glow: 0x2ee07a, gk: 0.32 },
               2: { top: ['#ffffff', '#dfe6ee', '#f6f9ff', '#ffffff'], ring: 0xffffff, spill: '#c9d6e6', sk: 0.75, sw: 0.075, glow: 0xdfe8f4, gk: 0.3 },
               3: { band: 0x5dff9a, spill: '#2ee07a', sk: 1.0, sw: 0.1, glow: 0x2ee07a, gk: 0.36 } };
const avGlowTex = (key, draw) => avSignTex(key, 256, 256, (g, W) => draw(g, W / 2));
const avGlow = (P, M, ln, TR, h0, k) => { const C = AVGL[k], add = { blending: T.AdditiveBlending, transparent: true, depthWrite: false };
  if (C.top) { const tex = avGlowTex('glTop' + k, (g, c) => { const gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, C.top[0]); gr.addColorStop(0.55, C.top[1]); gr.addColorStop(0.88, C.top[2]); gr.addColorStop(1, C.top[3]); g.fillStyle = gr; g.fillRect(0, 0, 2 * c, 2 * c);
      g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 2; for (let r = 0.18; r < 0.95; r += 0.16) { g.beginPath(); g.arc(c, c, r * c, 0, Math.PI * 2); g.stroke(); } });   // (frosted diffuser: faint concentric rings)
    const d = new T.Mesh(new T.CircleGeometry(TR - 0.014, 48), new T.MeshBasicMaterial({ map: tex })); d.rotation.x = -Math.PI / 2; d.position.y = h0 + 0.0004; P.add(d); d.userData.pdKeep = true;
    ln.material = new T.MeshBasicMaterial({ color: C.ring }); }
  if (C.band) { const b = new T.Mesh(new T.CylinderGeometry(TR + 0.0035, TR + 0.0062, 0.011, 64, 1, true), new T.MeshBasicMaterial({ color: C.band })); b.position.y = 0.0075; P.add(b); b.userData.pdKeep = true; }   // (the light band in the base, under the disc's rim)
  const r1 = TR + C.sw, ri = (TR + 0.002) / r1, sp = avGlowTex('glSp' + k, (g, c) => { const gr = g.createRadialGradient(c, c, 0, c, c, c), col = new T.Color(C.spill), q = (a) => `rgb(${Math.round(col.r * 255 * a)},${Math.round(col.g * 255 * a)},${Math.round(col.b * 255 * a)})`;
    gr.addColorStop(0, '#000'); gr.addColorStop(Math.max(0, ri - 0.02), '#000'); gr.addColorStop(ri, q(C.sk)); gr.addColorStop(ri + (1 - ri) * 0.3, q(C.sk * 0.45)); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, 2 * c, 2 * c); });
  const s = new T.Mesh(new T.RingGeometry(TR + 0.002, r1, 64, 1), new T.MeshBasicMaterial(Object.assign({ map: sp }, add))); s.rotation.x = -Math.PI / 2; s.position.y = 0.0014; s.renderOrder = 2; P.add(s); s.userData.pdKeep = true;   // (the glow spilling onto the chest's top round the base)
  return C; };
const avGlowModel = (m, C) => { const mt = m.material.clone(), col = new T.Color(C.glow).multiplyScalar(C.gk); mt.customProgramCacheKey = () => 'avglow';   // (the model's lowest 3 cm lit from below: emissive fading with height, in its own shader)
  mt.onBeforeCompile = (sh) => { sh.uniforms.uGlow = { value: col }; sh.vertexShader = 'varying float vGlowH;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vGlowH = position.y;');
    sh.fragmentShader = 'uniform vec3 uGlow;\nvarying float vGlowH;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uGlow * (1.0 - smoothstep(0.0, 0.03, vGlowH));'); };
  m.material = mt; };
const avPart = (g, M, key, kind, v, lockIt) => { const P = new T.Group(); g.add(P); const model = [];
  if (key === 'srv') { const r = amPart(P, M, 'srv', 'srv', 1); P.traverse(q => { if (q.isMesh) { q.userData.pdKeep = true; model.push(q); } }); return { obj: P, top: r.top, model }; }   // (the button lights up on its own silhouette too)
  const lv = AVL[v].m[kind - 1], [kk] = lv.kit; let h0, md, m;
  const TR = AVF.tr; amCyl(P, M.RUB, TR, TR + 0.005, 0.016, 0); amCyl(P, PR.mat(0x40464f, { shininess: 60, specular: 0x444444 }), TR - 0.014, TR - 0.014, 0.01, 0.016); h0 = 0.026;   // (the turntable; a ring in the kit's colour; ONE pose for all three models)
  const ln = new T.Mesh(new T.TorusGeometry(TR - 0.011, 0.006, 6, 64), amEmi(kk, 0.95)); ln.rotation.x = Math.PI / 2; ln.position.y = h0 - 0.002; P.add(ln);
  md = avModel(lv, kind, AVF.sc); m = new T.Mesh(md.geo, amMat('carpaint')); m.position.y = h0; m.rotation.y = AMF.yaw;
  const GL = avO('AVGLOW') && kind === 1 ? avGlow(P, M, ln, TR, h0, avO('AVGLOW')) : null; if (GL) avGlowModel(m, GL);   // (krog luč: YOUR CAR's turntable lit from inside)
  const sg = avO('AVSV') ? avSignB(P, M, kind, avO('AVSV')) : avSign(P, M, kind); sg.S.traverse(q => { if (q.isMesh) model.push(q); }); P.userData.sign = sg;
  if (lockIt && avO('AVSV') === 'C') { const lk = avLock(P, M, 0.06), yaw = AMF.yaw, dx = 0.02, dz = (Math.cos(yaw) >= 0 ? 1 : -1) * 0.088;   // (table3: on the disc in front of the model's door (the side toward the camera), turned to the camera by avAim)
    lk.position.set(dx * Math.cos(yaw) + dz * Math.sin(yaw), h0 - 0.002, -dx * Math.sin(yaw) + dz * Math.cos(yaw)); lk.rotation.order = 'YXZ'; lk.rotation.set(-0.12, 0, 0); lk.userData.avAim = { lock: true, tilt: -0.12 };
    lk.traverse(q => { if (q.isMesh) { q.userData.pdKeep = true; model.push(q); } }); }
  else if (lockIt) { const lk = avLock(P, M, 0.07); const la = -0.87; lk.position.set(Math.sin(la) * (TR + 0.012), 0.0, Math.cos(la) * (TR + 0.012)); lk.rotation.set(-0.2, -0.25, 0);   // (locked: only the padlock, on the turntable's front-left rim (50 deg off the front) so it no longer covers the 'RACE · LOCKED' label, facing the camera)
    lk.traverse(q => { if (q.isMesh) { q.userData.pdKeep = true; model.push(q); } }); }
  m.castShadow = true; m.receiveShadow = true; m.userData.pdKeep = true; P.add(m); model.unshift(m);
  P.traverse(q => { if (q.isMesh && q !== m) { q.castShadow = !(q.material && (q.material.transparent || q.material.type === 'MeshBasicMaterial')); q.receiveShadow = true; } });
  return { obj: P, top: P.userData.top || h0 + md.h, model, sign: P.userData.sign }; };
// ---- the top: AMA's cells (5 across), the 4th EMPTY (the bare top, a plain band), the models and the button ----
const avTop = (F, M, L, Z, els, v) => { const A = L.A, K = pnK(L.wc, L.R, 0), G = new T.Group(); G.position.set(K.O[0], 0, K.O[1]); F.add(G); F.updateMatrixWorld(true); const sh = new T.Group(); G.add(sh);
  const y = A.H + 0.0008, rB = L.rB + 0.004, rF = L.R + PNL.over - 0.002, bEnd = PNL.bE - 0.002, n = Z.top.length, xa = 1.5, xb = 410.5, cx = (j) => xa + (xb - xa) * j / n;
  const zB = (x) => pnZr(K, x, rB), zF = (x) => pnZr(K, x, rF), zR = (x, r) => pnZr(K, x, r);
  const seam = (j, zfn) => { if (j <= 0 || j >= n) { const b = j <= 0 ? -bEnd : bEnd; let x = 0; for (let i = 0; i < 5; i++) { const z = zfn(x); x = (z + L.R) * Math.tan(b); } return x; }
    let x = pnUX(K, cx(j), y, zfn(0)); for (let i = 0; i < 5; i++) x = pnUX(K, cx(j), y, zfn(x)); return x; };
  const bandB = rF - 0.06, bandF = rF - 0.008, tagR = rF - 0.084, tagD = 0.032;
  const labs = []; let j0 = 0; Z.bands.forEach(([nm, cnt]) => { const ja = j0, jb = j0 + cnt, zm = (x) => zR(x, (bandB + bandF) / 2), u0 = seam(ja, zm), u1 = seam(jb, zm);
    const v0 = ja === 0 ? pnUX(K, 2, y, zm(u0)) : u0, v1 = jb === n ? pnUX(K, 410, y, zm(u1)) : u1;
    const mat = new T.MeshBasicMaterial({ map: hNameTex(nm || ' ', (v1 - v0) / (bandF - bandB), { H: 64, font: 46, pad: 6, line: 7 }) }); mat.map.wrapS = mat.map.wrapT = T.ClampToEdgeWrapping;
    for (let j = ja; j < jb; j++) labs[j] = { u0: v0, u1: v1, mat, nm }; j0 = jb; });
  const band = (g, j) => { const Lb = labs[j], zA = (x) => zR(x, bandB), zC = (x) => zR(x, bandF), bx0 = seam(j, (x) => zR(x, (bandB + bandF) / 2)), bx1 = seam(j + 1, (x) => zR(x, (bandB + bandF) / 2));
    const b = new T.Mesh(pnGeo(8, 1, (s, t) => { const x = pnLerp(bx0, bx1, s), z = t <= 0 ? zA(x) : zC(x); return [V(x, y + 0.0012, z), V(0, 1, 0), [(x - Lb.u0) / (Lb.u1 - Lb.u0), 1 - t]]; }), Lb.mat); b.userData.pdPlate = true; g.add(b); Lb.mesh = b; return Lb; };
  Z.top.forEach((it, j) => { const g = new T.Group(); G.add(g);
    if (!it) { band(g, j); return; }   // (GT PACK's place: empty; only the band along the edge)
    const [key, kind] = it, [en, nm] = PDEL[key][kind], lockIt = key === 'aero' && kind === Z.lock;
    const Q = [], xl0 = seam(j, zB), xr0 = seam(j + 1, zB), xl1 = seam(j, zF), xr1 = seam(j + 1, zF), NQ = 16;
    for (let i = 0; i <= NQ; i++) { const x = xl0 + (xr0 - xl0) * i / NQ; Q.push([x, zB(x)]); }
    for (let i = 1; i < 4; i++) { const t = i / 4, z = zB(xr0) + (zF(xr1) - zB(xr0)) * t; Q.push([j + 1 >= n ? (z + L.R) * Math.tan(bEnd) : pnUX(K, cx(j + 1), y, z), z]); }
    for (let i = 0; i <= NQ; i++) { const x = xr1 + (xl1 - xr1) * i / NQ; Q.push([x, zF(x)]); }
    for (let i = 1; i < 4; i++) { const t = i / 4, z = zF(xl1) + (zB(xl0) - zF(xl1)) * t; Q.push([j <= 0 ? -(z + L.R) * Math.tan(bEnd) : pnUX(K, cx(j), y, z), z]); }
    const tile = pdFlat(g, Q, y, M.TOP2); tile.userData.pdTint = true;
    const rI = L.R + PNL.over - (key === 'aero' ? AVF.rItem : AMF.rItem[key]), zIt = (x) => zR(x, rI), cl = Math.max(cx(j), 1), cr = Math.min(cx(j + 1), 411); let xm = pnUX(K, (cl + cr) / 2, y, zIt(0)); for (let i = 0; i < 4; i++) xm = pnUX(K, (cl + cr) / 2, y, zIt(xm));
    const th = -Math.atan(pnDz(K, xm)), stand = new T.Group(); stand.position.set(xm, y, zIt(xm)); stand.rotation.y = th; g.add(stand);
    const pt = avPart(stand, M, key, kind, v, lockIt), shs = key === 'aero' ? AVF.shadow : AMF.shadow[key];
    { const sA = pt.sign && pt.sign.S.userData.avAim; if (sA && sA.arc) { const xs = xm + sA.px * Math.cos(th) + sA.z0 * Math.sin(th), e = 0.002, sl = (zR(xs + e, rB) - zR(xs - e, rB)) / (2 * e); sA.fix = -Math.atan(sl) - th; } }   // (table4: FOR SALE parallel to the top's back edge right behind it)
    pdSoft(sh, xm, zIt(xm) + 0.01, y + 0.0006, shs[0], shs[1], 0.42).rotation.z = th;
    const zt = (x) => zR(x, tagR), ta = Math.max(xl1, pnUX(K, cl + 4, y, zt(xm))), tb = Math.min(xr1, pnUX(K, cr - 4, y, zt(xm))), tw = Math.min(0.3, 0.8 * (tb - ta)), tx = (ta + tb) / 2;
    const tag = pdTag(g, lockIt ? en + ' · LOCKED' : en, tw, tagD, tx, y, zt(tx), { font: 72 }); tag.rotation.y = -Math.atan(pnDz(K, tx));
    const Lb = band(g, j); const C4 = avO('AVSV') === 'C';
    if (C4 && key === 'srv') { tag.visible = false; window.AVSRV = { G, Lb, y, zm: (x) => zR(x, (bandB + bandF) / 2), part: pt.obj, xm, zc: zIt(xm) }; }   // (table4: the service keeps ONE label (the band's), centred under the button by avSrvCentre)
    pdMergeGroup(g); g.traverse(m => { if (m.isMesh && m.material !== M.TOP2 && !m.userData.pdPlate && m.material !== Lb.mat && !(m.material && (m.material.transparent || m.material.type === 'MeshBasicMaterial'))) m.castShadow = true; });
    els.push({ key, kind, en, nm, grp: PDGRP[key], cab: cx(j) + cx(j + 1) < 412 ? 'L' : 'R', place: 'top', row: -1, col: j, cell: [cx(j), cx(j + 1)], g, part: pt.obj, model: pt.model, sign: pt.sign, locked: lockIt, label: tag, scale: AMF.sc, top: xF(pt.top) }); });
  return { n, x: [xa, xb], y: [xF(pnS(K, 0, y, zB(0))[1], 1), xF(pnS(K, 0, y, zF(0))[1], 1)], G }; };
const AVF = { tr: 0.165, sc: 0.068, rItem: 0.275, shadow: [0.36, 0.36] };   // (the signs' round: the turntable 16.5 cm, the models 1:14.7, their middle 27.5 cm behind the top's front edge)
// ======== A VERSION: AMA's chest (PZA v1's, the nuts in a drawer) with AV's top ========
const avBuild = (S, out, v) => { const Z = AVT, s0 = PNF[4].stileX; PNF[4].stileX = PZF.stileX; let L; try { L = pnLay(4); } finally { PNF[4].stileX = s0; }
  L.cols.forEach(C => { C.rows = Z[C.side].map(pzRow); C.hold = C.side === 'L' ? -0.8 : 0.8; });
  const M = pdMats(), A = L.A, els = [], F = PR.group(); F.position.set(0, 0, 0.2); F.rotation.y = 0.3; F.updateMatrixWorld(true);
  pdHideGame(S, out); const body = new T.Group(); F.add(body); const accB = pdAcc(); pnBody(accB, M, L);
  const D = Object.assign({}, PNL.dr, { mats: { T: M.FELT, W: M.FELTW, col: PDCOL.blu } }), lay = { v, R: L.R, H: A.H, D: A.D, P: A.P, open: A.open, face: xF(L.face), wb: xF(L.wb), wc: xF(L.wc), rows: {} }, groups = [body];
  const top = avTop(F, M, L, Z, els, v); lay.top = { n: top.n, x: top.x, y: top.y }; groups.push(top.G);
  L.cols.forEach((C) => { const K = C.K; C.G = new T.Group(); C.G.position.set(K.O[0], 0, K.O[1]); C.G.rotation.y = K.a; F.add(C.G); C.sh = new T.Group(); C.G.add(C.sh); C.acc = pnAccT(accB, new T.Matrix4().makeRotationY(K.a).setPosition(K.O[0], 0, K.O[1])); groups.push(C.G);
    F.updateMatrixWorld(true); D.dd = A.D - PNL.dr.dd - (L.R - C.rF);
    const rTop = C.rF + PNL.over, occ = [{ z: (x) => pnZr(K, x, rTop), h: A.H - PNL.topT - 0.004 }];
    L.drs.forEach((d0) => { const dr = Object.assign({}, d0);
      if (dr.open < 0) { pnDrawerShut(C, M, D, dr); return; }
      dr.p = C.pulls[dr.open]; const groupsK = C.rows[dr.open], ytop = dr.t - D.under, zf = (x) => pnZr(K, x) + dr.p, zfi = (x) => zf(x) - D.fT;
      const zLo = (x) => Math.max(...occ.map(e => pnRay(K, e.z(x), e.h, ytop))), zHi = (x) => pnRay(K, zfi(x), dr.t, ytop);
      dr.x = [C.edge[0] ? 1.5 : pnSpan(K, 0, C.xo0, ytop, zLo(C.xo0), zHi(C.xo0)), C.edge[1] ? 410.5 : pnSpan(K, 1, C.xo1, ytop, zLo(C.xo1), zHi(C.xo1))];
      lay.rows[C.side + dr.open] = pnDrawer(F, C, M, D, dr.open, dr, groupsK, occ.slice(), els);
      occ.push({ z: (x) => zf(x), h: dr.b }, { z: (x) => zf(x) + D.pullD, h: dr.t - D.pullH }); }); });
  accB.flush(body, { cast: (m) => m === M.NV || m === M.TOP2 });
  F.updateMatrixWorld(true); groups.forEach(g => { if (!out.frames.includes(g)) out.frames.push(g); }); pdNanCheck(F);
  const mt = els.filter(e => e.place === 'top').map(e => ({ en: e.en, top: e.top, verts: (() => { let n = 0; e.g.traverse(q => { if (q.isMesh) n += q.geometry.attributes.position.count; }); return n; })(), model: e.model ? e.model[0].geometry.attributes.position.count : 0 })); console.error('AVTOP ' + JSON.stringify(mt));
  console.error('AVLIFT ' + JSON.stringify({ patched: AV.lf, type: typeof PBL !== 'undefined' ? PBL.type : null }));
  out.drawers = []; out.aeroDr = null; out.xc = { opt: 'av_' + v, groups: [], extra: [] }; out.s6 = { L: lay, els, F, cabs: { L: body, R: new T.Group() }, names: [] }; return out; };
const avFronts = (S, out, o = {}) => { if (AV.v >= 1 && AV.v <= 6) { pdHideGift(S); return avBuild(S, out, AV.v); } return amaFronts(S, out, o); };
