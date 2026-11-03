// The town's streets of a track as the worlds draw them, for the people's places (tests/ljudje-mesta.test.js): segments [ax, az, bx, bz, hw]
// (hw: the half width with its pavement). From the track's data:
//   def.roads, def.paths: Medvode's [w, gravel, ., ., [x, z, ...]], Longford's [w, [x, z], [x, z] ...] (js/world-medvode.js, js/world-longford.js)
//   def.roads {oval, t6t8, t7, paddock, euc} and def.hwy (Riverside's old roads, the highway's two carriageways: js/world-riverside.js drape)
//   def.bs.st (Bang Saen's streets, encoded as js/world-bangsaen.js bgsDecode reads them: the main ones, class 2-4, with a 2.2 m pavement each
//     side; drawn only out of the track: a point less than 0.6 m past the barrier is the track's own, js/world.js nrNear)
// The other worlds' streets (Trois-Rivières' own data, Montréal's junctions …) the places tool finds in the built world: tools/ljudje/mesta.mjs.
'use strict';
const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function ints(str) {   // zigzag varints, 5 bits a character (bit 5: more follows), as bgsInts
  const out = []; let u = 0, sh = 0;
  for (let k = 0; k < str.length; k++) { const c = A64.indexOf(str[k]); u += (c & 31) * Math.pow(2, sh); sh += 5; if (!(c & 32)) { out.push(u % 2 ? -(u + 1) / 2 : u / 2); u = 0; sh = 0; } }
  return out;
}
// a point past the track's barriers (more than m metres, on its side of the nearest samples): T, the Core track; a hash of its samples
function pastBarrier(T) {
  const C = 32, H = new Map();
  for (let i = 0; i < T.N; i++) { const k = Math.floor(T.px[i] / C) + ',' + Math.floor(T.pz[i] / C); let L = H.get(k); if (!L) H.set(k, L = []); L.push(i); }
  return (x, z, m) => {
    const cx = Math.floor(x / C), cz = Math.floor(z / C);
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const i of H.get((cx + a) + ',' + (cz + b)) || []) {
      const dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], lat = dx * T.nx[i] + dz * T.nz[i], ex = Math.max(0, Math.abs(al) - T.ds), d = Math.hypot(lat, ex);
      if (d - (lat > 0 ? T.br[i] : T.bl[i]) < m) return false;
    }
    return true;
  };
}
function streets(def, T) {
  const segs = [], line = (hw, P) => { for (let k = 0; k + 3 < P.length; k += 2) segs.push([P[k], P[k + 1], P[k + 2], P[k + 3], hw]); };
  const flat = (pts) => [].concat(...pts);
  if (Array.isArray(def.roads) || Array.isArray(def.paths)) for (const r of [].concat(Array.isArray(def.roads) ? def.roads : [], Array.isArray(def.paths) ? def.paths : [])) {
    if (Array.isArray(r[4]) && typeof r[4][0] === 'number') line(r[0] / 2, r[4]); else if (Array.isArray(r[1]) && r[1].length === 2) line(r[0] / 2, flat(r.slice(1))); }
  if (def.roads && !Array.isArray(def.roads)) for (const [k, hw] of [['oval', 4.5], ['t6t8', 4.5], ['t7', 4.5], ['paddock', 3.5], ['euc', 3.2]]) if (def.roads[k]) line(hw, flat(def.roads[k]));
  if (Array.isArray(def.hwy) && !Array.isArray(def.roads)) line(6.2 + 3.7, flat(def.hwy));   // (Riverside: its two carriageways 6.2 m either side, 3.7 m half wide)
  if (def.bs && typeof def.bs.st === 'string' && T) {
    const a = ints(def.bs.st), out = pastBarrier(T); let p = 0;
    for (let n = 0; n < def.bs.ns; n++) {
      const wd = a[p++] / 2, cls = a[p++], m = a[p++], pts = []; let x = 0, z = 0;
      for (let q = 0; q < m; q++) { x += a[p++]; z += a[p++]; pts.push([x / 2, z / 2]); }
      const hw = wd / 2, ext = cls === 2 || cls === 3 || cls === 4 ? hw + 2.2 : hw;
      // every 3 m (as the world draws it), a piece only where its middle and both edges are out of the track
      const Q = []; for (let k = 0; k + 1 < pts.length; k++) { const A = pts[k], B = pts[k + 1], n2 = Math.max(1, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / 3)); for (let q = 0; q < n2; q++) Q.push([A[0] + (B[0] - A[0]) * q / n2, A[1] + (B[1] - A[1]) * q / n2]); }
      if (pts.length) Q.push(pts[pts.length - 1]);
      let prev = null;
      for (let k = 0; k < Q.length; k++) {
        const A = Q[Math.max(0, k - 1)], B = Q[Math.min(Q.length - 1, k + 1)], tl = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, nx = -(B[1] - A[1]) / tl, nz = (B[0] - A[0]) / tl, [qx, qz] = Q[k];
        if (!out(qx, qz, 0.6) || !out(qx + nx * hw, qz + nz * hw, 0.6) || !out(qx - nx * hw, qz - nz * hw, 0.6)) { prev = null; continue; }
        if (prev) segs.push([prev[0], prev[1], qx, qz, ext]); prev = [qx, qz];
      }
    }
  }
  return segs;
}
module.exports = { streets };
