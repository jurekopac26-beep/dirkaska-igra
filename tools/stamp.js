// Content stamps (?v=<8 hex>) on the local script and stylesheet links of index.html and garaza.html (e.g. js/core.js?v=1a2b3c4d), so
// browsers and the GitHub Pages cache never mix old and new files after an update. The repository's pages carry NO stamps: the stamps
// changed with every change of a js/ or css/ file, and parallel pull requests then conflicted on those lines. The publish step stamps every
// tree it publishes from that tree's own files (.github/workflows/stran.yml: tools/predogled.mjs runs this tool on main in the site's root
// and on each preview in beta/<number>/, then the workflow checks every tree with --check-stamped).
//   node tools/stamp.js --check                 the repo: exit 1 if a link points to a missing file or carries a stamp
//   node tools/stamp.js --strip                 take the stamps off the repo's pages (e.g. brought back by merging an older branch)
//   node tools/stamp.js --merge                 a merge (git merge origin/main) that stopped on a conflict in index.html or garaza.html: each such
//                                               page merged again without stamps; where both sides added script or style links at the same
//                                               place (two new tracks), both kept; git add when no other conflict is left
//   node tools/stamp.js --find <stamp> [file]   the commits whose js/game.js (or file) had this stamp: the version (v=…) in an RRA-NAPAKE
//                                               report or in a recording (posnetek_….rrp) from the published game
//   GAME_ROOT=<folder> node tools/stamp.js                   stamp a copy of the game (the publish step, the tests; never the repo itself)
//   GAME_ROOT=<folder> node tools/stamp.js --check-stamped   a stamped copy: exit 1 if a link points to a missing file or lacks its current stamp
// Every <script src> and <link href> to a local file counts (not in comments; except the app manifest), whatever the quotes or other query
// parameters; the hash ignores line endings (CRLF or LF), so a copy checked out on Windows gets the same stamps.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const USAGE = 'usage: node tools/stamp.js --check | --strip | --merge | --find <stamp> [file]\n       GAME_ROOT=<folder> node tools/stamp.js [--check-stamped]';

// the content stamp of some bytes, of a file: sha256 with CRLF read as LF, first 8 hex digits
const stampOfBytes = (buf) => crypto.createHash('sha256').update(buf.toString('latin1').replace(/\r\n/g, '\n'), 'latin1').digest('hex').slice(0, 8);
const stampOf = (file) => stampOfBytes(fs.readFileSync(file));
// a link to a file of the game (not http:, https:, data:, //host or #anchor)
const isLocal = (u) => u !== '' && !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);
const isStamp = (param) => param.split('=')[0] === 'v';
// the pages of a tree: the game, and the garage where there is one
const pagesOf = (root) => ['index.html', 'garaza.html'].filter(f => f === 'index.html' || fs.existsSync(path.join(root, f)));

