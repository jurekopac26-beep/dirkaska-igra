// Santiago de Cuba, Kuba: a short road of docs/gorske-proge.md (track 17), 0.5-1 km to the fortress of El Morro. The checks every such road has (tests/lib/gore.js: the name, the four ways
// to drive it, the length, the data of the import, the bends, the legs apart, a whole race and a duel in the traffic on autopilot, the medals)
// and this road's own below.
//   node tests/morro.test.js
'use strict';
const { goreTrack } = require('./lib/gore.js');
const G = goreTrack('morro', { km: [0.5, 1] });   // (a short track with a landmark: 0.5-1 km, docs/proge-po-drzavah.md)
const { def, T } = G, gate = [-731.2, 134.1];
G.check('the fortress: the finish under 250 m from its gate (the fortress ahead past the line), the road ending under it, the sea round the headland', Math.hypot(def.finish[0] - gate[0], def.finish[1] - gate[1]) < 250 &&
  Math.hypot(T.px[T.px.length - 1] - gate[0], T.pz[T.pz.length - 1] - gate[1]) < 60 && def.theme === 'morro',
  `finish ${Math.round(Math.hypot(def.finish[0] - gate[0], def.finish[1] - gate[1]))} m, road's end ${Math.round(Math.hypot(T.px[T.px.length - 1] - gate[0], T.pz[T.pz.length - 1] - gate[1]))} m from the gate`);
G.done();
