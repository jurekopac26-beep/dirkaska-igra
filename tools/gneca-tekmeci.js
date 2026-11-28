// Gneča: koliko stane posodobitev tekmecev v koraku fizike (1/120 s) pri različnem številu vozil, v node (brez risanja).
// Za vsako število avtov: ms na korak dirke (Race.step, povprečje in p95), ms na tekmeca, avti na korak (LOD), in profil CPU
// (skupni čas funkcije s klici vred, ms na korak) za glavna mesta: korak avta, vodenje tekmecev, trki med avti in z zidom, zavetrje, LOD.
// Igralčev avto vozi avtopilot (aiControl), kot v tools/gneca-korak.js. Fizike ne spreminja, samo meri.
//   node tools/gneca-tekmeci.js [--proga=spa] [--avtov=1,8,16,24] [--sek=20] [--seme=9] [--profil=1] [--lod='{"min":0}'] [--vrstice=aiDrive,_tow] [--izhod=pot.json]
// --vrstice: za naštete funkcije 8 vrstic js/core.js z največ vzorci (lastni čas v tej vrstici, ms/korak)
// Telefon: čas pomnoži s ~4 (4× upočasnjen procesor, kot tools/gneca-slicica.mjs).
'use strict';
const path = require('path');
const fs = require('fs');
const inspector = require('inspector');
const { loadCore } = require(path.join(__dirname, '../tests/lib/core.js'));
const { DT, seeded } = require(path.join(__dirname, '../tests/lib/sim.js'));

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const PROGA = arg('proga', 'spa'), AVTOV = arg('avtov', '1,8,16,24').split(',').map(Number), SEK = +arg('sek', 20), SEME = +arg('seme', 9), PROFIL = +arg('profil', 1), IZHOD = arg('izhod', ''), VRSTICE = arg('vrstice', '').split(',').filter(Boolean);
const C = loadCore(), d = C.TRACKS.find(x => x.id === PROGA);
if (!d) { console.error('ni proge ' + PROGA); process.exit(1); }
const T = new C.Track(d);
// vrstice v profilu so vrstice zlepljenih skript (tests/lib/core.js); pretvori v vrstice js/core.js
// (new Function doda 2 vrstici glave; lineNumber v profilu je od 0)
const ZAMIK = (() => { const L = require(path.join(__dirname, '../tests/lib/core.js')).coreSource().split('\n'), i = L.findIndex(l => l.includes('const LOD = { min:')),
  j = fs.readFileSync(path.join(__dirname, '../js/core.js'), 'utf8').split('\n').findIndex(l => l.includes('const LOD = { min:')); return i - j + 2; })();
const LODX = arg('lod', ''); if (LODX) Object.assign(C.LOD, JSON.parse(LODX));
// mesta v profilu: ime funkcije -> oznaka (skupni čas, s klici vred; ena funkcija se v skladu šteje enkrat)
const MESTA = { step: 'Car.step + Race.step', aiControl: 'aiControl (vodenje)', _pairs: '_pairs (iskanje parov)', pair: 'pair (trk para)', carCollide: 'carCollide', wallCollide: 'wallCollide (zid)', _tow: '_tow (zavetrje)', _lodPlan: '_lodPlan', query: 'Track.query' };
const post = (s, m, p) => new Promise((res, rej) => s.post(m, p || {}, (e, r) => e ? rej(e) : res(r)));

