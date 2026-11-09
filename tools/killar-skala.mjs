// Killar, Indija: the rock beside the road (def.rock in js/tracks/killar.js, Track.rock in js/core.js; the user's decisions of 9. 11. 2026
// between ~18.10 and ~18.20: no barrier on the right, not even an invisible one; where the cut beside the road is steep, the rock itself stops
// the car, as a wall of the terrain, so that it does not drive into the mountain; where the slope can be driven, the 10 m rule, Race._offRoad).
// Reads the ground the game draws (Render.world.groundH, the world of js/world-killar.js: the road's corridor, its cuts and the terrain from
// the elevation model) and the houses (def.bld, as the world places them) every 2.5 m along the whole road on both sides, and writes the line
// where the car meets them into the track's file:
//   - a house: its wall (the footprint 0.2 m out);
//   - a steep cut: where the ground is 0.5 m above the road and rises at least 0.35 m in the next metre;
//   - any slope: where the ground is 1 m above the road (the car keeps the road's height off it: no deeper into the ground);
// only within 11 m of the road's edge and only runs that come within 10 m of it (beyond 10 m the car is put back on the road anyway), at least 1.5 m past the barrier's line (bl / br:
// the room the autopilot keeps), the line eased along the road (no steeper than 1 in 2 against it: the car slides along a wall's start).
//   node tools/killar-skala.mjs            writes the line rock: [...] in js/tracks/killar.js (the browser: Playwright's Chromium)
//   node tools/killar-skala.mjs --check    only says how far the file's line is from the ground drawn now (exit 1 if more than 0.3 m)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch, openGame } from '../tests/browser/lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), FILE = path.join(ROOT, 'js/tracks/killar.js');
const check = process.argv.includes('--check'), STEP = 2.5;
const browser = await launch();
const srv = await serve(ROOT);
let rows, S0;
try {
  const { page } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 0, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer' }, { width: 640, height: 360 }, { seed: 11 });
  await page.goto(srv.base + '/index.html?proga=killar&nacin=kronometer&t=0.5');
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
  ({ rows, S0 } = await page.evaluate((STEP) => {
    const T = window.__game.race.track, G = Render.world.groundH, D = T.def, out = [];
    const blds = [];   // the houses as the world places them (js/world-killar.js: 2.5 m a side at least, clear of the barrier's line by 1.5 m)
    for (const b of D.bld || []) {
      const [x, z, L, W, ang] = b; if (L < 2.5 || W < 2.5) continue;
      const c = Math.cos(ang), s = Math.sin(ang); let ok = true;
      for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const q = T.query(x + c * u - s * v, z + s * u + c * v, -1); if (q.i >= 0 && Math.abs(q.d) - (q.d > 0 ? q.br : q.bl) < 1.5) ok = false; }
      if (ok) blds.push({ x, z, c, s, hl: L / 2 + 0.2, hw: W / 2 + 0.2 });
    }
    const inBld = (x, z) => blds.some(B => { const dx = x - B.x, dz = z - B.z; return Math.abs(dx * B.c + dz * B.s) <= B.hl && Math.abs(-dx * B.s + dz * B.c) <= B.hw; });
    for (let s = 0; s <= T.len - 0.5; s += STEP) {
      const f = s / T.ds, i = Math.min(T.N - 2, Math.floor(f)), u = f - i, L = (A) => A[i] + (A[i + 1] - A[i]) * u;
      const px = L(T.px), pz = L(T.pz), nx = L(T.nx), nz = L(T.nz), hy = L(T.hy), row = { s, w: [0, 0], b: [L(T.bl), L(T.br)] };
      for (const sd of [-1, 1]) {
        const k = sd > 0 ? 1 : 0, o0 = row.b[k] + 1.5, gh = (o) => G(px + nx * sd * o, pz + nz * sd * o) - hy;
        for (let o = o0; o <= T.w + 11.001; o += 0.25) {
          const x = px + nx * sd * o, z = pz + nz * sd * o, h = gh(o);
          if (inBld(x, z) || (h >= 0.5 && gh(o + 1) - h >= 0.35) || h >= 1) { row.w[k] = o; break; }
        }
      }
      out.push(row);
    }
    return { rows: out, S0: T.startS };
  }, STEP));
} finally { await browser.close(); srv.close(); }

