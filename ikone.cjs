// Pet predlogov ikone za Real Roads Atlas (osnutek; ni v repozitoriju).
//   node ikone.cjs  ->  1.png … 5.png (512 × 512, cel kvadrat kot icon-maskable-512.png) in pregled.jpg
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const DIR = __dirname;
const n = (v) => +v.toFixed(1);
const P = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${n(x)} ${n(y)}`).join(' ');
const bezAt = (a, b, c, d, t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]); };
const bez = (a, b, c, d, m) => Array.from({ length: m + 1 }, (_, i) => bezAt(a, b, c, d, i / m));
const arc = (cx, cy, rx, ry, a0, a1, m) => Array.from({ length: m + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / m) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const dedupe = (pts) => pts.filter((p, i) => !i || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.01);
const normals = (pts) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
const off = (pts, nr, d) => pts.map((p, i) => [p[0] + nr[i][0] * d(i), p[1] + nr[i][1] * d(i)]);
const wrap = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs>${CAR_DEFS}${defs}</defs>${body}</svg>`;

// ---------- the game's blue car with white stripes ----------
const CAR_DEFS = `
<linearGradient id="paint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1450c2"/><stop offset=".45" stop-color="#2f86ff"/><stop offset="1" stop-color="#1348b0"/></linearGradient>
<linearGradient id="paintR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9bff"/><stop offset=".55" stop-color="#2a74e6"/><stop offset="1" stop-color="#103a94"/></linearGradient>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="glow" x="-60%" y="-300%" width="220%" height="700%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="blur9" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>`;

// from above (tools/icons.mjs), front towards -y; steer turns the front wheels
function carTop(steer = 0) {
  const fw = (x) => `<rect x="${x}" y="-62" width="14" height="30" rx="5" transform="rotate(${steer} ${x + 7} -47)"/>`;
  return `<ellipse cx="8" cy="10" rx="54" ry="98" fill="#000" opacity=".4" filter="url(#soft)"/>
  <g fill="#15171b">${fw(-51)}${fw(37)}<rect x="-51" y="32" width="14" height="30" rx="5"/><rect x="37" y="32" width="14" height="30" rx="5"/></g>
  <rect x="-45" y="-90" width="90" height="180" rx="31" fill="url(#paint)"/>
  <rect x="-52" y="-18" width="9" height="12" rx="3" fill="#1d5fd6"/><rect x="43" y="-18" width="9" height="12" rx="3" fill="#1d5fd6"/>
  <rect x="-11" y="-90" width="7" height="180" fill="#fff" opacity=".92"/><rect x="4" y="-90" width="7" height="180" fill="#fff" opacity=".92"/>
  <path d="M -32 -44 L 32 -44 L 39 -14 L -39 -14 Z" fill="#0c1626"/>
  <path d="M -26 -40 L -8 -40 L -16 -18 L -32 -18 Z" fill="#fff" opacity=".18"/>
  <path d="M -37 32 L 37 32 L 31 50 L -31 50 Z" fill="#0c1626"/>
  <g fill="#fff6c8"><rect x="-35" y="-88" width="15" height="7" rx="3"/><rect x="20" y="-88" width="15" height="7" rx="3"/></g>
  <g fill="#ff3b2f"><rect x="-37" y="81" width="15" height="6" rx="2"/><rect x="22" y="81" width="15" height="6" rx="2"/></g>`;
}

// from behind (the in-game chase camera); origin on the road under the middle of the car, 248 wide, 146 tall
function carRear() {
  return `<ellipse cx="0" cy="-3" rx="134" ry="15" fill="#000" opacity=".6" filter="url(#soft)"/>
  <rect x="-124" y="-46" width="40" height="46" rx="9" fill="#111317"/><rect x="84" y="-46" width="40" height="46" rx="9" fill="#111317"/>
  <path d="M -122 -30 L -124 -70 C -124 -84 -116 -92 -102 -96 L -72 -104 C -62 -128 -50 -142 -30 -146 L 30 -146 C 50 -142 62 -128 72 -104 L 102 -96 C 116 -92 124 -84 124 -70 L 122 -30 C 122 -22 116 -18 108 -18 L -108 -18 C -116 -18 -122 -22 -122 -30 Z" fill="url(#paintR)"/>
  <path d="M -123 -52 L 123 -52 L 122 -30 C 122 -22 116 -18 108 -18 L -108 -18 C -116 -18 -122 -22 -122 -30 Z" fill="#000" opacity=".16"/>
  <path d="M -58 -106 C -50 -126 -40 -136 -26 -138 L 26 -138 C 40 -136 50 -126 58 -106 Z" fill="#0c1626"/>
  <path d="M -46 -110 C -40 -124 -32 -132 -22 -134 L -6 -134 L -24 -110 Z" fill="#fff" opacity=".16"/>
  <g fill="#fff" opacity=".93"><rect x="-17" y="-146" width="11" height="8"/><rect x="6" y="-146" width="11" height="8"/><rect x="-17" y="-104" width="11" height="60"/><rect x="6" y="-104" width="11" height="60"/></g>
  <rect x="-110" y="-115" width="220" height="9" rx="3" fill="#0d1526"/><rect x="-54" y="-107" width="7" height="8" fill="#0d1526"/><rect x="47" y="-107" width="7" height="8" fill="#0d1526"/>
  <g fill="#ff4a3a" opacity=".85" filter="url(#glow)"><rect x="-116" y="-90" width="64" height="16" rx="7"/><rect x="52" y="-90" width="64" height="16" rx="7"/></g>
  <rect x="-114" y="-88" width="60" height="12" rx="6" fill="#ff2a1f"/><rect x="54" y="-88" width="60" height="12" rx="6" fill="#ff2a1f"/>
  <rect x="-54" y="-84" width="108" height="4" fill="#c4161c"/>
  <g fill="#ffd0c8" opacity=".75"><rect x="-108" y="-86" width="26" height="3" rx="1.5"/><rect x="82" y="-86" width="26" height="3" rx="1.5"/></g>
  <path d="M -100 -44 L 100 -44 L 92 -20 L -92 -20 Z" fill="#0b1a35"/>
  <g stroke="#1f3156" stroke-width="3"><line x1="-40" y1="-44" x2="-38" y2="-20"/><line x1="-14" y1="-44" x2="-13" y2="-20"/><line x1="14" y1="-44" x2="13" y2="-20"/><line x1="40" y1="-44" x2="38" y2="-20"/></g>
  <g fill="#2a2f36" stroke="#a7b0ba" stroke-width="3"><circle cx="-72" cy="-31" r="8"/><circle cx="72" cy="-31" r="8"/></g>`;
}

