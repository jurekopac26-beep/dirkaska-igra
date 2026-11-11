// Chapman's Peak, Južna Afrika: the hills behind the barrier line (def.hills in js/tracks/chapman.js; Track.hill in js/core.js). The user's
// requests of 11. 11. 2026: where the ground rises behind the barrier, no fence and no ditch, and the car may drive up onto the hill; no invisible
// wall there: it drives up the slope as far as its speed takes it, the slope slows it and brings it back to the road (»Poprabi da se avto ne
// zabije v hrib ampak zapelje v hrib«). The game's physics needs the height of that ground also in the Node tests, which build no world: this
// tool reads it from the terrain the game draws (buildChapman's hillProbe: the 5 m ground mesh, its triangles) and writes it into the track file.
//   node tools/chapman-hribi.mjs            write def.hills (after a change of Chapman's terrain, its road, its barrier lines or its nets)
//   node tools/chapman-hribi.mjs --check    exit 1 when def.hills is not what the terrain gives now (tests/browser/world.test.mjs checks it too)
//   node tools/chapman-hribi.mjs --stats    the hills found, per side, and how far up them a car gets (the soft limit)
//   --save <file> / --from <file>           the terrain read from the game kept in a file / taken from it (no browser: trying the rule)
// The rule (hills below): a side of a sample is a hill where the ground behind the barrier rises (0.6 m and more 3 m out, 1.5 m 6 m out, 3 m
// somewhere 6-12 m out) and does not fall back below the road within 18 m (not a bank on the sea side with the cliff right behind it), not on
// the bridge, at a side road's mouth, at a view point's lay-by, at the toll plaza or by the start and the finish; runs shorter than 12 m
// dropped, gaps up to 8 m filled. Its heights at seven points out from the barrier line (D: 0.3 to 6 m; from 0.7 m inside it the verge at
// the road's height): the ground there, never falling outwards (the ditch filled), in 5 cm steps, each the rise from the point before (DIG).
// Its soft limit (Track.hill.lim, hillSoft in js/core.js): how far past the barrier line a car's corner gets at the most: up to where the
// ground is H_CAP high (the rock face of the cut: there it loses its speed and slides back), NET_CLR short of a rockfall net (its posts and the
// mesh leaning out over the road: the net catches the car softly), never beyond L_MAX; smooth along the road (a car sliding along it is not
// stopped by its kinks: never more than the limit found, its slope at most L_SL, rounded over SM samples), down to the barrier line at a hill's
// ends (the wall past them); written as its change from the sample before, in 1 cm steps (DIG - 31).
import fs from 'fs';
import path from 'path';
import url from 'url';
import { serve, launch, openGame, REPO } from '../tests/browser/lib.mjs';

const FILE = path.join(REPO, 'js', 'tracks', 'chapman.js');
const DIG = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';   // (a number 0-61: a rise in 5 cm steps, a limit in 10 cm steps)
export const D = [0.3, 1.2, 2.1, 3, 4, 5, 6];   // (the heights written, m out from the barrier line: def.hills.d)
export const DL = [...D, 9, 12, 13, 18];   // (where the ground is read)
const H_CAP = 2, NET_CLR = 0.55, L_MAX = 5, L_SL = 0.15, SM = 3, PCT = 0.25, TP = 3, RUN = 12, TILT = [0.13, 1.68, 1.55 * Math.tan(45 * Math.PI / 180)];

