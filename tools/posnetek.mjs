// A race's recording as a file (posnetek_<proga>_<LLLLMMDD-UUMM>.rrp, Orodje za napake · sklop 12 in docs/orodje-za-napake.md) opened for
// Claude: the game in a headless browser opens it (Napake.rrp.odpri, as Nastavitve orodja · Odpri posnetek), the tool's own scan runs on it,
// and what it holds is written out: the race (the track, the way, the weather, the game's version against the one here (js/game.js's stamp,
// as the publish step would put it on the page: tools/stamp.js; another one's commit: node tools/stamp.js --find <stamp>), the device, the
// date, the cars), the race's flags (where the player was), the tool's own flags (a car standing, a jump, under the road, the wrong way, the
// hitches; where that car was), the falls over an edge (Padec čez rob: the samples in which a car fell as a body, js/game.js recFall: who,
// from when to when, where it went over, its hard knocks), the log of that race and the report's text; pictures of the replay at the times
// asked. In test-results/posnetki/<file's name>/ (or --out):
//   povzetek.json, povzetek.txt
//   <t>s-<ti|tekmecN>-<pokonci|lezece>.png       with --t (s or mm:ss.s, as in an RRA-NAPAKE report), --zastavice: at every flag and in the middle of every fall
//   node tools/posnetek.mjs posnetek_bathurst_20261101-1432.rrp
//   node tools/posnetek.mjs posnetek.rrp --t 41.3,00:52.1 --avto 5 --kamera tv --pokonci
//   node tools/posnetek.mjs posnetek.rrp --zastavice
//   node tools/posnetek.mjs posnetek.rrp --zatikanje [--korak 1]
// --zatikanje (gneča, 25. 11. 2026: the stutter measured from a recording): the hitches the device itself wrote down (the log's zatik: how long
// under 20 frames/s, where) and the replay walked every --korak seconds from the player's car: the draw calls and the vertices of a frame, the
// milliseconds of Render.frame's own work (here, not on the device: to compare moments, not devices), the smoke's live puffs. The heaviest
// moments and those over the budget (300 calls, 900 thousand vertices: tests/golden/perf.json's) first; all in zatikanje.txt, povzetek.json.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { createRequire } from 'node:module';
import { serve, launch, openGame } from '../tests/browser/lib.mjs';
const { stampOf } = createRequire(import.meta.url)('./stamp.js');

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const SIZE = { lezece: { width: 640, height: 360 }, pokonci: { width: 360, height: 640 } };

const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; }, has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const tArg = flag('--t'), avto = flag('--avto'), kamera = flag('--kamera') || 'chase', outArg = flag('--out'), zast = has('--zastavice'), korak = Math.max(0.05, +(flag('--korak') || 1) || 1), zatik = has('--zatikanje');
let orient = ['pokonci', 'lezece'].filter(o => has('--' + o)); if (!orient.length) orient = ['lezece'];
const files = args.filter(a => !a.startsWith('--')), bad = args.filter(a => a.startsWith('--'));
// a time: 41.3 (s) or 00:41.3 (mm:ss.s)
const sec = (s) => { const m = /^(\d+):(\d+(?:\.\d+)?)$/.exec(s); return m ? +m[1] * 60 + +m[2] : Number(s); };
const times = tArg ? tArg.split(',').map(sec) : [];
if (files.length !== 1 || bad.length || times.some(t => !(t >= 0)) || !['chase', 'tv'].includes(kamera) || (avto != null && !/^(ti|\d+)$/.test(avto))) {
  console.log('usage: node tools/posnetek.mjs <posnetek.rrp> [--t <s|mm:ss.s>[,…]] [--zastavice] [--zatikanje [--korak <s>]] [--avto ti|<k>] [--kamera chase|tv] [--pokonci] [--lezece] [--out <folder>]' + (bad.length ? '\nunknown: ' + bad.join(' ') : ''));
  process.exit(2);
}
const file = path.resolve(files[0]);
if (!fs.existsSync(file)) { console.log('no such file: ' + file); process.exit(2); }
const out = path.resolve(outArg || path.join(REPO, 'test-results', 'posnetki', path.basename(file).replace(/\.rrp$/i, '')));
fs.mkdirSync(out, { recursive: true });
const clock = (t) => { const u = Math.max(0, Math.round(t * 1000)), m = Math.floor(u / 60000); return String(m).padStart(2, '0') + ':' + ((u % 60000) / 1000).toFixed(3).padStart(6, '0'); };

