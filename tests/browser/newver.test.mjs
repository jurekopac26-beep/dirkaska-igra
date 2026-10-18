// NEW VERSION · TEST 1 (the title's button, js/game.js nvStart, js/newmap.js): the button top right on the title (upright and on its side),
// a tap starts Toskana alone with the new map built over it (no rivals, no lights, no laps to count), the car at HOME (where a mission ends) driving freely past
// the road's barriers, on the new map's ground (the snow hill), up to the map's edge; the walls of fence the car pushes; the garages' menus on their coloured floors
// (js/nvmenu.js: the driving school's licences, four levels of three tasks, a task's START, the others' choices and START say V IZDELAVI, HOME's box Garaža v izdelavi);
// back to the title the page loads again.
//   node tests/browser/newver.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('newver');
const srv = await serve();
const browser = await launch();
const PAGE = srv.base + '/index.html';
try {
  const open = (vp) => openGame(browser, PAGE, { intro: 2, quali: 0 }, vp, { menu: true });
  const ready = (page) => page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
  const box = (page) => page.evaluate(() => { const r = document.getElementById('menu-host').shadowRoot, b = r.querySelector('[data-act="newver"]'), l = r.querySelector('.logo'); if (!b) return null; const q = b.getBoundingClientRect(), lq = l.getBoundingClientRect(); return { x: q.x, y: q.y, r: q.right, b: q.bottom, lr: lq.right, lb: lq.bottom, W: innerWidth, H: innerHeight, txt: b.textContent }; });

  // 1. the button: on the title, top right, inside the screen, clear of the logo (a small phone upright and on its side)
  for (const vp of [{ width: 360, height: 640 }, { width: 640, height: 360 }]) {
    const { ctx, page, errors } = await open(vp);
    await ready(page); await page.waitForTimeout(400);
    const b = await box(page);
    T.check(`${vp.width}x${vp.height}: NEW VERSION · TEST 1 on the title, top right, inside the screen and clear of the logo`, !!b && /NEW VERSION/.test(b.txt) && /TEST 1/.test(b.txt) && b.x > b.W / 2 && b.r <= b.W && b.y >= 0 && b.b < b.H / 2 && (b.x >= b.lr || b.y >= b.lb), JSON.stringify(b));
    T.check(`${vp.width}x${vp.height}: no errors on the title`, !errors.length, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // 2. a tap: Toskana alone, the new map, free driving from HOME
  {
    const { ctx, page, errors } = await open({ width: 412, height: 915 });
    await ready(page);
    await page.evaluate(() => document.getElementById('menu-host').shadowRoot.querySelector('[data-act="newver"]').click());
    const t0 = Date.now();
    // the wait screen: the new map's picture behind it (not the track's view), a bar at the bottom that fills as the map is built
    const ws = await page.waitForFunction(() => { const b = document.getElementById('nv-load'), i = b && b.querySelector('#nv-bar'); if (!i) return null; const r = i.parentNode.getBoundingClientRect(); return { bg: b.style.backgroundImage, bottom: innerHeight - r.bottom, w: r.width, W: innerWidth, pct: (b.querySelector('#nv-pct') || {}).textContent }; }, null, { timeout: 300000, polling: 50 }).then(h => h.jsonValue());
    await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 300000, polling: 500 });
    const st = await page.evaluate(() => (window.__nvT || []).map(t => t[0]));
    T.check('the wait screen: the new map\'s picture behind it, a bar at the bottom, filled step by step as the map is built (30 steps and more)', /newmap-load\.webp/.test(ws.bg) && ws.bottom >= 0 && ws.bottom < 80 && ws.w > ws.W * 0.5 && /%/.test(ws.pct) && st.length > 30 && st[st.length - 1] === 'bake', JSON.stringify({ ...ws, steps: st.length }));
    const o = await page.evaluate(() => { const g = window.__game, R = g.race, P = R.player, T = R.track; return { id: T.def.id, cars: R.cars.length, ground: typeof T.ground2 === 'function', free: !!T.free, mk: !!(window.MK && window.MK.hub4), x: P.x, z: P.z, hud: document.getElementById('hud').classList.contains('nv') }; });
    T.check('the tap starts Toskana alone (no rivals), the new map built (window.MK, the ground, no barriers), driving straight away (no lights)', o.id === 'toskana' && o.cars === 1 && o.ground && o.free && o.mk && o.hud, JSON.stringify(o) + ' in ' + (Date.now() - t0) + ' ms');
    const hm = await page.evaluate(() => { const H = window.__H3.home, P = window.__game.race.player; return { x: H.x, z: H.z, h: P.h }; });
    const car = await page.evaluate(() => { const m = window.__game.race.player.m; return { id: m.id, name: m.name }; });
    T.check('the new map starts in the MEDVED 4x4', car.id === 'medved', JSON.stringify(car));
    T.check('the car starts at HOME (on the dirt road south of the start straight, where a mission ends), facing the track', Math.hypot(o.x - hm.x, o.z - hm.z) < 1 && Math.abs(hm.x + 8) < 6 && hm.z > 185 && hm.z < 215 && Math.sin(hm.h) < -0.8, JSON.stringify({ ...o, home: hm }));
    // free driving: a few seconds of throttle move the car; off the road it is not stopped by the barriers
    const d = await page.evaluate(() => { const g = window.__game, P = g.race.player, x0 = P.x, z0 = P.z; g.sim(3, false); return Math.hypot(P.x - x0, P.z - z0); });
    T.check('throttle: the car drives off', d > 5, d.toFixed(1) + ' m');
    const f = await page.evaluate(() => { const g = window.__game, P = g.race.player, T = g.race.track; P.place(40, 20, 0); P.vx = P.vz = 0; g.sim(1.5, false); return { x: P.x, z: P.z, q: P.q.d, w: T.w }; });
    T.check('in the infield, far from the road, the car drives on (no barrier pulls it back)', Math.abs(f.q) > f.w + 20 && Math.hypot(f.x - 40, f.z - 20) > 2, JSON.stringify(f));
    // no sparks off the road: the renderer's rail sparks (js/render.js carFx) measured the gap to the track's barrier lines, and past them on
    // the new map (no barriers) the car showed a stream of sparks, as if it scraped along something unseen
    const sp = await page.evaluate(() => { const g = window.__game, P = g.race.player; P.place(40, 20, 0); P.vx = 15; P.vz = 0; const s0 = Render.fxStats().sparks; for (let k = 0; k < 20; k++) { g.sim(1 / 60, false); Render.frame(1 / 60, 1, P, 'iso', {}); } return { sparks: Render.fxStats().sparks - s0, d: Math.abs(P.q.d), br: P.q.br }; });
    T.check('driving past the track\'s (gone) barrier lines: no sparks, nothing scrapes', sp.sparks === 0 && sp.d > sp.br, JSON.stringify(sp));
    // the ring road (js/newmap.js nordRoad, the user's green line): paved as the Nordschleife, 11 m, the fans' paint on it; driven as asphalt
    // (track.surf2, js/core.js Car.stepCS), quicker off the line than the gravel beside it
    const rr = await page.evaluate(() => { const g = window.__game, P = g.race.player, H = window.__H3, R = H.roads.nord, run = (x, z, h) => { P.place(x, z, h); P.vx = P.vz = 0; g.sim(5, false, 0); return { v: Math.round(Math.hypot(P.vx, P.vz) * 3.6), ws: P.ws.join('') }; };
      return { style: R && R.style, wd: R && R.wd, L: R && Math.round(R.Lc), decals: H.nordDecals, on: (() => { const P2 = R.P2; let k = 0; for (let i = 0; i < P2.length; i++) if (Math.hypot(P2[i].x + 105, P2[i].z + 347) < Math.hypot(P2[k].x + 105, P2[k].z + 347)) k = i; const a = P2[k], b = P2[k + 2]; P.place(a.x, a.z, Math.atan2(b.z - a.z, b.x - a.x)); P.vx = P.vz = 0;
        for (let t = 0; t < 300; t++) { let bk = k, be = 1e18; for (let i = Math.max(0, k - 5); i < Math.min(P2.length - 3, k + 30); i++) { const e = (P2[i].x - P.x) ** 2 + (P2[i].z - P.z) ** 2; if (e < be) { be = e; bk = i; } } k = bk; const q = P2[k], q2 = P2[k + 3], hd = Math.atan2(q2.z - q.z, q2.x - q.x), lat = (P.x - q.x) * -Math.sin(hd) + (P.z - q.z) * Math.cos(hd); let he = hd - P.h; he = Math.atan2(Math.sin(he), Math.cos(he)); g.sim(1 / 60, false, Math.max(-1, Math.min(1, he * 2 - lat * 0.25)), 1); }
        return { v: Math.round(Math.hypot(P.vx, P.vz) * 3.6), ws: P.ws.join('') }; })(), off: run(-200, -300, 0) }; });   // (on: along its northern bend, kept on it; off: the open ground south of it)
    T.check('the ring road: paved as at Nürburg (11 m, about 2 km, paint on it), driven as asphalt and quicker than the gravel beside it', rr.style === 'nord' && rr.wd === 11 && rr.L > 1800 && rr.decals > 10 && /^0+$/.test(rr.on.ws) && /^5+$/.test(rr.off.ws) && rr.on.v > rr.off.v + 3, JSON.stringify(rr));
    // the ring road redrawn (the user: winding all the way, with Suzuka's bends, the run-offs and the rest a circuit has; up and down in the south; under the hill in
    // a tunnel as Monaco's; the long bend by the water banked as the Nürburgring's Karussell): its bends, its heights, the run-offs' and kerbs' surfaces
    const rs = await page.evaluate(() => { const H = window.__H3, R = H.roads.nord, P2 = R.P2, n = P2.length - 1, ds = R.Lc / n, k = Math.round(4.5 / ds), rad = [];
      for (let i = k; i <= n - k; i++) { const a = P2[i - k], b = P2[i], c = P2[i + k], t1 = Math.atan2(b.z - a.z, b.x - a.x), t2 = Math.atan2(c.z - b.z, c.x - b.x); let d = t2 - t1; d = Math.atan2(Math.sin(d), Math.cos(d)); rad.push(k * ds / Math.max(1e-6, Math.abs(d))); }
      let slow = 0; for (let i = 1; i < rad.length; i++) if (rad[i] < 25 && rad[i - 1] >= 25) slow++;
      const ys = P2.filter(p => p.z > 100).map(p => H.ground(p.x, p.z)), NS = H.nordSurf || [], cnt = [0, 0, 0, 0]; for (const e of NS) cnt[e[3]]++;
      // the run-offs as the car feels them: the surface all over their quads (gravel), and on the asphalt's edge beside them (asphalt)
      const T = window.__game.race.track, Q = H.roQ || [], nrm = R.nrm, at = (i, f, l) => { const A = P2[i], B = P2[i + 1], na = nrm[i], nb = nrm[i + 1]; return [A.x + (B.x - A.x) * f + (na[0] + (nb[0] - na[0]) * f) * l, A.z + (B.z - A.z) * f + (na[1] + (nb[1] - na[1]) * f) * l]; };
      let rg = 0, rn = 0, eg = 0, en = 0; const w0 = Math.min(...Q.map(q => q[3])); for (const [j, sg, i, e] of Q) { for (let f = 0.1; f < 1; f += 0.2) { for (let l = e + 0.5; l < e + 3; l += 0.5) { const [x, z] = at(i, f, sg * l); rn++; if (T.surf2(x, z, H.ground(x, z)) === 3) rg++; } if (Math.abs(e - w0) < 0.01) {   // (no kerb there)
           const [x, z] = at(i, f, sg * (e - 0.3)); en++; if (T.surf2(x, z, H.ground(x, z)) === 0) eg++; } } }
      return { slow, minR: Math.round(Math.min(...rad)), hi: +Math.max(...ys).toFixed(1), lo: +Math.min(...ys).toFixed(1), kart: +Math.max(...[[-100, 222], [0, 200], [60, 185], [-120, 180]].map(([x, z]) => Math.abs(H.ground(x, z)))).toFixed(2), kerb: cnt[1], trap: +(rg / Math.max(1, rn)).toFixed(3), edge: en ? +(eg / en).toFixed(3) : null, quads: Q.length, tracks: H.roTracks || 0, boards: H.ringBoards || 0 }; });
    T.check('the ring road: tight bends (a hairpin, chicanes: 4 and more under 25 m), up and down in the south (5 m up, under the old ground in the spoon), the kart track and the lots left flat; the run-offs gravel all over (as the gravel roads look, tyre tracks in them), the asphalt\'s edge beside them asphalt; kerbs, braking boards', rs.slow >= 4 && rs.minR > 10 && rs.hi > 5 && rs.lo < -0.4 && rs.kart < 0.01 && rs.quads > 500 && rs.trap > 0.97 && (rs.edge == null || rs.edge > 0.97) && rs.tracks >= 10 && rs.kerb > 200 && rs.boards >= 3, JSON.stringify(rs));
    const rt = await page.evaluate(() => { const g = window.__game, P = g.race.player, T = g.race.track, H = window.__H3, TN = H.tun, out = {}; if (!TN) return null;
      const q = TN.S[Math.round((TN.t0 + TN.t1) / 2)], h = Math.atan2(q.tz, q.tx), at = (y) => { P.place(q.x, q.z, h); P.vx = P.vz = 0; P.y = P.py = P.roadY = y; g.sim(1, false, 0, 0); return { y: +P.y.toFixed(2), ws: P.ws.join(''), fade: !!Render.world.dyn.tunnel.test(P) }; };
      out.len = Math.round(TN.s1 - TN.s0); out.over = +H.ground(q.x, q.z).toFixed(1); out.two = +T.ground2(q.x, q.z).toFixed(1); out.low = at(0); out.high = at(H.ground(q.x, q.z));
      const a = TN.S[Math.max(0, TN.t0 - 45)]; P.place(a.x, a.z, Math.atan2(a.tz, a.tx)); P.y = P.py = P.roadY = H.ground(a.x, a.z); P.vx = a.tx * 25; P.vz = a.tz * 25; P.hitWall = 0; let air = 0, ym = 0, inT = 0, hit = 0;
      for (let k = 0; k < 300; k++) { const r0 = TN.near(P.x, P.z); g.sim(1 / 60, false, r0 ? Math.max(-1, Math.min(1, -r0.d * 0.15)) : 0, 0.6); if (P.air) air++; const r = TN.near(P.x, P.z); if (r && TN.roofed(r)) { inT++; ym = Math.max(ym, P.y); } hit = Math.max(hit, P.hitWall || 0); }
      out.through = { air, inT, ym: +ym.toFixed(2), hit: +hit.toFixed(1), past: TN.near(P.x, P.z) ? Math.round(TN.near(P.x, P.z).s - TN.s1) : null };
      P.place(q.x, q.z, h + Math.PI / 2); P.y = P.py = P.roadY = 0; P.vx = q.nx * 20; P.vz = q.nz * 20; P.hitWall = P.fxWall = 0; let md = 0, hw = 0; for (let k = 0; k < 60; k++) { g.sim(1 / 60, false, 0, 0); md = Math.max(md, Math.abs(TN.near(P.x, P.z).d)); hw = Math.max(hw, P.hitWall || 0, P.fxWall || 0); } out.wall = { md: +md.toFixed(1), hit: +hw.toFixed(1), y: +P.y.toFixed(2) };
      return out; });
    T.check('the tunnel under the hill: 80 m and more of it, the hill over it; a car in it stays down on its asphalt (the hill over it fades), on the hill over it stays up on the hill\'s ground (the 2-argument ground is the hill\'s); driven through at 90 km/h: on the ground, no wall; into its wall at 20 m/s: stopped by it, inside',
      !!rt && rt.len > 80 && rt.over > 8 && rt.two === rt.over && rt.low.y === 0 && /^0+$/.test(rt.low.ws) && rt.low.fade && rt.high.y > 8 && /^5+$/.test(rt.high.ws) && !rt.high.fade && rt.through.air === 0 && rt.through.inT > 60 && rt.through.ym < 0.05 && rt.through.hit === 0 && rt.through.past > 0 && rt.wall.hit > 5 && rt.wall.md < 6.6 && rt.wall.y === 0, JSON.stringify(rt));
    const rb = await page.evaluate(() => { const g = window.__game, P = g.race.player, T = g.race.track, H = window.__H3, B = H.bankR; if (!B || !T.bank2) return null; const k = B.S[Math.round(B.S.length / 2)], x = k[0], z = k[1], nx = k[2] * B.side, nz = k[3] * B.side;
      P.place(x, z, 0); P.vx = P.vz = 0; P.y = P.py = P.roadY = T.ground2(x, z); g.sim(0.3, false, 0, 0); const sl = P.bankSl, gIn = T.ground2(x + nx * 4, z + nz * 4), gOut = T.ground2(x - nx * 4, z - nz * 4), tr = (H.nordSurf || []).find(e => e[3] === 3);
      let trap = null; if (tr) { P.place(tr[0], tr[1], 0); P.vx = P.vz = 0; P.y = P.py = P.roadY = T.ground2(tr[0], tr[1]); g.sim(0.3, false, 0, 0); trap = P.ws.join(''); }
      return { sl: +(sl || 0).toFixed(2), drop: +(gOut - gIn).toFixed(2), apron: T.surf2(x + nx * (B.w + 3), z + nz * (B.w + 3), 0), trap }; });
    T.check('the bend by the water banked as the Karussell (0.28 across, the inside 2 m lower over 8 m, its concrete bowl paved); a car in a gravel trap: on gravel', !!rb && rb.sl > 0.2 && rb.drop > 1.8 && rb.apron === 0 && /3/.test(rb.trap || ''), JSON.stringify(rb));
    // the gravel ways as wide as the Mountain Rally's road (10-14 m; the mock-up's width only on the snowy hill top)
    const gw = await page.evaluate(() => { const H = window.__H3, ws = H.net.filter(e => (e.kind === 'dirt' || e.kind === 'forest') && e.id !== 'mx').map(e => 2 * e.hw), pw = H.paths.map(p => p.wd).concat([H.roads.forest.wd, H.roads.over.wd, H.forest.wd]);
      return { n: ws.length, min: Math.min(...ws, ...pw), max: Math.max(...ws, ...pw), forest: H.roads.forest.wd }; });
    T.check('the gravel ways 10-14 m wide, as the Mountain Rally\'s road (the forest roads 13 m and more)', gw.n > 30 && gw.min >= 10 && gw.max <= 14 && gw.forest >= 13, JSON.stringify(gw));
    // the west's gravel as the user redrew it: the forest loop, the way to the track's south-west corner and the way down the hill's south-west side gone; a new way
    // from the ring road past its south-west hairpin up to the track's south-west corner, driven as gravel
    const nw = await page.evaluate(() => { const g = window.__game, P = g.race.player, T = g.race.track, H = window.__H3, ids = H.net.filter(e => e.P[0][0] > -5000).map(e => e.id), e = H.net.find(q => q.id === 'loopB'), N = H.net.find(q => q.id === 'nord');
      if (!e || !N) return { ids }; const dTo = (p, L) => Math.min(...L.map(q => Math.hypot(q[0] - p[0], q[1] - p[1]))), a = e.P[0], b = e.P[e.P.length - 1], m = e.P[Math.floor(e.P.length / 2)], tq = T.query(b[0], b[1]);
      P.place(m[0], m[1], 0); P.vx = P.vz = 0; P.y = P.py = P.roadY = T.ground2(m[0], m[1]); g.sim(0.3, false, 0, 0);
      return { loop: ids.includes('loop'), hill2: ids.includes('hill2'), ring: +dTo(a, N.P).toFixed(1), track: +Math.abs(tq.d).toFixed(1), w: T.w, mid: P.ws.join(''), a, b }; });
    T.check('the west\'s gravel: the forest loop and the way down the hill\'s south-west side gone; a new way from the ring road (south-west hairpin) to the track\'s south-west corner, driven as gravel', !nw.loop && !nw.hill2 && nw.ring < 3 && nw.track < nw.w + 1 && /^5+$/.test(nw.mid || ''), JSON.stringify(nw));
    // the track's own pit road under the new map does nothing: driving over its (endless) entry and exit on the ring road, the kart track and the field, no pit stop
    // and no autopilot (it took the car over there before, its old boxes were there)
    const pt = await page.evaluate(() => { const g = window.__game, P = g.race.player, T = g.race.track, out = [];
      for (const [x, z, h] of [[-128, 294, 0], [-125.2, 229.1, 0], [80, 287, Math.PI], [-140, 170, 0]]) { P.place(x, z, h); P.vx = 12 * Math.cos(h); P.vz = 12 * Math.sin(h); P.y = P.py = P.roadY = T.ground2(x, z); P.inPit = false; P.pitAP = false; P.pitG = false;
        let pit = 0; for (let k = 0; k < 120; k++) { g.sim(1 / 60, false, 0, 0.5); if (P.inPit || P.pitAP || P.pitG) pit++; } out.push(pit); }
      return { pit: !!T.def.pit, hits: out }; });
    T.check('the old pit road under the new map: no pit stop, no autopilot on the ring road, the kart track, the field', pt.pit && pt.hits.every(n => n === 0), JSON.stringify(pt));
    const h = await page.evaluate(() => { const g = window.__game, P = g.race.player, T = g.race.track; P.place(-205, -105, 0); P.vx = P.vz = 0; g.sim(0.5, false); return { y: P.y, ry: P.roadY, g: T.ground2(P.x, P.z) }; });
    T.check('on the snow hill the car stands on the new map\'s ground (its top 25 m and more above the track)', h.g > 20 && Math.abs(h.ry - h.g) < 0.5 && h.y > 20, JSON.stringify(h));
    const e = await page.evaluate(() => { const g = window.__game, P = g.race.player; P.place(405, 0, 0); P.vx = 30; P.vz = 0; g.sim(1, false); return { x: P.x, edge: g.race.track.free[1] }; });
    T.check('the map\'s edge (the buoys at sea) stops the car', e.x <= e.edge + 0.01, JSON.stringify(e));
    // the walls (js/newmap.js wallFlush, js/nvwalls.js): pieces of fence where the mock-up had tyres, red and white plastic, wooden by the
    // countryside's garages; the car pushes them: a plastic barrier slides away and turns, a wooden fence hit hard falls over
    // the still meshes merged for the phones (js/nvbake.js): thousands into some hundred, a few kept as they are
    const bk = await page.evaluate(() => NVBake.stats());
    T.check('the new map\'s still meshes merged (by material and cell): thousands into some hundred', bk && bk.merged > 3000 && bk.meshes < 2500 && bk.kept < 50, JSON.stringify(bk && { merged: bk.merged, instances: bk.instances, kept: bk.kept, meshes: bk.meshes, kverts: bk.kverts }));
    const wl = await page.evaluate(() => NVWalls.state());
    T.check('the walls: pieces of fence instead of the tyres, plastic and wooden', wl.plastic > 300 && wl.wood > 20 && !wl.moving, JSON.stringify(wl));
    const cr = await page.evaluate(() => {
      const g = __game, P = g.race.player, out = {};
      for (const [kind, v] of [['plastic', 12], ['wood', 8]]) {
        const ps = NVWalls.pieces().filter(p => p.kind === kind), p = ps[Math.floor(ps.length / 3)], x0 = p.x, z0 = p.z, a0 = p.ang;
        const nx = -Math.sin(p.ang), nz = Math.cos(p.ang), h = Math.atan2(-nz, -nx);   // (from the piece's side, heading at it)
        P.place(p.x + nx * 6, p.z + nz * 6, h); P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v; g.sim(1.5, false, 0);
        out[kind] = { moved: +Math.hypot(p.x - x0, p.z - z0).toFixed(2), turned: +Math.abs((p.ang - a0) * 57.3).toFixed(1), tilt: Math.round(p.tilt * 57.3) };
      }
      return out;
    });
    T.check('a car into a plastic barrier at 12 m/s: the barrier slides away (metres) and turns; into a wooden fence at 8 m/s: it falls over', cr.plastic.moved > 2 && cr.plastic.tilt === 0 && cr.wood.tilt === 90 && cr.wood.moved > 0.5, JSON.stringify(cr));
    // the garages' menus (js/nvmenu.js): on a coloured floor the garage's menu at the top; the driving school's to a task's START
    const go = async (key) => { await page.evaluate((key) => { const f = NVMenu.floors().find(q => q.key === key), P = __game.race.player; P.place(f.x, f.z, f.h); P.vx = P.vz = 0; }, key); return page.waitForFunction((key) => { const s = NVMenu.state(); return s.at === key && s.open; }, key, { timeout: 30000 }).then(() => true, () => false); };
    const menu = () => page.evaluate(() => { const m = document.getElementById('nvm'), r = m && m.getBoundingClientRect(); return m ? { key: m.dataset.key, lvl: +m.dataset.lvl, title: m.querySelector('.hd b').textContent, rows: [...m.querySelectorAll('.row')].map(b => b.textContent.replace(/\s+/g, ' ').trim()), note: (m.querySelector('.note') || {}).textContent || '', go: !!m.querySelector('.go'), lv: +m.dataset.lv || 0, bar: (m.querySelector('.lv') || {}).textContent || '', next: !!m.querySelector('[data-a="lvn"]:not([disabled])'), wip: !!m.querySelector('.wip.on'), wipT: m.querySelector('.wip').textContent, top: r.top, bottom: r.bottom, left: r.left, right: r.right, W: innerWidth, H: innerHeight } : null; });
    const fl = await page.evaluate(() => NVMenu.floors().map(f => f.key));
    T.check('the garages with a menu: 12 by the road (the school, the licences, the races, the missions, multiplayer, motocross) and HOME\'s box', fl.length === 13 && ['school', 'car', 'truck', 'rally', 'circuit', 'street', 'cross', 'mx', 'multi', 'police', 'kamikaze', 'president', 'home'].every(k => fl.includes(k)), JSON.stringify(fl));
    const s0 = await go('school'), m0 = await menu();
    T.check('on the driving school\'s floor: its menu at the top, inside the screen, the three licences at level 1 with 0 / 12 tasks and their progress', s0 && m0 && m0.key === 'school' && m0.lvl === 0 && /DRIVING SCHOOL/i.test(m0.title) && m0.rows.length === 3 && /ROAD LICENCE/.test(m0.rows[0]) && /GRAVEL LICENCE/.test(m0.rows[1]) && /HILL LICENCE/.test(m0.rows[2]) && m0.rows.every(r => /level 1 · 0 \/ 12 tasks/.test(r) && /0 %/.test(r)) && m0.top >= 0 && m0.left >= 0 && m0.right <= m0.W && m0.bottom <= m0.H, JSON.stringify(m0));
    await page.waitForTimeout(3200);
    T.check('standing in the garage: no Na progo (the car is not stuck)', await page.evaluate(() => document.getElementById('btn-rescue').classList.contains('off')));
    await page.click('#nvm [data-a="lic"][data-i="1"]'); const m1 = await menu();
    T.check('a tap on GRAVEL LICENCE: level 1, its three tasks (1-3 of 12), under them LEVEL 1 at 0 %, level 2 shut until 50 %', m1 && m1.lvl === 1 && m1.lv === 1 && /GRAVEL LICENCE/i.test(m1.title) && m1.rows.length === 3 && /Gravel lap/.test(m1.rows[0]) && /Gravel corner/.test(m1.rows[2]) && /LEVEL 1/.test(m1.bar) && /0 %/.test(m1.bar) && /at 50 % level 2 opens/.test(m1.bar) && !m1.next, JSON.stringify(m1 && { rows: m1.rows, bar: m1.bar, next: m1.next }));
    // (the tasks are not built yet: the places set from here) 1st 100 %, 2nd 75 %, 3rd 50 %, 4th 0 %: 2nd, 4th and one not driven: level 1 at 25 %, shut;
    // then 1st, 3rd and 4th: 50 %, level 2 open, its three new tasks
    await page.evaluate(() => { NVMenu.setPlace('m', 0, 2); NVMenu.setPlace('m', 1, 4); }); const m1a = await menu();
    await page.evaluate(() => { NVMenu.setPlace('m', 0, 1); NVMenu.setPlace('m', 1, 3); NVMenu.setPlace('m', 2, 4); }); const m1b = await menu();
    await page.click('#nvm [data-a="lvn"]'); const m1c = await menu();
    T.check('the places: 2nd + 4th + one not driven = 25 %, level 2 still shut; 1st + 3rd + 4th = 50 %: level 2 opens; › shows its three tasks (4-6), the last level is the twelfth task, the exam', m1a && /25 %/.test(m1a.bar) && !m1a.next && /75 %/.test(m1a.rows[0]) && m1b && /50 %/.test(m1b.bar) && m1b.next && m1c && m1c.lv === 2 && m1c.rows.length === 3 && /Pole slalom/.test(m1c.rows[0]) && /LEVEL 2/.test(m1c.bar) && await page.evaluate(() => NVMenu.LIC.m.tasks.length === 12 && /Exam: gravel/.test(NVMenu.LIC.m.tasks[11][0])), JSON.stringify(m1c && { rows: m1c.rows, bar: m1c.bar }));
    await page.click('#nvm [data-a="task"][data-i="4"]'); const m2 = await menu();
    T.check('a tap on a task: its card with START', m2 && m2.lvl === 2 && m2.go && m2.rows.length === 0, JSON.stringify(m2));
    // (the note shows 1.4 s: read at the tap itself, a frame of the new map in a browser without a GPU takes seconds)
    const tapWip = (sel) => page.evaluate((sel) => { document.querySelector(sel).click(); const w = document.querySelector('#nvm .wip'); return { wip: w.classList.contains('on'), t: w.textContent }; }, sel);
    const m3 = await tapWip('#nvm .go');
    T.check('START: V IZDELAVI (the tasks are not built yet)', m3.wip && /izdelavi/i.test(m3.t), JSON.stringify(m3));
    await page.click('#nvm [data-a="back"]'); const m4 = await menu(); await page.click('#nvm [data-a="back"]'); const m5 = await menu();
    T.check('back: the level\'s tasks (level 2), then the licences (GRAVEL LICENCE at level 2 now)', m4 && m4.lvl === 1 && m4.lv === 2 && m5 && m5.lvl === 0 && /level 2 · 2 \/ 12 tasks/.test(m5.rows[1]), JSON.stringify([m4 && m4.lv, m5 && m5.rows[1]]));
    const s6 = await go('circuit'), m6 = await menu(), w6 = await tapWip('#nvm [data-a="wip"][data-i="2"]');
    T.check('another garage (circuit race): its three choices; a tap on one: V IZDELAVI', s6 && m6 && m6.key === 'circuit' && m6.rows.length === 3 && w6.wip, JSON.stringify({ rows: m6 && m6.rows, w6 }));
    const s7 = await go('home'), m7 = await menu();
    T.check('HOME\'s box: only Garaža v izdelavi (the new garage is made apart)', s7 && m7 && m7.key === 'home' && m7.rows.length === 0 && /Garaža v izdelavi/i.test(m7.note), JSON.stringify(m7));
    const vp = page.viewportSize(); await page.mouse.click(vp.width / 2, vp.height * 0.6); await page.waitForTimeout(300);
    const c0 = await page.evaluate(() => NVMenu.state());
    T.check('a tap anywhere else: the menu closes, and stays closed while the car stays on the floor', !c0.open && c0.at === 'home', JSON.stringify(c0));
    await page.evaluate(() => { const P = __game.race.player, h = window.__H3.home; P.place(h.x, h.z, h.h); P.vx = P.vz = 0; });   // (HOME, on the dirt road: no garage)
    await page.waitForFunction(() => !NVMenu.state().at, null, { timeout: 30000 });
    T.check('off the floor and back: the menu again', await go('home'));
    T.check('no errors on the way', !errors.length, errors.slice(0, 3).join(' | '));
    // back to the title: the page again (the new map changed the track's world)
    await Promise.all([page.waitForEvent('load', { timeout: 60000 }), page.evaluate(() => __game.onAction('to-title'))]);
    await ready(page);
    T.check('back to the title: the page loads again, the menu on show', await page.evaluate(() => !!document.getElementById('menu-host').shadowRoot.querySelector('#s-title')));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
