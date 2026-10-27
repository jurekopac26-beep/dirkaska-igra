// Proposal 91, C4-2 "Visok pas, velike ikone" with the weather animated (C42-1..C42-6): CSS animations of transform and opacity only, on SVG
// groups in the pause menu's forecast; every animation's duration divides the loop (LOOP s), so the loop is seamless; the text never moves;
// prefers-reduced-motion: no animation (the still picture, the effects that only exist in motion hidden)
import { IC, BASE } from './ov.mjs';
export const LOOP = 6;
const inner = (svg) => svg.replace(/^<svg viewBox="0 0 (24|40) (24|40)">/, '').replace(/<\/svg>$/, '');
const W = 316, x0 = 9, x1 = W - 9, NL = 4, xl = (k) => x0 + (x1 - x0) * k / NL, XR = xl(2.1), HW = (x1 - x0) / NL / 2;
const by = 2, bh = 80, AY = by + bh + 22, H = 132, XM = xl(1.55), XP = xl(2);
const off = (x) => ((x - x0) / (x1 - x0)).toFixed(3);
const ic = (name, x, y, s) => `<g transform="translate(${(x - s / 2).toFixed(1)} ${(y - s / 2).toFixed(1)}) scale(${(s / 24).toFixed(4)})">${inner(IC[name])}</g>`;
const CLOUD = 'M6 18h12a4 4 0 0 0 0-8 5.6 5.6 0 0 0-10.7 1.5A3.3 3.3 0 0 0 6 18z';
const cloud = (x, y, s, fill, op) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(s / 24).toFixed(3)})"><path d="${CLOUD}" fill="${fill}" opacity="${op}"/></g>`;
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// rain streaks in [xa, xb] x [ya, ya + ph], thicker to the right; drawn twice (y and y - ph) so a fall by ph loops; slant: x per y
const streaks = (xa, xb, ya, ph, n, s0, len, op, slant = 0.32, sw = 1.4) => {
  seed = s0; let out = '';
  for (let k = 0; k < n; k++) { const x = xa + rnd() * (xb - xa), t = (x - xa) / (xb - xa); if (rnd() > 0.3 + 0.7 * t) continue; const y = ya + rnd() * ph, l = len[0] + rnd() * (len[1] - len[0]), o = op[0] + rnd() * (op[1] - op[0]);
    for (const dy of [0, -ph]) out += `<line x1="${x.toFixed(1)}" y1="${(y + dy).toFixed(1)}" x2="${(x - l * slant).toFixed(1)}" y2="${(y + dy + l).toFixed(1)}" stroke="rgba(170,215,255,${o.toFixed(2)})" stroke-width="${sw}" stroke-linecap="round"/>`; }
  return out;
};
// a layer of clouds repeating every p px (drawn over two periods + one), to drift left by p
const cloudLayer = (xa, p, list, fill) => { let out = ''; for (let r = 0; r < 3; r++) for (const [dx, y, s, op] of list) out += cloud(xa + r * p + dx, y, s, fill, op); return out; };
const sun = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${(r * 0.46).toFixed(1)}" fill="#ffc629"/>`;
const rays = (cx, cy, r) => `<g stroke="#ffc629" stroke-width="${(r * 0.17).toFixed(1)}" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const q = a * Math.PI / 180; return `<line x1="${(cx + Math.cos(q) * r * 0.66).toFixed(1)}" y1="${(cy + Math.sin(q) * r * 0.66).toFixed(1)}" x2="${(cx + Math.cos(q) * r * 0.95).toFixed(1)}" y2="${(cy + Math.sin(q) * r * 0.95).toFixed(1)}"/>`; }).join('')}</g>`;
const defs = `<linearGradient id="k2s" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#e9b43a" stop-opacity=".6"/><stop offset="${off(XR - HW)}" stop-color="#c9a65a" stop-opacity=".45"/>
  <stop offset="${off(XR + HW)}" stop-color="#2f6fb0" stop-opacity=".8"/><stop offset="1" stop-color="#1d4f8a" stop-opacity=".92"/></linearGradient>
  <radialGradient id="k2g" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffe08a" stop-opacity=".8"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>
  <linearGradient id="k2m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
  <mask id="k2k" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="${XR - HW}" y="0" width="${2 * HW}" height="${H}" fill="url(#k2m)"/><rect x="${XR + HW}" y="0" width="${W}" height="${H}" fill="#fff"/></mask>
  <clipPath id="k2c"><rect x="${x0}" y="${by}" width="${x1 - x0}" height="${bh}" rx="12"/></clipPath>
  <linearGradient id="k2w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
const pill = `<rect x="${XR - 40}" y="${by + bh - 21}" width="80" height="17" rx="8.5" fill="rgba(10,14,20,.72)"/><text x="${XR}" y="${by + bh - 8.5}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff">± pol kroga</text>`;
const axis = (tiRing) => `<line x1="${x0}" y1="${AY}" x2="${x1}" y2="${AY}" stroke="rgba(255,255,255,.25)" stroke-width="3" stroke-linecap="round"/>
  <line x1="${x0}" y1="${AY}" x2="${XM}" y2="${AY}" stroke="#ffc629" stroke-width="3" stroke-linecap="round"/>
  ${Array.from({ length: NL + 1 }, (_, k) => `<line x1="${xl(k)}" y1="${AY - 5}" x2="${xl(k)}" y2="${AY + 5}" stroke="rgba(255,255,255,.55)" stroke-width="1.4"/>`).join('')}
  ${['1. krog', '2. krog', '3. krog', '4. krog'].map((t, i) => `<text x="${xl(i + 0.5)}" y="${H - 4}" text-anchor="middle" font-size="12" font-weight="700" font-style="italic" fill="${i === 1 ? '#ffc629' : '#9fb0c3'}">${t}</text>`).join('')}
  ${tiRing || ''}
  <g class="k-p"><g transform="translate(${XP} ${AY})"><rect x="-11" y="-11" width="22" height="22" rx="5" fill="#2f6fe0" stroke="#fff" stroke-width="1.6"/><text x="0" y="5" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">P</text></g></g>
  <circle cx="${XM}" cy="${AY}" r="6.5" fill="#e63b2e" stroke="#fff" stroke-width="2"/>
  <text x="${XM}" y="${AY - 11}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff">TI</text>`;
const CSS = (extra) => BASE + `
.mk-c42 { margin: 12px 0 0; }
.mk-c42 .hd { margin-bottom: 5px; }
.mk-c42 svg.tl { width: 100%; height: auto; font-family: var(--f-ui); }
.mk-c42 .tip { margin-top: 4px; display: flex; align-items: center; }
.mk-c42 .fb { transform-box: fill-box; transform-origin: center; }
${extra}
@media (prefers-reduced-motion: reduce) { .mk-c42 *, .mk-c42 *::before { animation: none !important; } }
`;
const box = (svg) => `<div class="mk mk-box mk-c42">
  <div class="hd"><span class="lbl">Vreme do cilja</span><span class="big">Dež čez ~1 krog</span></div>
  <svg class="tl" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${svg}</svg>
  <div class="tip"><span class="pi"></span>Gume za dež: v boks na koncu <b>&nbsp;2. kroga</b>.</div>
