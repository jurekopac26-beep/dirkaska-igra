// Draws the app icons in icons/ (home screen, app list, browser tab) from the picture below: a bend of the track with
// the kerb at its apex and the blue car from above, as in the game. Rendered with the browser the tests use (Playwright).
//   node tools/icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { chromium } from 'playwright';

const DIR = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'icons');

// rounded: the corners are cut round (a plain icon); otherwise the picture fills the square (Android crops it to its own
// shape, iOS rounds it itself). Everything that matters stays inside the middle 80 % circle (Android's safe zone).
function svg(size, rounded) {
  // the bend: a quarter circle around (452, 470), the road's centre line at radius 280, 150 wide
  const arc = (r) => `M ${452 - r} 620 L ${452 - r} 470 A ${r} ${r} 0 0 1 452 ${470 - r} L 640 ${470 - r}`;
  const at = (r, deg) => { const a = deg * Math.PI / 180; return [(452 + r * Math.cos(a)).toFixed(2), (470 + r * Math.sin(a)).toFixed(2)]; };
  const [k0x, k0y] = at(197, 192), [k1x, k1y] = at(197, 258);
  const stripes = Array.from({ length: 9 }, (_, i) => `<rect x="${-90 + i * 26}" y="-400" width="13" height="1200" fill="#fff" opacity=".035"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <radialGradient id="grass" cx="0.36" cy="0.32" r="0.85"><stop offset="0" stop-color="#63a84a"/><stop offset="1" stop-color="#2c6329"/></radialGradient>
    <linearGradient id="road" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a616b"/><stop offset="1" stop-color="#40454d"/></linearGradient>
    <linearGradient id="paint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1450c2"/><stop offset=".45" stop-color="#2f86ff"/><stop offset="1" stop-color="#1348b0"/></linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
    <clipPath id="clip"><rect width="512" height="512" rx="${rounded ? 112 : 0}"/></clipPath>
  </defs>
  <g clip-path="url(#clip)">
    <rect width="512" height="512" fill="url(#grass)"/>
    <g transform="rotate(-35 256 256)">${stripes}</g>
    <path d="${arc(280)}" fill="none" stroke="#c9b27a" stroke-width="176"/>
    <path d="${arc(280)}" fill="none" stroke="url(#road)" stroke-width="150"/>
    <path d="${arc(212)}" fill="none" stroke="#fff" stroke-width="7"/>
    <path d="${arc(348)}" fill="none" stroke="#fff" stroke-width="7"/>
    <path d="M ${k0x} ${k0y} A 197 197 0 0 1 ${k1x} ${k1y}" fill="none" stroke="#f4f4f4" stroke-width="26"/>
    <path d="M ${k0x} ${k0y} A 197 197 0 0 1 ${k1x} ${k1y}" fill="none" stroke="#e0262b" stroke-width="26" stroke-dasharray="15 15"/>
    <g stroke="#fff" stroke-linecap="round" opacity=".45">
      <line x1="140" y1="452" x2="196" y2="396" stroke-width="6"/><line x1="176" y1="480" x2="220" y2="436" stroke-width="5"/><line x1="112" y1="420" x2="150" y2="382" stroke-width="4"/>
    </g>
    <g transform="translate(282 294) rotate(45)">
      <ellipse cx="8" cy="10" rx="54" ry="98" fill="#000" opacity=".4" filter="url(#soft)"/>
      <g fill="#15171b"><rect x="-51" y="-62" width="14" height="30" rx="5"/><rect x="37" y="-62" width="14" height="30" rx="5"/><rect x="-51" y="32" width="14" height="30" rx="5"/><rect x="37" y="32" width="14" height="30" rx="5"/></g>
      <rect x="-45" y="-90" width="90" height="180" rx="31" fill="url(#paint)"/>
      <rect x="-52" y="-18" width="9" height="12" rx="3" fill="#1d5fd6"/><rect x="43" y="-18" width="9" height="12" rx="3" fill="#1d5fd6"/>
      <rect x="-11" y="-90" width="7" height="180" fill="#fff" opacity=".92"/><rect x="4" y="-90" width="7" height="180" fill="#fff" opacity=".92"/>
      <path d="M -32 -44 L 32 -44 L 39 -14 L -39 -14 Z" fill="#0c1626"/>
      <path d="M -26 -40 L -8 -40 L -16 -18 L -32 -18 Z" fill="#fff" opacity=".18"/>
      <path d="M -37 32 L 37 32 L 31 50 L -31 50 Z" fill="#0c1626"/>
      <g fill="#fff6c8"><rect x="-35" y="-88" width="15" height="7" rx="3"/><rect x="20" y="-88" width="15" height="7" rx="3"/></g>
      <g fill="#ff3b2f"><rect x="-37" y="81" width="15" height="6" rx="2"/><rect x="22" y="81" width="15" height="6" rx="2"/></g>
    </g>
  </g>
</svg>`;
}

const OUT = [
  { file: 'icon-192.png', size: 192, rounded: true },
  { file: 'icon-512.png', size: 512, rounded: true },
  { file: 'icon-maskable-512.png', size: 512, rounded: false },
  { file: 'apple-touch-icon.png', size: 180, rounded: false },
];

fs.mkdirSync(DIR, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const o of OUT) {
    await page.setViewportSize({ width: o.size, height: o.size });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg(o.size, o.rounded)}</body></html>`);
    await page.screenshot({ path: path.join(DIR, o.file), omitBackground: true, clip: { x: 0, y: 0, width: o.size, height: o.size } });
    console.log('written icons/' + o.file);
  }
} finally {
  await browser.close();
}
