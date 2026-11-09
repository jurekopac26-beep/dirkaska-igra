#!/usr/bin/env node
// meri-killar.mjs: merilna skripta za progo Killar, Indija (Node, brez brskalnika). Repozitorija NE spreminja (samo bere js/ in tests/lib/).
//
// Požene polne dirke na Killarju tako, kot jih poženeta tests/killar.test.js (razdelek 4b) in tests/races.test.js (Core iz tests/lib/core.js,
// korak DT = 1/120 s in Park-Millerjev generator iz tests/lib/sim.js: Math.random se nastavi pred vsakim korakom, igralčev avto vozi samodejni
// voznik C.aiControl, zataknjenega igralca reši race.rescue), le da je polje privzeto polje igre: 21 tekmecev (js/game.js NUM_AI) + igralec.
//
//   node meri-killar.mjs [--n 20] [--patch datoteka.json] [--tt] [--seme 1] [--igra] [--podrobno] [--avto rally] [--tekmeci 21] [--tt-avto rally]
//
//   --n <N>        število dirk (privzeto 20). Dirka k (1..N) ima seme s = seme0 + k - 1 in se od drugih razlikuje tako kot v testih:
//                    opts.seed = s (hitrosti tekmecev, njihov odmik od linije, reakcije na štartu),
//                    opts.difficulty = s % 3 (0 lahka, 1 srednja, 2 težka),
//                    opts.playerGrid = [zadnji, 12, 1, 17][(s - 1) % 4] (igra: zadnji; testi: 12),
//                    Math.random pred korakom j: seeded(9000 + s * 100000 + j) (kot tests/killar.test.js).
//   --seme <s0>    seme prve dirke (privzeto 1); --n 1 --seme 7 požene samo dirko s semenom 7 (ista vrstica kot v nizu).
//   --patch <f>    JSON objekt, ki se pred gradnjo proge zlije v def proge (Object.assign), npr. {"bumps": [{"at": 0.5, "h": 0.3, "w": 6}]};
//                  vrednost null ključ izbriše, ključi z začetnim _ se preskočijo (opombe v datoteki).
//   --tt           po dirkah še vožnja na čas: samodejni voznik v serijskem reli avtu (C.MODELS[4]), kot tests/killar.test.js (razdelek 8).
//   --igra         dirka z možnostmi, kot jih da igra (js/game.js startRace): leteči štart 3 s, igralec zadnji, značaji tekmecev, zavetrje.
//   --podrobno     v vrstico dirke doda sezname: kje (m po štartni črti) so bili padci [m, poLetu, igralec, poPravemLetu] in leti [m, km/h, trajanje s, pristanek m/s, igralec].
//   Polja letov: leti (vsi prehodi air 0 -> 1), letiNad01 (pravi leti, vsaj 0,1 s), zrakS (skupni čas vseh avtov v zraku, s), padciPoLetu (padec v zraku ali < 2 s po
//   kateremkoli letu; pri gostih grbinah skoraj vedno res), padciPoPravemLetu (isto, a samo za lete >= 0,1 s).
//   --avto <id>    igralčev avto v dirki (privzeto rally = C.MODELS[4]); tekmeci vozijo polje tega avta (Race: fieldOf).
//   --vrhovi k[:vmeja]  POSKUS: profil hitrosti tekmecev omejen na vrhovih (v^2 * |curv| <= k * 11.9; z :vmeja samo v ovinkih in zaviranjih).
//   --tezavnost <0|1|2|test>, --mesto <g>, --tekmeci <n>: ista težavnost / štartno mesto igralca / število tekmecev za vse dirke
//                  (--tekmeci 12 --mesto 12 --tezavnost test --n 3 ponovi tri dirke iz tests/killar.test.js, razdelek 4b).
//
// Izpis (stdout): vrstica JSON o cesti (profil), za vsako dirko ena vrstica JSON, vrstica vožnje na čas (--tt), povzetek in čas izvajanja.
// Vrstica dirke je deterministična: isti ukaz da isto vrstico (zgoscena = sha256 končnega stanja dirke, kot v tests/races.test.js).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const REPO = process.env.GAME_ROOT ? path.resolve(process.env.GAME_ROOT) : new URL('../..', import.meta.url).pathname;
const { loadCore } = require(path.join(REPO, 'tests/lib/core.js'));
const { DT, seeded, raceState } = require(path.join(REPO, 'tests/lib/sim.js'));

