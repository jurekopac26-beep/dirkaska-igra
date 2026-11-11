// The site's previews without a second copy of the heavy videos (tools/predogled-posnetki.js, tools/predogled.mjs, js/menu.js vidSrc;
// .github/workflows/stran.yml). The menu's videos (assets/maps/: fly-, corner-, heli-<id>.webm) are ~93 MB of a tree, and the site holds main
// and up to three previews in 1 GB: a preview keeps no copy of a video that is the same file as main's, and its menu plays main's own.
// 1. the menu: every video's address goes through vidSrc, which reads MENU.mainVideos (the list the tool writes); the repository's own
//    js/menu-data.js carries no such list (main plays its own files)
// 2. shareVideos on trees in a temp folder: the same files taken out and listed, the pull request's own (changed, new) and everything that
//    is not such a video kept, main untouched; a second run, an older menu, a tree with a part missing, a folder not under the site, a link
//    in the tree: nothing taken, nothing written
// 3. the whole build in a repository of its own (an origin with two pull requests' heads, node tools/predogled.mjs <site> --prs <list>):
//    main with all its videos, the preview with the new menu without main's, its page stamped with the list in (the workflow's
//    --check-stamped passes), the preview with an older menu as it was; under a short limit the lighter preview still goes in
//   node tests/predogled.test.js
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { shareVideos, VIDEO, KNOWS } = require('../tools/predogled-posnetki.js');

const REPO = path.resolve(__dirname, '..');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const put = (f, data) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
const has = (f) => fs.existsSync(f);
const ls = (d) => fs.readdirSync(d).sort().join(' ');
// the list a preview's js/menu-data.js ends with, as the menu reads it
const listOf = (file) => { const w = { MENU: null }; vm.runInNewContext(fs.readFileSync(file, 'utf8'), { window: w }); return w.MENU && w.MENU.mainVideos; };

