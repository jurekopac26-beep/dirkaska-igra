// Puts a content hash on every local script and stylesheet link in index.html (e.g. js/core.js?v=1a2b3c4d), so browsers
// and the GitHub Pages cache never mix old and new files after an update.
//   node tools/stamp.js           update index.html (run after changing any js/ or css/ file)
//   node tools/stamp.js --check   only check: exit 1 if a link is missing, points to a missing file or has an old stamp
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.env.GAME_ROOT ? path.resolve(process.env.GAME_ROOT) : path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'index.html');
const check = process.argv.includes('--check');
const html = fs.readFileSync(FILE, 'utf8');
const problems = [];
let n = 0;
const out = html.replace(/(<script\b[^>]*\bsrc="|<link\b[^>]*\bhref=")([^"?#:]+)(\?v=[0-9a-f]*)?"/g, (all, pre, file, old) => {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) { problems.push('missing file: ' + file); return all; }
  const v = '?v=' + crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex').slice(0, 8);
  n++;
  if (old !== v) problems.push(`${file}: ${old ? 'old stamp ' + old : 'no stamp'} (now ${v})`);
  return pre + file + v + '"';
});
if (check) {
  for (const p of problems) console.log('FAIL ' + p);
  console.log(problems.length ? `FAIL: ${problems.length} link(s) out of date — run: node tools/stamp.js` : `OK: all ${n} links in index.html carry the current stamp`);
  process.exit(problems.length ? 1 : 0);
}
if (out !== html) fs.writeFileSync(FILE, out);
console.log(`stamped ${n} links (${problems.filter(p => !p.startsWith('missing')).length} changed)` + (problems.some(p => p.startsWith('missing')) ? '; ' + problems.filter(p => p.startsWith('missing')).join('; ') : ''));
