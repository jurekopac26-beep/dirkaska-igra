// Serpentina: 5 novih različic (S6–S10), brez avta.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { n, P, bez, arc, normals, off, wrap } = require('./ikone.cjs');
const { GEO, GEO2, TOP, pieces, road, barriers, tree, TREES, MTN, SNOW, SLOPE, vgrad, CLOUDS } = require('./ikone2.cjs');
const DIR = __dirname;
const rnd = (z) => () => { z = (z * 9301 + 49297) % 233280; return z / 233280; };
const OUT = [];
const CLF = '<filter id="cl" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="5"/></filter>';
// road with red and white kerbs along both edges for its whole length (user's wish 11. 11.); far pieces first
function roadK(g, st) {
  let s = '';
  for (const pts of pieces(g).reverse()) {
    const nr = normals(pts), w = (i) => g.W(pts[i][1]), avg = pts.reduce((a, p) => a + g.W(p[1]), 0) / pts.length;
    const kw = avg * (st.kw || 0.13), o = st.inside ? -kw / 2 : kw / 2;
    const poly = `${P([...off(pts, nr, (i) => w(i) / 2), ...off(pts, nr, (i) => -w(i) / 2).reverse()])} Z`;
    if (st.under) s += st.under(poly, avg);
    s += `<path d="${poly}" fill="${st.asph}"/>`;
    const sides = [1, -1].map((k) => `<path d="${P(off(pts, nr, (i) => k * (w(i) / 2 + o)))}"/>`).join('');
    s += `<g fill="none" stroke-width="${n(kw)}" stroke-linejoin="round"><g stroke="${st.kWhite || '#f4f4f4'}">${sides}</g><g stroke="${st.kRed || '#e0262b'}" stroke-dasharray="${n(kw * 1.5)} ${n(kw * 1.5)}">${sides}</g></g>`;
    if (st.center && avg > 16) s += `<path d="${P(pts)}" fill="none" stroke="${st.center}" stroke-width="${n(avg * 0.05)}" stroke-dasharray="${n(avg * 0.3)} ${n(avg * 0.32)}"/>`;
  }
  return s;
}

// S6 · Noč: long-exposure light trails along the pass, red going up, warm white coming down
{
  const r = rnd(11); let stars = '';
  for (let i = 0; i < 50; i++) { const x = r() * 512, y = r() * 160, s = 0.5 + r() * 1.4; stars += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(s)}" fill="#fff" opacity="${n(0.3 + r() * 0.6)}"/>`; }
  let trails = '';
  for (const pts of pieces(GEO).reverse()) {
    const nr = normals(pts), avg = pts.reduce((a, p) => a + GEO.W(p[1]), 0) / pts.length;
    for (const [k, glow, core] of [[0.22, '#ff2b2b', '#ffb4a4'], [-0.22, '#ffcf6a', '#fffbe8']]) {
      const d = P(off(pts, nr, (i) => k * GEO.W(pts[i][1])));
      trails += `<path d="${d}" fill="none" stroke="${glow}" stroke-width="${n(avg * 0.2)}" stroke-linecap="round" opacity=".75" filter="url(#tr)"/><path d="${d}" fill="none" stroke="${core}" stroke-width="${n(Math.max(1.4, avg * 0.055))}" stroke-linecap="round"/>`;
    }
  }
  OUT.push(['s6.png', 'S6 · Noč', wrap(`${vgrad('sky', 0, 200, [[0, '#050818'], [0.6, '#131b44'], [1, '#2a3770']])}${vgrad('sl', 124, 512, [[0, '#141c34'], [1, '#05070e']])}${vgrad('as', 124, 512, [[0, '#2a2f3a'], [1, '#101217']])}
    <filter id="tr" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5"/></filter><filter id="mg" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="10"/></filter>
    <mask id="moon"><rect width="512" height="512" fill="#000"/><circle cx="412" cy="74" r="25" fill="#fff"/><circle cx="423" cy="66" r="22" fill="#000"/></mask>`,
  `<rect width="512" height="512" fill="url(#sky)"/>${stars}<circle cx="406" cy="76" r="40" fill="#8fa6ff" opacity=".25" filter="url(#mg)"/><rect width="512" height="512" fill="#f4efd2" mask="url(#moon)"/>
    ${MTN('#1a2248', '#141a3a')}<g opacity=".55">${SNOW('#b8c6ee')}</g>${SLOPE('url(#sl)')}${TREES.map((t) => tree(...t, '#0c1224', '#080c18')).join('')}
    ${roadK(GEO, { asph: 'url(#as)', kWhite: '#cfd3dc', kRed: '#b8202a' })}${trails}`)]);
}

