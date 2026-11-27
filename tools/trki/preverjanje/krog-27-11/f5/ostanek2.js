'use strict';
// fizika-5, nadaljevanje (krog 27. 11.): razlet kupa glede na hitrost udarca in predmet v gibanju z omejitvijo hitrosti
// (Realistična, cv 6). Vzorčenje je enako kot v ostanek.js (isti N in SEED dasta iste primere). Naključna števila jedra
// (razlet kosov) so tu sejana (Math.random, SEED2), zato dasta dve drevesi iste primere, dokler koda porabi enako števil.
// Meri en klic propCarHit: energijo avta (gibanje + vrtenje, z gorivom) in stvari (vodoravno gibanje; pri kupu vsota kosov).
// Zagon (v tej mapi): N=120000 SEED=5 node ostanek2.js; drugo drevo: TRKI_SNAP=<drevo>; VSE=1 izpiše primere z rastjo energije para.
const { SNAP, loadInst, rng } = require('../../krog-25-11/fizika/lib.js');
const ROOT = process.env.ROOT || SNAP, git = (a) => { try { return require('child_process').execSync('git -C ' + JSON.stringify(ROOT) + ' ' + a, { encoding: 'utf8' }).trim(); } catch (e) { return '?'; } };
console.log('drevo: ' + git('rev-parse --short HEAD') + (git('status --porcelain js/core.js') ? ', js/core.js spremenjen v delovnem drevesu' : ''));
Math.random = rng(+(process.env.SEED2 || 11));
const { C, SIM, handling } = loadInst(ROOT, [
  ['function propCarHit(race, c, b) {', 'globalThis.__X = { propCarHit: (r, c, b) => propCarHit(r, c, b), kinds: () => Object.keys(PROPK), bks: () => _bks };\n  function propCarHit(race, c, b) {']]);
C.setTest({ cv: 6 });
const X = globalThis.__X, N = +(process.env.N || 120000), R = rng(+(process.env.SEED || 5)), u = (a, b) => a + (b - a) * R(), WMAX = 9, VSE = !!process.env.VSE;
const H = handling(C, 'cs'), ids = C.MODELS.filter(m => !m.trailer).map(m => m.id), cache = {};
const car = (id, pl) => cache[id + pl] || (cache[id + pl] = Object.assign(H.mkCar(id, { v: 0 }), { isPlayer: !!pl }));
function setup(c, S) { c.place(S.x, S.z, S.h); c.vx = S.vx; c.vz = S.vz; c.w = S.w; c.xgl = S.xgl || 0; c.xglT = S.xgl ? 0.5 : 0; c.csKc = 0; c.cSx = 0; c.cSz = 0; c.cSr = null; c.air = 0; c.rl = null; c.hitDebris = 0; c.dmg = 0; c.fuelKg = S.fuel || 0;
  c.dz = [0, 0, 0, 0]; c.cd = [0, 0, 0, 0]; c.dents = []; c.lost = {}; c.detach = []; c.flat = 0; }
