// The public reads (docs/svetovna-lestvica.md, »Vmesnik«; README.md here, »Vmesnik«): a board's first 100, a player's place, a ghost of
// the first 100, the server's state. No signature, no write; a board's answers kept 60 s (skupno.js, the cache) and so said to the browser.
import { Napaka, KEY_RE, ID_RE } from './ovoj.js';
import { ura, json, kesBeri, kesPisi, beriMeje, poti, PRVIH } from './skupno.js';

const JAVNO = { 'Cache-Control': 'public, max-age=60' };
function kljucIz(u) { const k = u.searchParams.get('kljuc'); if (typeof k !== 'string' || !KEY_RE.test(k)) throw new Napaka(400, 'poizvedba'); return k; }
function idIz(u) { const id = u.searchParams.get('id'); if (typeof id !== 'string' || !ID_RE.test(id)) throw new Napaka(400, 'poizvedba'); return id; }
const celo = (v, d) => v == null ? d : /^\d{1,4}$/.test(v) ? +v : NaN;
// the order of a board: the time, then who sent it first (a.ms <= b.ms first: the index's range, then the ties)
const PRED = '(a.ms <= b.ms AND (a.ms < b.ms OR a.oddan < b.oddan OR (a.oddan = b.oddan AND a.st < b.st)))';
const PRVIH_ST = `SELECT st FROM casi WHERE kljuc = ?1 AND stanje = 'ok' ORDER BY ms, oddan, st LIMIT ${PRVIH}`;
async function iz(env, k, now, f) { let s = kesBeri(env, k, now); if (s == null) { s = JSON.stringify(await f()); kesPisi(env, k, s, now); } return new Response(s, { headers: { 'Content-Type': 'application/json; charset=utf-8', ...JAVNO } }); }

// GET /v1/lestvica?kljuc=&od=0&n=100: the checked times od+1 … od+n (of the first 100) → { kljuc, od, skupaj, vrstice: [{ mesto, id,
// ime (null: hidden, the client shows »Voznik #<oznaka>«), oznaka, ms, vmes, avto, nad, pomoc, priblizno, duh }] }
export async function lestvica(req, env) {
  const u = new URL(req.url), k = kljucIz(u), od = celo(u.searchParams.get('od'), 0), n = celo(u.searchParams.get('n'), PRVIH - od);
  if (!(od >= 0 && n >= 1 && od + n <= PRVIH)) throw new Napaka(400, 'poizvedba');
  return iz(env, `l:${k}:${od}:${n}`, ura(env), async () => {
    const [v, s] = await env.DB.batch([
      env.DB.prepare(`SELECT c.igralec id, g.ime, g.skrit, c.ms, c.vmes, c.avto, c.nad, c.pomoc, c.priblizno, c.duh FROM casi c JOIN igralci g ON g.id = c.igralec WHERE c.kljuc = ?1 AND c.stanje = 'ok' AND g.prepoved = 0 ORDER BY c.ms, c.oddan, c.st LIMIT ?2 OFFSET ?3`).bind(k, n, od),
      env.DB.prepare(`SELECT COUNT(*) n FROM casi WHERE kljuc = ?1 AND stanje = 'ok'`).bind(k),
    ]);
    return { ok: true, kljuc: k, od, skupaj: s.results[0].n, vrstice: v.results.map((r, i) => ({
      mesto: od + i + 1, id: r.id, ime: r.skrit ? null : r.ime, oznaka: r.id.slice(0, 4).toUpperCase(), ms: r.ms, vmes: JSON.parse(r.vmes), avto: r.avto,
      nad: JSON.parse(r.nad), pomoc: r.pomoc, priblizno: !!r.priblizno, duh: !!r.duh,
    })) };
  });
}

// GET /v1/mesto?kljuc=&id=: a player's place on a board, also past the first 100 → { kljuc, id, mesto, ms (null, null: no checked time), skupaj }
export async function mesto(req, env) {
  const u = new URL(req.url), k = kljucIz(u), id = idIz(u);
  return iz(env, `m:${k}:${id}`, ura(env), async () => {
    const [m, s] = await env.DB.batch([
      env.DB.prepare(`SELECT b.ms, (SELECT COUNT(*) FROM casi a WHERE a.kljuc = ?1 AND a.stanje = 'ok' AND ${PRED}) + 1 m FROM casi b WHERE b.kljuc = ?1 AND b.igralec = ?2 AND b.stanje = 'ok' ORDER BY b.ms, b.oddan, b.st LIMIT 1`).bind(k, id),
      env.DB.prepare(`SELECT COUNT(*) n FROM casi WHERE kljuc = ?1 AND stanje = 'ok'`).bind(k),
    ]);
    const r = m.results[0];
    return { ok: true, kljuc: k, id, mesto: r ? r.m : null, ms: r ? r.ms : null, skupaj: s.results[0].n };
  });
}

// GET /v1/duh?kljuc=&id=: the ghost of a player's checked time while it is among the first 100 (js/game.js's ghost JSON) or 404 ni
export async function duh(req, env) {
  const u = new URL(req.url), k = kljucIz(u), id = idIz(u);
  const st = await env.DB.prepare(`SELECT c.st FROM casi c JOIN igralci g ON g.id = c.igralec WHERE c.kljuc = ?1 AND c.igralec = ?2 AND c.stanje = 'ok' AND c.duh = 1 AND g.prepoved = 0 AND c.st IN (${PRVIH_ST}) ORDER BY c.ms LIMIT 1`)
    .bind(k, id).first('st');
  const o = st == null ? null : await env.R2.get(poti(k, st)[1]);
  if (!o) throw new Napaka(404, 'ni');
  return new Response(o.body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}

// GET /v1/stanje: is the server set up (the bounds in R2, the IP's salt) → { v, meje, jedro, kljuci, sol } (for the deploy's check)
export async function stanje(req, env) {
  const M = await beriMeje(env, ura(env));
  return json({ ok: true, v: 1, meje: !!M, jedro: M ? M.jedro : null, kljuci: M ? Object.keys(M.kljuci).length : 0, sol: !!env.IP_SOL }, 200, { 'Cache-Control': 'no-store' });
}
