// Koli, Finska: a short road of docs/gorske-proge.md (track 17). The checks every such road has (tests/lib/gore.js: the name, the four ways
// to drive it, the data of the import, the bends, the legs apart, a whole race and a duel in the traffic on autopilot, the medals),
// here 1.9-2.1 km (docs/proge-po-drzavah.md, »Finska: Koli«: 2 km), and this road's own below.
//   node tests/koli.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { goreTrack } = require('./lib/gore.js');
const G = goreTrack('koli', [1900, 2100]);
const { def, T, check } = G;
// Sever v snegu: the world is in the snow in every season (World.gore, snow 'all'), the road has no lines under the packed snow
{
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'world-koli.js'), 'utf8');
  check('winter: the world of Koli is snowy in every season', /snow:\s*'all'/.test(src));
  check('winter: no lines on the ploughed road', /line:\s*'none'/.test(src));
  check('winter: the medals have their winter times', !!(def.medals && def.medals.winter && def.medals.winter.cs));
  // packed snow on 10-20 % of the road only (the user's choice, 28. 11.), and the snowfall over the same span
  const L = T.finishS - T.startS, snow = (def.surf || []).filter(p => p[2] === 'makadam'), on = snow.reduce((a, p) => a + Math.max(0, Math.min(p[1], L) - Math.max(p[0], 0)), 0);
  check('winter: packed snow on 10-20 % of the road (' + Math.round(on / L * 100) + ' %)', on >= 0.1 * L && on <= 0.2 * L);
  const m = /SNOW = \[(\d+), (\d+)\]/.exec(src);
  check('winter: it snows where the packed snow lies', !!m && snow.some(p => p[0] === +m[1] && p[1] === +m[2]));
}
G.done();
