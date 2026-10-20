// The KOLIBRI's crashes (the user's; on a real track, Bathurst, the field held still, the player's car knocked by hand with Core.applyDamage
// at today's typical size, 0.01, as its knockK makes it): Razbijanje · nov način (xBody, xGlass) on:
// 1. every crash at least one pane a stage on (render.js xtMin): eight light crashes on the nose 0.6 s apart, a stage each (the windscreen
//    to broken, then a side window), never the rear window; two blows 0.1 s apart (one crash) one stage; a light one on the left flank a
//    left pane only; from behind the rear window
// 2. a blow on a new place a dent you see (xDent: XT_DENT at least), again there no deeper than its own amount takes it
// 3. the side scrapes (xtScrape, XT_SCR in the body's shader): each graze on a flank (another car's contact there; along the barrier) more
//    scratched on that side and dented in a little more there (the body's points on that side pushed in further each time, by less each
//    time: fifteen in one place under 13 cm), the other side untouched, a contact on the nose none, a person on foot's (the core's contact
//    point left as it was) none; a repair polishes them out
// 4. the roof (what the camera behind the car sees most): caved in more with every 10 % of damage from the first (core.js roofOf: the
//    Kolibri's roof0 0; render.js: the roof field, its roofDmg rise a share of what is left (kind 3); the default body's the same field,
//    xtRoof), never through the seats, the driver or the posts' tops (the field's limits, xRoofInfo); variant D (the user's): three light
//    blows on the right flank draw the roof's right side in towards the middle (1 cm and more), more than its left
// and with the default settings (no Razbijanje): the scrapes and the roof the same, no table; the MEDVED (a table car, not the Kolibri) with glass on:
// a light blow breaks no pane, no scrapes (the Kolibri's only)
//   node tests/browser/kolibri.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('KOLIBRI: a pane each crash, a dent you see, the side scrapes');
const srv = await serve();
const browser = await launch();
try {
  const run = async (car, settings) => {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', Object.assign({ quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, damage: 2, weather: 'dry' }, settings), { width: 640, height: 360 }, { seed: 7 });
    await page.evaluate((id) => { window.__game.S.car = Core.MODELS.findIndex(m => m.id === id); }, car);
    await startTrack(page, 'bathurst');
    const r = await page.evaluate(() => {
      const g = window.__game, R = g.race, P = R.player; g.pause(); for (let i = 0; i < 400 && R.state !== 'racing'; i++) g.sim(0.05, true); g.sim(6, true);
      for (const c of R.cars) if (c !== P && Math.hypot(c.x - P.x, c.z - P.z) < 30) { c.x -= Math.cos(P.h) * 60; c.z -= Math.sin(P.h) * 60; c.px = c.x; c.pz = c.z; }
      // (the race on, the field held still, a frame every 0.1 s: the renderer's clock, whose 0.35 s is one crash)
      const hold = (sec) => { for (let i = 0; i < Math.round(sec * 10); i++) { for (let k = 0; k < 12; k++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; R.step(1 / 120); } Render.frame(0.1, 1, P, 'chase', {}); } };
      const fresh = () => { R.repairCar(P); hold(0.3); };   // (the view built afresh: no glass broken, no dents, no scrapes)
      const me = () => Render.crashInfo().cars.find(q => q.player), v = () => Render.viewOf(P);
      const panes = () => { const x = me().xt; return x ? Object.assign({}, x.panes) : null; }, sum = (p) => p ? Object.values(p).reduce((a, b) => a + (b > 0 ? [0, 0.5, 0.7, 0.75, 1].indexOf(b) : 0), 0) : 0;
      const scr = () => v().xtSc ? v().xtSc.a.map(q => +q.toFixed(4)) : [0, 0];
      // (how far the body's points have moved from where they were (b0), on its left and on its right: the flank's dent)
      let b0 = null; const base = () => { b0 = v().body.geometry.attributes.position.array.slice(); }, moved = () => { const a = v().body.geometry.attributes.position.array, o = [0, 0]; if (!b0 || a.length !== b0.length) return [-1, -1];
        for (let i = 0; i < a.length; i += 3) { const m = Math.hypot(a[i] - b0[i], a[i + 1] - b0[i + 1], a[i + 2] - b0[i + 2]); o[b0[i + 2] < 0 ? 0 : 1] += m; } return o.map(q => +q.toFixed(3)); };
      const most = () => { const a = v().body.geometry.attributes.position.array; let mx = 0; if (b0 && a.length === b0.length) for (let i = 0; i < a.length; i += 3) mx = Math.max(mx, Math.hypot(a[i] - b0[i], a[i + 1] - b0[i + 1], a[i + 2] - b0[i + 2])); return +mx.toFixed(4); };   // (the farthest any point moved)
      const knock = (amt, u, w) => Core.applyDamage(P, amt, u * P.m.len / 2, w * P.m.wid / 2);
      const out = { key: v().body.material.customProgramCacheKey(), xt: !!me().xt };
      hold(0.5); fresh();
      out.nose = []; for (let k = 0; k < 8; k++) { knock(0.01, 1, 0.1); hold(0.6); out.nose.push(panes()); }
      fresh(); knock(0.01, 0.1, -1); hold(0.1); knock(0.01, 0.1, -1); hold(0.6); out.one = panes();
      fresh(); knock(0.01, -0.1, -1); hold(0.6); out.left = panes();
      fresh(); knock(0.01, -1, 0); hold(0.6); out.rear = panes();
      fresh(); const cl = () => (me().cl || []).map(K => K.d); base();
      knock(0.01, 0.6, 1); hold(0.6); const d1 = cl(), m1 = most(); knock(0.01, 0.6, 1); hold(0.6); const d2 = cl(); out.dent = { d1, d2, m1, amt: v().xc ? v().xc.cl.map(K => K.A) : [] };
      // the grazes: another car on the left flank (its contact point there, as the core leaves it), three times 0.5 s apart, then one on the nose
      fresh(); base(); const touch = (lx, lz) => { for (let f = 0; f < 2; f++) { const ch = Math.cos(P.h), sh = Math.sin(P.h); P.fxCar = 3; P.contactX = P.x + ch * lx - sh * lz; P.contactZ = P.z + sh * lx + ch * lz; Render.frame(0.05, 1, P, 'chase', {}); } hold(0.5); return scr(); };
      out.car = [scr()]; out.carD = [moved()]; for (let k = 0; k < 3; k++) { out.car.push(touch((k - 1) * 0.3, -P.m.wid / 2)); out.carD.push(moved()); }
      out.nose2 = touch(P.m.len / 2, 0); out.nose2D = moved(); out.carN = v().xtSc ? v().xtSc.n.slice() : null;
      // (a person on foot leaves the core's contact point as it was: fxCar on, the point the last one's: no graze)
      { const s0 = scr(); P.fxCar = 2; Render.frame(0.05, 1, P, 'chase', {}); hold(0.5); out.stale = [s0, scr()]; }
      // (twelve more grazes on the left, round one place: each a little deeper, never caved in)
      for (let k = 0; k < 12; k++) touch((k % 2) * 0.04, -P.m.wid / 2); out.many = most();
      // along the barrier: the car put against the rail (1 cm off it), driven along it at 14 m/s for 0.4 s, then back on the road, three times
      fresh(); base(); const Tk = R.track, q = Tk.query(P.x, P.z, P.q ? P.q.i : 0, {}), i = q.i, tx = Tk.tx[i], tz = Tk.tz[i], h = Math.atan2(tz, tx), nx = Tk.nx[i], nz = Tk.nz[i];
      out.railK = (-Math.sin(h) * nx + Math.cos(h) * nz) > 0 ? 1 : 0; out.rail = [scr()]; out.railD = [moved()];
      for (let k = 0; k < 3; k++) {
        const dd = Tk.br[i] - P.m.wid / 2 - 0.01; P.place(Tk.px[i] + nx * dd, Tk.pz[i] + nz * dd, h); P.q = Tk.query(P.x, P.z, i, P.q);
        for (let f = 0; f < 8; f++) { for (let s = 0; s < 6; s++) { P.vx = tx * 14 + nx * 0.4; P.vz = tz * 14 + nz * 0.4; P.w = 0; P.inThr = 0.3; P.inBrk = 0; P.inSteer = 0; R.step(1 / 120); } Render.frame(0.05, 1, P, 'chase', {}); }
        P.place(Tk.px[i], Tk.pz[i], h); P.q = Tk.query(P.x, P.z, i, P.q); hold(0.6); out.rail.push(scr()); out.railD.push(moved());
      }
      out.dmg = P.dmg; R.repairCar(P); hold(0.3); out.after = scr();
      // variant D: three light blows on the right flank, the roof's sides drawn in (xRoofInfo's pull: left, right) and lowered (rail)
      fresh(); for (let k = 0; k < 3; k++) { knock(0.02, 0, 1); hold(0.6); } { const f = me().rf || me().rfD; out.side = f ? { pull: f.pull, rail: f.rail } : null; }
      // the roof (what the camera behind the car sees most) by the damage: blows on the flanks and the ends, the car to 10 %, 20 % ... 90 %;
      // the roof's top (its points over 88 % of the body's height) lower on average each time; then the field's own checks (its limits)
      fresh(); base(); { const a0 = b0, top = []; let yM = -1e9; for (let i = 1; i < a0.length; i += 3) yM = Math.max(yM, a0[i]); for (let i = 1; i < a0.length; i += 3) if (a0[i] > 0.88 * yM) top.push(i);
        const drop = () => { const a = v().body.geometry.attributes.position.array; let s = 0; for (const i of top) s += a0[i] - a[i]; return +(s / Math.max(1, top.length)).toFixed(4); };
        const at = [[1, 0.2], [0.2, -1], [-1, -0.2], [-0.2, 1]]; out.roof = []; let n = 0;
        for (let p = 1; p <= 9; p++) { while (P.dmg < p / 10 - 1e-9) { const [u, w] = at[n++ % 4]; knock(Math.min(0.05, p / 10 - P.dmg), u, w); hold(0.6); } out.roof.push(drop()); } out.roofN = top.length; out.roofDmg = +P.roofDmg.toFixed(3);
        const f = me().rf || me().rfD; out.rfI = f ? { over: f.over, flip: f.flip, clear: f.clear, clear0: f.clear0, clearL: f.clearL, clearF: f.clearF, obsUp: f.obsUp, pull: f.pull } : null; }
      R.repairCar(P); hold(0.3); out.nan = [...scr(), P.x, P.z].some(x => !Number.isFinite(x));
      return out;
    });
    await ctx.close();
    return Object.assign(r, { errors });
  };
  const inc = (L) => L.every((q, j) => j === 0 || q > L[j - 1] + 0.02);   // (each more than the last, by a graze's worth)
  const st = (p) => (p && Object.entries(p).filter(([, f]) => f > 0).map(([k, f]) => k + ':' + f).join(' ')) || 'none';

  const x = await run('kolibri', { xBody: 1, xGlass: 1 });
  console.log('nov način:', JSON.stringify({ key: x.key, nose: x.nose.map(st), one: st(x.one), left: st(x.left), rear: st(x.rear), dent: x.dent, car: x.car, carD: x.carD, nose2: x.nose2, nose2D: x.nose2D, carN: x.carN, rail: x.rail, railD: x.railD, railK: x.railK, after: x.after }));
  const steps = x.nose.map(p => Object.values(p).reduce((a, b) => a + (b > 0 ? [0, 0.5, 0.7, 0.75, 1].indexOf(b) : 0), 0));
  T.check('nov način: the Kolibri\'s body its own program (the table\'s cut and the scrapes: dirtyCarCgXS)', x.key === 'dirtyCarCgXS' && x.xt, x.key);
  T.check('nov način: every light crash on the nose a pane a stage on: the windscreen 0.5, 0.7, 0.75, 1, then a side window; never the rear window',
    steps.every((n, j) => n === j + 1) && x.nose.slice(0, 4).map(p => p.W).join() === '0.5,0.7,0.75,1' && x.nose.every(p => p.R === 0) && x.nose[7].W === 1, x.nose.map(st).join(' | '));
  T.check('nov način: two blows 0.1 s apart are one crash: one pane one stage', st(x.one).split(' ').length === 1 && Object.values(x.one).filter(f => f > 0).every(f => f === 0.5), st(x.one));
  T.check('nov način: a light blow on the left flank: a left pane, nothing on the right, not the rear window', st(x.left) !== 'none' && Object.entries(x.left).every(([k, f]) => !f || (k.length === 2 && k[1] === 'L')), st(x.left));
  T.check('nov način: a light blow from behind: the rear window', x.rear.R === 0.5 && st(x.rear) === 'R:0.5', st(x.rear));
  T.check('nov način: a light blow on a new place a dent you see (its cluster 4 cm deep, a point pushed in 2 cm and more), again there only as deep as its own amount takes it (less than the first)',
    x.dent.d1.length === 1 && x.dent.d1[0] >= 0.04 && x.dent.m1 >= 0.02 && x.dent.d2.length === 1 && x.dent.d2[0] > x.dent.d1[0] && x.dent.d2[0] - x.dent.d1[0] < x.dent.d1[0], JSON.stringify(x.dent));
  T.check('nov način: every graze by another car on the left flank more scratched there, the right side untouched; a contact on the nose none',
    inc(x.car.map(q => q[0])) && x.car.every(q => q[1] === 0) && x.carN && x.carN[0] === 3 && x.nose2[0] === x.car[3][0] && x.nose2[1] === 0, JSON.stringify({ car: x.car, nose: x.nose2, n: x.carN }));
  T.check('nov način: every scrape along the barrier more scratched on the side against it, the other side untouched',
    inc(x.rail.map(q => q[x.railK])) && x.rail.every(q => q[1 - x.railK] === 0), JSON.stringify({ rail: x.rail, side: x.railK }));
  const dentIn = (r) => inc(r.carD.map(q => q[0])) && r.carD.every(q => q[1] < 0.05) && r.nose2D[0] === r.carD[3][0] && inc(r.railD.map(q => q[r.railK])) && r.railD.every(q => q[1 - r.railK] < 0.05)
    && r.stale[1][0] === r.stale[0][0] && r.many > 0.02 && r.many < 0.13;   // (a stale contact point no graze; fifteen grazes round one place under 13 cm in all)
  T.check('nov način: every graze dents that flank in a little more (its points pushed in further each time), the other side not; a contact on the nose none, a person on foot\'s (the contact point as it was) none; fifteen grazes in one place never cave it in (under 13 cm)', dentIn(x), JSON.stringify({ car: x.carD, nose: x.nose2D, rail: x.railD, stale: x.stale, many: x.many }));
  const roofIn = (r) => r.roof.length === 9 && r.roof[0] > 0.003 && r.roof.every((q, j) => j === 0 || q > r.roof[j - 1] + 0.002) && r.roof[8] > 0.08;
  T.check('nov način: the roof caved in more with every 10 % of damage, from the first (10 % to 90 %; 8 cm and more at 90 %)', roofIn(x), JSON.stringify({ roof: x.roof, n: x.roofN, roofDmg: x.roofDmg }));
  // (variant D: the hit side drawn in towards the middle; the field's limits: nothing past its limit, no facet over, the roof 5 mm (or as near
  // as built) over the seats and the driver, the headliner too, the posts' tops under it, nothing in the way lifted)
  const sideIn = (r) => !!r.side && r.side.pull[1] >= 0.01 && r.side.pull[1] > r.side.pull[0] + 0.005 && r.side.rail[1] > 0;
  const rfOk = (r) => !!r.rfI && r.rfI.over === 0 && r.rfI.flip === 0 && (r.rfI.clear === null || r.rfI.clear >= Math.min(0.005, r.rfI.clear0) - 1e-4) && (r.rfI.clearL === null || r.rfI.clearL >= 0)
    && (r.rfI.clearF === null || r.rfI.clearF >= -1e-4) && r.rfI.obsUp <= 1e-5 && r.rfI.pull.every(q => q >= 0.03);
  T.check('nov način: three light blows on the right flank draw the roof\'s right side in towards the middle (1 cm and more), more than its left (variant D)', sideIn(x), JSON.stringify(x.side));
  T.check('nov način: at 90 % the roof drawn in from both sides (3 cm and more), never past its limits: no facet over, over the seats and the driver, the headliner too, the posts\' tops under it', rfOk(x), JSON.stringify(x.rfI));
  T.check('nov način: a repair polishes the scrapes out; nothing NaN, no page errors', x.after[0] === 0 && x.after[1] === 0 && !x.nan && !x.errors.length, x.errors.slice(0, 3).join(' | '));

  const d = await run('kolibri', {});
  console.log('default:', JSON.stringify({ key: d.key, xt: d.xt, nose: d.nose.map(st), car: d.car, carD: d.carD, rail: d.rail, railD: d.railD, after: d.after }));
  T.check('default settings: the Kolibri\'s side scrapes all the same (dirtyCarCgS), no table, its panes as before (no stage)', d.key === 'dirtyCarCgS' && !d.xt && d.nose.every(p => p === null), d.key);
  T.check('default settings: every graze more scratched on its side, along the barrier too; repaired: none', inc(d.car.map(q => q[0])) && d.car.every(q => q[1] === 0) && inc(d.rail.map(q => q[d.railK])) && d.after.every(q => q === 0) && !d.errors.length,
    JSON.stringify({ car: d.car, rail: d.rail }) + ' ' + d.errors.slice(0, 3).join(' | '));

  T.check('default settings: the roof caved in more with every 10 % of damage, from the first (its roof field, xtRoof; 8 cm and more at 90 %)', roofIn(d), JSON.stringify({ roof: d.roof, n: d.roofN, roofDmg: d.roofDmg }));
  T.check('default settings: three light blows on the right flank draw the roof\'s right side in towards the middle, more than its left (variant D)', sideIn(d), JSON.stringify(d.side));
  T.check('default settings: at 90 % the roof drawn in from both sides, never past its limits (the seats never through it: its roof field, xtRoof)', rfOk(d), JSON.stringify(d.rfI));
  T.check('default settings: every graze dents that flank in a little more, the other side not; never caved in (under 13 cm)', dentIn(d), JSON.stringify({ car: d.carD, nose: d.nose2D, rail: d.railD, stale: d.stale, many: d.many }));

  const m = await run('medved', { xBody: 1, xGlass: 1 });
  console.log('medved:', JSON.stringify({ key: m.key, nose: m.nose.map(st), car: m.car }));
  T.check('the Kolibri\'s only: the MEDVED (a table car too) with glass on: a light blow breaks no pane, no scrapes, its body\'s program as before (dirtyCarCgX)',
    m.key === 'dirtyCarCgX' && m.nose.every(p => st(p) === 'none') && m.car.every(q => q[0] === 0 && q[1] === 0) && !m.errors.length, m.key + ' ' + m.errors.slice(0, 3).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