// from the side, facing +x; origin on the road under the middle of the car, ~130 long
function carSide() {
  return `<ellipse cx="0" cy="0" rx="64" ry="5" fill="#000" opacity=".5" filter="url(#soft)"/>
  <circle cx="-38" cy="-12" r="16" fill="#0b1a33"/><circle cx="38" cy="-12" r="16" fill="#0b1a33"/>
  <path d="M -64 -12 C -64 -22 -60 -28 -50 -30 L -34 -32 C -24 -44 -10 -50 8 -50 C 22 -50 32 -44 42 -34 L 56 -30 C 62 -28 65 -22 65 -16 L 65 -10 C 65 -6 63 -4 59 -4 L 52 -4 A 15 15 0 0 0 24 -4 L -24 -4 A 15 15 0 0 0 -52 -4 L -60 -4 C -63 -4 -64 -7 -64 -12 Z" fill="url(#paintR)"/>
  <path d="M -26 -34 C -18 -44 -6 -47 8 -47 C 20 -47 28 -42 36 -34 Z" fill="#0c1626"/><rect x="5" y="-48" width="4" height="15" fill="#2a74e6"/>
  <path d="M -63 -20 L 64 -20" stroke="#fff" stroke-width="4"/>
  <path d="M 57 -27 L 64 -23 L 64 -19 L 56 -22 Z" fill="#fff6c8"/><rect x="-65" y="-26" width="5" height="8" rx="2" fill="#ff3b2f"/>
  <g fill="#15171b"><circle cx="-38" cy="-12" r="12"/><circle cx="38" cy="-12" r="12"/></g>
  <g fill="#a7b0ba"><circle cx="-38" cy="-12" r="5.5"/><circle cx="38" cy="-12" r="5.5"/></g>`;
}

