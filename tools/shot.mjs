// Screenshots of a track from a given place, for comparing before and after a change (sklop 14 in docs/orodje-za-napake.md). Through the
// quick entry (index.html?proga=<id>&t=…, tests/README.md) the race is opened, the player's car put on the ideal line at --m metres after
// the start (the s of an RRA-NAPAKE report), the other cars hidden, and the chase camera's view (no HUD, as the phone sees the road) saved
// as small pictures, upright (360 x 640) and on its side (640 x 360). In test-results/shots/ (or --out):
//   <id>-<m>m-<pokonci|lezece>.png                       one version (the working tree, or --root / GAME_ROOT)
//   …-pred.png, …-po.png, …-primerjava.png               with --pred <ref|folder>: the same place in the other version (a git ref such as
//                                                        main or HEAD^1, taken out with git archive; or a folder with a copy of the game),
//                                                        side by side with the changed pixels marked (pred | po | razlika)
//   povzetek.md, povzetek.json                           what was taken, and with --pred how much of each picture changed
//   node tools/shot.mjs bathurst --m 1284 --pokonci --lezece
//   node tools/shot.mjs bathurst spa --m 400,1284 --pred main          (main against the working tree)
//   node tools/shot.mjs vrsic --t 30 --vreme dez                        (the race on the autopilot to 30 s, the car where it got to, the field shown)
//   node tools/shot.mjs --nabor --pred HEAD^1                           (the set the workflow uses: NABOR and the real tracks the change touches)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { serve, launch, openGame } from '../tests/browser/lib.mjs';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
// the set for the pull requests' workflow (.github/workflows/posnetki.yml): real tracks, a few places each (metres after the start)
const NABOR = { bathurst: [250, 1284], spa: [600], vrsic: [1500] };
const SIZE = { lezece: { width: 640, height: 360 }, pokonci: { width: 360, height: 640 } };
const CHANGED = 0.5;   // (a picture counts as changed from this share of changed pixels, %: below it a sky's drift or a flag's wave)

const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; }, has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const mArg = flag('--m'), tArg = flag('--t'), vreme = flag('--vreme'), pred = flag('--pred'), out = path.resolve(flag('--out') || path.join(REPO, 'test-results', 'shots'));
const root = path.resolve(flag('--root') || process.env.GAME_ROOT || REPO), nabor = has('--nabor'), nizka = has('--nizka');   // (--nizka: the graphics detail NIZKA, as perf.test.mjs measures the phone's load)
let orient = ['pokonci', 'lezece'].filter(o => has('--' + o)); if (!orient.length) orient = ['pokonci', 'lezece'];
const ids = args.filter(a => !a.startsWith('--')), bad = args.filter(a => a.startsWith('--'));
if ((!ids.length && !nabor) || bad.length || (vreme && !/^(suho|dez|dež)$/.test(vreme))) {
  console.log('usage: node tools/shot.mjs <id …> [--m 1284[,400…]] [--t <s>] [--pokonci] [--lezece] [--vreme suho|dez] [--nizka] [--pred <ref|folder>] [--root <folder>] [--out <folder>]\n' +
    '       node tools/shot.mjs --nabor [--pred <ref|folder>]' + (bad.length ? '\nunknown: ' + bad.join(' ') : ''));
  process.exit(2);
}
const ms = mArg ? mArg.split(',').map(Number) : null, t = tArg != null ? Number(tArg) : null;
if ((ms && ms.some(m => !(m >= 0))) || (t != null && !(t >= 0 && t <= 3600))) { console.log('--m: metres (0 or more), --t: seconds (0-3600)'); process.exit(2); }

const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8' }).trim();
// the other version: a folder as it is, else a git ref taken out (only what the game needs) into test-results/shots/_pred-<commit>/ (kept: the
// next run with the same commit uses it again)
function predRoot(p) {
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return { root: path.resolve(p), sha: null };
  const sha = git('rev-parse', '--verify', p + '^{commit}'), dir = path.join(REPO, 'test-results', 'shots', '_pred-' + sha.slice(0, 10));
  if (!fs.existsSync(path.join(dir, 'index.html'))) {
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const list = git('ls-tree', '--name-only', sha).split('\n').filter(n => ['index.html', 'sw.js', 'manifest.webmanifest', 'js', 'css', 'assets', 'fonts', 'icons'].includes(n));
    execFileSync('bash', ['-c', 'set -o pipefail; git archive "$1" -- "${@:2}" | tar -x -C "$0"', dir, sha, ...list], { cwd: REPO, stdio: ['ignore', 'inherit', 'inherit'] });
  }
  return { root: dir, sha };
}

// the real tracks (not test: true) whose own files a change touches: js/tracks/<id>.js, js/world-<id>.js
function touched(ref) {
  let files = [];
  try { files = git('diff', '--name-only', ref).split('\n'); } catch (e) { console.log('(no diff against ' + ref + ': ' + e.message.split('\n')[0] + ')'); }
  const out = new Set();
  for (const f of files) {
    const m = /^js\/(?:tracks\/([a-z0-9]+)\.js|world-([a-z0-9]+)\.js)$/.exec(f); if (!m) continue;
    const id = m[1] || m[2], file = path.join(REPO, 'js', 'tracks', id + '.js');
    if (fs.existsSync(file) && !/\btest:\s*true\b/.test(fs.readFileSync(file, 'utf8').slice(0, 4000))) out.add(id);
  }
  return [...out];
}

