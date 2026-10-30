// Special mission 48 · Narasla reka (js/missions/m48.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=48
// on Longford in the rain, the rescue truck (the KAMEN's physics, its own body), started at s 1100 on the way down to the river flats; the
// panel (VODA DO MOSTU, EVAKUIRANI, MOST ZDRŽI, PLAVJE), no timing tower; the flood (the world's river water on the kit's plane), the logs
// on it, the farm's house on the ground, its people standing at the road's edge, the race's spectators hidden; stopped at the farm: they
// board, ODPELJI shown, a tap on it: off with two, the riders on the flatbed (in the truck's frame); a driver (its own steering: the
// wrong way too) shuttles everybody over the bridge to the town, the truck turned round by the crew at each end (no fall, no jump: its
// height kept), no NAPAČNA SMER and no Na progo on the way back; all 9 in the town: done. Back to the title: the water, the logs, the
// button and the tags gone, the spectators and the world's river water back. No errors on the page.
//   node tests/browser/m48.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m48');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, P = R.player, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: P.m.id, rain: R.rain, s: P.q.s, run: r && { end: r.end, why: r.why, farm: r.farm, aboard: r.aboard, safe: r.safe, stage: r.stage, t: r.t }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], tower: vis('#tw-strip') || vis('#h-tower'),
    btn: vis('#mis-btn'), tags: [...document.querySelectorAll('#mis-tags i')].map(e => e.innerText.replace(/\s+/g, ' ')), wrong: vis('#h-msg') && /NAPAČNA/.test(document.getElementById('h-msg').textContent), rescue: vis('#btn-rescue'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
// the driver: to the farm while there is room on the truck and people there, else to the town; its own steering toward the road's centre
// ahead in the way it goes (back to the farm: the wrong way), slow over the bridge with people on the back, stopped at the place; held
// while they board or climb down and while the crew turns it; opt.until(r): stop there
const drive = (page, opt) => page.evaluate((opt) => { const g = window.__game, r = Missions.run, K = r.def.K, T = g.race.track, until = opt.until ? new Function('r', 'return ' + opt.until) : () => false;
  for (let k = 0; k < opt.n && !r.end; k++) {
    if (until(r)) return 'until';
    const P = r.P, s = P.q.s, v = Math.hypot(P.vx, P.vz);
    if (r.stage === 'load' || r.stage === 'drop' || r.stage === 'turn') { const y0 = P.y; g.sim(0.1, false, 0, 0, 1); window.__m48y = Math.max(window.__m48y || 0, Math.abs(P.y - y0)); continue; }
    if (r.aboard === 0) window.__m48town = false; else if (r.stage === 'go' || r.aboard >= K.CAP || r.farm === 0) window.__m48town = true;   // (off from the farm: to the town)
    const goal = window.__m48town ? K.TOWN : K.FARM;
    const ds = goal - s, dir = Math.sign(ds) || 1, i = T.idx(s + dir * (8 + v * 0.8));
    const dx = T.px[i] - P.x, dz = T.pz[i] - P.z, lx = dx * Math.cos(P.h) + dz * Math.sin(P.h), ly = -dx * Math.sin(P.h) + dz * Math.cos(P.h);
    const steer = Math.max(-1, Math.min(1, Math.atan2(ly, lx) * 2.2)), slow = r.aboard > 0 && s > K.BR[0] - 25 && s < K.BR[1] + 5;
    const vt = Math.min(21, slow ? K.VBR * 0.85 : 99, Math.sqrt(2 * 2.2 * Math.max(0, Math.abs(ds) - 4)));
    let thr = 0, brk = 0; if (Math.abs(ds) < 5) brk = 1; else if (v < vt) thr = 0.8; else if (v > vt + 1) brk = 0.6;
    g.sim(0.1, false, steer, thr, brk);
  }
  return r.end || 'n'; }, opt);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=48', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=48: Longford in the rain, the rescue truck (the KAMEN), at s 1100', s.track === 'longford' && s.car === 'kamen' && s.rain > 0.5 && Math.abs(s.s - 1100) < 3, JSON.stringify({ track: s.track, car: s.car, rain: s.rain, s: s.s }));
  T.check('the panel: VODA DO MOSTU 207 cm, EVAKUIRANI 0 / 9, MOST ZDRŽI še 08:40, PLAVJE pod mostom; no timing tower', s.rows[0] === 'VODA DO MOSTU 207 cm' && s.rows[1] === 'EVAKUIRANI 0 / 9' && s.rows[2] === 'MOST ZDRŽI še 08:40' && s.rows[3] === 'PLAVJE pod mostom' && !s.tower, JSON.stringify(s.rows));
  // the scene: the flood (the world's river water), the logs on it, the house on the ground, the people at the road, the truck's body
  const S = await page.evaluate(() => { const r = Missions.run, v = Render.viewOf(r.P), W = Render.world, M = new THREE.Matrix4();
    let crowds = 0, shown = 0; W.root.traverse(o => { if (o.name === 'crowds') { crowds++; if (o.visible) shown++; } });
    const feet = r.who.map(p => { r.crowd.g.children[0].getMatrixAt(p.k, M); const x = M.elements[12], y = M.elements[13], z = M.elements[14]; return +(y + 0.28 - W.groundH(x, z)).toFixed(2); });
    const H = r.H.g, c = Math.cos(H.rotation.y), sn = Math.sin(H.rotation.y), corners = [[5.5, 4], [-5.5, 4], [5.5, -4], [-5.5, -4], [0, 0]].map(([x, z]) => W.groundH(H.position.x + x * c + z * sn, H.position.z - x * sn + z * c) - H.position.y);
    const logs = []; for (let k = 0; k < r.logs.length; k++) { const L = r.logs[k]; if (L.d - r.def.K.LOGR[0] < 25 || r.def.K.LOGR[1] - L.d < 25) continue; r.logM.getMatrixAt(k, M); logs.push(+(M.elements[13] - r.lvl).toFixed(2)); }
    return { water: !!r.W.mesh.parent, wy: +r.W.mesh.position.y.toFixed(2), wid: r.W.mesh.id, river: r.W.mesh.material.type === 'MeshPhongMaterial' && r.W.mesh.material.color.getHex() === 0x46503a, logId: r.logM.id, logs,
      skin: !!(r.skin && r.skin.parent === v.bodyG), body: v.body.visible, ride: r.ride.g.parent === r.skin, feet, corners: corners.map(x => +x.toFixed(2)), crowds, shown }; });
  T.check('the flood: the world\'s river water on the plane, at the start level; the logs floating on it', S.water && Math.abs(S.wy + 29.4) < 0.05 && S.river && S.logs.length >= 3 && S.logs.every(y => y > -0.05 && y < 0.15), JSON.stringify({ wy: S.wy, river: S.river, logs: S.logs }));
  T.check('the truck: its own body (the KAMEN\'s hidden), the riders\' crowd in its frame', S.skin && !S.body && S.ride, JSON.stringify({ skin: S.skin, body: S.body, ride: S.ride }));
  T.check('the house on the ground (none of it floating, buried under 1.2 m), the 9 people standing on the ground', S.corners.every(d => d >= -0.05 && d < 1.2) && S.feet.length === 9 && S.feet.every(d => Math.abs(d) < 0.12), JSON.stringify({ corners: S.corners, feet: S.feet }));
  T.check('the race\'s spectators hidden', S.crowds > 0 && S.shown === 0, JSON.stringify({ crowds: S.crowds, shown: S.shown }));
  // to the farm: stopped, they board; ODPELJI shown; a tap on it with two on board
  let res = await drive(page, { n: 900, until: 'r.aboard >= 2' });
  await page.waitForTimeout(400);
  s = await st(page);
  T.check('stopped at the farm: two on board, ODPELJI shown, the tag over the people', res === 'until' && s.run.stage === 'load' && s.btn && s.tags.some(t => /ŠE 7 LJUDI/.test(t)), JSON.stringify({ res, run: s.run, btn: s.btn, tags: s.tags }));
  await page.tap('#mis-btn');
  await page.waitForFunction(() => Missions.run.stage !== 'load', null, { timeout: 10000 });
  const R1 = await page.evaluate(() => { const r = Missions.run, M = new THREE.Matrix4(), seats = []; for (let k = 0; k < r.def.K.CAP; k++) { r.ride.g.children[0].getMatrixAt(k, M); seats.push(M.elements.slice(12, 15).map(x => +x.toFixed(2))); } return { aboard: r.aboard, farm: r.farm, stage: r.stage, seats }; });
  T.check('the tap: off with two; the two standing on the flatbed (in the truck\'s frame), the other places empty', R1.aboard === 2 && R1.farm === 7 && R1.seats.slice(0, 2).every(p => p[0] < 0 && p[0] > -3 && Math.abs(p[1] - 1.22) < 0.01 && Math.abs(p[2]) < 1) && R1.seats.slice(2).every(p => p[1] === 0), JSON.stringify(R1));
  // over the bridge to the town, they climb down, the truck turned round; on the way back (the wrong way): no NAPAČNA SMER, no Na progo
  res = await drive(page, { n: 1500, until: 'r.safe >= 2 && r.stage === \'drive\' && r.P.q.s < 1700' });
  const turned = await page.evaluate(() => { const r = Missions.run, P = r.P, T = window.__game.race.track; return { back: Math.cos(P.h - T.hd[T.idx(P.q.s)]) < -0.9, y: +(P.y - P.roadY).toFixed(2), jump: window.__m48y || 0 }; });
  T.check('down in the town, turned round by the crew: back toward the farm, on the road (no fall, no jump while turning)', res === 'until' && turned.back && Math.abs(turned.y) < 0.3 && turned.jump < 0.3, JSON.stringify({ res, turned }));
  await page.evaluate(() => window.__game.sim(1, false, 0, 1, 0)); await page.waitForTimeout(1500);
  s = await st(page);
  T.check('the way back (the wrong way): no NAPAČNA SMER, no Na progo', !s.wrong && !s.rescue, JSON.stringify({ wrong: s.wrong, rescue: s.rescue, s: s.s }));
  // the rest: everybody to the town
  res = await drive(page, { n: 6000 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('all 9 in the town: done', s.run.end === 'win' && s.run.safe === 9 && /MISIJA OPRAVLJENA/.test(s.res) && s.rows[1] === 'EVAKUIRANI 9 / 9', JSON.stringify({ run: s.run, res: s.res, rows: s.rows }));
  T.check('no jump of the truck while held or turned', (await page.evaluate(() => window.__m48y || 0)) < 0.3);
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate(([w, l]) => { let shown = 0, crowds = 0, river = null; Render.world.root.traverse(o => { if (o.name === 'crowds') { crowds++; if (o.visible) shown++; } if (o.isMesh && o.material && o.material.color && o.material.color.getHex && o.material.color.getHex() === 0x46503a) river = o; });
    return { water: !Render.scene.getObjectById(w), logs: !Render.scene.getObjectById(l), btn: !document.getElementById('mis-btn'), tags: !document.getElementById('mis-tags'), crowds: crowds === shown, river: !!river && !!river.parent }; }, [S.wid, S.logId]);
  T.check('back to the title: the water, the logs, the button and the tags gone; the spectators back, the world\'s river water kept', gone.water && gone.logs && gone.btn && gone.tags && gone.crowds && gone.river, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
