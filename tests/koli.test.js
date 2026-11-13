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
}
G.done();
