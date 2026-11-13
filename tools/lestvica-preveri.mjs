// A run's input replayed in Node, no server, no browser (Svetovna lestvica, seja 1: ponovljivost; docs/svetovna-lestvica.md, »Ponovljivost
// med brskalniki«): the record the game made of a repeatable race (js/vnos.js: a run alone, or any race in the test mode, ?seme=) is replayed
// by the game's own physics (Core, tests/lib/core.js) and the run's time and path compared: OK when the finish comes in the same step
// (1/120 s) and the path is never more than 0.5 m from the recorded one; »natančno« when every digest of the state and the finish agree to
// the last bit. The record rides in the recording's file (posnetek_<proga>_<LLLLMMDD-UUMM>.rrp, Shrani posnetek; its header's vnos) or in a
// file of its own (.json: the record, or { vnos }).
//   node tools/lestvica-preveri.mjs posnetek_spa_20261113-1010.rrp [več …] [--json]
//   GAME_ROOT=<a copy of the game at the record's stamp> node tools/lestvica-preveri.mjs posnetek.rrp   (an older version's physics)
// Exit 1 when a record fails. The user's recordings stay out of the repository (CLAUDE.md, Orodje za napake).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { createRequire } from 'node:module';
import { napake, readRrp } from './voznja.mjs';

const require = createRequire(import.meta.url);
const { loadCore, ROOT } = require('../tests/lib/core.js');
const { stampOf } = require('./stamp.js');
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
  return `${tag} ${name} — ${o}: ${res.fs != null ? 'cilj v koraku ' + res.fs + ', ' : ''}${ft}, pot največ ${f3(res.maxD)} m od zapisa${res.exact ? ', natančno do bita' : ''}${r.why ? ' — ' + r.why : ''}`;
}

if (import.meta.url === url.pathToFileURL(process.argv[1] || '').href) {
  const args = process.argv.slice(2), json = args.includes('--json'), files = args.filter(a => !a.startsWith('--'));
  if (!files.length) { console.log('node tools/lestvica-preveri.mjs <posnetek.rrp | zapis.json> [več …] [--json]'); process.exit(2); }
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
