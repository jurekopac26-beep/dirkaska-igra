// Yungas, Bolivija: the tanker's short road of docs/proge-cisterna.md (track 4). The checks every such road has (tests/lib/cisterna-proge.js:
// the name, the tanker only against the clock, up to 500 m, the data of the import, narrow, the drops, the tanker on the autopilot to the finish
// without a fall, the medals) and this road's own below.
//   node tests/yungas.test.js
'use strict';
const { cisternaTrack } = require('./lib/cisterna-proge.js');
const G = cisternaTrack('yungas');
G.done();
