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
// own: the player's car gets no pull (c.noPull), so only the patrol cars' pull can part the twins.
// wreck: the first patrol car chasing at speed gets a bent front corner and full damage: the game takes it out ('out') and it rolls
// to a stop with nobody steering it (no aiControl: only the police's own mark keeps the pull off it); c.xd is laid only by the pull
function police(seed, tx, own, wreck) {
  C.setTest(tx);
  const T = new C.Track(C.TRACKS.find(x => x.id === 'chapman'));
  Math.random = seeded(3);
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed, difficulty: 0, damage: 2, police: true });
  const P = r.player, pol = r.pol, sg = [], polPulled = new Set(), evs = {}; if (own) P.noPull = true; r.start();
  let t = 0, k = 0, ev = 0, resc = 0, nan = 0, firstPull = -1, firstPol = -1, wr = null, wrRoll = 0, wrXd = 0, chase = 0, hunt = 0, near = 0, maxCars = 0;
  while (t < 600 && !P.finished) {
    Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    if (pol.ev !== ev) { for (const e of pol.log) if (e.n > ev) evs[e.k] = (evs[e.k] || 0) + 1; ev = pol.ev; }
    const all = [P, ...pol.cars]; maxCars = Math.max(maxCars, pol.cars.length);
    if (wreck && !wr && (wr = pol.cars.find(c => c.pol.mode === 'chase' && !c.locked && c.pol.kind !== 'moto' && c.speed > 15) || null)) { wr.cd[0] = Math.max(wr.cd[0], 0.6); wr.dmg = 1; }
    if (wr) { if (wr.pol.mode === 'out' && wr.speed > 1) wrRoll++; if (wr.xd) wrXd++; }
    for (const c of pol.cars) if (pulled(c)) { polPulled.add(c); if (firstPol < 0) firstPol = k; }
    if (pol.stage === 'chase') { chase++;
      if (pol.cars.some(c => c.pol && (c.pol.mode === 'chase' || c.pol.mode === 'search'))) hunt++;
      if (pol.cars.some(c => Math.hypot(c.x - P.x, c.z - P.z) < 150)) near++; }
    if (firstPull < 0 && all.some(pulled)) firstPull = k;
    if (k % EVERY === 0) { sg.push(sig(all)); if (!all.every(finite)) nan++; }
  }
  end();
  return { sg, firstPull, firstPol, wrRoll, wrXd, t, busted: !!pol.busted, escaped: !!pol.escaped, fin: !!P.finished, rams: pol.rams, heat: pol.heatMax, maxCars, polPulled: polPulled.size, resc, nan, evs,
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
  // »Samo moj avto« velja tudi za patrulje: igralčevega avta tu ne vleče (noPull, s `pull: 0` teče enako kot b), zato dvojčka
  // lahko razdvoji samo vleka patrulje; brez oznake patrulj v js/core.js (_aiS) bi ostala enaka do konca
  const o = police(11, null, true), dp = diverge(o, b);
  check('policija: »Samo moj avto« velja tudi za patrulje (igralca ne vleče: dvojčka razdvoji šele zvit vogal patrulje)', o.firstPol > 0 && o.firstPol === b.firstPol && dp >= o.firstPol,
    `prva patrulja z zvitim vogalom na koraku ${o.firstPol} / ${b.firstPol}, razhod na koraku ${dp}`);
  // patrulja, ki je nihče ne krmili (uničena se ustavlja sama): privzeto jo vleče, s »Samo moj avto« ne (oznaka patrulj v Police.step)
  const w1 = police(11, null, false, true), w0 = police(11, { pull: 0 }, false, true);
  check('policija: uničene patrulje z zvitim vogalom, ki se ustavlja sama, s »Samo moj avto« ne vleče (privzeto jo)', w1.wrRoll >= 30 && w1.wrXd > 0 && w0.wrRoll >= 30 && w0.wrXd === 0,
    `privzeto: ${w1.wrRoll} korakov ustavljanja, z vleko ${w1.wrXd} korakov; »Samo moj avto«: ${w0.wrRoll} korakov ustavljanja, z vleko ${w0.wrXd}`);
}

