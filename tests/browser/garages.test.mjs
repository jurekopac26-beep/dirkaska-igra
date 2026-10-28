// The crews' garages in their colours (js/render.js crGarSlab, World's out.pitBoxes gar), on every circuit with pits (not the test tracks),
// the player's paint green (the car screen's Barva, the 6th colour; an AI car may have the same, so the colour alone does not find the box):
// 1. The colours: the player's crew in the player's paint, every AI car stops at a box with a crew (a field of 22 shares the 12 boxes: the crew in the colour of one of the cars stopping there; Townsville's park has 10 bays for
//    the 13 boxes: there the cars whose box has one) in that car's colour; over each garage's door a band in its crew's colour; the
//    player's garage also in the player's paint (its back wall or, where the front is closed, its door; the door's pillars where it has
//    them), and no other garage.
// 2. Where they are: each band and each of the player's panels in sight from the lane in front of its box (its grey roller door up, as
//    during a stop: pitkit.test.mjs; nothing of the world in front of it: not buried in the wall or the roof) and on the face it covers (the world right behind it: not floating; a door may
//    stand a little before a dark inside; Crystal Palace's stall has no back wall, its cloth hangs behind the back posts, and Longford's
//    board hangs under the shed's eave). Where two neighbouring garages overlap on a bend (Trois-Rivières' first tents), one stands before
//    the other: those bands only on their faces, at most 3 of them.
//   node tests/browser/garages.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the garages in the crews\' colours');
const srv = await serve();
const browser = await launch();
const GREEN = 0x2fa84f;   // (game.js PLAYER_COLORS[5])
const FREE = new Set(['cpalace wall', 'longford band']);   // (hung in the air: no face behind them)
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2, carV: 2, color: 5 }, { width: 640, height: 360 });
  const ids = await page.evaluate(() => Core.TRACKS.filter(d => d.pit && !d.open && !d.test).map(d => d.id));
  T.check('13 circuits with pits (the test tracks left out)', ids.length === 13, ids.join(', '));
  const res = [];
  for (const id of ids) {
    await startTrack(page, id);
    res.push(await page.evaluate(async ([GREEN, free]) => {
      const FREE = new Set(free);
      const g = window.__game; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
      const race = g.race, P = race.player, Tk = race.track, L = Tk.len, W = Render.world, B = W.pitBoxes || [], c = Render.crew, out = { id: Tk.def.id, bad: [] };
      if (!c || !c.roles) return Object.assign(out, { bad: ['no player\'s crew'] });
      const rod = c.M.rod, mine = c.roles.bx, hex = (col) => col.getHex(), m4 = new THREE.Matrix4(), cl = new THREE.Color();
      // 1. the colours
      out.paint = P.color === GREEN && hex(mine.col) === GREEN && mine.mine;
      const crewOf = (bx) => c.men.filter(m => m.bx === bx);
      out.ownCrew = crewOf(mine).length >= 16 && crewOf(mine).every(m => hex(m.team) === GREEN) && c.men.every((m, i) => m.bx !== mine || (c.M.trunk.getColorAt(i, cl), cl.getHex() === GREEN));
      const at = (d) => B.find(b => !b.mine && Math.abs(((b.s - Tk.startS - d) % L + L * 1.5) % L - L / 2) < 1), ai = race.cars.filter(x => x !== P);
      const own = ai.filter(x => at(race._boxD(x)));   // (Townsville's park: 10 bays of 12 m for Core's 13 boxes of 10 m, so not every AI car stops in front of a crew)
      out.aiN = own.length + '/' + ai.length;
      const byBox = new Map(); for (const x of own) { const bx = at(race._boxD(x)); if (!byBox.has(bx)) byBox.set(bx, []); byBox.get(bx).push(x); }   // (a field of 22 shares the 12 boxes of the AI cars: several cars stop at one box, its crew in the colour of one of them)
      out.aiCrews = (B.length < 13 || own.length === ai.length) && [...byBox].every(([bx, xs]) => xs.some(x => hex(bx.col) === (x.color & 0xffffff)) && crewOf(bx).length > 0 && crewOf(bx).every(m => hex(m.team) === hex(bx.col)));
      out.twin = ai.some(x => (x.color & 0xffffff) === GREEN);   // (an AI car in the player's colour too: only the player's garage has the wall and the pillars)
      // the rods: the player's 13 (hoses, jack handles, the lollipop pole), a band per box, then the player's back wall (or door) and pillars
      const rb = 13, nB = B.length, inst = (i) => { rod.getMatrixAt(i, m4); const e = m4.elements; if (Math.hypot(e[8], e[9], e[10]) < 1e-6) return null;
        const ax = new THREE.Vector3(e[0], e[1], e[2]).normalize(); rod.getColorAt(i, cl); return { i, c: new THREE.Vector3(0, 0, 0.5).applyMatrix4(m4), z: new THREE.Vector3(e[8], e[9], e[10]), y: new THREE.Vector3(e[4], e[5], e[6]), x: ax, col: cl.getHex() }; };
      const bands = B.map((bx, j) => ({ bx, p: inst(rb + j), kind: 'band' })), extra = [0, 1, 2].map(k => inst(rb + nB + k));
      out.bandsCol = bands.every(b => b.p && b.p.col === hex(b.bx.col));
      const G = mine.gar || {}, want = (G.wall ? 1 : 0) + (G.jamb ? 2 : 0);
      out.minePanels = want >= 1 && extra.filter(Boolean).length === want && extra.every(p => !p || p.col === GREEN) && rod.count === rb + nB + 3 + 1 + nB;   // (then the garage's door and every garage's flag's pole: pitkit.test.mjs)
      out.parts = (G.wall ? 'wall' : '') + (G.jamb ? '+pillars' : '');
      // 2. where they are: the camera at the box (the world's scenery near it drawn), rays against the world's meshes and the rods
      const pt = (bx, a, w) => new THREE.Vector3(bx.ox + bx.tx * a + bx.nx * w, (bx.y || 0) + 1.6, bx.oz + bx.tz * a + bx.nz * w);
      { const E = pt(mine, -20, mine.lane), F = pt(mine, 0, mine.base + 8); Render.setShot({ px: E.x, py: E.y + 3, pz: E.z, tx: F.x, ty: F.y, tz: F.z, fov: 50, fogD: 120, near: 0.5, sky: true, noCut: true }); for (let k = 0; k < 2; k++) Render.frame(0.05, 1, P, 'chase', {}); Render.setShot(null); }
      if (c.gar && c.gar.door && c.gar.door.part === 'jamb') { c.gar.open = 1; Render.frame(0.001, 1, P, 'chase', {}); }   // (a grey roller door before the back wall: up, as during a stop; a closed front in the paint, gar.wall, stays down: it is the panel)
      const meshes = []; W.root.traverseVisible(m => { if (m.isMesh) meshes.push(m); });
      const rc = new THREE.Raycaster(), panels = bands.concat([{ bx: mine, p: extra[0], kind: 'wall' }, { bx: mine, p: extra[1], kind: 'pillar' }, { bx: mine, p: extra[2], kind: 'pillar' }].filter(q => q.p));
      out.n = panels.length; out.far = 0; out.ahead = [];
      // (where two neighbouring garages overlap, their fronts crossing in plan: Trois-Rivières' first tents on the bend, 1-6 m apart, one
      // stands before the other, its band and all: there the band is not looked for from the lane, only on its face)
      const ends = (p) => [[p.c.x - p.z.x / 2, p.c.z - p.z.z / 2], [p.c.x + p.z.x / 2, p.c.z + p.z.z / 2]], side = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
      const cross = (p, q) => { if (!p || !q) return false; const [a, b] = ends(p), [c, d] = ends(q); return side(a, b, c) !== side(a, b, d) && side(c, d, a) !== side(c, d, b); };
      bands.forEach((b, j) => { b.over = cross(b.p, bands[j - 1] && bands[j - 1].p) || cross(b.p, bands[j + 1] && bands[j + 1].p); });
      out.over = bands.filter(b => b.over).length;
      for (const q of panels) {
        const { bx, p } = q, n = p.x.clone(); if (n.x * bx.nx + n.z * bx.nz < 0) n.negate();   // (the panel's normal, out from the lane)
        const tgt = q.kind === 'pillar' ? p.c.clone().addScaledVector(p.y, 0.3) : q.kind === 'wall' ? p.c.clone().addScaledVector(p.z, 0.3) : p.c.clone();   // (a point on it clear of the garage's and the apron's kit: a band's middle, 30 % of the way to a pillar's top or to the wall's end)
        const E = pt(bx, 0, bx.lane), d = tgt.clone().sub(E), len = d.length();
        rc.set(E, d.normalize()); rc.far = len + 1;
        const hit = rc.intersectObjects(meshes.concat([rod]), false)[0];
        const seen = !!hit && hit.object === rod && hit.instanceId === p.i;
        const o = tgt.clone().addScaledVector(n, -0.05); rc.set(o, n); rc.far = 2;   // (from just in front of it, straight in: the face behind)
        const back = rc.intersectObjects(meshes, false)[0], gap = back ? back.distance - 0.064 : null;   // (0.064: from there to the face the panel was put on)
        const tol = q.kind === 'wall' ? 0.35 : 0.05, noFace = FREE.has(out.id + ' ' + q.kind);
        if (!seen && !q.over) out.bad.push(`${q.kind} of box ${bx.k}${bx.mine ? ' (the player\'s)' : ''} hidden (first hit ${hit ? (hit.object === rod ? 'rod ' + hit.instanceId : hit.object.name || hit.object.type) + ' at ' + hit.distance.toFixed(2) + ' of ' + len.toFixed(2) : 'nothing'})`);
        if (!noFace && (gap == null || gap > tol || gap < -0.01)) out.bad.push(`${q.kind} of box ${bx.k}${bx.mine ? ' (the player\'s)' : ''}: the face behind it ${gap == null ? 'missing' : gap.toFixed(3) + ' m away'}`);
        if (!noFace && gap != null) out.far = Math.max(out.far, q.kind === 'wall' ? 0 : gap);
      }
      return out;
    }, [GREEN, [...FREE]]));
    const r = res[res.length - 1];
    console.log(`   ${r.id}: ${r.n} panels (the player's ${r.parts}), ${r.bad.length ? r.bad.slice(0, 4).join('; ') : 'all in sight, each on its face'}${r.over ? ` (${r.over} bands where neighbouring garages overlap)` : ''}`);
  }
  const fail = (k) => res.filter(r => !r[k]).map(r => r.id).join(', ');
  T.check('the player\'s paint (green) on the player\'s box', res.every(r => r.paint), fail('paint'));
  T.check('the player\'s crew (every man of it) in the player\'s paint, overalls and all', res.every(r => r.ownCrew), fail('ownCrew'));
  T.check('every AI car stops at a box with a crew (where the world has a garage for it: all of them where it has 13), the crew (every man of it) in the colour of one of the cars stopping there (a field of 22 shares the 12 boxes)', res.every(r => r.aiCrews), fail('aiCrews') || res.map(r => r.id + ' ' + r.aiN).join(', '));
  T.check('a band over each garage\'s door in its crew\'s colour', res.every(r => r.bandsCol), fail('bandsCol'));
  T.check('the player\'s garage in the player\'s paint: its back wall (or door) and, where it has them, the door\'s pillars; no other garage', res.every(r => r.minePanels), fail('minePanels'));
  T.check('an AI car in the player\'s colour somewhere (the colour alone would not find the box)', res.some(r => r.twin), res.filter(r => r.twin).map(r => r.id).join(', '));
  T.check('each band and panel in sight from the lane, on the face it covers (bands and pillars within 5 cm of it, not buried, not floating); overlapping garages only on a bend, at most 3 bands', res.every(r => !r.bad.length && r.over <= 3),
    res.filter(r => r.bad.length || r.over > 3).map(r => `${r.id}: ${r.bad.slice(0, 3).join('; ')} (${r.over} overlapping)`).join(' | ') || `at most ${Math.max(...res.map(r => r.far)).toFixed(3)} m off; overlapping: ${res.filter(r => r.over).map(r => r.id + ' ' + r.over).join(', ') || 'none'}`);
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
