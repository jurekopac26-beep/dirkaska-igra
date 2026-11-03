// A rival out of the pits just ahead (IZ BOKSOV, game.js pitOutStep; 100), Bathurst: a rival done with its stop on its way out of the lane
// and the player on the circuit behind the way out, both put there at speed:
// 1. It joins the circuit ~1 s before the player gets there: the pill of BOJ ZA MESTO in its place with IZ BOKSOV, the pit icon, the driver's
//    name and the gap (−n,n s: ahead, orange), as soon as the player is 6 s or less from the way out; gone again (the gap opened, the
//    player past it, or after 6 s), once a stop (the log: one).
// 2. None for a rival joining far ahead (it has joined before the player is 6 s from the way out), nor for one the player is at the way
//    out before.
// 3. In English: OUT OF THE PITS.
//   node tests/browser/pitout.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('a rival out of the pits just ahead (bathurst)');
const srv = await serve();
const browser = await launch();
// in the page: a rival (the k-th car behind the player in the order) in the lane dR m before its end, done with its stop, at vR m/s; the
// player on the circuit dP m before the lane's end at vP m/s; then the race on (the computer driving both) for sec s, the HUD drawn each
// 0.05 s: the pill's state each time, the log
const RUN = ([dR, vR, dP, vP, sec]) => {
  const g = window.__game, r = g.race, P = r.player, Tk = r.track, D = Tk.def.pit, sE = Tk.startS + D[2], L = Tk.len, el = document.getElementById('h-fight');
  const put = (c, s, off, v) => { s = ((s % L) + L) % L; const i = Tk.idx(s), h = Tk.hd[i]; c.place(Tk.px[i] + Tk.nx[i] * off, Tk.pz[i] + Tk.nz[i] * off, h); c.q = Tk.query(c.x, c.z, i, c.q); c.sPrev = c.q.s; if (Tk.hasElev) c.y = c.py = Tk.hy[i]; c.roadY = c.y; c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v; c.w = 0; };
  const R = r.cars.find(c => !c.isPlayer && !c.inPit && !c.finished);
  { const s = sE - dR, p = Tk.pitAt(s); put(R, s, p.sd * p.o, vR); R.inPit = true; R.pitG = true; R.pitDone = true; R.pitState = 'done'; R.pitWant = false; }
  put(P, sE - dP, 0, vP); P.inPit = false; P.pitG = false; P.pitWant = false;
  const out = [], t0 = r.time, pre = el.classList.contains('on');
  for (let k = 0; k < sec * 20; k++) {
    g.sim(0.05, true); g.hud(0.05);
    const on = el.classList.contains('on'); out.push({ t: +(r.time - t0).toFixed(2), on, cls: el.className, b: on ? el.children[0].textContent : '', n: on ? el.children[1].textContent : '', g: on ? el.children[2].textContent : '', rIn: !!R.inPit, dd: +(((R.q.s - P.q.s) % L + L * 1.5) % L - L / 2).toFixed(1) });
  }
  return { name: String(R.name).toUpperCase(), pre, out, log: g.pitOut.log.slice(-3), fight: g.pitFight.on };
};
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase' }, { width: 640, height: 360 });
  await startTrack(page, 'bathurst');
  await page.evaluate(() => { const g = window.__game, P = g.race.player; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
    for (let k = 0; k < 400 && g.phase !== 'racing'; k++) g.sim(0.1, true); for (let k = 0; k < 200; k++) g.sim(0.05, true); });
  // 1. the rival 60 m before the lane's end at 20 m/s (there in ~3 s), the player 230 m before it at 55 m/s (~4.2 s): ~1.2 s behind it
  const a = await page.evaluate(RUN, [60, 20, 230, 55, 8]), shown = a.out.filter(o => o.on), first = shown[0];
  T.check('a rival joining ~1 s ahead: IZ BOKSOV with its name and the gap (ahead, −n,n s, orange), the pit icon, while it is still in the lane',
    !a.pre && shown.length > 5 && !!first && first.t <= 0.3 && first.rIn && shown.every(o => o.b === 'IZ BOKSOV' && o.n === a.name && /^−\d+,\d s$/.test(o.g) && /\bout\b/.test(o.cls) && /\bahead\b/.test(o.cls)),
    JSON.stringify({ first, n: shown.length, last: shown[shown.length - 1] }));
  const end = a.log[a.log.length - 1];
  T.check('gone again (the gap opened, the player past it, or after 6 s), once a stop: one in the log', !!end && a.log.length === 1 && /^(gap|pass|time)$/.test(end.end) && !a.out[a.out.length - 1].on && end.g0 < -0.5 && end.g0 > -2,
    JSON.stringify({ log: a.log }));
  // 2. none for one far ahead (the player 600 m back: it has joined ~7 s before him); none when the player is at the way out first
  const b = await page.evaluate(RUN, [60, 20, 600, 55, 8]), c = await page.evaluate(RUN, [100, 10, 150, 55, 8]);
  T.check('none for a rival joining far ahead, nor for one the player is at the way out before', !b.pre && !c.pre && !b.out.some(o => o.on) && !c.out.some(o => o.on),
    JSON.stringify({ b: b.out.find(o => o.on) || null, c: c.out.find(o => o.on) || null, pre: [b.pre, c.pre] }));
  // 3. English
  await page.evaluate((l) => { const g = window.__game; g.onAction('to-settings'); document.querySelector(`[data-set="lang"] button[data-v="${l}"]`).click(); g.onAction('settings-done'); g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; }, 'en');
  const d = await page.evaluate(RUN, [60, 20, 230, 55, 8]), sd = d.out.filter(o => o.on);
  T.check('in English: OUT OF THE PITS', !d.pre && sd.length > 3 && sd.every(o => o.b === 'OUT OF THE PITS' && /^−\d+\.\d s$/.test(o.g)), JSON.stringify(sd[0] || null));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