// --- 4) neoznačeni policijski avto (civilDrive: po cesti kot promet, preden se pokaže), Chapman's Peak ---
// Krmili ga policija (Police.step), zato ga privzeto vleče, s »Samo moj avto« pa vozi do bita kot cel. Stopnja lova je tu
// dvignjena na silo (neoznačeni avto pride šele od stopnje POL_DIFF.uc), igralec stoji, da avto ostane neoznačen.
// Vozila prometa (race.tf.veh) niso avti z vogali (brez `cd`, svoj korak po pasu): vleke nimajo v nobeni nastavitvi.
function unmarked(tx, cd) {
  C.setTest(tx);
  const T = new C.Track(C.TRACKS.find(x => x.id === 'chapman'));
  Math.random = seeded(3);
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 0, damage: 2, police: true });
  const P = r.player, pol = r.pol; r.start();
  let k = 0, u = null;
  while (k < 120 * 60 && !(u = pol.uc)) { Math.random = seeded(5000 + (++k)); pol.heat = Math.max(pol.heat, 3.5); C.aiControl(P, r, DT); r.step(DT); }
  if (!u) { end(); return null; }
  pol.cars = pol.cars.filter(c => c === u); pol.D = Object.assign({}, pol.D, { join: 1e9 }); pol.heli = null; pol.heliCool = 1e9; if (pol.amb) pol.amb.forEach(a => { a.done = true; });
  if (cd) u.cd = cd.slice();
  const out = [], N = 20 * 120, d0 = u.q.d; let xd = 0, nan = 0, civ = 0, sumD = 0, maxD = 0;
  for (let j = 0; j < N; j++) { Math.random = seeded(5000 + (++k)); P.inThr = 0; P.inBrk = 1; P.inSteer = 0; r.step(DT);
    if (u.xd) xd++; if (u.pol.mode === 'civil') civ++; if (!finite(u)) nan++; sumD += u.q.d; maxD = Math.max(maxD, Math.abs(u.q.d - d0));
    out.push([u.x, u.z, u.h, u.steer, u.vx, u.vz].join(',')); }
  const traffic = r.tf ? r.tf.veh : [];
  end();
  return { s: out.join(';'), xd, nan, civ, N, d: sumD / N, maxD, v: u.speed, hw: T.wS(u.q.s), dmg: u.dmgMode, tfCars: traffic.filter(v => v instanceof C.Car || v.cd).length, tf: traffic.length };
}
{
  const W = unmarked(null, null), W0 = unmarked({ pull: 0 }, null), L = unmarked(null, [0.9, 0, 0, 0]), R = unmarked(null, [0, 0.9, 0, 0]), L0 = unmarked({ pull: 0 }, [0.9, 0, 0, 0]);
  const got = W && W0 && L && R && L0;
  check('neoznačeni avto (Chapman\'s Peak): pride, 20 s vozi neoznačen po svojem pasu, poškodbe z učinkom, stanja končna', !!got && [W, W0, L, R, L0].every(o => o.civ === o.N && o.nan === 0 && o.dmg === 2 && o.v > 8 && Math.abs(o.d) + o.maxD < o.hw),
    got ? `${W.v.toFixed(1)} m/s, ${W.d.toFixed(2)} m od sredine (polovica ceste ${W.hw.toFixed(1)} m)` : 'ni prišel');
  if (got) {
    const dl = L.d - W.d, dr = R.d - W.d;
    check('neoznačeni avto: privzeto ga zvit sprednji vogal vleče na svojo stran (levi in desni zrcalno, ostane na cesti)', L.xd === L.N && R.xd === R.N && W.xd === 0 && L.s !== W.s && dl * dr < 0 && Math.abs(dl) > 0.1 && Math.abs(dl) < 1 && Math.abs(Math.abs(dl) - Math.abs(dr)) < 0.1,
      `povprečni odmik od celega: levi vogal ${dl.toFixed(2)} m, desni ${dr.toFixed(2)} m`);
    check('neoznačeni avto: »Samo moj avto« vleko izklopi (zvit vozi do bita kot cel); cel avto je s privzeto vleko in s »Samo moj avto« do bita enak', L0.s === W.s && L0.xd === 0 && W0.s === W.s,
      `zvit s pull 0 = cel: ${L0.s === W.s}, cel pull 0 = cel: ${W0.s === W.s}`);
    check('promet: vozila prometa niso avti z vogali (vleka zanje ne obstaja)', W.tf > 0 && W.tfCars === 0, `${W.tf} vozil, z vogali ${W.tfCars}`);
  }
}

