// The pit road's junctions with the circuit (Core.Track.pitJ), on every real circuit with pits (the test tracks keep theirs as they were):
// before the way in the deceleration lane, after the way out the acceleration lane (or only their taper), between the circuit and the pit
// lane up to the pit wall's nose the hatched gore. Nothing of the world stands on that asphalt: no barrier, catch fence, hoarding, pit wall
// or its end, kerb, footpath, spectator, sign, post or tuft of grass (no vertex of the world's meshes 0.13 to 4.5 m above the road's centre there,
// 0.25 m in from its edges, 0.4 m from the pit lane's outer one) and no knockable prop; the junction is drawn (its paint: the gore's chevrons, white, in the world's meshes).
//   node tests/browser/pitjoin.test.mjs
//   PITJOIN_ONLY=spa,bathurst node tests/browser/pitjoin.test.mjs   only these
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Pit road junctions: nothing standing on their asphalt');
const srv = await serve();
const browser = await launch();
const ALL = ['spa', 'rbring', 'bathurst', 'cpalace', 'longford', 'rio', 'montreal', 'newcastle', 'toronto', 'detroit', 'bangsaen', 'townsville', 'troisrivieres'];
const IDS = process.env.PITJOIN_ONLY ? process.env.PITJOIN_ONLY.split(',') : ALL;

// measured in the page: every world vertex (and prop) on the junctions' asphalt, grouped by mesh
const MEASURE = () => {
  const g = window.__game, Tr = g.race.track, P = Tr.def.pit, ps = P[0] < 0 ? -1 : 1, L = Tr.len, J = Tr.pitJ();
  if (!J) return { none: true };
  const dS = (s) => { let d = s - Tr.startS; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };
  const band = (s) => { const d = dS(s), u = Tr.pitLead(s); if (u >= 0) return u > 0.05 ? [Tr.w + 0.25, Tr.w + 0.1 + 7 * u - 0.25] : null;
    const p = Tr.pitAt(s); return p && (d <= J.ga || d >= J.gb) ? [Tr.w + 0.25, p.lout - 0.4] : null; };   // (the pit lane's own outer edge: its builder's border, 0.4 m)
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let d = J.a; d <= J.b; d += 2) { if (d > J.ga + 2 && d < J.gb - 2) continue; const i = Tr.idx(Tr.startS + d); x0 = Math.min(x0, Tr.px[i]); x1 = Math.max(x1, Tr.px[i]); z0 = Math.min(z0, Tr.pz[i]); z1 = Math.max(z1, Tr.pz[i]); }
  x0 -= 30; x1 += 30; z0 -= 30; z1 += 30;
  const q = {}, at = (x, z, h) => { Tr.query(x, z, h, q); for (let k = 0; k < 400; k++) { const h0 = q.i; Tr.query(x, z, h0, q); if (q.i === h0) break; } return q; };   // (on to the nearest sample: the hint's search reaches 10)
  const W = Render.world.root; W.updateMatrixWorld(true);
  const hits = {}, v = new THREE.Vector3(), M = new THREE.Matrix4(); let hint = -1, chev = 0;
  W.traverse(m => {
    if (!m.isMesh || !m.geometry || !m.geometry.attributes.position) return;
    if (!m.isInstancedMesh && m.matrixWorld.getMaxScaleOnAxis() < 0.99) return;   // (the far scenery 1-2 km out, drawn shrunk towards the camera: not on the ground here, Rio)
    const pos = m.geometry.attributes.position, col = m.geometry.attributes.color, n = pos.count, inst = m.isInstancedMesh ? m.count : 1;
    for (let k = 0; k < inst; k++) {
      if (m.isInstancedMesh) { m.getMatrixAt(k, M); M.premultiply(m.matrixWorld); } else M.copy(m.matrixWorld);
      for (let j = 0; j < n; j++) {
        v.fromBufferAttribute(pos, j).applyMatrix4(M); if (v.x < x0 || v.x > x1 || v.z < z0 || v.z > z1) continue;
        at(v.x, v.z, hint); hint = q.i; const b = band(q.s); if (!b) continue; const dl = q.d * ps; if (dl < b[0] || dl > b[1]) continue;
        const y0 = Tr.hy ? Tr.hy[q.a] + (Tr.hy[(q.a + 1) % Tr.N] - Tr.hy[q.a]) * q.t : 0, dy = v.y - y0;
        if (dy > 0.02 && dy < 0.13 && col && col.getX(j) > 0.9) { const p = Tr.pitAt(q.s); if (p && dl < p.lin - 0.02) chev++; }   // (the gore's white paint: between the circuit and the pit lane's inner edge)
        if (dy < 0.13 || dy > 4.5) continue;   // (the junction's asphalt and paint lie up to ~0.1 m over the road's centre where it slopes across)
        const key = (m.name || m.material && m.material.type) + '/' + n, d = dS(q.s), e = hits[key] || (hits[key] = { n: 0, d0: 1e9, d1: -1e9 });
        e.n++; e.d0 = Math.min(e.d0, d); e.d1 = Math.max(e.d1, d);
      }
    }
  });
  const props = []; for (const p of g.race.props || []) { if (p.dead || p.hidden) continue; at(p.x, p.z, -1); const b = band(q.s); if (b && q.d * ps >= b[0] && q.d * ps <= b[1]) props.push(p.kind + '@' + dS(q.s).toFixed(0)); }
  return { hits, props, chev, li: J.li, lo: J.lo };
};

const res = [];
for (const id of IDS) {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase' }, { width: 390, height: 844 }, { seed: 7 });
  await startTrack(page, id);
  const r = await page.evaluate(MEASURE);
  res.push(Object.assign({ id, errors }, r));
  await page.close();
}
const hitStr = (r) => Object.entries(r.hits || {}).map(([k, e]) => `${k} ×${e.n} at ${e.d0.toFixed(0)}..${e.d1.toFixed(0)} m`).join('; ');
T.check('every real circuit with pits has the junctions (Core.Track.pitJ)', res.every(r => !r.none), res.filter(r => r.none).map(r => r.id).join(', ') || res.map(r => `${r.id} ${r.li}/${r.lo} m`).join(', '));
T.check('nothing stands on the junctions\' asphalt (no barrier, fence, pit wall end, kerb, footpath, spectator, sign or tuft)', res.every(r => !r.none && !Object.keys(r.hits).length),
  res.filter(r => r.hits && Object.keys(r.hits).length).map(r => `${r.id}: ${hitStr(r)}`).join(' | ') || 'none');
T.check('no knockable prop on them (cones, posts, tyre stacks, bollards)', res.every(r => !r.none && !r.props.length), res.filter(r => r.props && r.props.length).map(r => `${r.id}: ${r.props.join(' ')}`).join(' | ') || 'none');
T.check('the gores are drawn (their white chevrons and lines in the world\'s meshes)', res.every(r => r.chev > 20), res.map(r => `${r.id} ${r.chev}`).join(', '));
T.check('no errors', res.every(r => !r.errors.length), res.filter(r => r.errors.length).map(r => `${r.id}: ${r.errors.slice(0, 2).join('; ')}`).join(' | '));
await browser.close(); await srv.close();
T.done();