const png = (file, dataUrl) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64')); };

// the jobs: [track, places] (null places: --t only, or the race's own spot at the default 3 s)
let jobs = ids.map(id => [id, ms]);
if (nabor) {
  const extra = pred ? touched(pred).filter(id => !NABOR[id] && !ids.includes(id)).slice(0, 3) : [];
  jobs = jobs.concat(Object.entries(NABOR).filter(([id]) => !ids.includes(id)).map(([id, p]) => [id, p]), extra.map(id => [id, 'thirds']));
  if (extra.length) console.log('tracks the change touches: ' + extra.join(', '));
}

// one version of the game: every job, every place, every orientation; the pictures as data addresses, { key: { src, info } }
async function takeAll(browser, gameRoot, tag) {
  const srv = await serve(gameRoot), shots = {}, problems = [];
  try {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', Object.assign({ quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer' }, nizka ? { quality: 'normal', detail: 'low' } : {}), SIZE[orient[0]], { seed: 11 });
    for (const [id, places] of jobs) {
      const q = new URLSearchParams({ proga: id, t: String(t != null ? t : places ? 0.5 : 3) }); if (vreme) q.set('vreme', vreme);
      const n0 = errors.length;
      await page.goto(srv.base + '/index.html?' + q);
      await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
      const st = await page.evaluate((id) => { const g = window.__game; return { bad: g.quick.q.bad, race: !!(g.race && g.race.track.def.id === id), test: !!(Core.TRACKS.find(d => d.id === id) || {}).test }; }, id);
      if (st.bad.length || !st.race) { problems.push(`${tag}: ${id}: no race (${st.bad.join(', ') || 'the quick entry did not start one'})`); continue; }
      if (st.test) console.log(`(${id} is a test track: CLAUDE.md asks for a real one for pictures before / after)`);
      let list = places;
      if (places === 'thirds') list = await page.evaluate(() => { const T = window.__game.race.track, L = T.open ? T.raceLen : T.len; return [Math.round(L / 3), Math.round(L * 2 / 3)]; });
      for (const m of list || [null]) for (const o of orient) {
        await page.setViewportSize(SIZE[o]);
        const r = await page.evaluate(async ([m, side]) => {
          const g = window.__game, R = g.race, T = R.track, P = R.player, raf = () => new Promise(r => requestAnimationFrame(r));
          g.pause(); Render.resize();
          let at = null;
          if (m != null) {   // the car on the ideal line at m metres after the start (an open road: up to its finish), everything else held still
            const s = T.open ? Math.min(T.startS + m, T.finishS - 1) : T.startS + m, i = T.idx(((s % T.len) + T.len) % T.len), off = T.rl ? T.rl[i] : 0;
            const still = (sec) => { for (let k = 0; k < sec * 120; k++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; R.step(1 / 120); } };
            P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = T.hy[i];
            P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0;
            still(0.5);   // (the car settles on its wheels where it stands: its height, pitch and the road under it)
            at = Math.round((((P.q.s - T.startS) % T.len) + T.len) % T.len);
          }
          Render.resetCam(); for (let k = 0; k < 6; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }   // (the camera behind the car at once, the world's near pieces there)
          const hid = m != null ? R.cars.filter(c => c !== P).map(c => Render.viewOf(c)).filter(v => v && v.grp.visible) : [];
          for (const v of hid) v.grp.visible = false;
          const c = Render.snapshot(P, 'chase', Math.max(side.width, side.height));
          for (const v of hid) v.grp.visible = true;
          const k = document.createElement('canvas'); k.width = side.width; k.height = side.height; k.getContext('2d').drawImage(c, 0, 0, k.width, k.height);
          return { src: k.toDataURL('image/png'), at, s: Math.round((((P.q.s - T.startS) % T.len) + T.len) % T.len), name: T.def.name || T.def.id, ver: g.ver };
        }, [m, SIZE[o]]);
        const key = `${id}-${m != null ? m + 'm' : 't' + (t != null ? t : 3) + 's'}-${o}`;
        shots[key] = { src: r.src, info: { id, name: r.name, m, s: r.s, o, ver: r.ver } };
      }
      if (errors.length > n0) problems.push(...errors.slice(n0, n0 + 5).map(e => `${tag}: ${id}: ${e}`));
    }
    await ctx.close();
  } finally { await srv.close(); }
  return { shots, problems };
}