// 1. the menu
const menu = fs.readFileSync(path.join(REPO, 'js', 'menu.js'), 'utf8'), data = fs.readFileSync(path.join(REPO, 'js', 'menu-data.js'), 'utf8');
const def = (menu.match(/^\s*const vidSrc = .*$/m) || [''])[0];
{
  // (.webm' in the code: a video's name in a string; the comments name them as <id>.webm)
  const plain = (menu.match(/\.webm['"`]/g) || []).length, through = (menu.match(/vidSrc\('(?:fly|corner|heli)-' \+ t\.id \+ '\.webm'\)/g) || []).length;
  check('js/menu.js: the flyover, the corner\'s video and the helicopter\'s flight take their address from vidSrc, no video beside them',
    through === 3 && plain === 3 && ['fly', 'corner', 'heli'].every(k => menu.includes(`vidSrc('${k}-' + t.id + '.webm')`)), `${through} through vidSrc of ${plain} names of a video`);
  check('js/menu.js knows the list (' + KNOWS + '), the repository\'s js/menu-data.js carries none', menu.includes(KNOWS) && !data.includes(KNOWS));
  // nowhere else in the game: a video's address built past vidSrc would be missing only in a preview (the recording's own file name is
  // no address: '.mp4' : '.webm' in js/game.js)
  const walk = (d) => fs.readdirSync(path.join(REPO, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(d + '/' + e.name) : /\.(js|css)$/.test(e.name) ? [d + '/' + e.name] : []);
  // (the pages and sw.js by the names the site publishes: GAME in tools/predogled.mjs)
  const game = JSON.parse((/const GAME\s*=\s*(\[[^\]]*\])/.exec(fs.readFileSync(path.join(REPO, 'tools', 'predogled.mjs'), 'utf8')) || [0, '[]'])[1].replace(/'/g, '"'));
  const pages = game.filter(f => /\.(html|js)$/.test(f));
  const code = [...walk('js'), ...walk('css'), ...pages], past = [];
  for (const f of code) {
    const t = fs.readFileSync(path.join(REPO, f), 'utf8').replace(/vidSrc\('(?:fly|corner|heli)-' \+ t\.id \+ '\.webm'\)/g, '').replace(/'\.mp4' : '\.webm'/g, '');
    if (/\.webm['"`]/.test(t)) past.push(f);
  }
  check('no other file of the game names a video (js/, css/, sw.js, the pages)', past.length === 0 && code.length > 50 && pages.includes('index.html') && pages.includes('sw.js'), past.join(', ') || code.length + ' files, ' + pages.join(' '));
  let src = null;
  try { src = (D) => vm.runInNewContext(def + '\nvidSrc', { D }); src({}); } catch (e) { src = null; }
  const V = { root: '../../', files: ['fly-a.webm', 'heli-a.webm'] };
  check('vidSrc: the game\'s own file without a list, main\'s for a listed file, the preview\'s own for any other',
    !!src && src({})('fly-a.webm') === 'assets/maps/fly-a.webm' && src({ mainVideos: V })('fly-a.webm') === '../../assets/maps/fly-a.webm' &&
    src({ mainVideos: V })('heli-a.webm') === '../../assets/maps/heli-a.webm' && src({ mainVideos: V })('corner-a.webm') === 'assets/maps/corner-a.webm' &&
    src({ mainVideos: {} })('fly-a.webm') === 'assets/maps/fly-a.webm', def.trim().slice(0, 80));
  check('the videos\' names: fly-, corner-, heli-<id>.webm and nothing else',
    ['fly-pikes.webm', 'corner-nring.webm', 'heli-spa.webm', 'fly-great_alpine-2.webm'].every(f => VIDEO.test(f)) &&
    ['fly-a.webp', 'heli-a.json', 'top-a.webm', 'fly-a b.webm', 'fly-a.webm.txt', 'Fly-a.webm', 'fly-.webm', '../fly-a.webm', 'fly-a/b.webm'].every(f => !VIDEO.test(f)));
}

// 2. shareVideos on trees in a temp folder
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'predogled-'));
const MENU_NEW = '// the menu\n' + def + '\n', MENU_OLD = '// the menu of a branch from before the list\n', DATA = 'window.MENU = { tracks: [] };\nwindow.MENU.lens = {};';
const A = Buffer.alloc(3000, 1), B = Buffer.alloc(2000, 2), B2 = Buffer.alloc(2000, 3), C = Buffer.alloc(1500, 4), H = Buffer.alloc(4000, 5), N = Buffer.alloc(700, 6);
// a tree: main's (the site's root) or a preview's
const tree = (dir, o = {}) => {
  put(path.join(dir, 'index.html'), '<!doctype html>\n<script src="js/menu-data.js"></script>\n<script src="js/menu.js"></script>\n');
  put(path.join(dir, 'js', 'menu.js'), o.menu || MENU_NEW);
  put(path.join(dir, 'js', 'menu-data.js'), DATA);
  const m = path.join(dir, 'assets', 'maps');
  put(path.join(m, 'fly-a.webm'), A); put(path.join(m, 'fly-b.webm'), o.b || B); put(path.join(m, 'corner-a.webm'), C); put(path.join(m, 'heli-a.webm'), H);
  put(path.join(m, 'fly-a.webp'), 'poster'); put(path.join(m, 'heli-a.json'), '{}'); put(path.join(m, 'top-a.webp'), 'map');
  for (const [f, buf] of Object.entries(o.more || {})) put(path.join(m, f), buf);
  return dir;
};
try {
  const site = tree(path.join(tmp, 'site')), mainMaps = path.join(site, 'assets', 'maps'), before = ls(mainMaps);
  {
    // (fly-b changed with the same size, fly-n new, top-a.webm not a video of the list)
    const dir = tree(path.join(site, 'beta', '7'), { b: B2, more: { 'fly-n.webm': N, 'top-a.webm': A } }), m = path.join(dir, 'assets', 'maps');
    const r = shareVideos(site, dir), V = listOf(path.join(dir, 'js', 'menu-data.js'));
    check('the same videos as main\'s are taken out of the preview and counted', r.files.join(' ') === 'corner-a.webm fly-a.webm heli-a.webm' && r.bytes === A.length + C.length + H.length &&
      !has(path.join(m, 'fly-a.webm')) && !has(path.join(m, 'corner-a.webm')) && !has(path.join(m, 'heli-a.webm')), r.files.join(' ') + ', ' + r.bytes + ' B');
    check('a changed video, a new one, the posters and every other file stay in the preview', ls(m) === 'fly-a.webp fly-b.webm fly-n.webm heli-a.json top-a.webm top-a.webp' &&
      fs.readFileSync(path.join(m, 'fly-b.webm')).equals(B2), ls(m));
    check('the preview\'s js/menu-data.js: as it was, then the list with the way to the site\'s root', fs.readFileSync(path.join(dir, 'js', 'menu-data.js'), 'utf8').startsWith(DATA + '\n') &&
      !!V && V.root === '../../' && V.files.join(' ') === r.files.join(' '), JSON.stringify(V));
    check('main keeps every file', ls(mainMaps) === before && fs.readFileSync(path.join(mainMaps, 'fly-a.webm')).equals(A), ls(mainMaps));
    // the menu of the preview, with the list the tool wrote: main's file where the preview has none, its own where it has one
    const src = vm.runInNewContext(def + '\nvidSrc', { D: { mainVideos: V } }), at = (f) => path.join(dir, src(f));
    check('every video the preview\'s menu asks for is on the site', ['fly-a.webm', 'fly-b.webm', 'fly-n.webm', 'corner-a.webm', 'heli-a.webm'].every(f => has(at(f))) &&
      path.resolve(at('fly-a.webm')) === path.join(mainMaps, 'fly-a.webm') && path.resolve(at('fly-b.webm')) === path.join(m, 'fly-b.webm'));
    const text = fs.readFileSync(path.join(dir, 'js', 'menu-data.js'), 'utf8'), again = shareVideos(site, dir);
    check('a second run changes nothing', again.files.length === 0 && again.bytes === 0 && fs.readFileSync(path.join(dir, 'js', 'menu-data.js'), 'utf8') === text && ls(mainMaps) === before);
  }
  const untouched = (dir, name, o) => {
    const full = ls(path.join(dir, 'assets', 'maps')), text = fs.readFileSync(path.join(dir, 'js', 'menu-data.js'), 'utf8');
    const r = shareVideos(o && o.root || site, dir);
    check(name, r.files.length === 0 && r.bytes === 0 && ls(path.join(dir, 'assets', 'maps')) === full && fs.readFileSync(path.join(dir, 'js', 'menu-data.js'), 'utf8') === text &&
      ls(mainMaps) === before, ls(path.join(dir, 'assets', 'maps')));
  };
  untouched(tree(path.join(site, 'beta', '8'), { menu: MENU_OLD }), 'a preview whose menu does not read the list keeps every video');
  untouched(tree(path.join(site, 'beta', '9'), { b: B2, more: { 'fly-a.webm': Buffer.alloc(3000, 9), 'corner-a.webm': N, 'heli-a.webm': N } }), 'a preview with every video its own keeps them, and gets no list');
  untouched(tree(path.join(tmp, 'other')), 'a folder that is not under the site: nothing taken');
  {
    const bare = tree(path.join(tmp, 'bare')); fs.rmSync(path.join(bare, 'assets', 'maps'), { recursive: true });   // (main with no videos at all)
    const dir = tree(path.join(bare, 'beta', '10')), r = shareVideos(bare, dir);
    check('a site whose main has no videos: the preview keeps its own, and gets no list', r.files.length === 0 && ls(path.join(dir, 'assets', 'maps')) === before && !listOf(path.join(dir, 'js', 'menu-data.js')), ls(path.join(dir, 'assets', 'maps')));
  }
  {
    const dir = tree(path.join(site, 'beta', '11')); fs.rmSync(path.join(dir, 'js', 'menu-data.js'));
    const r = shareVideos(site, dir);
    check('a preview without js/menu-data.js keeps every video (no place for the list)', r.files.length === 0 && has(path.join(dir, 'assets', 'maps', 'fly-a.webm')) && !has(path.join(dir, 'js', 'menu-data.js')));
  }
  // links in a pull request's tree: nothing is deleted or written through one
  let links = true;
  try { fs.symlinkSync(mainMaps, path.join(tmp, 'probe')); } catch (e) { links = false; }
  if (!links) console.log('     (no symbolic links here: the checks with a link in the tree are skipped)');
  else {
    const d12 = tree(path.join(site, 'beta', '12'));
    fs.rmSync(path.join(d12, 'assets', 'maps'), { recursive: true }); fs.symlinkSync(mainMaps, path.join(d12, 'assets', 'maps'));
    const r12 = shareVideos(site, d12);
    check('a preview whose assets/maps is a link to main\'s: nothing deleted through it', r12.files.length === 0 && ls(mainMaps) === before && !listOf(path.join(d12, 'js', 'menu-data.js')), ls(mainMaps));
    const d13 = tree(path.join(site, 'beta', '13')), out = path.join(tmp, 'outside.js');
    put(out, DATA); fs.rmSync(path.join(d13, 'js', 'menu-data.js')); fs.symlinkSync(out, path.join(d13, 'js', 'menu-data.js'));
    const r13 = shareVideos(site, d13);
    check('a preview whose js/menu-data.js is a link: nothing written through it, every video kept', r13.files.length === 0 && fs.readFileSync(out, 'utf8') === DATA && has(path.join(d13, 'assets', 'maps', 'fly-a.webm')));
    const d14 = tree(path.join(site, 'beta', '14')), v = path.join(d14, 'assets', 'maps', 'fly-a.webm');
    fs.rmSync(v); fs.symlinkSync(path.join(mainMaps, 'fly-a.webm'), v);
    const r14 = shareVideos(site, d14);
    check('a video that is a link stays as it is, the plain files beside it are shared', r14.files.join(' ') === 'corner-a.webm fly-b.webm heli-a.webm' && fs.lstatSync(v).isSymbolicLink() && ls(mainMaps) === before, r14.files.join(' '));
  }
} catch (e) { check('the trees in a temp folder', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); }

// 3. the whole build: a repository of its own, its origin with the pull requests' heads
const repo = path.join(tmp, 'repo'), origin = path.join(tmp, 'origin.git');
// (without the caller's GIT_* and GAME_ROOT: from a git hook GIT_DIR would point git at the real repository)
const ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/.test(k) && k !== 'GAME_ROOT'));
const git = (...a) => {
  const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', '-c', 'protocol.file.allow=always', ...a], { cwd: repo, encoding: 'utf8', env: ENV });
  if (r.status !== 0) throw new Error(`git ${a.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
};
const build = (...more) => {
  const r = spawnSync(process.execPath, [path.join(repo, 'tools', 'predogled.mjs'), path.join(repo, '_site'), '--prs', path.join(tmp, 'prs.json'), ...more], { cwd: repo, encoding: 'utf8', env: ENV });
  return { st: r.status, out: String(r.stdout) + String(r.stderr) };
};
try {
  const BIG = Buffer.alloc(1500000);   // (a video heavy enough for the short limit below)
  for (let i = 0; i < BIG.length; i++) BIG[i] = (i * 2654435761 >>> 13) & 255;
  fs.mkdirSync(repo, { recursive: true });
  spawnSync('git', ['init', '-q', '--bare', origin], { encoding: 'utf8', env: ENV });
  git('init', '-q'); git('checkout', '-q', '-b', 'main');
  tree(repo, { more: { 'fly-a.webm': BIG } });
  for (const f of ['predogled.mjs', 'predogled-posnetki.js', 'stamp.js']) put(path.join(repo, 'tools', f), fs.readFileSync(path.join(REPO, 'tools', f)));
  put(path.join(repo, 'maketa-menija', 'x.txt'), 'the mockup');
  put(path.join(repo, '.gitignore'), '_site/\n');
  git('add', '-A'); git('commit', '-q', '-m', 'main');
  git('remote', 'add', 'origin', 'file://' + origin); git('push', '-q', 'origin', 'main');
  // #7: the new menu; a corner's video changed, a flyover added, the rest as on main. #8: a branch from before the list (the older menu)
  git('checkout', '-q', '-b', 'pr7');
  put(path.join(repo, 'assets', 'maps', 'corner-a.webm'), N); put(path.join(repo, 'assets', 'maps', 'fly-n.webm'), N);
  git('add', '-A'); git('commit', '-q', '-m', 'seven'); git('push', '-q', 'origin', 'pr7:refs/pull/7/head');
  const sha7 = git('rev-parse', 'HEAD');
  git('checkout', '-q', '-b', 'pr8', 'main');
  put(path.join(repo, 'js', 'menu.js'), MENU_OLD);
  git('add', '-A'); git('commit', '-q', '-m', 'eight'); git('push', '-q', 'origin', 'pr8:refs/pull/8/head');
  const sha8 = git('rev-parse', 'HEAD');
  git('checkout', '-q', 'main');
  const pr = (number, headRefName, headRefOid, updatedAt) => ({ number, title: 'Pull request ' + number, headRefName, headRefOid, isCrossRepository: false, updatedAt, labels: [] });
  put(path.join(tmp, 'prs.json'), JSON.stringify([pr(7, 'pr7', sha7, '2026-11-10T02:00:00Z'), pr(8, 'pr8', sha8, '2026-11-10T01:00:00Z')]));

  const r = build(), S = path.join(repo, '_site'), m = (k) => path.join(S, k, 'assets', 'maps');
  const line = (k) => (r.out.split('\n').find(l => l.startsWith('#' + k)) || '').trim();
  check('the site builds with both previews', r.st === 0 && has(path.join(S, 'beta', '7', 'index.html')) && has(path.join(S, 'beta', '8', 'index.html')) && !has(path.join(S, 'maketa-menija')), r.out.trim().split('\n').slice(-2).join(' | '));
  check('main in the root keeps all its videos', ls(m('.')) === 'corner-a.webm fly-a.webm fly-a.webp fly-b.webm heli-a.json heli-a.webm top-a.webp' && fs.readFileSync(path.join(m('.'), 'fly-a.webm')).equals(BIG), ls(m('.')));
  const V = has(path.join(S, 'beta', '7', 'js', 'menu-data.js')) ? listOf(path.join(S, 'beta', '7', 'js', 'menu-data.js')) : null;
  check('the preview with the new menu: main\'s videos out, its own (changed, new) in, the list in js/menu-data.js', ls(m('beta/7')) === 'corner-a.webm fly-a.webp fly-n.webm heli-a.json top-a.webp' &&
    !!V && V.root === '../../' && V.files.join(' ') === 'fly-a.webm fly-b.webm heli-a.webm', ls(m('beta/7')) + ' | ' + JSON.stringify(V));
  check('the log says how many videos play from main and how much lighter the preview is', /^#7 pr7 \(.{7}\) → beta\/7\/ \(stamped, 0\.0 MB; 3 video\(s\) played from main, 1\.4 MB less\)$/.test(line(7)), line(7));
  const page = has(path.join(S, 'beta', '7', 'index.html')) ? fs.readFileSync(path.join(S, 'beta', '7', 'index.html'), 'utf8') : '';
  const chk = spawnSync(process.execPath, [path.join(repo, 'tools', 'stamp.js'), '--check-stamped'], { cwd: repo, encoding: 'utf8', env: Object.assign({}, ENV, { GAME_ROOT: path.join(S, 'beta', '7') }) });
  check('the preview\'s page is stamped with the list in (the workflow\'s --check-stamped passes)', /js\/menu-data\.js\?v=[0-9a-f]{8}"/.test(page) && chk.status === 0, String(chk.stdout).trim().split('\n').slice(-1)[0]);
  check('the preview with an older menu is as its branch has it: every video, no list', ls(m('beta/8')) === ls(m('.')) && fs.readFileSync(path.join(S, 'beta', '8', 'js', 'menu-data.js'), 'utf8') === DATA &&
    /^#8 pr8 \(.{7}\) → beta\/8\/ \(stamped, 1\.4 MB\)$/.test(line(8)), line(8));

  // a short limit: main (1.5 MB) and the preview without main's videos fit, the one that carries them does not
  const s = build('--limit', '2'), sl = (k) => (s.out.split('\n').find(l => l.startsWith('#' + k)) || '').trim();
  check('under a short limit the preview without main\'s videos still goes in, the heavy one is left out', s.st === 0 && has(path.join(S, 'beta', '7', 'index.html')) && !has(path.join(S, 'beta', '8')) &&
    /^#8: left out, 1\.4 MB/.test(sl(8)), sl(7) + ' | ' + sl(8));
} catch (e) { check('the build in a repository of its own', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); }
finally { fs.rmSync(tmp, { recursive: true, force: true }); }

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