// eased along the road: no wall's line nearer the road than its neighbours' by more than half the way between them (a wall's start: a slope)
const n = rows.length, INF = 1e9;
const lines = [0, 1].map(k => rows.map(r => r.w[k] > 0 ? r.w[k] : INF));
for (const W of lines) for (let pass = 0; pass < 2; pass++) {
  for (let j = 1; j < n; j++) W[j] = Math.min(W[j], W[j - 1] + STEP / 2);
  for (let j = n - 2; j >= 0; j--) W[j] = Math.min(W[j], W[j + 1] + STEP / 2);
}
// the runs: [side (-1 left, 1 right), metres after the start line of the first, [the line's distance from the road's middle, in decimetres, every 2.5 m]]
const W_ROAD = 4.5, runs = [];
for (const [k, W] of lines.entries()) {
  let cur = null;
  for (let j = 0; j < n; j++) {
    const on = W[j] <= W_ROAD + 11.5;
    if (on) { if (!cur) { cur = [k ? 1 : -1, rows[j].s, []]; runs.push(cur); } cur[2].push(Math.round(W[j] * 10)); }
    else cur = null;
  }
}
const src = fs.readFileSync(FILE, 'utf8');
for (let j = runs.length - 1; j >= 0; j--) if (Math.min(...runs[j][2]) > (W_ROAD + 10) * 10) runs.splice(j, 1);   // (none nearer than 10 m past the edge: the 10 m rule)
for (const r of runs) r[1] = +(r[1] - S0).toFixed(1);
const total = runs.reduce((a, r) => a + r[2].length * STEP, 0), right = runs.filter(r => r[0] > 0).reduce((a, r) => a + r[2].length * STEP, 0);
console.log(`${runs.length} runs of rock or houses within 11 m of the road's edge, ${total} m (${right} m on the right)`);
const line = '    rock: ' + JSON.stringify(runs) + ',';
const re = /^    rock: \[.*\],$/m;
if (check) {
  const m = re.exec(src); if (!m) { console.log('FAIL js/tracks/killar.js has no rock line'); process.exit(1); }
  const old = JSON.parse(m[0].replace(/^    rock: /, '').replace(/,$/, '')), at = (R, side, d) => { for (const [sd, a, v] of R) if (sd === side) { const j = Math.round((d - a) / STEP); if (j >= 0 && j < v.length) return v[j] / 10; } return 0; };
  let worst = 0, wd = null;
  for (const side of [-1, 1]) for (let d = -S0; d < rows[n - 1].s - S0; d += STEP) { const a = at(old, side, d), b = at(runs, side, d); if (!a !== !b) { if (Math.abs((a || 16) - (b || 16)) > worst) { worst = Math.abs((a || 16) - (b || 16)); wd = [side, d]; } } else if (Math.abs(a - b) > worst) { worst = Math.abs(a - b); wd = [side, d]; } }
  console.log(`${worst <= 0.3 ? 'OK' : 'FAIL'} the file's line is within ${worst.toFixed(2)} m of the ground drawn now${wd ? ` (worst: side ${wd[0]}, ${wd[1].toFixed(1)} m after the start line)` : ''}`);
  process.exit(worst <= 0.3 ? 0 : 1);
}
if (re.test(src)) fs.writeFileSync(FILE, src.replace(re, line));
else {
  const m = /^    fence: .*\n/m.exec(src); if (!m) { console.error('js/tracks/killar.js: no fence line to put the rock after'); process.exit(2); }
  const at = m.index + m[0].length; fs.writeFileSync(FILE, src.slice(0, at) + line + '\n' + src.slice(at));   // (its comment above it by hand)
}
console.log('written', path.relative(ROOT, FILE));
