// Cusco, Peru: a short road of docs/gorske-proge.md (track 21). The checks every such road has (tests/lib/gore.js: the name, the four ways
// to drive it, 0.9-1 km, the data of the import, the bends, the legs apart, a whole race and a duel in the traffic on autopilot, the medals)
// and this road's own below: the landmark (the walls of Sacsayhuamán, js/world-cusco.js) mid-race, near the road.
//   node tests/cusco.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { goreTrack } = require('./lib/gore.js');
const G = goreTrack('cusco', [900, 1000]);
{
  // the walls' points (as the builder has them) and the race's road: the nearest the walls come, where in the race, how far from the road
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'world-cusco.js'), 'utf8'), T = G.T;
  const walls = [...src.matchAll(/p: \[([-\d.,\s]+)\]/g)].map(m => m[1].split(',').map(Number));
  const near = walls.map(p => { let b = 1e9, bs = 0; for (let k = 0; k + 1 < p.length; k += 2) for (let i = 0; i < T.px.length; i++) {
    const s = i * T.len / T.px.length; if (s < T.startS || s > T.finishS) continue; const d = Math.hypot(T.px[i] - p[k], T.pz[i] - p[k + 1]); if (d < b) { b = d; bs = s; } }
    return [b, (bs - T.startS) / T.raceLen]; });
  const best = near.reduce((a, c) => c[0] < a[0] ? c : a, [1e9, 0]);
  G.check('landmark: three walls of Sacsayhuamán, the nearest within 25-60 m of the road, 25-75 % into the race', walls.length === 3 && best[0] > 15 && best[0] < 60 && best[1] > 0.25 && best[1] < 0.75,
    `${walls.length} walls, ${best[0].toFixed(0)} m from the road at ${(best[1] * 100).toFixed(0)} %`);
}
{
  const { C, def, T } = G, check = G.check;
  // Realizem E: the side roads from OpenStreetMap (def.stranske, World.cesta.stranske) only for the look: the track's model the same
  // without them (the line, the heights, the barriers' lines), each road from its mouth at most ~60 m into the land
  const T0 = new C.Track(Object.assign({}, def, { stranske: undefined })), same = ['px', 'pz', 'hy', 'bl', 'br'].every(k => T0[k].length === T[k].length && T0[k].every((v, i) => v === T[k][i]));
  const len = def.stranske.map(r => { let l = 0; for (let k = 2; k + 1 < r[6].length; k += 2) l += Math.hypot(r[6][k] - r[6][k - 2], r[6][k + 1] - r[6][k - 1]); return l; });
  check('road: the one side road from OpenStreetMap (Realizem E) only for the look: the model the same without them, each at most ~60 m from the road',
    def.stranske.length === 1 && same && len.every(l => l > 5 && l < 70), `${def.stranske.length} roads, ${Math.min(...len).toFixed(0)}-${Math.max(...len).toFixed(0)} m`);
}
G.done();
