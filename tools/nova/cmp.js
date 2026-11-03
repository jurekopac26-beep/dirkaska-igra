// compare sweep files: node cmp.js a.jsonl [b.jsonl] — per track cs vs nova (and nova of b)
'use strict';
const fs = require('fs');
const rd = (f) => fs.readFileSync(f, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const A = rd(process.argv[2]), B = process.argv[3] ? rd(process.argv[3]) : null;
const get = (R, t, p) => R.find(r => r.tid === t && r.phys === p);
const tids = [...new Set(A.map(r => r.tid))];
const f = (v, d = 0) => v == null ? '-' : (+v).toFixed(d);
const sum = { cs: {}, nova: {}, nb: {} };
const add = (k, o) => { if (!o || o.err) return; for (const x of ['hits', 'walls', 'slides', 'slides20', 'stuck']) sum[k][x] = (sum[k][x] || 0) + o[x]; sum[k].kerb = (sum[k].kerb || 0) + o.kerb; sum[k].off = (sum[k].off || 0) + o.off; sum[k].n = (sum[k].n || 0) + 1; if (o.nan) sum[k].nan = (sum[k].nan || 0) + 1; };
console.log('track          | cs: hits walls sl40 sl20 kerb% off% lapMed | nova: hits walls sl40 sl20 kerb% off% lapMed ratio' + (B ? ' | new nova: hits walls sl40 sl20 kerb% off% ratio stuck' : ''));
for (const t of tids) {
  const c = get(A, t, 'cs'), n = get(A, t, 'nova'), m = B && get(B, t, 'nova');
  add('cs', c); add('nova', n); add('nb', m);
  const row = (o, ref) => !o ? '-' : o.err ? 'ERR ' + o.err.slice(0, 40) : `${f(o.hits)} ${f(o.walls)} ${f(o.slides)} ${f(o.slides20)} ${f(o.kerb * 100, 1)} ${f(o.off * 100, 1)} ${f(o.lapMed, 1)} ${ref && ref.lapMed && o.lapMed ? f(o.lapMed / ref.lapMed, 3) : ''}${o.nan ? ' NAN' : ''}${o.stuck ? ' stuck' + o.stuck : ''}`;
  console.log(`${t.padEnd(14)} | ${row(c)} | ${row(n, c)}${B ? ' | ' + row(m, c) : ''}`);
}
for (const k in sum) if (sum[k].n) console.log(k, JSON.stringify(sum[k]), 'kerb avg', (sum[k].kerb / sum[k].n * 100).toFixed(1), 'off avg', (sum[k].off / sum[k].n * 100).toFixed(2));
