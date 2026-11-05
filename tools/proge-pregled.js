// Pregled prog v igri v eni majhni datoteki (docs/proge-pregled.md): za vsako pravo progo dolžina, zavitost, delež ravnin, lasnice
// in višina, izmerjeni na sredinski črti ceste v igri. Merilo je isto kot pri načrtovanih progah (tools/zavite/tool.py na veji
// zavitih prog: twist, corners), zato se števila dajo primerjati s progami na čakanju.
//   zavitost (°/km): vsota sprememb smeri na kilometer (točke na 5 m, smer zglajena čez 20 m, spremembe pod 0,5° ne štejejo)
//   ravnine (%): delež proge, kjer se smer na 30 m spremeni za manj kot za polmer 250 m
//   lasnice: ostri ovinki (polmer pod 90 m, zglajeno čez 15 m) z zasukom nad 130°
// Orodje prepiše samo tabelo med oznakama <!-- meritve:začetek --> in <!-- meritve:konec -->; razdelek »Do 60 m ob cesti« ostane,
// kot ga je napisala seja (nova proga: dopiši njeno vrstico ročno). Zaženi po novi progi ali spremembi poteka ceste:
//   node tools/proge-pregled.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('../tests/lib/core.js');

const STEP = 5, DEG = 180 / Math.PI;

// sredinska črta poti, ki se vozi: odprta cesta od starta do cilja, krog en krog od štartne črte (zaprt: zadnja točka = prva)
function runPoints(d, T) {
  const open = !!d.open, L = open ? T.raceLen : T.len;
  const at = (s) => {
    if (!open) s = ((s % T.len) + T.len) % T.len;
    const f = Math.max(0, Math.min(T.N - 1.0001, s / T.ds)), i = Math.floor(f), u = f - i;
    return [T.px[i] + (T.px[i + 1] - T.px[i]) * u, T.pz[i] + (T.pz[i + 1] - T.pz[i]) * u, T.hy[i] + (T.hy[i + 1] - T.hy[i]) * u];
  };
  const n = Math.max(2, Math.floor(L / STEP)), pts = [];
  for (let k = 0; k <= n; k++) pts.push(at(T.startS + L * k / n));
  return { pts, open, L };
}
function headings(pts) {   // smeri med zaporednimi točkami, razvite (brez skokov za 2π)
  const hd = [];
  for (let i = 1; i < pts.length; i++) {
    let a = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
    if (hd.length) { const p = hd[hd.length - 1]; a -= 2 * Math.PI * Math.round((a - p) / (2 * Math.PI)); }
    hd.push(a);
  }
  return hd;
}
function twist(pts0, closed) {
  let length = 0;
  for (let i = 1; i < pts0.length; i++) length += Math.hypot(pts0[i][0] - pts0[i - 1][0], pts0[i][1] - pts0[i - 1][1]);
  const pts = closed ? pts0.slice(0, -1).concat(pts0.slice(0, 8)) : pts0;
  const hd = headings(pts), hs = [];
  for (let i = 0; i + 3 < hd.length; i++) hs.push((hd[i] + hd[i + 1] + hd[i + 2] + hd[i + 3]) / 4);
  const n = pts.length - (closed ? 8 : 0);
  let total = 0;
  for (let i = 0; i < Math.min(hs.length - 1, Math.max(1, n - 4)); i++) { const d = Math.abs(hs[i + 1] - hs[i]); if (d >= 0.5 / DEG) total += d; }
  const win = 6, straight = [];
  for (let i = 0; i < hd.length - win; i++) straight.push(Math.abs(hd[i + win] - hd[i]) < (win * STEP) / 250);
  const st = straight.slice(0, Math.max(1, n - win));
  let longest = 0, run = 0;
  for (const v of st) { run = v ? run + 1 : 0; longest = Math.max(longest, run); }
  return { twist: total * DEG / (length / 1000), straight: st.length ? st.filter(Boolean).length / st.length : 0, longest: longest * STEP };
}
function corners(pts0, closed) {
  const pts = closed ? pts0.slice(0, -1).concat(pts0.slice(0, 6)) : pts0;
  const hd = headings(pts), dh = [];
  for (let i = 1; i < hd.length; i++) dh.push(hd[i] - hd[i - 1]);
  const n = dh.length, tight = [];
  for (let i = 0; i < n; i++) tight.push(Math.abs(((i > 0 ? dh[i - 1] : 0) + dh[i] + (i + 1 < n ? dh[i + 1] : 0)) / 3) / STEP > 1 / 90);
  let count = 0, hair = 0;
  for (let i = 0; i < n;) {
    if (!tight[i]) { i++; continue; }
    let j = i, sum = 0;
    while (j < n && tight[j]) { sum += dh[j]; j++; }
    const turn = Math.abs(sum * DEG);
    if (turn > 35) { count++; if (turn > 130) hair++; }
    i = j;
  }
  return { corners: count, hairpins: hair };
}
function measure(d, T) {
  const { pts, open, L } = runPoints(d, T);
  const xz = pts.map(p => [p[0], p[1]]), h = pts.map(p => p[2]);
  const tw = twist(xz, !open), co = corners(xz, !open);
  const hmin = Math.min(...h), hmax = Math.max(...h);
  return { open, len: L, ...tw, ...co, climb: h[h.length - 1] - h[0], range: hmax - hmin };
}

const num = (x, d = 1) => x.toFixed(d).replace('.', ',');
function table(C) {
  const rows = [];
  for (const d of C.TRACKS) {
    if (d.test || d.variantOf) continue;
    const m = measure(d, new C.Track(d));
    const kind = !m.open ? 'krog' : d.timeTrial ? 'kronometer' : 'odprta cesta';
    const height = m.open ? (m.climb >= 0 ? '+' : '−') + Math.abs(m.climb).toFixed(0) + ' m' : (m.range >= 10 ? m.range.toFixed(0) + ' m razpona' : 'ravno');
    rows.push({ id: d.id, name: d.name, kind, m, height });
  }
  rows.sort((a, b) => b.m.twist - a.m.twist);
  const out = ['| Proga | `id` | Vrsta | Dolžina | °/km | Ravnine | Lasnice | Višina |', '|---|---|---|---|---|---|---|---|'];
  for (const r of rows) out.push(`| ${r.name} | \`${r.id}\` | ${r.kind} | ${num(r.m.len / 1000)} km | ${Math.round(r.m.twist)} | ${Math.round(r.m.straight * 100)} % | ${r.m.hairpins} | ${r.height} |`);
  return out.join('\n');
}

if (require.main === module) {
  const F = path.join(ROOT, 'docs', 'proge-pregled.md');
  const src = fs.readFileSync(F, 'utf8'), A = '<!-- meritve:začetek -->', B = '<!-- meritve:konec -->';
  const a = src.indexOf(A), b = src.indexOf(B);
  if (a < 0 || b < a) { console.error('v ' + F + ' ni oznak ' + A + ' in ' + B); process.exit(2); }
  fs.writeFileSync(F, src.slice(0, a + A.length) + '\n' + table(loadCore()) + '\n' + src.slice(b));
  console.log('posodobljeno: ' + path.relative(ROOT, F));
}
module.exports = { measure, twist, corners };
