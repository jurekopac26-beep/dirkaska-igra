// BOJ ZA MESTO out of the pits (game.js pitFightStep, pitFightHUD): the Red Bull Ring (a long race), the player on autopilot told to come in
// from half way round the first lap. Out of the box the field near the player kept away (a rival put 0.5 s behind it on the circuit while
// the autopilot still drives: no fight before the hand-back); at the hand-back (VOZIŠ TI!, still in the lane) a rival put 1 s behind on the circuit at racing speed: the
// pill at once, BOJ ZA MESTO with the driver's name and the gap (+1,0 s green, smaller as it closes, −0,4 s orange once it is ahead), gone as
// the gap opens past 2 s, after 5 s or once the rival is passed; one fight a stop. Then on the circuit, the window opened as at a hand-back
// (pitFightOpen): a rival 1.8 s behind none, at 1.2 s one (held there: gone after 5 s); a slower rival 0.35 s ahead passed (gone);
// a slow one 1.2 s behind left (gone past 2 s); a car a lap down alongside none; the window shut 4 s after the lane (a rival 0.5 s behind
// then none), none in normal racing without a stop; in English FIGHT FOR POSITION, +0.8 s. Its place: upright (360x640) at the left under
// the stack, on its side (640x360) under the clock (where BOKSI is: hidden while it shows), with buttons, the wheel and tilting,
// the other texts up: over nothing of the HUD or the controls, not over the car, in the screen, its letters at least 9 px.
//   node tests/browser/pitfight.test.mjs            (SHOTS=<folder>: a picture of each place)
import path from 'node:path';
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('BOJ ZA MESTO');
const SHOTS = process.env.SHOTS || '';
const srv = await serve();
const browser = await launch();
const OR = { port: { width: 360, height: 640 }, land: { width: 640, height: 360 } };
const frames = (page, n = 2) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const toRacing = (page) => page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 800 && g.phase !== 'racing'; k++) g.sim(0.05, false, 0, 0); return g.phase; });
// in the page (window.__pf): the gap as the game takes it (s: + the rival behind, − ahead, at the faster car's speed); a car put ds m along
// the track from the player (negative: behind), at v m/s along it, lat m across (default: the racing line), its race distance the player's
// and ds (its lap with it), as Race.step reads them next; the field within lim s of the player put far ahead (but keep); the rival to use
// (racing on the circuit, on the player's lap, the nearest); the pill (its classes, the words, the name, the gap; shown); a step of the race
// and the HUD after it
const helpers = (page) => page.evaluate(() => {
  const g = window.__game, H = window.__pf = {}, $ = (id) => document.getElementById(id);
  const R = () => g.race, P = () => g.race.player;
  H.gap = (o) => (P().dist - o.dist) / Math.max(12, P().speed, o.speed);
  H.put = (o, ds, v, lat) => {
    const Tk = R().track, s = P().q.s + ds, i = Tk.idx(s), off = lat == null ? Tk.rl[i] : lat, gear = o.gear, rpm = o.rpm;
    o.place(Tk.px[i] + Tk.nx[i] * off, Tk.pz[i] + Tk.nz[i] * off, Tk.hd[i]); if (Tk.hasElev) o.y = o.py = Tk.hy[i];
    o.vx = Math.cos(Tk.hd[i]) * v; o.vz = Math.sin(Tk.hd[i]) * v; o.gear = gear; o.rpm = rpm;
    o.q = Tk.query(o.x, o.z, i, o.q); o.sPrev = o.q.s; o.dist = P().dist + ds; o.lap = Math.max(o.lap, Math.floor(o.dist / Tk.len) + 1);
  };
  H.racing = (o) => o !== P() && !o.net && !o.inPit && !R().isOut(o);
  H.clear = (keep, lim = 3) => { let k = 0; for (const o of R().cars) if (o !== keep && H.racing(o) && Math.abs(H.gap(o)) < lim) H.put(o, 600 + 45 * k++, 45); };
  H.rival = () => { const L = R().track.len, lap = Math.floor(P().dist / L); return R().cars.filter(o => H.racing(o) && Math.floor(o.dist / L) === lap).sort((a, b) => Math.abs(a.dist - P().dist) - Math.abs(b.dist - P().dist))[0] || R().cars.find(H.racing); };
  H.side = () => { const d = P().q.d; return d > 0 ? d - 4 : d + 4; };   // (4 m across from the player, towards the middle)
  H.pill = () => { const el = $('h-fight'); return { t: +R().time.toFixed(2), cls: el.className, b: el.children[0].textContent, n: el.children[1].textContent, em: el.children[2].textContent, on: getComputedStyle(el).display !== 'none' }; };
  H.step = (dt) => { g.sim(dt, true); g.hud(dt); };
  // one scenario on the circuit: the field near the player cleared, the window opened as at a hand-back (open), set(o) puts the rival; then
  // the race on a quarter of a second at a time for sec s (each(o, k) before each step, the field kept clear of all but the rival), the
  // pill after each; the fights it began
  H.scen = (open, set, sec, each) => {
    const n0 = g.pitFight.log.length, o = H.rival(), st = [];
    H.clear(o, 4); if (open) g.pitFightOpen(); set(o);
    for (let k = 0; k < sec / 0.25; k++) { if (each) each(o, k); H.clear(o, 4); H.step(0.25); st.push(Object.assign(H.pill(), { g: +H.gap(o).toFixed(2) })); }
    return { st, log: g.pitFight.log.slice(n0), name: String(o.name).toUpperCase(), hb: g.pitFight.hb };
  };
});
const scen = (page, open, set, sec, each) => page.evaluate(([open, set, sec, each]) => {
  const H = window.__pf, f = (src) => src ? new Function('H', 'P', 'return (' + src + ')(H, P)')(H, window.__game.race.player) : null;
  return H.scen(open, f(set), sec, f(each));
}, [open, set.toString(), sec, each ? each.toString() : '']);
// on to a fast part of the lap (over 40 m/s: a car's length or two a tenth of a second, not crawling round a hairpin)
const fast = (page) => page.evaluate(() => { const H = window.__pf, P = window.__game.race.player; for (let k = 0; k < 160 && P.speed < 40; k++) H.step(0.25); return P.speed; });
// the pill's words as the game should give them: a gap of g s (0,0 s level, + behind, − ahead; English with a dot)
const GAP = /^([+−]\d+,\d|0,0) s$/, GAP_EN = /^([+−]\d+\.\d|0\.0) s$/;
const signOk = (p) => p.em[0] === '+' ? / behind$/.test(p.cls) && p.g > 0 : p.em[0] === '−' ? / ahead$/.test(p.cls) && p.g < 0 : p.cls === 'on';
const pillOk = (p, name, en) => p.on && /^on( behind| ahead)?$/.test(p.cls) && p.b === (en ? 'FIGHT FOR POSITION' : 'BOJ ZA MESTO') && p.n === name && (en ? GAP_EN : GAP).test(p.em) && signOk(p)
  && Math.abs(Math.abs(parseFloat(p.em.replace('−', '-').replace(',', '.'))) - Math.abs(p.g)) <= 0.051;

