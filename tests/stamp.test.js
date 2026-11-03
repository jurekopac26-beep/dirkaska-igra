// The links of the game's pages and their stamps (tools/stamp.js). In the repository every local link of index.html and garaza.html points
// to an existing file and carries NO stamp (the stamps changed with every js/ or css/ change and parallel pull requests conflicted on them):
// the publish step puts them on (.github/workflows/stran.yml, tools/predogled.mjs). Here, as it does: the pages copied to a folder of their
// own and stamped, every local link gets its own file's stamp (?v=<sha256 of the file, CRLF read as LF, 8 hex>), --check-stamped takes the
// copy, a changed file makes it fail until stamped again, --strip gives back the repository's pages byte for byte. The links' details on a
// page of its own (quotes, other parameters, anchors, comments, outside addresses, the manifest, a missing file); the tool never stamps the
// repository itself; --find <stamp> finds the commit of js/game.js's content.
//   node tests/stamp.test.js
'use strict';
const { spawnSync, execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.join(__dirname, '..'), TOOL = path.join(REPO, 'tools', 'stamp.js'), PAGES = ['index.html', 'garaza.html'];
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail && !ok ? ' — ' + detail : ''}`); };
// the tool on a folder (GAME_ROOT), or on its own repository (no GAME_ROOT), or a copy of the tool (on its own folder)
const tool = (args, root, tl = TOOL) => {
  const env = Object.assign({}, process.env); delete env.GAME_ROOT; if (root) env.GAME_ROOT = root;
  const r = spawnSync(process.execPath, [tl, ...args], { encoding: 'utf8', env, cwd: REPO });
  return { st: r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const read = (f) => fs.readFileSync(f, 'utf8');
// (the test's own reckoning, not the tool's) a file's stamp; a page's links: every <script src> / <link href> outside comments
const stamp = (buf) => crypto.createHash('sha256').update(buf.toString('latin1').replace(/\r\n/g, '\n'), 'latin1').digest('hex').slice(0, 8);
const links = (html) => [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(script|link)\b[^>]*>/gi)].map(([tag, name]) => {
  const m = new RegExp(`\\b${name.toLowerCase() === 'script' ? 'src' : 'href'}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i').exec(tag);
  return m && { tag, url: m[1] != null ? m[1] : m[2] != null ? m[2] : m[3], manifest: /\brel\s*=\s*["']?manifest\b/i.test(tag) };
}).filter(Boolean);
const local = (u) => !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'apex-stamp-'));
try {
  // 1. the repository: every local link to an existing file, none with a stamp
  {
    const r = tool(['--check']);
    check('repo: node tools/stamp.js --check passes (every local link to an existing file, no stamp)', r.st === 0 && /^OK: all \d+ local links/m.test(r.out), r.out.trim().split('\n').slice(-4).join(' | '));
    const stamped = PAGES.flatMap(p => links(read(path.join(REPO, p))).filter(l => local(l.url) && /[?&]v=/.test(l.url)).map(l => p + ': ' + l.url));
    check('repo: no link in index.html or garaza.html carries ?v= (counted by the test itself)', !stamped.length, stamped.slice(0, 5).join(', '));
    const man = links(read(path.join(REPO, 'index.html'))).find(l => l.manifest);
    check('repo: the manifest is linked by its plain address', !!man && man.url === 'manifest.webmanifest', man && man.url);
  }

  // 2. the pages copied to a folder of their own (with js/, css/, icons/) and stamped as the publish step stamps them
  const site = path.join(tmp, 'site');
  fs.mkdirSync(site);
  for (const f of [...PAGES, 'manifest.webmanifest']) fs.copyFileSync(path.join(REPO, f), path.join(site, f));
  for (const d of ['js', 'css', 'icons']) fs.cpSync(path.join(REPO, d), path.join(site, d), { recursive: true });
  {
    const r = tool([], site), cnt = /^stamped (\d+) links .*\((\d+) changed\)/m.exec(r.out);
    check('copy: stamped (GAME_ROOT=<folder> node tools/stamp.js), every link changed', r.st === 0 && !!cnt && cnt[1] === cnt[2] && +cnt[1] > 100, r.out.trim());
    const wrong = [];
    let k = 0;
    for (const p of PAGES) {
      const before = links(read(path.join(REPO, p))), after = links(read(path.join(site, p)));
      if (before.length !== after.length) { wrong.push(p + ': ' + before.length + ' links before, ' + after.length + ' after'); continue; }
      before.forEach((b, i) => {
        const a = after[i].url;
        if (!local(b.url) || b.manifest) { if (a !== b.url) wrong.push(p + ': ' + b.url + ' changed to ' + a); return; }
        const [, file, query = '', hash = ''] = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(b.url), want = file + (query ? query + '&' : '?') + 'v=' + stamp(fs.readFileSync(path.join(site, file))) + hash;
        k++; if (a !== want) wrong.push(`${p}: ${a} (want ${want})`);
      });
    }
    check('copy: every local link of index.html and garaza.html carries its own file\'s stamp (?v=<sha256, 8 hex>); the manifest and outside links as they were', k > 100 && !wrong.length, `${k} links; ` + wrong.slice(0, 4).join(', '));
    const again = tool([], site);
    check('copy: stamping again changes nothing', again.st === 0 && /\(0 changed\)/.test(again.out), again.out.trim());
    const ok = tool(['--check-stamped'], site), no = tool(['--check'], site);
    check('copy: --check-stamped passes; --check fails on it (the stamps, with the advice --strip)', ok.st === 0 && /^OK: all \d+ links .* carry the current stamp/m.test(ok.out) && no.st === 1 && /a stamp \(v=[0-9a-f]{8}\)/.test(no.out) && /--strip/.test(no.out),
      ok.out.trim().split('\n').pop() + ' | ' + no.out.trim().split('\n').pop());

    // a file changes: its link's stamp is old until stamped again (only that link)
    fs.appendFileSync(path.join(site, 'js', 'sfx.js'), '\n// changed\n');
    const old = tool(['--check-stamped'], site);
    const re = tool([], site), sfx = 'js/sfx.js?v=' + stamp(fs.readFileSync(path.join(site, 'js', 'sfx.js')));
    check('copy: a changed js/sfx.js fails --check-stamped (old stamp); stamped again, only its links change and it passes', old.st === 1 && /js\/sfx\.js: old stamp [0-9a-f]{8} \(now [0-9a-f]{8}\)/.test(old.out) &&
      re.st === 0 && /\(2 changed\)/.test(re.out) && read(path.join(site, 'index.html')).includes('"' + sfx + '"') && read(path.join(site, 'garaza.html')).includes('"' + sfx + '"') && tool(['--check-stamped'], site).st === 0,
      old.out.trim().split('\n').pop() + ' | ' + re.out.trim());

    // --strip: the repository's pages again, byte for byte
    const s = tool(['--strip'], site);
    check('copy: --strip gives back the repository\'s index.html and garaza.html byte for byte; --check passes on it', s.st === 0 && PAGES.every(p => read(path.join(site, p)) === read(path.join(REPO, p))) && tool(['--check'], site).st === 0, s.out.trim());
  }

  // 3. the links' details, on a page of its own: quotes of every kind, other parameters and an anchor kept, the stamp where it was, a
  //    comment, outside addresses and the manifest left alone, a file with CRLF stamped as the same file with LF
  {
    const dir = path.join(tmp, 'page');
    for (const d of ['css', 'js', 'icons']) fs.mkdirSync(path.join(dir, d), { recursive: true });
    const put = (f, c) => fs.writeFileSync(path.join(dir, f), c);
    put('app.webmanifest', '{}'); put('css/a.css', 'body { margin: 0; }\n'); put('icons/i.png', 'png'); put('js/b.js', 'var b = 1;\n'); put('js/c.js', 'var c = 1;\r\nvar d = 2;\r\n');
    const h = (f) => stamp(fs.readFileSync(path.join(dir, f))), lf = stamp(Buffer.from('var c = 1;\nvar d = 2;\n'));
    const page = ['<!doctype html><html><head>',
      '<link rel="manifest" href="app.webmanifest">',
      "<link rel='stylesheet' href='css/a.css'>",
      '<link rel=icon href=icons/i.png?x=1#top>',
      '<script src="https://example.com/x.js"></script><script src="//cdn.example.com/y.js"></script><script src="data:text/javascript,1"></script>',
      '<!-- <script src="js/gone-in-a-comment.js"></script> -->',
      '<script src="js/b.js?a=1&v=deadbeef&c=2"></script>',
      '<script src="js/c.js"></script>', '</head><body></body></html>', ''].join('\n');
    put('index.html', page);
    const c0 = tool(['--check'], dir);
    check('page: --check finds the stamp (v=deadbeef) left on a link', c0.st === 1 && /js\/b\.js: a stamp \(v=deadbeef\)/.test(c0.out) && /^FAIL: 1 link/m.test(c0.out), c0.out.trim());
    const r = tool([], dir), out = read(path.join(dir, 'index.html'));
    const want = page.replace("href='css/a.css'", `href='css/a.css?v=${h('css/a.css')}'`).replace('href=icons/i.png?x=1#top', `href=icons/i.png?x=1&v=${h('icons/i.png')}#top`)
      .replace('js/b.js?a=1&v=deadbeef&c=2', `js/b.js?a=1&v=${h('js/b.js')}&c=2`).replace('src="js/c.js"', `src="js/c.js?v=${lf}"`);
    check('page: single quotes, no quotes, other parameters and the anchor kept, the old stamp replaced where it was; comment, outside links and manifest as they were; CRLF stamped as LF',
      r.st === 0 && out === want && h('js/c.js') === lf, out === want ? r.out.trim() : out.split('\n').filter((l, i) => l !== want.split('\n')[i]).join(' | '));
    const s = tool(['--strip'], dir), back = read(path.join(dir, 'index.html'));
    check('page: --strip takes the stamps off and keeps the rest (js/b.js?a=1&c=2, icons/i.png?x=1#top, css/a.css with no "?")',
      s.st === 0 && back === page.replace('?a=1&v=deadbeef&c=2', '?a=1&c=2') && tool(['--check'], dir).st === 0, back.split('\n').slice(2, 7).join(' | '));
    put('index.html', page.replace('<script src="js/c.js"></script>', '<script src="js/c.js"></script><script src="js/gone.js"></script>').replace('&v=deadbeef', ''));
    const m1 = tool(['--check'], dir), m2 = tool([], dir), m3 = tool(['--check-stamped'], dir);
    check('page: a link to a missing file fails --check, the stamping and --check-stamped', [m1, m2, m3].every(x => x.st === 1 && /missing file: index\.html: js\/gone\.js/.test(x.out)), [m1, m2, m3].map(x => x.out.trim().split('\n').pop()).join(' | '));
  }

  // 4. the tool never stamps the repository itself: not without GAME_ROOT, not with GAME_ROOT on it (a copy of the tool in a folder of its
  //    own, so that a broken guard could only stamp that folder); a wrong flag: the usage
  {
    const own = path.join(tmp, 'own');
    fs.mkdirSync(path.join(own, 'tools'), { recursive: true });
    fs.copyFileSync(TOOL, path.join(own, 'tools', 'stamp.js'));
    for (const f of PAGES) fs.copyFileSync(path.join(REPO, f), path.join(own, f));
    const a = tool([], null, path.join(own, 'tools', 'stamp.js')), b = tool([], own, path.join(own, 'tools', 'stamp.js'));
    check('the repository itself is never stamped (no GAME_ROOT, or GAME_ROOT on it): exit 2, the advice, the pages as they were',
      a.st === 2 && b.st === 2 && /--check/.test(a.out) && /GAME_ROOT=<folder>/.test(a.out) && PAGES.every(p => read(path.join(own, p)) === read(path.join(REPO, p))), a.out.trim() + ' | ' + b.out.trim());
    const u = tool(['--stamp']), v = tool(['--check', 'x']);
    check('a wrong flag or an extra argument: the usage, exit 2', u.st === 2 && v.st === 2 && /^usage:/.test(u.out), u.out.trim());
  }

  // 5. --find: the commit of a stamp of js/game.js (the version in an RRA-NAPAKE report or a recording of the published game)
  {
    const now = stamp(fs.readFileSync(path.join(REPO, 'js', 'game.js')));
    let head = null; try { head = stamp(execFileSync('git', ['show', 'HEAD:js/game.js'], { cwd: REPO, maxBuffer: 1 << 28 })); } catch (_) { }
    const a = tool(['--find', now]), b = head ? tool(['--find', head]) : null, z = tool(['--find', '0123abcd']), w = tool(['--find', 'nope']);
    check('--find: the stamp of js/game.js as it is here, and of HEAD\'s js/game.js: the commit it came in with; an unknown stamp: exit 1; not a stamp: exit 2',
      a.st === 0 && /js\/game\.js v=[0-9a-f]{8}: the file as it is here now/.test(a.out) && (!b || (b.st === 0 && /came in with/.test(b.out) && /^ {2}[0-9a-f]{9} \d{4}-\d\d-\d\d /m.test(b.out))) &&
      z.st === 1 && /not in the history here/.test(z.out) && w.st === 2, [a, b, z].filter(Boolean).map(x => x.out.trim().split('\n').slice(0, 2).join(' / ')).join(' | '));
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
