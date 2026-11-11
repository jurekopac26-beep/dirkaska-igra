// Ikona 2 · Svet (prejšnja različica, ravna cesta okoli Zemlje) z novim, lepšim avtom od strani.
//   node ikone3.cjs  ->  2a.png, 2b.png, 2c.png, avto.png, pregled-svet-avto.jpg
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { n, P, arc, wrap, AFRICA, EURASIA, ISLANDS, SEAS } = require('./ikone.cjs');
const DIR = __dirname;

// ---------- the new car: a low fastback coupé, front towards +x, origin on the ground under its middle, ~155 long ----------
const BODY = 'M 72 -7 L 61.87 -7 A 18 18 0 1 0 30.13 -7 L -30.13 -7 A 18 18 0 1 0 -61.87 -7 L -69.5 -7 C -72.5 -7 -74.6 -9 -75 -12.5 L -76 -27 C -76 -34 -75.2 -38.6 -73.5 -41 L -71.5 -43.6 C -66 -43.2 -61.5 -42.6 -58 -42 C -47 -46.5 -33 -53.5 -17 -55 C -7 -56 1 -55 6 -52.6 C 12 -48.5 19 -43 25 -40 C 34 -39.6 42 -39.6 50 -38.6 C 58 -37.6 65 -35.4 70 -32 C 74.5 -29 76.6 -25.5 77 -21 C 77.4 -15 76.5 -9.5 72 -7 Z';
const GLASS = 'M 19.5 -41.3 C 15 -44.3 10 -48.3 5 -50.4 C 0 -52.6 -7 -53.2 -16 -52.4 C -28 -51.4 -38 -46.4 -46 -42.4 Z';
const ARCHES = 'M 61.87 -7 A 18 18 0 1 0 30.13 -7 M -30.13 -7 A 18 18 0 1 0 -61.87 -7';
const HEAD = 'M 62 -33.6 C 67.5 -32.6 72.5 -30 75.6 -26.2 L 76 -24.8 L 69 -25.6 C 66 -28.2 63 -30.4 59.6 -31.6 Z';
const TAIL = 'M -75.4 -32 C -75.2 -36 -74.4 -39 -72.8 -40.8 L -66.8 -41.4 C -68.4 -38.4 -69.2 -35.4 -69.4 -32.6 Z';
const PAINT = {
  b: ['#9dd2ff', '#4a95ff', '#226ae0', '#1647aa', '#0b2766'],
  r: ['#ffb4a4', '#ff5a44', '#e3201f', '#a8101a', '#55060c'],
};
const SHARED = `<linearGradient id="cglass" x1="0" y1="-53" x2="0" y2="-41" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5a7a9c"/><stop offset=".35" stop-color="#1c2836"/><stop offset="1" stop-color="#080c12"/></linearGradient>
  <linearGradient id="crim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#cdd4dc"/><stop offset="1" stop-color="#7d8590"/></linearGradient>
  <radialGradient id="cdisc"><stop offset="0" stop-color="#868c95"/><stop offset="1" stop-color="#3a3f47"/></radialGradient>
  <linearGradient id="cunder" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".8"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></linearGradient>
  <clipPath id="cgl"><path d="${GLASS}"/></clipPath>
  <filter id="csoft" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="cglow" x="-100%" y="-200%" width="300%" height="500%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="cb1" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="1.1"/></filter>`;
const carDefs = (k) => { const p = PAINT[k]; return `<linearGradient id="cp-${k}" x1="0" y1="-56" x2="0" y2="-6" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${p[0]}"/><stop offset=".26" stop-color="${p[1]}"/><stop offset=".52" stop-color="${p[2]}"/><stop offset=".8" stop-color="${p[3]}"/><stop offset="1" stop-color="${p[4]}"/></linearGradient><clipPath id="cb-${k}"><path d="${BODY}"/></clipPath>`; };

