// Različice: 5 × Serpentina (bolj poudarjena cesta) in 5 × Svet (vijugasta cesta okoli Zemlje, tudi gor in dol).
//   node ikone2.cjs  ->  s1…s5.png, g1…g5.png, pregled-serpentina.jpg, pregled-svet.jpg
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { n, P, bezAt, bez, arc, dedupe, normals, off, wrap, carTop, carRear, carSide, AFRICA, EURASIA, ISLANDS, SEAS } = require('./ikone.cjs');
const DIR = __dirname;

// ---------- serpentine geometry (perspective: width grows towards the bottom) ----------
const GEO = {
  W: (y) => Math.max(9, 16 + (y - 120) * 0.2),
  hs: [[140, 400, 58, 50], [370, 278, 46, 34], [170, 192, 30, 22]],
  legs: [[[430, 580], [350, 505], [230, 450], [140, 450]], [[140, 350], [230, 350], [300, 312], [370, 312]], [[370, 244], [310, 244], [230, 214], [170, 214]], [[170, 170], [230, 170], [290, 146], [332, 128]]],
};
const GEO2 = {
  W: (y) => Math.max(10, 22 + (y - 120) * 0.24),
  hs: [[150, 410, 70, 58], [360, 255, 52, 40]],
  legs: [[[440, 590], [360, 520], [250, 468], [150, 468]], [[150, 352], [240, 352], [290, 295], [360, 295]], [[360, 215], [300, 215], [250, 180], [200, 140]]],
};
const TOP = {
  W: () => 64,
  hs: [[150, 360, 60, 60], [362, 240, 60, 60], [150, 120, 60, 60]],
  legs: [[[580, 470], [440, 452], [260, 420], [150, 420]], [[150, 300], [220, 300], [290, 300], [362, 300]], [[362, 180], [290, 180], [220, 180], [150, 180]], [[150, 60], [260, 60], [440, 42], [580, 20]]],
};
function pieces(g) {
  const out = []; let cur = bez(...g.legs[0], 40);
  g.hs.forEach((H, j) => {
    const left = j % 2 === 0;
    out.push(dedupe([...cur, ...(left ? arc(...H, 90, 186, 20) : arc(...H, 90, -6, 20))]));
    cur = [...(left ? arc(...H, 174, 270, 20) : arc(...H, 6, -90, 20)), ...bez(...g.legs[j + 1], 34)];
  });
  out.push(dedupe(cur)); return out;
}
function road(g, st) {
  let s = '';
  for (const pts of pieces(g).reverse()) {
    const nr = normals(pts), w = (i) => g.W(pts[i][1]), avg = pts.reduce((a, p) => a + g.W(p[1]), 0) / pts.length;
    const L = off(pts, nr, (i) => w(i) / 2), R = off(pts, nr, (i) => -w(i) / 2);
    if (st.outline) s += `<g fill="none" stroke="${st.outline}" stroke-width="${n(avg * st.outlineW)}" stroke-linejoin="round" stroke-linecap="round"><path d="${P(L)}"/><path d="${P(R)}"/></g>`;
    if (st.shoulder) s += `<g fill="none" stroke="${st.shoulder}" stroke-width="${n(avg * 0.14)}" stroke-linejoin="round"><path d="${P(L)}"/><path d="${P(R)}"/></g>`;
    s += `<path d="${P([...L, ...R.slice().reverse()])} Z" fill="${st.asph}"/>`;
    if (st.edge) {
      const e = [1, -1].map((k) => `<path d="${P(off(pts, nr, (i) => k * w(i) * 0.4))}"/>`).join(''), ew = n(Math.max(1.5, avg * 0.06));
      if (st.glow) s += `<g fill="none" stroke="${st.edge}" stroke-width="${n(ew * 2.4)}" opacity=".75" filter="url(#glowS)">${e}</g>`;
      s += `<g fill="none" stroke="${st.edge}" stroke-width="${ew}" stroke-linejoin="round">${e}</g>`;
    }
    if (st.center && avg > 16) s += `<path d="${P(pts)}" fill="none" stroke="${st.center}" stroke-width="${n(avg * 0.05)}" stroke-dasharray="${n(avg * 0.3)} ${n(avg * 0.32)}"/>`;
    if (st.poles) for (let i = 3; i < pts.length; i += 7) for (const k of [1, -1]) {
      const h = w(i) * 0.4, x = pts[i][0] + nr[i][0] * k * w(i) * 0.66, y = pts[i][1] + nr[i][1] * k * w(i) * 0.66;
      s += `<rect x="${n(x - h * 0.07)}" y="${n(y - h)}" width="${n(h * 0.14)}" height="${n(h)}" fill="#ff7a1a"/><rect x="${n(x - h * 0.07)}" y="${n(y - h)}" width="${n(h * 0.14)}" height="${n(h * 0.25)}" fill="#1c1c1c"/>`;
    }
  }
  return s;
}
function barriers(g) {
  return g.hs.map((H, j) => {
    const [cx, cy, rx, ry] = H, [a0, a1] = j % 2 === 0 ? [116, 244] : [-64, 64], w = g.W(cy);
    const pts = arc(cx, cy, rx, ry, a0, a1, 24).map(([x, y]) => { const a = Math.atan2((y - cy) / ry, (x - cx) / rx); const nx = Math.cos(a) / rx, ny = Math.sin(a) / ry, l = Math.hypot(nx, ny), d = g.W(y) * 0.7; return [x + nx / l * d, y + ny / l * d]; });
    return `<path d="${P(pts)}" fill="none" stroke="#fff" stroke-width="${n(w * 0.18)}" stroke-linecap="round"/><path d="${P(pts)}" fill="none" stroke="#e0262b" stroke-width="${n(w * 0.18)}" stroke-dasharray="${n(w * 0.2)} ${n(w * 0.2)}"/>`;
  }).join('');
}
const carOn = (g, t = 0.68, k = 0.95) => { const [x, y] = bezAt(...g.legs[0], t); return `<g transform="translate(${n(x)} ${n(y)}) scale(${(k * g.W(y) / 248).toFixed(3)})">${carRear()}</g>`; };
const tree = (x, y, h, c1 = '#1f5c27', c2 = '#17451e', snow) => `<path d="M ${n(x)} ${n(y - h)} L ${n(x + h * 0.32)} ${n(y - h * 0.1)} L ${n(x - h * 0.32)} ${n(y - h * 0.1)} Z" fill="${c1}"/><path d="M ${n(x)} ${n(y - h)} L ${n(x + h * 0.32)} ${n(y - h * 0.1)} L ${n(x)} ${n(y - h * 0.1)} Z" fill="${c2}"/>${snow ? `<path d="M ${n(x)} ${n(y - h)} L ${n(x + h * 0.14)} ${n(y - h * 0.6)} L ${n(x)} ${n(y - h * 0.66)} L ${n(x - h * 0.14)} ${n(y - h * 0.6)} Z M ${n(x - h * 0.26)} ${n(y - h * 0.26)} L ${n(x + h * 0.26)} ${n(y - h * 0.26)} L ${n(x + h * 0.18)} ${n(y - h * 0.36)} L ${n(x - h * 0.18)} ${n(y - h * 0.36)} Z" fill="#fff"/>` : ''}<rect x="${n(x - h * 0.04)}" y="${n(y - h * 0.12)}" width="${n(h * 0.08)}" height="${n(h * 0.12)}" fill="#3b2a1a"/>`;
const TREES = [[40, 505, 60], [95, 522, 55], [480, 400, 46], [500, 300, 34], [470, 200, 20], [60, 280, 30], [95, 300, 26], [40, 232, 22], [70, 190, 16], [100, 178, 14], [420, 192, 18], [462, 184, 16]];
const MTN = (c1, c2) => `<path d="M -10 200 L 40 120 L 90 86 L 150 34 L 205 82 L 250 108 L 300 124 L 332 116 L 372 70 L 430 26 L 480 72 L 522 96 L 522 200 Z" fill="${c1}"/><path d="M 150 34 L 205 82 L 250 108 L 280 130 L 170 130 Z M 430 26 L 480 72 L 522 96 L 522 140 L 445 140 Z" fill="${c2}"/>`;
const SNOW = (c) => `<path d="M 124 64 L 150 34 L 178 62 L 168 60 L 159 70 L 150 61 L 138 72 Z M 405 52 L 430 26 L 458 54 L 447 52 L 438 62 L 429 53 L 417 64 Z" fill="${c}"/>`;
const SLOPE = (f) => `<path d="M -10 166 C 80 150 200 134 270 132 C 300 131 318 128 332 124 C 370 132 440 150 522 168 L 522 522 L -10 522 Z" fill="${f}"/>`;
const vgrad = (id, y0, y1, stops) => `<linearGradient id="${id}" x1="0" y1="${y0}" x2="0" y2="${y1}" gradientUnits="userSpaceOnUse">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const CLOUDS = `<g filter="url(#cl)" fill="#fff" opacity=".85"><ellipse cx="96" cy="60" rx="56" ry="14"/><ellipse cx="126" cy="50" rx="32" ry="13"/><ellipse cx="300" cy="34" rx="46" ry="10"/></g>`;
const CLF = '<filter id="cl" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="5"/></filter>';

const S = [];
// S1 · Poletje: closer, three hairpins, dark asphalt with white edges and a yellow centre line
S.push(wrap(`${vgrad('sky', 0, 200, [[0, '#2a64c9'], [1, '#a9dcf7']])}${vgrad('sl', 124, 512, [[0, '#a3d66e'], [0.45, '#58a443'], [1, '#2b6829']])}${vgrad('as', 124, 512, [[0, '#7a8089'], [1, '#30343b']])}${CLF}`,
  `<rect width="512" height="512" fill="url(#sky)"/>${CLOUDS}${MTN('#8ea6c6', '#7790b3')}${SNOW('#f4f8fc')}${SLOPE('url(#sl)')}${TREES.map((t) => tree(...t)).join('')}
  ${road(GEO, { shoulder: '#d8c99e', asph: 'url(#as)', edge: '#fff', center: '#ffd447' })}${barriers(GEO)}${carOn(GEO)}`));
// S2 · Zima: snow everywhere, black road, orange snow poles
S.push(wrap(`${vgrad('sky', 0, 200, [[0, '#1d58b8'], [1, '#9fd2f4']])}${vgrad('sl', 124, 512, [[0, '#ffffff'], [0.5, '#e4edf6'], [1, '#c3d5e7']])}${vgrad('as', 124, 512, [[0, '#646b74'], [1, '#24282e']])}${CLF}`,
  `<rect width="512" height="512" fill="url(#sky)"/>${CLOUDS}${MTN('#e9f0f7', '#bccce0')}${SNOW('#ffffff')}${SLOPE('url(#sl)')}${TREES.map((t) => tree(...t, '#1d4d2c', '#163b22', true)).join('')}
  ${road(GEO, { shoulder: '#a9bdd2', asph: 'url(#as)', edge: '#fff', center: '#ffd447', poles: true })}${barriers(GEO)}${carOn(GEO)}`));
// S3 · Od zgoraj: the pass from a drone, kerbs inside the hairpins, guard rails outside, the car from above
{
  const ring = (H, r, a0, a1) => P(arc(H[0], H[1], r, r, a0, a1, 30));
  const spans = TOP.hs.map((H, j) => (j % 2 === 0 ? [100, 260] : [-80, 80]));
  const kerbs = TOP.hs.map((H, j) => `<path d="${ring(H, 22, ...spans[j])}" fill="none" stroke="#fff" stroke-width="12"/><path d="${ring(H, 22, ...spans[j])}" fill="none" stroke="#e0262b" stroke-width="12" stroke-dasharray="8 8"/>`).join('');
  const rails = TOP.hs.map((H, j) => `<path d="${ring(H, 101, ...spans[j])}" fill="none" stroke="#3d4249" stroke-width="10" stroke-dasharray="3 15"/><path d="${ring(H, 101, ...spans[j])}" fill="none" stroke="#d6dbe1" stroke-width="5"/>`).join('');
  const trees = [[260, 360, 18], [330, 352, 16], [400, 366, 17], [470, 352, 18], [190, 240, 16], [250, 236, 18], [310, 244, 15], [250, 120, 17], [320, 112, 15], [400, 118, 18], [470, 104, 16], [24, 240, 20], [28, 440, 22], [80, 500, 20], [490, 240, 18], [488, 168, 14]]
    .map(([x, y, r]) => `<ellipse cx="${x + 5}" cy="${y + 6}" rx="${r}" ry="${r * 0.9}" fill="#000" opacity=".22"/><circle cx="${x}" cy="${y}" r="${r}" fill="#2c6a2b"/><circle cx="${x - r * 0.28}" cy="${y - r * 0.28}" r="${r * 0.55}" fill="#3f8a3a"/>`).join('');
  S.push(wrap(`<radialGradient id="gr" cx=".2" cy=".15" r="1"><stop offset="0" stop-color="#86c95e"/><stop offset="1" stop-color="#2f6f2e"/></radialGradient>`,
    `<rect width="512" height="512" fill="url(#gr)"/><g fill="#fff" opacity=".05"><path d="M -10 250 C 120 230 260 280 522 230 L 522 270 C 260 320 120 270 -10 290 Z"/><path d="M -10 110 C 140 90 300 140 522 100 L 522 130 C 300 170 140 120 -10 140 Z"/></g>
    ${trees}${rails}${road(TOP, { shoulder: '#cbbd94', asph: '#41464e', edge: '#fff', center: '#ffd447' })}${kerbs}
    <g transform="translate(262 300) rotate(90) scale(.5)">${carTop()}</g>`));
}
// S4 · Zahod: the pass at sunset, the road lines glow
S.push(wrap(`${vgrad('sky', 0, 175, [[0, '#1d1442'], [0.45, '#6c2d6b'], [0.8, '#e2604f'], [1, '#ffbe6a']])}${vgrad('sl', 124, 512, [[0, '#3b2742'], [1, '#120d18']])}${vgrad('as', 124, 512, [[0, '#a8949f'], [1, '#4a4550']])}
  <filter id="glowS" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter><filter id="sunb" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="16"/></filter>`,
  `<rect width="512" height="512" fill="url(#sky)"/><circle cx="332" cy="108" r="74" fill="#ffb35c" opacity=".55" filter="url(#sunb)"/><circle cx="332" cy="108" r="34" fill="#ffe4a3"/>
  ${MTN('#5a2d5e', '#47234c')}${SNOW('#f6c7a8')}${SLOPE('url(#sl)')}${TREES.map((t) => tree(...t, '#1a1222', '#140e1a')).join('')}
  ${road(GEO, { asph: 'url(#as)', edge: '#fff', glow: true, center: '#ffd447' })}${barriers(GEO)}${carOn(GEO)}`));
// S5 · Ploska: flat colours, two big hairpins, the road outlined in white like a sticker
S.push(wrap('', `<rect width="512" height="512" fill="#5cc8f5"/><circle cx="440" cy="70" r="34" fill="#ffd84a"/>
  <path d="M -10 160 L 70 92 L 160 150 Z" fill="#8fb0d6"/><path d="M 230 150 L 380 30 L 522 140 L 522 200 L 230 200 Z" fill="#7d9cc4"/><path d="M 340 62 L 380 30 L 420 62 L 404 58 L 392 70 L 380 60 L 366 72 L 354 60 Z" fill="#fff"/>
  <path d="M -10 150 C 60 146 150 142 200 138 C 260 134 380 150 522 170 L 522 522 L -10 522 Z" fill="#5cb85c"/><path d="M -10 420 C 120 400 300 440 522 410 L 522 522 L -10 522 Z" fill="#4ea84e"/>
  ${road(GEO2, { outline: '#fff', outlineW: 0.26, asph: '#2f3238', center: '#ffd447' })}${barriers(GEO2)}${carOn(GEO2, 0.66, 0.9)}`));

// ---------- the globe with a winding road that also rises and falls ----------
function globe(o) {
  const CX = o.cx || 256, CY = o.cy || 248, R = o.r || 142, f0 = (o.lat ?? 30) * Math.PI / 180, l0 = (o.lon ?? 14) * Math.PI / 180;
  const geo = ([la, lo]) => { const f = la * Math.PI / 180, l = lo * Math.PI / 180 - l0; return { x: Math.cos(f) * Math.sin(l), y: Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l), c: Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l) }; };
  const proj = (p) => { let { x, y, c } = geo(p); if (c < 0) { const m = Math.hypot(x, y) || 1; x /= m; y /= m; } return [CX + R * x, CY - R * y]; };
  const smooth = (pts) => { const m = pts.length; let d = `M ${n(pts[0][0])} ${n(pts[0][1])}`; for (let i = 0; i < m; i++) { const a = pts[(i - 1 + m) % m], b = pts[i], c = pts[(i + 1) % m], e = pts[(i + 2) % m]; d += ` C ${n(b[0] + (c[0] - a[0]) / 6)} ${n(b[1] + (c[1] - a[1]) / 6)} ${n(c[0] - (e[0] - b[0]) / 6)} ${n(c[1] - (e[1] - b[1]) / 6)} ${n(c[0])} ${n(c[1])}`; } return d + ' Z'; };
  const vis = (pts) => { let d = '', on = false; for (const p of pts) { const g = geo(p); if (g.c < 0.02) { on = false; continue; } d += `${on ? 'L' : 'M'} ${n(CX + R * g.x)} ${n(CY - R * g.y)} `; on = true; } return d; };
  let grat = '';
  for (let lo = -150; lo <= 180; lo += 30) grat += vis(Array.from({ length: 61 }, (_, i) => [-90 + i * 3, lo]));
  for (const la of [-60, -30, 0, 30, 60]) grat += vis(Array.from({ length: 121 }, (_, i) => [la, -180 + i * 3]));
  const land = [AFRICA, EURASIA, ...ISLANDS].map((c) => smooth(c.map(proj))).join(' '), seas = SEAS.map((c) => smooth(c.map(proj))).join(' ');
  // the road: a tilted ellipse that winds in and out (5 bends) and rises and falls (6 hills, most at the front and back)
  const RX = o.rx || 222, RY = o.ry || 78, tl = (o.tilt ?? -14) * Math.PI / 180, RCY = o.rcy || CY + 20, N = 720, W = o.w || 44, hill = o.hill ?? 16;
  const ring = Array.from({ length: N + 1 }, (_, i) => { const t = i / N * Math.PI * 2, s = 1 + 0.05 * Math.sin(5 * t + 0.7); const x = RX * s * Math.cos(t), y = RY * s * Math.sin(t) - hill * Math.sin(t) ** 2 * Math.sin(6 * t + 0.3); return [CX + x * Math.cos(tl) - y * Math.sin(tl), RCY + x * Math.sin(tl) + y * Math.cos(tl)]; });
  const front = [...ring.slice(N - 6, N), ...ring.slice(0, N / 2 + 7)], back = [...ring.slice(N / 2 - 6, N), ...ring.slice(0, 7)];
  const st = o.st;
  const half = (pts) => { const nr = normals(pts), d = P(pts); return `<path d="${d}" fill="none" stroke="${st.casing}" stroke-width="${W + (st.casingW || 8)}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${st.asph}" stroke-width="${W}" stroke-linejoin="round"/>`
    + (st.edge ? [1, -1].map((k) => `<path d="${P(off(pts, nr, () => k * (W / 2 - 4)))}" fill="none" stroke="${st.edge}" stroke-width="3.5"/>`).join('') : '')
    + `<path d="${d}" fill="none" stroke="${st.center}" stroke-width="${W > 46 ? 4.5 : 3.5}" stroke-dasharray="15 12"/>`; };
  const kerb = (idx) => { const pts = idx.map((i) => ring[(i + N) % N]), nr = normals(pts); const k = pts.map((p, i) => { const s = Math.sign(nr[i][0] * (p[0] - CX) + nr[i][1] * (p[1] - RCY)) || 1; return [p[0] + nr[i][0] * s * (W / 2 + 8), p[1] + nr[i][1] * s * (W / 2 + 8)]; }); return `<path d="${P(k)}" fill="none" stroke="#fff" stroke-width="10"/><path d="${P(k)}" fill="none" stroke="#e0262b" stroke-width="10" stroke-dasharray="9 9"/>`; };
  const ic = Math.round((o.carAt || 108) / 360 * N), p = ring[ic], q0 = ring[ic + 3], q1 = ring[ic - 3], ang = Math.atan2(q1[1] - q0[1], q1[0] - q0[0]) * 180 / Math.PI;
  return wrap(`<radialGradient id="ocean" cx="${o.lightX ?? 0.36}" cy=".3" r=".78">${o.ocean.map(([a, c]) => `<stop offset="${a}" stop-color="${c}"/>`).join('')}</radialGradient>
    <radialGradient id="shade" cx="${o.lightX ?? 0.32}" cy=".26" r=".95"><stop offset=".42" stop-color="#001233" stop-opacity="0"/><stop offset="1" stop-color="#001233" stop-opacity="${o.shade ?? 0.55}"/></radialGradient>
    <clipPath id="globe"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>${o.defs || ''}`, `${o.bg}
    ${half(back)}<path d="${P(back)}" fill="none" stroke="#000" stroke-opacity="${o.backDark ?? 0.28}" stroke-width="${W + 8}" stroke-linejoin="round"/>
    ${o.glow ? `<circle cx="${CX}" cy="${CY}" r="${R + 10}" fill="${o.glow}" opacity=".35" filter="url(#blur9)"/>` : ''}
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#ocean)"/>
    <g clip-path="url(#globe)"><path d="${land}" fill="${o.land}"/><path d="${seas}" fill="${o.sea || '#3a86d4'}"/><path d="${grat}" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.2"/>
      ${o.flat ? '' : `<circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#shade)"/><ellipse cx="${CX - 50}" cy="${CY - 66}" rx="52" ry="30" fill="#fff" opacity=".16" filter="url(#blur9)"/>`}</g>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${o.rim || '#a9e1ff'}" stroke-opacity="${o.flat ? 1 : 0.6}" stroke-width="${o.flat ? 8 : 3}"/>
    ${half(front)}${kerb(Array.from({ length: 45 }, (_, i) => i - 22))}${kerb(Array.from({ length: 45 }, (_, i) => N / 2 - 22 + i))}
    <g transform="translate(${n(p[0])} ${n(p[1])}) rotate(${n(ang)}) translate(0 ${n(W * 0.2)}) scale(${o.carS || 1})">${carSide()}</g>${o.fg || ''}`);
}
const stars = (cx, cy, r) => { let s = '', z = 7; for (let i = 0; i < 24; i++) { z = (z * 9301 + 49297) % 233280; const x = z / 233280 * 512; z = (z * 9301 + 49297) % 233280; const y = z / 233280 * 512; if (Math.hypot(x - cx, y - cy) > r + 20) s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.8 + (i % 3) * 0.5)}" fill="#fff" opacity="${(0.35 + (i % 4) * 0.15).toFixed(2)}"/>`; } return s; };
const ROAD = { casing: '#1f232a', asph: '#4a4f58', edge: '#f3f3f3', center: '#ffd447' };
const OCEAN = [[0, '#63b8f6'], [0.6, '#2a74c9'], [1, '#163d84']];
const G = [
  // G1 · Noč: as before, the road now winds and rises and falls
  globe({ bg: `<rect width="512" height="512" fill="url(#bg)"/>${stars(256, 248, 142)}`, defs: '<radialGradient id="bg" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#21549f"/><stop offset="1" stop-color="#0a1534"/></radialGradient>', ocean: OCEAN, land: '#62bf5c', glow: '#7fd0ff', st: ROAD }),
  // G2 · Dan: a bright sky with clouds
  globe({ bg: `<rect width="512" height="512" fill="url(#bg)"/><g filter="url(#blur9)" fill="#fff" opacity=".8"><ellipse cx="70" cy="70" rx="70" ry="22"/><ellipse cx="450" cy="440" rx="80" ry="24"/><ellipse cx="440" cy="70" rx="50" ry="16"/></g>`, defs: '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6e3ff"/><stop offset="1" stop-color="#3a98e0"/></linearGradient>', ocean: [[0, '#7fd0ff'], [0.6, '#2f86dc'], [1, '#1c5aa8']], land: '#6fca62', shade: 0.35, glow: '#ffffff', st: ROAD, hill: 18 }),
  // G3 · Zahod: sunset colours, the globe lit from the right
  globe({ bg: '<rect width="512" height="512" fill="url(#bg)"/>', defs: '<linearGradient id="bg" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#2a1b4a"/><stop offset=".55" stop-color="#a8375a"/><stop offset="1" stop-color="#f0844a"/></linearGradient>', ocean: [[0, '#5fa8e8'], [0.6, '#2a5fae'], [1, '#1a2f6a']], land: '#5aa95a', lightX: 0.7, glow: '#ffb35c', rim: '#ffc078', st: { casing: '#1a1520', asph: '#4d4655', edge: '#ffe9d6', center: '#ffcf4a' } }),
  // G4 · Bližje: a bigger globe, the road steeper and wider, a bigger car
  globe({ cx: 256, cy: 250, r: 168, lat: 38, lon: -2, rx: 250, ry: 92, tilt: -20, rcy: 276, w: 52, hill: 20, carS: 1.3, carAt: 104, bg: `<rect width="512" height="512" fill="url(#bg)"/>${stars(256, 250, 168)}`, defs: '<radialGradient id="bg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#16356e"/><stop offset="1" stop-color="#050b1c"/></radialGradient>', ocean: OCEAN, land: '#62bf5c', glow: '#7fd0ff', st: ROAD }),
  // G5 · Ploska: flat colours on orange, white outlines
  globe({ bg: '<rect width="512" height="512" fill="#ff9a3c"/><circle cx="256" cy="248" r="230" fill="#ffb15c"/>', ocean: [[0, '#3aa3f0'], [1, '#3aa3f0']], land: '#79d15f', sea: '#3aa3f0', flat: true, rim: '#ffffff', backDark: 0.18, st: { casing: '#ffffff', casingW: 12, asph: '#2f3238', center: '#ffd447' } }),
];

