// Trki: odpadli deli (the parts cars shed: Race.spawnDebris, stepDebris, debrisHit). How long and how far a shed part travels and what
// it costs the car it came off. MEASURING ONLY: nothing here changes the game; the game's own code is run (a Race stepped by Race.step),
// no physics is written again here, so the same script measures any tree: GAME_ROOT=<tree> picks the game, the harness is this tree's.
//   node tools/trki/odpadli.js                       the three tables of this tree
//   node tools/trki/odpadli.js --json > zdaj.json    the same numbers as JSON (of the tree BEFORE a change: GAME_ROOT=<its folder>)
//   node tools/trki/odpadli.js --proti zdaj.json     the tables beside those numbers: before | after | the change
//   node tools/trki/odpadli.js --del ravnina|proga|svoj   one part only;  --avto sokol  --deli hood,wheelFL,...  --n 40  --cv N (Core.setTest)
//   node tools/trki/odpadli.js --deb muS=0.7,own=1,aRoll.0=3.5   other numbers tried (Core.DEB for this run only; a list's place after a dot)
// The parts:
//   ravnina  a flat test road (two 1.6 km straights; the definition is this script's, the class and every rule are the game's) in three
//            grounds (its own surface asphalt, grass, gravel: def.surf). A car that is not in the race (a donor) stands on the straight
//            with the speed 60 / 120 / 200 km/h along it and sheds one part N times (Race.spawnDebris with this script's seeded numbers:
//            the same throws in every tree); per part, speed and ground: pot = how far from where it came off the piece lies (m, straight
//            line), cas = until it stops moving (s: the last step with 0.05 m/s or more along the road); the mean, the worst in brackets
//   proga    the same throws on Spa and Bathurst, at a spot every 40 samples round the lap (uphill, downhill, the barriers near): the mean
//            and the worst pot / cas, how many pieces still move after 30 s, the least room to the barrier line (m; negative: past it), the
//            lowest a piece's middle got against its own half thickness over the road (m; negative: under the road)
//   svoj     the car's own part: the race's car on Spa's longest straight sheds a part (Core.detachPart) at 20 .. 200 km/h, coasting / on the
//            throttle / on the brake; against the same run with the piece taken off the road as it lands on the list: t1 the first step
//            the car is touched (s), n the steps with a touch, the speed lost to it 1 / 3 / 8 s on (% of the speed it had)
// (a part another car shed, lying / sliding / flying in the car's way: tools/trki/predmeti.js --del razbitine)
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = process.env.DELI_HARNESS || path.resolve(__dirname, '..', '..');   // (the harness of another tree: DELI_HARNESS=<its absolute path>)
const { loadCore } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const C = loadCore(), DT = 1 / 120, KMH = 3.6, SEED = 20261110, SPEEDS = [60, 120, 200];
if (opt('--cv') != null) C.setTest({ cv: +opt('--cv') });
if (opt('--deb')) { if (!C.DEB) throw new Error('to drevo nima Core.DEB (drevo pred spremembo)'); for (const kv of opt('--deb').split(',').filter(Boolean)) { const [k, v] = kv.split('='), [a, i] = k.split('.');
  if (!(a in C.DEB) || !Number.isFinite(+v)) throw new Error('DEB: ' + kv); if (i != null) C.DEB[a][+i] = +v; else C.DEB[a] = +v; } }
const CAR = opt('--avto', 'sokol'), MD = C.MODELS.find(m => m.id === CAR), PT = C.partsOf(MD), N = Math.min(40, +opt('--n', 40)), ONLY = opt('--del'), AS_JSON = args.includes('--json');
const PARTS = opt('--deli', 'hood,trunk,doorL,bumperF,bumperR,fenderL,wing,mirrorL,headL,wheelFL,wheelRL').split(',').filter(n => PT[n]);
const NAME = { hood: 'pokrov motorja', trunk: 'pokrov prtljažnika', doorL: 'vrata', bumperF: 'sprednji odbijač', bumperR: 'zadnji odbijač', fenderL: 'blatnik', quarterL: 'zadnji bok', wing: 'krilo', mirrorL: 'ogledalo', headL: 'žaromet', wheelFL: 'kolo spredaj', wheelRL: 'kolo zadaj' };
const f = (x, k) => x == null || !Number.isFinite(x) ? '-' : x.toFixed(k == null ? 1 : k);

