// Singapur in the browser: the world of the street circuit round Marina Bay. Its scenery from the track file (OpenStreetMap, ESA
// WorldCover): the buildings, the trees, the water of the bay and the river with its shore, the light towers carrying the night's
// floodlights (World.floodOff), the viaducts over the circuit fading while the car is under them. The junctions: the street furniture
// in every side street's pocket is made of knockable props (traffic signals, some on mast arms, signs, bollards, bins, hydrants,
// cabinets, lamp posts), each inside the barriers and off the asphalt, drawn as instanced meshes once the race runs; a car driven
// straight into a junction's pocket knocks its furniture over. The night: the floodlights on the towers, no page errors.
//   node tests/browser/singapur.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Singapur: the world, the junctions, the night');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'chase', tod: 'night' }, { width: 640, height: 360 });
  await startTrack(page, 'singapur');
  const w = await page.evaluate(() => {
    const W = Render.world, Tk = window.__game.race.track, st = W.stats, Q = {};
    const KINDS = ['tlight', 'tmast', 'sign', 'bollard', 'bin', 'hydrant', 'cabinet', 'lamp'];
    const props = W.props.filter(p => KINDS.includes(p.kind)), inside = props.filter(p => { const q = Tk.query(p.x, p.z, p.i, Q), b = q.d > 0 ? q.br : q.bl; return Math.abs(q.d) > Tk.w + 0.3 && Math.abs(q.d) < b - 0.1; });
    let shore = 0; W.root.traverse(o => { if (o.isMesh && o.geometry.attributes.shore) shore += o.geometry.attributes.shore.count; });
    const race = window.__game.race, meshes = race.props ? [...new Set(race.props.map(b => b.kind))] : [];
    return { st, n: props.length, inside: inside.length, kinds: [...new Set(props.map(p => p.kind))], shore, flood: typeof W.floodOff === 'function', tunnel: !!(W.dyn.tunnel && W.dyn.tunnel.ranges && W.dyn.tunnel.ranges.length), meshes };
  });
  T.check('scenery: 1500+ buildings (100+ towers), 1000+ trees, 25+ junctions, street lamps, parked cars, boats, 6+ grandstands with fans',
    w.st.buildings > 1500 && w.st.towers > 100 && w.st.trees > 1000 && w.st.junctions >= 25 && w.st.lamps > 100 && w.st.cars > 50 && w.st.boats > 5 && w.st.stands >= 6 && w.st.fans > 500, JSON.stringify(w.st));
  T.check('water: the bay and the river with a shore band; the light towers carry the floodlights; the viaducts over the circuit fade', w.shore > 1000 && w.flood && w.tunnel, `shore ${w.shore}, floodOff ${w.flood}, tunnel ${w.tunnel}`);
  T.check('junctions: 150+ pieces of street furniture, every kind, each inside the barriers and off the asphalt, all props of the race', w.n >= 150 && w.inside === w.n && w.kinds.length === 8 && w.kinds.every(k => w.meshes.includes(k)),
    `${w.inside}/${w.n} inside, kinds ${w.kinds.join(' ')}`);
  // a car driven straight into a junction's pocket (the one with the most furniture) at 20 m/s: the furniture there flies
  const k = await page.evaluate(async () => {
    const g = window.__game, r = g.race, Tk = r.track, P = r.player, KINDS = ['tlight', 'tmast', 'sign', 'bollard', 'bin', 'hydrant', 'cabinet', 'lamp'];
    const L = r.props.filter(b => KINDS.includes(b.kind)); let best = null, bn = 0;
    for (const b of L) { const n = L.filter(c => Math.hypot(c.x - b.x, c.z - b.z) < 8).length; if (n > bn) { bn = n; best = b; } }
    const q = Tk.query(best.x, best.z, best.qi, {}), side = Math.sign(q.d), i = q.i, x0 = Tk.px[i] - Tk.nx[i] * side * 2, z0 = Tk.pz[i] - Tk.nz[i] * side * 2, h = Math.atan2(best.z - z0, best.x - x0);
    const near = L.filter(c => Math.hypot(c.x - best.x, c.z - best.z) < 8), p0 = near.map(c => [c.x, c.z]);
    g.pause(); for (let t = 0; t < 60; t++) { P.x = x0; P.z = z0; P.h = h; P.vx = Math.cos(h) * 20; P.vz = Math.sin(h) * 20; P.w = 0; P.locked = false; if (t > 4) break; r.step(1 / 120); }
    for (let t = 0; t < 240; t++) { P.vx = Math.cos(P.h) * Math.max(8, Math.hypot(P.vx, P.vz)); P.vz = Math.sin(P.h) * Math.max(8, Math.hypot(P.vx, P.vz)); r.step(1 / 120); }
    return { n: near.length, moved: near.filter((c, j) => Math.hypot(c.x - p0[j][0], c.z - p0[j][1]) > 0.3 || !c.sleep).length };
  });
  T.check('junctions: a car driven into a pocket knocks its street furniture over', k.n > 0 && k.moved > 0, `${k.moved}/${k.n} moved`);
  await page.evaluate(async () => { for (let i = 0; i < 10; i++) await new Promise(r => requestAnimationFrame(r)); });
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