// the place of the pill (as boxwarn.test.mjs places BOKSI): the race held (paused, the pause menu out of the way, the camera behind
// the car), the other texts up: the failures, a yellow flag, the corner sign, a split, a big message, a toast, BOKSI
const hold = (page) => page.evaluate(() => {
  const g = window.__game, $ = (id) => document.getElementById(id), P = g.race.player; g.pause();
  Render.resetCam(); for (let i = 0; i < 60; i++) Render.frame(1 / 60, 1, P, 'chase', {});
  for (const s of document.querySelectorAll('.screen.show')) s.classList.remove('show');
  for (const id of ['hud', 'touch', 'btn-pause']) $(id).classList.remove('off');
  $('h-flt').className = 'on'; $('h-flt').innerHTML = '<span class="pk">PREDRTA GUMA</span><span class="br">VROČE ZAVORE</span>';
  $('h-flag').className = 'on yel'; $('h-flag').textContent = 'RUMENA ZASTAVA';
  $('h-note').style.transition = 'none'; $('h-note').className = 'show sev3';
  $('h-split').textContent = 'SEKTOR 2  35.996'; $('h-split').className = 'show sp';
  $('h-box').className = 'on near r'; $('h-box').firstElementChild.textContent = 'BOKSI'; $('h-box').lastElementChild.textContent = '300 m';
  g.msg('ZADNJI KROG!', 'gold', 600); g.toast('Sedaj lahko spustiš plin, vse bo naredil sam.', 600000);
});
const PLACE = () => {
  const $ = (id) => document.getElementById(id);
  const shown = (e) => { if (!e || getComputedStyle(e).visibility === 'hidden') return false; for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || +c.opacity === 0) return false; } const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const R = (e) => { const r = e.getBoundingClientRect(); return { id: e.id || e.tagName, l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) }; };
  const F = $('h-fight'), P = window.__game.race.player, C = Render.camera, pts = [];
  for (const dx of [-2.6, 2.6]) for (const dz of [-2.6, 2.6]) for (const dy of [0, 1.6]) { const p = new THREE.Vector3(P.x + dx, (P.y || 0) + dy, P.z + dz).project(C); pts.push([(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]); }
  const car = { id: 'car', l: Math.min(...pts.map(p => p[0])), r: Math.max(...pts.map(p => p[0])), t: Math.min(...pts.map(p => p[1])), b: Math.max(...pts.map(p => p[1])) };
  const ids = ['h-main', 'h-pos', 'h-tot', 'h-speed', 'h-lap', 'h-tyre', 'h-tags', 'h-fc', 'h-fuel', 'h-flt', 'h-flag', 'h-box', 'h-tower', 'h-time', 'h-best', 'h-sec', 'h-split', 'h-gap', 'h-map', 'h-pit', 'h-react', 'h-msg', 'h-teamradio', 'toast', 'h-note', 'h-lights',
    'btn-pause', 'btn-rescue', 'c-left', 'c-right', 'c-wheel', 'c-brake', 'c-gas', 'tilt-ind'];
  const stack = Math.max(...['h-main', 'h-tags', 'h-fc', 'h-fuel', 'h-flt', 'h-flag'].map($).filter(shown).map(e => e.getBoundingClientRect().bottom)), wide = () => +$('h-rank').getBoundingClientRect().width.toFixed(1);
  const rw = [wide()]; F.style.display = 'none'; rw.push(wide()); F.style.display = '';
  return { w: innerWidth, h: innerHeight, on: shown(F), box: shown($('h-box')), cls: F.className, words: F.innerText.replace(/\s+/g, ' ').trim(), fs: parseFloat(getComputedStyle(F).fontSize),
    b: R(F), rank: R($('h-rank')), times: R($('h-times')), stack, rw, car, others: ids.map($).filter(shown).map(R) };
};
function wrongPlace(x, k) {
  const bad = [], hit = (a, c) => Math.min(a.r, c.r) - Math.max(a.l, c.l) > 1 && Math.min(a.b, c.b) - Math.max(a.t, c.t) > 1, { b } = x;
  if (!x.on) return ['not shown'];
  if (x.box) bad.push('BOKSI shown with it');
  if (b.l < 0 || b.t < 0 || b.r > x.w || b.b > x.h) bad.push('out of the screen');
  for (const o of x.others) if (hit(b, o)) bad.push('over ' + o.id);
  if (hit(b, x.car)) bad.push('over the car ' + JSON.stringify(x.car));
  if (x.fs < 9) bad.push('letters ' + x.fs + ' px');
  if (k === 'port' && (b.t < x.stack || b.t - x.stack > 6 || Math.abs(b.l - x.rank.l) > 1)) bad.push('not under the stack at the left');
  if (x.rw[0] !== x.rw[1]) bad.push('the stack ' + x.rw.join(' px wide with it, ') + ' px without');
  if (k === 'land' && (b.t < x.times.b || Math.abs((b.l + b.r) / 2 - x.w / 2) > 1.5)) bad.push('not centred under the clock');
  return bad;
}
async function places(page, name) {
  const out = [];
  for (const k of ['land', 'port']) {
    await page.setViewportSize(OR[k]);
    for (const m of ['buttons', 'wheel', 'tilt']) {
      await page.evaluate((m) => Input.setMode(m), m); await frames(page, 3); await page.evaluate(() => Input.layout()); await frames(page, 2);
      const x = await page.evaluate(PLACE), bad = wrongPlace(x, k);
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `pitfight-${name}-${m}-${k}.png`), timeout: 180000 });
      out.push({ k, m, ok: !bad.length, bad, b: x.b, words: x.words, fs: x.fs });
    }
  }
  await page.evaluate(() => Input.setMode('buttons'));
  return out;
}

