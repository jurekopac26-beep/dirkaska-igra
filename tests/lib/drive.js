// A driver for the missions' tests without a browser (tests/m39.test.js ...): the autopilot's steering (Core.aiControl), the throttle and
// the brake only on and off as on the phone. careful(race, run, o): the speed held to o.vmax (m/s) and, with o.lat (m/s2 across), slowed
// for the bends ahead (looking o.look m on, braking at o.acc m/s2); o.lat 0: the autopilot's own braking (a racing pace). o.ctrl(P, run, t):
// the mission's own controls each step (a button, the brake at a stop ...), after the autopilot's; o.pre(P, run, t) before it (a lane:
// P.laneBias). Until the run
// ends or o.maxT s; returns the time driven.
'use strict';
function careful(race, run, o) {
  o = Object.assign({ vmax: 15, lat: 2.6, acc: 2.4, look: 160, maxT: 600, dt: 1 / 60 }, o);
  const P = race.player, T = race.track, dt = o.dt;
  let t = 0;
  for (; t < o.maxT && !run.end; t += dt) {
    if (o.pre) o.pre(P, run, t);
    Core.aiControl(P, race, dt);
    const v = Math.hypot(P.vx, P.vz);
    let vt = o.vmax;
    if (o.lat > 0) { const s0 = P.q ? P.q.s : 0; for (let d = 0; d < o.look; d += 2) { const k = Math.abs(T.k[T.idx(s0 + d)]) || 1e-6; vt = Math.min(vt, Math.sqrt(o.lat / k + 2 * o.acc * d)); } P.inThr = v < vt ? 1 : 0; P.inBrk = v > vt + 0.8 ? 1 : 0; }
    else if (P.inBrk > 0.3) { P.inThr = 0; P.inBrk = 1; } else { P.inBrk = 0; P.inThr = v < vt ? 1 : 0; }
    if (o.ctrl) o.ctrl(P, run, t, vt);
    race.step(dt); run.step(dt);
  }
  return t;
}
module.exports = { careful };
