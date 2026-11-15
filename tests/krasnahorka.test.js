// Krásna Hôrka, Slovaška: a short road of docs/gorske-proge.md (track 17). The checks every such road has (tests/lib/gore.js: the name, the four ways
// to drive it, 0.55-0.75 km (a short road to a landmark), the data of the import, the bends, the legs apart, a whole race and a duel in the traffic on autopilot, the medals)
// and this road's own below.
//   node tests/krasnahorka.test.js
'use strict';
const { goreTrack } = require('./lib/gore.js');
const G = goreTrack('krasnahorka', { km: [0.55, 0.75] });
G.done();
