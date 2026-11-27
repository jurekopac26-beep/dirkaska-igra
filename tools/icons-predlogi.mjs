// Three proposals for a new app icon (decision O-27-20): each is an SVG of the whole 512 square without text, logos or
// car makes, the car in a light colour, everything that matters inside the middle 80 % circle (Android's safe zone,
// radius 205 around the centre). tools/icons.mjs draws icons/ from the chosen one; this file only makes the previews:
//   node tools/icons-predlogi.mjs [out-dir]     -> <n>-512.png, <n>-48.png and <n>-pregled.jpg (512 + circle crop + 48 px)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

// the car from above (as in the game), nose up, centred on 0 0, w × h; paint is a light colour
function carTop(w, h, paint, dark) {
  const r = w * 0.34, tw = w * 0.16, th = h * 0.17;
  return `<g fill="#23262b"><rect x="${-w / 2 - tw * 0.35}" y="${-h * 0.34}" width="${tw}" height="${th}" rx="${tw * 0.35}"/><rect x="${w / 2 - tw * 0.65}" y="${-h * 0.34}" width="${tw}" height="${th}" rx="${tw * 0.35}"/><rect x="${-w / 2 - tw * 0.35}" y="${h * 0.17}" width="${tw}" height="${th}" rx="${tw * 0.35}"/><rect x="${w / 2 - tw * 0.65}" y="${h * 0.17}" width="${tw}" height="${th}" rx="${tw * 0.35}"/></g>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${r}" fill="${paint}"/>
    <path d="M ${-w * 0.36} ${-h * 0.25} L ${w * 0.36} ${-h * 0.25} L ${w * 0.43} ${-h * 0.08} L ${-w * 0.43} ${-h * 0.08} Z" fill="${dark}"/>
    <path d="M ${-w * 0.41} ${h * 0.18} L ${w * 0.41} ${h * 0.18} L ${w * 0.35} ${h * 0.28} L ${-w * 0.35} ${h * 0.28} Z" fill="${dark}"/>
    <g fill="#fff6c8"><rect x="${-w * 0.4}" y="${-h * 0.49}" width="${w * 0.17}" height="${h * 0.04}" rx="2"/><rect x="${w * 0.23}" y="${-h * 0.49}" width="${w * 0.17}" height="${h * 0.04}" rx="2"/></g>`;
}

// 1 · Serpentina: a mountain road climbing in hairpins up a green slope under a snowy peak at sunset, the orange car on
// the lowest leg. At 48 px it reads as the white zigzag on green with the peak.
function serpentina() {
  const legs = [[[336, 432], [166, 372]], [[166, 372], [332, 308]], [[332, 308], [200, 250]], [[200, 250], [292, 198]]];
  const width = [64, 52, 42, 32];
  const road = (k) => legs.map(([[x0, y0], [x1, y1]], i) => `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke-width="${width[i] + k}"/>`).join('');
  const dash = legs.map(([[x0, y0], [x1, y1]], i) => `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke-width="${Math.max(3, width[i] * 0.08)}" stroke-dasharray="${width[i] * 0.3} ${width[i] * 0.3}"/>`).join('');
  const ang = Math.atan2(372 - 432, 166 - 336) * 180 / Math.PI + 90;
  return `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb35c"/><stop offset=".55" stop-color="#ffd9a0"/><stop offset="1" stop-color="#fff1d6"/></linearGradient>
    <linearGradient id="far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a8fb8"/><stop offset="1" stop-color="#a7a9c6"/></linearGradient>
    <linearGradient id="slope" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fae46"/><stop offset="1" stop-color="#2f7330"/></linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#sky)"/>
  <circle cx="380" cy="120" r="34" fill="#fff4d8" opacity=".9"/>
  <path d="M -10 250 L 70 170 L 130 215 L 256 64 L 360 168 L 420 130 L 522 230 L 522 512 L -10 512 Z" fill="url(#far)"/>
  <path d="M 256 64 L 300 117 L 278 112 L 262 128 L 244 110 L 222 120 L 212 117 Z" fill="#fff"/>
  <path d="M -10 300 C 90 230 170 205 256 190 C 340 205 420 230 522 300 L 522 512 L -10 512 Z" fill="url(#slope)"/>
  <g stroke-linecap="round" fill="none">
    <g stroke="#fff">${road(10)}</g>
    <g stroke="#555c66">${road(0)}</g>
    <g stroke="#ffd34d">${dash}</g>
  </g>
  <g transform="translate(262 406) rotate(${ang.toFixed(1)})">${carTop(40, 68, '#ff7a1a', '#5b3a24')}</g>`;
}