const argv = process.argv.slice(2);
const arg = (name, dflt) => { const i = argv.indexOf('--' + name); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : dflt; };
const has = (name) => argv.includes('--' + name);
const N_DIRK = Math.max(0, parseInt(arg('n', '20'), 10) || 0);
const SEME0 = parseInt(arg('seme', '1'), 10) || 1;
const PATCH = arg('patch', null);
const TT = has('tt'), IGRA = has('igra'), PODROBNO = has('podrobno');
const PROGA = arg('proga', 'killar');
const N_AI = Math.max(0, parseInt(arg('tekmeci', '21'), 10));
const TT_AVTO = arg('tt-avto', 'rally');
const TEZ = arg('tezavnost', null);   // 0 | 1 | 2: vse dirke na tej težavnosti; test: 1 + s % 3 kot tests/killar.test.js (3 se v Race omeji na 2)
const MESTO = parseInt(arg('mesto', '0'), 10) || 0;   // štartno mesto igralca za vse dirke (privzeto po semenu)
const AVTO = arg('avto', null);   // igralčev avto v dirki (id modela; privzeto C.MODELS[4], serijski reli avto, kot v testih); polje tekmecev je polje tega avta
const MESTA = [0, 12, 1, 17];   // (0: zadnji)
const JUMP_A = 14 * 0.85;       // js/core.js: avto poleti, ko je v^2 * curv < -JUMP_G * 0.85 (JUMP_G = 14)

const r2 = (v) => v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100;
const r3 = (v) => v == null || !Number.isFinite(v) ? null : Math.round(v * 1000) / 1000;
const mediana = (a) => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };

const C = loadCore();
const def = C.TRACKS.find(d => d.id === PROGA);
if (!def) { console.error('ni proge ' + PROGA); process.exit(2); }
let patchKeys = [];
if (PATCH) {
  const p = JSON.parse(fs.readFileSync(PATCH, 'utf8'));
  for (const k of Object.keys(p)) { if (k[0] === '_') continue; patchKeys.push(k); if (p[k] === null) delete def[k]; else def[k] = p[k]; }
}
// POSKUS (--vrhovi k[:vmeja]): tekmeci in samodejni voznik poznajo vrhove. Profil hitrosti (Track.speedProfile) se tu, v skripti, ovije:
// na vzorcih s krivino curv < 0 je hitrost največ sqrt(k * 11.9 / -curv) (k = 1: tik pod pragom leta, k = 2: dovoljen kratek let), nato
// še enkrat zaviranje nazaj (kot speedProfile na odprti cesti). Z :vmeja (m/s) samo tam, kjer profil že sam zahteva manj kot vmeja
// (ovinki in zaviranja), na ravninah avti letijo. Koda igre se ne spremeni: to je prototip mehanizma za meritev.
const VRHOVI = arg('vrhovi', null);
if (VRHOVI) {
  const [k, vm] = VRHOVI.split(':').map(Number), sp0 = C.Track.prototype.speedProfile;
  C.Track.prototype.speedProfile = function (latA, brakeA, ...rest) {
    const v = sp0.call(this, latA, brakeA, ...rest);
    if (!this.hasElev || !this.open || !(k > 0)) return v;
    const N = this.N, cv = this.curv, rds = this.rds, v0 = vm > 0 ? Float32Array.from(v) : null;
    for (let i = 0; i < N; i++) if (cv[i] < 0 && (!v0 || v0[i] < vm)) { const lim = Math.sqrt(k * JUMP_A / -cv[i]); if (lim < v[i]) v[i] = lim; }
    for (let i = N - 2; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] * v[i + 1] + 2 * brakeA * rds[i]));
    return v;
  };
}
const MODEL = AVTO ? C.MODELS.find(m => m.id === AVTO) : C.MODELS[4];
if (!MODEL) { console.error('ni avta ' + AVTO + ' (' + C.MODELS.map(m => m.id).join(' ') + ')'); process.exit(2); }
const novaProga = () => { const o = Math.random; try { Math.random = seeded(3); return new C.Track(def); } finally { Math.random = o; } };

