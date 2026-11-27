#!/usr/bin/env node
// Gneča 101 avta v brskalniku: čas sličice na telefonu (844×390, dotik, procesor 4× počasnejši), prava zanka igre (game.js frame), avtopilot
// vozi igralčev avto. Primerjava: dirka s 100 tekmeci proti vožnji sam na progi (0 tekmecev = kot vožnja na čas).
// Ura je navidezna kot v tools/zatikanje-start.mjs --zanka: naslednja sličica pride max(1/60 s, čas JS prejšnje) za prejšnjo. Programski
// WebGL (SwiftShader) riše na procesorju 120–180 ms na sličico, telefon s pravim GPU ne: zato sličice čakajo pravi rAF (čas JS ni popačen
// z zastojem ukazov GPU), igra pa dobi navidezni čas, da je korakov na sličico toliko kot na telefonu.
// Na sličico: razmik (povprečje, p95, najdaljši) = max(16,7 ms, čas JS), koraki fizike in njihov čas (Race.step), risanje (Render.frame:
// priprava in oddaja ukazov WebGL), ostalo (HUD, zvok, vnos); hitrost dirke = čas dirke / navidezna ura (pod 100 %: omejitev korakov).
// Igre ne spreminja: ovije jo samo na strani.
//   node tools/gneca-slicica.mjs [--proga=spa] [--tekmeci=100,0] [--mesto=50] [--sek=20] [--od=0.5] [--cpu=4] [--ponovi=1]
//                                [--lod='{"nrT":0}'] [--profil=20] [--sklad=1] [--skupno=1] [--izhod=pot.json] [--slika=pot.png] [--dsf=2]
//   --mesto=N: start z mesta N na startni vrsti (zastoj v prvem ovinku; igra da polju nad 22 avtov leteči start, igralec zadnji: --mesto=0);
//   --sek: sekund navidezne ure od --od s časa dirke; --lod: nastavitve Core.LOD za obisk (JSON); --profil=N: N funkcij z največ lastnega
//   časa (profil CDP, ms na sličico), --sklad=1: s klicatelji (dve ravni), --skupno=1: skupni čas (funkcija s svojimi klici); postavitev = razporeditev in slog strani (CDP, zunaj časa JS
//   ali v njem, če jo skript izsili); --slika: slika zaslona na koncu (ime dobi število avtov; --dsf: gostota pik slike); GAME_ROOT=pot: igra iz druge mape.
import { serve, launch, openGame, startTrack } from '../tests/browser/lib.mjs';
import fs from 'node:fs';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const PROGA = arg('proga', 'spa'), TEKMECI = arg('tekmeci', '100,0').split(',').map(Number), SEK = +arg('sek', 20), OD = +arg('od', 0.5), CPU = +arg('cpu', 4);
const MESTO = +arg('mesto', 50), PONOVI = +arg('ponovi', 1), LOD = JSON.parse(arg('lod', '{}')), PROFIL = +arg('profil', 0), SKLAD = +arg('sklad', 0), SKUPNO = +arg('skupno', 0), IZHOD = arg('izhod', ''), SLIKA = arg('slika', ''), DSF = +arg('dsf', 0);
const q = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const avg = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0, r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 100) / 100;

