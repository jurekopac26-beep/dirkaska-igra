// The router (README.md here, »Vmesnik«): the path and the method to a handler; an error to { ok: false, napaka } with its status; CORS
// for the game's pages (env.IZVORI: GitHub Pages and the app, https://localhost) and a local server (http://localhost, 127.0.0.1). An
// unexpected error is logged by its name and message only (never a request's body or a player's data) and answered 500 napaka.
import { Napaka, own } from './ovoj.js';
import { json } from './skupno.js';
import * as Z from './zahtevki.js';
import * as B from './branje.js';
import * as P from './preveri.js';

export const POTI = {
  '/v1/lestvica': { GET: B.lestvica }, '/v1/mesto': { GET: B.mesto }, '/v1/duh': { GET: B.duh }, '/v1/stanje': { GET: B.stanje },
  '/v1/vzdevek': { POST: Z.vzdevek }, '/v1/oddaja': { POST: Z.oddaja }, '/v1/izbris': { POST: Z.izbris }, '/v1/prijava': { POST: Z.prijava }, '/v1/moje': { POST: Z.moje },
  '/v1/preveri': { GET: P.seznam, POST: P.izidi }, '/v1/meje': { POST: P.meje },
};
const LOKALNO = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;
const NE = { 'Cache-Control': 'no-store' };

function cors(req, env, res) {
  const h = new Headers(res.headers), o = req.headers.get('Origin');
  if (o && (String(env.IZVORI || '').split(',').map(x => x.trim()).includes(o) || LOKALNO.test(o))) h.set('Access-Control-Allow-Origin', o);
  h.append('Vary', 'Origin');
  h.set('X-Content-Type-Options', 'nosniff');
  return new Response(res.body, { status: res.status, headers: h });
}

export async function obdelaj(req, env, ctx) {
  let res;
  try {
    const pot = new URL(req.url).pathname, m = own(POTI, pot) ? POTI[pot] : null;
    if (!m) throw new Napaka(404, 'ni');
    if (req.method === 'OPTIONS') res = new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
    else if (!own(m, req.method)) res = json({ ok: false, napaka: 'metoda' }, 405, { Allow: [...Object.keys(m), 'OPTIONS'].join(', '), ...NE });
    else res = await m[req.method](req, env, ctx);
  } catch (e) {
    if (e instanceof Napaka) res = json({ ok: false, napaka: e.koda, ...(e.extra || {}) }, e.st, e.st === 429 && e.extra ? { 'Retry-After': String(e.extra.cez), ...NE } : NE);
    else { console.log(`napaka: ${e && e.name}: ${String(e && e.message).slice(0, 200)}`); res = json({ ok: false, napaka: 'napaka' }, 500, NE); }
  }
  return cors(req, env, res);
}
