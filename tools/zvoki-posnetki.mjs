// Kratki posnetki zvoka igre z zvoki okolja (docs/zvoki-okolja.md, korak 5: uglaševanje po ušesu, posnetki za uporabnika): dirka na pravi
// progi v brskalniku (kot v testih), avto na avtopilotu od --m metrov od starta (--stoji: zavira in stoji tam, motor v prostem teku), in
// kar igra pošlje zvočnikom, --t sekund (MediaStreamDestination ob izhodu konteksta: ves zvok dirke). Posnetek je mp3 (ffmpeg) ali webm.
//   node tools/zvoki-posnetki.mjs <id> [--m 0] [--t 15] [--amb 1] [--stoji] [--zvon] [--tod day|dawn|dusk|night] [--season summer|autumn|winter]
//       [--rain 0..1] [--ime ime] [--out mapa]
//   node tools/zvoki-posnetki.mjs --seznam posnetki.json [--out mapa]   več posnetkov v enem brskalniku: [{ id, m, t, amb, stoji, zvon, tod,
//       season, rain, ime, opts }, …]; opts: različica mešalnika za primerjavo po ušesu (SfxOkolje.opts, npr. { "birdP": 2 }: ptice 2-krat
//       pogosteje), vsak posnetek začne s privzetimi
// --amb: Zvoki okolja 0 Izklop, 0.5 Tiho, 1 Normalno (privzeto), 2 Glasno; --zvon: zvonovi cerkve gotovo (SfxOkolje.opts.bellP 1). Izpiše, kaj je bilo
// slišati (podlage, ptice, zvonovi, črede, golobi, hitrost). Posnetkov ne commitaj (privzeta mapa je začasna).
import { serve, launch, openGame, startTrack } from '../tests/browser/lib.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf(k); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = (k) => { const i = argv.indexOf(k); if (i < 0) return false; argv.splice(i, 1); return true; };
const list = opt('--seznam'), out = opt('--out') || path.join(os.tmpdir(), 'zvoki-posnetki');
const one = { m: +(opt('--m') || 0), t: +(opt('--t') || 15), amb: +(opt('--amb') ?? 1), tod: opt('--tod') || 'day', season: opt('--season') || 'summer', rain: +(opt('--rain') || 0), ime: opt('--ime'), stoji: flag('--stoji'), zvon: flag('--zvon') };
const clips = list ? JSON.parse(fs.readFileSync(list, 'utf8')) : argv[0] ? [Object.assign({ id: argv[0] }, one)] : [];
if (!clips.length) { console.log('Uporaba: node tools/zvoki-posnetki.mjs <id> [--m 0] [--t 15] [--amb 1] [--stoji] … ali --seznam f.json'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
let ffmpeg = true; try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (_) { ffmpeg = false; }

// (before the game's scripts: every AudioContext gets a MediaStreamDestination, and whatever is connected to the speakers goes there too)
const init = () => {
  // (the picture not drawn: without a graphics card each frame takes a tenth of a second or more, the game then runs slower than time and
  // its sounds move by steps; the draw calls do nothing, the rest of the frame as in the game)
  for (const G of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) if (G) for (const m of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced', 'drawRangeElements']) if (G.prototype[m]) G.prototype[m] = function () { };
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const con = AudioNode.prototype.connect; window.__ctxs = [];
  window.AudioContext = class extends AC { constructor(o) { super(o); try { this.__rec = this.createMediaStreamDestination(); window.__ctxs.push(this); } catch (_) { } } };
  AudioNode.prototype.connect = function (t, ...a) { const r = con.call(this, t, ...a); if (t && this.context && t === this.context.destination && this.context.__rec) con.call(this, this.context.__rec); return r; };
  window.__record = (ms) => new Promise((res, rej) => {
    const c = window.__ctxs.find(x => x.state === 'running') || window.__ctxs[0]; if (!c) { rej(new Error('ni zvočnega konteksta')); return; }
    const mr = new MediaRecorder(c.__rec.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 }), ch = [];
    mr.ondataavailable = (e) => { if (e.data && e.data.size) ch.push(e.data); };
    mr.onstop = async () => { const b = new Uint8Array(await new Blob(ch).arrayBuffer()); let s = ''; for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode.apply(null, b.subarray(i, i + 32768)); res(btoa(s)); };
    mr.start(1000); setTimeout(() => mr.stop(), ms);
  });
};

const srv = await serve(), browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: clips[0].id, sound: 1, music: 0, radio: 0 }, { width: 320, height: 180 }, { init });
  await page.evaluate(() => {   // (--stoji: the autopilot's control, then for the player's car the gas off, the brake on while it moves, then the handbrake: no reverse)
    const ai = Core.aiControl; Core.aiControl = function (P, race) { const r = ai.apply(this, arguments); if (window.__hold && race && P === race.player) { P.inThr = 0; const mv = Math.abs(P.speed) > 1; P.inBrk = mv ? 1 : 0; P.inHand = mv ? 0 : 1; } return r; };
  });
  await page.evaluate(() => Sfx.resume());
  let O0 = null;   // (the mixer's own options, before any clip's)
  for (const c of clips) {
    const C = Object.assign({ m: 0, t: 15, amb: 1, tod: 'day', season: 'summer', rain: 0, stoji: false, zvon: false }, c);
    const ime = C.ime || `${C.id}-${C.m}m${C.stoji ? '-stoji' : ''}-amb${C.amb}`;
    await startTrack(page, C.id);
    await page.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n >= 10 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); setTimeout(r, 15000); }));   // (the race's first frames: its world drawn once)
    if (!O0) O0 = await page.evaluate(() => Object.assign({}, SfxOkolje.opts));
    const at = await page.evaluate(async (C) => {
      const g = window.__game, P = g.race.player, T = g.race.track, len = T.len, wait = (ms) => new Promise(r => setTimeout(r, ms));
      document.querySelector('.seg[data-set="amb"] button[data-v="' + C.amb + '"]').click();
      Render.setAtmos({ season: C.season, tod: C.tod }); g.race.setRain(C.rain);
      Object.assign(SfxOkolje.opts, C.O0, C.zvon ? { bellP: 1, bellGap: 20 } : {}, C.opts || {});
      g.pause(); g.autoDrive = true; window.__hold = false;
      const rem = () => T.open ? C.m - P.q.s : ((C.m - P.q.s) % len + len) % len;
      if (C.m > 0) for (let k = 0; k < 600 && rem() > 2 && (T.open || rem() < len - 100); k++) g.sim(0.25, true);
      window.__hold = !!C.stoji; g.resume();
      await wait(400); SfxOkolje.prep(); await wait(C.m > 0 ? 4000 : 1500);   // (the voices at once; after a jump the world drawn)
      if (C.stoji) { const t0 = performance.now(); while (Math.abs(P.speed) > 0.3 && performance.now() - t0 < 20000) await wait(100); await wait(3000); }   // (the car stopped, the beds faded in)
      return { s: Math.round(P.q.s), kmh: Math.round(P.speed * 3.6) };
    }, Object.assign({ O0 }, C));
    const n0 = await page.evaluate(() => SfxOkolje.levels().n);
    // (the frames a second while it records: slow frames, fewer of the mixer's steps, fewer birds than in the game; then wait longer first)
    await page.evaluate(() => { window.__fr = 0; const f = () => { window.__fr++; if (window.__frOn) requestAnimationFrame(f); }; window.__frOn = true; requestAnimationFrame(f); });
    const b64 = await page.evaluate((ms) => window.__record(ms), Math.round(C.t * 1000));
    const fps = await page.evaluate((t) => { window.__frOn = false; return Math.round(window.__fr / t); }, C.t);
    const L = await page.evaluate(() => { const g = window.__game, P = g.race.player; g.pause(); window.__hold = false; return { s: Math.round(P.q.s), kmh: Math.round(P.speed * 3.6), L: SfxOkolje.levels() }; });
    const webm = path.join(out, ime + '.webm'); fs.writeFileSync(webm, Buffer.from(b64, 'base64'));
    let file = webm;
    if (ffmpeg) { file = path.join(out, ime + '.mp3'); execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-ac', '2', '-b:a', '128k', file]); fs.unlinkSync(webm); }
    const d = {}; for (const k in L.L.n) if (L.L.n[k] - (n0[k] || 0)) d[k] = L.L.n[k] - (n0[k] || 0);
    const beds = Object.entries(L.L.beds).filter(([, v]) => v > 0.005).map(([b, v]) => b + ' ' + v.toFixed(2)).join(', ');
    console.log(`${ime}: ${path.relative(process.cwd(), file)} (${Math.round(fs.statSync(file).size / 1024)} KB) · s ${at.s}–${L.s} m, ${at.kmh}–${L.kmh} km/h · ${fps} sličic/s · okolje ${L.L.master}/${L.L.full} · podlage: ${beds || 'nič'} · ${JSON.stringify(d)}`);
  }
  if (errors.length) console.log('NAPAKE V STRANI:\n' + errors.slice(0, 5).join('\n'));
} finally { await browser.close(); await srv.close(); }