// ---------- 1 · Serpentina: a mountain pass with hairpins, the car on the first straight ----------
function icon1() {
  const W = (y) => Math.max(7, 10 + (y - 120) * 0.13);
  const H1 = [150, 405, 48, 34], H2 = [365, 300, 38, 26], H3 = [175, 222, 28, 19];
  const leg0 = [[420, 560], [330, 480], [230, 439], [150, 439]];
  const pieces = [
    [...bez(...leg0, 40), ...arc(...H1, 90, 186, 20)],
    [...arc(...H1, 174, 270, 20), ...bez([150, 371], [230, 371], [295, 326], [365, 326], 36), ...arc(...H2, 90, -6, 18)],
    [...arc(...H2, 6, -90, 18), ...bez([365, 274], [305, 274], [230, 241], [175, 241], 30), ...arc(...H3, 90, 186, 16)],
    [...arc(...H3, 174, 270, 16), ...bez([175, 203], [235, 203], [300, 165], [338, 151], 26)],
  ].map(dedupe);
  let road = '';
  for (const pts of pieces.slice().reverse()) {
    const nr = normals(pts), w = (i) => W(pts[i][1]);
    const avg = pts.reduce((s, p) => s + W(p[1]), 0) / pts.length;
    const L = off(pts, nr, (i) => w(i) / 2), R = off(pts, nr, (i) => -w(i) / 2);
    road += `<g fill="none" stroke="#d8c99e" stroke-width="${n(avg * 0.14)}" stroke-linejoin="round"><path d="${P(L)}"/><path d="${P(R)}"/></g>`;
    road += `<path d="${P([...L, ...R.slice().reverse()])} Z" fill="url(#asph)"/>`;
    for (const s of [1, -1]) road += `<path d="${P(off(pts, nr, (i) => s * w(i) * 0.41))}" fill="none" stroke="#f6f6f2" stroke-width="${n(Math.max(1.1, avg * 0.045))}" stroke-linejoin="round"/>`;
    if (avg > 20) road += `<path d="${P(pts)}" fill="none" stroke="#f6f6f2" stroke-opacity=".8" stroke-width="${n(avg * 0.035)}" stroke-dasharray="${n(avg * 0.32)} ${n(avg * 0.36)}"/>`;
  }
  const barrier = ([cx, cy, rx, ry], a0, a1) => {
    const pts = arc(cx, cy, rx, ry, a0, a1, 24).map(([x, y]) => {
      const a = Math.atan2((y - cy) / ry, (x - cx) / rx); let nx = Math.cos(a) / rx, ny = Math.sin(a) / ry; const l = Math.hypot(nx, ny);
      const d = W(y) * 0.68; return [x + nx / l * d, y + ny / l * d];
    });
    const w = W(cy);
    return `<path d="${P(pts)}" fill="none" stroke="#fff" stroke-width="${n(w * 0.17)}" stroke-linecap="round"/><path d="${P(pts)}" fill="none" stroke="#e0262b" stroke-width="${n(w * 0.17)}" stroke-dasharray="${n(w * 0.2)} ${n(w * 0.2)}"/>`;
  };
  const tree = (x, y, h) => `<path d="M ${n(x)} ${n(y - h)} L ${n(x + h * 0.32)} ${n(y - h * 0.1)} L ${n(x - h * 0.32)} ${n(y - h * 0.1)} Z" fill="#1f5c27"/><path d="M ${n(x)} ${n(y - h)} L ${n(x + h * 0.32)} ${n(y - h * 0.1)} L ${n(x)} ${n(y - h * 0.1)} Z" fill="#17451e"/><rect x="${n(x - h * 0.04)}" y="${n(y - h * 0.12)}" width="${n(h * 0.08)}" height="${n(h * 0.12)}" fill="#3b2a1a"/>`;
  const far = [[60, 300, 22], [82, 312, 26], [40, 322, 28], [440, 236, 16], [458, 244, 18], [476, 238, 16], [250, 300, 14], [300, 292, 13], [118, 252, 14], [96, 262, 16], [420, 340, 30], [452, 352, 34]].map((t) => tree(...t)).join('');
  const near = [[30, 478, 64], [72, 506, 74], [8, 522, 82], [116, 532, 70], [474, 430, 52], [500, 456, 60], [450, 470, 46], [494, 522, 72]].map((t) => tree(...t)).join('');
  const [cx, cy] = bezAt(...leg0, 0.62), s = 1.05 * W(cy) / 248;
  return wrap(`
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a64c9"/><stop offset=".45" stop-color="#a9dcf7"/></linearGradient>
    <linearGradient id="slope" x1="0" y1="150" x2="0" y2="512" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a3d66e"/><stop offset=".45" stop-color="#58a443"/><stop offset="1" stop-color="#2b6829"/></linearGradient>
    <linearGradient id="asph" x1="0" y1="150" x2="0" y2="512" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9ca3ab"/><stop offset="1" stop-color="#474c54"/></linearGradient>
    <linearGradient id="haze" x1="0" y1="120" x2="0" y2="240" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e6f4ff" stop-opacity="0"/><stop offset="1" stop-color="#e6f4ff" stop-opacity=".55"/></linearGradient>
    <filter id="cloud" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="5"/></filter>`, `
    <rect width="512" height="512" fill="url(#sky)"/>
    <g filter="url(#cloud)" fill="#fff" opacity=".85"><ellipse cx="96" cy="60" rx="56" ry="14"/><ellipse cx="126" cy="50" rx="32" ry="13"/><ellipse cx="404" cy="30" rx="50" ry="11"/></g>
    <path d="M -10 240 L 30 168 L 70 128 L 100 140 L 172 52 L 214 98 L 252 134 L 300 150 L 338 132 L 374 92 L 418 58 L 468 102 L 522 128 L 522 240 Z" fill="#8ea6c6"/>
    <path d="M 172 52 L 214 98 L 252 134 L 284 160 L 196 160 Z" fill="#7790b3"/><path d="M 418 58 L 468 102 L 522 128 L 522 170 L 440 170 Z" fill="#7790b3"/>
    <g fill="#f4f8fc"><path d="M 146 84 L 172 52 L 199 81 L 189 78 L 181 88 L 171 79 L 160 90 Z"/><path d="M 394 80 L 418 58 L 446 82 L 436 80 L 428 90 L 418 81 L 406 92 Z"/></g>
    <rect y="120" width="512" height="130" fill="url(#haze)"/>
    <path d="M -10 212 C 70 196 170 172 250 166 C 296 162 320 156 338 150 C 370 160 440 178 522 200 L 522 522 L -10 522 Z" fill="url(#slope)"/>
    ${far}${road}${barrier(H1, 116, 244)}${barrier(H2, -64, 64)}${barrier(H3, 120, 240)}
    <g transform="translate(${n(cx)} ${n(cy)}) scale(${s.toFixed(3)})">${carRear()}</g>${near}`);
}

