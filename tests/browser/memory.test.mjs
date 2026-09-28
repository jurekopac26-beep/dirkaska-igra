// Memory: switching tracks, restarting races and browsing cars in the car menu must not leave GPU geometry,
// textures, shader programs or JavaScript memory behind. After a warm-up round (every track once, caches filled)
// two more rounds must not grow the counts.
//   node tests/browser/memory.test.mjs
import { serve, launch, openGame, startTrack, trackIds, simulate, checker } from './lib.mjs';

const T = checker('memory');
const srv = await serve();
const browser = await launch(['--js-flags=--expose-gc', '--enable-precise-memory-info']);
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2 });
  const ids = await trackIds(page);
  // always measured in the same state: a fresh race on jezero, 2 s in, after garbage collection
  const measure = async () => {
    await startTrack(page, 'jezero'); await simulate(page, 2);
    return page.evaluate(async () => {
      for (let i = 0; i < 3; i++) { if (window.gc) window.gc(); await new Promise(r => setTimeout(r, 150)); }
      const inf = Render.info();
      return { geometries: inf.memory.geometries, textures: inf.memory.textures, programs: inf.programs ? inf.programs.length : 0, heapMB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0 };
    });
  };
  // browse the car menu: through every car twice (each change builds a new showroom car)
  const carMenu = () => page.evaluate(async () => {
    const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
    g.onAction('to-car'); await wait(300);
    for (let k = 0; k < 12; k++) { g.onAction('car-next'); await wait(120); }
    g.onAction('to-title'); await wait(200);
  });
  const rounds = [];
  const ROUNDS = +(process.env.MEM_ROUNDS || 3);
  for (let r = 0; r < ROUNDS; r++) {
    for (const id of ids) { await startTrack(page, id); await simulate(page, 3); }
    await startTrack(page, 'gozd'); await simulate(page, 2); await startTrack(page, 'gozd'); await simulate(page, 2);   // a restart on the same track
    await carMenu();
    await page.evaluate(async () => { window.__game.onAction('to-title'); await new Promise(r => setTimeout(r, 1500)); });   // the title demo race
    rounds.push(await measure());
    console.log(`round ${r + 1}: ${JSON.stringify(rounds[r], (k, v) => typeof v === 'number' ? +v.toFixed(1) : v)}`);
  }
  const w = rounds[0], z = rounds[rounds.length - 1];
  T.check('GPU geometries do not grow after the warm-up round', z.geometries <= w.geometries + 10, `${w.geometries} -> ${z.geometries}`);
  T.check('textures do not grow', z.textures <= w.textures + 2, `${w.textures} -> ${z.textures}`);
  T.check('shader programs do not grow', z.programs <= w.programs + 2, `${w.programs} -> ${z.programs}`);
  T.check('JavaScript memory does not grow (more than 25 MB over two rounds)', z.heapMB <= w.heapMB + 25, `${w.heapMB.toFixed(1)} -> ${z.heapMB.toFixed(1)} MB`);
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
