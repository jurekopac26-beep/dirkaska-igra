// Medvode, Slovenija: the knockable roadside things in the built world. The scenery builder puts every small thing beside the road into the prop
// list (the yellow triangular bollards in front of every side road's mouth, closed by the fence at the road's edge, the street lamps, the zebra crossings' and the bus stops' signs, the street
// names' plates, the closure boards, the villages' boards, the flag poles, the benches), Core simulates them (Race.setProps), the renderer draws one
// instanced mesh per kind. Checks: the counts per kind, none inside a building, standing on the ground, one instanced mesh per kind with the right
// number of instances in view, a real bollard knocked over by the player's car in the browser, the car then stopped by the fence across the mouth.
//   node tests/browser/medvode-props.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Medvode: the knockable roadside things');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'iso', weather: 'dry', mode: 'tt' }, { width: 844, height: 390 }, { seed: 12345 });
  await startTrack(page, 'medvode');
  const r = await page.evaluate(() => {
    const W = Render.world, g = window.__game, race = g.race, Tr = race.track, def = Tr.def, Q = {};
    const by = {}; for (const p of W.props) by[p.kind] = (by[p.kind] || 0) + 1;
    const cap = Object.assign({}, race.propCap);
    // no prop inside a building the scenery built (those the data puts on the road or on a side road it leaves out: as medvode.test.js)
    const built = [];
    for (const b of def.bld) { const [x, z, L, Wd, ang] = b; if (L < 2.2 || Wd < 2.2) continue;
      const c = Math.cos(ang), s = Math.sin(ang), poly = b[8] ? b[8].reduce((a, v, k) => (k % 2 ? a[a.length - 1].push(v) : a.push([v]), a), []) : null;
      const pts = poly || [[-L / 2, -Wd / 2], [L / 2, -Wd / 2], [L / 2, Wd / 2], [-L / 2, Wd / 2]].map(([p, q]) => [x + c * p - s * q, z + s * p + c * q]);
      const on = pts.concat([[x, z]]).some(([px, pz]) => { const q = Tr.query(px, pz, Tr.nearestIdx(px, pz), Q); return (q.k < 0 && !q.over && Math.abs(q.d) < Tr.wAt(q.a)) || (q.k >= 0 && q.st <= Tr.stubs[q.k].Lend && Math.abs(q.u) <= (q.st < Tr.stubs[q.k].te ? Tr.stubHw(Tr.stubs[q.k], q.st) : Tr.stubs[q.k].hw) + 0.3); });
      if (on) continue; built.push({ x, z, L, Wd, c, s, pts: poly ? pts : null }); }
    const inside = (p, b) => { if (b.pts) { let w = false; const P = b.pts; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > p.z) !== (P[j][1] > p.z) && p.x < (P[j][0] - P[i][0]) * (p.z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) w = !w; return w; }
      const dx = p.x - b.x, dz = p.z - b.z, u = dx * b.c + dz * b.s, v = -dx * b.s + dz * b.c; return Math.abs(u) < b.L / 2 + 0.1 && Math.abs(v) < b.Wd / 2 + 0.1; };
    const inBld = {}; let nIn = 0;
    for (const p of W.props) { if (p.kind === 'post') continue; for (const b of built) { if ((p.x - b.x) ** 2 + (p.z - b.z) ** 2 > (b.L + b.Wd) ** 2) continue; if (inside(p, b)) { nIn++; inBld[p.kind] = (inBld[p.kind] || 0) + 1; break; } } }
    // standing on the ground: its foot (centre - h0) against the terrain, or the road's / the side road's own surface
    let off = 0, worst = 0; const offBy = {};
    for (const b of race.props) { if (b.dead || b.kind === 'post') continue; const gy = b.y - b.K.h0, q = Tr.query(b.x, b.z, b.qi, Q), ry = Tr.yAt(q), tg = W.groundH(b.x, b.z), d = Math.min(Math.abs(gy - tg), Math.abs(gy - ry));
      if (d > 0.8) { off++; offBy[b.kind] = (offBy[b.kind] || 0) + 1; } worst = Math.max(worst, d); }
    // the bollards are the Track's own rows
    let want = 0; for (const S of Tr.stubs) want += Tr.stubBollards(S.k).length;
    // reachable: a lamp or a sign inside the barriers (|d| within the barrier line) can be hit by a car on the road
    let reach = {}, all = {};
    for (const b of race.props) { if (b.dead) continue; const q = Tr.query(b.x, b.z, b.qi, Q); all[b.kind] = (all[b.kind] || 0) + 1;
      const lim = q.k >= 0 ? Tr.stubHw(Tr.stubs[q.k], q.st) + Tr.stubs[q.k].lim : (q.d > 0 ? q.br : q.bl), d = q.k >= 0 ? Math.abs(q.u) : Math.abs(q.d);
      if (d < lim - b.K.rh) reach[b.kind] = (reach[b.kind] || 0) + 1; }
    const ps = W.propStats || {};
    return { by, cap, knock: W.knock, propR: W.propR, postSpots: ps.nSpots, postsKnock: ps.posts, nIn, inBld, nBuilt: built.length, off, offBy, worst, want, stubs: Tr.stubs.length, total: race.props.length, reach, all, bollards: W.props.filter(p => p.kind === 'tbollard').length };
  });
  const K = r.by, need = { tbollard: 600, mlamp: 40, msign: 20, bsign: 8, bench: 8, nsign: 8, zaprta: 25, vboard: 3, flagp: 6, cflag: 8, post: 3 };   // (the delineator posts: knockable only where they fit inside the fence at the road's edge, the rest fixed behind it)
  console.log(`   props by kind: ${JSON.stringify(K)}, ${r.total} in all; delineator posts: ${r.postsKnock} knockable of ${r.postSpots} places (the rest stand fixed beside the guard rails)`);
  console.log(`   within reach of a car (inside the barriers): ${Object.keys(r.all).map(k => `${k} ${r.reach[k] || 0}/${r.all[k]}`).join(', ')}`);
  T.check('props: the world has every kind: bollards in front of the mouths, lamps, signs, plates, boards, flags, benches (and the delineator posts)', Object.keys(need).every(k => (K[k] || 0) >= need[k]), Object.keys(need).map(k => `${k} ${K[k] || 0}/${need[k]}`).join(', '));
  T.check('props: the bollards in the world are the Track\'s own rows (stubBollards, every side road)', r.bollards === r.want && r.want >= 600, `${r.bollards} of ${r.want} (${r.stubs} side roads)`);
  T.check('props: Core simulates all of them (propCap = the kinds\' counts in the world), the builder\'s count by kind the same', Object.keys(K).every(k => r.cap[k] === K[k]) && Object.keys(r.cap).every(k => K[k] === r.cap[k]) && Object.keys(r.knock || {}).every(k => r.knock[k] === K[k]), JSON.stringify(r.cap));
  T.check('props: none inside a building the scenery built', r.nIn === 0, `${r.nIn} inside one of ${r.nBuilt}` + (r.nIn ? ' ' + JSON.stringify(r.inBld) : ''));
  T.check('props: standing on the ground (the foot within 0.8 m of the terrain or the road under it), none floating or sunk', r.off <= Math.max(3, r.total * 0.01), `${r.off} of ${r.total} off the ground (${JSON.stringify(r.offBy)}), the worst ${r.worst.toFixed(2)} m`);
  T.check('props: drawn out to 150 m (the long open corridor)', r.propR === 150, 'propR ' + r.propR);

  // the renderer: one instanced mesh per kind, only the props within propR of the view drawn
  const s = await page.evaluate(async () => {
    const g = window.__game, race = g.race, Tr = race.track, P = race.player; g.pause();
    const out = [];
    for (const d of [60, 1000, 3300]) {
      let n = 0; while (P.q.s - Tr.startS < d && n < 800) { g.sim(1, true); n++; }
      Render.resetCam(); for (let i = 0; i < 8; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});
      const meshes = Render.scene.children.filter(o => o.isInstancedMesh && o.userData && o.userData.cap > 0);
      const cam = Render.cam, R = Math.max(150, (cam.vd || 60) * 2.3), cx = cam.vcx || 0, cz = cam.vcz || 0, lo = {}, hi = {};   // (within R - 3 m surely drawn, beyond R + 3 m surely not: the view's centre settles a little between frames)
      for (const b of race.props) { if (b.hidden || b.slot < 0) continue; const d = Math.hypot(b.x - cx, b.z - cz); if (d < R - 3) lo[b.kind] = (lo[b.kind] || 0) + 1; if (d < R + 3) hi[b.kind] = (hi[b.kind] || 0) + 1; }
      const byKind = {}; for (const m of meshes) if (m.visible && m.count > 0) byKind[m.userData.kind || Object.keys(race.propCap).find(k => race.propCap[k] === m.userData.cap) || '?'] = m.count;
      const total = meshes.reduce((a, m) => a + (m.visible ? m.count : 0), 0), sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
      out.push({ d: Math.round(P.q.s - Tr.startS), meshes: meshes.length, verts: meshes.map(m => m.geometry.attributes.position.count), total, lo: sum(lo), hi: sum(hi), kindsLo: Object.keys(lo).length, kindsShown: meshes.filter(m => m.visible && m.count > 0).length, kindsHi: Object.keys(hi).length, caps: meshes.map(m => m.userData.cap).sort((a, b) => a - b), casting: meshes.filter(m => m.castShadow).length });
    }
    return out;
  });
  const kinds = Object.keys(r.cap).length;
  T.check('render: one instanced mesh per kind, each with a model (vertices); the tall and the tiny ones cast shadows, the thin signs and the bench not', s.every(v => v.meshes === kinds && v.verts.every(n => n > 0 && n < 4000) && v.casting >= 5 && v.casting < v.meshes), s.map(v => `d ${v.d}: ${v.meshes} meshes (${kinds} kinds), model sizes ${Math.min(...v.verts)}-${Math.max(...v.verts)} vertices`).join('; '));
  T.check('render: the instances drawn are the props within the view\'s radius (to 3 m at its edge)', s.every(v => v.total >= v.lo && v.total <= v.hi && v.kindsShown >= v.kindsLo && v.kindsShown <= v.kindsHi && v.total > 0), s.map(v => `d ${v.d}: ${v.total} instances in ${v.kindsShown} kinds (expected ${v.lo}-${v.hi})`).join('; '));

  // a real bollard of the world, knocked over by the player's car in the browser: steered straight into a side road from the middle of the road, the fence
  // across the mouth stops it
  const k = await page.evaluate(() => {
    const g = window.__game, race = g.race, Tr = race.track, P = race.player, S = Tr.stubs.find(s => s.s > Tr.startS + 800 && s.m0 >= 0 && s.ang > 80 && s.ang < 100 && s.hw > 3);
    const mine = Tr.stubBollards(S.k), row = race.props.filter(b => b.kind === 'tbollard' && mine.some(m => Math.hypot(b.x - m.x, b.z - m.z) < 0.3)), x0 = row.map(b => [b.x, b.z]);
    race.state = 'racing'; P.locked = false;
    const P0 = Tr.stubPt(S.k, 0, {}), i0 = Tr.nearestIdx(P0.x, P0.z), bar = S.side > 0 ? Tr.br[i0] : Tr.bl[i0]; P.place(P0.x, P0.z, P0.h); P.q = Tr.query(P.x, P.z, i0, P.q); P.y = P.py = Tr.yAt(P.q); P.roadY = P.y; P.vx = Math.cos(P.h) * 11; P.vz = Math.sin(P.h) * 11;
    let out = -1e9, wall = 0;
    for (let i = 0; i < 120 * 4; i++) { P.inThr = 0.6; P.inBrk = 0; P.inSteer = 0; P.hitWall = 0; race.step(1 / 120); if (P.hitWall > 0.3) wall++; out = Math.max(out, Math.abs((P.x - Tr.px[i0]) * Tr.nx[i0] + (P.z - Tr.pz[i0]) * Tr.nz[i0]) - bar); }
    return { n: row.length, knocked: row.filter((b, i) => Math.hypot(b.x - x0[i][0], b.z - x0[i][1]) > 0.3).length, out, wall, awake: race.props.filter(b => !b.sleep && !b.dead).length };
  });
  T.check('knock: the player\'s car steered into a side road (in the browser) knocks some of its bollards over and the fence across the mouth stops it', k.n >= 3 && k.knocked >= 1 && k.out < 0 && k.wall > 0, `${k.knocked} of ${k.n} knocked over, its middle ${(-k.out).toFixed(1)} m short of the barrier at most, against the wall ${k.wall} steps, ${k.awake} awake`);
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
