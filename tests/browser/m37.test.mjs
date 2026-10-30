// Special mission 37 · Poplava (js/missions/m37.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=37 on
// Bang Saen in the rain, the amphibian (the MEDVED's physics, its own body); the panel (REŠENI, GLOBINA VODE, VODA NARAŠČA), no timing
// tower; the flood's water, the amphibian's body and the people in the scene, every person standing on a roof (a ray down there hits the
// roof at their feet), the POMOČ! tags; stopped by the first house the VRZI OBROČ button, a tap on it: the ring flies, the person down
// the line onto the deck; a driver to every house in turn (stopping, throwing) and on to the dry ground at the hairpin: all 8 safe, done.
// Back to the title: the water, the button and the tags gone. No errors on the page.
//   node tests/browser/m37.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m37');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, P = R.player, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: P.m.id, rain: R.rain, run: r && { end: r.end, why: r.why, saved: r.saved, aboard: r.aboard, t: r.t }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], tower: vis('#tw-strip') || vis('#h-tower'),
    btn: vis('#mis-btn'), tags: document.querySelectorAll('#mis-tags i').length, tagText: (document.querySelector('#mis-tags i') || {}).innerText || '', res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
// the driver: on to the first house still with people on it (by the road's s), stopped there; with none left on to the dry ground
const drive = (page, opt) => page.evaluate((opt) => { const g = window.__game, r = Missions.run, K = r.def.K;
  for (let k = 0; k < opt.n && !r.end; k++) {
    const P = r.P, s = P.q.s, v = Math.hypot(P.vx, P.vz);
    let goal = null; for (const h of r.houses) if (h.left > 0 && (!goal || h.s < goal.s)) goal = h;
    const want = goal ? goal.s : (K.DRY[0] + K.DRY[1]) / 2, N = r.def.near(r);
    if (opt.stopAtBtn && r.btn.shown) return 'btn';
    if (opt.auto && !r.act && goal && N && N.d < K.NEAR - 3 && v < K.VSTOP * 0.8) r.autoThrow = true;
    Core.aiControl(P, g.race, 0.05);
    const ds = want - s, vt = Math.min(30, Math.max(2, Math.abs(ds) * 0.35));
    let thr = 0, brk = 0; if (r.act) brk = 1; else if (ds > 4) { if (v < vt) thr = 0.8; else brk = 0.5; } else if (ds < -4) brk = 0.6; else brk = 1;
    g.sim(0.1, false, P.inSteer * (P.gear < 0 ? -1 : 1), thr, brk);
  }
  return r.end || 'n'; }, opt);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=37', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=37: Bang Saen in the rain, the amphibian (the MEDVED)', s.track === 'bangsaen' && s.car === 'medved' && s.rain > 0.5, JSON.stringify({ track: s.track, car: s.car, rain: s.rain }));
  T.check('the panel: REŠENI 0 / 8, GLOBINA VODE over 2 m, VODA NARAŠČA +0 / 50 cm; no timing tower', s.rows[0] === 'REŠENI 0 / 8' && /^GLOBINA VODE 2,\d m$/.test(s.rows[1]) && s.rows[2] === 'VODA NARAŠČA +0 / 50 cm' && !s.tower, JSON.stringify(s.rows));
  // the scene: the water, the amphibian's body, the people on the roofs (a ray down at each one's feet: the roof there, the world's own)
  const S = await page.evaluate(() => { const r = Missions.run, v = Render.viewOf(r.P);
    const mine = new Set(); for (const o of r.props || []) o.traverse(x => mine.add(x));
    const rc = new THREE.Raycaster(), objs = []; Render.scene.traverse(o => { if ((o.isMesh || o.isInstancedMesh) && o.visible && !mine.has(o)) objs.push(o); });
    const feet = r.who.map(p => { rc.set(new THREE.Vector3(p.x, 60, p.z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObjects(objs, false)[0]; const M = new THREE.Matrix4(); r.crowd.g.children[0].getMatrixAt(p.k, M); return { roof: h ? +h.point.y.toFixed(2) : null, y: p.y, put: +(M.elements[13] - p.y).toFixed(2) }; });
    return { water: !!r.W.mesh.parent, wy: r.W.mesh.position.y, wid: r.W.mesh.id, skin: !!(r.skin && r.skin.parent === v.bodyG), body: v.body.visible, people: r.crowd.g.children[0].count, feet, ring: !!r.ring.parent && !r.ring.visible }; });
  T.check('the flood (a plane at 1.55 m), the amphibian (its own body, the MEDVED\'s hidden), 8 people, the ring kept hidden', S.water && Math.abs(S.wy - 1.55) < 0.05 && S.skin && !S.body && S.people === 8 && S.ring, JSON.stringify({ water: S.water, wy: S.wy, skin: S.skin, body: S.body, people: S.people }));
  T.check('every person standing on a roof (a ray down hits the roof at their feet, the roof over the water)', S.feet.every(f => f.roof != null && Math.abs(f.roof - f.y) < 0.12 && f.y > 4 && f.put < 0 && f.put > -0.35), JSON.stringify(S.feet));
  // to the first house, stopped: VRZI OBROČ shown; a tap on it: the ring flies, the person down the line onto the deck
  let res = await drive(page, { n: 900, stopAtBtn: true });
  await page.waitForTimeout(400);   // (the tags follow the camera: a frame or two drawn)
  s = await st(page);
  T.check('stopped by the first house: VRZI OBROČ shown, POMOČ! over the roof', res === 'btn' && s.btn && s.tags >= 1 && /POMOČ!/.test(s.tagText), JSON.stringify({ res, btn: s.btn, tags: s.tags, tag: s.tagText }));
  await page.tap('#mis-btn');
  const fly = await page.evaluate(() => { const g = window.__game, r = Missions.run; let seen = false, line = false;
    for (let k = 0; k < 80 && r.aboard < 1; k++) { g.sim(0.05, false, 0, 0, 1); if (r.act && r.ring.visible) seen = true; if (r.act && r.line.visible) line = true; }
    const p = r.who[0], M = new THREE.Matrix4(); r.crowd.g.children[0].getMatrixAt(p.k, M);
    const P = r.P, lx = (M.elements[12] - P.x) * Math.cos(P.h) + (M.elements[14] - P.z) * Math.sin(P.h), lz = -(M.elements[12] - P.x) * Math.sin(P.h) + (M.elements[14] - P.z) * Math.cos(P.h);
    return { seen, line, aboard: r.aboard, at: p.at, lx: +lx.toFixed(2), lz: +lz.toFixed(2), dy: +(M.elements[13] - (P.roadY + r.skin.position.y)).toFixed(2), btn: r.btn.shown }; });
  T.check('the tap: the ring flies, the line, the person on the amphibian\'s deck (over its hull, on the open deck behind the cab)', fly.seen && fly.line && fly.aboard === 1 && fly.at === 'aboard' && Math.abs(fly.lx) < 2.3 && Math.abs(fly.lz) < 1 && fly.dy > 1.1 && fly.dy < 1.4, JSON.stringify(fly));
  // afloat in the deep water of the soi: the hull up, its waterline on its side
  const fl = await page.evaluate(() => { const r = Missions.run; return { depth: r.depth, lift: r.skin.position.y, K: r.def.K.WL }; });
  T.check('afloat: the hull up by the depth less its waterline', Math.abs(fl.lift - Math.max(0, fl.depth - fl.K)) < 0.05 && fl.lift > 0, JSON.stringify(fl));
  // the rest: every house in turn, then the dry ground
  for (let k = 0; k < 12 && res !== 'win' && res !== 'fail'; k++) res = await drive(page, { n: 400, auto: true });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('all 8 on the dry ground at the hairpin: done (in under 6 minutes for the driver)', s.run.end === 'win' && s.run.saved === 8 && /MISIJA OPRAVLJENA/.test(s.res) && s.rows[0] === 'REŠENI 8 / 8' && s.run.t < 360, JSON.stringify({ run: s.run, res: s.res, rows: s.rows }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((id) => ({ water: !Render.scene.getObjectById(id), btn: !document.getElementById('mis-btn'), tags: !document.getElementById('mis-tags') }), S.wid);
  T.check('back to the title: the water, the button and the tags gone', gone.water && gone.btn && gone.tags, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
