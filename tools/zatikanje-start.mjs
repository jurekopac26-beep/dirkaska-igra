#!/usr/bin/env node
// Zatikanje na startu (raziskava, docs/zatikanje-start.md): kaj porabi čas sličice prvih ~5 s po zelenem.
// Igra v pavzi, sličice korak za korakom kot v game.js frame (seme, ponovljivo); CPU upočasnjen 4× (kot telefon, #1069), programski WebGL.
// Na sličico: čas JS (fizika + AI + trki, zvok, priprava risanja z oddajo ukazov WebGL, HUD), korakov fizike,
// klici risanja in oglišča; profil CDP (lastni čas po funkcijah, »(garbage collector)«) in sled GC (MinorGC/MajorGC).
// Na sličico tudi novi programi senčilnikov, teksture in geometrije (renderer.info): konice risanja zaradi prevajanja ali nalaganja.
// Prehodi: osnova, dohit (koraki po času prejšnje sličice, do 10 kot game.js), dohitN (enako, do N korakov: predlog), brez senc (sonce castShadow=false), brez delcev (Render.frame noFx). Igre ne spreminja: ovije jo samo na strani.
//   node tools/zatikanje-start.mjs [--proge=spa,killar,pembrey] [--avti=6,22,101] [--sek=5] [--cpu=4] [--prehodi=osnova,dohit,dohit4,sence,delci] [--izhod=pot.json]
import { serve, launch, openGame, startTrack } from '../tests/browser/lib.mjs';
import fs from 'node:fs';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const PROGE = arg('proge', 'spa,killar,pembrey').split(','), AVTI = arg('avti', '6,22,101').split(',').map(Number);
const SEK = +arg('sek', 5), CPU = +arg('cpu', 4), PREHODI = arg('prehodi', 'osnova,dohit,sence,delci').split(','), IZHOD = arg('izhod', '');
const MAXR = { killar: 60 };   // (Killarney: največ 60 tekmecev, js/tracks)

const q = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const avg = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const r1 = (x) => Math.round(x * 100) / 100;

// lastni čas profila po skupinah: ime funkcije in datoteka
function skupina(fn, url) {
  const f = url.split('/').pop();
  if (fn === '(garbage collector)') return 'gc';
  if (fn === '(program)' || fn === '(idle)' || fn === '(root)') return 'drugo';
  if (/three/.test(f)) return 'three';
  if (f === 'core.js') {
    if (/^ai|Ai[A-Z]|^aim|lineAt|^overtake|^draft|^stub/.test(fn)) return 'ai';
    if (/[cC]ollide|^pair$|_pairs|_lodPair|_byDist|crash|^touch|^push/.test(fn)) return 'trki';
    return 'fizika';
  }
  if (f === 'render.js') {
    if (/[fF]x|spark|smoke|dust|dirt|scrape|particle|fall/.test(fn)) return 'delci';
    if (/[sS]hadow/.test(fn)) return 'sence';
    return 'risanje';
  }
  if (/^sfx/.test(f)) return 'zvok';
  if (f === 'game.js') return 'igra';
  if (!url) return 'brskalnik';
  return 'drugo';
}