// ---- the roads ----
function ovalPts(L, R) { const p = [], r = Math.PI / 180;
  for (let x = 0; x < L; x += 100) p.push([x, 0]);
  for (let a = -90; a < 90; a += 15) p.push([L + R * Math.cos(a * r), R + R * Math.sin(a * r)]);
  for (let x = L; x > 0; x -= 100) p.push([x, 2 * R]);
  for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]);
  return p; }
const GROUND = { asfalt: null, trava: 'grass', pesek: 'gravel' }, _roads = {};
function road(name) {
  if (_roads[name]) return _roads[name];
  let def = C.TRACKS.find(d => d.id === name);
  if (!def) { def = { id: 'deli-' + name, name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50 }; if (GROUND[name]) def.surf = [[-1e6, 1e6, GROUND[name]]]; }
  return (_roads[name] = new C.Track(def));
}
function straight(T) { let best = 0, b0 = 0, run = 0; for (let i = 0; i < T.N; i++) { if (Math.abs(T.k[i]) < 5e-4) { run++; if (run > best) { best = run; b0 = i - run + 1; } } else run = 0; } return b0 + Math.floor(best * 0.25); }
// a race of one car (the player's), parked at sample at; and a donor: a car of the same model that is not in the race, at sample i0 with v along the road
function lone(T, at) {
  Math.random = SIM.seeded(SEED);
  const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: MD, assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); race.start();
  if (at != null) put(race.player, T, at, 0);
  return race;
}
function put(c, T, i, v) {
  const h = T.hd[i]; c.place(T.px[i], T.pz[i], h); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
  c.locked = false; c.steer = 0; c.inSteer = c.inThr = c.inBrk = c.inHand = 0; c.digitalSteer = true; c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v;
  const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
  c.q = T.query(c.x, c.z, i, c.q || {}); c.sPrev = c.q.s; c.dist = c.q.s - T.startS;
}
function donor(T, i, v) { const D = new C.Car(MD, { phys: 'cs' }); put(D, T, i, v); if (!T.hasElev) D.y = 0; return D; }
// n throws of one part from the donor, stepped until every piece rests (or secs): per piece how far and how long
const _q = {};
function throws(T, i0, kmh, parts, n, secs, seed) {
  const race = lone(T, (i0 + (T.N >> 1)) % T.N), P = race.player, D = donor(T, i0, kmh / KMH), rnd = SIM.seeded(seed || SEED), S = [];
  for (let k = 0; k < n; k++) for (const p of parts) { race.spawnDebris(D, p, rnd); const d = race.debris[race.debris.length - 1]; d.by = null; d.byT = 0;   // (nobody's own part: the donor is not in the race)
    S.push({ d, x: d.x, z: d.z, last: 0 }); }
  let rob = 1e9, low = 1e9;
  for (let k = 1; k <= secs * 120; k++) { P.inThr = 0; P.inBrk = 1; race.step(DT); let all = true;
    for (const s of S) { const d = s.d; if (Math.hypot(d.vx, d.vz) >= 0.05) s.last = k; if (d.rest) continue; all = false;
      const g = T.query(d.x, d.z, d.q ? d.q.i : i0, _q); rob = Math.min(rob, (g.d > 0 ? g.br : g.bl) - Math.abs(g.d) - d.r * 0.5); low = Math.min(low, d.y - T.yAt(d.q) - 0.02 - d.h * 0.5); }
    if (all) break; }
  return { rows: S.map(s => ({ part: s.d.part, far: Math.hypot(s.d.x - s.x, s.d.z - s.z), t: s.last * DT, moving: s.last >= secs * 120 - 1 ? 1 : 0, roll: s.d.roll || 0 })), rob, low };
}
const stat = (a) => ({ mean: a.reduce((p, c) => p + c, 0) / (a.length || 1), max: Math.max(...a) });

