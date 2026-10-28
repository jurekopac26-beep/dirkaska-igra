(() => {
  // (pictures only) the user: "naredi da vulkan nima dima samo lava se premika". The volcano's smoke, the steam from its vents and the flying bombs
  // are gone (and out of the films' motion); its lava moves instead: down each flow slide glowing streaks and dark crust plates (a texture along
  // the flow, its core faster than its body), the crater's lake turns slowly with its crust and hot cracks, its hot spots swell and shrink, its
  // bubbles rise and burst, and the glow over the crater flickers. window.__LAVA(t) (t in seconds); window.__ANIM(t) calls it as well.
  const VA = window.__VOLCA; if (!VA) return 'no volcano';
  if (!VA.hidden) VA.hidden = { smoke: VA.smoke, vents: VA.vents, bombs: VA.bombs };
  for (const s of VA.hidden.smoke) s.p.visible = false; for (const v of VA.hidden.vents) v.p.visible = false; for (const b of VA.hidden.bombs) b.b.visible = false;
  VA.smoke = []; VA.vents = []; VA.bombs = [];
  const ROOT = VA.hidden.smoke.length ? VA.hidden.smoke[0].p.parent : null; if (!ROOT) return 'no root';
  // the lava's textures: drawn once, seamless along v
  const rnd = (() => { let s = 1234567; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const cvTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); draw(c, w, h); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const wrapDraw = (c, h, f) => { for (const dy of [-h, 0, h]) { c.save(); c.translate(0, dy); f(); c.restore(); } };
  const body = (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#5a1206'); g.addColorStop(0.5, '#c2380c'); g.addColorStop(1, '#5a1206'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    // glowing streaks along the flow
    for (let k = 0; k < 70; k++) { const x = w * (0.15 + rnd() * 0.7), y = rnd() * h, l = 18 + rnd() * 60, r = 2 + rnd() * 6, col = rnd() < 0.5 ? 'rgba(255,150,40,0.55)' : 'rgba(255,214,90,0.45)'; wrapDraw(c, h, () => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r, l / 2, 0, 0, Math.PI * 2); c.fill(); }); }
    // dark crust plates riding on it
    for (let k = 0; k < 26; k++) { const x = w * (0.1 + rnd() * 0.8), y = rnd() * h, s = 5 + rnd() * 11, n = 5 + Math.floor(rnd() * 3), pts = []; for (let q = 0; q < n; q++) { const a = q / n * Math.PI * 2, rr = s * (0.6 + rnd() * 0.5); pts.push([x + Math.cos(a) * rr * 0.8, y + Math.sin(a) * rr * 1.3]); }
      wrapDraw(c, h, () => { c.fillStyle = rnd() < 0.5 ? 'rgba(40,14,8,0.85)' : 'rgba(70,22,10,0.8)'; c.beginPath(); pts.forEach(([px, py], q) => q ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,120,30,0.6)'; c.lineWidth = 1.2; c.stroke(); }); } };
  const core = (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#e05a10'); g.addColorStop(0.5, '#ffd25a'); g.addColorStop(1, '#e05a10'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 60; k++) { const x = w * (0.2 + rnd() * 0.6), y = rnd() * h, l = 14 + rnd() * 50, r = 1.5 + rnd() * 4, col = rnd() < 0.5 ? 'rgba(255,250,200,0.6)' : 'rgba(255,120,20,0.5)'; wrapDraw(c, h, () => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r, l / 2, 0, 0, Math.PI * 2); c.fill(); }); } };
  const lake = (c, w, h) => { c.fillStyle = '#d2440e'; c.fillRect(0, 0, w, h); for (let k = 0; k < 90; k++) { const x = rnd() * w, y = rnd() * h, r = 6 + rnd() * 22; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,236,140,0.85)'); g.addColorStop(1, 'rgba(255,140,30,0)'); for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { c.fillStyle = g; c.save(); c.translate(dx, dy); c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); } }
    for (let k = 0; k < 40; k++) { const x = rnd() * w, y = rnd() * h, s = 8 + rnd() * 18, n = 6, pts = []; for (let q = 0; q < n; q++) { const a = q / n * Math.PI * 2 + rnd() * 0.4, rr = s * (0.6 + rnd() * 0.5); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { c.save(); c.translate(dx, dy); c.fillStyle = 'rgba(46,16,8,0.9)'; c.beginPath(); pts.forEach(([px, py], q) => q ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,170,60,0.7)'; c.lineWidth = 2; c.stroke(); c.restore(); } } };
  const TB = cvTex(64, 256, body), TC = cvTex(32, 256, core), TL = cvTex(256, 256, lake);
  // the lava's meshes in the volcano: by their materials' colours (body 0xff5a14, the bright core 0xffb03a, the brightest 0xfff0a0)
  const isC = (m, hex) => m && m.isMeshBasicMaterial && m.color && m.color.getHex() === hex && !m.map;
  const flows = [], lakes = [], spots = [], bubbles = [], seen = new Set(); let glow = null;
  ROOT.traverse(o => { if (o.isPointLight) glow = o; if (!o.isMesh || seen.has(o)) return; seen.add(o); const m = o.material, g = o.geometry;
    const body0 = isC(m, 0xff5a14), core0 = isC(m, 0xffb03a), hot0 = isC(m, 0xfff0a0); if (!body0 && !core0 && !hot0) return;
    if (g.type === 'BufferGeometry' && g.index && !g.attributes.uv) flows.push({ o, kind: body0 ? 0 : core0 ? 1 : 2 });
    else if (g.type === 'ShapeGeometry' || g.type === 'ShapeBufferGeometry') { if (body0) lakes.push(o); }
    else if (g.type === 'CircleGeometry' || g.type === 'CircleBufferGeometry') spots.push({ o, s0: o.scale.x, ph: rnd() * 6.28 });
    else if (g.type === 'SphereGeometry' || g.type === 'SphereBufferGeometry') bubbles.push({ o, s0: o.scale.x, ph: rnd(), y0: o.position.y }); });
  // the flows: u across, v down along each (3 m to a repeat of the texture); each its own texture so each can slide at its own speed
  const flowMats = [];
  for (const f of flows) { const g = f.o.geometry, P = g.attributes.position, n = P.count / 2, uv = new Float32Array(P.count * 2); let acc = 0;
    for (let s = 0; s < n; s++) { if (s) { const mx = (P.getX(2 * s) + P.getX(2 * s + 1)) / 2 - (P.getX(2 * s - 2) + P.getX(2 * s - 1)) / 2, mz = (P.getZ(2 * s) + P.getZ(2 * s + 1)) / 2 - (P.getZ(2 * s - 2) + P.getZ(2 * s - 1)) / 2; acc += Math.hypot(mx, mz); } uv[4 * s] = 0; uv[4 * s + 1] = acc / 3; uv[4 * s + 2] = 1; uv[4 * s + 3] = acc / 3; }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); const t = (f.kind === 0 ? TB : TC).clone(); t.needsUpdate = true; const mat = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, color: f.kind === 2 ? 0xfff2c0 : 0xffffff });
    f.o.material = mat; flowMats.push({ t, v: f.kind === 0 ? 0.11 : f.kind === 1 ? 0.2 : 0.3, ph: rnd() }); }
  // the lake: its own texture, turning slowly about the middle
  const lakeTex = [];
  for (const o of lakes) { const t = TL.clone(); t.needsUpdate = true; t.repeat.set(0.09, 0.09); t.center.set(0.5, 0.5); o.material = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }); lakeTex.push(t); }
  const g0 = glow ? glow.intensity : 0;
  window.__LAVA = (t) => { for (const f of flowMats) f.t.offset.set(0, -(t * f.v + f.ph) % 1);
    for (const lt of lakeTex) { lt.rotation = t * 0.035; lt.offset.set(Math.sin(t * 0.07) * 0.6, Math.cos(t * 0.05) * 0.6); }
    for (const s of spots) { const k = 1 + 0.18 * Math.sin(t * 1.3 + s.ph) + 0.08 * Math.sin(t * 3.1 + s.ph * 2); s.o.scale.set(s.s0 * k, s.s0 * k, 1); }
    for (const b of bubbles) { const q = ((t / 2.4 + b.ph) % 1 + 1) % 1, sw = q < 0.85 ? Math.sin(q / 0.85 * Math.PI * 0.5) : 0; b.o.scale.set(b.s0 * (0.4 + 0.8 * sw), b.s0 * (0.2 + 1.1 * sw), b.s0 * (0.4 + 0.8 * sw)); b.o.visible = q < 0.85; }
    if (glow) glow.intensity = g0 * (0.9 + 0.08 * Math.sin(t * 2.7) + 0.05 * Math.sin(t * 6.1 + 1)); return t; };
  if (window.__ANIM && !window.__ANIM.__lava) { const A0 = window.__ANIM; window.__ANIM = (t) => { const r = A0(t); window.__LAVA(t); return r; }; window.__ANIM.__lava = true; }
  window.__LAVA(0);
  return JSON.stringify({ flows: flows.length, lakes: lakes.length, spots: spots.length, bubbles: bubbles.length, glow: !!glow, hidden: [VA.hidden.smoke.length, VA.hidden.vents.length, VA.hidden.bombs.length], C: [VA.CX, VA.CZ, VA.yLake].map(v => +v.toFixed(1)) });
})()
