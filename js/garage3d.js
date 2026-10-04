/* =========================================================================
   GARAGE 3D — the garage (garaza.html): the workshop, the car on its turntable lift, the parts of its upgrades, and an animation for
   every change (a new car drives in, a part is fitted, the car is washed, mended, serviced, painted).
   The cars are the race's own meshes (Render.garageCar); the room is a scene of its own, drawn with the renderer Render.init made.
   Car space: x forward, y up, z to the right (as the race's). The car stands on the turntable at the room's centre, its nose to +x.
   ========================================================================= */
const Garage3D = (function () {
  'use strict';
  const { clamp, lerp } = Core;
  const TAU = Math.PI * 2, V3 = THREE.Vector3;
  const EZ = {
    io: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    back: (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  };
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hexRgb = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];

  let renderer = null, scene = null, camera = null, W = 2, H = 1, time = 0, ready = false;
  let tt = null, ttTop = null, lift = 0, ttAng = 0, scis = null, env = null, cubeRT = null;
  let floorMat = null, refl = null, keyLight = null;
  let cur = null;   // the car on the turntable: { M, spec, v (Render's view), root, kit, parts, ... }
  let hud = () => {};   // (the page's overlay: hud(kind, data))
  const KEY_DIR = new V3(0.22, 1, 0.34).normalize();
  const SUN = new V3(0.48, 0.47, 0.74).normalize();   // (the sun outside: the key light's azimuth, 28 deg up, so the shadows inside and out fall alike)
  // the room's fixed lines (the room light's shader is made from them too): the window band (its height, a window's width, the windows'
  // middles along the back and the front wall), the wall washers on the back wall, the steel columns (x on the back and front walls,
  // z on the side walls, and the four corners; whatever stands at a wall keeps 0.2 m clear of them)
  const WIN = [3.45, 4.3], WW = 1.9, BACKW = [-5.9, -2.75, -0.35, 2.95, 6.1], FRONTW = [-6.2, -3.1, 0, 3.1, 6.2];
  const WASH_X = [-7.4, -4.2, 1.3, 4.6, 7.6], COLS = { backFront: [-4.75, 5.0], sides: [-2.8, 2.8, 6.5], corners: true };
  // the light (init sets it from the renderer): HDR (a half-float target), how bright the luminous things glow (EMI), the outside's
  // exposure (OUTK); NOREFL: the layer only the main camera draws (not the floor's mirror, not the cube map); GLOW: the glows painted
  // round the lights (less of them where the post pass's bloom glows too); lampMat: the ceiling's lamps (one material)
  let HDR = false, OUTK = 1, lampMat = null; const EMI = { hex: 1, led: 1, sign: 1, screen: 1, tail: 1, spark: 1 }, NOREFL = 1;
  const GLOW = { sign: 0.18, ring: 1, lamp: 1, blur: 28 };
  const emi = (hex, k) => new THREE.Color(hex).multiplyScalar(k);   // (a colour over 1: it glows in the HDR picture)

  /* ---------------- coroutines: every animation is a generator stepped once a frame with the frame's dt ---------------- */
  const tasks = [];
  let speed = 1;   // (a tap on the picture: the animation runs faster)
  function spawn(gen) { let res; const p = new Promise(r => { res = r; }); const t = { g: gen, res }; tasks.push(t); stepTask(t, 0); return p; }
  function stepTask(t, dt) { if (t.done) return; let r; try { r = t.g.next(dt); } catch (e) { console.error(e); r = { done: true }; } if (r.done) { t.done = true; t.res(r.value); } }
  let fast = 1;   // (tests: the animations' time runs this much faster)
  function runTasks(dt) { for (let i = 0; i < tasks.length; i++) stepTask(tasks[i], dt); for (let i = tasks.length - 1; i >= 0; i--) if (tasks[i].done) tasks.splice(i, 1); }
  function* wait(s) { let t = 0; while (t < s) t += yield; }
  function* tween(s, f, ez) { let t = 0; for (;;) { const u = s > 0 ? Math.min(1, t / s) : 1; f(ez ? ez(u) : u, u); if (u >= 1) return; t += yield; } }
  function* par(...gs) { const L = gs.filter(Boolean).map(g => ({ g, done: false })); let dt = 0; for (;;) { let all = true; for (const x of L) if (!x.done) { if (x.g.next(dt).done) x.done = true; else all = false; } if (all) return; dt = yield; } }
  // one show at a time: a change asked for while another plays waits for it
  let queue = Promise.resolve(), busy = 0;
  function play(mk) { busy++; viewTok++; autoSpin = false; if (busy === 1) hud('busy', true); const p = queue.then(() => spawn(mk())).finally(() => { busy--; if (!busy) { speed = 1; hud('busy', false); } }); queue = p.catch(() => {}); return p; }

  /* ---------------- textures (drawn once, no image files) ---------------- */
  function canvasTex(w, h, draw, rep) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  const TX = {};
  function makeTextures() {
    const R = Core.rng(4242);
    // the epoxy floor: a grey resin with fine flecks and a faint mottling (1 texture = 4 m; what changes over the room: TX.floorL)
    TX.floor = canvasTex(1024, 1024, (g, w, h) => {
      g.fillStyle = 'rgb(66,68,72)'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 24; i++) { const x = R() * w, y = R() * h, r = 60 + R() * 220, gr = g.createRadialGradient(x, y, 0, x, y, r), d = R() < 0.5;
        gr.addColorStop(0, d ? 'rgba(0,0,0,0.045)' : 'rgba(255,255,255,0.03)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      for (let i = 0; i < 16000; i++) { const v = R(); g.fillStyle = v < 0.5 ? 'rgba(20,22,26,0.35)' : v < 0.85 ? 'rgba(150,155,165,0.2)' : 'rgba(205,210,220,0.22)'; g.fillRect(R() * w, R() * h, 1 + (R() < 0.1), 1 + (R() < 0.1)); }
    }, true);
    // the floor's layout over the whole room (no repeat: x across, z up from the canvas's bottom): r its albedo (160 = x 1), g its gloss
    // (200 = x 1; the mirror image's strength and sharpness). The saw-cut joints, the dull scuffed lane from each door to the table and
    // round it, the tyres' tracks, the dust along the walls and in the doorways, a few soft patches (floorMaterial, the painted lines)
    TX.floorL = canvasTex(1024, 1024, (g, w, h) => {
      const Rl = Core.rng(4243), { x0, x1, z0, z1, door } = ROOM, sx = w / (x1 - x0), sz = h / (z1 - z0), M = () => g.setTransform(sx, 0, 0, -sz, -x0 * sx, h + z0 * sz);
      const rad = (x, z, r0, r1, col, a) => { const gr = g.createRadialGradient(x, z, r0, x, z, r1); gr.addColorStop(0, 'rgba(' + col + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gr; g.fillRect(x - r1, z - r1, r1 * 2, r1 * 2); };
      g.fillStyle = 'rgb(160,200,0)'; g.fillRect(0, 0, w, h); M();   // (from here on in metres)
      for (let i = 0; i < 30; i++) { const x = x0 + Rl() * (x1 - x0), z = z0 + Rl() * (z1 - z0), r = 1 + Rl() * 2, k = Rl();   // (soft patches: lighter, darker, glossier, duller)
        rad(x, z, 0, r, k < 0.3 ? '0,0,0' : k < 0.5 ? '255,255,0' : k < 0.75 ? '160,255,0' : '160,120,0', k < 0.3 ? 0.05 : k < 0.5 ? 0.03 : 0.07); }
      // the lanes the cars take: from each door to the table and round it, scuffed (duller, a little darker), most at the doors
      for (const sd of [-1, 1]) for (let x = 3.1; x < x1; x += 0.1) { const a = 0.08 + 0.2 * smooth(3.1, x1, x), gr = g.createLinearGradient(0, -1.9, 0, 1.9);
        gr.addColorStop(0, 'rgba(140,120,0,0)'); gr.addColorStop(0.18, 'rgba(140,120,0,' + a + ')'); gr.addColorStop(0.82, 'rgba(140,120,0,' + a + ')'); gr.addColorStop(1, 'rgba(140,120,0,0)'); g.fillStyle = gr; g.fillRect(sd > 0 ? x : -x - 0.1, -1.9, 0.1, 3.8); }
      g.lineWidth = 0.5; g.strokeStyle = 'rgba(140,125,0,0.12)'; g.beginPath(); g.arc(0, 0, 3.45, 0, TAU); g.stroke(); g.lineWidth = 0.25; g.stroke();
      // the doorways: grit walked and driven in from outside (lighter, matt), fading into the room
      for (const sd of [-1, 1]) { g.save(); g.translate(sd * x1, 0); g.scale(1, 1.6); rad(0, 0, 0, 1.9, '200,110,0', 0.35); g.restore(); }
      // the tyres' tracks: each wheel's line a few times over (other cars, other widths), darker and duller; most at the doors, fading
      // towards the table
      g.lineCap = 'round';
      for (const sd of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 4; k++) {
        const z = sz * (0.62 + Rl() * 0.3), j = () => (Rl() - 0.5) * 0.16, xa = sd * (x1 - 0.05), xb = sd * (3.15 + Rl() * 0.3), al = 0.06 + Rl() * 0.05;
        for (const [a, b, a0, a1] of [[xa, sd * (x1 - 1.6), 0.13, 0], [xa, xb, al, al * 0.35]]) { const s = g.createLinearGradient(a, 0, b, 0); s.addColorStop(0, 'rgba(8,6,4,' + a0 + ')'); s.addColorStop(1, 'rgba(8,6,4,' + a1 + ')');
          g.strokeStyle = s; g.lineWidth = 0.16 + Rl() * 0.1; g.beginPath(); g.moveTo(a, z + j()); g.bezierCurveTo(a + (b - a) * 0.33, z + j(), a + (b - a) * 0.66, z + j(), b, z + j() * 0.5); g.stroke(); } }
      g.lineWidth = 0.14; for (const [x, z, r, a] of [[-1.2, 6.4, 3.1, 4.1], [2.6, 6.9, 2.7, 3.3], [-6.4, -0.2, 2.4, -0.4]]) { g.strokeStyle = 'rgba(8,6,4,0.06)'; g.beginPath(); g.arc(x, z, r, a, a + 1.1); g.stroke(); }   // (a few arcs where one was turned)
      // the dust along the walls (not in the doorways) and in the corners
      const foot = (ax, az, bx, bz, nx, nz) => { const gr = g.createLinearGradient(ax, az, ax + nx * 0.6, az + nz * 0.6); gr.addColorStop(0, 'rgba(70,95,0,0.32)'); gr.addColorStop(1, 'rgba(70,95,0,0)'); g.fillStyle = gr;
        g.fillRect(Math.min(ax, bx, ax + nx * 0.6), Math.min(az, bz, az + nz * 0.6), Math.abs(bx - ax) + Math.abs(nx) * 0.6, Math.abs(bz - az) + Math.abs(nz) * 0.6); };
      foot(x0, z0, x1, z0, 0, 1); foot(x0, z1, x1, z1, 0, -1);
      for (const [x, n] of [[x0, 1], [x1, -1]]) for (let z = z0; z < z1 - 1e-3; z += 0.1) { const k = smooth(door - 0.2, door + 0.6, Math.abs(z + 0.05)), gr = g.createLinearGradient(x, 0, x + n * 0.6, 0);   // (thinning out into the doorway)
        gr.addColorStop(0, 'rgba(70,95,0,' + (0.32 * k).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(70,95,0,0)'); g.fillStyle = gr; g.fillRect(n > 0 ? x : x - 0.6, z, 0.6, 0.1); }
      for (const x of [x0, x1]) for (const z of [z0, z1]) rad(x, z, 0, 1, '60,80,0', 0.22);
      // the saw-cut joints (the table's hole hides them under it): a dark cut and its chipped edge (in pixels: crisp)
      g.setTransform(1, 0, 0, 1, 0, 0);
      for (const x of [-4.5, 0, 4.5]) { const p = Math.round((x - x0) * sx); g.fillStyle = 'rgba(20,10,0,0.9)'; g.fillRect(p - 1, 0, 2, h); g.fillStyle = 'rgba(215,150,0,0.4)'; g.fillRect(p + 1, 0, 1, h); }
      for (const z of [0, 4.5]) { const p = Math.round(h - (z - z0) * sz); g.fillStyle = 'rgba(20,10,0,0.9)'; g.fillRect(0, p - 1, w, 2); g.fillStyle = 'rgba(215,150,0,0.4)'; g.fillRect(0, p + 1, w, 1); }
    });
    // the walls: insulated sandwich panels laid across, 1.2 m a panel (their joints at 1.0, 2.2, 3.4, 4.6 m), fine ribs along them, a
    // butt joint every 3 m, a few streaks under the joints (1 texture = 3 m x 1.2 m; each panel's tint a shade apart: the wall's shader)
    TX.wall = canvasTex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h), jy = Math.round(h / 6);
      gr.addColorStop(0, 'rgb(57,58,61)'); gr.addColorStop(jy / h, 'rgb(55,56,59)'); gr.addColorStop(jy / h + 0.001, 'rgb(64,65,68)'); gr.addColorStop(1, 'rgb(57,58,61)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);   // (a panel: lighter at its top, under the joint above it)
      for (let y = jy % 32; y < h; y += 32) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y, w, 1); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, y + 1, w, 1); }
      for (let i = 0; i < 30; i++) { const x = R() * w, wd = 4 + R() * 12, l = 40 + R() * 80, s = g.createLinearGradient(0, jy, 0, jy + l); s.addColorStop(0, 'rgba(0,0,0,' + (0.03 + R() * 0.02).toFixed(3) + ')'); s.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = s; g.fillRect(x, jy, wd, l); }
      for (let i = 0; i < 6000; i++) { g.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'; g.fillRect(R() * w, R() * h, 2, 2); }
      const sh = g.createLinearGradient(0, jy + 2, 0, jy + 12); sh.addColorStop(0, 'rgba(0,0,0,0.12)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, jy + 2, w, 10);
      g.fillStyle = 'rgba(8,10,14,0.85)'; g.fillRect(0, jy - 2, w, 4); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(0, jy + 2, w, 2);
      g.fillStyle = 'rgba(8,10,14,0.4)'; g.fillRect(0, 0, 1, h); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(1, 0, 1, h);
    }, true);
    // the low wall: aluminium tread plate (1 texture = 1.5 m x 1 m)
    TX.plate = canvasTex(384, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgb(84,87,92)'); gr.addColorStop(0.5, 'rgb(100,103,108)'); gr.addColorStop(1, 'rgb(78,81,86)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) { g.fillStyle = 'rgba(255,255,255,' + (R() * 0.08).toFixed(3) + ')'; g.fillRect(R() * w, R() * h, R() * 30, 1); }
      for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) {
        g.save(); g.translate(x + 8, y + 8); g.rotate((((x / 8) + (y / 16)) % 2) ? 0.7 : -0.7);
        g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(-5, -1, 11, 3.4); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(-6, -2, 11, 2); g.restore(); }
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, w, 3);
    }, true);
    // carbon fibre: a 2 x 2 twill (the wing, the splitter, the skirts)
    TX.carbon = canvasTex(64, 64, (g, w, h) => {
      g.fillStyle = '#16181c'; g.fillRect(0, 0, w, h);
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
        const x = i * 8, y = j * 8, hor = ((i + j) >> 1) % 2 === 0, gr = hor ? g.createLinearGradient(x, y, x, y + 8) : g.createLinearGradient(x, y, x + 8, y);
        gr.addColorStop(0, '#2a2e35'); gr.addColorStop(0.5, '#4b515b'); gr.addColorStop(1, '#202329'); g.fillStyle = gr; g.fillRect(x + 0.5, y + 0.5, 7, 7);
      }
    }, true);
    TX.carbon.repeat.set(6, 6);
    // the pegboard over the bench: holes, the tools on it, each on its outline painted in yellow (a shadow board; two of them in use)
    TX.peg = canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = 'rgb(48,52,60)'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(8,9,12,0.9)'; for (let y = 12; y < h; y += 24) for (let x = 12; x < w; x += 24) { g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); }
      const tool = (x, y, a, f, gone) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#d9ad2b';   // (f(true): the tool in its colours)
        for (let k = 0; k < 8; k++) { const dx = Math.cos(k / 8 * TAU) * 4, dy = Math.sin(k / 8 * TAU) * 4; g.translate(dx, dy); f(); g.translate(-dx, -dy); }   // (the outline: the shape grown)
        if (gone) { g.fillStyle = 'rgb(40,43,50)'; f(); } else { g.fillStyle = 'rgba(0,0,0,0.45)'; g.translate(5, 6); f(); g.translate(-5, -6); g.fillStyle = '#c8ced8'; f(true); } g.restore(); };
      const wrench = (L) => () => { g.fillRect(-L / 2, -7, L, 14); g.beginPath(); g.arc(-L / 2, 0, 17, 0, TAU); g.arc(L / 2, 0, 15, 0, TAU); g.fill(); };
      for (let i = 0; i < 7; i++) tool(110 + i * 52, 150 + i * 6, Math.PI / 2, wrench(150 + i * 14), i === 4);
      const sd = (col) => (real) => { g.fillRect(-4, -90, 8, 110); if (real) g.fillStyle = col; g.fillRect(-13, 20, 26, 70); };
      for (let i = 0; i < 6; i++) tool(520 + i * 44, 170, 0, sd(['#b8443a', '#c9a640', '#3f6fa8', '#b8443a', '#c9a640', '#3f6fa8'][i]));
      tool(860, 140, 0.15, () => { g.fillRect(-6, -40, 12, 150); g.fillRect(-48, -70, 96, 36); });   // a hammer
      tool(940, 150, -0.1, () => { g.beginPath(); g.ellipse(0, 0, 36, 70, 0, 0, TAU); g.fill(); g.fillRect(-8, 60, 16, 70); }, true);   // a mallet (in use)
      for (let i = 0; i < 9; i++) tool(110 + i * 40, 380, 0, () => { g.beginPath(); g.arc(0, 0, 13 + i * 1.2, 0, TAU); g.fill(); g.fillRect(-5, 0, 10, 60); });   // sockets
      tool(560, 400, 0, () => { g.fillRect(-120, -14, 240, 28); g.beginPath(); g.arc(-120, 0, 26, 0, TAU); g.fill(); });   // a torque wrench
      tool(820, 390, 0.6, () => { g.fillRect(-10, -80, 20, 160); g.fillRect(-36, -80, 72, 20); });   // pliers / a clamp
      g.strokeStyle = '#d9ad2b'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    });
    // the turntable's top: a plate of brushed dark steel in eight segments (their seams), a lighter band at the rim bolted down, a cap
    // in the middle, the gold arrows (planar uv over the disc)
    TX.disc = canvasTex(1024, 1024, (g, w, h) => {
      const c = w / 2; g.fillStyle = 'rgb(56,58,62)'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { const r = Math.sqrt(R()) * c * 0.93, a = R() * TAU, l = 6 + R() * 14, x = c + Math.cos(a) * r, y = c + Math.sin(a) * r, dx = -Math.sin(a) * l / 2, dy = Math.cos(a) * l / 2;   // (brushed round the middle)
        g.strokeStyle = R() < 0.5 ? 'rgba(255,255,255,' + (0.02 + R() * 0.03).toFixed(3) + ')' : 'rgba(0,0,0,' + (0.02 + R() * 0.03).toFixed(3) + ')'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - dx, y - dy); g.lineTo(x + dx, y + dy); g.stroke(); }
      g.fillStyle = 'rgb(44,46,50)'; g.beginPath(); g.arc(c, c, c * 0.36, 0, TAU); g.fill();
      for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * TAU, ca = Math.cos(a), sa = Math.sin(a);   // (the segments' seams)
        g.lineWidth = 2; g.strokeStyle = 'rgba(8,9,11,0.8)'; g.beginPath(); g.moveTo(c + ca * c * 0.36, c + sa * c * 0.36); g.lineTo(c + ca * c * 0.93, c + sa * c * 0.93); g.stroke();
        g.lineWidth = 1; g.strokeStyle = 'rgba(170,175,185,0.25)'; g.beginPath(); g.moveTo(c + ca * c * 0.36 - sa * 2, c + sa * c * 0.36 + ca * 2); g.lineTo(c + ca * c * 0.93 - sa * 2, c + sa * c * 0.93 + ca * 2); g.stroke(); }
      g.lineWidth = c * 0.055; g.strokeStyle = 'rgb(94,97,102)'; g.beginPath(); g.arc(c, c, c * 0.9575, 0, TAU); g.stroke();
      g.lineWidth = 3; g.strokeStyle = 'rgba(8,9,11,0.85)'; for (const r of [c * 0.36, c * 0.93, c * 0.985]) { g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke(); }
      for (let k = 0; k < 24; k++) { const a = (k + 0.5) / 24 * TAU, x = c + Math.cos(a) * c * 0.9575, y = c + Math.sin(a) * c * 0.9575;   // (countersunk bolts)
        g.fillStyle = 'rgba(20,21,24,0.85)'; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); g.fillStyle = 'rgb(150,154,160)'; g.beginPath(); g.arc(x - 0.5, y - 0.5, 3.5, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(255,198,41,0.7)'; for (let k = 0; k < 4; k++) { g.save(); g.translate(c, c); g.rotate(k * Math.PI / 2); g.beginPath(); g.moveTo(c * 0.3, -10); g.lineTo(c * 0.384, 0); g.lineTo(c * 0.3, 10); g.fill(); g.restore(); }
    });
    // the roll-up doors' atlas: the top half the curtain's slats (8, galvanised), bottom left a period of 45-degree hazard stripes (its
    // period the cell's inset width: they run on from quad to quad), bottom right a drain's grate (the cells inset 4 px)
    TX.doorA = canvasTex(256, 256, (g) => {
      for (let i = 0; i < 8; i++) { const y = i * 16, gr = g.createLinearGradient(0, y, 0, y + 16);
        gr.addColorStop(0, '#5d636b'); gr.addColorStop(0.12, '#9ba2ab'); gr.addColorStop(0.5, '#b9bfc7'); gr.addColorStop(0.85, '#8d949d'); gr.addColorStop(1, '#4a4f56'); g.fillStyle = gr; g.fillRect(0, y, 256, 16); }
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(30,26,20,' + (0.03 + R() * 0.05).toFixed(3) + ')'; g.fillRect(R() * 256, 0, 2 + R() * 10, 128); }   // (grime run down it)
      g.save(); g.beginPath(); g.rect(0, 128, 128, 128); g.clip(); g.translate(0, 128); g.fillStyle = '#17181b'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#e0b41e';
      for (let k = -2; k < 3; k++) { const s0 = 8 + k * 120, s1 = s0 + 60; g.beginPath(); g.moveTo(s0 + 300, -300); g.lineTo(s1 + 300, -300); g.lineTo(s1 - 300, 300); g.lineTo(s0 - 300, 300); g.fill(); }   // (yellow where x + y - 8 is in 0..60 of each 120)
      for (let i = 0; i < 300; i++) { g.fillStyle = R() < 0.6 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.12)'; g.fillRect(R() * 128, R() * 128, 1 + R() * 3, 1); }   // (worn)
      g.restore(); g.save(); g.translate(128, 128); g.fillStyle = '#0c0d0f'; g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 6; i++) { const x = 4 + (i + 0.5) * 20, gr = g.createLinearGradient(x - 4, 0, x + 4, 0); gr.addColorStop(0, '#3c4046'); gr.addColorStop(0.5, '#8b9098'); gr.addColorStop(1, '#2c2f34'); g.fillStyle = gr; g.fillRect(x - 4, 0, 8, 128); }
      g.restore();
    });
    // the ceiling's deck: the steel sheet's ribs (5 to a metre; the top half), plain white under them (what the ceiling's other parts
    // take: their vertex colours are their light)
    TX.deck = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) for (const [a, b, v] of [[0, 0.3, 210], [0.3, 0.42, 120], [0.42, 0.88, 180], [0.88, 1, 235]]) { g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect((i + a) * w / 5, 0, (b - a) * w / 5 + 0.5, h / 2); } }, true);
    // the windows' glass: a pale haze (more at the top), faint vertical lines of its sheet, two soft streaks
    TX.glass = canvasTex(128, 64, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(236,240,245,0.35)'); gr.addColorStop(1, 'rgba(236,240,245,0.15)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let x = 2; x < w; x += 4) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x, 0, 1, h); }
      for (const [x, k] of [[30, 0.18], [66, 0.1]]) { const s = g.createLinearGradient(x, 0, x + 26, 0); s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(0.5, 'rgba(255,255,255,' + k + ')'); s.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = s; g.save(); g.transform(1, 0, -0.6, 1, 0, 0); g.fillRect(x, 0, 26 + h, h); g.restore(); } });
    // the back-lit sign: the game's own name, channel letters (each one's dark side under it, then the lit face)
    TX.sign = canvasTex(1024, 256, (g, w, h) => {
      g.font = 'italic 900 150px Roboto, "Arial Black", Arial, sans-serif'; g.textBaseline = 'middle';
      const a = g.measureText('APEX ').width, b = g.measureText('RACING').width, x = (w - a - b) / 2;
      g.fillStyle = 'rgba(14,15,18,0.9)'; g.fillText('APEX', x + 5, h / 2 + 13); g.fillText('RACING', x + a + 5, h / 2 + 13);
      g.shadowColor = 'rgba(255,190,40,0.9)'; g.shadowBlur = GLOW.blur; g.fillStyle = '#ffd23f'; g.fillText('APEX', x, h / 2 + 6);
      g.shadowColor = 'rgba(160,210,255,0.9)'; g.fillStyle = '#f4f8ff'; g.fillText('RACING', x + a, h / 2 + 6);
    });
    // the car's contact shadow: a rounded rectangle, darkest under the body, soft at its edge (on the blob plane: len x 1.25, wid x 1.45)
    TX.under = canvasTex(128, 128, (g, w, h) => {
      const img = g.createImageData(w, h), d = img.data;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const r = 0.25, u = Math.abs((i + 0.5) / w * 2 - 1) - 0.72 + r, v = Math.abs((j + 0.5) / h * 2 - 1) - 0.6 + r;
        const sd = Math.hypot(Math.max(u, 0), Math.max(v, 0)) + Math.min(Math.max(u, v), 0) - r, t = clamp((sd + 0.06) / 0.3, 0, 1), o = (j * w + i) * 4;
        d[o] = d[o + 1] = d[o + 2] = 0; d[o + 3] = Math.round(255 * 0.92 * (1 - t * t * (3 - 2 * t)));
      }
      g.putImageData(img, 0, 0);
    });
    // soft round glow, a four-point glint, a flame
    TX.glow = canvasTex(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
    TX.star = canvasTex(128, 128, (g, w) => { const c = w / 2; g.translate(c, c); for (const [a, l, t] of [[0, 62, 3.2], [Math.PI / 2, 62, 3.2], [Math.PI / 4, 30, 2], [-Math.PI / 4, 30, 2]]) { g.save(); g.rotate(a); const gr = g.createLinearGradient(-l, 0, l, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-l, 0); g.lineTo(0, -t); g.lineTo(l, 0); g.lineTo(0, t); g.fill(); g.restore(); }
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 22); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-c, -c, w, w); });
    TX.flame = canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(120,170,255,0.95)'); gr.addColorStop(0.12, 'rgba(255,240,200,1)'); gr.addColorStop(0.4, 'rgba(255,150,40,0.85)'); gr.addColorStop(0.75, 'rgba(255,70,10,0.35)'); gr.addColorStop(1, 'rgba(255,40,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'destination-in'; const m = g.createLinearGradient(0, 0, w, 0); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.5, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, w, h); });
    // a brake disc: the friction ring with its cross-drilling and slots, the hat in the middle (uv: planar over the disc)
    TX.disc2 = canvasTex(256, 256, (g, w) => {
      const c = w / 2; g.fillStyle = 'rgb(150,154,160)'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
      for (let r = c * 0.42; r < c; r += 2) { g.strokeStyle = 'rgba(' + (R() < 0.5 ? '255,255,255,0.1' : '0,0,0,0.12') + ')'; g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke(); }
      g.fillStyle = 'rgba(30,32,36,0.95)'; for (let k = 0; k < 30; k++) for (let j = 0; j < 3; j++) { const a = k / 30 * TAU + j * 0.06, r = c * (0.55 + j * 0.13); g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 3.2, 0, TAU); g.fill(); }
      g.fillStyle = 'rgb(70,72,78)'; g.beginPath(); g.arc(c, c, c * 0.42, 0, TAU); g.fill();
    });
  }
  // the light's own textures: the floor's layout map where makeTextures draws none (an even one: r the albedo x 1.6, g the gloss x 1.27);
  // a tyre's contact shadow (darkest where it stands, on a quad longer than the tyre is wide: an ellipse)
  function makeLightTextures() {
    TX.layN = canvasTex(4, 4, (g, w, h) => { g.fillStyle = 'rgb(160,200,0)'; g.fillRect(0, 0, w, h); });
    TX.contact = canvasTex(64, 64, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,0.9)'); gr.addColorStop(0.35, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  }

  /* ---------------- materials of the parts (shared by every car in the garage) ---------------- */
  const PM = {};
  function makePartMats() {
    PM.carbon = new THREE.MeshPhongMaterial({ map: TX.carbon, color: 0xb8bec8, specular: 0x9aa0aa, shininess: 90, envMap: env, combine: THREE.MixOperation, reflectivity: 0.16 });
    PM.carbonFlat = new THREE.MeshPhongMaterial({ color: 0x1d2025, specular: 0x777777, shininess: 70, envMap: env, combine: THREE.MixOperation, reflectivity: 0.14 });
    PM.chrome = new THREE.MeshPhongMaterial({ color: 0xdfe3ea, specular: 0xffffff, shininess: 150, envMap: env, combine: THREE.MixOperation, reflectivity: 0.82 });
    PM.ti = new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0xffffff, shininess: 130, envMap: env, combine: THREE.MixOperation, reflectivity: 0.45 });
    PM.black = new THREE.MeshPhongMaterial({ color: 0x141518, specular: 0x2a2a2a, shininess: 25 });
    PM.hole = new THREE.MeshBasicMaterial({ color: 0x050506 });
    PM.red = new THREE.MeshPhongMaterial({ color: 0xe0281f, specular: 0xffffff, shininess: 110, envMap: env, combine: THREE.MixOperation, reflectivity: 0.12 });
    PM.yellow = new THREE.MeshPhongMaterial({ color: 0xf5c21a, specular: 0xffffff, shininess: 110, envMap: env, combine: THREE.MixOperation, reflectivity: 0.12 });
    PM.blueGlow = new THREE.MeshBasicMaterial({ color: emi(0x47c6ff, EMI.led) });
    PM.cal = [new THREE.MeshPhongMaterial({ color: 0x3b3f46, specular: 0x666666, shininess: 50 }), PM.red, PM.yellow,
      new THREE.MeshPhongMaterial({ color: 0xffb21a, specular: 0xffffff, shininess: 140, envMap: env, combine: THREE.MixOperation, reflectivity: 0.2 })];
  }

  /* ---------------- particles: soft puffs (smoke, water, paint mist) and glowing dots (sparks, flames, glints) ---------------- */
  class Puffs {
    constructor(max, additive) {
      this.max = max; this.cur = 0;
      this.P = new Float32Array(max * 3); this.Vl = new Float32Array(max * 3); this.C = new Float32Array(max * 4); this.S = new Float32Array(max);
      this.life = new Float32Array(max); this.ml = new Float32Array(max); this.s0 = new Float32Array(max); this.s1 = new Float32Array(max); this.a0 = new Float32Array(max);
      this.grav = new Float32Array(max); this.drag = new Float32Array(max); this.floor = new Float32Array(max);
      const g = new THREE.BufferGeometry();
      this.aP = new THREE.BufferAttribute(this.P, 3).setUsage(THREE.DynamicDrawUsage); this.aC = new THREE.BufferAttribute(this.C, 4).setUsage(THREE.DynamicDrawUsage); this.aS = new THREE.BufferAttribute(this.S, 1).setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', this.aP); g.setAttribute('pcol', this.aC); g.setAttribute('psize', this.aS); g.boundingSphere = new THREE.Sphere(new V3(), 1e4);
      this.mat = new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 400 } },
        vertexShader: 'attribute float psize; attribute vec4 pcol; uniform float uScale; varying vec4 vC; void main(){ vC = pcol; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = psize * uScale / max(0.2, -mv.z); gl_Position = projectionMatrix * mv; }',
        fragmentShader: additive ? 'varying vec4 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; gl_FragColor = vec4(vC.rgb * ' + EMI.spark.toFixed(2) + ', vC.a * pow(1.0 - r, 1.6)); }'
          : 'varying vec4 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; float a = vC.a * (1.0 - r) * (1.0 - 0.5 * r); gl_FragColor = vec4(vC.rgb * (1.04 - 0.14 * gl_PointCoord.y), a); }',
        transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = additive ? 9 : 8; this.pts.visible = false;   // (drawn only while some live)
    }
    emit(x, y, z, vx, vy, vz, life, s0, s1, c, a, grav, drag, floor) {
      const i = this.cur; this.cur = (this.cur + 1) % this.max;
      this.P[i * 3] = x; this.P[i * 3 + 1] = y; this.P[i * 3 + 2] = z; this.Vl[i * 3] = vx; this.Vl[i * 3 + 1] = vy; this.Vl[i * 3 + 2] = vz;
      this.life[i] = this.ml[i] = life; this.s0[i] = s0; this.s1[i] = s1; this.a0[i] = a; this.grav[i] = grav || 0; this.drag[i] = drag == null ? 1.2 : drag; this.floor[i] = floor == null ? -1e3 : floor;
      this.C[i * 4] = c[0]; this.C[i * 4 + 1] = c[1]; this.C[i * 4 + 2] = c[2];
    }
    update(dt) {
      let alive = 0;
      for (let i = 0; i < this.max; i++) {
        if (this.life[i] <= 0) { if (this.S[i] !== 0) { this.S[i] = 0; this.C[i * 4 + 3] = 0; } continue; }
        alive++; this.life[i] -= dt; const t = 1 - Math.max(0, this.life[i]) / this.ml[i], dr = Math.max(0, 1 - this.drag[i] * dt), o = i * 3;
        this.Vl[o] *= dr; this.Vl[o + 2] *= dr; this.Vl[o + 1] = this.Vl[o + 1] * dr - this.grav[i] * dt;
        this.P[o] += this.Vl[o] * dt; this.P[o + 1] += this.Vl[o + 1] * dt; this.P[o + 2] += this.Vl[o + 2] * dt;
        if (this.P[o + 1] < this.floor[i]) { this.P[o + 1] = this.floor[i]; this.Vl[o + 1] *= -0.35; this.Vl[o] *= 0.6; this.Vl[o + 2] *= 0.6; }
        this.S[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * Math.sqrt(t);
        this.C[i * 4 + 3] = this.a0[i] * (1 - t) * Math.min(1, t * 10 + 0.15);
      }
      this.pts.visible = alive > 0; if (alive) this.aP.needsUpdate = this.aC.needsUpdate = this.aS.needsUpdate = true;
    }
    clear() { this.life.fill(0); }
  }
  let puffs = null, sparks = null;

  /* ---------------- quads with uv in metres (the walls) ---------------- */
  class QB {
    constructor() { this.P = []; this.N = []; this.U = []; }
    // a quad from its four corners (counter-clockwise seen from the front), its normal, uv = metres / (su, sv) from its own origin
    quad(a, b, c, d, n, uv) { for (const [p, q] of [[a, uv[0]], [b, uv[1]], [c, uv[2]], [a, uv[0]], [c, uv[2]], [d, uv[3]]]) { this.P.push(p[0], p[1], p[2]); this.N.push(n[0], n[1], n[2]); this.U.push(q[0], q[1]); } }
    // a wall rectangle in a vertical plane: from (x0, z0) to (x1, z1) along the floor, y0..y1, facing n; texture size su x sv metres
    wall(x0, z0, x1, z1, y0, y1, n, su, sv, u0) {
      const L = Math.hypot(x1 - x0, z1 - z0), a = u0 || 0;
      this.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], n, [[a / su, y0 / sv], [(a + L) / su, y0 / sv], [(a + L) / su, y1 / sv], [a / su, y1 / sv]]);
    }
    mesh(mat) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2)); g.computeBoundingSphere(); return new THREE.Mesh(g, mat); }
  }

  /* ---------------- the room ---------------- */
  // the workshop: 18 m x 14 m, 4.8 m high. The back wall (z = -5) faces the camera; a roll-up door in each side wall (x = +-9, 5 m wide):
  // the cars drive in through the left one and out through the right one. In the middle of the floor the turntable, a lift under it.
  const ROOM = { x0: -9, x1: 9, z0: -5, z1: 9, h: 4.8, door: 2.5, doorH: 3.9, R: 3.0 };
  let signGlow = null, ringMat = null, ringGlow = null, motes = null, monitor = null;

  /* ---------------- the room's light: one chunk in the shaders of the room's own materials (walls, ceiling, floor, every piece's), no
     lights and no draws of its own. Brighter under the lamps over the table, darker towards the walls, in the corners, along the floor's
     and the ceiling's edges; the daylight through the doors (the right one in the sun: warm; the left one in the building's shade: cool),
     the wall washers' scallops on the back wall, the sun through the front windows in patches of their shape ---------------- */
  let ROOMLIGHT_GLSL = '', RL_SUN = '';
  function makeRoomLight() {   // (made from the room's fixed lines, once HDR is known: a window or a washer moved, its light moves too)
    const { x0, x1, z0, z1, h, door, doorH } = ROOM, f = (v) => v.toFixed(3), v3 = (a) => 'vec3(' + a.map(f).join(', ') + ')';
    const at = (a, v) => '(' + a + (v < 0 ? ' + ' + f(-v) : ' - ' + f(v)) + ')', ly = h - 0.5, zw = z1 - 0.15, hw = WW / 2 - 0.03;
    // the sun through the front windows at p (0..1, no normal: the motes' too): back from p along the sun to the windows' plane, the
    // windows there (their soft edge wider the farther, pen); a front window: its two panes either side of the mullion (ax: off its middle)
    RL_SUN = ['const vec3 rlS = ' + v3([SUN.x, SUN.y, SUN.z]) + ';',
      'float rlWin(float ax, float pen){ return (1.0 - smoothstep(' + f(hw) + ' - pen, ' + f(hw) + ' + pen, ax)) * smoothstep(0.02, 0.03 + pen, ax); }',
      'float rlSun(vec3 p){ float t = (' + f(zw) + ' - p.z) / rlS.z, pen = 0.03 + t * 0.012; vec2 w = p.xy + rlS.xy * t;',
      '  float wy = smoothstep(' + f(WIN[0]) + ' - pen, ' + f(WIN[0]) + ' + pen, w.y) * (1.0 - smoothstep(' + f(WIN[1]) + ' - pen, ' + f(WIN[1]) + ' + pen, w.y));',
      '  if (wy <= 0.0) return 0.0; return wy * (' + FRONTW.map(x => 'rlWin(abs' + at('w.x', x) + ', pen)').join(' + ') + '); }'].join('\n');
    ROOMLIGHT_GLSL = [
      'varying vec3 vRp; varying vec3 vRn;', RL_SUN,
      // a door's daylight: from the opening's point half-way to its middle's height (the floor in front of it gets some too)
      'float rlDoor(vec3 p, vec3 n, float x, float s){ vec3 L = vec3(x, 0.5 * clamp(p.y, 0.0, ' + f(doorH) + ') + ' + f(doorH / 4) + ', clamp(p.z, ' + f(-door) + ', ' + f(door) + ')) - p;',
      '  float d2 = dot(L, L) + 0.3; L *= inversesqrt(d2); return max(dot(n, L), 0.0) * max(s * L.x, 0.0) * 5.0 / (1.0 + 0.55 * d2); }',
      'vec3 roomLight(vec3 c, vec3 alb){',
      '  vec3 p = vRp, n = normalize(vRn);',
      '  float dx = ' + f((x1 - x0) / 2) + ' - abs' + at('p.x', (x0 + x1) / 2) + ', dz = ' + f((z1 - z0) / 2) + ' - abs' + at('p.z', (z0 + z1) / 2) + ', dw = min(dx, dz);',
      '  vec2 q = p.xz / vec2(5.2, 3.8); float k = mix(0.66, 1.1, 1.0 / (1.0 + dot(q, q)));',   // (the lamps over the table)
      '  k *= mix(0.52, 1.0, smoothstep(0.0, 1.3, dw + p.y)) * mix(0.62, 1.0, smoothstep(0.0, 1.4, dw + ' + f(h) + ' - p.y)) * mix(0.6, 1.0, smoothstep(0.0, 1.8, max(dx, dz)));',   // (the floor's and the ceiling's edges, the corners)
      '  float wash = 0.0;',   // (the washers: a fan of light down the back wall from each)
      '  if (n.z > 0.5 && p.z < ' + f(z0 + 0.4) + ') { float iw = 1.0 / (0.35 + 0.22 * (' + f(ly) + ' - p.y)), e;',
      WASH_X.map(x => '    e = ' + at('p.x', x) + ' * iw; wash += exp(-e * e);').join('\n'),
      '    wash *= smoothstep(0.8, 3.6, p.y) * (1.0 - smoothstep(' + f(ly - 0.05) + ', ' + f(ly + 0.05) + ', p.y)); }',
      '  float sun = 0.0, ns = dot(n, rlS); if (ns > 0.0 && p.z < ' + f(zw - 0.01) + ') sun = ns * rlSun(p);',   // (the sun: on what faces it)
      '  return c * k + alb * (' + v3([0.55, 0.506, 0.44]) + ' * rlDoor(p, n, ' + f(x1) + ', 1.0) + ' + v3([0.213, 0.228, 0.248]) + ' * rlDoor(p, n, ' + f(x0) + ', -1.0)',   // (the doors: 0.55 x (1, 0.92, 0.8); 0.55 x 0.45 x (0.86, 0.92, 1))
      '    + vec3(0.9, 0.864, 0.81) * wash + vec3(1.0, 0.88, 0.7) * sun * ' + f(HDR ? 1.8 : 0.9) + ');',
      '}'].join('\n');
  }
  // the chunk in a Lambert or Phong shader: the world position and normal passed on, the colour scaled at the end (call false: the
  // material calls roomLight() itself; mapFrag: GLSL put after the map's sample, e.g. a tint)
  function roomPatch(sh, mapFrag, call) {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRp; varying vec3 vRn;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvRp = (modelMatrix * vec4(transformed, 1.0)).xyz; vRn = mat3(modelMatrix) * objectNormal;');
    let fs = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + ROOMLIGHT_GLSL);
    if (mapFrag) fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n' + mapFrag);
    if (call !== false) fs = fs.replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb = roomLight(gl_FragColor.rgb, diffuseColor.rgb);\n#include <tonemapping_fragment>');
    sh.fragmentShader = fs;
  }
  // a room material in the room's light (key: its program's cache key, one per variant; opts.mapFrag: as above)
  function roomLit(m, key, opts) { const mf = opts && opts.mapFrag; m.onBeforeCompile = (sh) => roomPatch(sh, mf); m.customProgramCacheKey = () => key; return m; }
  // the gloss of a piece's matte mesh: its faces from here on (p.g's vertices so far) get their highlights x k, until the next mark
  // (rubber, cloth 0.15; paint 1; bare metal 2.2)
  function gloss(p, k) { p.gl.push([p.g.P.length / 3, k]); }
  // drawn by the main camera only (not in the floor's mirror, not in the cars' cube map): what lies on the floor or under it, glass,
  // dust, a car's small parts (layers are each object's own: on each mesh; it still casts: the shadow map is the main pass's)
  function mainOnly(o) { o.layers.set(NOREFL); return o; }

  /* ---------------- the room's pieces that step aside: what comes between the camera and the car dissolves ---------------- */
  // a wall's piece (all that stands or hangs on that wall) is gone while the camera is out beyond the wall (or close to it); a free-
  // standing thing is gone while it is in the way (a line from the camera to the car's middle or a point round its body goes through
  // its box) or right in front of the camera (nearer than p.near).
  // The fade is a dissolve: the pixels drop out in a fine noise (no see-through things to sort); its glows and shadows fade out.
  const pieces = [], WALLS = {}, FREE = {};
  function piece(wall) { const p = { wall: wall || null, root: new THREE.Group(), g: new World.GB(), sm: new SmoothB(), gl: [], near: 3.4, u: { value: 0 }, k: 0, box: new THREE.Box3(), fades: [] }; scene.add(p.root); pieces.push(p); return p; }
  // a piece's material: the dissolve first thing in the shader, then the room light (not in the glowing MeshBasic ones nor in a
  // ShaderMaterial), the gloss of the matte mesh (gl: its geometry has the 'gloss' attribute)
  function hideMat(m, u, gl) {
    const rl = !m.isMeshBasicMaterial && !m.isShaderMaterial;
    m.onBeforeCompile = (sh) => { sh.uniforms.uHide = u;
      sh.fragmentShader = 'uniform float uHide;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n\tif (uHide > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < uHide) discard;');
      if (rl) roomPatch(sh);
      if (rl && gl) { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float gloss; varying float vGloss;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGloss = gloss;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGloss;').replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directSpecular *= vGloss;'); } };
    m.customProgramCacheKey = () => rl ? (gl ? 'hideRLG' : 'hideRL') : 'hideB';
  }
  // each piece: its vertex-coloured things in one mesh (they cast and take shadows; their gloss as gloss() marked it), its glossy round
  // ones in another (the room's reflections in them), both darker where they meet the floor; its materials its own (the dissolve's
  // uniform), the box it takes up
  function finishPieces() {
    const ao = (geo) => { const P = geo.attributes.position, C = geo.attributes.color;   // (the low 0.4 m darker towards the floor)
      for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y < 0.4) { const a = 0.5 + 0.5 * smooth(0, 0.4, y); C.setXYZ(i, C.getX(i) * a, C.getY(i) * a, C.getZ(i) * a); } } return geo; };
    for (const p of pieces) {
      if (p.g.P.length) { const geo = ao(p.g.geometry()), n = geo.attributes.position.count, gl = new Float32Array(n).fill(1);
        p.gl.forEach(([i, k], j) => gl.fill(k, i, j + 1 < p.gl.length ? p.gl[j + 1][0] : n)); geo.setAttribute('gloss', new THREE.BufferAttribute(gl, 1));
        const m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x5a5a5a, shininess: 50 })); m.material.userData.gl = true; m.castShadow = m.receiveShadow = true; p.root.add(m); }
      if (p.sm.P.length) { const mt = new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0xffffff, shininess: 90, combine: THREE.MixOperation, reflectivity: 0.25 }); decorEnv.push(mt); const m = new THREE.Mesh(ao(p.sm.geometry()), mt); m.castShadow = m.receiveShadow = true; p.root.add(m); }
      const done = new Map();
      p.root.traverse(o => { if (!o.material) return; let m = done.get(o.material);
        if (!m) { m = o.material.clone(); if (decorEnv.includes(o.material)) decorEnv.push(m);
          if (m.transparent) { m.userData.op = m.opacity; p.fades.push(m); } else hideMat(m, p.u, m.userData.gl); done.set(o.material, m); }
        o.material = m; });
      p.box.setFromObject(p.root); p.box.expandByScalar(0.05);
    }
  }
  // each frame: what is in the way of the car (seen from where the camera is now) fades out, the rest comes back
  const _ray = new THREE.Ray(), _hit = new V3(), CORN = [new V3()], _cp = [new V3()];   // (the car's middle, its sills and its roof, on the table)
  for (const x of [-2.2, -1.1, 0, 1.1, 2.2]) for (const z of [-1, 1]) { CORN.push(new V3(x, 0.25, z)); _cp.push(new V3()); }
  for (const x of [-1.4, 0, 1.4]) { CORN.push(new V3(x, 1.25, 0)); _cp.push(new V3()); }
  function stepPieces(dt) {
    const c = camera.position; tt.updateMatrixWorld();
    _cp[0].set(rig.tx, rig.ty, rig.tz); for (let i = 1; i < CORN.length; i++) tt.localToWorld(_cp[i].copy(CORN[i]));
    for (const p of pieces) {
      let want = false;
      if (p.wall) want = p.wall[0] * c.x + p.wall[1] * c.z - p.wall[2] < 0.4;
      else if (p.box.distanceToPoint(c) < p.near) want = true;
      else for (const q of _cp) { _ray.origin.copy(c); _ray.direction.subVectors(q, c); const L = _ray.direction.length(); _ray.direction.divideScalar(L); if (_ray.intersectBox(p.box, _hit) && _hit.distanceTo(c) < L) { want = true; break; } }
      p.k = want ? Math.min(1, p.k + dt * 5) : Math.max(0, p.k - dt * 5);
      p.u.value = p.k; if ((p.k < 0.999) !== p.root.visible) { p.root.visible = !p.root.visible; shadowDirty = 2; }   // (gone or back: its shadow too)
      for (const m of p.fades) m.opacity = m.userData.op * (1 - p.k);
    }
  }

  function buildRoom() {
    const { x0, x1, z0, z1 } = ROOM;
    // the walls' pieces (inward normal x, z and the plane's offset: the camera's distance in front of the wall is nx x + nz z - c)
    WALLS.back = piece([0, 1, z0]); WALLS.front = piece([0, -1, -z1]); WALLS.left = piece([1, 0, x0]); WALLS.right = piece([-1, 0, -x1]);
    buildShell(); buildFurniture(); buildFloorMarks(); buildMotes();
  }
  // the shell: the walls (the cladding over a tread-plate dado, a coved skirting at the floor), the steel frame (the columns, the eaves
  // beams; the rafters are the ceiling's), the kerb stripe round the walls and the columns, the windows, the roll-up doors, the building's
  // services, the sign, the pegboard, the telemetry screen, the wall washers; the ceiling and its lamps
  function buildShell() {
    const { x0, x1, z0, z1, h, door, doorH } = ROOM, { back: PB, front: PF, left: PL, right: PR } = WALLS;
    const lam = (o) => new THREE.MeshLambertMaterial(o);
    let g = PB.g;
    const box = (cx, cy, cz, sx, sy, sz, col, top, rot) => World.box(g, cx, cy, cz, sx, sy, sz, rot || 0, col, top);
    // a box in a frame of its own, T(a, y, b) -> world (a wall's: along it, up, out from it; a door's: into the room, up, along it), into
    // g (or G); cb: its bottom's colour (the sides shade from it up); skip: the faces left out ('a' at a0, 'A' at a1, 'b' at b0, 'B' at
    // b1, 't' the top, 'd' the bottom)
    const lbox = (T, a0, a1, y0, y1, b0, b1, col, cb, skip, G) => {
      const gg = G || g, s = skip || '', lo = cb || col, c = T((a0 + a1) / 2, (y0 + y1) / 2, (b0 + b1) / 2), v = (i, j, k) => T(i ? a1 : a0, j ? y1 : y0, k ? b1 : b0);
      const side = (f, p, q, r, t) => { if (!s.includes(f)) gg.quadO(p, q, r, t, col, c, null, [lo, lo, col, col]); };   // (p, q at the bottom)
      side('b', v(0, 0, 0), v(1, 0, 0), v(1, 1, 0), v(0, 1, 0)); side('B', v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1));
      side('a', v(0, 0, 0), v(0, 0, 1), v(0, 1, 1), v(0, 1, 0)); side('A', v(1, 0, 0), v(1, 0, 1), v(1, 1, 1), v(1, 1, 0));
      if (!s.includes('t')) gg.quadO(v(0, 1, 0), v(1, 1, 0), v(1, 1, 1), v(0, 1, 1), col, c);
      if (!s.includes('d')) gg.quadO(v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), v(0, 0, 1), lo, c);
    };
    // a round post up y (bands [y0, y1, colour] from the bottom), a low cone on top; a drum (sides, a cap under it, one on top if capT)
    const post = (G, x, z, r, bands, n, cap) => { const P = (a, y) => [x + Math.cos(a) * r, y, z + Math.sin(a) * r], yt = bands[bands.length - 1][1], ct = bands[bands.length - 1][2];
      for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
        for (const [y0, y1, col] of bands) G.quadO(P(a0, y0), P(a1, y0), P(a1, y1), P(a0, y1), col, [x, (y0 + y1) / 2, z]);
        G.triO([x, yt + cap, z], P(a0, yt), P(a1, yt), ct, [x, yt - 1, z]); } };
    const drum = (G, x, z, r, y0, y1, col, n, capB, capT) => { const P = (a, y) => [x + Math.cos(a) * r, y, z + Math.sin(a) * r];
      for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; G.quadO(P(a0, y0), P(a1, y0), P(a1, y1), P(a0, y1), col, [x, (y0 + y1) / 2, z]);
        if (capB) G.triO([x, y0, z], P(a0, y0), P(a1, y0), capB, [x, y0 + 1, z]); if (capT) G.triO([x, y1, z], P(a0, y1), P(a1, y1), capT, [x, y1 - 1, z]); } };
    // the walls' frames (s along the wall from its start, t out from it into the room), the columns on each (s; the corners too)
    const WF = {};
    for (const [k, ox, oz, dx, dz, P, cs] of [['back', x0, z0, 1, 0, PB, COLS.backFront.map(x => x - x0)], ['front', x1, z1, -1, 0, PF, COLS.backFront.map(x => x1 - x)],
      ['left', x0, z1, 0, -1, PL, COLS.sides.map(z => z1 - z)], ['right', x1, z0, 0, 1, PR, COLS.sides.map(z => z - z0)]]) {
      const L = Math.abs(dx) ? x1 - x0 : z1 - z0; WF[k] = { P, L, T: (s, y, t) => [ox + dx * s - dz * t, y, oz + dz * s + dx * t], cols: cs.concat(dz || !COLS.corners ? [] : [0.12, L - 0.12]) }; }
    // walls: the cladding over a tread-plate dado 1 m high, a coved skirting where they meet the floor (a quarter round 9 cm, its lip); a
    // door in each side wall, a band of windows high in the back and the front wall
    const wq = new QB(), pq = new QB(), WY = 1.0, COVE = [0.4, 0.42, 0.45], LIP = [0.46, 0.48, 0.52];
    const wallRun = (w, holes) => {   // a wall from its start to its end; its openings [from, to, bottom, top] along it (a door, a window)
      const { T, P, L } = WF[w], o0 = T(0, 0, 0), o1 = T(0, 0, 1), n = [o1[0] - o0[0], 0, o1[2] - o0[2]], cuts = [0, L];
      for (const o of holes) cuts.push(o[0], o[1]); cuts.sort((p, q) => p - q); g = P.g;
      for (let i = 0; i + 1 < cuts.length; i++) {
        const s0 = cuts[i], s1 = cuts[i + 1]; if (s1 - s0 < 1e-4) continue;
        const p = T(s0, 0, 0), q = T(s1, 0, 0), o = holes.find(o => o[0] <= s0 + 1e-4 && o[1] >= s1 - 1e-4), y0 = o ? o[2] : h, y1 = o ? o[3] : h, sm = (s0 + s1) / 2;   // (the gap y0..y1)
        if (y0 > 0) { pq.wall(p[0], p[2], q[0], q[2], 0, Math.min(WY, y0), n, 1.5, 1, s0);
          const cv = (a) => [0.09 - 0.09 * Math.cos(a), 0.094 - 0.09 * Math.sin(a)];   // (y, t)
          for (let k = 0; k < 3; k++) { const A = cv(k / 3 * Math.PI / 2), B = cv((k + 1) / 3 * Math.PI / 2); g.quadO(T(s0, A[0], A[1]), T(s1, A[0], A[1]), T(s1, B[0], B[1]), T(s0, B[0], B[1]), COVE, T(sm, -1, -1)); }
          lbox(T, s0, s1, 0.09, 0.12, 0, 0.012, LIP, null, 'aAbd'); }
        if (y0 > WY) wq.wall(p[0], p[2], q[0], q[2], WY, y0, n, 3, 1.2, s0);
        if (y1 < h) wq.wall(p[0], p[2], q[0], q[2], Math.max(WY, y1), h, n, 3, 1.2, s0);
      }
    };
    wallRun('back', BACKW.map(x => [x - x0 - WW / 2, x - x0 + WW / 2, WIN[0], WIN[1]]));
    wallRun('front', FRONTW.map(x => [x1 - x - WW / 2, x1 - x + WW / 2, WIN[0], WIN[1]]));
    wallRun('left', [[z1 - door, z1 + door, 0, doorH]]); wallRun('right', [[-z0 - door, -z0 + door, 0, doorH]]);
    // (the cladding's panels each a shade apart: a row, 6 m along it; the hash's inputs small whole numbers)
    const tint = 'diffuseColor.rgb *= 0.94 + 0.12 * fract(sin(dot(floor(vec2(vUv.y + 0.1667, vUv.x * 0.5)), vec2(12.9898, 78.233))) * 43758.5453);';
    const wallM = wq.mesh(roomLit(lam({ map: TX.wall }), 'wallL', { mapFrag: tint })), plateM = pq.mesh(roomLit(new THREE.MeshPhongMaterial({ map: TX.plate, specular: 0x666666, shininess: 40 }), 'room'));
    wallM.receiveShadow = plateM.receiveShadow = true; scene.add(wallM, plateM);
    // the steel frame: I columns (a web, the flange to the room, a base plate; their feet darker), the eaves beams along the back and the
    // front wall (the rafters: the ceiling's); an aluminium cap on the dado where no light line runs
    const FLG = [0.6, 0.63, 0.68], WEB = [0.48, 0.51, 0.56], PLT = [0.3, 0.31, 0.34], dk = (c) => c.map(v => v * 0.7);
    for (const w in WF) { const { T, P, L, cols } = WF[w]; g = P.g; gloss(P, 1);
      for (const sc of cols) { lbox(T, Math.max(0, sc - 0.14), Math.min(L, sc + 0.14), 0, 0.02, 0, 0.36, PLT, null, 'b');
        for (const [y0, y1, lo] of [[0.02, 0.7, 1], [0.7, h, 0]]) { lbox(T, sc - 0.006, sc + 0.006, y0, y1, 0, 0.25, WEB, lo && dk(WEB), 'bBtd'); lbox(T, sc - 0.12, sc + 0.12, y0, y1, 0.25, 0.272, FLG, lo && dk(FLG), 'td'); } }
      if (w === 'back' || w === 'front') lbox(T, 0, L, 4.55, h, 0, 0.22, [0.5, 0.53, 0.58], null, 'bt');
    }
    for (const [w, s0, s1] of [['front', 0, x1 - x0], ['left', 0, z1 - door - 0.4], ['right', door - z0 + 0.4, z1 - z0]]) { g = WF[w].P.g; lbox(WF[w].T, s0, s1, 0.99, 1.015, 0, 0.025, [0.62, 0.64, 0.68], null, 'b'); }
    // the kerb stripe round the walls at 2.0..2.16 m (the menu's red and white, 0.6 m a block from each wall's start), round the columns
    // it passes (the flange's face and edges, the web's sides), not across the doors
    const KR = [0.74, 0.14, 0.12], KW = [0.86, 0.86, 0.84], kc = (s) => Math.floor(s / 0.6 + 1e-6) % 2 ? KW : KR;
    const kerb = (w, s0, s1, t) => { const { T, P } = WF[w]; g = P.g;
      for (let a = s0; a < s1 - 1e-4;) { const b = Math.min(s1, (Math.floor(a / 0.6 + 1e-6) + 1) * 0.6); g.quadO(T(a, 2.0, t), T(b, 2.0, t), T(b, 2.16, t), T(a, 2.16, t), kc((a + b) / 2), T((a + b) / 2, 2.08, t - 1)); a = b; } };
    for (const [w, s0, s1] of [['back', 0, x1 - x0], ['front', 0, x1 - x0], ['left', 0, z1 - door - 0.4], ['left', z1 + door + 0.4, z1 - z0], ['right', 0, -z0 - door - 0.4], ['right', door - z0 + 0.4, z1 - z0]]) {
      kerb(w, s0, s1, 0.02); const { T, cols } = WF[w];
      for (const sc of cols) { if (sc < s0 - 0.2 || sc > s1 + 0.2) continue; const f = 0.125;
        kerb(w, sc - f, sc + f, 0.277);
        for (const e of [-1, 1]) { g.quadO(T(sc + e * f, 2.0, 0.25), T(sc + e * f, 2.0, 0.277), T(sc + e * f, 2.16, 0.277), T(sc + e * f, 2.16, 0.25), kc(sc + e * (f - 0.002)), T(sc, 2.08, 0.26));
          g.quadO(T(sc + e * 0.009, 2.0, 0.02), T(sc + e * 0.009, 2.0, 0.25), T(sc + e * 0.009, 2.16, 0.25), T(sc + e * 0.009, 2.16, 0.02), kc(sc), T(sc, 2.08, 0.1)); } } }
    // the windows: a deep reveal (its sill in the light, its head in shade), an aluminium frame and its mullion, an inner sill; the glass
    // of a wall's windows in one mesh: a pale haze over the daylight (the main camera's only; it fades with its wall)
    const glassM = new THREE.MeshBasicMaterial({ map: TX.glass, vertexColors: true, transparent: true, depthWrite: false, color: new THREE.Color().setScalar(OUTK * 0.85) }), Rw = Core.rng(4245);
    const windows = (P, zw, nz, xs) => { g = P.g; const D = 0.3, zo = zw - nz * D, zf = zw - nz * 0.12, zg = zf + nz * 0.01, [y0, y1] = WIN, FR = [0.14, 0.15, 0.17], SIDE = [0.5, 0.52, 0.56], gq = new World.GB(true);
      for (const x of xs) { const a = x - WW / 2, b = x + WW / 2, ym = (y0 + y1) / 2;
        g.quadO([a, y0, zw], [b, y0, zw], [b, y0, zo], [a, y0, zo], [0.62, 0.64, 0.68], [x, y0 - 1, zw]); g.quadO([a, y1, zw], [b, y1, zw], [b, y1, zo], [a, y1, zo], [0.36, 0.38, 0.42], [x, y1 + 1, zw]);
        g.quadO([a, y0, zw], [a, y1, zw], [a, y1, zo], [a, y0, zo], SIDE, [a - 1, ym, zw]); g.quadO([b, y0, zw], [b, y1, zw], [b, y1, zo], [b, y0, zo], SIDE, [b + 1, ym, zw]);
        obox(g, [a, y0 + 0.03, zf], [b, y0 + 0.03, zf], 0.06, 0.07, FR); obox(g, [a, y1 - 0.03, zf], [b, y1 - 0.03, zf], 0.06, 0.07, FR);
        obox(g, [a + 0.03, y0, zf], [a + 0.03, y1, zf], 0.06, 0.07, FR); obox(g, [b - 0.03, y0, zf], [b - 0.03, y1, zf], 0.06, 0.07, FR); obox(g, [x, y0, zf], [x, y1, zf], 0.05, 0.06, FR);
        box(x, y0 - 0.06, zw + nz * 0.06, WW + 0.16, 0.06, 0.14, [0.62, 0.64, 0.68]);   // (the sill inside)
        for (const [pa, pb] of [[a + 0.03, x - 0.025], [x + 0.025, b - 0.03]]) { const k = 0.93 + Rw() * 0.07;   // (both panes, either side of the mullion)
          gq.quadO([pa, y0 + 0.035, zg], [pb, y0 + 0.035, zg], [pb, y1 - 0.035, zg], [pa, y1 - 0.035, zg], [k, k, k], [x, ym, zg - nz], [[0, 0], [1, 0], [1, 1], [0, 1]]); } }
      const gm = new THREE.Mesh(gq.geometry(), glassM); gm.renderOrder = 2; P.root.add(mainOnly(gm)); };
    windows(PB, z0, 1, BACKW); windows(PF, z1, -1, FRONTW);
    // the roll-up doors (each in a frame of its own: lx into the room, y up, lz along the wall; the right one the left one mirrored): the
    // opening's reveal (the wall's thickness) and its edge trims, the guide rails, the hood over the curtain, the coil on its brackets, the
    // motor with its hand chain, the push-buttons and their conduit, the curtain's bottom bar, a bollard either side, a drain's edges
    // across the threshold (into the wall's piece: they cast, they dissolve with it); the curtain, the coil's slats, the hazard bands and
    // the grate in one mesh of the atlas TX.doorA
    const dm = lam({ map: TX.doorA }), A = 1 / 256, WH = [1, 1, 1], REV = [0.42, 0.44, 0.48], RAIL = [0.6, 0.62, 0.66], STL = [0.5, 0.52, 0.56], CND = [0.52, 0.54, 0.58];
    const HZ = [4 * A, 124 * A], GU = [132 * A, 252 * A], slat = (i, n) => [1 - (4 + (i + n) * 16) * A, 1 - (4 + i * 16) * A], uq = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    for (const sd of [-1, 1]) {
      const P = sd < 0 ? PL : PR, T = (lx, y, lz) => [sd * (x1 - lx), y, -sd * lz], B = (a0, a1, y0, y1, b0, b1, col, cb, sk) => lbox(T, a0, a1, y0, y1, b0, b1, col, cb, sk), dq = new World.GB(true);
      const tq = (p, q, r, s, inside, uv) => dq.quadO(p, q, r, s, WH, inside, uv);
      g = P.g; gloss(P, 1);
      for (const s of [-1, 1]) {   // (the reveal's sides, the trims on its outer edges)
        g.quadO(T(0, 0, s * door), T(-0.3, 0, s * door), T(-0.3, doorH, s * door), T(0, doorH, s * door), REV, T(-0.15, doorH / 2, s * (door + 1)));
        B(-0.3, -0.27, 0, doorH, s > 0 ? door - 0.03 : -door, s > 0 ? door : -door + 0.03, [0.62, 0.64, 0.68], null, 'a'); }
      g.quadO(T(0, doorH, -door), T(-0.3, doorH, -door), T(-0.3, doorH, door), T(0, doorH, door), [0.36, 0.38, 0.42], T(-0.15, doorH + 1, 0));
      B(-0.3, -0.27, doorH - 0.03, doorH, -door, door, [0.62, 0.64, 0.68], null, 'a');
      // the curtain's bottom bar (the door up), the bollards, yellow and black
      B(0.035, 0.115, 3.5, 3.56, -door - 0.08, door + 0.08, [0.7, 0.72, 0.75]);
      const YB = [0.93, 0.72, 0.12], KB = [0.08, 0.08, 0.09];
      for (const s of [-1, 1]) { const c = T(0.45, 0, s * 3.05); drum(g, c[0], c[2], 0.12, 0, 0.015, [0.3, 0.31, 0.34], 12, null, [0.3, 0.31, 0.34]);
        post(g, c[0], c[2], 0.08, [[0.015, 0.55, YB], [0.55, 0.65, KB], [0.65, 0.85, YB], [0.85, 0.95, KB], [0.95, 1.0, YB]], 12, 0.03); }
      // the push-buttons (green, red, black) on the jamb's column, their conduit up it into the motor
      B(0.272, 0.372, 1.35, 1.57, 2.73, 2.87, [0.85, 0.86, 0.82], null, 'a');
      for (const [y, col] of [[1.52, [0.15, 0.6, 0.25]], [1.46, [0.8, 0.12, 0.1]], [1.4, [0.08, 0.08, 0.09]]]) B(0.372, 0.392, y - 0.016, y + 0.016, 2.784, 2.816, col, null, 'a');
      obox(g, T(0.29, 1.57, 2.84), T(0.29, 4.3, 2.84), 0.025, 0.025, CND);
      // the galvanised steel: the guide rails (the curtain's slot dark), the hood, the coil's brackets and their hubs, the motor's
      // gearbox, the motor, its terminal box, the hand chain, the drain's edges
      gloss(P, 1.8);
      for (const s of [-1, 1]) { B(0, 0.12, 0, 4.05, s > 0 ? door : -door - 0.16, s > 0 ? door + 0.16 : -door, RAIL, null, 'a');
        g.quadO(T(0.035, 0, s * (door - 0.002)), T(0.085, 0, s * (door - 0.002)), T(0.085, doorH, s * (door - 0.002)), T(0.035, doorH, s * (door - 0.002)), [0.07, 0.07, 0.08], T(0.06, 2, s * (door + 1)));
        B(0.11, 0.73, 3.99, 4.61, s > 0 ? 2.66 : -2.672, s > 0 ? 2.672 : -2.66, [0.32, 0.34, 0.38]); cylA(g, T(0.42, 4.3, s * 2.69), 'z', 0.07, 0.036, 10, [0.18, 0.19, 0.22]); }
      B(0, 0.2, doorH, 4.05, -door - 0.16, door + 0.16, STL, null, 'a');
      B(0.3, 0.54, 4.16, 4.44, 2.672, 2.76, [0.22, 0.24, 0.28]); cylA(g, T(0.42, 4.3, 2.92), 'z', 0.12, 0.32, 14, [0.16, 0.18, 0.22]); cylA(g, T(0.42, 4.3, 3.1), 'z', 0.1, 0.04, 14, [0.09, 0.09, 0.1]);
      B(0.36, 0.48, 4.42, 4.52, 2.84, 2.98, [0.2, 0.22, 0.26]);
      for (const lz of [2.7, 2.74]) obox(g, T(0.556, 4.22, lz), T(0.556, 1.3, lz), 0.012, 0.012, [0.34, 0.35, 0.37]);
      obox(g, T(0.556, 1.3, 2.694), T(0.556, 1.3, 2.746), 0.012, 0.012, [0.34, 0.35, 0.37]);
      for (const lx of [0.105, 0.28]) B(lx, lx + 0.015, 0, 0.007, -door, door, [0.55, 0.57, 0.6], null, 'd');
      gloss(P, 0.15); B(0.05, 0.1, 3.47, 3.5, -door - 0.06, door + 0.06, [0.05, 0.05, 0.06]); gloss(P, 1);   // (the bottom bar's rubber seal)
      // the atlas's mesh: the curtain's last slats under the hood and up to the coil, the coil (a slat a facet), the hazard band on the
      // hood, a hazard hatch on the floor inside, the drain's grate
      const cu = [4 * A, 252 * A], [vc0] = slat(0, 7.4), vh = slat(0, 2.6)[0];
      tq(T(0.06, 3.56, -door - 0.06), T(0.06, 3.56, door + 0.06), T(0.06, 4.05, door + 0.06), T(0.06, 4.05, -door - 0.06), T(-1, 3.8, 0), uq(cu[0], cu[1], vc0, vh));
      tq(T(0.06, 4.05, -door - 0.06), T(0.06, 4.05, door + 0.06), T(0.12, 4.3, door + 0.06), T(0.12, 4.3, -door - 0.06), T(-1, 3.8, 0), uq(cu[0], cu[1], vh, 1 - 4 * A));
      for (let k = 0; k < 24; k++) { const a0 = k / 24 * TAU, a1 = (k + 1) / 24 * TAU, C = (a, lz) => T(0.42 + Math.cos(a) * 0.3, 4.3 + Math.sin(a) * 0.3, lz), v0 = 1 - (k % 8 + 1) / 16 + A, v1 = 1 - (k % 8) / 16 - A;   // (a whole slat a facet)
        tq(C(a0, -2.66), C(a0, 2.66), C(a1, 2.66), C(a1, -2.66), T(0.42, 4.3, 0), uq(cu[0], cu[1], v0, v1)); }
      const hb = 5.32 / 13, hv = HZ[0] + (0.15 / hb) * (HZ[1] - HZ[0]);
      for (let i = 0; i < 13; i++) { const la = -2.66 + i * hb; tq(T(0.202, doorH, la), T(0.202, doorH, la + hb), T(0.202, 4.05, la + hb), T(0.202, 4.05, la), T(-1, 3.97, la), uq(HZ[0], HZ[1], HZ[0], hv)); }
      for (let i = 0; i < 8; i++) { const la = -door + i * door / 4; tq(T(0.35, 0.004, la), T(0.35, 0.004, la + door / 4), T(0.35 + door / 4, 0.004, la + door / 4), T(0.35 + door / 4, 0.004, la), T(0.6, -1, la), uq(HZ[0], HZ[1], HZ[0], HZ[1])); }
      for (let i = 0; i < 20; i++) { const la = -door + i * door / 10; tq(T(0.12, 0.004, la), T(0.12, 0.004, la + door / 10), T(0.28, 0.004, la + door / 10), T(0.28, 0.004, la), T(0.2, -1, la), uq(GU[0], GU[1], HZ[0], HZ[1])); }
      const dme = new THREE.Mesh(dq.geometry(), dm); dme.castShadow = dme.receiveShadow = true; P.root.add(dme);
    }
    // the building's services. Back wall: a sub-board (its conduits up to the ceiling, one along to a socket box on the column at
    // x -4.75), the air main under the eaves (on round the right wall), a drop on the column at x 5 (a valve, the regulator and its
    // gauge, the filter bowl, a coupler, a coiled hose on a hook). Right wall: the riser from the compressor. Left wall: the main board,
    // its conduits up to the cable tray. A warning triangle on each board (no words)
    const BRD = [0.6, 0.62, 0.62], AIR = [0.2, 0.4, 0.66];
    const warn = (T, s, y, t) => { const tri = (r, col, dt) => g.triO(T(s - r, y - r * 0.58, t + dt), T(s + r, y - r * 0.58, t + dt), T(s, y + r * 1.15, t + dt), col, T(s, y, t - 1));
      tri(0.065, [0.08, 0.08, 0.09], 0.002); tri(0.05, [0.93, 0.74, 0.12], 0.003); g.triO(T(s + 0.012, y + 0.035, t + 0.004), T(s - 0.016, y - 0.008, t + 0.004), T(s + 0.004, y - 0.006, t + 0.004), [0.08, 0.08, 0.09], T(s, y, t - 1));
      g.triO(T(s - 0.012, y - 0.03, t + 0.004), T(s + 0.016, y + 0.006, t + 0.004), T(s - 0.004, y + 0.004, t + 0.004), [0.08, 0.08, 0.09], T(s, y, t - 1)); };
    { const { T } = WF.back, S = (x) => x - x0; g = PB.g;
      lbox(T, S(-8.62), S(-8.02), 1.35, 2.25, 0, 0.2, BRD, null, 'b'); lbox(T, S(-8.323), S(-8.317), 1.37, 2.23, 0.2, 0.203, [0.12, 0.12, 0.13], null, 'b'); lbox(T, S(-8.11), S(-8.08), 1.72, 1.86, 0.2, 0.225, [0.16, 0.16, 0.18], null, 'b');
      warn(T, S(-8.47), 1.98, 0.2);
      for (const x of [-8.52, -8.4, -8.28, -8.16]) obox(g, T(S(x), 2.25, 0.05), T(S(x), 4.6, 0.05), 0.035, 0.035, CND);
      for (const [a, b] of [[[-8.08, 2.25, 0.05], [-8.08, 2.7, 0.05]], [[-8.08, 2.7, 0.05], [-4.92, 2.7, 0.05]], [[-4.92, 2.7, 0.05], [-4.92, 2.7, 0.3]], [[-4.92, 2.7, 0.3], [-4.82, 2.7, 0.3]], [[-4.82, 2.7, 0.3], [-4.82, 1.31, 0.3]]])
        obox(g, T(S(a[0]), a[1], a[2]), T(S(b[0]), b[1], b[2]), 0.035, 0.035, CND);
      lbox(T, S(-4.87), S(-4.63), 0.99, 1.31, 0.272, 0.372, [0.74, 0.75, 0.73], null, 'b');
      for (const [x, col] of [[-4.81, [0.78, 0.13, 0.1]], [-4.69, [0.14, 0.34, 0.72]]]) lbox(T, S(x) - 0.035, S(x) + 0.035, 1.04, 1.12, 0.372, 0.41, col, null, 'b');   // (the sockets: 400 V red, 230 V blue)
      obox(g, T(0.3, 4.45, 0.07), T(S(8.945), 4.45, 0.07), 0.03, 0.03, AIR);
      obox(g, T(S(4.94), 4.45, 0.07), T(S(4.94), 4.45, 0.3), 0.03, 0.03, AIR); obox(g, T(S(4.94), 4.45, 0.3), T(S(4.94), 1.7, 0.3), 0.03, 0.03, AIR);
      lbox(T, S(4.92), S(4.96), 1.86, 1.9, 0.3, 0.36, [0.8, 0.12, 0.1]);   // (a ball valve's handle)
      lbox(T, S(4.905), S(4.975), 1.55, 1.7, 0.265, 0.335, [0.3, 0.32, 0.35]); cylA(g, T(S(4.94), 1.64, 0.345), 'z', 0.024, 0.02, 10, [0.85, 0.86, 0.84]);
      cylA(g, T(S(4.94), 1.49, 0.3), 'y', 0.03, 0.12, 10, [0.62, 0.7, 0.78]); cylA(g, T(S(4.94), 1.4, 0.3), 'y', 0.016, 0.06, 8, [0.8, 0.64, 0.28]);
      lbox(T, S(5.0) - 0.01, S(5.0) + 0.01, 1.3, 1.36, 0.272, 0.33, [0.2, 0.21, 0.24]);   // (the hose's hook)
      for (let k = 0; k < 3; k++) { const cx = 5.02 + k * 0.004, cy = 1.17 - k * 0.006, cz = z0 + 0.3 + k * 0.014, R = 0.15 - k * 0.008;   // (its coils: rings of 14 facets, 4 sides)
        for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) { const P = (a, b) => { const r = R + Math.cos(b) * 0.011; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz + Math.sin(b) * 0.011]; }, a0 = i / 14 * TAU, a1 = (i + 1) / 14 * TAU, b0 = j / 4 * TAU, b1 = (j + 1) / 4 * TAU;
          g.quadO(P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1), [0.93, 0.72, 0.12], [cx + Math.cos((a0 + a1) / 2) * R, cy + Math.sin((a0 + a1) / 2) * R, cz]); } }
      obox(g, T(S(4.94), 1.37, 0.3), T(S(4.99), 1.29, 0.31), 0.022, 0.022, [0.93, 0.72, 0.12]); }
    { const { T } = WF.right; g = PR.g;
      obox(g, T(0.055, 4.45, 0.07), T(9.82, 4.45, 0.07), 0.03, 0.03, AIR); obox(g, T(9.82, 4.45, 0.07), T(9.82, 0.95, 0.07), 0.03, 0.03, AIR);
      lbox(T, 9.8, 9.84, 1.6, 1.64, 0.07, 0.13, [0.8, 0.12, 0.1]); obox(g, T(9.82, 0.95, 0.07), T(9.8, 0.55, 0.3), 0.03, 0.03, [0.1, 0.1, 0.11]); }
    { const { T } = WF.left; g = PL.g;
      lbox(T, 1.3, 2.3, 0.6, 2.0, 0, 0.3, BRD, null, 'b'); lbox(T, 1.797, 1.803, 0.62, 1.98, 0.3, 0.303, [0.12, 0.12, 0.13], null, 'b');
      for (const s of [1.72, 1.88]) lbox(T, s - 0.015, s + 0.015, 1.2, 1.36, 0.3, 0.325, [0.16, 0.16, 0.18], null, 'b');
      warn(T, 1.55, 1.75, 0.3);
      for (let i = 0; i < 6; i++) { const s = 1.38 + i * 0.168; obox(g, T(s, 2.0, 0.06), T(s, 4.42, 0.06), 0.035, 0.035, CND); obox(g, T(s, 4.42, 0.06), T(s, 4.42, 1.27), 0.035, 0.035, CND); } }
    // the sign: channel letters on a black acrylic backing with a brushed edge; its glow on the wall round it
    { const { T } = WF.back, s = -2.5 - x0; g = PB.g; lbox(T, s - 2.2, s + 2.2, 2.2, 3.36, 0, 0.05, [0.55, 0.57, 0.6], null, 'b');
      g.quadO(T(s - 2.18, 2.22, 0.0505), T(s + 2.18, 2.22, 0.0505), T(s + 2.18, 3.34, 0.0505), T(s - 2.18, 3.34, 0.0505), [0.06, 0.07, 0.09], T(s, 2.78, -1)); }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.0), new THREE.MeshBasicMaterial({ map: TX.sign, color: emi(0xffffff, EMI.sign), transparent: true, depthWrite: false })); sign.position.set(-2.5, 2.78, z0 + 0.06); PB.root.add(sign);
    signGlow = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 3), new THREE.MeshBasicMaterial({ map: TX.glow, color: 0xffd894, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: GLOW.sign }));
    signGlow.position.set(-2.5, 2.78, z0 + 0.03); PB.root.add(signGlow);
    // wall washers: a lamp under the ceiling every few metres along the back wall (between the windows; their light: the room light's,
    // their lenses: the lamps' mesh)
    g = PB.g;
    for (const x of WASH_X) box(x, h - 0.5, z0 + 0.1, 0.5, 0.08, 0.2, [0.1, 0.1, 0.11]);
    // the pegboard over the chests, on its frame off the wall
    lbox(WF.back.T, -6.2 - 1.25 - x0, -6.2 + 1.25 - x0, 1.27, 2.57, 0, 0.02, [0.2, 0.21, 0.24], null, 'b');
    const peg = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.3), lam({ map: TX.peg })); peg.position.set(-6.2, 1.92, z0 + 0.026); PB.root.add(peg);
    // a telemetry screen on the wall (a glowing trace)
    monitor = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.86), new THREE.MeshBasicMaterial({ map: monitorTex(), color: emi(0xffffff, EMI.screen) })); monitor.position.set(6.45, 2.85, z0 + 0.08); PB.root.add(monitor);
    box(6.45, 2.4, z0 + 0.02, 1.6, 0.94, 0.08, [0.06, 0.06, 0.07]);
    for (const P of [PB, PF, PL, PR]) gloss(P, 1);   // (what the other builders put in the walls' pieces: a gloss of its own from 1)
    // the ceiling, its light baked in its vertex colours (no lights of its own, no shadows): the ribbed deck, the purlins, the frames'
    // rafters with their haunches, the sprinkler mains and their heads, a ladder cable tray, a spiral duct and its diffusers, the linear
    // lamps' housings. Brighter over the table, under the lamps and by the windows; the sides of things darker, their tops darker still
    const cg = new World.GB(true), ID = (x, y, z) => [x, y, z], C = (a0, a1, y0, y1, b0, b1, col, sk) => lbox(ID, a0, a1, y0, y1, b0, b1, col, null, sk, cg);
    cg.dUV = [0.5, 0.2];   // (the texture's plain white half)
    const FIX = [[-6.5, -3.9, 1], [-2.2, -3.9, 1], [2.2, -3.9, 1], [6.5, -3.9, 1], [-6.5, 6.2, 1], [-2.2, 6.2, 1], [2.2, 6.2, 1], [6.5, 6.2, 1], [-6.6, 0, 0], [6.4, 0, 0]];   // (the linear lamps: x, z, along x)
    for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) cg.quadO([x, h, z], [x + 1, h, z], [x + 1, h, z + 1], [x, h, z + 1], [0.5, 0.53, 0.58], [x + 0.5, h + 1, z + 0.5], uq(x, x + 1, 0.75, 0.75));
    for (const zc of [-3.25, -1, 1.25, 3.5, 5.75, 8]) for (let x = x0; x < x1 - 1e-3; x += 1.5) { C(x, x + 1.5, h - 0.16, h, zc - 0.002, zc + 0.002, [0.4, 0.43, 0.48], 'aAt'); C(x, x + 1.5, h - 0.16, h - 0.15, zc, zc + 0.06, [0.4, 0.43, 0.48], 'aA'); }
    const RAF = [0.46, 0.49, 0.54], yb = (z) => h - 0.45 - 0.4 * Math.max(0, 1 - (z - z0) / 1.4, 1 - (z1 - z) / 1.4), ZS = [z0, z0 + 0.7, z0 + 1.4];
    for (let z = z0 + 2.4; z < z1 - 1.9; z++) ZS.push(z); ZS.push(z1 - 1.4, z1 - 0.7, z1);
    for (const xc of COLS.backFront) for (let i = 0; i + 1 < ZS.length; i++) { const za = ZS[i], zb = ZS[i + 1], ya = yb(za), yc = yb(zb);
      for (const e of [-1, 1]) { const x = xc + e * 0.006, xf = xc + e * 0.12; cg.quadO([x, ya, za], [x, yc, zb], [x, h, zb], [x, h, za], RAF, [xc, (ya + h) / 2, (za + zb) / 2]);   // (the web)
        cg.quadO([xf, ya, za], [xf, yc, zb], [xf, yc + 0.02, zb], [xf, ya + 0.02, za], RAF, [xc, ya, za]); }   // (the flange's edges)
      cg.quadO([xc - 0.12, ya, za], [xc + 0.12, ya, za], [xc + 0.12, yc, zb], [xc - 0.12, yc, zb], RAF, [xc, ya + 1, za]);
      cg.quadO([xc - 0.12, ya + 0.02, za], [xc + 0.12, ya + 0.02, za], [xc + 0.12, yc + 0.02, zb], [xc - 0.12, yc + 0.02, zb], RAF, [xc, ya - 1, za]); }
    const SPR = [0.62, 0.09, 0.07], HEAD = [0.75, 0.75, 0.78];
    for (const xc of [-6.0, -1.8, 2.4, 6.6]) { for (let z = z0 + 0.25; z < z1 - 0.26; z += 1.25) C(xc - 0.03, xc + 0.03, 4.53, 4.59, z, Math.min(z + 1.25, z1 - 0.25), SPR, 't');
      for (let z = z0 + 1; z < z1 - 0.5; z += 3) { C(xc - 0.004, xc + 0.004, 4.59, h, z - 0.004, z + 0.004, CND, 'td');
        const zh = z + 1.5; if (zh > z1 - 0.5 || xc * xc / 20 + zh * zh / 9.5 < 1.4) continue;   // (a head between the hangers; none over the honeycomb)
        C(xc - 0.012, xc + 0.012, 4.47, 4.53, zh - 0.012, zh + 0.012, HEAD, 't'); C(xc - 0.028, xc + 0.028, 4.462, 4.47, zh - 0.028, zh + 0.028, HEAD); } }
    const TRAY = [0.6, 0.62, 0.66], CAB = [0.06, 0.06, 0.07];
    for (let z = z0 + 0.3; z < z1 - 0.31; z += 1.5) { const zb = Math.min(z + 1.5, z1 - 0.3);
      for (const xr of [-7.75, -7.47]) C(xr, xr + 0.02, 4.385, 4.455, z, zb, TRAY, 'aA');
      for (const xc of [-7.68, -7.6, -7.52]) C(xc - 0.013, xc + 0.013, 4.4, 4.426, z, zb, CAB, 'aAd'); }
    for (let z = z0 + 0.45; z < z1 - 0.3; z += 0.3) C(-7.73, -7.47, 4.385, 4.4, z - 0.012, z + 0.012, TRAY, 'aAt');   // (the rungs)
    for (let z = z0 + 0.6; z < z1 - 0.3; z += 1.5) for (const xr of [-7.76, -7.46]) C(xr - 0.004, xr + 0.004, 4.455, h, z - 0.004, z + 0.004, CND, 'td');   // (the rods it hangs from)
    const DUCT = [0.66, 0.68, 0.72], DX = 7.5, DY = 4.25, DR = 0.25, dP = (a, r, z) => [DX + Math.cos(a) * r, DY + Math.sin(a) * r, z];
    for (let z = -4.6; z < 8.59; z += 1.1) { const zb = Math.min(z + 1.1, 8.6);
      for (let i = 0; i < 12; i++) { const a0 = i / 12 * TAU, a1 = (i + 1) / 12 * TAU; cg.quadO(dP(a0, DR, z), dP(a1, DR, z), dP(a1, DR, zb), dP(a0, DR, zb), DUCT, [DX, DY, (z + zb) / 2]);
        if (zb < 8.6) cg.quadO(dP(a0, DR + 0.005, zb - 0.012), dP(a1, DR + 0.005, zb - 0.012), dP(a1, DR + 0.005, zb + 0.012), dP(a0, DR + 0.005, zb + 0.012), [0.5, 0.52, 0.56], [DX, DY, zb]); } }   // (its spiral seam)
    for (const [z, e] of [[-4.6, -1], [8.6, 1]]) for (let i = 0; i < 12; i++) cg.triO([DX, DY, z], dP(i / 12 * TAU, DR, z), dP((i + 1) / 12 * TAU, DR, z), DUCT, [DX, DY, z - e]);
    for (const z of [-2.5, 2.5, 6.5]) { drum(cg, DX, z, 0.12, DY - DR - 0.06, DY - DR + 0.02, DUCT, 10); drum(cg, DX, z, 0.18, DY - DR - 0.18, DY - DR - 0.06, DUCT, 12, [0.14, 0.14, 0.15]);
      drum(cg, DX, z, 0.1, DY - DR - 0.19, DY - DR - 0.18, [0.3, 0.31, 0.33], 10, [0.08, 0.08, 0.09]); }   // (a diffuser: its neck, its body, the grille's cone)
    for (const z of [-3.2, 0.6, 4.4, 8.0]) C(DX - 0.012, DX + 0.012, DY + DR, h, z - 0.02, z + 0.02, [0.3, 0.31, 0.34], 'td');   // (its straps)
    for (const [x, z, ax] of FIX) { const lx = ax ? 0.7 : 0.11, lz = ax ? 0.11 : 0.7; C(x - lx, x + lx, 4.3, 4.37, z - lz, z + lz, [0.16, 0.17, 0.19], 't');   // (a lamp's housing and its two wires)
      for (const e of [-0.55, 0.55]) C(x + (ax ? e : 0) - 0.004, x + (ax ? e : 0) + 0.004, 4.37, h, z + (ax ? 0 : e) - 0.004, z + (ax ? 0 : e) + 0.004, CND, 'td'); }
    { const lt = (x, z) => { let l = 0.22 + 0.55 * Math.exp(-(x * x / 14 + z * z / 7));   // (the light at a point of the ceiling)
        for (const [fx, fz] of FIX) l += 0.3 * Math.exp(-((x - fx) * (x - fx) + (z - fz) * (z - fz)) / 2.5);
        for (const [zw, xs, s] of [[z0, BACKW, 1], [z1, FRONTW, -1]]) { let wx = 0; for (const c of xs) wx = Math.max(wx, 1 - smooth(WW / 2 - 0.3, WW / 2 + 0.5, Math.abs(x - c))); l += 0.25 * Math.exp(-Math.max(0, (z - zw) * s) / 0.9) * wx; }
        return clamp(l, 0, 1); };
      const { P: Pp, N, C: Cc } = cg; for (let i = 0; i < Pp.length; i += 3) { const k = lt(Pp[i], Pp[i + 2]) * (0.7 - 0.3 * N[i + 1]); Cc[i] *= k; Cc[i + 1] *= k; Cc[i + 2] *= k; } }
    scene.add(new THREE.Mesh(cg.geometry(), new THREE.MeshBasicMaterial({ map: TX.deck, vertexColors: true })));
    // the lamps (they glow: lampMat, over 1 with HDR): the honeycomb of LED tubes over the table hung under the pipes, dark joints at its
    // corners, a few hanger wires; the linear lamps' diffusers; the wall washers' lenses
    const lg = new World.GB(), L = 0.6, yl = h - 0.36, seen = new Set(), hubs = new Map(), Kd = 1 / EMI.hex, HUB = [0.08 * Kd, 0.08 * Kd, 0.09 * Kd];
    for (let q = -7; q <= 7; q++) for (let r = -7; r <= 7; r++) {
      const cx = 1.5 * L * q, cz = Math.sqrt(3) * L * (r + q / 2);
      if (Math.abs(cx) > 4.2 || Math.abs(cz) > 2.9 || (cx * cx) / 20 + (cz * cz) / 9.5 > 1) continue;
      for (let k = 0; k < 6; k++) {
        const a0 = k / 6 * TAU, a1 = (k + 1) / 6 * TAU, p0 = [cx + Math.cos(a0) * L, cz + Math.sin(a0) * L], p1 = [cx + Math.cos(a1) * L, cz + Math.sin(a1) * L];
        const key = Math.round((p0[0] + p1[0]) * 50) + ',' + Math.round((p0[1] + p1[1]) * 50); if (seen.has(key)) continue; seen.add(key);
        for (const p of [p0, p1]) hubs.set(Math.round(p[0] * 50) + ',' + Math.round(p[1] * 50), p);
        const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2, c = (p1[0] - p0[0]) / L, s = (p1[1] - p0[1]) / L;   // (a tube; its top never seen)
        lbox((a, y, b) => [mx + a * c - b * s, y, mz + a * s + b * c], -L * 0.43, L * 0.43, yl, yl + 0.035, -0.025, 0.025, WH, null, 't', lg);
      }
    }
    let nh = 0;
    for (const [x, z] of hubs.values()) { lbox((a, y, b) => [x + a, y, z + b], -0.04, 0.04, yl - 0.012, yl + 0.047, -0.04, 0.04, HUB, null, 't', lg);
      if (nh++ % 17 === 0) World.box(lg, x, yl + 0.047, z, 0.006, h - yl - 0.047, 0.006, 0, HUB, HUB); }   // (a few of them hung from the deck)
    const lens = (xa, xb, za, zb, y, c) => lg.quadO([xa, y, za], [xb, y, za], [xb, y, zb], [xa, y, zb], c, [(xa + xb) / 2, y + 1, (za + zb) / 2]);
    for (const [x, z, ax] of FIX) { const lx = ax ? 0.65 : 0.08, lz = ax ? 0.08 : 0.65; lens(x - lx, x + lx, z - lz, z + lz, 4.298, [1, 1, 0.97]); }
    for (const x of WASH_X) lens(x - 0.22, x + 0.22, z0 + 0.03, z0 + 0.17, h - 0.502, [1, 0.95, 0.86]);
    lampMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: emi(0xf2f7ff, EMI.hex) }); scene.add(new THREE.Mesh(lg.geometry(), lampMat));
  }
  // the furniture along the walls: two roll cabs under the pegboard, a workbench under the sign, the tyre rack, the tall cabinets, the
  // lockers and their bench; the oil drums, the rubber mats. Muted paint; the drawers' pulls and worn edges catch the light
  function buildFurniture() {
    const { z0, z1 } = ROOM, { back: PB, front: PF } = WALLS, { red: RED, red2: RED2, dk: DK, steel: STEEL, alu: ALU, wood: WOOD } = PAL;
    let p = PB, g = PB.g;
    const use = (q, k) => { p = q; g = q.g; gloss(q, k); }, gl = (k) => gloss(p, k), box = (...a) => fbox(g, ...a);
    // a roll cab against the back wall: drawers with full-width pulls and a worn top edge, castors on forks (side: handles on its ends)
    const chest = (cx, w, hh, d, side) => {
      const zc = z0 + d / 2 + 0.05, zf = z0 + d + 0.05, n = Math.round(hh / 0.17), dy = hh / n, WORN = [RED[0] * 1.25, RED[1] * 1.25, RED[2] * 1.25];
      use(PB, PAINT); box(cx, 0.12, zc, w, hh, d, RED, RED2);
      for (let i = 0; i < n; i++) { const y = 0.12 + i * dy; box(cx, y, zf + 0.004, w - 0.05, 0.01, 0.01, RED2); box(cx, y + dy - 0.016, zf + 0.004, w - 0.05, 0.012, 0.008, WORN); }
      gl(METAL); for (let i = 0; i < n; i++) box(cx, 0.12 + i * dy + dy * 0.6, zf + 0.014, w - 0.12, 0.022, 0.022, ALU);
      if (side) for (const s of [-1, 1]) { const x = cx + s * (w / 2 + 0.04); obox(g, [x, 0.98, zc - 0.18], [x, 0.98, zc + 0.18], 0.022, 0.022, STEEL); for (const dz of [-0.18, 0.18]) obox(g, [x - s * 0.04, 0.98, zc + dz], [x, 0.98, zc + dz], 0.02, 0.02, STEEL); }
      for (const sx of [-1, 1]) for (const sz of [0, 1]) box(cx + sx * (w / 2 - 0.08), 0.06, z0 + 0.14 + sz * (d - 0.16), 0.05, 0.06, 0.05, DK);   // (the forks)
      gl(MATTE); for (const sx of [-1, 1]) for (const sz of [0, 1]) cylA(g, [cx + sx * (w / 2 - 0.08), 0.045, z0 + 0.14 + sz * (d - 0.16)], 'x', 0.045, 0.03, 8, DK);
    };
    chest(-6.75, 1.5, 1.0, 0.62, true); chest(-5.45, 0.95, 0.7, 0.62, false);
    use(PB, MATTE); box(-6.75, 1.12, z0 + 0.36, 1.5, 0.014, 0.64, [0.08, 0.08, 0.09]);   // (a rubber mat on the big one)
    gl(SATIN); box(-5.45, 0.82, z0 + 0.36, 0.97, 0.05, 0.66, WOOD, [0.5, 0.36, 0.22]);   // (a butcher-block top on the small one)
    gl(PAINT); box(-7.15, 1.134, z0 + 0.32, 0.4, 0.22, 0.26, [0.8, 0.45, 0.12], [0.86, 0.5, 0.15]); box(-7.15, 1.3, z0 + 0.32, 0.41, 0.012, 0.27, [0.55, 0.3, 0.08]);   // a parts box: its lid's seam, its handle
    gl(METAL); obox(g, [-7.27, 1.37, z0 + 0.32], [-7.03, 1.37, z0 + 0.32], 0.02, 0.02, STEEL);
    box(-6.4, 1.134, z0 + 0.4, 0.2, 0.17, 0.15, [0.3, 0.32, 0.36]);   // a vice
    // the workbench under the sign: a cabinet (doors with recessed pulls, a dark kick plinth), a stainless top and its upstand; a rail of
    // parts bins on the wall over it
    gl(PAINT); box(-2.6, 0, z0 + 0.27, 3.12, 0.1, 0.45, [0.05, 0.05, 0.06]); box(-2.6, 0.1, z0 + 0.3, 3.2, 0.62, 0.55, [0.15, 0.16, 0.18]);
    for (let i = 0; i < 4; i++) { const x = -3.8 + i * 0.8; box(x, 0.12, z0 + 0.58, 0.76, 0.54, 0.012, [0.22, 0.23, 0.26]); box(x, 0.6, z0 + 0.585, 0.34, 0.03, 0.008, [0.03, 0.03, 0.04]); }
    gl(METAL); for (let i = 0; i < 4; i++) box(-3.8 + i * 0.8, 0.627, z0 + 0.588, 0.34, 0.006, 0.01, ALU);
    box(-2.6, 0.72, z0 + 0.31, 3.25, 0.04, 0.62, [0.62, 0.64, 0.67], [0.72, 0.74, 0.77]); box(-2.6, 0.76, z0 + 0.012, 3.25, 0.12, 0.02, [0.66, 0.68, 0.71]);
    box(-2.75, 1.42, z0 + 0.03, 2.4, 0.03, 0.04, ALU);
    gl(SATIN); [[0.2, 0.34, 0.6], [0.64, 0.16, 0.12], [0.78, 0.62, 0.16], [0.2, 0.34, 0.6], [0.64, 0.16, 0.12], [0.78, 0.62, 0.16]].forEach((c, i) => { const x = -3.7 + i * 0.38;
      box(x, 1.29, z0 + 0.13, 0.32, 0.15, 0.2, c, [0.03, 0.03, 0.04]); box(x, 1.33, z0 + 0.235, 0.12, 0.04, 0.008, [0.88, 0.88, 0.85]); });   // (open bins: dark inside, a blank label)
    // rubber mats on the floor in front of the bench and the big chest (dark, a yellow edge; bright: the floor's occlusion halves them)
    gl(MATTE); for (const [a, b, c, d] of [[-4.1, -1.1, -4.4, -3.95], [-7.4, -6.1, -4.28, -4.02]]) { const M = [0.12, 0.12, 0.13], Y = [1.48, 1.2, 0.4];
      box((a + b) / 2, 0, (c + d) / 2, b - a, 0.012, d - c, M); for (const z of [c + 0.015, d - 0.015]) box((a + b) / 2, 0, z, b - a, 0.013, 0.03, Y); for (const x of [a + 0.015, b - 0.015]) box(x, 0, (c + d) / 2, 0.03, 0.013, d - c, Y); }
    // the tyre rack: muted gold uprights and braces, two shelves, slicks standing in a row on each
    const rx0 = 1.15, rx1 = 4.75, GD = [0.76, 0.6, 0.2];
    gl(PAINT); for (const sx of [rx0, rx1]) { for (const sz of [0.32, 0.04]) box(sx, 0, z0 + sz, 0.06, 2.2, 0.06, GD); for (const y of [0.3, 1.3]) obox(g, [sx, y, z0 + 0.05], [sx, y + 0.6, z0 + 0.31], 0.03, 0.03, GD); }
    for (const y of [0.08, 1.12]) { box((rx0 + rx1) / 2, y, z0 + 0.18, rx1 - rx0 + 0.1, 0.05, 0.4, [0.24, 0.26, 0.3]); box((rx0 + rx1) / 2, y + 0.01, z0 + 0.385, rx1 - rx0 + 0.1, 0.03, 0.012, GD); }
    gl(MATTE); for (const y of [0.13, 1.17]) for (let i = 0; i < 11; i++) tyre(g, M4(rx0 + 0.2 + i * 0.32, y + 0.336, z0 + 0.2, i * 0.9, 0, Math.PI / 2), i % 4 ? null : BANDS[(i >> 2) % 3], 12, true);
    // tall cabinets down the back wall's right end: double doors (their gap, handles), vents at the foot, a label holder
    gl(PAINT); for (let i = 0; i < 3; i++) { const x = 5.65 + i * 0.86, zf = z0 + 0.625;
      box(x, 0, z0 + 0.32, 0.82, 2.05, 0.6, [0.27, 0.29, 0.32], [0.2, 0.21, 0.24]); box(x, 0.06, zf, 0.008, 1.92, 0.01, [0.06, 0.06, 0.07]);
      for (let k = 0; k < 5; k++) for (const s of [-1, 1]) box(x + s * 0.2, 0.14 + k * 0.045, zf, 0.26, 0.012, 0.008, [0.08, 0.08, 0.09]);
      box(x - 0.2, 1.72, zf + 0.008, 0.15, 0.07, 0.004, [0.88, 0.88, 0.85]); }
    gl(METAL); for (let i = 0; i < 3; i++) { const x = 5.65 + i * 0.86, zf = z0 + 0.635; for (const s of [-1, 1]) box(x + s * 0.04, 0.95, zf, 0.022, 0.24, 0.02, STEEL); box(x - 0.2, 1.705, zf - 0.007, 0.18, 0.1, 0.006, STEEL); }
    BLOBS.push([-6.75, z0 + 0.4, 1.9, 1.0, 0.9, 0, PB], [-5.45, z0 + 0.4, 1.3, 1.0, 0.9, 0, PB], [-2.6, z0 + 0.35, 3.6, 0.9, 0.8, 0, PB], [2.95, z0 + 0.25, 4.0, 0.8, 0.7, 0, PB], [6.51, z0 + 0.35, 2.9, 1.0, 0.9, 0, PB]);
    // the front wall: lockers in the team's navy (each door inset in its frame, vents, a handle, a blank number plate, a dark plinth), a
    // changing bench in front of them
    use(PF, PAINT); box(-1.45, 0, z1 - 0.3, 3.68, 0.1, 0.5, [0.05, 0.05, 0.06]);
    for (let i = 0; i < 6; i++) { const x = -3 + i * 0.62, zf = z1 - 0.6;
      box(x, 0.1, z1 - 0.32, 0.6, 1.8, 0.55, [0.09, 0.11, 0.16], [0.08, 0.1, 0.14]); box(x, 0.13, zf - 0.002, 0.55, 1.74, 0.01, [0.13, 0.17, 0.25]);
      for (const y of [0.22, 1.66]) for (let k = 0; k < 3; k++) box(x, y + k * 0.04, zf - 0.008, 0.3, 0.012, 0.006, [0.05, 0.06, 0.08]);
      box(x, 1.5, zf - 0.008, 0.08, 0.05, 0.006, [0.86, 0.86, 0.83]); }
    gl(METAL); for (let i = 0; i < 6; i++) box(-3 + i * 0.62 + 0.21, 0.92, z1 - 0.618, 0.03, 0.12, 0.02, STEEL);
    for (const x of [-3.1, -1.45, 0.2]) box(x, 0, z1 - 0.9, 0.04, 0.43, 0.26, STEEL);
    gl(SATIN); box(-1.45, 0.43, z1 - 0.9, 3.6, 0.04, 0.32, WOOD, [0.5, 0.36, 0.22]);
    BLOBS.push([-1.45, z1 - 0.4, 4.0, 1.2, 0.8, 0, PF]);
    // oil drums: two blue ones in the back left corner (a hand pump on one), a red one in the front right
    const Rd = Core.rng(8);
    { const P = FREE.drumsL = piece(); drum(P, -8.39, -4.35, [0.14, 0.24, 0.36], Rd); drum(P, -7.8, -4.6, [0.12, 0.21, 0.32], Rd);
      gloss(P, PAINT); seg(P.g, [-7.7, 0.88, -4.48], [-7.7, 1.25, -4.48], 0.016, [0.58, 0.1, 0.09]); seg(P.g, [-7.7, 1.25, -4.48], [-7.56, 1.29, -4.48], 0.012, DK);
      seg(P.g, [-7.7, 1.16, -4.48], [-7.52, 1.06, -4.38], 0.008, DK); BLOBS.push([-8.1, -4.48, 1.4, 0.9, 0.85, 0, P]); }
    { const P = FREE.drumR = piece(); drum(P, 8.3, z1 - 1.2, RED, Rd); BLOBS.push([8.3, z1 - 1.2, 0.8, 0.8, 0.85, 0, P]); }
  }
  // the floor's marks: the turntable's lit ring, the painted lines, a gully
  function buildFloorMarks() {
    const { x0, x1, z1, door, R } = ROOM;
    // the turntable's lit ring in the floor between two dark steel channels (the inner one over the table's gap), its glow
    const rg = new World.GB(), band = (r0, r1, c) => { for (let i = 0; i < 128; i++) { const a0 = i / 128 * TAU, a1 = (i + 1) / 128 * TAU, P = (a, r) => [Math.cos(a) * r, 0.004, Math.sin(a) * r]; rg.quadUp(P(a0, r0), P(a0, r1), P(a1, r1), P(a1, r0), [c, c, c, c]); } };
    band(R, R + 0.015, [0.06 / EMI.led, 0.065 / EMI.led, 0.07 / EMI.led]); band(R + 0.015, R + 0.065, hexRgb(0x55c4ff)); band(R + 0.065, R + 0.09, [0.27 / EMI.led, 0.28 / EMI.led, 0.3 / EMI.led]);
    ringMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color().setScalar(EMI.led) }); scene.add(mainOnly(new THREE.Mesh(rg.geometry(), ringMat)));
    ringGlow = new THREE.Mesh(new THREE.RingGeometry(R - 0.5, R + 0.9, 128, 1), new THREE.ShaderMaterial({
      uniforms: { uC: { value: new THREE.Color(0x3aa8ff) }, uK: { value: 0.3 * GLOW.ring } },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uC; uniform float uK; varying vec2 vP; void main(){ float d = length(vP) - ' + (R + 0.04).toFixed(2) + '; float a = exp(-d * d * (d < 0.0 ? 60.0 : 5.0)); gl_FragColor = vec4(uC * a * uK, 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    ringGlow.rotation.x = -Math.PI / 2; ringGlow.position.y = 0.008; ringGlow.renderOrder = -1; scene.add(mainOnly(ringGlow));
    // painted lines (worn: in half-metre lengths a shade apart, chipped here and there; the layout map makes them duller and darker where
    // the tyres run): the bay's lane edges from the doors, the arrows of the way through, the bay's corners, a keep-clear hatch before
    // the main board on the left wall; a gully back right of the table (its steel edges, the dark sump, the bars)
    const fl = new World.GB(), Rl = Core.rng(4244), Y = [0.74, 0.6, 0.2], q = (a, b, c, d, y, col) => fl.quadUp([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], [d[0], y, d[1]], [col, col, col, col]);
    const line = (ax, az, bx, bz, w) => { const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 0.5)), ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz * w / 2, nz = ux * w / 2;
      for (let i = 0; i < n; i++) { const t0 = i / n * L + (i && Rl() < 0.25 ? 0.01 + Rl() * 0.02 : 0), t1 = (i + 1) / n * L, k = 0.94 + Rl() * 0.12, c = [Y[0] * k, Y[1] * k, Y[2] * k], p = [ax + ux * t0, az + uz * t0], e = [ax + ux * t1, az + uz * t1];
        q([p[0] - nx, p[1] - nz], [p[0] + nx, p[1] + nz], [e[0] + nx, e[1] + nz], [e[0] - nx, e[1] - nz], 0.005, c); } };
    for (const sz of [-1, 1]) { line(x0 + 0.38, sz * (door + 0.25), -R - 0.4, sz * (door + 0.25), 0.1); line(R + 0.4, sz * (door + 0.25), x1 - 0.38, sz * (door + 0.25), 0.1); }
    for (const ax of [-6.2, 5.2]) for (const s of [-1, 1]) line(ax, s * 0.55, ax + 0.9, 0, 0.12);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { line(sx * 4.35, sz * 3.9, sx * 3.4, sz * 3.9, 0.1); line(sx * 4.3, sz * 3.95, sx * 4.3, sz * 3.0, 0.1); }
    { const xa = x0 + 0.12, xb = -8.2, za = 6.6, zb = 7.8;   // (the keep-clear box: its frame, stripes at 45 degrees clipped to it)
      line(xa, za, xb, za, 0.08); line(xa, zb, xb, zb, 0.08); line(xb, za - 0.04, xb, zb + 0.04, 0.08); line(xa, za - 0.04, xa, zb + 0.04, 0.08);
      for (let c = za - xb + 0.15; c < zb - xa; c += 0.3) { const P = []; for (const [x, z] of [[xa, xa + c], [xb, xb + c], [za - c, za], [zb - c, zb]]) if (x >= xa - 1e-6 && x <= xb + 1e-6 && z >= za - 1e-6 && z <= zb + 1e-6) P.push([x, z]);
        if (P.length >= 2) { P.sort((p, r) => p[0] - r[0]); line(P[0][0], P[0][1], P[P.length - 1][0], P[P.length - 1][1], 0.1); } } }
    { const gx = 4.0, gz = -2.6, a = 0.17, e = 0.025, ST = [0.55, 0.57, 0.6];
      q([gx - a, gz - a], [gx + a, gz - a], [gx + a, gz + a], [gx - a, gz + a], 0.004, [0.04, 0.04, 0.05]);
      for (const s of [-1, 1]) { q([gx - a, gz + s * a - (s > 0 ? e : 0)], [gx + a, gz + s * a - (s > 0 ? e : 0)], [gx + a, gz + s * a + (s < 0 ? e : 0)], [gx - a, gz + s * a + (s < 0 ? e : 0)], 0.006, ST);
        q([gx + s * a - (s > 0 ? e : 0), gz - a], [gx + s * a + (s < 0 ? e : 0), gz - a], [gx + s * a + (s < 0 ? e : 0), gz + a], [gx + s * a - (s > 0 ? e : 0), gz + a], 0.006, ST); }
      for (let i = 0; i < 7; i++) { const x = gx - a + e + (i + 0.5) * (2 * (a - e)) / 7; q([x - 0.01, gz - a], [x + 0.01, gz - a], [x + 0.01, gz + a], [x - 0.01, gz + a], 0.006, [0.42, 0.44, 0.47]); } }
    // (the layout map over the room by the world's x, z: the paint wears with the floor)
    const lu = (a, b) => [1 / (b - a), -a / (b - a)].map(v => v.toFixed(5)), U = lu(x0, x1), V = lu(ROOM.z0, z1), fm = new THREE.MeshLambertMaterial({ vertexColors: true });
    fm.onBeforeCompile = (sh) => { sh.uniforms.tLay = { value: TX.floorL };
      roomPatch(sh, 'vec4 lay = texture2D(tLay, vRp.xz * vec2(' + U[0] + ', ' + V[0] + ') + vec2(' + U[1] + ', ' + V[1] + ')); diffuseColor.rgb *= mix(1.0, lay.r * 1.6, 0.8) * (0.85 + 0.15 * lay.g);');
      sh.fragmentShader = 'uniform sampler2D tLay;\n' + sh.fragmentShader; };
    fm.customProgramCacheKey = () => 'flL'; fm.polygonOffset = true; fm.polygonOffsetFactor = -1; fm.polygonOffsetUnits = -2;
    const flM = new THREE.Mesh(fl.geometry(), fm); flM.receiveShadow = true; scene.add(mainOnly(flM));
  }
  // dust, seen only where the light falls through it: in the sun's shafts from the front windows (the motes put along them) and in the
  // doors' daylight; elsewhere almost nothing (soft and out of focus, faint)
  function buildMotes() {
    const N = 70, mp = new Float32Array(N * 3), Rm = Core.rng(77), zw = ROOM.z1 - 0.15;
    for (let i = 0; i < N; i++) {
      let x, y, z;
      if (i < 40) do {   // (from a point of a front window's pane, back along the sun to a height in the room)
        const xw = FRONTW[i % FRONTW.length] + (Rm() < 0.5 ? -1 : 1) * (0.08 + Rm() * 0.8), yw = WIN[0] + Rm() * (WIN[1] - WIN[0]); y = 0.3 + Rm() * (yw - 0.6);
        const t = (yw - y) / SUN.y; x = xw - SUN.x * t; z = zw - SUN.z * t;
      } while (Math.abs(x) > ROOM.x1 - 0.4);
      else { const sd = i < 55 ? -1 : 1; x = sd * (7.5 + (Rm() - 0.5) * 2.4); z = (Rm() - 0.5) * 4.4; y = 0.3 + Rm() * 2.2; }   // (in a door's daylight)
      mp[i * 3] = x; mp[i * 3 + 1] = y; mp[i * 3 + 2] = z;
    }
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    motes = new THREE.Points(mg, new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uScale: { value: 400 } },
      vertexShader: 'uniform float uT; uniform float uScale; varying float vA;\n' + RL_SUN + '\nvoid main(){ vec3 p = position; float s = fract(sin(dot(p.xz, vec2(12.9898, 78.233))) * 43758.5453);'
        + ' p.x += sin(uT * 0.13 + s * 30.0) * 0.6; p.z += cos(uT * 0.11 + s * 20.0) * 0.5; p.y += sin(uT * 0.07 + s * 10.0) * 0.4;'
        + ' float door = (p.x > 0.0 ? 1.0 : 0.45) * smoothstep(5.8, 8.4, abs(p.x)) * (1.0 - smoothstep(2.0, 2.6, abs(p.z))) * (1.0 - smoothstep(3.0, 3.9, p.y));'   // (the right door in the sun, the left in the shade)
        + ' float lit = clamp((p.z < ' + zw.toFixed(3) + ' ? rlSun(p) : 0.0) + door, 0.0, 1.0);'
        + ' vec4 mv = modelViewMatrix * vec4(p, 1.0); vA = (0.35 + 0.65 * s) * smoothstep(0.0, 1.5, -mv.z) * mix(0.12, 1.4, lit); gl_PointSize = (0.03 + 0.03 * s) * uScale / max(0.3, -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; gl_FragColor = vec4(vec3(1.0, 0.95, 0.86), vA * 0.12 * (1.0 - r) * (1.0 - r)); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    motes.frustumCulled = false; scene.add(mainOnly(motes));
  }
  /* ---------------- the workshop's things: what makes it a racing team's garage ---------------- */
  // helpers: a box along a segment (frames, handles, poles), a cylinder along an axis; smooth round things (helmets, cups, bottles)
  // merged into one vertex-coloured mesh
  function obox(g, a, b, w, h, col) {
    const d = new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); if (L < 1e-4) return; d.divideScalar(L);
    const up = Math.abs(d.y) > 0.95 ? new V3(1, 0, 0) : new V3(0, 1, 0), sd = new V3().crossVectors(d, up).normalize().multiplyScalar(w / 2), u = new V3().crossVectors(sd, d).normalize().multiplyScalar(h / 2);
    const P = (e, i, j) => { const o = e ? b : a; return [o[0] + sd.x * i + u.x * j, o[1] + sd.y * i + u.y * j, o[2] + sd.z * i + u.z * j]; }, c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let k = 0; k < 4; k++) { const [i0, j0] = q[k], [i1, j1] = q[(k + 1) % 4]; g.quadO(P(0, i0, j0), P(0, i1, j1), P(1, i1, j1), P(1, i0, j0), col, c); }
    g.quadO(P(0, -1, -1), P(0, 1, -1), P(0, 1, 1), P(0, -1, 1), col, c); g.quadO(P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1), col, c);
  }
  function cylA(g, c, axis, r, len, n, col, cap) {   // a cylinder centred at c along 'x', 'y' or 'z', its ends capped
    const A = (t, a, rr) => { const u = Math.cos(a) * rr, v = Math.sin(a) * rr; return axis === 'x' ? [c[0] + t, c[1] + u, c[2] + v] : axis === 'y' ? [c[0] + u, c[1] + t, c[2] + v] : [c[0] + u, c[1] + v, c[2] + t]; };
    for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
      g.quadO(A(-len / 2, a0, r), A(len / 2, a0, r), A(len / 2, a1, r), A(-len / 2, a1, r), col, c);
      for (const e of [-1, 1]) g.triO(A(e * len / 2, 0, 0), A(e * len / 2, a0, r), A(e * len / 2, a1, r), cap || col, A(-e * len, 0, 0)); }
  }
  class SmoothB {   // round, glossy things: three.js geometries placed by a matrix, one colour each, merged
    constructor() { this.P = []; this.N = []; this.C = []; }
    add(geo, m, col) {
      const g = geo.index ? geo.toNonIndexed() : geo; g.applyMatrix4(m); const p = g.attributes.position, nr = g.attributes.normal;
      for (let i = 0; i < p.count; i++) { this.P.push(p.getX(i), p.getY(i), p.getZ(i)); this.N.push(nr.getX(i), nr.getY(i), nr.getZ(i)); this.C.push(col[0], col[1], col[2]); }
      geo.dispose(); if (g !== geo) g.dispose();
    }
    geometry() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3)); g.computeBoundingSphere(); return g; }
  }
  const M4 = (x, y, z, rx, ry, rz, sx, sy, sz) => new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new V3(sx || 1, sy || sx || 1, sz || sx || 1));
  const decorEnv = [];   // (the glossy materials: the room's cube map once it is made)
  let screen = null;
  /* ---------------- the prop toolkit: three.js shapes poured into a piece's matte mesh (smooth normals, a colour a face), the props'
     palette and gloss, their textures ---------------- */
  // the palette: graphite and steel, the paint muted (the colour is the car's and the brand's: navy, gold, cyan)
  const PAL = { red: [0.58, 0.1, 0.09], red2: [0.42, 0.07, 0.06], dk: [0.07, 0.07, 0.08], rub: [0.075, 0.075, 0.085], steel: [0.6, 0.63, 0.68], alu: [0.72, 0.74, 0.78],
    chrome: [0.86, 0.88, 0.92], navy: [0.1, 0.13, 0.26], gold: [0.93, 0.71, 0.2], cyan: [0.3, 0.72, 0.95], white: [0.9, 0.9, 0.88], wood: [0.42, 0.3, 0.18] };
  const MATTE = 0.15, SATIN = 0.5, PAINT = 1, METAL = 2.2;   // (the gloss of the faces that follow: gloss())
  const BANDS = [[0.95, 0.78, 0.15], [0.86, 0.16, 0.12], [0.92, 0.92, 0.9]];   // (the slicks' compound rings: as the car's tyres' bands)
  const BLOBS = [];   // (the soft shadows on the floor: [x, z, w, d, k how dark, angle, piece]; buildDecor lays them all)
  // a box (its bottom at cy) into g; one standing on the floor taller than 0.7 m is split at 0.4 m: the floor's occlusion (the vertex
  // colours darker under 0.4 m) stays at its foot
  function fbox(g, cx, cy, cz, sx, sy, sz, col, top, rot) {
    if (cy < 0.3 && cy + sy > 0.7) { World.box(g, cx, cy, cz, sx, 0.4 - cy, sz, rot || 0, col, col); World.box(g, cx, 0.4, cz, sx, cy + sy - 0.4, sz, rot || 0, col, top, true); }
    else World.box(g, cx, cy, cz, sx, sy, sz, rot || 0, col, top);
  }
  // any geometry placed by a matrix (never a mirroring one: its faces would turn inside out); col: a colour, or fn(the face's centroid
  // and normal before the matrix, its index) -> a colour
  function gAdd(g, geo, m, col) {
    const q = geo.index ? geo.toNonIndexed() : geo, P = q.attributes.position, N = q.attributes.normal, fn = typeof col === 'function', cs = [];
    if (fn) for (let i = 0; i < P.count; i += 3) cs.push(col([(P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3, (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3], [N.getX(i), N.getY(i), N.getZ(i)], i / 3));
    if (m) q.applyMatrix4(m);
    const v = (k) => [P.getX(k), P.getY(k), P.getZ(k)], n = (k) => [N.getX(k), N.getY(k), N.getZ(k)];
    for (let i = 0; i < P.count; i += 3) { const c = fn ? cs[i / 3] : col; g.triN(v(i), v(i + 1), v(i + 2), n(i), n(i + 1), n(i + 2), c, c, c); }
    geo.dispose(); if (q !== geo) q.dispose();
  }
  const gBox = (g, m, x, y, z, sx, sy, sz, col) => gAdd(g, new THREE.BoxGeometry(sx, sy, sz), m ? m.clone().multiply(M4(x, y, z)) : M4(x, y, z), col);   // (centred at x, y, z in m's frame)
  function seg(g, a, b, r, col, n) {   // a round bar from a to b
    const d = new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
    gAdd(g, new THREE.CylinderGeometry(r, r, L, n || 6), new THREE.Matrix4().compose(new V3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.divideScalar(L)), new V3(1, 1, 1)), col);
  }
  const tube = (g, pts, r, col, n, rad) => gAdd(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new V3(p[0], p[1], p[2]))), n || 16, r, rad || 4, false), null, col);   // (a hose, a lead)
  // a closed lathe round y from half a profile [r, y] (mirrored in y): face f lies on the profile's segment (f >> 1) % (n - 1)
  function lathe(half, seg) { const pts = half.concat(half.slice().reverse().map(p => [p[0], -p[1]])); pts.push(half[0]); return { geo: new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), n: pts.length }; }
  // a slick round y: beads, rounded shoulders, the tread a little lighter (worn), the inner wall dark, a compound ring on both sidewalls
  // (band; lo: fewer segments in the profile, for the rack's)
  const TYRE = [[0.215, -0.106], [0.25, -0.117], [0.278, -0.12], [0.292, -0.12], [0.312, -0.115], [0.328, -0.098], [0.336, -0.06]], TYRE_LO = [TYRE[0], TYRE[2], TYRE[4], TYRE[6]];
  function tyre(g, m, band, seg, lo) {
    const { geo, n } = lathe(lo ? TYRE_LO : TYRE, seg || 16), b = lo ? [1, n - 4] : [2, n - 5], t = lo ? [3, 3] : [5, 7];
    gAdd(g, geo, m, (c, nr, f) => { const j = (f >> 1) % (n - 1); return j === n - 2 ? [0.03, 0.03, 0.035] : band && (j === b[0] || j === b[1]) ? band : j >= t[0] && j <= t[1] ? [0.1, 0.1, 0.11] : PAL.rub; });
  }
  function rimTop(g, m, nut) {   // a wheel's face seen on top of a stack: the dish, six spokes, the centre-lock nut
    gAdd(g, new THREE.CylinderGeometry(0.212, 0.212, 0.2, 18), m, (c, nr) => nr[1] > 0.5 ? [0.2, 0.21, 0.23] : [0.3, 0.31, 0.34]);
    for (let k = 0; k < 6; k++) gBox(g, m.clone().multiply(M4(0, 0, 0, 0, k / 6 * TAU, 0)), 0, 0.104, 0.1, 0.035, 0.012, 0.19, [0.62, 0.64, 0.68]);
    gAdd(g, new THREE.CylinderGeometry(0.05, 0.05, 0.05, 6), m.clone().multiply(M4(0, 0.115, 0)), nut);
  }
  // a tyre warmer round a wheel: a quilted cover (navy, a narrow gold strap round the tread, grey side panels, a white label), open on
  // the rim in the middle
  const BLK = [[0.2, -0.128], [0.27, -0.142], [0.325, -0.137], [0.35, -0.112], [0.36, -0.06], [0.362, -0.018]];
  function blanket(g, m) {
    const { geo, n } = lathe(BLK, 20), P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); if (Math.hypot(x, z) > 0.3) { const k = 1 + 0.018 * Math.cos(Math.atan2(z, x) * 10); P.setX(i, x * k); P.setZ(i, z * k); } }   // (the quilting)
    geo.computeVertexNormals();
    gAdd(g, geo, m, (c, nr, f) => { const j = (f >> 1) % (n - 1); return j === n - 2 ? [0.04, 0.04, 0.05] : j === 5 ? [0.8, 0.6, 0.16] : (j === 3 || j === 4) && (f >> 1) < 2 * (n - 1) ? [0.9, 0.9, 0.88] : j === 1 || j === n - 4 ? [0.16, 0.18, 0.24] : PAL.navy; });
  }
  // a tyre trolley (its handle at local +x) with a set of four wheels in two stacks: in their warmers (warm: the warmers' controller on
  // the handle, its display and LEDs lit, a lead to each) or bare slicks; the top wheels show their rims, centre-lock nuts red and blue
  function trolley(p, X, Z, ry, warm) {
    const g = p.g, B = M4(X, 0, Z, 0, ry, 0), at = (x, y, z) => new V3(x, y, z).applyMatrix4(B).toArray(), F = [0.16, 0.17, 0.2], DK = PAL.dk, wh = [];
    for (const sx of [-0.36, 0.36]) for (let k = 0; k < 2; k++) wh.push([sx, k, B.clone().multiply(M4(sx, 0.14 + (warm ? 0.142 + k * 0.284 : 0.12 + k * 0.24), 0, 0, k * 0.7 + sx))]);
    gloss(p, PAINT); for (const sz of [-0.36, 0.36]) gBox(g, B, 0, 0.1, sz, 1.5, 0.05, 0.05, F);
    for (const sx of [-0.7, 0, 0.7]) gBox(g, B, sx, 0.1, 0, 0.05, 0.05, 0.77, F);
    gBox(g, B, 0, 0.13, 0, 1.46, 0.015, 0.74, [0.25, 0.26, 0.29]);
    for (const sz of [-0.3, 0.3]) seg(g, at(0.72, 0.1, sz), at(0.76, 1.0, sz), 0.016, F);
    for (const sx of [-0.66, 0.66]) for (const sz of [-0.32, 0.32]) gBox(g, B, sx, 0.06, sz, 0.05, 0.05, 0.03, DK);
    gloss(p, MATTE); for (const sx of [-0.66, 0.66]) for (const sz of [-0.32, 0.32]) gAdd(g, new THREE.CylinderGeometry(0.045, 0.045, 0.03, 10), B.clone().multiply(M4(sx, 0.045, sz, Math.PI / 2)), DK);
    seg(g, at(0.76, 1.0, -0.33), at(0.76, 1.0, 0.33), 0.022, DK, 8);
    for (const w of wh) if (warm) blanket(g, w[2]); else tyre(g, w[2], BANDS[0]);
    gloss(p, METAL); for (const [sx, k, m] of wh) if (k) rimTop(g, warm ? m.clone().multiply(M4(0, 0.03, 0)) : m, sx < 0 ? [0.78, 0.14, 0.1] : [0.15, 0.36, 0.8]);
    if (!warm) return;
    gloss(p, PAINT); gBox(g, B, 0.79, 0.78, 0, 0.1, 0.22, 0.34, [0.09, 0.09, 0.1]);
    gBox(g, B, 0.845, 0.82, 0, 0.01, 0.08, 0.2, [0.6, 1.6, 2.4]); for (const sz of [-0.1, -0.05]) gBox(g, B, 0.845, 0.73, sz, 0.01, 0.02, 0.02, [0.4, 2.2, 0.6]);   // (its display, two LEDs: over 1, they glow)
    gloss(p, MATTE); for (const [sx, k] of wh) { const y = 0.28 + k * 0.284; tube(g, [[sx + 0.3, y, 0.3], [sx + 0.45, y + 0.15, 0.32], [0.7, 0.6, 0.2], [0.78, 0.7, 0.1]].map(q => at(...q)), 0.008, DK, 12, 4); }
  }
  // a road case: its body, aluminium edges and ball corners, the lid's seam and its latches, handles at its ends, a plate with two dark
  // bars (no words); castors if asked
  function fcase(p, X, Y, Z, w, h, d, ry, col, wheels, plate) {
    const g = p.g, B = M4(X, Y, Z, 0, ry, 0), { alu: A, chrome: C, dk: DK } = PAL, e = 0.028, ys = h * 0.74;
    gloss(p, PAINT); gBox(g, B, 0, h / 2, 0, w, h, d, col);
    if (plate) { gBox(g, B, -w * 0.18, h * 0.42, d / 2 + 0.006, 0.26, 0.11, 0.008, plate); for (let k = 0; k < 2; k++) gBox(g, B, -w * 0.18, h * 0.445 - k * 0.04, d / 2 + 0.011, 0.18 - k * 0.06, 0.018, 0.004, [0.08, 0.08, 0.09]); }
    gloss(p, METAL);
    for (const sy of [0, h]) for (const s of [-1, 1]) { gBox(g, B, 0, sy, s * d / 2, w, e, e, A); gBox(g, B, s * w / 2, sy, 0, e, e, d, A); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { gBox(g, B, sx * w / 2, h / 2, sz * d / 2, e, h, e, A); for (const sy of [0, h]) gBox(g, B, sx * w / 2, sy, sz * d / 2, 0.05, 0.05, 0.05, C); }
    for (const sz of [-1, 1]) { gBox(g, B, 0, ys, sz * (d / 2 + 0.004), w, 0.022, 0.01, A); for (const sx of [-0.3, 0.3]) gBox(g, B, sx * w, ys, sz * (d / 2 + 0.012), 0.07, 0.06, 0.016, C); }
    for (const sx of [-1, 1]) { gBox(g, B, sx * w / 2, ys, 0, 0.022, 0.022, d, A); gBox(g, B, sx * (w / 2 + 0.014), h * 0.45, 0, 0.014, 0.022, 0.15, PAL.steel); }
    gloss(p, MATTE); for (const sx of [-1, 1]) gBox(g, B, sx * (w / 2 + 0.005), h * 0.45, 0, 0.012, 0.08, 0.2, [0.03, 0.03, 0.035]);   // (the handles' recesses)
    if (wheels) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { gBox(g, B, sx * (w / 2 - 0.08), -0.035, sz * (d / 2 - 0.08), 0.05, 0.05, 0.04, DK); gAdd(g, new THREE.CylinderGeometry(0.045, 0.045, 0.03, 10), B.clone().multiply(M4(sx * (w / 2 - 0.08), -0.055, sz * (d / 2 - 0.08), Math.PI / 2)), DK); }
  }
  // a race suit on its hanger (m: the hook's frame, the suit facing local +z): an extruded silhouette coloured by where each face is
  // (the yoke, a stripe down the sides and the legs, the belt, the collar, the boots); no marks
  function suit(p, m, base, yoke, stripe) {
    const g = p.g, s = new THREE.Shape(), Q = [[-0.07, 0], [-0.22, -0.04], [-0.275, -0.62], [-0.19, -0.645], [-0.175, -0.22], [-0.16, -0.23], [-0.165, -0.74], [-0.18, -0.82], [-0.19, -1.46], [-0.035, -1.46], [-0.02, -0.88],
      [0.02, -0.88], [0.035, -1.46], [0.19, -1.46], [0.18, -0.82], [0.165, -0.74], [0.16, -0.23], [0.175, -0.22], [0.19, -0.645], [0.275, -0.62], [0.22, -0.04], [0.07, 0], [0, -0.05]];
    Q.forEach((q, i) => i ? s.lineTo(q[0], q[1]) : s.moveTo(q[0], q[1]));
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.018, bevelSegments: 1, curveSegments: 1 }); geo.translate(0, 0, -0.025);
    gloss(p, MATTE); gAdd(g, geo, m, (c) => c[1] < -1.37 ? [0.06, 0.06, 0.07] : c[1] > -0.035 && Math.abs(c[0]) < 0.1 ? [0.92, 0.92, 0.9] : c[1] > -0.17 ? yoke
      : Math.abs(c[0]) > 0.245 || (c[1] < -0.85 && Math.abs(c[0]) > 0.155) ? stripe : c[1] < -0.72 && c[1] > -0.77 ? [0.05, 0.05, 0.06] : base);
    gloss(p, METAL); const at = (x, y) => new V3(x, y, 0).applyMatrix4(m).toArray();
    for (const sx of [-0.2, 0.2]) seg(g, at(sx, -0.03), at(0, 0.08), 0.008, [0.35, 0.25, 0.15]);
    seg(g, at(0, 0.08), at(0, 0.15), 0.005, PAL.steel);
  }
  // an oil drum: rolling hoops, the chimes worn bare, a label band, two bungs; its paint a little worn (R: the wear's dice)
  function drum(p, x, z, col, R) {
    const g = p.g, w = (k) => [col[0] * k, col[1] * k, col[2] * k], r = 0.28;
    gloss(p, PAINT); gAdd(g, new THREE.CylinderGeometry(r, r, 0.87, 20, 2), M4(x, 0.445, z), (c, n) => n[1] > 0.5 ? w(0.8) : w(0.93 + R() * 0.12));
    for (const y of [0.3, 0.6]) gAdd(g, new THREE.CylinderGeometry(r + 0.007, r + 0.007, 0.025, 20, 1, true), M4(x, y, z), w(0.85));
    gAdd(g, new THREE.CylinderGeometry(r + 0.002, r + 0.002, 0.2, 10, 1, true, 0.4 + R(), 1.3), M4(x, 0.45, z), [0.9, 0.9, 0.86]);
    gloss(p, METAL); for (const y of [0.015, 0.875]) gAdd(g, new THREE.CylinderGeometry(r + 0.01, r + 0.01, 0.03, 20, 1, true), M4(x, y, z), w(1.25));
    for (const [bx2, bz2, r] of [[0.17, 0.05, 0.03], [-0.15, -0.08, 0.022]]) gAdd(g, new THREE.CylinderGeometry(r, r, 0.02, 8), M4(x + bx2, 0.89, z + bz2), [0.6, 0.62, 0.66]);
  }
  // the props' own textures: the floor decals' atlas, 4 x 4 cells of 64 px: 11 shades of a soft blob (the 11th as dark as the old
  // blob), an empty cell, 4 old oil stains
  function makePropTextures() {
    const R = Core.rng(4244);
    TX.decal = canvasTex(256, 256, (g) => {
      for (let i = 0; i < 16; i++) { const x = (i % 4) * 64 + 32, y = (i >> 2) * 64 + 32;
        if (i < 11) { const a = 0.6 * (i + 1) / 11, gr = g.createRadialGradient(x, y, 0, x, y, 31); gr.addColorStop(0, 'rgba(0,0,0,' + a.toFixed(3) + ')'); gr.addColorStop(0.6, 'rgba(0,0,0,' + (a / 2).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 32, y - 32, 64, 64); }
        else if (i > 11) for (let k = 0; k < 6; k++) { const sx = x - 10 + R() * 20, sy = y - 10 + R() * 20, r = 5 + R() * 13, gr = g.createRadialGradient(sx, sy, 0, sx, sy, r);
          gr.addColorStop(0, 'rgba(10,8,6,0.35)'); gr.addColorStop(1, 'rgba(10,8,6,0)'); g.fillStyle = gr; g.fillRect(sx - r, sy - r, 2 * r, 2 * r); } }
    });
  }
  function buildDecor() {
    const { z0, z1, x0, x1, door } = ROOM, box = (...a) => fbox(g, ...a);
    let g = null, sm = null, cp = null; const use = (p, k) => { g = p.g; sm = p.sm; cp = p; gloss(p, k == null ? PAINT : k); return p; }, gl = (k) => gloss(cp, k);   // (the piece being built: a wall's, or a thing of its own)
    const { red: RED, red2: RED2, dk: DK, steel: STEEL, alu: ALU, chrome: CHROME, navy: NAVY, gold: GOLD, cyan: CYAN, white: WHITE } = PAL;
    const castor = (m, x, y, z, r) => gAdd(g, new THREE.CylinderGeometry(r, r, r * 0.8, 10), (m ? m.clone() : new THREE.Matrix4()).multiply(M4(x, y, z, Math.PI / 2)), DK);   // (a wheel, its axle along z)
    makePropTextures();
    // an engine on its stand behind the turntable, left: a race V8 (red cam covers, coil packs, eight trumpets, the headers tinted by the
    // heat), the stand's head on the bellhousing; a shop crane parked over it, its chain on the engine
    { const P = use(piece()), X = -5.25, Z = -2.35, Y0 = 0.72, AL = [0.55, 0.57, 0.6], AL2 = [0.44, 0.46, 0.5], YL = [0.9, 0.6, 0.12], YL2 = [0.76, 0.5, 0.1], Z0 = -3.85; P.near = 4.4;
      gBox(g, null, X - 0.62, 0.1, Z, 0.08, 0.06, 0.92, RED); gBox(g, null, X - 0.06, 0.1, Z, 1.12, 0.06, 0.08, RED);   // the stand: its T on castors, the post, the head
      gBox(g, null, X - 0.62, 0.44, Z, 0.08, 0.62, 0.08, RED); gBox(g, null, X - 0.53, Y0, Z, 0.18, 0.07, 0.07, RED);
      gAdd(g, new THREE.CylinderGeometry(0.14, 0.14, 0.025, 16), M4(X - 0.44, Y0, Z, 0, 0, Math.PI / 2), RED2);
      for (const a of [0.8, 2.35, 3.93, 5.5]) seg(g, [X - 0.43, Y0, Z], [X - 0.4, Y0 + Math.sin(a) * 0.19, Z + Math.cos(a) * 0.19], 0.018, RED);
      for (const [cx, cz] of [[X - 0.62, Z - 0.42], [X - 0.62, Z + 0.42], [X + 0.48, Z]]) gBox(g, null, cx, 0.06, cz, 0.05, 0.04, 0.05, DK);
      gl(1.3); gAdd(g, new THREE.CylinderGeometry(0.2, 0.16, 0.13, 18), M4(X - 0.36, Y0, Z, 0, 0, Math.PI / 2), AL);   // the bellhousing, the block, the dry sump (cast: satin)
      gBox(g, null, X + 0.02, 0.66, Z, 0.6, 0.3, 0.36, AL); gBox(g, null, X + 0.02, 0.47, Z, 0.56, 0.08, 0.3, [0.16, 0.17, 0.19]);
      for (const sd of [-1, 1]) { const m = M4(X + 0.02, 0.86, Z + sd * 0.13, sd * 0.62, 0, 0);   // a bank: its head, the cam cover (red), the coil packs
        gl(1.3); gBox(g, m, 0, 0, 0, 0.58, 0.2, 0.17, AL2); gl(PAINT); gBox(g, m, 0, 0.12, 0, 0.6, 0.05, 0.15, RED);
        for (let i = 0; i < 4; i++) gBox(g, m, -0.21 + i * 0.14, 0.16, sd * 0.02, 0.05, 0.04, 0.06, [0.05, 0.05, 0.06]);
        gl(METAL); for (let i = 0; i < 4; i++) { const x = X - 0.19 + i * 0.13;   // the headers, tinted by the heat, into a collector
          tube(g, [[x, 0.8, Z + sd * 0.25], [x + 0.01, 0.78, Z + sd * 0.38], [x + 0.06, 0.62, Z + sd * 0.43], [X + 0.28, 0.52, Z + sd * 0.38], [X + 0.48, 0.48, Z + sd * 0.3]], 0.021,
            (c) => c[1] > 0.7 ? [0.7, 0.58, 0.4] : c[1] > 0.58 ? [0.4, 0.34, 0.5] : [0.36, 0.36, 0.4], 16, 6); } }
      gl(PAINT); gBox(g, null, X + 0.02, 1.0, Z, 0.5, 0.05, 0.14, [0.13, 0.14, 0.16]);   // the plenum in the vee, eight trumpets on it
      gl(METAL); for (let i = 0; i < 4; i++) for (const sz of [-0.04, 0.04]) gAdd(g, new THREE.CylinderGeometry(0.03, 0.022, 0.12, 10, 1, true), M4(X - 0.17 + i * 0.12, 1.08, Z + sz), CHROME);
      gBox(g, null, X + 0.35, 0.66, Z, 0.06, 0.44, 0.3, AL2);   // the timing cover, its pulleys, the belt, an oil line
      for (const [y, z, r] of [[0.55, 0, 0.09], [0.82, -0.1, 0.055], [0.9, 0.13, 0.06]]) gAdd(g, new THREE.CylinderGeometry(r, r, 0.04, 14), M4(X + 0.4, y, Z + z, 0, 0, Math.PI / 2), [0.2, 0.2, 0.22]);
      gl(MATTE); seg(g, [X + 0.42, 0.55, Z - 0.09], [X + 0.42, 0.82, Z - 0.155], 0.008, DK); seg(g, [X + 0.42, 0.55, Z + 0.09], [X + 0.42, 0.9, Z + 0.19], 0.008, DK);
      tube(g, [[X - 0.1, 0.47, Z + 0.16], [X - 0.2, 0.4, Z + 0.3], [X - 0.05, 0.55, Z + 0.3]], 0.012, [0.32, 0.33, 0.36], 10, 5);
      for (const [cx, cz] of [[X - 0.62, Z - 0.42], [X - 0.62, Z + 0.42], [X + 0.48, Z]]) castor(null, cx, 0.035, cz, 0.035);
      // the crane (yellow): its legs either side of the stand, the mast and its braces, the boom, the ram, the pump's handle, the chain
      gl(PAINT); for (const lx of [-6.05, -4.45]) { gBox(g, null, lx, 0.11, (Z0 - 2.3) / 2, 0.08, 0.08, 1.55, YL); seg(g, [lx, 0.15, -3.3], [X + Math.sign(lx - X) * 0.05, 0.85, Z0 + 0.06], 0.022, YL2); gBox(g, null, lx, 0.05, -2.38, 0.05, 0.04, 0.05, DK); }
      gBox(g, null, X, 0.11, Z0, 1.68, 0.09, 0.09, YL); gBox(g, null, X, 0.925, Z0, 0.11, 1.55, 0.11, YL);
      seg(g, [X, 1.62, Z0 + 0.02], [X, 2.02, -2.35], 0.052, YL, 4);
      seg(g, [X, 0.3, Z0 + 0.06], [X, 1.1, Z0 + 0.55], 0.045, DK, 10); gl(METAL); seg(g, [X, 1.08, Z0 + 0.54], [X, 1.82, Z0 + 0.99], 0.022, CHROME, 10);
      seg(g, [X + 0.1, 0.45, Z0], [X + 0.1, 1.05, Z0 - 0.42], 0.014, STEEL); gBox(g, null, X + 0.1, 1.03, Z0 - 0.45, 0.04, 0.1, 0.04, DK);
      for (let i = 0; i < 9; i++) gBox(g, null, X, 1.95 - i * 0.062, -2.35, i % 2 ? 0.012 : 0.03, 0.06, i % 2 ? 0.03 : 0.012, STEEL);
      gl(PAINT); gAdd(g, new THREE.TorusGeometry(0.035, 0.009, 5, 10, Math.PI * 1.4), M4(X, 1.39, -2.35, 0, Math.PI / 2, 0), [0.78, 0.14, 0.1]);   // (the hook)
      gl(METAL); gBox(g, null, X, 1.32, -2.35, 0.6, 0.035, 0.035, DK); for (const sx of [-0.28, 0.28]) seg(g, [X + sx, 1.32, -2.35], [X + sx * 0.9, 0.98, Z], 0.008, STEEL);   // (the leveller, its chains to the heads)
      gl(MATTE); for (const lx of [-6.05, -4.45]) castor(null, lx, 0.04, -2.38, 0.04); for (const lx of [-6.0, -4.5]) castor(null, lx, 0.04, Z0 - 0.08, 0.04);
      BLOBS.push([X - 0.05, Z, 1.4, 1.1, 0.8, 0, P], [X, -3.15, 1.9, 1.7, 0.5, 0, P]); }
    // a roll cab on the floor by the table: drawers with their pulls, a rubber mat on top with the tools on it, a push bar, castors
    { const P = use(piece()), X = -6.75, Z = -2.2, w = 0.82, d = 0.5, n = 4, dy = 0.7 / n, WORN = [RED[0] * 1.25, RED[1] * 1.25, RED[2] * 1.25];
      box(X, 0.12, Z, w, 0.7, d, RED, RED2);
      for (let i = 0; i < n; i++) { const y = 0.12 + i * dy; box(X, y, Z + d / 2 + 0.003, w - 0.05, 0.01, 0.01, RED2); box(X, y + dy - 0.016, Z + d / 2 + 0.003, w - 0.05, 0.012, 0.008, WORN); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(X + sx * (w / 2 - 0.07), 0.06, Z + sz * (d / 2 - 0.07), 0.05, 0.06, 0.05, DK);
      box(X + 0.15, 0.84, Z - 0.05, 0.08, 0.14, 0.06, [0.85, 0.68, 0.12]); obox(g, [X + 0.15, 0.95, Z - 0.05], [X + 0.32, 0.95, Z - 0.05], 0.07, 0.07, [0.85, 0.68, 0.12]); box(X + 0.15, 0.82, Z - 0.05, 0.1, 0.03, 0.08, DK);   // a cordless drill
      cylA(g, [X + 0.3, 0.92, Z + 0.13], 'y', 0.045, 0.16, 10, [0.18, 0.36, 0.7], [0.8, 0.8, 0.82]);   // a spray can
      gl(METAL); for (let i = 0; i < n; i++) box(X, 0.12 + i * dy + dy * 0.6, Z + d / 2 + 0.012, w - 0.12, 0.022, 0.022, ALU);
      for (const sx of [-1, 1]) { obox(g, [X + sx * (w / 2 + 0.05), 0.75, Z - 0.15], [X + sx * (w / 2 + 0.05), 0.75, Z + 0.15], 0.03, 0.03, STEEL); for (const sz of [-0.15, 0.15]) obox(g, [X + sx * (w / 2), 0.75, Z + sz], [X + sx * (w / 2 + 0.05), 0.75, Z + sz], 0.03, 0.03, STEEL); }
      for (let i = 0; i < 4; i++) obox(g, [X - 0.3 + i * 0.07, 0.845, Z - 0.15], [X - 0.27 + i * 0.07, 0.845, Z + 0.12], 0.025, 0.01, STEEL);   // spanners
      gl(MATTE); box(X, 0.82, Z, w - 0.02, 0.014, d - 0.02, [0.08, 0.08, 0.09]);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylA(g, [X + sx * (w / 2 - 0.07), 0.045, Z + sz * (d / 2 - 0.07)], 'z', 0.045, 0.035, 8, DK);
      BLOBS.push([X, Z, 1.2, 0.9, 0.85, 0, P]); }
    // a trolley jack by the engine, its handle up; a mechanic's rolling stool by the bench
    { const P = use(piece()), B = M4(-3.3, 0, -3.6, 0, -0.5, 0), L = (x, y, z) => new V3(x, y, z).applyMatrix4(B).toArray(), SX = -2.7, SZ = -4.1;
      obox(g, L(-0.35, 0.1, 0), L(0.3, 0.1, 0), 0.26, 0.12, RED); obox(g, L(0.3, 0.14, 0), L(0.42, 0.22, 0), 0.12, 0.06, RED); obox(g, L(-0.33, 0.14, 0), L(-0.8, 0.85, 0.1), 0.04, 0.04, RED);
      gl(METAL); cylA(g, L(0.45, 0.24, 0), 'y', 0.07, 0.03, 10, STEEL); seg(g, [SX, 0.1, SZ], [SX, 0.44, SZ], 0.025, CHROME, 8);
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; seg(g, [SX, 0.1, SZ], [SX + Math.cos(a) * 0.26, 0.07, SZ + Math.sin(a) * 0.26], 0.014, [0.2, 0.21, 0.23]); }
      gl(MATTE); obox(g, L(-0.8, 0.85, 0.1), L(-0.86, 0.95, 0.11), 0.05, 0.05, DK);
      for (const sz of [-1, 1]) { castor(B, -0.28, 0.05, sz * 0.15, 0.05); castor(B, 0.24, 0.04, sz * 0.12, 0.04); }
      gAdd(g, new THREE.CylinderGeometry(0.19, 0.18, 0.07, 14), M4(SX, 0.475, SZ), [0.05, 0.05, 0.06]); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; castor(null, SX + Math.cos(a) * 0.26, 0.03, SZ + Math.sin(a) * 0.26, 0.03); }
      BLOBS.push([-3.3, -3.6, 1.1, 0.7, 0.7, 0.5, P], [SX, SZ, 0.7, 0.7, 0.6, 0, P]); }
    // a set of wheels in their warmers on a tyre trolley behind the table (its controller on the handle, the mains lead along the floor to
    // a socket on the wall); a set of bare slicks on a second trolley by the back right corner
    { const P = use(piece()); P.near = 4.4; trolley(P, 1.95, -3.45, 0, true);
      gl(MATTE); tube(g, [[2.74, 0.67, -3.36], [2.8, 0.3, -3.24], [2.86, 0.012, -3.2], [2.98, 0.012, -3.9], [2.4, 0.012, -4.3], [1.4, 0.012, -4.4], [0.95, 0.012, -4.72], [0.87, 0.14, -4.9], [0.85, 0.37, -4.95]], 0.008, DK, 48, 4);
      BLOBS.push([1.95, -3.45, 1.8, 1.1, 0.9, 0, P]); }
    { use(WALLS.back); box(0.85, 0.37, z0 + 0.03, 0.12, 0.16, 0.06, [0.5, 0.52, 0.55]); box(0.85, 0.42, z0 + 0.061, 0.07, 0.07, 0.004, [0.2, 0.21, 0.23]); }   // (the socket)
    { const P = use(piece()); P.near = 4.4; trolley(P, 6.25, -2.8, Math.PI + 0.12, false); BLOBS.push([6.25, -2.8, 1.8, 1.1, 0.9, 0.12, P]); }
    // stacks of slicks, a little out of line (a set of wheels on the second, its rim on top; one leaning on the first), by the way in;
    // cones by the way out
    const Rt = Core.rng(5), tyreStack = (x, z, n, rim, lean) => { const P = use(piece(), MATTE); P.near = 4.4; let m = null;
      for (let i = 0; i < n; i++) { m = M4(x + (Rt() - 0.5) * 0.05, 0.12 + i * 0.24, z + (Rt() - 0.5) * 0.05, 0, Rt() * 6, (Rt() - 0.5) * 0.03); tyre(g, m, rim ? BANDS[0] : BANDS[i % 3]); }
      if (lean) tyre(g, M4(lean[0], 0.335, lean[1], Math.PI / 2 - 0.22, 0, 0), BANDS[1]);
      if (rim) { gl(METAL); rimTop(g, m, [0.15, 0.36, 0.8]); }
      BLOBS.push([x, z, 0.95, 0.95, 0.9, 0, P]); if (lean) BLOBS.push([lean[0], lean[1] + 0.05, 0.8, 0.45, 0.7, 0, P]); };
    tyreStack(-8.1, -3.5, 4, false, [-7.9, -2.98]); tyreStack(-7.1, -3.65, 3, true); tyreStack(-8.25, 3.6, 2, false);
    const PC = piece(); for (const [x, z, n] of [[7.9, -3.5, 3], [7.4, -4.1, 1]]) { use(PC); for (let i = 0; i < n; i++) { box(x, i * 0.07, z, 0.4, 0.035, 0.4, [0.95, 0.35, 0.06]); World.cone(g, x, i * 0.07 + 0.035, z, 0.16, 0.62, 12, [1, 0.42, 0.08], [1, 0.5, 0.12], 0); } World.cyl(g, x, n * 0.07 + 0.2, z, 0.115, 0.1, 12, [0.95, 0.95, 0.93]); BLOBS.push([x, z, 0.8, 0.8, 0.6, 0, PC]); }
    // the team's road cases stacked by the way out, end on to the door, clear of its hatch and bollard: navy on castors, black, gold on
    // top (blank plates, toward the room)
    { const P = use(piece()), q = -Math.PI / 2; P.near = 4.4;
      fcase(P, 7.66, 0.1, -2.62, 1.1, 0.6, 0.62, q, [0.1, 0.12, 0.19], true, GOLD); fcase(P, 7.68, 0.73, -2.65, 0.95, 0.5, 0.56, q + 0.05, [0.06, 0.06, 0.07], false, [0.9, 0.9, 0.86]); fcase(P, 7.63, 1.26, -2.57, 0.55, 0.34, 0.42, q - 0.3, GOLD, false, null);
      BLOBS.push([7.66, -2.62, 1.0, 1.5, 0.9, 0, P]); }
    // the safety corner by the left door: an extinguisher on its bracket, its sign, a first-aid box
    { const P = use(WALLS.left), X = x0 + 0.17, Z = -3.9;
      sm.add(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 18), M4(X, 0.55, Z), [0.85, 0.08, 0.07]);
      sm.add(new THREE.SphereGeometry(0.1, 18, 8, 0, TAU, 0, Math.PI / 2), M4(X, 0.8, Z), [0.85, 0.08, 0.07]);
      sm.add(new THREE.CylinderGeometry(0.035, 0.04, 0.1, 10), M4(X, 0.92, Z), [0.1, 0.1, 0.11]);
      gl(MATTE); obox(g, [X, 0.95, Z], [X + 0.03, 0.97, Z + 0.15], 0.03, 0.025, [0.1, 0.1, 0.11]); obox(g, [X, 0.9, Z + 0.06], [X + 0.02, 0.4, Z + 0.13], 0.025, 0.025, DK);
      gl(METAL); box(X - 0.12, 0.62, Z, 0.04, 0.05, 0.24, STEEL);
      gl(PAINT); box(x0 + 0.04, 1.2, Z, 0.02, 0.32, 0.32, [0.82, 0.1, 0.08]); box(x0 + 0.055, 1.27, Z, 0.01, 0.06, 0.18, [1, 1, 1]); box(x0 + 0.055, 1.25, Z, 0.01, 0.16, 0.05, [1, 1, 1]);   // (its sign: a red square, a white mark)
      box(x0 + 0.08, 1.45, Z + 0.6, 0.14, 0.32, 0.42, [0.93, 0.94, 0.93]); box(x0 + 0.155, 1.61 - 0.11, Z + 0.6, 0.01, 0.22, 0.07, [0.1, 0.62, 0.3]); box(x0 + 0.155, 1.58, Z + 0.6, 0.01, 0.07, 0.22, [0.1, 0.62, 0.3]);   // (a first-aid box: a green cross)
      BLOBS.push([X + 0.1, Z, 0.5, 0.5, 0.6, 0, P]); }
    // gas bottles on the left wall by the front: chained to a bracket, their shoulders banded, valves and caps; a regulator with its gauge
    // on the middle one, its red hose curling to the floor
    { const P = use(WALLS.left, METAL), X = x0 + 0.25;
      [[4.45, [0.35, 0.42, 0.55], WHITE], [4.7, [0.15, 0.32, 0.2], WHITE], [4.95, [0.6, 0.62, 0.66], [0.8, 0.62, 0.15]]].forEach(([z, c, b]) => {
        sm.add(new THREE.CylinderGeometry(0.11, 0.11, 1.19, 14), M4(X, 0.605, z), c); sm.add(new THREE.SphereGeometry(0.11, 14, 5, 0, TAU, 0, Math.PI / 2), M4(X, 1.2, z), c);
        sm.add(new THREE.CylinderGeometry(0.113, 0.113, 0.1, 14, 1, true), M4(X, 1.1, z), b); sm.add(new THREE.CylinderGeometry(0.025, 0.03, 0.08, 8), M4(X, 1.34, z), [0.72, 0.58, 0.3]);
        sm.add(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 10), M4(X, 1.39, z), [0.1, 0.1, 0.11]); });
      box(x0 + 0.03, 0.9, 4.7, 0.04, 0.2, 0.9, [0.3, 0.32, 0.36]); for (const z of [4.26, 5.14]) obox(g, [x0 + 0.05, 1.0, z], [X + 0.12, 1.0, z], 0.02, 0.02, STEEL);
      for (let i = 0; i < 18; i++) { const z = 4.28 + i * 0.048; gBox(g, null, X + 0.12, 1.0, z, i % 2 ? 0.006 : 0.016, i % 2 ? 0.016 : 0.006, 0.05, [0.3, 0.31, 0.33]); }   // (the chain across them)
      gBox(g, null, X + 0.06, 1.42, 4.7, 0.06, 0.06, 0.08, [0.72, 0.58, 0.3]); gAdd(g, new THREE.CylinderGeometry(0.035, 0.035, 0.02, 14), M4(X + 0.1, 1.46, 4.66, 0, 0, Math.PI / 2), (c, n) => n[1] < -0.5 ? WHITE : DK);   // the regulator, its gauge
      gl(MATTE); tube(g, [[X + 0.1, 1.38, 4.72], [X + 0.25, 1.1, 4.62], [X + 0.32, 0.4, 4.42], [X + 0.38, 0.012, 4.18], [X + 0.62, 0.012, 4.3], [X + 0.6, 0.012, 4.62], [X + 0.4, 0.012, 4.6]], 0.01, [0.66, 0.12, 0.1], 40, 4);
      BLOBS.push([X + 0.05, 4.7, 0.6, 1.0, 0.7, 0, P]); }
    // a shelf over the tyre rack: helmets of the team's drivers, two cups won
    { use(WALLS.back); const sx0 = 1.75, sx1 = 4.55, Y = 2.34, Z = z0 + 0.17;
      box((sx0 + sx1) / 2, Y - 0.04, Z, sx1 - sx0, 0.04, 0.3, [0.16, 0.17, 0.19], [0.24, 0.25, 0.28]);
      gl(METAL); for (const x of [sx0 + 0.2, sx1 - 0.2]) obox(g, [x, Y - 0.05, z0 + 0.02], [x, Y - 0.25, z0 + 0.02], 0.03, 0.03, STEEL), obox(g, [x, Y - 0.06, z0 + 0.02], [x, Y - 0.06, z0 + 0.28], 0.03, 0.03, STEEL);
      const helmet = (x, a, b, c) => {   // a helmet: its shell, a stripe over it, the dark visor
        sm.add(new THREE.SphereGeometry(0.15, 20, 14), M4(x, Y + 0.14, Z, 0, 0.35, 0, 1, 0.92, 1.08), a);
        sm.add(new THREE.TorusGeometry(0.152, 0.018, 6, 24, Math.PI * 1.15), M4(x, Y + 0.14, Z, 0, 0.35 + Math.PI / 2, -0.08, 1, 0.92, 1.08), b);
        sm.add(new THREE.SphereGeometry(0.153, 16, 8, Math.PI / 2 - 0.95, 1.9, 1.15, 0.6), M4(x, Y + 0.13, Z, 0, 0.35, 0, 1, 0.92, 1.08), c);
        sm.add(new THREE.CylinderGeometry(0.13, 0.145, 0.04, 16), M4(x, Y + 0.02, Z, 0, 0, 0, 1, 1, 1.08), [0.08, 0.08, 0.09]); };
      helmet(sx0 + 0.45, [0.88, 0.12, 0.1], [0.97, 0.97, 0.95], [0.05, 0.06, 0.08]);
      helmet(sx0 + 0.95, [0.95, 0.95, 0.93], [0.12, 0.35, 0.85], [0.05, 0.06, 0.08]);
      helmet(sx0 + 1.45, [0.98, 0.78, 0.12], [0.08, 0.08, 0.09], [0.3, 0.55, 0.85]);
      const GOLDC = [0.98, 0.76, 0.26], cup = new THREE.LatheGeometry([[0, 0], [0.05, 0], [0.05, 0.02], [0.018, 0.04], [0.018, 0.1], [0.04, 0.12], [0.09, 0.2], [0.1, 0.26], [0.095, 0.27]].map(p => new THREE.Vector2(p[0], p[1])), 20);
      gl(PAINT); for (const [x, k] of [[sx1 - 0.65, 1], [sx1 - 0.3, 0.8]]) { box(x, Y, Z, 0.16 * k + 0.04, 0.07, 0.16 * k + 0.04, [0.1, 0.1, 0.11]); sm.add(cup.clone(), M4(x, Y + 0.07, Z, 0, 0, 0, k), GOLDC);
        sm.add(new THREE.TorusGeometry(0.045 * k, 0.01, 6, 14, Math.PI), M4(x + 0.1 * k, Y + 0.07 + 0.2 * k, Z, 0, 0, -Math.PI / 2), GOLDC); sm.add(new THREE.TorusGeometry(0.045 * k, 0.01, 6, 14, Math.PI), M4(x - 0.1 * k, Y + 0.07 + 0.2 * k, Z, 0, 0, Math.PI / 2), GOLDC); }
      cup.dispose(); }
    // crossed chequered flags on the left wall by the door
    { const flag = canvasTex(128, 96, (gx, w, h) => { for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) { gx.fillStyle = (i + j) % 2 ? '#111215' : '#f4f4f0'; gx.fillRect(i * w / 8, j * h / 6, w / 8 + 1, h / 6 + 1); } });
      const fm = new THREE.MeshLambertMaterial({ map: flag, side: THREE.DoubleSide });
      const C = [x0 + 0.1, 2.4, -3.84]; use(WALLS.left, METAL);
      for (const sd of [-1, 1]) {   // (each pole leans out over the other; its flag flies from the top, away from the middle; clear of the columns)
        const d = [0, Math.sin(0.85), -sd * Math.cos(0.85)], tip = [C[0], C[1] + d[1] * 0.6, C[2] + d[2] * 0.6];
        obox(g, [C[0], C[1] - d[1] * 0.25, C[2] - d[2] * 0.25], tip, 0.022, 0.022, [0.88, 0.88, 0.86]);
        const geo = new THREE.PlaneGeometry(0.44, 0.3, 10, 4), P = geo.attributes.position;
        for (let i = 0; i < P.count; i++) { const u = P.getX(i) + 0.22; P.setZ(i, Math.sin(u * 12) * 0.03 * u); }   // (the cloth's waves, more towards its free end)
        geo.translate(0.22, -0.15, 0); geo.computeVertexNormals();
        const m = new THREE.Mesh(geo, fm); m.position.set(tip[0] + 0.012, tip[1], tip[2]); m.rotation.y = Math.PI / 2; if (sd < 0) m.scale.x = -1; WALLS.left.root.add(m);
      } }
    // the team's big screen on the back wall, right of the sign: the car on the table, its power, its parts (live)
    { const c = document.createElement('canvas'); c.width = 512; c.height = 288; const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
      screen = { c, g: c.getContext('2d'), t, key: '' }; use(WALLS.back);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 0.91), new THREE.MeshBasicMaterial({ map: t, color: emi(0xffffff, EMI.screen) })); m.position.set(0.4, 2.5, z0 + 0.075); WALLS.back.root.add(m);
      box(0.4, 2.0, z0 + 0.03, 1.74, 1.03, 0.08, [0.05, 0.05, 0.06]);
      if (!POST.on) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.0), new THREE.MeshBasicMaterial({ map: TX.glow, color: 0x2f8fd0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.22 })); gl.position.set(0.4, 2.5, z0 + 0.03); WALLS.back.root.add(gl); }   // (its glow: the bloom's, with the post pass)
      drawScreen(0); }
    // a light line along the walls at the top of the tread plate (the menu's cyan), its glow on the panels
    { const LM = new THREE.MeshBasicMaterial({ color: emi(0x7fd6ff, EMI.led) }), GM = new THREE.MeshBasicMaterial({ map: canvasTex(16, 64, (gx, w, h) => { const gr = gx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(90,190,255,0)'); gr.addColorStop(0.5, 'rgba(90,190,255,1)'); gr.addColorStop(1, 'rgba(90,190,255,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35 });
      const run = (P, ax, az, bx, bz, nx, nz) => { const L = Math.hypot(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, ry = nx ? nx * Math.PI / 2 : nz > 0 ? 0 : Math.PI;   // (the plane faces the room)
        const l = new THREE.Mesh(new THREE.BoxGeometry(L, 0.018, 0.02), LM); l.position.set(cx + nx * 0.012, 1.01, cz + nz * 0.012); l.rotation.y = ry; P.root.add(l);
        const gw = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.5), GM); gw.position.set(cx + nx * 0.016, 1.01, cz + nz * 0.016); gw.rotation.y = ry; gw.renderOrder = 2; P.root.add(mainOnly(gw)); };
      run(WALLS.back, x0, z0, x1, z0, 0, 1); run(WALLS.left, x0, -door - 0.4, x0, z0, 1, 0); run(WALLS.right, x1, z0, x1, -door - 0.4, -1, 0); }
    // a car under its cover in the front corner (a project waiting): the cover's shape measured on a car, draped to the floor, its folds
    { const PCC = use(piece()), v = Render.garageCar(Core.MODELS.find(m => m.id === 'kaze'), 0x888888, 0, false), P = bodyProbe(v), bb = P.bb, nx = 26, na = 22, pos = [], uv = [], idx = [];
      const R = Core.rng(9), wob = [], len = bb.max.x - bb.min.x; for (let i = 0; i <= nx; i++) wob.push(R());
      for (let i = 0; i <= nx; i++) {
        const t = i / nx, x = bb.min.x - 0.06 + t * (len + 0.12), xs = clamp(x, bb.min.x + 0.05, bb.max.x - 0.05), top = (P.top(xs, 0) || 0.9) + 0.035, end = Math.pow(Math.sin(Math.PI * clamp(t * 1.04 - 0.02, 0, 1)), 0.25);
        const hw = (P.side(xs, Math.min(top - 0.1, 0.62), 1) || bb.max.z) + 0.05;
        for (let j = 0; j <= na; j++) {
          const a = j / na * Math.PI, sy = Math.sin(a), cz = Math.cos(a), fold = 0.012 * Math.sin(j * 1.7 + wob[i] * 6) * (1 - sy * 0.5);
          const ex = Math.pow(Math.abs(cz), 0.35) * Math.sign(cz), ey = Math.pow(sy, 0.6);
          const z = ex * (hw + 0.02 + 0.05 * (1 - ey)) * (0.75 + 0.25 * end), y = 0.03 + ey * (top - 0.03) * (0.82 + 0.18 * end) + fold;
          pos.push(x + (1 - end) * -Math.sign(t - 0.5) * 0.08 * (1 - ey), y, z + fold); uv.push(t * 3, j / na * 2);
        }
      }
      for (let i = 0; i < nx; i++) for (let j = 0; j < na; j++) { const a = i * (na + 1) + j, b = a + na + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const cloth = canvasTex(256, 256, (gx, w, h) => { gx.fillStyle = '#5a6272'; gx.fillRect(0, 0, w, h); for (let k = 0; k < 2200; k++) { gx.fillStyle = 'rgba(' + (R() < 0.5 ? '0,0,0,0.06' : '255,255,255,0.05') + ')'; gx.fillRect(R() * w, R() * h, 1 + R() * 3, 1); }
        for (let k = 0; k < 18; k++) { const y = R() * h; const gr = gx.createLinearGradient(0, y - 8, 0, y + 8); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); gx.fillStyle = gr; gx.fillRect(0, y - 8, w, 16); }
        gx.fillStyle = 'rgba(255,198,41,0.85)'; gx.font = 'italic 900 34px Roboto, Arial, sans-serif'; gx.fillText('APEX', 70, 140); }, true);
      const cm = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: cloth, side: THREE.DoubleSide })); cm.position.set(-5.3, 0, 5.6); cm.rotation.y = 0.42; cm.castShadow = cm.receiveShadow = true; PCC.root.add(cm);
      BLOBS.push([-5.3, 5.6, len + 0.9, 2.6, 1, 0.42, PCC]);
      Render.garageFree(v); }
    // a kart on its stand in the front right corner (the team's first car): tube frame, seat, the nose and the pods, the engine on its side
    { const P = use(piece()), X = 6.15, Z = 6.35, Y = 0.56, CYk = [0.2, 0.68, 0.92], WHk = [0.95, 0.95, 0.93];
      for (const sx of [-0.55, 0.55]) { obox(g, [X + sx, 0, Z - 0.42], [X + sx, Y - 0.04, Z - 0.3], 0.05, 0.05, RED); obox(g, [X + sx, 0, Z + 0.42], [X + sx, Y - 0.04, Z + 0.3], 0.05, 0.05, RED); obox(g, [X + sx, Y - 0.04, Z - 0.34], [X + sx, Y - 0.04, Z + 0.34], 0.06, 0.06, RED); }
      for (const sz of [-0.28, 0.28]) obox(g, [X - 0.85, Y + 0.06, Z + sz], [X + 0.75, Y + 0.06, Z + sz], 0.035, 0.035, CYk);
      for (const x of [-0.75, 0.62]) obox(g, [X + x, Y + 0.06, Z - 0.56], [X + x, Y + 0.06, Z + 0.56], 0.035, 0.035, CYk);
      box(X - 0.98, Y + 0.02, Z, 0.32, 0.2, 1.05, RED, WHk); box(X - 1.06, Y + 0.06, Z, 0.1, 0.12, 0.6, WHk);   // the nose fairing, its number plate
      for (const sd of [-1, 1]) box(X - 0.05, Y + 0.04, Z + sd * 0.52, 0.8, 0.16, 0.22, CYk, WHk);   // the side pods
      gl(METAL); box(X, Y + 0.035, Z, 1.5, 0.012, 0.52, [0.55, 0.57, 0.6]); obox(g, [X - 0.55, Y + 0.12, Z], [X - 0.25, Y + 0.48, Z], 0.03, 0.03, STEEL); sm.add(new THREE.TorusGeometry(0.13, 0.016, 6, 18), M4(X - 0.24, Y + 0.49, Z, 0, Math.PI / 2, -0.6), [0.1, 0.1, 0.11]);
      box(X + 0.45, Y + 0.08, Z - 0.42, 0.3, 0.3, 0.24, ALU, [0.5, 0.52, 0.55]); obox(g, [X + 0.6, Y + 0.25, Z - 0.42], [X + 0.9, Y + 0.2, Z - 0.45], 0.06, 0.06, [0.55, 0.45, 0.38]);
      gl(MATTE); box(X + 0.15, Y + 0.05, Z, 0.42, 0.34, 0.36, [0.08, 0.08, 0.09], [0.1, 0.1, 0.11], 0); box(X + 0.33, Y + 0.25, Z, 0.08, 0.36, 0.38, [0.08, 0.08, 0.09]);   // the seat
      cylA(g, [X + 0.45, Y + 0.42, Z - 0.42], 'y', 0.07, 0.1, 10, DK);
      for (const [x, r, w] of [[-0.7, 0.13, 0.13], [0.62, 0.14, 0.2]]) for (const sd of [-1, 1]) cylA(g, [X + x, Y + 0.06 + r * 0.2, Z + sd * (0.62 + w / 2)], 'z', r, w, 14, DK, [0.75, 0.77, 0.8]);
      BLOBS.push([X, Z, 2.4, 1.6, 0.9, 0, P]); }
    // the compressor on the right wall: a red tank on wheels, its motor and gauge; over it a hose reel on a yellow bracket, the hose wound
    // on it and down to the tank
    { const P = use(WALLS.right), X = x1 - 0.42, Z = 5.4, RZ = 5.6, RY = 1.6, HC = [0.7, 0.14, 0.1];
      cylA(g, [X, 0.42, Z], 'z', 0.27, 1.1, 16, RED, RED2); box(X, 0.66, Z - 0.1, 0.36, 0.3, 0.5, [0.22, 0.24, 0.27], [0.3, 0.32, 0.36]);
      box(x1 - 0.03, RY - 0.25, RZ, 0.03, 0.5, 0.24, [0.85, 0.66, 0.12]); cylA(g, [x1 - 0.1, RY, RZ], 'x', 0.035, 0.12, 10, [0.85, 0.66, 0.12]);
      for (const x of [x1 - 0.18, x1 - 0.38]) cylA(g, [x, RY, RZ], 'x', 0.26, 0.02, 20, [0.18, 0.19, 0.21]); cylA(g, [x1 - 0.28, RY, RZ], 'x', 0.1, 0.18, 12, [0.12, 0.12, 0.13]);
      for (let k = 0; k < 4; k++) sm.add(new THREE.TorusGeometry(0.15 + (k % 2) * 0.03, 0.016, 6, 22), M4(x1 - 0.22 - k * 0.04, RY, RZ, 0, Math.PI / 2, 0), HC);
      gl(METAL); cylA(g, [X - 0.2, 0.86, Z + 0.25], 'x', 0.05, 0.03, 12, [0.9, 0.9, 0.88]); obox(g, [X, 0.15, Z + 0.55], [X, 0.95, Z + 0.62], 0.03, 0.03, STEEL);
      gl(MATTE); for (const sz of [-1, 1]) cylA(g, [X - 0.18, 0.1, Z + sz * 0.45], 'x', 0.1, 0.06, 10, DK);
      tube(g, [[x1 - 0.3, RY - 0.18, RZ - 0.03], [x1 - 0.36, RY - 0.5, RZ - 0.12], [X + 0.02, 0.98, Z + 0.12], [X, 0.7, Z + 0.25]], 0.016, HC, 14, 5);
      BLOBS.push([X, Z, 0.9, 1.4, 0.8, 0, P]); }
    // race suits on a rail on the right wall (the team's colours, no marks), their boots on a bench under them
    { use(WALLS.right, METAL); const X = 8.83, Y = 2.2;
      seg(g, [X, Y, 3.05], [X, Y, 4.75], 0.014, STEEL); for (const z of [3.1, 4.7]) seg(g, [x1 - 0.02, Y, z], [X, Y, z], 0.012, STEEL);
      const SN = [0.13, 0.17, 0.34]; [[SN, GOLD, CYAN], [SN, GOLD, CYAN], [WHITE, [0.82, 0.12, 0.1], SN], [[0.07, 0.07, 0.08], CYAN, GOLD]].forEach((v, i) => suit(cp, M4(X - 0.02, Y - 0.15, 3.35 + i * 0.4, 0, -Math.PI / 2 + (i % 2 ? 0.1 : -0.08), 0), v[0], v[1], v[2]));
      gl(SATIN); box(8.72, 0.42, 4.0, 0.38, 0.04, 1.4, PAL.wood, [0.5, 0.36, 0.22]); gl(PAINT); for (const z of [3.4, 4.6]) box(8.72, 0, z, 0.34, 0.42, 0.04, DK);
      gl(MATTE); for (const z of [3.45, 3.62, 3.95, 4.12, 4.42, 4.59]) { box(8.66, 0.46, z, 0.26, 0.09, 0.09, [0.06, 0.06, 0.07]); box(8.74, 0.46, z, 0.1, 0.17, 0.09, [0.06, 0.06, 0.07]); } }
    // spare bodywork on wall arms by the back corner: a rear wing standing on its edge (navy end plates, a gold edge), a front wing under
    // it (white end plates, a red edge), a nose cone leaning in the corner
    { use(WALLS.right, METAL); const X = x1 - 0.05, ZC = -4.05, S = 1.1, CB = [0.1, 0.11, 0.13];
      for (const z of [ZC - 0.4, ZC, ZC + 0.4]) for (const y of [1.3, 2.25]) { box(X - 0.12, y - 0.035, z, 0.24, 0.035, 0.035, STEEL); box(X - 0.015, y - 0.2, z, 0.03, 0.2, 0.06, STEEL); }
      gl(PAINT); gAdd(g, foil(0.36, S, 0.05), M4(X - 0.17, 2.48, ZC, 0, 0, -Math.PI / 2), CB); gAdd(g, foil(0.17, S, 0.03), M4(X - 0.13, 2.74, ZC, 0, 0, -Math.PI / 2 + 0.25), CB);
      for (const sz of [-1, 1]) { gBox(g, null, X - 0.2, 2.55, ZC + sz * (S / 2 + 0.008), 0.3, 0.56, 0.014, NAVY); gBox(g, null, X - 0.2, 2.84, ZC + sz * (S / 2 + 0.01), 0.3, 0.025, 0.018, GOLD); }
      for (let k = 0; k < 3; k++) gAdd(g, foil(0.24 - k * 0.04, S, 0.03), M4(X - 0.16 - k * 0.02, 1.45 + k * 0.17, ZC, 0, 0, -Math.PI / 2 + k * 0.12), CB);
      for (const sz of [-1, 1]) { gBox(g, null, X - 0.18, 1.6, ZC + sz * (S / 2 + 0.008), 0.32, 0.6, 0.014, [0.92, 0.92, 0.9]); gBox(g, null, X - 0.18, 1.9, ZC + sz * (S / 2 + 0.01), 0.32, 0.03, 0.018, [0.78, 0.14, 0.1]); }
      gl(MATTE); for (const z of [ZC - 0.4, ZC, ZC + 0.4]) for (const y of [1.3, 2.25]) box(X - 0.2, y, z, 0.05, 0.02, 0.05, DK);
      gl(PAINT); gAdd(g, new THREE.LatheGeometry([[0, 0.62], [0.06, 0.56], [0.11, 0.36], [0.15, 0.05], [0.18, -0.3], [0.19, -0.5]].map(q => new THREE.Vector2(q[0], q[1])), 16), M4(8.7, 0.53, -4.45, 0, 0, -0.3, 1, 1, 0.65),
        (c) => c[1] > 0.48 ? [0.78, 0.14, 0.1] : c[1] < -0.05 && c[1] > -0.2 ? NAVY : [0.93, 0.93, 0.91]);
      BLOBS.push([8.55, -4.45, 0.6, 0.5, 0.6, 0, WALLS.right]); }
    // the pit's air line: a reel under the roof by the back right corner, its hose dropping in a coil, a wheel gun hanging over the bare set
    { use(WALLS.right); const X = 6.95, Z = -3.3, Y = 4.34, YC = 3.7, YB = 2.4, YG = 1.85, HY = [0.95, 0.75, 0.12];
      gAdd(g, new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16), M4(X, Y, Z, 0, 0, Math.PI / 2), HY); for (const s of [-1, 1]) gBox(g, null, X + s * 0.09, (Y + 4.66) / 2, Z, 0.012, 4.66 - Y + 0.1, 0.1, DK);
      gl(MATTE); seg(g, [X, Y - 0.18, Z], [X + 0.07, YC, Z], 0.011, HY);
      const helix = new THREE.Curve(); helix.getPoint = (t, o) => (o || new V3()).set(X + 0.07 * Math.cos(t * 24 * Math.PI), YC - (YC - YB) * t, Z + 0.07 * Math.sin(t * 24 * Math.PI));
      gAdd(g, new THREE.TubeGeometry(helix, 120, 0.011, 4, false), null, HY);
      tube(g, [[X + 0.07, YB, Z], [X + 0.05, YB - 0.2, Z - 0.02], [X, YG + 0.22, Z - 0.06], [X, YG + 0.16, Z - 0.07]], 0.011, HY, 10, 4);
      gl(PAINT); gAdd(g, new THREE.CylinderGeometry(0.045, 0.045, 0.24, 12), M4(X, YG, Z, Math.PI / 2, 0, 0), [0.07, 0.07, 0.08]); gBox(g, M4(X, YG + 0.09, Z - 0.05, 0.3, 0, 0), 0, 0, 0, 0.04, 0.14, 0.05, [0.07, 0.07, 0.08]);
      gAdd(g, new THREE.CylinderGeometry(0.048, 0.048, 0.03, 12), M4(X, YG, Z + 0.1, Math.PI / 2, 0, 0), [0.78, 0.14, 0.1]);
      gl(METAL); gAdd(g, new THREE.CylinderGeometry(0.036, 0.036, 0.07, 6), M4(X, YG, Z + 0.155, Math.PI / 2, 0, 0), CHROME); }
    // the front wall: a clock over the lockers (the time the page opened), the team's whiteboard (a track sketched, the plan) over the
    // engineers' desk: three screens of telemetry on a pole, keyboards, a headset, the radios in their dock, a lamp; two stools; a water
    // cooler and a bin by the lockers
    { const P = use(WALLS.front), Zw = z1 - 0.04, now = new Date();
      const face = canvasTex(128, 128, (gx, w) => { const c = w / 2; gx.fillStyle = '#f4f4f0'; gx.beginPath(); gx.arc(c, c, c - 2, 0, TAU); gx.fill(); gx.strokeStyle = '#1a1b1e';
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; gx.lineWidth = i % 3 ? 3 : 6; gx.beginPath(); gx.moveTo(c + Math.sin(a) * (c - 8), c - Math.cos(a) * (c - 8)); gx.lineTo(c + Math.sin(a) * (c - (i % 3 ? 16 : 22)), c - Math.cos(a) * (c - (i % 3 ? 16 : 22))); gx.stroke(); }
        const hand = (a, l, wd, col) => { gx.strokeStyle = col; gx.lineWidth = wd; gx.lineCap = 'round'; gx.beginPath(); gx.moveTo(c, c); gx.lineTo(c + Math.sin(a) * l, c - Math.cos(a) * l); gx.stroke(); };
        hand((now.getHours() % 12 + now.getMinutes() / 60) / 12 * TAU, c * 0.5, 7, '#1a1b1e'); hand(now.getMinutes() / 60 * TAU, c * 0.78, 5, '#1a1b1e'); hand(now.getSeconds() / 60 * TAU, c * 0.82, 2, '#d8302a'); });
      const fc = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshLambertMaterial({ map: face })); fc.position.set(-1.45, 2.78, Zw - 0.03); fc.rotation.y = Math.PI; P.root.add(fc);
      sm.add(new THREE.TorusGeometry(0.31, 0.03, 8, 32), M4(-1.45, 2.78, Zw - 0.03), [0.12, 0.12, 0.13]);
      const wb = canvasTex(256, 144, (gx, w, h) => { const R = Core.rng(17); gx.fillStyle = '#f7f8f6'; gx.fillRect(0, 0, w, h);
        gx.strokeStyle = '#2058c8'; gx.lineWidth = 3; gx.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, r = 34 + 10 * Math.sin(a * 3) + 6 * Math.cos(a * 5); const x = 70 + Math.cos(a) * r * 1.3, y = 72 + Math.sin(a) * r * 0.9; i ? gx.lineTo(x, y) : gx.moveTo(x, y); } gx.stroke();
        gx.strokeStyle = '#d8302a'; gx.lineWidth = 2; for (let k = 0; k < 6; k++) { const y = 28 + k * 18; gx.beginPath(); gx.moveTo(150, y); let x = 150; while (x < 240) { x += 4 + R() * 6; gx.lineTo(x, y + (R() - 0.5) * 6); } gx.stroke(); } });
      const wbm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshLambertMaterial({ map: wb })); wbm.position.set(3.4, 2.75, Zw - 0.02); wbm.rotation.y = Math.PI; P.root.add(wbm);
      gl(METAL); box(3.4, 2.28, Zw - 0.01, 1.7, 0.04, 0.06, ALU); box(3.4, 3.2, Zw - 0.01, 1.7, 0.03, 0.04, ALU);
      // the desk: a dark top with an aluminium edge, side and modesty panels, a pedestal of drawers
      const DX = 3.35, DZ = 8.525, PN = [0.17, 0.18, 0.2];
      gl(SATIN); box(DX, 0.76, DZ, 2.7, 0.04, 0.75, [0.2, 0.21, 0.24], [0.16, 0.17, 0.19]);
      gl(PAINT); for (const x of [2.03, 4.67]) box(x, 0, DZ + 0.02, 0.03, 0.76, 0.7, PN); box(DX, 0.26, 8.86, 2.6, 0.5, 0.02, PN);
      box(2.32, 0.02, 8.55, 0.42, 0.72, 0.6, PN, PN); for (let i = 0; i < 3; i++) box(2.32, 0.06 + i * 0.235, 8.245, 0.39, 0.21, 0.01, [0.21, 0.22, 0.25]);
      gl(METAL); box(DX, 0.762, 8.152, 2.7, 0.036, 0.012, ALU); for (let i = 0; i < 3; i++) box(2.32, 0.22 + i * 0.235, 8.235, 0.2, 0.018, 0.016, ALU);
      // the screens: on a pole with a cross arm, the outer two turned in, all tilted back a little; their pictures one mesh (the telemetry)
      seg(g, [DX, 0.8, 8.8], [DX, 1.55, 8.8], 0.025, [0.2, 0.21, 0.23], 8); box(DX, 1.2, 8.78, 1.3, 0.04, 0.03, [0.2, 0.21, 0.23]);
      const SP = [], SU = [];
      gl(PAINT); for (const [x, ry] of [[DX - 0.6, -0.25], [DX, 0], [DX + 0.6, 0.25]]) { const m = M4(x, 1.22, 8.7, 0.08, ry, 0); gBox(g, m, 0, 0, 0, 0.62, 0.38, 0.03, [0.06, 0.06, 0.07]);
        const q = [[-0.29, -0.17, 1, 0], [0.29, -0.17, 0, 0], [0.29, 0.17, 0, 1], [-0.29, 0.17, 1, 1]].map(([a, b, u, v]) => [new V3(a, b, -0.017).applyMatrix4(m), u, v]);
        for (const k of [0, 2, 1, 0, 3, 2]) { SP.push(q[k][0].x, q[k][0].y, q[k][0].z); SU.push(q[k][1], q[k][2]); } }
      { const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(SP, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(SU, 2)); sg.computeBoundingSphere();
        P.root.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: monTexObj || monitorTex(), color: emi(0xffffff, EMI.screen) }))); }
      // on the desk: two keyboards, a headset, the radios in their dock, the red lamp
      gl(SATIN); for (const [x, z] of [[2.95, 8.32], [3.85, 8.34]]) { box(x, 0.8, z, 0.44, 0.02, 0.14, [0.09, 0.09, 0.1]); box(x, 0.82, z, 0.42, 0.004, 0.12, [0.16, 0.16, 0.17]); }
      gAdd(g, new THREE.TorusGeometry(0.09, 0.012, 5, 12, Math.PI), M4(3.4, 0.81, 8.5, -Math.PI / 2 + 0.2, 0, 0.4), [0.08, 0.08, 0.09]);
      for (const s of [-1, 1]) gAdd(g, new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), M4(3.4 + s * 0.08, 0.83, 8.5 - s * 0.035, 0, 0, Math.PI / 2 + s * 0.4), [0.06, 0.06, 0.07]);
      box(4.4, 0.8, 8.36, 0.32, 0.05, 0.12, [0.12, 0.12, 0.13]); for (let i = 0; i < 4; i++) { const x = 4.28 + i * 0.08; box(x, 0.83, 8.36, 0.05, 0.16, 0.03, [0.1, 0.1, 0.11]); box(x + 0.012, 0.99, 8.36, 0.01, 0.07, 0.01, DK); box(x - 0.01, 0.935, 8.346, 0.022, 0.012, 0.004, [0.4, 2.2, 0.6]); }
      gl(PAINT); cylA(g, [4.62, 0.815, 8.72], 'y', 0.08, 0.03, 12, DK); obox(g, [4.62, 0.83, 8.72], [4.62, 1.22, 8.76], 0.025, 0.025, DK); obox(g, [4.62, 1.22, 8.76], [4.52, 1.3, 8.47], 0.025, 0.025, DK);
      World.cone(g, 4.5, 1.18, 8.45, 0.09, 0.14, 12, [0.78, 0.14, 0.1], [0.78, 0.14, 0.1], 0);
      // two stools (navy seats on gas columns, five legs, a foot ring)
      for (const [x, z] of [[2.9, 7.75], [4.1, 7.8]]) { gl(PAINT); gAdd(g, new THREE.CylinderGeometry(0.19, 0.19, 0.07, 14), M4(x, 0.72, z), [0.13, 0.17, 0.25]);
        gl(METAL); seg(g, [x, 0.1, z], [x, 0.69, z], 0.022, CHROME, 8); gAdd(g, new THREE.TorusGeometry(0.2, 0.012, 4, 16), M4(x, 0.3, z, Math.PI / 2, 0, 0), CHROME);
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3; seg(g, [x, 0.1, z], [x + Math.cos(a) * 0.3, 0.05, z + Math.sin(a) * 0.3], 0.014, [0.2, 0.21, 0.23]); }
        gl(MATTE); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3; castor(null, x + Math.cos(a) * 0.3, 0.03, z + Math.sin(a) * 0.3, 0.03); } }
      // a water cooler (its bottle glossy, the taps red and blue), a dark green wheelie bin
      gl(PAINT); box(0.75, 0, 8.7, 0.32, 1.0, 0.32, [0.86, 0.86, 0.84], [0.8, 0.8, 0.78]); box(0.75, 0.62, 8.535, 0.2, 0.18, 0.01, [0.3, 0.31, 0.33]);
      for (const [s, c] of [[-1, [0.78, 0.14, 0.1]], [1, [0.18, 0.36, 0.78]]]) box(0.75 + s * 0.05, 0.72, 8.53, 0.03, 0.05, 0.03, c);
      sm.add(new THREE.CylinderGeometry(0.14, 0.14, 0.36, 16), M4(0.75, 1.22, 8.7), [0.45, 0.7, 0.95]); sm.add(new THREE.CylinderGeometry(0.14, 0.05, 0.05, 16), M4(0.75, 1.025, 8.7), [0.45, 0.7, 0.95]);
      box(1.4, 0.05, 8.6, 0.48, 0.9, 0.55, [0.16, 0.26, 0.2], [0.13, 0.22, 0.17]); box(1.4, 0.95, 8.58, 0.5, 0.04, 0.6, [0.14, 0.24, 0.18]); box(1.4, 0.93, 8.88, 0.5, 0.04, 0.04, [0.1, 0.18, 0.13]);
      gl(MATTE); for (const s of [-1, 1]) cylA(g, [1.4 + s * 0.2, 0.08, 8.82], 'x', 0.08, 0.05, 10, DK);
      BLOBS.push([3.35, z1 - 0.45, 3.0, 1.0, 0.7, 0, P], [3.5, 7.78, 1.8, 0.7, 0.5, 0, P], [1.1, z1 - 0.35, 1.3, 0.8, 0.8, 0, P]); }
    // the floor's soft shadows under the things standing on it (along the foot of the walls: the room light's) and a few old oil stains:
    // one mesh over the floor, its pictures in one atlas (TX.decal); as a piece fades out, its blobs step down to lighter shades
    { const P = [], U = [], I = [], live = new Map();
      const set = (i, c) => { const u = (c % 4) / 4, v = 1 - ((c >> 2) + 1) / 4, e = c === 11 ? 0 : 0.25, o = c === 11 ? 0.125 : 0;   // (cell c's corners; the empty one: a texel)
        [[0, 0], [e, 0], [e, e], [0, e]].forEach(([a, b], k) => { U[(i + k) * 2] = u + o + a; U[(i + k) * 2 + 1] = v + o + b; }); };
      const quad = (x, z, w, d, ry, c) => { const i = P.length / 3, cs = Math.cos(ry), sn = Math.sin(ry), y = c > 11 ? 0.007 : 0.008;
        for (const [a, b] of [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]) { P.push(x + a * cs + b * sn, y, z - a * sn + b * cs); U.push(0, 0); }
        I.push(i, i + 2, i + 1, i, i + 3, i + 2); set(i, c); return i; };
      const shade = (k) => Math.round(clamp(k, 0, 1) * 11) - 1;   // (-1: none)
      for (const [x, z, w, d, k, ry, p] of BLOBS) { const i = quad(x, z, w, d, ry || 0, Math.max(0, shade(k))); if (!live.has(p)) live.set(p, []); live.get(p).push([i, k]); }
      [[-5.6, -1.6, 1.1], [4.6, 2.2, 0.8], [6.9, -1.95, 1.0], [-6.8, 3.4, 0.9]].forEach(([x, z, s], j) => quad(x, z, s, s, x, 12 + j));
      const geo = new THREE.BufferGeometry(), ua = new THREE.Float32BufferAttribute(U, 2).setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', ua); geo.setIndex(I); geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: TX.decal, transparent: true, depthWrite: false })); m.renderOrder = -2; scene.add(mainOnly(m));
      // (a piece's fade, through its fades: its blobs a shade lighter with each step, the empty cell when it is gone)
      for (const [p, list] of live) p.fades.push({ userData: { op: 1 }, set opacity(o) { if (o === this.o) return; this.o = o;
        for (const [i, k] of list) { const s = shade(k * o); set(i, s < 0 ? 11 : s); } ua.array.set(U); ua.needsUpdate = true; } }); }
    finishPieces();
  }
  /* ---------------- outside: the valley round the workshop (the sky, its clouds and the mountains round the valley in one shader; the
     meadows, the fields, the apron and the road away round a bend in another; the forest at the doors' edges, the paddock, a hayrack, a
     farm, a church on a knoll) ---------------- */
  // all of it lit once, in its colours (the sun on its faces, the haze of the distance): no lights, cheap to draw. The ground's shader
  // has the shadows: the near boxes' swept from their footprints, the trees' and the far buildings' painted into a map once. What stands
  // out there is the main camera's only (mainOnly): the floor's mirror and the cars' cube map get the sky and the ground
  const SUNH = new THREE.Vector2(SUN.x, SUN.z).normalize(), AIR = 420;   // (the haze of the distance d: 0.85 (1 - exp(-d / AIR)))
  // the horizon's colour round the panorama, warmer and paler toward the sun, bluer away from it: what everything far fades into
  // (horz() in the shaders the same)
  const horzJS = (dx, dz) => { const s = (dx * SUNH.x + dz * SUNH.y) / (Math.hypot(dx, dz) || 1), p = Math.max(s, 0), q = Math.max(-s, 0); return [0.78 + 0.09 * p - 0.05 * q, 0.85 + 0.06 * p - 0.03 * q, 0.93 + 0.01 * p]; };
  // the shaders' shared part: the sun, a hash without sin (no stripes far out), value noise (vp: periodic in x with the period N, round
  // the panorama: no seam), horz(), the last line (OUTK: the daylight brighter than the room; a little less colour)
  function outGL() {
    const f = (v) => v.toFixed(4);
    return ['const vec3 oSun = vec3(' + f(SUN.x) + ', ' + f(SUN.y) + ', ' + f(SUN.z) + '); const vec2 oSunH = vec2(' + f(SUNH.x) + ', ' + f(SUNH.y) + ');',
      'float hs(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }',
      'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), f.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), f.x), f.y); }',
      'float vp(vec2 p, float N){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); float a = mod(i.x, N), b = mod(i.x + 1.0, N);',
      '  return mix(mix(hs(vec2(a, i.y)), hs(vec2(b, i.y)), f.x), mix(hs(vec2(a, i.y + 1.0)), hs(vec2(b, i.y + 1.0)), f.x), f.y); }',
      'vec3 horz(vec2 h){ float s = dot(h, oSunH) * inversesqrt(dot(h, h) + 1e-6); return vec3(0.78, 0.85, 0.93) + vec3(0.09, 0.06, 0.01) * max(s, 0.0) - vec3(0.05, 0.03, 0.0) * max(-s, 0.0); }',
      'vec4 outC(vec3 c){ return vec4(mix(c, vec3(dot(c, vec3(0.3333))), 0.15) * ' + OUTK.toFixed(2) + ', 1.0); }'].join('\n');
  }
  // the far things' colours: the sun on each face (a darker foot), the haze toward the horizon's colour, a little less colour (as the
  // shaders' last line); unlit: vertex ranges that keep their colour (glass: the sky in it)
  function bakeOut(gb, unlit) {
    const geo = gb.geometry(), P = geo.attributes.position, N = geo.attributes.normal, C = geo.attributes.color;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i), ny = N.getY(i), H = horzJS(x, z), k = 0.85 * (1 - Math.exp(-Math.hypot(x, z) / AIR));
      const l = unlit.some(([a, b]) => i >= a && i < b) ? 1 : (0.6 + 0.6 * Math.max(0, N.getX(i) * SUN.x + ny * SUN.y + N.getZ(i) * SUN.z) + 0.06 * ny) * (0.8 + 0.2 * smooth(0, 2.5, P.getY(i)));
      const r = lerp(C.getX(i) * l, H[0], k), g = lerp(C.getY(i) * l, H[1], k), b = lerp(C.getZ(i) * l, H[2], k), m = (r + g + b) / 3;
      C.setXYZ(i, lerp(r, m, 0.15), lerp(g, m, 0.15), lerp(b, m, 0.15));
    }
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color().setScalar(OUTK) })); scene.add(mainOnly(m)); return m;
  }
  // the sky (tan of the elevation t, the azimuth u in turns): its blue, paler and warmer toward the horizon and the sun; fair-weather
  // clouds overhead in perspective, heaps of cumulus over the far ridges; the skyline in three layers (H1 the far limestone range: summits where the doors and the
  // windows look, the big snowy massif behind the back windows; H2 forested ridges, higher across the valley; H3 the near wooded hills),
  // each lit from the sun by its slope, hazed by its distance, its edge smoothed over a pixel
  const SKY_FS = [
    'varying vec3 vD;',
    'float rdg(float n){ return 1.0 - abs(2.0 * n - 1.0); }',
    'float bump(float u, float u0, float h, float w){ return h * (1.0 - smoothstep(0.0, w, abs(fract(u - u0 + 0.5) - 0.5))); }',
    'float H1(float u){ float env = 0.022 + bump(u, 0.015, 0.05, 0.07) + bump(u, 0.5, 0.045, 0.06) + bump(u, -0.22, 0.075, 0.16) + bump(u, 0.27, 0.035, 0.12);',
    '  float r = rdg(vp(vec2(u * 13.0, 2.1), 13.0)) * 0.5 + rdg(vp(vec2(u * 31.0, 3.7), 31.0)) * 0.27 + rdg(vp(vec2(u * 71.0, 5.3), 71.0)) * 0.14 + vp(vec2(u * 167.0, 7.9), 167.0) * 0.09;',
    '  return 0.02 + env * pow(r, 1.7) * 1.15 + rdg(vp(vec2(u * 389.0, 9.1), 389.0)) * 0.0018; }',
    'float H2(float u, float fl){ float n = vp(vec2(u * 7.0, 11.1), 7.0) * 0.55 + vp(vec2(u * 19.0, 12.7), 19.0) * 0.3 + vp(vec2(u * 47.0, 14.3), 47.0) * 0.15;',
    '  return (0.009 + 0.034 * n * n) * mix(0.6, 1.5, fl) + 0.0012 * vp(vec2(u * 500.0, 15.0), 500.0); }',
    'float H3(float u, float fl){ float n = vp(vec2(u * 13.0, 21.1), 13.0) * 0.6 + vp(vec2(u * 37.0, 23.9), 37.0) * 0.4;',
    '  return (0.003 + 0.01 * n) * (0.55 + 0.45 * fl) + 0.001 * vp(vec2(u * 1300.0, 25.0), 1300.0); }',
    // (a face's light: its normal toward the eye, turned along the skyline by its slope and the facets (s), tilted up (up))
    'float faceLit(vec2 dh, float s, float up){ vec2 tg = vec2(-dh.y, dh.x); vec3 n = normalize(vec3(-dh.x, 0.0, -dh.y) - vec3(tg.x, 0.0, tg.y) * clamp(s, -3.0, 3.0) + vec3(0.0, up, 0.0)); return clamp(dot(n, oSun), 0.0, 1.0); }',
    'void main(){ vec3 d = normalize(vD); float lh = max(length(d.xz), 1e-4), t = d.y / lh, u = atan(d.z, d.x) / 6.2831853;',
    '  vec2 dh = d.xz / lh; float px = max(fwidth(t), 1e-5); vec3 hz = horz(dh);',
    '  float e = max(d.y, 0.0), s = max(dot(d, oSun), 0.0);',
    '  vec3 c = mix(hz, vec3(0.19, 0.41, 0.83), 1.0 - exp(-e * 4.5)); c = mix(c, vec3(1.0, 0.96, 0.88), pow(s, 8.0) * 0.3); c += vec3(1.0, 0.9, 0.7) * pow(s, 900.0) * 3.0;',
    // (the clouds overhead, in perspective: small and flat toward the horizon, the side toward the sun brighter)
    '  if (d.y > 0.05) { vec2 p = d.xz / d.y * 0.9 + vec2(3.0, 7.0); float n = vn(p) * 0.5 + vn(p * 2.2 + 4.1) * 0.3 + vn(p * 5.3 + 9.7) * 0.2;',
    '    float cov = smoothstep(0.3, 0.75, vn(p * 0.23 + 1.7)), k = smoothstep(0.58, 0.72, n * (0.75 + 0.45 * cov)) * smoothstep(0.05, 0.14, d.y);',
    '    float lt = clamp((vn(p * 2.2 + 4.1 + oSun.xz * 0.25) - vn(p * 2.2 + 4.1)) * 3.0 + 0.6, 0.0, 1.0);',
    '    vec3 cc = mix(vec3(0.72, 0.76, 0.84), vec3(1.0, 0.99, 0.96), clamp(lt * 0.7 + smoothstep(0.62, 0.85, n) * 0.5, 0.0, 1.0));',
    '    c = mix(c, mix(cc, hz, 0.4 * (1.0 - smoothstep(0.05, 0.25, d.y))), k * 0.9); }',
    // (heaps of cumulus far off over the ridges, seen from the side: flat bases, billowing tops; lit where they face the sun, grey
    // where they do not, a bright rim against the sun; hazy. Drawn before the mountains: the summits stand in front of them)
    '  float cb = 0.024 + 0.016 * vp(vec2(u * 9.0, 41.0), 9.0), cm = vp(vec2(u * 17.0, 43.0), 17.0) * 0.7 + vp(vec2(u * 43.0, 44.0), 43.0) * 0.3;',
    '  float ch = max(cm - 0.5, 0.0) * 0.17 * (0.75 + 0.5 * vp(vec2(u * 110.0, 45.0), 110.0)), y = (t - cb) / max(ch, 1e-4);',
    '  if (ch > 0.002 && y > 0.0 && y < 1.4) { float bl = vp(vec2(u * 460.0, t * 80.0), 460.0) * 0.6 + vp(vec2(u * 1150.0, t * 190.0), 1150.0) * 0.4, ed = 1.0 - y + (bl - 0.5) * 0.55;',
    '    float k = smoothstep(0.0, 0.1, ed) * smoothstep(0.0, 0.05, y), sf = dot(dh, oSunH);',
    '    float lt = clamp(0.3 + 0.5 * y + (bl - 0.5) * 0.9 - 0.3 * sf, 0.0, 1.0) + (1.0 - smoothstep(0.0, 0.25, ed)) * max(sf, 0.0) * 0.6;',
    '    c = mix(c, mix(mix(vec3(0.62, 0.67, 0.76), vec3(1.0, 0.98, 0.94), lt), hz, 0.3), k * 0.92); }',
    '  float fl = smoothstep(0.08, 0.7, abs(dh.y)), h1 = H1(u);',
    // (the limestone: lit and shaded faces under each summit (the shade lit by the blue sky), ribs and gullies, a few ledges, the summer's
    // last snow in the high gullies and on the summits, scree, dwarf pine, forest at its foot; darker than the sky but for its snow)
    '  if (t < h1 + px) { float ee = 0.0012, sl = (H1(u + ee) - H1(u - ee)) / (2.0 * ee), hn = clamp((h1 - t) / max(h1 - 0.004, 0.01), 0.0, 1.0);',
    '    float g = vp(vec2(u * 520.0, t * 70.0), 520.0) * 0.55 + vp(vec2(u * 1300.0, t * 160.0), 1300.0) * 0.3 + vp(vec2(u * 3100.0, t * 380.0), 3100.0) * 0.15;',
    // (the ribs and the gullies down the faces: ridged noise stretched downward and bent a little, two sizes; across it, how a rib's
    // sides turn: sharp at its crest, one side in the sun, the other in the shade)
    '    vec2 q1 = vec2(u * 260.0 + (h1 - t) * 70.0 * (vp(vec2(u * 30.0, 1.0), 30.0) - 0.5), t * 9.0), q2 = vec2(u * 780.0, t * 26.0);',
    '    float r1 = rdg(vp(q1, 260.0)), r2 = rdg(vp(q2 + vec2(r1 * 2.0, 0.0), 780.0));',
    '    float fac = (rdg(vp(q1 + vec2(0.2, 0.0), 260.0)) - r1) * 5.0 + (rdg(vp(q2 + vec2(r1 * 2.0 + 0.2, 0.0), 780.0)) - r2) * 2.5;',
    '    float gl = 1.0 - r1 * 0.65 - r2 * 0.35, ledge = smoothstep(0.86, 0.97, fract(t * 60.0 + r1 * 2.0)) * smoothstep(0.55, 0.75, r2) * 0.6;',
    '    float lit = faceLit(dh, sl * (1.0 - smoothstep(0.0, 0.3, hn)) + fac, 0.32 + 0.5 * (g - 0.5) + ledge);',
    '    vec3 col = mix(vec3(0.27, 0.29, 0.32), vec3(0.47, 0.46, 0.43), smoothstep(0.3, 0.7, g));',
    '    float tl = 0.6 + 0.12 * vp(vec2(u * 160.0, 6.0), 160.0) + 0.05 * vp(vec2(u * 800.0, 8.0), 800.0) - 0.16 * (r1 - 0.5);',   // (the tree line: higher up the ribs, lower in the gullies)
    '    float sc = smoothstep(tl - 0.24, tl - 0.1, hn) * smoothstep(0.5, 0.62, vp(vec2(u * 240.0, 4.0), 240.0) + 0.35 * (hn - tl + 0.24));',
    '    col = mix(col, vec3(0.5, 0.49, 0.46), sc * 0.7); col = mix(col, vec3(0.14, 0.19, 0.12), smoothstep(tl - 0.08, tl - 0.03, hn) * 0.7);',
    '    col = mix(col, vec3(0.09, 0.14, 0.1) * (0.85 + 0.3 * g), smoothstep(tl, tl + 0.03, hn));',
    '    float sn = smoothstep(0.0, 0.004, t - (0.052 + 0.012 * vp(vec2(u * 40.0, 3.0), 40.0))) * smoothstep(0.56, 0.66, gl + (0.5 - g) * 0.25);',
    '    sn = clamp(sn + (1.0 - smoothstep(0.0, 0.07, hn)) * smoothstep(0.07, 0.09, h1) * smoothstep(0.4, 0.52, gl), 0.0, 1.0) * (1.0 - smoothstep(0.24, 0.38, hn));',
    '    col = mix(col, vec3(0.92, 0.94, 0.97), sn) * (vec3(0.2, 0.23, 0.29) + vec3(0.78, 0.74, 0.68) * lit);',
    '    c = mix(c, mix(col, hz, 0.2 + 0.25 * hn), 1.0 - smoothstep(h1 - px, h1 + px, t)); }',
    // (the forested ridges: their slopes lit by their lie, clearings of meadow on them; the near wooded hills)
    '  float h2 = H2(u, fl);',
    '  if (t < h2 + px) { float ee = 0.002, sl = (H2(u + ee, fl) - H2(u - ee, fl)) / (2.0 * ee), hn = clamp((h2 - t) / h2, 0.0, 1.0);',
    '    float g = vp(vec2(u * 1500.0, t * 600.0), 1500.0), lit = faceLit(dh, sl * (1.0 - smoothstep(0.0, 0.5, hn)) + (g - 0.5) * 0.9, 0.45);',
    '    vec3 col = mix(vec3(0.09, 0.15, 0.11), vec3(0.16, 0.25, 0.16), g);',
    '    col = mix(col, vec3(0.22, 0.31, 0.16), smoothstep(0.68, 0.72, vp(vec2(u * 300.0, t * 420.0), 300.0) * 0.6 + vp(vec2(u * 37.0, 2.0), 37.0) * 0.4) * smoothstep(0.1, 0.3, hn)) * (0.5 + 0.7 * lit);',
    '    c = mix(c, mix(col, hz, 0.34), 1.0 - smoothstep(h2 - px, h2 + px, t)); }',
    '  float h3 = H3(u, fl);',
    '  if (t < h3 + px) { float g = vp(vec2(u * 2600.0, t * 1100.0), 2600.0), lit = faceLit(dh, (g - 0.5) * 1.4, 0.45);',
    '    vec3 col = mix(vec3(0.08, 0.15, 0.09), vec3(0.18, 0.28, 0.15), g) * (0.6 + 0.6 * lit);',
    '    c = mix(c, mix(col, hz, 0.18), 1.0 - smoothstep(h3 - px, h3 + px, t)); }',
    '  if (t < 0.0) c = mix(vec3(0.31, 0.42, 0.18), hz, 0.58);',   // (under the horizon, beyond the ground: the valley's floor far off)
    '  gl_FragColor = outC(c); }'];
  function buildOutside() {
    const { x0, x1, z0, z1 } = ROOM, GL = outGL();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(470, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, extensions: { derivatives: true },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [SKY_FS[0], GL].concat(SKY_FS.slice(1)).join('\n') }));
    sky.renderOrder = 10; sky.frustumCulled = false; scene.add(sky);   // (drawn after the room: only where nothing else is)
    // what stands out there, in one mesh: the forest, the posts and the fences, the transporter, the paddock, the valley's own things
    const og = new World.GB(), unlit = [], TS = [], HL = [];   // (unlit: glass; TS: the trees' shadows [x, z, h, r, a spruce]; HL: the far buildings' [footprint, h])
    const R = Core.rng(5150), Rt = Core.rng(77); for (let i = 0; i < 385; i++) R();   // (the old mountain rings' draws: the same woods)
    const WT = [0.93, 0.94, 0.95], GR = [0.28, 0.3, 0.33], DK = [0.08, 0.08, 0.09], NV = [0.1, 0.13, 0.25], GD = [0.93, 0.71, 0.2], CY = [0.3, 0.72, 0.93];
    const glass = (f) => { const a = og.P.length / 3; f(); unlit.push([a, og.P.length / 3]); };
    const rp = (x, z, rot) => { const c = Math.cos(rot), s = Math.sin(rot); return (lx, lz) => [x + lx * c - lz * s, z + lx * s + lz * c]; };   // (a point in a building's own frame)
    // the forest: Norway spruce (five drooping tiers, the tips lighter, the undersides dark), a few larches, beech in round clumps at the
    // woods' edges; far ones simpler. Only in the wedges beside the doors' views: the valley open through the doors, the sky through the windows
    const trunk = (x, z, r, h, c) => { for (let k = 0; k < 3; k++) { const a0 = k / 3 * TAU + x, a1 = a0 + TAU / 3, P = (a, y) => [x + Math.cos(a) * r, y, z + Math.sin(a) * r]; og.quadO(P(a0, 0), P(a1, 0), P(a1, h), P(a0, h), c, [x, h / 2, z]); } };
    const tier = (x, z, y0, y1, r, n, rot, cb, ct, under) => {   // n drooping tips round an inner ring; the underside from the tips in
      const ap = [x, y1, z], rim = [], m = 2 * n, cm = [(cb[0] + ct[0]) / 2, (cb[1] + ct[1]) / 2, (cb[2] + ct[2]) / 2], inn = [x, y0 + (y1 - y0) * 0.3, z];
      for (let k = 0; k < m; k++) { const a = rot + k / m * TAU, tip = !(k & 1), rr = tip ? r : r * 0.55; rim.push([x + Math.cos(a) * rr, tip ? y0 - r * 0.12 : y0 + (y1 - y0) * 0.14, z + Math.sin(a) * rr]); }
      for (let k = 0; k < m; k++) og.triO(rim[k], rim[(k + 1) % m], ap, k & 1 ? cm : ct, inn, k & 1 ? ct : cm, cb);
      if (under) { const c0 = [x, y0 + (y1 - y0) * 0.1, z], cu = [cb[0] * 0.7, cb[1] * 0.7, cb[2] * 0.7]; for (let k = 0; k < m; k += 2) og.triO(rim[k], rim[(k + 2) % m], c0, cu, [x, y1 + 9, z]); } };
    const spruce = (x, z, h, near, larch) => { const r = h * (larch ? 0.13 : 0.16), rot = Rt() * TAU, dk = 0.85 + Rt() * 0.3, nt = near ? 5 : 3;
      const cb = (larch ? [0.24, 0.33, 0.13] : [0.07, 0.15, 0.1]).map(v => v * dk), ct = (larch ? [0.42, 0.55, 0.24] : [0.13, 0.25, 0.15]).map(v => v * dk);
      trunk(x, z, h * 0.025, h * 0.3, [0.3, 0.22, 0.15]);
      for (let t = 0; t < nt; t++) { const f = t / nt, y0 = h * (0.1 + 0.8 * f); tier(x, z, y0, t === nt - 1 ? h : y0 + h * (near ? 0.3 : 0.42), r * (1.04 - f), near ? 6 : 5, rot + t * 0.6, cb, ct, near); }
      TS.push([x, z, h, r, 1]); };
    const ico = new THREE.IcosahedronGeometry(1, 0), IP = ico.attributes.position;   // (non-indexed: three vertices a face)
    const clump = (cx, cy, cz, r, base) => { for (let i = 0; i < IP.count; i += 3) { const v = (j) => [cx + IP.getX(j) * r, cy + IP.getY(j) * r * 0.85, cz + IP.getZ(j) * r], e = (0.9 + Rt() * 0.2) * (0.82 + 0.18 * (IP.getY(i) + IP.getY(i + 1) + IP.getY(i + 2) + 3) / 6);
      og.triO(v(i), v(i + 1), v(i + 2), [base[0] * e, base[1] * e, base[2] * e], [cx, cy, cz]); } };
    const broad = (x, z, h, n) => { const dk = 0.88 + Rt() * 0.24, base = [0.3 * dk, 0.46 * dk, 0.18 * dk], r = h * 0.26;
      trunk(x, z, h * 0.04, h * 0.55, [0.36, 0.3, 0.24]);
      clump(x, h * 0.74, z, r * 1.1, base);
      for (let b = 0; b < (n || 3); b++) { const a = b / (n || 3) * TAU + Rt(); clump(x + Math.cos(a) * r * 0.75, h * (0.56 + Rt() * 0.12), z + Math.sin(a) * r * 0.75, r * (0.8 + Rt() * 0.15), base); }
      TS.push([x, z, h, r * 1.5, 0]); };
    // (kept clear: the doors' views down the valley, the windows' sky, round the paddock's units)
    const LM = [[-29, 15.7, 13], [29, -14, 13]];
    const clear = (x, z) => (x > x0 - 4 && x < x1 + 4 && z > z0 - 4 && z < z1 + 4) || (Math.abs(x) > x1 && Math.abs(z) < Math.max(10, 6 + 0.17 * Math.abs(x))) || Math.abs(z) > 0.45 * Math.abs(x) || LM.some(([lx, lz, r]) => Math.hypot(x - lx, z - lz) < r);
    for (let i = 0, nT = 0; i < 3000 && nT < 520; i++) {
      const a = R() * TAU, r = 16 + Math.pow(R(), 0.85) * 76, x = Math.cos(a) * r, z = Math.sin(a) * r; if (clear(x, z)) continue;
      const wood = Math.sin(x * 0.045 + 1.3) * Math.sin(z * 0.055 + 0.4) + 0.7 * Math.sin(x * 0.012 - z * 0.016 + 2); if (wood < -0.2 && R() < 0.85) continue;   // (meadows between the woods)
      const h = (7 + R() * 9) * (r > 90 ? 1.25 : 1); if (wood > 0.3 || R() < 0.5) spruce(x, z, h, r < 45, Rt() < 0.15); else broad(x, z, h, r < 45 ? 3 : 2); nT++;
    }
    for (const sd of [-1, 1]) for (const sz of [-1, 1]) { const x = sd * (30 + R() * 8), z = sz * (12 + R() * 4); if (!LM.some(([lx, lz, r]) => Math.hypot(x - lx, z - lz) < r)) broad(x, z, 6 + R() * 4, 3); }   // (by the road)
    // by the road: a lamp post each side of each apron, a fence of weathered wood along the meadows (not where the paddock is), white
    // marker posts along the bend; the team's flagpoles
    const FW = [0.46, 0.4, 0.33];
    for (const sd of [-1, 1]) {
      for (const sz of [-1, 1]) { const X = sd * 24, Z = sz * 7.4; World.box(og, X, 0, Z, 0.16, 7.2, 0.16, 0, GR, GR); obox(og, [X, 7.1, Z], [X, 7.25, Z - sz * 1.4], 0.1, 0.1, GR); World.box(og, X, 6.98, Z - sz * 1.4, 0.5, 0.14, 0.3, 0, DK, DK); }
      const Z = sd * 8.6;
      for (let x = 13; x < 37; x += 2.5) World.box(og, sd * x, 0, Z, 0.11, 1.0, 0.11, 0, FW, [0.38, 0.33, 0.27]);
      for (const y of [0.45, 0.85]) obox(og, [sd * 13, y, Z], [sd * 35.5, y, Z], 0.06, 0.08, FW);
      for (const xs of [48, 72, 96, 120]) { const b = xs - 36, zc = 0.011 * b * b, k = Math.sqrt(1 + 0.022 * 0.022 * b * b) * 3.7;
        for (const e of [-1, 1]) { World.box(og, sd * xs, 0, zc + e * k, 0.12, 0.8, 0.12, 0, WT, WT); World.box(og, sd * xs, 0.8, zc + e * k, 0.13, 0.22, 0.13, 0, DK, DK); } }
    }
    const FLG = [[-13.5, NV], [-15.5, GD], [-17.5, CY]];
    for (const [x] of FLG) { World.box(og, x, 0, 8.4, 0.1, 8, 0.1, 0, WT, WT); World.box(og, x, 8, 8.4, 0.16, 0.1, 0.16, 0, GR, GR); }
    // the transporter on its pad by the left door: a navy cab (dark glass, the sky in its top, mirrors), the white box with the team's
    // navy band and gold and cyan pinstripes (no marks), black arches, skirts and mud flaps, its wheels
    { const X0 = -21.8, Z = -4.7, L = 9.2, Wd = 2.5, B = X0 + 2.3, Gl = [0.13, 0.17, 0.22], Sk = [0.62, 0.72, 0.84];
      World.box(og, B + L / 2, 0.75, Z, L, 3.2, Wd, 0, WT, [0.85, 0.86, 0.88]);
      for (const sd of [-1, 1]) { const zz = Z + sd * (Wd / 2 + 0.006);
        obox(og, [B + 0.03, 1.2, zz], [B + L - 0.03, 1.2, zz], 0.012, 0.9, NV); obox(og, [B + 0.03, 1.73, zz], [B + L - 0.03, 1.73, zz], 0.012, 0.07, GD); obox(og, [B + 0.03, 1.84, zz], [B + L - 0.03, 1.84, zz], 0.012, 0.035, CY); }
      obox(og, [B + L + 0.01, 0.78, Z], [B + L + 0.01, 3.92, Z], 0.035, 0.02, [0.55, 0.56, 0.58]);   // (the rear doors' seam)
      obox(og, [B + L + 0.006, 1.2, Z - Wd / 2 + 0.03], [B + L + 0.006, 1.2, Z + Wd / 2 - 0.03], 0.012, 0.9, NV);
      World.box(og, X0 + 1.2, 0.6, Z, 2.2, 2.3, Wd - 0.04, 0, NV, NV);   // (the cab, its roof deflector up to the box)
      obox(og, [X0 + 0.5, 3.05, Z], [B + 0.02, 3.75, Z], Wd - 0.14, 0.3, NV); World.box(og, X0 + 1.4, 2.9, Z, 1.8, 0.2, Wd - 0.14, 0, NV, NV);
      glass(() => { World.box(og, X0 + 0.07, 1.72, Z, 0.06, 0.95, Wd - 0.34, 0, Gl, Gl); World.box(og, X0 + 0.04, 2.58, Z, 0.04, 0.09, Wd - 0.34, 0, Sk, Sk);
        for (const sd of [-1, 1]) { World.box(og, X0 + 0.75, 1.75, Z + sd * (Wd / 2 - 0.01), 1.0, 0.85, 0.04, 0, Gl, Gl); World.box(og, X0 + 0.75, 2.52, Z + sd * (Wd / 2 - 0.005), 1.0, 0.08, 0.04, 0, Sk, Sk); } });
      World.box(og, X0 - 0.02, 0.62, Z, 0.08, 0.7, Wd - 0.3, 0, DK, DK);   // (the grille and the bumper)
      for (const sd of [-1, 1]) { obox(og, [X0 + 0.15, 2.2, Z + sd * (Wd / 2)], [X0 - 0.05, 2.25, Z + sd * (Wd / 2 + 0.32)], 0.04, 0.04, DK); World.box(og, X0 - 0.05, 1.85, Z + sd * (Wd / 2 + 0.36), 0.08, 0.42, 0.18, 0, DK, DK); }
      World.box(og, B + L / 2, 0.32, Z, L, 0.45, Wd - 0.5, 0, DK, DK);   // (the chassis)
      for (const wx of [X0 + 1.2, B + L - 2.1, B + L - 0.8]) for (const sd of [-1, 1]) cylA(og, [wx, 0.5, Z + sd * (Wd / 2 - 0.16)], 'z', 0.5, 0.34, 10, DK, [0.5, 0.52, 0.55]);
      for (const sd of [-1, 1]) { const zz = Z + sd * (Wd / 2 - 0.02);
        World.box(og, B + L - 1.45, 0.98, zz, 2.6, 0.12, 0.12, 0, DK, DK); World.box(og, X0 + 1.2, 1.0, zz + sd * 0.02, 1.2, 0.1, 0.1, 0, DK, DK);   // (the arches)
        World.box(og, B + 2.4, 0.34, zz, 4.6, 0.42, 0.05, 0, DK, DK);   // (the skirt between the axles)
        World.box(og, B + L - 0.15, 0.12, zz - sd * 0.1, 0.03, 0.5, 0.38, 0, DK, DK); World.box(og, X0 + 2.0, 0.12, zz - sd * 0.1, 0.03, 0.45, 0.36, 0, DK, DK); } }   // (mud flaps)
    // the paddock: the team's hospitality unit across the left apron (two storeys: navy below, a glass band above, the gold line between),
    // three neighbours' garage units across the right one (grey, their doors rolled down)
    { const xa = -36, xb = -22, za = 13, zb = 18.5, cx = (xa + xb) / 2, cz = (za + zb) / 2, L = xb - xa, D = zb - za;
      World.box(og, cx, 0, cz, L, 3.0, D, 0, NV, NV); World.box(og, cx, 3.0, cz, L + 0.08, 0.16, D + 0.08, 0, GD, GD);
      glass(() => { World.box(og, cx, 3.16, cz, L - 0.04, 2.5, D - 0.04, 0, [0.42, 0.52, 0.64], [0.42, 0.52, 0.64]); World.box(og, cx, 5.2, cz, L, 0.5, D, 0, [0.66, 0.75, 0.86], [0.66, 0.75, 0.86]);
        for (let i = 0; i < 4; i++) World.box(og, xa + 1.5 + i * 2.2, 0.0, za - 0.03, 1.6, 2.4, 0.06, 0, [0.12, 0.15, 0.2], [0.12, 0.15, 0.2]); });
      for (let x = xa; x <= xb + 0.01; x += L / 8) obox(og, [x, 3.16, za - 0.02], [x, 5.7, za - 0.02], 0.08, 0.08, DK);   // (the mullions)
      World.box(og, cx, 5.7, cz, L + 0.2, 0.45, D + 0.2, 0, [0.2, 0.22, 0.26], [0.3, 0.31, 0.33]);   // (the flat roof, its parapet)
      World.box(og, xb - 2.6, 0, za - 0.03, 1.2, 2.3, 0.06, 0, DK, DK); World.box(og, xb - 2.6, 2.55, za - 0.8, 2.6, 0.12, 1.6, 0, [0.22, 0.24, 0.28], [0.3, 0.32, 0.36]);   // (the door, its canopy)
      for (let i = 0; i < 3; i++) { const cx2 = 23 + i * 6, LG = [0.72, 0.74, 0.77];
        World.box(og, cx2, 0, -14, 5.96, 4.4, 6, 0, LG, [0.5, 0.52, 0.55]);
        World.box(og, cx2, 0, -10.97, 4.2, 3.7, 0.06, 0, [0.6, 0.63, 0.68], [0.6, 0.63, 0.68]); for (let k = 1; k < 9; k++) obox(og, [cx2 - 2.08, k * 0.41, -10.93], [cx2 + 2.08, k * 0.41, -10.93], 0.02, 0.035, [0.48, 0.5, 0.55]);
        World.box(og, cx2, 3.7, -10.95, 4.5, 0.22, 0.1, 0, [0.36, 0.38, 0.42], [0.36, 0.38, 0.42]); }
      World.box(og, 29, 4.4, -14, 18.3, 0.3, 6.3, 0, [0.22, 0.23, 0.26], [0.36, 0.37, 0.39]); }
    // the valley's own things where the doors look out: a double hayrack (toplar) in the meadow, an alpine farmhouse with its orchard, a
    // white church on a knoll and a few houses at its foot (generic, unnamed). A gable roof: two slopes, the eaves' course darker, the ends
    const roof = (cx, cy, cz, L, D, h, rot, col, end) => { const c = Math.cos(rot), s = Math.sin(rot), P = (lx, ly, lz) => [cx + lx * c - lz * s, cy + ly, cz + lx * s + lz * c], inn = [cx, cy + h * 0.3, cz];
      for (const sd of [-1, 1]) for (const [t0, t1, f] of [[0, 0.22, 0.8], [0.22, 1, sd > 0 ? 1 : 0.93]]) og.quadO(P(-L / 2, h * t0, sd * D / 2 * (1 - t0)), P(L / 2, h * t0, sd * D / 2 * (1 - t0)), P(L / 2, h * t1, sd * D / 2 * (1 - t1)), P(-L / 2, h * t1, sd * D / 2 * (1 - t1)), col.map(v => v * f), inn);
      og.triO(P(-L / 2, 0, -D / 2), P(-L / 2, 0, D / 2), P(-L / 2, h, 0), end || col, inn); og.triO(P(L / 2, 0, -D / 2), P(L / 2, 0, D / 2), P(L / 2, h, 0), end || col, inn); };
    const hull = (x, z, L, D, rot, h) => { const P = rp(x, z, rot); HL.push([[P(-L / 2, -D / 2), P(L / 2, -D / 2), P(L / 2, D / 2), P(-L / 2, D / 2)], h]); };
    const WD = [0.4, 0.29, 0.19], WD2 = [0.5, 0.37, 0.24], WHT = [0.93, 0.92, 0.88], DKR = [0.32, 0.28, 0.27], TILE = [0.62, 0.26, 0.18], DW = [0.14, 0.15, 0.18];
    { const x = 112, z = -13, rot = Math.PI / 2 - 0.12, bays = 4, L = bays * 3.2, P = rp(x, z, rot);   // (the toplar: two racks of laths under one roof, a loft between, hay drying in most bays)
      for (const lz of [-2, 2]) { const sg = Math.sign(lz), [bx, bz] = P(0, lz - 0.5 * sg);
        World.box(og, bx, 0.3, bz, L, 3.9, 0.1, rot, [0.15, 0.12, 0.1], [0.15, 0.12, 0.1]);   // (the dark inside, seen between the laths)
        for (let i = 0; i <= bays; i++) { const [px, pz] = P(-L / 2 + i * 3.2, lz); World.box(og, px, 0, pz, 0.34, 5.6, 0.34, rot, WD, WD); }
        for (let k = 0; k < 8; k++) { const [lx, lz2] = P(0, lz - 0.2 * sg); World.box(og, lx, 0.75 + k * 0.48, lz2, L + 0.6, 0.08, 0.1, rot, WD2, WD2); }
        for (let i = 0; i < bays; i++) if (i !== 1 || lz > 0) { const [hx, hz] = P(-L / 2 + 1.6 + i * 3.2, lz - 0.33 * sg), hh = 1.9 + ((i * 7 + lz) & 3) * 0.48, hc = i & 1 ? [0.6, 0.55, 0.31] : [0.53, 0.52, 0.29];
          World.box(og, hx, 0.62, hz, 2.95, hh, 0.3, rot, hc, hc); } }
      World.box(og, x, 4.1, z, L + 0.3, 0.18, 4.0, rot, WD, WD); roof(x, 5.6, z, L + 2, 6, 2.5, rot, [0.24, 0.2, 0.18], [0.15, 0.12, 0.1]); hull(x, z, L, 4.4, rot, 6.5); }
    { const x = 172, z = 21, rot = Math.PI / 2 + 0.2, L = 11, D = 9, P = rp(x, z, rot), TB = [0.48, 0.32, 0.2];   // (the farmhouse: masonry below, timber above, a balcony of flowers toward the workshop)
      World.box(og, x, 0, z, L, 3.0, D, rot, WHT, WHT); World.box(og, x, 3.0, z, L, 2.5, D, rot, TB, TB); roof(x, 5.5, z, L + 1.8, D + 2, 3.6, rot, DKR, TB);
      const [bx, bz] = P(0, D / 2 + 0.55); World.box(og, bx, 3.0, bz, L * 0.85, 1.0, 1.1, rot, [0.4, 0.27, 0.16], [0.4, 0.27, 0.16]); World.box(og, bx, 4.0, bz, L * 0.85, 0.24, 1.14, rot, [0.78, 0.22, 0.18], [0.7, 0.3, 0.2]);
      for (const i of [-1, 0, 1]) { const [wx, wz] = P(i * L * 0.3, D / 2 + 0.03); World.box(og, wx, 1.0, wz, 1.0, 1.1, 0.08, rot, DW, DW); }
      const [cx, cz] = P(L * 0.25, -D * 0.2); World.box(og, cx, 6.5, cz, 0.6, 2.6, 0.6, rot, [0.6, 0.58, 0.55], [0.2, 0.19, 0.19]); hull(x, z, L, D, rot, 7.3);
      for (let i = 0; i < 6; i++) { const [tx, tz] = P(-6 + (i % 3) * 5, D / 2 + 6 + (i / 3 | 0) * 5), b = [0.26, 0.42, 0.17]; trunk(tx, tz, 0.12, 1.6, WD); clump(tx, 2.6, tz, 1.5, b); clump(tx + 0.6, 2.2, tz - 0.5, 1.1, b); TS.push([tx, tz, 3.8, 1.8, 0]); } }
    { const x = -310, z = 30, KH = 6, KR = 55, G0 = [0.34, 0.48, 0.21];   // (the knoll, the church on it: its tower and spire toward the workshop; houses at its foot)
      const ring = (r) => KH * Math.pow(Math.max(0, 1 - (r / KR) * (r / KR)), 1.6);
      for (let i = 0; i < 4; i++) { const r0 = KR * i / 4, r1 = KR * (i + 1) / 4; for (let k = 0; k < 16; k++) { const a0 = k / 16 * TAU, a1 = (k + 1) / 16 * TAU, Q = (r, a) => [x + Math.cos(a) * r, ring(r), z + Math.sin(a) * r];
        if (i === 0) og.triO([x, KH, z], Q(r1, a0), Q(r1, a1), G0, [x, -10, z]); else og.quadO(Q(r0, a0), Q(r1, a0), Q(r1, a1), Q(r0, a1), G0, [x, -10, z]); } }
      const cy = KH - 0.4; World.box(og, x, cy - 1, z, 12, 7, 7, 0, WHT, WHT); roof(x, cy + 6, z, 12.6, 7.6, 3.6, 0, TILE, WHT);
      World.box(og, x - 6.6, cy - 1, z, 2.6, 5.5, 4.4, 0, WHT, TILE); World.box(og, x + 7.4, cy - 1, z, 3.6, 13.5, 3.6, 0, WHT, WHT); World.cone(og, x + 7.4, cy + 12.5, z, 2.7, 5.5, 4, [0.3, 0.31, 0.34], [0.24, 0.25, 0.27], Math.PI / 4);
      World.box(og, x + 9.23, cy + 9.3, z, 0.06, 1.6, 1.2, 0, DK, DK); World.box(og, x + 7.4, cy + 9.3, z - 1.83, 1.2, 1.6, 0.06, 0, DK, DK);   // (the belfry's openings)
      for (const [hx, hz, r, rf] of [[-292, 58, 0.3, TILE], [-326, 4, -0.2, DKR], [-282, 14, 0.1, DKR], [-338, 52, 0.5, TILE]]) { World.box(og, hx, 0, hz, 9, 5, 7, r, WHT, WHT); roof(hx, 5, hz, 10, 8.4, 3.4, r, rf.map(v => v * 0.8), WHT);
        const Ph = rp(hx, hz, r); for (const i of [-1, 1]) for (const yy of [1.0, 3.0]) { const [wx, wz] = Ph(i * 2.4, 3.53); World.box(og, wx, yy, wz, 1.0, 1.0, 0.08, r, DW, DW); } } }
    ico.dispose(); bakeOut(og, unlit);
    // the ground: meadows near the workshop, fields further out (strips of a grid turned 30 deg, their edges wandering: meadow, cut hay in
    // mowing stripes, lush grass, ripe hay, pasture; darker headlands), a gravel strip round the walls; the concrete apron by each door (its
    // joints, a drain, the bay's yellow lines carried out), the road narrowing and away round a bend (worn tracks, white edge lines, the
    // menu's kerbs along its straight), the paddock's asphalt and the truck's gravel pad; the shadows; the haze toward the horizon
    const cot = Math.sqrt(1 - SUN.y * SUN.y) / SUN.y, sx = -SUNH.x * cot, sz = -SUNH.y * cot;   // (a metre of height's shadow along x and z)
    const shT = canvasTex(512, 512, (g, w) => { const k = w / 384, X = (x) => (x / 384 + 0.5) * w, Y = (z) => (0.5 - z / 384) * w;   // (384 m square: 0.75 m a pixel)
      g.fillStyle = '#000'; g.fillRect(0, 0, w, w);
      const blob = (x, z, r, a) => { const gr = g.createRadialGradient(X(x), Y(z), 0, X(x), Y(z), r * k); gr.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(0.6, 'rgba(255,255,255,' + a * 0.8 + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(X(x), Y(z), r * k, 0, TAU); g.fill(); };
      for (const [x, z, h, r, sp] of TS) { blob(x, z, Math.max(0.6, r * 0.35), 0.5);   // (round the trunk; a spruce's cone: a wedge of blobs, a beech's crown: one long blob)
        if (sp) for (const f of [0.15, 0.4, 0.62, 0.82]) blob(x + sx * h * (0.1 + 0.9 * f), z + sz * h * (0.1 + 0.9 * f), r * (1.05 - f) + 0.3, 0.6);
        else { g.save(); g.translate(X(x + sx * h * 0.72), Y(z + sz * h * 0.72)); g.rotate(Math.atan2(-sz, sx)); g.scale(1 + Math.hypot(sx, sz) * h * 0.22 / r, 1); g.translate(-X(x + sx * h * 0.72), -Y(z + sz * h * 0.72)); blob(x + sx * h * 0.72, z + sz * h * 0.72, r, 0.7); g.restore(); } }
      g.fillStyle = 'rgba(255,255,255,0.9)';
      for (const [fp, h] of HL) { const pts = fp.concat(fp.map(([x, z]) => [x + sx * h, z + sz * h])).sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];   // (the footprint swept down-sun: its hull)
        for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
        for (const p of pts.slice().reverse()) { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
        g.beginPath(); lo.slice(0, -1).concat(hi.slice(0, -1)).forEach(([x, z], i) => i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))); g.fill(); } });
    const nz = canvasTex(256, 256, (g, w, h) => { const Rn = Core.rng(31); g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { const r = 2 + Rn() * 9; g.fillStyle = 'rgba(' + (Rn() * 255 | 0) + ',' + (Rn() * 255 | 0) + ',' + (Rn() * 255 | 0) + ',0.35)'; g.beginPath(); g.arc(Rn() * w, Rn() * h, r, 0, TAU); g.fill(); }
      for (let i = 0; i < 9000; i++) { g.fillStyle = Rn() < 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'; g.fillRect(Rn() * w, Rn() * h, 1, 1); } }, true);
    // the near boxes' shadows (x0 z0 x1 z1, h): the workshop, the transporter's box and cab, the hospitality, the units
    const v4 = (b) => 'vec4(' + b.slice(0, 4).map(v => v.toFixed(2)).join(', ') + ')', mx = (l) => l.length > 1 ? 'max(' + l[0] + ', ' + mx(l.slice(1)) + ')' : l[0], BX = [[x0, z0, x1, z1, 5.0], [-19.5, -5.95, -10.3, -3.45, 3.95], [-21.8, -5.9, -19.5, -3.5, 3.4], [-36, 13, -22, 18.5, 6.15], [20, -17, 38, -11, 4.7]];
    const gs = new THREE.Shape([[-500, -500], [500, -500], [500, 500], [-500, 500]].map(([x, y]) => new THREE.Vector2(x, y)));   // (a hole where the workshop stands)
    gs.holes.push(new THREE.Path([[x0, -z0], [x0, -z1], [x1, -z1], [x1, -z0]].map(([x, y]) => new THREE.Vector2(x, y))));
    const ground = new THREE.Mesh(new THREE.ShapeGeometry(gs).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { uN: { value: nz }, uSh: { value: shT } }, extensions: { derivatives: true },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: ['uniform sampler2D uN; uniform sampler2D uSh; varying vec3 vW;', GL,
        // (a box's shadow: is p in its footprint swept along the sun's offset of its top? soft at the edge)
        'float sweep(vec2 p, vec4 r, float h){ vec2 s = -oSun.xz / oSun.y * h, a = (p - r.zw) / s, b = (p - r.xy) / s, t0 = min(a, b), t1 = max(a, b);',
        '  return smoothstep(-0.012, 0.03, min(min(t1.x, t1.y), 1.0) - max(max(t0.x, t0.y), 0.0)); }',
        'float rect(vec2 p, vec4 r){ vec2 q = max(r.xy - p, p - r.zw); return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }',   // (out of a rectangle; < 0 in it)
        'float line(float x, float w, float f){ return 1.0 - smoothstep(w - f, w + f, x); }',   // (|x| < w, soft over a pixel's f)
        'void main(){ vec2 p = vW.xz; float ax = abs(p.x), az0 = abs(p.y), d = length(p); vec2 fw = fwidth(p); float px = max(fw.x, fw.y) + 1e-3, e = px * 0.6;',
        '  vec4 A = texture2D(uN, p * 0.09), B = texture2D(uN, p * 0.012 + 0.3), C = texture2D(uN, p * 0.55); float n1 = A.r, n2 = B.g, n3 = C.b;',
        '  vec2 fp = vec2(p.x * 0.866 + p.y * 0.5, p.y * 0.866 - p.x * 0.5) + (vec2(vn(p * 0.011), vn(p * 0.011 + 7.3)) - 0.5) * 40.0, fq = fp / vec2(24.0, 75.0), fr = fract(fq);',
        '  float hc = hs(floor(fq) + 3.0);',
        '  vec3 fc = hc < 0.35 ? vec3(0.27, 0.4, 0.16) : hc < 0.6 ? vec3(0.38, 0.46, 0.2) : hc < 0.78 ? vec3(0.3, 0.44, 0.16) : hc < 0.9 ? vec3(0.5, 0.48, 0.26) : vec3(0.25, 0.36, 0.15);',
        '  fc *= (1.0 + 0.07 * sin(fp.x * 2.2 + hc * 9.0) * step(0.35, hc) * step(hc, 0.6) * (1.0 - smoothstep(0.4, 1.2, px))) * (0.93 + 0.14 * n2);',
        '  float ed = min(min(fr.x, 1.0 - fr.x) * 24.0, min(fr.y, 1.0 - fr.y) * 75.0); fc = mix(fc * mix(0.8, 1.0, smoothstep(0.4, 2.0, ed)), vec3(0.31, 0.42, 0.18), smoothstep(5.0, 25.0, px));',
        '  float dw = rect(p, ' + v4([x0, z0, x1, z1]) + ');',
        '  vec3 c = mix(mix(vec3(0.24, 0.38, 0.15), vec3(0.36, 0.48, 0.21), n2), fc, smoothstep(20.0, 35.0, dw)) * (0.74 + 0.46 * n1) * (0.86 + 0.26 * n3) * vec3(1.0 + 0.12 * (A.b - 0.5), 1.0, 1.0 - 0.2 * (A.b - 0.5));',
        '  vec3 gv = vec3(0.56, 0.54, 0.48) * (0.78 + 0.34 * n3) * (0.94 + 0.1 * n1);',   // (gravel)
        '  float bend = max(ax - 36.0, 0.0), zc = 0.011 * bend * bend, sl = 0.022 * bend, rz = p.y - zc, az = abs(rz) / sqrt(1.0 + sl * sl), rw = mix(6.0, 3.1, smoothstep(15.5, 17.5, ax));',
        '  float rd = ax > 9.0 ? az - rw : 99.0, fcd = min(rect(p, vec4(-37.5, 3.0, -14.0, 20.5)), rect(p, vec4(14.0, -18.5, 40.0, -3.0))), pv = min(rd, fcd), pad = rect(p, vec4(-24.0, -7.6, -14.0, -2.5));',
        '  c = mix(c, gv, max(1.0 - smoothstep(0.6, 1.0, min(pv, dw - 0.2)), 1.0 - smoothstep(-e, e, pad)));',   // (gravel round the walls, along the road and the paddock, the truck's pad)
        '  vec3 a = vec3(0.31, 0.32, 0.34) * (0.84 + 0.28 * n3) * (0.93 + 0.12 * n1);',   // (asphalt; worn tracks along the road)
        '  a *= 1.0 - 0.08 * (1.0 - smoothstep(0.3, 0.9, abs(abs(rz) - 1.5))) * step(14.5, ax) * step(rd, 0.0);',
        '  vec3 cr = vec3(0.6, 0.6, 0.58) * (0.86 + 0.2 * n3) * (0.94 + 0.1 * n1) * (1.0 - 0.18 * smoothstep(0.55, 0.8, A.g));',   // (concrete: 4 m slabs, old stains)
        '  vec2 jt = abs(fract(p / 4.0) - 0.5) * 4.0; cr *= 1.0 - 0.3 * line(min(jt.x, jt.y), 0.05, e) * (1.0 - smoothstep(0.1, 0.3, px));',
        '  a = mix(a, cr, (1.0 - smoothstep(14.3, 14.7, ax)) * (1.0 - smoothstep(6.3, 6.7, az0)));',
        '  a = mix(a, vec3(0.86, 0.86, 0.84), line(abs(az - rw + 0.3), 0.06, e) * smoothstep(15.0, 18.0, ax) * step(rd, 0.5) * 0.75);',   // (the edge lines)
        '  a = mix(a, vec3(0.85, 0.66, 0.12), line(abs(az0 - 2.75), 0.05, e) * (1.0 - smoothstep(13.9, 14.1, ax)));',   // (the bay's lines)
        '  a = mix(a, vec3(0.86, 0.86, 0.84), line(abs(fract((p.x - 20.0) / 6.0 + 0.5) - 0.5) * 6.0, 0.06, e) * step(19.8, p.x) * step(p.x, 38.2) * step(-11.0, p.y) * step(p.y, -6.5) * 0.7);',   // (the units' bays)
        '  a = mix(a, vec3(0.12, 0.12, 0.13) * (0.7 + 0.6 * step(0.5, fract(p.y * 8.0)) * (1.0 - smoothstep(0.05, 0.12, px))), step(9.15, ax) * step(ax, 9.6) * step(az0, 2.6));',   // (the drain's grate)
        '  c = mix(c, a, 1.0 - smoothstep(-e, e, pv));',
        '  float kb = step(0.0, rd) * step(rd, 0.42) * smoothstep(17.0, 19.0, ax) * (1.0 - smoothstep(34.0, 36.0, ax)) * smoothstep(0.0, 0.5, fcd), kq = abs(fract(ax * 0.45) - 0.5) * 2.0;',   // (the kerbs)
        '  c = mix(c, mix(vec3(0.86, 0.86, 0.84), vec3(0.74, 0.14, 0.12), smoothstep(0.5 - px, 0.5 + px, kq)), kb);',
        '  c *= 0.74 + 0.26 * smoothstep(0.0, 2.6, dw);',   // (darker by the walls)
        '  float shd = texture2D(uSh, p / 384.0 + 0.5).r * step(max(ax, az0), 190.0);',
        '  if (d < 70.0) { shd = max(shd, ' + mx(BX.map(b => 'sweep(p, ' + v4(b) + ', ' + b[4].toFixed(2) + ')')) + ');',
        '    c *= 0.8 + 0.2 * smoothstep(0.0, 1.0, min(min(rect(p, ' + v4(BX[1]) + '), rect(p, ' + v4(BX[3]) + ')), rect(p, ' + v4(BX[4]) + '))); }',
        '  c *= mix(vec3(1.0), vec3(0.5, 0.56, 0.68), shd);',
        '  gl_FragColor = outC(mix(c, horz(p), 0.85 * (1.0 - exp(-d / ' + AIR.toFixed(1) + ')))); }'].join('\n') }));
    ground.position.y = -0.002; ground.renderOrder = 9; scene.add(ground);
    // the team's flags by the way in, in its colours: a slow wave running out along each (the vertex shader: fw, how far out along its
    // flag; the time set as it is drawn)
    const fg = new World.GB(), fw = [], uT = { value: 0 };
    FLG.forEach(([x, c]) => { const i0 = fg.P.length / 3, cl = c.map(v => lerp(v, (c[0] + c[1] + c[2]) / 3, 0.15));
      for (let i = 0; i < 10; i++) { const x0f = x + 0.05 + i / 10 * 2.2, x1f = x + 0.05 + (i + 1) / 10 * 2.2; fg.quadUp([x0f, 7.95, 8.4], [x1f, 7.95, 8.4], [x1f, 6.65, 8.4], [x0f, 6.65, 8.4], [cl, cl, cl, cl]); }
      for (let i = i0; i < fg.P.length / 3; i++) fw.push((fg.P[i * 3] - x) / 2.25); });
    const fgeo = fg.geometry(); fgeo.setAttribute('fw', new THREE.Float32BufferAttribute(fw, 1));
    const fm = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color().setScalar(OUTK), side: THREE.DoubleSide });
    fm.onBeforeCompile = (sh) => { sh.uniforms.uT = uT;
      sh.vertexShader = 'uniform float uT; attribute float fw;\n' + sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\nvColor.rgb *= 1.0 - 0.24 * cos(position.x * 4.2 - uT * 2.6) * fw;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat ph = position.x * 4.2 - uT * 2.6; transformed.z += (sin(ph) * 0.17 + sin(ph * 1.7 + 1.3) * 0.05) * fw; transformed.y -= (1.0 - cos(ph * 0.5)) * 0.05 * fw;'); };
    fm.customProgramCacheKey = () => 'outFlag';
    const flags = new THREE.Mesh(fgeo, fm); flags.onBeforeRender = () => { uT.value = (performance.now() / 1000) % (Math.PI * 1000); }; scene.add(mainOnly(flags));
  }
  // the big screen: the car on the turntable (its name, drive, power), its four upgrades as bars, a telemetry trace running
  function drawScreen(t) {
    if (!screen) return;
    const g = screen.g, w = 512, h = 288, cv = cur, M = cv && cv.M, up = cv ? cv.spec.upg || {} : {};
    g.fillStyle = '#081221'; g.fillRect(0, 0, w, h);
    const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, 'rgba(40,110,190,0.25)'); bg.addColorStop(1, 'rgba(10,20,40,0)'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d9453a'; g.fillRect(0, 0, 10, h); for (let y = 0; y < h; y += 28) { g.fillStyle = '#f2efe8'; g.fillRect(0, y + 14, 10, 14); }   // (the kerb stripe of the menu)
    g.fillStyle = '#ffd23f'; g.font = 'italic 900 22px Roboto, Arial, sans-serif'; g.fillText('APEX RACING', 28, 36);
    const tr = (s) => typeof Lang !== 'undefined' ? Lang.tr(s) : s;
    g.fillStyle = '#a3b2d3'; g.font = 'italic 700 16px Roboto, Arial, sans-serif'; g.fillText(tr('GARAŽA · V ŽIVO'), 190, 36);
    if (M) {
      const st = Core.upgStats(M, up);
      g.fillStyle = '#ffffff'; g.font = 'italic 900 46px Roboto, Arial, sans-serif'; g.fillText(M.name, 28, 92, 330);
      g.fillStyle = '#6cc8f7'; g.font = 'italic 900 34px Roboto, Arial, sans-serif'; g.fillText(Math.round(st.kw) + ' kW', 360, 92, 140);
      g.fillStyle = '#a3b2d3'; g.font = '700 15px Roboto, Arial, sans-serif'; g.fillText(M.drive + ' · ' + M.mass + ' kg', 28, 118);
      [tr('Motor'), tr('Gume'), tr('Zavore'), 'Aero'].forEach((n, i) => { const k = ['motor', 'gume', 'zavore', 'aero'][i], lv = up[k] || 0, y = 146 + i * 26;
        g.fillStyle = '#a3b2d3'; g.font = '700 14px Roboto, Arial, sans-serif'; g.fillText(n.toUpperCase(), 28, y + 13);
        for (let p = 0; p < 3; p++) { g.fillStyle = p < lv ? ['#5fd38a', '#f5c84c', '#ff6b5b'][Math.min(2, lv - 1)] : '#1d2b41'; g.fillRect(110 + p * 46, y + 2, 40, 13); } });
    }
    g.strokeStyle = 'rgba(80,130,190,0.35)'; g.lineWidth = 1; g.strokeRect(272, 140, 220, 120);
    const f = (x) => 0.55 + 0.3 * Math.sin(x * 0.05 + t * 0.6) + 0.12 * Math.sin(x * 0.17 + 1 + t);
    g.strokeStyle = '#47c6ff'; g.lineWidth = 2.5; g.beginPath(); for (let x = 0; x <= 220; x += 4) { const y = 255 - f(x) * 100; x ? g.lineTo(272 + x, y) : g.moveTo(272, y); } g.stroke();
    const cx = 272 + (t * 50) % 220; g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(cx, 141, 2, 118);
    screen.t.needsUpdate = true;
  }
  let monCtx = null, monTexObj = null;
  function monitorTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 148; monCtx = c.getContext('2d');
    monTexObj = new THREE.CanvasTexture(c); drawMonitor(0); return monTexObj;
  }
  function drawMonitor(t) {   // a live-looking telemetry trace: speed and throttle over a lap, a cursor running along
    const g = monCtx, w = 256, h = 148; g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(80,120,170,0.25)'; g.lineWidth = 1; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 18); g.lineTo(x, h); g.stroke(); } for (let y = 18; y < h; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#ffd23f'; g.font = 'bold 12px Roboto, Arial, sans-serif'; g.fillText('TELEMETRY · LAP 3', 8, 13);
    const f = (x) => 0.55 + 0.3 * Math.sin(x * 0.045) + 0.12 * Math.sin(x * 0.13 + 1);
    g.strokeStyle = '#47c6ff'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x < w; x += 2) { const y = h - 12 - f(x) * (h - 40); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.strokeStyle = '#7fe08a'; g.lineWidth = 1.5; g.beginPath(); for (let x = 0; x < w; x += 2) { const y = h - 10 - (f(x + 6) > 0.6 ? 0.3 : 0.08) * (h - 40); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    const cx = (t * 40) % w; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(cx, 18, 1.5, h);
    monTexObj.needsUpdate = true;
  }

  /* ---------------- the turntable: a steel disc flush with the floor on a scissor lift in a pit ---------------- */
  function buildTurntable() {
    const R = ROOM.R;
    tt = new THREE.Group(); scene.add(tt);
    ttTop = new THREE.Group(); tt.add(ttTop);
    const discTop = new THREE.Mesh(new THREE.CircleGeometry(R, 96), floorMaterial(TX.disc, 1.05, { rough: 0.8, metal: 0.7 }));   // (polished steel: the tyres crisp in it)
    discTop.rotation.x = -Math.PI / 2; discTop.position.y = 0.002; discTop.receiveShadow = true; ttTop.add(discTop);
    // its edge in hazard stripes (the doors' atlas: a period a facet), its underside (a dark texel of the grate's); with the pit's wall
    // and floor drawn only while the table is up (at rest they lie under the table and the ring: setLift)
    const rg = new World.GB(true), A = 1 / 256, n = 96, P = (a, y) => [Math.cos(a) * R, y, Math.sin(a) * R], WH = [1, 1, 1], hv = (4 + 120 * 0.12 / (TAU * R / n)) * A;
    for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; rg.quadO(P(a0, -0.118), P(a1, -0.118), P(a1, 0.002), P(a0, 0.002), WH, [0, -0.058, 0], [[4 * A, 4 * A], [124 * A, 4 * A], [124 * A, hv], [4 * A, hv]]);
      if (i % 2 === 0) { rg.dUV = [152 * A, 0.25]; rg.triO([0, -0.118, 0], P(a0, -0.118), P(i + 2 < n ? (i + 2) / n * TAU : TAU, -0.118), WH, [0, 0, 0]); rg.dUV = null; } }
    const rim = new THREE.Mesh(rg.geometry(), new THREE.MeshLambertMaterial({ map: TX.doorA })); tt.add(rim);
    // the pit (seen only with the table up): its wall, its floor, the scissor lift
    const pit = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.07, R + 0.07, 1.0, 64, 1, true), new THREE.MeshLambertMaterial({ color: 0x24272d, side: THREE.BackSide })); pit.position.y = -0.5; scene.add(mainOnly(pit));
    const pf = new THREE.Mesh(new THREE.CircleGeometry(R + 0.07, 48), new THREE.MeshLambertMaterial({ color: 0x101114 })); pf.rotation.x = -Math.PI / 2; pf.position.y = -1.0; scene.add(mainOnly(pf));
    scis = { bars: [], low: [rim, pit, pf], mat: new THREE.MeshPhongMaterial({ color: 0xd9a514, specular: 0x555555, shininess: 40 }) };
    for (const z of [-1.1, 1.1]) for (const k of [0, 1]) for (const lvl of [0, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.09, 0.08), scis.mat); b.userData = { z: z + (k ? 0.1 : -0.1), k, lvl }; scene.add(b); scis.bars.push(b); }
    const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 12), new THREE.MeshPhongMaterial({ color: 0xc8ccd2, specular: 0xffffff, shininess: 120 })); scene.add(ram); scis.ram = ram;
    setLift(0);
  }
  function setLift(h) {
    lift = h; tt.position.y = h; GROUND.value = h;   // (the cars' floor: their occlusion measured from it)
    // the scissors: two levels of crossed bars between the pit floor (-1.0) and the table's underside (h - 0.12)
    const top = h - 0.12, bot = -0.98, H2 = (top - bot) / 2, L = 2.0, a = Math.asin(clamp(H2 / L, 0, 0.99));
    for (const b of scis.bars) { const { z, k, lvl } = b.userData; b.position.set(0, bot + H2 * (lvl + 0.5), z); b.rotation.set(0, 0, k ? a : -a); b.visible = h > 0.02; }
    for (const o of scis.low) o.visible = h > 0.02;
    scis.ram.visible = h > 0.02; scis.ram.scale.y = Math.max(0.01, top - bot); scis.ram.position.set(0, bot + (top - bot) / 2, 0);
  }

  /* ---------------- the floor: epoxy with a mirror image (a planar reflection drawn every frame at half size), blurred and faded ---------------- */
  // REF.depth: the mirror image's depth kept (WebGL2, or WEBGL_depth_texture): a pass (REF.gm) then writes the image again into REF.gt
  // with each texel's gap in its alpha (how far over the floor the reflected point is), so the floor's taps read both, filtered
  const REF = { rt: null, gt: null, gm: null, cam: new THREE.PerspectiveCamera(), tm: new THREE.Matrix4(), invP: new THREE.Matrix4(), k: { value: 0.85 }, size: 0.5, depth: false };
  // the floor's material (the turntable's top's too): the room light on it, then the mirror image (k: how strong; opts.rough: how much
  // it blurs; opts.metal: how much of its own colour the image takes away, 0.25 the resin; opts.lay: a layout map over the room, r the
  // albedo x 1.6, g the gloss x 1.27). With the gap the blur grows with how high over the floor the reflected thing is, and every tap
  // fades by its own gap: a tyre crisp where it stands, the walls soft and faint, only bright things (the doorway, the lamps) keep a long
  // faint smear, and no seam where a near thing's edge crosses a far one. Epoxy's fresnel, the taps stretched into vertical streaks.
  function floorMaterial(map, k, opts) {
    const o = opts || {}, m = new THREE.MeshPhongMaterial({ map, specular: 0x444444, shininess: 60 }), uK = { value: k }, lay = o.lay, { x0, x1, z0, z1 } = ROOM;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { tRefl: { get value() { return (REF.gt || REF.rt).texture; } }, uTexM: { value: REF.tm }, uReflK: REF.k, uK, uRough: { value: o.rough || 1 }, uMetal: { value: o.metal || 0.25 },
        uTexel: { get value() { return REF.texel; } }, tLay: { value: lay } });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 uTexM; varying vec4 vRefl;').replace('#include <project_vertex>', '#include <project_vertex>\nvRefl = uTexM * vec4(vRp, 1.0);');
      const lu = (a, b) => [1 / (b - a), -a / (b - a)].map(v => v.toFixed(5));   // (the map over the room: u along x, v along z)
      roomPatch(sh, lay && 'vec4 lay = texture2D(tLay, vRp.xz * vec2(' + lu(x0, x1)[0] + ', ' + lu(z0, z1)[0] + ') + vec2(' + lu(x0, x1)[1] + ', ' + lu(z0, z1)[1] + ')); diffuseColor.rgb *= lay.r * 1.6;', false);   // (vRp set before vRefl)
      sh.fragmentShader = (REF.depth ? '#define REFL_DEPTH\n' : '') + (lay ? '#define LAY\n' : '') + sh.fragmentShader
        .replace('#include <common>', ['#include <common>', 'uniform sampler2D tRefl; uniform sampler2D tLay; uniform float uReflK; uniform float uK; uniform float uRough; uniform float uMetal; uniform vec2 uTexel; varying vec4 vRefl;',
          'float rFade(vec4 t) {',   // (a tap's weight: it fades with its gap, the alpha (25 a^2 metres); bright things keep a faint long smear)
          '#ifdef REFL_DEPTH',
          '  return max(exp(-2.5 * t.a * t.a * uRough), 0.18 * smoothstep(0.75, 1.5, dot(t.rgb, vec3(0.3333))));',
          '#else',
          '  return 1.0;',
          '#endif',
          '}'].join('\n'))
        .replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', [
          'outgoingLight = roomLight(outgoingLight, diffuseColor.rgb);',
          'vec2 ruv = vRefl.xy / vRefl.w; vec4 r0 = texture2D(tRefl, ruv); float bl = uRough;',
          '#ifdef REFL_DEPTH',   // (the blur's spot as the eye sees it: it grows with the gap, over the whole way to the eye; none at a contact)
          'float gap = 25.0 * r0.a * r0.a, dc = length(cameraPosition - vRp); bl *= 0.25 + 6.0 * gap / (gap + dc);',
          '#endif',
          '#ifdef LAY',
          'bl *= 1.0 + 2.5 * (1.0 - lay.g);',
          '#endif',
          // (the middle and 7 taps on a golden-angle spiral turned per pixel, the resin's flecks jittering it: no banding, a fine grain)
          'float rot = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2832; vec2 j = (vec2(texelColor.r, fract(texelColor.r * 7.3)) - 0.5) * uTexel * 1.6 * bl;',
          'float f = rFade(r0), ws = 1.0, fk = f; vec3 rc = r0.rgb * f;',
          'for (int i = 1; i < 8; i++) { float a = float(i) * 2.39996 + rot, w = 1.0 / (1.0 + float(i) * 0.3); vec4 t = texture2D(tRefl, ruv + j + vec2(cos(a) * 0.6, sin(a) * 1.5) * (0.28 + float(i) * 0.32) * bl * uTexel);',
          '  f = rFade(t) * w; rc += t.rgb * f; fk += f; ws += w; }',
          'rc /= ws; fk /= ws;',
          'vec3 vd = normalize(cameraPosition - vRp); float fr = 0.18 + 0.82 * pow(1.0 - clamp(vd.y, 0.0, 1.0), 4.0);',
          'float rk = fr * uReflK * uK;',
          '#ifdef LAY',
          'rk *= lay.g * 1.27;',
          '#endif',
          'outgoingLight = outgoingLight * (1.0 - uMetal * rk * fk) + rc * rk * 1.15;',
          'gl_FragColor = vec4( outgoingLight, diffuseColor.a );'].join('\n'));
    };
    m.customProgramCacheKey = () => 'garageFloor' + (REF.depth ? 'D' : '') + (lay ? 'L' : '');
    m.userData.k = uK;
    return m;
  }
  function buildFloor() {
    const { x0, x1, z0, z1 } = ROOM, sh = new THREE.Shape();
    sh.moveTo(x0, -z1); sh.lineTo(x1, -z1); sh.lineTo(x1, -z0); sh.lineTo(x0, -z0); sh.lineTo(x0, -z1);
    const hole = new THREE.Path(); hole.absarc(0, 0, ROOM.R + 0.07, 0, TAU, true); sh.holes.push(hole);
    const geo = new THREE.ShapeGeometry(sh, 48); geo.rotateX(-Math.PI / 2);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4, uv.getY(i) / 4);
    floorMat = floorMaterial(TX.floor, 1, { rough: 1.0, lay: TX.floorL || TX.layN });
    const f = new THREE.Mesh(geo, floorMat); f.receiveShadow = true; scene.add(f); refl = f;
    // the mirror image: half-float with HDR (the lamps and the doorway over 1 in it too), its depth in a texture where there can be one
    const o = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: HDR ? THREE.HalfFloatType : THREE.UnsignedByteType };
    REF.rt = new THREE.WebGLRenderTarget(4, 4, o); REF.rt.texture.generateMipmaps = false; REF.texel = new THREE.Vector2(0.25, 0.25);
    if (!renderer.capabilities.isWebGL2 && !renderer.extensions.has('WEBGL_depth_texture')) return;
    REF.rt.depthTexture = new THREE.DepthTexture(4, 4); REF.rt.depthTexture.type = THREE.UnsignedIntType; REF.depth = true;
    // the gap: the point back from the depth (the clipped projection's inverse), its height over the floor; the gap is the part of the
    // ray beyond the floor, length x y / (y + the camera's depth under the floor); the sky 25 m. Kept as sqrt(gap / 25): fine near 0
    REF.gt = new THREE.WebGLRenderTarget(4, 4, Object.assign({ depthBuffer: false, stencilBuffer: false }, o)); REF.gt.texture.generateMipmaps = false;
    REF.gm = fsMat({ tC: { value: REF.rt.texture }, tZ: { value: REF.rt.depthTexture }, uInvP: { value: REF.invP }, uW: { value: REF.cam.matrixWorld } }, [
      'uniform sampler2D tC; uniform sampler2D tZ; uniform mat4 uInvP; uniform mat4 uW; varying vec2 vUv;',
      'void main(){ float z = texture2D(tZ, vUv).r; vec4 v = uInvP * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0); v /= v.w;',
      '  float y = max((uW * v).y, 0.0), g = z > 0.99999 ? 25.0 : length(v.xyz) * y / max(y - uW[3].y, 1e-3);',
      '  gl_FragColor = vec4(texture2D(tC, vUv).rgb, sqrt(min(g, 25.0) / 25.0)); }'].join('\n'));
  }
  // the mirror camera under the floor (as three.js's Reflector: the camera reflected in y = 0, its near plane cut along the floor)
  const _v = new V3(), _t = new V3(), _q = new THREE.Vector4(), _pl = new THREE.Plane();
  function drawReflection() {
    const rc = REF.cam;
    camera.updateMatrixWorld();
    rc.position.set(camera.position.x, -camera.position.y, camera.position.z);
    _t.set(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position); _t.y = -_t.y;
    _v.set(0, 1, 0).applyQuaternion(camera.quaternion); rc.up.set(_v.x, -_v.y, _v.z);
    rc.lookAt(_t); rc.near = camera.near; rc.far = camera.far; rc.updateMatrixWorld(); rc.projectionMatrix.copy(camera.projectionMatrix);
    REF.tm.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1); REF.tm.multiply(rc.projectionMatrix); REF.tm.multiply(rc.matrixWorldInverse);
    _pl.setFromNormalAndCoplanarPoint(new V3(0, 1, 0), new V3(0, 0.0, 0)); _pl.applyMatrix4(rc.matrixWorldInverse);
    const cp = new THREE.Vector4(_pl.normal.x, _pl.normal.y, _pl.normal.z, _pl.constant), pm = rc.projectionMatrix.elements;
    _q.x = (Math.sign(cp.x) + pm[8]) / pm[0]; _q.y = (Math.sign(cp.y) + pm[9]) / pm[5]; _q.z = -1; _q.w = (1 + pm[10]) / pm[14];
    cp.multiplyScalar(2 / cp.dot(_q)); pm[2] = cp.x; pm[6] = cp.y; pm[10] = cp.z + 1 - 0.003; pm[14] = cp.w;
    REF.invP.copy(rc.projectionMatrix).invert();   // (the clipped projection's inverse: the gap pass finds the reflected points from the depth)
    refl.visible = false; ttTop.visible = false;   // (what lies on the floor is the main camera's only: mainOnly)
    renderer.setRenderTarget(REF.rt); renderer.clear(); renderer.render(scene, rc);
    if (REF.gm) fsPass(REF.gm, REF.gt);
    renderer.setRenderTarget(null);
    refl.visible = true; ttTop.visible = true;
  }

  /* ---------------- lights ---------------- */
  // neutral white (the cyan only in what glows): the sky's and the floor's bounce, the key light over the table with its shadows over
  // the whole room (the map drawn again only when something moves: shadowDirty, frame()), a fill, a rim; the doors' daylight, the
  // washers and the sun through the windows are the room light's
  let shadowDirty = 2;   // (frames still to draw the shadow map in)
  function buildLights() {
    scene.add(new THREE.HemisphereLight(0xf1f3f6, 0x3a3631, 0.5));
    keyLight = new THREE.DirectionalLight(0xfff3e2, 0.85); keyLight.target.position.set(0, 0, 2); keyLight.position.copy(KEY_DIR).multiplyScalar(12).add(keyLight.target.position); keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024); const sc = keyLight.shadow.camera; sc.left = -9.8; sc.right = 9.8; sc.top = 8.6; sc.bottom = -8.6; sc.near = 2; sc.far = 30;
    sc.up.set(0, 0, -1);   // (the map's box square with the room: x across, z up the map)
    keyLight.shadow.bias = -0.0006; keyLight.shadow.normalBias = 0.03; keyLight.shadow.radius = 4; scene.add(keyLight, keyLight.target);
    const fill = new THREE.DirectionalLight(0xdfe6f0, 0.24); fill.position.set(-6, 3, 4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xe8eefa, 0.42); rim.position.set(-2, 4, -8); scene.add(rim);
  }

  /* ---------------- the camera: round the car (the user drags it left and right only), moved by the animations ---------------- */
  const HOME = { yaw: 0.55, pitch: 0.18, dist: 9.2, tx: -0.2, ty: 0.62, tz: 0, fov: 33 };
  const rig = Object.assign({}, HOME), user = { yaw: 0, vy: 0 };
  function placeCamera(dt) {
    if (!user.drag) { user.yaw += user.vy * dt; user.vy *= Math.exp(-dt * 3); }
    const aspect = W / H, fov = rig.fov, th = Math.tan(fov * Math.PI / 360), need = 3.5 / (th * aspect), fit = Math.max(1, need / HOME.dist);
    const yaw = rig.yaw + user.yaw, pitch = clamp(rig.pitch, -0.02, 1.2), d = rig.dist * fit;
    camera.fov = fov; camera.aspect = aspect; camera.updateProjectionMatrix();
    const ty = rig.ty + Math.sin(time * 0.31) * 0.012;
    camera.position.set(rig.tx + Math.sin(yaw) * Math.cos(pitch) * d, ty + Math.sin(pitch) * d, rig.tz + Math.cos(yaw) * Math.cos(pitch) * d);
    if (camera.position.y < 0.18) camera.position.y = 0.18;
    // (always as far from the car: out beyond a wall the wall's things step aside, stepPieces)
    camera.lookAt(rig.tx, ty, rig.tz);
  }
  // a camera position: around a point of the car (car space, after the turntable has turned to angle ang and the table is at height lf)
  function view(o, ang, lf) {
    const p = new V3(...(o.at || [0, 0.6, 0])), c = Math.cos(ang), s = Math.sin(ang);
    const x = p.x * c + p.z * s, z = -p.x * s + p.z * c;
    return { yaw: o.yaw != null ? o.yaw : HOME.yaw, pitch: o.pitch != null ? o.pitch : HOME.pitch, dist: o.dist || HOME.dist, tx: x, ty: p.y + (lf || 0), tz: z, fov: o.fov || HOME.fov };
  }
  function* camTo(to, s, ez, stop) {
    const from = Object.assign({}, rig), u0 = Object.assign({}, user);
    let dy = to.yaw - (from.yaw + u0.yaw); dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    yield* tween(s, (k) => {
      if (stop && stop()) return;
      for (const key of ['pitch', 'dist', 'tx', 'ty', 'tz', 'fov']) rig[key] = lerp(from[key], to[key], k);
      rig.yaw = from.yaw + u0.yaw + dy * k; user.yaw = 0; user.vy = 0;
    }, ez || EZ.io);
  }
  const home = (s) => camTo(HOME, s == null ? 1.1 : s);
  // the views of the picture's pill: 1 three quarters from the front, 2 the side, 3 three quarters from the back, 360° round and round
  const VIEWS = [HOME, Object.assign({}, HOME, { yaw: 0.02, pitch: 0.1, dist: 7.2 }), Object.assign({}, HOME, { yaw: -0.78, pitch: 0.22, dist: 7.6 })];
  let autoSpin = false, viewTok = 0;
  function setView(i) {
    if (busy) return;
    const tok = ++viewTok; autoSpin = i === 'spin';
    spawn(camTo(autoSpin ? Object.assign({}, HOME, { yaw: rig.yaw + user.yaw, pitch: 0.24 }) : VIEWS[i] || HOME, 1.0, null, () => tok !== viewTok));
  }

  /* ---------------- input: drag left or right to go round the car (only that: the camera's height and distance stay, no zoom);
     a sideways scroll (a touchpad, shift and the wheel) turns it too; a tap speeds an animation up ---------------- */
  function bindInput(el) {
    let id = null, lastX = 0, moved = 0, t0 = 0;   // (one finger turns it: a second one is ignored)
    const k = () => 3.2 / Math.max(240, el.clientWidth);
    el.addEventListener('pointerdown', (e) => { if (id !== null) { moved += 10; return; } id = e.pointerId; el.setPointerCapture(id); lastX = e.clientX; moved = 0; t0 = performance.now(); user.drag = true; user.vy = 0; });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      user.yaw -= dx * k(); user.vy = -dx * k() * 60 * 0.5;
    });
    const up = (e) => { if (e.pointerId !== id) return; id = null; user.drag = false; if (moved < 8 && performance.now() - t0 < 300 && busy) speed = 3; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', (e) => { e.preventDefault(); if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) user.yaw += e.deltaX * (e.deltaMode ? 16 : 1) * k() * 0.6; }, { passive: false });
  }

  /* ---------------- sound: the car's own engine (Sfx's, fed a car that stands still), and the workshop's noises ---------------- */
  const eng = { on: false, M: null, rpm: 0, rev: 0, revT: 0, locked: true, speed: 0, thr: 0, smoky: 0 };
  function engFrame(dt) {
    if (typeof Sfx === 'undefined') return;
    if (!eng.on) return;
    const M = eng.M, p = { m: M, rpm: eng.rpm, locked: eng.locked, inThr: eng.thr, shiftT: 0, speed: eng.speed, latR: 0, spin: 0, lock: false, inHand: 0, ws: [0, 0, 0, 0], onCurb: false, air: false, x: 0, z: 0, vx: 0, vz: 0, roadY: 0, q: null };
    try { Sfx.update(null, p, null, eng.rev); } catch (e) { /* (a sound is never worth an error) */ }
  }
  function engStart(M) { eng.on = true; eng.M = M; eng.rev = 0; eng.locked = true; eng.speed = 0; eng.thr = 0; if (typeof Sfx !== 'undefined') Sfx.setRunning(true); }
  function engStop() { if (!eng.on) return; eng.on = false; if (typeof Sfx !== 'undefined') { Sfx.silence(); } }
  const SND = { ctx: null, out: null, noise: null, loops: {} };
  function sndInit() {
    if (SND.ctx) { if (SND.ctx.state !== 'running') SND.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { SND.ctx = new AC(); } catch (_) { return; }
    SND.out = SND.ctx.createGain(); SND.out.gain.value = SND.vol == null ? 0.7 : SND.vol; SND.out.connect(SND.ctx.destination);
    const b = SND.ctx.createBuffer(1, SND.ctx.sampleRate * 2, SND.ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; SND.noise = b;
  }
  const sOk = () => SND.ctx && SND.ctx.state === 'running';
  function sNoise(type, f, q, dur, vol, f1) {   // a burst of filtered noise (a hiss, a whoosh, a clunk's rattle)
    if (!sOk()) return; const c = SND.ctx, now = c.currentTime, s = c.createBufferSource(); s.buffer = SND.noise;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, now); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, now + dur); fl.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + Math.min(0.08, dur * 0.25)); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    s.connect(fl); fl.connect(g); g.connect(SND.out); s.start(now, Math.random()); s.stop(now + dur + 0.05);
  }
  function sTone(type, f0, f1, dur, vol, delay) {
    if (!sOk()) return; const c = SND.ctx, now = c.currentTime + (delay || 0), o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, now); o.frequency.exponentialRampToValueAtTime(f1, now + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(SND.out); o.start(now); o.stop(now + dur + 0.05);
  }
  function sLoop(id, type, f, q, vol) {   // a steady filtered noise (water, a spray gun), faded in and out
    if (!sOk()) return; const c = SND.ctx, now = c.currentTime;
    let L = SND.loops[id];
    if (!L) { const s = c.createBufferSource(); s.buffer = SND.noise; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = 0.0001; s.connect(fl); fl.connect(g); g.connect(SND.out); s.start(); L = SND.loops[id] = { s, g, fl }; }
    L.g.gain.setTargetAtTime(Math.max(0.0001, vol), now, 0.08);
  }
  const SFX = {
    clunk: (v) => { sTone('sine', 120, 45, 0.22, 0.5 * (v || 1)); sNoise('bandpass', 900, 1.2, 0.09, 0.25 * (v || 1)); sTone('square', 1400, 900, 0.05, 0.05 * (v || 1)); },
    click: () => sTone('square', 2400, 1800, 0.03, 0.04),
    whoosh: (v) => sNoise('bandpass', 400, 0.8, 0.7, 0.22 * (v || 1), 2600),
    hiss: (d, v) => sNoise('highpass', 3000, 0.6, d || 0.6, 0.18 * (v || 1), 1600),
    spark: () => sNoise('highpass', 5000, 0.5, 0.06 + Math.random() * 0.05, 0.12),
    ping: (f) => { sTone('sine', f || 1760, (f || 1760) * 1.01, 0.5, 0.08); sTone('sine', (f || 1760) * 1.5, (f || 1760) * 1.5, 0.35, 0.04, 0.06); },
    coin: () => { sTone('triangle', 1318, 1318, 0.12, 0.12); sTone('triangle', 1976, 1976, 0.32, 0.12, 0.08); },
    servo: (d) => { if (!sOk()) return; const c = SND.ctx, now = c.currentTime, o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, now); o.frequency.linearRampToValueAtTime(95, now + d * 0.3); o.frequency.linearRampToValueAtTime(65, now + d);
      const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 380; const g = c.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.05, now + 0.15); g.gain.setValueAtTime(0.05, now + d - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, now + d);
      o.connect(fl); fl.connect(g); g.connect(SND.out); o.start(now); o.stop(now + d + 0.05); },
    wrench: () => { if (typeof Sfx !== 'undefined') Sfx.wrench(); },
  };

  /* ---------------- a car in the garage ---------------- */
  const ray = new THREE.Raycaster();
  // where the body is: its box, the height of its top at (x, z), the side at (x, y), the front and the back at (y, z) (car space)
  function bodyProbe(v) {
    v.grp.updateMatrixWorld(true);
    const meshes = []; v.bodyG.traverse(o => { if (o.isMesh && o.visible && o !== v.dec && !(v.dec && o.material === v.dec.material) && o !== v.tail) meshes.push(o); });
    const bb = new THREE.Box3(); for (const m of meshes) bb.expandByObject(m);
    const hit = (o, d) => { ray.set(o, d); ray.far = 20; const h = ray.intersectObjects(meshes, false); return h.length ? h[0].point : null; };
    return {
      bb, meshes,
      top: (x, z) => { const p = hit(new V3(x, 6, z), new V3(0, -1, 0)); return p ? p.y : null; },
      side: (x, y, sd) => { const p = hit(new V3(x, y, sd * 5), new V3(0, 0, -sd)); return p ? Math.abs(p.z) : null; },
      front: (y, z) => { const p = hit(new V3(8, y, z), new V3(-1, 0, 0)); return p ? p.x : null; },
      back: (y, z) => { const p = hit(new V3(-8, y, z), new V3(1, 0, 0)); return p ? p.x : null; },
    };
  }
  // the wheels: where they are, their size, the face of their outer side (the race draws the front ones (and all four of a formula,
  // a prototype or the Peugeot) as meshes of their own; the other rear ones are in the body)
  function wheelsOf(v, M) {
    const out = [], box = new THREE.Box3(), sz = new V3(), ctr = new V3();
    for (const [list, front] of [[v.wf, true], [v.wr, false]]) for (const w of list) {
      box.setFromObject(w); box.getSize(sz); box.getCenter(ctr);
      const sd = w.position.z < 0 ? -1 : 1, outer = sd > 0 ? box.max.z : box.min.z;
      const q = { obj: w, x: w.position.x, y: w.position.y, z: w.position.z, r: sz.y / 2, wd: sz.z, sd, outer, front, own: true };
      // its outer face measured with rays along the axle: the tyre's sidewall, the rim's dish deep in it and the spokes over the dish
      const at = (R, a) => { ray.set(new V3(q.x + Math.cos(a) * R, q.y + Math.sin(a) * R, q.z + sd * 1.5), new V3(0, 0, -sd)); ray.far = 3; const h = ray.intersectObject(w, true); return h.length ? Math.abs(h[0].point.z - q.z) : null; };
      const many = (R) => { const o = []; for (let k = 0; k < 40; k++) { const d = at(R, k / 40 * TAU + 0.03); if (d != null) o.push(d); } return o; };
      const sw = many(q.r * 0.88), dk = many(q.r * 0.4);
      q.side = sw.length ? Math.max(...sw) : q.wd / 2; q.dish = dk.length ? Math.min(...dk) : q.wd / 2 - 0.01; q.spk = dk.length ? Math.max(...dk) : q.dish + 0.012;
      out.push(q);
    }
    if (!v.wr.length) {   // (the rear wheels in the body: as the front ones, at the race's rear axle)
      const rx = -M.b * (M.len / 4.4) * 0.98;
      for (const f of out.slice()) out.push(Object.assign({}, f, { obj: null, x: rx, front: false, own: false }));
    }
    return out;
  }
  // every material of the car becomes its own copy (the shader patches kept): the reflections of the garage, and the paint shop's
  // cut (the body's materials only: the wheels and the shadow are never cut); the floor's occlusion on what is solid (darker down to
  // the sills, the bumpers' undersides, the wheels' feet: GROUND, the table's top, setLift)
  const GROUND = { value: 0 };
  function floorAO(c, key) {
    const ob = c.onBeforeCompile;
    c.onBeforeCompile = (sh, r) => { ob.call(c, sh, r); sh.uniforms.uGround = GROUND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vGy;').replace('#include <project_vertex>', '#include <project_vertex>\nvGy = (modelMatrix * vec4(transformed, 1.0)).y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGround; varying float vGy;')
        .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb *= mix(0.45, 1.0, smoothstep(0.03, 0.62, vGy - uGround));\n#include <tonemapping_fragment>'); };
    c.customProgramCacheKey = () => key + '|gao';
  }
  function carMats(cv) {
    const v = cv.v, map = new Map(), clipSet = new Set();
    v.bodyG.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) clipSet.add(m); });
    v.grp.traverse(o => {
      if (!o.isMesh || !o.material) return;
      const one = (m) => {
        if (!map.has(m)) {
          const c = m.clone(); c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey;
          if (c.envMap) c.envMap = env.texture || env;
          if (clipSet.has(m) && o !== v.blob) c.clippingPlanes = [cv.clip];
          if ((c.isMeshPhongMaterial || c.isMeshLambertMaterial) && !c.transparent && o !== v.blob) floorAO(c, m.customProgramCacheKey());
          map.set(m, c);
        }
        return map.get(m);
      };
      o.material = Array.isArray(o.material) ? o.material.map(one) : one(o.material);
    });
    cv.mats = map;
  }
  function makeCar(spec) {
    const M = spec.M, v = Render.garageCar(M, spec.color, spec.num || 0, spec.stripe);
    if (!spec.num) { v.dec.visible = false; v.bodyG.traverse(o => { if (o.isMesh && o.material === v.dec.material) o.visible = false; }); }
    const root = new THREE.Group(); root.add(v.grp);
    const cv = { M, spec: Object.assign({}, spec, { upg: Object.assign({}, spec.upg), cond: Object.assign({ clean: 1, body: 1, engine: 1 }, spec.cond) }), v, root, clip: new THREE.Plane(new V3(-1, 0, 0), 1e4), parts: {}, glows: [], spin: 0, pitch: 0, bounce: 0, roll: 0, shake: 0 };
    const pb = bodyProbe(v); cv.probe = pb; cv.bb = pb.bb;
    cv.wheels = wheelsOf(v, M); root.userData.cv = cv;
    carMats(cv); carDiet(cv, v.grp, false);
    if (v.blob) { v.blob.material.map = TX.under; v.blob.material.opacity = 0.9; v.blob.scale.set(1, 1, 1); v.blob.position.y = 0.012; mainOnly(v.blob); }
    // where the tyres stand: a dark patch under each (one mesh, on the floor: it stays when the body moves on its springs; it fades
    // when the car goes up on its jacks, poseCar)
    { const P = [], U = [], I = [];
      for (const w of cv.wheels) { const hx = w.r * 0.85, hz = w.wd * 0.8, n = P.length / 3;
        P.push(w.x - hx, 0.016, w.z - hz, w.x - hx, 0.016, w.z + hz, w.x + hx, 0.016, w.z + hz, w.x + hx, 0.016, w.z - hz); U.push(0, 0, 0, 1, 1, 1, 1, 0); I.push(n, n + 1, n + 2, n, n + 2, n + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeBoundingSphere();
      const m = new THREE.MeshBasicMaterial({ map: TX.contact, transparent: true, depthWrite: false, opacity: 0.85 }); m.userData.own = true;
      cv.contact = new THREE.Mesh(g, m); cv.contact.renderOrder = 1; root.add(mainOnly(cv.contact)); }
    cv.tailOn = new THREE.MeshBasicMaterial({ color: emi(0xff2a1a, EMI.tail) }); cv.tailOn.clippingPlanes = [cv.clip]; cv.tailOff = v.tail.material;
    // the lamps' glows
    const gl = (p, col, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); sp.position.copy(p); sp.scale.set(s, s, s); sp.renderOrder = 10; sp.visible = false; v.bodyG.add(sp); return sp; };   // (off: not drawn, lamps())
    cv.head = v.noHead ? [] : [gl(v.lights[0], 0xfff3d6, 0.9), gl(v.lights[1], 0xfff3d6, 0.9)];
    cv.tailG = [gl(v.lights[2], 0xff2a14, 0.6), gl(v.lights[3], 0xff2a14, 0.6)];
    for (const s of cv.head) s.position.x += 0.04; for (const s of cv.tailG) s.position.x -= 0.04;
    cv.kit = kitOf(cv);
    // the underside: a dark plate under the body, seen only from below (in the floor's mirror the car stands on its own shadow)
    const ub = new THREE.Mesh(new THREE.PlaneGeometry((cv.kit.front - cv.kit.rear) * 0.92, cv.kit.hw * 1.7), new THREE.MeshBasicMaterial({ color: 0x050608 }));
    ub.material.userData.own = true; ub.rotation.x = Math.PI / 2; ub.position.set((cv.kit.front + cv.kit.rear) / 2, Math.max(0.1, cv.kit.bottom * 0.9), 0); v.bodyG.add(ub); cv.under = ub;
    buildParts(cv);
    setCond(cv, spec.cond, true);
    return cv;
  }
  function freeCar(cv) {
    if (!cv) return;
    if (cv.root.parent) cv.root.parent.remove(cv.root);
    for (const s of cv.head.concat(cv.tailG)) s.material.dispose();
    cv.contact.geometry.dispose(); cv.contact.material.dispose();
    for (const k in cv.parts) dropParts(cv.parts[k]);
    Render.garageFree(cv.v); cv.tailOn.dispose();
  }
  function disposeTree(o) { if (!o) return; o.traverse(x => { if (x.geometry && !x.geometry.userData.keep) x.geometry.dispose(); if (x.material && x.material.userData && x.material.userData.own) x.material.dispose(); }); if (o.parent) o.parent.remove(o); }
  function setCond(cv, c, now) {   // the wear on the car: dirt (clean), scratches (body); the engine's state shows when it runs
    if (c) Object.assign(cv.spec.cond, c);
    const cc = cv.spec.cond, v = cv.v;
    if (v.dirtU) v.dirtU.value = (1 - clamp(cc.clean, 0, 1)) * 0.75;
    if (v.scrU) v.scrU.value = (1 - clamp(cc.body, 0, 1)) * 1.0;
    const d = v.dirtU ? v.dirtU.value : 0;   // (the wheels of their own get the mud the body's rear ones have)
    for (const w of cv.wheels) if (w.obj) w.obj.traverse(o => { if (o.isMesh && o.material && o.material.color && !(o.material.userData && o.material.userData.own)) o.material.color.setRGB(1 - 0.3 * d, 1 - 0.38 * d, 1 - 0.5 * d); });
  }
  function lamps(cv, head, tail) {   // (a glow that is off is not drawn)
    for (const s of cv.head) { s.material.opacity = head * 0.9 * GLOW.lamp; s.visible = s.material.opacity > 0.01; }
    for (const s of cv.tailG) { s.material.opacity = tail * 0.85 * GLOW.lamp; s.visible = s.material.opacity > 0.01; }
    cv.v.tail.material = tail > 0.6 ? cv.tailOn : cv.tailOff;
  }
  // the car's pose each frame: the body's pitch, roll, bounce and shake on its springs, the wheels' spin
  function poseCar(cv, dt) {
    const v = cv.v, sh = cv.shake > 0 ? cv.shake : 0;
    v.bodyG.rotation.z = cv.pitch + (sh ? (Math.random() - 0.5) * 0.004 * sh : 0);
    v.bodyG.rotation.x = cv.roll + (sh ? (Math.random() - 0.5) * 0.006 * sh : 0);
    v.bodyG.position.y = cv.bounce + (sh ? (Math.random() - 0.5) * 0.004 * sh : 0);
    for (const w of cv.wheels) if (w.obj) w.obj.rotation.z = -cv.spin * (cv.M.rw / Math.max(0.2, w.r));
    cv.contact.material.opacity = 0.85 * (1 - smooth(0, 0.07, v.grp.position.y));   // (up on the jacks: the tyres off the floor)
    const gp = cv.parts.gume; if (gp) for (const it of gp.userData.items) { const w = it.o.userData.wheel; if (w && !w.own) it.o.rotation.z = -cv.spin * w.sd; }   // (the rear wheels are in the body: their lettering turns)
  }

  /* ---------------- the parts of the upgrades on a car ---------------- */
  // the kit's places on this car: measured on its own body (so every car, the Peugeot's model too, gets them where they fit)
  const WINGED = { rally: 1, formula: 1, lm: 1, p206: 1 };   // (a big wing of their own already: no second one on top)
  function kitOf(cv) {
    const M = cv.M, P = cv.probe, bb = cv.bb, front = bb.max.x, rear = bb.min.x, top = bb.max.y, hw = Math.max(bb.max.z, -bb.min.z);
    const open = M.body === 'formula' || M.body === 'lm';
    const wf = cv.wheels.find(w => w.front), wr = cv.wheels.find(w => !w.front), wfx = wf ? wf.x : front - 0.9, wrx = wr ? wr.x : rear + 0.9;
    // the lowest point of the body that a probe finds (the box's bottom is the wheels' in the bodies with the rear wheels in them)
    const lowAt = (fn, d) => { for (let y = 0.05; y < 1.5; y += 0.015) if (fn(y) != null) return y; return d; };
    const xm = (wfx + wrx) / 2, bottom = lowAt((y) => P.side(xm, y, 1), 0.3);
    const rearLow = lowAt((y) => P.back(y, hw * 0.45), bottom), frontLow = lowAt((y) => P.front(y, 0), bottom);
    // the deck at the back: the top of the body just in from its end (a boot, a hatch's roof edge, a truck's bed)
    let deckX = rear + 0.22, deckY = P.top(deckX, 0) || (bottom + 0.6);
    for (let x = rear + 0.08; x < rear + 0.6; x += 0.03) { const y = P.top(x, 0); if (y != null) { deckX = x + 0.07; deckY = P.top(deckX, 0) || y; break; } }
    // the bonnet: the body's top a little over a quarter of the way back from the nose
    let hoodEnd = front - (front - rear) * 0.3, py = P.top(front - 0.1, 0);   // (where the windscreen rises: the body's top steeper than 1 in 2)
    for (let x = front - 0.15; x > rear + 0.6; x -= 0.05) { const y = P.top(x, 0); if (y != null && py != null && (y - py) / 0.05 > 0.5) { hoodEnd = x + 0.05; break; } py = y; }
    const hoodX = (front + hoodEnd) / 2 - 0.04, hoodY = P.top(hoodX, 0) || (bottom + 0.5), hoodY2 = P.top(hoodX - 0.3, 0) || hoodY;
    // the exhaust: a little over the bumper's lowest edge, the bumper's back there
    const exY = Math.min(rearLow + 0.075, deckY - 0.15), exX = P.back(exY, hw * 0.45) || rear, exXc = P.back(exY, 0) || rear;
    const sideZ = P.side(xm, bottom + 0.05, 1) || hw;
    return { front, rear, bottom, top, hw, deckX, deckY, hoodX, hoodY, hoodSlope: Math.atan2(hoodY - hoodY2, 0.3), exY, exX, exXc, sideZ, open, winged: !!WINGED[M.body] || !!M.glb,
      wfx, wrx, wr: wf ? wf.r : M.rw, frontLow, frontX: P.front(frontLow + 0.05, 0) || front, highDeck: deckY > 1.15 };
  }
  // geometry helpers: a box (car space), an airfoil plate along z (the wing), a tube along x (an exhaust tip)
  function bx(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
  function foil(chord, span, thick) {   // an airfoil section extruded across the car (its chord along x, nose to +x)
    const s = new THREE.Shape(), n = 14;
    for (let i = 0; i <= n; i++) { const t = i / n, x = chord * (0.5 - t), y = thick * (0.6 * Math.sqrt(t) - 0.55 * t - 0.05 * t * t * t) * 2.2; i ? s.lineTo(x, y) : s.moveTo(x, y); }
    for (let i = n; i >= 0; i--) { const t = i / n, x = chord * (0.5 - t), y = -thick * 0.25 * Math.sin(Math.PI * t) * (1 - t); s.lineTo(x, y); }
    const g = new THREE.ExtrudeGeometry(s, { depth: span, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, -span / 2);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.6, uv.getY(i) * 0.6);
    return g;
  }
  function tipGeo(r, len, oval, ti) {   // an exhaust tip: a short tube along x with a rolled lip, dark inside
    const g = new THREE.CylinderGeometry(r, r * 0.92, len, 20, 1, true); g.rotateZ(Math.PI / 2); if (oval) g.scale(1, 0.62, 1.25);
    if (ti) { const p = g.attributes.position, c = []; for (let i = 0; i < p.count; i++) { const t = clamp((p.getX(i) + len / 2) / len, 0, 1); c.push(...(t > 0.5 ? [lerp(0.7, 0.35, (t - 0.5) * 2), lerp(0.55, 0.32, (t - 0.5) * 2), lerp(0.4, 0.85, (t - 0.5) * 2)] : [lerp(0.78, 0.7, t * 2), lerp(0.76, 0.55, t * 2), lerp(0.74, 0.4, t * 2)])); } g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); }
    return g;
  }
  function mesh(geo, mat, x, y, z, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; if (parent) parent.add(m); return m; }
  // the parts for a level of each upgrade (a group in the body: they move with it); held in cv.parts[kind]
  function partsFor(cv, kind, lv) {
    const K = cv.kit, M = cv.M, grp = new THREE.Group(), v = cv.v;
    grp.userData.lv = lv; grp.userData.kind = kind; grp.userData.items = [];
    const zoneOf = (x) => { const t = (x - K.rear) / (K.front - K.rear); return t > 0.6 ? 'front' : t < 0.33 ? 'rear' : 'side'; };   // (where on the car: the shows go round it zone by zone)
    const item = (o, from) => { grp.userData.items.push({ o, from: from || 'down', home: o.position.clone(), rot: o.rotation.clone(), zone: zoneOf(o.position.x) }); return o; };
    if (kind === 'motor') {
      if (M.ev) {   // the electric car: a blue light under its sills, brighter with each level, and a lit diffuser
        if (lv > 0) {
          const s = new THREE.Mesh(bx(K.wfx - K.wrx - 0.6, 0.035, 0.03), PM.blueGlow); for (const sd of [-1, 1]) { const m = s.clone(); m.position.set((K.wfx + K.wrx) / 2, K.bottom + 0.02, sd * (K.sideZ - 0.04)); grp.add(item(m, 'side')); }
          const pool = new THREE.Mesh(new THREE.PlaneGeometry(K.front - K.rear + 0.4, K.hw * 2 + 0.7), new THREE.MeshBasicMaterial({ map: TX.glow, color: 0x2a8cff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4 + lv * 0.2 }));
          pool.material.userData.own = true; pool.rotation.x = -Math.PI / 2; pool.position.set((K.front + K.rear) / 2, 0.016, 0); pool.renderOrder = 4; grp.add(item(pool, 'fade'));
          if (lv >= 2) { const d = new THREE.Mesh(bx(0.02, 0.025, K.hw * 1.2), PM.blueGlow); d.position.set(K.exXc - 0.01, K.exY + 0.12, 0); grp.add(item(d, 'back')); }
          grp.userData.tips = [];
        }
      } else {
        const tips = [], zs = lv === 1 ? [K.hw * 0.48] : lv === 2 ? [-K.hw * 0.52, K.hw * 0.52] : lv === 3 ? [-K.hw * 0.62, -K.hw * 0.42, K.hw * 0.42, K.hw * 0.62] : [];
        const cz = K.open ? zs.map(z => z * 0.18) : zs;
        cz.forEach((z) => {
          const r = lv === 1 ? 0.06 : lv === 2 ? 0.052 : 0.042, len = 0.22, x = (K.open ? K.exXc : K.exX) - 0.05;
          const t = new THREE.Group(); t.position.set(x, K.exY + (K.open ? 0.22 : 0), z);
          const tube = new THREE.Mesh(tipGeo(r, len, lv === 1, lv === 3), lv === 3 ? PM.ti : PM.chrome); tube.castShadow = true; t.add(tube);
          const lip = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, r * 0.12, 6, 20), lv === 3 ? PM.ti : PM.chrome); lip.rotation.y = Math.PI / 2; lip.position.x = -len / 2; if (lv === 1) lip.scale.set(1, 0.62, 1.25); t.add(lip);
          const hole = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 16), PM.hole); hole.rotation.y = -Math.PI / 2; hole.position.x = -len / 2 + 0.03; if (lv === 1) hole.scale.set(1, 0.62, 1.25); t.add(hole);
          grp.add(item(t, 'back')); tips.push(new V3(x - len / 2, t.position.y, z));
        });
        grp.userData.tips = tips;
      }
      // the bonnet: vents at level 2, a scoop at level 3 (not on the open cars)
      if (lv >= 2 && !K.open && M.body !== 'truck') {
        for (const sd of [-1, 1]) {
          const vg = new THREE.Group(), x = K.hoodX, y = (cv.probe.top(x, sd * 0.32) || K.hoodY) + 0.006;
          vg.position.set(x, y, sd * 0.32); vg.rotation.z = K.hoodSlope;
          mesh(bx(0.34, 0.012, 0.24), PM.black, 0, 0, 0, vg).castShadow = false;   // (flush on the bonnet: no shadow to speak of)
          for (let i = 0; i < 4; i++) mesh(bx(0.035, 0.022, 0.22), PM.carbonFlat, -0.12 + i * 0.08, 0.012, 0, vg).rotation.z = 0.5;
          grp.add(item(vg, 'up'));
        }
      }
      if (lv >= 3 && !K.open) {
        const x = K.hoodX - 0.12, y = (cv.probe.top(x, 0) || K.hoodY) - 0.01, sc = new THREE.Group(); sc.position.set(x, y, 0); sc.rotation.z = K.hoodSlope;
        const s = new THREE.Shape(); s.moveTo(-0.26, 0); s.lineTo(0.16, 0); s.lineTo(0.16, 0.075); s.quadraticCurveTo(-0.04, 0.085, -0.26, 0.0);
        const g = new THREE.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 }); g.translate(0, 0, -0.14);
        mesh(g, PM.carbon, 0, 0, 0, sc); mesh(bx(0.01, 0.058, 0.25), PM.hole, 0.166, 0.04, 0, sc);
        grp.add(item(sc, 'up'));
      }
    } else if (kind === 'aero') {
      const sp = K.hw * 2;
      if (lv >= 1 && !K.open) {   // a lip on the deck's edge, a lip under the front bumper
        const lip = new THREE.Mesh(foil(0.14, sp * (K.winged ? 0.7 : 0.82), 0.05), PM.carbon); lip.position.set(K.deckX - 0.05, K.deckY + 0.015, 0); lip.rotation.z = 0.18; lip.castShadow = true;
        if (!K.winged || M.body === 'p206') grp.add(item(lip, 'up'));
        const fl = new THREE.Mesh(bx(0.24 + (lv >= 2 ? 0.08 : 0), 0.018, sp * 0.84), PM.carbon); fl.position.set(K.frontX - 0.08 + (lv >= 2 ? 0.04 : 0), K.frontLow - 0.006, 0); fl.castShadow = true; grp.add(item(fl, 'front'));
      }
      if (lv >= 2 && !K.winged) {   // the rear wing: on two posts; the GT package's is bigger, higher, with end plates and a gurney
        const gt = lv >= 3, span = sp * (gt ? 0.98 : 0.86), chord = gt ? 0.36 : 0.28, hgt = (gt ? 0.4 : 0.3) * (K.highDeck ? 0.55 : 1), wy = K.deckY + hgt, wx = K.deckX + 0.02;
        const wing = new THREE.Group(); wing.position.set(wx, wy, 0);
        const w = new THREE.Mesh(foil(chord, span, 0.07), PM.carbon); w.rotation.z = gt ? -0.12 : -0.08; w.castShadow = true; wing.add(w);
        for (const sd of [-1, 1]) {
          const post = new THREE.Mesh(bx(0.09, hgt + 0.02, 0.018), PM.carbonFlat); post.position.set(gt ? -0.08 : 0.02, -hgt / 2 + (gt ? 0.03 : 0), sd * span * 0.3); post.castShadow = true; wing.add(post);
          if (gt) { const ep = new THREE.Mesh(bx(chord + 0.12, 0.2, 0.012), PM.carbon); ep.position.set(-0.03, -0.03, sd * (span / 2 + 0.006)); ep.castShadow = true; wing.add(ep);
            const gn = new THREE.Mesh(bx(0.012, 0.035, span), PM.red); gn.position.set(-chord / 2 - 0.005, 0.03, 0); wing.add(gn); }
        }
        grp.add(item(wing, 'drop'));
      }
      if (lv >= 2 && K.winged) {   // (the cars with a wing of their own: dive planes at the front corners first)
        for (const sd of [-1, 1]) for (const k of [0, 1]) { const c = new THREE.Mesh(bx(0.16, 0.012, 0.11), PM.carbon); c.position.set(K.frontX - 0.12 - k * 0.12, K.frontLow + 0.14 + k * 0.08, sd * (K.hw - 0.03)); c.rotation.z = 0.25; c.rotation.y = sd * 0.25; grp.add(item(c, 'side')); }
      }
      if (lv >= 3) {
        if (!K.winged) for (const sd of [-1, 1]) for (const k of [0, 1]) { const c = new THREE.Mesh(bx(0.16, 0.012, 0.12), PM.carbon); c.position.set(K.frontX - 0.1 - k * 0.1, K.frontLow + 0.12 + k * 0.08, sd * (K.hw - 0.04)); c.rotation.z = 0.25; c.rotation.y = sd * 0.25; c.castShadow = true; grp.add(item(c, 'side')); }
        if (M.body !== 'formula') for (const sd of [-1, 1]) { const s = new THREE.Mesh(bx(Math.max(0.5, K.wfx - K.wrx - 2 * K.wr - 0.1), 0.05, 0.06), PM.carbon); s.position.set((K.wfx + K.wrx) / 2, K.bottom + 0.0, sd * (K.sideZ + 0.01)); s.castShadow = true; grp.add(item(s, 'side')); }
        for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(bx(0.3, 0.1, 0.012), PM.carbonFlat); f.position.set(K.exXc + 0.1, K.exY - 0.03, (i - 1.5) * K.hw * 0.32); grp.add(item(f, 'back')); }
        if (K.open) { const fin = new THREE.Mesh(bx(0.9, 0.22, 0.012), PM.carbon); fin.position.set(K.rear * 0.35, K.top - 0.08, 0); fin.castShadow = true; grp.add(item(fin, 'up')); }
      }
    } else if (kind === 'zavore' && !K.open) {   // a disc and a caliper in every wheel (between the rim's dish and its spokes)
      grp.userData.discs = [];
      for (const w of cv.wheels) {
        const sd = w.sd, r = w.r, gap = Math.max(0.002, w.spk - w.dish), zc = w.z + sd * (w.dish + Math.min(0.003, gap * 0.3)), zk = w.z + sd * (w.dish + Math.min(0.007, gap * 0.62));
        const dm = PM.discM || (PM.discM = new THREE.MeshPhongMaterial({ map: TX.disc2, specular: 0x999999, shininess: 80, emissive: 0x000000 }));
        const discMat = dm.clone(); discMat.userData.own = true;
        const disc = new THREE.Mesh(new THREE.CircleGeometry(r * (0.4 + lv * 0.04), 32), discMat); disc.position.set(w.x, w.y, zc); if (sd < 0) disc.rotation.y = Math.PI;
        const cal = new THREE.Group(); cal.position.set(w.x, w.y, zk); if (sd < 0) cal.rotation.y = Math.PI;
        const a0 = Math.PI * (0.62 - lv * 0.03), a1 = Math.PI * (0.98 + lv * 0.03), r0 = r * (0.3 + lv * 0.02), r1 = r * (0.47 + lv * 0.035);
        const cg = new THREE.RingGeometry(r0, r1, 12, 1, a0, a1 - a0);
        const cm = PM.cal[lv].clone(); cm.userData.own = true;
        cal.add(new THREE.Mesh(cg, cm));
        if (lv >= 2) { const lg = new THREE.RingGeometry(r0 + (r1 - r0) * 0.35, r0 + (r1 - r0) * 0.6, 8, 1, a0 + 0.12, (a1 - a0) * 0.45); const lm = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); lm.userData.own = true; const l = new THREE.Mesh(lg, lm); l.position.z = 0.0008; cal.add(l); }
        grp.add(item(disc, 'wheel'), item(cal, 'wheel')); grp.userData.discs.push(discMat);
        if (!w.own) { /* (the rear ones stand in the body) */ }
      }
    } else if (kind === 'gume' && lv > 0) {   // a coloured band round the outer sidewall, the tyre's name on it
      const tex = TX['band' + lv] || (TX['band' + lv] = bandTex(lv));
      for (const w of cv.wheels) {
        const r = w.r, inner = M.body === 'ev' ? 0.82 : M.body === 'truck' ? 0.86 : 0.76, g = ringUV(r * inner, r * 0.965, 64), sd = w.sd;
        const m = new THREE.MeshLambertMaterial({ map: tex, transparent: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); m.userData.own = true;
        const ring = new THREE.Mesh(g, m); ring.userData.wheel = w;
        if (w.obj) { ring.position.set(0, 0, sd * (w.side + 0.0025)); if (sd < 0) ring.rotation.y = Math.PI; w.obj.add(ring); grp.userData.items.push({ o: ring, from: 'ring' }); (grp.userData.extra = grp.userData.extra || []).push(ring); continue; }
        ring.position.set(w.x, w.y, w.z + sd * (w.side + 0.0025)); if (sd < 0) ring.rotation.y = Math.PI; grp.add(item(ring, 'ring'));
      }
    }
    (kind === 'zavore' || kind === 'gume' ? v.grp : v.bodyG).add(grp); carDiet(cv, grp, true);
    return grp;
  }
  // a car's meshes on a diet (each measured in the car's space, the parts at home): no shadow from the small ones, nor from the low
  // parts (they stand in the car's own); the tiny ones out of the floor's mirror, and of the parts only the big ones low on the car stay
  // in it (the rest would be a blur there, or hidden by the body)
  const _pm = new THREE.Matrix4(), _pm2 = new THREE.Matrix4(), _pb = new THREE.Box3(), _ps = new V3();
  function carDiet(cv, o, part) {
    cv.root.updateMatrixWorld(true); _pm.copy(cv.root.matrixWorld).invert();
    o.traverse(m => {
      if (!m.isMesh) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const b = _pb.copy(m.geometry.boundingBox).applyMatrix4(_pm2.multiplyMatrices(_pm, m.matrixWorld)), d = b.getSize(_ps).length();
      m.castShadow = m.castShadow && d > 0.3 && (!part || b.min.y > 0.4);
      if (d < 0.15 || part && (d < 0.5 || b.min.y > 0.45 || b.max.y < 0.05)) mainOnly(m);
    });
  }
  function ringUV(r0, r1, n) {   // a flat ring in the xy plane, its uv round it (u: the angle, v: across)
    const P = [], U = [], I = [];
    for (let i = 0; i <= n; i++) { const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a); P.push(c * r0, s * r0, 0, c * r1, s * r1, 0); U.push(i / n * 3, 0, i / n * 3, 1); }
    for (let i = 0; i < n; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }   // (counter-clockwise: it faces +z)
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
  }
  function bandTex(lv) {   // the sidewall's lettering: SPORT (white), R-SPORT (yellow band), SLICK (red band)
    const col = ['', '#f4f4f0', '#ffcc1f', '#ff2a1f'][lv], name = ['', 'SPORT', 'R-SPORT', 'SLICK'][lv];
    const t = canvasTex(1024, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = col; g.fillRect(0, lv === 1 ? 46 : 38, w, lv === 1 ? 7 : 22);
      g.font = 'italic 900 30px Roboto, Arial, sans-serif'; g.textBaseline = 'middle'; g.fillStyle = lv === 1 ? '#f4f4f0' : '#ffffff';
      for (let k = 0; k < 2; k++) { const x0 = k * w / 2 + 40; g.fillText('APEX', x0, 22); g.fillStyle = col; g.fillText(name, x0 + 110, 22); g.fillStyle = '#ffffff'; }
    }, true);
    return t;
  }
  function dropParts(grp) { if (!grp) return; for (const o of grp.userData.extra || []) disposeTree(o); disposeTree(grp); }   // (the rings on the wheels of their own too)
  function buildParts(cv) { for (const k of ['motor', 'gume', 'zavore', 'aero']) { if (cv.parts[k]) dropParts(cv.parts[k]); cv.parts[k] = partsFor(cv, k, (cv.spec.upg || {})[k] || 0); } }
  // a part group coming on (k 0 -> 1) or going off (1 -> 0): each item from its own way (dropped from above, slid in from a side ...)
  function partsK(grp, k, zone) {
    for (const it of grp.userData.items) {
      if (zone && it.zone !== zone) continue;
      const o = it.o, e = clamp(k, 0, 1);
      if (it.from === 'ring') { o.material.opacity = e; o.scale.setScalar(0.6 + 0.4 * EZ.back(e)); o.rotation.z = (1 - e) * 2.5; continue; }
      if (it.from === 'fade') { const m = o.material; if (m.userData.op0 == null) m.userData.op0 = m.opacity; m.opacity = e * m.userData.op0; continue; }
      const h = it.home, b = EZ.back(e), u = 1 - b;
      o.visible = e > 0.001;
      if (it.from === 'drop') o.position.set(h.x, h.y + u * 1.6, h.z);
      else if (it.from === 'up') o.position.set(h.x, h.y + u * 0.5, h.z);
      else if (it.from === 'side') o.position.set(h.x, h.y, h.z + Math.sign(h.z || 1) * u * 0.7);
      else if (it.from === 'front') o.position.set(h.x + u * 0.8, h.y, h.z);
      else if (it.from === 'back') o.position.set(h.x - u * 0.6, h.y, h.z);
      else o.position.copy(h);
      o.scale.setScalar(it.from === 'wheel' ? Math.max(0.001, b) : Math.max(0.001, 0.3 + 0.7 * Math.min(1, e * 1.4)));
    }
  }

  /* ---------------- effects on a car ---------------- */
  const carPt = (cv, x, y, z) => cv.v.bodyG.localToWorld(new V3(x, y, z));
  const carDir = (cv, x, y, z) => new V3(x, y, z).transformDirection(cv.v.bodyG.matrixWorld);
  function exhaustTips(cv) {
    const t = cv.parts.motor && cv.parts.motor.userData.tips;
    if (t && t.length) return t;
    const K = cv.kit; return [new V3(K.exX - 0.02, K.exY, K.hw * 0.45)];
  }
  function puffSmoke(cv, n, dark) {   // exhaust smoke from every tip
    if (cv.M.ev) return;
    const back = carDir(cv, -1, 0, 0);
    for (const t of exhaustTips(cv)) for (let i = 0; i < n; i++) {
      const p = carPt(cv, t.x, t.y, t.z), c = dark ? [0.42, 0.44, 0.5] : [0.82, 0.83, 0.86];
      puffs.emit(p.x, p.y, p.z, back.x * (1.2 + Math.random()) + (Math.random() - 0.5) * 0.4, 0.25 + Math.random() * 0.3, back.z * (1.2 + Math.random()) + (Math.random() - 0.5) * 0.4, 1.4 + Math.random() * 1.2, 0.12, 0.9 + Math.random() * 0.5, c, dark ? 0.42 : 0.22, -0.05, 0.9, 0.05);
    }
  }
  // flames out of the tips (a pop on the overrun): a cone of fire and a glow at each, sparks
  let flames = [];
  function flame(cv, k) {
    if (cv.M.ev) return;
    const back = carDir(cv, -1, 0, 0);
    for (const t of exhaustTips(cv)) {
      const p = carPt(cv, t.x, t.y, t.z);
      for (let i = 0; i < 4 * k; i++) sparks.emit(p.x, p.y, p.z, back.x * (3 + Math.random() * 3) + (Math.random() - 0.5), (Math.random() - 0.3) * 1.2, back.z * (3 + Math.random() * 3) + (Math.random() - 0.5), 0.12 + Math.random() * 0.12, 0.06, 0.02, [1, 0.6, 0.2], 1, 2, 2);
      const m = new THREE.Mesh(FLAME_GEO(), new THREE.MeshBasicMaterial({ map: TX.flame, color: emi(0xffffff, EMI.spark), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.position.set(t.x - 0.02, t.y, t.z); m.scale.set(0.8 + k * 0.6, 1, 1); cv.v.bodyG.add(m);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow, color: 0xff8a2a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); gl.position.copy(m.position); gl.scale.setScalar(0.7 + k * 0.5); cv.v.bodyG.add(gl);
      flames.push({ m, gl, t: 0, life: 0.12 + Math.random() * 0.08 + k * 0.05 });
    }
  }
  let flameGeo = null;
  function FLAME_GEO() { if (!flameGeo) { const a = new THREE.PlaneGeometry(0.11, 0.5), b = a.clone(); b.rotateX(Math.PI / 2); const g = new THREE.BufferGeometry(); const pa = Array.from(a.attributes.position.array).concat(Array.from(b.attributes.position.array)), ua = Array.from(a.attributes.uv.array).concat(Array.from(b.attributes.uv.array)), ia = Array.from(a.index.array).concat(Array.from(b.index.array).map(i => i + 4)); g.setAttribute('position', new THREE.Float32BufferAttribute(pa, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(ua, 2)); g.setIndex(ia); g.rotateZ(Math.PI / 2); g.translate(-0.25, 0, 0); flameGeo = g; flameGeo.userData.keep = true; } return flameGeo; }
  function stepFlames(dt) { for (let i = flames.length - 1; i >= 0; i--) { const f = flames[i]; f.t += dt; const k = 1 - f.t / f.life; if (k <= 0) { f.m.parent && f.m.parent.remove(f.m); f.gl.parent && f.gl.parent.remove(f.gl); f.m.material.dispose(); f.gl.material.dispose(); flames.splice(i, 1); continue; } f.m.material.opacity = k; f.gl.material.opacity = k * 0.9; f.m.scale.y = 0.8 + Math.random() * 0.4; } }
  // glints popping over the body (a fresh polish, new paint)
  let glints = [];
  function glint(p, s, col) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.star, color: col || 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); sp.position.copy(p); sp.renderOrder = 11; scene.add(sp); glints.push({ sp, t: 0, life: 0.55 + Math.random() * 0.3, s: s || 0.35, r: Math.random() * TAU }); }
  function stepGlints(dt) { for (let i = glints.length - 1; i >= 0; i--) { const g = glints[i]; g.t += dt; const u = g.t / g.life; if (u >= 1) { scene.remove(g.sp); g.sp.material.dispose(); glints.splice(i, 1); continue; } const k = Math.sin(u * Math.PI); g.sp.material.opacity = k; g.sp.scale.setScalar(g.s * (0.3 + k)); g.sp.material.rotation = g.r + u * 0.8; } }
  function surfacePoints(cv, n) {   // points on the car's skin (seen from above and from the sides), in world space
    const K = cv.kit, out = [];
    for (let i = 0; i < n * 3 && out.length < n; i++) {
      const x = lerp(K.rear + 0.15, K.front - 0.15, Math.random());
      if (Math.random() < 0.55) { const z = (Math.random() - 0.5) * K.hw * 1.5, y = cv.probe.top(x, z); if (y != null) out.push(carPt(cv, x, y + 0.02, z)); }
      else { const sd = Math.random() < 0.5 ? -1 : 1, y = lerp(K.bottom + 0.15, K.top * 0.75, Math.random()), z = cv.probe.side(x, y, sd); if (z != null) out.push(carPt(cv, x, y, sd * (z + 0.02))); }
    }
    return out;
  }
  function sparkle(cv, n, col) { for (const p of surfacePoints(cv, n)) glint(p, 0.25 + Math.random() * 0.3, col); }

  /* ---------------- the workshop's machines: the wash / paint arch, the scanner ---------------- */
  // an arch over the car on rails: two posts and a beam with nozzles; runs along the car (x) and sprays (water, then paint)
  function makeArch(cv, col) {
    const K = cv.kit, g = new THREE.Group(), hw = K.hw + 0.5, hgt = K.top + 0.45;
    const fm = new THREE.MeshPhongMaterial({ color: col || 0xd9dde4, specular: 0xffffff, shininess: 90, envMap: env.texture || env, combine: THREE.MixOperation, reflectivity: 0.3 }); fm.userData.own = true;
    const ym = new THREE.MeshLambertMaterial({ color: 0x1e2a3a }); ym.userData.own = true;
    for (const sd of [-1, 1]) { mesh(bx(0.16, hgt, 0.16), fm, 0, hgt / 2, sd * hw, g); mesh(bx(0.5, 0.06, 0.34), ym, 0, 0.03, sd * hw, g); }
    mesh(bx(0.18, 0.18, hw * 2 + 0.16), fm, 0, hgt, 0, g);
    const lm = new THREE.MeshBasicMaterial({ color: emi(0x47c6ff, EMI.led) }); lm.userData.own = true;
    mesh(bx(0.03, 0.03, hw * 2 - 0.1), lm, 0.1, hgt - 0.1, 0, g);
    for (const sd of [-1, 1]) mesh(bx(0.03, hgt - 0.3, 0.03), lm, 0.1, hgt / 2, sd * (hw - 0.1), g);
    g.userData.noz = [];
    for (let i = 0; i < 7; i++) g.userData.noz.push({ p: new V3(0, hgt - 0.1, (i / 6 - 0.5) * (hw * 2 - 0.3)), d: new V3(0, -1, 0) });
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) g.userData.noz.push({ p: new V3(0, 0.25 + i * (hgt - 0.5) / 3, sd * (hw - 0.1)), d: new V3(0, -0.15, -sd) });
    g.userData.h = hgt;
    cv.v.grp.add(g); return g;
  }
  function spray(cv, arch, col, rate, kind) {   // the nozzles' jets: water drops and mist, or paint mist
    for (const n of arch.userData.noz) {
      if (Math.random() > rate) continue;
      const p = arch.localToWorld(n.p.clone()), d = n.d.clone().transformDirection(arch.matrixWorld);
      const s = kind === 'paint' ? 2.2 : 4.2, j = () => (Math.random() - 0.5) * 1.6;
      if (kind === 'paint') puffs.emit(p.x, p.y, p.z, d.x * s + j(), d.y * s + j() * 0.6, d.z * s + j(), 0.45 + Math.random() * 0.4, 0.06, 0.55, col, 0.45, -0.2, 2.2, 0.02);
      else {
        puffs.emit(p.x, p.y, p.z, d.x * s + j() * 0.6, d.y * s + j() * 0.4, d.z * s + j() * 0.6, 0.35 + Math.random() * 0.25, 0.03, 0.22, [0.85, 0.92, 1], 0.5, 6, 0.6, 0.03);
        if (Math.random() < 0.4) puffs.emit(p.x, p.y, p.z, d.x * 1.2 + j() * 0.5, d.y * 1.2, d.z * 1.2 + j() * 0.5, 1.0 + Math.random() * 0.6, 0.15, 0.8, [0.9, 0.95, 1], 0.12, -0.1, 1.5, 0.03);
      }
    }
  }
  // the scanner of the body shop: a sheet of light running along the car (grid lines, a bright edge)
  function makeScan(cv) {
    const K = cv.kit, h = K.top + 0.35, w = K.hw * 2 + 0.6;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uK: { value: 1 }, uC: { value: new THREE.Color(0x47c6ff) } },
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uT; uniform float uK; uniform vec3 uC; varying vec2 vU; void main(){ vec2 g = abs(fract(vU * vec2(14.0, 9.0)) - 0.5); float l = smoothstep(0.46, 0.5, max(g.x, g.y)); float e = smoothstep(0.0, 0.08, vU.y) * smoothstep(1.0, 0.92, vU.y) * smoothstep(0.0, 0.05, vU.x) * smoothstep(1.0, 0.95, vU.x); float sweep = 0.5 + 0.5 * sin(vU.y * 40.0 - uT * 8.0); gl_FragColor = vec4(uC * (0.22 + l * 1.1 + sweep * 0.12) * e * uK, 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    m.rotation.y = Math.PI / 2; m.position.y = h / 2; m.renderOrder = 7; m.material.userData.own = true; m.geometry.userData.keep = false;
    const edge = new THREE.Mesh(bx(0.025, h, w), new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); edge.position.y = h / 2; edge.material.userData.own = true;
    const g = new THREE.Group(); g.add(m, edge); g.userData.mat = m.material; cv.v.grp.add(g); return g;
  }
  // the wind tunnel: streams of smoke flowing over the car, drawn as glowing tubes with pulses running along them
  function makeStreams(cv) {
    const K = cv.kit, P = cv.probe, g = new THREE.Group(), mat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uK: { value: 0 } },
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uT; uniform float uK; varying vec2 vU; void main(){ float u = vU.x; float p = fract(u * 3.0 - uT * 0.9 + vU.y); float a = smoothstep(0.0, 0.12, p) * (1.0 - smoothstep(0.18, 0.62, p)); float e = smoothstep(0.0, 0.1, u) * (1.0 - smoothstep(0.82, 1.0, u)); gl_FragColor = vec4(vec3(0.6, 0.88, 1.0) * (0.12 + 1.6 * a) * e * uK, 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    mat.userData.own = true;
    const tube = (pts, ph) => { const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(30, pts.length * 2), 0.006, 4, false), uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setY(i, ph); const m = new THREE.Mesh(geo, mat); m.renderOrder = 7; g.add(m); };
    const x0 = K.front + 1.3, x1 = K.rear - 1.7;
    for (let i = 0; i < 7; i++) {   // over the top: each line follows the body's top 6 cm above it, smoothed, rising before the nose, falling gently behind
      const z = (i / 6 - 0.5) * K.hw * 0.9, pts = [];
      for (let x = K.front; x >= K.rear; x -= 0.06) { const y = P.top(x, z); pts.push([x, y != null ? y + 0.06 : null]); }
      for (let k = 0; k < pts.length; k++) if (pts[k][1] == null) pts[k][1] = k ? pts[k - 1][1] : K.frontLow + 0.4;
      const n = pts.length; for (let r = 0; r < 10; r++) for (let k = 1; k < n - 1; k++) pts[k][1] = Math.max(pts[k][1], (pts[k - 1][1] + 2 * pts[k][1] + pts[k + 1][1]) / 4);
      const y0 = pts[0][1], yN = pts[n - 1][1], out = [];
      for (let x = x0; x > K.front; x -= 0.15) { const t = (x0 - x) / (x0 - K.front); out.push(new V3(x, lerp(K.frontLow + 0.22, y0, EZ.sine(t)), z)); }
      for (let k = 0; k < n; k += 2) out.push(new V3(pts[k][0], pts[k][1], z));
      for (let x = K.rear - 0.15; x >= x1; x -= 0.15) { const t = (K.rear - x) / (K.rear - x1); out.push(new V3(x, yN - 0.18 * EZ.sine(t), z * (1 - 0.15 * t))); }
      tube(out, i * 0.37);
    }
    for (const sd of [-1, 1]) for (const [k, y] of [[0, K.bottom + 0.22], [1, lerp(K.bottom, K.top, 0.55)]]) {   // along the sides, bulging round the car
      const out = [];
      for (let x = x0; x >= x1; x -= 0.2) { const inside = x <= K.front && x >= K.rear, w = (P.side(clamp(x, K.rear + 0.1, K.front - 0.1), y, sd) || K.hw) + 0.1;
        out.push(new V3(x, y, sd * (inside ? Math.max(w, K.hw * 0.9 + 0.1) : lerp(K.hw * 0.75, K.hw + 0.1, x > K.front ? 1 - (x - K.front) / (x0 - K.front) : 1 - (K.rear - x) / (K.rear - x1) * 0.5)))); }
      tube(out, 0.2 + k * 0.5 + (sd > 0 ? 0.1 : 0.6));
    }
    g.userData.mat = mat; cv.v.bodyG.add(g); return g;
  }

  /* ---------------- the shows: what plays for each change ---------------- */
  function* turnTo(a, s) {
    let d = a - ttAng; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < 0.01) { ttAng = a; tt.rotation.y = a; return; }
    const a0 = ttAng; SFX.servo(s);
    yield* tween(s, (k) => { ttAng = a0 + d * k; tt.rotation.y = ttAng; }, EZ.io);
  }
  function* liftTo(h, s) { const h0 = lift; SFX.servo(s); yield* tween(s, (k) => setLift(lerp(h0, h, k)), EZ.io); }
  function* settle(cv, amp) { yield* tween(0.9, (k, u) => { cv.bounce = -amp * Math.exp(-u * 5) * Math.cos(u * 18); cv.pitch = amp * 0.4 * Math.exp(-u * 5) * Math.sin(u * 16); }); cv.bounce = 0; cv.pitch = 0; }
  function* revs(cv, n, hard) {   // the engine revved: n blips, pops and flames as the throttle shuts, the body rocking on its mounts
    for (let i = 0; i < n; i++) {
      eng.locked = true; SFX.click();
      yield* tween(0.28 + (hard ? 0.12 : 0), (k) => { eng.rev = k * (hard ? 1 : 0.75); cv.roll = -0.012 * k; cv.shake = 1 + k * 2; });
      if (i % 2 === 0 || hard) puffSmoke(cv, 3, cv.spec.cond.engine < 0.5);
      yield* tween(0.18, (k) => { eng.rev = (1 - k) * (hard ? 1 : 0.75); cv.roll = -0.012 * (1 - k); });
      if (hard || i === n - 1) { flame(cv, hard ? 1 : 0.6); if (hard) { yield* wait(0.06); flame(cv, 0.7); } }
      yield* wait(0.22);
    }
    cv.shake = 1; eng.rev = 0;
  }
  // the electric car's power: the motors whine up, the light under it pulses, blue sparks off the sills
  function* evPulse(cv, grp, n) {
    const glow = [], K = cv.kit; grp.traverse(o => { if (o.material && o.material.userData && o.material.userData.own && o.material.opacity != null) glow.push(o.material); });
    for (let i = 0; i < n; i++) {
      eng.locked = false;
      yield* tween(0.9, (k, u) => { const e = Math.sin(Math.PI * u); eng.speed = 45 * e; eng.thr = u < 0.6 ? 1 : 0; cv.roll = -0.01 * e; cv.shake = 1 + e;
        for (const m of glow) m.opacity = (m.userData.op0 || 0.5) * (1 + e * 1.5);
        if (Math.random() < e) { const p = carPt(cv, lerp(K.rear, K.front, Math.random()), K.bottom, (Math.random() < 0.5 ? -1 : 1) * K.sideZ); sparks.emit(p.x, p.y, p.z, (Math.random() - 0.5), Math.random() * 0.8, (Math.random() - 0.5), 0.3, 0.05, 0.01, [0.4, 0.75, 1], 1, 1, 1, 0.02); } });
      yield* wait(0.2);
    }
    for (const m of glow) m.opacity = m.userData.op0 || m.opacity;
    eng.speed = 0; eng.thr = 0; cv.roll = 0;
  }
  // the exhaust's smoke while the engine runs: blue-grey and heavy when it is worn (its condition under half)
  function idleSmoke(cv, dt) {
    if (!eng.on || cv !== cur || cv.M.ev) return;
    cv.smokeT = (cv.smokeT || 0) - dt; if (cv.smokeT > 0) return;
    const bad = cv.spec.cond.engine < 0.5; cv.smokeT = bad ? 0.12 : 0.5;
    puffSmoke(cv, 1, bad);
  }

  // a new car: the one on the table starts, drives out to the right; the new one comes in through the left door and stops on the table
  let swapNext = null, swapP = null;
  function swap(spec) {
    if (swapP) { swapNext = spec; return swapP; }   // (one waiting already: it drives in this car instead; quick taps through the cars play one swap)
    swapNext = spec;
    return (swapP = play(function* () {
      const spec = swapNext; swapNext = null; swapP = null;
      if (cur && cur.M === spec.M && cur.spec.color === spec.color && (cur.spec.stripe !== false) === (spec.stripe !== false)) return;
      const old = cur, nw = makeCar(spec);
      // (the new car's shaders are made now, while the old one still stands: no stutter when it rolls in)
      nw.root.position.set(-30, 0, 0); tt.add(nw.root); renderer.compile(scene, camera);
      yield* par(home(0.8), turnTo(0, 0.8), lift > 0.01 ? liftTo(0, 0.8) : null);
      if (old) {
        engStart(old.M); lamps(old, 0, 0);
        yield* tween(0.35, (k) => { lamps(old, k, k * 0.6); old.shake = k * 2; eng.rev = 0.25 * Math.sin(k * Math.PI); });
        puffSmoke(old, 4, old.spec.cond.engine < 0.5);
        yield* wait(0.25); old.shake = 1;
        yield* revs(old, 1, false);
        // away: the throttle open, the tail squats, the wheels turn; the camera turns a little after it
        eng.locked = false; eng.thr = 1; old.shake = 0.6; const acc = 6 + (old.M.kw || 250) / 120, T0 = 1.55;
        const ty0 = rig.tx;
        yield* tween(T0, (k, u) => {
          const t = u * T0, vel = acc * t, x = 0.5 * acc * t * t; old.spin += (x - old.root.position.x) / old.M.rw; old.root.position.x = x;
          old.pitch = 0.035 * Math.exp(-u * 3) * (1 - Math.exp(-u * 20)); eng.speed = vel; eng.rpm = old.M.idle + (old.M.redline - old.M.idle) * clamp(0.35 + vel / 30, 0, 0.95);
          if (Math.random() < 0.35 && u < 0.5) puffSmoke(old, 1, false);
          rig.tx = ty0 + 0.6 * EZ.sine(Math.min(1, u * 1.4));
        });
        lamps(old, 0, 0); old.root.visible = false;
      }
      engStop();
      // in: from the left door, braking hard onto the table, the nose diving, the brake lamps on
      cur = nw; engStart(nw.M); eng.locked = false; lamps(nw, 1, 0.5);
      const D = 15, T = 2.0, tx0 = rig.tx;
      yield* tween(T, (k, u) => {
        const e = 1 - Math.pow(1 - u, 2.2), x = -D * (1 - e);
        const vel = 2.2 * D / T * Math.pow(1 - u, 1.2);
        const dx = x - nw.root.position.x; nw.root.position.x = x; nw.spin += dx / nw.M.rw;
        eng.speed = vel; eng.thr = u < 0.25 ? 0.4 : 0; eng.rpm = nw.M.idle + (nw.M.redline - nw.M.idle) * clamp(vel / 30, 0.05, 0.8);
        nw.pitch = u > 0.45 ? -0.03 * Math.sin((u - 0.45) / 0.55 * Math.PI) : 0;
        lamps(nw, 1, u > 0.4 ? 1 : 0.5);
        rig.tx = lerp(tx0, HOME.tx, EZ.io(u)) - 0.5 * Math.sin(u * Math.PI) * (1 - u);
      });
      nw.root.position.x = 0; hud('arrived', nw.spec);
      yield* settle(nw, 0.025);
      eng.locked = true; eng.speed = 0; eng.rev = 0;
      yield* revs(nw, 1, false);
      lamps(nw, 1, 0.4); yield* wait(0.5);
      yield* tween(0.4, (k) => { lamps(nw, 1 - k, 0.4 * (1 - k)); nw.shake = 1 - k; });
      engStop(); nw.shake = 0;
      if (old) freeCar(old);
      rig.tx = HOME.tx;
    }));
  }

  // an upgrade fitted (or taken off): the car turns to show the place, the old parts go, the new ones come, then it shows what they do
  const WHEEL_VIEW = (cv) => { const w = cv.wheels.find(q => q.front && q.sd > 0) || cv.wheels[0]; return { at: [w.x - 0.35, w.y + 0.12, w.z + 0.15], yaw: 0.55, pitch: 0.08, dist: 4.3, fov: 32 }; };
  function upgrade(kind, lv) {
    return play(function* () {
      const cv = cur; if (!cv) return;
      const from = cv.spec.upg[kind] || 0; if (from === lv) return;
      const up = lv > from, old = cv.parts[kind], nw = partsFor(cv, kind, lv); partsK(nw, 0); cv.spec.upg[kind] = lv;
      const K = cv.kit;
      if (kind === 'motor') {   // the exhaust (or the electric car's light under it), then the bonnet; the engine revved: flames, the power
        let running = false;
        const start = function* () { if (running) return; running = true; engStart(cv.M); lamps(cv, 1, 0.5); yield* tween(0.3, (k) => { cv.shake = k * 2; }); };
        for (const zone of ['rear', 'side', 'front']) {
          if (!hasZone(old, zone) && !hasZone(nw, zone)) continue;
          yield* goZone(cv, kind, zone);
          if (old) yield* partsOut(cv, old, kind, zone);
          if (up && hasZone(nw, zone)) yield* weld(cv, nw, zone);
          yield* partsIn(cv, nw, kind, 0.7, zone);
          if (zone === 'rear' || (zone === 'side' && cv.M.ev)) {
            hud('power', { kind, lv, from });
            yield* start();
            if (cv.M.ev) yield* evPulse(cv, nw, up ? 2 : 1);
            else { yield* revs(cv, up ? 2 : 1, up && lv >= 2); if (up && lv === 3) yield* revs(cv, 1, true); }
          } else if (zone === 'front') { yield* start(); if (!cv.M.ev) yield* revs(cv, 1, false); }
        }
        if (!running) { hud('power', { kind, lv, from }); yield* goZone(cv, kind, 'rear'); yield* start(); if (cv.M.ev) yield* evPulse(cv, nw, 1); else yield* revs(cv, 1, false); }
        yield* wait(0.3); lamps(cv, 0, 0); engStop(); cv.shake = 0;
      } else if (kind === 'gume' || kind === 'zavore') {
        const ang = 0.1;
        yield* par(turnTo(ang, 1.0), camTo(view(WHEEL_VIEW(cv), ang, lift), 1.2));
        // up on the air jacks, the wheels free
        SFX.hiss(0.5, 1.2);
        yield* tween(0.45, (k) => { cv.v.grp.position.y = 0.09 * EZ.back(k); });
        let sp = 0;
        const spinT = function* (s, v) { yield* tween(s, (k) => { sp = v * Math.sin(Math.PI * Math.min(1, k * 1.3)); }); };
        const spinner = { done: false };
        spawn((function* () { while (!spinner.done) { const dt = yield; cv.spin += sp * dt; } })());
        if (old) { SFX.wrench(); yield* par(spinT(0.6, 18), partsOut(cv, old, kind)); }
        SFX.wrench(); yield* wait(0.12); SFX.wrench();
        yield* par(spinT(0.9, 22), partsIn(cv, nw, kind, 0.8));
        if (kind === 'zavore') {   // the brake test: the discs glow hot, sparks off the pads
          yield* spinT(0.2, 30);
          sp = 40; SFX.ping(320);
          yield* tween(1.3, (k, u) => {
            sp = 40 * (1 - EZ.out(u)); const heat = Math.sin(Math.PI * Math.min(1, u * 1.2));
            for (const m of nw.userData.discs || []) m.emissive.setRGB(1.0 * heat, 0.32 * heat * heat, 0.05 * heat * heat * heat);
            if (u < 0.75 && Math.random() < 0.7) for (const w of cv.wheels) { const p = cv.v.grp.localToWorld(new V3(w.x - w.r * 0.4, w.y + w.r * 0.25, w.outer + w.sd * 0.02)); sparks.emit(p.x, p.y, p.z, -1.5 - Math.random() * 2, Math.random() * 1.5, w.sd * Math.random(), 0.25 + Math.random() * 0.2, 0.05, 0.015, [1, 0.6, 0.18], 1, 6, 1.5, 0.02); }
            if (u < 0.6 && Math.random() < 0.2) SFX.spark();
          });
          for (const m of nw.userData.discs || []) m.emissive.setRGB(0, 0, 0);
        } else {
          yield* spinT(0.8, 26);
          sparkle(cv, 6);
        }
        spinner.done = true;
        SFX.hiss(0.4, 0.8);
        yield* tween(0.35, (k) => { cv.v.grp.position.y = 0.09 * (1 - EZ.in(k)); });
        cv.v.grp.position.y = 0; SFX.clunk(0.8); yield* settle(cv, 0.02);
      } else if (kind === 'aero') {   // the back (the wing, the lip, the diffuser), the front (splitter, dive planes), the sides (skirts); then the wind tunnel
        for (const zone of ['rear', 'front', 'side']) {
          if (!hasZone(old, zone) && !hasZone(nw, zone)) continue;
          yield* goZone(cv, kind, zone);
          if (old) yield* partsOut(cv, old, kind, zone);
          yield* partsIn(cv, nw, kind, zone === 'rear' ? 1.0 : 0.7, zone);
          yield* wait(0.25);
        }
        if (up) {   // the wind tunnel: the flow over the new parts, the car pressed down a little
          yield* goZone(cv, kind, 'tunnel', 1.0);
          const st = makeStreams(cv), mat = st.userData.mat;
          SFX.whoosh(1.4); sLoop('wind', 'bandpass', 700, 0.5, 0.18);
          yield* tween(2.6, (k, u) => { mat.uniforms.uK.value = Math.min(1, u * 4) * Math.min(1, (1 - u) * 4); mat.uniforms.uT.value = time; cv.bounce = -0.022 * smooth(0.1, 0.4, u) * (1 - smooth(0.85, 1, u)) * lv / 3; });
          sLoop('wind', 'bandpass', 700, 0.5, 0); disposeTree(st); cv.bounce = 0;
        }
      }
      if (old) dropParts(old);
      cv.parts[kind] = nw;
      hud('done', { kind, lv });
      yield* par(turnTo(0, 1.0), home(1.2));
    });
  }
  const hasZone = (grp, z) => !!grp && grp.userData.items.some(it => !z || it.zone === z);
  function zoneBox(grp, zone) { const b = new THREE.Box3(); for (const it of grp.userData.items) if (!zone || it.zone === zone) b.expandByObject(it.o); return b; }
  function* partsOut(cv, grp, kind, zone) {
    if (!hasZone(grp, zone)) return;
    SFX.whoosh(0.6);
    yield* tween(0.45, (k) => partsK(grp, 1 - k, zone), EZ.in);
    if (!zone) grp.visible = false;
  }
  function* partsIn(cv, grp, kind, s, zone) {
    if (!hasZone(grp, zone)) return;
    let clunked = false;
    yield* tween(s || 0.8, (k) => { partsK(grp, k, zone); if (k > 0.72 && !clunked) { clunked = true; SFX.clunk(0.9); } }, (t) => t);
    partsK(grp, 1, zone);
    const box = zoneBox(grp, zone); if (!box.isEmpty()) { const c = box.getCenter(new V3()), sz = box.getSize(new V3()); for (let i = 0; i < 5; i++) glint(c.clone().add(new V3((Math.random() - 0.5) * sz.x, (Math.random() - 0.3) * sz.y, (Math.random() - 0.5) * sz.z)), 0.3, 0xffffff); SFX.ping(2093); }
  }
  // where the car turns and the camera goes to show a zone of the car (the turntable's angle; the camera round a point of the car)
  function zoneView(cv, kind, zone) {
    const K = cv.kit, mid = (K.top + K.bottom) / 2;
    const V = {
      'motor.rear': [1.75, { at: [K.exX + 0.15, K.exY + 0.16, 0], pitch: 0.12, dist: 4.1 }],
      'motor.side': [0.55, { at: [0, K.bottom + 0.2, 0], pitch: 0.1, dist: 7.8 }],
      'motor.front': [-0.45, { at: [K.hoodX, K.hoodY, 0], pitch: 0.48, dist: 4.9 }],
      'aero.rear': [1.6, { at: [K.rear + 0.55, (K.deckY + K.bottom) / 2 + 0.25, 0], pitch: 0.3, dist: 5.6 }],
      'aero.front': [-0.45, { at: [K.front - 0.5, K.frontLow + 0.22, 0], pitch: 0.2, dist: 4.7 }],
      'aero.side': [0.55, { at: [0, K.bottom + 0.3, 0], pitch: 0.12, dist: 6.8 }],
      'aero.tunnel': [0.55, { at: [0, mid + 0.1, 0], pitch: 0.2, dist: 8.2 }],
    }[kind + '.' + zone];
    return { ang: V[0], cam: view(Object.assign({ yaw: HOME.yaw, fov: 33 }, V[1]), V[0], lift) };
  }
  function* goZone(cv, kind, zone, s) { const z = zoneView(cv, kind, zone); yield* par(turnTo(z.ang, s || 1.1), camTo(z.cam, (s || 1.1) + 0.1)); }
  function* weld(cv, grp, zone) {   // a welder's flicker and sparks where the new parts go
    partsK(grp, 1, zone); const box = zoneBox(grp, zone); partsK(grp, 0, zone); if (box.isEmpty()) return;
    const c = box.getCenter(new V3()), sz = box.getSize(new V3());
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow, color: 0xbfe2ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); fl.scale.setScalar(0.9); scene.add(fl);
    yield* tween(0.8, (k, u) => {
      const p = c.clone().add(new V3((Math.random() - 0.5) * sz.x, (Math.random() - 0.5) * sz.y * 0.5, (Math.random() - 0.5) * sz.z));
      fl.position.copy(p); fl.material.opacity = Math.random() < 0.6 ? 0.9 : 0.2; fl.scale.setScalar(0.5 + Math.random() * 0.7);
      for (let i = 0; i < 3; i++) sparks.emit(p.x, p.y, p.z, (Math.random() - 0.5) * 3, Math.random() * 2.5, (Math.random() - 0.5) * 3, 0.3 + Math.random() * 0.4, 0.04, 0.012, [1, 0.75, 0.35], 1, 9, 0.5, 0.02);
      if (Math.random() < 0.3) SFX.spark();
    });
    scene.remove(fl); fl.material.dispose();
  }

  // the service: wash (clean), body (scratches), engine (on the lift); all three in a row for a full service
  function service(items, cond) {
    return play(function* () {
      const cv = cur; if (!cv) return;
      const K = cv.kit;
      for (const it of items) {
        if (it === 'clean') {
          const ang = 0.55;
          yield* par(turnTo(ang, 0.9), camTo(view({ at: [0, 0.75, 0], yaw: HOME.yaw, pitch: 0.2, dist: 7.0 }, ang, lift), 1.1));
          const arch = makeArch(cv, 0xd9dde4); arch.position.x = K.front + 0.9; arch.scale.y = 0.01;
          SFX.servo(0.6); yield* tween(0.6, (k) => { arch.scale.y = EZ.back(k); });
          sLoop('water', 'bandpass', 2200, 0.4, 0.22);
          const d0 = cv.v.dirtU ? cv.v.dirtU.value : 0, x0 = K.front + 0.9, x1 = K.rear - 0.9;
          yield* tween(3.2, (k, u) => { arch.position.x = lerp(x0, x1, EZ.sine(u)); spray(cv, arch, null, 0.8, 'water'); if (cv.v.dirtU) cv.v.dirtU.value = d0 * (1 - smooth(0.05, 0.95, u)); });
          sLoop('water', 'bandpass', 2200, 0.4, 0);
          yield* tween(0.5, (k) => { arch.scale.y = 1 - EZ.in(k); });
          disposeTree(arch);
          setCond(cv, { clean: cond.clean }); sparkle(cv, 14); SFX.ping(2349); yield* wait(0.7);
          hud('done', { kind: 'clean' });
        } else if (it === 'body') {
          const ang = 0.55;
          yield* par(turnTo(ang, 0.9), camTo(view({ at: [0, 0.7, 0], yaw: HOME.yaw + 0.1, pitch: 0.22, dist: 6.6 }, ang, lift), 1.1));
          const sc = makeScan(cv), x0 = K.front + 0.4, x1 = K.rear - 0.4, s0 = cv.v.scrU ? cv.v.scrU.value : 0;
          SFX.whoosh(0.5);
          yield* tween(1.6, (k, u) => { sc.position.x = lerp(x0, x1, u); sc.userData.mat.uniforms.uT.value = time; if (Math.random() < 0.3) sparkle(cv, 1, 0x9fe0ff); });   // (scan: the damage found)
          sLoop('polish', 'bandpass', 1300, 1.2, 0.08);
          yield* tween(1.6, (k, u) => { sc.position.x = lerp(x1, x0, u); sc.userData.mat.uniforms.uT.value = time; if (cv.v.scrU) cv.v.scrU.value = s0 * (1 - u); if (Math.random() < 0.5) sparkle(cv, 1); });
          sLoop('polish', 'bandpass', 1300, 1.2, 0);
          yield* tween(0.3, (k) => { sc.userData.mat.uniforms.uK.value = 1 - k; sc.children[1].material.opacity = 1 - k; });
          disposeTree(sc); setCond(cv, { body: cond.body }); sparkle(cv, 12); SFX.ping(2637); yield* wait(0.6);
          hud('done', { kind: 'body' });
        } else if (it === 'engine') {
          const ang = 0.55 + 0.5;
          yield* par(turnTo(ang, 0.9), camTo(view({ at: [0, 0.45, 0], yaw: HOME.yaw, pitch: 0.0, dist: 7.8 }, ang, 0.75), 1.3), liftTo(0.75, 1.3));
          // the old engine first: it smokes and runs rough if worn
          engStart(cv.M);
          if (cv.spec.cond.engine < 0.5) { for (let i = 0; i < 10; i++) { puffSmoke(cv, 1, true); cv.shake = 2.5; yield* wait(0.12); } }
          else yield* wait(0.6);
          engStop(); cv.shake = 0;
          // the work under it: sparks, the wrench, drips of old oil
          for (let i = 0; i < 6; i++) {
            SFX.wrench();
            const p = carPt(cv, lerp(K.rear + 0.6, K.front - 0.6, Math.random()), K.bottom - 0.02, (Math.random() - 0.5) * K.hw);
            for (let j = 0; j < 14; j++) sparks.emit(p.x, p.y, p.z, (Math.random() - 0.5) * 3, -Math.random() * 1.5, (Math.random() - 0.5) * 3, 0.4 + Math.random() * 0.4, 0.045, 0.015, [1, 0.72, 0.3], 1, 9, 0.4, 0.0);
            for (let j = 0; j < 3; j++) puffs.emit(p.x, p.y, p.z, 0, -0.5, 0, 0.9, 0.04, 0.03, [0.12, 0.09, 0.05], 0.9, 6, 0, -0.9);
            yield* wait(0.32);
          }
          setCond(cv, { engine: cond.engine });
          yield* par(liftTo(0, 1.2), camTo(view({ at: [0, 0.6, 0], yaw: HOME.yaw, pitch: 0.12, dist: 6.4 }, ang, 0), 1.2));
          SFX.clunk(0.7);
          engStart(cv.M); lamps(cv, 1, 0.4); cv.shake = 1;
          yield* wait(0.3); yield* revs(cv, 2, false); yield* wait(0.4); lamps(cv, 0, 0); engStop(); cv.shake = 0;
          hud('done', { kind: 'engine' });
        }
      }
      yield* par(turnTo(0, 1.0), home(1.2));
    });
  }

  // a new colour (and the stripes on or off): the paint arch runs along the car; behind it the car is the new colour (the new car's
  // body over the old one's, each cut at the arch: three.js clipping planes), a mist of the paint at the nozzles; then it dries
  function paint(color, stripe) {
    return play(function* () {
      const cv = cur; if (!cv) return;
      if (cv.spec.color === color && (cv.spec.stripe !== false) === (stripe !== false)) return;
      const K = cv.kit, ang = 0.55;
      yield* par(turnTo(ang, 0.9), camTo(view({ at: [0, 0.7, 0], yaw: HOME.yaw, pitch: 0.16, dist: 6.9 }, ang, lift), 1.1));
      const col = hexRgb(color), x0 = K.front + 0.25, x1 = K.rear - 0.25, fwd = new V3(), o = new V3();
      const spec = Object.assign({}, cv.spec, { color, stripe, cond: Object.assign({}, cv.spec.cond, { clean: 1, body: 1 }) });
      const nw = makeCar(spec);
      // the new body only (its wheels, shadow and parts stay the old car's), cut the other way
      nw.v.grp.traverse(o => { if (o.isMesh && !isIn(o, nw.v.bodyG)) o.visible = false; });
      for (const k in nw.parts) nw.parts[k].visible = false; nw.contact.visible = false;
      cv.root.add(nw.root); nw.root.position.set(0, 0, 0);
      const cut = (x) => { cv.v.grp.updateMatrixWorld(true); o.setFromMatrixPosition(cv.v.grp.matrixWorld); fwd.set(1, 0, 0).transformDirection(cv.v.grp.matrixWorld); const c = fwd.dot(o) + x; cv.clip.set(fwd.clone().negate(), c); nw.clip.set(fwd.clone(), -c); };
      cut(x0);
      const arch = makeArch(cv, 0xf2c230); arch.position.x = K.front + 0.9; arch.scale.y = 0.01;
      SFX.servo(0.6); yield* tween(0.6, (k) => { arch.scale.y = EZ.back(k); });
      sLoop('paint', 'bandpass', 3800, 0.6, 0.16);

      yield* tween(3.4, (k, u) => {
        const s = lerp(x0, x1, EZ.sine(u)); arch.position.x = s - 0.02; cut(s);
        spray(cv, arch, col, 0.9, 'paint');
      });
      sLoop('paint', 'bandpass', 3800, 0.6, 0);
      yield* tween(0.5, (k) => { arch.scale.y = 1 - EZ.in(k); });
      disposeTree(arch);
      // the swap: the new car takes the old one's place (its own wheels, its parts moved over)
      cv.root.remove(nw.root); nw.v.grp.traverse(o => { if (o.isMesh) o.visible = true; }); nw.contact.visible = true;
      if (!spec.num) { nw.v.dec.visible = false; nw.v.bodyG.traverse(o2 => { if (o2.isMesh && o2.material === nw.v.dec.material) o2.visible = false; }); }
      nw.clip.set(new V3(-1, 0, 0), 1e4);
      for (const k in nw.parts) nw.parts[k].visible = true;
      tt.add(nw.root); nw.root.position.copy(cv.root.position); cur = nw; tt.remove(cv.root);
      freeCar(cv);
      // drying under the lamps: a warm glow sweeping, glints on the fresh paint
      const warm = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow, color: 0xff9a3a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); warm.scale.set(7, 3, 1); scene.add(warm);
      yield* tween(1.2, (k, u) => { warm.material.opacity = 0.35 * Math.sin(u * Math.PI); warm.position.copy(carPt(nw, lerp(K.front, K.rear, u), K.top * 0.6, 0)); if (Math.random() < 0.5) sparkle(nw, 1); });
      scene.remove(warm); warm.material.dispose();
      sparkle(nw, 16); SFX.ping(2093); SFX.ping(2793);
      hud('done', { kind: 'paint' });
      yield* wait(0.6);
      yield* par(turnTo(0, 1.0), home(1.2));
    });
  }
  const isIn = (o, p) => { for (let q = o; q; q = q.parent) if (q === p) return true; return false; };

  /* ---------------- the picture's last pass: the room drawn into a target of its own (HDR: half-float, 4x MSAA), its bright parts
     bloomed at a quarter size, one composite to the screen: exposure, a soft shoulder over the highlights, a gentle S, cool shade and
     warm light, a vignette, a still dither (?gfx=low or _dbg.post.on = false: drawn straight to the canvas, as before) ---------------- */
  const POST = { on: true, rt: null, expo: 1.08 };
  const STATS = { shadow: 0, refl: 0, main: 0, post: 0, tris: 0 };   // (the last frame's draws by pass: _dbg.stats)
  let shT = 0;   // (the shadow pass's triangles, taken off the main pass's)
  // a pass over a whole target: one quad, its own scene and camera (the mirror's gap, the bloom, the composite)
  const FS = { vs: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', q: null };
  function fsMat(u, fs) { return new THREE.ShaderMaterial({ uniforms: u, vertexShader: FS.vs, fragmentShader: fs, depthTest: false, depthWrite: false }); }
  function fsPass(m, to) {
    if (!FS.q) { FS.q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m); FS.q.frustumCulled = false; FS.s = new THREE.Scene(); FS.s.add(FS.q); FS.c = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); }
    FS.q.material = m; renderer.setRenderTarget(to); renderer.render(FS.s, FS.c);
  }
  function buildPost() {
    if (!POST.on) return;
    const o = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: HDR ? THREE.HalfFloatType : THREE.UnsignedByteType, stencilBuffer: false };
    const rt = POST.rt = HDR ? new THREE.WebGLMultisampleRenderTarget(2, 2, o) : new THREE.WebGLRenderTarget(2, 2, o); rt.texture.generateMipmaps = false;
    // (a depth texture: 24-bit depth in the target, so the decals on the walls do not flicker)
    if (renderer.capabilities.isWebGL2 || renderer.extensions.has('WEBGL_depth_texture')) { rt.depthTexture = new THREE.DepthTexture(2, 2); rt.depthTexture.type = THREE.UnsignedIntType; }
    const bo = Object.assign({}, o, { depthBuffer: false }), bA = POST.bA = new THREE.WebGLRenderTarget(2, 2, bo), bB = POST.bB = new THREE.WebGLRenderTarget(2, 2, bo);
    bA.texture.generateMipmaps = bB.texture.generateMipmaps = false;
    const px = POST.px = new THREE.Vector2(), bpx = POST.bpx = new THREE.Vector2();
    // the bright parts: four bilinear taps (a 4 x 4 block), kept by how far over white they are (HDR: the luminous things, not the
    // paint's highlights; LDR: what is near white)
    POST.bright = fsMat({ tD: { value: rt.texture }, uPx: { value: px } }, 'uniform sampler2D tD; uniform vec2 uPx; varying vec2 vUv;'
      + ' vec3 bp(vec2 o){ vec3 c = texture2D(tD, vUv + o * uPx).rgb; return c * smoothstep(' + (HDR ? '1.2, 2.4' : '0.72, 1.0') + ', max(c.r, max(c.g, c.b))); }'
      + ' void main(){ gl_FragColor = vec4((bp(vec2(-1.0)) + bp(vec2(1.0, -1.0)) + bp(vec2(-1.0, 1.0)) + bp(vec2(1.0))) * 0.25, 1.0); }');
    // the blur: a 9-tap gaussian in 5 bilinear fetches, across and down, then again 2.4 times wider (bA -> bB -> bA -> bB -> bA)
    POST.blur = [[1, 0], [0, 1], [2.4, 0], [0, 2.4]].map(([x, y], i) => fsMat({ tD: { value: (i % 2 ? bB : bA).texture }, uDir: { value: new THREE.Vector2(x, y) }, uPx: { value: bpx } },
      'uniform sampler2D tD; uniform vec2 uDir; uniform vec2 uPx; varying vec2 vUv; void main(){ vec2 d = uDir * uPx;'
      + ' gl_FragColor = vec4(texture2D(tD, vUv).rgb * 0.227 + (texture2D(tD, vUv + d * 1.385).rgb + texture2D(tD, vUv - d * 1.385).rgb) * 0.316 + (texture2D(tD, vUv + d * 3.231).rgb + texture2D(tD, vUv - d * 3.231).rgb) * 0.07, 1.0); }'));
    POST.comp = fsMat({ tD: { value: rt.texture }, tB: { value: bA.texture }, uExpo: { value: POST.expo }, uBloom: { value: 0.5 }, uPx: { value: px } }, [
      'uniform sampler2D tD; uniform sampler2D tB; uniform float uExpo; uniform float uBloom; uniform vec2 uPx; varying vec2 vUv;',
      'float lum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }',
      'const float K = 0.72; vec3 sh(vec3 x){ return mix(x, K + (1.0 - K) * (1.0 - exp((K - x) / (1.0 - K))), step(K, x)); }',   // (a soft shoulder over 0.72; under it nothing changes)
      'void main(){ vec3 c = texture2D(tD, vUv).rgb;',
      HDR ? '' : [   // (no MSAA: the edges softened along themselves where the light changes sharply)
        '  float lC = lum(c), lN = lum(texture2D(tD, vUv + vec2(0.0, uPx.y)).rgb), lS = lum(texture2D(tD, vUv - vec2(0.0, uPx.y)).rgb), lE = lum(texture2D(tD, vUv + vec2(uPx.x, 0.0)).rgb), lW = lum(texture2D(tD, vUv - vec2(uPx.x, 0.0)).rgb);',
        '  if (max(max(lN, lS), max(max(lE, lW), lC)) - min(min(lN, lS), min(min(lE, lW), lC)) > 0.08) { vec2 d = vec2(lS - lN, lE - lW); d = d / (length(d) + 1e-4) * uPx * 0.9; c = mix(c, 0.5 * (texture2D(tD, vUv + d).rgb + texture2D(tD, vUv - d).rgb), 0.55); }'].join('\n'),
      '  c = c * uExpo + texture2D(tB, vUv).rgb * uBloom;',
      '  float l = lum(c); c = mix(c, vec3(l), smoothstep(1.0, 4.0, l) * 0.6);',   // (hot light goes white)
      // (the shoulder on the brightest channel keeps the hue (the cyan stays cyan); some of it per channel: a very bright colour pales a little)
      '  float m = max(max(c.r, c.g), max(c.b, 1e-4)); c = mix(c * sh(vec3(m)).x / m, sh(c), 0.6);',
      '  c = mix(c, c * c * (3.0 - 2.0 * c), 0.2);',   // (a gentle S: deeper darks)
      // (cool shade, warm light, but only on the greys: the colours keep their hue, the whites stay white)
      '  float s = (max(max(c.r, c.g), max(c.b, 1e-4)) - min(min(c.r, c.g), c.b)) / max(max(c.r, c.g), max(c.b, 1e-4));',
      '  c *= 1.0 + (mix(vec3(0.98, 1.0, 1.03), vec3(1.02, 1.0, 0.98), smoothstep(0.15, 0.6, l)) - 1.0) * (1.0 - s) * (1.0 - smoothstep(0.7, 0.95, l));',
      '  vec2 q = vUv - 0.5; c *= 1.0 - 0.44 * dot(q, q);',   // (the vignette)
      '  c += (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;',   // (a still dither: no bands in the dark gradients)
      '  gl_FragColor = vec4(c, 1.0); }'].join('\n'));
  }
  // the targets at the drawing buffer's size (the bloom's at a quarter); a bigger buffer (a phone held sideways) gets 2 samples, not 4:
  // the targets stay under ~40 MB
  const _sz = new THREE.Vector2();
  function sizePost() {
    if (!POST.rt) return;
    const s = renderer.getDrawingBufferSize(_sz), w = s.x, h = s.y, bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2);
    if (POST.rt.isWebGLMultisampleRenderTarget) POST.rt.samples = w * h > 0.6e6 ? 2 : Math.min(4, renderer.capabilities.maxSamples);
    POST.rt.setSize(w, h); POST.bA.setSize(bw, bh); POST.bB.setSize(bw, bh); POST.px.set(1 / w, 1 / h); POST.bpx.set(1 / bw, 1 / bh);
  }
  function postPass() {
    fsPass(POST.bright, POST.bA);
    POST.blur.forEach((m, i) => fsPass(m, i % 2 ? POST.bA : POST.bB));
    fsPass(POST.comp, null);
  }
  // the eye's adaptation: looking into a bright doorway the picture darkens a little, away from it it opens up again (no read-back:
  // how squarely the camera faces a door, how near it is)
  const _fw = new V3();
  function adaptExposure(dt) {
    if (!POST.comp) return;
    const c = camera.position; camera.getWorldDirection(_fw); const fl = Math.hypot(_fw.x, _fw.z) || 1;
    let vis = 0;
    for (const x of [ROOM.x0, ROOM.x1]) { const dx = x - c.x, dz = -c.z, d = Math.hypot(dx, dz) || 1;
      vis += smooth(0.9, 0.98, (_fw.x * dx + _fw.z * dz) / (fl * d)) * smooth(30, 10, Math.hypot(dx, 1.9 - c.y, dz)); }
    POST.expo += (1.08 - 0.16 * Math.min(1, vis) - POST.expo) * (1 - Math.exp(-dt * 2.5));
    POST.comp.uniforms.uExpo.value = POST.expo;
  }

  /* ---------------- set-up, size, the frame ---------------- */
  function init(canvas) {
    // the post pass (unless ?gfx=low), HDR where half-float targets can be drawn to: the luminous things over 1, the daylight brighter
    POST.on = !(typeof location !== 'undefined' && /[?&]gfx=low\b/.test(location.search));
    // (with it the room is drawn into a target with MSAA of its own and the canvas gets one quad: its context made here without MSAA,
    // Render.init's renderer takes it as it is)
    if (POST.on) { const a = { antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }; canvas.getContext('webgl2', a) || canvas.getContext('webgl', a); }
    renderer = Render.init(canvas);
    HDR = POST.on && renderer.capabilities.isWebGL2 && renderer.extensions.has('EXT_color_buffer_float');
    if (HDR) Object.assign(EMI, { hex: 3.0, led: 1.6, sign: 1.3, screen: 1.2, tail: 2.5, spark: 2.0 });
    OUTK = HDR ? 1.45 : 1.12; makeRoomLight();
    if (POST.on) Object.assign(GLOW, { sign: 0.06, ring: 0.73, lamp: 0.6, blur: 8 });
    renderer.info.autoReset = false;   // (frame() counts the passes itself: _dbg.stats; the page's test reads the main pass and the post pass)
    { const sm = renderer.shadowMap, r0 = sm.render;   // (the shadow map is drawn inside the main pass's render: its draws counted apart)
      sm.render = function (...a) { const ri = renderer.info.render, c = ri.calls, t = ri.triangles; r0.apply(this, a); STATS.shadow += ri.calls - c; shT += ri.triangles - t; }; }
    renderer.localClippingEnabled = true;
    renderer.setClearColor(0x0d1420, 1);
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;   // (drawn only when something moves: frame())
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x0d1420);
    camera = new THREE.PerspectiveCamera(HOME.fov, 1.6, 0.25, 700); camera.layers.enable(NOREFL);
    makeTextures(); makeLightTextures();
    buildLights(); buildFloor(); buildRoom(); buildTurntable(); buildDecor(); buildOutside(); buildPost();
    // the room in the cars' paint and glass: a cube map of it, made once from where a car's middle is (HDR: half-float, the lamps
    // just over 1 in it while it is made: brighter, the paint's highlights would glow and the glass go white; the cube's depth is 16-bit:
    // near 0.5)
    cubeRT = new THREE.WebGLCubeRenderTarget(192, { format: THREE.RGBAFormat, type: HDR ? THREE.HalfFloatType : THREE.UnsignedByteType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    const cc = new THREE.CubeCamera(0.5, 600, cubeRT); cc.position.set(0, 0.9, 0); scene.add(cc);
    const rk = REF.k.value, lc = lampMat.color.clone(); REF.k.value = 0; lampMat.color.multiplyScalar(Math.min(1, 1.3 / EMI.hex)); ttTop.visible = true; renderer.shadowMap.needsUpdate = true;
    cc.update(renderer, scene); REF.k.value = rk; lampMat.color.copy(lc); scene.remove(cc);
    env = cubeRT.texture;
    for (const m of decorEnv) { m.envMap = env; m.needsUpdate = true; }
    makePartMats();
    puffs = new Puffs(1400, false); sparks = new Puffs(900, true); scene.add(puffs.pts, sparks.pts);
    Render.garageLight(KEY_DIR, 0xfff2e0, 0.7, 0xffffff);
    bindInput(canvas);
    ready = true;
  }
  function resize(w, h, pr) {
    W = Math.max(2, w); H = Math.max(2, h);
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    const rw = Math.max(2, Math.round(W * pr * REF.size)), rh = Math.max(2, Math.round(H * pr * REF.size));
    REF.rt.setSize(rw, rh); if (REF.gt) REF.gt.setSize(rw, rh); REF.texel.set(1 / rw, 1 / rh);
    const sc = H * pr / (2 * Math.tan(HOME.fov * Math.PI / 360));
    puffs.mat.uniforms.uScale.value = sparks.mat.uniforms.uScale.value = motes.material.uniforms.uScale.value = sc;
    sizePost(); shadowDirty = 2;
  }
  // the car shown first: no drive-in, it stands there
  function show(spec) {
    if (cur) freeCar(cur);
    cur = makeCar(spec); tt.add(cur.root); shadowDirty = 2;
    renderer.compile(scene, camera);   // (the shaders of what is hidden for now too: the lamps' glows, the sparks; no stutter when they show)
  }
  function frame(dt, noDraw) {
    if (!ready) return;
    dt = Math.min(dt, 0.05); time += dt;
    runTasks(dt * Math.max(speed, busy > 1 ? 1.8 : 1) * fast);   // (more shows waiting: this one hurries)
    if (cur) idleSmoke(cur, dt);
    for (const cv of liveCars()) poseCar(cv, dt);
    engFrame(dt);
    puffs.update(dt); sparks.update(dt); stepFlames(dt); stepGlints(dt);
    motes.material.uniforms.uT.value = time;
    ringGlow.material.uniforms.uK.value = GLOW.ring * (0.3 + 0.055 * Math.sin(time * 1.6));
    signGlow.material.userData.op = GLOW.sign * (0.94 + 0.08 * Math.sin(time * 2.3));
    if ((time * 4 | 0) !== ((time - dt) * 4 | 0)) drawScreen(time);   // (the big screen four times a second)
    if (autoSpin && !busy && !user.drag) rig.yaw += dt * 0.32;
    placeCamera(dt); stepPieces(dt); adaptExposure(dt);
    if (noDraw) return;
    const ri = renderer.info.render, post = POST.on && POST.rt, dirty = busy > 0 || tasks.length > 0 || shadowDirty > 0;   // (a show, a move, a piece gone or back)
    if (shadowDirty > 0) shadowDirty--;
    // the mirror first, with the last frame's shadow map; then the main pass draws the shadow map when it is due (with the main camera's
    // layers: what is kept out of the mirror still casts) and the room. From the second reset on: what the page's test counts
    STATS.shadow = shT = 0; renderer.info.reset(); renderer.shadowMap.needsUpdate = false; drawReflection(); STATS.refl = ri.calls;
    renderer.info.reset(); renderer.shadowMap.needsUpdate = dirty;
    renderer.setRenderTarget(post ? POST.rt : null); renderer.render(scene, camera);
    STATS.main = ri.calls - STATS.shadow; STATS.tris = ri.triangles - shT;
    if (post) postPass();
    STATS.post = ri.calls - STATS.main - STATS.shadow;
  }
  // (every car's root knows its car: the frame poses them all, the one driving out too)
  const live = new Set();
  function liveCars() { live.clear(); tt.traverse(o => { if (o.userData.cv) live.add(o.userData.cv); }); return live; }

  // a picture of a car for the menu (its side, three quarters from the front), on the room's floor
  function thumb(spec, w, h) {
    const cv = makeCar(Object.assign({ cond: { clean: 1, body: 1, engine: 1 }, upg: {} }, spec)), sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xe8efff, 0x40444c, 0.8)); const d = new THREE.DirectionalLight(0xffffff, 0.75); d.position.set(3, 6, 4); sc.add(d);
    const r = new THREE.DirectionalLight(0x9fc8ff, 0.4); r.position.set(-4, 2, -5); sc.add(r);
    sc.add(cv.root); cv.v.blob && (cv.v.blob.material.opacity = 0.85);
    const cam = new THREE.PerspectiveCamera(24, w / h, 0.1, 50), L = Math.max(4, cv.M.len), g0 = GROUND.value;
    cam.position.set(L * 0.95, L * 0.5, L * 1.55); cam.lookAt(0, 0.45, 0); cam.layers.enable(NOREFL); GROUND.value = 0;   // (its shadows too; on the floor)
    const rt = new THREE.WebGLRenderTarget(w * 2, h * 2, { format: THREE.RGBAFormat }); const old = renderer.getClearColor(new THREE.Color()), oa = renderer.getClearAlpha();
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, cam);
    const px = new Uint8Array(w * 2 * h * 2 * 4); renderer.readRenderTargetPixels(rt, 0, 0, w * 2, h * 2, px);
    renderer.setRenderTarget(null); renderer.setClearColor(old, oa); GROUND.value = g0;
    const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'), img = g.createImageData(w * 2, h * 2);
    for (let y = 0; y < h * 2; y++) img.data.set(px.subarray((h * 2 - 1 - y) * w * 2 * 4, (h * 2 - y) * w * 2 * 4), y * w * 2 * 4);
    g.putImageData(img, 0, 0); rt.dispose(); freeCar(cv);
    return c.toDataURL('image/png');
  }

  return {
    init, resize, frame, show, swap, upgrade, service, paint, thumb, view: setView, sfx: (k) => { if (SFX[k]) SFX[k](); },
    set onHud(f) { hud = f || (() => {}); },
    set fast(k) { fast = k > 0 ? k : 1; },
    get busy() { return busy > 0; }, get ready() { return ready; },
    get idle() { return !busy && !tasks.length && !user.drag && !autoSpin && Math.abs(user.vy) < 0.01 && !flames.length && !glints.length; },   // (nothing moving but the dust: the page draws less often)
    sound(on) { sndInit(); if (SND.out) SND.out.gain.value = on ? 0.7 : 0; SND.vol = on ? 0.7 : 0; if (typeof Sfx !== 'undefined') { Sfx.resume(); Sfx.setEnabled(on); } },
    setCond(c) { if (cur) setCond(cur, c); },
    get cur() { return cur; },
    get info() { return cur ? { car: cur.M.id, color: cur.spec.color, stripe: cur.spec.stripe !== false, upg: Object.assign({}, cur.spec.upg), parts: Object.keys(cur.parts).reduce((o, k) => (o[k] = cur.parts[k].userData.items.length, o), {}), dirt: cur.v.dirtU ? +cur.v.dirtU.value.toFixed(3) : null, scr: cur.v.scrU ? +cur.v.scrU.value.toFixed(3) : null, lift: +lift.toFixed(3), ang: +ttAng.toFixed(3) } : null; },
    _dbg: { REF, TX, tasks, user, rig, pieces, WALLS, post: POST, stats: STATS, get floorMat() { return floorMat; }, get keyLight() { return keyLight; } },
    get renderer() { return renderer; }, get camera() { return camera; }, get scene() { return scene; },
  };
})();
