// The preview before main (predogled, sklop 14 in docs/orodje-za-napake.md): the site for GitHub Pages, built by .github/workflows/stran.yml.
// main in the site's root (the whole tree, as Pages served it from the branch, but ROOT_OUT), and each open pull request from this repository
// (the newest MAX, by their last change; those labelled »predogled« first, whatever came after them) in beta/<number>/: only what the game needs (index.html, sw.js, js, css, assets …). beta/index.html
// lists them. Pull requests from forks are left out (their files would go out under this site's address). Each tree (main, each preview) is
// stamped from its own files (?v=… on its pages' links, tools/stamp.js: the repository's pages carry none). A preview that cannot be stamped
// complete (a link to a missing file) is left out; main that cannot be stops the build, and the site stays as it was. A preview that would
// take the whole site over LIMIT is left out too (in that order: the ones after it still go in if they fit); the log gives each tree's size.
//   node tools/predogled.mjs <site folder>                (the pull requests from gh pr list: GH_TOKEN, GITHUB_REPOSITORY)
//   node tools/predogled.mjs <site folder> --prs <file>   (the list as gh pr list --json number,title,headRefName,headRefOid,isCrossRepository,updatedAt,labels gives it)
//   … --limit <MB>                                        (another limit than LIMIT, e.g. to see a preview left out on a short list)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const MAX = 3;   // (each preview ~200 MB, mostly assets/; main in the root ~210 MB)
// MB for the whole site (main and the previews; MB: 2^20 bytes): GitHub Pages publishes a site up to 1 GB, the rest is room for the archive's own
// overhead (9. 11. 2026: 3 previews and main with maketa-menija/ made an artifact of ~940 MB, with the 22 new tracks of #569 it would be ~1.2 GB)
const LIMIT = 950;
// left out of the root: maketa-menija/ is the standalone mockup of the menu and its picture tools (~107 MB, mostly pictures in its assets/):
// the menu is in the game (js/menu.js, css/menu.css), and nothing on the site links to the mockup (it is opened from a local server, its README)
const ROOT_OUT = ['maketa-menija'];
const GAME =['index.html', 'garaza.html', 'temni-nacin.html', 'sw.js', 'manifest.webmanifest', 'js', 'css', 'assets', 'fonts', 'icons'];   // (garaza.html: the garage, opened from the game's car screen; temni-nacin.html: the colours in a browser that darkens by force)

const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const prsFile = flag('--prs'), limit = Number(flag('--limit') || LIMIT) * 2 ** 20, site = args[0] && path.resolve(args[0]);
if (!site || args.length !== 1 || !(limit > 0)) { console.log('usage: node tools/predogled.mjs <site folder> [--prs <file>] [--limit <MB>]'); process.exit(2); }

const run = (cmd, a, o = {}) => execFileSync(cmd, a, Object.assign({ cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26 }, o));
// a commit's files into a folder: those under the top-level names that keep(name) keeps
function unpack(rev, dir, keep) {
  fs.mkdirSync(dir, { recursive: true });
  const list = run('git', ['ls-tree', '--name-only', rev]).split('\n').filter(n => n && keep(n));
  if (!list.length) throw new Error('nothing to unpack in ' + rev);   // (git archive with no names would give the whole tree)
  run('bash', ['-c', 'set -o pipefail; git archive "$1" -- "${@:2}" | tar -x -C "$0"', dir, rev, ...list], { stdio: ['ignore', 'inherit', 'inherit'] });
}
// a folder's size in bytes (its files, all the way down), and in MB for the log and beta/index.html
const size = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((s, e) =>
  s + (e.isDirectory() ? size(path.join(dir, e.name)) : e.isFile() ? fs.statSync(path.join(dir, e.name)).size : 0), 0);
const mb = (n) => (n / 2 ** 20).toFixed(1) + ' MB';
// a tree's links stamped from its own files (main's tools/stamp.js: a pull request's own code never runs here); throws if a link has no file
const STAMP = path.join(REPO, 'tools', 'stamp.js');
function stamp(dir) {
  const r = spawnSync(process.execPath, [STAMP], { cwd: REPO, env: Object.assign({}, process.env, { GAME_ROOT: dir }), encoding: 'utf8' });
  if (r.status !== 0) throw new Error('stamps: ' + String(r.stdout || r.stderr || 'exit ' + r.status).trim().split('\n').slice(0, 3).join('; '));
}
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// the open pull requests: gh pr list gives the newest opened, up to --limit, so with more than 50 open a labelled one opened before them
// fell out before the sort below (9. 11. 2026: 60 open, #305 and #261 out); those labelled »predogled« come by a list of their own, however old
const gh = (more) => JSON.parse(run('gh', ['pr', 'list', '--repo', process.env.GITHUB_REPOSITORY, '--state', 'open', ...more, '--json', 'number,title,headRefName,headRefOid,isCrossRepository,updatedAt,labels']));
const all = prsFile ? JSON.parse(fs.readFileSync(prsFile, 'utf8'))
  : [...new Map(gh(['--label', 'predogled', '--limit', '200']).concat(gh(['--limit', '50'])).map(p => [p.number, p])).values()];
