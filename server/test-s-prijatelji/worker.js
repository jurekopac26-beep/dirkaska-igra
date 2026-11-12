/* =========================================================================
   Test s prijatelji: the counter (Cloudflare Worker + D1; docs/test-s-prijatelji.md)
   ---------------------------------------------------------------------------------------------------------------------------
   POST /e      one event of the game (js/tester.js): { k: code, s: visit id, t: 'start' | 'beat' | 'end' | 'dirka', ... }.
                Only the codes in the secret KODE (comma separated, e.g. T1,T2,…,T30) are taken, only from the game's origins
                (ORIGINS below). Nothing else is stored: no IP, no cookies, no names (the server's clock gives the times).
   GET  /p/<key> the overview (HTML), only with the secret PREGLED (a long random key); anything else: 404.
   Secrets (never in the repository): KODE, PREGLED. Binding: DB (D1, schema.sql).
   ========================================================================= */
const ORIGINS = [/^https:\/\/jurekopac26-beep\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const TZ = 'Europe/Ljubljana';
const MAX_BODY = 2048, MAX_RACE_S = 6 * 3600;

const okOrigin = (o) => !!o && ORIGINS.some((r) => r.test(o));
const cors = (o) => (okOrigin(o) ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : {});
const codes = (env) => new Set(String(env.KODE || '').split(',').map((c) => c.trim().toUpperCase()).filter(Boolean));
const str = (v, n) => (v == null ? null : String(v).replace(/[\u0000-\u001f<>]/g, '').slice(0, n) || null);
const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null; };

// a constant-time comparison of the overview key (no early exit on the first different character)
function same(a, b) {
  a = String(a || ''); b = String(b || '');
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0 && b.length >= 32;
}

async function event(req, env) {
  const o = req.headers.get('Origin'), h = cors(o);
  if (!okOrigin(o)) return new Response('', { status: 403 });
  const txt = await req.text();
  if (txt.length > MAX_BODY) return new Response('', { status: 413, headers: h });
  let e; try { e = JSON.parse(txt); } catch (_) { return new Response('', { status: 400, headers: h }); }
  const k = str(e && e.k, 8), s = str(e && e.s, 40), t = e && e.t;
  if (!k || !codes(env).has(k.toUpperCase()) || !s || !/^[\w-]{8,40}$/.test(s)) return new Response('', { status: 403, headers: h });
  const koda = k.toUpperCase(), now = Date.now(), db = env.DB;
  if (t === 'start') {
    await db.prepare('INSERT INTO seje (id, koda, zacetek, zadnji, naprava, os, brskalnik, zig) VALUES (?1, ?2, ?3, ?3, ?4, ?5, ?6, ?7) '
      + 'ON CONFLICT(id) DO UPDATE SET zadnji = ?3 WHERE koda = ?2')
      .bind(s, koda, now, str(e.naprava, 12), str(e.os, 24), str(e.brskalnik, 24), str(e.zig, 24)).run();
  } else if (t === 'beat' || t === 'end') {
    await db.prepare('UPDATE seje SET zadnji = ?3 WHERE id = ?1 AND koda = ?2').bind(s, koda, now).run();
  } else if (t === 'dirka') {
    const izid = ['cilj', 'odstop', 'zapustil'].includes(e.izid) ? e.izid : null;
    await db.batch([
      db.prepare('INSERT INTO dirke (seja, koda, cas, proga, nacin, vreme, trajanje, izid, mesto) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)')
        .bind(s, koda, now, str(e.proga, 32), str(e.nacin, 24), str(e.vreme, 16), num(e.trajanje, 0, MAX_RACE_S), izid, num(e.mesto, 1, 99)),
      db.prepare('UPDATE seje SET zadnji = ?3 WHERE id = ?1 AND koda = ?2').bind(s, koda, now),
    ]);
  } else return new Response('', { status: 400, headers: h });
  return new Response(null, { status: 204, headers: h });
}