// ---- cesta, kot jo zgradi Track: vrhovi (krivina curv < 0) in hitrost, nad katero avto na njih poleti ----
function profil(T) {
  const N = T.N, a = T.startIdx != null ? T.startIdx : 0;
  let cmin = 0, imin = -1, cmax = 0, gmax = 0, rms = 0, n = 0;
  for (let i = 0; i < N; i++) { const c = T.curv[i]; if (c < cmin) { cmin = c; imin = i; } if (c > cmax) cmax = c; gmax = Math.max(gmax, Math.abs(T.grade[i])); rms += c * c; n++; }
  const pragi = [15, 20, 25, 30, 35, 40, 50], vrh = pragi.map(() => 0);
  for (let i = 1; i < N - 1; i++) { const c = T.curv[i]; if (c < 0 && c < T.curv[i - 1] && c <= T.curv[i + 1]) { const vj = Math.sqrt(JUMP_A / -c); pragi.forEach((p, k) => { if (vj < p) vrh[k]++; }); } }
  const o = { proga: def.id, grbin: (def.bumps || []).length, patch: PATCH ? path.basename(PATCH) : null, patchKljuci: patchKeys, N, ds: r3(T.ds), dolzina: r2(T.len), dirka_m: r2(T.raceLen),
    krivinaMin: +cmin.toExponential(3), krivinaMinPri_m: imin >= 0 ? Math.round(imin * T.ds - T.startS) : null, krivinaMax: +cmax.toExponential(3), krivinaRMS: +Math.sqrt(rms / n).toExponential(3),
    vSkokaMin_ms: cmin < 0 ? r2(Math.sqrt(JUMP_A / -cmin)) : null, vSkokaMin_kmh: cmin < 0 ? Math.round(Math.sqrt(JUMP_A / -cmin) * 3.6) : null, nagibMax: r3(gmax), vrhoviPodPragom: {} };
  pragi.forEach((p, k) => { o.vrhoviPodPragom[Math.round(p * 3.6) + 'kmh'] = vrh[k]; });
  return o;
}