async function ena(browser, base, id, avti, prehod) {
  const rivals = Math.min(avti - 1, MAXR[id] || 100);
  const { ctx, page } = await openGame(browser, base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, rivals, track: id, sound: 1 }, { width: 844, height: 390 }, { seed: 12345 });
  try {
    await startTrack(page, id);
    await page.evaluate(async () => { if (Render.world && Render.world.landmarkLoad) await Render.world.landmarkLoad; });
    // ovoji na strani: Race._step (koraki), _lodPlan (koliko avtov polno), klici WebGL; senc ali delcev ni (prehod)
    await page.evaluate((prehod) => {
      const g = window.__game; g.autoDrive = true;
      const L = window.__z = { steps: 0, full: 0, lodN: 0, calls: 0, verts: 0 };
      const cv = document.querySelector('canvas'), gl = cv.getContext('webgl2') || cv.getContext('webgl'), P = Object.getPrototypeOf(gl);
      const wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { L.calls++; L.verts += count(a); return f.apply(this, a); }; };
      wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
      const RP = Core.Race.prototype, ST = RP._step; RP._step = function (...a) { L.steps++; return ST.apply(this, a); };
      const LP = RP._lodPlan; RP._lodPlan = function (...a) { const r = LP.apply(this, a); L.lodN++; if (r) { let s = 0; for (let i = 0; i < this.cars.length; i++) s += r.st[i]; L.full += s; } else L.full += this.cars.length; return r; };
      if (prehod === 'sence') Render.scene.traverse(o => { if (o.isLight && o.castShadow) o.castShadow = false; });
      // od začetka dirke (seme): skozi luči v sivo, vsako 6. sličico narisano (ogrevanje senčilnikov)
      let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      g.onAction('restart'); g.pause();
    }, prehod);
    await page.evaluate(async () => {
      const g = window.__game;
      for (let k = 0; k < 3600 && g.race.state !== 'racing'; k++) { g.sim(1 / 60, true); if (k % 6 === 0) { Render.frame(1 / 60, 1, g.race.player, g.S.camera, {}); await new Promise(r => setTimeout(r, 0)); } }
    });
    // lastna zanka igre (rAF) se ustavi: v profilu samo merjene sličice
    await page.evaluate(async () => { window.requestAnimationFrame = () => 0; await new Promise(r => setTimeout(r, 100)); });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
    const gcEv = []; cdp.on('Tracing.dataCollected', d => { for (const e of d.value) if ((e.name === 'MinorGC' || e.name === 'MajorGC') && e.ph === 'X') gcEv.push([e.name, e.dur / 1000]); });
    const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8', transferMode: 'ReportEvents' });
    // sličica kot v igri (game.js frame): koraki fizike, zvok, risanje, HUD. 60 sl./s: 2 koraka; »dohit«: koraki po času prejšnje sličice (do 10, dt do 0,1 s)
    const L = await page.evaluate(async ([sek, prehod]) => {
      const g = window.__game, z = window.__z, race = g.race, P = race.player, fr = [], f0 = z.full, n0 = z.lodN, o = prehod === 'delci' ? { noFx: true } : {};
      let acc = 0, prev = 1000 / 60;
      for (let i = 0; i < sek * 60; i++) {
        const dh = prehod.startsWith('dohit'), lim = prehod === 'dohit' ? 10 : +prehod.slice(5) || 10;
        acc += Math.min(0.1, dh ? Math.max(1 / 60, prev / 1000) : 1 / 60);
        const c0 = z.calls, v0 = z.verts, s0 = z.steps, RI = Render.info(), p0 = RI.programs ? RI.programs.length : 0, x0 = RI.memory.textures, m0 = RI.memory.geometries, t0 = performance.now();
        const nst = Math.min(lim, Math.floor(acc * 120 + 1e-6)); acc -= nst / 120; if (dh && nst >= lim) acc = 0;
        g.sim(nst / 120 - 1e-6, true); const t1 = performance.now();
        Sfx.update(race, P, null, 1); const t2 = performance.now();
        Render.frame(1 / 60, 1, P, g.S.camera, o); const t3 = performance.now();
        g.hud(1 / 60); const t4 = performance.now();
        fr.push([t4 - t0, z.steps - s0, t1 - t0, t2 - t1, t3 - t2, t4 - t3, z.calls - c0, z.verts - v0, (RI.programs ? RI.programs.length : 0) - p0, RI.memory.textures - x0, RI.memory.geometries - m0]); prev = t4 - t0;
        await new Promise(r => setTimeout(r, 0));
      }
      return { fr, full: z.full - f0, lodN: z.lodN - n0, cars: race.cars.length };
    }, [SEK, prehod]);
    const { profile } = await cdp.send('Profiler.stop'); await cdp.send('Tracing.end'); await done;
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    // lastni čas po skupinah
    const self = new Map(); const byId = new Map(profile.nodes.map(n => [n.id, n]));
    const dts = profile.timeDeltas; let tot = 0;
    for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]); const d = (dts[i + 1] != null ? dts[i + 1] : 0) / 1000; tot += d; const k = skupina(n.callFrame.functionName, n.callFrame.url); self.set(k, (self.get(k) || 0) + d); }
    const top = {}; for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]); const cf = n.callFrame; if (!cf.url) continue; const k = cf.functionName + ' ' + cf.url.split('/').pop(); top[k] = (top[k] || 0) + (dts[i + 1] || 0) / 1000; }
    const fr = L.fr, nf = fr.length, js = fr.map(f => f[0]);
    const per = (k) => r1(avg(fr.map(f => f[k])));
    const g = {}; for (const [k, v] of self) g[k] = r1(v / nf);
    const minor = gcEv.filter(e => e[0] === 'MinorGC').map(e => e[1]), major = gcEv.filter(e => e[0] === 'MajorGC').map(e => e[1]);
    return {
      id, avti: L.cars, prehod, sl: nf,
      js: { avg: r1(avg(js)), p95: r1(q(js, 0.95)), max: r1(Math.max(...js)) },
      korakov: r1(avg(fr.map(f => f[1]))), korakMax: Math.max(...fr.map(f => f[1])), sim: per(2), simP95: r1(q(fr.map(f => f[2]), 0.95)), zvok: per(3), risanje: per(4), risP95: r1(q(fr.map(f => f[4]), 0.95)), hud: per(5), klici: Math.round(avg(fr.map(f => f[6]))), klicMax: Math.max(...fr.map(f => f[6])), oglisc: Math.round(avg(fr.map(f => f[7]))),
      polno: r1(L.full / Math.max(1, L.lodN)), profil: g, profilSek: r1(tot / 1000),
      gc: { minor: minor.length, minorMs: r1(avg(minor)), minorMax: r1(Math.max(0, ...minor)), major: major.length, majorMs: r1(avg(major)), majorMax: r1(Math.max(0, ...major)), naSek: r1(gcEv.length / SEK) },
      novo: { programi: fr.reduce((a, f) => a + f[8], 0), teksture: fr.reduce((a, f) => a + Math.max(0, f[9]), 0), geometrije: fr.reduce((a, f) => a + Math.max(0, f[10]), 0), slProg: fr.filter(f => f[8] > 0).length },
      naj: fr.map((f, i) => [i, r1(f[0]), f[1], r1(f[2]), r1(f[3]), r1(f[4]), r1(f[5]), f[8], f[9], f[10]]).sort((a, b) => b[1] - a[1]).slice(0, 6),
      top: Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => [k, r1(v / nf)])
    };
  } finally { await ctx.close(); }
}

