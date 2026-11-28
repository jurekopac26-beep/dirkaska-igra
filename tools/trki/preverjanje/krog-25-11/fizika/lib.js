'use strict';
// skupna pomozna knjiznica neodvisnega preverjanja (pogled Fizika trka); nic v repozitoriju
const path = require('path');
// SNAP = koren veje (privzeto ta repozitorij; meritve 25. 11. so na 8527ac8), MAIN = delovno drevo z main (meritve: 1e42a0b):
//   git worktree add --detach <mapa> origin/main && TRKI_MAIN=<mapa> node tools/trki/preverjanje/krog-25-11/fizika/<ime>.js
const SNAP = process.env.TRKI_SNAP || path.join(__dirname, '..', '..', '..', '..', '..');
const MAIN = process.env.TRKI_MAIN || '';
function load(root) {
  if (!root) throw new Error('nastavi TRKI_MAIN=<delovno drevo z main> (git worktree add --detach <mapa> origin/main)');
  const { loadCore } = require(path.join(root, 'tests', 'lib', 'core.js'));
  const C = loadCore(root);
  const SIM = require(path.join(root, 'tests', 'lib', 'sim.js'));
  const handling = require(path.join(root, 'tests', 'lib', 'handling.js'));
  return { C, SIM, handling, root };
}
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
module.exports = { SNAP, MAIN, load, rng };
// instrumentirana kopija jedra v pomnilniku (drevo ostane nedotaknjeno): patches = [[iskano, zamenjava], ...]
function loadInst(root, patches) {
  const { coreSource } = require(path.join(root, 'tests', 'lib', 'core.js'));
  let code = coreSource(root);
  for (const [a, b] of patches) { if (!code.includes(a)) throw new Error('patch ne najde: ' + a.slice(0, 60)); code = code.replace(a, b); }
  const fm = { exports: {} };
  const C = new Function('module', 'exports', 'require', code + '\n;return Core;')(fm, fm.exports, require);
  return { C, SIM: require(path.join(root, 'tests', 'lib', 'sim.js')), handling: require(path.join(root, 'tests', 'lib', 'handling.js')), root };
}
module.exports.loadInst = loadInst;
