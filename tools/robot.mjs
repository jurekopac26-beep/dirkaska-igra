// The night robot: one lap of each real track on the autopilot (the time trial, the phone's picture: 844 x 390, normal quality, low
// detail, shadows, the chase camera), and what a player would trip over on it:
//   nalaganje  the track's load (from the tap on Start to the race standing on the grid, and the world's own build: __game.loadMs); over 5 s
//   zid        the car stopped by something on the road: stuck for over 3 s (put back, as a player's Na progo), or a knock that takes
//              over 8 m/s off it in a quarter of a second with no other car on the track (an invisible wall, a kerb's edge, a stub)
//   padec      the car falling (c.fall) or over 3 m under the road's own height
//   zatikanje  a frame over the phone's budget (300 draw calls, 900 thousand vertices: tests/golden/perf.json), sampled once a second of
//              the lap (the frame's time is only reported: the headless browser draws in software, its times say little of a phone's)
// The frozen tracks (test: true, pending: true) are left out. test-results/robot/porocilo.json and porocilo.md; the exit code 1 with
// anything found (--mehko: 0, a report only).
//   node tools/robot.mjs                      (every real track)
//   node tools/robot.mjs spa,killar           (these)
//   node tools/robot.mjs --del 2/4            (the second quarter of the list: a night's matrix)
import fs from 'node:fs';
import path from 'node:path';
import { REPO, serve, launch, openGame, trackIds } from '../tests/browser/lib.mjs';

