// A race's recording as a file (posnetek_<proga>_<LLLLMMDD-UUMM>.rrp, Orodje za napake · sklop 12 in docs/orodje-za-napake.md) opened for
// Claude: the game in a headless browser opens it (Napake.rrp.odpri, as Nastavitve orodja · Odpri posnetek), the tool's own scan runs on it,
// and what it holds is written out: the race (the track, the way, the weather, the game's version against the one here, the device, the
// date, the cars), the race's flags (where the player was), the tool's own flags (a car standing, a jump, under the road, the wrong way, the
// hitches; where that car was), the log of that race and the report's text; pictures of the replay at the times asked. In
// test-results/posnetki/<file's name>/ (or --out):
//   povzetek.json, povzetek.txt
//   <t>s-<ti|tekmecN>-<pokonci|lezece>.png       with --t (s or mm:ss.s, as in an RRA-NAPAKE report), --zastavice: at every flag
//   node tools/posnetek.mjs posnetek_bathurst_20261101-1432.rrp
//   node tools/posnetek.mjs posnetek.rrp --t 41.3,00:52.1 --avto 5 --kamera tv --pokonci
//   node tools/posnetek.mjs posnetek.rrp --zastavice
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame } from '../tests/browser/lib.mjs';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const SIZE = { lezece: { width: 640, height: 360 }, pokonci: { width: 360, height: 640 } };

const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; }, has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const tArg = flag('--t'), avto = flag('--avto'), kamera = flag('--kamera') || 'chase', outArg = flag('--out'), zast = has('--zastavice');
let orient = ['pokonci', 'lezece'].filter(o => has('--' + o)); if (!orient.length) orient = ['lezece'];
const files = args.filter(a => !a.startsWith('--')), bad = args.filter(a => a.startsWith('--'));
// a time: 41.3 (s) or 00:41.3 (mm:ss.s)
const sec = (s) => { const m = /^(\d+):(\d+(?:\.\d+)?)$/.exec(s); return m ? +m[1] * 60 + +m[2] : Number(s); };
const times = tArg ? tArg.split(',').map(sec) : [];
if (files.length !== 1 || bad.length || times.some(t => !(t >= 0)) || !['chase', 'tv'].includes(kamera) || (avto != null && !/^(ti|\d+)$/.test(avto))) {
  console.log('usage: node tools/posnetek.mjs <posnetek.rrp> [--t <s|mm:ss.s>[,…]] [--zastavice] [--avto ti|<k>] [--kamera chase|tv] [--pokonci] [--lezece] [--out <folder>]' + (bad.length ? '\nunknown: ' + bad.join(' ') : ''));
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
  const H = head.H, here = await page.evaluate(() => (/[?&]v=(\w+)/.exec(document.querySelector('script[src^="js/game.js"]').getAttribute('src')) || [])[1]);
  const ime = (k) => (H.cars[k] && H.cars[k].pl ? 'ti' : 'tekmec#' + k);
  const pk = Math.max(0, H.cars.findIndex(c => c.pl)), k = avto == null || avto === 'ti' ? pk : +avto;
  if (!(k >= 0 && k < H.n)) throw new Error('--avto: 0 to ' + (H.n - 1));
  const info = await page.evaluate(([fl, pk]) => ({
    flags: fl.map((f, j) => Object.assign({ n: j + 1, t: f.t }, Napake.rrp.kje(f.t, pk))),
    auto: Napake.samodejne.map(f => Object.assign({ kind: f.kind, t: f.t, k: f.k, opis: f.opis }, Napake.rrp.kje(f.t, f.k >= 0 ? f.k : pk))),
    report: Napake.porocilo()
  }), [H.flags || [], pk]);
  const sum = {
    datoteka: name,
    glava: { track: H.track, name: H.name, mode: H.mode, wx: H.wx, ver: H.ver, verTu: here, dev: H.dev, devIme: H.devIme, date: new Date(H.date).toISOString(), n: H.n, laps: H.laps, tt: !!H.tt,
      vzorci: head.nf, t0: +head.t0.toFixed(3), t1: +head.t1.toFixed(3), avti: H.cars.map((c, j) => ({ k: j, ime: ime(j), name: c.name, model: c.m, grid: c.grid })) },
    zastavice: info.flags.map(f => ({ n: f.n, t: +f.t.toFixed(3), lap: f.lap, s: f.s })),
    samodejne: info.auto.map(f => ({ kind: f.kind, t: +f.t.toFixed(3), avto: ime(f.k), opis: f.opis, lap: f.lap, s: f.s })),
    dnevnik: info.report.split('\n').filter(l => l.startsWith('D ')),
    porocilo: info.report, slike: []
  };
  // the pictures: at the times asked, with --zastavice at every flag (the race's, the tool's own: its car)
  const shots = times.map(t => ({ t, k }));
  if (zast) { for (const f of sum.zastavice) shots.push({ t: f.t, k }); for (const f of info.auto) shots.push({ t: f.t, k: f.k >= 0 ? f.k : pk }); }
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
  const G = sum.glava, txt = [
    `${name}: ${G.name} (${G.track}) · ${G.mode} · ${G.wx} · ${G.n} avtov · ${clock(G.t0)}–${clock(G.t1)} (${G.vzorci} vzorcev)`,
    `naprava ${G.devIme || G.dev} · ${G.date} · različica ${G.ver}` + (G.ver !== here ? ` (tu ${here}: git log -S 'game.js?v=${G.ver}' --oneline -- index.html)` : ' (ista kot tu)'),
    `zastavice med dirko: ${sum.zastavice.length}`, ...sum.zastavice.map(f => `  ⚑${f.n} ${clock(f.t)} K${f.lap} s=${f.s}m`),
    `samodejne zastavice: ${sum.samodejne.length}`, ...sum.samodejne.map(f => `  ${clock(f.t)} K${f.lap} s=${f.s}m ${f.kind} ${f.avto} »${f.opis}«`),
    `dnevnik: ${sum.dnevnik.length}`, ...sum.dnevnik.map(l => '  ' + l),
    `slike: ${sum.slike.length ? sum.slike.join(', ') : '(--t ali --zastavice)'}`, '', sum.porocilo
  ].join('\n');
  fs.writeFileSync(path.join(out, 'povzetek.json'), JSON.stringify(sum, null, 1));
  fs.writeFileSync(path.join(out, 'povzetek.txt'), txt + '\n');
  console.log(txt + '\n\n→ ' + path.relative(process.cwd(), out) + '/');
  if (errors.length) console.log('page errors: ' + errors.slice(0, 5).join(' | '));
} catch (e) {
  console.log(String(e && e.message || e)); code = 1;
}
await browser.close(); await srv.close();
process.exit(code);
