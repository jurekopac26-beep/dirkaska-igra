// Special mission 35 · Reševalci na plaži (js/missions/m35.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch):
// ?misija=35 on Newcastle, the lifeguard's quad (the MRAVLJA's physics, its own body); the panel (PLAVALEC, MOČ PLAVALCA, VALOVI), no
// timing tower; the swell over the sea (crests over the world's sea, none on the sand), the ring, the lifeguards' tower on the sand, the
// jet ski at the water's edge in the water (hidden until used); stopped over the beach the PRESEDI NA SKUTER button and the USTAVI TU tag,
// a tap: the camera behind the jet ski (upright, then on its side 640 x 360 and back: the jet ski in the picture); a driver out to the
// swimmer (only on the sea, never on the sand), beside him slow: on the sled; back to the beach: done, the camera back on the quad.
// Back to the title: the swell, the button and the tags gone, the game's own camera. No errors on the page.
//   node tests/browser/m35.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m35');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, P = R.player, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: P.m.id, run: r && { end: r.end, why: r.why, stage: r.stage, t: r.t, str: r.str }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], tower: vis('#tw-strip') || vis('#h-tower'),
    btn: vis('#mis-btn'), tags: [...document.querySelectorAll('#mis-tags i')].map(e => e.innerText.replace(/\s+/g, ' ')), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
