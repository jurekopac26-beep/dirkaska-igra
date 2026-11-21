// I17 korak 7 (docs/hitro-nalaganje.md): the published site's JavaScript minified, after its stamps (.github/workflows/stran.yml, after
// »Preverba žigov«). The repository and the tests stay as written; only the copy that goes out to GitHub Pages is smaller (~−26 % gzip).
// The stamps (?v=…) stay those of the files as written (tools/stamp.js stamps and checks each tree before this), so tools/stamp.js --find
// still finds the commit of a stamp from an error report (RRA-NAPAKE). A file's stamp changes whenever its source does; the minified copy
// is a function of the source and of the pinned esbuild version (package.json), so one stamp is always one file.
// esbuild transform, one file at a time (no bundling: the game's scripts are classic scripts that share the page's globals, so their
// top-level names stay as they are; esbuild renames only names inside functions), and never with esbuild's helpers: a helper (such as
// the one --keep-names needs) is a top-level var with a short name, and the files' short names then overwrite one another in the page's
// shared globals (the game breaks). So no --keep-names (nothing in the game reads a function's name), and a file whose output declares
// a helper is left as written. Target es2020 (no newer syntax than the game's own: the minifier would otherwise write ||= and the like),
// comments out but licence comments (/*! … */, @license) kept. js/vendor/ is minified already and left as it is.
// A file esbuild cannot read is left as written (and named in the log): the site still goes out.
//   node tools/pomanjsaj.mjs <tree> [<tree> …]     (e.g. _site and each _site/beta/<n>/: every .js under <tree>/js and <tree>/sw.js)
import fs from 'node:fs';
import path from 'node:path';
import { transformSync } from 'esbuild';

const OPTS = { loader: 'js', minify: true, target: 'es2020', legalComments: 'inline', charset: 'utf8' };
const SKIP = (rel) => rel.startsWith('js/vendor/');

function files(dir, root, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files(p, root, out);
    else if (e.isFile() && e.name.endsWith('.js')) out.push(path.relative(root, p).split(path.sep).join('/'));
  }
  return out;
}

export function minifyTree(root) {
  const list = (fs.existsSync(path.join(root, 'js')) ? files(path.join(root, 'js'), root, []) : [])
    .concat(fs.existsSync(path.join(root, 'sw.js')) ? ['sw.js'] : []).filter(r => !SKIP(r));
  let before = 0, after = 0;
  const bad = [];
  for (const rel of list) {
    const p = path.join(root, rel), src = fs.readFileSync(p, 'utf8');
    before += Buffer.byteLength(src);
    try {
      const { code } = transformSync(src, Object.assign({ sourcefile: rel }, OPTS));
      // (an esbuild helper, e.g. `var __defProp=` for a syntax es2020 lacks: the same file once without minifying shows it by name; the game itself writes no `__x` top-level names)
      const plain = transformSync(src, { loader: 'js', target: OPTS.target, sourcefile: rel }).code;
      const helper = (plain.match(/^var (__[A-Za-z]+)\s*=/gm) || []).filter(h => !src.includes(h.trim()));
      if (helper.length) throw new Error('esbuild helper in output: ' + helper[0]);
      fs.writeFileSync(p, code); after += Buffer.byteLength(code);
    } catch (e) {
      bad.push(rel + ': ' + String(e.message).split('\n')[0]); after += Buffer.byteLength(src);
    }
  }
  return { n: list.length, before, after, bad };
}

if (import.meta.url === 'file://' + path.resolve(process.argv[1] || '')) {
  const trees = process.argv.slice(2);
  if (!trees.length) { console.log('usage: node tools/pomanjsaj.mjs <tree> [<tree> …]'); process.exit(2); }
  const mb = (n) => (n / 2 ** 20).toFixed(2) + ' MB';
  for (const t of trees) {
    if (!fs.existsSync(path.join(t, 'index.html'))) continue;
    const r = minifyTree(t);
    console.log(`${t}: ${r.n} JS files, ${mb(r.before)} → ${mb(r.after)}` + (r.bad.length ? `; left as written: ${r.bad.join('; ')}` : ''));
  }
}
