// Medvode, Slovenija: the knockable roadside things in the built world. The road is a race circuit now (def.barrier: a steel barrier along the whole road, the
// asphalt run-off out to it): the side roads are closed by the barrier itself, so the world has no yellow bollards in front of their mouths, no closures (rails,
// gates, boards) down them and no delineator posts. The scenery builder puts every small thing into the prop list: the tyre stacks (at the rail's ends and in two
// rows along each ring's wall), the street lamps, the zebra crossings' and the bus stops' signs, the street names' plates, the villages' boards, the flag poles, the
// benches; Core simulates them (Race.setProps), the renderer draws one instanced mesh per kind. The race's own furniture behind the barrier (the distance boards,
// the marshals' posts, the timing hut, the paddock's tents) is static scenery, no props. Checks: the counts per kind and the old kinds gone, none inside a building,
// standing on the ground, one instanced mesh per kind with the right number of instances in view, the player's car (in the browser) driven along each ring's road
// into its wall knocking the world's tyre stacks over and stopped by the wall, steered into a side road and stopped by the barrier across its mouth.
//   node tests/browser/medvode-props.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Medvode: the knockable roadside things');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'chase', weather: 'dry', mode: 'tt' }, { width: 844, height: 390 }, { seed: 12345 });
  await startTrack(page, 'medvode');
  const r = await page.evaluate(() => {
    const W = Render.world, g = window.__game, race = g.race, Tr = race.track, def = Tr.def, Q = {};
    const by = {}; for (const p of W.props) by[p.kind] = (by[p.kind] || 0) + 1;
    const cap = Object.assign({}, race.propCap);
    // no prop inside a building the scenery built (out.fence.bld: the footprints that were built)
    const bl = W.fence.bld, built = [];
    for (let b = 0; b + 1 < bl.off.length; b++) { const P = []; for (let k = bl.off[b]; k < bl.off[b + 1]; k++) P.push([bl.xz[2 * k], bl.xz[2 * k + 1]]);
      const xs = P.map(p => p[0]), zs = P.map(p => p[1]); built.push({ P, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }); }
    const inside = (p, b) => { if (p.x < b.x0 || p.x > b.x1 || p.z < b.z0 || p.z > b.z1) return false; let w = false; const P = b.P; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > p.z) !== (P[j][1] > p.z) && p.x < (P[j][0] - P[i][0]) * (p.z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) w = !w; return w; };
    const inBld = {}; let nIn = 0;
    for (const p of W.props) for (const b of built) if (inside(p, b)) { nIn++; inBld[p.kind] = (inBld[p.kind] || 0) + 1; break; }
    // standing on the ground: its foot (centre - h0) against the ground the cars drive on there (Track.yAt: the run-off, a ring's own surface) or the terrain
    let off = 0, worst = 0, nOn = 0; const offBy = {}, offAt = [];
    for (const b of race.props) { if (b.dead) continue; nOn++; const gy = b.y - b.K.h0, q = Tr.query(b.x, b.z, b.qi, Q), ry = Tr.yAt(q), tg = W.groundH(b.x, b.z), d = Math.min(Math.abs(gy - tg), Math.abs(gy - ry));
      if (d > 0.3) { off++; offBy[b.kind] = (offBy[b.kind] || 0) + 1; if (offAt.length < 6) offAt.push(`${b.kind} ${b.x.toFixed(1)},${b.z.toFixed(1)} ${(gy - ry).toFixed(2)} m`); } worst = Math.max(worst, d); }
    // reachable: a thing inside the barrier (|d| within the barrier line, or in a ring's zone) can be hit by a car
    const reach = {}, all = {};
    for (const b of race.props) { if (b.dead) continue; const q = Tr.queryRoute ? Tr.queryRoute(b.x, b.z, b.qi, {}) : Tr.query(b.x, b.z, b.qi, {}); all[b.kind] = (all[b.kind] || 0) + 1;
      if (Math.abs(q.d) < (q.d > 0 ? q.br : q.bl) - b.K.rh || Tr.rings.some(R => R.zr > 0 && Math.hypot(b.x - R.x, b.z - R.z) < R.zr - b.K.rh)) reach[b.kind] = (reach[b.kind] || 0) + 1; }
    return { by, cap, knock: W.knock, propR: W.propR, nIn, inBld, nBuilt: built.length, off, offBy, offAt, worst, nOn, total: race.props.length, reach, all, race: W.race || null, posts: (W.propStats || {}).posts || 0, bales: (def.bales || []).length, signs: W.islands ? W.islands.signs.length : 0 };
  });
  const K = r.by, need = { tstack: 100, mlamp: 40, msign: 20, bsign: 8, bench: 8, nsign: 8, vboard: 2, flagp: 2, cflag: 8 }, gone = ['tbollard', 'zaprta', 'post'];
  if (r.bales) need.bstack = 10; if (r.signs) need.isign = r.signs;   // (r9: the straw-bale stacks of def.bales; an island sign at the nose of each long def.splitIsl island)
  // (r9: the villages' boards: two names on one spot (Valburga's and Smlednik's) one board there, World; the start's flag poles: one spot of the three
  // in a side road's mouth when the road there has no sidewalk)
  const PARTS = { tyre: (K) => 3 * (K.tstack || 0), bale: (K) => 3 * (K.bstack || 0), iblock: (K) => 3 * (K.isign || 0), iboard: (K) => K.isign || 0 };   // (the kinds a stack bursts into)
  console.log(`   props by kind: ${JSON.stringify(K)}, ${r.total} in all (with the stacks' tyres)`);
  console.log(`   within reach of a car (inside the barrier): ${Object.keys(r.all).map(k => `${k} ${r.reach[k] || 0}/${r.all[k]}`).join(', ')}`);
  T.check('props: the world has every kind: tyre stacks, lamps, signs, plates, boards, flags, benches', Object.keys(need).every(k => (K[k] || 0) >= need[k]), Object.keys(need).map(k => `${k} ${K[k] || 0}/${need[k]}`).join(', '));
  T.check('props: no yellow bollards in front of the side roads, no closure boards down them, no delineator posts (the barrier closes the side roads and runs along the whole road)',
    gone.every(k => !K[k] && !r.cap[k]) && !r.posts, gone.map(k => `${k} ${K[k] || 0}`).join(', ') + `, knockable delineator posts ${r.posts}`);
  T.check('props: Core simulates all of them (propCap = the kinds\' counts in the world, a tyre stack\'s three tyres, a bale stack\'s three bales, an island sign\'s three bases and its board ready), the builder\'s count by kind the same',
    Object.keys(K).every(k => r.cap[k] === K[k]) && Object.keys(r.cap).every(k => PARTS[k] ? r.cap[k] === PARTS[k](K) : K[k] === r.cap[k]) && Object.keys(r.knock || {}).every(k => r.knock[k] === K[k]), JSON.stringify(r.cap));
  T.check('props: none inside a building the scenery built', r.nIn === 0, `${r.nIn} inside one of ${r.nBuilt}` + (r.nIn ? ' ' + JSON.stringify(r.inBld) : ''));
  T.check('props: standing on the ground (the foot within 0.3 m of the ground the cars drive on there or of the terrain), none floating or sunk', r.off === 0,
    `${r.off} of ${r.nOn} off the ground (${JSON.stringify(r.offBy)}), the worst ${r.worst.toFixed(2)} m${r.offAt.length ? ' (' + r.offAt.join('; ') + ', its foot minus the cars\' ground)' : ''}`);
  T.check('props: drawn out to 150 m (the long open corridor: World.propR)', r.propR === 150, 'propR ' + r.propR);
  T.check('scenery: the race\'s furniture behind the barrier (the distance boards before the braking points, the marshals\' posts, the paddock\'s tents) is static, no props',
    !!r.race && r.race.boards >= 12 && r.race.marshals >= 10 && r.race.tents >= 6 && r.race.brakes >= 4, JSON.stringify(r.race));

  // the renderer: one instanced mesh per kind, only the props within the view's radius drawn (Render's: World.propR or 95 m, the view's size x 2.3)
  const s = await page.evaluate(async () => {
    const g = window.__game, race = g.race, Tr = race.track, P = race.player; g.pause();
    const out = [];
    for (const d of [60, 1000, 3300]) {
      let n = 0; while (P.q.s - Tr.startS < d && n < 800) { g.sim(1, true); n++; }
      Render.resetCam(); for (let i = 0; i < 8; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});
      const meshes = Render.scene.children.filter(o => o.isInstancedMesh && o.userData && o.userData.cap > 0);
      const cam = Render.cam, R = Math.max(Render.world.propR || 95, (cam.vd || 60) * 2.3), cx = cam.vcx || 0, cz = cam.vcz || 0, lo = {}, hi = {};   // (within R - 3 m surely drawn, beyond R + 3 m surely not: the view's centre settles a little between frames)
      for (const b of race.props) { if (b.hidden || b.slot < 0) continue; const d = Math.hypot(b.x - cx, b.z - cz); if (d < R - 3) lo[b.kind] = (lo[b.kind] || 0) + 1; if (d < R + 3) hi[b.kind] = (hi[b.kind] || 0) + 1; }
      const total = meshes.reduce((a, m) => a + (m.visible ? m.count : 0), 0), sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
      out.push({ d: Math.round(P.q.s - Tr.startS), R, meshes: meshes.length, verts: meshes.map(m => m.geometry.attributes.position.count), total, lo: sum(lo), hi: sum(hi), kindsLo: Object.keys(lo).length, kindsShown: meshes.filter(m => m.visible && m.count > 0).length, kindsHi: Object.keys(hi).length, casting: meshes.filter(m => m.castShadow).length });
    }
    return out;
  });
  const kinds = Object.keys(r.cap).length;
  T.check('render: one instanced mesh per kind (the stacks\' tyres too), each with a model (vertices); the tall and the round ones cast shadows, the thin signs and the bench not', s.every(v => v.meshes === kinds && v.verts.every(n => n > 0 && n < 4000) && v.casting >= 3 && v.casting < v.meshes), s.map(v => `d ${v.d}: ${v.meshes} meshes (${kinds} kinds), model sizes ${Math.min(...v.verts)}-${Math.max(...v.verts)} vertices, ${v.casting} casting`).join('; '));
  T.check('render: the instances drawn are the props within the view\'s radius (to 3 m at its edge)', s.every(v => v.total >= v.lo && v.total <= v.hi && v.kindsShown >= v.kindsLo && v.kindsShown <= v.kindsHi && v.total > 0), s.map(v => `d ${v.d}: ${v.total} instances in ${v.kindsShown} kinds (expected ${v.lo}-${v.hi} within ${v.R.toFixed(0)} m)`).join('; '));

  // the player's car in the browser: driven along each ring's road into the wall across it (from either side, at 10 m/s) it bursts the world's tyre stacks in front of
  // the wall and is stopped by the wall; steered straight into side roads from the middle of the road it is stopped by the barrier across the mouth
  const k = await page.evaluate(() => {
    const g = window.__game, race = g.race, Tr = race.track, def = Tr.def, P = race.player;
    race.state = 'racing'; P.locked = false;
    const place = (x, z, h, v) => { P.place(x, z, h); P.q = Tr.query(P.x, P.z, Tr.nearestIdx(x, z), P.q); P.y = P.py = Tr.yAt(P.q); P.roadY = P.y; P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v; P.w = 0; };
    const walls = [];
    def.rings.forEach((rg, ri) => { for (const a of rg.shut || []) {
      const R = Tr.rings[ri], ux = Math.cos(a), uz = Math.sin(a), vx = -uz, vz = ux, wx = R.x + ux * R.r, wz = R.z + uz * R.r;
      for (const sd of [-1, 1]) {
        const row = race.props.filter(b => { if (b.kind !== 'tstack' || b.dead) return false; const u = (b.x - R.x) * ux + (b.z - R.z) * uz, v = -(b.x - R.x) * uz + (b.z - R.z) * ux; return u > R.ri && u < R.zr + 1 && Math.abs(Math.abs(v) - 0.62) < 0.2 && v * sd > 0; });   // (the world's stacks along the wall on this side)
        place(wx + vx * sd * 8, wz + vz * sd * 8, Math.atan2(-vz * sd, -vx * sd), 10);
        let near = 1e9, wall = 0;
        for (let i = 0; i < 120 * 3; i++) { P.inThr = 0.5; P.inBrk = 0; P.inSteer = 0; P.hitWall = 0; race.step(1 / 120); if (P.hitWall > 0.3) wall++; near = Math.min(near, ((P.x - wx) * vx + (P.z - wz) * vz) * sd); }
        walls.push({ d: rg.d, sd, n: row.length, burst: row.filter(b => b.dead).length, near, wall, carBk: Math.floor(P.q.i / 6), stBk: [...new Set(row.map(b => Math.floor(b.qi / 6)))] });
      } } });
    // three side roads' mouths (one of each kind of road, near the middle of the route), straight in at 11 m/s
    const mouths = [];
    for (const kind of [0, 1, 2]) { const S = Tr.stubs.find(s => s.kind === kind && s.m0 >= 0 && s.ang > 60 && s.ang < 120 && s.s > 1500); if (!S) continue;
      const p0 = Tr.stubPt(S.k, 0, {}); place(p0.x, p0.z, p0.h, 11);
      let past = -1e9, wall = 0;
      for (let i = 0; i < 120 * 3; i++) { P.inThr = 0.6; P.inBrk = 0; P.inSteer = 0; P.hitWall = 0; race.step(1 / 120); if (P.hitWall > 0.3) wall++; const q = Tr._qMain(P.x, P.z, Tr.nearestIdx(P.x, P.z), {}); past = Math.max(past, Math.abs(q.d) - (q.d > 0 ? q.br : q.bl)); }
      mouths.push({ k: S.k, name: S.name, d: S.s, kind, past, wall });
    }
    return { walls, mouths, awake: race.props.filter(b => !b.sleep && !b.dead).length };
  });
  T.check('knock: the player\'s car driven along each ring\'s road into its wall (from either side) bursts the world\'s tyre stacks in front of the wall and is stopped by the wall (its middle never across its line)',
    k.walls.length === 6 && k.walls.every(w => w.n >= 6 && w.burst >= 1 && w.wall > 0 && w.near > 0.5),
    k.walls.map(w => `the ring at d ${Math.round(w.d)} from the ${w.sd > 0 ? '+' : '-'} side: ${w.burst} of the ${w.n} stacks there burst${w.burst ? '' : ` (the car's props bucket ${w.carBk}, theirs ${w.stBk.join(', ')}: Race.stepProps looks at the car's bucket and the two beside it)`}, its middle ${w.near.toFixed(1)} m from the wall's line at the nearest, against it ${w.wall} steps`).join(' | '));
  T.check('mouths: the player\'s car steered straight into a street, a driveway and a track (in the browser) is stopped by the barrier across the mouth', k.mouths.length === 3 && k.mouths.every(m => m.past < 0 && m.wall > 0),
    k.mouths.map(m => `#${m.k} ${m.name || ['street', 'driveway', 'track'][m.kind]} (d ${m.d}): its middle ${(-m.past).toFixed(1)} m short of the barrier at most, against it ${m.wall} steps`).join(' | ') + `; ${k.awake} props awake`);
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
