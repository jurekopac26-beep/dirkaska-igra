// The HUD's corner signs (#h-note; Core Track.hudSigns, Track.signAt): on every track a sorted list built from T.corners (which itself
// never changes), no corner lost; the blue signs: Medvode's four roundabouts (def.rings), Harju's three bale chicanes (def.notes), the
// chicanes the circuits name in def.hudSigns (Monaco, Spa, Suzuka, Montréal, the Nordschleife, Bathurst, Toskana, Riviera), each its first
// way, and blue nowhere else; the fast bends signed too (no stretch of an open road kilometres long without a sign); an open road's start
// never shown at its finish (no lap wrap); the list built in milliseconds.
//   node tests/hudsigns.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const KINDS = ['corner', 'fast', 'bend', 'ring', 'chic'], isBlue = (g) => g.kind === 'ring' || g.kind === 'chic';
const tracks = new Map(C.TRACKS.map(d => [d.id, new C.Track(d)]));
const tr = (id) => tracks.get(id);
const S = (T, d) => T.open ? T.startS + d : (((T.startS + d) % T.len) + T.len) % T.len;   // d m after the start line -> s
const rel = (T, s) => T.open ? s - T.startS : (((s - T.startS) % T.len) + T.len) % T.len;   // s -> m after the start line
const off = (T, a, b) => T.open ? b - a : ((((b - a) % T.len) + T.len * 1.5) % T.len) - T.len / 2;   // b - a along the road
const dir = (g) => g.dir > 0 ? 'R' : g.dir < 0 ? 'L' : '-';
const show = (T, g) => g ? `${g.kind}${g.kind === 'ring' ? '' : dir(g)}@${Math.round(rel(T, g.s0))}` : 'none';
const blues = (T) => T.hudSigns().filter(isBlue);
const place = (T, re) => { const p = T.names.find(x => re.test(x.n)); return p ? p.d : null; };
// the longest stretch (m) without a sign starting in it: an open road from the start to the finish, a circuit round the lap
const gap = (T) => {
  const inR = (s) => !T.open || (s >= T.startS - 5 && s <= T.finishS), ss = T.hudSigns().filter(g => inR(g.s0)).map(g => rel(T, g.s0)).sort((a, b) => a - b);
  if (!ss.length) return T.open ? T.raceLen : T.len;
  let g = 0; for (let i = 1; i < ss.length; i++) g = Math.max(g, ss[i] - ss[i - 1]);
  return Math.round(Math.max(g, T.open ? Math.max(ss[0], T.raceLen - ss[ss.length - 1]) : ss[0] + T.len - ss[ss.length - 1]));
};

// 1. every track: the list sorted, its kinds, its end points; T.corners as it was; no corner lost; blue spans apart; built fast; no lap wrap
{
  const bads = { sort: [], corners: [], lost: [], overlap: [], slow: [], wrap: [] };
  let slowest = 0, slowId = '';
  for (const [id, T] of tracks) {
    const before = JSON.stringify(T.corners.map(c => [c.i0, c.i1, c.sev])), H = T.hudSigns();
    if (JSON.stringify(T.corners.map(c => [c.i0, c.i1, c.sev])) !== before || T.hudSigns() !== H) bads.corners.push(id);
    if (!H.length || H.some((g, i) => (i && g.s0 < H[i - 1].s0) || !KINDS.includes(g.kind) || !Number.isFinite(g.e) || !Number.isFinite(g.s1) || g.s1 < g.s0 || !(g.i0 >= 0 && g.i0 < T.N))) bads.sort.push(id);
    const blue = H.filter(isBlue), bend = H.filter(g => g.kind === 'bend');
    const within = (x, c, m) => { const len = (T.open ? c.i1 - c.i0 : (c.i1 - c.i0 + T.N) % T.N) * T.ds, o = off(T, x.s0, c.s0); return o <= x.s1 - x.s0 + m && o + len >= -m; };
    for (const c of T.corners) if (!H.some(g => g.kind === 'corner' && g.i0 === c.i0) && !blue.some(x => within(x, c, 15)) && !bend.some(x => within(x, c, 0))) bads.lost.push(`${id}@${Math.round(rel(T, c.s0))}`);
    for (let i = 1; i < blue.length; i++) if (blue[i].s0 < blue[i - 1].s1) bads.overlap.push(id);
    const ts = []; for (let r = 0; r < 3; r++) { T._hs = null; const t0 = process.hrtime.bigint(); T.hudSigns(); ts.push(Number(process.hrtime.bigint() - t0) / 1e6); }
    const ms = Math.min(...ts); if (ms > slowest) { slowest = ms; slowId = id; } if (ms >= 5) bads.slow.push(`${id} ${ms.toFixed(1)} ms`);
    if (T.open) { const g = T.signAt(T.finishS - 30, 40); if (g && g.s0 < T.finishS - 300) bads.wrap.push(`${id}: ${show(T, g)}`); }
  }
  check(`every track (${tracks.size}): a list sorted along the road, kinds ${KINDS.join('/')}, each with its end point; built once`, !bads.sort.length, bads.sort.join(', '));
  check('every track: T.corners unchanged by the list (the scenery, the sounds, the menu read it)', !bads.corners.length, bads.corners.join(', '));
  check('every track: no corner lost (its own arrow, or within 15 m of a blue sign, or inside a named bend)', !bads.lost.length, bads.lost.slice(0, 12).join(', '));
  check('every track: the blue spans apart from each other', !bads.overlap.length, bads.overlap.join(', '));
  check('every track: the list built in under 5 ms (the fastest of 3)', !bads.slow.length, bads.slow.join(', ') || `the slowest ${slowId} ${slowest.toFixed(2)} ms`);
  check('open roads: 30 m before the finish no sign from the start (no lap wrap)', !bads.wrap.length, bads.wrap.join(', '));
}