// --- 5) vzvratna vožnja z roko na volanu (Spa, ravnina, obe fiziki) ---
// Vleka je odmik volana: pri vzvratni vožnji se zato zasuk avta obrne tako kot pri volanu (rep gre na isto stran, kamor avto
// vleče naprej), ne podvoji se in ne niha. Dokaz: zvit avto (vogal 0,3: brez tresenja) vozi do bita kot cel avto z volanom,
// zasukanim za enak odmik (0,06 × 0,3 = 0,018 × min(1, v / 10)).
function straight(phys, mode, cd, eq, secs) {
  C.setTest(null); Math.random = seeded(7);
  const T = spaT || (spaT = new C.Track(C.TRACKS.find(x => x.id === 'spa')));
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, tt: true, laps: 1, playerModel: C.MODELS[4], assist: 0, phys, seed: 5, difficulty: 1, damage: 2 });
  const P = r.player; r.start(); P.locked = false;
  let i0 = 0; for (let i = 0; i < T.N; i++) { let ok = true; for (let e = -30; e <= 30; e++) if (Math.abs(T.k[(i + e + T.N) % T.N]) > 1e-4) { ok = false; break; } if (ok) { i0 = i; break; } }
  P.place(T.px[i0], T.pz[i0], T.hd[i0]); P.y = P.py = T.hy ? T.hy[i0] : 0; if (cd) P.cd = cd.slice();
  const h0 = P.h, x0 = P.x, z0 = P.z, out = [], ws = []; let nan = 0, flips = 0, pw = 0, vlMin = 0;
  for (let k = 1; k <= secs * 120; k++) { Math.random = seeded(1000 + k);
    P.inSteer = 0; P.inHand = 0; if (mode > 0) { P.inThr = 0.4; P.inBrk = 0; } else { P.inThr = 0; P.inBrk = 1; }
    P.steer = eq ? eq * Math.min(1, Math.hypot(P.vx, P.vz) / 10) : 0;
    P.step(DT, T);
    if (!Number.isFinite(P.x + P.z + P.h + P.w + P.vx + P.vz)) nan++; if (P.w * pw < 0) flips++; if (P.w) pw = P.w; ws.push(Math.abs(P.w)); vlMin = Math.min(vlMin, P.vl);
    out.push([P.x, P.z, P.h].join(',')); }
  end();
  const dx = P.x - x0, dz = P.z - z0, half = ws.length >> 1;
  return { s: out.join(';'), dh: C.wrapPi(P.h - h0), lat: -dx * Math.sin(h0) + dz * Math.cos(h0), nan, flips, vlMin, gear: P.gear, wMid: Math.max(...ws.slice(half >> 1, half)), wLate: Math.max(...ws.slice(half)) };
}
let spaT = null;
for (const phys of ['cs', 'nova']) {
  const fW = straight(phys, 1, null, 0, 3), fL = straight(phys, 1, [0.3, 0, 0, 0], 0, 3), fR = straight(phys, 1, [0, 0.3, 0, 0], 0, 3), fE = straight(phys, 1, null, -0.018, 3);
  const W = straight(phys, -1, null, 0, 8), L = straight(phys, -1, [0.3, 0, 0, 0], 0, 8), R = straight(phys, -1, [0, 0.3, 0, 0], 0, 8), E = straight(phys, -1, null, -0.018, 8);
  const L9 = straight(phys, -1, [0.9, 0, 0, 0], 0, 8), R9 = straight(phys, -1, [0, 0.9, 0, 0], 0, 8), all = [fW, fL, fR, fE, W, L, R, E, L9, R9];
  check(`vzvratno (${phys}): cel avto gre naravnost naprej in vzvratno, stanja končna`, all.every(o => o.nan === 0) && fW.dh === 0 && W.dh === 0 && Math.abs(W.lat) < 1e-6 && W.gear === -1 && W.vlMin < -5,
    `vzvratno do ${(-W.vlMin).toFixed(1)} m/s, zasuk ${W.dh}`);
  check(`vzvratno (${phys}): zvit vogal vleče naprej in vzvratno na isto stran ceste, zasuk avta se vzvratno obrne (kot pri volanu), levi in desni zrcalno`,
    fL.lat < -0.3 && fR.lat > 0.3 && fL.dh < 0 && fR.dh > 0 && L.lat < -1 && R.lat > 1 && L.dh > 0.05 && R.dh < -0.05 && Math.abs(L.dh + R.dh) < 1e-6 && Math.abs(L.lat + R.lat) < 1e-3,
    `naprej 3 s: levi ${fL.lat.toFixed(2)} m / ${fL.dh.toFixed(3)} rad, desni ${fR.lat.toFixed(2)} m / ${fR.dh.toFixed(3)} rad; vzvratno 8 s: levi ${L.lat.toFixed(2)} m / ${L.dh.toFixed(3)} rad, desni ${R.lat.toFixed(2)} m / ${R.dh.toFixed(3)} rad`);
  check(`vzvratno (${phys}): vleka je natanko odmik volana (zvit avto do bita kot cel z volanom za 0,018), naprej in vzvratno: ni podvojena in ni obrnjena`, fE.s === fL.s && E.s === L.s && fL.s !== fW.s && L.s !== W.s);
  const k9 = L9.dh / L.dh;
  check(`vzvratno (${phys}): močno zvit vogal (0,9) vleče v razmerju omejitve 0,05 / 0,018, brez nihanja in brez rasti zasuka`, k9 > 2.5 && k9 < 3 && Math.abs(L9.dh + R9.dh) < 1e-3 && L9.flips === 0 && R9.flips === 0 && L9.wLate <= L9.wMid * 1.02 && L9.wLate < 0.1,
    `zasuk ${L9.dh.toFixed(3)} rad proti ${L.dh.toFixed(3)} rad (× ${k9.toFixed(2)}), menjav smeri vrtenja ${L9.flips}, največja hitrost vrtenja ${L9.wMid.toFixed(4)} → ${L9.wLate.toFixed(4)} rad/s`);
}

