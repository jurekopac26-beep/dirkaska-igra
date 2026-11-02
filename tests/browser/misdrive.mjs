// A driver for the missions' browser tests (tests/browser/m39.test.mjs ...): in the page, the autopilot's steering (Core.aiControl), the
// throttle and the brake only on and off as on the phone, steps of the game (window.__game.sim). careful(page, o): the speed held to o.vmax
// (m/s) and, with o.lat (m/s2 across), slowed for the bends ahead (o.look m on, braking at o.acc m/s2); o.lat 0: the autopilot's own braking.
// o.ctrl: a function's source (P, r, t, vt) => { thr, brk, steer } or null, the mission's own controls each step (a stop, a button);
// o.pre: one (P, r, t) before the autopilot's (its lane: P.laneBias).
// Until the run ends, o.until (a function's source of r) is true, or o.maxT s of the run; returns { t, end, s }.
export function careful(page, o) {
  return page.evaluate((o) => {
    o = Object.assign({ vmax: 15, lat: 2.6, acc: 2.4, look: 160, maxT: 600, dt: 0.05, ctrl: null, pre: null, until: null }, o);
    const g = window.__game, r = Missions.run, R = g.race, T = R.track, P = R.player, t0 = r.t;
    const ctrl = o.ctrl ? new Function('return ' + o.ctrl)() : null, pre = o.pre ? new Function('return ' + o.pre)() : null, until = o.until ? new Function('return ' + o.until)() : null;
    for (let k = 0; k < 60000 && !r.end && r.t - t0 < o.maxT && !(until && until(r)); k++) {
      if (pre) pre(P, r, r.t);
      Core.aiControl(P, R, o.dt);
      const v = Math.hypot(P.vx, P.vz);
      let st = P.inSteer * (P.gear < 0 ? -1 : 1), thr = 0, brk = 0, vt = o.vmax;
      if (o.lat > 0) { const s0 = P.q ? P.q.s : 0; for (let d = 0; d < o.look; d += 2) { const kk = Math.abs(T.k[T.idx(s0 + d)]) || 1e-6; vt = Math.min(vt, Math.sqrt(o.lat / kk + 2 * o.acc * d)); } thr = v < vt ? 1 : 0; brk = v > vt + 0.8 ? 1 : 0; }
      else if (P.inBrk > 0.3) brk = 1; else thr = v < vt ? 1 : 0;
      if (ctrl) { const c = ctrl(P, r, r.t, vt); if (c) { if (c.thr != null) thr = c.thr; if (c.brk != null) brk = c.brk; if (c.steer != null) st = c.steer; } }
      g.sim(o.dt, false, st, thr, brk);
    }
    return { t: r.t, end: r.end, why: r.why, s: P.q ? P.q.s : 0 };
  }, o);
}