async function ena(n) {
  const r = new C.Race(T, { numAI: n - 1, playerModel: C.MODELS[0], playerUpg: { motor: 0, gume: 0, zavore: 0, aero: 0 }, assist: 2, seed: SEME, difficulty: 1, damage: 2, phys: 'cs',
    laps: 3, fuel: false, rain: 0, tyres: !!d.pit, compounds: true, flags: true, chars: true, slip: true, faults: true, radio: true, champ: true });
  r.start();
  const P = r.cars.find(c => c.isPlayer) || r.cars[0], N = r.cars.length, K = Math.round(SEK / DT), orig = Math.random;
  // ogrevanje (JIT): 2 s, ne šteje
  for (let k = 1; k <= Math.round(2 / DT); k++) { Math.random = seeded(1000 + k); C.aiControl(P, r, DT); r.step(DT); }
  let s = null; if (PROFIL) { s = new inspector.Session(); s.connect(); await post(s, 'Profiler.enable'); await post(s, 'Profiler.setSamplingInterval', { interval: 100 }); await post(s, 'Profiler.start'); }
  const ts = [], ai = []; let st = 0;
  for (let k = 1; k <= K; k++) {
    Math.random = seeded(5000 + k);
    const a0 = process.hrtime.bigint(); C.aiControl(P, r, DT); const t0 = process.hrtime.bigint(); r.step(DT); const t1 = process.hrtime.bigint();
    ts.push(Number(t1 - t0) / 1e6); ai.push(Number(t0 - a0) / 1e6);
    const L = r._lod; if (L && L.on) for (let i = 0; i < N; i++) st += L.st[i]; else st += N;
  }
  Math.random = orig;
  const mesta = {}, lastni = {};
  if (s) {
    const { profile } = await post(s, 'Profiler.stop'); s.disconnect();
    const byId = new Map(profile.nodes.map(x => [x.id, x])), par = new Map(); for (const x of profile.nodes) for (const c of x.children || []) par.set(c, x);
    const vr = {}, ms = profile.samples.length ? (profile.endTime - profile.startTime) / 1000 / profile.samples.length : 0;   // (ms na vzorec)
    if (VRSTICE.length) for (const x of profile.nodes) { const f = x.callFrame.functionName; if (!VRSTICE.includes(f) || !x.positionTicks) continue;
      for (const t of x.positionTicks) { const k = f + ':' + (t.line - ZAMIK); vr[k] = (vr[k] || 0) + t.ticks * ms; } }
    profile.samples.forEach((id, i) => {
      const dd = (profile.timeDeltas[i] || 0) / 1000, seen = new Set(), me = byId.get(id), cf = me.callFrame;
      const lk = (cf.functionName || '(anon)') + ':' + (cf.lineNumber + 1 - ZAMIK); lastni[lk] = (lastni[lk] || 0) + dd;
      for (let m = byId.get(id); m; m = par.get(m.id)) {
        const f = m.callFrame.functionName, key = MESTA[f] && (f === 'step' ? f + '@' + (m.callFrame.lineNumber + 1) : f);
        if (key && !seen.has(key)) { seen.add(key); mesta[key] = (mesta[key] || 0) + dd; }
      }
    });
    for (const k of Object.keys(mesta)) mesta[k] = Math.round(mesta[k] / K * 1000) / 1000;
    for (const k of Object.keys(mesta)) if (k.startsWith('step@')) { mesta['step:' + (+k.slice(5) - ZAMIK)] = mesta[k]; delete mesta[k]; }
    var vrst = Object.entries(vr).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => [k, Math.round(v / K * 10000) / 10000]);
    var vrh = Object.entries(lastni).filter(([k]) => !/^\(|^post:/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => [k, Math.round(v / K * 1000) / 1000]);
  }
  const srt = [...ts].sort((x, y) => x - y), avg = ts.reduce((x, y) => x + y, 0) / K;
  return { proga: PROGA, avtov: N, lod: !!(r._lod && r._lod.on), msKorak: +avg.toFixed(3), p95: +srt[Math.floor(K * 0.95)].toFixed(3), avtiNaKorak: +(st / K).toFixed(1),
    msNaTekmeca: N > 1 ? +((avg) / (N - 1)).toFixed(4) : 0, avtopilot: +(ai.reduce((x, y) => x + y, 0) / K).toFixed(3), mesta, lastniVrh: vrh || [], vrstice: vrst || [] };
}

(async () => {
  const out = [];
  console.log(`${PROGA}, ${SEK} s po 2 s ogrevanja, seme ${SEME}; ms na korak 1/120 s (node; telefon ≈ ×4)`);
  for (const n of AVTOV) {
    const o = await ena(n); out.push(o);
    const m = Object.entries(o.mesta).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ');
    if (o.vrstice.length) console.log('   vrstice (funkcija:vrstica js/core.js, ms/korak): ' + o.vrstice.map(([k, v]) => k + ' ' + v).join(', '));
    if (o.lastniVrh.length) console.log('   lastni čas (funkcija:vrstica js/core.js, ms/korak): ' + o.lastniVrh.map(([k, v]) => k + ' ' + v).join(', '));
    console.log(`${o.avtov} avtov${o.lod ? ' (LOD)' : ''}: Race.step ${o.msKorak} ms (p95 ${o.p95}), ${o.avtiNaKorak} avtov/korak, avtopilot igralca ${o.avtopilot} ms${m ? ' · ' + m : ''}`);
  }
  if (IZHOD) fs.writeFileSync(IZHOD, JSON.stringify(out, null, 1));
})();
