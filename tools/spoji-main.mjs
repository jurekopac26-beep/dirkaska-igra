#!/usr/bin/env node
// Merges main (or another branch) into the current branch and resolves the mechanical conflicts by itself, so a session does not
// spend its time and tokens on them (docs/varcevanje.md, C):
//   node tools/spoji-main.mjs                       git fetch origin main, then merge origin/main
//   node tools/spoji-main.mjs origin/<branch>       merge another branch (the train: each pull request's branch in turn)
//   node tools/spoji-main.mjs <ref> --no-fetch      without git fetch (tests, no network)
// Resolved by itself: the pages (index.html, garaza.html) by node tools/stamp.js --merge (it merges each page again without the stamps
// an older branch still carries, and keeps both sides' new links where both added some at the same place, e.g. two new tracks); the
// texts and lists hunk by hunk (the diff3 conflict style gives the common base of both sides; *.md, tests/run.js, js/lang.js; in other
// files only what git itself would take):
//   1. a finer three-way merge than git's: lines one side put next to lines the other side changed are no conflict, and when both
//      sides put lines at the same place both are kept (ours first, a line both put once; in a .js file not when both put the
//      same key); the same lines changed differently on both sides stay a conflict;
//   2. a one-line list of strings (the test lists in tests/run.js): what the other side added or removed is applied to ours.
// A resolved .js file must pass `node --check`, or it stays a conflict. The stamps: the repository's pages carry none (the publish step
// adds them), so node tools/stamp.js --strip takes off those an older branch brought without a conflict, then --check (a link to a
// missing file is printed). When nothing is left: git add, git commit --no-edit (the merge commit; after a merge without conflicts the
// stamps' change goes into it too).
// What is left is listed (file, line of each hunk) and the merge stays open: resolve it, then node tools/stamp.js --strip and --check,
// git add, git commit --no-edit. Exit code: 0 merged (or already up to date), 1 conflicts left, 2 an error (e.g. uncommitted changes).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const noFetch = args.includes('--no-fetch');
const ref = args.find(a => !a.startsWith('--')) || 'origin/main';

const PAGES = ['index.html', 'garaza.html'];   // (their conflicts: node tools/stamp.js --merge)
const UNION = /\.md$|^tests\/run\.js$|^js\/lang\.js$/;
const LISTS = /^tests\/run\.js$/;

const git = (argv) => {
  const r = spawnSync('git', argv, { encoding: 'utf8', maxBuffer: 256 << 20 });
  return { code: r.status, out: (r.stdout || '').replace(/\s+$/, ''), err: (r.stderr || '').trim() };
};
const die = (msg) => { console.error('spoji-main: ' + msg); process.exit(2); };

const top = git(['rev-parse', '--show-toplevel']);
if (top.code) die('to ni git repozitorij');
const ROOT = top.out;
process.chdir(ROOT);
if (git(['rev-parse', '-q', '--verify', 'MERGE_HEAD']).code === 0) die('spoj je že odprt: končaj ga (git commit) ali prekliči (git merge --abort)');
if (git(['status', '--porcelain', '--untracked-files=no']).out) die('neshranjene spremembe: najprej commit ali stash');
if (!noFetch && ref.startsWith('origin/')) {
  const f = git(['fetch', '-q', 'origin', ref.slice('origin/'.length)]);
  if (f.code) die(`git fetch ${ref}: ${f.err}`);
}

const before = git(['rev-parse', 'HEAD']).out;
const merge = git(['-c', 'merge.conflictStyle=diff3', 'merge', '--no-edit', ref]);
const conflicts = () => git(['diff', '--name-only', '--diff-filter=U']).out.split('\n').filter(Boolean);
const unmerged0 = conflicts();

