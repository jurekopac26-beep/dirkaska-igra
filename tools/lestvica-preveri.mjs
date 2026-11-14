// A run's input replayed in Node, no server, no browser (Svetovna lestvica, seja 1: ponovljivost; docs/svetovna-lestvica.md, »Ponovljivost
// med brskalniki«): the record the game made of a repeatable race (js/vnos.js: a run alone, or any race in the test mode, ?seme=) is replayed
// by the game's own physics (Core, tests/lib/core.js) and the run's time and path compared: OK when the finish comes in the same step
// (1/120 s) and the path is never more than 0.5 m from the recorded one; »natančno« when every digest of the state and the finish agree to
// the last bit. The record rides in the recording's file (posnetek_<proga>_<LLLLMMDD-UUMM>.rrp, Shrani posnetek; its header's vnos) or in a
// file of its own (.json: the record, or { vnos }).
//   node tools/lestvica-preveri.mjs posnetek_spa_20261113-1010.rrp [več …] [--json]
//   GAME_ROOT=<a copy of the game at the record's stamp> node tools/lestvica-preveri.mjs posnetek.rrp   (an older version's physics)
//   LESTVICA_STREZNIK=https://… node tools/lestvica-preveri.mjs --krog   (ali --streznik <url>; žeton: LESTVICA_ZETON ali GitHub OIDC)
// --krog (Svetovna lestvica, seja 2: strežnik): the times waiting on the server (GET /v1/preveri) each checked (the options a plain time
// trial's, the events the player's own inputs, car, upgrades and assist the packet's), replayed in Node and the verdicts sent (POST): ok
// (Node's time if it differs; »preverjeno približno«: a run with crashes not exact to the bit, or an engine other than V8 or Node within
// 0.2 %), zavrnjeno (a reason), ni-mogoce (another core, a key not a time trial's), sumljivo (events or options not known: not replayed,
// left for a person). Only counts are printed (a public repository).
// Exit 1 when a record fails. The user's recordings stay out of the repository (CLAUDE.md, Orodje za napake).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { napake, readRrp } from './voznja.mjs';
import { prave } from './lestvica-meje.mjs';

const require = createRequire(import.meta.url);
const { loadCore, ROOT } = require('../tests/lib/core.js');
const { stampOf } = require('./stamp.js');
const L = require('../js/lestvica.js');
const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');

// the replaying code: the game's at GAME_ROOT (its own js/vnos.js if it has one), else this repository's
export function koda() {
  const f = fs.existsSync(path.join(ROOT, 'js', 'vnos.js')) ? path.join(ROOT, 'js', 'vnos.js') : path.join(REPO, 'js', 'vnos.js');
  return { C: loadCore(), V: require(f), core: fs.existsSync(path.join(ROOT, 'js', 'core.js')) ? stampOf(path.join(ROOT, 'js', 'core.js')) : '?' };
}

// a file's record: a .rrp's header (vnos) or a .json (the record itself, or { vnos })
export function zapisIz(file, N) {
  if (/\.json$/i.test(file)) { const j = JSON.parse(fs.readFileSync(file, 'utf8')); return j && j.vnos ? j.vnos : j; }
  const { H } = readRrp(N || napake(), file);
  if (!H.vnos) throw new Error('posnetek nima zapisa vnosa (vožnja ni bila sama ali ponovljiva, ali je iz igre brez js/vnos.js)');
  return H.vnos;
}

// one record checked: { ok, why, rec (its track, kind, engine, stamps), res (Vnos.replay's), note (the stamps differ) }
export function preveri(rec, K) {
  K = K || koda();
  const st = rec && rec.stamp || {}, note = st.core && st.core !== 'lokalno' && st.core !== K.core ? `zapis iz js/core.js z žigom ${st.core}, tu ${K.core} (node tools/stamp.js --find ${st.game || '?'}; GAME_ROOT=<ta različica>)` : '';
  if (!rec || typeof rec !== 'object' || !Array.isArray(rec.e)) return { ok: false, why: 'ni zapis vnosa', note };
  if (!rec.ok) return { ok: false, why: 'zapis ni popoln: ' + (rec.why || '?'), note };
  const res = K.V.replay(K.C, rec);
  return { ok: res.ok, why: res.why, res, note };
}

