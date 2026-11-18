// Privzeta vleka krmila (docs/trki-realizem.md, »Vleka krmila za vse avte«): po udarcu v sprednji
// vogal vleče vse avte, tudi tekmece in patrulje. Testi velikega štarta (lod.test.js), Montréala
// (montreal.test.js) in policije (police.test.js) tečejo s »Samo moj avto« (`pull: 0`), zato tu
// iste tri okoliščine tečejo s PRIVZETO vleko: stanja so končna, dirka teče naprej, nihče ne
// odstopi, patrulje lovijo do konca; dvojček s `pull: 0` je do prvega zvitega vogala enak do bita
// in se po njem razide (vleka pri tekmecih res deluje).
// Vse je s semenom (Math.random na korak), na pravih progah (Spa, Montréal, Chapman's Peak).
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');
const C = loadCore();
const orig = Math.random;
let n = 0, bad = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

const finite = (c) => Number.isFinite(c.x + c.z + c.vx + c.vz + c.h + (c.steer || 0) + (c.dist || 0));
const dnf = (c) => !!(c.wreck && c.wreck.dnf);
// avto, ki ga vleče: poškodbe z učinkom in neenako zmečkana sprednja vogala (dmgSteer v js/core.js)
const pulled = (c) => c.dmgMode === 2 && !!c.cd && c.cd[0] !== c.cd[1];
const sig = (cars) => { let s = 0; for (const c of cars) s += c.x * 1.37 + c.z; return s; };
const EVERY = 30;   // podpis vsakih 30 korakov (0,25 s)
// korak, na katerem se dvojčka prvič razlikujeta (-1: nikoli)
const diverge = (a, b) => { const m = Math.min(a.sg.length, b.sg.length); for (let i = 0; i < m; i++) if (a.sg[i] !== b.sg[i]) return (i + 1) * EVERY; return a.sg.length === b.sg.length ? -1 : m * EVERY; };
// dvojčka sta do prvega zvitega vogala enaka, potem ne več
const twin = (a, b) => { const d = diverge(a, b); return { d, ok: a.firstPull > 0 && a.firstPull === b.firstPull && d >= a.firstPull && d > 0 }; };
const end = () => { Math.random = orig; C.setTest(null); };

// --- 1) veliki štart: Spa, 100 tekmecev z mest, igralec zadnji (kot lod.test.js, 7) ---
function big(seed, tx, secs) {
  C.setTest(tx);
  const d = C.TRACKS.find(x => x.id === 'spa'), T = new C.Track(d);
  const r = new C.Race(T, { numAI: 100, playerGrid: 999, playerModel: C.MODELS[0], playerUpg: { motor: 0, gume: 0, zavore: 0, aero: 0 }, assist: 2, seed, difficulty: 1, damage: 2, phys: 'cs',
    laps: 3, fuel: false, rain: 0, tyres: !!d.pit, compounds: true, flags: true, chars: true, slip: true, faults: true, radio: true, champ: true, flying: 0 });
  const P = r.player, st = new Float64Array(r.cars.length), sg = [], stood3 = new Set();
  let worst = 0, resc = 0, nan = 0, firstPull = -1;
  const o = r.rescue; r.rescue = function (c) { if (c !== P) resc++; return o.call(this, c); };
  r.start();
  for (let k = 1; k <= Math.round(secs / DT); k++) {
    Math.random = seeded(1000 + k); C.aiControl(P, r, DT); r.step(DT);
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k * DT >= 4) r.cars.forEach((c, i) => { if (c === P) return; st[i] = Math.hypot(c.vx, c.vz) < 3 ? st[i] + DT : 0; if (st[i] > worst) worst = st[i]; if (st[i] >= 3) stood3.add(i); });
    if (firstPull < 0 && r.cars.some(pulled)) firstPull = k;
    if (k % EVERY === 0) { sg.push(sig(r.cars)); if (!r.cars.every(finite)) nan++; }
  }
  end();
  const riv = r.cars.filter(c => c !== P), dist = riv.map(c => c.dist).sort((a, b) => a - b);
  return { sg, firstPull, cars: r.cars.length, worst, stood3: stood3.size, resc, nan, dnf: riv.filter(dnf).length, pulled: riv.filter(pulled).length, pDist: P.dist, minDist: dist[0], medDist: dist[dist.length >> 1] };
}
{
  let first = null;
  for (const seed of [9, 11]) {
    const a = big(seed, null, 40); if (!first) first = a;
    check(`veliki štart (Spa, 100 tekmecev, seme ${seed}, privzeta vleka): stanja končna, nihče ne odstopi`, a.cars === 101 && a.nan === 0 && a.dnf === 0, `${a.cars} avtov, NaN ${a.nan}, odstopov ${a.dnf}`);
    check(`veliki štart (seme ${seed}): nihče ne obstoji 3 s, nikogar ni treba reševati, vsi čez črto`, a.worst < 3 && a.resc === 0 && a.pDist > 0 && a.minDist > 0,
      `najdlje pri miru ${a.worst.toFixed(1)} s, rešenih ${a.resc}, igralec ${a.pDist.toFixed(0)} m, zadnji tekmec ${a.minDist.toFixed(0)} m, srednji ${a.medDist.toFixed(0)} m`);
    check(`veliki štart (seme ${seed}): po gneči ima zvit sprednji vogal vsaj 30 tekmecev`, a.pulled >= 30, `${a.pulled} od 100`);
  }
  const b = big(9, { pull: 0 }, 40), t = twin(first, b);
  check('veliki štart: dvojček »Samo moj avto« je do prvega zvitega vogala enak do bita, potem se razide', t.ok, `prvi zvit vogal na koraku ${first.firstPull} / ${b.firstPull}, razhod na koraku ${t.d}`);
}

