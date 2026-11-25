// Meritve za mesta delov na avtu kompleta (avti na raven KOLIBRIJA, docs/avti-kolibri.md, »Recept za mesta«): kje je serijska lupina,
// notranji blok in kateri del je kje, preden v `mounts` vpišeš številko; in kateri otok možnosti lebdi, ko pregled (tests/deli-pregled.test.js)
// pokaže samo prve tri napake. Brez sprememb igre; ROOT=<druga kopija igre> bere tisto kodo.
//   node tools/deli-sonda.js meri <id>                    osi modela, polja telesa, škatla vsakega dela (o zunanji, i notranji)
//   node tools/deli-sonda.js zacetek <id>                 začetna mesta iz prerezov (formule `mounts(key)` v js/cars/stari.js) za popravek po meri
//   node tools/deli-sonda.js zarek <id> <x,..> <y,..> [smer] [<z,..>]
//                                                         lupina vzdolž žarkov: privzeto z+ iz (x, y, 0); smeri x+ x- y+ y- zo+ zo- iz (x, y, z);
//                                                         NOTRANJE=1 šteje tudi notranji blok (tla prostora motorja, kabina)
//   node tools/deli-sonda.js otoki <id> <element> <možnost> [lebdeci]
//                                                         otoki možnosti: škatla, ali se dotika avta (6 mm), razdalja; `lebdeci`: samo taki brez dotika
'use strict';
const path = require('path'), ROOT = path.resolve(process.env.ROOT || path.join(__dirname, '..'));
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js')), L = require(path.join(ROOT, 'tests/lib/deli-geo.js'));
const [cmd, id, ...rest] = process.argv.slice(2);
if (!['meri', 'zacetek', 'zarek', 'otoki'].includes(cmd) || !id) { console.log('usage: node tools/deli-sonda.js meri|zacetek|zarek|otoki <id> …'); process.exit(2); }
const C = loadCore(), R = L.loadRender(C).Render, M = C.MODELS.find(m => m.id === id);
if (!M) { console.log('ni avta', id); process.exit(2); }
const f = (v) => v.toFixed(3), r3 = (v) => Math.round(v * 1000) / 1000;
const kit = () => { const T = R.kitTry(id, null, null, false); if (!T || T.status !== 'ok') { console.log('status', T && T.status); process.exit(1); } return T; };
const boxes = (T) => { const U = T.geo.userData, P = T.geo.attributes.position.array, out = {};
  for (const k in U.ranges) for (const w of ['o', 'i']) { const [a, b] = U.ranges[k][w] || []; if (a == null || b <= a) continue;
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let v = a; v < b; v++) for (let j = 0; j < 3; j++) { const q = P[v * 3 + j]; if (q < mn[j]) mn[j] = q; if (q > mx[j]) mx[j] = q; }
    out[k + '.' + w] = { mn, mx, n: (b - a) / 3, subs: U.ranges[k].subs }; }
  return out; };

if (cmd === 'meri') {
  const T = kit(), B = boxes(T);
  console.log(`${id}: a ${M.a} b ${M.b} rw ${M.rw} len ${M.len} wid ${M.wid} body.len ${T.body.len} hw ${f(T.body.hw)} roofY ${T.body.roofY} sx ${f(M.len / T.body.len)}`);
  for (const k in B) { const b = B[k], [p, w] = k.split('.');
    console.log(`${p.padEnd(11)} ${w} n${String(b.n).padStart(5)}  x ${f(b.mn[0])}..${f(b.mx[0])}  y ${f(b.mn[1])}..${f(b.mx[1])}  z ${f(b.mn[2])}..${f(b.mx[2])}` +
      (b.subs && b.subs.length ? ' subs ' + b.subs.map(s => s.sub || s.id || JSON.stringify(s)).join(',') : '')); }
  console.log('arches', JSON.stringify(T.body.arches || null), 'tubs', JSON.stringify(T.tubs || null).slice(0, 300));
}