try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', track: 'rbring', damage: 0, radio: 0, fuel: 0, length: 'long', weather: 'dry', tod: 'day', tower: 1 }, OR.land, { touch: true, context: { reducedMotion: 'reduce' }, seed: 7 });
  await startTrack(page, 'rbring');
  await toRacing(page);
  await helpers(page);

  // 1. a stop: told to come in from half way round the first lap (a long race: the rivals racing all through); out of the box (the crew's work done) step by step, the field within 3 s of the
  // player put far ahead each step; once there a rival 0.5 s behind on the circuit for half a second (the autopilot still drives: none)
  const a = await page.evaluate(async () => {
    const g = window.__game, H = window.__pf, R = g.race, P = R.player, L = R.track.len, out = { pre: null, hb: null, st: [] };
    for (let k = 0; k < 4000; k++) {
      if (P.dist > L * 0.4 && !P.repairN && !P.inPit) P.pitWant = true;   // (from half way round the first lap: at the next way in)
      const fine = P.pitDone && !!g.pitAuto.st;
      H.step(fine ? 1 / 120 : 0.25); if (k % 40 === 0) await null;
      if (!(P.pitDone && g.pitAuto.st)) { if (!g.pitAuto.st && g.pitFight.hb >= 0) break; continue; }
      if (!out.pre) { const o = H.rival(); if (!o) return Object.assign(out, { none: { t: R.time, lap: P.lap } }); H.put(o, -0.5 * 45, 45); const pre = []; for (let j = 0; j < 60; j++) { H.step(1 / 120); pre.push(H.pill().on); }
        out.pre = { n: o.name, g: +H.gap(o).toFixed(2), ap: g.pitAuto.st, shown: pre.some(Boolean), log: g.pitFight.log.length, hb: g.pitFight.hb }; }
      H.clear(null, 3);
      if (!g.pitAuto.st && g.pitFight.hb >= 0) break;   // (the hand-back in this step)
    }
    P.pitWant = false;
    // the hand-back: a rival 1 s behind on the circuit at 45 m/s (on the racing line, the player still in the lane)
    const o = H.rival(); if (!o) return Object.assign(out, { none: { t: R.time, lap: P.lap } }); out.hb = { t: +R.time.toFixed(2), lap: P.lap, hb: g.pitFight.hb, inPit: P.inPit, log: g.pitFight.log.length, ap: g.pitAuto.st, n: o.name, name: String(o.name).toUpperCase(), stop: P.repairN };
    H.put(o, -45, 45); out.hb.g = +H.gap(o).toFixed(2);
    // (a rival that has closed right up behind the player is held there by the AI's following, ~0.1-0.2 s, as often as it pulls out and passes: the pill's
    // sign is under test here, not the overtaking. So once it is within 0.35 s it is put 6 m ahead, as if it had pulled out and passed: the pill must go to −, orange)
    for (let k = 0; k < 40; k++) { const gp = out.st.length ? out.st[out.st.length - 1].g : 9; if (!out.pass && out.st.length >= 3 && gp > 0 && gp < 0.35 && !P.inPit) { H.put(o, 6, Math.max(20, P.speed), H.side()); out.pass = +R.time.toFixed(2); } H.step(0.25); out.st.push(Object.assign(H.pill(), { g: +H.gap(o).toFixed(2), d: +(o.dist - P.dist).toFixed(1), lane: P.inPit })); const f = g.pitFight; if (f.log.length && f.log[0].end && R.time > f.log[0].t1 + 0.5) break; }
    out.log = g.pitFight.log; out.out = g.pitFight.out; out.win = g.pitFight.hb;
    // one fight a stop: if the window is still open, another rival 0.5 s behind: none
    const left = out.out >= 0 ? out.out + 4 - R.time : 0; out.again = null;
    if (left > 0.6) { const o2 = R.cars.find(c => H.racing(c) && c !== o); H.put(o2, -0.5 * Math.max(20, P.speed), Math.max(20, P.speed), H.side()); const st = []; for (let k = 0; k < 2; k++) { H.step(0.25); st.push(H.pill().on); } out.again = { left: +left.toFixed(2), shown: st.some(Boolean), log: g.pitFight.log.length }; }
    for (let k = 0; k < 40 && g.pitFight.hb >= 0; k++) H.step(0.25);   // (on until the window is shut)
    out.shut = g.pitFight.hb < 0;
    return out;
  });
  T.check('no fight before the hand-back: a rival 0.5 s behind on the circuit while the autopilot drives out of the box, no pill',
    !!a.pre && a.pre.ap === 'lane' && Math.abs(a.pre.g) < 0.7 && !a.pre.shown && a.pre.log === 0 && a.pre.hb < 0, JSON.stringify(a.none || a.pre));
  const e = a.log[0], st = a.st.filter(p => p.on), first = st[0];
  T.check('at the hand-back (VOZIŠ TI!, still in the lane, the field kept away): a rival put 1 s behind on the circuit, the fight at once',
    !!a.hb && a.hb.stop > 0 && a.hb.inPit && !a.hb.ap && a.hb.log === 0 && Math.abs(a.hb.g - 1) < 0.05 && a.log.length === 1 && e.n === a.hb.n && e.t0 - a.hb.t <= 0.26 && Math.abs(e.hb - a.hb.hb) < 1e-6 && e.g0 > 0.7 && e.g0 <= 1.5,
    JSON.stringify({ hb: a.hb, log: a.log }));
  const val = (p) => parseFloat(p.em.replace('\u2212', '-').replace(',', '.'));
  T.check('... the pill at once: BOJ ZA MESTO, the driver\'s name, the gap (about +0,8 s after a quarter of a second: green)',
    !!first && first.t - a.hb.t <= 0.3 && first.cls === 'on behind' && val(first) > 0.5 && val(first) <= 1.05 && first.n === a.hb.name && first.b === 'BOJ ZA MESTO', JSON.stringify(st.slice(0, 3)));
  T.check('... every pill as the game should give it (the words, the name, the gap to a tenth, its colour by its sign)', st.length >= 2 && st.every(p => pillOk(p, a.hb.name, false)),
    JSON.stringify(st.filter(p => !pillOk(p, a.hb.name, false)).concat(st.slice(0, 2))));
  const endOk = !!e && (e.end === 'gap' ? Math.abs(e.g1) >= 2 : e.end === 'time' ? e.t1 - e.t0 > 5 - 1e-6 : e.end === 'pass' ? e.g1 > 0 : false), after = a.st.filter(p => e && p.t > e.t1 + 0.01);
  T.check('... gone as the gap opens past 2 s, after 5 s or once the rival is passed: ended so, within 5 s, the pill gone after it',
    endOk && e.t1 - e.t0 <= 5.26 && after.length >= 1 && after.every(p => !p.on && p.cls === '') && st.every(p => p.t <= e.t1 + 0.01), JSON.stringify({ e, last: a.st.slice(-4) }));
  T.check('... the rival closing: the gap smaller, then it is alongside or ahead (−, orange) before the end', st.some(p => p.em[0] === '+' && val(p) < (e ? e.g0 : 0)) && (st.some(p => p.em[0] === '−' || p.em === '0,0 s') || (e && e.end === 'time')),
    JSON.stringify(st.map(p => p.em + (p.lane ? ' (lane)' : ''))));
  T.check('one fight a stop: another rival 0.5 s behind inside the window after it, none; the window shut 4 s after the lane', (a.again === null || (!a.again.shown && a.again.log === 1)) && a.shut,
    JSON.stringify({ again: a.again, out: a.out, shut: a.shut }));

  // 2. on the circuit, the window opened as at a hand-back: a rival 1.8 s behind (held there) none; at 1.2 s one, held there: gone after 5 s
  await fast(page);
  const b = await scen(page, true, (H, P) => (o) => H.put(o, -1.8 * P.speed, P.speed, H.side()), 7.5, (H, P) => (o, k) => H.put(o, -(k < 4 ? 1.8 : 1.2) * P.speed, P.speed, H.side()));
  const bOn = b.st.filter(p => p.on), bOff = b.st.slice(0, 4);
  T.check('the window open: a rival 1.8 s behind, none; at 1.2 s the fight (+1,2 s, green), held there gone after 5 s',
    bOff.every(p => !p.on) && b.log.length === 1 && b.log[0].end === 'time' && Math.abs(b.log[0].g0 - 1.2) < 0.05 && bOn.length >= 18 && bOn.every(p => Math.abs(val(p) - 1.2) < 0.15 && p.cls === 'on behind' && pillOk(p, b.name, false)) && !b.st[b.st.length - 1].on && b.log[0].t1 - b.log[0].t0 > 5 - 1e-6 && b.log[0].t1 - b.log[0].t0 < 5.26,
    JSON.stringify({ log: b.log, st: b.st.map(p => p.em) }));
  // a slower rival 0.35 s ahead, 4 m across from the player (on a fast part of the lap): the fight (−, orange), the player passes it: gone
  await fast(page);
  const c = await scen(page, true, (H, P) => (o) => H.put(o, 0.35 * P.speed, P.speed * 0.5, H.side()), 4);
  T.check('a slower rival 0.35 s ahead (4 m across): about −0,2 s orange, the player passes it: gone (passed)',
    c.log.length === 1 && c.log[0].g0 < 0 && c.log[0].end === 'pass' && c.st.some(p => p.on && p.cls === 'on ahead' && pillOk(p, c.name, false)) && !c.st[c.st.length - 1].on, JSON.stringify({ log: c.log, st: c.st }));
  // a slow rival 1.2 s behind: the player pulls away, gone past 2 s
  await fast(page);
  const d = await scen(page, true, (H, P) => (o) => H.put(o, -1.2 * P.speed, 8, H.side()), 4);
  T.check('a slow rival 1.2 s behind: the fight, the player pulls away: gone once the gap opens past 2 s',
    d.log.length === 1 && d.log[0].end === 'gap' && d.log[0].g1 >= 2 && d.log[0].t1 - d.log[0].t0 < 5 && d.st.some(p => p.on && p.cls === 'on behind') && !d.st[d.st.length - 1].on, JSON.stringify({ log: d.log, st: d.st }));
  // a car a lap down alongside: none
  const l = await scen(page, true, (H, P) => (o) => { H.put(o, 0, P.speed, H.side()); o.dist -= window.__game.race.track.len; }, 1.5);
  T.check('a car a lap down alongside the player: no fight (the same lap only)', !l.log.length && l.st.every(p => !p.on), JSON.stringify({ log: l.log, st: l.st.map(p => p.g) }));
  // the window shut 4 s after the lane: a rival 0.5 s behind then, none
  const w = await scen(page, true, (H) => (o) => H.put(o, 900, 45), 5.5, (H, P) => (o, k) => { if (k >= 18) H.put(o, -0.5 * P.speed, P.speed, H.side()); });
  T.check('the window shut 4 s after the lane: a rival 0.5 s behind after it, no fight', !w.log.length && w.st.every(p => !p.on) && w.hb < 0, JSON.stringify({ log: w.log, hb: w.hb }));
  // normal racing (no stop, no window): a rival 0.5 s behind, none
  const n = await scen(page, false, (H, P) => (o) => H.put(o, -0.5 * P.speed, P.speed, H.side()), 1.5, (H, P) => (o) => H.put(o, -0.5 * P.speed, P.speed, H.side()));
  T.check('normal racing (no stop): a rival 0.5 s behind, no fight', !n.log.length && n.st.every(p => !p.on), JSON.stringify(n.log));

  // 3. in English: FIGHT FOR POSITION, the name, +0.8 s; then held (paused) for its place
  await page.evaluate(() => Lang.set('en'));
  const en = await scen(page, true, (H, P) => (o) => H.put(o, -0.8 * P.speed, P.speed, H.side()), 1, (H, P) => (o) => H.put(o, -0.8 * P.speed, P.speed, H.side()));
  const enOn = en.st.filter(p => p.on);
  T.check('in English: FIGHT FOR POSITION, the name, +0.8 s (green)', enOn.length >= 3 && enOn.every(p => Math.abs(parseFloat(p.em) - 0.8) < 0.15 && pillOk(p, en.name, true)), JSON.stringify(en.st));
  await hold(page);
  await page.evaluate(() => { document.getElementById('h-fight').children[1].textContent = 'J. VAN DER BERGHE'; document.getElementById('h-fight').children[2].textContent = '−1.4 s'; });
  const pe = await places(page, 'en');
  T.check('its place (FIGHT FOR POSITION, a long name): upright under the stack at the left, on its side under the clock, BOKSI hidden; with buttons, the wheel and tilting over nothing of the HUD or the controls, not over the car, in the screen, at least 9 px',
    pe.length === 6 && pe.every(o => o.ok), JSON.stringify(pe.filter(o => !o.ok).concat(pe.slice(0, 2))));
  await page.evaluate(() => { Lang.set('sl'); const F = document.getElementById('h-fight'); F.children[0].textContent = 'BOJ ZA MESTO'; F.children[2].textContent = '−1,4 s'; });
  const ps = await places(page, 'sl');
  T.check('... and in Slovenian (BOJ ZA MESTO)', ps.length === 6 && ps.every(o => o.ok), JSON.stringify(ps.filter(o => !o.ok).concat(ps.slice(0, 2))));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
