// Pikes Peak, ZDA: the precomputed terrain grid in the track file (def.teren in js/tracks/pikes.js; pkPre in js/world-pikes.js). The world build
// reads ~200 thousand vertices of the 5 m height grid; pkH for each of them is most of a second on a phone, so the track file brings them along.
//   node tools/pikes-teren.mjs            write def.teren (after a change of Pikes' road, its pads, its lake or pkH, pkNear and what they read)
//   node tools/pikes-teren.mjs --check    exit 1 when def.teren is not what the build gives now (tests/browser/world.test.mjs checks that the game
//                                         takes it, G.pre 'ok', and that the build computed no vertex itself, G.lzb 0)
// The vertices are those the builds of 'pikes' and 'pikesg' read (the same road and grid), each as pkQ gives it: the height and dd (distance
// beyond the barrier) to the cm, before the lake's basin is carved (the build still carves it). The encoding: pkPre's comment.
import fs from 'fs';
import path from 'path';
import { serve, launch, openGame, startTrack, REPO } from '../tests/browser/lib.mjs';

const FILE = path.join(REPO, 'js', 'tracks', 'pikes.js'), check = process.argv.includes('--check');
const RE = /^ {4}teren: \{.*\},$/m;

function encode(o) {
  const B = [], vu = (u) => { while (u >= 128) { B.push((u % 128) | 128); u = Math.floor(u / 128); } B.push(u); }, vz = (v) => vu(v >= 0 ? 2 * v : -2 * v - 1);
  const W = o.g[2], n = o.k.length, has = new Uint8Array(W * o.g[3]), hc = new Int32Array(W * o.g[3]);
  const runs = []; let k = 0;   // the runs of the vertices it has: off, on, off ...
  for (let c = 0; c < n;) { const k0 = o.k[c]; runs.push(k0 - k); let e = c; while (e + 1 < n && o.k[e + 1] === o.k[e] + 1) e++; runs.push(e - c + 1); k = o.k[e] + 1; c = e + 1; }
  vu(runs.length); runs.forEach(vu);
  for (let c = 0; c < n; c++) { const k = o.k[c], i = k % W, L = i > 0 && has[k - 1], U = k >= W && has[k - W], UL = L && U && has[k - W - 1];
    vz(o.h[c] - (UL ? hc[k - 1] + hc[k - W] - hc[k - W - 1] : L ? hc[k - 1] : U ? hc[k - W] : 0)); has[k] = 1; hc[k] = o.h[c]; }
  const dr = []; for (let c = 0, cur = true; c < n;) { let e = c; while (e < n && (o.d[e] === null) === cur) e++; dr.push(e - c); c = e; cur = !cur; }   // (runs of 999 and not)
  vu(dr.length); dr.forEach(vu);
  for (let c = 0, v = 0; c < n; c++) if (o.d[c] !== null) { vz(o.d[c] - v); v = o.d[c]; }
  return Buffer.from(B).toString('base64');
}

const srv = await serve(), browser = await launch();
let o;
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2 }, undefined, { init: () => { window.__pkTerenOff = 1; } });
  const got = [];
  for (const id of ['pikes', 'pikesg']) { await startTrack(page, id); got.push(await page.evaluate(() => World.api.pkTeren())); }
  if (errors.length) throw new Error(errors.join('\n'));
  if (!got[0]) throw new Error('no grid from the build (window.__pkTerenOff, G.mb)');
  if (got[1] && JSON.stringify(got[1].g) !== JSON.stringify(got[0].g)) throw new Error('pikesg has another grid than pikes: ' + got[1].g + ' / ' + got[0].g);
  const M = new Map(); for (const g of got) if (g) g.k.forEach((k, c) => { const v = [g.h[c], g.d[c]], w = M.get(k); if (w && (w[0] !== v[0] || w[1] !== v[1])) throw new Error('pikes and pikesg differ at vertex ' + k); M.set(k, v); });
  const ks = [...M.keys()].sort((a, b) => a - b);
  o = { g: got[0].g, k: ks, h: ks.map(k => M.get(k)[0]), d: ks.map(k => M.get(k)[1]) };
} finally { await browser.close(); srv.close && srv.close(); }

const line = `teren: { g: ${JSON.stringify(o.g)}, n: ${o.k.length}, d: '${encode(o)}' },`;
const src = fs.readFileSync(FILE, 'utf8'), m = src.match(RE);
if (check) {
  const ok = m && m[0].slice(4) === line;
  console.log(ok ? 'OK def.teren' : 'FAIL def.teren is not what the build gives now (node tools/pikes-teren.mjs)');
  process.exit(ok ? 0 : 1);
}
const out = m ? src.replace(m[0], () => '    ' + line) : src.replace(/^( {4}points: )/m, () => '    // (def.teren: the precomputed terrain grid, tools/pikes-teren.mjs)\n    ' + line + '\n    points: ');
fs.writeFileSync(FILE, out);
console.log(`def.teren: ${o.k.length} vertices, ${line.length} bytes, written to js/tracks/pikes.js`);
