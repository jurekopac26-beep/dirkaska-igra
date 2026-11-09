// (testi) the fingerprint of every track's road (the test tracks too, which the golden tests skip): T.hy, T.grade, T.curv and the co-driver's
// calls, one line a track. Run before and after a change of js/core.js and compare (diff): only killar's line may differ.
//   node testi-hy-vse.js > before.txt   (GAME_ROOT: another copy of the game)
'use strict';
const path = require('path'), crypto = require('crypto'), REPO = require('path').join(__dirname, '..', '..');
const { loadCore } = require(path.join(REPO, 'tests/lib/core.js'));
const C = loadCore(), h = (a) => crypto.createHash('sha256').update(Buffer.from(Float64Array.from(a || []).buffer)).digest('hex').slice(0, 12);
for (const def of C.TRACKS) {
  let line; try { const T = new C.Track(def); let notes = '-'; try { notes = crypto.createHash('sha256').update(JSON.stringify(T.paceNotes().map(c => [Math.round(c.s * 100), c.text]))).digest('hex').slice(0, 12); } catch (e) { notes = 'err'; }
    line = `${T.N} hy ${h(T.hy)} grade ${h(T.grade)} curv ${h(T.curv)} notes ${notes} puddles ${(T.puddles || []).length}`; } catch (e) { line = 'ERR ' + e.message; }
  console.log(def.id.padEnd(14) + (def.test ? 'test ' : '     ') + line);
}
