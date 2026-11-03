// Content stamps on the game's pages: every local script and stylesheet link in index.html and garaza.html gets its file's content
// hash (e.g. js/core.js?v=1a2b3c4d), so browsers and the GitHub Pages cache never mix old and new files after an update.
// The repo keeps its pages WITHOUT stamps (odločitev uporabnika 3. 11. 2026): a stamp written in every pull request made all the
// other open ones conflict in index.html as soon as one of them was merged. The stamps are added where the pages are served:
// tools/predogled.mjs stamps the site it builds for GitHub Pages (main and the previews, .github/workflows/stran.yml), and the
// tests' web server (tests/browser/lib.mjs serve) stamps the pages it sends, so the tests see the game as it is published.
//   node tools/stamp.js                 remove the stamps from the repo's pages (a merge that brought old ones back without a
//                                       conflict; a merge that stopped on one: --merge)
//   node tools/stamp.js --merge         in a merge that stopped on a conflict in a page: merge the page's two sides and their common
//                                       base without stamps (the old stamps were the conflict), git add it when nothing else is left
//   node tools/stamp.js --check         exit 1 if a page carries a stamp or links a file that is missing (tests/stamp.test.js)
//   node tools/stamp.js --write [dir]   stamp the pages of a copy of the game (dir, else GAME_ROOT, else the repo)
//   node tools/stamp.js --find <stamp>  the commit whose js/game.js has this stamp: the version in a bug report (RRA-NAPAKE v=…) or
//                                       in a recording (a shallow clone may need git fetch --unshallow origin main first)
// Every <script src> and <link href> to a local file counts (except the app manifest, and not in comments), whatever the quotes or
// other query parameters; the hash ignores line endings (CRLF or LF), so a copy checked out on Windows gets the same stamps.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO = path.resolve(__dirname, '..');
const NAMES = ['index.html', 'garaza.html'];   // (the game; the garage, to be joined with its menu later)

// the content stamp of a file's bytes: sha256 with CRLF read as LF, first 8 hex digits
const hashOf = (buf) => crypto.createHash('sha256').update(buf.toString('latin1').replace(/\r\n/g, '\n'), 'latin1').digest('hex').slice(0, 8);
// a file's stamp (kept while its size and time stay: the tests' server stamps a page at every request)
const known = new Map();
function stampOf(file) {
  const st = fs.statSync(file), k = known.get(file);
  if (k && k.t === st.mtimeMs && k.n === st.size) return k.v;
  const v = hashOf(fs.readFileSync(file));
  known.set(file, { t: st.mtimeMs, n: st.size, v });
  return v;
}
// a link to a file of the game (not http:, https:, data:, //host or #anchor)
const isLocal = (u) => u !== '' && !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);