// S7 · Stena: seven hairpins stacked up a mountain face, stone walls under the road
{
  const W = (y) => Math.max(9, 13 + (y - 144) * 0.0609);
  const xl = (y) => 120 + (456 - y) * 0.256, xr = (y) => 392 - (456 - y) * 0.256;
  const hs = []; let ry = 34, yb = 490;
  for (let j = 0; j < 7; j++) { const cy = yb - ry; hs.push([j % 2 ? xr(cy) : xl(cy), cy, ry * 1.15, ry]); const top = cy - ry; ry *= 0.86; yb = top - ry * 0.3; }
  const legs = [[[540, 500], [420, 492], [260, 490], [hs[0][0], hs[0][1] + hs[0][3]]]];
  for (let j = 0; j < 6; j++) {
    const a = [hs[j][0], hs[j][1] - hs[j][3]], b = [hs[j + 1][0], hs[j + 1][1] + hs[j + 1][3]];
    legs.push([a, [a[0] + (b[0] - a[0]) * 0.35, a[1]], [a[0] + (b[0] - a[0]) * 0.65, b[1]], b]);
  }
  const t = [hs[6][0], hs[6][1] - hs[6][3]]; legs.push([t, [t[0] + 52, t[1]], [t[0] + 100, t[1] - 14], [352, 104]]);
  const g = { W, hs, legs };
  const walls = legs.slice(1).map((L) => {
    const pts = bez(...L, 24), up = pts.map(([x, y]) => [x, y + W(y) * 0.48]), lo = pts.map(([x, y]) => [x, y + W(y) * 0.86]);
    return `<path d="${P([...up, ...lo.slice().reverse()])} Z" fill="#bcae93"/><path d="${P(lo)}" fill="none" stroke="#6f6250" stroke-width="1.6"/>`;
  }).join('');
  const ribs = ['M 232 38 L 252 120 L 238 210 L 224 120 Z', 'M 436 52 L 454 140 L 446 230 L 430 140 Z', 'M 120 140 L 134 220 L 122 300 L 110 220 Z', 'M 300 90 L 312 150 L 302 200 L 292 150 Z'];
  const trees = [[30, 470, 34], [52, 360, 26], [36, 300, 20], [100, 250, 16], [470, 330, 28], [478, 420, 32], [448, 250, 18]].map((p) => tree(...p, '#235a2a', '#1a4420')).join('');
  OUT.push(['s7.png', 'S7 · Stena', wrap(`${vgrad('sky', 0, 140, [[0, '#2f74d0'], [1, '#bfe3fa']])}${vgrad('rock', 40, 512, [[0, '#d9dfe5'], [0.12, '#a6a69c'], [0.42, '#8e9076'], [0.7, '#6d8a4c'], [1, '#467234']])}${vgrad('as2', 100, 512, [[0, '#6b7079'], [1, '#2f3339']])}${CLF}`,
    `<rect width="512" height="512" fill="url(#sky)"/>${CLOUDS}
    <path d="M -10 260 L 60 190 L 120 140 L 170 92 L 232 38 L 290 78 L 352 104 L 400 74 L 436 52 L 480 96 L 522 128 L 522 522 L -10 522 Z" fill="url(#rock)"/>
    <g fill="#000" opacity=".08">${ribs.map((d) => `<path d="${d}"/>`).join('')}</g>
    <path d="M 232 38 L 262 60 L 252 62 L 244 72 L 236 64 L 222 76 L 214 66 L 200 70 Z M 436 52 L 458 74 L 448 76 L 440 84 L 432 76 L 420 82 L 414 70 Z" fill="#fbfdff"/>
    ${trees}${walls}${roadK(g, { asph: 'url(#as2)', center: '#ffd447' })}`)]);
}

