// Isuna, Butan: a short road of docs/gorske-proge.md (track 17). The checks every such road has (tests/lib/gore.js: the name, the four ways
// to drive it, 3-3.6 km (the landmark's road: the chain bridge at the race's middle), a road up the valley without a sharp bend, the data of the import, the bends, the legs apart, a whole race and a duel in the traffic on autopilot, the medals)
// and this road's own below.
//   node tests/isuna.test.js
'use strict';
const { goreTrack } = require('./lib/gore.js');
const G = goreTrack('isuna', { km: [3, 3.6], valley: true });
G.done();
