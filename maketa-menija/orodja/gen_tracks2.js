// Track outlines (SVG path data) from the game's own track definitions, for the mockups. Read-only use of the game code.
const { loadCore } = require(require('path').join(__dirname, '..', 'game_main', 'tests', 'lib', 'core.js'));
const fs = require('fs');
const Core = loadCore();
const out = {};
for (const d of Core.TRACKS) {
  const T = new Core.Track(d);
  let a = 1e9, b = -1e9, c = 1e9, e = -1e9;
  for (let i = 0; i < T.N; i++) { a = Math.min(a, T.px[i]); b = Math.max(b, T.px[i]); c = Math.min(c, T.pz[i]); e = Math.max(e, T.pz[i]); }
  const rot = !!T.open && (e - c) > (b - a) * 1.3;   // a long open road (Pikes Peak) is drawn on its side, as on the track cards
  const X = rot ? (i) => -T.pz[i] : (i) => T.px[i], Y = rot ? (i) => T.px[i] : (i) => T.pz[i];
  if (rot) { const a0 = a, b0 = b; a = -e; b = -c; c = a0; e = b0; }
  const n = T.open ? T.N - 1 : T.N, step = Math.max(1, Math.floor(n / 220));
  const pts = [];
  for (let i = 0; i <= n; i += step) pts.push([X(i % T.N), Y(i % T.N)]);
  if (T.open) pts.push([X(n), Y(n)]);
  const f = (v) => Math.round(v * 10) / 10;
  const dStr = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' L') + (T.open ? '' : ' Z');
  const pad = Math.max(b - a, e - c) * 0.07;
  out[d.id] = { name: d.name, d: dStr, vb: [f(a - pad), f(c - pad), f(b - a + 2 * pad), f(e - c + 2 * pad)].join(' '), start: [f(X(T.startIdx)), f(Y(T.startIdx))], open: !!T.open,
    finish: T.open ? [f(X(T.finishIdx)), f(Y(T.finishIdx))] : null, km: +(T.len / 1000).toFixed(2), laps: d.laps || 3, corners: T.corners.length, size: Math.max(b - a, e - c), elev: +(Math.max(...T.hy) - Math.min(...T.hy)).toFixed(0), theme: d.theme, timeTrial: !!d.timeTrial };
}
fs.writeFileSync(process.argv[2], 'window.TRACKS = ' + JSON.stringify(out) + ';\n');
console.log(Object.entries(out).map(([k, v]) => k + ' ' + v.km + 'km ' + v.laps + 'L ' + v.corners + 'c vb=' + v.vb).join('\n'));