// ---- spremljanje avtov med vožnjo: leti (air 0 -> 1, ne padec v prepad), pristanki (impactVY), padci (c.fall), zavrtitve, zidovi ----
function spremljaj(race, T) {
  const st = new Map(race.cars.map(c => [c, { air: false, t0: 0, s0: 0, v0: 0, falling: false, lastAir: -1e9, lastBig: -1e9, put: false, spinning: false }]));
  const M = { leti: 0, letiNad01: 0, zrakS: 0, padciPoPravemLetu: 0, letiAvtov: new Set(), najdaljsiLet: 0, pristanekMax: 0, trdiPristanki: 0, padciZaceti: 0, padciPoLetu: 0, zavrtitve: 0, zidovi: 0, resitve: 0, resitveIgralca: 0, vMax: 0, letiKje: [], padciKje: [], vrnitveKje: [] };
  const rescue0 = race.rescue;   // (štetje vseh vrnitev na cesto: _fall, _offRoad, zataknjen tekmec, igralec)
  Object.defineProperty(race, 'rescue', { configurable: true, writable: true, enumerable: false, value: function (c) { M.resitve++; const s = st.get(c); if (s) s.put = true; return rescue0.call(this, c); } });
  const PRAVI = 0.1;   // (pravi let: vsaj 0,1 s v zraku; krajši so mikroleti čez vrh grbine, 1-12 korakov fizike)
  const konecLeta = (s, t) => { const dur = t - s.t0; s.air = false; s.lastAir = t; M.zrakS += dur; if (dur >= PRAVI) { M.letiNad01++; s.lastBig = t; } return dur; };
  const poKoraku = (t) => {
    for (const c of race.cars) {
      const s = st.get(c), falling = !!c.fall, d = Math.round(c.q.s - T.startS);
      if (falling && !s.falling) { M.padciZaceti++; const poLetu = s.air || t - s.lastAir < 2, poPravem = (s.air && t - s.t0 >= PRAVI) || t - s.lastBig < 2; if (poLetu) M.padciPoLetu++; if (poPravem) M.padciPoPravemLetu++; M.padciKje.push([d, poLetu ? 1 : 0, c.isPlayer ? 1 : 0, poPravem ? 1 : 0]); }
      s.falling = falling;
      if (s.put) { s.put = false; if (s.air) konecLeta(s, t); }   // (vrnjen na cesto med letom: ni pristanka)
      else if (!s.air) { if (c.air && !falling) { s.air = true; s.t0 = t; s.s0 = d; s.v0 = c.speed; M.leti++; M.letiAvtov.add(c); } }
      else if (falling) konecLeta(s, t);   // (let se je končal čez rob: padec, ne pristanek)
      else if (!c.air) {
        const dur = konecLeta(s, t), imp = -(c.impactVY || 0), lv = c.m.landV || 11;
        if (dur > M.najdaljsiLet) M.najdaljsiLet = dur; if (imp > M.pristanekMax) M.pristanekMax = imp; if (imp > lv) M.trdiPristanki++;
        M.letiKje.push([s.s0, Math.round(s.v0 * 3.6), r2(dur), r2(imp), c.isPlayer ? 1 : 0]);
      }
      if (!c.finished) {
        const b = Math.abs(c.beta || 0); if (b > 1.05 && !s.spinning) { s.spinning = true; M.zavrtitve++; } if (b < 0.5) s.spinning = false;
        if (c.hitWall > 3) M.zidovi++;
        if (c.speed > M.vMax) M.vMax = c.speed;
      }
      c.hitWall = 0; c.hitCar = 0;   // (kot tests/races.test.js in igra: prebrano, pobrisano; core ju samo zapisuje)
    }
  };
  return { M, poKoraku };
}

function zgosti(race) {
  const fin = race.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
  return crypto.createHash('sha256').update(fin.map(c => c.id + '@' + c.finishTime).join(',') + '\n' + raceState(race)).digest('hex').slice(0, 16);
}
const odstopil = (c) => !!(c.wreck && c.wreck.dnf);

