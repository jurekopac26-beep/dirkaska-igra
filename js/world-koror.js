// WORLD — Koror, Palau: the wooded islet beside the causeway and the mangroves in the lagoon's shallows (docs/proge/koror.md, »Laguna«)
// Sources (our own research for this track, no other track's package): OpenStreetMap's coastline (natural=coastline, the closed ring of the
// islet north of the causeway between Koror and Malakal, ~3.2 ha); the Copernicus DEM GLO-30 (its ground, up to 24 m); ESA WorldCover 2021
// (10 m: tree cover and mangrove, class 95) and the global canopy height map of 2020 (10 m, the trees' heights). Drawn: the islet the
// game's sea covered whole (the ground up from the shore, a mud fringe, its forest, its mangrove rim), and in the shallow water within 150 m
// of the road the mangrove stands WorldCover maps (one stand a 10 m cell: its crown low, flat and dark on arching prop roots, the roots only
// near the road). Hooked by wrapping PL_LOOK.koror.extra; loaded after js/world-koror-obcestje.js. Graphics only: the game's ground, the
// sea, the road, its barriers and the driving are untouched; drawn into the scenery chunks (scen.get): no new draw calls, only vertices.
// Not drawn, said in the pull request: the Rock Islands south of Koror (1.1 to 3.3 km from the road, past the 700 m the camera draws); the
// two rings of OSM's coastline that WorldCover maps as water (reef flats, under 0.7 m); a stand where the game's ground is already dry land
// (the shared trees stand there) or within 4 m of the road's barrier.
// Assumed and said so in the pull request: the islet's shore at 0.35 m above the sea, the ground rising to the DEM's over its first 14 m
// inland and falling to 1.8 m under the water over 6 m outside, laid down to the road within ~20 m of it (under its verge within 2 m); a stand's crown from the canopy height (2.5–5 m wide, its top at the height
// the map gives, no lower than 2 m); the colours by eye from the land cover (no picture of the place used).
// Data: © OpenStreetMap contributors, ODbL 1.0; Copernicus DEM © DLR / Airbus (ESA); ESA WorldCover 2021, CC BY 4.0; canopy height
// © ETH Zürich (global canopy height 2020), CC BY 4.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.koror) return;
  const API = World.api, L = API.PL_LOOK.koror;
  const { caGround, clamp, lerp, rpHash, sstep, vrNear } = API;

  // the islet's ring (OSM, x, z in the game's metres: the start line at 0, 0; x east, z south)
  const RING = [-905.4, 636.0, -840.3, 642.8, -826.9, 635.4, -803.8, 613.1, -782.2, 549.5, -791.7, 526.9, -807.4, 488.9, -807.6, 470.8, -841.2, 450.4, -853.3, 446.3, -882.0, 437.7, -914.3, 414.8, -922.0, 417.7, -925.8, 433.9, -942.3, 467.3, -976.5, 505.1, -995.4, 538.9, -999.9, 566.9, -991.9, 577.5, -971.8, 586.3, -942.4, 590.4, -930.3, 589.8, -930.0, 595.4, -936.8, 601.0, -937.1, 606.6, -922.3, 624.3];
  // its ground: the DEM at 20 m (nodes from x0, z0; a byte a node, metres × 4)
  const G = { x0: -1020, z0: 380, nx: 13, nz: 15, b64: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwQEAgAAAAAAAAAAAAgNDgcDAgEAAAAAAAARHCMVCwcDAAAAAAEEHDBAKxkMBQAAAAEECypEWkAoEgcBAAADCxc5UWBMMxgNBQEAAwsWMkhYSDIXDAQAAAIIECM1RjsqFAgBAAAABg4RGCIfGhIIAAAAAAMIBggODw8NBQAAAAAAAAABBAYGBQIAAAAAAAAAAAECAgIAAAAAAAAAAAAAAAAAAAAA' };
  // its canopy: 10 m cells (from x0, z0; a byte a cell, the canopy's metres, + 128 where WorldCover maps mangrove)
  const C = { x0: -1010, z0: 400, nx: 24, nz: 26, b64: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABAgEAAwQBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQIEAwEAAAAAAAAAAAAAAAAAAAMBAQEEAQEEAQMBAAAAAAAAAAAAAAABBQYHBwgIBwUBAAQDAwMBAAAAAAAAAAAFCAgICQkIBwYDAAADAgYCAAAAAAAAAAIJCwoKCwkJBwcFAAACBwUBAAAAAAAAAAUKjQ4ODgsICAgEAAAEBwIAAAAAAAAAA4iJjJCQDwwIBwcEAAAGBQAAAAAAAAAABYeKjpCQDQoIBwcEAAAEAgAAAAAAAAEFh4eMj5GPCwkJCAkFAQABAAABAAAAAAMGiImMkJGNCgoJiAgFBQMAAAAAAAAAAAMEh4qJkZGNDAuIhwYEBwMAAAAAAAAAAAEChoqKjY+NjIqIBgUFBQEAAgEAAAAAAAAChYeIiY6Oi4kJBwUFAwAAAAEAAAAAAAAAgoSIiIiMjIgIBQMDAQAAAAQCAAAAAAAAAICCgoCFiYUGAwMAAAADBAQCAAAAAAAAAAAAgICFiYMAAAAAAAYIBYKAgIAAAAAAAAAAAAABBocEAQAAAwuIgoGAgAAAAAAAAAAAAAAAAQQHAgABBYmEgIAAAAAAAAAAAAAAAAAAAAAAAAAAAQSBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' };
  // the mangrove cells within 150 m of the road (10 m cells of WorldCover's grid from x0, z0, nx a row): the cell's index as an unsigned
  // LEB128 delta from the one before, then its canopy's metres
  const M = { x0: -1430, z0: -170, nx: 160, cell: 10, b64: 'uCAHogEDnwEFnwEJqkYEAQEBAZ4BCAEDAQABAAEAmwEGAQkBBAEAAQCdAQIBAgEAngEAAQDEAgkBB54BCgEJAQcBAwEAmwEGAQgBBwEGAQQBAgEAnAEGAQQBBAEEnQEEAQQBAJ4BAwkBAQEBAQEBAQEBAZIBAQgDAQIBBAEGAQYBBwEGAQUBBAECAQABAAEBAQIBA4oBAAkEAQUBCAEIAQoBCgEIAQcBBQEBAQABBAEFAQWSAQUBBAEFAQsBCgEMAQsBCgEJAQUBBQEFAQcBBwEJkgECAQUBBwELAQoBCwEKAQoBBwEHAQkBCgEKAQsBDAELkQEDAQUBAwEHAQcBBwEHAQcBBwEHAQkBCgELAQwBDAEMAQuRAQUBBwEGAQMBBAEEAQUBBgEIAQkBCgELAQsBDAEMAQoBBpABBgEHAQcBBAEFAQcBBwEGAQcBCQEKAQkBCQEKAQoBCQEGkAEHAQcBCQEGAQgBCgEKAQoBBwEIAQgBCAEIAQkBCQEHAQYBCI8BBwEIAQkBCQELAQoBCwEJAQgBBwEHAQYBBwEHAQcBBAEHAQgBCI8BCQEJAQoBCgEKAQoBBAEEAQUBBQEGAQUBBgEEAQUBBgEHAQgBB40BAgEIAQkBCAEJAQkBBwECAQEBAwEEAQMBBAEGAQUBBgEHAQcBBgEFkAEJAQcBBwEIAQYBAgECAQIBAQEDAQYBBQEHAQcBBgEEAQMBApABBgEJAQgBBgEEAQMBBAEEAQQBBgEHAQYBBQEEAQMBBAEEAQSQAQgBCAEGAQYBBQEFAQMBAwEFAQUBBQEDAQIBAgEDAQMBBJABBAEHAQUBBQEGAQUBBQEFAQQBAwEDAQMBAgECAQMBBAEEAQWPAQABAwEFAQUBBAEFAQYBBAEDAQIBAgECAQEBAQEDAQMBAwEDkAEBAQMBBgEGAQcBBgEDAQIBAQEBAQEBAQEBAQIBAgECAQKRAQABBgEIAQcBBQEEAQMBAQEAAQABAAEAAQABAQEBAQKIAQELBgEFAQQBAwECAQEBAAEAAQABAAEAAQABAAEAAQCGAQABAwECCgQBBQEDAQIBAQEAAQABAAEAAQABAAEAAQABAAEAhQEBAQMBBgEHCwMBAgECAQEBAAEAAQABAAEAAQABAAEAAQABAIQBAgEEAQcBCQEKCwMBAQECAQIBAQEBAQEBAQEAAQABAAEAAQABAAEAggEBAQQBBgEHAQoBCwEJAQYJAwECAQMBAwEAAQEBAAEAAQABAAEAAQABAAEAAQCBAQIBBAEGAQcBCAEIAQgBBAEDCQQBAwEDAQIBAQEAAQABAAEAAQABAAEAAQABAAEAAQCAAQYBBwEIAQkBCAEFAQIBAQEBCgMBAgECAQEBAAEAAQABAAEAAQABAAEAAQABAAEAgQEIAQkBCwELAQYBAgEACwMBBAEDAQEBAAEAAQABAAEAAQABAAEAAQABAAEAAQCBAQoBCwENAQoBAgwEAQUBBAECAQEBAAEAAQABAAEBAQABAAEAAQABAAEAAQCAAQoBCwEMAQgBAQEADQQBAwECAQEBAAEAAQABAAEBAQABAAEAAQABAAEAgAEKAQoBCQEGEAMBAgECAQEBAAEAAQEBAQEBAQEBAAEAAQEBAQEAgAELAQkTAgEBAQEBAAEAAQEBAgEBAQEBAQEBAQEBAYABCgEHEwMBAQEBAQABAAEBAQEBAgEBAQEBAQEBAQGAAQoBBxQCAQEBAQEAAQEBAQEBAQEBAQEAAQEBAQEBgAEHAQMTAwECAQIBAQEBAQEBAQEBAQABAAEAAQABAIABCQEGEwMBBAEDAQIBAQEBAQABAAEAAQABAAEAAQABAIABChMCAQMBAwEDAQIBAQEAAQABAAEAAQABAAEAAQCAAQsBCBMBAQIBBAEEAQIBAQEAAQABAAEAAQABAAEAgQEJFAABAAECAQIBAgEAAQABAAEAAQABAAEAAQCAAQkUCAEFAQABAQECAQIBAAEAAQABAAEAAQABAIEBCAEGFAQBAQEAAQEBAQEAAQABAAEAAQABAIEBCwEKGgABAAEAAQABAAEAgQENBQABAAEAAQATAAEAAQABAAEAggEMBAABAAEAAQABAAEAAQABAAEAAQABAQEBAQwBDQEMCAEBAAEAAQABAIIBDAQCAQABAQEAAQABAAEAAQABAAEBAQIBAAEKAgwBCQcBAQABAAEAAQCCAQwBCQMFAQQBAwEAAQABAAEAAQABAAEAAQEBAAEJAgwBCggCAQEBAAEAgwEKBAcBBAEAAQABAAEAAQABAAEAAQEBAAEIAwsIAwEDAQEBAIMBDAELAQkCBwEDAQABAAEAAQABAAEAAQABAQEBDQMBAgEBAQGCAQ4BDAEKBAEBAAEAAQABAAEAAQABAQ8EAQMBAoIBDQELAQoEAwEAAQABAAEAAQABAQEEEAUBBIEBDgEOAQsBCggAAQABAQEEEAUBBYEBDgEPAQwBDAgAAQABAgECEAQBBYABDQEPAQ8BDQEMAwYFAAECAQQSBYABDQEPAQ8BDAELAQsBCgEImQENAQ4BDQELAQoBCgEJAQuYAQwBDgENAQwBCgEJAQsBDAENAQ4BDpYBDAEOAQwBCwEMAQwBDgEPAQ8BDgEOAQQBAZMBCQELAQwBDAENAQ4BDAENAQ0BDwEPAQwBAwEBkgEHAQkBCgEMAQ4BDwEPAQ0BDAENARABDwEMAQoBCJEBBwEGAQcBCgEMAQ4BEAEPAQ4BDwEPAQ8BDgELAQgBBpABBgEGAQYBBgEIAQoBCwEOAQ0BDQENAQ0BDQELAQkBB5ABBwEGAQUBBgEGAQcBCQEKAQwBCwEMAQsBCgEKAQcBBpABCQEGAQUBBgEGAQYBBwEHAQgBCwEKAQoBCAEHAQYBBZABCwEJAQcBBwEHAQcBBgEHAQYBCQEMAQkBCQEIAQkBBpABDQELAQkBCAEIAQgBBwEIAQYBBwEMAQsBBwEIAQkBB5ABDwEOAQsBCQEIAQcBCAEJAQcBBgEMAQwBCQEHkwEPAQ8BCwEJAQgBBwEHAQkBBgEHAQmWAQ4BDwELAQoBCAEHAQgBCAEGAQSXAQ4BEAEOAQ0BCQEIAQcBBQEEAQWXAQwBDwEPAQ0BCgEIAQUBAwEElwEDAQcBCwENAQsBCQEGAQWbAQgBCgEJAQYBBZwBCQEJnQEJAwigAQk=' };

  const bytes = (s) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const n = RING.length / 2;
  const near = (p) => { const nn = vrNear(p[0], p[2]); return nn.i >= 0 ? nn.dd : 1e9; };   // (beyond the road's barrier)
  // the signed distance to the ring (positive inside)
  const sdist = (x, z) => {
    let inside = false, best = 1e9;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = RING[2 * i], zi = RING[2 * i + 1], xj = RING[2 * j], zj = RING[2 * j + 1];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
      const ex = xj - xi, ez = zj - zi, t = clamp(((x - xi) * ex + (z - zi) * ez) / (ex * ex + ez * ez), 0, 1), d = Math.hypot(x - xi - t * ex, z - zi - t * ez);
      if (d < best) best = d;
    }
    return inside ? best : -best;
  };
  let gB = null, cB = null;
  const demH = (x, z) => {   // the DEM's ground, bilinear
    const fx = clamp((x - G.x0) / 20, 0, G.nx - 1.001), fz = clamp((z - G.z0) / 20, 0, G.nz - 1.001), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const a = gB[j * G.nx + i], b = gB[j * G.nx + i + 1], c = gB[(j + 1) * G.nx + i], d = gB[(j + 1) * G.nx + i + 1];
    return lerp(lerp(a, b, u), lerp(c, d, u), v) / 4;
  };
  const SHORE = 0.35, DEEP = -1.8, RISE = 14, SKIRT = 6;
  let SEA = 0;   // (the sea's level in the world's heights: P.sea, the start line at 0)
  const isleH = (x, z, sd) => SEA + (sd >= 0 ? lerp(SHORE, Math.max(demH(x, z), 1.2), sstep(0, RISE, sd)) : lerp(SHORE, DEEP, sstep(0, SKIRT, -sd)));

  // colours (by eye from the land cover): the wet mud at the waterline, the forest floor, the crowns of the forest and of the mangrove, its roots
  const MUD = [0.34, 0.3, 0.22], MUDW = [0.24, 0.22, 0.17], FLOOR = [0.17, 0.27, 0.11];
  const FOREST = [[0.15, 0.32, 0.11], [0.2, 0.38, 0.13], [0.12, 0.27, 0.1], [0.24, 0.4, 0.16]];
  const MANG = [[0.17, 0.27, 0.11], [0.2, 0.3, 0.12], [0.15, 0.24, 0.1]], ROOT = [0.33, 0.3, 0.25];

  // a low crown: a flattened dome of 7 + 7 points round a top, smooth normals (42 triangles)
  function crown(g, cx, cy, cz, r, ry, col, h) {
    const N = 7, top = [cx, cy + ry, cz], rows = [];
    for (let q = 0; q < 2; q++) {
      const a0 = rpHash(h, q) * 0.9, y = q ? cy - ry * 0.35 : cy + ry * 0.55, rr = r * (q ? 0.92 : 0.72), row = [];
      for (let k = 0; k < N; k++) { const a = a0 + k / N * Math.PI * 2, w = rr * (0.85 + 0.3 * rpHash(h + k, q + 3)); row.push([cx + Math.cos(a) * w, y + (rpHash(h + k, q + 7) - 0.5) * ry * 0.3, cz + Math.sin(a) * w]); }
      rows.push(row);
    }
    const bot = [cx, cy - ry * 0.6, cz], inn = [cx, cy, cz];
    const nrm = (p) => { const x = (p[0] - cx) / r, y = (p[1] - cy) / ry, z = (p[2] - cz) / r, l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
    const lit = (p) => sh(col, 0.78 + 0.32 * clamp((p[1] - cy) / ry * 0.5 + 0.5, 0, 1));
    const T = (a, b, c) => g.triON(a, b, c, nrm(a), nrm(b), nrm(c), inn, lit(a), lit(b), lit(c));
    for (let k = 0; k < N; k++) {
      const k1 = (k + 1) % N, a = rows[0][k], b = rows[0][k1], c = rows[1][k], d = rows[1][k1];
      T(top, a, b); T(a, c, d); T(a, d, b); T(c, bot, d);
    }
  }
  // an arching prop root from the crown's underside down to the mud: two bends, a three-sided stalk
  function root(g, x0, y0, z0, x1, y1, z1, w, col) {
    const P = [[x0, y0, z0], [lerp(x0, x1, 0.55), y0 + 0.25, lerp(z0, z1, 0.55)], [x1, y1, z1]];
    const ring = (p, s) => [0, 1, 2].map(k => { const a = k / 3 * Math.PI * 2; return [p[0] + Math.cos(a) * w * s, p[1], p[2] + Math.sin(a) * w * s]; });
    const R = [ring(P[0], 1), ring(P[1], 0.9), ring(P[2], 0.7)];
    for (let q = 0; q < 2; q++) {
      const inn = [(P[q][0] + P[q + 1][0]) / 2, (P[q][1] + P[q + 1][1]) / 2, (P[q][2] + P[q + 1][2]) / 2];
      for (let k = 0; k < 3; k++) { const k1 = (k + 1) % 3; g.quadO(R[q][k], R[q][k1], R[q + 1][k1], R[q + 1][k], sh(col, 0.85 + 0.15 * k), inn); }
    }
  }

  // the islet's ground, laid down to the road within ~20 m of it (the DEM's hill would stand over the causeway as a wall)
  function isleY(x, z, sd) {
    const y = isleH(x, z, sd), nn = vrNear(x, z);
    return nn.i >= 0 ? Math.min(y, nn.h - 0.8 + 0.5 * Math.max(0, nn.dd - 2)) : y;   // (under the verge within 2 m of the barrier: the game's own ground meets it there)
  }

  // the islet: its ground on a 6 m grid over the ring and the skirt beyond it, where it stands above the game's ground
  function islet(scen) {
    const S = 6, x0 = Math.min(...RING.filter((_, i) => !(i & 1))) - SKIRT - S, x1 = Math.max(...RING.filter((_, i) => !(i & 1))) + SKIRT + S;
    const z0 = Math.min(...RING.filter((_, i) => i & 1)) - SKIRT - S, z1 = Math.max(...RING.filter((_, i) => i & 1)) + SKIRT + S;
    const nx = Math.ceil((x1 - x0) / S) + 1, nz = Math.ceil((z1 - z0) / S) + 1, V = [], D = [], O = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + i * S + (rpHash(i, j) - 0.5) * 1.5, z = z0 + j * S + (rpHash(j, i + 50) - 0.5) * 1.5, sd = sdist(x, z), y = isleY(x, z, sd);
      const nn = vrNear(x, z);
      V.push([x, y, z]); D.push(sd); O.push(y > caGround(x, z) + 0.05 && !(nn.i >= 0 && nn.dd < 1.5));   // (not over the road's verge: the islet's tip meets the causeway)
      const t = sstep(0.5, 9, sd), m = rpHash(i + 9, j + 4);
      V[V.length - 1].c = sd < 0 ? MUDW : sd < 2 ? mix(MUDW, MUD, sd / 2) : mix(sh(MUD, 0.9 + 0.2 * m), sh(FLOOR, 0.85 + 0.3 * m), t);
    }
    for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      if (Math.max(D[a], D[b], D[c], D[d]) < -SKIRT) continue;   // (all of it out in the water)
      if (!(O[a] || O[b] || O[c] || O[d])) continue;             // (under the game's own ground (the causeway's fill) or on the verge)
      const g = scen.get(V[a][0], V[a][2]);
      g.quadUp(V[a], V[b], V[d], V[c], [V[a].c, V[b].c, V[d].c, V[c].c]);
    }
    // its forest: a crown a 10 m cell inside the ring, two where the canopy is tall; the mangrove's along its rim, roots on the mud
    let k = 0;
    for (let j = 0; j < C.nz; j++) for (let i = 0; i < C.nx; i++) {
      const v = cB[j * C.nx + i], h = v & 127, mg = v >= 128, cx = C.x0 + (i + 0.5) * 10, cz = C.z0 + (j + 0.5) * 10;
      const sd = sdist(cx, cz); if (sd < (mg ? -3 : 2) || near([cx, 0, cz]) < 5) continue;
      const tall = Math.max(h, mg ? 3 : 5), many = !mg && tall > 9 ? 2 : 1;
      for (let q = 0; q < many; q++, k++) {
        const x = cx + (rpHash(k, 11) - 0.5) * 7, z = cz + (rpHash(k, 12) - 0.5) * 7, sx = sdist(x, z); if (sx < (mg ? -4 : 1.5)) continue;
        const gy = Math.max(isleY(x, z, sx), caGround(x, z)), top = gy + tall * (0.85 + 0.25 * rpHash(k, 13));
        const g = scen.get(x, z), dn = near([x, 0, z]);
        if (mg) {
          const r = clamp(2.5 + tall * 0.3, 2.5, 5), ry = r * 0.42; if (dn < r + 2.5) continue;   // (no crown over the road)
          const cy = Math.max(top - ry, gy + 1.6 + ry * 0.5);
          crown(g, x, cy, z, r, ry, MANG[k % 3], k);
          if (sx < 4) for (let a = 0; a < 3; a++) { const an = rpHash(k, a + 20) * 6.28, rr = r * 0.75; root(g, x + Math.cos(an) * r * 0.25, cy - ry * 0.4, z + Math.sin(an) * r * 0.25, x + Math.cos(an) * rr, Math.min(gy, SEA + SHORE) - 0.4, z + Math.sin(an) * rr, 0.09, ROOT); }
        } else {
          const r = clamp(2.8 + tall * 0.22, 3, 6.5) * (many > 1 ? 0.8 : 1); if (dn < r + 3) continue;
          const ry = r * (0.55 + 0.15 * rpHash(k, 14)), cy = Math.max(top - ry, gy + ry * 0.6);
          crown(g, x, cy, z, r, ry, sh(FOREST[k % 4], 0.9 + 0.2 * rpHash(k, 15)), k);
          if (sx < 9) root(g, x, gy - 0.2, z, x + 0.1, cy - ry * 0.3, z + 0.1, 0.18, sh(ROOT, 0.8));   // (the trunks show only along the shore)
        }
      }
    }
  }

  // the mangrove stands in the shallow water (where the game's ground lies under the sea) within 150 m of the road
  function stands(scen, excluded) {
    const mb = bytes(M.b64); let p = 0, idx = 0, k = 0;
    while (p < mb.length) {
      let dl = 0, sft = 0, b; do { b = mb[p++]; dl |= (b & 127) << sft; sft += 7; } while (b & 128);
      idx += dl; const h = mb[p++], i = idx % M.nx, j = Math.floor(idx / M.nx); k++;
      const x = M.x0 + (i + 0.5) * 10 + (rpHash(k, 31) - 0.5) * 5, z = M.z0 + (j + 0.5) * 10 + (rpHash(k, 32) - 0.5) * 5;
      const gy = caGround(x, z); if (gy > SEA + 0.4 || sdist(x, z) > -3) continue;   // (dry land: the shared trees stand there; the islet's rim: drawn above)
      const nn = vrNear(x, z), dd = nn.i >= 0 ? nn.dd : 1e9; if (dd < 4 || (excluded && excluded(x, z))) continue;
      const tall = clamp(h, 2.5, 9), r = clamp(2.5 + tall * 0.3, 2.5, 5), ry = r * 0.42, top = SEA + 0.2 + tall * (0.8 + 0.3 * rpHash(k, 33));
      const cy = Math.max(top - ry, SEA + 1.4 + ry * 0.5), g = scen.get(x, z);
      crown(g, x, cy, z, r, ry, sh(MANG[k % 3], 0.92 + 0.16 * rpHash(k, 34)), k + 1000);
      if (dd < 45) for (let a = 0; a < 4; a++) {   // (the prop roots: only where the chase camera sees them)
        const an = (a + rpHash(k, 35)) / 4 * 6.28, rr = r * (0.7 + 0.2 * rpHash(k, a + 40));
        root(g, x + Math.cos(an) * r * 0.2, cy - ry * 0.45, z + Math.sin(an) * r * 0.2, x + Math.cos(an) * rr, SEA - 0.5, z + Math.sin(an) * rr, 0.08, ROOT);
      }
    }
  }

  const extra0 = L.extra;
  L.extra = function (k) {
    if (extra0) extra0.call(this, k);
    if (!gB) { gB = bytes(G.b64); cB = bytes(C.b64); }
    SEA = k.P && k.P.sea != null ? k.P.sea : 0;
    islet(k.scen); stands(k.scen, k.excluded);
  };
})();