// ---------- 2 · Svet: the globe with a road around it ----------
const AFRICA = [[35.8, -5.9], [37.1, 10.2], [33.5, 11.0], [30.5, 19.0], [32.8, 22.0], [31.3, 29.5], [31.2, 32.3], [29.9, 32.5], [22.0, 36.8], [15.5, 39.5], [12.5, 43.3], [11.8, 51.2], [2.0, 45.5], [-4.0, 39.6], [-10.5, 40.5], [-15.0, 40.7], [-25.9, 32.9], [-29.8, 31.0], [-34.0, 25.6], [-34.8, 20.0], [-33.9, 18.4], [-28.6, 16.5], [-22.9, 14.5], [-12.0, 13.6], [-6.0, 12.3], [0.4, 9.4], [4.0, 9.5], [4.3, 6.0], [6.4, 3.4], [5.0, -2.0], [4.4, -7.5], [7.5, -13.0], [10.0, -14.5], [14.7, -17.4], [21.0, -17.0], [27.7, -13.2], [31.5, -9.8]];
const EURASIA = [[36.0, -5.6], [37.0, -8.9], [38.7, -9.5], [43.0, -9.3], [43.5, -8.0], [43.4, -1.8], [46.5, -1.5], [48.5, -4.8], [49.7, -1.5], [51.0, 1.8], [53.3, 5.0], [53.8, 8.5], [55.5, 8.2], [57.6, 10.4], [56.2, 10.8], [54.6, 11.0], [54.2, 13.0], [54.8, 18.5], [57.0, 21.0], [59.4, 24.0], [60.2, 29.0], [60.5, 26.0], [63.0, 21.5], [65.8, 24.0], [63.5, 19.5], [60.5, 17.5], [59.3, 18.5], [56.2, 16.0], [55.4, 13.0], [57.7, 11.8], [59.0, 10.5], [58.0, 7.0], [60.4, 5.0], [63.4, 9.0], [67.3, 14.5], [70.0, 19.0], [71.0, 25.8], [69.5, 33.0], [66.5, 41.0], [68.5, 44.0], [68.0, 54.0], [70.0, 60.0], [72.5, 70.0], [73.5, 80.0], [76.0, 98.0], [73.0, 112.0], [60.0, 112.0], [45.0, 112.0], [30.0, 112.0], [22.0, 108.0], [21.5, 100.0], [16.0, 97.5], [22.0, 91.0], [21.5, 87.0], [16.0, 81.5], [13.0, 80.3], [8.1, 77.5], [15.0, 74.0], [19.0, 72.8], [22.5, 70.0], [24.8, 67.0], [25.3, 62.0], [25.5, 57.0], [27.0, 56.0], [30.0, 50.0], [29.5, 48.0], [26.5, 50.2], [24.0, 51.6], [24.5, 54.5], [26.3, 56.3], [22.5, 59.8], [17.0, 54.5], [13.0, 45.0], [12.6, 43.4], [16.0, 42.7], [21.5, 39.1], [27.9, 34.4], [29.5, 34.9], [29.9, 32.5], [31.2, 32.3], [31.5, 34.5], [33.0, 35.1], [36.0, 35.9], [36.8, 36.2], [36.6, 30.6], [36.8, 28.0], [38.4, 26.8], [40.0, 26.2], [40.6, 22.9], [38.0, 23.7], [36.5, 22.5], [38.5, 21.0], [40.0, 19.5], [42.6, 18.1], [45.3, 14.3], [45.6, 13.8], [45.4, 12.3], [44.0, 12.6], [41.9, 16.0], [40.6, 18.0], [39.9, 18.4], [40.5, 17.0], [39.0, 17.1], [37.9, 15.6], [38.8, 16.2], [40.6, 14.3], [41.9, 12.2], [43.8, 10.3], [44.4, 8.9], [43.7, 7.3], [43.3, 5.4], [43.0, 3.1], [41.4, 2.2], [39.5, -0.3], [37.6, -0.9], [36.7, -4.4]];
const ISLANDS = [
  [[50.1, -5.7], [50.6, -1.5], [51.1, 1.4], [52.9, 1.7], [53.6, 0.1], [55.0, -1.4], [57.7, -1.8], [58.6, -3.0], [58.5, -5.0], [57.0, -6.0], [55.8, -5.0], [54.8, -3.2], [53.4, -3.0], [52.5, -4.1], [51.7, -5.1], [51.4, -3.2]],
  [[51.6, -9.6], [52.1, -6.4], [53.3, -6.1], [54.6, -5.6], [55.3, -7.3], [54.3, -8.6], [53.3, -10.0]],
  [[63.4, -18.0], [64.2, -22.5], [66.0, -22.0], [66.5, -16.0], [65.0, -13.6]],
  [[-12.0, 49.3], [-16.0, 50.0], [-25.0, 47.0], [-25.0, 44.0], [-17.0, 44.0]],
  [[38.2, 12.5], [38.3, 15.6], [36.7, 15.1], [37.6, 12.5]],
  [[60.0, -44.0], [65.0, -40.0], [70.0, -22.0], [76.0, -19.0], [81.0, -12.0], [83.0, -35.0], [82.0, -60.0], [78.0, -72.0], [76.0, -68.0], [70.0, -54.0], [65.0, -52.5]],
  [[12.0, -72.0], [10.5, -64.0], [8.5, -60.0], [4.0, -52.0], [0.0, -50.0], [-2.5, -44.0], [-5.2, -35.3], [-8.0, -35.0], [-13.0, -38.5], [-23.0, -42.0], [-25.0, -48.0], [-30.0, -50.5], [-34.9, -56.0], [-38.0, -57.5], [-42.0, -63.5], [-46.0, -67.5], [-52.0, -69.0], [-55.0, -67.0], [-50.0, -75.0], [-40.0, -73.5], [-30.0, -71.5], [-18.0, -70.3], [-5.0, -81.0], [1.0, -80.0], [8.0, -77.0]],
  [[25.0, -80.3], [30.0, -81.3], [35.2, -75.5], [38.9, -74.9], [40.6, -74.0], [41.5, -70.0], [43.5, -70.2], [44.8, -66.9], [47.0, -64.5], [46.5, -60.0], [47.5, -53.0], [51.5, -55.5], [55.0, -59.0], [58.5, -62.5], [60.5, -64.5], [63.0, -68.0], [66.0, -62.0], [70.0, -70.0], [73.0, -80.0], [70.0, -100.0], [45.0, -100.0], [30.0, -97.0], [25.0, -97.5], [21.0, -90.0], [21.5, -87.0], [18.0, -88.0], [15.0, -83.5], [10.0, -83.0], [9.0, -79.5]],
];
const SEAS = [[[41.2, 29.0], [41.7, 32.0], [41.3, 36.0], [41.0, 41.5], [43.5, 40.0], [44.6, 37.5], [45.3, 36.5], [46.6, 31.5], [45.2, 29.7], [43.2, 28.0], [42.0, 28.0]], [[47.0, 51.5], [44.5, 47.0], [42.0, 48.5], [40.2, 49.5], [37.5, 49.0], [36.8, 53.0], [38.0, 53.9], [41.0, 52.8], [42.5, 52.5], [44.5, 51.0], [46.5, 53.0]]];
function icon2() {
  const CX = 256, CY = 248, R = 142, f0 = 30 * Math.PI / 180, l0 = 14 * Math.PI / 180, RX = 226, RY = 64;
  const geo = ([la, lo]) => { const f = la * Math.PI / 180, l = lo * Math.PI / 180 - l0; return { x: Math.cos(f) * Math.sin(l), y: Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l), c: Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l) }; };
  const proj = (p) => { let { x, y, c } = geo(p); if (c < 0) { const m = Math.hypot(x, y) || 1; x /= m; y /= m; } return [CX + R * x, CY - R * y]; };
  const smooth = (pts) => { const m = pts.length; let d = `M ${n(pts[0][0])} ${n(pts[0][1])}`; for (let i = 0; i < m; i++) { const a = pts[(i - 1 + m) % m], b = pts[i], c = pts[(i + 1) % m], e = pts[(i + 2) % m]; d += ` C ${n(b[0] + (c[0] - a[0]) / 6)} ${n(b[1] + (c[1] - a[1]) / 6)} ${n(c[0] - (e[0] - b[0]) / 6)} ${n(c[1] - (e[1] - b[1]) / 6)} ${n(c[0])} ${n(c[1])}`; } return d + ' Z'; };
  const land = [AFRICA, EURASIA, ...ISLANDS].map((c) => smooth(c.map(proj))).join(' ');
  const seas = SEAS.map((c) => smooth(c.map(proj))).join(' ');
  const vis = (pts) => { let d = '', on = false; for (const p of pts) { const g = geo(p); if (g.c < 0.02) { on = false; continue; } d += `${on ? 'L' : 'M'} ${n(CX + R * g.x)} ${n(CY - R * g.y)} `; on = true; } return d; };
  let grat = '';
  for (let lo = -150; lo <= 180; lo += 30) grat += vis(Array.from({ length: 61 }, (_, i) => [-90 + i * 3, lo]));
  for (const la of [-60, -30, 0, 30, 60]) grat += vis(Array.from({ length: 121 }, (_, i) => [la, -180 + i * 3]));
  const kerb = (a0, a1) => { const pts = arc(0, 0, RX + 28, RY + 28, a0, a1, 20); return `<path d="${P(pts)}" fill="none" stroke="#fff" stroke-width="9"/><path d="${P(pts)}" fill="none" stroke="#e0262b" stroke-width="9" stroke-dasharray="9 9"/>`; };
  const ring = `<ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#1f232a" stroke-width="56"/><ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#4a4f58" stroke-width="48"/>
    <ellipse rx="${RX + 20}" ry="${RY + 20}" fill="none" stroke="#f3f3f3" stroke-width="3.5"/><ellipse rx="${RX - 20}" ry="${RY - 20}" fill="none" stroke="#f3f3f3" stroke-width="3.5"/>
    <ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#ffd447" stroke-width="3.5" stroke-dasharray="15 13"/>${kerb(158, 202)}${kerb(-22, 22)}`;
  const th = 112 * Math.PI / 180, px = RX * Math.cos(th), py = RY * Math.sin(th), ang = Math.atan2(-RY * Math.cos(th), RX * Math.sin(th)) * 180 / Math.PI;
  let stars = '', z = 7;
  for (let i = 0; i < 22; i++) { z = (z * 9301 + 49297) % 233280; const x = z / 233280 * 512; z = (z * 9301 + 49297) % 233280; const y = z / 233280 * 512; if (Math.hypot(x - CX, y - CY) > R + 20) stars += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.8 + (i % 3) * 0.5)}" fill="#fff" opacity="${(0.35 + (i % 4) * 0.15).toFixed(2)}"/>`; }
  return wrap(`
    <radialGradient id="space" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#21549f"/><stop offset="1" stop-color="#0a1534"/></radialGradient>
    <radialGradient id="ocean" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#63b8f6"/><stop offset=".6" stop-color="#2a74c9"/><stop offset="1" stop-color="#163d84"/></radialGradient>
    <radialGradient id="shade" cx=".32" cy=".26" r=".95"><stop offset=".42" stop-color="#001233" stop-opacity="0"/><stop offset="1" stop-color="#001233" stop-opacity=".55"/></radialGradient>
    <clipPath id="globe"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
    <clipPath id="front"><rect x="-400" y="0" width="800" height="400" transform="translate(256 268) rotate(-14)"/></clipPath>`, `
    <rect width="512" height="512" fill="url(#space)"/>${stars}
    <g transform="translate(256 268) rotate(-14)">${ring}<ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="56"/></g>
    <circle cx="${CX}" cy="${CY}" r="${R + 10}" fill="#7fd0ff" opacity=".35" filter="url(#blur9)"/>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#ocean)"/>
    <g clip-path="url(#globe)"><path d="${land}" fill="#62bf5c"/><path d="${seas}" fill="#3a86d4"/><path d="${grat}" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.2"/>
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#shade)"/><ellipse cx="206" cy="182" rx="52" ry="30" fill="#fff" opacity=".16" filter="url(#blur9)"/></g>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#a9e1ff" stroke-opacity=".6" stroke-width="3"/>
    <g clip-path="url(#front)"><g transform="translate(256 268) rotate(-14)">${ring}</g></g>
    <g transform="translate(256 268) rotate(-14) translate(${n(px)} ${n(py + 9)}) rotate(${n(ang)})">${carSide()}</g>`);
}