// the stamps after the merge: tools/stamp.js of the merged tree (or, without one, of this tool's repository); the pages' stamps an older
// branch brought are taken off (--strip), the pages' conflicts merged (--merge)
const STAMP_JS = [path.join(ROOT, 'tools', 'stamp.js'), path.join(TOOLS, 'stamp.js')].find(f => fs.existsSync(f));
const runStamp = (...a) => spawnSync(process.execPath, [STAMP_JS, ...a], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, GAME_ROOT: ROOT } });
const PAGES_HERE = () => PAGES.filter(f => fs.existsSync(path.join(ROOT, f)));
const stamp = () => {
  if (!STAMP_JS) die('ni tools/stamp.js');
  const r = runStamp('--strip');
  if (r.status) die('node tools/stamp.js --strip: ' + ((r.stdout || '') + (r.stderr || '')).trim());
  return PAGES_HERE().filter(f => git(['diff', '--quiet', '--', f]).code === 1);
};
const stamped = (files) => (!files.length ? '' : '; žigi odstranjeni iz ' + files.join(', '));
// the links after the merge: only a problem is printed, e.g. a link to a file the other side deleted
const checkLinks = () => {
  const r = runStamp('--check');
  if (r.status) console.log('Pozor, node tools/stamp.js --check:\n' + ((r.stdout || '') + (r.stderr || '')).trim());
};

if (merge.code !== 0 && unmerged0.length === 0) die(`git merge ${ref}: ${merge.err || merge.out}`);

if (unmerged0.length === 0) {
  const after = git(['rev-parse', 'HEAD']).out;
  if (after === before) { console.log(`Ni česa spojiti: ${ref} je že v veji.`); process.exit(0); }
  const restamped = stamp();
  if (restamped.length) {
    git(['add', '--', ...restamped]);
    // our own merge commit takes the stamps; after a fast-forward (commits that are already on the other branch) a new commit
    const isMerge = git(['rev-parse', '-q', '--verify', 'HEAD^2']).code === 0;
    const c = isMerge ? git(['commit', '-q', '--amend', '--no-edit']) : git(['commit', '-q', '-m', 'Brez žigov po spoju ' + ref]);
    if (c.code) die('git commit: ' + c.err);
  }
  console.log(`Spojeno brez sporov (${ref})` + stamped(restamped) + '.');
  checkLinks();
  process.exit(0);
}

// ---------------- resolving a conflicted file, hunk by hunk
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const keyOf = (s) => { const m = /^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/.exec(s); return m ? (m[1] || m[2] || m[3]) : null; };

