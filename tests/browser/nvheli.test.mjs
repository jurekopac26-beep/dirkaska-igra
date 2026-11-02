// NEW VERSION · TEST 1: the rescue helicopter flies (js/nvheli.js; the user's choice in the pictures, heli8: version 2, red with a white cross).
// Parked on the rescue base's H, its back ramp down; the car drives up into the bay: see-through, the nose open, the menu of three (WATER RESCUE and
// FIREFIGHTING locked, FREE FLIGHT); no choice: out over the front ramp. FREE FLIGHT: solid in 1 s (the car not seen), the rotor on, up to its height;
// the gas flies it on and up, the brake slows it and takes it down (no button), the steering turns it, the height and the speed top left; not on
// the water nor on a roof; landed, the ramps open and the car drives out; the helicopter flies home to its H by itself. On its side the pause at the edge.
//   node tests/browser/nvheli.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('nvheli');
const srv = await serve();
const browser = await launch();
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { intro: 2, quali: 0 }, { width: 412, height: 915 }, { menu: true });
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
  await page.evaluate(() => document.getElementById('menu-host').shadowRoot.querySelector('[data-act="newver"]').click());
  await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 300000, polling: 500 });
  const frames = (n = 6) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const st = () => page.evaluate(() => { const s = NVHeli.state(), P = __game.race.player, v = Render.viewOf(P); return Object.assign(s, { car: { x: P.x, y: P.y, z: P.z, h: P.h, seen: !!(v && v.grp.visible) } }); });
  const sim = (sec, steer = 0, thr = 0, brk = 0) => page.evaluate(([a, b, c, d]) => __game.sim(a, false, b, c, d), [sec, steer, thr, brk]);
  // the car behind the helicopter, driven up its back ramp until it is in the bay, then braked to a stop
  const driveIn = () => page.evaluate(() => { const g = __game, s = NVHeli.state(), P = g.race.player, c = Math.cos(s.psi), n = Math.sin(s.psi);
    P.place(s.x - c * 18, s.z - n * 18, s.psi); P.vx = P.vz = 0; for (let i = 0; i < 600 && (P.x - s.x) * c + (P.z - s.z) * n < -1; i++) g.sim(1 / 60, false, 0, 0.5);
    for (let i = 0; i < 300 && P.speed > 0.3; i++) g.sim(1 / 60, false, 0, 0, 0.6); g.sim(1.5, false, 0, 0, 0); });
  const ui = () => page.evaluate(() => { const vis = (id) => { const e = document.getElementById(id); return !!e && getComputedStyle(e).display !== 'none'; }, r = (id) => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
    const m = document.getElementById('nvh'); return { menu: vis('nvh'), rows: m ? [...m.querySelectorAll('.row')].map(b => ({ t: b.firstChild.textContent, lk: b.classList.contains('lk') })) : [], btn: vis('nvh-btn'), btnT: (document.getElementById('nvh-btn') || {}).textContent || '', btnR: r('nvh-btn'),
      brake: r('c-brake'), gas: r('c-gas'), info: vis('nvh-info'), infoT: (document.getElementById('nvh-info') || {}).textContent || '', note: (document.getElementById('nvh-note') || {}).textContent || '', W: innerWidth }; });
  const tap = (sel) => page.evaluate((sel) => { const e = document.querySelector(sel); e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }, sel);

  // 1. parked on the H: the back ramp down, the nose shut, the rotor still; its parts merged (a handful of meshes), not in the map's merged cells
  const s0 = await st(), pc = await page.evaluate(() => { const p = NVHeli.parts(); let n = 0; p.shell.parent.traverse(o => { if (o.isMesh) n++; }); return { n, inScene: !!p.shell.parent.parent }; });
  T.check('parked on the rescue base\'s H (x -95, z 95, nose west): the back ramp down, the nose shut, the rotor still', s0.mode === 'park' && Math.hypot(s0.x + 95, s0.z - 95) < 0.1 && Math.abs(Math.cos(s0.psi) + 1) < 1e-3 && s0.fR === 1 && s0.fF === 0 && s0.dr === 0 && s0.w === 0 && s0.alt === 0, JSON.stringify(s0));
  T.check('the helicopter merged into a handful of meshes (at most 14), in the scene', pc.n <= 14 && pc.inScene, JSON.stringify(pc));

  // 2. driven in at the back: up the ramp onto the bay's floor, see-through, the nose open, the menu
  await driveIn(); await frames(8);
  const s1 = await st(), u1 = await ui();
  T.check('up the back ramp onto the bay\'s floor (1.25 m up): the helicopter see-through, the doors aside, the front ramp down', s1.onF && s1.car.y > s1.y + 1.15 && s1.car.y < s1.y + 1.45 && s1.xr === 1 && s1.fF === 1 && s1.dr === 1 && s1.mode === 'open' && s1.car.seen, JSON.stringify(s1));
  T.check('the menu: Rescue helicopter, WATER RESCUE and FIREFIGHTING locked, FREE FLIGHT', u1.menu && u1.rows.map(r => r.t).join('|') === 'WATER RESCUE|FIREFIGHTING|FREE FLIGHT' && u1.rows[0].lk && u1.rows[1].lk && !u1.rows[2].lk, JSON.stringify(u1.rows));
  await tap('#nvh .row.lk'); await sim(0.5);
  const w1 = await page.evaluate(() => document.querySelector('#nvh .wip').classList.contains('on')), s1b = await st();
  T.check('a locked one: V IZDELAVI, the helicopter stays', w1 && s1b.mode === 'open' && !s1b.carry, JSON.stringify({ w1, mode: s1b.mode }));

  // 3. no choice: drive on, out over the front ramp; behind it the nose shuts
  await page.evaluate(() => { const g = __game, s = NVHeli.state(), P = g.race.player, c = Math.cos(s.psi), n = Math.sin(s.psi); for (let i = 0; i < 600 && (P.x - s.x) * c + (P.z - s.z) * n < 16; i++) g.sim(1 / 60, false, 0, 0.5); g.sim(2.5, false, 0, 0, 0); });
  await frames(4);
  const s2 = await st(), u2 = await ui(), out2 = (s2.car.x - s2.x) * Math.cos(s2.psi) + (s2.car.z - s2.z) * Math.sin(s2.psi);
  T.check('no choice: out over the front ramp onto the ground ahead of it; the menu gone, the front ramp up and the doors shut again', out2 > 12 && s2.car.y < s2.y + 0.3 && s2.mode === 'park' && s2.fF === 0 && s2.dr === 0 && !u2.menu, JSON.stringify({ out2, y: s2.car.y, mode: s2.mode, fF: s2.fF, dr: s2.dr, menu: u2.menu }));
  // the shell is a wall: driven at its side, the car stops outside it
  const wl = await page.evaluate(() => { const g = __game, s = NVHeli.state(), P = g.race.player, c = Math.cos(s.psi), n = Math.sin(s.psi), lx = -n, lz = c;
    P.place(s.x + lx * 12, s.z + lz * 12, Math.atan2(-lz, -lx)); P.vx = P.vz = 0; g.sim(3, false, 0, 0.6); return { side: (P.x - s.x) * lx + (P.z - s.z) * lz, y: P.y - s.y }; });
  T.check('driven at its side: the car stops against the shell (outside it, on the ground)', wl.side > 2.4 && wl.y < 0.3, JSON.stringify(wl));

  // 4. in again, FREE FLIGHT: in 1 s solid (the car not seen), the ramps and the doors shut, the rotor on; no button, the height and the speed
  await driveIn(); await frames(4); await tap('#nvh .row[data-a="free"]'); await sim(1.05); await frames(8);
  const s3 = await st(), u3 = await ui();
  T.check('FREE FLIGHT: in 1 s solid round the car (not seen), the ramps and the doors shut, the rotor turning, lifting off', s3.mode === 'air' && s3.carry && s3.xr === 0 && s3.fR === 0 && s3.fF === 0 && s3.dr === 0 && s3.w > 20 && !s3.car.seen && !u3.menu, JSON.stringify(s3));
  T.check('no PRISTANI / DVIGNI SE button (the gas and the brake fly it up and down); VIŠINA and HITROST top left', !u3.btn && u3.info && /VIŠINA/.test(u3.infoT) && /HITROST/.test(u3.infoT), JSON.stringify(u3));

  // 5. up to its height, the car riding in the bay
  await sim(7);
  const s4 = await st();
  T.check('up at once to its height (over 20 m), the car in the bay with it', s4.alt > 20 && Math.abs(s4.car.y - (s4.y + 1.25)) < 0.2 && Math.hypot(s4.car.x - s4.x, s4.car.z - s4.z) < 1.5, JSON.stringify({ alt: s4.alt, y: s4.y, car: s4.car }));

  // 6. the gas flies it on and up, the steering turns it (right: clockwise seen from above, the heading up), the brake slows it and takes it down
  await sim(5, 0, 1); const s5 = await st(); await sim(2, 1, 1); const s6 = await st(); await frames(4); const u6 = await ui(); await sim(3, 0, 0, 1); const s7 = await st();
  T.check('the gas: over 90 km/h in 5 s and up; steering right turns it right; the brake slows it and takes it down', s5.vf * 3.6 > 90 && s5.alt > s4.alt + 5 && Math.sin(s6.psi - s5.psi) > 0.5 && s7.vf < s6.vf * 0.5 && s7.y < s6.y - 3 && +((u6.infoT.match(/HITROST\D*(\d+)/) || [])[1] || 0) > 50, JSON.stringify({ v5: s5.vf * 3.6, a4: s4.alt, a5: s5.alt, turn: s6.psi - s5.psi, v7: s7.vf * 3.6, y6: s6.y, y7: s7.y, info: u6.infoT }));

  // 7. not on the water: over the sea the brake stops it 4 m over the water and says so; not on a roof either (the station REŠEVANJE)
  const sea = await page.evaluate(() => { let b = null; for (let x = 380; x > 60 && !b; x -= 10) for (let z = -350; z < 280 && !b; z += 10) { if ([[0, 0], [12, 12], [-12, 12], [12, -12], [-12, -12]].every(([dx, dz]) => __H3.water.region(x + dx, z + dz) && __H3.water.bedAt(x + dx, z + dz).y < __H3.water.WL - 0.5)) b = [x, z]; } return b; });
  await page.evaluate((p) => NVHeli.tp(p[0], p[1]), sea); await sim(16, 0, 0, 1); await frames(4);
  const s8 = await st(), u8 = await ui();
  T.check('over the sea: down to 4 m over the water and no further (Na vodi ne moreš pristati.)', s8.mode === 'air' && Math.abs(s8.alt - 4) < 0.7 && /vodi/.test(u8.note), JSON.stringify({ sea, mode: s8.mode, alt: s8.alt, note: u8.note }));
  await page.evaluate(() => NVHeli.tp(-62, 70)); await sim(8, 0, 0, 1);
  const s9 = await st(), roof = await page.evaluate(() => NVHeli.topAt(-62, 70) - __H3.ground(-62, 70));
  T.check('over the station REŠEVANJE: it stays 3 m over the roof, not landed', s9.mode === 'air' && roof > 5 && s9.y - s9.home.y > roof + 2.3, JSON.stringify({ roof, y: s9.y, blk: s9.blk, mode: s9.mode }));

  // (a wood: some 20 m square with something over 3 m high at most of its points, away from the base's buildings)
  const tree = await page.evaluate(() => { const H = __H3, hi = (x, z) => NVHeli.topAt(x, z) - H.ground(x, z) > 3;
    for (let r = 80; r < 320; r += 9) for (let a = 0; a < 6.28; a += 0.11) { const x = -95 + r * Math.cos(a), z = 95 + r * Math.sin(a); if (Math.abs(x) > 330 || z < -380 || z > 300 || H.water.region(x, z) || !hi(x, z)) continue;
      let n = 0; for (let dx = -10; dx <= 10; dx += 5) for (let dz = -10; dz <= 10; dz += 5) if (hi(x + dx, z + dz)) n++; if (n >= 8) return [x, z]; } return null; });
  await page.evaluate((p) => NVHeli.tp(p[0], p[1]), tree); await sim(8, 0, 0, 1);
  const treeTop = await page.evaluate((p) => NVHeli.topAt(p[0], p[1]), tree);   // (the tree's top: after the brake the game's own frames may hold it there, the block forgotten)
  const s9b = await st();
  T.check('over a wood: no landing among the trees either', s9b.mode === 'air' && s9b.y > treeTop + 2.3, JSON.stringify({ tree, treeTop, y: s9b.y, mode: s9b.mode }));

  // 8. the gas on the way down: up again; the brake over open ground: it lands, the rotor stops, the ramps open, the menu again; the gas then drives
  // the car out (no lift)
  const open = await page.evaluate(() => { const H = __H3; for (let r = 30; r < 200; r += 10) for (let a = 0; a < 6.28; a += 0.2) { const x = -95 + r * Math.cos(a), z = 95 + r * Math.sin(a);
    let ok = H.ground(x, z) > 0.2; for (let dx = -10; dx <= 10 && ok; dx += 5) for (let dz = -10; dz <= 10 && ok; dz += 5) ok = NVHeli.topAt(x + dx, z + dz) - H.ground(x + dx, z + dz) < 0.3; if (ok) return [x, z]; } return null; });
  await page.evaluate((p) => NVHeli.tp(p[0], p[1]), open); await sim(1, 0, 0, 1); const y0 = (await st()).y;
  await sim(3, 0, 1); const s10 = await st();
  T.check('on the way down the gas takes it up again', s10.y > y0 + 1 && s10.mode === 'air', JSON.stringify({ open, y0, y: s10.y }));
  await page.evaluate((p) => NVHeli.tp(p[0], p[1]), open);   // (back over the open ground: the gas took it forward)
  for (let k = 0; k < 40 && (await st()).mode !== 'land'; k++) await sim(1, 0, 0, 1);
  const s11 = await st(); await sim(6); await frames(6); const s12 = await st(), u12 = await ui();
  T.check('the brake over open ground: it lands (on the ground), the rotor stops, the ramps open, the car seen again, the menu again', s11.mode === 'land' && s11.alt === 0 && s12.w === 0 && s12.fR === 1 && s12.fF === 1 && !s12.carry && s12.car.seen && s12.mode === 'open' && u12.menu, JSON.stringify({ s11: [s11.mode, s11.alt], w: s12.w, fR: s12.fR, fF: s12.fF, carry: s12.carry, seen: s12.car.seen, mode: s12.mode, menu: u12.menu }));
  await sim(4, 0, 0.6); await frames(4); const s13 = await st(), u13 = await ui();
  T.check('the gas: the car drives out over the front ramp, the helicopter stays on the ground; the height gone', s13.mode === 'park' && s13.alt === 0 && s13.y === s11.y && !s13.cin && s13.car.y < s13.y + 0.3 && !u13.info && !u13.menu, JSON.stringify({ mode: s13.mode, alt: s13.alt, car: s13.car, info: u13.info }));

  // 9. nobody in it, the car away: it flies home to its H by itself and parks as before
  await page.evaluate(() => { const P = __game.race.player; P.place(60, -150, 0); P.vx = P.vz = 0; });
  let auto = false; for (let k = 0; k < 120; k++) { await sim(1); const s = await st(); if (s.mode === 'auto') auto = true; if (auto && s.mode === 'park') break; }
  await sim(2); const s14 = await st();
  T.check('the car away: the helicopter flies home by itself and parks on its H, the back ramp down', auto && s14.mode === 'park' && Math.hypot(s14.x + 95, s14.z - 95) < 0.1 && Math.abs(Math.cos(s14.psi) + 1) < 1e-3 && Math.abs(s14.y - s14.home.y) < 0.01 && s14.fR === 1 && s14.fF === 0, JSON.stringify(s14));

  // 10. on its side: the pause at the right edge, the map left of it
  await page.setViewportSize({ width: 915, height: 412 }); await frames(10);
  const ls = await page.evaluate(() => { const p = document.getElementById('btn-pause').getBoundingClientRect(), m = document.getElementById('h-map').getBoundingClientRect(); return { pr: p.right, pl: p.left, mr: m.right, W: innerWidth }; });
  T.check('on its side: the pause at the right edge, the map left of it', ls.W - ls.pr < 20 && ls.mr <= ls.pl, JSON.stringify(ls));
  T.check('no errors on the way', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