</div>`;
const band = `<rect x="${x0}" y="${by}" width="${x1 - x0}" height="${bh}" rx="12" fill="url(#k2s)"/>`;
const xs = XR - HW;   // (where the rain begins to show)

export function build(info, id) {
  if (id === 'C42-1') {
    // the sun's rays turning slowly, its glow breathing; light clouds drifting over the rainy laps; the rain falling
    const css = CSS(`
.k-rot { animation: kRot 6s linear infinite; }
@keyframes kRot { to { transform: rotate(45deg); } }
.k-glow { animation: kGlow 3s ease-in-out infinite; }
@keyframes kGlow { 0%, 100% { opacity: .55; transform: scale(.9); } 50% { opacity: 1; transform: scale(1.1); } }
.k-drift { animation: kDrift 6s linear infinite; }
@keyframes kDrift { to { transform: translateX(-120px); } }
.k-fall { animation: kFall .75s linear infinite; }
@keyframes kFall { to { transform: translateY(40px); } }
`);
    const svg = `${band}<g clip-path="url(#k2c)">
      <g class="k-glow fb"><circle cx="${xl(0.5)}" cy="${by + 30}" r="44" fill="url(#k2g)"/></g>
      <g mask="url(#k2k)"><g class="k-drift">${cloudLayer(xs, 120, [[10, by + 2, 46, .3], [70, by + 14, 38, .24]], '#dfe7f0')}</g>
        <g class="k-fall">${streaks(xs, x1, by + 40, 40, 120, 11, [7, 14], [.35, .85])}</g></g>
      <rect x="${XR - HW}" y="${by}" width="${2 * HW}" height="${bh}" fill="url(#k2w)"/></g>
    <g class="k-rot fb">${rays(xl(0.5), by + 30, 20)}</g>${sun(xl(0.5), by + 30, 20)}
    ${ic('part', xl(1.5), by + 30, 40)}${ic('cloud', XR, by + 24, 32)}${ic('rain', xl(2.75), by + 26, 40)}${ic('heavy', xl(3.55), by + 26, 40)}
    ${pill}${axis()}`;
    return { css, html: box(svg) };
  }
  if (id === 'C42-2') {
    // two layers of clouds at two speeds (the far ones small and pale, the near ones big and dark); drops from the band hit the lap axis
    // and splash there
    let drops = '';
    seed = 77; const DX = [xl(2.35), xl(2.62), xl(2.95), xl(3.2), xl(3.48), xl(3.8)];
    DX.forEach((x, k) => { const d = -(k * 0.25 + rnd() * 0.1).toFixed(2);
      drops += `<g class="k-drop" style="animation-delay:${d}s" opacity="0"><line x1="${x}" y1="${by + bh + 1}" x2="${x - 1.5}" y2="${by + bh + 6}" stroke="#9fd2ff" stroke-width="1.6" stroke-linecap="round"/></g>
        <g class="k-spl fb" style="animation-delay:${d}s" opacity="0"><ellipse cx="${x - 3}" cy="${AY}" rx="8.5" ry="2.8" fill="none" stroke="#cfe9ff" stroke-width="1.6"/></g>`; });
    const css = CSS(`
