// kvali.js: simulirane kvalifikacije tekmecev (game.js qsimStep: vsak tekmec sam, noPlayer, aiOrder [k], laps 1, damage 0) s trenutno razlicico trkov: veja cv 6 proti main
const { load, SNAP, MAIN } = require('../fizika/lib.js');
const S = load(SNAP), M = load(MAIN), E = process.env, STEP = 1 / 120, CV = +(E.CV || 6), nAI = +(E.NAI || 12), OP = E.OPTS ? JSON.parse(E.OPTS) : {};
S.C.setCrash({ glass: 1 }); S.C.setTest({ cv: CV });
const tracks = new Map(), T = (L, tid) => { const k = (L === S ? 's' : 'm') + tid; if (!tracks.has(k)) tracks.set(k, new L.C.Track(L.C.TRACKS.find(d => d.id === tid))); return tracks.get(k); };
const mk = (L, tid, k) => { Math.random = L.SIM.seeded(7); const r = new L.C.Race(T(L, tid), Object.assign({ numAI: nAI, aiOrder: [k], noPlayer: true, playerModel: L.C.MODELS.find(m => m.id === (E.MOD || 'rally')), laps: 1, difficulty: 1, phys: 'cs', rain: 0, seed: 9, damage: 0 }, OP)); r.start(); return r; };
for (const tid of (E.TRACKS || 'spa,montreal,gora').split(',')) { let same = 0; const out = [];
  for (let k = 0; k < nAI; k++) { const ra = mk(S, tid, k), rb = mk(M, tid, k), a = ra.cars[0], b = rb.cars[0], cap = ra.track.len / 8 + 120; let t = 0, d = -1, K = 0;
    while ((!a.finished || !b.finished) && t < cap) { Math.random = S.SIM.seeded(1000 + K); if (!a.finished) ra.step(STEP); Math.random = M.SIM.seeded(1000 + K); if (!b.finished) rb.step(STEP); t += STEP;
      if (d < 0 && (a.x !== b.x || a.z !== b.z || a.vx !== b.vx || a.vz !== b.vz || a.h !== b.h)) d = K; K++; }
    const ta = a.finished ? a.lapTimes[0] : Infinity, tb = b.finished ? b.lapTimes[0] : Infinity;
    if (d < 0 && ta === tb) same++; else out.push('tekmec ' + k + ' ' + a.m.id + ' razlika k=' + d + ' (' + (d / 120).toFixed(2) + ' s) krog ' + ta + ' / ' + tb); }
  console.log(tid + ' cv ' + CV + ' ' + JSON.stringify(OP) + ': enakih ' + same + '/' + nAI + (out.length ? ' | ' + out.join(' | ') : '')); }