const srv = await serve(); const browser = await launch(['--autoplay-policy=no-user-gesture-required']);
const out = [];
try {
  for (const id of PROGE) for (const n of AVTI) for (const p of PREHODI) {
    if (p !== 'osnova' && n !== Math.max(...AVTI)) continue;   // (prehodi A/B samo pri največ avtih)
    const r = await ena(browser, srv.base, id, n, p); out.push(r);
    console.log(`${id} ${r.avti} ${p}: JS ${r.js.avg}/${r.js.p95}/${r.js.max} ms, korakov ${r.korakov} (max ${r.korakMax}), sim ${r.sim} (p95 ${r.simP95}), zvok ${r.zvok}, risanje ${r.risanje} (p95 ${r.risP95}), hud ${r.hud}, klici ${r.klici} (max ${r.klicMax}), oglišč ${r.oglisc}, polno ${r.polno}/${r.avti}, GC ${r.gc.minor}×${r.gc.minorMs} (max ${r.gc.minorMax}) + ${r.gc.major}×${r.gc.majorMs} (max ${r.gc.majorMax})`);
    console.log('   profil ms/sl:', JSON.stringify(r.profil), '\n   naj [sl, ms, korakov, sim, zvok, ris, hud]:', JSON.stringify(r.naj));
  }
} finally { await browser.close(); srv.close(); }
if (IZHOD) fs.writeFileSync(IZHOD, JSON.stringify(out, null, 1));