const OUT = {};
// ---- part 'ravnina' ----
function ravnina() {
  const rows = [];
  for (const part of PARTS) for (const kmh of SPEEDS) { const row = { del: part, kmh, m: PT[part].m, r: PT[part].r };
    for (const g in GROUND) { const T = road(g), R = throws(T, 150, kmh, [part], N, 60).rows; row[g] = { pot: stat(R.map(r => r.far)), cas: stat(R.map(r => r.t)), giba: R.filter(r => r.moving).length }; }
    rows.push(row); }
  return rows;
}
// ---- part 'proga' ----
function proga() {
  const rows = [], parts = ['hood', 'bumperF', 'wheelFL', 'mirrorL'].filter(n => PT[n]);
  for (const tid of ['spa', 'bathurst']) { const T = road(tid);
    for (const kmh of SPEEDS) { let all = [], rob = 1e9, low = 1e9;
      for (let i0 = 0; i0 < T.N; i0 += 40) { const r = throws(T, i0, kmh, parts, 1, 30, SEED + i0); all = all.concat(r.rows); rob = Math.min(rob, r.rob); low = Math.min(low, r.low); }
      rows.push({ proga: tid, kmh, kosov: all.length, pot: stat(all.map(r => r.far)), cas: stat(all.map(r => r.t)), giba: all.filter(r => r.moving).length, rob, low }); } }
  return rows;
}
// ---- part 'svoj' ----
function svojRun(T, i0, parts, kmh, inp, keep) {
  const race = lone(T), P = race.player, n = 8 * 120, V = new Float64Array(n + 1); put(P, T, i0, kmh / KMH); for (const p of parts) C.detachPart(P, p);
  let t1 = 0, hits = 0;
  for (let k = 1; k <= n; k++) { P.hitWall = P.hitCar = P.hitDebris = 0; P.inThr = inp === 'plin' ? 1 : 0; P.inBrk = inp === 'zavora' ? 1 : 0; P.inSteer = 0; race.step(DT);
    if (!keep && race.debris.length) { for (const d of race.debris) d.dead = true; race.debris.length = 0; }
    if (P.hitDebris > 0) { hits++; if (!t1) t1 = k; } V[k] = Math.hypot(P.vx, P.vz); }
  return { V, t1: t1 * DT, hits };
}
function svoj() {
  const rows = [], T = road('spa'), i0 = straight(T);
  for (const ps of ['bumperF', 'hood', 'fenderL', 'doorL', 'mirrorL', 'wheelFL', 'bumperF+hood+fenderL+fenderR']) { const parts = ps.split('+').filter(p => PT[p]); if (!parts.length) continue;
    for (const kmh of [20, 40, 60, 120, 200]) for (const inp of ['prosto', 'plin', 'zavora']) {
      const A = svojRun(T, i0, parts, kmh, inp, true), B = svojRun(T, i0, parts, kmh, inp, false), loss = (s) => (B.V[s * 120] - A.V[s * 120]) / (kmh / KMH) * 100;
      rows.push({ del: ps, kmh, voznja: inp, t1: A.t1, n: A.hits, izg1: loss(1), izg3: loss(3), izg8: loss(8) }); } }
  return rows;
}
const PARTS_OF = { ravnina, proga, svoj };
for (const k in PARTS_OF) if (!ONLY || ONLY === k) OUT[k] = PARTS_OF[k]();
if (AS_JSON) { console.log(JSON.stringify(OUT)); process.exit(0); }