// --- 6) vzvratna vožnja pod samodejnim krmilom: obračanje v stranski cesti (Core.stubDrive, kot patrulja), Chapman's Peak ---
// Edina vzvratna vožnja samodejnega krmila (tekmeci in samodejni voznik vzvratne prestave nimajo): noter do konca, obrat
// (naprej na polnem zasuku, vzvratno na nasprotnem), ven na cesto. Zvit avto se obrne in pride ven kot cel; s »Samo moj avto«
// do bita kot cel.
function turnRound(k, tx, cd) {
  C.setTest(tx); Math.random = seeded(77);
  const T = chT || (chT = new C.Track(C.TRACKS.find(x => x.id === 'chapman'))), St = T.stubs[k];
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, tt: true, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, damage: 2 }), P = r.player; r.start(); P.locked = false;
  const back = St.ang > 100, i = T.idx(St.s0 + (back ? 16 : -45)), d = St.side * Math.min(2.5, T.w - 1.5);
  P.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i] + (back ? Math.PI : 0)); P.y = P.py = T.hy[i]; P.roadY = P.y; const v0 = back ? 5 : 12; P.vx = Math.cos(P.h) * v0; P.vz = Math.sin(P.h) * v0;
  if (cd) P.cd = cd.slice();
  let ph = back ? 'in' : 'road', tP = 0, outOk = false, rev = 0, legs = 0, pg = 1, nan = 0, wall = 0, j = 0; const out = [];
  for (; j < 120 * 150 && ph !== 'done'; j++) { Math.random = seeded(9000 + j);   // (vsak korak krmili samodejno krmilo: stubDrive ali aiControl)
    if (ph === 'road') { C.aiControl(P, r, DT); if (P.speed > 9) { P.inThr = 0; P.inBrk = 0.4; } if (Math.abs(P.q.s - St.s0) < 14) ph = 'in'; }
    else if (ph === 'in') { if (C.stubDrive(P, r, k, 1)) { ph = 'out'; C.stubDrive(P, r, k, -1); } }
    else if (ph === 'out') { if (C.stubDrive(P, r, k, -1)) { ph = 'back'; tP = 0; C.aiControl(P, r, DT); } }
    else { if (C.stubDrive(P, r, k, -1)) C.aiControl(P, r, DT); tP += DT; if (P.q.k < 0 && Math.abs(P.q.d) < T.w) { outOk = true; ph = 'done'; } if (tP > 10) ph = 'done'; }
    P.hitWall = 0; r.step(DT);
    if (P.vl < -0.5) rev++; if (P.gear === -1 && pg !== -1) legs++; pg = P.gear; if (P.hitWall > 0.3) wall++; if (!finite(P)) nan++;
    out.push([P.x, P.z, P.h, P.steer].join(',')); }
  end();
  return { s: out.join(';'), outOk, t: j * DT, rev: rev * DT, legs, nan, wall };
}
let chT = null;
for (const k of [0, 2]) {   // (najdaljša asfaltna in makadamska stranska cesta)
  const W = turnRound(k, null, null), L = turnRound(k, null, [0.9, 0, 0, 0]), R = turnRound(k, null, [0, 0.9, 0, 0]), L0 = turnRound(k, { pull: 0 }, [0.9, 0, 0, 0]), W0 = turnRound(k, { pull: 0 }, null);
  const okRun = (o) => o.outOk && o.nan === 0 && o.wall === 0 && o.legs >= 2 && o.rev > 1.5;
  check(`obračanje v stranski cesti ${k} (Chapman's Peak, samodejno krmilo, privzeta vleka): zvit avto se obrne z vzvratno vožnjo in pride na cesto kot cel (brez dotika ograje, enako potez, čas do 5 % daljši)`,
    okRun(W) && okRun(L) && okRun(R) && L.s !== W.s && R.s !== W.s && L.legs === W.legs && R.legs === W.legs && L.t < W.t * 1.05 && R.t < W.t * 1.05,
    `cel ${W.t.toFixed(1)} s (vzvratno ${W.rev.toFixed(1)} s, ${W.legs} potez), levi vogal ${L.t.toFixed(1)} s (${L.rev.toFixed(1)} s, ${L.legs}), desni ${R.t.toFixed(1)} s (${R.rev.toFixed(1)} s, ${R.legs})`);
  check(`obračanje v stranski cesti ${k}: s »Samo moj avto« zvit avto do bita kot cel; cel je s pull null in 0 do bita enak`, L0.s === W.s && W0.s === W.s);
}