.k-far { animation: kFar 6s linear infinite; }
@keyframes kFar { to { transform: translateX(-100px); } }
.k-near { animation: kNear 6s linear infinite; }
@keyframes kNear { to { transform: translateX(-150px); } }
.k-fall { animation: kFall .75s linear infinite; }
@keyframes kFall { to { transform: translateY(40px); } }
.k-drop { animation: kDrop 1.5s linear infinite, kDropO 1.5s linear infinite; }
@keyframes kDrop { 0% { transform: translateY(0); } 38% { transform: translateY(13px); } 100% { transform: translateY(13px); } }
@keyframes kDropO { 0% { opacity: 0; } 6% { opacity: .95; } 36% { opacity: .95; } 39%, 100% { opacity: 0; } }
.k-spl { animation: kSpl 1.5s ease-out infinite; }
@keyframes kSpl { 0%, 38% { opacity: 0; transform: scale(.2); } 41% { opacity: .95; transform: scale(.35); } 80% { opacity: 0; transform: scale(1.15); } 100% { opacity: 0; transform: scale(1.15); } }
`);
    const svg = `${band}<g clip-path="url(#k2c)">
      <circle cx="${xl(0.5)}" cy="${by + 30}" r="44" fill="url(#k2g)" opacity=".8"/>
      <g mask="url(#k2k)"><g class="k-far">${cloudLayer(xs, 100, [[8, by + 4, 26, .35], [58, by + 10, 22, .3]], '#e6edf5')}</g>
        <g class="k-fall">${streaks(xs, x1, by + 40, 40, 110, 23, [7, 13], [.35, .8])}</g>
        <g class="k-near">${cloudLayer(xs, 150, [[0, by + 18, 58, .5], [86, by + 26, 50, .45]], '#5c6f86')}</g></g>
      <rect x="${XR - HW}" y="${by}" width="${2 * HW}" height="${bh}" fill="url(#k2w)"/></g>
    ${ic('sun', xl(0.5), by + 30, 40)}${ic('part', xl(1.5), by + 30, 40)}${ic('rain', xl(2.75), by + 24, 40)}${ic('heavy', xl(3.55), by + 24, 40)}
    ${pill}${axis()}${drops}`;
    return { css, html: box(svg) };
  }
  if (id === 'C42-3') {
    // the uncertain changeover breathes: the sunny side swells and shrinks a little (± a few metres of the race), a soft haze over the change
    // pulses; light rain, the sun still
    const css = CSS(`