function wheel(cx) {
  const pt = (r, a) => `${n(r * Math.cos(a * Math.PI / 180))} ${n(r * Math.sin(a * Math.PI / 180))}`;
  let sp = '';
  for (let i = 0; i < 5; i++) { const a = -78 + i * 72; sp += `<path d="M ${pt(2.7, a - 30)} L ${pt(10.5, a - 8.5)} L ${pt(10.5, a + 8.5)} L ${pt(2.7, a + 30)} Z"/>`; }
  const cal = `M ${pt(5, -64)} L ${pt(8.2, -64)} A 8.2 8.2 0 0 1 ${pt(8.2, -16)} L ${pt(5, -16)} A 5 5 0 0 0 ${pt(5, -64)} Z`;
  return `<g transform="translate(${cx} -15.5)"><circle r="15.5" fill="#111317"/><circle r="14.1" fill="none" stroke="#2d323a" stroke-width="1.6"/>
    <path d="M ${pt(14.9, 196)} A 14.9 14.9 0 0 1 ${pt(14.9, 258)}" fill="none" stroke="#454b55" stroke-width="1.1"/>
    <circle r="11" fill="#1b1f25"/><circle r="8.4" fill="url(#cdisc)"/><path d="${cal}" fill="#e3262d"/><g fill="url(#crim)">${sp}</g>
    <circle r="10.7" fill="none" stroke="#e2e7ec" stroke-width="1.4"/><circle r="11.4" fill="none" stroke="#5d646e" stroke-width=".6"/>
    <path d="M ${pt(10.7, 200)} A 10.7 10.7 0 0 1 ${pt(10.7, 248)}" fill="none" stroke="#fff" stroke-width="1.5"/>
    <circle r="2.6" fill="#dde2e8"/><circle r="1.2" fill="#3b424c"/></g>`;
}
function carSide2(k = 'b') {
  const c = PAINT[k];
  return `<ellipse cx="0" cy="0" rx="82" ry="5.5" fill="#000" opacity=".55" filter="url(#csoft)"/>
  <rect x="-60" y="-7.5" width="120" height="7.5" fill="url(#cunder)"/>
  <ellipse cx="-46" cy="-.5" rx="14" ry="2.2" fill="#000" opacity=".75" filter="url(#cb1)"/><ellipse cx="46" cy="-.5" rx="14" ry="2.2" fill="#000" opacity=".75" filter="url(#cb1)"/>
  <path d="M 61.87 -7 A 18 18 0 1 0 30.13 -7 Z M -30.13 -7 A 18 18 0 1 0 -61.87 -7 Z" fill="#05070b"/>
  ${wheel(-46)}${wheel(46)}
  <path d="${BODY}" fill="url(#cp-${k})"/>
  <g clip-path="url(#cb-${k})">
    <path d="M 80 -22.8 C 60 -27 30 -29.4 0 -30 C -30 -30.6 -60 -31.2 -80 -30.6 L -80 0 L 80 0 Z" fill="#000" opacity=".2"/>
    <path d="M 78 -24 C 60 -28.2 30 -30.6 0 -31.2 C -30 -31.8 -60 -32.4 -80 -31.8" fill="none" stroke="#eef7ff" stroke-width="1.2" opacity=".85"/>
    <path d="M 70 -32 C 65 -35.4 58 -37.6 50 -38.6 C 42 -39.6 34 -39.6 25 -40 M 6 -52.6 C 1 -55 -7 -56 -17 -55 C -33 -53.5 -47 -46.5 -58 -42 C -61.5 -42.6 -66 -43.2 -71.5 -43.6" fill="none" stroke="#fff" stroke-width="4.6"/>
    <ellipse cx="54" cy="-35" rx="12" ry="1.8" fill="#fff" opacity=".4" filter="url(#cb1)"/><ellipse cx="-50" cy="-42" rx="9" ry="1.5" fill="#fff" opacity=".35" filter="url(#cb1)"/>
    <path d="M -80 -9.5 L 80 -9.5" stroke="#000" stroke-opacity=".25" stroke-width="2"/>
  </g>
  <path d="${ARCHES}" fill="none" stroke="${c[4]}" stroke-width="1.8"/>
  <path d="M 29.6 -7 L -29.6 -7 L -28.8 -10.4 L 28.8 -10.4 Z" fill="#10151d"/>
  <path d="M 22.5 -40.4 C 24 -30 24 -19 22 -10.4 M -13.2 -41.8 C -15 -32 -15.6 -20 -15.2 -10.4" fill="none" stroke="#06143a" stroke-width=".9" opacity=".6"/>
  <rect x="-9" y="-37" width="8" height="2.2" rx="1.1" fill="${c[4]}"/><rect x="-8.5" y="-37.1" width="7" height=".7" rx=".35" fill="#fff" opacity=".75"/>
  <path d="M -17 -30 C -21.5 -30.2 -26 -29 -29 -26.4 C -27.6 -23 -23 -21.4 -18 -21.2 Z" fill="#0a1120"/><path d="M -17 -30 C -21.5 -30.2 -26 -29 -29 -26.4" fill="none" stroke="${c[1]}" stroke-width=".7"/>
  <path d="${GLASS}" fill="url(#cglass)"/>
  <g clip-path="url(#cgl)"><path d="M 3 -56 L 11 -56 L -4 -38 L -12 -38 Z" fill="#fff" opacity=".22"/><path d="M 14 -56 L 17 -56 L 3 -38 L 0 -38 Z" fill="#fff" opacity=".14"/><path d="M -29 -56 L -25 -56 L -37 -38 L -41 -38 Z" fill="#fff" opacity=".1"/></g>
  <path d="M -11 -52.8 L -14.5 -41.9" stroke="#151a22" stroke-width="3.2"/>
  <path d="${GLASS}" fill="none" stroke="#0b0f15" stroke-width="1.5"/>
  <path d="M 19.5 -41.3 L -46 -42.4" stroke="#e9eef3" stroke-width="1.1"/>
  <path d="M 16.5 -42 C 16.5 -46 22 -47.6 25.6 -45.6 C 26.8 -44.9 26.6 -42.8 25 -42.1 Z" fill="url(#cp-${k})" stroke="${c[4]}" stroke-width=".6"/>
  <path d="${HEAD}" fill="#cfeaff" opacity=".9" filter="url(#cglow)"/><path d="${HEAD}" fill="#f2f9ff" stroke="#0b1424" stroke-width=".5"/>
  <path d="M 63.5 -32.2 C 68 -31 72 -28.6 74.8 -25.6" fill="none" stroke="#7fc6ff" stroke-width=".8"/>
  <rect x="63" y="-24" width="3.6" height="1.5" rx=".75" fill="#ffae2b"/>
  <path d="M 68.5 -16 L 77.2 -16 C 77.1 -12.6 76.2 -9.6 73.5 -8.2 L 66.5 -8.2 Z" fill="#0a0d13"/>
  <path d="M 68.8 -13.6 L 76.9 -13.6 M 67.8 -11 L 76.2 -11" stroke="#2c3442" stroke-width=".55"/>
  <path d="M 52 -7 L 75 -7 L 78.6 -5.2 L 52 -5.6 Z" fill="#0b0e13"/>
  <path d="${TAIL}" fill="#ff3a2e" opacity=".85" filter="url(#cglow)"/><path d="${TAIL}" fill="#e8141c" stroke="#3a0508" stroke-width=".5"/>
  <path d="M -74.3 -33.4 C -73.9 -36.2 -73.1 -38.4 -71.6 -39.8" fill="none" stroke="#ffd0c8" stroke-width=".8"/>
  <rect x="-75.2" y="-22" width="3" height="1.5" rx=".6" fill="#b3131b"/>
  <path d="M -75.6 -12.6 C -75 -9.4 -73.2 -7.4 -69.5 -7 L -63 -7 L -64.4 -11.6 Z" fill="#0a0d13"/>
  <ellipse cx="-71" cy="-9.6" rx="2.5" ry="1.8" fill="#a3abb5" stroke="#e7ebef" stroke-width=".5"/><ellipse cx="-71" cy="-9.6" rx="1.5" ry="1.1" fill="#15181d"/>`;
}

