/* =========================================================================
   GARAGE 3D — the garage (garaza.html): the workshop, the car on its turntable with the single-post lift behind it, the parts of its
   upgrades, and an animation for every change (a new car drives in, a part is fitted, the car is washed, mended, serviced, painted).
   The cars are the race's own meshes (Render.garageCar); the room is a scene of its own, drawn with the renderer Render.init made.
   Car space: x forward, y up, z to the right (as the race's). The car stands on the turntable at the room's centre, its nose to +x (the
   table no longer turns nor rises: the camera goes round the car, the lift raises it).
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
  let tt = null, ttTop = null, lift = 0, env = null, cubeRT = null;   // (lift: the car's height on the lift)
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
  function spawn(gen, quiet) { let res; const p = new Promise(r => { res = r; }); const t = { g: gen, res, quiet }; tasks.push(t); stepTask(t, 0); return p; }
  const moving = () => { for (const t of tasks) if (!t.quiet) return true; return false; };   // (quiet: a task that moves nothing (a measurement): the picture needs no redraw for it)
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
      g.fillStyle = 'rgb(68,68,69)'; g.fillRect(0, 0, w, h);   // (a neutral grey: the cool cast is the light's, not the resin's)
      for (let i = 0; i < 24; i++) { const x = R() * w, y = R() * h, r = 60 + R() * 220, gr = g.createRadialGradient(x, y, 0, x, y, r), d = R() < 0.5;
        gr.addColorStop(0, d ? 'rgba(0,0,0,0.045)' : 'rgba(255,255,255,0.03)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      for (let i = 0; i < 16000; i++) { const v = R(); g.fillStyle = v < 0.5 ? 'rgba(22,22,24,0.35)' : v < 0.85 ? 'rgba(154,155,158,0.2)' : 'rgba(210,211,214,0.22)'; g.fillRect(R() * w, R() * h, 1 + (R() < 0.1), 1 + (R() < 0.1)); }
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
      // rubber where the cars brake onto the table and pull off it: short dark smears on each wheel line from the table's edge (a tyre's
      // width, darkest at the edge), a scuffed crescent round the edge where the drive line crosses it
      { const Rm = Core.rng(4248);
        for (const sd of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 3; k++) { const z = sz * (0.68 + Rm() * 0.2), xa = sd * (3.15 + Rm() * 0.1), xb = sd * (4.2 + Rm() * 1.2), a = 0.1 + Rm() * 0.08, s = g.createLinearGradient(xa, 0, xb, 0);
          s.addColorStop(0, 'rgba(6,5,4,' + a.toFixed(3) + ')'); s.addColorStop(1, 'rgba(6,5,4,0)'); g.strokeStyle = s; g.lineWidth = 0.2 + Rm() * 0.06; g.lineCap = 'butt'; g.beginPath(); g.moveTo(xa, z); g.lineTo(xb, z + (Rm() - 0.5) * 0.12); g.stroke(); }
        g.lineWidth = 0.35; g.strokeStyle = 'rgba(10,8,5,0.07)'; for (const sd of [-1, 1]) { const a = sd > 0 ? 0 : Math.PI; g.beginPath(); g.arc(0, 0, 3.32, a - 0.4, a + 0.4); g.stroke(); }
        g.lineCap = 'round'; }
      // the dust along the walls (not in the doorways) and in the corners
      const foot = (ax, az, bx, bz, nx, nz) => { const gr = g.createLinearGradient(ax, az, ax + nx * 0.6, az + nz * 0.6); gr.addColorStop(0, 'rgba(70,95,0,0.32)'); gr.addColorStop(1, 'rgba(70,95,0,0)'); g.fillStyle = gr;
        g.fillRect(Math.min(ax, bx, ax + nx * 0.6), Math.min(az, bz, az + nz * 0.6), Math.abs(bx - ax) + Math.abs(nx) * 0.6, Math.abs(bz - az) + Math.abs(nz) * 0.6); };
      foot(x0, z0, x1, z0, 0, 1); foot(x0, z1, x1, z1, 0, -1);
      for (const [x, n] of [[x0, 1], [x1, -1]]) for (let z = z0; z < z1 - 1e-3; z += 0.1) { const k = smooth(door - 0.2, door + 0.6, Math.abs(z + 0.05)), gr = g.createLinearGradient(x, 0, x + n * 0.6, 0);   // (thinning out into the doorway)
        gr.addColorStop(0, 'rgba(70,95,0,' + (0.32 * k).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(70,95,0,0)'); g.fillStyle = gr; g.fillRect(n > 0 ? x : x - 0.6, z, 0.6, 0.1); }
      for (const x of [x0, x1]) for (const z of [z0, z1]) rad(x, z, 0, 1, '60,80,0', 0.22);
      // b: the wet (0 dry; over 0.26 standing water): a puddle round the gully back right of the table where a car was washed down, a
      // few drops round it (all within x 3.4..4.9, z -3.7..-2.7: clear of the cart, the tool stand's mat and the hose by it)
      { const Rw = Core.rng(4249); g.save(); g.globalCompositeOperation = 'lighter';
        const blob = (x, z, rx, rz, a, b) => { g.save(); g.translate(x, z); g.scale(1, rz / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
          gr.addColorStop(0, 'rgba(0,0,255,' + a.toFixed(3) + ')'); gr.addColorStop(b, 'rgba(0,0,255,' + (a * 0.85).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(0,0,255,0)'); g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore(); };
        for (const [x, z, rx, rz, a] of [[4.35, -3.05, 0.75, 0.5, 0.55], [3.9, -3.25, 0.55, 0.4, 0.45], [4.65, -3.35, 0.45, 0.35, 0.4], [3.65, -3.1, 0.35, 0.3, 0.35]]) blob(x, z, rx, rz, a, 0.55);
        for (let i = 0; i < 9; i++) { const a = Rw() * TAU, x = clamp(4.2 + Math.cos(a) * (0.55 + Rw() * 0.3), 3.45, 4.85), z = clamp(-3.2 + Math.sin(a) * (0.42 + Rw() * 0.15), -3.7, -2.78), r = 0.04 + Rw() * 0.06;
          blob(x, z, r, r * (0.7 + Rw() * 0.3), 0.3 + Rw() * 0.25, 0.4); }
        g.restore(); }
      // the saw-cut joints (the table's hole hides them under it): a dark cut and its chipped edge (in pixels: crisp)
      g.setTransform(1, 0, 0, 1, 0, 0);
      for (const x of [-4.5, 0, 4.5]) { const p = Math.round((x - x0) * sx); g.fillStyle = 'rgba(20,10,0,0.9)'; g.fillRect(p - 1, 0, 2, h); g.fillStyle = 'rgba(215,150,0,0.4)'; g.fillRect(p + 1, 0, 1, h); }
      for (const z of [0, 4.5]) { const p = Math.round(h - (z - z0) * sz); g.fillStyle = 'rgba(20,10,0,0.9)'; g.fillRect(0, p - 1, w, 2); g.fillStyle = 'rgba(215,150,0,0.4)'; g.fillRect(0, p + 1, w, 1); }
    });
    // the walls: insulated sandwich panels laid across, 1.2 m a panel (their joints at 1.0, 2.2, 3.4, 4.6 m), fine ribs along them, a
    // butt joint every 3 m, a few streaks under the joints (1 texture = 3 m x 1.2 m; each panel's tint a shade apart: the wall's shader)
    TX.wall = canvasTex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h), jy = Math.round(h / 6);
      gr.addColorStop(0, 'rgb(72,72,72)'); gr.addColorStop(jy / h, 'rgb(69,69,70)'); gr.addColorStop(jy / h + 0.001, 'rgb(80,80,80)'); gr.addColorStop(1, 'rgb(72,72,72)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);   // (a panel: lighter at its top, under the joint above it; neutral grey)
      for (let y = jy % 32; y < h; y += 32) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y, w, 1); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, y + 1, w, 1); }
      for (let i = 0; i < 30; i++) { const x = R() * w, wd = 4 + R() * 12, l = 40 + R() * 80, s = g.createLinearGradient(0, jy, 0, jy + l); s.addColorStop(0, 'rgba(0,0,0,' + (0.03 + R() * 0.02).toFixed(3) + ')'); s.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = s; g.fillRect(x, jy, wd, l); }
      for (let i = 0; i < 6000; i++) { g.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'; g.fillRect(R() * w, R() * h, 2, 2); }
      const sh = g.createLinearGradient(0, jy + 2, 0, jy + 12); sh.addColorStop(0, 'rgba(0,0,0,0.12)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, jy + 2, w, 10);
      g.fillStyle = 'rgba(8,10,14,0.85)'; g.fillRect(0, jy - 2, w, 4); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(0, jy + 2, w, 2);
      g.fillStyle = 'rgba(8,10,14,0.4)'; g.fillRect(0, 0, 1, h); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(1, 0, 1, h);
    }, true);
    // the low wall: aluminium tread plate, worn (1 texture = 3 m x 1 m, the wall's uv halved: its repeat): an even sheet mottled in long
    // soft bands, the grime of the floor's splashes in its bottom fifth, black rubber scuffs where tyres and trolleys knocked it, bright
    // scratches, a few dents (whatever is near its edges drawn again across them: it runs on round the room)
    TX.plate = canvasTex(768, 256, (g, w, h) => {
      const Rp = Core.rng(4250), wrap = (x, r, f) => { f(x); if (x - r < 0) f(x + w); if (x + r > w) f(x - w); };
      g.fillStyle = 'rgb(91,92,94)'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) { const x = Rp() * w, y = Rp() * h, rx = 120 + Rp() * 220, ry = 30 + Rp() * 50, d = Rp() < 0.5, a = 0.04 + Rp() * 0.04;   // (the mottling: long, soft)
        wrap(x, rx, (cx) => { g.save(); g.translate(cx, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, d ? 'rgba(0,0,0,' + a.toFixed(3) + ')' : 'rgba(255,255,255,' + (a * 0.8).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore(); }); }
      for (let i = 0; i < 6000; i++) { g.fillStyle = 'rgba(255,255,255,' + (Rp() * 0.07).toFixed(3) + ')'; g.fillRect(Rp() * w, Rp() * h, Rp() * 30, 1); }   // (brushed)
      for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) {
        g.save(); g.translate(x + 8, y + 8); g.rotate((((x / 8) + (y / 16)) % 2) ? 0.7 : -0.7);
        g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(-5, -1, 11, 3.4); g.fillStyle = 'rgba(255,255,255,0.42)'; g.fillRect(-6, -2, 11, 2); g.restore(); }
      // (the grime band: the floor's dirt splashed up the bottom 22 %, its top ragged)
      const gb = g.createLinearGradient(0, h * 0.74, 0, h); gb.addColorStop(0, 'rgba(34,30,24,0)'); gb.addColorStop(0.45, 'rgba(34,30,24,0.16)'); gb.addColorStop(1, 'rgba(30,26,20,0.38)'); g.fillStyle = gb; g.fillRect(0, h * 0.74, w, h * 0.26);
      for (let i = 0; i < 70; i++) { const x = Rp() * w, y = h * (0.8 + Rp() * 0.2), r = 6 + Rp() * 26; wrap(x, r, (cx) => { const gr = g.createRadialGradient(cx, y, 0, cx, y, r); gr.addColorStop(0, 'rgba(32,28,22,' + (0.06 + Rp() * 0.1).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(32,28,22,0)'); g.fillStyle = gr; g.fillRect(cx - r, y - r, r * 2, r * 2); }); }
      // (black rubber: 40 scuffs of 3 to 25 cm, most low down, a little curved)
      g.lineCap = 'round';
      for (let i = 0; i < 40; i++) { const L = 8 + Rp() * 56, x = Rp() * w, y = h * (0.45 + Rp() * 0.5), a = (Rp() - 0.5) * 0.5, bend = (Rp() - 0.5) * 6, al = 0.12 + Rp() * 0.24;
        wrap(x, L, (cx) => { g.strokeStyle = 'rgba(12,12,13,' + al.toFixed(3) + ')'; g.lineWidth = 1.5 + Rp() * 3; g.beginPath(); g.moveTo(cx - Math.cos(a) * L / 2, y - Math.sin(a) * L / 2); g.quadraticCurveTo(cx, y + bend, cx + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2); g.stroke(); }); }
      // (bright scratches: thin arcs through the oxide; dents: dark above, a light lip below, the light from over them)
      for (let i = 0; i < 12; i++) { const x = Rp() * w, y = h * (0.15 + Rp() * 0.75), r = 20 + Rp() * 60, a0 = Rp() * TAU, da = 0.3 + Rp() * 0.6;
        wrap(x, r, (cx) => { g.strokeStyle = 'rgba(222,226,232,' + (0.25 + Rp() * 0.2).toFixed(3) + ')'; g.lineWidth = 1; g.beginPath(); g.arc(cx, y, r, a0, a0 + da); g.stroke(); }); }
      for (let i = 0; i < 6; i++) { const x = Rp() * w, y = h * (0.35 + Rp() * 0.55), r = 8 + Rp() * 10;
        wrap(x, r * 1.6, (cx) => { g.save(); g.translate(cx, y); g.scale(1.6, 1);
          const d = g.createRadialGradient(0, -r * 0.25, 0, 0, -r * 0.25, r); d.addColorStop(0, 'rgba(0,0,0,0.22)'); d.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = d; g.beginPath(); g.arc(0, 0, r, Math.PI, TAU); g.fill();
          const l = g.createRadialGradient(0, r * 0.25, 0, 0, r * 0.25, r); l.addColorStop(0, 'rgba(255,255,255,0.16)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.beginPath(); g.arc(0, 0, r, 0, Math.PI); g.fill(); g.restore(); }); }
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, w, 3);
    }, true);
    TX.plate.repeat.set(0.5, 1);   // (the wall's uv is metres / 1.5: 3 m a texture)
    // carbon fibre: a 2 x 2 twill (the wing, the splitter, the skirts)
    TX.carbon = canvasTex(64, 64, (g, w, h) => {
      g.fillStyle = '#16181c'; g.fillRect(0, 0, w, h);
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
        const x = i * 8, y = j * 8, hor = ((i + j) >> 1) % 2 === 0, gr = hor ? g.createLinearGradient(x, y, x, y + 8) : g.createLinearGradient(x, y, x + 8, y);
        gr.addColorStop(0, '#2a2e35'); gr.addColorStop(0.5, '#4b515b'); gr.addColorStop(1, '#202329'); g.fillStyle = gr; g.fillRect(x + 0.5, y + 0.5, 7, 7);
      }
    }, true);
    TX.carbon.repeat.set(6, 6);
    // the pegboard over the bench (1 texture = 2.5 m x 1.3 m, about 400 px a metre): its holes an inch apart, the tools at their real
    // size, each on its outline painted in yellow (a shadow board): two rows of graduated spanners, screwdrivers, pliers, an adjustable,
    // hex keys, a hammer, files, a tape, two socket rails, a torque wrench, ratchets; three of them out in use
    TX.peg = canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = 'rgb(50,53,58)'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(8,9,12,0.85)'; for (let y = 8; y < h; y += 12) for (let x = 8; x < w; x += 12) { g.beginPath(); g.arc(x, y, 1.9, 0, TAU); g.fill(); }
      // (f(m): m 0 the silhouette in the colour set, 1 the tool in its colours, 2 the same 1 px up and lighter: a lit top edge)
      const tool = (x, y, a, f, gone) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#c9a22e';
        for (let k = 0; k < 8; k++) { const dx = Math.cos(k / 8 * TAU) * 1.8, dy = Math.sin(k / 8 * TAU) * 1.8; g.translate(dx, dy); f(0); g.translate(-dx, -dy); }   // (the outline: the shape grown)
        if (gone) { g.fillStyle = 'rgb(44,46,51)'; f(0); } else { g.fillStyle = 'rgba(0,0,0,0.4)'; g.translate(2, 3); f(0); g.translate(-2, -3); g.translate(0, -1); f(2); g.translate(0, 1); f(1); } g.restore(); };
      const metal = (m) => { if (m) g.fillStyle = m === 2 ? '#c3c9d1' : '#98a0aa'; }, paint = (m, c, l) => { if (m) g.fillStyle = m === 2 ? l : c; }, HOLE = '#2b2e34';
      const disc = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
      // a combination spanner hung by its ring: the ring end up, the open end down (its jaw cut)
      const spanner = (L) => (m) => { const s = Math.max(4.5, L * 0.07), rr = L * 0.1, ro = L * 0.115; metal(m);
        g.fillRect(-s / 2, -L / 2 + rr, s, L - rr - ro); disc(0, -L / 2 + rr, rr); disc(0, L / 2 - ro, ro);
        if (m === 1) { g.fillStyle = HOLE; disc(0, -L / 2 + rr, rr * 0.48); g.fillRect(-ro * 0.4, L / 2 - ro * 1.05, ro * 0.8, ro * 1.1); } };
      for (let i = 0; i < 10; i++) { const L = 72 + i * 56 / 9; tool(46 + i * 34, 30 + L / 2, 0, spanner(L), i === 6); }   // (18 to 32 cm)
      for (let i = 0; i < 10; i++) { const L = 64 + i * 52 / 9; tool(46 + i * 34, 192 + L / 2, 0.06, spanner(L)); }   // (a second, shorter set)
      const DRV = [['#8c3a32', '#a8544a'], ['#2f4a72', '#486690'], ['#8c3a32', '#a8544a'], ['#2f4a72', '#486690'], ['#1f2125', '#3a3d42'], ['#8c3a32', '#a8544a'], ['#2f4a72', '#486690'], ['#1f2125', '#3a3d42']];
      for (let i = 0; i < 8; i++) { const L = 88 + i * 26 / 7, [c, l] = DRV[i];   // screwdrivers (22 to 28 cm), handle up
        tool(410 + i * 32, 30 + L / 2, 0, (m) => { metal(m); g.fillRect(-2, -L / 2 + L * 0.38, 4, L * 0.62 - 4); g.fillRect(-3, L / 2 - 7, 6, 7); paint(m, c, l); g.beginPath(); g.moveTo(-6, -L / 2 + 3); g.lineTo(6, -L / 2 + 3); g.lineTo(6.5, -L / 2 + L * 0.38); g.lineTo(-6.5, -L / 2 + L * 0.38); g.fill(); g.fillRect(-4, -L / 2, 8, 4); }); }
      for (const [x, L, c, l] of [[420, 84, '#8c3a32', '#a8544a'], [462, 94, '#2f4a72', '#486690'], [504, 100, '#1f2125', '#3a3d42']])   // pliers, jaws up
        tool(x, 200 + L / 2, 0, (m) => { metal(m); g.beginPath(); g.moveTo(-3, -L / 2); g.lineTo(3, -L / 2); g.lineTo(8, -L / 2 + L * 0.32); g.lineTo(-8, -L / 2 + L * 0.32); g.fill(); disc(0, -L / 2 + L * 0.32, 7.5);
          paint(m, c, l); for (const s of [-1, 1]) { g.save(); g.translate(s * 3, -L / 2 + L * 0.38); g.rotate(-s * 0.13); g.fillRect(-3.5, 0, 7, L * 0.62); g.restore(); } });
      tool(566, 250, 0, (m) => { metal(m); g.fillRect(-5, -32, 10, 80); disc(0, -36, 15); if (m === 1) { g.fillStyle = HOLE; g.fillRect(-5, -54, 10, 18); } });   // an adjustable (25 cm)
      for (let i = 0; i < 6; i++) { const a = 26 + i * 8, b = 8 + i * 2.2, t = 2.5 + i * 0.35;   // hex keys, short leg out
        tool(604 + i * 12, 208, 0, (m) => { metal(m); g.fillRect(-t / 2, 0, t, a); g.fillRect(-t / 2, a - t, b, t); }); }
      tool(720, 40 + 66, 0, (m) => { paint(m, '#5a4634', '#74604a'); g.fillRect(-5, -48, 10, 114); g.fillStyle = m ? '#1f2125' : g.fillStyle; if (m) g.fillRect(-6, 26, 12, 40); metal(m); g.fillRect(-25, -66, 50, 17); g.fillRect(-8, -68, 16, 26); });   // a hammer (33 cm)
      tool(790, 40 + 60, 0, (m) => { g.fillRect(-28, -60, 56, 26); g.fillRect(-4, -36, 8, 96); }, true);   // a mallet (in use)
      for (const [x, L] of [[846, 120], [872, 110]]) tool(x, 40 + L / 2, 0, (m) => { paint(m, '#1f2125', '#3a3d42'); g.fillRect(-5, -L / 2, 10, L * 0.32); metal(m); g.beginPath(); g.moveTo(-5, -L / 2 + L * 0.32); g.lineTo(5, -L / 2 + L * 0.32); g.lineTo(2.5, L / 2); g.lineTo(-2.5, L / 2); g.fill(); });   // files
      tool(940, 76, 0, (m) => { paint(m, '#a68a3a', '#c0a454'); g.beginPath(); g.moveTo(-14, -14); g.lineTo(14, -14); g.lineTo(14, 14); g.lineTo(-10, 14); g.lineTo(-14, 10); g.fill(); paint(m, '#1f2125', '#3a3d42'); disc(0, 0, 6); });   // a tape
      tool(830, 250, 0, (m) => { metal(m); g.fillRect(-78, -20, 150, 6); g.fillRect(-78, -20, 6, 36); g.fillRect(66, -20, 6, 36); g.fillRect(-76, 12, 146, 3); paint(m, '#1f2125', '#3a3d42'); g.fillRect(70, -16, 22, 34); });   // a hacksaw
      for (let i = 0; i < 3; i++) tool(948 + i * 18, 196 + 59, 0, (m) => { metal(m); g.fillRect(-3.5, -52, 7, 110); g.beginPath(); g.ellipse(0, -55, 6, 9, 0, 0, TAU); g.fill(); });   // tyre levers (30 cm)
      for (let i = 0; i < 6; i++) { const L = 60 + i * 4, t = 5 + i * 0.5; tool(424 + i * 24, 322 + L / 2, 0, (m) => { metal(m); g.fillRect(-t / 2, -L / 2, t, L - 8); g.beginPath(); g.moveTo(-t / 2, L / 2 - 8); g.lineTo(t / 2, L / 2 - 8); g.lineTo(1, L / 2); g.lineTo(-1, L / 2); g.fill(); }); }   // punches, chisels
      // two socket rails (their rail a dull red), a torque wrench (60 cm), ratchets
      tool(140, 410, 0, (m) => { paint(m, '#6e2a24', '#88403a'); g.fillRect(-76, 8, 152, 7); metal(m); for (let i = 0; i < 10; i++) { const sw = 9 + i * 0.6; g.fillRect(-70 + i * 15 - sw / 2 + 4, -10, sw, 18); } });
      tool(330, 410, 0, (m) => { paint(m, '#6e2a24', '#88403a'); g.fillRect(-92, 12, 184, 8); metal(m); for (let i = 0; i < 8; i++) { const sw = 17 + i * 1.3, x = -84 + i * 22.5; g.fillRect(x, -14 + i * 0.4, sw, 26 - i * 0.4); } });
      tool(580, 420, 0, (m) => { metal(m); g.fillRect(-110, -5, 200, 10); disc(-112, 0, 12); paint(m, '#1f2125', '#3a3d42'); g.fillRect(70, -7, 60, 14); if (m === 1) { g.fillStyle = '#d8d8d0'; g.fillRect(-40, -3, 26, 6); } });
      tool(800, 412, 0, (m) => { metal(m); g.fillRect(-46, -4, 80, 8); disc(-48, 0, 10); paint(m, '#1f2125', '#3a3d42'); g.fillRect(16, -5, 34, 10); });
      tool(920, 412, 0, (m) => { g.fillRect(-46, -4, 80, 8); disc(-48, 0, 10); g.fillRect(16, -5, 34, 10); }, true);   // (one out)
      g.strokeStyle = '#d9ad2b'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    });
    // the turntable's top: a plate of brushed dark steel in eight segments (their seams), a lighter band at the rim bolted down, a cap
    // in the middle, the gold arrows (planar uv over the disc)
    TX.disc = canvasTex(1024, 1024, (g, w, h) => {
      const c = w / 2; g.fillStyle = 'rgb(56,58,62)'; g.fillRect(0, 0, w, h);
      const BR = [[[], [], [], []], [[], [], [], []]];   // (brushed round the middle: the strokes in 2 x 4 paths by their tone, one stroke() each)
      for (let i = 0; i < 9000; i++) { const r = Math.sqrt(R()) * c * 0.93, a = R() * TAU, l = 6 + R() * 14, x = c + Math.cos(a) * r, y = c + Math.sin(a) * r, dx = -Math.sin(a) * l / 2, dy = Math.cos(a) * l / 2;
        BR[R() < 0.5 ? 0 : 1][Math.min(3, R() * 4 | 0)].push(x - dx, y - dy, x + dx, y + dy); }
      g.lineWidth = 1.5; BR.forEach((L, wt) => L.forEach((q, k) => { g.strokeStyle = (wt ? 'rgba(0,0,0,' : 'rgba(255,255,255,') + (0.02375 + k * 0.0075).toFixed(5) + ')'; g.beginPath(); for (let j = 0; j < q.length; j += 4) { g.moveTo(q[j], q[j + 1]); g.lineTo(q[j + 2], q[j + 3]); } g.stroke(); }));
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
    // the back-lit sign: the game's own name, channel letters in two lines of one width (each one's dark side under it, then the lit face;
    // two lines: it fits left of the lift's column as the home view sees it; 237 texels a metre, as the old one's 256)
    TX.sign = canvasTex(512, 256, (g, w, h) => {
      const F = (px) => 'italic 900 ' + px + 'px Roboto, "Arial Black", Arial, sans-serif', W = 380; g.textBaseline = 'alphabetic'; g.textAlign = 'center';
      g.font = F(50); const sa = 50 * W / g.measureText('APEX').width, sb = 50 * W / g.measureText('RACING').width, ya = 20 + sa * 0.72, yb = ya + 17 + sb * 0.72;
      const line = (t, px, y, col, glow) => { g.font = F(px); g.shadowBlur = 0; g.fillStyle = 'rgba(14,15,18,0.9)'; g.fillText(t, w / 2 + 3, y + 4.5); g.shadowColor = glow; g.shadowBlur = GLOW.blur / 2; g.fillStyle = col; g.fillText(t, w / 2, y); };
      line('APEX', sa, ya, '#ffd23f', 'rgba(255,190,40,0.9)'); line('RACING', sb, yb, '#f4f8ff', 'rgba(160,210,255,0.9)');
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
  // the grime's noise (with the post pass only), 128 x 128, tiling (1 tile = 2.2 m): r soft blotches, g streaks running down, b a fine
  // grain (value noise on wrapped grids)
  function makeLightTextures() {
    if (POST.on) { const Rn = Core.rng(4246), grid = (nx, ny) => { const a = new Float32Array(nx * ny); for (let i = 0; i < a.length; i++) a[i] = Rn(); return { a, nx, ny }; };
      const vn = (G, x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const i0 = ((xi % G.nx) + G.nx) % G.nx, j0 = ((yi % G.ny) + G.ny) % G.ny, i1 = (i0 + 1) % G.nx, j1 = (j0 + 1) % G.ny, A = G.a;
        return lerp(lerp(A[j0 * G.nx + i0], A[j0 * G.nx + i1], sx), lerp(A[j1 * G.nx + i0], A[j1 * G.nx + i1], sx), sy); };
      const B = [grid(4, 4), grid(8, 8), grid(16, 16)], S = [grid(24, 3), grid(48, 5)], F = grid(64, 64);
      TX.rlN = canvasTex(128, 128, (g, w, h) => { const img = g.createImageData(w, h), d = img.data;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const u = i / w, v = j / h, o = (j * w + i) * 4;
          const r = vn(B[0], u * 4, v * 4) * 0.55 + vn(B[1], u * 8, v * 8) * 0.3 + vn(B[2], u * 16, v * 16) * 0.15, st = vn(S[0], u * 24, v * 3) * 0.65 + vn(S[1], u * 48, v * 5) * 0.35, gr = vn(F, u * 64, v * 64) * 0.6 + Rn() * 0.4;
          d[o] = Math.round(clamp((r - 0.5) * 1.8 + 0.5, 0, 1) * 255); d[o + 1] = Math.round(clamp((st - 0.5) * 2 + 0.5, 0, 1) * 255); d[o + 2] = Math.round(gr * 255); d[o + 3] = 255; }
        g.putImageData(img, 0, 0); }, true); }
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
  // the cars drive in through the left one and out through the right one. In the middle of the floor the turntable, the lift behind it.
  const ROOM = { x0: -9, x1: 9, z0: -5, z1: 9, h: 4.8, door: 2.5, doorH: 3.9, R: 3.0 };
  let signGlow = null, ringMat = null, ringGlow = null, motes = null, monitor = null;

  /* ---------------- the room's light: one chunk in the shaders of the room's own materials (walls, ceiling, floor, every piece's), no
     lights and no draws of its own. Brighter under the lamps over the table, darker towards the walls, in the corners, along the floor's
     and the ceiling's edges; the daylight through the doors (the right one in the sun: warm; the left one in the building's shade: cool),
     the wall washers' scallops on the back wall, the sun through the front windows in patches of their shape, the light floor's bounce
     on the walls and on what stands (most low down) ---------------- */
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
      // a task light: a line along x (xa..xb) at height y, z, shining down only (its nearest point; the inverse square softened)
      'float rlTask(vec3 p, vec3 n, float xa, float xb, float y, float z){ vec3 L = vec3(clamp(p.x, xa, xb), y, z) - p; float d2 = dot(L, L) + 0.03; L *= inversesqrt(d2); return max(dot(n, L), 0.0) * max(L.y, 0.0) / d2; }',
      'vec3 roomLight(vec3 c, vec3 alb){',
      '  vec3 p = vRp, n = normalize(vRn);',
      '  float dx = ' + f((x1 - x0) / 2) + ' - abs' + at('p.x', (x0 + x1) / 2) + ', dz = ' + f((z1 - z0) / 2) + ' - abs' + at('p.z', (z0 + z1) / 2) + ', dw = min(dx, dz);',
      '  vec2 q = p.xz / vec2(5.2, 3.8); float k = mix(0.66, 1.1, 1.0 / (1.0 + dot(q, q)));',   // (the lamps over the table)
      // (a pool of light under each linear lamp: the rows at z -3.9 and 6.2, the lamps every 4.35 m across; less of it high up)
      '  { float dzb = p.z + 3.9, dzf = p.z - 6.2, cx = cos((p.x - 2.2) * 1.4444); k *= 1.0 + 0.3 * (exp(-dzb * dzb / 1.3) + exp(-dzf * dzf / 1.3)) * cx * cx * step(0.0, cx) * (1.0 - 0.5 * smoothstep(1.0, 3.8, p.y)); }',
      '  k *= mix(0.52, 1.0, smoothstep(0.0, 1.3, dw + p.y)) * mix(0.62, 1.0, smoothstep(0.0, 1.4, dw + ' + f(h) + ' - p.y)) * mix(0.6, 1.0, smoothstep(0.0, 1.8, max(dx, dz)));',   // (the floor's and the ceiling's edges, the corners)
      '  float wash = 0.0;',   // (the washers: a fan of light down the back wall from each)
      '  if (n.z > 0.5 && p.z < ' + f(z0 + 0.4) + ') { float iw = 1.0 / (0.35 + 0.22 * (' + f(ly) + ' - p.y)), e;',
      WASH_X.map(x => '    e = ' + at('p.x', x) + ' * iw; wash += exp(-e * e);').join('\n'),
      '    wash *= smoothstep(0.8, 3.6, p.y) * (1.0 - smoothstep(' + f(ly - 0.05) + ', ' + f(ly + 0.05) + ', p.y)); }',
      '  float sun = 0.0, ns = dot(n, rlS); if (ns > 0.0 && p.z < ' + f(zw - 0.01) + ') sun = ns * rlSun(p);',   // (the sun: on what faces it)
      // (the warm task lights: one under the bins' rail over the bench (on the bench, not the floor), one over the pegboard; the LED
      // line's cool wash down the tread plate under it, along the back wall and the side walls' back halves)
      '  vec3 task = vec3(0.0); if (p.z < ' + f(z0 + 1.6) + ') task = vec3(1.0, 0.86, 0.68) * (0.22 * step(0.7, p.y) * rlTask(p, n, -3.9, -1.6, 1.27, ' + f(z0 + 0.19) + ') + 0.22 * rlTask(p, n, -7.35, -5.05, 2.66, ' + f(z0 + 0.26) + '));',
      '  float led = p.z < ' + f(-door - 0.4) + ' && p.y < 1.0 ? smoothstep(0.55, 1.0, p.y) * (1.0 - smoothstep(0.0, 0.15, dw)) : 0.0;',
      '  return c * k + alb * (' + v3([0.55, 0.506, 0.44]) + ' * rlDoor(p, n, ' + f(x1) + ', 1.0) + ' + v3([0.213, 0.228, 0.248]) + ' * rlDoor(p, n, ' + f(x0) + ', -1.0)',   // (the doors: 0.55 x (1, 0.92, 0.8); 0.55 x 0.45 x (0.86, 0.92, 1))
      '    + vec3(0.9, 0.864, 0.81) * wash + vec3(1.0, 0.88, 0.7) * sun * ' + f(HDR ? 1.8 : 0.9) + ' + task + ' + v3([0.075, 0.1125, 0.135]) + ' * led',
      '    + ' + v3([0.3, 0.295, 0.285]) + ' * (1.0 - abs(n.y)) * (1.0 - 0.65 * smoothstep(0.0, 3.8, p.y)));',   // (the light floor's bounce on what stands: most low down)
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
  // the grime (with the post pass; after the room light's chunk, its vRp and vRn): the noise laid on the face's own plane (the floor's
  // for tops, the nearer wall's for sides), the paint a shade uneven in soft blotches, the foot of what stands scuffed and splashed up
  // to 0.16..0.4 m, dust on the tops (rlDust: it dulls their highlights, hideMat)
  const GRIME_GLSL = ['uniform sampler2D tRlN; float rlDust = 0.0;',
    'vec3 rlGrime(vec3 a){ vec3 p = vRp, n = normalize(vRn), an = abs(n);',
    '  vec2 u = an.y > 0.7 ? p.xz : (an.x > an.z ? p.zy : p.xy); vec3 t = texture2D(tRlN, u * 0.45).rgb;',
    '  a *= 0.85 + 0.3 * t.r;',
    '  float kick = (1.0 - an.y) * (1.0 - smoothstep(0.02, 0.16 + 0.24 * t.g, p.y));',
    '  a = mix(a, a * vec3(0.7, 0.64, 0.56) + vec3(0.025, 0.02, 0.015), kick * 0.9);',
    '  rlDust = smoothstep(0.75, 0.95, n.y) * step(0.1, p.y) * (0.3 + 0.7 * t.r) * 0.35;',
    '  return mix(a, vec3(0.34, 0.33, 0.31), rlDust); }'].join('\n');
  function grimePatch(sh) {
    if (!TX.rlN) { sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'float rlDust = 0.0;\nvoid main() {'); return; }
    sh.uniforms.tRlN = { value: TX.rlN };
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', GRIME_GLSL + '\nvoid main() {').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = rlGrime(diffuseColor.rgb);');
  }
  // a room material in the room's light (key: its program's cache key, one per variant; opts.mapFrag: as above; opts.grime: the grime)
  function roomLit(m, key, opts) { const mf = opts && opts.mapFrag, gr = opts && opts.grime; m.onBeforeCompile = (sh) => { roomPatch(sh, mf); if (gr) grimePatch(sh); }; m.customProgramCacheKey = () => key; return m; }
  // the gloss of a piece's matte mesh: its faces from here on (p.g's vertices so far) get their highlights x k, until the next mark
  // (rubber, cloth 0.15; paint 1; bare metal 2.2)
  function gloss(p, k) { p.gl.push([p.g.P.length / 3, k]); }
  // drawn by the main camera only (not in the floor's mirror, not in the cars' cube map): what lies on the floor or under it, glass,
  // dust, a car's small parts (layers are each object's own: on each mesh; it still casts: the shadow map is the main pass's)
  function mainOnly(o) { o.layers.set(NOREFL); return o; }

  /* ---------------- the room's pieces that step aside: what comes between the camera and the car dissolves ---------------- */
  // a wall's piece (all that stands or hangs on that wall) is gone while the camera is out beyond the wall (or close to it); a free-
  // standing thing is gone while it is in the way (a line from the camera to the car's middle or a point round its body goes through
  // its box) or right in front of the camera (nearer than p.near); a robot (p.robot) so while it is parked, at work it stays (its box
  // follows it).
  // The fade is a dissolve: the pixels drop out in a fine noise (no see-through things to sort); its glows and shadows fade out.
  const pieces = [], WALLS = {}, FREE = {}, STANDS = [];   // (STANDS: the paint's and the swaps' stands' pieces)
  function piece(wall) { const p = { wall: wall || null, root: new THREE.Group(), g: new World.GB(), sm: new SmoothB(), gl: [], near: 3.4, u: { value: 0 }, k: 0, want: false, box: new THREE.Box3(), boxH: null, solid: [], fades: [] }; scene.add(p.root); pieces.push(p); return p; }
  // a piece's material: the dissolve first thing in the shader, then the room light and the grime (not in the glowing MeshBasic ones
  // nor in a ShaderMaterial), the gloss of the matte mesh (gl: its geometry has the 'gloss' attribute): the highlight's strength and
  // its size (matte broad and faint, metal tight), bare metal (gloss over 1.5) mirroring the room's cube soft (ENVU: the cube once it
  // is made; an empty one while it is being made), less where dust lies
  const ENVU = { value: null };
  function hideMat(m, u, gl) {
    const rl = !m.isMeshBasicMaterial && !m.isShaderMaterial;
    m.onBeforeCompile = (sh) => { sh.uniforms.uHide = u;
      sh.fragmentShader = 'uniform float uHide;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n\tif (uHide > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < uHide) discard;');
      if (rl) { roomPatch(sh); grimePatch(sh); }
      if (rl && gl) { sh.uniforms.tEnvR = ENVU;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float gloss; varying float vGloss;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGloss = gloss;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGloss; uniform samplerCube tEnvR;')
          .replace('#include <lights_phong_fragment>', '#include <lights_phong_fragment>\nmaterial.specularShininess = shininess * (0.3 + 0.7 * vGloss * vGloss);')
          .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directSpecular *= vGloss * (1.0 - rlDust * 2.5);')
          .replace('#include <tonemapping_fragment>', ['if (vGloss > 1.5) { vec3 rV = normalize(vRp - cameraPosition), rN = normalize(vRn); float rF = pow(1.0 - clamp(dot(-rV, rN), 0.0, 1.0), 5.0);',
            '  float rM = clamp(vGloss - 1.2, 0.0, 1.0) * 0.6, rD = 1.0 - clamp(rlDust * 3.0, 0.0, 1.0); vec3 rE = textureCube(tEnvR, reflect(rV, rN), 3.0).rgb;',
            '  gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.45 + rE * diffuseColor.rgb * 1.3, rM * rD) + rE * (0.3 * rF * rD); }',
            '#include <tonemapping_fragment>'].join('\n')); } };
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
      p.box.setFromObject(p.root); if (p.boxIn) p.box.intersect(p.boxIn); p.box.expandByScalar(0.05); p.boxH = p.box.clone().expandByScalar(0.06);
      p.g = p.sm = p.gl = null;   // (the builders' arrays: in the meshes now, the phone's memory back)
    }
  }
  // (how near point c is to robot A's arm: its links, its carriage; under 0: in it)
  const _an = [];
  function armNear(A, c) { let m = A.boxes[0].distanceToPoint(c); for (const [a, b, r] of linksOf(A, 'whole', _an)) m = Math.min(m, segd(c, a, b) - r); return m; }
  // each frame: what is in the way of the car (seen from where the camera is now) fades out, the rest comes back
  const _ray = new THREE.Ray(), _hit = new V3(), CORN = [new V3()], _cp = [new V3()], _rbx = new THREE.Box3();   // (the car's middle, its sills and its roof, on the table)
  for (const x of [-2.2, -1.1, 0, 1.1, 2.2]) for (const z of [-1, 1]) { CORN.push(new V3(x, 0.25, z)); _cp.push(new V3()); }
  for (const x of [-1.4, 0, 1.4]) { CORN.push(new V3(x, 1.25, 0)); _cp.push(new V3()); }
  const LIFT_SKIP = CORN.map(q => Math.abs(q.x) > 2);   // (the lift's column: the sills' far ends not counted)
  // (box b between the camera c and the point q)
  const hides = (b, c, q) => { _ray.origin.copy(c); _ray.direction.subVectors(q, c); const L = _ray.direction.length(); _ray.direction.divideScalar(L); return !!_ray.intersectBox(b, _hit) && _hit.distanceTo(c) < L; };
  // (the car's points in the world now: the camera's mark, the sills, the roof (the car up on the lift: its points with it))
  function carPoints() { tt.updateMatrixWorld(); _cp[0].set(rig.tx, rig.ty, rig.tz); for (let i = 1; i < CORN.length; i++) tt.localToWorld(_cp[i].copy(CORN[i])).y += lift; return _cp; }
  function stepPieces(dt) {
    const c = camera.position; carPoints();
    for (const p of pieces) {   // (one gone comes back a little further out: held still at the edge, the camera's breathing does not flick it)
      let want = false; const h = p.want ? 1 : 0, bx = h ? p.boxH : p.box;
      if (p.wall) { want = p.wall[0] * c.x + p.wall[1] * c.z - p.wall[2] < 0.4 + 0.1 * h; for (const b of p.solid) if (b.distanceToPoint(c) < 0.3 + 0.1 * h) want = true;   // (or in its tall furniture)
        if (want && p.boxH.containsPoint(c)) p.k = 1; }   // (the camera in among its things (a view's way cuts a corner): gone at once, not a dark veil fading over the picture)
      else if (p.lift) {   // (the lift: at work it stays, it holds the car up (its arms hang from it): only the camera in it takes it away; at rest
        // its slim column goes when it hides two of the car's inner points (beside the car's ends, over a corner, it stays)
        const at = LIFT.on || LIFT.s > 1e-3; if (bx.distanceToPoint(c) < (at ? 0.35 : p.near) + (at ? 0.1 : 0.15) * h) want = true;
        else if (!at) { let n = 0; for (let i = 0; i < _cp.length && n < 2; i++) if (!LIFT_SKIP[i] && hides(bx, c, _cp[i])) n++; want = n >= 2; } }
      else if (p.robot) { if (p.robot.blink) want = true;   // (one with no clear way: gone while it is put there)
        else if (!p.robot.rest) want = bx.distanceToPoint(c) < 0.6 && armNear(p.robot, c) < 0.08 + 0.1 * h;   // (a robot at work stays: only the camera in its arm itself (its
        else if (bx.distanceToPoint(c) < p.near + 0.15 * h) want = true;                       // links, its carriage) takes it away, not one beside it; parked it goes when one of its boxes hides the car)
        else for (const q of _cp) { for (const b of p.robot.boxes) if (hides(_rbx.copy(b).expandByScalar(0.06 * h), c, q)) { want = true; break; } if (want) break; } }
      else if (bx.distanceToPoint(c) < p.near + 0.15 * h) want = true;
      else for (const q of _cp) if (hides(bx, c, q)) { want = true; break; }
      p.want = want; p.k = want ? Math.min(1, p.k + dt * 5) : Math.max(0, p.k - dt * 5);
      p.u.value = p.k; if ((p.k < 0.999) !== p.root.visible) { p.root.visible = !p.root.visible; shadowDirty = 2; }   // (gone or back: its shadow too)
      for (const m of p.fades) m.opacity = m.userData.op * (1 - p.k);
    }
    // (the lift's carriage and arms: stowed they go with the column; out under the car they stay, they carry it)
    const lk = LIFT.s > 1e-3 || LIFT.on ? 0 : LIFT.piece.k; LIFT.u.value = lk; if ((lk < 0.999) !== LIFT.mesh.visible) { LIFT.mesh.visible = !LIFT.mesh.visible; shadowDirty = 2; }
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
    const wallM = wq.mesh(roomLit(lam({ map: TX.wall }), 'wallLG', { mapFrag: tint, grime: true })), plateM = pq.mesh(roomLit(new THREE.MeshPhongMaterial({ map: TX.plate, specular: 0x666666, shininess: 40 }), 'roomG', { grime: true }));
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
    // (each block painted a shade apart; one column in four knocked: a few chips through the paint to the grey primer, a dark rim
    // round each, 2 mm proud)
    const KR = [0.74, 0.14, 0.12], KW = [0.86, 0.86, 0.84], Rk = Core.rng(4251), kc = (s) => { const c = Math.floor(s / 0.6 + 1e-6) % 2 ? KW : KR, k = 0.94 + Rk() * 0.1; return [c[0] * k, c[1] * k, c[2] * k]; };
    let nw = 0; const kerb = (w, s0, s1, t) => { const { T, P } = WF[w]; g = P.g;
      for (let a = s0; a < s1 - 1e-4;) { const b = Math.min(s1, (Math.floor(a / 0.6 + 1e-6) + 1) * 0.6); g.quadO(T(a, 2.0, t), T(b, 2.0, t), T(b, 2.16, t), T(a, 2.16, t), kc((a + b) / 2), T((a + b) / 2, 2.08, t - 1)); a = b; } };
    const chip = (P, Q, s, y, r) => { const j = () => r * (0.7 + Rk() * 0.6);   // (P(s, y, lift) a point on the face; Q its inside)
      for (const [k, d, col] of [[1.35, 0.0015, [0.2, 0.2, 0.21]], [1, 0.0025, [0.44, 0.45, 0.47]]]) { const a = j() * k, b = j() * k, c = j() * k, e = j() * k;
        g.quadO(P(s - a, y - b * 0.6, d), P(s + c, y - e * 0.6, d), P(s + a * 0.8, y + c * 0.6, d), P(s - e, y + b * 0.6, d), col, Q); } };
    for (const [w, s0, s1] of [['back', 0, x1 - x0], ['front', 0, x1 - x0], ['left', 0, z1 - door - 0.4], ['left', z1 + door + 0.4, z1 - z0], ['right', 0, -z0 - door - 0.4], ['right', door - z0 + 0.4, z1 - z0]]) {
      kerb(w, s0, s1, 0.02); const { T, cols } = WF[w];
      for (const sc of cols) { if (sc < s0 - 0.2 || sc > s1 + 0.2) continue; const f = 0.125;
        kerb(w, sc - f, sc + f, 0.277);
        for (const e of [-1, 1]) { g.quadO(T(sc + e * f, 2.0, 0.25), T(sc + e * f, 2.0, 0.277), T(sc + e * f, 2.16, 0.277), T(sc + e * f, 2.16, 0.25), kc(sc + e * (f - 0.002)), T(sc, 2.08, 0.26));
          g.quadO(T(sc + e * 0.009, 2.0, 0.02), T(sc + e * 0.009, 2.0, 0.25), T(sc + e * 0.009, 2.16, 0.25), T(sc + e * 0.009, 2.16, 0.02), kc(sc), T(sc, 2.08, 0.1)); }
        if (++nw % 4 === 2) { const n = 2 + (Rk() < 0.5 ? 1 : 0);
          for (let i = 0; i < n; i++) { const r = 0.01 + Rk() * 0.005, y = 2.03 + Rk() * 0.1;
            if (i === 0) { const e = Rk() < 0.5 ? -1 : 1; chip((ss, yy, d) => T(sc + e * (f + d), yy, 0.2635 + (ss - sc)), T(sc, 2.08, 0.26), sc, y, Math.min(r, 0.011)); }   // (one on the flange's knocked edge)
            else chip((ss, yy, d) => T(ss, yy, 0.277 + d), T(sc, 2.08, 0.1), sc + (Rk() - 0.5) * 2 * (f - 0.03), y, r); } } } }
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
      // the bay's traffic light on the jamb's other column, toward the room: red (off) over green (lit, over 1: it glows), a visor over
      // each, an amber beacon on top (off), its conduit up the column
      B(0.272, 0.392, 2.3, 2.72, -2.88, -2.72, [0.06, 0.06, 0.07], null, 'a');
      for (const [y, col] of [[2.6, [0.32, 0.05, 0.04]], [2.42, [0.3, 2.0, 0.6]]]) { cylA(g, T(0.4, y, -2.8), 'x', 0.055, 0.016, 10, [0.05, 0.05, 0.06], col); B(0.392, 0.47, y + 0.058, y + 0.066, -2.866, -2.734, [0.06, 0.06, 0.07]); }
      { const c = T(0.332, 0, -2.8); drum(g, c[0], c[2], 0.05, 2.72, 2.745, [0.1, 0.1, 0.11], 10, null, [0.1, 0.1, 0.11]); drum(g, c[0], c[2], 0.042, 2.745, 2.84, [0.62, 0.38, 0.08], 10, null, [0.7, 0.45, 0.1]); }
      obox(g, T(0.29, 2.72, -2.866), T(0.29, h, -2.866), 0.02, 0.02, CND);
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
    // (left of the lift's column as the home view sees it: from 0.2 m off the steel column to clear of the lift's)
    const SX0 = -3.2;
    { const { T } = WF.back, s = SX0 - x0; g = PB.g; lbox(T, s - 1.15, s + 1.15, 2.2, 3.36, 0, 0.05, [0.55, 0.57, 0.6], null, 'b');
      g.quadO(T(s - 1.13, 2.22, 0.0505), T(s + 1.13, 2.22, 0.0505), T(s + 1.13, 3.34, 0.0505), T(s - 1.13, 3.34, 0.0505), [0.06, 0.07, 0.09], T(s, 2.78, -1)); }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.16, 1.08), new THREE.MeshBasicMaterial({ map: TX.sign, color: emi(0xffffff, EMI.sign), transparent: true, depthWrite: false })); sign.position.set(SX0, 2.78, z0 + 0.06); PB.root.add(sign);
    signGlow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.9), new THREE.MeshBasicMaterial({ map: TX.glow, color: 0xffd894, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: GLOW.sign }));
    signGlow.position.set(SX0, 2.78, z0 + 0.03); PB.root.add(signGlow);
    // wall washers: a lamp under the ceiling every few metres along the back wall (between the windows; their light: the room light's,
    // their lenses: the lamps' mesh)
    g = PB.g;
    for (const x of WASH_X) box(x, h - 0.5, z0 + 0.1, 0.5, 0.08, 0.2, [0.1, 0.1, 0.11]);
    // the pegboard over the chests, on its frame off the wall
    lbox(WF.back.T, -6.2 - 1.25 - x0, -6.2 + 1.25 - x0, 1.27, 2.57, 0, 0.02, [0.2, 0.21, 0.24], null, 'b'); lbox(WF.back.T, -7.35 - x0, -5.05 - x0, 2.65, 2.72, 0, 0.3, [0.14, 0.15, 0.17], null, 'b');   // (and its light's bar over it: its diffuser the lamps' mesh)
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
      const { P: Pp, N, C: Cc } = cg, LT = new Map();   // (once a point: the ceiling's vertices share them)
      for (let i = 0; i < Pp.length; i += 3) { const key = Pp[i].toFixed(3) + ',' + Pp[i + 2].toFixed(3); let l = LT.get(key); if (l === undefined) LT.set(key, l = lt(Pp[i], Pp[i + 2]));
        const k = l * (0.7 - 0.3 * N[i + 1]); Cc[i] *= k; Cc[i + 1] *= k; Cc[i + 2] *= k; } }
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
    { const k = 0.75 / EMI.hex * (HDR ? 2.2 : 1), warm = [k, 0.86 * k, 0.68 * k];   // (the task lights' warm diffusers: under the bins' rail over the bench, under the pegboard's bar)
      lens(-3.9, -1.6, z0 + 0.16, z0 + 0.21, 1.272, warm); lens(-7.3, -5.1, z0 + 0.22, z0 + 0.28, 2.648, warm); }
    lampMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: emi(0xf2f7ff, EMI.hex) }); scene.add(new THREE.Mesh(lg.geometry(), lampMat));
  }
  // the furniture along the walls: two roll cabs under the pegboard, a workbench under the sign, the tyre rack, the tall cabinets, the
  // lockers and their bench; the oil drums, the rubber mats. Muted paint; the drawers' pulls and worn edges catch the light
  function buildFurniture() {
    const { z0, z1 } = ROOM, { back: PB, front: PF } = WALLS, { red: RED, red2: RED2, dk: DK, steel: STEEL, alu: ALU, wood: WOOD } = PAL;
    let p = PB, g = PB.g;
    const use = (q, k) => { p = q; g = q.g; gloss(q, k); }, gl = (k) => gloss(p, k), box = (...a) => fbox(g, ...a);
    // a roll cab against the back wall: a graphite body, navy drawer fronts with dark seams, full-width satin pulls (a gold cap on the top
    // one's), castors on forks (side: handles on its ends)
    const CG = [0.16, 0.17, 0.2], CGT = [0.2, 0.21, 0.24], NVD = [0.11, 0.14, 0.27], SEAM = [0.035, 0.035, 0.04], GAP = CG.map(v => v * 0.75), PULL = [0.42, 0.44, 0.48], GCAP = [0.75, 0.58, 0.18];
    const chest = (cx, w, hh, d, side) => {
      const zc = z0 + d / 2 + 0.05, zf = z0 + d + 0.05, n = Math.round(hh / 0.17), dy = hh / n;
      use(PB, PAINT); box(cx, 0.12, zc, w, hh, d, CG, CGT);
      for (let i = 0; i < n; i++) { const y = 0.12 + i * dy, xa = cx - w / 2 + 0.03, xb = cx + w / 2 - 0.03, ya = y + 0.012, yb = y + dy - 0.018;
        g.quadO([xa, ya, zf + 0.002], [xb, ya, zf + 0.002], [xb, yb, zf + 0.002], [xa, yb, zf + 0.002], NVD, [cx, (ya + yb) / 2, zf - 1]);   // (the drawer's front, 2 mm proud)
        box(cx, y, zf + 0.004, w - 0.05, 0.01, 0.01, SEAM); box(cx, y + dy - 0.016, zf + 0.004, w - 0.05, 0.012, 0.008, GAP); }
      gl(METAL); for (let i = 0; i < n; i++) box(cx, 0.12 + i * dy + dy * 0.6, zf + 0.014, w - 0.12, 0.022, 0.022, PULL);
      box(cx, 0.12 + (n - 1) * dy + dy * 0.6 + 0.003, zf + 0.0265, w - 0.14, 0.016, 0.003, GCAP);
      if (side) for (const s of [-1, 1]) { const x = cx + s * (w / 2 + 0.04); obox(g, [x, 0.98, zc - 0.18], [x, 0.98, zc + 0.18], 0.022, 0.022, STEEL); for (const dz of [-0.18, 0.18]) obox(g, [x - s * 0.04, 0.98, zc + dz], [x, 0.98, zc + dz], 0.02, 0.02, STEEL); }
      for (const sx of [-1, 1]) for (const sz of [0, 1]) box(cx + sx * (w / 2 - 0.08), 0.06, z0 + 0.14 + sz * (d - 0.16), 0.05, 0.06, 0.05, DK);   // (the forks)
      gl(MATTE); for (const sx of [-1, 1]) for (const sz of [0, 1]) cylA(g, [cx + sx * (w / 2 - 0.08), 0.045, z0 + 0.14 + sz * (d - 0.16)], 'x', 0.045, 0.03, 8, DK);
    };
    chest(-6.75, 1.5, 1.0, 0.62, true); chest(-5.45, 0.95, 0.7, 0.62, false);
    use(PB, MATTE); box(-6.75, 1.12, z0 + 0.36, 1.5, 0.014, 0.64, [0.08, 0.08, 0.09]);   // (a rubber mat on the big one)
    gl(SATIN); box(-5.45, 0.82, z0 + 0.36, 0.97, 0.05, 0.66, WOOD, [0.5, 0.36, 0.22]);   // (a butcher-block top on the small one)
    gl(PAINT); box(-7.15, 1.134, z0 + 0.32, 0.4, 0.166, 0.26, [0.22, 0.23, 0.26]); box(-7.15, 1.3, z0 + 0.32, 0.41, 0.054, 0.27, NVD, [0.13, 0.16, 0.3]); box(-7.15, 1.296, z0 + 0.32, 0.405, 0.006, 0.265, SEAM);   // a parts box (graphite, a navy lid): its lid's seam, its handle
    gl(METAL); obox(g, [-7.27, 1.37, z0 + 0.32], [-7.03, 1.37, z0 + 0.32], 0.02, 0.02, STEEL); for (const x of [-7.26, -7.04]) box(x, 1.354, z0 + 0.32, 0.016, 0.01, 0.016, STEEL);
    box(-6.4, 1.134, z0 + 0.4, 0.2, 0.17, 0.15, [0.3, 0.32, 0.36]);   // a vice
    // the workbench under the sign: a cabinet (doors with recessed pulls, a dark kick plinth), a stainless top and its upstand; a rail of
    // parts bins on the wall over it
    gl(PAINT); box(-2.6, 0, z0 + 0.27, 3.12, 0.1, 0.45, [0.05, 0.05, 0.06]); box(-2.6, 0.1, z0 + 0.3, 3.2, 0.62, 0.55, [0.15, 0.16, 0.18]);
    for (let i = 0; i < 4; i++) { const x = -3.8 + i * 0.8; box(x, 0.12, z0 + 0.58, 0.76, 0.54, 0.012, [0.22, 0.23, 0.26]); box(x, 0.6, z0 + 0.585, 0.34, 0.03, 0.008, [0.03, 0.03, 0.04]); }
    gl(METAL); for (let i = 0; i < 4; i++) box(-3.8 + i * 0.8, 0.627, z0 + 0.588, 0.34, 0.006, 0.01, ALU);
    box(-2.6, 0.72, z0 + 0.31, 3.25, 0.04, 0.62, [0.36, 0.38, 0.41], [0.42, 0.44, 0.47]); box(-2.6, 0.76, z0 + 0.012, 3.25, 0.12, 0.02, [0.38, 0.4, 0.43]);   // (steel: dark, its highlight the gloss's)
    for (const [z, w, c] of [[0.17, 0.06, 0.445], [0.33, 0.13, 0.44], [0.5, 0.05, 0.45]]) { const y = 0.7615, za = z0 + z - w / 2, zb = z0 + z + w / 2; g.quadO([-4.2, y, za], [-1.0, y, za], [-1.0, y, zb], [-4.2, y, zb], [c, c + 0.02, c + 0.05], [-2.6, 0, z0 + z]); }   // (brushed: lighter streaks along it)
    box(-2.75, 1.42, z0 + 0.03, 2.4, 0.03, 0.04, ALU);
    gl(SATIN); [[0.22, 0.23, 0.26], [0.22, 0.23, 0.26], NVD, [0.22, 0.23, 0.26], [0.22, 0.23, 0.26], NVD].forEach((c, i) => { const x = -3.7 + i * 0.38;
      box(x, 1.29, z0 + 0.13, 0.32, 0.15, 0.2, c, [0.03, 0.03, 0.04]); box(x, 1.33, z0 + 0.235, 0.12, 0.04, 0.008, [0.88, 0.88, 0.85]); });   // (open bins: dark inside, a blank label)
    // rubber mats on the floor in front of the bench and the big chest (dark, a yellow edge; bright: the floor's occlusion halves them)
    gl(MATTE); for (const [a, b, c, d] of [[-4.1, -1.1, -4.4, -3.95], [-7.4, -6.1, -4.28, -4.02]]) { const M = [0.12, 0.12, 0.13], Y = [1.48, 1.2, 0.4];
      box((a + b) / 2, 0, (c + d) / 2, b - a, 0.012, d - c, M); for (const z of [c + 0.015, d - 0.015]) box((a + b) / 2, 0, z, b - a, 0.013, 0.03, Y); for (const x of [a + 0.015, b - 0.015]) box(x, 0, (c + d) / 2, 0.03, 0.013, d - c, Y); }
    // the tyre rack: muted gold uprights and braces, two shelves, slicks standing in a row on each
    const rx0 = 1.15, rx1 = 4.75, GD = [0.76, 0.6, 0.2];
    gl(PAINT); for (const sx of [rx0, rx1]) { for (const sz of [0.32, 0.04]) box(sx, 0, z0 + sz, 0.06, 2.2, 0.06, GD); for (const y of [0.3, 1.3]) obox(g, [sx, y, z0 + 0.05], [sx, y + 0.6, z0 + 0.31], 0.03, 0.03, GD); }
    for (const y of [0.08, 1.12]) { box((rx0 + rx1) / 2, y, z0 + 0.18, rx1 - rx0 + 0.1, 0.05, 0.4, [0.24, 0.26, 0.3]); box((rx0 + rx1) / 2, y + 0.01, z0 + 0.385, rx1 - rx0 + 0.1, 0.03, 0.012, GD); }
    gl(MATTE); for (const y of [0.13, 1.17]) for (let i = 0; i < 11; i++) tyre(g, M4(rx0 + 0.2 + i * 0.32, y + 0.336, z0 + 0.2, i * 0.9, 0, Math.PI / 2), i % 4 ? null : BANDS[(i >> 2) % 3], 12, true);
    // (a barcode sticker on each one's tread toward the room: on the facet that faces it (the low tyre's 12), a little askew; its bars)
    gl(SATIN); { const ap = TYRE[TYRE.length - 1][0] * Math.cos(Math.PI / 12), F = Math.PI / 6, Rb = Core.rng(4321);
      for (const y of [0.13, 1.17]) for (let i = 0; i < 11; i++) { let ps = ((F / 2 - i * 0.9) % F + F) % F; if (ps > F / 2) ps -= F;
        const cx = rx0 + 0.2 + i * 0.32 + (Rb() - 0.5) * 0.03, cy = y + 0.336, cz = z0 + 0.2, sn = Math.sin(ps), cs = Math.cos(ps), tw = (Rb() - 0.5) * 0.3, c = Math.cos(tw), s = Math.sin(tw);
        const Q = (u, v, o) => { const a = u * c - v * s, b = u * s + v * c, r = ap + o; return [cx + a, cy + sn * r + cs * b, cz + cs * r - sn * b]; }, ins = [cx, cy, cz];
        g.quadO(Q(-0.035, -0.05, 0.0015), Q(0.035, -0.05, 0.0015), Q(0.035, 0.05, 0.0015), Q(-0.035, 0.05, 0.0015), [0.9, 0.9, 0.88], ins);
        for (const [u, w] of [[-0.02, 0.008], [-0.006, 0.004], [0.008, 0.01]]) g.quadO(Q(u, -0.035, 0.0025), Q(u + w, -0.035, 0.0025), Q(u + w, 0.012, 0.0025), Q(u, 0.012, 0.0025), [0.12, 0.12, 0.13], ins); } }
    // tall cabinets down the back wall's right end: double doors (their gap, handles), vents at the foot, a label holder
    gl(PAINT); for (let i = 0; i < 3; i++) { const x = 5.65 + i * 0.86, zf = z0 + 0.625;
      box(x, 0, z0 + 0.32, 0.82, 2.05, 0.6, [0.27, 0.29, 0.32], [0.2, 0.21, 0.24]); box(x, 0.06, zf, 0.008, 1.92, 0.01, [0.06, 0.06, 0.07]);
      for (let k = 0; k < 5; k++) for (const s of [-1, 1]) box(x + s * 0.2, 0.14 + k * 0.045, zf, 0.26, 0.012, 0.008, [0.08, 0.08, 0.09]);
      box(x - 0.2, 1.72, zf + 0.008, 0.15, 0.07, 0.004, [0.88, 0.88, 0.85]); }
    gl(METAL); for (let i = 0; i < 3; i++) { const x = 5.65 + i * 0.86, zf = z0 + 0.635; for (const s of [-1, 1]) box(x + s * 0.04, 0.95, zf, 0.022, 0.24, 0.02, STEEL); box(x - 0.2, 1.705, zf - 0.007, 0.18, 0.1, 0.006, STEEL); }
    BLOBS.push([-6.75, z0 + 0.4, 1.9, 1.0, 0.9, 0, PB], [-5.45, z0 + 0.4, 1.3, 1.0, 0.9, 0, PB], [-2.6, z0 + 0.35, 3.6, 0.9, 0.8, 0, PB], [2.95, z0 + 0.25, 4.0, 0.8, 0.7, 0, PB], [6.51, z0 + 0.35, 2.9, 1.0, 0.9, 0, PB]);
    // (the back wall's piece steps aside too when the camera would be in its deep furniture: the chests and the bench, the rack, the
    // cabinets; a side view passes there)
    for (const [a, b] of [[[-7.6, 0, z0], [-0.95, 1.4, z0 + 0.68]], [[1.1, 0, z0], [4.8, 2.25, z0 + 0.55]], [[5.22, 0, z0], [7.8, 2.06, z0 + 0.66]]]) PB.solid.push(new THREE.Box3(new V3(...a), new V3(...b)));
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
    BLOBS.push([-1.45, z1 - 0.4, 4.0, 1.2, 0.8, 0, PF]); PF.solid.push(new THREE.Box3(new V3(-3.32, 0, z1 - 0.95), new V3(0.42, 1.95, z1)));   // (its piece steps aside with the camera in them)
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
    ringGlow = new THREE.Mesh(new THREE.RingGeometry(R - 0.5, R + 0.65, 128, 1), new THREE.ShaderMaterial({
      uniforms: { uC: { value: new THREE.Color(0x3aa8ff) }, uK: { value: 0.16 * GLOW.ring } },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uC; uniform float uK; varying vec2 vP; void main(){ float d = length(vP) - ' + (R + 0.04).toFixed(2) + '; float a = exp(-d * d * (d < 0.0 ? 60.0 : 9.0)); gl_FragColor = vec4(uC * a * uK, 1.0); }',
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
    { const gx = 4.35, gz = -3.0, a = 0.17, e = 0.025, ST = [0.55, 0.57, 0.6];
      q([gx - a, gz - a], [gx + a, gz - a], [gx + a, gz + a], [gx - a, gz + a], 0.004, [0.04, 0.04, 0.05]);
      for (const s of [-1, 1]) { q([gx - a, gz + s * a - (s > 0 ? e : 0)], [gx + a, gz + s * a - (s > 0 ? e : 0)], [gx + a, gz + s * a + (s < 0 ? e : 0)], [gx - a, gz + s * a + (s < 0 ? e : 0)], 0.006, ST);
        q([gx + s * a - (s > 0 ? e : 0), gz - a], [gx + s * a + (s < 0 ? e : 0), gz - a], [gx + s * a + (s < 0 ? e : 0), gz + a], [gx + s * a - (s > 0 ? e : 0), gz + a], 0.006, ST); }
      for (let i = 0; i < 7; i++) { const x = gx - a + e + (i + 0.5) * (2 * (a - e)) / 7; q([x - 0.01, gz - a], [x + 0.01, gz - a], [x + 0.01, gz + a], [x - 0.01, gz + a], 0.006, [0.42, 0.44, 0.47]); } }
    // (the layout map over the room by the world's x, z: the paint wears with the floor)
    const lu = (a, b) => [1 / (b - a), -a / (b - a)].map(v => v.toFixed(5)), U = lu(x0, x1), V = lu(ROOM.z0, z1), fm = new THREE.MeshLambertMaterial({ vertexColors: true });
    fm.onBeforeCompile = (sh) => { sh.uniforms.tLay = { value: TX.floorL };
      roomPatch(sh, 'vec4 lay = texture2D(tLay, vRp.xz * vec2(' + U[0] + ', ' + V[0] + ') + vec2(' + U[1] + ', ' + V[1] + ')); diffuseColor.rgb *= mix(1.0, lay.r * 1.6, 0.8) * (0.85 + 0.15 * lay.g) * (1.0 - 0.35 * lay.b);');
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
  // (black is never black: rubber and dark paint a little lifted; bare metal darker, its brightness the room's mirrored in it: hideMat)
  const PAL = { red: [0.58, 0.1, 0.09], red2: [0.42, 0.07, 0.06], dk: [0.12, 0.12, 0.13], rub: [0.12, 0.12, 0.13], steel: [0.5, 0.52, 0.56], alu: [0.55, 0.57, 0.6],
    chrome: [0.45, 0.46, 0.5], navy: [0.1, 0.13, 0.26], gold: [0.93, 0.71, 0.2], cyan: [0.3, 0.72, 0.95], white: [0.9, 0.9, 0.88], wood: [0.42, 0.3, 0.18] };
  const MATTE = 0.15, SATIN = 0.5, PAINT = 1, METAL = 2.2;   // (the gloss of the faces that follow: gloss())
  const BANDS = [[0.95, 0.78, 0.15], [0.86, 0.16, 0.12], [0.92, 0.92, 0.9]];   // (the slicks' compound rings: as the car's tyres' bands)
  const BLOBS = [];   // (the soft shadows on the floor: [x, z, w, d, k how dark, angle, piece]; buildDecor lays them all)
  const WALLAO = [];   // (contact shadows on the walls behind tall things: [wall 'b'|'f'|'l'|'r', a, b (along the wall: world x on 'b'/'f', world z on 'l'/'r'), y0, y1, k 0..1, piece]; the decal block draws them)
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
    const pa = P.array, na = N.array, [a, b, c, x, y, z] = GA;   // (read straight from the arrays into the same six: triN copies them)
    for (let i = 0; i < P.count; i += 3) { const k = i * 3, cl = fn ? cs[i / 3] : col;
      for (let j = 0; j < 3; j++) { a[j] = pa[k + j]; b[j] = pa[k + 3 + j]; c[j] = pa[k + 6 + j]; x[j] = na[k + j]; y[j] = na[k + 3 + j]; z[j] = na[k + 6 + j]; }
      g.triN(a, b, c, x, y, z, cl, cl, cl); }
    geo.dispose(); if (q !== geo) q.dispose();
  }
  const GA = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
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
    gAdd(g, geo, m, (c, nr, f) => { const j = (f >> 1) % (n - 1); return j === n - 2 ? [0.03, 0.03, 0.035] : band && (j === b[0] || j === b[1]) ? band : j >= t[0] && j <= t[1] ? [0.16, 0.16, 0.165] : PAL.rub; });
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
    const { geo, n } = lathe(BLK, 16), P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); if (Math.hypot(x, z) > 0.3) { const k = 1 + 0.018 * Math.cos(Math.atan2(z, x) * 8); P.setX(i, x * k); P.setZ(i, z * k); } }   // (the quilting)
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
    for (const w of wh) if (warm) blanket(g, w[2]); else tyre(g, w[2], BANDS[0], 12);
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
        else if (i > 11) {   // (an old stain: an uneven outline, soft over a pixel, warm brown, its rim darker than its middle, a drip or two by it)
          const ph = [R() * TAU, R() * TAU, R() * TAU], r0 = 13 + R() * 4, ey = 0.75 + R() * 0.25, edge = (a, k) => r0 * k * (1 + 0.2 * Math.sin(2 * a + ph[0]) + 0.13 * Math.sin(3 * a + ph[1]) + 0.07 * Math.sin(5 * a + ph[2]));
          const blot = (cx, cy, k) => { g.beginPath(); for (let j = 0; j <= 24; j++) { const a = j / 24 * TAU, r = edge(a, k); j ? g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * ey) : g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * ey); } g.closePath(); };
          g.save(); g.filter = 'blur(0.7px)';
          blot(x, y, 1); g.fillStyle = 'rgba(38,27,16,0.32)'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(24,16,9,0.3)'; g.stroke();
          for (let k = 0; k < 2; k++) { const a = R() * TAU, d = Math.min(edge(a, 1.1) + 1.5, 24); blot(x + Math.cos(a) * d, y + Math.sin(a) * d * ey, 0.1 + R() * 0.08); g.fill(); }
          g.globalCompositeOperation = 'destination-out'; const gr = g.createRadialGradient(x, y, 0, x, y, r0 * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 32, y - 32, 64, 64);
          g.restore(); } }
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
    { const P = use(piece()), X = -5.25, Z = -2.35, Y0 = 0.72, AL = [0.55, 0.57, 0.6], AL2 = [0.44, 0.46, 0.5], YL = [0.9, 0.6, 0.12], YL2 = [0.76, 0.5, 0.1], Z0 = -3.85, NS = [0.12, 0.15, 0.28], NS2 = [0.08, 0.1, 0.19]; P.near = 4.4;
      gBox(g, null, X - 0.62, 0.1, Z, 0.08, 0.06, 0.92, NS); gBox(g, null, X - 0.06, 0.1, Z, 1.12, 0.06, 0.08, NS);   // the stand (the team's navy): its T on castors, the post, the head
      gBox(g, null, X - 0.62, 0.44, Z, 0.08, 0.62, 0.08, NS); gBox(g, null, X - 0.53, Y0, Z, 0.18, 0.07, 0.07, NS);
      gAdd(g, new THREE.CylinderGeometry(0.14, 0.14, 0.025, 16), M4(X - 0.44, Y0, Z, 0, 0, Math.PI / 2), NS2);
      for (const a of [0.8, 2.35, 3.93, 5.5]) seg(g, [X - 0.43, Y0, Z], [X - 0.4, Y0 + Math.sin(a) * 0.19, Z + Math.cos(a) * 0.19], 0.018, NS);
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
      // a spare transaxle on its dolly beside the crane (cast aluminium: the main case and its ribs, the bellhousing toward the engine, its
      // input shaft, the diff's bulge and its dark output flanges; the shift actuator and its red cable, a finned oil cooler on top)
      { const GX = -3.95, GZ = -2.95, CA = [0.5, 0.52, 0.55], CA2 = [0.43, 0.45, 0.49];
        gl(PAINT); gBox(g, null, GX, 0.095, GZ, 0.5, 0.05, 0.42, RED); for (const sx of [-0.13, 0.13]) gBox(g, null, GX + sx, 0.17, GZ, 0.07, 0.1, 0.26, [0.1, 0.1, 0.11]);   // the dolly, its saddle
        for (const sx of [-0.2, 0.2]) for (const sz of [-0.16, 0.16]) gBox(g, null, GX + sx, 0.06, GZ + sz, 0.04, 0.03, 0.04, DK);
        gl(1.3); gBox(g, null, GX, 0.36, GZ, 0.45, 0.28, 0.3, CA); for (const sz of [-1, 1]) for (const dx of [-0.1, 0.08]) gBox(g, null, GX + dx, 0.36, GZ + sz * 0.153, 0.016, 0.26, 0.012, CA2);
        gAdd(g, new THREE.CylinderGeometry(0.12, 0.18, 0.16, 12), M4(-4.25, 0.36, GZ, 0, 0, -Math.PI / 2), (c, n) => n[1] < -0.5 ? [0.13, 0.13, 0.14] : CA2);   // (its open face dark)
        cylA(g, [-3.8, 0.33, GZ], 'z', 0.11, 0.34, 12, CA); gl(PAINT); for (const s of [-1, 1]) cylA(g, [-3.8, 0.33, GZ + s * 0.185], 'z', 0.06, 0.03, 8, [0.1, 0.1, 0.11]);
        gl(METAL); cylA(g, [-4.365, 0.36, GZ], 'x', 0.016, 0.07, 6, STEEL);
        gl(PAINT); gBox(g, null, -4.03, 0.54, GZ - 0.05, 0.1, 0.08, 0.12, [0.1, 0.1, 0.11]); gBox(g, null, -3.8, 0.53, GZ + 0.04, 0.15, 0.06, 0.17, [0.2, 0.2, 0.22]);
        gl(METAL); for (let i = 0; i < 3; i++) gBox(g, null, -3.85 + i * 0.05, 0.59, GZ + 0.04, 0.006, 0.06, 0.16, [0.36, 0.37, 0.4]);
        gl(MATTE); tube(g, [[-4.03, 0.58, GZ - 0.01], [-3.98, 0.62, GZ + 0.08], [-3.9, 0.56, GZ + 0.13], [-3.82, 0.5, GZ + 0.155]], 0.008, [0.7, 0.13, 0.1], 8, 3);
        for (const sx of [-0.2, 0.2]) for (const sz of [-0.16, 0.16]) cylA(g, [GX + sx, 0.035, GZ + sz], 'z', 0.035, 0.026, 6, DK);
        BLOBS.push([GX, GZ, 0.8, 0.7, 0.7, 0, P]); }
      BLOBS.push([X - 0.05, Z, 1.4, 1.1, 0.8, 0, P], [X, -3.15, 1.9, 1.7, 0.5, 0, P]); }
    // a roll cab on the floor by the table: drawers with their pulls, a rubber mat on top with the tools on it, a push bar, castors
    { const P = use(piece()), X = -6.75, Z = -2.2, w = 0.82, d = 0.5, n = 4, dy = 0.7 / n, zf = Z + d / 2, CG = [0.16, 0.17, 0.2], NVD = [0.11, 0.14, 0.27];   // (graphite, navy fronts: as the chests)
      box(X, 0.12, Z, w, 0.7, d, CG, [0.2, 0.21, 0.24]);
      for (let i = 0; i < n; i++) { const y = 0.12 + i * dy, xa = X - w / 2 + 0.03, xb = X + w / 2 - 0.03, ya = y + 0.012, yb = y + dy - 0.018;
        g.quadO([xa, ya, zf + 0.002], [xb, ya, zf + 0.002], [xb, yb, zf + 0.002], [xa, yb, zf + 0.002], NVD, [X, (ya + yb) / 2, zf - 1]);
        box(X, y, zf + 0.003, w - 0.05, 0.01, 0.01, [0.035, 0.035, 0.04]); box(X, y + dy - 0.016, zf + 0.003, w - 0.05, 0.012, 0.008, CG.map(v => v * 0.75)); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(X + sx * (w / 2 - 0.07), 0.06, Z + sz * (d / 2 - 0.07), 0.05, 0.06, 0.05, DK);
      box(X + 0.15, 0.84, Z - 0.05, 0.08, 0.14, 0.06, [0.85, 0.68, 0.12]); obox(g, [X + 0.15, 0.95, Z - 0.05], [X + 0.32, 0.95, Z - 0.05], 0.07, 0.07, [0.85, 0.68, 0.12]); box(X + 0.15, 0.82, Z - 0.05, 0.1, 0.03, 0.08, DK);   // a cordless drill
      cylA(g, [X + 0.3, 0.92, Z + 0.13], 'y', 0.045, 0.16, 10, [0.18, 0.36, 0.7], [0.8, 0.8, 0.82]);   // a spray can
      gl(METAL); for (let i = 0; i < n; i++) box(X, 0.12 + i * dy + dy * 0.6, Z + d / 2 + 0.012, w - 0.12, 0.022, 0.022, [0.42, 0.44, 0.48]);
      box(X, 0.12 + (n - 1) * dy + dy * 0.6 + 0.003, zf + 0.0245, w - 0.14, 0.016, 0.003, [0.75, 0.58, 0.18]);
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
    { const P = use(piece()); P.near = 4.4; trolley(P, 1.75, -3.72, 0, true);   // (left of the tool stand's far end, back from the far robot's rail and its chain's trough)
      gl(MATTE); tube(g, [[2.54, 0.67, -3.63], [2.6, 0.3, -3.76], [2.64, 0.012, -3.9], [2.42, 0.012, -4.3], [1.4, 0.012, -4.42], [0.95, 0.012, -4.72], [0.87, 0.14, -4.9], [0.85, 0.37, -4.95]], 0.008, DK, 48, 4);
      BLOBS.push([1.75, -3.72, 1.8, 1.1, 0.9, 0, P]); }
    { use(WALLS.back); box(0.85, 0.37, z0 + 0.03, 0.12, 0.16, 0.06, [0.5, 0.52, 0.55]); box(0.85, 0.42, z0 + 0.061, 0.07, 0.07, 0.004, [0.2, 0.21, 0.23]); }   // (the socket)
    const TB = FREE.tyresB = use(piece()), TBm = M4(6.25, 0, -2.8, 0, Math.PI + 0.12, 0); TB.near = 4.4; trolley(TB, 6.25, -2.8, Math.PI + 0.12, false); BLOBS.push([6.25, -2.8, 1.8, 1.1, 0.9, 0.12, TB]);
    // stacks of slicks, a little out of line (a set of wheels on the second, its rim on top; one leaning on the first), by the way in;
    // cones by the way out
    const Rt = Core.rng(5), tyreStack = (x, z, n, rim, lean) => { const P = use(piece(), MATTE); P.near = 4.4; let m = null;
      for (let i = 0; i < n; i++) { m = M4(x + (Rt() - 0.5) * 0.05, 0.12 + i * 0.24, z + (Rt() - 0.5) * 0.05, 0, Rt() * 6, (Rt() - 0.5) * 0.03); tyre(g, m, rim ? BANDS[0] : BANDS[i % 3], 12); }
      if (lean) tyre(g, M4(lean[0], 0.335, lean[1], Math.PI / 2 - 0.22, 0, 0), BANDS[1], 12);
      // (a barcode sticker on the top one's tread toward the room: on the facet that faces it most, a dark print on it)
      gl(SATIN); { const toC = new V3(-x, 0, -z).normalize(), nm = new THREE.Matrix3().getNormalMatrix(m); let a = 0, bd = -2;
        for (let k = 0; k < 12; k++) { const f = (k + 0.5) / 12 * TAU, d = new V3(Math.sin(f), 0, Math.cos(f)).applyMatrix3(nm).normalize().dot(toC); if (d > bd) { bd = d; a = f; } }
        const rf = 0.336 * Math.cos(Math.PI / 12), L = (t, y, e) => new V3(Math.sin(a) * (rf + e) + Math.cos(a) * t, y, Math.cos(a) * (rf + e) - Math.sin(a) * t).applyMatrix4(m).toArray();
        const sq = (t0, t1, y0, y1, e, col) => g.quadO(L(t0, y0, e), L(t1, y0, e), L(t1, y1, e), L(t0, y1, e), col, L((t0 + t1) / 2, (y0 + y1) / 2, e - 0.05));
        sq(-0.035, 0.035, -0.05, 0.05, 0.0015, [0.9, 0.9, 0.88]); for (const [t, w] of [[-0.02, 0.006], [-0.008, 0.01], [0.006, 0.004], [0.017, 0.008]]) sq(t - w / 2, t + w / 2, -0.032, 0.036, 0.0025, [0.08, 0.08, 0.09]); }
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
      gl(PAINT); box(x0 + 0.04, 1.2, Z, 0.02, 0.32, 0.32, [0.82, 0.1, 0.08]);   // (its sign: a red square, a white extinguisher on it, its hose and handle)
      for (const [y, z, h, w] of [[1.25, 0.025, 0.16, 0.065], [1.41, 0.025, 0.025, 0.035], [1.43, 0.012, 0.014, 0.075], [1.415, -0.0175, 0.012, 0.055], [1.3, -0.04, 0.127, 0.014]]) box(x0 + 0.055, y, Z + z, 0.01, h, w, [0.95, 0.95, 0.93]);
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
      const helmet = (x, a, b, c) => {   // a helmet: its shell, a stripe over it, the dark visor (as many faces as 30 cm high on a wall 10 m off needs)
        sm.add(new THREE.SphereGeometry(0.15, 14, 10), M4(x, Y + 0.14, Z, 0, 0.35, 0, 1, 0.92, 1.08), a);
        sm.add(new THREE.TorusGeometry(0.152, 0.018, 4, 16, Math.PI * 1.15), M4(x, Y + 0.14, Z, 0, 0.35 + Math.PI / 2, -0.08, 1, 0.92, 1.08), b);
        sm.add(new THREE.SphereGeometry(0.153, 12, 6, Math.PI / 2 - 0.95, 1.9, 1.15, 0.6), M4(x, Y + 0.13, Z, 0, 0.35, 0, 1, 0.92, 1.08), c);
        sm.add(new THREE.CylinderGeometry(0.13, 0.145, 0.04, 12), M4(x, Y + 0.02, Z, 0, 0, 0, 1, 1, 1.08), [0.08, 0.08, 0.09]); };
      helmet(sx0 + 0.45, [0.88, 0.12, 0.1], [0.97, 0.97, 0.95], [0.05, 0.06, 0.08]);
      helmet(sx0 + 0.95, [0.95, 0.95, 0.93], [0.12, 0.35, 0.85], [0.05, 0.06, 0.08]);
      helmet(sx0 + 1.45, [0.98, 0.78, 0.12], [0.08, 0.08, 0.09], [0.3, 0.55, 0.85]);
      const GOLDC = [0.98, 0.76, 0.26], cup = new THREE.LatheGeometry([[0, 0], [0.05, 0], [0.05, 0.02], [0.018, 0.04], [0.018, 0.1], [0.04, 0.12], [0.09, 0.2], [0.1, 0.26], [0.095, 0.27]].map(p => new THREE.Vector2(p[0], p[1])), 12);
      gl(PAINT); for (const [x, k] of [[sx1 - 0.65, 1], [sx1 - 0.3, 0.8]]) { box(x, Y, Z, 0.16 * k + 0.04, 0.07, 0.16 * k + 0.04, [0.1, 0.1, 0.11]); sm.add(cup.clone(), M4(x, Y + 0.07, Z, 0, 0, 0, k), GOLDC);
        sm.add(new THREE.TorusGeometry(0.045 * k, 0.01, 4, 8, Math.PI), M4(x + 0.1 * k, Y + 0.07 + 0.2 * k, Z, 0, 0, -Math.PI / 2), GOLDC); sm.add(new THREE.TorusGeometry(0.045 * k, 0.01, 4, 8, Math.PI), M4(x - 0.1 * k, Y + 0.07 + 0.2 * k, Z, 0, 0, Math.PI / 2), GOLDC); }
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
    // a light line along the walls at the top of the tread plate (the menu's cyan, a pale one): an LED strip in an aluminium channel
    // (3 x 2 cm, in the wall's piece over it); its light on the plate under it is the room light's
    { const LM = new THREE.MeshBasicMaterial({ color: emi(0xbfe8ff, EMI.led) });
      const run = (P, ax, az, bx, bz, nx, nz) => { const L = Math.hypot(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, ry = nx ? nx * Math.PI / 2 : nz > 0 ? 0 : Math.PI;
        const l = new THREE.Mesh(new THREE.BoxGeometry(L, 0.018, 0.02), LM); l.position.set(cx + nx * 0.012, 1.01, cz + nz * 0.012); l.rotation.y = ry; P.root.add(l);
        use(P, METAL); box(cx + nx * 0.011, 1.019, cz + nz * 0.011, nx ? 0.022 : L, 0.03, nx ? L : 0.022, [0.5, 0.52, 0.55], [0.58, 0.6, 0.63]); };
      run(WALLS.back, x0, z0, x1, z0, 0, 1); run(WALLS.left, x0, -door - 0.4, x0, z0, 1, 0); run(WALLS.right, x1, z0, x1, -door - 0.4, -1, 0); }
    // a car under its cover in the front corner (a project waiting): the cover's shape measured on a car, draped to the floor, its folds
    { const PCC = use(piece()), v = Render.garageCar(Core.MODELS.find(m => m.id === 'kaze'), 0x888888, 0, false), P = bodyProbe(v), bb = P.bb, nx = 26, na = 22, pos = [], uv = [], idx = [];
      const R = Core.rng(9), wob = [], len = bb.max.x - bb.min.x; for (let i = 0; i <= nx; i++) wob.push(R());
      for (let i = 0; i <= nx; i++) {
        const t = i / nx, x = bb.min.x - 0.06 + t * (len + 0.12), xs = clamp(x, bb.min.x + 0.05, bb.max.x - 0.05), top = (P.top(xs, 0) || 0.9) + 0.035, end = Math.pow(Math.sin(Math.PI * clamp(t * 1.04 - 0.02, 0, 1)), 0.25);
        const hw = (P.side(xs, Math.min(top - 0.1, 0.62), 1) || bb.max.z) + 0.05;
        for (let jj = 0; jj <= na + 1; jj++) {   // (the ridge's row twice: each side's cloth has its own uv, the word upright from outside)
          const far = jj > na / 2, j = far ? jj - 1 : jj, a = j / na * Math.PI, sy = Math.sin(a), cz = Math.cos(a), fold = 0.012 * Math.sin(j * 1.7 + wob[i] * 6) * (1 - sy * 0.5);
          const ex = Math.pow(Math.abs(cz), 0.35) * Math.sign(cz), ey = Math.pow(sy, 0.6);
          const z = ex * (hw + 0.02 + 0.05 * (1 - ey)) * (0.75 + 0.25 * end), y = 0.03 + ey * (top - 0.03) * (0.82 + 0.18 * end) + fold;
          pos.push(x + (1 - end) * -Math.sign(t - 0.5) * 0.08 * (1 - ey), y, z + fold); uv.push(far ? 2 - t * 2 : t * 2, far ? 2 - j / na * 2 : j / na * 2);
        }
      }
      for (let i = 0; i < nx; i++) for (let j = 0; j <= na; j++) if (j !== na / 2) { const a = i * (na + 2) + j, b = a + na + 2; idx.push(a, b, a + 1, b, b + 1, a + 1); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      { const N = geo.attributes.normal, n = new V3(); for (let i = 0; i <= nx; i++) { const a = i * (na + 2) + na / 2; n.set(N.getX(a) + N.getX(a + 1), N.getY(a) + N.getY(a + 1), N.getZ(a) + N.getZ(a + 1)).normalize(); N.setXYZ(a, n.x, n.y, n.z); N.setXYZ(a + 1, n.x, n.y, n.z); } }   // (one normal along the ridge)
      const cloth = canvasTex(256, 256, (gx, w, h) => { gx.fillStyle = '#5a6272'; gx.fillRect(0, 0, w, h); for (let k = 0; k < 2200; k++) { gx.fillStyle = 'rgba(' + (R() < 0.5 ? '0,0,0,0.06' : '255,255,255,0.05') + ')'; gx.fillRect(R() * w, R() * h, 1 + R() * 3, 1); }
        for (let k = 0; k < 18; k++) { const y = R() * h; const gr = gx.createLinearGradient(0, y - 8, 0, y + 8); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); gx.fillStyle = gr; gx.fillRect(0, y - 8, w, 16); }
        gx.fillStyle = 'rgba(255,198,41,0.85)'; gx.font = 'italic 900 34px Roboto, Arial, sans-serif'; gx.textAlign = 'center'; gx.translate(w / 2, 140); gx.scale(0.72, 1); gx.fillText('APEX', 0, 0); }, true);   // (twice a side, clear of the ends)
      const cm = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: cloth, side: THREE.DoubleSide })); cm.position.set(-5.3, 0, 5.6); cm.rotation.y = 0.42; cm.castShadow = cm.receiveShadow = true; PCC.root.add(cm);
      BLOBS.push([-5.3, 5.6, len + 0.9, 2.6, 1, 0.42, PCC]);
      Render.garageFree(v); }
    // a kart on its stand in the front right corner (the team's first car): a dark tube frame on the stand's bars, the axles, slicks on small
    // rims, the nose and the side pods (moulded: black below, cyan above), a blank number panel, the seat's dark shell, the engine by the
    // seat (finned, its pipe round behind the seat to the silencer), the chain, the fuel tank, a rear bumper
    { const P = use(piece()), X = 6.15, Z = 6.35, Y = 0.56, FY = Y + 0.005, CYk = [0.2, 0.68, 0.92], WHk = [0.95, 0.95, 0.93], FR = [0.17, 0.18, 0.2], PL = [0.09, 0.09, 0.1];
      const K = (x, y, z) => [X + x, FY + y, Z + z], at = M4(X, FY, Z);
      // a side profile (x, y) moulded across z (width w, its edges rounded), narrower toward its top by tp and toward the front by tf
      const mould = (pts, w, tp, tf) => { const s = new THREE.Shape(), b = 0.02; pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
        const geo = new THREE.ExtrudeGeometry(s, { depth: w - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 1 }), Q = geo.attributes.position;
        let x0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < Q.count; i++) { x0 = Math.min(x0, Q.getX(i)); x1 = Math.max(x1, Q.getX(i)); y1 = Math.max(y1, Q.getY(i)); }
        for (let i = 0; i < Q.count; i++) Q.setZ(i, (Q.getZ(i) - (w / 2 - b)) * (1 - tp * Q.getY(i) / y1) * (1 - tf * (x1 - Q.getX(i)) / (x1 - x0)));
        geo.computeVertexNormals(); return geo; };
      for (const sx of [-0.55, 0.55]) { obox(g, [X + sx, 0, Z - 0.42], [X + sx, Y - 0.04, Z - 0.3], 0.05, 0.05, RED); obox(g, [X + sx, 0, Z + 0.42], [X + sx, Y - 0.04, Z + 0.3], 0.05, 0.05, RED); obox(g, [X + sx, Y - 0.04, Z - 0.34], [X + sx, Y - 0.04, Z + 0.34], 0.06, 0.06, RED); }
      // the frame: two rails, the bumper loop in front, cross members (the front beam, the kingpins on it), the pods' bars, the rear bumper
      for (const s of [-1, 1]) { seg(g, K(-0.86, 0, s * 0.24), K(0.74, 0, s * 0.24), 0.014, FR, 5); seg(g, K(-0.86, 0, s * 0.24), K(-1.0, 0.02, s * 0.12), 0.014, FR, 5);
        seg(g, K(-0.7, -0.02, s * 0.54), K(-0.7, 0.12, s * 0.54), 0.012, FR, 5); seg(g, K(0.74, 0, s * 0.24), K(0.88, 0.05, s * 0.32), 0.012, FR, 5); }
      for (const [x, y, w] of [[-1.0, 0.02, 0.12], [-0.7, 0, 0.54], [-0.05, 0, 0.5], [0.5, 0, 0.24]]) seg(g, K(x, y, -w), K(x, y, w), 0.014, FR, 5);
      gBox(g, at, 0.92, 0.06, 0, 0.08, 0.1, 1.3, PL);
      // the nose (its moulding narrower forward) and the blank number panel up on the column; the side pods between the wheels; the tank
      gAdd(g, mould([[-1.1, 0], [-0.8, 0], [-0.78, 0.07], [-0.86, 0.16], [-1.0, 0.14], [-1.12, 0.06]], 0.9, 0.12, 0.22), at, (c) => c[1] < 0.035 ? PL : CYk);
      gBox(g, M4(X - 0.5, FY + 0.19, Z, 0, 0, -0.5), 0, 0, 0, 0.02, 0.22, 0.3, WHk);
      for (const s of [-1, 1]) gAdd(g, mould([[-0.42, 0], [0.36, 0], [0.4, 0.09], [0.32, 0.14], [-0.25, 0.12], [-0.44, 0.05]], 0.16, 0.3, 0), M4(X, FY, Z + s * 0.48), (c) => c[1] < 0.04 ? PL : CYk);
      gl(SATIN); gBox(g, at, -0.42, 0.06, 0, 0.2, 0.12, 0.16, [0.8, 0.8, 0.76]);
      // the seat: a dark shell (its pan, the back laid back, the sides)
      gl(PAINT); const SE = [0.06, 0.06, 0.07]; gBox(g, M4(X + 0.12, FY + 0.06, Z, 0, 0, -0.1), 0, 0, 0, 0.3, 0.035, 0.32, SE); gBox(g, M4(X + 0.31, FY + 0.25, Z, 0, 0, -0.42), 0, 0, 0, 0.035, 0.42, 0.34, SE);
      for (const s of [-1, 1]) gBox(g, M4(X + 0.21, FY + 0.15, Z + s * 0.17, 0, 0, -0.25), 0, 0, 0, 0.34, 0.2, 0.025, SE);
      // the engine on the right of the seat: crankcase, the finned barrel, its head; the pipe round behind the seat into the silencer; the
      // chain to the sprocket on the rear axle
      gl(1.3); gBox(g, at, 0.42, 0.13, -0.3, 0.2, 0.14, 0.15, [0.45, 0.47, 0.5]); gAdd(g, new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), M4(X + 0.42, FY + 0.26, Z - 0.3), ALU);
      for (const y of [0.24, 0.29]) gAdd(g, new THREE.CylinderGeometry(0.075, 0.075, 0.012, 8), M4(X + 0.42, FY + y, Z - 0.3), ALU);
      gAdd(g, new THREE.CylinderGeometry(0.04, 0.045, 0.03, 6), M4(X + 0.42, FY + 0.335, Z - 0.3), PL);
      gl(METAL); tube(g, [K(0.47, 0.26, -0.33), K(0.58, 0.31, -0.3), K(0.76, 0.27, -0.16), K(0.8, 0.23, 0.04)], 0.026, [0.52, 0.44, 0.38], 10, 5);
      gAdd(g, new THREE.CylinderGeometry(0.05, 0.05, 0.24, 8), M4(X + 0.8, FY + 0.23, Z + 0.15, Math.PI / 2, 0, 0), [0.6, 0.62, 0.66]);
      seg(g, K(0.62, 0.07, -0.8), K(0.62, 0.07, 0.8), 0.02, STEEL, 6); gAdd(g, new THREE.CylinderGeometry(0.06, 0.06, 0.008, 10), M4(X + 0.62, FY + 0.07, Z - 0.39, Math.PI / 2, 0, 0), [0.3, 0.31, 0.33]);
      for (const y of [0.01, 0.13]) obox(g, K(0.42, 0.08 + (y - 0.07) * 0.5, -0.39), K(0.62, y, -0.39), 0.008, 0.012, DK);
      // the steering: the column, its wheel, the track rods to the kingpins
      seg(g, K(-0.52, 0.02, 0), K(-0.3, 0.42, 0), 0.012, STEEL, 5); for (const s of [-1, 1]) seg(g, K(-0.5, 0.04, 0), K(-0.66, 0.06, s * 0.52), 0.006, STEEL, 4);
      sm.add(new THREE.TorusGeometry(0.13, 0.016, 5, 14), M4(X - 0.29, FY + 0.43, Z, 0, Math.PI / 2, -0.6), [0.1, 0.1, 0.11]);
      // the wheels: slicks (the tyre's lathe scaled to a kart's), a small rim filling each
      gl(MATTE); for (const [x, r, w, tz] of [[-0.7, 0.13, 0.13, 0.62], [0.62, 0.14, 0.2, 0.66]]) for (const s of [-1, 1]) { const rs = r / 0.336, m = M4(X + x, FY + 0.07, Z + s * tz, Math.PI / 2, 0, 0);
        tyre(g, m.clone().multiply(M4(0, 0, 0, 0, 0, 0, rs, w / 0.24, rs)), null, 10, true);
        gAdd(g, new THREE.CylinderGeometry(0.215 * rs - 0.004, 0.215 * rs - 0.004, w * 0.8, 8), m, (c, n) => Math.abs(n[1]) > 0.5 ? [0.56, 0.58, 0.62] : [0.3, 0.31, 0.34]); }
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
    // race suits on a rail on the right wall (the team's colours, no marks), hanging clear of the bench under them; their boots in pairs
    // on the floor under the bench
    { use(WALLS.right, METAL); const X = 8.83, Y = 2.32;
      seg(g, [X, Y, 3.05], [X, Y, 4.75], 0.014, STEEL); for (const z of [3.1, 4.7]) seg(g, [x1 - 0.02, Y, z], [X, Y, z], 0.012, STEEL);
      const SN = [0.13, 0.17, 0.34]; [[SN, GOLD, CYAN], [SN, GOLD, CYAN], [WHITE, [0.82, 0.12, 0.1], SN], [[0.07, 0.07, 0.08], CYAN, GOLD]].forEach((v, i) => suit(cp, M4(X - 0.02, Y - 0.15, 3.35 + i * 0.4, 0, -Math.PI / 2 + (i % 2 ? 0.1 : -0.08), 0), v[0], v[1], v[2]));
      gl(SATIN); box(8.72, 0.42, 4.0, 0.38, 0.04, 1.4, PAL.wood, [0.5, 0.36, 0.22]); gl(PAINT); for (const z of [3.4, 4.6]) box(8.72, 0, z, 0.34, 0.42, 0.04, DK);
      gl(MATTE); for (const [z, dx] of [[3.68, 0], [4.02, -0.05], [4.36, 0.02]]) for (const e of [-1, 1]) { box(8.66 + dx, 0, z + e * 0.065, 0.26, 0.09, 0.09, [0.06, 0.06, 0.07]); box(8.74 + dx, 0, z + e * 0.065, 0.1, 0.17, 0.09, [0.06, 0.06, 0.07]); } }
    // spare bodywork on wall arms by the back corner: a rear wing standing on its edge (navy end plates, a gold edge); under it a front
    // wing lying on longer arms as it sits on a car (three elements, carbon end plates with a thin red edge); a spare nose along the wall
    // on two foam blocks (wide and low; navy, a red tip, a blank white plate on top)
    { use(WALLS.right, METAL); const X = x1 - 0.05, ZC = -4.05, S = 1.1, CB = [0.1, 0.11, 0.13];
      for (const z of [ZC - 0.4, ZC, ZC + 0.4]) for (const [y, l] of [[1.3, 0.56], [2.25, 0.24]]) { box(X - l / 2, y - 0.035, z, l, 0.035, 0.035, STEEL); box(X - 0.015, y - 0.2, z, 0.03, 0.2, 0.06, STEEL); }
      gl(PAINT); gAdd(g, foil(0.36, S, 0.05), M4(X - 0.17, 2.48, ZC, 0, 0, -Math.PI / 2), CB); gAdd(g, foil(0.17, S, 0.03), M4(X - 0.13, 2.74, ZC, 0, 0, -Math.PI / 2 + 0.25), CB);
      for (const sz of [-1, 1]) { gBox(g, null, X - 0.2, 2.55, ZC + sz * (S / 2 + 0.008), 0.3, 0.56, 0.014, NAVY); gBox(g, null, X - 0.2, 2.84, ZC + sz * (S / 2 + 0.01), 0.3, 0.025, 0.018, GOLD); }
      const FW = M4(X - 0.36, 1.315, ZC, 0, Math.PI, 0);   // (the front wing's frame: its nose to the room, the flaps rising toward the wall)
      for (const [c, x, y, a] of [[0.24, 0.07, 0.02, -0.08], [0.18, -0.12, 0.085, -0.32], [0.13, -0.25, 0.155, -0.55]]) gAdd(g, foil(c, S, 0.03), FW.clone().multiply(M4(x, y, 0, 0, 0, a)), CB);
      for (const sz of [-1, 1]) { gBox(g, null, X - 0.38, 1.4, ZC + sz * (S / 2 + 0.008), 0.56, 0.23, 0.014, CB); gBox(g, null, X - 0.38, 1.52, ZC + sz * (S / 2 + 0.01), 0.56, 0.016, 0.018, [0.78, 0.14, 0.1]); }
      gl(MATTE); for (const z of [ZC - 0.4, ZC, ZC + 0.4]) { box(X - 0.2, 2.25, z, 0.05, 0.02, 0.05, DK); box(X - 0.44, 1.3, z, 0.05, 0.012, 0.05, DK); }
      for (const z of [-4.36, -3.68]) box(8.62, 0, z, 0.44, 0.1, 0.14, [0.24, 0.25, 0.27]);   // (the foam blocks)
      // (the nose: a lathe from its back to its tip (the faces outward), its underside flattened, laid along the wall with its tip toward
      // the door; closed at both ends)
      const ng = new THREE.LatheGeometry([[0, -0.55], [1, -0.55], [1, -0.55], [0.95, -0.38], [0.87, -0.18], [0.74, 0.08], [0.55, 0.36], [0.4, 0.5], [0.26, 0.55], [0.26, 0.55], [0, 0.55]].map(q => new THREE.Vector2(q[0], q[1])), 14), np = ng.attributes.position;
      for (let i = 0; i < np.count; i++) if (np.getZ(i) > 0) np.setZ(i, np.getZ(i) * 0.15);
      ng.computeVertexNormals(); gl(PAINT);
      gAdd(g, ng, M4(8.62, 0.117, -4.0, Math.PI / 2, 0, 0, 0.25, 1, 0.11), (c) => c[1] > 0.47 ? [0.78, 0.14, 0.1] : c[1] < -0.54 ? CB : -c[2] > 0.9 * Math.hypot(c[0], c[2]) && c[1] > -0.2 && c[1] < 0.08 ? [0.9, 0.9, 0.88] : [0.14, 0.18, 0.34]);
      BLOBS.push([8.62, -4.0, 0.62, 1.25, 0.55, 0, WALLS.right]); }
    // the pit's air line: a reel under the roof by the back right corner, its hose dropping in a coil and on down to the bare set, the
    // last of it lying round the top of the far stack, the wheel gun resting on its rim, on its side (the bare set's piece: it hangs 2 m
    // out from the wall, where the wall's piece would not step aside; it goes with the trolley)
    { use(TB); const X = 6.95, Z = -3.3, Y = 4.34, YC = 3.7, YB = 2.4, HY = [0.95, 0.75, 0.12];
      gAdd(g, new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16), M4(X, Y, Z, 0, 0, Math.PI / 2), HY); for (const s of [-1, 1]) gBox(g, null, X + s * 0.09, (Y + 4.66) / 2, Z, 0.012, 4.66 - Y + 0.1, 0.1, DK);
      gl(MATTE); seg(g, [X, Y - 0.18, Z], [X + 0.07, YC, Z], 0.011, HY);
      const helix = new THREE.Curve(); helix.getPoint = (t, o) => (o || new V3()).set(X + 0.07 * Math.cos(t * 24 * Math.PI), YC - (YC - YB) * t, Z + 0.07 * Math.sin(t * 24 * Math.PI));
      gAdd(g, new THREE.TubeGeometry(helix, 72, 0.011, 4, false), null, HY);
      const S = new V3(-0.36, 0, 0).applyMatrix4(TBm), fe = Math.atan2(Z - S.z, X + 0.07 - S.x), fg = fe + 1.9, ring = (a) => [S.x + Math.cos(a) * 0.285, 0.632, S.z + Math.sin(a) * 0.285];   // (the far stack: its top 0.62)
      const G = M4(S.x + Math.cos(fg) * 0.11, 0.665, S.z + Math.sin(fg) * 0.11, 0, Math.PI - fg, Math.PI / 2), H = new V3(0, 0.16, -0.07).applyMatrix4(G).toArray(), L0 = ring(fe);   // (the gun: its barrel along a chord of the rim, the handle out)
      const hp = [[X + 0.07, YB, Z], [X + 0.06, YB - 0.3, Z + 0.01], [X + 0.02, 1.6, Z + 0.06], [L0[0] + 0.06, 0.95, L0[2] - 0.07], [L0[0] + 0.02, 0.7, L0[2] - 0.02], L0];
      for (let k = 1; k <= 6; k++) hp.push(ring(fe + k * 0.3)); hp.push(H);
      tube(g, hp, 0.011, HY, 56, 4);
      gl(PAINT); gAdd(g, new THREE.CylinderGeometry(0.045, 0.045, 0.24, 12), G.clone().multiply(M4(0, 0, 0, Math.PI / 2, 0, 0)), [0.07, 0.07, 0.08]); gBox(g, G.clone().multiply(M4(0, 0.09, -0.05, 0.3, 0, 0)), 0, 0, 0, 0.04, 0.14, 0.05, [0.07, 0.07, 0.08]);
      gAdd(g, new THREE.CylinderGeometry(0.048, 0.048, 0.03, 12), G.clone().multiply(M4(0, 0, 0.1, Math.PI / 2, 0, 0)), [0.78, 0.14, 0.1]);
      gl(METAL); gAdd(g, new THREE.CylinderGeometry(0.036, 0.036, 0.07, 6), G.clone().multiply(M4(0, 0, 0.155, Math.PI / 2, 0, 0)), PAL.chrome); }
    // the front wall: a clock over the lockers (the time the page opened), the team's whiteboard (a track sketched, the plan) over the
    // engineers' desk: three screens of telemetry on a pole, keyboards, a headset, the radios in their dock, a lamp; two stools; a water
    // cooler and a bin by the lockers
    { const P = use(WALLS.front), Zw = z1 - 0.04, now = new Date(), x2c = (c) => c.map(v => v * 1.95);   // (x2c: a floor thing's colour, the floor's occlusion halves it)
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
      // the TV over the sofa in the corner: its bezel close to the wall, its picture the telemetry too (the screens' material; a mesh of its
      // own: the desk's and the TV's in one would be one big sphere, in view, drawn, from the default view behind them); its lead in a duct
      // down the wall to a socket behind the sofa
      box(-6.55, 2.25, 8.925, 1.44, 0.82, 0.05, [0.035, 0.035, 0.04], [0.05, 0.05, 0.055]);
      gl(SATIN); box(-6.12, 1.12, 8.985, 0.06, 1.13, 0.03, [0.6, 0.61, 0.62]); box(-6.12, 1.05, 8.97, 0.09, 0.1, 0.04, [0.84, 0.85, 0.83]); gl(PAINT);
      { const scm = new THREE.MeshBasicMaterial({ map: monTexObj || monitorTex(), color: emi(0xffffff, EMI.screen) }), TP = [], TU = [];
        for (const k of [0, 2, 1, 0, 3, 2]) { const [x, y, u, v] = [[-7.25, 2.27, 1, 0], [-5.85, 2.27, 0, 0], [-5.85, 3.05, 0, 1], [-7.25, 3.05, 1, 1]][k]; TP.push(x, y, 8.895); TU.push(u, v); }
        for (const [A, B] of [[SP, SU], [TP, TU]]) { const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(A, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(B, 2)); sg.computeBoundingSphere(); P.root.add(new THREE.Mesh(sg, scm)); } }
      // on the desk: two keyboards, a headset, the radios in their dock, papers and a clipboard, an architect lamp (lit: its warm pool on
      // the desk)
      gl(SATIN); for (const [x, z] of [[2.95, 8.32], [3.85, 8.34]]) { box(x, 0.8, z, 0.44, 0.02, 0.14, [0.09, 0.09, 0.1]); box(x, 0.82, z, 0.42, 0.004, 0.12, [0.16, 0.16, 0.17]); }
      gAdd(g, new THREE.TorusGeometry(0.09, 0.012, 5, 12, Math.PI), M4(3.4, 0.81, 8.5, -Math.PI / 2 + 0.2, 0, 0.4), [0.08, 0.08, 0.09]);
      for (const s of [-1, 1]) gAdd(g, new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), M4(3.4 + s * 0.08, 0.83, 8.5 - s * 0.035, 0, 0, Math.PI / 2 + s * 0.4), [0.06, 0.06, 0.07]);
      box(4.4, 0.8, 8.36, 0.32, 0.05, 0.12, [0.12, 0.12, 0.13]); for (let i = 0; i < 4; i++) { const x = 4.28 + i * 0.08; box(x, 0.83, 8.36, 0.05, 0.16, 0.03, [0.1, 0.1, 0.11]); box(x + 0.012, 0.99, 8.36, 0.01, 0.07, 0.01, DK); box(x - 0.01, 0.935, 8.346, 0.022, 0.012, 0.004, [0.4, 2.2, 0.6]); }
      const sheet = (x, z, w, d, r, y, col) => { const c = Math.cos(r), s = Math.sin(r), Q = (a, b) => [x + a * c - b * s, y, z + a * s + b * c]; g.quadO(Q(-w / 2, -d / 2), Q(w / 2, -d / 2), Q(w / 2, d / 2), Q(-w / 2, d / 2), col, [x, y - 1, z]); };
      gl(MATTE); sheet(3.0, 8.55, 0.21, 0.297, 0.1, 0.802, [0.9, 0.9, 0.88]); sheet(3.04, 8.57, 0.21, 0.297, 0.28, 0.804, [0.93, 0.93, 0.9]); sheet(3.7, 8.6, 0.21, 0.297, -0.2, 0.802, [0.9, 0.9, 0.88]);
      gl(SATIN); box(2.5, 0.8, 8.5, 0.23, 0.008, 0.32, [0.42, 0.3, 0.18], [0.46, 0.33, 0.2], 0.15); sheet(2.5, 8.49, 0.2, 0.27, 0.15, 0.809, [0.92, 0.92, 0.9]);
      gl(METAL); box(2.5 - 0.15 * Math.sin(0.15), 0.808, 8.5 + 0.14 * Math.cos(0.15), 0.08, 0.012, 0.03, STEEL, STEEL, 0.15);
      // (the lamp: a dark base, two arms, the shade turned down toward the room, the warm lamp in its mouth)
      gl(PAINT); World.cyl(g, 4.62, 0.8, 8.72, 0.075, 0.025, 8, DK, [0.1, 0.1, 0.11]); obox(g, [4.62, 0.82, 8.72], [4.55, 1.31, 8.72], 0.018, 0.018, DK); obox(g, [4.55, 1.31, 8.72], [4.2, 1.21, 8.47], 0.016, 0.016, DK);
      gAdd(g, new THREE.ConeGeometry(0.075, 0.13, 10, 1, true), M4(4.18, 1.17, 8.45, 0.45, 0, 0), [0.1, 0.1, 0.11]);
      gl(MATTE); gAdd(g, new THREE.CircleGeometry(0.069, 10), M4(4.18, 1.119, 8.425, 2.022, 0, 0), [2.4, 2.0, 1.4]);
      { const W0 = [0.16, 0.17, 0.19], WC = [0.56, 0.46, 0.32], cx = 4.17, cz = 8.29; for (let k = 0; k < 8; k++) { const a0 = k / 8 * TAU, a1 = (k + 1) / 8 * TAU, P = (a) => [cx + Math.cos(a) * 0.22, 0.8015, cz + Math.sin(a) * 0.13];
        g.triO([cx, 0.8015, cz], P(a0), P(a1), WC, [cx, 0, cz], W0, W0); } }
      // (the leads: two from the pedestal along the floor and up the coving (on it: CV, its curve's points out from the wall) into a box on
      // the wall; a data cable from under the desk across the floor under a striped cable ramp to an outlet by the lockers)
      const CV = (x, dx) => [[x, 0.008, 8.86], [x - dx * 0.2, 0.012, 8.93], [x - dx * 0.4, 0.04, 8.975], [x - dx * 0.7, 0.1, 8.982], [x - dx, 0.16, 8.982]];
      gl(MATTE); for (const e of [0, 0.03]) tube(g, [[2.12, 0.05, 8.7 + e], [2.04, 0.008, 8.68 + e], [1.86, 0.008, 8.72 + e]].concat(CV(1.78 - e, 0.015)), 0.008, x2c(DK), 9, 3);
      gl(PAINT); box(1.75, 0.15, 8.97, 0.14, 0.18, 0.06, [0.5, 0.52, 0.55], [0.56, 0.58, 0.6]);
      gl(MATTE); tube(g, [[2.6, 0.26, 8.82], [2.58, 0.008, 8.66], [2.57, 0.008, 8.1], [2.4, 0.008, 7.62], [2.2, 0.008, 7.55]], 0.007, x2c([0.3, 0.31, 0.34]), 7, 3);
      tube(g, [[1.0, 0.008, 7.55], [0.7, 0.008, 7.62], [0.52, 0.008, 7.9], [0.5, 0.008, 8.5]].concat(CV(0.5, 0)), 0.007, x2c([0.3, 0.31, 0.34]), 10, 3);
      gl(PAINT); box(0.5, 0.1, 8.97, 0.1, 0.14, 0.06, [0.5, 0.52, 0.55], [0.56, 0.58, 0.6]);
      { const YB = x2c([0.85, 0.66, 0.12]), KB = x2c([0.05, 0.05, 0.055]), xa = 1.0, xb = 2.2, zc = 7.55, h = 0.03, ta = 0.06, tb = 0.125, sk = 0.06, inn = [1.6, -1, zc];
        for (let i = 0, u = xa - 0.1; u < xb; i++, u += 0.1) { const c = (v) => clamp(v, xa, xb); g.quadO([c(u), h, zc - ta], [c(u + 0.1), h, zc - ta], [c(u + 0.1 + sk), h, zc + ta], [c(u + sk), h, zc + ta], i % 2 ? YB : KB, inn); }
        for (const s of [-1, 1]) g.quadO([xa, h, zc + s * ta], [xb, h, zc + s * ta], [xb, 0.002, zc + s * tb], [xa, 0.002, zc + s * tb], KB, inn);
        for (const x of [xa, xb]) g.quadO([x, 0.002, zc - tb], [x, h, zc - ta], [x, h, zc + ta], [x, 0.002, zc + tb], KB, [1.6, 0, zc]); }
      // two stools (navy seats on gas columns, five legs, a foot ring; as few faces as reads from across the room)
      for (const [x, z] of [[2.9, 7.75], [4.1, 7.8]]) { gl(PAINT); gAdd(g, new THREE.CylinderGeometry(0.19, 0.19, 0.07, 12), M4(x, 0.72, z), [0.13, 0.17, 0.25]);
        gl(METAL); seg(g, [x, 0.1, z], [x, 0.69, z], 0.022, CHROME, 6); gAdd(g, new THREE.TorusGeometry(0.2, 0.012, 3, 12), M4(x, 0.3, z, Math.PI / 2, 0, 0), CHROME);
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3; seg(g, [x, 0.1, z], [x + Math.cos(a) * 0.3, 0.05, z + Math.sin(a) * 0.3], 0.014, [0.2, 0.21, 0.23], 4); }
        gl(MATTE); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3; gAdd(g, new THREE.CylinderGeometry(0.03, 0.03, 0.024, 6), M4(x + Math.cos(a) * 0.3, 0.03, z + Math.sin(a) * 0.3, Math.PI / 2, 0, a), DK); } }
      // a water cooler (its bottle glossy, the taps red and blue), a dark green wheelie bin
      gl(PAINT); box(0.75, 0, 8.7, 0.32, 1.0, 0.32, [0.86, 0.86, 0.84], [0.8, 0.8, 0.78]); box(0.75, 0.62, 8.535, 0.2, 0.18, 0.01, [0.3, 0.31, 0.33]);
      for (const [s, c] of [[-1, [0.78, 0.14, 0.1]], [1, [0.18, 0.36, 0.78]]]) box(0.75 + s * 0.05, 0.72, 8.53, 0.03, 0.05, 0.03, c);
      sm.add(new THREE.CylinderGeometry(0.14, 0.14, 0.36, 16), M4(0.75, 1.22, 8.7), [0.45, 0.7, 0.95]); sm.add(new THREE.CylinderGeometry(0.14, 0.05, 0.05, 16), M4(0.75, 1.025, 8.7), [0.45, 0.7, 0.95]);
      box(1.4, 0.05, 8.6, 0.48, 0.9, 0.55, [0.16, 0.26, 0.2], [0.13, 0.22, 0.17]); box(1.4, 0.95, 8.58, 0.5, 0.04, 0.6, [0.14, 0.24, 0.18]); box(1.4, 0.93, 8.88, 0.5, 0.04, 0.04, [0.1, 0.18, 0.13]);
      gl(MATTE); for (const s of [-1, 1]) cylA(g, [1.4 + s * 0.2, 0.08, 8.82], 'x', 0.08, 0.05, 10, DK);
      BLOBS.push([3.35, z1 - 0.45, 3.0, 1.0, 0.7, 0, P], [3.5, 7.78, 1.8, 0.7, 0.5, 0, P], [1.1, z1 - 0.35, 1.3, 0.8, 0.8, 0, P]); }
    buildKitL(); buildKitR(); buildKitF();   // (round 2: each zone's new things, into the pieces before they are finished)
    // the floor's soft shadows under the things standing on it (along the foot of the walls: the room light's) and a few old oil stains:
    // one mesh over the floor, its pictures in one atlas (TX.decal); as a piece fades out, its blobs step down to lighter shades
    { const P = [], U = [], I = [], live = new Map();
      // (cell c's corners, the empty one's a texel; ua, ub: how far across the cell its corners 0 and 3, 1 and 2 lie, a part of a cell)
      const set = (i, c, ua, ub) => { const u = (c % 4) / 4, v = 1 - ((c >> 2) + 1) / 4, e = c === 11 ? 0 : 0.25, o = c === 11 ? 0.125 : 0, A = ua == null ? 0 : ua, B = ub == null ? 1 : ub;
        [[A, 0], [B, 0], [B, 1], [A, 1]].forEach(([a, b], k) => { U[(i + k) * 2] = u + o + a * e; U[(i + k) * 2 + 1] = v + o + b * e; }); };
      const quad = (x, z, w, d, ry, c) => { const i = P.length / 3, cs = Math.cos(ry), sn = Math.sin(ry), y = c > 11 ? 0.007 : 0.008;
        for (const [a, b] of [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]) { P.push(x + a * cs + b * sn, y, z - a * sn + b * cs); U.push(0, 0); }
        I.push(i, i + 2, i + 1, i, i + 3, i + 2); set(i, c); return i; };
      const shade = (k) => Math.round(clamp(k, 0, 1) * 11) - 1;   // (-1: none)
      const add = (p, e) => { if (!live.has(p)) live.set(p, []); live.get(p).push(e); };
      for (const [x, z, w, d, k, ry, p] of BLOBS) add(p, [quad(x, z, w, d, ry || 0, Math.max(0, shade(k))), k]);
      [[-5.6, -1.6, 1.1], [4.6, 2.2, 0.8], [6.9, -1.95, 1.0], [-6.8, 3.4, 0.9]].forEach(([x, z, s], j) => quad(x, z, s, s, x, 12 + j));
      // the walls' contact shadows behind what stands tall against them (WALLAO; the furniture's here, the kits push their own): on the
      // wall's plane 3 mm out, a cell's middle at the thing's foot (darkest there, gone by its top), even along it, soft round its ends
      // (a cell's half a cap at each end, its middle column stretched between them)
      WALLAO.push(['b', -7.6, -6.0, 0, 1.25, 0.6, WALLS.back], ['b', -5.95, -4.95, 0, 0.95, 0.5, WALLS.back], ['b', -4.3, -0.9, 0, 1.0, 0.45, WALLS.back],
        ['f', -3.3, 0.4, 0, 2.0, 0.55, WALLS.front], ['f', 1.9, 4.8, 0, 1.0, 0.4, WALLS.front]);
      const WP = { b: [0, 1, z0], f: [0, -1, z1], l: [1, 0, x0], r: [-1, 0, x1] };   // (each wall's inward normal and plane)
      const wquad = (wl, sA, uA, sB, uB, y0, hh, c) => { const [nx, nz, pc] = WP[wl], i = P.length / 3, rs = nx ? -nx : nz, aR = (rs > 0) === (sA > sB);   // (corners 0, 3 at the end to the right seen from the room)
        const sR = aR ? sA : sB, sL = aR ? sB : sA, ua = aR ? uA : uB, ub = aR ? uB : uA, at = (s, y) => { if (nx) P.push(pc + nx * 0.003, y, s); else P.push(s, y, pc + nz * 0.003); U.push(0, 0); };
        at(sR, y0 - hh); at(sL, y0 - hh); at(sL, y0 + hh); at(sR, y0 + hh); I.push(i, i + 2, i + 1, i, i + 3, i + 2); set(i, c, ua, ub); return [i, ua, ub]; };
      for (const [wl, a, b, y0, y1, k, p] of WALLAO) { const lo = Math.min(a, b), hi = Math.max(a, b), m = Math.min(0.15, (hi - lo) / 2), um = 0.5 * (0.15 + m) / 0.3, hh = Math.max(0.15, (y1 - y0) * 1.1), c = Math.max(0, shade(k));
        const parts = [[lo - 0.15, 0, lo + m, um], [hi - m, um, hi + 0.15, 0]]; if (hi - lo > 2 * m + 1e-3) parts.push([lo + m, 0.5, hi - m, 0.5]);
        for (const [sA, uA, sB, uB] of parts) { const [i, ua, ub] = wquad(wl, sA, uA, sB, uB, y0, hh, c); add(p, [i, k, ua, ub]); } }
      const geo = new THREE.BufferGeometry(), ua = new THREE.Float32BufferAttribute(U, 2).setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', ua); geo.setIndex(I); geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: TX.decal, transparent: true, depthWrite: false })); m.renderOrder = -2; scene.add(mainOnly(m));
      // (a piece's fade, through its fades: its blobs a shade lighter with each step, the empty cell when it is gone)
      for (const [p, list] of live) p.fades.push({ userData: { op: 1 }, set opacity(o) { if (o === this.o) return; this.o = o;
        for (const [i, k, u0, u1] of list) { const s = shade(k * o); set(i, s < 0 ? 11 : s, u0, u1); } ua.array.set(U); ua.needsUpdate = true; } }); }
    finishPieces(); g = sm = cp = null;   // (the fades' closures keep this scope: not the builders)
  }
  // the left zone's new things (round 2): the tyre service corner, the bench's tools, the drivetrain, the left wall
  function buildKitL() {
    const { x0, z0 } = ROOM, { back: PB, left: PL } = WALLS;
    let g = null, sm = null, cp = null; const use = (p, k) => { g = p.g; sm = p.sm; cp = p; gloss(p, k == null ? PAINT : k); return p; }, gl = (k) => gloss(cp, k), box = (...a) => fbox(g, ...a);
    const DK = PAL.dk, DG = [0.17, 0.175, 0.19], GR = [0.3, 0.31, 0.34], STL = PAL.steel, CHR = PAL.chrome, RD = PAL.red, WH = [0.88, 0.88, 0.86], LIT = [2.0, 2.0, 1.9];   // (the blacks, the steel, the chrome: the room's palette's)
    // helpers: a box standing on something (no bottom), a cylinder along an axis, a shape by a matrix, a quad facing n, a disc's fan facing
    // n (u, v: its axes), a stroke from a to b in the plane facing n, a sheet round an axis along x (both faces; angles from +z up), an open
    // funnel round y (its outside, its inside), a coil spring along x
    const sb = (cx, cy, cz, sx, sy, sz, col, top, rot) => World.box(g, cx, cy, cz, sx, sy, sz, rot || 0, col, top, true);
    const cyl = (c, ax, r, l, n, col, cap) => cylA(g, c, ax, r, l, n, col, cap), shape = (geo, m, col) => gAdd(g, geo, m, col);
    const quad = (a, b, c, d, col, n) => g.quadO(a, b, c, d, col, [(a[0] + c[0]) / 2 - n[0], (a[1] + c[1]) / 2 - n[1], (a[2] + c[2]) / 2 - n[2]]);
    const fan = (c, u, v, r, n, col, nr) => { const P = (a) => [0, 1, 2].map(k => c[k] + (u[k] * Math.cos(a) + v[k] * Math.sin(a)) * r);
      for (let i = 0; i < n; i++) g.triO(c, P(i / n * TAU), P((i + 1) / n * TAU), col, [c[0] - nr[0], c[1] - nr[1], c[2] - nr[2]]); };
    const stroke = (a, b, w, col, nr) => { const s = new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).cross(new V3(...nr)).normalize().multiplyScalar(w / 2);
      quad([a[0] - s.x, a[1] - s.y, a[2] - s.z], [a[0] + s.x, a[1] + s.y, a[2] + s.z], [b[0] + s.x, b[1] + s.y, b[2] + s.z], [b[0] - s.x, b[1] - s.y, b[2] - s.z], col, nr); };
    const shell = (cy, cz, r, xa, xb, a0, a1, n, col) => { const P = (x, a) => [x, cy + Math.sin(a) * r, cz + Math.cos(a) * r];
      for (let i = 0; i < n; i++) { const A = a0 + (a1 - a0) * i / n, B = a0 + (a1 - a0) * (i + 1) / n, m = (A + B) / 2, q = [P(xa, A), P(xb, A), P(xb, B), P(xa, B)];
        g.quadO(...q, col, [(xa + xb) / 2, cy, cz]); g.quadO(...q, col, [(xa + xb) / 2, cy + Math.sin(m) * r * 3, cz + Math.cos(m) * r * 3]); } };
    const funnel = (cx, cz, r0, r1, y0, y1, n, co, ci) => { const P = (a, r, y) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      for (let i = 0; i < n; i++) { const A = i / n * TAU, B = (i + 1) / n * TAU, m = (A + B) / 2, q = [P(A, r0, y0), P(B, r0, y0), P(B, r1, y1), P(A, r1, y1)];
        g.quadO(...q, co, [cx, (y0 + y1) / 2, cz]); g.quadO(...q, ci, P(m, (r0 + r1) * 2, (y0 + y1) / 2)); } };
    const ringX = (x, cy, cz, r0, r1, n, col, s) => { for (let i = 0; i < n; i++) { const A = i / n * TAU, B = (i + 1) / n * TAU, P = (a, r) => [x, cy + Math.sin(a) * r, cz + Math.cos(a) * r]; g.quadO(P(A, r0), P(B, r0), P(B, r1), P(A, r1), col, [x - s, cy, cz]); } };
    const spring = (xa, xb, y, z, R, turns, r, col) => { const c = new THREE.Curve(); c.getPoint = (t, o) => (o || new V3()).set(xa + (xb - xa) * t, y + R * Math.cos(t * turns * TAU), z + R * Math.sin(t * turns * TAU));
      shape(new THREE.TubeGeometry(c, Math.round(turns * 5), r, 3, false), null, col); };

    // a tyre changer at the bench's end, a slick on it being changed: its cabinet (slate blue, a dark kick strip, the front's panel, three
    // pedals), the turntable and its jaws (the wheel up on them), the column tilted back to the wall, its arm and the hex shaft with the
    // mount head at the rim's edge; the bead breaker folded shut on the cabinet's side, its rubber pad
    { use(PB); const X = -0.505, Z = -4.525, SL = [0.2, 0.25, 0.33], SLT = [0.26, 0.31, 0.4], m = M4(-0.5, 0.896, -4.5, 0, 0.4, 0, 0.88);
      sb(X, 0, Z, 0.73, 0.06, 0.73, DK); sb(X, 0.06, Z, 0.75, 0.34, 0.75, SL); sb(X, 0.4, Z, 0.75, 0.3, 0.75, SL, SLT);
      quad([X - 0.33, 0.12, Z + 0.3755], [X + 0.33, 0.12, Z + 0.3755], [X + 0.33, 0.6, Z + 0.3755], [X - 0.33, 0.6, Z + 0.3755], [0.17, 0.215, 0.29], [0, 0, 1]);
      for (const [x, a] of [[-0.66, 0.16], [-0.5, 0.12], [-0.34, 0.16]]) gBox(g, M4(x, 0.05, -4.11, a, 0, 0), 0, 0, 0, 0.07, 0.022, 0.12, DK);
      gl(METAL); shape(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16), M4(-0.5, 0.72, -4.5), STL);
      for (let k = 0; k < 4; k++) gBox(g, M4(-0.5, 0.765, -4.5, 0, k * Math.PI / 2 + 0.4, 0), 0, 0, 0.2, 0.05, 0.05, 0.1, DG);
      gl(PAINT); gBox(g, null, -0.5, 0.75, -4.84, 0.18, 0.1, 0.16, [0.2, 0.21, 0.24]);   // (the column's pivot)
      obox(g, [-0.5, 0.79, -4.827], [-0.5, 1.85, -4.912], 0.14, 0.12, RD); gBox(g, null, -0.5, 1.83, -4.9, 0.16, 0.14, 0.18, RD);
      obox(g, [-0.5, 1.83, -4.82], [-0.5, 1.83, -4.6], 0.075, 0.075, RD); gBox(g, null, -0.5, 1.81, -4.645, 0.1, 0.13, 0.1, RD);   // the arm, its lock
      gl(METAL); cyl([-0.5, 1.385, -4.66], 'y', 0.022, 0.72, 6, STL);
      gl(PAINT); gBox(g, M4(-0.5, 1.03, -4.665, 0.35, 0, 0), 0, 0, 0, 0.05, 0.05, 0.09, DK);   // (the head)
      gl(MATTE); sb(-0.883, 0.27, -4.37, 0.006, 0.24, 0.2, DK);
      gl(PAINT); obox(g, [-0.894, 0.42, -4.86], [-0.894, 0.45, -4.32], 0.012, 0.05, RD); gBox(g, null, -0.894, 0.37, -4.34, 0.012, 0.11, 0.09, DK);
      obox(g, [-0.894, 0.45, -4.32], [-0.894, 0.86, -4.25], 0.03, 0.014, RD); gl(MATTE); obox(g, [-0.894, 0.78, -4.263], [-0.894, 0.88, -4.246], 0.036, 0.018, DK);
      tyre(g, m, BANDS[0], 12, true); gl(METAL); rimTop(g, m, [0.62, 0.64, 0.68]);
      BLOBS.push([-0.5, -4.52, 0.95, 0.95, 0.75, 0, PB]); WALLAO.push(['b', -0.93, -0.08, 0, 1.92, 0.5, PB]); }

    // a wheel balancer beside it: its body (a dark plinth, the front's panel, a brake pedal, a tray of clip weights on top), the console
    // sloped at the back (a lit screen, two red readouts, keys), the shaft out of its side (its flange, the cone, the wheel, the wing nut),
    // the hood swung up out of the way. Graphite, its screen dim: it stands right behind the car's windscreen in the first view
    { use(PB); const X = 0.225, Z = -4.635, LG = [0.28, 0.29, 0.32], LGT = [0.32, 0.33, 0.36], CON = [0.1, 0.1, 0.11], cm = M4(X, 1.0, -4.78, -0.5, 0, 0);
      sb(X, 0, Z, 0.53, 0.05, 0.51, DK); sb(X, 0.05, Z, 0.55, 0.35, 0.53, LG); sb(X, 0.4, Z, 0.55, 0.45, 0.53, LG, LGT);
      quad([X - 0.24, 0.1, Z + 0.2655], [X + 0.24, 0.1, Z + 0.2655], [X + 0.24, 0.62, Z + 0.2655], [X - 0.24, 0.62, Z + 0.2655], [0.33, 0.34, 0.37], [0, 0, 1]);
      gBox(g, M4(X - 0.12, 0.06, Z + 0.3, 0.15, 0, 0), 0, 0, 0, 0.08, 0.02, 0.1, DK);
      sb(X - 0.04, 0.85, -4.54, 0.4, 0.012, 0.22, [0.25, 0.26, 0.29]);
      gl(METAL); for (let i = 0; i < 6; i++) sb(X - 0.16 + (i % 3) * 0.13, 0.862, -4.6 + (i >= 3 ? 0.1 : 0), 0.04, 0.012, 0.018, i % 3 ? [0.62, 0.64, 0.68] : GR, null, (i * 0.7) % 1 - 0.5);
      gl(PAINT); sb(X, 0.85, -4.79, 0.22, 0.06, 0.1, CON); gBox(g, cm, 0, 0, 0, 0.42, 0.28, 0.05, CON);
      const pq = (x, y, w, h, col) => { const P = (a, b) => new V3(x + a, y + b, 0.0255).applyMatrix4(cm).toArray(); g.quadO(P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2), col, new V3(x, y, -1).applyMatrix4(cm).toArray()); };
      pq(0, 0.035, 0.24, 0.13, [0.25, 0.7, 1.0]); for (const s of [-1, 1]) pq(s * 0.13, -0.085, 0.07, 0.035, [1.2, 0.25, 0.2]);   // (the readouts over 1: a faint glow)
      for (let i = 0; i < 4; i++) pq(-0.045 + i * 0.03, -0.09, 0.018, 0.018, GR);
      gl(METAL); cyl([0.665, 0.62, -4.55], 'x', 0.022, 0.33, 8, STL); cyl([0.515, 0.62, -4.55], 'x', 0.065, 0.03, 12, [0.2, 0.21, 0.23]);
      shape(new THREE.CylinderGeometry(0.03, 0.06, 0.05, 10), M4(0.555, 0.62, -4.55, 0, 0, -Math.PI / 2), STL);
      gl(MATTE); tyre(g, M4(0.66, 0.62, -4.55, 0, 0, Math.PI / 2, 0.88), null, 12, true);
      gl(METAL); cyl([0.66, 0.62, -4.55], 'x', 0.19, 0.17, 14, [0.3, 0.31, 0.34], [0.58, 0.6, 0.64]); cyl([0.748, 0.62, -4.55], 'x', 0.055, 0.008, 8, [0.2, 0.21, 0.23]);
      cyl([0.79, 0.62, -4.55], 'x', 0.032, 0.04, 8, [0.62, 0.64, 0.68]); for (const s of [-1, 1]) gBox(g, null, 0.795, 0.62 + s * 0.045, -4.55, 0.012, 0.05, 0.02, [0.62, 0.64, 0.68]);
      gl(PAINT); shell(0.66, -4.58, 0.36, 0.53, 0.79, 1.4, 4.0, 8, [0.15, 0.16, 0.18]); cyl([0.515, 0.6, -4.87], 'x', 0.02, 0.05, 6, DK);   // (the hood, its hinge)
      BLOBS.push([0.3, -4.62, 0.95, 0.75, 0.65, 0, PB]); WALLAO.push(['b', -0.07, 0.82, 0, 1.15, 0.45, PB]); }

    // on the bench's stainless top, each in its place: a vice at its left end, spray cans by the wall, two coil-over dampers (gold bodies,
    // a red and a blue spring), a brake disc and its caliper in an aluminium tray, a bench grinder, a drill press at its right end; a roll
    // of blue paper on the wall under the bins
    { use(PB); const Y = 0.76, VC = [0.22, 0.27, 0.35], VC2 = [0.18, 0.22, 0.29], AU = [0.75, 0.58, 0.2];
      sb(-3.95, Y, -4.5, 0.15, 0.02, 0.17, VC2); sb(-3.95, Y + 0.02, -4.51, 0.18, 0.12, 0.13, VC); sb(-3.95, Y + 0.035, -4.37, 0.18, 0.105, 0.06, VC); sb(-3.95, Y + 0.035, -4.42, 0.07, 0.05, 0.06, VC2);
      gl(METAL); sb(-3.95, Y + 0.1, -4.4425, 0.17, 0.04, 0.005, STL); sb(-3.95, Y + 0.1, -4.4025, 0.17, 0.04, 0.005, STL);
      cyl([-3.95, Y + 0.085, -4.315], 'z', 0.01, 0.05, 6, STL); cyl([-3.95, Y + 0.085, -4.29], 'x', 0.007, 0.2, 6, STL); for (const s of [-1, 1]) sb(-3.95 + s * 0.1, Y + 0.077, -4.29, 0.018, 0.016, 0.016, STL);
      gl(PAINT); [[-3.62, WH, [0.7, 0.12, 0.1]], [-3.55, [0.62, 0.64, 0.68], [0.15, 0.3, 0.6]], [-3.48, [0.84, 0.84, 0.82], DK]].forEach(([x, b, c]) => { cyl([x, Y + 0.1, -4.86], 'y', 0.033, 0.2, 8, b, [0.7, 0.72, 0.75]); cyl([x, Y + 0.215, -4.86], 'y', 0.026, 0.03, 6, c); });
      const damper = (xa, xb, sc) => { const y = Y + 0.05, z = -4.56;
        gl(PAINT); for (const x of [xa + 0.012, xb - 0.012]) sb(x, y - 0.016, z, 0.024, 0.032, 0.03, [0.15, 0.15, 0.16]);   // (its eyes)
        gl(METAL); cyl([xa + 0.125, y, z], 'x', 0.025, 0.2, 8, AU); cyl([xa + 0.085, y, z], 'x', 0.047, 0.01, 8, AU); cyl([xb - 0.06, y, z], 'x', 0.047, 0.012, 8, AU);
        cyl([(xa + 0.225 + xb - 0.024) / 2, y, z], 'x', 0.008, xb - 0.024 - xa - 0.225, 5, CHR);
        gl(PAINT); spring(xa + 0.09, xb - 0.066, y, z, 0.04, 4.5, 0.007, sc); };
      damper(-3.42, -3.07, [0.62, 0.12, 0.1]); damper(-2.98, -2.63, [0.25, 0.55, 0.75]);
      gl(METAL); sb(-2.45, Y, -4.78, 0.36, 0.03, 0.26, [0.62, 0.64, 0.68], [0.5, 0.52, 0.56]);
      shape(new THREE.CylinderGeometry(0.115, 0.115, 0.024, 16), M4(-2.49, Y + 0.042, -4.78), (c, n) => n[1] > 0.5 ? [0.52, 0.52, 0.54] : [0.32, 0.32, 0.34]);
      shape(new THREE.CylinderGeometry(0.06, 0.065, 0.036, 10), M4(-2.49, Y + 0.072, -4.78), [0.28, 0.28, 0.3]);
      for (const [x, z] of [[-2.33, -4.69], [-2.31, -4.73], [-2.34, -4.87]]) cyl([x, Y + 0.035, z], 'y', 0.012, 0.01, 6, [0.5, 0.52, 0.55]);
      gl(PAINT); gBox(g, M4(-2.49, Y + 0.075, -4.78, 0, -0.5, 0), 0.1, 0, 0, 0.05, 0.05, 0.12, [0.7, 0.12, 0.1]);
      const GRD = [0.36, 0.38, 0.42], GY = Y + 0.12;   // (the grinder)
      sb(-1.85, Y, -4.62, 0.17, 0.025, 0.15, DK); sb(-1.85, Y + 0.025, -4.62, 0.07, 0.04, 0.07, GRD); cyl([-1.85, GY, -4.62], 'x', 0.068, 0.2, 10, GRD, [0.3, 0.32, 0.36]);
      sb(-1.85, Y + 0.004, -4.54, 0.04, 0.02, 0.012, [0.7, 0.12, 0.1]);
      gl(METAL); cyl([-1.85, GY, -4.62], 'x', 0.012, 0.38, 6, STL); for (const x of [-2.02, -1.68]) sb(x, GY - 0.04, -4.505, 0.04, 0.008, 0.04, STL);
      gl(MATTE); for (const x of [-2.02, -1.68]) cyl([x, GY, -4.62], 'x', 0.09, 0.026, 12, [0.28, 0.28, 0.3], [0.38, 0.37, 0.35]);
      gl(PAINT); for (const x of [-2.02, -1.68]) shell(GY, -4.62, 0.102, x - 0.022, x + 0.022, -0.35, Math.PI + 0.35, 6, GRD);
      const DP = [0.26, 0.33, 0.3], DPT = [0.3, 0.37, 0.34];   // (the drill press)
      sb(-1.3, Y, -4.76, 0.25, 0.03, 0.34, DP, DPT); sb(-1.3, 0.94, -4.765, 0.06, 0.03, 0.12, DP); cyl([-1.3, 0.975, -4.67], 'y', 0.12, 0.022, 12, DP, DPT);
      sb(-1.3, 1.24, -4.75, 0.2, 0.26, 0.4, DP, DPT); sb(-1.3, 1.5, -4.79, 0.17, 0.07, 0.3, DP, DPT);
      sb(-1.36, 1.4, -4.548, 0.025, 0.025, 0.006, [0.8, 0.12, 0.1]); sb(-1.36, 1.36, -4.548, 0.025, 0.025, 0.006, [0.15, 0.6, 0.25]);
      gl(METAL); cyl([-1.3, 1.145, -4.85], 'y', 0.035, 0.71, 8, STL); cyl([-1.3, 1.16, -4.66], 'y', 0.026, 0.16, 8, STL);
      shape(new THREE.CylinderGeometry(0.022, 0.014, 0.045, 8), M4(-1.3, 1.058, -4.66), DK); cyl([-1.3, 1.015, -4.66], 'y', 0.004, 0.04, 4, STL);
      cyl([-1.185, 1.33, -4.66], 'x', 0.028, 0.03, 8, STL);
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.5, e = [-1.17, 1.33 + Math.sin(a) * 0.13, -4.66 + Math.cos(a) * 0.13]; obox(g, [-1.17, 1.33, -4.66], e, 0.012, 0.012, STL); sb(e[0], e[1] - 0.012, e[2], 0.024, 0.024, 0.024, DK); }
      gl(MATTE); for (const s of [-1, 1]) sb(-1.65 + s * 0.135, 1.08, z0 + 0.065, 0.01, 0.11, 0.13, DK);
      cyl([-1.65, 1.15, z0 + 0.115], 'x', 0.085, 0.24, 12, [0.24, 0.38, 0.62], [0.55, 0.5, 0.42]);
      for (const s of [1, -1]) quad([-1.75, 1.15, -4.799], [-1.55, 1.15, -4.799], [-1.55, 1.04, -4.795], [-1.75, 1.04, -4.795], [0.27, 0.41, 0.66], [0, 0, s]);   // (its loose end hanging)
      // two mandatory signs over the bench (blue discs on white plates: eye and ear protection; no words)
      for (const [x, k] of [[-2.25, 0], [-1.95, 1]]) { const N = [0, 0, 1], t = z0 + 0.005, P = (dx, dy) => [x + dx, 1.68 + dy, t];
        quad([x - 0.075, 1.605, z0 + 0.003], [x + 0.075, 1.605, z0 + 0.003], [x + 0.075, 1.755, z0 + 0.003], [x - 0.075, 1.755, z0 + 0.003], [0.9, 0.9, 0.88], N);
        fan([x, 1.68, z0 + 0.004], [1, 0, 0], [0, 1, 0], 0.062, 12, [0.08, 0.3, 0.62], N);
        if (!k) { stroke(P(-0.048, 0.008), P(0.048, 0.008), 0.008, WH, N); quad(P(-0.04, -0.016), P(-0.006, -0.016), P(-0.006, 0.02), P(-0.04, 0.02), WH, N); quad(P(0.006, -0.016), P(0.04, -0.016), P(0.04, 0.02), P(0.006, 0.02), WH, N); }
        else { for (const [a, b] of [[[-0.03, 0], [-0.025, 0.03]], [[-0.025, 0.03], [0, 0.042]], [[0, 0.042], [0.025, 0.03]], [[0.025, 0.03], [0.03, 0]]]) stroke(P(...a), P(...b), 0.007, WH, N);
          quad(P(-0.043, -0.03), P(-0.02, -0.03), P(-0.02, 0.012), P(-0.043, 0.012), WH, N); quad(P(0.02, -0.03), P(0.043, -0.03), P(0.043, 0.012), P(0.02, 0.012), WH, N); } } }

    // a cord reel under the purlin over the bench, its cord down to a cage lamp (lit) hanging at head height
    { use(PB); const X = -2.6, Z = -3.22, YR = 4.45, YL = [0.9, 0.7, 0.12], LZ = Z + 0.03;
      for (const s of [-1, 1]) sb(X + s * 0.072, YR, Z, 0.008, 4.64 - YR, 0.06, GR); sb(X, 4.625, Z, 0.16, 0.015, 0.06, GR);
      cyl([X, YR, Z], 'x', 0.16, 0.12, 12, YL, [0.78, 0.6, 0.1]); cyl([X, YR, Z], 'x', 0.05, 0.135, 6, DK); sb(X, YR - 0.19, LZ, 0.04, 0.03, 0.04, DK);
      gl(MATTE); cyl([X, (YR - 0.19 + 2.06) / 2, LZ], 'y', 0.007, YR - 0.19 - 2.06, 4, DK); cyl([X, 2.3, LZ], 'y', 0.018, 0.03, 6, [0.75, 0.12, 0.1]); cyl([X, 2.01, LZ], 'y', 0.024, 0.1, 6, [0.13, 0.13, 0.14]);
      gl(PAINT); for (const y of [1.81, 1.955]) cyl([X, y, LZ], 'y', 0.042, 0.014, 8, GR);
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4, cx = X + Math.cos(a) * 0.038, cz = LZ + Math.sin(a) * 0.038; obox(g, [cx, 1.815, cz], [cx, 1.95, cz], 0.007, 0.007, YL); }
      cyl([X, 1.882, LZ], 'y', 0.016, 0.13, 6, [2.4, 2.2, 1.8]);   // (the tube: over 1, it glows)
      obox(g, [X, 1.803, LZ], [X, 1.77, LZ], 0.006, 0.006, GR); obox(g, [X, 1.77, LZ - 0.003], [X, 1.77, LZ + 0.02], 0.006, 0.006, GR); }

    // an extension reel on the floor by the bench's end (red sides, the cable wound on it, its frame and handle): one lead flat along the
    // floor to the tyre changer, one up the bench's end and over its top to the grinder
    { use(PB); const X = -1.55, Y = 0.2, Z = -3.8;
      for (const s of [-1, 1]) cyl([X + s * 0.068, Y, Z], 'x', 0.15, 0.012, 10, [0.6, 0.1, 0.08]); gl(MATTE); cyl([X, Y, Z], 'x', 0.11, 0.124, 10, [0.08, 0.08, 0.09]);
      gl(METAL); for (const s of [-1, 1]) { for (const e of [-0.13, 0.13]) obox(g, [X + s * 0.085, Y, Z], [X + s * 0.085, 0.006, Z + e], 0.014, 0.014, STL); obox(g, [X + s * 0.085, Y, Z], [X + s * 0.085, 0.42, Z], 0.014, 0.014, STL); }
      gl(MATTE); obox(g, [X - 0.095, 0.42, Z], [X + 0.095, 0.42, Z], 0.022, 0.022, DK);
      tube(g, [[X + 0.05, 0.08, Z - 0.09], [X + 0.12, 0.009, Z - 0.14], [-1.25, 0.009, -3.9], [-1.0, 0.009, -4.02], [-0.93, 0.009, -4.3], [-0.9, 0.009, -4.46], [-0.888, 0.035, -4.5]], 0.009, DK, 12, 3);
      tube(g, [[X + 0.03, 0.06, Z - 0.1], [X + 0.1, 0.009, Z - 0.16], [-1.2, 0.009, -3.93], [-1.05, 0.009, -4.06], [-1.0, 0.009, -4.3], [-0.985, 0.05, -4.37], [-0.985, 0.5, -4.372], [-0.99, 0.765, -4.39],
        [-1.1, 0.769, -4.47], [-1.45, 0.769, -4.53], [-1.7, 0.77, -4.62], [-1.78, 0.8, -4.69]], 0.009, DK, 20, 3);
      sb(-0.889, 0.015, -4.5, 0.014, 0.05, 0.04, [0.1, 0.1, 0.11]);   // (the plug in the changer's side)
      BLOBS.push([X, Z, 0.5, 0.45, 0.55, 0, PB]); }

    // little things of the day: a laptop open on the small chest's block top, a folded rag; a coffee mug and a tray of sockets on the big
    // chest's mat
    { use(PB, SATIN); const LX = -5.6, LY = 0.87, LZ = -4.62, LD = [0.1, 0.1, 0.11], lm = M4(LX, LY + 0.02, LZ - 0.12, -1.9, 0, 0);
      sb(LX, LY, LZ, 0.34, 0.02, 0.24, LD, [0.13, 0.13, 0.14]); quad([LX - 0.15, LY + 0.0205, LZ - 0.105], [LX + 0.15, LY + 0.0205, LZ - 0.105], [LX + 0.15, LY + 0.0205, LZ + 0.02], [LX - 0.15, LY + 0.0205, LZ + 0.02], [0.05, 0.05, 0.06], [0, 1, 0]);
      gBox(g, lm, 0, 0.006, 0.12, 0.34, 0.012, 0.24, LD);
      { const P = (a, b) => new V3(a, -0.0006, b).applyMatrix4(lm).toArray(); g.quadO(P(-0.155, 0.02), P(0.155, 0.02), P(0.155, 0.22), P(-0.155, 0.22), [0.25, 0.45, 0.6], new V3(0, 1, 0.12).applyMatrix4(lm).toArray()); }   // (its screen, dim)
      gl(MATTE); sb(-5.2, LY, -4.6, 0.3, 0.012, 0.2, [0.5, 0.22, 0.2], [0.52, 0.26, 0.24], 0.25); sb(-5.22, LY + 0.012, -4.6, 0.26, 0.01, 0.18, [0.4, 0.38, 0.38], [0.46, 0.44, 0.44], 0.2);
      gl(SATIN); cyl([-6.15, 1.184, -4.55], 'y', 0.04, 0.1, 10, [0.86, 0.86, 0.84], [0.2, 0.13, 0.08]); shape(new THREE.TorusGeometry(0.026, 0.007, 4, 8, Math.PI), M4(-6.11, 1.184, -4.55, 0, 0, -Math.PI / 2), [0.86, 0.86, 0.84]);
      sb(-6.75, 1.134, -4.5, 0.3, 0.03, 0.12, [0.09, 0.09, 0.1]);
      gl(METAL); for (let i = 0; i < 10; i++) { const r = 0.011 + (i % 5) * 0.002; World.cyl(g, -6.87 + (i % 5) * 0.06, 1.164, i < 5 ? -4.53 : -4.47, r, 0.025 + (i % 5) * 0.004, 5, CHR, [0.15, 0.15, 0.16]); } }

    // the left wall by the door: a waste-oil drainer on its castor base (the tank, its sight glass and drain valve, a hose coiled on it;
    // the telescopic tube up to the open funnel, safety yellow, dark inside, its grate; a push handle)
    { use(PL); const X = -7.55, Z = -2.25, YF = [0.84, 0.66, 0.14];
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + Math.PI / 4, e = [X + Math.cos(a) * 0.27, 0.05, Z + Math.sin(a) * 0.27]; obox(g, [X, 0.08, Z], e, 0.04, 0.03, DK); sb(e[0], 0, e[2], 0.035, 0.05, 0.035, DK); }
      cyl([X, 0.115, Z], 'y', 0.06, 0.07, 8, DK);
      gl(PAINT); shape(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 14), M4(X, 0.425, Z), (c, n) => n[1] > 0.5 ? [0.2, 0.21, 0.23] : [0.16, 0.17, 0.19]);
      sb(X + 0.218, 0.22, Z, 0.006, 0.4, 0.03, [0.3, 0.31, 0.34]); sb(X + 0.222, 0.24, Z, 0.004, 0.36, 0.016, [0.72, 0.74, 0.77]); sb(X + 0.2245, 0.24, Z, 0.002, 0.14, 0.017, [0.22, 0.13, 0.05]);   // (the sight glass: the oil in it)
      gl(METAL); obox(g, [X + 0.19, 0.19, Z - 0.09], [X + 0.27, 0.19, Z - 0.09], 0.03, 0.03, [0.7, 0.58, 0.3]); gl(PAINT); sb(X + 0.27, 0.205, Z - 0.09, 0.012, 0.012, 0.07, [0.7, 0.12, 0.1]);
      gl(MATTE); shape(new THREE.TorusGeometry(0.08, 0.013, 3, 10), M4(X + 0.03, 0.48, Z + 0.234), DK);
      gl(METAL); cyl([X, 0.89, Z], 'y', 0.035, 0.38, 8, STL); cyl([X, 0.74, Z], 'y', 0.045, 0.06, 8, DK);
      gl(PAINT); funnel(X, Z, 0.07, 0.3, 1.08, 1.25, 12, YF, [0.07, 0.065, 0.06]);
      gl(METAL); for (const d of [-0.12, 0, 0.12]) { const r = 0.07 + 0.23 * (1.215 - 1.08) / 0.17, hl = Math.sqrt(r * r - d * d) - 0.006; obox(g, [X - hl, 1.215, Z + d], [X + hl, 1.215, Z + d], 0.012, 0.012, STL); }
      gl(PAINT); for (const s of [-1, 1]) obox(g, [X - 0.2, 0.6, Z + s * 0.12], [X - 0.36, 1.02, Z + s * 0.12], 0.025, 0.025, GR); gl(MATTE); obox(g, [X - 0.36, 1.02, Z - 0.15], [X - 0.36, 1.02, Z + 0.15], 0.032, 0.032, DK);
      BLOBS.push([X, Z, 0.75, 0.75, 0.7, 0, PL]); }

    // the left wall's front half (the hose reel, the door, the oil corner, the prints): a wall's piece of its own on the same plane (it steps
    // aside with the wall), so that its things, seen only from the right, are not drawn where the camera looks the other way
    const PLF = piece(PL.wall.slice());

    // a fire hose reel on the left wall (its swing bracket, the red reel: a solid back, an open front rim on spokes, the hose wound on it,
    // the nozzle hanging; its red supply pipe up the wall with a valve)
    { use(PLF); const X = -8.76, Y = 1.45, Z = 3.65, FR = [0.7, 0.11, 0.09], HO = [0.34, 0.05, 0.045];
      sb(x0 + 0.012, Y - 0.15, Z, 0.024, 0.3, 0.12, DK); cyl([x0 + 0.13, Y, Z], 'x', 0.025, 0.24, 8, DK);
      cyl([-8.86, Y, Z], 'x', 0.3, 0.012, 14, FR); cyl([X, Y, Z], 'x', 0.11, 0.19, 8, [0.5, 0.08, 0.06]);
      ringX(-8.66, Y, Z, 0.27, 0.3, 14, FR, 1); ringX(-8.666, Y, Z, 0.27, 0.3, 14, FR, -1); cyl([-8.66, Y, Z], 'x', 0.09, 0.016, 8, FR);   // (the open front: a rim on three spokes)
      for (let k = 0; k < 3; k++) gBox(g, M4(-8.663, Y, Z, Math.PI / 2 - (k / 3 * TAU + 0.3), 0, 0), 0, 0.18, 0, 0.012, 0.2, 0.03, FR);
      gl(SATIN); for (const [r, x] of [[0.22, -8.82], [0.25, -8.76], [0.28, -8.7]]) shape(new THREE.TorusGeometry(r, 0.018, 3, 12), M4(x, Y, Z, 0, Math.PI / 2, 0), HO);
      tube(g, [[-8.7, Y - 0.27, Z + 0.05], [-8.69, Y - 0.34, Z - 0.05], [-8.68, Y - 0.42, Z - 0.16]], 0.017, HO, 4, 4);
      gl(PAINT); cyl([-8.68, Y - 0.5, Z - 0.17], 'y', 0.022, 0.14, 8, DK); cyl([-8.68, Y - 0.59, Z - 0.17], 'y', 0.016, 0.05, 8, FR);
      for (const [a, b] of [[[x0 + 0.06, Y, 3.98], [x0 + 0.06, 4.4, 3.98]], [[x0 + 0.06, Y, 3.98], [x0 + 0.06, Y, 3.72]]]) obox(g, a, b, 0.05, 0.05, FR);
      sb(x0 + 0.06, 1.82, 3.98, 0.08, 0.08, 0.08, [0.5, 0.08, 0.06]); obox(g, [x0 + 0.1, 1.86, 3.98], [x0 + 0.13, 1.86, 3.98], 0.012, 0.012, STL);
      shape(new THREE.TorusGeometry(0.055, 0.008, 3, 10), M4(x0 + 0.135, 1.86, 3.98, 0, Math.PI / 2, 0), FR);
      WALLAO.push(['l', 3.32, 3.98, 1.12, 1.8, 0.35, PLF]); }

    // a steel personnel door in the left wall by the front (its frame, the leaf, a vision panel, a panic bar, a kick plate, hinges, a
    // closer); over it a lit exit sign (a running man into a door, an arrow; no words), a green arrow on the column beside it
    { use(PLF); const FRM = [0.36, 0.38, 0.42], LF = [0.55, 0.57, 0.6], N = [1, 0, 0];
      box(x0 + 0.07, 0, 5.3, 0.14, 2.16, 0.06, FRM); box(x0 + 0.07, 0, 6.26, 0.14, 2.16, 0.06, FRM); sb(x0 + 0.07, 2.1, 5.78, 0.14, 0.06, 1.02, FRM);
      box(x0 + 0.11, 0.01, 5.78, 0.02, 2.09, 0.9, LF);
      const lq = (za, zb, ya, yb, t, col) => quad([x0 + t, ya, zb], [x0 + t, ya, za], [x0 + t, yb, za], [x0 + t, yb, zb], col, N);
      lq(5.97, 6.13, 1.2, 1.9, 0.1205, [0.1, 0.13, 0.17]); stroke([x0 + 0.121, 1.32, 6.1], [x0 + 0.121, 1.72, 6.0], 0.014, [0.3, 0.34, 0.4], N);
      gl(METAL); lq(5.36, 6.2, 0.02, 0.27, 0.1205, [0.64, 0.66, 0.7]);
      obox(g, [x0 + 0.17, 1.0, 5.42], [x0 + 0.17, 1.0, 6.12], 0.03, 0.045, [0.7, 0.72, 0.76]); for (const z of [5.43, 6.11]) gBox(g, null, x0 + 0.15, 1.0, z, 0.06, 0.07, 0.05, [0.62, 0.64, 0.68]);
      for (const y of [0.25, 1.05, 1.85]) gBox(g, null, x0 + 0.126, y, 5.335, 0.012, 0.1, 0.03, [0.5, 0.52, 0.56]);
      gl(PAINT); gBox(g, null, x0 + 0.15, 2.0, 5.55, 0.06, 0.07, 0.3, GR); obox(g, [x0 + 0.165, 2.02, 5.68], [x0 + 0.15, 2.12, 5.9], 0.018, 0.018, [0.2, 0.21, 0.23]); gBox(g, null, x0 + 0.15, 2.125, 5.9, 0.02, 0.045, 0.06, [0.2, 0.21, 0.23]);
      sb(x0 + 0.04, 2.24, 5.78, 0.08, 0.18, 0.42, [0.86, 0.86, 0.84]); lq(5.585, 5.975, 2.252, 2.408, 0.0805, [0.12, 1.25, 0.45]);
      const E = (u, v) => [x0 + 0.0825, 2.255 + v, 5.97 - u], es = (a, b, w) => stroke(E(...a), E(...b), w, LIT, N);
      es([0.04, 0.075], [0.105, 0.075], 0.022); g.triO(E(0.1, 0.112), E(0.1, 0.038), E(0.145, 0.075), LIT, [x0, 2.33, 5.85]);   // (the arrow)
      quad(E(0.226, 0.109), E(0.244, 0.109), E(0.244, 0.127), E(0.226, 0.127), LIT, N); es([0.228, 0.098], [0.206, 0.062], 0.016);   // (the man: his head, his body, legs and arms)
      es([0.206, 0.062], [0.236, 0.045], 0.012); es([0.236, 0.045], [0.256, 0.018], 0.012); es([0.206, 0.062], [0.18, 0.04], 0.012); es([0.18, 0.04], [0.158, 0.03], 0.012);
      es([0.224, 0.092], [0.247, 0.08], 0.01); es([0.247, 0.08], [0.262, 0.094], 0.01); es([0.224, 0.092], [0.199, 0.088], 0.01); es([0.199, 0.088], [0.186, 0.07], 0.01);
      es([0.284, 0.018], [0.284, 0.132], 0.008); es([0.28, 0.13], [0.354, 0.13], 0.008); es([0.35, 0.132], [0.35, 0.018], 0.008);   // (the door)
      sb(x0 + 0.281, 2.25, 6.5, 0.008, 0.12, 0.22, [0.12, 1.0, 0.4]);
      const A = (z, y) => [x0 + 0.2855, y, z]; stroke(A(6.57, 2.31), A(6.47, 2.31), 0.024, LIT, N); g.triO(A(6.48, 2.345), A(6.48, 2.275), A(6.43, 2.31), LIT, [x0, 2.31, 6.5]); }

    // an oil corner by the front left corner: a galvanised shelf (one-litre bottles, spray cans and a 5 l can, a 20 l pail and a funnel,
    // two boxes of spares up top), two jerry cans on the floor in front of it (red, yellow: the cross pressed in their sides)
    { use(PLF, METAL); const xa = -8.9, xb = -8.5, za = 7.87, zb = 8.55, GV = [0.4, 0.42, 0.46], SH = [0.55, 0.57, 0.6], N = [1, 0, 0];
      for (const x of [xa + 0.015, xb - 0.015]) for (const z of [za + 0.015, zb - 0.015]) World.box(g, x, 0, z, 0.03, 1.8, 0.03, 0, GV);
      for (const y of [0.1, 0.6, 1.1, 1.6]) World.box(g, (xa + xb) / 2, y, (za + zb) / 2, 0.4, 0.02, 0.68, 0, SH);
      gl(SATIN); [[0.18, 0.32, 0.55], [0.18, 0.32, 0.55], DK, [0.75, 0.6, 0.2], [0.75, 0.6, 0.2], DK, [0.18, 0.32, 0.55]].forEach((c, i) => { const z = 7.925 + i * 0.095;
        sb(-8.56, 1.12, z, 0.06, 0.22, 0.09, c); sb(-8.565, 1.34, z + 0.015, 0.03, 0.03, 0.03, i % 3 === 2 ? [0.75, 0.6, 0.2] : DK); quad([-8.5295, 1.17, z + 0.035], [-8.5295, 1.17, z - 0.035], [-8.5295, 1.27, z - 0.035], [-8.5295, 1.27, z + 0.035], [0.86, 0.86, 0.84], N); });
      for (const [z, c] of [[7.95, [0.7, 0.12, 0.1]], [8.03, [0.62, 0.64, 0.68]], [8.11, [0.15, 0.3, 0.6]]]) { World.cyl(g, -8.6, 0.62, z, 0.033, 0.2, 6, WH, c); World.cyl(g, -8.6, 0.82, z, 0.025, 0.03, 6, c, c); }
      sb(-8.64, 0.62, 8.36, 0.12, 0.28, 0.17, [0.15, 0.25, 0.45]); World.cyl(g, -8.6, 0.9, 8.42, 0.02, 0.03, 6, DK, DK); obox(g, [-8.64, 0.912, 8.31], [-8.64, 0.912, 8.38], 0.02, 0.02, DK);
      World.cyl(g, -8.7, 0.12, 8.06, 0.15, 0.34, 10, [0.5, 0.52, 0.55], [0.5, 0.52, 0.55]); World.cyl(g, -8.7, 0.46, 8.06, 0.155, 0.025, 10, DK, [0.1, 0.1, 0.11]);
      World.cyl(g, -8.66, 0.12, 8.38, 0.09, 0.1, 8, [0.84, 0.66, 0.14], [0.06, 0.06, 0.07], 0.02); World.cyl(g, -8.66, 0.22, 8.38, 0.016, 0.06, 6, [0.84, 0.66, 0.14]);
      for (const [z, ry] of [[8.04, 0.06], [8.38, -0.08]]) { const c = Math.cos(ry), s = Math.sin(ry), F = (lz, y) => [-8.7 + 0.1505 * c - lz * s, y, z + 0.1505 * s + lz * c];
        sb(-8.7, 1.62, z, 0.3, 0.2, 0.3, [0.55, 0.42, 0.28], [0.58, 0.45, 0.3], ry); sb(-8.7, 1.82, z, 0.3, 0.002, 0.06, [0.62, 0.5, 0.36], null, ry); quad(F(0.06, 1.68), F(-0.06, 1.68), F(-0.06, 1.76), F(0.06, 1.76), [0.88, 0.88, 0.86], [c, 0, s]); }
      gl(PAINT); for (const [z, c] of [[7.985, [0.6, 0.1, 0.08]], [8.185, [0.78, 0.6, 0.13]]]) { const s = z < 8.1 ? -1 : 1, zf = z + s * 0.0855, dk = c.map(v => v * 0.7);
        box(-8.275, 0, z, 0.35, 0.47, 0.17, c); for (const [a, b] of [[[-8.42, 0.06], [-8.13, 0.38]], [[-8.42, 0.38], [-8.13, 0.06]]]) stroke([a[0], a[1], zf], [b[0], b[1], zf], 0.03, dk, [0, 0, s]);
        for (const dz of [-0.045, 0, 0.045]) sb(-8.275, 0.47, z + dz, 0.16, 0.035, 0.014, c); World.cyl(g, -8.13, 0.47, z - 0.04, 0.024, 0.05, 6, DK, DK); }
      BLOBS.push([-8.6, 8.2, 0.9, 0.8, 0.7, 0, PLF], [-8.27, 8.09, 0.5, 0.5, 0.6, 0, PLF]); WALLAO.push(['l', 7.85, 8.6, 0, 1.8, 0.6, PLF]); }

    // the left wall's prints, one canvas (the team's banner on its rod, folds in it; a fire-point sign over the hose reel; no smoking over
    // the gas bottles): one mesh, a Lambert map as the pegboard's (its program shared); the rod and the signs' plates in the wall's piece
    { use(PLF, METAL); obox(g, [x0 + 0.05, 3.13, 4.12], [x0 + 0.05, 3.13, 6.33], 0.025, 0.025, STL); for (const z of [4.3, 6.15]) sb(x0 + 0.025, 3.115, z, 0.05, 0.03, 0.02, GR);
      gl(PAINT); sb(x0 + 0.0025, 2.215, 3.65, 0.005, 0.26, 0.27, [0.78, 0.12, 0.1]); sb(x0 + 0.0025, 1.595, 4.7, 0.005, 0.31, 0.31, [0.9, 0.9, 0.88]);
      const tex = canvasTex(512, 256, (c) => { const R = Core.rng(4246);
        c.fillStyle = '#1b2242'; c.fillRect(0, 0, 512, 144);
        c.fillStyle = '#e0ad3c'; c.beginPath(); c.moveTo(108, 0); c.lineTo(176, 0); c.lineTo(262, 72); c.lineTo(176, 144); c.lineTo(108, 144); c.lineTo(194, 72); c.closePath(); c.fill();
        c.strokeStyle = '#6cc8f7'; c.lineWidth = 5; c.beginPath(); c.moveTo(200, -6); c.lineTo(290, 72); c.lineTo(200, 150); c.stroke();
        c.fillStyle = '#f2f1ec'; c.font = 'italic 900 118px Roboto, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('07', 396, 78);
        for (let i = 0; i < 2600; i++) { c.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)'; c.fillRect(R() * 512, R() * 144, 1 + R() * 2, 1); }   // (the weave)
        for (const [x, a] of [[70, 0.2], [232, 0.12], [330, 0.22], [470, 0.16]]) { const gr = c.createLinearGradient(x - 36, 0, x + 36, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,' + a + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(x - 36, 0, 72, 144); }
        c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(0, 0, 512, 9); c.fillRect(0, 137, 512, 7);   // (its hems)
        c.save(); c.translate(0, 152); c.fillStyle = '#c61f19'; c.fillRect(0, 0, 100, 100); c.strokeStyle = c.fillStyle = '#f4f4f0';   // (the hose reel's sign)
        c.lineWidth = 8; c.beginPath(); c.arc(42, 44, 24, 0, TAU); c.stroke(); c.beginPath(); c.arc(42, 44, 7, 0, TAU); c.fill();
        c.lineWidth = 6; c.beginPath(); c.moveTo(60, 62); c.quadraticCurveTo(80, 74, 78, 84); c.stroke(); c.fillRect(70, 82, 15, 9); c.restore();
        c.save(); c.translate(108, 152); c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, 100, 100); c.fillStyle = '#131313'; c.fillRect(22, 50, 42, 11); c.fillRect(67, 50, 10, 11);   // (no smoking)
        c.strokeStyle = '#131313'; c.lineWidth = 3; c.beginPath(); c.moveTo(72, 46); c.bezierCurveTo(64, 38, 80, 32, 72, 21); c.stroke();
        c.strokeStyle = '#c61f19'; c.lineWidth = 10; c.beginPath(); c.arc(50, 50, 42, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(20, 20); c.lineTo(80, 80); c.stroke(); c.restore(); });
      const mat = new THREE.MeshLambertMaterial({ map: tex }); mat.userData.noCube = true;
      const pg = new World.GB(true), U = (px) => px / 512, V = (py) => 1 - py / 256, IN = [x0 - 1, 2.5, 5], W1 = [1, 1, 1];
      const sign = (za, zb, ya, yb, t, u0, u1, v0, v1) => pg.quadO([x0 + t, ya, zb], [x0 + t, ya, za], [x0 + t, yb, za], [x0 + t, yb, zb], W1, IN, [[u0, v1], [u1, v1], [u1, v0], [u0, v0]]);
      sign(3.52, 3.78, 2.22, 2.47, 0.006, U(1), U(99), V(153), V(251)); sign(4.55, 4.85, 1.6, 1.9, 0.006, U(109), U(207), V(153), V(251));
      // (the banner: 18 strips, hanging from the rod a little out from the wall, its folds deeper toward its hem; smooth normals)
      const NB = 18, ZA = 4.2, ZB = 6.25, tt = (i, k) => 0.05 - 0.016 * k + (0.008 + 0.006 * k) * Math.sin(i / NB * 7.3 * Math.PI + 0.6);
      for (let i = 0; i < NB; i++) { const P = (j, k) => [x0 + tt(j, k), k ? 2.55 : 3.13, ZB - (ZB - ZA) * j / NB], Nn = (j, k) => { const d = (tt(j + 0.01, k) - tt(j - 0.01, k)) / (0.02 * (ZB - ZA) / NB); return new V3(1, 0, d).normalize().toArray(); };
        const uv = (j, k) => [j / NB, k ? V(143) : V(1)];
        pg.triON(P(i, 1), P(i + 1, 1), P(i + 1, 0), Nn(i, 1), Nn(i + 1, 1), Nn(i + 1, 0), IN, W1, W1, W1, uv(i, 1), uv(i + 1, 1), uv(i + 1, 0));
        pg.triON(P(i, 1), P(i + 1, 0), P(i, 0), Nn(i, 1), Nn(i + 1, 0), Nn(i, 0), IN, W1, W1, W1, uv(i, 1), uv(i + 1, 0), uv(i, 0)); }
      PLF.root.add(new THREE.Mesh(pg.geometry(), mat)); }
  }
  // the right zone's new things (round 2): a build bay by the right door (a two-post lift, a stripped chassis on its arms, a MIG welder
  // on its cart, a creeper); on the right wall a parts washer, a step ladder, two pit boards leaning in the corner, the team's banner and
  // its graphics panel; a utility cart by the bare slicks; the air drop's hose in loose loops on the floor; a cord reel with a cage lamp
  // under the roof; the walls' contact shadows behind the tall things on the right
  function buildKitR() {
    const { x1 } = ROOM, R = WALLS.right, BK = WALLS.back, TB = FREE.tyresB, { dk: DK, steel: STEEL, alu: ALU, rub: RUB } = PAL;
    let g = null, sm = null, cp = null; const use = (p, k) => { g = p.g; sm = p.sm; cp = p; gloss(p, k == null ? PAINT : k); return p; }, gl = (k) => gloss(cp, k), box = (...a) => fbox(g, ...a);
    // (a tube of a frame: open, a little longer than a to b, so its bends close; a castor, its axle along z)
    const bar = (a, b, r, col, n) => { const d = new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); d.divideScalar(L);
      gAdd(g, new THREE.CylinderGeometry(r, r, L + r * 1.2, n || 6, 1, true), new THREE.Matrix4().compose(new V3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d), new V3(1, 1, 1)), col); };
    const bars = (r, col, ...pts) => { for (let i = 0; i + 1 < pts.length; i++) bar(pts[i], pts[i + 1], r, col); };
    const castor = (m, x, y, z, r) => gAdd(g, new THREE.CylinderGeometry(r, r, r * 0.8, 10), (m ? m.clone() : new THREE.Matrix4()).multiply(M4(x, y, z, Math.PI / 2)), DK);
    // the walls' prints: one canvas (the banner, the graphics panel, the pit boards' faces), one mesh on the right wall (its quads' uv in
    // pixels of the canvas)
    const PW = 512, PH = 256, UV = { ban: [0, 0, 300, 140], pan: [300, 0, 512, 136], pb1: [0, 144, 152, 256], pb2: [160, 144, 312, 256] };
    const prints = canvasTex(PW, PH, (x) => {
      const Rp = Core.rng(4247), font = (w, px) => w + ' ' + px + 'px Roboto, Arial, sans-serif';
      // the banner: the team's navy, a gold chevron to the right, a cyan pinstripe under it, the car's number, the cloth's folds and its hems
      { const [a, b, c, d] = UV.ban, w = c - a, h = d - b; x.save(); x.translate(a, b);
        x.fillStyle = '#1a2142'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#e8b53a'; x.beginPath(); x.moveTo(w * 0.52, 0); x.lineTo(w * 0.7, 0); x.lineTo(w * 0.9, h / 2); x.lineTo(w * 0.7, h); x.lineTo(w * 0.52, h); x.lineTo(w * 0.72, h / 2); x.closePath(); x.fill();
        x.strokeStyle = '#5cc4f2'; x.lineWidth = 3; x.beginPath(); x.moveTo(w * 0.46, 0); x.lineTo(w * 0.66, h / 2); x.lineTo(w * 0.46, h); x.stroke();
        x.fillStyle = '#f2f2ee'; x.font = font('italic 900', 84); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('07', w * 0.25, h * 0.52);
        x.fillStyle = 'rgba(8,10,20,0.85)'; x.fillRect(0, 0, w, 7); x.fillRect(0, h - 6, w, 6);
        for (let i = 0; i < 9; i++) { const u = (i + 0.5) / 9 * w + (Rp() - 0.5) * 12, gr = x.createLinearGradient(u - 16, 0, u + 16, 0), k = 0.1 + Rp() * 0.1;   // (folds: a shade, a sheen beside it)
          gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.45, 'rgba(0,0,0,' + k.toFixed(2) + ')'); gr.addColorStop(0.62, 'rgba(255,255,255,' + (k * 0.35).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(u - 16, 0, 32, h); }
        x.restore(); }
      // the graphics panel: navy, gold and cyan speed stripes on the slant, the team's name small at the right end
      { const [a, b, c, d] = UV.pan, w = c - a, h = d - b; x.save(); x.translate(a, b); x.beginPath(); x.rect(0, 0, w, h); x.clip();
        const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#141a36'); gr.addColorStop(1, '#222b52'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
        for (const [o, s, col] of [[-0.05, 0.16, '#e8b53a'], [0.13, 0.05, '#5cc4f2'], [0.2, 0.025, '#e8b53a'], [0.25, 0.012, '#5cc4f2']]) { x.fillStyle = col; x.beginPath(); x.moveTo(w * o, h); x.lineTo(w * (o + s), h); x.lineTo(w * (o + s + 0.42), 0); x.lineTo(w * (o + 0.42), 0); x.closePath(); x.fill(); }
        x.fillStyle = '#f2f2ee'; x.font = font('italic 900', 20); x.textAlign = 'right'; x.textBaseline = 'alphabetic'; x.fillText('APEX RACING', w - 10, h - 14);
        x.fillStyle = '#e8b53a'; x.fillRect(w - 118, h - 10, 108, 2);
        x.restore(); }
      // the pit boards: black, a white border, the place, the gap, the lap (yellow and white)
      for (const [k, l1, l2, l3] of [['pb1', 'P2', '+1.4', 'L12'], ['pb2', 'P5', '-0.3', 'L13']]) { const [a, b, c, d] = UV[k], w = c - a, h = d - b; x.save(); x.translate(a, b);
        x.fillStyle = '#f0f0ec'; x.fillRect(0, 0, w, h); x.fillStyle = '#0c0d10'; x.fillRect(4, 4, w - 8, h - 8);
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font('900', 34); x.fillStyle = '#f2c230'; x.fillText(l1, w / 2, h * 0.24);
        x.fillStyle = '#f2f2ee'; x.font = font('900', 30); x.fillText(l2, w / 2, h * 0.53); x.fillStyle = '#f2c230'; x.font = font('700', 26); x.fillText(l3, w / 2, h * 0.8);
        x.restore(); }
    });
    const pq = new World.GB(true), puv = (k) => { const [a, b, c, d] = UV[k]; return (u, v) => [(a + u * (c - a)) / PW, 1 - (b + (1 - v) * (d - b)) / PH]; };   // (u, v 0..1 of a print: u along +z, v up)

    // ---- the build bay by the right door (a piece of its own) ----
    // a two-post lift: graphite posts on their base plates, the carriages' slots, the carriages (red) at their foot, the arms swung under the
    // chassis to their rubber pads, the tread plate over the lines between the posts, the power unit on the first post (the motor, the oil
    // tank, its hose into the plate, the buttons)
    { const P = use(piece()), GR = [0.26, 0.28, 0.32], GRt = [0.31, 0.33, 0.37], PLT = [0.3, 0.31, 0.34], CAR = [0.56, 0.11, 0.09], ARM = [0.2, 0.21, 0.24], ARM2 = [0.27, 0.28, 0.31];
      for (const [pz, s] of [[3.13, 1], [5.37, -1]]) {   // (s: toward the other post)
        gl(PAINT); box(5.8, 0, pz, 0.44, 0.02, 0.44, PLT, [0.36, 0.37, 0.4]);
        box(5.8, 0.02, pz, 0.26, 2.83, 0.22, GR, GRt); box(5.8, 2.85, pz, 0.3, 0.05, 0.26, [0.2, 0.21, 0.24]);
        box(5.8, 0.06, pz + s * 0.112, 0.07, 2.74, 0.004, [0.05, 0.05, 0.06]);   // (the slot the carriage runs in)
        box(5.8, 2.2, pz - s * 0.112, 0.1, 0.07, 0.004, [0.56, 0.57, 0.56]);   // (a blank plate: its load, no words)
        box(5.8, 0.22, pz + s * 0.17, 0.3, 0.5, 0.12, CAR, [0.62, 0.13, 0.1]);   // the carriage
        gl(METAL); for (const dx of [-0.17, 0.17]) for (const dz of [-0.17, 0.17]) box(5.8 + dx, 0.02, pz + dz, 0.035, 0.018, 0.035, [0.52, 0.53, 0.56]);   // (anchor bolts)
        gl(PAINT); for (const px of [4.62, 6.98]) { const zp = s > 0 ? 3.68 : 4.82, a = [5.8 + Math.sign(px - 5.8) * 0.1, 0.25, pz + s * 0.2], m = [a[0] + (px - a[0]) * 0.55, 0.25, a[2] + (zp - a[2]) * 0.55];
          cylA(g, [a[0], 0.25, a[2]], 'y', 0.045, 0.1, 6, ARM2); obox(g, a, m, 0.09, 0.06, ARM); obox(g, [m[0] - (px - a[0]) * 0.05, 0.25, m[2] - (zp - a[2]) * 0.05], [px, 0.25, zp], 0.07, 0.045, ARM2);   // (a telescopic arm)
          cylA(g, [px, 0.29, zp], 'y', 0.035, 0.04, 6, [0.3, 0.31, 0.33]); gl(MATTE); cylA(g, [px, 0.315, zp], 'y', 0.07, 0.03, 10, [0.07, 0.07, 0.08]); gl(PAINT); } }
      gl(1.3); box(5.8, 0, 4.25, 0.4, 0.03, 1.8, [0.4, 0.42, 0.45], [0.48, 0.5, 0.54]);   // the tread plate (its edges bevelled down to the floor)
      for (const e of [-1, 1]) g.quadO([5.8 + e * 0.2, 0.03, 3.35], [5.8 + e * 0.2, 0.03, 5.15], [5.8 + e * 0.26, 0.002, 5.15], [5.8 + e * 0.26, 0.002, 3.35], [0.34, 0.35, 0.38], [5.8, -1, 4.25]);
      gl(PAINT); box(5.95, 0.86, 3.13, 0.02, 0.6, 0.18, [0.12, 0.12, 0.13]); box(6.04, 0.9, 3.13, 0.16, 0.24, 0.15, [0.6, 0.62, 0.66], [0.66, 0.68, 0.72]);   // the power unit: its plate, the oil tank
      box(6.04, 1.14, 3.13, 0.12, 0.03, 0.12, [0.45, 0.47, 0.5]); gAdd(g, new THREE.CylinderGeometry(0.075, 0.075, 0.24, 12), M4(6.04, 1.29, 3.13), (c, n) => n[1] > 0.5 ? [0.1, 0.1, 0.11] : [0.17, 0.18, 0.2]);   // (the pump, the motor)
      box(5.86, 1.12, 2.995, 0.08, 0.13, 0.05, [0.8, 0.81, 0.78]); box(5.84, 1.21, 2.968, 0.024, 0.024, 0.006, [0.15, 0.62, 0.26]); box(5.88, 1.21, 2.968, 0.024, 0.024, 0.006, [0.8, 0.12, 0.1]);   // (its buttons)
      gl(MATTE); tube(g, [[6.08, 0.9, 3.21], [6.1, 0.55, 3.25], [6.06, 0.08, 3.3], [5.98, 0.03, 3.36]], 0.01, [0.08, 0.08, 0.09], 10, 4);
      // the stripped chassis on the pads: the aluminium floor pan, the cage (rails, the main and the front hoop, the roof bars, the main hoop's
      // diagonal, door bars, the rear stays, the front bulkhead, the rear frame, the cross tubes), the engine and its gearbox, the
      // driveshafts, the exhaust, the fuel cell, the corners without their wheels (uprights, discs in their hats, gold calipers, wishbones),
      // the steering rack and its track rods, the pedals
      // (the tubes a dark chromoly grey, satin: bare and bright they were the room's lightest metal, a white line drawing over the bay)
      gl(SATIN); box(5.75, 0.33, 4.25, 3.1, 0.02, 1.2, [0.22, 0.23, 0.25], [0.27, 0.28, 0.31]);
      const TU = [0.34, 0.35, 0.38], TH = [0.4, 0.41, 0.44], Y = 0.37, ZL = 3.66, ZR = 4.84, t = (...p) => bars(0.022, TU, ...p), hoop = (...p) => { for (let i = 0; i + 1 < p.length; i++) bar(p[i], p[i + 1], 0.025, TH, 8); };
      t([4.25, Y, ZL], [7.25, Y, ZL]); t([4.25, Y, ZR], [7.25, Y, ZR]);
      hoop([5.55, Y, ZL], [5.55, 1.1, 3.72], [5.55, 1.22, 3.8], [5.55, 1.28, 3.93], [5.55, 1.28, 4.57], [5.55, 1.22, 4.7], [5.55, 1.1, 4.78], [5.55, Y, ZR]);
      hoop([4.85, Y, ZL], [4.9, 0.92, 3.74], [4.93, 1.03, 3.84], [4.96, 1.08, 3.97], [4.96, 1.08, 4.53], [4.93, 1.03, 4.66], [4.9, 0.92, 4.76], [4.85, Y, ZR]);
      t([4.96, 1.08, 3.97], [5.55, 1.28, 3.93]); t([4.96, 1.08, 4.53], [5.55, 1.28, 4.57]); t([5.55, 1.28, 3.93], [5.55, Y, ZR]);
      for (const z of [ZL, ZR]) { t([4.86, 0.46, z], [5.55, 0.84, z]); t([4.88, 0.84, z], [5.55, 0.46, z]); }
      t([5.55, 1.22, 3.8], [6.5, 0.52, 3.7], [7.25, 0.6, 3.76]); t([5.55, 1.22, 4.7], [6.5, 0.52, 4.8], [7.25, 0.6, 4.74]);
      t([4.25, Y, ZL], [4.25, Y, ZR]); t([4.25, Y, ZL], [4.25, 0.76, 3.76], [4.25, 0.76, 4.74], [4.25, Y, ZR]); t([4.25, 0.76, 3.76], [4.88, 0.84, ZL]); t([4.25, 0.76, 4.74], [4.88, 0.84, ZR]);
      t([7.25, Y, ZL], [7.25, Y, ZR]); t([7.25, Y, ZL], [7.25, 0.6, 3.76], [7.25, 0.6, 4.74], [7.25, Y, ZR]); t([5.55, Y, ZL], [5.55, Y, ZR]); t([4.85, Y, ZL], [4.85, Y, ZR]);
      gl(1.3); box(6.6, 0.37, 4.25, 0.45, 0.36, 0.48, [0.18, 0.19, 0.21], [0.22, 0.23, 0.25]); box(6.98, 0.4, 4.25, 0.28, 0.24, 0.34, [0.3, 0.31, 0.34], [0.36, 0.37, 0.4]);   // the engine, its gearbox
      gl(METAL); box(6.6, 0.73, 4.25, 0.4, 0.045, 0.3, [0.56, 0.58, 0.62], [0.64, 0.66, 0.7]); box(6.36, 0.45, 4.25, 0.05, 0.22, 0.3, [0.3, 0.31, 0.34]);   // (the cam cover, the timing cover)
      for (const [y, z, r] of [[0.5, 4.25, 0.07], [0.64, 4.14, 0.045], [0.62, 4.38, 0.05]]) gAdd(g, new THREE.CylinderGeometry(r, r, 0.03, 8), M4(6.33, y, z, 0, 0, Math.PI / 2), [0.22, 0.23, 0.25]);   // (the pulleys)
      gl(PAINT); for (let i = 0; i < 4; i++) box(6.45 + i * 0.1, 0.775, 4.25, 0.05, 0.035, 0.07, [0.07, 0.07, 0.08]);   // (the coil packs)
      gl(METAL); for (let i = 0; i < 4; i++) gAdd(g, new THREE.CylinderGeometry(0.028, 0.034, 0.12, 8, 1, true), M4(6.45 + i * 0.1, 0.6, 4.55, Math.PI / 2, 0, 0), [0.6, 0.62, 0.66]);   // (the intake trumpets, toward the side)
      for (let i = 0; i < 4; i++) { const x = 6.45 + i * 0.1; tube(g, [[x, 0.6, 4.0], [x + 0.01, 0.56, 3.9], [x + 0.05, 0.46, 3.86], [7.0, 0.43, 3.86], [7.22, 0.43, 3.85]], 0.018, (c) => c[0] < 6.75 ? [0.62, 0.5, 0.38] : c[0] < 6.95 ? [0.44, 0.38, 0.46] : [0.4, 0.4, 0.43], 8, 4); }   // (the headers into the collector, heat-tinted)
      gl(PAINT); for (const s of [-1, 1]) bar([6.98, 0.52, 4.25 + s * 0.17], [7.0, 0.6, 4.25 + s * 0.74], 0.018, [0.16, 0.17, 0.19], 6);   // (the driveshafts)
      gl(MATTE); box(5.9, 0.35, 4.25, 0.5, 0.3, 0.6, [0.06, 0.06, 0.07], [0.08, 0.08, 0.09]); gl(METAL); cylA(g, [5.98, 0.665, 4.42], 'y', 0.045, 0.03, 8, [0.6, 0.62, 0.66]);   // the fuel cell, its filler
      for (const [ux, uz] of [[4.5, 3.45], [4.5, 5.05], [7.0, 3.45], [7.0, 5.05]]) { const o = Math.sign(uz - 4.25), zr = o < 0 ? ZL : ZR;
        gl(PAINT); gBox(g, null, ux, 0.6, uz, 0.07, 0.3, 0.07, [0.14, 0.15, 0.17]);
        gl(METAL); gAdd(g, new THREE.CylinderGeometry(0.15, 0.15, 0.024, 12), M4(ux, 0.6, uz + o * 0.07, Math.PI / 2, 0, 0), (c, n) => Math.abs(n[1]) > 0.5 ? [0.52, 0.53, 0.56] : [0.34, 0.35, 0.38]);   // the disc
        gl(PAINT); gAdd(g, new THREE.CylinderGeometry(0.08, 0.08, 0.05, 8), M4(ux, 0.6, uz + o * 0.1, Math.PI / 2, 0, 0), [0.12, 0.12, 0.13]);   // (its hat, the hub)
        gBox(g, null, ux, 0.735, uz + o * 0.07, 0.15, 0.05, 0.055, [0.8, 0.62, 0.18]);   // the caliper (gold) over its edge
        const ix = Math.sign(5.75 - ux); for (const [y0, y1, d] of [[0.7, 0.62, 0.2], [0.48, 0.4, 0.25]]) for (const e of [-1, 1]) bar([ux, y0, uz - o * 0.03], [ux + ix * 0.02 + e * d, y1, zr], 0.012, [0.12, 0.12, 0.13], 5); }   // (wishbones)
      gl(METAL); cylA(g, [4.5, 0.45, 4.25], 'z', 0.022, 0.9, 6, [0.3, 0.31, 0.34]); gl(MATTE); for (const s of [-1, 1]) { cylA(g, [4.5, 0.45, 4.25 + s * 0.38], 'z', 0.03, 0.1, 6, [0.06, 0.06, 0.07]); bar([4.5, 0.45, 4.25 + s * 0.43], [4.58, 0.5, 4.25 + s * 0.76], 0.009, [0.3, 0.31, 0.34], 5); }   // (the steering rack, its boots, the track rods)
      gl(PAINT); box(4.66, 0.35, 4.08, 0.12, 0.05, 0.34, [0.1, 0.1, 0.11]); gl(METAL); for (const z of [3.96, 4.08, 4.2]) obox(g, [4.69, 0.38, z], [4.62, 0.6, z], 0.05, 0.01, [0.6, 0.62, 0.66]);   // (the pedals)
      // a MIG welder on its cart (two steel shelves, the posts and the handle, big wheels at the back and castors in front): the welder's
      // panel to the room (two knobs, an amber display, the torch's and the earth's sockets), the gas bottle behind it (a green shoulder,
      // the valve, a regulator and its gauge, a chain round it), the torch's hose coiled on the front, the torch, the earth lead to its
      // clamp on the floor
      const WX = 4.22, S2 = [0.2, 0.21, 0.24];
      gl(PAINT); for (const y of [0.18, 0.55]) { box(WX, y, 5.61, 0.42, 0.02, 0.62, S2, [0.24, 0.25, 0.28]); for (const e of [-1, 1]) box(WX + e * 0.2, y + 0.02, 5.61, 0.02, 0.025, 0.62, S2); }
      for (const px of [4.025, 4.415]) { obox(g, [px, 0.08, 5.315], [px, 0.58, 5.315], 0.025, 0.025, S2); obox(g, [px, 0.08, 5.905], [px, 1.02, 5.905], 0.025, 0.025, S2); }
      gl(METAL); obox(g, [4.0, 1.02, 5.905], [4.44, 1.02, 5.905], 0.03, 0.03, STEEL);   // (the handle)
      box(WX, 0.1, 6.04, 0.3, 0.02, 0.22, S2); obox(g, [3.97, 0.1, 6.05], [4.47, 0.1, 6.05], 0.02, 0.02, STEEL);   // (the bottle's tray, the axle)
      gl(MATTE); for (const px of [3.975, 4.465]) gAdd(g, new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12), M4(px, 0.1, 6.05, 0, 0, Math.PI / 2), (c, n) => Math.abs(n[1]) > 0.5 ? [0.3, 0.31, 0.33] : RUB);
      for (const px of [4.06, 4.38]) { box(px, 0.07, 5.34, 0.03, 0.11, 0.03, DK); castor(null, px, 0.04, 5.34, 0.04); }
      gl(PAINT); box(WX, 0.57, 5.56, 0.3, 0.42, 0.5, [0.17, 0.18, 0.2], [0.2, 0.21, 0.23]); box(4.067, 0.6, 5.56, 0.006, 0.36, 0.44, [0.68, 0.69, 0.7]);   // the welder, its panel
      for (let k = 0; k < 4; k++) box(WX, 0.66 + k * 0.06, 5.308, 0.2, 0.012, 0.004, [0.06, 0.06, 0.07]);   // (vents)
      box(4.062, 0.9, 5.56, 0.004, 0.04, 0.08, [1.8, 0.8, 0.25]);   // (the display, lit)
      for (const z of [5.44, 5.68]) gAdd(g, new THREE.CylinderGeometry(0.026, 0.026, 0.024, 8), M4(4.054, 0.8, z, 0, 0, Math.PI / 2), [0.08, 0.08, 0.09]);
      gAdd(g, new THREE.CylinderGeometry(0.028, 0.028, 0.02, 8), M4(4.056, 0.67, 5.44, 0, 0, Math.PI / 2), [0.7, 0.55, 0.28]); gAdd(g, new THREE.CylinderGeometry(0.024, 0.024, 0.02, 8), M4(4.056, 0.67, 5.68, 0, 0, Math.PI / 2), [0.08, 0.08, 0.09]);
      gl(METAL); obox(g, [WX, 1.04, 5.4], [WX, 1.04, 5.72], 0.03, 0.025, STEEL); for (const z of [5.4, 5.72]) obox(g, [WX, 0.99, z], [WX, 1.04, z], 0.025, 0.025, STEEL);   // (its handle)
      gl(PAINT); gAdd(g, new THREE.CylinderGeometry(0.09, 0.09, 0.86, 12, 1, true), M4(WX, 0.55, 6.04), [0.45, 0.47, 0.5]); gAdd(g, new THREE.SphereGeometry(0.09, 12, 3, 0, TAU, 0, Math.PI / 2), M4(WX, 0.98, 6.04, 0, 0, 0, 1, 0.8, 1), [0.15, 0.38, 0.22]);
      gAdd(g, new THREE.CylinderGeometry(0.091, 0.091, 0.08, 12, 1, true), M4(WX, 0.94, 6.04), [0.15, 0.38, 0.22]);   // the bottle, its green shoulder
      gl(METAL); cylA(g, [WX, 1.1, 6.04], 'y', 0.022, 0.08, 8, [0.72, 0.58, 0.3]); gBox(g, null, WX - 0.04, 1.13, 6.04, 0.06, 0.04, 0.04, [0.72, 0.58, 0.3]);   // (the valve, the regulator)
      gAdd(g, new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8), M4(WX - 0.08, 1.15, 6.04, 0, 0, Math.PI / 2), (c, n) => n[1] > 0.5 ? [0.92, 0.92, 0.9] : DK);   // (its gauge)
      tube(g, [[4.025, 0.84, 5.92], [4.1, 0.84, 6.11], [WX, 0.84, 6.145], [4.34, 0.84, 6.11], [4.415, 0.84, 5.92]], 0.006, [0.3, 0.31, 0.33], 8, 3);   // (the chain)
      gl(MATTE); tube(g, [[4.04, 1.12, 6.04], [4.0, 1.04, 5.95], [4.1, 0.9, 5.82]], 0.007, DK, 6, 4); gl(METAL); obox(g, [WX, 0.72, 5.31], [WX, 0.745, 5.26], 0.02, 0.012, STEEL); gl(MATTE);   // (the gas hose into the welder)
      for (const [dx, dy, dz] of [[0, 0, 0], [0.015, -0.02, 0.012]]) gAdd(g, new THREE.TorusGeometry(0.15, 0.012, 4, 14), M4(WX + dx, 0.58 + dy, 5.272 + dz), DK);   // the torch's hose, coiled
      tube(g, [[4.05, 0.67, 5.44], [4.0, 0.7, 5.36], [4.1, 0.74, 5.29], [WX - 0.06, 0.725, 5.275]], 0.012, DK, 8, 4);
      obox(g, [4.33, 0.47, 5.27], [4.35, 0.3, 5.27], 0.035, 0.03, [0.08, 0.08, 0.09]); gl(METAL); seg(g, [4.35, 0.3, 5.27], [4.355, 0.24, 5.27], 0.012, [0.72, 0.45, 0.25]);   // (the torch, its copper tip)
      gl(MATTE); tube(g, [[4.05, 0.67, 5.68], [3.99, 0.5, 5.62], [3.985, 0.15, 5.5], [3.99, 0.012, 5.32], [4.05, 0.012, 5.16]], 0.009, DK, 10, 4); gBox(g, M4(4.09, 0.02, 5.12, 0, 0.6, 0), 0, 0, 0, 0.1, 0.03, 0.04, [0.6, 0.38, 0.2]);   // (the earth lead, its clamp)
      // a creeper half under the chassis' front corner: the board, a red padded headrest, steel edges, six castors
      const CB = M4(4.83, 0, 3.21, 0, 0.12, 0);
      gl(PAINT); gBox(g, CB, 0, 0.075, 0, 0.92, 0.03, 0.38, [0.12, 0.12, 0.13]); gBox(g, CB, -0.36, 0.115, 0, 0.16, 0.05, 0.3, [0.5, 0.1, 0.09]);
      gl(METAL); for (const e of [-1, 1]) gBox(g, CB, 0, 0.072, e * 0.195, 0.92, 0.022, 0.012, STEEL);
      gl(MATTE); for (const lx of [-0.38, 0.38]) for (const e of [-1, 1]) { gBox(g, CB, lx, 0.05, e * 0.15, 0.03, 0.02, 0.025, DK); gAdd(g, new THREE.CylinderGeometry(0.03, 0.03, 0.024, 6), CB.clone().multiply(M4(lx, 0.03, e * 0.15, Math.PI / 2)), DK); }
      BLOBS.push([5.75, 4.25, 3.8, 2.0, 0.55, 0, P], [5.8, 3.13, 0.7, 0.7, 0.7, 0, P], [5.8, 5.37, 0.7, 0.7, 0.7, 0, P], [4.22, 5.72, 0.7, 1.05, 0.7, 0, P], [4.83, 3.21, 1.1, 0.55, 0.5, 0.12, P]); }

    // ---- the right wall: a parts washer, a step ladder, the pit boards, the banner and the graphics panel ----
    // a parts washer by the corner: its drum (rolling hoops), the steel-blue tub on it (its rim, dark inside), the lid open against the
    // wall, the flexible nozzle arching into the tub (a brass tip), the pump's switch, a brush in the tub
    { use(R, PAINT); const WX = 8.63, WZ = 7.11, SB = [0.2, 0.29, 0.4], SBL = [0.32, 0.42, 0.54];
      gAdd(g, new THREE.CylinderGeometry(0.27, 0.27, 0.78, 14, 2), M4(WX, 0.39, WZ), (c, n) => n[1] > 0.5 ? [0.15, 0.16, 0.18] : [0.2, 0.21, 0.24]);
      gl(METAL); for (const y of [0.26, 0.52]) gAdd(g, new THREE.CylinderGeometry(0.278, 0.278, 0.022, 14, 1, true), M4(WX, y, WZ), [0.26, 0.27, 0.3]);
      gl(PAINT); box(8.66, 0.78, WZ, 0.6, 0.2, 0.64, SB, [0.04, 0.05, 0.06]);
      gl(METAL); for (const e of [-1, 1]) { box(8.66 + e * 0.285, 0.98, WZ, 0.03, 0.022, 0.64, SBL); box(8.66, 0.98, WZ + e * 0.305, 0.6, 0.022, 0.03, SBL); }
      cylA(g, [8.88, 0.995, WZ], 'z', 0.012, 0.6, 6, [0.4, 0.42, 0.46]); gl(PAINT); gBox(g, M4(8.919, 1.27, WZ, 0, 0, -0.15), 0, 0, 0, 0.02, 0.55, 0.64, SB);   // (the hinge, the lid)
      gl(MATTE); tube(g, [[8.86, 1.0, 7.38], [8.85, 1.22, 7.36], [8.78, 1.35, 7.29], [8.68, 1.3, 7.2], [8.64, 1.13, 7.13]], 0.012, [0.16, 0.17, 0.19], 10, 4);
      gl(METAL); seg(g, [8.64, 1.13, 7.13], [8.635, 1.06, 7.12], 0.014, [0.72, 0.58, 0.3]);
      gl(PAINT); box(8.35, 0.8, 6.95, 0.02, 0.1, 0.07, [0.1, 0.1, 0.11]); box(8.338, 0.84, 6.95, 0.008, 0.03, 0.035, [0.8, 0.12, 0.1]);   // (the pump's switch, its red rocker)
      gl(SATIN); obox(g, [8.52, 1.0, 6.98], [8.4, 1.13, 6.93], 0.022, 0.018, [0.62, 0.45, 0.26]); gBox(g, M4(8.54, 0.985, 6.99, 0, 0.4, 0), 0, 0, 0, 0.07, 0.03, 0.04, [0.1, 0.09, 0.08]);   // (the brush)
      BLOBS.push([8.66, 7.11, 0.9, 1.0, 0.7, 0, R]); WALLAO.push(['r', 6.75, 7.5, 0, 1.55, 0.5, R]); }
    // an aluminium step ladder standing open by the washer (its legs spread along the wall): rails, four steps with dark treads, the top
    // platform, the tool tray on the back legs, the spreader bars, rubber feet
    { use(R, METAL); const LA = [0.66, 0.68, 0.72], ZF = 6.02, ZB = 6.58, HL = 1.42, zf = (y) => ZF + 0.22 * y / HL, zb = (y) => ZB - 0.22 * y / HL;
      for (const x of [7.55, 7.95]) { obox(g, [x, 0.03, ZF], [x, HL, zf(HL)], 0.05, 0.025, LA); obox(g, [x, 0.03, ZB], [x, HL, zb(HL)], 0.045, 0.022, LA); obox(g, [x, 0.72, zf(0.72)], [x, 0.72, zb(0.72)], 0.01, 0.025, STEEL); }
      for (const y of [0.32, 0.62, 0.92, 1.18]) { box(7.75, y - 0.03, zf(y), 0.38, 0.03, 0.09, LA); gl(MATTE); box(7.75, y, zf(y), 0.36, 0.006, 0.08, [0.08, 0.08, 0.09]); gl(METAL); }
      gl(PAINT); box(7.75, HL, 6.3, 0.44, 0.04, 0.22, [0.2, 0.21, 0.23]); box(7.75, 1.06, zb(1.06) + 0.06, 0.36, 0.025, 0.14, [0.2, 0.21, 0.23]);   // (the top, the tray)
      gl(MATTE); for (const x of [7.55, 7.95]) for (const z of [ZF, ZB]) box(x, 0, z, 0.035, 0.035, 0.065, [0.06, 0.06, 0.07]);
      BLOBS.push([7.75, 6.3, 0.75, 0.8, 0.5, 0, R]); }
    // two pit boards leaning in the corner on their poles (the second against the first): dark backs and edges; their faces are prints
    { use(R, PAINT);
      for (const [bx, by, bz, a, r, k] of [[8.9, 1.995, 8.155, 0.12, 0, 'pb1'], [8.82, 1.895, 8.225, 0.16, 0.04, 'pb2']]) { const m = M4(bx, by, bz, r, 0, -a), L = (x, y, z) => new V3(x, y, z).applyMatrix4(m).toArray();
        gBox(g, m, 0, 0, 0, 0.012, 0.55, 0.75, [0.17, 0.18, 0.2]);
        const top = new V3(0.026, 0.12, 0).applyMatrix4(m), d = new V3(0, -1, 0).applyMatrix4(new THREE.Matrix4().extractRotation(m)), foot = top.clone().addScaledVector(d, top.y / -d.y);
        gl(METAL); obox(g, foot.toArray(), top.toArray(), 0.035, 0.035, ALU); gl(MATTE); obox(g, foot.toArray(), foot.clone().addScaledVector(d, -0.08).toArray(), 0.04, 0.04, DK); gl(PAINT);
        const f = puv(k), q = [[-0.375, -0.275], [0.375, -0.275], [0.375, 0.275], [-0.375, 0.275]];   // (the face: local z along the wall, the room at local -x)
        pq.quadO(...q.map(([u, v]) => L(-0.0075, v, u)), [1, 1, 1], L(1, 0, 0), q.map(([u, v]) => f(u / 0.75 + 0.5, v / 0.55 + 0.5))); }
      BLOBS.push([8.72, 8.2, 0.4, 0.8, 0.4, 0, R]); }
    // the team's banner on a rod over the suits (its cloth in a few folds) and the graphics panel on its standoffs right of the air riser
    { use(R, METAL); const XB = x1 - 0.03, z0b = 3.15, z1b = 4.75, yt = 3.09, yb = 2.38;
      bar([x1 - 0.045, 3.1, 3.08], [x1 - 0.045, 3.1, 4.82], 0.012, ALU, 8); for (const z of [3.12, 4.78]) obox(g, [x1, 3.1, z], [x1 - 0.05, 3.1, z], 0.015, 0.02, STEEL);
      const f = puv('ban'), n = 10;
      for (let i = 0; i < n; i++) { const za = z0b + (z1b - z0b) * i / n, zb2 = z0b + (z1b - z0b) * (i + 1) / n, w = (z) => 0.009 * Math.sin((z - z0b) * 7.5 + 0.6), ym = (yt + yb) / 2;
        for (const [ya, yb2, ka, kb] of [[yt, ym, 0, 0.5], [ym, yb, 0.5, 1]]) pq.quadO([XB - w(za) * ka, ya, za], [XB - w(zb2) * ka, ya, zb2], [XB - w(zb2) * kb, yb2, zb2], [XB - w(za) * kb, yb2, za], [1, 1, 1], [x1 + 1, ya, (za + zb2) / 2],
          [f((za - z0b) / (z1b - z0b), (ya - yb) / (yt - yb)), f((zb2 - z0b) / (z1b - z0b), (ya - yb) / (yt - yb)), f((zb2 - z0b) / (z1b - z0b), (yb2 - yb) / (yt - yb)), f((za - z0b) / (z1b - z0b), (yb2 - yb) / (yt - yb))]); }
      const pz0 = 5.05, pz1 = 6.3, py0 = 2.3, py1 = 3.1, XP = x1 - 0.03, fp = puv('pan');
      gl(PAINT); box(XP + 0.006, py0, (pz0 + pz1) / 2, 0.012, py1 - py0, pz1 - pz0, [0.1, 0.11, 0.13]);
      pq.quadO([XP - 0.0015, py0, pz0], [XP - 0.0015, py0, pz1], [XP - 0.0015, py1, pz1], [XP - 0.0015, py1, pz0], [1, 1, 1], [x1 + 1, 2.7, 5.6], [fp(0, 0), fp(1, 0), fp(1, 1), fp(0, 1)]);
      gl(METAL); for (const z of [pz0 + 0.06, pz1 - 0.06]) for (const y of [py0 + 0.06, py1 - 0.06]) cylA(g, [XP - 0.004, y, z], 'x', 0.012, 0.008, 8, [0.7, 0.72, 0.76]); }   // (its standoffs' caps)
    const pm = new THREE.Mesh(pq.geometry(), new THREE.MeshLambertMaterial({ map: prints })); pm.material.userData.noCube = true; R.root.add(pm);

    // ---- a utility cart by the bare slicks (a piece of its own: in the trolley's its bounds took the trolley into views it is not in):
    // three black trays on steel posts and castors; a brake disc with its caliper, a torque wrench and a box of nuts on top, small bins in
    // the middle, a fuel can at the bottom ----
    { const CT = use(piece(), PAINT); CT.near = TB.near; const B = M4(5.0, 0, -2.22, 0, 0.1, 0), PLs = [0.1, 0.1, 0.11], PLl = [0.13, 0.13, 0.14];
      gl(SATIN); for (const y of [0.15, 0.48, 0.82]) { gBox(g, B, 0, y, 0, 0.55, 0.02, 0.45, PLs);
        for (const e of [-1, 1]) { gBox(g, B, e * 0.265, y + 0.025, 0, 0.02, 0.03, 0.45, PLl); gBox(g, B, 0, y + 0.025, e * 0.215, 0.55, 0.03, 0.02, PLl); } }
      gl(METAL); for (const sx of [-0.255, 0.255]) for (const sz of [-0.205, 0.205]) gBox(g, B, sx, 0.47, sz, 0.022, 0.78, 0.022, STEEL);
      gl(MATTE); for (const sx of [-0.23, 0.23]) for (const sz of [-0.18, 0.18]) { gBox(g, B, sx, 0.09, sz, 0.03, 0.05, 0.025, DK); gAdd(g, new THREE.CylinderGeometry(0.035, 0.035, 0.028, 8), B.clone().multiply(M4(sx, 0.035, sz, Math.PI / 2)), DK); }
      gl(METAL); gAdd(g, new THREE.CylinderGeometry(0.15, 0.15, 0.022, 12), B.clone().multiply(M4(-0.12, 0.842, 0.09)), (c, n) => n[1] > 0.5 ? [0.5, 0.51, 0.54] : [0.34, 0.35, 0.38]);   // the disc
      gl(PAINT); gAdd(g, new THREE.CylinderGeometry(0.075, 0.075, 0.045, 8), B.clone().multiply(M4(-0.12, 0.875, 0.09)), [0.12, 0.12, 0.13]); gBox(g, B, 0.02, 0.87, 0.09, 0.05, 0.06, 0.13, [0.8, 0.62, 0.18]);   // (its hat, the caliper)
      const L = (x, y, z) => new V3(x, y, z).applyMatrix4(B).toArray();
      gl(METAL); obox(g, L(-0.2, 0.842, -0.19), L(0.17, 0.842, 0.09), 0.025, 0.02, STEEL); gl(PAINT); obox(g, L(0.17, 0.846, 0.09), L(0.27, 0.846, 0.165), 0.032, 0.03, [0.6, 0.12, 0.1]);   // the torque wrench, its grip
      gl(METAL); gAdd(g, new THREE.CylinderGeometry(0.026, 0.026, 0.03, 8), B.clone().multiply(M4(-0.2, 0.847, -0.19)), STEEL);
      gl(SATIN); gBox(g, B, 0.17, 0.865, -0.13, 0.1, 0.05, 0.08, [0.75, 0.62, 0.38]); gBox(g, B, 0.17, 0.891, -0.13, 0.085, 0.004, 0.065, [0.42, 0.4, 0.36]);   // (the box of nuts)
      for (const [x, c] of [[-0.17, [0.18, 0.34, 0.62]], [0, [0.36, 0.38, 0.42]], [0.17, [0.18, 0.34, 0.62]]]) { gBox(g, B, x, 0.535, 0.02, 0.14, 0.08, 0.2, c); gBox(g, B, x, 0.574, 0.02, 0.12, 0.004, 0.18, [0.05, 0.05, 0.06]); }   // the bins
      gl(PAINT); gBox(g, B, -0.08, 0.27, 0, 0.13, 0.22, 0.24, [0.62, 0.12, 0.09]); gBox(g, B, -0.08, 0.395, 0.05, 0.03, 0.03, 0.12, [0.5, 0.09, 0.07]); gBox(g, B, -0.08, 0.4, -0.09, 0.03, 0.04, 0.03, [0.1, 0.1, 0.11]);   // the can, its handle, its cap
      BLOBS.push([5.0, -2.22, 0.8, 0.65, 0.7, 0.1, CT]); }

    // ---- the back wall: the air drop's hose down from its hook to loose loops on the floor; a cord reel under the roof, its cage lamp ----
    { use(BK, MATTE); const HY = [0.93, 0.72, 0.12], pts = [[5.03, 1.06, -4.672], [5.02, 0.8, -4.64], [4.99, 0.4, -4.58], [4.93, 0.1, -4.51], [4.84, 0.011, -4.45]], a0 = -0.42;
      for (let i = 0; i <= 44; i++) { const tt = i / 44, a = a0 + tt * 2.5 * TAU, r = 0.345 - 0.12 * tt + 0.015 * Math.sin(a * 3 + 1.3); pts.push([4.4 + Math.cos(a) * r, 0.011, -4.2 + Math.sin(a) * r]); }
      tube(g, pts, 0.011, HY, 64, 3); const e = pts[pts.length - 1], e2 = pts[pts.length - 2], dx = e[0] - e2[0], dz = e[2] - e2[2], dl = Math.hypot(dx, dz);
      gl(METAL); seg(g, e, [e[0] + dx / dl * 0.06, 0.011, e[2] + dz / dl * 0.06], 0.014, [0.8, 0.64, 0.28], 8); }   // (its coupler)
    { use(BK, PAINT); const X = 3.9, Z = -3.25, Y = 4.5, YL = [0.95, 0.75, 0.12];
      gAdd(g, new THREE.CylinderGeometry(0.13, 0.13, 0.09, 16), M4(X, Y, Z, 0, 0, Math.PI / 2), (c, n) => Math.abs(n[1]) > 0.5 ? [0.85, 0.66, 0.1] : YL); cylA(g, [X, Y, Z], 'x', 0.05, 0.13, 10, [0.12, 0.12, 0.13]);
      for (const s of [-1, 1]) gBox(g, null, X + s * 0.07, 4.575, Z, 0.012, 0.16, 0.07, DK);
      gl(MATTE); seg(g, [X, Y - 0.12, Z + 0.02], [X, 2.13, Z + 0.02], 0.006, [0.06, 0.06, 0.07], 5); gl(PAINT); gAdd(g, new THREE.SphereGeometry(0.03, 8, 4), M4(X, 2.15, Z + 0.02), [0.72, 0.12, 0.1]);   // the cord, its stop
      gl(MATTE); gAdd(g, new THREE.CylinderGeometry(0.026, 0.03, 0.1, 8), M4(X, 2.07, Z + 0.02), [0.08, 0.08, 0.09]);   // the lamp: its grip, its cage round the lit tube, its hook
      gl(METAL); for (const y of [2.01, 1.81]) gAdd(g, new THREE.CylinderGeometry(0.036, 0.036, 0.016, 8), M4(X, y, Z + 0.02), [0.16, 0.17, 0.19]);
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; seg(g, [X + Math.cos(a) * 0.034, 1.815, Z + 0.02 + Math.sin(a) * 0.034], [X + Math.cos(a) * 0.034, 2.005, Z + 0.02 + Math.sin(a) * 0.034], 0.003, [0.2, 0.21, 0.23], 3); }
      gl(MATTE); cylA(g, [X, 1.91, Z + 0.02], 'y', 0.017, 0.18, 8, [2.4, 2.2, 1.8]); gl(METAL); gAdd(g, new THREE.TorusGeometry(0.018, 0.004, 3, 6, Math.PI * 1.3), M4(X, 1.79, Z + 0.02, 0, 0, Math.PI), [0.3, 0.31, 0.33]); }

    // the walls' contact shadows behind the tall things on the right (the decal block lays them)
    WALLAO.push(['b', 1.1, 4.8, 0, 2.3, 0.6, BK], ['b', 5.2, 7.8, 0, 2.1, 0.6, BK], ['r', 3.0, 4.8, 0.7, 2.2, 0.4, R], ['r', 4.85, 5.95, 0, 1.0, 0.5, R]);
    g = sm = cp = null;
  }
  // the front zone's new things (round 2): in the left corner the team's corner to sit (a kitchenette, a sofa and its table on a rug, a
  // lit drinks fridge; the TV over the sofa is the desk's block's), the recycling bins and a broom by the lockers: in a piece of their
  // own that steps aside with the front wall (PK: off the default view's draws, where the front wall's piece is drawn behind the camera);
  // right of the column, in the front wall's piece: the track maps, the seats and steering wheels on their rail, a pallet of boxed
  // parts, the spill kit
  function buildKitF() {
    const PF = WALLS.front, PK = piece(PF.wall), DK = PAL.dk, STEEL = PAL.steel, ALU = PAL.alu, CHROME = PAL.chrome, WHITE = PAL.white, NAVYM = [0.12, 0.16, 0.3];
    let g = null, sm = null, cp = null; const use = (p, k) => { g = p.g; sm = p.sm; cp = p; gloss(p, k == null ? PAINT : k); return p; }, gl = (k) => gloss(cp, k), box = (...a) => fbox(g, ...a);
    // (a quad facing the room (-z) at z; one facing up at y; a tapered box's front and sides, its top (the back to the wall unseen);
    // a cup: its sides and its top (in: the inside's colour); x2: a floor thing's colour twice (the floor's occlusion halves it))
    const fq = (xa, xb, ya, yb, z, col) => g.quadO([xa, ya, z], [xb, ya, z], [xb, yb, z], [xa, yb, z], col, [(xa + xb) / 2, (ya + yb) / 2, z + 1]);
    const tq = (xa, xb, za, zb, y, col) => g.quadO([xa, y, za], [xb, y, za], [xb, y, zb], [xa, y, zb], col, [(xa + xb) / 2, y - 1, (za + zb) / 2]);
    const taper = (cx, zb, y0, y1, w0, d0, w1, d1, col, top) => { const P = (y, w, d, sx, sz) => [cx + sx * w / 2, y, zb - (sz ? d : 0)], c = [cx, (y0 + y1) / 2, zb - d0 / 2];
      g.quadO(P(y0, w0, d0, -1, 1), P(y0, w0, d0, 1, 1), P(y1, w1, d1, 1, 1), P(y1, w1, d1, -1, 1), col, c);
      for (const s of [-1, 1]) g.quadO(P(y0, w0, d0, s, 1), P(y0, w0, d0, s, 0), P(y1, w1, d1, s, 0), P(y1, w1, d1, s, 1), col, c);
      if (top) g.quadO(P(y1, w1, d1, -1, 1), P(y1, w1, d1, 1, 1), P(y1, w1, d1, 1, 0), P(y1, w1, d1, -1, 0), top, c); };
    const cup = (x, y, z, r, h, col, inn) => World.cyl(g, x, y, z, r, h, 6, col, inn || [0.09, 0.07, 0.06]);
    const x2 = (c) => c.map(v => v * 1.95);
    // the kitchenette: a graphite base unit (two doors, bar pulls, a dark plinth) under a stone worktop; a coffee machine (its brushed
    // front, the drip tray, a red standby light), a kettle, two mugs; a shelf over it with more mugs and a tin
    { use(PK, PAINT); const X = -7.935, KG = [0.2, 0.21, 0.24], KD = [0.25, 0.26, 0.29];
      box(X, 0, 8.66, 0.93, 0.1, 0.46, [0.05, 0.05, 0.06]); box(X, 0.1, 8.625, 0.97, 0.78, 0.55, KG, KG);
      for (const s of [-1, 1]) fq(X + s * 0.003, X + s * 0.482, 0.12, 0.86, 8.347, KD);
      gl(METAL); for (const s of [-1, 1]) obox(g, [X + s * 0.07, 0.8, 8.334], [X + s * 0.33, 0.8, 8.334], 0.014, 0.014, ALU);
      gl(SATIN); box(X, 0.88, 8.642, 0.99, 0.035, 0.684, [0.6, 0.6, 0.58], [0.64, 0.64, 0.62]);
      gl(PAINT); box(-8.15, 0.915, 8.65, 0.3, 0.38, 0.4, [0.06, 0.06, 0.07], [0.09, 0.09, 0.1]); fq(-8.24, -8.06, 0.95, 1.08, 8.448, [0.02, 0.02, 0.025]);
      gl(METAL); box(-8.15, 1.1, 8.444, 0.27, 0.18, 0.012, [0.62, 0.64, 0.68]); box(-8.15, 0.915, 8.42, 0.2, 0.02, 0.1, [0.5, 0.52, 0.55]);
      gl(MATTE); fq(-8.05, -8.035, 1.245, 1.26, 8.437, [2.0, 0.3, 0.2]); cup(-8.15, 0.935, 8.42, 0.026, 0.05, WHITE, [0.2, 0.12, 0.07]);
      gl(PAINT); World.cyl(g, -7.62, 0.915, 8.72, 0.085, 0.022, 6, DK, DK); World.cyl(g, -7.62, 0.937, 8.72, 0.075, 0.19, 8, [0.8, 0.81, 0.82], [0.3, 0.31, 0.33], 0.062);
      obox(g, [-7.62, 0.99, 8.81], [-7.62, 1.11, 8.81], 0.022, 0.022, DK); obox(g, [-7.62, 1.11, 8.81], [-7.62, 1.115, 8.76], 0.022, 0.018, DK); obox(g, [-7.62, 1.0, 8.648], [-7.62, 1.07, 8.62], 0.02, 0.02, [0.8, 0.81, 0.82]);
      cup(-7.86, 0.915, 8.48, 0.04, 0.095, WHITE); cup(-7.76, 0.915, 8.57, 0.04, 0.095, NAVYM);
      // (the shelf on two brackets: four mugs, a tin)
      gl(SATIN); box(-7.95, 1.5, 8.875, 0.9, 0.025, 0.25, [0.55, 0.43, 0.29], [0.6, 0.47, 0.32]);
      gl(PAINT); for (const x of [-8.3, -7.6]) obox(g, [x, 1.36, 8.985], [x, 1.495, 8.8], 0.02, 0.012, DK);
      [[-8.3, WHITE], [-8.19, NAVYM], [-8.08, WHITE], [-7.97, [0.78, 0.6, 0.2]]].forEach(([x, c]) => cup(x, 1.525, 8.86, 0.04, 0.095, c));
      World.cyl(g, -7.7, 1.525, 8.86, 0.06, 0.15, 8, [0.16, 0.3, 0.22], [0.6, 0.62, 0.66]);
      WALLAO.push(['f', -8.43, -7.44, 0, 0.92, 0.5, PK]); BLOBS.push([-7.935, 8.62, 1.25, 0.75, 0.75, 0, PK]); }
    // the sofa, its back to the wall (charcoal, its cushions a shade lighter on top; a navy and a gold cushion thrown on it; chrome feet);
    // a low table in front of it on a rug (magazines, two mugs)
    { use(PK, MATTE); const X = -6.55, FB = [0.16, 0.17, 0.19], FT = [0.17, 0.18, 0.2], FD = [0.12, 0.125, 0.14];
      box(-6.3, 0, 7.75, 1.4, 0.006, 0.6, x2([0.24, 0.25, 0.27]), x2([0.25, 0.26, 0.28]));   // (the rug)
      gl(METAL); for (const x of [-7.3, -5.8]) for (const z of [8.09, 8.81]) World.box(g, x, 0, z, 0.04, 0.06, 0.04, 0, CHROME, CHROME, true);
      gl(MATTE); box(X, 0.06, 8.45, 1.3, 0.36, 0.8, FD, FB); for (const s of [-1, 1]) box(X + s * 0.725, 0.06, 8.45, 0.15, 0.56, 0.84, FB, FT);
      box(X, 0.42, 8.78, 1.3, 0.45, 0.14, FB, FT);
      for (const s of [-1, 1]) { const x = X + s * 0.3275; box(x, 0.42, 8.36, 0.645, 0.11, 0.62, FB, FT); gBox(g, M4(x, 0.71, 8.64, 0.15, 0, 0), 0, 0, 0, 0.635, 0.4, 0.17, FT); }
      gBox(g, M4(-6.98, 0.7, 8.5, 0.28, 0.35, 0.08), 0, 0, 0, 0.36, 0.34, 0.11, [0.12, 0.16, 0.3]); gBox(g, M4(-6.08, 0.69, 8.5, 0.3, -0.3, -0.12), 0, 0, 0, 0.34, 0.32, 0.11, [0.75, 0.58, 0.18]);
      gl(SATIN); box(-6.3, 0.39, 7.72, 0.7, 0.03, 0.38, [0.12, 0.12, 0.13], [0.14, 0.14, 0.15]);
      gl(METAL); for (const sx of [-1, 1]) for (const sz of [-1, 1]) World.box(g, -6.3 + sx * 0.31, 0, 7.72 + sz * 0.15, 0.025, 0.39, 0.025, 0, STEEL, STEEL, true);
      gl(MATTE); [[-6.47, 7.72, 0.2, [0.72, 0.7, 0.64]], [-6.46, 7.71, -0.1, [0.2, 0.34, 0.56]], [-6.2, 7.7, 1.2, [0.7, 0.3, 0.2]]].forEach(([x, z, r, c], i) => box(x, 0.42 + (i === 1 ? 0.006 : 0), z, 0.2, 0.006, 0.27, c, c, r));
      cup(-5.995, 0.42, 7.6, 0.04, 0.095, WHITE); cup(-5.995, 0.42, 7.84, 0.04, 0.095, [0.62, 0.14, 0.1]);
      WALLAO.push(['f', -7.35, -5.75, 0, 0.87, 0.55, PK]); BLOBS.push([X, 8.45, 2.0, 1.1, 0.75, 0, PK], [-6.3, 7.72, 0.9, 0.55, 0.5, 0, PK]); }
    // a drinks fridge with a glass door: the black cabinet, its lit header, the aluminium door frame and handle, a kick grille; inside
    // (lit: its colours over 1) the white back, four shelves with their white edges, the drinks a row of one kind a shelf as a fridge is
    // stocked (big bottles of water at the foot, bottles with their necks and caps, cans with their silver tops; a gap where one is gone)
    { use(PK, PAINT); const X = -5.32, FK = [0.07, 0.07, 0.08], FR = [0.62, 0.64, 0.68], Rf = Core.rng(4246);
      for (const s of [-1, 1]) box(X + s * 0.28, 0, 8.6, 0.04, 1.75, 0.6, FK, FK);
      box(X, 1.6, 8.6, 0.52, 0.15, 0.6, FK, FK); box(X, 0, 8.6, 0.52, 0.14, 0.6, FK, [0.85, 0.86, 0.88]);
      gl(MATTE); fq(X - 0.26, X + 0.26, 1.635, 1.715, 8.297, [1.6, 1.6, 1.55]);
      for (let i = 0; i < 3; i++) fq(X - 0.22, X + 0.22, 0.03 + i * 0.035, 0.045 + i * 0.035, 8.297, [0.16, 0.16, 0.17]);
      fq(X - 0.26, X + 0.26, 0.14, 1.6, 8.86, [1.5, 1.55, 1.6]);   // (inside: the back, the side we see, the shelves, what stands on them)
      g.quadO([X - 0.259, 0.14, 8.86], [X - 0.259, 0.14, 8.3], [X - 0.259, 1.6, 8.3], [X - 0.259, 1.6, 8.86], [1.15, 1.18, 1.22], [X - 1, 0.9, 8.6]);
      // (each shelf: [bottle or can, its colours (the row's two kinds), the cap's, w, h, the gap between]; x1.3: lit)
      const L = (c) => c.map(v => v * 1.3), SIL = L([0.82, 0.84, 0.88]), DR = [['b', [[0.55, 0.68, 0.82]], [0.22, 0.36, 0.7], 0.085, 0.27, 0.012], ['b', [[0.2, 0.4, 0.25]], [0.84, 0.84, 0.8], 0.066, 0.215, 0.012],
        ['c', [[0.6, 0.16, 0.14], [0.82, 0.82, 0.78]], null, 0.066, 0.122, 0.004], ['c', [[0.2, 0.32, 0.56], [0.78, 0.48, 0.2]], null, 0.066, 0.122, 0.004], ['b', [[0.82, 0.62, 0.22]], [0.2, 0.44, 0.24], 0.06, 0.17, 0.01]];
      for (let k = 0; k < 5; k++) { const y = 0.14 + k * 0.29, [kind, cs, cap, w, h, gap] = DR[k];
        if (k) { tq(X - 0.26, X + 0.26, 8.32, 8.84, y, [0.75, 0.77, 0.8]); fq(X - 0.26, X + 0.26, y - 0.012, y, 8.32, [1.9, 1.9, 1.9]); }
        for (let i = 0, x = X - 0.236; x + w <= X + 0.252; i++, x += w + gap) { if (Rf() < 0.1) continue;   // (one gone)
          const c = L(cs[Math.min(cs.length - 1, i * cs.length / 7 | 0)]), z = 8.35 + Rf() * 0.012, hb = kind === 'c' ? h - 0.012 : h * 0.66, sd = c.map(v => v * 0.7);
          fq(x, x + w, y, y + hb, z, c); g.quadO([x + w, y, z], [x + w, y, z + 0.07], [x + w, y + hb, z + 0.07], [x + w, y + hb, z], sd, [x + w - 1, y, z]);
          if (kind === 'c') { fq(x, x + w, y + hb, y + h, z, SIL); tq(x, x + w, z, z + 0.07, y + h, SIL.map(v => v * 0.85)); }   // (the can's top)
          else { tq(x, x + w, z, z + 0.07, y + hb, c.map(v => v * 0.8)); fq(x + w * 0.3, x + w * 0.7, y + hb, y + h * 0.9, z + 0.025, c.map(v => v * 0.9)); fq(x + w * 0.32, x + w * 0.68, y + h * 0.9, y + h, z + 0.025, L(cap)); } } }
      gl(METAL); for (const s of [-1, 1]) World.box(g, X + s * 0.2575, 0.14, 8.292, 0.035, 1.46, 0.016, 0, FR, FR, true);
      for (const y of [0.14, 1.565]) World.box(g, X, y, 8.292, 0.48, 0.035, 0.016, 0, FR, FR, true);
      obox(g, [X + 0.2, 0.72, 8.262], [X + 0.2, 1.3, 8.262], 0.02, 0.02, ALU);
      WALLAO.push(['f', X - 0.3, X + 0.3, 0, 1.75, 0.6, PK]); BLOBS.push([X, 8.6, 0.85, 0.85, 0.75, 0, PK]); }
    // the recycling: three 60 l bins by the lockers (blue, yellow, graphite: tapered, their lids with a slot, a blank label each); a broom
    // and a squeegee leaning in the gap by the lockers
    { use(PK, PAINT); const zb = 8.9;
      [[-4.33, [0.15, 0.28, 0.52]], [-3.97, [0.8, 0.62, 0.13]], [-3.61, [0.25, 0.26, 0.28]]].forEach(([x, c]) => { const lo = c.map(v => v * 0.82);
        taper(x, zb, 0, 0.4, 0.3, 0.4, 0.3187, 0.4187, c, null); taper(x, zb, 0.4, 0.75, 0.3187, 0.4187, 0.335, 0.435, c, null);
        box(x, 0.75, zb - 0.22, 0.35, 0.03, 0.45, lo, lo.map(v => v * 1.12)); tq(x - 0.1, x + 0.1, zb - 0.42, zb - 0.36, 0.781, [0.03, 0.03, 0.035]);
        const zf = (y) => zb - 0.4 - 0.035 * y / 0.75 - 0.002; g.quadO([x - 0.065, 0.46, zf(0.46)], [x + 0.065, 0.46, zf(0.46)], [x + 0.065, 0.56, zf(0.56)], [x - 0.065, 0.56, zf(0.56)], [0.88, 0.88, 0.85], [x, 0.5, zb]); });
      gl(SATIN); obox(g, [-3.335, 0.1, 8.62], [-3.335, 1.32, 8.977], 0.024, 0.024, [0.55, 0.42, 0.26]); box(-3.335, 0.035, 8.63, 0.055, 0.06, 0.34, [0.16, 0.3, 0.55]);
      gl(MATTE); box(-3.335, 0, 8.63, 0.05, 0.035, 0.33, [0.07, 0.07, 0.07]);
      gl(SATIN); obox(g, [-3.405, 0.07, 8.55], [-3.405, 1.25, 8.977], 0.022, 0.022, [0.3, 0.32, 0.35]); gl(PAINT); box(-3.405, 0.022, 8.55, 0.03, 0.045, 0.45, [0.6, 0.12, 0.1]);   // (the squeegee's pole coated grey: a bare alu one read as a white line from the orbit)
      gl(MATTE); box(-3.405, 0, 8.55, 0.02, 0.022, 0.45, [0.05, 0.05, 0.05]);
      WALLAO.push(['f', -4.5, -3.3, 0, 0.8, 0.45, PK]); BLOBS.push([-3.97, 8.68, 1.3, 0.6, 0.6, 0, PK]); }
    // three maps of the game's tracks in black frames (a white mat, the navy field, the line in white, its start in gold, the north
    // arrow, the place's name): their pictures in one canvas, one mesh (the outlines: the tracks' OpenStreetMap centre lines, simplified)
    { use(PF, SATIN); const SY = 320 / 274, MAPS = [['VRŠIČ', 0, [780, 0, 781, 52, 699, 105, 673, 147, 667, 213, 708, 215, 722, 231, 725, 297, 686, 379, 686, 469, 671, 455, 663, 470, 663, 596, 611, 704, 598, 769, 598, 754, 570, 788, 541, 786, 542, 798, 532, 788, 526, 806, 518, 783, 537, 766, 477, 788, 439, 878, 422, 836, 421, 862, 415, 837, 408, 865, 392, 845, 363, 863, 338, 855, 338, 819, 320, 859, 311, 834, 279, 844, 273, 883, 259, 863, 219, 945, 238, 1000]],
        ['LJUBLJANA', 1, [534, 286, 711, 241, 871, 193, 952, 164, 990, 190, 1000, 230, 977, 259, 855, 294, 711, 334, 569, 370, 505, 415, 492, 487, 486, 568, 476, 672, 460, 772, 428, 830, 333, 839, 228, 833, 164, 801, 153, 691, 145, 616, 68, 592, 0, 553, 10, 415, 39, 270, 61, 177, 119, 161, 204, 195, 322, 235, 421, 262]],
        ['BATHURST', 1, [695, 17, 590, 0, 576, 10, 487, 506, 469, 519, 450, 519, 327, 456, 304, 456, 283, 464, 277, 471, 278, 484, 304, 516, 311, 533, 301, 597, 290, 612, 250, 635, 215, 672, 193, 727, 201, 763, 245, 833, 262, 849, 288, 859, 403, 862, 437, 877, 468, 877, 488, 902, 511, 904, 549, 938, 582, 954, 605, 994, 618, 1000, 626, 997, 637, 982, 676, 914, 753, 416, 807, 293, 785, 264, 779, 242, 807, 41, 796, 34]]];
      const art = canvasTex(512, 256, (gx, w, h) => { MAPS.forEach(([name, closed, T], i) => {   // (a poster 170 x 256: 0.62 x 0.8 m, its art drawn to the metre (SY))
        gx.save(); gx.translate(i * 171, 0); gx.fillStyle = '#e8e7e1'; gx.fillRect(0, 0, 170, h);
        const fx = 10, fy = 10 * SY, fw = 150, fh = h - 20 * SY; gx.fillStyle = '#18213d'; gx.fillRect(fx, fy, fw, fh);
        gx.strokeStyle = 'rgba(255,255,255,0.055)'; gx.lineWidth = 1; for (let x = fx + 15; x < fx + fw; x += 15) { gx.beginPath(); gx.moveTo(x + 0.5, fy); gx.lineTo(x + 0.5, fy + fh); gx.stroke(); }
        for (let y = fy + 15 * SY; y < fy + fh; y += 15 * SY) { gx.beginPath(); gx.moveTo(fx, y); gx.lineTo(fx + fw, y); gx.stroke(); }
        const S = 124, ox = fx + 13, oy = fy + 22 * SY, P = (k) => [ox + T[k] / 1000 * S, oy + T[k + 1] / 1000 * S * SY];
        const line = () => { gx.beginPath(); for (let k = 0; k < T.length; k += 2) { const [x, y] = P(k); k ? gx.lineTo(x, y) : gx.moveTo(x, y); } if (closed) gx.closePath(); };
        gx.lineJoin = gx.lineCap = 'round'; line(); gx.strokeStyle = 'rgba(0,0,0,0.45)'; gx.lineWidth = 6; gx.stroke(); line(); gx.strokeStyle = '#f2f1ec'; gx.lineWidth = 3; gx.stroke();
        const [ax, ay] = P(0), [bx, by] = P(2), L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L * 7, ny = (bx - ax) / L * 7;
        gx.strokeStyle = '#f5c84c'; gx.lineWidth = 3.5; gx.lineCap = 'butt'; gx.beginPath(); gx.moveTo(ax - nx, ay - ny); gx.lineTo(ax + nx, ay + ny); gx.stroke();
        gx.fillStyle = '#f2f1ec'; gx.beginPath(); gx.moveTo(fx + fw - 14, fy + 7 * SY); gx.lineTo(fx + fw - 9, fy + 19 * SY); gx.lineTo(fx + fw - 14, fy + 16 * SY); gx.lineTo(fx + fw - 19, fy + 19 * SY); gx.closePath(); gx.fill();
        gx.save(); gx.translate(fx + fw - 14, fy + 29 * SY); gx.scale(1, SY); gx.font = 'bold 9px Roboto, Arial, sans-serif'; gx.textAlign = 'center'; gx.fillText('N', 0, 0); gx.restore();
        gx.fillStyle = '#f5c84c'; gx.fillRect(fx + 22, fy + fh - 32 * SY, fw - 44, 1.5);
        gx.save(); gx.translate(fx + fw / 2, fy + fh - 11 * SY); gx.scale(1, SY); gx.fillStyle = '#f2f1ec'; gx.font = '900 17px Roboto, Arial, sans-serif'; gx.textAlign = 'center'; gx.fillText(name, 0, 0, fw - 16); gx.restore();
        gx.restore(); }); });
      const pq = new QB(); [5.72, 6.5, 7.28].forEach((cx, i) => { const a = cx - 0.31, b = cx + 0.31, u0 = i * 171 / 512, u1 = (i * 171 + 170) / 512;
        pq.quad([b, 2.24, 8.972], [a, 2.24, 8.972], [a, 3.04, 8.972], [b, 3.04, 8.972], [0, 0, -1], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
        World.box(g, cx, 2.22, 8.9875, 0.66, 0.84, 0.025, 0, [0.05, 0.05, 0.06], [0.08, 0.08, 0.09], true); });
      const pm = pq.mesh(new THREE.MeshLambertMaterial({ map: art })); pm.material.userData.noCube = true; pm.receiveShadow = true; PF.root.add(pm); }
    // under them, on a rail: two bucket seats hung by their shoulders (navy, black: the shell, its bolsters and wings, the pan, the
    // harness slots dark), two flat-bottomed steering wheels on pegs (an aluminium centre, coloured buttons, the quick-release boss)
    { use(PF, METAL); obox(g, [5.45, 1.86, 8.93], [7.25, 1.86, 8.93], 0.03, 0.03, STEEL); for (const x of [5.55, 6.36, 7.15]) box(x, 1.845, 8.965, 0.03, 0.03, 0.07, STEEL);
      for (const [x, col] of [[5.8, [0.12, 0.16, 0.3]], [6.62, [0.07, 0.07, 0.08]]]) { const M = M4(x, 1.42, 8.86, 0.1, Math.PI, 0), S = (lx, ly, lz, sx, sy, sz, c) => gBox(g, M, lx, ly, lz, sx, sy, sz, c || col);
        gl(METAL); obox(g, [x, 1.86, 8.93], [x, 1.76, 8.9], 0.015, 0.03, STEEL);
        const IN = col[2] > 0.2 ? [0.045, 0.045, 0.05] : [0.15, 0.15, 0.16];   // (the padding: black in the navy shell, grey in the black one)
        gl(PAINT); S(0, 0, 0, 0.48, 0.75, 0.04); for (const s of [-1, 1]) { S(s * 0.22, -0.03, 0.09, 0.05, 0.66, 0.17); S(s * 0.2, 0.27, 0.1, 0.09, 0.18, 0.16); S(s * 0.2, -0.3, 0.25, 0.05, 0.14, 0.38); }
        S(0, -0.36, 0.22, 0.44, 0.06, 0.42); gl(MATTE); S(0, 0.0, 0.03, 0.34, 0.6, 0.025, IN); S(0, -0.322, 0.21, 0.34, 0.02, 0.33, IN);
        for (const [lx, ly, lz] of [[-0.08, 0.22, 0.044], [0.08, 0.22, 0.044], [-0.15, -0.27, 0.044], [0.15, -0.27, 0.044]]) gAdd(g, new THREE.PlaneGeometry(0.035, 0.075), M.clone().multiply(M4(lx, ly, lz)), [0.02, 0.02, 0.025]);
        gAdd(g, new THREE.PlaneGeometry(0.06, 0.035), M.clone().multiply(M4(0, -0.311, 0.33, -Math.PI / 2)), [0.02, 0.02, 0.025]); }
      for (const [x, y] of [[6.21, 1.55], [7.05, 1.62]]) { const tg = new THREE.TorusGeometry(0.14, 0.018, 4, 10), Q = tg.attributes.position;
        for (let i = 0; i < Q.count; i++) if (Q.getY(i) < -0.105) Q.setY(i, -0.105 - (Q.getY(i) + 0.105) * 0.25);   // (its bottom flat)
        tg.computeVertexNormals(); gl(MATTE); gAdd(g, tg, M4(x, y, 8.92), [0.06, 0.06, 0.065]);
        gl(METAL); gBox(g, null, x, y, 8.92, 0.16, 0.1, 0.02, [0.62, 0.64, 0.68]); for (const s of [-1, 1]) obox(g, [x + s * 0.08, y, 8.92], [x + s * 0.13, y, 8.92], 0.03, 0.012, [0.5, 0.52, 0.55]);
        gBox(g, null, x, y, 8.95, 0.05, 0.05, 0.04, [0.3, 0.31, 0.34]); obox(g, [x, y, 8.97], [x, y, 9.0], 0.02, 0.02, STEEL);
        gl(MATTE); [[-0.05, 0.025, [0.85, 0.15, 0.1]], [0.05, 0.025, [0.15, 0.45, 0.85]], [-0.05, -0.025, [0.95, 0.75, 0.15]], [0.05, -0.025, [0.2, 0.7, 0.3]]].forEach(([dx, dy, c]) => fq(x + dx - 0.01, x + dx + 0.01, y + dy - 0.01, y + dy + 0.01, 8.909, c)); } }
    // a pallet of boxed parts by the corner (the pallet's blocks and boards in raw pine, the gaps dark; kraft boxes, their tape, a white
    // label on each one we see, two straps round the lower layer)
    { use(PF, MATTE); const PN = [0.55, 0.43, 0.28], pn = (k) => PN.map(v => v * k), GAP = [0.09, 0.07, 0.05], X0 = 7.1, X1 = 7.9, Z0 = 7.7, Z1 = 8.9, Rb = Core.rng(4247);
      box(7.5, 0, 8.3, 0.76, 0.122, 1.16, GAP, GAP); box(7.5, 0.122, 8.3, 0.8, 0.022, 1.2, pn(1.75), pn(1.6));
      for (const z of [7.75, 8.3, 8.85]) g.quadO([X0 - 0.001, 0, z - 0.05], [X0 - 0.001, 0, z + 0.05], [X0 - 0.001, 0.1, z + 0.05], [X0 - 0.001, 0.1, z - 0.05], pn(1.9), [X0 + 1, 0.05, z]);
      for (const x of [7.16, 7.5, 7.84]) g.quadO([x - 0.06, 0, Z0 - 0.001], [x + 0.06, 0, Z0 - 0.001], [x + 0.06, 0.1, Z0 - 0.001], [x - 0.06, 0.1, Z0 - 0.001], pn(1.9), [x, 0.05, Z0 + 1]);
      g.quadO([X0 - 0.001, 0.1, Z0], [X0 - 0.001, 0.1, Z1], [X0 - 0.001, 0.122, Z1], [X0 - 0.001, 0.122, Z0], pn(1.7), [X0 + 1, 0.11, 8.3]); g.quadO([X0, 0.1, Z0 - 0.001], [X1, 0.1, Z0 - 0.001], [X1, 0.122, Z0 - 0.001], [X0, 0.122, Z0 - 0.001], pn(1.7), [7.5, 0.11, Z0 + 1]);
      for (const x of [7.245, 7.43, 7.57, 7.755]) tq(x - 0.02, x + 0.02, Z0, Z1, 0.1445, pn(0.7));
      gl(SATIN); const KR = [0.6, 0.47, 0.3], kb = (x, y, z, w, hh, d, r, lab) => { const k = 0.92 + Rb() * 0.14, c = KR.map(v => v * k), cs = Math.cos(r), sn = Math.sin(r);
        World.box(g, x, y, z, w, hh, d, r, c, c.map(v => v * 1.06), true); const Q = (a, b, yy) => [x + a * cs - b * sn, yy, z + a * sn + b * cs];
        g.quadO(Q(-0.035, -d / 2, y + hh + 0.001), Q(0.035, -d / 2, y + hh + 0.001), Q(0.035, d / 2, y + hh + 0.001), Q(-0.035, d / 2, y + hh + 0.001), [0.72, 0.64, 0.48], [x, y, z]);
        if (lab) g.quadO(Q(-w / 2 - 0.002, -0.07, y + hh * 0.35), Q(-w / 2 - 0.002, 0.07, y + hh * 0.35), Q(-w / 2 - 0.002, 0.07, y + hh * 0.7), Q(-w / 2 - 0.002, -0.07, y + hh * 0.7), [0.9, 0.9, 0.88], [x, y + hh / 2, z]); };
      for (const x of [7.31, 7.69]) for (const z of [7.9, 8.3, 8.7]) kb(x, 0.144, z, 0.38, 0.3, 0.38, (Rb() - 0.5) * 0.04, x < 7.5);
      kb(7.33, 0.444, 7.98, 0.36, 0.34, 0.55, 0.2, true); kb(7.73, 0.444, 7.96, 0.34, 0.3, 0.38, -0.06, false); kb(7.5, 0.444, 8.6, 0.72, 0.32, 0.5, 0.03, true); kb(7.55, 0.764, 8.58, 0.4, 0.28, 0.36, -0.15, true);
      gl(MATTE); for (const z of [8.1, 8.5]) { g.quadO([X0 + 0.018, 0.15, z - 0.012], [X0 + 0.018, 0.15, z + 0.012], [X0 + 0.018, 0.446, z + 0.012], [X0 + 0.018, 0.446, z - 0.012], [0.05, 0.05, 0.055], [7.5, 0.3, z]);
        tq(X0 + 0.02, X1 - 0.02, z - 0.012, z + 0.012, 0.4455, [0.05, 0.05, 0.055]); }
      WALLAO.push(['f', X0, X1, 0, 1.05, 0.45, PF]); BLOBS.push([7.5, 8.3, 1.1, 1.5, 0.75, 0, PF]); }
    // the spill kit: a yellow wheelie bin (tapered; its lid over the rim, the hinge bar, the handle; black wheels; a black band round its
    // front with a blank white label and a drop on it)
    { use(PF, PAINT); const X = 8.335, zb = 8.85, YL = [0.86, 0.68, 0.14];
      taper(X, zb, 0, 0.4, 0.5, 0.52, 0.526, 0.546, YL, null); taper(X, zb, 0.4, 0.85, 0.526, 0.546, 0.555, 0.575, YL, null);
      box(X, 0.85, zb - 0.3, 0.6, 0.04, 0.62, YL.map(v => v * 0.92), YL.map(v => v * 1.02)); gl(METAL); obox(g, [X - 0.29, 0.88, zb + 0.015], [X + 0.29, 0.88, zb + 0.015], 0.025, 0.025, [0.2, 0.2, 0.22]);
      gl(PAINT); obox(g, [X - 0.22, 0.915, zb + 0.02], [X + 0.22, 0.915, zb + 0.02], 0.03, 0.025, YL.map(v => v * 0.85));
      gl(MATTE); for (const s of [-1, 1]) cylA(g, [X + s * 0.25, 0.1, zb - 0.06], 'x', 0.1, 0.05, 8, DK, [0.3, 0.31, 0.33]);
      const zf = (y) => zb - 0.52 - 0.055 * y / 0.85 - 0.003, F = (xa, xb, ya, yb, c, e) => g.quadO([xa, ya, zf(ya) - e], [xb, ya, zf(ya) - e], [xb, yb, zf(yb) - e], [xa, yb, zf(yb) - e], c, [X, ya, zb]);
      F(X - 0.265, X + 0.265, 0.5, 0.74, [0.05, 0.05, 0.055], 0); F(X - 0.12, X + 0.12, 0.54, 0.7, [0.9, 0.9, 0.88], 0.002);
      g.triO([X, 0.68, zf(0.68) - 0.004], [X - 0.03, 0.6, zf(0.6) - 0.004], [X + 0.03, 0.6, zf(0.6) - 0.004], [0.05, 0.05, 0.055], [X, 0.62, zb]); F(X - 0.03, X + 0.03, 0.56, 0.6, [0.05, 0.05, 0.055], 0.004);
      WALLAO.push(['f', X - 0.29, X + 0.29, 0, 0.93, 0.45, PF]); BLOBS.push([X, 8.55, 0.75, 0.75, 0.7, 0, PF]); }
  }
  /* ---------------- outside: the valley round the workshop (the sky, its clouds and the mountains round the valley in one shader; the
     meadows, the fields, the apron and the road away round a bend in another; the forest at the doors' edges, the paddock, a hayrack, a
     farm, a church on a knoll) ---------------- */
  // all of it lit once, in its colours (the sun on its faces, the haze of the distance): no lights, cheap to draw. The ground's shader
  // has the shadows: the near boxes' swept from their footprints, the trees' and the far buildings' painted into a map once. What stands
  // out there is the main camera's only (mainOnly): the floor's mirror and the cars' cube map get the sky and the ground
  const SUNH = new THREE.Vector2(SUN.x, SUN.z).normalize(), AIR = 700, HAZE = 0.6;   // (the haze of the distance d: HAZE (1 - exp(-d / AIR)): a clear day)
  // the horizon's colour round the panorama, warmer and paler toward the sun, bluer away from it: what everything far fades into
  // (horz() in the shaders the same)
  const horzJS = (dx, dz) => { const s = (dx * SUNH.x + dz * SUNH.y) / (Math.hypot(dx, dz) || 1), p = Math.max(s, 0), q = Math.max(-s, 0); return [0.78 + 0.09 * p - 0.05 * q, 0.85 + 0.06 * p - 0.03 * q, 0.93 + 0.01 * p]; };
  // the shaders' shared part: the sun, a hash without sin (no stripes far out), value noise (vp: periodic in x with the period N, round
  // the panorama: no seam), horz(), the last line (OUTK: the daylight brighter than the room; a little less colour), oSky
  function outGL() {
    const f = (v) => v.toFixed(4);
    return ['const vec3 oSun = vec3(' + f(SUN.x) + ', ' + f(SUN.y) + ', ' + f(SUN.z) + '); const vec2 oSunH = vec2(' + f(SUNH.x) + ', ' + f(SUNH.y) + ');',
      'float hs(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }',
      'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), f.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), f.x), f.y); }',
      'float vp(vec2 p, float N){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); float a = mod(i.x, N), b = mod(i.x + 1.0, N);',
      '  return mix(mix(hs(vec2(a, i.y)), hs(vec2(b, i.y)), f.x), mix(hs(vec2(a, i.y + 1.0)), hs(vec2(b, i.y + 1.0)), f.x), f.y); }',
      'vec3 horz(vec2 h){ float s = dot(h, oSunH) * inversesqrt(dot(h, h) + 1e-6); return vec3(0.78, 0.85, 0.93) + vec3(0.09, 0.06, 0.01) * max(s, 0.0) - vec3(0.05, 0.03, 0.0) * max(-s, 0.0); }',
      'vec4 outC(vec3 c){ return vec4(mix(c, vec3(dot(c, vec3(0.3333))), 0.15) * ' + OUTK.toFixed(2) + ', 1.0); }',
      'const float oSky = ' + (HDR ? '1.3' : '1.0') + ';'].join('\n');   // (the sky over the land's light: HDR only, 8 bits would clip it white)
  }
  // the workshop's shadow on a point out there, as the ground's sweep() has it: is the workshop's footprint on the way from the point
  // toward the sun, below its eaves (5 m)? 0..1, soft at the edge. SH0: the light left in it (no sun, the sky's blue; as the ground's
  // shade, 0.5 0.56 0.68, against a lit top)
  const SH0 = [0.71, 0.8, 0.97];
  function workShade(x, y, z) {
    const h = 5.0 - y; if (h <= 0) return 0;
    const { x0, x1, z0, z1 } = ROOM, sx = SUN.x / SUN.y * h, sz = SUN.z / SUN.y * h, ax = (x0 - x) / sx, bx = (x1 - x) / sx, az = (z0 - z) / sz, bz = (z1 - z) / sz;
    return smooth(-0.012, 0.03, Math.min(Math.max(ax, bx), Math.max(az, bz), 1) - Math.max(Math.min(ax, bx), Math.min(az, bz), 0));
  }
  // the far things' colours: the sun on each face (a darker foot; none in the workshop's shadow), the haze toward the horizon's colour,
  // a little less colour (as the shaders' last line); unlit: vertex ranges that keep their colour (glass: the sky in it)
  function bakeOut(gb, unlit) {
    const geo = gb.geometry(), P = geo.attributes.position, N = geo.attributes.normal, C = geo.attributes.color, l = [1, 1, 1];
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), ny = N.getY(i), H = horzJS(x, z), k = HAZE * (1 - Math.exp(-Math.hypot(x, z) / AIR));
      if (unlit.some(([a, b]) => i >= a && i < b)) l[0] = l[1] = l[2] = 1;
      else { const ft = 0.8 + 0.2 * smooth(0, 2.5, y), sky = (0.6 + 0.06 * ny) * ft, lit = sky + 0.6 * Math.max(0, N.getX(i) * SUN.x + ny * SUN.y + N.getZ(i) * SUN.z) * ft, sh = workShade(x, y, z);
        for (let c = 0; c < 3; c++) l[c] = lerp(lit, sky * SH0[c], sh); }
      const r = lerp(C.getX(i) * l[0], H[0], k), g = lerp(C.getY(i) * l[1], H[1], k), b = lerp(C.getZ(i) * l[2], H[2], k), m = (r + g + b) / 3;
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
    '  vec3 c = mix(hz, vec3(0.15, 0.36, 0.8), 1.0 - exp(-e * 4.5)); c = mix(c, vec3(1.0, 0.96, 0.88), pow(s, 8.0) * 0.3); c += vec3(1.0, 0.9, 0.7) * pow(s, 900.0) * 3.0;',
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
    '  c *= oSky; float fl = smoothstep(0.08, 0.7, abs(dh.y)), h1 = H1(u);',   // (the sky brighter than what stands under it)
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
    '    c = mix(c, mix(col, hz, 0.1 + 0.22 * hn), 1.0 - smoothstep(h1 - px, h1 + px, t)); }',
    // (the forested ridges: their slopes lit by their lie, clearings of meadow on them; the near wooded hills)
    '  float h2 = H2(u, fl);',
    '  if (t < h2 + px) { float ee = 0.002, sl = (H2(u + ee, fl) - H2(u - ee, fl)) / (2.0 * ee), hn = clamp((h2 - t) / h2, 0.0, 1.0);',
    '    float g = vp(vec2(u * 1500.0, t * 600.0), 1500.0), lit = faceLit(dh, sl * (1.0 - smoothstep(0.0, 0.5, hn)) + (g - 0.5) * 0.9, 0.45);',
    '    vec3 col = mix(vec3(0.09, 0.15, 0.11), vec3(0.16, 0.25, 0.16), g);',
    '    col = mix(col, vec3(0.22, 0.31, 0.16), smoothstep(0.68, 0.72, vp(vec2(u * 300.0, t * 420.0), 300.0) * 0.6 + vp(vec2(u * 37.0, 2.0), 37.0) * 0.4) * smoothstep(0.1, 0.3, hn)) * (0.5 + 0.7 * lit);',
    '    c = mix(c, mix(col, hz, 0.25), 1.0 - smoothstep(h2 - px, h2 + px, t)); }',
    '  float h3 = H3(u, fl);',
    '  if (t < h3 + px) { float g = vp(vec2(u * 2600.0, t * 1100.0), 2600.0), lit = faceLit(dh, (g - 0.5) * 1.4, 0.45);',
    '    vec3 col = mix(vec3(0.08, 0.15, 0.09), vec3(0.18, 0.28, 0.15), g) * (0.6 + 0.6 * lit);',
    '    c = mix(c, mix(col, hz, 0.12), 1.0 - smoothstep(h3 - px, h3 + px, t)); }',
    '  if (t < 0.0) c = mix(vec3(0.31, 0.42, 0.18), hz, ' + (HAZE * (1 - Math.exp(-470 / AIR))).toFixed(3) + ');',   // (under the horizon, beyond the ground: the valley's floor far off, hazed as the ground's edge)
    '  gl_FragColor = outC(c); }'];
  function buildOutside() {
    const { x0, x1, z0, z1 } = ROOM, GL = outGL();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(470, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, extensions: { derivatives: true },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [SKY_FS[0], GL].concat(SKY_FS.slice(1)).join('\n') }));
    sky.renderOrder = 10; sky.frustumCulled = false; scene.add(sky);   // (drawn after the room: only where nothing else is)
    // what stands out there, in one mesh: the forest, the posts and the fences, the transporter, the paddock, the valley's own things
    let og = new World.GB(); const unlit = [], TS = [], HL = [];   // (unlit: glass; TS: the trees' shadows [x, z, h, r, a spruce]; HL: the far buildings' [footprint, h])
    const R = Core.rng(5150), Rt = Core.rng(77), Rj = Core.rng(78); for (let i = 0; i < 385; i++) R();   // (the old mountain rings' draws: the same woods; Rj: each clump's and tier's tint, its own dice)
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
      if (under) { const c0 = [x, y0 + (y1 - y0) * 0.3, z], cu = [cm[0] * 0.55, cm[1] * 0.55, cm[2] * 0.55]; for (let k = 0; k < m; k += 2) og.triO(rim[k], rim[(k + 2) % m], c0, cu, [x, y1 + 9, z]); } };   // (dark green under the tips, tucked in)
    const spruce = (x, z, h, near, larch) => { const r = h * (larch ? 0.13 : 0.16), rot = Rt() * TAU, dk = 0.85 + Rt() * 0.3, nt = near ? 5 : 3;
      const cb = (larch ? [0.24, 0.33, 0.13] : [0.07, 0.15, 0.1]).map(v => v * dk), ct = (larch ? [0.42, 0.55, 0.24] : [0.13, 0.25, 0.15]).map(v => v * dk);
      trunk(x, z, h * 0.025, h * 0.3, [0.3, 0.22, 0.15]);
      for (let t = 0; t < nt; t++) { const f = t / nt, y0 = h * (0.1 + 0.8 * f), j = (0.9 + Rj() * 0.18) * (t ? 1 : 0.9), tb = cb.map(v => v * j), tt = ct.map(v => v * j);   // (each tier a shade apart, the lowest darker)
        tier(x, z, y0, t === nt - 1 ? h : y0 + h * (near ? 0.3 : 0.42), r * (1.04 - f), near ? 6 : 5, rot + t * 0.6, tb, tt, near); }
      TS.push([x, z, h, r, 1]); };
    const ico = new THREE.IcosahedronGeometry(1, 0), IP = ico.attributes.position;   // (non-indexed: three vertices a face)
    const clump = (cx, cy, cz, r, b0, lo) => { const j = (0.9 + Rj() * 0.18) * (lo ? 0.85 : 1), base = b0.map(v => v * j);   // (each clump a shade apart; the low ones in the crown's shade)
      for (let i = 0; i < IP.count; i += 3) { const v = (j) => [cx + IP.getX(j) * r, cy + IP.getY(j) * r * 0.85, cz + IP.getZ(j) * r], e = (0.9 + Rt() * 0.2) * (0.82 + 0.18 * (IP.getY(i) + IP.getY(i + 1) + IP.getY(i + 2) + 3) / 6);
      og.triO(v(i), v(i + 1), v(i + 2), [base[0] * e, base[1] * e, base[2] * e], [cx, cy, cz]); } };
    const broad = (x, z, h, n) => { const dk = 0.88 + Rt() * 0.24, base = [0.3 * dk, 0.46 * dk, 0.18 * dk], r = h * 0.26;
      trunk(x, z, h * 0.04, h * 0.55, [0.36, 0.3, 0.24]);
      clump(x, h * 0.74, z, r * 1.1, base);
      for (let b = 0; b < (n || 3); b++) { const a = b / (n || 3) * TAU + Rt(); clump(x + Math.cos(a) * r * 0.75, h * (0.56 + Rt() * 0.12), z + Math.sin(a) * r * 0.75, r * (0.8 + Rt() * 0.15), base, true); }
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
      World.box(og, B + L / 2, 0.75, Z, L, 3.2, Wd, 0, [0.62, 0.63, 0.65], [0.56, 0.57, 0.59]);   // (white in the sun: not over the top)
      for (const sd of [-1, 1]) { const zz = Z + sd * (Wd / 2 + 0.006);
        obox(og, [B + 0.03, 1.2, zz], [B + L - 0.03, 1.2, zz], 0.012, 0.9, NV); obox(og, [B + 0.03, 1.73, zz], [B + L - 0.03, 1.73, zz], 0.012, 0.07, GD); obox(og, [B + 0.03, 1.84, zz], [B + L - 0.03, 1.84, zz], 0.012, 0.035, CY);
        for (let k = 1; k < 8; k++) obox(og, [B + k * L / 8, 1.88, zz], [B + k * L / 8, 3.93, zz], 0.012, 0.035, [0.52, 0.53, 0.55]); }   // (the box's panel joints)
      obox(og, [B + L + 0.01, 0.78, Z], [B + L + 0.01, 3.92, Z], 0.035, 0.02, [0.55, 0.56, 0.58]);   // (the rear doors' seam)
      obox(og, [B + L + 0.006, 1.2, Z - Wd / 2 + 0.03], [B + L + 0.006, 1.2, Z + Wd / 2 - 0.03], 0.012, 0.9, NV);
      World.box(og, X0 + 1.2, 0.6, Z, 2.2, 2.3, Wd - 0.04, 0, NV, NV);   // (the cab, its roof deflector up to the box)
      obox(og, [X0 + 0.5, 3.05, Z], [B + 0.02, 3.75, Z], Wd - 0.14, 0.3, NV); World.box(og, X0 + 1.4, 2.9, Z, 1.8, 0.2, Wd - 0.14, 0, NV, NV);
      glass(() => { World.box(og, X0 + 0.07, 1.72, Z, 0.06, 0.95, Wd - 0.34, 0, Gl, Gl); World.box(og, X0 + 0.04, 2.58, Z, 0.04, 0.09, Wd - 0.34, 0, Sk, Sk);
        for (const sd of [-1, 1]) { World.box(og, X0 + 0.75, 1.75, Z + sd * (Wd / 2 - 0.01), 1.0, 0.85, 0.04, 0, Gl, Gl); World.box(og, X0 + 0.75, 2.52, Z + sd * (Wd / 2 - 0.005), 1.0, 0.08, 0.04, 0, Sk, Sk); } });
      World.box(og, X0 - 0.02, 0.62, Z, 0.08, 0.7, Wd - 0.3, 0, DK, DK);   // (the grille and the bumper)
      for (const sd of [-1, 1]) { obox(og, [X0 + 0.15, 2.2, Z + sd * (Wd / 2)], [X0 - 0.05, 2.25, Z + sd * (Wd / 2 + 0.32)], 0.04, 0.04, DK); World.box(og, X0 - 0.05, 1.85, Z + sd * (Wd / 2 + 0.36), 0.08, 0.42, 0.18, 0, DK, DK); }
      World.box(og, B + L / 2, 0.32, Z, L, 0.45, Wd - 0.5, 0, DK, DK);   // (the chassis)
      for (const wx of [X0 + 1.2, B + L - 2.1, B + L - 0.8]) for (const sd of [-1, 1]) { const z = Z + sd * (Wd / 2 - 0.16);   // (the wheels: the tyre, the hub a pale disc, its dark centre)
        cylA(og, [wx, 0.5, z], 'z', 0.5, 0.34, 10, DK); cylA(og, [wx, 0.5, z + sd * 0.175], 'z', 0.29, 0.012, 10, [0.5, 0.52, 0.55]); cylA(og, [wx, 0.5, z + sd * 0.183], 'z', 0.1, 0.008, 6, [0.2, 0.21, 0.23]); }
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
      // (their cladding mid grey, a little different each, weathered: a darker foot, a fascia over the door, rain streaks down from the
      // parapet, a downpipe; the sun on it no longer white)
      for (let i = 0; i < 3; i++) { const cx2 = 23 + i * 6, k = [0.97, 0.92, 1][i], LG = [0.53 * k, 0.54 * k, 0.56 * k], dk = (f) => LG.map(v => v * f), Zf = -10.985;
        World.box(og, cx2, 0.4, -14, 5.96, 4.0, 6, 0, LG, [0.4, 0.41, 0.43], true); World.box(og, cx2, 0, -14, 5.98, 0.4, 6.02, 0, dk(0.78), dk(0.78), true);
        World.box(og, cx2, 0, -10.97, 4.2, 3.7, 0.06, 0, [0.5, 0.52, 0.56], [0.5, 0.52, 0.56]); for (let q = 1; q < 9; q++) obox(og, [cx2 - 2.08, q * 0.41, -10.93], [cx2 + 2.08, q * 0.41, -10.93], 0.02, 0.035, [0.4, 0.42, 0.46]);
        World.box(og, cx2, 3.7, -10.95, 4.5, 0.22, 0.1, 0, [0.3, 0.32, 0.35], [0.3, 0.32, 0.35]); World.box(og, cx2, 3.92, -10.98, 4.5, 0.48, 0.04, 0, dk(0.86), dk(0.86));
        for (const [x, w, h] of [[-2.75, 0.22, 2.2], [-2.32, 0.1, 1.3], [2.4, 0.16, 1.7], [2.72, 0.12, 0.9], [-0.9, 0.3, 0.42], [1.3, 0.2, 0.3]]) { const xa = cx2 + x - w / 2, xb = cx2 + x + w / 2, y1 = 4.4 - h, z = Math.abs(x) < 2.25 ? Zf + 0.03 : Zf, a = dk(0.8), b = Math.abs(x) < 2.25 ? dk(0.86) : LG;
          og.quadO([xa, 4.4, z], [xb, 4.4, z], [xb, y1, z], [xa, y1, z], a, [cx2, 2, -14], null, [a, a, b, b]); }
        obox(og, [cx2 + 2.88, 4.38, -10.92], [cx2 + 2.88, 0.16, -10.92], 0.09, 0.09, [0.36, 0.38, 0.41]); obox(og, [cx2 + 2.88, 0.2, -10.92], [cx2 + 2.88, 0.06, -10.72], 0.09, 0.09, [0.36, 0.38, 0.41]); }
      World.box(og, 29, 4.4, -14, 18.3, 0.3, 6.3, 0, [0.22, 0.23, 0.26], [0.36, 0.37, 0.39]); }
    // the valley's own things where the doors look out: a double hayrack (toplar) in the meadow, an alpine farmhouse with its orchard, a
    // white church on a knoll and a few houses at its foot (generic, unnamed). A gable roof: two slopes, the eaves' course darker, the ends
    const roof = (cx, cy, cz, L, D, h, rot, col, end) => { const c = Math.cos(rot), s = Math.sin(rot), P = (lx, ly, lz) => [cx + lx * c - lz * s, cy + ly, cz + lx * s + lz * c], inn = [cx, cy + h * 0.3, cz];
      for (const sd of [-1, 1]) for (const [t0, t1, f] of [[0, 0.22, 0.8], [0.22, 1, sd > 0 ? 1 : 0.93]]) og.quadO(P(-L / 2, h * t0, sd * D / 2 * (1 - t0)), P(L / 2, h * t0, sd * D / 2 * (1 - t0)), P(L / 2, h * t1, sd * D / 2 * (1 - t1)), P(-L / 2, h * t1, sd * D / 2 * (1 - t1)), col.map(v => v * f), inn);
      og.triO(P(-L / 2, 0, -D / 2), P(-L / 2, 0, D / 2), P(-L / 2, h, 0), end || col, inn); og.triO(P(L / 2, 0, -D / 2), P(L / 2, 0, D / 2), P(L / 2, h, 0), end || col, inn); };
    const hull = (x, z, L, D, rot, h) => { const P = rp(x, z, rot); HL.push([[P(-L / 2, -D / 2), P(L / 2, -D / 2), P(L / 2, D / 2), P(-L / 2, D / 2)], h]); };
    const WD = [0.4, 0.29, 0.19], WD2 = [0.5, 0.37, 0.24], WHT = [0.62, 0.61, 0.58], DKR = [0.32, 0.28, 0.27], TILE = [0.62, 0.26, 0.18], DW = [0.14, 0.15, 0.18];
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
    // the paddock by the doors (round 2), clear of the way in and out: the team's gazebo on the sunny apron (its canopy's shadow: the
    // ground's), a delivery on a pallet with its pallet truck by the right door; two pit scooters and a cage of slicks by the left one.
    // Each door's in a mesh of its own, baked as the rest (q: the one being built; ql: its glass): out of view, not drawn
    { const AL = [0.75, 0.76, 0.78], RB = [0.075, 0.075, 0.085], RBL = [0.12, 0.12, 0.13], HB = [0.45, 0.46, 0.5];
      let q = new World.GB(), ql = [];
      // (a stack of n slicks round y at x, z: each tyre's tread darker at its shoulders, the top one's sidewall (a compound ring: band) and
      // the dark hole down the stack; twelve sides: eight read as stop signs lying flat)
      const SHO = [0.25, 0.26, 0.28], slicks = (x, z, n, r, th, band, yb) => { const S = 12, b0 = yb || 0, P = (a, y, rr) => [x + Math.cos(a) * rr, y, z + Math.sin(a) * rr], yt = b0 + n * th;
        for (let k = 0; k < n; k++) { const y0 = b0 + k * th, y1 = y0 + th, lo = RB.map(v => v * 0.8);
          for (let i = 0; i < S; i++) { const a0 = i / S * TAU, a1 = (i + 1) / S * TAU; q.quadO(P(a0, y0, r), P(a1, y0, r), P(a1, y1, r), P(a0, y1, r), RBL, [x, y0 + th / 2, z], null, [lo, lo, RBL, RBL]); } }
        for (let i = 0; i < S; i++) { const a0 = i / S * TAU, a1 = (i + 1) / S * TAU, rm = r * 0.64;
          q.quadO(P(a0, yt, r), P(a1, yt, r), P(a1, yt, rm), P(a0, yt, rm), RB, [x, yt - 1, z], null, band ? [RB, RB, band, band] : null); q.triO([x, yt - 0.02, z], P(a0, yt, rm), P(a1, yt, rm), SHO, [x, yt - 1, z]); } };
      // (the gazebo: four legs, the eaves' frame, a scissor brace each side; the navy canopy to its peak (and its underside), a gold valance
      // with a navy pinstripe round it; a white folding table, two folding chairs with navy seats, two sets of slicks)
      { const xa = 11.0, xb = 14.0, za = 2.4, zb = 5.4, ye = 2.3, AP = [12.5, 2.85, 3.9], C = [[xa, za], [xb, za], [xb, zb], [xa, zb]];
        for (const [x, z] of C) World.box(q, x + (x < 12 ? 0.02 : -0.02), 0, z + (z < 4 ? 0.02 : -0.02), 0.04, ye - 0.02, 0.04, 0, AL, AL);
        for (let i = 0; i < 4; i++) { const [x0, z0] = C[i], [x1, z1] = C[(i + 1) % 4], ix = (x0 + x1) / 2 - 12.5, iz = (z0 + z1) / 2 - 3.9;
          obox(q, [x0, ye - 0.03, z0], [x1, ye - 0.03, z1], 0.035, 0.035, AL); obox(q, [x0, ye - 0.06, z0], [x1, ye - 0.42, z1], 0.02, 0.02, AL); obox(q, [x0, ye - 0.42, z0], [x1, ye - 0.06, z1], 0.02, 0.02, AL);
          q.triO([x0, ye, z0], [x1, ye, z1], AP, NV, [12.5, 0, 3.9]); q.triO([x0, ye - 0.01, z0], [x1, ye - 0.01, z1], [AP[0], AP[1] - 0.01, AP[2]], [0.07, 0.09, 0.17], [12.5, 9, 3.9]);
          const o = 0.03, ox = Math.sign(ix) * (Math.abs(ix) > 0.1 ? o : 0), oz = Math.sign(iz) * (Math.abs(iz) > 0.1 ? o : 0), Q = (x, y, z, e) => [x + ox * e, y, z + oz * e], ex = (x1 - x0) * 0.01, ez = (z1 - z0) * 0.01;
          q.quadO(Q(x0 - ex, ye - 0.26, z0 - ez, 1), Q(x1 + ex, ye - 0.26, z1 + ez, 1), Q(x1 + ex, ye, z1 + ez, 1), Q(x0 - ex, ye, z0 - ez, 1), GD, [12.5, ye, 3.9]);
          q.quadO(Q(x0, ye - 0.26, z0, 0.7), Q(x1, ye - 0.26, z1, 0.7), Q(x1, ye, z1, 0.7), Q(x0, ye, z0, 0.7), [0.62, 0.48, 0.15], [12.5 + ix * 9, ye, 3.9 + iz * 9]);
          q.quadO(Q(x0 - ex, ye - 0.19, z0 - ez, 1.15), Q(x1 + ex, ye - 0.19, z1 + ez, 1.15), Q(x1 + ex, ye - 0.165, z1 + ez, 1.15), Q(x0 - ex, ye - 0.165, z0 - ez, 1.15), NV, [12.5, ye, 3.9]); }
        World.box(q, 12.9, 0.7, 4.7, 1.2, 0.035, 0.6, 0, [0.82, 0.83, 0.82], [0.9, 0.9, 0.88]);
        for (const sx of [-0.5, 0.5]) for (const sz of [-0.24, 0.24]) obox(q, [12.9 + sx, 0.7, 4.7 + sz], [12.9 + sx * 1.04, 0, 4.7 + sz * 1.25], 0.025, 0.025, AL);
        for (const [x, z, r] of [[12.5, 4.05, 0.15], [13.35, 4.12, -0.1]]) { const B = M4(x, 0, z, 0, r, 0), at = (a, b, c) => new V3(a, b, c).applyMatrix4(B).toArray();
          gBox(q, B, 0, 0.45, 0, 0.42, 0.035, 0.4, [0.12, 0.16, 0.3]); gBox(q, B, 0, 0.72, -0.2, 0.42, 0.3, 0.025, [0.12, 0.16, 0.3]);
          for (const s of [-1, 1]) { obox(q, at(s * 0.2, 0, -0.22), at(s * 0.2, 0.45, 0.18), 0.02, 0.02, AL); obox(q, at(s * 0.2, 0, 0.18), at(s * 0.2, 0.88, -0.22), 0.02, 0.02, AL); } }
        slicks(11.7, 3.0, 4, 0.33, 0.24, null); slicks(12.4, 3.06, 4, 0.33, 0.24, BANDS[0]); }
      // (the delivery: a pallet (its blocks, its boards), a stack of cartons under stretch film on it; a hand pallet truck's forks in it,
      // its steering head with the wheels and the handle (muted red) out toward the apron)
      { const PN = [0.62, 0.5, 0.34], CB = [0.62, 0.5, 0.33], X0 = 10.6, X1 = 11.8, Z0 = -3.2, Z1 = -2.4, xc = 11.2, zc = -2.8, TR = [0.58, 0.1, 0.09];
        World.box(q, xc, 0, zc, 1.16, 0.12, 0.76, 0, [0.14, 0.11, 0.08], [0.14, 0.11, 0.08], true); World.box(q, xc, 0.12, zc, 1.2, 0.024, 0.8, 0, PN, [0.68, 0.56, 0.38]);
        for (const z of [Z0 + 0.05, zc, Z1 - 0.05]) q.quadO([X0 - 0.001, 0, z - 0.05], [X0 - 0.001, 0, z + 0.05], [X0 - 0.001, 0.12, z + 0.05], [X0 - 0.001, 0.12, z - 0.05], PN, [xc, 0.06, zc]);
        for (const x of [X0 + 0.07, xc, X1 - 0.07]) q.quadO([x - 0.07, 0, Z1 + 0.001], [x + 0.07, 0, Z1 + 0.001], [x + 0.07, 0.12, Z1 + 0.001], [x - 0.07, 0.12, Z1 + 0.001], PN, [xc, 0.06, zc]);
        World.box(q, xc, 0.144, zc, 1.14, 1.05, 0.76, 0, CB, [0.68, 0.56, 0.38], true);
        for (const [a, b] of [[[10.612, 0.145, -2.75], [10.612, 1.19, -2.75]], [[10.612, 0.67, Z0 + 0.03], [10.612, 0.67, Z1 - 0.03]], [[10.85, 0.145, -2.402], [10.85, 1.19, -2.402]], [[11.25, 0.145, -2.402], [11.25, 1.19, -2.402]], [[10.64, 0.67, -2.402], [11.76, 0.67, -2.402]]]) obox(q, a, b, 0.012, 0.012, [0.42, 0.33, 0.2]);
        World.box(q, xc, 0.55, zc, 1.16, 0.42, 0.78, 0, [0.76, 0.72, 0.62], [0.76, 0.72, 0.62], true);   // (the film's band, paler)
        for (const s of [-1, 1]) World.box(q, 11.27, 0.03, zc + s * 0.2, 1.15, 0.07, 0.16, 0, [0.2, 0.2, 0.22], [0.25, 0.25, 0.27], true);
        World.box(q, 11.95, 0.07, zc, 0.2, 0.36, 0.42, 0, TR, TR.map(v => v * 1.15)); cylA(q, [11.97, 0.085, zc], 'z', 0.085, 0.2, 8, [0.08, 0.08, 0.09], HB);
        obox(q, [11.98, 0.42, zc], [12.12, 1.12, zc], 0.04, 0.04, TR); obox(q, [12.1, 1.08, zc - 0.13], [12.15, 1.2, zc - 0.13], 0.025, 0.025, [0.1, 0.1, 0.11]); obox(q, [12.1, 1.08, zc + 0.13], [12.15, 1.2, zc + 0.13], 0.025, 0.025, [0.1, 0.1, 0.11]);
        obox(q, [12.15, 1.2, zc - 0.14], [12.15, 1.2, zc + 0.14], 0.03, 0.03, [0.1, 0.1, 0.11]); }
      bakeOut(q, ql); q = new World.GB(); ql = [];
      // (two pit scooters by the left door, step-throughs on their side stands: the navy front and leg shield, a floorboard, the rear cowl
      // (flat sides, its edges chamfered; grey-white) with a gold line, the black seat, a rack with a gold box on it; small wheels, the
      // handlebar and its mirrors, the headlamp)
      const cowl = new THREE.Shape([[-0.12, 0.3], [-0.13, 0.67], [-0.74, 0.67], [-0.84, 0.6], [-0.82, 0.47], [-0.62, 0.4], [-0.3, 0.36]].map(([a, b]) => new THREE.Vector2(a, b)));
      for (const [x, z, ry] of [[-11.1, 2.62, Math.PI + 0.2], [-11.45, 3.5, Math.PI - 0.15]]) { const B = M4(x, 0, z, 0, ry, 0).multiply(M4(0, 0, 0, -0.08, 0, 0)), at = (a, b, c) => new V3(a, b, c).applyMatrix4(B).toArray(), bx = (a, b, c, sx, sy, sz, col) => gBox(q, B, a, b, c, sx, sy, sz, col);
        const SW = [0.62, 0.63, 0.65], BL = [0.06, 0.06, 0.07];
        for (const wx of [-0.6, 0.62]) gAdd(q, new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8), B.clone().multiply(M4(wx, 0.2, 0, Math.PI / 2, 0, 0)), (c, n) => Math.abs(n[1]) > 0.5 ? HB : BL);
        gAdd(q, new THREE.ExtrudeGeometry(cowl, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 1, curveSegments: 1 }).translate(0, 0, -0.15), B, SW);
        for (const s of [-1, 1]) bx(-0.47, 0.56, s * 0.183, 0.62, 0.022, 0.006, GD);
        bx(0.1, 0.26, 0, 0.62, 0.06, 0.3, [0.22, 0.23, 0.25]);
        gBox(q, B.clone().multiply(M4(0.47, 0.6, 0, 0, 0, 0.28)), 0, 0, 0, 0.09, 0.72, 0.4, NV); gBox(q, B.clone().multiply(M4(0.63, 0.43, 0, 0, 0, -0.5)), 0, 0, 0, 0.26, 0.05, 0.15, NV);
        bx(-0.42, 0.73, 0, 0.6, 0.09, 0.3, BL); bx(-0.82, 0.71, 0, 0.26, 0.025, 0.28, [0.2, 0.21, 0.23]); bx(-0.82, 0.835, 0, 0.27, 0.2, 0.28, GD);
        obox(q, at(0.56, 0.5, 0), at(0.46, 1.0, 0), 0.05, 0.05, NV); bx(0.45, 1.02, 0, 0.16, 0.1, 0.26, NV); obox(q, at(0.43, 1.07, -0.33), at(0.43, 1.07, 0.33), 0.03, 0.03, BL);
        for (const s of [-1, 1]) { obox(q, at(0.43, 1.07, s * 0.24), at(0.4, 1.26, s * 0.3), 0.012, 0.012, BL); bx(0.4, 1.28, s * 0.31, 0.03, 0.05, 0.1, BL); }
        obox(q, at(-0.1, 0.25, -0.17), at(-0.18, 0.0, -0.33), 0.025, 0.025, BL);
        const a = q.P.length / 3; bx(0.54, 1.02, 0, 0.02, 0.07, 0.12, [0.95, 0.94, 0.88]); ql.push([a, q.P.length / 3]); }
      // (the cage of slicks by the transporter's tail: galvanised posts and rails, bars on the sides, its door half open; on a pallet; three
      // stacks of slicks in it, one ringed yellow, one red)
      { const xa = -11.9, xb = -10.5, za = -3.35, zb = -2.3, H = 1.6, GV = [0.4, 0.42, 0.45], y0 = 0.14;
        World.box(q, (xa + xb) / 2, 0, (za + zb) / 2, 1.4, y0, 1.05, 0, [0.5, 0.4, 0.28], [0.55, 0.44, 0.3]);
        for (const x of [xa + 0.025, xb - 0.025]) for (const z of [za + 0.025, zb - 0.025]) World.box(q, x, y0, z, 0.05, H - y0, 0.05, 0, GV, GV);
        for (const y of [y0 + 0.03, H - 0.02]) { obox(q, [xa, y, za + 0.025], [xb, y, za + 0.025], 0.03, 0.04, GV); obox(q, [xa, y, zb - 0.025], [xb, y, zb - 0.025], 0.03, 0.04, GV); obox(q, [xa + 0.025, y, za], [xa + 0.025, y, zb], 0.03, 0.04, GV); }
        const bar = (p, t, nx, nz) => { const d = 0.006, A = [nz * d, 0, -nx * d]; for (const e of [1, -1]) q.quadO([p[0] - A[0], p[1], p[2] - A[2]], [p[0] + A[0], p[1], p[2] + A[2]], [t[0] + A[0], t[1], t[2] + A[2]], [t[0] - A[0], t[1], t[2] - A[2]], GV, [p[0] - nx * e, (p[1] + t[1]) / 2, p[2] - nz * e]); };
        for (let x = xa + 0.1; x < xb - 0.06; x += 0.1) { bar([x, y0 + 0.03, zb - 0.025], [x, H - 0.02, zb - 0.025], 0, 1); }   // (bars every 10 cm: a mesh)
        for (let x = xa + 0.1; x < xb - 0.06; x += 0.1) bar([x, y0 + 0.03, za + 0.025], [x, H - 0.02, za + 0.025], 0, -1);
        for (let z = za + 0.1; z < zb - 0.06; z += 0.1) bar([xa + 0.025, y0 + 0.03, z], [xa + 0.025, H - 0.02, z], -1, 0);
        { const hz = za + 0.05, L = zb - za - 0.1, th = 0.7, D = (t, y) => [xb + Math.sin(th) * t, y, hz + Math.cos(th) * t];   // (the door on the side to the apron, swung out)
          for (const t of [0.0, L]) obox(q, D(t, y0 + 0.03), D(t, H - 0.04), 0.035, 0.035, GV); for (const y of [y0 + 0.06, H - 0.06]) obox(q, D(0, y), D(L, y), 0.03, 0.035, GV);
          for (let t = 0.1; t < L - 0.05; t += 0.1) bar(D(t, y0 + 0.06), D(t, H - 0.06), Math.cos(th), -Math.sin(th)); }
        slicks(-11.55, -3.02, 5, 0.27, 0.22, [0.95, 0.78, 0.15], y0); slicks(-10.93, -3.03, 4, 0.27, 0.22, null, y0); slicks(-11.24, -2.59, 4, 0.27, 0.22, [0.86, 0.16, 0.12], y0); }
      bakeOut(q, ql); }
    ico.dispose(); bakeOut(og, unlit); og = null;   // (its arrays let go: the flags' closures below keep this scope)
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
        // (a box's shadow: is p in its footprint swept along the sun's offset of its top? soft at the edge, over a pixel at least (px: a
        // pixel's metres; along the sweep's shorter side it changes fastest): a low thing's short sweep is no staircase seen far and flat;
        // its inside (1) still whole)
        'float sweep(vec2 p, vec4 r, float h, float px){ vec2 s = -oSun.xz / oSun.y * h, a = (p - r.zw) / s, b = (p - r.xy) / s, t0 = min(a, b), t1 = max(a, b); float k = min(px / min(abs(s.x), abs(s.y)), 0.45);',
        '  return smoothstep(-0.012 - k, 0.03 + k, min(min(t1.x, t1.y), 1.0) - max(max(t0.x, t0.y), 0.0)); }',
        'float rect(vec2 p, vec4 r){ vec2 q = max(r.xy - p, p - r.zw); return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }',   // (out of a rectangle; < 0 in it)
        'float line(float x, float w, float f){ return 1.0 - smoothstep(w - f, w + f, x); }',   // (|x| < w, soft over a pixel's f)
        'void main(){ vec2 p = vW.xz; float ax = abs(p.x), az0 = abs(p.y), d = length(p); vec2 fw = fwidth(p); float px = max(fw.x, fw.y) + 1e-3, e = px * 0.6;',
        '  vec4 A = texture2D(uN, p * 0.09), B = texture2D(uN, p * 0.012 + 0.3), C = texture2D(uN, p * 0.55), D = texture2D(uN, p * 0.0042 + 0.53); float n1 = A.r, n2 = B.g, n3 = C.b;',   // (the noise's blobs: A ~0.6 m, B ~5 m, C ~0.1 m, D ~14 m)
        '  vec2 fp = vec2(p.x * 0.866 + p.y * 0.5, p.y * 0.866 - p.x * 0.5) + (vec2(vn(p * 0.011), vn(p * 0.011 + 7.3)) - 0.5) * 40.0, fq = fp / vec2(24.0, 75.0), fr = fract(fq);',
        '  float hc = hs(floor(fq) + 3.0);',
        '  vec3 fc = hc < 0.35 ? vec3(0.27, 0.4, 0.16) : hc < 0.6 ? vec3(0.38, 0.46, 0.2) : hc < 0.78 ? vec3(0.3, 0.44, 0.16) : hc < 0.9 ? vec3(0.5, 0.48, 0.26) : vec3(0.25, 0.36, 0.15);',
        '  fc *= (1.0 + 0.07 * sin(fp.x * 2.2 + hc * 9.0) * step(0.35, hc) * step(hc, 0.6) * (1.0 - smoothstep(0.4, 1.2, px))) * (0.93 + 0.14 * n2);',
        '  float ed = min(min(fr.x, 1.0 - fr.x) * 24.0, min(fr.y, 1.0 - fr.y) * 75.0); fc = mix(fc * mix(0.8, 1.0, smoothstep(0.4, 2.0, ed)), vec3(0.31, 0.42, 0.18), smoothstep(5.0, 25.0, px));',
        '  float dw = rect(p, ' + v4([x0, z0, x1, z1]) + ');',
        '  vec3 c = mix(mix(vec3(0.24, 0.38, 0.15), vec3(0.36, 0.48, 0.21), n2), fc, smoothstep(20.0, 35.0, dw)) * (0.74 + 0.46 * n1) * (0.86 + 0.26 * n3) * vec3(1.0 + 0.12 * (A.b - 0.5), 1.0, 1.0 - 0.2 * (A.b - 0.5));',
        // (the grass a little uneven over a few metres and over tens (lighter, darker, toward hay), greyer far off)
        '  c *= 1.0 + 0.3 * (B.r - 0.5) + 0.3 * (D.g - 0.5); c = mix(c, c.g * vec3(1.0, 0.88, 0.42), 0.4 * (D.r - 0.5) + 0.2 * (B.b - 0.5));',
        '  c = mix(c, vec3(dot(c, vec3(0.3333))), 0.15 * smoothstep(32.0, 48.0, d));',
        '  vec3 gv = vec3(0.56, 0.54, 0.48) * (0.78 + 0.34 * n3) * (0.94 + 0.1 * n1);',   // (gravel)
        '  float bend = max(ax - 36.0, 0.0), zc = 0.011 * bend * bend, sl = 0.022 * bend, rz = p.y - zc, az = abs(rz) / sqrt(1.0 + sl * sl), rw = mix(6.0, 3.1, smoothstep(15.5, 17.5, ax));',
        '  float rd = ax > 9.0 ? az - rw : 99.0, fcd = min(rect(p, vec4(-37.5, 3.0, -14.0, 20.5)), rect(p, vec4(14.0, -18.5, 40.0, -3.0))), pv = min(rd, fcd), pad = rect(p, vec4(-24.0, -7.6, -14.0, -2.5));',
        '  c = mix(c, gv, max(1.0 - smoothstep(0.6, 1.0, min(pv, dw - 0.2)), 1.0 - smoothstep(-e, e, pad)));',   // (gravel round the walls, along the road and the paddock, the truck's pad)
        '  vec3 a = vec3(0.35, 0.36, 0.38) * (0.84 + 0.28 * n3) * (0.93 + 0.12 * n1);',   // (asphalt; worn tracks along the road)
        '  a *= 1.0 - 0.08 * (1.0 - smoothstep(0.3, 0.9, abs(abs(rz) - 1.5))) * step(14.5, ax) * step(rd, 0.0);',
        // (on the asphalt: dark sealed cracks meandering across it here and there, a few patches of newer asphalt)
        '  if (pv < 0.6) { float cs = abs(fract(dot(p, vec2(0.17, 0.11)) + B.g * 1.2 + A.b * 0.06) - 0.5) * 5.0; a *= 1.0 - 0.5 * line(cs, 0.02, e) * smoothstep(0.5, 0.6, D.b) * (1.0 - smoothstep(0.04, 0.1, px));',
        '    vec2 pq = p / vec2(5.0, 2.2), pf = abs(fract(pq) - 0.5); a *= 1.0 - (0.06 + 0.05 * n1) * step(0.86, hs(floor(pq) + 17.0)) * smoothstep(0.0, 0.06, min((0.33 - pf.x) * 5.0, (0.3 - pf.y) * 2.2)); }',
        '  vec3 cr = vec3(0.6, 0.6, 0.58) * (0.86 + 0.2 * n3) * (0.94 + 0.1 * n1) * (1.0 - 0.18 * smoothstep(0.55, 0.8, A.g)) * (0.95 + 0.09 * hs(floor(p / 4.0) + 3.0));',   // (concrete: 4 m slabs each a shade apart, old stains)
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
        '  if (d < 70.0) { shd = max(shd, ' + mx(BX.map(b => 'sweep(p, ' + v4(b) + ', ' + b[4].toFixed(2) + ', px)')) + ');',
        // (by the right door: the gazebo's canopy (2.04 m up: its footprint swept from there), its table's top, the slicks stacked under it;
        // the delivery on its pallet)
        '    if (p.x > 8.0 && p.x < 14.5 && abs(p.y + 0.2) < 5.6) shd = max(shd, max(max(sweep(p + oSun.xz / oSun.y * 2.04, vec4(11.0, 2.4, 14.0, 5.4), 0.56, px), sweep(p + oSun.xz / oSun.y * 0.7, vec4(12.3, 4.4, 13.5, 5.0), 0.035, px)),',
        '      max(sweep(p, vec4(11.42, 2.72, 12.68, 3.34), 0.96, px), sweep(p, vec4(10.6, -3.2, 11.8, -2.4), 1.2, px))));',
        '    c *= 0.8 + 0.2 * smoothstep(0.0, 1.0, min(min(rect(p, ' + v4(BX[1]) + '), rect(p, ' + v4(BX[3]) + ')), rect(p, ' + v4(BX[4]) + '))); }',
        '  c *= mix(vec3(1.0), vec3(0.5, 0.56, 0.68), shd);',
        '  gl_FragColor = outC(mix(c, horz(p), ' + HAZE.toFixed(2) + ' * (1.0 - exp(-d / ' + AIR.toFixed(1) + ')))); }'].join('\n') }));
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

  /* ---------------- the turntable: a steel disc flush with the floor (it neither turns nor rises: the camera goes round the car, the
     lift behind it raises it) ---------------- */
  function buildTurntable() {
    const R = ROOM.R;
    tt = new THREE.Group(); scene.add(tt);
    ttTop = new THREE.Group(); tt.add(ttTop);
    const discTop = new THREE.Mesh(new THREE.CircleGeometry(R, 96), floorMaterial(TX.disc, 0.8, { rough: 1.6, metal: 0.75 }));   // (brushed steel: the car soft in it, not a chrome mirror)
    discTop.rotation.x = -Math.PI / 2; discTop.position.y = 0.002; discTop.receiveShadow = true; ttTop.add(discTop);
    buildLift();
  }

  /* ---------------- the lift: a single-post lift behind the car (the far side from the home view), always there ----------------
     The column (blue powder coat, its edges cut off) on its base plate (yellow-black edges, the same band round the column's foot), the
     hydraulic power unit on its back, the controls and a blank plate on its side: a free piece (it dissolves when it comes between the
     camera and the car; not while it holds the car up). On its inner face the carriage runs up and down; under its crosshead two pins (a
     front and a rear one), each with two telescopic swing arms on it (the outer tube in the column's blue, two zinc ones in it, a rubber
     pad in a yellow cup on a screw at the end, a height adapter on the screw when it would stand out far): a long one down, which passes
     under the car to its near sill, a short one up, to its far sill. The carriage and the arms are built once and their vertices moved as
     they move (poseLift): the carriage goes with the column; the arms, out under the car, never dissolve (they carry it), stowed they go
     with the column.
     Stowed (whenever nothing is lifted) the arms lie along x in front of the column, out of the cars' lane (|z| > 1.38): the front pin's
     pointing back, the rear pin's forward (each pair swings in on the side where the car's far wheels are beyond its reach; the rear
     pair after the front one: it passes the front pin). A lift: the arms swing in, run out to the pads, the screws turn up to each
     pad's height, the carriage takes up the slack till the pads touch, then the car goes up with it (setLift: its v.grp). ---------------- */
  const LIFT = { x: 0, z: -1.72, hz: 0.115, c0: 0.04, du: 0.055, s: 0, c: 0.04, on: false, plan: null, mesh: null, piece: null, u: { value: 0 }, geo: null, cmesh: null, n0: 0, q: null,
    // (each arm: its pin, its level (1 up: the short ones), its stowed angle (in the floor's plane: 0 along +x, pi/2 along +z), its length
    // collapsed (pin to pad), the car's end it lifts (1 the front), the sill (1 the near one, +z); stowed the front pin's pads and
    // knuckles keep 1.38 m off the middle, the rear pin's long arm's pad clears the front pin's short arm, its knuckle the column)
    arms: [{ p: [0.64, -1.445], lv: 0, a0: Math.PI, lc: 1.15, end: 1, sd: 1 }, { p: [0.64, -1.445], lv: 1, a0: Math.PI, lc: 0.58, end: 1, sd: -1 },
      { p: [-0.64, -1.55], lv: 0, a0: 0, lc: 1.15, end: -1, sd: 1 }, { p: [-0.64, -1.55], lv: 1, a0: 0, lc: 0.58, end: -1, sd: -1 }] };
  // (a pad's top over its arm's middle, its screw left out: half the outer tube, the collar, the rubber; the screw's reach and its height
  // stowed; an arm's reach: each inner tube runs out till 8 cm of it are left in the one round it; the carriage's lowest (the arms'
  // tubes 2 mm over the disc); the screw's run before an adapter goes on it, the screw the arms are built with)
  const PADH = 0.0565, PMIN = 0.008, PMAX = 0.24, PDEF = 0.02, armMax = (A) => 3 * A.lc - 0.5, CMIN = 0.0245, SX = 0.06, PB0 = 0.15;
  const LBL = [0.08, 0.22, 0.58], LBLt = [0.12, 0.29, 0.69], LBLd = [0.05, 0.14, 0.4], LZN = [0.6, 0.62, 0.65], LAR = [0.35, 0.37, 0.41], LRB = [0.1, 0.1, 0.105], LYL = [0.92, 0.7, 0.1];   // (the lift's blue, its top faces, its ribs; the zinc of the inner tubes; dark steel; the rubber; safety yellow)
  // yellow and black stripes at 45 degrees on a rectangle: from its corner o along u (w long) and across it along v (h), a point inside
  // what they lie on; the yellow ones only (laid over black), each clipped to the rectangle
  function hazard(g, o, u, v, w, h, pitch, inside) {
    const P = (a, b) => [o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b, o[2] + u[2] * a + v[2] * b], YL = [0.92, 0.7, 0.1];
    const clip = (pts, x0, sg) => { const out = []; for (let j = 0; j < pts.length; j++) { const a = pts[j], b = pts[(j + 1) % pts.length], ia = sg * (a[0] - x0) >= 0, ib = sg * (b[0] - x0) >= 0;
      if (ia) out.push(a); if (ia !== ib) out.push([x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]); } return out; };
    for (let i = -Math.ceil(h / pitch) - 1; i * pitch < w; i++) { if (i & 1) continue;
      const q = clip(clip([[i * pitch, 0], [(i + 1) * pitch, 0], [(i + 1) * pitch + h, h], [i * pitch + h, h]], 0, 1), w, -1);
      for (let j = 1; j + 1 < q.length; j++) g.triO(P(...q[0]), P(...q[j]), P(...q[j + 1]), YL, inside); }
  }
  // an upright prism round (cx, cz): a box 2 hx by 2 hz with its upright edges cut off by ch, from y0 to y1 (its top capped)
  function prism(g, cx, cz, hx, hz, ch, y0, y1, col, top) {
    const q = [[hx - ch, hz], [-hx + ch, hz], [-hx, hz - ch], [-hx, -hz + ch], [-hx + ch, -hz], [hx - ch, -hz], [hx, -hz + ch], [hx, hz - ch]], c = [cx, (y0 + y1) / 2, cz], P = (i, y) => [cx + q[i % 8][0], y, cz + q[i % 8][1]];
    for (let i = 0; i < 8; i++) g.quadO(P(i, y0), P(i + 1, y0), P(i + 1, y1), P(i, y1), col, c);
    for (let i = 1; i < 7; i++) g.triO(P(0, y1), P(i, y1), P(i + 1, y1), top || col, c);
  }
  function buildLift() {
    const P = LIFT.piece = piece(), g = P.g, gl = (k) => gloss(P, k), box = (...a) => fbox(g, ...a), { x: X, z: Z, hz: HZ } = LIFT, zf = Z + HZ, zb = Z - HZ, xs = X + 0.18;
    const DK = PAL.dk, ST = PAL.steel, PL = [0.24, 0.25, 0.27], BLK = [0.07, 0.07, 0.08];
    P.lift = true; P.near = 2.2; P.boxIn = new THREE.Box3(new V3(X - 0.24, 0, Z - 0.32), new V3(X + 0.3, 3.1, Z + 0.16));   // (what can stand in the way: the column, not the plate round it)
    // the base plate (its tread a shade lighter on top), its edges in yellow and black, the anchor bolts: flush with the column's face at
    // the front (the stowed rear arms lie on the disc before it, a low car's arms down by the disc)
    const pz0 = zf, pz1 = -2.24, pzc = (pz0 + pz1) / 2, pd = pz0 - pz1, ps = pd - 0.14;
    gl(1.3); box(X, 0, pzc, 1.12, 0.012, pd, PL, [0.29, 0.3, 0.32]);
    gl(PAINT); const yt = 0.015, ins = [X, -1, pzc];
    for (const [bx, bz, sx, sz] of [[X, pz0 - 0.035, 1.12, 0.07], [X, pz1 + 0.035, 1.12, 0.07], [X - 0.525, pzc, 0.07, ps], [X + 0.525, pzc, 0.07, ps]]) box(bx, 0.012, bz, sx, 0.0015, sz, BLK);
    hazard(g, [X - 0.56, yt, pz0], [1, 0, 0], [0, 0, -1], 1.12, 0.07, 0.07, ins); hazard(g, [X + 0.56, yt, pz1], [-1, 0, 0], [0, 0, 1], 1.12, 0.07, 0.07, ins);
    hazard(g, [X - 0.56, yt, pz1 + 0.07], [0, 0, 1], [1, 0, 0], ps, 0.07, 0.07, ins); hazard(g, [X + 0.56, yt, pz0 - 0.07], [0, 0, -1], [-1, 0, 0], ps, 0.07, 0.07, ins);
    gl(METAL); for (const [bx, bz] of [[-0.4, -1.71], [0.4, -1.71], [-0.4, -2.12], [0.4, -2.12], [-0.13, -2.12], [0.13, -2.12]]) cylA(g, [X + bx, 0.019, bz], 'y', 0.02, 0.014, 6, ST);
    // the column: its foot in yellow and black (on all four faces), its slot on the inner face (the lock's teeth in it, a steel rail
    // either side: the carriage runs there), the cap; a blank plate and the controls on its side (up, down, the red stop on yellow)
    gl(PAINT); prism(g, X, Z, 0.18, HZ, 0.025, 0.012, 0.24, BLK); prism(g, X, Z, 0.18, HZ, 0.025, 0.24, 2.98, LBL, LBLt);
    hazard(g, [X - 0.155, 0.012, zf + 0.003], [1, 0, 0], [0, 1, 0], 0.31, 0.228, 0.075, [X, 0.1, Z]); hazard(g, [X + 0.155, 0.012, zb - 0.003], [-1, 0, 0], [0, 1, 0], 0.31, 0.228, 0.075, [X, 0.1, Z]);
    hazard(g, [xs + 0.003, 0.012, zf - 0.025], [0, 0, -1], [0, 1, 0], 2 * HZ - 0.05, 0.228, 0.075, [X, 0.1, Z]); hazard(g, [X - 0.183, 0.012, zb + 0.025], [0, 0, 1], [0, 1, 0], 2 * HZ - 0.05, 0.228, 0.075, [X, 0.1, Z]);
    g.quadO([X - 0.045, 0.3, zf + 0.002], [X + 0.045, 0.3, zf + 0.002], [X + 0.045, 2.84, zf + 0.002], [X - 0.045, 2.84, zf + 0.002], [0.035, 0.038, 0.045], [X, 1.5, Z]);
    for (let y = 0.36; y < 2.8; y += 0.1) g.quadO([X - 0.045, y, zf + 0.004], [X + 0.045, y, zf + 0.004], [X + 0.045, y + 0.022, zf + 0.004], [X - 0.045, y + 0.022, zf + 0.004], [0.2, 0.21, 0.23], [X, y, Z]);
    gl(METAL); for (const s of [-1, 1]) box(X + s * 0.062, 0.26, zf + 0.004, 0.032, 2.6, 0.012, LZN);
    gl(PAINT); box(X, 2.98, Z, 0.42, 0.055, 0.34, DK, [0.17, 0.18, 0.2]); box(X, 3.035, Z, 0.22, 0.05, 0.16, [0.16, 0.17, 0.19]);
    box(xs + 0.002, 1.42, Z, 0.006, 0.2, 0.13, [0.82, 0.83, 0.8]); box(xs + 0.006, 1.6, Z, 0.004, 0.02, 0.13, [0.92, 0.7, 0.1]);   // (the plate: no words on it)
    box(xs + 0.03, 0.98, Z - 0.035, 0.06, 0.24, 0.15, [0.15, 0.16, 0.18]);   // the controls (behind the carriage's guides)
    box(xs + 0.061, 1.14, Z, 0.004, 0.04, 0.04, [0.12, 0.55, 0.22]); box(xs + 0.061, 1.08, Z, 0.004, 0.04, 0.04, [0.06, 0.06, 0.07]);
    cylA(g, [xs + 0.064, 1.1, Z - 0.075], 'x', 0.032, 0.008, 12, [0.92, 0.7, 0.1]); cylA(g, [xs + 0.078, 1.1, Z - 0.075], 'x', 0.021, 0.022, 10, [0.72, 0.1, 0.08]);
    // the power unit on its back: the plate, the oil tank (grey plastic), the pump, the motor and its fan cover; the pressure line into
    // the column, the motor's lead down to the floor
    box(X, 0.72, zb - 0.006, 0.3, 0.56, 0.012, DK); box(X - 0.03, 0.76, zb - 0.088, 0.22, 0.27, 0.15, [0.62, 0.64, 0.66], [0.7, 0.72, 0.74]);
    gl(1.3); box(X - 0.03, 1.03, zb - 0.075, 0.17, 0.07, 0.13, [0.5, 0.52, 0.55]);
    gl(PAINT); cylA(g, [X - 0.03, 1.21, zb - 0.075], 'y', 0.075, 0.22, 12, [0.2, 0.21, 0.23]); cylA(g, [X - 0.03, 1.335, zb - 0.075], 'y', 0.07, 0.03, 12, BLK);
    gl(MATTE); tube(g, [[X + 0.055, 1.06, zb - 0.075], [X + 0.11, 1.0, zb - 0.06], [X + 0.12, 0.86, zb - 0.02], [X + 0.12, 0.74, zb + 0.004]], 0.014, BLK, 10, 6);
    tube(g, [[X - 0.03, 1.33, zb - 0.15], [X + 0.1, 1.2, zb - 0.17], [X + 0.13, 0.5, zb - 0.06], [X + 0.12, 0.08, zb - 0.03], [X + 0.12, 0.016, zb - 0.14]], 0.009, BLK, 16, 5);
    BLOBS.push([X, -1.92, 1.7, 1.1, 0.75, 0, P]);
    // the carriage and the arms: built once (liftGeo), their vertices moved to where they are (poseLift); the carriage in the column's
    // piece (it goes with it: finishPieces gives it the piece's dissolve), the arms a mesh of their own (stowed they go with the column;
    // out under the car they stay, they carry it: stepPieces)
    const B = LIFT.geo = liftGeo(), n = B.arm.length, n0 = B.arm.indexOf(0);
    const mk = (a, b, m) => { const geo = new THREE.BufferGeometry();
      for (const [nm, k] of [['position', 3], ['normal', 3], ['color', 3]]) geo.setAttribute(nm, new THREE.BufferAttribute(new Float32Array((b - a) * k), k).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('gloss', new THREE.BufferAttribute(B.gl.slice(a, b), 1)); geo.boundingSphere = new THREE.Sphere(new V3(X, 1.2, -0.6), 3.4);   // (all it can reach)
      const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; return o; };
    const cm = new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x5a5a5a, shininess: 50 }); cm.userData.gl = true; LIFT.cmesh = mk(0, n0, cm); P.root.add(LIFT.cmesh);
    const am = new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x5a5a5a, shininess: 50 }); hideMat(am, LIFT.u, true); LIFT.mesh = mk(n0, n, am); scene.add(LIFT.mesh);
    LIFT.q = LIFT.arms.map(() => ({})); LIFT.n0 = n0; poseLift();
  }
  // where an arm is at s (0 stowed .. 1 at the pads) on the way plan (none: stowed): the front pair swings and runs out, then the rear
  // pair; the screws turn up last
  const sub = (a, b, s) => clamp((s - a) / (b - a), 0, 1);
  function armPose(A, i, s, pl) {
    if (!pl) return { a: A.a0, len: A.lc, post: PDEF };
    const f = i < 2, sw = EZ.io(f ? sub(0, 0.3, s) : sub(0.32, 0.62, s)), ex = EZ.io(f ? sub(0.3, 0.62, s) : sub(0.6, 0.94, s));
    return { a: lerp(A.a0, pl.ang[i], sw), len: lerp(A.lc, pl.len[i], ex), post: lerp(PDEF, pl.post[i], EZ.sine(sub(0.55, 1, s))) };
  }
  // the carriage and the arms, built once: the carriage at its lowest (its level 0), each arm in its own frame (its pin at 0, along +x,
  // its tubes in, its screw at PB0); each vertex marked with what moves it: arm (-1 the carriage), kd (how many tubes' run-outs carry
  // it along the arm), kp (1: the screw's top, by the screw's run; 2: the adapter's top and the pad, by the whole post), kr (the adapter:
  // drawn to a line while the screw alone reaches)
  function liftGeo() {
    const g = new World.GB(), L = LIFT, n = () => g.P.length / 3, T = { arm: [], kd: [], kp: [], kr: [] }, gls = [];
    let m0 = 0; const tag = (arm, kd, kp, kr, ym) => { for (let i = m0, e = n(); i < e; i++) { T.arm[i] = arm; T.kd[i] = kd; T.kp[i] = ym != null ? (g.P[i * 3 + 1] > ym ? kp[1] : kp[0]) : kp; T.kr[i] = kr; } m0 = n(); };
    const gl = (k) => gls.push([n(), k]), cy = L.du + PADH + PDEF + 0.0135, zf = L.z + L.hz;   // (cy: the crosshead's underside, over the stowed pads; zf: the column's face)
    // the carriage: a plate up the column's face (its edges cut off, two ribs across it), steel guides round the column's front corners,
    // the lock's latch and its lever at the top, a blank plate; at its foot the yoke over the two pins, a steel boss on each pin
    gl(PAINT); prism(g, 0, zf + 0.028, 0.205, 0.026, 0.012, cy + 0.075, cy + 0.9, LBL, LBLt); World.box(g, 0, cy, (zf - 1.39) / 2, 1.4, 0.075, -1.392 - zf, 0, LBL, LBLt);
    World.box(g, 0, cy + 0.075, zf + 0.079, 0.3, 0.13, 0.05, 0, LBL, LBLt);   // (the gusset between them)
    for (const y of [0.26, 0.64]) World.box(g, 0, cy + y, zf + 0.058, 0.38, 0.04, 0.008, 0, LBLd, LBL);
    World.box(g, 0.1, cy + 0.5, zf + 0.056, 0.11, 0.075, 0.004, 0, [0.82, 0.83, 0.8]);
    gl(METAL); for (const sx of [-1, 1]) World.box(g, sx * 0.2, cy + 0.11, zf - 0.02, 0.016, 0.74, 0.1, 0, LZN);
    World.box(g, 0, cy + 0.72, zf + 0.069, 0.1, 0.09, 0.03, 0, LAR); World.box(g, 0.055, cy + 0.69, zf + 0.087, 0.012, 0.012, 0.012, 0, LZN); obox(g, [0.05, cy + 0.75, zf + 0.09], [0.15, cy + 0.79, zf + 0.09], 0.016, 0.01, [0.72, 0.12, 0.09]);
    for (const i of [0, 2]) { const [px, pz] = L.arms[i].p; cylA(g, [px, (0.0225 + cy) / 2, pz], 'y', 0.024, cy - 0.0225, 8, LZN); cylA(g, [px, cy + 0.11, pz], 'y', 0.048, 0.07, 12, LZN, [0.4, 0.42, 0.45]); }
    tag(-1, 0, 0, 0);
    // the arms: the knuckle on its pin and the outer tube (blue), the two inner ones (zinc) run out by the same amount, the pad's seat,
    // its screw and the adapter on it, the yellow cup and the rubber
    for (let i = 0; i < 4; i++) {
      const lc = L.arms[i].lc;
      gl(PAINT); cylA(g, [0, 0, 0], 'y', 0.052, 0.045, 10, LBL, LBLt); obox(g, [0.04, 0, 0], [lc - 0.06, 0, 0], 0.075, 0.045, LBL); tag(i, 0, 0, 0);
      gl(METAL); obox(g, [0.11, 0, 0], [lc + 0.02, 0, 0], 0.062, 0.036, LZN); tag(i, 1, 0, 0);
      obox(g, [0.16, 0, 0], [lc + 0.04, 0, 0], 0.05, 0.029, LZN); World.box(g, lc, 0.0145, 0, 0.07, 0.008, 0.07, 0, LAR); tag(i, 2, 0, 0);
      cylA(g, [lc, 0.0225 + SX / 2, 0], 'y', 0.02, SX, 8, LZN); tag(i, 2, [0, 1], 0, 0.0225 + SX / 2);
      cylA(g, [lc, 0.0225 + (SX + PB0) / 2, 0], 'y', 0.04, PB0 - SX, 12, LAR, LZN); tag(i, 2, [1, 2], 1, 0.0225 + (SX + PB0) / 2);
      gl(PAINT); cylA(g, [lc, 0.0285 + PB0, 0], 'y', 0.062, 0.012, 14, LYL); tag(i, 2, 2, 0);
      gl(MATTE); cylA(g, [lc, 0.0455 + PB0, 0], 'y', 0.06, 0.022, 14, LRB); tag(i, 2, 2, 0);
    }
    const N = n(), gl1 = new Float32Array(N).fill(1); gls.forEach(([i, k], j) => gl1.fill(k, i, j + 1 < gls.length ? gls[j + 1][0] : N));
    return { P: new Float32Array(g.P), N: new Float32Array(g.N), C: new Float32Array(g.C), gl: gl1, arm: Int8Array.from(T.arm), kd: Uint8Array.from(T.kd), kp: Uint8Array.from(T.kp), kr: Uint8Array.from(T.kr) };
  }
  // the lift's meshes to where it is now: the carriage at its level, each arm swung, run out and its screw turned (its colours darker low
  // down, as the pieces': stowed by the floor, up in the light). The built vertices moved, nothing made (no garbage on the phone)
  function poseLift() {
    const L = LIFT, B = L.geo, n = B.arm.length, n0 = L.n0, G0 = L.cmesh.geometry.attributes, G1 = L.mesh.geometry.attributes;
    for (let i = 0; i < 4; i++) { const A = L.arms[i], ps = armPose(A, i, L.s, L.plan), q = L.q[i];
      q.ca = Math.cos(ps.a); q.sa = Math.sin(ps.a); q.d = (ps.len - A.lc) / 2; q.sh = Math.min(ps.post, SX) - SX; q.ph = ps.post - PB0; q.kr = ps.post - SX < 0.001; q.x = A.p[0]; q.z = A.p[1]; q.y = L.c + A.lv * L.du; q.lc = A.lc; }
    let pa = G0.position.array, na = G0.normal.array, ca = G0.color.array;
    for (let v = 0, j = 0; v < n; v++, j += 3) {
      if (v === n0) { pa = G1.position.array; na = G1.normal.array; ca = G1.color.array; }   // (the carriage's vertices, then the arms')
      const a = B.arm[v], o = v < n0 ? j : j - 3 * n0; let x = B.P[j], y = B.P[j + 1], z = B.P[j + 2], nx = B.N[j], nz = B.N[j + 2];
      if (a < 0) y += L.c;
      else { const q = L.q[a], k = B.kd[v], p = B.kp[v];
        x += k * q.d; if (p) y += p === 1 ? q.sh : q.ph; if (B.kr[v] && q.kr) { x = q.lc + k * q.d; z = 0; }
        const wx = q.x + x * q.ca - z * q.sa; z = q.z + x * q.sa + z * q.ca; x = wx; y += q.y;
        const mx = nx * q.ca - nz * q.sa; nz = nx * q.sa + nz * q.ca; nx = mx; }
      pa[o] = x; pa[o + 1] = y; pa[o + 2] = z; na[o] = nx; na[o + 1] = B.N[j + 1]; na[o + 2] = nz;
      const s = y < 0.4 ? 0.5 + 0.5 * smooth(0, 0.4, y) : 1; ca[o] = B.C[j] * s; ca[o + 1] = B.C[j + 1] * s; ca[o + 2] = B.C[j + 2] * s;
    }
    for (const G of [G0, G1]) G.position.needsUpdate = G.normal.needsUpdate = G.color.needsUpdate = true;
    shadowDirty = Math.max(shadowDirty, 1);
  }

  // where the pads go under this car (measured on its body and on its upgrades' parts when it comes in, again after a new aero kit or
  // engine; the car at rest on the table): at each end just inside the axle, under the sill (a low car: under its side pod's
  // step, further in if need be, else under its floor, well inside it: there the pads go into it a little, out of sight), where the underside
  // over the whole rubber is flat (the pad's top at its lowest: no pad up into a lip, none under a step); moved in along the car where an
  // arm cannot reach. The carriage's level when the pads touch (cc: no screw shorter than its least, the long arms under the body, not
  // under the floor), the level the arms swing in at (cs); each arm's angle, length and screw. Measured a few milliseconds a frame (planG:
  // the rays through the body are many), or at once (liftPlan)
  function liftPlan(cv) { if (cv.lp) return cv.lp; const g = planG(cv, 1e9); let r; do r = g.next(0); while (!r.done); return (cv.lp = r.value); }
  // (measured in the background at a quiet moment (the car shown, a new one in, new parts on it): no show waits for it, the first lift
  // starts at once; cv.lpG while it is measured (a lift asked for meanwhile waits for it); given up when the car goes or its parts change)
  // (then, the same way, its body's heights for the robots' plans: gridG)
  function planAhead(cv) {
    if (!cv || (cv.lp && cv.hgrid) || cv.lpG) return; const tk = cv.lpG = {}, g = cv.lp ? null : planG(cv, 3), gg = cv.hgrid ? null : gridG(cv, 3);
    spawn((function* () { yield; for (;;) { if (cv.lpG !== tk || cv !== cur) break;
      if (!cv.lp && g) { const r = g.next(); if (r.done) cv.lp = r.value; } else if (!cv.hgrid && gg) { const r = gg.next(); if (r.done) { cv.hgrid = r.value; break; } } else break; yield; }
      if (cv.lpG === tk) cv.lpG = null; })(), true);
  }
  function* planG(cv, ms) {
    const K = cv.kit, L = LIFT, A = L.arms, bm = ms || 3; cv.v.grp.updateMatrixWorld(true);
    // (the rays: through the body and its parts that reach down there (the skirts, the light strips; not the light's pool on the floor);
    // each side's measured once (the pads' heights ask for the same ones again and again); a frame's share of them, then on in the next)
    const mesh = [], bb = new THREE.Box3(), add = (o) => { if (o.isMesh && o.visible && bb.setFromObject(o).min.y < 1.3) mesh.push(o); };
    cv.probe.meshes.forEach(add); for (const k of ['aero', 'motor']) { const g = cv.parts[k]; if (g) g.traverse(o => { if (o !== g.userData.pool) add(o); }); }
    const PB = probeOf(mesh, true), memo = new Map(); let t0 = performance.now();
    function* tick() { if (performance.now() - t0 > bm) { yield; t0 = performance.now(); } }
    const side = (x, y) => { const k = Math.round(x * 1000 + 5000) * 4096 + Math.round(y * 1000); let v = memo.get(k); if (v === undefined) memo.set(k, v = PB.side(x, y, 1) || 0); return v; };
    function* low(x) { for (let y = 0.03; y < 0.9; y += 0.03) { yield* tick(); if (side(x, y)) { for (let y2 = y - 0.025; y2 < y; y2 += 0.005) if (side(x, y2)) return y2; return y; } } return null; }
    // the body's underside over a pad at (x, z): the lowest height where the body covers the whole rubber
    const covers = (x, y, z) => Math.min(side(x - 0.06, y), side(x, y), side(x + 0.06, y)) >= z + 0.05;
    function* under(x, z, y1) { for (let y = 0.02; y < y1; y += 0.03) { yield* tick(); if (covers(x, y, z)) { for (let y2 = y - 0.025; y2 < y; y2 += 0.005) if (covers(x, y2, z)) return y2; return y; } } return null; }
    // a pad at x: [z, its top]: just in from the sill; a low car: under its side pod if it has one, else under its floor where the body
    // over it is high enough to hide the pad going into it
    function* padAt(x) { const y0 = yield* low(x); if (y0 == null) return null; const s0 = side(x, y0 + 0.01);
      if (y0 < 0.12) { for (let y = y0 + 0.04; y < 0.24; y += 0.02) { yield* tick(); const sp = side(x, y); if (sp > s0 + 0.12) { const t = yield* under(x, sp - 0.08, 0.27); if (t != null) return [sp - 0.08, t]; break; } }
        return [Math.max(0.08, Math.min(s0, side(x, 0.15)) - 0.08), y0, 1]; }
      for (let z = s0 - 0.08; z > 0.08; z -= 0.03) { const t = yield* under(x, z, y0 + 0.2); if (t != null) return [z, t]; }
      return null; }
    // the underside over the rubber found at height t, both sides (rays up at its middle and round its rim; where none meets the body near
    // t, it is open below: the sill's edge there at t): its lowest and highest
    function* face(x, z, t) { let lo = 9, hi = -9; for (const sd of [1, -1]) { for (let k = 0; k < 9; k++) { const a = k * TAU / 8, r = k ? 0.065 : 0, y = PB.bottom(x + Math.cos(a) * r, sd * z + Math.sin(a) * r), v = y == null || y > t + 0.1 ? t : y;
      lo = Math.min(lo, v); hi = Math.max(hi, v); } yield* tick(); } return [lo, hi]; }
    const reach = (a, x, z) => { const d = Math.hypot(x - a.p[0], z - a.p[1]); return d >= a.lc + 0.02 && d <= armMax(a) - 0.02; };
    const pads = [];
    for (const end of [1, -1]) {
      const w = cv.wheels.filter(q => q.front === (end > 0)), ax = end > 0 ? K.wfx : K.wrx, r = w.length ? Math.max(...w.map(q => q.r)) : K.wr, x0 = ax - end * (r + 0.2);
      const lg = A.find(a => a.end === end && a.sd > 0), sh = A.find(a => a.end === end && a.sd < 0);
      let best = null, near = null, floor = null;
      for (const dx of [0, 0.03, -0.04, -0.08, -0.12, -0.16, -0.2, -0.24, -0.28, -0.32, -0.38, -0.44, -0.5, -0.56]) {   // (out a little while the tyre stays 15 cm off, else in)
        const x = x0 + end * dx; if (end * (ax - x) < r + 0.15 || end * x < 0.15) continue;
        const pz = yield* padAt(x); if (!pz || !reach(lg, x, pz[0]) || !reach(sh, x, -pz[0])) continue;
        if (pz[2]) { floor = floor || [x, pz[0], pz[1]]; continue; }   // (under the floor: only if no side pod further in will do)
        const f = yield* face(x, pz[0], pz[1]), c = [x, pz[0], f[0], f[1] - f[0]]; if (c[3] < 0.03) { best = c; break; } if (!near || c[3] < near[3]) near = c;   // (a step, a lip, an edge over it: on along)
      }
      best = best || floor || near; if (!best) { const pz = (yield* padAt(x0)) || [K.sideZ - 0.1, K.bottom]; best = [x0, pz[0], pz[1]]; }
      pads[A.indexOf(lg)] = [best[0], best[1], best[2]]; pads[A.indexOf(sh)] = [best[0], -best[1], best[2]];
    }
    let cc = Math.min(K.bottom, cv.under.position.y) - 0.0275;
    for (let i = 0; i < 4; i++) cc = Math.min(cc, pads[i][2] - A[i].lv * L.du - PADH - PMIN);
    // (and no arm's tube up into the body on its way to its pad: a mud flap, a skirt, a low lip at the far side, measured close there
    // (thin things), every 10 cm under the middle; the screws longer)
    for (let i = 0; i < 4; i++) { const a = A[i], [px, pz] = a.p, dx = pads[i][0] - px, dz = pads[i][1] - pz, n = Math.hypot(dx, dz), ux = dx / n, uz = dz / n, pa = Math.abs(pads[i][1]);
      for (let r = 0.1; r < n - 0.1;) { const z = pz + uz * r, az = Math.abs(z), edge = az > pa - 0.05;
        if (az < K.hw + 0.05) for (const o of edge ? [-0.035, 0, 0.035] : [0]) { const y = PB.bottom(px + ux * r - uz * o, z + ux * o); if (y != null) cc = Math.min(cc, y - a.lv * L.du - 0.0275); }
        r += edge ? 0.025 : 0.1; yield* tick(); } }
    cc = Math.max(cc, CMIN);   // (a car on a low floor: the arms down by the disc, the pads up into the floor)
    const plan = { pads, cc, cs: Math.min(L.c0, cc), post: [], ang: [], len: [] };
    for (let i = 0; i < 4; i++) { const [x, z, t] = pads[i], a = A[i]; plan.post[i] = clamp(t - cc - a.lv * L.du - PADH, PMIN, PMAX); plan.ang[i] = Math.atan2(z - a.p[1], x - a.p[0]); plan.len[i] = clamp(Math.hypot(x - a.p[0], z - a.p[1]), a.lc, armMax(a)); }
    return plan;
  }
  // the car at height h on the lift (every car on the table: the paint show's new body under the old one too); the carriage with it
  // while the pads are on the sills
  function setLift(h) {
    lift = h;
    for (const cv of liveCars()) cv.v.grp.position.y = h;
    if (LIFT.on && LIFT.plan) { LIFT.c = LIFT.plan.cc + h; poseLift(); }
  }
  // the lift's moves for the shows: the arms in (1) or out (0), the carriage to a level, the car up (the camera's point with it when
  // follow; follow a function of the plan and the height: the camera's point and pitch it goes to meanwhile) and down onto its wheels
  // again (lowerCar: the pads off the sills, the arms still under it), liftDown: then the arms stowed and the carriage at its foot
  function* armsTo(k, s) { const s0 = LIFT.s; if (Math.abs(k - s0) < 1e-3) return; SFX.servo(s * 0.9); yield* tween(s, (e) => { LIFT.s = lerp(s0, k, e); poseLift(); }); LIFT.s = k; }
  function* carriageTo(c, s) { const c0 = LIFT.c; if (Math.abs(c - c0) < 1e-3) return; yield* tween(s, (e) => { LIFT.c = lerp(c0, c, e); poseLift(); }, EZ.io); }
  function* liftUp(cv, h, follow) {
    while (!cv.lp && cv.lpG) yield;   // (its plan being measured: a moment more)
    const pl = cv.lp || (cv.lp = yield* planG(cv));
    if (LIFT.plan !== pl) { if (LIFT.s > 0) yield* armsTo(0, 0.8); LIFT.plan = pl; }
    if (LIFT.s < 1) { yield* carriageTo(pl.cs, 0.25); yield* armsTo(1, 1.0); }
    if (!LIFT.on) { const T = 0.25 + Math.abs(pl.cc - LIFT.c) * 1.2; SFX.servo(T); yield* carriageTo(pl.cc, T); LIFT.on = true; SFX.clunk(0.35); }   // (the slack taken up: the pads on the sills)
    const h0 = lift, T = 0.5 + Math.abs(h - h0) * 1.25, f = typeof follow === 'function' ? follow(pl, h) : null, dy = f ? f.ty - rig.ty : 0, dp = f ? f.pitch - rig.pitch : 0; SFX.servo(T);
    let e0 = 0;   // (the camera moved by steps: another move at the same time adds to them)
    yield* tween(T, (e) => { const y = lerp(h0, h, e); if (f) { rig.ty += dy * (e - e0); rig.pitch += dp * (e - e0); e0 = e; } else if (follow) rig.ty += y - lift; setLift(y); }, EZ.io);
  }
  function* lowerCar(cv, follow) {
    if (lift > 1e-3) { const h0 = lift, T = 0.4 + h0 * 1.1; SFX.servo(T);
      yield* tween(T, (e) => { const y = lerp(h0, 0, e); if (follow) rig.ty += y - lift; setLift(y); }, EZ.io); setLift(0); SFX.clunk(0.6); if (cv) yield* settle(cv, 0.012); }
    if (LIFT.on) { LIFT.on = false; yield* carriageTo(LIFT.plan ? LIFT.plan.cs : LIFT.c0, 0.3); }
  }
  function* liftDown(cv, follow) { yield* lowerCar(cv, follow); yield* armsTo(0, 1.1); yield* carriageTo(LIFT.c0, 0.25); }

  /* ---------------- the permanent fixtures: always in the garage, parked at rest; the service, the swaps and the paint drive them ----------------
     THE ROBOTS: two big industrial six-axis robots, one either side of the car (robot 0 the near one, +z; robot 1 the far one, behind
     the lift), each on a floor rail along x: a low steel bed on a base plate bolted to the floor (its sides yellow and black), two running
     rails and a rack on it, a cable chain in a trough along its outer side, end stops with rubber buffers. A carriage (navy, a white deck,
     hazard bumpers, a status beacon on its inner front corner: green parked, amber at work) carries the robot: the pedestal, the turret
     (it turns), the shoulder 1.24 m up, a thick upper arm (1.5 m) with its counterbalance, the forearm (1.55 m; the wrist's motors behind
     the elbow), the wrist and its tool flange; white, navy rings, gold caps, cyan lights round the joints, a black cable dress from the
     turret along the arm to the wrist. A pose: { x: the carriage on its rail, tip: where the tool's working end is (the flange's face
     with none; world), dir: the tool's way, up: its across (else the wrist's axis), hint: the turret's way while the wrist is right over
     it }: solved each time it changes (the turret turned to the wrist, two-bone IK in the upright plane through its axis, the elbow
     always up; out of reach the arm stretches toward it (J.miss), folded tighter than DMIN it stops there; the wrist right over the
     turret keeps the turn it had: no flip, never NaN). Each robot one mesh: its rigid parts posed by a matrix each, its cable written
     again as it moves (only then). Parked: folded up over its carriage (the near one at its rail's left end by its tools, out of the home
     view; the far one behind the lift's column, by the drums: the column and the car hide it, the big screen on the back wall stays
     clear), the beacon green. A robot is a piece: parked it dissolves when it comes between the camera and the car, at work never (the
     rails are flat: they never do).
     THE TOOLS: the far robot's on the stand ORODJA (a curved, waist-high open stand round the far-front corner, its seven nests on an arc
     about (2.35, -1.7): camera, wrench (a nutrunner), scanner, polisher, brush, nozzle, gripper), the near robot's on a small straight
     stand past its rail's left end (scanner, wrench, gripper). Each nest a fork open to its robot, its tool hung in it by a collar: the
     robot comes down on it from above (its changer on the coupling: a clunk, the tool is its), lifts it off the fork's pads, slides it
     out of the fork's mouth, then up; back the same way. An arc of light behind each nest and a tab either side of its fork: green in,
     amber out, a bright green blink when one comes back. The tools in their nests one mesh with their stand (they dissolve with it), the
     one a robot holds a mesh of its own (it dissolves with its robot). Both stands bolted to the floor; ORODJA has a plate with its name
     (Lang.tr). Nothing of them nearer the cars' lane than |z| 1.45 ---------------- */
  // (the rails (s: the way in to the car), the carriage's travel on each (its bumpers 2 cm off the end stops' rubber buffers, BUF in from
  // the rail's ends); the robot: the shoulder's height and its offset from the turret's axis, the upper arm, the forearm, the wrist's
  // middle to the flange's face, the tightest fold, the carriage's half length with its bumpers; the parked wrist: its height and how far
  // in from the turret's axis; where each parks (the near one at its rail's left end, by its stand; the far one behind the column))
  const RAILS = [{ z: 2.8, x0: -4.05, x1: 2.6 }, { z: -2.8, x0: -3.55, x1: 2.2 }];   // (the far one's right end clear of ORODJA's plate, far enough right for its arm to pass the lift's column)
  const SHY = 1.24, SHO = 0.2, RL1 = 1.5, RL2 = 1.55, FLG = 0.155, DMIN = 0.5, CHL = 0.628, RWY = 1.6, RWH = 0.74, BUF = 0.17;
  RAILS.forEach(r => { r.s = -Math.sign(r.z); r.c0 = r.x0 + BUF + CHL + 0.02; r.c1 = r.x1 - BUF - CHL - 0.02; });
  const REST_X = [RAILS[0].c0, -0.5];
  const TOOLS = ['camera', 'wrench', 'scanner', 'polisher', 'brush', 'nozzle', 'gripper'], TOOLS_N = ['brush', 'polisher', 'scanner', 'wrench', 'gripper', 'nozzle'];
  // (each tool: its length from the coupling's face to its working end, its radius round its axis (what it sweeps: the scanner's bar, the
  // gripper's body, the brush); the scanner and the gripper look the same turned half round their axis: so do all the round ones)
  const TL = { none: 0, camera: 0.26, wrench: 0.5, scanner: 0.3, polisher: 0.29, brush: 0.455, nozzle: 0.64, gripper: 0.315 };
  const TR = { none: 0.11, camera: 0.075, wrench: 0.058, scanner: 0.245, polisher: 0.175, brush: 0.26, nozzle: 0.05, gripper: 0.125 };
  // (each tool's shape for the plans: [from, to, radius] in its own frame (x its across, y its way from the coupling, z square to both):
  // round along its axis, a scanner's bar and a gripper's body and fingers across, a polisher's pad and a brush a ball)
  const TOOLC = { camera: [[0, 0.02, 0, 0, 0.2, 0, 0.076], [0, 0.2, 0, 0, 0.25, 0, 0.063]], wrench: [[0, 0.02, 0, 0, 0.25, 0, 0.06], [0, 0.25, 0, 0, 0.42, 0, 0.025], [0, 0.43, 0, 0, 0.48, 0, 0.057]],
    scanner: [[0, 0.02, 0, 0, 0.2, 0, 0.056], [-0.24, 0.25, 0, 0.24, 0.25, 0, 0.076]], polisher: [[0, 0.02, 0, 0, 0.16, 0, 0.078], [0, 0.231, 0, 0, 0.231, 0, 0.186]],
    brush: [[0, 0.02, 0, 0, 0.19, 0, 0.07], [0, 0.33, 0, 0, 0.33, 0, 0.296]], nozzle: [[0, 0.02, 0, 0, 0.16, 0, 0.05], [0, 0.16, 0, 0, 0.62, 0, 0.045]],
    gripper: [[0, 0.02, 0, 0, 0.1, 0, 0.066], [-0.11, 0.158, 0, 0.11, 0.158, 0, 0.068], [-0.085, 0.25, 0, 0.085, 0.25, 0, 0.07]] };
  // (the stand ORODJA: its nests on an arc (angles: 0 +x, -pi/2 -z), each a fork open to the arc's middle (SW: its slot's half angle at
  // the mouth, the slot's end 8 cm out past the nest); a tool's collar sits on the fork's pads, its coupling's face at yc; slid out
  // (SLIDE) it clears the plate's front edge (the plate 0.18 m either side of the arc), with a lift (LIFT_D) off the pads first)
  const RK = { cx: 2.35, cz: -1.7, r: 1.4, e0: 0.112, e1: -1.33, S: 1.02, SW: 0.08 / 1.22 }; RK.a = [0, 0.22, 0.44, 0.74, 1.2, 1.54, 1.76].map(s => 0.022 - s / RK.r); RK.yc = RK.S + 0.05;
  const SLIDE = { camera: 0.285, wrench: 0.27, scanner: 0.455, polisher: 0.385, brush: 0.47, nozzle: 0.26, gripper: 0.3 }, LIFT_D = 0.022, NUP = 0.3;   // (NUP: how high over its nest a tool comes and goes)
  // (the near robot's stand past its rail's left end: its nests along z at x NS.x (TOOLS_N's, the brush's room the widest), forks open
  // to +x (to the robot), its plate as high as ORODJA's; e: its ends)
  const NS = { x: -4.66, z: [3.58, 3.095, 2.8, 2.55, 2.3, 2.05], e: [1.85, 3.9], S: 1.02 }; NS.yc = NS.S + 0.05;
  // (the nano chamber: its outline round the car, the lift and the drums (half sizes, the corners' radius; the robots' rails outside it);
  // its header under the ceiling (its lips at y0, its top y1 under the honeycomb's hubs, out o and in i from the outline); its glass bands
  // (n, each BH high, each IN in from the one round it; the outer one fixed in the header (its foot at YS, its top in the slot), the others
  // stored inside it; down each runs out of the one round it by step, the inner one's foot on the floor at k 1, every band over the next by
  // 5 cm: a closed wall from the floor into the header); k 0 stored .. 1 down; col: its lights' colour)
  const CH = { hx: 3.0, hz: 2.35, r: 0.65, y0: 4.12, y1: 4.4, o: 0.045, i: 0.12, n: 5, BH: 0.92, IN: 0.019, YS: 3.46, k: 0, col: hexRgb(0x47c6ff).map(v => v * 2.25), glass: null, frame: null, gv: [], fv: [], led: [], ring: null, bot: [], dirty: true };
  CH.step = CH.YS / (CH.n - 1);
  // (the drying column: its hatch's middle, its half sizes (x its depth, along the lane; z its width, across it), its height;
  // k 0 down .. 1 up; heat: what it is now and what was asked (the coils' glow, the fans' speed); a: the fans' turn, fy: their heights)
  const DRY = { x: 3.45, z: 0, hx: 0.25, hz: 0.55, H: 2.5, k: 0, heat: 0, want: 0, a: 0, fy: [0.83, 1.65], R: null, cv: null, glow: null, dirty: true, gd: true };
  // (the paint drums: one a colour (the game's eight: 0xf5f5f0, 0x1a1a1f, 0x8e3bd6 added here, they stand in two rows, the front one
  // clear of the lift's carriage); a drum's radius, its height, its foot (on the tray's grid), the row from x0 to x1 at z)
  const PAINTS = [0x2fa84f, 0xd81f2a, 0x1c5fd6, 0xf2c230, 0xff7a1a];
  const DRM = { r: 0.19, h: 0.6, y0: 0.108, x0: -2.44, x1: -0.86, z: -1.98, list: [], mesh: null };
  // (the tyre towers: x, z, the tyre (0 Serijske, 1 Športne, 2 Polslick, 3 Slick: the game's levels); right of the car's nose seen from
  // home, clear of the lines to it (a long car's too)); the parts shelf behind the near rail's left part (facing out, away from the rail:
  // the robot takes its parts through its open back), the rim stand and the kit stand side by side before it, nearer the front wall (out
  // of the home view: under its buttons they would be in the way of a tap; low, under the lines from the camera to the car from anywhere
  // round it) (each: its middle, the way its face looks (ry: 0 +z), its width; the shelf's parts in the car's colour: their vertices)
  const TWR = [[3.95, 1.75, 0], [4.65, 1.75, 1], [4.15, 2.45, 2], [4.85, 2.45, 3]];
  const SHF = { x0: -3.02, x1: -1.38, z0: 3.6, z1: 4.1, body: [], col: -1, mesh: null }, RMS = { x: -0.95, z: 4.85, ry: 0.2, w: 1.5 }, KTS = { x: -2.4, z: 4.85, ry: 0.2, w: 0.74 };
  const FXC = { W: [0.9, 0.91, 0.93], NV: [0.1, 0.13, 0.26], DK: [0.13, 0.14, 0.16], ST: [0.6, 0.62, 0.66], CY: [0.62, 1.72, 2.25], YL: [0.92, 0.7, 0.1], CHN: [0.15, 0.16, 0.18], BK: [0.07, 0.07, 0.08] };
  const FX = { rails: null, still: { fades: [] }, plates: [], plateLang: null, plateTxt: '', hide: [], dirty: { live: true }, ZERO: { value: 0 }, mats: {}, obst: [] };
  // (the stations: 0 the near robot's stand, 1 ORODJA; each its nests (tool -> { a: the fork's closed side's way, x, z, yc, st, blink,
  // v: the tool's vertices in the station's nest mesh, led: its lights' }), the carriage's place for them, its nest mesh)
  const STN = [{ key: 'stand', list: TOOLS_N, nests: {}, tools: {}, rx: RAILS[0].c0, live: null, L: null }, { key: 'rack', list: TOOLS, nests: {}, tools: {}, rx: RAILS[1].c1, live: null, L: null }];
  const RB = [0, 1].map(i => ({ i, r: RAILS[i], p: null, tool: 'none', rest: true, held: [], R: null, P: null, st: -1, dirty: true,
    J: { x: 0, hd: new V3(0, 0, RAILS[i].s), ax: new V3(), B: new V3(), S: new V3(), E: new V3(), W: new V3(), Wc: new V3(), tip: new V3(), tipA: new V3(), d: new V3(0, -1, 0), a5: new V3(1, 0, 0), ac: new V3(1, 0, 0), u: new V3(), f: new V3(), miss: 0, missMax: 0 } }));
  const v3 = (a) => a == null ? null : a.isVector3 ? a.clone() : new V3(a[0], a[1], a[2]);
  // a robot's parked pose (at x: its carriage elsewhere on the rail): the upper arm back, the forearm down over the carriage's inner edge,
  // the changer down; the near one's wrist toward the car, the far one's turned toward the home camera (behind the column: the column and
  // the car hide it); one holding a tool waits folded along its rail the way its arm turns now (no swing round where it waits: travelPose,
  // the tool over the rail's line, clear of the column, the drums, the stands). foldPose: so at x, straight toward the car (on its ways:
  // the arm drawn in)
  const REST_D = [[0, -RWH], [0.33, 0.66]];
  function restPose(i, x) { const r = RAILS[i], x0 = x == null ? REST_X[i] : x, [dx, dz] = REST_D[i]; if (RB[i].tool !== 'none') return travelPose(i, x0, RB[i].J.hd.x < 0 ? -1 : 1);
    return { x: x0, tip: new V3(x0 + dx, RWY - FLG, r.z + dz), dir: new V3(0, -1, 0), up: new V3(1, 0, 0) }; }
  function foldPose(i, x) { const r = RAILS[i]; return { x, tip: new V3(x, RWY - FLG - TL[RB[i].tool], r.z + r.s * RWH), dir: new V3(0, -1, 0), up: new V3(1, 0, 0), fold: 'U' }; }
  // (folded along its rail toward sg (riding it, tucked out of the chamber's way): the turret turned along the rail, the arm folded over
  // that end of its carriage, a tool it holds hanging over the rail's line (a scanner's bar, a gripper's body along it))
  function travelPose(i, x, sg) { const r = RAILS[i]; return { x, tip: new V3(x + sg * RWH, RWY - FLG - TL[RB[i].tool], r.z), dir: new V3(0, -1, 0), up: new V3(1, 0, 0), fold: 'T' }; }
  RB.forEach(A => { A.p = restPose(A.i); });

  /* the rigs: rigid parts in one buffer, each built in its own frame into R.g (rigPart: the vertices from here on are part k's), posed by
     a matrix each (R.M[k], R.dirty[k]); rigPose writes only the dirty parts' vertices (moved, their normals turned, their colours darker
     low down as the pieces') and sends only them again (one range; the colours only for a part that is or was low: R.low): the built
     vertices moved, nothing made. rigTail: n vertices kept at the end for what is written as it is (a cable) */
  function rigB(n) { return { g: new World.GB(), runs: [], gl: [], n, M: Array.from({ length: n }, () => new THREE.Matrix4()), dirty: new Uint8Array(n).fill(1), low: new Uint8Array(n) }; }
  const rigPart = (R, k) => R.runs.push([R.g.P.length / 3, k]), rigGl = (R, k) => R.gl.push([R.g.P.length / 3, k]);
  function rigTail(R, n, col) { rigPart(R, -1); R.tail = R.g.P.length / 3; for (let i = 0; i < n; i++) { R.g.P.push(0, 0, 0); R.g.N.push(0, 1, 0); R.g.C.push(col[0], col[1], col[2]); } }
  function rigMesh(R, mat) {
    const N = R.g.P.length / 3, geo = new THREE.BufferGeometry(), gl = new Float32Array(N).fill(1);
    R.gl.forEach(([i, k], j) => gl.fill(k, i, j + 1 < R.gl.length ? R.gl[j + 1][0] : N));
    R.P = new Float32Array(R.g.P); R.N = new Float32Array(R.g.N); R.C = new Float32Array(R.g.C);
    R.runs = R.runs.map(([i, k], j) => [i, j + 1 < R.runs.length ? R.runs[j + 1][0] : N, k]).filter(q => q[1] > q[0]);
    for (const [nm, a] of [['position', R.P], ['normal', R.N], ['color', R.C]]) geo.setAttribute(nm, new THREE.BufferAttribute(a.slice(), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('gloss', new THREE.BufferAttribute(gl, 1)); geo.boundingSphere = new THREE.Sphere(new V3(0, 1.5, 0), 9); R.g = null;
    const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.receiveShadow = true; R.mesh = m; return m;
  }
  // (still: what moved casts no shadow anyone sees (the column's fans inside it): the shadow map left as it is)
  function rigPose(R, still) {
    const G = R.mesh.geometry.attributes, pa = G.position.array, na = G.normal.array, ca = G.color.array, P = R.P, N = R.N, C = R.C; let lo = Infinity, hi = -1, col = false;
    for (const [v0, v1, k] of R.runs) { if (!R.dirty[k]) continue; lo = Math.min(lo, v0); hi = Math.max(hi, v1); const e = R.M[k].elements; let low = 0;
      for (let v = v0 * 3, ve = v1 * 3; v < ve; v += 3) { const x = P[v], y = P[v + 1], z = P[v + 2], nx = N[v], ny = N[v + 1], nz = N[v + 2], wy = e[1] * x + e[5] * y + e[9] * z + e[13];
        pa[v] = e[0] * x + e[4] * y + e[8] * z + e[12]; pa[v + 1] = wy; pa[v + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        const mx = e[0] * nx + e[4] * ny + e[8] * nz, my = e[1] * nx + e[5] * ny + e[9] * nz, mz = e[2] * nx + e[6] * ny + e[10] * nz, l = 1 / (Math.hypot(mx, my, mz) || 1);
        na[v] = mx * l; na[v + 1] = my * l; na[v + 2] = mz * l;
        const s = wy < 0.4 ? (low = 1, 0.5 + 0.5 * smooth(0, 0.4, wy)) : 1; ca[v] = C[v] * s; ca[v + 1] = C[v + 1] * s; ca[v + 2] = C[v + 2] * s; }
      if (low || R.low[k]) col = true; R.low[k] = low; }
    R.dirty.fill(0); if (hi < 0) return false;
    sendRange(G.position, lo, hi); sendRange(G.normal, lo, hi); if (col) sendRange(G.color, lo, hi);
    R.mesh.geometry.boundingBox = null; if (!still) shadowDirty = Math.max(shadowDirty, 1);   // (its box dropped: a ray's test then goes by its sphere)
    return true;
  }
  // (a frustum from a to b, its radius ra to rb, in a part's frame; a ring of an annulus facing up; one facing sg along z at z; a curved
  // slab about (cx, cz): radii r0..r1, angles a0..a1, from y0 up h; a bar along y tapering from section 2a0 x 2b0 (x, z) at y0 to 2a1 x
  // 2b1 at y1, its edges cut off by ch)
  const cone2 = (g, a, b, ra, rb, n, col, open) => { const d = new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
    gAdd(g, new THREE.CylinderGeometry(rb, ra, L, n || 16, 1, !!open), new THREE.Matrix4().compose(new V3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.divideScalar(L)), new V3(1, 1, 1)), col); };
  const annulus = (g, x, y, z, r0, r1, n, col, t0, t1) => { const a0 = t0 == null ? 0 : t0, da = (t1 == null ? TAU : t1 - a0) / n;
    for (let i = 0; i < n; i++) { const a = a0 + i * da, b = a + da, P = (t, rr) => [x + rr * Math.cos(t), y, z + rr * Math.sin(t)]; g.quadO(P(a, r0), P(b, r0), P(b, r1), P(a, r1), col, [x, y - 1, z]); } };
  const discZ = (g, x, y, z, r0, r1, n, col, sg) => { for (let i = 0; i < n; i++) { const a = i / n * TAU, b = (i + 1) / n * TAU, P = (t, rr) => [x + rr * Math.cos(t), y + rr * Math.sin(t), z]; g.quadO(P(a, r0), P(b, r0), P(b, r1), P(a, r1), col, [x, y, z - sg]); } };
  function arcSlab(g, cx, cz, r0, r1, a0, a1, y0, h, col, top) {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) * 16)), y1 = y0 + h, P = (a, rr, y) => [cx + rr * Math.cos(a), y, cz + rr * Math.sin(a)], ins = (a) => P(a, (r0 + r1) / 2, (y0 + y1) / 2);
    for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n, b = a0 + (a1 - a0) * (i + 1) / n, m = ins((a + b) / 2);
      g.quadO(P(a, r0, y1), P(b, r0, y1), P(b, r1, y1), P(a, r1, y1), top || col, m); if (y0 > 0.005) g.quadO(P(a, r0, y0), P(b, r0, y0), P(b, r1, y0), P(a, r1, y0), col, m);
      g.quadO(P(a, r0, y0), P(b, r0, y0), P(b, r0, y1), P(a, r0, y1), col, m); g.quadO(P(a, r1, y0), P(b, r1, y0), P(b, r1, y1), P(a, r1, y1), col, m); }
    for (const [a, s] of [[a0, 1], [a1, -1]]) g.quadO(P(a, r0, y0), P(a, r1, y0), P(a, r1, y1), P(a, r0, y1), col, ins(a + s * Math.sign(a1 - a0) * 0.01));
  }
  function tbar(g, y0, y1, a0, b0, a1, b1, ch, col) {
    const sec = (a, b) => [[a - ch, b], [-a + ch, b], [-a, b - ch], [-a, -b + ch], [-a + ch, -b], [a - ch, -b], [a, -b + ch], [a, b - ch]], s0 = sec(a0, b0), s1 = sec(a1, b1), c = [0, (y0 + y1) / 2, 0];
    for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; g.quadO([s0[i][0], y0, s0[i][1]], [s0[j][0], y0, s0[j][1]], [s1[j][0], y1, s1[j][1]], [s1[i][0], y1, s1[i][1]], col, c); }
    for (let i = 1; i < 7; i++) { g.triO([s0[0][0], y0, s0[0][1]], [s0[i][0], y0, s0[i][1]], [s0[i + 1][0], y0, s0[i + 1][1]], col, [0, y0 + 1, 0]); g.triO([s1[0][0], y1, s1[0][1]], [s1[i][0], y1, s1[i][1]], [s1[i + 1][0], y1, s1[i + 1][1]], col, [0, y1 - 1, 0]); }
  }
  // (a joint's housing along a part's z at (x, y): the white drum, a navy band near each end, a gold cap and a ring of light on each face)
  function drumZ(g, x, y, r, len, n) { const h = len / 2; cone2(g, [x, y, -h], [x, y, h], r, r, n, FXC.W);
    for (const s of [-1, 1]) { cone2(g, [x, y, s * (h - 0.065)], [x, y, s * (h - 0.02)], r * 1.03, r * 1.03, n, FXC.NV, true); cone2(g, [x, y, s * h], [x, y, s * (h + 0.022)], r * 0.46, r * 0.46, 16, PAL.gold);
      discZ(g, x, y, s * (h + 0.002), r * 0.62, r * 0.76, n, FXC.CY, s); } }
  // a hex bolt's head (on a washer) standing on y (the stands' and the rails' anchors)
  const bolt = (g, x, y, z) => { cylA(g, [x, y + 0.002, z], 'y', 0.026, 0.004, 10, [0.5, 0.52, 0.56]); cylA(g, [x, y + 0.011, z], 'y', 0.018, 0.014, 6, FXC.ST); };
  // the fixtures' materials: the room light, the grime, the gloss marks; ZERO: never dissolves
  function fxMat(u, emissive) { const m = new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x5a5a5a, shininess: 50, emissive: emissive || 0 }); hideMat(m, u || FX.ZERO, true); return m; }

  /* the rails (one mesh, both, with the chamber's header and the column's hatch: it never dissolves, nor casts, nor shows in the floor):
     the beds, the troughs, the end stops, the bolts. Each rail's chain is its robot's (it moves with the carriage): its fixed end in the trough at the middle of the
     carriage's travel, its lower run along the trough's floor to the bend (the loop, at half the carriage's speed), its upper run back on
     it to the bracket under the carriage's outer edge */
  const CNP = 0.075, CNR = 0.045;
  RAILS.forEach(r => { r.nl = Math.ceil(((r.c1 - r.c0) / 2 + Math.PI * CNR + 0.04) / CNP); r.f = (r.c0 + r.c1) / 2 + 0.5; r.tz = r.z - r.s * 0.42; });
  function buildRails() {
    const g = new World.GB(), gls = [], gl = (k) => gls.push([g.P.length / 3, k]), { DK, BK, YL } = FXC, RLc = [0.42, 0.45, 0.5], PL = [0.24, 0.25, 0.27];
    for (const r of RAILS) { const { z, x0, x1 } = r, L = x1 - x0, mx = (x0 + x1) / 2, o = -r.s, ins = [mx, 0.04, z];
      gl(1.3); World.box(g, mx, 0, z, L + 0.36, 0.012, 0.62, 0, PL, [0.29, 0.3, 0.32]);   // the base plate (10 cm past the end stops), the bed (black, its sides and its top's edges yellow and black)
      gl(PAINT); World.box(g, mx, 0.012, z, L, 0.068, 0.48, 0, BK, [0.16, 0.17, 0.19]);
      for (const s of [-1, 1]) { hazard(g, [x0, 0.012, z + s * 0.242], [1, 0, 0], [0, 1, 0], L, 0.068, 0.08, ins); hazard(g, [x0, 0.082, z + (s > 0 ? 0.19 : -0.24)], [1, 0, 0], [0, 0, 1], L, 0.05, 0.08, [mx, -1, z + s * 0.215]); }
      gl(METAL); for (const s of [-1, 1]) { World.box(g, mx, 0.08, z + s * 0.16, L - 0.2, 0.03, 0.05, 0, RLc); World.box(g, mx, 0.11, z + s * 0.16, L - 0.2, 0.015, 0.032, 0, [0.62, 0.64, 0.68]); }   // the running rails (a bright head)
      gl(SATIN); World.box(g, mx, 0.08, z, L - 0.2, 0.025, 0.06, 0, [0.2, 0.21, 0.23]); for (let x = x0 + 0.15; x < x1 - 0.1; x += 0.05) World.box(g, x, 0.105, z, 0.018, 0.006, 0.06, 0, [0.3, 0.31, 0.34]);   // the rack, its teeth
      gl(METAL); for (let x = x0 + 0.12; x < x1 - 0.05; x += 0.5) for (const s of [-1, 1]) bolt(g, x, 0.012, z + s * 0.28);   // (the anchors along the plate, two more past each end stop)
      for (const e of [x0 - 0.13, x1 + 0.13]) for (const s of [-1, 1]) bolt(g, e, 0.012, z + s * 0.19);
      // the trough (its floor, its walls, a yellow lip on the outer one)
      gl(SATIN); World.box(g, mx, 0, r.tz, L - 0.1, 0.012, 0.13, 0, DK); for (const s of [-1, 1]) World.box(g, mx, 0.012, r.tz + s * 0.061, L - 0.1, 0.098, 0.008, 0, DK, s === o ? YL : DK);
      gl(METAL); for (let x = x0 + 0.3; x < x1 - 0.1; x += 0.9) bolt(g, x, 0.012, r.tz);
      // the end stops: yellow and black blocks, a rubber buffer facing the carriage (the plate's bolts past them)
      for (const [e, sg] of [[x0, 1], [x1, -1]]) { gl(PAINT); World.box(g, e, 0.012, z, 0.16, 0.23, 0.6, 0, BK);
        hazard(g, [e + sg * 0.082, 0.012, z - 0.3], [0, 0, 1], [0, 1, 0], 0.6, 0.23, 0.08, [e, 0.12, z]); hazard(g, [e - 0.08, 0.244, z - 0.3], [0, 0, 1], [1, 0, 0], 0.6, 0.16, 0.08, [e, 0, z]);
        hazard(g, [e - sg * 0.082, 0.012, z + 0.3], [0, 0, -1], [0, 1, 0], 0.6, 0.23, 0.08, [e, 0.12, z]);
        gl(MATTE); cylA(g, [e + sg * 0.125, 0.235, z], 'x', 0.06, 0.09, 12, [0.08, 0.08, 0.09]); }
      BLOBS.push([mx, z, L + 0.3, 0.9, 0.35, 0, FX.still]);
    }
    buildRing(g, gl); buildHatch(g, gl);   // (the chamber's header and the drying column's hatch: as still, in the same mesh)
    const geo = withGloss(g.geometry(), gls); geo.attributes.color.setUsage(THREE.DynamicDrawUsage);
    const m = FX.rails = new THREE.Mesh(geo, fxMat()); m.receiveShadow = true; scene.add(mainOnly(m));
  }
  // (robot A's chain to its carriage at x: the bracket 0.5 m along from its middle; L1 the lower run's length)
  function chainPose(A, x) {
    const r = A.r, R = A.R, F = r.f, M = x + 0.5, L1 = (r.nl * CNP - Math.PI * CNR + M - F) / 2, y = 0.012;
    for (let j = 0; j < r.nl; j++) { const s = (j + 0.5) * CNP; let px, py, tx, ty, ox, oy;
      if (s < L1) { px = F + s; py = y; tx = 1; ty = 0; ox = 0; oy = 1; }
      else if (s < L1 + Math.PI * CNR) { const f = (s - L1) / CNR, sf = Math.sin(f), cf = Math.cos(f); px = F + L1 + CNR * sf; py = y + CNR - CNR * cf; tx = cf; ty = sf; ox = -sf; oy = cf; }
      else { px = F + L1 - (s - L1 - Math.PI * CNR); py = y + 2 * CNR; tx = -1; ty = 0; ox = 0; oy = -1; }
      R.M[8 + j].set(0, ox, tx, px, 0, oy, ty, py, ox * ty - oy * tx, 0, 0, r.tz, 0, 0, 0, 1); }
  }

  /* a robot: its carriage with the pedestal (part 0), the turret with the shoulder (1), the upper arm with the elbow (2), the forearm (3),
     the wrist (4), the flange (5), the counterbalance's cylinder (6) and its rod (7), its chain's links (8 ..); the cable (written as it is). The carriage's frame
     the world's (at the turret's axis on the floor), the turret's: +x to the work; the arm's links: y along them, z the joints' axis */
  const CAB_N = 30, CAB_M = 6, CBZ = 0.37;
  function buildRobot(i) {
    const A = RB[i], R = A.R = rigB(8 + A.r.nl), g = R.g, { W, NV, DK, ST, CY, YL, BK } = FXC, GD = PAL.gold, s = A.r.s, P = A.P = piece();
    P.robot = A; P.near = 2.4;
    rigPart(R, 0);
    // the carriage: its bearing blocks on the rails, the navy body (a light line along its sides), the white deck, hazard bumpers at its
    // ends (black rubber over them), the chain's bracket under its outer edge, four bolts holding the pedestal down
    rigGl(R, METAL); for (const x of [-0.38, 0.38]) for (const z of [-0.16, 0.16]) World.box(g, x, 0.122, z, 0.15, 0.04, 0.075, 0, [0.35, 0.37, 0.4]);
    rigGl(R, PAINT); World.box(g, 0, 0.15, 0, 1.16, 0.2, 0.84, 0, NV, [0.14, 0.17, 0.3]); for (const z of [-0.421, 0.421]) World.box(g, 0, 0.3, z, 1.0, 0.014, 0.004, 0, CY);
    World.box(g, 0, 0.35, 0, 1.18, 0.035, 0.86, 0, W);
    for (const e of [-1, 1]) { World.box(g, e * 0.6, 0.155, 0, 0.05, 0.17, 0.86, 0, BK); hazard(g, [e * 0.628, 0.155, -e * 0.43], [0, 0, e], [0, 1, 0], 0.86, 0.17, 0.08, [e * 0.6, 0.24, 0]);
      rigGl(R, MATTE); World.box(g, e * 0.6, 0.325, 0, 0.056, 0.02, 0.87, 0, [0.08, 0.08, 0.09]); rigGl(R, PAINT); }
    World.box(g, 0.5, 0.098, -s * 0.42, 0.07, 0.055, 0.09, 0, DK);
    rigGl(R, METAL); for (const x of [-0.42, 0.42]) for (const z of [-0.32, 0.32]) bolt(g, x, 0.385, z);
    // the status beacon on its inner front corner (its light's colour written again as the robot parks or goes to work)
    rigGl(R, PAINT); { const bx = 0.47, bz = s * 0.32; cone2(g, [bx, 0.385, bz], [bx, 0.72, bz], 0.026, 0.026, 8, DK); cone2(g, [bx, 0.72, bz], [bx, 0.75, bz], 0.07, 0.07, 14, DK);
      R.lamp = [R.g.P.length / 3]; cone2(g, [bx, 0.75, bz], [bx, 0.92, bz], 0.085, 0.085, 14, [1, 1, 1]); R.lamp.push(R.g.P.length / 3); cone2(g, [bx, 0.92, bz], [bx, 0.95, bz], 0.092, 0.092, 14, DK); }
    // the pedestal: a navy foot, a gold ring, a white drum, a ring of light under the turret
    cone2(g, [0, 0.385, 0], [0, 0.48, 0], 0.47, 0.45, 30, NV); rigGl(R, METAL); cone2(g, [0, 0.48, 0], [0, 0.51, 0], 0.455, 0.455, 30, GD); rigGl(R, PAINT);
    cone2(g, [0, 0.51, 0], [0, 0.71, 0], 0.41, 0.37, 30, W); cone2(g, [0, 0.7, 0], [0, 0.722, 0], 0.376, 0.376, 30, CY, true);
    // its chain's links (right after the carriage: what moves only as it rides, then the arm, sent again as it moves)
    rigGl(R, MATTE); for (let j = 0; j < A.r.nl; j++) { rigPart(R, 8 + j); World.box(g, 0, 0, 0, 0.082, 0.045, CNP - 0.006, 0, FXC.CHN, [0.24, 0.25, 0.28]); }
    // the turret: its white drum and a navy band, the shoulder's housing on it (its edges cut off), the shoulder's drum across; the
    // counterbalance's bracket on its back
    rigGl(R, PAINT); rigPart(R, 1); cone2(g, [0, 0.722, 0], [0, 1.0, 0], 0.37, 0.35, 30, W); cone2(g, [0, 0.9, 0], [0, 0.96, 0], 0.372, 0.36, 30, NV, true);
    prism(g, 0.08, 0, 0.31, 0.3, 0.07, 0.96, 1.26, W, [0.94, 0.95, 0.96]); prism(g, 0.08, 0, 0.315, 0.305, 0.07, 0.96, 1.01, NV);
    drumZ(g, SHO, SHY, 0.26, 0.74, 30);
    obox(g, [-0.15, 1.02, CBZ], [-0.42, 1.0, CBZ], 0.11, 0.16, NV); cylA(g, [-0.38, 1.0, CBZ], 'z', 0.055, 0.2, 12, DK);
    // the upper arm: a thick white bar (its edges cut off), a navy band, gold lines on its sides, the counterbalance's lug; the elbow's drum
    rigPart(R, 2); tbar(g, 0.1, RL1 - 0.05, 0.19, 0.15, 0.15, 0.13, 0.045, W); tbar(g, 0.74, 0.92, 0.198, 0.158, 0.192, 0.155, 0.045, NV);
    rigGl(R, METAL); for (const z of [-0.152, 0.152]) World.box(g, -0.12, 0.98, z * 0.96, 0.04, 0.32, 0.006, 0, GD); rigGl(R, PAINT);
    obox(g, [0.0, 0.6, -CBZ], [0.0, 0.8, -CBZ], 0.14, 0.12, NV); obox(g, [0, 0.7, -0.14], [0, 0.7, -CBZ], 0.1, 0.1, NV);
    obox(g, [0.1, RL1 * 0.5, 0.12], [0.1, RL1 * 0.5, 0.25], 0.1, 0.05, NV);   // (the cable's clamp)
    drumZ(g, 0, RL1, 0.21, 0.54, 26);
    // the forearm: the wrist's motors behind the elbow (a navy cap), a tapering white tube, a navy band, a ring of light
    rigPart(R, 3); tbar(g, -0.5, -0.02, 0.15, 0.15, 0.15, 0.15, 0.04, W); tbar(g, -0.54, -0.44, 0.155, 0.155, 0.155, 0.155, 0.04, NV);
    cone2(g, [0, 0, 0], [0, RL2 - 0.06, 0], 0.15, 0.107, 22, W); cone2(g, [0, RL2 * 0.55, 0], [0, RL2 * 0.62, 0], 0.136, 0.132, 22, NV, true); cone2(g, [0, RL2 * 0.3, 0], [0, RL2 * 0.3 + 0.025, 0], 0.146, 0.145, 22, CY, true);
    obox(g, [0.06, RL2 * 0.5, 0.1], [0.12, RL2 * 0.5, 0.215], 0.09, 0.045, NV);   // (the cable's clamp)
    // the wrist (a white ball, its drum across), the flange (navy, a gold plate, the changer's steel face)
    rigPart(R, 4); gAdd(g, new THREE.SphereGeometry(0.12, 14, 9), null, W); drumZ(g, 0, 0, 0.125, 0.27, 20);
    rigPart(R, 5); cone2(g, [0, 0.04, 0], [0, 0.13, 0], 0.088, 0.088, 18, NV); rigGl(R, METAL); cone2(g, [0, 0.13, 0], [0, 0.152, 0], 0.11, 0.11, 22, GD); cone2(g, [0, 0.15, 0], [0, FLG, 0], 0.062, 0.062, 16, ST);
    rigGl(R, PAINT); World.box(g, 0.075, 0.07, 0, 0.03, 0.05, 0.03, 0, CY);
    // the counterbalance: a navy cylinder from its pin on the turret, a gold ring, the steel rod out of it to the lug
    rigPart(R, 6); cone2(g, [0, -0.12, 0], [0, 0.6, 0], 0.07, 0.07, 14, NV); cone2(g, [0, 0.42, 0], [0, 0.46, 0], 0.074, 0.074, 14, GD, true);
    rigPart(R, 7); rigGl(R, METAL); cone2(g, [0, 0, 0], [0, 0.74, 0], 0.034, 0.034, 10, ST);
    rigGl(R, SATIN); rigTail(R, CAB_N * CAB_M * 6, [0.07, 0.07, 0.08]);
    const mat = new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x5a5a5a, shininess: 50, emissive: 0x15181d }); mat.userData.gl = true;
    const m = rigMesh(R, mat); m.castShadow = true; m.frustumCulled = true; P.root.add(m); FX.hide.push(P.root);   // (its sphere set as it is posed)
  }
  // (the scratch of the solves: no garbage while a robot moves)
  const _up = new V3(0, 1, 0), _ya = new V3(), _za = new V3(), _xa = new V3(), _m4 = new THREE.Matrix4(), _t3 = new V3(), _t4 = new V3();
  const basisAt = (M, o, y, z) => { _xa.crossVectors(y, z).normalize(); _za.crossVectors(_xa, y); M.makeBasis(_xa, y, _za).setPosition(o); };
  // robot i's pose to its joints (J): the wrist's middle back from the tip along the tool's way, the turret turned to it, the shoulder
  // SHO out from its axis that way, the elbow on the upper side of the line from the shoulder to the wrist (J.Wc: where the arm gets the
  // wrist; out of reach short of it), the wrist's drum square to the forearm and to the tool (as the two line up it keeps the way it
  // had, turning to the new one only as they part again: never a jump), the flange's across the pose's up
  function solveRobot(i) {
    const A = RB[i], p = A.p, J = A.J, r = A.r, x = clamp(p.x, r.c0, r.c1);
    J.x = x; J.B.set(x, 0, r.z); J.d.copy(p.dir); if (J.d.lengthSq() < 1e-8) J.d.set(0, -1, 0); J.d.normalize(); J.tip.copy(p.tip);
    J.W.copy(J.tip).addScaledVector(J.d, -(TL[A.tool] + FLG));
    const hx = J.W.x - x, hz = J.W.z - r.z, hl = Math.hypot(hx, hz);
    if (hl > 0.12) J.hd.set(hx / hl, 0, hz / hl); else if (p.hint) { const q = v3(p.hint), l = Math.hypot(q.x, q.z); if (l > 1e-3) J.hd.set(q.x / l, 0, q.z / l); }
    J.ax.set(J.hd.z, 0, -J.hd.x); J.S.set(x + J.hd.x * SHO, SHY, r.z + J.hd.z * SHO);
    const h = (J.W.x - J.S.x) * J.hd.x + (J.W.z - J.S.z) * J.hd.z, v = J.W.y - SHY, D0 = Math.hypot(h, v), D = clamp(D0, DMIN, RL1 + RL2 - 1e-3);
    J.miss = Math.max(0, D0 - RL1 - RL2, DMIN - D0); J.missMax = Math.max(J.missMax, J.miss);
    const eh = D0 > 1e-5 ? h / D0 : 0, ev = D0 > 1e-5 ? v / D0 : 1, a1 = (RL1 * RL1 - RL2 * RL2 + D * D) / (2 * D), k = Math.sqrt(Math.max(0, RL1 * RL1 - a1 * a1)), eH = eh * a1 - ev * k, eV = ev * a1 + eh * k;
    J.E.set(J.S.x + J.hd.x * eH, SHY + eV, J.S.z + J.hd.z * eH); J.Wc.set(J.S.x + J.hd.x * eh * D, SHY + ev * D, J.S.z + J.hd.z * eh * D);
    J.u.subVectors(J.E, J.S).divideScalar(RL1); J.f.subVectors(J.Wc, J.E).divideScalar(RL2);
    _t3.crossVectors(J.f, J.d); const sn = _t3.length(); J.a5.addScaledVector(J.d, -J.a5.dot(J.d)); if (J.a5.lengthSq() < 1e-4) J.a5.copy(J.ax).addScaledVector(J.d, -J.ax.dot(J.d)); if (J.a5.lengthSq() < 1e-6) J.a5.set(-J.d.z, 0, J.d.x); if (J.a5.lengthSq() < 1e-6) J.a5.set(1, 0, 0); J.a5.normalize();
    if (sn > 1e-4) { _t3.divideScalar(sn); if (_t3.dot(J.a5) < 0) _t3.negate(); J.a5.lerp(_t3, smooth(0.1, 0.3, sn)).normalize(); }
    const up = p.up || J.a5; J.ac.copy(up).addScaledVector(J.d, -up.dot(J.d)); if (J.ac.lengthSq() < 1e-6) J.ac.copy(J.a5); J.ac.normalize();
    J.tipA.copy(J.Wc).addScaledVector(J.d, FLG + TL[A.tool]);
  }
  // the pose to the parts' matrices, the cable, what the robot holds (its tool, a part), the piece's box (where it is now), the beacon
  const _cb0 = new V3(), _cb1 = new V3(), _cbd = new V3(), _fl = new THREE.Matrix4();
  function poseRobot(i) {
    const A = RB[i], R = A.R, J = A.J, M = R.M; solveRobot(i);
    if (J.x !== A.px) { A.px = J.x; M[0].makeTranslation(J.x, 0, A.r.z); chainPose(A, J.x); R.dirty[0] = 1; R.dirty.fill(1, 8); }   // (the carriage and its chain: only when it rides)
    M[1].makeRotationY(Math.atan2(-J.hd.z, J.hd.x)).setPosition(J.x, 0, A.r.z);
    basisAt(M[2], J.S, J.u, J.ax); basisAt(M[3], J.E, J.f, J.ax); basisAt(M[4], J.Wc, J.d, J.a5);
    _za.crossVectors(J.ac, J.d); M[5].makeBasis(J.ac, J.d, _za).setPosition(J.Wc);
    _cb0.copy(J.B).addScaledVector(J.hd, -0.38).addScaledVector(J.ax, -CBZ).setY(1.0); _cb1.copy(J.S).addScaledVector(J.u, 0.7).addScaledVector(J.ax, -CBZ);
    _cbd.subVectors(_cb1, _cb0).normalize(); basisAt(M[6], _cb0, _cbd, J.ax); _cbd.negate(); basisAt(M[7], _cb1, _cbd, J.ax);
    R.dirty.fill(1, 1, 8); rigPose(R); cableRobot(A);
    _fl.copy(M[5]).multiply(_m4.makeTranslation(0, FLG, 0));
    if (A.tool !== 'none') { const T = STN[i].tools[A.tool]; T.mesh.matrix.copy(_fl); T.mesh.matrixWorldNeedsUpdate = true; }
    if (A.held.length) { _fl.multiply(_m4.makeTranslation(0, TL[A.tool], 0)); for (const o of A.held) { o.matrix.copy(_fl).multiply(o.userData.grip); o.matrixWorldNeedsUpdate = true; } }
    // (its boxes, for what it hides (robotBoxes); the piece's box all of them; its sphere for the frustum (the main pass, the floor's, the
    // shadow's: drawn only when in sight) them and its chain's run along the trough)
    const X = robotBoxes(A, A.boxes || (A.boxes = Array.from({ length: 5 }, () => new THREE.Box3())));
    const b = A.P.box.makeEmpty(); for (const q of X) b.union(q); (A.P.boxH || (A.P.boxH = new THREE.Box3())).copy(b).expandByScalar(0.06);
    _rbs.copy(b).expandByPoint(_t3.set(A.r.f, 0, A.r.tz)).expandByScalar(0.35).getBoundingSphere(R.mesh.geometry.boundingSphere);
    beacon(A);
  }
  // (a robot's boxes as it stands (its J solved): the carriage, the turret with the shoulder, the upper arm, the forearm with its motors,
  // the wrist with the tool (and a ball round what it holds))
  const _rb1 = new V3(), _rbs = new THREE.Box3(), _rbm = new THREE.Matrix4();
  function robotBoxes(A, X) { const J = A.J, seg = (b, p, q, e) => b.makeEmpty().expandByPoint(p).expandByPoint(q).expandByScalar(e);
    X[0].min.set(J.x - CHL, 0, A.r.z - 0.45); X[0].max.set(J.x + CHL, 0.4, A.r.z + 0.45); X[1].min.set(J.x - 0.48, 0.4, A.r.z - 0.48); X[1].max.set(J.x + 0.48, 1.3, A.r.z + 0.48); X[1].expandByPoint(_rb1.copy(J.S).addScalar(0.42)).expandByPoint(_rb1.copy(J.S).addScalar(-0.42));
    seg(X[2], J.S, J.E, 0.24); seg(X[3], _rb1.copy(J.E).addScaledVector(J.f, -0.55), J.Wc, 0.2); seg(X[4], J.Wc, J.tipA, Math.max(0.16, TR[A.tool] + 0.02));
    if (A.held.length) { flangeOf(A, _rbm); for (const o of A.held) { _rb1.copy(o.userData.hc).applyMatrix4(_rbm); X[4].expandByPoint(_rb1.clone().addScalar(o.userData.hr)).expandByPoint(_rb1.addScalar(-o.userData.hr)); } }
    return X; }
  // (the beacon's light: green parked, amber at work; only its vertices' colours sent again)
  const BEACON = [[0.5, 2.6, 0.9], [2.6, 1.15, 0.15]];
  function beacon(A) { const st = A.rest ? 0 : 1; if (st === A.st) return; A.st = st; const R = A.R, C = R.mesh.geometry.attributes.color, c = BEACON[st];
    for (let v = R.lamp[0]; v < R.lamp[1]; v++) { R.C.set(c, v * 3); C.array.set(c, v * 3); } sendRange(C, R.lamp[0], R.lamp[1]); }
  // the cable dress: from the turret's back over the end of the shoulder's drum, along the upper arm's side (a clamp at its middle), round
  // the end of the elbow's drum, along the forearm's side (a clamp) to behind the wrist; each on its link's side as built (the parts' own
  // x: the clamps' side). dressAt: its points; cableRobot: a tube through them written into the robot's tail (its rings carried along it,
  // no twist)
  const _dpu = new V3(), _dpf = new V3();
  function dressAt(A, c) { const J = A.J, pu = _dpu.crossVectors(J.u, J.ax).normalize(), pf = _dpf.crossVectors(J.f, J.ax).normalize();
    c[0].copy(J.B).addScaledVector(J.hd, -0.33).addScaledVector(J.ax, 0.1).setY(1.02); c[1].copy(J.B).addScaledVector(J.hd, -0.16).addScaledVector(J.ax, 0.3).setY(1.3);
    c[2].copy(J.S).addScaledVector(J.ax, 0.3).addScaledVector(pu, 0.28); c[3].copy(J.S).addScaledVector(J.u, RL1 * 0.5).addScaledVector(J.ax, 0.2).addScaledVector(pu, 0.1);
    c[4].copy(J.E).addScaledVector(J.ax, 0.33).addScaledVector(pf, 0.18); c[5].copy(J.E).addScaledVector(J.f, RL2 * 0.5).addScaledVector(J.ax, 0.17).addScaledVector(pf, 0.1);
    c[6].copy(J.Wc).addScaledVector(J.f, -0.22).addScaledVector(J.ax, 0.15).addScaledVector(pf, 0.06); }
  const _cab = Array.from({ length: 7 }, () => new V3()), _hc = new THREE.CatmullRomCurve3(_cab, false, 'centripetal'), _ht = new V3(), _hn = new V3(), _hb = new V3(), _hp = new V3(), _rp = new Float32Array((CAB_N + 1) * CAB_M * 3), _rn = new Float32Array((CAB_N + 1) * CAB_M * 3);
  function cableRobot(A) {
    const J = A.J, R = A.R, c = _cab, k = 0.042; dressAt(A, c);
    _hc.updateArcLengths(); _hn.copy(J.ax);
    for (let i = 0; i <= CAB_N; i++) { const t = i / CAB_N; _hc.getPointAt(t, _hp); _hc.getTangentAt(t, _ht);
      _hb.crossVectors(_ht, _hn); if (_hb.lengthSq() < 1e-6) _hb.crossVectors(_ht, _up); _hb.normalize(); _hn.crossVectors(_hb, _ht).normalize();
      for (let j = 0; j < CAB_M; j++) { const a = j / CAB_M * TAU, cs = Math.cos(a), sn = Math.sin(a), o = (i * CAB_M + j) * 3, nx = _hn.x * cs + _hb.x * sn, ny = _hn.y * cs + _hb.y * sn, nz = _hn.z * cs + _hb.z * sn;
        _rp[o] = _hp.x + nx * k; _rp[o + 1] = _hp.y + ny * k; _rp[o + 2] = _hp.z + nz * k; _rn[o] = nx; _rn[o + 1] = ny; _rn[o + 2] = nz; } }
    const G = R.mesh.geometry.attributes, pa = G.position.array, na = G.normal.array; let v = R.tail * 3;
    for (let i = 0; i < CAB_N; i++) for (let j = 0; j < CAB_M; j++) { const a = (i * CAB_M + j) * 3, b = (i * CAB_M + (j + 1) % CAB_M) * 3, cc = a + CAB_M * 3, d = b + CAB_M * 3;
      for (const q of [a, b, cc, b, d, cc]) { pa[v] = _rp[q]; pa[v + 1] = _rp[q + 1]; pa[v + 2] = _rp[q + 2]; na[v] = _rn[q]; na[v + 1] = _rn[q + 1]; na[v + 2] = _rn[q + 2]; v += 3; } }
    sendRange(G.position, R.tail, pa.length / 3); sendRange(G.normal, R.tail, pa.length / 3);
  }

  // the tools: each built along +y (its working way) from its coupling plate at the origin, a collar under it; a scanner's bar and a
  // gripper's body along x (in its nest: out from the stand; under the collar no wider than the fork's mouth, 8 cm, but the heads that
  // hang under the plate)
  function toolGeo(k) {
    const g = new World.GB(), gl = [], mark = (q) => gl.push([g.P.length / 3, q]), { W, NV, DK, ST, CY } = FXC, CH = [0.72, 0.74, 0.78], RD = [0.72, 0.1, 0.08], BK = [0.07, 0.07, 0.08];
    const c = (y0, y1, r0, r1, col, n, open) => cone2(g, [0, y0, 0], [0, y1, 0], r0, r1, n || 16, col, open);
    mark(METAL); c(0, 0.03, 0.058, 0.058, ST, 18); mark(PAINT); c(0.03, 0.042, 0.11, 0.11, NV, 24);   // (the coupling; the collar it sits on in its nest)
    if (k === 'nozzle') { c(0.03, 0.12, 0.046, 0.046, W, 14); c(0.068, 0.093, 0.049, 0.049, NV, 14); c(0.12, 0.16, 0.034, 0.034, RD, 12); mark(METAL); c(0.15, 0.56, 0.022, 0.022, CH, 8); mark(PAINT); c(0.34, 0.375, 0.03, 0.03, W, 12); c(0.55, 0.61, 0.042, 0.042, RD, 14); c(0.61, 0.64, 0.036, 0.022, RD, 10); }
    else if (k === 'brush') { c(0.03, 0.15, 0.065, 0.065, W, 16); c(0.085, 0.115, 0.068, 0.068, NV, 16); c(0.15, 0.19, 0.035, 0.035, DK, 10); c(0.19, 0.215, 0.16, 0.16, NV, 28);
      mark(MATTE); gAdd(g, new THREE.CylinderGeometry(0.26, 0.235, 0.24, 40, 2), M4(0, 0.335, 0), (q, nr) => { if (nr[1] > 0.5) return [0.55, 0.78, 0.98]; if (nr[1] < -0.5) return [0.1, 0.22, 0.46];
        const t = ((Math.atan2(q[2], q[0]) / TAU + 1) * 20) % 1, lo = q[1] > 0.04 ? 1.18 : 1; return t < 0.5 ? [0.05 * lo, 0.19 * lo, 0.45 * lo] : t < 0.72 ? [0.18 * lo, 0.52 * lo, 0.9 * lo] : [0.38 * lo, 0.7 * lo, 1.0]; }); }
    else if (k === 'polisher') { c(0.025, 0.155, 0.072, 0.072, W, 18); c(0.085, 0.115, 0.075, 0.075, NV, 18); c(0.172, 0.197, 0.15, 0.15, DK, 24); mark(MATTE); c(0.195, 0.29, 0.175, 0.175, [1.0, 0.76, 0.1], 28); }
    else if (k === 'scanner') { c(0.03, 0.13, 0.05, 0.05, W, 14); c(0.075, 0.1, 0.053, 0.053, NV, 14); c(0.13, 0.205, 0.028, 0.028, DK, 10);
      World.box(g, 0, 0.205, 0, 0.48, 0.09, 0.12, 0, BK); World.box(g, 0, 0.203, 0, 0.485, 0.022, 0.125, 0, NV); World.box(g, 0, 0.295, 0, 0.44, 0.012, 0.04, 0, CY);
      for (const s of [-1, 1]) World.box(g, 0, 0.25, s * 0.061, 0.44, 0.022, 0.006, 0, CY); }
    else if (k === 'wrench') { c(0.03, 0.07, 0.056, 0.056, PAL.gold, 16); c(0.07, 0.24, 0.058, 0.058, NV, 16); c(0.23, 0.27, 0.046, 0.046, DK, 14); mark(METAL); c(0.27, 0.42, 0.02, 0.02, CH, 8); c(0.41, 0.5, 0.052, 0.056, CH, 14); }
    else if (k === 'camera') { c(0.04, 0.195, 0.072, 0.072, DK, 14); c(0.06, 0.09, 0.075, 0.075, NV, 14); c(0.195, 0.24, 0.05, 0.05, DK, 16);
      c(0.228, 0.242, 0.062, 0.062, [1.3, 1.9, 2.3], 20, true); c(0.24, 0.26, 0.03, 0.03, [1.5, 2.1, 2.5], 12); }
    else if (k === 'gripper') { c(0.03, 0.12, 0.062, 0.062, W, 16); c(0.07, 0.095, 0.065, 0.065, NV, 16);   // (a parallel gripper: its body across, two steel fingers with rubber pads)
      World.box(g, 0, 0.12, 0, 0.22, 0.075, 0.11, 0, DK); World.box(g, 0, 0.15, 0.0555, 0.16, 0.012, 0.004, 0, CY);
      mark(METAL); for (const s of [-1, 1]) { World.box(g, s * 0.07, 0.185, 0, 0.026, 0.13, 0.075, 0, ST); mark(MATTE); World.box(g, s * 0.055, 0.22, 0, 0.006, 0.085, 0.06, 0, BK); mark(METAL); } }
    const geo = g.geometry(), n = geo.attributes.position.count, ga = new Float32Array(n).fill(1); gl.forEach(([j, q], m) => ga.fill(q, j, m + 1 < gl.length ? gl[m + 1][0] : n));
    geo.setAttribute('gloss', new THREE.BufferAttribute(ga, 1)); return geo;
  }
  // (a nest's lights into a station's lights: an arc behind its collar, a tab either side of its fork's mouth (at mouth(e): the tab's
  // two ends, e the side))
  function nestLights(S, k, mouth) { const N = S.nests[k], L = S.L, v0 = L.P.length / 3; annulus(L, N.x, N.y + 0.009, N.z, 0.12, 0.135, 12, [1, 1, 1], N.a - 0.7, N.a + 0.7);
    for (const e of [-1, 1]) { const [p, q] = mouth(e); obox(L, p, q, 0.012, 0.03, [1, 1, 1]); } N.led = [v0, L.P.length / 3]; }

  // the stand ORODJA (a piece: it steps aside when it is in the way; the tools in its nests with it), its lights (in its nest mesh:
  // their colours written again when a nest's state changes), its plate; its feet and its mat bolted to the floor
  const rkAt = (dr, a, y) => [RK.cx + (RK.r + dr) * Math.cos(a), y, RK.cz + (RK.r + dr) * Math.sin(a)];
  function buildRack() {
    const P = FREE.rack = STN[1].P = piece(), g = P.g, { r, e0, e1, S } = RK, { W, NV, CY, YL } = FXC, gl = (k) => gloss(P, k), BK = [0.05, 0.05, 0.06], ST1 = STN[1];
    const slab = (q0, q1, y0, h, col, a0, a1) => arcSlab(g, RK.cx, RK.cz, r + q0, r + q1, a0 == null ? e0 : a0, a1 == null ? e1 : a1, y0, h, col);
    P.near = 2.4; P.bolts = 0;
    // (what the robots keep clear of: the stand along its arc, a box a quarter of it)
    P.obst = [0, 1, 2, 3].map(j => { const b = new THREE.Box3(); for (let t = 0; t <= 4; t++) for (const dr of [-0.42, 0.42]) { const p = rkAt(dr, lerp(e0, e1, (j + t / 4) / 4), 0); b.expandByPoint(new V3(p[0], 0, p[2])); } b.max.y = S + 0.09; return b; });
    gl(MATTE); slab(-0.38, 0.38, 0, 0.007, [0.16, 0.17, 0.19], e0 + 0.02, e1 - 0.02); gl(PAINT); slab(-0.42, -0.38, 0, 0.007, YL, e0 + 0.02, e1 - 0.02); slab(0.38, 0.42, 0, 0.007, YL, e0 + 0.02, e1 - 0.02);
    for (const a of [e0, e1, (e0 + e1) / 2]) { const mid = a !== e0 && a !== e1;   // (the end frames: a navy foot, a white post at the back, a brace; a post in the middle on a foot plate; each foot bolted down)
      if (!mid) { obox(g, rkAt(-0.29, a, 0.02), rkAt(0.33, a, 0.02), 0.1, 0.04, NV); obox(g, rkAt(-0.22, a, 0.05), rkAt(0.2, a, S - 0.32), 0.035, 0.035, W); }
      else obox(g, rkAt(0.17, a, 0.012), rkAt(0.37, a, 0.012), 0.16, 0.024, NV);
      obox(g, rkAt(0.27, a, 0.01), rkAt(0.27, a, S - 0.02), 0.055, 0.055, W);
      gl(METAL); for (const dr of mid ? [0.2, 0.34] : [-0.25, 0.3]) { bolt(g, ...((q) => [q[0], mid ? 0.024 : 0.04, q[2]])(rkAt(dr, a, 0))); P.bolts++; } gl(PAINT); }
    gl(METAL); for (let a = e0 - 0.124; a > e1 + 0.05; a -= 0.24) for (const dr of [-0.34, 0.36]) { bolt(g, ...rkAt(dr, a, 0.007)); P.bolts++; } gl(PAINT);   // (the mat's anchors along its edges)
    slab(0.285, 0.298, 0.17, S - 0.24, NV); slab(0.298, 0.308, 0.15, S - 0.2, W); slab(0.307, 0.311, 0.62, 0.05, NV); slab(0.307, 0.311, 0.7, 0.012, CY); slab(0.28, 0.286, S - 0.11, 0.012, CY);   // the back panel (navy; outside a white skin, a navy band, a light line)
    gl(SATIN); slab(-0.27, 0.32, 0.12, 0.025, FXC.DK); gl(PAINT); slab(-0.29, -0.265, 0.12, 0.05, YL);   // the drip tray and its lip
    // the nests' plate: whole behind the forks, before them cut by their slots (open to the arc's middle), its light strip along its
    // front edge between them; the low lip behind the nests
    const cuts = [e0, ...RK.a.flatMap(a => [a + RK.SW, a - RK.SW]), e1];
    slab(0.08, 0.18, S - 0.045, 0.045, NV); for (let j = 0; j < cuts.length; j += 2) { slab(-0.18, 0.08, S - 0.045, 0.045, NV, cuts[j], cuts[j + 1]); slab(-0.186, -0.18, S - 0.03, 0.016, CY, cuts[j], cuts[j + 1]); }
    slab(0.15, 0.18, S, 0.06, W); slab(0.14, 0.19, S + 0.06, 0.022, NV);
    // (the plate's board on the near end frame: a navy board, the plate on it facing out of the stand's end)
    { const t0 = [-Math.sin(e0), 0, Math.cos(e0)], a = rkAt(-0.21, e0, 0.575), b = rkAt(0.27, e0, 0.575); obox(g, [a[0] + t0[0] * 0.025, 0.575, a[2] + t0[2] * 0.025], [b[0] + t0[0] * 0.025, 0.575, b[2] + t0[2] * 0.025], 0.012, 0.75, NV); }
    // the nests: a fork's rubber pads along its slot's sides and across its end (the tool's collar sits on them)
    gl(MATTE); ST1.L = new World.GB(); TOOLS.forEach((k, j) => { const a = RK.a[j], [x, , z] = rkAt(0, a, 0), w = RK.SW + 0.012;
      for (const e of [-1, 1]) obox(g, rkAt(-0.17, a + e * w, S + 0.004), rkAt(0.083, a + e * w, S + 0.004), 0.024, 0.008, BK);
      obox(g, rkAt(0.095, a - w - 0.008, S + 0.004), rkAt(0.095, a + w + 0.008, S + 0.004), 0.025, 0.008, BK);
      ST1.nests[k] = { k, j, a, x, y: S, z, yc: RK.yc, st: 'in', blink: 0, v: null, led: null };
      nestLights(ST1, k, (e) => [rkAt(-0.192, a + e * (RK.SW + 0.005), S - 0.022), rkAt(-0.192, a + e * (RK.SW + 0.021), S - 0.022)]); });
    BLOBS.push([...(([x, , z]) => [x, z])(rkAt(0, (e0 + e1) / 2, 0)), 1.9, 1.4, 0.45, -(e0 + e1) / 2 + Math.PI / 2, P]);
    // the plate: its name in the page's language
    { const p = rkAt(0.03, e0, 0.66); addPlate(P, 0, p[0] - Math.sin(e0) * 0.0335, 0.66, p[2] + Math.cos(e0) * 0.0335, -e0, 0.4); }
  }
  // the near robot's stand past its rail's left end (a piece, as ORODJA): a steel base plate bolted down (its edge to the robot yellow and
  // black), a foot either end with a white post and a brace, a post on a foot in the middle, a navy back panel (a white skin, a light
  // line), the nests' plate on them, its six forks open to the robot (+x), the drip tray, the low lip behind the nests. Built in its own
  // frame (its forks open to -x, its middle at the origin), turned half round into place (M; its nests and their lights with it)
  function buildStand() {
    const P = FREE.stand = STN[0].P = piece(), g = P.g, { W, NV, CY, YL, DK } = FXC, gl = (k) => gloss(P, k), BK = [0.05, 0.05, 0.06], ST0 = STN[0], X = 0, S = NS.S, zm = 0, box = (...a) => fbox(g, ...a);
    const zc = (NS.e[0] + NS.e[1]) / 2, z0 = zc - NS.e[1], z1 = zc - NS.e[0], M = M4(NS.x, 0, zc, 0, Math.PI, 0), lz = NS.z.map(z => zc - z), zs = (lz[2] + lz[3]) / 2;
    P.near = 2.4; P.bolts = 0;
    gl(1.3); box(X + 0.03, 0, zm, 0.66, 0.012, z1 - z0 + 0.12, [0.24, 0.25, 0.27], [0.29, 0.3, 0.32]); gl(PAINT); box(X - 0.275, 0.012, zm, 0.05, 0.0015, z1 - z0 + 0.12, BK);
    hazard(g, [X - 0.3, 0.0145, z0 - 0.06], [0, 0, 1], [1, 0, 0], z1 - z0 + 0.12, 0.05, 0.07, [X, -1, zm]);
    gl(METAL); for (const z of [z0 - 0.02, (z0 + zs) / 2, zs, (zs + z1) / 2, z1 + 0.02]) for (const dx of [-0.2, 0.3]) { bolt(g, X + dx, 0.012, z); P.bolts++; }
    gl(PAINT); for (const z of [z0 + 0.01, z1 - 0.01]) { box(X + 0.02, 0.012, z, 0.56, 0.04, 0.08, NV); obox(g, [X - 0.2, 0.05, z], [X + 0.22, S - 0.3, z], 0.035, 0.035, W); box(X + 0.27, 0.012, z, 0.055, S - 0.03, 0.055, W); }
    box(X + 0.22, 0.012, zs, 0.16, 0.024, 0.16, NV); box(X + 0.27, 0.036, zs, 0.055, S - 0.054, 0.055, W);   // (the middle post on its foot)
    box(X + 0.29, 0.17, zm, 0.013, S - 0.24, z1 - z0, NV); box(X + 0.3, 0.15, zm, 0.01, S - 0.2, z1 - z0 + 0.02, W, W); box(X + 0.306, 0.62, zm, 0.004, 0.05, z1 - z0 + 0.024, NV); box(X + 0.306, 0.7, zm, 0.004, 0.012, z1 - z0 + 0.024, CY);
    gl(SATIN); box(X + 0.02, 0.12, zm, 0.56, 0.025, z1 - z0 - 0.04, DK); gl(PAINT); box(X - 0.265, 0.12, zm, 0.025, 0.05, z1 - z0 - 0.04, YL);
    // the plate: whole behind the forks, between them before (each slot 16 cm wide, its end 8 cm past its nest), its light strip along
    // its front edge, the low lip behind
    box(X + 0.13, S - 0.045, zm, 0.1, 0.045, z1 - z0, NV); const cuts = [z0, ...lz.slice().sort((p, q) => p - q).flatMap(z => [z - 0.08, z + 0.08]), z1];
    for (let j = 0; j < cuts.length; j += 2) { const za = cuts[j], zb = cuts[j + 1]; box(X - 0.05, S - 0.045, (za + zb) / 2, 0.26, 0.045, zb - za, NV); box(X - 0.183, S - 0.03, (za + zb) / 2, 0.006, 0.016, zb - za, CY); }
    box(X + 0.165, S, zm, 0.03, 0.06, z1 - z0, W); box(X + 0.165, S + 0.06, zm, 0.05, 0.022, z1 - z0, NV);
    gl(MATTE); ST0.L = new World.GB(); TOOLS_N.forEach((k, j) => { const z = lz[j], w = new V3(X, 0, z).applyMatrix4(M);
      for (const e of [-1, 1]) obox(g, [X - 0.17, S + 0.004, z + e * 0.092], [X + 0.083, S + 0.004, z + e * 0.092], 0.024, 0.008, BK);
      obox(g, [X + 0.095, S + 0.004, z - 0.1], [X + 0.095, S + 0.004, z + 0.1], 0.025, 0.008, BK);
      ST0.nests[k] = { k, j, a: 0, x: X, y: S, z, yc: NS.yc, st: 'in', blink: 0, v: null, led: null };
      nestLights(ST0, k, (e) => [[X - 0.192, S - 0.022, z + e * 0.085], [X - 0.192, S - 0.022, z + e * 0.101]]);
      Object.assign(ST0.nests[k], { a: Math.PI, x: w.x, z: w.z }); });
    placeGB(g, 0, M); placeGB(ST0.L, 0, M);
    BLOBS.push([NS.x - 0.02, zc, 1.1, z1 - z0 + 0.5, 0.5, 0, P]);
  }
  // (a stand built in its own frame, set in place: g's vertices from v0 on moved by M (a turn about y and a move: their normals turned
  // with it))
  function placeGB(g, v0, M) { const e = M.elements, P = g.P, N = g.N;
    for (let v = v0 * 3; v < P.length; v += 3) { const x = P[v], y = P[v + 1], z = P[v + 2], nx = N[v], ny = N[v + 1], nz = N[v + 2];
      P[v] = e[0] * x + e[4] * y + e[8] * z + e[12]; P[v + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; P[v + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      N[v] = e[0] * nx + e[4] * ny + e[8] * nz; N[v + 1] = e[1] * nx + e[5] * ny + e[9] * nz; N[v + 2] = e[2] * nx + e[6] * ny + e[10] * nz; } }
  /* ---------------- the stands for the paint and the swaps (always there; at rest out of the way): the nano chamber, the drying column,
     the paint drums, the tyre towers, the parts shelf, the rim stand, the kit stand ----------------
     THE NANO CHAMBER: a slim navy header under the ceiling on a rounded rectangle round the car, the lift and the drums (the robots'
     rails outside it), a line of light along it; under it five glass bands, one inside another: the outer one fixed in the header, the
     others stored inside it, up over the robots' reach. Down (k 1) they run out one after another till the inner one stands on the
     floor, each one over the next: a closed wall from the floor into the header. Clear glass, brighter at a slant, a rail along each
     band's top, one along its foot with a line of light (its colour set: chamberColor; dimmed while stored). It never hides the car;
     before it comes down the robots put their tools back and fold their arms along their rails, out of its way.
     THE DRYING COLUMN: in the lane before the car a hatch in the floor (a steel frame flush with it, yellow and black, bolted; the
     column's lid in it); the column rises out of it (2.5 m, white and navy as the robots). The air goes through it: an intake grille on
     its back, two fans in the middle, its face to the car a big grille with the heater's coils across it (dryerHeat: the coils glow, the
     fans spin), a line of light either side of each grille. It cools before it sinks; down, the cars drive over its lid.
     THE PAINT DRUMS: inside the chamber's outline behind the car, left of the lift's column: a navy spill tray with its grid on a steel
     base plate bolted to the floor (its outline in the chamber's corner), the drums on it (ribbed steel, a band and a lid in their
     colour, a hand pump with a tap), an arc of light before each one's foot (drumGlow: it and the band lit up, the tap's highlight); one
     array (PAINTS), past five slimmer ones in two staggered rows, the front one clear of the lift's carriage. Seen from home the car
     hides them: the paint's camera goes round to them.
     THE TYRE TOWERS: four at the near front corner outside the chamber (right of the car's nose seen from home, just out of the home
     view, clear of the lines to the car), each a bolted plate, a post through the wheels' middles, four complete wheels flat on it: the
     game's tyres (Serijske plain, Športne a ring of white lettering, Polslick a yellow band, Slick a red band and no tread).
     THE PARTS SHELF, THE RIM STAND, THE KIT STAND, each bolted down through a steel base plate: the shelf behind the near robot's rail
     on the left, in its reach (out of the home view; facing out, the robot takes its parts through its open back): open steel shelving
     with the parts for the swaps (bonnets, doors, boot lids, lights, mirrors, exhausts; in the car's colour, black carbon, chrome;
     samples, ~60 % of a car's); the rim stand and the kit stand side by side before it toward the front wall (out of the home view: under
     the page's buttons there a tap would miss them; the shows' cameras go to them), each a low board leaning back (under the lines from the
     camera to the car from anywhere round it): a navy one with the four rims, a matte grey one with the four aero kits (each bigger: a
     car's side in grey with the kit's parts in black carbon standing off it on brackets). Each stand a piece: it steps aside when it
     comes between the camera and the car ---------------- */
  // (the chamber's outline in by d: its points round it ({ x, z, the outward normal nx nz, end: a corner's end, the straight sides between
  // them }), nc to a corner's quarter)
  function rrect(d, nc) { const { hx, hz, r } = CH, q = r - d, c = nc || 8, P = [];
    for (const [cx, cz, a0] of [[hx - r, hz - r, 0], [r - hx, hz - r, 0.5], [r - hx, r - hz, 1], [hx - r, r - hz, 1.5]]) for (let k = 0; k <= c; k++) { const a = (a0 + k / c * 0.5) * Math.PI, nx = Math.cos(a), nz = Math.sin(a); P.push({ x: cx + nx * q, z: cz + nz * q, nx, nz, end: !k || k === c }); }
    return P; }
  // (a band along the outline in by d from y0 to y1, facing out (sg 1) or in (-1); a flat ring between the outline in by d0 and in by d1 at
  // y, facing up (sg 1) or down (-1))
  function rwall(g, d, y0, y1, col, sg) { const P = rrect(d), n = P.length;
    for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], nx = a.nx + b.nx, nz = a.nz + b.nz; g.quadO([a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z], col, [(a.x + b.x) / 2 - nx * sg, (y0 + y1) / 2, (a.z + b.z) / 2 - nz * sg]); } }
  function rflat(g, d0, d1, y, col, sg) { const A = rrect(d0), B = rrect(d1), n = A.length;
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; g.quadO([A[i].x, y, A[i].z], [A[j].x, y, A[j].z], [B[j].x, y, B[j].z], [B[i].x, y, B[i].z], col, [A[i].x, y - sg, A[i].z]); } }
  // (a geometry's gloss from its marks [[first vertex, k], ...]: each mark's k till the next; a piece's floor occlusion at height y, as
  // finishPieces darkens its colours)
  function withGloss(geo, gls) { const n = geo.attributes.position.count, a = new Float32Array(n).fill(1); gls.forEach(([j, k], m) => a.fill(k, j, m + 1 < gls.length ? gls[m + 1][0] : n)); geo.setAttribute('gloss', new THREE.BufferAttribute(a, 1)); return geo; }
  const aoK = (y) => y < 0.4 ? 0.5 + 0.5 * smooth(0, 0.4, y) : 1;
  // (an upright slab on the convex outline P [[x, z], ...] from y0 to y1: its top (col top), its sides)
  function polySlab(g, P, y0, y1, col, top) { const n = P.length, cx = P.reduce((s, p) => s + p[0], 0) / n, cz = P.reduce((s, p) => s + p[1], 0) / n, ins = [cx, (y0 + y1) / 2, cz];
    for (let k = 1; k + 1 < n; k++) g.triO([P[0][0], y1, P[0][1]], [P[k][0], y1, P[k][1]], [P[k + 1][0], y1, P[k + 1][1]], top || col, [cx, y1 - 1, cz]);
    for (let k = 0; k < n; k++) { const a = P[k], b = P[(k + 1) % n]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 1e-4) g.quadO([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], col, ins); } }

  // the chamber's header (in the rails' mesh: still, it never dissolves, nor casts, nor shows in the floor): a slim navy channel round the
  // outline under the ceiling, white along its top, a line of light low on its outer and its inner face (CH.ring: their vertices,
  // chamberColor), its slot underneath dark between two lips (the glass's tops in it); rods up to the deck
  function buildRing(g, gl) {
    const { y0, y1, o, i, hx, hz, r } = CH, { NV, W, ST } = FXC, SL = [0.035, 0.037, 0.045], m = (i - o) / 2, c = 0.7071 * (r - m);
    gl(PAINT); rwall(g, -o, y0, y1 - 0.07, NV, 1); rwall(g, -o, y1 - 0.07, y1, W, 1); rwall(g, i, y0, y1, NV, -1); rflat(g, -o, i, y1, NV, 1);
    rflat(g, -o, 0.03 - o, y0, NV, -1); rflat(g, i - 0.03, i, y0, NV, -1); rwall(g, 0.03 - o, y0, y0 + 0.04, SL, -1); rwall(g, i - 0.03, y0, y0 + 0.04, SL, 1); rflat(g, 0.03 - o, i - 0.03, y0 + 0.04, SL, -1);
    CH.ring = [g.P.length / 3]; rwall(g, -o - 0.002, y0 + 0.05, y0 + 0.066, CH.col, 1); rwall(g, i + 0.002, y0 + 0.05, y0 + 0.066, CH.col, -1); CH.ring.push(g.P.length / 3);
    gl(METAL); for (const [x, z] of [[0, hz - m], [0, m - hz], [hx - m, 0], [m - hx, 0], [hx - r + c, hz - r + c], [r - hx - c, hz - r + c], [r - hx - c, r - hz - c], [hx - r + c, r - hz - c]]) obox(g, [x, y1, z], [x, ROOM.h, z], 0.022, 0.022, ST);
  }
  // the drying column's hatch in the lane before the car (in the rails' mesh too): a steel frame flush with the floor round the opening,
  // its edges yellow and black, bolted down (the heads sunk: the cars drive over them); in it the column's lid (tread plate, the column's
  // own top: it stands in for it while the column is down)
  function buildHatch(g, gl) {
    const { x, z, hx, hz } = DRY, e = 0.1, PL = [0.24, 0.25, 0.27], TP = [0.29, 0.3, 0.32], x0 = x - hx, x1 = x + hx, z0 = z - hz, z1 = z + hz, ins = [x, -1, z], y = 0.009;
    gl(1.3); for (const [cx, cz, sx, sz] of [[x0 - e / 2, z, e, 2 * (hz + e)], [x1 + e / 2, z, e, 2 * (hz + e)], [x, z0 - e / 2, 2 * hx, e], [x, z1 + e / 2, 2 * hx, e]]) World.box(g, cx, 0, cz, sx, 0.012, sz, 0, PL, PL);
    gl(PAINT); hazard(g, [x0 - e, 0.0135, z1 + e], [0, 0, -1], [1, 0, 0], 2 * (hz + e), 0.05, 0.07, ins); hazard(g, [x1 + e, 0.0135, z0 - e], [0, 0, 1], [-1, 0, 0], 2 * (hz + e), 0.05, 0.07, ins);
    hazard(g, [x1, 0.0135, z0 - e], [-1, 0, 0], [0, 0, 1], 2 * hx, 0.05, 0.07, ins); hazard(g, [x0, 0.0135, z1 + e], [1, 0, 0], [0, 0, -1], 2 * hx, 0.05, 0.07, ins);
    gl(METAL); for (const [bx, bz] of [[x0 - e / 2, z0 - e / 2], [x1 + e / 2, z0 - e / 2], [x0 - e / 2, z1 + e / 2], [x1 + e / 2, z1 + e / 2], [x0 - e / 2, z], [x1 + e / 2, z]]) cylA(g, [bx, 0.013, bz], 'y', 0.017, 0.0036, 6, FXC.ST);   // (countersunk: the cars drive over them)
    gl(1.3); g.quadO([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], TP, ins);
    gl(MATTE); for (const s of [-1, 1]) { const zc = z + s * 0.3; g.quadO([x - 0.07, y + 0.0012, zc - 0.012], [x + 0.07, y + 0.0012, zc - 0.012], [x + 0.07, y + 0.0012, zc + 0.012], [x - 0.07, y + 0.0012, zc + 0.012], [0.05, 0.05, 0.06], ins); }   // (its lifting slots)
  }
  // the chamber's glass and its frame (each one mesh; the glass the main camera's only): each band built
  // standing on y 0 (poseChamber moves it up to where it is): its panes on the outline in by IN j, a rail along its top, one along its foot
  // with a line of light on both its faces (CH.led: their vertices, all the bands' after their frames: sent in one range), a post at
  // each corner's ends. Stored only the outer band is drawn (the others in it, at the same height)
  function buildChamber() {
    const gg = new World.GB(), fg = new World.GB(), gls = [[0, METAL]], { n, BH, IN } = CH, AL = [0.66, 0.68, 0.72];
    const mk = (g, mat, gl) => { const geo = g.geometry(); if (gl) withGloss(geo, gl); geo.attributes.position.setUsage(THREE.DynamicDrawUsage); geo.boundingSphere = new THREE.Sphere(new V3(0, 2, 0), 5); const m = new THREE.Mesh(geo, mat); scene.add(m); return m; };
    for (let j = 0; j < n; j++) { const d = IN * j, g0 = gg.P.length / 3, f0 = fg.P.length / 3;
      rwall(gg, d, 0.035, BH - 0.025, [1, 1, 1], 1);
      for (const [y0, y1] of [[BH - 0.025, BH], [0, 0.035]]) { rwall(fg, d - 0.008, y0, y1, AL, 1); rwall(fg, d + 0.008, y0, y1, AL, -1); rflat(fg, d - 0.008, d + 0.008, y1, AL, 1); rflat(fg, d - 0.008, d + 0.008, y0, AL, -1); }
      for (const p of rrect(d)) if (p.end) obox(fg, [p.x, 0.035, p.z], [p.x, BH - 0.025, p.z], 0.016, 0.016, AL);
      CH.gv.push([g0, gg.P.length / 3]); CH.fv.push([f0, fg.P.length / 3]); }
    gls.push([fg.P.length / 3, PAINT]); for (let j = 0; j < n; j++) { const d = IN * j, l0 = fg.P.length / 3; rwall(fg, d - 0.0095, 0.011, 0.024, CH.col, 1); rwall(fg, d + 0.0095, 0.011, 0.024, CH.col, -1); CH.led.push([l0, fg.P.length / 3]); }
    // (clear glass: a faint tint, the room's lights in it; at a slant it brightens and shows more (its edges, the bands' curves))
    const gm = new THREE.MeshPhongMaterial({ color: 0xe2f3ff, specular: 0xffffff, shininess: 140, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
    gm.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <tonemapping_fragment>', 'float gF = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 4.0);\ngl_FragColor.rgb += vec3(0.3, 0.4, 0.48) * gF; gl_FragColor.a = min(0.55, gl_FragColor.a + 0.4 * gF);\n#include <tonemapping_fragment>'); };
    gm.customProgramCacheKey = () => 'chGlass';
    CH.glass = mainOnly(mk(gg, gm)); CH.glass.renderOrder = 1; CH.frame = mainOnly(mk(fg, fxMat(FX.ZERO), gls)); CH.frame.receiveShadow = true; CH.frame.geometry.attributes.color.setUsage(THREE.DynamicDrawUsage);
    CH.P0 = CH.glass.geometry.attributes.position.array.slice(); CH.F0 = CH.frame.geometry.attributes.position.array.slice();
  }
  // (the chamber at CH.k: each band's foot (they run out from the outer one in: the outer one first, carrying the rest), the glass and the
  // frame moved up to them (only when k changes); stored, only the outer band drawn)
  function poseChamber() {
    const { n, step, YS } = CH, D = CH.k * YS;
    for (let j = 0; j < n; j++) CH.bot[j] = YS - Math.min(D, j * step);
    for (const [m, V, A] of [[CH.glass, [CH.gv], CH.P0], [CH.frame, [CH.fv, CH.led], CH.F0]]) { const pa = m.geometry.attributes.position, a = pa.array;
      for (const R of V) for (let j = 0; j < n; j++) { const y = CH.bot[j]; for (let v = R[j][0] * 3 + 1, e = R[j][1] * 3; v < e; v += 3) a[v] = A[v] + y; }
      pa.needsUpdate = true; m.geometry.boundingBox = null; }
    const st = CH.k === 0; CH.glass.geometry.setDrawRange(0, st ? CH.gv[0][1] : Infinity); CH.frame.geometry.setDrawRange(0, st ? CH.fv[0][1] : Infinity);
    CH.dirty = false; shadowDirty = Math.max(shadowDirty, 1); chamberLeds();
  }
  // (the bands' lines of light: off while the glass is stored, up to full as it comes down; only theirs sent again)
  function chamberLeds() { const f = smooth(0, 0.12, CH.k); if (CH.lf === f) return; CH.lf = f; const c = CH.col.map(v => v * f), fa = CH.frame.geometry.attributes.color, l0 = CH.led[0][0], l1 = CH.led[CH.n - 1][1];
    for (let v = l0; v < l1; v++) fa.array.set(c, v * 3); sendRange(fa, l0, l1); }
  // the chamber at k at once (down: the robots tucked first, at once); chamberTo: in s seconds (down: the robots fold out of its way
  // first; the glass runs out with a hiss)
  function setChamber(k) { k = clamp(k, 0, 1); if (k > 0) tuckNow(); CH.k = k; CH.dirty = true; }
  function* chamberTo(k, s) { k = clamp(k, 0, 1); if (Math.abs(k - CH.k) < 1e-4) return; if (k > 0) yield* robotsTuck(); s = s == null ? 3.2 : s; const k0 = CH.k;
    SFX.servo(s * 0.9); SFX.hiss(Math.min(1.6, s * 0.5), 0.5); yield* tween(s, (e) => { CH.k = lerp(k0, k, e); CH.dirty = true; }, EZ.io); SFX.clunk(0.3); }
  // its lights' colour (the bands' and the header's): the paint's (hex), the cyan's with none
  function chamberColor(hex) { const c = CH.col = hexRgb(hex == null ? 0x47c6ff : hex).map(v => v * 2.25), ra = FX.rails.geometry.attributes.color; CH.lf = null; chamberLeds();
    for (let v = CH.ring[0]; v < CH.ring[1]; v++) ra.array.set(c, v * 3); sendRange(ra, CH.ring[0], CH.ring[1]); }
  // a robot folded along its rail out of the chamber's way (travelPose toward its rail's nearer end), holding nothing: its tool back in its
  // nest first, a part let go (back where it came from); tuckNow at once (the tool dropped into its nest), robotsTuck together (both, or
  // the ones in L) (parked: they step aside when in the way, the beacon green; not parked for a car to drive: fxPark folds them back)
  function tuckPose(i) { const A = RB[i], r = A.r, x = A.p.x; return travelPose(i, x, x < (r.x0 + r.x1) / 2 ? -1 : 1); }
  function tuckNow(L) { for (const A of L || RB) if (!A.tuck) { for (const h of A.held.slice()) robotRelease(A.i, h, 'home'); if (A.tool !== 'none') { drop(A.i, A.tool); A.tool = 'none'; }
    A.p = full(A.i, tuckPose(A.i)); A.rest = A.tuck = true; A.dirty = true; } }
  function* robotsTuck(s, L) { yield* par(...(L || RB).map(A => A.tuck ? null : (function* () { for (const h of A.held.slice()) robotRelease(A.i, h, 'home'); if (A.tool !== 'none') yield* toolPut(A.i, s);
    yield* robotTo(A.i, tuckPose(A.i), 1.5 * (s || 1)); A.rest = A.tuck = true; A.dirty = true; })())); }

  // the drying column (one mesh: its body (part 0), its fans (1, 2) and the heater's coils (3), posed as it rises and they turn; the coils'
  // colours written again as the heat changes): built standing on y 0 at its hatch's middle; the air goes through it: a duct from its back
  // (the intake's mesh) to its face to the car (-x: the heater's coils across it behind a grille), two fans in their rings in the middle;
  // white, a navy foot and a navy band under the lid (tread plate on top), a line of light either side of each grille and over it, a
  // navy stripe and vents on its sides
  function buildDryer() {
    const R = DRY.R = rigB(4), g = R.g, { W, NV, ST, CY } = FXC, { hx, hz, H } = DRY, GD = PAL.gold, TP = [0.29, 0.3, 0.32], DU = [0.045, 0.047, 0.055], gl = (k) => rigGl(R, k), za = 0.448, ya = 0.362, yb = 2.138;
    const bands = [[0, 0.3, NV], [0.3, H - 0.16, W], [H - 0.16, H, NV]];
    rigPart(R, 0); gl(PAINT);
    const fr = (z0, z1, y0, y1) => { for (const [a, b, c] of bands) { const y2 = Math.max(a, y0), y3 = Math.min(b, y1); if (y3 > y2 + 1e-4) World.box(g, 0, y2, (z0 + z1) / 2, 2 * hx, y3 - y2, z1 - z0, 0, c, y3 === H ? TP : c); } };
    fr(-hz, -0.45, 0, H); fr(0.45, hz, 0, H); fr(-0.45, 0.45, 0, 0.36); fr(-0.45, 0.45, 2.14, H);
    gl(MATTE); const xa = -hx + 0.002, xb = hx - 0.002, q = (a, b, c, d, ins) => g.quadO(a, b, c, d, DU, ins);   // (the duct: its sides, the sill's top, the header's underside)
    for (const s of [-1, 1]) q([xa, ya, s * za], [xb, ya, s * za], [xb, yb, s * za], [xa, yb, s * za], [0, 1.2, s]);
    q([xa, ya, -za], [xb, ya, -za], [xb, ya, za], [xa, ya, za], [0, 0, 0]); q([xa, yb, -za], [xb, yb, -za], [xb, yb, za], [xa, yb, za], [0, H, 0]);
    // the fans' rings (both ways) and their motors behind them on struts; the coils' ceramic ends; the grilles' bars (the intake's finer)
    gl(PAINT); for (const fy of DRY.fy) { for (const s of [-1, 1]) gAdd(g, new THREE.RingGeometry(0.36, 0.43, 28), M4(s * 0.022, fy, 0, 0, s * Math.PI / 2, 0), [0.15, 0.16, 0.18]);
      cylA(g, [0.09, fy, 0], 'x', 0.075, 0.08, 14, NV); for (let k = 0; k < 4; k++) { const a = (k + 0.5) / 4 * TAU; obox(g, [0.1, fy + Math.sin(a) * 0.07, Math.cos(a) * 0.07], [0.1, fy + Math.sin(a) * 0.39, Math.cos(a) * 0.39], 0.02, 0.012, [0.2, 0.21, 0.23]); } }
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) gBox(g, null, -hx + 0.05, 0.5 + i * 0.275, s * 0.432, 0.045, 0.06, 0.032, [0.86, 0.84, 0.78]);
    gl(METAL); for (let z = -0.42; z < 0.43; z += 0.07) obox(g, [-hx + 0.012, ya, z], [-hx + 0.012, yb, z], 0.008, 0.014, ST);
    for (let y = ya + 0.178; y < yb - 0.05; y += 0.178) obox(g, [-hx + 0.008, y, -za], [-hx + 0.008, y, za], 0.012, 0.008, ST);
    for (let z = -0.42; z < 0.43; z += 0.042) obox(g, [hx - 0.01, ya, z], [hx - 0.01, yb, z], 0.005, 0.01, ST);
    for (let y = ya + 0.1; y < yb - 0.05; y += 0.1) obox(g, [hx - 0.006, y, -za], [hx - 0.006, y, za], 0.01, 0.005, ST);
    // the lines of light (either side of each grille and over it), a navy stripe and the vents on each side
    gl(PAINT); for (const e of [-1, 1]) { const x = e * (hx + 0.001); for (const s of [-1, 1]) g.quadO([x, 0.42, s * 0.466], [x, 2.08, s * 0.466], [x, 2.08, s * 0.486], [x, 0.42, s * 0.486], CY, [0, 1.2, s * 0.476]);
      g.quadO([x, 2.2, -0.42], [x, 2.2, 0.42], [x, 2.216, 0.42], [x, 2.216, -0.42], CY, [0, 2.2, 0]); }
    for (const s of [-1, 1]) { const zz = s * (hz + 0.001); g.quadO([-0.06, 0.3, zz], [0.06, 0.3, zz], [0.06, H - 0.16, zz], [-0.06, H - 0.16, zz], NV, [0, 1.2, 0]);
      for (let k = 0; k < 5; k++) { const y = 1.88 + k * 0.06; g.quadO([0.1, y, s * (hz + 0.002)], [0.21, y, s * (hz + 0.002)], [0.21, y + 0.026, s * (hz + 0.002)], [0.1, y + 0.026, s * (hz + 0.002)], [0.07, 0.07, 0.08], [0.15, y, 0]); }
      gl(METAL); cylA(g, [0, H - 0.08, s * (hz + 0.004)], 'z', 0.018, 0.008, 10, GD); gl(PAINT); }
    // the fans (each round its axis along x): a navy hub, a gold cap, seven blades pitched
    for (let f = 0; f < 2; f++) { rigPart(R, 1 + f); gl(PAINT); cylA(g, [0, 0, 0], 'x', 0.07, 0.05, 14, NV); gl(METAL); cylA(g, [-0.03, 0, 0], 'x', 0.034, 0.012, 12, GD);
      gl(SATIN); for (let k = 0; k < 7; k++) gBox(g, M4(0, 0, 0, k / 7 * TAU, 0, 0).multiply(M4(0, 0.2, 0, 0, 0.55, 0)), 0, 0, 0, 0.01, 0.27, 0.11, [0.24, 0.25, 0.28]); }
    // the coils across the outlet: a ring of the wire every 35 mm, every other darker (DRY.cs: which, a face each)
    rigPart(R, 3); gl(SATIN); DRY.cv = [g.P.length / 3]; const cs = DRY.cs = [];
    for (let i = 0; i < 6; i++) gAdd(g, new THREE.CylinderGeometry(0.017, 0.017, 0.84, 6, 24), M4(-hx + 0.05, 0.5 + i * 0.275, 0, Math.PI / 2, 0, 0), (c) => { cs.push(Math.floor((c[1] + 0.42) / 0.035) & 1); return [0.3, 0.14, 0.1]; });
    DRY.cv.push(g.P.length / 3);
    const m = rigMesh(R, fxMat(FX.ZERO, 0x15181d)); m.visible = false; scene.add(m);
    // (the heat's glow before the outlet: a soft orange light, as strong as the heat; the main camera's only)
    const c = document.createElement('canvas'); c.width = 32; c.height = 64; const x2 = c.getContext('2d'); x2.setTransform(1, 0, 0, 2, 0, 0); const gr = x2.createRadialGradient(16, 16, 1, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x2.fillStyle = gr; x2.fillRect(0, 0, 32, 32);
    const gm = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: 0x000000, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    DRY.glow = mainOnly(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.0), gm)); DRY.glow.rotation.y = -Math.PI / 2; DRY.glow.visible = false; scene.add(DRY.glow);
  }
  // (the coils' colours at the heat: a dull rust cold, orange hot (over 1: they glow), every other turn darker)
  function heatCoils() { const R = DRY.R, h = DRY.heat, [v0, v1] = DRY.cv, C = R.mesh.geometry.attributes.color, pa = R.mesh.geometry.attributes.position.array;
    for (let v = v0; v < v1; v++) { const k = DRY.cs[(v - v0) / 3 | 0] ? 1 : 0.6, f = aoK(pa[v * 3 + 1]); R.C[v * 3] = lerp(0.3, 3.4, h) * k; R.C[v * 3 + 1] = lerp(0.14, 1.05, h * h) * k; R.C[v * 3 + 2] = lerp(0.1, 0.2, h) * k;
      for (let q = 0; q < 3; q++) C.array[v * 3 + q] = R.C[v * 3 + q] * f; }
    sendRange(C, v0, v1); DRY.gd = true; }   // (only the coils' colours sent again; the glow follows)
  // the column each frame (dt: the shows' clock): its heat eased to what was asked (the coils glow up in about a second and a half, the
  // fans spin up with them), the fans turned (only their vertices sent again; the shadow map left: they are inside it), posed again when
  // it moved (drawn while it is up, casting then); its hum
  function stepDryer(dt) {
    const R = DRY.R, M = R.M, y = -(1 - DRY.k) * DRY.H, on = DRY.k > 1e-4; let still = true;
    if (DRY.heat !== DRY.want) { DRY.heat = DRY.want > DRY.heat ? Math.min(DRY.want, DRY.heat + dt * 0.7) : Math.max(DRY.want, DRY.heat - dt * 0.5); heatCoils(); dryHum(); }
    if (DRY.heat > 1e-3 && on) { DRY.a = (DRY.a + dt * DRY.heat * 24) % TAU; R.dirty[1] = R.dirty[2] = 1; }
    if (DRY.dirty) { R.dirty.fill(1); DRY.dirty = false; still = false; DRY.gd = true; R.mesh.visible = on; if (R.mesh.castShadow !== on) { R.mesh.castShadow = on; shadowDirty = 2; } dryHum(); }
    if (R.dirty.some(Boolean)) { M[0].makeTranslation(DRY.x, y, DRY.z); M[3].copy(M[0]); for (let f = 0; f < 2; f++) M[1 + f].makeRotationX(f ? -DRY.a : DRY.a).setPosition(DRY.x, y + DRY.fy[f], DRY.z); rigPose(R, still); }
    if (DRY.gd) { DRY.gd = false; const gw = DRY.glow; gw.visible = on && DRY.heat > 0.02; if (gw.visible) { gw.position.set(DRY.x - DRY.hx - 0.06, y + 1.25, DRY.z); gw.material.color.setRGB(1, 0.42, 0.12).multiplyScalar(0.55 * DRY.heat * DRY.k); } }
  }
  // the column up (k 1) or down (0) at once (up: a robot whose arm is where it rises folded out of its way first, at once); dryerTo: in s
  // seconds (going up: such a robot puts its tool back and folds along its rail first; going down it cools first: the coils dark, the fans
  // still, then it sinks); dryerHeat: the heat asked for (0 .. 1); dryHum: its hum as hot as it is (up only)
  const DRYF = new THREE.Box3(), _dl = [];
  const overDryer = (A) => { DRYF.min.set(DRY.x - DRY.hx - 0.12, 0, DRY.z - DRY.hz - 0.12); DRYF.max.set(DRY.x + DRY.hx + 0.12, DRY.H + 0.12, DRY.z + DRY.hz + 0.12);
    for (const [a, b, r] of linksOf(A, 'whole', _dl)) for (let j = 0, n = Math.ceil(a.distanceTo(b) / 0.1); j <= n; j++) { _sp.copy(a).lerp(b, n ? j / n : 0); if (bxd(DRYF, _sp.x, _sp.y, _sp.z) < r) return true; } return false; };
  function setDryer(k) { k = clamp(k, 0, 1); if (k > DRY.k) tuckNow(RB.filter(overDryer)); DRY.k = k; DRY.dirty = true; }
  function* dryerTo(k, s) { k = clamp(k, 0, 1); if (Math.abs(k - DRY.k) < 1e-4) return; s = s == null ? 2.4 : s; if (k < DRY.k) { DRY.want = 0; while (DRY.heat > 0.05) yield; } else yield* robotsTuck(1, RB.filter(overDryer)); const k0 = DRY.k;
    SFX.clunk(0.4); SFX.servo(s * 0.9); yield* tween(s, (e) => { DRY.k = lerp(k0, k, e); DRY.dirty = true; }, EZ.io); SFX.clunk(0.5); }
  const dryerHeat = (k) => { DRY.want = clamp(k, 0, 1); }, dryHum = () => sLoop('dry', 'bandpass', 360, 0.8, 0.1 * DRY.heat * (DRY.k > 1e-4 ? 1 : 0));

  // (the drum stand's outline in by e (its front at zf): its right end clear of the lift's plate, its back and its left corner along the
  // chamber's glass, a quarter round its corner's middle; where the drums stand: one row, two staggered ones past five)
  function drumPoly(e, zf, xr) { const cx = -2.35, cz = -1.7, q = 0.534 - e, zz = zf - e, a0 = zz >= cz ? Math.PI : Math.PI + Math.asin(Math.min(1, (cz - zz) / q)), P = [[xr - e, zz]];
    if (zz > cz + 1e-4) P.push([cx - q, zz]);
    for (let k = 0; k <= 8; k++) { const a = a0 + (1.5 * Math.PI - a0) * k / 8; P.push([cx + Math.cos(a) * q, cz + Math.sin(a) * q]); }
    P.push([xr - e, cz - q]); return P; }
  // ([x, z, colour, radius] each: five in a row; past five two staggered rows of slimmer ones, the front one ending clear of the lift's
  // carriage (its yoke from x -0.7) and the stand's right end with it (xr))
  function drumSpots() { const n = PAINTS.length;
    if (n <= 5) { const s = n > 1 ? (DRM.x1 - DRM.x0) / (n - 1) : 0; return PAINTS.map((c, k) => [DRM.x0 + s * k, DRM.z, c, DRM.r]); }
    return PAINTS.map((c, k) => { const row = k & 1, j = k >> 1; return [-2.38 + 0.38 * (j + row * 0.5), row ? -1.64 : -2.02, c, 0.17]; }); }
  function buildDrums() {
    const P = FREE.drums = piece(), g = P.g, gl = (k) => gloss(P, k), { h, y0 } = DRM, { NV, W, ST, DK } = FXC, S = drumSpots(), xr = PAINTS.length > 5 ? -0.78 : -0.62, zf = Math.max(...S.map(d => d[1] + d[3])) + 0.09;
    const PL = drumPoly(0, zf, xr), TY = drumPoly(0.06, zf, xr), cx = -1.6;
    P.near = 2.4; P.bolts = 0; const bl = (x, z) => { bolt(g, x, 0.012, z); P.bolts++; };
    gl(1.3); polySlab(g, PL, 0, 0.012, [0.24, 0.25, 0.27], [0.29, 0.3, 0.32]); gl(PAINT); hazard(g, [xr, 0.014, zf], [-1, 0, 0], [0, 0, -1], xr - PL[1][0], 0.035, 0.07, [cx, -1, -1.9]);
    gl(METAL); for (let x = xr - 0.13; x > -2.4; x -= 0.5) { bl(x, zf - 0.03); bl(x, -2.204); } for (const a of [1.12, 1.38]) bl(-2.35 + Math.cos(a * Math.PI) * 0.504, -1.7 + Math.sin(a * Math.PI) * 0.504);
    // the tray (navy, a white lip round its top), its sump dark under the grid's bars
    gl(PAINT); polySlab(g, TY, 0.012, 0.1, NV, [0.07, 0.075, 0.085]);
    { const I = drumPoly(0.095, zf, xr), n = TY.length; for (let k = 0; k < n; k++) { const a = TY[k], b = TY[(k + 1) % n], c = I[(k + 1) % n], d = I[k]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 1e-4) g.quadO([a[0], 0.1015, a[1]], [b[0], 0.1015, b[1]], [c[0], 0.1015, c[1]], [d[0], 0.1015, d[1]], W, [cx, -1, -1.9]); } }
    gl(METAL); { const zb = TY[TY.length - 1][1] + 0.05; for (let z = zb; z < zf - 0.09; z += 0.045) { const xl = z >= -1.7 ? -2.35 - 0.44 : -2.35 - Math.sqrt(Math.max(0, 0.44 * 0.44 - (z + 1.7) * (z + 1.7))); obox(g, [xl, 0.104, z], [xr - 0.095, 0.104, z], 0.01, 0.008, ST); } }
    // the drums (what the robots keep clear of: each one with its pump, the tray under them)
    P.obst = [new THREE.Box3(new V3(Math.min(...PL.map(q => q[0])), 0, Math.min(...PL.map(q => q[1]))), new V3(xr, 0.11, zf))];
    for (const [x, z, hex, r] of S) { const c = hexRgb(hex), top = y0 + h, v0 = g.P.length / 3;
      gl(PAINT); gAdd(g, new THREE.CylinderGeometry(r + 0.002, r + 0.002, 0.12, 22, 1, true), M4(x, top - 0.065, z), c); gAdd(g, new THREE.CylinderGeometry(r - 0.004, r - 0.004, 0.014, 22), M4(x, top - 0.001, z), c);
      const va = g.P.length / 3; annulus(g, x, 0.109, z, r + 0.022, r + 0.048, 10, c.map(v => v * 0.55), Math.PI / 2 - 0.9, Math.PI / 2 + 0.9);
      DRM.list.push({ x, z, r, hex, c, v: [v0, va, g.P.length / 3], k: 0 }); P.obst.push(new THREE.Box3(new V3(x - r - 0.01, 0, z - r - 0.01), new V3(x + r + 0.01, top + 0.21, z + r + 0.01)));
      gl(METAL); gAdd(g, new THREE.CylinderGeometry(r, r, h - 0.13, 22, 1, true), M4(x, y0 + (h - 0.13) / 2, z), [0.56, 0.58, 0.62]);
      for (const y of [y0 + h * 0.3, y0 + h * 0.58]) gAdd(g, new THREE.CylinderGeometry(r + 0.006, r + 0.006, 0.024, 22, 1, true), M4(x, y, z), [0.66, 0.68, 0.72]);
      for (const y of [y0 + 0.012, top - 0.008]) gAdd(g, new THREE.CylinderGeometry(r + 0.007, r + 0.007, 0.022, 22, 1, true), M4(x, y, z), [0.7, 0.72, 0.76]);
      cylA(g, [x - 0.085, top + 0.012, z + 0.06], 'y', 0.024, 0.014, 8, [0.6, 0.62, 0.66]);   // (a bung)
      // the hand pump: its bung, its tube, a T handle on top, the spout to the front, a red tap on it
      cylA(g, [x + 0.07, top + 0.014, z - 0.03], 'y', 0.032, 0.018, 10, [0.6, 0.62, 0.66]); gl(PAINT); cylA(g, [x + 0.07, top + 0.1, z - 0.03], 'y', 0.013, 0.17, 8, DK);
      obox(g, [x + 0.02, top + 0.19, z - 0.03], [x + 0.12, top + 0.19, z - 0.03], 0.018, 0.018, DK); gl(METAL); obox(g, [x + 0.07, top + 0.13, z - 0.03], [x + 0.07, top + 0.1, z + 0.07], 0.014, 0.014, ST);
      gl(PAINT); cylA(g, [x + 0.07, top + 0.12, z + 0.055], 'y', 0.014, 0.02, 8, [0.75, 0.12, 0.08]); }
    BLOBS.push([(PL[0][0] + PL[2][0]) / 2, (zf - 2.234) / 2, xr - PL[2][0] + 0.3, zf + 2.234 + 0.25, 0.7, 0, P]);
  }
  // a drum's light (0 .. 1: the tap on it, later): its band and lid brighter, the arc before it lit up (its colours written again)
  function drumGlow(i, k) { const D = DRM.list[i]; if (!D || !DRM.mesh) return; D.k = clamp(k, 0, 1); const A = DRM.mesh.geometry.attributes, C = A.color.array, Y = A.position.array, c = D.c;
    for (let v = D.v[0]; v < D.v[2]; v++) { const arc = v >= D.v[1], s = arc ? 0.55 + 2.6 * D.k : 1 + 1.1 * D.k, w = arc ? 0.45 * D.k : 0.1 * D.k, f = aoK(Y[v * 3 + 1]);
      C[v * 3] = (c[0] * s + w) * f; C[v * 3 + 1] = (c[1] * s + w) * f; C[v * 3 + 2] = (c[2] * s + w) * f; }
    sendRange(A.color, D.v[0], D.v[2]); }

  // the tyre towers' tyres: half a profile round y (as TYRE) with its grooves (from y, to y (0: the middle one), how deep): Serijske three,
  // Športne two, Polslick two shallow ones, Slick none; each face coloured by its segment: the tread, a groove, the upper shoulder and
  // sidewall (the band seen from the side and from above: yellow, red; Športne's lettering, a white ring broken), the inside dark
  const TW_P = [[0.215, -0.106], [0.27, -0.12], [0.296, -0.119], [0.315, -0.113], [0.329, -0.097], [0.336, -0.062]], TW_G = [[[-0.046, -0.032, 0.011], [-0.009, 0, 0.011]], [[-0.04, -0.026, 0.01]], [[-0.05, -0.04, 0.005]], []];
  function twTyre(g, m, kind, top) {   // (top: the stack's top wheel; under it each tyre's flat sidewalls touch the next one's, never seen: the profile from the shoulder, fewer sides)
    const half = top ? TW_P.slice() : TW_P.slice(2); for (const [a, b, dp] of TW_G[kind]) { half.push([0.336, a], [0.336 - dp, a + 0.002]); if (b < 0) half.push([0.336 - dp, b - 0.002], [0.336, b]); }
    const { geo, n } = lathe(half, top ? 16 : 12), pts = half.concat(half.slice().reverse().map(p => [p[0], -p[1]])), BD = [null, [0.92, 0.92, 0.9], BANDS[0], BANDS[1]][kind];
    gAdd(g, geo, m, (c, nr, f) => { const j = (f >> 1) % (n - 1); if (j === n - 2) return [0.03, 0.03, 0.035]; const p = pts[j], q = pts[j + 1], rm = (p[0] + q[0]) / 2, ym = (p[1] + q[1]) / 2;
      if (Math.min(p[0], q[0]) > 0.3355) return [0.16, 0.16, 0.165];
      if (Math.abs(ym) < 0.06 && rm > 0.32) return [0.055, 0.055, 0.06];
      if (BD && ym > 0.09 && rm > 0.26 && rm < 0.334 && (kind !== 1 || (((f >> 1) / (n - 1) | 0) * 7) % 5 < 3)) return BD;
      return PAL.rub; });
  }
  // the tyre towers (a piece): four at the near front corner outside the chamber, each a steel base plate bolted to the floor (yellow and
  // black on its edges to the car), a navy flange, a post through the wheels' middles (a navy cap, a gold ring), four complete wheels flat
  // on it (the top one's rim and spokes seen; under it the tyres hide theirs)
  function buildTowers() {
    const P = FREE.towers = piece(), g = P.g, gl = (k) => gloss(P, k), { NV, ST } = FXC, PLt = [0.24, 0.25, 0.27], RIM = [0.62, 0.64, 0.68];
    P.near = 2.4; P.bolts = 0; P.boxIn = new THREE.Box3(new V3(-9, 0, -9), new V3(9, 1.0, 9));   // (what can stand in the way: the wheels, not the posts' tops)
    for (const [x, z, kind] of TWR) { const ins = [x, -1, z];
      gl(1.3); World.box(g, x, 0, z, 0.64, 0.012, 0.64, 0, PLt, [0.29, 0.3, 0.32]); gl(PAINT); hazard(g, [x - 0.32, 0.014, z + 0.32], [0, 0, -1], [1, 0, 0], 0.64, 0.045, 0.07, ins); hazard(g, [x + 0.32, 0.014, z - 0.32], [-1, 0, 0], [0, 0, 1], 0.595, 0.045, 0.07, ins);
      gl(METAL); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { bolt(g, x + sx * 0.255, 0.012, z + sz * 0.255); P.bolts++; }
      gl(PAINT); cylA(g, [x, 0.027, z], 'y', 0.13, 0.03, 18, NV); gl(METAL); cylA(g, [x, 0.56, z], 'y', 0.03, 1.04, 10, ST); cylA(g, [x, 1.068, z], 'y', 0.048, 0.01, 12, PAL.gold); gl(PAINT); cylA(g, [x, 1.09, z], 'y', 0.044, 0.035, 12, NV);
      for (let i = 0; i < 4; i++) { const m = M4(x, 0.163 + i * 0.243, z, 0, i * 0.9 + x * 3, 0);
        gl(MATTE); twTyre(g, m, kind, i === 3);
        if (i === 3) { gl(METAL); gAdd(g, new THREE.CylinderGeometry(0.212, 0.212, 0.2, 16), m, (c, nr) => nr[1] > 0.5 ? [0.34, 0.35, 0.38] : RIM.map(v => v * 0.85)); for (let k = 0; k < 6; k++) gBox(g, m.clone().multiply(M4(0, 0, 0, 0, k / 6 * TAU, 0)), 0, 0.104, 0.12, 0.036, 0.012, 0.17, RIM); cylA(g, [x, 0.163 + i * 0.243 + 0.105, z], 'y', 0.05, 0.016, 12, [0.2, 0.21, 0.23]); } } }
    P.obst = TWR.map(([x, z]) => new THREE.Box3(new V3(x - 0.34, 0, z - 0.34), new V3(x + 0.34, 1.11, z + 0.34)));   // (each tower: its wheels and its post)
    { const xs = TWR.map(t => t[0]), zs = TWR.map(t => t[1]), x0 = Math.min(...xs) - 0.4, x1 = Math.max(...xs) + 0.4, z0 = Math.min(...zs) - 0.4, z1 = Math.max(...zs) + 0.4; BLOBS.push([(x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.8, 0, P]); }
  }

  // the parts shelf behind the near rail, facing out from it (a piece; the robot reaches its parts through its open back): open steel
  // shelving on a base plate bolted to the floor (its edge to the rail yellow and black): navy uprights on foot plates, steel decks on
  // white beams, braces at its ends, a rail along its back on top; in its
  // bottom bay two doors and two boot lids standing on edge (one with a lip spoiler), on its middle deck the lights (two plain ones with
  // an amber indicator, two smoked ones with a bar of LEDs), two pairs of mirrors (the car's colour, carbon) and two exhausts (a big single,
  // twin tips), on top three bonnets leaning on the rail (the car's colour, carbon, vented). What is in the car's colour follows the car on
  // the table (SHF.body: those vertices, shelfColor)
  const carbonCol = (q) => (Math.floor((q[0] + q[1] + q[2]) / 0.035) & 1) ? [0.092, 0.092, 0.104] : [0.072, 0.072, 0.082];   // (carbon fibre's colour at a point: its weave a faint twill)
  function buildShelf() {
    const P = FREE.shelf = piece(), g = P.g, gl = (k) => gloss(P, k), box = (...a) => fbox(g, ...a), { x0, x1, z0, z1 } = SHF, xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, { W, NV, ST } = FXC;
    const BC = [0.5, 0.5, 0.5], CR = [0.74, 0.76, 0.8], GL = [0.1, 0.13, 0.17], BK = [0.06, 0.06, 0.07], at = (B, x, y, z) => new V3(x, y, z).applyMatrix4(B).toArray(), body = (f) => { const v0 = g.P.length / 3; f(); SHF.body.push([v0, g.P.length / 3]); };
    P.near = 2.4; P.bolts = 0; const bl = (x, z) => { bolt(g, x, 0.012, z); P.bolts++; };
    gl(1.3); box(xm, 0, zm, x1 - x0 + 0.1, 0.012, z1 - z0 + 0.12, [0.24, 0.25, 0.27], [0.29, 0.3, 0.32]); gl(PAINT); hazard(g, [x0 - 0.05, 0.014, z1 + 0.06], [1, 0, 0], [0, 0, -1], x1 - x0 + 0.1, 0.045, 0.07, [xm, -1, zm]);
    gl(METAL); for (const x of [x0 + 0.1, xm, x1 - 0.1]) { bl(x, z0 - 0.035); bl(x, z1 + 0.035); }
    gl(PAINT); for (const x of [x0 + 0.03, x1 - 0.03]) for (const [z, h] of [[z0 + 0.03, 1.47], [z1 - 0.03, 1.82]]) { box(x, 0.012, z, 0.1, 0.01, 0.1, NV); box(x, 0.022, z, 0.045, h - 0.022, 0.045, NV); box(x, h, z, 0.052, 0.018, 0.052, W); }
    for (const y of [0.12, 0.92, 1.42]) { gl(1.3); box(xm, y, zm, x1 - x0 - 0.05, 0.022, z1 - z0 - 0.05, [0.47, 0.49, 0.53], [0.52, 0.54, 0.58]); gl(PAINT); for (const z of [z0 + 0.03, z1 - 0.03]) box(xm, y - 0.05, z, x1 - x0 - 0.06, 0.05, 0.03, W); }
    box(xm, 1.74, z1 - 0.03, x1 - x0 - 0.06, 0.05, 0.03, W);
    gl(METAL); for (const x of [x0 + 0.03, x1 - 0.03]) for (const [ya, yb] of [[0.15, 0.86], [0.95, 1.36]]) { obox(g, [x, ya, z0 + 0.06], [x, yb, z1 - 0.06], 0.02, 0.01, ST); obox(g, [x, yb, z0 + 0.06], [x, ya, z1 - 0.06], 0.02, 0.01, ST); }
    // the doors (the skin, the window's frame, its tinted glass both ways, a handle, a dark crease) and the boot lids standing, leaning back
    const door = (px, pz) => { const B = M4(px, 0.142, pz, 0.08, 0, 0), fr = [[-0.265, 0.36], [-0.265, 0.58], [-0.13, 0.62], [0.16, 0.62], [0.265, 0.38]];
      gl(PAINT); body(() => { gBox(g, B, 0, 0.18, 0, 0.55, 0.36, 0.035, BC); for (let k = 0; k + 1 < fr.length; k++) obox(g, at(B, fr[k][0], fr[k][1], 0), at(B, fr[k + 1][0], fr[k + 1][1], 0), 0.03, 0.03, BC); });
      gBox(g, B, 0, 0.255, -0.0185, 0.53, 0.006, 0.003, BK); for (const s of [-1, 1]) for (let k = 1; k + 1 < fr.length; k++) g.triO(at(B, fr[0][0], fr[0][1], 0), at(B, fr[k][0], fr[k][1], 0), at(B, fr[k + 1][0], fr[k + 1][1], 0), GL, at(B, 0, 0.5, s));
      gl(METAL); gBox(g, B, 0.12, 0.3, -0.021, 0.08, 0.018, 0.01, CR); };
    const lid = (px, pz, lip) => { const B = M4(px, 0.142, pz, 0.08, 0, 0); gl(PAINT); body(() => gBox(g, B, 0, 0.16, 0, 0.48, 0.32, 0.035, BC));
      gBox(g, B, 0, 0.09, -0.0185, 0.22, 0.07, 0.004, BK); if (lip) gAdd(g, new THREE.BoxGeometry(0.46, 0.02, 0.06, 8, 1, 2), B.clone().multiply(M4(0, 0.325, -0.015, -0.3, 0, 0)), carbonCol);
      gl(METAL); gBox(g, B, 0, 0.14, -0.02, 0.12, 0.014, 0.008, CR); };
    door(x0 + 0.34, z0 + 0.12); door(x0 + 0.62, z0 + 0.32); lid(x1 - 0.72, z0 + 0.12, false); lid(x1 - 0.3, z0 + 0.32, true);
    // the lights, the mirrors (on their feet; the glass behind), the exhausts lying along the shelf (a big tip on its can, twin tips stacked)
    const yd = 0.942;
    for (let i = 0; i < 4; i++) { const x = x0 + 0.155 + i * 0.19, z = z0 + 0.14, sm = i > 1; gl(PAINT); gBox(g, null, x, yd + 0.055, z + 0.02, 0.18, 0.11, 0.1, [0.07, 0.07, 0.08]);
      if (sm) { gBox(g, null, x, yd + 0.055, z - 0.033, 0.17, 0.095, 0.006, [0.09, 0.1, 0.12]); gBox(g, null, x, yd + 0.088, z - 0.037, 0.15, 0.01, 0.004, [0.85, 0.88, 0.92]); gBox(g, null, x + 0.06, yd + 0.035, z - 0.037, 0.035, 0.012, 0.004, [0.95, 0.5, 0.1]); }
      else { gBox(g, null, x - 0.025, yd + 0.055, z - 0.033, 0.12, 0.095, 0.006, [0.72, 0.75, 0.8]); gBox(g, null, x + 0.06, yd + 0.055, z - 0.033, 0.045, 0.095, 0.006, [1.0, 0.5, 0.08]); gl(METAL); cylA(g, [x - 0.025, yd + 0.055, z - 0.037], 'z', 0.032, 0.004, 12, [0.85, 0.87, 0.9]); } }
    for (let i = 0; i < 4; i++) { const x = x0 + 0.95 + i * 0.112 + (i > 1 ? 0.025 : 0), z = z0 + 0.15; gl(PAINT); gBox(g, null, x, yd + 0.025, z, 0.045, 0.05, 0.05, BK);
      if (i > 1) gAdd(g, new THREE.BoxGeometry(0.11, 0.07, 0.06, 3, 2, 2), M4(x, yd + 0.085, z), carbonCol); else body(() => gBox(g, null, x, yd + 0.085, z, 0.11, 0.07, 0.06, BC));
      gl(METAL); gBox(g, null, x, yd + 0.085, z + 0.032, 0.1, 0.06, 0.004, [0.8, 0.83, 0.88]); }
    const xe = x1 - 0.17, xt = x1 - 0.085; gl(METAL); cylA(g, [xe, yd + 0.05, z0 + 0.24], 'z', 0.045, 0.24, 14, [0.5, 0.52, 0.56]); cylA(g, [xe, yd + 0.05, z0 + 0.075], 'z', 0.048, 0.09, 16, CR);
    for (const y of [yd + 0.03, yd + 0.085]) cylA(g, [xt, y, z0 + 0.07], 'z', 0.024, 0.08, 12, CR); gBox(g, null, xt, yd + 0.058, z0 + 0.22, 0.05, 0.11, 0.22, [0.45, 0.47, 0.5]);
    gl(MATTE); discZ(g, xe, yd + 0.05, z0 + 0.029, 0, 0.04, 14, [0.04, 0.04, 0.05], -1); for (const y of [yd + 0.03, yd + 0.085]) discZ(g, xt, y, z0 + 0.029, 0, 0.019, 10, [0.04, 0.04, 0.05], -1);
    // the bonnets on top standing on the deck, leaning on the rail (nearly upright: they mirror the wall, not the lamps over them): a panel
    // crowned across (the car's colour; carbon, satin; the car's colour with two louvres)
    const bon = (px, kind) => { const B = M4(px, 1.448, z0 + 0.316, -1.17, 0, 0), geo = new THREE.BoxGeometry(0.48, 0.02, 0.5, 6, 1, 6), Q = geo.attributes.position;
      for (let i = 0; i < Q.count; i++) { const x = Q.getX(i) / 0.24; Q.setY(i, Q.getY(i) - 0.035 * x * x); Q.setZ(i, Q.getZ(i) + 0.25); } geo.computeVertexNormals();
      if (kind === 1) { gl(SATIN); gAdd(g, geo, B, carbonCol); gl(PAINT); } else { gl(PAINT); body(() => gAdd(g, geo, B, BC)); }
      if (kind === 2) for (const sx of [-0.1, 0.1]) for (let k = 0; k < 5; k++) gBox(g, B, sx, 0.008 - 0.035 * (sx / 0.24) * (sx / 0.24), 0.17 + k * 0.03, 0.1, 0.012, 0.012, BK); };
    bon(x0 + 0.315, 0); bon(xm, 1); bon(x1 - 0.315, 2);
    placeGB(g, 0, M4(xm, 0, zm, 0, Math.PI, 0).multiply(M4(-xm, 0, -zm)));   // (built facing the rail, turned half round: its parts face out, the robot reaches them through its open back)
    // (what the robots keep clear of: its decks, its uprights (the tall ones by the rail now), its ends' braces, the rail on top, what lies
    // in each bay ('shelf.bot', '.mid', '.top': a robot taking a part from one skips it))
    const BB = (a0, b0, c0, a1, b1, c1) => new THREE.Box3(new V3(a0, b0, c0), new V3(a1, b1, c1));
    P.obst = [0.12, 0.92, 1.42].map(y => BB(x0, y - 0.05, z0, x1, y + 0.022, z1)).concat([[z0 + 0.03, 1.82], [z1 - 0.03, 1.47]].flatMap(([z, h]) => [x0 + 0.03, x1 - 0.03].map(x => BB(x - 0.03, 0, z - 0.03, x + 0.03, h + 0.02, z + 0.03))),
      [x0 + 0.03, x1 - 0.03].map(x => BB(x - 0.02, 0.15, z0, x + 0.02, 1.36, z1)), [BB(x0, 1.72, z0, x1, 1.8, z0 + 0.06)]);
    P.bays = { 'shelf.bot': BB(x0 + 0.05, 0.14, z0 + 0.04, x1 - 0.05, 0.8, z1 - 0.04), 'shelf.mid': BB(x0 + 0.05, 0.94, z0 + 0.04, x1 - 0.05, 1.13, z1 - 0.04), 'shelf.top': BB(x0 + 0.05, 1.44, z0 + 0.04, x1 - 0.05, 1.95, z1 - 0.04) };
    addPlate(P, 1, xm, 1.392, z1 - 0.012, 0, 0.3);
    BLOBS.push([xm, zm, x1 - x0 + 0.5, z1 - z0 + 0.45, 0.75, 0, P]);
  }
  // (the shelf's parts in the car's colour: the car on the table's, written again when it changes)
  function shelfColor(hex) { SHF.col = hex; const A = SHF.mesh.geometry.attributes, C = A.color.array, Y = A.position.array, c = hexRgb(hex);
    for (const [v0, v1] of SHF.body) for (let v = v0; v < v1; v++) { const f = aoK(Y[v * 3 + 1]); C[v * 3] = c[0] * f; C[v * 3 + 1] = c[1] * f; C[v * 3 + 2] = c[2] * f; }
    sendRange(A.color, SHF.body[0][0], SHF.body[SHF.body.length - 1][1]); }
  // (a low sloped board in a stand's frame (its middle on the floor at the origin, its face toward +z): its bottom edge 10 cm up, 10 cm
  // out, leaning back TILT; B: the board's own frame (x across, y up its slope from its bottom edge, z out of its face))
  const TILT = 0.49, boardB = () => M4(0, 0.1, 0.1, -TILT, 0, 0);
  // a low board's stand round it (in its frame): a steel base plate bolted to the floor (its back edge, to the rail, yellow and black), a
  // navy foot under each end, a block holding the board's bottom edge, a white strut up to its back; the board (col, its gloss gk), its
  // back white, a line of light along its top; returns the bolts
  function lowBoard(g, gl, w, L, col, gk) {
    const B = boardB(), { W, NV, CY } = FXC, box = (...a) => fbox(g, ...a), hw = w / 2 + 0.08, at = (u, v, n) => new V3(u, v, n).applyMatrix4(B).toArray(); let n = 0;
    gl(1.3); box(0, 0, -0.02, 2 * hw, 0.012, 0.44, [0.24, 0.25, 0.27], [0.29, 0.3, 0.32]); gl(PAINT); hazard(g, [hw, 0.014, -0.24], [-1, 0, 0], [0, 0, 1], 2 * hw, 0.045, 0.07, [0, -1, 0]);
    gl(METAL); for (const x of [-hw + 0.07, hw - 0.07, 0]) for (const z of [-0.17, 0.16]) { bolt(g, x, 0.012, z); n++; }
    gl(PAINT); for (const s of [-1, 1]) { const x = s * (w / 2 - 0.1); box(x, 0.012, -0.02, 0.06, 0.04, 0.4, NV); box(x, 0.052, 0.085, 0.06, 0.05, 0.05, NV); obox(g, [x, 0.052, -0.19], at(x, L * 0.72, -0.036), 0.035, 0.035, W); }
    gl(gk || SATIN); gBox(g, B, 0, L / 2, -0.0175, w, L, 0.035, col); gl(PAINT); gBox(g, B, 0, L / 2, -0.0362, w - 0.02, L - 0.02, 0.003, W); gBox(g, B, 0, L - 0.012, 0.0015, w - 0.05, 0.008, 0.003, CY);
    return n;
  }
  // the rim stand before the shelf toward the front wall (a piece; out of the home view, under the lines to the car): a navy board leaning back,
  // on its face the four rims on pegs in a row: serijska (silver, six spokes), črna (gloss black, ten, a bright lip), zlata (gold, six
  // pairs), karbon (a carbon face, five broad spokes, a red ring); its plate over them. Built in its own frame, set in place
  function buildRims() {
    const P = FREE.rims = piece(), g = P.g, gl = (k) => gloss(P, k), { ST } = FXC, RR = 0.155, L = 0.5, B = boardB(), M = M4(RMS.x, 0, RMS.z, 0, RMS.ry, 0);
    const C = [[0.66, 0.68, 0.72], [0.15, 0.15, 0.17], [0.86, 0.64, 0.2], [0.09, 0.09, 0.1]];
    P.near = 2.4; P.bolts = lowBoard(g, gl, RMS.w, L, FXC.NV);
    // (each rim built at the origin facing -z (the board's face at z 0, behind it), turned onto the board)
    C.forEach((c, kind) => { const v0 = g.P.length / 3, zf = -0.1, n = [6, 10, 12, 5][kind], w = [0.045, 0.02, 0.018, 0.07][kind];
      gl(METAL); cylA(g, [0, 0, -0.03], 'z', 0.022, 0.06, 8, ST);
      gl(kind === 1 || kind === 3 ? PAINT : METAL); gAdd(g, new THREE.CylinderGeometry(RR, RR, 0.11, 24, 1, true), M4(0, 0, zf + 0.055, Math.PI / 2, 0, 0), c.map(v => v * 0.6));
      discZ(g, 0, 0, zf, RR - 0.024, RR + 0.006, 24, kind === 3 ? [0.78, 0.1, 0.08] : kind === 1 ? [0.6, 0.62, 0.66] : c, -1); discZ(g, 0, 0, zf + 0.06, 0.04, RR, 24, [0.025, 0.025, 0.03], -1);
      for (let k = 0; k < n; k++) { const a = k / n * TAU + (kind === 2 ? (k & 1) * 0.14 : 0), m = M4(0, 0, zf + 0.02, 0, 0, a);
        if (kind === 3) gAdd(g, new THREE.BoxGeometry(w, RR - 0.07, 0.022, 2, 3, 1), m.multiply(M4(0, (RR + 0.05) / 2, 0)), carbonCol); else gBox(g, m, 0, (RR + 0.04) / 2, 0, w, RR - 0.06, 0.022, c); }
      cylA(g, [0, 0, zf + 0.01], 'z', 0.055, 0.035, 16, c); gl(PAINT); cylA(g, [0, 0, zf - 0.012], 'z', 0.028, 0.012, 12, kind === 2 ? [0.08, 0.08, 0.09] : [0.18, 0.19, 0.21]);
      gl(METAL); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; cylA(g, [Math.cos(a) * 0.04, Math.sin(a) * 0.04, zf - 0.009], 'z', 0.007, 0.012, 6, [0.8, 0.82, 0.86]); }
      placeGB(g, v0, B.clone().multiply(M4((kind - 1.5) * 0.37, 0.185, 0, 0, Math.PI, 0))); });
    placeGB(g, 0, M);
    { const p = new V3(0, L - 0.052, 0.004).applyMatrix4(B).applyMatrix4(M); addPlate(P, 2, p.x, p.y, p.z, RMS.ry, 0.36, -TILT); }
    BLOBS.push([RMS.x, RMS.z - 0.02, RMS.w + 0.4, 0.75, 0.6, RMS.ry, P]);
  }
  // the kit stand beside the rim stand (a piece; out of the home view, under the lines to the car): a matte grey board
  // leaning back (the black parts read on it), the four aero kits on it two by two, each bigger and more round the car: a car's side in
  // mid grey with a navy line round it and dark wheels, the kit's parts in black carbon standing off the board on brackets as the real
  // ones stand off the body (1: a lip and a ducktail; 2: a lip and a wing on two stalks; 3: a splitter with canards, skirts and a GT
  // wing; 4: a big splitter, skirts, wide arches, a diffuser and a wing on two swan necks), a gold dot a level under each; its plate over
  // them. Built in its own frame, set in place
  function buildKits() {
    const P = FREE.kits = piece(), g = P.g, gl = (k) => gloss(P, k), L = 0.5, B = boardB(), M = M4(KTS.x, 0, KTS.z, 0, KTS.ry, 0), S = 0.4, GD = PAL.gold, BK = [0.05, 0.05, 0.055], MG = [0.11, 0.12, 0.14];
    P.near = 2.4; P.bolts = lowBoard(g, gl, KTS.w, L, [0.26, 0.27, 0.29], MATTE);   // (matte: it does not shine under the lamps)
    [[-0.18, 0.21], [0.18, 0.21], [-0.18, 0.01], [0.18, 0.01]].forEach(([cu, cv], lv) => {
      // (the cell's frame F on the board: u along the car (its nose +u), v up, n out of the board; the car's outline in units of S)
      const F = B.clone().multiply(M4(cu, cv + 0.04, 0)), p = (u, v, n) => new V3(u * S, v * S, n).applyMatrix4(F).toArray(), back = p(0, 0.08, -1);
      const part = (u0, u1, v0, v1, n0, n1, col) => gBox(g, F, (u0 + u1) / 2 * S, (v0 + v1) / 2 * S, (n0 + n1) / 2, (u1 - u0) * S, (v1 - v0) * S, n1 - n0, col || BK);
      // (a bar along the points Q in the board's plane, t thick, from n0 out to n1)
      const bar = (Q, n0, n1, t, col) => { for (let k = 0; k + 1 < Q.length; k++) { const [a0, b0] = Q[k], [a1, b1] = Q[k + 1], l = Math.hypot(a1 - a0, b1 - b0) * S;
        gBox(g, F.clone().multiply(M4((a0 + a1) / 2 * S, (b0 + b1) / 2 * S, 0, 0, 0, Math.atan2(b1 - b0, a1 - a0))), 0, 0, (n0 + n1) / 2, l + t * 0.6, t, n1 - n0, col || BK); } };
      // the car's side (filled from its middle), the navy line round it, the wheels (dark, a grey rim)
      const O = [[0.37, 0.025], [0.37, 0.065], [0.21, 0.09], [0.07, 0.165], [-0.14, 0.17], [-0.29, 0.11], [-0.37, 0.1], [-0.37, 0.025]], c0 = p(0, 0.08, 0.003);
      gl(PAINT); for (let k = 0; k < O.length; k++) { const a = O[k], b = O[(k + 1) % O.length]; g.triO(c0, p(a[0], a[1], 0.003), p(b[0], b[1], 0.003), MG, back); }
      bar(O.concat([O[0]]), 0.002, 0.007, 0.008, FXC.NV);
      for (const wu of [-0.22, 0.22]) for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, b = (k + 1) / 14 * TAU, w = (t, r) => p(wu + Math.cos(t) * r, 0.025 + Math.sin(t) * r, 0.008);
        g.triO(p(wu, 0.025, 0.008), w(a, 0.035), w(b, 0.035), [0.42, 0.43, 0.46], back); g.quadO(w(a, 0.035), w(b, 0.035), w(b, 0.062), w(a, 0.062), [0.07, 0.07, 0.08], back); }
      // the kit (n: out from the board, as the real parts stand off the body; v under 0: below the sills)
      gl(SATIN);
      if (lv < 2) part(0.24, 0.4, 0.0, 0.018, 0.003, 0.055);
      if (lv === 0) part(-0.38, -0.31, 0.1, 0.125, 0.003, 0.055);
      if (lv === 1) { part(-0.42, -0.25, 0.165, 0.182, 0.008, 0.078); for (const n of [0.02, 0.066]) bar([[-0.33, 0.105], [-0.335, 0.168]], n - 0.004, n + 0.004, 0.01); }
      if (lv === 2) { part(0.25, 0.42, -0.012, 0.012, 0.003, 0.075); part(0.33, 0.39, 0.045, 0.058, 0.055, 0.085); part(-0.17, 0.17, -0.008, 0.016, 0.003, 0.06);
        part(-0.46, -0.21, 0.232, 0.252, 0.006, 0.088); for (const n of [0.02, 0.074]) bar([[-0.29, 0.105], [-0.31, 0.234]], n - 0.004, n + 0.004, 0.011); }
      if (lv === 3) { part(0.24, 0.45, -0.018, 0.01, 0.003, 0.085); part(-0.18, 0.18, -0.012, 0.018, 0.003, 0.07);
        for (const wu of [-0.22, 0.22]) { const Q = []; for (let k = 0; k <= 7; k++) { const a = k / 7 * Math.PI; Q.push([wu + Math.cos(a) * 0.088, 0.025 + Math.sin(a) * 0.088]); } bar(Q, 0.003, 0.05, 0.012); }
        part(-0.45, -0.32, -0.03, 0.022, 0.003, 0.07); for (const u of [-0.43, -0.39, -0.35]) part(u - 0.004, u + 0.004, -0.045, 0.022, 0.058, 0.073);
        part(-0.47, -0.19, 0.27, 0.292, 0.004, 0.092); for (const n of [0.02, 0.076]) bar([[-0.3, 0.105], [-0.31, 0.3], [-0.33, 0.318], [-0.355, 0.296]], n - 0.004, n + 0.004, 0.011); }
      gl(METAL); for (let k = 0; k <= lv; k++) part(0.18 + k * 0.045, 0.21 + k * 0.045, 0.235, 0.265, 0.003, 0.012, GD);
    });
    placeGB(g, 0, M);
    { const p = new V3(0, L - 0.052, 0.004).applyMatrix4(B).applyMatrix4(M); addPlate(P, 3, p.x, p.y, p.z, KTS.ry, 0.35, -TILT); }
    BLOBS.push([KTS.x, KTS.z - 0.02, KTS.w + 0.4, 0.75, 0.6, KTS.ry, P]);
  }
  // the plates: each a quad in its piece (P) at x, y, z facing ry (0: +z), w wide, its name (i: ORODJA, DELI, PLATIŠČA, AERO PAKETI) in the
  // page's language: drawPlates again when it changes
  function addPlate(P, i, x, y, z, ry, w, rx) { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.92, 0.92, 0.92) })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry, 0, 'YXZ'); m.material.userData.noCube = true; P.root.add(mainOnly(m)); FX.plates.push({ i, c, t, s: '' }); }
  function drawPlates() {
    const tr = (s) => typeof Lang !== 'undefined' ? Lang.tr(s) : s, T = [tr('ORODJA'), tr('DELI'), tr('PLATIŠČA'), tr('AERO PAKETI')];
    for (const p of FX.plates) { const g = p.c.getContext('2d'), w = p.c.width, h = p.c.height; g.fillStyle = '#1b2b5c'; g.fillRect(0, 0, w, h); g.fillStyle = '#47c6ff'; g.fillRect(10, h - 9, w - 20, 3);
      g.fillStyle = '#f4f6fa'; g.font = 'italic 900 34px Roboto, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; p.s = T[p.i]; g.fillText(p.s, w / 2, h / 2 - 3, w - 30); p.t.needsUpdate = true; }
    FX.plateTxt = FX.plates.length ? FX.plates[0].s : ''; FX.plateLang = typeof Lang !== 'undefined' ? Lang.cur : 'sl';
  }
  // (the nests' lights each frame: written again only when a nest's state changes or one blinks)
  const NEST_C = { in: [0.3, 1.75, 0.55], out: [2.3, 0.82, 0.12], blink: [1.0, 3.4, 1.4] };
  function stepNests(dt) {
    let ch = FX.dirty.live; FX.dirty.live = false;
    for (const S of STN) for (const k of S.list) { const N = S.nests[k]; if (N.blink > 0) { N.blink = Math.max(0, N.blink - dt); ch = true; } }
    if (!ch) return;
    for (const S of STN) { const C = S.live.geometry.attributes.color, a = C.array;
      for (const k of S.list) { const N = S.nests[k], b = N.blink > 0 ? 0.5 + 0.5 * Math.cos((1.2 - N.blink) * 15) : 0, c0 = NEST_C[N.st], c = N.st === 'in' && N.blink > 0 ? NEST_C.blink.map((v, q) => lerp(c0[q], v, b)) : c0;
        for (let v = N.led[0]; v < N.led[1]; v++) a.set(c, v * 3); }
      const v0 = S.nests[S.list[0]].led[0]; C.updateRange.offset = v0 * 3; C.updateRange.count = (S.nests[S.list[S.list.length - 1]].led[1] - v0) * 3; C.needsUpdate = true; }
  }

  /* ---------------- the fixtures' moves (generators, as the shows' others): a robot to a pose, to its rest, a tool from its nest and
     back; what it holds; what it keeps clear of ---------------- */
  // (a pose's missing fields from the one it is in: its carriage, the tip, the way; the across with them unless a new way is given)
  function full(i, q, from) { const f = from || RB[i].p; return { x: q.x != null ? q.x : f.x, tip: v3(q.tip || f.tip), dir: v3(q.dir || f.dir).normalize(), up: q.up ? v3(q.up) : q.dir ? null : f.up ? f.up.clone() : null, hint: q.hint ? v3(q.hint) : null }; }
  // the car's body as the robots see it: in its own frame (along it from its middle, over its floor) on a 6 cm grid, each cell the
  // highest and the lowest of the body there, its upgrades' parts and its wheels of their own with it (a wing, a racer's open wheels):
  // each triangle put into the cells it covers (its corners, its edges every 5 cm, the cells' middles inside it); then the same spread k
  // cells round (T[k]: the highest of the (2k + 1)² round a cell, B[k] the lowest; a ball's test is one look). Made once a car (again
  // when its parts change), a few milliseconds a frame while it rests (planAhead), at once when asked before
  const CF = { st: 0.06, K: 6 };
  // (the car's meshes as the robots see it: its body's, its upgrades' parts' (not the light's pool on the floor), its wheels of their own)
  function carMeshes(cv) { const mesh = [...cv.probe.meshes]; for (const k of ['aero', 'motor']) { const g = cv.parts[k]; if (g) g.traverse(o => { if (o.isMesh && o.visible && o !== g.userData.pool) mesh.push(o); }); }
    for (const w of cv.wheels) if (w.obj) w.obj.traverse(o => { if (o.isMesh && o.visible) mesh.push(o); }); return mesh; }
  function* gridG(cv, ms) {
    const v = cv.v, st = CF.st, KM = CF.K, mesh = carMeshes(cv), inv = new THREE.Matrix4(), M = new THREE.Matrix4(), p = new V3(), tris = [];
    let t0 = performance.now(), x0 = 9, x1 = -9, z0 = 9, z1 = -9, top = -9, bot = 9;
    v.grp.updateMatrixWorld(true); inv.copy(v.grp.matrixWorld).invert();
    for (const m of mesh) { M.multiplyMatrices(inv, m.matrixWorld); const P = m.geometry.attributes.position, V = new Float32Array(P.count * 3);
      for (let j = 0; j < P.count; j++) { p.fromBufferAttribute(P, j).applyMatrix4(M); V[j * 3] = p.x; V[j * 3 + 1] = p.y; V[j * 3 + 2] = p.z;
        if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.z < z0) z0 = p.z; if (p.z > z1) z1 = p.z; if (p.y > top) top = p.y; if (p.y < bot) bot = p.y; }
      tris.push([V, m.geometry.index ? m.geometry.index.array : null]); }
    const ox = x0 - KM * st, oz = z0 - KM * st, nx = Math.ceil((x1 - ox) / st) + KM + 1, nz = Math.ceil((z1 - oz) / st) + KM + 1, T0 = new Float32Array(nx * nz).fill(-9), B0 = new Float32Array(nx * nz).fill(9);
    const put = (x, y, z) => { const c = Math.round((x - ox) / st) * nz + Math.round((z - oz) / st); if (y > T0[c]) T0[c] = y; if (y < B0[c]) B0[c] = y; };
    for (const [V, I] of tris) { const n = I ? I.length : V.length / 3;
      for (let t = 0; t < n; t += 3) { const a = (I ? I[t] : t) * 3, b = (I ? I[t + 1] : t + 1) * 3, c = (I ? I[t + 2] : t + 2) * 3;
        const ax = V[a], ay = V[a + 1], az = V[a + 2], bx = V[b], by = V[b + 1], bz = V[b + 2], cx = V[c], cy = V[c + 1], cz = V[c + 2];
        for (let s = 0; s < 3; s++) { const px = s ? s > 1 ? cx : bx : ax, py = s ? s > 1 ? cy : by : ay, pz = s ? s > 1 ? cz : bz : az, qx = s ? s > 1 ? ax : cx : bx, qy = s ? s > 1 ? ay : cy : by, qz = s ? s > 1 ? az : cz : bz, k = Math.max(1, Math.ceil(Math.hypot(qx - px, qz - pz) / 0.05));
          for (let j = 0; j < k; j++) put(px + (qx - px) * j / k, py + (qy - py) * j / k, pz + (qz - pz) * j / k); }   // (its corners, its edges)
        const d = (bx - ax) * (cz - az) - (cx - ax) * (bz - az); if (Math.abs(d) > 1e-7)   // (the cells' middles inside it: its height there)
          for (let i = Math.ceil((Math.min(ax, bx, cx) - ox) / st), i1 = Math.floor((Math.max(ax, bx, cx) - ox) / st); i <= i1; i++)
            for (let j = Math.ceil((Math.min(az, bz, cz) - oz) / st), j1 = Math.floor((Math.max(az, bz, cz) - oz) / st); j <= j1; j++) {
              const x = ox + i * st, z = oz + j * st, u = ((x - ax) * (cz - az) - (cx - ax) * (z - az)) / d, w = ((bx - ax) * (z - az) - (x - ax) * (bz - az)) / d;
              if (u >= -1e-6 && w >= -1e-6 && u + w <= 1 + 1e-6) { const y = ay + (by - ay) * u + (cy - ay) * w, q = i * nz + j; if (y > T0[q]) T0[q] = y; if (y < B0[q]) B0[q] = y; } }
        if (!(t % 3000) && performance.now() - t0 > ms) { yield; t0 = performance.now(); } } }
    const T = [T0], B = [B0];   // (spread: one more cell round at a time, along it, then across)
    for (let k = 1; k <= KM; k++) { const tp = T[k - 1], bp = B[k - 1], ta = new Float32Array(nx * nz), ba = new Float32Array(nx * nz), tb = new Float32Array(nx * nz), bb = new Float32Array(nx * nz);
      for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const c = a * nz + b, l = a ? c - nz : c, h = a < nx - 1 ? c + nz : c; ta[c] = Math.max(tp[l], tp[c], tp[h]); ba[c] = Math.min(bp[l], bp[c], bp[h]); }
      for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const c = a * nz + b, l = b ? c - 1 : c, h = b < nz - 1 ? c + 1 : c; tb[c] = Math.max(ta[l], ta[c], ta[h]); bb[c] = Math.min(ba[l], ba[c], ba[h]); }
      T.push(tb); B.push(bb); }
    return { T, B, h: T0, nx, nz, st, ox, oz, x0, x1, hw: Math.max(z1, -z0), top, bot };
  }
  function bodyGrid(cv) { if (cv.hgrid) return cv.hgrid; const g = gridG(cv, 1e9); let r; do r = g.next(); while (!r.done); return (cv.hgrid = r.value); }
  // (how deep a ball (the world's x, y, z, its radius r) goes into the car (C: its field and where the car is now): one look at the cell
  // under its middle in the field spread as far as its radius says whether any is near; then each cell under it, a box from the
  // lowest to the highest of the body there)
  function carPen(C, x, y, z, r) { const G = C.G, st = G.st, u = (x - C.cx - G.ox) / st, w = (z - G.oz) / st, a = Math.round(u), b = Math.round(w); if (a < 0 || b < 0 || a >= G.nx || b >= G.nz) return 0;
    const k = Math.min(CF.K, Math.ceil(r / st)), c = a * G.nz + b, t = G.T[k][c], yy = y - C.ly; if (t < -8 || yy - r > t || yy + r < G.B[k][c]) return 0;
    const T0 = G.T[0], B0 = G.B[0], m = Math.ceil(r / st + 0.5), h = st / 2; let pen = 0;
    for (let i = Math.max(0, a - m), i1 = Math.min(G.nx - 1, a + m); i <= i1; i++) { const ex = Math.abs(u - i) * st, dx = Math.max(0, ex - h); if (dx >= r) continue;
      for (let j = Math.max(0, b - m), j1 = Math.min(G.nz - 1, b + m); j <= j1; j++) { const q = i * G.nz + j, tp = T0[q]; if (tp < -8) continue; const ez = Math.abs(w - j) * st, dz = Math.max(0, ez - h), lo = B0[q], dy = yy > tp ? yy - tp : yy < lo ? lo - yy : 0;
        const d = dx > 0 || dy > 0 || dz > 0 ? Math.hypot(dx, dy, dz) : -Math.min(h - ex, h - ez, tp - yy, yy - lo); if (r - d > pen) pen = r - d; } }
    return pen; }
  // (the car's box in the world (null with none): its ends, its half width, its highest and its lowest, its parts and wheels with it)
  function carBox() { const cv = cur; if (!cv) return null; const G = bodyGrid(cv), x = cv.root.position.x, y = cv.v.grp.position.y; return { x0: x + G.x0, x1: x + G.x1, hw: G.hw, top: y + G.top, bot: y + G.bot }; }
  // (what the robots keep clear of: the stands (FX.obst: { b: a box in the world, k: its stand (a robot working at a stand skips it) },
  // finer where an arm goes in among them), the lift's column with its power unit, the drying column while it is up, the stored
  // chamber's glass (its sides and corners, from the bands' lowest foot up); the car's body (its field), the other robot's links)
  const B3 = (a, b, c, d, e, f) => new THREE.Box3(new V3(a, b, c), new V3(d, e, f)), DRYB = new THREE.Box3();
  const COLB = [B3(-0.18, 0, -1.84, 0.18, 2.98, -1.6), B3(-0.21, 2.98, -1.9, 0.21, 3.09, -1.55), B3(-0.16, 0.6, -2.0, 0.1, 1.36, -1.83), B3(0.18, 0.95, -1.84, 0.28, 1.25, -1.6)];   // (the column, its cap, its power unit, its controls)
  const CHB = [B3(-2.36, 0, 2.25, 2.36, 4.4, 2.38), B3(-2.36, 0, -2.38, 2.36, 4.4, -2.25), B3(2.9, 0, -1.71, 3.03, 4.4, 1.71), B3(-3.03, 0, -1.71, -2.9, 4.4, 1.71)];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) CHB.push(B3(sx > 0 ? 2.35 : -3.03, 0, sz > 0 ? 1.7 : -2.38, sx > 0 ? 3.03 : -2.35, 4.4, sz > 0 ? 2.38 : -1.7));
  const bxd = (b, x, y, z) => { const dx = Math.max(b.min.x - x, x - b.max.x), dy = Math.max(b.min.y - y, y - b.max.y), dz = Math.max(b.min.z - z, z - b.max.z);
    return dx > 0 || dy > 0 || dz > 0 ? Math.hypot(Math.max(0, dx), Math.max(0, dy), Math.max(0, dz)) : Math.max(dx, dy, dz); };
  const _sp = new V3(), _sq = new V3();
  const segd = (p, a, b) => { _sq.subVectors(b, a); const L = _sq.lengthSq(), t = L > 1e-9 ? clamp(_sp.subVectors(p, a).dot(_sq) / L, 0, 1) : 0; return _sp.copy(a).addScaledVector(_sq, t).distanceTo(p); };
  // (the nearest two segments come, p1 q1 and p2 q2)
  const _s1 = new V3(), _s2 = new V3(), _s3 = new V3(), _s4 = new V3();
  function segSeg(p1, q1, p2, q2) { const d1 = _s1.subVectors(q1, p1), d2 = _s2.subVectors(q2, p2), r = _s3.subVectors(p1, p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r); let s = 0, t = 0;
    if (a > 1e-9 || e > 1e-9) { if (a <= 1e-9) t = clamp(f / e, 0, 1); else { const c = d1.dot(r); if (e <= 1e-9) s = clamp(-c / a, 0, 1);
      else { const b = d1.dot(d2), dn = a * e - b * b; s = dn > 1e-9 ? clamp((b * f - c * e) / dn, 0, 1) : 0; t = (b * s + f) / e; if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); } else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); } } } }
    return _s4.copy(p1).addScaledVector(d1, s).sub(r.copy(p2).addScaledVector(d2, t)).length(); }
  function roomBoxes(skip) { const L = COLB.map(b => [b, 'lift']); for (const o of FX.obst) if (!skip || !(skip.includes(o.k) || skip.includes(o.k.split('.')[0]))) L.push([o.b, o.k]);
    if (DRY.k > 1e-3) { DRYB.min.set(DRY.x - DRY.hx - 0.02, 0, DRY.z - DRY.hz - 0.02); DRYB.max.set(DRY.x + DRY.hx + 0.02, DRY.k * DRY.H, DRY.z + DRY.hz + 0.02); L.push([DRYB, 'dryer']); }
    const y0 = (CH.bot.length ? Math.min(...CH.bot) : CH.YS) - 0.03; for (const b of CHB) { b.min.y = y0; L.push([b, 'chamber']); }
    return L; }
  // (robot A's links as they are now (its J solved): [from, to, radius] each, its kind in L.k: the upper arm, the wrist's motors behind
  // the elbow, the forearm, the wrist's drum, the flange, the shoulder's drum, the elbow's, the counterbalance, the cable along the upper
  // arm and along the forearm ('arm'); then its tool (tool 'whole': all of it, as it sweeps on a way; 'shaft': short of its working end,
  // where it may touch what it works on; 'both': the two), what it holds (a ball round each) and with 'all' the turret (the other
  // robot's, seen from this one))
  const _lk = [], _fz = new V3(), _hm = new THREE.Matrix4();
  const flangeOf = (A, M) => { const J = A.J; _fz.crossVectors(J.ac, J.d); return M.makeBasis(J.ac, J.d, _fz).setPosition(J.Wc).multiply(_m4.makeTranslation(0, FLG + TL[A.tool], 0)); };   // (its tool's working end)
  function linksOf(A, tool, out) { const J = A.J, L = out || [], K = L.k || (L.k = []), e = A._le || (A._le = Array.from({ length: 14 }, () => new V3())), c = A._lc || (A._lc = Array.from({ length: 7 }, () => new V3()));
    const add = (a, b, r, k) => { L.push([a, b, r]); K.push(k); }; L.length = 0; K.length = 0; dressAt(A, c);
    e[0].copy(J.E).addScaledVector(J.f, -0.52); e[1].copy(J.Wc).addScaledVector(J.a5, -0.105); e[2].copy(J.Wc).addScaledVector(J.a5, 0.105); e[3].copy(J.Wc).addScaledVector(J.d, FLG);
    e[4].copy(J.S).addScaledVector(J.ax, -0.305); e[5].copy(J.S).addScaledVector(J.ax, 0.305); e[6].copy(J.E).addScaledVector(J.ax, -0.22); e[7].copy(J.E).addScaledVector(J.ax, 0.22);
    e[8].copy(J.B).addScaledVector(J.hd, -0.38).addScaledVector(J.ax, -CBZ).setY(1.0); e[9].copy(J.S).addScaledVector(J.u, 0.74).addScaledVector(J.ax, -CBZ);
    add(J.S, J.E, 0.21, 'arm'); add(e[0], J.E, 0.195, 'arm'); add(J.E, J.Wc, 0.15, 'arm'); add(e[1], e[2], 0.13, 'arm'); add(J.Wc, e[3], 0.115, 'arm');
    add(e[4], e[5], 0.26, 'arm'); add(e[6], e[7], 0.21, 'arm'); add(e[8], e[9], 0.085, 'arm'); add(c[2], c[4], 0.05, 'arm'); add(c[4], c[6], 0.05, 'arm');
    if (tool) { const k = A.tool, tv = A._lt || (A._lt = Array.from({ length: 12 }, () => new V3())); let n = 0;
      if (k !== 'none') { _fz.crossVectors(J.ac, J.d); const at = (x, y, z) => tv[n++].copy(e[3]).addScaledVector(J.ac, x).addScaledVector(J.d, y).addScaledVector(_fz, z), cut = TL[k] - 0.06;
        for (const [ax, ay, az, bx, by, bz, r] of TOOLC[k]) { const p = at(ax, ay, az), q = at(bx, by, bz);
          if (tool !== 'shaft') add(p, q, r, 'tool');
          if (tool === 'shaft' || tool === 'both') { const across = ay === by, top = Math.max(ay, by) + r;   // (short of its working end: what reaches past cut left out, a round part cut back)
            if (top <= cut) add(p, q, r, 'shaft'); else if (!across && ay + r < cut) add(p, at(bx, cut - r, bz), r, 'shaft'); } } }
      if (A.held.length) { flangeOf(A, _hm); A.held.forEach((o, j) => { const p = (A._lh || (A._lh = []))[j] || (A._lh[j] = new V3()); p.copy(o.userData.hc).applyMatrix4(_hm); add(p, p, o.userData.hr, 'held'); }); }
      if (tool === 'all') { e[11].set(J.x, 0.4, A.r.z); add(e[11], J.S, 0.38, 'turret'); } }
    return L; }
  // (the nearest the links L come to what is round them in X (negative: into it): each link a row of balls (no further apart than 0.8
  // of its radius, 8 cm for a thin one; grown by the gap between them and by gr) against the boxes its own box meets and against the car's
  // field, the link itself against the other robot's links; use(kind): what a kind of link is held against (1: the boxes and the other
  // robot, 2: the car); cap: as far as it looks (0: only how deep), stop: given up under it (a plan's gate))
  const _nb = [], _nk = [], GAPW = { k: '', li: -1 };   // (GAPW: what the nearest was, which link: for the tests' and the pictures' notes)
  function armGap(L, gr, X, use, cap, stop) {
    let m = cap; const K = L.k, e = Math.max(0, cap);
    for (let li = 0; li < L.length; li++) { const u = use(K[li]); if (!u) continue;
      const [a, b, r0] = L[li], len = a.distanceTo(b), n = Math.max(1, Math.ceil(len / Math.max(0.8 * r0, 0.08))), s = len / n / 2, r = 2 * r0 - Math.sqrt(Math.max(0, r0 * r0 - s * s)) + gr;
      const lx = Math.min(a.x, b.x) - r, hx = Math.max(a.x, b.x) + r, ly = Math.min(a.y, b.y) - r, hy = Math.max(a.y, b.y) + r, lz = Math.min(a.z, b.z) - r, hz = Math.max(a.z, b.z) + r;
      let nb = 0; if (u & 1) for (const [bb, bk] of X.BX) if (bb.min.x < hx + e && bb.max.x > lx - e && bb.min.y < hy + e && bb.max.y > ly - e && bb.min.z < hz + e && bb.max.z > lz - e) { _nk[nb] = bk; _nb[nb++] = bb; }
      const C = u & 2 && X.C && hx + 0.06 > X.C.x0 && lx - 0.06 < X.C.x1 && hz + 0.06 > X.C.z0 && lz - 0.06 < X.C.z1 && ly - 0.06 < X.C.y1 && hy + 0.06 > X.C.y0 ? X.C : null;
      if (nb || C) for (let j = 0; j <= n; j++) { const t = j / n, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t, z = a.z + (b.z - a.z) * t;
        for (let q = 0; q < nb; q++) { const d = bxd(_nb[q], x, y, z) - r; if (d < m) { m = d; GAPW.k = _nk[q]; GAPW.li = li; } }
        if (C) { const d = cap > 0 ? 0.06 - carPen(C, x, y, z, r + 0.06) : -carPen(C, x, y, z, r); if (d < m) { m = d; GAPW.k = 'car'; GAPW.li = li; } } }
      const ob = X.Ob; if (u & 1 && X.O && hx + e > ob.min.x && lx - e < ob.max.x && hy + e > ob.min.y && ly - e < ob.max.y && hz + e > ob.min.z && lz - e < ob.max.z)
        for (const [c, d, r2] of X.O) { const g = segSeg(a, b, c, d) - r0 - gr - r2; if (g < m) { m = g; GAPW.k = 'robot'; GAPW.li = li; } }
      if (m < stop) return m; }
    return m; }
  // (what robot i keeps clear of, made once a plan: the boxes ([box, key]; but the stands it works at, o.skip), the other robot's links
  // as it stands and their box, the car's field where the car is now)
  function planCtx(i, o) { const cv = cur, O = linksOf(RB[1 - i], 'all', []), Ob = new THREE.Box3();
    for (const [a, b, r] of O) Ob.expandByPoint(_sp.copy(a).addScalar(r)).expandByPoint(_sp.copy(a).addScalar(-r)).expandByPoint(_sp.copy(b).addScalar(r)).expandByPoint(_sp.copy(b).addScalar(-r));
    let C = null; if (cv) { const G = bodyGrid(cv), cx = cv.root.position.x, ly = cv.v.grp.position.y; C = { G, cx, ly, x0: cx + G.x0, x1: cx + G.x1, z0: -G.hw, z1: G.hw, y0: ly + G.bot, y1: ly + G.top }; }
    return { BX: roomBoxes(o && o.skip), O, Ob, C }; }
  // how near robot i's arm (its links, its tool's shaft, what it holds) comes to what is round it as it stands (its J solved): the stands
  // (o.skip: the ones it works at), the column, the raised drying column, the stored chamber, the other robot; the car's body (the arm's
  // links only: its tool reaches in to it; counted 6 cm off at the most); negative: into them
  const useClear = (k) => k === 'arm' ? 3 : k === 'tool' ? 0 : 1;
  function robotClear(i, o, X) { return armGap(linksOf(RB[i], 'shaft', _lk), 0, X || planCtx(i, o), useClear, 9, -9); }
  // a pose for robot i to put its tool's tip (o.tool's, else the one it holds) at tip, pointing dir (or any of o.dirs too: the best of
  // them): its carriage where the arm does it best (each place on its rail tried, 25 cm apart, then nearer round the best): in reach
  // first (a centimetre short weighs as much as 4 m of its ride), then clear (into anything weighs 10, and 1 more a centimetre; under
  // 6 cm a little) at the pose and backed off from it along the tool (o.back, 15 cm: the way in), then seen (as little of the car hidden
  // behind its arm from the camera (o.cam: a show's own, else the camera's now), the tip in sight, the wrist neither folded in tight nor
  // stretched (55 .. 85 % of its reach)), then near the tip's own x (or o.x); for the shows (o.skip: the stands it works at)
  // (the car seen from cam: points on its side toward the camera (five along it, at its sill, its middle, its roof's edge) and along
  // its roof, in the world where the car is now)
  const _vt = new V3();
  function viewPoints(cam) { const cv = cur; if (!cv) return carPoints().map(q => q.clone()); const K = cv.kit, x0 = cv.root.position.x, ly = cv.v.grp.position.y, s = Math.sign(cam.z) || 1, P = [];
    for (let j = 0; j < 5; j++) { const x = x0 + lerp(K.rear + 0.3, K.front - 0.3, j / 4); for (const y of [K.bottom + 0.15, (K.bottom + K.top) / 2, K.top - 0.12]) P.push(new V3(x, y + ly, s * K.hw * 0.85)); }
    for (let j = 0; j < 3; j++) P.push(new V3(x0 + lerp(K.rear + 0.6, K.front - 0.8, j / 2), K.top + ly - 0.02, 0));
    return P; }
  function robotPlan(i, tip, dir, o) {
    o = o || {}; const A = RB[i], r = A.r, J = A.J, keep = [A.p, A.tool, J.hd.clone(), J.a5.clone(), J.missMax], t = v3(tip), want = o.x != null ? o.x : t.x; let best = null;
    const cam = o.cam ? v3(o.cam) : camera.position.clone(), back = o.back != null ? o.back : 0.15, X = planCtx(i, o), cp = viewPoints(cam);
    if (o.tool) A.tool = o.tool;
    const gap = () => armGap(linksOf(A, 'shaft', _lk), 0, X, useClear, 0.1, -9);   // (as robotClear, near things only)
    for (const dd of [dir, ...(o.dirs || [])]) { const d = v3(dd).normalize(), tb = t.clone().addScaledVector(d, -back);
    const up = o.up ? v3(o.up) : Math.abs(d.y) < 0.9 ? new V3(d.z, 0, -d.x).normalize() : new V3(1, 0, 0);   // (its across, unless given: level, along the face it works on (a scanner's bar, a gripper's body along the car))
    const score = (x) => { J.hd.copy(keep[2]); J.a5.copy(keep[3]); A.p = { x, tip: tb, dir: d, up, hint: null }; solveRobot(i); const mb = J.miss, ca = mb > 0.03 ? -1 : gap();
      A.p = { x, tip: t, dir: d, up, hint: null }; solveRobot(i); const miss = Math.max(J.miss, mb); if (miss > 0.03) return { sc: 400 * miss + 50, x, miss, clear: -1, hid: 1 };
      const cl = Math.min(gap(), ca), D = J.Wc.distanceTo(J.S) / (RL1 + RL2), L = linksOf(A, 'whole', _lk); let n = 0;
      const hit = (q, tl) => L.some(([a, b, rr], j) => (tl || L.k[j] === 'arm') && segSeg(cam, q, a, b) < rr);   // (its links between the camera and q)
      for (const q of cp) if (hit(q, true)) n++;
      const tipHid = hit(_vt.copy(t).lerp(cam, 0.08 / Math.max(0.08, cam.distanceTo(t))), false), hid = n / cp.length;
      const sc = 400 * miss + (cl < 0 ? 10 + 100 * -cl : 0) + 4 * Math.max(0, 0.06 - cl) + 0.8 * hid + (tipHid ? 0.3 : 0) + 1.5 * Math.max(0, 0.55 - D) + 1.5 * Math.max(0, D - 0.85) + 0.03 * Math.abs(x - want);
      return { sc, x, d, up, miss: +miss.toFixed(3), clear: +cl.toFixed(3), hid: +hid.toFixed(2) }; };
    let bd = null; const tryX = (x) => { x = clamp(x, r.c0, r.c1); const s = score(x); if (!bd || s.sc < bd.sc) bd = s; };
    for (let x = r.c0; x <= r.c1 + 1e-6; x += 0.25) tryX(x); tryX(r.c1);
    for (const dx of [-0.12, 0.12, -0.06, 0.06]) tryX(bd.x + dx);
    if (!best || bd.sc < best.sc) best = bd; }
    [A.p, A.tool] = keep; J.hd.copy(keep[2]); J.a5.copy(keep[3]); solveRobot(i); J.missMax = keep[4];
    return { x: best.x, tip: t, dir: best.d, up: best.up, miss: best.miss, clear: best.clear, hid: best.hid };
  }
  // (the tool's turn: its way y, its across x)
  const _qm = new THREE.Matrix4(), _qPi = new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), Math.PI), _qy = new V3(0, 1, 0), _qx = new V3(1, 0, 0);
  function toolQuat(d, u) { const y = d.clone().normalize(), x = u.clone().addScaledVector(y, -u.dot(y)); if (x.lengthSq() < 1e-6) x.set(1, 0, 0).addScaledVector(y, -y.x); if (x.lengthSq() < 1e-6) x.set(0, 0, 1);
    x.normalize(); return new THREE.Quaternion().setFromRotationMatrix(_qm.makeBasis(x, y, new V3().crossVectors(x, y))); }
  // (robot i's way from P0 to P1 in a shape: 'line' (its working end along a line), 'cyl' (round the turret, as a robot's joints move:
  // drawn in first, then round, or round, then out; arg: the long way round), 'hop' (a line with an arc arg high over its middle: off P0
  // and onto P1 at a slant), 'bez' (through the point arg): at(e, W) the pose at e; the tool's way and its across turned together, the
  // shorter way (a tool that looks the same half turned round its axis, holding nothing: to the nearer of the two))
  const RZ = (t) => t * t * (3 - 2 * t), _pw = { x: 0, tip: new V3(), dir: new V3(), up: new V3(), hint: null }, _pq = new THREE.Quaternion();
  function wayOf(i, P0, P1, shape, arg) {
    const A = RB[i], J = A.J, r = A.r, l = TL[A.tool] + FLG, a = P0.tip, b = P1.tip, q0 = toolQuat(P0.dir, P0.up || J.ac), u1 = P1.up || acrossOf(i, P1); let q1 = toolQuat(P1.dir, u1);
    if (!A.held.length) { const qb = q1.clone().multiply(_qPi); if (Math.abs(q0.dot(qb)) > Math.abs(q0.dot(q1)) + 1e-6) q1 = qb; }
    const w0 = a.clone().addScaledVector(P0.dir, -l), w1 = b.clone().addScaledVector(P1.dir, -l), th0 = Math.atan2(w0.z - r.z, w0.x - P0.x), th1 = Math.atan2(w1.z - r.z, w1.x - P1.x), rq0 = Math.hypot(w0.x - P0.x, w0.z - r.z), rq1 = Math.hypot(w1.x - P1.x, w1.z - r.z);
    let dth = Math.atan2(Math.sin(th1 - th0), Math.cos(th1 - th0)); if (shape === 'cyl' && arg) dth -= Math.sign(dth) * TAU;
    const h = shape === 'hop' ? arg : 0, c = shape === 'bez' ? v3(arg).multiplyScalar(2).addScaledVector(a, -0.5).addScaledVector(b, -0.5) : null, ein = rq1 < rq0;
    const at = (e, W) => { W.x = lerp(P0.x, P1.x, e); W.hint = P1.hint; _pq.copy(q0).slerp(q1, e); W.dir.copy(_qy).applyQuaternion(_pq); W.up.copy(_qx).applyQuaternion(_pq); const k = 1 - e;
      if (shape === 'cyl') { const th = th0 + dth * smooth(ein ? 0.3 : 0, ein ? 1 : 0.7, e), q = lerp(rq0, rq1, smooth(ein ? 0 : 0.3, ein ? 0.7 : 1, e));   // (in first, then round; or round, then out)
        W.tip.set(W.x + q * Math.cos(th), lerp(w0.y, w1.y, e) + 0.2 * Math.sin(Math.PI * e), r.z + q * Math.sin(th)).addScaledVector(W.dir, l); }
      else if (shape === 'bez') W.tip.copy(a).multiplyScalar(k * k).addScaledVector(c, 2 * k * e).addScaledVector(b, e * e);
      else { W.tip.copy(a).lerp(b, e); if (h) W.tip.y += 4 * k * e * h; }
      return W; };
    return { at, a, b, P1, shape, arg, dx: Math.abs(P1.x - P0.x), rot: 2 * Math.acos(Math.min(1, Math.abs(q0.dot(q1)))) };
  }
  // (a way checked, the robot put back after: the arm solved along it finely enough that no point of it moves more than 4 cm from one
  // look to the next (each ball grown by 2 cm for what is between), its end too; how deep it goes into anything (pen), past what an end
  // that is a move's own is in already near it (within 25 cm, where only the tool's shaft is held against the car: the tool works close
  // to the body; ea: where it is, anything it is in; eb: where it was sent, only the car: a pose sent into anything else is never let
  // through) by more than a centimetre (bad); a jump from one look to the next (the turret flipped round, the wrist leaping: a way through
  // the turret's axis) never let through either; the most it is out of reach (miss, past its ends' own); the time it needs: the wrist (and
  // the elbow) at 1.7 m/s at the most, the working end 1.9, the turret 130 deg/s, the carriage 1.6 m/s, the tool's turn 150 deg/s (the
  // way is eased: its middle at half again the mean); gate: given up at the first fault)
  const useEnd = (k) => k === 'shaft' ? 2 : k === 'arm' || k === 'turret' ? 3 : 1, useMid = (k) => k === 'shaft' ? 0 : 3, useCar = (k) => k === 'shaft' || k === 'arm' ? 2 : 0, TOL = 0.01;
  const _wp = Array.from({ length: 5 }, () => new V3()), _wq = Array.from({ length: 5 }, () => new V3()), _ph = new V3(), _wb = new THREE.Box3();
  function wayCheck(i, w, X, gate, ea, eb) {
    const A = RB[i], J = A.J, keep = [A.p, J.hd.clone(), J.a5.clone(), J.missMax], W = _pw, reset = () => { J.hd.copy(keep[1]); J.a5.copy(keep[2]); };
    const track = (P) => { P[0].copy(J.tipA); P[1].copy(J.Wc); P[2].copy(J.E); P[3].copy(J.S).addScaledVector(J.ax, 0.45); P[4].copy(J.S).addScaledVector(J.ax, -0.45); };
    let dm = 0; const wb = _wb.makeEmpty(); reset();
    for (let j = 0; j <= 16; j++) { A.p = w.at(j / 16, W); solveRobot(i); track(_wq); if (j) for (let q = 0; q < 5; q++) dm = Math.max(dm, _wq[q].distanceTo(_wp[q])); for (let q = 0; q < 5; q++) { _wp[q].copy(_wq[q]); wb.expandByPoint(_wq[q]); } }
    let hr = 0; for (const o of A.held) hr = Math.max(hr, o.userData.hc.length() + o.userData.hr);
    wb.expandByScalar(0.5 + dm + hr); X = { BX: X.BX.filter(([b]) => b.intersectsBox(wb)), O: X.O, Ob: X.Ob, C: X.C };   // (only what the way's own box meets)
    const N = clamp(Math.ceil(16 * dm / 0.04), 6, 240), n0 = () => ea && J.tipA.distanceTo(w.a) < 0.25, n1 = () => eb && J.tipA.distanceTo(w.b) < 0.25;
    const pend = (e, use) => { reset(); A.p = w.at(e, W); solveRobot(i); return [Math.max(0, -armGap(linksOf(A, 'both', _lk), 0.02, X, use, 0, -9)), J.miss]; }, E0 = ea ? pend(0, useEnd) : [0, 0], E1 = eb ? pend(1, useCar) : [0, 0], me = Math.max(E0[1], E1[1]) + 0.005;
    let pen = 0, bad = 0, miss = 0, Lw = 0, Lt = 0, Th = 0, jump = 0, who = ''; reset(); WC.n++; WC.s += N;
    for (let j = 0; j <= N; j++) { A.p = w.at(j / N, W); solveRobot(i); track(_wq);
      if (j) { const dw = Math.max(_wq[1].distanceTo(_wp[1]), _wq[2].distanceTo(_wp[2])), dh = Math.acos(clamp(_ph.dot(J.hd), -1, 1)); Lw = Math.max(Lw, dw); Lt = Math.max(Lt, _wq[0].distanceTo(_wp[0])); Th = Math.max(Th, dh);
        if (dw > 0.15 || dh > 0.35) { jump++; who = 'jump@' + (j / N).toFixed(2); } }
      for (let q = 0; q < 5; q++) _wp[q].copy(_wq[q]); _ph.copy(J.hd); if (J.miss > miss) miss = J.miss;
      if (gate && (miss > me || jump)) break; if (!j) continue;
      const a0 = n0(), a1 = n1(), lim = TOL + Math.max(a0 ? E0[0] : 0, a1 ? E1[0] : 0), g = -armGap(linksOf(A, 'both', _lk), 0.02, X, a0 || a1 ? useEnd : useMid, 0, gate ? -lim - 1e-6 : -9);
      if (g > pen) { pen = g; who = GAPW.k + '.' + (_lk.k[GAPW.li] || '') + GAPW.li + '@' + (j / N).toFixed(2); } if (g > lim) { bad = Math.max(bad, g - lim); if (gate) break; } }
    A.p = keep[0]; J.hd.copy(keep[1]); J.a5.copy(keep[2]); solveRobot(i); J.missMax = keep[3];
    return { ok: bad === 0 && !jump && miss <= me, pen, bad, miss, jump, N, who, T: 1.5 * Math.max(N * Lw / 1.7, N * Lt / 1.9, N * Th / 2.3, w.dx / 1.6, w.rot / 2.6) };
  }
  const WC = { n: 0, s: 0 };   // (the ways checked, their looks: for the tests' costs)
  // robot i's way from P0 to P1 (via: 'straight' (a line), 'up' (over the car), a point it passes; o.skip: the stands it works at): legs,
  // each a way checked against what is round it. Straight at it first (as via says, else a line, round the turret either way, a hop over);
  // else through these: either end backed off (25 cm back along its tool) or lifted (to 1.35 m at least: over the stands, the drums),
  // the arm folded up over its carriage, or along its rail (either way), at either end's place; any two of them a leg, the carriage
  // moving 60 cm at the most on it but folded the same way (a ride). The quickest way through them by what each leg should take, its legs
  // checked; one that is not clear left out, the next quickest tried (lazily: few legs are checked). None clear: null (RB[i].fails
  // counts them: the tests see none). A generator: a few milliseconds a frame (the robot waits that long), at once with ms Infinity
  const RLOG = [];
  function* route(i, P0, P1, via, o, ms) {
    const X = planCtx(i, o), sg = Math.sign(P1.x - P0.x) || 1, memo = new Map(), bm = ms || 4; let t0 = performance.now(); RLOG.length = 0;
    const same = (P, Q) => Math.abs(P.x - Q.x) < 1e-3 && P.tip.distanceTo(Q.tip) < 1e-3 && P.dir.dot(Q.dir) > 0.99999;
    const R = (P) => ({ x: P.x, tip: P.tip.clone().addScaledVector(P.dir, -0.25), dir: P.dir.clone(), up: (P.up || acrossOf(i, P)).clone(), hint: P.hint });
    const Lf = (P) => ({ x: P.x, tip: P.tip.clone().setY(P.tip.y + clamp(1.35 - P.tip.y, 0.3, 0.9)), dir: P.dir.clone(), up: (P.up || acrossOf(i, P)).clone(), hint: P.hint });
    const auto = (Pa, Pb) => wrapsTurret(i, Pa, Pb) ? [['cyl', 0], ['cyl', 1], ['line'], ['hop', 0.3]] : [['line'], ['cyl', 0], ['hop', 0.3], ['hop', 0.6]];
    const check = (Pa, Pb, shapes) => { let best = null;
      for (const [s, arg] of shapes) { const w = wayOf(i, Pa, Pb, s, arg), c = wayCheck(i, w, X, true, Pa === P0, Pb === P1); Object.assign(w, c); if (c.ok) return w; if (!best || c.bad + c.miss < best.bad + best.miss) best = w; }
      return best; };
    if (via) { const sh = via === 'straight' ? [['line']] : via === 'up' ? (() => { const cb = carBox(); return [['hop', Math.max(0.2, (cb ? cb.top + 0.35 : 0) - Math.min(P0.tip.y, P1.tip.y))]]; })() : [['bez', v3(via)]];
      const w = check(P0, P1, sh); if (w.ok) return [w]; }
    // (the places: its two ends, each backed off and lifted, folded up and along the rail at either's place)
    const N = [P0, P1]; for (const P of [R(P0), R(P1), Lf(P0), Lf(P1), foldPose(i, P0.x), foldPose(i, P1.x), travelPose(i, P0.x, sg), travelPose(i, P1.x, sg), travelPose(i, P0.x, -sg), travelPose(i, P1.x, -sg)]) {
      const Q = N.find(M => same(P, M)); if (!Q) N.push(P); else if (P.fold && !Q.fold) Q.fold = P.fold; }   // (an end that is such a fold already: ridden to or from as one)
    const n = N.length, ride = (a, b) => a.fold && a.fold === b.fold && (a.fold === 'U' || Math.sign(a.tip.x - a.x) === Math.sign(b.tip.x - b.x));
    const can = (a, b) => Math.abs(a.x - b.x) <= 0.6 || ride(a, b), est = (a, b) => 0.4 + Math.max(a.tip.distanceTo(b.tip) / 1.2, Math.abs(a.x - b.x) / 1.1, (1 - a.dir.dot(b.dir)) * 1.5);
    const leg = (j, k) => { const key = j * 32 + k; if (!memo.has(key)) { const w = check(N[j], N[k], N[j].fold === 'T' && N[k].fold === 'T' && N[j].x !== N[k].x ? [['line']] : auto(N[j], N[k])); memo.set(key, w); RLOG.push([j, k, w.shape, w.ok, +w.pen.toFixed(3), +w.miss.toFixed(3), w.who]); } return memo.get(key); };
    // (the quickest way by what each leg costs: one checked, its own time (not clear: as given), else as it should take)
    const path = (bad) => { const D = new Array(n).fill(Infinity), from = new Array(n).fill(-1), done = new Array(n).fill(false); D[0] = 0;
      for (;;) { let u = -1; for (let j = 0; j < n; j++) if (!done[j] && D[j] < Infinity && (u < 0 || D[j] < D[u])) u = j; if (u < 0 || u === 1) break; done[u] = true;
        for (let k = 0; k < n; k++) { if (k === u || done[k] || !can(N[u], N[k])) continue; const m = memo.get(u * 32 + k), c = m ? (m.ok ? m.T : bad ? m.T + 100 * (m.bad + m.miss) : Infinity) : est(N[u], N[k]);
          if (D[u] + c < D[k]) { D[k] = D[u] + c; from[k] = u; } } }
      if (D[1] === Infinity) return null; const P = [1]; while (P[0] !== 0) P.unshift(from[P[0]]); return P; };
    for (let it = 0; it < 40; it++) { const P = path(false); if (!P) break; let ok = true;
      for (let j = 0; j + 1 < P.length; j++) { if (!memo.has(P[j] * 32 + P[j + 1]) && performance.now() - t0 > bm) { yield; t0 = performance.now(); } if (!leg(P[j], P[j + 1]).ok) { ok = false; break; } }
      if (ok) return P.slice(1).map((k, j) => leg(P[j], k)); }
    RB[i].fails = (RB[i].fails || 0) + 1; return null;
  }
  // the robot to pose q in s seconds at the least (or as long as its joints need), by route's legs: its carriage, the tip along each way,
  // the tool's way and across together. No clear way at all (a show's mistake: the tests see none): it is never moved through anything,
  // it steps aside (dissolves), is there, comes back. At work from its first move (its beacon amber) till robotRest; o.skip: the stands
  // it works at
  function* robotTo(i, q, s, via, o) {
    const A = RB[i], P1 = full(i, q); s = s == null ? 1.2 : s; A.rest = A.tuck = false; A.dirty = true;
    const P0 = { x: A.p.x, tip: A.p.tip.clone(), dir: A.p.dir.clone(), up: A.p.up ? A.p.up.clone() : A.J.ac.clone(), hint: null }, legs = yield* route(i, P0, P1, via, o);
    if (!legs) { A.lastPath = { mode: 'blink', pen: 0, T: 0, ok: false, legs: 0 }; A.blink = true; while (A.P.k < 0.999) yield; A.p = P1; A.dirty = true; yield; A.blink = false; return; }
    const T0 = legs.reduce((t, L) => t + L.T, 0), f = Math.max(1, s / Math.max(1e-3, T0)), W = A.pw || (A.pw = { x: 0, tip: new V3(), dir: new V3(), up: new V3(), hint: null });
    A.lastPath = { mode: legs.map(L => L.shape).join('+'), pen: +Math.max(0, ...legs.map(L => L.pen)).toFixed(3), T: +(T0 * f).toFixed(2), ok: legs.every(L => L.ok), legs: legs.length };
    for (const L of legs) { const Pa = { x: A.p.x, tip: A.p.tip.clone(), dir: A.p.dir.clone(), up: A.p.up ? A.p.up.clone() : A.J.ac.clone(), hint: null }, w = wayOf(i, Pa, L.P1, L.shape, L.arg), T = Math.max(0.05, L.T * f);
      SFX.servo(T * 0.9); yield* tween(T, (e) => { w.at(e, W); A.p = W; A.dirty = true; }, RZ);
      const E = w.at(1, W).up.clone(); A.p = { x: L.P1.x, tip: L.P1.tip.clone(), dir: L.P1.dir.clone(), up: E, hint: L.P1.hint }; A.dirty = true; }   // (the across it turned to: a tool that looks the same half turned may end so)
    if (!legs.length) { A.p = P1; A.dirty = true; }
  }
  // (whether the wrist's straight way passes closer by the shoulder than the arm folds (and than either end: the parked fold is tight), or
  // right over the turret (nearer its axis than 35 cm and than either end): then it goes round the turret instead)
  function wrapsTurret(i, P0, P1) {
    const r = RAILS[i], l = TL[RB[i].tool] + FLG, w = new V3(), d = new V3(), D = [], Q = []; let lo = 9, qlo = 9;
    for (let j = 0; j <= 12; j++) { const t = j / 12, x = lerp(P0.x, P1.x, t); d.copy(P0.dir).lerp(P1.dir, t).normalize(); w.copy(P0.tip).lerp(P1.tip, t).addScaledVector(d, -l); Q.push(Math.hypot(w.x - x, w.z - r.z)); D.push(Math.hypot(Q[j] - SHO, w.y - SHY)); }
    for (let j = 1; j < 12; j++) { lo = Math.min(lo, D[j]); qlo = Math.min(qlo, Q[j]); }
    return (lo < DMIN + 0.08 && lo < Math.min(D[0], D[12]) - 0.02) || (qlo < 0.35 && qlo < Math.min(Q[0], Q[12]) - 0.05);
  }
  // (folded over its carriage at its place: its tool first back in its nest; the beacon green)
  function* robotRest(i, s) { s = s || 1; const A = RB[i]; if (A.tool !== 'none') yield* toolPut(i, s); yield* robotTo(i, restPose(i), 1.6 * s); A.rest = true; A.dirty = true; }
  // (the across a pose ends with: solved aside, the robot left as it was)
  function acrossOf(i, P) { const A = RB[i], J = A.J, keep = [A.p, J.hd.clone(), J.a5.clone(), J.missMax]; A.p = P; solveRobot(i); const r = J.ac.clone(); A.p = keep[0]; J.hd.copy(keep[1]); J.a5.copy(keep[2]); solveRobot(i); J.missMax = keep[3]; return r; }
  // (where robot i's changer is over its nest k: dy over the coupling's seat, holding tool (or none), slid out toward its mouth by out;
  // its carriage at its station's place, the flange's across out of the fork (a scanner's bar, a gripper's body along it))
  function nestPose(i, k, dy, tool, out) {
    const N = STN[i].nests[k], ux = Math.cos(N.a), uz = Math.sin(N.a), o = out || 0;
    return { x: STN[i].rx, tip: [N.x - ux * o, N.yc + dy - TL[tool || 'none'], N.z - uz * o], dir: [0, -1, 0], up: [ux, 0, uz] };
  }
  // (an attribute's vertices v0 .. v1 sent again: joined to a range already waiting (one range an attribute))
  function sendRange(a, v0, v1) { const s = a.itemSize, r = a.updateRange, o = v0 * s, e = v1 * s; if (r.count > 0) { const e0 = r.offset + r.count; r.offset = Math.min(r.offset, o); r.count = Math.max(e0, e) - r.offset; } else { r.offset = o; r.count = e - o; } a.needsUpdate = true; }
  // (a tool to the robot: its mesh drawn where the flange is (it casts, it shows in the floor), the nest's folded to a point; back in its
  // nest: as the stand's again)
  function nestShow(S, k, on) { const a = S.live.geometry.attributes.position, [v0, v1] = S.nests[k].v;
    if (on) a.array.set(S.nestP.subarray(v0 * 3, v1 * 3), v0 * 3); else for (let v = v0 + 1; v < v1; v++) a.array.copyWithin(v * 3, v0 * 3, v0 * 3 + 3);
    sendRange(a, v0, v1); }
  // (robot i's own tool k: the stations hold their own robot's tools only; any other asked for is a show's mistake, said at once)
  const ownTool = (i, k) => { if (!STN[i].nests[k]) throw new Error('robot ' + i + ' has no ' + k + ' (its stand holds ' + STN[i].list.join(', ') + ')'); };
  function grab(i, k) { ownTool(i, k); const S = STN[i], T = S.tools[k]; RB[i].tool = k; S.nests[k].st = 'out'; FX.dirty.live = true; T.mesh.castShadow = true; T.mesh.layers.set(0); T.mesh.visible = true; nestShow(S, k, false); shadowDirty = 2; RB[i].dirty = true; }
  function drop(i, k) { const S = STN[i], T = S.tools[k]; T.mesh.matrix.copy(T.M0); T.mesh.matrixWorldNeedsUpdate = true; T.mesh.castShadow = false; T.mesh.layers.set(NOREFL); T.mesh.visible = false; nestShow(S, k, true); S.nests[k].st = 'in'; FX.dirty.live = true; shadowDirty = 2; }
  function attach(i, k) { const A = RB[i]; grab(i, k); A.p.tip = A.p.tip.clone().addScaledVector(A.p.dir, TL[k]); A.dirty = true; }
  function detach(i) { const A = RB[i], k = A.tool; A.tool = 'none'; A.p.tip = A.p.tip.clone().addScaledVector(A.p.dir, -TL[k]); drop(i, k); STN[i].nests[k].blink = 1.2; A.dirty = true; }
  // robot i takes tool k from its nest: over it (the way there clear of everything but its own stand), down onto the tool's coupling (a
  // clunk: it is the robot's, the nest amber), the tool lifted off the fork's pads, slid out of the fork, up (s: how long it all takes at
  // the least, x 4 s); toolPut: back into its nest the same way (the nest green, a blink), the changer up off it
  // (how high over its seat a tool held comes out and goes in: its working end over the stand's top)
  const upOf = (i, k) => Math.max(NUP, STN[i].nests[k].y + 0.16 - STN[i].nests[k].yc + TL[k]);
  function* toolPick(i, k, s) {
    ownTool(i, k); s = s || 1; if (RB[i].tool === k) return; if (RB[i].tool !== 'none') yield* toolPut(i, s); const o = { skip: [STN[i].key] };
    yield* robotTo(i, nestPose(i, k, NUP), 1.4 * s, null, o); yield* robotTo(i, nestPose(i, k, 0), 0.45 * s, 'straight', o); SFX.clunk(0.35); attach(i, k); yield* wait(0.15 * s);
    yield* robotTo(i, nestPose(i, k, LIFT_D, k), 0.25 * s, 'straight', o); yield* robotTo(i, nestPose(i, k, LIFT_D, k, SLIDE[k]), 0.55 * s, 'straight', o);
    yield* robotTo(i, nestPose(i, k, upOf(i, k), k, SLIDE[k]), 0.4 * s, 'straight', o);
  }
  function* toolPut(i, s) {
    const A = RB[i], k = A.tool; if (k === 'none') return; s = s || 1; const o = { skip: [STN[i].key] };
    yield* robotTo(i, nestPose(i, k, upOf(i, k), k, SLIDE[k]), 1.4 * s, null, o); yield* robotTo(i, nestPose(i, k, LIFT_D, k, SLIDE[k]), 0.4 * s, 'straight', o);
    yield* robotTo(i, nestPose(i, k, LIFT_D, k), 0.55 * s, 'straight', o); yield* robotTo(i, nestPose(i, k, 0, k), 0.25 * s, 'straight', o); SFX.clunk(0.25); detach(i); SFX.ping(1568); yield* wait(0.15 * s);
    yield* robotTo(i, nestPose(i, k, NUP), 0.45 * s, 'straight', o);
  }
  // a part held by robot i: o (any object) carried at its tool's working end (the flange's face with none) as it is now (grip: where it is
  // from there; home: where it was in the parent it came from; a ball round it for the plans), drawn in the room's frame meanwhile;
  // robotRelease: let go where it is into toParent (else back into the one it came from while that is still in the room, else the room),
  // or with 'home' back where it came from as it was there (a show cut short, a car to drive: a wheel back on its hub, not left in the air)
  const inRoom = (n) => { for (; n; n = n.parent) if (n === scene) return true; return false; };
  function robotHold(i, o) { const A = RB[i]; if (A.dirty) poseRobot(i); o.updateMatrixWorld(true); const F = flangeOf(A, new THREE.Matrix4()), Fi = F.clone().invert(), bb = new THREE.Box3().setFromObject(o);
    o.userData.from = o.parent || null; o.userData.home = o.matrix.clone(); o.userData.grip = Fi.clone().multiply(o.matrixWorld);
    o.userData.hc = bb.getCenter(new V3()).applyMatrix4(Fi); o.userData.hr = bb.getSize(new V3()).length() / 2;
    scene.add(o); o.matrixAutoUpdate = false; o.matrix.copy(o.matrixWorld); A.held.push(o); A.dirty = true; }
  function robotRelease(i, o, toParent) { const A = RB[i], j = A.held.indexOf(o); if (j < 0) return; A.held.splice(j, 1); const f = o.userData.from, back = f && inRoom(f), home = toParent === 'home' && back, to = toParent && toParent !== 'home' ? toParent : back ? f : scene;
    if (home) o.userData.home.decompose(o.position, o.quaternion, o.scale);
    else { to.updateMatrixWorld(true); o.updateMatrixWorld(true); _m4.copy(to.matrixWorld).invert().multiply(o.matrixWorld); _m4.decompose(o.position, o.quaternion, o.scale); }
    o.matrixAutoUpdate = true; o.userData.from = o.userData.home = null; to.add(o); A.dirty = true; }
  // at once (show(): a car set down; the pictures: _dbg.robotsPose): o.robots [pose | 'rest' | 'keep', ...] (a pose's tool: in its hand;
  // what the robot held back where it came from)
  function robotsSet(o) {
    o = o || {};
    if (o.robots) o.robots.forEach((q, i) => { const A = RB[i]; if (q === 'keep') return; if (q && q.tool && q.tool !== 'none') ownTool(i, q.tool); for (const h of A.held.slice()) robotRelease(i, h, 'home'); if (A.tool !== 'none') { drop(i, A.tool); A.tool = 'none'; }
      A.tuck = false; if (!q || q === 'rest') { A.p = restPose(i); A.rest = true; A.dirty = true; return; }
      if (q.tool && q.tool !== 'none') grab(i, q.tool); A.p = full(i, q, restPose(i)); A.rest = false; A.dirty = true; });
    for (const S of STN) for (const k of S.list) S.nests[k].blink = 0; FX.dirty.live = true; stepFixtures(0);
  }
  // the stands at once (show(): a car set down; the pictures: _dbg.fxPose): o.robots as robotsSet's, o.chamber and o.dryer (their k),
  // o.heat (the column's, straight to it; its hum with it), o.glow (the drums' lights: one for all or a list), o.col (the chamber's lights' colour)
  function fxSet(o) { o = o || {}; if (o.robots) robotsSet(o); if (o.chamber != null) setChamber(o.chamber); if (o.dryer != null) setDryer(o.dryer);
    if (o.heat != null) { DRY.want = DRY.heat = clamp(o.heat, 0, 1); heatCoils(); dryHum(); } if (o.glow != null) DRM.list.forEach((d, i) => drumGlow(i, Array.isArray(o.glow) ? o.glow[i] || 0 : o.glow));
    if (o.col !== undefined) chamberColor(o.col); stepFixtures(0); }
  const fxRest = () => fxSet({ robots: ['rest', 'rest'], chamber: 0, dryer: 0, heat: 0, glow: 0, col: null });
  const fxParked = () => RB.every(A => A.rest && !A.tuck && A.tool === 'none' && !A.held.length && Math.abs(A.p.x - REST_X[A.i]) < 1e-3) && CH.k === 0 && DRY.k === 0;
  // everything back to its place (a show cut short, a car to drive in): whatever a robot holds let go (back into what it came from: the
  // car's goes with the car), the column cooled and down; meanwhile the chamber up, then each robot's tool back in its nest, folded at
  // its place (both at once; they keep clear of the column while it sinks)
  function* fxPark(s) { s = s || 1; for (const A of RB) for (const h of A.held.slice()) robotRelease(A.i, h, 'home'); DRY.want = 0;
    yield* par(dryerTo(0, 2.4 * s), (function* () { yield* chamberTo(0, 3.2 * s); yield* par(robotRest(0, s), robotRest(1, s)); })()); }
  // the fixtures each frame: what moved posed again, the nests' lights, the chamber, the column (its heat and its fans on the shows' clock,
  // dts: a show hurried hurries them too), the shelf's parts in the car's colour, the plates' language
  function stepFixtures(dt, dts) {
    for (const A of RB) if (A.dirty) { A.dirty = false; poseRobot(A.i); }
    stepNests(dt); if (CH.dirty) poseChamber(); stepDryer(dts == null ? dt : dts);
    if (cur && SHF.mesh && cur.spec.color !== SHF.col) shelfColor(cur.spec.color);
    if (typeof Lang !== 'undefined' && Lang.cur !== FX.plateLang) drawPlates();
  }
  function buildFixtures() {
    buildRails(); buildRobot(0); buildRobot(1); buildRack(); buildStand(); buildChamber(); buildDryer(); buildDrums(); buildTowers(); buildShelf(); buildRims(); buildKits(); drawPlates();
    STANDS.push(FREE.drums, FREE.towers, FREE.shelf, FREE.rims, FREE.kits);
  }
  // (after the pieces are finished: the tools (each a mesh of its own, drawn while a robot holds it (it casts then, and shows in the
  // floor); the ones in a stand's nests one mesh with the stand, with its lights (they dissolve with it; too small to tell in the floor's
  // mirror, under the plate's shadow), a held one's vertices folded to a point there), the first poses (the robots' boxes theirs again))
  function finishFixtures() {
    FX.mats.tool = RB.map(A => fxMat(A.P.u));   // (a held tool dissolves with its robot)
    STN.forEach((S, si) => {
      let n = 0; const parts = [];
      S.list.forEach((k) => { const N = S.nests[k], geo = toolGeo(k), m = new THREE.Mesh(geo, FX.mats.tool[si]), X = new V3(Math.cos(N.a), 0, Math.sin(N.a)), Y = new V3(0, -1, 0), Z = new V3().crossVectors(X, Y);
        m.matrixAutoUpdate = false; m.matrix.makeBasis(X, Y, Z).setPosition(N.x, N.yc, N.z); m.matrixWorldNeedsUpdate = true; m.receiveShadow = true; m.visible = false; m.frustumCulled = false; m.layers.set(NOREFL); scene.add(m);
        S.tools[k] = { mesh: m, M0: m.matrix.clone() }; N.v = [n, n += geo.attributes.position.count]; FX.hide.push(m); parts.push(geo.clone().applyMatrix4(m.matrix)); });
      const lg = S.L.geometry(); lg.setAttribute('gloss', new THREE.BufferAttribute(new Float32Array(lg.attributes.position.count).fill(PAINT), 1)); S.L = null;
      const at = [...S.list.map(k => S.nests[k].v[0]), n], n0 = n; parts.push(lg); n += lg.attributes.position.count; for (const k of S.list) S.nests[k].led = S.nests[k].led.map(v => v + n0);
      const ng = new THREE.BufferGeometry(); for (const [nm, w] of [['position', 3], ['normal', 3], ['color', 3], ['gloss', 1]]) { const a = new Float32Array(n * w); parts.forEach((g, j) => { a.set(g.attributes[nm].array, at[j] * w); }); ng.setAttribute(nm, new THREE.BufferAttribute(a, w)); }
      parts.forEach(g => g.dispose()); ng.attributes.position.setUsage(THREE.DynamicDrawUsage); ng.attributes.color.setUsage(THREE.DynamicDrawUsage); ng.computeBoundingSphere(); S.nestP = ng.attributes.position.array.slice();
      S.live = new THREE.Mesh(ng, fxMat(S.P.u)); S.live.receiveShadow = true; S.P.root.add(mainOnly(S.live));
    });
    // (the stands: the drums' and the shelf's meshes (their lights, the car's colour), the drums dark, the obstacles the robots plan round)
    const mm = (p) => p.root.children.find(o => o.isMesh && o.geometry.attributes.gloss); DRM.mesh = mm(FREE.drums); SHF.mesh = mm(FREE.shelf); DRM.list.forEach((d, i) => drumGlow(i, 0));
    FX.obst = []; for (const k of ['drums', 'towers', 'shelf', 'rims', 'kits', 'stand', 'rack']) { const P = FREE[k]; for (const b of P.obst || [P.box]) FX.obst.push({ b, k }); for (const q in P.bays || {}) FX.obst.push({ b: P.bays[q], k: q }); }
    FX.dirty.live = true; CH.dirty = DRY.dirty = true; for (const A of RB) A.dirty = true; stepFixtures(0);
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
      roomPatch(sh, lay && 'vec4 lay = texture2D(tLay, vRp.xz * vec2(' + lu(x0, x1)[0] + ', ' + lu(z0, z1)[0] + ') + vec2(' + lu(x0, x1)[1] + ', ' + lu(z0, z1)[1] + ')); diffuseColor.rgb *= lay.r * 1.6 * (1.0 - 0.5 * smoothstep(0.0, 0.4, lay.b));', false);   // (vRp set before vRefl; wet: darker)
      sh.fragmentShader = (REF.depth ? '#define REFL_DEPTH\n' : '') + (lay ? '#define LAY\n' : '') + sh.fragmentShader
        .replace('#include <common>', ['#include <common>', 'uniform sampler2D tRefl; uniform sampler2D tLay; uniform float uReflK; uniform float uK; uniform float uRough; uniform float uMetal; uniform vec2 uTexel; varying vec4 vRefl;',
          'float rWet = 1.0;', 'float rFade(vec4 t) {',   // (a tap's weight: it fades with its gap, the alpha (25 a^2 metres); bright things keep a faint long smear; standing water keeps more)
          '#ifdef REFL_DEPTH',
          '  return max(exp(-2.5 * t.a * t.a * uRough * rWet), 0.18 * smoothstep(0.75, 1.5, dot(t.rgb, vec3(0.3333))));',
          '#else',
          '  return 1.0;',
          '#endif',
          '}'].join('\n'))
        .replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', [
          'outgoingLight = roomLight(outgoingLight, diffuseColor.rgb);',
          'vec2 ruv = vRefl.xy / vRefl.w; float bl = uRough, wet = 0.0;',
          '#ifdef LAY',   // (b: the wet: damp a little sharper and glossier, standing water (over 0.26) a mirror with a crisp edge)
          'wet = smoothstep(0.26, 0.4, lay.b); rWet = 1.0 - 0.9 * wet;',
          '#endif',
          'vec4 r0 = texture2D(tRefl, ruv);',
          '#ifdef REFL_DEPTH',   // (the blur's spot as the eye sees it: it grows with the gap, over the whole way to the eye; none at a contact; less in water)
          'float gap = 25.0 * r0.a * r0.a, dc = length(cameraPosition - vRp); bl *= 0.25 + 6.0 * gap / (gap + dc) * (1.0 - 0.5 * wet);',
          '#endif',
          '#ifdef LAY',
          'bl *= (1.0 + 2.5 * (1.0 - lay.g)) * mix(1.0 - 0.6 * lay.b, 0.1, wet); bl = max(bl, 1.2 * wet);',   // (water: a texel or two of blur at least: the half-size mirror's stair-stepped edges smoothed)
          '#endif',
          // (the middle and 7 taps on a golden-angle spiral turned per pixel, the resin's flecks jittering it: no banding, a fine grain)
          'float rot = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2832; vec2 j = (vec2(texelColor.r, fract(texelColor.r * 7.3)) - 0.5) * uTexel * 1.6 * bl * (1.0 - wet);',   // (standing water: no flecks' jitter: it frayed a bright reflection's edge)
          // (water: each tap held under 1.5 first: a lamp's mirror image is far over 1; blurred it still burnt out white with a hard edge, held
          // it is a soft glint)
          'float hc = mix(64.0, 1.5, wet), f = rFade(r0), ws = 1.0, fk = f; vec3 rc = min(r0.rgb, vec3(hc)) * f;',
          'for (int i = 1; i < 8; i++) { float a = float(i) * 2.39996 + rot, w = 1.0 / (1.0 + float(i) * 0.3); vec4 t = texture2D(tRefl, ruv + j + vec2(cos(a) * 0.6, sin(a) * 1.5) * (0.28 + float(i) * 0.32) * bl * uTexel);',
          '  f = rFade(t) * w; rc += min(t.rgb, vec3(hc)) * f; fk += f; ws += w; }',
          'rc /= ws; fk /= ws;',
          'vec3 vd = normalize(cameraPosition - vRp); float fr = 0.18 + 0.82 * pow(1.0 - clamp(vd.y, 0.0, 1.0), 4.0);',
          'float rk = fr * uReflK * uK;',
          '#ifdef LAY',
          'rk *= mix(lay.g * 1.27 * (1.0 + 0.6 * lay.b), 2.0, wet);',
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
    scene.add(new THREE.HemisphereLight(0xf3f2ef, 0x3a3631, 0.5));
    keyLight = new THREE.DirectionalLight(0xfff3e2, 0.85); keyLight.target.position.set(0, 0, 2); keyLight.position.copy(KEY_DIR).multiplyScalar(12).add(keyLight.target.position); keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024); const sc = keyLight.shadow.camera; sc.left = -9.8; sc.right = 9.8; sc.top = 8.6; sc.bottom = -8.6; sc.near = 2; sc.far = 30;
    sc.up.set(0, 0, -1);   // (the map's box square with the room: x across, z up the map)
    keyLight.shadow.bias = -0.0006; keyLight.shadow.normalBias = 0.03; keyLight.shadow.radius = 4; scene.add(keyLight, keyLight.target);
    const fill = new THREE.DirectionalLight(0xe4e4e2, 0.24); fill.position.set(-6, 3, 4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xecebe8, 0.42); rim.position.set(-2, 4, -8); scene.add(rim);
  }

  /* ---------------- the camera: round the car (the user drags it left and right only), moved by the animations ---------------- */
  const HOME = { yaw: 0.55, pitch: 0.18, dist: 9.2, tx: -0.2, ty: 0.62, tz: 0, fov: 33 };
  const rig = Object.assign({}, HOME), user = { yaw: 0, vy: 0 };
  function placeCamera(dt) {
    if (!user.drag) { user.yaw += user.vy * dt; user.vy *= Math.exp(-dt * 3); }
    const aspect = W / H, fov = rig.fov, th = Math.tan(fov * Math.PI / 360), need = 3.5 / (th * aspect), fit = Math.max(1, need / HOME.dist);
    const yaw = rig.yaw + user.yaw, pitch = clamp(rig.pitch, -0.12, 1.2), d = rig.dist * fit;   // (under 0: a show's look up at the car on the lift)
    camera.fov = fov; camera.aspect = aspect; camera.updateProjectionMatrix();
    const ty = rig.ty + Math.sin(time * 0.31) * 0.012;
    camera.position.set(rig.tx + Math.sin(yaw) * Math.cos(pitch) * d, ty + Math.sin(pitch) * d, rig.tz + Math.cos(yaw) * Math.cos(pitch) * d);
    if (camera.position.y < 0.18) camera.position.y = 0.18;
    // (always as far from the car: out beyond a wall the wall's things step aside, stepPieces)
    camera.lookAt(rig.tx, ty, rig.tz);
  }
  // a camera position: round a point of the car (car space; the car at height lf on the lift), rel radians further round it than the
  // view's own yaw (the table used to turn the car by rel; the camera goes round it now, so every view is as it was seen from the car)
  function view(o, rel, lf) {
    const p = o.at || [0, 0.6, 0];
    return { yaw: (o.yaw != null ? o.yaw : HOME.yaw) - (rel || 0), pitch: o.pitch != null ? o.pitch : HOME.pitch, dist: o.dist || HOME.dist, tx: p[0], ty: p[1] + (lf || 0), tz: p[2], fov: o.fov || HOME.fov };
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
    let id = null, lastX = 0, moved = 0, t0 = 0, tm = 0;   // (one finger turns it: a second one is ignored)
    const k = () => 3.2 / Math.max(240, el.clientWidth);
    el.addEventListener('pointerdown', (e) => { if (id !== null) { moved += 10; return; } id = e.pointerId; el.setPointerCapture(id); lastX = e.clientX; moved = 0; t0 = performance.now(); user.drag = true; user.vy = 0; });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      user.yaw -= dx * k(); user.vy = -dx * k() * 60 * 0.5; tm = performance.now();
    });
    // (let go: it swings on as it was flicked; held still first (no moves for a while), it stays)
    const up = (e) => { if (e.pointerId !== id) return; id = null; user.drag = false; if (performance.now() - tm > 80) user.vy = 0; if (moved < 8 && performance.now() - t0 < 300 && busy) speed = 3; };
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
  const ray = new THREE.Raycaster(), rayAll = new THREE.Raycaster(); rayAll.layers.enableAll();   // (rayAll: the car's small bits too, drawn by the main camera only)
  // where the body is: its box, the height of its top at (x, z), its underside's, the side at (x, y), the front and the back at (y, z)
  // (car space; probeOf: the same on any meshes)
  function bodyProbe(v) {
    v.grp.updateMatrixWorld(true);
    const meshes = []; v.bodyG.traverse(o => { if (o.isMesh && o.visible && o !== v.dec && !(v.dec && o.material === v.dec.material) && o !== v.tail) meshes.push(o); });
    return probeOf(meshes);
  }
  function probeOf(meshes, all) {
    const bb = new THREE.Box3(), rc = all ? rayAll : ray; for (const m of meshes) bb.expandByObject(m);
    const hit = (o, d) => { rc.set(o, d); rc.far = 20; const h = rc.intersectObjects(meshes, false); return h.length ? h[0].point : null; };
    return {
      bb, meshes,
      top: (x, z) => { const p = hit(new V3(x, 6, z), new V3(0, -1, 0)); return p ? p.y : null; },
      bottom: (x, z) => { const p = hit(new V3(x, -1, z), new V3(0, 1, 0)); return p ? p.y : null; },
      side: (x, y, sd) => { const p = hit(new V3(x, y, sd * 5), new V3(0, 0, -sd)); return p ? Math.abs(p.z) : null; },
      front: (y, z) => { const p = hit(new V3(8, y, z), new V3(-1, 0, 0)); return p ? p.x : null; },
      back: (y, z) => { const p = hit(new V3(-8, y, z), new V3(1, 0, 0)); return p ? p.x : null; },
    };
  }
  // the wheels: where they are, their size, the face of their outer side (the race draws the front ones (and all four of a formula,
  // a prototype) as meshes of their own; the other rear ones are in the body)
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
  // the sills, the bumpers' undersides, the wheels' feet: GROUND, the floor's height; up on the lift the car leaves it behind)
  const GROUND = { value: 0 };
  // (the race's wheels: their tyres' near-black lifted to a rubber grey, the rims as they are)
  function floorAO(c, key) {
    const ob = c.onBeforeCompile, rub = key === 'wheelRim';
    c.onBeforeCompile = (sh, r) => { ob.call(c, sh, r); sh.uniforms.uGround = GROUND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vGy;').replace('#include <project_vertex>', '#include <project_vertex>\nvGy = (modelMatrix * vec4(transformed, 1.0)).y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGround; varying float vGy;')
        .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb *= mix(0.45, 1.0, smoothstep(0.03, 0.62, vGy - uGround));\n#include <tonemapping_fragment>');
      if (rub) sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n{ float lr = dot(diffuseColor.rgb, vec3(0.3333)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.26, 0.26, 0.265), (1.0 - smoothstep(0.05, 0.12, lr)) * 0.9); }'); };
    c.customProgramCacheKey = () => key + (rub ? '|gao|rub' : '|gao');
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
    // when the car goes up on the lift, poseCar)
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
  const _dirtC = new THREE.Color();
  function setCond(cv, c, now) {   // the wear on the car: dirt (clean), scratches (body); the engine's state shows when it runs
    if (c) Object.assign(cv.spec.cond, c);
    const cc = cv.spec.cond, v = cv.v;
    if (v.dirtU) v.dirtU.value = (1 - clamp(cc.clean, 0, 1)) * 0.75;
    if (v.scrU) v.scrU.value = (1 - clamp(cc.body, 0, 1)) * 1.0;
    const d = v.dirtU ? v.dirtU.value : 0;   // (the wheels of their own get the mud the body's rear ones have)
    _dirtC.setRGB(1 - 0.3 * d, 1 - 0.38 * d, 1 - 0.5 * d);   // (each material's own colour muddied, never set: a shared model's tyres, trims and glass keep theirs)
    for (const w of cv.wheels) if (w.obj) w.obj.traverse(o => { const m = o.material; if (o.isMesh && m && m.color && !(m.userData && m.userData.own)) { if (!m.userData.c0) m.userData.c0 = m.color.clone(); m.color.copy(m.userData.c0).multiply(_dirtC); } });
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
    const hy = v.grp.position.y; cv.contact.material.opacity = 0.85 * (1 - smooth(0, 0.07, hy));   // (up on the lift: the tyres off the floor)
    const k = smooth(0, 0.9, hy), pl = cv.parts.motor && cv.parts.motor.userData.pool;
    if (v.blob) { v.blob.position.y = 0.012 - hy; v.blob.material.opacity = 0.9 * (1 - 0.65 * k); v.blob.scale.set(1 + 0.2 * k, 1, 1 + 0.3 * k); }   // (its shadow stays on the floor, softer and fainter the higher it is)
    if (pl) { pl.position.y = 0.016 - hy; pl.material.color.copy(pl.userData.c0).multiplyScalar(1 - 0.55 * k); pl.scale.set(1 + 0.2 * k, 1 + 0.3 * k, 1); }   // (the electric car's light under it: on the floor too, wider and fainter)
    const gp = cv.parts.gume; if (gp) for (const it of gp.userData.items) { const w = it.o.userData.wheel; if (w && !w.own) it.o.rotation.z = -cv.spin * w.sd; }   // (the rear wheels are in the body: their lettering turns)
  }

  /* ---------------- the parts of the upgrades on a car ---------------- */
  // the kit's places on this car: measured on its own body (so every car gets them where they fit)
  const WINGED = { rally: 1, formula: 1, lm: 1 };   // (a big wing of their own already: no second one on top)
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
          grp.userData.pool = pool; pool.userData.c0 = pool.material.color.clone();   // (on the floor when the car is up on the lift: poseCar)
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
        if (!K.winged) grp.add(item(lip, 'up'));
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
  function makeArch(cv, col) {   // (its legs inside 1.35 m of the middle: clear of the lift's stowed arms and its column; the truck's tyres clear)
    const K = cv.kit, g = new THREE.Group(), hw = Math.min(K.hw + 0.5, 1.27), hgt = K.top + 0.45;
    const fm = new THREE.MeshPhongMaterial({ color: col || 0xd9dde4, specular: 0xffffff, shininess: 90, envMap: env.texture || env, combine: THREE.MixOperation, reflectivity: 0.3 }); fm.userData.own = true;
    const ym = new THREE.MeshLambertMaterial({ color: 0x1e2a3a }); ym.userData.own = true;
    for (const sd of [-1, 1]) { mesh(bx(0.16, hgt, 0.16), fm, 0, hgt / 2, sd * hw, g); mesh(bx(0.5, 0.06, 0.16), ym, 0, 0.03, sd * hw, g); }
    mesh(bx(0.18, 0.18, hw * 2 + 0.16), fm, 0, hgt, 0, g);
    const lm = new THREE.MeshBasicMaterial({ color: emi(0x47c6ff, EMI.led) }); lm.userData.own = true;
    mesh(bx(0.03, 0.03, hw * 2 - 0.1), lm, 0.1, hgt - 0.1, 0, g);
    for (const sd of [-1, 1]) mesh(bx(0.03, hgt - 0.3, 0.03), lm, 0.1, hgt / 2, sd * (hw - 0.08), g);
    g.userData.noz = [];
    for (let i = 0; i < 7; i++) g.userData.noz.push({ p: new V3(0, hgt - 0.1, (i / 6 - 0.5) * (hw * 2 - 0.3)), d: new V3(0, -1, 0) });
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) g.userData.noz.push({ p: new V3(0, 0.25 + i * (hgt - 0.5) / 3, sd * (hw - 0.08)), d: new V3(0, -0.15, -sd) });
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
      // away at once: the car pulls out the instant the arrow is tapped, the camera easing home (the lift is down and its arms stowed:
      // every show ends so; after one cut short the robots park first (what they hold back on the car), then the car comes down)
      if (!fxParked()) yield* fxPark(0.8);   // (the robots parked: their tools in their nests, folded over their carriages)
      if (lift > 1e-3 || LIFT.on || LIFT.s > 1e-3) yield* liftDown(old, false);
      if (old) {
        engStart(old.M); lamps(old, 1, 0.3); old.shake = 0.6; eng.locked = false; eng.thr = 1;
        puffSmoke(old, 3, old.spec.cond.engine < 0.5);
        const acc = 7 + (old.M.kw || 250) / 110, T0 = 1.25;
        yield* par(home(0.6), (function* () {
          yield* tween(T0, (k, u) => {
            const t = u * T0, vel = acc * t, x = 0.5 * acc * t * t; old.spin += (x - old.root.position.x) / old.M.rw; old.root.position.x = x;
            old.pitch = 0.035 * Math.exp(-u * 3) * (1 - Math.exp(-u * 20)); eng.speed = vel; eng.rpm = old.M.idle + (old.M.redline - old.M.idle) * clamp(0.35 + vel / 30, 0, 0.95);
            if (Math.random() < 0.35 && u < 0.5) puffSmoke(old, 1, false);
          });
        })());
        lamps(old, 0, 0); old.root.visible = false;
      } else yield* home(0.6);
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
      planAhead(nw);   // (where the lift's pads go under it, measured while it stands: its first lift starts at once)
    }));
  }

  // an upgrade fitted (or taken off): the camera goes round to the place (the tyres and the brakes: the car up on the lift), the old parts
  // go, the new ones come, then it shows what they do
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
        // the camera round to the wheel while the lift's arms swing in under the sills (the column's foot between the wheels, not under
        // this one); the car up on the lift, the wheels free, the camera with it, looking up at it a little: from under the sills' line,
        // the pads and the arms holding the car in sight (a truck's behind its arches, a racer's under its side pods)
        const low = (pl, h) => { const ty = rig.ty + h - lift, d = camera.position.distanceTo(new V3(rig.tx, rig.ty, rig.tz)), yc = Math.min(...pl.pads.map(q => q[2])) + h - 0.15;
          return { ty, pitch: clamp(Math.asin(clamp((yc - ty) / d, -1, 1)), -0.12, rig.pitch) }; };
        yield* par(camTo(view(WHEEL_VIEW(cv), 0.3, lift), 1.2), liftUp(cv, 0.55, low));
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
      if (kind === 'aero' || kind === 'motor' || kind === 'gume') { if (kind !== 'gume') cv.lp = null; cv.hgrid = cv.lpG = null; planAhead(cv); }   // (the lift's pads planned again while the camera goes home: new skirts, light strips under the sills; the robots' view of the body with its new parts)
      hud('done', { kind, lv });
      yield* par(home(1.4), lift > 1e-3 || LIFT.s > 1e-3 ? liftDown(cv, false) : null);   // (off the lift: the car down, the arms out)
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
  // where the camera goes to show a zone of the car: round a point of the car, rel radians further round than the view's yaw
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
    return view(Object.assign({ yaw: HOME.yaw, fov: 33 }, V[1]), V[0], lift);
  }
  function* goZone(cv, kind, zone, s) { yield* camTo(zoneView(cv, kind, zone), (s || 1.1) + 0.1); }
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

  // the service: wash (clean), body (scratches), engine (up on the lift); all three in a row for a full service
  function service(items, cond) {
    return play(function* () {
      const cv = cur; if (!cv) return;
      const K = cv.kit;
      for (const it of items) {
        if (it === 'clean') {
          yield* camTo(view({ at: [0, 0.75, 0], yaw: HOME.yaw, pitch: 0.2, dist: 7.0 }, 0.55, lift), 1.1);
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
          yield* camTo(view({ at: [0, 0.7, 0], yaw: HOME.yaw + 0.1, pitch: 0.22, dist: 6.6 }, 0.55, lift), 1.1);
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
          // up on the lift (its arms in while the camera goes round low to the side, then the car up, the camera with it)
          const rel = 0.55 + 0.5;
          yield* par(camTo(view({ at: [0, 0.45, 0], yaw: HOME.yaw, pitch: 0.0, dist: 7.8 }, rel, lift), 1.3), liftUp(cv, 1.35, true));
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
          // down (the arms swing out while the mended engine is started)
          yield* par(lowerCar(cv, false), camTo(view({ at: [0, 0.6, 0], yaw: HOME.yaw, pitch: 0.12, dist: 6.4 }, rel, 0), 1.5));
          engStart(cv.M); lamps(cv, 1, 0.4); cv.shake = 1;
          yield* par(armsTo(0, 1.1), (function* () { yield* wait(0.3); yield* revs(cv, 2, false); yield* wait(0.4); })()); yield* carriageTo(LIFT.c0, 0.25);
          lamps(cv, 0, 0); engStop(); cv.shake = 0;
          hud('done', { kind: 'engine' });
        }
      }
      yield* home(1.2);
    });
  }

  // a new colour (and the stripes on or off): the paint arch runs along the car; behind it the car is the new colour (the new car's
  // body over the old one's, each cut at the arch: three.js clipping planes), a mist of the paint at the nozzles; then it dries
  function paint(color, stripe) {
    return play(function* () {
      const cv = cur; if (!cv) return;
      if (cv.spec.color === color && (cv.spec.stripe !== false) === (stripe !== false)) return;
      const K = cv.kit;
      yield* camTo(view({ at: [0, 0.7, 0], yaw: HOME.yaw, pitch: 0.16, dist: 6.9 }, 0.55, lift), 1.1);
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
      tt.add(nw.root); nw.root.position.copy(cv.root.position); cur = nw; tt.remove(cv.root); nw.lp = cv.lp; planAhead(nw);   // (the same body, the same parts: the lift's pads where they were (not measured yet: now))
      freeCar(cv);
      // drying under the lamps: a warm glow sweeping, glints on the fresh paint
      const warm = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow, color: 0xff9a3a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); warm.scale.set(7, 3, 1); scene.add(warm);
      yield* tween(1.2, (k, u) => { warm.material.opacity = 0.35 * Math.sin(u * Math.PI); warm.position.copy(carPt(nw, lerp(K.front, K.rear, u), K.top * 0.6, 0)); if (Math.random() < 0.5) sparkle(nw, 1); });
      scene.remove(warm); warm.material.dispose();
      sparkle(nw, 16); SFX.ping(2093); SFX.ping(2793);
      hud('done', { kind: 'paint' });
      yield* wait(0.6);
      yield* home(1.2);
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
    // paint's highlights; LDR: what is near white); and the air's light (with the depth: each pixel's ray back from it; soft, the
    // bloom's blur on it): the daylight in the air inside each door (a box, its density falling off into the room over 1.4 m, summed
    // along the ray exactly; the sunny right door's scattered forward, bright looking out into it, the shaded left door's even), the
    // sun's shafts from the front windows (8 jittered steps along the first 16 m of the ray inside the room)
    const vz = !!rt.depthTexture; POST.vol = { ivp: new THREE.Matrix4(), cam: new V3(), k: new THREE.Vector2(0.016, 0.1) };   // (k: the doors', the sun's)
    POST.bright = fsMat({ tD: { value: rt.texture }, uPx: { value: px }, tZ: { value: rt.depthTexture || null }, uIVP: { value: POST.vol.ivp }, uCam: { value: POST.vol.cam }, uAir: { value: POST.vol.k } }, 'uniform sampler2D tD; uniform vec2 uPx; varying vec2 vUv;'
      + ' vec3 bp(vec2 o){ vec3 c = texture2D(tD, vUv + o * uPx).rgb; return c * smoothstep(' + (HDR ? '1.2, 2.4' : '0.72, 1.0') + ', max(c.r, max(c.g, c.b))); }\n'
      + (vz ? ['uniform sampler2D tZ; uniform mat4 uIVP; uniform vec3 uCam; uniform vec2 uAir;', RL_SUN,
        'float doorVol(vec3 ro, vec3 rd, float L, float s){ vec3 lo = vec3(s > 0.0 ? 5.6 : -9.4, 0.0, -2.5), hi = vec3(s > 0.0 ? 9.4 : -5.6, 3.9, 2.5);',
        '  vec3 iv = 1.0 / (rd + vec3(1e-5)), ta = (lo - ro) * iv, tb = (hi - ro) * iv, mn = min(ta, tb), mx = max(ta, tb);',
        '  float t0 = max(max(mn.x, mn.y), max(mn.z, 0.0)), t1 = min(min(mx.x, mx.y), min(mx.z, L)); if (t1 <= t0) return 0.0;',
        '  float k = s * rd.x, e0 = exp((s * (ro.x + rd.x * t0) - 9.0) / 1.4), e1 = exp((s * (ro.x + rd.x * t1) - 9.0) / 1.4);',
        '  return abs(k) > 0.02 ? (e1 - e0) * 1.4 / k : e0 * (t1 - t0); }',
        'vec3 airLight(){ float z = texture2D(tZ, vUv).r; vec4 w = uIVP * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0); w.xyz /= w.w;',
        '  vec3 rd = w.xyz - uCam; float L = length(rd); rd /= L; L = min(L, 40.0);',
        '  float ph = 0.75 / pow(1.25 - dot(rd, ' + (() => { const v = new V3(1, 0.4, 0).normalize(); return 'vec3(' + [v.x, v.y, v.z].map(q => q.toFixed(4)).join(', ') + ')'; })() + '), 1.5);',
        '  vec3 a = (vec3(1.0, 0.92, 0.8) * ph * doorVol(uCam, rd, L, 1.0) + vec3(0.86, 0.92, 1.0) * 0.45 * doorVol(uCam, rd, L, -1.0)) * uAir.x;',
        // (the shafts: from where the ray comes into the room (the camera may stand out beyond a wall), 16 m on; seen looking toward the
        // sun, gone with it behind: there they would only veil the room)
        '  float hs = dot(rd, rlS); if (hs < -0.7) return a;',
        '  vec3 rlo = vec3(' + [ROOM.x0, 0, ROOM.z0].map(v => v.toFixed(2)).join(', ') + '), rhi = vec3(' + [ROOM.x1, ROOM.h, ROOM.z1 - 0.16].map(v => v.toFixed(2)).join(', ') + ');',
        '  vec3 ra = (rlo - uCam) / (rd + vec3(1e-5)), rb = (rhi - uCam) / (rd + vec3(1e-5)), r0 = min(ra, rb), r1 = max(ra, rb);',
        '  float s0 = max(max(r0.x, r0.y), max(r0.z, 0.0)), s1 = min(min(min(r1.x, r1.y), r1.z), min(L, s0 + 16.0)); if (s1 <= s0) return a;',
        '  float jt = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))), sn = 0.0, ds = (s1 - s0) * 0.125;',
        '  for (int i = 0; i < 8; i++) sn += rlSun(uCam + rd * (s0 + (float(i) + jt) * ds));',
        '  return a + vec3(1.0, 0.9, 0.75) * (0.75 / pow(1.25 - hs, 1.5)) * smoothstep(-0.7, 0.3, hs) * sn * ds * uAir.y; }'].join('\n') : 'vec3 airLight(){ return vec3(0.0); }')
      + '\nvoid main(){ gl_FragColor = vec4((bp(vec2(-1.0)) + bp(vec2(1.0, -1.0)) + bp(vec2(-1.0, 1.0)) + bp(vec2(1.0))) * 0.25 + airLight(), 1.0); }');
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
      '  c *= 1.0 + (mix(vec3(0.995, 1.0, 1.01), vec3(1.02, 1.0, 0.98), smoothstep(0.15, 0.6, l)) - 1.0) * (1.0 - s) * (1.0 - smoothstep(0.7, 0.95, l));',
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
    POST.vol.ivp.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse); POST.vol.cam.copy(camera.position);   // (the air light's rays)
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
    OUTK = HDR ? 1.75 : 1.25; makeRoomLight();
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
    buildLights(); buildFloor(); buildRoom(); buildTurntable(); buildFixtures(); buildDecor(); finishFixtures(); buildOutside(); buildPost();
    // the room in the cars' paint and glass: a cube map of it, made once from where a car's middle is (HDR: half-float, the lamps
    // just over 1 in it while it is made: brighter, the paint's highlights would glow and the glass go white; the cube's depth is 16-bit:
    // near 0.5)
    cubeRT = new THREE.WebGLCubeRenderTarget(192, { format: THREE.RGBAFormat, type: HDR ? THREE.HalfFloatType : THREE.UnsignedByteType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    const cc = new THREE.CubeCamera(0.5, 600, cubeRT); cc.position.set(0, 0.9, 0); scene.add(cc);
    const rk = REF.k.value, lc = lampMat.color.clone(); REF.k.value = 0; lampMat.color.multiplyScalar(Math.min(1, 1.3 / EMI.hex)); ttTop.visible = true; renderer.shadowMap.needsUpdate = true;
    // (no words in it: the glass would mirror them (the sign, the screens, the printed graphics: userData.noCube); the deck darker, a
    // bright lid over the car's roof and glass)
    const hid = [], dim = [], txt = [TX.sign, screen && screen.t, monTexObj];
    scene.traverse(o => { const m = o.material; if (!o.isMesh || !m || Array.isArray(m)) return;
      if (o.visible && (txt.includes(m.map) || (m.userData && m.userData.noCube))) { o.visible = false; hid.push(o); }
      else if (m.map === TX.deck) { dim.push([m, m.color.clone()]); m.color.multiplyScalar(0.5); } });
    if (signGlow && signGlow.visible) { signGlow.visible = false; hid.push(signGlow); }
    for (const o of [LIFT.piece.root, LIFT.mesh, ...FX.hide]) if (o.visible) { o.visible = false; hid.push(o); }   // (nor the lift, 1.7 m off: gone from the far side's view, its ghost would stay in the glass; nor the fixtures that move)
    cc.update(renderer, scene); REF.k.value = rk; lampMat.color.copy(lc); scene.remove(cc);
    for (const o of hid) o.visible = true; for (const [m, c] of dim) m.color.copy(c);
    env = cubeRT.texture; ENVU.value = env;
    for (const m of decorEnv) { m.envMap = env; m.needsUpdate = true; }
    makePartMats();
    puffs = new Puffs(1400, false); sparks = new Puffs(900, true); scene.add(puffs.pts, sparks.pts);
    Render.garageLight(new V3(1, 0.35, 0.1).normalize(), 0xffe2bc, 0.3, 0xffffff);   // (the glint on the paint and the glass, its fresnel rim: from the sunny right door, warm, low; overhead the rear glass seen from behind went white)
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
    if (!fxParked()) fxRest();   // (the robots parked: the tools in their nests, folded over their carriages; what they held back on the old car first)
    if (cur) freeCar(cur);
    if (lift || LIFT.on || LIFT.s || LIFT.c !== LIFT.c0) { lift = 0; Object.assign(LIFT, { s: 0, on: false, plan: null, c: LIFT.c0 }); poseLift(); }   // (the lift down, its arms stowed)
    cur = makeCar(spec); tt.add(cur.root); shadowDirty = 2;
    renderer.compile(scene, camera);   // (the shaders of what is hidden for now too: the lamps' glows, the sparks; no stutter when they show)
    planAhead(cur);
  }
  function frame(dt, noDraw) {
    if (!ready) return;
    dt = Math.min(dt, 0.05); time += dt;
    const dts = dt * Math.max(speed, busy > 1 ? 1.8 : 1) * fast; runTasks(dts);   // (more shows waiting: this one hurries)
    if (cur) idleSmoke(cur, dt);
    for (const cv of liveCars()) poseCar(cv, dt);
    stepFixtures(dt, dts);
    engFrame(dt);
    puffs.update(dt); sparks.update(dt); stepFlames(dt); stepGlints(dt);
    motes.material.uniforms.uT.value = time;
    ringGlow.material.uniforms.uK.value = GLOW.ring * (0.16 + 0.03 * Math.sin(time * 1.6));   // (the ring's halo breathing: within about 0.4 m)
    signGlow.material.userData.op = GLOW.sign * (0.94 + 0.08 * Math.sin(time * 2.3));
    if ((time * 4 | 0) !== ((time - dt) * 4 | 0)) drawScreen(time);   // (the big screen four times a second)
    if (autoSpin && !busy && !user.drag) rig.yaw += dt * 0.32;
    placeCamera(dt); stepPieces(dt); adaptExposure(dt);
    if (noDraw) return;
    const ri = renderer.info.render, post = POST.on && POST.rt, dirty = busy > 0 || moving() || shadowDirty > 0;   // (a show, a move, a piece gone or back)
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
    get idle() { return !busy && !moving() && !user.drag && !autoSpin && Math.abs(user.vy) < 0.01 && !flames.length && !glints.length; },   // (nothing moving but the dust: the page draws less often)
    sound(on) { sndInit(); if (SND.out) SND.out.gain.value = on ? 0.7 : 0; SND.vol = on ? 0.7 : 0; if (typeof Sfx !== 'undefined') { Sfx.resume(); Sfx.setEnabled(on); } },
    setCond(c) { if (cur) setCond(cur, c); },
    get cur() { return cur; },
    get info() { return cur ? { car: cur.M.id, color: cur.spec.color, stripe: cur.spec.stripe !== false, upg: Object.assign({}, cur.spec.upg), parts: Object.keys(cur.parts).reduce((o, k) => (o[k] = cur.parts[k].userData.items.length, o), {}), dirt: cur.v.dirtU ? +cur.v.dirtU.value.toFixed(3) : null, scr: cur.v.scrU ? +cur.v.scrU.value.toFixed(3) : null, lift: +lift.toFixed(3), ang: +tt.rotation.y.toFixed(3) } : null; },
    _dbg: { REF, TX, tasks, user, rig, pieces, WALLS, post: POST, stats: STATS, get floorMat() { return floorMat; }, get keyLight() { return keyLight; },
      // (the lift: one column, where it stands, its piece's box; the arms (0 stowed .. 1 at the pads), the carriage's level, the table's
      // height, the carriage's and the arms' nearest to the cars' lane (|z|); its parts for the pictures' checks; raise: the car put up
      // on it at once, as a show cut short would leave it)
      // (raw: the column's piece's nearest to the car (|z|) over all its vertices, not its box clipped to the column: a post put in front
      // of the car would show there; its meshes are in world space)
      get lift() { const b = LIFT.piece.box, zm = (o) => { const P = o.geometry.attributes.position.array; let z = -9; for (let i = 2; i < P.length; i += 3) z = Math.max(z, P[i]); return z; };
        let zr = -9; LIFT.piece.root.traverse(o => { if (o.isMesh) zr = Math.max(zr, zm(o)); });
        return { posts: pieces.filter(p => p.lift).length, x: LIFT.x, z: LIFT.z, box: [b.min.toArray(), b.max.toArray()], raw: +zr.toFixed(3), arms: +LIFT.s.toFixed(3), carriage: +LIFT.c.toFixed(3), on: LIFT.on, table: +tt.position.y.toFixed(3),
          lane: +(-Math.max(zm(LIFT.cmesh), zm(LIFT.mesh))).toFixed(3), gone: +LIFT.piece.k.toFixed(3), plan: LIFT.plan }; },
      raise(h) { if (!cur) return; Object.assign(LIFT, { plan: liftPlan(cur), s: 1, on: true }); setLift(h); },
      LIFT, PAD: { h: PADH, min: PMIN, cmin: CMIN }, armPose, liftPlan, planG, poseLift,
      // (the fixtures: each robot (its carriage on its rail, its tool, parked, the lowest point of its arm (the upper arm on), where its tip
      // is, how far out of reach (missMax: the most since it was last zeroed), the nearest it comes to the cars' lane (|z|, under 2 m up),
      // its carriage on its bed (its bearings on the rails' heads, on its rail's line), stepped aside, its shadow and its image in the
      // floor), the stations' nests (in / out) and their lights' colour, ORODJA's plate; lane: the nearest any fixture comes to the cars'
      // lane; parked: both robots at rest, no tool, nothing held; gone: the fixtures' pieces stepped aside now)
      get robots() { const v = new V3(); return RB.map(A => { const R = A.R, a = R.mesh.geometry.attributes.position.array; let low = 9, lane = 9, bed = 9;
          for (const [v0, v1, k] of R.runs) for (let j = v0; j < v1; j++) { const y = a[j * 3 + 1], z = a[j * 3 + 2]; if (k >= 2 && k <= 7) low = Math.min(low, y); if (k === 0) bed = Math.min(bed, y); if (y < 2) lane = Math.min(lane, Math.abs(z)); }
          for (let j = R.tail; j < a.length / 3; j++) if (a[j * 3 + 1] < 2) lane = Math.min(lane, Math.abs(a[j * 3 + 2]));
          v.copy(A.J.tipA); return { x: +A.J.x.toFixed(3), tool: A.tool, rest: A.rest, low: +low.toFixed(3), tip: v.toArray().map(q => +q.toFixed(3)), miss: +A.J.miss.toFixed(3), missMax: +A.J.missMax.toFixed(3),
            lane: +lane.toFixed(3), bed: +bed.toFixed(3), onRail: A.J.x >= A.r.c0 - 1e-6 && A.J.x <= A.r.c1 + 1e-6 && A.J.B.z === A.r.z, gone: +A.P.k.toFixed(3), cast: R.mesh.castShadow, refl: !!(R.mesh.layers.mask & 1), held: A.held.length }; }); },
      get fx() { const near = (m, M) => { M = M || m.matrixWorld; const a = m.geometry.attributes.position.array, v = new V3(); let z = 9; for (let i = 0; i < a.length; i += 3) { v.set(a[i], a[i + 1], a[i + 2]).applyMatrix4(M); if (v.y < 2) z = Math.min(z, Math.abs(v.z)); } return z; };
        const st = (S) => { const c = S.live.geometry.attributes.color.array, col = (k) => { const i = S.nests[k].led[0] * 3; return c[i + 1] > c[i] * 1.5 ? 'green' : c[i] > c[i + 1] * 1.5 ? 'amber' : '?'; };
          return { nests: S.list.reduce((o, k) => (o[k] = S.nests[k].st, o), {}), leds: S.list.reduce((o, k) => (o[k] = col(k), o), {}) }; };
        let lane = 9; for (const p of [FREE.rack, FREE.stand]) p.root.traverse(o => { if (o.isMesh && o.visible) lane = Math.min(lane, near(o)); });
        const R = this.robots, S = this.stands; for (const r of R) lane = Math.min(lane, r.lane); for (const k in S) lane = Math.min(lane, S[k].lane);
        return { robots: R, rack: Object.assign(st(STN[1]), { plate: FX.plateTxt }), stand: st(STN[0]), lane: +lane.toFixed(3), parked: fxParked(), gone: pieces.filter(p => (p === FREE.rack || p === FREE.stand || p.robot || STANDS.includes(p)) && p.k > 0.5).length }; },
      // (any pose at once, for the pictures: { robots: [pose | 'rest' | 'keep', ...] } (a pose's tool: in its hand))
      robotsPose(o) { robotsSet(o); },
      // (the stands: the chamber (k, its glass's lowest point, each band's foot, its header, drawn, its lights' colour); the column (k, the
      // heat, its top over the floor, the hatch's highest point (flush), drawn, casting); the drums (where, their colour, their light); each
      // stand (its box, its lowest point (its plate on the floor), the nearest it comes to the cars' lane over the floor (|z|), its bolts,
      // stepped aside); chamberClear: the nearest the chamber's glass comes to anything round it, where a band is (the robots, the drums,
      // the lift, the stands, the column))
      get chamber() { let lo = 9; const a = CH.glass.geometry.attributes.position.array; for (let i = 1; i < a.length; i += 3) lo = Math.min(lo, a[i]);
        const fc = CH.frame.geometry.attributes.color.array, l0 = CH.led[0][0] * 3;
        const rc = FX.rails.geometry.attributes.color.array, r0 = CH.ring[0] * 3, dr = (m) => m.geometry.drawRange.count === Infinity ? m.geometry.attributes.position.count : m.geometry.drawRange.count;
        return { k: +CH.k.toFixed(3), low: +lo.toFixed(3), bands: CH.bot.map(v => +v.toFixed(3)), BH: CH.BH, header: [CH.y0, CH.y1], drawn: CH.glass.visible && CH.frame.visible, col: CH.col.map(v => +v.toFixed(2)), led: [fc[l0], fc[l0 + 1], fc[l0 + 2]].map(v => +v.toFixed(2)),
          ring: [rc[r0], rc[r0 + 1], rc[r0 + 2]].map(v => +v.toFixed(2)), glassDrawn: dr(CH.glass), frameDrawn: dr(CH.frame), band0: [CH.gv[0][1], CH.fv[0][1]], tucked: RB.map(A => !!A.tuck), tools: RB.map(A => A.tool), mirror: !!(CH.frame.layers.mask & 1) || !!(CH.glass.layers.mask & 1) }; },
      get dryer() { const a = FX.rails.geometry.attributes.position.array; let lid = -9; for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - DRY.x) < 0.4 && Math.abs(a[i + 2] - DRY.z) < 0.7) lid = Math.max(lid, a[i + 1]);
        return { k: +DRY.k.toFixed(3), heat: +DRY.heat.toFixed(3), top: +(DRY.k * DRY.H).toFixed(3), lid: +lid.toFixed(4), drawn: DRY.R.mesh.visible, cast: DRY.R.mesh.castShadow, glow: DRY.glow.visible, x: DRY.x, z: DRY.z }; },
      get drums() { const C = DRM.mesh.geometry.attributes.color.array, Y = DRM.mesh.geometry.attributes.position.array; return DRM.list.map(d => ({ x: +d.x.toFixed(3), z: +d.z.toFixed(3), r: d.r, col: d.hex, glow: d.k, arc: +(C[d.v[1] * 3] + C[d.v[1] * 3 + 1] + C[d.v[1] * 3 + 2]).toFixed(3) })); },
      // (the shelf's parts in the car's colour: the colour they have (the floor's darkening taken off)), the nests' mesh's waiting range
      get shelf() { const C = SHF.mesh.geometry.attributes.color.array, Y = SHF.mesh.geometry.attributes.position.array, v = SHF.body[0][0], f = aoK(Y[v * 3 + 1]); return { col: SHF.col, c: [C[v * 3] / f, C[v * 3 + 1] / f, C[v * 3 + 2] / f].map(q => +q.toFixed(3)) }; },
      nestRange(i) { const S = STN[i], r = S.live.geometry.attributes.position.updateRange; return { offset: r.offset, count: r.count, nests: S.list.reduce((o, k) => (o[k] = S.nests[k].v.map(q => q * 3), o), {}) }; },
      get drumRange() { const a = DRM.mesh.geometry.attributes.color; return { offset: a.updateRange.offset, count: a.updateRange.count, n: a.array.length }; },   // (the drums' colours waiting to be sent)
      // (the drying column's mesh: what is waiting to be sent of each attribute (count -1: nothing or all), its versions)
      get dryerAttrs() { const G = DRY.R.mesh.geometry.attributes; return ['position', 'normal', 'color'].reduce((o, k) => (o[k] = { v: G[k].version, count: G[k].updateRange.count, n: G[k].array.length }, o), {}); },
      get stands() { const v = new V3(), out = {}; for (const k of ['drums', 'towers', 'shelf', 'rims', 'kits', 'stand', 'rack']) { const p = FREE[k], b = p.box; let lo = 9, lane = 9;
          p.root.traverse(o => { if (!o.isMesh) return; o.updateMatrixWorld(); const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) { v.set(a[i], a[i + 1], a[i + 2]).applyMatrix4(o.matrixWorld); lo = Math.min(lo, v.y); if (v.y > 0.015 && v.y < 2) lane = Math.min(lane, Math.abs(v.z)); } });
          out[k] = { box: [b.min.toArray().map(q => +q.toFixed(2)), b.max.toArray().map(q => +q.toFixed(2))], low: +lo.toFixed(4), lane: +lane.toFixed(3), bolts: p.bolts, gone: +p.k.toFixed(3) }; }
        return out; },
      chamberClear() { const sd = (x, z, d) => { const qx = Math.abs(x) - (CH.hx - CH.r), qz = Math.abs(z) - (CH.hz - CH.r); return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - (CH.r - d); };
        let m = 9; const v = new V3(), test = (x, y, z) => { for (let j = 0; j < CH.n; j++) if (y >= CH.bot[j] - 0.01 && y <= CH.bot[j] + CH.BH + 0.01) m = Math.min(m, Math.abs(sd(x, z, CH.IN * j))); };
        for (const o of [...RB.map(A => A.R.mesh), FREE.drums.root, FREE.towers.root, FREE.rack.root, FREE.stand.root, LIFT.piece.root, LIFT.mesh, DRY.R.mesh, ...TOOLS.map(k => STN[1].tools[k].mesh), ...TOOLS_N.map(k => STN[0].tools[k].mesh)])
          o.traverse(q => { if (!q.isMesh || !q.visible) return; q.updateMatrixWorld(); const a = q.geometry.attributes.position.array, M = q.matrixAutoUpdate ? q.matrixWorld : q.matrix; for (let i = 0; i < a.length; i += 3) { v.set(a[i], a[i + 1], a[i + 2]).applyMatrix4(M); test(v.x, v.y, v.z); } });
        return +m.toFixed(3); },
      // (any of them at once, for the pictures: { robots, chamber, dryer, heat, glow, col } (fxSet); fxDemo: through the shows' queue, 'chamber'
      // down and up (the robots tucked first, back at rest after), 'dryer' up, hot, cooled and down; fxLog: what was seen on the way)
      fxPose(o) { fxSet(o); }, get plates() { return FX.plates.map(p => p.s); },
      fxDemo(kind) { const L = this.fxLog = [], D = this; return play(function* () {
        if (kind === 'chamber') { yield* chamberTo(1); L.push({ k: CH.k, low: Math.min(...CH.bot), bands: CH.bot.slice(), tucked: RB.map(A => A.tuck), tools: RB.map(A => A.tool), nests: STN.map(S => S.list.every(k => S.nests[k].st === 'in')), clear: D.chamberClear() }); yield* wait(0.5); yield* chamberTo(0); L.push({ k: CH.k, low: Math.min(...CH.bot) }); yield* par(robotRest(0), robotRest(1)); }
        else if (kind === 'dryer') { yield* dryerTo(1); dryerHeat(1); yield* wait(2.5); L.push({ k: DRY.k, heat: DRY.heat, drawn: DRY.R.mesh.visible }); dryerHeat(0); yield* wait(1.0); yield* dryerTo(0); L.push({ k: DRY.k, heat: DRY.heat, drawn: DRY.R.mesh.visible }); } }); },
      // (a short play of the fixtures through the shows' queue, for the tests: 'tool' robot i (1) takes tool k (the wrench) from its
      // stand and puts it back, then rests; 'work': robot i to a pose planned for tip, dir with tool (picked first), back to its rest;
      // fxLog: what was seen half-way (the most it was out of reach on its way))
      robotDemo(kind, o) { const L = this.fxLog = []; o = o || {}; const i = o.robot == null ? 1 : o.robot, A = RB[i]; return play(function* () {
        A.J.missMax = 0;
        if (kind === 'tool') { const k = o.tool || 'wrench';
          yield* toolPick(i, k); L.push({ held: A.tool, nest: STN[i].nests[k].st, miss: A.J.missMax }); yield* wait(0.5);
          yield* toolPut(i); L.push({ held: A.tool, nest: STN[i].nests[k].st, miss: A.J.missMax }); yield* robotRest(i); }
        else if (kind === 'work') { if (o.tool) yield* toolPick(i, o.tool); const q = robotPlan(i, o.tip, o.dir, { up: o.up, skip: o.skip, dirs: o.dirs }), ap = { x: q.x, tip: q.tip.clone().addScaledVector(q.dir, -0.15), dir: q.dir, up: q.up };
          yield* robotTo(i, ap, 2.0, null, o); yield* robotTo(i, q, 0.6, 'straight', o); L.push({ plan: q, tip: A.J.tipA.toArray().map(v => +v.toFixed(3)), miss: A.J.miss, clear: +robotClear(i, o).toFixed(3) }); yield* wait(0.5);
          yield* robotTo(i, ap, 0.6, 'straight', o); yield* robotRest(i); }
        else if (kind === 'ride') { if (o.tool) yield* toolPick(i, o.tool); yield* robotTo(i, restPose(i, o.x)); L.push({ x: A.J.x, tool: A.tool, miss: A.J.missMax }); yield* robotRest(i); }
        else if (kind === 'hold') { const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: 0xff00ff })), q = robotPlan(i, o.tip, [0, -1, 0], { tool: 'gripper' });
          (o.parent || scene).add(m); m.position.copy(v3(o.tip)).add(new V3(0, -0.1, 0)); if (o.parent) o.parent.worldToLocal(m.position); A.demoPart = m; const at0 = m.getWorldPosition(new V3()).toArray();
          yield* toolPick(i, 'gripper'); yield* robotTo(i, Object.assign({}, q, { tip: q.tip.clone().add(new V3(0, 0.2, 0)) })); yield* robotTo(i, q, 0.5, 'straight'); robotHold(i, m);
          yield* robotTo(i, Object.assign({}, q, { tip: q.tip.clone().add(new V3(0, 0.45, 0)) }), 0.8, 'straight'); L.push({ held: A.held.length, parent: m.parent === scene ? 'room' : 'other', at0, at: m.getWorldPosition(new V3()).toArray().map(v => +v.toFixed(3)) });
          if (o.park) { yield* fxPark(); L.push({ held: A.held.length, parent: m.parent === scene ? 'room' : m.parent === o.parent ? 'back' : 'other' }); }
          else { yield* robotTo(i, q, 0.8, 'straight'); robotRelease(i, m); L.push({ held: A.held.length, parent: m.parent === scene ? 'room' : m.parent === o.parent ? 'back' : 'other' }); yield* robotRest(i); } } }); },
      fxLog: [], RB, STN, RAILS, RK, NS, TL, TR, SLIDE, REST_X, nestPose, restPose, travelPose, robotPlan, robotClear, solveRobot, robotHold, robotRelease, carBox, bodyGrid, RLOG, GAPW, wayOf, wayCheck, WC, planCtx, routeNow(i, P0, P1, via, o) { const g = route(i, P0, P1, via, o, Infinity); let r; do r = g.next(); while (!r.done); return r.value; }, armGap, carPen, linksOf, roomBoxes, foldPose, robotBoxes, COLB,
      carProbe(cv) { cv = cv || cur; cv.v.grp.updateMatrixWorld(true); return probeOf(carMeshes(cv), true); },   // (the car's top, its sides as the robots see it: with its parts and its wheels)
      CH, DRY, DRM, TWR, SHF, RMS, KTS, PAINTS, FREE, setChamber, chamberColor, setDryer, dryerHeat, drumGlow, tuckPose, shelfColor },
    get renderer() { return renderer; }, get camera() { return camera; }, get scene() { return scene; },
  };
})();
