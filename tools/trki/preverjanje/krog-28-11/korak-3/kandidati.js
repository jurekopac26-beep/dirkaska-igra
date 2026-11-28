'use strict';
// korak 3 (F3, voznja-5), krog 28. 11.: različice retireBlocked (js/core.js) kot zamenjave v pomnilniku za odstop.js in rdeca.js:
//   veja  drevo, kot je (od popravka 28. 11. je to ctr)
//   brez  retireBlocked izklopljen (izločen avto ne zavira za nikomer)
//   ctr   središče drugega avta mora biti pred nosom izločenega (f > dolžina / 2); UVELJAVLJENO 28. 11.
//   gap   kot prej (f > 0), a reza med škatlama mora biti večja od -1 m
//   pas   natančno: del pravokotnika drugega avta leži v pasu pred nosom (širina avta + 0,2 m na stran)
// wrapCC: carCollide javi vsak klic, ki je kateremu od avtov spremenil hitrost ali vrtenje (štetje korakov dotika).
const HEAD = 'function retireBlocked(c, race, v) {';
const body = (inner) => [HEAD, `function retireBlocked(c, race, v) {
    const ch = Math.cos(c.h), sh = Math.sin(c.h);
    for (const o of race.cars) {
      if (o === c || o.inPit) continue;
      const dx = o.x - c.x, dz = o.z - c.z, f = dx * ch + dz * sh;
      ${inner}
    }
    return false;
  }
  function retireBlocked0(c, race, v) {`];
const REST = `const kc = Math.abs(Math.cos(o.h - c.h)), ks = Math.abs(Math.sin(o.h - c.h));
      if (Math.abs(dz * ch - dx * sh) > (c.m.wid + o.m.wid * kc + o.m.len * ks) * 0.5 + 0.2) continue;
      const cl = v - (o.vx * ch + o.vz * sh), g = f - (c.m.len + o.m.len * kc + o.m.wid * ks) * 0.5;`;
exports.VARS = {
  veja: [],
  brez: [[HEAD, 'function retireBlocked(c, race, v) { return false; }\n  function retireBlocked0(c, race, v) {']],
  ctr: [body(`if (f <= c.m.len * 0.5 || f > 150) continue;
      ${REST}
      if (cl > 0 && g < 0.8 + cl * cl / 12) return true;`)],
  gap: [body(`if (f <= 0 || f > 150) continue;
      ${REST}
      if (cl > 0 && g > -1 && g < 0.8 + cl * cl / 12) return true;`)],
  pas: [body(`if (f <= 0 || f > 150) continue;
      ${REST}
      if (!(cl > 0)) continue;
      const a = o.h - c.h, ca = Math.cos(a), sa = Math.sin(a), l = dz * ch - dx * sh, L2 = o.m.len * 0.5, W2 = o.m.wid * 0.5, x0 = c.m.len * 0.5 - 0.3, w = c.m.wid * 0.5 + 0.2;
      let P = [[f + L2 * ca - W2 * sa, l + L2 * sa + W2 * ca], [f - L2 * ca - W2 * sa, l - L2 * sa + W2 * ca], [f - L2 * ca + W2 * sa, l - L2 * sa - W2 * ca], [f + L2 * ca + W2 * sa, l + L2 * sa - W2 * ca]];
      for (const [nx, ny, d] of [[1, 0, x0], [0, 1, -w], [0, -1, -w]]) { const Q = []; for (let i = 0; i < P.length; i++) { const A = P[i], B = P[(i + 1) % P.length], da = A[0] * nx + A[1] * ny - d, db = B[0] * nx + B[1] * ny - d; if (da >= 0) Q.push(A); if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); Q.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); } } P = Q; if (!P.length) break; }
      if (!P.length) continue;
      let mx = 1e9; for (const p of P) if (p[0] < mx) mx = p[0];
      if (mx - c.m.len * 0.5 < 0.8 + cl * cl / 12) return true;`)],
};
exports.wrapCC = ['function carCollide(a, b) {', `function carCollide(a, b) { const g = globalThis.__ev; if (!g) return carCollide0(a, b); const s = [a.vx, a.vz, a.w, b.vx, b.vz, b.w]; const r = carCollide0(a, b); if (a.vx !== s[0] || a.vz !== s[1] || a.w !== s[2] || b.vx !== s[3] || b.vz !== s[4] || b.w !== s[5]) g(a, b, Math.hypot(s[0] - s[3], s[1] - s[4])); return r; }\n  function carCollide0(a, b) {`];
