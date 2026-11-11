// Chapman's Peak, Južna Afrika: the hills behind the barrier line (def.hills in js/tracks/chapman.js; Track.hill in js/core.js). The user's
// request of 11. 11. 2026: where the ground rises behind the barrier, no fence and no ditch, and the car may drive up onto the hill's foot.
// The game's physics needs the height of that ground also in the Node tests, which build no world: this tool reads it from the terrain the
// game draws (buildChapman's hillProbe: the 5 m ground mesh, its triangles) and writes it into the track file.
//   node tools/chapman-hribi.mjs            write def.hills (after a change of Chapman's terrain, its road or its barrier lines)
//   node tools/chapman-hribi.mjs --check    exit 1 when def.hills is not what the terrain gives now (tests/browser/world.test.mjs checks it too)
//   node tools/chapman-hribi.mjs --stats    the hills found, per side, and where the car's way up ends
//   --save <file> / --from <file>           the terrain read from the game kept in a file / taken from it (no browser: trying the rule)
// The rule (hills below): a side of a sample is a hill where the ground behind the barrier rises (0.6 m and more 3 m out, 1.5 m 6 m out, 3 m
// somewhere 6-12 m out) and does not fall back below the road within 18 m (not a bank on the sea side with the cliff right behind it), not on
// the bridge, at a side road's mouth, at a view point's lay-by, at the toll plaza or by the start and the finish; runs shorter than 12 m
// dropped, gaps up to 8 m filled. Its heights at three points out from the barrier line (HILL_D in js/core.js: 0.3, 1.2 and 2.1 m; from 0.7 m
// inside it the verge at the road's height): the ground there, never falling outwards (the ditch filled), in 5 cm steps (DIG).
import fs from 'fs';
import path from 'path';
import url from 'url';
import { serve, launch, openGame, REPO } from '../tests/browser/lib.mjs';

const FILE = path.join(REPO, 'js', 'tracks', 'chapman.js');
const DIG = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';   // (a height in 5 cm steps: 0-61, 0 to 3.05 m)
export const DL = [0.3, 1.2, 2.1, 3, 6, 9, 12, 13, 18];   // (where the ground is read, m out from the barrier line)

// in the page: the ground behind the barrier line of every sample, per side ([0] left, [1] right), at DL; null where no hill may be
export function probe(DL) {
  const T = window.__game.race.track, def = T.def, P = Render.world.hillProbe, N = T.N;
  const ban = [new Uint8Array(N), new Uint8Array(N)], banR = (s0, s1, sd) => { for (let i = Math.max(0, T.idx(T.startS + s0)); i <= Math.min(N - 1, T.idx(T.startS + s1)); i++) { if (sd <= 0) ban[0][i] = 1; if (sd >= 0) ban[1][i] = 1; } };
  for (let i = 0; i < N; i++) if (i < T.idx(T.startS + 30) || i > T.idx(T.finishS - 20)) ban[0][i] = ban[1][i] = 1;   // (the start's beach and the finish's view point: as the walls)
  for (const [s, sd] of def.views || []) banR(s - 14, s + 14, sd);   // (a view point's lay-by)
  if (def.toll != null) banR(def.toll - 30, def.toll + 30, 0);   // (the toll plaza's booths)
  const g = [[], []];
  for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0;
    for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i]; g[si].push(ban[si][i] || P.skip(i, side) ? null : DL.map(d => +P.g(i, side, bar + d).toFixed(3))); } }
  return { n: N, ds: T.ds, startS: T.startS, len: T.raceLen, g };
}