// ---- ena dirka ----
function dirka(k, seme) {
  const orig = Math.random;
  try {
    const T = novaProga();
    Math.random = seeded(seme);
    const tezavnost = TEZ === 'test' ? Math.min(2, 1 + seme % 3) : TEZ != null ? Math.max(0, Math.min(2, parseInt(TEZ, 10) || 0)) : seme % 3, vsi = N_AI + 1, mesto = IGRA ? vsi : MESTO || MESTA[(seme - 1) % 4] || vsi;
    const opts = { numAI: N_AI, playerGrid: Math.min(vsi, mesto), laps: 1, playerModel: MODEL, assist: 2, phys: 'cs', seed: seme, difficulty: tezavnost, damage: 2 };
    if (IGRA) Object.assign(opts, { playerGrid: 999, flying: 3, chars: true, slip: true, flags: true, compounds: true, tyres: false, fuel: false, faults: false, radio: false });
    const r = new C.Race(T, opts), P = r.player, S = spremljaj(r, T), M = S.M;
    r.start();
    const tmax = T.len / 12 + 120;   // (kot tests/races.test.js)
    let t = 0, j = 0;
    while (t < tmax && r.cars.some(c => !c.finished && !odstopil(c))) {
      Math.random = seeded(9000 + seme * 100000 + (++j));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      S.poKoraku(t);
      if (P.stuckT > 3 || P.wrongT > 3) { M.resitveIgralca++; r.rescue(P); }
    }
    const cars = r.cars, ai = cars.filter(c => !c.isPlayer), sum = (f) => cars.reduce((a, c) => a + (f(c) || 0), 0);
    const casi = ai.filter(c => c.finished).map(c => c.finishTime).sort((a, b) => a - b);
    const padci = sum(c => c.falls), vrnitve = sum(c => c.offN), nan = cars.some(c => !Number.isFinite(c.x + c.z + c.speed));
    const o = {
      dirka: k, seme, tezavnost, mesto: P.grid, startalo: cars.length, koncalo: cars.filter(c => c.finished).length, odstopi: cars.filter(odstopil).length,
      padci, padliAvti: cars.filter(c => c.falls > 0).length, padciPoLetu: M.padciPoLetu, padciPoPravemLetu: M.padciPoPravemLetu, padciIgralca: P.falls || 0,
      plosce: r.fence ? r.fence.n : 0, zadetkiOgraje: sum(c => c.fenceN), vrnitve, resitveDruge: M.resitve - padci - vrnitve,
      casZmag: r2(casi[0]), mediana: r2(mediana(casi)), casZadnji: r2(casi[casi.length - 1]), casIgralca: P.finished ? r2(P.finishTime) : null, mestoIgralca: P.finished ? P.finishPos : null,
      leti: M.leti, letiNad01: M.letiNad01, zrakS: r2(M.zrakS), letiAvtov: M.letiAvtov.size, najdaljsiLet: r2(M.najdaljsiLet), pristanekMax: r2(M.pristanekMax), trdiPristanki: M.trdiPristanki,
      zavrtitve: M.zavrtitve, zidovi: M.zidovi, skodaPovp: r3(sum(c => c.dmg) / cars.length), skodaMax: r3(Math.max(...cars.map(c => c.dmg || 0))), popravila: sum(c => c.wreck && c.wreck.fix),
      vMax_kmh: Math.round(M.vMax * 3.6), simS: r2(t), nan, zgoscena: zgosti(r),
      avto: AVTO ? MODEL.id : undefined, polje: AVTO ? Object.entries(ai.reduce((a, c) => { a[c.m.id] = (a[c.m.id] || 0) + 1; return a; }, {})).map(e => e[0] + ':' + e[1]).join(' ') : undefined,
    };
    if (PODROBNO) { o.padciKje = M.padciKje; o.letiKje = M.letiKje; }
    return o;
  } finally { Math.random = orig; }
}

// ---- vožnja na čas: samodejni voznik, serijski reli avto (tests/killar.test.js, razdelek 8) ----
function naCas() {
  const orig = Math.random;
  try {
    const T = novaProga();
    Math.random = seeded(3);
    const model = C.MODELS.find(m => m.id === TT_AVTO) || C.MODELS[4];
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: model, assist: 2, phys: 'cs', seed: 11, difficulty: 1, tt: true }), P = r.player, S = spremljaj(r, T), M = S.M;
    r.start();
    let t = 0, j = 0, cmin = 0;
    while (!P.finished && t < 600) {
      Math.random = seeded(5000 + (++j));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      S.poKoraku(t);
      if (!P.air && !P.fall && P.speed > 6) { const a = P.vl * P.vl * (P.curvNow || 0); if (a < cmin) cmin = a; }   // (najmočnejša razbremenitev na vrhu, m/s^2; let pri < -11.9)
      if (P.stuckT > 3 || P.wrongT > 3) { M.resitveIgralca++; r.rescue(P); }
    }
    return { tt: true, avto: model.id, koncal: !!P.finished, cas: P.finished ? r2(P.finishTime) : null, padci: P.falls || 0, plosce: r.fence ? r.fence.n : 0, zadetkiOgraje: P.fenceN || 0, vrnitve: P.offN || 0,
      resitveDruge: M.resitve - (P.falls || 0) - (P.offN || 0), leti: M.leti, letiNad01: M.letiNad01, zrakS: r2(M.zrakS), najdaljsiLet: r2(M.najdaljsiLet), pristanekMax: r2(M.pristanekMax), trdiPristanki: M.trdiPristanki,
      razbremenitevMax_ms2: r2(-cmin), zavrtitve: M.zavrtitve, zidovi: M.zidovi, skoda: r3(P.dmg), vMax_kmh: Math.round(M.vMax * 3.6), vPovp_kmh: P.finished ? Math.round(T.raceLen / P.finishTime * 3.6) : null,
      letiKje: PODROBNO ? M.letiKje : undefined, padciKje: PODROBNO ? M.padciKje : undefined, zgoscena: zgosti(r) };
  } finally { Math.random = orig; }
}

