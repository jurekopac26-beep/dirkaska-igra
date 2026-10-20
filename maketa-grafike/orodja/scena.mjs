// Skupni pomočniki za maketo grafike: zagon igre v brezglavem Chromiumu, postavitev prizora in posnetek.
// Igre same ne spreminjajo: vse poteka prek window.__game in Render, ki ju igra že izpostavi za teste.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame } from '../../tests/browser/lib.mjs';

export const MAPA = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
export { serve, launch };

// Zanka pred skripti igre: shrani primerek THREE.WebGLRenderer v window.__stilRenderer (igra ga ne izpostavi), da ga slog.js lahko ovije.
// (three r128 je UMD: najprej window.THREE = {}, nato izvozi razrede, zato past postavimo na lastnost WebGLRenderer.)
export const ZANKA = () => {
  // 1. past za THREE.WebGLRenderer (window.__stilRenderer)
  let T;
  Object.defineProperty(window, 'THREE', { configurable: true, get: () => T, set(v) {
    T = v; let C;
    Object.defineProperty(v, 'WebGLRenderer', { configurable: true, enumerable: true, get: () => C, set(c) {
      const W = function (...a) { const r = new c(...a); window.__stilRenderer = r; return r; }; W.prototype = c.prototype; C = W; } });
  } });
  // 2. navidezna ura: igra teče po sličicah po 1/60 s, neodvisno od hitrosti računalnika; ko nastane dirka, se zanka zaustavi (ročno koračenje
  //    z window.__stilStep), tako da je isti prizor ob vsakem zagonu enak (seme Math.random je tudi nastavljeno)
  let vt = 1000, pending = [], nid = 0, manual = false;
  performance.now = () => vt; Date.now = () => 1.76e12 + vt;
  window.requestAnimationFrame = (cb) => { pending.push([++nid, cb]); return nid; };
  window.cancelAnimationFrame = (i) => { pending = pending.filter(p => p[0] !== i); };
  const step = () => { vt += 1000 / 60; const run = pending; pending = []; for (const [, cb] of run) { try { cb(vt); } catch (e) { console.error(e); } } };
  window.__stilStep = (n = 1) => { for (let k = 0; k < n; k++) step(); };
  window.__stilSeed = (seed) => { let a = seed; Math.random = () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; };
  const iv = setInterval(() => {
    if (manual) return;
    const g = window.__game;
    if (g && g.race && g.pause) { g.pause(); manual = true; clearInterval(iv); return; }
    step();
  }, 0);
};

// zagon dirke kot v tests/browser/lib.mjs (startTrack), le da se Math.random tik pred »Start« znova nastavi: seme dirke je (Math.random() * 1e6) | 0
export function startTrackDet(page, id, mode, seed) {
  return page.evaluate(async ([id, mode, seed]) => {
    const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
    g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(250);
    const card = document.querySelector(`[data-track="${id}"]`); if (!card) throw new Error('ni kartice ' + id);
    card.click(); await wait(150);
    if (mode) { const b = document.querySelector(`[data-track="${id}"] [data-set="mode"] [data-v="${mode}"]`); if (!b) throw new Error('ni načina ' + mode); b.click(); await wait(150); }
    if (!window.__stilRaceWrapped) {   // (dirka dobi vedno isto seme in isto zaporedje Math.random, ne glede na to, koliko sličic je pred tem steklo)
      const R0 = Core.Race; Core.Race = class extends R0 { constructor(track, opts, ...rest) { window.__stilSeed(seed); super(track, Object.assign({}, opts, { seed: 4242 }), ...rest); } }; window.__stilRaceWrapped = true;
    }
    window.__stilSeed(seed);
    g.onAction('start');
    for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === id); k++) await wait(100);
    if (!(g.race && g.race.track.def.id === id)) throw new Error('dirka se ni začela na ' + id);
    return true;
  }, [id, mode, seed]);
}

// Prizor: proga (prava, ne testna), čas dneva, vreme, letni čas, koliko sekund avtopilota po štartu in kamera.
//   shot: ne piše nič -> kamera za avtom, kot jo vidi igralec; { shot: {...} } -> Render.setShot (obstoječa možnost fotonačina in TV kamer)
export async function openScene(browser, base, spec, viewport = { width: 1280, height: 720 }) {
  const settings = Object.assign({ quality: 'high', shadows: 1, camera: 'chase', zoom: 1.4, weather: 'dry', tod: 'day', season: 'summer', carDet: 'high', damage: 0 },
    { weather: spec.weather || 'dry', tod: spec.tod || 'day', season: spec.season || 'summer' }, spec.settings || {});
  const { page, errors } = await openGame(browser, base + '/index.html', settings, viewport, { seed: spec.seed || 7, init: ZANKA });
  await startTrackDet(page, spec.track, spec.mode, spec.seed || 7);
  await page.evaluate(async (spec) => {
    const g = window.__game;
    g.pause();
    const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
    for (const id of ['hud', 'h-msg']) { const h = document.getElementById(id); if (h) h.style.display = 'none'; }
    Render.scene.visible = false;   // (koraki brez risanja: hitro)
    for (let k = 0; k < 14 && (g.race.state !== 'racing' || g.race.time < 5); k++) { g.sim(1, true); window.__stilStep(1); }
    for (let k = 0; k < (spec.sim || 0); k++) { g.sim(1, true); window.__stilStep(1); }
    if (spec.pit) {   // postanek v boksih: po prvem krogu avto zapelje v boks, ekipa dela; ustavimo sredi popravila (kot tests/browser/pits.test.mjs)
      const P = g.race.player, Tk = g.race.track; let n = 0;
      for (let k = 0; k < 40000; k++) {
        const lock = P.inPit && !P.pitDone && P.pitState !== 'stop' && P.pitState !== 'repair';
        if (lock) g.sim(0.05, false, spec.pit.lock || 1, 0); else g.sim(0.05, true);
        Render.frame(0.05, 1, P, 'chase', {});
        if (P.lap >= 1 && !P.repairN && !P.inPit && !Tk.pitAt(P.q.s)) { P.pitWant = true; if (P.dmg < 0.3) P.dmg = 0.4; }
        if (P.pitState === 'repair') { if (++n >= (spec.pit.work || 40)) break; }
      }
    }
    if (spec.after) { try { new Function('g', 'Render', 'Core', spec.after)(g, Render, Core); } catch (err) { console.error('after: ' + err.message); } }
    for (let k = 0; k < 40; k++) Render.frame(1 / 30, 1, g.race.player, 'chase', {});   // (kamera za avtom se umiri, brez risanja)
    Render.scene.visible = true;
  }, spec);
  return { page, errors };
}

// posnetek kot PNG (Buffer); kamera: v prizoru ali podana; sirina: dolga stranica v slikovnih pikah
export async function posnemi(page, spec, sirina = 1280) {
  const dataUrl = await page.evaluate(([spec, sirina]) => {
    const g = window.__game, P = g.race.player;
    if (spec.shot) Render.setShot(typeof spec.shot === 'function' ? spec.shot(P) : Object.assign({}, spec.shot));
    if (spec.shotJs) Render.setShot(new Function('P', 'g', 'Render', 'Core', 'THREE', 'return (' + spec.shotJs + ')')(P, g, Render, Core, THREE));
    const c = Render.snapshot(P, 'chase', sirina);
    if (spec.shot || spec.shotJs) Render.setShot(null);
    return c.toDataURL('image/png');
  }, [spec, sirina]);
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

export const shrani = (file, buf) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buf); };
