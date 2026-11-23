// The second half of world.test.mjs's tracks (every other one from the second): each world's fingerprint against the reference, as there
// (the two parts split for GitHub's time limit: over 30 min with every track in one; tests/run.js SECS)
//   node tests/browser/world2.test.mjs
process.env.WORLD_DEL = '2';
await import('./world.test.mjs');