// --- 2) Montréal: cela dirka ob zidovih (kot montreal.test.js, 4), 13 avtov, 3 krogi ---
function mont(seed, tx) {
  C.setTest(tx);
  const T = new C.Track(C.TRACKS.find(x => x.id === 'montreal'));
  Math.random = seeded(3);
  const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed, difficulty: 1, damage: 2 });
  r.start(); const P = r.player, sg = [];
  let t = 0, k = 0, resc = 0, nan = 0, firstPull = -1;
  while (t < 600 && !r.cars.every(c => c.finished || dnf(c))) {
    Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) if (c.stuckT > 3 || c.wrongT > 3) { r.rescue(c); resc++; }
    if (firstPull < 0 && r.cars.some(pulled)) firstPull = k;
    if (k % EVERY === 0) { sg.push(sig(r.cars)); if (!r.cars.every(finite)) nan++; }
  }
  end();
  return { sg, firstPull, t, cars: r.cars.length, fin: r.cars.filter(c => c.finished).length, dnf: r.cars.filter(dnf).length, resc, nan, pulled: r.cars.filter(pulled).length, best: Math.min(...r.cars.map(c => c.finishTime || 1e9)) };
}
{
  let first = null;
  for (const seed of [11, 12]) {
    const a = mont(seed, null); if (!first) first = a;
    check(`Montréal (13 avtov, 3 krogi, seme ${seed}, privzeta vleka): vsi pridejo v cilj, brez odstopa in reševanja`, a.cars === 13 && a.fin === 13 && a.dnf === 0 && a.resc === 0 && a.nan === 0 && a.t < 400,
      `v cilju ${a.fin}/${a.cars} po ${a.t.toFixed(0)} s, odstopov ${a.dnf}, rešenih ${a.resc}, NaN ${a.nan}`);
    check(`Montréal (seme ${seed}): po dotikih ima zvit sprednji vogal vsaj en avto`, a.pulled >= 1 && a.firstPull > 0, `${a.pulled} avtov, prvi na koraku ${a.firstPull}`);
    if (seed === 11) {
      const b = mont(seed, { pull: 0 }), t = twin(a, b);
      check('Montréal: dvojček »Samo moj avto« je do prvega zvitega vogala enak do bita, potem se razide', t.ok, `prvi zvit vogal na koraku ${a.firstPull} / ${b.firstPull}, razhod na koraku ${t.d}`);
      check('Montréal: zmagovalec z vleko je največ 3 % počasnejši kot brez nje', a.best < b.best * 1.03 && b.best < 1e8, `${a.best.toFixed(1)} s proti ${b.best.toFixed(1)} s`);
    }
  }
}

