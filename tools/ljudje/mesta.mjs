// Mesta za prizore z ljudmi (js/world-ljudje.js, tabela SITES): na pravi progi poišče kandidate, kjer se prizor vidi iz kamere za avtom (ravna
// pot pred njim, ograja blizu ceste), so tla ravna, ni druge ceste, stavb, tribun ali drugih stvari (merjeno na zgrajenem svetu: oglišča nad
// tlemi), in izpiše najboljše z razmikom (metri od štarta, stran, ocena); --slike posname vsakega iz kamere za avtom 45 m pred njim.
//   node tools/ljudje/mesta.mjs <proga> [--n 14] [--razmik 350] [--slike] [--od 0] [--do 1e9] [--gozd]
//   --plan zar,ogenj,marsali,…   razporedi te vrste prizorov po pravilih vrste (tribuna na ravnini, vhod blizu štarta, ogenj v gozdu …) in izpiše
//   vrstico za SITES; --ze 70:-1,5790:1 mesta, ki so že zasedena (razmik tudi od njih); --preveri 3424:1,2408:1 oceni ta mesta (tudi, ali
//   je na njih stranska cesta proge: T.stubs, »road«, ulica ali parkirišče sveta: asfalt pod žarki, »asf« (od 2 m za ograjo naprej, največ 2 od 36 točk: rob), ali kaj stoji: žarki navzdol, »bld«,
//   in kaj zadenejo, »hits«; vsako mesto enkrat, na svoji
//   strani; mesto v pasu boksov: NE, »pit«)
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openGame, REPO } from '../../tests/browser/lib.mjs';

const args = process.argv.slice(2), id = args[0];
if (!id) { console.log('node tools/ljudje/mesta.mjs <proga> [--n 14] [--razmik 350] [--slike] [--od 0] [--do 1e9] [--gozd]'); process.exit(2); }
const flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const N = +flag('--n', 14), gap = +flag('--razmik', 350), shots = args.includes('--slike'), from = +flag('--od', 0), to = +flag('--do', 1e9), forest = args.includes('--gozd');
const plan = flag('--plan', null), taken = (flag('--ze', '') || '').split(',').filter(Boolean).map(x => { const [m, sd] = x.split(':').map(Number); return { m, side: sd }; });
const check = (flag('--preveri', '') || '').split(',').filter(Boolean).map(x => { const [m, sd] = x.split(':').map(Number); return { m, side: sd }; });
const OUT = path.join(REPO, 'test-results', 'ljudje', 'mesta'); fs.mkdirSync(OUT, { recursive: true });