// --- 7) zaklenjen avto: oznaka samodejnega krmila ne ostane čez korak (»Samo moj avto«) ---
// Zaklenjen avto (na štartu, patrulja pred zamikom) vleke ne računa, zato oznake samodejnega krmila (Core _aiS) prej ni
// porabil: prvi korak po odklepu, ko volan že drži človek, je bil pri »Samo moj avto« brez vleke (1/120 s). Car.step jo zdaj
// počisti na koncu vsakega koraka. Dokaz: zvit avto, ki ga je zaklenjenega en korak krmilo samodejno krmilo, vozi po odklepu
// od prvega koraka do bita kot dvojček, ki ga samodejno krmilo ni nikoli krmilo; cel avto (nič zvitega) se z oznako ali brez ne loči.
function lockedFlag(ai, cd, tx) {
  C.setTest(tx); Math.random = seeded(7);
  const T = spaT || (spaT = new C.Track(C.TRACKS.find(x => x.id === 'spa')));
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, tt: true, laps: 1, playerModel: C.MODELS[4], assist: 0, phys: 'cs', seed: 5, difficulty: 1, damage: 2 });
  const P = r.player; r.start(); P.locked = true;
  let i0 = 0; for (let i = 0; i < T.N; i++) { let ok = true; for (let e = -30; e <= 30; e++) if (Math.abs(T.k[(i + e + T.N) % T.N]) > 1e-4) { ok = false; break; } if (ok) { i0 = i; break; } }
  P.place(T.px[i0], T.pz[i0], T.hd[i0]); P.y = P.py = T.hy ? T.hy[i0] : 0; P.vx = Math.cos(P.h) * 30; P.vz = Math.sin(P.h) * 30; if (cd) P.cd = cd.slice();
  const out = []; let nan = 0;
  const drive = () => { P.inSteer = 0; P.inHand = 0; P.inThr = 0.4; P.inBrk = 0; P.steer = 0; };
  Math.random = seeded(1000); if (ai) C.aiControl(P, r, DT); drive(); P.step(DT, T);   // (zaklenjen: en korak pod samodejnim krmilom ali brez)
  P.locked = false;
  for (let k = 1; k <= 60; k++) { Math.random = seeded(1000 + k); drive(); P.step(DT, T); if (!Number.isFinite(P.x + P.z + P.h + P.w + P.vx + P.vz)) nan++; out.push([P.x, P.z, P.h, P.w, P.vx, P.vz].join(',')); }
  end();
  return { o: out, s: out.join(';'), nan };
}
{
  const B = [0.6, 0, 0, 0], P0 = { pull: 0 };
  const a = lockedFlag(true, B, P0), m = lockedFlag(false, B, P0), w = lockedFlag(false, null, P0), wa = lockedFlag(true, null, P0), d = lockedFlag(true, B, null), dm = lockedFlag(false, B, null);
  let f = 0; while (f < a.o.length && a.o[f] === m.o[f]) f++;
  check('zaklenjen avto, »Samo moj avto«: po odklepu ima zvit avto vleko že v prvem koraku (do bita kot dvojček, ki ga samodejno krmilo ni krmilo); cel avto se ne loči; privzeta vleka enako',
    a.nan + m.nan + w.nan + wa.nan + d.nan + dm.nan === 0 && a.s === m.s && a.o[0] !== w.o[0] && wa.s === w.s && d.s === dm.s && d.s === m.s,
    a.s === m.s ? `60 korakov enakih; prvi korak zvitega se loči od celega` : `prvi različen korak po odklepu: ${f + 1}`);
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