const srv = await serve(REPO), browser = await launch();
let code = 0;
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase' }, SIZE[orient[0]]);
  await page.waitForFunction(() => window.__game.screen === 'title', null, { timeout: 180000, polling: 250 });
  const b64 = fs.readFileSync(file).toString('base64'), name = path.basename(file);
  // the header (read first: a file the game cannot open says why), then the file opened into its replay
  const head = await page.evaluate(async (b64) => {
    const blob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))]);
    try { const { H, frames } = await Napake.rrp.beri(blob); return { H, nf: frames.length, t0: frames[0][0], t1: frames[frames.length - 1][0] }; } catch (e) { return { why: e.message }; }
  }, b64);
  if (head.why) throw new Error('the file is not a recording the game can read: ' + head.why);
  const why = await page.evaluate(async ([b64, name]) => Napake.rrp.odpri(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))]), name), [b64, name]);
  if (why) throw new Error('the game did not open it: ' + why);
  await page.waitForFunction(() => window.__game.replay && window.__game.race, null, { timeout: 240000, polling: 250 });
  await page.waitForFunction(() => Napake.iskanje.done, null, { timeout: 180000, polling: 250 });
  const H = head.H, here = stampOf(path.join(REPO, 'js', 'game.js'));   // (the repository's page carries no stamps: its js/game.js's content stamp)
  const ime = (k) => (H.cars[k] && H.cars[k].pl ? 'ti' : 'tekmec#' + k);
  const pk = Math.max(0, H.cars.findIndex(c => c.pl)), k = avto == null || avto === 'ti' ? pk : +avto;
  if (!(k >= 0 && k < H.n)) throw new Error('--avto: 0 to ' + (H.n - 1));
  const info = await page.evaluate(([fl, pk]) => ({
    flags: fl.map((f, j) => Object.assign({ n: j + 1, t: f.t }, Napake.rrp.kje(f.t, pk))),
    auto: Napake.samodejne.map(f => Object.assign({ kind: f.kind, t: f.t, k: f.k, opis: f.opis }, Napake.rrp.kje(f.t, f.k >= 0 ? f.k : pk))),
    falls: window.__game.rpFalls().map(f => Object.assign(f, Napake.rrp.kje(f.t0, f.k))),   // (where it went over: the fall's first sample)
    report: Napake.porocilo()
  }), [H.flags || [], pk]);
  const sum = {
    datoteka: name,
    glava: { track: H.track, name: H.name, mode: H.mode, wx: H.wx, ver: H.ver, verTu: here, dev: H.dev, devIme: H.devIme, date: new Date(H.date).toISOString(), n: H.n, laps: H.laps, tt: !!H.tt,
      vzorci: head.nf, t0: +head.t0.toFixed(3), t1: +head.t1.toFixed(3), avti: H.cars.map((c, j) => ({ k: j, ime: ime(j), name: c.name, model: c.m, grid: c.grid })) },
    zastavice: info.flags.map(f => ({ n: f.n, t: +f.t.toFixed(3), lap: f.lap, s: f.s })),
    samodejne: info.auto.map(f => ({ kind: f.kind, t: +f.t.toFixed(3), avto: ime(f.k), opis: f.opis, lap: f.lap, s: f.s })),
    padci: info.falls.map(f => ({ t0: +f.t0.toFixed(3), t1: +f.t1.toFixed(3), avto: ime(f.k), udarci: f.n, lap: f.lap, s: f.s })),
    dnevnik: info.report.split('\n').filter(l => l.startsWith('D ')),
    porocilo: info.report, slike: []
  };
  // the pictures: at the times asked, with --zastavice at every flag (the race's, the tool's own: its car) and in the middle of every fall (its car)
  const shots = times.map(t => ({ t, k }));
  if (zast) { for (const f of sum.zastavice) shots.push({ t: f.t, k }); for (const f of info.auto) shots.push({ t: f.t, k: f.k >= 0 ? f.k : pk }); for (const f of info.falls) shots.push({ t: (f.t0 + f.t1) / 2, k: f.k }); }
  for (const o of shots.length ? orient : []) {
    await page.setViewportSize(SIZE[o]); await page.waitForTimeout(300);
    for (const s of shots) {
      // (the camera settled behind the car as in the game after 2 s there: frames drawn at 1/20 s, the replay standing)
      const img = await page.evaluate(async ([t, k, cam]) => { Napake.rrp.pojdi(t, k, cam); await new Promise(r => requestAnimationFrame(r)); const c = window.__game.race.cars[k];
        for (let i = 0; i < 40; i++) Render.frame(0.05, 1, c, cam, { noFx: true }); return Napake.rrp.slika(1280); }, [s.t, s.k, kamera]);
      if (!img) continue;
      const f = s.t.toFixed(1) + 's-' + ime(s.k).replace('#', '') + '-' + o + '.png';
      fs.writeFileSync(path.join(out, f), Buffer.from(img.split(',')[1], 'base64')); sum.slike.push(f);
    }
  }
  // --zatikanje: the replay walked from the player's car (the camera as in the race), a frame measured every --korak seconds
  if (zatik) {
    await page.setViewportSize(SIZE[orient[0]]); await page.waitForTimeout(300);
    await page.evaluate(() => {
      window.__gl = { calls: 0, verts: 0 };
      const cv = document.querySelector('canvas'), gl = cv.getContext('webgl2') || cv.getContext('webgl'), P = Object.getPrototypeOf(gl);
      const wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
      wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
    });
    const rows = [];
    for (let t = head.t0; t <= head.t1 + 1e-6; t += korak) {
      rows.push(await page.evaluate(async ([t, k]) => {
        Napake.rrp.pojdi(t, k, 'chase'); await new Promise(r => requestAnimationFrame(r)); const c = window.__game.race.cars[k], G = window.__gl;
        for (let i = 0; i < 8; i++) Render.frame(0.05, 1, c, 'chase', {});   // (the camera settled, the smoke of the last 0.4 s in the air)
        const c0 = G.calls, v0 = G.verts, t0 = performance.now(); Render.frame(1 / 60, 1, c, 'chase', {}); const ms = performance.now() - t0, fx = Render.fxStats(), w = Napake.rrp.kje(t, k) || {};
        return { t: +t.toFixed(2), lap: w.lap, s: w.s, calls: G.calls - c0, kverts: Math.round((G.verts - v0) / 1000), ms: +ms.toFixed(1), puffs: fx.alive, fill: fx.fill };
      }, [t, pk]));
    }
    const med = (a) => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; }, mMs = med(rows.map(r => r.ms));
    for (const r of rows) r.nad = [r.calls > 300 ? 'klici' : '', r.kverts > 900 ? 'oglišča' : '', r.ms > 2 * mMs && r.ms > 8 ? 'čas' : ''].filter(Boolean).join('+');
    const line = (r) => `  ${clock(r.t)} K${r.lap} s=${r.s}m  klici ${r.calls}  oglišča ${r.kverts}k  ${r.ms} ms  dim ${r.puffs} (${r.fill} zaslona)${r.nad ? '  NAD: ' + r.nad : ''}`;
    const naprava = sum.samodejne.filter(f => f.kind === 'zatik'), top = rows.slice().sort((a, b) => b.calls / 300 + b.kverts / 900 + b.ms / (4 * mMs) - (a.calls / 300 + a.kverts / 900 + a.ms / (4 * mMs))).slice(0, 8);
    sum.zatikanje = { korak, okno: orient[0], naprava, mediana: { calls: med(rows.map(r => r.calls)), kverts: med(rows.map(r => r.kverts)), ms: mMs }, najvec: { calls: Math.max(...rows.map(r => r.calls)), kverts: Math.max(...rows.map(r => r.kverts)), ms: Math.max(...rows.map(r => r.ms)) }, nad: rows.filter(r => r.nad).length, vzorci: rows };
    const Z = sum.zatikanje;
    sum.zatikanjeTxt = [
      `zatikanje: ${name} · ${sum.glava.n} avtov · vsakih ${korak} s od ${clock(head.t0)} do ${clock(head.t1)} (${rows.length} trenutkov, pogled za igralčevim avtom, ${SIZE[orient[0]].width}x${SIZE[orient[0]].height}, kakovost visoka)`,
      `na napravi zapisani zatiki (pod 20 sličic/s): ${naprava.length}`, ...naprava.map(f => `  ${clock(f.t)} K${f.lap} s=${f.s}m »${f.opis}«`),
      `mediana: klici ${Z.mediana.calls}, oglišča ${Z.mediana.kverts}k, ${Z.mediana.ms} ms · največ: klici ${Z.najvec.calls}, oglišča ${Z.najvec.kverts}k, ${Z.najvec.ms} ms · nad mejo (300 klicev, 900k oglišč, 2x mediana časa): ${Z.nad} od ${rows.length}`,
      'najtežji trenutki:', ...top.map(line), 'vsi trenutki:', ...rows.map(line)].join('\n');
    fs.writeFileSync(path.join(out, 'zatikanje.txt'), sum.zatikanjeTxt + '\n');
  }
  const G = sum.glava, txt = [
    `${name}: ${G.name} (${G.track}) · ${G.mode} · ${G.wx} · ${G.n} avtov · ${clock(G.t0)}–${clock(G.t1)} (${G.vzorci} vzorcev)`,
    `naprava ${G.devIme || G.dev} · ${G.date} · različica ${G.ver}` + (G.ver === here ? ' (ista kot tu)' : /^[0-9a-f]{8}$/.test(G.ver) ? ` (tu ${here}; commit: node tools/stamp.js --find ${G.ver})` : ` (tu ${here}; posnetek iz igre brez žigov, npr. lokalne)`),
    `zastavice med dirko: ${sum.zastavice.length}`, ...sum.zastavice.map(f => `  ⚑${f.n} ${clock(f.t)} K${f.lap} s=${f.s}m`),
    `samodejne zastavice: ${sum.samodejne.length}`, ...sum.samodejne.map(f => `  ${clock(f.t)} K${f.lap} s=${f.s}m ${f.kind} ${f.avto} »${f.opis}«`),
    `padci čez rob: ${sum.padci.length}`, ...sum.padci.map(f => `  ${clock(f.t0)}–${clock(f.t1)} K${f.lap} s=${f.s}m padec ${f.avto} »pada ${(f.t1 - f.t0).toFixed(1).replace('.', ',')} s, trdih udarcev: ${f.udarci}«`),
    `dnevnik: ${sum.dnevnik.length}`, ...sum.dnevnik.map(l => '  ' + l),
    `slike: ${sum.slike.length ? sum.slike.join(', ') : '(--t ali --zastavice)'}`, '', sum.porocilo
  ].concat(sum.zatikanjeTxt ? ['', sum.zatikanjeTxt.split('vsi trenutki:')[0].trimEnd(), '  (vsi trenutki: zatikanje.txt)'] : []).join('\n');
  delete sum.zatikanjeTxt;
  fs.writeFileSync(path.join(out, 'povzetek.json'), JSON.stringify(sum, null, 1));
  fs.writeFileSync(path.join(out, 'povzetek.txt'), txt + '\n');
  console.log(txt + '\n\n→ ' + path.relative(process.cwd(), out) + '/');
  if (errors.length) console.log('page errors: ' + errors.slice(0, 5).join(' | '));
} catch (e) {
  console.log(String(e && e.message || e)); code = 1;
}
await browser.close(); await srv.close();
process.exit(code);