// 2 · Atlas: the globe with the road wrapping over it like a ribbon and the red car on it — a world of real roads.
// At 48 px it reads as the blue ball with the grey band and the red dot.
function atlas() {
  const ribbon = 'M 96 322 C 160 256 230 370 296 292 C 350 226 384 212 424 196';
  return `<defs>
    <radialGradient id="bg" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#2f7bb5"/><stop offset="1" stop-color="#173e66"/></radialGradient>
    <radialGradient id="sea" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#6cc6f0"/><stop offset=".6" stop-color="#2d8fd0"/><stop offset="1" stop-color="#1b5f9a"/></radialGradient>
    <clipPath id="ball"><circle cx="256" cy="256" r="178"/></clipPath>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="186" fill="#0d2a47" opacity=".35"/>
  <circle cx="256" cy="256" r="178" fill="url(#sea)"/>
  <g clip-path="url(#ball)">
    <path d="M 110 150 C 150 110 220 100 250 130 C 280 160 240 200 200 210 C 160 220 120 240 100 210 Z" fill="#7cc35a"/>
    <path d="M 280 180 C 330 150 410 170 420 230 C 430 290 380 330 340 360 C 310 380 290 340 300 300 C 310 260 260 220 280 180 Z" fill="#7cc35a"/>
    <path d="M 150 300 C 190 290 230 320 220 370 C 210 420 160 430 140 400 C 120 370 120 320 150 300 Z" fill="#9bd06c"/>
    <g fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="3">
      <ellipse cx="256" cy="256" rx="178" ry="60"/><ellipse cx="256" cy="256" rx="178" ry="130"/><line x1="78" y1="256" x2="434" y2="256"/>
      <ellipse cx="256" cy="256" rx="70" ry="178"/><ellipse cx="256" cy="256" rx="140" ry="178"/><line x1="256" y1="78" x2="256" y2="434"/>
    </g>
  </g>
  <circle cx="200" cy="190" r="120" fill="#fff" opacity=".08"/>
  <g fill="none" stroke-linecap="round">
    <path d="${ribbon}" stroke="#0d2a47" stroke-opacity=".35" stroke-width="66" transform="translate(4 10)"/>
    <path d="${ribbon}" stroke="#fff" stroke-width="62"/>
    <path d="${ribbon}" stroke="#565d67" stroke-width="50"/>
    <path d="${ribbon}" stroke="#fff" stroke-width="4" stroke-dasharray="16 14"/>
  </g>
  <g transform="translate(296 292) rotate(50)">${carTop(38, 64, '#ff3b30', '#5a1d1a')}</g>`;
}