// S8 · Kocka: the pass as an isometric autumn diorama
{
  const k = 0.47, e = 256, f = 86, h = 104, c = 0.866 * k, s = 0.5 * k;
  const iso = ([x, y]) => [e + c * (x - y), f + s * (x + y)];
  const B = iso([512, 0]), C = iso([512, 512]), D = iso([0, 512]);
  const dn = ([x, y], d) => [x, y + d];
  const LAY = [[0, 9, '#86a53e'], [9, 40, '#a8743f'], [40, 74, '#8b5a34'], [74, h, '#6b452c']];
  const bands = (p, q) => LAY.map(([d0, d1, col]) => `<path d="${P([dn(p, d0), dn(q, d0), dn(q, d1), dn(p, d1)])} Z" fill="${col}"/>`).join('');
  const crossY = (L) => { const pts = bez(...L, 400); for (let i = 1; i < pts.length; i++) if ((pts[i - 1][0] - 512) * (pts[i][0] - 512) <= 0) return pts[i][1]; return null; };
  const cut = (y) => { const p = iso([512, y - 32]), q = iso([512, y + 32]); return `<path d="${P([p, q, dn(q, 7), dn(p, 7)])} Z" fill="#3a3e45"/><path d="${P([dn(p, 7), dn(q, 7), dn(q, 13), dn(p, 13)])} Z" fill="#c2b292"/>`; };
  const cuts = [crossY(TOP.legs[0]), crossY(TOP.legs[TOP.legs.length - 1])].filter((y) => y !== null).map(cut).join('');
  const ring = (H, r, a0, a1) => P(arc(H[0], H[1], r, r, a0, a1, 30));
  const spans = TOP.hs.map((H, j) => (j % 2 === 0 ? [100, 260] : [-80, 80]));
  const kerbs = TOP.hs.map((H, j) => `<path d="${ring(H, 22, ...spans[j])}" fill="none" stroke="#fff" stroke-width="12"/><path d="${ring(H, 22, ...spans[j])}" fill="none" stroke="#e0262b" stroke-width="12" stroke-dasharray="8 8"/>`).join('');
  const rails = TOP.hs.map((H, j) => `<path d="${ring(H, 101, ...spans[j])}" fill="none" stroke="#5a5048" stroke-width="10" stroke-dasharray="3 15"/><path d="${ring(H, 101, ...spans[j])}" fill="none" stroke="#e2ddd6" stroke-width="5"/>`).join('');
  const COLS = [['#f08a2c', '#c9661d'], ['#e04b2b', '#b5381f'], ['#f6c13a', '#d79a22'], ['#c2452d', '#93301d'], ['#f2a33a', '#cc7d22']];
  const spots = [[260, 360, 17], [330, 352, 15], [400, 366, 16], [470, 352, 17], [190, 240, 15], [250, 236, 17], [310, 244, 14], [250, 120, 16], [320, 112, 14], [400, 118, 17], [470, 104, 15], [24, 240, 18], [28, 440, 20], [80, 500, 18], [490, 240, 16], [488, 168, 13]];
  const trees = spots.map(([x, y, r], i) => { const [X, Y] = iso([x, y]); return { X, Y, r: r * 0.85, col: COLS[i % 5] }; }).sort((a, b) => a.Y - b.Y)
    .map(({ X, Y, r, col }) => `<ellipse cx="${n(X + 3)}" cy="${n(Y + 1)}" rx="${n(r * 0.9)}" ry="${n(r * 0.42)}" fill="#000" opacity=".22"/><rect x="${n(X - 1.6)}" y="${n(Y - r * 0.9)}" width="3.2" height="${n(r * 0.9)}" fill="#5b3b22"/><circle cx="${n(X)}" cy="${n(Y - r * 1.25)}" r="${n(r * 0.78)}" fill="${col[0]}"/><path d="M ${n(X)} ${n(Y - r * 2.03)} A ${n(r * 0.78)} ${n(r * 0.78)} 0 0 1 ${n(X)} ${n(Y - r * 0.47)} Z" fill="${col[1]}"/>`).join('');
  const r = rnd(5); let leaves = '';
  for (let i = 0; i < 9; i++) { const x = 40 + r() * 432, y = 30 + r() * 440; if (y > 60 && y < 440 && x > 60 && x < 452) continue; leaves += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="5" ry="2.6" fill="${COLS[i % 5][0]}" transform="rotate(${n(r() * 180)} ${n(x)} ${n(y)})"/>`; }
  OUT.push(['s8.png', 'S8 · Kocka', wrap(`<radialGradient id="bgk" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#5cc6d9"/><stop offset="1" stop-color="#1d6f92"/></radialGradient>
    <radialGradient id="gr" cx=".3" cy=".3" r="1"><stop offset="0" stop-color="#c8b852"/><stop offset="1" stop-color="#8f8a37"/></radialGradient>
    <clipPath id="sq"><rect width="512" height="512"/></clipPath><filter id="sh" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="10"/></filter>`,
  `<rect width="512" height="512" fill="url(#bgk)"/><ellipse cx="256" cy="${n(C[1] + h + 14)}" rx="214" ry="30" fill="#000" opacity=".3" filter="url(#sh)"/>
    ${bands(D, C)}${bands(C, B)}<path d="${P([C, B, dn(B, h), dn(C, h)])} Z" fill="#000" opacity=".2"/>${cuts}
    <g transform="matrix(${n(c * 1000) / 1000} ${n(s * 1000) / 1000} ${-n(c * 1000) / 1000} ${n(s * 1000) / 1000} ${e} ${f})"><g clip-path="url(#sq)">
      <rect width="512" height="512" fill="url(#gr)"/>${rails}${roadK(TOP, { asph: '#43474f', center: '#ffd447' })}
    </g></g>${trees}${leaves}`)]);
}

// S9 · Zora: pastel dawn, layered ridges and fog, two wide hairpins
{
  const fog = (cx, cy, rx, ry, o) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" filter="url(#fg)"/>`;
  const trees = [[488, 452, 56], [452, 400, 36], [40, 252, 34], [76, 238, 26]].map((p) => tree(...p, '#2b2448', '#221c3a')).join('');
  OUT.push(['s9.png', 'S9 · Zora', wrap(`${vgrad('sky', 0, 200, [[0, '#4a57a6'], [0.4, '#a48bcb'], [0.75, '#f3a9a6'], [1, '#ffd9a8']])}${vgrad('hl', 130, 512, [[0, '#8a76b4'], [0.5, '#5b4c8a'], [1, '#2f2752']])}${vgrad('as', 130, 512, [[0, '#8f88a8'], [1, '#3e3956']])}
    <filter id="fg" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="9"/></filter><filter id="sb" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="18"/></filter>`,
  `<rect width="512" height="512" fill="url(#sky)"/><circle cx="318" cy="112" r="86" fill="#ffe2b0" opacity=".7" filter="url(#sb)"/><circle cx="318" cy="112" r="27" fill="#fff4d8"/>
    <path d="M -10 150 Q 30 112 70 118 Q 110 76 150 64 Q 190 92 220 110 Q 262 96 290 120 Q 340 132 372 82 Q 410 56 446 92 Q 482 108 522 104 L 522 210 L -10 210 Z" fill="#c4a5d6"/>
    ${fog(260, 140, 280, 12, 0.55)}
    <path d="M -10 162 Q 70 128 150 146 Q 220 160 290 140 Q 360 120 430 146 Q 480 160 522 148 L 522 230 L -10 230 Z" fill="#a487c6"/>
    ${fog(200, 156, 260, 10, 0.5)}
    <path d="M -10 158 C 60 150 150 140 200 138 C 260 134 380 150 522 168 L 522 522 L -10 522 Z" fill="url(#hl)"/>
    ${fog(420, 190, 160, 12, 0.45)}${fog(170, 255, 150, 14, 0.35)}${fog(380, 420, 180, 16, 0.28)}
    ${trees}${roadK(GEO2, { asph: 'url(#as)', center: '#ffd49a' })}${fog(110, 330, 120, 10, 0.25)}`)]);
}

// S10 · Znak: one bold 3D ribbon road on a sunset gradient, fading into the sun
{
  const g = { W: (y) => Math.max(30, 46 + (y - 120) * 0.16), hs: [[176, 392, 96, 78], [338, 236, 76, 58]],
    legs: [[[560, 548], [430, 480], [300, 470], [176, 470]], [[176, 314], [240, 314], [280, 294], [338, 294]], [[338, 178], [276, 178], [236, 150], [204, 116]]] };
  const rib = roadK(g, { asph: 'url(#as)', center: '#ffd447', inside: true, under: (poly, avg) => `<path d="${poly}" fill="#5a0f2e" opacity=".3" transform="translate(0 ${n(avg * 0.45)})" filter="url(#rs)"/><path d="${poly}" fill="#17191f" transform="translate(0 ${n(avg * 0.2)})"/>` });
  OUT.push(['s10.png', 'S10 · Znak', wrap(`<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb04a"/><stop offset=".55" stop-color="#ff5f6d"/><stop offset="1" stop-color="#b8326a"/></linearGradient>
    ${vgrad('as', 110, 512, [[0, '#4a4f59'], [1, '#2a2e35']])}${vgrad('fd', 104, 186, [[0, '#000'], [1, '#fff']])}<mask id="fade"><rect width="512" height="512" fill="url(#fd)"/></mask>
    <filter id="rs" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter><filter id="sb" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="20"/></filter>`,
  `<rect width="512" height="512" fill="url(#bg)"/><circle cx="210" cy="110" r="96" fill="#fff0c2" opacity=".55" filter="url(#sb)"/><circle cx="210" cy="110" r="52" fill="#ffeab2"/>
    <path d="M -10 196 L 64 150 L 116 170 L 186 122 L 246 162 L 300 140 L 362 178 L 432 126 L 522 182 L 522 300 L -10 300 Z" fill="#fff" opacity=".16"/>
    <path d="M -10 236 L 90 196 L 170 222 L 260 190 L 350 226 L 440 196 L 522 230 L 522 330 L -10 330 Z" fill="#fff" opacity=".1"/>
    <g mask="url(#fade)">${rib}</g>`)]);
}

if (require.main === module) (async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 512, height: 512 } });
  for (const [f, , svg] of OUT) { await pg.setContent(`<html><body style="margin:0">${svg}</body></html>`); await pg.screenshot({ path: path.join(DIR, f), clip: { x: 0, y: 0, width: 512, height: 512 } }); }
  const img = (f) => `data:image/png;base64,${fs.readFileSync(path.join(DIR, f)).toString('base64')}`;
  const cells = [['Prej · 1', '1.png'], ...OUT.map(([f, t]) => [t, f])];
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;width:1080px;background:linear-gradient(#777c9e,#5d6283);font-family:'DejaVu Sans',Arial,sans-serif;color:#fff}
    h1{font-size:40px;margin:30px 36px 6px}p{margin:0 36px 16px;font-size:25px;opacity:.85}
    .g{display:grid;grid-template-columns:repeat(3,1fr);row-gap:28px;padding:8px 10px 26px}.c{text-align:center}
    .t{font-size:29px;font-weight:700;margin-bottom:12px}.c img{width:270px;height:270px;border-radius:27%;display:block;margin:0 auto;box-shadow:0 6px 16px rgba(0,0,0,.28)}
    .l{font-size:30px;margin-top:12px}.s{display:flex;justify-content:space-around;align-items:flex-end;padding:20px 26px 34px;border-top:2px solid rgba(255,255,255,.25)}
    .s div{text-align:center;font-size:23px}.s img{width:64px;height:64px;border-radius:27%;display:block;margin:0 auto 6px}</style>
    <h1>Serpentina: 5 novih različic</h1><p>Brez avta, kot pri Svetu. Spodaj v velikosti kot na zaslonu telefona.</p>
    <div class="g">${cells.map(([t, f]) => `<div class="c"><div class="t">${t}</div><img src="${img(f)}"><div class="l">Roads Atlas</div></div>`).join('')}</div>
    <div class="s">${cells.map(([t, f]) => `<div><img src="${img(f)}">${t.split(' · ')[0]}</div>`).join('')}</div>`;
  const p = await b.newPage({ viewport: { width: 1080, height: 900 } }); await p.setContent(html);
  await p.screenshot({ path: path.join(DIR, 'pregled-serpentina-2.jpg'), fullPage: true, type: 'jpeg', quality: 86 });
  await b.close(); console.log('ok', fs.statSync(path.join(DIR, 'pregled-serpentina-2.jpg')).size);
})();