// ---------- 3 · Zemljevid: a folded map with the route up a hill and the finish flag ----------
function icon3() {
  const contours = Array.from({ length: 6 }, (_, k) => {
    const r0 = 14 + k * 18; const pts = Array.from({ length: 72 }, (_, i) => { const a = i / 72 * Math.PI * 2; const r = r0 * (1 + 0.12 * Math.sin(3 * a + k) + 0.07 * Math.sin(5 * a + 2 * k)); return [290 + 1.35 * r * Math.cos(a), 222 + r * Math.sin(a)]; });
    return `<path d="${P(pts)} Z" fill="none" stroke="#c4a26c" stroke-opacity=".8" stroke-width="${k % 3 === 2 ? 2.4 : 1.4}"/>`;
  }).join('');
  const route = 'M 136 372 C 176 360 236 372 272 356 C 300 344 290 318 258 322 C 220 326 176 318 186 294 C 194 274 238 284 268 270 C 296 258 300 236 280 232 C 262 228 254 214 272 206 C 286 200 298 202 304 194';
  let grid = '';
  for (let x = 136; x < 400; x += 48) grid += `M ${x} 132 L ${x} 392 `;
  for (let y = 156; y < 392; y += 48) grid += `M 112 ${y} L 400 ${y} `;
  const content = `<rect x="100" y="120" width="312" height="284" fill="#f1e8cf"/>
    <g fill="#d2e6b1"><ellipse cx="150" cy="160" rx="46" ry="24"/><ellipse cx="372" cy="330" rx="34" ry="46"/><ellipse cx="396" cy="240" rx="22" ry="30"/><ellipse cx="128" cy="304" rx="26" ry="36"/></g>
    <path d="${grid}" stroke="#d8cdab" stroke-width="1"/>${contours}
    <path d="M 150 222 C 140 260 160 290 140 330 C 128 352 132 372 120 400" fill="none" stroke="#8cc9ee" stroke-width="4.5"/>
    <ellipse cx="172" cy="210" rx="30" ry="18" transform="rotate(-15 172 210)" fill="#8cc9ee" stroke="#6aaad8" stroke-width="1.5"/>
    <path d="M 100 262 C 160 250 200 252 230 236 C 260 222 330 170 412 160" fill="none" stroke="#d3c8a8" stroke-width="7"/><path d="M 100 262 C 160 250 200 252 230 236 C 260 222 330 170 412 160" fill="none" stroke="#fff" stroke-width="4"/>
    <path d="${route}" fill="none" stroke="#fff" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${route}" fill="none" stroke="#e0262b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="136" cy="372" r="8" fill="#2fae55" stroke="#fff" stroke-width="3"/>`;
  const k = 16 / 96;
  const panels = [
    { x: 112, m: `matrix(1 ${-k} 0 1 0 ${n(k * 112)})`, tint: '<rect x="100" y="120" width="312" height="284" fill="#fff" opacity=".07"/>' },
    { x: 208, m: `matrix(1 ${k} 0 1 0 ${n(-k * 208 - 16)})`, tint: '<rect x="100" y="120" width="312" height="284" fill="#3b2a10" opacity=".16"/>' },
    { x: 304, m: `matrix(1 ${-k} 0 1 0 ${n(k * 304)})`, tint: '' },
  ];
  const outline = 'M 112 132 L 208 116 L 304 132 L 400 116 L 400 376 L 304 392 L 208 376 L 112 392 Z';
  const fy = (x, y) => y + (x < 208 ? -k * (x - 112) : x < 304 ? -16 + k * (x - 208) : -k * (x - 304));
  const F = [304, fy(304, 194)];
  const car = [168, fy(168, 365)];
  return wrap(`
    <radialGradient id="bg3" cx=".5" cy=".3" r=".85"><stop offset="0" stop-color="#2b8fcf"/><stop offset="1" stop-color="#0e3c66"/></radialGradient>
    <pattern id="chk" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#fff"/><rect width="7" height="7" fill="#15171b"/><rect x="7" y="7" width="7" height="7" fill="#15171b"/></pattern>
    ${panels.map((p, i) => `<clipPath id="p${i}"><rect x="${p.x}" y="132" width="96" height="260"/></clipPath>`).join('')}`, `
    <rect width="512" height="512" fill="url(#bg3)"/>
    <path d="${outline}" transform="translate(7 12)" fill="#000" opacity=".38" filter="url(#soft)"/>
    ${panels.map((p, i) => `<g transform="${p.m}"><g clip-path="url(#p${i})">${content}${p.tint}</g></g>`).join('')}
    <path d="${outline}" fill="none" stroke="#c9b98f" stroke-width="1.5"/><path d="M 208 116 L 208 376 M 304 132 L 304 392" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>
    <g transform="translate(${n(car[0])} ${n(car[1])}) rotate(78) scale(.24)">${carTop()}</g>
    <ellipse cx="${n(F[0])}" cy="${n(F[1])}" rx="11" ry="4" fill="#000" opacity=".3"/>
    <line x1="${n(F[0])}" y1="${n(F[1])}" x2="${n(F[0])}" y2="${n(F[1] - 74)}" stroke="#2b2f36" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${n(F[0] + 2)} ${n(F[1] - 74)} C ${n(F[0] + 24)} ${n(F[1] - 84)} ${n(F[0] + 40)} ${n(F[1] - 64)} ${n(F[0] + 66)} ${n(F[1] - 74)} L ${n(F[0] + 66)} ${n(F[1] - 36)} C ${n(F[0] + 40)} ${n(F[1] - 26)} ${n(F[0] + 24)} ${n(F[1] - 46)} ${n(F[0] + 2)} ${n(F[1] - 36)} Z" fill="url(#chk)" stroke="#15171b" stroke-width="2"/>`);
}

