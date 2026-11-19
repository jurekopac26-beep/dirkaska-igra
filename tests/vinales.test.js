// Viñales, Kuba: a short road of docs/gorske-proge.md (track 17). The checks every such road has (tests/lib/gore.js: the name, the four ways
// to drive it, 1-1.5 km (a short valley road between the mogotes), the data of the import, the bends, the legs apart, a whole race and a duel in the traffic on autopilot, the medals).
//   node tests/vinales.test.js
'use strict';
const { goreTrack } = require('./lib/gore.js');
const G = goreTrack('vinales', { km: [1, 1.5] });
G.done();