const cm = (c) => c.m.mass + (c.fuelKg || 0), Ec = (c) => { const m = cm(c); return 0.5 * m * (c.vx * c.vx + c.vz * c.vz) + 0.5 * c.I * m / c.m.mass * c.w * c.w; }, r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2);
const SU = SIM.SETUPS.race, race = SIM.makeRace(C, 'spa', (C2, tt, t) => Object.assign(SU.opts(C2, tt, 'cs', t), { numAI: 0, playerGrid: 1 })), T = race.track, I0 = 300, X0 = T.px[I0], Z0 = T.pz[I0];
race.propFx = () => {}; const kinds = X.kinds().filter(k => { race.setProps([{ kind: k, x: X0, z: Z0, yaw: 0, col: 0, i: I0 }], null); return race.props.length > 0; });
let BK = null; const bp0 = race.breakProp; race.breakProp = function (b, nx, nz, vn) { BK = { nx, nz, vn }; return bp0.apply(this, arguments); };   // (smer in hitrost udarca v kup)
const CL = {}, cls = (k) => CL[k] || (CL[k] = { zadetkov: 0, avtoNic: 0, avtoGor: 0, avtoGorMaxJ: 0, parGor: 0, parGorMaxJ: 0, parGorMaxDelez: 0, parBrezRazletaGor: 0, parBrezRazletaMaxJ: 0, razletMaxJ: 0, omejitev: 0, omejitevZavrla: 0, parGorOmejitev: 0, gkMax: 0, vrste: {} });
const PASOVI = [2, 5, 10, 20, Infinity], PIME = ['do 2 m/s', '2–5 m/s', '5–10 m/s', '10–20 m/s', 'nad 20 m/s'], RZ = {}, rz = (k) => RZ[k] || (RZ[k] = PASOVI.map(() => ({ n: 0, s: 0, max: 0, e: 0, bud: 0, nad: 0 })));
for (let n = 0; n < N; n++) { const kind = kinds[(R() * kinds.length) | 0]; race.setProps([{ kind, x: X0, z: Z0, yaw: u(-Math.PI, Math.PI), col: 0, i: I0 }], null); const b = race.props[0], K = b.K;
  const id = ids[(R() * ids.length) | 0], sp = Math.exp(u(Math.log(1), Math.log(80))), dir = u(-Math.PI, Math.PI), wr = R();
  const S = { id, pl: R() < 0.3, h: u(-Math.PI, Math.PI), vx: sp * Math.cos(dir), vz: sp * Math.sin(dir), w: wr < 0.35 ? 0 : wr < 0.7 ? u(-Math.min(3, WMAX), Math.min(3, WMAX)) : u(-WMAX, WMAX), xgl: R() < 0.4 ? u(0, 1) : 0, fuel: R() < 0.3 ? u(0, 80) : 0 };
  const c = car(S.id, S.pl), ci = c.circles[(R() * c.circles.length) | 0], phi = u(-Math.PI, Math.PI), rho = u(0.05, 0.99) * (c.rad + K.rh);
  S.x = b.x - Math.cos(phi) * rho - Math.cos(S.h) * ci; S.z = b.z - Math.sin(phi) * rho - Math.sin(S.h) * ci; setup(c, S); c.y = b.y - K.h0;
  const mov = !K.breaks && R() < 0.15; if (mov) { const bs = u(0, 15), bd = u(-Math.PI, Math.PI); b.vx = bs * Math.cos(bd); b.vz = bs * Math.sin(bd); b.sleep = false; }
  const e0 = Ec(c), v0 = [b.vx, b.vz], m = cm(c);
  BK = null; X.propCarHit(race, c, b);
  const parts = b.parts && b.dead ? b.parts : null, things = parts ? parts.map(p => [p.K.m, p.vx, p.vz]) : [[K.m, b.vx, b.vz]];
  if (![c.vx, c.vz, c.w, b.vx, b.vz].every(Number.isFinite)) continue;
  const avtoNic = c.vx === S.vx && c.vz === S.vz && c.w === S.w; if (avtoNic && !parts && b.vx === v0[0] && b.vz === v0[1]) continue;   // (ni dotika: ne avto ne stvar se ne spremenita; avtoNic: stvar se spremeni, avto ne)
  const key = (mov ? 'giblje' : S.w === 0 ? 'stoji, w=0' : Math.abs(S.w) <= 3 ? 'stoji, |w|<=3' : 'stoji, |w|>3') + (mov ? (S.w === 0 ? ', w=0' : ', avto se vrti') : parts ? ', kup' : ', cel'), Q = cls(key); Q.zadetkov++; if (avtoNic) Q.avtoNic++;
  const dEc = Ec(c) - e0, eb0 = 0.5 * K.m * (v0[0] * v0[0] + v0[1] * v0[1]), eb1 = things.reduce((a, t) => a + 0.5 * t[0] * (t[1] * t[1] + t[2] * t[2]), 0), dE = dEc + eb1 - eb0;
  const gk = Math.hypot(m * (c.vx - S.vx) + things.reduce((a, t) => a + t[0] * t[1], 0) - K.m * v0[0], m * (c.vz - S.vz) + things.reduce((a, t) => a + t[0] * t[2], 0) - K.m * v0[1]); Q.gkMax = Math.max(Q.gkMax, gk);
  const cap = Math.min(K.vmax || 18, 0.72 * sp + 2), hs = Math.hypot(b.vx, b.vz), naMeji = !parts && Math.abs(hs - cap) < 1e-9, zavrla = naMeji && hs < Math.hypot(v0[0], v0[1]);
  if (naMeji) Q.omejitev++; if (zavrla) Q.omejitevZavrla++;
  if (dEc > 1e-6) { Q.avtoGor++; Q.avtoGorMaxJ = Math.max(Q.avtoGorMaxJ, dEc); }
  if (dE > 1e-6) { Q.parGor++; Q.parGorMaxJ = Math.max(Q.parGorMaxJ, dE); Q.parGorMaxDelez = Math.max(Q.parGorMaxDelez, dE / e0); Q.vrste[kind] = (Q.vrste[kind] || 0) + 1; if (naMeji) Q.parGorOmejitev++;
    if (VSE) console.log('  rast', key, kind, JSON.stringify({ avto: id, igralec: S.pl, masa: r1(m), v: r2(sp), w: r2(S.w), gorivo: r1(S.fuel), drsi: r2(S.xgl), Km: K.m, v0: r2(Math.hypot(v0[0], v0[1])), v1: r2(hs), meja: r2(cap), naMeji, zavrla, dEavto: r1(dEc), dEstvar: r1(eb1 - eb0), dEpar: r1(dE), delez: +(dE / e0).toFixed(4), udarec: BK ? r2(BK.vn) : null })); }
  if (parts && BK) { const sd = X.bks(), nx = BK.nx, nz = BK.nz; let ebNo = -eb0, A = 0;
    parts.forEach((p, k) => { const ux = p.vx + nz * sd[k], uz = p.vz - nx * sd[k]; ebNo += 0.5 * p.K.m * (ux * ux + uz * uz); A += Math.abs(sd[k]) / parts.length; });
    const brez = dEc + ebNo, razlet = eb1 - eb0 - ebNo; Q.razletMaxJ = Math.max(Q.razletMaxJ, razlet);
    if (brez > 1e-6) { Q.parBrezRazletaGor++; Q.parBrezRazletaMaxJ = Math.max(Q.parBrezRazletaMaxJ, brez); }
    const P = rz(K.spread ? 'kup z razmikom (' + kind + ')' : 'drugi kupi')[PASOVI.findIndex(x => BK.vn < x)]; P.n++; P.s += A; P.max = Math.max(P.max, A); P.e += razlet; P.bud += -brez; if (razlet > -brez + 1e-6) P.nad++; }
}
console.log('== razredi (zadetki; avtoNic = zadetki, pri katerih se spremeni samo stvar; rast energije avta in para; pri kupu par brez stranskega razleta in energija razleta; pri celem predmetu omejitev hitrosti; gkMax = največja razlika gibalne količine para, kg m/s)');
for (const k of Object.keys(CL).sort()) { const Q = CL[k]; for (const f of ['avtoGorMaxJ', 'parGorMaxJ', 'parBrezRazletaMaxJ', 'razletMaxJ', 'gkMax']) Q[f] = r1(Q[f]); Q.parGorMaxDelez = +Q.parGorMaxDelez.toFixed(4);
  if (!/kup/.test(k)) { delete Q.parBrezRazletaGor; delete Q.parBrezRazletaMaxJ; delete Q.razletMaxJ; } else { delete Q.omejitev; delete Q.omejitevZavrla; delete Q.parGorOmejitev; } console.log(k, JSON.stringify(Q)); }
console.log('== razlet kupa po hitrosti udarca (n zadetkov; povprečna in največja stranska hitrost kosa, m/s; povprečna energija razleta in povprečna izguba para brez razleta, J; nad = razlet večji od izgube)');
for (const k of Object.keys(RZ).sort()) RZ[k].forEach((P, i) => { if (P.n) console.log(k + ', ' + PIME[i] + ':', JSON.stringify({ n: P.n, stran: r2(P.s / P.n), stranMax: r2(P.max), razletJ: r1(P.e / P.n), izgubaJ: r1(P.bud / P.n), nad: P.nad })); });