module.exports = { GEO, GEO2, TOP, pieces, road, barriers, tree, TREES, MTN, SNOW, SLOPE, vgrad, CLOUDS, CLF };
if (require.main === module) (async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
  for (const [pre, list] of [['s', S], ['g', G]]) for (let i = 0; i < list.length; i++) {
    await page.setContent(`<html><body style="margin:0">${list[i]}</body></html>`);
    await page.screenshot({ path: path.join(DIR, `${pre}${i + 1}.png`), clip: { x: 0, y: 0, width: 512, height: 512 } });
  }
  const img = (f) => `data:image/png;base64,${fs.readFileSync(path.join(DIR, f)).toString('base64')}`;
  const sheet = async (title, cells, out) => {
    const html = `<!doctype html><meta charset="utf-8"><style>
      body{margin:0;width:1080px;background:linear-gradient(#777c9e,#5d6283);font-family:'DejaVu Sans',Arial,sans-serif;color:#fff}
      h1{font-size:40px;margin:30px 36px 6px}p{margin:0 36px 16px;font-size:25px;opacity:.85}
      .g{display:grid;grid-template-columns:repeat(3,1fr);row-gap:28px;padding:8px 10px 26px}.c{text-align:center}
      .t{font-size:29px;font-weight:700;margin-bottom:12px}.c img{width:270px;height:270px;border-radius:27%;display:block;margin:0 auto;box-shadow:0 6px 16px rgba(0,0,0,.28)}
      .l{font-size:30px;margin-top:12px}.s{display:flex;justify-content:space-around;align-items:flex-end;padding:20px 26px 34px;border-top:2px solid rgba(255,255,255,.25)}
      .s div{text-align:center;font-size:23px}.s img{width:64px;height:64px;border-radius:27%;display:block;margin:0 auto 6px}</style>
      <h1>${title}</h1><p>Spodaj v velikosti kot na zaslonu telefona.</p>
      <div class="g">${cells.map(([t, f]) => `<div class="c"><div class="t">${t}</div><img src="${img(f)}"><div class="l">Roads Atlas</div></div>`).join('')}</div>
      <div class="s">${cells.map(([t, f]) => `<div><img src="${img(f)}">${t.split(' · ')[0]}</div>`).join('')}</div>`;
    const p = await browser.newPage({ viewport: { width: 1080, height: 900 } });
    await p.setContent(html);
    await p.screenshot({ path: path.join(DIR, out), fullPage: true, type: 'jpeg', quality: 86 });
  };
  await sheet('Serpentina: 5 različic', [['Prej · 1', '1.png'], ['S1 · Poletje', 's1.png'], ['S2 · Zima', 's2.png'], ['S3 · Od zgoraj', 's3.png'], ['S4 · Zahod', 's4.png'], ['S5 · Ploska', 's5.png']], 'pregled-serpentina.jpg');
  await sheet('Svet: 5 različic', [['Prej · 2', '2.png'], ['G1 · Noč', 'g1.png'], ['G2 · Dan', 'g2.png'], ['G3 · Zahod', 'g3.png'], ['G4 · Bližje', 'g4.png'], ['G5 · Ploska', 'g5.png']], 'pregled-svet.jpg');
  await browser.close();
  for (const f of ['pregled-serpentina.jpg', 'pregled-svet.jpg']) console.log(f, fs.statSync(path.join(DIR, f)).size);
})();
