// Zasnova prototipa Realistična (docs/trki-realizem.md, »Zasnova prototipa Realistična«): the candidate formulas of the design study as a
// patch of a PRIVATE COPY of js/core.js, so that the design's »pričakovano« numbers can be measured again with the tools of this folder.
// Nothing in the repository is touched: the copy goes into the folder given (its js/core.js patched, everything else linked to the repository).
//   node tools/trki/zasnova-realisticna.js <folder>          makes <folder>/index.html, <folder>/js/* and the patched <folder>/js/core.js
//   GAME_ROOT=<folder> node tools/trki/zid.js --cv 6         the new version is KC.id === 'real' (cv 6); --cv 1 … 5 must print as before
// The numbers of the candidate can be overridden at run time: KRR='{"wArm":0.7}' GAME_ROOT=<folder> node tools/trki/zid.js --cv 6
// An anchor that is no longer found (the code under it has changed) stops the script with the anchor's first words.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), OUT = process.argv[2] && path.resolve(process.argv[2]);
if (!OUT || OUT.startsWith(ROOT + path.sep) || OUT === ROOT) { console.error('usage: node tools/trki/zasnova-realisticna.js <folder outside the repository>'); process.exit(2); }
fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(OUT, 'index.html'));
for (const f of fs.readdirSync(path.join(ROOT, 'js'))) { if (f === 'core.js') continue; const to = path.join(OUT, 'js', f); try { fs.unlinkSync(to); } catch (e) {} fs.symlinkSync(path.join(ROOT, 'js', f), to); }
const SRC = path.join(ROOT, 'js', 'core.js'), DST = path.join(OUT, 'js', 'core.js');
let s = fs.readFileSync(SRC, 'utf8');
function rep(a, b, n) {
  const k = s.split(a).length - 1;
  if (k !== (n || 1)) throw new Error('anchor found ' + k + ' times: ' + a.slice(0, 90));
  s = s.split(a).join(b);
}

