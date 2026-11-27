// The bounds the world leaderboard's server checks a run against when it comes (Svetovna lestvica, seja 2: strežnik; docs/svetovna-lestvica.md,
// »Pregled ob oddaji«): for every key of a real track's time trial and circuit lap (js/lestvica.js keyTable: kinds tt and lap, both physics, a
// time trial's winter and wet too) the fastest a run could be (Lestvica.bound, s), the length of its racing line (m) and, for a time trial with
// checkpoints, each part's bound between them; the cars, the upgrades and the assists the game has. Made from the game's code only, no
// player's data: the server reads it from its R2 (meje.json), put there at the deployment (wrangler r2 object put, the section »Namestitev«)
// and after a new version of the game by the checking job (POST /v1/meje). Not kept in the repository: it is rebuilt from the code any time.
//   node tools/lestvica-meje.mjs [--proge harju,spa] [--out meje.json]
import fs from 'node:fs';
import url from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { loadCore } = require('../tests/lib/core.js');
const L = require('../js/lestvica.js');

// tracks with neither flag that are still not real ones (CLAUDE.md, »Testne proge«, »Ena proga na državo«: Suzuka a test track, Medvode on the
// waiting list; they get their flag later). A track that gets test or pending leaves the leaderboard at the next build of the bounds
export const NI_PRAVE = ['suzuka', 'medvode'];
export const KINDS = ['tt', 'lap'];   // (the scope, »Odločitve uporabnika«: a road's time trial and a circuit's best lap)
export const SEG_K = 0.8;   // a part between checkpoints at least 0.8 of its bound (a short part's corner cut can beat its line; a whole run: 1.0)

export const prave = (C, izbor) => C.TRACKS.filter(d => !d.test && !d.pending && !NI_PRAVE.includes(d.id) && (!izbor || izbor.includes(d.id)));
const r3 = (v) => Math.round(v * 1000) / 1000;

// one key's bound split at the checkpoints (the same sum as Lestvica.bound: each sample's length over the speed allowed there)
function parts(T, I, models) {
  const vc = 1.15 * (L.topSpeed(models) || 92), G3 = 3 * 9.81, N = T.N, ds = T.ds, d = T.def || {};
  let i0 = 0, i1 = N;
  if (T.open) { const end = I.kind === 'police' && d.hideout ? T.startS + d.hideout.s : T.finishS; i0 = Math.round(T.startS / ds); i1 = Math.round(end / ds); }
  const cut = I.kind === 'tt' && Array.isArray(T.cpS) ? T.cpS.map(s => Math.round(s / ds)).filter(i => i > i0 && i < i1) : [];
  const seg = [0]; let len = 0, sum = 0;
  for (let i = i0; i < i1; i++) {
    if (cut.includes(i)) seg.push(0);
    const j = ((i % N) + N) % N, k = Math.abs(T.rk[j]), v = k > 1e-6 ? Math.min(vc, Math.sqrt(G3 / k)) : vc, t = T.rds[j] / v;
    seg[seg.length - 1] += t; sum += t; len += T.rds[j];
  }
  return { seg, len, sum, cps: Array.isArray(T.cpS) ? T.cpS.length : 0 };
}

// the bounds file { v, jedro, ustvarjeno, vmax, vk, segK, avti, nad, nadMax, pomoc, kljuci: { key: { k, b, d, seg? } } } (b, seg: s; d: m;
// avti: the cars a player can drive, a retired one (retired: true, in no garage) left out; the garage's parts, js/deli.js, are not listed:
// the replay cleans them to the game's own options, DELI.clean)
export function meje(o) {
  o = o || {};
  const C = o.C || loadCore(), table = L.keyTable(prave(C, o.proge)), built = new Map(), kljuci = {};
  for (const [key, I] of table) {
    if (!KINDS.includes(I.kind)) continue;
    let T = built.get(I.id); if (!T) { T = new C.Track(C.TRACKS.find(d => d.id === I.id)); built.set(I.id, T); }
    const b = L.bound(T, I, C.MODELS); if (!(b > 0)) continue;
    const p = parts(T, I, C.MODELS);
    if (Math.abs(p.sum - b) > 1e-6) throw new Error(`${key}: deli ${p.sum} s, meja ${b} s`);   // (the parts must be Lestvica.bound's sum)
    const e = { k: I.kind, b: r3(b), d: Math.round(p.len) };
    if (I.kind === 'tt' && p.cps) { if (p.seg.length !== p.cps + 1) throw new Error(`${key}: ${p.seg.length} delov, ${p.cps} mejnikov`); e.seg = p.seg.map(r3); }
    kljuci[key] = e;
  }
  return {
    v: 1, jedro: o.jedro || '', ustvarjeno: new Date(o.now || Date.now()).toISOString().slice(0, 10), vmax: r3(L.topSpeed(C.MODELS)), vk: 1.15, segK: SEG_K,
    avti: C.MODELS.filter(M => !M.retired).map(M => M.id), nad: C.UPG.map(u => u.id), nadMax: Math.min(...C.UPG.map(u => u.lv.length)) - 1, pomoc: C.ASSISTS.length, kljuci,
  };
}

if (import.meta.url === url.pathToFileURL(process.argv[1] || '').href) {
  const args = process.argv.slice(2), val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const izbor = val('--proge') ? val('--proge').split(',') : null, out = val('--out') || 'meje.json';
  const { stampOf } = require('./stamp.js');
  const M = meje({ proge: izbor, jedro: stampOf(new URL('../js/core.js', import.meta.url).pathname) });
  fs.writeFileSync(out, JSON.stringify(M));
  console.log(`${out}: ${Object.keys(M.kljuci).length} ključev, ${new Set(Object.keys(M.kljuci).map(k => k.split(/[-@]/)[0])).size} prog, ${M.avti.length} avtov`);
}