// the hills from the ground read: runs [first sample, three digits a sample] per side, and [side, from (m after the start), length (m)]
export function hills(raw) {
  const N = raw.n, out = [[], []], stats = [], at = (v, d) => v[DL.indexOf(d)];
  const dig = (h, up) => DIG[Math.max(0, Math.min(61, up ? Math.ceil(h / 0.05 - 1e-6) : Math.round(h / 0.05)))];
  for (const si of [0, 1]) {
    const on = new Uint8Array(N), H = new Array(N);
    for (let i = 0; i < N; i++) { const v = raw.g[si][i]; if (!v) continue;
      const h1 = Math.max(0, at(v, 0.3) + 0.05), h2 = Math.max(h1, at(v, 1.2) + 0.05), h3 = Math.max(h2, at(v, 2.1) + 0.03);
      H[i] = dig(h1, true) + dig(h2, true) + dig(h3, false);
      if (at(v, 3) >= 0.6 && at(v, 6) >= 1.5 && Math.max(at(v, 6), at(v, 9), at(v, 12)) >= 3 && Math.min(at(v, 9), at(v, 13), at(v, 18)) >= 0.5) on[i] = 1; }
    for (let i = 0, last = -1; i < N; i++) if (on[i]) { if (last >= 0 && i - last > 1 && i - last <= 5) for (let k = last + 1; k < i; k++) if (H[k]) on[k] = 1; last = i; }   // (gaps up to 8 m)
    for (let i = 0; i < N;) { if (!on[i]) { i++; continue; } let j = i; while (j < N && on[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) on[k] = 0; i = j; }   // (runs under 12 m)
    for (let i = 0; i < N;) { if (!on[i]) { i++; continue; } let j = i, s = ''; while (j < N && on[j]) s += H[j++]; out[si].push([i, s]); stats.push([si ? 1 : -1, Math.round(i * raw.ds - raw.startS), Math.round((j - i) * raw.ds)]); i = j; }
  }
  return { n: N, L: out[0], R: out[1], stats };
}

export const line = (h) => `hills: { n: ${h.n}, L: ${JSON.stringify(h.L)}, R: ${JSON.stringify(h.R)} },`;   // (its line in the track file, 4 spaces in)
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
  const hw = [], D = [-0.7, 0.3, 1.2, 2.1];   // (the car's way up: where the ground is 0.9 m high, HILL_W in js/core.js)
  for (const runs of [h.L, h.R]) for (const [, s] of runs) for (let k = 0; k < s.length; k += 3) { const y = [0, ...[0, 1, 2].map(j => DIG.indexOf(s[k + j]) * 0.05)]; let o = 2.1; for (let j = 1; j < 4; j++) if (y[j] >= 0.9) { o = D[j - 1] + (D[j] - D[j - 1]) * (0.9 - y[j - 1]) / Math.max(1e-6, y[j] - y[j - 1]); break; } hw.push(o); }
  hw.sort((a, b) => a - b); console.log('the way up ends (m past the barrier line, the ground 0.9 m high), 10/25/50/75/90 %:', [0.1, 0.25, 0.5, 0.75, 0.9].map(f => hw[Math.floor(f * (hw.length - 1))].toFixed(2)).join(' '), '; at 2.1 m (lower):', hw.filter(o => o >= 2.1).length + '/' + hw.length);
  for (const s0 of [521, 893, 2133]) console.log(`s=${s0} m: ` + [-1, 1].map(sd => (sd < 0 ? 'left ' : 'right ') + (h.stats.some(x => x[0] === sd && s0 >= x[1] && s0 <= x[1] + x[2]) ? 'hill' : '-')).join(', '));
  for (const sd of [-1, 1]) { const r = h.stats.filter(x => x[0] === sd); console.log(`${sd < 0 ? 'left ' : 'right'}: ${r.length} hills, ${r.reduce((a, x) => a + x[2], 0)} m of ${raw.len.toFixed(0)} m: ` + r.map(x => `${x[1]}+${x[2]}`).join(' ')); }
} else if (mode === 'check') {
  if (!m) { console.log('FAIL chapman-hribi: no def.hills in js/tracks/chapman.js (node tools/chapman-hribi.mjs writes it)'); code = 1; }
  else if (m[0] !== '    ' + ln) { console.log('FAIL chapman-hribi: def.hills is not what the terrain gives now (node tools/chapman-hribi.mjs writes it anew)'); code = 1; }
  else console.log('OK chapman-hribi: def.hills is the terrain\'s');
} else {
  const out = m ? src.replace(m[0], '    ' + ln) : src.replace(/^( {4}toll: .*\n)/m, '$1    // the hills behind the barrier line (tools/chapman-hribi.mjs writes it from the terrain; Track.hill): no fence, no ditch, the car up onto\n    // the hill\'s foot. n: the samples; L, R: the left and the right side, runs [first sample, three heights a sample (HILL_D), 5 cm steps]\n    ' + ln + '\n');
  if (out === src && !m) throw new Error('no place for def.hills in ' + FILE);
  fs.writeFileSync(FILE, out); console.log(`def.hills: ${h.stats.length} hills, ${h.stats.reduce((a, x) => a + x[2], 0)} m (both sides) written to js/tracks/chapman.js`);
}
process.exit(code);
}