// ---- 0: the numbers and the helpers -------------------------------------------------------------------------------------------
rep('  function kvMake() {', `  // Realistična (scratch candidate): on1..on4 the four items; (1) aH2, aS2 both axles past what their tyres hold, aHf, aSf the nose
  // thrown across, wMax the yaw rate a knock leaves at most, glX the grip back later after a harder knock; (2) sl0, slA the push
  // across the tyres still catch (m/s; a share of the speed); (3) wE, wMu the wall's bounce and rub, wArm where its push bears
  // (a share of the corner's lever), wGl 1: a hard hit takes the grip; wJ0, wJ1 the wall's sustained push (m/s in wJT s) that takes the
  // grip; (4) pCap 1: a thing knocked leaves at up to 1.35 of the car's speed, pDrag its air drag
  const KRR = Object.assign({ on1: 1, on2: 1, on3: 1, on4: 1, aH2: 0.22, aS2: 0.1, aHf: 0.3, aSf: 0.15, wMax: 9, glX: 1, sl0: 3, slA: 0.1,
    wE0: 0.2, wE1: 0.05, wEV: 6, wET: 0.5, wV0: 1.5, wMu: 0.35, wArm: 0.55, wFace: 0.06, wCr0: 0.03, wCr1: 0.5, gAx: 1, wGl: 1, wJT: 0.3, wJ0: 0, wJ1: 0, pCap: 0, pDrag: 0, own: 0 },
    typeof process !== 'undefined' && process.env && process.env.KRR ? JSON.parse(process.env.KRR) : {});
  // the grip a push P (as dv across lt and the turn dw) takes from a classic car on its tyres: [g, the slip of the harder pushed axle]
  const _kg = [0, 0];
  function kGripR(c, lt, dw, V0, V1, K, share) {
    const Vs = Math.max(V1, 12), L = (c.m.a + c.m.b) * 0.5, ar = Math.abs(lt - L * dw) / Vs, af = Math.abs(lt + L * dw) / Vs, Vr = Math.max(V0, V1, KRR.gAx ? Math.max(ar, af) * Vs : 0);
    const gR = clamp((ar - Math.max(K.aH, af)) / K.aS, 0, 1), gB = clamp((Math.min(ar, af) - KRR.aH2) / KRR.aS2, 0, 1), gF = clamp((af - Math.max(KRR.aHf, ar)) / KRR.aSf, 0, 1);
    _kg[0] = c.sc ? 0 : Math.min(1, Math.max(gR, gB, gF) * share * sstep(KG_V0, KG_V1, Vr)); _kg[1] = Math.max(ar, af); return _kg;
  }
  function kTakeR(c, Px, Pz, rx, rz, m, I, K, o) {
    const pl = !!c.isPlayer, dvx = Px / m, dvz = Pz / m, dw = (rx * Pz - rz * Px) / I * K.yaw * (pl ? K.yawP : 1);
    const ch = Math.cos(c.h), sh = Math.sin(c.h), lt = dvz * ch - dvx * sh, V0 = Math.hypot(c.vx, c.vz);
    c.vx += dvx; c.vz += dvz; c.cSx = (c.cSx || 0) - sh * lt; c.cSz = (c.cSz || 0) + ch * lt;
    { const sm = Math.hypot(c.cSx, c.cSz); c.cSr = sm > 1e-9 ? (c.vx * c.cSx + c.vz * c.cSz) / sm : null; }
    const V1 = Math.hypot(c.vx, c.vz), tm = CSK.tapMax;
    const G2 = kGripR(c, lt, dw, V0, V1, K, pl ? K.glP : K.glA * (o && !o.isPlayer && !o.net ? K.glR : 1)), g = G2[0];
    const g0 = c.xgl || 0, gN = Math.max(g0, g), kw = gN > 0.02 ? Math.min(1, gN * K.wI) : 0;
    if (g > 0.02 && g >= g0) { c.xgl = g; c.xglT = K.glT * (1 + KRR.glX * clamp((G2[1] - 0.3) / 0.6, 0, 1)); }
    if (kw > 0) c.w = clamp(c.w + dw * kw, -KRR.wMax, KRR.wMax);
    const sw = dw * (1 - kw) * clamp(RB_TAPT * V1, RB_TAP0, RB_TAP1);
    c.csKc = clamp(sw * c.csKc > 0 ? (Math.abs(sw) > Math.abs(c.csKc) ? sw : c.csKc) : c.csKc + sw, -tm, tm);
  }
  // the wall's push on a corner at (wx, wz) from the car's middle, the wall's normal (nx, nz): a rigid body's, bearing at wArm of the lever
  function wallR(c, wx, wz, nx, nz, k) {
    let ax = wx, az = wz;
    if (KRR.wFace > 0) {   // (the face: the other corners within the crush's length of the wall's line bear with this one)
      const vn0 = (c.vx - c.w * wz) * nx + (c.vz + c.w * wx) * nz, cr = clamp(-KRR.wFace * vn0, KRR.wCr0, KRR.wCr1), ch = Math.cos(c.h), sh = Math.sin(c.h), P = c.corners; let sw = 0, dm = 0;
      for (let j = 0; j < P.length; j++) { const d = (P[j][0] * ch - P[j][1] * sh - wx) * nx + (P[j][0] * sh + P[j][1] * ch - wz) * nz; if (j !== k && d < dm) dm = d; }
      ax = 0; az = 0;   // (every corner by how far behind the deepest one it is: the order of the corners does not count)
      for (let j = 0; j < P.length; j++) { const ox = j === k ? wx : P[j][0] * ch - P[j][1] * sh, oz = j === k ? wz : P[j][0] * sh + P[j][1] * ch, t = clamp(1 - ((j === k ? 0 : (ox - wx) * nx + (oz - wz) * nz) - dm) / cr, 0, 1);
        if (t > 0) { ax += ox * t; az += oz * t; sw += t; } }
      ax /= sw; az /= sw; }
    ax *= KRR.wArm; az *= KRR.wArm;
    const vn = (c.vx - c.w * az) * nx + (c.vz + c.w * ax) * nz; if (vn >= 0) return;
    const M = c.m.mass, I = c.I, im = 1 / M, rn = ax * nz - az * nx, J = -(1 + (KRR.wE1 + (KRR.wE0 - KRR.wE1) * Math.exp(vn / KRR.wEV)) * sstep(KRR.wET, 2 * KRR.wET, -vn)) * vn / (im + rn * rn / I);
    const tx = -nz, tz = nx, rt = ax * tz - az * tx, vx1 = c.vx + J * nx * im, vz1 = c.vz + J * nz * im, w1 = c.w + rn * J / I;
    const vt = (vx1 - w1 * az) * tx + (vz1 + w1 * ax) * tz, Jt = clamp(-vt / (im + rt * rt / I), -KRR.wMu * J, KRR.wMu * J);
    const Px = J * nx + Jt * tx, Pz = J * nz + Jt * tz, dvx = Px * im, dvz = Pz * im, dw = (ax * Pz - az * Px) / I, V0 = Math.hypot(c.vx, c.vz);
    c.vx += dvx; c.vz += dvz; c.w += dw;
    if (c.phys === 'nova' || c.air || c.rl) return;
    const ch = Math.cos(c.h), sh = Math.sin(c.h), lt = dvz * ch - dvx * sh;
    let g = 0, sl = 0;
    if (KRR.wGl) { const G2 = kGripR(c, lt, dw, V0, Math.hypot(c.vx, c.vz), KC, c.isPlayer ? KC.glP : KC.glA); g = G2[0]; sl = G2[1]; }
    if (KRR.wJ1 > 0) { c.wJ = (c.wJ || 0) + J * im; g = Math.max(g, clamp((c.wJ - KRR.wJ0) / (KRR.wJ1 - KRR.wJ0), 0, 1) * (c.sc ? 0 : 1)); sl = Math.max(sl, 0.3); }
    if (g > 0.02 && g >= (c.xgl || 0)) { c.xgl = g; c.xglT = KC.glT * (1 + KRR.glX * clamp((sl - 0.3) / 0.6, 0, 1)); }
    if (c.xgl > 0) c.w = clamp(c.w, -KRR.wMax, KRR.wMax);
  }
  function propFeelR(c, m, vrel, kind) {   // as propFeel, less the share of the speed and the random twitch: the push by the masses does both (kTake)
    c.hitDebris = Math.max(c.hitDebris || 0, vrel * clamp(m / 30, 0.12, 0.35));
    if (vrel > 4) { c.propKnock = kind; c.propKnockV = vrel; }
    if (vrel > 1.5 && (!c.propSnd || vrel > c.propSndV)) { c.propSnd = kind; c.propSndV = vrel; }
  }
  function kvMake() {`);

