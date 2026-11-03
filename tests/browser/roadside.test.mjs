// The roadside equipment of the real open roads (World's roadside: obcestna oprema, only what is needed) on Vršič, Medvode and Ouninpohja:
// 1. place-name boards only at the settlements whose real name the track's data knows (def.names, the track's description), the board struck
//    through where the road leaves the settlement; the speed limit after them (50 in; out: 90 on Vršič, 70 at Medvode); chevron
//    boards on the outside of every sharpest bend (radius 17 m or under, or more than 150 degrees round; not round a roundabout) and nowhere else;
//    the signs on the ground beside the road, not on the asphalt, facing the cars coming
// 2. what a car can reach is knockable (Core's rssign, rschev, rsboard; the white delineators the heavier dpost): driven into one at 90 km/h the
//    car loses a little speed (under 6 %) and takes a small dent (under 2 %), the sign flies off; a board collides at its legs (a car between
//    them passes under it, one leg knocks it over); Medvode's signs stand behind the fence, out of reach: fixed, in the static mesh
// 3. at night the street lamps light the road only in the settlements (Render's floodlights: none on Pikes Peak and Ouninpohja, no settlement
//    on them whose name is known), the sign faces shine; the same world again from a second build
//   node tests/browser/roadside.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('roadside equipment of the open roads');
const WANT = {   // the boards each road must have (the real names), the limits in and out (none: no settlement on the road), dark: no lamps at night
  vrsic: { boards: ['KRANJSKA GORA (konec)'], lim: [50, 90] },
  medvode: { boards: ['MEDVODE (konec)', 'ZBILJE', 'ZBILJE (konec)', 'VALBURGA', 'VALBURGA (konec)', 'SMLEDNIK', 'SMLEDNIK (konec)'], lim: [50, 70], fixed: true },
  ouninpohja: { boards: ['OUNI', 'KAKARISTO'], lim: null, dark: true },   // (the hamlets: the name only; the added section's village has no name that could be checked)
};
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'chase', weather: 'dry', mode: 'tt', tod: 'day' }, { width: 844, height: 390 }, { seed: 12345 });
  for (const id of Object.keys(WANT)) {
    await startTrack(page, id);
    const r = await page.evaluate(() => {
      const W = Render.world, g = window.__game, R = g.race, Tr = R.track, def = Tr.def, sS = Tr.startS, items = W.rsItems || [];
      // the sharpest bends (as the builder takes them) and where their chevrons stand
      const nearRing = (i) => Tr.rings.some(Rg => Math.hypot(Tr.px[i] - Rg.x, Tr.pz[i] - Rg.z) < Rg.wz + 5);
      const sharp = Tr.corners.filter(c => (c.minR <= 17 || c.angle > 2.6) && c.i0 * Tr.ds - sS >= 40 && c.i0 * Tr.ds - sS <= Tr.finishS - sS - 10).map(c => ({ d0: c.i0 * Tr.ds - sS, d1: c.i1 * Tr.ds - sS, side: -c.dir, ring: [0.12, 0.5, 0.88].every(f => nearRing(Math.round(c.i0 + (c.i1 - c.i0) * f))) }));
      const chev = items.filter(it => it.kind === 'chev');
      const bendsCovered = sharp.filter(c => !c.ring).map(c => chev.some(h => h.d >= c.d0 - 2 && h.d <= c.d1 + 2 && h.side === c.side));
      const strayChev = chev.filter(h => !sharp.some(c => h.d >= c.d0 - 2 && h.d <= c.d1 + 2)).length;
      // on the ground beside the road, off the asphalt, facing the cars coming (towards the start: against the road's way, within 75 degrees)
      const Q = {}; let onRoad = 0, facing = 0, floating = 0;
      for (const it of items) { const q = Tr.query(it.x, it.z, it.i, Q), hw = it.kind === 'board' ? 1.85 : 0.75;
        if (Math.abs(q.d) - hw < Tr.wAt(q.i) - 0.05) onRoad++;
        const i = it.i, back = -(it.nx * Tr.tx[i] + it.nz * Tr.tz[i]); if (it.kind === 'chev' ? false : back < Math.cos(75 * Math.PI / 180)) facing++;
        const gy = W.groundH(it.x, it.z); if (it.y > gy + 0.75) floating++; }
      // the knockable ones in the race, by kind; the white delineators
      const kinds = {}; for (const b of R.props) kinds[b.kind] = (kinds[b.kind] || 0) + 1;
      // the knockable ones as Core stands them: the pole's foot (1 m under its base, Render) in the ground, the base not sunk
      let propFloat = 0, propSunk = 0, worst = 0; for (const b of R.props) { if (!['rssign', 'rschev', 'rsboard'].includes(b.kind)) continue; const base = b.y - b.K.h0, g0 = W.groundH(b.x, b.z); worst = Math.max(worst, base - g0); if (base - 1 > g0 + 0.02) propFloat++; if (base < g0 - 0.9) propSunk++; }
      const allowed = (def.names || []).map(n => n.n.toUpperCase()).concat([(def.en && def.en.desc || '').toUpperCase(), (def.desc || '').toUpperCase()]);
      const names = items.filter(it => it.kind === 'board').map(it => it.name);
      const real = names.every(n => { const b = n.replace(' (konec)', ''); return allowed.some(a => a.includes(b)); });
      const fixedOk = items.filter(it => it.fixed).every(it => { const q = Tr.query(it.x, it.z, it.i, Q), bar = q.d > 0 ? q.br : q.bl, hw = it.kind === 'board' ? 1.85 : 0.75; return Math.abs(q.d) - hw > bar; });
      return { names, real, boards: items.filter(it => it.kind === 'board').map(it => [it.name, it.d]), lims: items.filter(it => it.kind === 'sign').map(it => [it.name, it.d]), nChev: chev.length, nSharp: bendsCovered.length, covered: bendsCovered.filter(Boolean).length, strayChev,
        onRoad, facing, floating, propFloat, propSunk, worst: +worst.toFixed(2), kinds, fixed: items.filter(it => it.fixed).length, n: items.length, fixedOk, mesh: !!W.rsMesh, meshVerts: W.rsMesh ? W.rsMesh.geometry.attributes.position.count : 0, zones: W.lampZones,
        sig: JSON.stringify(items) + '|' + W.props.map(p => [p.kind, p.x.toFixed(3), p.z.toFixed(3), p.col].join(',')).join(';') };
    });
    const w = WANT[id];
    console.log(`   ${id}: boards ${r.boards.map(b => b[0] + ' @' + b[1] + ' m').join(', ')}; limits ${r.lims.map(b => b[0].slice(4) + ' @' + b[1] + ' m').join(', ')}; ${r.nChev} chevrons on ${r.covered}/${r.nSharp} sharpest bends; ${r.fixed} of ${r.n} fixed behind a barrier; props ${JSON.stringify(r.kinds)}`);
    T.check(`${id}: place-name boards only with the real names (the track's data), each settlement's board struck through where the road leaves it`, JSON.stringify(r.names.slice().sort()) === JSON.stringify(w.boards.slice().sort()) && r.real,
      r.names.join(', '));
    T.check(`${id}: each struck-through board after its settlement's entry board`, w.boards.filter(b => b.endsWith('(konec)')).every(b => { const o = r.boards.find(x => x[0] === b), i = r.boards.find(x => x[0] === b.replace(' (konec)', '')); return o && (!i || i[1] < o[1]); }), JSON.stringify(r.boards));
    if (!w.lim) T.check(`${id}: no speed limits (no settlement on the road)`, r.lims.length === 0, JSON.stringify(r.lims));
    else T.check(`${id}: the speed limits: ${w.lim[0]} in each settlement, ${w.lim[1]} on the road out of it`, r.lims.some(l => l[0] === 'lim:' + w.lim[0]) && r.lims.some(l => l[0] === 'lim:' + w.lim[1]) && r.lims.every(l => l[0] === 'lim:' + w.lim[0] || l[0] === 'lim:' + w.lim[1]), JSON.stringify(r.lims));
    T.check(`${id}: chevron boards on the outside of the sharpest bends (all but one at most), none elsewhere`, r.nSharp > 0 && r.covered >= r.nSharp - 1 && r.strayChev === 0, `${r.covered} of ${r.nSharp} bends, ${r.nChev} chevrons, ${r.strayChev} elsewhere`);
    T.check(`${id}: every sign beside the road (none on the asphalt), on the ground, the boards and limits facing the cars coming`, r.onRoad === 0 && r.floating === 0 && r.facing === 0 && r.propFloat === 0 && r.propSunk === 0, `on the asphalt ${r.onRoad}, floating ${r.floating} (knockable: ${r.propFloat} floating, ${r.propSunk} sunk; the base at most ${r.worst} m over the ground), facing away ${r.facing}`);
    T.check(`${id}: the white delineators are the heavier plastic ones (dpost), none of the old`, (r.kinds.dpost || 0) > 0 && !r.kinds.post, JSON.stringify(r.kinds));
    if (w.fixed) T.check(`${id}: behind the fence all signs and boards stay fixed (in the static mesh, none knockable), each wholly past the barrier line`, r.fixed === r.n && r.n > 10 && r.mesh && r.meshVerts > 0 && !r.kinds.rssign && !r.kinds.rschev && !r.kinds.rsboard && r.fixedOk, `${r.fixed} of ${r.n} fixed, ${r.meshVerts} vertices`);
    else T.check(`${id}: what a car can reach is knockable (rssign, rschev, rsboard in the race)`, (r.kinds.rssign || 0) + (r.kinds.rschev || 0) + (r.kinds.rsboard || 0) >= r.n - r.fixed && r.n - r.fixed > 0 && r.fixedOk, `${r.n - r.fixed} knockable of ${r.n}`);

    // a second build of the same world: the same signs, the same props
    const sig2 = await page.evaluate(() => { const g = window.__game, Tr = g.race.track; Render.buildWorld(Tr, 1, 2); const W = Render.world; return JSON.stringify(W.rsItems || []) + '|' + W.props.map(p => [p.kind, p.x.toFixed(3), p.z.toFixed(3), p.col].join(',')).join(';'); });
    T.check(`${id}: a second build places the same (deterministic)`, sig2 === r.sig, sig2 === r.sig ? '' : 'differs');
    await page.evaluate(async () => { const g = window.__game, old = g.race, wait = (ms) => new Promise(rr => setTimeout(rr, ms)); g.onAction('restart'); for (let k = 0; k < 600 && g.race === old; k++) await wait(100); await wait(300); g.pause(); });

    // knocks: the car (25 m/s, kinematic) straight along the road's way at the first knockable sign of each kind after the start, its side 0.4 m into
    // what collides (a sign's pole, a board's near leg); every other prop out of the way for the moment (the race is started again after)
    if (!w.fixed) {
      const k = await page.evaluate(() => {
        const g = window.__game, R = g.race, Tr = R.track, P = R.player, v = 25, dt = 1 / 60, out = {};
        const knock = (b, over) => {   // over: how far the car's side reaches past what collides (negative: the car's middle on the board's, between its legs)
          const q = Tr.query(b.x, b.z, b.qi, {}), i = q.i, hd = Tr.hd[i], tx = Math.cos(hd), tz = Math.sin(hd), sd = Math.sign(q.d), lx = Tr.nx[i] * sd, lz = Tr.nz[i] * sd;   // (l: away from the road)
          let cx = b.x, cz = b.z;
          if (b.K.legs) { let best = 1e9; for (const L of b.K.legs) { const a = -(Math.atan2(2 * (b.qw * b.qy), 1 - 2 * b.qy * b.qy)), c = Math.cos(a), s = Math.sin(a), x = b.x + L[0] * c - L[1] * s, z = b.z + L[0] * s + L[1] * c, d = (x - b.x) * lx + (z - b.z) * lz; if (d < best) { best = d; cx = x; cz = z; } } }
          const off = over == null ? 0 : P.rad + b.K.rh - over, x0 = (over == null ? b.x : cx) - lx * off - tx * 30, z0 = (over == null ? b.z : cz) - lz * off - tz * 30, y0 = Tr.hy ? Tr.hy[i] : 0;
          const others = R.props.filter(o => o !== b && !o.dead); for (const o of others) o.dead = true;
          const dm0 = P.dmg, bx = b.x, bz = b.z; let first = 0, loss = 0, hits = 0, top = b.y; P.dmgMode = P.dmgMode || 1;
          for (let n = 0; n < 120; n++) { const t = n * v * dt; P.place(x0 + tx * t, z0 + tz * t, hd); P.y = P.py = y0; P.q = Tr.query(P.x, P.z, i, P.q); P.roadY = P.y;
            P.speed = v; P.vx = tx * v; P.vz = tz * v; P.w = 0; R.stepProps(dt); const l = Math.max(0, 1 - Math.hypot(P.vx, P.vz) / v); if (l > 1e-6) { hits++; if (!first) first = l; loss += l; } top = Math.max(top, b.y); }
          for (const o of others) o.dead = false;
          return { first: +(first * 100).toFixed(2), loss: +(loss * 100).toFixed(2), hits, dmg: +((P.dmg - dm0) * 100).toFixed(2), moved: +Math.hypot(b.x - bx, b.z - bz).toFixed(2), rose: +(top - (y0 + b.K.h0)).toFixed(2), d: Math.round(q.s - Tr.startS) };
        };
        const first = (kind) => R.props.find(b => b.kind === kind && b.qi * Tr.ds > Tr.startS + 200);
        for (const kind of ['rssign', 'rschev', 'rsboard', 'dpost']) { const b = first(kind); if (b) out[kind] = knock(b, 0.4); }
        const B = R.props.filter(b => b.kind === 'rsboard')[1]; if (B) out.between = knock(B, null);   // (another board: the car's middle on its middle, between the legs, under it)
        return out;
      });
      console.log(`   ${id} knocks at 90 km/h: ${Object.entries(k).map(([kk, v]) => `${kk} @${v.d} m: the first knock -${v.first} % speed (${v.hits} in all -${v.loss} %), +${v.dmg} % damage, moved ${v.moved} m`).join('; ')}`);
      for (const kind of ['rssign', 'rschev', 'rsboard', 'dpost']) { const v = k[kind]; if (!v) continue;
        T.check(`${id}: knocking a ${kind} at 90 km/h costs a little speed and a small dent, it flies off`, v.first > 0.3 && v.first < 5 && v.dmg > 0 && v.dmg < 2 && v.moved > 1.5, `the first knock -${v.first} % speed, +${v.dmg} % damage, it moved ${v.moved} m`); }
      if (k.between) T.check(`${id}: a board collides at its legs: a car between them passes under it untouched`, k.between.loss === 0 && k.between.dmg === 0 && k.between.moved === 0, JSON.stringify(k.between));
      await page.evaluate(async () => { const g = window.__game, old = g.race, wait = (ms) => new Promise(rr => setTimeout(rr, ms)); g.onAction('restart'); for (let k = 0; k < 600 && g.race === old; k++) await wait(100); await wait(300); g.pause(); });
    }

    // at night: the street lamps' pools of light only in the settlements (the builder's lamp zones), the sign faces shine
    const n = await page.evaluate(() => {
      const g = window.__game, Tr = g.race.track, W = Render.world; g.S.tod = 'night'; Render.setAtmos({ season: 'summer', tod: 'night' }, true); Render.frame(1 / 60, 1, g.race.player, 'chase', {});
      const L = Render.show.lamps || [], Z = W.lampZones || [], out = { n: L.length, outside: 0 };
      for (const [x, , z] of L) { const d = Tr.nearestIdx(x, z) * Tr.ds - Tr.startS; if (!Z.some(z0 => d > z0[0] - 25 && d < z0[1] + 25)) out.outside++; }
      out.glow = W.rsMesh ? W.rsMesh.material.emissive.r : null; out.zones = Z.length;
      g.S.tod = 'day'; Render.setAtmos({ season: 'summer', tod: 'day' }, true); out.dayGlow = W.rsMesh ? W.rsMesh.material.emissive.r : null; out.dayLamps = (Render.show.lamps || []).length;
      return out;
    });
    if (w.dark) T.check(`${id}: no settlement on the road: dark at night (no street lamps)`, n.zones === 0 && n.n === 0, `${n.n} pools of light, ${n.zones} built-up stretches`);
    else T.check(`${id}: at night the street lamps light the road only in the settlements`, n.zones > 0 && n.n > 0 && n.outside === 0 && n.dayLamps === 0, `${n.n} pools of light, ${n.outside} outside the ${n.zones} built-up stretches`);
    if (n.glow != null) T.check(`${id}: at night the sign faces shine, by day not`, n.glow > 0.3 && n.dayGlow === 0, `emissive ${n.glow} at night, ${n.dayGlow} by day`);
  }
  // a road without a settlement: dark at night (no lamps); a circuit keeps its floodlights every 30 m
  for (const [id, want] of [['pikes', 'none'], ['spa', 'all']]) {
    await startTrack(page, id);
    const n = await page.evaluate(() => { const g = window.__game, Tr = g.race.track; g.S.tod = 'night'; Render.setAtmos({ season: 'summer', tod: 'night' }, true); const n = (Render.show.lamps || []).length; g.S.tod = 'day'; Render.setAtmos({ season: 'summer', tod: 'day' }, true); return { n, all: Math.floor(Tr.len / 30) }; });
    T.check(want === 'none' ? `${id}: a road with no settlement on it is dark at night (no street lamps)` : `${id}: a circuit keeps its floodlights every 30 m at night`, want === 'none' ? n.n === 0 : n.n === n.all, `${n.n} lamps (every 30 m: ${n.all})`);
  }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
