// Draws the app icons in icons/ (home screen, app list, browser tab) from the picture below: the Earth with a road
// round it, its edges striped white and red like a kerb, under a starry sky (decision O-28-1, "2 · Svet z robom").
// No car, lettering or logo. Rendered with the browser the tests use (Playwright).
//   node tools/icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { chromium } from '../tests/lib/playwright.mjs';

const DIR = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'icons');
const n = (v) => +v.toFixed(1);

// coastlines, [latitude, longitude], drawn rough on purpose (an icon, not a map)
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

// rounded: the corners are cut round (a plain icon); otherwise the picture fills the square (Android crops it to its own
// shape, iOS rounds it itself). fit scales the globe and the road about the middle: 0.76 keeps them inside the middle
// 80 % circle (Android's safe zone) for the round crop.
function svg(size, rounded, fit) {
  const CX = 256, CY = 248, R = 142, f0 = 30 * Math.PI / 180, l0 = 14 * Math.PI / 180, RX = 226, RY = 64;
  // the globe seen from above 30° N, 14° E (orthographic); points behind it are pushed onto its rim
  const geo = ([la, lo]) => { const f = la * Math.PI / 180, l = lo * Math.PI / 180 - l0; return { x: Math.cos(f) * Math.sin(l), y: Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l), c: Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l) }; };
  const proj = (p) => { let { x, y, c } = geo(p); if (c < 0) { const m = Math.hypot(x, y) || 1; x /= m; y /= m; } return [CX + R * x, CY - R * y]; };
  const smooth = (pts) => { const m = pts.length; let d = `M ${n(pts[0][0])} ${n(pts[0][1])}`; for (let i = 0; i < m; i++) { const a = pts[(i - 1 + m) % m], b = pts[i], c = pts[(i + 1) % m], e = pts[(i + 2) % m]; d += ` C ${n(b[0] + (c[0] - a[0]) / 6)} ${n(b[1] + (c[1] - a[1]) / 6)} ${n(c[0] - (e[0] - b[0]) / 6)} ${n(c[1] - (e[1] - b[1]) / 6)} ${n(c[0])} ${n(c[1])}`; } return d + ' Z'; };
  const land = [AFRICA, EURASIA, ...ISLANDS].map((c) => smooth(c.map(proj))).join(' '), seas = SEAS.map((c) => smooth(c.map(proj))).join(' ');
  const vis = (pts) => { let d = '', on = false; for (const p of pts) { const g = geo(p); if (g.c < 0.02) { on = false; continue; } d += `${on ? 'L' : 'M'} ${n(CX + R * g.x)} ${n(CY - R * g.y)} `; on = true; } return d; };
  let grat = '';
  for (let lo = -150; lo <= 180; lo += 30) grat += vis(Array.from({ length: 61 }, (_, i) => [-90 + i * 3, lo]));
  for (const la of [-60, -30, 0, 30, 60]) grat += vis(Array.from({ length: 121 }, (_, i) => [la, -180 + i * 3]));
  // the road: a flat ellipse round the globe, a yellow centre line and a striped kerb along both edges
  const ring = `<ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#1f232a" stroke-width="56"/><ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#4a4f58" stroke-width="48"/>
    ${[28, -28].map((d) => `<ellipse rx="${RX + d}" ry="${RY + d}" fill="none" stroke="#fff" stroke-width="9"/><ellipse rx="${RX + d}" ry="${RY + d}" fill="none" stroke="#e0262b" stroke-width="9" stroke-dasharray="9 9"/>`).join('')}
    <ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#ffd447" stroke-width="3.5" stroke-dasharray="15 13"/>`;
  let stars = '', z = 7;
  for (let i = 0; i < 22; i++) { z = (z * 9301 + 49297) % 233280; const x = z / 233280 * 512; z = (z * 9301 + 49297) % 233280; const y = z / 233280 * 512; if (Math.hypot(x - CX, y - CY) > R + 20) stars += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.8 + (i % 3) * 0.5)}" fill="#fff" opacity="${(0.35 + (i % 4) * 0.15).toFixed(2)}"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <filter id="blur9" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>
    <radialGradient id="space" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#21549f"/><stop offset="1" stop-color="#0a1534"/></radialGradient>
    <radialGradient id="ocean" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#63b8f6"/><stop offset=".6" stop-color="#2a74c9"/><stop offset="1" stop-color="#163d84"/></radialGradient>
    <radialGradient id="shade" cx=".32" cy=".26" r=".95"><stop offset=".42" stop-color="#001233" stop-opacity="0"/><stop offset="1" stop-color="#001233" stop-opacity=".55"/></radialGradient>
    <clipPath id="globe"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
    <clipPath id="front"><rect x="-400" y="0" width="800" height="400" transform="translate(256 268) rotate(-14)"/></clipPath>
    <clipPath id="clip"><rect width="512" height="512" rx="${rounded ? 112 : 0}"/></clipPath>
  </defs>
  <g clip-path="url(#clip)">
    <rect width="512" height="512" fill="url(#space)"/>${stars}
    <g transform="translate(256 256) scale(${fit}) translate(-256 -256)">
      <g transform="translate(256 268) rotate(-14)">${ring}<ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="56"/></g>
      <circle cx="${CX}" cy="${CY}" r="${R + 10}" fill="#7fd0ff" opacity=".35" filter="url(#blur9)"/>
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#ocean)"/>
      <g clip-path="url(#globe)"><path d="${land}" fill="#62bf5c"/><path d="${seas}" fill="#3a86d4"/><path d="${grat}" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.2"/>
        <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#shade)"/><ellipse cx="206" cy="182" rx="52" ry="30" fill="#fff" opacity=".16" filter="url(#blur9)"/></g>
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#a9e1ff" stroke-opacity=".6" stroke-width="3"/>
      <g clip-path="url(#front)"><g transform="translate(256 268) rotate(-14)">${ring}</g></g>
    </g>
  </g>
</svg>`;
}

const OUT = [
  { file: 'icon-192.png', size: 192, rounded: true, fit: 1 },
  { file: 'icon-512.png', size: 512, rounded: true, fit: 1 },
  { file: 'icon-maskable-512.png', size: 512, rounded: false, fit: 0.76 },
  { file: 'apple-touch-icon.png', size: 180, rounded: false, fit: 0.76 },
];

fs.mkdirSync(DIR, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const o of OUT) {
    await page.setViewportSize({ width: o.size, height: o.size });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg(o.size, o.rounded, o.fit)}</body></html>`);
    await page.screenshot({ path: path.join(DIR, o.file), omitBackground: true, clip: { x: 0, y: 0, width: o.size, height: o.size } });
    console.log('written icons/' + o.file);
  }
} finally {
  await browser.close();
}