// ---- 1: the yaw anywhere on the car (kTake) -----------------------------------------------------------------------------------
rep(`    if (c.air || c.rl) { c.vx += dvx; c.vz += dvz; return; }   // (no tyres on the road)
    const ch = Math.cos(c.h), sh = Math.sin(c.h), lt = dvz * ch - dvx * sh;`,
`    if (c.air || c.rl) { c.vx += dvx; c.vz += dvz; return; }   // (no tyres on the road)
    if (K.id === 'real' && KRR.on1 && !c.ck) return kTakeR(c, Px, Pz, rx, rz, m, I, K, o);
    const ch = Math.cos(c.h), sh = Math.sin(c.h), lt = dvz * ch - dvx * sh;`);

// ---- 2: the slide after a knock on sliding friction (stepCS) ------------------------------------------------------------------
rep(`aS = Math.max(0.35 * aL, Math.sqrt(Math.max(0, aL * aL - this.csAn * this.csAn))), dv = grounded ?`,
`aS0 = Math.max(0.35 * aL, Math.sqrt(Math.max(0, aL * aL - this.csAn * this.csAn))), s0R = Math.max(KRR.sl0, KRR.slA * spd), aS = KR && KRR.on2 && !this.ck ? aS0 + (Math.min(aS0, G * CRASH.slide) - aS0) * Math.max(sstep(s0R, 2 * s0R, sm), gl) : aS0, dv = grounded ?`);

// ---- 3: the wall (wallCollide) --------------------------------------------------------------------------------------------------
rep(`      if (vn < 0) {
        const rn = wx * nz - wz * nx;
        const e = CSK.wallE, wy = CSK.wallYaw;`,
`      if (vn < -KRR.wV0 && KR && KRR.on3 && !c.ck) { wallR(c, wx, wz, nx, nz, k); if (-vn > hit) { hit = -vn; hitK = k; hnx = nx; hnz = nz; } }
      else if (vn < 0) {
        const rn = wx * nz - wz * nx;
        const e = CSK.wallE, wy = CSK.wallYaw;`);