if (cmd === 'zacetek') {
  const D = M.def, T = kit(), B = boxes(T), box = (k) => B[k + '.o'];
  const S = D.look.body.secs.map(s => ({ x: s[0], w: s[1], yb: s[2], ybelt: s[3], wt: s[4], yt: s[5], cr: s[6], k: s[7] })).sort((a, b) => a.x - b.x);
  const at = (x, k) => { if (x <= S[0].x) return S[0][k]; for (let i = 0; i < S.length - 1; i++) if (x <= S[i + 1].x) { const t = (x - S[i].x) / (S[i + 1].x - S[i].x); return S[i][k] + (S[i + 1][k] - S[i][k]) * t; } return S[S.length - 1][k]; };
  const F = S[S.length - 1], Rr = S[0], fa = M.a, fb = M.b, z = D.mounts && D.mounts.zarometi || {};
  const gi = S.findIndex(s => s.k === 'gf'), ri = S.findIndex(s => s.k === 'r'), gri = S.findIndex(s => s.k === 'gr');
  const wsTop = gi >= 0 ? S[gi].x : null, wsBase = gi >= 0 ? S[gi + 1].x : null, roofR = ri >= 0 ? S[ri].x : null, grFoot = gri < 0 ? roofR : S[gri].x;
  const mid = (roofR + wsTop) / 2, d1 = (D.look.body.door || [wsBase, wsBase - 1.15])[1], hood = box('hood');
  const o = {
    aero: { xf: F.x, xr: Rr.x, w: r3(F.w * 0.92), yf: F.yb, yr: Rr.yb, sill: [r3(-fb + 0.47), r3(fa - 0.47)], ws: r3(at(0, 'w') * 0.95), ys: r3(at(0, 'yb') - 0.03) },
    hauba: hood && { x0: r3(wsBase + 0.12), x1: r3(Math.max(hood.mx[0] - 0.12, wsBase + 0.6)), w: r3(Math.min(at(wsBase, 'wt'), F.wt) * 0.45), bulge: 0.5 },
    relijske_luci: { bumper: [F.x, r3(F.yb + 0.12), 0.3], nose: [F.x, r3((z.yc || 0.6) + 0.1)], intake: [F.x, r3(F.yb + 0.05), 0.8, 0.12], roof: [r3(wsTop - 0.08), r3(at(wsTop - 0.08, 'wt') * 0.8)], pod: [F.x, r3((z.yc || 0.6) - 0.06), 0.66, 0.5], part: 'bumperF' },
    vlecne_kljuke: { f: [F.x, r3(F.yb + 0.1), r3(F.w * 0.75)], r: [Rr.x, r3(Rr.yb + 0.1), 0.3] },
    lovilci_blata: { x: [r3(fa - 0.45), r3(-fb - (-Rr.x - fb < 0.7 ? 0.39 : 0.45))], z: [0.6, 0.72], y: [r3(at(fa - 0.37, 'yb') + 0.06), 0.09], sill: [r3(-fb + 0.6), r3(fa - 0.6), r3(at(0, 'yb')), r3(at(0, 'w') - 0.11)], part: 'body' },
    streha: roofR != null && { x0: r3(roofR + 0.05), x1: r3(wsTop - 0.02), xf: r3(wsTop - 0.05), xr: r3(mid - 0.15) },
    stresna_zajemalka: { x: r3(wsTop - 0.05), z: 0 },
    antena: { x: r3(roofR + 0.55), z: r3(at(roofR + 0.55, 'wt') * 0.55), fin: [r3(roofR + 0.45), 0], front: [r3(mid - 0.05), r3(at(mid, 'wt') * 0.7)], whip: r3(wsTop - 0.05), part: 'body' },
    zaluzije: { x0: r3(grFoot + 0.04), y0: r3(at(grFoot + 0.04, 'yt') + 0.01), x1: roofR, y1: r3(at(roofR, 'yt') + 0.01), w: r3(Math.min(at(grFoot, 'wt'), at(roofR, 'wt')) * 0.85) },
    zavore: { s: 1 }, matice: { k: 5, r: 0.2 }, barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
    crte: { z: [0.24, 0.38] },
    nalepke: { side: [[r3(d1 + 0.1), r3(fa - 0.45)], [r3(fa + 0.5), r3(F.x - 0.25)], [r3(-fb + 0.45), r3(d1 - 0.12)]], y: [r3(at(0, 'yb') + 0.2), r3(at(0, 'ybelt') - 0.06)], hood: { x: [r3(wsBase + 0.1), r3(F.x - 0.3)], z: [0.26, 0.46] }, roof: { x: [r3(roofR + 0.05), r3(wsTop - 0.05)] } },
    soncni_pas: { x: [r3(wsTop), r3(wsTop + 0.14)] }, zamasek: { x: r3(-fb + 0.42), y: r3(at(-fb + 0.42, 'ybelt') - 0.08), z: r3(at(-fb + 0.42, 'w')), r: 0.045 },
    celjusti: { r: [0.085, 0.16], a: [70, 125] },
    vzmeti: { in: 0.13, top: 0.72 }, amortizerji: { in: 0.13, top: 0.74 }, stabilizatorji: { in: 0.13, floor: r3(Math.max(at(fa, 'yb'), 0.2) - 0.02) }, dim_gum: {},
  };
  const js = (v) => JSON.stringify(v).replace(/"([a-z_A-Z0-9]+)":/g, '$1: ').replace(/,(?=[^ ])/g, ', ').replace(/"/g, "'").replace(/\{/g, '{ ').replace(/\}/g, ' }').replace(/\{  \}/g, '{}');
  for (const k in o) if (o[k]) console.log(`      ${k}: ${js(o[k])},`);
  const bx = (k) => { const b = box(k); return b ? `${k} ${b.mn.map(r3)} .. ${b.mx.map(r3)}` : `${k} -`; };
  console.log('// ' + ['mirrorR', 'tailR', 'hood', 'trunk', 'bumperF', 'bumperR'].map(bx).join('  '));
  console.log(`// wsTop ${wsTop} wsBase ${wsBase} roofR ${roofR} grFoot ${grFoot} door ${JSON.stringify(D.look.body.door)} w(0) ${r3(at(0, 'w'))} ybelt(0) ${r3(at(0, 'ybelt'))} yb(0) ${at(0, 'yb')}`);
  console.log('// manjka: zarometi, platisca, krilo, maska, zmigavci, zadnje_luci, auspuh, prtljaznik, ogledala, vrata, filter_zraka, akumulator, turbo, cip (po meri, recept v docs/avti-kolibri.md)');
}

if (cmd === 'zarek') {
  const [xs, ys, mode, zs] = rest, ST = L.optionGeo(R, id, {}, '__', true), G = L.Grid(ST.P, process.env.NOTRANJE ? ST.rest.concat(ST.inner) : ST.rest);
  const D = { 'z+': [0, 0, 1], 'zo+': [0, 0, 1], 'zo-': [0, 0, -1], 'x+': [1, 0, 0], 'x-': [-1, 0, 0], 'y-': [0, -1, 0], 'y+': [0, 1, 0] }[mode || 'z+'];
  if (!xs || !ys || !D) { console.log('usage: zarek <id> <x,..> <y,..> [z+|zo+|zo-|x+|x-|y+|y-] [<z,..>]'); process.exit(2); }
  for (const x of xs.split(',').map(Number)) for (const y of ys.split(',').map(Number)) for (const z of (zs || '0').split(',').map(Number)) {
    const o = mode && mode !== 'z+' ? [x, y, z] : [x, y, 0], d = G.ray(o, D, 6), ax = D.findIndex(v => v !== 0);
    console.log(`x ${x} y ${y} z ${z} ${mode || 'z+'}: ${d === Infinity ? 'nič' : 'xyz'[ax] + ' ' + (o[ax] + D[ax] * d).toFixed(3)}`); }
}

if (cmd === 'otoki') {
  const [el, n, only] = rest;
  if (!el || n == null) { console.log('usage: otoki <id> <element> <možnost> [lebdeci]'); process.exit(2); }
  const O = L.optionGeo(R, id, { [el]: +n }, el, true), GA = L.Grid(O.P, O.rest.concat(O.inner));
  for (const a of L.islands(O.P, O.part)) { const t = L.touches(O.P, a, GA, 0.006); if (only && t) continue;
    const b = L.boxOf(L.corners(O.P, a));
    console.log(a.length, b.map(v => v.map(q => q.toFixed(3)).join(',')).join(' .. '), 'dotik', t, 'razdalja', L.gap(O.P, a, GA, 0.3).toFixed(4)); }
}