// ---------- 4 · Za avtom: the chase camera on a road into the sunset ----------
function icon4() {
  const EL = [[-20, 512], [110, 420], [236, 300], [297, 236]], ER = [[532, 512], [418, 420], [336, 300], [307, 236]];
  const at = (t, s) => { const a = bezAt(...EL, t), b = bezAt(...ER, t); return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]; };
  const tOfY = (y) => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (bezAt(...EL, m)[1] > y) lo = m; else hi = m; } return (lo + hi) / 2; };
  const band = (s0, s1, t0, t1, m = 24) => { const A = [], B = []; for (let i = 0; i <= m; i++) { const t = t0 + (t1 - t0) * i / m; A.push(at(t, s0)); B.push(at(t, s1)); } return `${P([...A, ...B.reverse()])} Z`; };
  const yOf = (g) => 236 + 276 / g;
  let dashes = '', posts = '';
  for (let g = 1; g < 16; g += 1.25) dashes += band(0.49, 0.51, tOfY(yOf(g)), tOfY(yOf(g + 0.55)), 4) + ' ';
  for (let g = 1.15; g < 14; g += 1.25) {
    const t = tOfY(yOf(g)), h = 46 / g;
    for (const s of [-0.05, 1.05]) { const [x, y] = at(t, s); posts += `<rect x="${n(x - h * 0.09)}" y="${n(y - h)}" width="${n(h * 0.18)}" height="${n(h)}" fill="#e8e4ea"/><rect x="${n(x - h * 0.09)}" y="${n(y - h * 0.86)}" width="${n(h * 0.18)}" height="${n(h * 0.14)}" fill="${s < 0 ? '#ff5a3c' : '#ffb03c'}"/>`; }
  }
  return wrap(`
    <linearGradient id="sky4" x1="0" y1="0" x2="0" y2="236" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1d1442"/><stop offset=".45" stop-color="#6c2d6b"/><stop offset=".78" stop-color="#e2604f"/><stop offset="1" stop-color="#ffbe6a"/></linearGradient>
    <linearGradient id="ground4" x1="0" y1="236" x2="0" y2="512" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3b2742"/><stop offset="1" stop-color="#110d18"/></linearGradient>
    <linearGradient id="road4" x1="0" y1="236" x2="0" y2="512" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#b47c7c"/><stop offset=".22" stop-color="#5c4a5a"/><stop offset="1" stop-color="#24252d"/></linearGradient>
    <radialGradient id="vig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
    <filter id="sun" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="18"/></filter>`, `
    <rect width="512" height="512" fill="url(#sky4)"/>
    <circle cx="200" cy="170" r="90" fill="#ffb35c" opacity=".55" filter="url(#sun)"/><circle cx="200" cy="170" r="44" fill="#ffe4a3"/>
    <path d="M 0 236 L 0 176 L 46 156 L 92 182 L 138 140 L 186 176 L 226 164 L 262 198 L 300 156 L 338 126 L 380 164 L 420 146 L 466 178 L 512 160 L 512 236 Z" fill="#7b3f6f"/>
    <path d="M 0 236 L 0 210 L 70 196 L 130 214 L 196 200 L 250 222 L 304 210 L 360 220 L 420 198 L 476 214 L 512 206 L 512 236 Z" fill="#43264c"/>
    <rect y="236" width="512" height="276" fill="url(#ground4)"/>
    <path d="M -20 512 C 110 420 236 300 297 236 L 307 236 C 336 300 418 420 532 512 Z" fill="url(#road4)"/>
    <path d="${band(0.035, 0.055, 0, 1, 40)} ${band(0.945, 0.965, 0, 1, 40)}" fill="#f4efe9" opacity=".92"/>
    <path d="${dashes}" fill="#f4efe9" opacity=".9"/>${posts}
    <ellipse cx="256" cy="452" rx="112" ry="16" fill="#ff3b2f" opacity=".2" filter="url(#blur9)"/>
    <g transform="translate(256 432) scale(.8)">${carRear()}</g>
    <rect width="512" height="512" fill="url(#vig)"/>`);
}

