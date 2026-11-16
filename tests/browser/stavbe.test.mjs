// The houses' builder (js/world-stavbe.js; Realizem S0, the first piece: docs/realizem/paket-s.md »S0, prvi kos«). On the real tracks
// named in World.stavbe.PROGE a track's houses are built by the shared builder with the kit of the track's country (the walls' colours and
// finishes, the roofs, the roof's shapes) and a style's atlas of façades (windows, doors, shutters and roofing drawn in one texture, no
// geometry): Spa takes it (Belgium's kit: stone, whitewash and brick under slate), its halls, grandstands and pits stay its own. Checked:
// the table (every track of PROGE a real one in the game with a kit for its country; every real track of the realism's list has its
// country's kit; every kit's style, weights, colours, finishes and roofs are ones the styles have); Spa's houses (the world's count is
// what is in the world, the vertices under the package's budget, every vertex a number, at a house's footprint of the track's data, its
// place in the atlas inside the texture; one material for the walls with the style's one atlas, and nothing the map has not: no
// railings, balconies or yards); the houses show from the chase camera (the picture changes with them and only with them); every
// country's kit builds the same footprints (each style's atlas draws, the finishes and the roofs are the kit's), and on them the rule of
// the ground holds (the floor level over the ground's high side with a plinth down to the low side, a shed at most 0.6 m in the ground;
// a small building that runs into a larger one stands square against its wall; a door only where the ground is at the floor or steps
// reach it); what a track may ask for (yards, balconies, a fence of the map) adds to the plain houses, the railings in their own cut-out
// material with the same atlas; a track not in PROGE is built as before (Jezero), and Spa built again is the same to the vertex; on
// NIZKA the same houses; no errors.
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the houses\' builder');
const srv = await serve();
const browser = await launch();
// the world on screen: the builder's own count, and what is in the world (the meshes of its two materials, their vertices, how far a
// vertex stands from the nearest house footprint of the track's data, the texture's v of every vertex)
const look = (page) => page.evaluate(() => {
  const W = Render.world, S = World.stavbe, Tr = window.__game.race.track, st = (W.stats && W.stats.stavbe) || null;
  const r = { id: Tr.def.id, st, buildings: W.stats ? W.stats.buildings : null, hisa: 0, hisaV: 0, ograja: 0, ograjaV: 0, bad: 0, v: [1e9, -1e9], out: 0, mats: 0, rails: 0, mat: null, k0: 0 };
  const fp = (Tr.def.bld || []).filter(b => !b[6]).map(b => [b[0], b[1], Math.hypot(b[2], b[3]) / 2]), mh = new Set(), mr = new Set(); r.k0 = fp.length;
  W.root.traverse(o => {
    const k = o.isMesh && o.material && !Array.isArray(o.material) && o.material.userData.stavbe; if (!k) return;
    const P = o.geometry.attributes.position, uv = o.geometry.attributes.uv, n = P.count;
    if (k === 'hisa') { r.hisa++; r.hisaV += n; mh.add(o.material); } else { r.ograja++; r.ograjaV += n; mr.add(o.material); }
    for (let i = 0; i < n; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), v = uv ? uv.getY(i) : NaN;
      if (!isFinite(x + y + z + v + (uv ? uv.getX(i) : NaN))) { r.bad++; continue; }
      if (v < r.v[0]) r.v[0] = v; if (v > r.v[1]) r.v[1] = v;
      let d = 1e9; for (const f of fp) { const e = Math.hypot(x - f[0], z - f[1]) - f[2]; if (e < d) d = e; } if (d > r.out) r.out = d;
    }
  });
  r.mats = mh.size; r.rails = mr.size; r.out = Math.round(r.out * 10) / 10;
  const m = [...mh][0], f = [...mr][0];
  if (m && st) { const a = S.atlas(st.style); r.mat = { lambert: !!m.isMeshLambertMaterial, map: m.map === a, again: S.atlas(st.style) === a, vc: !!m.vertexColors, size: [a.image.width, a.image.height],
    rail: !!f && f.map === a && f.alphaTest > 0 && f !== m }; }
  return r;
});

