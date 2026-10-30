// The player's garage, the pits and their exit (js/render.js crewGarage, crewMarks, crewExit; the player's car's dirt, dirtyCarMat), on
// every circuit with pits (not the test tracks), and Bathurst, Avstralija step by step (the profile's name Ana Lipnik):
// 1. 44 the garage door: where the garage's front is closed (World's gar.wall at the front: Bathurst's
//    garages, Bang Saen's marquee) that door in the player's colour, down to the floor; where the front is open between the
//    door's pillars (gar.jamb) a light grey roller door between them, down to the top of the opening; both while no stop is under way
//    (Crystal Palace's stall, Detroit's and Trois-Rivières' tents and Longford's shed, open at the front: none). 95C the flags: by every
//    garage's left-hand pillar an upright cloth out towards the lane, facing along it, in its crew's colour with its driver's three
//    letters (the player's: the profile name's first three letters, ANA; 5a), on a pole 4 m tall. 72 the stack of used tyres: by the
//    right-hand pillar three tyres to begin with lying flat in two piles (2 + 1), each up on the one below, the rest of its twelve not
//    drawn. 48 the tyre marks: in
//    front of every crew's garage two dark arcs from where the car stands in the box out to the lane, fading as they go. 5 and 76 the pit
//    exit: by the end of the pit wall on the way out (Track.pitJ gb) the light's post and the marshal.
// 2. Bathurst, a stop: the door down until the car comes down the lane to it (the crew's 'ready'), up within 1.6 s, up through the stop,
//    down again once the crew is back in its garage (within 2.6 s), and with the crew back in the stack four tyres higher for the stop's
//    new tyres (P3: 3 + 4 a stop with new tyres, at most 12, by turns on the two piles); the light red before the start, green in the race,
//    red under a red flag (7A: the race stopped, Race.fl.red); the blue flag only
//    while a car is on its way out of the lane and another comes along the circuit to where they meet (within 4 s of it), its cloth gone
//    otherwise; the light red while the safety car comes past the way out.
// 3. 87 the car's dirt: on the grass it builds up (four wheels, a second: more than 0.012), its colour halfway to the mud's (dirtW ~0.55),
//    on gravel a light dust (0.15), through a puddle or in the rain mud (1); not on the asphalt or the cobbles.
// 4. 5a the player's flag: the profile name's first three letters, letters only (»7 Žan-Luka« ŽAN); no name: IGR.
//   node tests/browser/pitkit.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the garage door, the flag, the used tyres, the tyre marks, the pit exit, the dirt');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', zoom: 1.2, name: 'Ana Lipnik', damage: 2, fuel: 1 }, { width: 640, height: 360 }, { seed: 4 });
  const ids = await page.evaluate(() => Core.TRACKS.filter(d => d.pit && !d.open && !d.test).map(d => d.id));
  const res = [];
  for (const id of ids) {
    await startTrack(page, id);
    res.push(await page.evaluate(() => {
      const g = window.__game; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
      const race = g.race, P = race.player, Tk = race.track, c = Render.crew, out = { id: Tk.def.id, bad: [] }; if (!c || !c.roles || !c.gar) return Object.assign(out, { bad: ['no garage'] });
      { let n = 0; Render.scene.traverse(o => { if (o.name === 'pitExit') n++; }); out.exits = n; }   // (the exit's post of the track before is gone: setupCrew takes the crew's exit group out with the crew's)
      const bx = c.roles.bx, G = bx.gar || {}, X = c.gar, m4 = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), cl = new THREE.Color();
      const PAINT = new THREE.Color(P.color).getHex(), loc = (x, z) => ({ a: (x - bx.ox) * bx.tx + (z - bx.oz) * bx.tz, w: (x - bx.ox) * bx.nx + (z - bx.oz) * bx.nz });   // (along the box, out from the centre line)
      // the door
      out.door = X.door ? X.door.part : null;
      if (X.door) { c.M.rod.getMatrixAt(X.door.i, m4); m4.decompose(v, q, sc); c.M.rod.getColorAt(X.door.i, cl); const E = m4.elements, L = loc(v.x + E[8] / 2, v.z + E[10] / 2), y0 = bx.y || 0;   // (a rod from one end along its z: the door's middle half way along it)
        out.doorH = +sc.y.toFixed(2); out.doorW = +sc.z.toFixed(2);
        if (Math.abs(sc.y - (X.door.y1 - (X.door.ya || 0.02))) > 0.05) out.bad.push('door not down ' + sc.y.toFixed(2));
        const jw = (() => { if (X.door.part !== 'jamb') return X.door.a1 - X.door.a0; const p = [1, 2].map(k => { c.M.rod.getMatrixAt(X.door.i - 3 + k, m4); return new THREE.Vector3().setFromMatrixPosition(m4); }); return p[0].distanceTo(p[1]) - G.jamb[2]; })();   // (between the pillars as they stand: on a bend the row is curved)
        if (Math.abs(sc.z - jw) > 0.3) out.bad.push('door width ' + sc.z.toFixed(2) + ' for ' + jw.toFixed(2));
        if (Math.abs(L.a) > 0.6 || Math.abs(L.w - X.door.w) > 0.4) out.bad.push('door at ' + L.a.toFixed(1) + '/' + (L.w - X.door.w).toFixed(2));
        if (X.door.part === 'jamb' ? cl.getHSL({}).s > 0.1 || cl.getHSL({}).l < 0.6 : cl.getHex() !== PAINT) out.bad.push('door colour ' + cl.getHexString()); }   // (a light grey roller door; Bang Saen's front its paint, as before)
      const front = G.jamb ? G.jamb[0] : G.band ? G.band[0] : bx.base + 9, want = G.wall && G.wall[0] < front + 0.6 ? 'wall' : G.jamb ? 'jamb' : null;   // (a closed front rolls up; an open one between pillars gets a grey door)
      if (out.door !== want) out.bad.push('door ' + out.door + ' (want ' + want + ')');
      // the flags: one at every garage, its crew's colour, its driver's three letters (the player's: LIP), the pole in front of the left
      // pillar, the cloth from it out towards the lane, facing along the lane (its points all as far along it as the pole), ~2.6 m tall
      const F = c.grp.children.find(o => o.name === 'pitFlags'), B0 = Render.world.pitBoxes, c3 = (n) => (String(n || 'TI').split(/[\s.]+/).filter(Boolean).pop() || 'TI').slice(0, 3).toUpperCase();
      if (!F) out.bad.push('no flags'); else { const U = F.userData, A = F.geometry.attributes.position.array, per = 8; out.flag = U.flags.map(f => f.code).join(' ');
        if (U.flags.length !== B0.length) out.bad.push('flags ' + U.flags.length + ' for ' + B0.length + ' garages');
        U.flags.forEach((f, j) => { const b = B0[j], Gb = b.gar || {}, fr = Gb.jamb ? Gb.jamb[0] : Gb.band ? Gb.band[0] : b.base + 9, hwb = Gb.jamb ? Gb.jamb[1] : Gb.band ? Gb.band[3] - 0.15 : 4.56, lb = (x, z) => ({ a: (x - b.ox) * b.tx + (z - b.oz) * b.tz, w: (x - b.ox) * b.nx + (z - b.oz) * b.nz });
          const want = b.mine ? 'ANA' : c3(b.drv && b.drv.name), L = lb(f.pole[0], f.pole[1]), pts = []; for (let k = 0; k < per; k++) pts.push(Object.assign(lb(A[(j * per + k) * 3], A[(j * per + k) * 3 + 2]), { y: A[(j * per + k) * 3 + 1] - (b.y || 0) }));
          if (f.code !== want || f.col !== b.col.getHex() || (b.mine && f.col !== PAINT)) out.bad.push('flag ' + j + ' ' + f.code + '/' + want + ' #' + f.col.toString(16));
          if (Math.abs(L.a + hwb) > 0.2 || L.w > fr || L.w < fr - 0.6) out.bad.push('flag ' + j + ' pole at ' + L.a.toFixed(2) + '/' + (L.w - fr).toFixed(2));
          if (!pts.every(p => Math.abs(p.a - L.a) < 0.12) || !(pts[per - 1].w < pts[0].w - 1.2) || Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y)) < 2.4) out.bad.push('flag ' + j + ' cloth ' + JSON.stringify(pts.map(p => [+p.a.toFixed(2), +(p.w - fr).toFixed(2)])));
        }); }
      // the stack: two piles by the right-hand pillar, each tyre up on the one below, lying flat (the axle up); the slots past the tyres
      // laid not drawn (scale 0)
      const S = X.stack, piles = [[], []]; let gone = 0;
      for (let j = 0; j < S.n; j++) { c.M.tyre.getMatrixAt(S.t0 + j, m4); m4.decompose(v, q, sc); if (sc.x < 0.01) { gone++; continue; } if (gone) out.bad.push('tyre ' + j + ' drawn past one not drawn');
        const ax = new THREE.Vector3(1, 0, 0).applyQuaternion(q), L = loc(v.x, v.z); piles[j % 2].push({ y: v.y - (bx.y || 0), a: L.a, w: L.w, up: Math.abs(ax.y) }); }
      out.stack = piles.map(p => p.length).join('+'); out.stackN = S.n;
      if (S.n !== 12) out.bad.push('tyre slots ' + S.n);
      for (const p of piles) p.forEach((t, k) => { if (t.up < 0.98 || Math.abs(t.a - (X.hw - 0.05)) > 0.25 || t.w > X.front || t.w < X.front - 1.6 || (k && !(t.y > p[k - 1].y + 0.2 && t.y < p[k - 1].y + 0.35))) out.bad.push('tyre ' + JSON.stringify(t)); });
      // the marks: in front of every garage, from the box out to the lane, fading
      const Mk = c.grp.children.find(o => o.name === 'pitMarks'), B = Render.world.pitBoxes;
      if (!Mk) out.bad.push('no marks'); else { const P = Mk.geometry.attributes.position.array, C = Mk.geometry.attributes.color.array, n = P.length / 3, per = 2 * 9 * 2;
        out.marks = n / per; if (n !== B.length * per) out.bad.push(n + ' mark vertices for ' + B.length + ' boxes');
        B.forEach((b, i) => { for (let m = 0; m < 2; m++) { const o = i * per + m * 18, a0 = C[(o) * 4 + 3], a1 = C[(o + 16) * 4 + 3], w0 = (P[o * 3] - b.ox) * b.nx + (P[o * 3 + 2] - b.oz) * b.nz, w1 = (P[(o + 16) * 3] - b.ox) * b.nx + (P[(o + 16) * 3 + 2] - b.oz) * b.nz;
          if (!(a0 > 0.4 && a1 < 0.02 && w0 > b.base && w0 < b.base + 9 && w1 < w0 - 0.5)) out.bad.push('mark ' + i + '/' + m + ' ' + [a0, a1, w0 - b.base, w1 - b.base].map(x => x.toFixed(2))); } }); }
      // the exit's post
      const E = c.exit, J = Tk.pitJ(); if (!E) out.bad.push('no exit post'); else { let d = ((Tk.query(E.x, E.z, -1, {}).s - Tk.startS) % Tk.len + Tk.len) % Tk.len; if (d > Tk.len / 2) d -= Tk.len; out.exitD = +(d - J.gb).toFixed(1); if (Math.abs(d - J.gb + 4) > 3) out.bad.push('exit post at ' + d.toFixed(1) + ' (the wall ends at ' + J.gb + ')');
        // its size, for the camera behind the car (P5: twice the first: the post with its housing 6.2 m, the lamps 0.72 m, the marshal 3.7 m with his hand at 3.1 m), all beside the wall's end
        // on the lane's side (not over the circuit's edge: no more than 0.35 m past the wall's line towards it)
        const pe = E.grp.children.find(o => o.name === 'pitExit'), PA = pe.geometry.attributes.position.array, LA = E.lm.geometry.attributes.position.array, sd = Tk.def.pit[0] < 0 ? -1 : 1, p0 = Tk.pitAt(Tk.startS + J.gb - 4), qq = {};
        let lat = 1e9, y0 = 1e9, y1 = -1e9, m0 = 1e9, m1 = -1e9;
        for (let i = 0; i < PA.length; i += 3) { const qd = Tk.query(PA[i], PA[i + 2], -1, qq); lat = Math.min(lat, qd.d * sd - (p0 ? p0.wall : 0)); y0 = Math.min(y0, PA[i + 1]); y1 = Math.max(y1, PA[i + 1]);
          if (Math.hypot(PA[i] - E.hand[0], PA[i + 2] - E.hand[2]) < 1.2) { m0 = Math.min(m0, PA[i + 1]); m1 = Math.max(m1, PA[i + 1]); } }
        const lampW = Math.hypot(LA[3] - LA[0], LA[5] - LA[2]);
        out.exitSz = { post: +(y1 - y0).toFixed(2), marshal: +(m1 - m0).toFixed(2), hand: +(E.hand[1] - m0).toFixed(2), lamp: +lampW.toFixed(2), lat: +lat.toFixed(2) };
        if (y1 - y0 < 5 || m1 - m0 < 3.4 || E.hand[1] - m0 < 2.9 || lampW < 0.6 || lat < -0.35) out.bad.push('exit size ' + JSON.stringify(out.exitSz)); }
      return out;
    }));
  }
  T.check('13 circuits with pits', ids.length === 13 && res.length === 13, ids.join(', '));
  T.check('one exit post in the scene on each circuit, after the ones before it (a new track takes the old exit\'s light and marshal out: setupCrew)', res.every(r => r.exits === 1), res.map(r => r.id + ' ' + r.exits).join(', '));
  T.check('44 the garage door: a closed front (gar.wall at the front) rolls, an open one between pillars gets a light grey roller door, none on the open tents and shed; down while no stop is under way',
    res.every(r => !r.bad.some(b => /^door/.test(b))), res.map(r => `${r.id} ${r.door || '-'}${r.doorH ? ' ' + r.doorH + ' m' : ''} ${r.bad.filter(b => /^door/.test(b)).join('; ')}`).join(', '));
  T.check('95C the flags: at every garage by its left pillar, in its crew\'s colour, its driver\'s three letters (the player\'s ANA: Ana Lipnik, the profile name\'s first three, 5a), the cloth out towards the lane facing along it, ~2.6 m tall', res.every(r => !r.bad.some(b => /^(flag|no flag)/.test(b))), res.map(r => `${r.id} ${r.flag} ${r.bad.filter(b => /flag/.test(b)).slice(0, 2).join('; ')}`).join(', '));
  T.check('72 the stack of used tyres: three by the right pillar to begin with, in two piles (2 + 1), lying flat, each up on the one below; the rest of its twelve not drawn', res.every(r => r.stack === '2+1' && !r.bad.some(b => /^tyre/.test(b))), res.map(r => `${r.id} ${r.stack} ${r.bad.filter(b => /^tyre/.test(b)).slice(0, 2).join('; ')}`).join(', '));
  T.check('48 the tyre marks: two in front of every crew\'s garage, from the box towards the lane, fading out', res.every(r => !r.bad.some(b => /mark/.test(b))), res.map(r => `${r.id} ${r.marks} ${r.bad.filter(b => /mark/.test(b)).slice(0, 2).join('; ')}`).join(', '));
  T.check('5 and 76 the exit\'s post at the end of the pit wall on the way out, twice as big as at first (the post with its housing 6.2 m, the lamps 0.72 m, the marshal 3.7 m, his hand 3.1 m up), on the lane\'s side of the wall', res.every(r => !r.bad.some(b => /exit/.test(b))), res.map(r => `${r.id} ${r.exitD} ${r.exitSz ? JSON.stringify(r.exitSz) : ''} ${r.bad.filter(b => /exit/.test(b)).join('; ')}`).join(', '));

  // 2. Bathurst step by step
  await startTrack(page, 'bathurst');
  const B = await page.evaluate(() => {
    const g = window.__game, P = g.race.player, Tk = g.race.track, c = Render.crew, X = c.gar, E = c.exit, out = { light: {}, door: [], blue: {} };
    const lamp = () => { const C = E.lc; return C[0] > 0.9 && C[1] < 0.2 ? 'red' : C[13] > 0.9 ? 'green' : '?'; }, fr = () => Render.frame(1 / 30, 1, P, 'chase', {});
    const cloth = () => { const p = E.lp; return Math.hypot(p[27] - p[24], p[29] - p[26]); };
    g.pause(); Render.scene.visible = false; fr(); out.light.grid = lamp();   // (the scene not drawn: the frames only step the pit's logic)
    for (let k = 0; k < 400 && g.phase !== 'racing'; k++) { g.sim(0.1, true); fr(); }
    g.sim(0.2, true); fr(); fr(); out.light.race = lamp();
    { const F0 = g.race.fl; g.race.fl = Object.assign({}, F0 || {}, { red: true }); fr(); fr(); out.light.red = lamp(); g.race.fl = F0; fr(); fr(); out.light.after = lamp(); }   // (7A: a red flag, the race stopped; the game has none of its own yet)
    // the rule of the blue flag (the race stood still, two cars put where it looks for them)
    const J = Tk.pitJ(), L = Tk.len, at = (d) => Tk.startS + d, cars = g.race.cars.filter(x => !x.isPlayer), A = cars[0], C2 = cars[1], keep = [A, C2].map(o => ({ o, s: o.q.s, pitG: o.pitG, pitDone: o.pitDone, inPit: o.inPit, vx: o.vx, vz: o.vz }));
    const put = (o, s, pitG, done, sp) => { o.q.s = s; o.pitG = pitG; o.pitDone = done; o.inPit = false; o.vx = sp; o.vz = 0; };
    const blueNow = () => { for (let k = 0; k < 12; k++) fr(); return +E.blue.toFixed(2); };
    put(A, at(J.gb - 20), true, true, 15); put(C2, at(J.b - 60), false, false, 40); out.blue.both = blueNow(); out.blue.cloth = +cloth().toFixed(2);
    put(C2, at(J.b - 300), false, false, 40); out.blue.far = blueNow();   // (7.5 s away)
    put(C2, at(J.b - 60), false, false, 40); put(A, at(J.gb - 300), false, false, 40); out.blue.noneOut = blueNow(); out.blue.clothOff = +cloth().toFixed(3);
    for (const k of keep) Object.assign(k.o, { pitG: k.pitG, pitDone: k.pitDone, inPit: k.inPit, vx: k.vx, vz: k.vz }), k.o.q.s = k.s;
    fr();
    // the stop: the door as the car comes down the lane, through the stop and after it
    for (let k = 0; k < 40000; k++) { if (!P.inPit && !Tk.pitAt(P.q.s) && !P.pitWant) P.pitWant = true; if (P.pitWant && Tk.pitAt(P.q.s + 90) && !Tk.pitAt(P.q.s)) break; g.sim(0.05, true); }
    let t = 0, last = '', tR = null, tUp = null, tHome = null, tDown = null, upAll = true;
    for (let k = 0; k < 9000; k++) { g.sim(1 / 30, !P.inPit && !P.pitDone, 0, 0); fr(); t += 1 / 30;   // (the autopilot to the way in, then the game's own in the lane)
      const md = c.mode, o = X.open; if (md + (o >= 1 ? 'U' : o <= 0 ? 'D' : 'm') !== last) { last = md + (o >= 1 ? 'U' : o <= 0 ? 'D' : 'm'); out.door.push([+t.toFixed(2), md, +o.toFixed(2)]); }
      if (md === 'ready' && tR == null) tR = t; if (tR != null && tUp == null && o >= 1) tUp = t; if (md === 'work' && o < 1) upAll = false;
      if (P.pitDone && md === 'home' && tHome == null) tHome = t; if (tHome != null && tDown == null && o <= 0) { tDown = t; break; } }
    out.doorT = { up: tUp != null && tR != null ? +(tUp - tR).toFixed(2) : null, down: tDown != null ? +(tDown - tHome).toFixed(2) : null, upAll };
    { const S = X.stack, m4 = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), piles = [[], []];   // (P3: the stack once the crew is back in)
      for (let j = 0; j < S.n; j++) { c.M.tyre.getMatrixAt(S.t0 + j, m4); m4.decompose(v, q, sc); if (sc.x > 0.01) piles[j % 2].push(+(v.y - (X.stack.y0 || 0)).toFixed(3)); }
      out.stack = { tyN: P.ty ? P.ty.n : null, n: piles[0].length + piles[1].length, piles: piles.map(p => p.length).join('+'), up: piles.every(p => p.every((y, k) => !k || (y > p[k - 1] + 0.2 && y < p[k - 1] + 0.35))) }; }
    Render.scene.visible = true;
    return out; });
  T.check('5 the light: red before the start, green in the race; 7A red under a red flag (the race stopped), green again after it', B.light.grid === 'red' && B.light.race === 'green' && B.light.red === 'red' && B.light.after === 'green', JSON.stringify(B.light));
  T.check('76 the blue flag: out while a car leaves the lane and another comes to where they meet within 4 s (the cloth out, waving: half a metre and more off the hand), not for one 7 s away, not with nobody leaving (the cloth gone)',
    B.blue.both > 0.9 && B.blue.cloth > 0.5 && B.blue.far === 0 && B.blue.noneOut === 0 && B.blue.clothOff < 0.01, JSON.stringify(B.blue));
  T.check('P3 the stack after a stop with new tyres, the crew back in: four tyres more (3 + 4 a stop, by turns on the two piles), each up on the one below',
    B.stack.tyN >= 1 && B.stack.n === Math.min(12, 3 + 4 * B.stack.tyN) && B.stack.up, JSON.stringify(B.stack));
  T.check('44 the door at a stop: up within 1.6 s of the crew getting ready, up through the stop, down within 2.6 s once the crew is back in',
    B.doorT.up != null && B.doorT.up <= 1.7 && B.doorT.upAll && B.doorT.down != null && B.doorT.down <= 2.7, JSON.stringify({ t: B.doorT, door: B.door }));

  // 4. 5a the player's flag with other names: letters only, the first three; none: IGR
  const nm = [];
  for (const [name, want] of [['7 Žan-Luka', 'ŽAN'], ['', 'IGR']]) {
    await page.evaluate((n) => { window.__game.S.name = n; }, name); await startTrack(page, 'bathurst');
    nm.push(await page.evaluate((w) => { const c = Render.crew, F = c.grp.children.find(o => o.name === 'pitFlags'), B0 = Render.world.pitBoxes, j = B0.findIndex(b => b.mine); return { got: F && j >= 0 ? F.userData.flags[j].code : null, want: w }; }, want));
  }
  T.check('5a the player\'s flag: the profile name\'s first three letters, letters only (»7 Žan-Luka« ŽAN), no name IGR', nm.every(r => r.got === r.want), JSON.stringify(nm));

  // 3. the dirt (the race stood still, the player's wheels put on each surface, a second of frames)
  const D = await page.evaluate(() => {
    const g = window.__game, P = g.race.player, v = Render.viewOf(P), out = {}; g.pause(); Render.scene.visible = false;
    const run = (sf, wet) => { v.dirtU.value = 0; v.dirtW.value = 0; const ws = P.ws.slice(), sp = P.speed; for (let k = 0; k < 4; k++) P.ws[k] = sf; Render.wetFx && 0;
      for (let k = 0; k < 30; k++) Render.frame(1 / 30, 1, P, 'chase', {}); const r = [+v.dirtU.value.toFixed(4), +v.dirtW.value.toFixed(2)]; for (let k = 0; k < 4; k++) P.ws[k] = ws[k]; return r; };
    out.asphalt = run(0); out.grass = run(2); out.gravel = run(3); out.puddle = run(6); out.cobbles = run(7); Render.scene.visible = true;
    return out; });
  T.check('87 the dirt: on the grass it builds up (more than 0.012 a second on four wheels, standing), halfway to mud\'s colour; gravel a light dust, a puddle mud; none on the asphalt or the cobbles',
    D.asphalt[0] === 0 && D.cobbles[0] === 0 && D.grass[0] > 0.012 && Math.abs(D.grass[1] - 0.55) < 0.02 && Math.abs(D.gravel[1] - 0.15) < 0.02 && Math.abs(D.puddle[1] - 1) < 0.02 && D.puddle[0] > D.grass[0] * 0.99, JSON.stringify(D));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
