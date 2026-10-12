// When a car catches fire (js/render.js: fireScan decides, Render.burning tells game.js's commentator and sfx's crackle): only once it is
// wrecked and barely drives. A kit car (ZMAJ 85) in a race on Jezero, damage on, the race paused and stepped, a frame drawn every 0.1 s of
// race time (the autopilot drives it; knocks from the rivals made harmless: what burns is what the test sets):
//   1. dmg 0.95, its bonnet off, all four wheels on, driven 5 s: no fire (the old rule lit it at 0.9, or at 0.75 with the bonnet off)
//   2. repaired, braked to a standstill, then dmg 0.7 and a wheel off (Core.detachPart), held there 5 s: no fire (the hub drags only
//      while the car moves)
//   3. the same car driven on its hub for 3 s: on fire (the hub's sparks lit it, after ~1.5 s of dragging), on the dragging corner's side
//      of the engine; its flames (stopped then: no hub sparks, the sparks are the fire's)
//   4. repaired, Core.wreckCar: on fire at once (Render.burning before a frame is drawn), and once drawn
//   5. the commentator (fireMe) and the crackle (sfx, the sound on) agree with Render.burning: neither in 1 and 2, both in 3
//   node tests/browser/fire.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('when a car catches fire');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', carV: 3, carId: 'zmaj', damage: 2, track: 'jezero', sound: 1 });
  await page.evaluate(() => Sfx.resume());
  await startTrack(page, 'jezero');
  const R = await page.evaluate(() => {
    const g = window.__game, race = g.race, P = race.player, M = P.m, PT = Core.partsOf(M), out = { id: M.id, kit: !!M.kit };
    g.pause(); window.__said = []; const say = Comm.say; Comm.say = (k, v, p, q) => { window.__said.push(k); return say(k, v, p, q); };
    g.sim(9, true);   // (the start: under way)
    P.dmgK = 1e-6;   // (the rivals' knocks from here on as good as harmless)
    const view = () => Render.viewOf(P), said = () => window.__said.filter(k => k === 'fireMe').length;
    const crackle = () => { if (!Sfx.ready) return null; Sfx.update(race, P, null, 0); return Sfx.levels().dest.fire; };
    const st = () => ({ burning: Render.burning(P), fire: !!view().fire, said: said(), crackle: crackle(), dmg: +P.dmg.toFixed(3), wl: P.wreck ? P.wreck.wl : -1, v: +P.speed.toFixed(1) });
    // driven on the autopilot (the game's own steps: the commentator with them), a frame every 0.1 s; when it caught fire
    const drive = (sec) => { let vmax = 0, vmin = 1e9, lit = null; const t0 = race.time;
      for (let t = 0; t < sec - 1e-9; t += 0.1) { g.sim(0.1, true); Render.frame(0.1, 1, P, 'chase', {}); vmax = Math.max(vmax, P.speed); vmin = Math.min(vmin, P.speed); if (lit == null && Render.burning(P)) lit = +(race.time - t0).toFixed(2); }
      return { vmax: +vmax.toFixed(1), vmin: +vmin.toFixed(1), lit }; };
    // braked where it is (the race's own steps; the brake held at a standstill does not put it in reverse), a frame every 0.1 s; still:
    // until it stands
    const hold = (sec, still) => { let vmax = 0, t = 0; P.noReverse = true;
      for (; t < sec - 1e-9 && !(still && P.speed < 0.2); t += 0.1) { for (let k = 0; k < 12; k++) { P.inThr = 0; P.inBrk = 1; P.inHand = 1; P.inSteer = 0; race.step(1 / 120); } Render.frame(0.1, 1, P, 'chase', {}); vmax = Math.max(vmax, P.speed); }
      delete P.noReverse; return { vmax: +vmax.toFixed(1), t: +t.toFixed(1), v: +P.speed.toFixed(2) }; };
    // 1. dmg 0.95, the bonnet off, the wheels on
    const lid = PT.hood ? 'hood' : 'cover'; Core.detachPart(P, lid); P.dmg = 0.95;
    out.d1 = drive(5); out.s1 = Object.assign(st(), { lid, lost: !!P.lost[lid] });
    // 2. repaired, stopped; dmg 0.7 and the rear left wheel off, held at a standstill
    race.repairCar(P); Render.frame(0.1, 1, P, 'chase', {}); out.stop = hold(20, true);
    P.dmg = 0.7; Core.detachPart(P, 'wheelRL'); out.d2 = hold(5); out.s2 = Object.assign(st(), { off: view().wheelOff.slice() });
    // 3. the same car driven on its hub
    out.d3 = drive(3); g.sim(0.1, true); out.s3 = st();
    const F = view().fire; out.side = F ? F.side : null; out.ign = F ? +F.ign.toFixed(2) : null; out.seatZ = view().seatF ? +view().seatF[2].toFixed(2) : null;
    hold(1.5); const f0 = Render.fxStats().sparksN; hold(0.5); out.flames = Render.fxStats().sparksN - f0; out.emit = !!view().fireEmit;
    // 4. repaired, then a total wreck
    delete P.dmgK; race.repairCar(P); Render.frame(0.1, 1, P, 'chase', {}); out.s4a = { burning: Render.burning(P), fire: !!view().fire };
    Core.wreckCar(P); out.s4b = { burning: Render.burning(P), dmg: P.dmg }; Render.frame(0.1, 1, P, 'chase', {}); out.s4c = { burning: Render.burning(P), fire: !!view().fire };
    g.resume(); return out;
  });
  T.check('the car: a kit vehicle (ZMAJ 85)', R.id === 'zmaj' && R.kit, JSON.stringify({ id: R.id, kit: R.kit }));
  T.check('1. dmg 0.95, the bonnet off, the wheels on, driven 5 s: no fire (Render.burning false, no flames)',
    R.s1.lost && R.s1.wl === 0 && R.s1.dmg >= 0.94 && R.d1.vmax > 10 && !R.s1.burning && !R.s1.fire, JSON.stringify({ d1: R.d1, s1: R.s1 }));
  T.check('2. dmg 0.7, a wheel off, at a standstill 5 s: no fire',
    R.stop.v < 0.2 && R.d2.vmax < 2 && R.s2.wl === 4 && R.s2.off[2] === 1 && Math.abs(R.s2.dmg - 0.7) < 0.01 && !R.s2.burning && !R.s2.fire, JSON.stringify({ stop: R.stop, d2: R.d2, s2: R.s2 }));
  T.check('3. the same car driven on its hub 3 s: on fire (lit by the hub\'s sparks after ~1.5 s), on the dragging corner\'s side (left), its flames',
    R.d3.vmin < 2 && R.d3.vmax > 8 && R.s3.burning && R.s3.fire && R.d3.lit != null && R.d3.lit > 1 && R.d3.lit <= 3 && R.ign >= 1.5 && R.side === -1 && R.seatZ < 0 && R.flames > 0 && R.emit,
    JSON.stringify({ d3: R.d3, s3: R.s3, side: R.side, ign: R.ign, seatZ: R.seatZ, flames: R.flames }));
  T.check('4. repaired: not on fire; Core.wreckCar: on fire at once (dmg 1), and once drawn',
    !R.s4a.burning && !R.s4a.fire && R.s4b.burning && R.s4b.dmg >= 0.99 && R.s4c.burning && R.s4c.fire, JSON.stringify({ s4a: R.s4a, s4b: R.s4b, s4c: R.s4c }));
  T.check('5. the commentator agrees with Render.burning: "fireMe" not in 1 and 2, said in 3', R.s1.said === 0 && R.s2.said === 0 && R.s3.said === 1, JSON.stringify([R.s1.said, R.s2.said, R.s3.said]));
  if (R.s3.crackle == null) T.check('5. the crackle (skipped: no audio here)', true, 'AudioContext not running');
  else T.check('5. the crackle agrees with Render.burning: none in 1 and 2, heard in 3', R.s1.crackle === 0 && R.s2.crackle === 0 && R.s3.crackle >= 1, JSON.stringify([R.s1.crackle, R.s2.crackle, R.s3.crackle]));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
