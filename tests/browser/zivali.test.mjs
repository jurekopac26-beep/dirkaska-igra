// Life in the woods (js/world-zivali.js, World.life) and the parked car (parkedCar in js/world.js): on a few real tracks of different countries
// the glades are there, their animals are the ones of the track's country (World.lifeTable), none stands on the road or by its barrier, the
// glades are one merged mesh per 256 m chunk; a test track has none. The parked car: every kind built, within its vertex budget (the car
// parks' lite one far cheaper).
//   node tests/browser/zivali.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const TRACKS = ['nring', 'vrsic', 'bathurst', 'iroha', 'caracoles', 'ouninpohja'];
const T = checker('life in the woods, the parked car');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'high', shadows: 1, camera: 'chase' }, { width: 640, height: 360 }, { seed: 7 });
  for (const id of TRACKS.concat(['jezero'])) {
    await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    const r = await page.evaluate((id) => {
      const w = Render.world, st = w.lifeStats, Z = World.lifeTable[id], A = World.api, T = window.__game.race.track;
      const grp = w.root.getObjectByName('life'); let meshes = 0, verts = 0; if (grp) grp.traverse(m => { if (m.isMesh) { meshes++; verts += m.geometry.attributes.position.count; } });
      if (!st) return { none: true, meshes };
      // the young of each kind (YOUNG) may stand with it: the kinds allowed on this track are its own and their young
      const young = { boar: 'piglet', moose: 'mooseF', kangaroo: 'joey', stag: 'hind', roe: 'roeF', elk: 'muleDeer', horse: 'horseG' }, ok = new Set(Z.a); for (const k of Z.a) if (young[k]) ok.add(young[k]);
      const strange = Object.keys(st.kinds).filter(k => !ok.has(k));
      // nothing on the road: each glade's centre at least 3 m beyond the barrier (A.clearance: the distance beyond the nearest barrier)
      let near = 0; for (const [m, side, b] of st.at) { const s = T.startS + m, i = T.idx(((s % T.len) + T.len) % T.len), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + b);
        if (A.clearance(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < 3) near++; }
      return { things: st.things, groups: st.groups, animals: st.animals, strange, near, at: st.at.length, meshes, verts };
    }, id);
    if (id === 'jezero') { T.check('a test track (Jezero Ring) has no life in its woods', !!r.none && !r.meshes, JSON.stringify(r)); continue; }
    T.check(`${id}: glades with things and animals of its country`, !r.none && r.at >= 8 && r.groups >= 3 && r.animals >= 6 && !r.strange.length, JSON.stringify(Object.assign({}, r, { strange: r.strange.join(',') })));
    T.check(`${id}: no glade on the road or by its barrier`, r.near === 0, `${r.near} of ${r.at}`);
    T.check(`${id}: merged, one mesh per chunk (a few dozen at most)`, r.meshes > 0 && r.meshes <= 90 && r.verts < 400000, `${r.meshes} meshes, ${Math.round(r.verts / 1000)}k vertices`);
  }
  const car = await page.evaluate(() => {   // every kind of the parked car, and the car parks' lite one
    const A = World.api, out = [];
    for (let k = 0; k < 6; k++) { const g = new World.GB(); A.parkedCar(g, 0, 0, 0, 0, [0.8, 0.2, 0.2], k); out.push(g.P.length / 3); }
    const g = new World.GB(); A.parkedCar(g, 0, 0, 0, 0, [1, 1, 1], 0, true); out.push(g.P.length / 3);
    return out;
  });
  T.check('the parked car: six kinds, each under 360 vertices', car.slice(0, 6).every(n => n > 100 && n < 360), car.slice(0, 6).join(', '));
  T.check('the car parks\' lite car: under 150 vertices', car[6] > 60 && car[6] < 150, String(car[6]));
  T.check('no page errors', !errors.length, errors.slice(0, 4).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
