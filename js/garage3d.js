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
  function* after(s, g) { yield* wait(s); yield* g; }
  function* call(f) { f(); }
  // one show at a time: a change asked for while another plays waits for it
  let queue = Promise.resolve(), busy = 0;
  function play(mk) { busy++; viewTok++; autoSpin = false; const p = queue.then(() => spawn(mk())).finally(() => { busy--; if (!busy) speed = 1; }); queue = p.catch(() => {}); return p; }

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
    // the epoxy floor: a grey resin with fine flecks, faint mottling, a few old tyre marks (1 texture = 4 m)
    TX.floor = canvasTex(1024, 1024, (g, w, h) => {
      g.fillStyle = 'rgb(52,55,61)'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { const x = R() * w, y = R() * h, r = 60 + R() * 220, gr = g.createRadialGradient(x, y, 0, x, y, r), d = R() < 0.5;
        gr.addColorStop(0, d ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.04)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      for (let i = 0; i < 26000; i++) { const v = R(); g.fillStyle = v < 0.5 ? 'rgba(20,22,26,0.55)' : v < 0.85 ? 'rgba(150,155,165,0.45)' : 'rgba(205,210,220,0.5)'; g.fillRect(R() * w, R() * h, 1 + (R() < 0.1), 1 + (R() < 0.1)); }
      g.strokeStyle = 'rgba(12,12,14,0.06)'; g.lineWidth = 22;
      for (let i = 0; i < 3; i++) { g.beginPath(); const x = R() * w, y = R() * h, r = 300 + R() * 400, a = R() * TAU; g.arc(x, y, r, a, a + 0.8 + R()); g.stroke(); }
    }, true);
    // the walls: big grey panels with their seams, darker at the joints, a little grime low down (1 texture = 3 m x 3.8 m)
    TX.wall = canvasTex(512, 640, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgb(44,48,56)'); gr.addColorStop(0.55, 'rgb(58,63,72)'); gr.addColorStop(1, 'rgb(50,54,62)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { g.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.035)'; g.fillRect(R() * w, R() * h, 2, 2); }
      for (let px = 0; px < 2; px++) for (let py = 0; py < 2; py++) {   // each panel: a faint sheen, a darker edge
        const x0 = px * w / 2, y0 = py * h / 2, pg = g.createLinearGradient(x0, y0, x0 + w / 2, y0 + h / 2); pg.addColorStop(0, 'rgba(255,255,255,0.045)'); pg.addColorStop(1, 'rgba(0,0,0,0.05)');
        g.fillStyle = pg; g.fillRect(x0 + 3, y0 + 3, w / 2 - 6, h / 2 - 6);
      }
      g.fillStyle = 'rgba(10,12,16,0.85)'; g.fillRect(0, 0, w, 3); g.fillRect(0, h / 2 - 2, w, 4); g.fillRect(0, 0, 3, h); g.fillRect(w / 2 - 2, 0, 4, h);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, h / 2 + 2, w, 1); g.fillRect(w / 2 + 2, 0, 1, h);
      for (let px = 0; px < 2; px++) for (let py = 0; py < 2; py++) for (const [ax, ay] of [[14, 14], [w / 2 - 14, 14], [14, h / 2 - 14], [w / 2 - 14, h / 2 - 14]]) {   // rivets
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(px * w / 2 + ax + 1, py * h / 2 + ay + 1, 3, 0, TAU); g.fill();
        g.fillStyle = 'rgba(190,196,206,0.55)'; g.beginPath(); g.arc(px * w / 2 + ax, py * h / 2 + ay, 2.4, 0, TAU); g.fill(); }
    }, true);
    // the low wall: aluminium tread plate (1 texture = 1.5 m x 1 m)
    TX.plate = canvasTex(384, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgb(132,137,146)'); gr.addColorStop(0.5, 'rgb(158,163,172)'); gr.addColorStop(1, 'rgb(122,127,136)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
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
    // the pegboard over the bench: holes, and the tools on it (outlines, as a workshop's shadow board)
    TX.peg = canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = 'rgb(48,52,60)'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(8,9,12,0.9)'; for (let y = 12; y < h; y += 24) for (let x = 12; x < w; x += 24) { g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); }
      const tool = (x, y, a, f) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = 'rgba(0,0,0,0.45)'; g.translate(5, 6); f(); g.translate(-5, -6); g.fillStyle = '#c8ced8'; f(); g.restore(); };
      const wrench = (L) => () => { g.fillRect(-L / 2, -7, L, 14); g.beginPath(); g.arc(-L / 2, 0, 17, 0, TAU); g.arc(L / 2, 0, 15, 0, TAU); g.fill(); };
      for (let i = 0; i < 7; i++) tool(110 + i * 52, 150 + i * 6, Math.PI / 2, wrench(150 + i * 14));
      const sd = (col) => () => { g.fillRect(-4, -90, 8, 110); g.save(); g.fillStyle = col; g.fillRect(-13, 20, 26, 70); g.restore(); };
      for (let i = 0; i < 6; i++) tool(520 + i * 44, 170, 0, sd(['#e63b2e', '#f2c230', '#2f7de0', '#e63b2e', '#f2c230', '#2f7de0'][i]));
      tool(860, 140, 0.15, () => { g.fillRect(-6, -40, 12, 150); g.fillRect(-48, -70, 96, 36); });   // a hammer
      tool(940, 150, -0.1, () => { g.beginPath(); g.ellipse(0, 0, 36, 70, 0, 0, TAU); g.fill(); g.fillRect(-8, 60, 16, 70); });   // a mallet
      for (let i = 0; i < 9; i++) tool(110 + i * 40, 380, 0, () => { g.beginPath(); g.arc(0, 0, 13 + i * 1.2, 0, TAU); g.fill(); g.fillRect(-5, 0, 10, 60); });   // sockets
      tool(560, 400, 0, () => { g.fillRect(-120, -14, 240, 28); g.beginPath(); g.arc(-120, 0, 26, 0, TAU); g.fill(); });   // a torque wrench
      tool(820, 390, 0.6, () => { g.fillRect(-10, -80, 20, 160); g.fillRect(-36, -80, 72, 20); });   // pliers / a clamp
      g.strokeStyle = '#f2c230'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    });
    // the turntable's top: brushed dark steel with fine rings, a tread pattern ring at the rim (planar uv over the disc)
    TX.disc = canvasTex(1024, 1024, (g, w, h) => {
      const c = w / 2; g.fillStyle = 'rgb(40,43,49)'; g.fillRect(0, 0, w, h);
      for (let r = 6; r < c; r += 3) { g.strokeStyle = 'rgba(' + (R() < 0.5 ? '255,255,255,' + (R() * 0.05).toFixed(3) : '0,0,0,' + (R() * 0.09).toFixed(3)) + ')'; g.lineWidth = 2; g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke(); }
      g.strokeStyle = 'rgba(10,11,14,0.9)'; g.lineWidth = 6; for (const r of [c * 0.36, c * 0.985]) { g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke(); }
      for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(c + Math.cos(a) * c * 0.93, c + Math.sin(a) * c * 0.93, 7, 0, TAU); g.fill();
        g.fillStyle = 'rgba(170,176,188,0.6)'; g.beginPath(); g.arc(c + Math.cos(a) * c * 0.93 - 1, c + Math.sin(a) * c * 0.93 - 1, 5, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(255,198,41,0.85)'; for (let k = 0; k < 4; k++) { g.save(); g.translate(c, c); g.rotate(k * Math.PI / 2); g.beginPath(); g.moveTo(c * 0.3, -14); g.lineTo(c * 0.42, 0); g.lineTo(c * 0.3, 14); g.fill(); g.restore(); }
    });
    // yellow and black hazard stripes (the door jambs, the turntable's rim, the lift)
    TX.hazard = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#111215'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c230'; for (let x = -h; x < w + h; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 24, 0); g.lineTo(x + 24 - h, h); g.lineTo(x - h, h); g.fill(); } }, true);
    // the roll-up doors' slats
    TX.slats = canvasTex(64, 256, (g, w, h) => { for (let y = 0; y < h; y += 16) { const gr = g.createLinearGradient(0, y, 0, y + 16); gr.addColorStop(0, '#9aa1ab'); gr.addColorStop(0.5, '#c4cad3'); gr.addColorStop(1, '#6d737c'); g.fillStyle = gr; g.fillRect(0, y, w, 16); } }, true);
    // outside the doors: a bright paddock (sky, a line of trees, the hills, the asphalt in the sun)
    TX.outside = canvasTex(512, 320, (g, w, h) => {
      const sk = g.createLinearGradient(0, 0, 0, h * 0.62); sk.addColorStop(0, '#9ccaf0'); sk.addColorStop(1, '#eef6fb'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
      g.fillStyle = '#9fb5a8'; g.beginPath(); g.moveTo(0, h * 0.5); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * 0.5 - 18 - 14 * Math.sin(x * 0.013) - 8 * Math.sin(x * 0.05)); g.lineTo(w, h * 0.62); g.lineTo(0, h * 0.62); g.fill();
      for (let x = -10; x < w + 20; x += 9 + R() * 8) { const t = 26 + R() * 30; g.fillStyle = R() < 0.5 ? '#4f7a52' : '#5d8a5c'; g.beginPath(); g.ellipse(x, h * 0.6 - t * 0.5, 9 + R() * 8, t * 0.6, 0, 0, TAU); g.fill(); }
      const as = g.createLinearGradient(0, h * 0.6, 0, h); as.addColorStop(0, '#b9bcc0'); as.addColorStop(1, '#8e9196'); g.fillStyle = as; g.fillRect(0, h * 0.6, w, h * 0.4);
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(0, h * 0.78, w, 5);
      const hz = g.createLinearGradient(0, 0, 0, h); hz.addColorStop(0, 'rgba(255,255,255,0)'); hz.addColorStop(0.55, 'rgba(255,255,255,0.35)'); hz.addColorStop(1, 'rgba(255,255,255,0.1)'); g.fillStyle = hz; g.fillRect(0, 0, w, h);
    });
    // the back-lit sign: the game's own name
    TX.sign = canvasTex(1024, 256, (g, w, h) => {
      g.font = 'italic 900 150px Roboto, "Arial Black", Arial, sans-serif'; g.textBaseline = 'middle';
      const a = g.measureText('APEX ').width, b = g.measureText('RACING').width, x = (w - a - b) / 2;
      g.shadowColor = 'rgba(255,190,40,0.9)'; g.shadowBlur = 28; g.fillStyle = '#ffd23f'; g.fillText('APEX', x, h / 2 + 6);
      g.shadowColor = 'rgba(160,210,255,0.9)'; g.fillStyle = '#f4f8ff'; g.fillText('RACING', x + a, h / 2 + 6);
    });
    // the car's contact shadow: a rounded rectangle, darkest under the body, soft at its edge (on the blob plane: len x 1.25, wid x 1.45)
    TX.under = canvasTex(128, 128, (g, w, h) => {
      const img = g.createImageData(w, h), d = img.data;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const r = 0.25, u = Math.abs((i + 0.5) / w * 2 - 1) - 0.72 + r, v = Math.abs((j + 0.5) / h * 2 - 1) - 0.6 + r;
        const sd = Math.hypot(Math.max(u, 0), Math.max(v, 0)) + Math.min(Math.max(u, v), 0) - r, t = clamp((sd + 0.1) / 0.36, 0, 1), o = (j * w + i) * 4;
        d[o] = d[o + 1] = d[o + 2] = 0; d[o + 3] = Math.round(255 * 0.8 * (1 - t * t * (3 - 2 * t)));
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
    PM.blueGlow = new THREE.MeshBasicMaterial({ color: 0x47c6ff });
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
        fragmentShader: additive ? 'varying vec4 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; gl_FragColor = vec4(vC.rgb, vC.a * pow(1.0 - r, 1.6)); }'
          : 'varying vec4 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; float a = vC.a * (1.0 - r) * (1.0 - 0.5 * r); gl_FragColor = vec4(vC.rgb * (1.04 - 0.14 * gl_PointCoord.y), a); }',
        transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = additive ? 9 : 8;
    }
    emit(x, y, z, vx, vy, vz, life, s0, s1, c, a, grav, drag, floor) {
      const i = this.cur; this.cur = (this.cur + 1) % this.max;
      this.P[i * 3] = x; this.P[i * 3 + 1] = y; this.P[i * 3 + 2] = z; this.Vl[i * 3] = vx; this.Vl[i * 3 + 1] = vy; this.Vl[i * 3 + 2] = vz;
      this.life[i] = this.ml[i] = life; this.s0[i] = s0; this.s1[i] = s1; this.a0[i] = a; this.grav[i] = grav || 0; this.drag[i] = drag == null ? 1.2 : drag; this.floor[i] = floor == null ? -1e3 : floor;
      this.C[i * 4] = c[0]; this.C[i * 4 + 1] = c[1]; this.C[i * 4 + 2] = c[2];
    }
    update(dt) {
      for (let i = 0; i < this.max; i++) {
        if (this.life[i] <= 0) { if (this.S[i] !== 0) { this.S[i] = 0; this.C[i * 4 + 3] = 0; } continue; }
        this.life[i] -= dt; const t = 1 - Math.max(0, this.life[i]) / this.ml[i], dr = Math.max(0, 1 - this.drag[i] * dt), o = i * 3;
        this.Vl[o] *= dr; this.Vl[o + 2] *= dr; this.Vl[o + 1] = this.Vl[o + 1] * dr - this.grav[i] * dt;
        this.P[o] += this.Vl[o] * dt; this.P[o + 1] += this.Vl[o + 1] * dt; this.P[o + 2] += this.Vl[o + 2] * dt;
        if (this.P[o + 1] < this.floor[i]) { this.P[o + 1] = this.floor[i]; this.Vl[o + 1] *= -0.35; this.Vl[o] *= 0.6; this.Vl[o + 2] *= 0.6; }
        this.S[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * Math.sqrt(t);
        this.C[i * 4 + 3] = this.a0[i] * (1 - t) * Math.min(1, t * 10 + 0.15);
      }
      this.aP.needsUpdate = this.aC.needsUpdate = this.aS.needsUpdate = true;
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
  function buildRoom() {
    const { x0, x1, z0, z1, h, door, doorH } = ROOM;
    const lam = (o) => new THREE.MeshLambertMaterial(o);
    // walls (panels over a tread-plate skirt 1 m high)
    const wq = new QB(), pq = new QB(), WY = 1.0;
    const wallRun = (ax, az, bx, bz, n, holes) => {   // a wall from a to b, with door openings [from, to] along it
      const L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L, at = (s) => [ax + dx * s, az + dz * s];
      let s = 0; const cuts = (holes || []).slice().sort((p, q) => p[0] - q[0]);
      for (const [h0, h1] of cuts.concat([[L, L]])) {
        if (h0 > s) { const p = at(s), q = at(h0); wq.wall(p[0], p[1], q[0], q[1], WY, h, n, 3, 3.8, s); pq.wall(p[0], p[1], q[0], q[1], 0, WY, n, 1.5, 1, s); }
        if (h1 > h0) { const p = at(h0), q = at(h1); wq.wall(p[0], p[1], q[0], q[1], doorH, h, n, 3, 3.8, h0); }
        s = h1;
      }
    };
    wallRun(x0, z0, x1, z0, [0, 0, 1]);                                  // back
    wallRun(x1, z1, x0, z1, [0, 0, -1]);                                 // front
    wallRun(x0, z1, x0, z0, [1, 0, 0], [[z1 - door, z1 + door]]);       // left (the way in)
    wallRun(x1, z0, x1, z1, [-1, 0, 0], [[-z0 - door, -z0 + door]]);    // right (the way out)
    const wallM = wq.mesh(lam({ map: TX.wall })), plateM = pq.mesh(new THREE.MeshPhongMaterial({ map: TX.plate, specular: 0x666666, shininess: 40 }));
    wallM.receiveShadow = plateM.receiveShadow = true; scene.add(wallM, plateM);
    // ceiling: dark, steel beams across, the honeycomb of LED tubes over the car
    const cq = new QB(); cq.quad([x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0], [0, -1, 0], [[0, 0], [6, 0], [6, 4], [0, 4]]);
    scene.add(cq.mesh(lam({ color: 0x1c1f25, side: THREE.DoubleSide })));
    const g = new World.GB(), box = (cx, cy, cz, sx, sy, sz, col, top, rot) => World.box(g, cx, cy, cz, sx, sy, sz, rot || 0, col, top);
    const gb = new World.GB();   // (the beams: they cast no shadow, the lamps hang under them)
    for (let x = -7.5; x <= 7.6; x += 3) { World.box(gb, x, h - 0.32, (z0 + z1) / 2, 0.22, 0.32, z1 - z0, 0, [0.13, 0.14, 0.16], [0.13, 0.14, 0.16]); World.box(gb, x, h - 0.34, (z0 + z1) / 2, 0.36, 0.04, z1 - z0, 0, [0.17, 0.18, 0.2]); }
    scene.add(new THREE.Mesh(gb.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })));
    for (let x = 99; x < 0; x += 3) { box(x, h - 0.32, (z0 + z1) / 2, 0.22, 0.32, z1 - z0, [0.13, 0.14, 0.16], [0.13, 0.14, 0.16]); box(x, h - 0.34, (z0 + z1) / 2, 0.36, 0.04, z1 - z0, [0.17, 0.18, 0.2]); }
    // the back wall's furniture: a red tool chest and a bench under the pegboard (left), the tyre rack (right), a cabinet row
    const RED = [0.72, 0.1, 0.09], RED2 = [0.55, 0.07, 0.07], STEEL = [0.55, 0.58, 0.62], DK = [0.09, 0.1, 0.11];
    const chest = (cx, w, hh, d) => {   // a roll cab: drawers with their handles, a dark top, castors
      box(cx, 0.12, z0 + d / 2 + 0.05, w, hh, d, RED, [0.1, 0.1, 0.11]);
      const n = Math.round(hh / 0.17);
      for (let i = 0; i < n; i++) { const y = 0.12 + hh - (i + 1) * hh / n; box(cx, y + 0.005, z0 + d + 0.055, w - 0.06, 0.012, 0.01, RED2); box(cx, y + hh / n * 0.62, z0 + d + 0.07, w * 0.7, 0.025, 0.03, STEEL); }
      for (const sx of [-1, 1]) for (const sz of [0, 1]) box(cx + sx * (w / 2 - 0.08), 0, z0 + 0.12 + sz * (d - 0.14), 0.07, 0.12, 0.07, DK);
    };
    chest(-6.9, 1.5, 1.0, 0.62); chest(-5.25, 0.95, 0.7, 0.62); box(-5.25, 0.82, z0 + 0.36, 0.95, 0.06, 0.66, [0.42, 0.3, 0.18], [0.5, 0.36, 0.22]);   // (a butcher-block top on the small one)
    box(-6.9, 1.12, z0 + 0.36, 1.5, 0.05, 0.66, [0.08, 0.08, 0.09]);
    box(-7.25, 1.17, z0 + 0.32, 0.4, 0.24, 0.26, [0.92, 0.5, 0.1], [0.98, 0.58, 0.16]); box(-6.6, 1.17, z0 + 0.4, 0.2, 0.17, 0.15, [0.3, 0.32, 0.36]);   // a parts box, a vice
    box(-2.6, 0, z0 + 0.3, 3.2, 0.72, 0.55, [0.17, 0.18, 0.21], [0.12, 0.13, 0.15]);   // a low cabinet under the sign, its doors
    for (let i = 0; i < 4; i++) { box(-3.8 + i * 0.8, 0.08, z0 + 0.58, 0.74, 0.58, 0.01, [0.22, 0.23, 0.27]); box(-3.8 + i * 0.8 + 0.28, 0.5, z0 + 0.59, 0.03, 0.12, 0.02, STEEL); }
    // the tyre rack: two shelves, tyres standing in a row on each
    const rx0 = 1.2, rx1 = 4.8;
    for (const sx of [rx0, rx1]) box(sx, 0, z0 + 0.32, 0.06, 2.2, 0.06, [0.85, 0.65, 0.1]), box(sx, 0, z0 + 0.04, 0.06, 2.2, 0.06, [0.85, 0.65, 0.1]);
    for (const y of [0.08, 1.12]) box((rx0 + rx1) / 2, y, z0 + 0.18, rx1 - rx0 + 0.1, 0.05, 0.4, [0.24, 0.26, 0.3]);
    const tyres = new World.GB(), TC = [0.07, 0.07, 0.08], TT = [0.11, 0.11, 0.12];
    for (const y of [0.13, 1.17]) for (let i = 0; i < 11; i++) {
      const x = rx0 + 0.2 + i * 0.32, r = 0.33, wd = 0.24, cy = y + r, cz = z0 + 0.2;
      for (let k = 0; k < 14; k++) { const a0 = k / 14 * TAU, a1 = (k + 1) / 14 * TAU, P = (a, z, rr) => [x + Math.cos(a) * rr * 0 + z, cy + Math.sin(a) * rr, cz + Math.cos(a) * rr];
        tyres.quadO(P(a0, -wd / 2, r), P(a0, wd / 2, r), P(a1, wd / 2, r), P(a1, -wd / 2, r), k % 2 ? TC : TT, [x, cy, cz]);
        for (const sd of [-1, 1]) { tyres.quadO(P(a0, sd * wd / 2, r), P(a0, sd * wd / 2, r * 0.62), P(a1, sd * wd / 2, r * 0.62), P(a1, sd * wd / 2, r), TC, [x - sd, cy, cz]); tyres.triO([x + sd * wd / 2, cy, cz], P(a0, sd * wd / 2, r * 0.62), P(a1, sd * wd / 2, r * 0.62), [0.04, 0.04, 0.045], [x - sd, cy, cz]); }
      }
    }
    const tyM = new THREE.Mesh(tyres.geometry(), new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x222222, shininess: 20 })); tyM.castShadow = tyM.receiveShadow = true; scene.add(tyM);
    // tall cabinets and a fridge-sized compressor down the back wall's right end, oil drums
    for (let i = 0; i < 3; i++) box(5.6 + i * 0.86, 0, z0 + 0.32, 0.82, 2.05, 0.6, [0.3, 0.32, 0.36], [0.22, 0.24, 0.27]);
    for (let i = 0; i < 3; i++) { box(5.6 + i * 0.86, 0.95, z0 + 0.625, 0.03, 0.22, 0.02, STEEL); box(5.6 + i * 0.86, 1.8, z0 + 0.625, 0.7, 0.012, 0.01, [0.2, 0.21, 0.24]); }
    for (const [x, z] of [[-8.45, z0 + 1.2], [-8.4, z0 + 1.85]]) World.cyl(g, x, 0, z, 0.3, 0.9, 14, [0.12, 0.35, 0.68], [0.1, 0.3, 0.6]);
    World.cyl(g, 8.3, 0, z1 - 1.2, 0.3, 0.9, 14, [0.82, 0.15, 0.1], [0.7, 0.12, 0.1]);
    // the front wall: a long bench and lockers (seen when the camera goes round)
    for (let i = 0; i < 6; i++) box(-3 + i * 0.62, 0, z1 - 0.32, 0.6, 1.9, 0.55, [0.2, 0.32, 0.55], [0.16, 0.26, 0.45]);
    box(3.5, 0, z1 - 0.4, 3.2, 0.9, 0.7, [0.2, 0.21, 0.24], [0.3, 0.31, 0.34]);
    // the curb stripe round the walls (the menu's red and white), at 2.05 m
    const cb = (ax, az, bx, bz, nx, nz) => { const L = Math.hypot(bx - ax, bz - az), n = Math.round(L / 0.6); for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, c = i % 2 ? [0.95, 0.94, 0.9] : [0.86, 0.16, 0.13];
      const p0 = [ax + (bx - ax) * t0 + nx * 0.02, az + (bz - az) * t0 + nz * 0.02], p1 = [ax + (bx - ax) * t1 + nx * 0.02, az + (bz - az) * t1 + nz * 0.02];
      g.quadO([p0[0], 2.0, p0[1]], [p1[0], 2.0, p1[1]], [p1[0], 2.16, p1[1]], [p0[0], 2.16, p0[1]], c, [p0[0] - nx, 2.08, p0[1] - nz]); } };
    cb(x0, z0, x1, z0, 0, 1); cb(x0, z1, x0, z1 - (z1 - door - 0.4), 1, 0); cb(x0, -door - 0.4, x0, z0, 1, 0); cb(x1, z0, x1, -door - 0.4, -1, 0); cb(x1, door + 0.4, x1, z1, -1, 0); cb(x1, z1, x0, z1, 0, -1);
    // the doors: jambs in hazard stripes, the rolled-up shutter's drum and the last slats showing, the paddock outside
    const hzTex = (u, v) => { const t = TX.hazard.clone(); t.needsUpdate = true; t.repeat.set(u, v); return t; };
    const outM = new THREE.MeshBasicMaterial({ map: TX.outside }), hzV = new THREE.MeshLambertMaterial({ map: hzTex(0.25, 4) }), hzH = new THREE.MeshLambertMaterial({ map: hzTex(5, 0.6) }), slM = new THREE.MeshLambertMaterial({ map: TX.slats });
    for (const sd of [-1, 1]) {
      const X = sd * 9, o = new THREE.Group(); o.position.set(X, 0, 0); if (sd > 0) o.rotation.y = Math.PI; scene.add(o);   // (local: +x into the room)
      for (const zz of [-door - 0.12, door + 0.12]) { const j = new THREE.Mesh(new THREE.BoxGeometry(0.3, doorH, 0.24), hzV); j.position.set(0.05, doorH / 2, zz); o.add(j); }
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, door * 2 + 0.48), hzH); head.position.set(0.05, doorH + 0.1, 0); o.add(head);
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, door * 2 + 0.3, 16), new THREE.MeshLambertMaterial({ color: 0x5a5f68 })); drum.rotation.x = Math.PI / 2; drum.position.set(0.45, doorH + 0.42, 0); o.add(drum);
      const sl = new THREE.Mesh(new THREE.PlaneGeometry(door * 2, 0.55), slM); sl.rotation.y = Math.PI / 2; sl.position.set(0.12, doorH - 0.27, 0); sl.material.map.repeat.set(1, 1); o.add(sl);
      const out = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.6), outM); out.rotation.y = Math.PI / 2; out.position.set(-3.2, 2.6, 0); o.add(out);
      const ap = new THREE.Mesh(new THREE.PlaneGeometry(3.4, door * 2 + 6), new THREE.MeshBasicMaterial({ color: 0xa9adb3 })); ap.rotation.x = -Math.PI / 2; ap.position.set(-1.7, -0.005, 0); o.add(ap);
      // the daylight coming in: a soft bright patch on the floor, a faint shaft in the air
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, door * 2 + 1.2), new THREE.MeshBasicMaterial({ map: shaftTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.32 }));
      sh.rotation.x = -Math.PI / 2; sh.position.set(2.1, 0.012, 0); sh.renderOrder = 3; o.add(sh);
    }
    // the sign, and its glow on the wall
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.0), new THREE.MeshBasicMaterial({ map: TX.sign, transparent: true, depthWrite: false })); sign.position.set(-2.5, 2.78, z0 + 0.06); scene.add(sign);
    signGlow = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 3), new THREE.MeshBasicMaterial({ map: TX.glow, color: 0xffd894, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.18 }));
    signGlow.position.set(-2.5, 2.78, z0 + 0.03); scene.add(signGlow);
    // the pegboard over the chests
    const peg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshLambertMaterial({ map: TX.peg })); peg.position.set(-6.15, 1.92, z0 + 0.03); scene.add(peg);
    // a telemetry screen on the wall (a glowing trace)
    monitor = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.86), new THREE.MeshBasicMaterial({ map: monitorTex() })); monitor.position.set(6.45, 2.85, z0 + 0.08); scene.add(monitor);
    box(6.45, 2.4, z0 + 0.02, 1.6, 0.94, 0.08, [0.06, 0.06, 0.07]);
    // the honeycomb of LED tubes over the car
    const hexG = new World.GB(), L = 0.6, seen = new Set(), WHITE = [1, 1, 1];
    for (let q = -7; q <= 7; q++) for (let r = -7; r <= 7; r++) {
      const cx = 1.5 * L * q, cz = Math.sqrt(3) * L * (r + q / 2);
      if (Math.abs(cx) > 4.2 || Math.abs(cz) > 2.9 || (cx * cx) / 20 + (cz * cz) / 9.5 > 1) continue;
      for (let k = 0; k < 6; k++) {
        const a0 = k / 6 * TAU, a1 = (k + 1) / 6 * TAU, p0 = [cx + Math.cos(a0) * L, cz + Math.sin(a0) * L], p1 = [cx + Math.cos(a1) * L, cz + Math.sin(a1) * L];
        const key = Math.round((p0[0] + p1[0]) * 50) + ',' + Math.round((p0[1] + p1[1]) * 50); if (seen.has(key)) continue; seen.add(key);
        const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2, ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
        World.box(hexG, mx, h - 0.16, mz, L * 0.93, 0.035, 0.05, ang, WHITE, WHITE);
      }
    }
    const hex = new THREE.Mesh(hexG.geometry(), new THREE.MeshBasicMaterial({ color: 0xf2f7ff })); scene.add(hex);
    // the turntable's lit ring in the floor, its glow
    ringMat = new THREE.MeshBasicMaterial({ color: 0x55c4ff });
    const ring = new THREE.Mesh(new THREE.RingGeometry(ROOM.R + 0.01, ROOM.R + 0.07, 128), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.004; scene.add(ring);
    ringGlow = new THREE.Mesh(new THREE.RingGeometry(ROOM.R - 0.5, ROOM.R + 0.9, 128, 1), new THREE.ShaderMaterial({
      uniforms: { uC: { value: new THREE.Color(0x3aa8ff) }, uK: { value: 0.32 } },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uC; uniform float uK; varying vec2 vP; void main(){ float d = length(vP) - ' + (ROOM.R + 0.04).toFixed(2) + '; float a = exp(-d * d * (d < 0.0 ? 60.0 : 5.0)); gl_FragColor = vec4(uC * a * uK, 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    ringGlow.rotation.x = -Math.PI / 2; ringGlow.position.y = 0.008; ringGlow.renderOrder = -1; scene.add(ringGlow);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), new THREE.MeshBasicMaterial({ map: TX.glow, color: 0x8f98a8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.006; pool.renderOrder = -1; scene.add(pool);   // (the light of the honeycomb over the table)
    // painted lines on the floor: the bay's yellow edges, the arrows of the way through
    const fl = new World.GB(), Y = [0.85, 0.66, 0.12], line = (ax, az, bx, bz, w) => { const L2 = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / L2 * w / 2, nz = (bx - ax) / L2 * w / 2; fl.quadUp([ax - nx, 0.006, az - nz], [ax + nx, 0.006, az + nz], [bx + nx, 0.006, bz + nz], [bx - nx, 0.006, bz - nz], [Y, Y, Y, Y]); };
    for (const sz of [-1, 1]) { line(x0, sz * (door + 0.25), -ROOM.R - 0.4, sz * (door + 0.25), 0.1); line(ROOM.R + 0.4, sz * (door + 0.25), x1, sz * (door + 0.25), 0.1); }
    for (const ax of [-6.2, 5.2]) { for (const s of [-1, 1]) line(ax, s * 0.55, ax + 0.9, 0, 0.12); }
    const flM = new THREE.Mesh(fl.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); flM.receiveShadow = true; scene.add(flM);
    // everything in one vertex-coloured mesh
    const gm = new THREE.Mesh(g.geometry(), new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x333333, shininess: 30 })); gm.castShadow = gm.receiveShadow = true; scene.add(gm);
    // dust in the light over the car
    const N = 140, mp = new Float32Array(N * 3); const Rm = Core.rng(77);
    for (let i = 0; i < N; i++) { mp[i * 3] = (Rm() - 0.5) * 9; mp[i * 3 + 1] = 0.3 + Rm() * 4.2; mp[i * 3 + 2] = (Rm() - 0.5) * 7; }
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    motes = new THREE.Points(mg, new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uScale: { value: 400 } },
      vertexShader: 'uniform float uT; uniform float uScale; varying float vA; void main(){ vec3 p = position; float s = fract(sin(dot(p.xz, vec2(12.9898, 78.233))) * 43758.5453);'
        + ' p.x += sin(uT * 0.13 + s * 30.0) * 0.6; p.z += cos(uT * 0.11 + s * 20.0) * 0.5; p.y += sin(uT * 0.07 + s * 10.0) * 0.4;'
        + ' vec4 mv = modelViewMatrix * vec4(p, 1.0); vA = (0.35 + 0.65 * s) * smoothstep(0.0, 1.5, -mv.z); gl_PointSize = (0.012 + 0.014 * s) * uScale / max(0.3, -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; gl_FragColor = vec4(vec3(1.0, 0.97, 0.9), vA * 0.35 * (1.0 - r)); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    motes.frustumCulled = false; scene.add(motes);
  }
  function shaftTex() {
    return canvasTex(128, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,248,232,0.9)'); gr.addColorStop(1, 'rgba(255,248,232,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'destination-in'; const m = g.createLinearGradient(0, 0, 0, h); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.2, 'rgba(0,0,0,1)'); m.addColorStop(0.8, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, w, h); });
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
    const discTop = new THREE.Mesh(new THREE.CircleGeometry(R, 96), floorMaterial(TX.disc, 0.8));
    discTop.rotation.x = -Math.PI / 2; discTop.position.y = 0.002; discTop.receiveShadow = true; ttTop.add(discTop);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.12, 96, 1, true), new THREE.MeshLambertMaterial({ map: TX.hazard }));
    rim.material.map = TX.hazard.clone(); rim.material.map.needsUpdate = true; rim.material.map.repeat.set(24, 1); rim.position.y = -0.058; tt.add(rim);
    const under = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshLambertMaterial({ color: 0x15171b })); under.rotation.x = Math.PI / 2; under.position.y = -0.118; tt.add(under);
    // the pit (seen only with the table up): its wall, its floor, the scissor lift
    const pit = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.07, R + 0.07, 1.0, 64, 1, true), new THREE.MeshLambertMaterial({ color: 0x24272d, side: THREE.BackSide })); pit.position.y = -0.5; scene.add(pit);
    const pf = new THREE.Mesh(new THREE.CircleGeometry(R + 0.07, 48), new THREE.MeshLambertMaterial({ color: 0x101114 })); pf.rotation.x = -Math.PI / 2; pf.position.y = -1.0; scene.add(pf);
    scis = { bars: [], mat: new THREE.MeshPhongMaterial({ color: 0xd9a514, specular: 0x555555, shininess: 40 }) };
    for (const z of [-1.1, 1.1]) for (const k of [0, 1]) for (const lvl of [0, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.09, 0.08), scis.mat); b.userData = { z: z + (k ? 0.1 : -0.1), k, lvl }; scene.add(b); scis.bars.push(b); }
    const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 12), new THREE.MeshPhongMaterial({ color: 0xc8ccd2, specular: 0xffffff, shininess: 120 })); scene.add(ram); scis.ram = ram;
    setLift(0);
  }
  function setLift(h) {
    lift = h; tt.position.y = h;
    // the scissors: two levels of crossed bars between the pit floor (-1.0) and the table's underside (h - 0.12)
    const top = h - 0.12, bot = -0.98, H2 = (top - bot) / 2, L = 2.0, a = Math.asin(clamp(H2 / L, 0, 0.99));
    for (const b of scis.bars) { const { z, k, lvl } = b.userData; b.position.set(0, bot + H2 * (lvl + 0.5), z); b.rotation.set(0, 0, k ? a : -a); b.visible = h > 0.02; }
    scis.ram.visible = h > 0.02; scis.ram.scale.y = Math.max(0.01, top - bot); scis.ram.position.set(0, bot + (top - bot) / 2, 0);
  }

  /* ---------------- the floor: epoxy with a blurred mirror image (a planar reflection drawn every frame at half size) ---------------- */
  const REF = { rt: null, cam: new THREE.PerspectiveCamera(), tm: new THREE.Matrix4(), k: { value: 0.62 }, size: 0.5 };
  function floorMaterial(map, k) {
    const m = new THREE.MeshPhongMaterial({ map, specular: 0x444444, shininess: 60 });
    const uK = { value: k };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.tRefl = { get value() { return REF.rt ? REF.rt.texture : null; } }; sh.uniforms.uTexM = { value: REF.tm }; sh.uniforms.uReflK = REF.k; sh.uniforms.uK = uK; sh.uniforms.uTexel = { get value() { return REF.texel; } };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 uTexM;\nvarying vec4 vRefl;\nvarying vec3 vWp;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvec4 wpR = modelMatrix * vec4(transformed, 1.0); vRefl = uTexM * wpR; vWp = wpR.xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRefl;\nuniform float uReflK;\nuniform float uK;\nuniform vec2 uTexel;\nvarying vec4 vRefl;\nvarying vec3 vWp;')
        .replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', [
          'vec2 ruv = vRefl.xy / vRefl.w;',
          'float sp = texture2D(map, vUv * 3.7).r;',   // (the flecks break the mirror up a little)
          'vec2 j = (vec2(sp, fract(sp * 7.3)) - 0.5) * uTexel * 1.6;',
          'vec3 rc = vec3(0.0); float wsum = 0.0;',
          'for (int i = 0; i < 8; i++) { float a = float(i) * 2.39996; float r = 0.6 + float(i) * 0.32; vec2 o = vec2(cos(a), sin(a)) * r * uTexel; float wgt = 1.0 / (1.0 + float(i) * 0.3); rc += texture2D(tRefl, ruv + o + j).rgb * wgt; wsum += wgt; }',
          'rc /= wsum;',
          'vec3 vd = normalize(cameraPosition - vWp); float fr = 0.55 + 0.45 * pow(1.0 - clamp(vd.y, 0.0, 1.0), 3.0), rk = fr * uReflK * uK;',
          'outgoingLight = outgoingLight * (1.0 - 0.45 * rk) + rc * rk;',
          'gl_FragColor = vec4( outgoingLight, diffuseColor.a );'].join('\n'));
    };
    m.customProgramCacheKey = () => 'garageFloor';
    m.userData.k = uK;
    return m;
  }
  function buildFloor() {
    const { x0, x1, z0, z1 } = ROOM, sh = new THREE.Shape();
    sh.moveTo(x0, -z1); sh.lineTo(x1, -z1); sh.lineTo(x1, -z0); sh.lineTo(x0, -z0); sh.lineTo(x0, -z1);
    const hole = new THREE.Path(); hole.absarc(0, 0, ROOM.R + 0.07, 0, TAU, true); sh.holes.push(hole);
    const geo = new THREE.ShapeGeometry(sh, 48); geo.rotateX(-Math.PI / 2);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4, uv.getY(i) / 4);
    floorMat = floorMaterial(TX.floor, 1);
    const f = new THREE.Mesh(geo, floorMat); f.receiveShadow = true; scene.add(f); refl = f;
    REF.rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
    REF.rt.texture.generateMipmaps = false; REF.texel = new THREE.Vector2(0.25, 0.25);
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
    refl.visible = false; ttTop.visible = false; ringGlow.visible = false;
    const sm = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(REF.rt); renderer.clear(); renderer.render(scene, rc); renderer.setRenderTarget(null);
    renderer.shadowMap.autoUpdate = sm;
    refl.visible = true; ttTop.visible = true; ringGlow.visible = true;
  }

  /* ---------------- lights ---------------- */
  function buildLights() {
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2c2f36, 0.46));
    keyLight = new THREE.DirectionalLight(0xfff3e2, 0.95); keyLight.position.copy(KEY_DIR).multiplyScalar(12); keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024); const sc = keyLight.shadow.camera; sc.left = -5.5; sc.right = 5.5; sc.top = 5.5; sc.bottom = -5.5; sc.near = 2; sc.far = 30;
    keyLight.shadow.bias = -0.0008; keyLight.shadow.normalBias = 0.02; keyLight.shadow.radius = 4; scene.add(keyLight, keyLight.target);
    const fill = new THREE.DirectionalLight(0xa9c8ff, 0.3); fill.position.set(-6, 3, 4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xbfd8ff, 0.42); rim.position.set(-2, 4, -8); scene.add(rim);
    const door = new THREE.DirectionalLight(0xfff0d8, 0.22); door.position.set(-10, 2, 0); scene.add(door);
  }

  /* ---------------- the camera: round the car (the user drags it), moved by the animations ---------------- */
  const HOME = { yaw: 0.55, pitch: 0.17, dist: 8.4, tx: 0.1, ty: 0.6, tz: 0, fov: 33 };
  const rig = Object.assign({}, HOME), user = { yaw: 0, pitch: 0, zoom: 1, vy: 0 };
  let userT = 0;   // (seconds since the user last turned the camera)
  function placeCamera(dt) {
    if (!user.drag) { user.yaw += user.vy * dt; user.vy *= Math.exp(-dt * 3); }
    const aspect = W / H, fov = rig.fov, th = Math.tan(fov * Math.PI / 360), need = 3.5 / (th * aspect), fit = Math.max(1, need / HOME.dist);
    const yaw = rig.yaw + user.yaw, pitch = clamp(rig.pitch + user.pitch, -0.02, 1.2), d = rig.dist * fit * user.zoom;
    camera.fov = fov; camera.aspect = aspect; camera.updateProjectionMatrix();
    const ty = rig.ty + Math.sin(time * 0.31) * 0.012;
    camera.position.set(rig.tx + Math.sin(yaw) * Math.cos(pitch) * d, ty + Math.sin(pitch) * d, rig.tz + Math.cos(yaw) * Math.cos(pitch) * d);
    if (camera.position.y < 0.18) camera.position.y = 0.18;
    // (in the room: never through a wall)
    camera.position.x = clamp(camera.position.x, ROOM.x0 + 0.4, ROOM.x1 - 0.4); camera.position.z = clamp(camera.position.z, ROOM.z0 + 0.4, ROOM.z1 - 0.4); camera.position.y = Math.min(camera.position.y, ROOM.h - 0.4);
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
      rig.yaw = from.yaw + u0.yaw + dy * k; user.yaw = 0; user.pitch = u0.pitch * (1 - k); user.zoom = lerp(u0.zoom, 1, k); user.vy = 0;
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

  /* ---------------- input: drag to go round the car, pinch or wheel to come closer; a tap speeds an animation up ---------------- */
  function bindInput(el) {
    const pts = new Map(); let lastX = 0, lastY = 0, moved = 0, pinch = 0, t0 = 0;
    el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); lastX = e.clientX; lastY = e.clientY; moved = 0; t0 = performance.now(); user.drag = true; user.vy = 0;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    el.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch > 0) user.zoom = clamp(user.zoom * pinch / d, 0.62, 1.3); pinch = d; moved += 10; return; }
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      const k = 3.2 / Math.max(240, el.clientWidth);
      user.yaw -= dx * k; user.pitch = clamp(user.pitch + dy * k * 0.8, -0.16, 0.75); user.vy = -dx * k * 60 * 0.5; userT = 0;
    });
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (!pts.size) { user.drag = false; if (moved < 8 && performance.now() - t0 < 300 && busy) speed = 3; } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', (e) => { e.preventDefault(); user.zoom = clamp(user.zoom * Math.exp(e.deltaY * 0.001), 0.62, 1.3); }, { passive: false });
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
  // cut (the body's materials only: the wheels and the shadow are never cut)
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
    carMats(cv);
    if (v.blob) { v.blob.material.map = TX.under; v.blob.material.opacity = 0.9; v.blob.scale.set(1, 1, 1); v.blob.position.y = 0.012; }
    cv.tailOn = new THREE.MeshBasicMaterial({ color: 0xff2a1a }); cv.tailOn.clippingPlanes = [cv.clip]; cv.tailOff = v.tail.material;
    // the lamps' glows
    const gl = (p, col, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); sp.position.copy(p); sp.scale.set(s, s, s); sp.renderOrder = 10; v.bodyG.add(sp); return sp; };
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
    for (const k in cv.parts) dropParts(cv.parts[k]);
    Render.garageFree(cv.v); cv.tailOn.dispose();
  }
  function disposeTree(o) { if (!o) return; o.traverse(x => { if (x.geometry && !x.geometry.userData.keep) x.geometry.dispose(); if (x.material && x.material.userData && x.material.userData.own) x.material.dispose(); }); if (o.parent) o.parent.remove(o); }
  function setCond(cv, c, now) {   // the wear on the car: dirt (clean), scratches (body); the engine's state shows when it runs
    if (c) Object.assign(cv.spec.cond, c);
    const cc = cv.spec.cond, v = cv.v;
    if (v.dirtU) v.dirtU.value = (1 - clamp(cc.clean, 0, 1)) * 0.75;
    if (v.scrU) v.scrU.value = (1 - clamp(cc.body, 0, 1)) * 1.0;
  }
  function lamps(cv, head, tail) {
    for (const s of cv.head) s.material.opacity = head * 0.9;
    for (const s of cv.tailG) s.material.opacity = tail * 0.85;
    cv.v.tail.material = tail > 0.6 ? cv.tailOn : cv.tailOff;
  }
  // the car's pose each frame: the body's pitch, roll, bounce and shake on its springs, the wheels' spin
  function poseCar(cv, dt) {
    const v = cv.v, sh = cv.shake > 0 ? cv.shake : 0;
    v.bodyG.rotation.z = cv.pitch + (sh ? (Math.random() - 0.5) * 0.004 * sh : 0);
    v.bodyG.rotation.x = cv.roll + (sh ? (Math.random() - 0.5) * 0.006 * sh : 0);
    v.bodyG.position.y = cv.bounce + (sh ? (Math.random() - 0.5) * 0.004 * sh : 0);
    for (const w of cv.wheels) if (w.obj) w.obj.rotation.z = -cv.spin * (cv.M.rw / Math.max(0.2, w.r));
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
    if (ti) { const p = g.attributes.position, c = []; for (let i = 0; i < p.count; i++) { const t = clamp((p.getX(i) + len / 2) / len, 0, 1); const hue = [lerp(0.55, 0.25, t), lerp(0.42, 0.3, t), lerp(0.25, 0.78, t)]; c.push(...(t > 0.5 ? [lerp(0.7, 0.35, (t - 0.5) * 2), lerp(0.55, 0.32, (t - 0.5) * 2), lerp(0.4, 0.85, (t - 0.5) * 2)] : [lerp(0.78, 0.7, t * 2), lerp(0.76, 0.55, t * 2), lerp(0.74, 0.4, t * 2)])); void hue; } g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); }
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
          const s = new THREE.Mesh(bx(K.wfx - K.wrx - 0.6, 0.02, 0.03), PM.blueGlow); for (const sd of [-1, 1]) { const m = s.clone(); m.position.set((K.wfx + K.wrx) / 2, K.bottom + 0.02, sd * (K.sideZ - 0.04)); grp.add(item(m, 'side')); }
          const pool = new THREE.Mesh(new THREE.PlaneGeometry(K.front - K.rear + 0.4, K.hw * 2 + 0.7), new THREE.MeshBasicMaterial({ map: TX.glow, color: 0x2a8cff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.25 + lv * 0.18 }));
          pool.material.userData.own = true; pool.rotation.x = -Math.PI / 2; pool.position.set((K.front + K.rear) / 2, -K.bottom + 0.0, 0); pool.renderOrder = 4; grp.add(item(pool, 'fade'));
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
          mesh(bx(0.34, 0.012, 0.24), PM.black, 0, 0, 0, vg);
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
    (kind === 'zavore' || kind === 'gume' ? v.grp : v.bodyG).add(grp);
    return grp;
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
  function partsK(grp, k, kind, zone) {
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
    void kind;
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
      const m = new THREE.Mesh(FLAME_GEO(), new THREE.MeshBasicMaterial({ map: TX.flame, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
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
    const lm = new THREE.MeshBasicMaterial({ color: 0x47c6ff }); lm.userData.own = true;
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
      for (let x = x0; x >= x1; x -= 0.2) { const t = clamp((x - K.rear) / (K.front - K.rear), 0, 1), inside = x <= K.front && x >= K.rear, w = (P.side(clamp(x, K.rear + 0.1, K.front - 0.1), y, sd) || K.hw) + 0.1;
        out.push(new V3(x, y, sd * (inside ? Math.max(w, K.hw * 0.9 + 0.1) : lerp(K.hw * 0.75, K.hw + 0.1, x > K.front ? 1 - (x - K.front) / (x0 - K.front) : 1 - (K.rear - x) / (K.rear - x1) * 0.5)))); void t; }
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
      const up = lv > from, old = cv.parts[kind], nw = partsFor(cv, kind, lv); partsK(nw, 0, kind); cv.spec.upg[kind] = lv;
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
    yield* tween(0.45, (k) => partsK(grp, 1 - k, kind, zone), EZ.in);
    if (!zone) grp.visible = false;
  }
  function* partsIn(cv, grp, kind, s, zone) {
    if (!hasZone(grp, zone)) return;
    let clunked = false;
    yield* tween(s || 0.8, (k) => { partsK(grp, k, kind, zone); if (k > 0.72 && !clunked) { clunked = true; SFX.clunk(0.9); } }, (t) => t);
    partsK(grp, 1, kind, zone);
    const box = zoneBox(grp, zone); if (!box.isEmpty()) { const c = box.getCenter(new V3()), sz = box.getSize(new V3()); for (let i = 0; i < 5; i++) glint(c.clone().add(new V3((Math.random() - 0.5) * sz.x, (Math.random() - 0.3) * sz.y, (Math.random() - 0.5) * sz.z)), 0.3, 0xffffff); SFX.ping(2093); }
  }
  // where the car turns and the camera goes to show a zone of the car (the turntable's angle; the camera round a point of the car)
  function zoneView(cv, kind, zone) {
    const K = cv.kit, mid = (K.top + K.bottom) / 2;
    const V = {
      'motor.rear': [1.75, { at: [K.exX + 0.15, K.exY + 0.16, 0], pitch: 0.12, dist: 4.1 }],
      'motor.side': [0.55, { at: [0, K.bottom + 0.15, 0], pitch: 0.04, dist: 6.6 }],
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
    partsK(grp, 1, 'motor', zone); const box = zoneBox(grp, zone); partsK(grp, 0, 'motor', zone); if (box.isEmpty()) return;
    const c = box.getCenter(new V3()), sz = box.getSize(new V3());
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow, color: 0xbfe2ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); fl.scale.setScalar(0.9); scene.add(fl);
    yield* tween(0.8, (k, u) => {
      const p = c.clone().add(new V3((Math.random() - 0.5) * sz.x, (Math.random() - 0.5) * sz.y * 0.5, (Math.random() - 0.5) * sz.z));
      fl.position.copy(p); fl.material.opacity = Math.random() < 0.6 ? 0.9 : 0.2; fl.scale.setScalar(0.5 + Math.random() * 0.7);
      for (let i = 0; i < 3; i++) sparks.emit(p.x, p.y, p.z, (Math.random() - 0.5) * 3, Math.random() * 2.5, (Math.random() - 0.5) * 3, 0.3 + Math.random() * 0.4, 0.04, 0.012, [1, 0.75, 0.35], 1, 9, 0.5, 0.02);
      if (Math.random() < 0.3) SFX.spark(); void u;
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
      for (const k in nw.parts) nw.parts[k].visible = false;
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
      cv.root.remove(nw.root); nw.v.grp.traverse(o => { if (o.isMesh) o.visible = true; });
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

  /* ---------------- set-up, size, the frame ---------------- */
  function init(canvas) {
    renderer = Render.init(canvas);
    renderer.localClippingEnabled = true;
    renderer.setClearColor(0x0d1420, 1);
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x0d1420);
    camera = new THREE.PerspectiveCamera(HOME.fov, 1.6, 0.1, 60);
    makeTextures();
    buildLights(); buildFloor(); buildRoom(); buildTurntable();
    // the room in the cars' paint and glass: a cube map of it, made once from where a car's middle is
    cubeRT = new THREE.WebGLCubeRenderTarget(256, { format: THREE.RGBAFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    const cc = new THREE.CubeCamera(0.2, 40, cubeRT); cc.position.set(0, 0.9, 0); scene.add(cc);
    REF.k.value = 0; ttTop.visible = true; cc.update(renderer, scene); REF.k.value = 0.62; scene.remove(cc);
    env = cubeRT.texture;
    makePartMats();
    puffs = new Puffs(1400, false); sparks = new Puffs(900, true); scene.add(puffs.pts, sparks.pts);
    Render.garageLight(KEY_DIR, 0xfff2e0, 0.5, 0xffffff);
    bindInput(canvas);
    ready = true;
  }
  function resize(w, h, pr) {
    W = Math.max(2, w); H = Math.max(2, h);
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    const rw = Math.max(2, Math.round(W * pr * REF.size)), rh = Math.max(2, Math.round(H * pr * REF.size));
    REF.rt.setSize(rw, rh); REF.texel.set(1 / rw, 1 / rh);
    const sc = H * pr / (2 * Math.tan(HOME.fov * Math.PI / 360));
    puffs.mat.uniforms.uScale.value = sparks.mat.uniforms.uScale.value = motes.material.uniforms.uScale.value = sc;
  }
  // the car shown first: no drive-in, it stands there
  function show(spec) {
    if (cur) freeCar(cur);
    cur = makeCar(spec); tt.add(cur.root);
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
    ringGlow.material.uniforms.uK.value = 0.3 + 0.06 * Math.sin(time * 1.6);
    signGlow.material.opacity = 0.17 + 0.015 * Math.sin(time * 2.3);
    if ((time * 10 | 0) % 2 === 0) drawMonitor(time);
    userT += dt;
    if (autoSpin && !busy && !user.drag) rig.yaw += dt * 0.32;
    placeCamera(dt);
    if (noDraw) return;
    drawReflection();
    renderer.render(scene, camera);
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
    const cam = new THREE.PerspectiveCamera(24, w / h, 0.1, 50), L = Math.max(4, cv.M.len);
    cam.position.set(L * 0.95, L * 0.5, L * 1.55); cam.lookAt(0, 0.45, 0);
    const rt = new THREE.WebGLRenderTarget(w * 2, h * 2, { format: THREE.RGBAFormat }); const old = renderer.getClearColor(new THREE.Color()), oa = renderer.getClearAlpha();
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, cam);
    const px = new Uint8Array(w * 2 * h * 2 * 4); renderer.readRenderTargetPixels(rt, 0, 0, w * 2, h * 2, px);
    renderer.setRenderTarget(null); renderer.setClearColor(old, oa);
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
    sound(on) { sndInit(); if (SND.out) SND.out.gain.value = on ? 0.7 : 0; SND.vol = on ? 0.7 : 0; if (typeof Sfx !== 'undefined') { Sfx.resume(); Sfx.setEnabled(on); } },
    setCond(c) { if (cur) setCond(cur, c); },
    get cur() { return cur; },
    get info() { return cur ? { car: cur.M.id, color: cur.spec.color, stripe: cur.spec.stripe !== false, upg: Object.assign({}, cur.spec.upg), parts: Object.keys(cur.parts).reduce((o, k) => (o[k] = cur.parts[k].userData.items.length, o), {}), dirt: cur.v.dirtU ? +cur.v.dirtU.value.toFixed(3) : null, scr: cur.v.scrU ? +cur.v.scrU.value.toFixed(3) : null, lift: +lift.toFixed(3), ang: +ttAng.toFixed(3) } : null; },
    _dbg: { REF, TX, tasks, get floorMat() { return floorMat; }, get keyLight() { return keyLight; } },
    get renderer() { return renderer; }, get camera() { return camera; }, get scene() { return scene; },
  };
})();
