// Viñales, Kuba: a short road of docs/gorske-proge.md (track 17). The checks every such road has (tests/lib/gore.js: the name, the four ways
// to drive it, 0.5-1 km (a short track with a landmark), the data of the import, the bends, the legs apart, a whole race and a duel in the traffic on autopilot, the medals)
// its bends gentle (a valley road between the mogotes).
//   node tests/vinales.test.js
'use strict';
const { goreTrack } = require('./lib/gore.js');
const G = goreTrack('vinales', { km: [0.5, 1], gentle: true });
G.done();
