// The corner camera of the menu's track step (camera 3, docs/meni-izbira-proge.md sklop 4; tools/menu-corner.mjs): every real track has
// its corner (tools/menu-corners.json: where along the track, inside the race's run, and the still camera found for it), its video
// (assets/maps/corner-<id>.webm: VP9, 6 to 8 s, small for a phone) and its poster (corner-<id>.webp, 720 x 720); MENU.corners in
// js/menu-data.js lists exactly the tracks with a video, no test track among them. After a new real track: node tools/menu-corner.mjs <id>
//   node tests/menu-corner.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
global.window = global;
require(path.join(ROOT, 'js', 'menu-data.js'));
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'menu-corners.json'), 'utf8')), LIST = global.MENU.corners || [];
const defs = C.TRACKS.filter(d => !d.variantOf), real = defs.filter(d => !d.test), tests = defs.filter(d => d.test).map(d => d.id);
const MAPS = path.join(ROOT, 'assets', 'maps');

// the corners: every real track, inside its race's run (an open road between its start and finish), the camera off the corner's middle
const nocfg = real.filter(d => !CFG[d.id]).map(d => d.id), out = [], nocam = [];
for (const d of real) {
  const c = CFG[d.id]; if (!c) continue;
  const T = new C.Track(d), s = c.s;
  if (!(s >= 0 && s < T.len) || (d.open && !(s > T.startS && s < T.finishS))) out.push(d.id + ':' + s);
  const k = c.cam; if (!Array.isArray(k) || k.length !== 7 || !k.every(Number.isFinite) || !(k[6] >= 20 && k[6] <= 70) || Math.hypot(k[0] - k[3], k[2] - k[5]) < 15) nocam.push(d.id);
}
check(`every real track (${real.length}) has its corner in tools/menu-corners.json, inside its race's run, with its camera (20-70 degrees, at least 15 m from what it looks at)`, real.length >= 40 && !nocfg.length && !out.length && !nocam.length, JSON.stringify({ nocfg, out, nocam }));
const testcfg = Object.keys(CFG).filter(id => tests.includes(id) || !defs.find(d => d.id === id));
check('no test track (and no track the game has not) in tools/menu-corners.json', !testcfg.length, testcfg.join(', '));

// the videos: WebM (EBML) with VP9, 6 to 8 s long (the segment's Duration, in the TimecodeScale's ms), 0.1 to 1.3 MB; the posters
function webmInfo(b) {
  if (b.readUInt32BE(0) !== 0x1A45DFA3) return null;
  const vp9 = b.indexOf('V_VP9') > 0, i = b.indexOf(Buffer.from([0x44, 0x89]));   // (Duration: a float of 4 or 8 bytes, after its size byte)
  let dur = null;
  if (i > 0) { const sz = b[i + 2]; dur = sz === 0x88 ? b.readDoubleBE(i + 3) : sz === 0x84 ? b.readFloatBE(i + 3) : null; }
  const j = b.indexOf(Buffer.from([0x2A, 0xD7, 0xB1])); let scale = 1e6;   // (TimecodeScale: ns per tick, 1 ms when it is not there)
  if (j > 0) { const sz = b[j + 3] & 0x0f, len = b[j + 3] === 0x83 ? 3 : b[j + 3] === 0x84 ? 4 : sz; scale = b.readUIntBE(j + 4, Math.min(6, len)); }
  return { vp9, sec: dur == null ? null : dur * scale / 1e9 };
}
function webpSize(b) {
  if (b.toString('latin1', 0, 4) !== 'RIFF') return null; const k = b.toString('latin1', 12, 16);
  return k === 'VP8X' ? [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1] : k === 'VP8 ' ? [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff] : k === 'VP8L' ? [(b.readUInt32LE(21) & 0x3fff) + 1, ((b.readUInt32LE(21) >> 14) & 0x3fff) + 1] : null;
}
const vbad = [], sizes = [];
for (const d of real) {
  const v = path.join(MAPS, 'corner-' + d.id + '.webm'), p = path.join(MAPS, 'corner-' + d.id + '.webp');
  if (!fs.existsSync(v) || !fs.existsSync(p)) { vbad.push(d.id + ': none'); continue; }
  const b = fs.readFileSync(v), w = webmInfo(b), q = fs.readFileSync(p), pd = webpSize(q);
  sizes.push(b.length);
  if (!w || !w.vp9 || !(w.sec >= 5.9 && w.sec <= 8.1) || b.length < 100e3 || b.length > 1.3e6) vbad.push(d.id + ': ' + JSON.stringify({ w, mb: +(b.length / 1e6).toFixed(2) }));
  if (!pd || pd[0] !== 720 || pd[1] !== 720 || q.length > 120e3) vbad.push(d.id + ' poster: ' + JSON.stringify({ pd, kb: Math.round(q.length / 1e3) }));
}
const total = sizes.reduce((a, b) => a + b, 0);
check(`every real track's corner video (VP9, 6-8 s, 0.1-1.3 MB; ${(total / 1e6).toFixed(1)} MB in all) and its poster (720 x 720, at most 120 kB)`, !vbad.length && total < 45e6, vbad.join('; '));

// the menu's list: exactly the tracks with a video, sorted, no test track
const have = fs.readdirSync(MAPS).map(f => /^corner-(.+)\.webm$/.exec(f)).filter(Boolean).map(m => m[1]).sort();
check(`MENU.corners (js/menu-data.js) lists exactly the tracks with a corner video (${LIST.length}), no test track`, JSON.stringify(LIST) === JSON.stringify(have) && !LIST.some(id => tests.includes(id)), JSON.stringify({ LIST, have }));

console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
