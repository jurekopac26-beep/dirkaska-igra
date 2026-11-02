// Special mission 52 · Hiša na tovornjaku (js/missions/m52.js, the kit js/missions/kit.js), no browser: its race (Big Sur, one run alone,
// the tractor on the racing truck's physics), the trailer behind it (MisKit.trailer: straight behind on a straight, cutting the inside of a
// bend), the room beside the house (the road's edge + K.OVER, on a narrow bridge the parapet), a scrape (a corner past it: HIŠA a third
// less; the third: failed), the oncoming cars waiting (PROMET ČAKA), the finish: done.
//   node tests/m52.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm52.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('52'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'bigsur'));
check('52: on Big Sur, a real track', D.track === 'bigsur' && !Core.TRACKS.find(t => t.id === 'bigsur').test);
const o = D.opts(D);
check('its race: one run alone, the tractor (the racing truck\'s physics on a copy, its own limiter), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel.vLim === K.VMAX && Core.MODELS.find(m => m.id === 'titan').vLim === 160);
const mk = (s) => { const i = T.idx(s); return { player: { q: { s, d: 0 }, x: T.px[i], z: T.pz[i], h: Math.atan2(T.tz[i], T.tx[i]), vx: 0, vz: 0, w: 0, m: { wid: 2.5, len: 6.8 }, finished: false }, track: T }; };
// along the road from s0 to s1 at d m across (0.5 m steps), the trailer following
const go = (r, s0, s1, d, each) => { for (let s = s0; s <= s1 && !r.end; s += 0.5) { const i = T.idx(s), P = r.P; P.q.s = s; P.q.d = d; P.x = T.px[i] + T.nx[i] * d; P.z = T.pz[i] + T.nz[i] * d; P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * 8; P.vz = T.tz[i] * 8; r.step(0.0625); if (each) each(s); } };
const s0 = T.startS;
let F = mk(s0), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: ŠIRINA TOVORA 6,4 m, PROSTOR L 2,1 · D 2,1, PROMET ČAKA 0, HIŠA 100 %', r.vals.sirina.text === '6,4 m' && r.vals.prostor.text === 'L 2,1 · D 2,1' && r.vals.promet.text === '0' && r.vals.hisa.text === '100 %', JSON.stringify(r.vals));
go(r, s0, s0 + 40, 0);
check('a straight: the trailer straight behind the tractor', Math.abs(r.tr.rel) < 0.01, r.tr.rel.toFixed(3));
// the sharpest bend: the trailer cuts its inside
let sB = 0, kB = 0; for (let s = s0 + 100; s < s0 + T.raceLen - 100; s += 5) { const i = T.idx(s - 10), j = T.idx(s + 10); let a = Math.atan2(T.tz[j], T.tx[j]) - Math.atan2(T.tz[i], T.tx[i]); a = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(a) > Math.abs(kB)) { kB = a; sB = s; } }
F = mk(sB - 80); r = new Missions.Run(D, F); D.begin.call(D, r);
let rel = 0, inside = 9, outside = 9; go(r, sB - 80, sB + 10, 0, () => { rel = Math.max(rel, Math.abs(r.tr.rel)); const inn = kB > 0 ? r.room[1] : r.room[0], out = kB > 0 ? r.room[0] : r.room[1]; inside = Math.min(inside, inn); outside = Math.min(outside, out); });
check('the sharpest bend down the middle: the trailer at an angle, the house\'s room on the inside of the bend less than on the outside', rel > 0.08 && inside < outside - 0.4, `${rel.toFixed(2)} ${inside.toFixed(2)} ${outside.toFixed(2)}`);
// a scrape on the left
F = mk(s0 + 60); r = new Missions.Run(D, F); D.begin.call(D, r);
go(r, s0 + 60, s0 + 120, -2.4);
check('2,4 m left of the middle: a scrape on the left (HIŠA 67 %), PROSTOR L negative, the hint says so', r.scr === 1 && r.vals.hisa.text === '67 %' && /^L −/.test(r.vals.prostor.text) && /levi: bolj desno/.test(r.hint), r.vals.prostor.text + ' ' + r.vals.hisa.text);
go(r, s0 + 120.5, s0 + 160, 0);
go(r, s0 + 160.5, s0 + 200, 2.4);
check('back to the middle, then 2,4 m right: the second scrape (HIŠA 33 %)', r.scr === 2 && r.vals.hisa.text === '33 %' && !r.end, r.vals.hisa.text);
go(r, s0 + 200.5, s0 + 240, 0); go(r, s0 + 240.5, s0 + 280, -2.4);
check('the third: failed, the house too damaged', r.end === 'fail' && /poškodovana/.test(r.why), r.why);
// a narrow bridge: the parapets close in (no room over the edge)
const [na, nb] = T.def.narrow[1], sN = s0 + (na + nb) / 2;
F = mk(sN - 60); r = new Missions.Run(D, F); D.begin.call(D, r); go(r, sN - 60, sN, 0);
const w = T.wS(sN);
check('on a narrow bridge down the middle: the room to the parapets only (' + (w - K.W / 2).toFixed(1) + ' m a side), the hint says the middle', Math.abs(r.room[0] - (w - K.W / 2)) < 0.3 && Math.abs(r.room[1] - (w - K.W / 2)) < 0.3 && /Most/.test(r.hint), JSON.stringify(r.room.map(x => +x.toFixed(2))));
go(r, sN + 0.5, sN + 40, 1.5);
check('1,5 m off the middle on it: a scrape', r.scr === 1, String(r.scr));
// the waiting cars: by the left edge, counted ahead
F = mk(s0 + 300); r = new Missions.Run(D, F); D.begin.call(D, r); go(r, s0 + 300, s0 + 301, 0);
check('PROMET ČAKA: the waiting cars ahead within K.SEE m (' + r.vals.promet.text + ')', +r.vals.promet.text === K.WAIT.filter(s => s - 301 > -10 && s - 301 < K.SEE).length && +r.vals.promet.text >= 1);
check('the waiting cars stand by the left edge (the house passes them down the middle-right)', r.cars.every(c => { const q = T.query(c.x, c.z, T.idx(c.s), {}); return q.d < -2.5; }));
F = mk(s0 + 100); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.finished = true; r.step(0.1);
check('over the finish line: done', r.end === 'win', String(r.end));
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
