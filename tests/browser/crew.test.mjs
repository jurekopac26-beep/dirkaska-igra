// The player's pit crew waits ready (js/render.js crewLogic), on every circuit with pits (not the test tracks). The car is put in the
// middle of the pit lane 75 m before its box (past every track's way in, before the 'box' event) and the autopilot drives it in, the renderer
// (and the crew) stepped along without drawing:
// 1. Ready: while the car comes down the lane the crew stays in the garage and takes up its kit there (the new tyres in the hands, the jacks
//    by the handle); out at the 'box' event (Core's pitState 'stop', 40 m before the box), not before it; only where the crew has further
//    to go than that leaves time for (Montréal: the garages behind its shallow apron) a little before it, never more than 80 m before the box.
// 2. Out: every man at his place round where the car will stop (Core's Track.bayPose; Townsville's and Trois-Rivières' World pitBox stop is
//    the lane's middle) well before the car is there (at least 0.6 s of waiting, ready), off the lane (beyond its outer edge; Montréal's
//    shallow apron: the car stops at its edge, its far side over the lane, the men on that side no further onto it than 1.2 m), none of them
//    in the car's way as it comes in, and the camera behind the car has them in sight (in the frame, nothing of the world in front of them:
//    Townsville's far view no longer folds a plane through the view round the camera, world-townsville.js farUpdate).
// 3. Then the work: where they waited is where the car stopped (the work's frame within 1.5 m and 4° of it).
//   node tests/browser/crew.test.mjs            (CREW_ONLY=montreal,townsville: only those)
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the player\'s pit crew waits ready');
const srv = await serve();
const browser = await launch();
const ONLY = process.env.CREW_ONLY ? process.env.CREW_ONLY.split(',') : null;
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2 }, { width: 640, height: 360 }, { seed: 34 });
  let ids = await page.evaluate(() => Core.TRACKS.filter(d => d.pit && !d.open && !d.test).map(d => d.id));
  T.check('13 circuits with pits (the test tracks left out)', ids.length === 13, ids.join(', '));
  if (ONLY) ids = ids.filter(id => ONLY.includes(id));
  const res = [];
  for (const id of ids) {
    await startTrack(page, id);
    res.push(await page.evaluate(() => {
      const g = window.__game; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
      const race = g.race, P = race.player, Tk = race.track, bd = Tk.def.pit[3], out = { id: Tk.def.id, bad: [] };
      for (let k = 0; k < 400 && g.phase !== 'racing'; k++) g.sim(0.1, true);   // (the lights out)
      const c = Render.crew; if (!c || !c.roles || c.P !== P) return Object.assign(out, { bad: ['no player\'s crew'] });
      // the car in the middle of the lane 75 m before its box, at 20 m/s along it (the race's distance moves on by 3 m a step at most; the race
      // makes it a ghost of the pit road itself, its box with it: Core's wall lets it onto the apron there)
      { const s = Tk.startS + bd - 75, p = Tk.pitAt(s), i = Tk.idx(s), h = Tk.hd[i];
        P.place(Tk.px[i] + Tk.nx[i] * p.sd * p.o, Tk.pz[i] + Tk.nz[i] * p.sd * p.o, h); P.q = Tk.query(P.x, P.z, i, P.q); P.sPrev = P.q.s;
        if (Tk.hasElev) P.y = P.py = Tk.hy[i]; P.roadY = P.y; P.vx = Math.cos(h) * 20; P.vz = Math.sin(h) * 20; P.w = 0;
        P.inPit = true; P.pitG = false; P.pitDone = false; P.pitState = null; Render.resetCam(); }
      const D = c.dim, role = c.men.filter(m => m.role !== 'idle' && m.role !== 'ENG'), seq = [], name = (m) => m.role + (m.wheel != null ? m.wheel : '');
      const at = (m) => Math.hypot(m.x - m.gx, m.z - m.gz) < 0.2;
      const lout = (x, z) => { const q = Tk.query(x, z, P.q.i, {}), p = Tk.pitAt(q.s); return p ? q.d * p.sd - p.lout : 99; };   // (how far beyond the lane's outer edge)
      const inCar = (m) => { const dx = m.x - P.x, dz = m.z - P.z, ch = Math.cos(P.h), sh = Math.sin(P.h), f = dx * ch + dz * sh, r = -dx * sh + dz * ch;   // (how far the man is from the car's outline 0.2 m out: < 0 in it)
        return Math.max(f - D.nose - 0.2, D.tail - 0.2 - f, Math.abs(r) - D.wid / 2 - 0.2); };
      let t = 0, tBox = null, tOut = null, dOut = null, tReady = null, tRep = null, home = 99, kit = true, clr = 99, lane = 99, F0 = null, F1 = null, seen = null, last = '';
      const arr = new Map(), hid = [];
      Render.scene.visible = false;
      for (let k = 0; k < 400 && !(tRep != null && t > tRep + 0.5); k++) {
        g.sim(0.05, false, 0, 0); t += 0.05;   // (no gas, the wheel straight: the autopilot drives the lane)
        Render.frame(0.05, 1, P, 'chase', {});
        if (seq[seq.length - 1] !== c.mode) seq.push(c.mode);
        if (P.pitState === 'stop' && tBox == null) tBox = t;
        if (c.mode === 'out' && tOut == null) { tOut = t; dOut = -Tk.boxX(P.q.s, bd); }
        if (c.mode === 'ready') { for (const m of role) home = Math.min(home, 0.35 - Math.hypot(m.x - m.hx, m.z - m.hz));
          if (!c.roles.N.every(m => m.tyre.mode === 'hands' && m.carry && m.act === 'carry') || !['JF', 'JR'].every(k => c.roles[k].carry && c.roles[k].act === 'jackR')) kit = false; }
        if (c.mode === 'out') {
          F0 = { x: c.frame.x, z: c.frame.z, h: c.frame.h };
          for (const m of role) { clr = Math.min(clr, inCar(m)); if (!arr.has(m) && at(m)) arr.set(m, t); if (arr.has(m)) lane = Math.min(lane, lout(m.x, m.z)); }
          if (tReady == null && arr.size === role.length) {
            tReady = t; last = name(role.reduce((a, m) => arr.get(m) > arr.get(a) ? m : a, role[0]));
            // the camera behind the car then: each man (his chest) in the frame, nothing of the world between
            const C = Render.camera, rc = new THREE.Raycaster(), meshes = []; Render.world.root.traverseVisible(o => { if (o.isMesh) meshes.push(o); });
            seen = role.filter(m => { const v = new THREE.Vector3(m.x, (m.y || 0) + 1.2, m.z), d = v.clone().sub(C.position), L = d.length(), s = v.clone().project(C);
              if (Math.abs(s.x) > 1 || Math.abs(s.y) > 1 || s.z > 1) { hid.push(`${name(m)} out of the frame (${s.x.toFixed(2)}, ${s.y.toFixed(2)})`); return false; }
              rc.set(C.position, d.normalize()); rc.far = L - 0.3; const h = rc.intersectObjects(meshes, false);
              if (h.length) hid.push(`${name(m)} behind ${h[0].object.name || h[0].object.type} ${h[0].distance.toFixed(1)} of ${L.toFixed(1)} m`); return !h.length; }).length;
          }
        }
        if (c.mode === 'work' && tRep == null) { tRep = t; F1 = { x: c.frame.x, z: c.frame.z, h: c.frame.h }; for (const m of role) clr = Math.min(clr, inCar(m)); }
      }
      Render.scene.visible = true;
      const dh = F0 && F1 ? Math.abs(Math.atan2(Math.sin(F1.h - F0.h), Math.cos(F1.h - F0.h))) * 180 / Math.PI : 99, r2 = (v) => v == null ? null : +v.toFixed(2);
      return Object.assign(out, { seq: seq.join('>'), tBox: r2(tBox), tOut: r2(tOut), tReady: r2(tReady), tRep: r2(tRep), wait: tRep != null && tReady != null ? r2(tRep - tReady) : -1, last, home: r2(home), kit,
        clr: r2(clr), lane: r2(lane), jump: F0 && F1 ? r2(Math.hypot(F1.x - F0.x, F1.z - F0.z)) : 99, dh: +dh.toFixed(1), seen, n: role.length, hid: hid.slice(0, 3).join('; '), dOut: r2(dOut), cdOut: r2(c.dOut) });
    }));
    const r = res[res.length - 1];
    console.log(`   ${r.id}: ${r.bad.length ? r.bad.join('; ') : `${r.seq}; box ${r.tBox} s, out ${r.tOut} s (${r.dOut} m before the box), all ready ${r.tReady} s (the last ${r.last}), stopped ${r.tRep} s: ${r.wait} s waiting; ${r.seen}/${r.n} in sight${r.hid ? ' (' + r.hid + ')' : ''}; ${r.clr} m clear of the car, ${r.lane} m beyond the lane's edge; the work ${r.jump} m, ${r.dh}° from where they waited`}`);
  }
  const ok = (f) => res.every(r => !r.bad.length && f(r)), fail = (f) => res.filter(r => r.bad.length || !f(r)).map(r => r.id).join(', ');
  const c1 = (r) => r.seq === 'ready>out>work' && r.home >= 0 && r.kit, c2 = (r) => r.tBox != null && r.tOut != null && (r.cdOut > 40 ? r.tOut <= r.tBox && r.dOut <= r.cdOut + 0.5 && r.dOut <= 80 : r.tOut === r.tBox), c3 = (r) => r.wait >= 0.6, c4 = (r) => r.lane >= (r.id === 'montreal' ? -1.2 : 0);
  const c5 = (r) => r.clr > 0, c6 = (r) => r.seen === r.n, c7 = (r) => r.jump < 1.5 && r.dh < 4;
  T.check('ready: the car in the lane, the crew in the garage with its kit (the new tyres in the hands, the jacks by the handle)', ok(c1), fail(c1) || res.map(r => r.seq).join(', '));
  T.check('out at the \'box\' event (40 m before the box), not before it; where they have further to go, before it, at most 80 m before the box', ok(c2), fail(c2) || res.map(r => `${r.id} ${r.dOut} m`).join(', '));
  T.check('every man at his place at least 0.6 s before the car stops', ok(c3), fail(c3) || `at least ${Math.min(...res.map(r => r.wait))} s, at most ${Math.max(...res.map(r => r.wait))} s`);
  T.check('off the lane (Montréal\'s shallow apron: no further onto it than 1.2 m)', ok(c4), fail(c4) || res.map(r => `${r.id} ${r.lane}`).join(', '));
  T.check('nobody in the car\'s way as it comes in (0.2 m round its body)', ok(c5), fail(c5) || `at least ${Math.min(...res.map(r => r.clr))} m clear`);
  T.check('the camera behind the car has them all in sight as they wait', ok(c6), fail(c6) || res.map(r => r.seen).join(', '));
  T.check('where they waited is where the car stopped (Core\'s Track.bayPose: within 1.5 m and 4°, as Core parks it straight)', ok(c7), fail(c7) || `at most ${Math.max(...res.map(r => r.jump))} m, ${Math.max(...res.map(r => r.dh))}°`);
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
