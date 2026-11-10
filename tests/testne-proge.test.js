// The test tracks (test: true in js/tracks/) are frozen until they are deleted just before Google Play (the user's decisions of 29. 10.
// and 3. 11. 2026, CLAUDE.md »Testne proge«): no session, from any account, updates, improves or fixes them, so that no tokens go to
// tracks that will be deleted. This fails when a file of theirs changes or a new one appears: every file of the repository named after
// a test track (js/tracks/<id>.js, docs/proge/<id>.md, the menu's pictures, maps, flights and music in assets/ and maketa-menija/ …: the
// id as a part of the file's or a folder's name, split at - _ . as tests/run.js --related splits them). Deleting them is fine: that is
// the plan. Their builders in js/world.js and their entries in the shared files are frozen as well, but this does not see them.
// Only when the user explicitly asked for that very track, or moved a track into or out of the test category:
//   node tests/testne-proge.test.js --dovoli <id> "<the user's ask, with its date>"
// writes that track's files anew into tests/golden/testne-proge.json and notes the reason there (dovoljenja).
//   node tests/testne-proge.test.js            check
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');   // (this repository's own files, also when GAME_ROOT points the other tests elsewhere)
const FILE = path.join(__dirname, 'golden', 'testne-proge.json');
const HINT = 'frozen until they are deleted before Google Play (CLAUDE.md »Testne proge«): undo it (git checkout origin/main -- <file>; '
  + 'a new file: delete it), or only if the user explicitly asked for this very track: node tests/testne-proge.test.js --dovoli <id> "<the ask, its date>"';

// the test tracks now: the track files with test: true (their first id: is the track's)
function testIds() {
  const dir = path.join(REPO, 'js', 'tracks'), ids = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8'), id = (src.match(/\bid:\s*'([\w-]+)'/) || [])[1];
    if (id && /\btest:\s*true\b/.test(src)) ids.push(id);
  }
  return ids.sort();
}
// every file of the repository: tracked or new (not ignored), still on the disk; without git, the tree without .git and node_modules
function repoFiles() {
  const r = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: REPO, encoding: 'utf8', maxBuffer: 256 << 20 });
  if (r.status === 0) return [...new Set(r.stdout.split('\0').filter(Boolean))].filter(f => fs.existsSync(path.join(REPO, f)));
  const out = [], walk = (d) => {
    for (const e of fs.readdirSync(path.join(REPO, d), { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      const p = d ? d + '/' + e.name : e.name;
      if (e.isDirectory()) walk(p); else if (e.isFile()) out.push(p);
    }
  };
  walk(''); return out;
}
const parts = (f) => f.replace(/\.[^./]+$/, '').toLowerCase().split(/[/\-_.]/).filter(Boolean);
const self = path.relative(REPO, FILE).split(path.sep).join('/');
// files named after a test track that are shared code: js/world-vrsic.js holds, besides Vršič's own builder, the corridor helpers of the other
// mountain roads (vrPrep … through World.api, docs/kazalo.md; Vršič a test track since 6. 11. 2026). Not frozen as a whole: Vršič's own
// parts in it are, as the builders in js/world.js are, though this does not see them
const SHARED = new Set(['js/world-vrsic.js']);
const owner = (f, ids) => { if (f === self || SHARED.has(f)) return null; const p = parts(f); return ids.find(id => p.includes(id)) || null; };
const hash = (f) => crypto.createHash('sha1').update(fs.readFileSync(path.join(REPO, f))).digest('hex').slice(0, 16);
const read = () => fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : null;

const ai = process.argv.indexOf('--dovoli');
if (ai >= 0) {
  const id = process.argv[ai + 1], why = (process.argv[ai + 2] || '').trim(), now = testIds();
  const m = read() || { zamrznjeno: '', proge: [], datoteke: {}, dovoljenja: [] };
  const ids = id === 'vse' ? [...new Set([...m.proge, ...now])] : [id];
  if (!id || !why || (id !== 'vse' && !now.includes(id) && !m.proge.includes(id))) {
    console.error('usage: node tests/testne-proge.test.js --dovoli <id of a test track, or vse> "<the user\'s ask, with its date>"');
    process.exit(2);
  }
  m.zamrznjeno = 'Testne proge so zamrznjene do izbrisa pred objavo na Google Play (CLAUDE.md »Testne proge«). Ta seznam spremeni samo '
    + 'node tests/testne-proge.test.js --dovoli <id> "<prošnja uporabnika, datum>", ko uporabnik izrecno prosi za točno to progo.';
  const files = repoFiles(), d = {};
  for (const [f, h] of Object.entries(m.datoteke)) if (!SHARED.has(f) && !ids.includes(owner(f, ids))) d[f] = h;   // (the other tracks' files stay as they were; a shared one goes)
  for (const f of files) { const o = owner(f, ids); if (o && now.includes(o)) d[f] = hash(f); }
  m.datoteke = Object.fromEntries(Object.keys(d).sort().map(f => [f, d[f]]));
  m.proge = [...new Set([...m.proge.filter(p => !ids.includes(p)), ...ids.filter(p => now.includes(p))])].sort();
  m.dovoljenja.push({ datum: new Date().toISOString().slice(0, 10), proga: id, razlog: why });
  fs.writeFileSync(FILE, JSON.stringify(m, null, 1) + '\n');
  console.log(`written ${self}: ${m.proge.length} test tracks, ${Object.keys(m.datoteke).length} files`);
  process.exit(0);
}

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const m = read();
if (!m) { check(`the list of the frozen files (${self})`, false, 'missing: node tests/testne-proge.test.js --dovoli vse "<why>"'); process.exit(1); }
const now = testIds(), files = repoFiles(), all = [...new Set([...m.proge, ...now])];
const onDisk = (f) => fs.existsSync(path.join(REPO, f));
const added = now.filter(id => !m.proge.includes(id));
const back = m.proge.filter(id => !now.includes(id) && files.some(f => owner(f, [id]) === id && /^js\/tracks\//.test(f)));   // (still there, no longer test: true)
check('the test tracks are the frozen ones (' + m.proge.join(', ') + ')', !added.length && !back.length,
  [added.length ? 'new test track ' + added.join(', ') : '', back.length ? 'no longer test: true ' + back.join(', ') : ''].filter(Boolean).join('; ')
  + (added.length || back.length ? ' — only on the user\'s word: node tests/testne-proge.test.js --dovoli <id> "<the ask, its date>"' : ''));
const changed = Object.keys(m.datoteke).filter(f => !SHARED.has(f) && onDisk(f) && hash(f) !== m.datoteke[f]);
check(`no file of a test track changed (${Object.keys(m.datoteke).length} files)`, !changed.length, changed.length ? changed.join(', ') + ' — ' + HINT : '');
const fresh = files.filter(f => owner(f, all) && !(f in m.datoteke));
check('no new file of a test track', !fresh.length, fresh.length ? fresh.join(', ') + ' — ' + HINT : '');
const gone = Object.keys(m.datoteke).filter(f => !onDisk(f)).length;
if (gone) console.log(`(deleted: ${gone} file${gone === 1 ? '' : 's'} of the test tracks: fine, they go before Google Play)`);
console.log(bad ? `FAIL: ${bad} of ${n}` : `OK: all ${n} checks passed`);
process.exit(bad ? 1 : 0);
