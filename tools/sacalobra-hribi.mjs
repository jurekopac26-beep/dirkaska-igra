// Sa Calobra, Španija: the ground behind the barrier line where no wall stands (def.hills in js/tracks/sacalobra.js; Track.hill in js/core.js;
// the rule and the soft limit as Chapman's, tools/chapman-hribi.mjs). The user's report of 13. 11. 2026 (s ≈ 1141 m, on the right): »zbriši
// vdolbljeno korito, ki je ostalo. Še vedno se zabijem v nevidno ograjo, čeprav ograje ni več«: where no rail and no wall is drawn (the stone
// parapets: the bends' outsides, the drops, the bridges; buildPrelaz's railNeed) the verge runs on at the road's height into the ground, no
// ditch, and no hard wall at the barrier line: a hill on every such stretch, level ground included (lv: its soft limit up to where the
// hill's foot would float above falling ground, at most L_MAX, short of what stands there: the start's banner and pennants, the finish's
// posts, the signs and chevrons, the parked cars, the trees and blocks by the road (hillProbe.holds, as Chapman's nets)).
//   node tools/sacalobra-hribi.mjs            write def.hills (after a change of the terrain, the road, its barrier lines or its walls)
//   node tools/sacalobra-hribi.mjs --check    exit 1 when def.hills is not what the terrain gives now (tests/browser/world.test.mjs)
//   node tools/sacalobra-hribi.mjs --stats    the stretches with a hill, per side; --save <file> / --from <file> as chapman-hribi
import fs from 'fs';
import path from 'path';
import url from 'url';
import { serve, launch, openGame, REPO } from '../tests/browser/lib.mjs';
import { DL, hills, line } from './chapman-hribi.mjs';

const FILE = path.join(REPO, 'js', 'tracks', 'sacalobra.js');

export function probe(DL) {
  const T = window.__game.race.track, P = Render.world.hillProbe, N = T.N;
  const g = [[], []], lv = [new Uint8Array(N), new Uint8Array(N)], end = Math.ceil(8 / T.ds);   // (not the road's first and last 8 m: its closed ends)
  for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0;
    for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i], no = i < end || i > N - 1 - end || P.skip(i, side);
      g[si].push(no ? null : DL.map(d => +P.g(i, side, bar + d).toFixed(3))); if (!no) lv[si][i] = 1; } }
  // (what stands past the line: [side, first sample, last sample, its near face's distance past the line], as Chapman's nets)
  const nets = [];
  for (const [x, z, r] of P.holds) { let bi = 0, bd = Infinity; for (let i = 0; i < N; i += 1) { const d = (x - T.px[i]) ** 2 + (z - T.pz[i]) ** 2; if (d < bd) { bd = d; bi = i; } }
    const u = (x - T.px[bi]) * T.nx[bi] + (z - T.pz[bi]) * T.nz[bi], side = u > 0 ? 1 : -1, bar = side > 0 ? T.br[bi] : T.bl[bi], off = Math.abs(u) - bar - r;
    if (off > 6.5) continue; const k = Math.ceil(r / T.ds);
    nets.push([side, Math.max(0, bi - k), Math.min(N - 1, bi + k), +Math.max(0, off).toFixed(3)]); }
  return { n: N, ds: T.ds, startS: T.startS, len: T.raceLen, g, nets, lv: lv.map(a => Array.from(a)) };
}

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
    await page.goto(srv.base + '/index.html?proga=sacalobra&t=0.5');
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done && typeof Render !== 'undefined' && Render.world && Render.world.hillProbe, null, { timeout: 300000 });
    raw = await page.evaluate(probe, DL);
  } finally { await browser.close(); srv.close && srv.close(); }
  if (arg('--save')) fs.writeFileSync(arg('--save'), JSON.stringify(raw));
}
const h = hills(raw), ln = line(h);
const src = fs.readFileSync(FILE, 'utf8'), m = src.match(/^ {4}hills: \{.*\},$/m);
let code = 0;
if (mode === 'stats') {
  for (const sd of [-1, 1]) { const r = h.stats.filter(x => x[0] === sd); console.log(`${sd < 0 ? 'left ' : 'right'}: ${r.length} hills, ${r.reduce((a, x) => a + x[2], 0)} m of ${raw.len.toFixed(0)} m: ` + r.map(x => `${x[1]}+${x[2]}`).join(' ')); }
} else if (mode === 'check') {
  if (!m) { console.log('FAIL sacalobra-hribi: no def.hills in js/tracks/sacalobra.js (node tools/sacalobra-hribi.mjs writes it)'); code = 1; }
  else if (m[0] !== '    ' + ln) { console.log('FAIL sacalobra-hribi: def.hills is not what the terrain gives now (node tools/sacalobra-hribi.mjs writes it anew)'); code = 1; }
  else console.log('OK sacalobra-hribi: def.hills is the terrain\'s');
} else {
  const out = m ? src.replace(m[0], '    ' + ln) : src.replace(/^( {4}pulls: .*\n)/m, '$1    // (def.hills: tools/sacalobra-hribi.mjs)\n    ' + ln + '\n');
  if (out === src && !m) throw new Error('no place for def.hills in ' + FILE);
  fs.writeFileSync(FILE, out); console.log(`def.hills: ${h.stats.length} hills, ${h.stats.reduce((a, x) => a + x[2], 0)} m (both sides) written to js/tracks/sacalobra.js`);
}
process.exit(code);
}
