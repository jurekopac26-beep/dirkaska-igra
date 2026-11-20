// The second half of memory.test.mjs's tracks (every other one from the second): the same rounds over them, the restart, the car menu
// and the title race, the same measurements (the two parts split for GitHub's time limit: over 2 h with every track in one; tests/run.js SECS)
//   node tests/browser/memory2.test.mjs
process.env.MEM_DEL = '2';
await import('./memory.test.mjs');
