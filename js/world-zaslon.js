/* Grafika 03: the big screen by the main grandstand (the user's choice on the Odločitve page, 3. 11. 2026, »Velik zaslon ob glavni tribuni z
   dirko v živo«: »Da, naredi«). On the real circuits with pits (def.pit; not the test tracks) an LED wall stands by the main grandstand on two
   truss legs, turned towards the stand and the cars coming down the straight, low enough for the camera behind the car to see it (SPOT: where).
   At the graphics detail VISOKA it shows the race live from the replay's TV cameras on their posts beside the track (Render: one more small
   picture, 512 x 256, drawn about 20 times a second and only while the screen is in the view; the leader, or the player's own car while it
   comes down the straight to the screen), with a small tower of the first three and LIVE over it; at SREDNJA and NIZKA, and with the battery
   saver, a still: the standings without names (place, the car's colour and number; the laps; the circuit's outline), drawn again only when the
   order changes. No logos, no names, no words but LIVE.
   World.zaslon.build(world, track, tier): after World.build (Render.buildWorld): the rig into world.root, world.dyn.zaslon; at VISOKA then
   World.zaslon.prep(Z, X): the TV director by the straight, its posts checked with the world while it loads.
   World.zaslon.step(Z, X): every frame (Render.frame, after the picture: what the screen shows from the next frame on): the standings, the TV
   director; true when the live picture is to be drawn now (Render's zaslonFeed draws it: World.zaslon.draw). */
