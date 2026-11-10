// Padec čez rob v slikah: the player's car driven over the edge of an unfenced road (Killar), as the phone shows it: the camera behind the
// car, on its side (1280 x 720, deviceScaleFactor 1), the HUD with its message, a strip of frames at FIXED game times round the moment the
// car's middle passes the edge. For »ZDAJ« against »POTEM« of the topic »Padec čez rob (Killar)«: the same script on a patched tree gives the
// frames of the same game times (--po <the earlier run's .json>).
//
//   node padec-slike.mjs --root <folder with the game> --m 524 --kmh 60 --kot 20 --out <folder>          one fall, the frames picked by itself
//   node padec-slike.mjs --root <patched folder> --po <out>/killar-524m-60kmh.json --oznaka POTEM --out <folder2>
//                                                                the same staging and the same game times on another copy of the game
//   … --casi=-0.3,0,0.2,0.5,1,2,3,4      the frames' times (s after the edge; the = is needed when the list starts with a minus)
//   … --dodaj 3,4,5                      more frames after the planned ones (a longer fall)
// Options (all but --root and --m have a default):
//   --root <folder>      the copy of the game to serve (its index.html; its own tests/browser/lib.mjs opens the game as the tests do)
//   --proga <id>         killar
//   --m <metres>         where along the road the car's middle crosses the edge (metres after the start)
//   --stran levo|desno   the side it leaves the road on (levo)
//   --kmh <n>            its speed, held with the throttle up to the edge (60)
//   --kot <deg>          the exit angle: the nose's angle to the road's line, toward that side (20)
//   --pred <s>           how long it drives before its middle reaches the edge (0.8): it starts v x pred back along its own line
//   --casi <s,s,…|auto>  the frames, seconds after the edge (auto: 8 frames from 0.3 s before the edge to 1 s after the put-back)
//   --dodaj <s,s,…>      frames added to the plan (seconds after the edge)
//   --izhodisce <s>      the game time of the edge, seconds after the release (else measured in this copy by a first pass with nothing drawn)
//   --po <file.json>     an earlier run: its staging, its edge time and its frames (anything given on the command line wins)
//   --po-robu nic|plin|zavora   the pedals once the middle is past the edge (nic)
//   --out <folder>  --ime <name>  --oznaka <ZDAJ>  --velikost <1280x720>  --avto <id>  --skoda <0|1|2> (1: the game's own)  --seme <n> (11)
//   --kb <n> (300: the sheet's size)  --stolpci <n> (4)  --najvec <s> (8: the longest run after the release)  --dotik (phone HUD: touch)
// How a fall is staged (nothing random in it; the page's own loop is switched off and the race is stepped only from here, 1/120 s a step):
//   1. the quick entry (index.html?proga=<id>&t=5&tekmeci=0&vreme=suho; --vstop-t: past the flying start of an open road, whose autopilot
//      drives the player's car for its first 3 s) opens the race, alone, dry, by day
//   2. the car is put on its own straight line to the edge point (the road's sample m metres after the start, the barrier line of that side:
//      Track.query's bl / br), v x pred back from it, its nose at kot to the road
//   3. 1.25 s on the spot (every step put back with its speed: the gearbox, the revs and the suspension settle, the throttle that holds the
//      speed is found), the camera settled behind it (no dust laid meanwhile)
//   4. the release: no steer, the holding throttle; a frame of the game 60 times a second (the HUD's and Render.frame's own work all done,
//      the GL draw calls silenced) and really drawn only at the moments asked for, each then taken as the browser shows it (canvas + HUD)
//   the edge (»rob«, time 0): the first step after which the car's middle is past the barrier line of its side (the tool's own measure from
//   Track.query, not the game's flag: the same in a copy whose fall works differently)
// Out: <ime>.webp (the sheet, at most --kb KB), <ime>-avto.webp (the same frames cut out round the car), <ime>-<nn>.png (the frames), <ime>.json (the staging, the events, every frame's numbers and
// a trace 60 times a second: where the car is, the ground under it, the camera, the message).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { register, createRequire } from 'node:module';

const STEP = 1 / 120;
const sl = (x, n = 0) => (Object.is(+x.toFixed(n), -0) ? 0 : x).toFixed(n).replace('.', ',').replace('-', '−');
const args = process.argv.slice(2);
const flag = (k) => { let i = args.findIndex(a => a === k || a.startsWith(k + '=')); if (i < 0) return null; if (args[i].includes('=')) return args.splice(i, 1)[0].slice(k.length + 1); return args.splice(i, 2)[1]; };
const has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const usage = 'usage: node padec-slike.mjs --root <folder> --m <metres> [--proga killar] [--stran levo|desno] [--kmh 60] [--kot 20] [--pred 0.8] [--casi auto|s,s,…] [--dodaj s,…]\n' +
  '       [--izhodisce <s>] [--po <file.json>] [--po-robu nic|plin|zavora] [--out <folder>] [--ime <name>] [--oznaka ZDAJ] [--velikost 1280x720] [--avto <id>] [--skoda 1]\n' +
  '       [--seme 11] [--kb 300] [--stolpci 4] [--najvec 8] [--vstop-t 5] [--dotik]';
