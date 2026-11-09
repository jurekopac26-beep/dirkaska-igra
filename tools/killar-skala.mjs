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
// And the ground a car falls onto where it goes over the edge (def.floor, Track.floor, Race._fall; the user's report of 9. 11. 2026 at ~23.48: the
// car fell into the slope and was gone): the terrain grid's own vertices (World.api.VR.G, 5 m cells, the heights the world draws its tiles from:
// unGround's two triangles per cell, rebuilt as they are in Track.floorAt) in the band where a falling car can be, from 6 m inside the barrier's
// line to 30 m past it, along the sides a car goes over (Track.fallAt) and 30 m on past their ends.
//   node tools/killar-skala.mjs            writes the lines rock: [...] and floor: {...} in js/tracks/killar.js (the browser: Playwright's Chromium)
//   node tools/killar-skala.mjs --check    only says how far the file's lines are from the ground drawn now (exit 1 if more than 0.3 m)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch, openGame } from '../tests/browser/lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), FILE = path.join(ROOT, 'js/tracks/killar.js');
const check = process.argv.includes('--check'), STEP = 2.5;
const browser = await launch();
const srv = await serve(ROOT);
let rows, S0, fl;
try {
  const { page } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 0, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer' }, { width: 640, height: 360 }, { seed: 11 });
  await page.goto(srv.base + '/index.html?proga=killar&nacin=kronometer&t=0.5');
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
  ({ rows, S0, fl } = await page.evaluate((STEP) => {
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
    // the ground under a falling car (def.floor): the grid's vertices round every cell the band touches, their heights as the world has them
    const Gd = World.api.VR.G, C = 5, F = T.fallAt, set = new Set(), V = [];
    const near = [0, 1].map(k => { const A = new Uint8Array(T.N); for (let i = 0; i < T.N; i++) if (F[k][i]) for (let j = Math.max(0, i - 15); j <= Math.min(T.N - 1, i + 15); j++) A[j] = 1; return A; });
    for (let s = 0; s <= T.len - 0.5; s += 1) {
      const f = s / T.ds, i = Math.min(T.N - 2, Math.floor(f)), u = f - i, L = (A) => A[i] + (A[i + 1] - A[i]) * u;
      for (const k of [0, 1]) {
        if (!near[k][i]) continue;
        const sd = k ? 1 : -1, px = L(T.px), pz = L(T.pz), nx = L(T.nx), nz = L(T.nz), b = L(k ? T.br : T.bl);
        for (let o = b - 6; o <= b + 30.01; o += 2) {
          const gi = Math.floor((px + nx * sd * o - Gd.x0) / C), gj = Math.floor((pz + nz * sd * o - Gd.z0) / C);
          for (const [a, c] of [[0, 0], [1, 0], [0, 1], [1, 1]]) set.add((gj + c) * 65536 + gi + a);
        }
      }
    }
    for (const key of set) { const i = key % 65536, j = Math.floor(key / 65536); G(Gd.x0 + i * C + 0.001, Gd.z0 + j * C + 0.001); V.push([i, j, Gd.h[j * Gd.nx + i]]); }   // (groundH there works the vertex's height out once)
    return { rows: out, S0: T.startS, fl: { x0: Gd.x0, z0: Gd.z0, c: C, V } };
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
// the floor's line: { x0, z0, c, v: [[j, i0, base, heights]] }, the grid's rows j from column i0 on, each vertex's height over base (decimetres) in
// decimetres, two characters of base64url each (Track's floor: up to 409.5 m over base; a row's run split where it would not fit)
const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', byRow = new Map();
for (const [i, j, h] of fl.V) (byRow.get(j) || byRow.set(j, []).get(j)).push([i, h]);
const fv = [];
for (const [j, L] of [...byRow.entries()].sort((a, b) => a[0] - b[0])) {
  L.sort((a, b) => a[0] - b[0]);
  let cur = null;
  for (const [i, h] of L) {
    const dm = Math.round(h * 10);
    if (cur && i === cur.e + 1 && Math.max(cur.hi, dm) - Math.min(cur.lo, dm) <= 4095) { cur.h.push(dm); cur.e = i; cur.lo = Math.min(cur.lo, dm); cur.hi = Math.max(cur.hi, dm); }
    else { cur = { j, i0: i, e: i, h: [dm], lo: dm, hi: dm }; fv.push(cur); }
  }
}
const floor = { x0: +fl.x0.toFixed(3), z0: +fl.z0.toFixed(3), c: fl.c, v: fv.map(r => [r.j, r.i0, r.lo, r.h.map(d => A64[(d - r.lo) >> 6] + A64[(d - r.lo) & 63]).join('')]) };
console.log(`${fl.V.length} vertices of the ground under a falling car (${fv.length} runs)`);
const src = fs.readFileSync(FILE, 'utf8');
for (let j = runs.length - 1; j >= 0; j--) if (Math.min(...runs[j][2]) > (W_ROAD + 10) * 10) runs.splice(j, 1);   // (none nearer than 10 m past the edge: the 10 m rule)
for (const r of runs) r[1] = +(r[1] - S0).toFixed(1);
const total = runs.reduce((a, r) => a + r[2].length * STEP, 0), right = runs.filter(r => r[0] > 0).reduce((a, r) => a + r[2].length * STEP, 0);
console.log(`${runs.length} runs of rock or houses within 11 m of the road's edge, ${total} m (${right} m on the right)`);
const line = '    rock: ' + JSON.stringify(runs) + ',';
const re = /^    rock: \[.*\],$/m;
const fline = '    floor: ' + JSON.stringify(floor) + ',', reF = /^    floor: \{.*\},$/m;
if (check) {
  const m = re.exec(src); if (!m) { console.log('FAIL js/tracks/killar.js has no rock line'); process.exit(1); }
  const old = JSON.parse(m[0].replace(/^    rock: /, '').replace(/,$/, '')), at = (R, side, d) => { for (const [sd, a, v] of R) if (sd === side) { const j = Math.round((d - a) / STEP); if (j >= 0 && j < v.length) return v[j] / 10; } return 0; };
  let worst = 0, wd = null;
  for (const side of [-1, 1]) for (let d = -S0; d < rows[n - 1].s - S0; d += STEP) { const a = at(old, side, d), b = at(runs, side, d); if (!a !== !b) { if (Math.abs((a || 16) - (b || 16)) > worst) { worst = Math.abs((a || 16) - (b || 16)); wd = [side, d]; } } else if (Math.abs(a - b) > worst) { worst = Math.abs(a - b); wd = [side, d]; } }
  console.log(`${worst <= 0.3 ? 'OK' : 'FAIL'} the file's rock line is within ${worst.toFixed(2)} m of the ground drawn now${wd ? ` (worst: side ${wd[0]}, ${wd[1].toFixed(1)} m after the start line)` : ''}`);
  // the floor: every vertex of the band now in the file, at the height drawn now
  const fm = reF.exec(src); let fw = 0, miss = 0, fok = false;
  if (fm) {
    const F = JSON.parse(fm[0].replace(/^    floor: /, '').replace(/,$/, '')), M = new Map();
    for (const [j, i0, b, s] of F.v) for (let k = 0; 2 * k < s.length; k++) M.set(j * 65536 + i0 + k, (b + A64.indexOf(s[2 * k]) * 64 + A64.indexOf(s[2 * k + 1])) / 10);
    for (const [i, j, h] of fl.V) { const o = M.get(j * 65536 + i); if (o === undefined) miss++; else fw = Math.max(fw, Math.abs(o - h)); }
    fok = Math.abs(F.x0 - fl.x0) < 0.01 && Math.abs(F.z0 - fl.z0) < 0.01 && F.c === fl.c && !miss && fw <= 0.3;
  }
  console.log(`${fok ? 'OK' : 'FAIL'} the file's floor ${fm ? `has ${fl.V.length - miss} of the band's ${fl.V.length} vertices, within ${fw.toFixed(2)} m of the ground drawn now` : 'line is missing'}`);
  process.exit(worst <= 0.3 && fok ? 0 : 1);
}
let out = src;
if (re.test(out)) out = out.replace(re, () => line);
else {
  const m = /^    fence: .*\n/m.exec(out); if (!m) { console.error('js/tracks/killar.js: no fence line to put the rock after'); process.exit(2); }
  const at = m.index + m[0].length; out = out.slice(0, at) + line + '\n' + out.slice(at);   // (its comment above it by hand)
}
if (reF.test(out)) out = out.replace(reF, () => fline);
else { const m = re.exec(out), at = m.index + m[0].length + 1; out = out.slice(0, at) + fline + '\n' + out.slice(at); }   // (after the rock; its comment above it by hand)
fs.writeFileSync(FILE, out);
console.log('written', path.relative(ROOT, FILE));