(function () {
  if (typeof World === 'undefined' || typeof THREE === 'undefined') return;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // where on each track: d metres after the start line, side +1 right / -1 left of the driving direction, off metres from the road's centre
  // line, turn degrees towards the cars coming (0: square to the road), W x H metres, y the bottom edge over the ground; none on Detroit and
  // Monterey (the US tracks go to test, the user's decision 5. 11. 2026), nor on Toronto, Trois-Rivières and Bang Saen (street tracks, test tracks since 5. 11. 2026); a new track with pits keeps its place in its own file (zaslon: { d,
  // side, off[, turn] }, the rest as below; node tools/zaslon-mesto.mjs <id> finds one)
  const SPOT = {
    bathurst: { d: 192, side: 1, off: 19, turn: 58, W: 10, H: 5, y: 2.4 },   // (at the end of the grandstand, shortened for it: js/tracks/bathurst.js)
    cpalace: { d: -67, side: -1, off: 14, turn: 50, W: 10, H: 5, y: 2.4 },
    montreal: { d: -182, side: 1, off: 14.2, turn: 50, W: 10, H: 5, y: 2.4 },
    rbring: { d: 147, side: -1, off: 16.5, turn: 50, W: 10, H: 5, y: 2.4 },
    spa: { d: -21, side: -1, off: 15.7, turn: 50, W: 10, H: 5, y: 2.4 },
  };
  const RW = 512, RH = 256;   // the picture, live and still (2:1, as the wall)
  const FPS = 20;             // the live picture's frames a second
  const SEE = 320;            // drawn live only while the camera is nearer than this (metres): farther the wall is a few pixels
  let last = null;            // the screen of the world built last: its own GPU resources freed when the next world is built

  function free(Z) {
    if (!Z) return;
    if (Z.rt) Z.rt.dispose();
    Z.still.dispose(); Z.ovl.tex.dispose(); Z.ovl.mesh.geometry.dispose(); Z.ovl.mesh.material.dispose();
  }

  /* ---------------- the rig: a dark cabinet with the picture on its front, two steel legs behind it, braces and concrete ballast; one
     vertex-coloured mesh in world coordinates (the face's frame: r to the viewer's right, up, f towards the viewers) ---------------- */
  function rig(c, f, r, gy, sp) {
    const P = [], N = [], C = [], W = sp.W, H = sp.H, y0 = gy + sp.y;
    const at = (a, y, b) => [c[0] + r[0] * a + f[0] * b, y, c[1] + r[1] * a + f[1] * b];
    const quad = (A, B, Cc, D, n, col) => { for (const v of [A, B, Cc, A, Cc, D]) { P.push(v[0], v[1], v[2]); N.push(n[0], n[1], n[2]); C.push(col[0], col[1], col[2]); } };
    const dirN = (a, y, b) => [r[0] * a + f[0] * b, y, r[1] * a + f[1] * b];
    // a box in the face's frame: a along r (a0..a1), y (y0..y1), b along f (b0..b1); a top shade a little lighter
    function box(a0, a1, ya, yb, b0, b1, col, top) {
      const p = (a, y, b) => at(a, y, b), t = top || col;
      quad(p(a0, ya, b1), p(a1, ya, b1), p(a1, yb, b1), p(a0, yb, b1), dirN(0, 0, 1), col);     // +f
      quad(p(a1, ya, b0), p(a0, ya, b0), p(a0, yb, b0), p(a1, yb, b0), dirN(0, 0, -1), col);    // -f
      quad(p(a1, ya, b1), p(a1, ya, b0), p(a1, yb, b0), p(a1, yb, b1), dirN(1, 0, 0), col);     // +r
      quad(p(a0, ya, b0), p(a0, ya, b1), p(a0, yb, b1), p(a0, yb, b0), dirN(-1, 0, 0), col);    // -r
      quad(p(a0, yb, b1), p(a1, yb, b1), p(a1, yb, b0), p(a0, yb, b0), [0, 1, 0], t);           // top
    }
    // a beam from p to q (world points), w thick: its four sides
    function beam(p, q, w, col) {
      const ax = q[0] - p[0], ay = q[1] - p[1], az = q[2] - p[2], al = Math.hypot(ax, ay, az) || 1, A = [ax / al, ay / al, az / al];
      let s1 = [A[2], 0, -A[0]]; const l1 = Math.hypot(s1[0], s1[2]); s1 = l1 > 1e-4 ? [s1[0] / l1, 0, s1[2] / l1] : [1, 0, 0];   // (cross(A, up))
      const s2 = [s1[1] * A[2] - s1[2] * A[1], s1[2] * A[0] - s1[0] * A[2], s1[0] * A[1] - s1[1] * A[0]], h = w / 2;
      const o = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([u, v]) => [(s1[0] * u + s2[0] * v) * h, (s1[1] * u + s2[1] * v) * h, (s1[2] * u + s2[2] * v) * h]);
      for (let k = 0; k < 4; k++) {
        const a = o[k], b = o[(k + 1) % 4], nl = Math.hypot(a[0] + b[0], a[1] + b[1], a[2] + b[2]) || 1, n = [(a[0] + b[0]) / nl, (a[1] + b[1]) / nl, (a[2] + b[2]) / nl];
        const pa = [p[0] + a[0], p[1] + a[1], p[2] + a[2]], pb = [p[0] + b[0], p[1] + b[1], p[2] + b[2]], qa = [q[0] + a[0], q[1] + a[1], q[2] + a[2]], qb = [q[0] + b[0], q[1] + b[1], q[2] + b[2]];
        quad(pb, pa, qa, qb, n, col);
      }
    }
    const DARK = [0.07, 0.075, 0.085], DARK2 = [0.13, 0.135, 0.15], STEEL = [0.52, 0.54, 0.57], STEEL2 = [0.62, 0.64, 0.67], CONC = [0.6, 0.59, 0.56];
    box(-W / 2 - 0.18, W / 2 + 0.18, y0 - 0.18, y0 + H + 0.18, -0.6, -0.04, DARK, DARK2);   // the cabinet (its front a black bezel round the picture)
    box(-W / 2 - 0.3, W / 2 + 0.3, y0 + H + 0.18, y0 + H + 0.3, -0.75, 0.12, DARK2);         // the cap over it
    const leg = W / 2 - 1.3, gyL = sp.gL, gyR = sp.gR;
    for (const [a, g] of [[-leg, gyL], [leg, gyR]]) {
      box(a - 0.2, a + 0.2, g - 0.4, y0 + H - 0.3, -1.05, -0.65, STEEL, STEEL2);              // a leg (a square truss tower, seen as one post)
      box(a - 0.6, a + 0.6, g - 0.3, g + 0.35, -1.75, 0.05, CONC, CONC);                     // its ballast block
      beam(at(a, y0 + 0.4, -1.0), at(a, g + 0.3, -3.1), 0.22, STEEL);                         // a raking brace to the back
      box(a - 0.35, a + 0.35, g - 0.3, g + 0.3, -3.5, -2.8, CONC, CONC);                      // its foot
    }
    box(-leg, leg, y0 - 0.55, y0 - 0.25, -1.0, -0.7, STEEL, STEEL2);                          // the beams between the legs: under the cabinet
    box(-leg, leg, y0 + H * 0.55, y0 + H * 0.55 + 0.25, -1.0, -0.72, STEEL, STEEL2);          // and behind it
    beam(at(-leg, (gyL + y0) / 2, -0.85), at(leg, y0 - 0.5, -0.85), 0.16, STEEL);             // a cross brace between the legs, low
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.computeBoundingSphere();
    return g;
  }

  /* ---------------- the still: the standings without names ---------------- */
  const css = (h) => typeof h === 'number' ? '#' + (h >>> 0).toString(16).padStart(6, '0').slice(-6) : String(h || '#888');
  function lapIcon(x, cx, cy, rr, col) {   // a lap: a circle with an arrow head
    x.strokeStyle = col; x.fillStyle = col; x.lineWidth = rr * 0.32; x.beginPath(); x.arc(cx, cy, rr, -Math.PI * 0.35, Math.PI * 1.45); x.stroke();
    const a = -Math.PI * 0.35, ex = cx + Math.cos(a) * rr, ey = cy + Math.sin(a) * rr;
    x.beginPath(); x.moveTo(ex + rr * 0.55, ey - rr * 0.1); x.lineTo(ex - rr * 0.1, ey - rr * 0.6); x.lineTo(ex - rr * 0.2, ey + rr * 0.45); x.closePath(); x.fill();
  }
  function outline(Z) {   // the circuit's outline (a path in the board's right part) and the screen's place on it
    const T = Z.T, n = T.N || T.px.length, step = Math.max(1, Math.floor(n / 300)), pts = [];
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < n; i += step) { const x = T.px[i], z = T.pz[i]; pts.push([x, z]); if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    const bw = 170, bh = 170, k = Math.min(bw / Math.max(1, x1 - x0), bh / Math.max(1, z1 - z0)), ox = 326 + (bw - (x1 - x0) * k) / 2, oz = 66 + (bh - (z1 - z0) * k) / 2;
    const map = (x, z) => [ox + (x - x0) * k, oz + (z - z0) * k], i0 = T.idx(T.startS || 0);
    return { pts: pts.map(([x, z]) => map(x, z)), start: map(T.px[i0], T.pz[i0]), here: map(Z.cx, Z.cz) };
  }
  function orderOf(R) {
    const O = R.order && R.order.length === R.cars.length ? R.order : R.cars.slice().sort((a, b) => b.dist - a.dist);
    return O.filter(c => !c.isSafety && !c.ghost);
  }
  const lapsN = (R) => R && R.laps > 0 && R.laps < 100 ? R.laps : 0;   // (an endless session, the title's demo, practice: no laps shown)
  function lapOf(R, O) { const L = O[0], n = lapsN(R); return L && n ? clamp(L.lap || 1, 1, n) : 0; }   // (the leader's lap: Core counts from 1)
  function drawBoard(Z, R) {
    const x = Z.bx, w = RW, h = RH;
    const bg = x.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0e1a2e'); bg.addColorStop(1, '#060a12'); x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.fillStyle = '#16233b'; x.fillRect(0, 0, w, 50); x.fillStyle = '#e8b21a'; x.fillRect(0, 50, w, 4);   // the header band
    x.textBaseline = 'middle';
    const O = R ? orderOf(R) : [], P = R ? R.player : null;
    if (lapsN(R)) { lapIcon(x, 30, 26, 13, '#ffffff'); x.font = 'bold 30px Arial, sans-serif'; x.fillStyle = '#ffffff'; x.textAlign = 'left'; x.fillText(lapOf(R, O) + '/' + lapsN(R), 54, 27); }
    // the chequered flag at the right of the header
    for (let q = 0; q < 4; q++) for (let p = 0; p < 6; p++) { x.fillStyle = (p + q) % 2 ? '#111' : '#f4f4f4'; x.fillRect(w - 78 + p * 9, 10 + q * 8, 9, 8); }
    x.fillStyle = '#9aa3ad'; x.fillRect(w - 82, 8, 3, 38);
    // five rows: the first five, or four and the player
    let rows = O.slice(0, 5).map((c, i) => [i, c]);
    const pi = P ? O.indexOf(P) : -1; if (pi >= 5) rows = rows.slice(0, 4).concat([[pi, P]]);
    rows.forEach(([i, c], k) => {
      const y = 62 + k * 38, me = c === P;
      x.fillStyle = me ? '#24365a' : k % 2 ? '#0c1526' : '#101c31'; x.fillRect(8, y, 306, 34);
      if (k === 4 && pi >= 5) { x.fillStyle = '#e8b21a'; x.fillRect(8, y - 3, 306, 2); }
      x.textAlign = 'right'; x.font = 'bold 28px Arial, sans-serif'; x.fillStyle = i === 0 ? '#ffd23a' : '#ffffff'; x.fillText(String(i + 1), 52, y + 18);
      x.fillStyle = css(c.color); x.fillRect(62, y + 4, 12, 26);
      x.fillStyle = '#f2f2f2'; x.fillRect(84, y + 4, 56, 26); x.fillStyle = '#111'; x.textAlign = 'center'; x.font = 'bold 22px Arial, sans-serif'; x.fillText(String(c.num || ''), 112, y + 18);
      if (c.finished) { for (let q = 0; q < 3; q++) for (let p = 0; p < 4; p++) { x.fillStyle = (p + q) % 2 ? '#111' : '#f4f4f4'; x.fillRect(282 + p * 7, y + 7 + q * 7, 7, 7); } }
      else if (c.inPit) { x.fillStyle = '#e8b21a'; x.fillRect(272, y + 9, 34, 16); }
    });
    // the circuit
    const M = Z.map; x.lineJoin = 'round'; x.lineCap = 'round';
    x.strokeStyle = '#2a3a58'; x.lineWidth = 11; x.beginPath(); M.pts.forEach(([a, b], k) => k ? x.lineTo(a, b) : x.moveTo(a, b)); if (!Z.T.open) x.closePath(); x.stroke();
    x.strokeStyle = '#d6dee9'; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#ffffff'; x.fillRect(M.start[0] - 6, M.start[1] - 6, 12, 12); x.fillStyle = '#111'; x.fillRect(M.start[0] - 6, M.start[1] - 6, 6, 6); x.fillRect(M.start[0], M.start[1], 6, 6);
    x.fillStyle = '#e8b21a'; x.beginPath(); x.arc(M.here[0], M.here[1], 7, 0, Math.PI * 2); x.fill();
    Z.still.needsUpdate = true;
  }
  // the live picture's graphics (a transparent layer drawn over the TV picture in the same target): the first three and the car followed,
  // the laps, LIVE
  function drawOvl(Z, R) {
    const x = Z.ox, w = RW; x.clearRect(0, 0, w, RH); x.textBaseline = 'middle';
    const O = R ? orderOf(R) : [], F = Z.who, fi = F ? O.indexOf(F) : -1;
    let rows = O.slice(0, 3).map((c, i) => [i, c]); if (fi >= 3) rows.push([fi, F]);
    const H0 = 30, top = 12, n = rows.length + (lapsN(R) ? 1 : 0);
    x.fillStyle = 'rgba(8,12,22,.78)'; x.fillRect(10, top, 132, n * H0 + 6);
    let k = 0;
    if (lapsN(R)) { lapIcon(x, 28, top + 3 + H0 / 2, 9, '#ffffff'); x.font = 'bold 22px Arial, sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'left'; x.fillText(lapOf(R, O) + '/' + lapsN(R), 44, top + 4 + H0 / 2); k = 1; }
    for (const [i, c] of rows) {
      const y = top + 3 + k * H0; k++;
      if (c === F) { x.fillStyle = 'rgba(232,178,26,.9)'; x.fillRect(10, y, 4, H0 - 2); }
      x.textAlign = 'right'; x.font = 'bold 22px Arial, sans-serif'; x.fillStyle = '#fff'; x.fillText(String(i + 1), 46, y + H0 / 2);
      x.fillStyle = css(c.color); x.fillRect(54, y + 4, 9, H0 - 8);
      x.fillStyle = '#f2f2f2'; x.fillRect(70, y + 4, 46, H0 - 8); x.fillStyle = '#111'; x.textAlign = 'center'; x.font = 'bold 19px Arial, sans-serif'; x.fillText(String(c.num || ''), 93, y + H0 / 2);
    }
    x.fillStyle = 'rgba(8,12,22,.78)'; x.fillRect(w - 112, 12, 100, 34); x.fillStyle = '#e02424'; x.beginPath(); x.arc(w - 94, 29, 8, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff'; x.font = 'bold 22px Arial, sans-serif'; x.textAlign = 'left'; x.fillText('LIVE', w - 80, 30);
    Z.ovl.tex.needsUpdate = true;
  }
  // what the standings show (drawn again only when this changes)
  function keyOf(Z, R, live) {
    const O = R ? orderOf(R) : []; let s = (live ? 'L' : 'S') + (R ? lapOf(R, O) + '/' + lapsN(R) : '');
    const n = live ? 3 : 5; for (let i = 0; i < Math.min(n, O.length); i++) s += ',' + O[i].num + (O[i].finished ? 'f' : O[i].inPit ? 'p' : '');
    const P = live ? Z.who : R && R.player; if (P) s += '|' + O.indexOf(P) + ':' + P.num;
    return s;
  }

  function build(world, track, tier) {
    free(last); last = null;
    const old = world && world.dyn && world.dyn.zaslon; if (old && old.grp.parent) { old.grp.parent.remove(old.grp); old.frame.geometry.dispose(); old.frame.material.dispose(); old.face.geometry.dispose(); old.face.material.dispose(); }   // (built again on the same world)
    if (world && world.dyn) world.dyn.zaslon = null;
    const def = track && track.def; if (!def || def.test || !def.pit || !world || !world.root || !world.dyn) return null;
    const own = def.zaslon || SPOT[def.id]; if (!own) return null;
    const sp = Object.assign({ turn: 50, W: 10, H: 5, y: 2.4 }, own);   // (a track's own place in its file: zaslon: { d, side, off })
    const T = track, L = T.len, s = (((T.startS || 0) + sp.d) % L + L) % L, i = T.idx(s), j = T.idx(s + 4);
    let tx = T.px[j] - T.px[i], tz = T.pz[j] - T.pz[i]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const nx = T.nx[i] * sp.side, nz = T.nz[i] * sp.side, a = sp.turn * Math.PI / 180;
    const cx = T.px[i] + nx * sp.off, cz = T.pz[i] + nz * sp.off;
    let fx = -nx * Math.cos(a) - tx * Math.sin(a), fz = -nz * Math.cos(a) - tz * Math.sin(a); const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;   // (towards the road, turned to the cars coming)
    const rx = fz, rz = -fx;   // (the viewer's right)
    const gH = world.groundH || ((x, z) => (T.hy ? T.hy[T.nearestIdx(x, z)] : 0)), leg = sp.W / 2 - 1.3;
    const g = (x, z) => { const v = gH(x, z); return Number.isFinite(v) ? v : (T.hy ? T.hy[i] : 0); };
    const gL = g(cx - rx * leg - fx * 0.85, cz - rz * leg - fz * 0.85), gR = g(cx + rx * leg - fx * 0.85, cz + rz * leg - fz * 0.85), gy = Math.max(gL, gR, g(cx, cz));
    const S = Object.assign({}, sp, { gL, gR });
    const grp = new THREE.Group(); grp.name = 'zaslon';
    const frame = new THREE.Mesh(rig([cx, cz], [fx, fz], [rx, rz], gy, S), new THREE.MeshLambertMaterial({ vertexColors: true }));
    frame.castShadow = tier >= 1; frame.receiveShadow = true; frame.matrixAutoUpdate = false; frame.name = 'zaslon-okvir'; grp.add(frame);   // (NIZKA: no shadow pass for it, the phone budget)
    // the picture: a quad on the cabinet's front, unlit (it glows at night); the still's canvas, or the live target's picture
    const bc = document.createElement('canvas'); bc.width = RW; bc.height = RH; bc.__zs = true;
    const still = new THREE.CanvasTexture(bc); still.anisotropy = 4;
    const y0 = gy + sp.y, W = sp.W, H = sp.H, e = 0.02;
    const A = [cx - rx * W / 2 + fx * e, y0, cz - rz * W / 2 + fz * e], B = [cx + rx * W / 2 + fx * e, y0, cz + rz * W / 2 + fz * e];
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute([A[0], A[1], A[2], B[0], B[1], B[2], B[0], y0 + H, B[2], A[0], y0 + H, A[2]], 3));
    fg.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); fg.setIndex([0, 1, 2, 0, 2, 3]); fg.computeBoundingSphere();
    const face = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ map: still, color: 0xf2f2f2 }));
    face.castShadow = false; face.receiveShadow = false; face.matrixAutoUpdate = false; face.name = 'zaslon-slika'; grp.add(face);
    world.root.add(grp);
    // the live picture's graphics: a transparent canvas over the whole target, drawn by an orthographic camera after the TV picture
    const oc = document.createElement('canvas'); oc.width = RW; oc.height = RH; oc.__zs = true;   // (__zs: the tests read what is written on the screen's canvases)
    const otex = new THREE.CanvasTexture(oc); otex.generateMipmaps = false; otex.minFilter = THREE.LinearFilter;
    const omesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: otex, transparent: true, depthTest: false, depthWrite: false, fog: false }));
    const oscene = new THREE.Scene(); oscene.add(omesh); omesh.frustumCulled = false;
    const Z = { T, s, cx, cz, gy, y0, grp, face, frame, still, bx: bc.getContext('2d'), ox: oc.getContext('2d'),
      ovl: { tex: otex, mesh: omesh, scene: oscene, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) },
      sphere: new THREE.Sphere(new THREE.Vector3(cx, y0 + H / 2, cz), Math.hypot(W, H) / 2 + 1),
      cam: new THREE.PerspectiveCamera(20, RW / RH, 1, 900), rt: null, live: false, key: '', tb: 0, acc: 0, drawn: false, who: null, k: -1, ax: 0, az: 0, mine: false, map: null, info: { spot: sp, feeds: 0 } };
    Z.map = outline(Z); drawBoard(Z, null);
    world.dyn.zaslon = Z; last = Z;
    return Z;
  }

  const _m = new THREE.Matrix4(), _fr = new THREE.Frustum();
  // X: { race, dt, tier (the graphics detail the world was built at), low (the battery saver), cam (the camera behind the car), tvCams(),
  // tvPost(k) (the replay's TV posts, Render) }
  function step(Z, X) {
    const R = X.race; if (!R) return false;
    const live = X.tier >= 2 && !X.low;
    if (live !== Z.live) { Z.live = live; Z.key = ''; Z.tb = 0; Z.drawn = false; Z.face.material.map = Z.still;   // (live: the still until the first picture, draw)
      if (live && !Z.rt) { Z.rt = new THREE.WebGLRenderTarget(RW, RH, { minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false, generateMipmaps: true }); Z.rt.texture.anisotropy = 4; } }
    const dt = Math.max(0, X.dt || 0);
    // the car followed: the leader; the player's own while it comes down the straight to the screen (300 m before it to 40 m past it)
    if (live) {
      const T = Z.T, L = T.len, P = R.player, O = orderOf(R), lead = O[0] || P;
      let who = lead; const sp = P && P.q && Number.isFinite(P.q.s) ? P.q.s : null;
      if (sp != null && !T.open) { const ah = ((Z.s - sp) % L + L) % L; if (Z.mine ? ah < 340 || ah > L - 40 : ah < 300) who = P; }
      Z.mine = who === P && who !== lead; if (who !== Z.who) { Z.who = who; Z.k = -1; Z.tb = 0; }
    }
    if ((Z.tb -= dt) <= 0) { Z.tb = 0.5; const k = keyOf(Z, R, live); if (k !== Z.key) { Z.key = k; if (live) drawOvl(Z, R); else drawBoard(Z, R); } }
    if (!live) return false;
    Z.acc += dt;
    // drawn only while the screen is in the view, near enough to be seen
    const cam = X.cam, dx = cam.position.x - Z.cx, dz = cam.position.z - Z.cz;
    if (dx * dx + dz * dz > SEE * SEE) return false;
    cam.updateMatrixWorld(); _m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); _fr.setFromProjectionMatrix(_m);
    if (!_fr.intersectsSphere(Z.sphere)) return false;
    if (Z.drawn && Z.acc < 1 / FPS) return false;
    // the TV camera: the replay's post ahead of the car until it is 60 m past it (Render's tvCams; by the straight the director's, prep),
    // zoomed so the car fills a third of the picture's width, panning smoothly after it
    const who = Z.who; if (!who) return false;
    const T = Z.T, C = X.tvCams(), n = C.length, s = who.q && Number.isFinite(who.q.s) ? who.q.s : 0;
    const k = postOf(Z, s, n), p = X.tvPost(k, 1); if (!p) return false;   // (a post not yet checked with the world: a ray or two a frame, the last picture meanwhile)
    const ty = (who.y || 0) + 0.7, ea = Z.drawn ? 1 - Math.exp(-Math.min(Z.acc, 0.5) * 9) : 1;
    if (k !== Z.k) { Z.k = k; Z.ax = who.x; Z.az = who.z; } else { Z.ax += (who.x - Z.ax) * ea; Z.az += (who.z - Z.az) * ea; }
    const d = Math.hypot(p.x - Z.ax, p.y - ty, p.z - Z.az), fov = clamp(2 * Math.atan(3.6 / Math.max(1, d)) * 180 / Math.PI, 3, 50);
    const tc = Z.cam; tc.position.set(p.x, p.y, p.z); tc.lookAt(Z.ax, ty, Z.az); if (Math.abs(tc.fov - fov) > 0.01) { tc.fov = fov; tc.updateProjectionMatrix(); } tc.updateMatrixWorld();
    Z.dist = d; Z.acc = 0; Z.drawn = true; Z.info.feeds++;
    return true;
  }

  // the live picture into its target (Render's zaslonFeed sets the scene up for it: the fog, the sky, the cars out of the main view): the TV
  // camera's view, then the graphics over it; the shadows as the main view drew them (not again), the screen itself not in its own picture
  function draw(Z, renderer, scene) {
    const rt0 = renderer.getRenderTarget(), ac = renderer.autoClear, sh = renderer.shadowMap.autoUpdate, au = scene.autoUpdate, I = renderer.info, ar = I.autoReset, c0 = I.render.calls, t0 = I.render.triangles;
    renderer.shadowMap.autoUpdate = false; scene.autoUpdate = false; I.autoReset = false; Z.face.visible = false; Z.rt.texture.generateMipmaps = false; Z.ren = renderer;
    try {
      renderer.setRenderTarget(Z.rt); renderer.render(scene, Z.cam);
      Z.rt.texture.generateMipmaps = true; renderer.autoClear = false; renderer.render(Z.ovl.scene, Z.ovl.cam);
      Z.face.material.map = Z.rt.texture;
    } finally {
      Z.info.calls = I.render.calls - c0; Z.info.tris = I.render.triangles - t0;   // (what one picture costs: its draws and triangles, the tests)
      renderer.autoClear = ac; renderer.setRenderTarget(rt0); renderer.shadowMap.autoUpdate = sh; scene.autoUpdate = au; I.autoReset = ar; Z.face.visible = true; Z.rt.texture.generateMipmaps = true;
    }
  }

  // the TV director by the straight, while the player comes down it to the screen: for every DIR_S metres of the road from DIR0 before the
  // screen to DIR1 past it, the post that films a car there: the replay's post ahead of it (Render's tvPost, checked with the world), else
  // the one behind it or the next one, the nearer that sees the road there (X.sees: a ray into the world; the replay checks its posts only
  // from 100 m before them to 30 m past, and the gap over the line to the first post is longer); a lone other between two the same: those
  // (no cut and back). Render calls it when it builds the world (VISOKA), not in the race: Z.dir
  const DIR0 = -360, DIR1 = 60, DIR_S = 20;
  function prep(Z, X) {
    const T = Z.T, L = T.len, C = X.tvCams(), n = C.length, dir = [];
    for (let d = DIR0; d <= DIR1; d += DIR_S) {
      const s = (((Z.s + d) % L) + L) % L, i = T.idx(s), x = T.px[i], y = (T.hasElev && T.hy ? T.hy[i] : 0) + 0.8, z = T.pz[i], k0 = Math.floor(s / 170) % n;
      const sees = (k) => { const p = X.tvPost(k); return X.sees(p.x, p.y, p.z, x, y, z); }, far = (k) => { const p = X.tvPost(k); return Math.hypot(p.x - x, p.z - z); };
      let k = k0, a = ((s - X.tvPost(k0).s) % L + L) % L; if (a > L / 2) a -= L;
      if (n > 2 && (a < -100 || a > 30) && !sees(k0)) { const alt = [(k0 + n - 1) % n, (k0 + 1) % n].sort((p, q) => far(p) - far(q)); for (const b of alt) if (sees(b)) { k = b; break; } }   // (from 100 m before the post to 30 m past it the replay's check has seen the road)
      dir.push(k);
    }
    for (let j = 1; j < dir.length - 1; j++) if (dir[j - 1] === dir[j + 1] && dir[j] !== dir[j - 1]) dir[j] = dir[j - 1];
    Z.dir = dir; return dir;
  }
  function postOf(Z, s, n) {   // the post filming a car at s (step)
    const T = Z.T, L = T.len;
    if (Z.dir) { let e = ((s - Z.s) % L + L) % L; if (e > L / 2) e -= L; if (e >= DIR0 - DIR_S / 2 && e < DIR1 + DIR_S / 2) return Z.dir[clamp(Math.round((e - DIR0) / DIR_S), 0, Z.dir.length - 1)]; }
    const k = Math.floor(s / 170) % n; return T.open ? clamp(k, 0, n - 1) : k;
  }

  World.zaslon = { build, step, draw, prep, SPOT, RW, RH, FPS };
})();
