// Braking boards knocked over (Track.brakeBoards on the verge: Core 'bboard' props, drawn in World's one brakeBoards mesh, moved there by
// Render's bbPose), on Spa:
// 1. every board on the verge (kind 0) is a knockable prop standing exactly where World drew it (its plates' frame, b.home), none of those over
//    a barrier; the boards stay one mesh, no instanced mesh of their own: a fixed view of the board draws as many calls after the knock as before
// 2. a car driven into the 200 m board before La Source over the grass from 180 km/h (seeded, stepped by the test): the board's part of the mesh moves with the
//    prop (each vertex where the prop's turn and move since it stood put it), it ends lying in the grass beside the road (low, past the kerb),
//    the car a little slower (1-5 % at the blow) with a small dent (0.5-8 %); every other board stands as built (asleep where it stood, its
//    vertices untouched)
// 3. the race again (Ponovi): the board stands again as built; the same knock gives the same result bit for bit
//   node tests/browser/boards.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('braking boards knocked over');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.1, weather: 'dry', damage: 1 }, { width: 480, height: 270 });
  await startTrack(page, 'spa');
  // the race again from its start, seeded (the countdown and the knock the same each time), every rival parked far down the road, the game
  // paused: the test steps the race itself
  const knock = () => page.evaluate(() => {
    const g = window.__game; let sd = 4242; Math.random = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    g.onAction('restart'); g.pause();
    for (let i = 0; i < 400 && g.race.state !== 'racing'; i++) g.sim(0.05, true);
    const R = g.race, Tr = R.track, P = R.player, W = Render.world, L = W.bbLoose, DT = 1 / 120, h0 = 1;
    const B = Tr.brakeBoards()[0].boards[1], bbs = R.props.filter(b => b.kind === 'bboard'), k = bbs.findIndex(b => b.home && b.home[0] === B.x && b.home[2] === B.z), b = bbs[k];
    for (const c of R.cars) if (c !== P) { const j = Tr.idx(B.s + 900 + 40 * c.grid); c.place(Tr.px[j], Tr.pz[j], Tr.hd[j]); c.y = c.py = Tr.hy[j]; c.q = Tr.query(c.x, c.z, j, c.q); c.locked = true; c.parkQ = true; }
    const ga = L.mesh.geometry.attributes, PA = ga.position.array, same = (a, z) => { for (let i = a * 3; i < z * 3; i++) if (PA[i] !== L.P0[i]) return false; return true; };
    const home0 = L.v.every(v => same(v[0], v[1])), again = W.__bbt === 1; W.__bbt = 1;   // (every board as built when the race starts; again: the same world as the last knock's, its mesh put back)
    // the draw calls of a fixed view of the board (from beyond the barrier, the car parked out of sight)
    const cv = document.querySelector('canvas'), gl = cv.getContext('webgl2') || cv.getContext('webgl'), Pt = Object.getPrototypeOf(gl);
    if (!window.__dc) { window.__dc = { n: 0 }; for (const nm of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) { const f = Pt[nm]; if (f) Pt[nm] = function (...a) { window.__dc.n++; return f.apply(this, a); }; } }
    const sv = [P.x, P.z, P.y, P.py, P.h, P.vx, P.vz], i0 = B.i, side = B.side;
    const view = () => { const j = Tr.idx(-2000 + B.s); P.place(Tr.px[j], Tr.pz[j], Tr.hd[j]); P.y = P.py = Tr.hy[j];
      Render.setShot({ px: Tr.px[i0] + Tr.nx[i0] * side * 16 - Tr.tx[i0] * 14, py: Tr.hy[i0] + 6, pz: Tr.pz[i0] + Tr.nz[i0] * side * 16 - Tr.tz[i0] * 14, tx: B.x + Tr.tx[i0] * 3, ty: Tr.hy[i0] + 0.5, tz: B.z + Tr.tz[i0] * 3, fov: 40, near: 0.5 });
      Render.frame(1 / 60, 1, P, 'chase', {}); const n0 = window.__dc.n; Render.frame(1 / 60, 1, P, 'chase', {}); const n = window.__dc.n - n0; Render.setShot(null);
      P.x = P.px = sv[0]; P.z = P.pz = sv[1]; P.y = sv[2]; P.py = sv[3]; P.h = sv[4]; P.vx = sv[5]; P.vz = sv[6]; return n; };
    const callsBefore = view();
    // the car on the board's line from 30 m before it at 50 m/s, a little throttle, straight on
    const i = Tr.idx(B.s - 30); P.place(Tr.px[i] + Tr.nx[i] * B.lat, Tr.pz[i] + Tr.nz[i] * B.lat, Tr.hd[i]); P.y = P.py = Tr.hy[i]; P.roadY = P.y; P.q = Tr.query(P.x, P.z, i, P.q); P.vx = Math.cos(P.h) * 50; P.vz = Math.sin(P.h) * 50;
    let hit = -1, v0 = 0, v1 = 0, d0 = 0, d1 = 0, slept = -1, drawn = 0, worst = 0;
    for (let s = 0; s < 120 * 7; s++) {
      P.inThr = 0.4; P.inBrk = 0; P.inSteer = 0;
      const vb = P.speed, db = P.dmg; R.step(DT);
      if (hit < 0 && !b.sleep) { hit = s; v0 = vb; v1 = P.speed; d0 = db; d1 = P.dmg; }
      if (hit >= 0 && slept < 0 && b.sleep) slept = s;
      if (hit >= 0 && s === hit + 18) { const j = Tr.idx(B.s + 60); P.place(Tr.px[j], Tr.pz[j], Tr.hd[j]); P.y = P.py = Tr.hy[j]; P.roadY = P.y; P.q = Tr.query(P.x, P.z, j, P.q); P.vx = Math.cos(P.h) * 40; P.vz = Math.sin(P.h) * 40; }   // (then on along the road's middle, clear of the boards)
      if (hit >= 0 && (s - hit) % 30 === 6) {   // a frame now and then while it falls: its part of the mesh where the prop's pose puts it
        Render.frame(1 / 60, 1, P, 'chase', {}); drawn++;
        const h = b.home, q = new THREE.Quaternion(b.qx, b.qy, b.qz, b.qw).multiply(new THREE.Quaternion(0, -h[3], 0, h[4])), v = new THREE.Vector3(), [a, z] = L.v[k];
        for (let n = a; n < z; n++) { v.fromArray(L.P0, n * 3).sub(new THREE.Vector3(h[0], h[1], h[2])).applyQuaternion(q).add(new THREE.Vector3(b.x, b.y, b.z)); worst = Math.max(worst, v.distanceTo(new THREE.Vector3().fromArray(PA, n * 3))); }
      }
    }
    Render.frame(1 / 60, 1, P, 'chase', {});
    // the fixed view now, and the same view with the knocked board put back where it stood for a moment (its prop's pose home, drawn, then back)
    const callsAfter = view(), lie = [b.x, b.y, b.z, b.qx, b.qy, b.qz, b.qw], H = b.home, pose = (p) => { [b.x, b.y, b.z, b.qx, b.qy, b.qz, b.qw] = p; };
    pose([H[0], H[1], H[2], 0, H[3], 0, H[4]]); const callsHome = view(); pose(lie); Render.frame(1 / 60, 1, P, 'chase', {});
    // where it lies: the drawn part's highest point over the ground there, its nearest point to the road past the kerb
    const [a, z] = L.v[k], gH = (x, zz) => W.groundH(x, zz); let top = -1e9, mid = 0, inner = 1e9, moved = 0, top0 = -1e9, mid0 = 0; const Q = {};
    for (let n = a; n < z; n++) { const x = PA[n * 3], y = PA[n * 3 + 1], zz = PA[n * 3 + 2], q = Tr.query(x, zz, b.qi, Q), gy = gH(x, zz);
      top = Math.max(top, y - gy); if (n < a + 12) mid += (y - gy) / 12; inner = Math.min(inner, Math.abs(q.d) - (Tr.wAt(q.i) + (Tr.curb[q.i] ? Tr.curbW : 0))); moved = Math.max(moved, Math.hypot(x - L.P0[n * 3], y - L.P0[n * 3 + 1], zz - L.P0[n * 3 + 2]));
      const y0 = L.P0[n * 3 + 1] - gH(L.P0[n * 3], L.P0[n * 3 + 2]); top0 = Math.max(top0, y0); if (n < a + 12) mid0 += y0 / 12; }   // (mid: its two plates' middle, their 12 vertices first)
    const others = bbs.filter((o, j) => j !== k && (!o.sleep || o.x !== o.home[0] || o.y !== o.home[1] || o.z !== o.home[2] || o.qx || o.qz || o.qy !== o.home[3] || o.qw !== o.home[4])).length;
    const othersDrawn = L.v.filter((v, j) => j !== k && !same(v[0], v[1])).length;
    // the wiring: the props of the boards on the verge (Track.brakeBoards kind 0) and their homes, World's boards as drawn (the plates' lower edges)
    const kind0 = Tr.brakeBoards().flatMap(z => z.boards).filter(o => !o.kind).length, WB = W.brakeBoards.filter(o => !o.kind);
    const homeOff = Math.max(...bbs.map((o, j) => Math.abs(o.home[1] - h0 + 0.5 - WB[j].y0)));
    let bbMeshes = 0, bbInst = 0; Render.scene.traverse(o => { if (o.name === 'brakeBoards') bbMeshes++; if (o.isInstancedMesh && o.geometry && o.geometry.attributes.position && o.count && o.userData && o.userData.cap === bbs.length) bbInst++; });
    const up = 1 - 2 * (b.qx * b.qx + b.qz * b.qz);
    return { again, kind0, n: bbs.length, parts: L.v.length, verts: [...new Set(L.v.map(v => v[1] - v[0]))], homeOff, bbMeshes, bbInst, home0, callsBefore, callsAfter, callsHome, hit: hit * DT, loss: 100 * (1 - v1 / v0), dmg: 100 * (d1 - d0), kmh: v0 * 3.6,
      slept: slept > 0 ? (slept - hit) * DT : -1, up, drawn, worst, top, top0, mid, mid0, inner, moved, others, othersDrawn,
      pose: [b.x, b.y, b.z, b.qx, b.qy, b.qz, b.qw], car: [P.x, P.z, P.vx, P.vz, P.dmg], verts1: Array.from(PA.subarray(a * 3, z * 3)) };
  });
  const r = await knock();
  T.check('Spa: every board on the verge a knockable prop (those over a barrier not), standing exactly where World drew it, its vertices in World\'s one mesh as built',
    r.n === r.kind0 && r.parts === r.n && r.verts.length === 1 && r.verts[0] === 90 && r.homeOff < 0.006 && r.home0, `${r.n} props (Track.brakeBoards on the verge ${r.kind0}), ${r.parts} parts of ${r.verts.join('/')} vertices, the plates ${r.homeOff.toFixed(3)} m off as drawn`);
  T.check('one mesh for all the boards, no instanced mesh of their own: a fixed view of the board draws as many calls with it lying as with it standing',
    r.bbMeshes === 1 && r.bbInst === 0 && r.callsAfter === r.callsHome, `${r.bbMeshes} brakeBoards mesh; draw calls ${r.callsAfter} lying, ${r.callsHome} with it put back for a frame (${r.callsBefore} at the race's start)`);
  T.check('the 200 m board before La Source hit by a car driven over the grass from 180 km/h: knocked over, at rest again within 6 s', r.hit > 0 && r.up < 0.6 && r.slept > 0 && r.slept < 6,
    `hit after ${r.hit.toFixed(2)} s at ${r.kmh.toFixed(0)} km/h, its up axis ${r.up.toFixed(2)} (1: standing), at rest ${r.slept.toFixed(1)} s after the blow`);
  T.check('its part of the mesh moves with the prop (each vertex where the prop\'s pose puts it, frame after frame while it falls)', r.drawn >= 5 && r.worst < 0.002 && r.moved > 1,
    `${r.drawn} frames, off by ${(r.worst * 1000).toFixed(2)} mm at most, a vertex moved ${r.moved.toFixed(1)} m`);
  T.check('it lies in the grass beside the road: low (its plates\' middle under half as high over the ground as standing, its top 0.4 m lower or more), all of it past the kerb',
    r.mid < 0.5 * r.mid0 && r.top < r.top0 - 0.4 && r.inner > 0.2, `its plates' middle ${r.mid.toFixed(2)} m over the ground (standing ${r.mid0.toFixed(2)} m), its top ${r.top.toFixed(2)} m (standing ${r.top0.toFixed(2)} m), its nearest point ${r.inner.toFixed(2)} m past the kerb`);
  T.check('the car: a little slower at the blow (1-5 %), a small dent (0.5-8 %)', r.loss > 1 && r.loss < 5 && r.dmg > 0.5 && r.dmg < 8, `${r.loss.toFixed(2)} % slower, damage +${r.dmg.toFixed(1)} %`);
  T.check('every other board stands as built (the prop asleep where it stood, its vertices untouched)', r.others === 0 && r.othersDrawn === 0, `${r.n - 1} boards: ${r.others} props moved, ${r.othersDrawn} drawn elsewhere`);
  const r2 = await knock();
  T.check('the race again (the same world, its mesh): every board as built at its start (the knocked one standing again)', r2.again && r2.home0, r2.again ? '' : 'the world was built anew');
  T.check('the same knock again: the same result bit for bit (the board, the car, the board\'s vertices)', JSON.stringify([r.pose, r.car, r.verts1]) === JSON.stringify([r2.pose, r2.car, r2.verts1]),
    `board ${r.pose.slice(0, 3).map(v => v.toFixed(3)).join(', ')} / ${r2.pose.slice(0, 3).map(v => v.toFixed(3)).join(', ')}`);
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
