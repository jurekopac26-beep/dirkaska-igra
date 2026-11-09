// (testi) the fingerprint of Killar's road heights as they are now (T.hy, T.grade, T.curv): what "strength 0 = the road bit for bit as now"
// can be checked against.  node testi-hy-hash.js   (GAME_ROOT: another copy of the game)
'use strict';
const path = require('path'), crypto = require('crypto'), REPO = require('path').join(__dirname, '..', '..');
const { loadCore } = require(path.join(REPO, 'tests/lib/core.js'));
const C = loadCore(), def = C.TRACKS.find(d => d.id === 'killar'), T = new C.Track(def);
const h = (a) => crypto.createHash('sha256').update(Buffer.from(Float64Array.from(a).buffer)).digest('hex').slice(0, 16);
console.log(JSON.stringify({ N: T.N, type: { hy: T.hy.constructor.name, grade: T.grade.constructor.name, curv: T.curv.constructor.name }, hy: h(T.hy), grade: h(T.grade), curv: h(T.curv),
  min: +Math.min(...T.hy).toFixed(4), max: +Math.max(...T.hy).toFixed(4), cross: ['bank', 'camber', 'roll', 'tilt', 'cross', 'hb', 'bankA'].filter(k => T[k] != null) }));
