// The run from the police on the screen (Vršič, Policija, a phone upright): the radio's line in the column at the right, under the map and as wide as
// it, never in the middle of the screen; no banner of the run (helicopter, ambush, spike strip, roadblock, flat tyre ...: the radio and the arrows tell
// it, the notes of the race stay); at the top, under the stars, arrows for what is ahead (the patrol car that brought a spike strip: orange, the
// metres to it, from 500 m on; gone once the player is past it) next to the arrows behind at the bottom; the spike strip laid 160 m ahead is a hazard
// mat 1.2 m wide (yellow and black stripes, steel spikes) with an amber beacon flashing at each end; and the picture is sharp at speed (no depth of
// field, no streaks at the edges).
//   node tests/browser/polhud.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the run from the police on the screen');
const srv = await serve();
const browser = await launch();
const wait = (ms) => new Promise(r => setTimeout(r, ms));
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 0, camera: 'chase', track: 'vrsic', mode: 'police', comm: 0 }, { width: 390, height: 844 }, { seed: 7 });
  await startTrack(page, 'vrsic');
  // every note of the race that shows, from now on
  await page.evaluate(() => { window.__notes = []; const m = document.getElementById('h-msg'); new MutationObserver(() => { if (m.className.includes('show') && m.textContent) window.__notes.push(m.textContent); }).observe(m, { attributes: true, childList: true, characterData: true, subtree: true }); });

  // the chase (the checkpoint passed on autopilot), the player 330 m before the first spike strip, at speed
  const s0 = await page.evaluate(async () => {
    const g = window.__game, R = g.race, pol = R.pol, Tk = R.track, P = R.player;
    g.pause(); pol.D = Object.assign({}, pol.D, { bust: 1e9 });
    for (let i = 0; i < 70 && pol.stage !== 'chase'; i++) g.sim(1, true);
    const e = pol.plan.find(x => x.kind === 'spike' && !x.done); if (!e) return { err: 'no spike strip planned' };
    const i = Tk.idx(e.s - 330), d = Tk.w * 0.42;
    P.place(Tk.px[i] + Tk.nx[i] * d, Tk.pz[i] + Tk.nz[i] * d, Tk.hd[i]); P.y = P.py = P.roadY = Tk.hy[i]; P.vx = Math.cos(P.h) * 30; P.vz = Math.sin(P.h) * 30; P.q = Tk.query(P.x, P.z, i, P.q); P.sPrev = P.q.s;
    for (let k = 0; k < 3; k++) g.sim(0.5, true);
    g.resume(); await new Promise(r => setTimeout(r, 700));
    const sp = pol.spikes[0];
    return { stage: pol.stage, strip: !!sp, on: sp && sp.on, to: sp && Math.round(sp.s - P.q.s), car: !!(sp && sp.car) };
  });
  T.check('the chase on, a spike strip planned ahead: its patrol car parked there, the strip not laid yet (it is, 160 m before it)', s0.stage === 'chase' && s0.strip && s0.car && s0.on === false && s0.to > 250, JSON.stringify(s0));

  const head = () => page.evaluate(() => ({ head: [...document.querySelectorAll('#h-head i.on')].map(e => ({ cls: e.className, txt: e.lastElementChild.textContent })), n: document.querySelectorAll('#h-head i').length, nTail: document.querySelectorAll('#h-tail i').length,
    box: (() => { const r = document.getElementById('h-head').getBoundingClientRect(), s = document.getElementById('h-pol').getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, polB: s.bottom, w: innerWidth }; })() }));
  await page.waitForFunction(() => document.querySelector('#h-head i.on.k'), null, { timeout: 40000 }).catch(() => 0);
  const h1 = await head(), k1 = h1.head.find(a => / k( |$)/.test(a.cls + ' '));
  T.check('at the top, under the stars: an orange arrow to the patrol car with the spike strip, the metres to it (~' + s0.to + ' m), four places in each bar', !!k1 && /^\d+ m$/.test(k1.txt) && (k1 ? Math.abs(parseInt(k1.txt) - s0.to) : 999) <= 30 && h1.n === 4 && h1.nTail === 4 && h1.box.t >= h1.box.polB - 1 && h1.box.l >= 0 && h1.box.r <= h1.box.w, JSON.stringify(h1));

  // 60 m before it: the strip is laid, a hazard mat across the road seen from afar
  const s1 = await page.evaluate(async () => {
    const g = window.__game, R = g.race, P = R.player, sp = R.pol.spikes[0];
    g.pause(); for (let k = 0; k < 600 && sp.s - P.q.s > 60; k++) g.sim(0.05, true); P.speed = 25; P.vx = Math.cos(P.h) * 25; P.vz = Math.sin(P.h) * 25; g.resume(); for (let k = 0; k < 150 && !((Render.roadInfo() || {}).spikes > 0); k++) await new Promise(r => setTimeout(r, 200));
    const ri = Render.roadInfo() || {}, mats = [];
    Render.scene.traverse(o => { if (o.isInstancedMesh && ri.spikes && o.count === ri.spikes) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; mats.push({ x: +(b.max.x - b.min.x).toFixed(2), z: +(b.max.z - b.min.z).toFixed(2), y: +b.max.y.toFixed(2) }); } });
    return { on: sp.on, to: Math.round(sp.s - P.q.s), metres: ri.spikes, mats, len: +(sp.d1 - sp.d0).toFixed(1) };
  });
  const mat = s1.mats.find(m => m.x > 2.3 && m.x < 2.5 && m.z > 0.9 && m.z < 1.1);
  T.check('the strip laid (60 m ahead): a metre of it a mat 2.4 m deep (it was 0.56) with the spikes standing 0.36 m up, as many metres as the road is wide there', s1.on && s1.to <= 70 && !!mat && mat.y >= 0.3 && s1.metres >= Math.floor(s1.len) - 1 && s1.metres <= Math.ceil(s1.len) + 1, JSON.stringify(s1));
  await page.waitForFunction((to) => [...document.querySelectorAll('#h-head i.on.k')].some(e => parseInt(e.lastElementChild.textContent) <= to), 80, { timeout: 30000 }).catch(() => 0);
  const h2 = await head(), k2 = h2.head.find(a => / k( |$)/.test(a.cls + ' '));
  T.check('and the orange arrow is still there, nearer', !!k2 && k1 && parseInt(k2.txt) < parseInt(k1.txt) && parseInt(k2.txt) <= 80, JSON.stringify(h2.head));

  // the radio: a line in the column at the right, under the map, as wide as it, small; not in the middle
  const rd = await page.waitForFunction(() => { const e = document.getElementById('h-radio'); return e.className.includes('show') && e.textContent.length > 5; }, null, { timeout: 40000 }).then(() => page.evaluate(() => {
    const e = document.getElementById('h-radio'), m = document.getElementById('h-map').getBoundingClientRect(), r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    return { parent: e.parentNode.id, pos: cs.position, fs: parseFloat(cs.fontSize), l: r.left, r: r.right, t: r.top, b: r.bottom, mapL: m.left, mapR: m.right, mapB: m.bottom, w: innerWidth, h: innerHeight, txt: e.textContent.slice(0, 60) };
  })).catch(e => ({ err: String(e) }));
  T.check('the radio: a line in the column at the right (#h-side), under the map and as wide as it, small, nowhere near the middle of the screen', rd.parent === 'h-side' && rd.pos === 'static' && Math.abs(rd.l - rd.mapL) <= 1 && Math.abs(rd.r - rd.mapR) <= 1 && rd.t >= rd.mapB && rd.fs <= 11 && rd.l > rd.w * 0.6 && rd.b < rd.h * 0.5, JSON.stringify(rd));

  // the heat up: the helicopter and the spike strip's event (the radio tells it); the strip passed: the arrow gone; no banner of the run
  const s2 = await page.evaluate(async () => {
    const g = window.__game, R = g.race, P = R.player, sp = R.pol.spikes[0]; R.pol.cool = -3;
    g.pause(); for (let k = 0; k < 400 && P.q.s < sp.s + 25; k++) g.sim(0.05, true); g.resume(); await new Promise(r => setTimeout(r, 600));
    return { past: Math.round(P.q.s - sp.s), flat: P.flat || 0, notes: window.__notes.slice(), speedKmh: Math.round(P.speed * 3.6), heli: !!(Render.roadInfo() || {}).heli };
  });
  const banned = /HELIKOPTER|ZASEDA|BODIČAST|ZAPORA|PREBITA GUMA|NEOZNAČENA|SPET TE VIDIJO|HLODI NA CESTI|IZGUBILI SO SLED|PATRULJA JE IZLOČENA|ZBIL SI POLICISTA/;
  T.check('no banner of the run was shown (helicopter, spike strip ...): the notes of the race only', !s2.notes.some(n => banned.test(n)), JSON.stringify(s2.notes));
  const h3 = await head();
  T.check('past the strip: no orange arrow for it any more', s2.past >= 20 && !h3.head.some(a => / k( |$)/.test(a.cls + ' ') && parseInt(a.txt) < 30), JSON.stringify({ past: s2.past, head: h3.head }));

  // a roadblock ahead (several patrol cars across the road): one arrow for all of it
  const b0 = await page.evaluate(async () => {
    const g = window.__game, R = g.race, pol = R.pol, Tk = R.track, P = R.player;
    const e = pol.plan.find(x => x.kind !== 'spike' && !x.done && x.s > P.q.s + 400); if (!e) return { err: 'no roadblock planned ahead' };
    g.pause(); const i = Tk.idx(e.s - 330), d = Tk.w * 0.42;
    P.place(Tk.px[i] + Tk.nx[i] * d, Tk.pz[i] + Tk.nz[i] * d, Tk.hd[i]); P.y = P.py = P.roadY = Tk.hy[i]; P.vx = Math.cos(P.h) * 30; P.vz = Math.sin(P.h) * 30; P.q = Tk.query(P.x, P.z, i, P.q); P.sPrev = P.q.s;
    for (let k = 0; k < 3; k++) g.sim(0.5, true);
    g.resume(); await new Promise(r => setTimeout(r, 600));
    return { cars: pol.cars.filter(c => c.pol.block && c.pol.mode === 'park').length, to: Math.round(e.s - P.q.s) };
  });
  await page.waitForFunction(() => [...document.querySelectorAll('#h-head i.on.k')].some(e => parseInt(e.lastElementChild.textContent) > 280), null, { timeout: 30000 }).catch(() => 0);
  const h4 = await head(), mine = h4.head.filter(a => / k( |$)/.test(a.cls + ' ') && Math.abs(parseInt(a.txt) - b0.to) <= 40);
  T.check('a roadblock ahead (' + b0.cars + ' patrol cars across the road): one orange arrow for all of it, the metres to it (~' + b0.to + ' m)', b0.cars >= 2 && mine.length === 1, JSON.stringify({ b0, head: h4.head }));

  // sharp at speed
  const fx = await page.evaluate(async () => { const g = window.__game, P = g.race.player; g.pause(); P.speed = 45; for (let i = 0; i < 4; i++) Render.frame(1 / 60, 1, P, g.S.camera, {}); const I = Render.look2Info(); return { blur: I.blur, speedBlur: I.speedBlur, kmh: Math.round(P.speed * 3.6) }; });
  T.check('at speed the picture is sharp: no depth of field (the car behind and the one ahead are not blurred), no streaks at the edges', fx.blur === 0 && fx.speedBlur === 0, JSON.stringify(fx));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