// 3 · Za avtom: the game's own view — behind the yellow car on a road that bends right to the mountains at dusk.
// At 48 px it reads as the yellow car on the grey road with the white edge lines.
function zaAvtom() {
  return `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c78c8"/><stop offset=".7" stop-color="#9cc7ee"/><stop offset="1" stop-color="#ffd8a8"/></linearGradient>
    <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a9c3f"/><stop offset="1" stop-color="#2f6a2a"/></linearGradient>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a808a"/><stop offset="1" stop-color="#4a5058"/></linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8a400"/><stop offset=".5" stop-color="#ffd21f"/><stop offset="1" stop-color="#e0a000"/></linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <rect width="512" height="512" fill="url(#sky)"/>
  <path d="M -10 235 L 60 175 L 120 205 L 190 135 L 270 200 L 330 160 L 400 205 L 460 170 L 522 215 L 522 260 L -10 260 Z" fill="#6f7fa6"/>
  <path d="M 190 135 L 214 156 L 200 154 L 190 166 L 178 152 L 168 156 Z" fill="#fff"/>
  <rect y="240" width="512" height="272" fill="url(#grass)"/>
  <path d="M -40 512 C 120 380 280 300 356 240 L 372 240 C 350 330 430 420 552 512 Z" fill="url(#road)"/>
  <path d="M -40 512 C 120 380 280 300 356 240" fill="none" stroke="#fff" stroke-width="9"/>
  <path d="M 552 512 C 430 420 350 330 372 240" fill="none" stroke="#fff" stroke-width="9"/>
  <path d="M 256 512 C 276 420 320 320 364 240" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="26 22" opacity=".9"/>
  <g transform="translate(256 352)">
    <ellipse cx="0" cy="62" rx="106" ry="20" fill="#000" opacity=".45" filter="url(#soft)"/>
    <rect x="-98" y="20" width="34" height="46" rx="9" fill="#23262b"/><rect x="64" y="20" width="34" height="46" rx="9" fill="#23262b"/>
    <path d="M -100 -4 C -100 -30 -86 -40 -66 -44 L -52 -80 C -48 -90 -40 -94 -30 -94 L 30 -94 C 40 -94 48 -90 52 -80 L 66 -44 C 86 -40 100 -30 100 -4 L 100 36 C 100 48 92 54 80 54 L -80 54 C -92 54 -100 48 -100 36 Z" fill="url(#body)"/>
    <path d="M -46 -80 C -44 -86 -38 -88 -32 -88 L 32 -88 C 38 -88 44 -86 46 -80 L 56 -48 L -56 -48 Z" fill="#3f5873"/>
    <path d="M -40 -80 L -14 -80 L -26 -54 L -48 -54 Z" fill="#fff" opacity=".22"/>
    <rect x="-90" y="-26" width="44" height="16" rx="5" fill="#ff3b2f"/><rect x="46" y="-26" width="44" height="16" rx="5" fill="#ff3b2f"/>
    <rect x="-30" y="0" width="60" height="18" rx="3" fill="#f4f4f4"/>
    <rect x="-84" y="34" width="168" height="10" rx="5" fill="#c58a00"/>
  </g>`;
}

export const PREDLOGI = [
  { n: 1, ime: 'Serpentina', body: serpentina },
  { n: 2, ime: 'Atlas', body: atlas },
  { n: 3, ime: 'Za avtom', body: zaAvtom },
];

// rounded: corners cut round (a plain icon); otherwise the picture fills the square (Android crops it, iOS rounds it)
export function svgOf(p, size, rounded) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <clipPath id="clip"><rect width="512" height="512" rx="${rounded ? 112 : 0}"/></clipPath>
  <g clip-path="url(#clip)">${p.body()}</g></svg>`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  const { chromium } = await import('../tests/lib/playwright.mjs');
  const out = path.resolve(process.argv[2] || 'predlogi-ikone');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const shot = async (html, w, h, file, type = 'png') => {
      await page.setViewportSize({ width: w, height: h });
      await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${html}</body></html>`);
      await page.screenshot({ path: path.join(out, file), omitBackground: type === 'png', type, quality: type === 'jpeg' ? 88 : undefined, clip: { x: 0, y: 0, width: w, height: h } });
    };
    for (const p of PREDLOGI) {
      await shot(svgOf(p, 512, true), 512, 512, `${p.n}-512.png`);
      await shot(svgOf(p, 48, true), 48, 48, `${p.n}-48.png`);
      const b48 = fs.readFileSync(path.join(out, `${p.n}-48.png`)).toString('base64');
      // preview: the 512 icon, the Android circle crop with the safe-zone ring, and the 48 px one at real size and ×3
      const cell = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px';
      await shot(`<div style="width:900px;height:560px;background:#eef0f3;display:flex;align-items:center;gap:28px;padding:0 24px;box-sizing:border-box;font:600 22px system-ui">
        <div>${svgOf(p, 512, true)}</div>
        <div style="${cell}">
          <div style="position:relative;width:200px;height:200px;border-radius:50%;overflow:hidden">${svgOf(p, 200, false)}<div style="position:absolute;inset:20px;border:2px dashed #fff;border-radius:50%;opacity:.0"></div></div>
          <div style="display:flex;align-items:center;gap:18px"><img src="data:image/png;base64,${b48}" width="48" height="48"><img src="data:image/png;base64,${b48}" width="144" height="144" style="image-rendering:pixelated"></div>
          <div style="color:#444">${p.n}</div>
        </div></div>`, 900, 560, `${p.n}-pregled.jpg`, 'jpeg');
      console.log(`written ${out}/${p.n}-512.png, ${p.n}-48.png, ${p.n}-pregled.jpg`);
    }
  } finally {
    await browser.close();
  }
}
