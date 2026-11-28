// Gneča velikega polja: čas koraka fizike (1/120 s) in koliko avtov se v koraku računa, Spa s 101 avtom (ali druga proga).
// Izpiše na 10 s: ms na korak (povprečje, p95), avte na korak, koliko jih je na polnem koraku in zakaj (blizu igralca, tik ob drugem
// avtu = LOD.nr, boksi), koliko na 30 Hz in 15 Hz (Core LOD, Race._lodPlan), koliko jih stoji. Fizike ne spreminja, samo meri.
//   node tools/gneca-korak.js [proga=spa] [lod=1|0] [sekund=60] [mesto igralca na startu=50] [nastavitve LOD (JSON)='{}'] [seme=9]
//   npr. brez LOD za primerjavo: node tools/gneca-korak.js spa 0 60 50
// Zadnja vrstica: povprečje celega teka (ms na korak, avtov na korak) in največ tekmecev v vzvratni hkrati (zastoj: desetine).
// Telefon: čas pomnoži s ~4 (4× upočasnjen procesor, kot meritev v #1069).
'use strict';
const path = require('path');
const { loadCore } = require(path.join(__dirname, '../tests/lib/core.js'));
const { DT, seeded } = require(path.join(__dirname, '../tests/lib/sim.js'));
const C = loadCore(), LOD = C.LOD, [id = 'spa', lod = '1', secs = '60', pg = '50', lj = '{}', seed = '9'] = process.argv.slice(2);
Object.assign(LOD, JSON.parse(lj)); LOD.off = lod === '0';
const d = C.TRACKS.find(x => x.id === id), T = new C.Track(d);
const r = new C.Race(T, { numAI: 100, playerGrid: +pg, playerModel: C.MODELS[0], playerUpg: { motor: 0, gume: 0, zavore: 0, aero: 0 }, assist: 2, seed: +seed, difficulty: 1, damage: 2, phys: 'cs',
  laps: 3, fuel: false, rain: 0, tyres: !!d.pit, compounds: true, flags: true, chars: true, slip: true, faults: true, radio: true, champ: true });
r.start();
const orig = Math.random, N = r.cars.length, W = Math.round(10 / DT), P = r.player;
let acc = 0, st = 0, ts = [], R = {}, accAll = 0, stAll = 0, rev = 0, sc = false;
const hz = (k) => `${Math.round(120 / k)} Hz`, far = hz(LOD.k2) === hz(LOD.k) ? `${hz(LOD.k2)} nad ${LOD.r2} m` : hz(LOD.k2);
console.log(`${id}, ${N} avtov, LOD ${LOD.off ? 'izklopljen' : `vklopljen (${lj})`}, igralec na ${pg}. mestu, seme ${seed}`);
for (let k = 1; k <= +secs / DT; k++) {
  Math.random = seeded(1000 + k);
  const L0 = r._lod;   // (razlogi, kot jih vidi Race._lodPlan na začetku koraka)
  for (let i = 0; i < N; i++) {
    const c = r.cars[i], g = c.dist - P.dist, dx = c.x - P.x, dz = c.z - P.z, d2 = dx * dx + dz * dz; let w;
    if (LOD.off || !L0 || r.state !== 'racing' || c === P || c.locked || c.fall || c.air || c.rl || (c.wreck && (c.wreck.dnf || c.wreck.hold > 0))) w = 'poln';
    else if (!((g > LOD.a || g < -LOD.b) && d2 > LOD.r * LOD.r)) w = 'blizu igralca';
    else if (c.inPit || c.pitWant || c.pitG || c.pitState) w = 'boksi';
    else if (L0.nr[i]) w = 'ob drugem avtu';
    else w = Math.abs(g) > LOD.r2 && d2 > LOD.r2 * LOD.r2 ? far : hz(LOD.k);
    R[w] = (R[w] || 0) + 1;
  }
  const t0 = process.hrtime.bigint();
  C.aiControl(P, r, DT); r.step(DT);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6; acc += ms; accAll += ms; ts.push(ms);
  let m = 0; for (const c of r.cars) if (c !== P && c.gear === -1 && c.vl < -0.5) m++;
  if (m > rev) rev = m; if (r.fl && r.fl.sc) sc = true;
  const L = r._lod; if (L && L.on) for (let i = 0; i < N; i++) { st += L.st[i]; stAll += L.st[i]; } else { st += N; stAll += N; }
  if (k % W === 0) {
    ts.sort((a, b) => a - b);
    console.log(`${Math.round(k * DT)} s: ${(acc / W).toFixed(2)} ms/korak (p95 ${ts[Math.floor(W * 0.95)].toFixed(2)}), ${(st / W).toFixed(0)} avtov/korak, stoji ${r.cars.filter(c => c.speed < 1).length}, igralec ${P.dist.toFixed(0)} m · ` + Object.entries(R).map(([a, b]) => `${a} ${(b / W).toFixed(0)}`).join(', '));
    acc = 0; st = 0; ts = []; R = {};
  }
}
Math.random = orig;
const K = Math.round(+secs / DT);
console.log(`skupaj ${secs} s: ${(accAll / K).toFixed(2)} ms/korak, ${(stAll / K).toFixed(0)} avtov/korak, pot polja ${(r.cars.reduce((a, c) => a + c.dist, 0) / 1000).toFixed(1)} km, največ v vzvratni ${rev}${sc ? ', varnostni avto' : ''}`);
