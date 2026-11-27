// The checking job's routes (docs/svetovna-lestvica.md, »Preverjanje«; README.md here, »Preverjanje«), only with GitHub's token of the
// workflow (oidc.js): GET /v1/preveri the runs waiting (2 minutes after they came; the ones tried least first) and, with ?st=&del=, a waiting
// run's record or ghost; POST /v1/preveri the outcomes; POST /v1/meje the bounds (meje.json in R2, tools/lestvica-meje.mjs). The job gets
// no player's id or nickname: only what the replay needs.
import { Napaka, DAY, beri, isObj } from './ovoj.js';
import { ura, json, poti, zapisiPoti, brisiPoti, odvecni, obrezi, kesBrisi, mejeBrisi, V_SEZNAMU } from './skupno.js';
import { MAX_T, veljavneMeje } from './pregled.js';
import { preveriOidc } from './oidc.js';

export const SEZNAM = 200, ODLOG_MS = 120000, NI_MOGOCE_MS = 7 * DAY;
const IZIDI = ['ok', 'zavrnjeno', 'ni-mogoce', 'sumljivo'], RAZLOG_RE = /^[\w .,:;()%-]{1,80}$/;
const NE = { 'Cache-Control': 'no-store' }, TD = new TextDecoder('utf-8', { fatal: true });
async function telo(req, max, koda) { const u = await beri(req, max); try { return JSON.parse(TD.decode(u)); } catch (_) { throw new Napaka(400, koda); } }

// GET /v1/preveri → { casi: [{ st, kljuc, ms, vmes, avto, nad, pomoc, zig, eng, n, fs, s0, s1, duh }] } (at most 200; a banned player's
// runs not: the clean-up rejects them); ?st=&del=vnos|duh: the run's record (gzip) or ghost (JSON) while it waits, else 404 ni
export async function seznam(req, env) {
  await preveriOidc(req, env);
  const u = new URL(req.url);
  if (u.searchParams.has('st')) {
    const sv = u.searchParams.get('st'), del = u.searchParams.get('del');
    if (!/^[1-9]\d{0,14}$/.test(sv) || (del !== 'vnos' && del !== 'duh')) throw new Napaka(400, 'poizvedba');
    const st = +sv, k = await env.DB.prepare(`SELECT kljuc FROM casi WHERE st = ?1 AND stanje = 'caka' AND ${del === 'vnos' ? 'posnetek' : 'duh'} = 1`).bind(st).first('kljuc');
    const o = k == null ? null : await env.R2.get(poti(k, st)[del === 'vnos' ? 0 : 1]);
    if (!o) throw new Napaka(404, 'ni');
    return new Response(o.body, { headers: { 'Content-Type': del === 'vnos' ? 'application/gzip' : 'application/json; charset=utf-8', ...NE } });
  }
  const r = await env.DB.prepare(`SELECT c.st, c.kljuc, c.ms, c.vmes, c.avto, c.nad, c.pomoc, c.zig, c.eng, c.n, c.fs, c.s0, c.s1, c.duh FROM casi c JOIN igralci g ON g.id = c.igralec WHERE c.stanje = 'caka' AND c.oddan <= ?1 AND g.prepoved = 0 ORDER BY c.poskusi, c.oddan LIMIT ${SEZNAM}`)
    .bind(ura(env) - ODLOG_MS).all();
  return json({ ok: true, casi: r.results.map(c => ({ ...c, vmes: JSON.parse(c.vmes), nad: JSON.parse(c.nad), zig: JSON.parse(c.zig), duh: !!c.duh })) }, 200, NE);
}