// a page's local links stamped ('write'), unstamped ('strip') or left as they are ('scan'); their files are looked for in dir
function relink(html, dir, mode) {
  const comments = [...html.matchAll(/<!--[\s\S]*?-->/g)].map(m => [m.index, m.index + m[0].length]);
  const inComment = (i) => comments.some(([a, b]) => i >= a && i < b);
  const r = { html, links: 0, changed: 0, stamped: [], missing: [] };
  r.html = html.replace(/<(script|link)\b[^>]*>/gi, (tag, name, at) => {
    if (inComment(at)) return tag;
    if (/\brel\s*=\s*["']?manifest\b/i.test(tag)) return tag;   // (the app's manifest keeps its plain address: the installed app knows it by it)
    const attr = name.toLowerCase() === 'script' ? 'src' : 'href';
    return tag.replace(new RegExp(`(\\b${attr}\\s*=\\s*)("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'), (all, pre, quoted, dq, sq, bare) => {
      const url = dq != null ? dq : sq != null ? sq : bare, q = dq != null ? '"' : sq != null ? "'" : '';
      const [, file, query = '', hash = ''] = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(url);
      if (!isLocal(file)) return all;
      const full = path.join(dir, decodeURIComponent(file));
      if (fs.existsSync(full) && fs.statSync(full).isFile()) r.links++;
      else { r.missing.push(file); if (mode !== 'strip') return all; }   // (a stamp is taken off even a link to a missing file)
      const params = query ? query.slice(1).split('&').filter(Boolean) : [], k = params.findIndex(p => p.split('=')[0] === 'v');
      if (k >= 0) r.stamped.push(file);
      if (mode === 'write') { const v = 'v=' + stampOf(full); if (params[k] === v) return all; if (k >= 0) params[k] = v; else params.push(v); }
      else if (mode === 'strip' && k >= 0) params.splice(k, 1);
      else return all;
      r.changed++;
      return pre + q + file + (params.length ? '?' + params.join('&') : '') + hash + q;
    });
  });
  return r;
}

// a page's text with its links stamped, the files next to it in dir (the tests' web server: the page as the published site sends it)
const stampHtml = (html, dir) => relink(html, dir, 'write').html;
// the pages of a game folder (index.html, and garaza.html where there is one), each relinked; written back unless only scanned
function pages(dir, mode) {
  return NAMES.filter(f => fs.existsSync(path.join(dir, f))).map((page) => {
    const file = path.join(dir, page), html = fs.readFileSync(file, 'utf8'), r = relink(html, dir, mode);
    if (mode !== 'scan' && r.html !== html) fs.writeFileSync(file, r.html);
    return Object.assign(r, { page });
  });
}
const total = (rs, k) => rs.reduce((s, r) => s + r[k], 0);
const listed = (rs, k) => [].concat(...rs.map(r => r[k].map(f => r.page + ': ' + f)));
// stamp a copy of the game (tools/predogled.mjs: main and each preview): how many links, how many changed, the missing files
function stampDir(dir) {
  const rs = pages(dir, 'write');
  return { links: total(rs, 'links'), changed: total(rs, 'changed'), missing: listed(rs, 'missing') };
}

// the commit whose js/game.js has the stamp: first on the current branch's own line (main: each merged pull request as one step),
// then in every commit git knows; with the next change of game.js after it (a bug seen in that version may be fixed since)
function find(want) {
  const { execFileSync } = require('child_process');
  const git = (args) => execFileSync('git', args, { cwd: REPO, maxBuffer: 1 << 28 });
  const history = (more) => {
    const revs = [];
    for (const line of git(['log', ...more, '--diff-merges=first-parent', '--format=@%H %cs %s', '--raw', '--no-abbrev', '--', 'js/game.js']).toString('utf8').split('\n')) {
      const m = /^@(\w+) (\S+) (.*)$/.exec(line);
      if (m) revs.push({ sha: m[1], date: m[2], subj: m[3], blob: null });
      else if (line.startsWith(':') && revs.length) revs[revs.length - 1].blob = line.split(/\s+/)[3];   // (:mode mode old-blob new-blob status, the path)
    }
    return revs.filter(r => r.blob && !/^0+$/.test(r.blob));
  };
  const seen = new Map(), stampOfBlob = (b) => { if (!seen.has(b)) seen.set(b, hashOf(git(['cat-file', 'blob', b]))); return seen.get(b); };
  const show = (r) => `${r.sha.slice(0, 9)} (${r.date}, ${r.subj})`;
  for (const more of [['--first-parent', 'HEAD'], ['--all']]) {
    const revs = history(more), i = revs.findIndex(r => stampOfBlob(r.blob) === want);   // (newest first)
    if (i < 0) continue;
    console.log(`stamp ${want}: js/game.js of ${show(revs[i])}` + (more[0] === '--all' ? ' (not on this branch\'s own line: a pull request\'s?)' : ''));
    console.log(i > 0 ? `  game.js changed after it in ${show(revs[i - 1])}` + (i > 1 ? ` and ${i - 1} more commit(s) up to ${show(revs[0])}` : '') : '  it is still the newest game.js here');
    return true;
  }
  console.log(`stamp ${want}: no js/game.js with it in this clone's history (a shallow clone: git fetch --unshallow origin main, then again)`);
  return false;
}

// a merge stopped on a conflict in index.html or garaza.html (most often only the old stamps of a branch made before 3. 11. 2026):
// each such page merged again from its common base and its two sides, all three without stamps; what is left is a real conflict
// (both sides changed the same link), marked as git marks it
function mergePages() {
  const { execFileSync } = require('child_process'), os = require('os');
  const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
  const top = git(['rev-parse', '--show-toplevel']).trim();
  const unmerged = git(['diff', '--name-only', '--diff-filter=U']).split('\n').filter(f => NAMES.includes(f));
  if (!unmerged.length) { console.log('no page in a merge conflict (index.html, garaza.html): nothing to do'); return true; }
  let ok = true;
  for (const page of unmerged) {
    const stage = (n) => { try { return git(['show', `:${n}:${page}`]); } catch (_) { return ''; } };   // (1 the common base, 2 this branch, 3 the branch merged in)
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stamp-merge-'));
    const [mine, base, theirs] = [2, 1, 3].map((n) => { const f = path.join(tmp, n + '.html'); fs.writeFileSync(f, relink(stage(n), top, 'strip').html); return f; });
    let out;
    try { out = git(['merge-file', '-p', '--diff3', '-L', 'this branch', '-L', 'common base', '-L', 'merged in', mine, base, theirs]); }
    catch (e) { if (typeof e.stdout !== 'string' || !(e.status > 0)) throw e; out = e.stdout; }   // (exit n > 0: n conflicts left, marked in the text)
    const m = keepBoth(out);
    fs.writeFileSync(path.join(top, page), m.text);
    fs.rmSync(tmp, { recursive: true, force: true });
    if (!m.left) { git(['add', '--', page]); console.log(page + ': merged without the stamps' + (m.both ? `, ${m.both} place(s) where both sides added scripts: both kept` : '') + ', no conflict left (added to the merge)'); }
    else { ok = false; console.log(page + `: merged without the stamps, but ${m.left} place(s) where both sides changed the same lines: resolve them by hand, then git add ` + page); }
  }
  return ok;
}
// the conflicts git left (diff3 style) where both sides only added script or style links at the same place (two new tracks, say):
// both sides kept, this branch's first, a link both added once; any other conflict stays as git marks it (two sides, no base)
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

module.exports = { stampOf, stampHtml, stampDir, NAMES };

if (require.main === module) {
  const args = process.argv.slice(2), after = (k) => { const i = args.indexOf(k); return i < 0 ? null : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : ''); };
  const want = after('--find');
  if (want != null) {
    if (!/^[0-9a-f]{8}$/.test(want)) { console.log('usage: node tools/stamp.js --find <stamp: 8 hex digits, e.g. from RRA-NAPAKE v=…>'); process.exit(2); }
    process.exit(find(want) ? 0 : 1);
  }
  if (args.includes('--merge')) process.exit(mergePages() ? 0 : 1);
  const write = after('--write'), check = args.includes('--check');
  const dir = write ? path.resolve(write) : process.env.GAME_ROOT ? path.resolve(process.env.GAME_ROOT) : REPO;
  if (!fs.existsSync(path.join(dir, 'index.html'))) { console.log('no index.html in ' + dir); process.exit(2); }
  const rs = pages(dir, write != null ? 'write' : check ? 'scan' : 'strip'), missing = listed(rs, 'missing'), names = rs.map(r => r.page).join(' and ');
  if (write != null) {
    console.log(`stamped ${total(rs, 'links')} links (${total(rs, 'changed')} changed) in ${names}` + (missing.length ? '; missing: ' + missing.join(', ') : ''));
    process.exit(missing.length ? 1 : 0);
  }
  if (check) {
    const stamped = listed(rs, 'stamped');
    for (const f of missing) console.log('FAIL missing file: ' + f);
    for (const f of stamped.slice(0, 10)) console.log('FAIL a stamp in the repo: ' + f);
    if (stamped.length > 10) console.log(`FAIL … and ${stamped.length - 10} more stamp(s)`);
    const why = [stamped.length ? 'the repo keeps its pages without stamps (publishing adds them): run node tools/stamp.js, it removes them' : '', missing.length ? 'a linked file is missing' : ''].filter(Boolean);
    console.log(why.length ? `FAIL: ${stamped.length + missing.length} link(s) with a problem — ${why.join('; ')}` : `OK: all ${total(rs, 'links')} links in ${names} point to files and carry no stamp (publishing adds them)`);
    process.exit(why.length ? 1 : 0);
  }
  const n = total(rs, 'changed');
  console.log(`${n ? 'removed ' + n + ' stamp(s)' : 'no stamps'} in ${names}: the repo keeps its pages without them, publishing adds them (tools/predogled.mjs)` + (missing.length ? '; missing: ' + missing.join(', ') : ''));
  process.exit(missing.length ? 1 : 0);
}
