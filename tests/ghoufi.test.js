// Ghoufi, Alžirija: a short road of docs/gorske-proge.md (track 17). The checks every such road has (tests/lib/gore.js: the name, the four ways
// to drive it, 0.5-0.65 km, the data of the import, the bends, the legs apart, a whole race and a duel in the traffic on autopilot, the medals)
// and this road's own below.
//   node tests/ghoufi.test.js
'use strict';
const { goreTrack } = require('./lib/gore.js');
const G = goreTrack('ghoufi', { km: [0.5, 0.65] });
G.done();