const srv = await serve(REPO);
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', detail: 'high' }, { width: 844, height: 390 }, { seed: 11 });
  await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
  try { await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 }); }
  catch (e) { console.log('igra se ni naložila:', errors.slice(0, 8)); throw e; }
  const res = await page.evaluate(([gap, N, from, to, forest, plan, taken, check]) => {
    const g = window.__game; g.pause();
    const W = Render.world, T = g.race.track, gH = W.groundH, A = World.api, C4 = 4;
    // what stands on the ground: every vertex of the world's meshes higher than 0.6 m over it (not the plants, the crowd, the glades, the people's scenes)
    const occ = new Map(), trees = new Map(), crowd = new Map(), add = (M, x, z, n) => { const k = Math.floor(x / C4) + ',' + Math.floor(z / C4); M.set(k, (M.get(k) || 0) + n); };
    const veg = new Set((W.cull || []).map(e => e.m)), v = new THREE.Vector3(), m4 = new THREE.Matrix4(), w4 = new THREE.Matrix4();
    W.root.updateMatrixWorld(true);
    W.root.traverse(o => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      let p = o; while (p) { if (p.name === 'people' || p.name === 'crowds' || p.name === 'life') return; p = p.parent; }
      if (o.isInstancedMesh) {
        const ca = o.geometry.attributes.color; let green = false; if (ca) { let r = 0, gg = 0, b = 0; for (let k = 0; k < ca.count; k++) { r += ca.getX(k); gg += ca.getY(k); b += ca.getZ(k); } green = gg > r * 1.08 && gg > b * 1.08; }
        for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, m4); w4.multiplyMatrices(o.matrixWorld, m4); const e = w4.elements; if (e[0] === 0 && e[5] === 0) continue; const tr = veg.has(o) || green; if (!tr && A.clearance(e[12], e[14]) < 1.5) continue; add(tr ? trees : occ, e[12], e[14], tr ? 1 : 8); }
        return;
      }
      const P = o.geometry.attributes.position, step = P.count > 200000 ? 3 : 1;
      for (let i = 0; i < P.count; i += step) { v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); const h = gH(v.x, v.z); if (Number.isFinite(h) && v.y > h + 0.6 && v.y < h + 25 && A.clearance(v.x, v.z) > 1.5) add(occ, v.x, v.z, step); }   // (not the barrier, its catch fence or the kerbs)
    });
    W.root.traverse(o => { if (o.isInstancedMesh && o.name === 'crowd') for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, m4); const e = m4.elements; if (e[0] === 0 && e[5] === 0) continue; add(crowd, e[12], e[14], 1); } });
    const sum = (M, x, z) => M.get(Math.floor(x / C4) + ',' + Math.floor(z / C4)) || 0;
    // the track's side roads (T.stubs: their points and half widths, in 8 m cells): how far a point is from the nearest one's edge
    const SC = 8, sg = new Map(); for (const St of T.stubs || []) for (let j = 0; j < St.n; j++) { const k = Math.floor(St.x[j] / SC) + ',' + Math.floor(St.z[j] / SC); let L = sg.get(k); if (!L) sg.set(k, L = []); L.push([St.x[j], St.z[j], St.hw]); }
    // what stands there, by rays down (a big building's walls have few vertices: the vertex count above misses its middle): the world's meshes but
    // the people's, the crowds', the animals' and the plants' (instanced), hits more than 0.6 m over the ground
    const rc = new THREE.Raycaster(), DN = new THREE.Vector3(0, -1, 0), solid = [];
    W.root.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.visible || !o.geometry || !o.geometry.attributes.position) return; let p = o; while (p) { if (p.name === 'people' || p.name === 'crowds' || p.name === 'life' || p === W.ground) return; p = p.parent; }   // (nor the ground)
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); if (b.max.x - b.min.x > 300 && b.max.z - b.min.z > 300) return; solid.push({ o, b }); });
    // the town's streets, car parks and junction mouths the world draws (the asphalt's texture on the ground, Render's wet look finds them the
    // same way): a ray down meeting one within 0.6 m of the ground
    const ASPH = Tex.all().asphalt, asph = [];
    W.root.traverse(o => { if (!o.isMesh || !o.visible || !o.geometry || !o.material) return; let p = o; while (p) { if (p.name === 'people') return; p = p.parent; }
      if (!(Array.isArray(o.material) ? o.material : [o.material]).some(m => m && m.map === ASPH)) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); asph.push({ o, b: o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld) }); });
    const asphOcc = (pts) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      const near = asph.filter(({ b }) => !(b.max.x < x0 || b.min.x > x1 || b.max.z < z0 || b.min.z > z1)).map(e => e.o); if (!near.length) return 0; let n = 0;
      for (const [x, z] of pts) { const h = gH(x, z); if (!Number.isFinite(h)) continue; rc.set(new THREE.Vector3(x, h + 3, z), DN); rc.far = 3.6; if (rc.intersectObjects(near, false).some(q => Math.abs(q.point.y - h) < 0.6)) n++; }
      return n; };
    const what = [];   // (--preveri: what the rays met, for a place that fails: its mesh's name or its parents', its size, how high)
    const rayOcc = (pts, tell) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      const near = solid.filter(({ b }) => !(b.max.x < x0 || b.min.x > x1 || b.max.z < z0 || b.min.z > z1)).map(e => e.o); let n = 0;
      for (const [x, z] of pts) { const h = gH(x, z); if (!Number.isFinite(h)) continue; rc.set(new THREE.Vector3(x, h + 40, z), DN); rc.far = 39.4; const hit = rc.intersectObjects(near, false); if (hit.length) { n++;
        if (tell && what.length < 6) { const o = hit[0].object; let nm = o.name, p = o.parent; while (!nm && p) { nm = p.name; p = p.parent; } const bb = o.geometry.boundingBox, sz = bb ? [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z].map(v => Math.round(v)) : null;
          what.push((nm || '?') + ' ' + (o.material && o.material.map ? 'tex' : 'col') + ' ' + JSON.stringify(sz) + ' +' + (hit[0].point.y - h).toFixed(1) + 'm'); } } } return n; };
    const stubD = (x, z) => { let d = 1e9; const cx = Math.floor(x / SC), cz = Math.floor(z / SC); for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const [px, pz, hw] of sg.get((cx + a) + ',' + (cz + b)) || []) d = Math.min(d, Math.hypot(px - x, pz - z) - hw); return d; };
    const L = T.len, out = [], s0 = T.open ? Math.max(T.startS || 0, 0) : 0, s1 = T.open ? Math.min(T.finishS || L, L) : L, checked = [];
    const steps = check.length ? check.map(c => ({ s: (T.startS || 0) + c.m, m: c.m, side: c.side })) : null;   // (--preveri: each place once, its own side)
    for (let s = s0 + 40, q = 0; steps ? q < steps.length : s < s1 - 20; steps ? q++ : (s += 8)) {
      const st = steps ? steps[q] : null; if (st) s = st.s;
      const m = st ? st.m : Math.round(s - (T.startS || 0)); if (!st && (m < from || m > to)) continue;
      const i = T.idx(((s % L) + L) % L);
      let kmax = 0; for (let d = -110; d <= 15; d += 5) { const j = T.idx((((s + d) % L) + L) % L); kmax = Math.max(kmax, Math.abs(T.k ? T.k[j] : 0)); }
      for (const side of st ? [st.side] : [-1, 1]) {
        const bar = side > 0 ? T.br[i] : T.bl[i]; if (bar > 16 && !st) continue;
        const PL = T.def.pit, inPit = (x) => x >= PL[1] - 40 && x <= PL[2] + 40;
        if (PL && side === Math.sign(PL[0]) && (inPit(m) || (!T.open && (inPit(m - L) || inPit(m + L))))) { if (st) checked.push({ m, side, ok: false, pit: true }); continue; }   // (not in the pit lane: its scene is the pit wall's, def.pit; the lane over the start line: its metres before it negative)
        let lo = 1e9, hi = -1e9, o = 0, tr = 0, cr = 0, bad = 0, road = 1e9; const pts = [];
        for (let a = -12; a <= 12; a += 3) for (let b = 1; b <= 13; b += 3) {
          const x = T.px[i] + T.tx[i] * a + T.nx[i] * side * (bar + b), z = T.pz[i] + T.tz[i] * a + T.nz[i] * side * (bar + b), h = gH(x, z);
          if (!Number.isFinite(h)) { bad++; continue; } lo = Math.min(lo, h); hi = Math.max(hi, h);
          const n = A.clearance(x, z); if (n < Math.min(b, 3) - 0.6) bad++;   // (another part of the road, its verge or barrier)
          o += sum(occ, x, z); tr += sum(trees, x, z); cr += sum(crowd, x, z); road = Math.min(road, stubD(x, z)); if (b > 2) pts.push([x, z]);   // (rays: not the first metres behind the barrier, its own bank or wall, a paved strip behind it)
        }
        const dh = hi - lo, hy = T.hy ? T.hy[i] : lo;
        if (st) { what.length = 0; const bld = rayOcc(pts, true), asf = asphOcc(pts); checked.push({ m, side, bar: +bar.toFixed(1), dh: +dh.toFixed(1), occ: o, bld, asf, trees: tr, road: +Math.min(road, 99).toFixed(1), ok: !bad && dh <= 2.2 && road >= 2 && bld <= 2 && asf <= 2, hits: bld ? what.slice() : undefined }); continue; }
        if (bad || dh > 2.2 || lo < hy - 4 || hi > hy + 6 || road < 2) continue;   // (not on a side road)
        const score = (kmax < 1 / 400 ? 3 : kmax < 1 / 250 ? 2 : kmax < 1 / 150 ? 1 : 0) * 2 - dh - o / 40 - (forest ? 0 : tr / 6) - cr / 30 - bar / 8;
        out.push({ m, side, bar: +bar.toFixed(1), minR: Math.round(1 / Math.max(kmax, 1e-4)), dh: +dh.toFixed(1), occ: o, trees: tr, crowd: cr, score: +score.toFixed(2), pts });
      }
    }
    out.sort((a, b) => b.score - a.score);
    const free = (c) => { if (c.bld == null) { c.bld = rayOcc(c.pts); c.asf = asphOcc(c.pts); } return c.bld <= 2 && c.asf <= 2; };   // (rays only for those it would take: the best first; no street under it, at most its far edge)
    const far = (m, list) => list.every(p => { let d = Math.abs(p.m - m); if (!T.open) d = Math.min(d, L - d); return d >= gap; });
    const pick = [];
    if (plan) {   // each kind to the best place its rules allow
      const near0 = (c) => { const d = T.open ? c.m : Math.min(Math.abs(c.m), Math.abs(L - c.m)); return d < 900; };
      const rule = { tribuna: c => c.minR >= 250 && c.dh < 1.3 && c.occ < 12, vhod: c => near0(c) && c.occ < 25, ogenj: c => c.trees >= 3 && c.occ < 25, hisa2: c => c.dh < 1.6 && c.occ < 12,
        gasilci: c => c.dh < 1.6 && c.occ < 20, zar: c => c.dh < 1.8 && c.occ < 20, kamp: c => c.dh < 1.8 && c.occ < 20, oder: c => c.occ < 20,
        ribici: c => c.dh < 1.2 && c.occ < 20, seno: c => c.dh < 1.8 && c.occ < 20, cebelarji: c => c.dh < 1.6 && c.occ < 20, balinanje: c => c.dh < 1.0 && c.occ < 15, sah: c => c.dh < 1.0 && c.occ < 15, rojstnidan: c => c.dh < 1.4 && c.occ < 20 };   // (js/world-ljudje3.js: a pond, a court, a chessboard on flat ground)
      for (const kind of plan.split(',')) { const ok = rule[kind] || (c => c.occ < 30);
        const c = out.find(c => ok(c) && far(c.m, pick.concat(taken)) && free(c)) || out.find(c => c.occ < 40 && far(c.m, pick.concat(taken)) && free(c));
        if (c) pick.push(Object.assign({ kind }, c)); }
    } else for (const c of out) { if (c.occ > 60) continue; if (far(c.m, pick.concat(taken)) && free(c)) pick.push(c); if (pick.length >= N) break; }
    for (const c of pick) delete c.pts;
    pick.sort((a, b) => a.m - b.m);
    return { len: Math.round(L), open: !!T.open, n: out.length, pick, checked, names: T.names.map(q => [q.n, Math.round(q.d)]) };
  }, [gap, N, from, to, forest, plan, taken, check]);
  if (check.length) { for (const c of res.checked) console.log('preveri', id, `${c.m}:${c.side}`, c.ok ? 'OK' : 'NE', JSON.stringify(c)); process.exitCode = 0; }
  console.log(id, 'dolžina', res.len, res.open ? 'odprta' : 'krožna', 'kandidatov', res.n);
  console.log('vrsta m stran bar minR dh occ drevesa gledalci ocena');
  for (const c of res.pick) console.log([c.kind || '', c.m, c.side, c.bar, c.minR, c.dh, c.occ, c.trees, c.crowd, c.score].join(' '));
  if (plan) console.log(`SITES ${id}: [${res.pick.map(c => `['${c.kind}', ${c.m}, ${c.side}]`).join(', ')}],`);
  console.log('imena:', res.names.map(x => x.join('@')).join(', '));
  if (shots) for (const c of res.pick) {
    const src = await page.evaluate(([m, side]) => {
      const g = window.__game, R = g.race, T = R.track, P = R.player, s = (T.startS || 0) + m - 45, i = T.idx(((s % T.len) + T.len) % T.len), off = T.rl ? T.rl[i] : 0;
      P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = P.roadY = T.hy[i]; P.vx = P.vz = 0; P.q = T.query(P.x, P.z, i, P.q);
      for (const c of R.cars) if (c !== P) { const vw = Render.viewOf(c); if (vw) vw.grp.visible = false; }
      Render.setShot(null); Render.resetCam(); for (let k = 0; k < 12; k++) Render.frame(1 / 30, 1, P, 'chase', {});
      return Render.snapshot(P, 'chase', 900).toDataURL('image/png');
    }, [c.m, c.side]);
    fs.writeFileSync(path.join(OUT, `${id}-${c.kind ? c.kind + '-' : ''}${c.m}${c.side > 0 ? 'D' : 'L'}.png`), Buffer.from(src.split(',')[1], 'base64'));
  }
  if (errors.length) console.log('napake:', errors.slice(0, 6));
} finally { await browser.close(); await srv.close(); }
