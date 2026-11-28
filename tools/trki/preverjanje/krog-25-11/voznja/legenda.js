'use strict';
// (3) duh "legenda" na Pikes Peak (game.js pkLegJob/pkLegRun): voznja se izracuna s trenutno razlicico trkov. Posnemanje zanke:
// Park-Miller 97, aiControl + step + rescue (stuckT/wrongT > 3), damage 0, tt, laps 1, seme 7, do 420 s. Veja cv 6 / cv 1 / splet proti main.
const { SNAP, MAIN, load } = require('../fizika/lib.js');
const S = load(SNAP), M = load(MAIN), STEP = 1 / 120;
const CARS = { pikes: ['formula', 'ev', 'strega', 'levs'], pikesg: ['formula', 'truck', 'strega', 'levs'] };
const WX = { suho: { rain: 0, winter: false }, mokro: { rain: 1, winter: false }, zima: { rain: 0, winter: true } };
const TR = (process.env.TRACKS || 'pikes,pikesg').split(','), WS = (process.env.WX || 'suho,mokro,zima').split(',');
const CFG = { cv6: (C) => { C.setCrash({ glass: 1 }); C.setTest({ cv: 6 }); }, cv1: (C) => { C.setCrash({ glass: 1 }); C.setTest({ cv: 1 }); }, splet: (C) => { C.setCrash({ net: 1 }); C.setTest({}); }, main: (C) => { C.setCrash({}); C.setTest({}); } };
const tracks = new Map();
function run(L, tid, mid, wx, cfg) {
  const C = L.C; CFG[cfg](C);
  const key = (L === S ? 's' : 'm') + tid; if (!tracks.has(key)) tracks.set(key, new C.Track(C.TRACKS.find(d => d.id === tid)));
  let s = 97; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }, orig = Math.random; Math.random = rnd;
  const r = new C.Race(tracks.get(key), { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS.find(m => m.id === mid), assist: 2, phys: 'cs', seed: 7, difficulty: 1, rain: wx.rain, winter: wx.winter, damage: 0, tt: true }); r.start();
  const P = r.player, tr = []; let resc = 0;
  while (!P.finished && r.time < 420) { C.aiControl(P, r, STEP); r.step(STEP); if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } tr.push(P.x, P.z, P.y || 0, P.h, P.vx, P.vz); }
  Math.random = orig;
  return { tr, fin: P.finished ? P.finishTime : null, resc };
}
const first = (a, b) => { const n = Math.min(a.tr.length, b.tr.length); for (let i = 0; i < n; i++) if (a.tr[i] !== b.tr[i]) return 'RAZLIKA korak ' + Math.floor(i / 6) + ' (' + (Math.floor(i / 6) * STEP).toFixed(2) + ' s) cilj ' + a.fin + ' / ' + b.fin; return a.tr.length === b.tr.length ? 'ENAKO' : 'RAZLICNA DOLZINA'; };
for (const tid of TR) for (const mid of CARS[tid]) for (const w of WS) {
  const m = run(M, tid, mid, WX[w], 'main'), a = run(S, tid, mid, WX[w], 'cv6');
  let line = `${tid}/${mid}/${w} main cilj ${m.fin == null ? 'ni' : m.fin.toFixed(3)} resitev ${m.resc} | veja cv6: ${first(a, m)}`;
  if (first(a, m) !== 'ENAKO') { const b = run(S, tid, mid, WX[w], 'cv1'), n = run(S, tid, mid, WX[w], 'splet'); line += ` | veja cv1: ${first(b, m)} | veja splet: ${first(n, m)}`; }
  console.log(line);
}
