// Yellow flags, the safety car and penalties in the game (the Red Bull Ring, the player on autopilot): the safety car out (the message,
// the board on the HUD, the car with its flashing light bar drawn, on the minimap), in and green again at the line; a car stopped ahead
// (a yellow flag: the message, the marshal's flag beside the track, the flag on the HUD in the zone); the player overtaking under the
// yellow flag (the warning with a countdown on the HUD, then +5 s) and the penalty in the results.
//   node tests/browser/flags.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('flags: yellow, the safety car, penalties');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'rbring', weather: 'dry' }, { width: 390, height: 844 });
  const hud = () => page.evaluate(() => { const r = window.__game.race, F = r.fl, el = (id) => document.getElementById(id), fi = Render.flagInfo();
    return { sc: F.sc && F.sc.state, yel: F.yel.length, flag: el('h-flag').className + ':' + el('h-flag').textContent, msg: el('h-msg').textContent, toast: el('toast').textContent,
      scDrawn: fi.sc && fi.scCar === (F.sc && F.sc.car), lamp: fi.lampOn, marshals: fi.flags, pen: r.player.fl ? r.player.fl.pen : 0, phase: window.__game.phase }; });
  // step the race (paused, on autopilot), then two drawn frames (the HUD and the scene follow the race only while it runs)
  const sim = (t) => page.evaluate((t) => new Promise(res => { const g = window.__game; g.pause(); g.sim(t, true); g.resume();
    requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); res(); })); }), t);

  await startTrack(page, 'rbring');
  await sim(30);

  // 1. the safety car out (brought out here for the leader), the field behind it, in again, green at the line. (Out when the player has
  // room: no rival alongside or less than 30 m ahead of them, so the autopilot is not in the middle of a pass that it would finish under the
  // safety car: the warning to give the place back would take the HUD's message and board)
  for (let k = 0; k < 40 && await page.evaluate(() => { const r = window.__game.race, P = r.player; return r.cars.some(c => c !== P && !c.finished && c.dist > P.dist - 8 && c.dist < P.dist + 30); }); k++) await sim(1);
  await page.evaluate(() => { const r = window.__game.race; r._scOut(r.order.find(c => !c.finished)); });
  await sim(0.5);
  const s1 = await hud();
  T.check('safety car out: "VARNOSTNI AVTO", the board on the HUD, the car drawn with its light bar flashing', s1.sc === 'out' && s1.msg === 'VARNOSTNI AVTO' && s1.flag === 'on sc:VARNOSTNI AVTO' && s1.scDrawn && /Varnostni avto: ne prehitevaj/.test(s1.toast), JSON.stringify(s1));
  // (what the game tells: its commentator's lines, also when the HUD's message is taken by another at the same moment, e.g. the last lap's)
  await page.evaluate(() => { const C = window.__game.comm, o = C.say; window.__said = []; C.say = function (k) { window.__said.push(k); return o.apply(this, arguments); }; });
  let lampSeen = s1.lamp, s2 = null, inSeen = null;
  for (let k = 0; k < 90; k++) { await sim(2); s2 = await hud(); lampSeen = lampSeen || s2.lamp; if (s2.sc === 'in' && !inSeen) inSeen = s2; if (!s2.sc) break; }
  const said = await page.evaluate(() => window.__said.join());
  T.check('... it goes in ("VARNOSTNI AVTO GRE ...", its lamps off), the race is green again at the line ("ZELENA ZASTAVA!"); the lamps flashed while out',
    !!inSeen && /^on scin:SC GRE S PROGE$/.test(inSeen.flag) && !inSeen.lamp && !s2.sc && !s2.scDrawn && lampSeen && (/ZELENA ZASTAVA/.test(s2.msg) || /(^|,)green(,|$)/.test(said) || s2.phase !== 'racing'), JSON.stringify({ inSeen, s2, said }));

  // 2. a rival stopped 550 m ahead of the player (put there, at the edge of the road): a yellow flag, the marshal's flag, the flag on the HUD in the zone
  await page.evaluate(() => { const r = window.__game.race, P = r.player, T = r.track, c = r.order.filter(o => !o.isPlayer && !o.finished).pop(); if (!c) return;   // (every rival already home: nothing to stop)
    const i = T.idx(P.q.s + 550), off = T.w - 1.5; c.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) c.y = c.py = T.hy[i];
    c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s; c.dist = P.dist + 550; window.__stop = c; });
  const hasStop = await page.evaluate(() => !!window.__stop);
  if (hasStop) {
    for (let k = 0; k < 20; k++) await page.evaluate(() => { const c = window.__stop, g = window.__game; c.vx = c.vz = 0; c.locked = true; g.pause(); g.sim(0.2, true); });
    await sim(0.1);
    const y1 = Object.assign(await hud(), await page.evaluate(() => { const c = window.__stop, P = window.__game.race.player, L = window.__game.race.track.len; return { stopped: c.name, fl: c.fl && { stopT: +c.fl.stopT.toFixed(2), v: +c.fl.v.toFixed(1) }, ahead: Math.round((((c.q.s - P.q.s) % L) + L) % L) }; }));
    T.check('a car stopped ahead: "RUMENA ZASTAVA" (or another message at the same moment, the rule told), a marshal waving the flag beside the track', y1.yel >= 1 && y1.marshals >= 1 && (/RUMENA ZASTAVA/.test(y1.msg) || /^Rumena zastava: pred tabo je ustavljen avto/.test(y1.toast)), JSON.stringify(y1));
    // (on the way the autopilot may pass a rival that slowed in the zone: the warning then takes the HUD's flag; it is let go here, the
    // overtaking rule has its own part below)
    let y2 = null; for (let k = 0; k < 60; k++) { await page.evaluate(() => { const c = window.__stop, f = window.__game.race.player.fl; c.vx = c.vz = 0; c.locked = true; if (f) f.owe = null; }); await sim(0.25); y2 = await hud(); if (/yel/.test(y2.flag)) break; }
    T.check('... in the zone: the yellow flag on the HUD', /^on yel:RUMENA ZASTAVA$/.test(y2.flag), JSON.stringify(y2));
    await page.evaluate(() => { window.__stop.locked = false; });
  } else T.check('a rival ahead to stop', false, 'none found');

  // 3. overtaking under a yellow flag: the warning with a countdown, then +5 s, and the penalty in the results
  await page.evaluate(() => { const r = window.__game.race, P = r.player, T = r.track, A = r.order.find(c => !c.isPlayer && !c.finished && c.dist > P.dist) || r.order.find(c => !c.isPlayer && !c.finished);
    if (P.fl) { P.fl.owe = null; P.fl.pen = 0; }   // (a clean slate: nothing left over from the yellow flag above)
    window.__A = A; window.__zone = { s: A.q.s + 150, t: 99, car: { fl: { stopT: 99 } } }; r.fl.yel.push(window.__zone);
    window.__put = (d) => { const i = T.idx(A.q.s + d), off = T.rl[i] + 1.5; P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = T.hy[i];
      P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.dist = A.dist + d; P.vx = A.vx; P.vz = A.vz; P.locked = false; };
    const g = window.__game; g.pause(); window.__put(-14); g.sim(0.1, true); window.__put(9); g.sim(0.05, true); });
  await sim(0.1);
  const p1 = await hud();
  T.check('overtaking under the yellow flag: the countdown on the HUD, the rule told', /^on owe:VRNI MESTO · (9|10)$/.test(p1.flag) && /Spusti ga nazaj pred sabo v 10 sekundah/.test(p1.toast), JSON.stringify(p1));
  let p2 = null; for (let k = 0; k < 12; k++) { await sim(1); p2 = await hud(); if (p2.pen) break; }
  T.check('... not given back: "KAZEN +5 s"', p2.pen === 5 && /KAZEN \+5 s/.test(p2.msg), JSON.stringify(p2));
  await page.evaluate(() => { const g = window.__game, F = g.race.fl; F.yel = F.yel.filter(y => y !== window.__zone); g.pause(); for (let k = 0; k < 150 && g.phase === 'racing'; k++) g.sim(2, true); g.resume(); });   // (the made-up zone gone)
  await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 120000 });
  const res = await page.evaluate(() => ({ me: document.querySelector('#res-table tr.me').textContent, sub: document.getElementById('res-sub').textContent, pen: window.__game.race.player.fl.pen }));
  T.check('the results: the race time with the penalty (5 s, or more if the autopilot passed under another yellow flag later on)', res.pen >= 5 && res.me.includes('(+' + res.pen + ' s)') && res.sub.includes('s ' + res.pen + ' s kazni'), JSON.stringify(res));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
