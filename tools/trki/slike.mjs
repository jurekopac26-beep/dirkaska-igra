// Trki v slikah: the same crash with two versions of the knocks (Nastavitve · Trki med avti), side by side, as a short row of frames
// from the camera behind the car (640 x 360, a phone on its side, no HUD), on a real track. For the question »ZDAJ ali POTEM« of the
// topic »bolj realistični trki«: left ZDAJ (side A), right POTEM (side B), one row a moment after the first touch, the measured state
// under every frame (time, speed, how far the car has turned; the rival's too).
//   node tools/trki/slike.mjs pit                              Simulacija (cv 1) against Realistična (cv 6), the working tree
//   node tools/trki/slike.mjs tbone --a-cv 1 --b-cv 4          two versions the page already has (4: Kaskaderska)
//   node tools/trki/slike.mjs zid30 --b-root ../prototip       side B from another copy of the game (a git worktree with a prototype)
//   node tools/trki/slike.mjs bok --casi 0,0.5,1,1.5,2.5       other moments (seconds after the first touch; 0: the last step before it)
//   node tools/trki/slike.mjs --help                           the options and the scenarios
// Options: --a-cv <n> (1) --b-cv <n> (6) --a-root <folder> --b-root <folder> (the working tree) --casi <s,s,…> --proga <id> --m <metres>
// --avto <id> (the player's car, the quick entry's avto=) --fizika cs|nova --oddaljenost blizu|srednje|dalec (the camera's distance as
// Nastavitve has it: srednje, the game's own) --scenariji <file.json> --out <folder> --kb <n> (300)
// --okvirji (every frame as its own PNG too) --zaporedno (side A, then side B: not both at once).
// The version: cv as Core's KV_IDS (1 Simulacija, 2 Arkadna, 3 Mehka, 4 Kaskaderska, 5 Stara, ...). The page gets it as the player would
// set it (the setting crV = cv - 1, which the game hands to Core.setTest when it applies the settings); a page whose settings do not take
// the number but whose Core knows it gets it through Core.setTest({ cv }) (the other rows of Preizkus as they are). A version the page's
// Core does not know (KV_IDS[cv]) stops the run with a message: nothing is drawn with another version in its place.
// How a scenario is staged (tools/trki/slike-scenariji.json; the same for both sides, nothing random in it):
//   1. the quick entry (index.html?proga=<id>&t=0.5&tekmeci=1&vreme=suho: the test mode, the race's own seeded numbers) opens the race
//      with one rival, dry, by day; the game is paused and from then on stepped only from here (window.__game.sim, 1/120 s a step)
//   2. the player's car is put m metres after the start (the road's frame there: naprej along it, desno across it to the right, kot the
//      nose's angle to the road, + to the right), the rival relative to it; a wall scenario has no rival (it is parked 400 m back, hidden)
//   3. 1.25 s on the spot: every step the cars are put back where they were staged with their speed, so the gearbox, the revs and the
//      suspension settle and the throttle that holds the speed is found; the camera settles behind the standing picture
//   4. the run: no steer, the holding throttle, a frame 30 times a second as the game draws it (Render.frame: the camera, smoke,
//      sparks, skid marks) until the first touch (the race's own hitCar / hitWall of that step); the picture of the last step before
//      it is frame 0
//   5. after the touch the inputs are the scenario's (po_trku: "nic" no pedal, "plin" the holding throttle stays; volan for volan_s
//      seconds; zavora), fixed, the game stepped and drawn on; a frame at every moment of --casi
// Only the frames that may be kept reach the screen (software WebGL takes about half a second a frame): for the others the WebGL
// context's draw calls do nothing while Render.frame does all of its own work.
// The rival is driven the same way: its own step gets the scenario's pedals and steer just before the physics (the AI's are overwritten;
// the car stays a rival for the knock's rules), a standing one is held as on the grid (locked: free once it is hit), and its timers of
// the marshals' rescue (stuck, the wrong way) are kept at zero so it is never put back on the road in the middle of the pictures.
// Out (--out, else a Claude Code session's scratch folder under trki/slike, else the system's temp folder; never the repo):
//   <scenarij>.jpg (2 columns x the moments, at most --kb KB) and <scenarij>.json (every frame's numbers, both sides, the cars, the touch)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import { register, createRequire } from 'node:module';