// the page with each local link (a <script src> or <link href> outside comments, not the manifest) as each({ file, full, params }) wants it:
// the link's new query parameters, or null to leave the link as it is
function eachLink(root, html, each) {
  const comments = [...html.matchAll(/<!--[\s\S]*?-->/g)].map(m => [m.index, m.index + m[0].length]);
  const inComment = (i) => comments.some(([a, b]) => i >= a && i < b);
  return html.replace(/<(script|link)\b[^>]*>/gi, (tag, name, at) => {
    if (inComment(at)) return tag;
    if (/\brel\s*=\s*["']?manifest\b/i.test(tag)) return tag;   // (the app's manifest keeps its plain address: the installed app knows it by it)
    const attr = name.toLowerCase() === 'script' ? 'src' : 'href';
    return tag.replace(new RegExp(`(\\b${attr}\\s*=\\s*)("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'), (all, pre, quoted, dq, sq, bare) => {
      const url = dq != null ? dq : sq != null ? sq : bare, q = dq != null ? '"' : sq != null ? "'" : '';
      const [, file, query = '', hash = ''] = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(url);
      if (!isLocal(file)) return all;
      const params = query ? query.slice(1).split('&').filter(Boolean) : [];
      const next = each({ file, full: path.join(root, decodeURIComponent(file)), params });
      return next ? pre + q + file + (next.length ? '?' + next.join('&') : '') + hash + q : all;
    });
  });
}

// one pass over a tree's pages: 'stamp' writes the current stamps, 'strip' takes them off, 'check' wants none, 'check-stamped' wants each
// link's current one; every linked file must exist (not checked by 'strip')
function pass(root, mode) {
  const pages = pagesOf(root), problems = [];
  let n = 0, changed = 0;
  for (const page of pages) {
    const FILE = path.join(root, page), html = fs.readFileSync(FILE, 'utf8');
    const out = eachLink(root, html, ({ file, full, params }) => {
      const k = params.findIndex(isStamp), old = k >= 0 ? params[k].replace(/^v=?/, '') : null;
      if (mode === 'strip') { n++; if (k < 0) return null; changed++; return params.filter(p => !isStamp(p)); }
      const inTree = path.relative(root, full);   // (a link out of the tree is no file of it: the publish step stamps pull requests' trees too)
      if (!inTree || inTree.startsWith('..') || path.isAbsolute(inTree)) { problems.push('missing file: ' + page + ': ' + file + ' (outside the tree)'); return null; }
      if (!fs.existsSync(full) || !fs.statSync(full).isFile()) { problems.push('missing file: ' + page + ': ' + file); return null; }
      n++;
      if (mode === 'check') { if (k >= 0) problems.push(`${page}: ${file}: a stamp (v=${old})`); return null; }
      const v = stampOf(full);
      if (old === v) return null;
      changed++; problems.push(`${page}: ${file}: ${old != null ? 'old stamp ' + old : 'no stamp'} (now ${v})`);
      if (k >= 0) params[k] = 'v=' + v; else params.push('v=' + v);
      return params;
    });
    if ((mode === 'stamp' || mode === 'strip') && out !== html) fs.writeFileSync(FILE, out);
  }
  return { pages, problems, n, changed };
}

function main(argv) {
  const [flag = '', ...rest] = argv;
  if (flag === '--find') return find(rest);
  if (flag === '--merge') { if (rest.length) { console.log(USAGE); return 2; } return merge(); }
  const mode = { '': 'stamp', '--strip': 'strip', '--check': 'check', '--check-stamped': 'check-stamped' }[flag];
  if (!mode || rest.length) { console.log(USAGE); return 2; }
  const root = process.env.GAME_ROOT ? path.resolve(process.env.GAME_ROOT) : REPO;
  if (!fs.existsSync(path.join(root, 'index.html'))) { console.log('no index.html in ' + root); return 2; }
  if (mode === 'stamp' && (!process.env.GAME_ROOT || fs.realpathSync(root) === fs.realpathSync(REPO))) {
    console.log('not stamped: the repository carries no stamps, the publish step adds them (.github/workflows/stran.yml, tools/predogled.mjs).\n' +
      'Check the links: node tools/stamp.js --check; stamp a copy of the game: GAME_ROOT=<folder> node tools/stamp.js');
    return 2;
  }
  const { pages, problems, n, changed } = pass(root, mode);
  const rel = path.relative(process.cwd(), root), where = pages.join(' and ') + (root === REPO ? '' : ' of ' + (!rel ? '.' : rel.startsWith('..') ? root : rel));
  if (mode === 'strip') { console.log(`stripped the stamps of ${changed} of the ${n} local links in ${where}`); return 0; }
  const missing = problems.filter(p => p.startsWith('missing'));
  for (const p of mode === 'stamp' ? missing : problems) console.log('FAIL ' + p);
  if (mode === 'stamp') { console.log(`stamped ${n} links in ${where} (${changed} changed)` + (missing.length ? `; ${missing.length} link(s) to a missing file` : '')); return missing.length ? 1 : 0; }
  if (!problems.length) {
    console.log(mode === 'check' ? `OK: all ${n} local links in ${where} point to existing files and carry no stamp (the publish step adds them)`
      : `OK: all ${n} links in ${where} carry the current stamp`);
    return 0;
  }
  const stamps = problems.length > missing.length;
  console.log(`FAIL: ${problems.length} link(s) with a problem — ` + (!stamps ? 'a linked file is missing'
    : mode === 'check' ? 'the repository carries no stamps (the publish step adds them): node tools/stamp.js --strip' : 'stamp the copy: GAME_ROOT=<folder> node tools/stamp.js'));
  return 1;
}

// the commits whose file (js/game.js) had this stamp, in the history here (every branch fetched): where that content came in, oldest first
function find(args) {
  const [stamp, file = 'js/game.js'] = args;
  if (!/^[0-9a-f]{8}$/.test(stamp || '') || args.length > 2) { console.log(USAGE); return 2; }
  const rel = file.split(path.sep).join('/'), here = path.join(REPO, rel);
  const git = (a, input) => execFileSync('git', a, { cwd: REPO, input, maxBuffer: 1 << 30 });
  const now = fs.existsSync(here) && fs.statSync(here).isFile() ? stampOf(here) : null;
  if (now === stamp) console.log(`${rel} v=${stamp}: the file as it is here now`);
  // the commits that changed the file, newest first, each with the file's content after it (its blob; none where it was deleted)
  const commits = git(['log', '--all', '--format=%H%x09%cs%x09%s', '--', rel]).toString().split('\n').filter(Boolean)
    .map(l => { const [sha, date, ...s] = l.split('\t'); return { sha, date, subject: s.join(' ') }; });
  const ids = commits.length ? git(['cat-file', '--batch-check=%(objectname) %(objecttype)'], commits.map(c => c.sha + ':' + rel).join('\n') + '\n').toString().split('\n') : [];
  commits.forEach((c, i) => { const m = /^([0-9a-f]{40,64}) blob$/.exec(ids[i] || ''); c.blob = m ? m[1] : null; });
  // each content once, newest first, until one has the stamp (read 32 at a time: git cat-file --batch)
  const blobs = [...new Set(commits.map(c => c.blob).filter(Boolean))];
  let hit = null;
  for (let i = 0; i < blobs.length && !hit; i += 32) {
    const part = blobs.slice(i, i + 32), buf = git(['cat-file', '--batch'], part.join('\n') + '\n');
    for (let j = 0, at = 0; j < part.length; j++) {
      const nl = buf.indexOf(10, at), size = +buf.toString('latin1', at, nl).split(' ')[2];
      if (stampOfBytes(buf.subarray(nl + 1, nl + 1 + size)) === stamp) { hit = part[j]; break; }
      at = nl + 1 + size + 1;
    }
  }
  if (!hit) {
    const shallow = String(git(['rev-parse', '--is-shallow-repository'])).trim() === 'true';
    console.log(`${rel} v=${stamp}: not in the history here (${blobs.length} versions of ${rel} in ${commits.length} commits searched` +
      (shallow ? '; a shallow clone: git fetch --unshallow' : '') + '; a preview of a pull request: git fetch origin pull/<number>/head first)');
    return now === stamp ? 0 : 1;
  }
  const had = commits.filter(c => c.blob === hit).reverse();
  console.log(`${rel} v=${stamp} came in with (oldest first):`);
  for (const c of had) console.log(`  ${c.sha.slice(0, 9)} ${c.date} ${c.subject}`);
  console.log(`changed since then: git log --oneline ${had[0].sha.slice(0, 9)}..origin/main`);
  return 0;
}

// a merge that stopped on a conflict in index.html or garaza.html (most often the stamps of a branch from before 3. 11. 2026, or two new
// tracks at the same place): each such page merged again from its common base and its two sides (git's stages 1, 2, 3), all three without
// stamps; the git repository of the current folder
function merge() {
  const git = (a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 });
  const top = git(['rev-parse', '--show-toplevel']).trim();
  const pages = git(['diff', '--name-only', '--diff-filter=U']).split('\n').filter(f => f === 'index.html' || f === 'garaza.html');
  if (!pages.length) { console.log('no page in a merge conflict (index.html, garaza.html): nothing to do'); return 0; }
  const strip = (html) => eachLink(top, html, ({ params }) => (params.some(isStamp) ? params.filter(p => !isStamp(p)) : null));
  let left = 0;
  for (const page of pages) {
    const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'stamp-merge-'));
    const side = (n) => { let t = ''; try { t = git(['show', `:${n}:${page}`]); } catch (_) { } const f = path.join(tmp, n + '.html'); fs.writeFileSync(f, strip(t)); return f; };
    const [mine, base, theirs] = [2, 1, 3].map(side);   // (2 this branch, 1 the common base, 3 the branch merged in)
    let out;
    try { out = git(['merge-file', '-p', '--diff3', '-L', 'this branch', '-L', 'common base', '-L', 'merged in', mine, base, theirs]); }
    catch (e) { if (typeof e.stdout !== 'string' || !(e.status > 0)) throw e; out = e.stdout; }   // (exit n > 0: n conflicts left, marked)
    fs.rmSync(tmp, { recursive: true, force: true });
    const m = keepBoth(out);
    fs.writeFileSync(path.join(top, page), m.text);
    if (!m.left) { git(['add', '--', page]); console.log(page + ': merged without the stamps' + (m.both ? `; ${m.both} place(s) where both sides added links: both kept` : '') + '; no conflict left (git add done)'); }
    else { left += m.left; console.log(page + `: merged without the stamps, but ${m.left} place(s) where both sides changed the same lines are marked: resolve them, then git add ${page}`); }
  }
  return left ? 1 : 0;
}
// the conflicts git left (diff3: this branch ||||||| base ======= merged in) where both sides only added script or style links at the same
// place, the base having nothing there: both sides kept, this branch's first, a link both added only once; any other conflict stays marked
// as git marks it (two sides, no base)
function keepBoth(text) {
  const L = text.split('\n'), out = [], LINK = /^\s*(<script\b[^>]*><\/script>|<link\b[^>]*>)?\s*$/i;
  let left = 0, both = 0;
  for (let i = 0; i < L.length; i++) {
    if (!L[i].startsWith('<<<<<<< ')) { out.push(L[i]); continue; }
    const a = [], b = [], c = [];
    let j = i + 1, part = a;
    for (; j < L.length && !L[j].startsWith('>>>>>>> '); j++) {
      if (L[j].startsWith('||||||| ')) part = b; else if (L[j] === '=======') part = c; else part.push(L[j]);
    }
    if (!b.some(l => l.trim()) && a.concat(c).every(l => LINK.test(l))) { out.push(...a, ...c.filter(l => !l.trim() || !a.includes(l))); both++; }
    else { out.push(L[i], ...a, '=======', ...c, L[j]); left++; }
    i = j;
  }
  return { text: out.join('\n'), left, both };
}

module.exports = { stampOf, stampOfBytes, eachLink, pagesOf };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