const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; }, has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const del = flag('--del'), mehko = has('--mehko'), LOAD_MS = 5000, CALLS = 300, VERTS = 900e3, CAP = 600;
const out = path.join(REPO, 'test-results', 'robot');
const SET = { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2 };
const srv = await serve(), browser = await launch(), rep = [];
try {
  let ids;
  { const { page } = await openGame(browser, srv.base + '/index.html', SET, { width: 844, height: 390 }, { seed: 12345 });
    const frozen = await page.evaluate(() => Core.TRACKS.filter(d => d.test || d.pending).map(d => d.id));
    ids = (await trackIds(page)).filter(id => !frozen.includes(id)); await page.close(); }
  if (args[0]) { const want = args[0].split(','), bad = want.filter(id => !ids.includes(id)); if (bad.length) throw new Error('ni proge (ali je zamrznjena): ' + bad.join(', ')); ids = want; }
  if (del) { const [k, n] = del.split('/').map(Number); ids = ids.filter((_, i) => i % n === k - 1); }
  for (const id of ids) {
    const { page, errors } = await openGame(browser, srv.base + '/index.html', SET, { width: 844, height: 390 }, { seed: 12345 });
    let r;
    try {
      r = await page.evaluate(async ([id, CAP]) => {
        const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
        const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl'), GL = { calls: 0, verts: 0 };
        const Pr = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = Pr[name]; if (!f) return; Pr[name] = function (...a) { GL.calls++; GL.verts += count(a); return f.apply(this, a); }; };
        wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
        g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(250);
        const card = document.querySelector(`[data-track="${id}"]`); if (!card) throw new Error('no track card ' + id);
        card.click(); await wait(150);
        const b = document.querySelector(`[data-track="${id}"] [data-set="mode"] [data-v="tt"]`); if (b) { b.click(); await wait(150); }
        const t0 = performance.now(); g.onAction('start');
        for (let k = 0; k < 6000 && !(g.race && g.race.track.def.id === id); k++) await wait(20);
        if (!(g.race && g.race.track.def.id === id)) throw new Error('race did not start on ' + id);
        const load = Math.round(performance.now() - t0), build = Math.round(g.loadMs);
        await wait(300); g.pause();
        const R = g.race, P = R.player, T = R.track, len = T.raceLen || T.len, found = [], fr = [], lap0 = P.lap, alone = R.cars.length < 2;
        const note = (kind, o) => { const last = found[found.length - 1]; if (last && last.kind === kind && Math.abs(last.s - Math.round(P.q.s)) < 60) { last.n++; return; } found.push({ kind, s: Math.round(P.q.s), t: +R.time.toFixed(1), n: 1, ...o }); };
        let t = 0, v0 = P.speed, done = false;
        for (; t < CAP && !done; t += 0.25) {
          g.sim(0.25, true);
          if (!Number.isFinite(P.x) || !Number.isFinite(P.speed)) { note('zid', { why: 'NaN' }); break; }
          if (alone && !P.inPit && v0 - P.speed > 8) note('zid', { why: 'udarec', v: +v0.toFixed(1), v1: +P.speed.toFixed(1), d: +(P.q.d || 0).toFixed(1) });
          if (P.fall || (!P.air && P.q.k < 0 && P.y < T.yAt(P.q) - 3)) { note('padec', { y: +P.y.toFixed(1) }); R.rescue(P); }
          else if (!P.inPit && !P.finished && (P.stuckT > 3 || P.wrongT > 3)) { note('zid', { why: P.stuckT > 3 ? 'obtičal' : 'narobe obrnjen', d: +(P.q.d || 0).toFixed(1) }); R.rescue(P); }
          v0 = P.speed; done = P.finished || P.lap > lap0 + 1 || g.phase === 'done';
          if (Math.abs(t % 1) < 1e-6) {   // (a frame a second: its draw calls, vertices and time)
            GL.calls = 0; GL.verts = 0; const f0 = performance.now(); Render.frame(1 / 60, 1, P, g.S.camera, {}); gl.finish();
            fr.push({ s: Math.round(P.q.s), calls: GL.calls, verts: GL.verts, ms: +(performance.now() - f0).toFixed(1) });
          }
        }
        return { load, build, len: Math.round(len), t, done, found, fr };
      }, [id, CAP]);
    } catch (e) { r = { err: String(e.message || e).split('\n')[0] }; }
    await page.close();
    const o = { id, ...r, najdbe: [] };
    if (r.err) o.najdbe.push({ kind: 'napaka', why: r.err });
    else {
      const ms = r.fr.map(f => f.ms).sort((a, b) => a - b), med = ms[ms.length >> 1] || 0;
      if (r.load > LOAD_MS) o.najdbe.push({ kind: 'nalaganje', ms: r.load, svet: r.build });
      if (!r.done) o.najdbe.push({ kind: 'zid', why: `krog ni končan v ${CAP} s` });
      o.najdbe.push(...r.found);
      const over = r.fr.filter(f => f.calls > CALLS || f.verts > VERTS);
      if (over.length) { const w = over.reduce((a, f) => (f.calls / CALLS + f.verts / VERTS > a.calls / CALLS + a.verts / VERTS ? f : a)); o.najdbe.push({ kind: 'zatikanje', n: over.length, s: w.s, calls: w.calls, verts: w.verts, ms: w.ms }); }
      o.mediana = med; o.najvec = { calls: Math.max(...r.fr.map(f => f.calls)), verts: Math.max(...r.fr.map(f => f.verts)), ms: ms[ms.length - 1] || 0 };
      delete o.fr; delete o.found;
    }
    if (errors.length) o.najdbe.push({ kind: 'napaka', why: errors[0].slice(0, 200), n: errors.length });
    rep.push(o);
    console.log(`${o.najdbe.length ? 'NAJDBA' : 'OK    '} ${id.padEnd(14)} nalaganje ${r.err ? '-' : (r.load / 1000).toFixed(1) + ' s'}${r.err ? '' : `  krog ${r.t.toFixed(0)} s  največ ${o.najvec.calls} klicev, ${Math.round(o.najvec.verts / 1000)} tisoč oglišč`}${o.najdbe.map(f => `\n         ${f.kind}${f.s != null ? ' pri ' + f.s + ' m' : ''} ${JSON.stringify({ ...f, kind: undefined, s: undefined })}`).join('')}`);
  }
} finally { await browser.close(); srv.close(); }
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'porocilo.json'), JSON.stringify(rep, null, 1));
const bad = rep.filter(o => o.najdbe.length), slow = [...rep].filter(o => o.load).sort((a, b) => b.load - a.load).slice(0, 5);
fs.writeFileSync(path.join(out, 'porocilo.md'), [`## Nočni robot: ${rep.length} prog, ${bad.length} z najdbami`, '',
  ...(bad.length ? ['| proga | kaj | kje (m) | podrobnosti |', '|---|---|---|---|', ...bad.flatMap(o => o.najdbe.map(f => `| ${o.id} | ${f.kind} | ${f.s != null ? f.s : ''} | ${JSON.stringify({ ...f, kind: undefined, s: undefined }).replace(/\|/g, '/')} |`))] : ['Brez najdb.']), '',
  'Najdaljše nalaganje: ' + slow.map(o => `${o.id} ${(o.load / 1000).toFixed(1)} s`).join(', ') + ` (cilj pod ${LOAD_MS / 1000} s).`, ''].join('\n'));
console.log(`\n${rep.length} prog, ${bad.length} z najdbami: ${path.relative(REPO, path.join(out, 'porocilo.md'))}`);
process.exit(bad.length && !mehko ? 1 : 0);