// the comparison: pred | po | razlika (po faded to grey, the changed pixels magenta) and the share of changed pixels
function compare(page, a, b, label) {
  return page.evaluate(async ({ a, b, label }) => {
    const load = (src) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
    const A = await load(a), B = await load(b), w = B.width, h = B.height, px = (im) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h); return x.getImageData(0, 0, w, h); };
    const da = px(A), db = px(B), dd = new ImageData(w, h); let n = 0;
    for (let i = 0; i < da.data.length; i += 4) {
      const d = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2]));
      if (d > 24) { n++; dd.data[i] = 255; dd.data[i + 1] = 0; dd.data[i + 2] = 200; } else { const gr = (db.data[i] + db.data[i + 1] + db.data[i + 2]) / 3 * 0.45; dd.data[i] = dd.data[i + 1] = dd.data[i + 2] = gr; }
      dd.data[i + 3] = 255;
    }
    const gap = 8, top = 22, c = document.createElement('canvas'); c.width = w * 3 + gap * 2; c.height = h + top;
    const x = c.getContext('2d'); x.fillStyle = '#0d1117'; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(A, 0, top, w, h); x.drawImage(B, w + gap, top, w, h); x.putImageData(dd, (w + gap) * 2, top);
    const pct = n / (w * h) * 100;
    x.fillStyle = '#e8eef4'; x.font = 'bold 12px sans-serif';
    x.fillText('pred', 4, 15); x.fillText('po', w + gap + 4, 15); x.fillText('razlika ' + pct.toFixed(2) + ' %', (w + gap) * 2 + 4, 15);
    x.fillStyle = '#9fb3c8'; x.font = '11px sans-serif'; const tw = x.measureText(label).width; x.fillText(label, Math.max(60, c.width - tw - 6), 15);
    return { src: c.toDataURL('image/png'), pct };
  }, { a, b, label });
}

const browser = await launch();
let failed = false;
try {
  fs.mkdirSync(out, { recursive: true });
  const P = pred ? predRoot(pred) : null;
  if (P) console.log(`pred: ${pred}${P.sha ? ' (' + P.sha.slice(0, 10) + ')' : ''} → ${path.relative(REPO, P.root) || '.'}; po: ${path.relative(REPO, root) || 'the working tree'}`);
  const po = await takeAll(browser, root, 'po'), before = P ? await takeAll(browser, P.root, 'pred') : null;
  const rows = [], blank = await browser.newPage();
  for (const [key, S] of Object.entries(po.shots)) {
    const I = S.info, row = { key, track: I.id, name: I.name, m: I.m, s: I.s, o: I.o, ver: I.ver };
    if (!before) { png(path.join(out, key + '.png'), S.src); row.file = key + '.png'; rows.push(row); continue; }
    png(path.join(out, key + '-po.png'), S.src);
    const B = before.shots[key];
    if (!B) { row.pct = null; row.file = key + '-po.png'; rows.push(row); continue; }
    png(path.join(out, key + '-pred.png'), B.src);
    const C = await compare(blank, B.src, S.src, `${I.name} · s=${I.s} m · ${I.o === 'pokonci' ? 'pokonci' : 'ležeče'}`);
    png(path.join(out, key + '-primerjava.png'), C.src);
    Object.assign(row, { pct: +C.pct.toFixed(2), file: key + '-primerjava.png', verPred: B.info.ver }); rows.push(row);
  }
  await blank.close();
  const problems = po.problems.concat(before ? before.problems : []);
  failed = po.problems.length > 0;
  // the summary: a table (for a pull request's job summary too) and the same as JSON
  const md = ['### Posnetki ' + (before ? 'pred/po' : 'proge'), ''];
  if (before) md.push(`Pred: \`${pred}\`${P.sha ? ' (' + P.sha.slice(0, 10) + ')' : ''} · po: ${root === REPO ? 'ta veja' : '`' + path.relative(REPO, root) + '`'}. Spremenjeno: več kot ${CHANGED} % pikslov (razlika barve nad 24).`, '');
  md.push(before ? '| Proga | s | Pogled | Razlika | Slika |' : '| Proga | s | Pogled | Slika |', before ? '|---|---|---|---|---|' : '|---|---|---|---|');
  for (const r of rows) {
    const pogled = r.o === 'pokonci' ? 'pokonci' : 'ležeče';
    md.push(before ? `| ${r.name} | ${r.s} m | ${pogled} | ${r.pct == null ? 'ni pred' : (r.pct > CHANGED ? '**' + r.pct + ' %**' : r.pct + ' %')} | \`${r.file}\` |` : `| ${r.name} | ${r.s} m | ${pogled} | \`${r.file}\` |`);
  }
  if (before) { const ch = rows.filter(r => r.pct != null && r.pct > CHANGED); md.push('', ch.length ? `Spremenjenih slik: ${ch.length} od ${rows.length}.` : `Nobena slika se ni opazno spremenila (${rows.length}).`); }
  if (problems.length) md.push('', 'Težave:', ...problems.map(p => '- ' + p.replace(/\|/g, '\\|')));
  fs.writeFileSync(path.join(out, 'povzetek.md'), md.join('\n') + '\n');
  fs.writeFileSync(path.join(out, 'povzetek.json'), JSON.stringify({ pred: pred || null, predSha: P && P.sha, rows, problems }, null, 1) + '\n');
  console.log(md.join('\n'));
  console.log('\nwrote ' + (path.relative(REPO, out) || '.') + '/ (' + rows.length + ' pictures, povzetek.md)');
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