if (has('--help') || has('-h')) { console.log(usage); process.exit(0); }
const poFile = flag('--po'), PO = poFile ? JSON.parse(fs.readFileSync(poFile, 'utf8')) : null, PP = PO ? PO.postavitev : {};
const pick = (k, d) => { const v = flag(k); return v != null ? v : d; };
const rootArg = flag('--root') || process.env.GAME_ROOT, proga = pick('--proga', PP.proga || 'killar'), m = +pick('--m', PP.m != null ? PP.m : NaN);
const stranS = pick('--stran', PP.stran || 'levo'), kmh = +pick('--kmh', PP.kmh != null ? PP.kmh : 60), kot = +pick('--kot', PP.kot != null ? PP.kot : 20), pred = +pick('--pred', PP.pred != null ? PP.pred : 0.8);
const casiArg = flag('--casi'), dodajArg = flag('--dodaj'), izhArg = flag('--izhodisce'), poRobu = pick('--po-robu', PP.po_robu || 'nic');
const outArg = flag('--out'), oznaka = pick('--oznaka', 'ZDAJ'), vel = pick('--velikost', PP.velikost || '1280x720'), avto = pick('--avto', PP.avto || null), skoda = +pick('--skoda', PP.skoda != null ? PP.skoda : 1);
const seme = +pick('--seme', PP.seme || 11), kb = +pick('--kb', 300), stolpci = +pick('--stolpci', 4), najvec = +pick('--najvec', 8), dotik = has('--dotik'), vstopT = +pick('--vstop-t', PP.vstop_t || 5);
const ime = pick('--ime', `${proga}-${m}m-${kmh}kmh`);
const [VW, VH] = vel.split('x').map(Number), stran = /^d/.test(stranS) ? 1 : -1;
if (args.length || !rootArg || !(m >= 0) || !(kmh > 0) || !(kot > 0 && kot <= 90) || !(pred >= 0.2 && pred <= 5) || !(VW >= 320 && VH >= 180) || !/^(nic|plin|zavora)$/.test(poRobu) || !/^(levo|desno|l|d)/.test(stranS)) {
  console.log(usage + (args.length ? '\nunknown: ' + args.join(' ') : '') + '\n--root and --m are needed; --kmh > 0; --kot 0-90 (degrees off the road\'s line); --pred 0.2-5 s'); process.exit(2);
}
const root = path.resolve(rootArg), out = path.resolve(outArg || path.join(os.tmpdir(), 'padec-slike'));
if (!fs.existsSync(path.join(root, 'index.html')) || !fs.existsSync(path.join(root, 'js', 'tracks', proga + '.js'))) { console.log(`no game with the track ${proga} in ${root}`); process.exit(2); }
const list = (s) => s.split(',').map(Number);
// the frames' times: given, an earlier run's, or picked after the first pass (auto)
let casi = casiArg && casiArg !== 'auto' ? list(casiArg) : !casiArg && PO ? PO.casi.slice() : null;
if (casi && casi.some(t => !Number.isFinite(t))) { console.log('--casi: seconds after the edge, e.g. --casi=-0.3,0,0.5,1'); process.exit(2); }
const dodaj = dodajArg ? list(dodajArg) : [];
let izhodisce = izhArg != null ? +izhArg : PO && PO.izhodisce != null ? PO.izhodisce : null;