// ---------- 5 · Drift: the car from above sliding round the kerb, smoke and tyre marks ----------
function icon5() {
  const C = [-30, -30], R = 390, th = Math.PI / 4, rot = 10, sc = 1.12;
  const P0 = [C[0] + R * Math.cos(th), C[1] + R * Math.sin(th)];
  const wheel = (lx, ly) => { const a = rot * Math.PI / 180, x = lx * sc, y = ly * sc; return [P0[0] + x * Math.cos(a) - y * Math.sin(a), P0[1] + x * Math.sin(a) + y * Math.cos(a)]; };
  const trail = (p) => { const r = Math.hypot(p[0] - C[0], p[1] - C[1]), a = Math.atan2(p[1] - C[1], p[0] - C[0]); return Array.from({ length: 34 }, (_, i) => { const b = a + i * 0.032, q = r + i * 1.4; return [C[0] + q * Math.cos(b), C[1] + q * Math.sin(b)]; }); };
  const wheels = [wheel(-44, 47), wheel(44, 47)];
  let marks = '', smoke = '';
  for (const w of wheels) {
    const t = trail(w);
    marks += `<path d="${P(t)}" fill="none" stroke="#141619" stroke-opacity=".42" stroke-width="15" stroke-linecap="round"/><path d="${P(t.slice(0, 14))}" fill="none" stroke="#141619" stroke-opacity=".3" stroke-width="15" stroke-linecap="round"/>`;
    for (const [i, rr, o] of [[1, 22, 0.85], [4, 30, 0.75], [8, 38, 0.6], [13, 46, 0.45], [19, 54, 0.32], [26, 60, 0.2]]) smoke += `<circle cx="${n(t[i][0] - 6)}" cy="${n(t[i][1] + 4)}" r="${rr}" fill="#eef1f4" opacity="${o}"/>`;
  }
  return wrap(`
    <radialGradient id="asph5" cx=".6" cy=".6" r=".8"><stop offset="0" stop-color="#5e646d"/><stop offset="1" stop-color="#363a42"/></radialGradient>
    <radialGradient id="grass5" cx=".1" cy=".1" r=".9"><stop offset="0" stop-color="#6ab250"/><stop offset="1" stop-color="#2c6629"/></radialGradient>`, `
    <rect width="512" height="512" fill="url(#asph5)"/>
    <circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="80"/>
    <circle cx="${C[0]}" cy="${C[1]}" r="205" fill="url(#grass5)"/>
    <circle cx="${C[0]}" cy="${C[1]}" r="219" fill="none" stroke="#f4f4f4" stroke-width="28"/>
    <circle cx="${C[0]}" cy="${C[1]}" r="219" fill="none" stroke="#e0262b" stroke-width="28" stroke-dasharray="22 22"/>
    <circle cx="${C[0]}" cy="${C[1]}" r="240" fill="none" stroke="#fff" stroke-width="6"/>
    ${marks}<g filter="url(#blur9)">${smoke}</g>
    <g transform="translate(${n(P0[0])} ${n(P0[1])}) rotate(${rot}) scale(${sc})">${carTop(28)}</g>`);
}

