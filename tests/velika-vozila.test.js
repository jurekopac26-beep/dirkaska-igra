// Velika vozila (#1061, docs/velika-vozila-fizika.md): AI v težkem vozilu vozi pod pragom prevrnitve. Model js/velika-vozila.js naloži
// index.html pred jedrom; vklop model.heavy samo v tej kopiji jedra (datoteke vozil ga še nimajo: vprašanje velika-vozila-1061-vozila).
// Za cisterno, hlode (HRAST) in avtobus (LASTOVKA) na Bathurstu in Vršiču, fizika cs, 90 s, 5 AI istega vozila (igralec na avtopilotu):
// s profilom AI (VV.aiProf) in odzivom na nagib (VV.aiVoznik: plin, zavora) prevrnitev AI skoraj ni (največ 1 na vozilo), brez njiju (K.ai = false) jih je več; AI pri tem še vozi.
//   node tests/velika-vozila.test.js
'use strict';
const { coreSource } = require('./lib/core.js');
const S = require('./lib/sim.js');

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const load = () => { const m = { exports: {} }; return new Function('module', 'exports', 'require', coreSource() + '\n;return { C: Core, VV: typeof VelikaVozila !== "undefined" ? VelikaVozila : null };')(m, m.exports, require); };
if (!load().VV) { console.log('FAIL index.html ne naloži js/velika-vozila.js pred core.js'); process.exit(1); }

// enote: krivina in zavorna pot
{ const { VV } = load(), c = { vv: { srt: 0.42, brT: 20 } };
  const v60 = VV.vOvinek(c, 1 / 60) * 3.6, s = VV.zavPot(c, 100 / 3.6, 0);
  check('cisterna: R 60 m pod pragom (0,8 × 0,42 g) do ~51 km/h, 100→0 AI ~74 m (6,5 m/s² × 0,8)', v60 > 50 && v60 < 60 && s > 65 && s < 85, `${v60.toFixed(1)} km/h, ${s.toFixed(0)} m`);
  c.vv.brT = 600; const s2 = VV.zavPot(c, 100 / 3.6, 0);
  check('pregrete zavore (600 °C): AI računa daljšo pot (60 % moči, R13)', s2 > s * 1.6, `${s2.toFixed(0)} m`); }

const IDS = ['cisterna', 'hrast', 'lastovka'], TR = ['bathurst', 'vrsic'], SEC = 90;
function run(id, tid, ai) {
  const { C, VV } = load(); VV.K.ai = ai;
  const M = C.MODELS.find(m => m.id === id), d = C.TRACKS.find(t => t.id === tid);
  if (!M || !d) return null;
  for (const m of C.MODELS) if (VV.VOZILA[m.id]) m.heavy = true;
  let pad = 0; const r0 = VV.reset; VV.reset = (c) => { if (!c.isPlayer) pad++; r0(c); };
  const o = { numAI: 5, playerGrid: 99, playerModel: M, laps: 99, assist: 2, phys: 'cs', seed: 3, difficulty: 1, damage: 1, oneMake: M };
  if (d.open) o.flying = 15;
  const orig = Math.random; Math.random = S.seeded(7);
  try {
    const T = new C.Track(d), r = new C.Race(T, o); r.start();
    const ai = r.cars.filter(c => !c.isPlayer), d0 = new Map(ai.map(c => [c, c.dist || 0]));
    for (let k = 1; k <= SEC / S.DT; k++) S.stepRace(C, r, k);
    return { pad, heavy: ai.filter(c => c.vv).length, n: ai.length, slow: Math.min(...ai.map(c => (c.dist || 0) - d0.get(c))) };
  } finally { Math.random = orig; }
}
for (const id of IDS) for (const tid of TR) {
  const a = run(id, tid, true); if (!a) continue;
  const b = run(id, tid, false);
  console.log(`     ${id} ${tid}: AI prevrnitve s profilom ${a.pad}, brez ${b.pad}; najpočasnejši AI ${a.slow.toFixed(0)} m`);
  check(`${id} ${tid}: vsi AI težki, z lastnim profilom največ 1 prevrnitev na vozilo (brez profila: več), najpočasnejši AI vsaj 1 km`,
    a.heavy === a.n && a.pad <= a.n && a.pad < Math.max(1, b.pad) && a.slow > 1000, `${a.pad} / ${b.pad}, ${a.heavy}/${a.n} težkih, ${a.slow.toFixed(0)} m`);
}
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: ${n} checks`);
process.exit(bad ? 1 : 0);
