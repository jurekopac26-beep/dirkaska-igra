// The second half of gfx.test.mjs's tracks (every other one from the second): the car glint, the water and its shore, the worn tarmac on
// each, as there (the two parts split for GitHub's time limit: over 30 min with every track in one; tests/run.js SECS)
//   node tests/browser/gfx2.test.mjs
process.env.GFX_DEL = '2';
await import('./gfx.test.mjs');
