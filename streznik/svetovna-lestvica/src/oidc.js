// The checking job's token (docs/svetovna-lestvica.md, »Skrivnosti in omrežje«: GitHub OIDC, no secret; README.md here, »Preverjanje«):
// GitHub signs a short JWT for the workflow run (RS256, its keys at JWKS); the server takes only the one workflow file of this repository on
// main, run on a schedule, by hand or on a push. The keys kept an hour; an unknown key id fetches them again, at most once a minute.
import { Napaka, unb64u, enc, isObj } from './ovoj.js';
import { ura, dohvat } from './skupno.js';

export const ISS = 'https://token.actions.githubusercontent.com', JWKS = ISS + '/.well-known/jwks';
export const REPO = 'jurekopac26-beep/dirkaska-igra', REF = 'refs/heads/main', WORKFLOW = `${REPO}/.github/workflows/lestvica-preveri.yml@${REF}`;
export const DOGODKI = ['schedule', 'workflow_dispatch', 'push'];
const RS = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, URA_MS = 3600e3, ZNOVA_MS = 60e3, ZAMIK = 60;

// the keys by their id (kid), kept in the isolate; a failed fetch keeps the old ones (none yet: 503)
const KLJUCI = new WeakMap();
async function kljuci(env, now, sila) {
  const k = env.DB || env; const c = KLJUCI.get(k);
  if (c && !sila && c.do > now) return c.m;
  if (c && sila && now - c.ob < ZNOVA_MS) return c.m;
  let m;
  try {
    const r = await dohvat(env)(JWKS, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw 0;
    const j = await r.json(); m = new Map();
    for (const x of (isObj(j) && Array.isArray(j.keys) ? j.keys : [])) {
      if (isObj(x) && x.kty === 'RSA' && typeof x.kid === 'string' && typeof x.n === 'string' && typeof x.e === 'string' && (x.alg == null || x.alg === 'RS256')) m.set(x.kid, { kty: 'RSA', n: x.n, e: x.e, alg: 'RS256', ext: true });
    }
  } catch (_) { if (c) return c.m; throw new Napaka(503, 'oidc-kljuci'); }
  KLJUCI.set(k, { m, do: now + URA_MS, ob: now });
  return m;
}
const dec = (s) => { const u = unb64u(s); if (!u) throw 0; return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(u)); };

// the token of the request (Authorization: Bearer …) checked: its claims, or 401 oidc (no reason: the job's log shows only the status)
export async function preveriOidc(req, env) {
  if (!env.OIDC_AUD) throw new Napaka(503, 'ni-nastavitve');
  const now = ura(env), a = req.headers.get('Authorization') || '';
  if (a.length > 8192) throw new Napaka(401, 'oidc');
  const m = /^Bearer ([\w-]+)\.([\w-]+)\.([\w-]+)$/.exec(a);
  if (!m) throw new Napaka(401, 'oidc');
  let h, c;
  try { h = dec(m[1]); c = dec(m[2]); } catch (_) { throw new Napaka(401, 'oidc'); }
  if (!isObj(h) || h.alg !== 'RS256' || typeof h.kid !== 'string' || !isObj(c)) throw new Napaka(401, 'oidc');
  let jwk = (await kljuci(env, now, false)).get(h.kid);
  if (!jwk) jwk = (await kljuci(env, now, true)).get(h.kid);
  if (!jwk) throw new Napaka(401, 'oidc');
  let ok = false;
  try { const key = await crypto.subtle.importKey('jwk', jwk, RS, false, ['verify']); ok = await crypto.subtle.verify(RS, key, unb64u(m[3]), enc(m[1] + '.' + m[2])); } catch (_) { ok = false; }
  if (!ok) throw new Napaka(401, 'oidc');
  const t = now / 1000, aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (c.iss !== ISS || !aud.includes(env.OIDC_AUD) || c.repository !== REPO || c.ref !== REF || c.workflow_ref !== WORKFLOW || !DOGODKI.includes(c.event_name)
    || typeof c.exp !== 'number' || c.exp + ZAMIK < t || (c.nbf != null && (typeof c.nbf !== 'number' || c.nbf - ZAMIK > t)) || (typeof c.iat === 'number' && c.iat - ZAMIK > t)) throw new Napaka(401, 'oidc');
  return c;
}
