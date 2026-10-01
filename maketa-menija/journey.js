/* =========================================================================
   THE JOURNEY BEFORE A RACE (mockup) — a 3D Earth at the start of the race intro. It starts close over the place where the last race
   ended, pulls back until the whole Earth shows, flies along the great circle to the new track (a gold arc), comes down into the real
   land round the track in 3D (its relief, its towns, its road), and ends on the very view the drone's video starts from, so the video
   takes over without a cut. three.js r128 (as the game); the Earth's data from geo.js (window.GEO, made by geo_build.py): NASA's Blue
   Marble, the land painted from ESA WorldCover and the AWS Terrain Tiles, Natural Earth's borders and names.
   ========================================================================= */
window.Journey = (function () {
  'use strict';
  const RE = 6371;                       // the Earth's radius (km); the scene's unit is the kilometre
  const D2R = Math.PI / 180;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ease = (t) => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };   // (smootherstep: no jolt at either end)
  const wrap = (a) => { a = a % 360; return a < 0 ? a + 360 : a; };
  const mixAngle = (a, b, t) => { let d = ((b - a) % 360 + 540) % 360 - 180; return wrap(a + d * t); };

  // ---------------- the Earth's frame: x, y, z in km; y to the north pole, z to (0, 0), x to (0, 90 E) ----------------
  function ecef(lat, lon, h, out) {
    const r = RE + (h || 0), la = lat * D2R, lo = lon * D2R, c = Math.cos(la);
    out = out || new THREE.Vector3(); return out.set(r * c * Math.sin(lo), r * Math.sin(la), r * c * Math.cos(lo));
  }
  function llOf(v) { const r = v.length(); return { lat: Math.asin(clamp(v.y / r, -1, 1)) / D2R, lon: Math.atan2(v.x, v.z) / D2R, h: r - RE }; }
  function enu(lat, lon) {   // east, north, up at a point
    const la = lat * D2R, lo = lon * D2R;
    return { e: new THREE.Vector3(Math.cos(lo), 0, -Math.sin(lo)), n: new THREE.Vector3(-Math.sin(la) * Math.sin(lo), Math.cos(la), -Math.sin(la) * Math.cos(lo)), u: new THREE.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)) };
  }
  function gcDist(a, b) {   // great-circle distance (km)
    const p1 = a.lat * D2R, p2 = b.lat * D2R, dp = p2 - p1, dl = (b.lon - a.lon) * D2R;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2; return 2 * RE * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function bearing(a, b) {
    const p1 = a.lat * D2R, p2 = b.lat * D2R, dl = (b.lon - a.lon) * D2R;
    return wrap(Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) / D2R);
  }
  function slerpLL(a, b, f) {   // the point a fraction f of the way along the great circle from a to b
    const A = ecef(a.lat, a.lon, 0).normalize(), B = ecef(b.lat, b.lon, 0).normalize(), w = Math.acos(clamp(A.dot(B), -1, 1));
    if (w < 1e-9) return { lat: a.lat, lon: a.lon };
    const s = Math.sin(w), v = A.multiplyScalar(Math.sin((1 - f) * w) / s).add(B.multiplyScalar(Math.sin(f * w) / s));
    const q = llOf(v.multiplyScalar(RE)); return { lat: q.lat, lon: q.lon };
  }
  // the game's flat world on the Earth (geo_lib.Geo): x east, z south (turned by rot degrees), metres; y the game's height (+ offset: real)
  function gameLL(G, x, z) {
    const a = 6378137, e2 = 0.0066943799901413165, s0 = Math.sin(G.lat0 * D2R), w = 1 - e2 * s0 * s0, M = a * (1 - e2) / Math.pow(w, 1.5), N = a / Math.sqrt(w), c = Math.cos(G.lat0 * D2R);
    const r = G.rot * D2R, east = x * Math.cos(r) + z * Math.sin(r), south = -x * Math.sin(r) + z * Math.cos(r);
    return { lat: G.lat0 - south / M / D2R, lon: G.lon0 + east / (N * c) / D2R };
  }

  // ---------------- shaders ----------------
  const HAZE = `
    uniform vec3 uCam; uniform vec3 uHaze; uniform float uHazeK;
    float hazeOf(vec3 p) { return 1.0 - exp(-distance(p, uCam) * uHazeK); }`;
  // the globe: the Blue Marble, and the regions' painted land over it (each fading in at its edges)
  const EARTH_V = `
    attribute vec2 ll; varying vec2 vLL; varying vec2 vUv; varying vec3 vP;
    void main() { vLL = ll; vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const EARTH_F = `
    uniform sampler2D tE, tA, tB; uniform vec4 bA, bB; uniform float aA, aB, uDim; varying vec2 vLL; varying vec2 vUv; varying vec3 vP;` + HAZE + `
    vec4 over(sampler2D t, vec4 b, float a) {
      vec2 q = vec2((vLL.y - b.y) / (b.w - b.y), (vLL.x - b.x) / (b.z - b.x));
      if (a <= 0.0 || q.x < 0.0 || q.y < 0.0 || q.x > 1.0 || q.y > 1.0) return vec4(0.0);
      float e = min(min(q.x, 1.0 - q.x), min(q.y, 1.0 - q.y)); return vec4(texture2D(t, q).rgb, a * smoothstep(0.0, 0.07, e));
    }
    void main() {
      vec3 c = texture2D(tE, vUv).rgb; vec4 o = over(tA, bA, aA); c = mix(c, o.rgb, o.a); o = over(tB, bB, aB); c = mix(c, o.rgb, o.a);
      gl_FragColor = vec4(mix(c * uDim, uHaze, hazeOf(vP)), 1.0);
    }`;
  // a patch of land in 3D: its painted picture, raised by its heights (exaggerated by uEx), fading in at its edges and with distance
  const PATCH_V = `
    attribute vec3 nrm; attribute float hgt; uniform float uEx; varying vec2 vUv; varying vec3 vP;
    void main() { vUv = uv; vec3 p = position + nrm * hgt * uEx; vec4 w = modelMatrix * vec4(p, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const PATCH_F = `
    uniform sampler2D tMap; uniform float uA, uEdge; varying vec2 vUv; varying vec3 vP;` + HAZE + `
    void main() {
      float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)), a = uA * smoothstep(0.0, uEdge, e);
      if (a <= 0.003) discard;
      gl_FragColor = vec4(mix(texture2D(tMap, vUv).rgb, uHaze, hazeOf(vP)), a);
    }`;
  // the air round the Earth seen from space: a glow at the rim
  const ATM_V = `varying vec3 vN; varying vec3 vP; void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const ATM_F = `uniform vec3 uCam; uniform float uA; varying vec3 vN; varying vec3 vP;
    void main() { vec3 v = normalize(uCam - vP); float f = 1.0 - abs(dot(v, vN)); float g = pow(f, 3.2) * 1.5; gl_FragColor = vec4(vec3(0.35, 0.62, 1.0) * g * uA, 1.0); }`;
  // the sky behind everything: black space with stars up high, a blue sky with a hazy horizon low down
  const SKY_V = `varying vec2 vQ; void main() { vQ = position.xy; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;
  const SKY_F = `uniform mat4 uInvPV; uniform vec3 uCam; uniform float uLow; uniform vec3 uHaze; varying vec2 vQ;
    void main() {
      vec4 p = uInvPV * vec4(vQ, 1.0, 1.0); vec3 d = normalize(p.xyz / p.w - uCam), up = normalize(uCam);
      float el = dot(d, up), h = length(uCam) - ${RE.toFixed(1)}, dip = -sqrt(max(0.0, 2.0 * h / ${RE.toFixed(1)}));
      float t = clamp((el - dip) / 0.5, 0.0, 1.0);
      vec3 sky = mix(uHaze, vec3(0.27, 0.48, 0.80), pow(t, 0.6));
      gl_FragColor = vec4(sky * uLow, 1.0);
    }`;
  // a line of even width on the screen (the arc, an outline, the road): each point twice, pushed apart along the line's normal
  const LINE_V = `
    attribute vec3 prev, next; attribute float side, along; uniform vec2 uRes; uniform float uW; uniform vec3 uCam; uniform float uHorizon;
    varying float vAlong; varying float vSide; varying float vVis;
    void main() {
      vec4 wc = modelMatrix * vec4(position, 1.0); vec4 c = projectionMatrix * viewMatrix * wc, a = projectionMatrix * viewMatrix * modelMatrix * vec4(prev, 1.0), b = projectionMatrix * viewMatrix * modelMatrix * vec4(next, 1.0);
      vec2 sc = c.xy / c.w * uRes, sa = a.xy / a.w * uRes, sb = b.xy / b.w * uRes, dir = normalize(sb - sa + vec2(1e-6, 0.0)), nrm = vec2(-dir.y, dir.x);
      c.xy += nrm * side * uW / uRes * c.w; gl_Position = c; vAlong = along; vSide = side;
      vVis = uHorizon > 0.5 ? dot(normalize(wc.xyz), normalize(uCam - wc.xyz)) : 1.0;
    }`;
  const LINE_F = `uniform vec3 uCol; uniform float uA, uHead, uSoft; varying float vAlong; varying float vSide; varying float vVis;
    void main() { if (vVis < -0.02 || vAlong > uHead) discard; float s = 1.0 - smoothstep(1.0 - uSoft, 1.0, abs(vSide)); gl_FragColor = vec4(uCol, uA * s); }`;

  function lineGeo(pts) {   // pts: THREE.Vector3[] (local to the mesh), with 'along' 0..1 by length
    const n = pts.length, P = new Float32Array(n * 6), Pr = new Float32Array(n * 6), Nx = new Float32Array(n * 6), S = new Float32Array(n * 2), A = new Float32Array(n * 2), idx = [];
    let tot = 0; const cum = [0]; for (let i = 1; i < n; i++) { tot += pts[i].distanceTo(pts[i - 1]); cum.push(tot); }
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      for (let s = 0; s < 2; s++) { const k = (i * 2 + s) * 3; P[k] = p.x; P[k + 1] = p.y; P[k + 2] = p.z; Pr[k] = a.x; Pr[k + 1] = a.y; Pr[k + 2] = a.z; Nx[k] = b.x; Nx[k + 1] = b.y; Nx[k + 2] = b.z; S[i * 2 + s] = s ? 1 : -1; A[i * 2 + s] = tot ? cum[i] / tot : 0; }
      if (i) idx.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('prev', new THREE.BufferAttribute(Pr, 3)); g.setAttribute('next', new THREE.BufferAttribute(Nx, 3));
    g.setAttribute('side', new THREE.BufferAttribute(S, 1)); g.setAttribute('along', new THREE.BufferAttribute(A, 1)); g.setIndex(idx); return g;
  }
  function lineMat(col, w, a, soft, horizon) {
    return new THREE.ShaderMaterial({ vertexShader: LINE_V, fragmentShader: LINE_F, transparent: true, depthWrite: false, side: THREE.DoubleSide,   // (a ribbon turns either way on the screen)
      uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uW: { value: w }, uCol: { value: new THREE.Color(col) }, uA: { value: a }, uHead: { value: 1.01 }, uSoft: { value: soft == null ? 0.35 : soft }, uCam: { value: new THREE.Vector3() }, uHorizon: { value: horizon ? 1 : 0 } } });
  }

  // ---------------- loading (each picture once; the heights read from their 16-bit PNGs) ----------------
  const cache = {};
  function img(url) { return cache[url] || (cache[url] = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.decoding = 'async'; im.src = url; })); }
  function heights(url, lo) {
    const k = 'h:' + url; if (cache[k]) return cache[k];
    return (cache[k] = img(url).then(im => {
      if (!im) return null; const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, im.width, im.height).data, n = im.width * im.height, h = new Float32Array(n);
      for (let i = 0; i < n; i++) h[i] = (lo + (d[i * 4] * 256 + d[i * 4 + 1]) / 10) / 1000;   // (km)
      return { w: im.width, h: im.height, a: h };
    }));
  }
  function texOf(im) { const t = new THREE.Texture(im); t.needsUpdate = true; t.anisotropy = 4; t.minFilter = THREE.LinearMipmapLinearFilter; return t; }
  function preload(ids) {
    const G = window.GEO; if (!G) return Promise.resolve();
    const urls = ['assets/geo/earth.webp'];
    for (const id of ids) { const t = G.tracks[id]; if (!t) continue; urls.push(G.l1[t.l1].img, t.l2.img, t.l3.img); heights(t.l2.h, t.l2.lo); heights(t.l3.h, t.l3.lo); }
    return Promise.all(urls.map(img));
  }

  // ---------------- one journey ----------------
  let sup = null;
  function supported() {   // (asked once; the test's own context given back at once: a phone allows only a few)
    if (sup != null) return sup;
    if (!window.THREE || !window.GEO) return (sup = false);
    try { const c = document.createElement('canvas'), gl = c.getContext('webgl') || c.getContext('experimental-webgl'), x = gl && gl.getExtension('WEBGL_lose_context'); sup = !!gl; if (x) x.loseContext(); }
    catch (_) { sup = false; }
    return sup;
  }
  /* host: the element to fill; o: { from: track id or null, to: track id, arrive: the drone video's arrival (routes.js), fromTitle, toTitle:
     the races' names (on the pins), endHud: [name, sub] as the video's first shot has the corner, onHud(name, sub), onLine(text),
     onHandover(): the video may start (the globe follows its arrival while it fades), video: the <video> (its clock drives the hand-over),
     debug(course): for tests }. Returns { done: Promise ('done', 'skip' or 'nogl'), skip(), total, elapsed } (seconds) */
  function play(host, o) {
    const G = window.GEO, TO = G.tracks[o.to], FROM = o.from && o.from !== o.to ? G.tracks[o.from] : null;
    let alive = true, raf = 0, resolveDone; const done = new Promise(r => { resolveDone = r; });
    const W0 = host.clientWidth || 360, H0 = host.clientHeight || 300, dpr = Math.min(2, window.devicePixelRatio || 1);
    const back = document.createElement('div'); back.className = 'jback'; host.appendChild(back);
    const canvas = document.createElement('canvas'); canvas.className = 'jglobe'; host.appendChild(canvas);
    const labels = document.createElement('div'); labels.className = 'jlabels'; labels.setAttribute('aria-hidden', 'true'); host.appendChild(labels);
    const veil = document.createElement('canvas'); veil.className = 'jveil'; veil.width = Math.round(W0 * dpr / 2); veil.height = Math.round(H0 * dpr / 2); host.appendChild(veil);
    const credit = document.createElement('div'); credit.className = 'jcredit'; credit.textContent = 'NASA Blue Marble · ESA WorldCover · AWS Terrain Tiles · Natural Earth'; host.appendChild(credit);   // (the data's credits, as on any map)
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
    catch (e) { cleanup(); resolveDone('nogl'); return { done, skip() {}, total: 0, elapsed: 0 }; }
    renderer.setPixelRatio(dpr); renderer.setSize(W0, H0, false); renderer.autoClear = false; renderer.setClearColor(0x000000, 1);
    const camera = new THREE.PerspectiveCamera(45, W0 / H0, 1, 1e5);
    const res = new THREE.Vector2(W0 * dpr / 2, H0 * dpr / 2);

    // where the journey starts and ends: the last race's finish (or space), the drone video's first view
    const ENDP = (() => {
      const A = o.arrive && o.arrive.cam && o.arrive.cam.length ? o.arrive : null, G0 = TO;
      if (A) {
        const q = A.cam[0], c = gameLL(G0, q[0], q[2]), t = gameLL(G0, q[3], q[5]);
        return { cam: ecef(c.lat, c.lon, (q[1] + G0.offset) / 1000), tgt: ecef(t.lat, t.lon, (q[4] + G0.offset) / 1000), tLL: t, fov: A.fov || 50, path: A.cam, fps: A.fps || 30 };
      }
      const s = TO.start, tgt = ecef(s[0], s[1], s[2] / 1000), E = enu(s[0], s[1]);   // (no arrival: a view from the south-west, 3 km off)
      const cam = tgt.clone().add(E.u.clone().multiplyScalar(1.8)).add(E.n.clone().multiplyScalar(-2.0)).add(E.e.clone().multiplyScalar(-1.0));
      return { cam, tgt, tLL: { lat: s[0], lon: s[1] }, fov: 50, path: null, fps: 30 };
    })();
    // the end's view as target, distance, tilt from straight down, heading
    function viewOf(cam, tgt) {
      const ll = llOf(tgt), E = enu(ll.lat, ll.lon), v = cam.clone().sub(tgt), r = v.length(), up = v.dot(E.u) / r;
      const hd = Math.atan2(-v.dot(E.e), -v.dot(E.n)) / D2R;   // (the camera looks the other way from where it stands)
      return { lat: ll.lat, lon: ll.lon, h: ll.h, range: r, tilt: Math.acos(clamp(up, -1, 1)) / D2R, heading: wrap(hd) };
    }
    const vEnd = viewOf(ENDP.cam, ENDP.tgt);
    // ---------------- the journey's course ----------------
    // 1. down onto the place where the last race ended (its LAST RACE pin); 2. a moment there; 3. up, across and down to the new place on
    // van Wijk & Nuij's smooth zoom and pan (as high as it takes to see both, slower at the top, from rest, arriving at the speed the
    // drone's video goes on at); 4. the hand-over: the video takes over without a cut. North stays up while high (the map as one knows it).
    const ZIN = FROM ? 1.5 : 0, HOLD = FROM ? 0.4 : 0.15, T0 = ZIN + HOLD;
    let vStart;
    if (FROM) { const f = FROM.finish; vStart = { lat: f[0], lon: f[1], h: f[2] / 1000, range: 7, tilt: 50, heading: 4 }; }
    else vStart = { lat: clamp(vEnd.lat - 14, -60, 60), lon: vEnd.lon - 28, h: 0, range: 24000, tilt: 0, heading: 0 };
    const vZoom = FROM ? Object.assign({}, vStart, { range: 70, tilt: 26, heading: -16 }) : null;
    const RHO = 2.0, D = gcDist(vStart, vEnd), w0 = vStart.range, w1 = vEnd.range;
    let S, uOf, wOf;
    if (D < 1e-3) { S = Math.abs(Math.log(w1 / w0)) / RHO; uOf = () => 0; wOf = (s) => w0 * Math.exp(Math.sign(Math.log(w1 / w0)) * RHO * s); }
    else {
      const d2 = D * D, b0 = (w1 * w1 - w0 * w0 + RHO ** 4 * d2) / (2 * w0 * RHO * RHO * D), b1 = (w1 * w1 - w0 * w0 - RHO ** 4 * d2) / (2 * w1 * RHO * RHO * D);
      const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1); S = (r1 - r0) / RHO;
      uOf = (s) => w0 / (RHO * RHO * D) * (Math.cosh(r0) * Math.tanh(RHO * s + r0) - Math.sinh(r0)) * D; wOf = (s) => w0 * Math.cosh(r0) / Math.cosh(RHO * s + r0);
    }
    // the time along the path: a table of when each point of it is passed
    const NS = 600, dS = S / NS, lw = (s) => Math.log(Math.max(1e-6, wOf(s)));
    let wTop = 0; for (let i = 0; i <= NS; i++) wTop = Math.max(wTop, wOf(i * dS));
    const dist6 = (q) => Math.hypot(q[0] - q[3], q[1] - q[4], q[2] - q[5]);
    const vidSpeed = ENDP.path && ENDP.path.length > 2 ? Math.abs(Math.log(dist6(ENDP.path[1]) / dist6(ENDP.path[0]))) * ENDP.fps : 0;   // (the video's zoom at its start: log distance a second)
    const dlw = Math.abs((lw(S) - lw(S - dS)) / dS) || RHO;
    const dens = (s) => 1 + 0.9 * sstep(Math.log(wTop * 0.2), Math.log(wTop), lw(s));   // (a while at the top, the whole way in sight)
    const TR = clamp(1.4 + S * 0.62, 3.0, 7.0);
    function timeTable(sig0) {
      const sEnd = Math.max(vidSpeed / dlw, 0.1 * sig0), sA = 0.09 * S, sB = 0.2 * S, T = new Float64Array(NS + 1);
      for (let i = 1; i <= NS; i++) {
        const s = (i - 0.5) * dS, mid = sig0 / dens(s) * Math.sqrt(clamp(s / sA, 1e-4, 1));   // (from rest: a steady push to begin with)
        T[i] = T[i - 1] + dS / lerp(mid, sEnd, sstep(S - sB, S, s));
      }
      return T;
    }
    let sgLo = 0.02, sgHi = 80, TT = null;
    for (let k = 0; k < 44; k++) { const m = Math.sqrt(sgLo * sgHi); if (timeTable(m)[NS] > TR) sgLo = m; else sgHi = m; }
    TT = timeTable(sgHi);
    const TRV = TT[NS], TOTAL = T0 + TRV, HAND = 1.15;
    const sOfT = (t) => { if (t <= 0) return 0; if (t >= TRV) return S; let a = 0, b = NS; while (b - a > 1) { const m = (a + b) >> 1; if (TT[m] <= t) a = m; else b = m; } return (a + (t - TT[a]) / (TT[b] - TT[a])) * dS; };

    // ---------------- the scene ----------------
    const sky = new THREE.Scene(), earth = new THREE.Scene(), near2 = new THREE.Scene(), near3 = new THREE.Scene(), over = new THREE.Scene();
    const U = { uCam: { value: new THREE.Vector3() }, uHaze: { value: new THREE.Color(0xb8cde0) }, uHazeK: { value: 0 } };
    const skyMat = new THREE.ShaderMaterial({ vertexShader: SKY_V, fragmentShader: SKY_F, depthTest: false, depthWrite: false,
      uniforms: { uInvPV: { value: new THREE.Matrix4() }, uCam: U.uCam, uLow: { value: 0 }, uHaze: U.uHaze } });
    sky.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), skyMat));
    { // the stars: fixed points far away
      const n = 1600, p = new Float32Array(n * 3), cl = new Float32Array(n * 3); let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < n; i++) { const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u), b = 0.25 + 0.75 * Math.pow(rnd(), 3); p.set([r * Math.cos(a) * 8e4, u * 8e4, r * Math.sin(a) * 8e4], i * 3); cl.set([b * 0.9, b * 0.94, b], i * 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(cl, 3));
      sky.userData.stars = new THREE.Points(g, new THREE.PointsMaterial({ vertexColors: true, size: 1.25, sizeAttenuation: false, transparent: true, depthTest: false, depthWrite: false }));   // (size: CSS px; the renderer scales it)
      sky.add(sky.userData.stars);
    }
    // the globe: a sphere of lat/lon quads (its own: the texture's seam where the map's is)
    const earthMat = new THREE.ShaderMaterial({ vertexShader: EARTH_V, fragmentShader: EARTH_F,
      uniforms: Object.assign({ tE: { value: null }, tA: { value: null }, tB: { value: null }, bA: { value: new THREE.Vector4() }, bB: { value: new THREE.Vector4() }, aA: { value: 0 }, aB: { value: 0 }, uDim: { value: 1 } }, U) });
    {
      const nx = 256, ny = 128, P = [], UV = [], LL = [], idx = [];
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const lat = 90 - 180 * j / ny, lon = -180 + 360 * i / nx, v = ecef(lat, lon, -0.06); P.push(v.x, v.y, v.z); UV.push(i / nx, 1 - j / ny); LL.push(lat, lon); }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('ll', new THREE.Float32BufferAttribute(LL, 2)); g.setIndex(idx);
      earth.add(new THREE.Mesh(g, earthMat));
    }
    const atmMat = new THREE.ShaderMaterial({ vertexShader: ATM_V, fragmentShader: ATM_F, uniforms: { uCam: U.uCam, uA: { value: 1 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide });
    earth.add(new THREE.Mesh(new THREE.SphereBufferGeometry(RE * 1.018, 128, 64), atmMat));

    // the land of a track's place in 3D: its 80 km round (L2) and its own 14 km (L3)
    const patches = [];
    function patch(scene, L, n, hm) {
      const b = L.box, cLat = (b[0] + b[2]) / 2, cLon = (b[1] + b[3]) / 2, C = ecef(cLat, cLon, 0), P = new Float32Array((n + 1) ** 2 * 3), Nr = new Float32Array((n + 1) ** 2 * 3), H = new Float32Array((n + 1) ** 2), UV = new Float32Array((n + 1) ** 2 * 2);
      const v = new THREE.Vector3();
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
        const k = j * (n + 1) + i, lat = b[2] - (b[2] - b[0]) * j / n, lon = b[1] + (b[3] - b[1]) * i / n;
        ecef(lat, lon, 0, v); const u = v.clone().normalize(); v.sub(C); P[k * 3] = v.x; P[k * 3 + 1] = v.y; P[k * 3 + 2] = v.z; Nr[k * 3] = u.x; Nr[k * 3 + 1] = u.y; Nr[k * 3 + 2] = u.z;
        const hx = Math.round(i / n * (hm.w - 1)), hy = Math.round(j / n * (hm.h - 1)); H[k] = hm.a[hy * hm.w + hx]; UV[k * 2] = i / n; UV[k * 2 + 1] = 1 - j / n;
      }
      const idx = []; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b2 = a + 1, c = a + n + 1, d = c + 1; idx.push(a, c, b2, b2, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('nrm', new THREE.BufferAttribute(Nr, 3)); g.setAttribute('hgt', new THREE.BufferAttribute(H, 1)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ vertexShader: PATCH_V, fragmentShader: PATCH_F, transparent: true, depthWrite: true,
        uniforms: Object.assign({ tMap: { value: null }, uA: { value: 0 }, uEdge: { value: 0.08 }, uEx: { value: 1 } }, U) });
      const mesh = new THREE.Mesh(g, m); mesh.position.copy(C); mesh.frustumCulled = false; scene.add(mesh);
      const p = { mesh, m, C, L, ready: false }; patches.push(p); return p;
    }
    // a track's road on its land (a real track: the game's own line, at its real height): the new one gold, the last one white
    const roads = [];
    function road(T, col) {
      if (!T.route) return;
      const C = ecef(T.route[0][0], T.route[0][1], 0), pts = T.route.map(q => ecef(q[0], q[1], q[2] / 1000 + 0.012).sub(C));
      if (!T.open) pts.push(pts[0].clone());
      const g = lineGeo(pts), edge = new THREE.Mesh(g, lineMat(0x1a1408, 7, 0.55, 0.5)), ln = new THREE.Mesh(g, lineMat(col, 3.6, 1, 0.3));
      for (const m of [edge, ln]) { m.position.copy(C); m.frustumCulled = false; m.renderOrder = 5; near3.add(m); }
      roads.push({ ln, edge, T });
    }
    // the borders between countries, and the outline of the new track's country (or state)
    const borderMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthTest: false, depthWrite: false });
    {
      const P = []; for (const l of G.borders) for (let i = 2; i < l.length; i += 2) { const a = ecef(l[i - 1], l[i - 2], 0.3), b = ecef(l[i + 1], l[i], 0.3); P.push(a.x, a.y, a.z, b.x, b.y, b.z); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); over.add(new THREE.LineSegments(g, borderMat));
    }
    const outlines = [];
    const homeName = TO.names.country === 'USA' ? 'Colorado' : TO.names.country;
    for (const l of (G.outlines[homeName] || [])) {
      const pts = []; for (let i = 0; i < l.length; i += 2) pts.push(ecef(l[i + 1], l[i], 0.5));
      const C = pts[0].clone(); pts.forEach(p => p.sub(C));
      const m = new THREE.Mesh(lineGeo(pts), lineMat(0xffd23a, 2.6, 0, 0.4, true)); m.position.copy(C); m.frustumCulled = false; over.add(m); outlines.push(m);
    }
    // the arc: from the last race's finish to the new track, raised over the Earth the higher the longer it is; drawn as the camera flies
    let arc = null, arcGlow = null, comet = null;
    if (FROM && D > 30) {
      const n = 160, lift = Math.min(1600, D * 0.12), pts = [];
      for (let i = 0; i <= n; i++) { const f = i / n, q = slerpLL(vStart, vEnd, f); pts.push(ecef(q.lat, q.lon, Math.sin(Math.PI * f) * lift + 0.5)); }
      const C = pts[0].clone(); pts.forEach(p => p.sub(C)); const g = lineGeo(pts);
      arcGlow = new THREE.Mesh(g, lineMat(0xffc629, 11, 0.22, 1.0, true)); arc = new THREE.Mesh(g, lineMat(0xffe07a, 3.2, 1, 0.35, true));
      for (const m of [arcGlow, arc]) { m.position.copy(C); m.frustumCulled = false; over.add(m); }
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,240,170,.9)'); gr.addColorStop(1, 'rgba(255,200,40,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      comet = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false, depthWrite: false, transparent: true, sizeAttenuation: false }));
      comet.scale.set(0.09, 0.09, 1); over.add(comet); comet.userData = { pts, C, lift };
    }

    // ---------------- the pictures: the globe first, then each place's land as it arrives ----------------
    img('assets/geo/earth.webp').then(im => { if (alive && im) earthMat.uniforms.tE.value = texOf(im); });
    const places = [TO]; if (FROM) places.push(FROM);
    places.forEach((T, k) => {
      const L1 = G.l1[T.l1], key = k ? 'B' : 'A';
      img(L1.img).then(im => { if (!alive || !im) return; earthMat.uniforms['t' + key].value = texOf(im); const b = L1.box; earthMat.uniforms['b' + key].value.set(b[0], b[1], b[2], b[3]); earthMat.uniforms['a' + key].value = 1; });
      for (const [lv, n, sc] of [['l2', 96, near2], ['l3', 176, near3]]) {
        Promise.all([img(T[lv].img), heights(T[lv].h, T[lv].lo)]).then(([im, hm]) => { if (!alive || !im || !hm || (T === FROM && fromFreed)) return; const p = patch(sc, T[lv], n, hm); p.lv = lv; p.T = T; p.m.uniforms.tMap.value = texOf(im); p.ready = true; if (lv === 'l3') road(T, T === TO ? 0xffd23a : 0xf4f6fa); });
      }
    });

    // ---------------- the names on the map (HTML over the picture) ----------------
    const LB = [];   // { el, p (Vector3), kind, show(state) -> 0..1, pri }
    function addLabel(html, cls, lat, lon, hKm, show, pri) {   // (anchored as the CSS places it: a pin by its foot, a town by its dot, the rest by the middle)
      const el = document.createElement('div'); el.className = 'jl ' + cls; el.innerHTML = '<span>' + html + '</span>'; labels.appendChild(el);
      const L = { el, p: ecef(lat, lon, hKm || 0), show, pri, a: 0, x: 0, y: 0, w: 0, h: 0, at: /\bpin\b/.test(cls) ? 'b' : /\btown\b/.test(cls) ? 'l' : 'c' }; LB.push(L); return L;
    }
    const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const kmTxt = (v) => Math.round(v).toLocaleString('en-US') + ' km';
    // the countries (the bigger and the nearer ones from further away), the two of the journey first
    for (const c of G.countries) {
      const nm = c[0], mine = nm === TO.names.country || (FROM && nm === FROM.names.country), rank = c[3];
      const lo = mine ? 120 : rank <= 2 ? 1800 : rank <= 4 ? 700 : 260, hi = mine ? 16000 : rank <= 2 ? 16000 : rank <= 4 ? 5200 : 1700;
      addLabel(esc(nm.toUpperCase()), 'ctry' + (mine ? ' mine' : ''), c[2], c[1], 0, (s) => s.alt > lo && s.alt < hi ? 1 : 0, mine ? 8 : 6 - Math.min(5, rank));
    }
    for (const t of G.towns) { const cap = t[4], lo = 18, hi = cap ? 2600 : 700; addLabel(esc(t[0]), 'town' + (cap ? ' cap' : ''), t[2], t[1], 0, (s) => s.alt > lo && s.alt < hi ? 1 : 0, cap ? 4 : 2 - t[3] * 0.1); }
    for (const a of G.areas) addLabel(esc(a[0]), a[4], a[2], a[1], 0, a[4] === 'sea' ? (s) => s.alt > 1500 && s.alt < 18000 && s.phase === 'travel' ? 1 : 0 : (s) => s.alt > 300 && s.alt < 2600 ? 1 : 0, a[4] === 'sea' ? 3 : 2.5);
    // the pins: where the last race ended, where this one starts
    const pin = (T, at, kind, cap, title) => addLabel('<b>' + esc(cap) + '</b><small>' + esc(title || (at === 'finish' ? T.names.finish : T.names.start)) + '</small><i></i>', 'pin ' + kind, T[at][0], T[at][1], T[at][2] / 1000 + 0.02,
      (s) => s.alt > 0.6 ? 1 : 0, 10);
    if (FROM) pin(FROM, 'finish', 'last', 'LAST RACE', o.fromTitle);
    pin(TO, 'start', 'next', 'TODAY', o.toTitle);

    // ---------------- the camera along the journey ----------------
    const tmpV = new THREE.Vector3(), tgt = new THREE.Vector3(), cpos = new THREE.Vector3();
    function place(v) {   // v: { lat, lon, h, range, tilt, heading } -> the camera
      const E = enu(v.lat, v.lon); ecef(v.lat, v.lon, v.h, tgt);
      const hd = v.heading * D2R, tl = v.tilt * D2R, fwd = E.n.clone().multiplyScalar(Math.cos(hd)).add(E.e.clone().multiplyScalar(Math.sin(hd)));
      cpos.copy(tgt).add(E.u.clone().multiplyScalar(Math.cos(tl) * v.range)).add(fwd.clone().multiplyScalar(-Math.sin(tl) * v.range));
      camera.position.copy(cpos); camera.up.copy(tl < 0.02 ? fwd : E.u); camera.lookAt(tgt);
    }
    function stateAt(t) {   // the journey's view at t seconds (before the hand-over)
      if (FROM && t < ZIN) {   // down onto the last race's finish
        const x = t / ZIN, k = x * x * x * (x * (x * 6 - 15) + 10) * 0.55 + (1 - Math.pow(1 - x, 2)) * 0.45;   // (a steady zoom in, settling softly)
        return { lat: vStart.lat, lon: vStart.lon, h: vStart.h, range: Math.exp(lerp(Math.log(vZoom.range), Math.log(vStart.range * 1.05), k)), tilt: lerp(vZoom.tilt, vStart.tilt, k), heading: lerp(vZoom.heading, 0, k), phase: 'hold', u: 0, f: 0 };
      }
      if (t < T0) { const k = ease((t - ZIN) / HOLD); return Object.assign({}, vStart, { range: vStart.range * (1.05 - 0.05 * k), heading: vStart.heading * k, phase: 'hold', u: 0, f: 0 }); }
      const tt = t - T0, s = sOfT(tt), u = D > 1e-3 ? clamp(uOf(s) / D, 0, 1) : 0, w = clamp(wOf(s), Math.min(w0, w1) * 0.98, 26000), lwv = Math.log(w);
      const q = slerpLL(vStart, vEnd, u);
      // the start's own view given up as the camera climbs, the end's taken up as it comes down (north up in between)
      const a = sstep(Math.log(12), Math.log(250), lwv), b = 1 - sstep(Math.log(5), Math.log(350), lwv), m = D > 1e-3 ? sstep(0.25, 0.75, u) : clamp(s / S, 0, 1);
      const heading = mixAngle(mixAngle(vStart.heading, 0, a), mixAngle(0, vEnd.heading, b), m), tilt = lerp(lerp(vStart.tilt, 0, a), lerp(0, vEnd.tilt, b), m);
      return { lat: q.lat, lon: q.lon, h: lerp(vStart.h, vEnd.h, u), range: w, tilt, heading, phase: tt < TRV ? 'travel' : 'end', u, f: tt / TRV };
    }

    // ---------------- the hand-over: the video's arrival starts; the globe follows it while it fades, through a little cloud ----------------
    const vctx = veil.getContext('2d'); let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const puffs = Array.from({ length: 9 }, () => { const a = rnd() * Math.PI * 2, r = 0.12 + rnd() * 0.3; return { x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r * 0.8, r: 0.18 + rnd() * 0.22, s: 0.8 + rnd() * 0.9 }; });
    function drawVeil(a, t) {
      const w = veil.width, h = veil.height; vctx.clearRect(0, 0, w, h); if (a <= 0.002) return;
      vctx.fillStyle = 'rgba(232,238,246,' + (0.08 * a).toFixed(3) + ')'; vctx.fillRect(0, 0, w, h);
      for (const p of puffs) {   // (each drifts out from the middle and grows, as the camera goes through)
        const grow = 1 + t * p.s * 1.6, x = (0.5 + (p.x - 0.5) * grow) * w, y = (0.5 + (p.y - 0.5) * grow) * h, r = p.r * grow * Math.max(w, h);
        const g = vctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(244,247,252,' + (0.24 * a).toFixed(3) + ')'); g.addColorStop(0.6, 'rgba(244,247,252,' + (0.08 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(244,247,252,0)');
        vctx.fillStyle = g; vctx.fillRect(0, 0, w, h);
      }
    }
    let handT0 = -1, vClock = -1, lastHud = '', lastHudSub = '', fromFreed = false;
    function hud(name, sub) { if (name !== lastHud || sub !== lastHudSub) { lastHud = name; lastHudSub = sub; if (o.onHud) o.onHud(name, sub); } }

    // ---------------- the frame ----------------
    let t0 = -1; const tWait = performance.now();
    canvas.style.opacity = '0'; labels.style.opacity = '0';
    function ready(waited) {   // the globe's picture (up to 4 s: without it the Earth is black), then the last race's lands (up to 1.2 s)
      if (!earthMat.uniforms.tE.value) return waited > 4000;
      return !FROM || waited > 1200 || patches.filter(p => p.T === FROM && p.ready).length >= 2;
    }
    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (t0 < 0) { if (!ready(now - tWait)) return; t0 = now; }
      const W = host.clientWidth || W0, H = host.clientHeight || H0;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { renderer.setSize(W, H, false); camera.aspect = W / H; res.set(W * dpr / 2, H * dpr / 2); veil.width = Math.round(W * dpr / 2); veil.height = Math.round(H * dpr / 2); }
      const t = (now - t0) / 1000;
      let st, fade = 1, hand = 0;
      if (t < TOTAL) st = stateAt(t);
      else {   // the hand-over: the video's clock moves the camera along its arrival
        if (handT0 < 0) { handT0 = t; if (o.onHandover) o.onHandover(); }
        const ht = t - handT0, vc = o.video && !o.video.paused && o.video.currentTime > 0 ? o.video.currentTime : -1;
        vClock = vc >= 0 ? (vClock < 0 ? vc : vClock + (vc - vClock) * 0.35) : ht; const vt = Math.max(0, vClock);
        hand = clamp(ht / HAND, 0, 1); fade = 1 - ease(hand);
        st = Object.assign({}, vEnd, { phase: 'end' });
        if (ENDP.path) { const i = Math.min(ENDP.path.length - 1, vt * ENDP.fps), a = Math.floor(i), b = Math.min(ENDP.path.length - 1, a + 1), f = i - a, q = ENDP.path[a], r = ENDP.path[b];
          const cx = lerp(q[0], r[0], f), cy = lerp(q[1], r[1], f), cz = lerp(q[2], r[2], f), tx = lerp(q[3], r[3], f), ty = lerp(q[4], r[4], f), tz = lerp(q[5], r[5], f);
          const c = gameLL(TO, cx, cz), g2 = gameLL(TO, tx, tz); st = Object.assign(viewOf(ecef(c.lat, c.lon, (cy + TO.offset) / 1000), ecef(g2.lat, g2.lon, (ty + TO.offset) / 1000)), { phase: 'end' }); }
        if (hand >= 1) { finish('done'); return; }
      }
      place(st);
      // the camera's lens: the video's at the end, a little wider out in space
      const alt = camera.position.length() - RE, fovEnd = ENDP.fov;
      camera.fov = lerp(fovEnd, 40, sstep(Math.log(60), Math.log(3000), Math.log(Math.max(1, alt))));
      const horizon = Math.sqrt(Math.max(0, (RE + alt) ** 2 - RE * RE));
      camera.near = clamp(alt * 0.02, 0.004, 400); camera.far = horizon + Math.max(400, alt) + 2000; camera.updateProjectionMatrix();
      camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      // the air: haze over the land when low (as the video's at the hand-over), the rim glow and the stars up high
      const low = 1 - sstep(25, 260, alt);
      U.uCam.value.copy(camera.position); U.uHazeK.value = low * 0.011 / Math.max(0.35, Math.sqrt(Math.max(alt, 0.1)) * 0.6);
      skyMat.uniforms.uLow.value = low; const stars = sky.userData.stars; stars.material.opacity = 0.85 * sstep(120, 900, alt);
      stars.position.copy(camera.position); stars.scale.setScalar(camera.far * 0.8 / 8e4); stars.visible = stars.material.opacity > 0.01;
      skyMat.uniforms.uInvPV.value.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
      atmMat.uniforms.uA.value = sstep(80, 900, alt);
      earthMat.uniforms.uDim.value = 1;
      // the last race's land is not needed again once the camera is well on its way (its pictures freed: lighter on a phone)
      if (FROM && !fromFreed && st.phase === 'travel' && (st.u || 0) > 0.35) {
        fromFreed = true;
        for (let i = patches.length - 1; i >= 0; i--) { const p = patches[i]; if (p.T !== FROM) continue; p.mesh.parent.remove(p.mesh); p.mesh.geometry.dispose(); if (p.m.uniforms.tMap.value) p.m.uniforms.tMap.value.dispose(); p.m.dispose(); patches.splice(i, 1); }
        for (let i = roads.length - 1; i >= 0; i--) { const r = roads[i]; if (r.T !== FROM) continue; for (const m of [r.ln, r.edge]) { m.parent.remove(m); m.material.dispose(); } r.ln.geometry.dispose(); roads.splice(i, 1); }
      }
      // the lands of the places: the 80 km from 600 km down, the 14 km from 90 km down (exaggerated in relief a little from afar)
      const ex = lerp(1.0, 1.7, sstep(Math.log(8), Math.log(120), Math.log(Math.max(1, alt))));
      for (const p of patches) {
        if (!p.ready) continue; const d = camera.position.distanceTo(p.C);
        p.m.uniforms.uA.value = p.lv === 'l2' ? 1 - sstep(260, 700, d) : 1 - sstep(45, 110, d); p.m.uniforms.uEx.value = ex; p.m.uniforms.uEdge.value = p.lv === 'l2' ? 0.26 : 0.2;
        p.mesh.visible = p.m.uniforms.uA.value > 0.003 && p.C.clone().normalize().dot(tmpV.copy(camera.position).sub(p.C).normalize()) > -0.3;
      }
      // the overlays: the borders from afar, the new country's outline as the camera comes down to it, the arc as it flies
      borderMat.opacity = 0.42 * sstep(70, 260, alt);
      const oa = 0.95 * sstep(60, 300, alt) * (1 - sstep(4500, 9000, alt)) * (st.phase === 'hold' ? 0 : sstep(0.35, 0.65, st.f || 1));
      for (const m of outlines) { m.material.uniforms.uA.value = oa; m.material.uniforms.uRes.value.copy(res); m.material.uniforms.uCam.value.copy(camera.position); }
      if (arc) {
        const head = st.phase === 'hold' ? 0 : st.phase === 'end' ? 1 : clamp(st.u * 1.0 + 0.002, 0, 1), aa = sstep(15, 120, alt);
        for (const m of [arc, arcGlow]) { m.material.uniforms.uHead.value = head; m.material.uniforms.uRes.value.copy(res); m.material.uniforms.uCam.value.copy(camera.position); }
        arc.material.uniforms.uA.value = aa; arcGlow.material.uniforms.uA.value = 0.22 * aa;
        const P = comet.userData.pts, i = Math.min(P.length - 1, Math.round(head * (P.length - 1))); comet.position.copy(P[i]).add(comet.userData.C); comet.material.opacity = aa * (head > 0.01 && head < 0.995 ? 1 : 0);
      }
      for (const r of roads) for (const m of [r.ln, r.edge]) { m.material.uniforms.uRes.value.copy(res); m.material.uniforms.uA.value = (m === r.ln ? 1 : 0.55) * (1 - sstep(20, 70, alt)); }
      // the passes: the sky, the globe, its air, the 80 km lands, the 14 km lands with the road, the lines over everything
      renderer.clear(true, true, true);
      renderer.render(sky, camera); renderer.render(earth, camera);
      renderer.clearDepth(); renderer.render(near2, camera);
      renderer.clearDepth(); renderer.render(near3, camera);
      renderer.render(over, camera);
      const fin = Math.min(1, t / 0.35);   // (in from the dark at the start)
      back.style.opacity = fade < 1 ? fade.toFixed(3) : ''; credit.style.opacity = labels.style.opacity;
      canvas.style.opacity = fade < 1 || fin < 1 ? (fade * fin).toFixed(3) : '';
      labels.style.opacity = fade < 1 || fin < 1 ? (Math.max(0, fade * 2 - 1) * fin).toFixed(3) : '';
      drawVeil(hand > 0 ? Math.sin(Math.PI * hand) : 0, hand);
      // the names: where they are on the screen, the most important first, none over another
      const sState = { alt, phase: st.phase }, pv = new THREE.Vector3(), placed = [], cams = camera.position;
      const cand = LB.map(L => { const want = L.show(sState); return { L, want }; }).filter(c => c.want > 0 || c.L.a > 0.01).sort((a, b) => b.L.pri - a.L.pri);
      for (const c of cand) {
        const L = c.L; let vis = c.want > 0;
        if (vis) {   // in front of the camera and on the near side of the Earth
          const toC = tmpV.copy(cams).sub(L.p); vis = L.p.dot(toC) > 0;
          if (vis) { pv.copy(L.p).project(camera); vis = pv.z < 1 && Math.abs(pv.x) < 1.05 && Math.abs(pv.y) < 1.05; }
          if (vis) {
            L.x = (pv.x + 1) / 2 * W; L.y = (1 - pv.y) / 2 * H; if (!L.w) { const sp = L.el.firstChild; L.w = sp.offsetWidth || 60; L.h = sp.offsetHeight || 14; }
            const x0 = L.at === 'l' ? L.x - 4 : L.x - L.w / 2, y0 = L.at === 'b' ? L.y - L.h : L.y - L.h / 2, r = { x0: x0 - 4, x1: x0 + L.w + 4, y0: y0 - 3, y1: y0 + L.h + 3 };
            if (x0 < 3 || x0 + L.w > W - 3 || y0 < 3 || y0 + L.h > H - 3) vis = false;   // (none cut by the picture's edge)
            else if (placed.some(q => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0)) vis = false; else placed.push(r);
          }
        }
        L.a += ((vis ? 1 : 0) - L.a) * 0.16;
        L.el.style.opacity = L.a > 0.01 ? L.a.toFixed(2) : '0';
        if (L.a > 0.01) L.el.style.transform = 'translate(' + L.x.toFixed(1) + 'px,' + L.y.toFixed(1) + 'px)';
      }
      // the place in the corner: the last race's at first, the way to the new one while flying (the distance left), the new place at the end
      const rem = D * (1 - (st.u || 0)), altTxt = (m) => Math.round(m).toLocaleString('en-US') + ' m';
      if (FROM && (st.phase === 'hold' || (st.phase === 'travel' && (st.u || 0) < 0.5 && alt < 45))) hud(FROM.names.finish, altTxt(FROM.finish[2]));
      else if (FROM && st.phase === 'travel' && D > 60 && rem > 100) hud('To ' + TO.names.region, kmTxt(rem));
      else if (st.phase === 'travel' && alt > 28) hud(TO.names.region, TO.names.country);
      else if (o.endHud) hud(o.endHud[0], o.endHud[1]); else hud(TO.names.start, altTxt(TO.start[2]));   // (as the video's first shot has it)
    }
    raf = requestAnimationFrame(frame);
    if (o.debug) o.debug({ stateAt, TOTAL, vEnd, fps: ENDP.fps, path: ENDP.path, vidSpeed });   // (tests: the course itself)
    // what the commentator says on the way
    if (o.onLine) {
      const the = (n) => (/(Alps|Ardennes|Eifel|coast|Côte d'Azur)$/.test(n) ? 'the ' : '') + n, dist = D >= 100 ? Math.round(D / 10) * 10 : Math.round(D);
      const same = FROM && FROM.names.region === TO.names.region, other = FROM && FROM.names.country !== TO.names.country;
      const a = FROM ? (same ? FROM.names.finish : the(FROM.names.region)) : '', b = same ? TO.names.start : the(TO.names.region) + (other || !FROM ? ', ' + TO.names.country : '');
      o.onLine(!FROM ? 'Today we race in ' + b + '.' : D < 2 ? 'Back to ' + TO.names.start + '.' : 'From ' + a + ' to ' + b + ': ' + dist.toLocaleString('en-US') + ' kilometres.');
    }
    function cleanup() {
      alive = false; cancelAnimationFrame(raf);
      try { if (renderer) { renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); } } catch (_) { /* gone already */ }
      try {   // (the scenes: not made yet if WebGL failed at once)
        for (const sc of [sky, earth, near2, near3, over]) sc.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) { for (const k in x.material.uniforms || {}) { const v = x.material.uniforms[k].value; if (v && v.isTexture) v.dispose(); } if (x.material.map) x.material.map.dispose(); x.material.dispose(); } });
      } catch (_) { /* nothing to free */ }
      back.remove(); canvas.remove(); labels.remove(); veil.remove(); credit.remove();
    }
    function finish(why) { if (!alive) return; cleanup(); resolveDone(why); }
    return { done, skip() { finish('skip'); }, get total() { return TOTAL + HAND; }, get elapsed() { return t0 < 0 ? 0 : (performance.now() - t0) / 1000; } };
  }
  return { supported, preload, play };
})();