const f3 = (x) => x == null ? '–' : (+x).toFixed(3);
export function vrstica(name, rec, r) {
  const res = r.res, tag = r.ok ? 'OK  ' : 'FAIL', o = rec && typeof rec === 'object' ? `${rec.track || '?'} (${rec.kind || '?'}, ${rec.eng || '?'})` : '';
  if (!res) return `${tag} ${name} — ${o} ${r.why}`.replace(/ +/g, ' ');
  const ft = res.fs != null && rec.fin ? (res.dft === 0 ? 'čas enak do bita' : `čas ${res.dft > 0 ? '+' : ''}${res.dft} s od zapisa`) : `brez cilja, ${(res.n / 120).toFixed(1)} s`;
  return `${tag} ${name} — ${o}: ${res.fs != null ? 'cilj v koraku ' + res.fs + ', ' : ''}${ft}, pot največ ${f3(res.maxD)} m od zapisa${res.exact ? ', natančno do bita' : ''}${res.tla ? `, ${res.tla} odgovorov tal podrtih predmetov manjka ali ostane` : ''}${res.mr ? `, ${res.mr} naključnih števil manjka ali ostane` : ''}${r.why ? ' — ' + r.why : ''}`;   // (tla, mr: 0 in the same engine)
}

/* ---------------- --krog: the times waiting on the server checked ---------------- */
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k), isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const plain = (v) => isObj(v) && Object.getPrototypeOf(v) === Object.prototype, str = (v, n) => typeof v === 'string' && v.length <= n;
const int = (v, a, b) => Number.isInteger(v) && v >= a && v <= b, fin = (v) => typeof v === 'number' && Number.isFinite(v);
const nic = (v) => v === undefined || v === null, bool = (v) => typeof v === 'boolean';
const TT_FIX = { numAI: 0, playerGrid: 1, qualiBack: 0, laps: 1, flying: 0, compounds: true, tt: true, repro: true };   // (Object.is)
const TT_NE = ['fuel', 'tyres', 'strat', 'flags', 'traffic', 'police', 'chars', 'slip', 'faults', 'radio'];   // (false or absent)
const TT_NIC = ['numSet', 'aiOrder', 'rival', 'wheelRule', 'voznja'];   // (absent or false)
const TT_TUJE = ['duelModel', 'launch', 'remote', 'netTf', 'playerPolice'];   // (a novelty's or an online race's: absent or false)
const TT_IZBIRE = ['playerModel', 'playerUpg', 'playerSetup', 'playerDeli', 'playerSlide', 'playerCmp', 'damage', 'difficulty', 'assist', 'seed', 'champ', 'winter', 'rain', 'weather', 'phys', 'playerColor', 'playerNum', 'playerName', 'fieldModel', 'tyreRule', 'tyreCold'];
const ZNANE = new Set([...Object.keys(TT_FIX), ...TT_NE, ...TT_NIC, ...TT_TUJE, ...TT_IZBIRE]);
export const TYRE_COLD = ['kolibri'];   // (js/game.js's: the test keeps them equal)
const STROGO = /^(V8( tel)?|node)$/, PRIBLIZNO = 0.002, MAX_N = 1e6, MAX_E = 900000, MAX_T = 7.2e6, GLOBINA = 40;
const IME_KLIC = /^![A-Za-z]{1,32}$/, IME_POLJE = /^(r|o|x|l|fl|t|c\d{1,3})\.(.{1,64})$/, DG_RE = /^[0-9a-z]{1,8}$/;
const TX_MIRNI = /^(ai(Spr|Fol|Push|Side|Kerb)|cPm|cE|cMu|cYaw|cGl|cFx)$/;   // (not read in a solo run; cv and cSl only by a trailer)
const RAZLOGI = [['cilja ni', 'cilja-ni'], ['cilj v koraku', 'cilj-korak'], ['čas cilja', 'cas'], ['pot več', 'pot'], ['v zapisu ostanejo', 'dogodki'], ['ni proge', 'proga']];
export function razlogIz(why) { const w = String(why || ''); for (const [a, k] of RAZLOGI) if (w.startsWith(a)) return k; return 'zapis'; }
const upgOk = (x) => nic(x) || int(x, 0, 3) || (typeof x === 'string' && /^[0-3]$/.test(x));
const upgLv = (x) => { const v = typeof x === 'string' && /^[0-3]$/.test(x) ? +x : x; return Number.isInteger(v) && v >= 0 && v <= 3 ? v : 0; };
const SPEC = new Set(['u', '-0', 'nan', 'inf', '-inf']), encNum = (v) => v === null || fin(v) || SPEC.has(v);
const encV = (v, b = 1e7) => v === null || SPEC.has(v) || (fin(v) && Math.abs(v) <= b);
const deliOk = (v) => plain(v) && Object.keys(v).length <= 64 && Object.keys(v).every(k => k !== '__proto__' && /^[a-z0-9_-]{1,24}$/i.test(k) && (v[k] === null || fin(v[k]) || str(v[k], 8)));
const FN = function () {};
function cisto(v, d) {
  if (v === null || typeof v === 'boolean' || fin(v)) return true;
  if (typeof v === 'string') return v.length <= 4096 && (v[0] === 's' || SPEC.has(v));
  if (!isObj(v) || d > GLOBINA) return false;
  const k = Object.keys(v); if (k.length !== 1) return false;
  if (k[0] === 'o') { if (!isObj(v.o)) return false; const q = Object.keys(v.o); return q.length <= 256 && q.every(x => x !== '__proto__' && cisto(v.o[x], d + 1)); }
  if (k[0] === 'l') return Array.isArray(v.l) && v.l.length <= 4096 && v.l.every(x => cisto(x, d + 1));
  return k[0] === 'm' && str(v.m, 64);
}
function pripravi(K) { if (!K.st0) { const C = K.C; K.st0 = { XR: { ...C.XR }, TX: { ...C.TX }, LOD: { ...C.LOD } }; K.lod0 = { ...K.st0.LOD, off: false }; } return K; }
function ponastavi(K) {
  const C = K.C, S = K.st0;
  for (const [o, s] of [[C.XR, S.XR], [C.TX, S.TX], [C.LOD, S.LOD]]) { for (const k of Object.keys(o)) if (!own(s, k)) delete o[k]; Object.assign(o, s); }
  C.setCrash(S.XR); C.setTest(S.TX);
}
function zgradba(R, V) {
  if (!plain(R) || R.v !== V || R.ok !== true || !str(R.track, 64) || !str(R.kind, 16) || !str(R.eng, 16) || !(nic(R.why) || str(R.why, 300))) return false;
  if (!plain(R.stamp) || !str(R.stamp.game, 40) || !str(R.stamp.core, 40)) return false;
  for (const kup = [[R, 0]]; kup.length;) {
    const [v, d] = kup.pop(); if (d > GLOBINA) return false;
    if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) if (v[i] && typeof v[i] === 'object') kup.push([v[i], d + 1]); continue; }
    if (own(v, '__proto__')) return false;
    for (const k of Object.keys(v)) if (v[k] && typeof v[k] === 'object') kup.push([v[k], d + 1]);
  }
  const n = R.n, F = R.f, E = R.e;
  if (!int(n, 0, MAX_N) || !Array.isArray(R.w) || R.w.length > 40 || !R.w.every(x => str(x, 300))) return false;
  if (!Array.isArray(F) || F.length > 4096) return false;
  for (const x of F) { if (!str(x, 80)) return false; if (x === 'dt' || IME_KLIC.test(x)) continue; const m = IME_POLJE.exec(x); if (!m || m[2] === '__proto__') return false; }
  if (!Array.isArray(E) || E.length % 3 || E.length > MAX_E) return false;
  let at = 0; for (let i = 0; i < E.length; i += 3) { if (!int(E[i], 0, MAX_N) || !int(E[i + 1], 0, F.length - 1)) return false; at += E[i]; }
  if (at > n || !(R.fs === null || R.fs === n)) return false;
  if (!Array.isArray(R.cp) || R.cp.length !== 2 * Math.floor(n / 60) || !R.cp.every(x => int(x, -1e9, 1e9))) return false;
  if (!Array.isArray(R.dg) || R.dg.length !== Math.floor(n / 1200) || !R.dg.every(x => typeof x === 'string' && DG_RE.test(x))) return false;
  if (!Array.isArray(R.mr) || R.mr.length > 1e5 || !R.mr.every(x => fin(x) && x >= 0 && x < 1)) return false;
  if (!plain(R.pf) || Object.keys(R.pf).length > 1e5) return false;
  for (const k of Object.keys(R.pf)) {
    const P = R.pf[k]; if (!/^(p|\d{1,6})$/.test(k) || !Array.isArray(P) || P.length % 2 || P.length > 2e6) return false;
    for (let j = 0; j < P.length; j += 2) if (!encV(P[j], 1e9) || !int(P[j + 1], 1, 1e9)) return false;
  }
  if ((R.fs === null) !== (R.fin === null)) return false;
  if (R.fin !== null && !(plain(R.fin) && encNum(R.fin.t) && fin(R.fin.x) && fin(R.fin.z) && typeof R.fin.dg === 'string' && DG_RE.test(R.fin.dg))) return false;
  return ['opts', 'xr', 'tx', 'lod'].every(k => isObj(R[k]) && own(R[k], 'o') && cisto(R[k], 0));
}
const POLJA = {   // the fields a time trial changes: [when (0 any time, 1 after !start, -1 before), the value's check]
  'c0.inSteer': [0, v => fin(v) && v >= -1 && v <= 1], 'c0.inThr': [0, v => fin(v) && v >= 0 && v <= 1], 'c0.inBrk': [0, v => fin(v) && v >= 0 && v <= 1],
  'c0.inHand': [0, v => v === 0], 'c0.hitWall': [0, v => v === 0], 'c0.digitalSteer': [0, v => nic(v) || bool(v)],
  'r.mkK': [0, v => nic(v) || str(v, 64)], 'r.mkSaved': [0, v => nic(v) || bool(v)], 'c0.pitCmp': [0, v => nic(v) || str(v, 16)], 'l.off': [0, bool],
  'c0.pitApT': [1, v => v === null], 'c0.pitCfT': [1, v => v === null], 'c0.pitBoxT': [1, v => v === null], 'c0.pitPlan': [1, v => v === null], 'c0.locked': [1, v => v === false],
  'r.quali': [-1, v => v === false], 'r.endu': [-1, v => v === false], 'r.storm': [-1, bool], 'c0.stripe': [-1, bool], 'o.mist': [-1, bool],
};
function propsOk(v) {
  if (!plain(v) || Object.keys(v).length !== 3 || !(v.f === 0 || v.f === 1) || !Array.isArray(v.p) || v.p.length > 1e5) return false;
  for (const t of v.p) { if (!Array.isArray(t) || t.length !== 7 || !str(t[0], 32)) return false; for (let j = 1; j < 7; j++) { const x = t[j]; if (!(encV(x, 1e9) || (typeof x === 'string' && x[0] === 's' && x.length <= 64) || bool(x))) return false; } }
  if (v.ins === null) return true;
  if (!Array.isArray(v.ins) || v.ins.length % 2 || v.ins.length > 2e6) return false;
  for (let j = 0; j < v.ins.length; j += 2) if (!int(v.ins[j], 0, 1e7) || !encV(v.ins[j + 1])) return false;
  return true;
}
const obrabaOk = (v) => isObj(v) && Array.isArray(v.l) && v.l.length === 2 && JSON.stringify(v.l[0]) === '{"c":0}' && isObj(v.l[1]) && isObj(v.l[1].o) && Object.keys(v.l[1].o).length <= 16 && Object.keys(v.l[1].o).every(k => k !== '__proto__' && encNum(v.l[1].o[k]));   // (core clamps the wear: it only slows the car)
function dogodki(R, op, K) {
  const X = { C: K.C, race: { cars: [] }, fn: FN }, E = R.e, F = R.f;
  let st = 0, su = '', obraba = false, props = 0;
  const sum = (r) => { if (!su) su = String(r).replace(/[^\w .:-]/g, '_').slice(0, 80); };
  for (let i = 0; i < E.length; i += 3) {
    const nm = F[E[i + 1]], val = E[i + 2];
    if (nm === 'dt') return { zavrnjeno: 'dogodki' };
    if (nm[0] === '!') {
      const k = nm.slice(1);
      if (k === 'aiControl') return { zavrnjeno: 'avtopilot' };
      if (k === 'start') { if (st || JSON.stringify(val) !== '{"l":[]}') return { zavrnjeno: 'zapis' }; st = 1; }
      else if (k === 'setProps') { if (st || props++ || !propsOk(val)) sum('klic setProps'); }
      else if (k === 'careerWear') { if (st || obraba || !obrabaOk(val)) sum('klic careerWear'); obraba = true; }
      else if (k === 'rescue' || k === 'retire' || k === 'putBack') { if (!st || JSON.stringify(val) !== '{"l":[{"c":0}]}') sum('klic ' + k); }
      else sum('klic ' + k);
      continue;
    }
    const p = nm.indexOf('.'), key = nm.slice(0, p), f = nm.slice(p + 1);
    if (key === 't') { if ((f === 'cv' && int(val, 1, 5)) || (TX_MIRNI.test(f) && (val === null || fin(val)))) { sum('preizkus ' + f); continue; } return { zavrnjeno: 'preizkus' }; }
    if (key === 'r' && /^zb/.test(f)) return { zavrnjeno: 'nastavitve' };
    const pr = own(POLJA, nm) ? POLJA[nm] : null;
    if (!pr || (isObj(val) && own(val, 'x'))) { sum('polje ' + nm); continue; }
    let v; try { v = K.V.dec(val, X); } catch { sum('vnos ' + nm); continue; }
    if (nm === 'r.storm' && v === true && (op.rain ?? 0) !== 1) return { zavrnjeno: 'vreme' };
    if (!pr[1](v) || (pr[0] === 1 && !st) || (pr[0] === -1 && st)) sum('vnos ' + nm);
  }
  return st === 1 ? { sumljivo: su || null, obraba } : { zavrnjeno: 'zapis' };
}
function nastavitve(op, C) {
  const ne = (r) => ({ izid: 'zavrnjeno', razlog: r }), su = (r) => ({ izid: 'sumljivo', razlog: r.replace(/[^\w .:-]/g, '_').slice(0, 80) });
  if (!plain(op)) return ne('zapis');
  for (const [k, v] of Object.entries(TT_FIX)) if (!Object.is(op[k], v)) return ne('nastavitve');
  for (const k of TT_NE) if (op[k]) return ne('nastavitve');
  for (const k of [...TT_NIC, ...TT_TUJE]) if (!nic(op[k]) && op[k] !== false) return ne('nastavitve');
  if (!nic(op.weather) || !(nic(op.rain) || op.rain === 0 || op.rain === 1)) return ne('vreme');
  const OK = { damage: v => int(v, 0, 2), playerCmp: v => str(v, 16), playerDeli: deliOk,
    playerSetup: v => plain(v) && Object.keys(v).length <= 16 && Object.values(v).every(fin), playerSlide: bool, champ: bool, winter: bool,
    playerColor: v => int(v, 0, 0xffffff), playerNum: v => int(v, 0, 999), playerUpg: v => plain(v) && Object.keys(v).length <= 64 && Object.values(v).every(upgOk),
    difficulty: v => int(v, 0, 9), seed: v => Number.isInteger(v) && Math.abs(v) <= 2 ** 32, fieldModel: v => C.MODELS.includes(v), phys: v => v === 'cs' || v === 'nova',
    playerName: v => str(v, 64), assist: v => int(v, 0, C.ASSISTS.length - 1) };
  for (const [k, f] of Object.entries(OK)) if (!nic(op[k]) && !f(op[k])) return ne('nastavitve');
  if (JSON.stringify(op.tyreRule) !== JSON.stringify(C.MODELS.map(m => m.id))) return su('nastavitve tyreRule');
  if (JSON.stringify(op.tyreCold) !== JSON.stringify(TYRE_COLD)) return su('nastavitve tyreCold');
  for (const k of Object.keys(op)) if (!ZNANE.has(k) && !nic(op[k]) && op[k] !== false) return su('nastavitve ' + k);
  return null;
}
// one waiting time checked against its record: { st, izid, razlog?, t?, priblizno? } (the server's POST /v1/preveri)
export function preveriCas(c, rec, K, T) {
  K = pripravi(K || koda()); T = T || L.keyTable(prave(K.C));
  const st = c && c.st, ne = (r) => ({ st, izid: 'zavrnjeno', razlog: r }), nm = { st, izid: 'ni-mogoce' };
  const I = c && T.get(c.kljuc); if (!I || I.kind !== 'tt') return nm;
  let z = c.zig; if (typeof z === 'string') { try { z = JSON.parse(z); } catch { z = null; } }
  if (!isObj(z) || z.jedro !== K.core) return nm;
  if (!zgradba(rec, K.V.V)) return ne('zapis');
  if (!['lokalno', z.jedro].includes(rec.stamp.core) || !['lokalno', z.igra].includes(rec.stamp.game)) return ne('zig');
  if (rec.kind !== 'tt' || rec.track !== I.id) return ne('proga');
  if (rec.n !== c.n || rec.fs !== c.fs) return ne('koraki');
  if (rec.eng !== c.eng) return ne('motor');
  const X0 = { C: K.C, race: null, fn: null }; let op, tx, xr, lod;
  try { op = K.V.dec(rec.opts, X0); tx = K.V.dec(rec.tx, X0); xr = K.V.dec(rec.xr, X0); lod = K.V.dec(rec.lod, X0); } catch { return ne('zapis'); }
  const d = dogodki(rec, op, K); if (d.zavrnjeno) return ne(d.zavrnjeno);
  const M = op.playerModel; if (!K.C.MODELS.includes(M) || M.id !== c.avto) return ne('avto');
  if ((op.assist ?? 1) !== c.pomoc) return ne('pomoc');
  const up = isObj(op.playerUpg) ? op.playerUpg : {};
  if (!isObj(c.nad) || Object.keys(c.nad).some(k => upgLv(up[k]) !== c.nad[k])) return ne('nadgradnje');
  const n0 = nastavitve(op, K.C); if (n0 && n0.izid === 'zavrnjeno') return { st, ...n0 };
  if (!!op.winter !== !!I.win || ((op.rain ?? 0) === 1) !== !!I.wet) return ne('vreme');
  const S = K.st0;
  if (!plain(tx) || Object.keys(tx).some(k => !own(S.TX, k) || !(tx[k] === null || (fin(tx[k]) && Math.abs(tx[k]) <= 100))) || !(nic(tx.cv) || int(tx.cv, 1, 5))) return ne('preizkus');
  if (M.trailer && !((nic(tx.cv) || tx.cv === 1 || tx.cv === 5) && (tx.cv === 5 || nic(tx.cSl) || tx.cSl === 1))) return ne('preizkus');
  if (!plain(xr) || Object.keys(xr).some(k => !own(S.XR, k) || !(xr[k] === 0 || xr[k] === 1))) return ne('nastavitve');
  if (!plain(lod) || Object.keys(lod).some(k => !own(K.lod0, k) || (k === 'off' ? !bool(lod[k]) : JSON.stringify(lod[k]) !== JSON.stringify(K.lod0[k])))) return ne('nastavitve');
  if (d.sumljivo || n0) return { st, izid: 'sumljivo', razlog: d.sumljivo || n0.razlog };
  const cap = {}, C2 = Object.create(K.C);
  C2.Race = function (t, o) { const r = new K.C.Race(t, o); if (!cap.race) cap.race = r; return r; };
  let res;
  try { res = K.V.replay(C2, rec); } catch { return ne('zapis'); } finally { ponastavi(K); }
  if (/^zapis ne gre skozi/.test(res.why)) return ne('zapis');
  const race = cap.race, P = race && race.player;
  if (!P) return ne(razlogIz(res.why));
  if (!race.timeTrial) return ne('proga');
  if (race.cars.length !== 1) return ne('nastavitve');
  if (!!race.opts.winter !== !!I.win || ((race.opts.rain ?? 0) === 1) !== !!I.wet) return ne('vreme');
  if (P.phys !== I.phys) return ne('fizika');
  if (!P.m || P.m.id !== c.avto) return ne('avto');   // (the car drives a copy of its model: upgrades, set-up, parts and wear made by the core from the options checked above)
  const deli = isObj(P.deli) && Object.keys(P.deli).length ? P.deli : null;
  if (deli && !(M.def && M.def.mounts && Object.keys(deli).every(k => own(M.def.mounts, k) && M.def.mounts[k]))) return ne('deli');
  const crash = Object.keys(rec.pf).some(k => k !== 'p') || !!res.tla || !!res.mr;   // (index keys: a prop knocked over; 'p': setProps only)
  const strict = !crash && STROGO.test(rec.eng);
  const ms = P.finished && fin(P.finishTime) ? Math.round(P.finishTime * 1000) : null;
  if (ms != null && !int(ms, 1, MAX_T)) return ne('cas');
  if (res.ok && res.fs === c.fs && ms != null) {
    if (Math.abs(ms - c.ms) > PRIBLIZNO * c.ms) return ne('cas');
    return crash && !res.exact ? { st, izid: 'ok', t: ms, priblizno: true } : ms === c.ms ? { st, izid: 'ok' } : { st, izid: 'ok', t: ms };
  }
  if (strict) return ne(res.ok ? 'cilja-ni' : razlogIz(res.why));
  if (ms == null) return nm;
  if (Math.abs(ms - c.ms) <= PRIBLIZNO * c.ms) return { st, izid: 'ok', t: ms, priblizno: true };
  const r = razlogIz(res.why); return ne(r === 'zapis' ? 'cas' : r);
}
export async function zeton(o = {}) {
  if (o.zeton) return o.zeton;
  if (process.env.LESTVICA_ZETON) return process.env.LESTVICA_ZETON;
  const u = process.env.ACTIONS_ID_TOKEN_REQUEST_URL, t = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (u && t) {
    const r = await (o.fetch || fetch)(u + (u.includes('?') ? '&' : '?') + 'audience=lestvica', { headers: { Authorization: 'Bearer ' + t } });
    if (!r.ok) throw new Error('OIDC: ' + r.status);
    const j = await r.json(); if (!j || typeof j.value !== 'string') throw new Error('OIDC: ni žetona');
    return j.value;
  }
  throw new Error('ni žetona (LESTVICA_ZETON ali GitHub OIDC)');
}
export async function krog(o = {}) {
  const base = String(o.streznik || process.env.LESTVICA_STREZNIK || '').replace(/\/+$/, '');
  if (!/^https?:\/\//.test(base)) throw new Error('ni naslova strežnika (--streznik ali LESTVICA_STREZNIK)');
  const K = pripravi(o.K || koda()), T = L.keyTable(prave(K.C)), f = o.fetch || fetch, H = { Authorization: 'Bearer ' + await zeton(o) };
  const r0 = await f(base + '/v1/preveri', { headers: H });
  if (!r0.ok) throw new Error('seznam: ' + r0.status);
  const casi = ((await r0.json()) || {}).casi || [], izidi = [];
  for (const c of casi) {
    let iz;
    try {
      const r = await f(`${base}/v1/preveri?st=${encodeURIComponent(c.st)}&del=vnos`, { headers: H });
      if (r.status === 404) iz = { st: c.st, izid: 'zavrnjeno', razlog: 'ni-posnetka' };
      else if (!r.ok) iz = { st: c.st, izid: 'ni-mogoce' };
      else {
        let rec = null;
        try { const j = JSON.parse(zlib.gunzipSync(Buffer.from(await r.arrayBuffer()), { maxOutputLength: 64e6 }).toString('utf8')); rec = j && j.vnos ? j.vnos : j; } catch { rec = null; }
        iz = rec ? preveriCas(c, rec, K, T) : { st: c.st, izid: 'zavrnjeno', razlog: 'zapis' };
      }
    } catch { iz = { st: c.st, izid: 'ni-mogoce' }; }
    izidi.push(iz);
  }
  for (let i = 0; i < izidi.length; i += 200) {
    const r = await f(base + '/v1/preveri', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ izidi: izidi.slice(i, i + 200) }) });
    if (!r.ok) throw new Error('izidi: ' + r.status);
  }
  const s = (k) => izidi.filter(x => x.izid === k).length, pr = izidi.filter(x => x.izid === 'ok' && x.priblizno).length;
  const line = `${izidi.length} preverjenih: ${s('ok')} ok (${pr} približno), ${s('zavrnjeno')} zavrnjenih, ${s('ni-mogoce')} ni mogoče, ${s('sumljivo')} sumljivih`;
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) { try { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + '\n'); } catch { /* (optional) */ } }
  return { izidi, n: izidi.length };
}