.k-breath { transform-box: fill-box; transform-origin: left center; animation: kBreath 6s ease-in-out infinite; }
@keyframes kBreath { 0%, 100% { transform: scaleX(.88); } 50% { transform: scaleX(1.12); } }
.k-shim { animation: kShim 3s ease-in-out infinite; }
@keyframes kShim { 0%, 100% { opacity: .1; transform: scaleX(.7); } 50% { opacity: 1; transform: scaleX(1.3); } }
.k-shim2 { animation: kShim2 6s ease-in-out infinite; }
@keyframes kShim2 { 0%, 100% { opacity: .9; } 50% { opacity: .2; } }
.k-fall { animation: kFall 1.5s linear infinite; }
@keyframes kFall { to { transform: translateY(40px); } }
`);
    const svg = `${band}<g clip-path="url(#k2c)">
      <circle cx="${xl(0.5)}" cy="${by + 30}" r="44" fill="url(#k2g)" opacity=".85"/>
      <defs><linearGradient id="k3w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9b43a" stop-opacity=".45"/><stop offset="${((XR - HW - x0) / (XR + HW - x0)).toFixed(3)}" stop-color="#d7a94a" stop-opacity=".4"/><stop offset="1" stop-color="#d7a94a" stop-opacity="0"/></linearGradient>
        <radialGradient id="k3h" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>
      <g class="k-breath"><rect x="${x0}" y="${by}" width="${XR + HW - x0}" height="${bh}" fill="url(#k3w)"/></g>
      <g mask="url(#k2k)"><g class="k-fall">${streaks(xs, x1, by + 40, 40, 70, 31, [6, 11], [.3, .7])}</g></g>
      <g class="k-shim fb"><ellipse cx="${XR}" cy="${by + bh / 2}" rx="${HW}" ry="${bh * 0.62}" fill="url(#k3h)"/></g>
      <g class="k-shim2"><rect x="${XR - HW}" y="${by}" width="${2 * HW}" height="${bh}" fill="url(#k2w)"/></g></g>
    ${ic('sun', xl(0.5), by + 30, 40)}${ic('part', xl(1.5), by + 30, 40)}${ic('cloud', XR, by + 24, 32)}${ic('rain', xl(2.75), by + 26, 40)}${ic('heavy', xl(3.55), by + 26, 40)}
    ${pill}${axis()}`;
    return { css, html: box(svg) };
  }
  if (id === 'C42-4') {
    // wind: the rain's slant sways with gusts, the clouds drift and are pushed on in the gusts, streaks of wind cross the sunny part
    let wind = '';
    seed = 5; for (let k = 0; k < 4; k++) { const y = by + 14 + k * 17, x = xl(0.25) + rnd() * xl(1.2), d = -(k * 0.37).toFixed(2);
      wind += `<g class="k-wind" style="animation-delay:${d}s" opacity="0"><path d="M${x} ${y} q 14 -4 28 0 t 28 0" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.4" stroke-linecap="round"/></g>`; }
    const css = CSS(`
.k-sway { transform-box: view-box; transform-origin: 230px 30px; animation: kSway 6s ease-in-out infinite; }
@keyframes kSway { 0%, 100% { transform: skewX(-4deg); } 22% { transform: skewX(-8deg); } 32% { transform: skewX(-24deg); } 46% { transform: skewX(-14deg); } 62% { transform: skewX(-22deg); } 80% { transform: skewX(-6deg); } }
.k-fall { animation: kFall .6s linear infinite; }
@keyframes kFall { to { transform: translateY(40px); } }
.k-drift { animation: kDrift 6s linear infinite; }
@keyframes kDrift { to { transform: translateX(-120px); } }
.k-gust { animation: kGust 6s ease-in-out infinite; }
@keyframes kGust { 0%, 100% { transform: translateX(0); } 22% { transform: translateX(-2px); } 34% { transform: translateX(-16px); } 48% { transform: translateX(-9px); } 63% { transform: translateX(-15px); } 82% { transform: translateX(-3px); } }
.k-wind { animation: kWind 1.5s ease-in-out infinite; }
@keyframes kWind { 0% { opacity: 0; transform: translateX(26px); } 30% { opacity: .9; } 70% { opacity: .5; } 100% { opacity: 0; transform: translateX(-34px); } }
.k-flick { animation: kFlick 3s ease-in-out infinite; }
@keyframes kFlick { 0%, 100% { opacity: .8; } 40% { opacity: .55; } 60% { opacity: .95; } }
`);
    const svg = `${band}<g clip-path="url(#k2c)">
      <g class="k-flick"><circle cx="${xl(0.5)}" cy="${by + 30}" r="44" fill="url(#k2g)"/></g>
      ${wind}
      <g mask="url(#k2k)"><g class="k-gust"><g class="k-drift">${cloudLayer(xs, 120, [[6, by + 4, 44, .32], [66, by + 16, 36, .26]], '#dfe7f0')}</g></g>
        <g class="k-sway"><g class="k-fall">${streaks(xs - 10, x1 + 30, by + 30, 40, 150, 47, [8, 14], [.35, .85], 0.05)}</g></g></g>
      <rect x="${XR - HW}" y="${by}" width="${2 * HW}" height="${bh}" fill="url(#k2w)"/></g>
    ${ic('sun', xl(0.5), by + 30, 40)}${ic('part', xl(1.5), by + 30, 40)}${ic('cloud', XR, by + 24, 32)}${ic('rain', xl(2.75), by + 26, 40)}${ic('heavy', xl(3.55), by + 26, 40)}
    ${pill}${axis()}`;
    return { css, html: box(svg) };
  }
  if (id === 'C42-5') {
    // a storm gathering: the sky darkens towards lap 4 (breathing slowly), big dark clouds drift, heavy rain; a soft flash of lightning once a loop
    const css = CSS(`
.k-dark { animation: kDark 6s ease-in-out infinite; }
@keyframes kDark { 0%, 100% { opacity: .45; } 50% { opacity: .85; } }
.k-drift { animation: kDrift 6s linear infinite; }
@keyframes kDrift { to { transform: translateX(-120px); } }
.k-fall { animation: kFall .6s linear infinite; }
@keyframes kFall { to { transform: translateY(40px); } }
.k-flash { animation: kFlash 6s linear infinite; }
@keyframes kFlash { 0%, 60% { opacity: 0; } 61.5% { opacity: .42; } 64% { opacity: .16; } 66% { opacity: .34; } 76% { opacity: 0; } 100% { opacity: 0; } }
.k-bolt { animation: kBolt 6s linear infinite; }
@keyframes kBolt { 0%, 60.5% { opacity: 0; } 61.5% { opacity: 1; } 64% { opacity: .3; } 66% { opacity: .9; } 72% { opacity: 0; } 100% { opacity: 0; } }
`);
    const svg = `${band}<g clip-path="url(#k2c)">
      <circle cx="${xl(0.5)}" cy="${by + 30}" r="44" fill="url(#k2g)" opacity=".8"/>
      <defs><linearGradient id="k5d" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b1424" stop-opacity="0"/><stop offset=".35" stop-color="#0b1424" stop-opacity=".35"/><stop offset="1" stop-color="#0b1424" stop-opacity=".85"/></linearGradient>
        <radialGradient id="k5f" cx="0.5" cy="0.35" r="0.6"><stop offset="0" stop-color="#eef4ff" stop-opacity="1"/><stop offset="1" stop-color="#eef4ff" stop-opacity="0"/></radialGradient></defs>
      <g class="k-dark"><rect x="${XR - HW}" y="${by}" width="${x1 - XR + HW}" height="${bh}" fill="url(#k5d)"/></g>
      <g class="k-flash" opacity="0"><rect x="${xl(2.7)}" y="${by}" width="${x1 - xl(2.7)}" height="${bh}" fill="url(#k5f)"/></g>
      <g mask="url(#k2k)"><g class="k-fall">${streaks(xs, x1, by + 34, 40, 190, 59, [9, 16], [.4, .9], 0.25, 1.6)}</g>
        <g class="k-drift">${cloudLayer(xs, 120, [[0, by - 6, 60, .55], [62, by + 2, 54, .5]], '#38475c')}</g></g>
      <g class="k-bolt" opacity="0"><path d="M${xl(3.3)} ${by + 20} l-7 15 h6 l-5 14 l13 -19 h-6 l6 -10 z" fill="#fff6c8" stroke="#ffe27a" stroke-width="1"/></g></g>
    ${ic('sun', xl(0.5), by + 30, 40)}${ic('part', xl(1.5), by + 30, 40)}${ic('cloud', XR, by + 24, 32)}${ic('rain', xl(2.75), by + 26, 40)}${ic('heavy', xl(3.75), by + 24, 40)}
    ${pill}${axis()}`;
    return { css, html: box(svg) };
  }
  if (id === 'C42-6') {
    // the player: TI's ring pulsing; a sweep of light runs from TI to the stop P (the P lifts as it arrives); the weather calm (drifting
    // clouds, gentle rain)
    const d = XP - XM;
    const css = CSS(`
.k-ring { animation: kRing 2s ease-out infinite; }
@keyframes kRing { 0% { opacity: .85; transform: scale(1); } 75%, 100% { opacity: 0; transform: scale(2.1); } }
.k-sweep { animation: kSweep 3s ease-in-out infinite; }
@keyframes kSweep { 0% { opacity: 0; transform: translateX(0); } 15% { opacity: .95; } 70% { opacity: .95; transform: translateX(${d.toFixed(1)}px); } 85%, 100% { opacity: 0; transform: translateX(${d.toFixed(1)}px); } }
.k-seg { animation: kSeg 3s ease-in-out infinite; }
@keyframes kSeg { 0%, 100% { opacity: .2; } 70% { opacity: 1; } }
.k-p { transform-box: fill-box; transform-origin: center; animation: kP 3s ease-in-out infinite; }
@keyframes kP { 0%, 62% { transform: scale(1); } 74% { transform: scale(1.2); } 88%, 100% { transform: scale(1); } }
.k-drift { animation: kDrift 6s linear infinite; }
@keyframes kDrift { to { transform: translateX(-120px); } }
.k-fall { animation: kFall 1.2s linear infinite; }
@keyframes kFall { to { transform: translateY(40px); } }
`);
    const ring = `<g class="k-ring fb" opacity="0"><circle cx="${XM}" cy="${AY}" r="7" fill="none" stroke="#ff6a5c" stroke-width="2"/></g>
      <g class="k-seg" opacity=".2"><line x1="${XM}" y1="${AY}" x2="${XP - 11}" y2="${AY}" stroke="#ffe27a" stroke-width="4" stroke-linecap="round"/></g>

`;
    const sweep = `<g class="k-sweep" opacity="0"><rect x="${XM - 10}" y="${by}" width="20" height="${AY - by + 8}" rx="8" fill="url(#k6s)"/></g>`;
    const svg = `${band}<g clip-path="url(#k2c)">
      <circle cx="${xl(0.5)}" cy="${by + 30}" r="44" fill="url(#k2g)" opacity=".8"/>
      <g mask="url(#k2k)"><g class="k-drift">${cloudLayer(xs, 120, [[10, by + 2, 46, .3], [70, by + 14, 38, .24]], '#dfe7f0')}</g>
        <g class="k-fall">${streaks(xs, x1, by + 40, 40, 80, 71, [6, 12], [.3, .75])}</g></g>
      <rect x="${XR - HW}" y="${by}" width="${2 * HW}" height="${bh}" fill="url(#k2w)"/></g>
    ${ic('sun', xl(0.5), by + 30, 40)}${ic('part', xl(1.5), by + 30, 40)}${ic('cloud', XR, by + 24, 32)}${ic('rain', xl(2.75), by + 26, 40)}${ic('heavy', xl(3.55), by + 26, 40)}
    <defs><linearGradient id="k6s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6c8" stop-opacity="0"/><stop offset=".5" stop-color="#fff6c8" stop-opacity=".75"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient></defs>
    ${sweep}${pill}${axis(ring)}`;
    return { css, html: box(svg) };
  }
  return { css: '', html: '' };
}
