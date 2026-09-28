// Puts a content hash on every local script and stylesheet link in index.html (e.g. js/core.js?v=1a2b3c4d), so browsers
// and the GitHub Pages cache never mix old and new files after an update.
//   node tools/stamp.js           update index.html (run after changing any js/ or css/ file)
//   node tools/stamp.js --check   only check: exit 1 if a link points to a missing file or has an old (or no) stamp
// Every <script src> and <link href> to a local file counts, whatever the quotes or other query parameters; the hash
// ignores line endings (CRLF or LF), so a copy checked out on Windows gets the same stamps.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.env.GAME_ROOT ? path.resolve(process.env.GAME_ROOT) : path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'index.html');
const check = process.argv.includes('--check');
const html = fs.readFileSync(FILE, 'utf8');
const problems = [];
let n = 0, changed = 0;

// the content stamp of a file: sha256 of its bytes with CRLF read as LF, first 8 hex digits
const stampOf = (file) => crypto.createHash('sha256').update(fs.readFileSync(file).toString('latin1').replace(/\r\n/g, '\n'), 'latin1').digest('hex').slice(0, 8);
// a link to a file of the game (not http:, https:, data:, //host or #anchor)
const isLocal = (u) => u !== '' && !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);

const comments = [...html.matchAll(/<!--[\s\S]*?-->/g)].map(m => [m.index, m.index + m[0].length]);
const inComment = (i) => comments.some(([a, b]) => i >= a && i < b);

const out = html.replace(/<(script|link)\b[^>]*>/gi, (tag, name, at) => {
  if (inComment(at)) return tag;
  const attr = name.toLowerCase() === 'script' ? 'src' : 'href';
  return tag.replace(new RegExp(`(\\b${attr}\\s*=\\s*)("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'), (all, pre, quoted, dq, sq, bare) => {
    const url = dq != null ? dq : sq != null ? sq : bare, q = dq != null ? '"' : sq != null ? "'" : '';
    const [, file, query = '', hash = ''] = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(url);
    if (!isLocal(file)) return all;
    const full = path.join(ROOT, decodeURIComponent(file));
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) { problems.push('missing file: ' + file); return all; }
    n++;
    const v = stampOf(full), params = query ? query.slice(1).split('&').filter(Boolean) : [];
    const k = params.findIndex(p => p.split('=')[0] === 'v'), old = k >= 0 ? params[k].slice(2) : null;
    if (old === v) return all;
    changed++; problems.push(`${file}: ${old ? 'old stamp ' + old : 'no stamp'} (now ${v})`);
    if (k >= 0) params[k] = 'v=' + v; else params.push('v=' + v);
    return pre + q + file + '?' + params.join('&') + hash + q;
  });
});

if (check) {
  for (const p of problems) console.log('FAIL ' + p);
  console.log(problems.length ? `FAIL: ${problems.length} link(s) with a problem — ` + (changed ? 'run: node tools/stamp.js' : 'a linked file is missing') : `OK: all ${n} links in index.html carry the current stamp`);
  process.exit(problems.length ? 1 : 0);
}
if (out !== html) fs.writeFileSync(FILE, out);
const missing = problems.filter(p => p.startsWith('missing'));
console.log(`stamped ${n} links (${changed} changed)` + (missing.length ? '; ' + missing.join('; ') : ''));
process.exit(missing.length ? 1 : 0);
