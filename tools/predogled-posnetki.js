// The site's previews without a second copy of the heavy videos (tools/predogled.mjs; tests/predogled.test.js).
// The menu's videos (assets/maps/: the flyovers fly-<id>.webm, the corners' videos corner-<id>.webm, the helicopter's flights before a race
// heli-<id>.webm) are ~93 MB of a tree's ~210 MB, and the site holds main and up to three previews in 1 GB. A preview keeps no copy of a video
// that is the same file as main's: its menu plays main's own from the site's root (js/menu.js vidSrc: MENU.mainVideos, written here at the
// end of the preview's js/menu-data.js). A video the pull request adds or changes stays in its preview and plays from there. A preview whose
// menu does not know the list yet (its branch is older than this) keeps all its videos, so nothing in it is ever missing.
'use strict';
const fs = require('fs'), path = require('path');

const VIDEO = /^(?:fly|corner|heli)-[A-Za-z0-9_-]+\.webm$/;
const KNOWS = 'mainVideos';   // (what a menu that reads the list has in its code)

// root: the site's folder with main in it; dir: a preview's folder under it. Returns the files taken out of dir and their bytes.
function shareVideos(root, dir) {
  const menu = path.join(dir, 'js', 'menu.js'), data = path.join(dir, 'js', 'menu-data.js'), maps = path.join(dir, 'assets', 'maps');
  const none = { files: [], bytes: 0 };
  // a plain file, a plain folder at its own place in the preview: a link in a pull request's tree (to main's folder, out of the site) is
  // never written to and nothing is ever deleted through it
  const own = (p, kind) => { try { return fs.lstatSync(p)[kind]() && fs.realpathSync(p) === path.join(fs.realpathSync(dir), path.relative(dir, p)); } catch (e) { return false; } };
  if (!own(menu, 'isFile') || !own(data, 'isFile') || !own(maps, 'isDirectory')) return none;
  if (!fs.readFileSync(menu, 'utf8').includes(KNOWS) || fs.readFileSync(data, 'utf8').includes(KNOWS)) return none;   // (or shared already)
  const up = path.relative(dir, root).split(path.sep).join('/');
  if (!up || !/^(?:\.\.\/)*\.\.$/.test(up)) return none;   // (only a folder under the root: the way up from it)
  const same = [];
  for (const f of fs.readdirSync(maps).filter(f => VIDEO.test(f)).sort()) {
    const a = path.join(root, 'assets', 'maps', f), b = path.join(maps, f);
    let sa, sb;
    try { sa = fs.lstatSync(a); sb = fs.lstatSync(b); } catch (e) { continue; }   // (main has no such video: the pull request's own)
    if (!sa.isFile() || !sb.isFile() || sa.size !== sb.size || (sa.dev === sb.dev && sa.ino === sb.ino)) continue;   // (one file under two names: never deleted)
    if (fs.readFileSync(a).equals(fs.readFileSync(b))) same.push(f);
  }
  if (!same.length) return none;
  // the list first, then the files: a preview is never left without both
  fs.appendFileSync(data, '\nwindow.MENU.mainVideos = ' + JSON.stringify({ root: up + '/', files: same }) + ';\n');
  let bytes = 0;
  for (const f of same) { const b = path.join(maps, f); bytes += fs.statSync(b).size; fs.rmSync(b); }
  return { files: same, bytes };
}

module.exports = { shareVideos, VIDEO, KNOWS };
