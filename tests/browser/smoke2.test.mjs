// The second half of smoke.test.mjs's tracks (every other one from the second): the same 20 s race and corner sign on each, then the
// title demo, the rain and the runs to the finish (5-6e) (the two parts split for GitHub's time limit: over 60 min with every track in
// one; tests/run.js SECS)
//   node tests/browser/smoke2.test.mjs
process.env.SMOKE_DEL = '2';
await import('./smoke.test.mjs');
