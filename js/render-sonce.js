/* =========================================================================
   RENDER — the sun from the place, the date and the time (Grafika AAA, Srednji paket, G0, H3: docs/grafika-aaa.md on raziskava/grafika-aaa).
   A real track that names its day (def.sonce: { lat, lon, datum: 'MM-DD', ura: hours of the local clock, tz: hours east of UTC }; the place
   from OpenStreetMap, the date and the hour the track's own assumption in docs/proge/<id>.md) gets the sun where it really is then: the day's
   light from the real azimuth, at the real elevation, but never lower than MIN_EL for the shadow (a low sun stretches the shadow box over the
   ground by 1/sin(elevation): more casters, coarser shadows; the gates were measured with today's ~40°), the light a little warmer when the
   real sun is low (under WARM); the dusk's (and the dawn's) light from where the sun really sets (rises) that day, its height in the sky as
   today's dusk. Static during a race. Every other track (no def.sonce, test: true, pending: true) keeps today's sun, bit for bit.
   The sun's position: NOAA Global Monitoring Laboratory, »General Solar Position Calculations« (the fractional year, the equation of time,
   the declination; public domain). The track's frame: metres, x east, z south (the track files), y up; GEO's small rotation (js/geo.js
   rot, Spa −0.62°) is left out.
   Render.ext.sonce: { pos(S, hour?), apply(D, K, dawn, def, id) (js/render.js applyTheme, before the night's light) }
   ========================================================================= */
(function () {
  'use strict';
  if (typeof Render === 'undefined' || !Render.ext) return;
  const R = Math.PI / 180;
  const MIN_EL = 28;    // (the shadow light never lower than this, degrees: the gates' measurement, H3's condition ~25–30°)
  const WARM = 35;      // (a real sun lower than this, degrees: its light a little warmer; 0 at WARM, WARM_K at the horizon)
  const WARM_K = 0.5, WARM_C = [1.0, 0.78, 0.56];
  const SET_EL = 6;     // (the dusk's light from the azimuth of the sun this high, degrees, that evening; the dawn's that morning)
  const MD = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const real = (def) => !!def && !def.test && !def.pending && !!def.sonce;

  // the day's numbers (NOAA): declination (radians) and the equation of time (minutes) on the day of the year doy at the local hour h (tz)
  function day(doy, h, tz) {
    const g = 2 * Math.PI / 365 * (doy - 1 + (h - tz - 12) / 24);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    return { dec, eq };
  }
  const doyOf = (datum) => { const [m, d] = String(datum).split('-').map(Number); return MD[Math.max(0, Math.min(11, (m || 1) - 1))] + (d || 1); };
  // the hour angle (radians, 0 at the true noon, + afternoon) at the local hour h
  const hourAngle = (S, h, eq) => ((h * 60 + eq + 4 * S.lon - 60 * S.tz) / 4 - 180) * R;
  // a direction (the track's frame: x east, y up, z south) from the latitude, the declination and the hour angle
  function dir(phi, dec, H) {
    const e = -Math.cos(dec) * Math.sin(H), n = Math.sin(dec) * Math.cos(phi) - Math.cos(dec) * Math.cos(H) * Math.sin(phi);
    const u = Math.sin(dec) * Math.sin(phi) + Math.cos(dec) * Math.cos(H) * Math.cos(phi);
    return [e, u, -n];
  }
  // the sun of the day S (def.sonce) at its hour (or at the hour h): { d: direction [x, y, z], el: elevation (degrees), az: azimuth from the
  // north through the east (degrees), dusk / dawn: the direction of the sun SET_EL above the horizon that evening / morning (null: none) }
  function pos(S, h) {
    const hr = h == null ? S.ura : h, doy = doyOf(S.datum), { dec, eq } = day(doy, hr, S.tz), phi = S.lat * R;
    const d = dir(phi, dec, hourAngle(S, hr, eq)), el = Math.asin(Math.max(-1, Math.min(1, d[1]))) / R;
    const az = (Math.atan2(d[0], -d[2]) / R + 360) % 360;
    const c = (Math.sin(SET_EL * R) - Math.sin(dec) * Math.sin(phi)) / (Math.cos(dec) * Math.cos(phi)), H0 = Math.abs(c) <= 1 ? Math.acos(c) : null;
    return { d, el, az, dusk: H0 == null ? null : dir(phi, dec, H0), dawn: H0 == null ? null : dir(phi, dec, -H0) };
  }
  // applyTheme's hook: the day's light (D) and the dusk's or the dawn's (K) of the track (def) whose theme (id) is being applied
  function apply(D, K, dawn, def, id) {
    if (!real(def) || (def.theme && def.theme !== id)) return;   // (a theme applied while the previous track was still curTrack: as it was)
    const S = pos(def.sonce), L = Math.hypot(D.off[0], D.off[1], D.off[2]);
    const el = Math.max(MIN_EL, S.el) * R, hl = Math.hypot(S.d[0], S.d[2]) || 1;
    D.off = [S.d[0] / hl * Math.cos(el) * L, Math.sin(el) * L, S.d[2] / hl * Math.cos(el) * L];
    if (S.el < WARM) { const k = WARM_K * (WARM - Math.max(0, S.el)) / WARM; D.sunC.setRGB(D.sunC.r * (1 + (WARM_C[0] - 1) * k), D.sunC.g * (1 + (WARM_C[1] - 1) * k), D.sunC.b * (1 + (WARM_C[2] - 1) * k)); }
    const v = dawn ? S.dawn : S.dusk;
    if (v) { const m = Math.hypot(K.off[0], K.off[2]), vl = Math.hypot(v[0], v[2]) || 1; K.off = [v[0] / vl * m, K.off[1], v[2] / vl * m]; }   // (today's height of the dusk's sun)
  }

  Render.ext.sonce = { MIN_EL, pos, apply };
})();