// ---- izpis ----
const tStart = Date.now();
console.log(JSON.stringify(Object.assign({ cesta: true }, profil(novaProga()), { nacin: IGRA ? 'igra (leteči štart)' : 'testi (štart z mest)', tekmecev: N_AI, vrhovi: VRHOVI || undefined })));
const vrstice = [];
let tDirk = 0;
for (let k = 1; k <= N_DIRK; k++) { const t0 = Date.now(), o = dirka(k, SEME0 + k - 1); tDirk += Date.now() - t0; vrstice.push(o); console.log(JSON.stringify(o)); }
let tTT = 0;
if (TT) { const t0 = Date.now(); console.log(JSON.stringify(naCas())); tTT = Date.now() - t0; }
if (vrstice.length) {
  const polja = ['startalo', 'koncalo', 'odstopi', 'padci', 'padliAvti', 'padciPoLetu', 'padciPoPravemLetu', 'padciIgralca', 'plosce', 'zadetkiOgraje', 'vrnitve', 'resitveDruge', 'casZmag', 'mediana', 'casZadnji', 'casIgralca', 'leti', 'letiNad01', 'zrakS', 'letiAvtov', 'najdaljsiLet', 'pristanekMax', 'trdiPristanki', 'zavrtitve', 'zidovi', 'skodaPovp', 'skodaMax', 'popravila', 'vMax_kmh'];
  const P = { povzetek: true, dirk: vrstice.length, semena: [SEME0, SEME0 + vrstice.length - 1], patch: PATCH ? path.basename(PATCH) : null };
  const vsota = (f, L = vrstice) => L.reduce((a, o) => a + (o[f] || 0), 0);
  P.koncaloOdStartalo = vsota('koncalo') + '/' + vsota('startalo'); P.dirkVsiNaCilju = vrstice.filter(o => o.koncalo === o.startalo).length;
  P.padcevNaDirko = r2(vsota('padci') / vrstice.length); P.padcevNaAvto = r3(vsota('padci') / vsota('startalo')); P.letovNaDirko = r2(vsota('leti') / vrstice.length);
  for (const f of polja) { const v = vrstice.map(o => o[f]).filter(x => x != null); P[f] = v.length ? { povp: r2(v.reduce((a, b) => a + b, 0) / v.length), min: Math.min(...v), max: Math.max(...v) } : null; }
  P.poTezavnosti = {};
  for (const d of [0, 1, 2]) { const L = vrstice.filter(o => o.tezavnost === d); if (L.length) P.poTezavnosti[['lahka', 'srednja', 'tezka'][d]] = { dirk: L.length, koncalo: vsota('koncalo', L) + '/' + vsota('startalo', L), padci: vsota('padci', L), plosce: vsota('plosce', L), vrnitve: vsota('vrnitve', L), leti: vsota('leti', L), casZmagPovp: r2(vsota('casZmag', L) / L.length), medianaPovp: r2(vsota('mediana', L) / L.length) }; }
  console.log(JSON.stringify(P));
}
console.log(JSON.stringify({ izvajanje: true, skupaj_s: r2((Date.now() - tStart) / 1000), naDirko_s: vrstice.length ? r2(tDirk / vrstice.length / 1000) : null, tt_s: TT ? r2(tTT / 1000) : null }));