// ---- the tables ----
const OLD = opt('--proti') ? JSON.parse(fs.readFileSync(opt('--proti'), 'utf8')) : null;
const pc = (o) => f(o.pot.mean) + ' (' + f(o.pot.max) + ') / ' + f(o.cas.mean, 2) + ' (' + f(o.cas.max, 2) + ')', pct = (a, b) => (a / b * 100 - 100 >= 0 ? '+' : '') + f(a / b * 100 - 100, 0) + ' %';
console.log('Trki: odpadli deli (' + CAR + ', ' + MD.mass + ' kg; drevo ' + path.basename(process.env.GAME_ROOT || ROOT) + (OLD ? '; PREJ: ' + opt('--proti') : '') + ')');
console.log(C.DEB ? 'DEB' + (opt('--deb') ? ' (' + opt('--deb') + ')' : '') + ': ' + Object.keys(C.DEB).map(k => k + ' ' + (Array.isArray(C.DEB[k]) ? '[' + C.DEB[k].join(' ') + ']' : C.DEB[k])).join(', ') : 'DEB: drevo pred spremembo (del na tleh 6,5 m/s2 na vsaki podlagi, v zraku nič)');
if (OUT.ravnina) {
  console.log('\n== ravna cesta: kako daleč in kako dolgo gre odpadli del (' + N + ' metov; pot m (najdlje) / čas s (najdlje))');
  console.log('| del (m; r) | km/h | ' + (OLD ? 'PREJ asfalt | ' : '') + 'asfalt | trava | pesek |' + (OLD ? ' asfalt proti PREJ: pot, čas |' : ''));
  console.log('|---|---|---|---|---|' + (OLD ? '---|---|' : ''));
  OUT.ravnina.forEach((r, i) => { const o = OLD && OLD.ravnina && OLD.ravnina[i];
    console.log('| ' + (NAME[r.del] || r.del) + ' (' + r.m + '; ' + f(r.r, 2) + ') | ' + r.kmh + ' | ' + (o ? pc(o.asfalt) + ' | ' : '') + pc(r.asfalt) + ' | ' + pc(r.trava) + ' | ' + pc(r.pesek) + ' |' + (o ? ' ' + pct(r.asfalt.pot.mean, o.asfalt.pot.mean) + ', ' + pct(r.asfalt.cas.mean, o.asfalt.cas.mean) + ' |' : '')); });
}
if (OUT.proga) {
  console.log('\n== Spa in Bathurst, okoli vsega kroga (pokrov, sprednji odbijač, kolo, ogledalo): pot m / čas s: povprečje (najdlje); po 30 s še v gibanju; najmanj do ograje m; najnižje nad cesto m');
  OUT.proga.forEach((r, i) => { const o = OLD && OLD.proga && OLD.proga[i], one = (x) => f(x.pot.mean) + ' (' + f(x.pot.max) + ') / ' + f(x.cas.mean, 2) + ' (' + f(x.cas.max, 2) + '); ' + x.giba + ' od ' + x.kosov + '; ' + f(x.rob, 2) + '; ' + f(x.low, 3);
    console.log(r.proga + ' ' + r.kmh + ' km/h: ' + (o ? 'PREJ ' + one(o) + ' | POTEM ' : '') + one(r)); });
}
if (OUT.svoj) {
  const sum = (R) => { const t = R.filter(r => r.t1 && r.t1 <= 1).length; return 'vrstic ' + R.length + ': dotik v prvi sekundi ' + t + ', največja izguba po 1 s ' + f(Math.max(...R.map(r => Math.abs(r.izg1))), 3) + ' %, po 3 s ' + f(Math.max(...R.map(r => r.izg3)), 3) + ' %, po 8 s ' + f(Math.max(...R.map(r => r.izg8)), 3) + ' %'; };
  console.log('\n== avto in njegov lastni del (Spa, najdaljša ravnina): t1 s prvi dotik, n korakov z dotikom, izguba po 1 / 3 / 8 s (% hitrosti ob odpadu)');
  if (OLD && OLD.svoj) console.log('PREJ  ' + sum(OLD.svoj)); console.log((OLD ? 'POTEM ' : '') + sum(OUT.svoj));
  if (args.includes('--vse')) for (const r of OUT.svoj) console.log(r.del + ' | ' + r.kmh + ' | ' + r.voznja + ' | ' + (r.t1 ? f(r.t1, 2) : '-') + ' | ' + r.n + ' | ' + f(r.izg1, 3) + ' / ' + f(r.izg3, 3) + ' / ' + f(r.izg8, 3));
}