// 2. Medvode: the four roundabouts blue (where the route runs round def.rings), their red arrows gone; the sign up while the car is in one
{
  const T = tr('medvode'), R = T.hudSigns().filter(g => g.kind === 'ring'), at = R.map(g => Math.round(rel(T, g.s0)));
  check('medvode: four roundabouts, at 326, 978, 2226 and 4120 m (±20)', R.length === 4 && [326, 978, 2226, 4120].every((d, k) => Math.abs(at[k] - d) <= 20), at.join(', '));
  const red = T.hudSigns().filter(g => g.kind === 'corner' && rel(T, g.s0) >= 311 && rel(T, g.s0) <= 415);
  check('medvode: no red arrow in the first roundabout (311-415 m; T.corners has three there)', !red.length && T.corners.filter(c => rel(T, c.s0) >= 311 && rel(T, c.s0) <= 415).length >= 2, red.map(g => show(T, g)).join(' '));
  const a = T.signAt(S(T, 300), 20), b = T.signAt(S(T, 360), 8), c = T.signAt(S(T, 420), 15);
  check('medvode: the roundabout\'s sign before it (300 m, 72 km/h) and in it (360 m), not after it (420 m)', a && a.kind === 'ring' && b && b.kind === 'ring' && !(c && c.kind === 'ring'), `${show(T, a)}, ${show(T, b)}, ${show(T, c)}`);
}

// 3. Harju: the three bale chicanes (def.notes 'chicane') blue, each its first way; the first had no sign at all
{
  const T = tr('harju'), B = blues(T), at = B.map(g => Math.round(rel(T, g.s0)));
  check('harju: three chicanes, at 576, 1634 and 1812 m (±5), first right, left, right', B.length === 3 && B.every(g => g.kind === 'chic') && [576, 1634, 1812].every((d, k) => Math.abs(at[k] - d) <= 5) && B.map(dir).join('') === 'RLR',
    B.map(g => show(T, g)).join(', '));
  const g = T.signAt(S(T, 540), 15), old = T.corners.filter(c => rel(T, c.s0) >= 540 && rel(T, c.s0) <= 614);
  check('harju: 36 m before the first chicane its sign (T.corners has no corner there)', g && g.kind === 'chic' && !old.length, `${show(T, g)}; corners there: ${old.length}`);
}

// 4. the circuits' own chicanes (def.hudSigns): a blue span over each named place, its first way; blue nowhere else
{
  for (const [id, re, w] of [['monaco', /Nouvelle/, 'L'], ['spa', /Bus Stop/, 'R'], ['suzuka', /Casio/, 'R'], ['bathurst', /^Zavoj 16$/, 'L'], ['nring', /Hohenrain/, null]]) {
    const T = tr(id), d = place(T, re), g = d != null && blues(T).find(x => { const o = off(T, x.s0, S(T, d)); return o >= 0 && o <= x.s1 - x.s0; });
    check(`${id}: ${re.source.replace(/[\^$]/g, '')} (${d == null ? '?' : Math.round(d)} m) inside a blue chicane${w ? ', first ' + (w === 'L' ? 'left' : 'right') : ''}`, !!g && g.kind === 'chic' && (!w || dir(g) === w), g ? show(T, g) : 'none');
  }
  for (const [id, want] of [['montreal', 'RLRR'], ['toskana', 'L'], ['riviera', 'R'], ['nring', null]]) {
    const T = tr(id), B = blues(T);
    check(`${id}: ${want ? want.length : 2} chicane${(want ? want.length : 2) > 1 ? 's' : ''}${want ? ', first ' + want.split('').join(', ') : ''}`, B.length === (want ? want.length : 2) && B.every(g => g.kind === 'chic') && (!want || B.map(dir).join('') === want), B.map(g => show(T, g)).join(', '));
  }
  const odd = [...tracks].filter(([id, T]) => id !== 'medvode' && id !== 'harju' && !T.def.hudSigns && blues(T).length).map(([id, T]) => `${id}: ${blues(T).map(g => show(T, g)).join(' ')}`);
  check('no blue sign anywhere else (the other open roads, the circuits without def.hudSigns)', !odd.length, odd.join('; '));
}

// 5. the fast bends signed too: the long stretches without a sign gone (fast stages, Monaco's first kilometre, the named fast corners)
{
  const ou = gap(tr('ouninpohja')), ga = gap(tr('greatalpine'));
  check('ouninpohja: no stretch over 1100 m without a sign (was 3243 m)', ou <= 1100, `${ou} m`);
  check('greatalpine: no stretch over 900 m without a sign (was 2634 m)', ga <= 900, `${ga} m`);
  const M = tr('monaco'), first = M.hudSigns().filter(g => rel(M, g.s0) < 1100);
  check('monaco: at least 3 signs in the first 1100 m (Sainte Dévote, Massenet, Casino; was none)', first.length >= 3, first.map(g => show(M, g)).join(' '));
  for (const [id, re] of [['spa', /Eau Rouge/], ['spa', /Pouhon/], ['bangsaen', /Laem Thaen/], ['monaco', /Sainte D/]]) {
    const T = tr(id), d = place(T, re), s = d != null ? S(T, d) : null, g = s != null && T.hudSigns().find(x => { const o = off(T, s, x.s0); return o >= -180 && o <= 80; });
    check(`${id}: a sign for ${re.source} (${d == null ? '?' : Math.round(d)} m): one starts from 180 m before it to 80 m after it`, !!g, g ? `${show(T, g)} (${Math.round(off(T, s, g.s0))} m)` : 'none');
  }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