// POST /v1/preveri { izidi: [{ st, izid, razlog?, t?, vmes?, priblizno? }] } (1 … 200, each run once): ok (t and vmes the checked time and
// checkpoints when they differ, priblizno: »preverjeno približno«), zavrnjeno and sumljivo with the reason, ni-mogoce (the check could not
// be made: tried again, rejected 7 days after the run came). Only waiting runs change; a rejected run loses its objects at once; then a
// player keeps their best (skupno.js odvecni) and the boards their first 100 objects (obrezi) → the counts.
export async function izidi(req, env) {
  await preveriOidc(req, env);
  const now = ura(env), b = await telo(req, 1e6, 'izidi'), I = isObj(b) && Array.isArray(b.izidi) ? b.izidi : null;
  if (!I || !I.length || I.length > SEZNAM) throw new Napaka(400, 'izidi');
  const ok = [], zav = [], sum = [], nim = [], videni = new Set();
  for (const x of I) {
    if (!isObj(x) || !Number.isSafeInteger(x.st) || x.st < 1 || videni.has(x.st) || !IZIDI.includes(x.izid)) throw new Napaka(400, 'izidi');
    if (x.razlog != null && (typeof x.razlog !== 'string' || !RAZLOG_RE.test(x.razlog))) throw new Napaka(400, 'izidi');
    videni.add(x.st);
    if (x.izid === 'ok') {
      const o = { st: x.st, priblizno: x.priblizno ? 1 : 0 };   // (t and vmes only when given: a missing key keeps the run's own)
      if (x.t != null) { if (!Number.isInteger(x.t) || x.t < 1 || x.t > MAX_T) throw new Napaka(400, 'izidi'); o.t = x.t; }
      if (x.vmes != null) { if (!Array.isArray(x.vmes) || x.vmes.length > 64 || !x.vmes.every(v => Number.isInteger(v) && v > 0 && v <= MAX_T)) throw new Napaka(400, 'izidi'); o.vmes = x.vmes; }
      ok.push(o);
    } else if (x.izid === 'ni-mogoce') nim.push(x.st);
    else (x.izid === 'zavrnjeno' ? zav : sum).push({ st: x.st, razlog: x.razlog ?? x.izid });
  }
  const s = JSON.stringify, meja = now - NI_MOGOCE_MS, IZ_SEZNAMA = `FROM json_each(?1) j WHERE casi.st = j.value ->> '$.st' AND casi.stanje = 'caka'`;
  const r = await env.DB.batch([
    zapisiPoti(env, `stanje = 'caka' AND (st IN (SELECT value ->> '$.st' FROM json_each(?1)) OR (st IN (SELECT value FROM json_each(?2)) AND oddan <= ?3))`, s(zav), s(nim), meja),
    env.DB.prepare(`UPDATE casi SET stanje = 'zavrnjeno', razlog = j.value ->> '$.razlog', preverjen = ?2, duh = 0, posnetek = 0 ${IZ_SEZNAMA}`).bind(s(zav), now),
    env.DB.prepare(`UPDATE casi SET stanje = 'zavrnjeno', razlog = 'ni-mogoce', preverjen = ?3, duh = 0, posnetek = 0, poskusi = poskusi + 1 WHERE stanje = 'caka' AND st ${V_SEZNAMU} AND oddan <= ?2`).bind(s(nim), meja, now),
    env.DB.prepare(`UPDATE casi SET poskusi = poskusi + 1 WHERE stanje = 'caka' AND st ${V_SEZNAMU}`).bind(s(nim)),
    env.DB.prepare(`UPDATE casi SET stanje = 'ok', ms = COALESCE(j.value ->> '$.t', ms), vmes = COALESCE(j.value -> '$.vmes', vmes), priblizno = j.value ->> '$.priblizno', razlog = NULL, preverjen = ?2 ${IZ_SEZNAMA} RETURNING casi.igralec, casi.kljuc`).bind(s(ok), now),
    env.DB.prepare(`UPDATE casi SET stanje = 'sumljivo', razlog = j.value ->> '$.razlog', preverjen = ?2 ${IZ_SEZNAMA} RETURNING casi.igralec`).bind(s(sum), now),
  ]);
  await brisiPoti(env, r[0]);
  const okR = r[4].results, sumR = r[5].results;
  const odv = await odvecni(env, [...okR, ...sumR].map(x => x.igralec)), obr = await obrezi(env, okR.map(x => x.kljuc));
  if (okR.length || odv || obr) kesBrisi(env);
  return json({ ok: true, izidi: { ok: okR.length, zavrnjeno: r[1].meta.changes, 'ni-mogoce': r[3].meta.changes, potekli: r[2].meta.changes, sumljivo: sumR.length }, odvecni: odv, obrezani: obr }, 200, NE);
}

// POST /v1/meje: the bounds (tools/lestvica-meje.mjs's file, pregled.js veljavneMeje) kept in R2 → { kljuci, jedro }; another isolate
// takes them within 10 minutes (skupno.js beriMeje)
export async function meje(req, env) {
  await preveriOidc(req, env);
  const M = await telo(req, 2e6, 'meje');
  if (!veljavneMeje(M)) throw new Napaka(400, 'meje');
  await env.R2.put('meje.json', JSON.stringify(M), { httpMetadata: { contentType: 'application/json' } });
  mejeBrisi(env);
  return json({ ok: true, kljuci: Object.keys(M.kljuci).length, jedro: M.jedro }, 200, NE);
}
