// Slika Vršič v izbranem slogu: node shoot.mjs shots.json [world.js]
// shots: [{ name, sty (window.__STY or null), season, cam ('iso'|'chase'), d (metres after the start), lane (m off centre), w, h, tod }]
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openGame } from '/home/user/dirkaska-igra/tests/browser/lib.mjs';

const shots = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const worldJs = process.argv[3] ? fs.readFileSync(process.argv[3], 'utf8') : null;
const OUT = path.join(path.dirname(process.argv[2]), 'out');
const srv = await serve(worldJs ? path.join(path.dirname(process.argv[2]), 'proto2') : undefined);
const browser = await launch(['--disable-gpu-vsync']);
const groups = {};
for (const s of shots) { const k = `${s.track || 'vrsic'}|${s.cam}|${s.w}x${s.h}|${s.cloud || ''}`; (groups[k] = groups[k] || []).push(s); }
try {
  for (const [k, list] of Object.entries(groups)) {
    const s0 = list[0];
    const { page, errors } = await openGame(browser, srv.base + '/index.html' + (s0.cloud ? '?cloud=' + s0.cloud + '&cloudS=' + (s0.cloudS || 2.4) : ''), { quality: 'high', shadows: 1, camera: s0.cam, zoom: s0.zoom || 1.4, weather: 'dry', season: s0.season || 'summer', tod: 'day', track: s0.track || 'vrsic', mode: 'time' }, { width: s0.w, height: s0.h });
    await page.evaluate(async (tid) => {
      const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
      g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(250);
      document.querySelector(`[data-track="${tid}"]`).click(); await wait(150); g.onAction('start');
      for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === tid); k++) await wait(100);
      await wait(300); g.pause();
      window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;   // (the game's own loop stops: only our frames are drawn)
    }, s0.track || 'vrsic');
    let lastKey = null;
    for (const s of list) {
      const key = JSON.stringify([s.sty, s.season || 'summer', s.tod || 'day']);
      const t0 = Date.now();
      const info = await page.evaluate(async ([s, rebuild]) => {
        const g = window.__game, race = g.race, T = race.track, P = race.player;
        if (rebuild) {
          window.__STY = s.sty || null;
          Render.setAtmos({ season: s.season || 'summer', tod: s.tod || 'day' }, true);
          Render.applySettings({ quality: 'high', shadows: true, camera: g.S.camera, carDetail: 'normal' });
          Render.buildWorld(T, 1, 2);
          if (window.__STY_POST) window.__STY_POST(Render, s.sty);
          const W = Render.world; let cv = 0, cm = 0, ci = 0, tv = 0, tm = 0;
          W.root.traverse(o => { if (!o.isMesh) return; const n = o.geometry.attributes.position.count * (o.isInstancedMesh ? o.count : 1); tv += n; tm++; let p = o, cr = false; while (p) { if (p.name === 'crowds' || p.name === 'vrFin') cr = true; p = p.parent; } if (cr) { cv += n; cm++; if (o.isInstancedMesh) ci += o.count; } });
          window.__crowd = { crowdVerts: cv, crowdMeshes: cm, crowdInst: ci, totalVerts: tv, totalMeshes: tm, crowdN: W.crowdN };
          if (s.sty && s.sty.after) W.root.traverse(o => { if (o.name === 'crowds' || o.name === 'vrFin') o.visible = false; });
          if (s.sty && s.sty.farm) W.root.traverse(o => { if (o.name === 'crowds') o.visible = false; });
          if (window.__STYK && window.__STYK.mcCards) { const mc = window.__STYK.mcCards(); if (mc) W.root.add(mc); }
          if (s.sty && s.sty.animals) {   // the spectators replaced by animals: one per four, where they stood (deer, cows, sheep)
            const pos = []; W.root.traverse(o => { if (o.name !== 'crowds') return; o.visible = false; o.traverse(q => { if (!q.isInstancedMesh) return; const m = new THREE.Matrix4(), v = new THREE.Vector3(); for (let k = 0; k < q.count; k += 4) { q.getMatrixAt(k, m); v.setFromMatrixPosition(m).applyMatrix4(q.matrixWorld); pos.push(v.clone()); } }); });
            const kinds = s.sty.animals, mat = new THREE.MeshLambertMaterial({ vertexColors: true }), grp = new THREE.Group();
            kinds.forEach((kind, ki) => { const mine = pos.filter((_, k) => k % kinds.length === ki); if (!mine.length) return; const im = new THREE.InstancedMesh(window.__STYK.animalGeo(kind), mat, mine.length);
              mine.forEach((p, k) => im.setMatrixAt(k, new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (p.x * 1.7 + p.z) % 6.28), new THREE.Vector3(1, 1, 1)))); im.castShadow = true; im.frustumCulled = false; grp.add(im); });
            W.root.add(grp); }
        }
        // the player's car to the spot, the others out of sight
        const lk = s.lake != null ? (window.__STYK.lakes().sort((a, b) => b.area - a.area)[0]) : null, i = lk ? T.nearestIdx(lk.cx, lk.cz) + Math.round((s.lake || 0) / T.ds) : s.koz != null && Render.world.farm ? T.idx(Render.world.farm.ks[s.koz] + (s.kozOff || 0)) : s.f != null ? T.idx(s.f * T.len) : T.idx(T.startS + s.d), lane = s.lane == null ? 1.6 : s.lane;
        P.place(T.px[i] + T.nx[i] * lane, T.pz[i] + T.nz[i] * lane, T.hd[i] + (s.back ? Math.PI : 0)); P.y = P.py = T.hy[i]; P.roadY = P.y; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.speed = 0;
        for (const c of race.cars) if (c !== P) { const j = T.idx(T.startS + s.d + 400 + Math.random() * 300); c.place(T.px[j], T.pz[j], T.hd[j]); c.y = c.py = T.hy[j]; c.q = T.query(c.x, c.z, j, c.q); }
        if (window.__fx) { Render.scene.remove(window.__fx); window.__fx = null; }
        if (s.fx) { const k = T.idx(T.startS + s.fx.at), o = s.fx.lane == null ? 1.6 : s.fx.lane, ox = T.px[k] + T.nx[k] * o, oz = T.pz[k] + T.nz[k] * o; window.__fx = window.__STYK.crash(ox, oz === oz ? T.hy[k] + 0.02 : 0, oz, T.hd[k], s.fx.kind, s.fx.phase, s.fx.seed); Render.scene.add(window.__fx);
          if (s.fx.yaw) { P.place(P.x, P.z, T.hd[i] + s.fx.yaw); P.y = P.py = T.hy[i]; P.roadY = P.y; P.q = T.query(P.x, P.z, i, P.q); } }
        if (window.__city) { Render.scene.remove(window.__city); window.__city = null; }
        let top = null;
        if (s.city) { const ah = s.city.ahead == null ? 25 : s.city.ahead, fx2 = Math.sin(P.h != null ? P.h : T.hd[i]), fz2 = Math.cos(P.h != null ? P.h : T.hd[i]);
          window.__city = window.__STYK.city(Object.assign({ x: T.px[i] + T.tx[i] * ah, z: T.pz[i] + T.tz[i] * ah }, s.city)); Render.scene.add(window.__city); }
        if (s.top) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let k = 0; k < T.N; k++) { x0 = Math.min(x0, T.px[k]); x1 = Math.max(x1, T.px[k]); z0 = Math.min(z0, T.pz[k]); z1 = Math.max(z1, T.pz[k]); }
          const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, rr = Math.max(x1 - x0, z1 - z0) / 2 + (s.top.margin || 80);
          window.__city = window.__STYK.city(Object.assign({ x: cx, z: cz, r: rr }, s.top)); Render.scene.add(window.__city);
          top = window.__STYK.top({ x: cx, z: cz, r: rr, px: s.top.px || 2048 }); }
        if (window.__kit) { Render.scene.remove(window.__kit); window.__kit = null; }
        if (s.kit) { window.__kit = window.__STYK.kit(Object.assign({ i: T.idx(T.startS + ((s.kit.at != null ? s.kit.at : (s.f != null ? s.f * T.len - T.startS : s.d)) + (s.kit.off || 0))) }, s.kit)); Render.scene.add(window.__kit); }
        if (window.__zone) { Render.scene.remove(window.__zone); window.__zone = null; }
        if (s.zone) { window.__zone = window.__STYK.zone(i - Math.round(80 / T.ds), i + Math.round(120 / T.ds)); Render.scene.add(window.__zone); }
        if (window.__uz0 == null) window.__uz0 = Render.cam.userZoom; Render.cam.userZoom = s.uz || window.__uz0;
        { let sun = null; Render.scene.traverse(o => { if (o.isDirectionalLight && o.castShadow) sun = o; });
          if (window.__sh0 == null && sun) window.__sh0 = sun.shadow.mapSize.x;
          const want = (s.sty && s.sty.soft) || s.soft || window.__sh0; if (sun && sun.shadow.mapSize.x !== want) { sun.shadow.mapSize.set(want, want); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
          window.__amb = window.__amb || []; Render.scene.traverse(o => { if (o.isHemisphereLight || o.isAmbientLight) { if (o.userData.i0 == null) o.userData.i0 = o.intensity; o.intensity = o.userData.i0 * (s.ambK || 1); } }); }
        if (s.light) Render.scene.traverse(o => { if (o.isDirectionalLight && o.castShadow) { o.color.setHex(s.light.sun); o.intensity *= s.light.sunI || 1; } if (o.isHemisphereLight) { o.color.setHex(s.light.sky); o.groundColor.setHex(s.light.gnd); } });
        if (s.light && s.light.fog && Render.scene.fog) Render.scene.fog.color.setHex(s.light.fog);
        Render.setShot(null);
        if (s.aerial) { const W = Render.world, gH = W.groundH, A = s.aerial; let best = null;
          if (A.auto) { const cands = []; for (let k = Math.floor(T.N * 0.05); k < T.N * 0.95; k += 15) for (const sd of [-1, 1]) { let sea = 0; for (const e of [40, 70, 110]) { const x = T.px[k] + T.nx[k] * sd * e, z = T.pz[k] + T.nz[k] * sd * e; if (gH(x, z) < (W.seaY != null ? W.seaY : -1e9) + 0.5) sea++; } if (sea >= 2) cands.push([k, sd]); }
            const pick = cands[Math.min(cands.length - 1, Math.floor(cands.length * A.auto))]; if (pick) best = pick; }
          const k = best ? best[0] : i, sd = best ? best[1] : (A.side || 1);
          P.place(T.px[k] + T.nx[k] * 1.6, T.pz[k] + T.nz[k] * 1.6, T.hd[k]); P.y = P.py = T.hy[k]; P.roadY = P.y; P.q = T.query(P.x, P.z, k, P.q);
          const bx = P.x - T.tx[k] * A.back + T.nx[k] * sd * A.out, bz = P.z - T.tz[k] * A.back + T.nz[k] * sd * A.out;
          Render.setShot({ px: bx, py: T.hy[k] + A.up, pz: bz, tx: P.x + T.tx[k] * A.ahead + T.nx[k] * sd * (A.lookOut || 0), ty: T.hy[k] - (A.down || 0), tz: P.z + T.tz[k] * A.ahead + T.nz[k] * sd * (A.lookOut || 0), fov: A.fov || 55, near: 1, sky: true, noCut: true, fogD: A.fogD || 140 }); }
        if (s.skyGrad) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'), gd = x.createLinearGradient(0, 0, 0, 256); gd.addColorStop(0, s.skyGrad[0]); gd.addColorStop(0.55, s.skyGrad[1]); gd.addColorStop(1, s.skyGrad[2]); x.fillStyle = gd; x.fillRect(0, 0, 4, 256); Render.scene.background = new THREE.CanvasTexture(c); if (s.skyGrad[3]) Render.scene.fog.color.set(s.skyGrad[3]); }
        Render.resetCam();
        for (let k = 0; k < (s.frames || 6); k++) Render.frame(1 / 30, 1, P, s.aerial ? 'tv' : g.S.camera, {});
        if (window.__styCut && window.__city) { window.__styCut.uCam.value.copy(Render.camera.position); window.__styCut.uCar.value.set(P.x, (P.y || 0) + 1, P.z); Render.frame(1 / 30, 1, P, g.S.camera, {}); }
        const inf = Render.info();
        document.querySelectorAll('body *').forEach(e => { if (e.tagName !== 'CANVAS') e.style.visibility = 'hidden'; }); for (const c of document.querySelectorAll('canvas')) c.style.visibility = c.clientWidth > innerWidth * 0.9 ? 'visible' : 'hidden';
        let verts = 0; Render.world.root.traverse(o => { if (o.isMesh && o.visible && o.geometry.attributes.position) verts += o.geometry.attributes.position.count * (o.isInstancedMesh ? o.count : 1); });
        const gv = new Map(); Render.world.root.traverse(o => { if (!o.isInstancedMesh) return; const k = o.geometry.attributes.position.array; const e = gv.get(k) || [o.geometry.attributes.position.count, 0]; e[1] += o.count; gv.set(k, e); }); const geoList = [...gv.values()].sort((a, b) => b[0] * b[1] - a[0] * a[1]).slice(0, 10);
        return Object.assign({ geoList, sceneVerts: verts, top, farm: Render.world.farm && Object.assign({}, Render.world.farm, { ks: Render.world.farm.ks.map(v => Math.round(v - T.startS)).slice(0, 12) }) }, window.__crowd);
      }, [s, key !== lastKey]);
      lastKey = key;
      if (info.top) { fs.writeFileSync(path.join(OUT, s.name + '-top.png'), Buffer.from(info.top.split(',')[1], 'base64')); delete info.top; }
      await page.screenshot({ path: path.join(OUT, s.name + '.png'), timeout: 300000 });
      console.log(s.name, JSON.stringify(info), ((Date.now() - t0) / 1000).toFixed(1) + 's');
    }
    if (errors.length) console.log('ERRORS', errors.slice(0, 5).join(' | '));
    await page.context().close();
  }
} finally { await browser.close(); await srv.close(); }