try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', detail: 'high', shadows: 1, camera: 'chase' }, { width: 640, height: 360 });

  // the table: the tracks that take the houses, the kits by country, the styles
  const tab = await page.evaluate(() => {
    const S = World.stavbe, real = new Map(Core.TRACKS.filter(d => !d.test && !d.pending).map(d => [d.id, d])), bad = [];
    for (const [id, P] of Object.entries(S.PROGE)) { const d = real.get(id), c = d ? S.drzava({ def: d }) : '';
      if (!d) bad.push('not a real track: ' + id); else if (!c || S.komplet(c).drzava !== c) bad.push('no kit: ' + id + ' ' + c);
      if (!(P.raven >= 1 && P.raven <= 3)) bad.push('level: ' + id); }
    // (the real tracks of the realism's list, docs/realizem.md »Katere proge«: each one's country has its kit, before its houses are hooked)
    const list = ['spa', 'nring', 'rbring', 'montreal', 'livorno', 'balea', 'caracoles', 'chapman', 'katu', 'rastro', 'tianmen', 'pikes'], kits = [];
    for (const id of list) { const d = real.get(id); if (!d) continue; const c = S.drzava({ def: d }); kits.push(c); if (!c || S.komplet(c).drzava !== c) bad.push('no kit for ' + id + ' (' + c + ')'); }
    for (const [c, K] of Object.entries(S.KOMPLETI)) { const SY = S.STYLES[K.style]; if (!SY) { bad.push('style: ' + c); continue; }
      for (const w of K.walls || []) if (!(w[0] > 0) || w[1].length !== 3 || w[1].some(q => !(q >= 0 && q <= 1)) || !(w[2] >= 0 && w[2] <= (SY.fin || []).length)) bad.push('wall: ' + c);
      for (const q of K.roofs || []) if (!(q[0] > 0) || q[1].length !== 3 || q[1].some(e => !(e >= 0 && e <= 1)) || !(q[2] === 0 || (q[2] === 1 && SY.roof2))) bad.push('roof: ' + c);
      if (K.ravne != null && !(K.ravne >= 0 && K.ravne <= 1)) bad.push('flat roofs: ' + c); }
    const none = S.komplet('Nikjer');
    return { bad, proge: Object.keys(S.PROGE), kits: [...new Set(kits)].length, kompleti: Object.keys(S.KOMPLETI).length, slogi: Object.keys(S.STYLES).length, none: none.drzava === '' && !!none.style && none.walls.length > 0 && none.roofs.length > 0 };
  });
  T.check('the table: every track that takes the houses is a real one in the game with its country\'s kit, the realism\'s real tracks have their countries\' kits, every kit is of a style the atlas has (weights, colours, finishes, roofs); a country without a kit takes the plain one',
    tab.proge.includes('spa') && !tab.bad.length && tab.kits >= 10 && tab.kompleti >= tab.kits && tab.slogi >= 5 && tab.none, JSON.stringify(tab));

  await startTrack(page, 'jezero');
  const jez = await look(page);
  const jezNull = await page.evaluate(() => World.stavbe.setup({ Chunks: World.api.Chunks, list: [], T: window.__game.race.track, near: World.api.nrNear, gH: World.api.nrGround }) === null);
  T.check('a track not in the table is built as before (Jezero: no houses of the builder, the builder gives none)', !jez.st && jez.hisa === 0 && jez.ograja === 0 && jezNull, JSON.stringify({ st: jez.st, hisa: jez.hisa, ograja: jez.ograja, jezNull }));

  await startTrack(page, 'spa');
  const spa = await look(page), s = spa.st || {};
  T.check('Spa: the houses of the track\'s data are the builder\'s, with Belgium\'s kit at the full level (most of them, some right at the road, three finishes of wall; the halls, grandstands and pits stay the track\'s own)',
    s.level === 3 && s.drzava === 'Belgija' && s.style === 'north' && s.houses >= 60 && s.houses <= spa.k0 && s.houses >= spa.k0 * 0.9 && spa.buildings > s.houses + 20 && s.byRoad >= 10 && s.byRoad < s.houses &&
    s.fin.length === 3 && s.fin.every(n => n > 0) && s.fin[0] + s.fin[1] + s.fin[2] === s.houses && s.roofs[0] + s.roofs[1] === s.houses, JSON.stringify({ st: spa.st, k0: spa.k0, buildings: spa.buildings }));
  T.check('Spa: on its slopes the houses\' floors are fitted to the ground (the ground rises under some), small buildings are set square against the house they run into, steps lead to some doors and none is higher than 1.2 m',
    s.rise > 0.5 && s.moved >= 1 && s.moved < s.houses / 4 && s.steps >= 1 && s.steps < s.houses / 2 && s.drop > 0.22 && s.drop <= 1.2, JSON.stringify({ rise: s.rise, moved: s.moved, steps: s.steps, drop: s.drop, houses: s.houses }));
  T.check('Spa: the world\'s count is what is in the world (the walls\' meshes; no railings: the map has no yards or balconies, nothing is made up), under the package\'s budget of 150 thousand vertices, every vertex a number, at a house\'s footprint, inside the atlas',
    spa.hisa >= 1 && spa.ograja === 0 && spa.hisaV + spa.ograjaV === s.vertices && s.vertices > 5000 && s.vertices < 150000 && spa.bad === 0 && spa.out < 14 && spa.v[0] >= 0 && spa.v[1] <= 1,
    JSON.stringify({ hisa: spa.hisa, hisaV: spa.hisaV, ograja: spa.ograja, ograjaV: spa.ograjaV, vertices: s.vertices, bad: spa.bad, out: spa.out, v: spa.v }));
  T.check('Spa: one material for the walls and roofs, with the style\'s one atlas of 1024 x 2048 (made once)',
    spa.mats === 1 && spa.rails === 0 && spa.mat && spa.mat.lambert && spa.mat.map && spa.mat.again && spa.mat.vc && spa.mat.size.join() === '1024,2048', JSON.stringify({ mats: spa.mats, rails: spa.rails, mat: spa.mat }));

  // the chase camera's picture where houses stand by the road (the car on the ideal line there, all else still): the same frame twice,
  // then without the builder's meshes, then with them again
  const pic = await page.evaluate(async () => {
    const g = window.__game, R = g.race, Tr = R.track, P = R.player, W = Render.world, raf = () => new Promise(r => requestAnimationFrame(r)); g.pause();
    // (the place: the sample of the lap with the most of the builder's houses within 50 m ahead of it, 25 to 140 m along the road)
    const fp = (Tr.def.bld || []).filter(b => !b[6] && b[2] * b[3] < 1500).map(b => { const i = Tr.nearestIdx(b[0], b[1]); return [i, Math.hypot(Tr.px[i] - b[0], Tr.pz[i] - b[1])]; }).filter(e => e[1] < 50);
    let at = 0, most = -1; for (let i = 0; i < Tr.N; i += 4) { let n = 0; for (const e of fp) { const d = ((e[0] - i + Tr.N) % Tr.N) * Tr.ds; if (d > 25 && d < 140) n++; } if (n > most) { most = n; at = i; } }
    const off = Tr.rl ? Tr.rl[at] : 0, still = (sec) => { for (let k = 0; k < sec * 120; k++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; R.step(1 / 120); } };
    P.place(Tr.px[at] + Tr.nx[at] * off, Tr.pz[at] + Tr.nz[at] * off, Tr.hd[at]); if (Tr.hasElev) P.y = P.py = Tr.hy[at];
    P.q = Tr.query(P.x, P.z, at, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0; still(0.5);
    Render.resetCam(); for (let k = 0; k < 6; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }
    const up = World.update; World.update = (w, t, ...a) => up(w, 100, ...a);   // (the world's clock stopped: its flags, its crowd)
    const own = []; W.root.traverse(o => { if (o.isMesh && o.material && !Array.isArray(o.material) && o.material.userData.stavbe) own.push(o); });
    const shot = () => { const c = Render.snapshot(P, 'chase', 640); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };
    const diff = (a, b) => { let n = 0; for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 9) n++; return n; };
    try {
      shot(); shot();   // (first, the view settled)
      const a = shot(), b = shot();
      for (const o of own) o.visible = false;
      const c = shot();
      for (const o of own) o.visible = true;
      const d = shot();
      return { px: a.length / 4, houses: most, m: Math.round((((at * Tr.ds - Tr.startS) % Tr.len) + Tr.len) % Tr.len), same: diff(a, b), none: diff(a, c), back: diff(a, d) };
    } finally { for (const o of own) o.visible = true; World.update = up; }
  });
  T.check('Spa: the houses show from the chase camera (the picture changes with them, and only with them: the same frame twice the same picture)',
    pic.houses >= 3 && pic.none > pic.px * 0.004 && pic.same <= pic.px * 0.002 && pic.back <= pic.px * 0.002, JSON.stringify(pic));

  // every country's kit on the same footprints (Spa's houses, the track's own ground and road): each style's atlas draws, the houses
  // are counted, the finishes and the roofs are ones the kit names, every vertex a number inside the atlas; and the rule of the ground on
  // every house (its record: where it stands after the fit, its floor and plinth, its door and steps)
  const kits = await page.evaluate(() => {
    const S = World.stavbe, A = World.api, T0 = window.__game.race.track, bld = (T0.def.bld || []).filter(b => !b[6] && b[2] * b[3] < 1500), out = { n: bld.length, bad: [], styles: new Set(), verts: {} };
    for (const [c, K] of Object.entries(S.KOMPLETI)) {
      const Tk = Object.create(T0); Tk.def = { id: T0.def.id, name: 'Kraj, ' + c };
      const HS = S.setup({ Chunks: A.Chunks, list: bld, T: Tk, near: A.nrNear, gH: A.nrGround });
      if (!HS) { out.bad.push('no builder: ' + c); continue; }
      const rec = bld.map(() => ({}));
      bld.forEach((b, i) => HS.put({ x: b[0], z: b[1], L: b[2], W: b[3], ang: b[4], y0: A.nrGround(b[0], b[1]), hh: b[2] * b[3] < 45 ? 3.4 : 6.4, fl: b[2] * b[3] < 45 ? 1 : 2, type: b[2] * b[3] < 45 ? 'small' : 'house', id: i, out: rec[i] }));
      const grp = new THREE.Group(), st = HS.stats, SY = S.STYLES[K.style]; HS.addTo(grp);
      let moved = 0, doors = 0, steps = 0;
      bld.forEach((b, i) => { const q = rec[i], sm = b[2] * b[3] < 45, at = q.at; if (!at || !isFinite(q.y0 + q.base)) { out.bad.push('no record: ' + c + ' ' + i); return; }
        const ca = Math.cos(at[4]), sa = Math.sin(at[4]); let lo = 1e9, hi = -1e9;
        for (const [u, w] of [[0, 0], [-1, -1], [1, -1], [1, 1], [-1, 1]]) { const y = A.nrGround(at[0] + u * at[2] / 2 * ca - w * at[3] / 2 * sa, at[1] + u * at[2] / 2 * sa + w * at[3] / 2 * ca); if (y < lo) lo = y; if (y > hi) hi = y; }
        // (the floor over the ground: a house's over the high side, a shed's at most 0.6 m under it; the plinth down to the low side)
        if (q.y0 < (sm ? Math.max(lo + 0.1, hi - 0.6) : hi + 0.15) - 1e-6 || q.y0 - q.base > lo + 1e-6) out.bad.push('floor: ' + c + ' ' + i + ' ' + [q.y0, q.base, lo, hi].map(n => n.toFixed(2)).join(' '));
        // (a door: the ground a metre before it at the floor, or steps down to it; never a door high over the ground)
        if (q.door && !q.noDoor) { doors++; if (q.steps > 0) steps++; const drop = q.y0 - A.nrGround(q.door[0] + q.n[0], q.door[1] + q.n[1]);
          if (drop > (q.steps > 0 ? 1.2 : sm ? 0.35 : 0.22) + 1e-6 || q.steps > 7 || (sm && q.steps > 0)) out.bad.push('door: ' + c + ' ' + i + ' ' + drop.toFixed(2) + ' ' + q.steps); }
        // (a small building that was moved: square to a larger footprint, its wall on that one's wall)
        if (Math.hypot(at[0] - b[0], at[1] - b[1]) > 1e-6) { moved++; const HP = Math.PI / 2;
          const ok = bld.some((e, j) => { if (j === i || e[2] * e[3] < 1.5 * b[2] * b[3]) return false; let d = at[4] - e[4]; d -= Math.round(d / HP) * HP; if (Math.abs(d) > 1e-6) return false;
            const odd = Math.abs(Math.round((at[4] - e[4]) / HP)) % 2 === 1, hx = (odd ? at[3] : at[2]) / 2, hz = (odd ? at[2] : at[3]) / 2, ce = Math.cos(e[4]), se = Math.sin(e[4]), rx = at[0] - e[0], rz = at[1] - e[1], lx = Math.abs(rx * ce + rz * se), lz = Math.abs(-rx * se + rz * ce);
            return (Math.abs(lx - e[2] / 2 - hx) < 1e-6 && lz < e[3] / 2 + hz) || (Math.abs(lz - e[3] / 2 - hz) < 1e-6 && lx < e[2] / 2 + hx); });
          if (!ok || !sm) out.bad.push('moved: ' + c + ' ' + i); } });
      if (moved !== st.moved || !moved || !doors || steps < st.steps || !st.steps) out.bad.push('ground: ' + c + ' ' + [moved, st.moved, doors, steps, st.steps].join(' '));
      out.moved = moved; out.doors = doors; out.steps = steps;
      let v = 0, nan = 0, v0 = 1e9, v1 = -1e9, maps = new Set();
      grp.traverse(o => { if (!o.isMesh) return; const P = o.geometry.attributes.position, uv = o.geometry.attributes.uv; v += P.count; maps.add(o.material.map);
        for (let i = 0; i < P.count; i++) { const y = uv.getY(i); if (!isFinite(P.getX(i) + P.getY(i) + P.getZ(i) + uv.getX(i) + y)) nan++; if (y < v0) v0 = y; if (y > v1) v1 = y; } });
      const fins = new Set((K.walls || [[1, 0, 0]]).map(w => w[2] && SY.fin && SY.fin[w[2] - 1] ? w[2] : 0)), second = (K.roofs || []).some(q => q[2] === 1) && !!SY.roof2;
      const a = [...maps][0], px = a && a.image && a.image.getContext ? a.image.getContext('2d').getImageData(0, 0, a.image.width, a.image.height).data : null; let tones = 0;
      if (px) { const seen = new Set(); for (let k = 0; k < px.length; k += 4 * 997) seen.add((px[k] >> 4) + ',' + (px[k + 1] >> 4) + ',' + (px[k + 2] >> 4)); tones = seen.size; }
      if (st.drzava !== c || st.style !== K.style) out.bad.push('kit: ' + c);
      if (st.houses !== bld.length || st.fin[0] + st.fin[1] + st.fin[2] !== bld.length || st.roofs[0] + st.roofs[1] !== bld.length) out.bad.push('count: ' + c);
      if (st.fin.some((n, k) => n > 0 && !fins.has(k))) out.bad.push('finish: ' + c + ' ' + st.fin.join('/'));
      if (st.roofs[1] > 0 && !second) out.bad.push('roof: ' + c);
      if (v !== st.vertices || v < 2000 || v > 150000) out.bad.push('vertices: ' + c + ' ' + v + ' / ' + st.vertices);
      if (nan || v0 < 0 || v1 > 1) out.bad.push('numbers: ' + c + ' ' + nan + ' ' + v0 + ' ' + v1);
      if (maps.size !== 1 || !a || a !== S.atlas(K.style) || tones < 24) out.bad.push('atlas: ' + c + ' ' + maps.size + ' ' + tones);
      out.styles.add(K.style); out.verts[c] = v;
      grp.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    }
    out.styles = [...out.styles]; return out;
  });
  T.check('every country\'s kit builds the same footprints: the kit\'s style and its one atlas (drawn, of many tones), every house counted, only the kit\'s finishes and roofs, the count is what is built, every vertex a number inside the atlas',
    kits.n >= 60 && !kits.bad.filter(e => !/^(floor|door|moved|ground|no record)/.test(e)).length && kits.styles.length >= 5, JSON.stringify(kits));
  T.check('the rule of the ground on every house of every kit: the floor level over the ground\'s high side (a shed at most 0.6 m in it) with the plinth down to the low side, a moved small building square against a larger one\'s wall, a door only where the ground is at the floor or steps reach it (no door high over the ground)',
    !kits.bad.filter(e => /^(floor|door|moved|ground|no record)/.test(e)).length && kits.moved >= 1 && kits.doors >= 40, JSON.stringify({ bad: kits.bad.slice(0, 6), moved: kits.moved, doors: kits.doors, steps: kits.steps }));

  // what a track may ask for (the map's own, where it has them): yards and balconies at its houses, a fence of the map. Each adds to the plain
  // houses; the railings are their own material (cut out, seen from both sides) with the same atlas; unasked there is none of them
  const opt = await page.evaluate(() => {
    const S = World.stavbe, A = World.api, T0 = window.__game.race.track, bld = (T0.def.bld || []).filter(b => !b[6] && b[2] * b[3] < 1500);
    const build = (extra, fence) => { const HS = S.setup({ Chunks: A.Chunks, list: bld, T: T0, near: A.nrNear, gH: A.nrGround }), a = S.atlas(HS.stats.style);
      bld.forEach((b, i) => HS.put(Object.assign({ x: b[0], z: b[1], L: b[2], W: b[3], ang: b[4], y0: 0, hh: b[2] * b[3] < 45 ? 3.4 : 6.4, fl: b[2] * b[3] < 45 ? 1 : 2, type: b[2] * b[3] < 45 ? 'small' : 'house', id: i }, extra)));
      if (fence) HS.fence(bld[0][0] + 20, bld[0][1], bld[0][0] + 30, bld[0][1] + 3);
      const grp = new THREE.Group(), r = { st: HS.stats.vertices, hisa: 0, hisaV: 0, ograja: 0, ograjaV: 0, rail: true, nan: 0 }; HS.addTo(grp); const mh = new Set();
      grp.traverse(o => { if (o.isMesh && o.material.userData.stavbe === 'hisa') mh.add(o.material); });
      grp.traverse(o => { if (!o.isMesh) return; const P = o.geometry.attributes.position, uv = o.geometry.attributes.uv, n = P.count;
        for (let i = 0; i < n; i++) if (!isFinite(P.getX(i) + P.getY(i) + P.getZ(i) + uv.getX(i) + uv.getY(i))) r.nan++;
        if (o.material.userData.stavbe === 'hisa') { r.hisa++; r.hisaV += n; } else { r.ograja++; r.ograjaV += n; if (!(o.material.alphaTest > 0) || o.material.map !== a || mh.has(o.material) || o.material.userData.stavbe !== 'ograja') r.rail = false; } });
      grp.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
      return r; };
    return { plain: build({}, false), fence: build({}, true), yard: build({ yard: true }, false), balc: build({ balc: true }, false) };
  });
  const sum = (r) => r.hisaV + r.ograjaV === r.st && r.nan === 0 && r.rail;
  T.check('what a track may ask for adds to the plain houses (a fence of the map, yards, balconies), the railings in their own cut-out material with the same atlas; unasked the houses have none',
    sum(opt.plain) && opt.plain.ograja === 0 && sum(opt.fence) && opt.fence.ograja >= 1 && opt.fence.hisaV > opt.plain.hisaV && sum(opt.yard) && opt.yard.ograja >= 1 && opt.yard.st > opt.plain.st &&
    sum(opt.balc) && opt.balc.ograja >= 1 && opt.balc.st > opt.plain.st, JSON.stringify(opt));

  // Spa built again (after another track): the same to the vertex
  await startTrack(page, 'jezero');
  await startTrack(page, 'spa');
  const spa2 = await look(page);
  T.check('Spa built again is the same (the builder\'s count, the meshes, the vertices)', JSON.stringify(spa2.st) === JSON.stringify(spa.st) && spa2.hisa === spa.hisa && spa2.hisaV === spa.hisaV && spa2.ograja === spa.ograja && spa2.ograjaV === spa.ograjaV,
    JSON.stringify({ st: spa2.st, hisa: spa2.hisa, hisaV: spa2.hisaV, ograja: spa2.ograja, ograjaV: spa2.ograjaV }));
  T.check('no errors (the houses\' programs compile, the atlases draw)', errors.length === 0, errors.slice(0, 3).join(' | '));

  const low = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase' }, { width: 640, height: 360 });
  await startTrack(low.page, 'spa');
  const spaL = await look(low.page);
  await low.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  T.check('NIZKA: the same houses (a phone\'s tier: the level is the track\'s, not the tier\'s), no errors', JSON.stringify(spaL.st) === JSON.stringify(spa.st) && spaL.hisaV + spaL.ograjaV === s.vertices && spaL.bad === 0 && low.errors.length === 0,
    JSON.stringify(spaL.st) + ' ' + low.errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran', false, String(e && e.stack || e).slice(0, 600));
} finally {
  await browser.close(); srv.close();
}
T.done();