// in the page: the ground behind the barrier line of every sample, per side ([0] left, [1] right), at DL; null where no hill may be; the nets
export function probe(DL) {
  const T = window.__game.race.track, def = T.def, P = Render.world.hillProbe, N = T.N;
  const ban = [new Uint8Array(N), new Uint8Array(N)], banR = (s0, s1, sd) => { for (let i = Math.max(0, T.idx(T.startS + s0)); i <= Math.min(N - 1, T.idx(T.startS + s1)); i++) { if (sd <= 0) ban[0][i] = 1; if (sd >= 0) ban[1][i] = 1; } };
  for (let i = 0; i < N; i++) if (i < T.idx(T.startS + 30) || i > T.idx(T.finishS - 20)) ban[0][i] = ban[1][i] = 1;   // (the start's beach and the finish's view point: as the walls)
  for (const [s, sd] of def.views || []) banR(s - 14, s + 14, sd);   // (a view point's lay-by)
  if (def.toll != null) banR(def.toll - 30, def.toll + 30, 0);   // (the toll plaza's booths)
  const g = [[], []];
  for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0;
    for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i]; g[si].push(ban[si][i] || P.skip(i, side) ? null : DL.map(d => +P.g(i, side, bar + d).toFixed(3))); } }
  return { n: N, ds: T.ds, startS: T.startS, len: T.raceLen, g, nets: P.nets.map(([sd, i, j, off]) => [sd, i, j, +off.toFixed(3)]) };
}

// the ground a car finds o m past the barrier line from the heights written (as hillY in js/core.js; on the road's side of it the road's height)
const yAt = (Y, o) => { if (o <= D[0]) return Y[0] * Math.max(0, o) / D[0]; let j = 1; while (j < D.length - 1 && o > D[j]) j++; return Y[j - 1] + (Y[j] - Y[j - 1]) * (o - D[j - 1]) / (D[j] - D[j - 1]); };

// the soft limit along a hill from the limits found at its samples, by the height (lh: the ground's bumps (the 5 m mesh) move it a metre from one
// sample to the next, read low: its PCT share 2 SM samples round) and by the nets (ln, never to be passed: the least of them 2 SM samples round):
// zero on SM samples at the hill's ends, its slope capped (L_SL), twice averaged over SM samples round (never above ln), its last TP samples at
// each end eased down to zero (there the wall goes on at the barrier line)
function smooth(lh, ln, ds) {
  const n = lh.length, t = new Float64Array(n), f = new Float64Array(n), g = new Float64Array(n), at = (a, k) => a[Math.max(0, Math.min(n - 1, k))];
  for (let k = 0; k < n; k++) { const w = []; let m = Infinity; for (let j = k - 2 * SM; j <= k + 2 * SM; j++) { w.push(at(lh, j)); m = Math.min(m, at(ln, j)); } w.sort((a, b) => a - b); t[k] = Math.min(w[Math.floor(PCT * (w.length - 1))], m); }
  for (let k = 0; k < Math.min(n, SM); k++) t[k] = t[n - 1 - k] = 0; for (let k = 1; k < n; k++) t[k] = Math.min(t[k], t[k - 1] + L_SL * ds); for (let k = n - 2; k >= 0; k--) t[k] = Math.min(t[k], t[k + 1] + L_SL * ds);
  const box = (a, b) => { for (let k = 0; k < n; k++) { let s = 0; for (let j = k - SM; j <= k + SM; j++) s += at(a, j); b[k] = s / (2 * SM + 1); } };
  box(t, f); box(f, g);
  for (let k = 0; k < n; k++) { const u = Math.max(0, Math.min(1, Math.min(k, n - 1 - k) / TP)); g[k] = Math.min(g[k], ln[k]) * u * u * (3 - 2 * u); }   // (the average of the least ones round: never above ln)
  return g;
}

