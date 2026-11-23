// Longyearbyen, Norveška: a short road of docs/gorske-proge.md (track 17). The checks every such road has (tests/lib/gore.js: the name, the four ways
// to drive it, the length, the data of the import, the bends, the legs apart, a whole race and a duel in the traffic on autopilot, the medals)
// and this road's own below.
//   node tests/longyearbyen.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { goreTrack } = require('./lib/gore.js');
// 4.3 km: the roads 600, 500 and 100 from the fjord shore through the town to Nybyen (the rule's 1-5 km; the plan's 2.5-3 km is too short for the town)
const G = goreTrack('longyearbyen', { km: [4.1, 4.5] });
const { def, check } = G;
// Svalbard: snow in every season, no lines under the packed snow, no trees (the tundra), the winter medals; ice has no physics of its own (the driving physics stays)
{
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'world-longyearbyen.js'), 'utf8');
  check('winter: the world of Longyearbyen is snowy in every season', /snow:\s*'all'/.test(src));
  check('winter: no lines on the ploughed road', /line:\s*'none'/.test(src));
  check('winter: the medals have their winter times', !!(def.medals && def.medals.winter && def.medals.winter.cs));
  check('tundra: no trees along the road (land cover none)', !/forest:\s*[1-9]/.test(src) && !(def.trees && def.trees.length));
  check('the description says where: Svalbard, Adventfjorden, Nybyen', /Svalbard/.test(def.desc) && /Adventfjord/.test(def.desc) && /Nybyen/.test(def.en.desc));
}
G.done();