// a one-line list of strings, e.g.   node: ['a.test.js', 'b.test.js'],
const LIST = /^(\s*[\w$'"-]+\s*:\s*\[)(.*)(\]\s*,?\s*)$/;
const STR = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g;
const items = (s) => (s.replace(STR, '').replace(/[\s,]/g, '') === '' ? s.match(STR) || [] : null);
function mergeList(o, b, t) {
  const mo = LIST.exec(o), mb = LIST.exec(b), mt = LIST.exec(t);
  if (!mo || !mb || !mt || mo[1] !== mb[1] || mt[1] !== mb[1]) return null;
  const io = items(mo[2]), ib = items(mb[2]), it = items(mt[2]);
  if (!io || !ib || !it) return null;
  const removed = ib.filter(x => !it.includes(x)), added = it.filter(x => !ib.includes(x) && !io.includes(x));
  const res = io.filter(x => !removed.includes(x));
  for (const x of added) {   // where the other side put it: after the nearest item before it that the list has (the order can matter)
    let at = 0;
    for (let q = it.indexOf(x) - 1; q >= 0; q--) { const p = res.indexOf(it[q]); if (p >= 0) { at = p + 1; break; } }
    res.splice(at, 0, x);
  }
  return mo[1] + res.join(', ') + mo[3];
}

function line3(file, o, b, t) {
  if (o === t || t === b) return o;
  if (o === b) return t;
  if (LISTS.test(file)) return mergeList(o, b, t);
  return null;
}

// both sides only added lines: ours, then what theirs added and ours did not
function union(file, o, t) {
  const mine = new Set(o), extra = t.filter(x => !mine.has(x));
  if (/\.js$/.test(file)) {
    const keys = new Set(o.map(keyOf).filter(Boolean));
    if (extra.some(x => keys.has(keyOf(x)))) return null;   // the same key added on both sides: not mechanical
  }
  return o.concat(extra);
}

// one side's changes against the base (a longest common subsequence of the normalized lines): hunks { s, e, lines } (base[s..e)
// replaced by lines; s === e: lines put before base[s]) and, for every base line the side kept, its text there
function changes(b, x, norm) {
  const n = b.length, m = x.length;
  if (n * m > 4e6) return null;
  const nb = b.map(norm), nx = x.map(norm), L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = nb[i] === nx[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const hunks = [], kept = new Array(n).fill(null);
  let i = 0, j = 0, h = null;
  while (i < n || j < m) {
    if (i < n && j < m && nb[i] === nx[j]) { if (h) { h.e = i; hunks.push(h); h = null; } kept[i++] = x[j++]; continue; }
    if (!h) h = { s: i, e: i, lines: [] };
    if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) h.lines.push(x[j++]); else i++;
  }
  if (h) { h.e = i; hunks.push(h); }
  return { hunks, kept };
}

// a three-way merge of a texts' or lists' hunk, finer than git's: a line put next to a line the other side changed, or both sides
// adding lines at the same place (kept both, ours first), is not a conflict; changing the same lines differently still is
function merge3(file, o, b, t, norm) {
  const A = changes(b, o, norm), B = changes(b, t, norm);
  if (!A || !B) return null;
  for (const x of A.hunks) for (const y of B.hunks) {
    const xr = x.e > x.s, yr = y.e > y.s;
    if (xr && yr && x.s === y.s && x.e === x.s + 1 && y.e === x.e && x.lines.length === 1 && y.lines.length === 1 && LISTS.test(file)) {
      const m = mergeList(x.lines[0], b[x.s], y.lines[0]);   // the same list line extended on both sides
      if (m !== null) { x.lines = [m]; y.lines = [m]; }
    }
    if (xr && yr && x.s < y.e && y.s < x.e && !(x.s === y.s && x.e === y.e && same(x.lines.map(norm), y.lines.map(norm)))) return null;
    if ((!xr && yr && y.s < x.s && x.s < y.e) || (xr && !yr && x.s < y.s && y.s < x.e)) return null;
  }
  const n = b.length, out = [];
  const put = (H, i) => H.hunks.find(h => h.s === i && h.e === i), repl = (H, i) => H.hunks.find(h => h.s === i && h.e > i);
  for (let i = 0; i <= n;) {
    const pa = put(A, i), pb = put(B, i);
    if (pa && pb) { const u = union(file, pa.lines, pb.lines); if (!u) return null; out.push(...u); }
    else if (pa || pb) out.push(...(pa || pb).lines);
    if (i === n) break;
    const r = repl(A, i) || repl(B, i);
    if (r) { out.push(...r.lines); i = r.e; continue; }
    out.push(A.kept[i] !== null ? A.kept[i] : B.kept[i]);
    i++;
  }
  return out;
}

function resolveHunk(file, o, b, t) {
  if (same(o, t) || same(t, b)) return o;
  if (same(o, b)) return t;
  if (!UNION.test(file)) return null;   // code and data: only what git itself would take
  if (o.length === b.length && t.length === b.length) {
    const r = o.map((x, i) => line3(file, x, b[i], t[i]));
    if (r.every(x => x !== null)) return r;
  }
  return merge3(file, o, b, t, (x) => x);
}

// a file with diff3 conflict markers: the resolved text and the hunks left (their first lines in the new text)
function resolveFile(file, text) {
  const lines = text.split('\n'), out = [], left = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('<<<<<<<')) { out.push(lines[i]); continue; }
    const hunk = { o: [], b: [], t: [], raw: [lines[i]] };
    let part = 'o', bad = false, j = i + 1;
    for (; j < lines.length; j++) {
      const s = lines[j];
      hunk.raw.push(s);
      if (s.startsWith('>>>>>>>')) break;
      if (s.startsWith('|||||||')) { if (part !== 'o') bad = true; part = 'b'; continue; }
      if (s === '=======') { if (part !== 'b') bad = true; part = 't'; continue; }
      if (s.startsWith('<<<<<<<')) bad = true;
      hunk[part].push(s);
    }
    if (j >= lines.length || part !== 't') bad = true;
    const r = bad ? null : resolveHunk(file, hunk.o, hunk.b, hunk.t);
    if (r) out.push(...r); else { left.push(out.length + 1); out.push(...hunk.raw); }
    i = j;
  }
  return { text: out.join('\n'), left };
}

