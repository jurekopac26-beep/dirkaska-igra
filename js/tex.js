/* =========================================================================
   TEXTURES — all procedural (canvas)
   ========================================================================= */
const Tex = (function () {
  'use strict';
  const R = Core.rng(99);
  let aniso = 4;
  function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function mk(c, repeat, nearest) {
    const t = new THREE.CanvasTexture(c);
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    t.anisotropy = aniso;
    if (nearest) { t.magFilter = THREE.NearestFilter; }
    return t;
  }
  // tileable value noise on lattice P
  function makeNoise(P, seed) {
    const r = Core.rng(seed); const g = new Float32Array(P * P);
    for (let i = 0; i < g.length; i++) g[i] = r();
    return function (x, y) { // x,y in lattice units
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const a = g[((yi % P + P) % P) * P + ((xi % P + P) % P)], b = g[((yi % P + P) % P) * P + (((xi + 1) % P + P) % P)];
      const c = g[(((yi + 1) % P + P) % P) * P + ((xi % P + P) % P)], d = g[(((yi + 1) % P + P) % P) * P + (((xi + 1) % P + P) % P)];
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
    };
  }
  function pixels(w, h, fn) {
    const c = cv(w, h), x = c.getContext('2d'); const img = x.createImageData(w, h); const d = img.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const o = (j * w + i) * 4; const col = fn(i, j); d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = col[3] == null ? 255 : col[3]; }
    x.putImageData(img, 0, 0); return c;
  }
  const cl = (v) => v < 0 ? 0 : v > 255 ? 255 : v;

  function grass() {
    const n1 = makeNoise(8, 3), n2 = makeNoise(32, 4), n3 = makeNoise(64, 5);
    const c = pixels(256, 256, (i, j) => {
      const u = i / 256, v = j / 256;
      const n = n1(u * 8, v * 8) * 0.5 + n2(u * 32, v * 32) * 0.35 + n3(u * 64, v * 64) * 0.15;
      const stripe = j < 128 ? 1.035 : 0.965;
      const sp = R() < 0.08 ? (R() < 0.5 ? 0.86 : 1.12) : 1;
      const k = (0.84 + n * 0.3) * stripe * sp;
      return [cl(88 * k), cl(146 * k), cl(58 * k)];
    });
    const x = c.getContext('2d');
    for (let k = 0; k < 900; k++) { // blades
      const px = R() * 256, py = R() * 256; const l = 2 + R() * 3;
      x.strokeStyle = R() < 0.5 ? 'rgba(40,86,30,0.45)' : 'rgba(150,196,90,0.35)';
      x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (R() - 0.5) * 2, py - l); x.stroke();
    }
    return mk(c, true);
  }

  function asphalt() {
    const n1 = makeNoise(4, 11), n2 = makeNoise(16, 12);
    const c = pixels(256, 256, (i, j) => {
      const u = i / 256, v = j / 256;
      const n = n1(u * 4, v * 4) * 0.6 + n2(u * 16, v * 16) * 0.4;
      let k = 0.9 + n * 0.14 + (R() - 0.5) * 0.16;
      if (R() < 0.02) k += 0.25;
      return [cl(104 * k), cl(107 * k), cl(112 * k)];
    });
    const x = c.getContext('2d');
    // a few seams / cracks
    x.strokeStyle = 'rgba(40,40,44,0.35)'; x.lineWidth = 1;
    for (let k = 0; k < 6; k++) {
      let px = R() * 256, py = R() * 256; x.beginPath(); x.moveTo(px, py);
      for (let s = 0; s < 8; s++) { px += (R() - 0.5) * 18; py += (R() - 0.3) * 14; x.lineTo(px, py); }
      x.stroke();
    }
    return mk(c, true);
  }

  function curb() {
    const c = cv(32, 64), x = c.getContext('2d');
    x.fillStyle = '#d8342a'; x.fillRect(0, 0, 32, 32);
    x.fillStyle = '#f4f1ea'; x.fillRect(0, 32, 32, 32);
    // edge bevel shading
    const g = x.createLinearGradient(0, 0, 32, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.0)'); g.addColorStop(0.75, 'rgba(0,0,0,0.0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 64);
    const t = mk(c, true); t.magFilter = THREE.NearestFilter; return t;
  }

  // red / white kerb with a blue block every third pair (the long kerb on the right leg of the forest circuit, as in the reference); 6 blocks per repeat
  function curbRWB() {
    const c = cv(32, 192), x = c.getContext('2d'), cols = ['#d8342a', '#f4f1ea', '#d8342a', '#f4f1ea', '#2f62c4', '#f4f1ea'];
    cols.forEach((col, k) => { x.fillStyle = col; x.fillRect(0, k * 32, 32, 32); });
    const g = x.createLinearGradient(0, 0, 32, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.0)'); g.addColorStop(0.75, 'rgba(0,0,0,0.0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 192);
    const t = mk(c, true); t.magFilter = THREE.NearestFilter; return t;
  }

  function gravel() {
    // dried cracked earth (voronoi edges) in orange-tan
    const pts = []; for (let k = 0; k < 42; k++) pts.push([R() * 256, R() * 256]);
    const n2 = makeNoise(32, 21);
    const c = pixels(256, 256, (i, j) => {
      let d1 = 1e9, d2 = 1e9;
      for (const p of pts) {
        for (let ox = -256; ox <= 256; ox += 256) for (let oy = -256; oy <= 256; oy += 256) {
          const dx = i - p[0] - ox, dy = j - p[1] - oy; const d = dx * dx + dy * dy;
          if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
        }
      }
      const e = Math.sqrt(d2) - Math.sqrt(d1);
      const n = n2(i / 8, j / 8);
      let k = 0.88 + n * 0.2 + (R() - 0.5) * 0.12;
      if (e < 1.6) k *= 0.62; else if (e < 3.2) k *= 0.86;
      return [cl(205 * k), cl(150 * k), cl(88 * k)];
    });
    return mk(c, true);
  }

  // a gravel trap's pebbles (the realistic tracks; the Circuit Superstars ones keep their cracked earth): a light grey-beige bed of grit and
  // pebbles of every size, each lit from the sky (lighter on top, a shadow under it), tileable (each pebble drawn again across the edges);
  // a tile is 2.6 m (World: gravelBed adds the large-scale blotches that hide the repeat)
  function pebbles() {
    const S = 256, c = cv(S, S), x = c.getContext('2d'), r = Core.rng(311), n = makeNoise(16, 312);
    const img = x.createImageData(S, S), d = img.data;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const k = 0.8 + n(i / 16, j / 16) * 0.16 + (r() - 0.5) * 0.18, o = (j * S + i) * 4; d[o] = cl(176 * k); d[o + 1] = cl(166 * k); d[o + 2] = cl(148 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    const pal = [[196, 188, 172], [178, 170, 156], [150, 144, 134], [206, 200, 188], [168, 150, 128], [126, 120, 114], [188, 176, 150]];
    for (let k = 0; k < 1500; k++) {
      const big = r() < 0.12, rad = big ? 3.5 + r() * 3.5 : 1.2 + r() * 2.4, px = r() * S, py = r() * S, el = 0.6 + r() * 0.4, rot = r() * Math.PI, P = pal[Math.floor(r() * pal.length)], v = 0.9 + r() * 0.2;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        const cx = px + ox, cy = py + oy; if (cx < -8 || cx > S + 8 || cy < -8 || cy > S + 8) continue;
        x.save(); x.translate(cx, cy); x.rotate(rot);
        x.fillStyle = 'rgba(40,36,30,0.45)'; x.beginPath(); x.ellipse(rad * 0.25, rad * 0.35, rad, rad * el, 0, 0, Math.PI * 2); x.fill();   // (its shadow, down to the lower right)
        x.fillStyle = 'rgb(' + (P[0] * v | 0) + ',' + (P[1] * v | 0) + ',' + (P[2] * v | 0) + ')'; x.beginPath(); x.ellipse(0, 0, rad, rad * el, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = 'rgba(255,255,250,0.28)'; x.beginPath(); x.ellipse(-rad * 0.3, -rad * 0.3 * el, rad * 0.45, rad * 0.3 * el, 0, 0, Math.PI * 2); x.fill();   // (the sky on its top)
        x.restore();
      }
    }
    return mk(c, true);
  }

  function water() {
    const n1 = makeNoise(8, 31), n2 = makeNoise(16, 32);
    const c = pixels(256, 256, (i, j) => {
      const u = i / 256, v = j / 256;
      const w1 = Math.sin((u * 3 + n1(u * 8, v * 8) * 0.8) * Math.PI * 2 + v * 20);
      const n = n2(u * 16, v * 16);
      let k = 0.9 + n * 0.16;
      let r = 44 * k, g = 128 * k, b = 190 * k;
      if (w1 > 0.93) { r += 70; g += 70; b += 50; }
      return [cl(r), cl(g), cl(b)];
    });
    return mk(c, true);
  }

  function crowd() {
    const c = cv(256, 128), x = c.getContext('2d');
    x.fillStyle = '#3b3f48'; x.fillRect(0, 0, 256, 128);
    const cols = ['#e63b2e', '#f5d33a', '#2f7fe0', '#f2f2f2', '#39b54a', '#ff8a1c', '#e85aa8', '#7d4bd6', '#111', '#1bbfd6'];
    for (let row = 0; row < 16; row++) {
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, row * 8 + 6, 256, 2);
      for (let k = 0; k < 64; k++) {
        if (R() < 0.12) continue;
        const px = k * 4 + (R() - 0.5) * 1.2, py = row * 8 + 1;
        x.fillStyle = cols[Math.floor(R() * cols.length)]; x.fillRect(px, py + 2, 3, 4);
        x.fillStyle = R() < 0.5 ? '#f1c7a1' : '#a86f45'; x.fillRect(px + 0.5, py, 2, 2);
      }
    }
    return mk(c, true);
  }

  // the sponsors on the boards: all invented (no real brand, no name of a real person or place: check a new one before adding it)
  const SPONSORS = [
    ['HITROLET', '#101418', '#ffd23f'], ['KAZE OIL', '#d8342a', '#fff'], ['GRIP+', '#1b4fd6', '#fff'], ['KOLOTEK TYRES', '#f5f5f0', '#111'],
    ['KRESILO', '#1a1a1a', '#6df26d'], ['RADIO JEZERO', '#2aa6e0', '#fff'], ['BENCINKO', '#ff8a1c', '#141414'], ['ŠUMKA COLA', '#b3122e', '#fff3c4'],
  ];
  function sponsors() {
    const c = cv(512, 256), x = c.getContext('2d');
    for (let k = 0; k < 8; k++) {
      const bx = (k % 2) * 256, by = Math.floor(k / 2) * 64;
      const [txt, bg, fg] = SPONSORS[k];
      x.fillStyle = bg; x.fillRect(bx, by, 256, 64);
      x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(bx, by, 256, 6);
      x.fillStyle = fg; x.font = 'italic 900 40px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.save(); x.translate(bx + 128, by + 34); x.scale(Math.min(1, 230 / Math.max(1, x.measureText(txt).width)), 1); x.fillText(txt, 0, 0); x.restore();
      x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 3; x.strokeRect(bx + 1.5, by + 1.5, 253, 61);
    }
    return mk(c, false);
  }

  // tyre wall of whole painted tyres: red and white in pairs, two rows (as on the forest circuit in the reference video)
  // tyre wall of whole painted tyres (red and white in pairs): top half = seen from the front (two rows), bottom half = seen from above (rings)
  function tiresRW() {
    const c = cv(128, 128), x = c.getContext('2d');
    x.fillStyle = '#2a1a1c'; x.fillRect(0, 0, 128, 128);
    const cols = ['#e23a32', '#e23a32', '#f2efe9', '#f2efe9'];
    for (let s = 0; s < 4; s++) for (let r = 0; r < 2; r++) {   // front view
      const cx = s * 32 + 16, cy = 16 + r * 32, col = cols[(s + r * 2) % 4];
      x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, 15.5, 15, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(0,0,0,0.28)'; x.beginPath(); x.ellipse(cx, cy + 2, 15.5, 13, 0, 0, Math.PI); x.fill();
      x.fillStyle = '#16171a'; x.beginPath(); x.ellipse(cx, cy, 7, 6.5, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.22)'; x.fillRect(cx - 10, cy - 13, 20, 2.5);
    }
    x.fillStyle = '#1b1c20'; x.fillRect(0, 64, 128, 64);
    for (let s = 0; s < 4; s++) for (let r = 0; r < 2; r++) {   // seen from above: rings with dark holes
      const cx = s * 32 + 16 + (r ? 8 : 0), cy = 80 + r * 32, col = cols[(s + (r ? 1 : 0)) % 4];
      x.fillStyle = col; x.beginPath(); x.arc(cx % 128, cy, 15, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.beginPath(); x.arc(cx % 128, cy, 11, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#121316'; x.beginPath(); x.arc(cx % 128, cy, 7, 0, Math.PI * 2); x.fill();
    }
    return mk(c, true);
  }
  function tires() {
    const c = cv(128, 64), x = c.getContext('2d');
    x.fillStyle = '#16171a'; x.fillRect(0, 0, 128, 64);
    const bands = [null, '#e8e8e8', null, '#d8342a'];
    for (let s = 0; s < 4; s++) {
      for (let t = 0; t < 3; t++) {
        const cx = s * 32 + 16, cy = 11 + t * 21;
        x.fillStyle = '#26282c'; x.beginPath(); x.ellipse(cx, cy, 15, 10, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#0d0e10'; x.beginPath(); x.ellipse(cx, cy, 8, 5, 0, 0, Math.PI * 2); x.fill();
        if (bands[s] && t === 1) { x.fillStyle = bands[s]; x.fillRect(cx - 15, cy - 3, 30, 6); }
        x.fillStyle = 'rgba(255,255,255,0.10)'; x.fillRect(cx - 12, cy - 9, 24, 2);
      }
    }
    return mk(c, true);
  }

  function fence() {
    const c = cv(64, 64), x = c.getContext('2d');
    x.clearRect(0, 0, 64, 64);
    x.strokeStyle = 'rgba(210,214,220,1)'; x.lineWidth = 2;
    for (let k = -64; k < 128; k += 16) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 64, 64); x.stroke(); x.beginPath(); x.moveTo(k + 64, 0); x.lineTo(k, 64); x.stroke(); }
    const t = mk(c, true); return t;
  }

  function checker() {
    const c = cv(64, 16), x = c.getContext('2d');
    for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(i * 4, j * 4, 4, 4); }
    const t = mk(c, true); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t;
  }

  function blob() {
    const c = cv(64, 64), x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 4, 32, 32, 31);
    g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.6, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return mk(c, false);
  }

  function number(n, bg, fg) {
    const c = cv(64, 64), x = c.getContext('2d');
    x.fillStyle = bg || '#f4f4f0'; x.beginPath(); x.arc(32, 32, 29, 0, Math.PI * 2); x.fill();
    x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,0.5)'; x.stroke();
    x.fillStyle = fg || '#111'; x.font = '900 34px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(String(n), 32, 35);
    return mk(c, false);
  }

  function sand() {
    const n = makeNoise(16, 41);
    const c = pixels(128, 128, (i, j) => { const k = 0.9 + n(i / 8, j / 8) * 0.15 + (R() - 0.5) * 0.1; return [cl(214 * k), cl(196 * k), cl(150 * k)]; });
    return mk(c, true);
  }

  // city paving: light stone slabs with dark joints (tiles every 2 m of world at 1/14 uv scale)
  function paving() {
    const n = makeNoise(16, 57);
    const c = pixels(128, 128, (i, j) => {
      const row = Math.floor(j / 16), off = (row % 2) * 12;
      const jx = (i + off) % 24, jy = j % 16;
      const joint = jx < 1 || jy < 1;
      const stone = (Math.floor((i + off) / 24) * 7 + row * 13) % 5;
      const k = (joint ? 0.62 : 0.92 + stone * 0.025) + n(i / 8, j / 8) * 0.07 + (R() - 0.5) * 0.05;
      return [cl(206 * k), cl(198 * k), cl(184 * k)];
    });
    return mk(c, true);
  }
  // building facade: white wall (tinted by vertex colour) with window grid; one tile = 1 window bay x 1 floor
  function facade() {
    const c = cv(64, 64), g = c.getContext('2d');
    g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 64, 1);
    g.fillStyle = '#6b7f96'; g.fillRect(18, 16, 28, 34);             // window glass
    g.fillStyle = '#9fb3c8'; g.fillRect(20, 18, 11, 14);             // sky reflection
    g.fillStyle = '#e8e2d4'; g.fillRect(16, 50, 32, 4);              // sill
    g.fillStyle = '#4d6b52'; g.fillRect(10, 16, 7, 34); g.fillRect(47, 16, 7, 34);   // green shutters
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(12, 20, 3, 26); g.fillRect(49, 20, 3, 26);
    return mk(c, true);
  }

  // makadam / gravel rally road: packed earth + scattered pebbles (with shadows/highlights),
  // plus a matching height map so the stones catch the sun (bump mapping). Tileable.
  function makadam() {
    const S = 256, n = makeNoise(16, 71), n2 = makeNoise(8, 72), n3 = makeNoise(32, 73);
    const c = pixels(S, S, (i, j) => {
      const k = 0.8 + n(i / 12, j / 12) * 0.2 + n2(i / 40, j / 40) * 0.14 + n3(i / 5, j / 5) * 0.08 + (R() - 0.5) * 0.16;
      return [cl(150 * k), cl(124 * k), cl(96 * k)];
    });
    const b = pixels(S, S, (i, j) => { const k = 112 + n3(i / 5, j / 5) * 44 + (R() - 0.5) * 34; return [cl(k), cl(k), cl(k)]; });
    const gc = c.getContext('2d'), gb = b.getContext('2d');
    for (let k = 0; k < 950; k++) {
      const x = R() * S, y = R() * S, r = 0.9 + R() * R() * 3.4, a = R() * Math.PI, t = R();
      const col = t < 0.48 ? [184 + R() * 28, 166 + R() * 22, 140 + R() * 22] : t < 0.8 ? [128 + R() * 20, 116 + R() * 16, 100 + R() * 14] : [150 + R() * 20, 104 + R() * 14, 76 + R() * 12];
      const fill = 'rgb(' + col.map(v => v | 0).join(',') + ')';
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {        // wrap copies keep the tile seamless
        const px = x + ox, py = y + oy;
        if (px < -8 || px > S + 8 || py < -8 || py > S + 8) continue;
        gc.fillStyle = 'rgba(38,28,18,0.38)'; gc.beginPath(); gc.ellipse(px + r * 0.35, py + r * 0.42, r, r * 0.72, a, 0, 6.2832); gc.fill();
        gc.fillStyle = fill; gc.beginPath(); gc.ellipse(px, py, r, r * 0.72, a, 0, 6.2832); gc.fill();
        gc.fillStyle = 'rgba(255,250,236,0.32)'; gc.beginPath(); gc.ellipse(px - r * 0.25, py - r * 0.24, r * 0.45, r * 0.3, a, 0, 6.2832); gc.fill();
        gb.fillStyle = 'rgba(240,240,240,0.92)'; gb.beginPath(); gb.ellipse(px, py, r, r * 0.72, a, 0, 6.2832); gb.fill();
      }
    }
    return { map: mk(c, true), bump: mk(b, true) };
  }

  // shattered glass decal: spider-web cracks from an impact point, broken rings, milky crazing (transparent)
  function cracks() {
    const S = 256, c = cv(S, S), g = c.getContext('2d');
    g.clearRect(0, 0, S, S);
    g.fillStyle = 'rgba(222,230,238,0.2)'; g.fillRect(0, 0, S, S);
    const cx = S * 0.46, cy = S * 0.42, nR = 17, rays = [];
    for (let k = 0; k < nR; k++) {
      let a = k / nR * Math.PI * 2 + (R() - 0.5) * 0.3, x = cx, y = cy; const pts = [[x, y]];
      for (let st = 0; st < 14; st++) { const L = 8 + R() * 16; a += (R() - 0.5) * 0.35; x += Math.cos(a) * L; y += Math.sin(a) * L; pts.push([x, y]); }
      rays.push(pts);
    }
    const line = (pts, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); };
    for (const r of rays) { line(r.map(p => [p[0] + 1.2, p[1] + 1.2]), 2.4, 'rgba(0,0,0,0.35)'); line(r, 1.6, 'rgba(242,246,250,0.95)'); }
    for (const ring of [2, 4, 6, 9, 12]) for (let k = 0; k < nR; k++) {
      if (R() < 0.3) continue;
      const A = rays[k], Bq = rays[(k + 1) % nR], a = A[Math.min(ring, A.length - 1)], b = Bq[Math.min(ring, Bq.length - 1)];
      line([a, [(a[0] + b[0]) / 2 + (R() - 0.5) * 7, (a[1] + b[1]) / 2 + (R() - 0.5) * 7], b], 1.2, 'rgba(236,241,248,0.85)');
    }
    g.fillStyle = 'rgba(246,249,252,0.8)'; g.beginPath(); g.arc(cx, cy, 10, 0, 6.2832); g.fill();
    return mk(c, false);
  }

  // Ljubljana dragon silhouette (coat-of-arms style: raised wings, open jaws, curled tail), drawn at (x,y) size s
  function drawDragon(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s / 100, s / 100); g.fillStyle = col; g.beginPath();
    g.moveTo(-30, 30); g.quadraticCurveTo(-10, 10, 5, 12); g.lineTo(18, -8); g.lineTo(34, -14); g.lineTo(42, -8); g.lineTo(30, -4); g.lineTo(38, 0); g.lineTo(24, 2);   // neck + open jaws
    g.lineTo(16, 18); g.quadraticCurveTo(20, 34, 8, 40); g.lineTo(-4, 40); g.lineTo(0, 30);                                               // chest + leg
    g.quadraticCurveTo(-24, 44, -40, 30); g.quadraticCurveTo(-52, 16, -40, 8); g.quadraticCurveTo(-30, 2, -34, 16); g.quadraticCurveTo(-36, 26, -30, 30);   // curled tail
    g.fill(); g.beginPath(); g.moveTo(-6, 12); g.lineTo(-30, -38); g.lineTo(-18, -28); g.lineTo(-8, -44); g.lineTo(-2, -26); g.lineTo(8, -36); g.lineTo(6, 8); g.fill();   // wing
    g.restore();
  }
  // boards for the forest circuit (same 2 x 4 slot layout): yellow with red lettering and white with blue, like the reference; our own names
  function sponsorsFO() {
    const c = cv(512, 256), x = c.getContext('2d');
    const slots = [['GROM', '#f5c332', '#c8261f'], ['DOBRI DNEVI', '#f3efe8', '#1f3f8c'], ['SMREKA', '#f5c332', '#c8261f'], ['BAKRENI GOZD', '#f5c332', '#b3201a'],
                   ['GOZD GP', '#c8261f', '#ffffff'], ['KAMEN', '#f3efe8', '#2b2b2b'], ['SMOLA', '#f5c332', '#c8261f'], ['MAH', '#1f3f8c', '#ffffff']];
    for (let k = 0; k < 8; k++) {
      const bx = (k % 2) * 256, by = Math.floor(k / 2) * 64, [txt, bg, fg] = slots[k];
      x.fillStyle = bg; x.fillRect(bx, by, 256, 64);
      x.fillStyle = fg; x.font = 'italic 900 40px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.save(); x.translate(bx + 128, by + 34); x.scale(Math.min(1, 228 / Math.max(1, x.measureText(txt).width)), 1); x.fillText(txt, 0, 0); x.restore();
      x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(bx, by, 256, 6);
      x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 3; x.strokeRect(bx + 1.5, by + 1.5, 253, 61);
    }
    return mk(c, false);
  }
  // painted tyre (greyscale, tinted red / white by vertex or instance colour), as in the reference: fat rounded tyres with big dark holes.
  // upper half: the side of a column of three tyres (rounded shading, dark grooves between them); lower half: one tyre seen from above.
  function tyreTex() {
    const W = 64, H = 128, c = pixels(W, H, (i, j) => {
      if (j < 64) {   // side: 3 tyres over the column height
        const t = (j / 64) * 3, f = t - Math.floor(t), bulge = Math.sin(f * Math.PI);                  // 0 at the joints, 1 in the middle of a tyre
        const k = 0.34 + 0.72 * Math.pow(bulge, 0.55) + 0.06 * Math.sin(i * 0.7) * bulge;            // rounded shading, faint tread
        const hi = f > 0.18 && f < 0.3 ? 0.1 : 0;                                                     // highlight on the upper shoulder
        const v = Math.min(255, 255 * (k + hi)); return [v, v, v];
      }
      const u = (i + 0.5) / W - 0.5, v = (j - 64 + 0.5) / 64 - 0.5, r = Math.hypot(u, v) * 2;          // top: ring with a dark hole
      if (r > 0.98) return [120, 120, 120];
      if (r < 0.5) { const d = 18 + 22 * (r / 0.5); return [d, d, d]; }
      const ring = (r - 0.5) / 0.48, sh = 0.72 + 0.34 * Math.sin(ring * Math.PI) - 0.12 * (v > 0 ? v * 2 : 0), val = Math.min(255, 255 * sh); return [val, val, val];
    });
    return mk(c, true);
  }
  // four big trackside billboards for the forest circuit (2 x 2 slots, 256 x 128 each), our own names in the style of the reference:
  // a white board with a blue swoosh, a red/white/blue flag board, a cream board with rust letters, a red square sign with a white disc
  function boardsFO() {
    const c = cv(512, 256), x = c.getContext('2d'), F = (sz) => 'italic 900 ' + sz + 'px "Russo One", "Arial Black", Arial, sans-serif';
    const fit = (txt, cx, cy, maxW, sz, col) => { x.font = F(sz); x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.save(); x.translate(cx, cy); x.scale(Math.min(1, maxW / Math.max(1, x.measureText(txt).width)), 1); x.fillText(txt, 0, 0); x.restore(); };
    // 0: DOBRI DNEVI
    x.fillStyle = '#f3f0ea'; x.fillRect(0, 0, 256, 128); x.strokeStyle = '#1f3f8c'; x.lineWidth = 7; x.beginPath(); x.ellipse(128, 66, 112, 42, -0.08, 0, Math.PI * 2); x.stroke();
    fit('DOBRI DNEVI', 128, 66, 190, 40, '#1f3f8c'); x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 4; x.strokeRect(2, 2, 252, 124);
    // 1: NA ZDRAVJE (flag colours)
    x.fillStyle = '#c8261f'; x.fillRect(256, 0, 256, 34); x.fillStyle = '#f4f1ec'; x.fillRect(256, 34, 256, 62); x.fillStyle = '#1f3f8c'; x.fillRect(256, 96, 256, 32);
    fit('Na zdravje', 384, 66, 220, 44, '#c8261f'); x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 4; x.strokeRect(258, 2, 252, 124);
    // 2: GROM
    x.fillStyle = '#efe8dc'; x.fillRect(0, 128, 256, 128); x.strokeStyle = '#8a4a2c'; x.lineWidth = 6; x.strokeRect(8, 136, 240, 112); fit('GROM', 128, 194, 210, 70, '#7c3b22');
    // 3: OPRIJEM (red square sign with a white disc)
    x.fillStyle = '#c3231c'; x.fillRect(256, 128, 256, 128); x.fillStyle = '#f4f1ec'; x.beginPath(); x.ellipse(384, 192, 96, 54, 0, 0, Math.PI * 2); x.fill();
    fit('OPRIJEM', 384, 193, 160, 38, '#c3231c'); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 5; x.strokeRect(262, 134, 244, 116);
    return mk(c, false);
  }
  // light, see-through chain-link for the forest circuit (drawn with blending so it fades to a pale haze at a distance, as in the reference)
  function fenceFO() {
    const c = cv(64, 64), x = c.getContext('2d');
    x.fillStyle = 'rgba(214,218,228,0.10)'; x.fillRect(0, 0, 64, 64);
    x.strokeStyle = 'rgba(226,229,236,0.95)'; x.lineWidth = 3;
    for (let k = -64; k < 128; k += 16) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 64, 64); x.stroke(); x.beginPath(); x.moveTo(k + 64, 0); x.lineTo(k, 64); x.stroke(); }
    x.fillStyle = 'rgba(200,204,212,1)'; x.fillRect(0, 0, 64, 3);
    return mk(c, true);
  }

  // trackside boards for Monaco (same 2 x 4 slot layout): red-over-white flag colours, Monte-Carlo names, a few invented brands
  function sponsorsMC() {
    const c = cv(512, 256), x = c.getContext('2d');
    const slots = [['MONACO', '#ffffff', '#ce1126', 4], ['MONTE-CARLO', '#141414', '#fff', 0], ['PRINCIPAUTÉ', '#ce1126', '#fff', 0], ['CÔTE D\'AZUR', '#0b3a6e', '#fff', 0],
                   ['GRAND PRIX', '#141414', '#fff', 1], ['CASINO', '#1c1c1c', '#e8c15a', 0], ['MONACO', '#ce1126', '#fff', 4], ['RIVIERA', '#f4f1ea', '#0b3a6e', 0]];
    for (let k = 0; k < 8; k++) {
      const bx = (k % 2) * 256, by = Math.floor(k / 2) * 64, [txt, bg, fg, deco] = slots[k];
      x.fillStyle = bg; x.fillRect(bx, by, 256, 64);
      let tx = bx + 128, tw = 230;
      if (deco === 1) { for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#fff' : '#111'; x.fillRect(bx + 6 + i * 8, by + 16 + j * 8, 8, 8); } tx = bx + 150; tw = 180; }
      if (deco === 4) { x.fillStyle = '#ce1126'; x.fillRect(bx + 8, by + 14, 44, 18); x.fillStyle = '#fff'; x.fillRect(bx + 8, by + 32, 44, 18); x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 1.5; x.strokeRect(bx + 8, by + 14, 44, 36); tx = bx + 150; tw = 180; }
      x.fillStyle = fg; x.font = 'italic 900 36px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.save(); x.translate(tx, by + 34); x.scale(Math.min(1, tw / Math.max(1, x.measureText(txt).width)), 1); x.fillText(txt, 0, 0); x.restore();
      x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(bx, by, 256, 5);
      x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 3; x.strokeRect(bx + 1.5, by + 1.5, 253, 61);
    }
    return mk(c, false);
  }

  // sponsor boards for the Ljubljana circuit (same 2 x 4 slot layout as sponsors())
  function sponsorsLJ() {
    const c = cv(512, 256), x = c.getContext('2d');
    const slots = [['LJUBLJANA', '#141414', '#fff', 0], ['LJUBLJANA', '#f2f2f2', '#141414', 1], ['LJUBLJANA', '#d3202a', '#fff', 2], ['SLOVENIJA', '#ffffff', '#1f4fa8', 3],
                   ['GRAND PRIX', '#141414', '#fff', 1], ['LJUBLJANA', '#141414', '#fff', 2], ['ZMAJ', '#d3202a', '#fff', 2], ['LJUBLJANA', '#141414', '#fff', 1]];
    for (let k = 0; k < 8; k++) {
      const bx = (k % 2) * 256, by = Math.floor(k / 2) * 64, [txt, bg, fg, deco] = slots[k];
      x.fillStyle = bg; x.fillRect(bx, by, 256, 64);
      let tx = bx + 128, tw = 230;
      if (deco === 1) { for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#fff' : '#111'; x.fillRect(bx + 6 + i * 8, by + 16 + j * 8, 8, 8); } tx = bx + 150; tw = 180; }
      if (deco === 2) { drawDragon(x, bx + 34, by + 32, 42, fg); tx = bx + 150; tw = 180; }
      if (deco === 3) { x.fillStyle = '#fff'; x.fillRect(bx, by, 256, 21); x.fillStyle = '#1f4fa8'; x.fillRect(bx, by + 21, 256, 22); x.fillStyle = '#d3202a'; x.fillRect(bx, by + 43, 256, 21); }
      x.fillStyle = deco === 3 ? '#fff' : fg; x.font = 'italic 900 38px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      if (deco === 3) { x.strokeStyle = '#0d2350'; x.lineWidth = 5; }
      x.save(); x.translate(tx, by + 34); x.scale(Math.min(1, tw / Math.max(1, x.measureText(txt).width)), 1); if (deco === 3) x.strokeText(txt, 0, 0); x.fillText(txt, 0, 0); x.restore();
      x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(bx, by, 256, 5);
      x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 3; x.strokeRect(bx + 1.5, by + 1.5, 253, 61);
    }
    return mk(c, false);
  }
  // vertical street banners: left half red, right half black; white dragon, LJUBLJANA, chequered foot
  function bannerLJ() {
    const c = cv(128, 512), x = c.getContext('2d');
    for (const [bx, bg] of [[0, '#cf1f29'], [64, '#151515']]) {
      x.fillStyle = bg; x.fillRect(bx, 0, 64, 512);
      drawDragon(x, bx + 32, 70, 52, '#fff');
      x.save(); x.translate(bx + 34, 280); x.rotate(-Math.PI / 2); x.fillStyle = '#fff'; x.font = '900 30px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('LJUBLJANA', 0, 0); x.restore();
      for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) { x.fillStyle = (i + j) % 2 ? '#fff' : '#111'; x.fillRect(bx + 8 + i * 12, 420 + j * 12, 12, 12); }
    }
    return mk(c, false);
  }

  // Riviera apartment facade: tall window + full-width balcony with a white railing on every bay (tinted by vertex colour)
  function facadeBal() {
    const c = cv(64, 64), g = c.getContext('2d');
    g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#5c7087'; g.fillRect(14, 8, 36, 36); g.fillStyle = '#95abc1'; g.fillRect(16, 10, 13, 12);
    g.fillStyle = 'rgba(40,60,90,0.35)'; g.fillRect(12, 3, 40, 5);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 46, 64, 7);
    g.fillStyle = '#ece9e1'; g.fillRect(0, 42, 64, 5);
    g.fillStyle = '#ffffff'; g.fillRect(0, 28, 64, 2.5); for (let x = 1; x < 64; x += 4.5) g.fillRect(x, 30, 1.4, 12);
    return mk(c, true);
  }

  // kerbs of the two newer circuits in the same style (a kerb quad runs u 0 at the asphalt .. 1 at its outer edge, v along the road, 3 m per repeat):
  // Toskana: the Italian tricolour in long stripes (green by the asphalt, white, red on the outside, as in the reference); Gromski rt: red and yellow blocks
  function curbIT() {
    const c = cv(32, 64), x = c.getContext('2d');
    x.fillStyle = '#588a72'; x.fillRect(0, 0, 12, 64); x.fillStyle = '#9daf94'; x.fillRect(12, 0, 9, 64); x.fillStyle = '#97524a'; x.fillRect(21, 0, 11, 64);   // (toned for Toskana's strong light: coral, cream and sage on screen, as in the reference)
    const g = x.createLinearGradient(0, 0, 32, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.0)'); g.addColorStop(0.75, 'rgba(0,0,0,0.0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 64);
    const t = mk(c, true); t.magFilter = THREE.NearestFilter; return t;
  }
  function curbRY() {
    const c = cv(32, 64), x = c.getContext('2d');
    x.fillStyle = '#d8323a'; x.fillRect(0, 0, 32, 32); x.fillStyle = '#f2bd3c'; x.fillRect(0, 32, 32, 32);
    const g = x.createLinearGradient(0, 0, 32, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.0)'); g.addColorStop(0.75, 'rgba(0,0,0,0.0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 64);
    const t = mk(c, true); t.magFilter = THREE.NearestFilter; return t;
  }
  // stand and barrier boards (2 x 4 slots, as sponsorsFO): our own names in the spirit of the reference's (Motor, Thunder, Good days, Hornet, Fuel)
  function boards8(slots) {
    const c = cv(512, 256), x = c.getContext('2d');
    for (let k = 0; k < 8; k++) {
      const bx = (k % 2) * 256, by = Math.floor(k / 2) * 64, [txt, bg, fg] = slots[k];
      x.fillStyle = bg; x.fillRect(bx, by, 256, 64);
      x.fillStyle = fg; x.font = 'italic 900 40px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.save(); x.translate(bx + 128, by + 34); x.scale(Math.min(1, 228 / Math.max(1, x.measureText(txt).width)), 1); x.fillText(txt, 0, 0); x.restore();
      x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(bx, by, 256, 6);
      x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 3; x.strokeRect(bx + 1.5, by + 1.5, 253, 61);
    }
    return mk(c, false);
  }
  const sponsorsIT = () => boards8([['MOTORE', '#f3efe8', '#c8261f'], ['TUONO', '#c8261f', '#ffffff'], ['MOTORE', '#f3efe8', '#c8261f'], ['TOSKANA GP', '#2f7a4a', '#ffffff'],
    ['BUONGIORNO', '#f3efe8', '#1f3f8c'], ['CALABRONE', '#f5c332', '#2b2b2b'], ['MOTORE', '#c8261f', '#ffffff'], ['CIPRESSO', '#f3efe8', '#2f7a4a']]);
  const sponsorsKP = () => boards8([['GORIVO', '#f3efe8', '#1f3f8c'], ['SRŠEN', '#f5c332', '#2b2b2b'], ['GROM', '#c8261f', '#ffffff'], ['GROMSKI RT', '#1f3f8c', '#ffffff'],
    ['DOBRI DNEVI', '#f3efe8', '#c8261f'], ['KAMP', '#2f7a4a', '#ffffff'], ['GORIVO', '#c8261f', '#ffffff'], ['BOR', '#f5c332', '#c8261f']]);
  // big billboards (2 x 2 slots, as boardsFO): Toskana - BUONGIORNO, TUONO, CALABRONE, MOTORE; Gromski rt - SRŠEN, GROM, DOBRI DNEVI, GORIVO
  function boards4(list) {
    const c = cv(512, 256), x = c.getContext('2d'), F = (sz) => 'italic 900 ' + sz + 'px "Russo One", "Arial Black", Arial, sans-serif';
    const fit = (txt, cx, cy, maxW, sz, col) => { x.font = F(sz); x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.save(); x.translate(cx, cy); x.scale(Math.min(1, maxW / Math.max(1, x.measureText(txt).width)), 1); x.fillText(txt, 0, 0); x.restore(); };
    list.forEach(([txt, bg, fg, deco], k) => {
      const bx = (k % 2) * 256, by = Math.floor(k / 2) * 128;
      x.fillStyle = bg; x.fillRect(bx, by, 256, 128);
      if (deco === 'swoosh') { x.strokeStyle = fg; x.lineWidth = 7; x.beginPath(); x.ellipse(bx + 128, by + 66, 112, 42, -0.08, 0, Math.PI * 2); x.stroke(); }
      if (deco === 'bars') { x.fillStyle = fg; x.fillRect(bx, by, 256, 22); x.fillRect(bx, by + 106, 256, 22); }
      if (deco === 'frame') { x.strokeStyle = fg; x.lineWidth = 6; x.strokeRect(bx + 8, by + 8, 240, 112); }
      if (deco === 'disc') { x.fillStyle = '#f4f1ec'; x.beginPath(); x.ellipse(bx + 128, by + 64, 96, 54, 0, 0, Math.PI * 2); x.fill(); }
      fit(txt, bx + 128, by + 66, deco === 'disc' ? 160 : 200, deco === 'disc' ? 38 : 46, fg);
      x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 4; x.strokeRect(bx + 2, by + 2, 252, 124);
    });
    return mk(c, false);
  }
  const boardsIT = () => boards4([['BUONGIORNO', '#f3efe8', '#1f3f8c', 'swoosh'], ['TUONO', '#f3efe8', '#c8261f', 'bars'], ['CALABRONE', '#f5c332', '#7c3b22', 'frame'], ['MOTORE', '#c3231c', '#c3231c', 'disc']]);
  const boardsKP = () => boards4([['SRŠEN', '#f5c332', '#7c3b22', 'frame'], ['GROM', '#f3efe8', '#c8261f', 'bars'], ['DOBRI DNEVI', '#f3efe8', '#1f3f8c', 'swoosh'], ['GORIVO', '#c3231c', '#c3231c', 'disc']]);
  // feather flag (a tall banner on a bent pole) with the word running up it: white with blue lettering, a blue stripe along the pole side
  function flagKP() {
    const c = cv(64, 256), x = c.getContext('2d');
    x.fillStyle = '#f3f1ec'; x.fillRect(0, 0, 64, 256); x.fillStyle = '#1f3f8c'; x.fillRect(0, 0, 9, 256);
    x.save(); x.translate(36, 150); x.rotate(-Math.PI / 2); x.fillStyle = '#1f3f8c'; x.font = 'italic 900 34px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.scale(Math.min(1, 200 / Math.max(1, x.measureText('GORIVO').width)), 1); x.fillText('GORIVO', 0, 0); x.restore();
    return mk(c, false);
  }

  let cache = null;
  function all(maxAniso) {
    if (cache) return cache;
    aniso = Math.min(8, maxAniso || 4);
    cache = { grass: grass(), asphalt: asphalt(), curb: curb(), gravel: gravel(), pebbles: pebbles(), water: water(), crowd: crowd(), sponsors: sponsors(), tires: tires(), fence: fence(), checker: checker(), blob: blob(), sand: sand(), paving: paving(), facade: facade(), makadam: null, makadamBump: null };
    { const m = makadam(); cache.makadam = m.map; cache.makadamBump = m.bump; }
    cache.cracks = cracks(); cache.tiresRW = tiresRW(); cache.facadeBal = facadeBal();
    cache.sponsorsLJ = sponsorsLJ(); cache.bannerLJ = bannerLJ(); cache.sponsorsFO = sponsorsFO(); cache.fenceFO = fenceFO(); cache.boardsFO = boardsFO(); cache.curbRWB = curbRWB(); cache.tyreTex = tyreTex(); cache.sponsorsMC = sponsorsMC();
    cache.curbIT = curbIT(); cache.curbRY = curbRY(); cache.sponsorsIT = sponsorsIT(); cache.sponsorsKP = sponsorsKP(); cache.boardsIT = boardsIT(); cache.boardsKP = boardsKP(); cache.flagKP = flagKP();
    return cache;
  }
  return { all, number, SPONSORS };
})();