const HERE = path.dirname(url.fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '..', '..');
// (tests/browser/lib.mjs imports 'playwright' as a module: a repo without node_modules (no npm ci) finds none that way, though require()
// does (NODE_PATH, a global install). Only then is the name resolved as require resolves it; with node_modules nothing changes)
{ const require = createRequire(import.meta.url); let pw = null;
  try { pw = path.join(path.dirname(require.resolve('playwright/package.json')), 'index.mjs'); } catch (_) { /* none: the import below says so */ }
  if (pw && fs.existsSync(pw)) register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) { if (s !== 'playwright') return next(s, c); try { return await next(s, c); } catch (e) { return { url: ${JSON.stringify(url.pathToFileURL(pw).href)}, shortCircuit: true }; } }`)); }
const { serve, launch, openGame } = await import('../../tests/browser/lib.mjs');

const VIEW = { width: 640, height: 360 };   // (a phone on its side: what the player sees)
const NAMES = [null, 'Simulacija', 'Arkadna', 'Mehka', 'Kaskaderska', 'Stara', 'Realistična'];   // (when the page has no button for the version)
const sl = (x, n = 0) => (Object.is(+x.toFixed(n), -0) ? 0 : x).toFixed(n).replace('.', ',');   // (a number as Slovenian writes it)
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------- the command line ---------------- */
const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; }, has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const help = has('--help') || has('-h'), scnFile = path.resolve(flag('--scenariji') || path.join(HERE, 'slike-scenariji.json'));
const aCv = +(flag('--a-cv') || 1), bCv = +(flag('--b-cv') || 6), aRoot = path.resolve(flag('--a-root') || REPO), bRoot = path.resolve(flag('--b-root') || REPO);
const casiArg = flag('--casi'), progaArg = flag('--proga'), mArg = flag('--m'), avto = flag('--avto'), fizika = flag('--fizika'), outArg = flag('--out'), kb = +(flag('--kb') || 300);
const okvirji = has('--okvirji'), zaporedno = has('--zaporedno'), ZOOM = { blizu: 1.1, srednje: 1.4, dalec: 1.7, 'daleč': 1.7 }, odd = flag('--oddaljenost');
const FILE = JSON.parse(fs.readFileSync(scnFile, 'utf8')), SCN = FILE.scenariji, DEF = FILE.privzeto || {};
const usage = () => 'usage: node tools/trki/slike.mjs <scenarij> [--a-cv 1] [--b-cv 6] [--a-root <folder>] [--b-root <folder>] [--casi 0,0.3,0.9,1.8] [--proga <id>] [--m <metres>]\n' +
  '       [--avto <id>] [--fizika cs|nova] [--oddaljenost blizu|srednje|dalec] [--scenariji <file.json>] [--out <folder>] [--kb 300] [--okvirji] [--zaporedno]\n' +
  'cv (Trki med avti): 1 Simulacija, 2 Arkadna, 3 Mehka, 4 Kaskaderska, 5 Stara, 6 Realistična (once the page has it)\n' +
  'scenarios (' + path.relative(process.cwd(), scnFile) + '):\n' + Object.entries(SCN).map(([k, s]) => '  ' + k.padEnd(7) + s.naslov + (s.opis ? ': ' + s.opis : '')).join('\n');
const bad = args.filter(a => a.startsWith('--')), name = args.find(a => !a.startsWith('--'));
if (help) { console.log(usage()); process.exit(0); }
if (!name || bad.length || !SCN[name] || !(aCv >= 1) || !(bCv >= 1) || !(kb >= 50) || (fizika && !/^(cs|nova)$/.test(fizika)) || (odd && !ZOOM[odd])) {
  console.log(usage() + (bad.length ? '\nunknown: ' + bad.join(' ') : name && !SCN[name] ? '\nno scenario ' + name : '')); process.exit(2);
}
const S = Object.assign({}, DEF, SCN[name]);
if (progaArg) S.proga = progaArg; if (mArg != null) S.m = +mArg;
S.casi = (casiArg ? casiArg.split(',').map(Number) : S.casi || [0, 0.3, 0.9, 1.8]).slice().sort((a, b) => a - b);
if (!(S.m >= 0) || !S.casi.length || S.casi.some(t => !(t >= 0 && t <= 20))) { console.log('--m: metres after the start (0 or more); --casi: seconds after the first touch (0-20; 0 is the last step before it)'); process.exit(2); }
{ const f = path.join(REPO, 'js', 'tracks', S.proga + '.js');   // (a real track: the test tracks are frozen, CLAUDE.md »Testne proge«)
  if (!fs.existsSync(f)) { console.log('no track ' + S.proga + ' (js/tracks/)'); process.exit(2); }
  if (/\btest:\s*true\b/.test(fs.readFileSync(f, 'utf8').slice(0, 4000))) { console.log(S.proga + ' is a test track (frozen until it is deleted): take a real one, spa or bathurst'); process.exit(2); } }
// where the pictures go: never into the repo
function outDir() {
  if (outArg) return path.resolve(outArg);
  if (process.env.TRKI_SLIKE_OUT) return path.resolve(process.env.TRKI_SLIKE_OUT);
  const ses = process.env.CLAUDE_CODE_SESSION_ID, uid = typeof process.getuid === 'function' ? process.getuid() : 0;
  const scratch = ses ? path.join('/tmp', 'claude-' + uid, REPO.replace(/[\\/]/g, '-'), ses, 'scratchpad') : '';   // (a Claude Code session's scratch folder)
  return scratch && fs.existsSync(scratch) ? path.join(scratch, 'trki', 'slike') : path.join(os.tmpdir(), 'trki-slike');
}

/* ---------------- in the page: stage the scenario, step it, draw it, take the frames ---------------- */
// o: { m, casi, igralec, tekmec | null, cakaj }. Returns { error } or { frames: [{ t, src, igralec, tekmec }], … }. One go, nothing
// awaited: the page's own loop (paused: it only draws) gets no turn between the steps
function stageAndRun(o) {
  const g = window.__game, R = g.race, T = R.track, P = R.player, STEP = 1 / 120, RAD = Math.PI / 180;
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)), clamp = (x, a, b) => Math.max(a, Math.min(b, x)), r3 = (x) => +x.toFixed(3);
  g.pause(); Render.resize();
  const ms = {}, clock = (k, w) => { ms[k] = Math.round(performance.now() - w); return performance.now(); }; let w0 = performance.now();   // (where the time goes)
  const others = R.cars.filter(c => c !== P), B = o.tekmec ? others[0] : null;
  if (o.tekmec && !B) return { error: 'the race has no rival to stage' };
  // the road's frame m metres after the start: (tx, tz) along it, (nx, nz) across it to the right, sg: which way a heading turns to the right
  const s0 = T.open ? Math.min(T.startS + o.m, T.finishS - 1) : T.startS + o.m, i0 = T.idx(((s0 % T.len) + T.len) % T.len);
  const O = { x: T.px[i0], z: T.pz[i0], hd: T.hd[i0], tx: Math.cos(T.hd[i0]), tz: Math.sin(T.hd[i0]), nx: T.nx[i0], nz: T.nz[i0] };
  const sg = O.nx * -O.tz + O.nz * O.tx >= 0 ? 1 : -1;
  const along = (c) => (c.x - O.x) * O.tx + (c.z - O.z) * O.tz, across = (c) => (c.x - O.x) * O.nx + (c.z - O.z) * O.nz;
  const pose = (a, d, kot, kmh) => { const h = wrap(O.hd + sg * kot * RAD), v = kmh / 3.6; return { x: O.x + a * O.tx + d * O.nx, z: O.z + a * O.tz + d * O.nz, h, v, vx: v * Math.cos(h), vz: v * Math.sin(h), a, d, kot }; };
  // do_ograje: the player's place across the road from the barrier it drives at (its nearest corner that far from it, where it will meet it)
  const ip = o.igralec, kotP = ip.kot || 0;
  let dP = ip.desno || 0, ograja = null;
  if (ip.do_ograje != null) {
    const right = kotP >= 0, hh = sg * kotP * RAD, ch = Math.cos(O.hd + hh), sh = Math.sin(O.hd + hh);
    let ext = 0, extA = 0; for (const [rx, rz] of P.corners) { const wx = rx * ch - rz * sh, wz = rx * sh + rz * ch, e = (wx * O.nx + wz * O.nz) * (right ? 1 : -1); if (e > ext) { ext = e; extA = wx * O.tx + wz * O.tz; } }
    const aHit = extA + (Math.abs(Math.sin(kotP * RAD)) > 0.02 ? ip.do_ograje / Math.abs(Math.tan(kotP * RAD)) : 0), iH = T.idx((((s0 + aHit) % T.len) + T.len) % T.len), qH = T.query(T.px[iH], T.pz[iH], iH, {});
    ograja = { stran: right ? 'desno' : 'levo', od_sredine: r3(right ? qH.br : qH.bl), od_roba: r3((right ? qH.br : qH.bl) - (T.wa ? T.wa[iH] : T.w)) };
    dP = (right ? 1 : -1) * ((right ? qH.br : qH.bl) - ip.do_ograje - ext);
  }
  const tP = pose(ip.naprej || 0, dP, kotP, ip.kmh || 0), it = o.tekmec;
  const tB = it ? pose(tP.a + (it.naprej || 0), tP.d + (it.desno || 0), it.kot || 0, it.kmh || 0) : null;
  // a car put there: on the road's height, in the gear of its speed
  const put = (c, t) => {
    c.place(t.x, t.z, t.h); c.q = T.query(c.x, c.z, i0, c.q); if (T.hasElev) c.y = c.py = T.hy[c.q.i]; c.sPrev = c.q.s;
    const M = c.m; if (M.gears && t.v > 1) for (let k = 1; k <= M.gears.length; k++) { c.gear = k; if (t.v / M.rw * M.gears[k - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
    c.vx = t.vx; c.vz = t.vz; c.locked = false; c.stuckT = 0; c.wrongT = 0; c.pitWant = false;
  };
  const back = (c, t) => { c.x = c.px = t.x; c.z = c.pz = t.z; c.h = c.ph = t.h; c.vx = t.vx; c.vz = t.vz; c.w = 0; };
  // every other car out of the way: 400 m back (and on), standing, not drawn
  others.forEach((c, k) => { if (c === B) return; const s = s0 - 400 - k * 12, i = T.idx(((s % T.len) + T.len) % T.len); c.place(T.px[i], T.pz[i], T.hd[i]); c.q = T.query(c.x, c.z, i, c.q); if (T.hasElev) c.y = c.py = T.hy[i]; c.sPrev = c.q.s; c.locked = true; });
  put(P, tP); if (B) put(B, tB);
  // the rival's pedals and steer: its own step gets them just before the physics (the steer at a rival's rate, 10 a second)
  const inB = { thr: 0, brk: 0, st: 0 };
  if (B) {
    if (tB.v > 0.5) { const step = Object.getPrototypeOf(B).step;
      B.step = function (dt, trk) { this.steer = clamp(this.steer0 + clamp(inB.st - this.steer0, -10 * dt, 10 * dt), -1, 1); this.steer0 = this.steer; this.inSteer = inB.st; this.inThr = inB.thr; this.inBrk = inB.brk; this.inHand = 0; this.stuckT = 0; this.wrongT = 0; return step.call(this, dt, trk); };
      B.steer0 = 0; B.steer = 0; }
    else B.locked = true;   // (standing: held as on the grid; hit, it rolls and slides with no pedal and no steer)
  }
  // this step's knocks, read before the game clears them (raceStep)
  const hit = { car: 0, wall: 0 }, core = R.step;
  R.step = function (dt) { const r = core.call(this, dt); hit.car = Math.max(P.hitCar || 0, B ? B.hitCar || 0 : 0); hit.wall = P.hitWall || 0; if (B && B.locked) { B.stuckT = 0; B.wrongT = 0; } return r; };
  const inP = { thr: 0, brk: 0, st: 0 }, one = () => { hit.car = hit.wall = 0; g.sim(STEP, false, sg * inP.st, inP.thr, inP.brk); };
  // on the spot: the gearbox, the revs and the suspension settle, the throttle that holds the speed is found
  let thP = tP.v > 1 ? 0.3 : 0, thB = tB && tB.v > 1 ? 0.3 : 0;
  for (let k = 0; k < 150; k++) {
    back(P, tP); if (B) back(B, tB);
    inP.thr = thP; inB.thr = thB; one();
    if (hit.car > 0 || hit.wall > 0) return { error: 'the cars touch where they are staged (' + (hit.car > 0 ? 'each other' : 'the barrier') + '): move them apart in the scenario' };
    if (tP.v > 1) thP = clamp(thP - (P.speed - tP.v) * 2, 0, 1); if (tB && tB.v > 1) thB = clamp(thB - (B.speed - tB.v) * 2, 0, 1);
  }
  back(P, tP); if (B) back(B, tB); w0 = clock('umiritev', w0);
  // the picture: as the game draws a frame (the camera behind the car, smoke, sparks, skid marks), the canvas copied the moment it is
  // drawn. A frame of software WebGL takes about half a second, so only the frames that may be kept are really drawn: for the others
  // (quiet: 30 a second between them, which move the camera and lay the smoke and the marks) the context's draw calls do
  // nothing, the renderer's own work on the page all done
  const gl = document.getElementById('gl'), W = innerWidth, H = innerHeight, G3 = (() => { try { return gl.getContext('webgl2') || gl.getContext('webgl'); } catch (_) { return null; } })();
  const DRAWS = ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced', 'drawRangeElements', 'clear', 'blitFramebuffer'];
  const mute = (on) => { if (G3) for (const k of DRAWS) { if (!on) delete G3[k]; else if (typeof G3[k] === 'function') G3[k] = () => {}; } };
  const draw = (dt) => Render.frame(dt, 1, P, 'chase', {}), quiet = (dt) => { mute(true); try { draw(dt); } finally { mute(false); } };
  const grab = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(gl, 0, 0, W, H); return c; };
  for (const c of others) if (c !== B) { const v = Render.viewOf(c); if (v && v.grp) v.grp.visible = false; }
  Render.resetCam(); for (let k = 0; k < 30; k++) quiet(0.1);   // (3 s of the camera's time: there at once, its zoom at this speed settled)
  w0 = clock('kamera', w0);
  // the numbers under a frame: the speed, how far the car has turned since the touch (+ to the right), where it is in the road's frame
  const turn = { P: 0, B: 0 }, hPrev = { P: P.h, B: B ? B.h : 0 };
  const num = (c, k) => ({ kmh: +(c.speed * 3.6).toFixed(1), zasuk: +(sg * turn[k] / RAD).toFixed(1), naprej: r3(along(c)), desno: r3(across(c)), kot: +(sg * wrap(c.h - O.hd) / RAD).toFixed(1), skoda: r3(c.dmg || 0) });
  const nums = () => ({ igralec: num(P, 'P'), tekmec: B ? num(B, 'B') : null });
  const track = () => { turn.P += wrap(P.h - hPrev.P); hPrev.P = P.h; if (B) { turn.B += wrap(B.h - hPrev.B); hPrev.B = B.h; } };
  // how soon the first touch can come at the earliest (s): the gap between the two bodies' boxes over the speed they close at, the
  // player's corners to the barrier over their speed across the road (5 cm and a little speed to spare)
  const box = (c) => { const ch = Math.cos(c.h), sh = Math.sin(c.h); return [0, 1, 3, 2].map(k => [c.x + c.corners[k][0] * ch - c.corners[k][1] * sh, c.z + c.corners[k][0] * sh + c.corners[k][1] * ch]); };
  const segD = (p, a, b) => { const ax = b[0] - a[0], az = b[1] - a[1], u = clamp(((p[0] - a[0]) * ax + (p[1] - a[1]) * az) / (ax * ax + az * az || 1), 0, 1); return Math.hypot(p[0] - a[0] - u * ax, p[1] - a[1] - u * az); };
  const soonest = () => {
    const a = box(P); let t = 1e9;
    if (B) { const b = box(B); let gap = 1e9; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) gap = Math.min(gap, segD(a[i], b[j], b[(j + 1) % 4]), segD(b[i], a[j], a[(j + 1) % 4]));
      t = (gap - 0.05) / (Math.hypot(P.vx - B.vx, P.vz - B.vz) + 0.2); }
    for (const p of a) { const q = T.query(p[0], p[1], P.q.i, {}); t = Math.min(t, (Math.min(q.br - q.d, q.d + q.bl) - 0.05) / (Math.abs(P.vx * q.nx + P.vz * q.nz) + 0.2)); }
    return t;
  };
  // the run up to the first touch: the speed held; really drawn every third step once the touch can come within 6 steps and every step
  // within 1.5, so the picture of the last step before the touch is there: frame 0 (slika0_korak says which step it shows, korak the
  // last one before the touch: the same but for a knock that reaches further than the bodies' boxes)
  const pred = { thrP: r3(thP), thrB: r3(thB) }, nMax = Math.round((o.cakaj || 3) / STEP);
  let n = 0, at = 0, real = -1, pic = null, was = null, first = null, shots = 0;
  inP.thr = thP; inP.st = 0; inP.brk = 0; inB.thr = thB; inB.st = 0; inB.brk = 0;
  for (;;) {
    if (n >= nMax) return { error: 'no touch in ' + (o.cakaj || 3) + ' s after the staging: the cars are too far apart (or miss each other, or the barrier)', konec: nums() };
    const tt = soonest();
    if (real < 0 || (tt <= 6 * STEP && n - real >= 3) || tt <= 1.5 * STEP) { draw((n - at) * STEP || STEP); at = real = n; pic = grab(); was = nums(); shots++; }
    else if (n - at >= 4) { quiet((n - at) * STEP); at = n; }
    one(); n++;
    if (hit.car > 0 || hit.wall > 0) { first = { korak: n - 1, s: r3((n - 1) * STEP), kaj: hit.car > 0 ? 'avto' : 'ograja', zapiranje: r3(Math.max(hit.car, hit.wall)), slika0_korak: real }; break; }
    hPrev.P = P.h; if (B) hPrev.B = B.h;
  }
  w0 = clock('do_dotika', w0);
  // from the touch on: the scenario's fixed inputs, the game stepped and drawn 30 times a second, really at the moments asked for
  const after = (c, t, hold) => { const po = c.po_trku || 'nic', vs = c.volan_s != null ? c.volan_s : 1e9; return { thr: po === 'plin' ? hold : 0, st: c.volan && t < vs ? c.volan : 0, brk: c.zavora || 0 }; };
  const frames = [], want = o.casi.map(t => Math.round(t / STEP));
  if (want[0] === 0) frames.push(Object.assign({ t: 0, src: pic.toDataURL('image/png') }, was));
  track();   // (the touch's own step is step 1 after it)
  let k = 1, drawn = at - (n - 1); const last = want[want.length - 1];   // (drawn: the step of the last frame, counted from the touch)
  for (;;) {
    const here = want.indexOf(k) >= 0;
    if (here) { draw((k - drawn) * STEP); drawn = k; shots++; } else if (k - drawn >= 4) { quiet((k - drawn) * STEP); drawn = k; }
    if (here) frames.push(Object.assign({ t: +(k * STEP).toFixed(4), src: grab().toDataURL('image/png') }, nums()));
    if (k >= last) break;
    const t = k * STEP, a = after(ip, t, thP), b = it ? after(it, t, thB) : null;
    inP.thr = a.thr; inP.st = a.st; inP.brk = a.brk; if (b) { inB.thr = b.thr; inB.st = sg * b.st; inB.brk = b.brk; }
    one(); k++; track();
  }
  w0 = clock('po_dotiku', w0);
  const car = (c) => ({ ime: c.m.name, id: c.m.id, dolzina: c.m.len, sirina: c.m.wid, masa: c.m.mass, fizika: c.phys });
  return { frames, stik: first, pred, ograja, postavitev: { igralec: { naprej: r3(tP.a), desno: r3(tP.d), kot: tP.kot, kmh: +(tP.v * 3.6).toFixed(1) }, tekmec: tB ? { naprej: r3(tB.a), desno: r3(tB.d), kot: tB.kot, kmh: +(tB.v * 3.6).toFixed(1) } : null },
    avti: { igralec: car(P), tekmec: B ? car(B) : null }, cesta: { s: r3(T.query(O.x, O.z, i0, {}).s), sirina: r3(2 * (T.wa ? T.wa[i0] : T.w)), smer: +(O.hd / RAD).toFixed(1) }, cv: Core.TX.cv, cas_dirke: r3(R.time), narisanih: shots, ms };
}

/* ---------------- one side: its copy of the game, its version of the knocks ---------------- */
async function side(browser, tag, root, cv) {
  if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error(`side ${tag}: no game in ${root} (index.html)`);
  const srv = await serve(root);
  try {
    const set = Object.assign({ quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', damage: 1, crV: cv - 1 }, fizika ? { phys: fizika } : null, odd ? { zoom: ZOOM[odd] } : null);   // (damage 1: Samo videz, the game's own default)
    const q = new URLSearchParams({ proga: S.proga, t: '0.5', tekmeci: '1', vreme: 'suho' }); if (avto) q.set('avto', avto);
    const w0 = Date.now(), { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?' + q, set, VIEW, { seed: 11 });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    // the race is there, on this track; the version is the one asked for (the setting, else Core.setTest; unknown to Core: stop)
    const st = await page.evaluate(([id, cv]) => {
      const g = window.__game, ok = !!(g.race && g.race.track.def.id === id), ids = Core.KV_IDS || [], known = !!ids[cv];
      let how = 'nastavitev crV';
      if (known && Core.TX.cv !== cv) { Core.setTest(Object.assign({}, Core.TX, { cv })); how = 'Core.setTest'; }
      const btn = document.querySelector(`[data-set="crV"] button[data-v="${cv - 1}"]`);
      return { ok, bad: g.quick.q.bad, known, ids: ids.map((x, i) => x ? i + ' ' + x : '').filter(Boolean).join(', '), cv: Core.TX.cv, how, label: btn ? btn.textContent.trim() : '', ver: g.ver, name: ok ? g.race.track.def.name : '' };
    }, [S.proga, cv]);
    if (st.bad.length || !st.ok) throw new Error(`side ${tag}: no race on ${S.proga} (${st.bad.join(', ') || 'the quick entry did not start one'})`);
    if (!st.known || st.cv !== cv) throw new Error(`side ${tag}: this copy of the game does not know the version of the knocks cv ${cv} (Core.KV_IDS: ${st.ids}).` +
      (cv === 6 ? ' Realistična is not in it yet: give the prototype with --' + tag.toLowerCase() + '-root <folder>, or compare two versions it has (--b-cv 4).' : ''));
    const w1 = Date.now(), r = await page.evaluate(stageAndRun, { m: S.m, casi: S.casi, igralec: S.igralec, tekmec: S.tekmec || null, cakaj: S.cakaj || 3 });
    if (r.error) throw new Error(`side ${tag}: ${r.error}` + (r.konec ? ' ' + JSON.stringify(r.konec) : ''));
    if (r.cv !== cv) throw new Error(`side ${tag}: the version changed during the run (cv ${r.cv}, asked ${cv})`);
    if (errors.length) console.log(`(side ${tag}: ${errors.length} page errors: ${errors.slice(0, 3).join(' | ').slice(0, 300)})`);
    await ctx.close();
    return Object.assign(r, { tag, cv, ime: st.label || NAMES[cv] || 'cv ' + cv, kako: st.how, root, ver: st.ver, proga: st.name, sekunde: [+((w1 - w0) / 1000).toFixed(1), +((Date.now() - w1) / 1000).toFixed(1)] });
  } finally { await srv.close(); }
}

/* ---------------- the composite: 2 columns (ZDAJ, POTEM) x the moments, the numbers under every frame ---------------- */
const rel = (p) => { const r = path.relative(REPO, p); return !r ? '.' : r.startsWith('..') ? p : r; };   // (a folder as the report names it: within the repo from its root)
const zasuk = (z) => Math.abs(z) < 0.5 ? 'zasuk 0°' : 'zasuk ' + sl(Math.abs(z)) + '° ' + (z > 0 ? 'desno' : 'levo');
const caption = (f, car2) => `<div class="c"><b>${f.t === 0 ? 'tik pred trkom' : '+' + sl(f.t, 2) + ' s'}</b> · ti <b>${sl(f.igralec.kmh)} km/h</b>${f.t === 0 ? '' : ' · ' + zasuk(f.igralec.zasuk)}</div>` +
  (car2 && f.tekmec ? `<div class="c r">tekmec <b>${sl(f.tekmec.kmh)} km/h</b>${f.t === 0 ? '' : ' · ' + zasuk(f.tekmec.zasuk)}</div>` : '');
function html(A, B, cw) {
  const ch = Math.round(cw * VIEW.height / VIEW.width), car2 = !!S.tekmec, fs1 = Math.round(cw / 21), same = A.root === B.root;
  const head = (X, t) => `<div class="h"><div class="t">${t}</div><div class="v">${esc(X.ime)}${same ? '' : X.root === REPO ? '' : ' · prototip'}</div></div>`;
  const kje = `${esc(A.proga)} · ${S.m} m po štartu · kamera za avtom · ti: ${esc(A.avti.igralec.ime)}` + (car2 ? `, tekmec: ${esc(A.avti.tekmec.ime)}` : '');
  const rows = A.frames.map((f, i) => `<div class="f"><img src="${f.src}">${caption(f, car2)}</div><div class="f"><img src="${B.frames[i].src}">${caption(B.frames[i], car2)}</div>`).join('');
  return `<!doctype html><meta charset="utf-8"><style>
    body { margin: 0; background: #0d1117; font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif; color: #e8eef4; }
    #k { width: ${cw * 2 + 30}px; padding: 10px 0 12px; background: #0d1117; }
    h1 { margin: 0 10px 2px; font-size: ${Math.round(fs1 * 1.25)}px; line-height: 1.2; }
    .s { margin: 0 10px 8px; font-size: ${Math.round(fs1 * 0.8)}px; color: #9fb3c8; }
    .g { display: grid; grid-template-columns: ${cw}px ${cw}px; gap: 8px 10px; padding: 0 10px; }
    .h { border-bottom: 3px solid #ffb300; padding-bottom: 3px; } .h + .h { border-color: #35c46a; }
    .t { font-size: ${Math.round(fs1 * 1.5)}px; font-weight: 800; letter-spacing: 1px; } .v { font-size: ${fs1}px; color: #cdd9e5; }
    img { display: block; width: ${cw}px; height: ${ch}px; }
    .c { font-size: ${fs1}px; line-height: 1.28; white-space: nowrap; overflow: hidden; padding-top: 3px; font-variant-numeric: tabular-nums; } .c.r { color: #ffd27a; padding-top: 0; }
    .n { margin: 8px 10px 0; font-size: ${Math.round(fs1 * 0.72)}px; color: #9fb3c8; line-height: 1.3; }
  </style><div id="k"><h1>${esc(S.naslov)}</h1><div class="s">${kje}</div>
  <div class="g">${head(A, 'ZDAJ')}${head(B, 'POTEM')}${rows}</div>
  <div class="n">Isti trk na obeh straneh: enaka postavitev in hitrost, koraki po 1/120 s, po dotiku ${esc(S.po || 'brez plina in volana')}. Zasuk: koliko se je avto obrnil od dotika.</div></div>`;
}
// the picture within the size asked for: the quality down first, then the frames smaller
async function compose(browser, A, B, file) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1 }), page = await ctx.newPage();
  try {
    // frame 0 of both sides: the share of pixels that differ (the same state must give the same picture; smoke and sparks aside)
    const diff = A.frames[0].t === 0 ? await page.evaluate(async ([a, b]) => {
      const load = (src) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; }), px = (im) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, im.width, im.height).data; };
      const da = px(await load(a)), db = px(await load(b)); let n = 0;
      for (let i = 0; i < da.length; i += 4) if (Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])) > 24) n++;
      return n / (da.length / 4) * 100;
    }, [A.frames[0].src, B.frames[0].src]) : null;
    for (const cw of [480, 440, 400, 360, 320, 280]) {
      await page.setContent(html(A, B, cw)); await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
      for (let q = 84; q >= 46; q -= 6) {
        const buf = await page.locator('#k').screenshot({ type: 'jpeg', quality: q });
        if (buf.length <= kb * 1024 || (cw === 280 && q < 52)) { fs.writeFileSync(file, buf); const box = await page.locator('#k').boundingBox(); return { kb: +(buf.length / 1024).toFixed(1), kakovost: q, okvir: cw, sirina: Math.round(box.width), visina: Math.round(box.height), razlika0: diff == null ? null : +diff.toFixed(3) }; }
      }
    }
  } finally { await ctx.close(); }
}

/* ---------------- the run ---------------- */
const t0 = Date.now(), out = outDir(), browser = await launch();
let fail = '';
try {
  fs.mkdirSync(out, { recursive: true });
  const runA = () => side(browser, 'A', aRoot, aCv), runB = () => side(browser, 'B', bRoot, bCv);
  let A, B;
  if (zaporedno) { A = await runA(); B = await runB(); }
  else [A, B] = await Promise.all([runA(), runB()]);   // (the first side that fails stops the run: the browser closes under the other)
  // the two sides must start the same: the last step before the touch the same step, the cars in the same place at the same speed
  const key = (X) => JSON.stringify([X.stik.korak, X.frames[0].igralec, X.frames[0].tekmec]), same = A.frames[0].t !== 0 || key(A) === key(B);
  const file = path.join(out, name + '.jpg'), pic = await compose(browser, A, B, file);
  const strip = (X) => ({ cv: X.cv, ime: X.ime, kako: X.kako, root: rel(X.root), ver: X.ver, stik: X.stik, pred: X.pred, narisanih: X.narisanih, ms: X.ms, okvirji: X.frames.map(f => ({ t: f.t, igralec: f.igralec, tekmec: f.tekmec })) });
  if (okvirji) for (const X of [A, B]) X.frames.forEach((f) => fs.writeFileSync(path.join(out, `${name}-${X.tag.toLowerCase()}-${String(Math.round(f.t * 1000)).padStart(4, '0')}ms.png`), Buffer.from(f.src.split(',')[1], 'base64')));
  const json = { scenarij: name, naslov: S.naslov, proga: S.proga, ime_proge: A.proga, m: S.m, casi: S.casi, korak: 1 / 120, cesta: A.cesta, ograja: A.ograja, postavitev: A.postavitev, avti: A.avti,
    enako_pred_trkom: same, razlika_prve_slike_pct: pic.razlika0, strani: { a: strip(A), b: strip(B) }, slika: Object.assign({ datoteka: path.basename(file) }, pic) };
  fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(json, null, 1) + '\n');
  // a short report: one line a frame and side
  const row = (f) => `ti ${sl(f.igralec.kmh).padStart(3)} km/h ${(sl(f.igralec.zasuk) + '°').padStart(6)}` + (f.tekmec ? ` | tekmec ${sl(f.tekmec.kmh).padStart(3)} km/h ${(sl(f.tekmec.zasuk) + '°').padStart(6)}` : '');
  console.log(`${name}: ${S.naslov} · ${A.proga}, ${S.m} m · A cv ${A.cv} ${A.ime} | B cv ${B.cv} ${B.ime}${bRoot !== aRoot ? ' (' + rel(bRoot) + ')' : ''}`);
  console.log(`prvi dotik (${A.stik.kaj}): A korak ${A.stik.korak}, zapiranje ${sl(A.stik.zapiranje, 1)} m/s | B korak ${B.stik.korak}, zapiranje ${sl(B.stik.zapiranje, 1)} m/s`);
  A.frames.forEach((f, i) => console.log(`  ${(f.t === 0 ? 'pred' : '+' + sl(f.t, 2) + ' s').padEnd(8)} A: ${row(f)}   B: ${row(B.frames[i])}`));
  if (!same) console.log('OPOZORILO: strani se pred dotikom razlikujeta (korak ali stanje avtov): primerjava ni ista nesreča. ' + key(A) + ' / ' + key(B));
  else if (pic.razlika0 != null) console.log(`pred dotikom enako stanje na obeh straneh; prva slika se razlikuje v ${sl(pic.razlika0, 2)} % pikslov`);
  console.log(`wrote ${file} (${pic.kb} KB, ${pic.sirina} x ${pic.visina}, JPEG ${pic.kakovost}) and ${name}.json in ${((Date.now() - t0) / 1000).toFixed(0)} s (the game loaded in ${A.sekunde[0]} | ${B.sekunde[0]} s, staged and drawn in ${A.sekunde[1]} | ${B.sekunde[1]} s)`);
} catch (e) { fail = e && e.message ? e.message : String(e); }
finally { await browser.close(); }
if (fail) { console.log('FAIL ' + fail); process.exitCode = 1; }
