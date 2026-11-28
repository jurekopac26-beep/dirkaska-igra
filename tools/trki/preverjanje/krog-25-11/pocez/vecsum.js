// node vecsum.js base.jsonl var.jsonl ...: aggregate and compare with the first
const fs = require('fs'); const rd = (p) => fs.readFileSync(p, 'utf8').trim().split('\n').map(x => JSON.parse(x));
const f = (v, d = 1) => v == null ? '-' : v.toFixed(d);
const B = rd(process.argv[2]);
for (const p of process.argv.slice(2)) { const L = rd(p);
  const s = (k) => L.reduce((a, r) => a + r[k], 0);
  let later = 0, sooner = 0, dLast = 0, worstLast = 0, stLonger = 0, dmgUp = 0, dmgDn = 0;
  L.forEach((r, i) => { const b = B[i], a = r.lastPast == null ? 90 : r.lastPast, c = b.lastPast == null ? 90 : b.lastPast; if (a > c + 0.05) later++; else if (a < c - 0.05) sooner++; dLast += a - c; if (a - c > worstLast) worstLast = a - c; if (r.maxStop > b.maxStop + 0.05) stLonger++;
    const da = r.riv + r.pDmg, db = b.riv + b.pDmg; if (da > db + 0.05) dmgUp++; else if (da < db - 0.05) dmgDn++; });
  console.log(`${p.replace(/.*\//, '').padEnd(16)} n ${L.length}  škoda Σ ${f(s('riv') + s('pDmg'))} (v počez ${f(s('byP'), 0)} / v druge ${f(s('byC'), 0)} / ograja ${f(s('byW'), 0)}; avto počez ${f(s('pDmg'), 0)})  v zadnjih 150 m: v počez ${f(s('nP'), 0)} / v druge ${f(s('nC'), 0)} / ograja ${f(s('nW'), 0)}  mimo ${s('past')}/${L.length * 12}, tekov z vsemi ${L.filter(r => r.past === 12).length}  zadnji mimo povp ${f(L.reduce((a, r) => a + (r.lastPast == null ? 90 : r.lastPast), 0) / L.length)}  Σmimo ${f(s('sumPast'), 0)}  stoji: max ${f(Math.max(...L.map(r => r.maxStop)))} Σ ${f(s('sumStop'), 0)} n ${s('nStop')}  | proti osnovi: zadnji pozneje v ${later}, prej v ${sooner} (povp ${f(dLast / L.length, 2)} s, najslabše +${f(worstLast)}), daljše stanje v ${stLonger}, škoda večja v ${dmgUp}, manjša v ${dmgDn}`); }
