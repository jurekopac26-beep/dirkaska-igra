// Mount Buller, Avstralija: a short road of docs/gorske-proge.md (track 1). The checks every such road has (tests/lib/gore.js: the name, the four ways
// to drive it, 2.5-3 km, the data of the import, the bends, the legs apart, a whole race and a duel in the traffic on autopilot, the medals)
// and this road's own below.
//   node tests/mountbuller.test.js
'use strict';
const { goreTrack } = require('./lib/gore.js');
const G = goreTrack('mountbuller');
G.done();
