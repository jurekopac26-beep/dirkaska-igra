// The globe in the header (mockup): the Earth from its texture (assets/geo/earth.webp, mk/earth2k.webp), lit from the upper left (a soft terminator, the
// sun's glint on the sea), thin clouds drifting (none over the track's country), an atmosphere round its edge; the country in gold with a
// glow, a pulsing pin where the track is. On the live page it turns from the last track's country to this one's (GLOBE.travel).
window.GLOBE = (() => {
  const D = Math.PI / 180, TW = 2048, TH = 1024;
  let tex = null;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177); h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = x - xi, v = y - yi, w = z - zi, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v), sw = w * w * (3 - 2 * w);
    const l = (a, b, t) => a + (b - a) * t, c = (i, j, k) => h3(xi + i, yi + j, zi + k);
    return l(l(l(c(0, 0, 0), c(1, 0, 0), su), l(c(0, 1, 0), c(1, 1, 0), su), sv), l(l(c(0, 0, 1), c(1, 0, 1), su), l(c(0, 1, 1), c(1, 1, 1), su), sv), sw);
  }
  const fbm = (x, y, z) => noise3(x, y, z) * 0.55 + noise3(x * 2.1, y * 2.1, z * 2.1) * 0.3 + noise3(x * 4.3, y * 4.3, z * 4.3) * 0.15;
  async function load() {
    if (tex) return;
    const img = new Image(); img.src = 'maketa-menija/izbira-proge/mk/earth2k.webp'; await img.decode();   // (assets/geo/earth.webp at half size: quicker to open)
    const c = document.createElement('canvas'); c.width = TW; c.height = TH; const g = c.getContext('2d'); g.drawImage(img, 0, 0, TW, TH); tex = g.getImageData(0, 0, TW, TH).data;
  }
  function sample(lam, phi, o) {   // the texture at (longitude, latitude) in radians, bilinear
    const fx = ((lam / D + 180) / 360 % 1 + 1) % 1 * TW - 0.5, fy = Math.min(TH - 1.001, Math.max(0, (90 - phi / D) / 180 * TH - 0.5));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0, xa = (x0 + TW) % TW, xb = (x0 + 1) % TW;
    for (let k = 0; k < 3; k++) {
      const p = tex[(y0 * TW + xa) * 4 + k], q = tex[(y0 * TW + xb) * 4 + k], r = tex[((y0 + 1) * TW + xa) * 4 + k], s = tex[((y0 + 1) * TW + xb) * 4 + k];
      o[k] = (p * (1 - ax) + q * ax) * (1 - ay) + (r * (1 - ax) + s * ax) * ay;
    }
    return o;
  }
  const vec = (lat, lon) => [Math.cos(lat * D) * Math.cos(lon * D), Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D)];
  const ll = (v) => [Math.asin(Math.max(-1, Math.min(1, v[2]))) / D, Math.atan2(v[1], v[0]) / D];

  let G = null;
  async function attach(cv, T, o = {}) {
    await load();
    const dp = Math.min(2, window.devicePixelRatio || 2), css = o.css || 52, S = Math.round(css * dp * 1.25);
    cv.width = S; cv.height = S;
    { const big = css / 0.86, m = -(big - css) / 2; Object.assign(cv.style, { width: big + 'px', height: big + 'px', margin: m + 'px', overflow: 'visible' }); }   // (the sphere as big as the slot, its atmosphere round it)
    const off = document.createElement('canvas'); off.width = S; off.height = S;
    const view = (lat, lon) => [Math.max(-60, Math.min(60, lat - 8)), lon];   // the country a little above the middle: more of the globe shows
    G = { cv, x: cv.getContext('2d'), off, ox: off.getContext('2d'), S, T, img: off.getContext('2d').createImageData(S, S), cen: view(T.lat, T.lon), from: null, t0: 0, dur: 1.5, view };
    G.home = vec(T.lat, T.lon);
    frame(o.t != null ? o.t : 10);
    return G;
  }
  // turn from another place to this one (great circle, eased)
  function travel(from, t0) { if (!G || !from) return; G.from = G.view(from[0], from[1]); G.t0 = t0; }

  function sphere(t, cen) {
    const { S, img } = G, d = img.data, r = S / 2 * 0.86, lat0 = cen[0] * D, lon0 = cen[1] * D, sp = Math.sin(lat0), cp = Math.cos(lat0), c = [0, 0, 0];
    const L = [-0.5, 0.52, 0.69], Hh = [L[0], L[1], L[2] + 1], hn = Math.hypot(...Hh); for (let k = 0; k < 3; k++) Hh[k] /= hn;
    const drift = t * 0.012, home = G.home;
    d.fill(0);
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
      const u = (px + 0.5 - S / 2) / r, v = -(py + 0.5 - S / 2) / r, rr = u * u + v * v; if (rr > 1.0) continue;
      const z = Math.sqrt(1 - rr), phi = Math.asin(z * sp + v * cp), lam = lon0 + Math.atan2(u, z * cp - v * sp);
      sample(lam, phi, c);
      let R = c[0], Gc = c[1], B = c[2];
      const nl = u * L[0] + v * L[1] + z * L[2], lit = 0.16 + 0.95 * smooth(-0.25, 0.65, nl);
      const sea = B > R + 10 && B >= Gc - 6 && R < 120;
      // the clouds: thin, drifting west to east, none round the track's country
      const wx = Math.cos(phi) * Math.cos(lam - drift), wy = Math.cos(phi) * Math.sin(lam - drift), wz = Math.sin(phi);
      const near = Math.acos(Math.max(-1, Math.min(1, wx * home[0] + wy * home[1] + wz * home[2]))) / D;
      const cl = smooth(0.56, 0.78, fbm(wx * 3.1 + 7, wy * 3.1, wz * 3.6)) * 0.62 * smooth(7, 18, near);
      R = R * 1.08; Gc = Gc * 1.06; B = B * 1.1;   // (a little more colour than the texture)
      R += (236 - R) * cl; Gc += (241 - Gc) * cl; B += (250 - B) * cl;
      R *= lit; Gc *= lit; B *= lit;
      if (sea && cl < 0.3) { const sp2 = Math.pow(Math.max(0, u * Hh[0] + v * Hh[1] + z * Hh[2]), 70) * 0.75; R += 255 * sp2; Gc += 245 * sp2; B += 225 * sp2; }
      const rim = Math.pow(1 - z, 2.4); R += 40 * rim; Gc += 110 * rim; B += 255 * rim * 0.9;
      const a = Math.min(1, (1 - Math.sqrt(rr)) * r * 1.2);   // (a soft edge, a pixel wide)
      const o = (py * S + px) * 4; d[o] = Math.min(255, R); d[o + 1] = Math.min(255, Gc); d[o + 2] = Math.min(255, B); d[o + 3] = 255 * a;
    }
    G.ox.putImageData(img, 0, 0);
    return r;
  }

  function frame(t) {
    if (!G) return;
    let cen = G.cen;
    if (G.from) {   // on the way here: the view's centre along the great circle, eased
      const k = Math.min(1, Math.max(0, (t - G.t0) / G.dur)), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const a = vec(...G.from), b = vec(...G.cen), om = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
      if (om > 1e-4 && k < 1) { const s0 = Math.sin((1 - e) * om) / Math.sin(om), s1 = Math.sin(e * om) / Math.sin(om); cen = ll([a[0] * s0 + b[0] * s1, a[1] * s0 + b[1] * s1, a[2] * s0 + b[2] * s1]); }
      if (k >= 1) G.from = null;
    }
    // the sphere again only while it turns, or four times a second (the clouds drift slowly); the pin pulses every frame
    if (G.from || G.ts == null || t - G.ts > 0.25 || t < G.ts) { G.r = sphere(t, cen); G.ts = t; G.cenD = cen; }
    cen = G.cenD;
    const { S, x, T } = G, r = G.r, c0 = S / 2, lat0 = cen[0] * D, lon0 = cen[1] * D, sp = Math.sin(lat0), cp = Math.cos(lat0);
    x.clearRect(0, 0, S, S);
    // the atmosphere round the edge
    const at = x.createRadialGradient(c0, c0, r * 0.92, c0, c0, r * 1.16); at.addColorStop(0, 'rgba(120,190,255,.55)'); at.addColorStop(0.45, 'rgba(80,150,255,.22)'); at.addColorStop(1, 'rgba(60,120,255,0)');
    x.fillStyle = at; x.beginPath(); x.arc(c0, c0, r * 1.16, 0, 7); x.fill();
    x.drawImage(G.off, 0, 0);
    const P = (lon, lat) => { const l = lon * D - lon0, p = lat * D, cz = sp * Math.sin(p) + cp * Math.cos(p) * Math.cos(l); return [c0 + r * Math.cos(p) * Math.sin(l), c0 - r * (cp * Math.sin(p) - sp * Math.cos(p) * Math.cos(l)), cz]; };
    // a faint graticule (every 30°), on the near side only
    x.save(); x.beginPath(); x.arc(c0, c0, r, 0, 7); x.clip(); x.strokeStyle = 'rgba(190,220,255,.12)'; x.lineWidth = S / 260;
    const line = (pts) => { let on = false; x.beginPath(); for (const [lo, la] of pts) { const [a, b, cz] = P(lo, la); if (cz > 0) { on ? x.lineTo(a, b) : x.moveTo(a, b); on = true; } else on = false; } x.stroke(); };
    for (let la = -60; la <= 60; la += 30) line(Array.from({ length: 73 }, (_, i) => [i * 5 - 180, la]));
    for (let lo = -180; lo < 180; lo += 30) line(Array.from({ length: 37 }, (_, i) => [lo, i * 5 - 90]));
    x.restore();
    // the country: gold, glowing, its border bright
    const rings = (window.GEO && window.GEO.outlines[T.countryKey]) || [];
    const path = () => { x.beginPath(); for (const ring of rings) { let on = false; for (let i = 0; i < ring.length; i += 2) { const [a, b, cz] = P(ring[i], ring[i + 1]); if (cz > 0) { on ? x.lineTo(a, b) : x.moveTo(a, b); on = true; } } x.closePath(); } };
    x.save(); x.shadowColor = 'rgba(255,200,60,.95)'; x.shadowBlur = S / 14; path(); x.fillStyle = 'rgba(255,206,58,.78)'; x.fill(); x.restore();
    path(); x.strokeStyle = '#fff1b8'; x.lineWidth = S / 150; x.lineJoin = 'round'; x.stroke();
    // the pin where the track is, a ring pulsing out of it
    const [qx, qy, qz] = P(T.lon, T.lat);
    if (qz > 0) {
      const pu = (t % 1.8) / 1.8, R0 = S * 0.035;
      x.strokeStyle = 'rgba(255,236,170,' + (0.9 * (1 - pu)) + ')'; x.lineWidth = S / 90; x.beginPath(); x.arc(qx, qy, R0 + pu * S * 0.11, 0, 7); x.stroke();
      x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.arc(qx + S * 0.006, qy + S * 0.01, R0, 0, 7); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(qx, qy, R0, 0, 7); x.fill();
      x.fillStyle = '#e8342a'; x.beginPath(); x.arc(qx, qy, R0 * 0.55, 0, 7); x.fill();
    }
    // the glass: a soft highlight at the upper left
    const hl = x.createRadialGradient(c0 - r * 0.42, c0 - r * 0.48, 0, c0 - r * 0.42, c0 - r * 0.48, r * 0.75); hl.addColorStop(0, 'rgba(255,255,255,.22)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = hl; x.beginPath(); x.arc(c0, c0, r, 0, 7); x.fill();
  }
  return { attach, travel, frame, center: () => G && [G.T.lat, G.T.lon] };
})();
