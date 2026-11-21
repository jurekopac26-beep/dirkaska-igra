// The quick check of a run when it comes (docs/svetovna-lestvica.md, »Pregled ob oddaji«; README.md here, »Pregled ob oddaji«): the fields
// against the bounds (meje.json, tools/lestvica-meje.mjs): a known board, a car the game has, its upgrades and assist, the time no faster
// than the key's bound, each part between checkpoints no faster than SEG_K of its bound, the record's steps as long as the time; the ghost,
// when there is one: the game's format (js/game.js ghParse), as long as the time, never faster than the bound's speed but for a few
// jumps (a car put back on the road), its path about the racing line's length. The replay of the record (tools/lestvica-preveri.mjs krog,
// the checking job) decides; this only keeps out what cannot be a run of the game. The ghost is rebuilt from its known fields only: the
// public one (GET /v1/duh) holds nothing a client added.
import { Napaka, KEY_RE, CAR_RE, isObj, own, enc } from './ovoj.js';

const ZIG_RE = /^[\w.-]{1,40}$/, ENG_RE = /^[\w .-]{1,24}$/, HASH_RE = /^[\w-]{43}$/, B64_RE = /^[A-Za-z0-9+/]*={0,2}$/, NAD_RE = /^[a-z]{1,16}$/;
const posNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
export const MAX_T = 7.2e6, MAX_N = 1e6, KORAK = 120;   // (at most 2 h; steps: 120 a second, js/vnos.js)
export const KORAKI_TOL = 1.5;   // (the plan's ±1 step: a time cut inside a step at both ends of a lap)
export const GH = { V: 1, DT: 0.1, MAX: 12000, CH: 7 };   // (js/game.js GH_V, GH_DT, GH_MAX, GH_CH)
export const DUH_N_TOL = 2;   // (samples: floor(t / 0.1) + 2 ± 2; a lap's first one is where it starts, the last just past the line)
export const DUH_SKOKI = 10, DUH_SKOK = 300, DUH_POT = [0.85, 3];   // (jumps: at most 10, each up to 300 m; the path: 0.85 to 3 times the line's length)
const TOD = ['day', 'dusk', 'night', 'dawn'], SEASON = ['summer', 'autumn', 'winter'];

// the bounds file as the checking job sends it (POST /v1/meje) and the server keeps it in R2
export function veljavneMeje(M) {
  if (!isObj(M) || M.v !== 1 || typeof M.jedro !== 'string' || M.jedro.length > 40 || !posNum(M.vmax) || !posNum(M.vk) || !posNum(M.segK) || M.segK > 1) return false;
  if (!Array.isArray(M.avti) || !M.avti.length || M.avti.length > 500 || !M.avti.every(a => typeof a === 'string' && CAR_RE.test(a))) return false;
  if (!Array.isArray(M.nad) || M.nad.length > 16 || !M.nad.every(a => typeof a === 'string' && NAD_RE.test(a))) return false;
  if (!Number.isInteger(M.nadMax) || M.nadMax < 0 || M.nadMax > 9 || !Number.isInteger(M.pomoc) || M.pomoc < 1 || M.pomoc > 9) return false;
  if (!isObj(M.kljuci)) return false;
  const k = Object.keys(M.kljuci); if (!k.length || k.length > 4000) return false;
  return k.every(key => {
    const e = M.kljuci[key];
    if (!KEY_RE.test(key) || !isObj(e) || (e.k !== 'tt' && e.k !== 'lap') || !posNum(e.b) || !posNum(e.d)) return false;
    if (e.seg == null) return true;
    return e.k === 'tt' && Array.isArray(e.seg) && e.seg.length >= 2 && e.seg.length <= 64 && e.seg.every(x => Number.isFinite(x) && x >= 0) && Math.abs(e.seg.reduce((a, x) => a + x, 0) - e.b) < 0.05;
  });
}