if (require.main === module) (async () => {
  const icons = [icon1(), icon2(), icon3(), icon4(), icon5()];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
  for (let i = 0; i < icons.length; i++) {
    fs.writeFileSync(path.join(DIR, `${i + 1}.svg`), icons[i]);
    await page.setContent(`<html><body style="margin:0">${icons[i]}</body></html>`);
    await page.screenshot({ path: path.join(DIR, `${i + 1}.png`), clip: { x: 0, y: 0, width: 512, height: 512 } });
  }
  const img = (f) => `data:image/png;base64,${fs.readFileSync(path.join(DIR, f)).toString('base64')}`;
  const cells = [['Zdaj', 'zdaj.png'], ['1 · Serpentina', '1.png'], ['2 · Svet', '2.png'], ['3 · Zemljevid', '3.png'], ['4 · Za avtom', '4.png'], ['5 · Drift', '5.png']];
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;width:1080px;background:linear-gradient(#777c9e,#5d6283);font-family:'DejaVu Sans',Arial,sans-serif;color:#fff}
    h1{font-size:40px;margin:30px 36px 6px}p{margin:0 36px 16px;font-size:25px;opacity:.85}
    .g{display:grid;grid-template-columns:repeat(3,1fr);row-gap:28px;padding:8px 10px 26px}.c{text-align:center}
    .t{font-size:29px;font-weight:700;margin-bottom:12px}.c img{width:270px;height:270px;border-radius:27%;display:block;margin:0 auto;box-shadow:0 6px 16px rgba(0,0,0,.28)}
    .l{font-size:30px;margin-top:12px}.s{display:flex;justify-content:space-around;align-items:flex-end;padding:20px 26px 34px;border-top:2px solid rgba(255,255,255,.25)}
    .s div{text-align:center;font-size:23px}.s img{width:64px;height:64px;border-radius:27%;display:block;margin:0 auto 6px}</style>
    <h1>Ikona igre: zdaj in 5 predlogov</h1><p>Spodaj v velikosti kot na zaslonu telefona.</p>
    <div class="g">${cells.map(([t, f]) => `<div class="c"><div class="t">${t}</div><img src="${img(f)}"><div class="l">Roads Atlas</div></div>`).join('')}</div>
    <div class="s">${cells.map(([t, f]) => `<div><img src="${img(f)}">${t.split(' · ')[0]}</div>`).join('')}</div>`;
  const sheet = await browser.newPage({ viewport: { width: 1080, height: 900 } });
  await sheet.setContent(html);
  await sheet.screenshot({ path: path.join(DIR, 'pregled.jpg'), fullPage: true, type: 'jpeg', quality: 86 });
  await browser.close();
  console.log('ok', fs.statSync(path.join(DIR, 'pregled.jpg')).size);
})();
module.exports = { n, P, bezAt, bez, arc, dedupe, normals, off, wrap, carTop, carRear, carSide, AFRICA, EURASIA, ISLANDS, SEAS };