// ---------- 2 · Svet as before (a flat ring road round the globe), with the new car ----------
function icon2(k, { th = 112, s = 1, dy = 9, car = true, fit = 1, full = false } = {}) {
  const CX = 256, CY = 248, R = 142, f0 = 30 * Math.PI / 180, l0 = 14 * Math.PI / 180, RX = 226, RY = 64;
  const geo = ([la, lo]) => { const f = la * Math.PI / 180, l = lo * Math.PI / 180 - l0; return { x: Math.cos(f) * Math.sin(l), y: Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l), c: Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l) }; };
  const proj = (p) => { let { x, y, c } = geo(p); if (c < 0) { const m = Math.hypot(x, y) || 1; x /= m; y /= m; } return [CX + R * x, CY - R * y]; };
  const smooth = (pts) => { const m = pts.length; let d = `M ${n(pts[0][0])} ${n(pts[0][1])}`; for (let i = 0; i < m; i++) { const a = pts[(i - 1 + m) % m], b = pts[i], c = pts[(i + 1) % m], e = pts[(i + 2) % m]; d += ` C ${n(b[0] + (c[0] - a[0]) / 6)} ${n(b[1] + (c[1] - a[1]) / 6)} ${n(c[0] - (e[0] - b[0]) / 6)} ${n(c[1] - (e[1] - b[1]) / 6)} ${n(c[0])} ${n(c[1])}`; } return d + ' Z'; };
  const land = [AFRICA, EURASIA, ...ISLANDS].map((c) => smooth(c.map(proj))).join(' '), seas = SEAS.map((c) => smooth(c.map(proj))).join(' ');
  const vis = (pts) => { let d = '', on = false; for (const p of pts) { const g = geo(p); if (g.c < 0.02) { on = false; continue; } d += `${on ? 'L' : 'M'} ${n(CX + R * g.x)} ${n(CY - R * g.y)} `; on = true; } return d; };
  let grat = '';
  for (let lo = -150; lo <= 180; lo += 30) grat += vis(Array.from({ length: 61 }, (_, i) => [-90 + i * 3, lo]));
  for (const la of [-60, -30, 0, 30, 60]) grat += vis(Array.from({ length: 121 }, (_, i) => [la, -180 + i * 3]));
  const kerb = (a0, a1) => { const pts = arc(0, 0, RX + 28, RY + 28, a0, a1, 20); return `<path d="${P(pts)}" fill="none" stroke="#fff" stroke-width="9"/><path d="${P(pts)}" fill="none" stroke="#e0262b" stroke-width="9" stroke-dasharray="9 9"/>`; };
  const ring = `<ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#1f232a" stroke-width="56"/><ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#4a4f58" stroke-width="48"/>
    ${full ? [28, -28].map((d) => `<ellipse rx="${RX + d}" ry="${RY + d}" fill="none" stroke="#fff" stroke-width="9"/><ellipse rx="${RX + d}" ry="${RY + d}" fill="none" stroke="#e0262b" stroke-width="9" stroke-dasharray="9 9"/>`).join('') : `<ellipse rx="${RX + 20}" ry="${RY + 20}" fill="none" stroke="#f3f3f3" stroke-width="3.5"/><ellipse rx="${RX - 20}" ry="${RY - 20}" fill="none" stroke="#f3f3f3" stroke-width="3.5"/>`}
    <ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#ffd447" stroke-width="3.5" stroke-dasharray="15 13"/>${full ? '' : kerb(158, 202) + kerb(-22, 22)}`;
  const t = th * Math.PI / 180, px = RX * Math.cos(t), py = RY * Math.sin(t), ang = Math.atan2(-RY * Math.cos(t), RX * Math.sin(t)) * 180 / Math.PI;
  let stars = '', z = 7;
  for (let i = 0; i < 22; i++) { z = (z * 9301 + 49297) % 233280; const x = z / 233280 * 512; z = (z * 9301 + 49297) % 233280; const y = z / 233280 * 512; if (Math.hypot(x - CX, y - CY) > R + 20) stars += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.8 + (i % 3) * 0.5)}" fill="#fff" opacity="${(0.35 + (i % 4) * 0.15).toFixed(2)}"/>`; }
  return wrap(`${SHARED}${carDefs(k)}
    <radialGradient id="space" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#21549f"/><stop offset="1" stop-color="#0a1534"/></radialGradient>
    <radialGradient id="ocean" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#63b8f6"/><stop offset=".6" stop-color="#2a74c9"/><stop offset="1" stop-color="#163d84"/></radialGradient>
    <radialGradient id="shade" cx=".32" cy=".26" r=".95"><stop offset=".42" stop-color="#001233" stop-opacity="0"/><stop offset="1" stop-color="#001233" stop-opacity=".55"/></radialGradient>
    <clipPath id="globe"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
    <clipPath id="front"><rect x="-400" y="0" width="800" height="400" transform="translate(256 268) rotate(-14)"/></clipPath>`, `
    <rect width="512" height="512" fill="url(#space)"/>${stars}<g transform="translate(256 256) scale(${fit}) translate(-256 -256)">
    <g transform="translate(256 268) rotate(-14)">${ring}<ellipse rx="${RX}" ry="${RY}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="56"/></g>
    <circle cx="${CX}" cy="${CY}" r="${R + 10}" fill="#7fd0ff" opacity=".35" filter="url(#blur9)"/>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#ocean)"/>
    <g clip-path="url(#globe)"><path d="${land}" fill="#62bf5c"/><path d="${seas}" fill="#3a86d4"/><path d="${grat}" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.2"/>
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#shade)"/><ellipse cx="206" cy="182" rx="52" ry="30" fill="#fff" opacity=".16" filter="url(#blur9)"/></g>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#a9e1ff" stroke-opacity=".6" stroke-width="3"/>
    <g clip-path="url(#front)"><g transform="translate(256 268) rotate(-14)">${ring}</g></g>
    ${car ? `<g transform="translate(256 268) rotate(-14) translate(${n(px)} ${n(py + dy)}) rotate(${n(ang)}) scale(${s})">${carSide2(k)}</g>` : ''}</g>`);
}
const closeUp = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-92 -68 184 76" width="1040" height="430"><defs>${SHARED}${carDefs('b')}
  <linearGradient id="studio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3f63"/><stop offset=".78" stop-color="#18233a"/><stop offset="1" stop-color="#0d1322"/></linearGradient></defs>
  <rect x="-92" y="-68" width="184" height="76" fill="url(#studio)"/><rect x="-92" y="0" width="184" height="8" fill="#0d1322"/>${carSide2('b')}</svg>`;

module.exports = { icon2, carSide2 };
if (require.main === module) (async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
  const out = [['2a.png', icon2('b')], ['2b.png', icon2('b', { th: 104, s: 1.3, dy: 12 })], ['2c.png', icon2('r', { th: 104, s: 1.3, dy: 12 })]];
  for (const [f, svg] of out) { await page.setContent(`<html><body style="margin:0">${svg}</body></html>`); await page.screenshot({ path: path.join(DIR, f), clip: { x: 0, y: 0, width: 512, height: 512 } }); }
  const cu = await browser.newPage({ viewport: { width: 1040, height: 430 } });
  await cu.setContent(`<html><body style="margin:0">${closeUp()}</body></html>`);
  await cu.screenshot({ path: path.join(DIR, 'avto.png'), clip: { x: 0, y: 0, width: 1040, height: 430 } });
  const img = (f) => `data:image/png;base64,${fs.readFileSync(path.join(DIR, f)).toString('base64')}`;
  const cells = [['Prej · 2', '2.png'], ['2A · Nov avto', '2a.png'], ['2B · Večji avto', '2b.png'], ['2C · Rdeč avto', '2c.png']];
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;width:1080px;background:linear-gradient(#777c9e,#5d6283);font-family:'DejaVu Sans',Arial,sans-serif;color:#fff}
    h1{font-size:40px;margin:30px 36px 6px}p{margin:0 36px 16px;font-size:25px;opacity:.85}
    .g{display:grid;grid-template-columns:repeat(4,1fr);padding:8px 10px 18px}.c{text-align:center}
    .t{font-size:25px;font-weight:700;margin-bottom:10px}.c img{width:236px;height:236px;border-radius:27%;display:block;margin:0 auto;box-shadow:0 6px 16px rgba(0,0,0,.28)}
    .l{font-size:25px;margin-top:10px}.cu{margin:6px 20px 0;border-radius:18px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,.28)}.cu img{display:block;width:1040px}
    .cap{margin:10px 36px 0;font-size:24px;opacity:.85}
    .s{display:flex;justify-content:space-around;align-items:flex-end;padding:20px 26px 34px;margin-top:18px;border-top:2px solid rgba(255,255,255,.25)}
    .s div{text-align:center;font-size:23px}.s img{width:64px;height:64px;border-radius:27%;display:block;margin:0 auto 6px}</style>
    <h1>2 · Svet z novim avtom</h1><p>Cesta ostane ravna kot prej, zamenjan je samo avto.</p>
    <div class="g">${cells.map(([t, f]) => `<div class="c"><div class="t">${t}</div><img src="${img(f)}"><div class="l">Roads Atlas</div></div>`).join('')}</div>
    <div class="cu"><img src="${img('avto.png')}"></div><div class="cap">Nov avto od blizu: izmišljen kupe, brez znamke in napisov.</div>
    <div class="s">${cells.map(([t, f]) => `<div><img src="${img(f)}">${t.split(' · ')[0]}</div>`).join('')}</div>`;
  const p = await browser.newPage({ viewport: { width: 1080, height: 900 } });
  await p.setContent(html);
  await p.screenshot({ path: path.join(DIR, 'pregled-svet-avto.jpg'), fullPage: true, type: 'jpeg', quality: 86 });
  await browser.close();
  console.log('ok', fs.statSync(path.join(DIR, 'pregled-svet-avto.jpg')).size);
})();