// the hills from the ground read: runs [first sample, eight digits a sample: seven rises, the limit's change] per side, and [side, from (m
// after the start), length (m)]; why, per sample on a hill, its limit found is where it is (0 the height, 1 a net, 2 L_MAX), it and the limit
export function hills(raw) {
  const N = raw.n, out = [[], []], stats = [], why = [], at = (v, d) => v[DL.indexOf(d)];
  const net = [new Float32Array(N).fill(-1), new Float32Array(N).fill(-1)];
  for (const [sd, i, j, off] of raw.nets || []) for (let k = Math.max(0, i - 2); k < Math.min(N, j + 2); k++) { const n = net[sd > 0 ? 1 : 0]; n[k] = n[k] < 0 ? off : Math.min(n[k], off); }   // (a net's run and a sample on: its end post)
  for (const si of [0, 1]) {
    const on = new Uint8Array(N), H = new Array(N), wy = new Array(N);
    for (let i = 0; i < N; i++) { const v = raw.g[si][i]; if (!v) continue;
      const Y = [], q = [];   // (the heights as 5 cm steps; the first three as before (the verge drawn to 2.1 m), the rest just above the ground)
      for (let j = 0; j < D.length; j++) { const h = at(v, D[j]) + (j < 2 ? 0.05 : 0.03), p = j ? q[j - 1] : 0, n = j < 2 ? Math.ceil(Math.max(0, h) / 0.05 - 1e-6) : Math.round(h / 0.05); q.push(Math.max(p, Math.min(p + 61, n))); Y.push(q[j] * 0.05); }
      let L = L_MAX, w = 2;
      for (let j = 0; j < D.length; j++) if (Y[j] >= H_CAP) { const o0 = j ? D[j - 1] : 0, y0 = j ? Y[j - 1] : 0, o = o0 + (D[j] - o0) * (H_CAP - y0) / Math.max(1e-6, Y[j] - y0); if (o < L) { L = o; w = 0; } break; }
      for (let o = 0.05; o < L; o += 0.05) if (yAt(Y, o - TILT[0]) - yAt(Y, o - TILT[1]) > TILT[2]) { L = o - 0.05; w = 3; break; }   // (the car along the road with its corner there: its wheels across no steeper than TILT[2])
      const Ln = net[si][i] >= 0 ? net[si][i] - NET_CLR : L_MAX; if (Ln < L) w = 1;
      H[i] = q.map((n, j) => DIG[n - (j ? q[j - 1] : 0)]).join(''); wy[i] = [w, Math.min(L, Ln), L, Ln];
      if (at(v, 3) >= 0.6 && at(v, 6) >= 1.5 && Math.max(at(v, 6), at(v, 9), at(v, 12)) >= 3 && Math.min(at(v, 9), at(v, 13), at(v, 18)) >= 0.5) on[i] = 1; }
    for (let i = 0, last = -1; i < N; i++) if (on[i]) { if (last >= 0 && i - last > 1 && i - last <= 5) for (let k = last + 1; k < i; k++) if (H[k]) on[k] = 1; last = i; }   // (gaps up to 8 m)
    for (let i = 0; i < N;) { if (!on[i]) { i++; continue; } let j = i; while (j < N && on[j]) j++; if (j - i < RUN) for (let k = i; k < j; k++) on[k] = 0; i = j; }   // (runs under 24 m: too short to drive up, the barrier as elsewhere)
    for (let i = 0; i < N;) { if (!on[i]) { i++; continue; } let j = i; while (j < N && on[j]) j++;
      const lim = smooth(Float64Array.from({ length: j - i }, (_, k) => wy[i + k][2]), Float64Array.from({ length: j - i }, (_, k) => wy[i + k][3]), raw.ds);
      let s = '', c = 0; for (let k = 0; k < j - i; k++) { const n = Math.max(c - 31, Math.min(c + 30, Math.floor(lim[k] * 100 + 1e-6))); if (n > lim[k] * 100 + 1e-6) throw new Error('the limit falls too fast at ' + (i + k)); s += H[i + k] + DIG[n - c + 31]; c = n; why.push([si, i + k, wy[i + k][0], wy[i + k][1], n * 0.01]); }
      out[si].push([i, s]); stats.push([si ? 1 : -1, Math.round(i * raw.ds - raw.startS), Math.round((j - i) * raw.ds)]); i = j; }
  }
  return { n: N, L: out[0], R: out[1], stats, why };
}

export const line = (h) => `hills: { n: ${h.n}, d: ${JSON.stringify(D)}, L: ${JSON.stringify(h.L)}, R: ${JSON.stringify(h.R)} },`;   // (its line in the track file, 4 spaces in)
export const fileLine = () => { const m = fs.readFileSync(FILE, 'utf8').match(/^ {4}hills: \{.*\},$/m); return m ? m[0].slice(4) : null; };

