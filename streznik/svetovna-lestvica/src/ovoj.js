// The signed envelope of a request (docs/svetovna-lestvica.md, »Zaščita«; README.md here, »Ovoj«): the body is the packet (JSON, one line),
// a newline, its signature (base64url, ECDSA P-256 with SHA-256 over the packet's bytes, the player's key as the friends' list makes it),
// a newline and, for a run (oddaja), the record (gzip, lv bytes) and the ghost (JSON, ld bytes) right after. The constants and the small
// helpers are js/lestvica.js's own (tests/svet-streznik.test.js checks they stay the same).
export const APP = 'apex-racing', V = 1, DAY = 864e5;
export const KEY_RE = /^[a-z0-9][a-z0-9-]{0,47}@[a-z]{1,8}$/, CAR_RE = /^[a-z0-9][a-z0-9-]{0,23}$/, PUB_RE = /^[\w-]{87}$/, SIG_RE = /^[\w-]{80,100}$/, ID_RE = /^[\w-]{12}$/;
const EC = { name: 'ECDSA', namedCurve: 'P-256' }, SIGN = { name: 'ECDSA', hash: 'SHA-256' };
export const MAX_PAKET = 8192, MAX_PODPIS = 100, MAX_VNOS = 600000, MAX_DUH = 600000;

export const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
export const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
export const posInt = (v) => Number.isInteger(v) && v > 0;
// a nickname as the game keeps a name (js/lestvica.js cleanName): printable, single spaces, at most 16 characters
export const cleanName = (v) => typeof v === 'string' || typeof v === 'number' ? String(v).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16) : '';
export const b64u = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
export function unb64u(s) {
  if (typeof s !== 'string' || !/^[\w-]*$/.test(s) || s.length % 4 === 1) return null;
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u;
}
export const enc = (s) => new TextEncoder().encode(s);
export const sha = async (u8) => b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', u8)));
// a player's id: the first 12 characters of base64url(SHA-256(the public key's bytes)) (js/lestvica.js idOf)
export async function idOf(pub) { const u = unb64u(pub); return u ? (await sha(u)).slice(0, 12) : null; }

// an answer the client gets: { ok: false, napaka } with the HTTP status (extra: more fields, e.g. the seconds to wait)
export class Napaka extends Error { constructor(st, koda, extra) { super(koda); this.st = st; this.koda = koda; this.extra = extra; } }

const TD = new TextDecoder('utf-8', { fatal: true });
// the body, at most max bytes (a longer one stops being read at max)
export async function beri(req, max) {
  const cl = req.headers.get('content-length');
  if (cl != null && !(+cl <= max)) throw new Napaka(413, 'prevelik');
  if (!req.body) return new Uint8Array(0);
  const r = req.body.getReader(), deli = []; let n = 0;
  for (;;) {
    const { done, value } = await r.read(); if (done) break;
    n += value.byteLength; if (n > max) { try { await r.cancel(); } catch (_) { } throw new Napaka(413, 'prevelik'); }
    deli.push(value);
  }
  const u = new Uint8Array(n); let o = 0; for (const d of deli) { u.set(d, o); o += d.byteLength; }
  return u;
}

// a signed request read and checked: { p (the packet), id (the player's id), and for a run: vnos (gzip bytes), duh (the parsed ghost or
// null) }. The packet: { app, kind: 'world', v, req, pub, sent (s, the player's clock: at most a day off the server's) … }
export async function preberi(req, zahtevek, now) {
  const u = await beri(req, zahtevek === 'oddaja' ? MAX_PAKET + MAX_VNOS + MAX_DUH + 200 : MAX_PAKET + 200);
  const i0 = u.indexOf(10); if (i0 < 0 || i0 > MAX_PAKET) throw new Napaka(400, 'ovoj');
  const i1 = u.indexOf(10, i0 + 1); if (i1 < 0 || i1 - i0 - 1 > MAX_PODPIS) throw new Napaka(400, 'ovoj');
  let p, sig;
  try { p = JSON.parse(TD.decode(u.subarray(0, i0))); sig = TD.decode(u.subarray(i0 + 1, i1)); } catch (_) { throw new Napaka(400, 'ovoj'); }
  if (!isObj(p) || p.app !== APP || p.kind !== 'world' || p.v !== V || p.req !== zahtevek || typeof p.pub !== 'string' || !PUB_RE.test(p.pub) || !SIG_RE.test(sig)) throw new Napaka(400, 'ovoj');
  if (!posInt(p.sent) || Math.abs(p.sent * 1000 - now) > DAY) throw new Napaka(400, 'ura');
  let ok = false;
  try { const key = await crypto.subtle.importKey('raw', unb64u(p.pub), EC, false, ['verify']); ok = await crypto.subtle.verify(SIGN, key, unb64u(sig), u.subarray(0, i0)); } catch (_) { ok = false; }
  if (!ok) throw new Napaka(401, 'podpis');
  const id = await idOf(p.pub), rest = u.subarray(i1 + 1);
  if (zahtevek !== 'oddaja') { if (rest.length) throw new Napaka(400, 'ovoj'); return { p, id }; }
  const lv = p.lv, ld = p.ld;
  if (!Number.isInteger(lv) || lv < 2 || lv > MAX_VNOS || !Number.isInteger(ld) || ld < 0 || ld > MAX_DUH || rest.length !== lv + ld) throw new Napaka(400, 'ovoj');
  const vnos = rest.subarray(0, lv), duhB = rest.subarray(lv);
  if (await sha(vnos) !== p.hv || (ld > 0 && await sha(duhB) !== p.hd)) throw new Napaka(400, 'hash');
  if (vnos[0] !== 0x1f || vnos[1] !== 0x8b) throw new Napaka(400, 'ovoj');   // (the record gzipped, as the client sends it; never unpacked here)
  let duh = null;
  if (ld) { try { duh = JSON.parse(TD.decode(duhB)); } catch (_) { throw new Napaka(400, 'duh'); } }
  return { p, id, vnos, duh };
}
