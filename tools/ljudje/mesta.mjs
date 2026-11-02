// Mesta za prizore z ljudmi (js/world-ljudje.js, tabela SITES): na pravi progi poišče kandidate, kjer se prizor vidi iz kamere za avtom (ravna
// pot pred njim, ograja blizu ceste), so tla ravna, ni druge ceste, stavb, tribun ali drugih stvari (merjeno na zgrajenem svetu: oglišča nad
// tlemi), in izpiše najboljše z razmikom (metri od štarta, stran, ocena); --slike posname vsakega iz kamere za avtom 45 m pred njim.
//   node tools/ljudje/mesta.mjs <proga> [--n 14] [--razmik 350] [--slike] [--od 0] [--do 1e9] [--gozd]
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openGame, REPO } from '../../tests/browser/lib.mjs';

const args = process.argv.slice(2), id = args[0];
if (!id) { console.log('node tools/ljudje/mesta.mjs <proga> [--n 14] [--razmik 350] [--slike] [--od 0] [--do 1e9] [--gozd]'); process.exit(2); }
const flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const N = +flag('--n', 14), gap = +flag('--razmik', 350), shots = args.includes('--slike'), from = +flag('--od', 0), to = +flag('--do', 1e9), forest = args.includes('--gozd');
const OUT = path.join(REPO, 'test-results', 'ljudje', 'mesta'); fs.mkdirSync(OUT, { recursive: true });

const srv = await serve(REPO);
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', detail: 'high' }, { width: 844, height: 390 }, { seed: 11 });
  await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 300000 });
  try { await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 }); }
  catch (e) { console.log('igra se ni naložila:', errors.slice(0, 8)); throw e; }
  const res = await page.evaluate(([gap, N, from, to, forest]) => {
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
        for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, m4); w4.multiplyMatrices(o.matrixWorld, m4); const e = w4.elements; if (e[0] === 0 && e[5] === 0) continue; add(veg.has(o) || green ? trees : occ, e[12], e[14], 1); }
        return;
      }
      const P = o.geometry.attributes.position, step = P.count > 200000 ? 3 : 1;
      for (let i = 0; i < P.count; i += step) { v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); const h = gH(v.x, v.z); if (Number.isFinite(h) && v.y > h + 0.6 && v.y < h + 25) add(occ, v.x, v.z, step); }
    });
    W.root.traverse(o => { if (o.isInstancedMesh && o.name === 'crowd') for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, m4); const e = m4.elements; if (e[0] === 0 && e[5] === 0) continue; add(crowd, e[12], e[14], 1); } });
    const sum = (M, x, z) => M.get(Math.floor(x / C4) + ',' + Math.floor(z / C4)) || 0;
    const L = T.len, out = [], s0 = T.open ? Math.max(T.startS || 0, 0) : 0, s1 = T.open ? Math.min(T.finishS || L, L) : L;
    for (let s = s0 + 40; s < s1 - 20; s += 8) {
      const m = Math.round(s - (T.startS || 0)); if (m < from || m > to) continue;
      const i = T.idx(((s % L) + L) % L);
      let kmax = 0; for (let d = -110; d <= 15; d += 5) { const j = T.idx((((s + d) % L) + L) % L); kmax = Math.max(kmax, Math.abs(T.k ? T.k[j] : 0)); }
      for (const side of [-1, 1]) {
        const bar = side > 0 ? T.br[i] : T.bl[i]; if (bar > 16) continue;
        let lo = 1e9, hi = -1e9, o = 0, tr = 0, cr = 0, bad = 0;
        for (let a = -12; a <= 12; a += 3) for (let b = 1; b <= 13; b += 3) {
          const x = T.px[i] + T.tx[i] * a + T.nx[i] * side * (bar + b), z = T.pz[i] + T.tz[i] * a + T.nz[i] * side * (bar + b), h = gH(x, z);
          if (!Number.isFinite(h)) { bad++; continue; } lo = Math.min(lo, h); hi = Math.max(hi, h);
          const n = A.clearance(x, z); if (n < Math.min(b, 3) - 0.6) bad++;   // (another part of the road, its verge or barrier)
          o += sum(occ, x, z); tr += sum(trees, x, z); cr += sum(crowd, x, z);
        }
        const dh = hi - lo, hy = T.hy ? T.hy[i] : lo;
        if (bad || dh > 2.2 || lo < hy - 4 || hi > hy + 6) continue;
        const score = (kmax < 1 / 400 ? 3 : kmax < 1 / 250 ? 2 : kmax < 1 / 150 ? 1 : 0) * 2 - dh - o / 40 - (forest ? 0 : tr / 6) - cr / 30 - bar / 8;
        out.push({ m, side, bar: +bar.toFixed(1), minR: Math.round(1 / Math.max(kmax, 1e-4)), dh: +dh.toFixed(1), occ: o, trees: tr, crowd: cr, score: +score.toFixed(2) });
      }
    }
    out.sort((a, b) => b.score - a.score);
    const pick = []; for (const c of out) { if (c.occ > 60) continue; if (pick.every(p => Math.abs(p.m - c.m) >= gap)) pick.push(c); if (pick.length >= N) break; }
    pick.sort((a, b) => a.m - b.m);
    return { len: Math.round(L), open: !!T.open, n: out.length, pick, names: T.names.map(q => [q.n, Math.round(q.d)]) };
  }, [gap, N, from, to, forest]);
  console.log(id, 'dolžina', res.len, res.open ? 'odprta' : 'krožna', 'kandidatov', res.n);
  console.log('m side bar minR dh occ trees crowd score');
  for (const c of res.pick) console.log([c.m, c.side, c.bar, c.minR, c.dh, c.occ, c.trees, c.crowd, c.score].join(' '));
  console.log('imena:', res.names.map(x => x.join('@')).join(', '));
  if (shots) for (const c of res.pick) {
    const src = await page.evaluate(([m, side]) => {
      const g = window.__game, R = g.race, T = R.track, P = R.player, s = (T.startS || 0) + m - 45, i = T.idx(((s % T.len) + T.len) % T.len), off = T.rl ? T.rl[i] : 0;
      P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = P.roadY = T.hy[i]; P.vx = P.vz = 0; P.q = T.query(P.x, P.z, i, P.q);
      for (const c of R.cars) if (c !== P) { const vw = Render.viewOf(c); if (vw) vw.grp.visible = false; }
      Render.setShot(null); Render.resetCam(); for (let k = 0; k < 12; k++) Render.frame(1 / 30, 1, P, 'chase', {});
      return Render.snapshot(P, 'chase', 900).toDataURL('image/png');
    }, [c.m, c.side]);
    fs.writeFileSync(path.join(OUT, `${id}-${c.m}${c.side > 0 ? 'D' : 'L'}.png`), Buffer.from(src.split(',')[1], 'base64'));
  }
  if (errors.length) console.log('napake:', errors.slice(0, 6));
} finally { await browser.close(); await srv.close(); }