// ---------------- the overview ----------------
const dayFmt = new Intl.DateTimeFormat('sl-SI', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('sl-SI', { timeZone: TZ, day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
const day = (ms) => { const p = Object.fromEntries(dayFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value])); return p.year + '-' + p.month + '-' + p.day; };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const min = (ms) => Math.round(ms / 60000);
const nat = (a, b) => a.localeCompare(b, 'en', { numeric: true });

async function overview(env) {
  const [S, D] = await Promise.all([
    env.DB.prepare('SELECT id, koda, zacetek, zadnji, naprava, os, brskalnik, zig FROM seje ORDER BY zacetek').all(),
    env.DB.prepare('SELECT seja, koda, cas, proga, nacin, vreme, trajanje, izid, mesto FROM dirke ORDER BY cas').all(),
  ]);
  const T = new Map();
  const get = (k) => T.get(k) || T.set(k, { koda: k, zadnji: 0, ms: 0, seje: 0, proge: new Map(), dnevi: new Map(), naprave: new Set(), dirke: [] }).get(k);
  const dan = (t, d) => t.dnevi.get(d) || t.dnevi.set(d, { ms: 0, seje: 0, dirke: 0 }).get(d);
  for (const s of S.results) {
    const t = get(s.koda), ms = Math.max(0, s.zadnji - s.zacetek);
    t.zadnji = Math.max(t.zadnji, s.zadnji); t.ms += ms; t.seje++;
    const d = dan(t, day(s.zacetek)); d.ms += ms; d.seje++;
    t.naprave.add([s.naprava, s.os, s.brskalnik].filter(Boolean).join(' · '));
  }
  for (const r of D.results) {
    const t = get(r.koda), p = t.proge.get(r.proga) || t.proge.set(r.proga, { n: 0, s: 0 }).get(r.proga);
    p.n++; p.s += r.trajanje || 0; dan(t, day(r.cas)).dirke++; t.zadnji = Math.max(t.zadnji, r.cas); t.dirke.push(r);
  }
  const rows = [...T.values()].sort((a, b) => nat(a.koda, b.koda));
  const vse = codes(env), brez = [...vse].filter((k) => !T.has(k)).sort(nat);
  const sum = rows.reduce((a, t) => a + t.ms, 0);
  let h = '<!doctype html><html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<meta name="robots" content="noindex,nofollow"><title>Test s prijatelji</title><style>'
    + ':root{color-scheme:light dark;--bg:#fff;--fg:#14181f;--mut:#667;--line:#dde;--card:#f6f7f9}'
    + '@media (prefers-color-scheme:dark){:root{--bg:#0f1217;--fg:#e8eaef;--mut:#9aa;--line:#2a3039;--card:#171b22}}'
    + 'body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}h1{font-size:20px;margin:0 0 4px}'
    + '.mut{color:var(--mut)}section{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:12px 0}'
    + 'h2{font-size:17px;margin:0 0 6px}table{border-collapse:collapse;width:100%;font-size:14px;margin:6px 0}td,th{text-align:left;padding:3px 8px 3px 0;border-bottom:1px solid var(--line)}'
    + 'th{font-weight:600}td.n,th.n{text-align:right}details{margin-top:6px}summary{cursor:pointer}</style></head><body>'
    + '<h1>Test s prijatelji</h1><div class="mut">Testerjev z igranjem: ' + rows.length + ' od ' + vse.size + ' · skupaj ' + min(sum) + ' min · čas po Ljubljani</div>';
  for (const t of rows) {
    h += '<section><h2>' + esc(t.koda) + '</h2><div>Zadnjič: <b>' + esc(timeFmt.format(new Date(t.zadnji))) + '</b> · skupaj <b>' + min(t.ms) + ' min</b> · obiskov '
      + t.seje + ' · dirk ' + t.dirke.length + '</div><div class="mut">' + esc([...t.naprave].filter(Boolean).join(' | ')) + '</div>';
    const P = [...t.proge.entries()].sort((a, b) => b[1].s - a[1].s);
    if (P.length) h += '<table><tr><th>Proga</th><th class="n">Dirk</th><th class="n">Min</th></tr>'
      + P.map(([p, v]) => '<tr><td>' + esc(p || '?') + '</td><td class="n">' + v.n + '</td><td class="n">' + Math.round(v.s / 60) + '</td></tr>').join('') + '</table>';
    h += '<table><tr><th>Dan</th><th class="n">Min</th><th class="n">Obiskov</th><th class="n">Dirk</th></tr>'
      + [...t.dnevi.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([d, v]) => '<tr><td>' + d + '</td><td class="n">' + min(v.ms) + '</td><td class="n">' + v.seje
        + '</td><td class="n">' + v.dirke + '</td></tr>').join('') + '</table>';
    if (t.dirke.length) h += '<details><summary>Dirke (zadnjih 50)</summary><table><tr><th>Kdaj</th><th>Proga</th><th>Način</th><th>Vreme</th><th class="n">Min</th><th>Izid</th><th class="n">Mesto</th></tr>'
      + t.dirke.slice(-50).reverse().map((r) => '<tr><td>' + esc(timeFmt.format(new Date(r.cas))) + '</td><td>' + esc(r.proga) + '</td><td>' + esc(r.nacin) + '</td><td>' + esc(r.vreme)
        + '</td><td class="n">' + (r.trajanje == null ? '' : (r.trajanje / 60).toFixed(1)) + '</td><td>' + esc(r.izid) + '</td><td class="n">' + (r.mesto == null ? '' : r.mesto) + '</td></tr>').join('')
      + '</table></details>';
    h += '</section>';
  }
  if (brez.length) h += '<p class="mut">Še brez igranja: ' + esc(brez.join(', ')) + '</p>';
  return new Response(h + '</body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer' } });
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url), o = req.headers.get('Origin');
    try {
      if (u.pathname === '/e') {
        if (req.method === 'OPTIONS') return new Response(null, { status: okOrigin(o) ? 204 : 403, headers: cors(o) });
        if (req.method === 'POST') return await event(req, env);
      }
      if (req.method === 'GET' && u.pathname.startsWith('/p/') && same(u.pathname.slice(3), env.PREGLED)) return await overview(env);
    } catch (_) { return new Response('', { status: 500, headers: cors(o) }); }
    return new Response('', { status: 404 });
  },
};