// (the sustained push: its sum fades in wJT s; in stepCS's grip-loss line, which only runs while xgl > 0, and here at the wall)
rep(`    if (hit > 0) { c.hitWall = Math.max(c.hitWall, hit); c.fxWall = Math.max(c.fxWall || 0, hit); }`,
`    if (hit > 0) { c.hitWall = Math.max(c.hitWall, hit); c.fxWall = Math.max(c.fxWall || 0, hit); }
    if (c.wJ) { c.wJ *= Math.exp(-(1 / 120) / KRR.wJT); if (c.wJ < 1e-3) c.wJ = 0; }`);

// ---- 4: a light thing: one push by the masses (propCarHit, debrisHit) ---------------------------------------------------------
rep(`      if (K.breaks) { race.breakProp(b, nx, nz, vrel, c.vx, c.vz); propFeel(c, K.m, vrel, b.kind); return; }`,
`      const R4 = KR && KRR.on4 && !c.ck, bvx0 = b.vx, bvz0 = b.vz, cM = c.m.mass + (c.fuelKg || 0), cI = c.I * cM / c.m.mass;
      if (K.breaks) { const cvx0 = c.vx, cvz0 = c.vz; race.breakProp(b, nx, nz, vrel, c.vx, c.vz);
        if (R4) { let qx = 0, qz = 0; if (b.parts) for (const p of b.parts) { qx += p.K.m * p.vx; qz += p.K.m * p.vz; } propFeelR(c, K.m, vrel, b.kind); kTake(c, -qx, -qz, rcx, rcz, cM, cI, KC, null); }
        else propFeel(c, K.m, vrel, b.kind); return; }`);
rep(`cap = Math.min(K.vmax || 18, 0.72 * Math.hypot(c.vx, c.vz) + 2);`,
`cap = R4 && KRR.pCap ? Math.min(K.vmax || 1e9, 1.35 * Math.hypot(c.vx, c.vz) + 2) : Math.min(K.vmax || 18, 0.72 * Math.hypot(c.vx, c.vz) + 2);`);
rep(`      const wl = Math.hypot(b.wx, b.wy, b.wz); if (wl > 14) { b.wx *= 14 / wl; b.wy *= 14 / wl; b.wz *= 14 / wl; }
      propFeel(c, K.m, vrel, b.kind);`,
`      const wl = Math.hypot(b.wx, b.wy, b.wz); if (wl > 14) { b.wx *= 14 / wl; b.wy *= 14 / wl; b.wz *= 14 / wl; }
      if (R4) { propFeelR(c, K.m, vrel, b.kind); kTake(c, -K.m * (b.vx - bvx0), -K.m * (b.vz - bvz0), rcx, rcz, cM, cI, KC, null); }
      else propFeel(c, K.m, vrel, b.kind);`);
rep(`    else { const kv = Math.max(0, 1 - 0.25 * dt); b.vx *= kv; b.vz *= kv; }          // a little air drag`,
`    else { const kv = Math.max(0, 1 - (0.25 + (KR && KRR.pDrag ? KRR.pDrag * K.rh * K.h0 * 4 / K.m * Math.hypot(b.vx, b.vz) : 0)) * dt); b.vx *= kv; b.vz *= kv; }          // a little air drag`);
rep(`        const k = Math.min(0.06, d.m * 0.004);                       // the car feels it: speed loss + twitch, more for big parts
        c.vx *= 1 - k; c.vz *= 1 - k; c.w += (rand() - 0.5) * d.m * 0.05;`,
`        if (KR && KRR.on4 && !c.ck) { const cM = c.m.mass + (c.fuelKg || 0); kTake(c, -d.m * kick * nx, -d.m * kick * nz, ax + nx * c.rad - c.x, az + nz * c.rad - c.z, cM, c.I * cM / c.m.mass, KC, null); }
        else { const k = Math.min(0.06, d.m * 0.004);                       // the car feels it: speed loss + twitch, more for big parts
        c.vx *= 1 - k; c.vz *= 1 - k; c.w += (rand() - 0.5) * d.m * 0.05; }`);

fs.writeFileSync(DST, s);
console.log('patched', DST, s.length);