// (labelled »predogled«: kept however many newer ones there are (odločitev uporabnika 2. 11. 2026); then the newest)
const pin = (p) => (p.labels || []).some(l => (l && l.name || l) === 'predogled');
const prs = all.filter(p => !p.isCrossRepository).sort((a, b) => (pin(b) - pin(a)) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
const shown = prs.slice(0, MAX), left = prs.slice(MAX);

fs.rmSync(site, { recursive: true, force: true });
unpack('HEAD', site, (n) => !ROOT_OUT.includes(n));
stamp(site);
const root = size(site);
let total = root;
console.log('main (' + run('git', ['rev-parse', '--short', 'HEAD']).trim() + ') → ' + path.relative(REPO, site) + '/ (stamped, ' + mb(root) + ', without ' + ROOT_OUT.join('/, ') + '/)');
const built = [], failed = [], big = [];
for (const p of shown) {
  const dir = path.join(site, 'beta', String(p.number));
  try {
    run('git', ['fetch', '--quiet', '--depth=1', 'origin', `pull/${p.number}/head`], { stdio: ['ignore', 'inherit', 'inherit'] });
    const sha = run('git', ['rev-parse', 'FETCH_HEAD']).trim();
    unpack(sha, dir, (n) => GAME.includes(n));
    const bytes = size(dir);
    if (total + bytes > limit) {
      fs.rmSync(dir, { recursive: true, force: true }); big.push(Object.assign({ bytes }, p));
      console.log(`#${p.number}: left out, ${mb(bytes)} (the site would be ${mb(total + bytes)}, over ${mb(limit)})`);
      continue;
    }
    stamp(dir);
    total += bytes;
    built.push(Object.assign({ sha, bytes }, p));
    console.log(`#${p.number} ${p.headRefName} (${sha.slice(0, 7)}) → beta/${p.number}/ (stamped, ${mb(bytes)})`);
  } catch (e) {
    fs.rmSync(dir, { recursive: true, force: true }); failed.push(p);
    console.log(`#${p.number}: not built (${String(e.message).split('\n')[0]})`);
  }
}

// beta/index.html: the previews, newest first (a plain page, light and dark like the phone's setting)
const when = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const sl = (n) => mb(n).replace('.', ',');   // (the page is in Slovenian: 206,2 MB)
const items = built.map(p => `<li><a href="${p.number}/"><b>#${p.number}</b> ${esc(p.title)}</a><small>${esc(p.headRefName)} · ${p.sha.slice(0, 7)} · spremenjeno ${esc(String(p.updatedAt).replace('T', ' ').slice(0, 16))} · ${sl(p.bytes)}</small></li>`).join('\n');
const html = `<!doctype html>
<html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Predogled vej</title>
<style>
:root { color-scheme: light dark; --bg: #f4f6f8; --fg: #16202a; --mut: #5a6b7b; --card: #fff; --line: #d8dee4; --a: #0b62c4; }
@media (prefers-color-scheme: dark) { :root { --bg: #0d1117; --fg: #e8eef4; --mut: #9fb3c8; --card: #161b22; --line: #2a333d; --a: #5aa9ff; } }
body { margin: 0; padding: 16px; background: var(--bg); color: var(--fg); font: 16px/1.45 system-ui, sans-serif; }
main { max-width: 640px; margin: 0 auto; } h1 { font-size: 22px; margin: 4px 0 8px; } p { color: var(--mut); margin: 6px 0 14px; }
ul { list-style: none; padding: 0; margin: 0; } li { background: var(--card); border: 1px solid var(--line); border-radius: 10px; margin: 0 0 10px; }
li a { display: block; padding: 12px 14px 2px; color: var(--a); text-decoration: none; } li small { display: block; padding: 0 14px 12px; color: var(--mut); }
</style></head>
<body><main>
<h1>Predogled vej</h1>
<p>Odprti pull requesti, kot bodo v igri po združitvi v <code>main</code>. Igra brez predogleda: <a href="../">glavna stran</a>. Predogled si deli shranjene nastavitve in napredek z glavno igro (isti naslov strani).</p>
${built.length ? '<ul>\n' + items + '\n</ul>' : prs.length ? '<p>Zdaj ni predogleda.</p>' : '<p>Zdaj ni odprtega pull requesta.</p>'}
${left.length ? `<p>Brez predogleda (največ ${MAX} najnovejši): ${left.map(p => '#' + p.number).join(', ')}.</p>` : ''}
${big.length ? `<p>Brez predogleda zaradi velikosti strani (GitHub Pages objavi do 1 GB, meja ${sl(limit)}; stran ima ${sl(total)}): ${big.map(p => `#${p.number} (${sl(p.bytes)})`).join(', ')}.</p>` : ''}
${failed.length ? `<p>Predogled ni zgrajen (napaka pri gradnji, npr. povezava na manjkajočo datoteko): ${failed.map(p => '#' + p.number).join(', ')}.</p>` : ''}
<p><small>Zgrajeno ${when}.</small></p>
</main></body></html>
`;
fs.mkdirSync(path.join(site, 'beta'), { recursive: true });
fs.writeFileSync(path.join(site, 'beta', 'index.html'), html);
console.log('beta/index.html: ' + built.length + ' preview(s)' + (left.length ? ', without one: ' + left.map(p => '#' + p.number).join(', ') : '') + (big.length ? ', left out for size: ' + big.map(p => '#' + p.number).join(', ') : '') + (failed.length ? ', not built: ' + failed.map(p => '#' + p.number).join(', ') : ''));
console.log('site: ' + mb(total) + ' (main ' + mb(root) + built.map(p => ' + #' + p.number + ' ' + mb(p.bytes)).join('') + '), limit ' + mb(limit));
