// Townsville's grandstands: no tree grows in a stand among the fans (the palms along the start straight were planted before the stands
// were built and stood in the main stand), none within a metre and a half of one; the park and the town keep their trees.
//   node tests/browser/townsville.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Townsville: the grandstands free of trees');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase' });
  await startTrack(page, 'townsville');
  const r = await page.evaluate(() => {
    const W = Render.world, S = W.stands || [];
    const inP = (P, x, z) => { let c = false; for (let a = 0, b = P.length - 1; a < P.length; b = a++) { const [xa, za] = P[a], [xb, zb] = P[b]; if ((za > z) !== (zb > z) && x < (xb - xa) * (z - za) / (zb - za) + xa) c = !c; } return c; };
    const dist = (P, x, z) => { let d = 1e9; for (let a = 0, b = P.length - 1; a < P.length; b = a++) { const [ax, az] = P[b], vx = P[a][0] - ax, vz = P[a][1] - az, l2 = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2)); d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return d; };
    const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), bad = [];
    let trees = 0;
    W.root.traverse(o => {
      if (!o.isInstancedMesh || o.material !== W.treeMat) return;
      for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, m4); v.setFromMatrixPosition(m4); const x = v.x + o.position.x, z = v.z + o.position.z; trees++;
        if (S.some(P => inP(P, x, z) || dist(P, x, z) < 1.4)) bad.push([+x.toFixed(1), +z.toFixed(1)]); }
    });
    return { stands: S.length, trees, stat: W.stats.trees, bad: bad.slice(0, 6), nBad: bad.length };
  });
  T.check('the five grandstands\' outlines', r.stands === 5, `${r.stands}`);
  T.check('no tree in a grandstand, none within 1.4 m of one', r.nBad === 0, `${r.nBad} of ${r.trees} trees ${JSON.stringify(r.bad)}`);
  T.check('the park and the town keep their trees (every one planted drawn, the mangroves besides)', r.trees > 2000 && r.trees >= r.stat, `${r.trees} drawn, ${r.stat} planted`);
  T.check('no errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
