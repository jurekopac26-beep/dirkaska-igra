// The preview before main (predogled, sklop 14 in docs/orodje-za-napake.md): the site for GitHub Pages, built by .github/workflows/stran.yml.
// main as it is in the site's root (the whole tree, as Pages served it from the branch), and each open pull request from this repository
// (the newest MAX, by their last change) in beta/<number>/: only what the game needs (index.html, sw.js, js, css, assets …). beta/index.html
// lists them. Pull requests from forks are left out (their files would go out under this site's address).
//   node tools/predogled.mjs <site folder>                (the pull requests from gh pr list: GH_TOKEN, GITHUB_REPOSITORY)
//   node tools/predogled.mjs <site folder> --prs <file>   (the list as gh pr list --json number,title,headRefName,headRefOid,isCrossRepository,updatedAt gives it)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const MAX = 3;   // (each preview ~125 MB, mostly assets/maps; with main's ~235 MB the site stays well under Pages' 1 GB)
const GAME = ['index.html', 'garaza.html', 'temni-nacin.html', 'sw.js', 'manifest.webmanifest', 'js', 'css', 'assets', 'fonts', 'icons'];   // (garaza.html: the garage, opened from the game's car screen; temni-nacin.html: the colours in a browser that darkens by force)

const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const prsFile = flag('--prs'), site = args[0] && path.resolve(args[0]);
if (!site || args.length !== 1) { console.log('usage: node tools/predogled.mjs <site folder> [--prs <file>]'); process.exit(2); }

const run = (cmd, a, o = {}) => execFileSync(cmd, a, Object.assign({ cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26 }, o));
// a commit's files (all of them, or only the listed top-level names) into a folder
function unpack(rev, dir, names) {
  fs.mkdirSync(dir, { recursive: true });
  const list = names ? run('git', ['ls-tree', '--name-only', rev]).split('\n').filter(n => names.includes(n)) : [];
  run('bash', ['-c', 'set -o pipefail; git archive "$1" -- "${@:2}" | tar -x -C "$0"', dir, rev, ...list], { stdio: ['ignore', 'inherit', 'inherit'] });
}
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const all = JSON.parse(prsFile ? fs.readFileSync(prsFile, 'utf8')
  : run('gh', ['pr', 'list', '--repo', process.env.GITHUB_REPOSITORY, '--state', 'open', '--limit', '50', '--json', 'number,title,headRefName,headRefOid,isCrossRepository,updatedAt']));
const prs = all.filter(p => !p.isCrossRepository).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
const shown = prs.slice(0, MAX), left = prs.slice(MAX);

fs.rmSync(site, { recursive: true, force: true });
unpack('HEAD', site, null);
console.log('main (' + run('git', ['rev-parse', '--short', 'HEAD']).trim() + ') → ' + path.relative(REPO, site) + '/');
const built = [];
for (const p of shown) {
  try {
    run('git', ['fetch', '--quiet', '--depth=1', 'origin', `pull/${p.number}/head`], { stdio: ['ignore', 'inherit', 'inherit'] });
    const sha = run('git', ['rev-parse', 'FETCH_HEAD']).trim();
    unpack(sha, path.join(site, 'beta', String(p.number)), GAME);
    built.push(Object.assign({ sha }, p));
    console.log(`#${p.number} ${p.headRefName} (${sha.slice(0, 7)}) → beta/${p.number}/`);
  } catch (e) { console.log(`#${p.number}: not built (${String(e.message).split('\n')[0]})`); }
}

// beta/index.html: the previews, newest first (a plain page, light and dark like the phone's setting)
const when = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const items = built.map(p => `<li><a href="${p.number}/"><b>#${p.number}</b> ${esc(p.title)}</a><small>${esc(p.headRefName)} · ${p.sha.slice(0, 7)} · spremenjeno ${esc(String(p.updatedAt).replace('T', ' ').slice(0, 16))}</small></li>`).join('\n');
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
${built.length ? '<ul>\n' + items + '\n</ul>' : '<p>Zdaj ni odprtega pull requesta.</p>'}
${left.length ? `<p>Brez predogleda (največ ${MAX} najnovejši): ${left.map(p => '#' + p.number).join(', ')}.</p>` : ''}
<p><small>Zgrajeno ${when}.</small></p>
</main></body></html>
`;
fs.mkdirSync(path.join(site, 'beta'), { recursive: true });
fs.writeFileSync(path.join(site, 'beta', 'index.html'), html);
console.log('beta/index.html: ' + built.length + ' preview(s)' + (left.length ? ', without one: ' + left.map(p => '#' + p.number).join(', ') : ''));
