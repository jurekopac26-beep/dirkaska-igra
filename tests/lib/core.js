// Loads the game's Core module (tracks, physics, AI, race rules) into Node: no DOM, no three.js.
// Works with the split layout (index.html + js/*.js, the scripts are read in the order index.html lists them)
// and with an old single-file index.html (the Core IIFE is cut out of the inline script).
'use strict';
const fs = require('fs');
const path = require('path');

// the game folder under test: the repo itself, or another copy given in GAME_ROOT (e.g. an older version)
const ROOT = process.env.GAME_ROOT ? path.resolve(process.env.GAME_ROOT) : path.resolve(__dirname, '..', '..');

// the <script src> files of a page, in order (vendor libraries skipped: Core needs none of them)
function pageScripts(htmlFile) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  return [...html.matchAll(/<script\b[^>]*\bsrc="([^"?#]+)[^"]*"/g)].map(m => m[1]).filter(s => !/(^|\/)vendor\//.test(s));
}

// source text that defines `Core` (plus any data scripts it reads)
function coreSource(where) {
  const htmlFile = where && where.endsWith('.html') ? where : path.join(where || ROOT, 'index.html');
  const dir = path.dirname(htmlFile);
  const srcs = pageScripts(htmlFile);
  const k = srcs.findIndex(s => /(^|\/)core\.js$/.test(s));
  if (k >= 0) return srcs.slice(0, k + 1).map(s => fs.readFileSync(path.join(dir, s), 'utf8')).join('\n;\n');
  const html = fs.readFileSync(htmlFile, 'utf8');
  const a = html.indexOf('const Core = (function () {');
  const b = html.indexOf('\n})();', a);
  if (a < 0 || b < 0) throw new Error('Core not found in ' + htmlFile);
  return html.slice(a, b + 6);
}

// a fresh, independent Core every call (no shared state between loads). When loading fails (a vehicle or track file that declares a
// top-level name another file declares too, or touches THREE / window while loading), the error names the file: the page's scripts
// are run again one by one in an empty sandbox, and the first that throws is the culprit
function loadCore(where) {
  const code = coreSource(where) + '\n;return Core;';
  const fakeModule = { exports: {} };
  try { return new Function('module', 'exports', 'require', code)(fakeModule, fakeModule.exports, require); }
  catch (e) { const f = culprit(where); if (f) e.message += ' (in ' + f + ')'; throw e; }
}
function culprit(where) {
  const vm = require('vm'), htmlFile = where && where.endsWith('.html') ? where : path.join(where || ROOT, 'index.html'), dir = path.dirname(htmlFile);
  const srcs = pageScripts(htmlFile), k = srcs.findIndex(s => /(^|\/)core\.js$/.test(s)), ctx = vm.createContext({});
  for (const s of k >= 0 ? srcs.slice(0, k + 1) : []) { try { vm.runInContext(fs.readFileSync(path.join(dir, s), 'utf8'), ctx, { filename: s }); } catch (e) { return s; } }
  return '';
}

module.exports = { loadCore, coreSource, pageScripts, ROOT };
