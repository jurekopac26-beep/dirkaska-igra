// The quick entry's address (hitri vstop, Core.quickArgs; the game itself in tests/browser/quick.test.mjs): ?proga=<id>&nacin=<way>&t=<s>
// &vreme=suho|dez&avto=<id> read and checked against the tracks and the vehicles. Every track by its id; the ways in Slovene and as the
// code names them, only those the track has; t in seconds (a decimal comma too, up to an hour); the weather; a car by its id (a retired
// one's heir); what is not valid listed as written; no proga: nothing.
// &seme=<n>: the test mode's seed (repeatable races, sklop 16; the game: tests/browser/repro.test.mjs).
//   node tests/quick.test.js
'use strict';
const { loadCore } = require('./lib/core');
const Core = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const Q = Core.quickArgs, J = JSON.stringify;

check('no proga: nothing (also an empty address, other parameters only)', Q('') === null && Q('?') === null && Q('?t=3&vreme=dez') === null && Q('?menu=old') === null);
{
  const miss = Core.TRACKS.filter(d => { const q = Q('?proga=' + d.id); return !q || q.track !== d.id || q.bad.length; }).map(d => d.id);
  check(`every track by its id (${Core.TRACKS.length})`, !miss.length, miss.join(', '));
}
{
  const q = Q('?proga=bathurst');
  check('?proga=bathurst: the track, nothing else asked', J(q) === J({ track: 'bathurst', mode: null, t: null, weather: null, car: null, seed: null, bad: [] }), J(q));
  check('the id in capitals and with spaces: the track', Q('?proga=%20Spa%20').track === 'spa');
}
{
  const ways = [['dirka', 'race'], ['race', 'race'], ['kronometer', 'tt'], ['tt', 'tt'], ['promet', 'traffic'], ['traffic', 'traffic'], ['policija', 'police'], ['police', 'police']];
  const got = ways.map(([w, m]) => [w, Q('?proga=vrsic&nacin=' + w).mode === m]);
  check('the ways on Vršič: in Slovene and as the code names them', got.every(g => g[1]), got.filter(g => !g[1]).map(g => g[0]).join(', '));
  check('a track without ways: only its own (Bathurst a race, not a time trial; Pikes Peak a time trial or a race)', Q('?proga=bathurst&nacin=dirka').mode === 'race' && Q('?proga=bathurst&nacin=tt').mode === null && Q('?proga=bathurst&nacin=tt').bad.join() === 'nacin=tt' && Q('?proga=pikes&nacin=kronometer').mode === 'tt' && Q('?proga=moki&nacin=policija').mode === null);
}
{
  const ts = [['20', 20], ['12.5', 12.5], ['12,5', 12.5], ['0', 0], ['3600', 3600]].map(([s, v]) => [s, Q('?proga=spa&t=' + s).t === v]);
  const no = ['-1', '3601', 'abc', '', '1e9'].map(s => [s, Q('?proga=spa&t=' + encodeURIComponent(s))]).filter(([s, q]) => q.t !== null || q.bad.join() !== 't=' + s);
  check('t: seconds, a decimal point or comma, 0 to 3600; anything else not valid', ts.every(g => g[1]) && !no.length, ts.filter(g => !g[1]).map(g => g[0]).concat(no.map(g => g[0])).join(', '));
}
check('vreme: suho, dez (dež): dry, rain', Q('?proga=spa&vreme=suho').weather === 'dry' && Q('?proga=spa&vreme=dez').weather === 'rain' && Q('?proga=spa&vreme=de%C5%BE').weather === 'rain' && Q('?proga=spa&vreme=DEZ').weather === 'rain' && Q('?proga=spa&vreme=sneg').weather === null);
{
  const miss = Core.MODELS.filter(m => !m.retired && Q('?proga=spa&avto=' + m.id).car !== m.id).map(m => m.id);
  const ret = Core.MODELS.filter(m => m.retired).map(m => [m.id, Q('?proga=spa&avto=' + m.id).car, Core.heirOf(m).id]);
  check('avto: every vehicle by its id, a retired one\'s heir', !miss.length && ret.every(r => r[1] === r[2]), miss.join(', ') + ' ' + J(ret));
}
{
  const ok = [['5', 5], ['1', 1], [' 42 ', 42], ['2147483647', 2147483647]].map(([v, x]) => [v, Q('?proga=spa&seme=' + encodeURIComponent(v)).seed === x]);
  const no = ['0', '-3', '2.5', 'abc', '', '2147483648'].map(v => [v, Q('?proga=spa&seme=' + encodeURIComponent(v))]).filter(([v, q]) => q.seed !== null || q.bad.join() !== 'seme=' + v);
  check('seme: the test mode\'s seed, a whole number from 1 (to 2^31 - 1); anything else not valid', ok.every(g => g[1]) && !no.length, ok.filter(g => !g[1]).map(g => g[0]).concat(no.map(g => g[0])).join(', '));
}
{
  const q = Q('?proga=nikjer&nacin=letenje&t=-3&vreme=sneg&avto=letalo');
  check('what is not valid: listed as written, in order; the rest null', J(q) === J({ track: null, mode: null, t: null, weather: null, car: null, seed: null, bad: ['proga=nikjer', 'nacin=letenje', 't=-3', 'vreme=sneg', 'avto=letalo'] }), J(q));
  const all = Q('?proga=vrsic&nacin=promet&t=20&vreme=dez&avto=bizon');
  check('all at once: ?proga=vrsic&nacin=promet&t=20&vreme=dez&avto=bizon', J(all) === J({ track: 'vrsic', mode: 'traffic', t: 20, weather: 'rain', car: 'bizon', seed: null, bad: [] }), J(all));
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