// (the copy's own tests/browser/lib.mjs imports 'playwright' as a module: a copy without node_modules finds none that way, though require()
// does (NODE_PATH, a global install): the name is then resolved as require resolves it, as tools/trki/slike.mjs does)
{ const require = createRequire(import.meta.url); let pw = null;
  try { pw = path.join(path.dirname(require.resolve('playwright/package.json')), 'index.mjs'); } catch (_) { /* none: the import below says so */ }
  if (pw && fs.existsSync(pw)) register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) { if (s !== 'playwright') return next(s, c); try { return await next(s, c); } catch (e) { return { url: ${JSON.stringify(url.pathToFileURL(pw).href)}, shortCircuit: true }; } }`)); }
const { serve, launch, openGame } = await import(url.pathToFileURL(path.join(root, 'tests', 'browser', 'lib.mjs')).href);

/* ---------------- in the page: the loop off, the car staged and settled; window.__k4 steps, draws and measures from then on ---------------- */
async function pageInit(o) {
  const g = window.__game, R = g.race, STEP = 1 / 120, RAD = Math.PI / 180;
  if (!R || !R.player) return { error: 'no race on the page' };
  const T = R.track, P = R.player, W = Render.world;
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)), clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const r3 = (x) => (x == null || !Number.isFinite(x) ? null : +x.toFixed(3)), r1 = (x) => (x == null || !Number.isFinite(x) ? null : +x.toFixed(1));
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  // the page's own loop off (its frame asks for the next one by name: the queued turn runs once more, paused, and asks for none). Waited for
  // on the browser's own frames, not on a clock: on a busy machine the queued turn may come seconds late, and would then step the race itself
  const raf0 = window.requestAnimationFrame.bind(window), turn = () => new Promise(r => { let done = false; const ok = () => { if (!done) { done = true; r(); } }; raf0(() => raf0(ok)); setTimeout(ok, 5000); });
  g.pause(); window.requestAnimationFrame = () => 0;
  await turn(); let n1 = g.fr.raf, calm = 0;
  for (let k = 0; k < 40 && calm < 3; k++) { await turn(); await wait(50); if (g.fr.raf === n1) calm++; else { calm = 0; n1 = g.fr.raf; } }
  if (calm < 3) return { error: 'the page\'s own loop still runs' };
  g.resume(); Render.resize();
  if (g.phase !== 'racing') return { error: 'the race is not under way (phase ' + g.phase + ')' };
  if (R.flyOn) return { error: 'the flying start is still on (its autopilot drives the car): a larger --vstop-t' };
  // the road's frame at the edge point: (tx, tz) along it, (nx, nz) across it to the right, sg: which way a heading turns to the right
  const s0 = T.open ? Math.min(T.startS + o.m, T.finishS - 1) : T.startS + o.m, i0 = T.idx(((s0 % T.len) + T.len) % T.len);
  const O = { x: T.px[i0], z: T.pz[i0], hd: T.hd[i0], tx: Math.cos(T.hd[i0]), tz: Math.sin(T.hd[i0]), nx: T.nx[i0], nz: T.nz[i0] };
  const sg = O.nx * -O.tz + O.nz * O.tx >= 0 ? 1 : -1, sd = o.stran, q0 = T.query(O.x, O.z, i0, {}), b = sd > 0 ? q0.br : q0.bl, half = T.wa ? T.wa[i0] : T.w;
  const h = wrap(O.hd + sg * sd * o.kot * RAD), v = o.kmh / 3.6, L = v * o.pred, E = { x: O.x + O.nx * sd * b, z: O.z + O.nz * sd * b };
  const tP = { x: E.x - Math.cos(h) * L, z: E.z - Math.sin(h) * L, h, v, vx: v * Math.cos(h), vz: v * Math.sin(h) };
  let ext = 0; for (const [rx, rz] of P.corners) { const wx = rx * Math.cos(h) - rz * Math.sin(h), wz = rx * Math.sin(h) + rz * Math.cos(h), e = (wx * O.nx + wz * O.nz) * sd; if (e > ext) ext = e; }
  const qs = T.query(tP.x, tP.z, i0, {}), Fn = T.fence, fk = Fn ? Math.floor((s0 - Fn.s0) / Fn.P) : -1;
  const kje = { s: r3(q0.s), m: o.m, polsirina_ceste: r3(half), rob_od_sredine: r3(b), rob_od_roba_ceste: r3(b - half), pade: !!(T.fallAt && T.fallAt[sd > 0 ? 1 : 0][i0]), unf: T.unf ? Array.from(T.unf) : null, tla: !!T.floor,
    ograja: !!(Fn && Fn.side === sd && fk >= 0 && fk < Fn.n && Fn.on[fk]), visina_ceste: r3(T.hy ? T.hy[i0] : 0), smer_ceste: r1(O.hd / RAD),
    start_od_sredine: r3(sd * qs.d), start_vogal_do_roba: r3((sd > 0 ? qs.br : qs.bl) - (sd * qs.d + ext)), pot_do_roba: r3(L) };
  // the ground across the edge there, as the world draws it (groundH) and as the fall knows it (Track.floorAt): every metre from 6 m inside the
  // edge line to 30 m beyond it, heights against the road's own at that sample; where the slope first drops more than 30 degrees
  { const W0 = Render.world, fo0 = {}, y0 = T.hy ? T.hy[i0] : 0, rows = [];
    for (let d = -6; d <= 30; d++) { const x = E.x + O.nx * sd * d, z = E.z + O.nz * sd * d, g0 = W0 && W0.groundH ? W0.groundH(x, z) : NaN, f0 = T.floor && T.floorAt(x, z, fo0) ? fo0.h : NaN; rows.push([d, Number.isFinite(g0) ? +(g0 - y0).toFixed(2) : null, Number.isFinite(f0) ? +(f0 - y0).toFixed(2) : null]); }
    let brk = null; for (let k = 6; k < rows.length - 1 && brk == null; k++) if (rows[k][1] != null && rows[k + 1][1] != null && rows[k][1] - rows[k + 1][1] > Math.tan(30 * RAD)) brk = rows[k][0];
    const at = (d) => (rows[d + 6] || [])[1], ang = (a, b2) => (at(a) != null && at(b2) != null ? +(Math.atan2(at(a) - at(b2), b2 - a) / RAD).toFixed(1) : null);
    kje.profil_stolpci = ['m za robom', 'teren (m glede na cesto)', 'tla padca (m glede na cesto)']; kje.profil = rows; kje.prelom_za_robom = brk; kje.strmina_0_5 = ang(0, 5); kje.strmina_5_15 = ang(5, 15); kje.strmina_15_30 = ang(15, 30); }
  // the car put there: on the road's height, in the gear of its speed
  const put = (c, t) => {
    c.place(t.x, t.z, t.h); c.q = T.query(c.x, c.z, i0, c.q); if (T.hasElev) c.y = c.py = T.hy[c.q.i]; c.sPrev = c.q.s;
    const M = c.m; if (M.gears && t.v > 1) for (let k = 1; k <= M.gears.length; k++) { c.gear = k; if (t.v / M.rw * M.gears[k - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
    c.vx = t.vx; c.vz = t.vz; c.locked = false; c.stuckT = 0; c.wrongT = 0; c.pitWant = false;
  };
  const back = (c, t) => { c.x = c.px = t.x; c.z = c.pz = t.z; c.h = c.ph = t.h; c.vx = t.vx; c.vz = t.vz; c.w = 0; };
  for (const c of R.cars) if (c !== P) { c.locked = true; const vw = Render.viewOf(c); if (vw && vw.grp) vw.grp.visible = false; }   // (any other car: standing where it is, not drawn)
  put(P, tP);
  const f0 = R.fence ? R.fence.n : 0, d0 = P.dmg || 0, falls0 = P.falls || 0, off0 = P.offN || 0;
  // on the spot: the gearbox, the revs and the suspension settle, the throttle that holds the speed is found
  let thr = 0.3;
  for (let k = 0; k < 150; k++) { back(P, tP); g.sim(STEP, false, 0, thr, 0); thr = clamp(thr - (P.speed - tP.v) * 2, 0, 1); if (P.fall || (R.fence && R.fence.n > f0)) return { error: 'the car touches the fence or is over the edge where it is staged: a longer --pred or a smaller --kot', kje }; }
  back(P, tP);
  // the picture: a frame as the game draws it (the HUD's step, then the camera behind the car, dust, marks); quiet: the GL draw calls do nothing
  const gl = document.getElementById('gl'), G3 = (() => { try { return gl.getContext('webgl2') || gl.getContext('webgl'); } catch (_) { return null; } })();
  const DRAWS = ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced', 'drawRangeElements', 'clear', 'blitFramebuffer'];
  const mute = (on) => { if (G3) for (const k of DRAWS) { if (!on) delete G3[k]; else if (typeof G3[k] === 'function') G3[k] = () => {}; } };
  const frame = (real, dt, opt) => { g.hud(dt); if (real) Render.frame(dt, 1, P, 'chase', opt || {}); else { mute(true); try { Render.frame(dt, 1, P, 'chase', opt || {}); } finally { mute(false); } } };
  if (Render.birds) { Render.birds.off = true; if (Render.birds.mesh) Render.birds.mesh.visible = false; }   // (the birds fly on the page's own clock from its loading on, and take the dust's random numbers with them: no two runs alike with them)
  Render.resetCam(); for (let k = 0; k < 30; k++) frame(false, 0.1, { noFx: true });   // (3 s of the camera's time behind the standing picture; no dust laid)
  { let s = o.seme; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }   // (the dust's and the sparks' numbers the same in every run)
  // what is measured: the car's middle against the edge line and the ground, the camera against the terrain and the car, the HUD's message
  const V3 = Render.camera.position.constructor, fo = {}, qq = {}, gH = (x, z) => { const y = W && W.groundH ? W.groundH(x, z) : NaN; return Number.isFinite(y) ? y : null; };
  // what may hide the car: the terrain, and the road's own shelf (its surface between the two barrier lines, the relief across it aside)
  const lq = {}, top2 = (x, z) => { const t = gH(x, z), q = T.query(x, z, P.q.i, lq), on = q.i >= 0 && q.d < q.br && -q.d < q.bl && T.hy ? T.hy[q.i] : null; return t == null ? on : on == null ? t : Math.max(t, on); };
  const los = (cx, cy, cz, x, y, z) => { let worst = -1e9; for (let k = 1; k < 60; k++) { const u = k / 60, t = top2(cx + (x - cx) * u, cz + (z - cz) * u); if (t != null) worst = Math.max(worst, t - (cy + (y - cy) * u)); } return worst; };
  // the car's state of every step, folded into one number: the same number in another copy of the game = the same drive, bit for bit
  const f64 = new Float64Array(1), u8 = new Uint8Array(f64.buffer); let hsh = 2166136261;
  const mix = () => { for (const x of [P.x, P.y, P.z, P.h, P.vx, P.vy, P.vz, P.w, P.speed, P.gear, P.rpm, P.steer]) { f64[0] = Number.isFinite(x) ? x : 0; for (let i = 0; i < 8; i++) hsh = Math.imul(hsh ^ u8[i], 16777619); } }, hex = () => (hsh >>> 0).toString(16).padStart(8, '0');
  mix(); const sums = { spust: hex(), do_ograje: null, do_roba: null, do_vrnitve: null };
  const K = window.__k4 = { n: 0, drawn: 0, thr, t0: R.time, sums, ev: { rob: -1, padec: -1, dotik: -1, konec_padca: -1, vrnjen: -1, ograja: -1 }, yRob: null, put0: R.putT ? R.putT.get(P) : undefined, trace: [], ext: {} };
  const m = () => {
    const q = T.query(P.x, P.z, P.q.i, qq), cam = Render.camera.position, vw = Render.viewOf(P), msg = document.getElementById('h-msg');
    const tla = T.floor && T.floorAt(P.x, P.z, fo) ? fo.h : null, ter = gH(P.x, P.z), camT = gH(cam.x, cam.z), y = P.y || 0;
    const p = new V3(P.x, y + 0.7, P.z).project(Render.camera), inView = Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && p.z < 1;
    const top = los(cam.x, cam.y, cam.z, P.x, y + 1.3, P.z), low = los(cam.x, cam.y, cam.z, P.x, y + 0.25, P.z);
    // the body as drawn, whatever turns it (its group's own matrix): the nose's and the right side's angle over the level, the roof's angle off the vertical
    const bg = vw && (vw.bodyG || vw.grp), e = bg && bg.matrixWorld ? bg.matrixWorld.elements : null, ang = (a, b, c) => Math.asin(clamp(b / (Math.hypot(a, b, c) || 1), -1, 1)) / RAD;
    const att = e ? [r1(ang(e[0], e[1], e[2])), r1(ang(e[8], e[9], e[10])), r1(90 - ang(e[4], e[5], e[6]))] : null;
    return { n: K.n, t: r3(K.n * STEP), cas_dirke: r3(R.time), x: r3(P.x), y: r3(y), z: r3(P.z), smer: r1(sg * wrap(P.h - O.hd) / RAD), kmh: r1(Math.hypot(P.vx, P.vz) * 3.6), vy: r3(P.vy || 0), w: r3(sg * (P.w || 0)),
      cez_rob: r3(sd > 0 ? q.d - q.br : -q.d - q.bl), s: r3(q.s), pod_robom: K.yRob == null ? null : r3(K.yRob - y), visina_ceste: r3(T.hy ? T.hy[q.i] : 0),
      tla: r3(tla), nad_tlemi: tla == null ? null : r3(y - tla), teren: r3(ter), nad_terenom: ter == null ? null : r3(y - ter),
      pada: P.fall ? (Number.isFinite(P.fall.t) ? r3(P.fall.t) : 0) : null, dotik: !!(P.fall && P.fall.land), zrak: P.air ? 1 : 0, prevracanje: !!P.rl, skoda: r3(P.dmg || 0), padci: (P.falls || 0) - falls0, predalec: (P.offN || 0) - off0, razbitih: R.fence ? R.fence.n - f0 : 0,
      kam: [r3(cam.x), r3(cam.y), r3(cam.z)], kam_nad_terenom: camT == null ? null : r3(cam.y - camT), kam_nad_avtom: r3(cam.y - y), kam_do_avta: r3(Math.hypot(cam.x - P.x, cam.y - y, cam.z - P.z)),
      kam_kot: r1(sg * wrap(Math.atan2(P.z - cam.z, P.x - cam.x) - O.hd) / RAD), v_kadru: inView, zaslon: [r3(p.x), r3(p.y)], zakrit_streha: r3(top), zakrit_kolesa: r3(low),
      narisan: !!(vw && vw.grp && vw.grp.visible), nos_gor: att ? att[0] : null, bok_gor: att ? att[1] : null, nagnjen: att ? att[2] : null, nagib_naprej: vw && vw.grp ? r1((vw.grp.rotation.z + (vw.bodyG ? vw.bodyG.rotation.z : 0)) / RAD) : null, nagib_vstran: vw && vw.grp ? r1((vw.grp.rotation.x + (vw.bodyG ? vw.bodyG.rotation.x : 0)) / RAD) : null,
      napis: msg && /\bshow\b/.test(msg.className) ? msg.textContent : '' };
  };
  const COLS = ['t', 'x', 'y', 'z', 'smer', 'kmh', 'vy', 'w', 'cez_rob', 'pod_robom', 'nad_tlemi', 'nad_terenom', 'pada', 'dotik', 'kam_nad_terenom', 'kam_nad_avtom', 'kam_do_avta', 'kam_kot', 'v_kadru', 'zakrit_streha', 'zakrit_kolesa', 'nos_gor', 'bok_gor', 'nagnjen', 'napis'];
  K.cols = COLS;
  // one step of the race: the holding throttle up to the edge, then the pedals asked for; the events of that step
  const one = () => {
    const past = K.ev.rob >= 0, x0 = P.x, z0 = P.z;
    g.sim(STEP, false, 0, past ? (o.po_robu === 'plin' ? K.thr : 0) : K.thr, past && o.po_robu === 'zavora' ? 1 : 0); K.n++;
    const q = T.query(P.x, P.z, P.q.i, qq), ex = sd > 0 ? q.d - q.br : -q.d - q.bl, E2 = K.ev;
    if (E2.rob < 0 && ex > 0) { E2.rob = K.n; K.yRob = P.y || 0; }
    if (E2.padec < 0 && P.fall) E2.padec = K.n;
    if (E2.dotik < 0 && P.fall && P.fall.land) E2.dotik = K.n;
    if (E2.padec >= 0 && E2.konec_padca < 0 && !P.fall) E2.konec_padca = K.n;
    if (E2.vrnjen < 0 && ((R.putT && R.putT.get(P) !== K.put0) || (E2.rob >= 0 && Math.hypot(P.x - x0, P.z - z0) > 3))) E2.vrnjen = K.n;   // (put somewhere else at once: Race.putBack's mark, or a jump of over 3 m in a step)
    if (E2.ograja < 0 && R.fence && R.fence.n > f0) E2.ograja = K.n;
    if (E2.ograja === K.n) sums.do_ograje = hex(); if (E2.rob === K.n) sums.do_roba = hex(); if (E2.vrnjen === K.n) sums.do_vrnitve = hex();   // (the steps before that one)
    mix();
    if (E2.rob >= 0 && E2.vrnjen < 0) { const X = K.ext, y = P.y || 0, tla = T.floor && T.floorAt(P.x, P.z, fo) ? fo.h : null, ter = gH(P.x, P.z);
      X.najglobje = Math.max(X.najglobje == null ? -1e9 : X.najglobje, K.yRob - y); if (tla != null) X.najmanj_nad_tlemi = Math.min(X.najmanj_nad_tlemi == null ? 1e9 : X.najmanj_nad_tlemi, y - tla);
      if (ter != null) X.najmanj_nad_terenom = Math.min(X.najmanj_nad_terenom == null ? 1e9 : X.najmanj_nad_terenom, y - ter); X.najdlje_cez_rob = Math.max(X.najdlje_cez_rob == null ? -1e9 : X.najdlje_cez_rob, ex);
      X.najvec_vy_gor = Math.max(X.najvec_vy_gor == null ? -1e9 : X.najvec_vy_gor, P.vy || 0); }
  };
  // on to step `to` (a frame of the game after every second step: 60 a second), the frame at `to` really drawn if asked; that frame's numbers
  K.advance = (to, real) => {
    while (K.n < to) { one(); if (K.n % 2 === 0) { const here = K.n >= to; frame(real && here, 2 * STEP); K.drawn = K.n; const r = m(); K.trace.push(COLS.map(c => r[c])); if (here) K.last = r; } }
    return K.last;
  };
  K.report = () => ({ ev: K.ev, sums: K.sums, ekstremi: Object.fromEntries(Object.entries(K.ext).map(([k, x]) => [k, r3(x)])), cols: K.cols, trace: K.trace, n: K.n, cas_dirke: r3(R.time), skoda: r3((P.dmg || 0) - d0), padci: (P.falls || 0) - falls0, predalec: (P.offN || 0) - off0, razbitih: R.fence ? R.fence.n - f0 : 0 });
  // (the first pass: on until 1.2 s after the put-back, or the longest run)
  K.calib = (maxN) => { for (;;) { const E2 = K.ev; if (K.n >= maxN || (E2.vrnjen >= 0 && K.n >= E2.vrnjen + 144)) break; K.advance(K.n + 2 - (K.n % 2), false); } return K.report(); };
  const car = { ime: P.m.name, id: P.m.id, dolzina: P.m.len, sirina: P.m.wid, masa: P.m.mass, fizika: P.phys };
  return { kje, avto: car, plin: r3(thr), cas_dirke: r3(R.time), start: m(), jezik: document.documentElement.lang || '', ver: g.ver, proga: T.def.name, tekmecev: R.cars.length - 1, platno: [gl.width, gl.height] };
}

/* ---------------- one visit of the game: the race opened, the car staged ---------------- */
const VIEW = { width: VW, height: VH };
async function visit(browser, srv) {
  const set = { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', damage: skoda };   // (damage 1: Samo videz, the game's own)
  const q = new URLSearchParams({ proga, t: String(vstopT), tekmeci: '0', vreme: 'suho' });   // (t: past a flying start, whose autopilot drives the player's car to the line)
  if (avto) q.set('avto', avto);
  const w0 = Date.now(), { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?' + q, set, VIEW, { seed: seme, touch: dotik, context: { deviceScaleFactor: 1 } });
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
  const st = await page.evaluate((id) => { const g = window.__game; return { ok: !!(g.race && g.race.track.def.id === id), bad: g.quick.q.bad }; }, proga);
  if (st.bad.length || !st.ok) throw new Error(`no race on ${proga} (${st.bad.join(', ') || 'the quick entry did not start one'})`);
  const init = await page.evaluate(pageInit, { m, stran, kmh, kot, pred, seme, po_robu: poRobu });
  if (init.error) throw new Error(init.error + (init.kje ? ' ' + JSON.stringify(init.kje) : ''));
  return { ctx, page, errors, init, loadS: +((Date.now() - w0) / 1000).toFixed(1) };
}

/* ---------------- the sheet: the frames in rows, the game time and the measured state under each ---------------- */
async function compose(browser, tiles, head, sub, foot, file, ar) {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 }), page = await ctx.newPage();
  try {
    await page.setContent('<!doctype html><meta charset="utf-8"><body></body>');
    await page.evaluate(async (srcs) => { window.__im = await Promise.all(srcs.map(s => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = s; }))); }, tiles.map(t => 'data:image/png;base64,' + t.png.toString('base64')));
    const draw = ([tw, q, cols, caps, head, sub, foot, ar]) => {
      const th = Math.round(tw / ar), gap = 6, f = Math.max(11, Math.round(tw / 34)), ch = Math.round(f * 2.9), hh = Math.round(f * 3.6), fh = Math.round(f * 1.9), rows = Math.ceil(caps.length / cols);
      const c = document.createElement('canvas'); c.width = cols * tw + (cols + 1) * gap; c.height = hh + rows * (th + ch + gap) + fh;
      const x = c.getContext('2d'); x.fillStyle = '#0d1117'; x.fillRect(0, 0, c.width, c.height); x.textBaseline = 'middle'; x.imageSmoothingQuality = 'high';
      const F = '"DejaVu Sans", "Liberation Sans", Arial, sans-serif';
      x.fillStyle = '#e8eef4'; x.font = `bold ${Math.round(f * 1.3)}px ${F}`; x.fillText(head, gap, Math.round(hh * 0.33));
      x.fillStyle = '#9fb3c8'; x.font = `${Math.round(f * 0.95)}px ${F}`; x.fillText(sub, gap, Math.round(hh * 0.76));
      caps.forEach((cp, k) => { const px = gap + (k % cols) * (tw + gap), py = hh + Math.floor(k / cols) * (th + ch + gap);
        if (cp[3]) x.drawImage(window.__im[k], cp[3][0], cp[3][1], cp[3][2], cp[3][3], px, py, tw, th); else x.drawImage(window.__im[k], px, py, tw, th);
        x.fillStyle = '#ffb300'; x.font = `bold ${Math.round(f * 1.12)}px ${F}`; x.fillText(cp[0], px + 2, py + th + Math.round(ch * 0.3));
        const w = x.measureText(cp[0]).width; x.fillStyle = '#9fb3c8'; x.font = `${Math.round(f * 0.9)}px ${F}`; x.fillText(cp[1], px + 2 + w + f * 0.6, py + th + Math.round(ch * 0.3));
        x.fillStyle = '#e8eef4'; x.font = `${f}px ${F}`; x.fillText(cp[2], px + 2, py + th + Math.round(ch * 0.74), tw - 4); });
      x.fillStyle = '#9fb3c8'; x.font = `${Math.round(f * 0.85)}px ${F}`; x.fillText(foot, gap, c.height - Math.round(fh * 0.5), c.width - 2 * gap);
      return [c.toDataURL('image/webp', q), c.width, c.height];
    };
    const caps = tiles.map(t => t.cap.concat([t.crop || null]));
    for (const tw of [640, 560, 480, 420, 360]) for (const q of [0.82, 0.74, 0.66, 0.58, 0.5]) {
      const [src, w, h] = await page.evaluate(draw, [tw, q, stolpci, caps, head, sub, foot, ar]), buf = Buffer.from(src.split(',')[1], 'base64');
      if (buf.length <= kb * 1024 || (tw === 360 && q === 0.5)) { fs.writeFileSync(file, buf); return { datoteka: path.basename(file), kb: +(buf.length / 1024).toFixed(1), sirina: w, visina: h, okvir: tw, kakovost: q }; }
    }
  } finally { await ctx.close(); }
}

/* ---------------- the run ---------------- */
const t0 = Date.now(), browser = await launch(), srv = await serve(root);
let fail = '';
try {
  fs.mkdirSync(out, { recursive: true });
  let git = ''; try { git = execFileSync('git', ['-C', root, 'log', '-1', '--format=%h %s'], { encoding: 'utf8' }).trim().slice(0, 90); } catch (_) { /* not a checkout */ }
  // the first pass (nothing drawn): when the middle passes the edge, when the car touches the slope, when it is put back
  let kal = null;
  if (izhodisce == null || !casi) {
    const A = await visit(browser, srv), w1 = Date.now();
    const r = await A.page.evaluate((n) => window.__k4.calib(n), Math.round(najvec / STEP));
    await A.ctx.close();
    if (r.ev.rob < 0) throw new Error(`the car's middle never passed the edge in ${najvec} s (${JSON.stringify(A.init.kje)}; events ${JSON.stringify(r.ev)}; start ${JSON.stringify(A.init.start)}; the trace's rows 0, 30, 60, 120 and the last: ${[0, 30, 60, 120, r.trace.length - 1].map(k => JSON.stringify(r.trace[Math.min(k, r.trace.length - 1)])).join(' ')}): a longer --pred, a larger --kot or another --m`);
    kal = { ev: r.ev, sums: r.sums, ekstremi: r.ekstremi, sekunde: [A.loadS, +((Date.now() - w1) / 1000).toFixed(1)] };
    if (izhodisce == null) izhodisce = +(r.ev.rob * STEP).toFixed(4);
    if (!casi) {   // auto: 8 frames from 0.3 s before the edge to 1 s after the put-back; one of the middle ones at the first touch of the slope
      const back = r.ev.vrnjen >= 0 ? (r.ev.vrnjen - r.ev.rob) * STEP : Math.max(1, r.n * STEP - izhodisce - 1), land = r.ev.dotik >= 0 ? (r.ev.dotik - r.ev.rob) * STEP : -1;
      const mid = [0.2 * back, 0.45 * back, 0.7 * back];
      if (land > 0.05 && land < back - 0.05) { let k = 0; for (let j = 1; j < 3; j++) if (Math.abs(mid[j] - land) < Math.abs(mid[k] - land)) k = j; mid[k] = land + 2 * STEP; }
      casi = [-0.3, 2 * STEP, ...mid, back - 2 * STEP, back + 2 * STEP, back + 1];
    }
  }
  // the frames' steps: every time on the frames' own beat (60 a second after the release)
  const n0 = Math.round(izhodisce / STEP), steps = [...new Set(casi.concat(dodaj).map(t => Math.max(2, 2 * Math.round((n0 + t / STEP) / 2))))].sort((a, b) => a - b);
  // the second pass: the same run, the frames taken
  const B = await visit(browser, srv), w2 = Date.now(), frames = [];
  for (let k = 0; k < steps.length; k++) {
    const f = await B.page.evaluate(([n]) => window.__k4.advance(n, true), [steps[k]]);
    await B.page.waitForTimeout(350);   // (the HUD's own fades are on the real clock: over before the picture)
    const file = path.join(out, `${ime}-${String(k + 1).padStart(2, '0')}.png`), png = await B.page.screenshot({ path: file, type: 'png' });
    frames.push(Object.assign({ datoteka: path.basename(file), po_robu: +((steps[k] - n0) * STEP).toFixed(4) }, f, { png }));
  }
  const rep = await B.page.evaluate(() => window.__k4.report());
  if (B.errors.length) console.log(`(${B.errors.length} page errors: ${B.errors.slice(0, 3).join(' | ').slice(0, 300)})`);
  await B.ctx.close();
  const E = rep.ev, rel = (n) => (n < 0 ? null : +((n - n0) * STEP).toFixed(4));
  // the caption under a frame: the game time against the edge, the race's clock, the state as measured
  const state = (f) => {
    const st = f.pada != null ? (f.dotik ? 'na pobočju' : 'pada') : E.vrnjen >= 0 && f.n >= E.vrnjen ? 'vrnjen na cesto' : f.cez_rob > 0 ? 'čez rob' : 'na cesti';
    const bits = [st, sl(f.kmh) + ' km/h'];
    if (f.pod_robom != null && (f.pada != null || f.cez_rob > 0) && !(E.vrnjen >= 0 && f.n >= E.vrnjen)) { bits.push(sl(f.pod_robom, 1) + ' m pod robom'); if (f.nad_terenom != null) bits.push(f.nad_terenom >= 0 ? sl(f.nad_terenom, 1) + ' m nad terenom' : sl(-f.nad_terenom, 1) + ' m POD terenom'); }
    if (f.napis) bits.push('»' + f.napis + '«');
    if (!f.v_kadru) bits.push('avto zunaj slike'); else if (f.zakrit_streha > 0) bits.push('avto za terenom');
    return bits.join(' · ');
  };
  const tiles = frames.map(f => ({ png: f.png, cap: [(f.po_robu === 0 ? 'rob' : 'rob ' + (f.po_robu > 0 ? '+' : '') + sl(f.po_robu, 2) + ' s'), 'čas dirke ' + sl(f.cas_dirke, 2) + ' s', state(f)] }));
  const I = B.init, head = `${I.proga} · ${m} m po štartu · čez ${stran > 0 ? 'desni' : 'levi'} rob pri ${sl(kmh)} km/h pod ${sl(kot)}° · ${oznaka}`;
  const sub = `kamera za avtom, ${VW} × ${VH} · ${I.avto.ime} · rob: sredina avta čez črto roba (${sl(I.kje.rob_od_roba_ceste, 1)} m za robom ceste)` + (git ? ' · ' + git.split(' ')[0] : '');
  const foot = `Koraki po 1/120 s, do roba plin, ki drži hitrost, brez volana; po robu ${poRobu === 'nic' ? 'brez pedal' : poRobu}. ` +
    `Padec ${E.padec >= 0 ? sl(rel(E.padec), 2) + ' s' : 'ni zaznan'}, dotik pobočja ${E.dotik >= 0 ? sl(rel(E.dotik), 2) + ' s' : 'ga ni'}, vrnjen na cesto ${E.vrnjen >= 0 ? sl(rel(E.vrnjen), 2) + ' s' : 'ne'} po robu; najgloblje ${rep.ekstremi.najglobje != null ? sl(rep.ekstremi.najglobje, 1) : '?'} m pod robom.`;
  const sheet = await compose(browser, tiles, head, sub, foot, path.join(out, ime + '.webp'), VW / VH);
  // the same frames cut out round the car (the car is small from the camera behind it): IZ x IZ*5/8 pixels of the frame, the car in the middle
  const IZ = Math.min(VW, Math.round(VW * 0.3)), IH = Math.round(IZ * 5 / 8), cut = (f) => { const cx = (f.zaslon[0] + 1) / 2 * VW, cy = (1 - f.zaslon[1]) / 2 * VH; return [Math.round(Math.max(0, Math.min(VW - IZ, cx - IZ / 2))), Math.round(Math.max(0, Math.min(VH - IH, cy - IH / 2))), IZ, IH]; };
  const sheet2 = await compose(browser, tiles.map((t, k) => ({ png: t.png, cap: t.cap, crop: cut(frames[k]) })), head, `izrez okoli avta (${IZ} × ${IH} pik iz slike ${VW} × ${VH}, povečano) · ` + sub, foot, path.join(out, ime + '-avto.webp'), IZ / IH);
  const same = kal ? ['rob', 'padec', 'dotik', 'vrnjen'].every(k => kal.ev[k] === E[k]) && JSON.stringify(kal.sums) === JSON.stringify(rep.sums) : null;
  // against the earlier run (--po): the same drive up to the fence, up to the edge, up to the put-back?
  const proti = PO && PO.kontrolne_vsote ? Object.fromEntries(['spust', 'do_ograje', 'do_roba', 'do_vrnitve'].map(k => [k, PO.kontrolne_vsote[k] === rep.sums[k]])) : null;
  const json = { orodje: 'padec-slike.mjs', oznaka, root, git, proga, ime_proge: I.proga, ver: I.ver, velikost: vel, korak: STEP,
    postavitev: { proga, m, stran: stran > 0 ? 'desno' : 'levo', kmh, kot, pred, po_robu: poRobu, avto, skoda, seme, velikost: vel, vstop_t: vstopT }, kje: I.kje, avto: I.avto, plin: I.plin, tekmecev: I.tekmecev, platno: I.platno,
    izhodisce, izhodisce_izmerjeno: +(E.rob * STEP).toFixed(4), casi: steps.map(n => +((n - n0) * STEP).toFixed(4)), cas_dirke_ob_spustu: I.cas_dirke,
    dogodki_po_robu: { ograja: rel(E.ograja), rob: rel(E.rob), padec: rel(E.padec), dotik: rel(E.dotik), konec_padca: rel(E.konec_padca), vrnjen: rel(E.vrnjen) }, dogodki_koraki: E, ekstremi: rep.ekstremi,
    kontrolne_vsote: rep.sums, enako_kot_po: proti, po: poFile ? path.resolve(poFile) : null, skoda: rep.skoda, padci: rep.padci, predalec: rep.predalec, razbitih_polj: rep.razbitih, prvi_prehod: kal, prehoda_enaka: same,
    okvirji: frames.map(f => { const o = Object.assign({}, f); delete o.png; return o; }), list: sheet, list_avto: sheet2, sled_stolpci: rep.cols, sled: rep.trace,
    sekunde: { skupaj: +((Date.now() - t0) / 1000).toFixed(0), nalaganje: B.loadS, slike: +((Date.now() - w2) / 1000).toFixed(1) } };
  fs.writeFileSync(path.join(out, ime + '.json'), JSON.stringify(json).replace(/,"(okvirji|sled|sled_stolpci|list|kje|dogodki_po_robu|ekstremi|postavitev|prvi_prehod|sekunde)":/g, ',\n"$1":').replace(/\],\[/g, '],\n[') + '\n');
  console.log(`${ime}: ${head}`);
  console.log(`rob ${sl(izhodisce, 3)} s po spustu (izmerjeno ${sl(E.rob * STEP, 3)}); po robu: ograja ${rel(E.ograja)}, padec ${rel(E.padec)}, dotik ${rel(E.dotik)}, vrnjen ${rel(E.vrnjen)} s; ekstremi ${JSON.stringify(rep.ekstremi)}; škoda +${rep.skoda}` + (same === false ? '\nOPOZORILO: prvi prehod (brez slik) in drugi (s slikami) nista enaka: ' + JSON.stringify(kal.ev) + ' / ' + JSON.stringify(E) : ''));
  console.log(`kontrolne vsote vožnje (stanje avta vseh korakov): spust ${rep.sums.spust}, do ograje ${rep.sums.do_ograje}, do roba ${rep.sums.do_roba}, do vrnitve ${rep.sums.do_vrnitve}` + (proti ? `; enako kot ${path.basename(poFile)}: ${Object.entries(proti).map(([k, v]) => k + ' ' + (v ? 'da' : 'NE')).join(', ')}` : ''));
  console.log(`teren za robom: prelom (prvi padec nad 30°) ${I.kje.prelom_za_robom == null ? 'ga ni do 30 m' : I.kje.prelom_za_robom + ' m za robom'}, strmina 0–5 m ${I.kje.strmina_0_5}°, 5–15 m ${I.kje.strmina_5_15}°, 15–30 m ${I.kje.strmina_15_30}°; ograja ${I.kje.ograja ? 'da' : 'ne'}; start ${I.kje.start_od_sredine} m od sredine ceste, vogal ${I.kje.start_vogal_do_roba} m do roba`);
  for (const f of frames) console.log(`  ${(f.po_robu >= 0 ? '+' : '') + f.po_robu.toFixed(3)} s  ${state(f)} | smer ${f.smer}°, vy ${f.vy}, kamera ${f.kam_nad_terenom} m nad terenom, ${f.kam_nad_avtom} m nad avtom, ${f.kam_do_avta} m od avta, pogled ${f.kam_kot}°, zakrit ${f.zakrit_streha}/${f.zakrit_kolesa}, narisan nos ${f.nos_gor}° bok ${f.bok_gor}° nagnjen ${f.nagnjen}°${f.napis ? ', »' + f.napis + '«' : ''}`);
  console.log(`wrote ${path.join(out, sheet.datoteka)} (${sheet.kb} KB, ${sheet.sirina} x ${sheet.visina}, okvir ${sheet.okvir}, webp ${sheet.kakovost}), ${sheet2.datoteka} (${sheet2.kb} KB, ${sheet2.sirina} x ${sheet2.visina}), ${frames.length} PNG and ${ime}.json in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
} catch (e) { fail = e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n') : String(e); }
finally { await browser.close(); await srv.close(); }
if (fail) { console.log('FAIL ' + fail); process.exitCode = 1; }
