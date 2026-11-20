// The co-driver's recorded voice (docs/sovoznik.md, Glas): the sheet js/data/sovoznik-en.js (tools/sovoznik-glas.py) has every word he says
// (each of Core.CD_EN, each distance of a call: d100 to d500) and nothing else, each word in its own place of the sheet (in order, apart,
// a word's length), the MP3 whole (its frames end to end, 24000 Hz mono, as long as the sheet says), small for a phone (at most 160 KB),
// every call of every road said from it (Comm.noteLen: each in at most 8.5 s, half of them in at most 4.4 s: the pace of the tool's --tempo)
// (its source and licence: README »Zasluge«, not read here: a test that reads a document makes every change to it run every test,
// tests/run.js KODA_MD).
// The voice in the game: browser/sovoznik.test.mjs.
//   node tests/sovoznik-glas.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore } = require('./lib/core.js');

const ROOT = path.resolve(__dirname, '..'), FILE = path.join(ROOT, 'js', 'data', 'sovoznik-en.js');
const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

require(FILE);
const D = globalThis.SOVOZNIK_EN;
const DIST = []; for (let d = 100; d <= 500; d += 50) DIST.push('d' + d);
const WORDS = Object.keys(C.CD_EN).concat(DIST);

// 1. the words: each one he says, no other
{
  const keys = Object.keys((D && D.clips) || {}), miss = WORDS.filter(w => !keys.includes(w)), more = keys.filter(w => !WORDS.includes(w));
  check('words: every word of the co-driver and every distance in the sheet, no other', D && !miss.length && !more.length,
    `${keys.length} of ${WORDS.length}${miss.length ? ', missing ' + miss.join(' ') : ''}${more.length ? ', not his ' + more.join(' ') : ''}`);
}

// 2. each word its own place: inside the sheet, in order, apart (the tool puts 0.12 s of silence between them), a word long (no silence,
// no two words)
{
  const at = Object.entries(D.clips).sort((a, b) => a[1][0] - b[1][0]), worst = [];
  let ok = D.rate === 24000 && D.len > 0;
  at.forEach(([w, [a, b]], i) => {
    const len = b - a, from = i ? at[i - 1][1][1] + 0.1 : 0.05;   // (the first: after the sheet's own 0.08 s of silence)
    if (!(b <= D.len + 1e-6 && a >= from - 1e-6 && len >= 0.15 && len <= 1.2)) { ok = false; worst.push(`${w} [${a}, ${b}]`); }
  });
  const lens = at.map(e => e[1][1] - e[1][0]);
  check('places: every word inside the sheet, in order, at least 0.1 s apart, 0.15 to 1.2 s long', ok,
    worst.length ? worst.slice(0, 4).join(', ') : `${D.len} s, words ${Math.min(...lens).toFixed(2)} to ${Math.max(...lens).toFixed(2)} s`);
}

// 3. the MP3 whole: MPEG-2 layer III frames end to end (no cut, no other data), 24000 Hz mono, as long as the sheet (the encoder's
// delay and padding: up to 0.2 s more)
{
  const u8 = Buffer.from(D.mp3, 'base64'), KB = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  let p = 0, frames = 0, ok = true;
  if (u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) ok = false;   // (an ID3 tag: not wanted in the sheet)
  while (ok && p + 4 <= u8.length) {
    const h = u8.readUInt32BE(p), sync = h >>> 21, ver = (h >>> 19) & 3, layer = (h >>> 17) & 3, br = (h >>> 12) & 15, sr = (h >>> 10) & 3, pad = (h >>> 9) & 1, mode = (h >>> 6) & 3;
    if (sync !== 0x7ff || ver !== 2 || layer !== 1 || sr !== 1 || mode !== 3 || !br || br === 15) { ok = false; break; }
    p += Math.floor(72000 * KB[br] / 24000) + pad; frames++;
  }
  const dur = frames * 576 / 24000;
  check('MP3: whole, frames end to end, 24000 Hz mono, as long as the sheet', ok && p === u8.length && dur >= D.len && dur <= D.len + 0.2,
    `${u8.length} B, ${frames} frames, ${dur.toFixed(3)} s for ${D.len} s${ok && p !== u8.length ? ', ' + (u8.length - p) + ' B left over' : ''}`);
}

// 4. small: the file at most 160 KB (docs/sovoznik.md: ~150 KB; a phone loads it once, the service worker keeps it)
{
  const size = fs.statSync(FILE).size;
  check('size: the sheet at most 160 KB', size <= 160 * 1024, `${(size / 1024).toFixed(1)} KB`);
}

// 5. every call of every road said from the sheet (Comm.noteLen: the words and the gaps between them; the lead before the bend, game.js
// cdLead, from it): the longest, three notes of 14 words, in at most 8.5 s, half of them in at most 4.4 s. The voice bm_george (the user's
// choice, 6 Nov 2026) at the tool's --tempo 1.15 says them in 7.9 s and 3.4 s on the 16 roads of this branch (6.9 s and 2.9 s without Vršič,
// Sani Pass and Mount Buller, which become test roads with main); at --tempo 1: 8.8 s and 3.7 s. The first voice, am_michael, was ~17% quicker
// (6.6 s and 2.9 s; the limits were 7 s and 3.2 s). A much slower pace than the tool's must fail here.
// The half-limit was 3.7 s until 11 Nov 2026: the ten roads of main say half of their calls in 3.2 s (the longest 6.9 s), but the 16 new roads
// (N1-N8 and Killar: hairpins and crests joined into longer calls, "right five over crest and left three tightens and right two long tightens")
// in 4.2 s, so on the 26 roads of all of them half of the calls take 4.00 s, the longest 7.87 s. The limit 4.4 s keeps ~10% of room for the
// roads still to come (the tool's --tempo 1 would be 4.6 s and 9.0 s: that pace still fails here, as it did before).
{
  const Comm = require(path.join(ROOT, 'js', 'comm.js'));
  globalThis.window = { SOVOZNIK_EN: D };
  const roads = C.TRACKS.filter(d => C.codrvRoad(d));
  let calls = 0, worst = { T: 0 }, missing = [], all = [];
  for (const def of roads) {
    for (const c of new C.Track(def).paceNotes()) {
      calls++;
      const no = c.toks.filter(w => !D.clips[w]); if (no.length) missing.push(def.id + ': ' + no.join(' '));
      const T = Comm.noteLen(c.toks); all.push(T); if (T > worst.T) worst = { T, id: def.id, text: c.text };
    }
  }
  delete globalThis.window;
  const mid = all.sort((a, b) => a - b)[Math.floor((all.length - 1) / 2)] || 0;
  check('calls: every call of every road said from the sheet, each in at most 8.5 s, half of them in at most 4.4 s', calls > 0 && !missing.length && worst.T <= 8.5 && mid <= 4.4,
    missing.length ? missing.slice(0, 3).join('; ') : `${calls} calls on ${roads.length} roads, half in ${mid.toFixed(2)} s, the longest ${worst.T.toFixed(2)} s (${worst.id}: ${worst.text})`);
}

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
