'use strict';
// skupna pomozna knjiznica neodvisnega preverjanja (pogled Fizika trka); nic v repozitoriju
const path = require('path');
const SNAP = (process.env.TRKI_SNAP || require('path').join(__dirname, '..', '..', '..', '..', '..')) + '';
const MAIN = (process.env.TRKI_MAIN || '') + '';
function load(root) {
  const { loadCore } = require(path.join(root, 'tests', 'lib', 'core.js'));
  const C = loadCore(root);
  const SIM = require(path.join(root, 'tests', 'lib', 'sim.js'));
  const handling = require(path.join(root, 'tests', 'lib', 'handling.js'));
  return { C, SIM, handling, root };
}
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const WT = (process.env.TRKI_F1 || '') + '';
const PO = process.env.ROOT === 'po', ROOT = PO ? WT : SNAP;   // ROOT=po: drevo s popravkom (wt-f1); sicer posnetek veje (pred)
module.exports = { SNAP, MAIN, WT, PO, ROOT, load, rng };
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