const resolved = [], leftovers = [];
// the pages first: stamp.js --merge (it git adds a page that has no conflict left; a page it leaves marked is a real conflict, below)
if (unmerged0.some(f => PAGES.includes(f))) {
  if (!STAMP_JS) die('ni tools/stamp.js');
  runStamp('--merge');
  const still = conflicts();
  resolved.push(...unmerged0.filter(f => PAGES.includes(f) && !still.includes(f)));
}
for (const file of conflicts()) {
  const stages = new Set(git(['ls-files', '-u', '--', file]).out.split('\n').map(l => l.split(/\s+/)[2]));
  const full = path.join(ROOT, file);
  if (!(stages.has('1') && stages.has('2') && stages.has('3')) || !fs.existsSync(full)) {
    leftovers.push({ file, why: 'brez skupne osnove ali izbrisana na eni strani' });
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  if (text.includes('\0')) { leftovers.push({ file, why: 'binarna datoteka' }); continue; }
  const r = resolveFile(file, text);
  if (r.left.length === 0 && /\.(m?js)$/.test(file)) {
    fs.writeFileSync(full, r.text);
    if (spawnSync(process.execPath, ['--check', full]).status !== 0) {
      fs.writeFileSync(full, text);
      leftovers.push({ file, why: 'po samodejni rešitvi ni veljaven JS', lines: resolveFile(file, text).left });
      continue;
    }
  }
  if (r.text !== text) fs.writeFileSync(full, r.text);
  if (r.left.length) leftovers.push({ file, lines: r.left });
  else { git(['add', '--', file]); resolved.push(file); }
}

if (leftovers.length === 0) {
  const restamped = stamp();
  if (restamped.length) git(['add', '--', ...restamped]);
  const c = git(['commit', '-q', '--no-edit']);
  if (c.code) die('git commit: ' + (c.err || c.out));
  console.log(`Spojeno (${ref}); samodejno rešeni spori: ${resolved.join(', ')}` + stamped(restamped) + '.');
  checkLinks();
  process.exit(0);
}

// the merge stays open: the resolved pages lose their stamps already (taking them off is always right)
const stripped = stamp().filter(f => !leftovers.some(l => l.file === f));
if (stripped.length) git(['add', '--', ...stripped]);
console.log(`Spoj ${ref} je odprt.` + (resolved.length ? ` Samodejno rešeno: ${resolved.join(', ')}.` : '') + (stripped.length ? ` Žigi odstranjeni iz ${stripped.join(', ')}.` : ''));
console.log('Ostalo za ročno rešitev:');
const plural = (k, one, two, few, many) => (k % 100 === 1 ? one : k % 100 === 2 ? two : k % 100 === 3 || k % 100 === 4 ? few : many);
const GENERATED = [
  [/^tests\/golden\//, 'referenco ustvari znova z orodji (npm run golden:update ali ožje)'],
  [/^js\/menu-data\.js$/, 'podatke menija ustvari znova z orodji, ki jih izdelajo (imenovana v komentarjih datoteke)'],
  [/^js\/routes\.js$/, 'ustvari znova z routes.py'],
  [/^(assets|maketa-menija)\/.*\.json$|^maketa-menija\/outlines\.js$/, 'generirani podatki: ustvari jih znova z orodjem (docs/kazalo.md)'],
];
for (const l of leftovers) {
  const k = l.lines ? l.lines.length : 0;
  const where = k ? ` (${k} ${plural(k, 'del', 'dela', 'deli', 'delov')}, ${plural(k, 'vrstica', 'vrstici', 'vrstice', 'vrstice')} ${l.lines.join(', ')})` : '';
  const g = GENERATED.find(([re]) => re.test(l.file));
  console.log(`  ${l.file}${where}${l.why ? ': ' + l.why : ''}${g ? ' — ' + g[1] : ''}`);
}
console.log('Nato: node tools/stamp.js --strip in --check, git add <datoteke>, git commit --no-edit (ali git merge --abort).');
process.exit(1);