if (import.meta.url === url.pathToFileURL(process.argv[1] || '').href) {
  const args = process.argv.slice(2), json = args.includes('--json'), si = args.indexOf('--streznik');
  if (args.includes('--krog')) {
    krog({ streznik: si >= 0 ? args[si + 1] : undefined }).then(() => process.exit(0), (e) => { console.log('krog: ' + String(e && e.message).slice(0, 200)); process.exit(1); });
  } else {
    const files = args.filter((a, j) => !a.startsWith('--') && args[j - 1] !== '--streznik');
    if (!files.length) { console.log('node tools/lestvica-preveri.mjs <posnetek.rrp | zapis.json> [več …] [--json] | --krog [--streznik <url>]'); process.exit(2); }
    const K = koda(), N = napake(), out = []; let bad = 0;
    for (const f of files) {
      let rec = null, r;
      try { rec = zapisIz(f, N); r = preveri(rec, K); } catch (e) { r = { ok: false, why: e.message }; }
      if (!r.ok) bad++;
      if (json) out.push({ file: path.basename(f), track: rec && rec.track, kind: rec && rec.kind, eng: rec && rec.eng, stamp: rec && rec.stamp, ok: r.ok, why: r.why, res: r.res, note: r.note || undefined });
      else { console.log(vrstica(path.basename(f), rec, r)); if (r.note) console.log('     ' + r.note); }
    }
    if (json) console.log(JSON.stringify(out, null, 1));
    process.exit(bad ? 1 : 0);
  }
}