async function ena(browser, base, rivals) {
  const { ctx, page, errors } = await openGame(browser, base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, rivals, track: PROGA, sound: 1 }, { width: 844, height: 390 }, Object.assign({ seed: 12345, touch: true }, DSF ? { context: { deviceScaleFactor: DSF } } : {}));
  try {
    await page.evaluate(([lod, mesto]) => {
      Object.assign(Core.LOD, lod);
      if (mesto) { const R0 = Core.Race; Core.Race = class extends R0 { constructor(t, o) { super(t, o && o.numAI > 21 ? Object.assign({}, o, { playerGrid: mesto, flying: 0 }) : o); } }; }
    }, [LOD, MESTO]);
    await startTrack(page, PROGA);
    await page.evaluate(async () => { if (Render.world && Render.world.landmarkLoad) await Render.world.landmarkLoad; window.__game.autoDrive = true; });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    // ovoji: zanka (rAF z navidezno uro), koraki (Race.step), risanje (Render.frame), klici WebGL
    await page.evaluate(([sek, od]) => {
      const Z = window.__z = { on: false, done: false, f: [], cur: null, calls: 0, verts: 0, now: 0, t0: 0 };
      const RP = Core.Race.prototype, ST = RP.step;
      RP.step = function (dt) { const c = Z.cur; if (!c) return ST.call(this, dt); const a = performance.now(); ST.call(this, dt); c.n++; c.s += performance.now() - a; };
      const RF = Render.frame;
      Render.frame = function (...a) { const c = Z.cur; if (!c) return RF.apply(this, a); const t = performance.now(), r = RF.apply(this, a); c.r += performance.now() - t; return r; };
      const cv = document.querySelector('canvas'), gl = cv.getContext('webgl2') || cv.getContext('webgl'), P = Object.getPrototypeOf(gl);
      const wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { Z.calls++; Z.verts += count(a); return f.apply(this, a); }; };
      wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (f) => raf((t) => {
        const g = window.__game, R = g.race;
        if (f.name !== 'frame' || Z.done) return f(t);
        if (!Z.on) { if (!(g.phase === 'racing' && R && R.state === 'racing' && R.time >= od)) return f(t); Z.on = true; Z.now = Z.t0 = t; }
        const c = Z.cur = { v: Z.now, js: 0, n: 0, s: 0, r: 0, rt: R.time, calls: 0, verts: 0 };
        Z.calls = 0; Z.verts = 0; const a = performance.now(); f(Z.now); c.js = performance.now() - a; c.calls = Z.calls; c.verts = Z.verts; Z.cur = null; Z.f.push(c);
        Z.now += Math.max(1000 / 60, c.js);
        if (Z.now - Z.t0 >= sek * 1000) { Z.on = false; Z.done = true; Z.rt = R.time; }
      });
    }, [SEK, OD]);
    await page.waitForFunction(() => window.__z.on || window.__z.done, null, { timeout: 600000, polling: 200 });
    await cdp.send('Performance.enable');
    const lay = async () => { const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value])); return { t: (m.LayoutDuration + m.RecalcStyleDuration) * 1000, n: await page.evaluate(() => window.__z.f.length) }; }, lay0 = await lay();
    if (PROFIL) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start'); }
    await page.waitForFunction(() => window.__z.done, null, { timeout: 900000, polling: 200 });
    const lay1 = await lay(); let top = null;
    if (PROFIL) {
      const { profile } = await cdp.send('Profiler.stop'), self = new Map(), dt = profile.timeDeltas, byId = new Map(profile.nodes.map(n => [n.id, n])), par = new Map();
      for (const n of profile.nodes) for (const c of n.children || []) par.set(c, n);
      const ime = (n) => (n.callFrame.functionName || '(anon)') + ' · ' + (n.callFrame.url.split('/').pop() || '-') + ':' + (n.callFrame.lineNumber + 1);
      profile.samples.forEach((id, i) => {
        if (SKUPNO) { const d = (dt[i] || 0) / 1000, seen = new Set(); for (let m = byId.get(id); m; m = par.get(m.id)) { const k = ime(m); if (!seen.has(k)) { seen.add(k); self.set(k, (self.get(k) || 0) + d); } } return; }
        const n = byId.get(id), p1 = SKLAD ? par.get(id) : null, p2 = p1 ? par.get(p1.id) : null, k = ime(n) + (p1 ? ' ← ' + ime(p1) : '') + (p2 ? ' ← ' + ime(p2) : ''); self.set(k, (self.get(k) || 0) + (dt[i] || 0) / 1000);
      });
      top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, PROFIL);
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const R = await page.evaluate(() => { const Z = window.__z, g = window.__game, L = g.race._lod, P = g.race.player; return { f: Z.f, rt: Z.rt, n: g.race.cars.length, lod: !!(L && L.on), mesto: g.race.cars.filter(c => c.dist > P.dist).length + 1 }; });
    if (SLIKA) await page.screenshot({ path: SLIKA.replace(/(\.\w+)$/, '-' + R.n + '$1') });
    const f = R.f, iv = f.map(c => Math.max(1000 / 60, c.js)), ura = iv.reduce((s, x) => s + x, 0) / 1000, steps = f.reduce((s, c) => s + c.n, 0);
    const o = { proga: PROGA, tekmeci: rivals, avtov: R.n, lod: R.lod, mesto: R.mesto, slicic: f.length, razmik: r1(avg(iv)), p95: r1(q(iv, 0.95)), najdaljsa: r1(Math.max(...iv)), js: r1(avg(f.map(c => c.js))),
      korakov: r1(steps / f.length), korakovNajvec: Math.max(...f.map(c => c.n)), msKorak: r2(f.reduce((s, c) => s + c.s, 0) / Math.max(1, steps)), fizika: r1(avg(f.map(c => c.s))), risanje: r1(avg(f.map(c => c.r))),
      ostalo: r1(avg(f.map(c => c.js - c.s - c.r))), postavitev: r1((lay1.t - lay0.t) / Math.max(1, lay1.n - lay0.n)), hitrost: Math.round((R.rt - f[0].rt) / ura * 100), klici: Math.round(avg(f.map(c => c.calls))), kliciNajvec: Math.max(...f.map(c => c.calls)), oglisca: Math.round(avg(f.map(c => c.verts)) / 1000), oglisceNajvec: Math.round(Math.max(...f.map(c => c.verts)) / 1000), napake: errors.length };
    console.log(`${PROGA}, ${o.avtov} avtov${o.lod ? ' (LOD)' : ''}${R.n > 1 ? ', igralec na koncu ' + o.mesto + '.' : ''}: sličica ${o.razmik} ms (p95 ${o.p95}, najdaljša ${o.najdaljsa}) = fizika ${o.fizika} (${o.korakov} korakov × ${o.msKorak}, največ ${o.korakovNajvec}) + risanje ${o.risanje} + ostalo ${o.ostalo}; postavitev strani ${o.postavitev}; hitrost dirke ${o.hitrost} %, klici ${o.klici} (največ ${o.kliciNajvec}), oglišča ${o.oglisca} tisoč (največ ${o.oglisceNajvec})${errors.length ? '; NAPAKE: ' + errors.slice(0, 3).join(' | ') : ''}`);
    if (top) for (const [k, v] of top) console.log(`   ${String(r2(v / f.length)).padStart(6)} ms/sličico  ${k}`);
    return Object.assign(o, top ? { profil: top.map(([k, v]) => [k, r2(v / f.length)]) } : {}, IZHOD ? { slicice: f.map(c => [r1(c.js), c.n, r1(c.s), r1(c.r)]) } : {});
  } finally { await ctx.close(); }
}

const srv = await serve(), browser = await launch(), out = [];
try {
  console.log(`telefon 844×390, procesor ${CPU}× počasnejši, ${SEK} s od ${OD} s dirke${MESTO ? ', start z mesta ' + MESTO : ', leteči start'}${Object.keys(LOD).length ? ', LOD ' + JSON.stringify(LOD) : ''}`);
  for (const n of TEKMECI) for (let k = 0; k < PONOVI; k++) out.push(await ena(browser, srv.base, n));
  if (IZHOD) fs.writeFileSync(IZHOD, JSON.stringify(out, null, 1));
} finally { await browser.close(); await srv.close(); }
