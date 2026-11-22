/* El Jem, Tunisia: OpenStreetMap's side streets beside the route (graphics only). Called from js/world-eljem.js (World.ext.eljemOb).
   What is drawn: the 55 OSM ways within sight of the route (from tools/eljem/eljem.json: the ways that join it up to the end of the road, and the ones beside it
   10-57 m away), each along its own OSM course, as asphalt as wide as its class (OSM has no width, lanes or surface tags here): secondary 7 m (two lanes), its
   one-way carriageways at the junction before the start 4 m (one lane), tertiary 5.5 m, unclassified 5 m, residential 4.5 m. Where a street joins the road its
   corners are rounded (radius ~6.5 m, the acute side longer: docs/igra.md) and the road's edge line is open across the mouth (the centre line stays); no stop
   lines (no source). Left out: the ways that join more than 60 m behind the start (behind the car's camera), the one-way slip that runs beside the road at 17 m
   (it would read as a second lane of the road), footways. A street ends where a house of the map stands on it, at the amphitheatre, and ~58 m from the road.
   The walls along the road stay as they are (the streets pass under them, as on a closed street circuit): the road, its invisible barriers (js/core.js, bl
   and br), the terrain and the driving are untouched (not def.sideRoads, which would make them drivable).
   Data: (c) OpenStreetMap contributors, ODbL 1.0 (README.md, "Zasluge"). */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const API = World.api;
  const { Chunks, clamp, inPoly, lerp, nrGround, nrNear } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // [class, joins the road (its first point on the road's centre line), [x, z, ...]]; class: 0 secondary, 1 tertiary, 2 unclassified, 3 residential,
  // 4 a secondary's one-way carriageway
  const WAYS = [
    [0,1,[650.4,-845.4,668.8,-842.2,679.9,-840.1,696.2,-836.5,713.5,-833.2,747.2,-826.6]], [0,1,[650.4,-845.4,605.6,-856,529.3,-874.9]],
    [4,1,[190.8,-293.8,196.4,-295.4,202.1,-296.5,207.9,-297.1,213.6,-297.1]], [4,1,[193.9,-302.3,213.6,-297.1]],
    [3,1,[411.3,-514.2,409.2,-553.5,409.5,-555.7,410,-557.8,412.9,-576,412.9,-580.7,412.4,-584.9,406.8,-615.5]],
    [3,1,[186.5,-291.8,197.1,-265.6,222.8,-228.9,231.4,-212.6,253.7,-167]],
    [3,1,[538.6,-615.9,534.2,-623.7,533.4,-624.5,532.4,-625,506.8,-631,501.6,-633.1,492.6,-638,480.4,-648.2,472.6,-658.2,466.7,-670.5]],
    [3,1,[478.9,-557.9,492.4,-542.4,499.6,-533.4,528,-491.1]], [3,1,[348.8,-465,358.5,-448.7,365,-438.9,372.4,-427.6,376.3,-422.4,384.7,-412.9,396.1,-400.1]],
    [3,1,[293.3,-422.1,313.1,-386.4,314.7,-381.8,314.6,-379.7,313,-377.2,308.5,-370.9,307.9,-369.1,307.6,-367,308.2,-364.5,324.7,-334.7,325.1,-329]],
    [3,1,[219.5,-334.5,206.1,-357.5,193.1,-381.6,178.9,-413.9]],
    [3,1,[305.6,-433.6,293.8,-453.2,278.2,-475.1,273.6,-476.5,268.6,-476.9,262.1,-478.2,256.1,-479,249.4,-479.2,241.1,-479.5,193.1,-477.2]],
    [3,1,[719.3,-1228.8,786.9,-1217.2,812.8,-1211.9]], [3,1,[683.8,-1047.6,776.5,-1027.5]], [3,1,[665.1,-690.5,683.9,-664.9]], [3,1,[702.7,-1125.6,791.9,-1108]],
    [3,1,[693.5,-1080.2,783.3,-1061.6]], [3,1,[791.9,-1686.9,852.6,-1667.6,921.8,-1646.2]], [3,1,[670.4,-964,704.1,-956.6,734.2,-950.9]], [3,1,[751.2,-1584.6,851.2,-1552]],
    [3,1,[677.7,-1017.3,662.3,-1015,629.6,-1009.2,617.8,-1007.2,598.2,-1002,546,-988.1]], [3,1,[728.8,-1424.7,791.5,-1424,826.4,-1424.7]],
    [3,1,[742.9,-1532.5,703.7,-1519.4,696.3,-1515.4,690.4,-1510.1,685,-1503.3,677.9,-1493.7,649.5,-1456.8]],
    [3,1,[728.2,-1417.5,709.4,-1417.8,700.6,-1420.3,682.4,-1432.5,665.4,-1445.7,649.5,-1456.8]],
    [3,1,[760.8,-1611.8,721.6,-1622.8,711.8,-1624.3,698.3,-1626,694.8,-1625.6,691.3,-1623,675.4,-1598.1,673.4,-1595.9,671.1,-1592.4,669.4,-1587.5,669.4,-1576.3]],
    [3,1,[723.4,-1301.5,534.1,-1413.4]], [3,1,[676.3,-996,740.4,-981.5,766.1,-976.8]], [3,1,[666.7,-930.5,628.9,-933.9,599.4,-936.3,581,-937]],
    [3,1,[775.8,-1648.7,740,-1669.8,727.1,-1673.6,712.7,-1675.6,697.1,-1671.7]], [3,1,[711.2,-1165.1,723.5,-1161.3,741.2,-1156.4,755.6,-1148.9,768.4,-1143.5,798.6,-1138.9]],
    [3,1,[748.7,-1572.5,709,-1576.9,693.1,-1577.7,680.1,-1577.8,669.4,-1576.3,655.2,-1564.6]],
    [3,1,[644.9,-827.8,634.5,-826.8,614.8,-822.7,591.8,-816.1,588.7,-814.6,586.2,-813.2,584.4,-811.2,583.7,-809.4,583.1,-807.7,582.3,-806.1,580.3,-804.3,576.4,-803.1,571.3,-802.4,566.7,-803.3,562.9,-805.6,559.7,-809,547.9,-827.5]],
    [3,1,[770.1,-1635.3,866.5,-1605.4]], [3,1,[704.4,-1133.3,673.7,-1139.1]], [3,1,[725.4,-1366.2,793.3,-1370,797.6,-1370.8,803.1,-1372,808.8,-1373.2]],
    [3,1,[670.4,-706.4,686.1,-700.5,721.1,-677.5,730.5,-675.8]], [0,0,[34.2,-430.2,151.6,-326.1]], [0,0,[213.6,-297.1,320.2,-281.8]],
    [4,0,[182.7,-309.2,178.1,-311.1,162,-320.6,151.6,-326.1]], [4,0,[151.6,-326.1,157.4,-319.4,163.4,-312.9,169.6,-306.7,176.2,-300.8]],
    [2,0,[66.4,-241.7,98.7,-257.6,136.5,-276.2,154.2,-284.9,164.9,-291,176.6,-298]],
    [3,0,[624.5,-596.2,617.7,-591.2,605.9,-582.8,592.6,-573.8,587.8,-569.9,583.8,-566.2,580.9,-563,574.7,-555.5,571.7,-551.2,568.6,-544.7,566.4,-540.5,564.2,-534.2]],
    [3,0,[506.8,-631,502.2,-627.1,501.5,-626.6,500.4,-626,499.7,-625.7,498.7,-625.4,492.5,-624.9,484.8,-624,455.4,-618.9,448.2,-617.6,435.4,-615.4,431.4,-615,427.7,-615,406.8,-615.5]],
    [3,0,[289.2,-528.4,287.4,-517.4,286,-510.7,284.7,-499.9,283.7,-494.8,282.4,-492.9,280.3,-490.9,279.1,-488.1,279.1,-483.8,278.9,-480.4,278.2,-475.1]],
    [3,0,[570.6,-1086.3,622.7,-1113.9,673.7,-1139.1]], [3,0,[676.8,-1760.2,797.4,-1698.8]], [3,0,[617.8,-1007.2,628.9,-933.9]], [3,0,[677.9,-603,694.1,-568.3]],
    [3,0,[721.9,-887.1,712.7,-891.9,705.6,-897.9,697.8,-900.6,694.6,-904.9,704.1,-956.6]], [3,0,[633.9,-580.7,677.9,-603,695.2,-612.7,712.1,-623,733.4,-637.8]],
    [3,0,[679.9,-840.1,701,-865.2,709.7,-874.7,721.9,-887.1,790.9,-923]], [3,0,[673.7,-1139.1,462.3,-1264]],
    [3,0,[178.9,-413.9,194.7,-421.5,202.5,-425.8,212.6,-430.5,221.4,-434,230.3,-436.4]], [3,0,[626.1,-1018.9,632.4,-1061.2]],
    [3,0,[629.6,-1009.2,626.1,-1018.9,617,-1030.1,604.6,-1033.7,580,-1028.1]]
  ];
  const HW = [3.5, 2.75, 2.5, 2.25, 2.0];   // (half widths by class: OSM has no width or lanes here)
  const DY = 0.035, LIFT = 0.03, OVER = 0.07, APRON = 0.45, R0 = 6.5, FAR = 58, BEND = 4, F = [-1, -0.5, 0, 0.5, 1];
  const DUST = [0.86, 0.78, 0.64], VG = [0.92, 0.82, 0.68];
  let ST = null;   // (one build's state: { inFort, runs, fans, prc: the verge profiles per row and side, vergeRow })

  function line(p, step) {   // an OSM polyline resampled every `step` m and smoothed a little (the ends stay put): [{x, z, s}]
    const seg = [];
    for (let k = 0; k + 3 < p.length; k += 2) { const l = Math.hypot(p[k + 2] - p[k], p[k + 3] - p[k + 1]); if (l > 0.05) seg.push([p[k], p[k + 1], p[k + 2], p[k + 3], l]); }
    if (!seg.length) return [];
    const tot = seg.reduce((a, q) => a + q[4], 0), raw = [];
    for (let s = 0, j = 0, s0 = 0; s <= tot + 1e-6; s += step) {
      while (j < seg.length - 1 && s > s0 + seg[j][4]) { s0 += seg[j][4]; j++; }
      const q = seg[j], f = clamp((s - s0) / q[4], 0, 1); raw.push([lerp(q[0], q[2], f), lerp(q[1], q[3], f), s]);
    }
    if (tot - raw[raw.length - 1][2] > 0.3) { const q = seg[seg.length - 1]; raw.push([q[2], q[3], tot]); }
    return raw.map((q, i) => { const w = Math.min(2, i, raw.length - 1 - i); let x = 0, z = 0;
      for (let j = i - w; j <= i + w; j++) { x += raw[j][0]; z += raw[j][1]; }
      return { x: x / (2 * w + 1), z: z / (2 * w + 1), s: q[2] }; });
  }
  function info(q, side) {   // the road's row, the offset on the street's side, the road's half width and the barrier there
    const v = nrNear(q.x, q.z), i = v.i;
    q.i = i; q.lat = v.lat;
    if (side) { if (i >= 0) { q.o = v.lat * side; q.w = T.wAt(i); q.bar = side > 0 ? T.br[i] : T.bl[i]; } else { q.o = 1e9; q.w = 5; q.bar = 0; } }
    return q;
  }
  function prof(i, side) {   // the cross profile beside row i on one side: the asphalt's edge, then the verge (js/world-eljem.js, vergeRow) out to the terrain
    const M = ST.prc[side > 0 ? 1 : 0]; let a = M.get(i); if (a) return a;
    const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i];
    a = { y: T.hy[i], w, bar, end: bar + 3.2, p: [[0, 0.02], [w, 0.02], [w + 0.001, 0]].concat(ST.vergeRow(i, side).slice(1)) };
    M.set(i, a); return a;
  }
  const at = (p, o) => { if (o <= p[0][0]) return p[0][1]; for (let k = 1; k < p.length; k++) if (o <= p[k][0]) { const [o0, y0] = p[k - 1], [o1, y1] = p[k]; return o1 > o0 ? y0 + (y1 - y0) * (o - o0) / (o1 - o0) : y1; } return p[p.length - 1][1]; };
  const top = (p, a, b) => { let y = Math.max(at(p, a), at(p, b)); for (const [o, h] of p) if (o > a && o < b) y = Math.max(y, h); return y; };
  const SU = { y: 0, o: 0, ob: 0, yb: 0, hn: 0, w: 5 };
  function surf(x, z, side, ex) {   // what lies under (x, z): the road, its verge or the terrain (ex: exactly there, else the highest within 0.6 m across)
    const v = nrNear(x, z), i = v.i;
    if (i < 0) { SU.y = nrGround(x, z); SU.o = 99; SU.ob = 0; SU.w = 5; return SU; }
    const hn = v.hn, N = T.N, al = (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i], f = clamp(i + al / T.ds, 0, N - 1), i0 = Math.min(N - 2, Math.floor(f)), u = f - i0;
    let y = 0, o = 0, ob = 0, yb = 0, w = 0, g = null;
    for (let k = 0; k < 2; k++) {
      const j = i0 + k, wt = k ? u : 1 - u, pr = prof(j, side), oj = ((x - T.px[j]) * T.nx[j] + (z - T.pz[j]) * T.nz[j]) * side;
      y += wt * (oj >= pr.end ? (g === null ? (g = nrGround(x, z)) : g) : pr.y + (ex ? at(pr.p, oj) : top(pr.p, oj - 0.6, oj + 0.6)));
      o += wt * oj; ob += wt * pr.end; yb += wt * (pr.y + pr.p[pr.p.length - 1][1] - 0.03); w += wt * pr.w;
    }
    SU.y = y; SU.o = o; SU.ob = ob; SU.yb = yb; SU.hn = hn; SU.w = w; return SU;
  }
  function height(x, z, side, c, edge) {   // the street's surface: on the road's edge just above its asphalt, then a straight ramp over the verge, then on the ground
    const s = surf(x, z, side);
    if (edge) return s.hn + DY;
    if (s.o >= s.ob) return s.y + OVER + 0.03 * c;
    const t = clamp((s.o - s.w) / (s.ob - s.w), 0, 1), lin = s.hn + DY + (s.yb + OVER - s.hn - DY) * t;
    return Math.max(lin, s.y + LIFT) + 0.03 * c * clamp((s.o - s.w) / 2, 0, 1);
  }
  const ground = (x, z, side) => { const s = surf(x, z, side, true); return s.o < s.w ? s.hn + 0.02 : s.y; };
  const onRoad = (x, z, side, m) => {   // a point on the road's asphalt moves to 0.15 m inside its edge (the street's edge there, just above it)
    const v = nrNear(x, z);
    if (v.i >= 0) { const i = v.i, w = T.wAt(i), o = v.lat * side; if (o < w + m) { const d = w - 0.15 - o; return [x + T.nx[i] * side * d, z + T.nz[i] * side * d, true]; } }
    return [x, z, false];
  };
  const bend = (x, z, side, L) => {   // the mouth's straight road edge (through B, along the road there) onto the road's real, curving edge where it lies outside it; fades out BEND m from it
    if (!L) return [x, z];
    const ll = (x - L[0]) * L[2] + (z - L[1]) * L[3], g = clamp(1 - ll / BEND, 0, 1), v = g > 0 ? nrNear(x, z) : null;
    if (!v || v.i < 0) return [x, z];
    const e0 = v.lat * side - T.wAt(v.i), d = (e0 - ll) * g;   // (e0: past the real edge; a point far from it belongs to no mouth)
    if (e0 > BEND + 3) return [x, z];
    return d > 0.005 ? [x - T.nx[v.i] * side * d, z - T.nz[v.i] * side * d] : [x, z];
  };
  function sections(S, side, dy, L) {   // S: a run's samples [{x, z, hw, s}] -> the cross sections, 5 points each
    const n = S.length, out = [];
    for (let k = 0; k < n; k++) {
      const q = S[k], a = S[Math.max(0, k - 1)], b = S[Math.min(n - 1, k + 1)];
      let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      const P = [], E = [];
      for (let j = 0; j < 5; j++) {
        const [x, z, e] = onRoad(...bend(q.x - tz * F[j] * q.hw, q.z + tx * F[j] * q.hw, side, L), side, 0);
        P.push([x, height(x, z, side, 1 - F[j] * F[j], e) + dy, z]); E.push(e);
      }
      out.push({ P, E, tx, tz, s: q.s });
    }
    crease(out, side); return out;
  }
  function crease(sec, side) {   // where the verge or the ground pokes through a quad, its outer points rise (not those on the road's edge)
    for (let k = 0; k < sec.length - 1; k++) { const A = sec[k], B = sec[k + 1], M = A.P.length;
      for (let j = 0; j < M - 1; j++) {
        const Q = [A.P[j], A.P[j + 1], B.P[j + 1], B.P[j]], QE = [A.E[j], A.E[j + 1], B.E[j + 1], B.E[j]];
        if (QE[0] && QE[1] && QE[2] && QE[3]) continue;
        let ex = 0;
        for (const [a, b, c] of [[0, 1, 2], [0, 2, 3]]) for (let u = 0; u <= 4; u++) for (let v = 0; u + v <= 4; v++) {
          const w1 = u / 4, w2 = v / 4, w0 = 1 - w1 - w2; if (w0 === 1 || w1 === 1 || w2 === 1) continue;
          const x = Q[a][0] * w0 + Q[b][0] * w1 + Q[c][0] * w2, z = Q[a][2] * w0 + Q[b][2] * w1 + Q[c][2] * w2, s = surf(x, z, side, true);
          if (s.o >= s.w + 0.3) ex = Math.max(ex, s.y + 0.03 - (Q[a][1] * w0 + Q[b][1] * w1 + Q[c][1] * w2));
        }
        if (ex > 0) for (let m = 0; m < 4; m++) if (!QE[m]) Q[m][1] += ex;
      } }
  }

  /* ---- 1. before the road's lines (js/world-eljem.js): the streets' courses, their rounded mouths, and where the edge line opens (GAP[i]: the segment from row
     i-1 to row i; bit 1 the side -1, bit 2 the side +1) ---- */
  function mouths(o) {
    ST = { inFort: o.inFort, runs: [], fans: [], prc: [new Map(), new Map()], vergeRow: null };
    const N = T.N, GAP = new Uint8Array(N);
    const fOf = (x, z) => { const v = nrNear(x, z), i = v.i; return i < 0 ? -1 : i + ((x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i]) / T.ds; };
    WAYS.forEach(([c, joins, p], b) => {
      const hw = HW[c], pts = line(p, 1.25), n = pts.length;
      if (n < 3) return;
      const tot = pts[n - 1].s;
      for (const q of pts) info(q, 0);
      let side = 0;   // (the side of the road the street lies on: from its far end)
      for (let k = n - 1; k >= 0 && !side; k--) { const q = pts[k]; if (q.i >= 0 && Math.abs(q.lat) > T.wAt(q.i) + 0.5) side = Math.sign(q.lat); }
      if (!side) return;
      for (const q of pts) info(q, side);
      let s0 = 0, sE = -1e9, sk = [-1e9, -1e9], LN = null;
      if (joins) {
        let kE = -1;
        for (let k = 1; k < n; k++) if (pts[k].i >= 0 && pts[k].o >= pts[k].w) { kE = k; break; }
        if (kE < 0) return;
        const P0 = pts[kE - 1], P1 = pts[kE], g0 = P0.o - P0.w, g1 = P1.o - P1.w, t = g1 > g0 ? clamp(-g0 / (g1 - g0), 0, 1) : 1;
        const Ax = lerp(P0.x, P1.x, t), Az = lerp(P0.z, P1.z, t), Q = pts[Math.min(n - 1, kE + 2)];
        sE = lerp(P0.s, P1.s, t);
        let ax = Q.x - P0.x, az = Q.z - P0.z; { const l = Math.hypot(ax, az) || 1; ax /= l; az /= l; }
        const v = nrNear(Ax, Az), i = v.i;
        if (i < 0) return;
        const rx = T.tx[i], rz = T.tz[i], al = (Ax - T.px[i]) * rx + (Az - T.pz[i]) * rz, w = T.wAt(i);
        const Bx = T.px[i] + al * rx + side * w * T.nx[i], Bz = T.pz[i] + al * rz + side * w * T.nz[i];
        LN = [Bx, Bz, side * T.nx[i], side * T.nz[i]];
        const nsx = -az, nsz = ax, cr = ax * rz - az * rx, ends = [], us = [];
        for (const j of [-1, 1]) {
          const ex = Ax + j * hw * nsx, ez = Az + j * hw * nsz;
          if (Math.abs(cr) < 0.15) { ends.push([ex, ez]); us.push(0); continue; }   // (nearly along the road: no rounded corners)
          const u = -((ex - Bx) * rz - (ez - Bz) * rx) / cr, Ox = ex + u * ax, Oz = ez + u * az;   // (the corner: the street's edge meets the road's)
          const sg = Math.sign(j * (rx * nsx + rz * nsz)) || 1, drx = sg * rx, drz = sg * rz, phi = Math.acos(clamp(ax * drx + az * drz, -1, 1));
          let R = phi < Math.PI / 4 ? R0 * Math.tan(phi / 2) / Math.tan(Math.PI / 8) : R0, Lt = R / Math.tan(phi / 2);
          const lim = Math.max(2, 0.6 * (tot - sE - u));
          if (Lt > lim) { Lt = lim; R = Lt * Math.tan(phi / 2); }
          const Tsx = Ox + Lt * ax, Tsz = Oz + Lt * az, Trx = Ox + Lt * drx, Trz = Oz + Lt * drz, Ccx = Tsx + R * j * nsx, Ccz = Tsz + R * j * nsz;
          const ts = Math.atan2(Tsz - Ccz, Tsx - Ccx); let dl = Math.atan2(Trz - Ccz, Trx - Ccx) - ts;
          while (dl > Math.PI) dl -= 2 * Math.PI;
          while (dl <= -Math.PI) dl += 2 * Math.PI;
          const m = Math.max(2, Math.ceil(Math.abs(dl) / (Math.PI / 10))), arc = [];
          for (let q = 0; q <= m; q++) { const th = ts + dl * q / m; arc.push([Ccx + R * Math.cos(th), Ccz + R * Math.sin(th)]); }
          ST.fans.push({ b, side, hw, O: [Ox, Oz], arc, Cc: [Ccx, Ccz], poly: [[Ox, Oz]].concat(arc), dy: (b % 5) * 0.002, L: LN });
          sk[j < 0 ? 0 : 1] = sE + u + Lt; ends.push([Trx, Trz]); us.push(u);
        }
        const fs = ends.map(([x, z]) => fOf(x, z)).filter((f) => f >= 0);
        if (fs.length) { const f0 = Math.min(...fs), f1 = Math.max(...fs); for (let k = Math.max(1, Math.ceil(f0) + 1); k <= Math.min(N - 1, Math.floor(f1)); k++) GAP[k] |= side > 0 ? 2 : 1; }   // (only rows within the mouth: past its corners the verge's edge would show)
        s0 = Math.max(0, sE + Math.min(...us) - 0.3);
      }
      // the body: from the mouth (or the way's start) on, every 1.25 m near the road, then every 2.5 m
      let k0 = pts.findIndex((q) => q.s >= s0);
      if (k0 < 0) return;
      const src = [];
      if (k0 > 0 && pts[k0].s > s0 + 0.01) { const a2 = pts[k0 - 1], b2 = pts[k0], f = (s0 - a2.s) / (b2.s - a2.s); src.push(info({ x: lerp(a2.x, b2.x, f), z: lerp(a2.z, b2.z, f), s: s0 }, side)); }
      for (let k = k0; k < n; k++) { const q = pts[k], near = joins ? q.s <= sE + 25 : false; if (near || (k - k0) % 2 === 0 || k === n - 1) src.push(q); }
      const dyb = (b % 5) * 0.002;
      let cur = [], out = false, piece = 0;
      const flush = () => {
        if (cur.length >= 3) ST.runs.push({ b, side, hw, joins: !!joins, S: cur, cap0: !(joins && piece === 0), cap1: true, skirtFrom: joins && piece === 0 ? sk : [-1e9, -1e9], dy: dyb, L: LN });
        cur = []; piece++;
      };
      for (const q of src) {
        q.hw = hw;
        const gone = q.i < 0 || q.o > FAR || ST.inFort(q.x, q.z, 4);
        if (joins) {
          if (q.o > q.bar + hw + 0.3) out = true;
          if (gone || (out && q.o < q.bar + hw + 0.3)) break;
          cur.push(q);
        } else if (gone || q.o < q.bar + hw + 0.3) flush();
        else cur.push(q);
      }
      flush();
    });
    return GAP;
  }

  /* ---- 2. after the houses: a street ends (or, beside the road, breaks) where a house of the map stands on it; the trees and the rest keep off it ---- */
  function place(o) {
    if (!ST) return;
    ST.vergeRow = o.vergeRow;
    const blds = o.blds || [];
    const house = (x, z, m) => { for (const h of blds) { const dx = x - h.x, dz = z - h.z, c = Math.cos(h.ang), s = Math.sin(h.ang); if (Math.abs(dx * c + dz * s) < h.L / 2 + m && Math.abs(dz * c - dx * s) < h.W / 2 + m) return true; } return false; };
    const runs = [];
    for (const r of ST.runs) {
      let cur = [], first = true;
      const flush = () => { if (cur.length >= 3) runs.push(Object.assign({}, r, first ? { S: cur } : { S: cur, cap0: true, skirtFrom: [-1e9, -1e9] })); cur = []; };
      for (const q of r.S) {
        if (q.o > q.bar + 1 && house(q.x, q.z, 0.8 * r.hw)) { if (r.joins) break; flush(); first = false; continue; }
        cur.push(q);
      }
      flush();
    }
    ST.runs = runs;
    const has = new Set(runs.map((r) => r.b));
    ST.fans = ST.fans.filter((f) => has.has(f.b));
    for (const r of runs) {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (const q of r.S) { o.exclPush(q.x, q.z, r.hw + 1); x0 = Math.min(x0, q.x); z0 = Math.min(z0, q.z); x1 = Math.max(x1, q.x); z1 = Math.max(z1, q.z); }
      r.bb = [x0 - r.hw, z0 - r.hw, x1 + r.hw, z1 + r.hw];
    }
  }
  function clear(S, x, z) { let best = 1e9; for (let k = 0; k < S.length - 1; k++) { const a = S[k], b = S[k + 1], dx = b.x - a.x, dz = b.z - a.z, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1); best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t) - lerp(a.hw, b.hw, t)); } return best; }
  const on = (x, z, m) => {   // (x, z) on a street or within m of it (the spectators keep off)
    if (!ST) return false;
    for (const r of ST.runs) if (r.bb && x > r.bb[0] - m && z > r.bb[1] - m && x < r.bb[2] + m && z < r.bb[3] + m && clear(r.S, x, z) < m) return true;
    for (const f of ST.fans) if (inPoly(f.poly, x, z)) return true;
    return false;
  };

  /* ---- 3. before the terrain's colours are dropped (js/world-eljem.js): the asphalt (in 1 km chunks) and its edges down to the ground ---- */
  function draw(o) {
    if (!ST || (!ST.runs.length && !ST.fans.length)) return;
    const sMat = o.aMat.clone(); sMat.polygonOffset = true; sMat.polygonOffsetFactor = -2; sMat.polygonOffsetUnits = -4;
    const CA = new Chunks(1024, true), CG = new Chunks(1024, true);
    const kAt = (x, z) => 0.80 + 0.03 * Math.sin(x / 23 + z / 31) * Math.cos(z / 17 - x / 29);   // (by position: where streets overlap they match)
    const col = (p, edge) => { const k = kAt(p[0], p[2]), c = [k, k, 1.02 * k]; if (edge) for (let m = 0; m < 3; m++) c[m] = lerp(c[m], DUST[m] * k, 0.25); return c; };
    const UA = (p) => [p[0] / 8, p[2] / 8], UG = (p) => [p[0] / 14, -p[2] / 14];
    const gcol = (p, side, f) => { const v = nrNear(p[0], p[2]); let c = null; if (v.i >= 0 && v.lat * side < (side > 0 ? T.br[v.i] : T.bl[v.i]) + 0.8) c = VG; else c = API.nrGCol(p[0], p[2]); return [c[0] * f, c[1] * f, c[2] * f]; };
    const apron = (p, ox, oz, side) => { const x = p[0] + ox * APRON, z = p[2] + oz * APRON; return [x, ground(x, z, side) - 0.06, z]; };
    const skirt = (P, Q, ox, oz, side) => {   // the street's side from its edge P-Q down to the ground just outside it
      const a = apron(P, ox, oz, side), b = apron(Q, ox, oz, side), g = CG.get((P[0] + Q[0]) / 2, (P[2] + Q[2]) / 2);
      g.quadUp(a, P, Q, b, [gcol(a, side, 1), gcol(P, side, 0.92), gcol(Q, side, 0.92), gcol(b, side, 1)], [UG(a), UG(P), UG(Q), UG(b)]);
    };
    for (const r of ST.runs) {
      const sec = sections(r.S, r.side, r.dy, r.L), n = sec.length;
      for (const A of sec) A.C = A.P.map((p, j) => col(p, j === 0 || j === 4));
      for (let k = 0; k < n - 1; k++) {
        const A = sec[k], B = sec[k + 1], g = CA.get((A.P[2][0] + B.P[2][0]) / 2, (A.P[2][2] + B.P[2][2]) / 2);
        for (let j = 0; j < 4; j++) {
          if (A.E[j] && A.E[j + 1] && B.E[j + 1] && B.E[j]) continue;
          g.quadUp(A.P[j], A.P[j + 1], B.P[j + 1], B.P[j], [A.C[j], A.C[j + 1], B.C[j + 1], B.C[j]], [UA(A.P[j]), UA(A.P[j + 1]), UA(B.P[j + 1]), UA(B.P[j])]);
        }
        for (const [j, sg, e] of [[0, -1, 0], [4, 1, 1]]) {
          if ((A.E[j] && B.E[j]) || A.s < r.skirtFrom[e]) continue;
          skirt(A.P[j], B.P[j], -(A.tz + B.tz) / 2 * sg, (A.tx + B.tx) / 2 * sg, r.side);
        }
      }
      for (const [Z, d] of [[sec[n - 1], 1], [sec[0], -1]]) {   // (the ends: the outer one, and the inner one of a piece beside the road)
        if (d > 0 ? !r.cap1 : !r.cap0) continue;
        for (let j = 0; j < 4; j++) if (!(Z.E[j] && Z.E[j + 1])) skirt(Z.P[j], Z.P[j + 1], Z.tx * d, Z.tz * d, r.side);
      }
    }
    for (const f of ST.fans) {   // the rounded corners: rays from the corner (moved onto the road's edge) to the arc
      const [Ox, Oz] = f.O, sec = [];
      for (const [x1, z1] of f.arc) {
        const P = [], E = [];
        for (const t of [0, 1 / 3, 2 / 3, 1]) { const [x, z, e] = onRoad(...bend(lerp(Ox, x1, t), lerp(Oz, z1, t), f.side, f.L), f.side, 0.02); P.push([x, height(x, z, f.side, 0, e) + f.dy, z]); E.push(e); }
        sec.push({ P, E });
      }
      crease(sec, f.side);
      for (let k = 0; k < sec.length - 1; k++) {
        const A = sec[k], B = sec[k + 1], g = CA.get(A.P[3][0], A.P[3][2]);
        for (let j = 0; j < 3; j++) {
          if (A.E[j] && A.E[j + 1] && B.E[j + 1] && B.E[j]) continue;
          g.quadUp(A.P[j], A.P[j + 1], B.P[j + 1], B.P[j], [col(A.P[j], j === 3), col(A.P[j + 1], j + 1 === 3), col(B.P[j + 1], j + 1 === 3), col(B.P[j], j === 3)], [UA(A.P[j]), UA(A.P[j + 1]), UA(B.P[j + 1]), UA(B.P[j])]);
        }
        if (!(A.E[3] && B.E[3])) {
          const mx = (A.P[3][0] + B.P[3][0]) / 2, mz = (A.P[3][2] + B.P[3][2]) / 2, dx = f.Cc[0] - mx, dz = f.Cc[1] - mz, l = Math.hypot(dx, dz) || 1;
          skirt(A.P[3], B.P[3], dx / l, dz / l, f.side);
        }
      }
    }
    CA.addTo(o.root, sMat, false, true); CG.addTo(o.root, o.gMat, false, true);
  }

  World.ext.eljemOb = { mouths, place, on, draw };
})();