// --- 3) policija: Chapman's Peak (prava cesta, lov od štarta), lahka težavnost ---
function police(seed, tx) {
  C.setTest(tx);
  const T = new C.Track(C.TRACKS.find(x => x.id === 'chapman'));
  Math.random = seeded(3);
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed, difficulty: 0, damage: 2, police: true });
  const P = r.player, pol = r.pol, sg = [], polPulled = new Set(), evs = {}; r.start();
  let t = 0, k = 0, ev = 0, resc = 0, nan = 0, firstPull = -1, chase = 0, hunt = 0, near = 0, maxCars = 0;
  while (t < 600 && !P.finished) {
    Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    if (pol.ev !== ev) { for (const e of pol.log) if (e.n > ev) evs[e.k] = (evs[e.k] || 0) + 1; ev = pol.ev; }
    const all = [P, ...pol.cars]; maxCars = Math.max(maxCars, pol.cars.length);
    for (const c of pol.cars) if (pulled(c)) polPulled.add(c);
    if (pol.stage === 'chase') { chase++;
      if (pol.cars.some(c => c.pol && (c.pol.mode === 'chase' || c.pol.mode === 'search'))) hunt++;
      if (pol.cars.some(c => Math.hypot(c.x - P.x, c.z - P.z) < 150)) near++; }
    if (firstPull < 0 && all.some(pulled)) firstPull = k;
    if (k % EVERY === 0) { sg.push(sig(all)); if (!all.every(finite)) nan++; }
  }
  end();
  return { sg, firstPull, t, busted: !!pol.busted, escaped: !!pol.escaped, fin: !!P.finished, rams: pol.rams, heat: pol.heatMax, maxCars, polPulled: polPulled.size, resc, nan, evs,
    hunt: hunt / Math.max(1, chase), near: near / Math.max(1, chase) };
}
{
  let first = null, esc = 0, rams = 0, bent = 0;
  for (const seed of [11, 12, 13]) {
    const a = police(seed, null); if (!first) first = a;
    if (a.escaped) esc++; rams += a.rams; bent += a.polPulled;
    check(`policija (Chapman's Peak, lahko, seme ${seed}, privzeta vleka): lov se razplete (pobeg ali ujet), stanja končna`, a.fin && a.busted !== a.escaped && a.t < 300 && a.nan === 0 && a.resc <= 2,
      `${a.escaped ? 'pobeg' : a.busted ? 'ujet' : 'brez izida'} po ${a.t.toFixed(0)} s, NaN ${a.nan}, igralec rešen ${a.resc}×`);
    check(`policija (seme ${seed}): patrulje lovijo do konca (patrulja lovi ali išče vsaj 60 % lova, do 150 m vsaj 50 %, vsaj en trk)`, a.hunt >= 0.6 && a.near >= 0.5 && a.rams >= 1 && a.maxCars >= 1 && a.maxCars <= 3 && a.heat >= 1,
      `v lovu ${(a.hunt * 100).toFixed(0)} %, do 150 m ${(a.near * 100).toFixed(0)} %, trkov ${a.rams}, patrulj največ ${a.maxCars}, stopnja ${a.heat.toFixed(1)}, dogodki ${JSON.stringify(a.evs)}`);
  }
  check('policija: v treh lovih vsaj dva pobega, vsaj 6 trkov in vsaj ena patrulja z zvitim sprednjim vogalom', esc >= 2 && rams >= 6 && bent >= 1, `pobegov ${esc}/3, trkov ${rams}, patrulj z zvitim vogalom ${bent}`);
  const b = police(11, { pull: 0 }), t = twin(first, b);
  check('policija: dvojček »Samo moj avto« je do prvega zvitega vogala enak do bita, potem se razide', t.ok, `prvi zvit vogal na koraku ${first.firstPull} / ${b.firstPull}, razhod na koraku ${t.d}`);
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