if (path.resolve(process.argv[1] || '') === url.fileURLToPath(import.meta.url)) {
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const mode = process.argv.includes('--check') ? 'check' : process.argv.includes('--stats') ? 'stats' : 'write';
let raw;
if (arg('--from')) raw = JSON.parse(fs.readFileSync(arg('--from'), 'utf8'));
else {
  const srv = await serve(REPO), browser = await launch();
  try {
    const { page } = await openGame(browser, srv.base + '/index.html', { quality: 'high', camera: 'chase', weather: 'dry', tod: 'day', season: 'summer' }, { width: 480, height: 270 }, { seed: 11 });
    await page.goto(srv.base + '/index.html?proga=chapman&t=0.5');
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done && typeof Render !== 'undefined' && Render.world && Render.world.hillProbe, null, { timeout: 300000 });
    raw = await page.evaluate(probe, DL);
  } finally { await browser.close(); srv.close && srv.close(); }
  if (arg('--save')) fs.writeFileSync(arg('--save'), JSON.stringify(raw));
}
const h = hills(raw), ln = line(h);
const src = fs.readFileSync(FILE, 'utf8'), m = src.match(/^ {4}hills: \{.*\},$/m);
let code = 0;
if (mode === 'stats') {
  const pc = (a) => { a = a.slice().sort((x, y) => x - y); return [0.1, 0.25, 0.5, 0.75, 0.9].map(f => a[Math.floor(f * (a.length - 1))].toFixed(2)).join(' '); };
  for (const si of [0, 1]) { const w = h.why.filter(x => x[0] === si); if (!w.length) continue;
    console.log(`${si ? 'right' : 'left '}: ${w.length} samples on a hill; the limit found / the limit (m past the barrier line), 10/25/50/75/90 %: ${pc(w.map(x => x[3]))} / ${pc(w.map(x => x[4]))}; found by the height ${w.filter(x => x[2] === 0).length}, the tilt ${w.filter(x => x[2] === 3).length}, a net ${w.filter(x => x[2] === 1).length}, ${L_MAX} m ${w.filter(x => x[2] === 2).length}; the most change a sample ${Math.max(...w.map((x, k) => k && w[k - 1][1] === x[1] - 1 ? Math.abs(x[4] - w[k - 1][4]) : 0)).toFixed(2)} m`); }
  for (const s0 of [521, 893, 2133]) console.log(`s=${s0} m: ` + [-1, 1].map(sd => { const si = sd > 0 ? 1 : 0, i = Math.round((s0 + raw.startS) / raw.ds), x = h.why.find(y => y[0] === si && y[1] === i); return (sd < 0 ? 'left ' : 'right ') + (x ? `hill, limit ${x[4].toFixed(2)} m (found ${x[3].toFixed(2)} m, ${['height', 'net', 'most', 'tilt'][x[2]]})` : '-'); }).join(', '));
  for (const sd of [-1, 1]) { const r = h.stats.filter(x => x[0] === sd); console.log(`${sd < 0 ? 'left ' : 'right'}: ${r.length} hills, ${r.reduce((a, x) => a + x[2], 0)} m of ${raw.len.toFixed(0)} m: ` + r.map(x => `${x[1]}+${x[2]}`).join(' ')); }
} else if (mode === 'check') {
  if (!m) { console.log('FAIL chapman-hribi: no def.hills in js/tracks/chapman.js (node tools/chapman-hribi.mjs writes it)'); code = 1; }
  else if (m[0] !== '    ' + ln) { console.log('FAIL chapman-hribi: def.hills is not what the terrain gives now (node tools/chapman-hribi.mjs writes it anew)'); code = 1; }
  else console.log('OK chapman-hribi: def.hills is the terrain\'s');
} else {
  const out = m ? src.replace(m[0], '    ' + ln) : src.replace(/^( {4}toll: .*\n)/m, '$1    // (def.hills: tools/chapman-hribi.mjs)\n    ' + ln + '\n');
  if (out === src && !m) throw new Error('no place for def.hills in ' + FILE);
  fs.writeFileSync(FILE, out); console.log(`def.hills: ${h.stats.length} hills, ${h.stats.reduce((a, x) => a + x[2], 0)} m (both sides) written to js/tracks/chapman.js`);
}
process.exit(code);
}
