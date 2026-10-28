import fs from 'fs';
import L11 from '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/vse11.mjs';
const SP = '/tmp/claude-0/-home-user-dirkaska-igra/2bb27175-330b-5cd8-945e-d44eb8d706b8/scratchpad/';
const P = (f) => ({ probe: fs.readFileSync(SP + f, 'utf8') });
const list = [{ reload: true }].concat([P('carfix-page.js')], L11.slice(0, 9), [{ probe: 'window.__MXOPEN = [[-314.8, -1.1, 8]]; 1' }, P('mx-page5.js'), P('merge-page3.js')], L11.slice(11, 14), [P('fixes-page7.js'), P('boxrow-page.js'), P('fence2-page.js'), P('grass-page3.gen.js'), P('edge-page2.js')]);
list.push({ probe: 'window.__MXJ(0); window.__EDGE(6)' }, P('gond-page.js'), P('snow-page.js'), P('parkfix-page.js'), P('stage-page.js'), P('route-page.js'), P('lot-page.js'), P('jetski-page.js'), P('volcano-page.js'));
list.push({ probe: `(() => { window.__DRV = (x, z, h, mode, yOver, noPlace) => { const g = __game, P = g.race.player, T = g.race.track; g.pause && g.pause(); const H3 = window.__H3, gy0 = yOver !== undefined && yOver !== null ? yOver : (H3 && H3.ground ? H3.ground(x, z) + (H3.top || 0) : (T.ground2 ? T.ground2(x, z) : 0)); if (!noPlace) { P.place(x, z, h); P.vx = Math.cos(h) * 8; P.vz = Math.sin(h) * 8; P.y = P.py = P.roadY = gy0; }
  const portrait = innerHeight > innerWidth, fx = Math.cos(h), fz = Math.sin(h); let sh;
  if (mode === 'chase') { const D = portrait ? 46 : 30, pitch = portrait ? 0.98 : 0.9, ahead = portrait ? 13 : 8.5, tx = x + fx * ahead, tz = z + fz * ahead; sh = { px: tx - fx * D * Math.cos(pitch), py: gy0 + D * Math.sin(pitch), pz: tz - fz * D * Math.cos(pitch), tx, ty: gy0, tz, fov: portrait ? 58 : 46 }; }
  else { const D = 57, pitch = 0.82, tx = x + Math.max(-20, Math.min(20, fx * 19)), tz = z + Math.max(-10.5, Math.min(15.5, fz * 19)); sh = { px: tx, py: gy0 + D * Math.sin(pitch), pz: tz + D * Math.cos(pitch), tx, ty: gy0, tz, fov: 30 }; }
  Render.camera.far = Math.max(Render.camera.far, 2000); Render.setShot(Object.assign(sh, { fogD: 600, gy: 0, near: 1 })); for (let k = 0; k < 3; k++) Render.frame(1 / 60, 1, P, 'tv', {}); return mode + ' ' + x.toFixed(1) + ',' + z.toFixed(1) + ' h' + h.toFixed(2); };
  window.__VBEND = (q, mode) => { const B = window.__VOLCBEND.BEND, i = Math.floor(B.length * q), a = B[i], b = B[Math.min(B.length - 1, i + 4)]; return window.__DRV(a[0], a[1], Math.atan2(b[1] - a[1], b[0] - a[0]), mode); };
  window.__VTRAIN = (f, mode) => { const r = JSON.parse(window.__VOLC(f)); return window.__DRV(r.w[0], r.w[2], r.h, mode, r.w[1] + 1.2, true); };
  return 'drv ok'; })()` });
list.push(P('carfix-page.js'), P('anim-page.js'), P('carfix-page.js'));   // (the park lane's junction: its own list, join3-page.js)
list.push(P('lava-page.js'), P('heli3-page.js'), P('carfix-page.js'), { probe: 'window.__HSHOT(0); 1' });   // the rescue base and the volcano without smoke
// the user's road fixes (sand band, the ring road's mouth, the garage lane and the island), the new construction site (with the building on its platform, B),
// its palisade options, the glass footbridge
list.push(P('sandfix-page.js'), P('join5-page.js'), P('join6-page.js'), P('site-page.js'), P('carfix-page.js'), P('site-bld-page.js'), { probe: 'window.__SITEBLD && window.__SITEBLD(1); 1' }, P('site-opts-page.js'), P('glass-page.js'), { probe: 'window.__BRV && window.__BRV(-1); window.__GLB && window.__GLB(0); 1' }, P('carfix-page.js'));
export default { tag: 'ch8', list };