// a run's packet against the bounds: the key's bounds { k, b, d, seg? } (or Napaka 400 with what is wrong)
export function hitri(p, M) {
  const key = p.kljuc;
  if (typeof key !== 'string' || !KEY_RE.test(key) || !own(M.kljuci, key)) throw new Napaka(400, 'neznan-kljuc');
  const e = M.kljuci[key];
  if (typeof p.avto !== 'string' || !CAR_RE.test(p.avto) || !M.avti.includes(p.avto)) throw new Napaka(400, 'avto');
  if (!isObj(p.nad) || Object.keys(p.nad).length !== M.nad.length || !M.nad.every(id => own(p.nad, id) && Number.isInteger(p.nad[id]) && p.nad[id] >= 0 && p.nad[id] <= M.nadMax)) throw new Napaka(400, 'nadgradnje');
  if (!Number.isInteger(p.pomoc) || p.pomoc < 0 || p.pomoc >= M.pomoc) throw new Napaka(400, 'pomoc');
  const t = p.t, z = p.zig;
  if (!Number.isInteger(t) || t < 1 || t > MAX_T || !isObj(z) || Object.keys(z).length !== 2 || typeof z.igra !== 'string' || !ZIG_RE.test(z.igra) || typeof z.jedro !== 'string' || !ZIG_RE.test(z.jedro)
    || typeof p.eng !== 'string' || !ENG_RE.test(p.eng) || typeof p.hv !== 'string' || !HASH_RE.test(p.hv) || (p.ld > 0 && (typeof p.hd !== 'string' || !HASH_RE.test(p.hd)))) throw new Napaka(400, 'polja');
  if (t < e.b * 1000) throw new Napaka(400, 'prehiter');
  // the times at the checkpoints (ms from the start): a time trial with checkpoints one each, a lap none
  const v = p.vmes, seg = e.k === 'tt' && Array.isArray(e.seg) ? e.seg : null;
  if (!Array.isArray(v) || v.length !== (seg ? seg.length - 1 : 0)) throw new Napaka(400, 'vmesni');
  if (seg) for (let i = 0, prev = 0; i <= v.length; i++) {
    const x = i < v.length ? v[i] : t;
    if (!Number.isInteger(x) || x <= prev || x - prev < M.segK * seg[i] * 1000) throw new Napaka(400, 'vmesni');
    prev = x;
  }
  // the record's steps: s0 to s1 the timed part (as long as the time), n all of them, fs the finish (a time trial's is s1)
  const { n, s0, s1 } = p, fs = p.fs == null ? null : p.fs;
  if (![n, s0, s1].every(Number.isInteger) || s0 < 0 || s0 >= s1 || s1 > n || n > MAX_N || Math.abs((s1 - s0) - t * KORAK / 1000) > KORAKI_TOL) throw new Napaka(400, 'koraki');
  if (e.k === 'tt' ? fs !== s1 : fs !== null && !(Number.isInteger(fs) && fs >= 0 && fs <= n)) throw new Napaka(400, 'koraki');
  return e;
}

// the ghost (js/game.js ghWrite's JSON) checked and rebuilt: the bytes kept and served (or Napaka 400 'duh')
export function preveriDuh(o, p, e, M) {
  const bad = () => new Napaka(400, 'duh'), t = p.t, lap = e.k === 'lap';
  if (!isObj(o) || o.v !== GH.V || o.dt !== GH.DT || typeof o.t !== 'number' || !(Math.abs(o.t * 1000 - t) <= 1) || !Number.isInteger(o.n) || o.n < 2 || o.n > GH.MAX) throw bad();
  if (typeof o.d !== 'string' || !Array.isArray(o.q0) || o.q0.length !== 3 || !o.q0.every(q => Number.isInteger(q) && Math.abs(q) <= 1e9) || o.car !== p.avto || (lap ? o.lap !== 1 : o.lap != null)) throw bad();
  const ch = o.ch == null ? GH.CH : o.ch;
  if (ch !== GH.CH && ch !== GH.CH + 1 && ch !== GH.CH + 2) throw bad();
  if (Math.abs(o.n - (Math.floor(t / 100) + 2)) > DUH_N_TOL) throw bad();
  if (o.d.length % 4 || !B64_RE.test(o.d)) throw bad();
  let b; try { b = atob(o.d); } catch (_) { throw bad(); }
  if (b.length !== o.n * ch * 2) throw bad();
  // the samples' moves (Int16, little-endian, cm from the sample before: x, y, z, then the angles): along the ground, a sample each 0.1 s
  const i16 = (i) => (b.charCodeAt(i) | (b.charCodeAt(i + 1) << 8)) << 16 >> 16, lim = M.vmax * M.vk * GH.DT * 100;
  let pot = 0, skoki = 0;
  for (let k = 1; k < o.n; k++) {
    const i = k * ch * 2, s = Math.hypot(i16(i), i16(i + 4));
    if (s <= lim) pot += s;
    else if (++skoki > DUH_SKOKI || s > DUH_SKOK * 100) throw bad();
  }
  pot /= 100;
  if (pot < DUH_POT[0] * e.d || pot > DUH_POT[1] * e.d) throw bad();
  // rebuilt: the known fields, each of its own kind (the conditions the game reads to drive against it: rain, time of day, season, the
  // upgrades as checked, the set-up)
  const c = isObj(o.cond) ? o.cond : {}, su = isObj(c.setup) ? c.setup : {}, v3 = (x) => x === 0 || x === 1 || x === 2 ? x : 1, upg = {};
  for (const id of M.nad) upg[id] = p.nad[id];
  const out = {
    v: GH.V, dt: GH.DT, n: o.n, t: o.t, car: p.avto, color: Number.isInteger(o.color) && o.color >= 0 && o.color <= 0xffffff ? o.color : undefined, stripe: o.stripe !== false,
    lap: lap ? 1 : undefined, ch: ch > GH.CH ? ch : undefined, q0: o.q0.slice(), d: o.d,
    cond: { rain: c.rain === 1 ? 1 : 0, tod: TOD.includes(c.tod) ? c.tod : 'day', season: SEASON.includes(c.season) ? c.season : 'summer', upg, setup: { wing: v3(su.wing), gear: v3(su.gear) } },
  };
  return enc(JSON.stringify(out));
}
