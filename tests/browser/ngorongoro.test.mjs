// Ngorongoro, Tanzanija (js/world-ngorongoro.js, docs/proge/ngorongoro.md): its own world. The animals by the road (ngLife): at least 60 of
// 10 kinds in 13 groups and more, two herds that cross the road; none of them on the road or by its barrier when built; the far view
// (ngFar: the crater's floor with Lake Magadi, its herds as specks) and the lay-by at Windy Gap. Then the descent driven on autopilot, the
// world stepped as the game steps it (World.update with the race): in a time trial the crossing herds cross before the car comes and some
// animals run off from it; in a race with 11 rivals and in the traffic mode no animal is on the road within 25 m of any car (the race's cars,
// the traffic's vehicles), those still on it hurry off as a car nears. No page errors.
//   node tests/browser/ngorongoro.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('Ngorongoro: the crater, its animals');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase' }, { width: 640, height: 360 }, { seed: 7 });
  const run = async (mode, rivals) => {
    await page.goto(srv.base + `/index.html?proga=ngorongoro&nacin=${mode}&t=0.5${rivals != null ? '&tekmeci=' + rivals : ''}`, { timeout: 300000 });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    return page.evaluate(() => {
      const g = window.__game, R = g.race, P = R.player, W = Render.world, L = W.life, A = World.api, Tr = R.track, w = Tr.w;
      g.pause();
      const st = W.stats, home = L.A.filter(a => { const n = A.vrNear(a.hx, a.hz); return n.i >= 0 && n.dd < 1; }).length;
      const kinds = new Set(L.A.map(a => a.sp.replace(/M$/, ''))).size;
      // the descent on autopilot, the world stepped every 0.1 s of the race as the game does (World.update with the race)
      let bad = 0, worst = null, onRoad = 0;
      const cars = () => R.cars.concat(R.tf ? R.tf.veh : []);
      for (let k = 0; k < 2600 && !P.finished; k++) {
        g.sim(0.1, true);
        World.update(W, R.time, P, Render.camera, null, R);
        const C = cars();
        for (const gr of L.groups) { if (!gr.on) continue;
          for (let q = gr.a0; q < gr.a1; q++) { const a = L.A[q], n = A.vrNear(a.x, a.z); if (n.i < 0 || n.d > w + 0.6) continue;
            let near = 1e9; for (const c of C) near = Math.min(near, Math.hypot(c.x - a.x, c.z - a.z));
            onRoad++;
            if (near < 25) { bad++; if (!worst || near < worst.near) worst = { sp: a.sp, near: +near.toFixed(1), s: Math.round(n.i * Tr.ds), t: +R.time.toFixed(1), st: a.st }; } } }
      }
      return { st, home, kinds, n: L.A.length, finished: !!P.finished, t: +R.time.toFixed(1), crossings: L.crossings, fled: L.fled, hurried: L.hurried, bad, worst, onRoad,
        cars: R.cars.length, traffic: R.tf ? R.tf.veh.length : 0, view: !!(W.marks && W.marks.view), far: !!(W.dyn.irFar && W.dyn.irFar.mesh.visible) };
    });
  };
  const tt = await run('kronometer');
  const s = tt.st || {};
  T.check('the world: animals of 10 kinds and more in 13 groups and more, two herds that cross the road', s.animals >= 60 && tt.kinds >= 10 && s.groups >= 13 && s.crossers === 2 && s.animals === tt.n,
    `${s.animals} animals (${tt.n} in the state), ${tt.kinds} kinds, ${s.groups} groups, ${s.crossers} crossing`);
  T.check('none of them on the road or by its barrier where they live', tt.home === 0, `${tt.home} within 1 m past the barrier`);
  T.check('the far view: the crater floor with its herds, drawn; the lay-by at Windy Gap', s.far && tt.far && s.herds >= 12 && s.specks >= 300 && s.lay && tt.view,
    `far ${s.far}/${tt.far}, ${s.herds} herds of ${s.specks} specks, lay-by ${s.lay}/${tt.view}`);
  T.check('time trial: down to the finish on autopilot', tt.finished, `${tt.t} s`);
  T.check('time trial: the herds cross the road before the car comes (on it a while), some animals run off from it', tt.crossings >= 2 && tt.onRoad > 0 && tt.fled >= 5, `${tt.crossings} crossings (${tt.onRoad} animal-steps of 0.1 s on the road), ${tt.fled} ran off, ${tt.hurried} hurried off the road`);
  T.check('time trial: no animal on the road within 25 m of the car', tt.bad === 0, tt.bad ? `${tt.bad} times, the nearest ${JSON.stringify(tt.worst)}` : 'none');
  const race = await run('dirka', 11);
  T.check('race with 11 rivals: no animal on the road within 25 m of any car', race.cars === 12 && race.bad === 0,
    `${race.cars} cars, ${race.crossings} crossings, ${race.hurried} hurried off${race.bad ? `; ${race.bad} times, the nearest ${JSON.stringify(race.worst)}` : ''}`);
  const tf = await run('promet');
  T.check('traffic: no animal on the road within 25 m of a car or a vehicle of the traffic', tf.traffic > 0 && tf.bad === 0,
    `${tf.traffic} vehicles, ${tf.crossings} crossings, ${tf.hurried} hurried off${tf.bad ? `; ${tf.bad} times, the nearest ${JSON.stringify(tf.worst)}` : ''}`);
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