// where the camera is against the jet ski: the ski on the screen (x, y in -1..1), the camera behind it and over it
const camAt = (page) => page.evaluate(() => { const r = Missions.run, S = r.ski, C = Render.camera, v = new THREE.Vector3(S.x, S.y + 0.5, S.z).project(C);
  const back = (C.position.x - S.x) * Math.cos(S.h) + (C.position.z - S.z) * Math.sin(S.h);
  return { shot: !!Render.cam.shot && Render.cam.shot === S.shot, x: +v.x.toFixed(2), y: +v.y.toFixed(2), back: +back.toFixed(1), up: +(C.position.y - S.y).toFixed(1), fov: C.fov, aspect: +C.aspect.toFixed(2) }; });
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=35', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=35: Newcastle, the quad on the MRAVLJA', s.track === 'newcastle' && s.car === 'mravlja', JSON.stringify({ track: s.track, car: s.car }));
  T.check('the panel: PLAVALEC ~m, MOČ PLAVALCA 62 %, VALOVI 1,2 m; no timing tower', /^PLAVALEC ~\d+ m$/.test(s.rows[0]) && s.rows[1] === 'MOČ PLAVALCA 62 %' && s.rows[2] === 'VALOVI 1,2 m' && !s.tower, JSON.stringify(s.rows));
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 100 && !(Missions.run.t > 1); k++) g.sim(0.25, true); });
  const S = await page.evaluate(() => { const r = Missions.run, v = Render.viewOf(r.P), G = Render.world.groundH, p = r.sea.m.geometry.attributes.position.array;
    let top = -9, onSand = 0; for (let k = 0; k < p.length; k += 3) { top = Math.max(top, p[k + 1]); if (G(p[k], p[k + 2]) > 0 && p[k + 1] > -0.05) onSand++; }
    return { skin: !!(r.skin && r.skin.parent === v.bodyG), body: v.body.visible, sea: !!r.sea.m.parent, seaId: r.sea.m.id, top: +top.toFixed(2), onSand, ring: !!r.ringM.parent && r.ringM.visible,
      tower: { y: +r.tower.position.y.toFixed(2), g: +G(r.tower.position.x, r.tower.position.z).toFixed(2) }, ski: { hidden: !r.ski.on, g: +G(r.ski.x, r.ski.z).toFixed(2) }, sw: +G(r.sw.x, r.sw.z).toFixed(2) }; });
  T.check('the quad\'s own body (the MRAVLJA\'s hidden), the swell (crests over the sea, none up on the sand), the ring', S.skin && !S.body && S.sea && S.top > 0.8 && S.onSand === 0 && S.ring, JSON.stringify(S));
  T.check('the tower on the sand (its legs on the ground), the jet ski in the water at the edge (hidden), the swimmer at sea', S.tower.g > 1 && Math.abs(S.tower.y - S.tower.g) < 0.3 && S.ski.hidden && S.ski.g < -0.6 && S.sw < -2, JSON.stringify({ tower: S.tower, ski: S.ski, sw: S.sw }));
  // the quad over the beach: on to the place, stopped there
  const res = await page.evaluate(() => { const g = window.__game, r = Missions.run, K = r.def.K;
    for (let k = 0; k < 2000 && !r.end; k++) { const P = r.P, s = P.q.s, v = Math.hypot(P.vx, P.vz);
      if (r.btn.shown) return 'btn';
      Core.aiControl(P, g.race, 0.05); const ds = K.STOP - s, vt = Math.max(0, Math.min(25, ds * 0.35));
      let thr = 0, brk = 0; if (ds > 2) { if (v < vt) thr = 0.8; else brk = 0.6; } else brk = 1;
      g.sim(0.1, false, P.inSteer, thr, brk); }
    return r.end || 'n'; });
  await page.waitForFunction(() => [...document.querySelectorAll('#mis-tags i')].some(e => /USTAVI TU/.test(e.innerText)), null, { timeout: 8000 }).catch(() => {});   // (the tags follow the camera: drawn once the view has caught up with the stop, slower on a slow machine)
  s = await st(page);
  T.check('stopped over the beach: PRESEDI NA SKUTER shown, the USTAVI TU tag, the hint', res === 'btn' && s.btn && s.tags.some(t => /USTAVI TU/.test(t)) && /Presedi na skuter/.test(await page.evaluate(() => Missions.run.hint)), JSON.stringify({ res, btn: s.btn, tags: s.tags }));
  await page.tap('#mis-btn');
  await page.evaluate(() => window.__game.sim(0.2, false, 0, 0, 0));
  const near = () => page.waitForFunction(() => { const S = Missions.run.ski, C = Render.camera; return Math.hypot(C.position.x - S.x, C.position.z - S.z) < 30; }, null, { timeout: 5000 }).catch(() => {});   // (the camera's frame drawn)
  await near(); await page.waitForTimeout(300);
  let c = await camAt(page);
  s = await st(page);
  T.check('the tap: on the jet ski, the camera behind it (upright: fov 58, the jet ski in the lower half of the picture)', s.run.stage === 'ski' && c.shot && c.back < -8 && c.up > 8 && c.fov === 58 && Math.abs(c.x) < 0.3 && c.y < 0 && c.y > -0.9, JSON.stringify(c));
  await page.setViewportSize({ width: 640, height: 360 }); await page.waitForFunction(() => Render.camera.aspect > 1, null, { timeout: 5000 }).catch(() => {}); await near(); await page.waitForTimeout(500);
  c = await camAt(page);
  T.check('on its side (640 x 360): the camera behind it (fov 46), the jet ski in the picture', c.shot && c.aspect > 1 && c.fov === 46 && c.back < -6 && Math.abs(c.x) < 0.3 && c.y < 0 && c.y > -0.95, JSON.stringify(c));
  await page.setViewportSize({ width: 360, height: 640 }); await page.waitForFunction(() => Render.camera.aspect < 1, null, { timeout: 5000 }).catch(() => {}); await near(); await page.waitForTimeout(500);
  c = await camAt(page);
  T.check('upright again: the camera as before', c.shot && c.aspect < 1 && c.fov === 58 && c.y < 0 && c.y > -0.9, JSON.stringify(c));
  // the jet ski: out to the swimmer, slow beside him (on the sled), back to the beach; only on the sea all the way
  const run = await page.evaluate(() => { const g = window.__game, r = Missions.run, S = r.ski, G = Render.world.groundH; let gMax = -9, sled = false;
    for (let k = 0; k < 3000 && !r.end; k++) {
      const home = r.stage === 'sled', tx = home ? -96 + 0.6 * 3 : r.sw.x, tz = home ? 606 + 0.8 * 3 : r.sw.z;
      const a = Math.atan2(tz - S.z, tx - S.x), e = Math.atan2(Math.sin(a - S.h), Math.cos(a - S.h)), d = Math.hypot(tx - S.x, tz - S.z), vt = home ? 20 : Math.min(15, Math.max(0.8, (d - 2) * 0.5));
      r.autoIn = [Math.max(-1, Math.min(1, e * 2)), S.v < vt ? 1 : 0, S.v > vt + 1 ? 1 : 0];
      g.sim(0.1, false, 0, 0, 0); gMax = Math.max(gMax, G(S.x, S.z)); if (r.stage === 'sled') sled = true;
    }
    return { end: r.end, sled, gMax: +gMax.toFixed(2), onSled: !!r.onSled && r.onSled.visible, shot: !!Render.cam.shot, t: +r.t.toFixed(1) }; });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  const back = await page.evaluate(() => { const r = Missions.run, P = r.P, C = Render.camera; return +Math.hypot(C.position.x - P.x, C.position.z - P.z).toFixed(1); });
  T.check('picked up (on the sled), back at the beach: done, under 3 minutes for the driver; never on the sand', run.end === 'win' && run.sled && run.onSled && run.gMax < -0.6 && run.t < 180 && /MISIJA OPRAVLJENA/.test(s.res) && s.rows[0] === 'PLAVALEC na saneh', JSON.stringify({ run, res: s.res, rows: s.rows }));
  T.check('the camera back on the quad', !run.shot && back < 60, JSON.stringify({ shot: run.shot, back }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((id) => ({ sea: !Render.scene.getObjectById(id), btn: !document.getElementById('mis-btn'), tags: !document.getElementById('mis-tags'), shot: !Render.cam.shot }), S.seaId);
  T.check('back to the title: the swell, the button and the tags gone, the game\'s camera', gone.sea && gone.btn && gone.tags && gone.shot, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
